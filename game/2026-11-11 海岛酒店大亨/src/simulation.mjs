import {ROOMS,SPOTS,ITEMS,GOALS,roomFee,roomUpgradeCost,roomSpot,moneySpot} from './config.mjs';
import {findPath,moveActor,walkable,distance} from './navigation.mjs';
import {VILLAS,VILLA_SPOTS,ESTATE_COST,OUTFITS,levelOf,maxItemLevel,nextItemCost,mainHotelReady,maxRoomTier,ownerCapacity,ownerSpeed,linenInterval,staffCapacity,staffSpeed,poolCapacity,facilityPayout,collectionRadius,boostActive,careerTitle,titleIndex,studyCost,contractProgress,ensureContracts,makeContract} from './progression.mjs';
import {availableGuestLook,preserveDistinctLooks} from './guest-looks.mjs';
const actor=(x,z)=>({x,z,angle:Math.PI,path:[],moving:false,towels:0,action:'idle',supplyTime:0});
export function createState(seed=Date.now()){
 return {version:1,rng:seed>>>0,active:false,paused:false,time:0,cash:60,owned:Object.fromEntries(ITEMS.map(i=>[i.id,false])),rooms:ROOMS.map((d,i)=>({...d,built:i<2,tier:1,status:'ready',cash:0,clean:0,linen:false})),player:{...actor(0,7.5),towels:3},guests:[],staff:[],nextGuest:1,spawnTime:.5,serveProgress:0,checkinRoom:null,poolTowels:4,poolCash:0,cafeCash:0,cafeProgress:0,goalsDone:0,estate:{villa:false},levels:Object.fromEntries(ITEMS.map(i=>[i.id,0])),studyRank:0,outfit:'classic',titleSeen:0,contracts:[],contractSerial:1,contractsClaimed:0,boostUntil:0,nextBoost:0,stats:{served:0,checkedOut:0,collected:0,cleaned:0,lost:0,poolVisits:0,coffee:0,earned:0,vipServed:0,villaServed:0,villaCleaned:0},events:[],destination:null};
}
function random(s){s.rng=(Math.imul(1664525,s.rng)+1013904223)>>>0;return s.rng/4294967296;}
function event(s,type,text,amount=0,position=s.player){s.events.push({type,text,amount,x:position.x,z:position.z,time:s.time});if(s.events.length>16)s.events.shift();}
export function navigate(s,target,label='目的地'){
 const path=findPath(s,s.player,target);if(!path.length&&distance(s.player,target)>.65)return false;
 s.player.path=path;s.destination={...(path.at(-1)||target),label};return true;
}
export function movePlayer(s,dx,dz,dt){
 if(!s.active||s.paused)return;
 const l=Math.hypot(dx,dz);if(l<.08){return;}s.player.path=[];s.destination=null;s.player.moving=true;
 const d=ownerSpeed(s)*(boostActive(s)?1.25:1)*dt/Math.max(1,l),p=s.player;
 if(walkable(s,p.x+dx*d,p.z,.3))p.x+=dx*d;if(walkable(s,p.x,p.z+dz*d,.3))p.z+=dz*d;p.angle=Math.atan2(dx,dz);
}
export function buy(s,id){
 const item=ITEMS.find(i=>i.id===id);if(!item)return {ok:false,message:'没有这项升级'};
 const current=levelOf(s,id),max=maxItemLevel(id);if(current>=max)return {ok:false,message:'这项升级已达最高级'};
 if(item.requires&&!(item.requires==='villa'?s.estate.villa:s.owned[item.requires]))return {ok:false,message:'请先开放配套区域或设施'};
 const cost=nextItemCost(s,item);if(s.cash<cost)return {ok:false,message:`还差 ${cost-s.cash}，继续经营即可升级`};
 s.cash-=cost;s.owned[id]=true;s.levels[id]=current+1;
 if(item.kind==='staff'&&current===0){const base=id==='receptionist'?{x:1.1,z:8.4}:id==='barista'?{x:-21,z:-.5}:id==='villaCleaner'?{x:0,z:-38}:{x:-6,z:10.8};s.staff.push({...actor(base.x,base.z),id,towels:0,job:null});}
 event(s,'build',`${item.name} ${current?'升级至 Lv.'+(current+1):'已加入酒店'}`);checkGoals(s);return {ok:true,message:`${item.name} · Lv.${current+1}`};
}
export function openEstate(s){
 if(s.estate.villa)return {ok:false,message:'海景别墅区已经开放'};
 if(!mainHotelReady(s))return {ok:false,message:'先完成六间海景级主楼客房，并开放泳池与咖啡吧'};
 if(s.cash<ESTATE_COST)return {ok:false,message:`还差 ${ESTATE_COST-s.cash}，再经营一会儿吧`};
 s.cash-=ESTATE_COST;s.estate.villa=true;s.rooms.push(...VILLAS.map(r=>({...r,built:false,tier:1,status:'ready',cash:0,clean:0,linen:false})));
 event(s,'build','海景栈桥落成！别墅区已开放',0,VILLA_SPOTS.gate);return {ok:true,message:'新区域已开放，先建造第一栋海景别墅吧'};
}
export function buyStudy(s){
 if(s.rooms.filter(r=>r.region==='villa'&&r.built).length<2)return {ok:false,message:'先开放两栋别墅，解锁经营研修'};
 const cost=studyCost(s);if(s.cash<cost)return {ok:false,message:`还差 ${cost-s.cash}，继续经营即可研修`};
 s.cash-=cost;s.studyRank++;event(s,'build',`经营研修 Lv.${s.studyRank} · 全店服务收入提升`);return {ok:true,message:`研修成功 · 全店收益 +${s.studyRank}%`};
}
export function selectOutfit(s,id){
 if(!OUTFITS[id]||s.stats.earned<OUTFITS[id].earned)return {ok:false,message:'达到对应累计营业额即可解锁'};
 s.outfit=id;return {ok:true,message:`已换上${OUTFITS[id].name}`};
}
export function claimContract(s,id){
 const index=s.contracts.findIndex(c=>c.id===Number(id)),c=s.contracts[index];
 if(!c||contractProgress(s,c)<c.target)return {ok:false,message:'完成订单目标后即可领取'};
 s.cash+=c.reward;s.contractsClaimed++;s.contracts.splice(index,1);s.contracts.splice(index,0,makeContract(s,[...s.contracts.map(c=>c.type),c.type]));
 event(s,'goal',`订单完成 · ${c.name}`,c.reward);return {ok:true,message:`订单奖励 +￥${c.reward} · 新订单已送达`};
}
export function activateBoost(s){
 if(!levelOf(s,'boost'))return {ok:false,message:'先在店长页解锁服务冲刺'};
 if(s.time<s.nextBoost)return {ok:false,message:`再等 ${Math.ceil(s.nextBoost-s.time)} 秒即可使用`};
 s.boostUntil=s.time+8;s.nextBoost=s.time+Math.max(26,45-levelOf(s,'boost')*5);return {ok:true,message:'服务冲刺！8秒内移动与打扫更快'};
}
export function nearestSupplies(s,a=s.player){
 return s.estate.villa&&distance(a,VILLA_SPOTS.supplies)<distance(a,SPOTS.supplies)?VILLA_SPOTS.supplies:SPOTS.supplies;
}
export function buyRoom(s,id){
 const r=s.rooms.find(r=>r.id===id);if(!r||r.built)return {ok:false,message:'这间客房已经营业'};
 if(s.cash<r.cost)return {ok:false,message:`还差 ${r.cost-s.cash}，先收一轮房费吧`};
 s.cash-=r.cost;r.built=true;event(s,'build',`${r.id} ${r.name} 开门营业`,0,r);checkGoals(s);return {ok:true,message:'新客房已开放，欢迎入住'};
}
export function upgradeRoom(s,id){
 const r=s.rooms.find(r=>r.id===id);if(!r?.built)return {ok:false,message:'请先开放这间客房'};
 if(r.tier>=maxRoomTier(r))return {ok:false,message:'这间客房已达到最高级'};
 const cost=roomUpgradeCost(r);if(s.cash<cost)return {ok:false,message:`还差 ${cost-s.cash}，继续经营即可升级`};
 s.cash-=cost;r.tier++;event(s,'build',`${r.id} 客房升级完成`,0,r);checkGoals(s);return {ok:true,message:'床品、家具和房价一同升级'};
}
function checkGoals(s){
 ensureContracts(s);const rank=titleIndex(s);if(rank>s.titleSeen){s.titleSeen=rank;event(s,'title',`晋升 ${careerTitle(s).name}！`);}
 const g=GOALS[s.goalsDone];if(!g||g.value(s)<g.target)return;
 s.goalsDone++;s.cash+=g.reward;event(s,'goal',`目标完成 · ${g.name}`,g.reward);
}
function route(s,a,target){a.path=findPath(s,a,target);}
function supply(s,a,dt,capacity=4){
 if(a.towels>=capacity)return;
 a.action='supply';a.supplyTime+=dt;if(a.supplyTime>=linenInterval(s)){a.towels++;a.supplyTime=0;}
}
function cleanRoom(s,a,r,dt){
 if(r.status!=='dirty')return;
 if(!r.linen){if(a.towels<=0){a.action='needsTowels';return;}a.towels--;r.linen=true;}
 a.action='clean';const worker=a.id==='cleaner'||a.id==='villaCleaner',training=worker?1+.2*Math.max(0,levelOf(s,a.id)-1):1;r.clean+=dt/((worker?3.5:2.8)/training/(a===s.player&&boostActive(s)?1.8:1));
 if(r.clean>=1){r.status='ready';r.clean=0;r.linen=false;s.stats.cleaned++;if(r.region==='villa')s.stats.villaCleaned++;event(s,'clean',`${r.id} 打扫完毕`,0,r);checkGoals(s);}
}
function staffTick(s,dt){
 for(const a of s.staff){
  a.action='idle';
  if(a.id==='cleaner'||a.id==='villaCleaner'){
   let r=s.rooms.find(r=>r.id===a.job&&r.status==='dirty');
   if(!r){const previous=a.job;r=s.rooms.filter(r=>r.built&&r.status==='dirty'&&(a.id==='villaCleaner'?r.region==='villa':r.region!=='villa')).sort((a1,b)=>distance(a,a1)-distance(a,b))[0];a.job=r?.id??null;if(previous!==a.job)a.path=[];}
   const supplies=a.id==='villaCleaner'?VILLA_SPOTS.supplies:SPOTS.supplies;if(a.towels<1&&!r?.linen)a.refilling=true;if(a.towels>=staffCapacity(s,a.id))a.refilling=false;const dest=a.refilling?supplies:r?roomSpot(r):a.id==='villaCleaner'?{x:-4.8,z:-38}:{x:-5.5,z:10.5};
   if(!a.path.length&&distance(a,dest)>.35)route(s,a,dest);moveActor(s,a,dt,staffSpeed(s,a.id));
   if(distance(a,supplies)<.75)supply(s,a,dt,staffCapacity(s,a.id));
   if(r&&distance(a,roomSpot(r))<.7)cleanRoom(s,a,r,dt);
  }else if(a.id==='receptionist'){
   const dest={x:1,z:8.4};if(!a.path.length&&distance(a,dest)>.3)route(s,a,dest);moveActor(s,a,dt,staffSpeed(s,a.id));
  }else if(a.id==='poolstaff'){
   if(a.towels<1)a.refilling=true;if(a.towels>=staffCapacity(s,a.id))a.refilling=false;const dest=a.refilling?SPOTS.supplies:s.poolTowels>=poolCapacity(s)?{x:13.8,z:-.5}:SPOTS.pool;
   if(!a.path.length&&distance(a,dest)>.35)route(s,a,dest);moveActor(s,a,dt,staffSpeed(s,a.id));
   if(distance(a,SPOTS.supplies)<.75)supply(s,a,dt,staffCapacity(s,a.id));
   if(distance(a,SPOTS.pool)<.8&&a.towels>0&&s.poolTowels<poolCapacity(s)){a.action='supply';a.supplyTime+=dt;if(a.supplyTime>.28){a.towels--;s.poolTowels++;a.supplyTime=0;}}
  }else if(a.id==='barista'){
   const dest={x:-21,z:-.5};if(!a.path.length&&distance(a,dest)>.3)route(s,a,dest);moveActor(s,a,dt,staffSpeed(s,a.id));
  }
 }
}
function spawn(s){
 if(s.guests.filter(g=>g.state==='queue').length>=5||s.guests.length>=24)return;
 const vip=s.rooms.some(r=>r.tier>=2)&&random(s)<(s.estate.villa?.42:.24);
 const g={...actor(.5,15.6),id:s.nextGuest++,look:availableGuestLook(s.guests,random(s)),vip,state:'queue',patience:100,stay:0,room:null,progress:0};s.guests.push(g);
}
function nextLeisure(s,g){
 if(s.owned.cafe&&random(s)<.7&&s.guests.filter(q=>q.state==='cafeQueue').length<5){g.state='cafeQueue';g.path=[];g.progress=0;g.wait=0;}
 else {g.state='leaving';route(s,g,{x:0,z:15.8});}
}
function guestTick(s,dt){
 const waiting=s.guests.filter(g=>g.state==='queue');
 waiting.forEach((g,i)=>{const dest={x:i>2?2.15:0,z:11.7+(i%3)*1.4};if(!g.path.length&&distance(g,dest)>.2)route(s,g,dest);g.patience-=dt;if(g.patience<=0){s.stats.lost++;g.state='leaving';route(s,g,{x:0,z:15.7});if(s.time-(s.lastQueueNotice||-100)>12){s.lastQueueNotice=s.time;event(s,'notice',s.rooms.some(r=>r.built&&r.status==='ready')?'客人正在等候，回前台或雇用接待员吧':'有客人等太久离开了，先清洁或扩建客房吧');}}});
 for(const g of s.guests){
  moveActor(s,g,dt,g.vip?3.2:3);
  if(g.state==='toRoom'&&!g.path.length){g.state='staying';const r=s.rooms.find(r=>r.id===g.room);g.stay=(r.region==='villa'?24:16)+random(s)*7;r.status='occupied';}
  if(g.state==='staying'){
   g.stay-=dt;if(g.stay<=0){const r=s.rooms.find(r=>r.id===g.room);r.status='dirty';r.clean=0;r.linen=false;r.cash+=g.fee;s.stats.checkedOut++;s.stats.earned+=g.fee;g.x=r.x;g.z=r.z+2.1;event(s,'checkout',`${r.id} 客人退房，留下房费`,g.fee,moneySpot(r));
    if(s.owned.pool&&random(s)<.65){g.state='poolQueue';g.path=[];g.progress=0;g.wait=0;}else nextLeisure(s,g);
   }
  }
  if(g.state==='poolQueue'){
   const queue=s.guests.filter(q=>q.state==='poolQueue'),index=queue.indexOf(g),dest={x:14.7+(index%2)*1.05,z:1.3+Math.floor(index/2)*1.2};g.wait=(g.wait||0)+dt;
   if(index>=5||g.wait>28){nextLeisure(s,g);continue;}
   if(!g.path.length&&distance(g,dest)>.3)route(s,g,dest);
   const occupied=s.guests.filter(q=>q.state==='pool').map(q=>q.seat),seat=[0,1,2].find(i=>!occupied.includes(i));
   if(index===0&&distance(g,dest)<.65&&s.poolTowels>0&&seat!==undefined){s.poolTowels--;g.state='pool';g.progress=0;g.seat=seat;route(s,g,{x:15.1,z:-9+seat*2.4});}
  }
  if(g.state==='pool'&&!g.path.length){g.progress+=dt;if(g.progress>9){const payout=facilityPayout(s,'pool');s.poolCash+=payout;s.stats.poolVisits++;s.stats.earned+=payout;nextLeisure(s,g);}}
  if(g.state==='cafeQueue'){
   const idx=s.guests.filter(q=>q.state==='cafeQueue').indexOf(g),dest={x:-21.8+Math.min(idx,4)*1.2,z:3.1};g.wait=(g.wait||0)+dt;
   if(g.wait>28){g.state='leaving';route(s,g,{x:0,z:15.7});continue;}
   if(!g.path.length&&distance(g,dest)>.3)route(s,g,dest);
  }
 }
 s.guests=s.guests.filter(g=>!(g.state==='leaving'&&!g.path.length));
}
function receptionTick(s,dt){
 const a=s.player,worker=s.staff.find(a=>a.id==='receptionist');
 const serving=distance(a,SPOTS.reception)<1.45||worker&&distance(worker,SPOTS.reception)<1.5;
 const guest=s.guests.find(g=>g.state==='queue'&&distance(g,{x:0,z:11.7})<.6);
 const ready=s.rooms.filter(r=>r.built&&r.status==='ready'),room=guest?.vip?ready.find(r=>r.region==='villa')||ready[0]:ready.find(r=>r.region!=='villa')||ready[0];
 if(!serving||!guest||!room){s.serveProgress=0;return;}
 a.action=distance(a,SPOTS.reception)<1.45?'serve':a.action;if(worker)worker.action='serve';s.serveProgress+=dt/(1.2/(worker?1+.15*Math.max(0,levelOf(s,'receptionist')-1):1));
 if(s.serveProgress>=1){s.serveProgress=0;room.status='reserved';guest.state='toRoom';guest.room=room.id;guest.fee=roomFee(room,guest.vip,s.studyRank);route(s,guest,roomSpot(room));s.stats.served++;if(guest.vip)s.stats.vipServed++;if(room.region==='villa')s.stats.villaServed++;event(s,'checkin',`${guest.vip?'贵宾':'住客'}入住 ${room.id}`);checkGoals(s);}
}
function cafeTick(s,dt){
 if(!s.owned.cafe)return;
 const g=s.guests.find(g=>g.state==='cafeQueue'&&g.path.length===0),barista=s.staff.find(a=>a.id==='barista');
 const occupied=s.guests.filter(q=>q.state==='coffee').map(q=>q.seat),seat=[0,1,2].find(i=>!occupied.includes(i));
 if(g&&seat!==undefined&&(barista&&distance(barista,{x:-21,z:-.5})<.8||distance(s.player,SPOTS.cafe)<1.6)){
  if(barista&&distance(barista,{x:-21,z:-.5})<.8)barista.action='coffee';else s.player.action='coffee';s.cafeProgress+=dt/(1.5/(1+.16*Math.max(0,levelOf(s,'barista')-1)+.07*Math.max(0,levelOf(s,'cafe')-1)));
  if(s.cafeProgress>=1){s.cafeProgress=0;g.state='coffee';g.progress=0;g.seat=seat;route(s,g,{x:-25,z:-4+seat*2.7});}
 }else s.cafeProgress=0;
 for(const g of s.guests)if(g.state==='coffee'&&!g.path.length){g.progress+=dt;if(g.progress>6){const payout=facilityPayout(s,'cafe');s.cafeCash+=payout;s.stats.coffee++;s.stats.earned+=payout;g.state='leaving';route(s,g,{x:0,z:15.7});}}
}
export function collectMoney(s){
 const piles=[...s.rooms.map(r=>({owner:r,key:'cash',spot:moneySpot(r)})),{owner:s,key:'poolCash',spot:{x:15,z:2.5}},{owner:s,key:'cafeCash',spot:{x:-16,z:4}}];
 for(const p of piles)if(p.owner[p.key]>0&&distance(s.player,p.spot)<collectionRadius(s)){const v=p.owner[p.key];p.owner[p.key]=0;s.cash+=v;s.stats.collected+=v;event(s,'money','房费已收好',v,p.spot);checkGoals(s);}
}
export function moneyTargets(s){return [...s.rooms.filter(r=>r.cash>0).map(r=>({...moneySpot(r),label:`${r.id} 房费`,value:r.cash})),...(s.poolCash?[{x:15,z:2.5,label:'泳池收益',value:s.poolCash}]:[]),...(s.cafeCash?[{x:-16,z:4,label:'咖啡收益',value:s.cafeCash}]:[])].sort((a,b)=>distance(s.player,a)-distance(s.player,b));}
export function tick(s,dt,manual=null){
 if(!s.active||s.paused)return;
 dt=Math.max(0,Math.min(.1,dt));s.time+=dt;s.player.action='idle';
 if(manual&&Math.hypot(manual.x,manual.z)>.08)movePlayer(s,manual.x,manual.z,dt);else moveActor(s,s.player,dt,ownerSpeed(s)*(boostActive(s)?1.25:1));
 if(s.destination&&distance(s.player,s.destination)<.45){s.destination=null;s.player.path=[];}
 if(distance(s.player,nearestSupplies(s))<1.15)supply(s,s.player,dt,ownerCapacity(s));
 for(const r of s.rooms)if(r.built&&r.status==='dirty'&&distance(s.player,roomSpot(r))<1.25)cleanRoom(s,s.player,r,dt);
 if(s.owned.pool&&distance(s.player,SPOTS.pool)<1.2&&s.player.towels===0&&s.poolTowels<poolCapacity(s))s.player.action='needsTowels';
 if(s.owned.pool&&distance(s.player,SPOTS.pool)<1.2&&s.player.towels>0&&s.poolTowels<poolCapacity(s)){s.player.action='supply';s.player.supplyTime+=dt;if(s.player.supplyTime>.24){s.player.towels--;s.poolTowels++;s.player.supplyTime=0;}}
 staffTick(s,dt);s.spawnTime-=dt;if(s.spawnTime<=0){spawn(s);s.spawnTime=5.5+random(s)*2;}
 guestTick(s,dt);receptionTick(s,dt);cafeTick(s,dt);collectMoney(s);checkGoals(s);
}
export function saveSnapshot(s){const out=JSON.parse(JSON.stringify(s));out.events=[];out.paused=false;out.player.path=[];out.destination=null;return out;}
export function restoreSnapshot(value){
 try{
  const d=typeof value==='string'?JSON.parse(value):value;
  if(d?.version!==1||!Array.isArray(d.rooms)||!d.player||!Number.isFinite(d.cash)||d.cash<0)return createState();
  const defaults=createState(),fresh={...defaults,...d};fresh.events=[];fresh.paused=false;fresh.player={...defaults.player,...d.player,path:[]};fresh.destination=null;
  fresh.estate={villa:!!d.estate?.villa};const definitions=[...ROOMS,...(fresh.estate.villa?VILLAS:[])];
  fresh.rooms=definitions.map(def=>{const old=d.rooms.find(r=>r.id===def.id)||{},base={built:false,tier:1,status:'ready',cash:0,clean:0,linen:false};return {...base,...old,...def,tier:Math.max(1,Math.min(maxRoomTier(def),Number(old.tier)||1))};});
  fresh.owned={...defaults.owned,...d.owned};fresh.levels={...defaults.levels};
  for(const item of ITEMS){const level=Math.max(fresh.owned[item.id]?1:0,Math.min(maxItemLevel(item.id),Math.floor(Number(d.levels?.[item.id])||0)));fresh.levels[item.id]=level;fresh.owned[item.id]=level>0;}
  fresh.stats={...defaults.stats,...d.stats};for(const k of Object.keys(defaults.stats))fresh.stats[k]=Math.max(0,Number(fresh.stats[k])||0);
  fresh.studyRank=Math.max(0,Math.min(1000000,Math.floor(Number(d.studyRank)||0)));fresh.outfit=OUTFITS[d.outfit]&&fresh.stats.earned>=OUTFITS[d.outfit].earned?d.outfit:'classic';fresh.titleSeen=titleIndex(fresh);
  fresh.contractSerial=Math.max(1,Math.floor(Number(d.contractSerial)||1));fresh.contracts=(d.contracts||[]).filter(c=>Number.isFinite(c.id)&&Number.isFinite(c.start)&&Number.isFinite(c.target)&&c.target>0&&Number.isFinite(c.reward)&&c.reward>0).slice(0,3);ensureContracts(fresh);
  fresh.guests=preserveDistinctLooks((d.guests||[]).filter(g=>Number.isFinite(g.x)&&Number.isFinite(g.z)&&(!g.room||fresh.rooms.some(r=>r.id===g.room&&r.built))).slice(0,24));
  fresh.staff=(d.staff||[]).filter(a=>ITEMS.some(i=>i.id===a.id&&i.kind==='staff')&&fresh.owned[a.id]);
  fresh.player.towels=Math.max(0,Math.min(ownerCapacity(fresh),Number(fresh.player.towels)||0));
  if(!walkable(fresh,fresh.player.x,fresh.player.z))Object.assign(fresh.player,actor(0,7.5));return fresh;
 }catch{return createState();}
}
