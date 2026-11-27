import {buildTrack,frameAt,padNear,isGap,landingSurface,clamp,HALF_WIDTH,COURSE_REVISION,COURSES} from './track.mjs';
export {COURSES} from './track.mjs';
export const BASE_SPEED=16.8,GRAVITY=15,MAX_SECONDS=180;
import {AIR_RANGE,planGlide,advanceGlide} from './glide.mjs';
export {AIR_RANGE} from './glide.mjs';
export const NITRO_METERS=120,NITRO_SECONDS=6,BOT_NITRO_SECONDS=3,NITRO_MULTIPLIER=1.35;
export const LOOKS=[
 {id:'classic',name:'珊瑚先锋',color:'#ff582d',accent:'#ffffff',price:0,kind:'classic'},
 {id:'mint',name:'薄荷浪花',color:'#00d9ac',accent:'#ffffff',price:120,kind:'classic'},
 {id:'flamingo',name:'火烈鸟假日',color:'#ff3294',accent:'#ffe72c',price:240,kind:'flamingo'},
 {id:'shark',name:'蓝鲨破浪',color:'#087ff7',accent:'#e1fcff',price:360,kind:'shark'},
 {id:'aurora',name:'极光飞环',color:'#8b35ff',accent:'#46ffe6',price:560,kind:'aurora'},
 {id:'gold',name:'日冕飞翼',color:'#ffc20c',accent:'#fff5a5',price:850,kind:'gold'}
];
const openLanes=[0,-3.5,-1.7,1.7,3.5,-2.6,2.6,0];
export const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
export function createRace(course='lagoon',seed=Date.now()){
 const track=buildTrack(course),random=rng(seed),names=['你','珊瑚闪电','浪尖猎手','小海盐','浪花队长','椰子同学','海风邮差','慢半拍'],colors=['#ff582d','#107ff7','#9c40ed','#ffc829','#00cdae','#ff3f9b','#69c92b','#22c9ec'];
 const players=names.map((name,id)=>{const s=id===0?10:Math.max(0,7-Math.floor((id-1)/3)*3.2),lane=id===0?0:track.shape==='coil'?((id-1)%3-1)*2.5:openLanes[id],f=frameAt(track,s,lane);return{id,name,color:colors[id],s,lane,lv:0,x:f.x,y:f.y+.18,z:f.z,vx:0,vy:0,vz:0,heading:Math.atan2(f.tx,f.tz),speed:0,state:'slide',skill:[1,.97,.93,.88,.84,.78,.72,.62][id],finished:false,finishAt:null,falls:0,jumps:0,shortcuts:0,bestSkip:0,slow:0,boost:0,cooldown:0,bump:0,grace:2,recover:0,checkpoint:0,airAge:0,launchS:0,cleanMeters:0,nitroReady:false,nitro:0,nitroUses:0,attemptedPads:new Set(),attemptedGaps:new Set(),hitObstacles:new Set(),botDecision:0,botLane:lane,hadJump:false};});
 return{track,random,players,time:0,mode:'ready',events:[],awarded:false,reason:'finish'};
}
export function speedFor(p,f){return BASE_SPEED*(1+clamp(-f.slope,0,.22)*.85)*(p.slow>0?.64:1)*(p.boost>0?1.12:1)*(p.nitro>0?NITRO_MULTIPLIER:1);}
export function activateNitro(w,p=w.players[0]){if(w.mode!=='play'||p.state!=='slide'||p.finished||!p.nitroReady||p.nitro>0)return false;p.nitroReady=false;p.cleanMeters=0;p.nitro=p.id===0?NITRO_SECONDS:BOT_NITRO_SECONDS;p.nitroUses++;w.events.push({type:'nitro',player:p.id});return true;}
function breakClean(w,p){const lost=p.cleanMeters>0&&!p.nitroReady||p.nitro>0;p.cleanMeters=p.nitroReady?NITRO_METERS:0;p.nitro=0;if(lost)w.events.push({type:'clean-break',player:p.id});}
export function canJump(w,p=w.players[0]){return w.mode==='play'&&!p.finished&&p.cooldown<=0&&(p.state==='slide'||p.state==='air'&&p.gapFall&&p.airAge<.28);}
export function jump(w,p){if(!canJump(w,p))return false;
 const rescue=p.state==='air',f=frameAt(w.track,p.s,p.lane),pad=padNear(w.track,p.s),gap=w.track.gaps.find(g=>g.s>p.s-10&&g.s-p.s<28);
 if(!rescue)p.y=f.y+.25;
 p.state='air';p.airAge=0;p.launchS=p.s;p.jumps++;p.cooldown=1.25;p.gapFall=false;
 p.flight=planGlide(w.track,p,pad,gap);p.airTarget=p.flight.targetS;p.vx=p.flight.baseVx;p.vz=p.flight.baseVz;p.vy=11;
 w.events.push({type:'jump',player:p.id,assisted:!!pad,rescue});return true;
}
function advanceAir(track,p,dt,control={}){
 if(p.flight?.kind==='guided')return advanceGlide(track,p,dt,control);
 const previousY=p.y;p.y+=p.vy*dt-GRAVITY*dt*dt*.5;p.vy-=GRAVITY*dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.airAge+=dt;
 return p.vy<0&&p.airAge>.3?landingSurface(track,p.x,p.z,previousY,p.y):null;
}
export function flightForecast(w,p=w.players[0]){
 if(!['slide','air'].includes(p.state))return null;
 const ghost={...p,flight:p.flight?{...p.flight}:null};
 if(p.state==='slide'){const imminent=padNear(w.track,p.s)||w.track.gaps.some(g=>g.s>p.s&&g.s-p.s<28);if(!imminent||p.cooldown>0)return null;const fake={...w,mode:'play',events:[]};if(!jump(fake,ghost))return null;}
 const points=[{x:ghost.x,y:ghost.y,z:ghost.z}];let landing=null;
 for(let n=0;n<330;n++){landing=advanceAir(w.track,ghost,1/60);if(n%5===0||landing)points.push({x:ghost.x,y:ghost.y,z:ghost.z});if(landing||ghost.y<0||ghost.airAge>5)break;}
 return{points,landing,safe:!!landing&&landing.s>p.launchS-5,offset:ghost.flight?.offset||0};
}
function recover(w,p){if(p.state==='recover')return;breakClean(w,p);p.state='recover';p.recover=1.6;p.falls++;p.vy=0;p.speed=0;p.lane=0;p.lv=0;p.flight=null;p.gapFall=false;w.events.push({type:'fall',player:p.id});}
function bot(w,p,dt){
 p.botDecision-=dt;const gap=w.track.gaps.find(g=>g.s>p.s&&g.s-p.s<10),pad=padNear(w.track,p.s);let launch=false;
 if(p.state==='slide'&&p.botDecision<=0){p.botDecision=.2+(1-p.skill)*1.1;const obstacle=w.track.obstacles.find(o=>o.s>p.s&&o.s-p.s<22);p.botLane=obstacle?-Math.sign(obstacle.lane)*2.4:w.track.shape==='coil'?Math.sin(p.s*(p.skill<.7?.11:.021)+p.id*1.7)*(p.skill<.7?3.4:1.3):openLanes[p.id]+Math.sin(p.s*.018+p.id*1.7)*(p.skill<.7?.7:.22);}
 if(p.state==='slide'&&gap&&gap.s-p.s<7.5&&!p.attemptedGaps.has(gap.id)){p.attemptedGaps.add(gap.id);launch=p.falls>0||w.random()<p.skill*.95;}
 if(p.state==='slide'&&pad&&!p.attemptedPads.has(pad.id)&&Math.abs(p.s-pad.s)<3){p.attemptedPads.add(pad.id);launch||=w.random()<clamp((p.skill-.54)*1.7,.08,.78);}
 const safeStraight=!pad&&!w.track.gaps.some(g=>g.s>p.s&&g.s-p.s<48)&&!w.track.obstacles.some(o=>o.s>p.s&&o.s-p.s<30),opponent=w.players.some(q=>q.id!==p.id&&q.state==='slide'&&q.s>p.s+2&&q.s-p.s<(p.skill>.8?34:19));
 return{steer:p.state==='air'?0:clamp((p.botLane-p.lane)*.7,-1,1),jump:launch,nitro:p.nitroReady&&safeStraight&&opponent};
}
export function stepRace(w,dt,input={}){
 if(w.mode!=='play')return;dt=clamp(dt,0,.05);w.events=[];w.time+=dt;
 for(const p of w.players){if(p.finished)continue;for(const key of ['slow','boost','cooldown','bump','grace'])p[key]=Math.max(0,p[key]-dt);
  if(p.state==='recover'){p.recover-=dt;p.y+=(.3-p.y)*Math.min(1,dt*4);if(p.recover<=0){p.s=p.checkpoint;p.state='slide';p.attemptedGaps.clear();p.speed=0;p.cooldown=.6;p.grace=2;const f=frameAt(w.track,p.s);Object.assign(p,{x:f.x,y:f.y+.18,z:f.z});w.events.push({type:'recover',player:p.id});}continue;}
  const control=p.id===0?input:bot(w,p,dt);if(control.nitro)activateNitro(w,p);if(control.jump)jump(w,p);
  if(p.state==='air'){
   const land=advanceAir(w.track,p,dt,control);
   if(land){p.state='slide';p.s=land.s;p.lane=land.lane;p.lv=0;p.y=land.y;p.cooldown=.45;p.grace=Math.max(p.grace,.5);p.flight=null;p.gapFall=false;const gained=p.s-p.launchS;if(gained>65){p.shortcuts++;p.bestSkip=Math.max(p.bestSkip,gained);p.boost=1;w.events.push({type:'shortcut',player:p.id,meters:Math.round(gained)});}else w.events.push({type:'land',player:p.id});}
   if(p.y<-.5||p.airAge>5)recover(w,p);continue;
  }
  p.nitro=Math.max(0,p.nitro-dt);
  const desiredLane=Number.isFinite(control.targetLane)?clamp(control.targetLane,-HALF_WIDTH+.35,HALF_WIDTH-.35):null,targetLV=desiredLane!==null?clamp((desiredLane-p.lane)*13,-7.5,7.5):clamp(control.steer||0,-1,1)*7.5;
  p.lv+=(targetLV-p.lv)*(1-Math.exp(-dt*(Math.abs(targetLV)<.1?24:15)));p.lane=clamp(p.lane+p.lv*dt,-HALF_WIDTH+.35,HALF_WIDTH-.35);
  const f=frameAt(w.track,p.s,p.lane),ahead=frameAt(w.track,p.s+3),back=frameAt(w.track,p.s-3),curvature=(ahead.tx*back.tz-ahead.tz*back.tx)/6,targetSpeed=speedFor(p,f)*(1-(Math.abs(p.lv)/7.5)**2*.035);p.speed+=(targetSpeed-p.speed)*(1-Math.exp(-dt*3.5));
  const previousS=p.s;p.s=Math.min(w.track.length,p.s+p.speed*dt/clamp(1+curvature*p.lane,.8,1.2));
  if(isGap(w.track,p.s)){p.x=f.x;p.y=f.y+.18;p.z=f.z;p.vx=f.tx*p.speed;p.vz=f.tz*p.speed;p.vy=-1;p.state='air';p.airAge=0;p.launchS=p.s;p.airTarget=null;p.flight=null;p.gapFall=true;continue;}
  let hit=false;for(const o of w.track.obstacles){const lane=o.lane+Math.sin(w.time*1.3+o.phase)*.75;if(previousS<=o.s+1&&p.s>=o.s-1&&!p.hitObstacles.has(o.id)&&Math.abs(p.lane-lane)<o.width*.5+.55){p.hitObstacles.add(o.id);p.slow=1.05;p.bump=.45;hit=true;breakClean(w,p);w.events.push({type:'hit',player:p.id});}}
  if(!hit&&!p.nitroReady&&p.nitro===0&&p.slow===0){p.cleanMeters=Math.min(NITRO_METERS,p.cleanMeters+Math.max(0,p.s-previousS));if(p.cleanMeters>=NITRO_METERS){p.nitroReady=true;w.events.push({type:'nitro-ready',player:p.id});}}
  if(w.track.boosts.some(b=>p.s>b.s&&p.s<b.end&&Math.abs(p.lane-b.lane)<b.width*.5))p.boost=.7;
  const now=frameAt(w.track,p.s,p.lane);p.x=now.x;p.y=now.y+.18;p.z=now.z;p.heading=Math.atan2(now.tx,now.tz);
  if(!isGap(w.track,p.s,15))p.checkpoint=Math.max(p.checkpoint,Math.floor(p.s/100)*100);
  if(p.s>=w.track.length-2){p.finished=true;p.finishAt=w.time;p.state='finish';w.events.push({type:'finish',player:p.id});}
 }
 for(let a=0;a<w.players.length;a++)for(let b=a+1;b<w.players.length;b++){const p=w.players[a],q=w.players[b];if(p.state!=='slide'||q.state!=='slide'||p.grace>0||q.grace>0||p.bump>0||q.bump>0||Math.abs(p.s-q.s)>1.6||Math.abs(p.lane-q.lane)>1.25)continue;const dir=p.lane>q.lane?1:-1;p.lv+=dir*1.1;q.lv-=dir*1.1;p.bump=q.bump=.35;breakClean(w,p);breakClean(w,q);}
 if(w.players[0].finished){w.mode='result';w.reason='finish';}else if(w.time>=MAX_SECONDS){w.mode='result';w.reason='timeout';}
}
export function ranking(w){return [...w.players].sort((a,b)=>a.finished&&b.finished?a.finishAt-b.finishAt:a.finished?-1:b.finished?1:b.s-a.s||a.id-b.id);}
export function result(w){const p=w.players[0],rank=ranking(w).findIndex(q=>q.id===0)+1;return{rank,finished:p.finished,time:p.finishAt??w.time,coins:p.finished?([0,200,140,100][rank]||0):0,jumps:p.jumps,shortcuts:p.shortcuts,bestSkip:Math.round(p.bestSkip),falls:p.falls,nitroUses:p.nitroUses};}
export function settle(w,save){const r=result(w);if(!w.awarded){w.awarded=true;save.coins+=r.coins;if(r.finished){save.races++;if(r.rank===1)save.wins++;const best=save.bests[w.track.id];if(!best||r.time<best)save.bests[w.track.id]=r.time;}}return r;}
const currentCourseRevisions=()=>Object.fromEntries(COURSES.map(c=>[c.id,c.revision]));
export function defaultSave(){return{coins:0,owned:['classic'],look:'classic',course:'lagoon',sound:true,wins:0,races:0,bests:{},courseRevision:COURSE_REVISION,courseRevisions:currentCourseRevisions(),legacyBests:{}};}
export function normalizeSave(data){
 const s={...defaultSave(),...(data&&typeof data==='object'?data:{})};
 s.coins=Math.max(0,Math.floor(Number(s.coins)||0));s.owned=['classic',...(Array.isArray(s.owned)?s.owned:[]).filter(id=>LOOKS.some(l=>l.id===id))];s.owned=[...new Set(s.owned)];if(!s.owned.includes(s.look))s.look='classic';
 s.bests=s.bests&&typeof s.bests==='object'?{...s.bests}:{};s.legacyBests=s.legacyBests&&typeof s.legacyBests==='object'?{...s.legacyBests}:{};
 if(data&&data.courseRevision!==COURSE_REVISION){s.legacyBests.shortCourse={...s.bests};s.bests={};}
 const oldLayouts={...s.legacyBests.courseLayouts};
 for(const c of COURSES){const prior=data?.courseRevisions?.[c.id]??data?.courseRevision??COURSE_REVISION;if(prior!==c.revision&&s.bests[c.id]!==undefined){oldLayouts[c.id+'@'+prior]=s.bests[c.id];delete s.bests[c.id];}}
 if(Object.keys(oldLayouts).length)s.legacyBests.courseLayouts=oldLayouts;
 s.courseRevision=COURSE_REVISION;s.courseRevisions=currentCourseRevisions();if(!COURSES.some(c=>c.id===s.course))s.course='lagoon';return s;
}
export function buyLook(save,id){const look=LOOKS.find(l=>l.id===id);if(!look)return false;if(save.owned.includes(id)){save.look=id;return true;}if(save.coins<look.price)return false;save.coins-=look.price;save.owned.push(id);save.look=id;return true;}
export function predictJump(w,p){const pad=padNear(w.track,p.s);return pad?{...pad,target:frameAt(w.track,pad.end)}:null;}
