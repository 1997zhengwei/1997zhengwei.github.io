import test from 'node:test';
import assert from 'node:assert/strict';
import {raceReward,migrateSave} from '../src/progression.mjs';

test('only a finished podium result banks the position prize and collected coins',()=>{
 assert.equal(raceReward(1,true,20),220);assert.equal(raceReward(2,true,20),160);assert.equal(raceReward(3,true,20),120);
 for(let rank=4;rank<=12;rank++)assert.equal(raceReward(rank,true,1000),0);
 for(let rank=1;rank<=12;rank++)assert.equal(raceReward(rank,false,1000),0);
});
test('malformed ranks and pickup amounts cannot create invalid payouts',()=>{
 for(const rank of [0,-1,1.5,NaN,Infinity,'1'])assert.equal(raceReward(rank,true,20),0);
 assert.equal(raceReward(1,true,-100),200);assert.equal(raceReward(1,true,NaN),200);assert.equal(raceReward(1,true,Infinity),200);assert.equal(raceReward(1,true,10.8),210);
});
test('old mode selection is discarded while earned progress and selected map survive',()=>{
 const p=migrateSave({version:3,difficulty:'master',coins:742,wins:4,races:11,track:'cloud-serpentine',bestTracks:{'cloud-serpentine':54.87,'grand-tour-v2':52.43},skin:'gold',unlocked:['duck','gold'],ownedAccessories:['royal','galaxy','stardust'],loadout:{head:'royal',back:'galaxy',trail:'stardust',color:'#b891ff'}});
 assert.equal(p.version,4);assert.equal('difficulty' in p,false);assert.equal(p.coins,742);assert.equal(p.wins,4);assert.equal(p.races,11);assert.equal(p.best,54.87);assert.equal(p.bestTracks['grand-tour-v2'],52.43);assert.equal(p.skin,'gold');assert.equal(p.loadout.back,'galaxy');
});
