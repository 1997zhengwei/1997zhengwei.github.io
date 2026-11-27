import * as T from '../vendor/three.module.js';
import {mergeStatic} from './geometry.mjs';

export function createRider(look){
 const root=new T.Group(),body=new T.Group(),arms=[],materials=[];root.add(body);
 const mat=(color,extra={})=>{const m=new T.MeshPhysicalMaterial({color,roughness:.38,metalness:0,clearcoat:.55,clearcoatRoughness:.2,...extra});materials.push(m);return m;};
 const cloth=mat(look.color,{roughness:.44,clearcoat:.25}),cream=mat('#fff2d6',{roughness:.5,clearcoat:.18}),white=mat('#ffffff'),navy=mat('#243348',{roughness:.36}),gold=mat(look.accent,{metalness:.38,roughness:.22});
 const mesh=(g,m,x=0,y=0,z=0,parent=body)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const capsule=(a,b,r,m,parent=body)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start),o=mesh(new T.CapsuleGeometry(r,Math.max(.01,d.length()-r*2),5,12),m,0,0,0,parent);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;};
 const ringGeo=new T.TorusGeometry(1.02,.31,18,80),colors=[];
 for(let i=0;i<ringGeo.attributes.position.count;i++){const a=Math.atan2(ringGeo.attributes.position.getY(i),ringGeo.attributes.position.getX(i)),c=new T.Color(Math.floor((a+Math.PI)*4/Math.PI)%2?look.color:look.accent);colors.push(c.r,c.g,c.b);}
 ringGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));const ringMat=mat('#ffffff',{vertexColors:true,roughness:.22,clearcoat:1});const ring=mesh(ringGeo,ringMat,0,.64,0);ring.rotation.x=-Math.PI/2;ring.userData.baseScale=[.82,1.2,1];ring.scale.set(.82,1.2,1);
 const seam=mesh(new T.TorusGeometry(1.025,.015,5,80),white,0,.875,0);seam.rotation.x=-Math.PI/2;seam.scale.set(.82,1.2,1);
 for(const sign of[-1,1]){const handle=mesh(new T.TorusGeometry(.14,.045,6,18,Math.PI),navy,sign*.79,.91,.25);handle.rotation.set(-.4,sign*.5,0);}
 const torso=mesh(new T.CapsuleGeometry(.455,.32,7,22),cloth,0,1.18,.02);torso.scale.z=.92;
 const belly=mesh(new T.SphereGeometry(.34,24,18),cream,0,1.12,.43);belly.scale.set(.84,1.12,.22);
 const head=mesh(new T.SphereGeometry(.525,32,24),cloth,0,2.0,.07);head.scale.set(1,1.03,.93);
 const mask=mesh(new T.SphereGeometry(.43,28,20),cream,0,1.99,.47);mask.scale.set(.94,.81,.38);
 for(const sign of[-1,1]){
  const ear=mesh(new T.SphereGeometry(.18,20,16),cloth,sign*.40,2.40,.025);ear.scale.set(.88,1,.7);
  const inner=mesh(new T.SphereGeometry(.105,18,14),cream,sign*.40,2.41,.162);inner.scale.z=.23;
  const cheek=mesh(new T.SphereGeometry(.17,20,14),cream,sign*.18,1.87,.56);cheek.scale.set(1,.77,.56);
  const eye=mesh(new T.SphereGeometry(.057,18,14),navy,sign*.175,2.085,.635);eye.scale.set(.83,1.2,.48);
  mesh(new T.SphereGeometry(.015,10,8),white,sign*.175-.015,2.108,.668);
 }
 const nose=mesh(new T.SphereGeometry(.064,18,14),navy,0,1.94,.65);nose.scale.set(1.2,.72,.6);
 const smile=mesh(new T.TorusGeometry(.073,.009,6,18,Math.PI*.72),navy,0,1.85,.64);smile.rotation.z=Math.PI*1.14;
 const tail=mesh(new T.SphereGeometry(.20,20,14),cloth,0,.62,-1.48);tail.scale.set(.9,.65,2.7);tail.rotation.x=-.12;const tailTip=mesh(new T.SphereGeometry(.14,16,12),cream,0,.58,-1.94);tailTip.scale.set(.9,.6,1.4);
 for(const sign of[-1,1]){
  capsule([sign*.21,.98,.26],[sign*.43,.66,1.0],.20,cloth);
  capsule([sign*.43,.66,1.0],[sign*.45,.28,1.58],.17,cloth);
  const paw=mesh(new T.SphereGeometry(.22,20,16),cloth,sign*.45,.24,1.67);paw.scale.set(.9,.72,1.2);
  const sole=mesh(new T.SphereGeometry(.16,18,12),cream,sign*.45,.24,1.95);sole.scale.set(.9,.6,.34);
  const arm=new T.Group();arm.position.set(sign*.4,1.43,.07);body.add(arm);arms.push(arm);
  capsule([0,0,0],[sign*.32,-.22,.29],.16,cloth,arm);capsule([sign*.32,-.22,.29],[sign*.5,-.41,.63],.145,cloth,arm);
  mesh(new T.SphereGeometry(.175,20,14),cloth,sign*.50,-.41,.64,arm);
  const pad=mesh(new T.SphereGeometry(.095,14,12),cream,sign*.50,-.42,.83,arm);pad.scale.z=.25;
 }
 const collar=mesh(new T.TorusGeometry(.39,.038,8,48),cream,0,1.6,.015);collar.rotation.x=-Math.PI/2;
 const badgeCanvas=document.createElement('canvas');badgeCanvas.width=badgeCanvas.height=128;const badgeCtx=badgeCanvas.getContext('2d');badgeCtx.fillStyle='#fff5da';badgeCtx.beginPath();badgeCtx.arc(64,64,53,0,Math.PI*2);badgeCtx.fill();badgeCtx.strokeStyle=look.color;badgeCtx.lineWidth=7;badgeCtx.lineCap='round';for(let i=0;i<3;i++){badgeCtx.beginPath();badgeCtx.moveTo(32,44+i*20);badgeCtx.bezierCurveTo(48,25+i*20,67,62+i*20,96,42+i*20);badgeCtx.stroke();}const badgeMap=new T.CanvasTexture(badgeCanvas);badgeMap.colorSpace=T.SRGBColorSpace;const badgeMat=mat('#ffffff',{map:badgeMap,transparent:true,alphaTest:.05,roughness:.8,clearcoat:0});const badge=mesh(new T.PlaneGeometry(.48,.48),badgeMat,0,1.24,-.426);badge.rotation.y=Math.PI;
 if(look.kind==='flamingo'){
  const neckCurve=new T.CatmullRomCurve3([new T.Vector3(0,.66,.92),new T.Vector3(0,1.35,1.2),new T.Vector3(0,1.72,1.15),new T.Vector3(0,1.72,1.48)]);
  mesh(new T.TubeGeometry(neckCurve,20,.16,10,false),cloth);mesh(new T.SphereGeometry(.25,22,16),cloth,0,1.72,1.48);
  const beak=mesh(new T.ConeGeometry(.13,.38,16),gold,0,1.64,1.79);beak.rotation.x=Math.PI/2;
  for(const sign of[-1,1]){mesh(new T.SphereGeometry(.052,12,10),navy,sign*.205,1.78,1.56);const wing=mesh(new T.SphereGeometry(.4,18,12),cloth,sign*1.03,.79,-.15);wing.scale.set(.45,.4,1.35);}
 }
 if(look.kind==='shark'){
  const snout=mesh(new T.SphereGeometry(.4,20,16),cloth,0,.77,1.02);snout.scale.set(1.25,.7,1.4);
  for(const sign of[-1,1]){mesh(new T.SphereGeometry(.06,12,10),navy,sign*.34,.94,1.08);const fin=mesh(new T.ConeGeometry(.35,.8,3),cloth,sign*1.15,.76,-.18);fin.rotation.z=-sign*.75;fin.scale.z=.3;}
  const fin=mesh(new T.ConeGeometry(.38,.9,3),cloth,0,1.04,-1.04);fin.scale.z=.28;
  const tail=mesh(new T.ConeGeometry(.48,.85,3),cloth,0,.75,-1.5);tail.rotation.x=-.5;tail.scale.z=.4;
 }
 if(look.kind==='gold'){
  for(const sign of[-1,1])for(let i=0;i<5;i++){const f=mesh(new T.SphereGeometry(.25,16,10),gold,sign*(1.05+i*.17),.74+i*.15,-.1-i*.18);f.scale.set(.68,.4,2.5-i*.1);f.rotation.y=-sign*.55;}
  const crown=mesh(new T.CylinderGeometry(.36,.32,.18,12),gold,0,2.66,0);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;mesh(new T.ConeGeometry(.09,.27,4),gold,Math.sin(a)*.32,2.84,Math.cos(a)*.32);}
 }
 if(look.kind==='aurora'){
  const halo=mesh(new T.TorusGeometry(1.38,.04,8,80),gold,0,.68,0);halo.rotation.x=-Math.PI/2;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;mesh(new T.OctahedronGeometry(.12),gold,Math.cos(a)*1.38,.92,Math.sin(a)*1.38);}
  const helmet=mesh(new T.TorusGeometry(.48,.035,8,48),gold,0,2.13,0);helmet.rotation.x=-.15;
 }
 mergeStatic(body,new Set([ring]));arms.forEach(a=>mergeStatic(a));
 return{root,body,arms,ring,materials,look};
}
export function poseRider(r,time,{air=false,steer=0,hit=0,win=false}={}){
 r.body.rotation.set(air?-.06:.12+Math.sin(time*4)*.018,0,-steer*.24+Math.sin(time*19)*hit*.2);
 r.arms.forEach((arm,i)=>{arm.rotation.z=air?(i===0?1:-1):win?Math.sin(time*8+i)*.55:0;arm.rotation.x=win?-.9:air?-.65:Math.sin(time*5+i)*.04;});
 const pulse=1+Math.sin(time*11)*hit*.035,base=r.ring.userData.baseScale;r.ring.scale.set(base[0]*pulse,base[1]*pulse,base[2]*pulse);
}
export function disposeRider(r){const geos=new Set();r.root.traverse(o=>{if(o.geometry)geos.add(o.geometry);});geos.forEach(g=>g.dispose());r.materials.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}
