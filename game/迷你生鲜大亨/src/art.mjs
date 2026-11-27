import * as T from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';

const mats=new Map(),geos=new Map();
export function mat(color,roughness=.65,metalness=0){const k=`${color}/${roughness}/${metalness}`;if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color,roughness,metalness}));return mats.get(k);}
export const M={white:mat('#fff9e6'),ivory:mat('#fff9e8'),teal:mat('#54c7b4'),dark:mat('#234352'),wood:mat('#d48229'),gold:mat('#ffca35',.5,.07),coral:mat('#f16d32'),green:mat('#3cb865'),glass:mat('#56bce7',.4,.03),chrome:mat('#d2e9ed',.3,.3)};
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
export function batchColors(g,material=characterMaterial){
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
 if(merged){for(const o of removed)o.removeFromParent();const mesh=new T.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}
 return g;
}
export const inkMaterial=new T.ShaderMaterial({uniforms:{ink:{value:new T.Color('#34584e')},width:{value:.013}},side:T.BackSide,vertexShader:`uniform float width;
void main(){vec4 p=vec4(position+normal*width,1.0);
#ifdef USE_INSTANCING
p=instanceMatrix*p;
#endif
gl_Position=projectionMatrix*modelViewMatrix*p;}`,fragmentShader:`uniform vec3 ink;void main(){gl_FragColor=vec4(ink,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
export function outline(mesh){const edge=new T.Mesh(mesh.geometry,inkMaterial);edge.castShadow=edge.receiveShadow=false;mesh.add(edge);return edge;}
export function textSprite(text,color='#164455',size=1.2,bg=null){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');
 if(bg){c.fillStyle=bg;c.beginPath();c.roundRect(4,4,504,120,24);c.fill();}
 c.fillStyle=color;c.font='800 47px "Microsoft YaHei",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,66,485);
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(size*4,size,1);return s;
}

