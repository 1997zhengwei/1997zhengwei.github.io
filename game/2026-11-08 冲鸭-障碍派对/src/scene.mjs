import * as T from '../vendor/three.module.js';
import {COURSE,SKINS,clamp,spinnerAngle,pusherX} from './course.mjs';
import {hammerPose,jetState,floorCenter,courseCenter} from './tracks.mjs';
import {THEMES,buildEnvironment} from './environments.mjs';
import {buildCurvedRoad} from './curved-road.mjs';
import {DEFAULT_LOOK} from './progression.mjs';
import {adornAvatar} from './ornaments.mjs';
import {studioEnvironment} from './couture.mjs';
export {T};
const materials=new Map(),geometries=new Map(),avatarMaterials=new Map();
const palette={blue:'#12bce8',deep:'#2664cf',yellow:'#ffcf24',pink:'#f83e91',white:'#ffffff'};
function material(color,{metal=0,glow=0}={}){const k=color+':'+metal+':'+glow;if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial({color,roughness:metal?.28:.72,metalness:metal,emissive:color,emissiveIntensity:glow}));return materials.get(k);}
function add(g,geo,color,x=0,y=0,z=0,opts){const m=new T.Mesh(geo,material(color,opts));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function roundedGeometry(w,h,d,r=.12){
 const key=[w,h,d,r].join(':');if(geometries.has(key))return geometries.get(key);
 r=Math.min(r,w/2,h/2,d/2);const geo=new T.BoxGeometry(w,h,d,4,4,4),pos=geo.attributes.position,norm=geo.attributes.normal;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),qx=clamp(x,-w/2+r,w/2-r),qy=clamp(y,-h/2+r,h/2-r),qz=clamp(z,-d/2+r,d/2-r),dx=x-qx,dy=y-qy,dz=z-qz,len=Math.hypot(dx,dy,dz)||1;
  pos.setXYZ(i,qx+dx/len*r,qy+dy/len*r,qz+dz/len*r);norm.setXYZ(i,dx/len,dy/len,dz/len);
 }geometries.set(key,geo);return geo;
}
function box(g,x,y,z,w,h,d,c,r=.08,opts){return add(g,roundedGeometry(w,h,d,r),c,x,y,z,opts);}
function ball(g,x,y,z,r,c,sx=1,sy=1,sz=1,opts){const smooth=opts?.smooth??false,key=`sphere:${r}:${smooth}`;if(!geometries.has(key)){const seg=smooth?(r<.1?16:r<.25?20:28):14;geometries.set(key,new T.SphereGeometry(r,seg,smooth?Math.round(seg*.7):10));}const m=add(g,geometries.get(key),c,x,y,z,opts);m.scale.set(sx,sy,sz);return m;}
function cyl(g,x,y,z,r,h,c,r2=r,opts){const key=`cyl:${r}:${r2}:${h}`;if(!geometries.has(key))geometries.set(key,new T.CylinderGeometry(r,r2,h,24));return add(g,geometries.get(key),c,x,y,z,opts);}
function grp(g,x=0,y=0,z=0){const n=new T.Group();n.position.set(x,y,z);g.add(n);return n;}
function torus(g,x,y,z,r,tube,c){return add(g,new T.TorusGeometry(r,tube,8,36),c,x,y,z);}
function capsule(g,x,y,z,r,length,c){return add(g,new T.CapsuleGeometry(r,length,6,20),c,x,y,z);}

function avatarBall(g,x,y,z,r,c,sx=1,sy=1,sz=1,opts){return ball(g,x,y,z,r,c,sx,sy,sz,{...opts,smooth:true});}
function avatarFinish(source){
 if(!avatarMaterials.has(source.uuid)){const metal=source.metalness>.3,gloss=source.color.getHexString()==='16bff0';const m=new T.MeshPhysicalMaterial({color:source.color,metalness:metal?Math.min(source.metalness,.58):.025,roughness:gloss?.15:metal?.27:.42,envMap:studioEnvironment(),envMapIntensity:metal?.8:.25,clearcoat:gloss?1:.45,clearcoatRoughness:.25,emissive:source.color,emissiveIntensity:Math.max(source.emissiveIntensity,.025)});avatarMaterials.set(source.uuid,m);}return avatarMaterials.get(source.uuid);
}
function visibleBounds(root){const bounds=new T.Box3();root.updateWorldMatrix(true,true);root.traverseVisible(o=>{if(o.isMesh&&o.geometry){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});return bounds;}
function frameThumbnail(camera,bounds,direction,padding=1.12){const size=bounds.getSize(new T.Vector3()),centre=bounds.getCenter(new T.Vector3()),v=Math.tan(T.MathUtils.degToRad(camera.fov/2)),distance=Math.max(size.y/(2*v),size.x/(2*v*camera.aspect))*padding+size.z*.7;camera.position.copy(centre).addScaledVector(direction.clone().normalize(),distance);camera.lookAt(centre);camera.updateProjectionMatrix();}
function thumbnailStudio(){const scene=new T.Scene();scene.add(new T.HemisphereLight('#fff9f1','#8da5d1',1.5));for(const [color,power,pos]of[['#ffffff',1.9,[-3,5,5]],['#71e6ff',1.15,[4,3,-4]],['#e5a0ff',.8,[-4,2,-3]]]){const light=new T.DirectionalLight(color,power);light.position.set(...pos);scene.add(light);}return scene;}

export function createAvatar(parent,skin='duck'){
 const ball=avatarBall;const root=grp(parent),body=grp(root),arms=[],legs=[],attachments=grp(body),baseParts=[];let nativeCrown=null;
 const outer=skin==='gold'?'#f6b919':skin==='duck'?'#ffdc30':skin==='cat'?'#ff72bb':skin==='shark'?'#20c9ef':skin==='robot'?'#8850ee':'#f1f6ff';
 const torso=ball(body,0,.82,0,.45,outer,1,1.1,.88,{metal:skin==='gold'?.52:0});
 const head=grp(body,0,1.44,0);ball(head,0,0,0,.49,outer,1,1.04,.95,{metal:skin==='gold'?.52:0});
 if(['duck','gold'].includes(skin)){
  // Bright, recognisable duck silhouette with overalls and a sculpted bill.
  ball(body,0,.72,.08,.43,skin==='gold'?'#fff2b3':'#237be8',1,.76,.92);
  for(const s of[-1,1]){box(body,s*.23,1.01,.315,.12,.31,.06,skin==='gold'?'#fff0a3':'#2676e5',.03);ball(body,s*.23,.88,.355,.035,'#ffd339');}
  for(const x of[-.19,.19]){ball(head,x,.07,.393,.145,'#ffffff',.84,1.13,.42);ball(head,x,.063,.452,.074,'#1e2647',.82,1.1,.45);ball(head,x-.018,.1,.484,.021,'#ffffff');}
  ball(head,0,-.15,.45,.27,'#ff961c',1,.42,.85);ball(head,0,-.23,.43,.23,'#e97a18',1,.2,.8);
  const tuft=ball(head,0,.46,-.08,.13,outer,.6,1.25,.7);tuft.rotation.z=-.3;
  ball(body,0,.75,-.38,.2,outer,.7,.8,1.3);
 }
 if(skin==='cat'){
  for(const s of[-1,1]){const ear=add(head,new T.ConeGeometry(.2,.43,3),'#ff7db3',s*.31,.4,0);ear.rotation.z=s*-.18;box(head,s*.31,.42,.085,.12,.16,.025,'#ffc5dd',.02);}
  ball(head,0,-.08,.35,.35,'#ffe8f0',1,.66,.38);for(const x of[-.18,.18]){ball(head,x,.075,.432,.06,'#34304c',.8,1.3,.4);box(head,x*1.8,-.12,.42,.12,.018,.02,'#9c4e7c',.008);}
  ball(head,0,-.085,.49,.052,'#b84975',1,.7,.5);ball(body,0,.79,.29,.31,'#ffcae0',1,1.12,.5);const tail=torus(body,.12,.65,-.46,.24,.075,'#ff8cbf');tail.rotation.y=.7;
 }
 if(skin==='shark'){
  ball(head,0,-.06,.34,.36,'#f3fbff',1,.9,.5);for(const x of[-.2,.2])ball(head,x,.1,.445,.061,'#12305b',.8,1,.5);
  box(head,0,-.15,.515,.33,.085,.025,'#1e4271',.035);for(const x of[-.1,0,.1]){const tooth=add(head,new T.ConeGeometry(.035,.07,3),'#ffffff',x,-.13,.54);tooth.rotation.z=Math.PI;}
  const fin=add(head,new T.ConeGeometry(.18,.4,3),'#128bc7',0,.47,-.14);fin.scale.z=.35;ball(body,0,.79,.28,.32,'#e5fbff',1,1.18,.5);
  const dorsal=add(body,new T.ConeGeometry(.25,.55,3),'#1699d2',0,.9,-.43);dorsal.rotation.x=-.35;dorsal.scale.x=.35;
 }
 if(skin==='robot'){
  box(head,0,0,0,.9,.8,.75,'#8651e7',.16);box(head,0,.035,.39,.7,.29,.07,'#162845',.1);for(const x of[-.19,.19])box(head,x,.04,.44,.12,.08,.04,'#7dffdf',.02,{glow:.7});
  cyl(head,0,.55,0,.035,.35,'#d5dfff');ball(head,0,.76,0,.095,'#68ffe2',1,1,1,{glow:.4});box(body,0,.88,.4,.3,.22,.08,'#80ffe1',.06,{glow:.25});
 }
 if(skin==='astro'){
  ball(head,0,.02,.24,.425,'#16bff0',1,.8,.73,{metal:.4});ball(head,-.15,.12,.5,.1,'#d5f6ff',1,.35,.2);box(body,0,.86,.4,.3,.27,.07,'#4776c6',.04);for(const x of[-.08,.08])ball(body,x,.88,.45,.035,x<0?'#ff6781':'#66edcd');box(body,0,.88,-.38,.52,.62,.25,'#c5d9ef',.1);
 }
 if(skin==='gold'){
  const crown=grp(head,0,.5,0);nativeCrown=crown;cyl(crown,0,.08,0,.34,.15,'#ffdc67');for(let i=0;i<5;i++){const a=i/5*Math.PI*2;add(crown,new T.ConeGeometry(.1,.3,5),'#ffe18c',Math.cos(a)*.27,.25,Math.sin(a)*.27,{metal:.5});ball(crown,Math.cos(a)*.27,.41,Math.sin(a)*.27,.046,'#fff2ad');}
  ball(crown,0,.08,.34,.06,'#a66bff',1,1,.5);
 }
 for(const s of[-1,1]){
  const arm=grp(body,s*.43,1.05,0);capsule(arm,0,-.15,0,.13,.21,outer);ball(arm,0,-.31,.01,.145,outer,1,.9,1);arms.push(arm);
  const leg=grp(body,s*.22,.47,0);capsule(leg,0,-.13,0,.115,.16,skin==='robot'?'#483b72':skin==='astro'?'#cbd8f3':'#1c3f76');
  ball(leg,0,-.32,.11,.19,['duck','gold'].includes(skin)?'#ff9e20':skin==='cat'?'#dd4e91':skin==='shark'?'#148fca':skin==='robot'?'#92ffe4':'#dbe7ff',1,.63,1.45);legs.push(leg);
 }
 const shadow=add(parent,new T.CircleGeometry(.48,18),'#1643aa');shadow.rotation.x=-Math.PI/2;shadow.material=new T.MeshBasicMaterial({color:'#15478d',transparent:true,opacity:.23,depthWrite:false});shadow.castShadow=false;
 const hurtStars=grp(root,0,2.65,0);for(let i=0;i<3;i++){const shape=new T.Shape();for(let j=0;j<10;j++){const a=j/10*Math.PI*2,r=j%2?.06:.13;j?shape.lineTo(Math.cos(a)*r,Math.sin(a)*r):shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}shape.closePath();const star=add(hurtStars,new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false}),'#ffeb69');star.castShadow=false;}hurtStars.visible=false;
 root.traverse(o=>{if(o.isMesh)o.material=avatarFinish(o.material);});
 let turn=0;
 return {root,body,head,skin,shadow,nativeCrown,animate(p,time,dt,{pose=false,win=false,inspection=null}={}){
  root.position.set(p.x,p.y,p.z);shadow.position.set(p.x,.028,p.z);shadow.visible=p.y>=-.02&&p.y<4;shadow.material.opacity=.23-Math.min(p.y*.035,.15);shadow.scale.setScalar(1+Math.max(0,p.y)*.08);
  hurtStars.visible=p.hurt>0;hurtStars.children.forEach((star,i)=>{const a=time*8+i/3*Math.PI*2;star.position.set(Math.cos(a)*.55,Math.sin(a*2)*.08,Math.sin(a)*.38);star.rotation.y=-root.rotation.y;});body.rotation.z+=(p.stun>0?Math.sin(time*26)*.32-body.rotation.z:-body.rotation.z)*Math.min(1,dt*15);
  const speed=Math.hypot(p.vx??0,p.vz??0),moving=speed>.35,stride=time*(moving?13:3)+p.id*.7;
  body.position.y=moving&&p.grounded?Math.abs(Math.sin(stride))*.055:Math.sin(time*2+p.id)*.025;
  if(win)body.position.y=Math.abs(Math.sin(time*4))*.2;
  const tilt=p.stun>0?Math.sin(time*28)*.25:p.boost>0?-.95:0;body.rotation.x+=(tilt-body.rotation.x)*Math.min(1,dt*15);
  for(let i=0;i<2;i++){const v=Math.sin(stride+i*Math.PI);legs[i].rotation.x=moving&&p.grounded?v*.65:p.grounded?0:(i?-.3:.4);arms[i].rotation.x=win?-2.5:moving?-v*.65:Math.sin(time*2)*.08;arms[i].rotation.z=win?(i?-.45:.45):(i?-.13:.13);}
  const desired=pose?(inspection??Math.sin(time*.5)*.18):moving?Math.atan2(p.vx,p.vz):Math.PI;let diff=Math.atan2(Math.sin(desired-turn),Math.cos(desired-turn));turn+=diff*Math.min(1,dt*12);root.rotation.y=turn;
  root.visible=p.waiting<=0||Math.floor(time*12)%2===0;
 }};
}

export class Stadium{
 constructor(container,runners,look=DEFAULT_LOOK){
  this.runners=runners;this.avatars=new Map();this.spinners=new Map();this.pushers=new Map();this.hammers=new Map();this.pickups=new Map();this.beltTextures=[];this.flags=[];this.jets=new Map();this.springs=[];this.particles=[];this.view='lobby';this.raceTime=0;
  const renderer=this.renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;container.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','障碍派对三维赛场');
  this.scene=new T.Scene();this.scene.background=new T.Color('#54d8fb');this.scene.fog=new T.Fog('#8be5ff',70,190);
  this.camera=new T.PerspectiveCamera(58,1,.1,240);this.cameraTarget=new T.Vector3();this.cameraPosition=new T.Vector3();
  this.hemi=new T.HemisphereLight('#fff7ef','#759bc6',1.3);this.scene.add(this.hemi);
  const light=this.sun=new T.DirectionalLight('#fffaf4',2.2);light.position.set(-10,18,9);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.1,far:60});light.shadow.normalBias=.04;this.scene.add(light,light.target);
  const fill=this.fill=new T.DirectionalLight('#88cfff',.7);fill.position.set(8,6,-10);this.scene.add(fill);
  this.studioLights=[];for(const [color,power,offset]of[['#ffffff',.7,[5,5,7]],['#79ddff',1.05,[-5,4,-4]],['#e1a2ff',.65,[5,3,-4]]]){const light=new T.DirectionalLight(color,power);this.scene.add(light,light.target);this.studioLights.push({light,offset});}
  this.world=grp(this.scene);this.fx=grp(this.scene);this.buildCourse();
  this.podium=grp(this.scene,45,0,5);cyl(this.podium,0,-.12,0,3.8,.6,'#172843');cyl(this.podium,0,.15,0,2.2,.6,'#233c65');cyl(this.podium,0,.47,0,2.28,.09,'#1e3151');
  for(const r of[2.28,3.5]){const rim=torus(this.podium,0,r===2.28?.52:.2,0,r,.018,'#dce6ff');rim.rotation.x=Math.PI/2;}
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const dash=box(this.podium,Math.sin(a)*3.1,.21,Math.cos(a)*3.1,.14,.06,.5,'#8ce3ff',.02);dash.rotation.y=a;}

  for(const p of runners)this.avatars.set(p.id,createAvatar(this.scene,p.skin));
  this.setLook(0,look);
  for(const p of runners.slice(1))this.setLook(p.id,{...DEFAULT_LOOK,...(p.id===1?{head:'royal',back:'galaxy',trail:'stardust',color:'#b891ff'}:p.id===2?{head:'orbit',back:'rocket',trail:'spark',color:'#70edff'}:p.id===3?{head:'halo',back:'angel',trail:'stars',color:'#ff8dc9'}:p.id%3===0?{head:'tophat',back:'bow',color:'#ff8dc9'}:{head:'party',color:p.id%2?'#80ffd2':'#ffd239'})});
  this.arrow=add(this.scene,new T.ConeGeometry(.17,.3,3),'#ffeb33');this.arrow.rotation.z=Math.PI;this.arrow.castShadow=false;
  this.resize=()=>{const r=container.getBoundingClientRect();this.width=r.width;this.height=r.height;const ratio=Math.min(devicePixelRatio||1,this.view==='race'?1.6:2);renderer.setPixelRatio(ratio);this.renderRatio=ratio;renderer.setSize(r.width,r.height);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();};new ResizeObserver(this.resize).observe(container);this.resize();this.update(0,0,true);
 }
 buildCourse(){
  const g=this.world,t=this.theme=THEMES[COURSE.theme];this.scene.fog.color.set(t.fog);this.sun.color.set(t.light);this.hemi.groundColor.set(COURSE.theme==='neon'?'#61557b':'#759bc6');
  const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=128;const ctx=texCanvas.getContext('2d');ctx.fillStyle=t.floor;ctx.fillRect(0,0,128,128);ctx.fillStyle=t.fleck;for(const [x,y,r]of[[20,17,8],[88,36,13],[46,89,10],[117,108,7]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  if(COURSE.theme!=='cloud'){ctx.strokeStyle=COURSE.theme==='ice'?'#e4fdff77':'#161d3b33';ctx.lineWidth=COURSE.theme==='ice'?2:3;for(let i=0;i<=128;i+=32){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(128,i);ctx.moveTo(i,0);ctx.lineTo(i,128);ctx.stroke();}}
  const tex=new T.CanvasTexture(texCanvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.repeat.set(4,6);this.floorMaterial=new T.MeshStandardMaterial({map:tex,roughness:.95});
  for(const f of COURSE.floors){
   if(f.curve){const m=this.floorMaterial.clone();m.map=tex.clone();m.map.repeat.set(1,1);m.map.needsUpdate=true;buildCurvedRoad(g,f,m,material(t.edge),material('#ffe797'));for(let i=2;i<f.curve.length-2;i+=3){const p=f.curve[i],next=f.curve[i+1],dash=box(g,p.x,.035,p.z,.13,.025,1.1,'#f6fcff',.01);dash.rotation.y=Math.atan2(next.x-p.x,next.z-p.z);}continue;}

   const top=box(g,f.x,-.24,f.z,f.w,.5,f.d,COURSE.theme==='cloud'?(f.color==='yellow'?palette.yellow:palette.blue):t.floor,.14);if(f.color==='blue'||COURSE.theme!=='cloud'){const m=this.floorMaterial.clone();m.map=tex.clone();m.map.needsUpdate=true;m.map.repeat.set(f.w/5,f.d/5);top.material=m;}
   box(g,f.x,-.66,f.z,f.w,.55,f.d,t.edge,.1);
   if(!f.openEdges)for(const s of[-1,1]){
    box(g,f.x+s*(f.w/2-.16),.38,f.z,.32,.76,f.d,t.edge,.1);
    const rail=cyl(g,f.x+s*(f.w/2-.16),.85,f.z,.105,f.d,t.rail);rail.rotation.x=Math.PI/2;
    for(let z=f.z-f.d/2+.8;z<f.z+f.d/2;z+=4.3)cyl(g,f.x+s*(f.w/2-.16),.59,z,.16,1.2,t.rail);
   }else{
    for(const s of[-1,1])box(g,f.x+s*(f.w/2-.14),.035,f.z,.2,.07,f.d-.15,t.rail,.02);
    for(const z of[-f.d/2+.16,f.d/2-.16])box(g,f.x,.035,f.z+z,f.w-.2,.07,.22,t.rail,.02);
    cyl(g,f.x,-2.2,f.z,Math.min(f.w,f.d)*.32,3.1,t.edge,.8);
   }
  }
  // Chunky pink-and-white cylinders, yellow discs and a clear blue safety floor.
  for(const o of COURSE.spinners){
   const group=grp(g,o.x,0,o.z);cyl(group,0,.045,0,o.r+.25,.09,t.accent);cyl(group,0,.1,0,o.r,.08,palette.yellow);
   for(let i=0;i<6;i++){const a=i/6*Math.PI*2,line=box(group,Math.sin(a)*o.r*.6,.15,Math.cos(a)*o.r*.6,.16,.025,o.r*.62,'#ffe66b',.01);line.rotation.y=a;}
   cyl(group,0,.43,0,.47,.68,t.accent);cyl(group,0,.81,0,.48,.09,'#fff3ff');
   const arm=grp(group,0,.57,0);const rail=cyl(arm,0,0,0,.235,o.r*2,t.accent);rail.rotation.z=Math.PI/2;
   for(let x=-o.r+.25;x<o.r;x+=.55){const stripe=cyl(arm,x,0,0,.239,.24,'#fff1fc');stripe.rotation.z=Math.PI/2;}
   ball(arm,-o.r,0,0,.235,t.accent);ball(arm,o.r,0,0,.235,t.accent);this.spinners.set(o.id,arm);
  }
  for(const o of COURSE.pushers){
   const pg=grp(g,pusherX(o,0),0,o.z);box(pg,0,.8,0,o.w,o.h,o.d,t.accent,.18);box(pg,0,1.59,0,o.w-.16,.1,o.d-.16,'#ff89bb',.05);
   for(let x=-o.w/2+.4;x<o.w/2;x+=.65){const stripe=box(pg,x,.8,.815,.22,1.25,.03,'#ffd6e7',.01);stripe.rotation.z=-.3;}
   box(g,o.side*7.6,.4,o.z,.4,.8,2.5,'#ed8bca',.08);this.pushers.set(o.id,pg);
  }
  for(const o of COURSE.bumpers){cyl(g,o.x,.65,o.z,o.r,1.3,t.accent);cyl(g,o.x,1.3,o.z,o.r,.12,palette.yellow);for(const y of[.25,.65,1.05])torus(g,o.x,y,o.z,o.r,.035,'#ffb0db').rotation.x=Math.PI/2;}
  for(const o of COURSE.hammers){
   for(const side of[-1,1]){cyl(g,side*7.6,2.6,o.z,.18,5.2,'#ffd236');cyl(g,side*7.6,.5,o.z,.28,1,'#296ad7');}
   box(g,0,5.05,o.z,15.5,.3,.4,'#edf9ff',.12);
   const arm=grp(g,o.x,5,o.z);cyl(arm,0,-o.length/2,0,.09,o.length,'#e7f3ff');ball(arm,0,-o.length,0,.87,t.accent);torus(arm,0,-o.length,0,.88,.07,'#ffe27e').rotation.x=Math.PI/2;this.hammers.set(o.id,arm);
  }
  for(const b of COURSE.belts){
   const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=b.color;ctx.fillRect(0,0,128,128);ctx.strokeStyle='#f5ffff';ctx.lineWidth=12;ctx.lineJoin='round';ctx.beginPath();if(b.vx){ctx.translate(64,64);ctx.rotate(b.vx>0?-Math.PI/2:Math.PI/2);ctx.translate(-64,-64);}const dir=b.vx?1:b.vz<0?-1:1;ctx.moveTo(25,64-dir*18);ctx.lineTo(64,64+dir*18);ctx.lineTo(103,64-dir*18);ctx.stroke();
   const texture=new T.CanvasTexture(c);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;texture.repeat.set(b.vx?b.w/3:1,b.vx?b.d/4:b.d/2.5);const surface=add(g,new T.PlaneGeometry(b.w,b.d),b.color,b.x,.045,b.z);surface.rotation.x=-Math.PI/2;surface.material=new T.MeshStandardMaterial({map:texture,roughness:.9});this.beltTextures.push({texture,belt:b});
  }
  for(const coin of COURSE.coins){const cg=grp(g,coin.x,.85,coin.z),disc=cyl(cg,0,0,0,.24,.07,'#ffd32b');disc.rotation.x=Math.PI/2;torus(cg,0,0,0,.23,.035,'#fff0a1');this.pickups.set(coin.id,cg);}
  if(COURSE.id==='cloud-serpentine')this.label(g,'S 弯挑战 · 提前走线',0,3,-9,5.8,'#fff6bd');
  if(COURSE.theme==='cloud'&&COURSE.id!=='cloud-serpentine'){this.label(g,'左右加速 · 中间逆行',0,2.8,-136,5.7);this.label(g,'捷径 ↖',-5.2,2.4,-197,2.7,'#fff07a');this.label(g,'稳健路线',2.4,2.4,-197,3);}
  if(COURSE.theme==='ice')this.label(g,'自动弹跳 ↑',0,2.4,-108,5,'#d7ffff');
  if(COURSE.theme==='neon')this.label(g,'交叉传送带',0,3.1,-67,5,'#c8ffff');
  if(COURSE.theme==='lava'){this.label(g,'地圈亮起 · 小心喷发',0,3,-26,5.7,'#ffdc98');this.label(g,'捷径 ↖',-5.2,2.4,-187,2.7,'#fff07a');}
  for(const pad of COURSE.springs){const spring=grp(g,pad.x,0,pad.z);box(spring,0,.045,0,pad.w,.09,pad.d,'#426ed6',.06);for(let x=-pad.w/2+.5;x<pad.w/2;x+=1.2){const ring=torus(spring,x,.12,0,.35,.055,'#d5ffff');ring.rotation.x=Math.PI/2;add(spring,new T.ConeGeometry(.19,.4,4),'#8df7ec',x,.31,0);}this.springs.push(spring);}
  for(const j of COURSE.jets){const root=grp(g,j.x,0,j.z);cyl(root,0,.02,0,j.r,.08,'#544755');const ring=torus(root,0,.08,0,j.r,.07,'#ffc35f');ring.rotation.x=Math.PI/2;const flame=grp(root);for(let i=0;i<3;i++){const cone=add(flame,new T.ConeGeometry(j.r*(.75-i*.18),3.2-i*.45,9),i===2?'#fff0a0':i?'#ffba4e':'#ed653d',0,1.5-i*.1,0,{glow:.45});cone.rotation.y=i;}this.jets.set(j.id,{root,ring,flame});}
  for(const z of[-6,...COURSE.checkpoints.slice(1).map(c=>c.z+1)]){
   const f=COURSE.floors.find(f=>Math.abs(z-f.z)<f.d/2+.06),cx=courseCenter(z),half=(f?.w??16)/2-1;for(let x=-half;x<=half;x+=1.3){const chevron=box(g,cx+x,.035,z,.14,.025,.5,'#f7faff',.01);chevron.rotation.y=.5;}
  }
  this.startArch=this.makeArch(g,0,-4,'START',false);this.makeArch(g,0,COURSE.finish-1,'FINISH',true);
  this.flag(g,-7.5,-7,'GO!','#ffcd24');this.flag(g,7.5,-7,'GO!','#ffcd24');
  for(const z of COURSE.checkpoints.slice(1).map(c=>c.z+1))for(const s of[-1,1])this.flag(g,courseCenter(z)+s*(COURSE.id==='cloud-serpentine'?6.5:7.5),z,'CHECK','#3a76ec');
  for(const z of Array.from({length:15},(_,i)=>-16-i*24))for(const s of[-1,1])this.flag(g,(COURSE.id==='cloud-serpentine'?courseCenter(z):0)+s*9,z,'PARTY\nDASH',s<0?'#4284ed':'#ff559b');
  this.environment=buildEnvironment(g,COURSE.theme,COURSE,{box,ball,cyl,torus,grp,add});
  const stripeCanvas=document.createElement('canvas');stripeCanvas.width=256;stripeCanvas.height=32;const c=stripeCanvas.getContext('2d');for(let y=0;y<2;y++)for(let x=0;x<16;x++){c.fillStyle=(x+y)%2?'#2d3563':'#ffffff';c.fillRect(x*16,y*16,16,16);}const finishTex=new T.CanvasTexture(stripeCanvas);finishTex.colorSpace=T.SRGBColorSpace;
  const line=add(g,new T.PlaneGeometry(15,.9),'#ffffff',0,.04,COURSE.finish);line.rotation.x=-Math.PI/2;line.material=new T.MeshBasicMaterial({map:finishTex});
 }
 setCourse(){
  const geo=new Set(),mats=new Set(),textures=new Set(),cachedGeo=new Set(geometries.values()),cachedMat=new Set(materials.values());
  this.world.traverse(o=>{if(o.geometry&&!cachedGeo.has(o.geometry))geo.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){if(!cachedMat.has(m))mats.add(m);if(m.map)textures.add(m.map);}});
  if(this.floorMaterial){textures.add(this.floorMaterial.map);mats.add(this.floorMaterial);}for(const q of textures)q?.dispose();for(const q of geo)q.dispose();for(const q of mats)q.dispose();this.world.removeFromParent();this.world=grp(this.scene);
  for(const m of[this.spinners,this.pushers,this.hammers,this.pickups,this.jets])m.clear();this.beltTextures=[];this.flags=[];this.springs=[];for(const q of this.particles)q.m.removeFromParent();this.particles=[];this.buildCourse();this.update(0,0,true);
 }
 makeArch(g,x,z,text,finish){
  const a=grp(g,x,0,z),color=finish?'#ffd52a':'#ffcc29';
  for(const s of[-1,1]){cyl(a,s*6,1.85,0,.32,3.7,'#ffffff');cyl(a,s*6,1.1,0,.38,2.2,color);ball(a,s*6,3.9,0,.33,color);}
  box(a,0,3.7,0,12.7,.85,.65,finish?'#f6528d':'#2b6cd2',.22);this.label(a,text,0,3.72,.36,finish?5.2:4.7, '#ffffff',true);return a;
 }
 flag(g,x,z,text,color){
  cyl(g,x,1.9,z,.055,3.8,'#e9f8ff');ball(g,x,3.85,z,.12,'#ffd039');const pg=grp(g,x,0,z);box(pg,.66,2.93,0,1.25,1.55,.025,color,.03);this.label(pg,text,.66,3,.035,1.1,'#ffffff',true);this.flags.push(pg);
 }
 label(g,text,x,y,z,width,color='#ffffff',flat=false){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.font='1000 104px "Arial Black","Microsoft YaHei",sans-serif';const lines=text.split('\n');for(let i=0;i<lines.length;i++){const yy=128+(i-(lines.length-1)/2)*106;c.strokeStyle='#17386d';c.lineWidth=13;c.strokeText(lines[i],256,yy);c.fillStyle=color;c.fillText(lines[i],256,yy);}const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  const sprite=flat?new T.Mesh(new T.PlaneGeometry(width,width/2),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false})):new T.Sprite(new T.SpriteMaterial({map:tex,depthWrite:false}));sprite.position.set(x,y,z);if(!flat)sprite.scale.set(width,width/2,1);g.add(sprite);return sprite;
 }
 setSkin(id,skin){const old=this.avatars.get(id),look=old?.look??DEFAULT_LOOK;old?.ornaments?.dispose();old?.root.removeFromParent();old?.shadow.removeFromParent();this.avatars.set(id,createAvatar(this.scene,skin));this.setLook(id,look);}
 setLook(id,look){const avatar=this.avatars.get(id);if(!avatar)return;if(JSON.stringify(avatar.look)===JSON.stringify(look))return;avatar.ornaments?.dispose();avatar.look={...look};avatar.ornaments=adornAvatar(avatar,look,this.scene);}
 resetCoins(){for(const g of this.pickups.values())g.visible=true;}
 collectCoin(id){const g=this.pickups.get(id);if(g)g.visible=false;}
 burst(x,y,z,count=20){for(let i=0;i<count;i++){const a=i/count*Math.PI*2,m=box(this.fx,x,y,z,.07,.12,.025,[palette.yellow,palette.pink,'#ffffff','#74f6ff'][i%4],.01);m.castShadow=false;this.particles.push({m,vx:Math.cos(a)*(1+Math.random()*3),vz:Math.sin(a)*(1+Math.random()*3),vy:3+Math.random()*4,life:.8+Math.random()*.7});}}
 update(time,dt,snap=false,visualTime=time){
  const view=this.view,present=view==='wardrobe'||view==='result',p=present?{...this.runners[0],x:45,y:.53,z:5}:this.runners[0];this.podium.visible=present;this.world.visible=!present;this.scene.background.set(present?'#101930':(this.theme?.sky??'#54d8fb'));snap=snap||this.lastView!==view;this.lastView=view;
  const ratio=Math.min(devicePixelRatio||1,view==='race'?1.6:2);if(ratio!==this.renderRatio){this.renderer.setPixelRatio(ratio);this.renderRatio=ratio;}this.sun.intensity=present?1.55:2.2;for(const {light,offset}of this.studioLights){light.visible=present;light.position.set(p.x+offset[0],p.y+offset[1],p.z+offset[2]);light.target.position.set(p.x,p.y+1.1,p.z);}
  for(const o of COURSE.spinners)this.spinners.get(o.id).rotation.y=-spinnerAngle(o,time);
  for(const o of COURSE.pushers)this.pushers.get(o.id).position.x=pusherX(o,time);
  for(const o of COURSE.hammers)this.hammers.get(o.id).rotation.z=hammerPose(o,time).angle;
  for(const {texture,belt}of this.beltTextures){texture.offset.y=visualTime*(belt.vz??0)*.22;texture.offset.x=-visualTime*(belt.vx??0)*.22;}
  this.environment?.update(visualTime);for(const j of COURSE.jets){const q=this.jets.get(j.id),state=jetState(j,time);q.flame.visible=state.active;q.flame.scale.y=1+Math.sin(visualTime*17+j.phase)*.08;q.ring.material=material(state.active?'#ff8a36':state.warning?'#ffd064':'#736773',{glow:state.warning?.5:0});q.ring.scale.setScalar(state.warning?1+Math.sin(visualTime*13)*.08:1);}for(const spring of this.springs)spring.children.forEach((m,i)=>{if(i>0)m.position.y=(i%2?.12:.31)+Math.sin(visualTime*4)*.04;});
  for(const [id,g]of this.pickups){if(g.visible){g.rotation.y=visualTime*2;g.position.y=.85+Math.sin(visualTime*3+g.position.z)*.12;}}
  this.startArch.visible=view==='race';
  for(const r of this.runners){const avatar=this.avatars.get(r.id),poseRunner=present&&r.id===0?{...p,showcaseFolded:this.previewFolded}:view==='lobby'&&r.id?{...r,x:(r.id%6-2.5)*2.1,z:p.z-7-Math.floor(r.id/6)*2.6}:r;avatar.animate(poseRunner,visualTime,dt,{pose:view!=='race',win:view==='result'&&this.celebrate&&r.id===0,inspection:view==='wardrobe'&&r.id===0?(this.inspectAngle??0):null});avatar.root.visible=avatar.root.visible&&(view==='race'||view==='lobby'||r.id===0);avatar.shadow.visible=avatar.shadow.visible&&avatar.root.visible;if(present&&r.id===0)avatar.shadow.position.y=.54;if(avatar.ornaments){avatar.ornaments.update(poseRunner,visualTime,dt,view!=='race');avatar.ornaments.trail.visible=avatar.root.visible&&Math.abs(poseRunner.z-p.z)<35;} }
  this.arrow.visible=view==='race';this.arrow.position.set(p.x,p.y+(this.avatars.get(0).look?.head!=='head_none'?3.4:2.65),p.z);this.arrow.rotation.y=visualTime*2;
  for(let i=this.particles.length-1;i>=0;i--){const q=this.particles[i];q.life-=dt;q.vy-=8*dt;q.m.position.x+=q.vx*dt;q.m.position.y+=q.vy*dt;q.m.position.z+=q.vz*dt;q.m.rotation.x+=dt*4;if(q.life<=0){q.m.removeFromParent();this.particles.splice(i,1);}}
  const portrait=this.camera.aspect<.85;
  if(view==='race'){
   this.cameraPosition.set(p.x*(COURSE.id==='cloud-serpentine'?.9:.62),p.y*.55+(portrait?9.5:7.4),p.z+(portrait?15.5:11.6));this.cameraTarget.set(COURSE.id==='cloud-serpentine'?p.x*.45+courseCenter(p.z-9)*.55:p.x*.75,p.y*.25+.25,p.z-(portrait?4.2:4));
  }else{
   const wardrobe=view==='wardrobe',result=view==='result';
   this.cameraPosition.set(p.x+(portrait||result?0:2.1),p.y+(portrait?wardrobe?3.1:2.6:3.1),p.z+(portrait?wardrobe?9.3:5.9:6.4));
   this.cameraTarget.set(p.x+(portrait||result?0:-1.5),p.y+(portrait?wardrobe?.35:1.05:.7),p.z);
   if(view==='lobby'&&portrait&&(this.avatars.get(0).look.head!=='head_none'||this.avatars.get(0).look.back!=='back_none')){this.cameraPosition.set(p.x,p.y+3,p.z+7.2);this.cameraTarget.set(p.x,p.y+1.2,p.z);}
   if(wardrobe&&this.camera.aspect>1.6&&this.height<600){this.cameraPosition.set(p.x-4.1,p.y+3,p.z+7.2);this.cameraTarget.set(p.x-4.1,p.y+1.8,p.z);}
  }
  if(snap)this.camera.position.copy(this.cameraPosition);else this.camera.position.lerp(this.cameraPosition,1-Math.exp(-dt*7));this.camera.lookAt(this.cameraTarget);
  this.sun.position.set(p.x-10,p.y+19,p.z+8);this.sun.target.position.set(p.x,0,p.z-5);
  this.renderer.render(this.scene,this.camera);
 }
 accessoryThumbnails(items){
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(512,320);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
  const scene=thumbnailStudio(),camera=new T.PerspectiveCamera(34,512/320,.1,30),images={},dyes={bow:'#ff77bd',bat:'#ae65ff',butterfly:'#d875f5',galaxy:'#ac6cff',rocket:'#65e3ff',antlers:'#68e6ff',halo:'#ffe36b',crown:'#ff77ce',royal:'#a780ff',phoenix:'#ffc34f',solar:'#ffda5c',cape:'#9874ff',spark:'#ffdd4b',hearts:'#ff65ac',stars:'#ab83ff',bubbles:'#80e5ff'};
  for(const item of items){
   const avatar=createAvatar(scene,'duck'),look={...DEFAULT_LOOK,[item.slot]:item.id,color:dyes[item.id]??'#ae7dff'},accessory=adornAvatar(avatar,look,scene),p={id:0,x:0,y:0,z:0,vx:0,vz:0,grounded:true,waiting:0,trailSwatch:true};
   avatar.animate(p,0,0,{pose:true});accessory.update(p,1,0,true);avatar.shadow.visible=false;
   if(item.slot==='head'){for(const part of avatar.body.children)part.visible=part===avatar.head;frameThumbnail(camera,visibleBounds(avatar.head),new T.Vector3(.13,.12,1),1.15);}
   else if(item.slot==='back'){const bounds=item.id==='back_none'?visibleBounds(avatar.root):visibleBounds(accessory.back);frameThumbnail(camera,bounds,new T.Vector3(.12,.12,-1),1.18);}
   else{avatar.root.visible=false;const bounds=visibleBounds(accessory.trail);if(bounds.isEmpty()){camera.position.set(0,2.5,3.5);camera.lookAt(0,.2,0);}else frameThumbnail(camera,bounds,new T.Vector3(.08,1.3,1),1.2);}
   renderer.render(scene,camera);images[item.id]=renderer.domElement.toDataURL('image/png');accessory.dispose();avatar.root.removeFromParent();avatar.shadow.removeFromParent();
  }
  renderer.dispose();renderer.forceContextLoss();return images;
 }
 thumbnails(){
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(512,320);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
  const scene=thumbnailStudio(),camera=new T.PerspectiveCamera(34,512/320,.1,30),images={};
  for(const skin of SKINS){const avatar=createAvatar(scene,skin.id);avatar.animate({id:0,x:0,y:0,z:0,vx:0,vz:0,grounded:true,waiting:0},0,0,{pose:true});avatar.shadow.visible=false;frameThumbnail(camera,visibleBounds(avatar.root),new T.Vector3(.1,.08,1),1.06);renderer.render(scene,camera);images[skin.id]=renderer.domElement.toDataURL('image/png');avatar.root.removeFromParent();avatar.shadow.removeFromParent();}
  renderer.dispose();renderer.forceContextLoss();return images;
 }
}
