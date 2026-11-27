import {normalizeProgression,scoreForDiameter} from './progression.mjs';
import {ITEMS,OBJECT_FOOTPRINTS,LOOKS,COURSES,COLORS,clamp,randomFor} from './data.mjs';
import {buildCourse,frameAt,expectedAt,chapterAt,START_RADIUS,itemPose} from './course.mjs';
import {propGeometry} from './models.mjs';
export const MAX_SECONDS=180,POWER_SECONDS=4,POWER_SPEED=1.22;
export const radiusFor=mass=>Math.cbrt(Math.max(START_RADIUS**3,mass));
export function createRace(course='sunny',seed=1,loadout={}){
 const track=buildCourse(course,seed),progress=normalizeProgression(loadout),p={id:0,name:'你',color:COLORS[0],skill:1,s:7,u:0,targetU:0,radius:START_RADIUS,peakRadius:START_RADIUS,mass:START_RADIUS**3,speed:0,h:0,airAge:0,airDuration:0,jumpHeight:0,jumps:0,jumpCooldown:0,power:0,energy:0,powerUses:0,slow:0,grace:2,bumps:0,collected:0,discovered:new Set(),attachments:[],hitObstacles:new Set(),hitLarge:new Set(),usedRamps:new Set(),finished:false,finishAt:null,decision:0,chapter:0,combo:0,lastCollect:-10,lastJumpS:-50,upgrades:progress.upgrades,shieldCharges:progress.upgrades.shield};
 return{track,players:[p],random:randomFor(seed+995),mode:'ready',time:0,events:[],awarded:false,reason:'finish',seed};
}
export function speedFor(p){return (3.7+p.radius*2.15)*(p.slow>0?.56:1)*(p.power>0?POWER_SPEED:1);}
export function triggerPower(w,p=w.players[0]){if(w.mode!=='play'||p.finished||p.energy<100||p.power>0)return false;p.energy=0;p.power=POWER_SECONDS+(p.upgrades?.duration||0);p.powerUses++;w.events.push({type:'power',player:p.id});return true;}
export function jump(w,p=w.players[0]){if(w.mode!=='play'||p.finished||p.airDuration>0||p.jumpCooldown>0)return false;p.airAge=0;p.airDuration=.82+Math.sqrt(p.radius)*.14;p.jumpHeight=1.05+p.radius*1.25;p.jumpCooldown=1.25;p.lastJumpS=p.s;p.jumps++;w.events.push({type:'jump',player:p.id});return true;}
export function canCollect(p,item){return !(item.takenBy&(1<<p.id))&&item.r<=p.radius*(p.power>0?1.16:.94);}
export function collect(w,p,item){
 if(!canCollect(p,item))return false;const radiusBefore=p.radius,at=itemPose(w.track,item),geometry=propGeometry(item.type);item.takenBy|=1<<p.id;if(p.id===0)item.owner=0;p.mass+=item.volume;p.radius=radiusFor(p.mass);p.peakRadius=Math.max(p.peakRadius||START_RADIUS,p.radius);p.collected++;p.discovered.add(item.type);p.combo=w.time-p.lastCollect<2.3?p.combo+1:1;p.lastCollect=w.time;
 const oldEnergy=p.energy;if(!p.power)p.energy=Math.min(100,p.energy+3.4);p.attachments.push({id:item.id,type:item.type,r:item.r,variant:item.variant,rotation:item.rotation,at:w.time,s:item.s,u:item.u,origin:{x:at.x,y:at.y+geometry.userData.bottom*item.r,z:at.z}});
 w.events.push({type:'collect',player:p.id,item:item.id,itemType:item.type,combo:p.combo,radiusBefore,radiusAfter:p.radius});if(oldEnergy<100&&p.energy===100)w.events.push({type:'power-ready',player:p.id});return true;
}
function bump(w,p,key,item=null){
 if(p.grace>0)return false;if(p.power>0){p.grace=.25;w.events.push({type:'power-guard',player:p.id,key,item});return false;}if(p.shieldCharges>0){p.shieldCharges--;p.grace=1.1;w.events.push({type:'shield-guard',player:p.id,remaining:p.shieldCharges});return false;}p.grace=1.1;p.slow=.9;p.bumps++;p.mass=Math.max(START_RADIUS**3,p.mass*.965);p.radius=radiusFor(p.mass);p.power=0;
 const removed=p.attachments.length>8?p.attachments.splice(-Math.max(1,Math.min(3,Math.floor(p.attachments.length*.025)))):[];
 w.events.push({type:'bump',player:p.id,key,item,removed});return true;
}
// Route driver used only by local regression checks, never as a game opponent.
export function autoplayInput(w,p,dt){
 p.decision-=dt;if(p.decision<=0){
  p.decision=.16+(1-p.skill)*.7;const f=expectedAt(w.track,p.s),ahead=8+p.radius*7.5,candidates=w.track.items.filter(i=>!(i.takenBy&(1<<p.id))&&i.s>p.s+p.radius*.2&&i.s<p.s+ahead&&canCollect(p,i));
  let best=null,bestScore=-Infinity;for(const item of candidates){const value=Math.cbrt(item.volume)*1.3-Math.abs(item.u-p.u)*f.width*.12-(item.s-p.s)*.025+(w.random()-.5)*(1-p.skill)*3;if(value>bestScore){bestScore=value;best=item;}}
  p.targetU=best&&w.random()<p.skill*.92?clamp(best.u+(w.random()-.5)*(1-p.skill)*.55,-.88,.88):Math.sin(p.s*.045+p.id)*.88;
 }
 const obstacle=w.track.obstacles.find(o=>o.s>p.s&&o.s-p.s<3+p.radius*1.8&&Math.abs(o.u-p.u)<.3),big=w.track.items.find(i=>!(i.takenBy&(1<<p.id))&&i.s>p.s&&i.s-p.s<2+p.radius*1.4&&!canCollect(p,i)&&Math.abs(i.u-p.u)<.22);
 const wanderJump=p.skill<.86&&w.random()<dt*(.86-p.skill)*.65;return{targetU:p.targetU,jump:!!(obstacle||big)&&w.random()<p.skill*.3||wanderJump,power:p.energy===100&&p.collected>20&&p.slow<=0&&w.random()<dt*(p.skill>.88?.28:p.skill>.7?.07:.013)};
}
export function stepRace(w,dt,input={}){
 if(w.mode!=='play')return;dt=clamp(dt,0,.05);w.time+=dt;w.events=[];
 for(const p of w.players){
  if(p.finished)continue;const before=frameAt(w.track,p.s,p.u),beforeH=p.h;for(const k of['slow','grace','jumpCooldown','power'])p[k]=Math.max(0,p[k]-dt);
  const control=input;if(control.power)triggerPower(w,p);if(control.jump)jump(w,p);
  const steer=clamp(control.steer||0,-1,1),target=Number.isFinite(control.targetU)?clamp(control.targetU,-.94,.94):clamp(p.u+steer*dt*1.1,-.94,.94);
  const du=(target-p.u)*(Number.isFinite(control.targetU)?1-Math.exp(-dt*13):1),maxDU=(2.8+p.radius*4.4)/expectedAt(w.track,p.s).width*dt;p.u+=clamp(du,-maxDU,maxDU);p.u=clamp(p.u,-.94,.94);
  if(p.airDuration>0){p.airAge+=dt;const t=clamp(p.airAge/p.airDuration,0,1);p.h=4*p.jumpHeight*t*(1-t);if(t===1){p.h=0;p.airDuration=0;w.events.push({type:'land',player:p.id});}}
  const targetSpeed=speedFor(p);p.speed+=(targetSpeed-p.speed)*(1-Math.exp(-dt*4.5));const lastS=p.s;p.s=Math.min(w.track.length,p.s+p.speed*dt);
  const f=frameAt(w.track,p.s,p.u);p.x=f.x;p.y=f.y+p.radius+p.h;p.z=f.z;
  const chapter=chapterAt(w.track,p.s);if(chapter!==p.chapter){p.chapter=chapter;w.events.push({type:'chapter',player:p.id,chapter});}
  const near=p.radius*3+2,segmentX=f.x-before.x,segmentZ=f.z-before.z,segmentLength=segmentX**2+segmentZ**2;
  for(const item of w.track.items){
   const foot=item.r*OBJECT_FOOTPRINTS[item.type];if((item.takenBy&(1<<p.id))||item.s<lastS-near-foot||item.s>p.s+near+foot)continue;
   const at=itemPose(w.track,item),t=segmentLength>1e-10?clamp(((at.x-before.x)*segmentX+(at.z-before.z)*segmentZ)/segmentLength,0,1):1,dx=at.x-(before.x+t*segmentX),dz=at.z-(before.z+t*segmentZ),reach=p.radius+foot*.9+p.radius*(p.upgrades?.magnet||0)*.08+(p.power>0?p.radius*.55:0);
   if(dx*dx+dz*dz>reach*reach)continue;
   const bounds=propGeometry(item.type).boundingBox,itemTop=at.y+(bounds.max.y-bounds.min.y)*item.r,ballBottom=before.y+(f.y-before.y)*t+beforeH+(p.h-beforeH)*t,ballTop=ballBottom+p.radius*2;
   if(itemTop<ballBottom-p.radius*.08||at.y>ballTop+(item.hop?0:p.radius*.08))continue;
   if(canCollect(p,item))collect(w,p,item);else if(!p.hitLarge.has(item.id)){p.hitLarge.add(item.id);bump(w,p,'large',item.id);}
  }
  for(const o of w.track.obstacles){
   if(p.hitObstacles.has(o.id)||Math.abs(p.s-o.s)>p.radius+o.r*.48)continue;const u=o.kind==='sweeper'?o.u+Math.sin(w.time*1.3+o.phase)*.17:o.u;
   if(Math.abs(p.u-u)*f.width<p.radius+o.r&&p.h<o.r*1.4){p.hitObstacles.add(o.id);bump(w,p,o.kind);}
  }
  for(const ramp of w.track.ramps){if(!p.usedRamps.has(ramp.id)&&lastS<ramp.s&&p.s>=ramp.s&&Math.abs(p.u-ramp.u)*f.width<ramp.width){p.usedRamps.add(ramp.id);if(jump(w,p)){p.jumpHeight*=1.3;w.events.push({type:'ramp',player:p.id});}}}
  if(p.s>=w.track.length){p.finished=true;p.finishAt=w.time;w.events.push({type:'finish',player:p.id});}
 }
 if(w.players[0].finished||w.time>=MAX_SECONDS){w.mode='result';w.reason=w.players[0].finished?'finish':'timeout';}
}
export function result(w){const p=w.players[0],peakDiameter=Math.max(p.radius,p.peakRadius||START_RADIUS)*2,score=scoreForDiameter(peakDiameter);return{finished:p.finished,time:p.finishAt??w.time,diameter:p.radius*2,peakDiameter,score,collected:p.collected,bumps:p.bumps,jumps:p.jumps,powerUses:p.powerUses,coins:score,types:[...p.discovered]};}
export function defaultSave(){return{version:2,coins:0,owned:['citrus'],look:'citrus',course:'sunny',sound:true,races:0,wins:0,bestSizes:{},bestTimes:{},discovered:[],...normalizeProgression()};}
export function normalizeSave(raw){const s=defaultSave();if(!raw||typeof raw!=='object')return s;Object.assign(s,normalizeProgression(raw));s.coins=Math.max(0,Math.floor(Number(raw.coins)||0));s.owned=[...new Set(['citrus',...(Array.isArray(raw.owned)?raw.owned:[])])].filter(id=>LOOKS.some(l=>l.id===id));s.look=s.owned.includes(raw.look)?raw.look:'citrus';s.course=COURSES.some(c=>c.id===raw.course)?raw.course:'sunny';s.sound=raw.sound!==false;s.races=Math.max(0,Math.floor(Number(raw.races)||0));s.wins=clamp(Math.floor(Number(raw.wins)||0),0,s.races);s.discovered=[...new Set(Array.isArray(raw.discovered)?raw.discovered:[])].filter(t=>ITEMS[t]);if(raw.version===2)for(const key of['bestSizes','bestTimes'])for(const c of COURSES){const n=Number(raw[key]?.[c.id]);if(Number.isFinite(n)&&n>0)s[key][c.id]=n;}return s;}
export function buyLook(s,id){const look=LOOKS.find(l=>l.id===id);if(!look)return false;if(!s.owned.includes(id)){if(s.coins<look.price)return false;s.coins-=look.price;s.owned.push(id);}s.look=id;return true;}
export function settle(w,s){const r=result(w);if(w.awarded)return r;w.awarded=true;s.coins+=r.score;s.races++;s.discovered=[...new Set([...s.discovered,...r.types])];s.bestSizes[w.track.id]=Math.max(s.bestSizes[w.track.id]||0,r.peakDiameter);if(r.finished)s.bestTimes[w.track.id]=Math.min(s.bestTimes[w.track.id]||Infinity,r.time);return r;}
