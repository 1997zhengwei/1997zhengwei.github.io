import * as T from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';
import {clamp,damp,random,localPoint,worldPoint,roofAt} from './math.mjs';
import {roadX,roadSlope,hammerPosition} from './courses.mjs';
import {PHYSICS} from './simulation.mjs';
import {MotionRig,selectAnimationClips} from './presentation.mjs';
import {FinishPass} from './finish.mjs';
import {materialPalette,contactTexture} from './materials.mjs';
import {truckModel,wheelModel,truckShadowModel} from './truck-model.mjs';
import {landscape} from './landscape.mjs';
import {createCourier,createFirstPersonGear} from './courier.mjs';
import {createAthleticJump,athleticJumpProgress} from './jump-pose.mjs';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),D=new T.Object3D();
const std=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});

function boxGeometry(w,h,d,r=0){return r&&Math.min(w,h,d)>.18?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w*.4,h*.4,d*.4)):new T.BoxGeometry(w,h,d);}
function textTexture(text,{fg='#fff',bg='#d5533c',width=1024,height=192,font=96}={}){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`800 ${font}px system-ui, sans-serif`;ctx.fillText(text,width/2,height/2,width-55);const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}

export class Scene{
 constructor(canvas){
  this.canvas=canvas;this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.98;
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(82,1,.08,1600);this.camera.rotation.order='YXZ';this.clock=0;this.view='first';this.fx=[];this.fps=60;this.lastCharacterS=null;
  this.hemi=new T.HemisphereLight('#c7e8fa','#b29c71',.88);this.scene.add(this.hemi);this.sun=new T.DirectionalLight('#fff0d2',3.7);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-48;this.sun.shadow.camera.right=48;this.sun.shadow.camera.top=70;this.sun.shadow.camera.bottom=-70;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=230;this.sun.shadow.bias=-.00015;this.sun.shadow.normalBias=.065;this.sun.shadow.radius=2;this.scene.add(this.sun,this.sun.target);
  this.motion=new MotionRig();this.finishing=new FinishPass(this.renderer);this.visualPlayer={};this.motionInput={};this.landTime=0;
  this.characterRoot=new T.Group();this.scene.add(this.characterRoot);this.previewAngle=.34;this.scene.add(this.camera);this.handGear=createFirstPersonGear();this.camera.add(this.handGear.root);this.handGear.root.visible=false;this.characterReady=this.prepareCharacter().catch(e=>{console.warn('Courier model:',e.message);return false;});
  this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.finishing?.resize();}
 async prepareCharacter(){
  const [rig,motion]=await Promise.all([fetch(new URL('../assets/courier-rig.json',import.meta.url)).then(r=>r.json()),fetch(new URL('../assets/motion-clips.json',import.meta.url)).then(r=>r.json())]);
  this.courier=createCourier(rig);this.human=this.courier.root;this.bones=this.courier.bones;const athleticJump=createAthleticJump(this.human,this.bones);this.human.rotation.y=Math.PI;this.characterRoot.add(this.human);
  this.mixer=new T.AnimationMixer(this.human);this.actions={};const clips=selectAnimationClips([],motion.clips.map(c=>T.AnimationClip.parse(c)));
  clips.set('jump',athleticJump);
  for(const name of['idle_breathe','run','walk','jump','land','slide']){const clip=clips.get(name);if(clip){const action=this.mixer.clipAction(clip).play();action.setEffectiveWeight(name==='idle_breathe'?1:0);if(name==='jump')action.paused=true;if(name==='land'){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}this.actions[name]=action;}}
  return true;
 }
 disposeWorld(){if(!this.root)return;this.scene.remove(this.root);const gs=new Set(),ms=new Set(),ts=new Set();this.root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.customDepthMaterial)ms.add(o.customDepthMaterial);if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material])){ms.add(m);if(m.map)ts.add(m.map);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());this.fx=[];}
 load(course){
  this.disposeWorld();this.course=course;this.root=new T.Group();this.scene.add(this.root);this.scene.fog=new T.Fog(course.horizon,210,650);
  this.m=materialPalette(course);this.m.glass.side=T.DoubleSide;
  this.skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(course.sky)},bottom:{value:new T.Color(course.horizon)}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 top;uniform vec3 bottom;void main(){float h=normalize(v).y;vec3 c=mix(bottom,top,smoothstep(-.03,.45,h));float sun=pow(max(0.,dot(normalize(v),normalize(vec3(-.6,.55,-.4)))),120.);gl_FragColor=vec4(c+sun*vec3(.36,.3,.16),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
  this.skyMaterial.toneMapped=false;this.skyMaterial.uniforms.top.value.set(course.world===2?'#448fbd':course.world===1?'#3799c5':'#308fc7');
  this.sky=new T.Mesh(new T.SphereGeometry(430,24,16),this.skyMaterial);this.sky.frustumCulled=false;this.root.add(this.sky);
  if(this.environment)this.environment.dispose();const envScene=new T.Scene(),envSky=new T.Mesh(new T.SphereGeometry(200,16,12),this.skyMaterial);envScene.add(envSky);const pmrem=new T.PMREMGenerator(this.renderer);this.environment=pmrem.fromScene(envScene,.08,.1,300);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.40;pmrem.dispose();envSky.geometry.dispose();
  this.buildGround();landscape(this);this.buildTrucks();this.buildHazards();this.buildGoal();this.makeFX();
  this.marker=new T.Group();const markerMat=new T.MeshBasicMaterial({color:'#64c7b8',transparent:true,opacity:.8,depthWrite:false});for(const sx of[-1,1])for(const sz of[-1,1]){this.box(.4,.015,.04,markerMat,sx*.5,.02,sz*.5,this.marker,false);this.box(.04,.015,.4,markerMat,sx*.68,.02,sz*.32,this.marker,false);}this.root.add(this.marker);
 }
 box(w,h,d,mat,x=0,y=0,z=0,parent=this.root,shadow=true,r=0){const m=new T.Mesh(boxGeometry(w,h,d,r),mat);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
 instanced(g,mat,transforms,shadow=true){const mesh=new T.InstancedMesh(g,mat,transforms.length);transforms.forEach((t,i)=>{D.position.set(t.x,t.y,t.z);D.rotation.set(t.rx||0,t.ry||0,t.rz||0);D.scale.set(t.sx??1,t.sy??1,t.sz??1);D.updateMatrix();mesh.setMatrixAt(i,D.matrix);});mesh.castShadow=shadow;mesh.receiveShadow=true;mesh.computeBoundingSphere();this.root.add(mesh);return mesh;}
 buildGround(){
  const c=this.course,positions=[],normals=[],uvs=[],indices=[],start=-75,end=c.roadEnd,segments=Math.ceil((end-start)/5),roadWidth=c.width;
  for(let i=0;i<=segments;i++){const s=start+(end-start)*i/segments,x=roadX(c,s);for(const side of[-1,1]){positions.push(x+side*roadWidth/2,.012,-s);normals.push(0,1,0);uvs.push((side+1)/2,s/12);}if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);
  const mat=c.world===0?this.m.sand.clone():this.m.asphalt;if(c.world===0){mat.map=mat.map.clone();mat.map.repeat.set(2.5,1);mat.bumpMap=mat.map;}const road=new T.Mesh(geo,mat);road.receiveShadow=true;this.root.add(road);
  const groundY=c.world===1?-25:-.08;this.box(1100,.2,c.length+1000,this.m.sand,0,groundY-.11,-c.length*.5,this.root,false);
  const lines=[],edges=[],rails=[],supports=[];
  for(let s=-50;s<c.roadEnd;s+=12){const x=roadX(c,s);if(c.world!==0)for(let i=1;i<c.lanes;i++)lines.push({x:x+(i-c.lanes/2)*4.35,y:.027,z:-s,sx:.08,sy:.012,sz:3});for(const side of[-1,1]){if(c.world!==0){edges.push({x:x+side*(c.width/2-.2),y:.027,z:-s,sx:.16,sy:.018,sz:12});rails.push({x:x+side*(c.width/2+.1),y:.55,z:-s,sx:.15,sy:.11,sz:12});rails.push({x:x+side*(c.width/2+.1),y:.30,z:-s,sx:.08,sy:.6,sz:.09});}if(c.world===1&&Math.round(s)%48===10)supports.push({x:x+side*(c.width/2-2),y:-12.5,z:-s,sx:1.8,sy:25,sz:2.4});}}
  if(lines.length)this.instanced(new T.BoxGeometry(1,1,1),std('#e9e7d9',.9),lines,false);
  if(edges.length)this.instanced(new T.BoxGeometry(1,1,1),std('#f2ede0'),edges,false);
  if(rails.length)this.instanced(new T.BoxGeometry(1,1,1),this.m.metal,rails,true);
  if(supports.length)this.instanced(new T.BoxGeometry(1,1,1),this.m.concrete,supports,true);
  if(c.world===1){const deck=[];for(let s=-75;s<c.roadEnd;s+=5)deck.push({x:roadX(c,s),y:-.29,z:-s,ry:-Math.atan(roadSlope(c,s)),sx:c.width,sy:.55,sz:5.2});this.instanced(new T.BoxGeometry(1,1,1),this.m.concrete,deck,false);}
 }
 buildTrucks(){
  this.truckParts=[];this.truckCapacity=125;this.truckMatrices=Array.from({length:this.truckCapacity},()=>new T.Matrix4());this.wheelLocal=new T.Matrix4();this.wheelRotation=new T.Quaternion();this.wheelScale=V(1,1,1);this.wheelPosition=V();this.axleAxis=V(1,0,0);this.paintColor=new T.Color();
  for(const[key,geometry]of Object.entries(truckModel())){const mesh=new T.InstancedMesh(geometry,this.m[key],this.truckCapacity);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.userData.part=key;this.root.add(mesh);this.truckParts.push(mesh);}
  const shadow=new T.InstancedMesh(truckShadowModel(),new T.MeshBasicMaterial({colorWrite:false,depthWrite:false}),this.truckCapacity);shadow.castShadow=true;shadow.customDepthMaterial=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});shadow.frustumCulled=false;shadow.userData.part='_shadow';this.root.add(shadow);this.truckParts.push(shadow);
  const wheels=low=>{const list=[];for(const[key,geometry]of Object.entries(wheelModel(low))){const mesh=new T.InstancedMesh(geometry,this.m[key],this.truckCapacity*8);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;this.root.add(mesh);list.push(mesh);}return list;};this.wheels=wheels(false);this.distantWheels=wheels(true);
  const plane=new T.PlaneGeometry(1,1);plane.rotateX(-Math.PI/2);this.contacts=new T.InstancedMesh(plane,new T.MeshBasicMaterial({color:'#26363b',map:contactTexture(),transparent:true,opacity:.33,depthWrite:false}),this.truckCapacity*8);this.contacts.frustumCulled=false;this.contacts.renderOrder=1;this.root.add(this.contacts);this.contactPoint=V();
 }
 buildHazards(){
  const c=this.course;this.hammerModels=[];
  for(const o of c.obstacles){this.box(o.w,o.h,o.d,this.m.rock,o.x,o.h/2,-o.s,this.root,true,.04);this.box(o.w+.22,.32,o.d+.22,this.m.white,o.x,2.8,-o.s);this.box(o.w+.12,.65,.08,this.m.stripe,o.x,4.5,-o.s+o.d/2+.03);for(const side of[-1,1])this.box(.13,.4,.1,this.m.light,o.x+side*o.w*.30,4.5,-o.s+o.d/2+.08);}
  for(const h of c.hammers){for(const side of[-1,1]){this.box(.7,h.pivot+.5,.7,this.m.white,h.x+side*(c.width/2+1),h.pivot/2,-h.s);this.box(.9,1.15,.9,this.m.stripe,h.x+side*(c.width/2+1),1.15,-h.s);}this.box(c.width+3,.65,.8,this.m.white,h.x,h.pivot+.35,-h.s);const group=new T.Group();this.root.add(group);const head=new T.Mesh(new RoundedBoxGeometry(2.7,2.4,2.8,1,.16),this.m.dark);head.castShadow=true;group.add(head);for(const side of[-1,1])this.box(.14,2.3,2.75,this.m.stripe,side*1.25,0,0,group);const rod=new T.Mesh(new T.CylinderGeometry(.13,.13,1,8),this.m.metal);rod.castShadow=true;this.root.add(rod);this.hammerModels.push({h,group,rod});}
  for(const g of c.gates){for(const side of[-1,1])this.box(.22,g.top,.25,this.m.metal,g.x+side*g.w/2,g.top/2,-g.s);this.box(g.w,g.top-g.bottom,g.d,this.m.stripe,g.x,(g.top+g.bottom)/2,-g.s);const tex=textTexture('↓  LOW / 下蹲  ↓',{width:768,height:100,font:64,bg:'#b74c2e'});this.box(g.w*.95,.44,.025,new T.MeshBasicMaterial({map:tex}),g.x,g.top-.29,-g.s+g.d/2+.03,this.root,false);}
 }
 buildGoal(){
  const c=this.course,g=c.goal;
  this.box(g.w,4,g.maxS-g.minS,this.m.concrete,g.x,1.75,-(g.maxS+g.minS)/2);this.box(g.w,.12,g.maxS-g.minS,this.m.white,g.x,g.y-.06,-(g.maxS+g.minS)/2);
  if(c.world===1)for(const side of[-1,1])for(const s of[g.minS+6,g.maxS-6])this.box(2.2,25,2.8,this.m.concrete,g.x+side*g.w*.34,-12.4,-s);
  const gateS=c.length+7;for(const side of[-1,1]){this.box(.65,8,.65,this.m.white,g.x+side*(g.w/2-1),g.y+4,-gateS);this.box(.8,1.6,.8,this.m.stripe,g.x+side*(g.w/2-1),g.y+.8,-gateS);}
  const banner=textTexture('F I N I S H  /  终 点',{width:1536,height:200,font:108,bg:'#bb4f48'});this.box(g.w-1.5,2.05,.2,new T.MeshBasicMaterial({map:banner,fog:false}),g.x,g.y+7.3,-gateS);
  const startLine=c.length+2;for(let i=0;i<Math.floor(g.w/.8);i++)for(let j=0;j<2;j++)this.box(.8,.014,.8,(i+j)%2?this.m.dark:this.m.white,g.x-g.w/2+.4+i*.8,g.y+.013,-startLine+j*.8,this.root,false);
  const hint=textTexture('↗  助跑起跳  /  JUMP',{width:1024,height:140,font:72,bg:'#c76534'});for(const side of[-1,1]){const x=roadX(c,c.length-55)+side*(c.width/2+1);this.box(.12,6,.12,this.m.metal,x,3,-c.length+55);this.box(4.4,.8,.12,new T.MeshStandardMaterial({map:hint}),x,6,-c.length+55,this.root,false);}
 }
 makeFX(){this.fxMesh=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:'#e5ddd0',transparent:true,opacity:.33,depthWrite:false}),100);this.fxMesh.frustumCulled=false;this.root.add(this.fxMesh);this.fxMesh.count=0;}
 event(e,game){
  this.motion.event(e);
  if(e.type==='reset'){this.fx=[];this.landTime=0;this.actorHeading=0;for(const[name,a]of Object.entries(this.actions||{})){a.reset().play();a.setEffectiveWeight(name==='idle_breathe'?1:0);if(name==='jump')a.paused=true;}return;}
  if(e.type==='land'){
   this.landTime=.30;const action=this.actions?.land;if(action)action.reset().play();
   const p=game.player;for(let i=0;i<10;i++)this.fx.push({x:p.x+(Math.random()-.5)*.7,s:p.s+(Math.random()-.5)*.7,y:p.y+.05,vx:(Math.random()-.5)*2.8,vs:p.inheritS+(Math.random()-.5)*2.8,vy:.3+Math.random()*.4,life:.35,max:.35,size:.06+Math.random()*.05});
  }
  if(e.type==='crash'&&e.near){for(let i=0;i<14;i++)this.fx.push({x:e.x+(Math.random()-.5)*3,s:e.s+(Math.random()-.5)*4,y:e.y,vx:(Math.random()-.5)*3,vs:(Math.random()-.5)*3,vy:1+Math.random()*3,life:1.8,max:1.8,size:.3+Math.random()*.4});}
 }
 updateTrucks(game){
  const p=game.player,alpha=game.state==='playing'?(game.renderAlpha??1):1;this.visibleTrucks=game.trucks.filter(t=>t.s>p.s-50&&t.s<p.s+250&&t.y> -23).slice(0,this.truckCapacity);
  const count=this.visibleTrucks.length,matrices=this.truckMatrices;
  for(let i=0;i<count;i++){const t=this.visibleTrucks[i],yaw=t.prevYaw+Math.atan2(Math.sin(t.yaw-t.prevYaw),Math.cos(t.yaw-t.prevYaw))*alpha;D.position.set(t.prevX+(t.x-t.prevX)*alpha,t.prevY+(t.y-t.prevY)*alpha,-(t.prevS+(t.s-t.prevS)*alpha));D.rotation.set(t.pitch,-yaw,t.roll,'YXZ');D.scale.set(1,1,1);D.updateMatrix();matrices[i].copy(D.matrix);}
  for(const mesh of this.truckParts){mesh.count=count;for(let i=0;i<count;i++){mesh.setMatrixAt(i,matrices[i]);const t=this.visibleTrucks[i];if(mesh.userData.part==='white'||mesh.userData.part==='roof'){this.paintColor.setRGB(1,t.paint?.985:1,t.paint?.95:1);mesh.setColorAt(i,this.paintColor);}if(mesh.userData.part==='red'){this.paintColor.setScalar(t.brake>0?1.75:.85);mesh.setColorAt(i,this.paintColor);}}mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  const local=this.wheelLocal,rotation=this.wheelRotation,scale=this.wheelScale;let close=0,far=0,contacts=0;
  for(let i=0;i<count;i++){const t=this.visibleTrucks[i],near=Math.abs(t.s-p.s)<42,list=near?this.wheels:this.distantWheels;for(const side of[-1,1])for(const s of[-5.9,-4.15,3.1,6.0]){rotation.setFromAxisAngle(this.axleAxis,t.s/.62);this.wheelPosition.set(side*1.5,.635,-s);local.compose(this.wheelPosition,rotation,scale);local.premultiply(matrices[i]);for(const mesh of list)mesh.setMatrixAt(near?close:far,local);if(near)close++;else far++;if(!t.falling&&t.y>-.15&&Math.abs(t.roll)<.3){this.contactPoint.set(side*1.5,0,-s).applyMatrix4(matrices[i]);D.position.set(this.contactPoint.x,.025,this.contactPoint.z);D.rotation.set(0,-t.yaw,0);D.scale.set(.8,1,1.35);D.updateMatrix();this.contacts.setMatrixAt(contacts++,D.matrix);}}}
  for(const mesh of this.wheels){mesh.count=close;mesh.instanceMatrix.needsUpdate=true;}for(const mesh of this.distantWheels){mesh.count=far;mesh.instanceMatrix.needsUpdate=true;}
  this.contacts.count=contacts;this.contacts.instanceMatrix.needsUpdate=true;
 }
 updateCharacter(game,p,dt,view,yaw,preview=false){
  this.characterRoot.visible=preview||view==='third'&&game.state!=='ready';if(!this.human)return;this.landTime=Math.max(0,this.landTime-dt);
  const speed=Math.hypot(p.relX,p.relS),air=!p.grounded,run=clamp((speed-3.5)/3.5,0,1),moving=clamp(speed/.8,0,1),land=air?0:clamp(this.landTime/.30,0,1)*.72;
  const desiredHeading=speed>1?Math.atan2(p.relX,p.relS):this.actorHeading||yaw;this.actorHeading=(this.actorHeading||0)+Math.atan2(Math.sin(desiredHeading-(this.actorHeading||0)),Math.cos(desiredHeading-(this.actorHeading||0)))*(1-Math.exp(-12*dt));
  this.characterRoot.position.set(p.x,p.y,-p.s);this.characterRoot.rotation.y=-this.actorHeading;this.characterRoot.rotation.z=damp(this.characterRoot.rotation.z,-p.relX*.008,9,dt);
  this.human.position.y=-p.crouch*.5+Math.min(0,this.motion.last?.impact||0)*.48;this.human.rotation.x=p.crouch*.38;
  const weights={idle_breathe:air?0:(1-moving)*(1-land),walk:air?0:moving*(1-run)*(1-land),run:air?0:run*(1-land),jump:air?1:0,land,slide:p.crouch>.5?.7:0};
  for(const[name,a]of Object.entries(this.actions)){a.setEffectiveWeight(damp(a.getEffectiveWeight(),weights[name]||0,18,dt));if(name==='run')a.timeScale=clamp(speed/8,.7,1.6);if(name==='jump')a.time=athleticJumpProgress(p.vy,PHYSICS.jump)*(a.getClip().duration-.001);}
  this.mixer.update(dt);
  this.courier.update(dt,{focus:game.focus,active:game.focusActive,impact:this.motion.last?.impact||0});
 }
 updateMarker(game){
  const p=game.player;this.marker.visible=false;if(p.grounded||p.vy< -11)return;const g=PHYSICS.gravity,flight=(p.vy+Math.sqrt(Math.max(0,p.vy*p.vy+2*g*(p.y-3.82))))/g;if(flight<.08||flight>1.8)return;
  const x=p.x+p.vx*flight,s=p.s+p.vs*flight;
  for(const t of game.trucks){if(t.falling||t.crashed||Math.abs(t.s+t.vs*flight-s)>8)continue;const q=localPoint({...t,x:t.x+t.vx*flight,s:t.s+t.vs*flight},x,s);if(Math.abs(q.x)<1.45&&q.s> -7.4&&q.s<4){const pos=worldPoint(t,q.x,q.s);this.marker.position.set(pos.x,t.y+3.89,-pos.s);this.marker.rotation.y=-t.yaw;this.marker.visible=true;break;}}
 }
 render(game,input,dt,{menu=false,view='first',preview=false}={}){
  this.clock+=dt;this.view=view;const c=this.course,active=game.state==='playing',worldDt=active?dt*(game.focusActive?.38:1):0,p=Object.assign(this.visualPlayer,game.player),prev=game.renderPrev,alpha=active?(game.renderAlpha??1):1;
  if(prev&&active){p.x=prev.x+(p.x-prev.x)*alpha;p.y=prev.y+(p.y-prev.y)*alpha;p.s=prev.s+(p.s-prev.s)*alpha;}
  this.updateTrucks(game);const yaw=input.yaw||0;this.motionInput.pitch=input.pitch;this.motionInput.focus=game.focusActive;
  const motion=menu?null:this.motion.sample(p,this.motionInput,worldDt,{portrait:innerWidth<600,active,supportRoll:game.trucks[p.support]?.roll||0});
  this.updateCharacter(game,p,preview?dt:worldDt,view,yaw,preview);this.updateMarker(game);this.marker.visible&&=!menu;this.handGear.root.visible=!menu&&view==='first';this.handGear.update(game.time,p,game.focus,game.focusActive,motion?.impact||0,this.camera.aspect<1);
  for(const {h,group,rod} of this.hammerModels){const b=hammerPosition(h,game.time);group.position.set(b.x,b.y,-b.s);group.rotation.z=-Math.sin(game.time*2*Math.PI/h.period+h.phase)*.5;const a=V(h.x,h.pivot,-h.s),end=V(b.x,b.y,-b.s);rod.position.copy(a).add(end).multiplyScalar(.5);rod.scale.y=a.distanceTo(end);rod.quaternion.setFromUnitVectors(V(0,1,0),end.sub(a).normalize());}
  this.fx=this.fx.filter(f=>{f.life-=worldDt;return f.life>0;}).slice(-100);let n=0;for(const f of this.fx){f.x+=f.vx*worldDt;f.s+=f.vs*worldDt;f.y+=f.vy*worldDt;D.position.set(f.x,f.y,-f.s);D.rotation.set(0,0,0);const size=f.size*Math.sin(Math.min(1,f.life/f.max)*Math.PI*.5);D.scale.set(size,size*.6,size);D.updateMatrix();this.fxMesh.setMatrixAt(n++,D.matrix);}this.fxMesh.count=n;this.fxMesh.instanceMatrix.needsUpdate=true;
  if(this.camera.view?.enabled)this.camera.clearViewOffset();
  if(preview){const portrait=innerWidth<=760&&innerHeight>500,angle=this.previewAngle,distance=portrait?5.8:3.6;this.camera.position.set(p.x+Math.sin(angle)*distance,p.y+1.3,-p.s-Math.cos(angle)*distance);this.camera.lookAt(p.x,p.y+.99,-p.s);this.camera.fov=39;this.camera.setViewOffset(innerWidth,innerHeight,portrait?0:-innerWidth*.16,portrait?innerHeight*.16:0,innerWidth,innerHeight);}
  else if(menu){const hero=145,shift=Math.sin(this.clock*.12)*.8,x=roadX(c,hero);this.camera.position.set(x-c.width*.58+shift,6.0,-hero-19);this.camera.lookAt(x-c.width*.08,2.1,-hero+6);this.camera.fov=57;}
  else if(view==='third'){
   this.camera.position.set(p.x-Math.sin(yaw)*6.7,motion.y+1.65,-p.s+Math.cos(yaw)*6.7);this.camera.lookAt(p.x+Math.sin(yaw)*6,p.y+1.05,-p.s-Math.cos(yaw)*6);this.camera.fov=motion.fov-8;
  }else{
   this.camera.position.set(p.x,motion.y,-p.s);this.camera.rotation.set(motion.pitch,-yaw,motion.roll,'YXZ');this.camera.fov=motion.fov;
  }
  this.camera.updateProjectionMatrix();this.sky.position.copy(this.camera.position);const lightS=menu&&!preview?145:p.s;this.sun.target.position.set(p.x,0,-lightS-24);this.sun.position.set(p.x-38,65,-lightS+18);this.hemi.groundColor.set(c.world===2?'#a2bfcd':'#bda374');
  this.finishing.render(this.scene,this.camera,motion,{world:c.world,menu,time:game.time});this.fps=damp(this.fps,1/Math.max(dt,.004),2,dt);
 }
}
