import * as THREE from './vendor/three.module.js';
import {SUITS} from './starpath-rules.mjs';

// Combat is deliberately below the creatures' health bars. There are no lights,
// shadows, postprocessing flashes or screen-space overlays in this layer.
export const COMBAT_VFX_LIMITS=Object.freeze({effects:48,meshes:256});
const EVOLUTION_EVENTS=new Set(['evoPulse','evoFragment','evoShockwave','evoBeam','evoOrb','evoArc','evoEnd']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const point=(x,y,z)=>new THREE.Vector3(finite(x),y,finite(z));
const Y_AXIS=new THREE.Vector3(0,1,0);

// A low, solid crescent, authored once. Scaling it opens a real forward-facing
// fan instead of stretching a full circular explosion or drawing a thin line.
function crescentGeometry(inner=.90,outer=1,height=.10){
 const positions=[],indices=[],segments=28;
 for(let i=0;i<=segments;i++){
  const a=-.6+i/segments*1.2;
  for(const y of [0,height])for(const r of [inner,outer])positions.push(Math.sin(a)*r,y,Math.cos(a)*r);
 }
 for(let i=0;i<segments;i++){
  const a=i*4,b=a+4;
  indices.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);
 }
 indices.push(0,1,2,1,3,2);
 const a=segments*4;indices.push(a,a+2,a+1,a+1,a+2,a+3);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function createCombatEvolutionVfx({scene,maxEffects=COMBAT_VFX_LIMITS.effects,maxMeshes=COMBAT_VFX_LIMITS.meshes}={}){
 if(!scene?.add)throw new TypeError('Combat evolution VFX needs a THREE scene');
 const layer=new THREE.Group();layer.name='combat-evolution-vfx';scene.add(layer);
 const geometries={ball:new THREE.SphereGeometry(1,12,8),ring:new THREE.TorusGeometry(1,.085,5,28),tube:new THREE.CylinderGeometry(1,1,1,8),fin:new THREE.ConeGeometry(1,1,4),crescent:crescentGeometry(),fan:crescentGeometry(.18,1,.018)};
 const materials=new Map(),active=[];
 const limits={effects:clamp(Math.floor(finite(maxEffects,48)),1,48),meshes:clamp(Math.floor(finite(maxMeshes,256)),16,256)};
 const counters={created:0,dropped:0,peakActive:0,peakMeshes:0};
 let meshes=0,disposed=false;

 function palette(e){
  const style=clamp(Math.floor(finite(e.style)),0,SUITS.length-1),suit=SUITS[style];
  // Even the pearl/gold suits keep their own suit color; phase changes geometry
  // and scale rather than replacing everyone with the same turret palette.
  return {style,phase:clamp(Math.floor(finite(e.phase,1)),1,3),suit};
 }
 function material(p,role){
  const key=`${p.style}:${role}`;if(materials.has(key))return materials.get(key);
  const color=role==='core'?p.suit.bullet:p.suit.color;
  let m;
  if(role==='body')m=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.58,roughness:.28,metalness:.18});
  else m=new THREE.MeshBasicMaterial({color,transparent:role!=='core',opacity:role==='soft'?.14:role==='halo'?.44:role==='arc'?.66:1,depthWrite:role==='core',side:THREE.DoubleSide});
  m.name=`evolution-${key}`;materials.set(key,m);return m;
 }
 function mesh(parent,shape,p,role='body',name=shape){
  const m=new THREE.Mesh(geometries[shape],material(p,role));m.name=name;m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;
 }
 function group(type,e,p){
  const g=new THREE.Group();g.name=type;g.userData={combatEvolution:true,type,phase:p.phase,weapon:e.weapon,owner:e.owner,lifeId:e.lifeId??e.id};return g;
 }
 function remove(record,evicted=false){
  const i=active.indexOf(record);if(i<0)return;
  record.g.removeFromParent();active.splice(i,1);meshes-=record.meshes;if(evicted)counters.dropped++;
 }
 function add(record){
  record.meshes=0;record.g.traverse(o=>{if(o.isMesh)record.meshes++});
  while(active.length>=limits.effects||meshes+record.meshes>limits.meshes){
   // Prefer retaining the long-lived beam/orb which explains ongoing damage.
   const old=active.find(r=>!r.sustained)||active[0];if(!old)break;remove(old,true);
  }
  record.age=0;layer.add(record.g);active.push(record);meshes+=record.meshes;counters.created++;
  counters.peakActive=Math.max(counters.peakActive,active.length);counters.peakMeshes=Math.max(counters.peakMeshes,meshes);
  record.animate(0,null);return record;
 }
 function duration(e,fallback,max=3){return clamp(finite(e.duration,fallback),.06,max)}
 function source(e,state,y=1.2,follow=false){
  const owner=follow?state?.players?.find(p=>p.id===(e.owner??e.playerId)):null;
  return point((owner?.x??e.sx)-(e.dz||0)*(e.lane||0),y,(owner?.z??e.sz)+(e.dx||0)*(e.lane||0));
 }
 function direction(e){
  const d=point(finite(e.dx,e.x-e.sx),0,finite(e.dz,e.z-e.sz));if(d.lengthSq()<.00001)d.set(0,0,-1);return d.normalize();
 }
 function connect(m,a,b,radius){
  const delta=b.clone().sub(a),length=delta.length();m.visible=length>.0001;
  if(!m.visible)return;m.position.copy(a).addScaledVector(delta,.5);m.quaternion.setFromUnitVectors(Y_AXIS,delta.divideScalar(length));m.scale.set(radius,length,radius);
 }
 const fade=(age,total,tail=.18)=>clamp((total-age)/tail,0,1);

 function pulse(e,p,fragment=false){
  const type=fragment?'evoFragment':'evoPulse',g=group(type,e,p),head=new THREE.Group();g.add(head);
  const radius=(fragment?.105:.235)+(fragment?.012:.035)*(p.phase-1),travel=duration(e,fragment?.2:.18),delay=fragment?.18:0,total=delay+travel+(fragment?.045:.12);
  const core=mesh(head,'ball',p,'body','energy-core');core.scale.set(radius,radius*.84,radius*1.48);
  const center=mesh(head,'ball',p,'core','bright-center');center.scale.set(radius*.53,radius*.50,radius*1.08);center.position.z=radius*.55;
  const halo=mesh(head,'ring',p,'halo','flight-halo');halo.scale.setScalar(radius*1.38);halo.position.z=-radius*.25;
  const trail=mesh(g,'tube',p,'halo','volumetric-trail');
  const fins=[];
  for(let i=0;i<(fragment?0:p.phase);i++){
   const m=mesh(head,'ring',p,'halo','pulse-orbit');m.scale.setScalar(radius*(1.65+i*.28));m.rotation.y=Math.PI/2;m.rotation.z=i*Math.PI/2;fins.push(m);
  }
  const a=source(e,null,fragment?.94:1.2),b=point(e.x,.94,e.z),d=b.clone().sub(a).normalize(),tailPoint=new THREE.Vector3();
  return add({g,ttl:total,e,animate(age){
   g.visible=age>=delay;if(!g.visible)return;
   const t=clamp((age-delay)/travel,0,1),scale=t<1?1:fade(age,total,fragment?.045:.12);
   head.position.lerpVectors(a,b,t);head.lookAt(b.clone().add(d));head.scale.setScalar(scale);
   halo.rotation.z=age*4;fins.forEach((m,i)=>m.rotation.z=age*(i?-3:3)+i*Math.PI/2);
   tailPoint.lerpVectors(a,b,Math.max(0,t-(fragment?.28:.24)));
   connect(trail,tailPoint,head.position,radius*.48*scale);
   if(t>=1){core.scale.set(radius*(1+(age-delay-travel)*2),radius*.65,radius*1.48);halo.scale.setScalar(radius*(1.38+(age-delay-travel)*7))}
  }});
 }

 function shockwave(e,p){
  const g=group('evoShockwave',e,p),dir=direction(e),range=clamp(finite(e.range,Math.hypot(e.x-e.sx,e.z-e.sz)),.5,24),spread=clamp(finite(e.spread,1.18),.3,2.2),total=duration(e,.34);
  g.position.copy(source(e,null,.12));g.rotation.y=Math.atan2(dir.x,dir.z);
  const wave=mesh(g,'crescent',p,'body','solid-forward-crescent'),fan=mesh(g,'fan',p,'soft','forward-pressure-fan');
  const echoes=[];for(let i=1;i<p.phase;i++)echoes.push(mesh(g,'crescent',p,'halo','trailing-crescent'));
  const teeth=[];
  for(let i=0;i<3;i++){
   const a=(i-1)*spread*.33,m=mesh(g,'fin',p,'core','pressure-tooth');m.rotation.x=Math.PI/2;m.rotation.z=-a;teeth.push({m,a});
  }
  const width=Math.tan(spread/2)/Math.tan(.6);
  return add({g,e,ttl:total,animate(age){
   const t=clamp(age/total,0,1),r=.5+(range-.5)*(1-Math.pow(1-t,1.25)),f=fade(age,total,.10);
   wave.scale.set(r*width,.65+p.phase*.22,r);fan.scale.set(r*width,1,r);fan.visible=t<.84;
   wave.scale.y*=f;
   echoes.forEach((echo,i)=>{const rr=Math.max(.2,r-.48-i*.4);echo.scale.set(rr*width,f,rr)});
   for(const {m,a}of teeth){m.position.set(Math.sin(a)*r,.08,Math.cos(a)*r);m.scale.set(.08*f,.27*f,.08*f)}
   // Small ground arrows run along the direction of force; no enemy-size blast.
   g.userData.radius=r;
  }});
 }

 function beam(e,p){
  const g=group('evoBeam',e,p),dir=direction(e),length=clamp(finite(e.range,Math.hypot(e.x-e.sx,e.z-e.sz)),.5,28),total=duration(e,.84),radius=clamp(finite(e.width,.42)*.5,.17,.48);
  g.rotation.y=Math.atan2(dir.x,dir.z);
  const shell=mesh(g,'tube',p,'halo','thick-beam-envelope'),core=mesh(g,'tube',p,'body','sustained-beam-core'),inner=mesh(g,'tube',p,'core','beam-center');
  for(const m of [shell,core,inner]){m.rotation.x=Math.PI/2;m.position.z=length*.5}
  const hoops=[];for(let i=0;i<p.phase+1;i++)hoops.push(mesh(g,'ring',p,'halo','travelling-beam-pulse'));
  const muzzle=mesh(g,'ring',p,'body','beam-muzzle');muzzle.scale.setScalar(radius*1.7);
  return add({g,e,ttl:total,sustained:true,animate(age,state){
   g.position.copy(source(e,state,1.2,e.followOwner!==false));
   const f=fade(age,total,.1),pulse=1+.045*Math.sin(age*Math.PI*2/finite(e.tickInterval,.14));
   shell.scale.set(radius*1.38*pulse*f,length,radius*1.38*pulse*f);core.scale.set(radius*.74*pulse*f,length,radius*.74*pulse*f);inner.scale.set(radius*.29*f,length,radius*.29*f);
   hoops.forEach((m,i)=>{m.position.z=((age*9+i*length/hoops.length)%length);m.scale.setScalar(radius*(1.45+.16*Math.sin(age*7+i))*f)});
   muzzle.rotation.z=age*2;muzzle.scale.setScalar(radius*1.7*f);
  }});
 }

 function charge(e,p){
  const g=group('charge',e,p),dir=direction(e),total=duration(e,.6,1.5);g.rotation.y=Math.atan2(dir.x,dir.z);
  const core=mesh(g,'ball',p,'body','charging-energy-core'),rings=[];
  for(let i=0;i<2;i++){const m=mesh(g,'ring',p,'halo','converging-charge-ring');m.position.z=.55+i*.22;rings.push(m)}
  const collars=[];for(const x of [-1,1]){const m=mesh(g,'tube',p,'body','charge-magnetic-rail');m.rotation.x=Math.PI/2;m.position.set(x*.27,0,.48);m.scale.set(.045,.62,.045);collars.push(m)}
  return add({g,e,ttl:total,animate(age,state){
   g.position.copy(source(e,state,1.2,true));const t=clamp(age/total,0,1),r=.10+.19*t;
   core.position.z=.66;core.scale.set(r,r,r*(1.1+.35*t));rings.forEach((m,i)=>{m.scale.setScalar(.72-.38*t+i*.10);m.rotation.z=(i?-1:1)*age*2.4});
  }});
 }

 function orb(e,p){
  const g=group('evoOrb',e,p),dir=direction(e),a=source(e,null,1.04),speed=clamp(finite(e.speed,3.8),.1,18),total=duration(e,1.6),radius=.27+(p.phase-1)*.04;
  const nucleus=mesh(g,'ball',p,'body','slow-electric-orb');nucleus.scale.setScalar(radius);
  const shell=mesh(g,'ball',p,'soft','electric-orb-envelope');shell.scale.setScalar(radius*1.45);
  const rings=[];for(let i=0;i<2;i++){const m=mesh(g,'ring',p,'halo','orb-electric-equator');m.scale.setScalar(radius*1.35);m.rotation.y=i*Math.PI/2;rings.push(m)}
  const satellites=[];for(let i=1;i<p.phase;i++){const m=mesh(g,'ball',p,'core','orbiting-electric-node');m.scale.setScalar(.065);satellites.push(m)}
  return add({g,e,ttl:total,sustained:true,animate(age){
   // The main orb stays on the rules' exact path. Only its skin deforms; the
   // separate evoArc electric nuclei travel out to enemies and explain hops.
   g.position.copy(a).addScaledVector(dir,speed*age);
   const f=fade(age,total,.12);nucleus.scale.set(radius*(1+.045*Math.sin(age*8))*f,radius*(1-.035*Math.sin(age*8))*f,radius*f);shell.scale.setScalar(radius*1.45*f);
   rings.forEach((m,i)=>{m.rotation.x=age*(i?1.7:-1.3)+i*Math.PI/2;m.rotation.z=age*(i?-1:1);m.scale.setScalar(radius*1.35*f)});
   satellites.forEach((m,i)=>{const angle=age*5+i*Math.PI;m.position.set(Math.cos(angle)*radius*1.65,Math.sin(angle)*radius*.65,Math.sin(angle)*radius*1.65);m.scale.setScalar(.065*f)});
  }});
 }

 function arc(e,p){
  const g=group('evoArc',e,p),a=source(e,null,1.04),b=point(e.x,1.0,e.z),delta=b.clone().sub(a),normal=new THREE.Vector3(-delta.z,0,delta.x).normalize(),total=duration(e,.22),travel=total*.76,segments=6,points=[];
  const seed=finite(e.hop,0)+String(e.lifeId??'').length;
  for(let i=0;i<=segments;i++){
   const t=i/segments,v=a.clone().lerp(b,t);
   if(i>0&&i<segments){v.addScaledVector(normal,(i%2?1:-1)*(.14+.025*p.phase));v.y+=Math.sin(i*2.7+seed)*.12}
   points.push(v);
  }
  const links=[];for(let i=0;i<segments;i++)links.push(mesh(g,'tube',p,'arc','solid-electric-arc'));
  const head=mesh(g,'ball',p,'core','jumping-electric-nucleus'),halo=mesh(g,'ring',p,'halo','jumping-nucleus-halo');
  const moving=new THREE.Vector3(),radius=.095+.014*p.phase;head.scale.setScalar(radius);halo.scale.setScalar(radius*1.7);
  return add({g,e,ttl:total,animate(age){
   const t=clamp(age/travel,0,1),progress=t*segments,index=Math.min(segments-1,Math.floor(progress)),u=t>=1?1:progress-index,f=fade(age,total,total-travel);
   moving.lerpVectors(points[index],points[index+1],u);head.position.copy(moving);halo.position.copy(moving);halo.rotation.y=age*5;head.scale.setScalar(radius*f);halo.scale.setScalar(radius*1.7*f);
   for(let i=0;i<segments;i++){
    const end=i<index?points[i+1]:i===index?moving:points[i];connect(links[i],points[i],end,(.022+.008*p.phase)*f);if(i>index)links[i].visible=false;
   }
  }});
 }

 function handle(e){
  if(disposed||!e)return false;
  const evolvedCharge=e.type==='charge'&&e.weapon==='rail'&&finite(e.phase)>0;
  if(!EVOLUTION_EVENTS.has(e.type)&&!evolvedCharge)return false;
  if(e.type==='evoEnd'){
   const id=e.lifeId??e.id;
   for(const r of [...active])if(r.sustained&&(id!==undefined?r.g.userData.lifeId===id&&(e.owner===undefined||r.e.owner===e.owner):r.e.owner===e.owner&&(!e.weapon||r.e.weapon===e.weapon)))remove(r);
   return true;
  }
  if(![e.sx,e.sz,e.x,e.z].every(Number.isFinite))return true;
  const p=palette(e),id=e.lifeId??e.id;
  if(['evoOrb','evoBeam'].includes(e.type)&&id!==undefined&&active.some(r=>r.sustained&&r.e.type===e.type&&r.g.userData.lifeId===id&&r.e.owner===e.owner))return true;
  if(e.type==='evoBeam')for(const r of [...active])if(r.e.type==='charge'&&r.e.owner===e.owner)remove(r);
  if(e.type==='evoPulse')pulse(e,p);
  else if(e.type==='evoFragment')pulse(e,p,true);
  else if(e.type==='evoShockwave')shockwave(e,p);
  else if(e.type==='evoBeam')beam(e,p);
  else if(e.type==='evoOrb')orb(e,p);
  else if(e.type==='evoArc')arc(e,p);
  else charge(e,p);
  return true;
 }
 function update(dt,state){
  if(disposed)return;
  const step=clamp(finite(dt),0,10);
  for(let i=active.length-1;i>=0;i--){const r=active[i];r.age+=step;if(r.age>=r.ttl)remove(r);else r.animate(r.age,state)}
 }
 function stats(){
  const byType={};for(const r of active)byType[r.g.userData.type]=(byType[r.g.userData.type]||0)+1;
  return {active:active.length,meshes,geometryCount:disposed?0:Object.keys(geometries).length,materialCount:materials.size,limits:{...limits},...counters,disposed,byType};
 }
 function dispose(){
  if(disposed)return;for(const r of [...active])remove(r);layer.removeFromParent();for(const g of Object.values(geometries))g.dispose();for(const m of materials.values())m.dispose();materials.clear();disposed=true;
 }
 return {handle,update,dispose,stats};
}
