import {frameAt,landingSurface,isGap,clamp} from './track.mjs';

export const AIR_RANGE=1.8;
const GRAVITY=15;
const mix=(a,b,t)=>a+(b-a)*t;

function arcPoint(track,flight,u,offset){
 const target=frameAt(track,flight.targetS,offset*flight.sign);
 return{x:mix(flight.startX,target.x,u),z:mix(flight.startZ,target.z,u),y:mix(flight.startY,target.y+.18,u)+.5*GRAVITY*flight.duration**2*u*(1-u)};
}
function clearArc(track,flight,launchS,offset){
 let last=arcPoint(track,flight,0,offset);
 for(let i=1;i<=48;i++){const point=arcPoint(track,flight,i/48,offset);if(point.y<last.y){const hit=landingSurface(track,point.x,point.z,last.y,point.y);if(hit)return hit.s>launchS+3&&Math.abs(hit.s-flight.targetS)<14;}last=point;}
 return true; // The endpoint is a checked, solid part of this same track.
}
export function planGlide(track,p,pad=null,gap=null){
 const normal=[36,32,40,28,44,24,48,20,56,60,16,12],targets=pad?[pad.end,pad.end+6,pad.end-6,...normal.map(g=>p.s+g)]:gap?[gap.end+12,gap.end+18,gap.end+6,...normal.map(g=>p.s+g)]:normal.map(g=>p.s+g);
 let fallback=null;
 for(const at of targets){const targetS=Math.min(track.length-1,Math.max(p.s+4,at));if(targetS<=p.s+3||isGap(track,targetS,2)||track.gaps.some(g=>g.s>targetS&&g.s-targetS<16))continue;
  const end=frameAt(track,targetS),drop=p.y-(end.y+.18),launchVy=pad&&targetS-p.s>65?16:11,duration=clamp((launchVy+Math.sqrt(launchVy**2+2*GRAVITY*Math.max(0,drop)))/GRAVITY,1.8,3.2),vx=(end.x-p.x)/duration,vz=(end.z-p.z)/duration,speed=Math.hypot(vx,vz);
  if(speed>38)continue;
  const rx=-vz/(speed||1),rz=vx/(speed||1),sign=end.rx*rx+end.rz*rz<0?-1:1;
  const flight={kind:'guided',startX:p.x,startY:p.y,startZ:p.z,targetS,duration,baseVx:vx,baseVz:vz,sign,offset:0,aimOffset:0,sideVelocity:0,choice:0,locked:false};
  if(!clearArc(track,flight,p.s,0))continue;fallback??=flight;
  if([-AIR_RANGE,AIR_RANGE].every(offset=>clearArc(track,flight,p.s,offset)))return flight;
 }
 // Tight corners can temporarily narrow the safe corridor to the middle.
 if(fallback)return{...fallback,range:0};
 const targetS=clamp(p.s+8,0,track.length-1),end=frameAt(track,targetS);return{kind:'guided',startX:p.x,startY:p.y,startZ:p.z,targetS,duration:1.8,baseVx:(end.x-p.x)/1.8,baseVz:(end.z-p.z)/1.8,sign:1,offset:0,aimOffset:0,sideVelocity:0,choice:0,locked:false,range:0};
}

export function advanceGlide(track,p,dt,control={}){
 const flight=p.flight,range=flight.range??AIR_RANGE,remaining=flight.duration-p.airAge;
 flight.locked=remaining<.32;
 if(!flight.locked){
  if(Number.isFinite(control.landingSide)){flight.choice=clamp(Math.round(control.landingSide),-1,1);flight.aimOffset=flight.choice*range;}
  else if(Number.isFinite(control.targetLane)){flight.choice=null;flight.aimOffset=clamp(control.targetLane,-range,range);}
  else if(Math.abs(control.steer||0)>.05){flight.choice=null;flight.aimOffset=clamp(flight.aimOffset+control.steer*2.4*dt,-range,range);}
  else if(flight.choice===null){flight.choice=Math.abs(flight.aimOffset)<.28?0:Math.sign(flight.aimOffset);flight.aimOffset=flight.choice*range;}
 }
 const desired=clamp((flight.aimOffset-flight.offset)*13,-3.6,3.6);flight.sideVelocity+=(desired-flight.sideVelocity)*(1-Math.exp(-dt*20));flight.offset=clamp(flight.offset+flight.sideVelocity*dt,-range,range);
 const previous={x:p.x,y:p.y,z:p.z};p.airAge+=dt;const u=Math.min(1,p.airAge/flight.duration),point=arcPoint(track,flight,u,flight.offset);Object.assign(p,point);p.vx=(p.x-previous.x)/dt;p.vz=(p.z-previous.z)/dt;p.vy=(p.y-previous.y)/dt;p.heading=Math.atan2(flight.baseVx,flight.baseVz);
 const hit=p.vy<0?landingSurface(track,p.x,p.z,previous.y,p.y):null;
 if(hit&&hit.s>p.launchS+3)return hit;
 if(u>=1){const target=frameAt(track,flight.targetS,flight.offset*flight.sign);return{s:flight.targetS,lane:flight.offset*flight.sign,y:target.y+.18};}
 return null;
}
