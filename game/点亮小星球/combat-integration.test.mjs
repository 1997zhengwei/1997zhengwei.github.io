import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE,createPilotRig,disposePilotRig} from './starpath-world.mjs';
import {FrontierWorld,newProfile,XP,publicProfile,stats} from './starpath-rules.mjs';
import {createCombatEvolutionVfx} from './combat-vfx.mjs';
function veteran(weapon='pulse'){
 const p=newProfile('integrated-evolution');p.xp=XP[44];p.homeBase=2;p.cleared=[0,1,2,3,4,5];Object.assign(p.aurora,{arrived:true,radar:true,escort:true,guardian:true});p.weapon=weapon;p.weapons[weapon]=5;p.modules={oxygen:8,armor:8};return p;
}
test('the actual optimized evolved pilot is released once without damaging a second rig',()=>{
 for(const level of [31,36,41,45]){
  const profile=veteran();profile.xp=XP[level-1];const a=createPilotRig(publicProfile(profile)),b=createPilotRig(publicProfile(profile)),scene=new THREE.Scene();scene.add(a.root,b.root);
  const resources=new Set(),counts=new Map();a.root.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])resources.add(m)});
  for(const resource of resources){counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1))}
  disposePilotRig(a);assert.equal(a.root.parent,null);for(const n of counts.values())assert.equal(n,1);
  b.root.traverse(o=>{if(o.geometry){assert.ok(!resources.has(o.geometry));assert.ok(o.geometry.attributes.position.count>0)}if(o.material)assert.ok(!resources.has(o.material))});
  b.updateVisual(publicProfile(profile),2.3,true,true);assert.ok(new THREE.Box3().setFromObject(b.root).getSize(new THREE.Vector3()).length()>2);disposePilotRig(b);
 }
});
test('real evolved weapon events feed the shared visual system and expire cleanly',()=>{
 for(const weapon of ['pulse','scatter','rail','arc']){
  const world=new FrontierWorld(),p=world.enter(veteran(weapon)),scene=new THREE.Scene(),vfx=createCombatEvolutionVfx({scene});p.x=0;p.z=-750;
  world.enemies=Array.from({length:5},(_,i)=>({id:900+i,x:(i-2)*.7,z:-754-Math.abs(i-2)*.25,zone:6,type:'scout',hp:2000,maxHp:2000,contributors:{}}));
  let cursor=world.eventId,evolved=0,oldShots=0;
  for(let i=0;i<45;i++){
   world.time+=.05;p.fire-=.05;world.fireWeapon(p,stats(p.profile));world.updateEvolution();
   for(const e of world.effects)if(e.eventId>cursor){if(e.type.startsWith('evo')){assert.equal(vfx.handle(e),true);evolved++}else if(e.type==='charge')assert.equal(vfx.handle(e),true);else if(e.type==='shot'&&e.kind==='player')oldShots++;cursor=e.eventId}
   vfx.update(.05,{players:[{id:p.id,x:p.x,z:p.z}]});
  }
  assert.ok(evolved>0,weapon);assert.equal(oldShots,0,weapon);assert.ok(vfx.stats().peakActive>0,weapon);vfx.update(10);assert.equal(vfx.stats().active,0);vfx.dispose();assert.equal(scene.children.length,0);
 }
});
