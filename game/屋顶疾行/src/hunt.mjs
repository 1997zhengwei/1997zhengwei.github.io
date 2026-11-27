import {createSession,startSession,stepSession,actionHint,BODY} from './physics.mjs';
import {RoofNavigation} from './navigation.mjs';
import {distance,normal,rayBox3} from './math.mjs';
import {supportAt} from './world.mjs';
import {chooseTreasure} from './treasure-sites.mjs';
import {huntReward} from './equipment.mjs';

function event(w,type,text,extra={}){w.events.push({id:++w.eventSeq,type,text,time:w.elapsed,...extra});if(w.events.length>24)w.events.shift();}
export function createHuntSession(seed=Math.floor(Math.random()*1e9),{level=1,avoidRoof=null,tool='none'}={}){
 const w=createSession({free:true}),nav=new RoofNavigation(w.map),treasure=chooseTreasure(w.map,nav,seed,avoidRoof);
 const pursuers=[6.7,6.35,6.05].map((speed,i)=>{const state=startSession(createSession({free:true,practice:true}));state.map=w.map;const spawn={x:[-9.8,-5.6,8.4][i],y:22,z:12.4,yaw:0};Object.assign(state.player,spawn);state.lastSafe={...spawn};state.marker={...spawn};return {id:i,speed,state,path:[],index:0,replan:0,jumpAt:-10,stuck:0,last:{...spawn},stunnedUntil:0,falls:0,leap:null};});
 w.hunt={seed,level,avoidRoof,treasure,nav,pursuers,lives:3,maxLives:3,status:'running',reason:null,headStart:4,protectedUntil:0,fallCount:0,nearest:Infinity,paid:false,reward:0,tool,charges:tool==='feather'||tool==='smoke'?1:0,guidePath:[],guideAt:0,smokeUntil:0};
 if(tool==='compass')w.hunt.guidePath=nav.path(w.player,treasure);return w;
}
export function useHuntTool(w){const h=w.hunt;if(!h||w.mode!=='running'||h.status!=='running'||w.waitingForMove||h.tool!=='smoke'||h.charges<1)return false;
 const nearby=h.pursuers.filter(b=>Math.hypot(w.player.x-b.state.player.x,w.player.y-b.state.player.y,w.player.z-b.state.player.z)<=12);
 if(!nearby.length)return false;h.charges--;h.smokeUntil=w.elapsed+3;h.smokePosition={x:w.player.x,y:w.player.y,z:w.player.z};
 for(const b of nearby)b.stunnedUntil=Math.max(b.stunnedUntil,w.elapsed+3);event(w,'tool',`烟雾已释放 · 干扰 ${nearby.length} 位追兵3秒`);return true;
}
function supportedLine(map,a,b){const d=distance(a,b),n=Math.max(1,Math.ceil(d/.6));for(let i=0;i<=n;i++){const t=i/n,s=supportAt(map,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,Math.max(a.y,b.y)+.45,.02);if(!s||Math.abs(s.maxY-(a.y+(b.y-a.y)*t))>.48)return false;}return true;}
function driveBot(w,b,dt){
 const p=b.state.player,h=w.hunt,nav=h.nav;if(w.elapsed<b.stunnedUntil)return;
 if(p.grounded&&!p.kinematic&&!p.hang&&(!b.path.length||w.elapsed>b.replan)&&!b.leap){b.path=nav.path(p,w.player);b.index=0;b.replan=w.elapsed+.9+b.id*.13;}
 let goal=b.leap||b.path[b.index];
 if(!goal){goal=nav.nearest(w.player);if(!goal)return;}
 if(!b.leap){
  while(b.index<b.path.length-1&&distance(p,goal)<(b.path[b.index+1]?.jump?.43:.85)&&Math.abs(p.y-goal.y)<.7)goal=b.path[++b.index];
  if(!goal.jump)for(let ahead=Math.min(b.path.length-1,b.index+4);ahead>b.index;ahead--){const candidate=b.path[ahead];if(b.path.slice(b.index,ahead+1).some(n=>n.jump))continue;if(Math.abs(candidate.y-p.y)>.4)continue;if(nav.walkClear(p,candidate)&&supportedLine(w.map,p,candidate)){b.index=ahead;goal=candidate;break;}}
  if(b.index>=b.path.length-2&&distance(p,w.player)<4&&Math.abs(p.y-w.player.y)<.5&&nav.walkClear(p,w.player)&&supportedLine(w.map,p,w.player))goal={...w.player,jump:false};
 }
 let jump=false;
 if(goal.jump&&!b.leap&&p.grounded){const launch=b.path[Math.max(0,b.index-1)];if(launch&&distance(p,launch)>.48)goal=launch;else if(w.elapsed-b.jumpAt>.85){jump=true;b.leap={...goal};b.jumpAt=w.elapsed;}}
 const d=normal(goal.x-p.x,goal.z-p.z),hint=actionHint(b.state,d);
 if(!b.leap&&p.grounded&&w.elapsed-b.jumpAt>.8&&['vault','climb'].includes(hint.type)&&hint.distance<1.1){jump=true;b.jumpAt=w.elapsed;}
 // A runner physically vaults, jumps, climbs or slides using the same collision
 // model as the player; it never moves closer through a teleport or speed boost.
 const input={x:d.x*b.speed/BODY.run,z:d.z*b.speed/BODY.run,sprint:false,jump,slide:hint.type==='slide'&&hint.distance<1.9&&p.slideTime<=0};
 stepSession(b.state,input,dt);
 if(b.leap&&p.grounded&&!p.kinematic&&w.elapsed-b.jumpAt>.3){if(distance(p,b.leap)<1.3||w.elapsed-b.jumpAt>1.5){b.leap=null;b.index++;b.replan=0;}}
 const moved=distance(p,b.last);b.stuck=moved<.004&&!p.hang&&!p.kinematic?b.stuck+dt:0;b.last={x:p.x,y:p.y,z:p.z};
 if(b.stuck>1.1){b.path=[];b.replan=0;if(p.grounded&&w.elapsed-b.jumpAt>1.2){b.state.player.jumpBuffer=.15;b.jumpAt=w.elapsed;}b.stuck=0;}
 if(b.state.stats.falls>b.falls){b.falls=b.state.stats.falls;b.stunnedUntil=w.elapsed+1.8;b.path=[];b.leap=null;b.replan=0;}
}
export function canCapture(map,a,b){
 if(distance(a,b)>.88||Math.abs(a.y-b.y)>1.15)return false;
 const origin={x:a.x,y:a.y+1,z:a.z},dy=b.y-a.y,len=Math.hypot(b.x-a.x,b.z-a.z,dy);if(len<.02)return true;const dir={x:(b.x-a.x)/len,y:dy/len,z:(b.z-a.z)/len};
 return !map.solids.some(box=>{const hit=rayBox3(origin,dir,box,len,0);return hit!==null&&hit>.015&&hit<len-.015;});
}
function end(w,status,reason){const h=w.hunt;if(h.status!=='running')return;h.status=status;h.reason=reason;w.finished=true;w.mode='finished';w.player.vx=w.player.vz=w.player.speed=0;event(w,status==='won'?'treasure':'caught',status==='won'?'找到宝藏！':reason==='caught'?'被追逐者抓到了':'生命耗尽');}
export function stepHunt(w,input={},dt=1/120){
 if(w.mode!=='running'||!w.hunt||w.hunt.status!=='running')return;const h=w.hunt;stepSession(w,input,dt);if(w.waitingForMove)return;
 if(w.stats.falls>h.fallCount){let lost=w.stats.falls-h.fallCount;h.fallCount=w.stats.falls;if(h.tool==='feather'&&h.charges>0){lost--;h.charges--;event(w,'tool','轻羽护符生效 · 本次掉落不扣命');}h.lives=Math.max(0,h.lives-lost);h.protectedUntil=w.elapsed+2;if(lost)event(w,'hunt-fall',`掉落 -${lost} 条命 · 剩余 ${h.lives} 条`);if(h.lives===0){end(w,'lost','lives');return;}}
 if(h.tool==='compass'&&w.elapsed>=h.guideAt){h.guidePath=h.nav.path(w.player,h.treasure);h.guideAt=w.elapsed+1.5;}
 if(w.elapsed>=h.headStart)for(const b of h.pursuers)driveBot(w,b,dt);
 h.nearest=Math.min(...h.pursuers.map(b=>Math.hypot(w.player.x-b.state.player.x,w.player.y-b.state.player.y,w.player.z-b.state.player.z)));
 if(w.elapsed>=h.headStart&&w.elapsed>=h.protectedUntil&&h.pursuers.some(b=>w.elapsed>=b.stunnedUntil&&canCapture(w.map,w.player,b.state.player))){end(w,'lost','caught');return;}
 if(w.player.grounded&&!w.player.kinematic&&distance(w.player,h.treasure)<1.65&&Math.abs(w.player.y-h.treasure.y)<.65){end(w,'won','treasure');}
}
export function settleHunt(w,save){const h=w.hunt;if(!h||h.status==='running'||h.paid)return null;h.paid=true;let reward=0,breakdown=null;if(h.status==='won'){breakdown=huntReward(w);reward=Object.values(breakdown).reduce((a,b)=>a+b,0);save.coins+=reward;save.huntWins=(save.huntWins||0)+1;save.huntBest=save.huntBest===null||!Number.isFinite(save.huntBest)?w.clock:Math.min(save.huntBest,w.clock);if(h.level>=(save.huntLevel||1)){save.huntLevel=h.level+1;save.huntLastRoof=h.treasure.roofId;}}h.reward=reward;return {won:h.status==='won',reason:h.reason,reward,breakdown,level:h.level,time:w.clock,lives:h.lives,treasure:h.treasure.name};}
