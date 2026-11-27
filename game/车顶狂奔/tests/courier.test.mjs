import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
import {createCourier,createFirstPersonGear} from '../src/courier.mjs';
const read=file=>JSON.parse(readFileSync(new URL('../assets/'+file,import.meta.url),'utf8'));

test('new courier geometry stands on the gameplay sole height with a bounded mobile mesh budget',()=>{
 const courier=createCourier(read('courier-rig.json'));courier.root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(courier.root,true);let triangles=0,meshes=0;courier.root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});assert.ok(bounds.min.y>=-.02&&bounds.min.y<.04);assert.ok(bounds.max.y>1.8&&bounds.max.y<2.05);assert.ok(triangles<40000);assert.ok(meshes<90);
});

test('authored run, jump and landing clips bind to the new rig and keep all geometry finite',()=>{
 const courier=createCourier(read('courier-rig.json')),mixer=new T.AnimationMixer(courier.root),clips=read('motion-clips.json').clips;
 for(const name of['idle_breathe','run','jump','land','slide']){
  const clip=T.AnimationClip.parse(clips.find(c=>c.name===name));for(const track of clip.tracks)assert.ok(courier.root.getObjectByName(track.name.split('.')[0]),track.name);
  const action=mixer.clipAction(clip).play();for(let i=0;i<20;i++){mixer.update(1/60);courier.update(1/60,{focus:.6,active:true,impact:-.15});}courier.root.updateMatrixWorld(true);courier.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),o.name));action.stop();
 }
});

test('first-person and backpack meters reflect available slow-motion energy',()=>{
 const courier=createCourier(read('courier-rig.json')),gear=createFirstPersonGear(),p={relX:0,relS:8,grounded:true};courier.update(.1,{focus:1,active:true});gear.update(.1,p,1,true,0);const full=courier.cells.map(c=>c.material.emissiveIntensity);courier.update(.1,{focus:0});gear.update(.1,p,0,false,0);assert.ok(courier.cells.every((c,i)=>c.material.emissiveIntensity<full[i]));assert.ok(gear.hands.every(h=>h.position.toArray().every(Number.isFinite)));
});
