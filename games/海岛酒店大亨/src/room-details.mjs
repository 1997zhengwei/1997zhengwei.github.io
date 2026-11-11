import {HOTEL_PALETTE as P} from './palette.mjs';
import * as T from '../vendor/three.module.js';
import {M,mat,box,sphere,cylinder,textSprite,contactShadow} from './art.mjs';

let skyTexture;
function windowView(){
 if(skyTexture)return skyTexture;
 const c=document.createElement('canvas');c.width=512;c.height=256;
 const p=c.getContext('2d'),sky=p.createLinearGradient(0,0,0,256);
 sky.addColorStop(0,'#7cd7fa');sky.addColorStop(.55,'#c4f1fc');sky.addColorStop(.56,'#40c2d0');sky.addColorStop(1,'#9be7df');p.fillStyle=sky;p.fillRect(0,0,512,256);
 p.fillStyle='#ffffff9c';for(let i=0;i<6;i++){p.beginPath();p.ellipse(40+i*91,39+(i%3)*20,37,10,0,0,Math.PI*2);p.fill();}
 p.strokeStyle='#d6fffa';p.lineWidth=3;for(let i=0;i<12;i++){p.beginPath();p.moveTo((i*67)%480,155+i*7);p.lineTo((i*67)%480+40,155+i*7);p.stroke();}
 skyTexture=new T.CanvasTexture(c);skyTexture.colorSpace=T.SRGBColorSpace;return skyTexture;
}

export function dressWindow(g,r){
 const curtain=mat(P.curtain,.9);
 const shade=mat('#e88620',.9);
 box(g,0,1.66,-3.45,3.9,1.62,.08,M.white,.055);
 box(g,0,1.66,-3.393,3.64,1.36,.025,new T.MeshBasicMaterial({map:windowView()}),.025);
 box(g,0,1.67,-3.36,.065,1.39,.04,M.white,.012);box(g,0,1.61,-3.355,3.7,.045,.045,M.white,.01);
 box(g,0,.94,-3.31,4.05,.12,.32,M.ivory,.04);
 box(g,0,2.5,-3.25,4.8,.12,.25,M.gold,.045);
 for(const side of [-1,1]){
  for(let i=0;i<5;i++){
   const x=side*(1.77+i*.115);
   const fold=cylinder(g,x,1.64,-3.25+(i%2)*.04,.095,1.64,i%2?shade:curtain,.086);fold.scale.z=.67;
  }
  box(g,side*2,1.32,-3.14,.58,.09,.075,M.gold,.025);
  sphere(g,side*2.29,1.25,-3.14,.055,M.gold);
  cylinder(g,side*2.3,1.11,-3.14,.028,.25,M.gold);
 }
}

export function finishRoom(root,g,r){
 const side=Math.sign(r.x),accent=mat(P.bed[r.tier]);
 const sideWindow=new T.Group();sideWindow.position.set(side*4.25,0,-.7);sideWindow.rotation.y=-side*Math.PI/2;g.add(sideWindow);
 box(sideWindow,0,1.62,0,2.25,1.25,.065,M.white,.04);box(sideWindow,0,1.62,.044,2.05,1.05,.025,new T.MeshBasicMaterial({map:windowView()}),.02);
 box(sideWindow,0,1.62,.066,.06,1.08,.025,M.white,.01);box(sideWindow,0,1.03,.08,2.4,.12,.23,M.ivory,.03);
 for(const sx of [-1.1,1.1])for(let i=0;i<3;i++){const fold=cylinder(sideWindow,sx+(i-1)*.1,1.62,.12,.077,1.4,mat(r.tier===3?'#f4c259':'#ffae67'),.073);fold.scale.z=.65;}
 box(sideWindow,0,2.37,.08,2.75,.09,.18,M.gold,.025);
 box(g,side*4.603,1.37,0,.035,2.1,7.3,mat(P.exterior),.006);box(g,0,.68,3.805,9,.78,.035,mat(P.exterior),.006);
 // Baseboards, wardrobe doors and a framed tropical print give the shell scale.
 box(g,0,.49,-3.46,8.6,.15,.07,M.ivory,.02);
 box(g,side*4.27,.49,0,.07,.15,7.05,M.ivory,.02);
 box(g,side*3.52,1.15,2.703,.025,1.24,.025,mat('#b36820'),.008);
 for(const dx of [-.14,.14]){const handle=cylinder(g,side*3.52+dx,1.16,2.726,.022,.18,M.gold);handle.rotation.z=.05;}
 for(const x of [-.35,.35])for(const z of [-.56,.56])cylinder(g,side*3.52+x,.42,1.8+z,.035,.19,M.gold);
 const ax=-side*3.15;box(g,ax,1.83,-3.46,.92,.95,.07,M.ivory,.035);box(g,ax,1.83,-3.407,.76,.78,.025,mat('#4abadd'),.018);
 sphere(g,ax+.19,2.02,-3.38,.12,mat('#ffe4a6'),[1,1,.12]);
 const leaf=box(g,ax-.08,1.75,-3.38,.16,.45,.025,mat('#299b88'),.07);leaf.rotation.z=-.45;
 box(g,ax-.1,1.62,-3.38,.41,.035,.025,M.ivory,.01);
 // Turned-down linen, piping and tufted headboard; the moving quilt remains separate.
 box(g,0,1.295,-1.47,3.61,.075,.38,M.white,.07);
 box(g,0,1.333,-1.35,3.55,.019,.035,accent,.007);
 for(const x of [-1.79,1.79])box(g,x,1.265,-.3,.027,.022,2.19,mat('#e9fffa'),.009);
 box(g,0,1.264,.8,3.58,.021,.028,mat('#e9fffa'),.009);
 for(const x of [-1.38,-.7,0,.7,1.38])box(g,x,1.43,-2.51,.026,.76,.025,mat('#da7d25'),.01);
 if(r.tier>=2){
  for(const x of [-.74,.74]){const cushion=box(g,x,1.37,-1.68,.62,.24,.49,accent,.12);cushion.rotation.y=x<0?-.12:.12;}
 }
 // Door number is part of the building, leaving the work area unobstructed.
 const number=textSprite(String(r.id),'#246d8a',.27,'#fff9e9');number.position.set(-side*4.1,1.62,2.63);g.add(number);
 for(const z of [-2.4,1.8])contactShadow(root,side*3.4,z,1.45,1.8,.16,.405);
 contactShadow(root,0,-.65,5.6,5.1,.2,.405);
}

export function constructionPad(g,r){
 box(g,0,.32,0,8.6,.14,7.1,mat('#82c873'),.09);
 const blueprint=mat('#ebffff');
 for(const x of [-3.7,3.7])for(let z=-2.7;z<3;z+=.65)box(g,x,.403,z,.045,.015,.32,blueprint,.008);
 for(const z of [-2.9,2.9])for(let x=-3.5;x<3.6;x+=.65)box(g,x,.403,z,.32,.015,.045,blueprint,.008);
 for(const x of [-3.9,3.9])for(const z of [-3.1,3.1]){cylinder(g,x,.65,z,.075,.65,M.white);sphere(g,x,1,z,.12,M.gold);}
 box(g,0,.43,-.4,3.6,.025,3.45,mat('#4cb382'),.09);
 for(const x of [-1.65,1.65])box(g,x,.46,-.4,.035,.025,3.2,M.white,.008);
 for(const z of [-1.95,1.15])box(g,0,.46,z,3.3,.025,.035,M.white,.008);
 box(g,0,.46,-1.35,2.8,.025,.75,blueprint,.07);
 // A small stack of materials makes the plot read as a hotel under construction.
 for(let i=0;i<3;i++)box(g,2.4,.49+i*.13,1.9,.8,.12,1.1,mat('#e2b16c'),.035);
 box(g,-2.8,.62,-1.9,.6,.45,.65,M.ivory,.05);
}
