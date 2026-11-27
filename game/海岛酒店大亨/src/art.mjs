import * as T from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {HOTEL_PALETTE as P} from './palette.mjs';
const mats=new Map(),geos=new Map();
export function mat(color,roughness=.65,metalness=0){const k=`${color}/${roughness}/${metalness}`;if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color,roughness,metalness}));return mats.get(k);}
export const M={white:mat('#fff9e6'),ivory:mat(P.wallEdge),teal:mat(P.wall),dark:mat('#234352'),wood:mat('#d48229'),gold:mat('#ffca35',.5,.07),coral:mat('#f16d32'),green:mat('#3cb865'),glass:mat('#56bce7',.4,.03),chrome:mat('#d2e9ed',.3,.3)};
function geo(key,build){if(!geos.has(key)){const g=build();g.userData.shared=true;geos.set(key,g);}return geos.get(key);}
export function box(g,x,y,z,w,h,d,m=M.white,r=.08){const mesh=new T.Mesh(geo(`b${w},${h},${d},${r}`,()=>r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d)),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;}
export function sphere(g,x,y,z,r,m,scale=null){const o=new T.Mesh(geo(`s${r}`,()=>new T.SphereGeometry(r,r>=.2?24:14,r>=.2?16:10)),m);o.position.set(x,y,z);if(scale)o.scale.set(...scale);o.castShadow=true;g.add(o);return o;}
export function cylinder(g,x,y,z,r,h,m,rt=r){const o=new T.Mesh(geo(`c${r},${h},${rt}`,()=>new T.CylinderGeometry(rt,r,h,16)),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
export function torus(g,x,y,z,r,tube,m,rx=Math.PI/2){const o=new T.Mesh(geo(`t${r},${tube}`,()=>new T.TorusGeometry(r,tube,8,32)),m);o.position.set(x,y,z);o.rotation.x=rx;g.add(o);return o;}
export function batch(g){
 g.updateMatrixWorld(true);const inv=g.matrixWorld.clone().invert(),buckets=new Map(),remove=[];
 g.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.material.transparent)return;let list=buckets.get(o.material);if(!list)buckets.set(o.material,list=[]);const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geometry.applyMatrix4(inv.clone().multiply(o.matrixWorld));list.push(geometry);remove.push(o);if(o.geometry.userData.transient)o.geometry.dispose();});
 for(const o of remove)o.removeFromParent();
 for(const [m,geometries] of buckets){const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;const mesh=new T.Mesh(merged,m);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}return g;
}
const characterMaterial=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.72,metalness:.015});
const surfaceMaterials=new Map();
function preserved(o,root){for(let p=o.parent;p&&p!==root;p=p.parent)if(p.userData.preserve)return true;return false;}
export function batchSurfaces(g){
 g.updateMatrixWorld(true);const inverse=g.matrixWorld.clone().invert(),buckets=new Map(),removed=[];
 g.traverse(o=>{
  if(!o.isMesh||!o.material.isMeshStandardMaterial||o.material.map||o.material.transparent||preserved(o,g))return;
  const key=[o.material.roughness,o.material.metalness,o.material.side].join('/');
  if(!surfaceMaterials.has(key))surfaceMaterials.set(key,new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:o.material.roughness,metalness:o.material.metalness,side:o.material.side}));
  let list=buckets.get(key);if(!list)buckets.set(key,list=[]);
  const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geometry.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
  const c=o.material.color,values=new Float32Array(geometry.attributes.position.count*3);
  for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b;}
  geometry.setAttribute('color',new T.BufferAttribute(values,3));list.push(geometry);removed.push(o);
 });
 for(const o of removed)o.removeFromParent();
 for(const [key,list] of buckets){const geometry=mergeGeometries(list,false);list.forEach(p=>p.dispose());if(geometry){const mesh=new T.Mesh(geometry,surfaceMaterials.get(key));mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);}}
 return g;
}
export function batchColors(g){
 g.updateMatrixWorld(true);const inverse=g.matrixWorld.clone().invert(),geometries=[],removed=[];
 g.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material)||o.material.map||o.material.transparent||preserved(o,g))return;
  const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
  geometry.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
  const colour=o.material.color,values=new Float32Array(geometry.attributes.position.count*3);
  for(let i=0;i<values.length;i+=3){values[i]=colour.r;values[i+1]=colour.g;values[i+2]=colour.b;}
  geometry.setAttribute('color',new T.BufferAttribute(values,3));geometries.push(geometry);removed.push(o);
  if(o.geometry.userData.transient)o.geometry.dispose();
 });
 if(!geometries.length)return g;
 const merged=mergeGeometries(geometries,false);geometries.forEach(o=>o.dispose());
 if(merged){for(const o of removed)o.removeFromParent();const mesh=new T.Mesh(merged,characterMaterial);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}
 return g;
}
export function textSprite(text,color='#164455',size=1.2,bg=null){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');
 if(bg){c.fillStyle=bg;c.beginPath();c.roundRect(4,4,504,120,24);c.fill();}
 c.fillStyle=color;c.font='800 47px "Microsoft YaHei",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,66,485);
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(size*4,size,1);return s;
}
export function floorTexture(type){
 const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d');
 if(['parquet','lobby','wall'].includes(type)){
  if(type==='wall'){
   p.fillStyle=P.wall;p.fillRect(0,0,256,256);p.fillStyle=P.wallStripe;
   for(let x=0;x<256;x+=64)p.fillRect(x,0,31,256);
  }else{
   const colours=type==='lobby'?P.lobby:P.timber;
   p.fillStyle=colours[1];p.fillRect(0,0,256,256);
   for(let row=-2;row<7;row++)for(let col=-3;col<5;col++){
    const x=col*128,y=row*64;
    for(let side=0;side<2;side++){
     const points=side?[[x+64,y+64],[x+128,y],[x+128,y+32],[x+64,y+96]]:[[x,y],[x+64,y+64],[x+64,y+96],[x,y+32]];
     p.beginPath();points.forEach(([a,b],i)=>i?p.lineTo(a,b):p.moveTo(a,b));p.closePath();p.fillStyle=colours[((col+row+side)%4+4)%4];p.fill();p.strokeStyle=type==='lobby'?'#a5945b30':'#a8512180';p.lineWidth=1.25;p.stroke();
    }
   }
  }
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(type==='wall'?2:type==='lobby'?10:3,type==='lobby'?14:type==='wall'?1:3);texture.anisotropy=4;return texture;
 }
 const colors=type==='lobby'?['#c8edf3','#91d3df']:type==='deck'?['#dfb27b','#b7895b']:type==='luxury'?['#fff9e9','#ddcfae']:type==='carpet'?['#ffffff','#ffffff']:['#ffffff','#c0e6ed'];
 p.fillStyle=colors[0];p.fillRect(0,0,256,256);p.strokeStyle=colors[1];p.lineWidth=2;
 if(type==='carpet'){
  p.fillStyle='#c6e5e5';p.fillRect(0,0,256,256);p.fillStyle='#adcece55';for(let y=0;y<256;y+=4)p.fillRect(0,y,256,1);
  p.strokeStyle='#ffffff';p.lineWidth=5;
  for(let y=32;y<256;y+=64)for(let x=32;x<256;x+=64){p.beginPath();p.moveTo(x-11,y);p.lineTo(x,y-11);p.lineTo(x+11,y);p.lineTo(x,y+11);p.closePath();p.stroke();}
 }else if(type==='deck'){for(let y=0;y<256;y+=32){p.beginPath();p.moveTo(0,y);p.lineTo(256,y);p.stroke();for(let x=(y%64?64:0);x<256;x+=128){p.beginPath();p.moveTo(x,y);p.lineTo(x,y+32);p.stroke();}}}
 else for(let y=0;y<256;y+=64)for(let x=0;x<256;x+=64){p.strokeRect(x,y,64,64);if(type==='room'||type==='luxury'){p.save();p.translate(x+32,y+32);p.strokeStyle=type==='luxury'?'#c5a65e66':'#97c8d466';p.lineWidth=1.3;for(let k=0;k<4;k++){p.rotate(Math.PI/2);p.beginPath();p.ellipse(0,-9,4,9,0,0,Math.PI*2);p.stroke();}p.restore();}if(type==='lobby'){p.fillStyle='#329fb52b';p.beginPath();p.moveTo(x+32,y+18);p.lineTo(x+46,y+32);p.lineTo(x+32,y+46);p.lineTo(x+18,y+32);p.fill();}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(type==='lobby'?5:2,type==='lobby'?8:2);t.anisotropy=4;return t;
}
let contactMap;
export function contactShadow(g,x,z,w,d,opacity=.24,y=.405){
 if(!contactMap){
  const c=document.createElement('canvas');c.width=c.height=128;const p=c.getContext('2d');
  const gradient=p.createRadialGradient(64,64,10,64,64,63);gradient.addColorStop(0,'#243e69');gradient.addColorStop(.52,'#243e6988');gradient.addColorStop(1,'#243e6900');p.fillStyle=gradient;p.fillRect(0,0,128,128);contactMap=new T.CanvasTexture(c);
 }
 const o=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:contactMap,color:'#ffffff',transparent:true,opacity,depthWrite:false}));o.rotation.x=-Math.PI/2;o.position.set(x,y,z);g.add(o);return o;
}
export function plant(g,x,z,size=1){
 const p=new T.Group();p.position.set(x,0,z);p.scale.setScalar(size);cylinder(p,0,.3,0,.36,.6,M.ivory,.28);cylinder(p,0,.61,0,.29,.05,mat('#5c4937'));
 for(let i=0;i<5;i++){const a=i*2.4,o=sphere(p,Math.sin(a)*.24,1.06+(i%2)*.25,Math.cos(a)*.24,.29,mat(i%2?'#349b67':'#61bb76'),[.55,1.6,.6]);o.rotation.z=Math.sin(a)*.5;}
 g.add(p);return p;
}
export function palm(g,x,z,scale=1,rotation=0){
 const p=new T.Group();p.position.set(x,-.2,z);p.scale.setScalar(scale);p.rotation.y=rotation;
 for(let i=0;i<7;i++){const trunk=cylinder(p,Math.sin(i*.14)*.55,i*.53+.2,0,.21-i*.015,.57,mat(i%2?'#bc966b':'#ac8054'));trunk.rotation.z=-.12;}
 const leaves=new T.Group();leaves.position.set(.5,3.75,0);p.add(leaves);
 for(let j=0;j<8;j++){const a=j*Math.PI/4,pos=[],idx=[];for(let i=0;i<=9;i++){const t=i/9,l=t*3.3,w=Math.sin(t*Math.PI)*.55,y=.55*Math.sin(t*Math.PI)-t*t*1.1;pos.push(l,y,-w,l,y+.05,w);if(i<9){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setIndex(idx);geometry.computeVertexNormals();const m=mat(j%2?'#1c9b67':'#54b873');m.side=T.DoubleSide;const leaf=new T.Mesh(geometry,m);leaf.rotation.y=a;leaf.castShadow=true;leaves.add(leaf);
 }
 for(let i=0;i<3;i++)sphere(p,.45+Math.sin(i*2)*.23,3.55,Math.cos(i*2)*.23,.19,mat('#94714d'));
 batchSurfaces(leaves);leaves.userData.preserve=true;
 g.add(p);return {root:p,leaves};
}
export function cashPile(){const g=new T.Group();for(let i=0;i<7;i++){const b=box(g,(i%2)*.18,.14+Math.floor(i/2)*.11,((i*3)%2)*.15,.65,.1,.34,mat('#87e431'),.03);b.rotation.y=(i%3-.8)*.17;box(g,(i%2)*.18,.2+Math.floor(i/2)*.11,((i*3)%2)*.15,.12,.015,.34,M.ivory,.006);}batch(g);return g;}
export function fabricTexture(tier=1){
 const c=document.createElement('canvas');c.width=c.height=512;const p=c.getContext('2d');p.fillStyle='#ffffff';p.fillRect(0,0,512,512);
 p.fillStyle='#b9d7fc';p.fillRect(0,0,512,56);p.fillStyle='#d5e8ff';p.fillRect(0,56,512,48);
 p.strokeStyle='#d0e3fb';p.lineWidth=3;
 for(let y=132;y<480;y+=72){p.beginPath();p.moveTo(20,y);p.lineTo(492,y);p.stroke();}
 if(tier>=2){p.lineWidth=8;p.strokeStyle=tier===3?'#fce2a4':'#edf6ff';p.strokeRect(16,16,480,480);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
export function rippleTexture(){const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d');p.fillStyle='#7bdef0';p.fillRect(0,0,256,256);for(let y=-20;y<290;y+=27){p.beginPath();for(let x=0;x<=256;x+=4){const yy=y+Math.sin(x*.05+y*.3)*7;x?p.lineTo(x,yy):p.moveTo(x,yy);}p.strokeStyle=y%2?'#d3fdff88':'#45bddb55';p.lineWidth=2;p.stroke();}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.repeat.set(2,2);return t;}
