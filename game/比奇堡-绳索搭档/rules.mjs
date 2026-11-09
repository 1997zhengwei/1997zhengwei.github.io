import {ROUTE_STRIDE,ROUTE_FINISH} from './landing.mjs?v=elastic-2';
import {PHYSICS,integratePair,planLaunch} from './physics.mjs?v=elastic-2';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const CHAPTERS=[{name:'菠萝屋出发',en:'PINEAPPLE PROMENADE',end:9*ROUTE_STRIDE},{name:'穿越水母田',en:'JELLYFISH FIELDS',end:18*ROUTE_STRIDE},{name:'蟹堡王在前方',en:'THE KRUSTY FINISH',end:ROUTE_FINISH}];
export const chapterIndex=x=>clamp(Math.floor(x/(9*ROUTE_STRIDE)),0,2);
function makePlatform(id){return {id,x:id*ROUTE_STRIDE+Math.sin(id*.8)*.48,y:0,w:id%9===0?3.8:id<4?2.65:2.3+(id%3)*.16,type:id%9===0?'sand':['wood','coral','glass'][Math.min(2,Math.floor((id-1)/9))],checkpoint:id%9===0,burger:id%2===0,jelly:id>10&&id%5===2,seed:id*.97};}
export function makeRoute(endless=false){
 const p=[{id:0,x:-1,y:0,w:12.8,type:'sand',checkpoint:true}];for(let i=1;i<=(endless?88:28);i++)p.push(makePlatform(i));
 if(!endless)Object.assign(p.at(-1),{x:ROUTE_FINISH,w:8,type:'sand',finish:true,checkpoint:false,jelly:false});return p;
}
export function platformAt(s,x,y,tolerance=.1){return s.platforms.find(p=>Math.abs(x-p.x)<p.w/2-.08&&Math.abs(y-p.y)<tolerance)||null;}
function makeActor(x,index){return {x,y:0,vx:0,vy:0,mass:index===0?1:1.08,grounded:true,supportId:0,hopping:false,hopAge:0,hopCooldown:0,impactAge:-1,landAge:0};}
export function createGame({mode='easy',endless=false}={}){return {mode,endless,phase:'ready',platforms:makeRoute(endless),actors:[makeActor(0,0),makeActor(-2.2,1)],anchor:0,length:4.4,pendingLength:4.4,time:0,elapsed:0,accumulator:0,holding:false,hopDir:0,canCatch:false,candidate:null,swaps:0,combo:0,bestCombo:0,perfect:0,hops:0,burgers:0,collected:[],distance:0,checkpoint:0,checkpointX:0,checkpointAnchor:0,checkpointCollected:[],checkpointBurgers:0,checkpointSwaps:0,checkpointPerfect:0,retries:0,fallTime:0,fallStart:null,reason:null,events:[],invulnerable:0,shields:mode==='easy'?1:0,shieldTime:0,theta:Math.PI,landing:null,preview:[],rope:{distance:2.2,extension:0,tension:0,pulse:0},buffer:0};}
export function event(s,type,data={}){s.events.push({type,...data});}
export function setLength(s,n){if(!Number.isFinite(n))return;s.pendingLength=clamp(n,3.4,5.2);if(s.phase==='ready')s.length=s.pendingLength;}
function launch(s,index){
 const a=s.actors[s.anchor],f=s.actors[index],nominal=a.x+s.length;
 const p=s.platforms.filter(p=>p.x>a.x+1.5).sort((x,y)=>Math.abs(x.x-nominal)-Math.abs(y.x-nominal))[0];
 const target=p&&Math.abs(p.x-nominal)<p.w/2+.35?clamp(nominal,p.x-p.w/2+.24,p.x+p.w/2-.24):nominal;
 const plan=planLaunch(f,a,s.length,target,f.mass);
 Object.assign(f,{vx:plan.vx,vy:plan.vy,grounded:false,hopping:false,impactAge:-1,landAge:0});
 s.preview=plan.path.points;s.rope.pulse=Math.max(s.rope.pulse,.5);s.canCatch=false;s.candidate=null;
}
export function start(s){if(s.phase==='ready'){s.phase='playing';launch(s,1-s.anchor);event(s,'start');}}
export function act(s){
 if(s.phase==='ready'){start(s);return true;}if(s.phase!=='playing')return false;if(s.canCatch)return catchPartner(s);
 const f=s.actors[1-s.anchor];if(f.grounded&&f.impactAge<.24){s.buffer=.3;return false;}
 if(s.mode==='challenge'){beginFall(s,'空中换手太早了，等脚下圆环变绿。');return false;}s.buffer=.24;return false;
}
export function hop(s,direction){
 if(s.phase!=='playing'||!direction)return false;const a=s.actors[s.anchor];if(!a.grounded||a.hopCooldown>0)return false;
 const dir=Math.sign(direction);Object.assign(a,{grounded:false,hopping:true,hopAge:0,vx:dir*1.15,vy:s.anchor===0?1.95:1.85,impactAge:-1,hopCooldown:.12});
 s.hops++;s.preview=[];s.rope.pulse=Math.max(s.rope.pulse,.35);event(s,'hop',{actor:s.anchor,x:a.x,y:a.y,direction:dir});return true;
}
export function catchPartner(s){
 if(s.phase!=='playing'||!s.canCatch||!s.candidate)return false;const next=1-s.anchor,a=s.actors[next],p=s.candidate;
 s.anchor=next;s.length=s.pendingLength;s.buffer=0;s.canCatch=false;s.candidate=null;s.swaps++;s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);
 if(a.landAge<.5){s.perfect++;event(s,'perfect',{x:a.x,y:a.y});}else event(s,'catch',{x:a.x,y:a.y});s.distance=Math.max(s.distance,Math.round(a.x*3));
 if(p.checkpoint&&p.id>s.checkpoint){s.checkpoint=p.id;s.checkpointX=a.x;s.checkpointAnchor=next;s.checkpointCollected=[...s.collected];s.checkpointBurgers=s.burgers;s.checkpointSwaps=s.swaps;s.checkpointPerfect=s.perfect;s.shields=s.mode==='easy'?1:0;event(s,'checkpoint');}
 if(p.finish){s.phase='won';s.hopDir=0;a.impactAge=.28;s.landing=null;event(s,'won');return true;}
 if(s.endless&&p.id>=s.platforms.length-5){const last=s.platforms.at(-1).id;for(let i=1;i<=25;i++)s.platforms.push(makePlatform(last+i));}
 launch(s,1-next);return true;
}
export function beginFall(s,reason){if(s.phase!=='playing')return;s.phase='falling';s.reason=reason;s.fallTime=0;s.combo=0;s.hopDir=0;s.landing=null;s.fallStart=s.actors.map(a=>({...a}));event(s,'fall');}
export function retry(s){
 if(!['lost','falling'].includes(s.phase))return false;const anchor=s.checkpointAnchor,x=s.checkpointX;
 s.retries++;s.phase='playing';s.anchor=anchor;s.actors=[makeActor(0,0),makeActor(0,1)];s.actors[anchor].x=x;s.actors[1-anchor].x=x-s.pendingLength;s.length=s.pendingLength;
 s.holding=false;s.hopDir=0;s.accumulator=0;s.canCatch=false;s.candidate=null;s.buffer=0;s.landing=null;s.fallTime=0;s.fallStart=null;s.burgers=s.checkpointBurgers;s.collected=[...s.checkpointCollected];s.swaps=s.checkpointSwaps;s.perfect=s.checkpointPerfect;s.distance=Math.round(x*3);s.invulnerable=2.5;s.shields=s.mode==='easy'?1:0;s.shieldTime=0;s.rope={distance:s.length,extension:0,tension:0,pulse:0};launch(s,1-anchor);event(s,'retry');return true;
}
function substep(s,dt){
 s.time+=dt;s.elapsed+=dt;s.invulnerable=Math.max(0,s.invulnerable-dt);s.shieldTime=Math.max(0,s.shieldTime-dt);s.buffer=Math.max(0,s.buffer-dt);s.rope.pulse=Math.max(0,s.rope.pulse-dt*1.3);
 for(const a of s.actors){a.hopCooldown=Math.max(0,a.hopCooldown-dt);if(a.hopping)a.hopAge+=dt;if(a.impactAge>=0)a.impactAge+=dt;if(a.grounded)a.landAge+=dt;}
 if(s.hopDir)hop(s,s.hopDir);
 const previous=s.actors.map(a=>({x:a.x,y:a.y})),force=integratePair(s.actors[0],s.actors[1],s.length,dt);
 for(let i=0;i<2;i++){const a=s.actors[i];if(a.grounded)continue;if(a.vy<=0){const p=s.platforms.find(p=>previous[i].y>=p.y-.02&&a.y<=p.y&&Math.abs(a.x-p.x)<p.w/2-.08);if(p){a.y=p.y;a.vx=0;a.vy=0;a.grounded=true;a.supportId=p.id;a.hopping=false;a.impactAge=0;a.landAge=0;a.hopCooldown=.075;event(s,'landing-impact',{actor:i,x:a.x,y:a.y});}}}
 Object.assign(s.rope,{distance:force.distance,extension:force.extension,tension:force.tension});
 const a=s.actors[s.anchor],f=s.actors[1-s.anchor];s.theta=Math.atan2(f.y-a.y,f.x-a.x);
 s.landing=null;for(let i=0;i<2;i++){const b=s.actors[i];if(b.impactAge>=0&&b.impactAge<.28)s.landing={actor:i,age:b.impactAge,duration:.28};}
 const p=f.grounded?platformAt(s,f.x,f.y):null;s.candidate=p&&f.x>a.x+1.5&&f.impactAge>=.24?p:null;s.canCatch=!!s.candidate;
 if(a.y<-3.4||f.y<-3.4){beginFall(s,'搭档落到平台下面啦！用左右小跳调整站位，再看准绿圈换手。');return;}
 for(const p of s.platforms){
  if(p.burger&&!s.collected.includes(p.id)&&s.actors.some(b=>Math.hypot(b.x-p.x,b.y-1.4)<1.05)){s.collected.push(p.id);s.burgers++;event(s,'burger',{x:p.x,y:1.4});}
  if(p.jelly&&s.invulnerable<=0){const j=jellyPosition(p,s.time);if(s.actors.some(b=>Math.hypot(b.x-j.x,b.y+.55-j.y)<.66)){if(s.shields>0){s.shields--;s.invulnerable=2.5;s.shieldTime=1.8;event(s,'shield',{x:f.x,y:f.y});}else{beginFall(s,'碰到水母啦！等它游开，或用小跳改变绳子的拉力再出发。');return;}}}
 }
 if(s.canCatch&&(s.buffer>0||(s.holding&&s.mode==='easy')))catchPartner(s);
}
export function step(s,dt){
 dt=clamp(dt,0,1/30);if(!dt)return;
 if(s.phase==='falling'){s.fallTime+=dt;s.actors.forEach((a,i)=>{a.y=s.fallStart[i].y-4*s.fallTime-6*s.fallTime*s.fallTime;a.x=s.fallStart[i].x+s.fallTime*.8});if(s.fallTime>1.1){s.phase='lost';s.holding=false;event(s,'lost');}return;}
 if(s.phase!=='playing')return;s.accumulator+=dt;while(s.accumulator>=PHYSICS.dt-1e-10&&s.phase==='playing'){s.accumulator-=PHYSICS.dt;substep(s,PHYSICS.dt);}
}
export function jellyPosition(p,t){return {x:p.x+Math.sin(t*.9+p.seed)*1.7,y:3.7+Math.sin(t*1.3+p.seed)*.7};}
export function readState(s){return {phase:s.phase,mode:s.mode,anchor:s.anchor,actors:s.actors.map(a=>({...a})),canCatch:s.canCatch,length:s.length,pendingLength:s.pendingLength,swaps:s.swaps,hops:s.hops,burgers:s.burgers,distance:s.distance,checkpoint:s.checkpoint,retries:s.retries,reason:s.reason,rope:{...s.rope},landing:s.landing?{...s.landing}:null};}
