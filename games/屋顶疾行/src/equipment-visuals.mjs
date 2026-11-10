import * as T from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';

export function makeBackpacks(r){
 const mat=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:.65,...extra});r.materials.push(m);return m;},dark=mat('#24353e'),canvas=mat('#807461',{roughness:1}),rope=mat('#403e34',{roughness:1}),brass=mat('#d7b368',{metalness:.8,roughness:.25}),silver=mat('#b7c7cd',{metalness:.7,roughness:.3}),ice=mat('#a9dce3',{metalness:.35,roughness:.25}),mint=mat('#6ce1ee',{emissive:'#32bfdf',emissiveIntensity:.85}),purple=mat('#635c89',{metalness:.3,roughness:.3}),violet=mat('#c4a6ff',{emissive:'#a26eff',emissiveIntensity:.7});
 const groups={},add=(g,w,h,d,m,x,y,z,radius=.026)=>{const mesh=r.addMesh(new RoundedBoxGeometry(w,h,d,2,radius),m,g);mesh.position.set(x,y,z);return mesh;};
 for(const id of['courier','holo-pack','expedition']){const g=new T.Group();r.root.add(g);groups[id]=g;
  if(id==='courier'){add(g,.285,.345,.16,canvas,0,1.30,.23,.055);add(g,.20,.11,.045,canvas,0,1.20,.325,.025);add(g,.29,.07,.16,rope,0,1.49,.23,.032);for(const side of[-1,1])add(g,.021,.32,.015,rope,side*.09,1.30,.32);}
  if(id==='holo-pack'){add(g,.35,.44,.18,dark,0,1.32,.24);add(g,.27,.34,.045,ice,0,1.33,.35);for(const side of[-1,1]){add(g,.028,.40,.035,mint,side*.13,1.33,.36);add(g,.055,.095,.19,silver,side*.18,1.34,.24);}add(g,.18,.10,.06,ice,0,1.17,.35);add(g,.09,.075,.04,mint,0,1.39,.39);add(g,.05,.04,.045,dark,0,1.39,.405);}
  if(id==='expedition'){add(g,.37,.48,.22,purple,0,1.32,.25);add(g,.25,.28,.055,dark,0,1.34,.385);add(g,.25,.105,.09,purple,0,1.15,.40);for(const side of[-1,1]){add(g,.03,.46,.025,brass,side*.135,1.32,.38);const tube=r.addMesh(new T.CapsuleGeometry(.057,.22,6,12),dark,g);tube.position.set(side*.235,1.30,.26);for(const y of[1.20,1.40]){const ring=r.addMesh(new T.CylinderGeometry(.065,.065,.028,14),brass,g);ring.position.set(side*.235,y,.26);}add(g,.025,.23,.025,violet,side*.235,1.30,.318);add(g,.08,.035,.23,brass,side*.165,1.54,.25);}const gem=r.addMesh(new T.OctahedronGeometry(.075),violet,g);gem.scale.set(1,1.25,.4);gem.position.set(0,1.35,.425);add(g,.16,.024,.03,brass,0,1.47,.40);}
  for(const side of[-1,1]){const strap=r.addMesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(side*.11,1.46,.22),new T.Vector3(side*.18,1.51,.01),new T.Vector3(side*.18,1.23,-.21),new T.Vector3(side*.12,1.14,.15)]),16,.013,5,false),id==='courier'?rope:dark,g);strap.castShadow=true;}
  r.bones.get('spine_03').attach(g);g.visible=false;
 }
 r.customPacks=groups;
}
export function applyBackpack(r,loadout){const id=loadout?.backpack||'outfit';for(const [key,g]of Object.entries(r.customPacks||{}))g.visible=key===id;r.pack.visible=id==='outfit'?!!r.currentLookPack:false;}

function glowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,1,32,32,31);g.addColorStop(0,'#ffffffff');g.addColorStop(.22,'#ffffffe0');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new T.CanvasTexture(c);}
export class EquipmentVisuals{
 constructor(scene){this.scene=scene;this.group=new T.Group();scene.scene.add(this.group);const tex=glowTexture();this.particles=Array.from({length:44},(_,i)=>{const m=new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:T.AdditiveBlending}),sprite=new T.Sprite(m);sprite.visible=false;this.group.add(sprite);return {sprite,life:0,max:1,index:i};});this.rings=Array.from({length:18},()=>{const m=new T.MeshBasicMaterial({color:'#8ae7e0',transparent:true,depthWrite:false,side:T.DoubleSide}),mesh=new T.Mesh(new T.RingGeometry(.10,.15,24),m);mesh.rotation.x=-Math.PI/2;mesh.visible=false;this.group.add(mesh);return {mesh,life:0};});this.cursor=0;this.ringCursor=0;this.emitAt=0;this.last={x:Infinity,z:Infinity};
  this.smoke=new T.Group();scene.scene.add(this.smoke);for(let i=0;i<7;i++){const cloud=new T.Mesh(new T.IcosahedronGeometry(1,2),new T.MeshBasicMaterial({color:i%2?'#98aab8':'#bec4d1',transparent:true,opacity:0,depthWrite:false}));cloud.position.set(Math.sin(i*2.4)*1.1,.6+(i%3)*.6,Math.cos(i*2.4)*1.1);cloud.scale.set(1.4,1.0,1.4);this.smoke.add(cloud);}this.smoke.visible=false;
 }
 update(w,view,time,dt,loadout){const id=loadout?.trail||'none',preview=view==='wardrobe',p=preview?this.scene.runner.root.position:w.player,play=view==='race',active=id!=='none'&&(preview||play&&p.speed>1.8),jump=Math.hypot(p.x-this.last.x,p.z-this.last.z)>4;
  if(jump||id!==this.lastId){for(const a of this.particles)a.life=0;for(const a of this.rings)a.life=0;this.emitAt=0;}this.last={x:p.x,z:p.z};this.lastId=id;
  if(active&&time>=this.emitAt){this.emitAt=time+(preview?.15:.075);const hue=id==='mint-step'?.31:id==='cyan-streak'?.54:.60+Math.sin(time*2)*.18,color=new T.Color().setHSL(hue,.8,.71),a=this.particles[this.cursor++%this.particles.length],side=this.cursor%2?1:-1;
   a.life=a.max=id==='aurora'?1.05:.65;a.sprite.material.color.copy(color);const angle=preview?time*2:0;a.sprite.position.set(p.x+(preview?Math.cos(angle)*.7:side*.16),p.y+.10+(preview?.04:Math.random()*.11),p.z+(preview?Math.sin(angle)*.7:.08));a.sprite.scale.setScalar(id==='mint-step'?.16:.25);
   if(preview||p.grounded){const ring=this.rings[this.ringCursor++%this.rings.length];ring.life=.55;ring.mesh.material.color.copy(color);ring.mesh.position.set(a.sprite.position.x,p.y+.065,a.sprite.position.z);ring.mesh.scale.setScalar(id==='aurora'?1.8:1);}
  }
  for(const a of this.particles){a.life=Math.max(0,a.life-dt);a.sprite.visible=a.life>0&&(play||preview);a.sprite.material.opacity=a.life/a.max*.85;if(a.life>0)a.sprite.position.y+=dt*(id==='aurora'?.28:.07);}
  for(const a of this.rings){a.life=Math.max(0,a.life-dt);a.mesh.visible=a.life>0&&(play||preview);a.mesh.material.opacity=a.life*.75;}
  const h=w.hunt;this.smoke.visible=play&&!!h&&h.smokeUntil>w.elapsed;if(this.smoke.visible){const age=3-(h.smokeUntil-w.elapsed);this.smoke.position.set(h.smokePosition.x,h.smokePosition.y,h.smokePosition.z);this.smoke.rotation.y=age*.16;this.smoke.scale.setScalar(.7+age*.45);for(const cloud of this.smoke.children)cloud.material.opacity=Math.min(.2,age*.6,(3-age)*.25);}
 }
}
