import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, groundHeight, floorHeight, tide, build, harvest, craftAxe, validateBuild, collides, findPath, advance, rescue, restore, shelter, interactBuilding, DECK } from '../src/rules.mjs';
function stocked() { const s = createState(); s.inventory = { wood: 100, stone: 100, fiber: 100, metal:0 }; return s; }
function home(s) { assert.ok(build(s,'platform',-2.2,2.2).ok); assert.ok(build(s,'cabin',-2.2,2.2).ok); assert.ok(build(s,'fire',-2.2,2.2).ok); }
test('a new player can collect material, spend it, and cannot overspend', () => {
  const s=createState(); s.player={x:0,z:4.7,angle:0};
  assert.ok(harvest(s,'wood-0').ok); assert.equal(s.inventory.wood,3);
  assert.equal(harvest(s,'wood-0').ok,false);
  assert.equal(build(s,'platform',0,4.4).ok,false);
  s.player.x=1.8; harvest(s,'wood-1'); assert.equal(s.inventory.wood,6);
  assert.ok(build(s,'platform',0,4.4).ok); assert.equal(s.inventory.wood,2);
  assert.equal(floorHeight(s,0,4.4),DECK);
});
test('the reef is inaccessible across water until supported bridge sections connect it', () => {
  const s=stocked();s.axe=true;s.player={x:5,z:-2.2};
  assert.equal(findPath(s,{x:13.2,z:-2.2}).reachable,false);
  assert.equal(validateBuild(s,'bridge',8.8,-2.2).ok,false);
  assert.ok(build(s,'bridge',6.6,-2.2).ok);assert.ok(build(s,'bridge',8.8,-2.2).ok);assert.ok(build(s,'bridge',11,-2.2).ok);
  assert.ok(findPath(s,{x:12,z:-2.2}).reachable);
  assert.equal(validateBuild(s,'remove',6.6,-2.2).ok,true); // both islands anchor the completed span
  const t=stocked();t.axe=true;t.player={x:5,z:-2.2};
  build(t,'bridge',6.6,-2.2);build(t,'bridge',8.8,-2.2);
  assert.equal(validateBuild(t,'remove',6.6,-2.2).ok,false);
  assert.ok(build(t,'remove',8.8,-2.2).ok);
});
test('rotated cabin doors are passable while visible walls block movement', () => {
  for(let r=0;r<4;r++){
    const s=stocked();build(s,'platform',-2.2,2.2);build(s,'cabin',-2.2,2.2,r);
    const a=r*Math.PI/2, front={x:-2.2+Math.sin(a)*.97,z:2.2+Math.cos(a)*.97};
    const side={x:-2.2+Math.cos(a)*.97,z:2.2-Math.sin(a)*.97};
    assert.equal(collides(s,front.x,front.z),false,`door ${r}`);assert.equal(collides(s,side.x,side.z),true,`wall ${r}`);
  }
});
test('platform stairs provide standing support at the rendered step heights and rotate with the platform',()=>{
  for(let r=0;r<4;r++){
    const s=stocked();build(s,'platform',0,4.4,r);const a=r*Math.PI/2;
    const x=Math.sin(a)*1.45,z=4.4+Math.cos(a)*1.45;
    assert.ok(Math.abs(floorHeight(s,x,z)-1.20)<.001);
  }
});
test('a roof protects a lit fire, a platform keeps the player dry, and braces improve recovery',()=>{
  const s=stocked();home(s);s.player={x:-2.2,z:2.4};s.time=190;s.warmth=50;
  assert.ok(shelter(s).cozy);advance(s,1);assert.equal(s.warmth,53);
  build(s,'brace',-2.2,2.2);advance(s,1);assert.equal(s.warmth,60);
  assert.ok(s.buildings.find(b=>b.type==='fire').lit);
  const t=stocked();build(t,'fire',0,4.4);t.time=190;advance(t,4);assert.equal(t.buildings[0].lit,false);
});
test('reef exploration and a braced warm home earn a single storm result; free build ends exposure',()=>{
  const s=stocked();home(s);build(s,'brace',-2.2,2.2);s.player={x:-2.2,z:2.4};s.visitedReef=true;s.time=190;
  assert.ok(advance(s,12.1).includes('win'));assert.equal(advance(s,1).includes('win'),false);
  s.free=true;assert.equal(tide(s).stage,'peace');assert.equal(tide(s).rain,0);
});
test('automatic collection is capped, collectible only nearby, and demolition refunds the full tile once',()=>{
  const s=stocked();s.player={x:4,z:3};build(s,'net',4.4,4.4);
  advance(s,24);let net=s.buildings.find(b=>b.type==='net');assert.equal(net.stored,4);
  advance(s,70);assert.equal(net.stored,8);
  const before=s.inventory.wood;assert.ok(interactBuilding(s,net.id).ok);assert.equal(s.inventory.wood,before+8);assert.equal(net.stored,0);
  s.player={x:0,z:3.6};home(s);build(s,'brace',-2.2,2.2);const spent=s.inventory.wood;
  assert.ok(build(s,'remove',-2.2,2.2).ok);assert.equal(s.inventory.wood,spent+13);
  assert.equal(build(s,'remove',-2.2,2.2).ok,false);
});
test('recovery keeps the camp and materials and returns above high tide; valid saves restore them',()=>{
  const s=stocked();home(s);const inventory={...s.inventory};s.warmth=0;s.time=190;rescue(s);
  assert.deepEqual(s.inventory,inventory);assert.equal(s.buildings.length,3);assert.ok(groundHeight(s.player.x,s.player.z)>1.16);
  const next=restore(JSON.parse(JSON.stringify(s)));assert.equal(next.buildings.length,3);assert.deepEqual(next.inventory,inventory);
  assert.equal(restore({version:999}),null);assert.ok(restore({version:1,inventory:{wood:NaN},buildings:[{type:'unknown',x:0,z:0}]}));
});
