import {BOSS_TYPES,createBoss,updateBoss} from './bosses.mjs';
import {generateLayout} from './layouts.mjs';
export const BIOMES=['Conch Street','Jellyfish Fields','Krusty Backlot'];
export const POWERS={
 magnet:{name:'Magnet Bubble',tag:'PASSIVE',desc:'Pull nearby loot into your bubble. Upgrades widen the pull.'},
 pinball:{name:'Pinball Dash',tag:'PASSIVE',desc:'Bounce toward another robot after a dash hit. Upgrades add bounces.'},
 decoy:{name:'Bubble Decoy',tag:'ACTIVE',desc:'Leave a bubble that lures robots, then bursts and stuns them.'},
 giant:{name:'Mega Bubble',tag:'ACTIVE',desc:'Grow huge briefly. Upgrades extend the duration. Swallow robots that were too big before.'}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const effectiveMass=s=>s.mass*(s.giant>0?1.85+.12*s.skills.giant:1);
// Shared world dimensions keep movement, rendering and minimap in agreement.
export const ARENA_HALF=25,GROUND_HALF=29,GATE_Z=-23;
export const baseRadius=s=>1.1+3*(1-Math.exp(-Math.max(0,s.mass-10)/300));
export const radius=s=>baseRadius(s)*(s.giant>0?1.25:1);
export const playerLimit=s=>ARENA_HALF-radius(s)*.65;
export const relation=(s,e)=>effectiveMass(s)>=e.mass*1.2?'roll':effectiveMass(s)>=e.mass*.62?'dash':'dodge';
function rand(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296}
function emit(s,type,text='',extra={}){s.events.push({type,text,...extra})}
function id(s){return ++s.serial}
export function createRun(seed=Date.now()>>>0){const s={seed,serial:0,x:0,z:8,heading:0,moving:false,mass:10,hp:5,hits:0,score:0,kills:0,collected:0,time:0,sector:1,sectorTime:0,biome:0,base:10,level:1,xp:0,nextXP:16,skills:{magnet:0,pinball:0,decoy:0,giant:0},activePower:null,powerCD:0,giant:0,dash:0,dashCD:0,bounces:0,invuln:3,steer:null,combo:0,comboTime:0,items:[],enemies:[],hazards:[],decoys:[],boss:null,bossDefeated:false,bossOrder:['truck','jelly','vacuum','crab'],nextBoss:'truck',beacon:{x:0,z:-8},caches:[],layout:null,practice:false,lastDamage:'',gate:{x:0,z:GATE_Z},spawnClock:7,supplyClock:0,patchClock:32,growthTier:1,finished:false,choices:null,events:[],notice:new Set()};for(let i=3;i>1;i--){const j=1+Math.floor(rand(s)*i);[s.bossOrder[i],s.bossOrder[j]]=[s.bossOrder[j],s.bossOrder[i]];}populate(s);return s}
function newItem(s,x,z,kind=0,lost=false){const tier=kind;const need=kind===3?0:kind===0?0:Math.round(s.base*(kind===1?1.3:2.5));const v=kind===3?0:kind===0?1:kind===1?3:7;return {id:id(s),x,z,kind,need,value:v,got:false,lost,ready:lost?s.time+.7:0}}
function populate(s){
 s.items=[];s.enemies=[];s.decoys=[];s.base=Math.max(10,s.mass);s.layout=generateLayout(s,()=>rand(s));s.hazards=s.layout.hazards;s.caches=s.layout.caches;s.nextBoss=s.bossOrder[(s.sector-1)%4];
 for(let i=0;i<105;i++){const center=s.layout.clusters[i%5],a=rand(s)*Math.PI*2,r=Math.sqrt(rand(s))*6.5;const x=clamp(center.x+Math.sin(a)*r,-22,22),z=clamp(center.z+Math.cos(a)*r,-22,22);s.items.push(newItem(s,x,z,i<30?0:i%5===0?2:i%3===0?1:0));}
 for(let i=0;i<12;i++)s.items.push(newItem(s,(i%2?1:-1)*(1.2+i*.14),8-i*.7,0));
 for(let i=0;i<8;i++){const a=i*Math.PI/4;s.items.push(newItem(s,Math.sin(a)*22,Math.cos(a)*22,i%2));}
 const med=s.caches.find(c=>c.medical);s.items.push(newItem(s,clamp(med.x+3,-22,22),med.z,3));s.events=[];
}
export function challengeBoss(s){if(s.finished||s.choices||s.boss||s.caches.some(c=>!c.opened)||dist(s,s.beacon)>7)return false;beginBoss(s);return true;}
function beginBoss(s){s.boss=createBoss(s);s.enemies=[];s.decoys=[];s.invuln=Math.max(s.invuln,3);emit(s,'boss',BOSS_TYPES[s.nextBoss].name+'! '+BOSS_TYPES[s.nextBoss].tip);}
export function createPractice(kind){const s=createRun(730+Object.keys(BOSS_TYPES).indexOf(kind));s.practice=true;s.growthTier=2;s.mass=260;s.level=4;s.nextXP=99999;s.skills={magnet:1,pinball:0,decoy:0,giant:1};s.activePower='giant';s.nextBoss=kind;s.caches.forEach(c=>c.opened=true);s.items=s.items.filter(i=>i.kind===3);s.items.push(newItem(s,10,7,3));s.hazards=[];beginBoss(s);return s;}
function defeatBoss(s,b){
 s.bossDefeated=true;s.dash=0;s.steer=null;
 const before=s.hp;s.clearReward={mass:s.practice?0:30,points:s.practice?0:1800,hp:0};
 if(!s.practice){s.mass+=30;s.collected+=10;s.score+=1800;gain(s,36);s.hp=Math.min(5,s.hp+1);s.clearReward.hp=(s.hp-before)*20;}
}
export function advanceSector(s){if(s.finished||s.practice||!s.bossDefeated||!s.boss?.dead||s.choices)return false;enterSector(s);upgrade(s);return true;}
export function dash(s){if(s.finished||s.choices||s.dashCD>0)return false;s.dash=.72;s.dashCD=Math.max(2.4,3.8-s.skills.pinball*.15);s.invuln=Math.max(s.invuln,.85);s.bounces=s.skills.pinball?1+Math.min(3,s.skills.pinball):0;s.steer=null;emit(s,'dash');return true}
export function usePower(s){if(s.finished||s.choices||!s.activePower||s.powerCD>0)return false;const k=s.activePower;if(k==='giant'){s.giant=7+Math.min(4,s.skills.giant);s.powerCD=Math.max(16,28-s.skills.giant*2);emit(s,'power','MEGA BUBBLE! Roll over bigger robots.')}else{s.decoys.push({id:id(s),x:s.x,z:s.z,life:5+Math.min(3,s.skills.decoy),level:s.skills.decoy});s.powerCD=Math.max(12,22-s.skills.decoy*2);s.invuln=Math.max(s.invuln,1);emit(s,'power','Decoy dropped. Lead the robots away!')}return true}
export function choosePower(s,key){if(!s.choices?.includes(key)||s.skills[key]>=5)return false;s.skills[key]++;if(key==='giant'||key==='decoy'){s.activePower=key;s.powerCD=0;}s.choices=null;emit(s,'upgrade',POWERS[key].name+' upgraded!');return true}
export function swapPower(s){if(s.skills.decoy&&s.skills.giant)s.activePower=s.activePower==='giant'?'decoy':'giant'}
function gain(s,value){s.xp+=value;}
function upgrade(s){if(s.xp<s.nextXP||s.choices)return;s.xp-=s.nextXP;s.level++;s.nextXP=Math.round(24+s.level*18);const keys=s.level===2?['magnet','decoy','giant']:s.level===3?['pinball','decoy','giant']:Object.keys(POWERS).filter(k=>s.skills[k]<5);if(s.level>3&&keys.length>3){const n=Math.floor(rand(s)*keys.length);keys.splice(n,1)}if(!keys.length){s.hp=Math.min(5,s.hp+1);s.score+=500;emit(s,'repair','Master bubble! +20 HP and 500 points.');return;}s.choices=keys;emit(s,'level','Pick a bubble upgrade.')}
export function hurt(s,why){if(s.finished||s.invuln>0)return false;s.hp--;s.hits++;s.lastDamage=why;s.invuln=2.4;s.combo=0;const loss=Math.min(8,Math.floor(s.mass*.13));s.mass=Math.max(6,s.mass-loss);for(let i=0;i<loss;i++){const a=i*6.283/Math.max(1,loss);s.items.push(newItem(s,clamp(s.x+Math.sin(a)*2,-ARENA_HALF+1,ARENA_HALF-1),clamp(s.z+Math.cos(a)*2,-ARENA_HALF+1,ARENA_HALF-1),0,true))}emit(s,'hurt','-20 HP · '+why+(s.hp>0?' Find a medical pickup.':''),{x:s.x,z:s.z});if(s.hp<=0){s.finished=true;emit(s,'lost','Bubble popped!')}return true}
export function spawnEnemy(s,kind){if(s.enemies.length>=20)return null;kind ||= s.sectorTime<17?'chaser':['chaser','charger','vacuum'][Math.floor(rand(s)*3)];const a=rand(s)*6.283,around=11+rand(s)*4;let x=clamp(s.x+Math.sin(a)*around,-ARENA_HALF+1,ARENA_HALF-1),z=clamp(s.z+Math.cos(a)*around,-ARENA_HALF+1,ARENA_HALF-1);if(Math.hypot(x-s.x,z-s.z)<7){x=-Math.sign(s.x||1)*(ARENA_HALF-3);z=-Math.sign(s.z||1)*(ARENA_HALF-5)}const tier=rand(s);const threatBase=Math.max(s.base,s.mass*.7);const mass=Math.round(threatBase*(tier<.35?.8:tier<.82?1.8:3.4)+Math.min(20,s.sectorTime*.12));const e={id:id(s),kind,x,z,mass,phase:'arrive',clock:1.2,stun:0,hitCD:0,angle:0,vx:0,vz:0,stolen:0};s.enemies.push(e);return e}
function eat(s,e){e.dead=true;s.kills++;s.mass+=Math.max(3,Math.min(30,Math.round(e.mass*.17)));s.score+=Math.round(e.mass*8);gain(s,7);emit(s,'eat','Robot rolled up!',{x:e.x,z:e.z,kind:e.kind});if(e.stolen)for(let i=0;i<Math.min(8,e.stolen);i++)s.items.push(newItem(s,e.x+(rand(s)-.5)*2,e.z+(rand(s)-.5)*2,0));}
function bounce(s,e){if(s.bounces<=0)return;const next=s.enemies.filter(n=>n!==e&&!n.dead&&n.phase!=='arrive'&&relation(s,n)!=='dodge'&&dist(e,n)<7).sort((a,b)=>dist(e,a)-dist(e,b))[0];if(next){s.bounces--;s.steer={x:next.x,z:next.z};s.dash=.65;s.invuln=Math.max(s.invuln,.8);emit(s,'chain','PINBALL!')}}
function knock(s,e,amount=3){const d=Math.max(.1,dist(s,e));e.x=clamp(e.x+(e.x-s.x)/d*amount,-ARENA_HALF+1,ARENA_HALF-1);e.z=clamp(e.z+(e.z-s.z)/d*amount,-ARENA_HALF+1,ARENA_HALF-1);e.stun=2.1;}
function enterSector(s){s.sector++;s.biome=(s.sector-1)%3;s.sectorTime=0;s.x=0;s.z=11;s.hp=Math.min(5,s.hp+1);s.invuln=4;s.boss=null;s.bossDefeated=false;s.clearReward=null;s.spawnClock=6;s.patchClock=30;s.steer=null;s.dash=0;if((s.sector-1)%4===0){const previous=s.bossOrder[3];for(let i=3;i>0;i--){const j=Math.floor(rand(s)*(i+1));[s.bossOrder[i],s.bossOrder[j]]=[s.bossOrder[j],s.bossOrder[i]];}if(s.bossOrder[0]===previous)[s.bossOrder[0],s.bossOrder[1]]=[s.bossOrder[1],s.bossOrder[0]];}populate(s);s.score+=1000;emit(s,'sector','Street '+s.sector+' · '+BIOMES[s.biome]+'. +20 HP.');}
export function step(s,dt,input={}){s.events=[];if(s.finished||s.choices||s.bossDefeated)return;dt=Math.min(.05,Math.max(0,dt));s.time+=dt;s.sectorTime+=dt;for(const k of ['invuln','dash','dashCD','powerCD','giant','comboTime'])s[k]=Math.max(0,s[k]-dt);if(!s.comboTime)s.combo=0;
 let x=input.x||0,z=input.z||0;const target=s.dash>0&&s.steer?s.steer:input.target;if(target){const dx=target.x-s.x,dz=target.z-s.z,d=Math.hypot(dx,dz);if(d>.2){x=dx/d;z=dz/d}else{x=z=0;if(input.target)input.target=null;}}const len=Math.hypot(x,z);if(len>1){x/=len;z/=len}s.moving=len>.05;if(s.moving)s.heading=Math.atan2(x,z);const speed=s.dash>0?11:4.6;s.x=clamp(s.x+x*speed*dt,-playerLimit(s),playerLimit(s));s.z=clamp(s.z+z*speed*dt,-playerLimit(s),playerLimit(s));
 const current=s.layout.current;if(s.biome===1&&Math.abs(s.x-current.x)<current.w/2&&Math.abs(s.z-current.z)<current.h/2&&s.dash<=0){s.x+=dt*current.dx;s.z+=dt*current.dz;}
 for(const h of s.hazards){if(s.boss){h.phase='idle';continue;}const t=(s.time+h.offset)%10;h.phase=t<6?'idle':t<8?'warning':'zap';if(h.phase==='zap'){if(dist(s,h)<h.r)hurt(s,'Jelly zap!');for(const e of s.enemies)if(dist(e,h)<h.r)e.stun=Math.max(e.stun,1.7)}}
 if(s.finished)return;
 s.spawnClock-=dt;if(s.spawnClock<=0&&!s.boss){spawnEnemy(s);s.spawnClock=Math.max(2.8,7-s.sector*.35-s.sectorTime*.025)}s.supplyClock-=dt;if(s.supplyClock<=0&&!s.practice){s.supplyClock=2;const alive=s.items.filter(i=>!i.got&&!i.lost).length;if(alive<124){for(let i=0;i<4;i++){const a=rand(s)*6.283,r=4+rand(s)*8;s.items.push(newItem(s,clamp(s.x+Math.sin(a)*r,-ARENA_HALF+2,ARENA_HALF-2),clamp(s.z+Math.cos(a)*r,-ARENA_HALF+2,ARENA_HALF-2),rand(s)<.65?0:rand(s)<.7?1:2));}}}s.patchClock-=dt;if(s.patchClock<=0&&!s.practice){s.patchClock=38;if(!s.items.some(i=>i.kind===3&&!i.got))s.items.push(newItem(s,clamp(-s.x,-ARENA_HALF+5,ARENA_HALF-5),clamp(-s.z,-ARENA_HALF+5,ARENA_HALF-5),3))}
 for(const decoy of s.decoys){decoy.life-=dt;if(decoy.life<=0&&!decoy.dead){decoy.dead=true;for(const e of s.enemies)if(dist(decoy,e)<5+decoy.level){knock(decoy,e,3);e.stun=3+decoy.level*.3;}emit(s,'decoyBurst','Decoy burst!',{x:decoy.x,z:decoy.z})}}s.decoys=s.decoys.filter(d=>!d.dead);
 for(const e of s.enemies){if(e.dead)continue;e.hitCD=Math.max(0,e.hitCD-dt);e.stun=Math.max(0,e.stun-dt);e.clock-=dt;const lure=s.decoys.reduce((a,b)=>!a||dist(e,b)<dist(e,a)?b:a,null),target=lure||s,dx=target.x-e.x,dz=target.z-e.z,d=Math.max(.01,Math.hypot(dx,dz));const pace=Math.min(3,1.4+s.sector*.12);
  if(e.phase==='arrive'){if(e.clock<=0){e.phase='hunt';e.clock=2;}continue}
  if(e.stun<=0){if(e.kind==='charger'){if(e.phase==='charge'){e.x+=e.vx*dt;e.z+=e.vz*dt;for(const other of s.enemies)if(other!==e&&!other.dead&&dist(other,e)<1.6){other.stun=2;knock(e,other,1.5)}if(e.clock<=0||Math.abs(e.x)>ARENA_HALF-1||Math.abs(e.z)>ARENA_HALF-1){e.phase='hunt';e.clock=2.5;e.stun=1.2;e.x=clamp(e.x,-ARENA_HALF+1,ARENA_HALF-1);e.z=clamp(e.z,-ARENA_HALF+1,ARENA_HALF-1);emit(s,'crash','',{x:e.x,z:e.z})}}else if(e.phase==='warning'){if(e.clock<=0){e.phase='charge';e.clock=1.2;e.vx=Math.sin(e.angle)*8;e.vz=Math.cos(e.angle)*8}}else{e.x+=dx/d*pace*.65*dt;e.z+=dz/d*pace*.65*dt;if(e.clock<=0){e.phase='warning';e.clock=1.2;e.angle=Math.atan2(dx,dz)}}}else{e.angle=Math.atan2(dx,dz);if(d>(e.kind==='vacuum'?4:0)){e.x+=dx/d*pace*(e.kind==='vacuum'?.7:1)*dt;e.z+=dz/d*pace*(e.kind==='vacuum'?.7:1)*dt;}}
   if(e.kind==='vacuum'){for(const item of s.items){if(item.got||item.kind===3||item.lost)continue;const d=dist(e,item);if(d<4){item.x+=(e.x-item.x)/Math.max(d,.1)*dt*1.6;item.z+=(e.z-item.z)/Math.max(d,.1)*dt*1.6;if(d<.6){item.got=true;e.stolen++;e.mass+=.5}}}if(dist(s,e)<4&&s.dash<=0){s.x+=(e.x-s.x)*dt*.13;s.z+=(e.z-s.z)*dt*.13;}}
  }
  if(dist(s,e)<radius(s)+.65){const r=relation(s,e);if(r==='roll'||r==='dash'&&e.stun>0){eat(s,e);if(s.dash>0)bounce(s,e);}else if(s.dash>0&&e.hitCD<=0){e.hitCD=1;e.stun=2;if(r==='dash'){eat(s,e);bounce(s,e);}else{knock(s,e,3);emit(s,'bump','Too big! Grow or use Mega Bubble.',{x:e.x,z:e.z});}}else if(e.stun<=0&&e.phase!=='warning')hurt(s,'Robot bumped you!');}
 }
 s.enemies=s.enemies.filter(e=>!e.dead);if(s.finished)return;
 for(const item of s.items){if(item.got||item.ready>s.time)continue;const d=dist(s,item);if(item.kind===3){if(d<radius(s)+.4&&s.hp<5){s.hp=Math.min(5,s.hp+1);item.got=true;emit(s,'repair','+20 HP · medical pickup',{x:item.x,z:item.z})}continue;}if(effectiveMass(s)<item.need)continue;const pull=s.skills.magnet?radius(s)+1.7+s.skills.magnet*.8:0;if(d<pull&&d>radius(s)*.8){item.x+=(s.x-item.x)/d*dt*5;item.z+=(s.z-item.z)/d*dt*5;}if(d<radius(s)+.25){item.got=true;s.mass+=item.value;s.collected++;s.combo++;s.comboTime=2;s.score+=item.value*10+(Math.min(10,s.combo)-1)*2;if(!item.lost)gain(s,item.kind===2?4:item.kind===1?2:1);emit(s,'pickup','',{x:item.x,z:item.z,kind:item.kind});}}
 s.items=s.items.filter(i=>!i.got);
 const tier=Math.floor(baseRadius(s)/1.1);if(tier>s.growthTier){s.growthTier=tier;emit(s,'growth',tier>=3?'COLOSSAL! Your bubble is 3× wider.':'SUPER-SIZED! Your bubble is 2× wider.');}
 // Vacuum pulls and growth can move the hull toward the edge after movement.
 const edge=playerLimit(s);s.x=clamp(s.x,-edge,edge);s.z=clamp(s.z,-edge,edge);
 if(!s.boss){for(const cache of s.caches){if(!cache.opened&&dist(s,cache)<radius(s)+1){cache.opened=true;s.mass+=16;s.score+=300;gain(s,8);if(cache.medical)s.hp=Math.min(5,s.hp+1);emit(s,'cache',cache.medical?'Medical cache! +20 HP.':'Supply cache found! +16 size.');}}}
 updateBoss(s,dt,{radius:radius(s),hurt,emit,defeat:defeatBoss});if(s.hp<=0)return;const finalEdge=playerLimit(s);s.x=clamp(s.x,-finalEdge,finalEdge);s.z=clamp(s.z,-finalEdge,finalEdge);
 if(s.bossDefeated)return;upgrade(s);
}
