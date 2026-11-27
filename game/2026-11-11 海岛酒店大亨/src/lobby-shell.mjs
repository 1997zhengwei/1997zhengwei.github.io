import {HOTEL_PALETTE as P} from './palette.mjs';
import * as T from '../vendor/three.module.js';
import {M,mat,box,sphere,cylinder,contactShadow} from './art.mjs';

export function buildLobbyShell(g){
 const wall=mat(P.exterior),glass=new T.MeshPhysicalMaterial({color:'#79d6e8',transparent:true,opacity:.16,roughness:.16,metalness:0,depthWrite:false});
 // Cut-away façade: a solid plinth gives the hotel volume, clear glazing keeps play visible.
 for(const side of [-1,1]){
  const x=side*8.65;
  box(g,x,.75,15.7,8.2,.95,.28,wall,.065);box(g,x,1.26,15.7,8.35,.12,.36,M.white,.045);
  box(g,x,.35,15.72,8.25,.12,.34,M.ivory,.035);
  const pane=box(g,x,2.06,15.7,7.75,1.45,.06,glass,.02);pane.castShadow=false;
  box(g,x,2.86,15.7,8.4,.18,.42,M.white,.05);
  for(const px of [side*4.55,side*8.65,side*12.75]){
   box(g,px,1.63,15.7,.18,2.54,.22,M.ivory,.04);box(g,px,.48,15.72,.28,.27,.29,M.gold,.04);
  }
  box(g,side*12.92,1.22,12.8,.27,1.85,5.6,wall,.065);
  box(g,side*12.92,2.24,12.8,.37,.17,5.75,M.white,.05);
  for(const z of [5.35,9.75,15.7]){
   cylinder(g,side*12.75,1.6,z,.145,2.55,M.white);
   cylinder(g,side*12.75,.45,z,.22,.24,M.gold);
   cylinder(g,side*12.75,2.93,z,.23,.18,M.ivory);
  }
  box(g,side*12.75,3.06,10.5,.38,.2,11,M.white,.05);
  box(g,side*8.65,3.06,15.7,8.6,.2,.42,M.white,.05);
 }
 // A polished seating corner and desk details, placed within existing furniture footprints.
 box(g,9,.301,12.1,5.3,.025,4.7,mat('#d6b564'),.24);
 for(const x of [6.65,11.35])box(g,x,.32,12.1,.032,.01,4.15,M.ivory,.008);
 box(g,8.9,.74,13.2,.57,.025,.45,M.coral,.025);box(g,9.07,.78,13.2,.42,.035,.34,M.white,.015);
 cylinder(g,9.3,.79,13.12,.12,.2,M.white);sphere(g,9.3,.9,13.12,.11,M.green,[1,1.7,1]);
 box(g,.55,1.72,9.87,.62,.045,.42,M.ivory,.03);
 box(g,.6,1.754,9.87,.44,.012,.28,mat('#b8e6ed'),.02);
 for(const x of [-2.0,2.0])box(g,x,1.12,10.69,.035,.6,.02,M.ivory,.01);
}

export function lobbyShadows(g){
 contactShadow(g,0,10.1,6.6,2.5,.22,.302);
 for(const x of [7.8,10.4])contactShadow(g,x,11.4,2.5,2,.22,.302);
 contactShadow(g,9,13.2,2.2,2,.17,.335);
}
