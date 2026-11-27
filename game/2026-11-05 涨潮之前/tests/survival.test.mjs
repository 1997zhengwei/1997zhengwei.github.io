import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {restore,createState,build,validateBuild,floorHeight,buildingBase,tide,advance,shelter,campProtection,harvest,invalidateBuildings} from '../src/rules.mjs';
import {beginSurvival,claimSupply,supplyPosition,prepareTonight,readForecast,advanceSurvival,restTomorrow,streamResources,collectProduction,repair,nextDay} from '../src/survival.mjs';
import {dayPlan,chunkIsland,chunkNodes,generatedHeight} from '../src/frontier-state.mjs';
import {canSail,findBoatPath} from '../src/voyage.mjs';
const legacy=JSON.parse(fs.readFileSync(new URL('./fixtures/day2-complete.json',import.meta.url),'utf8'));
function ready(){const s=restore(legacy);beginSurvival(s);s.voyage.boat.aboard=false;s.player={x:-3.3,z:2.2,angle:0};return s;}
function tick(s,n){const out=[];for(let i=0;i<n*20;i++){out.push(...advance(s,.05),...advanceSurvival(s,.05));}return out;}

test('v2 camp, resources, gear, keepsake and aboard position migrate unchanged; third day starts only after completion',()=>{
 const s=restore(legacy);assert.deepEqual(s.buildings,legacy.buildings);assert.deepEqual(s.inventory,legacy.inventory);assert.deepEqual(s.player,legacy.player);assert.deepEqual(s.voyage,legacy.voyage);
 const buildings=structuredClone(s.buildings);assert.ok(beginSurvival(s));assert.equal(s.day,3);assert.deepEqual(s.buildings,buildings);assert.equal(s.voyage.charges,2);assert.ok(s.voyage.boat.aboard);
 assert.equal(beginSurvival(createState()),false);assert.deepEqual(restore(s).survival,s.survival);
});
test('100 successive saved daily forecasts vary duration and weather without rerolling on reload',()=>{
 const s=ready();let p=s.survival.plan;for(let day=4;day<104;day++){const n=dayPlan(s.survival.seed,day,p);assert.notEqual(n.kind,p.kind);assert.ok(Math.abs(n.duration-p.duration)>=16);assert.equal(n.duration,n.prepare+n.warning+n.challenge+n.rest);assert.ok(n.duration>=120&&n.duration<=300);s.survival.day=day;s.survival.plan=n;assert.deepEqual(restore(s).survival.plan,n);p=n;}
});
test('supply is once per day, survives reload and supplies all required third-day structures',()=>{
 const s=ready();s.player={...supplyPosition(s),angle:0};assert.ok(claimSupply(s).ok);const inventory={...s.inventory};assert.equal(claimSupply(s).ok,false);const r=restore(s);assert.equal(claimSupply(r).ok,false);assert.deepEqual(r.inventory,inventory);nextDay(s);assert.ok(claimSupply(s).ok);
});
test('creative building and free upgrades preserve materials and cannot mint refunds, including metal',()=>{
 const s=ready();s.survival.creative=true;s.player={x:0,z:0,angle:0};const inv={...s.inventory};assert.ok(build(s,'beacon',2.2,0).ok);assert.ok(build(s,'remove',2.2,0).ok);assert.deepEqual(s.inventory,inv);
 const p=s.buildings.find(b=>b.type==='platform');s.player={x:p.x+1,z:p.z,angle:0};assert.ok(build(s,'highdeck',p.x,p.z).ok);assert.ok(p.raisedFree);s.survival.creative=false;assert.deepEqual(s.inventory,inv);
});
test('raised floors move the actual cabin/fire base, retain six real steps, and stay dry during surge',()=>{
 const s=ready();s.survival.creative=true;assert.ok(build(s,'highdeck',-2.2,2.2).ok);assert.equal(floorHeight(s,-2.2,2.2),2.55);assert.equal(buildingBase(s,s.buildings.find(b=>b.type==='fire')),2.55);
 s.player={x:-2.2,z:2.2,angle:0};s.survival.clock=s.survival.plan.prepare+s.survival.plan.warning+2;assert.equal(shelter(s).flooded,false);assert.equal(shelter(s).cozy,true);tick(s,4);assert.ok(s.buildings.find(b=>b.type==='fire').lit);
 assert.ok(floorHeight(s,-2.2,2.2+1.15+5*.26)>0.9);assert.equal(restore(s).buildings.find(b=>b.type==='platform').raised,true);
});
test('directional seawall really reduces incoming water and cold; the wrong rotation does not',()=>{
 const s=ready();s.survival.plan.wind=0;s.survival.clock=s.survival.plan.prepare+s.survival.plan.warning+1;s.buildings.push({id:100,type:'seawall',x:-2.2,z:4.4,rotation:0});invalidateBuildings(s);
 assert.ok(campProtection(s,-2.2,2.2).wave);assert.equal(campProtection(s,-2.2,2.2).water,tide(s).water-.75);s.buildings.at(-1).rotation=2;assert.equal(campProtection(s,-2.2,2.2).wave,false);
});
test('upgrading an existing campfire keeps its floor and history, and refunds paid costs without inventing free upgrade material',()=>{
 const s=ready();s.survival.creative=true;const fire=s.buildings.find(b=>b.type==='fire'),id=fire.id;const inv={...s.inventory};
 assert.ok(build(s,'stove',fire.x,fire.z).ok);assert.equal(s.buildings.find(b=>b.id===id).type,'stove');assert.ok(fire.priorFirePaid);assert.ok(fire.free);assert.deepEqual(s.inventory,inv);
 const r=restore(s);assert.ok(r.buildings.find(b=>b.id===id).priorFirePaid);const res=build(r,'remove',fire.x,fire.z);assert.ok(res.ok);assert.equal(res.amounts.metal||0,0);assert.equal(res.amounts.wood,13);assert.equal(res.amounts.stone,7);assert.equal(res.amounts.fiber,3);
});
test('production, capped stock, collection, storm wear and paid repair have real persistent effects',()=>{
 const s=ready();s.buildings.push({id:100,type:'lumbermill',x:0,z:0,rotation:0,hp:40});invalidateBuildings(s);s.player={x:1,z:0,angle:0};advanceSurvival(s,30);assert.equal(s.buildings.at(-1).stock.wood,5);assert.ok(collectProduction(s,100).ok);assert.equal(s.inventory.wood,5);assert.equal(collectProduction(s,100).ok,false);
 s.inventory.stone=2;assert.ok(repair(s,100).ok);assert.equal(s.buildings.at(-1).hp,85);assert.equal(s.inventory.wood,4);assert.equal(restore(s).buildings.at(-1).hp,85);
 s.survival.clock=s.survival.plan.prepare+s.survival.plan.warning;advanceSurvival(s,1);assert.ok(s.buildings.at(-1).hp<85);
});
test('weather reward and third chapter completion fire once, then resting changes the day and forecast',()=>{
 const s=ready();s.survival.creative=true;build(s,'highdeck',-2.2,2.2);s.player={x:-2.2,z:2.2,angle:0};s.survival.goals={supply:true,station:true,forecast:true,raised:true,seawall:true,stove:true};readForecast(s);assert.ok(prepareTonight(s).ok);
 const events=tick(s,23);assert.equal(events.filter(e=>e==='survival-win').length,1);assert.equal(events.filter(e=>e==='day-reward').length,1);const inv={...s.inventory};tick(s,1);assert.deepEqual(s.inventory,inv);const duration=s.survival.plan.duration;assert.ok(restTomorrow(s).ok);assert.equal(s.day,4);assert.notEqual(s.survival.plan.duration,duration);assert.equal(s.survival.dayRewarded,false);
});
test('procedural islands and resource cooldowns persist outside the original map and support boat travel',()=>{
 const s=ready(),i=chunkIsland(3,4);assert.ok(i);assert.deepEqual(i,chunkIsland(3,4));assert.ok(generatedHeight(i.x,i.z)>.5);s.player={x:i.x,z:i.z,angle:0};streamResources(s);const n=s.nodes.find(n=>n.remote&&n.type==='wood');s.player.x=n.x;s.player.z=n.z;assert.ok(harvest(s,n.id).ok);const timer=s.survival.resourceTimers[n.id];assert.ok(timer>s.elapsed);
 const r=restore(s);streamResources(r);assert.equal(r.nodes.find(v=>v.id===n.id).readyAt,timer);assert.equal(new Set(r.nodes.map(n=>n.id)).size,r.nodes.length);
 assert.ok(canSail(s,120,120));s.voyage.boat={...s.voyage.boat,x:120,z:120,aboard:true};assert.ok(findBoatPath(s,{x:128,z:120}).reachable);assert.ok(restore(s).voyage.boat.x>100);
});
test('hundreds of connected buildings can be built and restored beyond the former 100-building map cap',()=>{
 const s=ready();s.survival.creative=true;for(let i=0;i<520;i++){
   const x=-2.2-i*2.2,z=0;s.player={x,z,angle:0};const res=build(s,'platform',x,z);assert.ok(res.ok,`${i}: ${res.message}`);
 }
 const r=restore(s);assert.equal(r.buildings.length,s.buildings.length);assert.ok(r.buildings.some(b=>b.x<-1000));assert.ok(validateBuild(r,'platform',-2.2-520*2.2,0,{range:false}).ok);
});
