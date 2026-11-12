import {RIDES,RIDE_BY_ID,GOALS,rideStats,SERVICE_DEFS,serviceCost,UPGRADE_LIMIT} from './data.mjs';
export class ParkSimulation{
 constructor(saved=null){this.time=0;this.cash=850;this.earned=0;this.ridesServed=0;this.visitors=0;this.leftHappy=0;this.lost=0;this.nextId=1;this.spawnClock=0;this.guests=[];this.events=[];this.claimed=[];this.services={gate:0,staff:0,food:0,garden:0};this.rides=Object.fromEntries(RIDES.map(d=>[d.id,{built:d.cost===0,level:1,phase:'loading',clock:0,queue:[],riders:[],revenue:0,rounds:0}]));if(saved?.version===1)this.restore(saved);else this.seedOpening();}
 seedOpening(){const r=this.rides.carousel;for(let i=0;i<8;i++){const [x,z]=this.queuePoint('carousel',i),id=this.nextId++;this.guests.push({id,style:id%18,x,z,mode:'queue',target:'carousel',wait:0,visits:0,visited:[],speed:2.7+(i%4)*.1,budget:1,path:[],pathIndex:0,heading:Math.PI});r.queue.push(id);}r.clock=2.5;this.visitors=8;}
 get built(){return RIDES.filter(d=>this.rides[d.id].built).length;}
 get capacity(){return 22+this.services.gate*9+this.built*7;}
 get happiness(){return Math.min(99,Math.max(62,88+this.services.garden*2+this.services.food-Math.max(0,this.guests.filter(g=>g.mode==='queue'&&g.wait>45).length)*.6));}
 get title(){return this.built===8?'八星海岛度假城':this.built>=6?'梦幻海岸度假城':this.built>=4?'梦想度假王国':this.built===3?'海岸欢乐地标':this.built===2?'人气游乐园':'海边小乐园';}
 walkway(g){const side=g.x<0?-1:1;return Math.abs(g.x)>43?[[side*46,g.z],[side*46,26],[side*4.7,26]]:[[side*4.7,g.z]];}
 credit(amount,kind,id=null){amount=Math.max(0,Math.round(amount));this.cash+=amount;this.earned+=amount;if(amount)this.events.push({type:'income',amount,kind,id});}
 build(id){const d=RIDE_BY_ID[id],r=this.rides[id];if(!d||r.built||this.cash<d.cost)return false;this.cash-=d.cost;r.built=true;r.phase='loading';r.clock=0;this.events.push({type:'build',id});return true;}
 upgrade(id){const d=RIDE_BY_ID[id],r=this.rides[id];if(!d||!r.built||r.level>=UPGRADE_LIMIT)return false;const c=rideStats(d,r).upgrade;if(this.cash<c)return false;this.cash-=c;r.level++;this.events.push({type:'upgrade',id});return true;}
 upgradeService(id){const d=SERVICE_DEFS.find(d=>d.id===id);if(!d||this.services[id]>=8)return false;const cost=serviceCost(d,this.services[id]);if(this.cash<cost)return false;this.cash-=cost;this.services[id]++;this.events.push({type:'service',id});return true;}
 goalValue(g){return {rides:this.ridesServed,built:this.built,coaster:Number(this.rides.coaster.built)}[g.key]||0;}
 get goal(){return GOALS.find(g=>!this.claimed.includes(g.id))||null;}
 claimGoal(){const g=this.goal;if(!g||this.goalValue(g)<g.target)return false;this.claimed.push(g.id);this.credit(g.reward,'goal');this.events.push({type:'goal',id:g.id});return true;}
 spawn(){if(this.guests.length>=this.capacity)return;const id=this.nextId++,g={id,style:id%18,x:(id%3-1)*.44,z:41.5,mode:'enter',target:null,wait:0,visits:0,visited:[],speed:2.5+(id%5)*.12,budget:Math.min(this.built,2+(id%2)),path:[],pathIndex:0};this.guests.push(g);this.visitors++;this.credit(6,'entry');g.path=[[g.x,31],[g.x,26]];}
 choose(g){let best=null,bestScore=-Infinity;for(const d of RIDES){const r=this.rides[d.id];if(!r.built||r.queue.length>=rideStats(d,r).queueCap)continue;const previous=g.visited.includes(d.id)?.46:1;const score=previous*(.7+d.appeal*.25+(r.level-1)*.04+((g.id*13+g.visits*7+RIDES.indexOf(d)*11)%17)/17*.9)+(g.id%RIDES.length===RIDES.indexOf(d)?.35:0)-r.queue.length/rideStats(d,r).capacity*1.15;if(score>bestScore){bestScore=score;best=d;}}if(!best||g.visits>=g.budget){this.exit(g);return;}g.target=best.id;g.mode='walk';const side=best.x<0?-1:1,front=best.z+best.d/2+1.8;g.path=this.walkway(g);const fromSide=g.x<0?-1:1;if(Math.abs(best.x)>43)g.path.push([fromSide*4.7,26],[side*4.7,26],[side*46,26],[side*46,front]);else{if(fromSide!==side||Math.abs(g.x)>43)g.path.push([fromSide*4.7,26],[side*4.7,26]);g.path.push([side*4.7,front]);}g.path.push([best.x-side*6,front]);g.pathIndex=0;g.wait=0;}
 exit(g){if(g.mode==='exit')return;g.target=null;g.pathIndex=0;if(this.services.food&&!g.ate){g.mode='foodwalk';g.path=[...this.walkway(g),[g.x>0?4.7:-4.7,25],[-26.3,25],[-26.3,33.8],[-29+(g.id%4)*.65,33.8+Math.floor(g.id%8/4)*.6]];return;}g.mode='exit';g.path=[...this.walkway(g),[g.x>0?4.7:-4.7,30],[g.x>0?4.7:-4.7,43]];}
 queuePoint(id,i){const d=RIDE_BY_ID[id],sign=d.x<0?1:-1;const row=Math.floor(i/7),col=i%7;return [d.x+sign*(5.8-row*.8),d.z+d.d/2+1.5-col*.6];}
 step(dt){if(!Number.isFinite(dt)||dt<=0)return;for(let remain=Math.min(dt,1);remain>1e-8;){const step=Math.min(remain,.05);this.tick(step);remain-=step;}}
 tick(dt){this.time+=dt;this.spawnClock+=dt;const interval=Math.max(.62,1.9-this.built*.15-this.services.gate*.13-this.services.garden*.025);while(this.spawnClock>=interval){this.spawnClock-=interval;this.spawn();}
  for(const d of RIDES){const r=this.rides[d.id];if(!r.built)continue;r.clock+=dt;if(r.phase==='running'){if(r.clock>=d.duration){r.phase='unloading';r.clock=0;const riders=[...r.riders];r.riders=[];const income=riders.length*rideStats(d,r).ticket;r.revenue+=income;r.rounds++;this.ridesServed+=riders.length;this.credit(income,'ride',d.id);for(const id of riders){const g=this.guests.find(g=>g.id===id);if(g){g.visits++;g.visited.push(d.id);g.mode='rest';g.wait=0;g.x=d.x+(d.x<0?7:-7);g.z=d.z+d.d/2+2.4;}}}}
   else if(r.phase==='unloading'){if(r.clock>1.7){r.phase='loading';r.clock=0;}}
   else if(r.phase==='boarding'){if(r.clock>=2.4){for(const id of r.riders){const g=this.guests.find(g=>g.id===id);if(g)g.mode='riding';}r.phase='running';r.clock=0;this.events.push({type:'depart',id:d.id,count:r.riders.length});}}
   else{const loadTime=Math.max(2.4,6-this.services.staff*.55);if(r.queue.length&&r.clock>=loadTime){const ids=r.queue.splice(0,rideStats(d,r).capacity);r.riders=ids;ids.forEach(id=>{const g=this.guests.find(g=>g.id===id);if(g){g.mode='boarding';g.wait=0;}});r.phase='boarding';r.clock=0;}}
  }
  const remove=[];for(const g of this.guests){if(g.mode==='riding')continue;g.wait+=dt;if(g.mode==='queue'){const r=this.rides[g.target],index=r.queue.indexOf(g.id);if(index<0)continue;const p=this.queuePoint(g.target,index);this.move(g,p,dt);if(g.wait>65+this.services.garden*12){r.queue=r.queue.filter(id=>id!==g.id);this.lost++;this.exit(g);}continue;}
   if(g.mode==='boarding'){const d=RIDE_BY_ID[g.target];this.move(g,g.target==='ship'?[d.x-7.9,d.z+4.6]:[d.x+(d.x<0?5:-5),d.z+d.d/2-2.8],dt);continue;}
   if(g.mode==='foodwait'){if(g.wait>2.4){g.ate=true;this.credit(8+this.services.food*5,'food');this.leftHappy++;this.exit(g);}continue;}
   if(g.mode==='rest'){if(g.wait>1.7)this.choose(g);continue;}
   const p=g.path[g.pathIndex];if(p&&this.move(g,p,dt)){g.pathIndex++;if(g.pathIndex>=g.path.length){if(g.mode==='enter')this.choose(g);else if(g.mode==='walk'){const r=this.rides[g.target];if(r.queue.length>=rideStats(RIDE_BY_ID[g.target],r).queueCap){this.choose(g);}else{g.mode='queue';g.wait=0;r.queue.push(g.id);}}else if(g.mode==='foodwalk'){g.mode='foodwait';g.wait=0;g.heading=Math.PI;}else if(g.mode==='exit')remove.push(g.id);}}
  }if(remove.length)this.guests=this.guests.filter(g=>!remove.includes(g.id));
 }
 move(g,p,dt){const dx=p[0]-g.x,dz=p[1]-g.z,len=Math.hypot(dx,dz);if(len<.05){g.x=p[0];g.z=p[1];return true;}const s=Math.min(len,dt*g.speed);g.x+=dx/len*s;g.z+=dz/len*s;g.heading=Math.atan2(dx,dz);return s>=len;}
 drainEvents(){return this.events.splice(0);}
 save(){return {version:1,time:this.time,cash:this.cash,earned:this.earned,ridesServed:this.ridesServed,visitors:this.visitors,leftHappy:this.leftHappy,lost:this.lost,nextId:this.nextId,spawnClock:this.spawnClock,services:{...this.services},claimed:[...this.claimed],guests:this.guests.map(g=>({...g,path:g.path.map(p=>[...p]),visited:[...g.visited]})),rides:Object.fromEntries(RIDES.map(d=>{const r=this.rides[d.id];return [d.id,{built:r.built,level:r.level,revenue:r.revenue,rounds:r.rounds,phase:r.phase,clock:r.clock,queue:[...r.queue],riders:[...r.riders]}];}))};}
 restore(s){
  if(!s||s.version!==1)return;
  const finite=(v,f=0)=>Number.isFinite(v)&&v>=0?v:f;
  for(const k of ['time','cash','earned','ridesServed','visitors','leftHappy','lost','nextId'])this[k]=finite(s[k],this[k]);
  this.spawnClock=Math.min(2,finite(s.spawnClock));
  for(const k of Object.keys(this.services))this.services[k]=Math.min(8,Math.floor(finite(s.services?.[k])));
  this.claimed=GOALS.filter(g=>Array.isArray(s.claimed)&&s.claimed.includes(g.id)).map(g=>g.id);
  for(const d of RIDES){const t=s.rides?.[d.id];if(!t)continue;Object.assign(this.rides[d.id],{built:d.cost===0||t.built===true,level:Math.max(1,Math.min(UPGRADE_LIMIT,Math.floor(finite(t.level,1)))),revenue:finite(t.revenue),rounds:Math.floor(finite(t.rounds))});}
  if(!Array.isArray(s.guests))return; // Earlier local saves contain the business ledger only.
  const modes=['enter','walk','queue','boarding','riding','rest','foodwalk','foodwait','exit'],seen=new Set();
  for(const g of s.guests.slice(0,this.capacity)){
   if(!g||!Number.isSafeInteger(g.id)||g.id<1||seen.has(g.id)||!Number.isFinite(g.x)||!Number.isFinite(g.z)||!modes.includes(g.mode))continue;
   const path=Array.isArray(g.path)?g.path.filter(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<100)).slice(0,9):[];
   if(['enter','walk','foodwalk','exit'].includes(g.mode)&&!path.length)continue;
   const target=RIDE_BY_ID[g.target]&&this.rides[g.target].built?g.target:null;
   if(['walk','queue','boarding','riding'].includes(g.mode)&&!target)continue;
   this.guests.push({...g,target,style:g.id%18,x:Math.max(-83,Math.min(83,g.x)),z:Math.max(-55,Math.min(45,g.z)),wait:Math.min(200,finite(g.wait)),speed:Math.max(2,Math.min(4,finite(g.speed,2.7))),budget:Math.max(1,Math.min(5,finite(g.budget,2))),visits:Math.min(10,finite(g.visits)),path,pathIndex:Math.min(path.length,Math.floor(finite(g.pathIndex))),visited:Array.isArray(g.visited)?g.visited.filter(id=>RIDE_BY_ID[id]):[]});seen.add(g.id);
  }
  const byId=new Map(this.guests.map(g=>[g.id,g]));
  for(const d of RIDES){const r=this.rides[d.id],t=s.rides?.[d.id];if(!t||!r.built)continue;const valid=(ids,modes)=>Array.isArray(ids)?[...new Set(ids)].filter(id=>{const g=byId.get(id);return g?.target===d.id&&modes.includes(g.mode);}):[];r.queue=valid(t.queue,['queue']).slice(0,rideStats(d,r).queueCap);r.riders=valid(t.riders,['boarding','riding']);r.phase=['loading','boarding','running','unloading'].includes(t.phase)?t.phase:'loading';r.clock=Math.min(d.duration,finite(t.clock));if(['running','boarding'].includes(r.phase)&&!r.riders.length){r.phase='loading';r.clock=0;}}
  // A partially damaged record cannot leave an invisible guest stuck in a ride forever.
  for(const g of this.guests){if(!['queue','boarding','riding'].includes(g.mode))continue;const r=this.rides[g.target],valid=g.mode==='queue'?r.queue.includes(g.id):r.riders.includes(g.id);if(!valid){g.mode='rest';g.wait=0;g.target=null;}}
  this.nextId=Math.max(this.nextId,...this.guests.map(g=>g.id+1));
 }
}
