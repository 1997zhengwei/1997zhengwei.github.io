import test from'node:test';import assert from'node:assert/strict';
import{createGame,build,building,startNight,step,BELL}from'../core.mjs';
import{aimBlock,makeProjectile,traceProjectile}from'../combat.mjs';
function night(r){r.hero.x=14;r.hero.z=15;startNight(r);r.queue=[{at:999,type:'zombie',lane:0,jitter:0}];}
function mob(type,x,z){return{id:'enemy',type,x,z,hp:5000,maxHp:5000,cooldown:0,fuse:0,waypoint:4,lane:0,jitter:0};}
test('the stone barricade intercepts skeleton arrows before the protected tower',()=>{
 const r=createGame();build(r,'northwatch');build(r,'north-gate');build(r,'north-gate');night(r);r.enemies=[mob('skeleton',0,-4.6)];step(r,.05);
 assert.equal(r.arrows.find(a=>a.source==='skeleton').targetId,'north-gate');for(let i=0;i<60;i++)step(r,.05);
 assert.equal(building(r,'northwatch').hp,105);assert.ok(building(r,'north-gate').hp<230);
});
test('a zombie cannot cross an intact barricade to hit a guardian behind it',()=>{
 const r=createGame();build(r,'north-gate');night(r);r.guards=[{id:'guard',type:'golem',x:0,z:-2.9,hp:180,maxHp:180,home:{x:0,z:-2.9},level:1,cooldown:0}];r.enemies=[mob('zombie',0,-4.6)];
 for(let i=0;i<100;i++)step(r,.05);assert.equal(r.guards[0].hp,180);assert.ok(building(r,'north-gate').hp<130);assert.ok(r.enemies[0].z<-3.7);
 building(r,'north-gate').hp=0;for(let i=0;i<100;i++)step(r,.05);assert.ok(r.guards[0].hp<180);
});
test('houses block low projectiles in both directions',()=>{
 const r=createGame(),from={id:'hero',x:-6.5,z:-10},target={id:'enemy',x:-6.5,z:-4};
 assert.equal(aimBlock(r,from,target,'hero').kind,'house');assert.equal(aimBlock(r,target,from,'skeleton').kind,'house');
});
test('physical arrow arcs let a tower shoot over its own barricade',()=>{
 const r=createGame();build(r,'northwatch');build(r,'north-gate');build(r,'north-gate');const tower=building(r,'northwatch'),enemy={id:'enemy',x:0,z:-6};
 assert.equal(aimBlock(r,tower,enemy,'tower'),null);assert.equal(aimBlock(r,enemy,tower,'skeleton').id,'north-gate');
});
test('destroying a wall removes cover for arrows already in flight',()=>{
 const r=createGame();build(r,'north-gate');const a=makeProjectile({id:'archer',x:0,z:-6},{id:'hero',x:0,z:-2},'skeleton');
 assert.equal(traceProjectile(r,a).id,'north-gate');building(r,'north-gate').hp=0;assert.equal(traceProjectile(r,a),null);
});
test('guard melee cannot hit an enemy across an intact wall',()=>{
 const r=createGame();build(r,'north-gate');night(r);r.guards=[{id:'g',type:'golem',x:0,z:-3,hp:180,maxHp:180,home:{x:0,z:-3},level:1,cooldown:0}];const e=mob('zombie',0,-4.6);e.cooldown=99;r.enemies=[e];for(let i=0;i<10;i++)step(r,.05);assert.equal(e.hp,5000);
});
test('tower attack cadence is preserved across supported rule step sizes',()=>{
 const counts=[];for(const dt of[.05,.1]){const r=createGame();r.night=20;r.emeralds=100;for(let i=0;i<5;i++)build(r,'northwatch');night(r);r.enemies=[mob('zombie',0,-6)];let shots=0;r.events=[];for(let t=0;t<10-1e-8;t+=dt){step(r,dt);shots+=r.events.filter(e=>e.kind==='shoot'&&e.source==='tower').length;r.events=[];}counts.push(shots);}assert.ok(Math.abs(counts[0]-counts[1])<=1);assert.ok(counts.every(n=>n>=18&&n<=20));
});
