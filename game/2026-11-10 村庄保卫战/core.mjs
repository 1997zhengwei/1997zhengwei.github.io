import{wallBounds,coverBounds,blockingWall,meleeClear,traceProjectile,makeProjectile,aimBlock,wallReach}from'./combat.mjs';
import{golemCount,golemMaxHP,resizeCrew,crewServiceCost,crewStatus}from'./golems.mjs';
export{golemCount,golemMaxHP,crewServiceCost,crewStatus}from'./golems.mjs';
import{TOTAL_NIGHTS,MAX_LEVEL,WORLD,BELL,LANES,SITES,OBSTACLES,MOBS,WAVES,raidDetails,enemyStats}from'./campaign.mjs';
export{TOTAL_NIGHTS,MAX_LEVEL,WORLD,BELL,LANES,SITES,OBSTACLES,MOBS,WAVES}from'./campaign.mjs';
export const VERSION=3;
export const BUILDINGS={
  tower:{name:'Arrow tower',cost:[4,6,9,13,18],hp:[105,170,250,350,470],description:'Automatically fires at nearby mobs.',next:['One archer','Faster arrows','Two-arrow volleys','Diamond arrows','Three-arrow volleys']},
  wall:{name:'Barricade',cost:[2,3,5,8,12],hp:[130,230,360,530,760],description:'Blocks its road. Mobs must break through.',next:['Oak fence · 130 health','Stone wall · 230 health','Reinforced wall · 360 health','Iron wall · 530 health','Obsidian wall · 760 health']},
  farm:{name:'Farm',cost:[4,6,9,13,17],hp:[70,110,160,220,290],description:'Earns +3 emeralds at every sunrise.',next:['+3 emeralds each dawn','+5 emeralds each dawn','+7 emeralds each dawn','+9 emeralds each dawn','+11 emeralds each dawn']},
  golem:{name:'Iron golem yard',cost:[7,8,12,17,23],hp:[130,195,280,380,500],description:'A melee guardian. Health carries over; repair or recruit through SQUAD.',next:['One iron golem','Stronger guardian','Two iron golems','Diamond guardians','Three iron golems']},
  forge:{name:'Village forge',cost:[5,7,11,16,22],hp:[95,145,210,290,390],description:'Improves Steve’s bow and maximum health.',next:['Bow +5 · health +20','Bow +10 · health +40','Bow +15 · health +60','Bow +20 · health +80','Bow +25 · health +100']}
};
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function seeded(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function createGame(seed=1){return{version:VERSION,seed:seed>>>0,phase:'day',night:1,time:0,phaseTime:0,emeralds:10,score:0,kills:0,nightKills:0,spawned:0,totalSpawn:0,bell:{...BELL,hp:BELL.max},hero:{id:'hero',x:1.4,z:1.3,hp:100,maxHp:100,cooldown:0,volley:0,respawn:0,facing:0,walk:0,hurt:0,path:[],target:null},builds:SITES.map(s=>({...s,level:0,hp:0,maxHp:0,cooldown:0,invested:0,hurt:0,...(s.type==='golem'?{crew:[]}:{} )})),enemies:[],guards:[],arrows:[],queue:[],events:[],nextId:1,dawnSnapshot:null,totalDamage:0};}
export function building(r,id){return r.builds.find(b=>b.id===id);}
export function buildingRepairCost(b){if(!b.level||b.hp>=b.maxHp)return 0;const perGem={wall:160,tower:100,farm:80,golem:100,forge:120}[b.type];return Math.max(1,Math.ceil((b.maxHp-b.hp)/perGem));}
export function salvageValue(b){return Math.max(0,b.invested-buildingRepairCost(b)-(b.type==='golem'?crewServiceCost(b):0));}
export function actionCost(b,action='build'){if(action==='sell')return-salvageValue(b);if(action==='repair')return buildingRepairCost(b);if(!b.level)return BUILDINGS[b.type].cost[0];return b.level>=MAX_LEVEL?Infinity:BUILDINGS[b.type].cost[b.level];}
function invalidate(r){r._cover=null;r._solids=null;}
function cover(r){return r._cover??(r._cover=coverBounds(r));}
function canFire(r,from,target,source='hero'){return!aimBlock(r,from,target,source,cover(r));}
export function build(r,id,action='build'){
 const b=building(r,id);if(r.phase!=='day'||!b)return{ok:false,reason:'Wait for daylight.'};
 if(!['build','repair','sell'].includes(action))return{ok:false,reason:'Unknown action.'};
 if(action==='build'&&b.unlock>r.night)return{ok:false,reason:`Opens on day ${b.unlock}.`};
 if(action==='build'&&b.level>=levelCap(r.night)&&b.level<MAX_LEVEL)return{ok:false,reason:`Next upgrade opens on day ${b.level===3?6:11}.`};
 if(action==='build'&&b.level&&b.hp<=0)return{ok:false,reason:'Repair the ruin before upgrading.'};
 if(action==='sell'){
  if(!b.level)return{ok:false,reason:'Nothing to remove.'};const refund=salvageValue(b);r.emeralds+=refund;
  Object.assign(b,{level:0,hp:0,maxHp:0,invested:0});if(b.type==='golem')b.crew=[];invalidate(r);syncHero(r);r.events.push({kind:'build',id:b.id,sold:true,refund});return{ok:true};
 }
 if(action==='repair'&&(!b.level||b.hp>=b.maxHp))return{ok:false,reason:'Already in good condition.'};
 const cost=actionCost(b,action);if(!Number.isFinite(cost))return{ok:false,reason:'Already fully upgraded.'};if(r.emeralds<cost)return{ok:false,reason:`Need ${cost-r.emeralds} more emeralds.`};
 r.emeralds-=cost;const oldLevel=b.level;
 if(action!=='repair'){b.level++;b.invested+=cost;b.maxHp=BUILDINGS[b.type].hp[b.level-1];if(b.type==='golem')resizeCrew(b,oldLevel);}
 b.hp=b.maxHp;invalidate(r);syncHero(r);r.events.push({kind:'build',id:b.id,level:b.level,cost,repaired:action==='repair'});return{ok:true,cost};
}
export function serviceGolems(r,id,slot=null){
 const b=building(r,id);if(r.phase!=='day'||!b||b.type!=='golem'||!b.level)return{ok:false,reason:'Manage golems at their yard in daylight.'};
 if(b.hp<=0)return{ok:false,reason:'Repair the yard first.'};const cost=crewServiceCost(b,slot);
 if(!Number.isFinite(cost)||cost<=0)return{ok:false,reason:'The selected golems are already ready.'};if(cost>r.emeralds)return{ok:false,reason:`Need ${cost-r.emeralds} more emeralds.`};
 const slots=slot===null?b.crew.map((_,i)=>i):[slot];let recruited=0,healed=0;
 for(const i of slots){if(b.crew[i].hp<=0)recruited++;else healed+=golemMaxHP(b.level)-b.crew[i].hp;b.crew[i].hp=golemMaxHP(b.level);}
 r.emeralds-=cost;r.events.push({kind:'crewService',id:b.id,cost,recruited,healed});return{ok:true,cost};
}
function syncHero(r){const l=r.builds.filter(b=>b.type==='forge'&&b.hp>0).reduce((n,b)=>n+b.level,0),max=100+l*20;r.hero.maxHp=max;r.hero.hp=r.phase==='day'?max:Math.min(r.hero.hp,max);}
export function levelCap(night){return night<6?3:night<11?4:5;}
export function towerDamage(level){return[0,13,18,25,35,48][level];}
export function repairBell(r){if(r.phase!=='day'||r.bell.hp>=BELL.max||r.emeralds<3)return false;r.emeralds-=3;r.bell.hp=Math.min(BELL.max,r.bell.hp+45);r.events.push({kind:'bellRepair'});return true;}
export function defenseCount(r){return r.builds.filter(b=>b.hp>0&&['tower','wall','golem'].includes(b.type)).length;}
export function raidInfo(r){const spec=WAVES[r.night-1],lanes=[...new Set(spec.map(s=>s.lane))];return{...raidDetails(r.night),count:spec.reduce((n,s)=>n+s.count,0),lanes:lanes.map(i=>LANES[i]),types:[...new Set(spec.map(s=>s.type))]};}
export function startNight(r){
 if(r.phase!=='day')return false;r.dawnSnapshot=checkpoint(r);r.phase='night';r.phaseTime=0;r.nightKills=0;r.spawned=0;r.enemies=[];r.arrows=[];r.guards=[];r.hero.path=[];r.hero.target=null;r.hero.cooldown=.2;r.hero.volley=0;r.hero.respawn=0;invalidate(r);syncHero(r);r.hero.hp=r.hero.maxHp;
 const random=seeded(r.seed+r.night*137),queue=[];WAVES[r.night-1].forEach(group=>{for(let i=0;i<group.count;i++)queue.push({at:1.2+(group.at||0)+i*raidDetails(r.night).spacing+(random()-.5)*.18,type:group.type,lane:group.lane,jitter:(random()-.5)*.7});});queue.sort((a,b)=>a.at-b.at);r.queue=queue;r.totalSpawn=queue.length;
 for(const b of r.builds)if(b.type==='golem'&&b.hp>0)for(let i=0;i<golemCount(b.level);i++){
  const hp=b.crew?.[i]?.hp||0;if(hp<=0)continue;const x=b.x+(i-(golemCount(b.level)-1)/2)*.85,z=b.z-1;
  r.guards.push({id:`g${r.nextId++}`,type:'golem',yardId:b.id,slot:i,x,z,hp,maxHp:golemMaxHP(b.level),cooldown:0,facing:0,walk:0,home:{x,z},hurt:0,level:b.level});
 }
 r.events.push({kind:'night',night:r.night});return true;
}
function solidRects(r,includeBell=false){const rects=OBSTACLES.map(o=>({...o}));for(const b of r.builds)if(b.hp>0&&b.level&&b.type!=='farm'){const wall=b.type==='wall';rects.push({x:b.x,z:b.z,w:wall?(b.lane===0||b.lane===3?3.8:.65):1.1,d:wall?(b.lane===0||b.lane===3?.65:3.8):1.1,id:b.id,type:b.type});}if(includeBell)rects.push({x:BELL.x,z:BELL.z,w:1.4,d:1.4});return rects;}
export function walkable(r,x,z,radius=.27){if(x<WORLD.minX+.3||x>WORLD.maxX-.3||z<WORLD.minZ+.3||z>WORLD.maxZ-.3)return false;return!solidRects(r,true).some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);}
function move(r,o,dx,dz,dt,collisions=true){const sx=dx*dt,sz=dz*dt,ox=o.x,oz=o.z;if(!collisions||walkable(r,o.x+sx,o.z+sz)){o.x+=sx;o.z+=sz;}else{if(walkable(r,o.x+sx,o.z))o.x+=sx;if(walkable(r,o.x,o.z+sz))o.z+=sz;}const traveled=Math.hypot(o.x-ox,o.z-oz);if(traveled>.0001){o.facing=Math.atan2(dx,dz);o.walk=(o.walk||0)+traveled*5;}return traveled;}
export function findPath(r,from,to){
  const unit=.7,lowX=-16.5,lowZ=-17.5,w=48,h=49,toCell=p=>[Math.max(0,Math.min(w-1,Math.round((p.x-lowX)/unit))),Math.max(0,Math.min(h-1,Math.round((p.z-lowZ)/unit)))],toWorld=(x,z)=>({x:lowX+x*unit,z:lowZ+z*unit});
  const[sx,sz]=toCell(from),[tx,tz]=toCell(to),start=sz*w+sx,goal=tz*w+tx,open=[start],dist=new Map([[start,0]]),prev=new Map(),closed=new Set();let best=start,bestD=Infinity;
  for(let it=0;open.length&&it<3000;it++){open.sort((a,b)=>(dist.get(a)+Math.hypot(a%w-tx,Math.floor(a/w)-tz))-(dist.get(b)+Math.hypot(b%w-tx,Math.floor(b/w)-tz)));const at=open.shift();if(closed.has(at))continue;closed.add(at);const x=at%w,z=Math.floor(at/w),d=Math.hypot(x-tx,z-tz);if(d<bestD){best=at;bestD=d;}if(at===goal)break;for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nx>=w||nz<0||nz>=h)continue;const next=nz*w+nx,p=toWorld(nx,nz);if(!walkable(r,p.x,p.z)||closed.has(next))continue;const cost=dist.get(at)+1;if(cost<(dist.get(next)??Infinity)){dist.set(next,cost);prev.set(next,at);open.push(next);}}}
  const path=[];for(let at=best;at!==start&&prev.has(at);at=prev.get(at))path.push(toWorld(at%w,Math.floor(at/w)));return path.reverse();
}
export function setDestination(r,x,z){if(!['day','night'].includes(r.phase)||r.hero.respawn)return false;r.hero.target=null;r.hero.path=findPath(r,r.hero,{x,z});return true;}
export function focusMob(r,id){const e=r.enemies.find(e=>e.id===id&&e.hp>0);if(!e)return false;r.hero.target=id;if(distance(r.hero,e)>6.4)r.hero.path=findPath(r,r.hero,e);return true;}
function alive(r){return r.enemies.filter(e=>e.hp>0);}
function shot(r,from,target,damage,source='hero'){
 const duration=source==='skeleton'?.48:Math.max(.12,Math.min(.4,distance(from,target)/22));
 r.arrows.push({...makeProjectile(from,target,source),id:r.nextId++,damage,remaining:duration,duration});r.events.push({kind:'shoot',source,x:from.x,z:from.z});
}
function hitMob(r,e,damage){if(e.hp<=0)return;e.hp-=damage;e.hurt=.18;r.events.push({kind:'hit',x:e.x,z:e.z,type:e.type,damage});if(e.hp<=0){r.kills++;r.nightKills++;r.score+=MOBS[e.type].score;r.events.push({kind:'death',x:e.x,z:e.z,type:e.type,score:MOBS[e.type].score});}}
function hurt(r,target,damage,source){
 if(target.hp<=0)return;target.hp=Math.max(0,target.hp-damage);target.hurt=.25;r.totalDamage+=target===r.bell?damage:0;
 if(target.yardId){const yard=building(r,target.yardId);if(yard?.crew?.[target.slot])yard.crew[target.slot].hp=target.hp;}
 else if(target.id&&building(r,target.id))invalidate(r);
 r.events.push({kind:'hurt',x:target.x,z:target.z,id:target.id||'bell',damage,source});
 if(target===r.hero&&target.hp<=0){target.respawn=5;target.path=[];r.events.push({kind:'down'});}
 if(target.yardId&&target.hp<=0){target.downAt=r.time;r.events.push({kind:'guardDown',id:target.id,yardId:target.yardId,slot:target.slot,x:target.x,z:target.z,facing:target.facing});}
 if(target===r.bell&&target.hp<=0){r.phase='lost';r.events.push({kind:'lost',night:r.night,source});}
}
function arrowImpact(r,a){
 if(a.source==='skeleton'){
  const target=a.targetId==='hero'?r.hero:a.targetId==='bell'?r.bell:building(r,a.targetId)||r.guards.find(g=>g.id===a.targetId);
  if(target&&target.hp>0&&(!(target===r.hero||target.yardId)||Math.hypot(target.x-a.tx,target.z-a.tz)<1.25))hurt(r,target,a.damage,'skeleton');
 }else{const e=r.enemies.find(e=>e.id===a.targetId);if(e&&e.hp>0)hitMob(r,e,a.damage*(e.type==='ravager'?.72:e.type==='armored'?.8:1));}
}
export function volley(r){if(r.phase!=='night'||r.hero.volley>0||r.hero.respawn)return false;const enemies=alive(r).filter(e=>distance(r.hero,e)<10&&canFire(r,r.hero,e,'volley')).sort((a,b)=>distance(r.hero,a)-distance(r.hero,b)).slice(0,6);if(!enemies.length)return false;r.hero.volley=10;const boost=r.builds.filter(b=>b.type==='forge'&&b.hp>0).reduce((n,b)=>n+b.level*5,0);for(const e of enemies)shot(r,r.hero,e,36+boost*1.4,'volley');r.events.push({kind:'volley',x:r.hero.x,z:r.hero.z});return true;}
function stepHero(r,dt,input){const p=r.hero;p.hurt=Math.max(0,(p.hurt||0)-dt);p.volley=Math.max(0,p.volley-dt);p.cooldown=Math.max(-dt,p.cooldown-dt);if(p.respawn){p.respawn=Math.max(0,p.respawn-dt);if(!p.respawn){p.hp=p.maxHp;p.x=1.5;p.z=5.8;r.events.push({kind:'respawn'});}return;}
  let dx=input?.x||0,dz=input?.z||0;const mag=Math.hypot(dx,dz);if(mag>.06){p.path=[];dx/=Math.max(1,mag);dz/=Math.max(1,mag);move(r,p,dx*4.6,dz*4.6,dt);}else if(p.path.length){const t=p.path[0],d=distance(p,t);if(d<.16)p.path.shift();else move(r,p,(t.x-p.x)/d*4.6,(t.z-p.z)/d*4.6,Math.min(dt,d/4.6));}
  if(r.phase!=='night')return;const enemies=alive(r),locked=enemies.find(e=>e.id===p.target&&distance(p,e)<6.8&&canFire(r,p,e));const e=locked||enemies.filter(e=>distance(p,e)<6.8&&canFire(r,p,e)).sort((a,b)=>distance(p,a)-distance(p,b))[0];if(e&&p.cooldown<=1e-8){const boost=r.builds.filter(b=>b.type==='forge'&&b.hp>0).reduce((n,b)=>n+b.level*5,0);p.facing=Math.atan2(e.x-p.x,e.z-p.z);shot(r,p,e,12+boost);p.cooldown+=.7;}if(!e)p.cooldown=Math.max(0,p.cooldown);if(p.target&&e&&distance(p,e)<5.8)p.path=[];
}
function stepTowers(r,dt){
 for(const b of r.builds){b.hurt=Math.max(0,b.hurt-dt);if(b.type!=='tower'||b.hp<=0)continue;b.cooldown=Math.max(-dt,b.cooldown-dt);if(b.cooldown>1e-8)continue;
  const es=alive(r).filter(e=>distance(b,e)<6.8+b.level*.45&&canFire(r,b,e,'tower')).sort((a,c)=>distance(b,a)-distance(b,c)),e=es[0];
  if(e){shot(r,b,e,towerDamage(b.level),'tower');if(b.level>=3&&es[1])shot(r,b,es[1],towerDamage(b.level),'tower');if(b.level>=5&&es[2])shot(r,b,es[2],towerDamage(b.level),'tower');b.cooldown+=.99-b.level*.09;}else b.cooldown=0;
 }
}
function stepGuards(r,dt){
 for(const g of r.guards){
  if(g.hp<=0)continue;g.hurt=Math.max(0,g.hurt-dt);g.cooldown=Math.max(-dt,g.cooldown-dt);
  const e=alive(r).filter(e=>distance(g.home,e)<8.5&&meleeClear(r,g,e)).sort((a,b)=>distance(g,a)-distance(g,b))[0],target=e||g.home,d=distance(g,target);
  if(d>(e?1.35:.15))move(r,g,(target.x-g.x)/d*2,(target.z-g.z)/d*2,dt);
  if(e&&distance(g,e)<1.8&&g.cooldown<=1e-8&&meleeClear(r,g,e)){
   const victims=alive(r).filter(other=>distance(other,e)<1.45&&meleeClear(r,g,other)).sort((a,b)=>a===e?-1:b===e?1:distance(g,a)-distance(g,b)).slice(0,3);
   for(const victim of victims)hitMob(r,victim,(20+g.level*4)*(victim===e?1:.6));g.cooldown+=1.25;g.swing=.45;r.events.push({kind:'golemHit',x:e.x,z:e.z});
  }g.cooldown=Math.max(0,g.cooldown);g.swing=Math.max(0,(g.swing||0)-dt);
 }
}
function routeBarrier(r,e){
 if(e.type==='spider')return null;const lane=LANES[e.lane];
 return lane.walls.map(id=>building(r,id)).find(b=>{if(!b?.hp)return false;const i=lane.points.findIndex(p=>Math.hypot(p[0]-b.x,p[1]-b.z)<.2),before=lane.points[Math.max(0,i-1)],after=lane.points[Math.min(lane.points.length-1,i+1)];return(e.x-b.x)*(after[0]-before[0])+(e.z-b.z)*(after[1]-before[1])<.4;})||null;
}
function stepEnemy(r,e,dt){
 const spec=enemyStats(e.type,r.night);e.hurt=Math.max(0,e.hurt-dt);e.cooldown=Math.max(-dt,e.cooldown-dt);
 const laneWall=routeBarrier(r,e),standing=LANES[e.lane].walls.map(id=>building(r,id)).find(b=>b?.hp>0);
 e.climb=e.type==='spider'&&standing&&distance(e,standing)<1.8?1.1:0;
 const guard=r.guards.filter(g=>g.hp>0&&distance(e,g)<(e.type==='skeleton'?5.8:2.5)).sort((a,b)=>distance(e,a)-distance(e,b))[0];
 const nearby=r.builds.filter(b=>b.hp>0&&b.type!=='wall'&&distance(e,b)<(e.type==='skeleton'?5.6:1.6)).sort((a,b)=>distance(e,a)-distance(e,b))[0];
 let target=guard||(!r.hero.respawn&&distance(e,r.hero)<(e.type==='skeleton'?4.6:1.6)?r.hero:null)||nearby||laneWall||r.bell,shotBlocked=false;
 if(e.type==='skeleton'){
  let block=aimBlock(r,e,target,'skeleton',cover(r));
  if(block&&block.kind!=='house'){const shield=building(r,block.id);if(shield)target=shield;block=aimBlock(r,e,target,'skeleton',cover(r));}
  if(block?.kind==='house'){target=laneWall||r.bell;block=aimBlock(r,e,target,'skeleton',cover(r));}
  shotBlocked=!!block;
 }else if(e.type!=='spider'){const shield=blockingWall(r,e,target,target.type==='wall'?target.id:null);if(shield)target=shield;}
 const reach=target.type==='wall'?wallReach(e,target):distance(e,target);
 if(e.type==='creeper'&&reach<spec.range+.3){
  e.fuse+=dt;if(e.fuse>=.95){const center={x:e.x,z:e.z};for(const b of r.builds)if(b.hp>0&&distance(center,b)<2.8)hurt(r,b,spec.damage,'creeper');if(distance(center,r.bell)<2.8)hurt(r,r.bell,spec.damage,'creeper');if(!r.hero.respawn&&distance(center,r.hero)<3.2)hurt(r,r.hero,30,'creeper');for(const g of r.guards)if(g.hp>0&&distance(center,g)<3)hurt(r,g,Math.round(spec.damage*.9),'creeper');for(const other of alive(r))if(other!==e&&distance(center,other)<2.6)hitMob(r,other,22);hitMob(r,e,e.hp);r.events.push({kind:'explosion',...center});}return;
 }else e.fuse=Math.max(0,e.fuse-dt*.6);
 const range=e.type==='skeleton'?spec.range:spec.range+(target===r.bell?.25:.2),clear=e.type==='skeleton'?!shotBlocked:meleeClear(r,e,target,target.type==='wall'?target.id:null,e.type==='spider');
 if(reach<range&&clear){
  e.facing=Math.atan2(target.x-e.x,target.z-e.z);
  if(e.cooldown<=1e-8){if(e.type==='skeleton')shot(r,e,target,spec.damage,'skeleton');else{hurt(r,target,spec.damage,e.type);if(e.type==='ravager'){for(const b of r.builds)if(b!==target&&b.hp>0&&distance(e,b)<2.5)hurt(r,b,Math.round(spec.damage*.5),'ravager');r.events.push({kind:'stomp',x:e.x,z:e.z});}}e.cooldown+=spec.period;e.swing=.3;}return;
 }
 let point=target;
 if(target===laneWall||target===r.bell||shotBlocked){const pts=LANES[e.lane].points;while(e.waypoint<pts.length-1&&Math.hypot(e.x-pts[e.waypoint][0],e.z-pts[e.waypoint][1])<.65)e.waypoint++;const[x,z]=pts[e.waypoint];point={x:x+e.jitter,z};if(laneWall&&distance(e,laneWall)<3&&!shotBlocked)point=laneWall;if(!laneWall&&distance(e,r.bell)<3&&!shotBlocked)point=r.bell;}
 const d=distance(e,point);if(d>.01){
  const dx=(point.x-e.x)/d*spec.speed,dz=(point.z-e.z)/d*spec.speed,ox=e.x,oz=e.z,rects=r._solids??(r._solids=solidRects(r,false));
  const pass=(x,z)=>!rects.some(o=>!(e.type==='spider'&&o.type==='wall')&&Math.abs(x-o.x)<o.w/2+.24&&Math.abs(z-o.z)<o.d/2+.24);
  if(pass(e.x+dx*dt,e.z+dz*dt)){e.x+=dx*dt;e.z+=dz*dt;}else{if(pass(e.x+dx*dt,e.z))e.x+=dx*dt;if(pass(e.x,e.z+dz*dt))e.z+=dz*dt;}
  e.facing=Math.atan2(dx,dz);e.walk=(e.walk||0)+Math.hypot(e.x-ox,e.z-oz)*5;
 }e.cooldown=Math.max(0,e.cooldown);e.swing=Math.max(0,(e.swing||0)-dt);
}
function finishNight(r){if(r.night===TOTAL_NIGHTS){r.phase='won';r.score+=r.bell.hp*2+600;r.events.push({kind:'won',score:r.score});return;}const farm=r.builds.filter(b=>b.type==='farm'&&b.hp>0).reduce((n,b)=>n+[0,3,5,7,9,11][b.level],0),bounty=Math.floor(r.nightKills/10),income=6+farm+bounty+(r.night%5===0?4:0);r.emeralds+=income;r.score+=80;r.bell.hp=Math.min(BELL.max,r.bell.hp+8);r.hero.hp=r.hero.maxHp;r.hero.respawn=0;r.hero.path=[];r.phase='dawn';r.phaseTime=0;r.arrows=[];r.events.push({kind:'dawn',night:r.night,income,farm,bounty});}
export function step(r,delta,input={x:0,z:0}){const dt=Math.max(0,Math.min(.1,delta));if(['won','lost'].includes(r.phase)||!dt)return;invalidate(r);r.time+=dt;r.phaseTime+=dt;stepHero(r,dt,input);if(r.phase==='day')return;if(r.phase==='dawn'){if(r.phaseTime>=2.2){r.night++;r.phase='day';r.phaseTime=0;r.guards=[];r.events.push({kind:'day',night:r.night});}return;}
  while(r.queue.length&&r.queue[0].at<=r.phaseTime){const q=r.queue.shift(),[x,z]=LANES[q.lane].points[0],spec=enemyStats(q.type,r.night),maxHp=spec.hp;r.enemies.push({id:`e${r.nextId++}`,type:q.type,lane:q.lane,x:x+q.jitter,z,hp:maxHp,maxHp,cooldown:.4,fuse:0,facing:0,walk:0,hurt:0,waypoint:1,jitter:q.jitter});r.spawned++;if(q.type==='armored'||q.type==='ravager')r.events.push({kind:'boss',type:q.type});}
  for(const a of r.arrows){const before=Math.max(0,1-a.remaining/a.duration),after=Math.min(1,before+dt/a.duration),target=a.source==='skeleton'?null:r.enemies.find(e=>e.id===a.targetId&&e.hp>0),hit=traceProjectile(r,a,before,after,target,cover(r));a.remaining-=dt;if(hit){a.remaining=-1;if(a.source==='skeleton'){const b=building(r,hit.id);if(b?.hp>0)hurt(r,b,a.damage,'skeleton');}r.events.push({kind:'arrowBlock',...hit.point,source:a.source,blocker:hit.id});}else if(a.remaining<=0)arrowImpact(r,a);if(r.phase!=='night')break;}r.arrows=r.arrows.filter(a=>a.remaining>0);if(r.phase!=='night')return;
  stepTowers(r,dt);stepGuards(r,dt);for(const e of alive(r)){stepEnemy(r,e,dt);if(r.phase!=='night')break;}r.enemies=r.enemies.filter(e=>e.hp>0);if(r.phase==='night'&&!r.queue.length&&!r.enemies.length)finishNight(r);
}
export function drainEvents(r){return r.events.splice(0);}
export function checkpoint(r){const copy=structuredClone({version:VERSION,seed:r.seed,phase:r.phase==='dawn'?'day':r.phase,night:r.night+(r.phase==='dawn'?1:0),emeralds:r.emeralds,score:r.score,kills:r.kills,bell:r.bell,hero:r.hero,builds:r.builds});if(r.phase==='night'&&r.dawnSnapshot)return structuredClone(r.dawnSnapshot);copy.hero.path=[];copy.hero.target=null;copy.hero.volley=0;copy.hero.respawn=0;return copy;}
export function restore(saved){
 const legacy=saved?.version===2;
 if(!saved||!legacy&&saved.version!==VERSION||saved.phase!=='day'||!Number.isInteger(saved.night)||saved.night<1||saved.night>TOTAL_NIGHTS||!Number.isFinite(saved.emeralds)||saved.emeralds<0||!Number.isFinite(saved.score)||saved.score<0||!Number.isInteger(saved.kills)||saved.kills<0||!Array.isArray(saved.builds)||saved.builds.length!==SITES.length||new Set(saved.builds.map(b=>b?.id)).size!==SITES.length||!saved.hero||!saved.bell||!Number.isFinite(saved.hero.hp)||!Number.isFinite(saved.hero.maxHp)||saved.hero.maxHp<=0||saved.hero.hp<0||saved.hero.hp>saved.hero.maxHp||!Number.isFinite(saved.hero.x)||!Number.isFinite(saved.hero.z)||!Number.isFinite(saved.bell.hp)||saved.bell.hp<=0||saved.bell.hp>BELL.max)return null;
 const r=createGame(saved.seed),normalized=[];
 for(const site of SITES){
  const b=saved.builds.find(b=>b?.id===site.id);if(!b||b.type!==site.type||!Number.isInteger(b.level)||b.level<0||b.level>MAX_LEVEL||!Number.isFinite(b.hp)||b.hp<0||b.hp>b.maxHp||b.maxHp!==(b.level?BUILDINGS[b.type].hp[b.level-1]:0)||!Number.isFinite(b.invested)||b.invested<0)return null;
  const next={...site,level:b.level,hp:b.hp,maxHp:b.maxHp,cooldown:0,invested:b.invested,hurt:0};
  if(site.type==='golem'){
   if(legacy){next.crew=[];resizeCrew(next,0);}
   else{if(!Array.isArray(b.crew)||b.crew.length!==golemCount(b.level)||b.crew.some(g=>!Number.isFinite(g?.hp)||g.hp<0||g.hp>golemMaxHP(b.level)))return null;next.crew=b.crew.map(g=>({hp:g.hp}));}
  }normalized.push(next);
 }
 for(const key of['night','emeralds','score','kills'])r[key]=saved[key];r.builds=normalized;r.bell.hp=saved.bell.hp;
 r.hero.x=saved.hero.x;r.hero.z=saved.hero.z;r.hero.hp=saved.hero.hp;syncHero(r);
 if(!walkable(r,r.hero.x,r.hero.z)){r.hero.x=1.4;r.hero.z=1.3;}return r;
}
export function retryDawn(r){return r.dawnSnapshot?restore(r.dawnSnapshot):createGame(r.seed);}
