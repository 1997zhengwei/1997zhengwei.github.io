export const FORMS={flat:{name:'FLAT',verb:'Squeeze under',power:'Slip Dash',key:'1',color:'#f391af'},ball:{name:'BALL',verb:'Smash through',power:'Power Roll',key:'2',color:'#87dbc5'},spring:{name:'SPRING',verb:'Bounce over',power:'Super Bounce',key:'3',color:'#bfa4ee'}};
export const THEMES=[{name:'Jellyfish Fields',sea:'#298f9e',sky:'#8fcec9',wood:'#d5b981'},{name:'Goo Lagoon',sea:'#347c95',sky:'#efc8aa',wood:'#cb9a70'},{name:'Krusty Harbor',sea:'#215d78',sky:'#729da9',wood:'#92afa8'}];
const TYPES=['flat','ball','spring'];
export function makeLeg(index,seed=0){
 let n=(491+index*103+seed*997)>>>0;const rnd=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296};
 const stops=[{at:162,lane:-1,name:'Patrick',done:false},{at:326,lane:1,name:'Squidward',done:false},{at:490,lane:0,name:'Gary',done:false}];
 const obstacles=[],coins=[],jellies=[];
 for(let i=0;i<24;i++){
  const section=Math.floor(i/8),local=i%8,at=20+section*164+local*17.5;
  let options;if(index===0&&seed===0&&i<3)options=[TYPES[i],TYPES[i],TYPES[i]];
  else{const a=TYPES[(i+index+seed)%3],b=TYPES[(i+index+seed+1)%3],safe=Math.floor(rnd()*3);options=[a,b,TYPES[(i+2+index)%3]];options[safe]=null;if(local===6)options[(safe+1)%3]=null;}
  const teach=index===0&&seed===0&&i<3;obstacles.push({id:i,at,kind:options.find(Boolean),options,done:false,teach,clearLane:null,smashed:false});
  const risky=options.map((kind,k)=>kind?k-1:null).filter(k=>k!==null),rewardLane=risky[Math.floor(rnd()*risky.length)];
  for(const offset of [-5,-2,3])coins.push({id:coins.length,at:at+offset,lane:rewardLane,got:false});
  if(i>=4&&local%3===1)jellies.push({id:jellies.length,at:at+9,lane:Math.floor(rnd()*3)-1,x:0,kind:section===2?'bot':'jelly',done:false});
 }
 return {length:514,obstacles,coins,jellies,stops};
}
export const laneKind=(o,lane)=>o?.options?.[lane+1]??null;
export const nextObstacle=s=>s.leg.obstacles.find(o=>!o.done);
export const nextStop=s=>s.leg.stops.find(o=>!o.done);
function checkpoint(s){return {distance:s.distance,score:s.score,coins:s.coins,deliveries:s.deliveries,energy:s.energy,shield:s.shield,magnet:s.magnet,efficient:s.efficient,completed:s.leg.stops.filter(x=>x.done).length}}
export function newRun(seed=0){const s={status:'playing',stage:0,seed,distance:0,lane:0,x:0,form:'spring',hp:3,maxHp:3,score:0,coins:0,combo:0,bestCombo:0,hits:0,elapsed:0,shield:0,magnet:false,efficient:false,energy:45,power:0,powerForm:null,invuln:0,jump:0,jumpEnd:0,deliveries:0,defeated:0,leg:makeLeg(0,seed)};s.checkpoint=checkpoint(s);return s}
export function usePower(s){const cost=s.efficient?45:60;if(s.status!=='playing'||s.energy<cost||s.power>0||(s.form==='spring'&&s.jumpEnd>s.distance))return false;s.energy-=cost;s.power=2.5;s.powerForm=s.form;if(s.form==='flat')s.invuln=Math.max(s.invuln,2.5);if(s.form==='spring'){s.jumpStart=s.distance;s.jumpEnd=s.distance+22;s.jumpHeight=3.5}return true}
export function damage(s,reason,kind='jelly'){s.combo=0;if(s.invuln>0)return {type:'safe',kind};if(s.shield>0){s.shield--;s.invuln=1.4;return {type:'shield',kind}}s.hp--;s.hits++;s.invuln=1.7;if(s.hp<=0)s.status='lost';return {type:'hit',reason,kind}}
export function resolveGate(s,o){
 if(o.done)return null;o.done=true;const lane=Math.max(-1,Math.min(1,Math.round(s.x/2.4))),kind=laneKind(o,lane);o.clearLane=lane;
 if(!kind){s.score+=15;return {type:'bypass'}}
 const smash=s.power>0&&s.powerForm==='ball'&&kind!=='spring',air=s.jump>1.8;
 if(s.form===kind||smash||air){o.smashed=smash||(kind==='ball'&&s.form==='ball'&&!air);s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);s.score+=100+Math.min(s.combo,10)*20;s.energy=Math.min(100,s.energy+14);return {type:'clear',kind,combo:s.combo,powered:smash||air,air}}
 return damage(s,`Use ${FORMS[kind].name}, or take an open lane.`,kind);
}
export function completeDelivery(s,perk){if(s.status!=='delivery')return false;const stop=nextStop(s);if(!stop)return false;stop.done=true;s.deliveries++;s.score+=300;s.hp=Math.min(3,s.hp+1);if(perk==='shield')s.shield=1;if(perk==='magnet')s.magnet=true;if(perk==='efficient')s.efficient=true;if(perk==='bonus')s.score+=300;s.energy=100;s.power=0;s.jump=0;s.jumpEnd=0;s.invuln=2;s.status='playing';s.checkpoint=checkpoint(s);return true}
export function advanceStage(s,perk){if(s.stage>=2)return;if(perk==='shield')s.shield=1;if(perk==='heart')s.hp=3;if(perk==='magnet')s.magnet=true;s.stage++;s.leg=makeLeg(s.stage,s.seed);s.distance=0;s.x=0;s.lane=0;s.jump=0;s.jumpEnd=0;s.power=0;s.invuln=2;s.energy=100;s.status='playing';s.checkpoint=checkpoint(s)}
export function retryStage(s){const c=s.checkpoint;s.leg=makeLeg(s.stage,s.seed);s.distance=c.distance;s.score=c.score;s.coins=c.coins;s.deliveries=c.deliveries;s.energy=c.energy;s.shield=c.shield;s.magnet=c.magnet;s.efficient=c.efficient;for(const o of s.leg.obstacles)o.done=o.at<s.distance;for(const v of s.leg.coins)v.got=v.at<s.distance;for(const j of s.leg.jellies)j.done=j.at<s.distance;for(let i=0;i<c.completed;i++)s.leg.stops[i].done=true;s.lane=0;s.x=0;s.hp=3;s.combo=0;s.jump=0;s.jumpEnd=0;s.power=0;s.invuln=3;s.status='playing'}
export function step(s,dt){
 if(s.status!=='playing')return [];const events=[];s.elapsed+=dt;s.invuln=Math.max(0,s.invuln-dt);s.power=Math.max(0,s.power-dt);s.x+=(s.lane*2.4-s.x)*Math.min(1,dt*12);
 const next=nextObstacle(s),stop=nextStop(s),kind=laneKind(next,s.lane),teaching=next?.teach&&next.at-s.distance<5&&s.form!==kind,stopWait=stop&&stop.at-s.distance<5&&Math.abs(s.x-stop.lane*2.4)>.65;
 const speed=(5.15+s.stage*.3+Math.min(1.4,s.seed*.2))*(s.power>0&&s.powerForm==='flat'?1.4:1);
 if(!teaching&&!stopWait)s.distance+=dt*speed;
 const physicalKind=laneKind(next,Math.round(s.x/2.4));if(next&&physicalKind==='spring'&&next.at-s.distance<3.5&&next.at-s.distance>0&&s.form==='spring'&&!s.jumpEnd){s.jumpStart=next.at-3.5;s.jumpEnd=next.at+3.5;s.jumpHeight=2.25;events.push({type:'jump'})}
 if(s.jumpEnd){const p=Math.max(0,Math.min(1,(s.distance-s.jumpStart)/(s.jumpEnd-s.jumpStart)));s.jump=Math.sin(p*Math.PI)*s.jumpHeight;if(p>=1){s.jump=0;s.jumpEnd=0}}else s.jump=0;
 for(const o of s.leg.obstacles)if(!o.done&&s.distance>=o.at){events.push(resolveGate(s,o));if(s.status==='lost')return events}
 for(const j of s.leg.jellies){j.x=j.lane*2.4+(j.kind==='bot'?Math.sin(s.elapsed*1.1+j.id)*.7:Math.sin(s.elapsed*.6+j.id)*.28);if(!j.done&&s.distance>=j.at){j.done=true;if(Math.abs(s.x-j.x)<1){if(s.power>0&&s.powerForm==='ball'){s.defeated++;s.score+=180;s.energy=Math.min(100,s.energy+15);events.push({type:'enemy',kind:j.kind})}else if(s.jump<1.2){events.push(damage(s,'Dodge the enemy, bounce over it, or use Power Roll.',j.kind));if(s.status==='lost')return events}}}}
 for(const c of s.leg.coins)if(!c.got&&Math.abs(s.distance-c.at)<.8&&(s.magnet||Math.abs(s.x-c.lane*2.4)<.95)){c.got=true;s.coins++;s.score+=30;s.energy=Math.min(100,s.energy+3);events.push({type:'coin',lane:c.lane})}
 if(stop&&s.distance>=stop.at){s.distance=stop.at;s.status='delivery';s.jump=0;s.jumpEnd=0;events.push({type:'delivery',name:stop.name});return events}
 if(s.distance>=s.leg.length){s.distance=s.leg.length;s.status=s.stage===2?'celebrating':'break';events.push({type:s.status})}return events;
}
