import{build,actionCost,repairBell,levelCap,WAVES,focusMob,volley,serviceGolems,golemMaxHP}from'../core.mjs';
// QA-only player model uses legal purchases, walking input and Volley, with no resource bonuses.
export function prepareDay(r,policy=4){
 const n=r.night,early=policy>=3?[['northwatch','north-gate','wheat-field'],['eastwatch','east-gate'],['westwatch','west-gate','wheat-field'],['golem-yard','northwatch'],['westwatch','eastwatch']]:[['northwatch','north-gate','wheat-field'],['eastwatch','east-gate'],['westwatch','west-gate','golem-yard'],['northwatch'],['westwatch','eastwatch']];
 for(const id of early[n-1]||[])build(r,id);
 for(const b of r.builds.filter(b=>b.level&&b.hp<b.maxHp*.65).sort((a,b)=>(a.type==='wall')-(b.type==='wall')))build(r,b.id,'repair');
 while(r.bell.hp<170&&repairBell(r)){}
 const crewTasks=r.builds.filter(b=>b.type==='golem'&&b.hp>0).flatMap(b=>(b.crew||[]).map((g,slot)=>({b,g,slot}))).filter(t=>t.g.hp<golemMaxHP(t.b.level)*.7).sort((a,b)=>(a.g.hp===0)-(b.g.hp===0));
 for(const t of crewTasks)serviceGolems(r,t.b.id,t.slot);
 if(n<6)return;
 if(policy>=3&&n<13){const f=r.builds.filter(b=>b.type==='farm'&&b.unlock<=n&&b.level<3).sort((a,b)=>actionCost(a)-actionCost(b))[0];if(f)build(r,f.id);}
 for(let purchase=0;purchase<30;purchase++){
  const choices=[];
  for(const b of r.builds){
   if(b.unlock>n||b.level>=levelCap(n)||b.level&&b.hp<=0)continue;
   const cost=actionCost(b);if(cost>r.emeralds)continue;let value=0;
   if(b.type==='farm')value=(n<=13?1.7:.15)*(1+(policy%3)*.25)/(b.level+1);
   if(b.type==='tower')value=(b.district==='village'?2.7:1.35)*(b.level===2?1.5:b.level===4?1.6:1)/(1+b.level*.32);
   if(b.type==='golem')value=(b.id==='golem-yard'?2:1.25)*(b.level===2?1.6:b.level===4?1.5:1)/(1+b.level*.25);
   if(b.type==='forge')value=1.6/(1+b.level*.3);
   if(b.type==='wall')value=(b.level===0?.85:.45)/(1+b.level*.3);
   const pressure=WAVES[n-1].filter(w=>w.lane===b.lane).reduce((a,w)=>a+w.count,0);if(b.lane!==undefined)value*=.8+pressure/40;
   choices.push({b,value:value/cost**.2});
  }
  choices.sort((a,b)=>b.value-a.value);if(!choices.length||!build(r,choices[0].b.id).ok)break;
 }
}
export function createPilot(){return{night:0,timer:0,input:{x:0,z:0}};}
export function pilotInput(r,p,dt){
 if(r.phase!=='night')return{x:0,z:0};if(p.night!==r.night){p.night=r.night;p.timer=0;p.input={x:0,z:0};}volley(r);p.timer-=dt;
 if(p.timer<=0){p.timer=1.2;const e=r.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x,a.z-4.8)-Math.hypot(b.x,b.z-4.8))[0];
  if(e){focusMob(r,e.id);const dx=e.x-r.hero.x,dz=e.z-r.hero.z,d=Math.hypot(dx,dz);p.input=d>5?{x:dx/d,z:dz/d}:d<2.5&&d>.001?{x:-dx/d,z:-dz/d}:{x:0,z:0};}else p.input={x:0,z:0};
 }return p.input;
}
