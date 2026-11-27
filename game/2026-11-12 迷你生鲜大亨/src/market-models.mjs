import * as T from '../vendor/three.module.js';
import {box,sphere,cylinder,torus,mat,M,batchColors} from './art.mjs';
const petalGeo=new T.SphereGeometry(1,8,6);petalGeo.userData.shared=true;
function petal(g,x,y,z,r,color,scale=[1,.4,1]){const m=new T.Mesh(petalGeo,mat(color));m.position.set(x,y,z);m.scale.set(r*scale[0],r*scale[1],r*scale[2]);g.add(m);}
export function specialProduct(g,id){
 if(id==='mango'){sphere(g,0,.03,0,.4,mat('#ffb72e'),[.92,1.22,.78]);sphere(g,.17,.06,.13,.23,mat('#f88e28'),[.65,1,.5]);const l=sphere(g,-.1,.48,0,.17,mat('#42954c'),[1.5,.22,.7]);l.rotation.z=.5;}
 if(id==='coconut'){sphere(g,0,0,0,.43,mat('#8fa94a'),[1,1.1,.95]);for(let i=-1;i<=1;i++){const strip=box(g,i*.16,0,.4,.025,.5,.035,mat('#a8bd61'),.01);strip.rotation.z=i*.1;}cylinder(g,.1,.45,0,.035,.24,mat('#bf9d5e'));}
 if(id==='pineapple'){sphere(g,0,0,0,.36,mat('#e9b438'),[1,1.28,1]);for(let j=0;j<4;j++)for(let i=0;i<7;i++){const a=i*Math.PI*2/7+j*.4;petal(g,Math.sin(a)*.34,-.25+j*.17,Math.cos(a)*.34,.075,'#bb8736',[1,.9,.6]);}for(let i=0;i<6;i++){const a=i*Math.PI/3,l=sphere(g,Math.sin(a)*.1,.54,Math.cos(a)*.1,.13,mat('#3f9661'),[.55,2.5,.6]);l.rotation.z=Math.sin(a)*.4;l.rotation.x=Math.cos(a)*.4;}}
 if(id==='grilled'){cylinder(g,0,0,0,.4,.2,mat('#e6ae39'));torus(g,0,.12,0,.31,.035,mat('#fff0a0'));for(let i=-1;i<=1;i++){const line=box(g,i*.18,.12,0,.035,.015,.6,mat('#a96934'),.007);line.rotation.y=.25;}sphere(g,.25,.17,0,.11,mat('#6eac57'),[1,.18,1.3]);}
 if(id==='smoothie'||id==='lemonade'){cylinder(g,0,0,0,.28,.7,mat(id==='smoothie'?'#ffd052':'#dceba2'),.34);cylinder(g,0,.38,0,.34,.07,mat('#effafb'));cylinder(g,0,.42,0,.29,.05,mat(id==='smoothie'?'#ffb52c':'#c5e081'));const straw=cylinder(g,.12,.63,0,.025,.53,mat(id==='smoothie'?'#e97580':'#68b2c6'));straw.rotation.z=-.15;for(let i=-1;i<=1;i++)box(g,i*.13,.47,.07,.13,.1,.12,M.white,.025);const wedge=cylinder(g,-.22,.46,0,.17,.06,mat('#ffe987'));wedge.rotation.z=Math.PI/2;}
 if(id==='lemon'){sphere(g,0,0,0,.38,mat('#f5d53b'),[1.3,.9,.9]);sphere(g,-.43,0,0,.1,mat('#efc937'));sphere(g,.43,0,0,.1,mat('#efc937'));sphere(g,.12,.31,0,.14,mat('#579b4f'),[1.5,.2,.6]);}
 if(id==='mushroom'){cylinder(g,0,-.08,0,.15,.52,mat('#fff0d5'));sphere(g,0,.22,0,.4,mat('#bc8f75'),[1,.55,1]);for(const [x,z]of [[-.18,.1],[.13,.24],[.19,-.13]])sphere(g,x,.39,z,.06,mat('#e8cbb1'),[1,.2,1]);}
 if(id==='soymilk'){cylinder(g,0,0,0,.27,.76,mat('#fff0c9'));cylinder(g,0,.45,0,.19,.16,mat('#e5c792'));cylinder(g,0,.56,0,.21,.08,mat('#a77a4e'));box(g,0,0,.27,.33,.3,.035,mat('#b5c78a'),.025);sphere(g,0,0,.3,.08,M.white,[1,.8,.3]);}
 if(id==='skewer'){const stick=cylinder(g,0,0,0,.027,1.2,mat('#ba8a50'));stick.rotation.z=Math.PI/2;for(let i=-1;i<=1;i++){sphere(g,i*.3,.07,0,.19,mat('#a97143'),[.9,.7,1]);box(g,i*.3,.2,0,.035,.025,.25,mat('#5e5236'),.007);}}
 if(['flower','tropicalFlower','moonFlower'].includes(id)){const colors=id==='moonFlower'?['#b9aff5','#8fdbe2','#efd2fb']:id==='tropicalFlower'?['#f67e94','#ffbd68','#f3a5b7']:['#ec8eb5','#e8bd6d','#a99ae1'];cylinder(g,0,-.09,0,.14,.76,mat(id==='moonFlower'?'#6974a9':'#e6d2a8'),.34);for(let i=0;i<5;i++){const a=i*Math.PI*2/5,x=Math.sin(a)*.23,z=Math.cos(a)*.23,y=.43+(i%2)*.08;cylinder(g,x*.5,.22,z*.5,.025,.5,mat('#579363'));for(let j=0;j<5;j++){const b=j*Math.PI*2/5;petal(g,x+Math.sin(b)*.12,y,z+Math.cos(b)*.12,.13,colors[i%3]);}petal(g,x,y+.035,z,.08,'#ffe289',[1,.6,1]);}torus(g,0,-.15,0,.2,.03,mat('#d886a1'));}
}
export function buildTray(g,d={tier:0,color:'#edb85f',trim:'#ffe09b'}){
 const metal=d.tier===1||d.tier>=3,base=mat(d.color,metal?.3:.65,metal?.45:0),trim=mat(d.trim,.35,metal?.5:.05);
 box(g,0,0,0,1.04,.065,.86,base,.035);for(const x of [-.52,.52])box(g,x,.075,0,.045,.15,.84,trim,.012);
 if(d.tier>=1){for(const x of [-.45,.45])for(const z of [-.32,.32])sphere(g,x,.07,z,.045,trim);for(const z of [-.45,.45])box(g,0,.05,z,.45,.08,.065,trim,.02);}
 if(d.tier>=2){for(const x of [-.5,.5])for(const z of [-.4,.4])box(g,x,.025,z,.12,.1,.13,trim,.02);for(let i=-2;i<=2;i++)box(g,i*.15,.04,0,.025,.015,.62,trim,.005);}
 if(d.tier>=3){for(const x of [-.59,.59])sphere(g,x,.1,0,.09,mat(d.tier===4?'#d6b5ff':'#69c5bf'),[.6,1,1]);}
 if(d.tier===4){torus(g,0,-.11,0,.44,.045,mat('#78dce6',.2,.3));cylinder(g,0,-.12,0,.2,.17,mat('#bfadf5',.25,.2));}
 batchColors(g,new T.MeshStandardMaterial({vertexColors:true,roughness:metal?.3:.6,metalness:metal?.4:.02}));
}
