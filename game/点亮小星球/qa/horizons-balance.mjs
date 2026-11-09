// Prepared deterministic comparisons. These are rule-level tests, not eight
// human browser clients or evidence of natural progression / phone performance.
import {writeFile} from 'node:fs/promises';
import {FrontierWorld,newProfile,XP,stats,dist} from '../starpath-rules.mjs';
import {hazardContains} from '../boss-combat.mjs';
function profile(id,pet=true){const f=newProfile(id,'Fixture');Object.assign(f,{xp:XP[59],metal:3000,crystal:3000,homeBase:3,modules:{oxygen:8,armor:8},weapons:{pulse:5,scatter:5,rail:5,arc:5},cleared:[0,1,2,3,4,5],aurora:{arrived:true,radar:true,escort:true,guardian:true,escortCheckpoint:3,milestones:[]},starfall:{arrived:true,cleared:[9,10],pet,petStage:pet?3:0,petXp:40,petName:'Nova',complete:false}});return f;}
const report={fixture:true,stationary:[],cooperative:[],campPacks:[]};
for(const [mode,pet,gun,range]of [['pulse only',false,true,9],['pet only',true,false,14],['pulse and pet',true,true,9]]){
 const w=new FrontierWorld(),p=w.enter(profile('stationary',pet)),ev=w.events.find(e=>e.zone===11);w.spawnTimers.fill(Infinity);p.x=0;p.z=ev.z+range;if(!gun)p.fire=Infinity;
 Object.assign(ev,{state:'active',participants:[p.id],abandoned:0});const e={id:999,x:ev.x,z:ev.z,homeX:ev.x,homeZ:ev.z,type:'boss',zone:11,event:ev.id,hp:ev.health,maxHp:ev.health,damage:58,speed:1.45,cd:0,slow:0,contributors:{},readyAt:0};w.enemies=[e];
 let t=0;while(t<150&&!p.down&&e.hp>0){w.step(.05,1800000000000+Math.round(t*1000));t+=.05;}
 report.stationary.push({mode,bossDefeated:e.hp<=0,playerDown:p.down,seconds:+t.toFixed(2),hp:Math.round(p.hp),bossHp:Math.round(e.hp)});
}
for(const n of [1,2,4,8]){
 const w=new FrontierWorld(),ev=w.events.find(e=>e.zone===11),players=Array.from({length:n},(_,i)=>w.enter(profile('crew-'+i)));
 const st=w.stations.findLast(s=>s.zone===11),leader=players[0];leader.x=st.x+2;leader.z=st.z;w.action(leader,{type:'stationBuild',station:st.id});w.action(leader,{type:'stationUpgrade',station:st.id});
 players.forEach((p,i)=>{p.x=ev.x+Math.cos(i*Math.PI*2/n)*5;p.z=ev.z+Math.sin(i*Math.PI*2/n)*5;});w.action(leader,{type:'event',id:ev.id});
 let t=0,maxBoss=0;while(t<180&&players.some(p=>!p.down)&&!players.some(p=>p.profile.starfall.complete)){
  const boss=w.enemies.find(e=>e.event===ev.id&&e.type==='boss'&&e.hp>0),center=boss||ev;if(boss)maxBoss=Math.max(maxBoss,boss.maxHp);
  for(const [i,p]of players.entries()){
   if(p.down)continue;const a=t*.48+i*Math.PI*2/n;
   if(p.oxygen<stats(p.profile).oxygen*.3)p.refilling=true;if(p.oxygen>stats(p.profile).oxygen*.92)p.refilling=false;const ds=Math.max(1,dist(p,st));let dest=p.refilling?{x:st.x+(p.x-st.x)/ds*4,z:st.z+(p.z-st.z)/ds*4}:{x:center.x+Math.cos(a)*7,z:center.z+Math.sin(a)*7};
   if(w.hazards.some(h=>hazardContains(h,p,1.3))){
    const safe=Array.from({length:20},(_,j)=>({x:p.x+Math.cos(j*Math.PI/10)*4.7,z:p.z+Math.sin(j*Math.PI/10)*4.7})).filter(q=>w.clear(q.x,q.z)&&w.hazards.every(h=>!hazardContains(h,q,1.2))).sort((a,b)=>dist(a,dest)-dist(b,dest))[0];if(safe)dest=safe;
   }
   const dx=dest.x-p.x,dz=dest.z-p.z,d=Math.hypot(dx,dz);w.action(p,{type:'input',x:d>.3?dx/d:0,z:d>.3?dz/d:0},1800000000000+Math.round(t*1000));
   if(st.hp<st.maxHp*.7&&dist(st,p)<7)w.action(p,{type:'stationRepair',station:st.id});
  }
  w.step(.05,1800000000000+Math.round(t*1000));t+=.05;
 }
 report.cooperative.push({players:n,success:players.some(p=>p.profile.starfall.complete),rewarded:players.filter(p=>p.profile.starfall.complete).length,down:players.filter(p=>p.down).length,seconds:+t.toFixed(2),minimumHp:Math.round(Math.min(...players.map(p=>p.hp))),debug:players.some(p=>p.profile.starfall.complete)?null:{boss:w.enemies.filter(e=>e.event===ev.id).map(e=>({x:e.x,z:e.z,hp:e.hp})),players:players.map(p=>({x:p.x,z:p.z,o2:p.oxygen}))},maximumBossHp:Math.round(maxBoss)});
}
for(const n of [1,2,4,8]){
 const w=new FrontierWorld(),players=Array.from({length:n},(_,i)=>w.enter(profile('pack-'+i,false)));players.forEach((p,i)=>{p.x=i*.15;p.z=-1530;p.fire=Infinity;});for(let i=0;i<42;i++)w.step(.05);
 report.campPacks.push({players:n,requested:w.arrivals.length+ w.enemies.length,zone:11});
}
await writeFile(new URL('./horizons-balance-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(report.stationary.some(s=>s.bossDefeated||!s.playerDown)||report.cooperative.some(s=>!s.success))process.exitCode=1;
