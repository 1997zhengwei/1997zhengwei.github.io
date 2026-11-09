import * as T from '../vendor/three.module.js';
import {bevelBox} from './architecture.mjs';
import {propGeometry} from './scene.mjs';

const PALETTE=['#b9795d','#618b8a','#d0b27a','#ded4bd','#697e94','#927b83'];
const cache=new Map();
function merge(parts){
 const pos=[],normal=[],color=[],uv=[];
 for(const part of parts){const g=part.g.index?part.g.toNonIndexed():part.g.clone(),mat=new T.Matrix4().compose(new T.Vector3(...part.p),new T.Quaternion().setFromEuler(new T.Euler(...(part.r||[0,0,0]))),new T.Vector3(...(part.s||[1,1,1])));g.applyMatrix4(mat);const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,c=new T.Color(part.c);
  for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));normal.push(n.getX(i),n.getY(i),n.getZ(i));const ao=(.76+.24*T.MathUtils.smoothstep(p.getY(i),0,.5))*(n.getY(i)<-.6?.78:1);color.push(c.r*ao,c.g*ao,c.b*ao);uv.push(u?u.getX(i):.5,u?u.getY(i):.5);}g.dispose();part.g.dispose();
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingSphere();return g;
}
function modelGeometry(type,v){
 const key=type+v;if(cache.has(key))return cache.get(key);const parts=new Map(),accent=PALETTE[v%6],stone='#d9d1be',edge='#a6aaa3',dark='#293c48',brass='#ad9262',glass='#7dabb7';
 const add=(k,g,p,c,r,s)=>{if(!parts.has(k))parts.set(k,[]);parts.get(k).push({g,p,c,r,s});};
 const B=(k,x,y,z,w,h,d,c,r)=>add(k,Math.min(w,h,d)>.11?bevelBox(w,h,d,Math.min(w,h,d)*.07):new T.BoxGeometry(w,h,d),[x,y,z],c,r);
 const C=(k,x,y,z,r,h,c,rot,rb=r)=>add(k,new T.CylinderGeometry(r,rb,h,16),[x,y,z],c,rot);
 const S=(k,x,y,z,r,c,s)=>add(k,new T.IcosahedronGeometry(r,2),[x,y,z],c,null,s);
 const building=['house','tower','kiosk'].includes(type);
 if(building){
  const kiosk=type==='kiosk',tower=type==='tower',w=kiosk?2.1:tower?3.5:3.15,d=kiosk?1.8:tower?3.2:2.9,h=kiosk?1.9:tower?5.8:3.5;
  // The full model stays inside the existing collision footprint.
  B('stone',0,.1,0,w,.2,d,'#a8aaa0');
  const face=(k,f,u,y,offset,fw,fh,depth,c)=>{const a=f*Math.PI/2,nx=Math.sin(a),nz=Math.cos(a),tx=Math.cos(a),tz=-Math.sin(a),extent=f%2?w/2:d/2;B(k,tx*u+nx*(extent+offset),y,tz*u+nz*(extent+offset),fw,fh,depth,c,[0,a,0]);};
  const window=(f,u,y,fw=.4,fh=.63,arched=false,lit=false)=>{
   face('metal',f,u,y,-.012,fw+.07,fh+.09,.045,dark);face(lit?'lit':'glass',f,u,y,.015,fw,fh,.025,lit?'#d3ad72':glass);face('stone',f,u,y-fh/2-.07,.065,fw+.17,.085,.2,stone);
   if(arched){const a=f*Math.PI/2,extent=f%2?w/2:d/2;add('glass',new T.CircleGeometry(fw/2,16,0,Math.PI),[Math.cos(a)*u+Math.sin(a)*(extent+.022),y+fh/2,-Math.sin(a)*u+Math.cos(a)*(extent+.022)],glass,[0,a,0]);}
  };
  const roof=(height,rw=w,rd=d)=>{
   B('roof',0,height+.035,0,rw-.1,.12,rd-.1,'#53656a');
   for(const sign of[-1,1]){B('stone',sign*(rw/2-.06),height+.15,0,.12,.3,rd,stone);B('stone',0,height+.15,sign*(rd/2-.06),rw,.3,.12,stone);}
   B('metal',rw*.17,height+.32,-rd*.14,rw*.32,.46,rd*.32,'#aab9b8');B('roof',rw*.17,height+.56,-rd*.14,rw*.35,.035,rd*.35,'#d9ddd5');
   for(let n=0;n<3;n++)B('metal',rw*.17,height+.587,-rd*.14+(n-1)*rd*.07,rw*.25,.025,.045,'#647982');
   for(let n=0;n<2;n++){B('roof',-rw*.23,height+.16,rd*.04+n*.42,rw*.3,.1,.34,'#263e4c');B('glass',-rw*.23,height+.22,rd*.04+n*.42,rw*.28,.025,.31,'#314e65');B('metal',-rw*.23,height+.237,rd*.04+n*.42,.013,.01,.31,'#82969c');}
  };
  if(kiosk){
   B('stone',0,.91,0,w,1.65,d,v%2?stone:accent);for(let f=0;f<4;f++){const fw=f%2?d:w;face('metal',f,0,.92,.005,fw*.78,1.23,.035,dark);face('glass',f,0,.97,.028,fw*.71,1.08,.027,'#6a9b9e');for(const u of[-.27,.27])face('metal',f,u,.92,.055,.035,1.23,.03,brass);}
   B('roof',0,1.83,0,w+.04,.15,d+.04,'#536367');B('stone',0,1.93,0,w+.08,.1,d+.08,stone);
   B('stone',0,1.55,d/2+.24,w+.03,.08,.53,v%2?'#dad1ad':accent,[-.13,0,0]);for(let x=-w/2+.12;x<w/2;x+=.24)B('stone',x,1.54,d/2+.24,.11,.09,.53,'#e6dfc7',[-.13,0,0]);
   B('metal',0,2.11,d/2-.05,w*.87,.36,.11,'#234747');B('sign',0,2.12,d/2+.009,w*.79,.25,.012,'#ffffff');
   B('roof',0,.55,d/2+.08,w*.85,.12,.2,'#8c8472');
   for(const sign of[-1,1]){B('stone',sign*.91,.18,d/2+.18,.21,.35,.21,'#ac9d7c');S('leaf',sign*.91,.48,d/2+.18,.18,'#6f8e65',[1,1.3,1]);}
   if(v%2===0){C('metal',w*.36,2.25,-d*.33,.025,1.15,'#40515b');B('lit',w*.36,2.83,-d*.33,.18,.12,.14,'#f0d39a');}
  }else if(tower&&v%3===0){
   // Curtain-wall office with narrow metal mullions and a stone podium.
   B('stone',0,.43,0,w,.66,d,stone);B('stone',0,3.1,0,w-.06,4.78,d-.06,dark);
   for(let f=0;f<4;f++){const fw=f%2?d:w;face('glass',f,0,3.08,-.018,fw-.14,4.8,.025,v%2?'#537e8b':'#6a919c');for(let n=-2;n<=2;n++)face('metal',f,n*(fw-.2)/5,3.08,.025,.035,4.85,.045,'#abb3ad');for(let y=.8;y<5.7;y+=.8)face('metal',f,0,y,.043,fw,.06,.09,'#c4c6bb');
    face('lit',f,fw*.15,2.77,.028,fw*.17,.64,.028,'#bfa982');face('metal',f,0,.4,.04,.43,.74,.09,brass);}
   B('stone',0,5.64,0,w+.05,.17,d+.05,stone);roof(5.77);
  }else if(tower&&v%3===1){
   // Setback tower, with a smaller crown rather than a repeated box silhouette.
   B('stone',0,2.05,0,w,3.9,d,v%2?accent:stone);B('stone',0,4.58,0,w*.73,1.25,d*.74,stone);B('stone',0,3.92,0,w+.04,.18,d+.04,stone);
   for(let f=0;f<4;f++){const fw=f%2?d:w;for(let y=.85;y<3.8;y+=.82)for(let n=-2;n<=2;n++)window(f,n*fw*.15,y,fw*.103,.54,false,(n+Math.round(y*2)+v)%6===0);for(const u of[-.44,0,.44])face('metal',f,u*fw,2.3,.032,.045,3.05,.065,brass);}
   for(const sign of[-1,1]){B('glass',sign*w*.369,4.58,0,.025,.84,d*.63,'#578190');B('glass',0,4.58,sign*d*.375,w*.62,.84,.025,'#578190');B('roof',sign*w*.42,4.1,0,.28,.3,d*.7,'#6b815d');}
   roof(5.28,w*.74,d*.75);
  }else{
   const brick=v%3===2,k=brick?'brick':'stone';B(k,0,(h-.23)/2,0,w,h-.23,d,brick?(v%2?'#a16b52':'#b78060'):accent);
   for(let f=0;f<4;f++){const fw=f%2?d:w,rows=tower?5:3;for(let row=0;row<rows;row++)for(let n=-1;n<=1;n++)window(f,n*fw*.27,.7+row*(tower?.92:.9),fw*.17,tower?.59:.53,brick,(row+n+v+7)%7===0);
    if(!brick&&v%2===1)for(let row=1;row<rows;row++){const y=.36+row*(tower?.92:.9);face('stone',f,0,y,.19,fw*.68,.1,.45,stone);face('metal',f,0,y+.25,.42,fw*.67,.038,.035,'#596b70');for(const u of[-.3,0,.3])face('metal',f,u*fw,y+.14,.42,.028,.32,.03,'#596b70');}}
   B('stone',0,h-.16,0,w+.04,.12,d+.04,stone);B('stone',0,h-.02,0,w+.09,.1,d+.09,stone);roof(h+.03);
   if(!tower&&v%3===0){for(const sign of[-1,1]){B('roof',sign*w*.24,h+.22,0,w*.53,.1,d*.94,'#9b6e53',[0,0,sign*-.26]);for(let n=-5;n<=5;n++)B('roof',sign*w*.24,h+.28,n*d*.084,w*.53,.025,.025,'#b48662',[0,0,sign*-.26]);}}
  }
 }else if(type==='car'||type==='truck'){
  const truck=type==='truck',w=truck?1.8:1.45,l=truck?3.7:2.65,top=truck?2.08:1.42;
  B('black',0,.31,0,w*.93,.22,l*.94,'#29383f');B('car',0,.56,0,w,.47,l,accent);B('car',0,truck?1.34:1.03,.12,w*.91,truck?1.35:.62,l*(truck?.78:.51),truck?'#e1d8bf':accent);
  B('glass',0,truck?1.64:1.1,-l*(truck?.35:.2),w*.79,truck?.6:.4,.035,'#60828b',[truck?-.08:-.28,0,0]);B('glass',0,truck?1.64:1.12,l*(truck?.39:.26),w*.79,truck?.59:.33,.035,'#60828b',[truck?.05:.25,0,0]);
  for(const sign of[-1,1]){B('glass',sign*w*.461,truck?1.64:1.12,.14,.025,truck?.55:.35,l*(truck?.59:.37),'#517782');B('metal',sign*w*.47,.87,.12,.028,.045,l*.53,'#b4b8af');B('car',sign*w*.55,truck?1.4:1.05,-l*.16,.18,.12,.2,accent);for(const z of[-l*.29,l*.29]){C('black',sign*w*.49,.3,z,.29,.16,'#1c292e',[0,0,Math.PI/2]);C('metal',sign*w*.51,.3,z,.15,.17,'#aab6b5',[0,0,Math.PI/2]);}B('lit',sign*w*.31,.58,-l/2-.018,.25,.115,.03,'#f3e6b6');B('lit',sign*w*.31,.57,l/2+.018,.21,.1,.03,'#b66d58');}
  B('car',0,top,.1,w*.91,.07,l*(truck?.81:.51),truck?'#d6d5c6':accent);B('metal',0,.36,-l/2,.9,.065,.07,'#abb7b5');
  if(!truck&&v===2)B('lit',0,top+.12,0,.4,.15,.22,'#e8c885');
 }else if(type==='tree'){
  C('bark',0,.84,0,.11,1.67,'#806951',null,.18);C('bark',.23,1.25,.02,.065,.7,'#806951',[0,0,-.48]);S('leaf',0,1.98,0,.65,v%2?'#729467':'#557f65',[.95,1.22,.94]);S('leaf',.4,1.67,.08,.46,'#809b6d',[.9,1.02,1]);S('leaf',-.26,1.64,-.25,.4,'#67885e',[1,1.1,.9]);B('stone',0,.035,0,.67,.07,.67,'#c7bda7');
 }else{
  const old=propGeometry(type,v).clone(),colors=old.attributes.color;old.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(old.attributes.position.count*2),2));for(let n=0;n<colors.count;n++){const c=new T.Color().setRGB(colors.getX(n),colors.getY(n),colors.getZ(n));c.offsetHSL(0,-.12,-.01);colors.setXYZ(n,c.r,c.g,c.b);}cache.set(key,[{kind:'stone',g:old}]);return cache.get(key);
 }
 const result=[...parts].map(([kind,parts])=>({kind,g:merge(parts)}));cache.set(key,result);return result;
}

export function surfaceTexture(kind){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=kind==='grass'?'#e1e4d5':'#e0e0da';x.fillRect(0,0,256,256);
 for(let i=0;i<5000;i++){const k=(Math.sin(i*12.9898)*43758.54)%1,r=(k+1)%1,s=(Math.sin(i*6.42)*1728.4+1)%1;x.fillStyle=`rgba(${r>.5?'255,255,245':'90,100,100'},${kind==='grass'?.055:.035})`;x.fillRect(r*256,Math.abs(s)*256,kind==='grass'?1:2,1);}
 if(kind==='paving'){x.strokeStyle='#68736f2e';x.lineWidth=1;for(let i=0;i<=256;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.moveTo(0,i);x.lineTo(256,i);x.stroke();}}
 if(kind==='brick'){x.fillStyle='#c0bdb024';for(let y=0;y<256;y+=32){x.fillRect(0,y,256,2);for(let xx=(y%64?16:0);xx<256;xx+=64)x.fillRect(xx,y,2,32);}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='brick'?2:kind==='paving'?2:5,kind==='brick'?2:kind==='paving'?2:5);t.anisotropy=4;t.userData.shared=true;return t;
}
function signTexture(v){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle=v%2?'#263c43':'#344f4b';x.fillRect(0,0,512,128);x.fillStyle='#e4d4a9';x.font='600 69px Georgia,serif';x.textAlign='center';x.textBaseline='middle';x.fillText(['CAFÉ','MARKET','BAKERY','STUDIO','COFFEE','FLORA'][v],256,66);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.userData.shared=true;return t;}
function glassTexture(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#e1edf1');g.addColorStop(.45,'#a6bec6');g.addColorStop(1,'#536a77');x.fillStyle=g;x.fillRect(0,0,256,256);const r=x.createLinearGradient(0,0,256,160);r.addColorStop(0,'#fff9e900');r.addColorStop(.35,'#fff9e900');r.addColorStop(.4,'#fff9e95c');r.addColorStop(.55,'#fff9e92b');r.addColorStop(.6,'#fff9e900');r.addColorStop(1,'#fff9e900');x.fillStyle=r;x.fillRect(0,0,256,256);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.userData.shared=true;return t;}
export function contactTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,12,64,64,64);g.addColorStop(0,'#ffffffa0');g.addColorStop(.5,'#ffffff70');g.addColorStop(.8,'#ffffff20');g.addColorStop(1,'#ffffff00');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new T.CanvasTexture(c);t.userData.shared=true;return t;}
export class CityArt{
 constructor(){
  const std=(roughness,metalness=0)=>new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness,metalness});
  this.materials={stone:std(.71),brick:std(.83),roof:std(.57,.13),metal:std(.3,.58),black:std(.92),bark:std(.96),leaf:std(.92),lit:new T.MeshStandardMaterial({vertexColors:true,roughness:.3,emissive:'#f5c883',emissiveIntensity:.32}),glass:new T.MeshPhysicalMaterial({vertexColors:true,roughness:.13,metalness:.43,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.2}),car:new T.MeshPhysicalMaterial({vertexColors:true,roughness:.26,metalness:.2,clearcoat:.85,clearcoatRoughness:.18,envMapIntensity:.9})};
  this.materials.stone.map=surfaceTexture('plaster');this.materials.brick.map=surfaceTexture('brick');this.materials.glass.map=glassTexture();for(const m of Object.values(this.materials))m.userData.shared=true;this.sectionMaterial=new T.MeshStandardMaterial({color:'#77857b',roughness:.86});this.sectionMaterial.userData.shared=true;this.signs=Array.from({length:6},(_,v)=>{const m=new T.MeshStandardMaterial({map:signTexture(v),roughness:.7});m.userData.shared=true;return m;});
 }
 model(type,variant){const root=new T.Group(),building=['house','tower','kiosk'].includes(type),owned=[],plane=new T.Plane(new T.Vector3(0,-1,0),10000);for(const entry of modelGeometry(type,variant)){const base=entry.kind==='sign'?this.signs[variant]:this.materials[entry.kind],material=building?base.clone():base;if(building){material.userData.shared=false;material.clippingPlanes=[plane];owned.push(material);}const m=new T.Mesh(entry.g,material);m.userData.shared=true;m.castShadow=!['glass','lit','sign'].includes(entry.kind);m.receiveShadow=true;root.add(m);}if(building){const w=type==='tower'?3.5:type==='house'?3.15:2.1,d=type==='tower'?3.2:type==='house'?2.9:1.8,cap=new T.Mesh(new T.BoxGeometry(w,.02,d),this.sectionMaterial);cap.receiveShadow=true;cap.visible=false;root.add(cap);root.userData.sectionCap=cap;}root.userData.ownedMaterials=owned;root.userData.cutPlane=plane;root.userData.cutaway=false;root.userData.building=building;return root;}
 cutaway(model,active){if(!model.userData.building||model.userData.cutaway===active)return;model.userData.cutaway=active;model.userData.cutPlane.constant=active?1.05:10000;const cap=model.userData.sectionCap;cap.visible=active;if(active)cap.position.y=(1.02-model.position.y)/model.scale.y;}
}
