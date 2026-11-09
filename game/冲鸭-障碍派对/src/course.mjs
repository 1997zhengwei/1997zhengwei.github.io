export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
import {COURSE,hammerPose,jetState,floorCenter,courseCenter} from './tracks.mjs';
import {rivalProfile,nextRandom} from './rivals.mjs';
export {COURSE};
export function floorAt(x,z){return COURSE.floors.find(f=>Math.abs(x-floorCenter(f,z))<f.w/2+.06&&Math.abs(z-f.z)<f.d/2+.06);}
export function spinnerAngle(o,t){return o.phase+t*o.speed;}
export function pusherX(o,t){return o.side*(7.1-4.7*(Math.sin(t*o.speed+o.phase)*.5+.5));}
export function obstacleContact(p,time){
 if(p.y<.87)for(const o of COURSE.spinners){
  const a=spinnerAngle(o,time),dx=p.x-o.x,dz=p.z-o.z,c=Math.cos(a),s=Math.sin(a),along=dx*c+dz*s,across=-dx*s+dz*c;
  if(Math.abs(along)<o.r+.26&&Math.abs(across)<.48)return {id:o.id,x:-s*Math.sign(across||1),z:c*Math.sign(across||1),power:6,type:'spin'};
 }
 for(const o of COURSE.pushers){const x=pusherX(o,time);if(p.y<o.h-.06&&Math.abs(p.x-x)<o.w/2+.28&&Math.abs(p.z-o.z)<o.d/2+.3)return {id:o.id,x:p.x>x?1:-1,z:.18,power:5.8,type:'push'};}
 for(const o of COURSE.hammers){const q=hammerPose(o,time),dx=p.x-q.x,dz=p.z-q.z,dist=Math.hypot(dx,dz);if(dist<1.05&&p.y<q.y+.8&&p.y+1.7>q.y-.8)return {id:o.id,x:dx/(dist||1),z:dz/(dist||1),power:7.3,type:'hammer'};}
 for(const j of COURSE.jets){if(jetState(j,time).active&&Math.hypot(p.x-j.x,p.z-j.z)<j.r+.26&&p.y<3){const dx=p.x-j.x,dz=p.z-j.z,n=Math.hypot(dx,dz)||1;return {id:j.id,x:dx/n,z:dz/n,power:7,type:'jet'};}}
 for(const o of COURSE.bumpers){const dx=p.x-o.x,dz=p.z-o.z,dist=Math.hypot(dx,dz);if(p.y<1.15&&dist<o.r+.3)return {id:o.id,x:dx/(dist||1),z:dz/(dist||1),power:7,type:'bumper'};}
 return null;
}
export function makeRunner({id=0,x=0,z=9,skin='duck',speed=7.3,raceSeed=1}={}){return {id,x,y:0,z,vx:0,vy:0,vz:0,grounded:true,coyote:.1,jumpBuffer:0,stun:0,hurt:0,invuln:0,boost:0,dived:false,airTime:0,padCooldown:0,springFlight:false,speed,skin,checkpoint:0,falls:0,hits:0,jumps:0,dives:0,finishTime:null,waiting:0,seed:id*1.73,lane:(id%5-2)*2.1,...rivalProfile(id,raceSeed),aimX:0,thinkAt:0};}
export function stepRunner(p,input,dt,time){
 const events=[],prevY=p.y;
 p.hurt=Math.max(0,p.hurt-dt);p.invuln=Math.max(0,p.invuln-dt);p.boost=Math.max(0,p.boost-dt);p.waiting=Math.max(0,p.waiting-dt);p.padCooldown=Math.max(0,p.padCooldown-dt);
 if(p.finishTime!==null||p.waiting>0)return events;
 p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);
 p.jumpBuffer=input.jumpPressed?.13:Math.max(0,p.jumpBuffer-dt);
 let ix=clamp(input.x??0,-1,1),iz=clamp(input.z??0,-1,1),n=Math.max(1,Math.hypot(ix,iz));
 if(p.stun>0){p.stun-=dt;p.vx*=Math.exp(-dt*3.5);p.vz*=Math.exp(-dt*3.5);}
 else{const ice=floorAt(p.x,p.z)?.surface==='ice';const a=p.grounded?(ice?6.5:20):7.8,spd=p.speed*(p.boost>0?1.38:1);p.vx+=(ix/n*spd-p.vx)*Math.min(1,a*dt);p.vz+=(iz/n*spd-p.vz)*Math.min(1,a*dt);}
 const spring=COURSE.springs.find(s=>Math.abs(p.x-s.x)<s.w/2&&Math.abs(p.z-s.z)<s.d/2);
 if(spring&&p.grounded&&p.padCooldown<=0&&p.stun<=0){p.vy=spring.power;p.grounded=false;p.coyote=0;p.jumpBuffer=0;p.padCooldown=.7;p.springFlight=true;p.jumps++;events.push('spring');}
 else if(p.jumpBuffer>0&&p.coyote>0&&p.stun<=0){p.vy=9.7;p.springFlight=false;p.grounded=false;p.coyote=0;p.jumpBuffer=0;p.jumps++;events.push('jump');}
 if(input.divePressed&&!p.grounded&&!p.dived&&p.boost<=0&&p.stun<=0){const len=Math.hypot(p.vx,p.vz);p.vx=(len>.2?p.vx/len:0)*12;p.vz=(len>.2?p.vz/len:-1)*12;p.vy=Math.min(p.vy,1.7);p.boost=.32;p.dived=true;p.dives++;events.push('dive');}
 p.vy-=25*dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;
 if(p.grounded)for(const belt of COURSE.belts)if(Math.abs(p.x-belt.x)<belt.w/2&&Math.abs(p.z-belt.z)<belt.d/2){p.z+=(belt.vz??0)*dt;p.x+=(belt.vx??0)*dt;}
 for(const wind of COURSE.winds)if(p.z>wind.z1&&p.z<wind.z2&&p.y<5)p.x+=wind.vx*dt;
 // Low side rails define the stadium lanes; gaps still allow a real fall.
 const f=floorAt(p.x,p.z);p.grounded=false;
 if(f&&p.vy<=0&&prevY>=f.y-.1&&p.y<=f.y+.04){const landing=p.vy<-4;p.y=f.y;p.vy=0;p.grounded=true;p.dived=false;p.springFlight=false;p.airTime=0;if(landing)events.push('land');}
 if(f&&p.grounded&&!f.openEdges){const cx=floorCenter(f,p.z);p.x=clamp(p.x,cx-f.w/2+.32,cx+f.w/2-.32);}
 if(p.invuln<=0){const hit=obstacleContact(p,time);if(hit){p.vx=hit.x*hit.power;p.vz=hit.z*hit.power;p.vy=4;p.grounded=false;p.stun=.43;p.hurt=1.15;p.invuln=1.05;p.hits++;events.push('hit');}}
 if(!p.grounded)p.airTime+=dt;
 for(let i=1;i<COURSE.checkpoints.length;i++)if(p.grounded&&p.z<COURSE.checkpoints[i].z+.4&&i>p.checkpoint){p.checkpoint=i;events.push('checkpoint');}
 if(p.y<-5.5){const cp=COURSE.checkpoints[p.checkpoint];const cf=COURSE.floors.find(q=>Math.abs(cp.z-q.z)<q.d/2+.06),cx=cf?floorCenter(cf,cp.z):cp.x,margin=(cf?.w??16)/2-.7;p.x=cx+(p.id?clamp(p.lane,-margin,margin):0);p.z=cp.z;p.y=0;p.vx=p.vy=p.vz=0;p.grounded=true;p.stun=0;p.invuln=1;p.waiting=.65;p.dived=false;p.springFlight=false;p.airTime=0;p.falls++;events.push('fall');}
 if(p.grounded&&p.z<COURSE.finish&&Math.abs(p.x)<7.8){p.finishTime=time;p.vx=p.vz=0;events.push('finish');}
 return events;
}
export function botInput(p,time){
 if(p.finishTime!==null||p.waiting>0||time<p.startDelay)return {x:0,z:0};
 const f=floorAt(p.x,p.z),skill=p.skill;
 if(time>=p.thinkAt){
  const futureZ=p.z-5,centre=f?.curve?floorCenter(f,futureZ):courseCenter(futureZ);
  const nearHazard=[...COURSE.spinners,...COURSE.pushers,...COURSE.hammers,...COURSE.jets,...COURSE.bumpers].some(o=>p.z>o.z+1&&p.z<o.z+9);
  const edge=f?f.z-f.d/2:0,touching=f&&COURSE.floors.some(o=>o.id!==f.id&&o.z<f.z&&Math.abs(floorCenter(o,o.z+o.d/2)-p.x)<o.w/2-.1&&Math.abs(o.z+o.d/2-edge)<.18),nearGap=f&&!touching&&p.z-edge<5;
  if(p.id!==0&&time>=p.nextMistakeAt&&(nearHazard||nearGap||f?.curve)){
   const r=nextRandom(p);p.mistake=f?.curve&&r>.5?'oversteer':r>.85?'hesitate':'late';
   p.mistakeUntil=time+.3+(1-skill)*1.15+nextRandom(p)*.45;p.nextMistakeAt=time+10+skill*10+nextRandom(p)*12;p.mistakes++;
  }
  const lapse=time<p.mistakeUntil;
  p.alert=!lapse&&nextRandom(p)>.02+(1-skill)*.16;
  const bend=f?.curve?Math.min(1,Math.abs(floorCenter(f,p.z-4)-floorCenter(f,p.z+4))/3.5):0;
  p.throttle=p.pace*(1-(1-skill)*bend*p.cornerFactor)*(.98+nextRandom(p)*.02)*(lapse&&p.mistake==='hesitate'?.35:1);
  if(!lapse||p.mistake==='hesitate'){
   let preferred=centre+p.laneBias*(f?.curve?.35:f?.openEdges?.22:.85);
   const zone=COURSE.aiZones.find(z=>p.z>z.z1&&p.z<z.z2),shortcut=skill>.7&&p.risk>.27;
   if(zone?.type==='boost')preferred=zone.lanes[p.risk>.5?1:0];
   if(zone?.type==='fork')preferred=shortcut?zone.fastX:zone.safeX;
   if(zone?.type==='jump')preferred=clamp(p.laneBias*.4,-2.5,2.5);
   if(zone?.type==='spring')preferred=p.laneBias*.15;
   let candidates=f?.curve?[preferred,centre-2.3,centre-1.2,centre,centre+1.2,centre+2.3]:[preferred,-5.4,-3.2,-1.2,0,1.2,3.2,5.4];
   if(zone?.type==='fork'&&p.z<zone.z2-8)candidates=shortcut?[zone.fastX]:[.1,1.5,2.8,4.4,5.5];
   let best=preferred,bestCost=Infinity;
   for(const x of candidates){
    const landing=floorAt(x,futureZ);let cost=Math.abs(x-preferred)*.16+Math.abs(x-p.x)*.11;
    if(!landing)cost+=15;
    if(p.alert){
     const anticipation=.65+skill*.35;
     for(const o of COURSE.pushers)if(p.z>o.z&&p.z<o.z+11*anticipation){const eta=(p.z-o.z)/p.speed,ox=pusherX(o,time+eta);if(Math.abs(x-ox)<o.w/2+.4)cost+=9;}
     for(const o of COURSE.hammers)if(p.z>o.z-1&&p.z<o.z+13*anticipation){const eta=Math.max(0,(p.z-o.z)/p.speed),q=hammerPose(o,time+eta);if(Math.abs(x-q.x)<1.8)cost+=13;}
     for(const o of COURSE.spinners)if(p.z>o.z&&p.z<o.z+8*anticipation){const eta=(p.z-o.z)/p.speed,a=spinnerAngle(o,time+eta),across=-(x-o.x)*Math.sin(a);if(Math.abs(x-o.x)<o.r+.2&&Math.abs(across)<.65)cost+=2.5;}
     for(const j of COURSE.jets)if(p.z>j.z-1&&p.z<j.z+11*anticipation){const eta=Math.max(0,(p.z-j.z)/p.speed),state=jetState(j,time+eta);if(Math.abs(x-j.x)<j.r+.5)cost+=state.active?19:state.warning?5:0;}
     for(const o of COURSE.bumpers)if(p.z>o.z&&p.z<o.z+7*anticipation&&Math.abs(x-o.x)<1.35)cost+=8;
    }
    cost+=(nextRandom(p)-.5)*(1-skill)*.5;
    if(cost<bestCost){bestCost=cost;best=x;}
   }
   p.aimX=best;
  }
  p.thinkAt=time+p.reaction+nextRandom(p)*.06;
 }
 const dx=p.aimX-p.x,lapse=time<p.mistakeUntil;let jump=false;
 if(f&&p.grounded&&(!lapse||p.mistake==='hesitate')){
  const edge=f.z-f.d/2,dist=p.z-edge,touching=COURSE.floors.some(o=>o.id!==f.id&&o.z<f.z&&Math.abs(p.x-floorCenter(o,o.z+o.d/2))<o.w/2-.1&&Math.abs(o.z+o.d/2-edge)<.18);
  if(!touching&&dist<.4+skill*.35)jump=true;
  const safeStraight=(p.tier==='technical'||p.tier==='expert')&&time>=p.nextTrickAt&&p.alert&&p.stun<=0&&!f.curve&&f.w>=12&&p.z-(f.z-f.d/2)>7&&floorAt(p.x,p.z-5)&&!obstacleContact({...p,z:p.z-2.5,y:0},time+.4);
  if(safeStraight){jump=true;p.nextTrickAt=time+p.trickInterval;p.tricks++;}
  if(p.alert){const threat=obstacleContact({...p,z:p.z-(.9+skill*.8),y:0},time+.12+skill*.12);if(threat&&threat.type!=='hammer')jump=true;}
 }
 const landing=floorAt(p.x,p.z-4.3),roll=Math.sin(p.seed*311.7+(p.jumps+1)*127.1)*43758.5453,diveChance=p.divePreference;
 const dive=!lapse&&!p.grounded&&!p.dived&&!p.springFlight&&p.airTime>p.diveAfter&&p.y>.95&&p.vy>0&&!!landing&&roll-Math.floor(roll)<diveChance;
 const control=clamp(dx*2.2-(f?.surface==='ice'?p.vx*.4:f?.curve?p.vx*.17:0),-1,1);
 return {x:control*p.throttle,z:-p.throttle,jumpPressed:jump,divePressed:dive};
}
export function standings(runners){return [...runners].sort((a,b)=>{if(a.finishTime!==null&&b.finishTime!==null)return a.finishTime-b.finishTime;if(a.finishTime!==null)return -1;if(b.finishTime!==null)return 1;return a.z-b.z;});}
export const SKINS=[
 {id:'duck',name:'元气小黄鸭',rarity:'初始',color:'#ffd22e',price:0,description:'元气满满，先冲再说！'},
 {id:'cat',name:'草莓猫猫',rarity:'初始',color:'#ff86bc',price:0,description:'粉色猫耳，一起冲线。'},
 {id:'shark',name:'冲浪小鲨',rarity:'稀有',color:'#44c8ff',price:60,description:'60 金币解锁'},
 {id:'robot',name:'霓虹机甲',rarity:'史诗',color:'#9260e9',price:120,description:'120 金币解锁'},
 {id:'astro',name:'星际旅人',rarity:'史诗',color:'#f7f8ff',price:180,description:'180 金币解锁'},
 {id:'gold',name:'冠军金鸭',rarity:'传说',color:'#ffbf19',wins:3,description:'赢得 3 次冠军解锁'}
];
