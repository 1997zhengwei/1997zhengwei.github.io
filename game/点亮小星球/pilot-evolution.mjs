import * as THREE from './vendor/three.module.js';
import {SUITS} from './starpath-rules.mjs';

const DEFAULT_PALETTE={ink:'#17334c',cream:'#f1f5ee',mint:'#43daca',gold:'#ffd078',coral:'#f8a1b4',lilac:'#a88bdc'};
const SHELLS=['#eef7f3','#e7f1fc','#f6f1fa','#fff5df','#edfaff'];
const TRIMS=['#36546b','#3c5579','#555078','#66617f','#394b70'];
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));

// Automatic suits change chassis at the chapter's actual milestones. A chosen
// wardrobe item instead keeps the chassis associated with its unlock level.
export function evolvedPilotStage(p={}){
 const level=Number.isFinite(p.level)?p.level:31;
 const style=clamp(Math.floor(Number(p.style)||10),10,SUITS.length-1);
 const chosen=Number.isFinite(p.suit)&&p.suit>=0;
 const chassisLevel=chosen?(SUITS[style]?.level??level):level;
 return chassisLevel>=41?3:chassisLevel>=36?2:1;
}

function bevelGeometry(){
 const geometry=new THREE.BoxGeometry(1,1,1,6,6,6),position=geometry.attributes.position,normal=geometry.attributes.normal;
 const v=new THREE.Vector3(),q=new THREE.Vector3(),n=new THREE.Vector3(),inner=.32,radius=.18;
 for(let i=0;i<position.count;i++){
  v.fromBufferAttribute(position,i);q.set(clamp(v.x,-inner,inner),clamp(v.y,-inner,inner),clamp(v.z,-inner,inner));
  n.copy(v).sub(q).normalize();v.copy(q).addScaledVector(n,radius);
  position.setXYZ(i,v.x,v.y,v.z);normal.setXYZ(i,n.x,n.y,n.z);
 }
 return geometry;
}
function lathe(profile){return new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),24)}
function resources(root){
 const geometry=new Set(),material=new Set();
 root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])material.add(m)});
 return {geometry,material};
}

// All geometry/material caches are per rig. optimizeTree may dispose an original
// geometry after baking it, and the world's releaseTree owns the survivors.
// No chassis, preview or other player can retain a resource from another rig.
export function createEvolvedPilotRig(p={}, {optimizeTree,palette:givenPalette}={}){
 const palette={...DEFAULT_PALETTE,...givenPalette},stage=evolvedPilotStage(p);
 const styleIndex=clamp(Math.floor(Number(p.style)||10),10,SUITS.length-1),style=SUITS[styleIndex],variant=styleIndex-10;
 const shell=SHELLS[variant%5],trim=TRIMS[variant%5],accent=style.color,beam=style.bullet;
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const visualScale=1.32;root.scale.setScalar(visualScale);
 const rig={root,head:null,arms:[],legs:[],eyes:[],visualScale,gun:null,muzzle:null,jets:[],rotors:[],stage,visualBody:body};
 root.name=`aurora-pilot-stage-${stage}`;body.name=stage===1?'heavy-exoskeleton':stage===2?'deployable-mecha':'starcore-mecha';
 root.userData.pilotStage=stage;root.userData.styleIndex=styleIndex;
 const geometry={
  round:bevelGeometry(),ball:new THREE.SphereGeometry(1,24,16),
  cylinder:lathe([[0,-.5],[.83,-.5],[.96,-.43],[1,-.32],[1,.32],[.96,.43],[.83,.5],[0,.5]]),
  muzzle:lathe([[.69,-.5],[.88,-.5],[1,-.35],[1,.35],[.88,.5],[.69,.5],[.69,-.5]]),
  cone:lathe([[0,-.5],[.55,-.44],[1,-.2],[.8,.05],[.38,.32],[0,.5]]),
  torus:new THREE.TorusGeometry(1,.075,8,48),
  bell:lathe([[0,-.5],[.48,-.5],[.6,-.35],[1,.36],[1,.5],[.79,.5],[.44,-.26],[0,-.26]]),
 };
 const finishes={
  shell:{roughness:.25,metalness:.12,clearcoat:.8,clearcoatRoughness:.16},
  rubber:{roughness:.57,metalness:.04,clearcoat:.08},
  metal:{roughness:.24,metalness:.6,clearcoat:.4,clearcoatRoughness:.2},
  lens:{roughness:.12,metalness:.2,clearcoat:1,clearcoatRoughness:.1},
  energy:{roughness:.19,metalness:.08,clearcoat:.7,clearcoatRoughness:.16},
 };
 const materialCache=new Map();
 function material(color,finish='shell',glow=0){
  const key=`${color}/${finish}/${glow}`;
  if(!materialCache.has(key))materialCache.set(key,new THREE.MeshPhysicalMaterial({color,...finishes[finish],emissive:color,emissiveIntensity:glow}));
  return materialCache.get(key);
 }
 function part(g,shape,color,x,y,z,sx=1,sy=sx,sz=sx,finish='shell',glow=0){
  geometry[shape].userData.wasUsed=true;
  const mesh=new THREE.Mesh(geometry[shape],material(color,finish,glow));
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=finish!=='energy';mesh.receiveShadow=true;g.add(mesh);return mesh;
 }
 const plate=(g,c,x,y,z,w,h,d,finish='shell',glow=0)=>part(g,'round',c,x,y,z,w,h,d,finish,glow);
 function joint(g,name,x,y,z){const group=new THREE.Group();group.name=name;group.position.set(x,y,z);g.add(group);return group}
 function ring(g,name,c,x,y,z,r,finish='shell',glow=0){const m=part(g,'torus',c,x,y,z,r,r,r,finish,glow);m.name=name;return m}
 function barrel(g,c,x,y,z,r,length,finish='metal',glow=0){const m=part(g,'cylinder',c,x,y,z,r,length,r,finish,glow);m.rotation.x=Math.PI/2;return m}
 function conduit(g,points,r=.033){
  const path=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),geo=new THREE.TubeGeometry(path,12,r,6,false);
  const m=new THREE.Mesh(geo,material(beam,'energy',.42));m.name='energy-conduit';g.add(m);return m;
 }

 // The pilot's whole body is rebuilt around readable load-bearing parts: torso,
 // hip, shoulder, elbow and knee joints, with no stacked first-chapter wings.
 part(body,'ball',shell,0,1.04,0,stage===3?.59:.54,.61,.37);
 plate(body,trim,0,.68,0,.92,.23,.61,'rubber');
 plate(body,shell,0,.68,.31,.76,.19,.13);
 plate(body,accent,0,1.19,.32,.77,.49,.21);
 plate(body,trim,0,1.44,-.03,.88,.16,.64,'metal');
 for(const side of [-1,1]){
  const hip=part(body,'ball',trim,side*.31,.61,0,.20,.20,.22,'rubber');hip.name='hip-bearing';
  const leg=joint(body,`leg-${side}`,side*.30,.55,0);rig.legs.push(leg);
  plate(leg,shell,0,-.08,0,.37,.40,.36);
  part(leg,'ball',trim,0,-.25,.01,.19,.16,.18,'rubber');
  plate(leg,accent,0,-.23,.19,.32,.27,.16);
  plate(leg,shell,0,-.38,.01,.38,.24,.37);
  plate(leg,trim,0,-.46,.13,.47,.20,.65,'rubber');
  plate(leg,shell,0,-.43,.22,.48,.19,.60);
  plate(leg,beam,0,-.42,.54,.31,.045,.045,'energy',.25);
  const arm=joint(body,`arm-${side}`,side*.70,1.43,0);rig.arms.push(arm);
  part(arm,'ball',trim,0,-.03,0,.24,.23,.24,'rubber');
  plate(arm,shell,side*.07,-.21,0,.40,.49,.43);
  part(arm,'ball',trim,side*.08,-.43,.01,.21,.17,.21,'rubber');
  plate(arm,accent,side*.09,-.51,.01,.46,.36,.49);
  plate(arm,shell,side*.09,-.50,.27,.38,.26,.13);
  part(arm,'ball',trim,side*.10,-.72,.04,.21,.18,.20,'rubber');
  plate(arm,beam,side*.09,-.50,.35,.24,.06,.035,'energy',.25);
 }

 const head=joint(body,'helmet',0,1.97,0);rig.head=head;
 part(head,'ball',shell,0,0,0,.59,.51,.49);
 part(head,'ball',accent,0,.005,.382,.508,.371,.158);
 part(head,'ball',palette.ink,0,.025,.438,.455,.308,.132,'lens');
 plate(head,shell,0,-.28,.35,.66,.11,.30);
 part(head,'ball','#faffff',-.24,.20,.526,.11,.027,.014,'lens');
 for(const side of [-1,1]){
  const eye=joint(head,`eye-${side}`,side*.155,.07,.555);rig.eyes.push(eye);
  part(eye,'ball','#e8ffff',0,0,0,.074,.092,.032,'energy',.12);
  part(eye,'ball',palette.ink,side*.008,-.009,.028,.035,.050,.014,'lens');
  part(head,'ball',palette.coral,side*.30,-.085,.536,.056,.025,.017);
  part(head,'ball',trim,side*.565,-.015,0,.105,.19,.22,'metal');
  part(head,'ball',beam,side*.615,-.01,.02,.055,.10,.12,'energy',.22);
 }
 const smileGeo=new THREE.TorusGeometry(.10,.014,6,16,Math.PI),smile=new THREE.Mesh(smileGeo,material('#dffff6','energy',.05));
 smile.position.set(0,-.10,.569);smile.rotation.z=Math.PI;head.add(smile);
 plate(head,accent,0,.47,.02,.38,.10,.49);
 if(variant>=5)for(let j=0;j<variant-4;j++)plate(head,beam,(j-(variant-5)/2)*.12,.66,-.15,.06,.16,.10,'energy',.2);
 for(let i=0;i<1+variant%3;i++)plate(head,palette.gold,(i-(variant%3)/2)*.13,.535,.02,.075,.05,.28,'metal');

 const pack=joint(body,'reactor-pack',0,1.05,-.42);
 plate(pack,trim,0,0,0,.83,.94,.43,'metal');
 plate(pack,shell,0,.04,-.24,.68,.75,.17);
 plate(pack,beam,0,.07,-.34,.46,.10,.035,'energy',.35);
 const oxygen=clamp(Number(p.modules?.oxygen)||0,0,8);
 for(const side of [-1,1]){
  part(pack,'cylinder',shell,side*.40,-.02,-.04,.13,.68+oxygen*.016,.13);
  part(pack,'cylinder',accent,side*.40,-.27,-.04,.145,.15,.145);
 }
 if(p.modules?.armor>0)plate(body,shell,0,.93,.44,.61,.20,.11);

 const shoulderJoints=[],wings=[];
 if(stage===1){
  // A grounded, deliberately chunky frame: large shoulder cups and broad shins.
  for(const side of [-1,1]){
   const shoulder=joint(body,`heavy-shoulder-${side}`,side*.79,1.49,-.02);
   part(shoulder,'ball',accent,0,0,0,.39,.30,.40);
   plate(shoulder,shell,0,.18,.01,.65,.18,.65);
   plate(shoulder,trim,side*.23,-.10,0,.17,.33,.54,'metal');
   plate(rig.legs[side===1?1:0],shell,side*.18,-.23,-.02,.13,.50,.39);
  }
  plate(body,trim,0,1.14,.45,.49,.35,.12,'metal');
  plate(body,beam,0,1.14,.53,.26,.16,.045,'energy',.32);
  plate(pack,accent,0,-.21,-.35,.69,.22,.11);
 }else if(stage===2){
  // Two independent back vanes open under fire; the shoulder shields deploy too.
  for(const side of [-1,1]){
   const shoulder=joint(body,`deploying-shoulder-${side}`,side*.79,1.49,-.03);shoulder.userData.side=side;shoulderJoints.push(shoulder);
   part(shoulder,'ball',trim,0,0,0,.29,.24,.32,'metal');
   plate(shoulder,shell,side*.09,.08,.01,.67,.30,.66);
   plate(shoulder,accent,side*.25,.02,.10,.28,.33,.46);
   plate(shoulder,beam,side*.25,.10,.35,.20,.07,.035,'energy',.28);
   const wing=joint(body,`deploying-wing-${side}`,side*.66,1.36,-.52);wing.userData.side=side;wings.push(wing);
   plate(wing,trim,side*.16,.37,0,.42,1.13,.24,'metal');
   plate(wing,shell,side*.18,.42,-.12,.39,1.13,.19);
   plate(wing,accent,side*.46,.28,-.01,.32,.85,.22);
   plate(wing,beam,side*.19,.43,-.23,.11,.85,.045,'energy',.34);
   plate(wing,beam,side*.47,.30,-.14,.07,.55,.035,'energy',.30);
   conduit(body,[[side*.24,1.27,.38],[side*.46,1.34,.31],[side*.71,1.39,.16]]);
  }
  part(body,'ball',trim,0,1.14,.44,.26,.26,.09,'metal');
  part(body,'ball',beam,0,1.14,.52,.19,.19,.055,'energy',.44);
 }else{
  // A complete circular reactor replaces rectangular appendages. Its floating
  // chassis stays attached to the same player origin and collision capsule.
  const halo=joint(body,'complete-starcore-halo',0,1.50,-.59);halo.rotation.x=.06;rig.rotors.push(halo);
  ring(halo,'reactor-outer-rim',trim,0,0,0,.99,'metal');
  ring(halo,'reactor-complete-energy-ring',beam,0,0,-.016,.90,'energy',.52);
  for(const side of [-1,1]){
   const shoulder=joint(body,`starcore-shoulder-${side}`,side*.84,1.46,-.01);
   part(shoulder,'ball',shell,0,0,0,.44,.31,.43);
   part(shoulder,'ball',accent,side*.05,.11,-.03,.35,.19,.34);
   part(shoulder,'ball',beam,side*.34,-.01,.04,.07,.12,.19,'energy',.34);
   conduit(body,[[side*.21,1.17,.44],[side*.41,1.35,.38],[side*.77,1.40,.30]],.04);
   const fin=plate(halo,shell,side*.70,-.49,-.02,.34,.67,.20);fin.rotation.z=-side*.60;
   plate(halo,palette.gold,side*.92,0,.01,.19,.30,.17,'metal');
   const leg=rig.legs[side===1?1:0];
   const nozzle=part(leg,'muzzle',trim,0,-.55,.10,.19,.10,.19,'metal');nozzle.name='foot-thruster-nozzle';
   const glow=joint(leg,`foot-thruster-${side}`,0,-.59,.10);
   const flame=part(glow,'cone',beam,0,-.035,0,.125,.18,.125,'energy',.8);flame.name='foot-thruster-flame';flame.rotation.z=Math.PI;rig.jets.push(flame);
   const center=part(glow,'ball','#efffff',0,0,0,.105,.035,.105,'energy',.8);center.name='foot-thruster-core';
  }
  ring(body,'chest-core-metal-ring',palette.gold,0,1.14,.47,.27,'metal');
  ring(body,'chest-complete-energy-ring',beam,0,1.14,.51,.22,'energy',.48);
  part(body,'ball','#ecffff',0,1.14,.52,.15,.15,.085,'energy',.42);
  part(head,'ball',palette.gold,0,.58,-.02,.10,.16,.11,'metal');
 }

 if(p.starfall?.arrived&&p.level>=54){
  for(const side of [-1,1]){const vane=joint(body,'starfall-armor-'+side,side*1.05,1.65,-.40);vane.rotation.z=-side*.38;plate(vane,p.level>=60?palette.gold:accent,0,0,0,.28,1.05,.40,'metal');plate(vane,beam,0,.10,.23,.12,.64,.05,'energy',.22);}
  if(p.level>=60)ring(body,'starfall-corona',beam,0,1.65,-.72,1.32,'energy',.24);
 }
 // Four large tools have different primary solids even at the same weapon rank.
 const gun=joint(rig.arms[1],'weapon',.10,-.54,.30);rig.gun=gun;
 const weapon=['pulse','scatter','rail','arc'].includes(p.weapon)?p.weapon:'pulse';gun.userData.weapon=weapon;
 const rank=clamp(Math.floor(Number(p.weapons?.[weapon])||1),1,5);
 plate(gun,trim,0,-.06,.15,.36,.34,.69,'metal');
 plate(gun,shell,0,.055,.18,.49,.35,.56);
 plate(gun,accent,0,.115,.18,.50,.12,.46);
 plate(gun,trim,0,-.28,.04,.18,.35,.22,'rubber');
 let muzzleZ=1.13;
 if(weapon==='pulse'){
  for(const side of [-1,1]){
   barrel(gun,trim,side*.155,.02,.70,.145,.88);
   barrel(gun,accent,side*.155,.02,.65,.169,.37,'shell');
   const mouth=part(gun,'muzzle',palette.ink,side*.155,.02,1.12,.146,.12,.146,'metal');mouth.rotation.x=Math.PI/2;
   barrel(gun,beam,side*.155,.02,1.15,.100,.028,'energy',.45);
  }
  muzzleZ=1.24;
 }else if(weapon==='scatter'){
  plate(gun,accent,0,.01,.53,.73,.39,.46);
  const bell=part(gun,'bell',shell,0,.02,.86,.43,.66,.25);bell.rotation.x=Math.PI/2;
  const mouth=ring(gun,'wide-scatter-mouth',trim,0,.02,1.19,.39,'metal');mouth.scale.y=.23;
  for(const x of [-.24,0,.24])barrel(gun,beam,x,.02,1.18,.065,.035,'energy',.42);
  muzzleZ=1.28;
 }else if(weapon==='rail'){
  for(const side of [-1,1]){
   plate(gun,trim,side*.19,.01,.91,.16,.24,1.46,'metal');
   plate(gun,shell,side*.24,.04,.91,.13,.20,1.30);
   plate(gun,beam,side*.14,.15,.93,.065,.055,1.29,'energy',.42);
  }
  part(gun,'ball',beam,0,.06,.59,.12,.13,.24,'energy',.45);
  muzzleZ=1.72;
 }else{
  for(const side of [-1,1]){
   const prong=plate(gun,trim,side*.25,.02,.66,.17,.23,.76,'metal');prong.rotation.y=side*.20;
  }
  ring(gun,'electric-ball-outer-ring',shell,0,.02,1.01,.36);
  ring(gun,'electric-ball-energy-ring',beam,0,.02,1.04,.29,'energy',.58);
  const orb=part(gun,'ball','#e5ffff',0,.02,1.035,.19,.19,.17,'energy',.65);orb.name='contained-electric-ball';
  muzzleZ=1.31;
 }
 for(let i=0;i<rank;i++)plate(gun,beam,-.16+i*.08,.31,.19,.045,.04,.18,'energy',.28);
 const flash=joint(gun,'muzzle-flash',0,.02,muzzleZ);
 rig.muzzle=part(flash,'ball','#f0ffff',0,0,0,.18,.18,.24,'energy',.8);rig.muzzle.visible=false;

 let disposed=false;
 rig.disposeVisual=()=>{
  if(disposed)return;disposed=true;root.removeFromParent();
  const live=resources(root);for(const g of live.geometry)g.dispose();for(const m of live.material)m.dispose();
 };
 const gunRest=gun.position.clone();
 rig.updateVisual=(profile={},clock=0,moving=false,firing=false)=>{
  const time=Number.isFinite(clock)?clock:0,awake=!profile.down;
  const open=awake?(firing?1:.14+(moving?.20:0)):0;
  for(const wing of wings){const side=wing.userData.side;wing.rotation.z=-side*(.12+open*.58);wing.rotation.y=side*(.05+open*.18)}
  for(const shoulder of shoulderJoints){const side=shoulder.userData.side;shoulder.rotation.z=-side*open*.16;shoulder.position.y=1.49+open*.045}
  gun.position.copy(gunRest);gun.position.z-=firing?.065:0;gun.rotation.x=firing?-.035:0;
  if(rig.offGun){rig.offGun.position.z=gun.position.z;rig.offGun.rotation.copy(gun.rotation);}
  body.position.y=stage===3&&awake?(.19+.025*Math.sin(time*2.2))/visualScale:0;
  if(stage===3){
   for(let i=0;i<rig.legs.length;i++)rig.legs[i].rotation.x=awake?-.10+Math.sin(time*2.4+i*Math.PI)*(moving?.06:.025):0;
   for(let i=0;i<rig.jets.length;i++){const jet=rig.jets[i];jet.visible=awake;jet.scale.y=(moving?.23:.17)+Math.sin(time*13+i)*.018}
  }
 };
 rig.updateVisual(p,0,false,false);
 if(p.starfall?.arrived&&p.level>=48){const off=gun.clone(true);off.name='twin-weapon';off.position.x=-.10;rig.arms[0].add(off);rig.offGun=off;}
 if(typeof optimizeTree==='function')optimizeTree(root);
 // A geometry not used by this variant was never in optimizeTree's before set.
 // Release those eagerly, while retaining exactly the live baked resources.
 const live=resources(root);for(const g of Object.values(geometry))if(!live.geometry.has(g)){
  // optimizeTree owns used originals that vanished in a merge. Shapes that
  // were never instantiated are our remaining responsibility.
  if(!g.userData.wasUsed)g.dispose();
 }
 for(const m of materialCache.values())if(!live.material.has(m))m.dispose();
 root.updateMatrixWorld(true);rig.localBounds=new THREE.Box3().setFromObject(root).applyMatrix4(root.matrixWorld.clone().invert());
 // Reserve the full deployment and hover range for the camera/HUD bounds.
 if(stage===2){rig.updateVisual({...p,down:false},0,false,true);root.updateMatrixWorld(true);const deployed=new THREE.Box3().setFromObject(root).applyMatrix4(root.matrixWorld.clone().invert());rig.localBounds.union(deployed);rig.updateVisual(p,0,false,false)}
 if(stage===3){rig.localBounds.max.y+=.04/visualScale;rig.localBounds.min.y-=.05/visualScale}
 return rig;
}
