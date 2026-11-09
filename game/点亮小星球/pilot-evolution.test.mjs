import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from './vendor/three.module.js';
import {createEvolvedPilotRig,evolvedPilotStage} from './pilot-evolution.mjs';

const profile=(level,weapon='pulse',extra={})=>({level,style:Math.floor((level-1)/3),suit:-1,weapon,weapons:{[weapon]:5},modules:{armor:8,oxygen:8},...extra});
function signature(root){
 const hash=createHash('sha256');root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isMesh){hash.update(Buffer.from(o.geometry.attributes.position.array.buffer));hash.update(JSON.stringify(o.matrixWorld.toArray()))}});
 return hash.digest('hex');
}
function liveResources(root){
 const geometry=new Set(),material=new Set();root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])material.add(m)});
 return {geometry,material};
}

test('automatic chassis changes at actual levels 31 / 36 / 41; chosen outfits retain their unlocked chassis',()=>{
 for(const [level,stage]of [[31,1],[35,1],[36,2],[40,2],[41,3],[45,3]])assert.equal(evolvedPilotStage(profile(level)),stage);
 assert.equal(evolvedPilotStage(profile(45,'pulse',{style:10,suit:10})),1);
 assert.equal(evolvedPilotStage(profile(45,'pulse',{style:11,suit:11})),1);
 assert.equal(evolvedPilotStage(profile(45,'pulse',{style:12,suit:12})),2);
 assert.equal(evolvedPilotStage(profile(45,'pulse',{style:13,suit:13})),2);
 assert.equal(evolvedPilotStage(profile(45,'pulse',{style:14,suit:14})),3);
});

test('three stages replace the full chassis and each three-level wardrobe item changes actual geometry',()=>{
 const stages=new Set(),wardrobe=new Set();
 for(const level of [31,34,36,37,40,41,43]){
  const rig=createEvolvedPilotRig(profile(level));
  assert.equal(rig.arms.length,2);assert.equal(rig.legs.length,2);assert.equal(rig.eyes.length,2);
  for(const limb of [...rig.arms,...rig.legs,rig.head])assert.ok(limb.parent);
  wardrobe.add(signature(rig.root));if([31,36,41].includes(level))stages.add(signature(rig.root));
  rig.disposeVisual();
 }
 assert.equal(stages.size,3);assert.equal(wardrobe.size,7);
});

test('split pulse tubes, scatter bell, long rails and electric ring have distinct weapon geometry in every chassis',()=>{
 for(const level of [31,36,41]){
  const weapons=new Set();
  for(const weapon of ['pulse','scatter','rail','arc']){
   const rig=createEvolvedPilotRig(profile(level,weapon));weapons.add(signature(rig.gun));assert.ok(rig.muzzle);assert.equal(rig.muzzle.visible,false);rig.disposeVisual();
  }
  assert.equal(weapons.size,4);
 }
});

test('even unmerged, fully upgraded chapter-two pilots stay below the mobile rendering and body size limits',()=>{
 for(const level of [31,34,36,37,40,41,43,45])for(const weapon of ['pulse','scatter','rail','arc']){
  const rig=createEvolvedPilotRig(profile(level,weapon));let meshes=0,triangles=0;
  rig.updateVisual(profile(level,weapon),2,true,true);rig.root.updateMatrixWorld(true);
  const size=new THREE.Box3().setFromObject(rig.root).getSize(new THREE.Vector3());
  assert.ok(size.x<=5&&size.y<4.5,`${level}/${weapon}: ${size.toArray()}`);
  rig.root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;assert.ok(o.material.isMeshPhysicalMaterial)}});
  assert.ok(meshes<110,`${level}/${weapon}: ${meshes} meshes`);assert.ok(triangles<60000);
  assert.ok([...liveResources(rig.root).material].some(m=>m.clearcoat===1&&m.roughness<=.12),'glossy face remains visible');
  assert.ok([...liveResources(rig.root).material].some(m=>m.roughness>=.5),'dark load-bearing joints remain');
  rig.disposeVisual();
 }
});

test('firing deploys the second chassis and recoils the gun while preserving world position',()=>{
 const p=profile(36),rig=createEvolvedPilotRig(p),wing=rig.root.getObjectByName('deploying-wing-1');
 rig.root.position.set(8,.02,-812);const resting=wing.rotation.z,gunRest=rig.gun.position.z;
 rig.updateVisual(p,12,false,true);
 assert.ok(Math.abs(wing.rotation.z)>Math.abs(resting)+.4);assert.ok(rig.gun.position.z<gunRest);
 assert.equal(rig.root.position.x,8);assert.equal(rig.root.position.z,-812);
 rig.updateVisual(p,13,false,false);assert.equal(rig.gun.position.z,gunRest);rig.disposeVisual();
});

test('starcore has two complete energy rings and hovers visually without changing player coordinates',()=>{
 const p=profile(41),rig=createEvolvedPilotRig(p);
 assert.ok(rig.root.getObjectByName('reactor-complete-energy-ring'));assert.ok(rig.root.getObjectByName('chest-complete-energy-ring'));
 assert.equal(rig.jets.length,2);rig.root.position.set(-12,.03,-1000);
 for(const clock of [0,.1,1,20,1e5,NaN,Infinity]){
  rig.updateVisual(p,clock,true,true);
  assert.ok(rig.visualBody.position.y*rig.visualScale>=.15&&rig.visualBody.position.y*rig.visualScale<=.25);
  assert.equal(rig.root.position.x,-12);assert.equal(rig.root.position.z,-1000);
  rig.root.traverse(o=>{for(const value of [...o.position.toArray(),...o.rotation.toArray().slice(0,3),...o.scale.toArray()])assert.ok(Number.isFinite(value))});
  for(const jet of rig.jets)assert.equal(jet.visible,true);
 }
 rig.updateVisual({...p,down:true},21,false,false);assert.equal(rig.visualBody.position.y,0);assert.ok(rig.jets.every(j=>!j.visible));rig.disposeVisual();
});

test('preview disposal is idempotent and no live geometry or material is shared across pilots',()=>{
 for(let i=0;i<12;i++){
  const a=createEvolvedPilotRig(profile(31+i%15,['pulse','scatter','rail','arc'][i%4])),b=createEvolvedPilotRig(profile(41));
  const first=liveResources(a.root),second=liveResources(b.root),counts=new Map();
  for(const resource of [...first.geometry,...first.material]){assert.ok(!second.geometry.has(resource)&&!second.material.has(resource));counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1))}
  a.disposeVisual();a.disposeVisual();for(const count of counts.values())assert.equal(count,1);
  b.updateVisual(profile(41),3,true,true);assert.ok(b.localBounds.getSize(new THREE.Vector3()).length()>2);assert.ok([...second.geometry].every(g=>g.attributes.position.count>0));b.disposeVisual();
 }
});
