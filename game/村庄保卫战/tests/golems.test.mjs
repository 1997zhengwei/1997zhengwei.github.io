import test from'node:test';import assert from'node:assert/strict';
import{createGame,build,building,startNight,step,drainEvents,checkpoint,restore,serviceGolems,crewServiceCost,crewStatus,golemMaxHP,salvageValue}from'../core.mjs';
function make(){const r=createGame(1);build(r,'golem-yard');return r;}
test('buying a yard includes one 180 HP guardian with an explicit roster',()=>{const r=make(),b=building(r,'golem-yard');assert.equal(r.emeralds,3);assert.deepEqual(b.crew,[{hp:180}]);assert.equal(crewStatus(b).ready,1);});
test('injury survives dawn, save, reload and the following night',()=>{
 const r=make();r.hero.x=14;r.hero.z=15;startNight(r);r.queue=[];const g=r.guards[0];r.enemies=[{id:'dummy',type:'zombie',x:g.x,z:g.z-1.1,hp:5000,maxHp:5000,cooldown:0,fuse:0,waypoint:5,lane:0,jitter:0}];
 for(let i=0;i<70;i++)step(r,.05);const hp=g.hp;assert.ok(hp>0&&hp<180);r.enemies=[];step(r,.05);while(r.phase==='dawn')step(r,.1);
 const saved=restore(checkpoint(r));assert.equal(building(saved,'golem-yard').crew[0].hp,hp);startNight(saved);assert.equal(saved.guards[0].hp,hp);
});
test('a downed golem emits one death event and does not reappear for free',()=>{
 const r=make();r.hero.x=14;r.hero.z=15;startNight(r);r.queue=[];const g=r.guards[0];r.enemies=[{id:'dummy',type:'armored',x:g.x,z:g.z-1.1,hp:5000,maxHp:5000,cooldown:0,fuse:0,waypoint:5,lane:0,jitter:0}];drainEvents(r);
 for(let i=0;i<500&&g.hp>0;i++)step(r,.05);assert.equal(g.hp,0);assert.equal(drainEvents(r).filter(e=>e.kind==='guardDown').length,1);for(let i=0;i<5;i++)step(r,.05);assert.equal(drainEvents(r).filter(e=>e.kind==='guardDown').length,0);
 r.enemies=[];step(r,.05);while(r.phase==='dawn')step(r,.1);assert.equal(building(r,'golem-yard').crew[0].hp,0);startNight(r);assert.equal(r.guards.length,0);
});
test('paid crew repair and recruitment consume their displayed cost only once',()=>{
 const r=make(),b=building(r,'golem-yard');b.crew[0].hp=60;assert.equal(crewServiceCost(b),2);assert.equal(serviceGolems(r,b.id).cost,2);assert.equal(r.emeralds,1);assert.equal(b.crew[0].hp,180);assert.equal(serviceGolems(r,b.id).ok,false);
 b.crew[0].hp=0;assert.equal(crewServiceCost(b),3);assert.equal(serviceGolems(r,b.id).ok,false);assert.equal(b.crew[0].hp,0);r.emeralds=3;assert.equal(serviceGolems(r,b.id,0).cost,3);assert.equal(r.emeralds,0);startNight(r);assert.equal(serviceGolems(r,b.id).ok,false);
});
test('yard repairs do not heal the golems and ruined yards must be repaired first',()=>{
 const r=make(),b=building(r,'golem-yard');b.hp=0;b.crew[0].hp=20;r.emeralds=20;assert.equal(serviceGolems(r,b.id).ok,false);build(r,b.id,'repair');assert.equal(b.crew[0].hp,20);assert.equal(serviceGolems(r,b.id).ok,true);
});
test('upgrades preserve existing losses while including only newly unlocked slots',()=>{
 const r=make(),b=building(r,'golem-yard');r.emeralds=100;b.crew[0].hp=0;build(r,b.id);assert.equal(b.crew[0].hp,0);build(r,b.id);assert.equal(b.crew.length,2);assert.equal(b.crew[0].hp,0);assert.equal(b.crew[1].hp,golemMaxHP(3));
});
test('selling and rebuilding cannot bypass either troop service or structural repair',()=>{
 const r=make(),b=building(r,'golem-yard');b.crew[0].hp=0;assert.equal(salvageValue(b),4);build(r,b.id,'sell');build(r,b.id);assert.equal(r.emeralds,0);assert.equal(building(r,b.id).crew[0].hp,180);
 const t=createGame();build(t,'northwatch');const tower=building(t,'northwatch');tower.hp=0;assert.equal(salvageValue(tower),2);build(t,tower.id,'sell');build(t,tower.id);assert.equal(t.emeralds,4);
});
test('v2 progress migrates once and v3 rejects missing or forged crew health',()=>{
 const r=make();r.night=10;r.score=500;const old=checkpoint(r);old.version=2;for(const b of old.builds)delete b.crew;old.builds.find(b=>b.id==='northwatch').x=-3.1;
 const migrated=restore(old);assert.equal(migrated.night,10);assert.equal(migrated.emeralds,3);assert.equal(migrated.score,500);assert.equal(building(migrated,'golem-yard').crew[0].hp,180);assert.equal(building(migrated,'northwatch').x,-2.6);
 const saved=checkpoint(migrated);delete saved.builds.find(b=>b.id==='golem-yard').crew;assert.equal(restore(saved),null);
});
test('individual service remains available when restoring the whole squad is unaffordable',()=>{
 const r=make(),b=building(r,'golem-yard');r.emeralds=100;build(r,b.id);build(r,b.id);b.crew[0].hp=0;b.crew[1].hp=80;r.emeralds=4;assert.equal(crewServiceCost(b),6);assert.equal(serviceGolems(r,b.id).ok,false);assert.equal(serviceGolems(r,b.id,0).cost,4);assert.equal(r.emeralds,0);assert.equal(b.crew[0].hp,255);assert.equal(b.crew[1].hp,80);
});
test('one golem strike has one full-strength target and at most two splash victims',()=>{
 const r=make();r.hero.x=14;r.hero.z=15;startNight(r);r.queue=[{at:999,type:'zombie',lane:0,jitter:0}];const g=r.guards[0];r.enemies=Array.from({length:5},(_,i)=>({id:`enemy-${i}`,type:'zombie',x:g.x+i*.04,z:g.z-1.1,hp:5000,maxHp:5000,cooldown:0,fuse:0,waypoint:5,lane:0,jitter:0}));step(r,.05);assert.equal(r.enemies.filter(e=>e.hp<5000).length,3);assert.equal(r.enemies.filter(e=>e.hp===4976).length,1);
});
