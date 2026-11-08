import * as T from '../vendor/three.module.js';
import {THINGS,LOOKS,clamp,rng} from './rules.mjs';
import {createMascot,poseMascot,portalTexture,mascotThumbnails} from './mascot.mjs';
import {bevelBox,studioEnvironment,roadTexture,buildArchitecture} from './architecture.mjs';
const colors=['#ff738e','#52cad2','#ffcf56','#a68ae9','#75b9ed','#ff9f6b'];
const mergeParts=parts=>{
 const positions=[],normals=[],vertexColors=[];
 for(const part of parts){let g=part.geo.index?part.geo.toNonIndexed():part.geo.clone();const m=new T.Matrix4().compose(new T.Vector3(...part.pos),new T.Quaternion().setFromEuler(new T.Euler(...(part.rot||[0,0,0]))),new T.Vector3(...(part.scale||[1,1,1])));g.applyMatrix4(m);const p=g.attributes.position,n=g.attributes.normal,c=new T.Color(part.color);for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));vertexColors.push(c.r,c.g,c.b);}g.dispose();}
 const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(positions,3));out.setAttribute('normal',new T.Float32BufferAttribute(normals,3));out.setAttribute('color',new T.Float32BufferAttribute(vertexColors,3));out.computeBoundingSphere();return out;
};
const geoCache=new Map();
export function propGeometry(type,variant=0){
 const key=type+variant;if(geoCache.has(key))return geoCache.get(key);const p=[],c=colors[variant%colors.length],white='#f5f5e9',dark='#263e54';
 const box=(x,y,z,w,h,d,color,rot)=>p.push({geo:Math.min(w,h,d)>.14?bevelBox(w,h,d,Math.min(w,h,d)*.1):new T.BoxGeometry(w,h,d),pos:[x,y,z],color,rot});
 const cyl=(x,y,z,r,h,color,rot,r2=r)=>p.push({geo:new T.CylinderGeometry(r,r2,h,12),pos:[x,y,z],color,rot});
 const ball=(x,y,z,r,color,scale)=>p.push({geo:new T.SphereGeometry(r,12,8),pos:[x,y,z],color,scale});
 const wheel=(x,z)=>{cyl(x,.32,z,.29,.15,'#263442',[0,0,Math.PI/2]);cyl(x*1.01,.32,z,.13,.16,'#dce7eb',[0,0,Math.PI/2]);};
 if(type==='cone'){box(0,.045,0,.58,.09,.58,'#5c6e80');cyl(0,.42,0,.04,.7,'#ff963e',undefined,.23);cyl(0,.41,0,.12,.14,white,undefined,.16);}
 if(type==='can'){cyl(0,.29,0,.19,.58,c);cyl(0,.59,0,.17,.025,'#d5e1e4');box(0,.3,.185,.21,.19,.025,white);}
 if(type==='core'){p.push({geo:new T.OctahedronGeometry(.43),pos:[0,.8,0],color:'#66ecff',scale:[.82,1.45,.82]});cyl(0,.13,0,.48,.2,'#255e86');cyl(0,.27,0,.32,.07,'#b6ffff');for(const sign of[-1,1])box(sign*.47,.5,0,.07,.65,.13,'#adfaff',[0,0,-sign*.25]);}
 if(type==='crate'){box(0,.38,0,.7,.76,.7,'#d49a62');box(0,.77,0,.15,.02,.7,'#f4d1a1');box(0,.38,.356,.15,.76,.012,'#f4d1a1');box(.16,.4,.363,.17,.13,.01,white);}
 if(type==='bin'){box(0,.42,0,.62,.81,.65,c);box(0,.88,0,.71,.13,.74,dark);box(0,.45,.332,.24,.29,.01,white);for(const x of[-.23,.23])cyl(x,.1,.24,.085,.07,dark,[0,0,Math.PI/2]);}
 if(type==='hydrant'){cyl(0,.1,0,.3,.2,'#f26171');cyl(0,.44,0,.17,.6,'#f5727c');ball(0,.78,0,.2,'#ffc354',[1,.6,1]);cyl(0,.5,0,.12,.62,'#fff3bb',[0,0,Math.PI/2]);}
 if(type==='bench'){for(const x of[-.65,.65]){box(x,.3,0,.09,.6,.58,dark);box(x,.7,.29,.09,.92,.08,dark);}for(let n=0;n<3;n++)box(0,.61,-.2+n*.2,1.7,.1,.15,'#e9b174');for(let n=0;n<2;n++)box(0,.92+n*.2,.32,1.7,.14,.09,'#e9b174');}
 if(type==='tree'){cyl(0,.7,0,.12,1.4,'#a77357');ball(0,1.74,0,.72,variant%2?'#56bd89':'#74ce9b',[.93,1.16,.93]);ball(.38,1.52,.07,.4,'#87d7a5');box(0,.04,0,.68,.08,.68,'#e5c7a2');}
 if(type==='car'||type==='truck'){
  const truck=type==='truck',l=truck?3.7:2.65,w=truck?1.8:1.45;
  box(0,.54,0,w,.5,l,c);box(0,truck?1.38:1.02,truck?.15:.13,w*.92,truck?1.25:.66,truck?l*.77:l*.51,c);
  box(0,truck?1.62:1.12,-l*(truck?.35:.2),w*.83,truck?.55:.42,.035,'#a8e8ef');
  for(const sign of[-1,1]){box(sign*w*.468,truck?1.63:1.13,.12,.03,truck?.52:.37,l*(truck?.62:.39),'#b3e8ec');wheel(sign*(w/2+.035),-l*.3);wheel(sign*(w/2+.035),l*.3);box(sign*w*.3,.58,-l/2-.02,.23,.15,.04,'#fff3b9');box(sign*w*.3,.59,l/2+.02,.18,.12,.04,'#ff576d');}
  box(0,.32,-l/2,.95,.1,.08,white);box(0,truck?2.06:1.37,.1,w*.96,.09,l*(truck?.8:.53),truck?white:c);for(const sign of[-1,1])box(sign*w*.51,truck?1.48:1.09,-l*.17,.2,.12,.2,c);
 }
 if(type==='kiosk'||type==='house'||type==='tower'){
  const kiosk=type==='kiosk',tower=type==='tower',w=kiosk?2.1:tower?3.5:3.15,h=kiosk?1.9:tower?5.8:3.5,d=kiosk?1.8:tower?3.2:2.9;
  box(0,h/2,0,w,h,d,c);box(0,h+.12,0,w+.22,.24,d+.22,white);box(0,.06,0,w+.16,.12,d+.16,'#a5aaa9');box(0,h+.26,0,w-.28,.1,d-.28,'#4d6876');box(w*.22,h+.53,0,w*.32,.49,d*.32,'#bac8ca');
  for(let y=.75;y<h-.15;y+=1.1)for(let x=-w*.3;x<w*.4;x+=w*.3){for(const sign of[-1,1]){box(x,y,sign*(d/2+.025),w*.24,.72,.08,'#3b5f6c');box(x,y,sign*(d/2+.08),w*.18,.55,.04,'#85bdcc');box(sign*(w/2+.025),y,x,.08,.72,w*.24,'#3b5f6c');box(sign*(w/2+.08),y,x,.04,.55,w*.18,'#85bdcc');box(x,y-.4,sign*(d/2+.13),w*.3,.09,.29,white);}}
  box(0,.65,-d/2-.05,.55,1.22,.06,dark);box(0,1.45,-d/2-.36,w+.1,.16,.67,white,[-.13,0,0]);
  for(let x=-w/2;x<w/2;x+=.48)box(x+.15,1.46,-d/2-.36,.24,.17,.68,kiosk?'#ff819f':'#ffd46c',[-.13,0,0]);
  if(kiosk){cyl(0,2.42,0,.02,.48,'#dca667',undefined,.2);ball(0,2.76,0,.38,'#ffdce6');ball(.15,2.93,0,.23,'#fff6d7');}
 }
 const geometry=mergeParts(p);geoCache.set(key,geometry);return geometry;
}
function label(text,color='#ffffff',width=420){const c=document.createElement('canvas');c.width=width;c.height=104;const ctx=c.getContext('2d');ctx.font='900 45px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=9;ctx.strokeStyle='#24435d';ctx.strokeText(text,width/2,52);ctx.fillStyle=color;ctx.fillText(text,width/2,52);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(6.5,1.6,1);return sprite;}
export class CityScene{
 constructor(canvas){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.max(1,Math.min(devicePixelRatio,1.7)));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.97;
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(48,1,.1,260);this.hemi=new T.HemisphereLight('#b8dcff','#5e5d75',.9);this.scene.add(this.hemi);this.environment=studioEnvironment(this.renderer);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.38;
  this.sun=new T.DirectionalLight('#fff0d5',3.6);this.sun.position.set(-20,38,25);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-34;this.sun.shadow.camera.right=34;this.sun.shadow.camera.top=54;this.sun.shadow.camera.bottom=-34;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=120;this.sun.shadow.normalBias=.035;this.sun.shadow.bias=-.0002;this.sun.shadow.radius=2;this.scene.add(this.sun,this.sun.target);
  const rim=new T.DirectionalLight('#b4d9ff',.65);rim.position.set(20,14,-30);this.scene.add(rim);
  this.propsMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.43,metalness:.08,envMapIntensity:.5});this.cutUniform={value:Array.from({length:4},()=>new T.Vector4(0,0,0,0))};this.holes=[];this.temp=new T.Object3D();this.clock=0;
  this.particleData=Array.from({length:90},()=>({life:0}));this.particleGeo=new T.BufferGeometry();this.particlePos=new Float32Array(90*3);this.particleColors=new Float32Array(90*3);this.particleGeo.setAttribute('position',new T.BufferAttribute(this.particlePos,3));this.particleGeo.setAttribute('color',new T.BufferAttribute(this.particleColors,3));this.particles=new T.Points(this.particleGeo,new T.PointsMaterial({size:.18,vertexColors:true,transparent:true,opacity:.85,depthWrite:false}));this.scene.add(this.particles);
 }
 material(color,cut=false){const mat=new T.MeshStandardMaterial({color,roughness:.95});if(cut){mat.onBeforeCompile=shader=>{shader.uniforms.uHoles=this.cutUniform;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHoleWorld;').replace('#include <begin_vertex>','#include <begin_vertex>\nvHoleWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vHoleWorld; uniform vec4 uHoles[4];').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfor(int i=0;i<4;i++){if(uHoles[i].w>0.5 && distance(vHoleWorld.xz,uHoles[i].xy)<uHoles[i].z) discard;}');};mat.customProgramCacheKey=()=> 'black-hole-floor-v1';}return mat;}
 mesh(geo,mat,x=0,y=0,z=0,parent=this.root){const m=new T.Mesh(geo,typeof mat==='string'?this.material(mat):mat);m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
 box(x,y,z,w,h,d,mat,parent){return this.mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,parent);}
 plane(x,y,z,w,d,mat){const geo=new T.PlaneGeometry(w,d);if(mat.map){const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/4,uv.getY(i)*d/4);}const m=this.mesh(geo,mat,x,y,z);m.rotation.x=-Math.PI/2;return m;}
 build(world){
  if(this.root){this.scene.remove(this.root);this.root.traverse(o=>{if(o.geometry&&!o.userData.shared)o.geometry.dispose();if(o.material&&o.material!==this.propsMaterial){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m.map?.dispose();m.dispose();}}});}
  this.root=new T.Group();this.scene.add(this.root);this.world=world;this.itemMeshes=new Map();this.holes=[];const c=world.course;this.scene.background=new T.Color(c.sky);this.scene.fog=new T.Fog(c.sky,92,205);this.sun.color.set(c.id==='sunset'?'#ffd1a0':'#fff0d5');this.hemi.intensity=c.id==='sunset'?.8:.9;
  const road=this.material(c.road,true),side=this.material(c.side,true),white=this.material('#e8e9e5',true),dark=this.material('#48596b',true),yellow=this.material('#ffcf49',true);road.map=roadTexture();road.roughness=.82;side.map=roadTexture('paving');side.roughness=.7;
  const length=c.length+85;let last=-25;
  for(const g of[...world.gaps,{s:length,end:length}]){
   const len=g.s-last,mid=(last+g.s)/2;
   this.plane(0,-.012,-mid,22,len,road);for(const sign of[-1,1]){this.plane(sign*12,.035,-mid,2,len,side);this.box(sign*13.1,-1.8,-mid,.23,3.6,len,'#c4c7bd');this.box(sign*11.05,.055,-mid,.14,.11,len,'#d4d1b9');this.plane(sign*10.7,.005,-mid,.075,len,yellow);}
   last=g.end;
  }
  for(let s=-20;s<c.length+30;s+=5)if(!world.gaps.some(g=>s>g.s-1&&s<g.end+1)){for(const x of[-3.3,3.3])this.plane(x,.008,-s,.12,2.1,white);}
  for(const g of world.gaps){for(let x=-10.5;x<11;x+=1){this.plane(x,.014,-g.s+.55,.95,.9,Math.round(x)%2?yellow:dark);this.plane(x,.014,-g.end-.55,.95,.9,Math.round(x)%2?dark:yellow);}const sign=label('断桥 · 跃迁 ↑','#fff1b3');sign.position.set(0,3.8,-g.s+4.5);this.root.add(sign);}
  this.plane(0,-6.5,-length/2,250,length+150,this.material(c.ground));
  buildArchitecture(this.root,c);
  for(const cache of world.caches){
   const fill=this.material('#37cbed',true);fill.transparent=true;fill.opacity=.2;fill.depthWrite=false;fill.emissive.set('#278bb8');fill.emissiveIntensity=.2;const mid=(cache.s+cache.end)/2;
   this.plane(cache.x,.016,-mid,3.7,cache.end-cache.s,fill);for(const sign of[-1,1])this.plane(cache.x+sign*1.9,.022,-mid,.07,cache.end-cache.s,this.material('#63e5f0',true));
   const sign=label('晶核补给 · 冷却缩短','#9bfbff',660);sign.position.set(cache.x,2,-cache.s);sign.scale.set(5.2,.82,1);this.root.add(sign);
  }
  for(const item of world.items){const m=new T.Mesh(propGeometry(item.type,item.color),this.propsMaterial);m.userData.shared=true;m.position.set(item.x,.025,-item.s);m.rotation.y=(item.type==='car'||item.type==='truck')?(item.id%2?.11:-.09):item.id*.7;m.castShadow=true;m.receiveShadow=true;this.root.add(m);this.itemMeshes.set(item.id,m);}
  this.hazardMeshes=new Map();for(const h of world.hazards){const moving=h.kind==='sweeper',g=new T.Group();g.position.set(h.x,0,-h.s);this.root.add(g);this.box(0,.1,0,moving?3.6:2.6,.2,moving?1:2.3,'#283e53',g);const board=this.box(0,.7,0,moving?3.2:1.6,1.25,moving?.5:1.45,'#eb5361',g);board.castShadow=true;const band=this.box(0,.73,moving?.3:0,moving?3.25:1.7,.18,moving?.08:1.5,'#ffe8ab',g);band.rotation.z=moving?0:.6;const mark=label(moving?'↔':'!','#fff9bd',160);mark.position.set(0,2,0);mark.scale.set(1.6,1.2,1);g.add(mark);if(moving){this.plane(0,.018,-h.s,17,.16,this.material('#5a727b',true));for(const x of[-8.5,8.5])this.box(x,.16,-h.s,.3,.32,.6,'#f6cc79');}this.hazardMeshes.set(h.id,g);}
  for(const p of world.players)this.holes.push(this.makeHole(p));
  const finish=c.length;
  for(const sign of[-1,1]){this.box(sign*11,4.2,-finish,.8,8.4,.8,'#ffca45');this.box(sign*11,1.3,-finish,1.25,2.6,1.25,'#fff4d1');}
  this.box(0,8.5,-finish,22.8,1.5,.8,'#404b72');const banner=label('吞 噬 终 点','#fff6cc',700);banner.position.set(0,8.5,-finish+.5);banner.scale.set(17,2.5,1);this.root.add(banner);
  for(let x=-10.5;x<11;x+=1)for(let z=0;z<3;z++)this.plane(x,.02,-finish+z,.99,.99,(Math.round(x+.5)+z)%2?white:dark);
  this.demo=new T.Group();this.root.add(this.demo);for(let i=0;i<7;i++){const type=['car','bench','bin','tree','crate','cone','can'][i],m=new T.Mesh(propGeometry(type,i%6),this.propsMaterial);m.userData.shared=true;m.castShadow=true;m.position.set(Math.cos(i*1.8)*5.1,.02,Math.sin(i*1.8)*4.8);m.rotation.y=i*.7;this.demo.add(m);}
  this.particleData.forEach(p=>p.life=0);
 }
 makeHole(p){
  const g=new T.Group();this.root.add(g);const color=p.color;
  const wall=new T.Mesh(new T.CylinderGeometry(1,1,2.2,56,1,true),new T.MeshBasicMaterial({color:'#132449',side:T.DoubleSide}));wall.position.y=-1.1;g.add(wall);
  const texture=portalTexture();
  const bottom=new T.Mesh(new T.CircleGeometry(1,64),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));bottom.rotation.x=-Math.PI/2;bottom.position.y=-2.15;g.add(bottom);
  const aerial=new T.Mesh(new T.CircleGeometry(.995,64),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));aerial.rotation.x=-Math.PI/2;aerial.position.y=.01;g.add(aerial);
  const ring=new T.Mesh(new T.TorusGeometry(1,.09,12,64),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.4,roughness:.2,metalness:.3}));ring.rotation.x=-Math.PI/2;ring.position.y=.065;g.add(ring);
  const tunnel=[];for(let n=0;n<3;n++){const rim=new T.Mesh(new T.TorusGeometry(.92-n*.19,.024,6,64),new T.MeshBasicMaterial({color:n%2?'#a68de8':color,transparent:true,opacity:.32}));rim.rotation.x=-Math.PI/2;rim.position.y=-.12-n*.9;g.add(rim);tunnel.push(rim);}
  const outer=new T.Mesh(new T.TorusGeometry(1.075,.018,8,64),new T.MeshBasicMaterial({color,transparent:true,opacity:.45}));outer.rotation.x=-Math.PI/2;outer.position.y=.02;g.add(outer);
  const orbit=new T.Mesh(new T.TorusGeometry(1.22,.018,8,64),new T.MeshBasicMaterial({color:'#b7f5ff',transparent:true,opacity:.8}));orbit.rotation.set(-1.15,.3,.4);orbit.position.y=.26;orbit.visible=false;g.add(orbit);
  const detail=new T.Group();g.add(detail);for(let i=0;i<12;i++){const star=new T.Mesh(new T.OctahedronGeometry(.07),new T.MeshBasicMaterial({color:i%3?'#d2fff5':color}));star.position.set(Math.cos(i*Math.PI/6)*1.025,.12,Math.sin(i*Math.PI/6)*1.025);detail.add(star);}
  const avatar=createMascot(color,p.id===1?'petals':p.id===2?'orbit':'plain');this.root.add(avatar.root);
  const tag=label(p.id===0?'▼ 你 · 奇点':p.name,color,420);tag.position.set(p.x,5,-p.s+2);tag.scale.set(p.id===0?3.7:3.2,.95,1);this.root.add(tag);
  const boostTag=label('✦ 冲刺','#fff2ad',240);boostTag.scale.set(2.7,1,1);boostTag.visible=false;this.root.add(boostTag);
  return{g,wall,bottom,aerial,ring,outer,orbit,detail,tag,boostTag,texture,tunnel,avatar,lastCount:0,chew:0};
 }
 applyLook(id){this.look=LOOKS.find(l=>l.id===id)||LOOKS[0];const h=this.holes[0],rainbow=this.look.kind==='rainbow';this.root.remove(h.avatar.root);h.avatar.root.traverse(o=>{if(o.geometry&&!o.userData.shared)o.geometry.dispose();});for(const m of h.avatar.materials)m.dispose();h.avatar=createMascot(this.look.color,this.look.kind,this.look.accent);this.root.add(h.avatar.root);h.ring.material.color.set(rainbow?'#ffffff':this.look.color);h.ring.material.emissive.set(this.look.color);h.outer.material.color.set(this.look.accent);h.orbit.visible=['orbit','royal'].includes(this.look.kind);h.orbit.material.color.set(this.look.accent);const pos=h.ring.geometry.attributes.position,values=[];for(let i=0;i<pos.count;i++){const c=rainbow?new T.Color().setHSL((Math.atan2(pos.getY(i),pos.getX(i))/Math.PI/2+1)%1,.9,.65):new T.Color('#ffffff');values.push(c.r,c.g,c.b);}h.ring.geometry.setAttribute('color',new T.Float32BufferAttribute(values,3));h.ring.material.vertexColors=true;h.ring.material.needsUpdate=true;h.detail.children.forEach((o,i)=>{o.material.color.set(rainbow?colors[i%6]:i%2?this.look.accent:this.look.color);o.visible=this.look.kind!=='plain';o.scale.setScalar(this.look.kind==='royal'?1.6:this.look.kind==='sun'?1.3:1);});}
 thumbnail(id){return mascotThumbnails(LOOKS).get(id);}
 burst(p,color,count=7){for(let n=0;n<count;n++){const dot=this.particleData.find(d=>d.life<=0);if(!dot)break;const a=Math.random()*Math.PI*2;Object.assign(dot,{life:.65,x:p.x+Math.cos(a)*p.radius*.7,y:.25,z:-p.s+Math.sin(a)*p.radius*.7,vx:Math.cos(a)*2,vy:2+Math.random()*2,vz:Math.sin(a)*2,color:new T.Color(color)});}}
 resize(){const c=this.renderer.domElement,w=c.clientWidth,h=c.clientHeight;this.renderer.setPixelRatio(Math.min(Math.max(1,Math.min(devicePixelRatio,1.7)),2048/Math.max(w,h)));this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 render(world,dt,mode='race'){
  this.clock+=dt;const home=mode==='home'||mode==='shop'||mode==='maps',p=world.players[0],s=home?0:p.s,t=this.clock;
  const homeShift=home&&mode!=='shop'&&this.camera.aspect<1.2?-clamp((760-this.renderer.domElement.clientHeight)/65,0,2.8):0;this.demo.position.z=homeShift;
  this.demo.visible=mode==='home';this.demo.children.forEach((m,i)=>{m.position.y=.06+Math.sin(t*1.3+i)*.06;if(i===1){const f=(t*.24)%1;m.position.set(3.4*(1-f),-4*f*f,1.2*(1-f));m.rotation.z=f*1.4;m.scale.setScalar(1-f*.8);}});
  for(let i=0;i<world.players.length;i++){
   const a=world.players[i],h=this.holes[i],r=home?(i===0?2.65:0):a.radius,x=home?0:a.x,dist=home?0:a.s;
   h.g.visible=(!home||i===0)&&!a.retired;h.g.position.set(x,a.h,-dist+(mode==='shop'?-2:homeShift));h.g.scale.set(r,1,r);h.wall.visible=a.h<.12;h.bottom.visible=a.h<.12;h.aerial.visible=a.h>=.12;
   h.texture.rotation=t*(i===0?.12:-.08);h.tunnel.forEach((o,n)=>{o.material.opacity=.48+Math.sin(t*2-n)*.12;});
   if(a.count!==h.lastCount){h.chew=1;h.lastCount=a.count;}h.chew=Math.max(0,h.chew-dt*2.5);
   const actorScale=home?(mode==='shop'?1.12:this.camera.aspect>1.2?1.9:1.3):(i===0?1:.9)+Math.min(.18,Math.max(0,r-.88)*.075);
   h.avatar.root.position.set(x,a.h+.06,-dist+(mode==='shop'?-.9:home?r-.2+homeShift:r+.4));h.avatar.root.scale.setScalar(actorScale);h.avatar.root.rotation.y=home?0:Math.PI;
   poseMascot(h.avatar,t+i*.7,{moving:mode==='race'&&world.mode==='race',chew:home?Math.max(0,Math.sin(t*1.5))*.3:h.chew,steer:a.vx,power:a.power>0,hurt:!home&&a.invincible>0,win:mode==='result'&&a.finished});
   h.avatar.root.visible=h.avatar.root.visible&&(!home||i===0)&&(home||a.s>s-18&&a.s<s+60)&&!a.retired;
   this.cutUniform.value[i].set(x,-dist+(mode==='shop'?-2:homeShift),r,(!home||i===0)&&a.h<.12&&!a.retired?1:0);
   h.detail.rotation.y=t*(i===0?.55:-.3);h.outer.scale.setScalar(1+Math.sin(t*3+i)*.012);
   const powering=a.power>0;h.outer.material.opacity=powering?.9:.48;h.outer.scale.multiplyScalar(powering?1.18:1);
   h.tag.visible=!home&&(i===0||a.s>s-5&&a.s<s+44)&&!a.finished&&!a.retired;h.tag.position.set(x,a.h+actorScale*4.4,-dist+r+.4);h.tag.material.opacity=i===0?1:.85;
   h.boostTag.visible=h.tag.visible&&i!==0&&a.power>0;h.boostTag.position.set(x,a.h+actorScale*5.15,-dist+r+.4);
   if(i===0&&this.look){h.ring.material.emissiveIntensity=powering?.8:.28;if(this.look.kind==='orbit'||this.look.kind==='royal'){h.outer.rotation.z=Math.sin(t*.8)*.22;h.outer.scale.z=1.13;}else h.outer.rotation.z=0;}
   if(a.fall>0){h.g.scale.multiplyScalar(Math.max(.15,1-a.fall));h.avatar.root.scale.multiplyScalar(Math.max(.2,1-a.fall));}
  }
  for(const item of world.items){const m=this.itemMeshes.get(item.id);if(item.state==='falling'){
    const age=world.time-item.captured,a=world.players[item.owner],f=clamp(age/.64,0,1);m.visible=f<1;m.position.set(a.x+item.dx*(1-f)*(1-f),-.03-5.5*f*f,-a.s-item.ds*(1-f)*(1-f));m.rotation.x=f*1.5;m.rotation.z=f*1.1;m.scale.setScalar(Math.max(.03,1-f*.82));
   }else{m.visible=item.s>s-12&&item.s<s+(home?58:105);if(item.type==='core'){m.rotation.y=t*1.2+item.id;m.position.y=.07+Math.sin(t*2+item.id)*.1;}}}
  for(const h of world.hazards){const m=this.hazardMeshes.get(h.id);m.visible=h.state==='idle'&&h.s>s-10&&h.s<s+105;m.position.x=h.x;if(m.visible)m.children[1].rotation.y=Math.sin(t*2+h.id)*.1;}
  this.particleData.forEach((d,i)=>{d.life-=dt;if(d.life>0){d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;d.vy-=8*dt;this.particlePos.set([d.x,d.y,d.z],i*3);this.particleColors.set([d.color.r,d.color.g,d.color.b],i*3);}else this.particlePos.set([0,-100,0],i*3);});this.particleGeo.attributes.position.needsUpdate=true;this.particleGeo.attributes.color.needsUpdate=true;
  const aspect=this.camera.aspect,wide=aspect>1.2,short=this.renderer.domElement.clientHeight<660;
  const cy=mode==='shop'?(wide?7.2:short?13:10.8):home?20.5:wide?23:24.5,cz=mode==='shop'?(wide?11.4:short?19:17):home?29:wide?28:32;
  const target=new T.Vector3(home?Math.sin(t*.15)*.3:p.x*.15,cy,-s+cz);this.camera.position.lerp(target,1-Math.exp(-dt*7));this.camera.lookAt(home?0:p.x*.24,mode==='shop'?(wide?1.8:.4):0,-s+(mode==='shop'?0:-(home?6:13)));
  this.sun.position.set(-23,36,-s+21);this.sun.target.position.set(0,0,-s-12);this.sun.target.updateMatrixWorld();this.renderer.render(this.scene,this.camera);
 }
}
