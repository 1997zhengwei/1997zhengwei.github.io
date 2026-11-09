import * as THREE from './vendor/three.module.js';
import {createBossRig} from './boss-art.mjs';
import {BOSS_IDS} from './boss-combat.mjs';

// Keep the approved atelier model intact; the adapter consumes server phases.
export function createLiveBoss(e,{root,healthBar,ring,textSprite,releaseTree}){
 const rig=createBossRig(BOSS_IDS[e.zone]),g=new THREE.Group();root.add(g);g.add(rig.root);
 const bounds=new THREE.Box3().setFromObject(rig.root),height=bounds.max.y;
 const bar=healthBar(g,height+.4,4.1,rig.spec.color),wakeRing=ring(g,3,rig.spec.color,.65,.04);
 const arena=new THREE.Group();root.add(arena);
 const rings=[];rig.root.traverse(o=>{if(o.name==='breakable-star-ring')rings.push(o)});
 const markers=rings.map((r,i)=>{
  const g=new THREE.Group();root.add(g);const outline=ring(g,.65,'#ffda7b',.85,.06);
  const tag=textSprite('RING '+(i+1),{width:1.5,size:25,bg:'#594b29df'});tag.position.y=1.15;g.add(tag);
  return {g,outline,tag};
 });
 let pillarCount=0,disposed=false;const at=new THREE.Vector3();
 return {g,bar,wakeRing,rig:{root:g,ringHit(index){const r=rings[index];if(!r)return null;r.getWorldPosition(at);return {x:at.x,z:at.z};},update(e,dt,time){
  let pose=e.bossPose??null;
  if(e.bossKind==='starcrown'&&e.rings?.every(r=>r.hp<=0)&&!['windup','attack'].includes(e.bossStage))pose=.82;
  rig.update(time,pose);if(e.bossKind==='starcrown'){const core=rig.root.getObjectByName('exposed-starcore');core.visible=!!e.coreOpen;}
  // The server moves the charge. Disable the atelier's illustrative translation.
  if(e.bossKind==='thornback')rig.root.getObjectByName('body').position.z=0;
  rig.root.updateWorldMatrix(true,true);
  rings.forEach((r,i)=>{
   const alive=(e.rings?.[i]?.hp??1)>0;r.visible=alive;
   r.getWorldPosition(at);const m=markers[i];m.g.visible=alive&&g.visible;
   m.g.position.set(at.x,.08,at.z);m.outline.material.opacity=.65+.25*Math.sin(time*4);
   m.tag.material.opacity=.85;
  });
  if(e.pillars&&pillarCount===0){
   for(const p of e.pillars){
    const crystal=new THREE.Mesh(new THREE.ConeGeometry(.85,2.6,6),new THREE.MeshPhysicalMaterial({color:'#8ce5db',roughness:.24,metalness:.15,clearcoat:.9,emissive:'#175f60',emissiveIntensity:.25}));
    crystal.position.set(p.x,1.3,p.z);crystal.castShadow=true;arena.add(crystal);
    const foot=ring(arena,1.2,'#b7ffeb',.6,.055);foot.position.set(p.x,.05,p.z);
   }pillarCount=e.pillars.length;
  }
 },dispose(){if(disposed)return;disposed=true;rig.dispose();for(const m of markers)releaseTree(m.g);releaseTree(arena);}}};
}

export function createBossWarning(h,{root,ring,textSprite}){
 const g=new THREE.Group();g.position.set(h.x,.025,h.z);root.add(g);
 const material=new THREE.MeshBasicMaterial({color:'#ffb47a',opacity:.18,transparent:true,side:THREE.DoubleSide,depthWrite:false});
 let outline,disk;
 if(h.shape==='lane'){
  const len=Math.hypot(h.endX-h.x,h.endZ-h.z);g.rotation.y=Math.atan2(h.endX-h.x,h.endZ-h.z);
  disk=new THREE.Mesh(new THREE.PlaneGeometry(h.width*2,len),material);disk.rotation.x=-Math.PI/2;disk.position.set(0,.06,len/2);g.add(disk);
  const points=[[-h.width,.08,0],[-h.width,.08,len],[h.width,.08,len],[h.width,.08,0]].map(p=>new THREE.Vector3(...p));
  outline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#ff995d',transparent:true,opacity:.95}));g.add(outline);
  for(const z of [0,len]){const cap=new THREE.Mesh(new THREE.CircleGeometry(h.width,24),material);cap.rotation.x=-Math.PI/2;cap.position.set(0,.055,z);g.add(cap);}
 }else{
  outline=ring(g,h.radius,'#ffad78',.95,.09);disk=new THREE.Mesh(new THREE.CircleGeometry(h.radius,48),material);disk.rotation.x=-Math.PI/2;disk.position.y=.06;g.add(disk);
 }
 const tag=textSprite(h.label??'WALK OUT',{width:h.shape==='lane'?4.4:3.4,size:26,bg:'#714536dc'});tag.position.set(0,.85,h.shape==='lane'?Math.min(6,Math.hypot(h.endX-h.x,h.endZ-h.z)/2):0);tag.visible=h.label!=='';g.add(tag);
 return {g,outline,disk,tag};
}
