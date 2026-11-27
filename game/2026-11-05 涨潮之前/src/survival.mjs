import {GRID,RECIPES,dist,groundHeight,floorHeight,collides,nearBuildings,shelter,tide,gain,spend,canAfford,buildingBase,campProtection,invalidateBuildings} from './rules.mjs';
import {CHUNK,chunkNodes,chunkIsland,dayPlan,WEATHER_NAMES,WIND_NAMES} from './frontier-state.mjs';
const streamed=new WeakMap();
export function beginSurvival(s){
  if(!s.voyage.completed)return false;const v=s.survival;
  if(!v.started){v.started=true;v.day=3;v.clock=0;v.plan=dayPlan(v.seed,3);v.buildStart=s.stats.built;v.discoverStart=v.visitedChunks.length;}
  s.free=true;s.day=v.day;return true;
}
export function supplyPosition(s){
  const home=s.buildings.find(b=>b.type==='cabin')||{x:0,z:2.2};
  for(const [dx,dz]of [[-GRID,0],[GRID,0],[0,GRID],[0,-GRID],[-GRID,GRID],[GRID,-GRID]]){const p={x:home.x+dx,z:home.z+dz};if(groundHeight(p.x,p.z)>.35&&!collides(s,p.x,p.z))return p;}
  return{x:home.x,z:home.z+2.8};
}
export function claimSupply(s){
  const v=s.survival,p=supplyPosition(s);if(!v.started||v.supplyDay===v.day)return{ok:false,message:'今天的漂流补给已经收好了。'};
  if(s.voyage.boat?.aboard||dist(s.player,p)>2.3)return{ok:false,message:'先回到营地，靠近漂流补给箱。'};
  const amounts={wood:12,stone:10,fiber:6,metal:3};gain(s,amounts);v.supplyDay=v.day;v.goals.supply=true;v.claimed++;
  return{ok:true,amounts,message:'今天的漂流补给收好了。用它布置今晚的防护吧。'};
}
export function forecast(s){const p=s.survival.plan,next=dayPlan(s.survival.seed,s.survival.day+1,p);return{today:p,next,kind:WEATHER_NAMES[p.kind],wind:WIND_NAMES[p.wind],hint:p.kind==='surge'?'高脚地基或迎浪石堤能保护营地。':p.kind==='cold'?'挡风墙背后或防雨火炉旁更暖和。':p.kind==='fog'?'引航灯会照亮雾夜和归途。':p.kind==='rain'?'屋顶和防雨火炉能保住火光。':p.kind==='bounty'?'领取漂流补给或生产设施的产出。':'扩建三次，或去发现一片新海域。'};}
export function readForecast(s){s.survival.goals.forecast=true;s.survival.forecastRead=true;return{ok:true,mode:'forecast',message:'今晚的预报已经记下，箭头朝来风方向布置防护。'};}
export function prepareTonight(s){
  const v=s.survival;if(!v.started)return{ok:false,message:'先完成第二天的远行。'};
  if(v.day===3&&!['station','forecast','raised','seawall','stove'].every(k=>v.goals[k]))return{ok:false,message:'先备好气象台、抬高地基、石堤和防雨火炉。'};
  if(v.clock>=v.plan.prepare+v.plan.warning)return{ok:false,message:'今晚已经到来，注意风向与温暖。'};
  v.clock=v.plan.prepare+v.plan.warning-6;return{ok:true,message:'6 秒后迎接今晚。到你布置好的防护范围里去。'};
}
export function nextDay(s){
  const v=s.survival,p=v.plan;v.history.push({day:v.day,duration:p.duration,kind:p.kind,wind:p.wind,success:v.dayRewarded});v.history=v.history.slice(-30);
  v.day++;v.clock=0;v.plan=dayPlan(v.seed,v.day,p);v.protectedTime=0;v.damageClock=0;v.dayRewarded=false;v.repairCount=0;v.claimed=0;v.buildStart=s.stats.built;v.discoverStart=v.visitedChunks.length;s.day=v.day;
}
export function restTomorrow(s){if(!s.survival.started)return{ok:false,message:'今晚还没有准备好。'};if(s.world?.mode!=='creative'&&!s.survival.dayRewarded&&tide(s).phase!=='rest')return{ok:false,message:'先经历今晚的挑战，再休息到明天。'};nextDay(s);return{ok:true,message:`第 ${s.survival.day} 天来了：${WEATHER_NAMES[s.survival.plan.kind]}，今天的时长也不同了。`};}
export function repair(s,id){
  const b=s.buildings.find(b=>b.id===id);if(!b||dist(s.player,b)>2.4)return{ok:false,message:'先走近需要修缮的设施。'};
  if((b.hp??100)>=95)return{ok:false,message:'这座设施目前很结实。'};
  if(!canAfford(s,{cost:{wood:1,stone:1}}))return{ok:false,message:'修缮需要 1 木料、1 石头。'};
  spend(s,{wood:1,stone:1});b.hp=Math.min(100,(b.hp??100)+45);s.survival.repairCount++;return{ok:true,message:`修缮好了，结实程度恢复到 ${Math.ceil(b.hp)}%。`};
}
const PRODUCE={lumbermill:{period:15,items:{wood:5}},recycler:{period:20,items:{stone:3,metal:1}},garden:{period:18,items:{fiber:4}}};
export function collectProduction(s,id){const b=s.buildings.find(b=>b.id===id);if(!b||dist(s.player,b)>2.4)return{ok:false,message:'靠近生产设施，再收取。'};const amounts={...(b.stock||{})};if(!Object.values(amounts).some(v=>v>0))return{ok:false,message:'材料正在准备，稍后再来收取。'};gain(s,amounts);b.stock={};s.survival.claimed++;return{ok:true,amounts,message:'新材料已放进背包，可以继续扩建了。'};}
export function nearbySurvival(s){
  if(!s.survival.started||s.voyage.boat?.aboard)return[];const out=[],p=supplyPosition(s);
  if(s.survival.supplyDay!==s.survival.day&&dist(s.player,p)<2.3)out.push({...p,id:'survival:supply',kind:'supply',name:'今日漂流补给',hint:'长按收下 · 木料 / 石头 / 纤维 / 金属',action:'收取'});
  for(const b of nearBuildings(s,s.player.x,s.player.z,2.4).filter(b=>dist(s.player,b)<2.4)){
    if((b.hp??100)<90)out.push({...b,id:`repair:${b.id}`,kind:'repair',name:`${RECIPES[b.type].name} · ${Math.ceil(b.hp)}%`,hint:'修缮 · 1 木料 + 1 石头',action:'修缮'});
    else if(b.type==='station')out.push({...b,id:`forecast:${b.id}`,kind:'forecast',name:'气象台',hint:'长按查看今晚与明天的详细预报',action:'预报'});
    else if(PRODUCE[b.type])out.push({...b,id:`produce:${b.id}`,kind:'production',name:RECIPES[b.type].name,hint:Object.values(b.stock||{}).some(v=>v>0)?'长按收取已经备好的材料':'正在准备下一批材料',action:'收取'});
  }return out;
}
export function interactSurvival(s,item){if(item.kind==='supply')return claimSupply(s);if(item.kind==='repair')return repair(s,Number(item.id.split(':')[1]));if(item.kind==='forecast')return readForecast(s);if(item.kind==='production')return collectProduction(s,Number(item.id.split(':')[1]));return{ok:false,message:'再靠近一点。'};}
export function streamResources(s,focus=s.player){
  if(!s.survival.started)return;const cx=Math.floor(focus.x/CHUNK),cz=Math.floor(focus.z/CHUNK),key=`${cx},${cz}`;
  if(focus===s.player&&chunkIsland(cx,cz)&&!s.voyage.boat?.aboard&&groundHeight(s.player.x,s.player.z)>.2&&!s.survival.visitedChunks.includes(key))s.survival.visitedChunks.push(key);
  if(streamed.get(s)===key)return;streamed.set(s,key);
  const base=s.nodes.filter(n=>!n.remote),remote=[];
  for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++)for(const n of chunkNodes(x,z)){n.readyAt=s.survival.resourceTimers[n.id]||0;remote.push(n);}
  s.nodes=[...base,...remote];
  for(const [k,v]of Object.entries(s.survival.resourceTimers))if(v<=s.elapsed)delete s.survival.resourceTimers[k];
}
export function advanceSurvival(s,dt){
  const v=s.survival;if(!v.started)return[];const events=[];if(!s.world?.frozen)v.clock+=dt*(s.world?.pace||1);const w=tide(s),env=shelter(s);
  const nearby=nearBuildings(s,s.player.x,s.player.z,54);
  for(const b of nearby){const p=PRODUCE[b.type];if(!p)continue;b.production=(b.production||0)+dt*((b.hp??100)<45?.5:1);if(b.production>=p.period){const cycles=Math.floor(b.production/p.period);b.production%=p.period;b.stock||={};for(const [k,n]of Object.entries(p.items))b.stock[k]=Math.min(k==='metal'?24:100,(b.stock[k]||0)+n*cycles);}}
  v.damageClock+=dt;
  if(v.damageClock>=1){
    v.damageClock%=1;
    if(s.world?.mode!=='creative'&&w.phase==='challenge'&&['surge','rain','cold'].includes(w.kind))for(const b of nearby){
      if(['seawall','windbreak','beacon'].includes(b.type))continue;
      const base=buildingBase(s,b),flooded=campProtection(s,b.x,b.z,w).water>base+.12;
      if(flooded)b.hp=Math.max(20,(b.hp??100)-1.3);
    }
  }
  let safe=!env.flooded&&s.warmth>30;
  if(w.kind==='surge')safe&&=Boolean(env.roof||env.fire||floorHeight(s,s.player.x,s.player.z)>2);
  if(w.kind==='cold')safe&&=Boolean(env.cozy||env.protection.wind||env.fire?.type==='stove');
  if(w.kind==='rain')safe&&=Boolean(env.roof||env.fire?.type==='stove');
  if(w.kind==='fog')safe&&=env.protection.lamp;
  if(w.kind==='bounty')safe&&=v.claimed>0||v.supplyDay===v.day;
  if(w.kind==='clear')safe&&=s.stats.built-v.buildStart>=3||v.visitedChunks.length>(v.discoverStart||0);
  if(w.phase==='challenge'&&safe&&!env.aboard)v.protectedTime+=dt;
  const ready=v.day!==3||['supply','station','forecast','raised','seawall','stove'].every(k=>v.goals[k]);
  if(s.world?.mode!=='creative'&&ready&&v.protectedTime>=16&&!v.dayRewarded){v.dayRewarded=true;gain(s,{wood:8,stone:4,fiber:3,metal:1});events.push('day-reward');if(!v.completed){v.completed=true;events.push('survival-win');}}
  if(v.clock>=v.plan.duration){nextDay(s);events.push('endless-new-day');}
  streamResources(s);return events;
}
export function survivalMission(s){
  const v=s.survival;
  if(!v.completed){const tasks=[['supply','收下今日漂流补给','营地旁的漂流箱里，备好了今晚的建设材料。'],['station','搭起一座气象台','用 3 木料、2 纤维、1 金属，看看今晚会发生什么。'],['forecast','读一读今晚的预报','靠近气象台，长按查看风向和天气。'],['raised','把家的地基抬高','选择已有营地地板，连同屋子一起升到 2.55 米。'],['seawall','给营地加一道石堤','箭头朝来风方向，把家留在石堤背后。'],['stove','留住雨夜里的火光','在营地搭一座防雨火炉。'],['survive','检验今晚的防护','准备好后可提前迎接今晚，在保护范围内守住温暖。']];const i=tasks.findIndex(([k])=>!v.goals[k]);return{index:i<0?6:i,total:7,chapter:3,title:tasks[i<0?6:i][1],desc:tasks[i<0?6:i][2]};}
  const p=forecast(s);return{index:v.dayRewarded?3:0,total:3,chapter:3,title:v.dayRewarded?'今晚守住了，继续营造':`今日营地：${p.kind}`,desc:v.dayRewarded?'可以继续扩建，也可以休息到明天，看看不同的新一天。':p.hint};
}
export function closestNewIsland(s){const cx=Math.floor(s.player.x/CHUNK),cz=Math.floor(s.player.z/CHUNK),list=[];for(let x=cx-2;x<=cx+2;x++)for(let z=cz-2;z<=cz+2;z++){const i=chunkIsland(x,z);if(i&&!s.survival.visitedChunks.includes(`${x},${z}`))list.push(i);}list.sort((a,b)=>dist(s.player,a)-dist(s.player,b));return list[0]||null;}
