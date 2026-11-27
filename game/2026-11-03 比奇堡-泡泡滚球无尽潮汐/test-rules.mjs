import {BOSS_TYPES,createBoss,bossVulnerable} from './bosses.mjs';
import assert from 'node:assert/strict';
import {createRun,step,dash,usePower,choosePower,spawnEnemy,hurt,relation,effectiveMass,swapPower,radius,baseRadius,playerLimit,GROUND_HALF,challengeBoss,createPractice,advanceSector} from './rules.mjs';
const dt=1/60,tick=(s,n,input={})=>{for(let i=0;i<n;i++)step(s,dt,input)};
const a=createRun(123);assert.deepEqual(createRun(123),a);
// Growth is visually substantial yet bounded; the whole hull stays on the larger floor.
const sizes=[10,50,100,300,600,1500,1e9].map(mass=>baseRadius({mass}));
assert.ok(sizes.every((r,i)=>!i||r>sizes[i-1]));assert.ok(sizes[5]/sizes[0]>3.6);assert.ok(sizes.at(-1)<=4.1);
const huge=createRun(31);huge.mass=1e9;huge.giant=8;huge.invuln=999;huge.supplyClock=999;huge.spawnClock=999;huge.x=100;huge.z=100;step(huge,dt,{x:1,z:1});assert.ok(huge.x<=playerLimit(huge));assert.ok(huge.x+radius(huge)*1.18<GROUND_HALF);assert.ok(huge.items.some(i=>Math.hypot(i.x,i.z)>20));
// Cleared stages wait for explicit next-street travel, regardless of bubble size or position.
huge.x=0;huge.z=-playerLimit(huge);huge.boss=createBoss(huge,'truck');huge.boss.dead=true;huge.bossDefeated=true;const clearedTime=huge.time;step(huge,dt,{});assert.equal(huge.time,clearedTime);assert.equal(huge.sector,1);assert.equal(advanceSector(huge),true);assert.equal(huge.sector,2);assert.equal(advanceSector(huge),false);
assert.equal(relation(a,{mass:5}),'roll');assert.equal(relation(a,{mass:10}),'dash');assert.equal(relation(a,{mass:30}),'dodge');
// Independent health and recoverable size loss; protected hits cannot chain.
a.mass=50;a.invuln=0;hurt(a,'test');assert.equal(a.hp,4);assert.equal(a.mass,44);assert.equal(a.items.filter(i=>i.lost).length,6);assert.equal(hurt(a,'again'),false);assert.equal(dash(a),true);assert.equal(dash(a),false);
// Upgrade pauses the simulation and has an explicit, validated selection.
const b=createRun(55);b.xp=30;step(b,dt,{});assert.ok(b.choices.includes('giant'));const time=b.time;tick(b,100);assert.equal(b.time,time);assert.equal(choosePower(b,'not-a-power'),false);assert.equal(choosePower(b,'giant'),true);const original=b.mass;usePower(b);assert.ok(effectiveMass(b)>original*1.9);assert.equal(b.mass,original);assert.equal(usePower(b),false);
// All four powers materially change the simulation.
const magnet=createRun(9);magnet.items=[{id:900,x:3,z:8,kind:0,value:1,need:0,got:false,ready:0}];magnet.skills.magnet=1;magnet.supplyClock=999;tick(magnet,50);assert.ok(magnet.mass>10);
const decoy=createRun(8);decoy.skills.decoy=1;decoy.activePower='decoy';assert.equal(usePower(decoy),true);assert.equal(decoy.decoys.length,1);const foe=spawnEnemy(decoy,'chaser');Object.assign(foe,{x:2,z:8,phase:'hunt',mass:50});decoy.x=10;tick(decoy,70);assert.ok(foe.x<2,'Robot follows the decoy rather than the player');decoy.decoys[0].life=.01;step(decoy,dt,{});assert.ok(foe.stun>0);decoy.skills.giant=1;swapPower(decoy);assert.equal(decoy.activePower,'giant');
const pinball=createRun(7);pinball.items=[];pinball.supplyClock=999;pinball.skills.pinball=1;pinball.mass=30;const e1=spawnEnemy(pinball,'chaser'),e2=spawnEnemy(pinball,'chaser');Object.assign(e1,{x:0,z:8,mass:30,phase:'hunt'});Object.assign(e2,{x:4,z:8,mass:30,phase:'hunt'});dash(pinball);step(pinball,dt,{});assert.equal(pinball.kills,1);assert.ok(pinball.steer);tick(pinball,40);assert.equal(pinball.kills,2);
// A fatal hit cannot be reversed by a same-frame repair pickup.
const fatal=createRun(4);fatal.hp=1;fatal.invuln=0;fatal.items=[{id:999,x:fatal.x,z:fatal.z,kind:3,got:false,ready:0}];const killer=spawnEnemy(fatal,'chaser');Object.assign(killer,{x:fatal.x,z:fatal.z,mass:100,phase:'hunt'});step(fatal,dt,{});assert.equal(fatal.finished,true);assert.equal(fatal.hp,0);
// Truck always accepts a dash regardless of mass; one contact cannot take all HP.
const boss=createRun(3);boss.mass=6;boss.boss=createBoss(boss,'truck');Object.assign(boss.boss,{x:0,z:8,phase:'rest',clock:3});dash(boss);step(boss,dt,{});assert.equal(boss.boss.hp,2);tick(boss,30);assert.equal(boss.boss.hp,2);
// Actual-input bot completes a street, retains powers, and enters a different biome.
const run=createRun(1201);let frames=0;while(run.sector<2&&!run.finished&&frames++<22000){if(run.choices){choosePower(run,run.choices.includes('giant')&&!run.skills.giant?'giant':run.choices.includes('magnet')?'magnet':run.choices[0]);continue;}let target;if(run.bossDefeated){advanceSector(run);continue;}else if(run.boss){target=run.boss;const d=Math.hypot(run.x-target.x,run.z-target.z);if(d<6&&run.dashCD===0)dash(run);}else{const nearest=list=>list.sort((a,b)=>Math.hypot(a.x-run.x,a.z-run.z)-Math.hypot(b.x-run.x,b.z-run.z))[0];const patch=run.hp<=2?nearest(run.items.filter(i=>i.kind===3)):null;target=patch||(run.mass<100?nearest(run.items.filter(i=>i.need<=effectiveMass(run)&&i.kind!==3)):nearest(run.caches.filter(c=>!c.opened)))||run.beacon;if(target===run.beacon)challengeBoss(run);const near=run.enemies.find(e=>Math.hypot(e.x-run.x,e.z-run.z)<4);if(near){if(run.activePower&&run.powerCD===0)usePower(run);if(run.dashCD===0)dash(run);}}step(run,dt,{target:{x:target.x,z:target.z}});}
assert.equal(run.sector,2,`Full loop failed: hp=${run.hp}, age=${run.time}, mass=${run.mass}, boss=${JSON.stringify(run.boss)}`);assert.equal(run.biome,1);assert.ok(run.skills.giant>0);assert.equal(run.enemies.length,0);assert.equal(run.boss,null);assert.ok(run.hp>0);assert.equal(run.finished,false);
// Procedural exploration: deterministic seeds, varied layouts and safe cache placement.
const signatures=new Set();for(let seed=0;seed<100;seed++){const s=createRun(seed);signatures.add(JSON.stringify([s.layout.variant,s.caches.map(c=>[c.x,c.z]),s.hazards]));assert.equal(s.caches.length,3);assert.ok(s.caches.every(c=>Math.abs(c.x)<23&&Math.abs(c.z)<23));assert.equal(new Set(s.bossOrder).size,4);assert.equal(challengeBoss(s),false);s.sectorTime=200;s.spawnClock=999;s.invuln=999;step(s,dt);assert.equal(s.boss,null,'Exploration must not auto-start a boss');}assert.equal(signatures.size,100);
const summoning=createRun(12);summoning.caches.forEach(c=>c.opened=true);assert.equal(challengeBoss(summoning),false);summoning.x=summoning.beacon.x;summoning.z=summoning.beacon.z;assert.equal(challengeBoss(summoning),true);assert.equal(challengeBoss(summoning),false);
const tour=createRun(42),order=[];for(let i=0;i<9;i++){order.push(tour.nextBoss);tour.boss=createBoss(tour,tour.nextBoss);tour.boss.dead=true;tour.bossDefeated=true;advanceSector(tour);assert.equal(tour.caches.filter(c=>c.opened).length,0);}assert.equal(new Set(order.slice(0,4)).size,4);assert.equal(new Set(order.slice(4,8)).size,4);assert.notEqual(order[3],order[4]);assert.notEqual(order[7],order[8]);
const core=createPractice('vacuum');Object.assign(core.boss,{phase:'attack',clock:2});core.x=core.boss.x;core.z=core.boss.z;core.invuln=0;step(core,dt);assert.equal(core.hp,4,'Standing at the suction origin must not grant immunity');
// All bosses have a telegraph, damaging attack, green opening, distinct hit count and defeat.
for(const kind of Object.keys(BOSS_TYPES)){
 const s=createPractice(kind);s.items=[];s.supplyClock=999;const b=s.boss;s.invuln=0;
 tick(s,121);assert.equal(b.phase,'warning',kind);assert.equal(bossVulnerable(b),kind==='truck');
 if(kind!=='truck'){s.x=b.x;s.z=b.z;dash(s);step(s,dt);assert.equal(b.hp,b.maxHP,'Armour rejects a dash');s.dash=0;}
 // Drive attack timing with natural steps, placing a test victim inside the published danger geometry.
 while(b.phase==='warning')step(s,dt);assert.equal(b.phase,'attack');s.invuln=0;s.hp=5;
 if(kind==='truck'){s.x=b.x;s.z=b.z;}if(kind==='vacuum'){s.x=b.x+Math.sin(b.angle)*2;s.z=b.z+Math.cos(b.angle)*2;}
 if(kind==='jelly'){s.x=b.zones[0].x;s.z=b.zones[0].z;}if(kind==='crab'){s.x=b.target.x;s.z=b.target.z;}
 for(let i=0;i<45&&s.hp===5;i++)step(s,dt);assert.ok(s.hp<5,kind+' attack must damage');assert.equal(s.hp,4,'Protection prevents a frame-by-frame damage chain');
 s.invuln=999;s.x=21;s.z=21;while(b.phase==='attack')step(s,dt);assert.equal(b.phase,'rest');assert.equal(bossVulnerable(b),true);
 for(let hit=0;hit<b.maxHP;hit++){b.phase='rest';b.clock=5;b.hitCD=0;s.x=b.x;s.z=b.z;s.dashCD=0;dash(s);step(s,dt);assert.equal(b.hp,b.maxHP-hit-1);}
 assert.equal(s.bossDefeated,true);assert.equal(b.dead,true);assert.equal(advanceSector(s),false,'Practice does not advance the expedition');
}
// Victory rewards are credited once before the modal, with no loot left to fetch.
const clear=createRun(18);clear.items=[];clear.hazards=[];clear.caches.forEach(c=>c.opened=true);clear.supplyClock=999;clear.spawnClock=999;clear.mass=200;clear.hp=2;clear.boss=createBoss(clear,'truck');Object.assign(clear.boss,{x:clear.x,z:clear.z,phase:'rest',clock:4,hp:1});dash(clear);step(clear,dt);assert.equal(clear.bossDefeated,true);assert.equal(clear.mass,230);assert.equal(clear.hp,3);assert.equal(clear.score,1800);assert.equal(clear.items.length,0);assert.equal(clear.choices,null);const rewardTime=clear.time;tick(clear,300,{x:1});assert.equal(clear.time,rewardTime);assert.equal(clear.score,1800);assert.equal(advanceSector(clear),true);assert.equal(clear.hp,4);assert.ok(clear.choices,'Boss XP upgrade is offered on entry');assert.equal(clear.caches.filter(c=>c.opened).length,0);const nextHP=clear.hp;assert.equal(advanceSector(clear),false);assert.equal(clear.hp,nextHP);
// Collected caches cannot pay twice, and the opened flag drives removal in the scene.
const cacheRun=createRun(91);cacheRun.items=[];cacheRun.hazards=[];cacheRun.supplyClock=999;cacheRun.spawnClock=999;cacheRun.hp=4;cacheRun.caches=[{id:0,x:cacheRun.x,z:cacheRun.z,medical:true,opened:false}];step(cacheRun,dt);assert.equal(cacheRun.caches[0].opened,true);assert.equal(cacheRun.mass,26);assert.equal(cacheRun.hp,5);tick(cacheRun,30);assert.equal(cacheRun.mass,26);assert.equal(cacheRun.score,300);
// Repeated non-protected hits really end the run; a new practice starts at full health.
const mortal=createPractice('crab');for(let hit=0;hit<5;hit++){mortal.invuln=0;hurt(mortal,'Test impact');}assert.equal(mortal.hp,0);assert.equal(mortal.finished,true);assert.equal(createPractice('crab').hp,5);
// Long-run population bounds; this durability case deliberately grants protection.
const endurance=createRun(92);endurance.invuln=1e6;for(let i=0;i<36000;i++){if(endurance.choices)choosePower(endurance,endurance.choices[0]);step(endurance,dt,{x:Math.sin(i*.001),z:Math.cos(i*.001)});}assert.ok(endurance.enemies.length<=20);assert.ok(endurance.items.length<140);assert.ok(Number.isFinite(endurance.mass));
const fresh=createRun(88);assert.equal(fresh.sector,1);assert.equal(fresh.kills,0);assert.equal(fresh.hp,5);assert.equal(fresh.activePower,null);
console.log(JSON.stringify({pass:true,streetTransition:{time:Math.round(run.time),mass:run.mass,hp:run.hp,level:run.level,powers:run.skills},endurance:{seconds:Math.round(endurance.time),enemies:endurance.enemies.length,items:endurance.items.length}},null,2));
