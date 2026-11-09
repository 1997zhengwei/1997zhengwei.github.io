import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRunner,stepRunner,botInput,standings,floorAt} from '../src/course.mjs';
const dt=.01;
test('a well timed jump crosses a real three-metre gap',()=>{
 const p=makeRunner({x:0,z:-95.3});p.vz=-7.3;for(let i=0;i<77;i++)stepRunner(p,{x:0,z:-1,jumpPressed:i===0},dt,i*dt);
 assert.ok(p.z<-99);assert.equal(p.grounded,true);assert.equal(floorAt(p.x,p.z).id,'jump2');
});
test('walking off the same gap falls and returns to the earned checkpoint',()=>{
 const p=makeRunner({x:0,z:-95.8});p.checkpoint=1;p.vz=-7.3;for(let i=0;i<120;i++)stepRunner(p,{x:0,z:0},dt,i*dt);
 assert.equal(p.falls,1);assert.equal(p.checkpoint,1);assert.equal(p.z,-43);assert.ok(p.waiting>=0);
});
test('obstacle contact stumbles and launches the runner with a recovery period',()=>{
 const p=makeRunner({x:-3.6,z:-15});const events=stepRunner(p,{x:0,z:0},dt,0);
 assert.ok(events.includes('hit'));assert.ok(p.stun>0);assert.ok(p.invuln>0);assert.equal(p.hits,1);
});
test('airborne second action adds a forward dive rather than a second jump',()=>{
 const p=makeRunner();stepRunner(p,{jumpPressed:true,z:-1},dt,0);const jumps=p.jumps;const events=stepRunner(p,{divePressed:true,z:-1},dt,.01);
 assert.ok(events.includes('dive'));assert.equal(p.jumps,jumps);assert.ok(p.vz< -10);
});
test('race positions use actual finish times before track progress',()=>{
 const a=makeRunner({id:0,z:-120}),b=makeRunner({id:1,z:-125}),c=makeRunner({id:2,z:-124});b.finishTime=20;c.finishTime=19;
 assert.deepEqual(standings([a,b,c]).map(p=>p.id),[2,1,0]);
});
test('computer rivals can complete the physical course without hidden progress changes',()=>{
 const players=Array.from({length:11},(_,i)=>makeRunner({id:i+1,x:(i%4-1.5)*2,z:9+i*.1,speed:7.3}));
 for(let n=0;n<12000;n++){const t=n*dt;for(const p of players)stepRunner(p,botInput(p,t),dt,t);}
 assert.ok(players.filter(p=>p.finishTime!==null).length>=8,JSON.stringify(players.map(p=>({id:p.id,z:p.z,falls:p.falls}))));
});
