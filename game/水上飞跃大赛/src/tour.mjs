import {clamp,mix} from './track.mjs';

export const TOUR_SECONDS=4;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};

export function createTour(track){
 const min={x:Infinity,y:0,z:Infinity},max={x:-Infinity,y:-Infinity,z:-Infinity};
 for(const p of track.samples){min.x=Math.min(min.x,p.x-6);min.z=Math.min(min.z,p.z-6);max.x=Math.max(max.x,p.x+6);max.y=Math.max(max.y,p.y+8);max.z=Math.max(max.z,p.z+6);}
 const center={x:(min.x+max.x)/2,y:(min.y+max.y)/2,z:(min.z+max.z)/2};
 return{track,center,bounds:track.samples.filter((_,i)=>i%12===0).concat(track.samples.at(-1))};
}

export function tourShot(tour,seconds,aspect=1){
 const {track,center}=tour,t=clamp(seconds,0,TOUR_SECONDS),fraction=ease(t/TOUR_SECONDS),fov=52,tanV=Math.tan(fov*Math.PI/360),tanH=tanV*aspect;
 // Sweep vertically over the structure, without following the route.
 const direction={x:Math.sin(.58)*.82,y:.57,z:Math.cos(.58)*.82},horizontal=Math.hypot(direction.x,direction.z),right={x:direction.z/horizontal,z:-direction.x/horizontal},up={x:-direction.y*direction.x/horizontal,y:horizontal,z:-direction.y*direction.z/horizontal};let distance=60;
 for(const p of tour.bounds)for(const y of[p.y+7,0]){const v={x:p.x-center.x,y:y-center.y,z:p.z-center.z},depth=v.x*direction.x+v.y*direction.y+v.z*direction.z;distance=Math.max(distance,depth+(Math.abs(v.x*right.x+v.z*right.z)+7)/(tanH*.88),depth+Math.abs(v.x*up.x+v.y*up.y+v.z*up.z)/(tanV*(aspect<1?.53:.72)));}
 distance*=1.04;
 const height=track.samples[0].y,focusY=center.y+mix(height*.17,-height*.17,fraction),lookAt={x:center.x,y:focusY,z:center.z};
 const position={x:center.x+direction.x*distance,y:focusY+distance*mix(.68,.43,fraction),z:center.z+direction.z*distance};
 return{position,lookAt,fov,fraction,seconds:t,progress:t/TOUR_SECONDS,title:fraction<.4?'从高处出发':fraction<.8?'一路向下，找到捷径':'终点就在下方',detail:`${Math.round(track.length)}米 · ${track.gaps.length}处断口 · 即将自动开赛`,complete:t>=TOUR_SECONDS};
}
