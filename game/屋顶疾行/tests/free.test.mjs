import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,startSession,stepSession,bankFlow,setSessionMarker,returnToMarker,respawn} from '../src/physics.mjs';
import {supportAt} from '../src/world.mjs';
import {FREE_SPAWNS} from '../src/free-world.mjs';
import {normalizeSave} from '../src/progress.mjs';
const tick=(w,input,seconds)=>{for(let i=0;i<seconds*120;i++)stepSession(w,input,1/120);};

test('free district has real surfaces in four directions and every selectable spawn stands on a roof',()=>{
 const w=createSession({free:true});assert.equal(w.map.roofs.length,25);assert.deepEqual(w.map.gates,[]);
 for(const spawn of FREE_SPAWNS){const s=createSession({free:true,spawn:spawn.id});const b=supportAt(s.map,s.player.x,s.player.z,s.player.y+.1);assert.ok(b);assert.ok(Math.abs(b.maxY-s.player.y)<.05);}
 assert.ok(w.map.roofs.some(r=>r.x<0));assert.ok(w.map.roofs.some(r=>r.x>0));assert.ok(w.map.links.length>8);
});
test('rooftops can be visited in any order and returning north or south never ends free roam',()=>{
 const w=startSession(createSession({free:true}));
 for(const r of[w.map.roofs[15],w.map.roofs[0],w.map.roofs[7],w.map.roofs[1]]){
  Object.assign(w.player,{x:r.x,y:r.y,z:r.z,grounded:true,vx:0,vz:0,vy:0});tick(w,{},.1);assert.equal(w.location,r.name);assert.equal(w.finished,false);assert.equal(w.gate,0);
 }
 assert.equal(w.visited.size,4);assert.equal(w.record.length,0);
});
test('real vaults build a chain, safe expiry banks coins once, and falls lose only the pending chain',()=>{
 const w=startSession(createSession({free:true}));Object.assign(w.player,{z:5.3,vz:-9.6,speed:9.6});tick(w,{z:-1,sprint:true,jump:true},1/120);tick(w,{z:-1,sprint:true},.4);
 assert.equal(w.stats.vaults,1);assert.ok(w.chain>=90);tick(w,{},6);assert.equal(w.chain,0);assert.ok(w.earnedCoins>0);const coins=w.earnedCoins;assert.equal(bankFlow(w),0);assert.equal(w.earnedCoins,coins);
 w.chain=500;respawn(w);assert.equal(w.chain,0);assert.equal(w.earnedCoins,coins);assert.equal(w.penalty,0);
});
test('personal practice marker requires a safe surface and can be revisited without a checkpoint sequence',()=>{
 const w=startSession(createSession({free:true}));assert.ok(setSessionMarker(w));const marker={...w.marker};w.player.x=8;w.player.z=-6;assert.ok(returnToMarker(w));assert.equal(w.player.x,marker.x);assert.equal(w.player.z,marker.z);
 w.player.grounded=false;assert.equal(setSessionMarker(w),false);assert.deepEqual(w.marker,marker);
});
test('free flow progression is added without discarding existing outfits, coins or historic best',()=>{
 const s=normalizeSave({coins:120,look:'cobalt',owned:['chalk','cobalt'],best:{time:81.7,score:500,falls:1},freeBest:380,freeDistance:190.5,totalFlow:740});assert.equal(s.coins,120);assert.equal(s.look,'cobalt');assert.equal(s.best.time,81.7);assert.equal(s.freeBest,380);assert.equal(s.freeDistance,190.5);assert.equal(s.totalFlow,740);
});
