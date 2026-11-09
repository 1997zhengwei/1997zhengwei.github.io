import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createEnemyRig,disposeEnemyRig,THREE} from './starpath-world.mjs';
import {MONSTER_REGIONS,ENEMY_ROLES} from './enemy-art.mjs';
import {ENEMY_GEOMETRIES} from './enemy-surface.mjs';
import {FrontierWorld,ENEMY_ZONE_STATS,ENEMY_ROSTERS,enemyStats,GATE_Z,ZONES} from './starpath-rules.mjs';
import {readFile} from 'node:fs/promises';
const baseline=JSON.parse(await readFile(new URL('./qa/enemy-stats-v0.4.json',import.meta.url),'utf8')).regions;
function geometrySignature(root){const h=createHash('sha256');root.updateMatrixWorld(true);root.traverse(o=>{if(o.isMesh){h.update(Buffer.from(o.geometry.attributes.position.array.buffer));h.update(JSON.stringify(o.matrixWorld.toArray()))}});return h.digest('hex')}
test('regional strength is strictly ascending, and matches the already-shipped combat balance',()=>{
 const now=new FrontierWorld();
 for(let zone=0;zone<6;zone++){if(zone){assert.ok(ENEMY_ZONE_STATS[zone].hp>ENEMY_ZONE_STATS[zone-1].hp);assert.ok(ENEMY_ZONE_STATS[zone].damage>ENEMY_ZONE_STATS[zone-1].damage)}
 for(const type of [...Object.keys(ENEMY_ROLES),'boss']){const camp={x:0,z:GATE_Z-(ZONES[zone].start+ZONES[zone].end)/2,zone},a=baseline[zone][type],b=now.spawnEnemy(camp,type),stats=enemyStats(zone,type);assert.equal(b.hp,a.hp);assert.equal(b.damage,a.damage);assert.equal(b.speed,a.speed);assert.equal(stats.hp,a.hp);assert.equal(stats.damage,a.damage);assert.equal(stats.speed,a.speed)}
 now.arrivals=[];
 }
});
test('the six regional base bodies are genuinely different geometry, not just recolors',()=>{const shapes=new Set();for(let zone=0;zone<6;zone++){const rig=createEnemyRig({zone,type:'scout'});assert.equal(rig.threat,zone+1);shapes.add(geometrySignature(rig.root));disposeEnemyRig(rig)}assert.equal(shapes.size,6)});
test('each role has a distinct silhouette in every region',()=>{for(let zone=0;zone<6;zone++){const shapes=new Set();for(const type of Object.keys(ENEMY_ROLES)){const rig=createEnemyRig({zone,type});assert.equal(rig.type,type);shapes.add(geometrySignature(rig.root));disposeEnemyRig(rig)}assert.equal(shapes.size,7)}});
test('actual roster models fit their existing footprint and a small rendering budget',()=>{const w=new FrontierWorld();for(let zone=0;zone<6;zone++)for(const type of new Set(ENEMY_ROSTERS[zone])){const rig=createEnemyRig({zone,type}),size=rig.bounds.getSize(new THREE.Vector3()),footprint=Math.max(Math.abs(rig.bounds.min.x),Math.abs(rig.bounds.max.x),Math.abs(rig.bounds.min.z),Math.abs(rig.bounds.max.z));assert.ok(footprint<=w.enemyRadius(type)+.30,`${zone}/${type} footprint ${footprint}`);assert.ok(size.y>.65&&size.y<3);let meshes=0,triangles=0;rig.root.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.count>0);assert.ok(o.material);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3}});assert.ok(meshes<=12,`${zone}/${type} has ${meshes} draws`);assert.ok(triangles<=30000,`${zone}/${type} has ${triangles} triangles`);disposeEnemyRig(rig)}});
test('the default six-creature lineup uses roles that actually spawn in those regions',()=>{MONSTER_REGIONS.forEach((m,i)=>assert.ok(ENEMY_ROSTERS[i].includes(m.role)))});
test('a disposed preview can be rebuilt repeatedly without losing shared geometry',()=>{for(let i=0;i<24;i++){const rig=createEnemyRig({zone:i%6,type:MONSTER_REGIONS[i%6].role});assert.ok(rig.bounds.getSize(new THREE.Vector3()).length()>1);disposeEnemyRig(rig)}});

test('rounded armor has continuous unit normals at face seams rather than hard lighting cracks',()=>{
 const g=ENEMY_GEOMETRIES.round,p=g.attributes.position,n=g.attributes.normal,seen=new Map();let seams=0,curved=0;
 for(let i=0;i<p.count;i++){
  const v=new THREE.Vector3().fromBufferAttribute(p,i),normal=new THREE.Vector3().fromBufferAttribute(n,i),key=v.toArray().map(x=>x.toFixed(5)).join(',');
  assert.ok(Math.abs(normal.length()-1)<1e-5);assert.ok(Math.max(...v.toArray().map(Math.abs))<=.50001);
  if(normal.toArray().filter(x=>Math.abs(x)>.05).length>=2)curved++;
  if(seen.has(key)){assert.ok(normal.distanceTo(seen.get(key))<1e-5,`normal seam at ${key}`);seams++}else seen.set(key,normal);
 }
 assert.ok(seams>20);assert.ok(curved>50);
});
test('the actual baked enemy models retain separate coated armor, dark joints and glossy eyes',()=>{
 for(let zone=0;zone<6;zone++){
  const rig=createEnemyRig({zone,type:MONSTER_REGIONS[zone].role}),finishes=[];
  rig.root.traverse(o=>{if(o.isMesh){assert.ok(o.material.isMeshPhysicalMaterial);finishes.push(o.material)}});
  assert.ok(finishes.some(m=>m.clearcoat>=.65&&m.roughness<=.29));
  assert.ok(finishes.some(m=>m.roughness>=.5));
  if(zone<4)assert.ok(finishes.some(m=>m.clearcoat===1&&m.roughness<=.16));
  disposeEnemyRig(rig);
 }
});
