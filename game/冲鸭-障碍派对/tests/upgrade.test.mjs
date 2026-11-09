import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRunner,stepRunner,botInput,COURSE} from '../src/course.mjs';
import {ACCESSORIES,DEFAULT_LOOK,DYES,migrateSave,equipOwned,buyAccessory,raceReward} from '../src/progression.mjs';
import {TRACK_ID} from '../src/tracks.mjs';

test('the extended course has distinct belts, hammers and an optional physical shortcut',()=>{
 assert.equal(COURSE.start-COURSE.finish,382);assert.equal(COURSE.sections.length,7);assert.ok(COURSE.hammers.length>=3);assert.ok(COURSE.belts.length>=4);assert.ok(COURSE.floors.some(f=>f.id.startsWith('short')&&f.openEdges));
});
test('conveyors move an idle grounded runner in their visible direction',()=>{
 const forward=makeRunner({x:-4.9,z:-160}),reverse=makeRunner({x:0,z:-160});
 for(let i=0;i<80;i++){stepRunner(forward,{},.01,i*.01);stepRunner(reverse,{},.01,i*.01);}
 assert.ok(forward.z<-161);assert.ok(reverse.z>-159.2);
});
test('one leap permits one dive and a landing restores the ability',()=>{
 const p=makeRunner({z:3});stepRunner(p,{jumpPressed:true,z:-1},.01,0);stepRunner(p,{divePressed:true,z:-1},.01,.01);stepRunner(p,{divePressed:true,z:-1},.01,.02);assert.equal(p.dives,1);
 for(let n=3;n<150;n++)stepRunner(p,{z:0},.01,n*.01);assert.equal(p.grounded,true);stepRunner(p,{jumpPressed:true},.01,1.5);stepRunner(p,{divePressed:true},.01,1.51);assert.equal(p.dives,2);
});
test('rivals share the speed cap and finish with different pacing and legal dives',()=>{
 const racers=Array.from({length:12},(_,i)=>makeRunner({id:i,x:i?(i%4-1.5)*2.05:0,z:i?10+Math.floor((i-1)/4)*1.1:8}));
 for(let n=0;n<8000;n++){for(const p of racers)stepRunner(p,botInput(p,n*.01),.01,n*.01);}
 assert.ok(racers.every(p=>p.speed===7.3));assert.ok(racers.every(p=>p.finishTime!==null));const times=racers.slice(1).map(p=>p.finishTime);assert.ok(Math.max(...times)-Math.min(...times)>5);assert.ok(Math.min(...times)<57);assert.ok(racers.every(p=>p.dives<=p.jumps));assert.ok(racers.reduce((n,p)=>n+p.dives,0)>15);assert.ok(racers[0].finishTime>45);
});
test('migration preserves earned coins, outfits, wins and the old course record',()=>{
 const p=migrateSave({coins:375,wins:4,races:9,skin:'gold',unlocked:['duck','cat','shark','gold'],best:22.19,sound:false});
 assert.equal(p.coins,375);assert.equal(p.wins,4);assert.equal(p.skin,'gold');assert.equal(p.bestTracks.classic,22.19);assert.equal(p.best,null);assert.equal(p.sound,false);assert.deepEqual(p.loadout,DEFAULT_LOOK);
 const again=migrateSave({...p,bestTracks:{...p.bestTracks,[TRACK_ID]:53.12},ownedAccessories:[...p.ownedAccessories,'bow'],loadout:{...p.loadout,back:'bow',color:DYES[3]}});assert.equal(again.best,53.12);assert.equal(again.loadout.back,'bow');
});
test('three accessory slots and dye can be combined without buying whole costumes',()=>{
 const p=migrateSave({coins:200});assert.equal(buyAccessory(p,'party').ok,true);assert.equal(buyAccessory(p,'bow').ok,true);assert.equal(buyAccessory(p,'spark').ok,true);
 equipOwned(p,{head:'party',back:'bow',trail:'spark',color:DYES[2]});assert.deepEqual(p.loadout,{head:'party',back:'bow',trail:'spark',color:DYES[2]});assert.equal(p.coins,35);assert.equal(p.skin,'duck');
});
test('preview and duplicate equip cannot spend twice or grant an unowned item',()=>{
 const p=migrateSave({coins:100});buyAccessory(p,'party');const before=p.coins;buyAccessory(p,'party',{back:'galaxy',trail:'stardust'});assert.equal(p.coins,before);assert.equal(p.loadout.back,'back_none');assert.equal(p.loadout.trail,'trail_none');assert.equal(buyAccessory(p,'royal').ok,false);assert.equal(p.coins,before);
});
test('catalogue has 25 purchasable pieces, and rewards include difficulty and pickups once',()=>{
 assert.equal(ACCESSORIES.filter(a=>a.price>0).length,25);assert.equal(new Set(ACCESSORIES.map(a=>a.id)).size,ACCESSORIES.length);assert.equal(raceReward(1,true,25),225);assert.equal(raceReward(2,true,25),165);assert.equal(raceReward(12,false,10),0);
});

