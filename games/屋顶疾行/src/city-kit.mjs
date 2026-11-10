import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
T.Cache.enabled=true;
export async function prepareCityKit(){
 const loader=new GLTFLoader(),names=['Brick_Window_Trim','Trim_Window','Cornice_Brick_Center','Building_Medium_2_001','Building_Small_1','Building_Large_2'],materials=new Map(),assets={};
 await Promise.all(names.map(async name=>{const asset=await loader.loadAsync(new URL('../assets/city-kit/'+name+'.gltf',import.meta.url).href);asset.scene.traverse(o=>{if(!o.isMesh)return;const clean=m=>{if(materials.has(m.name))return materials.get(m.name);m.side=T.FrontSide;m.envMapIntensity=.38;if(m.name.includes('FakeInterior'))m.color.set('#33434c');if(m.name==='MI_Glass'){m.opacity=.30;m.roughness=.25;m.depthWrite=false;}if(m.normalMap)m.normalScale.setScalar(.55);if(m.roughnessMap){m.aoMap=m.roughnessMap;m.aoMapIntensity=.8;}materials.set(m.name,m);return m;};o.material=Array.isArray(o.material)?o.material.map(clean):clean(o.material);o.castShadow=true;o.receiveShadow=true;});assets[name]=asset.scene;}));return assets;
}
export const CITY_BACKDROPS=[[-69,-8,1.3],[-72,-54,1.5],[-72,-102,1.1],[103,2,1.2],[106,-44,1.4],[108,-96,1.3],[-28,-142,1.2],[20,-148,1.5],[67,-143,1.3],[-30,47,1.4],[20,48,1.2],[67,50,1.1]];

export function cityBackdrops(map){
 const east=map.free?Math.max(0,...map.roofs.map(r=>r.x+r.w/2-78)):0,north=map.free?Math.max(0,...map.roofs.map(r=>-r.z+r.d/2-110)):0;
 return CITY_BACKDROPS.map(([x,z,scale])=>[x+(x>100?east:0),z-(z< -130?north:0),scale]);
}
export function addCityKit(scene,kit){
 const meshParts=(object)=>{const parts=[];object.updateMatrixWorld(true);object.traverse(o=>{if(o.isMesh)parts.push(o);});return parts;};
 const transforms={Brick_Window_Trim:[],Trim_Window:[],Cornice_Brick_Center:[]},object=new T.Object3D();
 for(const r of scene.map.roofs){const brick=r.material==='brick'||r.id.endsWith('3'),name=brick?'Brick_Window_Trim':'Trim_Window';
  for(const face of[0,1,2,3])for(let row=0;row<2;row++){
   for(let col=0;col<7;col++){
    const offset=(col-3)*4,y=r.y-7.0+row*3.0;
    object.position.set(r.x+(face===1?14.12:face===3?-14.12:face===0?offset:-offset),y,r.z+(face===0?14.12:face===2?-14.12:face===1?-offset:offset));object.rotation.set(0,face*Math.PI/2+Math.PI,0);object.scale.set(2,1,1);object.updateMatrix();transforms[name].push(object.matrix.clone());
   }
  }
 }
 for(const [name,matrices] of Object.entries(transforms)){if(!matrices.length)continue;for(const part of meshParts(kit[name])){const instanced=new T.InstancedMesh(part.geometry,part.material,matrices.length);for(let i=0;i<matrices.length;i++)instanced.setMatrixAt(i,matrices[i].clone().multiply(part.matrixWorld));instanced.castShadow=false;instanced.receiveShadow=true;instanced.computeBoundingSphere();scene.root.add(instanced);}}
 const names=['Building_Medium_2_001','Building_Small_1','Building_Large_2'];
 const backdrops=cityBackdrops(scene.map);
 for(let i=0;i<backdrops.length;i++){
  const [x,z,scale]=backdrops[i],source=kit[names[i%3]],group=source.clone(true),box=new T.Box3().setFromObject(group),center=box.getCenter(new T.Vector3());group.position.set(-center.x,-box.min.y,-center.z);const wrapper=new T.Group();wrapper.add(group);wrapper.scale.setScalar(scale);wrapper.rotation.y=i%4*Math.PI/2;wrapper.position.set(x,0,z);group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});scene.root.add(wrapper);
 }
}
