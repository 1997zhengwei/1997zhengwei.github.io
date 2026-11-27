import {COURSES,COURSE_POOLS,ITEMS,OBJECT_RADII,OBJECT_FOOTPRINTS,clamp,lerp,smooth,randomFor} from './data.mjs';
import {createLooseScenery} from './scenery.mjs';
export const START_RADIUS=.28;
export const BASE_ROWS=108,EXTRA_TOWN_ROWS=24;
export function buildCourse(id='sunny',seed=1){
 const config=COURSES.find(c=>c.id===id)||COURSES[0],rng=randomFor(config.seed+seed),rows=[],items=[],obstacles=[],ramps=[],keys=[];let s=8;
 for(let row=0;row<BASE_ROWS+EXTRA_TOWN_ROWS;row++){
  const r=START_RADIUS*Math.pow(1.037,Math.min(row,BASE_ROWS-1)),chapter=row<35?0:row<72?1:2,width=1.0+r*4.1;
  keys.push({s,r,width,chapter});rows.push({s,r,width,chapter});
  const pool=COURSE_POOLS[config.id][chapter],cluster=pool[Math.floor(rng()*pool.length)],stepLength=2.8+r*3.2;
  for(let lane=0;lane<7;lane++){
   let type=rng()<.56?cluster:pool[Math.floor(rng()*pool.length)];if(lane===(Math.floor(row/5)%2?2:4))type=pool.reduce((a,b)=>OBJECT_RADII[a]<OBJECT_RADII[b]?a:b);if(lane===3&&row<3)type=config.id==='sunny'||config.id==='golden'?'candy':'dice';if(lane===3&&row===35)type=config.id==='playdate'?'book':'cup';if(lane===3&&row===72)type=config.id==='playdate'?'bin':'bush';
   if(rng()<.11&&lane!==3)continue;
   const u=clamp((lane-3)*.267+(rng()-.5)*.18,-.91,.91),itemR=OBJECT_RADII[type]*(.96+rng()*.08),large=itemR>r*.94;
   items.push({id:items.length,type,s:s+(rng()-.5)*stepLength*.86,u,r:itemR,chapter,variant:Math.floor(rng()*5),rotation:rng()*Math.PI*2,owner:null,takenBy:0,large,volume:Math.pow(itemR,3)*ITEMS[type].volume*.8});
  }
  if(row%2===0){const type=pool.reduce((a,b)=>OBJECT_RADII[a]<OBJECT_RADII[b]?a:b),clusterU=(rng()-.5)*1.35;for(const sign of[-1,1]){const itemR=OBJECT_RADII[type]*(.96+rng()*.08);items.push({id:items.length,type,s:s+(rng()-.5)*stepLength*.75,u:clamp(clusterU+sign*.09,-.9,.9),r:itemR,chapter,variant:Math.floor(rng()*5),rotation:rng()*Math.PI*2,owner:null,takenBy:0,large:false,volume:itemR**3*ITEMS[type].volume*.8});}}
  if(row>8&&row%13===6){obstacles.push({id:obstacles.length,s:s+r*2,u:(rng()-.5)*1.25,r:r*.85,kind:row%2?'sweeper':'arch',phase:rng()*6.28,chapter});}
  if(row>14&&row%19===12)ramps.push({id:ramps.length,s:s+r*2,r,width:r*2.1,u:(rng()-.5)*.9});
  s+=2.8+r*3.2;
 }
 const rareRow=rows[config.id==='sunny'?29:config.id==='playdate'?64:88],rareR=rareRow.r*.5,rareU=config.id==='playdate'?.86:-.87,rareHop=config.id==='playdate'?rareRow.r*3.3:0;
 items.push({id:items.length,type:config.souvenir,s:rareRow.s+rareRow.r*1.4,u:rareU,r:rareR,chapter:rareRow.chapter,variant:0,rotation:.3,owner:null,takenBy:0,rare:true,hop:rareHop,volume:rareR**3*ITEMS[config.souvenir].volume*.8});
 if(config.id==='playdate')ramps.push({id:ramps.length,s:rareRow.s,r:rareRow.r,width:rareRow.r*1.25,u:rareU,rare:true});
 const last=keys.at(-1);keys.push({s:s+last.r*5+10,r:last.r,width:last.width,chapter:2});
 const track={...config,length:keys.at(-1).s,keys,rows,items,obstacles,ramps,chapterStarts:[0,keys[35].s,keys[72].s]},placed=[];
 for(const p of createLooseScenery(track))items.push({...p,id:items.length,owner:null,takenBy:0,large:false,volume:p.r**3*ITEMS[p.type].volume*.8});
 for(const item of [...items].sort((a,b)=>Number(!!b.rare)-Number(!!a.rare)||a.s-b.s)){const f=frameAt(track,item.s,item.u),foot=item.r*OBJECT_FOOTPRINTS[item.type]+.025;let overlaps=false;for(const other of placed){if(Math.abs(item.s-other.item.s)>foot+other.foot)continue;if(Math.abs(f.y+(item.yOffset||0)+(item.hop||0)-other.y)>item.r+other.item.r)continue;if((f.x-other.x)**2+(f.z-other.z)**2<(foot+other.foot)**2){overlaps=true;break;}}if(!overlaps||item.rare)placed.push({item,x:f.x,y:f.y+(item.yOffset||0)+(item.hop||0),z:f.z,foot});}
 track.items=placed.map(p=>p.item).sort((a,b)=>a.s-b.s);track.items.forEach((item,id)=>item.id=id);return track;
}
export function expectedAt(course,s){
 const keys=course.keys;let lo=0,hi=keys.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(keys[mid].s<=s)lo=mid;else hi=mid;}
 const a=keys[lo],b=keys[hi],t=clamp((s-a.s)/Math.max(.01,b.s-a.s),0,1);return {r:lerp(a.r,b.r,t),width:lerp(a.width,b.width,t),chapter:a.chapter};
}
export function frameAt(course,s,u=0){
 const e=expectedAt(course,s),phase=course.id==='playdate'?1.2:course.id==='golden'?2.1:0;
 const extra=course.id==='playdate'?Math.sin(s*.023)*8:course.id==='golden'?Math.sin(s*.0055)*24:0,extraDx=course.id==='playdate'?Math.cos(s*.023)*.184:course.id==='golden'?Math.cos(s*.0055)*.132:0;
 const bend=Math.sin(s*.009+phase)*11+Math.sin(s*.0035+phase)*17+extra,dx=Math.cos(s*.009+phase)*.099+Math.cos(s*.0035+phase)*.0595+extraDx;
 const hill=course.id==='playdate'?(Math.sin(s*.018)+1)*e.r*.12:0,y=8-smooth(course.chapterStarts[1]-24,course.chapterStarts[1]+24,s)*4-smooth(course.chapterStarts[2]-65,course.chapterStarts[2]+65,s)*4+hill;
 const l=Math.hypot(dx,1),tx=dx/l,tz=1/l,rx=tz,rz=-tx;
 return {x:bend+rx*u*e.width,y,z:s+rz*u*e.width,tx,tz,rx,rz,...e};
}
export function chapterAt(course,s){return s<course.chapterStarts[1]?0:s<course.chapterStarts[2]?1:2;}
export function rowsNear(course,s,distance=90){return course.items.filter(i=>i.owner===null&&i.s>s-8&&i.s<s+distance);}

export function itemPose(track,item){const f=frameAt(track,item.s,item.u),floorY=f.y+(item.yOffset||0);return{...f,floorY,y:floorY+(item.hop||0)};}
