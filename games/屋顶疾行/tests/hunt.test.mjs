import test from 'node:test';
import assert from 'node:assert/strict';
import {createHuntSession,stepHunt,settleHunt,canCapture,useHuntTool} from '../src/hunt.mjs';
import {startSession} from '../src/physics.mjs';
import {normalizeSave} from '../src/progress.mjs';
import {treasureSites,safeTreasurePoint,chooseTreasure} from '../src/treasure-sites.mjs';
import {supportAt,box} from '../src/world.mjs';
const tick=(w,controls,seconds)=>{for(let i=0;i<seconds*120&&w.mode==='running';i++)stepHunt(w,controls,1/120);};

test('hunt waits for the first movement, starts with three lives and three slower visible pursuers',()=>{
 const w=startSession(createHuntSession(42),{waitForMove:true});const before=w.hunt.pursuers.map(b=>({...b.state.player}));tick(w,{},2);assert.equal(w.elapsed,0);assert.equal(w.hunt.lives,3);assert.equal(w.hunt.pursuers.length,3);assert.ok(w.hunt.pursuers.every(b=>b.speed<6.8));for(let i=0;i<3;i++)assert.equal(w.hunt.pursuers[i].state.player.z,before[i].z);
 tick(w,{x:.2},.2);assert.ok(w.elapsed>0);assert.ok(w.hunt.pursuers.every(b=>b.state.player.z===12.4));
});
test('a fall costs exactly one life and the third fall ends the hunt',()=>{
 const w=startSession(createHuntSession(42));
 for(let remaining=2;remaining>=0;remaining--){Object.assign(w.player,{x:94,y:10,z:20,grounded:false,vy:-10});stepHunt(w,{},1/120);assert.equal(w.hunt.lives,remaining);assert.equal(w.stats.falls,3-remaining);if(remaining){tick(w,{},.08);assert.equal(w.hunt.lives,remaining);assert.ok(w.hunt.protectedUntil>w.elapsed);}}
 assert.equal(w.hunt.status,'lost');assert.equal(w.hunt.reason,'lives');assert.equal(w.mode,'finished');
});
test('being caught fails immediately even with all three lives left; spawn protection is explicit',()=>{
 const w=startSession(createHuntSession(42));w.elapsed=5;w.hunt.headStart=0;const bot=w.hunt.pursuers[0];Object.assign(bot.state.player,{...w.player,x:w.player.x+.4});w.hunt.protectedUntil=6;stepHunt(w,{},1/120);assert.equal(w.hunt.status,'running');w.hunt.protectedUntil=0;stepHunt(w,{},1/120);assert.equal(w.hunt.status,'lost');assert.equal(w.hunt.reason,'caught');assert.equal(w.hunt.lives,3);const save=normalizeSave({coins:31});assert.equal(settleHunt(w,save).reward,0);assert.equal(save.coins,31);
});
test('nearby pursuers cannot catch through a solid wall or from a different rooftop height',()=>{
 const a={x:0,y:22,z:0},b={x:0,y:22,z:.8};assert.ok(canCapture({solids:[]},a,b));assert.equal(canCapture({solids:[box('wall',0,23,.4,2,2,.12)]},a,b),false);assert.equal(canCapture({solids:[]},a,{...b,y:25}),false);
});
test('each random treasure location is supported, reachable by navigation, and awards a win only once',()=>{
 const w=startSession(createHuntSession(42)),save=normalizeSave({coins:117,owned:['chalk','cobalt'],look:'cobalt',best:{time:81.7,score:100,falls:0}});
 for(const t of treasureSites(w.map)){const s=supportAt(w.map,t.x,t.z,t.y+.05);assert.ok(s&&Math.abs(s.maxY-t.y)<.08,t.id);assert.ok(w.hunt.nav.path(w.player,t).length>0,'no route to '+t.id);}
 Object.assign(w.player,w.hunt.treasure);stepHunt(w,{},1/120);assert.equal(w.hunt.status,'won');const result=settleHunt(w,save);assert.ok(result.reward>=16&&result.reward<=28);const paid=save.coins;assert.equal(settleHunt(w,save),null);assert.equal(save.coins,paid);assert.equal(save.huntWins,1);assert.equal(save.look,'cobalt');assert.equal(save.best.time,81.7);
});
test('pursuers actually cross roofs using jumps, vaults and climbs rather than closing distance by teleport',()=>{
 const w=startSession(createHuntSession(42));Object.assign(w.player,{x:64,y:24,z:-60});w.hunt.headStart=0;let previous=w.hunt.pursuers.map(b=>({...b.state.player}));
 for(let i=0;i<120*32&&w.mode==='running';i++){stepHunt(w,{},1/120);for(let j=0;j<3;j++){const p=w.hunt.pursuers[j].state.player;assert.ok(Math.hypot(p.x-previous[j].x,p.z-previous[j].z)<.19,'horizontal teleport');previous[j]={...p};}}
 assert.equal(w.hunt.reason,'caught');assert.ok(w.elapsed<32);assert.ok(w.hunt.pursuers.some(b=>b.state.stats.jumps>0&&b.state.stats.climbs>0));assert.ok(w.hunt.pursuers.every(b=>b.falls===0));
});

test('expanded district has safe randomized treasure on 21 roofs, including the new north and east extensions',()=>{
 const w=createHuntSession(42),sites=treasureSites(w.map),roofs=new Set(sites.map(s=>s.roofId));assert.equal(roofs.size,21);assert.ok(sites.some(s=>s.x>82));assert.ok(sites.some(s=>s.z< -114));
 let last=null;const seen=new Set();
 for(let seed=1;seed<=48;seed++){const t=chooseTreasure(w.map,w.hunt.nav,seed,last);assert.ok(safeTreasurePoint(w.map,t));assert.notEqual(t.roofId,last);assert.deepEqual(chooseTreasure(w.map,w.hunt.nav,seed,last),t,'retry changed position');seen.add(t.roofId);last=t.roofId;}
 assert.ok(seen.size>=15,'random draws cluster on too few roofs');
});

test('smoke has one charge per hunt, pauses nearby pursuers, and never grants permanent immunity',()=>{
 const w=startSession(createHuntSession(42,{tool:'smoke'}));w.hunt.headStart=0;const b=w.hunt.pursuers[0];Object.assign(b.state.player,{x:6,y:22,z:10});for(const other of w.hunt.pursuers.slice(1))Object.assign(other.state.player,{x:64,y:24,z:-60});
 assert.ok(useHuntTool(w));assert.equal(w.hunt.charges,0);assert.equal(useHuntTool(w),false);const pos={x:b.state.player.x,z:b.state.player.z};tick(w,{},1);assert.deepEqual({x:b.state.player.x,z:b.state.player.z},pos);tick(w,{},2.3);assert.ok(Math.hypot(b.state.player.x-pos.x,b.state.player.z-pos.z)>.2);
 const distant=startSession(createHuntSession(42,{tool:'smoke'}));for(const bot of distant.hunt.pursuers)Object.assign(bot.state.player,{x:64,y:24,z:-60});assert.equal(useHuntTool(distant),false);assert.equal(distant.hunt.charges,1);
});

test('feather prevents only the first fall loss; capture still ends the hunt immediately',()=>{
 const w=startSession(createHuntSession(42,{tool:'feather'}));
 for(let fall=1;fall<=2;fall++){Object.assign(w.player,{x:140,y:10,z:30,grounded:false,vy:-10});stepHunt(w,{},1/120);assert.equal(w.hunt.lives,fall===1?3:2);assert.equal(w.hunt.charges,0);}
 w.hunt.protectedUntil=0;w.hunt.headStart=0;Object.assign(w.hunt.pursuers[0].state.player,{...w.player,x:w.player.x+.3});stepHunt(w,{},1/120);assert.equal(w.hunt.reason,'caught');assert.equal(w.hunt.lives,2);
});

test('compass gives a real connected route and next level preserves progress without repeating the last roof',()=>{
 const save=normalizeSave({coins:213,look:'cobalt',owned:['chalk','cobalt'],huntLevel:7}),w=startSession(createHuntSession(83,{level:7,tool:'compass'}));assert.ok(w.hunt.guidePath.length>10);Object.assign(w.player,w.hunt.treasure);stepHunt(w,{},1/120);const result=settleHunt(w,save);assert.equal(result.reward,28);assert.equal(save.huntLevel,8);assert.equal(save.huntLastRoof,w.hunt.treasure.roofId);assert.equal(settleHunt(w,save),null);
 const loaded=normalizeSave(JSON.parse(JSON.stringify(save))),next=createHuntSession(83,{level:loaded.huntLevel,avoidRoof:loaded.huntLastRoof});assert.equal(next.hunt.level,8);assert.notEqual(next.hunt.treasure.roofId,w.hunt.treasure.roofId);assert.equal(loaded.coins,241);assert.equal(loaded.look,'cobalt');
});

test('pursuers can physically reach the new far north-east rooftop',()=>{
 const w=startSession(createHuntSession(42));Object.assign(w.player,{x:96,y:25.4,z:-128});w.hunt.headStart=0;
 for(let i=0;i<120*60&&w.mode==='running';i++)stepHunt(w,{},1/120);
 assert.equal(w.hunt.reason,'caught',JSON.stringify(w.hunt.pursuers.map(b=>({p:b.state.player,falls:b.falls}))));assert.ok(w.hunt.pursuers.some(b=>b.state.player.z< -114&&b.state.player.x>82));
});
