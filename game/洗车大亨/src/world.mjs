import * as T from '../vendor/three.module.js';
import {BAY_X,branchDef,STYLE_DEFS} from './config.mjs';
import {M,material,box,sphere,cylinder,torus,line,label,plant,palm,mechanic,batch,mesh} from './art.mjs';
import {current} from './simulation.mjs';
export class World{
constructor(scene,s){this.scene=scene;this.s=s;this.group=new T.Group();scene.add(this.group);this.build();}
signature(){const st=current(this.s);return [st.id,...st.bays.map(b=>`${b.unlocked}-${b.level}-${b.worker}`),this.s.style,st.upgrades.marketing,st.manager].join('/');}
build(){if(this.staticRoot){this.group.traverse(o=>{if(o.userData.merged)o.geometry.dispose();if(o.isSprite)o.material.map?.dispose();});this.group.clear();}const st=current(this.s),theme=branchDef(st.id).theme,night=theme==='night',desert=theme==='desert';this.signatureValue=this.signature();this.rollers=[];this.labels=[];this.workers=[];this.staticRoot=new T.Group();this.group.add(this.staticRoot);const g=this.staticRoot;
const paving=material(night?'#8392a8':desert?'#c9d0c7':'#c0c9c8'),curb=material('#e4f0e8');
box(g,0,-.65,3,43,1,51,material('#7c9eaf'),.5);box(g,0,-.09,2.5,42,.25,49,paving,.2);
box(g,-37,-.8,0,32,.3,160,material(desert?'#a5b3a0':'#7eb9c4',.35),0);box(g,-23,-.36,0,5,.4,160,material('#c7d8d4'),0);for(let i=0;i<13;i++){const z=-30+i*7;box(g,-25.4,.03,z,1,.025,2.5,material('#e9f7eb'),.05);}
box(g,0,-.08,30,180,.12,10,material('#355b78'),0);for(let x=-80;x<80;x+=5)box(g,x,.004,30,2.6,.02,.12,curb,.01);box(g,0,.02,24.5,42,.2,.6,curb,.08);box(g,0,.02,-22,43,.2,.5,curb,.07);for(const x of [-21,21])box(g,x,.01,1,.3,.35,46,curb,.06);
for(let x=-20;x<20;x+=2.4)for(let z=-21;z<24;z+=2.4){box(g,x,.044,z,2.35,.014,.014,material(night?'#738698':'#bacdce'),0);box(g,x,.045,z,.014,.014,2.35,material(night?'#738698':'#bacdce'),0);}
for(const x of [-18,18])for(let z=-18;z<23;z+=9){cylinder(g,x,.35,z,.12,.65,M.cream);cylinder(g,x,.65,z,.12,.16,M.gold);}
for(const x of [-16,15]){box(g,x,.1,18,5.3,.13,4,material('#89a5af'),.04);for(const a of [-2.55,2.55])box(g,x+a,.19,18,.12,.04,4,M.white,.01);box(g,x,.19,16,5.2,.04,.1,M.white,.01);}
for(let i=0;i<3;i++)this.bay(i,st.bays[i],night);
// A low office and canopy keep the working vehicles visible.
box(g,13.8,1.6,-15,10,3.2,6.6,material(night?'#465f78':'#dbe7e6'),.18);box(g,13.8,3.35,-15,10.6,.35,7.1,M.teal,.12);box(g,13.8,.35,-11.55,11,.36,1.2,M.cream,.08);
for(const x of [10.5,14]){box(g,x,1.75,-11.65,2.7,1.55,.05,M.navy,.06);box(g,x,1.75,-11.59,2.42,1.31,.025,material('#83c7cf',.18,.2),.02);box(g,x,1.75,-11.55,.06,1.38,.04,M.cream,.01);}
box(g,17.65,1.35,-11.63,1.2,2.5,.09,M.navy,.04);box(g,17.65,1.52,-11.55,.95,1.8,.04,M.glass,.03);box(g,17.96,1.35,-11.48,.045,.3,.045,M.gold,.01);
box(g,13.8,3.02,-10.9,10.9,.16,1.8,M.cream,.04);for(let i=0;i<11;i++)box(g,8.8+i,3.13,-10.9,.48,.04,1.8,M.teal,.01);
label(g,'FOAM COAST',13.8,4.06,-15,1,'#f9f7dc',night?'#524b85':'#267f87');plant(g,10,.05,-10.8);plant(g,16,.05,-10.8);box(g,12,3.8,-15,2.3,.65,2,material('#acc7c6'),.08);for(let z=-15.7;z<-14.3;z+=.25)box(g,12,4.15,z,1.9,.02,.09,M.steel,.01);
// Welcome sign, waiting lounge, small details and a real service counter.
box(g,-15.8,.6,-11,3,.25,1.2,M.cream,.06);for(const x of [-16.8,-14.8])box(g,x,.3,-11,.1,.6,.6,M.navy,.02);box(g,-15.8,1.13,-11.4,3,.8,.12,M.teal,.07);plant(g,-18,.05,-11);
for(const x of [-18.2,17.8]){cylinder(g,x,2.5,15,.09,5,M.navy);box(g,x,5.02,15,.8,.15,1.3,M.cream,.08);if(night){const lamp=new T.PointLight('#ffe8b1',10,12,2);lamp.position.set(x,4.5,15);this.group.add(lamp);}}
for(const [x,z,k]of [[-19,-17,1.3],[-19,10,1],[-17,22,1.12],[18,-20,1.2],[19,6,1.1]])palm(g,x,z,k);
for(let i=0;i<7;i++){box(g,-19,.25,-5+i*1.6,.9,.5,1.1,material('#b9c5a0'),.12);sphere(g,-19,.8,-5+i*1.6,.7,material('#79a77b'),[1,.55,1]);}
const entry=label(g,'洗车入口 →',-10,.5,25,.55,'#f2f1d8','#417b80');
label(g,'WELCOME / '+branchDef(st.id).short,-5.7,4.8,-18,1,'#edf4e6','#238788');for(const x of [-10.7,-.7])cylinder(g,x,2.1,-18,.1,4.3,M.navy);
const ownerColor=STYLE_DEFS.find(d=>d.id===this.s.style).color;this.owner=mechanic(this.group,ownerColor,true,this.s.style);this.owner.root.position.set(BAY_X[this.s.selected]-2.7,.12,2.7);this.owner.root.rotation.y=.9;
for(let i=0;i<3;i++)if(st.bays[i].worker){const worker=mechanic(this.group,'#dc9152');worker.root.position.set(BAY_X[i]+2.6,.12,-.6);worker.root.rotation.y=-1.5;this.workers.push({i,...worker});}this.manager=null;if(st.manager){this.manager=mechanic(this.group,'#566482');this.manager.root.position.set(13,.12,-10.8);label(this.manager.root,'店长',0,2.25,0,.27,'#fff4ce','#64727c');}
batch(g);for(const o of g.children)if(o.isMesh)o.userData.merged=true;
}
bay(i,b,night){const g=this.staticRoot,x=BAY_X[i],mat=material(b.unlocked?'#9eb7c4':'#afcbc5');box(g,x,.12,0,6.25,.24,11.5,mat,.12);
for(const dx of [-2.95,2.95])box(g,x+dx,.28,0,.16,.14,11.3,M.cream,.025);
for(let z=-5.4;z<=5.4;z+=.7){box(g,x-2.45,.26,z,.33,.04,.23,M.gold,.015);box(g,x+2.45,.26,z,.33,.04,.23,M.gold,.015);}
if(!b.unlocked){for(let z=-4;z<4;z+=1.1){box(g,x,.27,z,3.6,.025,.05,M.cream,.005);}box(g,x,.28,0,.05,.02,8,M.cream,.01);for(const dx of [-1.3,1.3]){cylinder(g,x+dx,.53,3.8,.21,.55,M.orange,.06);cylinder(g,x+dx,.56,3.8,.14,.1,M.white,.12);}this.labels.push({i,x,y:.7,z:.5,locked:true});return;}
box(g,x,.255,0,3.86,.04,10.8,material('#245e81'),0);for(let z=-5;z<5;z+=.8){box(g,x,.281,z,3.7,.018,.026,material('#39758f'),0);}for(const z of [-4.5,3.5])for(const sign of [-1,1]){const arrow=box(g,x+sign*.2,.286,z,.1,.018,.66,M.cream,0);arrow.rotation.y=sign*.65;}
for(const dx of [-2.1,2.1]){box(g,x+dx,.3,0,.22,.17,10.6,M.steel,.03);box(g,x+dx,.4,0,.08,.04,10.5,M.navy,.01);}
for(const dx of [-2.7,2.7]){box(g,x+dx,2.1,-3.7,.55,4.2,.7,M.cream,.13);box(g,x+dx,1.4,-3.3,.33,2.5,.08,M.teal,.06);box(g,x+dx,.5,-3.7,.85,.55,1.05,M.teal,.09);}
box(g,x,4.2,-3.7,5.95,.65,.8,M.cream,.18);box(g,x,4.23,-3.24,4.8,.38,.07,M.teal,.04);label(g,`0${i+1} / ${b.level>=2?'AUTO WASH':'HAND WASH'}`,x,4.25,-3.13,.35,'#f7ffed');
for(const dx of [-2.4,2.4])for(let j=0;j<3;j++){const nozzle=cylinder(g,x+dx,3.7,-3.7+j*.19,.065,.15,M.steel);nozzle.rotation.z=dx>0?.5:-.5;}
box(g,x-3,1.1,1.3,.62,1.6,.8,M.teal,.1);box(g,x-3,1.48,1.74,.38,.45,.03,M.navy,.03);box(g,x-3,1.48,1.77,.24,.18,.025,material('#9ae5bd'),.01);for(let a=0;a<4;a++)torus(g,x-3,.86,1.82,.22+a*.015,.035,M.navy,0);
cylinder(g,x+2.8,.63,3.6,.36,1.1,M.cream);cylinder(g,x+2.8,1.22,3.6,.38,.13,M.gold);label(g,'SOAP',x+2.8,.9,4,.17,'#318983');
for(let k=0;k<7;k++)box(g,x+.38*k-1.14,.28,5.4,.2,.04,.68,M.cream,.01);line(g,[[x-2.9,.4,1.8],[x-3.4,.14,3.1],[x-3,.15,4.1],[x-2.4,.15,3.4],[x-2.2,.6,2.2]],.033,M.navy);
if(b.level>=2){for(const dx of [-1.75,1.75]){const roll=new T.Group();roll.position.set(x+dx,1.5,-.9);this.group.add(roll);cylinder(roll,0,0,0,.53,2.4,M.teal);for(let a=0;a<20;a++){const theta=a/20*Math.PI*2;for(let j=0;j<8;j++){const brush=box(roll,Math.sin(theta)*.58,-1.1+j*.3,Math.cos(theta)*.58,.14,.26,.35,j%3===0?M.gold:material('#38a4b4'),0);brush.rotation.y=theta;}}cylinder(roll,0,1.3,0,.33,.3,M.gold);batch(roll);this.rollers.push({i,roll});}box(g,x,3.3,-.9,5,.25,.5,M.teal,.07);}
if(b.level>=3){for(const dx of [-2.4,2.4])box(g,x+dx,1.7,-6,.3,3.4,.45,M.teal,.08);box(g,x,3.4,-6,5.2,.5,.7,M.cream,.1);for(const dx of [-1.2,1.2]){const fan=cylinder(g,x+dx,3.15,-5.7,.37,.15,M.navy);fan.rotation.x=Math.PI/2;for(let n=0;n<4;n++){const vane=box(g,x+dx,3.15,-5.59,.6,.08,.025,M.steel,.03);vane.rotation.z=n*Math.PI/4;}}}
if(b.level>=4){box(g,x,3.1,2.6,5,.25,.4,M.gold,.06);for(const dx of [-1,0,1])cylinder(g,x+dx,2.96,2.6,.065,.19,M.steel);}
this.labels.push({i,x,y:.4,z:6.1,locked:false});
}
update(s,time,dt){if(this.signatureValue!==this.signature())this.build();const st=current(s);for(const {i,roll}of this.rollers){if(st.bays[i].car?.state==='work')roll.rotation.y+=dt*5;}const target=new T.Vector3(BAY_X[s.selected]-2.75,.12,2.6);this.owner.root.position.lerp(target,1-Math.exp(-dt*5));this.owner.update(time,!!st.bays[s.selected].car);for(const w of this.workers)w.update(time,!!st.bays[w.i].car);if(this.manager){this.manager.root.position.x=13+Math.sin(time*.22)*1.1;this.manager.update(time,false);}}
}


