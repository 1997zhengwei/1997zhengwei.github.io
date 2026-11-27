import test from 'node:test';
import assert from 'node:assert/strict';
import {MAPS,COURSE,TRACK_ID,selectTrack,jetState} from '../src/tracks.mjs';
import {makeRunner,stepRunner,botInput,obstacleContact} from '../src/course.mjs';
import {migrateSave} from '../src/progression.mjs';

test('five courses share live physics and reject unknown selections',()=>{
 assert.equal(MAPS.length,5);assert.equal(MAPS[1].id,'cloud-serpentine');assert.equal(new Set(MAPS.map(m=>m.theme)).size,4);
 for(const map of MAPS){assert.ok(selectTrack(map.id));assert.equal(COURSE,map);assert.equal(TRACK_ID,map.id);assert.ok(map.start-map.finish>=300);assert.ok(map.checkpoints.length>=6);}
 assert.equal(selectTrack('missing'),false);assert.equal(COURSE.id,'ember-ruins');
 selectTrack(MAPS[0].id);
});
test('spring pads launch automatically across the glacier gap',()=>{
 selectTrack('aurora-glacier');const p=makeRunner({x:0,z:-113.5});p.vz=-7.3;let launched=false,airMax=0;
 for(let i=0;i<150;i++){const events=stepRunner(p,{z:-1},.01,i*.01);launched ||= events.includes('spring');airMax=Math.max(airMax,p.y);}
 assert.ok(launched);assert.ok(airMax>3.5);assert.ok(p.z<-124);assert.equal(p.grounded,true);assert.equal(p.falls,0);selectTrack(MAPS[0].id);
});
test('ice keeps lateral momentum longer than the regular floor',()=>{
 selectTrack('aurora-glacier');const icy=makeRunner({x:5,z:-25}),regular=makeRunner({x:5,z:4});icy.vx=regular.vx=7;
 for(let i=0;i<10;i++){stepRunner(icy,{},.01,i*.01);stepRunner(regular,{},.01,i*.01);}
 assert.ok(icy.vx>regular.vx*2);selectTrack(MAPS[0].id);
});
test('cross conveyors push horizontally in opposite visible directions',()=>{
 selectTrack('neon-foundry');const a=makeRunner({z:-76}),b=makeRunner({z:-96});
 for(let i=0;i<40;i++){stepRunner(a,{},.01,i*.01);stepRunner(b,{},.01,i*.01);}
 assert.ok(a.x>1);assert.ok(b.x<-1);selectTrack(MAPS[0].id);
});
test('eruption has a warning window and only the active fire column hits',()=>{
 selectTrack('ember-ruins');const jet=COURSE.jets[0],p=makeRunner({x:jet.x,z:jet.z});
 assert.equal(jetState(jet,3).warning,true);assert.equal(jetState(jet,3).active,false);assert.equal(obstacleContact(p,3),null);
 assert.equal(jetState(jet,.2).active,true);assert.equal(obstacleContact(p,.2)?.type,'jet');assert.equal(obstacleContact({...p,y:4},.2),null);
 selectTrack(MAPS[0].id);
});
test('every map is physically finishable by all twelve equal-speed runners',()=>{
 for(const map of MAPS){selectTrack(map.id);const racers=Array.from({length:12},(_,i)=>makeRunner({id:i,x:i?(i%4-1.5)*2.05:0,z:i?10+Math.floor((i-1)/4)*1.1:8}));
  for(let n=0;n<14000&&!racers.every(p=>p.finishTime!==null);n++)for(const p of racers)stepRunner(p,botInput(p,n*.01),.01,n*.01);
  assert.ok(racers.every(p=>p.speed===7.3),map.id);assert.ok(racers.every(p=>p.finishTime!==null),map.id);
 }
 selectTrack(MAPS[0].id);
});
test('v2 upgrades preserve purchases, money and cloud records; v3 records stay per map',()=>{
 const old=migrateSave({version:2,coins:762,wins:3,races:9,skin:'gold',unlocked:['duck','gold'],ownedAccessories:['royal','galaxy','stardust'],loadout:{head:'royal',back:'galaxy',trail:'stardust',color:'#b891ff'},best:52.43,bestTracks:{'grand-tour-v2':52.43}});
 assert.equal(old.version,4);assert.equal(old.track,'grand-tour-v2');assert.equal(old.coins,762);assert.equal(old.best,52.43);assert.equal(old.bestTracks.classic,undefined);assert.equal(old.loadout.back,'galaxy');assert.ok(old.ownedAccessories.includes('royal'));
 const next=migrateSave({...old,track:'aurora-glacier',bestTracks:{...old.bestTracks,'aurora-glacier':43.4}});assert.equal(next.best,43.4);assert.equal(next.bestTracks['grand-tour-v2'],52.43);
});
