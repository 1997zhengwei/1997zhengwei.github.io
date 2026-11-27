import {writeFile} from 'node:fs/promises';
import {FrontierWorld,newProfile,stats,XP,EVENTS,ZONES,STATIONS,NODES,GATE_Z,dist,zoneAt,trainingCost,weaponCost,levelOf} from '../starpath-rules.mjs';
const w=new FrontierWorld(),p=w.enter(newProfile('simulation','Campaign Bot'));let wall=1000,walked=0,damage=0,deaths=0;const report=[];
function step(x=0,z=0){const len=Math.max(1,Math.hypot(x,z));p.input={x:x/len,z:z/len};p.lastInput=wall;const before=p.hp;w.step(.05,wall);wall+=50;walked+=Math.hypot(p.input.x,p.input.z)*5.2*.05;if(p.hp<before)damage+=before-p.hp;if(p.down){deaths++;w.evacuate(p);return false}return true}
function to(x,z,max=5000){if(p.z>=GATE_Z&&z<GATE_Z-60){const st=w.stations.filter(s=>s.hp>0&&p.profile.visited.includes(s.id)&&GATE_Z-s.z<=GATE_Z-z+5).sort((a,b)=>a.z-b.z)[0];if(st)w.action(p,{type:'deploy',station:st.id})}for(let i=0;i<max&&Math.hypot(p.x-x,p.z-z)>1;i++){let dx=x-p.x,dz=z-p.z;if(!w.clear(p.x+Math.sign(dx)*.27,p.z))dx=0;if(!w.clear(p.x,p.z+Math.sign(dz)*.27)){if(w.clear(p.x+1,p.z))dx=1;else dx=-1;dz=0}if(!step(dx,dz))return false;for(const st of w.stations)if(st.zone<=zoneAt(p)&&st.hp<=0&&dist(st,p)<6.8)w.action(p,{type:'stationBuild',station:st.id});if(p.oxygen<stats(p.profile).oxygen*.5){const st=w.stations.filter(s=>s.hp>0&&dist(s,p)<10).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(st){for(let k=0;k<20&&p.oxygen<stats(p.profile).oxygen*.9;k++){const dd=dist(p,st);step(dd>st.radius-.5?(st.x-p.x):0,dd>st.radius-.5?(st.z-p.z):0)}}}}return Math.hypot(p.x-x,p.z-z)<=1}
function refill(){const station=w.stations.filter(s=>s.hp>0&&s.zone<=Math.floor((levelOf(p.profile.xp)-1)/5)).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(!station)return false;if(!to(station.x+2.2,station.z))return false;for(let i=0;i<100&&p.oxygen<stats(p.profile).oxygen-1;i++)if(!step())return false;return true}
function base(){if(!to(0,GATE_Z+3))return false;for(let i=0;i<120;i++)step();return true}
function spend(){for(const module of ['oxygen','armor'])for(let n=0;n<5;n++){const cost=trainingCost(p.profile,module);if(p.profile.modules[module]>=5||stats(p.profile).level<cost.level||!w.canPay(p,cost))break;w.action(p,{type:'train',module})}for(let n=0;n<2;n++){const cost=weaponCost(p.profile,'pulse');if(p.profile.weapons.pulse>=3||stats(p.profile).level<cost.level||!w.canPay(p,cost))break;w.action(p,{type:'weapon',weapon:'pulse',upgrade:true})}}
for(let region=0;region<6;region++){
 const started=w.time,zone=ZONES[region];let attempts=0;
 // Gameplay simulation uses real gathering, damage, oxygen and costs. Travelling
 // between checkpoints is normal movement; no XP, health or resources are granted.
 while(stats(p.profile).level<Math.min(30,zone.recommend+4)&&attempts++<90){
  const nodes=NODES.filter(n=>n.zone===region&&w.nodeTimers[n.id]<=0).sort((a,b)=>dist(a,p)-dist(b,p));const n=nodes[0];if(!n)break;
  if(!to(n.x,n.z))continue;w.action(p,{type:'gather'});for(const s of w.stations)if(s.zone===region&&dist(s,p)<7&&s.hp<=0)w.action(p,{type:'stationBuild',station:s.id});
  if(p.oxygen<stats(p.profile).oxygen*.45)refill();if(p.hp<stats(p.profile).hp*.5||p.oxygen<15){base();spend();}
  if(attempts%14===0){base();spend()}
 }
 base();spend();
 const ev=w.events[region];if(!to(-3,ev.z+3)){report.push({region:region+1,failed:'travel',level:stats(p.profile).level,x:p.x,z:p.z,hp:p.hp,oxygen:p.oxygen,deaths});break}
 w.action(p,{type:'event',id:ev.id});
 const end=w.time+200;let angle=0;
 while(!p.profile.cleared.includes(region)&&w.time<end){
   const boss=w.enemies.find(e=>e.type==='boss'&&e.event===ev.id&&e.hp>0),threat=w.hazards.filter(h=>dist(p,h)<h.radius+1).sort((a,b)=>a.time-b.time)[0];
   let dx=0,dz=0;if(threat){dx=p.x-threat.x;dz=p.z-threat.z;if(Math.hypot(dx,dz)<.5){dx=p.x>0?-1:1;dz=1}}else if(boss){const d=dist(boss,p);if(d>stats(p.profile).range-1){dx=boss.x-p.x;dz=boss.z-p.z}else if(d<4.5){dx=p.x-boss.x;dz=p.z-boss.z}else{angle+=.04;dx=Math.cos(angle)*.5;dz=Math.sin(angle)*.5}}
   if(!step(dx,dz))break;if(p.oxygen<20){refill()}
 }
 report.push({region:region+1,name:zone.name,cleared:p.profile.cleared.includes(region),minutes:+((w.time-started)/60).toFixed(1),level:stats(p.profile).level,hp:Math.round(p.hp),metal:p.profile.metal+p.pouch.metal,crystal:p.profile.crystal+p.pouch.crystal,oxygen:Math.round(p.oxygen),deaths,weaponRank:p.profile.weapons.pulse});if(!p.profile.cleared.includes(region))break;
}
await writeFile('qa/campaign-simulation.json',JSON.stringify({simulatedSeconds:w.time,walked:Math.round(walked),damage:Math.round(damage),deaths,regions:report},null,2));console.log(JSON.stringify(report,null,2));

