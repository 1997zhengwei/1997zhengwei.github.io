import * as T from '../vendor/three.module.js';
import {box,sphere,cylinder,torus,mat,M,textSprite,batchColors} from './art.mjs';
import {storeDef} from './stores.mjs';
import {decorFor} from './cosmetics.mjs';
export function star(g,x,y,z,size=.2,color='#f6c34f'){const shape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?size*.46:size,px=Math.sin(a)*r,py=Math.cos(a)*r;i?shape.lineTo(px,py):shape.moveTo(px,py);}shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:1,steps:1});geo.userData.transient=true;const m=new T.Mesh(geo,mat(color,.35,.18));m.position.set(x,y,z);g.add(m);return m;}
export function palm(g,x,z,h=3){const t=new T.Group();t.position.set(x,.15,z);g.add(t);cylinder(t,0,h*.45,0,.17,h*.9,mat('#ae8859'),.12);for(let i=0;i<6;i++){const a=i*Math.PI/3,l=sphere(t,Math.sin(a)*.58,h,Math.cos(a)*.58,.54,mat('#4da675'),[1.8,.14,.48]);l.rotation.y=a+Math.PI/2;l.rotation.z=.12;}for(let i=0;i<3;i++)sphere(t,(i-1)*.15,h-.2,0,.17,mat('#a8b652'));}
export function themePlant(g,x,z,id,store){if(store==='corner')return false;
 if(store==='night'&&id==='eggplant'){box(g,x,.42,z,.8,.25,.7,mat('#79634f'),.07);for(const dx of [-.25,.25])cylinder(g,x+dx,.59,z,.05,.3,mat('#90a875'));return true;}
 if(id==='tomato'){cylinder(g,x,.75,z,.055,1.15,mat('#a48252'));sphere(g,x,1.18,z,.46,mat(store==='seaside'?'#5aa873':'#7fa34e'),[1,.55,.85]);return true;}
 if(store==='seaside'&&id==='eggplant'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5,l=sphere(g,x+Math.sin(a)*.2,.52,z+Math.cos(a)*.2,.21,mat('#4a9b6b'),[.6,1.5,.5]);l.rotation.z=Math.sin(a)*.4;}return true;}return false;
}
export function flowerBed(g,x,z){for(let i=0;i<8;i++){const xx=x-2.7+(i%4)*1.25,zz=z-1.3+Math.floor(i/4)*2.3;box(g,xx,.47,zz,.9,.36,.85,mat('#b98050'),.06);sphere(g,xx,.74,zz,.43,mat('#6dac73'),[1,.45,1]);}}
export function coconutFarm(g,x,z){for(const [dx,dz]of [[-2,-1.1],[-.2,.9],[-2,1.3]])palm(g,x+dx,z+dz,1.9);box(g,x+2.1,.5,z,1.7,.5,4.1,mat('#dca85f'),.06);}
export function soyFarm(g,x,z){for(const dx of [-1.5,.3]){cylinder(g,x+dx,1.05,z,.66,1.4,mat('#c4c5b4'));cylinder(g,x+dx,1.8,z,.69,.12,mat('#eee6ce'));box(g,x+dx,1,z+.69,.5,.42,.05,mat('#a9b883'),.04);}box(g,x+2.1,.47,z,1.65,.4,4,mat('#b89461'),.07);}
export function themedMachine(g,id,p,store){if(store==='corner')return false;const [x,z]=p.source;
 if(id==='bread'){box(g,x,.87,z,2.65,1.2,2.65,mat(store==='night'?'#526477':'#d88054'),.12);box(g,x,1.55,z,2.45,.16,2.35,mat('#444b51'),.05);for(let i=-4;i<=4;i++)box(g,x+i*.24,1.65,z,.045,.06,2.18,M.chrome,.01);for(const dx of [-.8,0,.8])cylinder(g,x+dx,.99,z+1.37,.1,.08,mat('#f2c464'));box(g,x,1.18,z-1.2,2.5,.75,.12,mat('#8ba0a0'),.04);}
 else{box(g,x,.82,z,2.4,1.15,2.65,mat(store==='night'?'#687993':'#e7b859'),.15);cylinder(g,x,1.82,z,.72,1.1,mat(store==='night'?'#e4eab6':'#f3ca54'));cylinder(g,x,2.45,z,.77,.14,M.white);box(g,x,.99,z+1.38,1.75,.63,.06,mat('#f4e9c7'),.05);for(const dx of [-.45,.45])sphere(g,x+dx,1.03,z+1.45,.1,mat('#76bd9e'));}
 box(g,x+1.7,.49,z,1.1,.24,2.2,mat('#526b70'),.05);for(let j=-3;j<=3;j++){const r=cylinder(g,x+1.7,.64,z+j*.26,.055,1.02,M.chrome);r.rotation.z=Math.PI/2;}box(g,x-1.7,.51,z,.7,.36,1.9,mat('#dfc495'),.04);return true;
}
export function backdrop(g,s){const d=storeDef(s);
 if(d.theme==='seaside'){box(g,-37,-.1,-2,34,.18,120,mat('#5bc3d0'),.1);for(let i=0;i<18;i++)box(g,-26-(i%3)*5,.01,-35+i*4,3.4,.015,.055,mat('#c4f2e7'),.01);for(const [x,z,h]of [[-20,10,3.3],[-21,-4,3.4],[-20,-19,3.6],[32,9,3.7],[31,-19,3.2]])palm(g,x,z,h);box(g,5,.17,24.2,65,.2,3.6,mat('#b98c5d'),.05);for(let x=-25;x<35;x+=2)box(g,x,.3,24.2,.05,.015,3.6,mat('#dcba86'),0);}
 if(d.theme==='night'){for(const z of [-12,0,13]){for(const x of [-3,19.5])cylinder(g,x,2.1,z,.07,4.1,mat('#59728a'));for(let i=0;i<10;i++){const x=-3+i*2.5;const wire=box(g,x,4.13-Math.sin(i*Math.PI/9)*.36,z,2.58,.022,.025,mat('#3c4d67'),.005);if(i%2===0){cylinder(g,x,3.68,z,.2,.39,mat(i%4?'#e8af68':'#d77b85'));cylinder(g,x,3.9,z,.16,.04,mat('#f5d6a0'));}}}for(const x of [-20,34])for(const z of [-22,-6,9]){box(g,x,1.6,z,4,3,3,mat('#4e6380'),.1);for(let i=-1;i<=1;i++)box(g,x+i*.9,2,z+1.52,.5,.75,.025,mat('#e2bb79'),.03);}}
}
export function rankDecor(g,s,{mini=false}={}){const decor=decorFor(s),d=storeDef(s),stars=s.stars||1,accent=mat(decor.tier?decor.accent:d.accent),trim=mat(decor.trim,.4,decor.tier>=3?.18:0),wood=mat(decor.tier>=3?'#4a4c59':'#c19562');
 const root=new T.Group();g.add(root);if(mini){root.scale.setScalar(.6);root.position.set(-.8,-.12,-10);}
 for(const x of [-.8,3.4])cylinder(root,x,1.4,16.3,.075,2.6,wood);box(root,1.3,2.62,16.3,4.8,.76,.23,wood,.07);box(root,1.3,2.63,16.44,4.55,.56,.045,accent,.04);const label=textSprite(d.sign,'#fff6d8',.47);label.position.set(1.3,2.68,16.57);root.add(label);
 for(let i=0;i<5;i++)star(root,.42+i*.43,3.23,16.45,.16,i<stars?'#f6c34f':'#a9b7a4');
 if(stars>=2||decor.tier>0){for(let i=0;i<8;i++){box(root,-.55+i*.53,2.19,16.7,.54,.12,1.3,mat(i%2?decor.trim:decor.tier?decor.accent:d.accent),.025);}for(const x of [-.85,3.45]){box(root,x,.53,16.7,.8,.6,.75,trim,.06);sphere(root,x,.95,16.7,.45,mat('#66ae7d'),[1,.65,1]);sphere(root,x,1.05,16.7,.14,mat('#e9a6b6'));}}
 if(stars>=3&&!mini){box(root,16.4,.67,18.2,2.5,.18,.8,wood,.04);box(root,16.4,1.1,18.5,2.5,.7,.12,wood,.04);for(const x of [15.5,17.3])box(root,x,.4,18.2,.13,.5,.7,trim,.025);}
 if(stars>=4&&!mini){box(root,24,.18,14,12,.2,16,mat(decor.tier?decor.floor:d.floor),.06);for(const x of [19,29]){cylinder(root,x,1.5,18.2,.08,2.8,trim);sphere(root,x,2.93,18.2,.22,mat('#fff1b5'));}const flowers=textSprite('FRESH FLOWERS','#8c697e',.7);flowers.position.set(25,2.3,15.4);root.add(flowers);}
 if(stars>=5&&!mini){cylinder(root,22.2,.55,19,.7,.6,mat('#ece4d2'));box(root,22.2,1.21,19,1,.65,.8,mat('#e4b84e',.3,.4),.1);for(const x of [-.35,.35]){const w=cylinder(root,22.2+x,.84,19,.14,.12,trim);w.rotation.z=Math.PI/2;}star(root,22.2,1.88,19,.36);}
 if(decor.tier>=3&&!mini){for(let x=0;x<18;x+=3)for(let z=-3;z<15;z+=3)if((x+z)%2===0)box(root,x,.304,z,2.9,.018,2.9,mat(decor.tier===4?'#e3d8ed':'#cdc1ab'),0);}
 if(decor.tier===4&&!mini){for(const x of [0,17])box(root,x,.323,4,.06,.015,21,trim,0);for(const z of [-4,14])box(root,8.5,.323,z,17,.015,.06,trim,0);}
}
