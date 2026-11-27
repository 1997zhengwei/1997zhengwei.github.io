import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {createLiveBoss,createBossWarning} from './boss-live-art.mjs';
function releaseTree(g){g.removeFromParent();const gs=new Set(),ms=new Set();g.traverse(o=>{if(o.geometry&&!o.isSprite)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
const helpers={root:new THREE.Group(),releaseTree,
 ring(parent,r,c){const m=new THREE.Mesh(new THREE.RingGeometry(r-.04,r,20),new THREE.MeshBasicMaterial({color:c}));m.rotation.x=-Math.PI/2;parent.add(m);return m;},
 textSprite(){return new THREE.Sprite(new THREE.SpriteMaterial());},
 healthBar(parent,y){const g=new THREE.Group();parent.add(g);g.position.y=y;return {g};}
};
test('live rigs follow authoritative positions and ring removal, and dispose owned model/arena resources exactly once',()=>{
 for(const zone of [8,9,10,11]){
  const root=new THREE.Group(),e={zone,x:4,z:-1270,bossKind:['aegis','thornback','moonwing','starcrown'][zone-8],bossStage:'attack',bossPose:.45,rings:[{hp:100},{hp:100}],pillars:zone===9?[{x:1,z:-1260}]:null};
  const m=createLiveBoss(e,{...helpers,root});m.g.position.set(e.x,0,e.z);m.rig.update(e,.05,1);
  const resources=new Set();root.traverse(o=>{if(o.geometry&&!o.isSprite)resources.add(o.geometry);if(o.material)resources.add(o.material)});const counts=new Map();for(const r of resources)r.addEventListener('dispose',()=>counts.set(r,(counts.get(r)||0)+1));
  if(zone===9)assert.equal(m.g.getObjectByName('body').position.z,0,'server charge movement is not doubled by preview animation');
  if(zone===11){e.rings[0].hp=0;m.rig.update(e,.05,2);const rings=[];m.g.traverse(o=>{if(o.name==='breakable-star-ring')rings.push(o)});assert.equal(rings[0].visible,false);assert.equal(rings[1].visible,true);assert.ok(m.rig.ringHit(1));}
  m.rig.dispose();m.rig.dispose();releaseTree(m.g);assert.equal(root.children.length,0);for(const r of resources)assert.equal(counts.get(r),1,`zone ${zone} ${r.type} ${r.uuid}`);
 }
});
test('rendered lane warning includes both rounded end caps and uses the same width/endpoints as its hit test',()=>{
 const root=new THREE.Group(),h={x:2,z:4,endX:2,endZ:24,width:.7,shape:'lane',label:'FIND GAP'},m=createBossWarning(h,{...helpers,root});root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(m.disk);assert.ok(Math.abs(box.min.x-1.3)<1e-6);assert.ok(Math.abs(box.max.x-2.7)<1e-6);assert.ok(Math.abs(box.max.z-24)<1e-6);
 const full=new THREE.Box3().setFromObject(m.g);assert.ok(full.min.z<=3.31);assert.ok(full.max.z>=24.69);releaseTree(m.g);
});
