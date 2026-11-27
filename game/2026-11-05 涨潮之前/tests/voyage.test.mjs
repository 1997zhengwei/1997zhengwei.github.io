import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createState,restore,build,validateBuild,tide,advance,rescue,interactBuilding,floorHeight,collides,findPath} from '../src/rules.mjs';
import {beginDayTwo,dockLaunch,createBoat,boardBoat,boardingApproach,moveBoat,canSail,findBoatPath,landingPoint,disembark,salvage,craftWarmer,useWarmer,advanceVoyage,recallBoat} from '../src/voyage.mjs';
import {SALVAGE,WRECK_MOORING,wreckPoint} from '../src/voyage-state.mjs';
const legacy=JSON.parse(fs.readFileSync(new URL('./fixtures/day1-complete.json',import.meta.url),'utf8'));
function ready(){const s=restore(structuredClone(legacy));beginDayTwo(s);s.inventory={wood:100,stone:100,fiber:100,metal:0};s.player={x:8.8,z:-2.2,angle:0};return s;}
function boatReady(){const s=ready();assert.ok(build(s,'dock',8.8,-2.2,2).ok);assert.ok(createBoat(s).ok);return s;}
test('real v1 completion migrates without changing camp positions, rotations, resources, axe, or discoveries',()=>{
  const s=restore(legacy);assert.equal(s.version,4);assert.equal(s.voyage.started,false);
  assert.deepEqual(s.buildings,legacy.buildings);assert.deepEqual(s.player,legacy.player);
  for(const key of ['wood','stone','fiber'])assert.equal(s.inventory[key],legacy.inventory[key]);assert.equal(s.inventory.metal,0);
  assert.equal(s.axe,legacy.axe);assert.deepEqual(s.milestones,legacy.milestones);assert.equal(s.visitedReef,true);
  const before=structuredClone(s.buildings);beginDayTwo(s);assert.deepEqual(s.buildings,before);assert.equal(s.day,2);assert.match(tide(s).name,/第二天/);
  assert.equal(beginDayTwo(createState()),false);
});
test('an unfinished v1 island keeps its first-day weather and objectives until the player wins',()=>{
  const raw=structuredClone(legacy);raw.won=false;raw.free=false;raw.time=188;
  const s=restore(raw);assert.equal(beginDayTwo(s),false);assert.equal(s.voyage.started,false);assert.equal(tide(s).stage,'storm');assert.deepEqual(s.buildings,legacy.buildings);
});
test('dock needs a clear water-facing foundation, and boat creation is paid exactly once',()=>{
  const s=ready();assert.equal(validateBuild(s,'dock',-2.2,2.2).ok,false);assert.equal(validateBuild(s,'dock',8.8,-2.2,{rotation:1}).ok,false);
  assert.ok(build(s,'dock',8.8,-2.2,2).ok);const wood=s.inventory.wood;assert.ok(createBoat(s).ok);assert.equal(s.inventory.wood,wood-8);
  assert.equal(createBoat(s).ok,false);assert.equal(s.inventory.wood,wood-8);
  s.player={x:0,z:3.6};assert.equal(boardBoat(s).ok,false);s.player={x:8.8,z:-2.2};assert.ok(boardBoat(s).ok);
});
test('boat routes around the island, collision blocks land, and dock supports safe boarding/disembarking',()=>{
  const s=boatReady();const launch={...s.voyage.boat};boardBoat(s);
  assert.equal(canSail(s,0,0),false);assert.equal(canSail(s,8.8,-2.2),false);assert.ok(canSail(s,launch.x,launch.z));
  const route=findBoatPath(s,WRECK_MOORING);assert.ok(route.reachable);assert.ok(route.points.length>20);
  assert.ok(route.points.every(p=>canSail(s,p.x,p.z)));assert.ok(landingPoint(s));
  const before=s.warmth;advance(s,1);assert.ok(s.warmth>before-2,'boat prevents swimming exposure');
  assert.ok(disembark(s).ok);assert.equal(s.voyage.boat.aboard,false);assert.ok(floorHeight(s,s.player.x,s.player.z)>tide(s).water);
  boardBoat(s);for(let i=0;i<100;i++)moveBoat(s,0,-1,.04);assert.ok(s.voyage.distance>10);
});
test('salvage has real distance/tide/cooldown rules, grants metal, and the optional hold yields a keepsake',()=>{
  const s=boatReady();boardBoat(s);assert.equal(salvage(s,'drift').ok,false);
  const p=SALVAGE[0];s.voyage.boat.x=p.x+1.8;s.voyage.boat.z=p.z;s.player.x=p.x+1.8;s.player.z=p.z;
  assert.ok(salvage(s,p.id).ok);assert.equal(s.inventory.metal,2);assert.equal(salvage(s,p.id).ok,false);
  s.elapsed+=56;assert.ok(salvage(s,p.id).ok);assert.equal(s.inventory.metal,4);assert.equal(s.voyage.goals.salvage,true);
  const h=SALVAGE.find(p=>p.id==='hold');s.player.x=h.x+1.7;s.player.z=h.z;s.voyage.clock=150;
  assert.equal(salvage(s,'hold').ok,false);s.voyage.clock=0;assert.ok(salvage(s,'hold').ok);assert.equal(s.voyage.lamp,true);
});
test('wreck deck is walkable and reachable through foot pathfinding without making open ocean walkable',()=>{
  const s=ready(),p=wreckPoint(.5,1.8),q=wreckPoint(-.3,1);s.player={...p,angle:0};
  assert.equal(collides(s,p.x,p.z),false);assert.equal(floorHeight(s,p.x,p.z),.96);assert.ok(findPath(s,q).reachable);
  assert.equal(collides(s,-25,-20),true);
});
test('returning from the wreck finds a dry reachable boarding point and never moves the boat to the home dock',()=>{
  const s=boatReady();s.voyage.boat.x=-12.1;s.voyage.boat.z=-10.6;s.player={x:-15.9,z:-12,angle:0};
  const boat=structuredClone(s.voyage.boat),p=boardingApproach(s);assert.ok(p);assert.ok(findPath(s,p).reachable);
  assert.ok(Math.hypot(p.x-boat.x,p.z-boat.z)<3.45);assert.ok(floorHeight(s,p.x,p.z)>tide(s).water+.07);assert.deepEqual(s.voyage.boat,boat);
});
test('returning salvaged metal unlocks a paid workbench and a rechargeable, bounded warmer',()=>{
  const s=ready();s.voyage.metalFound=4;s.inventory.metal=4;s.player={x:0,z:2.2};advanceVoyage(s,.1);assert.equal(s.voyage.goals.return,true);
  assert.ok(build(s,'workbench',0,2.2).ok);assert.equal(s.inventory.metal,1);assert.equal(craftWarmer(s).ok,true);assert.equal(s.inventory.metal,0);
  assert.equal(s.voyage.charges,3);s.warmth=45;assert.ok(useWarmer(s).ok);assert.equal(s.warmth,85);assert.equal(s.voyage.charges,2);assert.equal(useWarmer(s).ok,false);
  advanceVoyage(s,7);s.warmth=96;assert.ok(useWarmer(s).ok);assert.equal(s.warmth,100);assert.equal(s.voyage.charges,1);
  const fire=s.buildings.find(b=>b.type==='fire');s.player={x:fire.x,z:fire.z};const wood=s.inventory.wood;assert.ok(interactBuilding(s,fire.id).ok);assert.equal(s.voyage.charges,3);assert.equal(s.inventory.wood,wood-1);
});
test('day two completion fires once, and an at-sea save restores aboard instead of resetting the player',()=>{
  const s=boatReady();boardBoat(s);moveBoat(s,0,-1,.1);
  const saved=restore(JSON.parse(JSON.stringify(s)));assert.equal(saved.voyage.boat.aboard,true);assert.equal(saved.player.x,s.voyage.boat.x);assert.equal(saved.rescued,s.rescued);
  s.voyage.goals.return=true;s.voyage.warmer=true;s.buildings.push({id:999,type:'workbench',x:0,z:2.2,rotation:0});
  assert.deepEqual(advanceVoyage(s,.1),['voyage-win']);assert.deepEqual(advanceVoyage(s,.1),[]);
});
test('cold recovery takes priority over awarding day two in the same update',()=>{
  const s=boatReady();boardBoat(s);s.voyage.goals.return=true;s.voyage.warmer=true;s.buildings.push({id:999,type:'workbench',x:0,z:2.2,rotation:0});s.warmth=0;
  assert.deepEqual(advanceVoyage(s,.1),[]);assert.equal(s.voyage.completed,false);rescue(s);assert.deepEqual(advanceVoyage(s,.1),['voyage-win']);
});
test('cold recovery preserves boat, camp and metal and permits an explicit safe recall',()=>{
  const s=boatReady();boardBoat(s);s.inventory.metal=4;s.voyage.boat.x=-20;s.voyage.boat.z=-20;const count=s.buildings.length;rescue(s);
  assert.equal(s.inventory.metal,4);assert.equal(s.buildings.length,count);assert.equal(s.voyage.boat.aboard,false);
  assert.ok(recallBoat(s).ok);const d=s.buildings.find(b=>b.type==='dock');const expected=dockLaunch(d);assert.equal(s.voyage.boat.x,expected.x);assert.equal(s.voyage.boat.z,expected.z);
});
