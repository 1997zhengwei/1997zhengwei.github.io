import {clamp,rng,podiumPrize} from './rules.mjs';

export const ARENA_SIZE=82,MATCH_SECONDS=120;
export const SWALLOW_RATIO=1.25,RESPAWN_SECONDS=5,SPAWN_SHIELD=4;
export const FOOD={
 can:{name:'饮料罐',need:.24,mass:3},cone:{name:'路锥',need:.28,mass:3},bin:{name:'垃圾桶',need:.4,mass:5},crate:{name:'快递箱',need:.45,mass:5},hydrant:{name:'消防栓',need:.4,mass:5},
 tree:{name:'行道树',need:.7,mass:10},bench:{name:'长椅',need:.84,mass:12},car:{name:'汽车',need:1.12,mass:25},truck:{name:'巴士',need:1.65,mass:48},kiosk:{name:'街角商铺',need:1.5,mass:38},house:{name:'住宅楼',need:2.18,mass:85},tower:{name:'高楼',need:2.4,mass:150}
};
export const arenaRadius=mass=>Math.min(11,.93+Math.sqrt(Math.max(0,mass))*.105);
export const stageFor=r=>r<1.4?'街角搜集者':r<2.5?'汽车吞噬者':r<4.1?'街区清道夫':r<6.5?'高楼粉碎者':'城市主宰';
export function buildingHalf(item){const dims=item.type==='tower'?[1.75,1.6]:item.type==='house'?[1.575,1.45]:[1.05,.9],turn=Math.abs(Math.round((item.rotation||0)/Math.PI*2))%2;return{x:dims[turn?1:0]*item.scale,z:dims[turn?0:1]*item.scale};}
export function canConsume(p,item){return !p.retired&&item.state==='idle'&&p.radius>=FOOD[item.type].need*item.scale*1.08;}
export function arenaRanking(w){return [...w.players].sort((a,b)=>Number(a.retired)-Number(b.retired)||b.score-a.score||b.mass-a.mass||a.id-b.id);}
export function protectedInArena(w,p){return w.time<12||w.time<(p.shieldUntil||0);}
export function canSwallow(w,p,q){return p.id!==q.id&&!p.retired&&!q.retired&&!protectedInArena(w,p)&&!protectedInArena(w,q)&&p.radius>=q.radius*SWALLOW_RATIO;}
export function rivalRelation(w,p,q){return q.retired?'returning':protectedInArena(w,q)||protectedInArena(w,p)?'shield':canSwallow(w,q,p)?'danger':canSwallow(w,p,q)?'prey':'even';}
export function createArena(seed=Date.now()){
 const random=rng(seed),items=[];let nextId=0;
 const add=(type,x,z,scale=1,color=Math.floor(random()*6))=>{const item={id:nextId++,type,x,z,scale,color,rotation:random()*Math.PI*2,state:'idle'};items.push(item);return item;};
 const centers=[-54,-18,18,54];
 for(const x of centers)for(const z of centers){
  const park=x===-18&&z===18||x===54&&z===-18;
  if(park){for(let n=0;n<14;n++)add(n%3?'tree':'bench',x+(random()-.5)*19,z+(random()-.5)*19,1+random()*.35);}
  else for(const dx of[-6.3,6.3])for(const dz of[-6.3,6.3]){const type=random()<.35?'house':'tower',scale=type==='tower'?1.4+random()*1.2:1.5+random()*.7;add(type,x+dx,z+dz,scale);}
  for(let n=0;n<4;n++)add('kiosk',x+(n<2?-1:1)*12.4,z+(n%2?12.4:-12.4),1+random()*.3);
  for(let n=0;n<16;n++){const edge=n%4,offset=(random()-.5)*23;add(['can','bin','crate','cone','hydrant'][n%5],x+(edge<2?(edge?12.7:-12.7):offset),z+(edge>=2?(edge===2?12.7:-12.7):offset));}
 }
 for(const road of[-72,-36,0,36,72])for(let n=-68;n<=68;n+=10){
  add('car',road+(n%20===0?-3.8:3.8),n,1+random()*.25);
  if(Math.abs(road)>1)add('car',n,road+(n%20===0?3.8:-3.8),1+random()*.25);
  if(n%30===2)add('truck',road-3.5,n+4,1.1);
 }
 // A legible first route: small objects at the intersection, then vehicles and shops.
 for(let n=0;n<24;n++){const a=n*Math.PI/6,r=3.6+Math.floor(n/12)*3.8;add(['can','crate','bin','cone'][n%4],Math.cos(a)*r,6+Math.sin(a)*r,.95,n%6);}
 for(let n=0;n<8;n++){const a=n*Math.PI/4;add('can',Math.cos(a)*.65,6+Math.sin(a)*.65,.85,n%6);}
 for(let n=0;n<7;n++)add(n%2?'crate':'can',(n%2?.5:-.5),3-n*1.8,.95,n%6);
 const spawns=[[0,6],[-36,-36],[36,36],[-36,36],[36,-36],[0,-68]];
 const names=['你','引力猎手','凌星','暗流','轨道客','远行者'],colors=['#aa8bff','#fc718f','#4ccad2','#ffbf54','#77a1ff','#8aca83'];
 const players=spawns.map(([x,z],id)=>({id,name:names[id],color:colors[id],x,z,vx:0,vz:0,heading:Math.PI,mass:0,score:0,radius:.93,count:0,kills:0,deaths:0,retired:false,eatenAt:0,eatenBy:null,respawnAt:0,shieldUntil:0,behavior:'gather',targetId:null,personality:['player','hunter','forager','hunter','careful','rookie'][id],biggest:'饮料罐',bestMass:0,think:0,rest:0,stuck:0,escape:0,escapeDirection:null,aim:null,skill:[1,.97,.91,.87,.77,.64][id]}));
 return{seed,random,items,players,time:0,remaining:MATCH_SECONDS,mode:'ready',events:[],awarded:false,reason:'time',blocks:centers,nextRenewal:1};
}
export function arenaBot(w,p){
 p.behavior='gather';p.targetId=null;let danger=null,threat=Infinity;
 for(const q of w.players)if(canSwallow(w,q,p)){const d=Math.hypot(q.x-p.x,q.z-p.z)-q.radius;if(d<(p.personality==='careful'?18:12)&&d<threat){danger=q;threat=d;}}
 if(danger){p.behavior='flee';p.targetId=danger.id;const dx=p.x-danger.x,dz=p.z-danger.z;return{x:dx||Math.cos(p.id*2.4),z:dz||Math.sin(p.id*2.4)};}
 let best=null,value=-Infinity,prey=null,preyValue=-Infinity;
 for(const q of w.players)if(canSwallow(w,p,q)){const d=Math.hypot(q.x-p.x,q.z-p.z),range=p.radius+(p.personality==='hunter'?32:16);if(d<range){const score=(35+q.mass*.6)/(5+d*1.1);if(score>preyValue){prey=q;preyValue=score;}}}
 for(const item of w.items){if(!canConsume(p,item))continue;const d=Math.hypot(item.x-p.x,item.z-p.z),mass=FOOD[item.type].mass*Math.pow(item.scale,1.4);const score=mass/(3+d*1.45)-Math.max(0,d-26)*.22;
  if(score>value){value=score;best=item;}}
 if(prey&&(p.personality==='hunter'||preyValue>value*1.2)){p.behavior='hunt';p.targetId=prey.id;const lead=Math.min(.7,Math.hypot(prey.x-p.x,prey.z-p.z)/18);return{x:prey.x+prey.vx*lead-p.x,z:prey.z+prey.vz*lead-p.z};}
 if(!best)return{x:Math.sin(w.time*.3+p.id),z:Math.cos(w.time*.3+p.id)};
 return{x:best.x-p.x,z:best.z-p.z};
}
// Re-entry uses real streets away from all living holes, including the player.
export function respawnArenaBot(w,p){
 const candidates=[];for(const x of[-72,-36,0,36,72])for(const z of[-72,-36,0,36,72]){
  let clearance=Infinity;for(const q of w.players)if(!q.retired&&q.id!==p.id)clearance=Math.min(clearance,Math.hypot(q.x-x,q.z-z)-q.radius-(q.id===0?14:0));
  const food=w.items.filter(i=>i.state==='idle'&&FOOD[i.type].need<1.2&&Math.hypot(i.x-x,i.z-z)<14).length;
  candidates.push({x,z,value:Math.min(40,clearance)+Math.min(8,food)*1.4,clearance});
 }
 const safe=candidates.filter(c=>c.clearance>12).sort((a,b)=>b.value-a.value);if(!safe.length){p.respawnAt=w.time+1;return false;}
 const spot=safe[Math.floor(w.random()*Math.min(4,safe.length))],masses=w.players.filter(q=>!q.retired).map(q=>q.mass).sort((a,b)=>a-b),mass=Math.round(clamp((masses[Math.floor(masses.length/2)]||0)*.12,55,280));
 Object.assign(p,{x:spot.x,z:spot.z,mass,radius:arenaRadius(mass),vx:0,vz:0,retired:false,shieldUntil:w.time+SPAWN_SHIELD,respawnAt:0,aim:null,think:0,rest:0,stuck:0,escape:0,behavior:'gather',targetId:null});
 w.events.push({type:'respawn',player:p.id});return true;
}
function renewCity(w){
 if(w.time<w.nextRenewal)return;w.nextRenewal=w.time+.8;let budget=6;
 for(const item of w.items){if(budget<=0)break;if(item.state!=='falling'||w.time<(item.renewAt??Infinity))continue;
  if(w.players.some(p=>!p.retired&&Math.hypot(p.x-item.x,p.z-item.z)<Math.max(p.id===0?29:9,p.radius+FOOD[item.type].need*item.scale+4)))continue;
  item.state='idle';item.renewedAt=w.time;item.shadowGone=false;item.renewAt=null;budget--;
 }
}
export function moveArenaPlayer(w,p,dx,dz,dt){
 const length=Math.hypot(dx,dz),mag=Math.min(1,length);dx=length?dx/length*mag:0;dz=length?dz/length*mag:0;
 const speed=8.6/(1+Math.max(0,p.radius-2)*.018),factor=1-Math.exp(-dt*12);p.vx+=(dx*speed-p.vx)*factor;p.vz+=(dz*speed-p.vz)*factor;
 const limit=ARENA_SIZE-p.radius*.6;let x=clamp(p.x+p.vx*dt,-limit,limit),z=clamp(p.z+p.vz*dt,-limit,limit);
 // Large buildings stay solid until the hole is wide enough to consume them.
 for(const item of w.items){if(item.state!=='idle'||!['house','tower','kiosk'].includes(item.type)||canConsume(p,item))continue;
  const half=buildingHalf(item),minX=item.x-half.x-.5,maxX=item.x+half.x+.5,minZ=item.z-half.z-.5,maxZ=item.z+half.z+.5;
  if(x>minX&&x<maxX&&z>minZ&&z<maxZ){const edges=[x-minX,maxX-x,z-minZ,maxZ-z],edge=edges.indexOf(Math.min(...edges));if(edge===0)x=minX;else if(edge===1)x=maxX;else if(edge===2)z=minZ;else z=maxZ;}}
 const moved=Math.hypot(x-p.x,z-p.z);p.x=clamp(x,-limit,limit);p.z=clamp(z,-limit,limit);if(Math.hypot(p.vx,p.vz)>.2)p.heading=Math.atan2(p.vx,p.vz);return moved;
}
export function stepArena(w,dt,input={}){
 if(w.mode!=='play')return;dt=clamp(dt,0,.05);w.events=[];w.time=Math.min(MATCH_SECONDS,w.time+dt);w.remaining=Math.max(0,MATCH_SECONDS-w.time);
 if(w.remaining===0){w.mode='result';w.reason='time';return;}
 for(const p of w.players)if(p.id!==0&&p.retired&&w.time>=p.respawnAt)respawnArenaBot(w,p);
 renewCity(w);
 for(const p of w.players){if(p.retired)continue;let control=input;
  if(p.id!==0){p.rest=Math.max(0,p.rest-dt);p.escape=Math.max(0,p.escape-dt);p.think-=dt;if(p.think<=0||!p.aim){p.aim=arenaBot(w,p);p.think=.12+(1-p.skill)*.4;}control=p.rest>0?{x:0,z:0}:p.escape>0?p.escapeDirection:p.aim;}
  const moved=moveArenaPlayer(w,p,control.x||0,control.z||0,dt);
  if(p.id!==0){p.stuck=p.rest<=0&&Math.hypot(control.x||0,control.z||0)>.2&&moved<dt*.5?p.stuck+dt:Math.max(0,p.stuck-dt*2);if(p.stuck>.55&&p.escape===0){const turn=p.id%2?1:-1;p.escapeDirection={x:-(control.z||0)*turn,z:(control.x||1)*turn};p.escape=1.25;p.stuck=0;}}
  for(const item of w.items){if(!canConsume(p,item))continue;const def=FOOD[item.type],distance=Math.hypot(item.x-p.x,item.z-p.z);
   if(distance>p.radius-def.need*item.scale*.23)continue;
   item.state='falling';item.owner=p.id;item.captured=w.time;item.dx=item.x-p.x;item.dz=item.z-p.z;item.renewAt=w.time+(['tower','house','kiosk'].includes(item.type)?36:['car','truck'].includes(item.type)?23:14)+w.random()*8;const mass=Math.round(def.mass*Math.pow(item.scale,1.4));p.mass+=mass;p.score+=mass;p.count++;p.radius=arenaRadius(p.mass);if(p.id!==0)p.rest=Math.max(p.rest,.3+(1-p.skill)*1.8);
   if(mass>p.bestMass){p.bestMass=mass;p.biggest=def.name;}w.events.push({type:'eat',player:p.id,item,mass});
  }
 }
 if(w.time>=12)for(const p of [...w.players].sort((a,b)=>b.radius-a.radius)){if(p.retired)continue;for(const q of w.players){if(!canSwallow(w,p,q))continue;if(Math.hypot(p.x-q.x,p.z-q.z)>p.radius-q.radius*.65)continue;
   q.retired=true;q.eatenAt=w.time;q.eatenBy=p.id;q.respawnAt=w.time+RESPAWN_SECONDS;q.deaths++;q.behavior='returning';p.kills++;const mass=Math.max(35,Math.round(q.mass*.6));p.mass+=mass;p.score+=mass;p.radius=arenaRadius(p.mass);w.events.push({type:'swallow',player:p.id,victim:q.id});if(q.id===0){w.mode='result';w.reason='absorbed';return;}
  }}
 if(w.remaining===0){w.mode='result';w.reason='time';}
}
export function arenaResult(w){const p=w.players[0],rank=arenaRanking(w).findIndex(q=>q.id===0)+1;return{rank,score:p.score,count:p.count,kills:p.kills,radius:p.radius,biggest:p.biggest,coins:p.retired?0:podiumPrize(rank),retired:p.retired,time:w.time};}
export function settleArena(w,save){const result=arenaResult(w);if(!w.awarded){w.awarded=true;save.coins+=result.coins;if(result.rank===1&&!result.retired)save.wins++;}return result;}
