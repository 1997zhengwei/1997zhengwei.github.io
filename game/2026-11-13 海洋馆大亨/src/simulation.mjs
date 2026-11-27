import {isSwimming,SHORE} from './shore.mjs';
import {SPECIES,BY_ID,UPGRADES,MILESTONES,clamp,total,priceFor,distance,approach} from './data.mjs';
import {walkable,moveSlide,findPath,followPath} from './navigation.mjs';
import {galleryDefinitions,galleryEnd,consolidateLegacyTanks,growingPrice,museumLevel,equipmentLimit,honorFor,RARE_NAMES} from './growth.mjs';
const safe=(n,f=0,max=1e10)=>Number.isFinite(n)?clamp(n,0,max):f;
const emptyBag=()=>Object.fromEntries(SPECIES.map(s=>[s.id,0]));
export class AquariumSimulation{
 constructor(saved=null){
  this.expansions=0;this.legacyLevelCredit=0;this.migrationNotice=false;this.definitions=galleryDefinitions();this.rareFound={};this.rareExhibits={};this.rarePity={};this.honorSeen=0;this.levelSeen=1;this.time=0;this.cash=120;this.earned=0;this.sold=0;this.caught=0;this.delivered=0;this.seed=42871;this.events=[];this.claimed=[];this.discovered={};this.upgrades=Object.fromEntries(Object.keys(UPGRADES).map(k=>[k,0]));
  this.tanks=Object.fromEntries(SPECIES.map((s,i)=>[s.id,{built:i===0,level:1,stock:i===0?3:0,rareStock:0,bonusCapacity:0}]));
  this.player={x:0,z:7,heading:0,moving:false,bag:emptyBag(),rareBag:emptyBag(),oxygen:60,target:null,progress:0,path:[],auto:null,pulse:0,boost:0,deliveryClock:0};this.guests=[];this.staff=[];this.spawnClock=0;this.nextGuest=0;
  this.fish=[];for(const s of SPECIES)for(let i=0;i<s.count;i++)this.fish.push({id:this.fish.length,kind:s.id,index:i,x:s.sea[0],z:s.sea[1],y:-1.2,heading:0,cooldown:0,rare:i===0});
  if(saved?.version===1)this.restore(saved);this.refreshFish();
 }
 random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;}
 get built(){return Object.values(this.tanks).filter(t=>t.built).length;}
 get capacity(){return 10+this.upgrades.bag*5;}
 get maxOxygen(){return 60+this.upgrades.oxygen*15;}
 get radius(){return 2.65+this.upgrades.net*.18;}
 get extraLevels(){return this.legacyLevelCredit+Object.values(this.tanks).reduce((n,t)=>n+(t.built?t.level-1:0),0);}
 get level(){return museumLevel(this.earned,this.expansions,this.extraLevels);}
 get honor(){return honorFor(this.level,this.earned);}
 get title(){return this.honor.name;}
 get tankLimit(){return 12+Math.floor((this.level-1)/5)*6+this.expansions*2;}
 upgradeLimit(id){return equipmentLimit(id,this.level,this.expansions);}
 get end(){return galleryEnd(this.expansions);}
 get guestLimit(){const units=this.definitions.reduce((n,d)=>n+(this.tanks[d.id].built?this.tankCapacity(d.id):0),0)/16;return Math.min(96,7+Math.ceil(units*3)+this.upgrades.visitors*2+Math.floor((this.level-1)/3));}
 refreshLayout(relocate=false){this.definitions=galleryDefinitions(this.tanks);if(relocate){for(const a of [this.player,...this.guests,...this.staff]){this.keepSafe(a);a.path=[];if(a===this.player){a.auto=null;a.target=null;}else if(this.guests.includes(a)){if(a.mode==='leave')a.path=this.path(a,{x:0,z:33.8});else this.chooseGuest(a);}else{a.mode='choose';a.target=null;}}}}
 keepSafe(a){if(walkable(a.x,a.z,this.definitions,this.end))return;if(a.z>this.end||!Number.isFinite(a.z)||!Number.isFinite(a.x)){a.x=0;a.z=7;return;}for(let r=.25;r<=6;r+=.25)for(let i=0;i<16;i++){const x=a.x+Math.cos(i*Math.PI/8)*r,z=a.z+Math.sin(i*Math.PI/8)*r;if(walkable(x,z,this.definitions,this.end)){a.x=x;a.z=z;return;}}a.x=0;a.z=Math.max(3,Math.min(33,a.z));}
 definition(id){return this.definitions.find(d=>d.id===id);}
 path(actor,end){return findPath(actor,end,this.definitions,this.end);}
 follow(actor,dt,speed){return followPath(actor,dt,speed,this.definitions,this.end);}
 movement(actor,dx,dz){return moveSlide(actor,dx,dz,this.definitions,this.end);}
 unlocked(kind){return this.tanks[kind]?.built;}
 checkProgress(){const h=this.honor;if(h.rank>this.honorSeen){this.honorSeen=h.rank;this.emit('honor',{...h,level:this.level});}else if(this.level>this.levelSeen)this.emit('level',{level:this.level,limit:this.tankLimit});this.levelSeen=Math.max(this.levelSeen,this.level);}
 expand(id){return this.upgradeTank(id);}
 deliveryTank(actor,kind=null){return this.definitions.filter(d=>this.tanks[d.id].built&&actor.bag[d.kind]>0&&(!kind||d.kind===kind)&&this.tanks[d.id].stock<this.tankCapacity(d.id)).sort((a,b)=>distance(actor,a)-distance(actor,b))[0];}
 tankCapacity(id){return 16+(this.tanks[id].level-1)*7+(this.tanks[id].bonusCapacity||0);}
 tankPrice(id){return Math.round(BY_ID[this.definition(id).kind].price*(1+(this.tanks[id].level-1)*.14));}
 tankUpgradePrice(id){return Math.round(growingPrice(BY_ID[this.definition(id).kind].cost*.22+130,this.tanks[id].level-1,1.65,11));}
 emit(type,data={}){this.events.push({type,...data});if(this.events.length>150)this.events.shift();}
 drainEvents(){return this.events.splice(0);}
 build(id){const d=BY_ID[id],t=this.tanks[id];if(!d||!t||t.built||this.cash<d.cost)return false;const i=SPECIES.indexOf(d);if(i>0&&!this.tanks[SPECIES[i-1].id].built)return false;this.cash-=d.cost;t.built=true;this.emit('build',{kind:id});this.checkProgress();return true;}
 upgradeTank(id){const t=this.tanks[id];if(!t?.built||t.level>=this.tankLimit)return false;const cost=this.tankUpgradePrice(id);if(this.cash<cost)return false;this.cash-=cost;t.level++;this.refreshLayout(true);this.emit('upgrade',{kind:id});this.checkProgress();return true;}
 upgrade(id){const d=UPGRADES[id];if(!d||this.upgrades[id]>=this.upgradeLimit(id))return false;const cost=growingPrice(d.base,this.upgrades[id]);if(this.cash<cost)return false;this.cash-=cost;this.upgrades[id]++;if(id==='staff')this.staff.push(this.newStaff());this.emit('upgrade',{kind:id});this.checkProgress();return true;}
 newStaff(){return {x:1,z:5,heading:0,bag:emptyBag(),rareBag:emptyBag(),target:null,progress:0,path:[],auto:null,pulse:0,boost:0,deliveryClock:0,mode:'choose',kind:null,moving:false};}
 claim(id){const g=MILESTONES.find(g=>g.id===id);if(!g||this.claimed.includes(id)||this[g.field]<g.need)return false;this.cash+=g.reward;this.claimed.push(id);this.emit('reward',{amount:g.reward});return true;}
 navigate(x,z){const path=this.path(this.player,{x,z});if(!path.length)return false;this.player.path=path;this.player.auto='move';return true;}
 goFishing(){const p=this.player,score=kind=>{const ds=this.definitions.filter(d=>d.kind===kind&&this.tanks[d.id].built);const stock=ds.reduce((n,d)=>n+this.tanks[d.id].stock,0)+p.bag[kind],cap=ds.reduce((n,d)=>n+this.tankCapacity(d.id),0);return stock>=cap?Infinity:(stock+1)/(cap*BY_ID[kind].price);};const id=SPECIES.filter(d=>this.tanks[d.id].built).sort((a,b)=>score(a.id)-score(b.id))[0].id,s=BY_ID[id];p.path=this.path(p,{x:s.sea[0],z:s.sea[1]});p.auto='fish';this.emit('navigate',{text:'正在前往'+s.tag});}
 returnHome(){const p=this.player;const s=this.deliveryTank(p)||this.definitions[0];p.path=this.path(p,approach(s));p.auto='deliver';this.emit('navigate',{text:'回馆补货 · 移动可随时接管'});}
 seekRare(kind){if(!this.unlocked(kind))return false;const f=this.fish.filter(f=>f.kind===kind&&f.rare&&!f.cooldown).sort((a,b)=>distance(this.player,a)-distance(this.player,b))[0];if(!f){this.goFishing();return false;}const p=this.player;p.path=this.path(p,{x:f.x,z:f.z});p.auto='rare';p.seekKind=kind;p.target=f.id;p.progress=0;p.rareTrackClock=0;return true;}
 movePlayer(x,z,dt){const p=this.player;p.path=[];p.auto=null;const speed=(isSwimming(p.z)?5.5:6.5)*(1+this.upgrades.speed*.09);const len=Math.hypot(x,z);if(len>.02){p.heading=Math.atan2(-x,-z);this.movement(p,x/Math.max(1,len)*speed*dt,z/Math.max(1,len)*speed*dt);p.moving=true;}else p.moving=false;}
 cast(){const p=this.player;if(!isSwimming(p.z)){this.goFishing();return true;}if(p.pulse>0)return false;p.pulse=3.4;p.boost=.85;this.emit('cast',{x:p.x,z:p.z});return true;}
 refreshFish(){for(const f of this.fish){const s=BY_ID[f.kind],t=this.time,phase=f.index*2.39996,group=Math.floor(f.index/6),rx=(f.kind==='shark'?2.4:1.1)+((f.index*1.731)%1)*2.4,rz=.6+((f.index*.713)%1)*1.6;
  const a=t*(.29+(f.index%4)*.027)+phase,cx=Math.sin(t*.19+group*2.5)*1.15,cz=Math.cos(t*.22+group*1.7)*.7;const nx=s.sea[0]+cx+Math.cos(a)*rx+Math.sin(t*.37+phase)*.4,nz=s.sea[1]+cz+Math.sin(a)*rz+Math.cos(t*.3+phase)*.35;
  f.heading=Math.atan2(-(nz-f.z),nx-f.x);f.x=nx;f.z=nz;f.y=-1.0-(f.index%4)*.30+Math.sin(t*1.2+phase)*.12;
 }}
 capture(actor,dt,assistant=false){if(!isSwimming(actor.z)||total(actor.bag)>=(assistant?6:this.capacity)){actor.target=null;actor.progress=0;return;}
  let target=this.fish.find(f=>f.id===actor.target&&f.cooldown<=0&&this.tanks[f.kind].built&&distance(f,actor)<this.radius+.6);
  if(!target){target=this.fish.filter(f=>f.cooldown<=0&&this.tanks[f.kind].built&&(!assistant||f.kind===actor.kind&&!f.rare)&&(actor.auto!=='rare'||f.kind===actor.seekKind&&f.rare)&&distance(f,actor)<this.radius).sort((a,b)=>distance(a,actor)-distance(b,actor))[0];actor.target=target?.id??null;actor.progress=0;}
  if(!target)return;const d=BY_ID[target.kind];actor.progress+=dt*(1+this.upgrades.net*.16)*(actor.boost>0?2.8:1)/(d.catch*(assistant?1.3:1));
  if(actor.progress>=1){target.cooldown=12;actor.bag[d.id]++;actor.progress=0;actor.target=null;if(!assistant){this.caught++;const first=!this.discovered[d.id];this.discovered[d.id]=(this.discovered[d.id]||0)+1;const rare=!!target.rare;if(rare){actor.rareBag[d.id]++;this.rareFound[d.id]=(this.rareFound[d.id]||0)+1;this.rarePity[d.id]=0;if(actor.auto==='rare'){actor.auto='fish';actor.path=[];}}else this.rarePity[d.id]=(this.rarePity[d.id]||0)+1;this.emit('catch',{kind:d.id,x:target.x,z:target.z,first,rare});}}
 }
 deposit(actor,dt,assistant=false){if(actor.z<1)return;actor.deliveryClock=(actor.deliveryClock||0)-dt;if(actor.deliveryClock>0)return;
  for(const d of this.definitions){const kind=d.kind;if(!this.tanks[d.id].built||!actor.bag[kind]||distance(actor,d)>d.r+1.65)continue;const t=this.tanks[d.id];if(t.stock>=this.tankCapacity(d.id))continue;const rare=(actor.rareBag?.[kind]||0)>0;
   if(rare&&!this.rareExhibits[kind]){this.rareExhibits[kind]=d.id;this.emit('exhibit',{kind,tank:d.id});}else{t.stock++;if(rare)t.rareStock=(t.rareStock||0)+1;}
   actor.bag[kind]--;if(rare)actor.rareBag[kind]--;actor.deliveryClock=.12;if(!assistant)this.delivered++;this.emit('deposit',{kind,tank:d.id,rare,assistant,x:actor.x,z:actor.z});this.checkProgress();break;}
 }

 chooseGuest(g){const choices=this.definitions.filter(d=>this.tanks[d.id].built&&this.guests.filter(o=>o!==g&&o.kind===d.id&&['walk','queue'].includes(o.mode)).length<5);if(!choices.length){g.mode='leave';g.path=this.path(g,{x:0,z:g.exitZ||33.8});return;}const scores=choices.map(d=>({s:d,w:1+Math.min(40,this.tanks[d.id].stock)*.2+(Object.values(this.rareExhibits).includes(d.id)?2:0)}));let r=this.random()*scores.reduce((n,v)=>n+v.w,0),d=choices[0];for(const v of scores){r-=v.w;if(r<=0){d=v.s;break;}}
  g.kind=d.id;g.mode='walk';const waiting=this.guests.filter(o=>o!==g&&o.kind===d.id&&['walk','queue'].includes(o.mode)).length;g.queue=Math.min(waiting,4);g.goal={x:d.x+(d.x<0?1:-1)*(d.r+1.25),z:d.z+g.queue*.95};g.path=this.path(g,g.goal);g.wait=0;g.shopping=0;
 }
 updateGuests(dt){this.spawnClock-=dt;if(this.spawnClock<=0&&this.guests.length<this.guestLimit){const exitZ=33.8,g={id:this.nextGuest++,x:(this.random()-.5)*1.5,z:exitZ,exitZ,heading:0,style:Math.floor(this.random()*30),bag:null,moving:true};this.guests.push(g);this.chooseGuest(g);this.spawnClock=Math.max(.5,3.6-this.upgrades.visitors*.25-Math.min(1,this.expansions*.1));}
  for(const g of this.guests){if(['walk','queue'].includes(g.mode)){const rank=this.guests.filter(o=>o.kind===g.kind&&o.id<g.id&&['walk','queue'].includes(o.mode)).length;if(rank!==g.queue){const d=this.definition(g.kind);g.queue=rank;g.goal={x:d.x+(d.x<0?1:-1)*(d.r+1.25),z:d.z+rank*.95};g.path=this.path(g,g.goal);g.mode='walk';g.shopping=0;}}
   if(g.mode==='walk'){if(this.follow(g,dt,3.0+(g.style%3)*.12))g.mode='queue';}
   else if(g.mode==='queue'){g.wait+=dt;g.heading=g.x<0?Math.PI/2:-Math.PI/2;const t=this.tanks[g.kind],ahead=this.guests.some(o=>o!==g&&o.kind===g.kind&&o.id<g.id&&['queue','buy'].includes(o.mode));if(!ahead&&t.stock>0){g.shopping+=dt;if(g.shopping>1.7){const amount=Math.min(t.stock,1+Math.floor(this.random()*2)+Math.floor(this.upgrades.visitors/12)),rare=Math.min(t.rareStock||0,amount),cash=(amount+rare*3)*this.tankPrice(g.kind);t.stock-=amount;t.rareStock=(t.rareStock||0)-rare;this.cash+=cash;this.earned+=cash;this.sold+=amount;g.bag=this.definition(g.kind).kind;g.rarePurchase=rare>0;g.mode='leave';g.path=this.path(g,{x:(g.id%3-1)*.8,z:g.exitZ||33.8});this.emit('sale',{kind:g.kind,amount,cash,x:g.x,z:g.z});this.checkProgress();}}
    if(g.wait>35&&g.mode==='queue'){g.mode='leave';g.path=this.path(g,{x:0,z:g.exitZ||33.8});}}
   else if(g.mode==='leave'){if(this.follow(g,dt,3.4))g.mode='gone';}}
  // A spatial grid keeps increasing crowds from requiring every-pair collision checks.
  const grid=new Map();for(const g of this.guests){if(g.mode==='gone')continue;const gx=Math.floor(g.x),gz=Math.floor(g.z);for(let x=gx-1;x<=gx+1;x++)for(let z=gz-1;z<=gz+1;z++)for(const o of grid.get(x+','+z)||[]){if(g.mode==='queue'&&o.mode==='queue')continue;let dx=g.x-o.x,dz=g.z-o.z,d=Math.hypot(dx,dz);if(d<.60){if(d<.01){dx=.1;dz=0;d=.1;}const force=(.60-d)*Math.min(1,dt*6);if(g.mode!=='queue')this.movement(g,dx/d*force,dz/d*force);if(o.mode!=='queue')this.movement(o,-dx/d*force,-dz/d*force);}}const k=gx+','+gz;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(g);}
  this.guests=this.guests.filter(g=>g.mode!=='gone');
 }

 updateStaff(dt){for(const a of this.staff){if(a.mode==='choose'&&total(a.bag)>0){const d=this.deliveryTank(a)||this.definitions[0];a.tank=d.id;a.path=this.path(a,approach(d));a.mode='home';}if(a.mode==='choose'){const choices=this.definitions.filter(s=>this.tanks[s.id].built).sort((x,y)=>this.tanks[x.id].stock/this.tankCapacity(x.id)-this.tanks[y.id].stock/this.tankCapacity(y.id));const s=choices[0];a.kind=s.kind;a.tank=s.id;a.path=this.path(a,{x:s.sea[0],z:s.sea[1]});a.mode='sea';}
  if(a.mode==='sea'){if(this.follow(a,dt,5.2+Math.min(5,this.expansions*.2))){a.mode='catch';a.clock=0;}}
  else if(a.mode==='catch'){a.clock+=dt;this.capture(a,dt,true);a.moving=false;if(total(a.bag)>=6||a.clock>24){const s=this.deliveryTank(a,a.kind)||this.definition(a.tank)||this.definitions[0];a.path=this.path(a,approach(s));a.tank=s.id;a.mode='home';}}
  else if(a.mode==='home'){if(this.follow(a,dt,5.2+Math.min(5,this.expansions*.2)))a.mode='unload';}
  else if(a.mode==='unload'){this.deposit(a,dt,true);if(!total(a.bag))a.mode='choose';else if(this.tanks[a.tank||a.kind].stock>=this.tankCapacity(a.tank||a.kind)){a.moving=false;}}
 }}
 tick(dt){if(!Number.isFinite(dt)||dt<=0)return;let remain=Math.min(dt,1);while(remain>1e-6){const step=Math.min(.05,remain);this.step(step);remain-=step;}}
 step(dt){this.time+=dt;for(const f of this.fish){const was=f.cooldown;f.cooldown=Math.max(0,was-dt);if(was>0&&!f.cooldown)f.rare=((this.rarePity[f.kind]||0)>=18&&!this.fish.some(o=>o!==f&&o.kind===f.kind&&o.rare&&o.cooldown<=0))||this.random()<.035;}this.refreshFish();const p=this.player;p.pulse=Math.max(0,p.pulse-dt);p.boost=Math.max(0,p.boost-dt);
  if(p.auto==='rare'&&total(p.bag)<this.capacity){p.rareTrackClock=(p.rareTrackClock||0)-dt;if(p.rareTrackClock<=0){p.rareTrackClock=.8;const f=this.fish.find(f=>f.id===p.target&&f.rare&&!f.cooldown)||this.fish.find(f=>f.kind===p.seekKind&&f.rare&&!f.cooldown);if(f&&distance(p,f)>this.radius*.8){p.path=this.path(p,{x:f.x,z:f.z});p.target=f.id;}}}
  if(p.path.length)this.follow(p,dt,(isSwimming(p.z)?5.5:6.5)*(1+this.upgrades.speed*.09));
  if(isSwimming(p.z)){p.oxygen=Math.max(0,p.oxygen-dt);if(!p.oxygen&&p.auto!=='emergency'){p.path=this.path(p,{x:0,z:4});p.auto='emergency';this.emit('oxygen');}if(p.auto!=='emergency')this.capture(p,dt);}
  else{p.oxygen=Math.min(this.maxOxygen,p.oxygen+dt*16);p.target=null;p.progress=0;}
  this.deposit(p,dt);if(p.auto==='deliver'&&!p.path.length){if(total(p.bag)===0){p.auto=null;this.emit('unloaded');}else{const next=this.deliveryTank(p);if(next&&distance(p,next)>next.r+1.65)p.path=this.path(p,approach(next));}}
  this.updateStaff(dt);this.updateGuests(dt);this.checkProgress();
 }
 save(){return {version:1,growthVersion:2,expansions:this.expansions,legacyLevelCredit:this.legacyLevelCredit,rareFound:this.rareFound,rareExhibits:this.rareExhibits,rarePity:this.rarePity,honorSeen:this.honorSeen,levelSeen:this.levelSeen,time:this.time,cash:this.cash,earned:this.earned,sold:this.sold,caught:this.caught,delivered:this.delivered,seed:this.seed,claimed:this.claimed,discovered:this.discovered,upgrades:this.upgrades,tanks:this.tanks,player:{x:this.player.x,z:this.player.z,heading:this.player.heading,bag:this.player.bag,rareBag:this.player.rareBag,oxygen:this.player.oxygen},fish:this.fish.map(f=>({id:f.id,cooldown:f.cooldown,rare:f.rare})),guests:this.guests,nextGuest:this.nextGuest,spawnClock:this.spawnClock,staff:this.staff};}
 restore(s){s=consolidateLegacyTanks(s);this.migrationNotice=!!s.migrationNotice;this.legacyLevelCredit=safe(s.legacyLevelCredit);this.time=safe(s.time);this.cash=safe(s.cash,120,1e15);for(const k of ['earned','sold','caught','delivered'])this[k]=safe(s[k],0,1e15);this.seed=safe(s.seed,42871,2**32-1);this.claimed=Array.isArray(s.claimed)?s.claimed.filter(id=>MILESTONES.some(g=>g.id===id)):[];
  this.expansions=s.growthVersion>=1?Math.floor(safe(s.expansions,0,5000)):0;this.definitions=galleryDefinitions();
  for(const d of this.definitions){const t=s.tanks?.[d.id];this.tanks[d.id]={built:d.id==='clown'||!!t?.built,level:Math.max(1,Math.floor(safe(t?.level,1,s.growthVersion>=1?10000:12))),stock:Math.floor(safe(t?.stock,0,1e7)),rareStock:Math.floor(safe(t?.rareStock,0,1e7)),bonusCapacity:Math.floor(safe(t?.bonusCapacity,0,1e9))};}
  this.refreshLayout();for(const d of this.definitions){const t=this.tanks[d.id];t.level=Math.min(t.level,this.tankLimit);t.stock=Math.min(t.stock,this.tankCapacity(d.id));t.rareStock=Math.min(t.rareStock,t.stock);}
  for(const id of Object.keys(UPGRADES))this.upgrades[id]=Math.floor(safe(s.upgrades?.[id],0,this.upgradeLimit(id)));
  for(const d of SPECIES){this.discovered[d.id]=safe(s.discovered?.[d.id]);this.player.bag[d.id]=Math.floor(safe(s.player?.bag?.[d.id],0,1e7));this.player.rareBag[d.id]=Math.min(this.player.bag[d.id],Math.floor(safe(s.player?.rareBag?.[d.id],0,1e7)));this.rareFound[d.id]=Math.floor(safe(s.rareFound?.[d.id]));this.rarePity[d.id]=Math.floor(safe(s.rarePity?.[d.id],0,30));const exhibit=s.rareExhibits?.[d.id];if(this.definition(exhibit)?.kind===d.id&&this.tanks[exhibit].built)this.rareExhibits[d.id]=exhibit;}
  const x=Number(s.player?.x),z=Number(s.player?.z);if(walkable(x,z,this.definitions,this.end)&&Number.isFinite(x)&&Number.isFinite(z)){this.player.x=x;this.player.z=z;}else if(Number.isFinite(x)&&Number.isFinite(z)&&z<2&&z>=SHORE.rampStart&&Math.abs(x)>SHORE.halfLane){this.player.x=clamp(x,-23,23);this.player.z=SHORE.rampStart-.7;}this.player.heading=Number.isFinite(s.player?.heading)?s.player.heading:0;this.player.oxygen=safe(s.player?.oxygen,this.maxOxygen,this.maxOxygen);this.keepSafe(this.player);
  for(const f of this.fish){const v=s.fish?.find(v=>v.id===f.id);f.cooldown=safe(v?.cooldown,0,12);if(s.growthVersion>=1)f.rare=!!v?.rare;}
  this.guests=Array.isArray(s.guests)?s.guests.filter(g=>this.tanks[g.kind]?.built&&Number.isFinite(g.x)&&Number.isFinite(g.z)&&['walk','queue','leave'].includes(g.mode)).slice(0,this.guestLimit).map(g=>({...g,exitZ:clamp(g.exitZ||33.8,33.8,this.end-.1)})):[];
  this.nextGuest=Math.max(safe(s.nextGuest),...this.guests.map(g=>g.id+1));this.spawnClock=safe(s.spawnClock,0,5);this.staff=Array.from({length:this.upgrades.staff},(_,i)=>s.staff?.[i]&&BY_ID[s.staff[i].kind]?{...this.newStaff(),...s.staff[i]}:this.newStaff());
  this.refreshLayout(true);this.honorSeen=Math.min(this.honor.rank,Math.floor(safe(s.honorSeen,this.honor.rank)));this.levelSeen=Math.min(this.level,Math.floor(safe(s.levelSeen,this.level)));
 }
}
