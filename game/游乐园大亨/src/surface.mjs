import * as T from '../vendor/three.module.js';
import {M,mat} from './art.mjs';
let seed=93271;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function texture(draw,size=512){const canvas=document.createElement('canvas');canvas.width=canvas.height=size;draw(canvas.getContext('2d'),size);const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
export function prepareSurfaces(){
 const stone=texture((c,s)=>{c.fillStyle='#8e8a80';c.fillRect(0,0,s,s);const tile=s/8;for(let y=0;y<9;y++)for(let x=-1;x<9;x++){const px=x*tile+(y%2?tile/2:0),py=y*tile,v=222+Math.floor(random()*22);c.fillStyle=`rgb(${v},${v-2},${v-7})`;c.fillRect(px+1.3,py+1.3,tile-2.6,tile-2.6);c.fillStyle='#ffffff35';c.fillRect(px+2,py+2,tile-4,1.2);c.fillStyle='#645a4d24';c.fillRect(px+2,py+tile-3,tile-4,1);}});
 M.path.color.set('#e9d7bb');M.path.map=stone;M.path.bumpMap=stone;M.path.bumpScale=.035;M.path.roughness=.95;M.path.userData.worldTextureScale=.115;
 for(const facade of [mat('#f9e4bb',.7),mat('#cdb392',.88)]){facade.map=stone;facade.bumpMap=stone;facade.bumpScale=.045;facade.userData.worldTextureScale=.19;facade.userData.worldTextureFace=true;}
 const shingles=texture((c,s)=>{c.fillStyle='#a3a3a3';c.fillRect(0,0,s,s);for(let row=0;row<8;row++)for(let col=-1;col<9;col++){const x=(col+(row%2)*.5)*s/8,y=row*s/8,v=195+random()*45;c.fillStyle=`rgb(${v},${v},${v})`;c.beginPath();c.roundRect(x+1,y+1,s/8-2,s/8-2,4);c.fill();c.fillStyle='#ffffff55';c.fillRect(x+3,y+2,s/8-6,1.5);}});shingles.repeat.set(3,2);
 for(const roof of [mat('#244aaf',.32,.18),mat('#683d9c',.38,.1)]){roof.map=shingles;roof.bumpMap=shingles;roof.bumpScale=.04;roof.roughness=.43;}
 const grass=texture((c,s)=>{c.fillStyle='#dbe3cf';c.fillRect(0,0,s,s);for(let i=0;i<18000;i++){const x=random()*s,y=random()*s,v=150+random()*100;c.fillStyle=`rgba(${v},${Math.min(255,v+9)},${Math.max(100,v-20)},.20)`;c.fillRect(x,y,1+random()*2,1+random()*3);}});
 M.grass.color.set('#389747');M.grass.map=grass;M.grass.roughness=1;M.grass.userData.worldTextureScale=.18;
 const water=mat('#1bbbc5',.19,.22);water.envMapIntensity=.9;
 const wood=mat('#8f562c',.63,.03);wood.name='warm carved timber';
 // More saturated lacquer, cool steel and reflective gold distinguish the rides.
 M.white.color.set('#fff9e9');M.cream.color.set('#f6d89b');M.gold.color.set('#f6be43');M.gold.roughness=.27;M.gold.metalness=.52;
 M.navy.color.set('#18335f');M.teal.color.set('#079e9f');M.mint.color.set('#6dd7bc');M.pink.color.set('#e85296');M.red.color.set('#ed3b51');M.blue.color.set('#3198de');M.brown.color.set('#90512e');M.dark.color.set('#22354c');
 for(const m of [M.red,M.pink,M.teal,M.blue]){m.roughness=.35;m.metalness=.12;m.envMapIntensity=.6;}
 M.glass.envMapIntensity=.45;
 return {stone,grass,water,wood};
}
