export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const CRUISE_SPEED=10.6,BOOST_MULTIPLIER=1.19;
export const speedFor=p=>p.finished||p.retired||p.fall>0?0:p.speed*(p.slow>0?.48:1)*(p.power>0?BOOST_MULTIPLIER:1);
export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const COURSES=[
 {id:'city',name:'缤纷城市',tag:'初次出发',length:416,color:'#0fb9ce',sky:'#bce9ef',ground:'#6ac8ce',road:'#929ca9',side:'#f6e6cb',gaps:[92,202,312],seed:741},
 {id:'coast',name:'海滨乐园',tag:'海风与霓虹',length:480,color:'#ff86b6',sky:'#bcecf7',ground:'#42bad9',road:'#96a5bc',side:'#ffe4d3',gaps:[108,224,348,424],seed:1983},
 {id:'sunset',name:'落日都会',tag:'穿越金色街区',length:520,color:'#ab83ff',sky:'#efd5ef',ground:'#b6a0d7',road:'#898ea8',side:'#ffdccb',gaps:[100,212,330,446],seed:7211}
];
export const THINGS={
 cone:{name:'路锥',need:.26,mass:3,h:.8},can:{name:'饮料罐',need:.25,mass:3,h:.6},bin:{name:'垃圾桶',need:.43,mass:5,h:.95},crate:{name:'快递箱',need:.48,mass:5,h:.8},core:{name:'引力晶核',need:.36,mass:12,h:1.2},
 hydrant:{name:'消防栓',need:.4,mass:5,h:.85},tree:{name:'小树',need:.72,mass:9,h:2.3},bench:{name:'长椅',need:.84,mass:10,h:1.1},
 car:{name:'小汽车',need:1.12,mass:22,h:1.45},kiosk:{name:'冰淇淋店',need:1.5,mass:35,h:2.7},truck:{name:'巴士',need:1.65,mass:42,h:2.25},house:{name:'彩色店铺',need:2.18,mass:65,h:4.2},tower:{name:'小楼',need:2.8,mass:100,h:6.3}
};
export const LOOKS=[
 {id:'cyan',name:'奇点原型',color:'#ac8bff',accent:'#e0d4ff',price:0,kind:'plain'},
 {id:'berry',name:'莓莓漩涡',color:'#ff63ac',accent:'#ffd0e9',price:100,kind:'petals'},
 {id:'solar',name:'太阳风暴',color:'#ffba32',accent:'#fff4a1',price:240,kind:'sun'},
 {id:'prism',name:'极光虹吸',color:'#9a73ff',accent:'#80faff',price:420,kind:'rainbow'},
 {id:'orbit',name:'星环奇点',color:'#678dff',accent:'#b8eaff',price:650,kind:'orbit'},
 {id:'royal',name:'黄金吞星者',color:'#ffce45',accent:'#fff8cc',price:980,kind:'royal'}
];
export const radiusFor=mass=>Math.min(3.8,.88+Math.sqrt(Math.max(0,mass))*.098);
export const sizeName=r=>r<1.2?'街角小洞':r<1.75?'街区吞手':r<2.4?'汽车收割机':r<3.1?'店铺粉碎机':'城市吞噬者';
export const podiumPrize=rank=>[0,200,140,100][rank]??0;
export function createWorld(courseId='city',seed=Date.now()){
 const course=COURSES.find(c=>c.id===courseId)||COURSES[0],random=rng(course.seed),items=[],hazards=[];let id=0;
 const gaps=course.gaps.map((s,i)=>({s,end:s+6.1+i*.25}));
 for(let s=14,row=0;s<course.length-10;s+=8.2,row++){
  if(gaps.some(g=>s>g.s-9&&s<g.end+5))continue;
  const stage=s/course.length;const types=stage<.15?['cone','can','bin','crate']:stage<.34?['bench','tree','hydrant','bin']:stage<.56?['car','bench','tree','kiosk']:stage<.77?['car','kiosk','truck','house']:['house','car','kiosk','tower'];
  for(const lane of[-6.4,0,6.4]){
   const base=types[Math.floor(random()*types.length)];
   if(['car','kiosk','truck','house','tower'].includes(base))items.push({id:id++,type:base,x:lane,s:s+(random()-.5)*1.4,color:Math.floor(random()*6),state:'idle'});
   else for(let k=-1;k<=1;k++)items.push({id:id++,type:base,x:lane+k*.95,s:s+(k===0?1.1:0),color:Math.floor(random()*6),state:'idle'});
  }
 }
 for(let s=57,n=0;s<course.length-22;s+=59,n++)if(!gaps.some(g=>Math.abs(g.s-s)<16))hazards.push({id:n,s,x:n%2===0?-6.3:6.3,state:'idle',kind:'mine'});
 const caches=[];
 for(let k=0;k<gaps.length;k++){
  const s=gaps[k].end+23;if(s>course.length-22)continue;const x=k%2===0?-6.4:6.4;
  caches.push({s:s-4,end:s+13,x,name:x<0?'左侧晶核补给':'右侧晶核补给'});
  for(let n=0;n<5;n++)items.push({id:id++,type:'core',x,s:s-2+n*3,color:1,state:'idle'});
  hazards.push({id:100+k,s:s+4,x:0,state:'idle',kind:'sweeper',phase:k*1.7,hitBy:[]});
 }
 const seeded=rng(seed),players=[
  {id:0,name:'你',color:'#2ce5df',x:0,s:0,skill:1,nextBoostAt:0,boostInterval:7},
  {id:1,name:'甜甜圈',color:'#ff73b4',x:-6.4,s:-2,skill:.88,nextBoostAt:8+seeded()*3,boostInterval:15+seeded()*2},
  {id:2,name:'小宇宙',color:'#a589ff',x:6.4,s:-4,skill:.96,nextBoostAt:5+seeded()*2,boostInterval:11.5+seeded()*1.5},
  {id:3,name:'橘子汽水',color:'#ffbd4a',x:0,s:-6,skill:.8,nextBoostAt:16+seeded()*4,boostInterval:35+seeded()*5}
 ].map(p=>({...p,speed:CRUISE_SPEED,mass:0,radius:.88,h:0,vy:0,vx:0,health:3,cooldown:0,power:0,slow:0,invincible:0,checkpoint:0,jumpLock:0,fall:0,finished:false,retired:false,finishTime:null,count:0,cores:0,biggest:'',bestMass:0,target:p.x,stumbles:0,miss:0,checkedGaps:[],boostCount:0}));
 return{course,gaps,items,hazards,caches,players,mode:'countdown',countdown:2.8,time:0,events:[],seed,random:seeded,awarded:false};
}
export function canEat(p,item){return p.h<.38&&THINGS[item.type].need<=p.radius*.98;}
export function currentRank(world,p=world.players[0]){return 1+world.players.filter(q=>q.id!==p.id&&!q.retired&&(q.finished?(!p.finished||q.finishTime<p.finishTime):(!p.finished&&q.s>p.s))).length;}
export function triggerJump(p){if(p.h<.02&&p.vy===0&&p.fall===0&&p.jumpLock<=0&&!p.retired){p.vy=15.8;p.jumpLock=.15;return true;}return false;}
export function triggerPower(p){if(p.cooldown<=0&&!p.fall&&!p.finished&&!p.retired){p.power=1.7;p.cooldown=7;p.boostCount=(p.boostCount||0)+1;return true;}return false;}
function event(w,type,p,data={}){w.events.push({type,player:p.id,...data});}
function hurt(w,p,cause){if(p.invincible>0)return;p.health--;p.invincible=1.6;p.slow=1.1;p.stumbles++;event(w,'hurt',p,{cause});if(p.health<=0){p.retired=true;if(p.id===0)w.mode='result';}}
export function botInput(w,p){
 let best=null,bestScore=-1;
 for(const item of w.items){const ds=item.s-p.s;if(item.state!=='idle'||ds<1||ds>18||!canEat({...p,h:0},item))continue;
  const score=THINGS[item.type].mass/(4+ds+Math.abs(item.x-p.x)*2.8);if(score>bestScore){bestScore=score;best=item;}}
 let target=best?best.x:p.target;
 for(const h of w.hazards)if(h.state==='idle'&&h.s-p.s>0&&h.s-p.s<13&&Math.abs(target-h.x)<(h.kind==='sweeper'?3.2:2))target=h.x>0?-6.4:6.4;
 p.target=target;
 const gap=w.gaps.find(g=>g.s-p.s>0&&g.s-p.s<4.3);
 const jump=!!gap&&p.h<.02&&p.miss!==gap.s;
 // An occasional telegraphed late takeoff; rivals use the same jump and fall rules.
 if(jump&&p.id===3&&!p.checkedGaps.includes(gap.s)){p.checkedGaps.push(gap.s);if(w.random()<.12)p.miss=gap.s;}
 const nextGap=w.gaps.find(g=>g.s>p.s),safeToBoost=!nextGap||nextGap.s-p.s>16;
 const obstacle=w.hazards.some(h=>h.kind==='sweeper'&&h.s-p.s>0&&h.s-p.s<4.8&&Math.abs(h.x-p.x)<3);
 return{targetX:target,jump:(jump&&p.miss!==gap?.s)||obstacle,power:p.cooldown<=0&&w.time>=p.nextBoostAt&&safeToBoost&&!!best&&bestScore>1.1};
}
export function stepWorld(w,dt,input={}){
 dt=clamp(dt,0,.05);w.events=[];if(w.mode==='paused'||w.mode==='result')return;
 if(w.mode==='countdown'){w.countdown-=dt;if(w.countdown<=0){w.mode='race';event(w,'go',w.players[0]);}return;}
 w.time+=dt;
 for(const hazard of w.hazards)if(hazard.kind==='sweeper')hazard.x=Math.sin(w.time*.9+hazard.phase)*5.8;
 for(const p of w.players){
  if(p.finished||p.retired)continue;const control=p.id===0?input:botInput(w,p);
  for(const key of['cooldown','power','slow','invincible','jumpLock'])p[key]=Math.max(0,p[key]-dt);
  if(p.fall>0){p.fall+=dt;p.h-=dt*10;if(p.fall>.65){p.s=p.checkpoint;p.h=0;p.vy=0;p.fall=0;p.miss=0;p.invincible=1.5;event(w,'respawn',p);}continue;}
  if(control.jump&&triggerJump(p))event(w,'jump',p);
  if(control.power&&triggerPower(p)){if(p.id!==0)p.nextBoostAt=w.time+p.boostInterval+w.random()*1.5;event(w,'power',p);}
  const desired=control.targetX!==undefined?clamp((control.targetX-p.x)*6,-10.5,10.5):clamp(control.move||0,-1,1)*10.5;
  p.vx+=(desired-p.vx)*Math.min(1,dt*15);p.x=clamp(p.x+p.vx*dt,-11+p.radius*.72,11-p.radius*.72);
  p.s+=speedFor(p)*dt;
  if(p.h>0||p.vy>0){p.vy-=25*dt;p.h=Math.max(0,p.h+p.vy*dt);if(p.h===0){p.vy=0;event(w,'land',p);}}
  const gap=w.gaps.find(g=>p.s>g.s&&p.s<g.end);
  if(gap&&p.h<.12){hurt(w,p,'断桥');p.fall=.001;event(w,'fall',p);continue;}
  for(const g of w.gaps)if(p.s>g.end+1&&p.checkpoint<g.end)p.checkpoint=g.end+2;
  const nextGap=w.gaps.find(g=>g.s>p.s);if(nextGap&&nextGap.s-p.s<13)p.checkpoint=Math.max(p.checkpoint,nextGap.s-14);
  for(const hazard of w.hazards){const moving=hazard.kind==='sweeper';if(hazard.state==='idle'&&!hazard.hitBy?.includes(p.id)&&Math.abs(hazard.s-p.s)<1.1&&Math.abs(hazard.x-p.x)<p.radius*.42+(moving?1.6:1.1)&&p.h<1.3){if(moving)hazard.hitBy.push(p.id);else hazard.state='hit';hurt(w,p,moving?'横移路障':'能量地雷');event(w,'explode',p,{hazard});}}
  for(const item of w.items){if(item.state!=='idle'||Math.abs(item.s-p.s)>p.radius+2.4)continue;const d=Math.hypot(item.x-p.x,item.s-p.s),def=THINGS[item.type];
   if(canEat(p,item)&&d<p.radius-(def.need*.28)+(p.power>0?1.5:0)){
    item.state='falling';item.owner=p.id;item.captured=w.time;item.dx=item.x-p.x;item.ds=item.s-p.s;p.mass+=def.mass;p.count++;p.radius=radiusFor(p.mass);if(item.type==='core'){p.cores++;p.cooldown=Math.max(0,p.cooldown-.8);event(w,'core',p);}
    if(def.mass>p.bestMass){p.bestMass=def.mass;p.biggest=def.name;}event(w,'eat',p,{item,mass:def.mass});
   }else if(!canEat(p,item)&&p.h<.3&&d<def.need*.6+p.radius*.25&&p.invincible<=0){p.slow=.5;p.invincible=.75;event(w,'big',p,{name:def.name});}
  }
  if(p.s>=w.course.length){p.finished=true;p.finishTime=w.time;p.s=w.course.length;if(p.id===0)w.mode='result';event(w,'finish',p);}
 }
 if(w.time>100){w.mode='result';event(w,'timeout',w.players[0]);}
}
export function resultFor(w){const p=w.players[0],rank=p.finished?currentRank(w):4;return{rank,finished:p.finished,coins:p.finished?podiumPrize(rank):0,count:p.count,cores:p.cores,mass:p.mass,radius:p.radius,time:p.finishTime??w.time,biggest:p.biggest||'路锥'};}
export function defaultSave(){return{version:1,coins:0,owned:['cyan'],look:'cyan',course:'city',wins:0,best:{},sound:true};}
export function normalizeSave(raw){const s=defaultSave();if(!raw||typeof raw!=='object')return s;return{...s,coins:Math.max(0,Math.floor(Number(raw.coins)||0)),owned:[...new Set(['cyan',...(Array.isArray(raw.owned)?raw.owned.filter(x=>LOOKS.some(l=>l.id===x)):[])])],look:LOOKS.some(l=>l.id===raw.look)&&raw.owned?.includes(raw.look)?raw.look:'cyan',course:COURSES.some(c=>c.id===raw.course)?raw.course:'city',wins:Math.max(0,Number(raw.wins)||0),best:raw.best&&typeof raw.best==='object'?raw.best:{},sound:raw.sound!==false};}
export function buyLook(save,id){const look=LOOKS.find(l=>l.id===id);if(!look)return{ok:false,reason:'不存在'};if(!save.owned.includes(id)){if(save.coins<look.price)return{ok:false,reason:'金币不足'};save.coins-=look.price;save.owned.push(id);}save.look=id;return{ok:true};}
export function settle(w,save){if(w.awarded)return resultFor(w);const r=resultFor(w);w.awarded=true;save.coins+=r.coins;if(r.finished){if(r.rank===1)save.wins++;const old=save.best[w.course.id];if(!old||r.time<old.time)save.best[w.course.id]={time:r.time,mass:r.mass,rank:r.rank};}return r;}
