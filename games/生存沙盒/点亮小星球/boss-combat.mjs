import {crewScale} from './frontier-balance.mjs';
// Authoritative encounters: one input vocabulary (walk + automatic fire).
export const BOSS_IDS={8:'aegis',9:'thornback',10:'moonwing',11:'starcrown'};
export const BOSS_HELP={
 aegis:'Leave the orange slam. Fire into the open chest.',
 thornback:'Step sideways from the charge. Bait it into a crystal for a longer stun.',
 moonwing:'Walk between the three wind blades. Attack when it lands.',
 starcrown:'Break both rings. Dodge the locked marks, then fire while the starcore opens.'
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function hazardContains(h,p,pad=0){
 if(h.shape==='lane'){
  const dx=h.endX-h.x,dz=h.endZ-h.z,l2=dx*dx+dz*dz;
  const t=l2?clamp(((p.x-h.x)*dx+(p.z-h.z)*dz)/l2,0,1):0;
  return Math.hypot(p.x-h.x-dx*t,p.z-h.z-dz*t)<=h.width+pad;
 }
 return distance(h,p)<=h.radius+pad;
}
export function initBoss(e){
 if(e.type!=='boss'||!BOSS_IDS[e.zone])return;
 e.bossKind=BOSS_IDS[e.zone];e.bossStage='ready';e.bossTime=2.8;e.bossDuration=2.8;
 e.bossHint='Guardian arriving · Keep space';e.bossPose=null;e.coreOpen=false;
 if(e.bossKind==='starcrown')e.rings=[0,1].map(id=>({id,hp:e.maxHp*.085,maxHp:e.maxHp*.085}));
}
function stage(e,name,time,hint){e.bossStage=name;e.bossTime=time;e.bossDuration=time;e.bossHint=hint;}
function warning(w,e,h){const mark={id:w.uid++,owner:e.id,time:2.5,duration:2.5,damage:e.damage,radius:0,...h};w.hazards.push(mark);w.emit('warning',mark);return mark;}
function direction(e,p){const d=Math.max(.001,distance(e,p));return {x:(p.x-e.x)/d,z:(p.z-e.z)/d};}
function face(e,d){e.faceX=e.x+d.x*10;e.faceZ=e.z+d.z*10;}
function windup(w,e,target){
 const d=direction(e,target);e.attackDirection=d;face(e,d);e.coreOpen=false;
 if(e.bossKind==='aegis'){
  stage(e,'windup',2.6,'SLAM · Leave the orange circles');
  warning(w,e,{x:target.x,z:target.z,radius:3.2,time:2.6,duration:2.6,label:'SLAM · WALK OUT'});
  if(e.hp/e.maxHp<.5){const other=w.online().find(p=>p.id!==target.id&&!p.down&&distance(p,e)<25);if(other)warning(w,e,{x:other.x,z:other.z,radius:2.8,time:2.6,duration:2.6,label:'SLAM · WALK OUT'});}
 }else if(e.bossKind==='thornback'){
  stage(e,'windup',2.5,'CHARGE · Step sideways · Bait a crystal');
  e.chargeStart={x:e.x,z:e.z};e.chargeEnd={x:clamp(e.x+d.x*17,-19,19),z:clamp(e.z+d.z*17,Math.max(e.arenaZ-15,-12-([1060,1300,1460,1620][e.zone-8])+4),Math.min(e.arenaZ+15,-12-([920,1140,1300,1460][e.zone-8])-4))};
  warning(w,e,{x:e.x,z:e.z,endX:e.chargeEnd.x,endZ:e.chargeEnd.z,shape:'lane',width:1.7,damage:0,label:'CHARGE → SIDE STEP'});
 }else if(e.bossKind==='moonwing'){
  stage(e,'windup',2.8,'WIND BLADES · Find a gap between the lanes');
  const angle=Math.atan2(d.x,d.z);
  for(const offset of [-.55,0,.55])warning(w,e,{x:e.x,z:e.z,endX:e.x+Math.sin(angle+offset)*21,endZ:e.z+Math.cos(angle+offset)*21,shape:'lane',width:.65,time:2.8,duration:2.8,label:offset===0?'WIND BLADES · FIND GAP':''});
 }else{
  e.attackIndex=(e.attackIndex||0)+1;
  // Mark the locked PLAYER position, including the far edge of gun/pet range.
  // Every second cast uses separate starfall circles, so standing at the same
  // radius is no longer a safe solution. Normal walking clears either shape.
  if(e.attackIndex%2===0){
   stage(e,'windup',2.8,'STARFALL · Leave the locked circles');
   for(const p of w.online().filter(p=>!p.down&&distance(p,e)<30).slice(0,8))warning(w,e,{x:p.x,z:p.z,radius:2.6,time:2.8,duration:2.8,damage:Math.max(e.damage,p.maxHpForBoss*.20||0),label:'STARFALL · WALK OUT'});
   return;
  }
  stage(e,'windup',2.7,e.rings.some(r=>r.hp>0)?'TAIL SWEEP · Dodge the strip · Break bright rings':'TAIL SWEEP · Dodge first · Core opens after impact');
  const side={x:d.z,z:-d.x},center={x:target.x,z:target.z};
  warning(w,e,{x:center.x-side.x*11,z:center.z-side.z*11,endX:center.x+side.x*11,endZ:center.z+side.z*11,shape:'lane',width:1.35,time:2.7,duration:2.7,damage:Math.max(e.damage,target.maxHpForBoss*.20||0),label:'TAIL SWEEP · WALK OUT'});
 }
}
export function rebalanceBoss(w,e,dt){
 if(e.type!=='boss')return;
 const crew=w.bossCrew? w.bossCrew(e):w.online().filter(p=>!p.down&&distance(p,e)<30),n=Math.max(1,crew.length);
 e.baseMaxHp||=e.maxHp/(e.crewScale||1);e.crewScale||=e.maxHp/e.baseMaxHp;
 if(e.pendingCrew!==n){e.pendingCrew=n;e.crewChangeAt=w.time+3;}
 if(w.time<(e.crewChangeAt||0))return;
 e.crewCount=n;const target=crewScale(n),change=Math.max(-dt*.45,Math.min(dt*.45,target-e.crewScale));if(Math.abs(change)<1e-8)return;
 const previous=e.maxHp;e.crewScale+=change;e.maxHp=e.baseMaxHp*e.crewScale;e.hp=e.hp/previous*e.maxHp;
 for(const ring of e.rings||[]){const ratio=ring.hp/ring.maxHp;ring.maxHp=e.maxHp*.085;ring.hp=ring.maxHp*ratio;}
}
export function updateBoss(w,e,people,dt){
 if(!e.bossKind)initBoss(e);
 if(!e.bossKind)return false;
 rebalanceBoss(w,e,dt);
 if(!Number.isFinite(e.arenaZ)){
  e.arenaZ=e.z;e.arenaX=e.x;
  if(e.bossKind==='thornback')e.pillars=[0,1,2,3].map(i=>({x:clamp(e.x+Math.sin(i*Math.PI/2)*10,-19,19),z:e.z+Math.cos(i*Math.PI/2)*10}));
 }
 const target=people.filter(p=>!p.down&&distance(p,e)<30).sort((a,b)=>distance(a,e)-distance(b,e))[0];
 if(!target){e.bossHint='Return to the arena';return true;}
 e.bossTime=Math.max(0,e.bossTime-dt);
 const progress=1-e.bossTime/e.bossDuration;
 if(e.bossStage==='ready'){
  e.bossPose=null;e.bossHint=BOSS_HELP[e.bossKind];face(e,direction(e,target));
  if(e.bossTime<=0)windup(w,e,target);
 }else if(e.bossStage==='windup'){
  e.bossPose=progress*.35;
  if(e.bossTime<=0){
   stage(e,'attack',e.bossKind==='thornback'?1.2:.55,e.bossKind==='thornback'?'CHARGING · Stay out of its path':'IMPACT · Keep clear');
   e.chargeHit=[];
  }
 }else if(e.bossStage==='attack'){
  e.bossPose=.36+progress*.18;
  if(e.bossKind==='thornback'){
   const from={x:e.x,z:e.z},d=direction(e,e.chargeEnd),step=Math.min(distance(e,e.chargeEnd),16*dt);
   const next={x:e.x+d.x*step,z:e.z+d.z*step};
   const pillar=e.pillars.find(p=>distance(p,next)<2.2);
   if(pillar){e.crashed=true;e.bossTime=0;w.emit('impact',{x:pillar.x,z:pillar.z,radius:2});}
   else if(w.clear(next.x,next.z)){e.x=next.x;e.z=next.z;}else e.bossTime=0;
   face(e,d);
   const sweep={shape:'lane',...from,endX:e.x,endZ:e.z,width:1.7};
   for(const p of people)if(!p.down&&!e.chargeHit.includes(p.id)&&hazardContains(sweep,p,.35)){w.hurt(p,e.damage*1.15,'boss-charge');e.chargeHit.push(p.id);}
   const crystal=e.pillars.find(p=>hazardContains(sweep,p,1));
   if(crystal){e.crashed=true;e.bossTime=0;w.emit('impact',{x:crystal.x,z:crystal.z,radius:2});}
   if(distance(e,e.chargeEnd)<.05)e.bossTime=0;
  }
  if(e.bossTime<=0){
   const exposed=e.bossKind==='aegis'||e.bossKind==='thornback'||e.bossKind==='moonwing';e.coreOpen=exposed;
   stage(e,'recovery',e.bossKind==='aegis'?5:e.bossKind==='thornback'?(e.crashed?5.5:3.3):e.bossKind==='moonwing'?4:3.5,
    e.bossKind==='aegis'?'CHEST OPEN · Attack the bright core':e.bossKind==='thornback'?(e.crashed?'CRYSTAL STUN · Attack!':'TIRED · Attack before the next charge'):e.bossKind==='moonwing'?'LANDED · Attack the glowing core':e.rings.some(r=>r.hp>0)?`BREAK THE BRIGHT RINGS · ${e.rings.filter(r=>r.hp>0).length}/2 left`:'STARCORE OPEN · Finish it!');
   w.emit('guardianCore',{x:e.x,z:e.z,open:exposed,duration:e.bossDuration});
  }
 }else{
  e.bossPose=.58+progress*.4;
  if(e.bossTime<=0){e.crashed=false;stage(e,'ready',1.8,BOSS_HELP[e.bossKind]);e.coreOpen=false;}
 }
 // Visible armor stays intact until its corresponding authoritative ring is broken.
 if(e.bossKind==='starcrown'){
  e.coreOpen=e.rings.every(r=>r.hp<=0)&&e.bossStage==='recovery';
  if(!e.coreOpen&&e.bossStage==='recovery')e.bossPose=null;
 }
 e.coreRemaining=e.bossStage==='recovery'?e.bossTime:0;
 return true;
}
export function bossDamage(w,e,amount,owner){
 if(e.brittle>0)amount*=1.12;
 if(!e.bossKind)initBoss(e);
 if(!e.bossKind)return amount;
 if(e.bossKind==='starcrown'){
  const live=e.rings.filter(r=>r.hp>0),shooter=w.players.get(owner)||w.towers.find(t=>t.owner===owner)||e;
  if(live.length){
   const index=shooter.x<e.x?0:1,ring=live.find(r=>r.id===index)||live[0];
   ring.hp=Math.max(0,ring.hp-amount*1.5);w.emit('bossRingHit',{bossId:e.id,x:e.x,z:e.z,ring:ring.id,broken:ring.hp===0});
   if(ring.hp===0){e.bossHint=e.rings.some(r=>r.hp>0)?'ONE RING LEFT · Keep firing':'BOTH RINGS BROKEN · Attack the starcore!';w.emit('guardianCore',{x:e.x,z:e.z,open:e.rings.every(r=>r.hp<=0),duration:4});}
   return amount*.18;
  }
  return amount*(e.coreOpen?1.35:.28);
 }
 return amount*(e.coreOpen?(e.bossKind==='aegis'?1.2:e.bossKind==='thornback'&&e.crashed?1.6:1.25):e.bossKind==='aegis'?.16:e.bossKind==='moonwing'?.55:.65);
}
