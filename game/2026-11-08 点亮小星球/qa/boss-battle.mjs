// Prepared rule-level battles; normal input/steps after initial fixture setup.
// These are not manual browser wins or evidence of natural progression balance.
import {writeFile} from 'node:fs/promises';
import {FrontierWorld,newProfile,XP,stats,dist} from '../starpath-rules.mjs';
import {hazardContains} from '../boss-combat.mjs';
const results=[];
for(const [zone,level] of [[8,45],[9,51],[10,57],[11,60]]){
 const w=new FrontierWorld(),f=newProfile('fight-'+zone,'Battle fixture');
 Object.assign(f,{xp:XP[level-1],metal:1500,crystal:1500,homeBase:zone===8?2:3,cleared:[0,1,2,3,4,5],aurora:{arrived:true,radar:true,escort:true,guardian:zone!==8,escortCheckpoint:3},starfall:{arrived:zone!==8,cleared:[9,10].filter(z=>z<zone),pet:zone!==8,petStage:zone===11?3:zone===10?2:zone===9?1:0,petXp:40,petName:'Nova',complete:false},modules:{oxygen:8,armor:8},weapons:{pulse:5,scatter:5,rail:5,arc:5}});
 const p=w.enter(f),ev=w.events.find(e=>e.zone===zone),st=w.stations.findLast(s=>s.zone===zone);
 p.x=st.x+2;p.z=st.z;w.action(p,{type:'stationBuild',station:st.id});w.action(p,{type:'stationUpgrade',station:st.id});
 p.x=ev.x+4;p.z=ev.z+3;
 const request=zone===8?w.action(p,{type:'aurora',target:'guardian'}):w.action(p,{type:'event',id:ev.id});
 if(request)throw Error(request);
 let t=0,lastEvent=0,damageTaken=0,stageSet=new Set(),attackShapes=new Set(),ringBreaks=0;
 const clear=()=>zone===8?f.aurora.guardian:f.starfall.cleared.includes(zone);
 while(t<180&&!p.down&&!clear()){
  const boss=w.enemies.find(e=>e.event===ev.id&&e.type==='boss'&&e.hp>0),center=boss||ev,a=t*.55;
  if(boss)stageSet.add(boss.bossStage);
  let target=p.oxygen<stats(f).oxygen*.28?{x:st.x+2,z:st.z}:{x:center.x+Math.cos(a)*7,z:center.z+Math.sin(a)*7};
  const dangers=w.hazards.filter(h=>h.owner===boss?.id&&hazardContains(h,p,1.2));
  if(dangers.length){
   // Pick a nearby legal point outside all announced shapes, with the least movement.
   const candidates=Array.from({length:16},(_,i)=>{const angle=i*Math.PI/8;return {x:p.x+Math.cos(angle)*4.5,z:p.z+Math.sin(angle)*4.5};});
   const safe=candidates.filter(q=>w.clear(q.x,q.z)&&w.hazards.every(h=>!hazardContains(h,q,1.1))).sort((a,b)=>dist(a,target)-dist(b,target))[0];if(safe)target=safe;
  }
  const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz),now=1800000000000+Math.round(t*1000);
  w.action(p,{type:'input',x:d>.3?dx/d:0,z:d>.3?dz/d:0},now);
  if(st.hp<st.maxHp*.75&&dist(st,p)<10)w.action(p,{type:'stationRepair',station:st.id});
  w.step(.05,now);t+=.05;
  for(const e of w.effects)if(e.eventId>lastEvent){if(e.type==='hurt'&&e.playerId===p.id)damageTaken+=e.damage||0;if(e.type==='warning')attackShapes.add(e.shape||'circle');if(e.type==='bossRingHit'&&e.broken)ringBreaks++;}
  lastEvent=w.eventId;
 }
 results.push({zone,level,success:clear(),seconds:+t.toFixed(2),hp:+p.hp.toFixed(1),down:p.down,stages:[...stageSet],attackShapes:[...attackShapes],ringBreaks,remainingOwnedHazards:w.hazards.filter(h=>w.enemies.some(e=>e.event===ev.id&&h.owner===e.id)).length});
}
await writeFile(new URL('./boss-battle-results.json',import.meta.url),JSON.stringify({fixture:true,results},null,2));console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.success||r.remainingOwnedHazards))process.exitCode=1;
