import assert from 'node:assert/strict';
import {test} from 'node:test';
import {makeWorld,step,validLayout,EDGE,LIMIT} from './rules.mjs';
import {SLIDE_TYPES,slidePoint,slideEntry,slideBounds,localToWorld} from './slides.mjs';
import {fitToy} from './building.mjs';
const tick=(w,n,c={id:'sponge'})=>{const ev=[];for(let i=0;i<n;i++)ev.push(...step(w,1/60,c));return ev;};
const toy=(type,x=0,z=0,rot=0,id=1)=>({id,type,x,z,rot});
function isolate(w,p){w.actors.forEach((a,i)=>Object.assign(a,{x:1000+i*3,z:1000,homeX:1000+i*3,homeZ:1000}));Object.assign(w.actors[0],p);return w.actors[0];}
test('DIY accepts distant worlds with more toys than a bounded park, but rejects malformed data',()=>{
 const layout=Array.from({length:LIMIT+20},(_,i)=>toy('fan',200+i*10,-200,0,i+1));
 assert.equal(validLayout(layout),false);assert.equal(validLayout(layout,true),true);
 assert.equal(validLayout([toy('fan',Infinity)],true),false);
 assert.equal(validLayout([toy('fan'),toy('fan')],true),false);
 assert.equal(validLayout([toy('missing')],true),false);
});
test('DIY walking passes the former park boundary while Park keeps its fence',()=>{
 for(const endless of [false,true]){const w=makeWorld([],{endless}),a=isolate(w,{x:EDGE.x-1,z:0});tick(w,180,{id:'sponge',x:1});assert.ok(endless?a.x>EDGE.x+5:a.x<=EDGE.x);}
});
for(const type of Object.keys(SLIDE_TYPES))for(const rot of [0,Math.PI/2,Math.PI,Math.PI*1.5])test(`${type} rotation ${Math.round(rot*180/Math.PI)}: steps → ride → exit`,()=>{
 const o=toy(type,200,-180,rot),w=makeWorld([o],{endless:true}),a=isolate(w,localToWorld(o,slideEntry(type)));
 const boarding=tick(w,1);assert.ok(a.ride);assert.ok(boarding.some(e=>e.type==='board'));
 tick(w,120);const expected=localToWorld(o,slidePoint(type,(a.ride.time-1)/(type==='spiralslide'?3.6:2.6)));
 assert.ok(Math.hypot(a.x-expected.x,a.z-expected.z)<.001);assert.ok(a.y>0);
 let exit;for(let i=0;i<240&&!exit;i++)exit=step(w,1/60,{id:'sponge'}).find(e=>e.type==='slide');
 assert.ok(exit);assert.equal(a.ride,null);const end=localToWorld(o,slidePoint(type,1));assert.ok(Math.hypot(a.x-end.x,a.z-end.z)<.001);
 assert.equal(a.vy,type==='jumpslide'?7:1.2);assert.ok(Math.hypot(a.vx,a.vz)>4.9);
 tick(w,180);assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y));assert.equal(a.y,0);
});
test('a distant paired portal transfers once and never snaps back to the old fence',()=>{
 const w=makeWorld([toy('portal'),toy('portal',500,-300,0,2)],{endless:true}),a=isolate(w,{x:0,z:0});
 const ev=tick(w,60);assert.equal(ev.filter(e=>e.type==='teleport'&&e.actor==='sponge').length,1);assert.ok(a.x>495&&a.z<-295);
});
test('far crates sleep and resume when a character returns to their region',()=>{
 const w=makeWorld([toy('crate',500,500)],{endless:true}),box=w.objects[0];box.vx=3;
 tick(w,20);assert.equal(box.x,500);isolate(w,{x:503,z:503});tick(w,20);assert.ok(box.x>500);
});
test('all slides fit completely inside the park after moving or rotating at every corner',()=>{
 for(const type of Object.keys(SLIDE_TYPES))for(const rot of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const x of [-16,16])for(const z of [-14,14]){
  const p=fitToy(type,{x,z},rot,false),b=slideBounds(type,rot);
  assert.ok(p.x+b.minX>=-EDGE.x-1e-8&&p.x+b.maxX<=EDGE.x+1e-8);
  assert.ok(p.z+b.minZ>=-EDGE.z-1e-8&&p.z+b.maxZ<=EDGE.z+1e-8);
  assert.deepEqual(fitToy(type,{x:500,z:-300},rot,true),{x:500,z:-300});
 }
});
test('reset removes an active ride without changing the saved slide layout',()=>{
 const layout=[toy('waterslide')],before=JSON.stringify(layout),w=makeWorld(layout),a=isolate(w,slideEntry('waterslide'));tick(w,60);assert.ok(a.ride);
 const reset=makeWorld(layout);assert.equal(reset.actors[0].ride,undefined);assert.equal(JSON.stringify(layout),before);
});
