import {createRefinedBossRig} from './boss-refined.mjs';
import * as THREE from './vendor/three.module.js';

export const BOSS_DESIGNS=[
 {id:'aegis',name:'Aegis Vault Sentinel',cn:'机械守卫',chapter:'CHAPTER II',role:'Armored reactor keeper',hint:'Leave the slam marker. Strike when the chest opens.',color:'#7ce4df',span:4.1,target:2.45},
 {id:'thornback',name:'Thornback Alpha',cn:'晶角巨兽',chapter:'CHAPTER III · GARDENS',role:'Crystal-horn charger',hint:'Sidestep the charge. Its crystals brighten when stunned.',color:'#eba783',span:3.8,target:1.85},
 {id:'moonwing',name:'Moonwing Matriarch',cn:'月翼鳐皇',chapter:'CHAPTER III · CANYON',role:'Gliding energy ray',hint:'Read the open gap between wind blades. Chase its landing.',color:'#b6a5f0',span:3.8,target:1.5},
 {id:'starcrown',name:'Starcrown Colossus',cn:'星冠巨蛇',chapter:'CHAPTER III · CROWN',role:'Segmented ring guardian',hint:'Break the bright rings, then attack the uncovered starcore.',color:'#e8cc85',span:4.0,target:1.9},
];

function bevel(){const g=new THREE.BoxGeometry(1,1,1,5,5,5),p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),q=new THREE.Vector3(),d=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);q.set(...[v.x,v.y,v.z].map(x=>Math.max(-.34,Math.min(.34,x))));d.copy(v).sub(q).normalize();v.copy(q).addScaledVector(d,.16);p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,d.x,d.y,d.z);}return g;}

export function createBossRig(id){
 const spec=BOSS_DESIGNS.find(s=>s.id===id);if(!spec)throw Error('Unknown boss '+id);
 if(id!=='aegis')return createRefinedBossRig(spec);
 const root=new THREE.Group();root.name='boss-'+id;
 const geometries=new Set(),materials=new Map();let disposed=false;
 const geo={ball:new THREE.SphereGeometry(1,28,20),box:bevel(),tube:new THREE.CylinderGeometry(1,1,1,24),cone:new THREE.ConeGeometry(1,1,24),ring:new THREE.TorusGeometry(1,.06,10,48),crystal:new THREE.OctahedronGeometry(1,0)};Object.values(geo).forEach(g=>geometries.add(g));
 const c={ink:'#263d58',shell:'#eaf4ee',trim:'#61778d',gold:'#efc67b',teal:'#7de8e0',lilac:'#b5a2ed',coral:'#d98b84',cream:'#fff4d7'};
 function material(color,finish='shell'){const k=color+finish;if(!materials.has(k))materials.set(k,new THREE.MeshPhysicalMaterial({color,roughness:finish==='metal'?.28:.38,metalness:finish==='metal'?.45:.10,clearcoat:.60,clearcoatRoughness:.22,emissive:color,emissiveIntensity:finish==='energy'?.36:0,transparent:finish==='glass',opacity:finish==='glass'?.42:1,side:THREE.DoubleSide}));return materials.get(k);}
 function mesh(g,shape,col,x,y,z,sx,sy=sx,sz=sx,finish='shell'){const m=new THREE.Mesh(typeof shape==='string'?geo[shape]:shape,material(col,finish));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=finish!=='energy'&&finish!=='glass';m.receiveShadow=true;g.add(m);return m;}
 const ball=(g,col,x,y,z,sx,sy,sz,f)=>mesh(g,'ball',col,x,y,z,sx,sy,sz,f);
 const plate=(g,col,x,y,z,sx,sy,sz,f)=>mesh(g,'box',col,x,y,z,sx,sy,sz,f);
 const joint=(g,name,x=0,y=0,z=0)=>{const n=new THREE.Group();n.name=name;n.position.set(x,y,z);g.add(n);return n;};
 const ring=(g,col,x,y,z,r,f='metal')=>mesh(g,'ring',col,x,y,z,r,r,r,f);
 function curve(g,col,points,radius=.10,finish='shell'){const shape=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),18,radius,10,false);geometries.add(shape);return mesh(g,shape,col,0,0,0,1,1,1,finish);}
 function crystal(g,col,x,y,z,sx,sy,sz){return mesh(g,'crystal',col,x,y,z,sx,sy,sz,'energy');}
 const eyes=(g,x,y,z,scale=1)=>{for(const side of [-1,1]){ball(g,c.ink,side*x,y,z,.20*scale,.14*scale,.08*scale);ball(g,c.teal,side*x,y+.025,z+.06,.12*scale,.055*scale,.026*scale,'energy');}};
 const body=joint(root,'body');let animate;
 const ease=x=>x*x*(3-2*x),clamp=x=>Math.max(0,Math.min(1,x));
 // attackTime 0..1: deliberate warning, fast action, visible recovery.
 function state(t){t=clamp(t);return {wind:clamp(t/.36),strike:clamp((t-.36)/.16),open:ease(clamp((t-.56)/.18)),phase:t<.36?'windup':t<.56?'attack':'exposed'};}

 if(id==='aegis'){
  const torso=joint(body,'reactor-torso',0,2.8,0);plate(torso,c.ink,0,0,0,2.4,2.1,1.3,'metal');plate(torso,c.shell,0,.18,0,2.7,1.9,1.42);
  plate(torso,c.trim,0,-.72,.65,1.8,.40,.25,'metal');const core=ball(torso,c.teal,0,.1,.87,.57,.57,.22,'energy');ring(torso,c.gold,0,.1,.92,.65);
  const shutters=[];for(const side of [-1,1]){const shutter=joint(torso,'chest-shutter-'+side,side*.53,.1,1.04);plate(shutter,c.ink,0,0,0,.91,1.25,.22,'metal');plate(shutter,c.shell,0,0,.13,.75,1.10,.16);plate(shutter,c.teal,-side*.23,.18,.23,.07,.59,.035,'energy');shutters.push(shutter);}
  const head=joint(body,'helmet',0,4.25,.04);ball(head,c.shell,0,0,0,.78,.58,.65);plate(head,c.ink,0,.02,.57,1.12,.36,.18);eyes(head,.27,.02,.69);plate(head,c.gold,0,.53,-.05,.40,.24,.62,'metal');
  for(const side of [-1,1]){const leg=joint(body,'leg-'+side,side*.68,1.75,0);mesh(leg,'tube',c.trim,0,-.55,0,.30,1.05,.30,'metal');plate(leg,c.shell,0,-.65,.18,.85,1.1,.82);plate(leg,c.teal,0,-.52,.62,.37,.12,.05,'energy');plate(leg,c.ink,0,-1.46,.24,1.02,.37,1.48,'metal');plate(leg,c.shell,0,-1.27,.44,.94,.29,1.20);}
  const arms=[];for(const side of [-1,1]){const arm=joint(torso,'hammer-arm-'+side,side*1.69,.55,0);arms.push(arm);ball(arm,c.trim,0,0,0,.56,.53,.58,'metal');plate(arm,c.shell,0,.26,0,1.16,.50,1.16);plate(arm,c.gold,side*.43,.06,.04,.26,.52,.89,'metal');mesh(arm,'tube',c.ink,0,-.70,0,.29,1.05,.29,'metal');plate(arm,c.shell,0,-1.15,.12,1.10,1.04,1.02);for(let j=-1;j<=1;j++)plate(arm,c.teal,j*.22,-1.02,.66,.10,.52,.035,'energy');plate(arm,c.ink,0,-1.75,.26,1.04,.31,1.18,'metal');}
  for(const side of [-1,1]){const jet=mesh(torso,'tube',c.trim,side*.73,.04,-.95,.32,1.6,.32,'metal');ring(torso,c.teal,side*.73,.13,-1.32,.21,'energy');}
  animate=(time,t)=>{const a=state(t);body.position.y=Math.sin(time*1.4)*.04;torso.rotation.x=a.phase==='windup'?-.09*a.wind:a.phase==='attack'?.23*Math.sin(a.strike*Math.PI):.06;arms.forEach((arm,i)=>{arm.rotation.x=a.phase==='windup'?-1.4*a.wind:a.phase==='attack'?-1.4+2.05*a.strike:.65*(1-a.open);arm.rotation.z=(i?1:-1)*.09;});shutters.forEach((g,i)=>{g.position.x=(i?1:-1)*(.53+a.open*.52);g.rotation.y=(i?1:-1)*a.open*.72;});core.scale.set(.57*(1+a.open*.12),.57*(1+a.open*.12),.22);};
 }

 let lastPhase='idle';function update(time=0,attackTime=null){if(disposed)return;time=Number.isFinite(time)?time:0;const t=Number.isFinite(attackTime)?clamp(attackTime):0;animate(time,t);lastPhase=attackTime===null?'idle':state(t).phase;root.userData.phase=lastPhase;}
 update(0,null);
 return {root,spec,update,get phase(){return lastPhase;},dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials.values())m.dispose();}};
}
