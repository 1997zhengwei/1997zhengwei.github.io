import * as T from '../vendor/three.module.js';

// Keep animated groups separate, and batch the stationary parts of each prop.
export function mergeStatic(parent,ignore=new Set()){
 const groups=new Map();
 for(const o of [...parent.children]){
  if(!o.isMesh||ignore.has(o)||Array.isArray(o.material))continue;
  o.updateMatrix();const source=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();source.applyMatrix4(o.matrix);
  if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push({o,g:source});
 }
 for(const [material,parts] of groups){
  if(parts.length<2){parts.forEach(p=>p.g.dispose());continue;}
  const geometry=new T.BufferGeometry(),count=parts.reduce((sum,p)=>sum+p.g.attributes.position.count,0);
  for(const [key,size] of [['position',3],['normal',3],['uv',2]]){
   const array=new Float32Array(count*size);let offset=0;
   for(const {g} of parts){const a=g.attributes[key];if(a)array.set(a.array,offset);offset+=g.attributes.position.count*size;}
   geometry.setAttribute(key,new T.BufferAttribute(array,size));
  }
  const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  for(const {o,g} of parts){parent.remove(o);o.geometry.dispose();g.dispose();}
 }
}
export function disposeTree(root){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const name of ['map','normalMap','roughnessMap','alphaMap'])if(m[name])textures.add(m[name]);}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
