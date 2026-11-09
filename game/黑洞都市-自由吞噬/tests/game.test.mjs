import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSES,THINGS,CRUISE_SPEED,BOOST_MULTIPLIER,speedFor,createWorld,stepWorld,botInput,radiusFor,canEat,triggerJump,triggerPower,podiumPrize,resultFor,settle,defaultSave,buyLook,normalizeSave} from '../src/rules.mjs';
test('growth opens new edible objects, rather than only changing a score',()=>{
 const p={radius:radiusFor(0),h:0};assert.equal(canEat(p,{type:'car'}),false);p.radius=radiusFor(100);assert.equal(canEat(p,{type:'car'}),true);assert.equal(canEat(p,{type:'tower'}),false);p.radius=radiusFor(650);assert.equal(canEat(p,{type:'tower'}),true);p.h=1;assert.equal(canEat(p,{type:'can'}),false);
});
test('jump is single-use in the air and landings restore it',()=>{const w=createWorld();w.mode='race';const p=w.players[0];assert.equal(triggerJump(p),true);assert.equal(triggerJump(p),false);for(let i=0;i<80;i++)stepWorld(w,1/60);assert.equal(p.h,0);assert.equal(triggerJump(p),true);});
test('a missed bridge costs a shield and visibly returns to a safe checkpoint',()=>{
 const w=createWorld();w.mode='race';const p=w.players[0];p.s=w.gaps[0].s-.02;p.checkpoint=w.gaps[0].s-14;stepWorld(w,.03);assert.equal(p.health,2);assert.ok(p.fall>0);for(let i=0;i<45;i++)stepWorld(w,1/60);assert.equal(p.fall,0);assert.ok(p.s<w.gaps[0].s);assert.equal(p.h,0);
});
test('pause freezes race, rivals, cooldown and score',()=>{const w=createWorld();w.mode='paused';w.players[0].cooldown=5;const before=JSON.stringify(w.players);stepWorld(w,.05,{power:true,jump:true,move:1});assert.equal(JSON.stringify(w.players),before);assert.equal(w.time,0);});
test('power cannot be spammed to bypass its cooldown',()=>{const w=createWorld();const p=w.players[0];assert.equal(triggerPower(p),true);assert.equal(triggerPower(p),false);assert.equal(p.cooldown,7);});
test('courses do not spawn loot inside the bridge gaps and have escalating food',()=>{for(const c of COURSES){const w=createWorld(c.id,1);assert.ok(w.items.length>100);for(const i of w.items){assert.ok(THINGS[i.type]);assert.equal(w.gaps.some(g=>i.s>=g.s&&i.s<=g.end),false);}assert.ok(w.items.some(i=>i.type==='tower'));}});
test('all three courses can be completed using real movement, jump, collection and shared AI rules',()=>{
 for(const c of COURSES){const w=createWorld(c.id,741);for(let frame=0;frame<6000&&w.mode!=='result';frame++){const p=w.players[0];stepWorld(w,1/60,botInput(w,p));}const r=resultFor(w);assert.equal(r.finished,true,c.id);assert.ok(r.radius>2.5,c.id+' must actually grow');assert.ok(r.count>30);assert.ok(r.time<75);assert.ok(r.rank<=3);}
});
test('only podium finishes award coins; settlement is once only',()=>{
 assert.deepEqual([1,2,3,4].map(podiumPrize),[200,140,100,0]);const w=createWorld(),save=defaultSave();assert.equal(settle(w,save).coins,0);assert.equal(save.coins,0);
 const v=createWorld();v.mode='result';v.players[0].finished=true;v.players[0].finishTime=42;v.players[1].finished=true;v.players[1].finishTime=40;assert.equal(settle(v,save).coins,140);settle(v,save);assert.equal(save.coins,140);
});
test('owned looks do not charge twice and failed purchases do not modify saves',()=>{const s=defaultSave(),before=JSON.stringify(s);assert.equal(buyLook(s,'royal').ok,false);assert.equal(JSON.stringify(s),before);s.coins=200;assert.equal(buyLook(s,'berry').ok,true);assert.equal(s.coins,100);assert.equal(buyLook(s,'berry').ok,true);assert.equal(s.coins,100);assert.equal(s.look,'berry');const loaded=normalizeSave(JSON.parse(JSON.stringify(s)));assert.equal(loaded.look,'berry');assert.equal(loaded.coins,100);assert.deepEqual(loaded.owned,['cyan','berry']);});
test('no seed grants a rival a higher cruise or boost speed',()=>{for(let seed=1;seed<=40;seed++){const w=createWorld('city',seed);for(const p of w.players){assert.equal(p.speed,CRUISE_SPEED);assert.equal(speedFor(p),CRUISE_SPEED);triggerPower(p);assert.equal(speedFor(p),CRUISE_SPEED*BOOST_MULTIPLIER);p.power=0;assert.equal(speedFor(p),CRUISE_SPEED);}}});
test('a jump at the start of the visible cue clears even the widest bridge',()=>{for(const c of COURSES){const w=createWorld(c.id,741);w.mode='race';const p=w.players[0],g=w.gaps.at(-1);p.s=g.s-5.95;stepWorld(w,1/60,{jump:true});for(let n=0;n<85;n++)stepWorld(w,1/60);assert.equal(p.health,3,c.id);assert.equal(p.stumbles,0,c.id);assert.ok(p.s>g.end,c.id);}});
test('a rookie can recover from a missed takeoff instead of missing the same gap forever',()=>{const w=createWorld('city',741);w.mode='race';const p=w.players[3],g=w.gaps[0];p.s=g.s+1;p.checkpoint=g.s-14;p.miss=g.s;p.checkedGaps.push(g.s);stepWorld(w,1/60);assert.equal(p.health,2);for(let n=0;n<210;n++)stepWorld(w,1/60);assert.ok(p.s>g.end);assert.equal(p.stumbles,1);assert.equal(p.miss,0);});
test('AI boosts have deliberate spacing beyond the shared seven-second cooldown',()=>{const w=createWorld('city',741);for(let n=0;n<2500&&w.mode!=='result';n++)stepWorld(w,1/60,botInput(w,w.players[0]));const [regular,technical,rookie]=w.players.slice(1);assert.ok(technical.boostCount<=3);assert.ok(regular.boostCount<=3);assert.ok(rookie.boostCount<=1);});
test('a collected core grows the hole and reduces cooldown once, for its actual owner',()=>{
 const w=createWorld('city',11);w.mode='race';w.hazards=[];const p=w.players[0];w.items=[{id:900,type:'core',x:0,s:.3,color:1,state:'idle'}];p.cooldown=5;stepWorld(w,1/60);assert.equal(p.cores,1);assert.equal(p.mass,12);assert.ok(p.cooldown<4.2&&p.cooldown>4.1);assert.equal(w.items[0].owner,0);assert.equal(w.players[1].cores,0);for(let n=0;n<5;n++)stepWorld(w,1/60);assert.equal(p.cores,1);assert.equal(p.mass,12);
});
test('a moving barrier updates its collision position and a real jump clears it',()=>{
 for(const jump of[false,true]){const w=createWorld('city',11);w.mode='race';const p=w.players[0],barrier={id:101,s:10,x:0,state:'idle',kind:'sweeper',phase:-.4,hitBy:[]};w.hazards=[barrier];w.items=[];p.s=5.2;for(let n=0;n<70;n++)stepWorld(w,1/60,{jump:n===0&&jump});assert.notEqual(barrier.x,0);assert.equal(p.health,jump?3:2);assert.equal(p.stumbles,jump?0:1);assert.ok(p.s>10);}
});
test('supply lanes and moving barriers have safe separation from every bridge',()=>{
 for(const c of COURSES){const w=createWorld(c.id,1);assert.ok(w.caches.length>=3);assert.equal(w.items.filter(i=>i.type==='core').length,w.caches.length*5);for(const h of w.hazards.filter(h=>h.kind==='sweeper'))assert.ok(w.gaps.every(g=>h.s<g.s-18||h.s>g.end+18));const again=createWorld(c.id,2);assert.ok(again.players.every(p=>p.cores===0));assert.ok(again.items.filter(i=>i.type==='core').every(i=>i.state==='idle'));}
});
