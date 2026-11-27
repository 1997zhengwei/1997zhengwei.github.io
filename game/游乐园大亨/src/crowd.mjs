import * as T from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';
import {RIDE_BY_ID} from './data.mjs';

// Instanced facial features remain real geometry at passenger-camera distance.
// The eyes and smile sit outside the head surface, rather than being buried in it.
export class Crowd{
 constructor(scene,max=180){
  this.max=max;this.parts={};
  const sphere=(r,w=10,h=7)=>new T.SphereGeometry(r,w,h),rounded=(x,y,z,r=.04)=>new RoundedBoxGeometry(x,y,z,1,r);
  const smileCurve=new T.CatmullRomCurve3([[-.074,.01,.233],[-.037,-.024,.252],[0,-.032,.257],[.037,-.024,.252],[.074,.01,.233]].map(p=>new T.Vector3(...p)));
  const defs={body:rounded(.44,.53,.3,.1),head:sphere(.23,16,12),hair:new T.SphereGeometry(.238,12,8,0,Math.PI*2,0,Math.PI*.48),ponytail:sphere(.14),
   legL:rounded(.17,.45,.19),legR:rounded(.17,.45,.19),shoeL:rounded(.19,.12,.3),shoeR:rounded(.19,.12,.3),armL:rounded(.15,.44,.16,.05),armR:rounded(.15,.44,.16,.05),
   eyeL:sphere(.034),eyeR:sphere(.034),pupilL:sphere(.019),pupilR:sphere(.019),browL:rounded(.075,.018,.023,.006),browR:rounded(.075,.018,.023,.006),nose:sphere(.040),cheekL:sphere(.034),cheekR:sphere(.034),earL:sphere(.060),earR:sphere(.060),smile:new T.TubeGeometry(smileCurve,14,.012,5,false),openMouth:sphere(.045),
   hat:new T.CylinderGeometry(.25,.3,.14,12),bag:rounded(.34,.4,.13,.07),balloon:sphere(.35),string:new T.CylinderGeometry(.012,.012,1.3,5),broom:new T.CylinderGeometry(.018,.018,1.2,5),brush:new T.BoxGeometry(.35,.12,.2)};
  for(const [name,geometry]of Object.entries(defs)){
   const mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({color:'#fff',roughness:.8}),max);
   mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.count=0;mesh.castShadow=['head','body','hair','hat','legL','legR','armL','armR','bag'].includes(name);mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);this.parts[name]=mesh;
  }
  this.dummy=new T.Object3D();this.root=new T.Object3D();this.turn=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI);
  this.palette=['#ec8d9b','#58b7c1','#f3c367','#a999d8','#87b3df','#e98e60','#70ab83','#e2d8b4','#f3f1df'];this.skin=['#e6b88d','#9b6649','#f5d2ad','#bf8868','#704b3c'];this.hair=['#4c3935','#855437','#d7b26c','#322e38','#b96643'];
 }
 update(guests,models,time,experience=null){
  const count=Math.min(guests.length,this.max),dummy=this.dummy,root=this.root,color=new T.Color();
  for(const part of Object.values(this.parts))part.count=count;
  for(let i=0;i<count;i++){
   const g=guests[i],n=g.style??g.id%18,model=models[g.target];let seated=false,pose=null;
   if(g.mode==='riding'&&model){const index=g.seatIndex??Math.max(0,model.riderIds?.indexOf(g.id)??0);pose=model.seat(index);seated=true;}
   if(experience&&!g.trial&&g.mode==='riding'&&g.target===experience.def.id){root.position.set(0,-100,0);root.quaternion.identity();root.scale.setScalar(1);}
   else if(pose){root.position.copy(pose.p);root.quaternion.copy(pose.q).multiply(this.turn);root.scale.setScalar(.85);}
   else{let y=.04;if(g.mode==='boarding'&&g.target==='ship'&&Math.abs(g.x-RIDE_BY_ID.ship.x+7.9)<1.5)y+=T.MathUtils.clamp((RIDE_BY_ID.ship.z+9.6-g.z)/5.5,0,1)*4.8;root.position.set(g.x,y,g.z);root.rotation.set(0,g.heading||0,0);root.scale.setScalar(n%6===0&&!g.staff?.7:.9+n%4*.045);}
   root.updateMatrix();
   const walk=!seated&&['enter','walk','exit','boarding','foodwalk'].includes(g.mode)?Math.sin(time*10+g.id)*.45:0;
   const headY=seated?1.04:1.4,bodyY=seated?.50:.86,skin=this.skin[n%5],hair=this.hair[n%5],shirt=g.staff?'#4c93bf':this.palette[n%9],pants=['#445c79','#887f96','#658b91','#e4d8bd'][n%4];
   const surprised=seated&&['coaster','drop','ship'].includes(g.target)&&n%3===0,blink=Math.sin(time*1.3+g.id*3.1)>.996;
   const pieces={body:[0,bodyY,0,shirt],head:[0,headY,.01,skin],hair:[0,headY+.03,-.02,hair],ponytail:[0,headY-.02,-.235,hair],
    legL:[-.12,seated?.15:.39,seated?.17:0,pants],legR:[.12,seated?.15:.39,seated?.17:0,pants],shoeL:[-.12,seated?-.02:.11,seated?.43:.05,'#fbf4e0'],shoeR:[.12,seated?-.02:.11,seated?.43:.05,'#fbf4e0'],armL:[-.31,bodyY+.03,seated?.08:0,shirt],armR:[.31,bodyY+.03,seated?.08:0,shirt],
    eyeL:[-.078,headY+.035,.240,'#fff8ed'],eyeR:[.078,headY+.035,.240,'#fff8ed'],pupilL:[-.078,headY+.035,.270,'#273b4b'],pupilR:[.078,headY+.035,.270,'#273b4b'],browL:[-.078,headY+.110,.221,hair],browR:[.078,headY+.110,.221,hair],nose:[0,headY-.025,.262,skin],cheekL:[-.132,headY-.054,.198,'#e99a91'],cheekR:[.132,headY-.054,.198,'#e99a91'],earL:[-.227,headY-.015,.005,skin],earR:[.227,headY-.015,.005,skin],smile:[0,headY-.066,0,'#69443f'],openMouth:[0,headY-.085,.239,'#69443f'],
    hat:[0,headY+.25,.01,n%3?shirt:'#f7d275'],bag:[0,bodyY,-.21,this.palette[(n+4)%9]],balloon:[.45,2.6,0,this.palette[(n+2)%9]],string:[.45,1.65,0,'#f6e5ba'],broom:[.4,.67,.23,'#c6a36e'],brush:[.4,.06,.23,'#eee2ae']};
   for(const [key,[x,y,z,c]]of Object.entries(pieces)){
    dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);
    if(key==='legL')dummy.rotation.x=seated?Math.PI/2:walk;
    if(key==='legR')dummy.rotation.x=seated?Math.PI/2:-walk;
    if(key==='armL')dummy.rotation.x=seated?-.7:-walk*.7;
    if(key==='armR')dummy.rotation.x=seated?-.7:walk*.7;
    if(key==='browL')dummy.rotation.z=surprised?-.16:.08;if(key==='browR')dummy.rotation.z=surprised?.16:-.08;
    if(key.startsWith('eye')||key.startsWith('pupil'))dummy.scale.y=blink?.12:1;
    if(key==='cheekL'||key==='cheekR')dummy.scale.set(1,.55,.22);
    if(key==='openMouth')dummy.scale.set(.68,1,.25);
    if((key==='hat'&&n%3!==0&&!g.staff)||(key==='bag'&&(n%4!==1||g.staff))||(key==='ponytail'&&n%4!==1)||(['balloon','string'].includes(key)&&(n%7!==0||seated||g.staff))||(['broom','brush'].includes(key)&&!g.staff)||(key==='smile'&&surprised)||(key==='openMouth'&&!surprised))dummy.scale.setScalar(0);
    dummy.updateMatrix();dummy.matrix.premultiply(root.matrix);this.parts[key].setMatrixAt(i,dummy.matrix);this.parts[key].setColorAt(i,color.set(key==='hat'&&g.staff?'#fff7e4':c));
   }
  }
  for(const part of Object.values(this.parts)){part.instanceMatrix.needsUpdate=true;if(part.instanceColor)part.instanceColor.needsUpdate=true;}
 }
}
