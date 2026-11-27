// Pure simulation shared by the renderer and regression tests. Seconds, world units.
export const STATIONS = {grill:{x:-4.15,z:2.7},build:{x:4.15,z:2.7}};
export const LANES=[-4,0,4];
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function flightPose(from,target,t,bank=false){t=Math.max(0,Math.min(1,t));if(!bank)return {x:from.x+(target.x-from.x)*t,z:from.z+(target.z-from.z)*t,y:1.65+Math.sin(Math.PI*t)*2.1};const bounce={x:0,z:1};if(t<.25){const u=t/.25;return {x:from.x+(bounce.x-from.x)*u,z:from.z+(bounce.z-from.z)*u,y:1.65+(0.25-1.65)*u+Math.sin(Math.PI*u)*.3};}const u=(t-.25)/.75;return {x:bounce.x+(target.x-bounce.x)*u,z:bounce.z+(target.z-bounce.z)*u,y:.25+1.4*u+Math.sin(Math.PI*u)*2.8};}
export const UPGRADES=[
 {id:'grill',name:'Double-time grill',icon:'♨',copy:'3 cooking spots. Patties cook 30% faster.'},
 {id:'tray',name:'Golden serving tray',icon:'▤',copy:'Carry 3 items. Ready patties stay warm longer.'},
 {id:'dash',name:'Delivery sneakers',icon:'➜',copy:'Dash twice as often. Dash, then toss for extra tips.'}
];
export class Kitchen {
 constructor(seed=Date.now()){this.seed=seed>>>0;this.reset()}
 random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296}
 reset(){Object.assign(this,{phase:'ready',time:0,shift:1,goal:4,served:0,total:0,tips:0,combo:0,bestCombo:0,hearts:5,tutorial:0,capacity:2,grillSpeed:1,warmTime:22,dashCooldown:3.8,player:{x:-3.45,z:2.7,dx:0,dz:-1},hands:[],grills:[null,null],orders:[null,null,null],respawn:[0,0,0],event:null,helper:null,eventClock:23,eventIndex:0,flights:[],drops:[],puddles:[],events:[],upgrades:[],dash:0,dashCD:0,dashBuff:0,buildFlash:0,perfects:0,banks:0,losses:0});}
 emit(type,data={}){this.events.push({type,...data})}
 say(text,tone='good'){this.emit('message',{text,tone})}
 start(){this.phase='running';this.spawnOrder(1);this.say('Follow the gold arrow. Tap COOK.');}
 spawnOrder(i){if(this.orders[i]||this.served>=this.goal)return;const special=this.shift>1&&this.random()<.32;this.orders[i]={lane:i,need:special?2:1,got:0,patience:52-Math.min(20,(this.shift-1)*4),max:52-Math.min(20,(this.shift-1)*4),name:special?'DOUBLE ORDER':'ONE KRABBY PATTY',id:Math.floor(this.random()*1e8)};}
 activeLanes(){return this.orders.map((o,i)=>o&&!(this.event?.kind==='squid'&&this.event.phase==='active'&&this.event.lane===i)?i:-1).filter(i=>i>=0)}
 context(){const p=this.player;
  if(this.event?.kind==='plankton'&&this.event.phase==='active'&&distance(p,this.event)<1.7)return {kind:'catch',label:'Catch!',target:this.event};
  if(this.event?.kind==='patrick'&&this.event.phase==='active'&&distance(p,this.event)<1.6&&this.hands.includes('burger'))return {kind:'feed',label:'Feed Patrick',target:this.event};
  if(distance(p,STATIONS.grill)<1.85){const ready=this.grills.findIndex(g=>g?.ready);if(ready>=0&&this.hands.length<this.capacity)return {kind:'take',label:'Take patty',slot:ready,target:STATIONS.grill};if(this.grills.some(g=>!g))return {kind:'cook',label:'Cook',target:STATIONS.grill};return {kind:'wait',label:'Cooking…',target:STATIONS.grill};}
  if(distance(p,STATIONS.build)<1.85)return {kind:'build',label:this.hands.includes('patty')?'Make burger':'Prep table',target:STATIONS.build};
  const drop=this.drops.find(d=>distance(d,p)<1.25);if(drop&&this.hands.length<this.capacity)return {kind:'recover',label:'Pick up',drop,target:drop};
  const lane=this.activeLanes().find(i=>distance(p,{x:LANES[i],z:-3.35})<1.65);
  if(lane!==undefined)return {kind:'serve',label:this.hands.includes('burger')?'Serve':'Bring burger',lane,target:{x:LANES[lane],z:-3.35}};
  return {kind:'none',label:'Follow arrow'};
 }
 action(){if(this.phase!=='running')return;const c=this.context();
  if(c.kind==='cook'){this.grills[this.grills.indexOf(null)]={cook:0,ready:false,age:0};this.tutorial=Math.max(this.tutorial,1);this.emit('cook');this.say('Sizzling! Take it when the ring turns green.');}
  else if(c.kind==='take'){this.hands.push('patty');this.grills[c.slot]=null;this.tutorial=Math.max(this.tutorial,2);this.emit('take');this.say('Now go to the green PREP table.');}
  else if(c.kind==='build'){const n=this.hands.filter(h=>h==='patty').length;if(n){this.hands=this.hands.map(h=>h==='patty'?'burger':h);this.buildFlash=.7;this.tutorial=Math.max(this.tutorial,3);this.emit('build',{n});this.say('Burger ready! Bring it to the glowing tray.');}else this.say('Pick up a cooked patty first.');}
  else if(c.kind==='serve'){if(this.consumeBurger())this.deliver(c.lane,{kind:'hand'});else this.say('Cook → Prep → Serve. Follow the arrow.');}
  else if(c.kind==='feed'){this.consumeBurger();this.helper={x:this.event.x,z:this.event.z,ttl:38};this.event=null;this.eventClock=5;this.eventIndex=1;this.emit('feed');this.say('Patrick is your helper! He scares away Plankton.');}
  else if(c.kind==='catch'){this.tips+=90;this.event=null;this.emit('catch');this.say('Recipe rescued! +$90');}
  else if(c.kind==='recover'){if(this.hands.length<this.capacity){this.hands.push('burger');this.drops.splice(this.drops.indexOf(c.drop),1);this.say('Saved it! Try a different tray.');}else this.say('Hands full. Serve a burger first.');}
  else if(c.kind==='wait')this.say('Green ring = ready. You can cook two at once.');
 }
 consumeBurger(){const i=this.hands.indexOf('burger');if(i<0)return false;this.hands.splice(i,1);return true;}
 recommended(){const c=this.context();if(c.kind==='catch')return {target:c.target,text:'Catch Plankton before he reaches the door!'};
  if(this.hands.includes('burger')){const lanes=this.activeLanes();const lane=lanes.sort((a,b)=>this.orders[a].patience-this.orders[b].patience)[0];if(lane!==undefined)return {target:{x:LANES[lane],z:-3.35},text:this.total===0?'3 · Go to the glowing tray. Tap SERVE.':distance(this.player,{x:0,z:1})<1.35?'On the blue pad! Hold TOSS for a bounce bonus.':'Serve at a tray — or hold TOSS, then release.',lane};}
  if(this.hands.includes('patty'))return {target:STATIONS.build,text:'2 · Green PREP table → tap MAKE BURGER.'};
  if(this.drops.length&&distance(this.player,this.drops[0])<3)return {target:this.drops[0],text:'Pick up the dropped burger. It can still be served!'};
  const ready=this.grills.some(g=>g?.ready);return {target:STATIONS.grill,text:ready?'1 · Green ring! Take your cooked patty.':this.grills.some(Boolean)?'Patty cooking. Start a second one, or wait for green.':'1 · Orange GRILL → tap COOK.'};
 }
 toss(lane,hold=.4){if(this.phase!=='running'||this.total===0||!this.activeLanes().includes(lane)||!this.consumeBurger())return false;
  const from={...this.player};const bank=distance(from,{x:0,z:1})<1.35;const perfect=hold>=.18&&hold<1.35;const target={x:LANES[lane],z:-4.5};const d=distance(from,target);
  this.flights.push({x:from.x,z:from.z,from,target,lane,t:0,duration:.4+d*.065,bank,perfect,boost:this.dashBuff>0,miss:!perfect&&hold>2.2});this.emit('toss');return true;
 }
 deliver(lane,shot){const o=this.orders[lane];if(!o||this.event?.kind==='squid'&&this.event.phase==='active'&&this.event.lane===lane)return false;
  o.got++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);const bonus=(shot.kind==='hand'?0:25)+(shot.perfect?20:0)+(shot.bank?40:0)+(shot.boost?25:0);const pay=50+bonus+Math.min(this.combo,8)*5;this.tips+=pay;if(shot.perfect)this.perfects++;if(shot.bank)this.banks++;
  this.emit('serve',{lane,pay,bank:shot.bank,perfect:shot.perfect});this.say(shot.bank?`TRAY BOUNCE! +$${pay}`:shot.perfect?`PERFECT CATCH! +$${pay}`:`Order up! +$${pay}`);
  if(o.got>=o.need){this.orders[lane]=null;this.respawn[lane]=3;this.served++;this.total++;if(this.total===1){this.tutorial=4;this.emit('unlock');this.say('TOSS unlocked! Hold to aim. Release to throw.');this.spawnOrder(0);this.spawnOrder(2);}}
  if(this.served>=this.goal){this.phase=this.shift===3?'win':'upgrade';if(this.shift>3)this.phase='upgrade';this.event=null;this.helper=null;this.flights=[];this.emit('roundEnd');}
  return true;
 }
 upgrade(id){if(this.phase!=='upgrade')return;this.upgrades.push(id);if(id==='grill'){if(this.grills.length<4)this.grills.push(null);this.grillSpeed=Math.min(2.2,this.grillSpeed+.3);}if(id==='tray'){this.capacity=Math.min(4,this.capacity+1);this.warmTime+=15;}if(id==='dash')this.dashCooldown=Math.max(1.1,this.dashCooldown*.55);this.nextShift();}
 nextShift(){this.shift++;this.goal=Math.min(14,4+(this.shift-1)*2);this.served=0;this.hearts=Math.min(5,this.hearts+1);this.orders=[null,null,null];this.respawn=[0,0,0];this.event=null;this.helper=null;this.eventClock=10;this.eventIndex=this.shift===2?1:2;this.drops=[];this.puddles=[];this.phase='running';for(let i=0;i<3;i++)this.spawnOrder(i);this.say(this.shift===3?'Tour bus arriving! Fill 8 orders to finish lunch.':`Rush ${this.shift}. One heart restored. Let’s cook!`);this.emit('nextShift');}
 overtime(){if(this.phase!=='win')return;this.nextShift();}
 dashStart(){if(this.phase!=='running'||this.dashCD>0)return;this.dash=.22;this.dashCD=this.dashCooldown;this.dashBuff=2.5;this.emit('dash');}
 lose(text){this.hearts--;this.losses++;this.combo=0;this.say(text,'bad');this.emit('damage');if(this.hearts<=0){this.phase='lost';this.event=null;this.emit('roundEnd');}}
 startEvent(kind){if(this.event)return;kind ||= this.helper?'plankton':this.shift===1?'patrick':['patrick','plankton','squid'][this.eventIndex++%3];this.event={kind,phase:'warning',ttl:3,x:kind==='plankton'?-4:4,z:0,lane:1};this.say(kind==='patrick'?'Patrick is hungry! Feed him a burger to win a helper.':kind==='plankton'?'Plankton is coming! Chase him or hit him with a burger.':'Squidward needs a break! Use the two outer trays.','event');this.emit('event',{kind});}
 update(dt,input={x:0,z:0}){if(this.phase!=='running')return;dt=Math.min(dt,.05);this.time+=dt;this.dashCD=Math.max(0,this.dashCD-dt);this.dashBuff=Math.max(0,this.dashBuff-dt);this.dash=Math.max(0,this.dash-dt);this.buildFlash=Math.max(0,this.buildFlash-dt);
  let {x,z}=input;const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}const slip=this.puddles.some(p=>distance(p,this.player)<1);const speed=this.dash>0?14:slip?7:5.1;const p=this.player;if(len>.05){p.dx=x;p.dz=z;}const nx=Math.max(-5.9,Math.min(5.9,p.x+x*speed*dt)),nz=Math.max(-3.55,Math.min(5.7,p.z+z*speed*dt));const coll=(xx,zz)=>Math.abs(xx)>4.65&&zz>1&&zz<4.5;if(!coll(nx,p.z))p.x=nx;if(!coll(p.x,nz))p.z=nz;
  for(let i=0;i<this.grills.length;i++){const g=this.grills[i];if(!g)continue;if(!g.ready){g.cook+=dt*this.grillSpeed;if(g.cook>=2.5){g.ready=true;this.emit('ready',{slot:i});}}else{g.age+=dt;if(g.age>this.warmTime&&this.total>0){this.grills[i]=null;this.combo=0;this.say('Burnt patty! Start a fresh one.','bad');this.emit('burn');}}}
  if(this.total>0){for(let i=0;i<3;i++){const o=this.orders[i];if(o){const closed=this.event?.kind==='squid'&&this.event.phase==='active'&&this.event.lane===i;if(!closed)o.patience-=dt;if(o.patience<=0){this.orders[i]=null;this.respawn[i]=5;this.lose('Customer left. Follow the arrow to the next order.');if(this.phase!=='running')return;}}else{this.respawn[i]-=dt;const maxLanes=this.shift===1?2:3;if(this.activeLanes().length<maxLanes&&this.respawn[i]<=0)this.spawnOrder(i);}}}
  for(let i=this.flights.length-1;i>=0;i--){const f=this.flights[i];const before=f.t;f.t+=dt/f.duration;const t=Math.min(1,f.t);Object.assign(f,flightPose(f.from,f.target,t,f.bank));if(f.bank&&before<.25&&t>=.25)this.emit('bounce');
   if(this.event?.kind==='plankton'&&this.event.phase==='active'&&distance(f,this.event)<.9){this.tips+=90;this.event=null;this.emit('catch');this.say('Flying burger stops Plankton! +$90');this.flights.splice(i,1);continue;}
   if(t>=1){this.flights.splice(i,1);if(f.miss||!this.deliver(f.lane,{kind:'toss',...f})){this.drops.push({x:Math.max(-4.5,Math.min(4.5,f.target.x+.5)),z:-2.5,ttl:18});this.combo=0;this.say('Tray missed. Pick up your burger and try again.','bad');}if(this.phase!=='running')return;}
  }
  this.drops=this.drops.filter(d=>(d.ttl-=dt)>0);this.puddles=this.puddles.filter(d=>(d.ttl-=dt)>0);
  if(this.total>1){this.eventClock-=dt;if(this.eventClock<=0&&!this.event){this.startEvent();this.eventClock=26+this.random()*9;}}
  if(this.helper){this.helper.ttl-=dt;const h=this.helper;if(this.event?.kind==='plankton'&&this.event.phase==='active'){const d=distance(h,this.event);if(d<1){this.event=null;this.tips+=70;this.emit('catch');this.say('Patrick saved the recipe! +$70');}else{h.x+=(this.event.x-h.x)/d*dt*3;h.z+=(this.event.z-h.z)/d*dt*3;}}if(h.ttl<=0)this.helper=null;}
  const e=this.event;if(e){e.ttl-=dt;if(e.phase==='warning'&&e.ttl<=0){e.phase='active';e.ttl=e.kind==='patrick'?14:e.kind==='plankton'?16:10;this.emit('eventActive',{kind:e.kind});}
   if(e.phase==='active'){if(e.kind==='patrick'){const dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz);if(d>.8&&this.hands.includes('burger')){e.x+=dx/d*dt*1.15;e.z+=dz/d*dt*1.15;}if(d<.75&&this.hands.includes('burger')){this.consumeBurger();e.phase='leaving';e.ttl=3;this.combo=0;this.say('Patrick stole a snack! Tap FEED before he reaches you.','bad');this.emit('steal');}}
    if(e.kind==='plankton'){e.x+=dt*.54;e.z=1.2+Math.sin(this.time*1.7)*1.1;if(distance(e,p)<.9){this.tips+=90;this.event=null;this.emit('catch');this.say('Recipe rescued! +$90');}}
   }
   if(e.ttl<=0&&this.event===e){if(e.kind==='plankton'&&e.phase==='active')this.lose('Plankton escaped! Chase him next time.');this.event=null;}
  }
  if(this.shift>1&&this.puddles.length===0&&Math.floor(this.time)%30===19){this.puddles.push({x:this.random()*4-2,z:1,ttl:12});this.say('Spilled sauce! Slippery, but great for a speedy delivery.','event');}
 }
}
