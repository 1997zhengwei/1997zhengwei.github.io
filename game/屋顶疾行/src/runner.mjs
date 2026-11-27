import * as T from '../vendor/three.module.js';
import {clamp,lerp,smooth} from './math.mjs';
import {LOOKS} from './world.mjs';
const Y=new T.Vector3(0,1,0),temp=new T.Vector3(),q=new T.Quaternion();
const V=(x,y,z)=>new T.Vector3(x,y,z);
function torsoGeometry(){const g=new T.CylinderGeometry(.25,.18,.53,12,1);g.scale(1,1,.66);return g;}
function ik(a,b,lengthA,lengthB,pole){const delta=b.clone().sub(a),d=clamp(delta.length(),.015,lengthA+lengthB-.001),dir=delta.normalize(),along=(lengthA*lengthA-lengthB*lengthB+d*d)/(2*d),height=Math.sqrt(Math.max(0,lengthA*lengthA-along*along)),perp=pole.clone().sub(a);perp.addScaledVector(dir,-perp.dot(dir)).normalize();return a.clone().addScaledVector(dir,along).addScaledVector(perp,height);}
export class Runner{
 constructor(textures,{ghost=false}={}){this.root=new T.Group();this.body=new T.Group();this.root.add(this.body);this.ghost=ghost;this.textures=textures;this.parts=[];this.materials=[];this.basePoseTime=0;
  const mat=(color,roughness=.8,metalness=0)=>{let m=new T.MeshStandardMaterial({color,roughness,metalness});if(ghost){m=new T.MeshBasicMaterial({color:'#87d9df',transparent:true,opacity:.28,depthWrite:false});}this.materials.push(m);return m;};
  this.jacket=mat('#ddd8ca');this.pants=mat('#283238');this.accent=mat('#c2ee76',.45);this.sole=mat('#f2ead8',.6);this.skin=mat('#bd8c70',.8);this.hair=mat('#28211d');this.dark=mat('#1d252a');this.metal=mat('#a1afb2',.3,.6);
  if(!ghost){for(const m of[this.jacket,this.pants]){m.bumpMap=textures.cloth;m.bumpScale=.008;}}
  this.torso=new T.Group();this.body.add(this.torso);
  this.jersey=this.mesh(torsoGeometry(),this.jacket,this.torso);this.jersey.position.y=.27;
  const waist=this.mesh(new T.CylinderGeometry(.182,.185,.11,12),this.pants,this.torso);waist.scale.z=.68;waist.position.y=.035;
  const zip=this.mesh(new T.BoxGeometry(.012,.44,.01),this.dark,this.torso);zip.position.set(0,.28,-.17);
  const collar=this.mesh(new T.TorusGeometry(.09,.024,6,18),this.jacket,this.torso);collar.rotation.x=Math.PI/2;collar.position.y=.54;
  for(const side of[-1,1]){const pocket=this.mesh(new T.BoxGeometry(.105,.014,.012),this.dark,this.torso);pocket.position.set(side*.12,.19,-.142);pocket.rotation.z=side*.16;const shoulder=this.mesh(new T.SphereGeometry(.115,12,8),this.jacket,this.torso);shoulder.scale.set(1,.8,.95);shoulder.position.set(side*.205,.48,0);}
  this.pack=new T.Group();this.torso.add(this.pack);this.pack.position.set(0,.31,.16);const bag=this.mesh(new T.BoxGeometry(.26,.36,.105),this.pants,this.pack);bag.position.z=.035;this.mesh(new T.BoxGeometry(.19,.13,.025),this.jacket,this.pack).position.set(0,-.055,.10);this.mesh(new T.BoxGeometry(.03,.22,.013),this.accent,this.pack).position.set(.075,.02,.119);
  for(const side of[-1,1]){const strap=this.mesh(new T.BoxGeometry(.036,.43,.02),this.dark,this.torso);strap.position.set(side*.16,.31,-.152);strap.rotation.z=side*.05;}
  this.neck=this.mesh(new T.CylinderGeometry(.062,.069,.12,10),this.skin,this.body);
  this.head=new T.Group();this.body.add(this.head);const skull=this.mesh(new T.SphereGeometry(.118,18,14),this.skin,this.head);skull.scale.set(1,1.27,.95);skull.position.y=.01;
  for(const side of[-1,1]){this.mesh(new T.SphereGeometry(.026,8,7),this.skin,this.head).position.set(side*.116,.005,0);const eye=this.mesh(new T.SphereGeometry(.013,8,6),this.dark,this.head);eye.scale.set(1,.55,.6);eye.position.set(side*.046,.033,-.106);const brow=this.mesh(new T.BoxGeometry(.039,.008,.009),this.hair,this.head);brow.position.set(side*.046,.06,-.104);brow.rotation.z=side*.06;}
  const nose=this.mesh(new T.SphereGeometry(.024,8,6),this.skin,this.head);nose.scale.set(.65,1,1.12);nose.position.set(0,.008,-.113);
  const mouth=this.mesh(new T.BoxGeometry(.038,.006,.006),this.dark,this.head);mouth.position.set(0,-.052,-.105);
  this.hairMesh=this.mesh(new T.SphereGeometry(.121,16,10,0,Math.PI*2,0,Math.PI*.38),this.hair,this.head);this.hairMesh.scale.y=1.25;this.hairMesh.position.y=.018;
  const backHair=this.mesh(new T.SphereGeometry(.12,16,10,0,Math.PI,Math.PI*.30,Math.PI*.50),this.hair,this.head);backHair.scale.y=1.25;backHair.position.y=.018;
  this.hat=new T.Group();this.head.add(this.hat);this.hat.position.y=.06;this.hatCap=this.mesh(new T.SphereGeometry(.126,16,10,0,Math.PI*2,0,Math.PI*.43),this.pants,this.hat);this.hatBrim=this.mesh(new T.BoxGeometry(.19,.015,.11),this.pants,this.hat);this.hatBrim.position.set(0,.012,-.12);
  this.arms=[];this.legs=[];
  for(const side of[-1,1]){this.arms.push({side,upper:this.limb(.075,.084,this.jacket),lower:this.limb(.058,.072,this.jacket),elbow:this.mesh(new T.SphereGeometry(.073,10,8),this.jacket,this.body),hand:this.mesh(new T.SphereGeometry(.055,10,8),this.skin,this.body),band:this.mesh(new T.SphereGeometry(.067,10,8),this.accent,this.body),watch:this.mesh(new T.BoxGeometry(.043,.055,.016),this.dark,this.body)});
   const shoe=new T.Group();this.body.add(shoe);const upper=this.mesh(new T.BoxGeometry(.135,.11,.27),this.dark,shoe);upper.position.set(0,.035,-.055);const sole=this.mesh(new T.BoxGeometry(.145,.036,.288),this.sole,shoe);sole.position.set(0,-.025,-.06);const toe=this.mesh(new T.SphereGeometry(.071,10,7),this.sole,shoe);toe.scale.set(1,.55,1.3);toe.position.set(0,.02,-.165);this.mesh(new T.BoxGeometry(.142,.023,.14),this.accent,shoe).position.set(0,.014,-.05);
   this.legs.push({side,upper:this.limb(.105,.12,this.pants),lower:this.limb(.068,.10,this.pants),knee:this.mesh(new T.SphereGeometry(.096,10,8),this.pants,this.body),shoe});
  }
  this.applyLook('chalk');this.pose({mode:'idle',speed:0,grounded:true,vy:0,yaw:0,actionProgress:0},0);
 }
 mesh(g,m,parent=this.body){const mesh=new T.Mesh(g,m);mesh.castShadow=!this.ghost;mesh.receiveShadow=!this.ghost;parent.add(mesh);this.parts.push(mesh);return mesh;}
 limb(rTop,rBottom,m){return this.mesh(new T.CylinderGeometry(rTop,rBottom,1,10,1),m);}
 segment(mesh,a,b){const v=temp.copy(b).sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=v.length();mesh.quaternion.setFromUnitVectors(Y,v.normalize());}
 applyLook(id){const l=LOOKS.find(l=>l.id===id)||LOOKS[0];if(!this.ghost){this.jacket.color.set(l.jacket);this.pants.color.set(l.pants);this.accent.color.set(l.accent);this.sole.color.set(l.shoes);this.hair.color.set(l.hair);}this.pack.visible=l.pack;this.hat.visible=l.hat!=='none';this.hatBrim.visible=l.hat==='cap';this.hatCap.scale.y=l.hat==='beanie'?1.35:1;}
 pose(p,time,preview=false){const mode=p.mode||'idle',speed=p.speed||0,phase=time*(speed>7?13.2:11.1),running=mode==='run',air=['air','wallrun','hang','mantle'].includes(mode),action=p.actionProgress||0;let hip=.94,lean=running?.13:0,roll=0,bodyYaw=0;
  if(mode==='slide'){hip=.31;lean=-.58;}if(mode==='roll'){hip=.42;roll=-Math.PI*2*action;lean=.42;}if(mode==='vault'){hip=.84;lean=.72*Math.sin(action*Math.PI);}if(mode==='hang'){hip=.9;lean=.06;}if(mode==='mantle'){hip=lerp(.9,.7,Math.sin(action*Math.PI));lean=.65*Math.sin(action*Math.PI);}if(mode==='wallrun')lean=.13;
  if(mode==='idle'||mode==='celebrate')hip+=Math.sin(time*2.2)*.009;if(running)hip=.91+Math.cos(phase*2)*.027;
  this.body.position.set(0,0,0);this.body.rotation.set(roll,0,0);if(mode==='air'&&p.trick>0)bodyYaw=Math.PI*2*smooth(p.trick);this.body.rotation.y=bodyYaw;
  this.torso.position.set(0,hip,0);this.torso.rotation.set(-lean,0,mode==='wallrun'?(p.wallNormal?.x?-.2*Math.sign(p.wallNormal.x):.12):Math.sin(phase)*.025*(running?1:0));
  this.torso.updateMatrix();const localPoint=(x,y,z)=>V(x,y,z).applyMatrix4(this.torso.matrix);
  const neck=localPoint(0,.58,0);this.neck.position.copy(neck);this.neck.rotation.x=-lean*.5;
  this.head.position.copy(localPoint(0,.75,-.004));this.head.rotation.set(-lean*.2+(mode==='idle'?.03*Math.sin(time*.5):0),preview?-.16:0,0);
  for(const leg of this.legs){const s=leg.side,a=V(s*.105,hip-.025,.015);let ankle=V(s*.13,.045,0),pole=V(s*.13,.54,-.45),pitch=0;
   if(running){const f=phase+(s>0?Math.PI:0),stride=Math.min(.49,.16+speed*.031);ankle.z=Math.cos(f)*stride;ankle.y+=Math.max(0,Math.sin(f))*(speed>7?.3:.21);pitch=Math.max(0,Math.sin(f))*.4-Math.max(0,-Math.sin(f))*.16;}
   else if(mode==='air'){const up=clamp((p.vy||0)/8.6,-1,1);ankle=V(s*.13,.18+(s>0?.22:.1)*Math.max(0,up),s>0?-.38:.25);pole.z=-.65;pitch=-.18;}
   else if(mode==='vault'){const tuck=Math.sin(action*Math.PI);ankle=V(s*.14,.12+tuck*.49,s>0?-.12:.48*tuck);pole.z=-.64;pitch=-.22;}
   else if(mode==='hang'){ankle=V(s*.14,.13,s>0?.20:.34);pole.z=-.28;pitch=.2;}
   else if(mode==='mantle'){const tuck=Math.sin(action*Math.PI);ankle=V(s*.14,.1+tuck*(s>0?.45:.2),-.32*tuck);pole.z=-.7;}
   else if(mode==='wallrun'){ankle=V(s*.17,.16+Math.max(0,Math.sin(phase+s))*.26,Math.cos(phase+s)*.47);}
   else if(mode==='slide'){ankle=V(s*.17,.07,s>0?-.65:.34);pole=V(s*.22,.48,-.3);pitch=-.2;}
   else if(mode==='roll'){ankle=V(s*.16,.2,-.15);pole=V(s*.2,.65,-.55);}
   else{ankle.z=s>0?.07:-.07;}
   ankle.sub(a).clampLength(.02,.899).add(a);const knee=ik(a,ankle,.44,.46,pole);this.segment(leg.upper,a,knee);this.segment(leg.lower,knee,ankle);leg.knee.position.copy(knee);leg.shoe.position.copy(ankle);leg.shoe.rotation.set(pitch,0,s*.035);
  }
  for(const arm of this.arms){const s=arm.side,a=localPoint(s*.235,.46,0);let hand=V(s*.27,.86,.035),pole=V(s*.27,1.12,.32);
   if(running){const swing=Math.cos(phase+(s>0?0:Math.PI));hand=V(s*.27,1.0+swing*.14,-swing*.47-.06);pole=V(s*.55,1.05,.3);}
   else if(mode==='air'){hand=V(s*.37,1.23,-.26+(s>0?.07:0));pole=V(s*.55,1.18,.25);}
   else if(mode==='vault'){const t=Math.sin(action*Math.PI);hand=V(s*.23,lerp(1.02,.78,t),-.48);pole=V(s*.55,1.05,-.17);}
   else if(mode==='hang'||mode==='mantle'){hand=V(s*.22,mode==='hang'?1.64:lerp(1.64,1.0,action),-.34);pole=V(s*.48,1.46,-.12);}
   else if(mode==='wallrun'){hand=V(s*.35,1.25,s>0?-.18:.15);}
   else if(mode==='slide'){hand=V(s*.38,.29,s>0?.2:-.12);pole=V(s*.57,.68,.1);}
   else if(mode==='roll'){hand=V(s*.3,.91,-.18);pole=V(s*.5,1.0,-.1);}
   else if(mode==='celebrate'){hand=V(s*.35,s>0?1.85:1.12,s>0?-.1:-.04);pole=V(s*.5,1.55,.12);}
   else if(preview){hand=V(s*.27,s>0?.89:.85,s>0?-.02:.05);}
   const elbow=ik(a,hand,.325,.315,pole);this.segment(arm.upper,a,elbow);this.segment(arm.lower,elbow,hand);arm.elbow.position.copy(elbow);arm.hand.position.copy(hand);arm.hand.scale.set(.85,1.14,.9);arm.band.position.copy(hand).lerp(elbow,.15);arm.band.scale.set(.94,.38,.94);arm.watch.position.copy(arm.band.position);arm.watch.position.z-=.04;arm.watch.visible=s<0&&!this.ghost;
  }
 }
 setWorld(p,time){this.root.position.set(p.x,p.y+.015,p.z);this.root.rotation.y=p.yaw;this.pose(p,time);}
 dispose(){for(const p of this.parts)p.geometry.dispose();for(const m of this.materials)m.dispose();}
}
