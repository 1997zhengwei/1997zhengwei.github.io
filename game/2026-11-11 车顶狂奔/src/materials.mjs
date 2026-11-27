import * as T from '../vendor/three.module.js';
import {random} from './math.mjs';
export function generatedTexture(kind,seed=31){
 const n=512,canvas=document.createElement('canvas');canvas.width=canvas.height=n;const ctx=canvas.getContext('2d'),r=random(seed);
 ctx.fillStyle=kind==='rubber'?'#545b5c':kind==='ground'?'#c3bfad':'#eeeeea';ctx.fillRect(0,0,n,n);
 if(kind==='ground'){
  for(let i=0;i<1700;i++){const x=r()*n,y=r()*n,size=.3+r()*2.3;ctx.fillStyle=r()>.5?'#e5decb66':'#8b8b7540';ctx.fillRect(x,y,size,size*.55);}
  for(let i=0;i<30;i++){ctx.beginPath();ctx.moveTo(r()*n,r()*n);for(let j=0;j<4;j++)ctx.lineTo(r()*n,r()*n);ctx.fillStyle=r()>.5?'#d9d0b614':'#8985700b';ctx.fill();}
 }else{
  for(let i=0;i<(kind==='roof'?700:2200);i++){const k=kind==='rubber'?60+r()*50:190+r()*55;ctx.fillStyle=`rgba(${k},${k},${k},${kind==='rubber'?.2:.035})`;ctx.fillRect(r()*n,r()*n,.5+r()*2,.5);}
  if(kind==='roof'){for(let y=16;y<n;y+=64){ctx.fillStyle='#a9b6b522';ctx.fillRect(0,y,n,1);ctx.fillStyle='#ffffff66';ctx.fillRect(0,y+1,n,1);}for(let i=0;i<60;i++){ctx.fillStyle='#8c9a9412';ctx.fillRect(r()*n,r()*n,3+r()*12,.5);}}
  if(kind==='rubber'){for(let y=0;y<n;y+=25){ctx.fillStyle='#252a2b';ctx.fillRect(0,y,n,4);}}
 }
 const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
export function materialPalette(course){
 const m=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const white=m('#f1f5f3',.35),roof=m('#f1f4f1',.56),rubber=m('#242b30',.88),ground=m(course.world===0?'#e8b459':course.ground,1);
 roof.map=generatedTexture('roof');roof.bumpMap=roof.map;roof.bumpScale=.001;
 white.map=generatedTexture('paint');
 rubber.map=generatedTexture('rubber');rubber.bumpMap=rubber.map;rubber.bumpScale=.012;
 ground.map=generatedTexture('ground',course.seed);ground.map.repeat.set(90,90);ground.bumpMap=ground.map;ground.bumpScale=.03;
 const palette={sand:ground,rock:m(course.world===0?'#eadfbb':course.rock,.94),rockDark:m(course.dark,1),white,roof,shade:m('#b4c6c9',.55),metal:m('#8fa8b2',.28,.7),dark:m('#27333d',.74),rubber,
  glass:new T.MeshPhysicalMaterial({color:'#246079',roughness:.12,metalness:.25,clearcoat:1,clearcoatRoughness:.07}),glassLight:m('#acd6de',.2,.22),stripe:m('#dd6635',.56),amber:m('#ffad43',.36),red:m('#bd3c32',.3),light:m('#fff1c5',.25),asphalt:m(course.world===2?'#b9cbd1':'#52616a',.98),concrete:m('#d5d8cd',.86),dust:m('#7d8275',1)};
 palette.light.emissive.set('#fff2c5');palette.light.emissiveIntensity=.4;palette.amber.emissive.set('#e69b31');palette.amber.emissiveIntensity=.12;
 for(const material of Object.values(palette))material.envMapIntensity=.65;
 return palette;
}

export function contactTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,3,64,64,64);gradient.addColorStop(0,'rgba(255,255,255,.92)');gradient.addColorStop(.35,'rgba(255,255,255,.55)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);return new T.CanvasTexture(canvas);
}
