import {readFile,writeFile} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';

async function load(path){const file=await readFile(new URL(path,import.meta.url)),length=file.readUInt32LE(12),doc=JSON.parse(file.subarray(20,20+length));
 for(const m of doc.materials||[]){for(const k of Object.keys(m))if(k.endsWith('Texture'))delete m[k];for(const k of Object.keys(m.pbrMetallicRoughness||{}))if(k.endsWith('Texture'))delete m.pbrMetallicRoughness[k];}
 delete doc.images;delete doc.textures;delete doc.samplers;
 let j=Buffer.from(JSON.stringify(doc));j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);const b=file.subarray(28+length),out=Buffer.alloc(28+j.length+b.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(j.length,12);out.writeUInt32LE(0x4e4f534a,16);j.copy(out,20);out.writeUInt32LE(b.length,20+j.length);out.writeUInt32LE(0x004e4942,24+j.length);b.copy(out,28+j.length);
 return new Promise((resolve,reject)=>new GLTFLoader().parse(out.buffer,'',resolve,reject));}
const target=await load('../assets/runner.glb'),sources=[await load('../assets/motion-source/UAL1_Standard.glb'),await load('../assets/motion-source/UAL2_Standard.glb')];
const bones=[];target.scene.traverse(b=>{if(b.isBone)bones.push(b);});target.scene.updateMatrixWorld(true);
// The MakeHuman mesh is bound in an A pose. Match the source T pose before
// computing rest-space offsets, otherwise relaxed arms bend into the torso.
for(const side of['l','r']){const arm=target.scene.getObjectByName('upperarm_'+side),elbow=target.scene.getObjectByName('lowerarm_'+side),from=elbow.getWorldPosition(new T.Vector3()).sub(arm.getWorldPosition(new T.Vector3())).normalize(),to=new T.Vector3(side==='l'?1:-1,0,0),world=new T.Quaternion().setFromUnitVectors(from,to).multiply(arm.getWorldQuaternion(new T.Quaternion()));arm.quaternion.copy(arm.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(world));arm.updateWorldMatrix(false,true);}
const rest=new Map(bones.map(b=>[b.name,{q:b.getWorldQuaternion(new T.Quaternion()),p:b.position.clone(),world:b.getWorldPosition(new T.Vector3()),local:b.quaternion.clone()}]));
const selected=[['idle_breathe',0,'Idle_Loop'],['walk',0,'Jog_Fwd_Loop'],['run',0,'Sprint_Loop'],['jump',0,'Jump_Loop'],['land',0,'Jump_Land'],['roll',0,'Roll'],['mantle',1,'ClimbUp_1m'],['slide',1,'Slide_Loop'],['slide_start',1,'Slide_Start']];
const clips=[];
for(const [name,sourceIndex,sourceName] of selected){
 const source=sources[sourceIndex],mixer=new T.AnimationMixer(source.scene),tpose=mixer.clipAction(T.AnimationClip.findByName(source.animations,'A_TPose')).play();mixer.update(0);source.scene.updateMatrixWorld(true);
 const sourceBones=new Map();source.scene.traverse(b=>{if(b.isBone)sourceBones.set(b.name.toLowerCase(),b);});
 const sourceRest=new Map([...sourceBones].map(([n,b])=>[n,b.getWorldQuaternion(new T.Quaternion())]));const sourceHip=sourceBones.get('pelvis').getWorldPosition(new T.Vector3()).y;
 tpose.stop();const input=T.AnimationClip.findByName(source.animations,sourceName);if(!input)throw new Error(sourceName);const action=mixer.clipAction(input).play();action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;
 const tracks=new Map(bones.map(b=>[b.name,[]])),hip=[],times=[],frames=Math.ceil(input.duration*30);
 for(let f=0;f<=frames;f++){
  const time=Math.min(input.duration,f/30);mixer.setTime(time);source.scene.updateMatrixWorld(true);
  for(const b of bones){const sb=sourceBones.get(b.name.toLowerCase());let q;
   if(sb){const world=sb.getWorldQuaternion(new T.Quaternion()).multiply(sourceRest.get(b.name.toLowerCase()).clone().invert()).multiply(rest.get(b.name).q);const parent=b.parent.getWorldQuaternion(new T.Quaternion()).invert();q=parent.multiply(world);}
   else q=rest.get(b.name).local.clone();b.quaternion.copy(q);b.updateWorldMatrix(false,true);tracks.get(b.name).push(...q.toArray());
  }
  const hipHeight=sourceBones.get('pelvis').getWorldPosition(new T.Vector3()).y-sourceHip;
  const p=rest.get('pelvis').world.clone();p.y+=hipHeight*.94;target.scene.getObjectByName('pelvis').parent.worldToLocal(p);hip.push(...p.toArray());times.push(time);
 }
 const output=[...tracks].map(([n,v])=>new T.QuaternionKeyframeTrack(n+'.quaternion',times,v));output.push(new T.VectorKeyframeTrack('pelvis.position',times,hip));
 const clip=new T.AnimationClip(name,input.duration,output).optimize();const json=T.AnimationClip.toJSON(clip);for(const track of json.tracks){track.values=track.values.map(v=>Math.round(v*1e6)/1e6);track.times=track.times.map(v=>Math.round(v*1e6)/1e6);}clips.push(json);mixer.stopAllAction();
 console.log(name,sourceName,input.duration.toFixed(2),output.length);
}
await writeFile(new URL('../assets/motion-clips.json',import.meta.url),JSON.stringify({license:'CC0-1.0',source:'Quaternius Universal Animation Library 1+2 Standard',fps:30,clips}));
