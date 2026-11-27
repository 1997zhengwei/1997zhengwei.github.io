import * as T from '../vendor/three.module.js';
import {M,mat,mesh,box,ball,cyl,torus,beam,tube,batch,textPlane,lampMat,neonMint,neonPink} from './art.mjs';
import {cycle,flight,dropHeight,dropStage,makeBumperMotion} from './ride-motion.mjs';

const TAU=Math.PI*2;
const yAxis=new T.Vector3(0,1,0);
function pathSpeed(point,p,duration){const a=Math.max(0,p-.0005),b=Math.min(1,p+.0005);return point(a).distanceTo(point(b))/(b-a)/duration*3.6;}
function swingPoint(p){const f=flight(p),a=cycle(p)*TAU*3,r=3.75+5.85*Math.sin(f*.57);return new T.Vector3(Math.sin(a)*r,7+8.3*f-5.85*Math.cos(f*.57),Math.cos(a)*r);}
function cupPoint(p){const spin=cycle(p);return new T.Vector3(-.48,.62,.22).applyAxisAngle(yAxis,-spin*TAU*3).add(new T.Vector3(0,.71,5.9)).applyAxisAngle(yAxis,spin*TAU*2);}

function platform(g,r,color=M.pink){cyl(g,0,.18,0,r,.36,M.cream);cyl(g,0,.41,0,r-.35,.18,color);torus(g,0,.52,0,r-.32,.09,M.gold);for(let i=0;i<32;i++){const a=i*TAU/32;ball(g,Math.sin(a)*(r-.35),.51,Math.cos(a)*(r-.35),.075,lampMat);}}
function chair(g,x=0,y=0,z=0,color=M.teal){const seat=new T.Group();seat.position.set(x,y,z);g.add(seat);box(seat,0,0,0,.85,.20,.78,M.cream,.09);box(seat,0,.38,.32,.85,.72,.16,color,.1);for(const xx of [-.44,.44]){beam(seat,[xx,.08,.25],[xx,.40,-.3],.045,M.gold);beam(seat,[xx,.4,-.3],[xx,.13,-.3],.045,M.gold);}tube(seat,[[-.4,.45,.18],[-.30,.72,-.16],[.3,.72,-.16],[.4,.45,.18]],.05,M.navy);return seat;}
function entry(g,text,z,color){for(const x of [-4,4]){cyl(g,x,1.6,z,.2,3.2,M.white);ball(g,x,3.25,z,.3,lampMat);box(g,x,.23,z,.8,.46,.8,M.gold);}box(g,0,3.6,z,8.9,1.1,.4,color,.16);textPlane(g,text,0,3.6,z+.23,7.9,.65,'#fff5df',null);for(let i=0;i<18;i++)ball(g,-4.2+i*.49,4.12,z+.23,.065,lampMat);}
function poseOf(anchor,offset=[0,.15,0]){anchor.updateWorldMatrix(true,false);return {p:new T.Vector3(...offset).applyMatrix4(anchor.matrixWorld),q:anchor.getWorldQuaternion(new T.Quaternion())};}

function swing(root){
 const base=new T.Group();root.add(base);platform(base,10.2,M.teal);
 cyl(base,0,9.3,0,1.0,18,M.cream,.72,24);for(let i=0;i<8;i++){const a=i*TAU/8;beam(base,[Math.sin(a)*.92,.6,Math.cos(a)*.92],[Math.sin(a)*.72,18,Math.cos(a)*.72],.055,M.gold);}
 cyl(base,0,18.3,0,1.25,.5,M.gold);ball(base,0,19,0,.7,M.pink);entry(base,'STARLIGHT SWINGS',11.2,M.teal);batch(base);
 const rotor=new T.Group();root.add(rotor);platform(rotor,4.5,M.pink);
 for(let i=0;i<16;i++){const a=i*TAU/16,b=(i+1)*TAU/16,shape=new T.BufferGeometry();shape.setAttribute('position',new T.Float32BufferAttribute([0,2.4,0,Math.sin(a)*5.1,.15,Math.cos(a)*5.1,Math.sin(b)*5.1,.15,Math.cos(b)*5.1],3));shape.setIndex([0,2,1]);shape.computeVertexNormals();mesh(rotor,shape,i%2?M.white:M.teal);}
 torus(rotor,0,.15,0,5.1,.11,neonMint);ball(rotor,0,2.7,0,.35,M.gold);batch(rotor);
 const hangers=[],chairs=[];
 for(let i=0;i<12;i++){
  const a=i*TAU/12,anchor=new T.Group();anchor.position.set(Math.sin(a)*3.75,.1,Math.cos(a)*3.75);anchor.rotation.y=a;rotor.add(anchor);
  const pendulum=new T.Group();anchor.add(pendulum);
  const c=chair(pendulum,0,-6,0,i%2?M.pink:M.blue);c.rotation.y=Math.PI;
  for(const x of [-.42,.42])for(const z of [-.25,.25])beam(pendulum,[x,-.1,0],[x,-5.85,z],.023,M.gold);
  batch(pendulum);hangers.push(pendulum);chairs.push(c);
 }
 return {seatCount:12,pose(p,running){const lift=running?flight(p):0;rotor.position.y=7.0+8.3*lift;rotor.rotation.y=running?cycle(p)*TAU*3:0;hangers.forEach(h=>h.rotation.x=-lift*.57);},seat(i){return poseOf(chairs[i%12]);},telemetry(p){return {height:this.seat(0).p.y,speed:pathSpeed(swingPoint,p,32),stage:p<.17?'座椅缓缓升空 · 抓好扶手':p>.80?'降低高度 · 慢慢回到地面':'迎风飞翔 · 彩色乐园在脚下'};}};
}

function drop(root){
 const base=new T.Group();root.add(base);platform(base,8.5,M.blue);
 box(base,0,15.5,0,1.7,30.2,1.7,M.navy,.12);
 for(const x of [-1,1])for(const z of [-1,1]){beam(base,[x,.6,z],[x,31,z],.11,M.gold);beam(base,[x*1.11,.8,z*1.11],[x*1.11,30.5,z*1.11],.045,neonMint);}
 for(let j=1;j<18;j++){const y=j*1.65;for(const z of [-1.05,1.05]){beam(base,[-1,y-.65,z],[1,y+.65,z],.07,M.blue);beam(base,[-1,y+.65,z],[1,y-.65,z],.07,M.blue);}cyl(base,0,y,0,1.27,.10,M.gold,1.27,8);}
 cyl(base,0,31.5,0,2.0,.8,M.pink);cyl(base,0,33,0,2.2,2.3,M.blue,0,8);ball(base,0,34.5,0,.35,lampMat);
 for(const x of [-5.3,5.3]){box(base,x,1.25,0,1.4,2.5,3,M.cream,.14);cyl(base,x,2.7,0,.75,.5,M.gold);}
 entry(base,'SKYFALL TOWER',10.2,M.blue);batch(base);
 const carriage=new T.Group();root.add(carriage);torus(carriage,0,0,0,2.5,.22,M.pink);torus(carriage,0,-.25,0,2.6,.09,neonPink);
 const chairs=[];for(let i=0;i<12;i++){const a=i*TAU/12,c=chair(carriage,Math.sin(a)*2.8,.12,Math.cos(a)*2.8,i%2?M.teal:M.pink);c.rotation.y=a+Math.PI;chairs.push(c);beam(carriage,[Math.sin(a)*1.4,0,Math.cos(a)*1.4],[Math.sin(a)*2.8,0,Math.cos(a)*2.8],.10,M.gold);}
 batch(carriage);
 return {seatCount:12,pose(p,running){carriage.position.y=1.0+(running?dropHeight(p):0);},seat(i){return poseOf(chairs[i%12]);},telemetry(p){const a=Math.max(0,p-.0005),b=Math.min(1,p+.0005);return {height:this.seat(0).p.y,speed:Math.abs(dropHeight(b)-dropHeight(a))/(b-a)/27*3.6,stage:dropStage(p)};}};
}

function cups(root){
 const base=new T.Group();root.add(base);platform(base,10.4,M.pink);entry(base,'CANDY TEA PARTY',10.1,M.pink);
 for(const x of [-8.2,8.2]){cyl(base,x,1.8,-7.4,.22,3.6,M.white);for(let j=0;j<8;j++){const stripe=box(base,x,1.4+j*.29,-7.4,.5,.10,.5,M.pink,.04);stripe.rotation.y=j*.45;}ball(base,x,4.3,-7.4,.9,M.pink);torus(base,x,4.3,-6.54,.55,.1,M.white,0);}
 batch(base);const rotor=new T.Group();rotor.position.y=.59;root.add(rotor);cyl(rotor,0,0,0,9.2,.18,M.white);torus(rotor,0,.12,0,8.5,.08,neonPink);
 // A sculpted teapot at the center, not a blocking roof over the passengers.
 ball(rotor,0,1.35,0,1.4,M.teal,[1,.85,1]);cyl(rotor,0,2.3,0,1.0,.20,M.gold);ball(rotor,0,2.52,0,.20,M.pink);torus(rotor,-1.35,1.5,0,.85,.16,M.gold,0);tube(rotor,[[.9,1.4,0],[1.5,1.6,0],[1.9,2.2,0],[2.1,2.25,0]],.20,M.teal);batch(rotor);
 const cups=[],anchors=[];
 for(let i=0;i<6;i++){
  const a=i*TAU/6,c=new T.Group();c.position.set(Math.sin(a)*5.9,.12,Math.cos(a)*5.9);rotor.add(c);cups.push(c);
  const color=[M.pink,M.blue,M.gold,M.teal,M.red,M.mint][i],points=[[.90,0],[1.15,.12],[1.5,.55],[1.63,1.0],[1.66,1.16],[1.53,1.16],[1.49,.99],[1.35,.62],[1.01,.25],[.8,.2]].map(p=>new T.Vector2(...p));
  mesh(c,new T.LatheGeometry(points,40),color);cyl(c,0,.16,0,1.04,.12,M.cream);torus(c,0,1.17,0,1.60,.065,M.gold);torus(c,1.86,.7,0,.62,.14,color,0).rotation.y=Math.PI/2;
  for(let j=0;j<8;j++){const angle=j*TAU/8;ball(c,Math.sin(angle)*1.48,.7,Math.cos(angle)*1.48,.10,M.white,[1,1.7,.6]);}
  for(const x of [-.48,.48]){const anchor=new T.Group();anchor.position.set(x,.5,.22);c.add(anchor);box(c,x,.40,.22,.73,.16,.72,M.cream,.08);box(c,x,.66,.56,.73,.55,.14,color,.06);anchors.push(anchor);}
  cyl(c,0,.48,-.44,.045,.7,M.gold);torus(c,0,.88,-.44,.32,.045,M.navy);batch(c);
 }
 return {seatCount:12,pose(p,running){const spin=running?cycle(p):0;rotor.rotation.y=spin*TAU*2;cups.forEach((c,i)=>c.rotation.y=i+spin*TAU*(i%2?2:-3));},seat(i){return poseOf(anchors[i%12],[0,.12,0]);},telemetry(p){return {height:this.seat(0).p.y,speed:pathSpeed(cupPoint,p,26),stage:p<.12?'茶杯准备好了 · 轻轻转起来':p>.88?'旋转减速 · 回到糖果花园':'大转盘与小茶杯 · 双重旋转！'};}};
}

function bumpers(root){
 const base=new T.Group();root.add(base);
 box(base,0,.20,0,26,.4,20,M.cream,.8);box(base,0,.44,0,24.8,.15,18.5,M.navy,.65);
 for(let x=-10;x<=10;x+=2)for(let z=-7;z<=7;z+=2)box(base,x,.525,z,1.94,.015,1.94,mat((x+z)%4?'#68b5c6':'#83c6ce'),.03);
 for(const z of [-9.3,9.3]){const segments=z<0?[[-12.5,12.5]]:[[-12.5,-6.2],[-3.8,12.5]];for(const [a,b]of segments){box(base,(a+b)/2,.94,z,b-a,.70,.32,M.pink,.14);beam(base,[a,1.75,z],[b,1.75,z],.055,neonMint);}}
 for(const x of [-12.4,12.4]){box(base,x,.94,0,.32,.70,18.5,M.pink,.14);beam(base,[x,1.75,-9.2],[x,1.75,9.2],.055,neonMint);}
 for(const x of [-12.2,12.2])for(const z of [-9.2,9.2]){cyl(base,x,3.5,z,.17,7,M.white);ball(base,x,7.1,z,.32,lampMat);}
 for(const z of [-9.2,9.2]){box(base,0,7,z,26,.28,1.4,M.teal,.10);for(let i=0;i<26;i++)ball(base,-12.5+i,6.8,z+.5,.075,lampMat);}
 // Decorative overhead collection mesh, high enough for the upright car aerials.
 for(let x=-12;x<=12;x+=2)beam(base,[x,7,-9.2],[x,7,9.2],.012,M.navy);
 for(let z=-9;z<=9;z+=2)beam(base,[-12.3,7,z],[12.3,7,z],.012,M.navy);
 for(const x of [-9,9]){box(base,x,7.6,9.3,2.5,1,.4,M.pink,.1);textPlane(base,'★',x,7.6,9.56,1,.8,'#ffe895',null);}
 entry(base,'NEON BUMPER CLUB',10.5,M.teal);batch(base);
 const cars=[];for(let i=0;i<10;i++){
  const c=new T.Group();root.add(c);const color=[M.red,M.gold,M.teal,M.pink,M.blue][i%5];
  box(c,0,.28,0,2.15,.36,2.65,M.dark,.28);torus(c,0,.28,0,1,.13,M.dark).scale.set(1,.85,1.15);
  box(c,0,.58,-.05,1.86,.48,2.2,color,.25);box(c,0,.72,-.75,1.65,.30,.65,color,.18);
  box(c,0,.80,.3,1.00,.20,.83,M.cream,.1);box(c,0,1.10,.69,1.05,.65,.18,M.cream,.10);
  for(const x of [-.72,.72]){ball(c,x,.67,-1.08,.14,lampMat,[1,.6,.5]);box(c,x,.60,1.08,.26,.12,.07,M.red,.03);}
  beam(c,[0,.65,-.25],[0,1.1,-.5],.045,M.gold);torus(c,0,1.1,-.5,.25,.04,M.navy,.9);
  beam(c,[0,.7,.97],[0,6.4,1.15],.018,M.gold);ball(c,0,6.45,1.15,.09,lampMat);batch(c);cars.push(c);
 }
 const motion=makeBumperMotion(30,10);let current=motion(0);
 return {seatCount:10,cars,pose(p,running){current=motion(running?p:0);cars.forEach((c,i)=>{const f=current[i];c.position.set(f.x,.53+f.bump*.25,f.z);c.rotation.set(f.bump*.12,f.yaw,0);});},seat(i){return poseOf(cars[i%10],[0,.88,.20]);},telemetry(p){return {height:this.seat(0).p.y,speed:current[0].speed*3.6,stage:p<.12?'安全带已系好 · 电光车启动':p>.90?'缓缓停车 · 下一轮再来':'软胶碰撞 · 转向、反弹，再出发！'};}};
}

export function makeExtraRide(id,root){return ({swing,drop,cups,bumpers}[id])(root);}
