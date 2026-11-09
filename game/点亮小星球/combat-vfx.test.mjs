import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {createCombatEvolutionVfx,COMBAT_VFX_LIMITS} from './combat-vfx.mjs';
import {SUITS} from './starpath-rules.mjs';

const event=(type,extra={})=>({type,owner:'pilot',weapon:{evoPulse:'pulse',evoFragment:'pulse',evoShockwave:'scatter',evoBeam:'rail',evoOrb:'arc',evoArc:'arc',charge:'rail'}[type],phase:2,style:11,level:37,sx:0,sz:0,x:0,z:-8,dx:0,dz:-1,...extra});
function setup(options){const scene=new THREE.Scene(),vfx=createCombatEvolutionVfx({scene,...options}),layer=scene.getObjectByName('combat-evolution-vfx');return {scene,vfx,layer}}
function effect(layer,type){return layer.children.find(g=>g.name===type)}
function close(actual,expected){assert.ok(Math.abs(actual-expected)<1e-6,`${actual} should be ${expected}`)}
function finiteTree(root){root.updateMatrixWorld(true);root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite),`finite transform: ${o.name}`)})}

test('only evolution combat events and evolved rail charge are handled',()=>{
 const {scene,vfx}=setup();
 for(const e of [{type:'shot',kind:'player',weapon:'pulse'},{type:'shot',kind:'gun'},{type:'enemyShot'},{type:'charge',weapon:'rail',phase:0},{type:'charge',weapon:'arc',phase:2},{type:'hit'},{type:'kill'},null])assert.equal(vfx.handle(e),false);
 assert.equal(vfx.handle(event('charge')),true);assert.equal(vfx.stats().active,1);
 vfx.dispose();assert.equal(scene.children.length,0);assert.equal(vfx.handle(event('evoPulse')),false);
});

test('all four evolved weapons have distinct solid 3D structures without line or shadow effects',()=>{
 const {layer,vfx}=setup();
 for(const type of ['evoPulse','evoShockwave','evoBeam','evoOrb'])vfx.handle(event(type));
 assert.equal(layer.children.length,4);
 assert.equal(effect(layer,'evoPulse').getObjectByName('energy-core').geometry.type,'SphereGeometry');
 assert.equal(effect(layer,'evoPulse').getObjectByName('volumetric-trail').geometry.type,'CylinderGeometry');
 const wave=effect(layer,'evoShockwave').getObjectByName('solid-forward-crescent'),positions=wave.geometry.attributes.position;
 let minY=Infinity,maxY=-Infinity,minZ=Infinity;for(let i=0;i<positions.count;i++){minY=Math.min(minY,positions.getY(i));maxY=Math.max(maxY,positions.getY(i));minZ=Math.min(minZ,positions.getZ(i))}
 assert.ok(maxY-minY>.09,'shockwave has solid height');assert.ok(minZ>0,'shockwave opens forward rather than a full circle');
 const beam=effect(layer,'evoBeam').getObjectByName('sustained-beam-core');assert.equal(beam.geometry.type,'CylinderGeometry');assert.ok(beam.scale.x>.1);assert.ok(beam.scale.y>=8);
 assert.equal(effect(layer,'evoOrb').getObjectByName('slow-electric-orb').geometry.type,'SphereGeometry');
 layer.traverse(o=>{assert.equal(!!o.isLine,false);assert.equal(!!o.isLight,false);assert.equal(!!o.castShadow,false);if(o.isMesh)assert.ok(o.geometry.attributes.position.count>0)});
 vfx.dispose();
});

test('phase growth changes silhouettes and retains the selected suit palette',()=>{
 const {layer,vfx}=setup();const sizes=[],counts=[];
 for(let phase=1;phase<=3;phase++){
  vfx.handle(event('evoPulse',{phase,style:12}));const g=layer.children.at(-1);sizes.push(g.getObjectByName('energy-core').scale.x);counts.push(g.children[0].children.length);
  assert.equal(g.getObjectByName('bright-center').material.color.getHexString(),new THREE.Color(SUITS[12].bullet).getHexString());
 }
 assert.ok(sizes[0]<sizes[1]&&sizes[1]<sizes[2]);assert.ok(counts[1]>counts[0]&&counts[2]>counts[1]);
 vfx.dispose();
});

test('pulse travels before impact and fragment launch is delayed to the main hit',()=>{
 const {layer,vfx}=setup();vfx.handle(event('evoPulse',{duration:.18}));vfx.handle(event('evoFragment',{sx:0,sz:-8,x:3,z:-8,duration:.2}));
 const pulse=effect(layer,'evoPulse'),fragment=effect(layer,'evoFragment');assert.equal(fragment.visible,false);
 vfx.update(.09);close(pulse.getObjectByName('energy-core').parent.position.z,-4);assert.equal(fragment.visible,false);
 vfx.update(.08);assert.equal(fragment.visible,false);vfx.update(.02);assert.equal(fragment.visible,true);assert.ok(fragment.getObjectByName('energy-core').parent.position.x>0);
 vfx.update(1);assert.equal(vfx.stats().active,0);assert.equal(layer.children.length,0);vfx.dispose();
});

test('rail beam follows its moving owner while retaining the original aim, and replaces charge',()=>{
 const {layer,vfx}=setup();vfx.handle(event('charge',{duration:.6}));vfx.update(.2,{players:[{id:'pilot',x:2,z:1}]});
 close(effect(layer,'charge').position.x,2);
 vfx.handle(event('evoBeam',{lifeId:'rail-1',followOwner:true,duration:.84}));assert.equal(effect(layer,'charge'),undefined);
 const g=effect(layer,'evoBeam'),yaw=g.rotation.y;
 vfx.update(.3,{players:[{id:'pilot',x:4,z:3}]});close(g.position.x,4);close(g.position.z,3);close(g.position.y,1.2);close(g.rotation.y,yaw);
 const pulse=g.getObjectByName('travelling-beam-pulse');assert.ok(pulse.position.z>0&&pulse.position.z<8);
 assert.equal(vfx.stats().active,1);vfx.dispose();
});

test('main electric orb uses the exact rules path and an independent nucleus visibly jumps out',()=>{
 const {layer,vfx}=setup();vfx.handle(event('evoOrb',{lifeId:'orb-1',duration:1.6,speed:3.8,x:6.08,z:0,dx:1,dz:0}));vfx.update(.5);
 const orb=effect(layer,'evoOrb');close(orb.position.x,1.9);close(orb.position.z,0);
 vfx.handle(event('evoArc',{lifeId:'orb-1',sx:1.9,sz:0,x:1.9,z:-3,duration:.22}));vfx.update(.08);
 const arc=effect(layer,'evoArc'),head=arc.getObjectByName('jumping-electric-nucleus');assert.ok(head.position.z<0&&head.position.z>-3);close(orb.position.x,3.8*.58);
 assert.ok(arc.children.filter(o=>o.name==='solid-electric-arc'&&o.visible).length>0);
 vfx.update(.16);assert.equal(effect(layer,'evoArc'),undefined);assert.ok(effect(layer,'evoOrb'));
 vfx.handle({type:'evoEnd',owner:'pilot',lifeId:'orb-1'});assert.equal(vfx.stats().active,0);vfx.dispose();
});

test('duplicate sustained events do not grow resources and evoEnd targets one life only',()=>{
 const {layer,vfx}=setup();
 for(let i=0;i<40;i++)vfx.handle(event('evoOrb',{lifeId:'one'}));
 vfx.handle(event('evoOrb',{lifeId:'two'}));vfx.handle(event('evoBeam',{lifeId:'three'}));assert.equal(vfx.stats().active,3);
 vfx.handle({type:'evoEnd',owner:'pilot',lifeId:'one'});assert.equal(vfx.stats().active,2);assert.ok(effect(layer,'evoBeam'));
 vfx.handle({type:'evoEnd',owner:'another',lifeId:'two'});assert.equal(vfx.stats().active,2);
 vfx.update(10);assert.equal(layer.children.length,0);vfx.dispose();
});

test('effect and mesh caps remain bounded under sustained eight-player bursts',()=>{
 const {layer,vfx}=setup(),types=['evoPulse','evoFragment','evoShockwave','evoBeam','evoOrb','evoArc'];
 for(let i=0;i<1200;i++){
  vfx.handle(event(types[i%types.length],{owner:`pilot-${i%8}`,phase:i%3+1,style:i%15,lifeId:`life-${i}`}));
  assert.ok(vfx.stats().active<=COMBAT_VFX_LIMITS.effects);assert.ok(vfx.stats().meshes<=COMBAT_VFX_LIMITS.meshes);
 }
 const stats=vfx.stats();assert.ok(stats.dropped>1000);assert.equal(stats.geometryCount,6);assert.ok(stats.materialCount<=15*5);assert.equal(layer.children.length,stats.active);
 finiteTree(layer);vfx.update(100000);assert.equal(vfx.stats().active,0);assert.equal(vfx.stats().meshes,0);assert.equal(layer.children.length,0);vfx.dispose();
});

test('large, invalid and negative deltas produce finite transforms and malformed events cannot poison the scene',()=>{
 const {layer,vfx}=setup();
 assert.equal(vfx.handle(event('evoBeam',{x:Infinity})),true);assert.equal(vfx.stats().active,0);
 for(const type of ['evoPulse','evoFragment','evoShockwave','evoBeam','evoOrb','evoArc','charge'])vfx.handle(event(type,{duration:1e100,range:Infinity,width:NaN,phase:NaN}));
 for(const dt of [NaN,Infinity,-1,.07,.9]){vfx.update(dt);finiteTree(layer)}
 vfx.update(20);assert.equal(vfx.stats().active,0);vfx.dispose();
});

test('dispose releases every owned shared resource exactly once and preserves the caller scene',()=>{
 const {scene,layer,vfx}=setup(),sentinel=new THREE.Group();scene.add(sentinel);
 for(const type of ['evoPulse','evoShockwave','evoBeam','evoOrb','evoArc'])vfx.handle(event(type));
 const resources=new Set();layer.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material)});
 const calls=new Map();for(const r of resources)r.addEventListener('dispose',()=>calls.set(r,(calls.get(r)||0)+1));
 vfx.dispose();vfx.dispose();assert.deepEqual(scene.children,[sentinel]);assert.equal(vfx.stats().geometryCount,0);assert.equal(vfx.stats().materialCount,0);assert.equal(vfx.stats().meshes,0);
 for(const r of resources)assert.equal(calls.get(r),1);
});
