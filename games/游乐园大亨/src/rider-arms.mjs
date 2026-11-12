import * as T from '../vendor/three.module.js';
import {mat,beam,ball,box,batch} from './art.mjs';

export function makeRiderArms(camera){
 const root=new T.Group();camera.add(root);root.visible=false;
 const skin=mat('#f5d2ad',.8),sleeve=mat('#58b7c1',.7),cuff=mat('#92d6d7',.7);
 const arms=[];
 for(const sign of [-1,1]){
  const arm=new T.Group();root.add(arm);
  // Shoulders and upper sleeves continue below the screen, rather than ending at a floating cuff.
  const shoulder=[sign*.35,-.97,-.35],elbow=[sign*.31,-.30,-.65],wrist=[sign*.20,.07,-.87];
  beam(arm,shoulder,[sign*.32,-.64,-.56],.102,sleeve);
  ball(arm,sign*.32,-.65,-.56,.102,sleeve);
  beam(arm,[sign*.32,-.65,-.56],elbow,.088,sleeve);ball(arm,...elbow,.085,sleeve);
  beam(arm,elbow,wrist,.068,skin);
  const palm=new T.Group();palm.position.set(...wrist);palm.rotation.z=-sign*.15;arm.add(palm);
  box(palm,0,.075,0,.15,.19,.075,skin,.035);
  for(let i=0;i<4;i++){
   const x=(i-1.5)*.038,h=.105-Math.abs(i-1.5)*.014;
   beam(palm,[x,.14,0],[x,.14+h,-.005],.017,skin);ball(palm,x,.14+h,-.005,.017,skin);
  }
  beam(palm,[sign*.065,.04,0],[sign*.12,.10,-.015],.025,skin);ball(palm,sign*.12,.10,-.015,.025,skin);
  // A small watch grounds the visible wrist without adding a detached sleeve cap.
  if(sign<0){box(palm,0,-.035,.0,.15,.035,.10,cuff,.012);box(palm,0,-.035,.057,.075,.045,.025,mat('#315a75'),.01);}
  batch(arm);arms.push(arm);
 }
 let lift=0;
 return {root,reset(){lift=0;root.visible=false;root.position.y=-1.2;},update(dt,raised,aspect,time){
  lift=T.MathUtils.damp(lift,raised?1:0,10,dt);root.visible=lift>.01;root.position.y=-(1-lift)*1.2;
  const narrow=aspect<.8,scale=narrow?.74:.92;
  arms.forEach((arm,i)=>{const sign=i?1:-1;arm.scale.set(scale,1,1);arm.position.set(sign*(narrow?-.025:.08),Math.sin(time*2.8+i*.3)*.008,0);arm.rotation.z=sign*Math.sin(time*2.2)*.016;});
 }};
}
