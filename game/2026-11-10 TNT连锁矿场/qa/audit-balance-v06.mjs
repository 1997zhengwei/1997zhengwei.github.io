import{createRun,strike,frontier,TYPES,rng,cacheRoute}from'../core.mjs';
import{writeFileSync}from'node:fs';
function play(seed,policy){const r=createRun('random',0,seed),random=rng(seed+556);if(policy!=='staged'){r.balanceVersion=2;r.energy=r.maxEnergy=Number(policy);}const events=[];
  while(r.status==='active'){const choices=[...frontier(r)].map(k=>{const[y,x]=k.split(',').map(Number),t=r.grid[y][x];return{y,x,weight:(t==='tnt'?70:TYPES[t].value/(TYPES[t].hp-r.hits[y][x]))+y*.55+random()*.15};}).sort((a,b)=>b.weight-a.weight);if(!choices.length)break;const e=strike(r,choices[0].y,choices[0].x);events.push(...e.events.filter(e=>e.kind==='supply'));}
  return{won:r.status==='won',strikes:r.strikes,supplies:events.length,depth:r.depth};}
const results={kind:'deterministic nearby-ore-first policy simulation, not human success rates',sample:1000,modes:{42:{wins:0},80:{wins:0},staged:{wins:0,supplyEvents:0}},safeRoutes:0};
for(let seed=1;seed<=results.sample;seed++){for(const policy of['42','80','staged']){const r=play(seed,policy);if(r.won)results.modes[policy].wins++;if(policy==='staged')results.modes.staged.supplyEvents+=r.supplies;}const r=createRun('random',0,seed),route=cacheRoute(r);for(const[y,x]of route.path)while(r.grid[y][x]&&r.status==='active'){if(!strike(r,y,x).ok)throw Error('Illegal safe path');}if(r.status==='won')results.safeRoutes++;else throw Error(`Safe route failed ${seed}`);}
writeFileSync(new URL('./balance-audit-v06.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
