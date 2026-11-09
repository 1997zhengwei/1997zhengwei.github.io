import {createRun,cacheRoute,strike} from '../core.mjs';
import {writeFileSync} from 'node:fs';
const seed=parseInt(process.argv[2],16),run=createRun('random',0,seed),steps=[];
while(run.status==='active'&&steps.length<100){const[r,c]=cacheRoute(run).next,result=strike(run,r,c);if(!result.ok)throw Error('Illegal route');steps.push({r,c,energy:run.energy,max:run.maxEnergy,score:run.score,depth:run.depth,supplies:result.events.filter(e=>e.kind==='supply').map(e=>e.depth)});}
writeFileSync(new URL('./v06-playthrough.json',import.meta.url),JSON.stringify({seed:process.argv[2],steps,status:run.status},null,2));
console.log(JSON.stringify({seed:process.argv[2],strikes:steps.length,status:run.status,energy:run.energy,score:run.score,supplies:run.depthBonuses}));
