import {TYPES,COLORS,BAY_X,UPGRADE_DEFS,STYLE_DEFS,branchDef,starCount,upgradeCost,laneCost,workerCost,machineCost,contract,PHASES,careFor,phaseFor} from './config.mjs';
export const CELL_COUNT=84;
const EXIT_Z=-9.2,EXIT_CLEAR_X=Math.max(...BAY_X)+Math.max(...TYPES.map(t=>t.l))/2+1.2,EXIT_GAP=6.2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function newStation(id=0){return {id,washed:0,revenue:0,contract:0,manager:false,pending:0,vipVisits:0,vipServed:0,nextVipAt:5,upgrades:{pressure:0,price:0,marketing:0},bays:[0,1,2].map(i=>({unlocked:i===0,level:1,worker:false,car:null,queue:[]})),cars:[],exitQueue:[],spawnTimer:2,serial:0};}
export function createState(){const s={version:1,started:false,money:90,earned:0,washed:0,time:0,active:0,selected:0,stations:[newStation()],styles:['classic'],style:'classic',settings:{mute:false}};const st=s.stations[0];st.bays[0].car=makeCar(st,0,'work');st.cars.push(st.bays[0].car);st.cars.push(makeCar(st,0,'queue'),makeCar(st,0,'queue'));st.bays[0].queue=st.cars.filter(c=>c.state==='queue').map(c=>c.id);st.cars.filter(c=>c.state==='queue').forEach((c,i)=>{c.z=7+i*5.8;c.x=BAY_X[0];});return s;}
export function current(s){return s.stations[s.active];}
export function makeCar(st,lane,state='arrive'){
const n=++st.serial,luxury=state==='arrive'&&st.washed>=(st.nextVipAt??5)&&st.cars.filter(c=>careFor(c)&&!c.paid).length<2;
const type=luxury?5+(st.vipVisits||0)%3:n===1&&st.id===0?0:Math.floor(random(st)*Math.min(5,2+st.upgrades.marketing+Math.floor(st.washed/5)+Math.min(2,st.id))),t=TYPES[type];
if(luxury){st.vipVisits=(st.vipVisits||0)+1;st.nextVipAt=st.washed+Math.max(4,7-Math.floor(st.upgrades.marketing/2));}
return {id:`${st.id}-${n}`,type,color:luxury?['#1675bd','#30364f','#f4ecdc'][type-5]:COLORS[(n*3+st.id*2)%COLORS.length],lane,state,x:state==='work'?BAY_X[lane]:-23,z:state==='work'?0:28,yaw:state==='work'?Math.PI:Math.PI/2,phase:0,cells:Array(CELL_COUNT).fill(0),progress:0,wait:0,manual:0,paid:false,glow:0,speed:0,routeStep:0,value:t.pay,seed:n*1.731};}
function random(st){const n=Math.sin(st.serial*71.7+st.washed*13.3+st.id*29.1)*43758.5453;return n-Math.floor(n);}
export function priceFor(s,c){const st=current(s),location=1+(st.id%3)*.25+Math.floor(st.id/3)*.35;return Math.round(c.value*location*(1+st.upgrades.price*.2)*(1+starCount(st.washed)*.025));}
export function careBonus(s,c){return Math.round(priceFor(s,c)*(careFor(c)?.bonus||0));}
export function coverage(c){return c.cells.reduce((a,b)=>a+Math.min(1,b),0)/CELL_COUNT;}
const clearedExit=c=>c.routeStep>0&&c.x>=EXIT_CLEAR_X;
function normalizeExitQueue(st){
const exits=st.cars.filter(c=>c.state==='exit');
// Old saves have no reservation. Clear cars already furthest along the shared road first.
const queue=Array.isArray(st.exitQueue)?st.exitQueue:[],missing=exits.filter(c=>!queue.includes(c.id)).sort((a,b)=>Number(b.z< -4)-Number(a.z< -4)||(a.z< -4&&b.z< -4?b.x-a.x:0));
st.exitQueue=[...new Set([...queue,...missing.map(c=>c.id)])].filter(id=>exits.some(c=>c.id===id&&!clearedExit(c)));
for(const c of exits)if(clearedExit(c))c.exitReleased=true;else if(typeof c.exitReleased!=='boolean')c.exitReleased=false;
}
function releaseExit(st){normalizeExitQueue(st);const crossing=st.cars.some(c=>c.state==='exit'&&c.exitReleased&&!clearedExit(c));if(!crossing){const next=st.cars.find(c=>c.id===st.exitQueue[0]);if(next)next.exitReleased=true;}}
export function restoreState(raw){const fresh=createState();if(!raw||raw.version!==1||!Array.isArray(raw.stations)||!raw.stations.length)return fresh;try{const s=structuredClone(raw);s.money=Math.max(0,Number(s.money)||0);s.active=clamp(Math.floor(s.active||0),0,s.stations.length-1);s.selected=clamp(Math.floor(s.selected||0),0,2);s.styles=Array.isArray(s.styles)?s.styles.filter(id=>STYLE_DEFS.some(d=>d.id===id)):['classic'];if(!s.styles.includes('classic'))s.styles.unshift('classic');if(!s.styles.includes(s.style))s.style='classic';s.settings={mute:!!s.settings?.mute};for(const st of s.stations){if(!Array.isArray(st.bays)||st.bays.length!==3||!Array.isArray(st.cars))return fresh;st.cars=st.cars.filter(c=>c&&TYPES[c.type]&&Array.isArray(c.cells)&&c.cells.length===CELL_COUNT&&Number.isFinite(c.x)&&Number.isFinite(c.z));st.upgrades={pressure:0,price:0,marketing:0,...st.upgrades};for(const k of Object.keys(UPGRADE_DEFS))st.upgrades[k]=clamp(Math.floor(st.upgrades[k]||0),0,100);for(const b of st.bays){b.queue=b.queue.filter(id=>st.cars.some(c=>c.id===id));b.car=st.cars.find(c=>c.id===b.car?.id)||null;}st.pending=Math.max(0,st.pending||0);normalizeExitQueue(st);}if(!current(s).bays[s.selected].unlocked)s.selected=0;return s;}catch{return fresh;}}
export function serialize(s){return JSON.stringify(s);}
export class Simulation{
constructor(s,emit=()=>{}){this.s=s;this.emit=emit;this.paused=false;this.holding=false;this.brush=null;}
hint(text){this.emit({type:'hint',text});return false;}
pay(cost,apply){if(this.s.money<cost)return this.hint(`还差 ${Math.ceil(cost-this.s.money)} 金币`);this.s.money-=cost;apply();this.emit({type:'purchase',cost});return true;}
select(i){if(!current(this.s).bays[i]?.unlocked)return this.hint('在设备工坊中建设这条车道');this.s.selected=i;this.brush=null;return true;}
buy(key,index){const s=this.s,st=current(s),b=st.bays[index??s.selected];
if(UPGRADE_DEFS[key])return this.pay(upgradeCost(key,st.upgrades[key]),()=>st.upgrades[key]++);
if(key==='lane'){if(!b||b.unlocked)return false;if(index===2&&!st.bays[1].unlocked)return this.hint('先建设第二条车道');return this.pay(laneCost(index),()=>{b.unlocked=true;s.selected=index;st.spawnTimer=.1;});}
if(key==='worker'){if(!b?.unlocked)return this.hint('先建设这条车道');if(b.worker)return false;return this.pay(workerCost(index),()=>b.worker=true);}
if(key==='machine'){if(!b?.unlocked)return false;if(b.level>=5)return false;if(b.level===1&&st.washed<5)return this.hint('本店完成 5 辆车后可购买自动滚刷');return this.pay(machineCost(b.level),()=>b.level++);}
if(key==='manager'){if(st.manager)return false;if(starCount(st.washed)<3)return this.hint('本店达到三星后可聘店长');return this.pay(2400,()=>st.manager=true);}
return false;}
style(id){const d=STYLE_DEFS.find(d=>d.id===id);if(!d)return false;if(this.s.styles.includes(id)){this.s.style=id;this.emit({type:'style'});return true;}if(this.s.washed<d.need)return this.hint(`累计洗净 ${d.need} 辆车后开放`);return this.pay(d.cost,()=>{this.s.styles.push(id);this.s.style=id;});}
claim(){const st=current(this.s),c=contract(st.contract);if(st.washed<c.count)return false;this.s.money+=c.reward;st.contract++;this.emit({type:'reward',amount:c.reward});return true;}
switchBranch(id){const s=this.s,def=branchDef(id);if(s.stations[id]){s.active=id;s.selected=0;this.emit({type:'branch'});return true;}if(id!==s.stations.length)return this.hint('请先开设前一家门店');if(s.washed<def.need)return this.hint(`累计洗净 ${def.need} 辆车后可选址`);return this.pay(def.price,()=>{s.stations.push(newStation(id));s.active=id;s.selected=0;this.emit({type:'branch'});});}
collect(){let total=0;for(const st of this.s.stations){total+=Math.floor(st.pending);st.pending-=Math.floor(st.pending);}if(!total)return this.hint('已聘店长的分店会在你营业时积累托管收益');this.s.money+=total;this.emit({type:'reward',amount:total,label:'连锁收益'});return total;}
update(dt){const s=this.s;if(this.paused||!s.started)return;dt=clamp(dt,0,.1);s.time+=dt;const st=current(s);
for(const other of s.stations)if(other!==st&&other.manager){const workers=other.bays.filter(b=>b.unlocked&&(b.worker||b.level>=2)).length;other.pending=Math.min(1200+other.washed*5,other.pending+dt*workers*(.8+other.upgrades.price*.22));}
const unlocked=st.bays.map((b,i)=>b.unlocked?i:-1).filter(i=>i>=0);st.spawnTimer-=dt;
if(st.spawnTimer<=0&&st.cars.length<unlocked.length*5+2&&!st.cars.some(c=>c.state==='arrive'&&c.routeStep===0&&c.x< -17.5)){const load=i=>st.bays[i].queue.length+(st.bays[i].car?1:0);const lane=unlocked.reduce((best,i)=>load(i)<load(best)?i:best,unlocked[0]);if(st.bays[lane].queue.length<4){const c=makeCar(st,lane);st.cars.push(c);st.bays[lane].queue.push(c.id);}st.spawnTimer=Math.max(2.7,6.4-st.upgrades.marketing*.55)/Math.sqrt(unlocked.length);}
for(let i=0;i<3;i++){const b=st.bays[i];if(!b.unlocked)continue;if(!b.car&&b.queue.length){const id=b.queue[0],c=st.cars.find(c=>c.id===id);if(c&&c.state==='queue'&&Math.abs(c.z-6.5)<.15&&Math.abs(c.x-BAY_X[i])<.1&&!st.cars.some(o=>o.lane===i&&o.state==='exit'&&o.z>-7)){b.car=c;c.state='enter';b.queue.shift();}}
if(b.car?.state==='work'){const c=b.car;const auto=((b.worker?.85:0)+(b.level>=2?.62+(b.level-2)*.36:0))*(c.phase===3?.7:1);const manual=s.selected===i&&(this.holding||this.brush)?1.65*(1+st.upgrades.pressure*.28):0;let rate=(auto+manual)/phaseFor(c).duration;
if(rate){const amount=dt*rate;const center=this.brush?.index;for(let j=0;j<CELL_COUNT;j++){let gain=amount;if(manual&&this.brush){const band=Math.abs(j-center);gain=amount*(band<Math.min(24,8+st.upgrades.pressure*2)?5.4:.33);}c.cells[j]=Math.min(1,c.cells[j]+gain);}c.progress=coverage(c);c.manual+=manual?dt:0;if(c.progress>=.96){if(c.phase<(careFor(c)?3:2)){c.phase++;c.cells.fill(0);c.progress=0;this.emit({type:'phase',lane:i,phase:c.phase,vip:!!careFor(c)});}else this.finish(c,b);}}}
}
releaseExit(st);
for(const c of st.cars){c.glow=Math.max(0,c.glow-dt);c.vipIntro=Math.max(0,(c.vipIntro||0)-dt);c.wait+=dt;let target=null;
if(c.state==='arrive'){const q=st.bays[c.lane].queue,n=q.indexOf(c.id),front=n>0?st.cars.find(o=>o.id===q[n-1]):null,tail=Math.max(6.5+Math.max(0,n)*5.8,front&&Math.abs(front.x-BAY_X[c.lane])<.3?front.z+5.8:0);const p=[[BAY_X[c.lane],28],[BAY_X[c.lane],tail]][c.routeStep];target=c.routeStep===1&&front&&Math.abs(front.x-BAY_X[c.lane])>.3?null:p;if(target&&Math.hypot(c.x-p[0],c.z-p[1])<.1){c.routeStep++;if(c.routeStep>=2)c.state='queue';}}
if(c.state==='queue'){const n=st.bays[c.lane].queue.indexOf(c.id);target=[BAY_X[c.lane],6.5+Math.max(0,n)*5.8];}
if(c.state==='enter'){target=[BAY_X[c.lane],0];if(Math.abs(c.z)<.08){c.z=0;c.state='work';c.wait=0;this.emit({type:'arrived',lane:c.lane});if(careFor(c)){c.vipIntro=3.2;this.emit({type:'vip',id:c.id,lane:c.lane,name:TYPES[c.type].name,care:careFor(c).title,bonus:careBonus(s,c)});}}}
if(c.state==='exit'&&c.exitReleased){target=c.routeStep===0?[BAY_X[c.lane],EXIT_Z]:c.routeStep===1?[19,EXIT_Z]:[24,EXIT_Z];if(Math.hypot(c.x-target[0],c.z-target[1])<.1)c.routeStep++;if(c.routeStep>=3)c.state='gone';if(c.routeStep>0){const front=st.cars.filter(o=>o!==c&&o.state==='exit'&&o.routeStep>0&&o.x>c.x&&Math.abs(o.z-c.z)<3).sort((a,b)=>a.x-b.x)[0];if(front)target=[Math.max(c.x,Math.min(target[0],front.x-EXIT_GAP)),target[1]];}}
const ox=c.x,oz=c.z;if(target){const dx=target[0]-c.x,dz=target[1]-c.z,d=Math.hypot(dx,dz),v=Math.min(d,dt*(c.state==='exit'?4.5:c.state==='arrive'?6:3.2));if(d>.001){c.x+=dx/d*v;c.z+=dz/d*v;const a=Math.atan2(dx,dz);c.yaw+=Math.atan2(Math.sin(a-c.yaw),Math.cos(a-c.yaw))*Math.min(1,dt*9);}}c.speed=Math.hypot(c.x-ox,c.z-oz)/Math.max(dt,.001);}
st.cars=st.cars.filter(c=>c.state!=='gone');}
finish(c,b){if(c.paid||careFor(c)&&(c.phase!==3||coverage(c)<.96))return;c.paid=true;c.progress=1;c.cells.fill(1);c.state='exit';c.routeStep=0;c.exitReleased=false;c.glow=careFor(c)?5:2.8;const s=this.s,st=current(s),base=priceFor(s,c),bonus=careBonus(s,c),tip=c.manual>1?Math.round(base*.18):0,amount=base+bonus+tip,oldStars=starCount(st.washed);st.exitQueue??=[];st.exitQueue.push(c.id);s.money+=amount;s.earned+=amount;s.washed++;st.washed++;st.revenue+=amount;if(careFor(c))st.vipServed=(st.vipServed||0)+1;b.car=null;this.emit({type:'finish',id:c.id,lane:c.lane,amount,tip,bonus,vip:!!careFor(c)});if(starCount(st.washed)>oldStars)this.emit({type:'star',stars:starCount(st.washed)});}
}


