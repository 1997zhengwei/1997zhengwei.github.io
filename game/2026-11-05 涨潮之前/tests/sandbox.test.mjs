import test from 'node:test';import assert from 'node:assert/strict';
import {createSandbox,createBuildHistory,placePatch,createWorldLibrary,applyWorldSettings,returnHome} from '../src/sandbox.mjs';
import {restore,build,advance,tide,collides,floorHeight} from '../src/rules.mjs';
import {advanceSurvival,restTomorrow,nextDay} from '../src/survival.mjs';
const editor=()=>{const s=createSandbox();s.world.editor=true;return s;};
const memory=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),m};};
test('blank and furnished worlds have separate settings, start without chapter locks, and support survival or creative play',()=>{
 const a=createSandbox({id:'one',name:'我的海岛',seed:919}),b=createSandbox({id:'two',mode:'survival',preset:'camp'});
 assert.equal(a.buildings.length,0);assert.equal(a.world.name,'我的海岛');assert.equal(a.world.mode,'creative');assert.ok(a.survival.completed);assert.ok(a.survival.creative);assert.equal(b.buildings.length,4);assert.equal(b.survival.creative,false);assert.equal(b.inventory.wood,36);assert.equal(a.survival.seed,919);assert.equal(a.world.editor,false);
});
test('free editing supports remote independent foundations, save/reload and connected construction afterward',()=>{
 const s=editor();assert.ok(build(s,'platform',100,100).ok);assert.ok(s.buildings[0].freeAnchor);s.world.editor=false;s.player={x:99,z:99,angle:0};const r=restore(s);assert.ok(r.buildings[0].freeAnchor);assert.equal(r.world.editor,false);assert.ok(build(r,'bridge',101.2,99).ok);assert.ok(floorHeight(r,99,99)>=1.65);
});
test('one 3x3 stroke undoes/redoes atomically without rewinding day or inventory earned elsewhere',()=>{
 const s=editor(),h=createBuildHistory(s);assert.ok(h.run(()=>placePatch(s,'platform',66,66,0,3)).ok);assert.equal(s.buildings.length,9);assert.equal(h.undoCount,1);s.survival.day=1000;s.inventory.metal=12;assert.ok(h.undo());assert.equal(s.buildings.length,0);assert.equal(s.survival.day,1000);assert.equal(s.inventory.metal,12);assert.ok(h.redo());assert.equal(s.buildings.length,9);s.world.editor=false;assert.equal(h.undo(),false);
});
test('invalid multi-tile stroke changes nothing, and a new edit clears redo history',()=>{
 const s=editor(),h=createBuildHistory(s);s.voyage.boat={x:66,z:66,aboard:false};assert.equal(h.run(()=>placePatch(s,'platform',66,66,0,3)).ok,false);assert.equal(s.buildings.length,0);s.voyage.boat=null;h.run(()=>build(s,'platform',66,66));h.undo();h.run(()=>build(s,'platform',77,77));assert.equal(h.redoCount,0);
});
test('calm creative play avoids cold and wear, can freeze time without stopping production and advance arbitrary days',()=>{
 const s=editor();build(s,'platform',0,0);build(s,'lumbermill',0,0);s.world.editor=false;s.world.frozen=true;const clock=s.survival.clock;advanceSurvival(s,30);assert.equal(s.survival.clock,clock);assert.equal(s.buildings.find(b=>b.type==='lumbermill').stock.wood,10);s.warmth=1;assert.ok(!advance(s,1).includes('rescue'));assert.equal(s.warmth,100);s.survival.clock=s.survival.plan.prepare+s.survival.plan.warning;assert.equal(tide(s).rain,0);assert.equal(tide(s).water,-.08);assert.ok(restTomorrow(s).ok);for(let i=0;i<1000;i++)nextDay(s);assert.equal(s.survival.day,1005);
 applyWorldSettings(s,{mode:'survival',frozen:false,pace:1.5,calm:true});assert.equal(s.world.calm,false);assert.equal(s.survival.creative,false);const before=s.survival.clock;advanceSurvival(s,2);assert.equal(s.survival.clock,before+3);
});
test('decorations keep color and lamp effect on reload, and arches keep a real open passage',()=>{
 const s=editor();build(s,'platform',0,0);s.world.style='sunset';assert.ok(build(s,'arch',0,0).ok);assert.ok(!collides(s,0,0));assert.ok(collides(s,.84,0));build(s,'lantern',2.2,0);const r=restore(s);assert.equal(r.buildings.find(b=>b.type==='arch').tint,'sunset');assert.ok(r.buildings.find(b=>b.type==='lantern').lit);
});
test('world library switching, duplication and backup import retain independent data and original slots',()=>{
 const storage=memory(),lib=createWorldLibrary(storage,'test'),a=createSandbox({id:'a',name:'原岛'}),b=createSandbox({id:'b',name:'新岛'});lib.save(a);lib.add(b);lib.save(b);assert.equal(lib.list().active,'b');assert.equal(lib.load('a').world.name,'原岛');const copy=lib.duplicate(a);copy.inventory.wood=99;lib.save(copy);assert.equal(lib.load('a').inventory.wood,0);const imported=lib.import(JSON.stringify({format:'TidehavenWorld',state:copy}));assert.notEqual(imported.world.id,copy.world.id);assert.equal(imported.inventory.wood,99);assert.equal(lib.list().worlds.length,4);assert.throws(()=>lib.import('{broken'));assert.equal(lib.list().worlds.length,4);
});
test('storage failure during a new world write leaves existing world snapshots intact',()=>{
 const m=memory(),lib=createWorldLibrary(m,'test'),a=createSandbox({id:'a'});lib.save(a);m.setItem=(key,value)=>{throw Error('quota');};assert.throws(()=>lib.add(createSandbox({id:'b'})),/quota/);assert.equal(lib.load('a').world.id,'a');assert.equal(lib.list().worlds.length,1);
});
test('return home finds a dry walkable spot without erasing construction and only teleports in creative mode',()=>{
 const s=editor();build(s,'platform',44,44);s.world.home={x:44,z:44};s.world.editor=false;assert.ok(returnHome(s).ok);assert.equal(s.player.x,44);assert.equal(s.buildings.length,1);s.world.mode='survival';assert.equal(returnHome(s).ok,false);
});
