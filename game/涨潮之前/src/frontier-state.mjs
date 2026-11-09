export const CHUNK=32;
export const hash32=(x,z=0)=>{let n=(Math.imul(x|0,374761393)^Math.imul(z|0,668265263))>>>0;n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;};
export function chunkIsland(cx,cz){
  const h=hash32(cx,cz);const x=cx*CHUNK+12+(h%9),z=cz*CHUNK+12+((h>>>8)%9);
  // Preserve the entire original two-day sea route and its coastline.
  if((x>-39&&x<36&&z>-36&&z<30)||h%7===0)return null;
  return{x,z,rx:5+(h%4),rz:4.8+((h>>>5)%4),peak:.65+((h>>>12)%6)*.14,cx,cz};
}
export function generatedHeight(x,z){
  const cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK),i=chunkIsland(cx,cz);if(!i)return-.95;
  const r=Math.hypot((x-i.x)/i.rx,(z-i.z)/i.rz);if(r>1.12)return-.95;
  return r<.82?.58+Math.max(0,1-r/.7)*i.peak:.58-(r-.82)*5.5;
}
export function chunkNodes(cx,cz){
  const i=chunkIsland(cx,cz);if(!i)return[];const nodes=[];
  const types=['tree','wood','fiber','stone','wood','fiber','stone','scrap'];
  for(let n=0;n<types.length;n++){
    const a=n*Math.PI/4+(hash32(cx+n,cz)%100)*.005,r=n===0?.3:.55+(n%3)*.1;
    nodes.push({id:`p:${cx}:${cz}:${n}`,type:types[n],x:i.x+Math.cos(a)*i.rx*r,z:i.z+Math.sin(a)*i.rz*r,readyAt:0,remote:true});
  }return nodes;
}
export const WEATHER_NAMES={surge:'风暴潮',cold:'寒潮',rain:'长雨夜',fog:'浓雾夜',bounty:'漂流丰收日',clear:'晴朗扩建日'};
export const WIND_NAMES=['南风','东风','北风','西风'];
export function dayPlan(seed,day,previous=null){
  const h=hash32(seed,day);let duration=148+(h%104);
  if(previous&&Math.abs(duration-previous.duration)<16)duration=previous.duration<200?Math.min(251,previous.duration+32):Math.max(148,previous.duration-32);
  const kinds=['surge','cold','rain','fog','bounty','clear'];let kind=day===3?'surge':kinds[(h>>>8)%kinds.length];
  if(previous&&kind===previous.kind)kind=kinds[(kinds.indexOf(kind)+1+((h>>>12)%4))%kinds.length];
  const warning=16+(h%7),challenge=28+((h>>>15)%19),rest=13+((h>>>20)%13),prepare=duration-warning-challenge-rest;
  return{day,duration,kind,wind:(h>>>6)%4,prepare,warning,challenge,rest,peak:kind==='surge'?1.92:kind==='rain'?1.18:kind==='bounty'?.46:.87};
}
export function newSurvival(seed=0x51d3aa){return{started:false,seed,day:3,clock:0,plan:null,goals:{supply:false,station:false,raised:false,seawall:false,stove:false,forecast:false},creative:false,supplyDay:0,forecastRead:false,protectedTime:0,completed:false,resultSeen:false,damageClock:0,repairCount:0,claimed:0,buildStart:0,discoverStart:0,dayRewarded:false,history:[],resourceTimers:{},visitedChunks:[]};}
export function readSurvival(raw,eligible,num){
  const s=newSurvival();if(!raw||!eligible)return s;
  s.seed=Math.floor(num(raw.seed,s.seed,0,0xffffffff));s.started=Boolean(raw.started);s.day=Math.floor(num(raw.day,3,3,1e9));
  const p=raw.plan;
  if(p&&WEATHER_NAMES[p.kind]&&p.day===s.day&&Number.isFinite(p.duration)&&p.duration>=120&&p.duration<=300){
    s.plan={day:s.day,kind:p.kind,wind:Math.floor(num(p.wind,0,0,3)),duration:p.duration,prepare:num(p.prepare,100,40,220),warning:num(p.warning,18,10,30),challenge:num(p.challenge,32,20,60),rest:num(p.rest,18,10,40),peak:num(p.peak,1.2,.3,2.1)};
  }else s.plan=dayPlan(s.seed,s.day);
  s.clock=num(raw.clock,0,0,s.plan.duration-.001);s.creative=Boolean(raw.creative);s.supplyDay=Math.floor(num(raw.supplyDay,0,0,s.day));
  for(const key of ['supply','station','raised','seawall','stove','forecast'])s.goals[key]=Boolean(raw.goals?.[key]);
  for(const key of ['forecastRead','completed','resultSeen','dayRewarded'])s[key]=Boolean(raw[key]);
  for(const key of ['protectedTime','damageClock','repairCount','claimed','buildStart','discoverStart'])s[key]=num(raw[key],0,0,1e9);
  s.history=Array.isArray(raw.history)?raw.history.slice(-30).filter(p=>p&&Number.isFinite(p.day)&&WEATHER_NAMES[p.kind]):[];
  s.resourceTimers={};if(raw.resourceTimers&&typeof raw.resourceTimers==='object')for(const [key,v]of Object.entries(raw.resourceTimers))if(key.startsWith('p:')&&Number.isFinite(v))s.resourceTimers[key]=v;
  s.visitedChunks=Array.isArray(raw.visitedChunks)?raw.visitedChunks.filter(k=>typeof k==='string'&&/^-?\d+,-?\d+$/.test(k)):[];return s;
}
export function survivalWeather(state){
  const s=state.survival,p=s.plan||dayPlan(s.seed,s.day),t=s.clock;
  const warningAt=p.prepare,challengeAt=p.prepare+p.warning,restAt=challengeAt+p.challenge;
  let phase='prepare',strength=0,remaining=warningAt-t;
  if(t>=restAt){phase='rest';strength=Math.max(0,1-(t-restAt)/p.rest);remaining=p.duration-t;}
  else if(t>=challengeAt){phase='challenge';strength=1;remaining=restAt-t;}
  else if(t>=warningAt){phase='warning';strength=(t-warningAt)/p.warning;remaining=challengeAt-t;}
  const rain=['surge','rain'].includes(p.kind)?strength*(p.kind==='rain'?1:.8):p.kind==='cold'?strength*.2:0;
  if(state.world?.calm){strength=0;phase='prepare';remaining=p.duration-t;}
  return{water:-.08+strength*(p.peak+.08),rain:state.world?.calm?0:rain,stage:`endless-${phase}`,phase,remaining:Math.max(0,remaining),progress:strength,name:state.world?.calm?`第 ${s.day} 天 · 晴朗营造`:`第 ${s.day} 天 · ${WEATHER_NAMES[p.kind]} · ${WIND_NAMES[p.wind]}`,kind:p.kind,wind:p.wind,strength,cold:p.kind==='cold'?strength:strength*.25,fog:p.kind==='fog'?strength:0,daylight:phase==='prepare'?1:phase==='warning'?1-strength*.65:phase==='challenge'?.32:.32+(1-strength)*.68};
}
