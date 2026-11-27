import test from 'node:test';
import assert from 'node:assert/strict';
import {FrontierWorld,newProfile,XP,stats} from './starpath-rules.mjs';
import {updateBoss,bossDamage,hazardContains,initBoss} from './boss-combat.mjs';
function fixture(zone=9){
 const w=new FrontierWorld(),f=newProfile('boss-test','Boss tester');
 Object.assign(f,{xp:XP[59],metal:1000,crystal:1000,homeBase:3,cleared:[0,1,2,3,4,5],aurora:{arrived:true,radar:true,escort:true,guardian:true,escortCheckpoint:3},starfall:{arrived:true,cleared:[9,10].filter(z=>z<zone),pet:false,petStage:0,petXp:0,complete:false},modules:{oxygen:8,armor:8}});
 const p=w.enter(f),ev=w.events.find(e=>e.zone===zone);p.x=ev.x+7;p.z=ev.z+5;p.fire=Infinity;p.oxygen=9999;
 const e={id:900,x:ev.x,z:ev.z-5,homeX:ev.x,homeZ:ev.z-5,type:'boss',zone,event:ev.id,hp:10000,maxHp:10000,damage:45,contributors:{},readyAt:0,wake:0};
 w.enemies=[e];initBoss(e);return {w,f,p,e,ev};
}
function advance(w,e,p,seconds){for(let t=0;t<seconds;t+=.05)updateBoss(w,e,[p],.05);}
test('capsule warning geometry includes the lane and rounded end, and leaves real walkable gaps',()=>{
 const h={shape:'lane',x:0,z:0,endX:0,endZ:20,width:.65};
 assert.equal(hazardContains(h,{x:.6,z:10}),true);assert.equal(hazardContains(h,{x:1.5,z:10}),false);
 assert.equal(hazardContains(h,{x:0,z:20.5}),true);assert.equal(hazardContains(h,{x:0,z:21}),false);
 assert.equal(hazardContains({x:0,z:0,radius:3},{x:2,z:2}),true);
});
test('Aegis locks a full normal-walk warning before a five-second chest exposure',()=>{
 const {w,e,p}=fixture(8);e.bossTime=.01;advance(w,e,p,.05);
 assert.equal(e.bossStage,'windup');assert.equal(w.hazards.length,1);assert.equal(w.hazards[0].duration,2.6);
 const h={...w.hazards[0]};p.x+=6;advance(w,e,p,2.7);assert.equal(h.x,w.hazards[0].x,'warning never follows the dodging player');
 advance(w,e,p,.6);assert.equal(e.coreOpen,true);assert.equal(bossDamage(w,e,100,p.id),120);assert.ok(e.bossTime>4.8);
});
test('Thornback moves through its declared corridor, hits once, and crystal collision causes the longer stun',()=>{
 const {w,e,p}=fixture();updateBoss(w,e,[p],.05);const crystal=e.pillars[2];p.x=crystal.x;p.z=crystal.z-3;e.bossTime=.01;
 advance(w,e,p,.05);const mark=w.hazards.at(-1);assert.equal(mark.shape,'lane');assert.equal(mark.damage,0);assert.ok(mark.duration>=2.5);
 advance(w,e,p,2.6);const start={x:e.x,z:e.z};advance(w,e,p,1.3);
 assert.ok(Math.hypot(e.x-start.x,e.z-start.z)>5);assert.equal(e.crashed,true);assert.equal(e.bossStage,'recovery');assert.equal(e.bossDuration,5.5);assert.ok(e.bossTime>4);assert.equal(bossDamage(w,e,100,p.id),160);
 assert.equal(w.clear(crystal.x,crystal.z),false,'bait crystals are solid for player movement');
});
test('Moonwing casts three fixed blades with gaps, lands, and landing increases damage',()=>{
 const {w,e,p}=fixture(10);e.bossTime=.01;advance(w,e,p,.05);const marks=w.hazards;
 assert.equal(marks.length,3);assert.ok(marks.every(h=>h.shape==='lane'&&h.duration===2.8));
 const a=Math.atan2(p.x-e.x,p.z-e.z)+.275,gap={x:e.x+Math.sin(a)*12,z:e.z+Math.cos(a)*12};
 assert.ok(marks.every(h=>!hazardContains(h,gap,.3)));assert.equal(bossDamage(w,e,100,p.id),55.00000000000001);
 advance(w,e,p,3.5);assert.equal(e.bossStage,'recovery');assert.equal(e.coreOpen,true);assert.equal(bossDamage(w,e,100,p.id),125);
});
test('Starcrown intercepts shots with two independent rings and only opens the starcore after both break',()=>{
 const {w,e,p}=fixture(11);p.x=e.x-6;const original=e.hp;
 w.damageEnemy(e,100,p.id);assert.ok(Math.abs(e.rings[0].hp-700)<1e-8);assert.ok(Math.abs(e.rings[1].hp-850)<1e-8);assert.equal(original-e.hp,18);
 w.damageEnemy(e,500,p.id);assert.equal(e.rings[0].hp,0);assert.ok(e.rings[1].hp>0);
 p.x=e.x+6;w.damageEnemy(e,600,p.id);assert.equal(e.rings[1].hp,0);updateBoss(w,e,[p],.05);assert.equal(e.coreOpen,false);e.bossStage='recovery';e.bossTime=e.bossDuration=3.5;updateBoss(w,e,[p],.05);assert.equal(e.coreOpen,true);
 const hp=e.hp;w.damageEnemy(e,100,p.id);assert.equal(hp-e.hp,135);
});
test('clearing Starfall discards only its own adds, queued arrivals and warning marks; reward is personal and once',()=>{
 const {w,e,p,ev,f}=fixture(9);ev.state='active';ev.participants=[p.id];
 w.enemies.push({...e,id:901,type:'support'}, {...e,id:902,type:'scout',event:null});
 w.arrivals=[{...e,id:903},{...e,id:904,event:null}];w.hazards=[{owner:e.id},{owner:901},{owner:902}];
 w.completeEvent(ev);assert.deepEqual(f.starfall.cleared,[9]);assert.ok(w.enemies.filter(a=>a.event===ev.id).every(a=>a.hp===0));
 assert.deepEqual(w.hazards.map(h=>h.owner),[902]);assert.deepEqual(w.arrivals.map(a=>a.id),[904]);
 const xp=f.xp,metal=p.pouch.metal;w.completeEvent(ev);assert.equal(f.xp,xp);assert.equal(p.pouch.metal,metal);
 assert.ok(w.effects.some(x=>x.type==='guardianClear'&&x.playerId===p.id));
});
test('an active warning hurts its actual lane once, and a zero-damage charge preview cannot hurt or damage oxygen',()=>{
 const {w,e,p}=fixture(10);w.enemies=[];p.x=8;p.z=-1380;p.hp=stats(p.profile).hp;p.hurt=0;
 w.hazards=[{id:1,x:8,z:p.z-4,endX:8,endZ:p.z+4,shape:'lane',width:.65,time:.02,duration:2.8,damage:40}];
 const hp=p.hp;w.step(.05);assert.equal(hp-p.hp,40);w.step(.05);assert.equal(hp-p.hp,40);
 p.hurt=0;w.hazards=[{id:2,x:p.x,z:p.z,shape:'lane',endX:p.x,endZ:p.z+3,width:2,time:.02,duration:2.5,damage:0}];w.step(.05);assert.equal(hp-p.hp,40);
});
test('all nearby players receive the same boss phase, ring health and attack geometry',()=>{
 const {w,e,p,f}=fixture(11),q=w.enter({...structuredClone(f),id:'second',name:'Second pilot'});q.x=p.x+1;q.z=p.z;q.fire=Infinity;
 e.bossTime=.01;advance(w,e,p,.05);w.damageEnemy(e,200,p.id);
 const a=JSON.parse(JSON.stringify(w.view(p.id))),b=JSON.parse(JSON.stringify(w.view(q.id)));
 assert.deepEqual(a.enemies,b.enemies);assert.deepEqual(a.hazards,b.hazards);assert.ok(a.enemies[0].rings[1].hp<850);
});
test('a failed/abandoned encounter removes its rig and hazards and can be awakened again with full rings',()=>{
 const {w,e,p,ev}=fixture(11);ev.state='active';ev.participants=[p.id];ev.abandoned=0;
 e.rings[0].hp=0;w.hazards=[{id:42,owner:e.id,x:e.x,z:e.z,radius:2,time:30,duration:30,damage:30}];
 p.x=0;p.z=-1122;p.lastInput=0;
 for(let i=0;i<245;i++)w.step(.05,1800000000000+i*50);
 assert.equal(ev.state,'idle');assert.ok(!w.enemies.some(a=>a.event===ev.id));assert.ok(!w.hazards.some(h=>h.owner===e.id));
 p.x=ev.x+4;p.z=ev.z+3;assert.equal(w.action(p,{type:'event',id:ev.id}),null);const request=w.arrivals.find(a=>a.event===ev.id);initBoss(request);assert.ok(request.rings.every(r=>r.hp===r.maxHp));
});
