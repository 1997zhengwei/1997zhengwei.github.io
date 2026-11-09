import test from 'node:test';
import assert from 'node:assert/strict';
import {FrontierWorld,newProfile,normalizeProfile,combatEvolution,stats,XP,WEAPONS,BOUNDS,dist} from './starpath-rules.mjs';

function setup(weapon='pulse',level=45,arrived=true,rank=3){
  const w=new FrontierWorld(),profile=newProfile('pilot','Saved Pilot');
  Object.assign(profile,{xp:XP[level-1],metal:431,crystal:257,homeBase:arrived?2:1,cleared:[0,1,2,3,4,5],visited:[0,3,7,11],weapon});
  Object.assign(profile.aurora,{arrived,radar:arrived,escort:arrived,guardian:arrived,escortCheckpoint:arrived?3:0});
  profile.weapons[weapon]=rank;
  const p=w.enter(profile);Object.assign(p,{x:0,z:-32,oxygen:1000,hp:1000});w.spawnTimers.fill(Infinity);w.effects=[];
  return {w,p,s:stats(profile)};
}
function enemy(w,x,z,type='scout',hp=10000){
  const e={id:w.uid++,x,z,homeX:x,homeZ:z,zone:0,type,hp,maxHp:hp,speed:0,damage:7,cd:99,specialCd:99,slow:0,event:null,station:null,contributors:{},readyAt:0};
  w.enemies.push(e);return e;
}
function evolveFor(w,seconds,dt=.05){
  const end=w.time+seconds;
  while(w.time<end-1e-9){w.time=Math.min(end,w.time+dt);w.updateEvolution()}
}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} must equal ${b}`);
function beam(phaseLevel=45){
  const {w,p,s}=setup('rail',phaseLevel),a=enemy(w,0,-37,'shield'),b=enemy(w,0,-41,'shield');
  a.faceX=b.faceX=0;a.faceZ=b.faceZ=p.z;
  w.fireWeapon(p,s);assert.ok(p.charge);close(a.hp,a.maxHp);
  w.time=.6;w.fireWeapon(p,s);assert.equal(p.charge,null);assert.equal(w.beams.length,1);
  return {w,p,s,a,b};
}

test('three weapon phases derive from the existing arrival and exact 31/36/41 boundaries without changing a save',()=>{
  for(const [level,phase]of [[1,0],[30,0],[31,1],[35,1],[36,2],[40,2],[41,3],[45,3]]){
    const {p}=setup('pulse',level),before=JSON.stringify(p.profile);
    assert.equal(combatEvolution(p.profile),phase);assert.equal(JSON.stringify(p.profile),before);
    p.profile.aurora.arrived=false;assert.equal(combatEvolution(p.profile),0);
  }
  const {p}=setup('arc'),saved=structuredClone(p.profile);Object.assign(saved.modules,{armor:8,oxygen:7});Object.assign(saved.weapons,{pulse:5,scatter:4,rail:5,arc:5});
  const normalized=normalizeProfile(saved,saved.id);
  for(const key of ['xp','metal','crystal','modules','weapons','weapon','suit','skin','homeBase','aurora','cleared','visited','tutorial','records','unlocks','created'])assert.deepEqual(normalized[key],saved[key]);
  assert.equal(combatEvolution(normalized),3);
});

test('levels 1–30 retain their four original weapon behaviors even when the arrival flag is present',()=>{
  for(const weapon of Object.keys(WEAPONS)){
    const {w,p,s}=setup(weapon,30,true),foes=[enemy(w,0,-36),enemy(w,-1,-36),enemy(w,1,-36)];
    w.fireWeapon(p,s);
    if(weapon==='rail'){assert.ok(p.charge);w.time=.61;w.fireWeapon(p,s)}
    assert.ok(foes.some(e=>e.hp<e.maxHp));assert.ok(w.effects.some(e=>e.type==='shot'));
    assert.equal(w.effects.some(e=>e.type.startsWith('evo')),false);assert.equal(w.beams.length+w.orbs.length,0);
    if(weapon==='scatter')assert.equal(w.effects.filter(e=>e.type==='shot').length,5);
    if(weapon==='pulse')assert.ok(p.burst);
  }
  const {w,p,s}=setup('arc',45,false);enemy(w,0,-36);w.fireWeapon(p,s);assert.equal(w.orbs.length,0);assert.ok(w.effects.some(e=>e.type==='shot'));
});

test('large Pulse bolts split into two or three other targets once, without recursive fragments or duplicate kill attribution',()=>{
  for(const [level,count]of [[31,2],[36,2],[41,3]]){
    const {w,p,s}=setup('pulse',level,true,1),a=enemy(w,0,-35,'scout',1),others=[enemy(w,-1,-36,'scout',1),enemy(w,1,-36,'scout',1),enemy(w,2,-36,'scout',1),enemy(w,3,-36,'scout',1)];
    w.fireWeapon(p,s);
    const primary=w.effects.filter(e=>e.type==='evoPulse'),fragments=w.effects.filter(e=>e.type==='evoFragment');
    assert.equal(primary.length,1);assert.equal(fragments.length,count);assert.equal(primary[0].target,a.id);
    assert.equal(new Set(fragments.map(e=>e.target)).size,count);assert.ok(fragments.every(e=>e.target!==a.id&&e.sx===a.x&&e.sz===a.z));
    assert.equal(others.filter(e=>e.hp<=0).length,count);assert.equal(p.profile.records.kills,1+count);
    assert.equal(w.effects.filter(e=>e.type==='shot').length,0);assert.equal(w.effects.filter(e=>e.type==='kill').length,1+count);
    assert.ok(fragments.reduce((n,e)=>n+e.damage,0)<=primary[0].damage*.6);
  }
});

test('evolved Scatter damages each member of a wide fan once, really pushes small foes and leaves bosses in place',()=>{
  const {w,p,s}=setup('scatter'),a=enemy(w,0,-36),b=enemy(w,2.3,-36.5),boss=enemy(w,-1,-38,'boss');
  const before=[a,b,boss].map(e=>({x:e.x,z:e.z,hp:e.hp}));w.fireWeapon(p,s);
  const wave=w.effects.find(e=>e.type==='evoShockwave');assert.ok(wave.spread>1);assert.equal(wave.targets.length,3);
  assert.equal(new Set(wave.targets.map(e=>e.id)).size,3);assert.equal(w.effects.filter(e=>e.type==='hit').length,3);
  assert.ok(dist(a,p)>dist(before[0],p)+1);assert.ok(dist(b,p)>dist(before[1],p)+1);
  close(boss.x,before[2].x);close(boss.z,before[2].z);
  close(before.reduce((n,e,i)=>n+e.hp-[a,b,boss][i].hp,0),s.damage*WEAPONS.scatter.damage*(2+s.weaponRank));
  assert.equal(w.effects.some(e=>e.type==='shot'),false);
});

test('Scatter swept knockback stops before buildings and map edges instead of passing through to a clear endpoint',()=>{
  const {w,p,s}=setup('scatter'),a=enemy(w,0,-36);
  w.towers.push({id:'blocking-building',x:0,z:-38.5,hp:100});w.fireWeapon(p,s);
  assert.ok(a.z>-37.5);assert.ok(a.z<-36);assert.ok(w.clear(a.x,a.z));
  const other=setup('scatter');Object.assign(other.p,{x:20,z:-50});const edge=enemy(other.w,22,-50);
  other.w.fireWeapon(other.p,other.s);assert.ok(edge.x>22);assert.ok(edge.x<=BOUNDS.halfWidth-other.w.enemyRadius(edge.type)+1e-8);
  assert.ok(other.w.clear(edge.x,edge.z));
});

test('Rail replaces the old full shot with six bounded ticks, pierces shields and has identical total damage across frame partitions',()=>{
  const fine=beam(),coarse=beam();
  assert.equal(fine.w.effects.some(e=>e.type==='shot'),false);close(fine.a.hp,fine.a.maxHp);
  evolveFor(fine.w,.139);close(fine.a.hp,fine.a.maxHp);evolveFor(fine.w,.001);close(fine.a.maxHp-fine.a.hp,fine.s.damage*WEAPONS.rail.damage/6);
  evolveFor(fine.w,.7,.01);evolveFor(coarse.w,.84,.1);
  close(fine.a.maxHp-fine.a.hp,fine.s.damage*WEAPONS.rail.damage);close(fine.b.maxHp-fine.b.hp,fine.s.damage*WEAPONS.rail.damage*.82);
  close(fine.a.hp,coarse.a.hp);close(fine.b.hp,coarse.b.hp);assert.equal(fine.w.beams.length,0);
  assert.equal(fine.w.effects.filter(e=>e.type==='hit').length,12);assert.equal(fine.w.effects.filter(e=>e.type==='evoBeam').length,1);
  const visual=fine.w.effects.find(e=>e.type==='evoBeam');assert.equal(visual.followOwner,true);close(visual.duration,.84);close(visual.totalDamage,fine.s.damage*WEAPONS.rail.damage);
});

test('the sustained Rail follows its moving owner while retaining the charged direction',()=>{
  const {w,p,a,s}=beam(),side=enemy(w,4,-38);evolveFor(w,.14);const after=a.hp;
  p.x=4;p.headingX=-1;p.headingZ=0;evolveFor(w,.7);
  close(a.hp,after);close(side.maxHp-side.hp,s.damage*WEAPONS.rail.damage*5/6);
  const e=w.effects.find(e=>e.type==='evoBeam');close(e.dx,0);close(e.dz,-1);
});

test('Arc emits a slow orb and timed distinct zaps, with no launch damage or per-frame repeat hits',()=>{
  for(const [level,ticks]of [[31,4],[36,5],[41,6]]){
    const {w,p,s}=setup('arc',level),foes=Array.from({length:8},(_,i)=>enemy(w,(i%3-1)*.8,-35-Math.floor(i/3)*.5));
    w.fireWeapon(p,s);assert.equal(w.orbs.length,1);assert.ok(foes.every(e=>e.hp===e.maxHp));
    evolveFor(w,.199);assert.ok(foes.every(e=>e.hp===e.maxHp));evolveFor(w,.001);assert.equal(foes.filter(e=>e.hp<e.maxHp).length,1);
    evolveFor(w,1.4,.013);const arcs=w.effects.filter(e=>e.type==='evoArc');
    assert.equal(arcs.length,ticks);assert.equal(new Set(arcs.map(e=>e.target)).size,ticks);assert.equal(w.orbs.length,0);
    for(let i=0;i<arcs.length;i++){close(arcs[i].damage,s.damage*WEAPONS.arc.damage*Math.pow(.8,i));close(arcs[i].sx,0);close(arcs[i].sz,p.z-3.8*(.2+i*.26));}
    assert.equal(w.effects.filter(e=>e.type==='hit').length,ticks);assert.equal(w.effects.some(e=>e.type==='shot'),false);
  }
});

test('Arc timing and damage remain equal with coarse or fine updates, and one orb never revisits a lone enemy',()=>{
  function run(dt){const {w,p,s}=setup('arc'),foes=Array.from({length:8},(_,i)=>enemy(w,(i%3-1)*.8,-35-Math.floor(i/3)*.5));w.fireWeapon(p,s);evolveFor(w,1.6,dt);return {w,hp:foes.map(e=>e.hp)}}
  const a=run(.01),b=run(.1);a.hp.forEach((hp,i)=>close(hp,b.hp[i]));
  assert.deepEqual(a.w.effects.filter(e=>e.type==='evoArc').map(e=>[e.target,e.sx,e.sz]),b.w.effects.filter(e=>e.type==='evoArc').map(e=>[e.target,e.sx,e.sz]));
  const {w,p,s}=setup('arc'),single=enemy(w,0,-35);w.fireWeapon(p,s);evolveFor(w,1.6,.01);
  close(single.maxHp-single.hp,s.damage*WEAPONS.arc.damage);assert.equal(w.effects.filter(e=>e.type==='evoArc').length,1);
});

test('falling, evacuation, disconnect and entering either base immediately remove ongoing beams and orbs',()=>{
  for(const weapon of ['rail','arc'])for(const reason of ['down','evacuate','disconnect','base']){
    const fixture=weapon==='rail'?beam():setup('arc'),{w,p,s}=fixture;
    const target=weapon==='rail'?fixture.a:enemy(w,0,-35);if(weapon==='arc')w.fireWeapon(p,s);
    const hp=target.hp;
    if(reason==='down')w.down(p);else if(reason==='evacuate')w.evacuate(p);else if(reason==='disconnect')w.disconnect(p.id);else{p.z=7;w.updateEvolution()}
    assert.equal(w.beams.length+w.orbs.length,0,`${weapon} ${reason}`);assert.ok(w.effects.some(e=>e.type==='evoEnd'));
    evolveFor(w,2);close(target.hp,hp);
  }
  const {w,p,s}=setup('rail');enemy(w,0,-35);w.fireWeapon(p,s);assert.ok(p.charge);w.disconnect(p.id);assert.equal(p.charge,null);
});

test('orb population is capped per owner and room, while all shots retain the firing owner',()=>{
  const {w,p,s}=setup('arc'),a=enemy(w,0,-35);
  for(let i=0;i<30;i++)w.startEvolutionOrb(p,a,s,3);assert.equal(w.orbs.length,3);
  for(let i=1;i<8;i++){
    const profile=structuredClone(p.profile);profile.id='crew-'+i;const q=w.enter(profile);Object.assign(q,{x:0,z:-32});
    for(let j=0;j<5;j++)w.startEvolutionOrb(q,a,stats(q.profile),3);
  }
  assert.equal(w.orbs.length,24);assert.ok(w.orbs.every(o=>w.players.has(o.owner)));
  evolveFor(w,.2);assert.ok(Object.keys(a.contributors).every(id=>w.players.has(id)));
});

test('the normal world simulation launches and advances the new attacks automatically, and entering base cancels them before damage',()=>{
  for(const weapon of ['rail','arc']){
    const {w,p,s}=setup(weapon),a=enemy(w,0,-35);
    for(let i=0;i<20;i++)w.step(.05,1000);
    assert.ok(w.effects.some(e=>e.type===(weapon==='rail'?'evoBeam':'evoOrb')));assert.ok(a.hp<a.maxHp);
    if(weapon==='rail')assert.ok(a.maxHp-a.hp<s.damage*WEAPONS.rail.damage);
    assert.equal(w.effects.some(e=>e.type==='shot'),false);
    p.z=7;const hp=a.hp;w.step(.1,1000);assert.equal(w.beams.length+w.orbs.length,0);
    for(let i=0;i<20;i++)w.step(.05,1000);close(a.hp,hp);
  }
});
