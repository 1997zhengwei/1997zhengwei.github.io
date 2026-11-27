import {clamp,damp,random,localPoint,worldPoint,roofAt} from './math.mjs';
import {roadX,roadSlope,hammerPosition} from './courses.mjs';
export const PHYSICS={gravity:22.5,jump:13.6,run:12.3,airRun:15.8,side:9.6,radius:.28,coyote:.13,buffer:.16};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.s-b.s);
export class Game{
 constructor(course){this.course=course;this.reset();}
 reset(){
  const c=this.course,r=random(c.seed);this.time=0;this.state='ready';this.events=[];this.trucks=[];this.landings=0;this.jumps=0;this.nearMiss=0;this.bestCombo=0;this.combo=0;this.focus=1;this.focusActive=false;this.focusUsed=0;this.reason='';this.lastTruck=null;this.started=false;this.sparks=0;this.minY=0;
  const rows=Math.ceil((c.length-65)/23.5);
  for(let row=0;row<rows;row++)for(let li=0;li<c.lanes;li++){
   const lane=(li-(c.lanes-1)/2)*4.35,s=24+row*23.5+(li%2)*5+(r()-.5)*1.2,x=roadX(c,s)+lane;
   // Leave a routed opening at dividers instead of spawning trucks inside a future crash queue.
   if(c.obstacles.some(o=>Math.abs(s-o.s)<12.5&&Math.abs(lane-(o.x-roadX(c,o.s)))<o.w/2+1.8))continue;
   this.trucks.push({id:this.trucks.length,row,lane,li,s,x,y:0,yaw:Math.atan(roadSlope(c,s)),pitch:0,roll:0,vx:0,vs:c.speed*(.985+r()*.03),vy:0,targetSpeed:c.speed*(.985+r()*.03),prevX:x,prevS:s,prevY:0,prevYaw:0,oldYaw:0,brake:0,crashed:false,falling:false,hitAt:-100,blink:0,paint:r()>.83?1:0,steer:0,airborne:0,damage:0});
  }
  const t=this.trucks.find(t=>t.row===0&&t.li===Math.floor(c.lanes/2)),start=worldPoint(t,0,-3.8);this.startS=start.s;
  this.player={x:start.x,s:this.startS,y:3.82,vx:0,vs:t.vs,vy:0,yaw:0,grounded:true,support:t.id,localX:0,localS:-3.8,inheritX:0,inheritS:t.vs,relX:0,relS:0,coyote:PHYSICS.coyote,jumpBuffer:0,jumpHeld:false,hold:0,air:0,land:0,crouch:0,transferDistance:0,maxS:this.startS,lastSafe:t.id,airStart:{x:start.x,s:this.startS},slip:0};
  this.emit('reset');
 }
 emit(type,data={}){this.events.push({type,...data});}
 begin(){if(this.state==='ready'){this.state='playing';this.started=true;this.emit('start');}}
 pause(){if(this.state==='playing'){this.state='paused';this.emit('pause');}}
 resume(){if(this.state==='paused'){this.state='playing';this.emit('resume');}}
 fail(reason){if(this.state!=='playing')return;this.state='failed';this.reason=reason;this.focusActive=false;this.emit('fail',{reason});}
 win(){if(this.state!=='playing')return;this.state='won';this.focusActive=false;this.emit('win',{stars:this.stars()});}
 stars(){return 1+(this.landings>=3?1:0)+(this.time<=this.course.par?1:0);}
 jump(){const p=this.player;if(!p.grounded&&p.coyote<=0)return false;p.grounded=false;p.support=null;p.coyote=0;p.vy=PHYSICS.jump;p.jumpBuffer=0;p.hold=0;p.air=0;p.airStart={x:p.x,s:p.s};p.inheritX=p.vx-p.relX;p.inheritS=p.vs-p.relS;this.jumps++;this.emit('jump');return true;}
 updateTrucks(dt){
  const c=this.course;
  for(const t of this.trucks)t.roadOffset=t.x-roadX(c,t.s);
  for(const t of this.trucks){
   t.prevX=t.x;t.prevS=t.s;t.prevY=t.y;t.prevYaw=t.yaw;t.oldYaw=t.yaw;t.brake=Math.max(0,t.brake-dt);t.blink=Math.max(0,t.blink-dt);
   if(t.falling){t.vy-=15*dt;t.y+=t.vy*dt;t.pitch=damp(t.pitch,-.7,1.8,dt);t.roll+=Math.sin(t.id)*dt*.1;t.s+=t.vs*dt;continue;}
   if(t.crashed){t.vs=damp(t.vs,0,1.1,dt);t.s+=t.vs*dt;t.x+=t.vx*dt;t.vx*=Math.exp(-1.7*dt);t.roll=damp(t.roll,t.damage>.75?(t.id%2?1.34:-1.34):Math.sin(t.id)*.10,2,dt);t.pitch=damp(t.pitch,.04,3,dt);t.y=damp(t.y,t.damage>.75?-.5:0,3,dt);continue;}
   let target=t.lane;const obstacles=c.obstacles.filter(o=>o.s-t.s>-10&&o.s-t.s<50);
   for(const o of obstacles){const centre=roadX(c,o.s);if(Math.abs(centre+target-o.x)<o.w/2+1.95){const sign=(t.li>=(c.lanes-1)/2?1:-1),wanted=target+sign*4.35;target=Math.abs(wanted)>(c.lanes-1)*2.175?target-sign*4.35:wanted;t.blink=.4;}}
   let desiredSpeed=t.targetSpeed*(1+Math.sin(this.time*.25+t.id)*.025);
   // Rear-end braking and contact resolve in world coordinates, independent of the player.
   let ahead=null,aheadDistance=Infinity;
   for(const other of this.trucks){if(other===t||other.falling||other.y< -2)continue;const ds=other.s-t.s,lateral=other.roadOffset-t.roadOffset;if(ds>0&&ds<55&&Math.abs(lateral)<3.25&&ds<aheadDistance){ahead=other;aheadDistance=ds;}}
   if(ahead){desiredSpeed=Math.min(c.speed+2,Math.max(0,ahead.vs+(aheadDistance-23.5)*.75));if(aheadDistance<20){desiredSpeed=Math.min(desiredSpeed,Math.max(0,ahead.vs+(aheadDistance-17.1)*1.2));t.brake=.2;}}
   t.vs=damp(t.vs,desiredSpeed,2.3,dt);t.s+=t.vs*dt;const wantX=roadX(c,t.s)+target;
   t.vx=damp(t.vx,clamp((wantX-t.x)*2,-3.4,3.4),4,dt);t.x+=t.vx*dt;t.yaw=damp(t.yaw,Math.atan2(t.vx,Math.max(1,t.vs)),5,dt);
   t.roll=damp(t.roll,-t.vx*.013,4,dt);t.pitch=Math.sin(this.time*2.1+t.id)*.003;
   for(const o of obstacles){if(Math.abs(t.s-o.s)<8.5+o.d/2&&Math.abs(t.x-o.x)<1.64+o.w/2){this.crashTruck(t,.4);t.vs*=.34;t.vx=(t.x>o.x?1:-1)*2.5;break;}}
   for(const h of c.hammers){if(Math.abs(t.s-h.s)>10)continue;const b=hammerPosition(h,this.time);if(b.y-h.radius<3.9&&Math.abs(b.x-t.x)<h.radius+1.7){this.crashTruck(t,.9);t.vx=(b.x<t.x?1:-1)*4;}}
   if(Math.abs(t.x-roadX(c,t.s))>c.width/2+.8||t.s+7.8>c.roadEnd){t.falling=true;t.vy=-.3;if(Math.abs(t.s-this.player.s)<30)this.emit('drop',{x:t.x,s:t.s});}
  }
  // Small, bounded contact correction keeps fleets from interpenetrating.
  for(let i=0;i<this.trucks.length;i++){const a=this.trucks[i];if(a.falling)continue;for(let j=i+1;j<this.trucks.length;j++){const b=this.trucks[j];if(b.falling)continue;const dx=b.x-a.x,ds=b.s-a.s,ox=3.35-Math.abs(dx),os=15.6-Math.abs(ds);if(ox<=0||os<=0)continue;if(ox<os*.32){const q=Math.sign(dx)||1;a.x-=q*ox*.3;b.x+=q*ox*.3;a.vx-=q*.3;b.vx+=q*.3;}else{const rear=ds>0?a:b,front=ds>0?b:a;rear.s-=os*.75;rear.vs=Math.min(rear.vs,front.vs*.9);rear.brake=.3;}}}
 }
 crashTruck(t,damage){if(t.crashed||t.falling)return;t.crashed=true;t.damage=damage;t.brake=10;t.hitAt=this.time;t.vs*=.7;this.emit('crash',{x:t.x,s:t.s,y:2.5,near:dist(t,this.player)<55});}
 step(realDt,input={}){
  if(this.state!=='playing')return;
  const dt=realDt*(input.focus&&this.focus>.01?.38:1);this.focusActive=!!input.focus&&this.focus>.01;
  if(this.focusActive){this.focus=Math.max(0,this.focus-realDt/3.6);this.focusUsed+=realDt;}else this.focus=Math.min(1,this.focus+realDt*.035);
  this.time+=dt;this.updateTrucks(dt);const p=this.player,c=this.course,oldY=p.y;
  p.land=Math.max(0,p.land-dt);p.crouch=damp(p.crouch,input.crouch?1:0,14,dt);p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);if(input.jump)p.jumpBuffer=PHYSICS.buffer;
  p.coyote=p.grounded?PHYSICS.coyote:Math.max(0,p.coyote-dt);
  const ix=clamp(input.x||0,-1,1),iz=clamp(input.z||0,-1,1),yaw=input.yaw||0,norm=Math.max(1,Math.hypot(ix,iz)),speed=input.crouch?5.6:p.grounded?PHYSICS.run:PHYSICS.airRun;
  const rx=(ix*Math.cos(yaw)+iz*Math.sin(yaw))/norm,rz=(-ix*Math.sin(yaw)+iz*Math.cos(yaw))/norm;
  p.relX=damp(p.relX,rx*PHYSICS.side,p.grounded?13:6.8,dt);p.relS=damp(p.relS,rz*speed,p.grounded?13:6.8,dt);
  let support=p.support===null?null:this.trucks[p.support];
  if(p.grounded&&support){
   const carried=worldPoint(support,p.localX,p.localS);p.x=carried.x;p.s=carried.s;
   p.inheritX=(support.x-support.prevX)/dt;p.inheritS=(support.s-support.prevS)/dt;
   // Capture translational and angular velocity at the actual contact point.
   const prev=worldPoint({x:support.prevX,s:support.prevS,yaw:support.prevYaw},p.localX,p.localS);p.inheritX=(carried.x-prev.x)/dt;p.inheritS=(carried.s-prev.s)/dt;
   p.vx=p.inheritX+p.relX;p.vs=p.inheritS+p.relS;p.y=roofAt(support,p.x,p.s,.05)??p.y;
  }else{p.vx=p.inheritX+p.relX;p.vs=p.inheritS+p.relS;}
  if(p.jumpBuffer>0&&(p.grounded||p.coyote>0)&&p.crouch<.6)this.jump();
  p.x+=p.relX*dt+(p.grounded?0:p.inheritX*dt);p.s+=p.relS*dt+(p.grounded?0:p.inheritS*dt);
  if(p.grounded&&support){const y=roofAt(support,p.x,p.s,.12);if(y===null||support.y< -1.3||Math.abs(support.roll)>.5){p.grounded=false;p.support=null;p.vy=Math.min(0,support.vy);p.air=0;p.airStart={x:p.x,s:p.s};}else if(y<p.y-.15){p.grounded=false;p.support=null;p.vy=0;}else{p.y=y;const local=localPoint(support,p.x,p.s);p.localX=local.x;p.localS=local.s;}}
  if(!p.grounded){
   p.air+=dt;p.hold+=dt;
   const held=input.jumpHeld&&p.hold<.15&&p.vy>0;p.vy-=PHYSICS.gravity*(held?.63:1)*dt;p.y+=p.vy*dt;
   if(p.vy<=0){let highest=null,roof=-Infinity;for(const t of this.trucks){if(t.y< -2||Math.abs(t.roll)>.5||Math.abs(t.s-p.s)>10)continue;const y=roofAt(t,p.x,p.s,PHYSICS.radius);if(y!==null&&oldY>=y-.12&&p.y<=y+.08&&y>roof){highest=t;roof=y;}}
    const g=c.goal;if(p.s>=g.minS&&p.s<=g.maxS&&Math.abs(p.x-g.x)<g.w/2&&oldY>=g.y-.15&&p.y<=g.y+.08){p.y=g.y;p.vy=0;p.grounded=true;p.support=null;this.win();return;}
    if(highest){const previous=this.lastTruck,impact=Math.max(0,highest.vy-p.vy);p.y=roof;p.vy=0;p.grounded=true;p.support=highest.id;p.inheritS=highest.vs;p.inheritX=highest.vx;const q=localPoint(highest,p.x,p.s);p.localX=q.x;p.localS=q.s;p.land=.5;
     if(previous!==highest.id&&p.air>.12){this.landings++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);p.transferDistance=dist(p.airStart,p);this.focus=Math.min(1,this.focus+.11);this.emit('land',{transfer:true,combo:this.combo,distance:p.transferDistance,impact});}else this.emit('land',{transfer:false,impact});
     this.lastTruck=highest.id;p.air=0;if(p.jumpBuffer>0)this.jump();
    }
   }
  }
  if(this.lastTruck===null&&support)this.lastTruck=support.id;
  p.maxS=Math.max(p.maxS,p.s);p.yaw=yaw;
  // Only the upper solid volume hits the runner; touching the road is a separate, explicit failure.
  for(const o of c.obstacles){if(p.y<o.h&&p.y+1.65>0&&Math.abs(p.x-o.x)<o.w/2+.24&&Math.abs(p.s-o.s)<o.d/2+.24){this.fail('撞上了分流石柱 · 提前换到旁边的车道');return;}}
  for(const h of c.hammers){if(Math.abs(p.s-h.s)>2.6)continue;const b=hammerPosition(h,this.time),dy=clamp(b.y,p.y+.25,p.y+1.55-p.crouch*.85)-b.y;if(Math.hypot(p.x-b.x,dy,p.s-b.s)<h.radius+.23){this.fail('撞上了摆锤 · 看准摆动间隙，或用慢动作通过');return;}}
  for(const g of c.gates){if(Math.abs(p.s-g.s)<g.d/2+.22&&Math.abs(p.x-g.x)<g.w/2+.25&&p.y+1.65-p.crouch*.85>g.bottom&&p.y<g.top){this.fail('碰到了限高架 · 换车道或按住下蹲');return;}}
  if(p.y<.18){this.fail(p.s>c.roadEnd-22?'终点前还有一道缺口 · 提前助跑，跳上终点平台':'落到了地面 · 试着靠近车头再起跳');return;}
  if(p.y< -8||Math.abs(p.x-roadX(c,p.s))>c.width/2+45){this.fail('落出了车队 · 空中也可以修正方向');return;}
  if(this.time>180)this.fail('车队已经远去 · 沿车顶向前跑，寻找下一辆车');
 }
}
