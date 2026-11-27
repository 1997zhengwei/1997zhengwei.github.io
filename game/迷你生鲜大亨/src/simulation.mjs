import {customerProfile} from './customer-profiles.mjs';
import {STORES,STORE_FIELDS,storeSnapshot,branchInfo,storeDef,storeIndex} from './stores.mjs';
import {traffic,teamInfo,managerInfo,managedRate,managedCap,managerHome} from './business.mjs';
import {canRate,STAR_REWARDS} from './progression.mjs';
import {COSMETICS,starterCosmetics,cosmeticInfo} from './cosmetics.mjs';
import {PRODUCTS,productsFor,needsWheat,IDS,WHEAT,TILL,TILLS,reserveCapacity,STORAGE_SPOT,checkoutCount,queuePosition,STAFF,PAD_DEFS,bagCapacity,moveSpeed,shelfCapacity,unitPrice,purchaseInfo} from './config.mjs';
import {Navigation} from './navigation.mjs';
export const distance=(a,p)=>Math.hypot(a.x-p[0],a.z-p[1]);
export const countBag=a=>Object.values(a.bag).reduce((n,v)=>n+v,0);
const freshActor=(id,x,z)=>({id,x,z,angle:0,bag:{},path:[],walk:0,task:'',timer:0,action:''});
export function createState(seed=Date.now()){
 return {version:1,storeId:'corner',stores:{},stars:1,decorId:'decor:classic',dividendCash:0,dividendTimer:0,manager:{level:0,timer:0,earned:0},storageLevel:0,cosmetics:starterCosmetics(),rng:seed>>>0,time:0,money:35,registerCash:0,started:false,player:freshActor('owner',.3,9.5),goods:Object.fromEntries(IDS.map(id=>[id,{unlocked:id==='tomato',level:0,sold:0,lastSupply:0,reserve:0,stock:0,source:id==='tomato'?24:0,grow:0,input:0,output:0,process:0}])),wheat:{source:0,grow:0},staffLevels:Object.fromEntries(Object.keys(STAFF).map(id=>[id,0])),employees:[],customers:[],nextId:1,spawnTimer:1.2,expansions:{north:false,warehouse:false},upgrades:{bag:0,speed:0,research:0},investments:{},stats:{revenue:0,customers:0,units:0,harvested:0,restocked:0,processed:0},contract:{target:20,claimed:0},deliveryTimer:45,deliveries:0,settings:{mute:false},tutorial:0};
}
export function restoreState(raw){
 if(!raw||raw.version!==1)return createState();
 const s=createState(1);try{
 for(const k of ['money','registerCash','time','nextId','spawnTimer','rng','deliveryTimer','deliveries','tutorial','storageLevel'])if(Number.isFinite(raw[k])&&raw[k]>=0)s[k]=raw[k];
 s.started=!!raw.started;
 s.manager={level:Math.max(0,Math.min(3,Math.floor(raw.manager?.level||0))),timer:0,earned:Math.max(0,Math.floor(raw.manager?.earned||0))};
 for(const key of ['expansions','upgrades','stats','contract','settings'])for(const k in s[key])if(typeof raw[key]?.[k]===typeof s[key][k])s[key][k]=raw[key][k];
 for(const id of IDS)for(const k in s.goods[id])if(typeof raw.goods?.[id]?.[k]===typeof s.goods[id][k])s.goods[id][k]=raw.goods[id][k];
 s.goods.tomato.unlocked=true;
 for(const k in s.wheat)if(Number.isFinite(raw.wheat?.[k]))s.wheat[k]=Math.max(0,raw.wheat[k]);
 for(const k in s.staffLevels)s.staffLevels[k]=Math.max(0,Math.min(4,Math.floor(raw.staffLevels?.[k]||0)));
 for(const [k,v] of Object.entries(raw.investments||{}))if(Number.isFinite(v)&&v>=0)s.investments[k]=v;
 const actor=a=>{const r={...a,bag:{},path:[]};for(const [k,v]of Object.entries(a.bag||{}))if((PRODUCTS[k]||k==='wheat')&&Number.isInteger(v)&&v>0)r.bag[k]=Math.min(30,v);if(!Number.isFinite(a.x)||!Number.isFinite(a.z))return null;r.timer=0;r.action='';return r;};
 s.player=actor(raw.player)||s.player;
 const employeeIds=new Set();s.employees=(raw.employees||[]).filter(a=>(STAFF[a.role]&&s.staffLevels[a.role]||a.role==='manager'&&s.manager.level)&&!employeeIds.has(a.id)&&employeeIds.add(a.id)).map(actor).filter(Boolean).slice(0,16);
 for(const role in STAFF)if(s.staffLevels[role]&&!s.employees.some(a=>a.role===role))s.employees.push({...freshActor('staff-'+role,0,10),role});
 if(s.manager.level&&!s.employees.some(a=>a.role==='manager'))s.employees.push({...freshActor('manager',...managerHome),role:'manager'});
 s.customers=(raw.customers||[]).filter(a=>Array.isArray(a.order)&&['shop','queue','leave'].includes(a.stage)).map(actor).filter(Boolean).slice(0,32);
 for(const c of s.customers){c.targetKey='';c.repath=0;}
 for(const id of IDS){const g=s.goods[id];for(const k of ['level','sold','reserve','stock','source','input','output'])g[k]=Math.max(0,Math.floor(g[k]));g.level=Math.min(3,g.level);g.stock=Math.min(g.stock,shelfCapacity(s,id));}
 s.upgrades.bag=Math.min(4,Math.max(0,Math.floor(s.upgrades.bag)));s.upgrades.speed=Math.min(4,Math.max(0,Math.floor(s.upgrades.speed)));s.upgrades.research=Math.max(0,Math.floor(s.upgrades.research));
 s.storageLevel=Math.max(0,Math.floor(s.storageLevel));s.money=Math.floor(s.money);s.registerCash=Math.floor(s.registerCash);
 s.storeId=storeIndex(raw.storeId)>=0?raw.storeId:'corner';s.stars=Math.max(1,Math.min(5,Math.floor(raw.stars||1)));s.dividendCash=Math.max(0,Math.floor(raw.dividendCash||0));s.dividendTimer=Math.max(0,Number(raw.dividendTimer)||0);
 const cosmetics=raw.cosmetics||{};s.cosmetics.owned=[...new Set([...s.cosmetics.owned,...(cosmetics.owned||[]).filter(id=>COSMETICS[id])])];for(const kind of ['outfit','tray']){const id=cosmetics.equipped?.[kind];if(s.cosmetics.owned.includes(id)&&COSMETICS[id].kind===kind)s.cosmetics.equipped[kind]=id;}s.decorId=s.cosmetics.owned.includes(raw.decorId)&&COSMETICS[raw.decorId]?.kind==='decor'?raw.decorId:'decor:classic';
 for(const [id,record] of Object.entries(raw.stores||{})){if(id===s.storeId||storeIndex(id)<0)continue;const cleaned=restoreState({...record,version:1,storeId:id,stores:{},upgrades:raw.upgrades,cosmetics:raw.cosmetics,started:true});s.stores[id]=storeSnapshot(cleaned);}
 if(s.stars>=4&&!s.goods.flower.unlocked){s.goods.flower.unlocked=true;s.goods.flower.source=16;}
 }catch{return createState();}return s;
}
export function serialize(s){return JSON.stringify(s, (k,v)=>k==='path'?[]:v);}
export class Simulation{
 get products(){return productsFor(this.s);}
 constructor(s=createState(),emit=()=>{}){this.s=s;this.emit=emit;this.nav=new Navigation(s);this.paused=false;this.accumulator=0;this.padKey='';this.padTime=0;this.padPay=0;this.playerTransfer=0;this.lastHint='';}
 random(){let x=this.s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.s.rng=x>>>0;return this.s.rng/4294967296;}
 event(type,data={}){this.emit({type,...data});}
 customerStyle(){const used=new Set(this.s.customers.map(c=>c.style));const pool=Array.from({length:48},(_,i)=>i).filter(i=>!used.has(i));return pool[Math.floor(this.random()*pool.length)]??0;}
 refreshRoutes(){this.nav.refresh(this.s);for(const a of [this.s.player,...this.s.employees,...this.s.customers]){a.path=[];a.targetKey='';if(!this.nav.free(a.x,a.z)){const p=this.nav.nearest(a.x,a.z);a.x=p[0];a.z=p[1];}}}
 claimStar(){const s=this.s;if(!canRate(s))return false;s.stars++;s.money+=STAR_REWARDS[s.stars];s.spawnTimer=Math.min(s.spawnTimer,traffic(s).interval);if(s.stars===4){s.goods.flower.unlocked=true;s.goods.flower.source=16;}this.refreshRoutes();this.event('star',{stars:s.stars,reward:STAR_REWARDS[s.stars]});return true;}
 hireExtra(role){if(!STAFF[role])return false;const s=this.s,info=teamInfo(s,role);if(info.reason||s.money<info.cost){this.event('hint',{text:info.reason||`还差 ${info.cost-s.money} 金币`});return false;}s.money-=info.cost;s.employees.push({...freshActor('staff-'+role+'-'+s.nextId++,-.5,10.5),role});this.refreshRoutes();this.event('build',{label:STAFF[role].name+'扩编至 '+(info.count+1)+' 人'});return true;}
 hireManager(){const s=this.s,info=managerInfo(s);if(info.reason||s.money<info.cost){this.event('hint',{text:info.reason||`还差 ${info.cost-s.money} 金币`});return false;}s.money-=info.cost;s.manager.level++;if(!s.employees.some(a=>a.role==='manager'))s.employees.push({...freshActor('manager',...managerHome),role:'manager'});this.refreshRoutes();this.event('build',{label:`门店店长 Lv.${s.manager.level}`});return true;}
 buyCosmetic(id){const s=this.s,info=cosmeticInfo(s,id);if(info.reason){this.event('hint',{text:info.reason});return false;}if(!info.owned){if(s.money<info.price){this.event('hint',{text:`还差 ${info.price-s.money} 金币`});return false;}s.money-=info.price;s.cosmetics.owned.push(id);}if(info.kind==='decor')s.decorId=id;else s.cosmetics.equipped[info.kind]=id;this.event('cosmetic',{id,label:info.name});return true;}
 switchStore(id){const s=this.s,info=branchInfo(s,id);if(info.current)return true;if(info.reason){this.event('hint',{text:info.reason});return false;}if(!info.opened&&s.money<info.cost){this.event('hint',{text:`开店还差 ${info.cost-s.money} 金币`});return false;}const from=s.storeId,incoming=s.stores[id]||storeSnapshot(createState(s.rng));if(!info.opened)s.money-=info.cost;s.stores[from]=storeSnapshot(s);delete s.stores[id];for(const key of STORE_FIELDS)s[key]=structuredClone(incoming[key]);s.storeId=id;this.playerTransfer=0;this.padKey='';this.padTime=0;this.refreshRoutes();this.event('store',{id,label:storeDef(id).name});return true;}
 dividends(dt){const s=this.s;s.dividendTimer+=dt;if(s.dividendTimer<30)return;const ticks=Math.floor(s.dividendTimer/30);s.dividendTimer%=30;for(const r of Object.values(s.stores)){const amount=managedRate(r)*ticks;if(!amount)continue;const before=r.dividendCash||0;r.dividendCash=Math.min(managedCap(r),before+amount);r.manager.earned+=(r.dividendCash-before);}}
 collectDividends(){const s=this.s;let amount=s.dividendCash||0;s.dividendCash=0;for(const r of Object.values(s.stores)){amount+=r.dividendCash||0;r.dividendCash=0;}if(!amount)return false;s.money+=amount;this.event('cash',{amount});return true;}
 go(a,to,key=''){if(key&&a.targetKey===key&&a.path?.length)return; a.path=this.nav.path([a.x,a.z],to);a.targetKey=key;a.destination=[...to];}
 navigate(to,label='目的地'){this.go(this.s.player,to,'user-'+to.join(','));this.s.player.task=label;this.event('navigate',{label});}
 walk(a,speed,dt){a.walking=false;if(!a.path?.length)return true;let budget=speed*dt;while(budget>0&&a.path.length){const p=a.path[0],dx=p[0]-a.x,dz=p[1]-a.z,d=Math.hypot(dx,dz);if(d<.02){a.path.shift();continue;}const step=Math.min(d,budget),ox=a.x,oz=a.z;this.nav.move(a,dx/d*step,dz/d*step);a.angle=Math.atan2(dx,dz);a.walk+=step;a.walking=true;budget-=step;if(d<=step+.001)a.path.shift();if(Math.hypot(a.x-ox,a.z-oz)<.0001){a.path=[];break;}}return !a.path.length;}
 source(id){return id==='wheat'?this.s.wheat:this.s.goods[id];}
 pickup(a,id,capacity){const g=this.source(id);if(!g||g.source<1||countBag(a)>=capacity)return false;g.source--;a.bag[id]=(a.bag[id]||0)+1;this.s.stats.harvested++;a.action='harvest';this.event('pickup',{id,actorId:a.id,sourceSlot:g.source,stackCount:countBag(a),x:a.x,z:a.z});return true;}
 takeOutput(a,id,capacity){const g=this.s.goods[id];if(g.output<1||countBag(a)>=capacity)return false;g.output--;a.bag[id]=(a.bag[id]||0)+1;a.action='harvest';this.event('pickup',{id,actorId:a.id,sourceSlot:g.output,stackCount:countBag(a),x:a.x,z:a.z});return true;}
 restock(a,id){const g=this.s.goods[id];if(!(a.bag[id]>0)||g.stock>=shelfCapacity(this.s,id))return false;g.stock++;g.lastSupply=this.s.time;a.bag[id]--;this.s.stats.restocked++;a.action='restock';this.event('restock',{id,actorId:a.id,targetSlot:g.stock-1,to:'shelf',stackCount:countBag(a),x:a.x,z:a.z});return true;}
 putReserve(a,id){const g=this.s.goods[id];if(!(a.bag[id]>0)||g.reserve>=reserveCapacity(this.s))return false;g.reserve++;a.bag[id]--;a.action='restock';this.event('restock',{id,actorId:a.id,targetSlot:g.reserve-1,to:'reserve',stackCount:countBag(a),x:a.x,z:a.z});return true;}
 takeReserve(a,id,capacity){const g=this.s.goods[id];if(!g.reserve||countBag(a)>=capacity)return false;g.reserve--;a.bag[id]=(a.bag[id]||0)+1;a.action='harvest';this.event('pickup',{id,actorId:a.id,sourceSlot:g.reserve,from:'reserve',stackCount:countBag(a),x:a.x,z:a.z});return true;}
 returnIngredient(a,id){const g=this.source(id);if(!(a.bag[id]>0))return false;a.bag[id]--;g.source++;a.action='restock';this.event('restock',{id,actorId:a.id,targetSlot:g.source-1,to:'source',stackCount:countBag(a),x:a.x,z:a.z});return true;}
 takeShelfIngredient(a,id,capacity){const g=this.s.goods[id];if(g.stock<=4||countBag(a)>=capacity)return false;g.stock--;a.bag[id]=(a.bag[id]||0)+1;a.action='harvest';this.event('pickup',{id,actorId:a.id,sourceSlot:g.stock,from:'shelf',stackCount:countBag(a),x:a.x,z:a.z});return true;}
 feed(a,id){const g=this.s.goods[id],p=this.products[id];if(!(a.bag[p.ingredient]>0)||g.input>=12)return false;g.input++;a.bag[p.ingredient]--;a.action='restock';this.event('restock',{id:p.ingredient,actorId:a.id,to:'machine',machineId:id,targetSlot:g.input-1,stackCount:countBag(a),x:a.x,z:a.z});return true;}
 purchase(key,amount=Infinity){
 const s=this.s,info=purchaseInfo(s,key);if(info.done||info.reason)return {ok:false,reason:info.reason||'已升满'};
 const pay=Math.min(info.remaining,s.money,Number.isFinite(amount)?Math.max(0,Math.floor(amount)):info.remaining);if(pay<=0)return {ok:false,reason:'金币不足'};
 s.money-=pay;s.investments[key]=(s.investments[key]||0)+pay;
 if(s.investments[key]<info.cost)return {ok:true,complete:false,paid:pay};
 delete s.investments[key];
 if(key==='north'){s.expansions.north=true;s.goods.milk.unlocked=true;s.goods.milk.source=14;}
 else if(key==='warehouse')s.expansions.warehouse=true;
 else if(key==='storage')s.storageLevel++;
 else if(key in s.upgrades)s.upgrades[key]++;
 else if(key.startsWith('staff:')){const role=key.slice(6);s.staffLevels[role]++;if(s.staffLevels[role]===1)s.employees.push({...freshActor('staff-'+role,-.5,10.5),role});}
 else {const g=s.goods[key];if(!g.unlocked){g.unlocked=true;if(this.products[key].ingredient){if(key==='bread'&&needsWheat(s))s.wheat.source=20;}else g.source=18;}else g.level++;}
 this.nav.refresh(s);for(const a of [s.player,...s.employees,...s.customers]){a.path=[];a.targetKey='';if(!this.nav.free(a.x,a.z)){const p=this.nav.nearest(a.x,a.z);a.x=p[0];a.z=p[1];}}
 this.event('build',{key,label:info.name});return {ok:true,complete:true,paid:pay};
 }
 buy(key){const info=purchaseInfo(this.s,key);if(info.remaining>this.s.money){this.event('hint',{text:`还差 ${info.remaining-this.s.money} 金币，可先到收银台取款`});return false;}const r=this.purchase(key);if(!r.ok)this.event('hint',{text:r.reason});return r.ok;}
 cash(){const s=this.s;if(!s.registerCash)return false;const n=s.registerCash;s.money+=n;s.registerCash=0;this.event('cash',{amount:n,x:TILL.cash[0],z:TILL.cash[1]});return true;}
 claimContract(){const s=this.s;if(s.stats.units<s.contract.target)return false;const reward=80+s.contract.claimed*40;s.money+=reward;s.contract.claimed++;s.contract.target=s.stats.units+25+s.contract.claimed*10;this.event('cash',{amount:reward});return true;}
 quick(kind,id){const s=this.s,p=s.player;
 if(kind==='cash'){this.navigate(TILL.cash,'领取营业款');return;}
 if(kind==='till'){const n=checkoutCount(s),lane=n>1&&s.customers.some(c=>c.stage==='queue'&&c.lane===1)?1:0;this.navigate(TILLS[lane].service,'收银');return;}
 if(kind==='source'){
  const key=id||'tomato';if(key==='wheat'){if(s.goods.bread.unlocked&&needsWheat(s))this.navigate(WHEAT.pickup,'收小麦');return;}
  if(!s.goods[key]?.unlocked){this.event('hint',{text:'先在扩建中开售这件商品'});return;}
  const prod=this.products[key];this.navigate(prod.pickup,prod.ingredient?'领取'+prod.name:'采收'+prod.name);return;
 }
 if(kind==='feed'){if(s.goods[id]?.unlocked&&this.products[id].ingredient)this.navigate(this.products[id].input,'投入原料');return;}
 const held=IDS.filter(k=>p.bag[k]>0&&(s.goods[k].stock<shelfCapacity(s,k)||s.goods[k].reserve<reserveCapacity(s)));if(held.length){const k=held[0],overflow=s.goods[k].stock>=shelfCapacity(s,k);this.navigate(overflow?STORAGE_SPOT:this.products[k].restock,(overflow?'暂存':'补货')+this.products[k].name);}else if(p.bag.wheat>0)this.navigate(this.products.bread.input,'投入小麦');else this.event('hint',{text:countBag(p)?'货架已满：可在商品工坊扩容周转仓，或等待顾客买走':'先去采收商品，再来补货'});
 }
 update(dt,input={x:0,y:0}){
 if(this.paused||!this.s.started)return;dt=Math.max(0,Math.min(.1,dt));const s=this.s;s.time+=dt;
 for(const a of [s.player,...s.employees,...s.customers]){a.action='';a.walking=false;}
 this.grow(dt);const p=s.player;
 if(Math.hypot(input.x,input.y)>.07){p.path=[];p.targetKey='';p.task='';const len=Math.max(1,Math.hypot(input.x,input.y)),step=moveSpeed(s)*dt,dx=input.x/len*step,dz=input.y/len*step,ox=p.x,oz=p.z;this.nav.move(p,dx,dz);p.walk+=Math.hypot(p.x-ox,p.z-oz);p.walking=true;p.angle=Math.atan2(dx,dz);}else{this.walk(p,moveSpeed(s),dt);if(!p.path.length)p.task='';}
 this.playerTransfer-=dt;if(this.playerTransfer<=0){this.playerTransfer=.14;this.ownerActions();}
 for(const a of s.employees)this.worker(a,dt);
 this.customers(dt);
 this.investmentPads(dt,input);this.dividends(dt);
 if(s.expansions.warehouse){s.deliveryTimer-=dt;if(s.deliveryTimer<=0){s.deliveryTimer=55;s.deliveries++;for(const id of IDS){if(!this.products[id].ingredient)s.goods[id].source=Math.min(40,s.goods[id].source+8);}s.wheat.source=Math.min(40,s.wheat.source+8);this.event('delivery',{text:'配送车到货：生鲜原料 +8'});}}
 }
 grow(dt){const s=this.s;for(const id of IDS){const g=s.goods[id],p=this.products[id];if(!g.unlocked)continue;if(!p.ingredient){g.grow+=dt*(1+g.level*.18);while(g.grow>=p.rate){g.grow-=p.rate;if(g.source<32)g.source++;}}else{if(g.process>0){g.process=Math.max(0,g.process-dt*(1+g.level*.16));if(g.process===0){g.output+=p.yield;s.stats.processed+=p.yield;}}if(!g.process&&g.input>=p.recipe&&g.output<=24-p.yield){g.input-=p.recipe;g.process=p.rate;}}}
 if(s.goods.bread.unlocked&&needsWheat(s)){s.wheat.grow+=dt;while(s.wheat.grow>=WHEAT.rate){s.wheat.grow-=WHEAT.rate;if(s.wheat.source<32)s.wheat.source++;}}
 }
 ownerActions(){const s=this.s,p=s.player;if(distance(p,TILL.cash)<1)this.cash();if(distance(p,STORAGE_SPOT)<1.1){const id=IDS.find(id=>p.bag[id]>0&&s.goods[id].reserve<reserveCapacity(s));if(id&&this.putReserve(p,id))return;}
 for(const id of IDS){if(!s.goods[id].unlocked)continue;const prod=this.products[id];if(distance(p,prod.restock)<1.05&&this.restock(p,id))return;if(prod.ingredient&&distance(p,prod.input)<1.05&&this.feed(p,id))return;if(distance(p,prod.pickup)<1.05&&(prod.ingredient?this.takeOutput(p,id,bagCapacity(s)):this.pickup(p,id,bagCapacity(s))))return;}
 if(s.goods.bread.unlocked&&needsWheat(s)&&distance(p,WHEAT.pickup)<1.05)this.pickup(p,'wheat',bagCapacity(s));
 }
 worker(a,dt){const s=this.s;if(a.role==='manager'){this.managerWorker(a,dt);return;}const lv=s.staffLevels[a.role],cap=6+(lv-1)*2,speed=4.5+lv*.35;
 if(a.role==='cashier'){const lane=s.employees.filter(e=>e.role==='cashier').indexOf(a),spot=TILLS[Math.min(1,lane)].service;if(distance(a,spot)>.16){if(!a.path.length)this.go(a,spot,'cashier-'+lane);this.walk(a,speed,dt);}else a.task='收银';return;}
 const ingredient=a.role==='baker'?this.products.bread.ingredient:a.role==='juicer'?this.products.juice.ingredient:null;const held=IDS.find(id=>a.bag[id]>0&&id!==ingredient);
 let id=held,mode='restock',target;
 if(id){if(s.goods[id].stock>=shelfCapacity(s,id)){if(s.goods[id].reserve<reserveCapacity(s)){mode='reserveIn';target=STORAGE_SPOT;}else {a.task='等待货架腾空';a.path=[];return;}}else target=this.products[id].restock;}
 else if(a.role==='baker'||a.role==='juicer'){
  id=a.role==='baker'?'bread':'juice';const p=this.products[id],g=s.goods[id];if(a.bag[p.ingredient]>0){if(g.input<12){mode='feed';target=p.input;}else if(g.output>0&&countBag(a)<cap){mode='output';target=p.pickup;}else if(g.output>0){mode='returnRaw';target=p.ingredient==='wheat'?WHEAT.pickup:this.products[p.ingredient].pickup;}else {mode='wait';target=[p.input[0],p.input[1]+1.5];}}
  else if(g.stock<shelfCapacity(s,id)&&g.reserve>0){mode='reserveOut';target=STORAGE_SPOT;}else if(g.output>0&&g.stock<shelfCapacity(s,id)){mode='output';target=p.pickup;}
  else if(g.stock<shelfCapacity(s,id)&&g.input<6){const raw=this.source(p.ingredient);if(p.ingredient!=='wheat'&&raw.source<1&&raw.reserve>0){mode='ingredientReserve';target=STORAGE_SPOT;}else if(p.ingredient!=='wheat'&&raw.source<1&&raw.stock>=p.recipe+4){mode='ingredientShelf';target=this.products[p.ingredient].restock;}else {mode='harvest';target=p.ingredient==='wheat'?WHEAT.pickup:this.products[p.ingredient].pickup;}}
  else {mode='wait';target=[p.pickup[0]+.4,p.pickup[1]+2.2];}
 }else{
  const candidates=a.role==='tomato'?['tomato']:['egg','eggplant','milk','flower'],reserved=id=>s.employees.filter(e=>e!==a).reduce((n,e)=>n+(e.bag[id]||0)+(e.task===`harvest:${id}`?cap:0),0);id=candidates.filter(k=>s.goods[k].unlocked&&s.goods[k].stock<shelfCapacity(s,k)).sort((x,y)=>(s.goods[x].stock+reserved(x)-Math.min(24,Math.max(0,s.time-(s.goods[x].lastSupply||0))*.25))-(s.goods[y].stock+reserved(y)-Math.min(24,Math.max(0,s.time-(s.goods[y].lastSupply||0))*.25)))[0];
  if(!id){mode='wait';target=a.role==='tomato'?[-3.7,6]:[-3.7,-3];}else if(s.goods[id].reserve>0){mode='reserveOut';target=STORAGE_SPOT;}else {mode='harvest';target=this.products[id].pickup;}
 }
 const task=`${mode}:${id||''}`;
 // Keep harvesting at the source until the tray is full; one fruit must not trigger a return trip.
 if(a.task?.startsWith('harvest:')&&countBag(a)>0&&countBag(a)<cap){const old=a.task.split(':')[1],resource=(a.role==='baker'||a.role==='juicer')?this.products[old].ingredient:old;if(this.source(resource)?.source>0&&s.goods[old].stock<shelfCapacity(s,old)&&distance(a,resource==='wheat'?WHEAT.pickup:this.products[resource].pickup)<1.1){id=old;mode='harvest';target=resource==='wheat'?WHEAT.pickup:this.products[resource].pickup;}}
 if(a.task?.startsWith('output:')&&countBag(a)>0&&countBag(a)<cap){const old=a.task.split(':')[1];if(s.goods[old].output>0&&distance(a,this.products[old].pickup)<1.1){id=old;mode='output';target=this.products[old].pickup;}}
 if(a.task?.startsWith('reserveOut:')&&countBag(a)>0&&countBag(a)<cap){const old=a.task.split(':')[1];if(s.goods[old].reserve>0&&distance(a,STORAGE_SPOT)<1.1&&s.goods[old].stock<shelfCapacity(s,old)){id=old;mode='reserveOut';target=STORAGE_SPOT;}}
 if(a.task?.startsWith('ingredientShelf:')&&countBag(a)>0&&countBag(a)<cap){const old=a.task.split(':')[1],raw=this.products[old].ingredient;if(s.goods[raw].stock>4&&distance(a,this.products[raw].restock)<1.1){id=old;mode='ingredientShelf';target=this.products[raw].restock;}}
 if(a.task?.startsWith('ingredientReserve:')&&countBag(a)>0&&countBag(a)<cap){const old=a.task.split(':')[1],raw=this.products[old].ingredient;if(s.goods[raw].reserve>0&&distance(a,STORAGE_SPOT)<1.1){id=old;mode='ingredientReserve';target=STORAGE_SPOT;}}
 if(a.task!==`${mode}:${id||''}`){a.task=`${mode}:${id||''}`;a.path=[];a.targetKey='';}
 if(distance(a,target)>.18){if(!a.path.length)this.go(a,target,a.task);this.walk(a,speed,dt);return;}
 a.timer-=dt;if(a.timer>0)return;a.timer=.17;
 if(mode==='reserveIn')this.putReserve(a,id);
 if(mode==='reserveOut')this.takeReserve(a,id,cap);
 if(mode==='returnRaw')this.returnIngredient(a,this.products[id].ingredient);
 if(mode==='ingredientShelf')this.takeShelfIngredient(a,this.products[id].ingredient,cap);
 if(mode==='ingredientReserve')this.takeReserve(a,this.products[id].ingredient,cap);
 if(mode==='restock'){if(!this.restock(a,id)&&a.bag[id]>0){a.timer=1;}}
 if(mode==='feed')this.feed(a,id);
 if(mode==='harvest')this.pickup(a,(a.role==='baker'||a.role==='juicer')?this.products[id].ingredient:id,cap);
 if(mode==='output')this.takeOutput(a,id,cap);
 }
 managerWorker(a,dt){const s=this.s,m=s.manager;m.timer=Math.max(0,m.timer-dt);const collecting=a.task==='巡店取款'||m.timer===0&&s.registerCash>=30,target=collecting?TILL.cash:managerHome;a.task=collecting?'巡店取款':'店长巡店';if(distance(a,target)>.2){if(!a.path.length||a.targetKey!==a.task)this.go(a,target,a.task);this.walk(a,4.5+m.level*.3,dt);}else if(collecting){this.cash();m.timer=Math.max(3,12-m.level*3);a.task='店长巡店';a.path=[];}else a.action='scan';}
 newCustomer(){const s=this.s,t=traffic(s),available=IDS.filter(id=>s.goods[id].unlocked),choose=pool=>{const weights=pool.map(id=>{const pending=s.customers.reduce((n,c)=>n+(c.stage==='shop'?c.order.slice(c.index).filter(o=>o.id===id).reduce((a,o)=>a+o.qty,0):0),0);return (id==='tomato'?2.8:1)*(.3+s.goods[id].stock/shelfCapacity(s,id)*1.4)/(1+pending/30);}),total=weights.reduce((a,b)=>a+b,0);let roll=this.random()*total;return pool.find((id,i)=>(roll-=weights[i])<=0)||pool.at(-1);},first=choose(available),style=this.customerStyle(),profile=customerProfile(style),qty=()=>t.minQty+Math.floor(this.random()*(t.maxQty-t.minQty+1)),order=[{id:first,qty:qty()}];if(available.length>1&&this.random()<t.second)order.push({id:choose(available.filter(id=>id!==first)),qty:Math.max(1,qty()-1)});if(t.star===5&&available.length>2&&profile.shopping==='cart'&&this.random()<.4)order.push({id:choose(available.filter(id=>!order.some(o=>o.id===id))),qty:3});const c={...freshActor('customer-'+s.nextId++,6+this.random()*4,21),style,pace:profile.pace*(.95+this.random()*.1),order,index:0,picked:0,stage:'shop',wait:0,scan:0,bill:0,totalItems:0,age:0};s.customers.push(c);return c;}
 customers(dt){const s=this.s,t=traffic(s);s.spawnTimer-=dt;if(s.spawnTimer<=0){s.spawnTimer=t.interval*(.85+this.random()*.3);if(s.customers.length<t.cap)this.newCustomer();}
 const queue=s.customers.filter(c=>c.stage==='queue');
 for(const c of s.customers){c.age+=dt;c.timer-=dt;
  if(c.stage==='shop'){
   const order=c.order[c.index];if(!order){c.stage=c.totalItems?'queue':'leave';if(c.stage==='queue'){c.lane=checkoutCount(s)>1&&queue.filter(q=>q.lane===1).length<queue.filter(q=>(q.lane||0)===0).length?1:0;queue.push(c);}c.path=[];continue;}
   const target=this.products[order.id].shop;
   if(distance(c,target)>.2){if(!c.path.length)this.go(c,target,'shop-'+c.index);this.walk(c,c.pace||2.7,dt);continue;}
   c.wait+=dt;if(c.timer<=0&&s.goods[order.id].stock>0){s.goods[order.id].stock--;c.bag[order.id]=(c.bag[order.id]||0)+1;c.picked++;c.totalItems++;c.bill+=unitPrice(s,order.id);c.timer=.42;c.action='shop';}
   if(c.picked>=order.qty||c.wait>10){c.index++;c.picked=0;c.wait=0;c.path=[];c.targetKey='';}
  }else if(c.stage==='queue'){
   c.lane=Math.max(0,Math.min(checkoutCount(s)-1,c.lane||0));const index=queue.filter(q=>Math.max(0,Math.min(checkoutCount(s)-1,q.lane||0))===c.lane).indexOf(c),target=queuePosition(c.lane,index),till=TILLS[c.lane];
   if(distance(c,target)>.16){const key='queue-'+c.lane+'-'+index;if(c.targetKey!==key||!c.path.length)this.go(c,target,key);this.walk(c,c.pace||2.6,dt);}
   else if(index===0){const cashier=s.employees.filter(a=>a.role==='cashier')[c.lane],ready=cashier&&distance(cashier,till.service)<.6,owner=distance(s.player,till.service)<1.1;
    if(ready||owner){c.scan+=dt*(ready?1+(s.staffLevels.cashier-1)*.3:1);if(owner)s.player.action='scan';if(ready)cashier.action='scan';if(c.scan>=.35+c.totalItems*.22){s.registerCash+=c.bill;s.stats.revenue+=c.bill;s.stats.units+=c.totalItems;s.stats.customers++;for(const [id,n]of Object.entries(c.bag))s.goods[id].sold+=n;c.stage='leave';c.path=[];c.targetKey='';this.event('sale',{amount:c.bill,x:till.customer[0],z:12});}}
   }
  }else{const target=[16,21];if(distance(c,target)>.4){if(!c.path.length)this.go(c,target,'leave');this.walk(c,3,dt);}else c.remove=true;}
 }
 s.customers=s.customers.filter(c=>!c.remove);
 }
 investmentPads(dt,input){const s=this.s,p=s.player;const active=PAD_DEFS.find(pad=>{const info=purchaseInfo(s,pad.key);return !info.done&&!info.reason&&!(this.products[pad.key]&&s.goods[pad.key].unlocked)&&!(pad.key in s.expansions&&s.expansions[pad.key])&&distance(p,pad.pos)<.9;});
 if(!active||p.walking||Math.hypot(input.x,input.y)>.1){this.padTime=0;this.padKey='';this.padPay=0;return;}
 if(this.padKey!==active.key){this.padKey=active.key;this.padTime=0;this.padPay=0;}
 this.padTime+=dt;if(this.padTime<.65)return;this.padPay+=dt;while(this.padPay>=.08&&s.money>0){this.padPay-=.08;const r=this.purchase(active.key,Math.max(2,Math.ceil(purchaseInfo(s,active.key).cost/80)));if(r.complete){this.padTime=0;this.padKey='';break;}}
 }
}
