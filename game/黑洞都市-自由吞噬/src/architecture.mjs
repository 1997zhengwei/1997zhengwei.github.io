import * as T from '../vendor/three.module.js';
import {rng} from './rules.mjs';

// Real rounded edges catch the key light. No outlines or painted fake facets.
export function bevelBox(w=1,h=1,d=1,r=Math.min(w,h,d)*.09){
 const g=new T.BoxGeometry(w,h,d,3,3,3),p=g.attributes.position,n=g.attributes.normal,v=new T.Vector3(),q=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);q.set(T.MathUtils.clamp(v.x,-w/2+r,w/2-r),T.MathUtils.clamp(v.y,-h/2+r,h/2-r),T.MathUtils.clamp(v.z,-d/2+r,d/2-r));v.sub(q).normalize();n.setXYZ(i,v.x,v.y,v.z);v.multiplyScalar(r).add(q);p.setXYZ(i,v.x,v.y,v.z);}
 g.computeBoundingSphere();return g;
}

export function studioEnvironment(renderer){
 const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
 g.addColorStop(0,'#a7d4f4');g.addColorStop(.48,'#e5f0f5');g.addColorStop(.52,'#b6bdc1');g.addColorStop(1,'#40536c');x.fillStyle=g;x.fillRect(0,0,512,256);
 const sun=x.createRadialGradient(360,58,1,360,58,75);sun.addColorStop(0,'#fff5dfff');sun.addColorStop(.25,'#fff8e9ee');sun.addColorStop(1,'#fff8e900');x.fillStyle=sun;x.fillRect(270,0,180,150);x.fillStyle='#fffdf5';x.fillRect(100,55,48,70);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.mapping=T.EquirectangularReflectionMapping;const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(t);t.dispose();pmrem.dispose();return target;
}

export function roadTexture(kind='asphalt'){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),rand=rng(kind==='asphalt'?335:81);
 x.fillStyle=kind==='asphalt'?'#aaaeb6':'#ded9ca';x.fillRect(0,0,128,128);
 for(let i=0;i<1600;i++){const grey=Math.floor(135+rand()*70);x.fillStyle=`rgba(${grey},${grey},${grey},.21)`;x.fillRect(rand()*128,rand()*128,1+rand()*1.5,1);}
 if(kind!=='asphalt'){x.strokeStyle='#8f938b6b';x.lineWidth=1;for(let v=0;v<=128;v+=32){x.beginPath();x.moveTo(v,0);x.lineTo(v,128);x.moveTo(0,v);x.lineTo(128,v);x.stroke();}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='asphalt'?6:2,kind==='asphalt'?6:2);t.anisotropy=4;return t;
}

export function buildArchitecture(root,course){
 const random=rng(course.seed+88),length=course.length+85,entries={stone:[],glass:[],metal:[],light:[],leaf:[]},temp=new T.Object3D();
 const warm=course.id==='sunset',coast=course.id==='coast';
 const palette=coast?['#f6e6ce','#e9a1ad','#72bec2','#e7c78e','#d7dfd6','#88a4d1']:warm?['#c9856b','#e5ba84','#91abbc','#b3a2c8','#dfccad','#7aaeb1']:['#dbab85','#719cae','#d9c191','#a4afc4','#b97482','#83a99b'];
 const add=(kind,x,y,z,w,h,d,color,rz=0,ry=0)=>entries[kind].push({x,y,z,w,h,d,color,rz,ry});
 const B=(x,y,z,w,h,d,c)=>add('stone',x,y,z,w,h,d,c);
 const M=(x,y,z,w,h,d,c='#496071')=>add('metal',x,y,z,w,h,d,c);
 const G=(x,y,z,w,h,d,c='#395d70')=>add('glass',x,y,z,w,h,d,c);
 const L=(x,y,z,w,h,d,c='#ffe4ad')=>add('light',x,y,z,w,h,d,c);
 for(const sign of[-1,1])B(sign*30,-.34,-length/2,33,.6,length+80,'#b4c0bc');
 for(let s=-25,i=0;s<length;s+=13,i++)for(const sign of[-1,1]){
  const x=sign*(17.5+random()),z=-s,w=4.8+random()*2.2,d=7+random()*2,h=5.5+random()*10,col=palette[(i+(sign===1?3:0))%6],trim='#ded9ca';
  // Layered street podium, recessed top floor and a dark roof well.
  B(x,.12,z,w+.75,.34,d+.75,'#b5b8b1');B(x,1.25,z,w+.18,2.15,d+.18,'#a7a396');B(x,(h+2.3)/2,z,w,h-2.3,d,col);
  B(x,2.4,z,w+.27,.18,d+.27,trim);B(x,h-.12,z,w+.28,.24,d+.28,trim);B(x,h+.04,z,w-.3,.12,d-.3,'#69767c');
  for(const a of[-1,1]){B(x+a*w/2,h+.23,z,.17,.42,d+.24,trim);B(x,h+.23,z+a*d/2,w,.42,.17,trim);}
  // Windows sit inside dark frames; projecting sills and columns create real depth.
  for(let y=3.3;y<h-.5;y+=1.65){
   for(let a=-d/2+1;a<d/2-.4;a+=1.7){const fx=x-sign*(w/2+.015);M(fx,y,z+a,.11,1.17,1.07,'#586c73');G(fx-sign*.065,y+.03,z+a,.035,.92,.86,(i+Math.round(a))%3?'#426b7d':'#7492a0');B(fx-sign*.14,y-.58,z+a,.35,.12,1.19,trim);}
   for(let a=-w/2+.85;a<w/2-.3;a+=1.55){M(x+a,y,z+d/2+.02,1.08,1.17,.1,'#596a70');G(x+a,y+.03,z+d/2+.08,.88,.92,.035,'#507d91');B(x+a,y-.58,z+d/2+.15,1.19,.12,.32,trim);}
   if(i%3===0){const bx=x-sign*(w/2+.42);B(bx,y-.72,z,1.15,.17,d*.62,trim);M(bx-sign*.53,y-.35,z,.045,.65,d*.63);for(const end of[-1,1])M(bx,y-.35,z+end*d*.31,1.05,.65,.045);}
  }
  for(const a of[-1,1])B(x+a*(w/2-.14),(h+2.5)/2,z+d/2+.035,.2,h-2.5,.16,trim);
  // Shop front, projecting striped canopy and a warm sign light.
  G(x,1.3,z+d/2+.12,w*.76,1.55,.09,'#284d61');for(const a of[-1,0,1])M(x+a*w*.27,1.3,z+d/2+.2,.065,1.6,.09);
  B(x,2.05,z+d/2+.5,w+.3,.17,1.1,col);L(x,1.96,z+d/2+.55,w*.8,.035,.65);B(x,2.25,z+d/2+.17,w*.8,.32,.15,coast?'#43a7a6':'#395168');
  // Rooftop plant room, ventilation ducts, skylights and solar panels.
  B(x+w*.16,h+.68,z-d*.16,w*.42,1.13,d*.3,'#a9b4b6');M(x+w*.16,h+1.28,z-d*.16,w*.46,.12,d*.33,'#d5d8cc');
  for(let k=0;k<2;k++){B(x-w*.23,h+.3,z+d*.13+k*1.4,1.05,.48,.97,'#c8d0cc');for(let n=0;n<3;n++)M(x-w*.23,h+.55,z+d*.13+k*1.4+(n-1)*.2,.81,.025,.06);}
  for(let k=0;k<2;k++){G(x+w*.2,h+.23,z+d*.2+k*1.05,w*.37,.13,.85,'#294d68');M(x+w*.2,h+.31,z+d*.2+k*1.05,.025,.02,.85,'#98aabb');}
  // A second depth layer makes the skyline read as a city, not two walls.
  const fx=sign*(28+random()*5),fh=10+random()*13;B(fx,fh/2,z-2,7,fh,9,palette[(i+2)%6]);B(fx,fh+.15,z-2,7.3,.3,9.3,trim);
  for(let y=2;y<fh-1;y+=2.2){G(fx-sign*3.53,y,z-2,.04,.9,7,'#587482');B(fx-sign*3.6,y-.58,z-2,.24,.1,8,trim);}
  if(i%2===0){const lx=sign*11.8;M(lx,2.1,z,.1,4.2,.1);M(lx-sign*.6,4.17,z,1.3,.11,.2);L(lx-sign*.65,4.08,z,.7,.08,.27);B(sign*13.8,.3,z+4,1.15,.6,2.8,'#c2c2ae');B(sign*13.8,.63,z+4,.95,.15,2.6,'#65947b');}
  if(i%3===0){const tx=sign*13.2,tz=z+5.5;B(tx,.18,tz,1.3,.36,1.3,'#b1b1a0');B(tx,coast?1.7:1.1,tz,.2,coast?3.1:2,.2,'#8c7054');
   if(coast){for(let n=0;n<6;n++){const a=n*Math.PI/3;add('leaf',tx+Math.cos(a)*.7,3.28,tz+Math.sin(a)*.7,2.6,.2,.7,n%2?'#438967':'#6b9f71',0,-a);}}
   else{add('leaf',tx,2.65,tz,1.8,2.2,1.8,'#659977');add('leaf',tx+.45,2.4,tz+.2,1.35,1.5,1.4,'#7da87a');}
  }
 }
 const materials={stone:new T.MeshStandardMaterial({roughness:.64}),glass:new T.MeshPhysicalMaterial({roughness:.17,metalness:.42,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.9}),metal:new T.MeshStandardMaterial({roughness:.36,metalness:.48}),light:new T.MeshStandardMaterial({roughness:.25,emissive:'#ffcd84',emissiveIntensity:.65}),leaf:new T.MeshStandardMaterial({roughness:.92})};
 for(const [kind,list]of Object.entries(entries)){
  const geometry=kind==='stone'?bevelBox():kind==='leaf'?new T.SphereGeometry(.5,12,8):new T.BoxGeometry(1,1,1),mesh=new T.InstancedMesh(geometry,materials[kind],list.length);list.forEach((e,i)=>{temp.position.set(e.x,e.y,e.z);temp.rotation.set(0,e.ry,e.rz);temp.scale.set(e.w,e.h,e.d);temp.updateMatrix();mesh.setMatrixAt(i,temp.matrix);mesh.setColorAt(i,new T.Color(e.color));});mesh.castShadow=kind==='stone'||kind==='metal'||kind==='leaf';mesh.receiveShadow=true;root.add(mesh);
 }
}
