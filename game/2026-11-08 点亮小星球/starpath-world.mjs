import {towerStats} from './frontier-balance.mjs';
import {createLiveBoss,createBossWarning} from './boss-live-art.mjs';
import {createStarfallArt} from './starfall-art.mjs';
import * as THREE from './vendor/three.module.js';
import {makeAstronaut} from './astronaut.mjs';
import {createEvolvedPilotRig} from './pilot-evolution.mjs';
import {createCombatEvolutionVfx} from './combat-vfx.mjs';
import {buildEnemyRig,MONSTER_REGIONS,ENEMY_ROLES} from './enemy-art.mjs';
import {ENEMY_GEOMETRIES,ENEMY_FINISHES} from './enemy-surface.mjs';
export {MONSTER_REGIONS,ENEMY_ROLES};
import {ART,roundedGeometry,buildStarpathArt} from './starpath-art.mjs';
import {buildAuroraArt,createAuroraGuardian} from './aurora-art.mjs';
import {ZONES,FACILITIES,STATIONS,PADS,EVENTS,OBSTACLES,BOUNDS,GATE_Z,MAX_DEPTH,SPAWN_POINTS,SUITS,WEAPONS,zoneAt,stationCost,depth,inHub,dist,AURORA} from './starpath-rules.mjs';
export {THREE};
const palette={ink:ART.ink,cream:ART.white,mint:ART.teal,gold:ART.gold,coral:ART.coral,lilac:ART.lilac};
const matCache=new Map(),geometry={hex:new THREE.CylinderGeometry(1,1,1,6),round:roundedGeometry(),capsule:new THREE.CapsuleGeometry(.5,.5,4,12),box:new THREE.BoxGeometry(1,1,1),ball:new THREE.SphereGeometry(1,24,16),cylinder:new THREE.CylinderGeometry(1,1,1,12),cone:new THREE.ConeGeometry(1,1,6),crystal:new THREE.OctahedronGeometry(1),rock:new THREE.DodecahedronGeometry(1),orbit:new THREE.TorusGeometry(2.2,.22,4,16)};
function mat(c,glow=0){const key=c+glow;if(!matCache.has(key))matCache.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.52,metalness:.16,emissive:c,emissiveIntensity:glow}));return matCache.get(key)}
function part(parent,shape,c,x,y,z,sx=1,sy=sx,sz=sx,glow=0){const m=new THREE.Mesh(geometry[shape],mat(c,glow));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ring(parent,r,color,opacity=.55,width=.04){const m=new THREE.Mesh(new THREE.RingGeometry(Math.max(0,r-width),r+width,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.07;parent.add(m);return m}
function textSprite(text,{width=4,size=24,bg='#17334ce8',color='#eff8f1'}={}){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
 const c=canvas.getContext('2d'),paddingX=24,paddingY=12,maxWidth=canvas.width-paddingX*2,maxHeight=canvas.height-paddingY*2;
 c.fillStyle=bg;c.beginPath();c.roundRect(0,0,canvas.width,canvas.height,18);c.fill();
 c.textAlign='center';c.textBaseline='alphabetic';
 // Fit measured glyphs, rather than estimating uppercase letters by character
 // count. Wide end letters must stay inside the texture's transparent edge.
 let fontSize=64,metrics;
 const measure=()=>{c.font=`750 ${fontSize}px system-ui`;return c.measureText(String(text))};
 const bounds=m=>({left:m.actualBoundingBoxLeft??m.width/2,right:m.actualBoundingBoxRight??m.width/2,ascent:m.actualBoundingBoxAscent??fontSize*.8,descent:m.actualBoundingBoxDescent??fontSize*.2});
 metrics=measure();let ink=bounds(metrics);
 const ratio=Math.min(1,maxWidth/Math.max(metrics.width,ink.left+ink.right,1),maxHeight/Math.max(ink.ascent+ink.descent,1));
 fontSize=Math.max(1,Math.floor(fontSize*ratio));metrics=measure();ink=bounds(metrics);
 while(fontSize>1&&(Math.max(metrics.width,ink.left+ink.right)>maxWidth||ink.ascent+ink.descent>maxHeight)){fontSize--;metrics=measure();ink=bounds(metrics)}
 c.fillStyle=color;c.fillText(String(text),canvas.width/2+(ink.left-ink.right)/2,(canvas.height+ink.ascent-ink.descent)/2);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false}));sprite.scale.set(width,width*canvas.height/canvas.width,1);sprite.userData.text=text;return sprite;
}
// Merge only static siblings. Animated joints and their original pivots stay intact.
function mergeStatic(group){
 const groups=new Map();
 for(const c of [...group.children])if(c.isMesh&&!c.isSprite&&c.geometry.attributes.position&&!(c.material instanceof Array)){
  c.updateMatrix();const key=c.material.uuid+'-'+Number(c.castShadow)+'-'+Number(c.receiveShadow)+'-'+c.renderOrder;
  if(!groups.has(key))groups.set(key,{material:c.material,list:[]});groups.get(key).list.push(c);
 }
 for(const {material,list}of groups.values()){
  if(list.length<2)continue;const positions=[],normals=[],uvs=[];
  for(const m of list){const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(m.matrix);positions.push(...geo.attributes.position.array);if(geo.attributes.normal)normals.push(...geo.attributes.normal.array);if(geo.attributes.uv)uvs.push(...geo.attributes.uv.array);geo.dispose();group.remove(m);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));if(normals.length===positions.length)geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));if(uvs.length/2===positions.length/3)geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  const m=new THREE.Mesh(geo,material);m.castShadow=list[0].castShadow;m.receiveShadow=list[0].receiveShadow;m.renderOrder=list[0].renderOrder;group.add(m);
 }
}
const sharedGeometry=new Set([...Object.values(geometry),...Object.values(ENEMY_GEOMETRIES)]);
function resourceSets(g){const geos=new Set(),materials=new Set();g.traverse(o=>{if(o.geometry&&!o.isSprite)geos.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(m)});return{geos,materials}}
function optimizeTree(g){const before=resourceSets(g).geos;function mergeChildren(node){for(const c of [...node.children])if(c.isGroup)mergeChildren(c);mergeStatic(node)}mergeChildren(g);const after=resourceSets(g).geos;for(const geo of before)if(!sharedGeometry.has(geo)&&!after.has(geo))geo.dispose()}
function releaseTree(g){if(!g)return;g.removeFromParent();const {geos,materials}=resourceSets(g),cached=new Set(matCache.values()),textures=new Set();for(const geo of geos)if(!sharedGeometry.has(geo))geo.dispose();for(const m of materials)if(!cached.has(m)){if(m.map)textures.add(m.map);m.dispose()}for(const texture of textures)texture.dispose()}

function healthBar(parent,y,width=1.4,color='#ff8298'){const g=new THREE.Group();g.position.y=y;parent.add(g);const geo=new THREE.PlaneGeometry(1,1),bg=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:'#29485b',transparent:true,opacity:.7}));bg.scale.set(width,.11,1);g.add(bg);const fill=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color}));fill.position.z=.01;g.add(fill);return {g,fill,width}}

function enemyPart(parent,shape,c,x,y,z,sx=1,sy=sx,sz=sx,glow=0,finish='shell'){
 const key=`enemy:${finish}:${c}:${glow}`;let material=matCache.get(key);
 if(!material){material=new THREE.MeshPhysicalMaterial({color:c,...ENEMY_FINISHES[finish],emissive:c,emissiveIntensity:glow});matCache.set(key,material)}
 const m=new THREE.Mesh(ENEMY_GEOMETRIES[shape],material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function createEnemyRig(e){return buildEnemyRig(e,{part:enemyPart,optimizeTree})}
export function disposeEnemyRig(rig){releaseTree(rig.root)}
export function disposePilotRig(rig){releaseTree(rig.root)}
export const MECH_FORMS=[
 {name:'Field Scout',shell:'#edf6ed',trim:'#becfd2',armor:'#64b9a8'},
 {name:'Survey Pack',shell:'#d5e6ef',trim:'#466d98',armor:'#4b91c4'},
 {name:'Dune Guard',shell:'#dfcc9b',trim:'#665464',armor:'#bf9256'},
 {name:'Prism Striker',shell:'#bca9dc',trim:'#48527e',armor:'#7968b4'},
 {name:'Aurora Exoframe',shell:'#a1d7d0',trim:'#36566f',armor:'#398f9e'},
 {name:'Polar Wings',shell:'#e0f1ee',trim:'#4e79a0',armor:'#82b9d0'},
 {name:'Relay Halo',shell:'#899bcf',trim:'#34466f',armor:'#5e70b2'},
 {name:'Nova Array',shell:'#d8acc1',trim:'#4a496b',armor:'#b273a7'},
 {name:'Solar Vanguard',shell:'#e6c883',trim:'#364a6a',armor:'#ce9d4f'},
 {name:'Starborn Crown',shell:'#eef5ee',trim:'#293e61',armor:'#e0ba65'},
 {name:'Aurora Pathfinder',shell:'#f4f3ed',trim:'#566a8a',armor:'#78cfc0'},
 {name:'Glacier Bastion',shell:'#d9edf8',trim:'#38557b',armor:'#7bafd9'},
 {name:'Prism Relay',shell:'#dfd5f1',trim:'#535179',armor:'#aa89d1'},
 {name:'Dawn Seraph',shell:'#f4e6ce',trim:'#58617e',armor:'#d6ac6d'},
 {name:'Aegis Sovereign',shell:'#f6f5eb',trim:'#394469',armor:'#a79ad7'},
];
export function createPilotRig(p){
 if(p.level>=31&&(p.style||0)>=10)return createEvolvedPilotRig(p,{part,optimizeTree,palette});
 const index=Math.max(0,Math.min(SUITS.length-1,MECH_FORMS.length-1,p.style||0)),style=SUITS[index],rank=index+1,form=MECH_FORMS[index],family=Math.floor((rank-1)/2),accent=style.color,beam=style.bullet,armor=form.armor;
 const rig=makeAstronaut({shell:form.shell,trim:form.trim,accent});rig.visualScale=Math.min(1.47,1.28+family*.035);rig.root.scale.setScalar(rig.visualScale);rig.jets=[];rig.rotors=[];
 const gear=new THREE.Group();rig.root.add(gear);
 const plate=(g,c,x,y,z,w,h,d,glow=0)=>part(g,'round',c,x,y,z,w,h,d,glow);
 function bakeStaticChildren(group,parent){group.updateMatrix();for(const child of [...group.children])if(child.isMesh){child.updateMatrix();child.matrix.premultiply(group.matrix);child.matrix.decompose(child.position,child.quaternion,child.scale);parent.add(child)}if(!group.children.length)group.removeFromParent()}

 function jet(x,y,z,large=false){
  const joint=new THREE.Group();joint.position.set(x,y,z);gear.add(joint);
  part(joint,'cylinder',palette.ink,0,.17,0,large?.19:.14,.48,large?.19:.14);
  part(joint,'cylinder',armor,0,.39,0,large?.22:.17,.12,large?.22:.17);
  const glowJoint=new THREE.Group();joint.add(glowJoint);const flame=part(glowJoint,'cone',beam,0,-.19,0,large?.12:.085,.32,large?.12:.085,.45);flame.rotation.z=Math.PI;rig.jets.push(flame);bakeStaticChildren(joint,gear);
 }
 function wings(span,outer=false){for(const side of [-1,1]){
  const wing=new THREE.Group();wing.position.set(side*(outer?.80:.61),.89,-.47);wing.rotation.z=-side*.47;gear.add(wing);
  plate(wing,palette.ink,side*.17,.06,0,.46,span,.35);
  plate(wing,outer?palette.cream:armor,side*.17,.09,-.18,.48,span*.93,.11);
  plate(wing,beam,side*.17,.09,-.25,.19,span*.72,.045,.20);
  plate(wing,palette.gold,side*.17,span*.40,-.25,.42,.09,.055);bakeStaticChildren(wing,gear);
 }}
 // The gun grows with the suit silhouette, while weapon mechanics stay unchanged.
 const gun=new THREE.Group();gun.position.set(.13,-.29,.3);gun.scale.setScalar(1+family*.075);rig.arms[1].add(gun);rig.gun=gun;const wr=p.weapons?.[p.weapon]||1,key=p.weapon||'pulse';
 plate(gun,palette.ink,0,0,.20,.25,.25,.72);plate(gun,palette.cream,0,.04,.23,.39,.29,.52);plate(gun,accent,0,.04,.28,.40,.12,.38);plate(gun,palette.ink,0,-.15,.02,.13,.3,.18);
 let muzzleZ=.96;
 if(key==='pulse'){for(let i=0;i<(wr>1?2:1);i++){const x=wr>1?(i-.5)*.19:0;part(gun,'cylinder',palette.ink,x,.02,.7,.08,.43,.08).rotation.x=Math.PI/2;part(gun,'ball',beam,x,.02,.93,.07,.07,.035,.35)}}
 if(key==='scatter'){plate(gun,armor,0,.02,.54,.55,.33,.42);for(const x of [-.18,0,.18]){part(gun,'cylinder',palette.ink,x,.03,.76,.075,.38,.075).rotation.x=Math.PI/2;part(gun,'ball',beam,x,.03,.97,.065,.065,.04,.3)}muzzleZ=1.04}
 if(key==='rail'){for(const side of [-1,1]){plate(gun,palette.ink,side*.17,.02,.85,.11,.16,1.15);plate(gun,beam,side*.17,.12,.85,.065,.04,.94,.2)}part(gun,'crystal',beam,0,.08,.63,.16,.25,.13,.25);muzzleZ=1.44}
 if(key==='arc'){for(const side of [-1,1]){const prong=plate(gun,palette.ink,side*.25,.02,.65,.13,.18,.65);prong.rotation.y=side*.22;part(gun,'ball',beam,side*.3,.03,.98,.13,.14,.11,.3)}part(gun,'ball','#e8fff6',0,.02,.72,.15,.15,.23,.3);muzzleZ=1.1}
 for(let i=0;i<wr;i++)plate(gun,beam,-.12+i*.12,.21,.27,.06,.03,.13,.1);
 const flashJoint=new THREE.Group();gun.add(flashJoint);rig.muzzle=part(flashJoint,'crystal','#edfff6',0,.02,muzzleZ,.13,.16,.21,.5);rig.muzzle.visible=false;
 if(p.modules?.oxygen>0)for(const side of [-1,1]){part(gear,'cylinder',palette.cream,side*.34,.65,-.55,.13,.65+p.modules.oxygen*.035,.13);part(gear,'ball',beam,side*.34,1.02,-.55,.13,.09,.13,.15)}
 if(rank>=2){
  for(const side of [-1,1]){plate(gear,armor,side*.53,.96,-.02,.44,.34,.55);plate(gear,palette.cream,side*.53,1.15,-.02,.40,.07,.48)}
  plate(gear,armor,0,.65,.35,.69,.39,.14);part(gear,'crystal',beam,0,.73,.46,.15,.22,.04,.18);
  plate(gear,armor,0,.77,-.70,.70,.57,.19);plate(gear,beam,0,.82,-.81,.47,.12,.035,.2);
 }
 if(rank>=3){
  for(const side of [-1,1]){plate(rig.head,armor,side*.55,.12,-.08,.17,.38,.49);plate(rig.head,beam,side*.65,.10,.11,.04,.16,.20,.15)}plate(rig.head,palette.gold,0,.5,0,.22,.09,.65);
  for(const leg of rig.legs){plate(leg,armor,0,-.05,.16,.32,.29,.11);plate(leg,palette.cream,0,-.20,.28,.35,.13,.10)}
 }
 if(rank>=4){
  jet(-.40,.36,-.73,true);jet(.40,.36,-.73,true);
  for(const side of [-1,1]){plate(gear,palette.ink,side*.38,.61,-.53,.16,.78,.22);plate(rig.arms[side===1?1:0],armor,0,-.25,.10,.30,.30,.40)}
 }
 if(rank>=5){
  for(const side of [-1,1]){const arm=rig.arms[side===1?1:0];plate(arm,palette.ink,side*.13,-.19,-.04,.14,.47,.26);plate(gear,palette.cream,side*.59,1.08,-.12,.43,.18,.48);part(gear,'cylinder',beam,side*.70,1.04,-.10,.11,.14,.11,.15);plate(gear,armor,side*.36,.32,0,.28,.22,.47)}
  plate(gear,palette.ink,0,.66,.47,.44,.34,.09);part(gear,'crystal',beam,0,.67,.55,.15,.22,.045,.2);
 }
 if(rank>=6&&rank<=10){wings(.91);plate(gear,palette.ink,0,.83,-.84,.64,.80,.14);plate(gear,armor,0,.85,-.93,.52,.66,.12);for(const x of [-.14,.14])plate(gear,beam,x,.86,-1.01,.075,.42,.03,.2)}
 if(rank>=7&&rank<=10){
  const halo=new THREE.Group();halo.position.set(0,1.0,-.99);gear.add(halo);rig.rotors.push(halo);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.68,.055,5,36),mat(palette.ink));halo.add(rim);
  for(let i=0;i<6;i++){const a=i*Math.PI/3,m=plate(halo,i%2?armor:beam,Math.cos(a)*.68,Math.sin(a)*.68,0,.13,.28,.11,i%2?0:.2);m.rotation.z=a-Math.PI/2}
  jet(0,.34,-.87,true);for(const side of [-1,1])plate(rig.head,armor,side*.37,.48,0,.10,.20,.64);
 }
 if(rank>=8&&rank<=10){
  for(const side of [-1,1]){const pod=new THREE.Group();pod.position.set(side*.67,1.12,-.15);gear.add(pod);plate(pod,palette.ink,0,.07,.06,.36,.32,.78);plate(pod,armor,0,.14,.11,.42,.26,.52);part(pod,'ball',beam,0,.12,.49,.13,.12,.04,.25);bakeStaticChildren(pod,gear)}
  plate(gear,palette.gold,0,1.05,.15,.74,.15,.38);plate(rig.head,armor,0,.54,-.14,.74,.12,.31);
 }
 if(rank>=9&&rank<=10){
  wings(1.02,true);jet(-.63,.40,-.58);jet(.63,.40,-.58);
  for(const side of [-1,1]){plate(gear,palette.gold,side*.56,1.19,-.02,.50,.12,.52);plate(rig.head,palette.gold,side*.40,.51,.02,.12,.22,.61)}
  part(gear,'crystal',beam,0,1.0,-1.12,.30,.45,.13,.25);
 }
 if(rank===10){
  const crown=new THREE.Group();crown.position.set(0,1.08,-1.08);gear.add(crown);rig.rotors.push(crown);
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,arm=plate(crown,palette.cream,Math.cos(a)*.42,Math.sin(a)*.42,-.10,.18,.65,.15);arm.rotation.z=a-Math.PI/2;part(crown,'crystal',beam,Math.cos(a)*.75,Math.sin(a)*.75,-.10,.14,.22,.10,.2)}
  for(const side of [-1,1]){plate(gear,palette.cream,side*.72,1.25,-.08,.46,.16,.48);plate(gear,beam,side*.72,1.35,-.08,.30,.05,.40,.15)}
  part(rig.head,'crystal',palette.gold,0,.65,-.03,.12,.22,.12,.12);part(gear,'crystal','#ecfff3',0,.70,.58,.17,.26,.05,.2);
 }
 // Aurora forms start a fresh equipment silhouette, so progression remains
 // readable rather than accumulating every earlier wing and crown at once.
 if(rank>=11){
  plate(gear,form.trim,0,.82,-.72,.82,.80,.24);plate(gear,form.shell,0,.86,-.89,.69,.66,.17);
  for(const side of [-1,1]){plate(rig.head,form.shell,side*.59,.13,-.11,.18,.49,.52);plate(gear,beam,side*.44,.69,.41,.08,.43,.045,.25)}
  part(gear,'crystal',beam,0,.72,.57,.20,.31,.06,.25);
  const span=1.02+(rank-11)*.055;
  for(const side of [-1,1]){
   const exowing=new THREE.Group();exowing.position.set(side*span,1.02,-.62);exowing.rotation.z=-side*.28;gear.add(exowing);
   plate(exowing,form.trim,0,0,0,.42,1.34,.28);plate(exowing,form.shell,0,.04,-.18,.44,1.29,.14);plate(exowing,beam,0,.04,-.27,.12,1.05,.035,.25);
   plate(exowing,armor,0,.62,-.08,.49,.18,.36);jet(side*span,.31,-.64,true);
  }
 }
 if(rank===11){
  for(const side of [-1,1]){const antenna=new THREE.Group();antenna.position.set(side*.68,1.08,-.62);antenna.rotation.z=side*-.16;gear.add(antenna);plate(antenna,form.trim,0,.18,0,.16,.86,.22);plate(antenna,form.shell,0,.55,0,.44,.30,.25);plate(antenna,beam,0,.55,.14,.30,.13,.045,.25);jet(side*.51,.30,-.83,true)}
  plate(rig.head,armor,0,.60,-.05,.61,.13,.43);
 }
 if(rank===12){
  for(const side of [-1,1]){const shield=new THREE.Group();shield.position.set(side*.86,.92,-.1);shield.rotation.z=side*-.20;gear.add(shield);plate(shield,form.trim,0,0,0,.43,1.08,.45);plate(shield,form.shell,0,.05,.20,.48,1.04,.14);plate(shield,beam,0,.06,.29,.13,.75,.045,.18);part(shield,'crystal',beam,0,.65,0,.15,.27,.14,.18);jet(side*.62,.28,-.72,true)}
  plate(rig.head,form.shell,0,.55,-.03,.89,.14,.51);
 }
 if(rank===13){
  const array=new THREE.Group();array.position.set(0,1.03,-.92);gear.add(array);rig.rotors.push(array);
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,leaf=new THREE.Group();leaf.position.set(Math.cos(a)*.71,Math.sin(a)*.71,0);leaf.rotation.z=a-Math.PI/2;array.add(leaf);plate(leaf,form.trim,0,0,0,.24,.72,.18);part(leaf,'crystal',beam,0,.18,-.05,.18,.49,.10,.20)}
  for(const side of [-1,1]){part(rig.head,'crystal',armor,side*.38,.58,-.10,.14,.29,.16);jet(side*.45,.28,-.80,true)}
 }
 if(rank===14){
  for(const side of [-1,1]){const wing=new THREE.Group();wing.position.set(side*.70,1.0,-.6);wing.rotation.z=-side*.43;gear.add(wing);for(let i=0;i<3;i++){plate(wing,form.trim,side*i*.22,.20-i*.09,-i*.11,.20,1.18-i*.13,.23);plate(wing,i%2?armor:form.shell,side*i*.22,.26-i*.09,-.15-i*.11,.22,1.07-i*.13,.11);plate(wing,beam,side*i*.22,.26-i*.09,-.22-i*.11,.075,.83-i*.10,.035,.18)}jet(side*.74,.32,-.51,true)}
  part(rig.head,'crystal',palette.gold,0,.68,-.02,.17,.30,.15,.16);
 }
 if(rank===15){
  const halo=new THREE.Group();halo.position.set(0,1.18,-1.04);gear.add(halo);rig.rotors.push(halo);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.88,.045,5,48),mat(form.trim));halo.add(rim);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,m=part(halo,'crystal',i%2?beam:palette.gold,Math.cos(a)*.89,Math.sin(a)*.89,0,.14,.29,.10,.22);m.rotation.z=a-Math.PI/2}
  for(const side of [-1,1]){plate(gear,form.shell,side*.81,1.23,-.05,.56,.21,.53);plate(gear,beam,side*.81,1.36,-.05,.39,.05,.43,.20);part(rig.head,'crystal',palette.gold,side*.27,.62,-.08,.09,.29,.14,.13);jet(side*.63,.29,-.83,true)}
  part(rig.head,'crystal',beam,0,.76,-.08,.13,.36,.13,.18);
 }
 if(p.modules?.armor>0)plate(gear,armor,0,.60,.39,.53,.32,.08);
 optimizeTree(rig.root);rig.root.updateMatrixWorld(true);rig.localBounds=new THREE.Box3().setFromObject(rig.root).applyMatrix4(rig.root.matrixWorld.clone().invert());return rig;
}

export function createFrontierView(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
 const scene=new THREE.Scene(),sky=document.createElement('canvas');sky.width=16;sky.height=256;const skyCtx=sky.getContext('2d'),gradient=skyCtx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#253b66');gradient.addColorStop(.52,'#6797bf');gradient.addColorStop(1,'#c3dfe0');skyCtx.fillStyle=gradient;skyCtx.fillRect(0,0,16,256);const skyTexture=new THREE.CanvasTexture(sky);skyTexture.colorSpace=THREE.SRGBColorSpace;scene.background=skyTexture;scene.fog=new THREE.Fog('#a5c9d8',42,90);
 const camera=new THREE.PerspectiveCamera(43,1,.1,1800);camera.position.set(0,18,25);camera.lookAt(0,0,2);
 scene.add(new THREE.HemisphereLight('#dcf4f3','#526283',.95));
 const sun=new THREE.DirectionalLight('#fff5df',2.25);sun.position.set(-14,26,8);sun.castShadow=true;
 sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-19,right:19,top:23,bottom:-18,near:.5,far:75});
 sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;sun.shadow.radius=2;scene.add(sun,sun.target);
 // A tiny procedural studio environment gives painted equipment and visors a
 // controlled reflection; there are no remote HDRs or per-frame environment passes.
 const studio=new THREE.Scene();studio.background=new THREE.Color('#799bb3');
 for(const [x,y,z,w,h,d,c]of [[0,14,0,30,.5,30,'#effff7'],[-12,3,1,.5,16,22,'#b2dfeb'],[8,5,-10,12,10,.5,'#ffdeb0']]){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,y,z);studio.add(m);
 }
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.05, .1,60);scene.environment=environment.texture;scene.environmentIntensity=.45;
 studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});pmrem.dispose();
 const root=new THREE.Group();scene.add(root);const combatVfx=createCombatEvolutionVfx({scene});
 const {facilityTags,stationMeshes,pads,eventMeshes,arches,guideMarker,guideRing,guideArrow,animations}=buildStarpathArt({root,part,ring,textSprite,healthBar,mat,geometry,optimizeTree,mergeStatic});
 const auroraArt=buildAuroraArt({root,part,ring,textSprite,mat,optimizeTree});
 const nodeMeshes=new Map();
 function nodeMesh(n){
  const g=new THREE.Group();g.position.set(n.x,0,n.z);root.add(g);
  part(g,'rock',n.type==='metal'?'#365f78':'#537795',0,.15,0,.72,.24,.66);
  if(n.type==='metal'){
   for(let k=-1;k<=1;k++){const m=part(g,'round',k?'#98b7c4':'#f0bd6d',k*.25,.34+Math.abs(k)*.03,k*.08,.35,.28,.32);m.rotation.y=k*.4;}
   part(g,'round','#fff0be',0,.53,0,.22,.045,.19,.16);
  }else for(let k=-1;k<=1;k++){const c=ART.zones[n.zone]?.ore||ART.teal;part(g,'crystal',k?c:'#dbfff1',k*.28,.56+k*.07,0,.22,.64+Math.abs(k)*.1,.24,.1);}
  const r=ring(g,.86,n.type==='metal'?ART.gold:'#9af6dd',.65,.028);mergeStatic(g);return{g,r};
 }
 const starfallArt=createStarfallArt({scene,root,part,ring,textSprite,optimizeTree,releaseTree});
 const pilots=new Map(),enemyMeshes=new Map(),towerMeshes=new Map(),hazards=new Map(),arrivalMeshes=new Map(),shots=[],bursts=[];let meId=null,current=null,clock=0,overview=false,cameraDistance=18.6,shake=0;
 function pilotKey(p){return `${p.style}-${p.weapon}-${p.weapons?.[p.weapon]}-${p.modules?.armor}-${p.modules?.oxygen}-${p.name}-${p.level}`}
 function createPilot(p){const rig=createPilotRig(p),accent=(SUITS[p.style||0]||SUITS[0]).color,tag=textSprite(`${p.name} · LV ${p.level}`,{width:2.8,size:27});tag.position.y=2.9;rig.root.add(tag);const floor=ring(rig.root,.66,accent,.85,.035);scene.add(rig.root);return{rig,tag,floor,key:pilotKey(p),lastX:p.x,lastZ:p.z,step:0};}
 function threatBadge(tier){
  const key='enemy-threat-'+tier;let material=matCache.get(key);
  if(!material){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#192b42';ctx.beginPath();ctx.roundRect(3,3,58,58,13);ctx.fill();ctx.strokeStyle=MONSTER_REGIONS[tier-1].bar;ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#fff4e1';ctx.font='800 43px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(tier),32,34);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;material=new THREE.SpriteMaterial({map:texture,depthTest:false});matCache.set(key,material)}
  const sprite=new THREE.Sprite(material);sprite.scale.set(.49,.49,1);return sprite;
 }
 function enemyMesh(e){
  if(e.type!=='boss'){
   const rig=createEnemyRig(e),g=rig.root;root.add(g);g.position.set(e.x,0,e.z);
   const bar=healthBar(g,rig.height+.25,1.45,rig.barColor),badge=threatBadge(rig.threat);badge.position.set(-bar.width/2-.28,0,.04);bar.g.add(badge);
   const wakeRing=ring(g,e.type==='brute'?1.45:1.08,'#c19aff',.65,.04);return{g,bar,wakeRing,rig};
  }
  if(e.type==='boss'&&e.zone>=8){return createLiveBoss(e,{root,healthBar,ring,textSprite,releaseTree});}
  if(e.auroraGuardian||e.zone>=6){const rig=createAuroraGuardian({part:enemyPart,optimizeTree}),g=rig.root;root.add(g);g.position.set(e.x,0,e.z);const bar=healthBar(g,rig.height+.25,3.6,'#c6a8f4'),wakeRing=ring(g,2.6,'#c19aff',.65,.04);return{g,rig,bar,wakeRing};}
  const g=new THREE.Group();root.add(g);const boss=e.type==='boss',size=boss?2.05:e.type==='brute'?1.05:e.type==='runner'?.57:.72,c=['#d5688a','#c47a57','#9554ae','#6997c6','#7b729d','#b54a88'][e.zone],ore=ART.zones[e.zone].ore;
  part(g,'rock',c,0,size*.72,0,size,size*.72,size);for(const side of [-1,1]){part(g,'ball','#fff1cf',side*size*.32,size*.9,size*.72,size*.17);part(g,'ball',palette.ink,side*size*.32,size*.91,size*.88,size*.075);for(let j=-1;j<=1;j++){const leg=part(g,'round','#485f7a',side*size*.82,.18,j*size*.5,size*.4,.14,.16);leg.rotation.z=side*.2}}
  if(e.type==='brute'||boss&&e.zone===0)for(let i=0;i<4;i++){const a=i*1.57;part(g,'cone','#ffcf9d',Math.cos(a)*size*.7,size*1.2,Math.sin(a)*size*.7,size*.23,size*.9,size*.23)}
  if(e.type==='spitter')part(g,'ball','#c7e4af',0,size*1.4,0,.4,.5,.4);
  if(e.type==='support'){part(g,'crystal','#f2addf',0,1.4,0,.3,.65,.3,.15);for(const side of [-1,1])part(g,'ball','#b7f5de',side*.65,1.2,0,.22,.18,.22,.1)}
  if(e.type==='shield'){part(g,'round','#413e73',0,.95,.75,1.3,1.25,.25);part(g,'round','#f2a8d5',0,1,.91,.9,.16,.03,.25);part(g,'crystal','#f1ce9e',0,1.45,.82,.14,.25,.08)}
  if(e.type==='artillery'){const cannon=part(g,'cylinder',palette.ink,0,1.2,-.25,.24,1.2,.24);cannon.rotation.x=-.55;part(g,'round','#d3a9c8',0,.9,-.48,.85,.5,.7);part(g,'ball','#ff9ead',0,1.75,-.55,.18,.13,.18,.2)}
  if(boss){if(e.zone===1)for(const side of [-1,1]){const horn=part(g,'cone',ore,side*1.5,1.8,1.8,.5,2,.5);horn.rotation.x=Math.PI*.4;part(g,'round',palette.ink,side*1.3,1,0,1.1,1.25,2.6)}
   if(e.zone===2)for(let i=0;i<7;i++){const a=i*Math.PI*2/7,m=part(g,'crystal',i%2?ore:'#eab6ec',Math.sin(a)*1.5,2.2,Math.cos(a)*1.5,.4,1.8,.45,.12);m.rotation.z=Math.sin(a)*.35}
   if(e.zone===3)for(let i=0;i<5;i++)part(g,'crystal',i%2?'#e2ffff':ore,(i-2)*.65,2.4+Math.abs(i-2)*.15,0,.35,2.0,.5,.1);
   if(e.zone===4){part(g,'round',palette.ink,0,2.1,0,3.1,.8,2);for(const side of [-1,1]){const barrel=part(g,'cylinder',ore,side*.9,2.6,.8,.28,1.8,.28);barrel.rotation.x=Math.PI/3;part(g,'round','#ccdade',side*1.5,1.6,-.4,.8,1.4,2.2)}}
   if(e.zone===5){for(let i=0;i<6;i++){const a=i*Math.PI/3;part(g,'crystal',i%2?ore:'#fff0b9',Math.cos(a)*1.7,2.7,Math.sin(a)*1.7,.35,1.6,.35,.16)}part(g,'ball','#fee5fa',0,2.2,0,.65,.65,.65,.15)}
  }
  mergeStatic(g);const bar=healthBar(g,boss?4.7:size*1.8+.6,boss?3.6:1.5);g.position.set(e.x,0,e.z);const wakeRing=ring(g,size+.3,'#c19aff',.65,.04);return{g,bar,wakeRing};
 }
 function towerMesh(t){
  const g=new THREE.Group();g.position.set(t.x,0,t.z);root.add(g);
  part(g,'hex',palette.ink,0,.18,0,.9,.32,.9);part(g,'hex',palette.cream,0,.36,0,.8,.13,.8);
  part(g,'cylinder',palette.ink,0,.84,0,.35,.85,.35);
  part(g,'round',palette.cream,0,.98,0,.65,.64,.58);
  part(g,'round',palette.mint,0,.97,.31,.15,.4,.04,.15);
  const turret=new THREE.Group();turret.position.y=1.51;turret.scale.setScalar(1+(t.level-1)*.085);g.add(turret);
  const c={gun:palette.gold,frost:'#74c8f2',mortar:palette.coral}[t.type];
  part(turret,'round',c,0,0,0,.95,.53,.82);
  part(turret,'round',palette.cream,0,.3,-.08,.78,.12,.64);
  if(t.type==='gun')for(const side of [-1,1]){
   part(turret,'round',palette.ink,side*.22,.02,.6,.15,.18,.92);
   part(turret,'round',palette.cream,side*.22,.02,.54,.23,.25,.42);
   part(turret,'ball',palette.gold,side*.22,.02,1.08,.075,.075,.04,.4);
  }else if(t.type==='frost'){
   part(turret,'crystal','#c3f7ff',0,.28,.4,.30,.70,.30,.16);
   for(const side of [-1,1]){const fork=part(turret,'round',palette.ink,side*.35,.14,.45,.14,.17,.76);fork.rotation.z=side*.2;part(turret,'round','#84ddff',side*.35,.24,.45,.08,.07,.60,.2);}
  }else{
   const barrel=new THREE.Group();barrel.rotation.x=-.45;turret.add(barrel);
   part(barrel,'cylinder',palette.ink,0,.24,.59,.23,.90,.23).rotation.x=Math.PI/2;
   part(barrel,'round',palette.coral,0,.24,.38,.65,.48,.6);
   part(barrel,'ball',palette.gold,0,.24,1.02,.17,.17,.04,.15);
  }
  const tier=t.tier||1;if(tier>=2){for(const side of [-1,1]){part(g,'round','#eaf6ef',side*.7,.72,0,.28,1.05,.9);part(g,'round','#80d9cf',side*.83,1.01,.1,.08,.6,.44,.15);}const halo=ring(g,1.05,'#8ce9da',.7,.045);halo.position.y=.44;}if(tier>=3){for(const side of [-1,1]){part(turret,'round','#f3e1ae',side*.58,.18,-.35,.18,.7,.64);part(turret,'crystal','#b9fff0',side*.59,.63,-.3,.10,.38,.10,.22);}const crown=ring(turret,.65,'#e5cc84',.85,.04);crown.rotation.x=0;crown.position.set(0,.1,-.5);}
  for(let i=0;i<t.level;i++)part(g,'round',c,-.22+i*.22,.43,.71,.12,.06,.05,.1);
  optimizeTree(g);const bar=healthBar(g,2.6,1.4,palette.mint),tag=textSprite(`MK ${['I','II','III'][(t.tier||1)-1]} · ${t.level}`,{width:1.5,size:27});tag.position.y=3;g.add(tag);
  return{g,turret,bar,tag,level:t.level,tier:t.tier||1};
 }
 function remove(map,id){const m=map.get(id);if(!m)return;m.rig?.dispose?.();releaseTree(m.rig?.root||m.g);map.delete(id)}
 const barParentRotation=new THREE.Quaternion();function setBar(bar,ratio){bar.g.parent.getWorldQuaternion(barParentRotation);bar.g.quaternion.copy(barParentRotation.invert()).multiply(camera.quaternion);bar.fill.scale.set(Math.max(.001,ratio)*bar.width,.075,1);bar.fill.position.x=-(1-ratio)*bar.width/2}
 function sync(state){const firstView=current===null;current=state;auroraArt.sync(state.aurora,state.self);meId=state.me;const ids=new Set(state.players.map(p=>p.id));for(const id of pilots.keys())if(!ids.has(id))remove(pilots,id);for(const p of state.players){const key=pilotKey(p);let m=pilots.get(p.id);if(m&&m.key!==key){remove(pilots,p.id);m=null}if(!m){m=createPilot(p);m.rig.root.position.set(p.x,0,p.z);pilots.set(p.id,m)}}const enIds=new Set(state.enemies.map(e=>e.id));for(const id of enemyMeshes.keys())if(!enIds.has(id))remove(enemyMeshes,id);for(const e of state.enemies)if(!enemyMeshes.has(e.id))enemyMeshes.set(e.id,enemyMesh(e));const twIds=new Set(state.towers.map(t=>t.id));for(const id of towerMeshes.keys())if(!twIds.has(id))remove(towerMeshes,id);for(const t of state.towers){let m=towerMeshes.get(t.id);if(m&&(m.level!==t.level||m.tier!==(t.tier||1))){remove(towerMeshes,t.id);m=null}if(!m)towerMeshes.set(t.id,towerMesh(t))}const nodeIds=new Set(state.nodes.map(n=>n.id));for(const [id,m]of nodeMeshes)if(!nodeIds.has(id)){releaseTree(m.g);nodeMeshes.delete(id)}for(const n of state.nodes){let m=nodeMeshes.get(n.id);if(!m){m=nodeMesh(n);nodeMeshes.set(n.id,m)}m.g.visible=n.wait<=0}
  const warnings=state.spawnWarnings||[],warningIds=new Set(warnings.map(w=>w.id));
  for(const [id,m]of arrivalMeshes)if(!warningIds.has(id)){releaseTree(m.g);arrivalMeshes.delete(id);}
  for(const warning of warnings){
   let m=arrivalMeshes.get(warning.id);
   if(!m){
    const g=new THREE.Group(),radius=warning.type==='boss'?2.7:warning.type==='brute'?1.5:1.1;root.add(g);
    const outline=ring(g,radius,'#bc91ff',.85,.06);
    const disk=new THREE.Mesh(new THREE.CircleGeometry(radius,48),new THREE.MeshBasicMaterial({color:'#9e6ee9',transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide}));disk.rotation.x=-Math.PI/2;disk.position.y=.04;g.add(disk);
    const beacon=part(g,'crystal','#d5baff',0,.55,0,.16,.32,.16,.3);
    const tag=textSprite('INCOMING',{width:2.6,size:34,bg:'#442c65e8',color:'#f2e6ff'});tag.position.y=1.7;g.add(tag);
    m={g,outline,disk,beacon,tag};arrivalMeshes.set(warning.id,m);
   }
   m.g.position.set(warning.x,.035,warning.z);m.warning=warning;
  }
  const hzIds=new Set(state.hazards.map(h=>h.id));for(const [id,m]of hazards)if(!hzIds.has(id)){releaseTree(m.g);hazards.delete(id)}for(const h of state.hazards)if(!hazards.has(h.id)){hazards.set(h.id,createBossWarning(h,{root,ring,textSprite}))}
  for(let i=0;i<stationMeshes.length;i++){
   const m=stationMeshes[i],station=state.stations[i],alive=station.hp>0,status=alive?'online-'+station.level:'empty';m.tower.visible=alive;m.ghost.visible=!alive;m.field.visible=alive;m.field.scale.setScalar(station.radius/7);m.bar.g.visible=alive;
   if(m.status!==status){if(alive)m.builtAt=clock;m.status=status;const old=m.tag;old.removeFromParent();old.material.map?.dispose();old.material.dispose();m.tag=textSprite(alive?'O₂ · '+station.name.toUpperCase():`BUILD O₂ · ${stationCost(station).metal}M + ${stationCost(station).crystal}C`,{width:4.6,size:28});m.tag.position.y=alive?3.5:2.6;m.g.add(m.tag)}
  }
  pads.forEach(m=>{m.g.visible=!state.towers.some(t=>t.pad===m.p.id)});
  state.events.forEach((e,i)=>{if(e.starfall&&eventMeshes[i].beacon)eventMeshes[i].beacon.visible=e.state==='idle'&&!state.players.some(p=>dist(p,e)<2.3);eventMeshes[i].outline.material.opacity=e.state==='cooldown'?.14:.45});
  const target=state.guide?.target;guideMarker.visible=!!target&&(state.self.tutorial.advanced!==true||target.kind==='aurora'||target.kind==='base');if(target)guideMarker.position.set(target.x,.06,target.z);
  if(firstView){const p=state.players.find(p=>p.id===meId);if(p){const range=cameraDistance+(inHub(p)?2.3:0),x=inHub(p)?p.x*(state.players.length>3?.25:.45):p.x;camera.position.set(x,.5+range*.86,p.z+range*.98);camera.lookAt(x,1.15,p.z-2.65);}}


 }
 function effect(e){if(e.type==='bossRingHit'){const point=enemyMeshes.get(e.bossId)?.rig.ringHit?.(e.ring);if(point)effect({type:e.broken?'impact':'hit',...point});return;}if(e.type==='impact'&&e.shape==='lane'&&e.damage>0)effect({type:'enemyShot',weapon:'rail',sx:e.x,sz:e.z,x:e.endX,z:e.endZ});if(e.type==='petBolt'){combatVfx.handle({...e,type:'evoPulse',phase:e.stage,style:e.stage===3?19:16,duration:.28});return;}if(['evoPulse','evoShockwave','evoBeam','evoOrb'].includes(e.type)){const pilot=pilots.get(e.owner);if(pilot)pilot.fireUntil=clock+(e.type==='evoBeam'?e.duration:.24);}if(combatVfx.handle(e))return;if(e.type==='shot'&&e.kind==='player'){const p=pilots.get(e.owner);if(p)p.fireUntil=clock+.09;}if(['train','level','refit','wardrobe'].includes(e.type)){const pilot=pilots.get(e.playerId);if(pilot)pilot.upgradeUntil=clock+1.3;}if(e.type==='reaction'){const pilot=pilots.get(e.playerId);if(pilot)pilot.emoteUntil=clock+2.5;}if(e.type==='shot'||e.type==='enemyShot'||e.type==='charge'){
  const kind=e.type==='enemyShot'?'hostile':e.type==='charge'?'charge':e.kind,style=SUITS[e.style||0]||SUITS[0],c=kind==='player'||kind==='charge'?style.bullet:{gun:'#ffd275',frost:'#a0dbff',mortar:'#ffa49c',hostile:'#fa94b6'}[kind]||'#c0edd4',beam=e.weapon==='rail'||e.weapon==='arc'||kind==='charge';
  const g=new THREE.Mesh(e.weapon==='scatter'||kind==='frost'?geometry.crystal:e.weapon==='rail'?geometry.box:geometry.ball,new THREE.MeshBasicMaterial({color:c,transparent:beam,opacity:kind==='charge'?.3:1}));
  const size=.085+Math.min(14,e.style||0)*.006;g.scale.setScalar(kind==='mortar'?.22:kind==='frost'?.16:kind==='hostile'?.15:size);if(kind==='player'&&!beam)g.scale.set(size,size,e.weapon==='scatter'?.19:.35);
  if(kind==='player'&&!beam){
   const grade=Math.min(14,e.style||0);if(grade>=1)part(g,'ball','#f2fff3',0,0,.2,.47,.47,.55,.2);
   if(grade>=2)for(const side of [-1,1])part(g,'crystal',c,side*1.3,0,-.15,.44,.55,.6,.25);
   if(grade>=4)for(let i=0;i<(grade>=8?4:grade>=6?3:2);i++){const a=i*Math.PI*2/(grade>=8?4:grade>=6?3:2);part(g,'ball',i%2?c:'#f6fff2',Math.cos(a)*1.9,Math.sin(a)*1.9,-.35,.33,.33,.23,.15)}
  }
  if(kind==='player'&&!beam&&(e.style||0)>=10){const grade=Math.min(14,e.style||0);if(grade===10)for(const side of [-1,1])part(g,'round',c,side*2.3,0,-.6,.35,.8,1.6,.2);if(grade===11){const sleeve=part(g,'hex','#f3fdff',0,0,-.5,2.0,.4,2.0,.2);sleeve.rotation.x=Math.PI/2;}if(grade===12)for(let i=0;i<3;i++){const a=i*Math.PI*2/3;part(g,'crystal',c,Math.cos(a)*2.5,Math.sin(a)*2.5,-.6,.4,.4,1.8,.2)}if(grade===13)for(let i=0;i<4;i++){const a=i*Math.PI/2,m=part(g,'round','#fff1d2',Math.cos(a)*2.7,Math.sin(a)*2.7,-.6,.35,1.3,.7,.2);m.rotation.z=a;}if(grade===14){const crown=new THREE.Mesh(geometry.orbit,mat(c,.25));g.add(crown);for(let i=0;i<8;i++){const a=i*Math.PI/4;part(g,'crystal',i%2?c:'#fff7d8',Math.cos(a)*2.3,Math.sin(a)*2.3,0,.35,.5,.65,.2)}}}
  scene.add(g);const lineGeo=new THREE.BufferGeometry(),points=[],start=new THREE.Vector3(e.sx,1.2,e.sz),end=new THREE.Vector3(e.x,.9,e.z);
  if(e.weapon==='arc'){const delta=end.clone().sub(start),normal=new THREE.Vector3(-delta.z,0,delta.x).normalize();for(let i=0;i<=7;i++)points.push(start.clone().lerp(end,i/7).addScaledVector(normal,i===0||i===7?0:(i%2?1:-1)*.23));lineGeo.setFromPoints(points)}else lineGeo.setFromPoints([start,end]);
  const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:kind==='charge'?.24:.9}));scene.add(line);
  shots.push({g,line,lineGeo,e,kind,beam,time:0,duration:kind==='charge'?.6:beam?.25:kind==='mortar'?.5:.18});
 }if(['pickup','kill','build','level','impact','revive','train','station','hit'].includes(e.type)){const c={pickup:palette.gold,kill:palette.coral,build:palette.mint,level:palette.gold,impact:palette.coral,revive:palette.mint,train:palette.gold,station:palette.mint,hit:'#e6ffff'}[e.type];for(let i=0;i<(e.type==='level'?12:e.type==='hit'?2:5);i++){const m=new THREE.Mesh(geometry.crystal,new THREE.MeshBasicMaterial({color:c}));m.scale.setScalar(.08+(i%3)*.03);m.position.set(e.x||0,.7,e.z||0);scene.add(m);bursts.push({m,v:new THREE.Vector3(Math.cos(i*2.4)*2,2+(i%3),Math.sin(i*2.4)*2),life:e.type==='hit'?.18:.7})}}if(e.type==='hurt'&&e.playerId===meId)shake=.12;if(shots.length>70){const old=shots.shift();scene.remove(old.g,old.line);old.lineGeo.dispose();old.g.material.dispose();old.line.material.dispose()}}
 const focus=new THREE.Vector3(),desired=new THREE.Vector3(),look=new THREE.Vector3(),tagPosition=new THREE.Vector3(),tagScale=new THREE.Vector3(),screenMin=new THREE.Vector3(),screenMax=new THREE.Vector3(),screenRight=new THREE.Vector3(),screenUp=new THREE.Vector3(),heroCorner=new THREE.Vector3(),heroBox=new THREE.Box3();function render(dt){clock+=dt;starfallArt.tags.forEach(m=>m.tag.visible=true);const me=current?.players.find(p=>p.id===meId);for(const p of current?.players||[]){const m=pilots.get(p.id);if(!m)continue;const g=m.rig.root,oldX=g.position.x,oldZ=g.position.z;g.position.x=THREE.MathUtils.damp(g.position.x,p.x,14,dt);g.position.z=THREE.MathUtils.damp(g.position.z,p.z,14,dt);const moving=Math.hypot(g.position.x-oldX,g.position.z-oldZ)>dt*.3;m.step+=dt*(moving?9:1);g.position.y=p.down?.1:Math.sin(clock*2+p.slot)*.025;const heading=Math.atan2(p.headingX,p.headingZ);g.rotation.y+=Math.atan2(Math.sin(heading-g.rotation.y),Math.cos(heading-g.rotation.y))*Math.min(1,dt*12);g.rotation.z=p.down?Math.PI*.43:0;m.rig.legs.forEach((leg,i)=>leg.rotation.x=moving?Math.sin(m.step+i*Math.PI)*.5:0);m.rig.arms.forEach((arm,i)=>{arm.rotation.x=moving?-Math.sin(m.step+i*Math.PI)*.24:-.15;arm.rotation.z=0});if(clock<(m.emoteUntil||0)){m.rig.arms[0].rotation.x=-1.25+Math.sin(clock*10)*.25;m.rig.arms[0].rotation.z=-.6;}const blink=Math.sin(clock*1.3+p.slot)> .994?.12:1;m.rig.eyes.forEach(eye=>eye.scale.y=blink);m.tag.visible=p.id!==meId&&(!me||dist(p,me)<14)&&((current.players.filter(q=>q.id!==meId).sort((a,b)=>dist(a,me)-dist(b,me)).slice(0,2).some(q=>q.id===p.id)));g.scale.setScalar((m.rig.visualScale||1.28)*(clock<(m.upgradeUntil||0)?1+Math.sin((m.upgradeUntil-clock)*Math.PI)*.055:1));if(m.rig.jets)for(const jet of m.rig.jets){jet.visible=moving||p.tier>=6;jet.scale.y=moving?.33+Math.sin(clock*12)*.025:.15;}for(const rotor of m.rig.rotors||[])rotor.rotation.z=clock*.14;if(m.rig.muzzle)m.rig.muzzle.visible=clock<(m.fireUntil||0);if(m.rig.updateVisual)m.rig.updateVisual(p,clock,moving,clock<(m.fireUntil||0));m.tag.position.y=p.down?3:2.7;g.visible=!me||p.id===meId||dist(p,me)<75}
  for(const e of current?.enemies||[]){const m=enemyMeshes.get(e.id);if(!m)continue;m.g.position.x=THREE.MathUtils.damp(m.g.position.x,e.x,16,dt);m.g.position.z=THREE.MathUtils.damp(m.g.position.z,e.z,16,dt);m.g.position.y=Math.sin(clock*6+e.id)*.035;const heading=Math.atan2((e.faceX??e.x)-e.x,(e.faceZ??e.z)-e.z);m.g.rotation.y=heading;setBar(m.bar,e.hp/e.maxHp);m.rig?.update?.(e,dt,clock);m.g.scale.setScalar(.65+.35*(1-Math.min(1,e.wake||0)));m.wakeRing.visible=(e.wake||0)>0;m.bar.g.visible=!(e.wake>0);m.g.visible=!me||dist(e,me)<80}
  for(const m of arrivalMeshes.values()){
   m.outline.rotation.z+=dt*.6;m.beacon.rotation.y+=dt*1.8;m.beacon.position.y=.5+Math.sin(clock*3)*.08;
   m.disk.material.opacity=.10+.14*(1-m.warning.remaining/m.warning.duration);m.tag.visible=!overview;m.g.visible=!me||dist(me,m.warning)<60;
  }
  for(const t of current?.towers||[]){const m=towerMeshes.get(t.id);if(!m)continue;const target=current.enemies.filter(e=>dist(e,t)<towerStats(t).range).sort((a,b)=>dist(a,t)-dist(b,t))[0];if(target)m.turret.rotation.y=Math.atan2(target.x-t.x,target.z-t.z);setBar(m.bar,t.hp/t.maxHp);m.bar.g.visible=t.hp<t.maxHp;m.tag.visible=overview||!!me&&dist(me,t)<8;}for(const h of current?.hazards||[]){const m=hazards.get(h.id);if(m){m.outline.material.opacity=.55+.25*Math.sin(clock*5);m.disk.material.opacity=.12+.22*(1-h.time/h.duration);}}
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.time+=dt;const t=Math.min(1,s.time/s.duration),e=s.e,start=new THREE.Vector3(e.sx,1.2,e.sz),end=new THREE.Vector3(e.x,.9,e.z);if(s.kind==='charge'){const p=current?.players.find(p=>p.id===e.playerId);if(p){const dx=e.x-e.sx,dz=e.z-e.sz;start.set(p.x,1.2,p.z);end.set(p.x+dx,.9,p.z+dz);s.lineGeo.setFromPoints([start,end]);}}if(s.beam){s.g.position.copy(start).lerp(end,.5);s.g.lookAt(end);if(e.weapon==='rail')s.g.scale.set(.06,.06,start.distanceTo(end));else s.g.visible=false;s.line.material.opacity=(s.kind==='charge'?.24:.95)*(1-t);s.g.material.opacity=1-t;}else{s.g.position.lerpVectors(start,end,t);if(s.kind==='player')s.g.lookAt(end);if(s.kind==='player'&&(e.style||0)>=4)s.g.rotateZ(s.time*20);if(s.kind==='mortar')s.g.position.y+=Math.sin(t*Math.PI)*4;s.lineGeo.setFromPoints([start.clone().lerp(end,Math.max(0,t-.23)),s.g.position]);}if(s.time>=s.duration){scene.remove(s.g,s.line);s.g.material.dispose();s.line.material.dispose();s.lineGeo.dispose();shots.splice(i,1)}}for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.life-=dt;b.v.y-=6*dt;b.m.position.addScaledVector(b.v,dt);b.m.scale.multiplyScalar(Math.max(.01,1-dt*2));if(b.life<=0){scene.remove(b.m);b.m.material.dispose();bursts.splice(i,1)}}
  for(let i=0;i<stationMeshes.length;i++){const m=stationMeshes[i],st=current?.stations[i];if(st?.hp>0){setBar(m.bar,st.hp/st.maxHp);m.tower.scale.setScalar(.85+.15*THREE.MathUtils.smoothstep(clock-(m.builtAt??0),0,.65));}m.g.visible=overview||!me||dist(me,STATIONS[i])<70;m.tag.visible=!overview&&!!me&&dist(me,STATIONS[i])<18&&dist(me,STATIONS[i])>4.5;m.bar.g.visible=!!st&&st.hp>0&&st.hp<st.maxHp;}
  guideRing.scale.setScalar(1+Math.sin(clock*3)*.08);guideArrow.position.y=2.1+Math.sin(clock*3)*.12;
  if(me){
   for(const m of facilityTags)m.tag.visible=!overview&&dist(me,m.facility)<17;
   for(let i=0;i<eventMeshes.length;i++){eventMeshes[i].g.visible=overview||dist(me,EVENTS[i])<75;eventMeshes[i].tag.visible=!overview&&dist(me,EVENTS[i])>8&&dist(me,EVENTS[i])<23;}
   for(const m of arches){const distance=dist(me,{x:0,z:GATE_Z-m.d});m.tag.visible=!overview&&m.d>0&&distance>6&&distance<35&&depth(me)<m.d+2;}
   for(const m of pads){m.g.visible=!overview&&dist(me,m.p)<40&&!current.towers.some(t=>t.pad===m.p.id);m.outline.visible=!overview&&dist(me,m.p)<14;}
   const avatar=pilots.get(meId)?.rig.root;focus.set(avatar?.position.x??me.x,.5,avatar?.position.z??me.z);if(inHub(me))focus.x*=current.players.length>3?.25:.45;
   if(overview){desired.set(0,Math.max(MAX_DEPTH*1.4,MAX_DEPTH*camera.aspect*.9),-MAX_DEPTH*.32);look.set(0,0,GATE_Z-MAX_DEPTH*.5);scene.fog.near=1000;scene.fog.far=1800;}
   else{const nearby=current.enemies.filter(e=>dist(e,me)<12).length,combatRoom=nearby>2?1.7:0;let range=cameraDistance+combatRoom+(inHub(me)?2.3:0);
    const boss=current.enemies.filter(e=>e.type==='boss'&&e.zone>=8&&e.hp>0&&dist(e,me)<26).sort((a,b)=>dist(a,me)-dist(b,me))[0];
    if(boss){const g=enemyMeshes.get(boss.id)?.g,point=new THREE.Vector3(g?.position.x??boss.x,1,g?.position.z??boss.z);focus.lerp(point,.44);const horizontalFit=(Math.abs(boss.x-me.x)+9)/(2*Math.tan(camera.fov*Math.PI/360)*camera.aspect*1.3);range=Math.max(range+3.6,Math.min(32,19+dist(boss,me)*.36),Math.min(37,horizontalFit),camera.aspect<.85?28+Math.max(0,dist(boss,me)-16)*.75+Math.max(0,640-canvas.clientHeight)*.065:0);}
    desired.copy(focus).add(new THREE.Vector3(0,range*.86,range*.98));look.copy(focus).add(new THREE.Vector3(0,.65,boss&&camera.aspect<.85?-4:-2.65));const auroraVista=depth(me)>=AURORA.base.minDepth&&depth(me)<=AURORA.base.maxDepth;scene.fog.near=auroraVista?58:34;scene.fog.far=auroraVista?140:88;}
   camera.position.lerp(desired,1-Math.exp(-dt*5));camera.lookAt(look);sun.position.set(focus.x-14,26,focus.z+8);sun.target.position.set(focus.x,0,focus.z);sun.target.updateMatrixWorld();
  }auroraArt.render(dt,clock,me,overview);if(!overview){
   camera.updateMatrixWorld();screenRight.setFromMatrixColumn(camera.matrixWorld,0);screenUp.setFromMatrixColumn(camera.matrixWorld,1);
   const avatar=pilots.get(meId)?.rig,hero={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
   if(avatar?.localBounds){avatar.root.updateMatrixWorld(true);heroBox.copy(avatar.localBounds).applyMatrix4(avatar.root.matrixWorld);for(let i=0;i<8;i++){heroCorner.set(i&1?heroBox.max.x:heroBox.min.x,i&2?heroBox.max.y:heroBox.min.y,i&4?heroBox.max.z:heroBox.min.z).project(camera);hero.minX=Math.min(hero.minX,heroCorner.x);hero.maxX=Math.max(hero.maxX,heroCorner.x);hero.minY=Math.min(hero.minY,heroCorner.y);hero.maxY=Math.max(hero.maxY,heroCorner.y)}}
   for(const tag of [...facilityTags.map(m=>m.tag),...stationMeshes.map(m=>m.tag),...eventMeshes.map(m=>m.tag),...arches.map(m=>m.tag),...auroraArt.tags.map(m=>m.tag),...starfallArt.tags.map(m=>m.tag),...[...arrivalMeshes.values()].map(m=>m.tag)]){
    if(!tag.visible)continue;tag.getWorldPosition(tagPosition);tag.getWorldScale(tagScale);
    screenMin.copy(tagPosition).addScaledVector(screenRight,-tagScale.x/2).addScaledVector(screenUp,-tagScale.y/2).project(camera);screenMax.copy(tagPosition).addScaledVector(screenRight,tagScale.x/2).addScaledVector(screenUp,tagScale.y/2).project(camera);
    const top=canvas.clientWidth<800?.35:.25,overHero=screenMin.x<hero.maxX+.015&&screenMax.x>hero.minX-.015&&screenMin.y<hero.maxY+.015&&screenMax.y>hero.minY-.015;
    if(screenMin.x<-.96||screenMax.x>.96||screenMax.y>1-2*top||screenMin.y<-.56||overHero)tag.visible=false;
   }
  }for(const a of animations)a.g.rotation[a.axis]+=dt*a.speed;if(shake>0){shake-=dt;camera.position.x+=Math.sin(clock*90)*shake*.5}combatVfx.update(dt,current);starfallArt.update(dt,current,clock,pilots);renderer.render(scene,camera)}
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(canvas);resize();
 function setOverview(value){overview=value;return overview}function pick(clientX,clientY){const rect=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),camera);let best=null;for(const p of current?.players||[]){if(p.id===meId)continue;const center=new THREE.Vector3(p.x,1,p.z),d=ray.ray.distanceToPoint(center);if(d<1.2&&(!best||d<best.distance))best={type:'pilot',id:p.id,distance:d}}for(const t of current?.towers||[]){const d=ray.ray.distanceToPoint(new THREE.Vector3(t.x,1,t.z));if(d<1.1&&(!best||d<best.distance))best={type:'tower',id:t.id,distance:d}}return best}
 return{sync,effect,render,setOverview,pick,renderer,scene,camera,resize,combatVfx,zoom(delta){cameraDistance=Math.max(16.5,Math.min(26,cameraDistance+delta))}};
}

MECH_FORMS.push(...SUITS.slice(15).map(s=>({name:s.name,shell:'#eff8eb',trim:'#527185',armor:s.color})));
