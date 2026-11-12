import * as T from '../vendor/three.module.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {BY_ID} from './data.mjs';

// One colored, sculpted mesh per species, instanced for all sea and tank fish.
export function fishGeometry(kind){
 const s=BY_ID[kind],parts=[],shape={clown:[.96,.48,.30],tang:[.88,.65,.23],koi:[1.13,.43,.32],butterfly:[.86,.76,.20],shark:[1.48,.35,.34],ray:[.81,.18,.47]}[kind];
 function add(g,color,p=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){g=g.clone();const c=new T.Color(color),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(a,3));g.scale(...scale);g.rotateX(rotation[0]);g.rotateY(rotation[1]);g.rotateZ(rotation[2]);g.translate(...p);parts.push(g.index?g.toNonIndexed():g);}
 function orb(color,p,scale){add(new T.SphereGeometry(1,16,10),color,p,scale);}
 function tube(points,r,color){add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(8,points.length*4),r,5,false),color);}
 function web(points,color,position=[0,0,0],rotation=[0,0,0]){const sh=new T.Shape();sh.moveTo(...points[0]);for(let i=1;i<points.length;i++)sh.lineTo(...points[i]);sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:.022,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:1});add(g,color,position,[1,1,1],rotation);}
 const body=new T.SphereGeometry(1,64,32),pos=body.attributes.position,colors=[];
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),wave=x+Math.sin(y*3+z)*.025;let color=s.color;
  if(kind==='clown'){
   const bands=[[-.57,-.34],[.01,.24],[.64,.79]];for(const [a,b] of bands){if(wave>a-.035&&wave<b+.035)color='#513f41';if(wave>a&&wave<b)color='#fff9ed';}
  }else if(kind==='tang'){
   color=y<-.35?'#21aff4':'#1e74e9';if((x<.30&&x>-.67&&y>.02&&y<.45)||x<-.65)color='#20386d';if(x<-.76)color='#ffdf39';
  }else if(kind==='koi'){
   color='#fff5e7';const p=Math.sin(x*7+z*4.3)*Math.cos(y*4.1-z*2);if(p>.13)color='#ff5f38';if(p>.66&&x<.3)color='#43536c';
  }else if(kind==='butterfly'){
   color='#ffd932';if(wave>.42&&wave<.63)color='#253c64';if(wave>.35&&wave<.42||wave>.63&&wave<.69)color='#fff7d5';if(x<-.62)color='#fff8d5';if(x<-.72)color='#273c5c';
  }else if(kind==='shark'){
   color=y<-.12?'#f1fbf7':y>.40?'#468ca6':'#74bed0';
  }else if(kind==='ray'){color=y<0?'#c3f5eb':'#4c76bd';}
  const c=new T.Color(color);if(kind!=='clown'&&kind!=='koi'&&y>.7)c.multiplyScalar(.88);colors.push(c.r,c.g,c.b);
 }
 body.setAttribute('color',new T.Float32BufferAttribute(colors,3));body.scale(...shape);parts.push(body.toNonIndexed());
 if(kind==='ray'){
  for(const side of [-1,1]){
   const sh=new T.Shape();sh.moveTo(.72,0);sh.bezierCurveTo(.25,side*.45,.65,side*1.2,.12,side*1.77);sh.bezierCurveTo(-.55,side*1.2,-.85,side*.65,-.68,0);sh.closePath();add(new T.ShapeGeometry(sh,28),'#568dd0',[0,0,0],[1,1,1],[-Math.PI/2,0,0]);
   for(let i=0;i<15;i++){const zz=side*(.22+(i%4)*.28),xx=-.42+Math.floor(i/4)*.20;orb(i%3?'#9cfff0':'#eaffef',[xx,.06,zz],[.035,.014,.037]);}
   orb('#d8fff4',[.49,.16,side*.23],[.13,.08,.10]);orb('#183f66',[.52,.215,side*.23],[.067,.025,.058]);orb('#ffffff',[.54,.24,side*.21],[.025,.013,.021]);
  }
  tube([[-.5,0,0],[-1.2,-.02,.03],[-2.0,.04,.10],[-2.7,.11,.05]],.038,'#355e99');
 }else{
  const tailColor=kind==='tang'||kind==='butterfly'?'#ffdf44':kind==='koi'?'#ff9c60':kind==='shark'?'#518ea9':'#ff9a33';
  const tail=kind==='shark'?[[-1.12,0],[-2.06,.96],[-1.85,.18],[-2.0,-.58],[-1.5,-.30]]:[[-.73,0],[-1.58,.52],[-1.46,.20],[-1.53,0],[-1.46,-.20],[-1.58,-.52]];
  web(tail,tailColor,[0,0,-.012]);
  for(const yy of [-.35,-.18,.18,.35])tube([[-.8,0,.022],[-1.13,yy*.5,.025],[-1.48,yy,.025]],.009,kind==='shark'?'#d0f2e9':'#fff0b8');
  const dorsalTop=kind==='shark'?1.02:kind==='butterfly'?1.03:.76;
  web([[-.61,.20],[-.43,.49],[-.25,dorsalTop],[.02,dorsalTop*.86],[.38,.35]],kind==='shark'?'#4f8ca6':s.color,[0,0,-.013]);
  if(kind==='shark')web([[-.29,.87],[-.25,1.02],[-.04,.90]],'#23475e',[0,0,-.025]);
  else for(let j=0;j<5;j++)tube([[-.48+j*.15,.28,.028],[-.39+j*.12,.52+Math.sin(j/5*Math.PI)*.12,.028]],.009,kind==='clown'?'#683f34':'#f9edb4');
  for(const side of [-1,1]){
   const ex=shape[0]*.65,ey=shape[1]*.24,ez=shape[2]*.82;
   orb('#17374e',[ex,ey,side*ez],[.145,.15,.078]);orb('#fffcef',[ex+.01,ey,side*(ez+.039)],[.115,.124,.063]);orb(kind==='clown'?'#b38644':'#49b7c5',[ex+.037,ey,side*(ez+.087)],[.079,.086,.037]);orb('#17374e',[ex+.048,ey,side*(ez+.111)],[.049,.058,.020]);orb('#ffffff',[ex+.067,ey+.035,side*(ez+.129)],[.022,.026,.012]);
   const finColor=kind==='shark'?'#598fa3':kind==='tang'?'#ffd33d':s.accent;
   web([[.24,-.05],[-.50,-.44],[-.22,-.04]],finColor,[0,-.08,side*.20],[side*1.05,0,0]);
   for(let j=0;j<3;j++)tube([[.28-j*.07,.16,side*(shape[2]*.92)],[.19-j*.06,-.04,side*shape[2]],[.27-j*.06,-.25,side*(shape[2]*.82)]],.011,kind==='clown'?'#dd5d2a':'#568b9d');
   tube([[shape[0]*.82,-.04,side*(shape[2]*.58)],[shape[0]*.98,-.11,side*.08]],.014,'#73504c');
   if(kind==='koi')tube([[1.03,-.10,side*.11],[1.18,-.18,side*.16],[1.23,-.12,side*.24]],.012,'#ebc58d');
  }
  if(kind==='butterfly')tube([[-.23,.82,0],[-.6,1.20,0],[-1.15,1.12,.03],[-1.46,.88,.08]],.025,'#fff5c2');
 }
 const merged=mergeGeometries(parts);merged.computeVertexNormals();return merged;
}
