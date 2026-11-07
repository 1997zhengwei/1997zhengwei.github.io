import test from 'node:test';
import assert from 'node:assert/strict';
import {MAPS,COURSE,selectTrack,floorCenter} from '../src/tracks.mjs';
import {makeRunner,stepRunner,botInput,floorAt} from '../src/course.mjs';
import {rivalProfile} from '../src/rivals.mjs';

function simulate(seed){
 selectTrack('grand-tour-v2');const ps=Array.from({length:11},(_,i)=>makeRunner({id:i+1,x:((i+1)%4-1.5)*2.05,z:10+Math.floor(i/4)*1.1,raceSeed:seed}));
 for(let n=0;n<12000&&!ps.every(p=>p.finishTime!==null);n++)for(const p of ps)stepRunner(p,botInput(p,n*.01),.01,n*.01);
 return ps.map(p=>({id:p.id,tier:p.tier,t:p.finishTime,hits:p.hits,falls:p.falls,mistakes:p.mistakes,speed:p.speed,tricks:p.tricks,jumps:p.jumps,dives:p.dives}));
}
test('the S bends have real curved floor boundaries and are second in the map list',()=>{
 assert.equal(MAPS[1].id,'cloud-serpentine');selectTrack(MAPS[1].id);
 const curves=COURSE.floors.filter(f=>f.curve);assert.equal(curves.length,2);
 for(const f of curves)for(const p of f.curve.slice(1,-1)){assert.equal(floorAt(p.x,p.z)?.id,f.id);assert.ok(Math.abs(floorCenter(f,p.z)-p.x)<.00001);assert.equal(floorAt(p.x+f.w/2+.2,p.z),undefined);}
 assert.equal(floorAt(0,-41),undefined);assert.ok(COURSE.distance>COURSE.start-COURSE.finish);selectTrack(MAPS[0].id);
});
test('a race mixes four skill tiers and shuffles their assignments on a new seed',()=>{
 const roster=Array.from({length:11},(_,i)=>rivalProfile(i+1,42)),other=Array.from({length:11},(_,i)=>rivalProfile(i+1,43));
 for(const [tier,n]of[['expert',3],['technical',5],['regular',2],['rookie',1]])assert.equal(roster.filter(p=>p.tier===tier).length,n);
 assert.ok(Math.max(...roster.map(p=>p.skill))-Math.min(...roster.map(p=>p.skill))>.3);assert.ok(roster.every(p=>p.pace<=1));assert.notDeepEqual(roster.map(p=>p.tier),other.map(p=>p.tier));assert.deepEqual(roster[0],rivalProfile(1,42));
});
test('seeded decisions yield actual collisions, recoveries and a varied finishing field',()=>{
 const a=simulate(42),b=simulate(42),c=simulate(1);assert.deepEqual(a,b);assert.notDeepEqual(a,c);assert.ok(a.every(p=>p.t!==null&&p.speed===7.3));assert.ok(a.filter(p=>p.hits>0).length>=4);assert.ok(a.some(p=>p.falls>0));assert.ok(a.some(p=>p.falls===0));
 assert.ok(a.filter(p=>p.tier==='technical'&&p.tricks>0).length>=3);assert.ok(a.every(p=>p.dives<=p.jumps));
 const times=a.map(p=>p.t);assert.ok(Math.max(...times)-Math.min(...times)>8);
 const mean=tier=>{const ps=a.filter(p=>p.tier===tier);return ps.reduce((s,p)=>s+p.t,0)/ps.length;};assert.ok(mean('expert')<mean('rookie'));
});
test('hurt feedback starts on a physical hit and expires with recovery',()=>{
 selectTrack(MAPS[0].id);const p=makeRunner({x:-3.6,z:-15});assert.ok(stepRunner(p,{},.01,0).includes('hit'));assert.ok(p.hurt>1);for(let i=1;i<140;i++)stepRunner(p,{z:1},.01,i*.01);assert.equal(p.hurt,0);assert.ok(p.hits>=1);
});
