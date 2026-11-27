import {clamp,lerp,smooth,normal,distance,rayBox2D,mixAngle} from './math.mjs';
import {buildWorld,GATES,NAV,supportAt,insideXZ,nearbySolids} from './world.mjs';
import {buildFreeWorld} from './free-world.mjs';
export const BODY={radius:.29,height:1.82,slideHeight:1.12,gravity:21.5,jump:8.6,run:6.8,sprint:9.6,step:.42};
export const MODES=['idle','run','air','vault','hang','mantle','wallrun','slide','roll','respawn'];
const emptyInput={x:0,z:0,jump:false,slide:false,sprint:false,trick:false};
export function createSession({practice=false,ghost=[],free=false,spawn=null}={}){
 const map=free?buildFreeWorld():buildWorld(),s=free?(map.spawns.find(s=>s.id===spawn)||map.spawn):GATES[0].spawn;
 return {map,free,practice,marker:{...s},lastSafe:{...s},chain:0,bestChain:0,earnedCoins:0,banked:0,visited:new Set(),location:free?s.name||'中央天台':'老城天际线',mode:'ready',clock:0,elapsed:0,penalty:0,gate:0,nav:0,score:0,combo:0,comboUntil:0,events:[],eventSeq:0,record:[],recordAt:0,ghost,finished:false,paid:false,
  stats:{jumps:0,vaults:0,climbs:0,wallruns:0,slides:0,rolls:0,falls:0,tricks:0,distance:0},
  player:{x:s.x,y:s.y,z:s.z,yaw:s.yaw,vx:0,vy:0,vz:0,grounded:true,mode:'idle',height:BODY.height,speed:0,airTime:0,airDistance:0,jumpBuffer:0,coyote:.14,slideTime:0,rollTime:0,wallTime:0,wallCooldown:0,wallId:null,wallNormal:null,hang:null,kinematic:null,actionProgress:0,fallStart:s.y,ignoreUntil:0,trick:0,trickLanded:false,stepClock:0},
  scored:new Map()};
}
export function startSession(w,{waitForMove=false}={}){if(w.mode==='ready')w.mode='running';w.waitingForMove=waitForMove;return w;}
function emit(w,type,text,extra={}){const e={id:++w.eventSeq,type,text,time:w.elapsed,...extra};w.events.push(e);if(w.events.length>24)w.events.shift();return e;}
function award(w,type,text,base,key){if(w.practice)return;const last=w.scored.get(key)??-100;if(w.elapsed-last<4)return;w.scored.set(key,w.elapsed);w.combo=w.elapsed<w.comboUntil?Math.min(12,w.combo+1):1;w.comboUntil=w.elapsed+(w.free?5.2:4.2);const points=Math.round(base*(1+.15*(w.combo-1))*(w.free&&w.elapsed-last<35?.5:1));w.score+=points;if(w.free)w.chain+=points;emit(w,type,text,{points,combo:w.combo});}
export function bankFlow(w){if(!w.free||w.chain<=0)return 0;const points=w.chain,coins=Math.min(w.hunt?Math.max(0,6-w.earnedCoins):Infinity,Math.max(1,Math.floor(points/180)));w.banked+=points;w.bestChain=Math.max(w.bestChain,points);w.earnedCoins+=coins;w.chain=0;w.combo=0;emit(w,'bank','连招收下',{points,coins});return coins;}
export function setSessionMarker(w){const p=w.player;if(!w.free||!p.grounded||p.kinematic||p.hang||p.slideTime>0)return false;const ground=supportAt(w.map,p.x,p.z,p.y+.08,-.55);if(!ground||Math.abs(ground.maxY-p.y)>.1)return false;w.marker={x:p.x,y:p.y,z:p.z,yaw:p.yaw};w.markerPlaced=true;emit(w,'marker','已设置自己的练习位置');return true;}
export function returnToMarker(w){if(!w.free)return false;if(w.player.grounded&&!w.player.kinematic)bankFlow(w);else{w.chain=0;w.combo=0;}resetFree(w,w.marker);emit(w,'return','回到练习位置');return true;}
function resetFree(w,s){const p=w.player;Object.assign(p,{x:s.x,y:s.y+.015,z:s.z,yaw:s.yaw,vx:0,vy:0,vz:0,speed:0,grounded:true,mode:'respawn',hang:null,kinematic:null,slideTime:0,rollTime:0,wallTime:0,wallId:null,wallNormal:null,wallCooldown:.4,airTime:0,airDistance:0,jumpBuffer:0,coyote:.14,ignoreUntil:w.elapsed+.55,trick:0,fallStart:s.y});}
function bodyOverlap(p,b,h=p.height){if(p.y+h<=b.minY+.025||p.y>=b.maxY-.035)return null;const qx=clamp(p.x,b.minX,b.maxX),qz=clamp(p.z,b.minZ,b.maxZ),dx=p.x-qx,dz=p.z-qz,len=Math.hypot(dx,dz);if(len>=BODY.radius)return null;if(len>.00001)return {nx:dx/len,nz:dz/len,depth:BODY.radius-len};const sides=[{d:p.x-b.minX,nx:-1,nz:0},{d:b.maxX-p.x,nx:1,nz:0},{d:p.z-b.minZ,nx:0,nz:-1},{d:b.maxZ-p.z,nx:0,nz:1}].sort((a,b)=>a.d-b.d);return {...sides[0],depth:BODY.radius+sides[0].d};}
function headClear(w,x,y,z,height=BODY.height,ignore=null){const temp={x,y:y+.035,z,height};for(const b of w.map.solids)if(b.id!==ignore&&bodyOverlap(temp,b,height))return false;return true;}
function ledgeCandidate(w,p,b,contact,input){
 const rise=b.maxY-p.y,toward=input.x*contact.nx+input.z*contact.nz;
 if(p.grounded||p.kinematic||p.slideTime>0||w.elapsed<p.ignoreUntil||b.w<1.25||b.d<1.25||b.low||rise<.4||rise>1.88||toward>-.18)return null;
 const tx=p.x-contact.nx*.77,tz=p.z-contact.nz*.77;
 if(!insideXZ(b,tx,tz,.02)||!headClear(w,tx,b.maxY+.02,tz,BODY.height,b.id))return null;
 return {id:b.id,top:b.maxY,nx:contact.nx,nz:contact.nz,handX:p.x-contact.nx*.33,handZ:p.z-contact.nz*.33,x:tx,z:tz,time:0};
}
export function tryVault(w,dir){const p=w.player;if(!p.grounded||Math.hypot(dir.x,dir.z)<.2)return false;let candidate=null;
 for(const b of nearbySolids(w.map,p,3)){
  const h=b.maxY-p.y;if(!b.vault||h<.46||h>1.25)continue;const hit=rayBox2D(p.x,p.z,dir.x,dir.z,b,BODY.radius*.65);
  if(!hit||hit.near>1.45||hit.far>3.8)continue;const tx=p.x+dir.x*(hit.far+.58),tz=p.z+dir.z*(hit.far+.58),ground=supportAt(w.map,tx,tz,p.y+.48,.06);
  if(!ground||Math.abs(ground.maxY-p.y)>.5||!headClear(w,tx,ground.maxY+.02,tz,BODY.height,b.id))continue;
  if(!candidate||hit.near<candidate.near)candidate={b,near:hit.near,x:tx,y:ground.maxY,z:tz,handX:p.x+dir.x*(hit.near+.36),handY:b.maxY+.02,handZ:p.z+dir.z*(hit.near+.36)};
 }
 if(!candidate)return false;const c=candidate,duration=clamp(Math.hypot(c.x-p.x,c.z-p.z)/Math.max(4.6,p.speed*.75),.32,.52);p.kinematic={type:'vault',sx:p.x,sy:p.y,sz:p.z,tx:c.x,ty:c.y,tz:c.z,time:0,duration,hand:{x:c.handX,y:c.handY,z:c.handZ},objectId:c.b.id};p.mode='vault';p.vy=0;p.speed=Math.hypot(c.x-p.x,c.z-p.z)/duration;p.vx=dir.x*p.speed;p.vz=dir.z*p.speed;p.grounded=false;p.jumpBuffer=0;p.trick=0;w.stats.vaults++;award(w,'vault','流畅翻越',90,c.b.id);return true;
}
function beginMantle(w){const p=w.player,h=p.hang;p.kinematic={type:'mantle',sx:p.x,sy:p.y,sz:p.z,tx:h.x,ty:h.top,tz:h.z,time:0,duration:.64,hand:{x:h.handX,y:h.top+.04,z:h.handZ},objectId:h.id};p.hang=null;p.mode='mantle';p.jumpBuffer=0;w.stats.climbs++;award(w,'mantle','抓边攀上',110,h.id);}
function stepKinematic(w,input,dt){const p=w.player,k=p.kinematic;k.time+=dt;const t=clamp(k.time/k.duration,0,1),move=k.type==='mantle'?smooth(clamp((t-.24)/.76,0,1)):t+.08*Math.sin(t*Math.PI*2)/(Math.PI*2);p.x=lerp(k.sx,k.tx,move);p.z=lerp(k.sz,k.tz,move);p.y=lerp(k.sy,k.ty,smooth(t))+(k.type==='vault'?Math.sin(t*Math.PI)*.52:Math.sin(t*Math.PI)*.12);p.actionProgress=t;p.mode=k.type;
 if(t>=1){p.x=k.tx;p.y=k.ty;p.z=k.tz;p.kinematic=null;p.mode='run';p.grounded=true;p.coyote=.14;p.ignoreUntil=w.elapsed+.3;const d=normal(input.x,input.z),speed=input.sprint?BODY.sprint:BODY.run;p.vx=d.x*speed*.75;p.vz=d.z*speed*.75;p.vy=0;p.fallStart=p.y;}
}
function nearWall(w,p,dir){for(const b of nearbySolids(w.map,p,1)){if(!b.wallRun||p.y+1.1<b.minY||p.y+1.2>b.maxY)continue;const qx=clamp(p.x,b.minX,b.maxX),qz=clamp(p.z,b.minZ,b.maxZ),n=normal(p.x-qx,p.z-qz),d=Math.hypot(p.x-qx,p.z-qz);if(d<BODY.radius+.18&&d>.01&&Math.abs(n.x*dir.x+n.z*dir.z)<.58)return {b,n};}return null;}
export function respawn(w){if(w.free){w.stats.falls++;w.chain=0;w.combo=0;resetFree(w,w.lastSafe);emit(w,'respawn','回到刚才站稳的屋顶 · 连招中断');return w.player;}const p=w.player,s=GATES[w.gate].spawn;Object.assign(p,{x:s.x,y:s.y+.015,z:s.z,yaw:s.yaw,vx:0,vy:0,vz:0,grounded:true,mode:'respawn',hang:null,kinematic:null,slideTime:0,rollTime:0,wallTime:0,wallId:null,wallNormal:null,wallCooldown:.4,airTime:0,airDistance:0,jumpBuffer:0,coyote:.14,ignoreUntil:w.elapsed+.55,trick:0,fallStart:s.y});w.stats.falls++;if(!w.practice)w.penalty+=2;w.combo=0;w.nav=NAV.findIndex(n=>n.gate>=w.gate);if(w.nav<0)w.nav=NAV.length-1;emit(w,'respawn',w.practice?'回到最近的屋顶':'回到检查点 · +2.0秒');w.record.push([w.clock,p.x,p.y,p.z,p.yaw,9,0,0]);return p;}
function routeProgress(w){const p=w.player;if(w.free){if(p.grounded&&!p.kinematic&&!p.slideTime){const roof=w.map.roofs.find(r=>Math.abs(p.x-r.x)<r.w/2-.8&&Math.abs(p.z-r.z)<r.d/2-.8&&Math.abs(p.y-r.y)<.1);if(roof){w.lastSafe={x:p.x,y:p.y,z:p.z,yaw:p.yaw};w.location=roof.name;w.visited.add(roof.id);}}return;}const next=GATES[w.gate+1];
 const inGate=next&&(w.gate+1===GATES.length-1?Math.abs(p.x-next.x)<5&&p.z<=next.z+.8&&p.z>next.z-5:distance(p,next)<4.5);
 if(next&&inGate&&p.y>next.y-.35&&p.y<next.y+3.8){w.gate++;emit(w,'checkpoint',w.gate===GATES.length-1?'抵达天际线':`检查点 ${w.gate}/${GATES.length-1} · ${next.name}`);while(w.nav<NAV.length-1&&NAV[w.nav].gate<w.gate)w.nav++;if(w.gate===GATES.length-1){w.mode='finished';w.finished=true;w.result={time:w.clock,score:w.score,falls:w.stats.falls,practice:w.practice};p.vx=p.vz=0;sampleRecord(w,true);return;}}
 while(w.nav<NAV.length-1&&distance(p,NAV[w.nav])<1.65)w.nav++;
}
function sampleRecord(w,force=false){if(w.free||w.practice||w.clock>360||w.record.length>=3602)return;if(!force&&w.elapsed-w.recordAt<.1)return;w.recordAt=w.elapsed;const p=w.player;w.record.push([w.clock,p.x,p.y,p.z,p.yaw,Math.max(0,MODES.indexOf(p.mode)),p.actionProgress||0,p.speed]);}
export function stepSession(w,raw={},dt=1/120){
 if(w.mode!=='running')return;dt=clamp(dt,0,.035);const input={...emptyInput,...raw},p=w.player,prev={x:p.x,y:p.y,z:p.z};let d=normal(input.x,input.z),strength=Math.min(1,Math.hypot(input.x,input.z));
 if(w.waitingForMove){if(strength<.04&&!input.jump&&!input.slide)return;w.waitingForMove=false;}
 w.elapsed+=dt;w.clock=w.elapsed+w.penalty;if(w.combo&&w.elapsed>w.comboUntil){if(w.free&&p.grounded)bankFlow(w);else if(!w.free)w.combo=0;}p.landPulse=Math.max(0,(p.landPulse||0)-dt);p.stepClock+=dt;p.jumpBuffer=input.jump?.16:Math.max(0,p.jumpBuffer-dt);p.wallCooldown=Math.max(0,p.wallCooldown-dt);p.ignoreUntil=p.ignoreUntil||0;
 if(p.kinematic){stepKinematic(w,input,dt);routeProgress(w);sampleRecord(w);return;}
 if(p.hang){p.hang.time+=dt;p.mode='hang';p.actionProgress=clamp(p.hang.time/.3,0,1);if(input.slide){p.hang=null;p.vy=-1;p.ignoreUntil=w.elapsed+.5;p.mode='air';}else if(p.hang.time>.14&&(strength>.15||p.jumpBuffer>0))beginMantle(w);w.stats.distance+=distance(prev,p);sampleRecord(w);return;}
 if(input.slide&&p.grounded&&p.slideTime<=0){p.slideTime=.88;p.rollTime=0;p.mode='slide';w.stats.slides++;if(w.free&&p.speed>3)award(w,'slide','低姿滑铲',55,'slide-'+Math.floor(p.x/8)+'-'+Math.floor(p.z/8));else emit(w,'slide',p.speed>2?'低姿滑铲':'压低身体通过');}
 p.slideTime=Math.max(0,p.slideTime-dt);p.rollTime=Math.max(0,p.rollTime-dt);p.height=p.slideTime>0||p.rollTime>0?BODY.slideHeight:BODY.height;
 if(p.height===BODY.height&&!headClear(w,p.x,p.y,p.z,BODY.height)){p.slideTime=.08;p.height=BODY.slideHeight;}
 const wall=!p.grounded&&p.wallCooldown===0&&p.airTime>.05&&strength>.3?nearWall(w,p,d):null;
 const runningWall=wall&&p.speed>4&&p.wallTime<.92;
 if(runningWall){if(p.wallId!==wall.b.id){p.wallId=wall.b.id;w.stats.wallruns++;award(w,'wallrun','沿墙奔跑',150,wall.b.id);}p.wallNormal=wall.n;p.wallTime+=dt;p.mode='wallrun';p.vy=Math.max(p.vy,-1.35);}
 else{p.wallNormal=null;if(p.grounded)p.wallTime=0;}
 if(p.jumpBuffer>0){
  if(runningWall){p.vx=wall.n.x*5.6+d.x*6.6;p.vz=wall.n.z*5.6+d.z*6.6;p.vy=8.8;p.wallCooldown=.42;p.wallNormal=null;p.wallTime=.92;p.jumpBuffer=0;p.mode='air';p.airTime=0;w.stats.jumps++;emit(w,'wallkick','蹬墙跃出');}
  else if(p.grounded||p.coyote>0){if(p.slideTime<=0&&tryVault(w,d)){sampleRecord(w);return;}p.vy=BODY.jump;p.grounded=false;p.coyote=0;p.jumpBuffer=0;p.slideTime=0;p.rollTime=0;p.height=BODY.height;p.mode='air';p.airTime=0;p.airDistance=0;p.fallStart=p.y;p.trick=0;w.stats.jumps++;emit(w,'jump','起跳');}
 }
 if(input.trick&&!p.grounded&&p.airTime>.06&&!p.trick&&p.vy>-.8){p.trick=.001;p.trickKind=input.trickKind||'front';p.trickLanded=false;emit(w,'trick',p.trickKind==='side'?'侧空翻':'前空翻');}
 if(p.trick>0)p.trick=Math.min(1,p.trick+dt/.54);
 const maxSpeed=(input.sprint?BODY.sprint:BODY.run)*(p.rollTime>0?.9:1),acc=p.grounded?48:16;
 const tx=d.x*maxSpeed*strength,tz=d.z*maxSpeed*strength,change=acc*dt;
 if(p.slideTime>0){if(p.grounded){p.vx*=Math.exp(-.6*dt);p.vz*=Math.exp(-.6*dt);}p.vx+=(tx-p.vx)*Math.min(1,dt*2.5);p.vz+=(tz-p.vz)*Math.min(1,dt*2.5);}
 else{const dx=tx-p.vx,dz=tz-p.vz,n=Math.hypot(dx,dz),f=n>change?change/n:1;p.vx+=dx*f;p.vz+=dz*f;}
 p.speed=Math.hypot(p.vx,p.vz);if(p.speed>.2)p.yaw=mixAngle(p.yaw,Math.atan2(-p.vx,-p.vz),Math.min(1,dt*14));
 if(p.grounded){p.coyote=.14;p.airTime=0;}else{p.coyote=Math.max(0,p.coyote-dt);p.airTime+=dt;p.airDistance+=p.speed*dt;p.vy-=BODY.gravity*(runningWall?.18:1)*dt;}
 const oldY=p.y;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;
 let caught=false;
 for(const b of nearbySolids(w.map,p,1.1)){
  if(p.vy<=0&&oldY>=b.maxY-.03&&p.y<=b.maxY+.065&&insideXZ(b,p.x,p.z,.11))continue;
  const c=bodyOverlap(p,b);if(!c)continue;
  const rise=b.maxY-p.y;
  const sx=clamp(p.x,b.minX-.075,b.maxX+.075),sz=clamp(p.z,b.minZ-.075,b.maxZ+.075);
  if(p.grounded&&rise>0&&rise<=BODY.step+.001&&!b.low&&headClear(w,sx,b.maxY+.015,sz,p.height,b.id)){p.x=sx;p.z=sz;p.y=b.maxY;p.vy=0;continue;}
  const ledge=ledgeCandidate(w,p,b,c,d);
  if(ledge){p.hang=ledge;p.y=Math.max(p.y,ledge.top-1.58);p.x=ledge.handX+ledge.nx*.34;p.z=ledge.handZ+ledge.nz*.34;p.vx=p.vy=p.vz=0;p.mode='hang';p.trick=0;emit(w,'grab','抓住边缘 · 向前或跳跃攀上');caught=true;break;}
  p.x+=c.nx*(c.depth+.0001);p.z+=c.nz*(c.depth+.0001);const into=p.vx*c.nx+p.vz*c.nz;if(into<0){p.vx-=c.nx*into;p.vz-=c.nz*into;}
 }
 if(!caught){
  let ground=null;
  for(const b of nearbySolids(w.map,p,.7))if(insideXZ(b,p.x,p.z,.11)&&p.vy<=0&&oldY>=b.maxY-.08&&p.y<=b.maxY+.065&&(!ground||b.maxY>ground.maxY))ground=b;
  if(ground){const impact=-p.vy,wasAir=!p.grounded,travel=p.airDistance;p.y=ground.maxY;p.vy=0;p.grounded=true;p.coyote=.14;
   if(wasAir){p.landPulse=Math.min(.22,impact*.014);if(p.trick>.8&&travel>2.8){w.stats.tricks++;award(w,'trickland',p.trickKind==='side'?'侧空翻落地':'前空翻落地',180,'trick-'+ground.id);}
    else if(travel>3.4)award(w,'precision','稳稳落地',70,'landing-'+ground.id);
    if(impact>11.4){p.rollTime=.58;w.stats.rolls++;emit(w,'roll','卸力翻滚');}p.airTime=0;p.airDistance=0;p.trick=0;p.fallStart=p.y;}
  }else if(p.grounded){const standing=supportAt(w.map,p.x,p.z,p.y+.04,.11);if(!standing||Math.abs(standing.maxY-p.y)>.08){p.grounded=false;p.fallStart=p.y;}else p.y=standing.maxY;}
  if(p.rollTime>0){p.mode='roll';p.actionProgress=1-p.rollTime/.58;}
  else if(p.slideTime>0){p.mode='slide';p.actionProgress=1-p.slideTime/.88;}
  else if(runningWall){p.mode='wallrun';p.actionProgress=p.wallTime/.92;}
  else if(!p.grounded){p.mode='air';p.actionProgress=p.trick||clamp(p.airTime/.8,0,1);}
  else{p.mode=p.speed>.2?'run':'idle';p.actionProgress=0;}
 }
 let reset=false;
 if(p.y<(w.free?w.lastSafe.y-8:GATES[w.gate].y-6.5)||Math.abs(p.x)>210||p.z>110||p.z< -360){respawn(w);reset=true;}
 if(!reset)w.stats.distance+=distance(prev,p);
 routeProgress(w);sampleRecord(w);
}
export function actionHint(w,heading=null){const p=w.player;if(p.hang)return {type:'climb',text:'抓住边缘 · 向前 / 跳跃攀上',distance:0};if(p.kinematic)return {type:p.kinematic.type,text:p.mode==='mantle'?'借力攀上':'翻越接续中',distance:0};if(p.mode==='wallrun')return {type:'wallrun',text:'沿墙奔跑 · 跳跃蹬出',distance:0};if(!p.grounded)return {type:'air',text:p.trick?(p.trickKind==='side'?'侧空翻中 · 看好落点':'前空翻中 · 看好落点'):(w.free?'空中微调 · F 前翻 / G 侧翻':'空中可微调方向 · F转体'),distance:0};
 const dir=heading||normal(p.vx,p.vz),d=Math.hypot(dir.x,dir.z)>.1?dir:{x:-Math.sin(p.yaw),z:-Math.cos(p.yaw)};let obstacle=null;
 for(const b of nearbySolids(w.map,p,4)){
  if(b.maxY<p.y+.44||b.minY>p.y+BODY.height)continue;const hit=rayBox2D(p.x,p.z,d.x,d.z,b,.16);if(!hit||hit.near>.0001&&hit.near>3.2||hit.far<.1)continue;
  if(hit.near<.05&&b.kind==='building')continue;
  const height=b.maxY-p.y,type=b.low?'slide':height<1.25?'vault':height<1.9?'climb':null;if(!type)continue;if(!obstacle||hit.near<obstacle.distance)obstacle={type,distance:hit.near,text:b.low?'低横梁 · C滑铲，或从两侧绕行':type==='vault'?'低栏 '+hit.near.toFixed(1)+'m · 起跳翻越':'高台 '+hit.near.toFixed(1)+'m · 起跳抓边'};
 }
 if(obstacle)return obstacle;
 for(let t=.25;t<3.4;t+=.15){const support=supportAt(w.map,p.x+d.x*t,p.z+d.z*t,p.y+.35,.08);if(!support||support.maxY<p.y-2.2)return {type:'gap',distance:t,text:'断口 '+t.toFixed(1)+'m · 起跳跃过去'};}
 return {type:'run',distance:Infinity,text:w.free?'想去哪里，就朝哪里跑 · 空中 F 前翻 / G 侧翻':'跟随黄色路标 · 拖动右侧转动视角'};
}
