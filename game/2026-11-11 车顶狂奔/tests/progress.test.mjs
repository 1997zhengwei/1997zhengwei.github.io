import test from 'node:test';
import assert from 'node:assert/strict';
import {mapProgress,nextMapStage} from '../src/progress.mjs';

test('new map has three unfinished stages and starts at the first',()=>{
 assert.deepEqual(mapProgress({},0),{passed:[false,false,false],count:0,complete:false,nextStage:0});
});

test('one-star finishes count, and another map cannot complete this map',()=>{
 const runs={'0-0':{stars:1},'0-1':{stars:2},'1-2':{stars:3},'0-2':{stars:0}};
 assert.deepEqual(mapProgress(runs,0),{passed:[true,true,false],count:2,complete:false,nextStage:2});
 assert.equal(nextMapStage(runs,0,1),2);
});

test('clearing stage three first directs the player to a missing stage',()=>{
 const runs={'2-2':{stars:3}};
 assert.equal(mapProgress(runs,2).complete,false);
 assert.equal(nextMapStage(runs,2,2),0);
 runs['2-0']={stars:1};
 assert.equal(nextMapStage(runs,2,0),1);
});

test('all three clears finish a map without wrapping into a different map',()=>{
 for(let world=0;world<3;world++){
  const runs=Object.fromEntries([0,1,2].map(stage=>[`${world}-${stage}`,{stars:stage+1,time:30-stage}]));
  const snapshot=JSON.stringify(runs);
  assert.equal(mapProgress(runs,world).complete,true);
  assert.equal(mapProgress(runs,world).count,3);
  assert.equal(mapProgress(runs,world).nextStage,0);
  for(let stage=0;stage<3;stage++)assert.equal(nextMapStage(runs,world,stage),null);
  assert.equal(JSON.stringify(runs),snapshot,'reading progress preserves scores and records');
 }
});
