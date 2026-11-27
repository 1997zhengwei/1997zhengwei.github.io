import {FILMS,FILM_BY_ID,HALLS,STATIONS,ARCADE_SLOTS,STAFF,TITLES,QUESTS,UPGRADE_CAPS,seatsLayout,seatPosition,price,clamp} from './data.mjs';
export const SAVE_KEY='starlight-cinema-v1';
export const EXPANSION_SECONDS=3;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createState(){return{version:1,layoutVersion:2,started:false,cash:180,earned:0,spent:0,time:0,nextId:1,spawnClock:0,machineClock:0,carryClock:0,ticketClock:0,snackClock:0,production:18,stock:0,carry:0,upgrades:{carry:0,speed:0,machine:0,marketing:0,arcade:0},staff:{ticket:0,runner:0,cleaner:0},workers:{runner:{x:-10,z:16.2,carry:0,phase:'pickup',clock:0},cleaner:{x:1.2,z:15,target:-1,phase:'idle'}},player:{x:-9,z:23.4,angle:Math.PI,walking:false},halls:HALLS.map(d=>({id:d.id,built:d.id===0,seats:1,comfort:1,projector:1,film:'moon',nextFilm:'moon',phase:'boarding',timer:0,boardElapsed:0,clean:0,screenTime:0,show:0,attendees:0,dirty:[],lastRevenue:0})),ownedFilms:['moon'],guests:[],stats:{tickets:0,snacks:0,shows:0,hires:0,halls:1,upgrades:0,cleaned:0,applause:0,games:0,arcadeEarned:0},claimed:[],title:0,events:[],seed:348711,peak:0};}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function event(s,type,data={}){s.events.push({type,...data});if(s.events.length>64)s.events.splice(0,s.events.length-64);}
export function addCash(s,amount,kind,x=0,z=18){amount=Math.round(amount);if(!Number.isFinite(amount)||amount<=0)return;s.cash+=amount;s.earned+=amount;event(s,'cash',{amount,kind,x,z});}
function pay(s,cost){if(!Number.isFinite(cost)||cost<0||s.cash<cost)return false;s.cash-=cost;s.spent+=cost;return true;}
export const carryCapacity=s=>12+s.upgrades.carry*3;
export const machineCapacity=s=>36+s.upgrades.machine*8;
export const snackCapacity=s=>36+s.upgrades.machine*6;
export const demandGenre=s=>['family','adventure','mystery'][Math.floor(s.time/180)%3];
export function ticketPrice(s,h){const film=FILM_BY_ID[h.film]||FILMS[0],hot=film.genre===demandGenre(s)?1.2:1;return Math.round((26+h.comfort*4+h.projector*3+HALLS[h.id].id*8+s.upgrades.marketing*.45)*film.boost*hot);}
export const snackPrice=s=>14+Math.floor(s.upgrades.machine/2)*2;
export function titleFor(s){let i=0;for(let n=0;n<TITLES.length;n++)if(s.earned>=TITLES[n].earned&&s.stats.shows>=TITLES[n].shows)i=n;return i;}
export const levelFor=s=>1+Math.floor(Math.sqrt(s.stats.tickets/8+s.stats.shows*2));
function route(g,points,phase){g.route=points.map(p=>({x:p.x,z:p.z}));g.phase=phase;g.walking=true;}
function walk(g,dt,speed){g.walking=false;if(!g.route?.length)return true;let remaining=dt*speed;while(g.route.length&&remaining>0){const p=g.route[0],d=distance(g,p);if(d<remaining+.002){g.x=p.x;g.z=p.z;remaining-=d;g.route.shift();}else{const dx=(p.x-g.x)/d,dz=(p.z-g.z)/d;g.x+=dx*remaining;g.z+=dz*remaining;g.angle=Math.atan2(-dx,-dz);g.walking=true;remaining=0;}}return !g.route.length;}
export function spawnGuest(s){const limit=Math.min(150,14+s.upgrades.marketing*4+s.halls.filter(h=>h.built).length*14);if(s.guests.length>=limit||s.guests.filter(g=>g.phase==='ticketQueue'||g.phase==='arrival').length>=10)return false;const id=s.nextId++,g={id,x:random(s)*3-1.5,z:40+random(s)*1.2,angle:0,style:id%24,phase:'arrival',route:[],hall:-1,seat:-1,popcorn:false,wantsPopcorn:random(s)<.78,wait:0,walkSpeed:3.4+random(s)*.7,paid:0,snackPaid:0,walking:true};route(g,[{x:0,z:36.6},{x:-9,z:36.6}], 'arrival');s.guests.push(g);return true;}
export function start(s){if(s.started)return;s.started=true;for(let i=0;i<5;i++){spawnGuest(s);const g=s.guests.at(-1);g.x=-9;g.z=27.8+i*1.22;g.phase='ticketQueue';g.route=[];}event(s,'start');}
function availableHall(s){return s.halls.filter(h=>h.built&&!h.pendingExpansion&&h.accepting!==false&&h.phase==='boarding'&&s.guests.filter(g=>g.hall===h.id&&!['exiting','leaving'].includes(g.phase)).length<seatsLayout(h.seats).capacity).sort((a,b)=>{const da=FILM_BY_ID[a.film].genre===demandGenre(s)?1:0,db=FILM_BY_ID[b.film].genre===demandGenre(s)?1:0;const na=s.guests.filter(g=>g.hall===a.id&&!['exiting','leaving'].includes(g.phase)).length,nb=s.guests.filter(g=>g.hall===b.id&&!['exiting','leaving'].includes(g.phase)).length;return db-da||Number(nb>0)-Number(na>0)||(na>0&&nb>0?nb-na:(a.lastAdmissionAt??-1)-(b.lastAdmissionAt??-1))||a.id-b.id;})[0];}
function reserve(s,g,h){const used=new Set(s.guests.filter(p=>p.hall===h.id&&p!==g&&!['exiting','leaving'].includes(p.phase)).map(p=>p.seat));let n=0;while(used.has(n))n++;if(n>=seatsLayout(h.seats).capacity)return false;if(used.size===0)h.lastAdmissionAt=s.time;g.hall=h.id;g.seat=n;g.paid=ticketPrice(s,h);s.stats.tickets++;addCash(s,g.paid,'ticket',-9,26.4);h.lastRevenue+=g.paid;event(s,'ticket',{guest:g.id,hall:h.id});if(g.wantsPopcorn){route(g,[{x:-2.5,z:28},{x:2.8,z:28},{x:9,z:28}], 'toSnack');}else goSeat(s,g);return true;}
function aisle(h){const def=HALLS[h.id];return def.x-Math.sign(def.x)*7.25;}
export function hallDoor(h){const def=HALLS[h.id];return{x:aisle(h),z:def.z-11.2};}
function goSeat(s,g){const h=s.halls[g.hall],def=HALLS[h.id],a=aisle(h),seat=seatPosition(h,g.seat),approach=g.x<0?[{x:-2.5,z:27.8},{x:-2.5,z:19.8}]:[{x:2.8,z:21.2},{x:2.8,z:19.8}];route(g,[...approach,{x:1.05,z:19.8},{x:1.05,z:def.z-11.2},{x:a,z:def.z-11.2},{x:a,z:seat.z+.87},{x:seat.x,z:seat.z+.87},{x:seat.x,z:seat.z}], 'toSeat');}
function leaveSeat(s,g){const h=s.halls[g.hall],d=HALLS[h.id],a=aisle(h),seat=seatPosition(h,g.seat);route(g,[{x:seat.x,z:seat.z+.87},{x:a,z:seat.z+.87},{x:a,z:d.z-11.2},{x:-1.1,z:d.z-11.2},{x:-1.1,z:16.5}], 'exiting');g.popcorn=false;}
function visitArcade(s,g){if(!s.upgrades.arcade||g.id%3!==0)return false;const used=new Set(s.guests.filter(a=>['toArcade','playing'].includes(a.phase)).map(a=>a.arcade)),slot=ARCADE_SLOTS.findIndex((_,i)=>i<s.upgrades.arcade&&!used.has(i));if(slot<0)return false;g.arcade=slot;const p=ARCADE_SLOTS[slot];route(g,[{x:2.8,z:16.5},{x:p.x,z:16.5},p],'toArcade');return true;}
function updateArcade(s,dt){for(const g of s.guests){if(g.phase!=='playing')continue;g.gameTimer-=dt;if(g.gameTimer>0)continue;const p=ARCADE_SLOTS[g.arcade],amount=10+s.upgrades.arcade*8;s.stats.games++;s.stats.arcadeEarned+=amount;addCash(s,amount,'arcade',p.x,p.z);event(s,'gameEnd',{slot:g.arcade});g.arcade=-1;route(g,[{x:p.x,z:16.5},{x:2.8,z:16.5},{x:2.8,z:30},{x:3,z:40.8}],'exiting');}}
function queue(s,phase,x,z,dt,spacing=1.22){const list=s.guests.filter(g=>g.phase===phase);list.sort((a,b)=>a.id-b.id);for(let i=0;i<list.length;i++){const g=list[i];g.wait+=dt;const dest=phase==='ticketQueue'?(i<5?{x,z:z+i*spacing}:{x:x+2.55,z:z+(9-i)*spacing}):{x,z:z+i*spacing};if(distance(g,dest)>.025){g.route=[dest];walk(g,dt,g.walkSpeed);}else g.walking=false;}return list;}
export function ticketServiceTime(s){const owner=distance(s.player,STATIONS.tickets)<2.05;return Math.min(owner?1.1:Infinity,s.staff.ticket?Math.max(.55,1.9/(1+s.staff.ticket*.2)):Infinity)*(owner&&s.staff.ticket?.85:1);}
function updateTicket(s,dt){const q=queue(s,'ticketQueue',-9,27.8,dt),g=q[0],h=availableHall(s);const ownerPresent=distance(s.player,STATIONS.tickets)<2.05,operator=ownerPresent||s.staff.ticket>0,serviceTime=ticketServiceTime(s);
 if(g&&h&&operator&&distance(g,{x:-9,z:27.8})<.2){s.ticketClock+=dt;if(s.ticketClock>=serviceTime){s.ticketClock=0;reserve(s,g,h);}}else s.ticketClock=0;}
function updateSnack(s,dt){const q=queue(s,'snackQueue',9,21.2,dt),g=q[0];if(g&&distance(g,{x:9,z:21.2})<.2){if(s.stock>0){s.snackClock+=dt;if(s.snackClock>=.7){s.snackClock=0;s.stock--;g.popcorn=true;g.snackPaid=snackPrice(s);s.stats.snacks++;s.stats.applause++;addCash(s,g.snackPaid,'snack',9,20);event(s,'snack',{guest:g.id});goSeat(s,g);}}else if(g.wait>11){s.snackClock=0;goSeat(s,g);}}else s.snackClock=0;}
function updateCargo(s,dt){s.carryClock+=dt;if(s.carryClock<.14)return;s.carryClock=0;if(distance(s.player,STATIONS.machine)<2&&s.production>0&&s.carry<carryCapacity(s)){s.production--;s.carry++;event(s,'pickup',{count:s.carry});}else if(distance(s.player,STATIONS.snacks)<2&&s.carry>0&&s.stock<snackCapacity(s)){s.carry--;s.stock++;event(s,'deposit');}}
function updateRunner(s,dt){if(!s.staff.runner)return;const w=s.workers.runner,cap=10+s.staff.runner*2;w.clock+=dt;if(w.phase==='pickup'){if(distance(w,STATIONS.machine)>.1){w.route=[STATIONS.machine];walk(w,dt,4.2);}else if(w.clock>.2&&s.production>0&&w.carry<cap){w.clock=0;s.production--;w.carry++;}if(w.carry>=cap||(w.carry>0&&s.production===0&&w.clock>1.2)){w.phase='delivery';w.route=[{x:-4,z:16.2},{x:4,z:16.2},STATIONS.snacks];}}else if(w.phase==='delivery'){if(walk(w,dt,4.2+s.staff.runner*.12))w.phase='deposit';}else if(w.phase==='return'){if(walk(w,dt,4.2))w.phase='pickup';}else{w.walking=false;if(w.clock>.14&&w.carry>0&&s.stock<snackCapacity(s)){w.clock=0;w.carry--;s.stock++;}if(w.carry===0){w.phase='return';w.route=[{x:4,z:16.2},{x:-4,z:16.2},STATIONS.machine];}}}
function cleanHall(s,h,dt,rate){const old=Math.floor(h.clean);h.clean+=dt*rate;if(Math.floor(h.clean)>old)event(s,'sweep',{hall:h.id});const required=Math.max(2,h.dirty.length*.45);if(h.clean>=required){h.dirty=[];h.clean=0;h.phase='boarding';h.boardElapsed=0;h.timer=0;h.film=h.nextFilm;s.stats.cleaned++;h.lastRevenue=0;event(s,'ready',{hall:h.id});}}
function sweepRoute(w,h,entrance=false){const index=Math.min(h.dirty.length-1,Math.floor(h.clean/.45)),p=seatPosition(h,h.dirty[Math.max(0,index)]??0),a=aisle(h),d=hallDoor(h),z=p.z+.87;w.cleanIndex=index;w.route=entrance?[{x:-1.2,z:w.z},{x:-1.2,z:d.z},{x:d.x,z:d.z},{x:a,z},{x:p.x,z}]:Math.abs(w.z-z)<.2?[{x:p.x,z}]:[{x:a,z:w.z},{x:a,z},{x:p.x,z}];w.phase='walkingSeat';}
function updateCleaner(s,dt){if(!s.staff.cleaner)return;const w=s.workers.cleaner,speed=4.5+s.staff.cleaner*.13;
 if(w.phase==='exit'){if(walk(w,dt,speed))w.phase='idle';return;}
 if(w.target>=0&&(s.halls[w.target].phase!=='cleaning'||s.halls[w.target].pendingExpansion)){const h=s.halls[w.target],d=hallDoor(h),a=aisle(h);w.route=[{x:a,z:w.z},{x:a,z:d.z},{x:-1.2,z:d.z}];w.phase='exit';w.target=-1;return;}
 if(w.target<0){const h=s.halls.find(h=>h.built&&h.phase==='cleaning'&&!h.pendingExpansion);if(!h){w.walking=false;return;}w.target=h.id;sweepRoute(w,h,true);}
 const h=s.halls[w.target];if(w.phase==='walkingSeat'){if(walk(w,dt,speed))w.phase='cleaning';}
 if(w.phase==='cleaning'){w.walking=false;cleanHall(s,h,dt,1+s.staff.cleaner*.22);if(h.phase==='cleaning'&&Math.floor(h.clean/.45)!==w.cleanIndex)sweepRoute(w,h);}
}
function updateHalls(s,dt){for(const h of s.halls){if(!h.built)continue;h.cheerTime=Math.max(0,(h.cheerTime||0)-dt);const guests=s.guests.filter(g=>g.hall===h.id&&!['exiting','leaving'].includes(g.phase)),seated=guests.filter(g=>g.phase==='seated');if(h.phase==='boarding'){if(seated.length)h.boardElapsed+=dt;if(seated.length&&guests.length===seated.length&&(h.boardElapsed>=14||seated.length===seatsLayout(h.seats).capacity&&h.boardElapsed>2)){h.phase='show';h.timer=FILM_BY_ID[h.film].duration;h.screenTime=0;h.attendees=seated.length;h.show++;event(s,'showStart',{hall:h.id,count:seated.length});}}else if(h.phase==='show'){h.timer-=dt;h.screenTime+=dt;if(h.timer<=0){h.phase='exiting';s.stats.shows++;s.stats.applause+=h.attendees*2;const bonus=h.attendees*(3+h.projector+(h.cheeredShow===h.show?2:0));addCash(s,bonus,'show',HALLS[h.id].x,HALLS[h.id].z);h.dirty=seated.map(g=>g.seat);for(const g of seated)leaveSeat(s,g);event(s,'showEnd',{hall:h.id,count:h.attendees,bonus});}}else if(h.phase==='exiting'){if(!s.guests.some(g=>g.hall===h.id&&g.phase==='exiting'&&Math.abs(g.x-HALLS[h.id].x)<8.7&&Math.abs(g.z-HALLS[h.id].z)<10.6)){h.phase='cleaning';h.clean=0;event(s,'needsClean',{hall:h.id});}}else if(h.phase==='cleaning'){if(!h.pendingExpansion&&distance(s.player,hallDoor(h))<3.2)cleanHall(s,h,dt,1.6);}}
}
export function tick(s,dt){if(!s.started||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.25,dt);s.time+=dt;s.spawnClock+=dt;const interval=Math.max(.6,3.32/(1+(s.halls.filter(h=>h.built).length-1)*.65+s.upgrades.marketing*.14));if(s.spawnClock>=interval){s.spawnClock=0;spawnGuest(s);}s.machineClock+=dt*(.95+s.upgrades.machine*.2);if(s.machineClock>=1){const n=Math.floor(s.machineClock);s.machineClock-=n;if(s.production<machineCapacity(s)){s.production=Math.min(machineCapacity(s),s.production+n);event(s,'pop');}}
 for(const g of s.guests){if(['ticketQueue','snackQueue','seated','playing'].includes(g.phase))continue;if(walk(g,dt,g.walkSpeed)){if(g.phase==='arrival')g.phase='ticketQueue';else if(g.phase==='toSnack'){g.phase='snackQueue';g.wait=0;}else if(g.phase==='toSeat'){g.phase='seated';g.angle=Math.PI;g.walking=false;event(s,'sit',{guest:g.id,hall:g.hall});}else if(g.phase==='toArcade'){g.phase='playing';g.gameTimer=7;g.walking=false;g.angle=0;event(s,'gameStart',{slot:g.arcade});}else if(g.phase==='exiting'){if(g.hall>=0){g.hall=-1;g.seat=-1;if(!visitArcade(s,g))route(g,[{x:-1.1,z:32.5},{x:3,z:40.8}],'exiting');}else g.phase='leaving';}}}
 s.guests=s.guests.filter(g=>g.phase!=='leaving');updateCargo(s,dt);updateTicket(s,dt);updateSnack(s,dt);updateRunner(s,dt);updateArcade(s,dt);updateHalls(s,dt);updateCleaner(s,dt);updateExpansions(s,dt);s.peak=Math.max(s.peak,s.guests.length);const title=titleFor(s);if(title>s.title){s.title=title;event(s,'title',{index:title});}}
export function upgradeCost(s,type,id){if(type==='hall'){const h=s.halls[id];return HALLS[id].cost;}if(type==='seats'||type==='comfort'||type==='projector'){const h=s.halls[id];return price({seats:140,comfort:180,projector:240}[type]*(1+id*.6),h[type]-1,type==='seats'?1.36:1.3);}if(type==='staff')return price(STAFF[id].cost,s.staff[id],1.65);if(type==='film')return FILM_BY_ID[id]?.cost??Infinity;if(type==='arcade')return price(950,s.upgrades.arcade,1.8);return price({carry:120,speed:180,machine:160,marketing:220}[type]||Infinity,s.upgrades[type]||0);}
export function purchase(s,type,id=0){const cost=upgradeCost(s,type,id);if(type==='hall'){const h=s.halls[id];if(!h||h.built||id>0&&!s.halls[id-1].built)return{ok:false,reason:'请先开放前一个影厅'};if(!pay(s,cost))return{ok:false,reason:'金币还差一点，先接待几位观众'};h.built=true;s.stats.halls++;event(s,'build',{hall:id});}
 else if(['seats','comfort','projector'].includes(type)){const h=s.halls[id];if(!h?.built)return{ok:false,reason:'影厅尚未开放'};if(type==='seats'&&h.pendingExpansion)return{ok:false,reason:'该厅已有扩容预约'};if(type==='seats'&&h.phase!=='boarding'||type==='seats'&&s.guests.some(g=>g.hall===id&&!['exiting','leaving'].includes(g.phase)))return{ok:false,reason:'等待这场散场并清洁后，再改造座椅'};if(h[type]>=UPGRADE_CAPS[type])return{ok:false,reason:'当前设施已是顶级'};if(!pay(s,cost))return{ok:false,reason:'金币不足'};h[type]++;s.stats.upgrades++;event(s,'upgrade',{hall:id,kind:type});}
 else if(type==='staff'){if(!STAFF[id]||s.staff[id]>=12)return{ok:false,reason:'团队已满级'};if(!pay(s,cost))return{ok:false,reason:'金币不足'};if(s.staff[id]===0)s.stats.hires++;s.staff[id]++;event(s,'hire',{kind:id});}
 else if(type==='film'){const film=FILM_BY_ID[id];if(!film||s.ownedFilms.includes(id))return{ok:false,reason:'已经拥有这部电影'};if(s.stats.shows<film.required)return{ok:false,reason:`完成 ${film.required} 场放映后解锁`};if(!pay(s,cost))return{ok:false,reason:'金币不足'};s.ownedFilms.push(id);event(s,'film',{film:id});}
 else {if(type==='arcade'&&!s.halls[1].built)return{ok:false,reason:'先开放第二座影厅，再迎来电玩角'};if(!(type in s.upgrades)||s.upgrades[type]>=UPGRADE_CAPS[type])return{ok:false,reason:'当前设施已满级'};if(!pay(s,cost))return{ok:false,reason:'金币不足'};s.upgrades[type]++;s.stats.upgrades++;event(s,'upgrade',{kind:type});}return{ok:true,cost};}

const hasBookings=(s,h)=>s.guests.some(g=>g.hall===h.id&&!['exiting','leaving'].includes(g.phase));
export function requestExpansion(s,id){
 const h=s.halls[id];
 if(!h?.built)return{ok:false,reason:'影厅尚未开放'};
 if(h.pendingExpansion)return{ok:false,reason:'该厅已有扩容预约，无需重复支付'};
 if(h.seats>=UPGRADE_CAPS.seats)return{ok:false,reason:'座椅已是满席配置'};
 if(h.phase==='boarding'&&!hasBookings(s,h)){
  const result=purchase(s,'seats',id);if(result.ok)h.accepting=true;
  return{...result,queued:false};
 }
 const cost=upgradeCost(s,'seats',id);if(!pay(s,cost))return{ok:false,reason:'金币不足'};
 h.pendingExpansion={level:h.seats+1,cost,previousAccepting:h.accepting!==false,progress:0};
 h.accepting=false;event(s,'expansionQueued',{hall:id,cost});return{ok:true,cost,queued:true};
}
export function cancelExpansion(s,id){
 const h=s.halls[id],job=h?.pendingExpansion;
 if(!job)return{ok:false,reason:'该厅没有扩容预约'};
 s.cash+=job.cost;s.spent-=job.cost;h.accepting=job.previousAccepting;h.pendingExpansion=null;
 event(s,'expansionCancelled',{hall:id});return{ok:true,refund:job.cost};
}
export function expansionStatus(s,h){
 const job=h.pendingExpansion;if(!job)return null;
 if(h.phase==='cleaning')return{stage:'cleaning',label:'扩容预约 · 自动整理中',detail:'改造团队正在整理影厅，无需亲自清洁'};
 if(h.phase==='exiting')return{stage:'waiting',label:'扩容预约 · 观众正在离场',detail:'等待最后一位观众离开，随后自动整理与扩容'};
 if(h.phase!=='boarding'||hasBookings(s,h))return{stage:'waiting',label:'扩容预约 · 等待本场结束',detail:'已停止新接待，已购票的观众会完整看完本场'};
 return{stage:'building',label:'正在扩容 · '+Math.floor(job.progress/EXPANSION_SECONDS*100)+'%',detail:'完成后自动恢复营业，其他影厅照常经营'};
}
function updateExpansions(s,dt){
 for(const h of s.halls){const job=h.pendingExpansion;if(!job)continue;h.accepting=false;
  if(h.phase==='cleaning'){cleanHall(s,h,dt,1.6);continue;}
  if(h.phase!=='boarding'||hasBookings(s,h))continue;
  job.progress+=dt;if(job.progress<EXPANSION_SECONDS)continue;
  h.seats=job.level;h.pendingExpansion=null;h.accepting=true;s.stats.upgrades++;
  event(s,'upgrade',{hall:h.id,kind:'seats'});event(s,'expanded',{hall:h.id,seats:seatsLayout(h.seats).capacity});
 }
}

export function setFilm(s,hallId,filmId){const h=s.halls[hallId];if(!h?.built||!s.ownedFilms.includes(filmId))return false;h.nextFilm=filmId;if(h.phase==='boarding'&&!s.guests.some(g=>g.hall===hallId&&!['exiting','leaving'].includes(g.phase)))h.film=filmId;event(s,'schedule',{hall:hallId,film:filmId});return true;}
export function cheer(s,hallId){const h=s.halls[hallId];if(!h||h.phase!=='show'||h.cheeredShow===h.show)return false;h.cheeredShow=h.show;h.cheerTime=3;s.stats.cheers=(s.stats.cheers||0)+1;s.stats.applause+=h.attendees;event(s,'cheer',{hall:hallId,count:h.attendees});return true;}
export function currentQuest(s){const q=QUESTS.find(q=>!s.claimed.includes(q.id));if(q)return{...q,value:s.stats[q.key]||0};const n=s.claimed.filter(x=>x.startsWith('encore-')).length,goal=12+n*8;return{id:`encore-${n}`,name:`星光之夜 · ${n+1}`,hint:`累计完成 ${goal} 场电影放映`,key:'shows',goal,reward:350+n*180,value:s.stats.shows};}
export function claimQuest(s){const q=currentQuest(s);if(q.value<q.goal)return false;s.claimed.push(q.id);addCash(s,q.reward,'quest');event(s,'quest',{name:q.name,reward:q.reward});return true;}
export function saveState(s){return JSON.stringify({...s,events:[],player:{...s.player,walking:false},savedAt:Date.now()});}
export function loadState(raw){try{
 const p=JSON.parse(raw),base=createState();if(!p||p.version!==1||!Array.isArray(p.halls)||p.halls.length!==6||!Array.isArray(p.guests))return base;
 const s={...base,...p,events:[],upgrades:{...base.upgrades,...p.upgrades},staff:{...base.staff,...p.staff},stats:{...base.stats,...p.stats},player:{...base.player,...p.player},workers:{runner:{...base.workers.runner,...p.workers?.runner},cleaner:{...base.workers.cleaner,...p.workers?.cleaner}}};
 for(const k of ['cash','earned','spent','time','production','stock','carry'])if(!Number.isFinite(s[k])||s[k]<0)return base;
 for(const [key,value]of Object.entries(s.upgrades)){if(!Number.isFinite(value)||value<0)return base;s.upgrades[key]=clamp(Math.floor(value),0,UPGRADE_CAPS[key]??100);}
 for(const key of Object.keys(base.staff)){if(!Number.isFinite(s.staff[key])||s.staff[key]<0)return base;s.staff[key]=clamp(Math.floor(s.staff[key]),0,12);}
 if(!Number.isFinite(s.player.x)||!Number.isFinite(s.player.z)||Math.abs(s.player.x)>100||Math.abs(s.player.z)>100)return base;
 const phases=['boarding','show','exiting','cleaning'];s.halls=p.halls.map((h,i)=>({...base.halls[i],...h}));
 if(!s.halls.every((h,i)=>h.id===i&&typeof h.built==='boolean'&&phases.includes(h.phase)&&['seats','comfort','projector'].every(k=>Number.isFinite(h[k])&&h[k]>=1&&h[k]<=UPGRADE_CAPS[k])&&Number.isFinite(h.timer)&&Number.isFinite(h.clean)&&Array.isArray(h.dirty)))return base;
 s.ownedFilms=Array.from(new Set(['moon',...(Array.isArray(s.ownedFilms)?s.ownedFilms.filter(id=>FILM_BY_ID[id]):[])]));for(const h of s.halls){if(!s.ownedFilms.includes(h.film))h.film='moon';if(!s.ownedFilms.includes(h.nextFilm))h.nextFilm=h.film;h.dirty=h.dirty.filter(i=>Number.isInteger(i)&&i>=0&&i<seatsLayout(h.seats).capacity);}
 const ids=new Set(),guestPhases=['arrival','ticketQueue','toSnack','snackQueue','toSeat','seated','exiting','toArcade','playing'];s.guests=p.guests.filter(g=>{if(!g||!Number.isInteger(g.id)||ids.has(g.id)||!Number.isFinite(g.x)||!Number.isFinite(g.z)||!Number.isFinite(g.walkSpeed)||!guestPhases.includes(g.phase)||!Number.isInteger(g.hall)||g.hall< -1||g.hall>5||g.hall>=0&&(!Number.isInteger(g.seat)||g.seat<0||g.seat>=seatsLayout(s.halls[g.hall].seats).capacity)||!Array.isArray(g.route)||!g.route.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.z)))return false;ids.add(g.id);g.angle=Number.isFinite(g.angle)?g.angle:0;g.style=clamp(Math.floor(g.style)||0,0,23);if(['toArcade','playing'].includes(g.phase)){if(!Number.isInteger(g.arcade)||g.arcade<0||g.arcade>=s.upgrades.arcade)return false;g.gameTimer=clamp(Number(g.gameTimer)||7,.01,7);}return true;}).slice(0,150);
 s.nextId=Math.max(Number.isFinite(s.nextId)?s.nextId:1,...s.guests.map(g=>g.id+1));s.cash=clamp(s.cash,0,9e15);s.carry=clamp(Math.floor(s.carry),0,carryCapacity(s));s.production=clamp(Math.floor(s.production),0,machineCapacity(s));s.stock=clamp(Math.floor(s.stock),0,snackCapacity(s));s.player.angle=Number.isFinite(s.player.angle)?s.player.angle:0;s.player.walking=false;
 for(const key of Object.keys(base.workers)){const w=s.workers[key];if(!Number.isFinite(w.x)||!Number.isFinite(w.z))s.workers[key]={...base.workers[key]};}s.workers.runner.carry=clamp(Math.floor(s.workers.runner.carry)||0,0,10+s.staff.runner*2);if(s.workers.cleaner.phase==='walking')s.workers.cleaner.phase='walkingSeat';
 s.claimed=Array.isArray(s.claimed)?s.claimed.filter(k=>typeof k==='string'):[];s.title=clamp(Math.floor(s.title)||0,0,TITLES.length-1);s.started=s.started===true;
 if(p.layoutVersion!==2){
  // Retain money, reservations, shows and upgrades; relocate only in-flight actors.
  for(const g of s.guests){if(g.hall<0)continue;const h=s.halls[g.hall],d=HALLS[g.hall];
   if(g.phase==='seated'){const seat=seatPosition(h,g.seat);g.x=seat.x;g.z=seat.z;g.angle=Math.PI;g.route=[];}
   else if(g.phase==='toSeat'){g.x=1.05;g.z=19.8;goSeat(s,g);}
   else if(g.phase==='exiting'&&Math.abs(g.x-d.x)<9.2&&Math.abs(g.z-d.z)<10.8){const seat=seatPosition(h,g.seat);g.x=seat.x;g.z=seat.z;leaveSeat(s,g);}
  }
  s.workers.cleaner={...base.workers.cleaner};
  for(const h of s.halls){const d=HALLS[h.id];if(h.built&&Math.abs(s.player.x-d.x)<9&&Math.abs(s.player.z-d.z)<10.7){s.player.x=2*d.x-s.player.x;s.player.z=2*d.z-s.player.z;break;}}
 }
 for(const h of s.halls){const job=h.pendingExpansion;
  if(!job)continue;
  if(!h.built||!Number.isInteger(job.level)||job.level!==h.seats+1||job.level>UPGRADE_CAPS.seats||!Number.isInteger(job.cost)||job.cost<=0||job.cost>9e12){h.pendingExpansion=null;continue;}
  h.pendingExpansion={level:job.level,cost:job.cost,previousAccepting:job.previousAccepting!==false,progress:clamp(Number(job.progress)||0,0,EXPANSION_SECONDS)};h.accepting=false;
 }
 s.layoutVersion=2;return s;
 }catch{return createState();}}
