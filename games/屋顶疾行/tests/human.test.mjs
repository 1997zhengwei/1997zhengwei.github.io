import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {Runner} from '../src/human-runner.mjs';
import {createSession,startSession,stepSession,tryVault} from '../src/physics.mjs';

// Geometry/animation checks run without GPU or DOM. Only texture loading is
// omitted from this in-memory fixture; the shipped mesh and clips are parsed.
const source=await readFile(new URL('../assets/runner.glb',import.meta.url));
const length=source.readUInt32LE(12),doc=JSON.parse(source.subarray(20,20+length));
for(const m of doc.materials){for(const key of Object.keys(m))if(key.endsWith('Texture'))delete m[key];if(m.pbrMetallicRoughness)for(const key of Object.keys(m.pbrMetallicRoughness))if(key.endsWith('Texture'))delete m.pbrMetallicRoughness[key];}
delete doc.images;delete doc.textures;delete doc.samplers;
let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const binary=source.subarray(28+length),bytes=Buffer.alloc(28+json.length+binary.length);bytes.writeUInt32LE(0x46546c67,0);bytes.writeUInt32LE(2,4);bytes.writeUInt32LE(bytes.length,8);bytes.writeUInt32LE(json.length,12);bytes.writeUInt32LE(0x4e4f534a,16);json.copy(bytes,20);bytes.writeUInt32LE(binary.length,20+json.length);bytes.writeUInt32LE(0x004e4942,24+json.length);binary.copy(bytes,28+json.length);
const asset=await new Promise((resolve,reject)=>new GLTFLoader().parse(bytes.buffer,'',resolve,reject));
const motions=JSON.parse(await readFile(new URL('../assets/motion-clips.json',import.meta.url),'utf8'));asset.animations=[T.AnimationClip.findByName(asset.animations,'idle_breathe'),...motions.clips.filter(c=>c.name!=='idle_breathe').map(c=>T.AnimationClip.parse(c))];

test('separate backpacks and higher tier outfit layers remain attached through running and actual flips',()=>{
 const r=new Runner({}, {asset});let t=0;
 for(const id of['courier','holo-pack','expedition']){r.setEquipment({backpack:id});r.applyLook('sunbeam');for(let frame=0;frame<35;frame++){const p={x:94,y:25,z:-125,yaw:.7,mode:'air',grounded:false,speed:8,airTime:frame/60,trick:frame/34,trickKind:'front'};r.setWorld(p,t+=1/60);const bag=r.customPacks[id].children[0].getWorldPosition(new T.Vector3()),spine=r.bones.get('spine_03').getWorldPosition(new T.Vector3());assert.ok(bag.distanceTo(spine)<.7,'bag detached in flip');assert.ok(Number.isFinite(bag.y));}assert.ok(r.customPacks[id].visible);assert.equal(Object.values(r.customPacks).filter(g=>g.visible).length,1);}
 r.setEquipment({backpack:'outfit'});r.applyLook('chalk');assert.equal(r.pack.visible,false);assert.equal(r.hat.visible,false);assert.ok(r.outfitDetails.chalk.every(g=>g.visible));assert.ok(r.outfitDetails.sunbeam.every(g=>!g.visible));r.applyLook('noir');assert.ok(r.outfitDetails.noir.every(g=>g.visible));assert.ok(r.outfitDetails.chalk.every(g=>!g.visible));r.dispose();
});

test('the shared body, clothes and fingers animate as one bounded skeleton through parkour transitions',()=>{
 const r=new Runner({}, {asset});assert.equal(r.bones.size,53);let t=0;
 for(const mode of['idle','run','air','hang','mantle','run','slide','roll','run'])for(let frame=0;frame<35;frame++){
  t+=1/60;const p={x:104,y:24.3,z:-209,yaw:.8,mode,speed:mode==='run'?9.6:5,grounded:['idle','run','slide'].includes(mode),vy:mode==='air'?3:0,airTime:frame/60,actionProgress:frame/34};
  r.setWorld(p,t);
  for(const bone of r.bones.values()){
   assert.ok([...bone.position.toArray(),...bone.quaternion.toArray()].every(Number.isFinite),mode+' '+bone.name);
   const pos=bone.getWorldPosition(new T.Vector3());assert.ok(pos.distanceTo(r.root.position)<3.2,mode+' bone escaped '+bone.name);
  }
  const hand=r.bones.get('hand_l').getWorldPosition(new T.Vector3()),elbow=r.bones.get('lowerarm_l').getWorldPosition(new T.Vector3());assert.ok(hand.distanceTo(elbow)>.22&&hand.distanceTo(elbow)<.28,'forearm stretched in '+mode);
 }
 r.applyLook('noir');assert.equal(r.hat.visible,true);assert.equal(r.pack.visible,false);r.dispose();
});
test('a rising ledge grab never teleports the feet downward into a fixed hanging pose',()=>{
 const w=startSession(createSession());Object.assign(w.player,{x:0,y:23.2,z:-55.68,vz:-8,vy:4,grounded:false,airTime:.2,coyote:0,fallStart:22.5});const before=w.player.y;
 stepSession(w,{z:-1,sprint:true},1/120);assert.equal(w.player.mode,'hang');assert.ok(w.player.y>=before);
});
test('front and side flips invert the actual skeleton around the body and return upright',()=>{
 const r=new Runner({}, {asset});let time=0;
 for(const kind of['front','side']){
  const p={x:0,y:22,z:0,yaw:0,mode:'air',grounded:false,speed:8,vy:0,airTime:.4,trickKind:kind,trick:.5,actionProgress:.5};
  for(let i=0;i<16;i++)r.setWorld(p,time+=1/60);
  const head=r.bones.get('head').getWorldPosition(new T.Vector3()),foot=r.bones.get('foot_l').getWorldPosition(new T.Vector3());assert.ok(head.y<foot.y-.25,kind+' must visibly invert the body');
  p.trick=1;p.actionProgress=1;for(let i=0;i<16;i++)r.setWorld(p,time+=1/60);
  assert.ok(r.bones.get('head').getWorldPosition(new T.Vector3()).y>r.bones.get('foot_l').getWorldPosition(new T.Vector3()).y+.6,kind+' must finish upright');
 }
 r.dispose();
});
test('fast vaults retain forward motion through their first and last animation intervals',()=>{
 const w=startSession(createSession());Object.assign(w.player,{z:5.4,vz:-9.6,speed:9.6});assert.ok(tryVault(w,{x:0,z:-1}));const duration=w.player.kinematic.duration;assert.ok(duration<=.40);const before=w.player.z;stepSession(w,{z:-1,sprint:true},1/120);assert.ok(before-w.player.z>.035);
 let last=w.player.z,delta=0;while(w.player.kinematic){stepSession(w,{z:-1,sprint:true},1/120);delta=last-w.player.z;last=w.player.z;}assert.ok(delta>.02);
});
