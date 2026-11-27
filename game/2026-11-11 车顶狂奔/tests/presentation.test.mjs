import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {Spring,MotionRig,selectAnimationClips} from '../src/presentation.mjs';
import {readFileSync} from 'node:fs';
import {truckModel,wheelModel} from '../src/truck-model.mjs';
import {Game} from '../src/simulation.mjs';
import {makeCourse} from '../src/courses.mjs';
const player={x:0,s:20,y:3.82,vx:0,vs:14,relX:0,relS:0,grounded:true,crouch:0};

test('real authored motion overrides duplicate simplified animation names in the bundled model',()=>{
 const bytes=readFileSync(new URL('../assets/runner.glb',import.meta.url)),base=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString()).animations;
 const authored=JSON.parse(readFileSync(new URL('../assets/motion-clips.json',import.meta.url),'utf8')).clips,selected=selectAnimationClips(base,authored);
 for(const name of['walk','run','jump','land']){assert.ok(base.some(c=>c.name===name));assert.equal(selected.get(name),authored.find(c=>c.name===name));assert.equal(selected.get(name).tracks.length,54);}
});

test('camera springs converge to the same state at 30, 60 and 144 frames per second',()=>{
 for(const damping of[1,.72]){const results=[];for(const fps of[30,60,144]){const s=new Spring(0,18,damping);s.velocity=-2;for(let i=0;i<fps;i++)s.step(1,1/fps);results.push([s.value,s.velocity]);}for(const pair of results){assert.ok(Math.abs(pair[0]-results[0][0])<1e-10);assert.ok(Math.abs(pair[1]-results[0][1])<1e-10);}}
});
test('landing compresses and recovers the camera; harder landings get a stronger response',()=>{
 const sample=impact=>{const rig=new MotionRig();rig.sample(player,{},1/60);rig.event({type:'land',impact});let low=0;for(let i=0;i<120;i++){const pose=rig.sample(player,{},1/60);low=Math.min(low,pose.impact);}return{low,end:rig.last.impact};};const soft=sample(4),hard=sample(20);assert.ok(hard.low<soft.low*2);assert.ok(hard.low>-.23);assert.ok(Math.abs(hard.end)<.00001);
});
test('pausing freezes the landing response and removes speed blur without changing the player',()=>{
 const rig=new MotionRig(),p={...player,vs:30,relS:12},before=JSON.stringify(p);rig.sample(p,{},1/60);rig.event({type:'land',impact:18});const a=rig.sample(p,{},1/60),b=rig.sample(p,{},1,{active:false});assert.equal(a.y,b.y);assert.equal(a.pitch,b.pitch);assert.equal(b.blur,0);assert.equal(JSON.stringify(p),before);
});
test('reset clears a previous landing and camera bank before another run',()=>{
 const rig=new MotionRig();rig.sample({...player,relX:8},{},.1);rig.event({type:'land',impact:22});rig.sample(player,{},.05);rig.event({type:'reset'});const pose=rig.sample(player,{pitch:-.17},0);assert.equal(pose.impact,0);assert.equal(pose.roll,0);assert.ok(Math.abs(pose.y-5.44)<1e-10);
});
test('field of view and peripheral blur respond to actual speed while the camera stays finite',()=>{
 const rig=new MotionRig();let slow,fast;for(let i=0;i<120;i++)slow=rig.sample({...player,vs:0},{},1/60);for(let i=0;i<120;i++)fast=rig.sample({...player,vs:31,relS:12},{},1/60);assert.equal(slow.blur,0);assert.ok(fast.blur>0&&fast.blur<=.016);assert.ok(fast.fov>slow.fov+6);for(const x of Object.values(fast))assert.ok(Number.isFinite(x));
});
test('refined trailer and cabin still line up with the gameplay landing heights',()=>{
 const group=new T.Group(),parts=truckModel();for(const geometry of Object.values(parts)){assert.ok(geometry.attributes.position.count>0);for(const value of geometry.attributes.position.array)assert.ok(Number.isFinite(value));group.add(new T.Mesh(geometry,new T.MeshBasicMaterial()));}group.updateMatrixWorld(true);
 const cast=s=>new T.Raycaster(new T.Vector3(0,8,-s),new T.Vector3(0,-1,0)).intersectObject(group,true)[0]?.point.y;
 assert.ok(Math.abs(cast(0)-3.82)<.06);assert.ok(Math.abs(cast(6)-3.14)<.03);
 for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose();}
});
test('distant wheels retain their silhouette with substantially less geometry',()=>{
 const close=wheelModel(),far=wheelModel(true),count=group=>Object.values(group).reduce((n,g)=>n+(g.index?g.index.count:g.attributes.position.count),0);assert.ok(count(far)<count(close)*.15);for(const geometry of[...Object.values(close),...Object.values(far)]){geometry.computeBoundingSphere();assert.ok(geometry.boundingSphere.radius<.8);geometry.dispose();}
});
test('landing effects receive the real descending impact speed, without changing collision rules',()=>{
 const game=new Game(makeCourse());game.begin();game.step(1/120,{jump:true});for(let i=0;i<220&&game.state==='playing';i++)game.step(1/120,{});const event=game.events.find(e=>e.type==='land');assert.ok(event);assert.ok(event.impact>8&&event.impact<20);assert.equal(game.player.grounded,true);assert.equal(game.landings,0);
});
