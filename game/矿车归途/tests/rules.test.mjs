import test from 'node:test';
import assert from 'node:assert/strict';
import {PUZZLES} from '../src/puzzles.mjs';
import {simulate,tracksFromRoutes,nextDirection,canBuild,point,isSwitch,allTracks} from '../src/rail-engine.mjs';
for(const l of PUZZLES)test(`${l.id}: authored puzzle completes in numbered order within budget`,()=>{
  assert.ok(Object.keys(l.solution).length<=l.budget);for(const k of Object.keys({...l.fixed,...l.solution}))assert.ok(canBuild(l,point(k)),`${l.id}: ${k} is blocked`);
  const r=simulate(l,l.solution,l.solutionSwitches);assert.equal(r.ok,true,JSON.stringify(r.failure));assert.deepEqual(r.coupled,l.cars.map(c=>c.id));
});
function fixture(cars,routes,exit,w=5,h=3,extra={}){return {w,h,cars,exit,blocked:[],budget:99,fixed:tracksFromRoutes(routes,cars,exit),...extra};}
test('Equal-length approaches collide at a shared junction',()=>{
  const l=fixture([{id:1,p:[0,0],dir:'E'},{id:2,p:[0,2],dir:'E'}],[[[0,0],[1,0],[2,0],[2,1],[3,1],[4,1]],[[0,2],[1,2],[2,2],[2,1],[3,1],[4,1]]],[4,1]);
  const r=simulate(l);assert.equal(r.ok,false);assert.equal(r.failure.type,'collision');assert.deepEqual(r.failure.p,[2,1]);assert.equal(r.failure.tick,3);
});
test('A connected but too-short route for car 2 fails the coupling order',()=>{
  const l=fixture([{id:1,p:[0,0],dir:'E'},{id:2,p:[2,2],dir:'E'}],[[[0,0],[1,0],[2,0],[3,0],[3,1],[4,1]],[[2,2],[3,2],[3,1],[4,1]]],[4,1]);
  const r=simulate(l);assert.equal(r.failure.type,'order');assert.equal(r.failure.car,2);assert.equal(r.failure.expected,1);assert.deepEqual(r.coupled,[]);
});
test('Head-on edge swaps count as collisions',()=>{
  const l={w:4,h:1,cars:[{id:1,p:[0,0],dir:'E'},{id:2,p:[1,0],dir:'W'}],exit:[3,0],blocked:[],budget:0,fixed:Object.fromEntries([0,1,2,3].map(x=>[`${x},0`,{ports:'EW'}]))};assert.equal(simulate(l).failure.type,'collision');
});
test('Following on the same rail one tile apart is safe',()=>{
  const l={w:5,h:1,cars:[{id:1,p:[1,0],dir:'E'},{id:2,p:[0,0],dir:'E'}],exit:[4,0],blocked:[],budget:0,fixed:Object.fromEntries([0,1,2,3,4].map(x=>[`${x},0`,{ports:'EW'}]))};const r=simulate(l);assert.equal(r.ok,true);assert.deepEqual(r.coupled,[1,2]);assert.equal(r.ticks,4);
  const delayed=simulate({...l,signals:{'0,0':2}});assert.equal(delayed.ok,true);assert.equal(delayed.ticks,6);
});
test('Rail endpoints must be reciprocal',()=>{
  const l={w:3,h:1,cars:[{id:1,p:[0,0],dir:'E'}],exit:[2,0],blocked:[],budget:0,fixed:{'0,0':{ports:'EW'},'1,0':{ports:'NS'},'2,0':{ports:'EW'}}};assert.equal(simulate(l).failure.type,'derail');
});
test('A switch changes the chosen forward branch but preserves trailing merges',()=>{
  assert.equal(nextDirection({ports:'NEW',stem:'W',switch:0},'W'),'N');assert.equal(nextDirection({ports:'NEW',stem:'W',switch:1},'W'),'E');assert.equal(nextDirection({ports:'NEW',stem:'W',switch:0},'N'),'W');
});
test('The branch puzzle genuinely fails before its switch is changed',()=>{const l=PUZZLES[8];assert.equal(simulate(l,l.solution,{}).failure.type,'collision');assert.equal(simulate(l,l.solution,{'2,5':1}).ok,true);});
test('Automatic joins ignore accidental or legacy switch settings',()=>{const l=PUZZLES[4],join=l.fixed['5,2'];assert.equal(isSwitch(join),false);assert.equal(allTracks(l,l.solution,{'5,2':1})['5,2'].switch,join.switch);assert.equal(simulate(l,l.solution,{'5,2':1}).ok,true);assert.equal(isSwitch(PUZZLES[8].fixed['2,5']),true);});
test('The linked tunnel transports car 1 and does not ping-pong',()=>{const l=PUZZLES[7],r=simulate(l,l.solution);assert.equal(r.ok,true);assert.equal(r.events.filter(e=>e.type==='tunnel'&&e.id===1).length,1);});
test('The marked waiting gate is needed to fix the arrival order',()=>{const l=PUZZLES[5];assert.equal(simulate(l,l.solution).ok,true);assert.equal(simulate({...l,signals:{}},l.solution).failure.type,'order');});
test('The number of editable tiles, not route length, consumes the stock',()=>{const l=PUZZLES[0];assert.equal(simulate({...l,budget:2},l.solution).failure.type,'budget');assert.equal(simulate(l,l.solution).ok,true);});
test('A loop terminates with a useful failure rather than running forever',()=>{
  const l={w:4,h:2,cars:[{id:1,p:[0,0],dir:'E'}],exit:[3,0],blocked:[],budget:0,fixed:{'0,0':{ports:'ESW',stem:'E'},'1,0':{ports:'SW'},'1,1':{ports:'NW'},'0,1':{ports:'NE'},'3,0':{ports:'EW'}}};assert.equal(simulate(l).failure.type,'loop');
});
test('Simulation is deterministic and does not mutate editable or fixed tracks',()=>{const l=PUZZLES[9],before=JSON.stringify(l),a=simulate(l,l.solution,l.solutionSwitches),b=simulate(l,l.solution,l.solutionSwitches);assert.deepEqual(a,b);assert.equal(JSON.stringify(l),before);});
