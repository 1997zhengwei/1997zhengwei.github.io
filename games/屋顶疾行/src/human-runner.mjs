import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {clone} from '../vendor/utils/SkeletonUtils.js';
import {clamp,lerp,smooth,angleDelta} from './math.mjs';
import {LOOKS} from './world.mjs';
import {makeBackpacks,applyBackpack} from './equipment-visuals.mjs';
import {makeOutfitDetails,applyOutfitDetails} from './outfit-details.mjs';

let template=null,loading=null;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),X=V(1,0,0);
export async function prepareRunner(){
 if(!loading)loading=Promise.all([new GLTFLoader().loadAsync(new URL('../assets/runner.glb',import.meta.url).href),fetch(new URL('../assets/motion-clips.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Motion data unavailable');return r.json();})]).then(([asset,data])=>{const idle=T.AnimationClip.findByName(asset.animations,'idle_breathe');asset.animations=[idle,...data.clips.filter(c=>c.name!=='idle_breathe').map(c=>T.AnimationClip.parse(c))];template=asset;return asset;});
 return loading;
}
function elbow(a,b,l1,l2,pole){const dir=b.clone().sub(a),d=clamp(dir.length(),.001,l1+l2-.001);dir.normalize();const along=(l1*l1-l2*l2+d*d)/(2*d),out=pole.clone().sub(a);out.addScaledVector(dir,-out.dot(dir)).normalize();return a.clone().addScaledVector(dir,along).addScaledVector(out,Math.sqrt(Math.max(0,l1*l1-along*along)));}
function aimBone(bone,child,target){const a=bone.getWorldPosition(V()),from=child.getWorldPosition(V()).sub(a).normalize(),to=target.clone().sub(a).normalize();if(!from.lengthSq()||!to.lengthSq())return;const q=new T.Quaternion().setFromUnitVectors(from,to).multiply(bone.getWorldQuaternion(new T.Quaternion())),parent=bone.parent.getWorldQuaternion(new T.Quaternion()).invert();bone.quaternion.copy(parent.multiply(q));bone.updateWorldMatrix(false,true);}

export class Runner{
 constructor(textures,{ghost=false,asset=template}={}){
  if(!asset)throw new Error('Runner mesh has not loaded');
  this.root=new T.Group();this.pivot=new T.Group();this.root.add(this.pivot);this.model=clone(asset.scene);this.model.rotation.y=Math.PI;this.pivot.add(this.model);
  this.ghost=ghost;this.textures=textures;this.materials=[];this.ownedGeometry=[];this.bones=new Map();this.shown=new Map();this.clothes={};this.lastTime=null;this.lastYaw=0;this.bank=0;this.gait={idle:1,walk:0,run:0};
  this.model.traverse(o=>{if(o.isBone)this.bones.set(o.name,o);if(o.isMesh){o.castShadow=!ghost;o.receiveShadow=!ghost;o.frustumCulled=false;const materials=Array.isArray(o.material)?o.material:[o.material];const copies=materials.map(source=>{const m=ghost?new T.MeshBasicMaterial({color:'#88d8e2',transparent:true,opacity:.24,depthWrite:false}):source.clone();if(!ghost){m.envMapIntensity=.55;if(m.name==='Skin'){m.roughness=.67;m.normalScale.set(.35,.35);}if(m.name==='Cornea'){m.transparent=false;m.opacity=1;m.roughness=.22;}}this.materials.push(m);this.clothes[source.name]=m;return m;});o.material=Array.isArray(o.material)?copies:copies[0];}});
  this.root.updateWorldMatrix(true,true);this.addAccessories();
  this.mixer=new T.AnimationMixer(this.model);this.actions={};for(const name of['idle_breathe','walk','run','jump','land','roll','mantle','slide']){const clip=T.AnimationClip.findByName(asset.animations,name);if(!clip){if(['idle_breathe','walk','run'].includes(name))throw new Error('Missing gait clip '+name);continue;}this.actions[name]=this.mixer.clipAction(clip).play();this.actions[name].setEffectiveWeight(name==='idle_breathe'?1:0);}
  if(!ghost&&this.clothes.Cloth_hoodie){this.clothes.Cloth_hoodie.bumpMap=textures.cloth;this.clothes.Cloth_hoodie.bumpScale=.0025;this.clothes.Cloth_hoodie.roughness=.92;}
  this.mixer.update(0);this.root.updateWorldMatrix(true,true);this.applyLook('chalk');this.pose({mode:'idle',speed:0,grounded:true},0,true);
 }
 addMesh(geometry,material,parent){const m=new T.Mesh(geometry,material);m.castShadow=!this.ghost;m.receiveShadow=!this.ghost;parent.add(m);this.ownedGeometry.push(geometry);return m;}
 addAccessories(){
  const material=(color,roughness=.85)=>{const m=this.ghost?new T.MeshBasicMaterial({color:'#88d8e2',transparent:true,opacity:.24,depthWrite:false}):new T.MeshStandardMaterial({color,roughness});this.materials.push(m);return m;};
  this.trim=material('#a4c783');this.bagMaterial=material('#303b40');this.hatMaterial=material('#26333a');if(!this.ghost){this.hatMaterial.bumpMap=this.textures.cloth;this.hatMaterial.bumpScale=.003;}
  this.pack=new T.Group();this.root.add(this.pack);const bag=this.addMesh(new T.CapsuleGeometry(.12,.18,8,16),this.bagMaterial,this.pack);bag.position.set(0,1.34,.19);bag.scale.set(1.13,1,.60);const pocket=this.addMesh(new T.CapsuleGeometry(.082,.02,6,12),this.bagMaterial,this.pack);pocket.position.set(0,1.27,.27);pocket.scale.set(1.12,.65,.3);this.addMesh(new T.BoxGeometry(.014,.16,.008),this.trim,this.pack).position.set(.075,1.35,.271);
  for(const s of[-1,1]){const curve=new T.CatmullRomCurve3([V(s*.11,1.43,.20),V(s*.18,1.52,.02),V(s*.18,1.32,-.22),V(s*.12,1.19,.16)]);this.addMesh(new T.TubeGeometry(curve,20,.012,5,false),this.bagMaterial,this.pack);}
  this.bones.get('spine_03').attach(this.pack);
  this.hat=new T.Group();this.root.add(this.hat);this.hat.position.set(0,1.775,-.025);this.cap=this.addMesh(new T.SphereGeometry(.112,24,14,0,Math.PI*2,0,Math.PI*.52),this.hatMaterial,this.hat);this.cap.scale.set(1,.82,1.07);const rim=this.addMesh(new T.TorusGeometry(.106,.012,8,32),this.hatMaterial,this.hat);rim.rotation.x=Math.PI/2;rim.position.y=-.007;this.brim=this.addMesh(new T.SphereGeometry(.105,24,8),this.hatMaterial,this.hat);this.brim.scale.set(1,.075,.75);this.brim.position.set(0,-.008,-.12);this.bones.get('head').attach(this.hat);makeBackpacks(this);makeOutfitDetails(this);
 }
 applyLook(id){const l=LOOKS.find(l=>l.id===id)||LOOKS[0];this.lookId=l.id;if(!this.ghost){for(const [name,color] of[['Cloth_hoodie',l.jacket],['Cloth_jeans',l.pants],['Cloth_shoes',l.shoes],['Hair_short02',l.hair]]){const m=this.clothes[name];if(m)m.color.set(color).multiplyScalar(name==='Cloth_shoes'?1.25:1.4);}this.trim.color.set(l.accent);this.bagMaterial.color.set(l.pants);this.hatMaterial.color.set(l.pants);}this.pack.visible=l.pack;this.hat.visible=l.hat!=='none';this.brim.visible=l.hat==='cap';this.cap.scale.y=l.hat==='beanie'?1.15:.82;this.currentLookPack=l.pack;applyBackpack(this,this.equipment);applyOutfitDetails(this,l.id);if(this.clothes.Cloth_hoodie)this.clothes.Cloth_hoodie.roughness=l.id==='chalk'?1:l.id==='sunbeam'?.72:.9;}
 setEquipment(loadout){this.equipment=loadout;applyBackpack(this,loadout);}
 point(x,y,z){return this.root.localToWorld(V(x,y,-z));}
 solve(upperName,lowerName,endName,target,pole){const a=this.bones.get(upperName),b=this.bones.get(lowerName),c=this.bones.get(endName),pa=a.getWorldPosition(V()),pb=b.getWorldPosition(V()),pc=c.getWorldPosition(V()),l1=pa.distanceTo(pb),l2=pb.distanceTo(pc);const end=target.clone().sub(pa).clampLength(.02,l1+l2-.002).add(pa),joint=elbow(pa,end,l1,l2,pole);aimBone(a,b,joint);aimBone(b,c,end);}
 hip(height){const pelvis=this.bones.get('pelvis'),pos=pelvis.getWorldPosition(V());pos.y=this.root.getWorldPosition(V()).y+height;pelvis.position.copy(pelvis.parent.worldToLocal(pos));pelvis.updateWorldMatrix(false,true);}
 special(p,mode,phase,time){
  let hip=.92,lean=0;const rise=clamp((p.vy||0)/8.6,-1,1),flight=p.airTime??phase*.8;
  if(mode==='air'){hip=.88;lean=.13;}
  if(mode==='vault'){hip=.83;lean=Math.sin(phase*Math.PI)*.65;}
  if(mode==='hang'){hip=clamp(.43+(p.hang?.top-p.y||1.58)*.28,.60,.92);lean=.20;}
  if(mode==='mantle'){hip=lerp(.62,.92,smooth(phase));lean=Math.sin(phase*Math.PI)*.9;}
  if(mode==='wallrun'){hip=.88;lean=.13;}
  if(mode==='slide'){hip=.35;lean=-.38;}
  if(mode==='roll'){hip=.48;lean=1.1;}
  this.hip(hip);for(const n of['spine_01','spine_02','spine_03']){this.bones.get(n).quaternion.multiply(new T.Quaternion().setFromAxisAngle(X,lean*.34));}this.root.updateWorldMatrix(true,true);
  for(const side of[-1,1]){const suffix=side>0?'l':'r';let foot=V(side*.105,.095,.02),hand=V(side*.27,.94,.08),knee=V(side*.14,.48,.55),armPole=V(side*.40,1.18,-.20);
   if(mode==='air'){const tuck=p.trick>0?Math.sin(clamp(p.trick,0,1)*Math.PI):Math.sin(clamp(flight/.7,0,1)*Math.PI)*.55;foot.set(side*.12,.13+(side>0?.51:.43)*tuck,side>0?.38:.18);hand.set(side*(.32-.11*tuck),1.25-.34*tuck+rise*.08,.27+.10*tuck);knee.set(side*.15,.76,.65);}
   if(mode==='vault'){const tuck=Math.sin(phase*Math.PI);foot.set(side*.14,.12+tuck*(side>0?.65:.47),side>0?.23:-.35*tuck);hand.set(side*.22,1.15-tuck*.25,.38);}
   if(mode==='hang'){foot.set(side*.13,.12,side>0?-.15:-.25);hand.set(side*.22,1.63,.34);armPole.set(side*.36,1.45,.05);}
   if(mode==='mantle'){const tuck=Math.sin(phase*Math.PI);foot.set(side*.14,.12+tuck*(side>0?.46:.22),.32*tuck);hand.set(side*.22,lerp(1.63,.95,phase),.34);armPole.set(side*.36,1.45,.05);}
   if(mode==='wallrun'){const cycle=time*14+side*Math.PI;foot.set(side*.13,.12+Math.max(0,Math.sin(cycle))*.22,Math.cos(cycle)*.30);hand.set(side*.32,1.25,side>0?.22:-.13);}
   if(mode==='slide'){foot.set(side*.14,.085,side>0?.73:-.18);hand.set(side*.30,.35,side>0?-.07:.21);knee.set(side*.16,.43,.35);}
   if(mode==='roll'){foot.set(side*.13,.32,.26);hand.set(side*.22,.85,.35);knee.set(side*.16,.75,.50);}
   if(mode==='celebrate'){hand.set(side*.31,side>0?1.78:1.05,side>0?.05:.10);}
   this.solve('thigh_'+suffix,'calf_'+suffix,'foot_'+suffix,this.point(foot.x,foot.y,foot.z),this.point(knee.x,knee.y,knee.z));
   let target=this.point(hand.x,hand.y,hand.z);const grip=p.hang||p.kinematic;
   if(grip&&['hang','mantle','vault'].includes(mode)){
    const h=p.hang?{x:p.hang.handX,y:p.hang.top+.025,z:p.hang.handZ}:p.kinematic.hand;
    if(h){const across=V(Math.cos(p.yaw||0)*side*.19,0,-Math.sin(p.yaw||0)*side*.19),fixed=V(h.x,h.y,h.z).add(across),weight=mode==='vault'?1-smooth(clamp((phase-.40)/.3,0,1)):mode==='mantle'?1-smooth(clamp((phase-.35)/.4,0,1)):1;target.lerp(fixed,weight);}
   }
   this.solve('upperarm_'+suffix,'lowerarm_'+suffix,'hand_'+suffix,target,this.point(armPole.x,armPole.y,armPole.z));
  }
 }
 pose(p,time,preview=false){
  const dt=this.lastTime===null||time<this.lastTime?1/60:clamp(time-this.lastTime,0,.06);this.lastTime=time;
  const mode=p.mode||'idle',speed=p.speed||0,phase=clamp(p.actionProgress||0,0,1),running=mode==='run',fast=clamp((speed-3.5)/3.5,0,1),target={idle:running?0:1,walk:running?1-fast:0,run:running?fast:0};
  const specialName=p.grounded&&(p.landPulse||0)>0&&['idle','run'].includes(mode)?'land':{air:'jump',vault:'jump',mantle:'mantle',slide:'slide',roll:'roll'}[mode],specialAction=this.actions[specialName];
  for(const n of['idle','walk','run']){this.gait[n]=lerp(this.gait[n],specialAction?0:target[n],1-Math.exp(-dt*18));this.actions[n==='idle'?'idle_breathe':n].setEffectiveWeight(this.gait[n]);}
  for(const name of['jump','land','roll','mantle','slide'])if(this.actions[name]){const action=this.actions[name],weight=lerp(action.getEffectiveWeight(),name===specialName?1:0,1-Math.exp(-dt*20));action.setEffectiveWeight(weight);action.paused=true;if(name===specialName)action.time=name==='land'?(.10+.70*(1-clamp((p.landPulse||0)/.22,0,1)))*action.getClip().duration:name==='jump'?Math.min(action.getClip().duration-.01,.35+(p.airTime||0)*.65):phase*action.getClip().duration;}
  this.actions.walk.setEffectiveTimeScale(clamp(speed/2.2,.7,1.8));this.actions.run.setEffectiveTimeScale(clamp(speed/6.5,.75,1.55));this.mixer.update(dt);
  this.pivot.position.set(0,0,0);this.pivot.rotation.set(0,0,0);this.model.position.set(0,0,0);this.root.updateWorldMatrix(true,true);
  if(!['idle','run','respawn','ready'].includes(mode)&&!(mode==='roll'&&this.actions.roll))this.special(p,mode,phase,time);
  const alpha=1-Math.exp(-dt*(mode==='hang'||mode==='mantle'?32:22));
  for(const [name,bone]of this.bones){let last=this.shown.get(name);if(!last){last={q:bone.quaternion.clone(),p:bone.position.clone()};this.shown.set(name,last);}const goalQ=bone.quaternion.clone(),goalP=bone.position.clone();bone.quaternion.copy(last.q).slerp(goalQ,alpha);bone.position.copy(last.p).lerp(goalP,alpha);last.q.copy(bone.quaternion);last.p.copy(bone.position);}
  if(mode==='roll'&&!this.actions.roll){this.pivot.position.y=.55;this.model.position.y=-.55;this.pivot.rotation.x=-Math.PI*2*smooth(phase);}
  if(mode==='vault')this.pivot.rotation.z=Math.sin(phase*Math.PI)*.14;
  if(mode==='air'&&p.trick>0){this.pivot.position.y=.92;this.model.position.y=-.92;if(p.trickKind==='side')this.pivot.rotation.z=-Math.PI*2*smooth(p.trick);else this.pivot.rotation.x=-Math.PI*2*smooth(p.trick);}
  if(running){this.pivot.rotation.x=-clamp(speed/9.6,0,1)*.09;this.pivot.position.y=-Math.sin(clamp((p.landPulse||0)/.22,0,1)*Math.PI)*.12;}
  if(mode==='wallrun'&&p.wallNormal){const side=Math.cos(p.yaw||0)*p.wallNormal.x-Math.sin(p.yaw||0)*p.wallNormal.z;this.pivot.rotation.z=clamp(side,-1,1)*.25;}
  if(running&&dt>0){const turn=clamp(angleDelta(this.lastYaw,p.yaw||0)/Math.max(.008,dt),-3,3);this.bank=lerp(this.bank,turn*.025,1-Math.exp(-dt*8));this.pivot.rotation.z=this.bank;}else this.bank=lerp(this.bank,0,.15);
  this.lastYaw=p.yaw||0;this.root.updateWorldMatrix(true,true);
  if((mode==='idle'||mode==='run')&&p.grounded!==false){const y=Math.min(...['foot_l','foot_r'].map(n=>this.root.worldToLocal(this.bones.get(n).getWorldPosition(V())).y));this.pivot.position.y+=clamp(.092-y,-.12,.18);this.root.updateWorldMatrix(true,true);}
 }
 setWorld(p,time){this.root.position.set(p.x,p.y+.01,p.z);this.root.rotation.y=p.yaw||0;this.pose(p,time);}
 dispose(){for(const g of this.ownedGeometry)g.dispose();for(const m of this.materials)m.dispose();this.mixer.stopAllAction();this.mixer.uncacheRoot(this.model);}
}
