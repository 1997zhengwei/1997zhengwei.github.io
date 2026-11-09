// Chapter-three extension: all progression, hits and companion movement are authoritative.
export function installStarfall({FrontierWorld:W,stats,XP,dist,depth,inHub,STARFALL,GATE_Z,WEAPONS,MAX_PLAYERS=8}){
 const old={};for(const k of ['step','action','view','evolvedPulse','evolvedScatter','startEvolutionBeam','startEvolutionOrb','damageEnemy'])old[k]=W.prototype[k];
 const ready=p=>!!p.profile.starfall?.arrived;
 const twin=p=>ready(p)&&stats(p.profile).level>=48;
 W.prototype.arriveStarfall=function(p){if(!p.profile.aurora.guardian)return;const first=!ready(p);p.profile.starfall||={cleared:[],pet:false,petXp:0,petStage:0,petName:'Nova',complete:false};p.profile.starfall.arrived=true;p.profile.homeBase=3;if(first){p.profile.metal+=90;p.profile.crystal+=90;p.profile.xp=Math.max(p.profile.xp,XP[45]);}this.deposit(p);this.dirty(p)};
 W.prototype.action=function(p,a,now){
  if(a?.type==='starfallTravel'){
   if(!p?.online||p.down||!inHub(p)||!p.profile.aurora.guardian)return 'Complete the Vault and take the shuttle from base.';
   this.clearEvolution(p,'travel');this.arriveStarfall(p);p.x=0;p.z=STARFALL.z;p.input={x:0,z:0};p.mounted=false;p.hp=stats(p.profile).hp;p.oxygen=stats(p.profile).oxygen;return null;
  }
  if(a?.type==='petRescue'){
   if(!p?.online||p.down||!ready(p)||stats(p.profile).level<51||dist(p,{x:-8,z:GATE_Z-1210})>6)return 'Reach LV 51 and approach the starbeast cocoon at 1210m.';
   const f=p.profile.starfall;if(f.pet)return 'Nova has already been rescued.';f.pet=true;f.petStage=1;f.petXp=0;this.dirty(p);return null;
  }
  if(a?.type==='petTrain'){
   if(!p?.online||p.down||!inHub(p)||!ready(p)||!p.profile.starfall.pet)return 'Rescue Nova, then visit a safe base.';
   const f=p.profile.starfall,target=f.petStage+1,l=target===2?54:60,need=target===2?12:35;
   if(target>3)return 'Nova has reached Starcore form.';
   if(stats(p.profile).level<l||f.petXp<need)return `Reach LV ${l} and ${need} companion XP.`;
   if(!this.pay(p,{metal:target*25,crystal:target*25}))return 'Gather more supplies.';
   f.petStage=target;this.dirty(p);return null;
  }
  if(a?.type==='petName'){
   if(!p?.online||p.down||!inHub(p)||!p.profile.starfall?.pet)return 'Visit base with your companion.';
   const n=String(a.name||'Nova').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,16);if(!n)return 'Enter a companion name.';p.profile.starfall.petName=n;this.dirty(p);return null;
  }
  if(a?.type==='mount'){
   if(!p?.online||p.down||!ready(p)||stats(p.profile).level<57)return 'Reach LV 57 for the hoverboard.';
   if(!p.mounted&&this.enemies.some(e=>e.hp>0&&dist(e,p)<14))return 'Move away from enemies before mounting.';
   p.mounted=!p.mounted;return null;
  }
  return old.action.call(this,p,a,now);
 };
 W.prototype.step=function(dt,now){
  // Arrival is a safe, permanent checkpoint. Never award it from an unearned profile.
  for(const p of this.online())if(!ready(p)&&p.profile.aurora.guardian&&depth(p)>=1070&&depth(p)<=1140)this.arriveStarfall(p);
  old.step.call(this,dt,now);
  dt=Math.min(.1,dt);
  for(const p of this.online()){
   if(p.mounted){p.oxygen=Math.max(0,p.oxygen-dt*.7);if(p.down||this.enemies.some(e=>e.hp>0&&dist(e,p)<11))p.mounted=false;}
   const f=p.profile.starfall;if(!f?.pet){p.pet=null;continue;}
   const hx=p.headingX||0,hz=p.headingZ||1,target={x:p.x-hz*2.8-hx*1.7,z:p.z+hx*2.8-hz*1.7};
   p.pet||={x:target.x,z:target.z,cd:0,stage:f.petStage,heading:Math.atan2(hx,hz),damageDone:0,hits:0};const pet=p.pet;pet.stage=f.petStage;pet.name=f.petName;pet.cd=Math.max(0,pet.cd-dt);pet.resting=p.down;
   if(p.down){pet.x=p.x;pet.z=p.z;continue;}
   if(dist(pet,p)>9.5||(pet.stuck||0)>1.2){for(let j=0;j<8;j++){const a=Math.atan2(target.x-p.x,target.z-p.z)+j*Math.PI/4,x=p.x+Math.sin(a)*3.4,z=p.z+Math.cos(a)*3.4;if(this.clear(x,z)){pet.x=x;pet.z=z;pet.stuck=0;break;}}}
   const score=e=>dist(e,p)-(this.time-(e.contributors?.[p.id]??-99)<3?8:0);
   const enemy=!inHub(p)&&this.enemies.filter(e=>e.hp>0&&dist(e,p)<20).sort((a,b)=>score(a)-score(b))[0];
   let dest=target;if(enemy&&dist(enemy,pet)>15){const d=Math.max(.01,dist(p,enemy));dest={x:enemy.x+(p.x-enemy.x)/d*9,z:enemy.z+(p.z-enemy.z)/d*9};}
   const d=dist(pet,dest),v=Math.min(d,dt*(p.mounted?10:7.5)),oldX=pet.x,oldZ=pet.z;
   if(d>.15){const x=pet.x+(dest.x-pet.x)/d*v,z=pet.z+(dest.z-pet.z)/d*v;if(this.clear(x,pet.z))pet.x=x;if(this.clear(pet.x,z))pet.z=z;}
   pet.stuck=d>1&&Math.hypot(pet.x-oldX,pet.z-oldZ)<.001?(pet.stuck||0)+dt:0;
   if(Math.hypot(pet.x-oldX,pet.z-oldZ)>.001)pet.heading=Math.atan2(pet.x-oldX,pet.z-oldZ);
   if(enemy&&dist(enemy,pet)<18&&pet.cd<=0){
    const damage=stats(p.profile).damage*[0,.90,1.3,1.65][pet.stage];pet.lastDamage=Math.min(damage,Math.max(0,enemy.hp));pet.damageDone=(pet.damageDone||0)+pet.lastDamage;pet.hits=(pet.hits||0)+1;
    this.emit('petBolt',{owner:p.id,weapon:'pulse',stage:pet.stage,sx:pet.x,sz:pet.z,x:enemy.x,z:enemy.z,damage,duration:.28});this.damageEnemy(enemy,damage,p.id,'pet');
    pet.cd=pet.stage===3?.7:pet.stage===2?.85:1;pet.attackUntil=this.time+.55;pet.heading=Math.atan2(enemy.x-pet.x,enemy.z-pet.z);pet.attacks=(pet.attacks||0)+1;
    if(pet.stage===3&&pet.attacks%4===0){for(const extra of this.enemies.filter(e=>e.hp>0&&dist(e,enemy)<4.5).slice(0,5)){const amount=damage*.55;pet.damageDone+=Math.min(extra.hp,amount);this.emit('evoArc',{owner:p.id,weapon:'arc',style:19,phase:3,sx:pet.x,sz:pet.z,x:extra.x,z:extra.z,duration:.35,damage:amount});this.damageEnemy(extra,amount,p.id,'pet');extra.slow=Math.max(extra.slow||0,1.2);}}
   }

  }
 };
 W.prototype.damageEnemy=function(e,damage,owner,weapon){const alive=e.hp>0;old.damageEnemy.call(this,e,damage,owner,weapon);if(alive&&e.hp<=0){const p=this.players.get(owner);if(p?.profile.starfall?.pet&&!p.down&&dist(p,e)<24){p.profile.starfall.petXp++;this.dirty(p);}}};
 function lanes(p,target){const d=Math.max(.001,dist(p,target)),x=-(target.z-p.z)/d*.62,z=(target.x-p.x)/d*.62;return [-1,1].map(n=>({...p,x:p.x+x*n,z:p.z+z*n}));}
 W.prototype.evolvedPulse=function(p,target,damage,s){if(!twin(p))return old.evolvedPulse.call(this,p,target,damage,s);for(const q of lanes(p,target))old.evolvedPulse.call(this,q,target,damage*.68,s);};
 W.prototype.evolvedScatter=function(p,target,s,phase){if(!twin(p))return old.evolvedScatter.call(this,p,target,s,phase);const knock=this.knockbackEnemy;let first=true;for(const q of lanes(p,target)){if(!first)this.knockbackEnemy=()=>{};try{old.evolvedScatter.call(this,q,target,{...s,damage:s.damage*.68},phase)}finally{this.knockbackEnemy=knock;}first=false;}};
 W.prototype.startEvolutionBeam=function(p,s,c){if(!twin(p))return old.startEvolutionBeam.call(this,p,s,c);old.startEvolutionBeam.call(this,p,{...s,damage:s.damage*.68},c);const b=this.beams.find(b=>b.owner===p.id);if(b&&!b.dual){b.dual=true;b.lane=-.62;const firstEvent=this.effects.find(e=>e.type==='evoBeam'&&e.lifeId===b.lifeId);if(firstEvent)firstEvent.lane=-.62;const other={...b,id:this.uid++,lane:.62};other.lifeId=other.id;this.beams.push(other);this.emit('evoBeam',{...other,x:p.x+other.dx*other.range,z:p.z+other.dz*other.range,totalDamage:other.damage*other.ticks});}};
 W.prototype.startEvolutionOrb=function(p,target,s,phase){
  if(!twin(p))return old.startEvolutionOrb.call(this,p,target,s,phase);
  // Reserve both slots as a pair. A full pool requests a short retry, never a lost full cooldown.
  if(this.orbs.filter(a=>a.owner===p.id).length>4||this.orbs.length>MAX_PLAYERS*6-2)return false;
  for(const q of lanes(p,target))old.startEvolutionOrb.call(this,q,target,{...s,damage:s.damage*.68},phase);
  return true;
 };
}
