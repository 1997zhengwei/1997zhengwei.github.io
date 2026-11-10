// A closed geodesic planet: dual of a three-times subdivided icosahedron.
// No longitude seam, hidden back side or polar teleport. Rules are renderer-free.
import {RES} from './world.mjs';
export const RADIUS=18,LAND_RADIUS=18.64,DEPARTURE_RADIUS=2.2;
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const mul=(a,n)=>a.map(v=>v*n);
export const norm=a=>mul(a,1/(Math.hypot(...a)||1));
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const distance=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,b))))*LAND_RADIUS;
export const toward=(a,b,f)=>norm(add(mul(a,1-f),mul(b,f)));
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const cache=new Map();
export const GLOBE_SERVICES=[
 {id:'smelt',name:'Smelt iron',cost:{ore:2,wood:1},reward:{iron:1},time:1.7,hint:'2 Ore + 1 Wood → 1 Iron'},
 {id:'cow',name:'Feed the cow',cost:{wheat:3},reward:{emerald:1},time:1.3,hint:'3 Wheat → 1 Emerald'},
 {id:'trade',name:'Villager trade',cost:{wood:6,stone:6},reward:{emerald:1},time:1.5,hint:'6 Wood + 6 Stone → 1 Emerald'},
];
export function planet(index=1){
 if(cache.has(index))return cache.get(index);
 const t=(1+Math.sqrt(5))/2;
 let vertices=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(norm);
 let faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 for(let level=0;level<3;level++){
  const edges=new Map(),mid=(a,b)=>{const k=[Math.min(a,b),Math.max(a,b)].join(':');if(!edges.has(k)){edges.set(k,vertices.length);vertices.push(norm(add(vertices[a],vertices[b])));}return edges.get(k);};
  faces=faces.flatMap(([a,b,c])=>{const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);return [[a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]];});
 }
 const cells=vertices.map((p,id)=>({id,p,neighbors:new Set(),corners:[]}));
 for(const f of faces){const center=norm(f.reduce((a,i)=>add(a,vertices[i]),[0,0,0]));for(const id of f){cells[id].corners.push(center);for(const other of f)if(other!==id)cells[id].neighbors.add(other);}}
 for(const c of cells){c.neighbors=[...c.neighbors];const east=norm(cross(Math.abs(c.p[1])>.9?[1,0,0]:[0,1,0],c.p)),north=cross(c.p,east);c.corners.sort((a,b)=>Math.atan2(dot(a,north),dot(a,east))-Math.atan2(dot(b,north),dot(b,east)));}
 const start=cells.reduce((a,b)=>a.p[1]>b.p[1]?a:b).id,queue=[start],depth=new Map([[start,0]]);
 for(let i=0;i<queue.length;i++)for(const id of cells[queue[i]].neighbors)if(!depth.has(id)){depth.set(id,depth.get(queue[i])+1);queue.push(id);}
 const initial=queue.filter(id=>depth.get(id)<=2),serviceIds=cells[start].neighbors.slice(0,3),types=['wood','stone','ore','wheat','obsidian'];
 const forced=initial.filter(id=>id!==start&&!serviceIds.includes(id));
 for(const c of cells){
  c.depth=depth.get(c.id);const h=hash(c.id+index*1013),climate=Math.sin(c.p[0]*2.6+index*1.7)+c.p[2]*.85;
  c.biome=c.p[1]<-.58?'snow':climate>1?'sand':climate<-.8?'ruins':h>.73?'stone':'grass';
  c.type=types[Math.floor(hash(c.id*3.3+index*72)*types.length)];
  c.hits=6+(c.id%3);c.regen=5;
  // Place solid props toward a corner, leaving center-to-center walking lanes clear.
  const corner=c.corners[Math.floor(hash(c.id+index)*c.corners.length)],tangent=norm(add(corner,mul(c.p,-dot(corner,c.p))));
  c.node=norm(add(c.p,mul(tangent,1.13/LAND_RADIUS)));
  c.cost={wood:5+Math.floor(c.depth/5),stone:3+Math.floor(c.depth/7)};
  if(c.biome==='stone')c.cost.iron=1+Math.floor(c.depth/12);
  if(c.biome==='ruins')c.cost.obsidian=2+Math.floor(c.depth/10);
  if(c.id%13===0)c.cost.emerald=1;
  // A few clearly marked pieces offer a small material puzzle; ordinary prices stay unchanged.
  c.key=c.depth>=4&&c.id%19===0&&c.id%13!==0;
  if(c.key){c.cost.wood+=4;c.cost.stone+=3;const rare=c.biome==='stone'?'iron':c.biome==='ruins'?'obsidian':['iron','obsidian','emerald'][c.id%3];c.cost[rare]=(c.cost[rare]||0)+(rare==='obsidian'?3:2);}
  if(c.id===start)c.type=null;
 }
 forced.forEach((id,i)=>cells[id].type=types[i%types.length]);
 const services=GLOBE_SERVICES.map((a,i)=>({...a,cell:serviceIds[i],p:cells[serviceIds[i]].p}));
 serviceIds.forEach(id=>cells[id].type=null);
 const result={index,cells,start,initial,services};
 // Only the current and recently visited planet are needed; no ever-growing geometry cache.
 if(cache.size>=2)cache.delete(cache.keys().next().value);cache.set(index,result);return result;
}
export function newFrontier(index=1){const p=planet(index);return {index,active:true,owned:[...p.initial],paid:{},nodes:{},pos:[...p.cells[p.start].p],heading:[0,0,1],selected:null,harvestClock:0,depositClock:0,serviceClock:0,serviceId:null,idle:0,milestone:0,revision:0,rewardClaimed:false,blessing:0};}
export function enterFrontier(s){if(!s.won&&s.mode!=='planet')return false;if(!s.frontier)s.frontier=newFrontier();s.frontier.active=true;s.frontier.blessing=s.starCount>0?1:0;return true;}
// Promote the existing save rather than forging a completed island campaign.
export function startPlanetGame(s){s.mode='planet';s.starCount=Math.max(0,s.starCount||0);s.tier=3;enterFrontier(s);return s;}
export function leaveFrontier(s){if(s.frontier)s.frontier.active=false;}
export function planetComplete(g){return !!g&&g.owned.length===planet(g.index).cells.length;}
export function claimPlanetReward(s){const g=s.frontier;if(!planetComplete(g)||g.rewardClaimed)return false;g.rewardClaimed=true;g.blessing=1;s.starCount=(s.starCount||0)+1;s.bag.emerald+=12;return {emerald:12,stars:s.starCount,diamond:true};}
export function nextPlanet(s){const g=s.frontier;if(!planetComplete(g)||!g.rewardClaimed)return false;s.frontier=newFrontier(g.index+1);s.frontier.blessing=s.starCount>0?1:0;return true;}
export function restoreFrontier(raw,won){
 if(!won||!raw||!Number.isSafeInteger(raw.index)||raw.index<1)return null;
 const g=newFrontier(raw.index),p=planet(g.index),valid=id=>Number.isInteger(id)&&id>=0&&id<p.cells.length;
 // Keep only the connected part of a possibly damaged save. Starting resources cannot disappear.
 const offered=new Set([...(Array.isArray(raw.owned)?raw.owned.filter(valid):[]),...p.initial]),seen=new Set(p.initial),queue=[...seen];
 for(let i=0;i<queue.length;i++)for(const id of p.cells[queue[i]].neighbors)if(offered.has(id)&&!seen.has(id)){seen.add(id);queue.push(id);}g.owned=[...seen];
 g.active=!!raw.active;g.milestone=Math.min(4,Math.floor(g.owned.length/p.cells.length*4));
 g.rewardClaimed=!!raw.rewardClaimed&&g.owned.length===p.cells.length;
 for(const c of p.cells){if(seen.has(c.id)){
   const r=raw.nodes?.[c.id];if(r){const left=Math.max(0,Math.min(c.hits,Math.floor(Number(r.left)||0)));g.nodes[c.id]={left,ready:Math.max(0,Number(r.ready)||0),waitDeparture:left===0&&r.waitDeparture!==false};}
  }else if(raw.paid?.[c.id]&&c.neighbors.some(id=>seen.has(id))){g.paid[c.id]={};for(const[k,v]of Object.entries(c.cost))g.paid[c.id][k]=Math.min(v,Math.max(0,Math.floor(Number(raw.paid[c.id][k])||0)));}}
 if(valid(raw.selected)&&!seen.has(raw.selected)&&p.cells[raw.selected].neighbors.some(id=>seen.has(id))){g.selected=raw.selected;if(valid(raw.anchor)&&seen.has(raw.anchor)&&p.cells[raw.selected].neighbors.includes(raw.anchor))g.anchor=raw.anchor;}
 if(Array.isArray(raw.pos)&&raw.pos.length===3&&raw.pos.every(Number.isFinite)&&Math.hypot(...raw.pos)>.1){const pos=norm(raw.pos);if(globeCanStand(g,pos))g.pos=pos;}
 if(Array.isArray(raw.heading)&&raw.heading.length===3&&raw.heading.every(Number.isFinite))g.heading=norm(raw.heading);
 return g;
}
export function cellAt(p,pos,start=p.start){let id=start,best=dot(p.cells[id].p,pos);for(let steps=0;steps<p.cells.length;steps++){let next=id;for(const n of p.cells[id].neighbors){const d=dot(p.cells[n].p,pos);if(d>best+1e-12){next=n;best=d;}}if(next===id)return id;id=next;}return id;}
const ownedCache=new WeakMap();
export function ownedSet(g){let e=ownedCache.get(g);if(!e||e.size!==g.owned.length){e=new Set(g.owned);ownedCache.set(g,e);}return e;}
export function nodeState(g,id){return g.nodes[id]??={left:planet(g.index).cells[id].hits,ready:0,waitDeparture:false};}
export function globeCanStand(g,pos){const p=planet(g.index),id=cellAt(p,pos);if(!ownedSet(g).has(id))return false;for(const n of[id,...p.cells[id].neighbors]){const c=p.cells[n];if(ownedSet(g).has(n)&&c.type&&c.type!=='wheat'&&nodeState(g,n).left>0&&distance(pos,c.node)<.45)return false;}return true;}
export function boundaries(g){const p=planet(g.index),owned=ownedSet(g),ids=new Set();for(const id of g.owned)for(const n of p.cells[id].neighbors)if(!owned.has(n))ids.add(n);return [...ids].map(id=>p.cells[id]);}
export function buildAnchor(g,id){const p=planet(g.index),owned=ownedSet(g);if(g.selected===id&&Number.isInteger(g.anchor)&&owned.has(g.anchor)&&p.cells[id].neighbors.includes(g.anchor))return p.cells[g.anchor].p;const candidate=p.cells[id].neighbors.filter(n=>owned.has(n)).sort((a,b)=>distance(g.pos,p.cells[a].p)-distance(g.pos,p.cells[b].p))[0];return candidate===undefined?null:p.cells[candidate].p;}
export function globeRemaining(g,c){return Object.fromEntries(Object.entries(c.cost).map(([k,v])=>[k,Math.max(0,v-(g.paid[c.id]?.[k]||0))]));}
export function selectLand(g,id){if(!boundaries(g).some(c=>c.id===id))return false;g.selected=null;g.anchor=cellAt(planet(g.index),buildAnchor(g,id));g.selected=id;g.depositClock=0;return true;}
export function globePath(g,target){const p=planet(g.index),owned=ownedSet(g),start=cellAt(p,g.pos),goal=cellAt(p,target);if(!owned.has(goal))return [];const queue=[start],came=new Map([[start,null]]);for(let i=0;i<queue.length&&!came.has(goal);i++)for(const id of p.cells[queue[i]].neighbors)if(owned.has(id)&&!came.has(id)){came.set(id,queue[i]);queue.push(id);}if(!came.has(goal))return [];const path=[];let id=goal;while(id!==start){path.push(p.cells[id].p);id=came.get(id);}path.reverse();path.push(target);return path;}
export function globeTradeSpeed(g){return 1+Math.min(3,Math.floor(g.owned.length/planet(g.index).cells.length*4))*.2;}
export function globeYield(g){return 3+Math.min(3,Math.floor(g.owned.length/planet(g.index).cells.length*4))+(g.blessing?1:0);}
export function globeNearby(g){const p=planet(g.index),anchor=g.selected===null?null:buildAnchor(g,g.selected);if(anchor&&distance(g.pos,anchor)<.68)return {kind:'land',data:p.cells[g.selected],at:anchor};const service=p.services.find(a=>distance(g.pos,a.p)<.9);if(service)return {kind:'service',data:service,at:service.p};let best=null,bd=1.8;const id=cellAt(p,g.pos);for(const n of[id,...p.cells[id].neighbors]){const c=p.cells[n],d=distance(g.pos,c.node);if(ownedSet(g).has(n)&&c.type&&nodeState(g,n).left>0&&d<bd){best=c;bd=d;}}return best?{kind:'node',data:best,at:best.node}:null;}
export function tickGlobe(s,dt,input=[0,0,0]){
 dt=Math.min(.1,Math.max(0,dt));const g=s.frontier,p=planet(g.index),events=[];s.time+=dt;let moved=false;
 let tangent=add(input,mul(g.pos,-dot(input,g.pos))),len=Math.hypot(...tangent);if(len>1e-5){tangent=mul(tangent,Math.min(1,len)/len);for(let i=0;i<3;i++){const next=norm(add(g.pos,mul(tangent,3.7*dt/(LAND_RADIUS*3))));if(globeCanStand(g,next)){g.pos=next;moved=true;}}if(moved)g.heading=norm(tangent);}
 g.idle=moved?0:g.idle+dt;
 // Recovery starts only after leaving gathering range. Never respawn solid props on the explorer.
 for(const id of g.owned){const c=p.cells[id];if(!c.type)continue;const r=nodeState(g,id);if(r.left!==0)continue;if(r.waitDeparture&&distance(g.pos,c.node)>DEPARTURE_RADIUS){r.waitDeparture=false;r.ready=s.time+c.regen;}if(!r.waitDeparture&&s.time>=r.ready&&(c.type==='wheat'||distance(g.pos,c.node)>.93)){r.left=c.hits;events.push({type:'regrow',globe:true,cell:id});}}
 let near=globeNearby(g),working=false;
 if(near?.kind==='land'&&g.idle>.28){const c=near.data,rem=globeRemaining(g,c),k=Object.keys(rem).find(k=>rem[k]>0&&s.bag[k]>0);working=!!k;g.depositClock+=dt;if(g.depositClock>=.065){g.depositClock=0;if(k){s.bag[k]--;s.totalSpent++;g.paid[c.id]??={};g.paid[c.id][k]=(g.paid[c.id][k]||0)+1;events.push({type:'deposit',globe:true,cell:c.id,resource:k});}if(Object.values(globeRemaining(g,c)).every(n=>n===0)){g.owned.push(c.id);g.revision++;g.selected=null;delete g.paid[c.id];events.push({type:'build',globe:true,cell:c.id,key:c.key});const milestone=Math.floor(g.owned.length/p.cells.length*4);if(milestone>g.milestone){g.milestone=milestone;events.push({type:'milestone',globe:true,level:milestone});}near=null;}}}else g.depositClock=0;
 if(near?.kind==='service'&&g.idle>.28){const a=near.data;if(g.serviceId!==a.id){g.serviceId=a.id;g.serviceClock=0;}working=Object.entries(a.cost).every(([k,v])=>s.bag[k]>=v);if(working){g.serviceClock+=dt;if(g.serviceClock>=a.time/globeTradeSpeed(g)){g.serviceClock=0;for(const[k,v]of Object.entries(a.cost)){s.bag[k]-=v;s.totalSpent+=v;}for(const[k,v]of Object.entries(a.reward))s.bag[k]+=v;s.totalTrades++;events.push({type:'service',globe:true,service:a.id,reward:a.reward});}}else g.serviceClock=0;}else{g.serviceClock=0;g.serviceId=null;}
 if(near?.kind==='node'&&!working){const c=near.data;g.harvestClock+=dt;if(g.harvestClock>=.36){g.harvestClock=0;const r=nodeState(g,c.id),amount=globeYield(g);r.left--;s.bag[c.type]+=amount;s.totalGathered+=amount;events.push({type:'harvest',globe:true,cell:c.id,resource:c.type,amount});if(!r.left){r.ready=0;r.waitDeparture=true;events.push({type:'deplete',globe:true,cell:c.id});}}}else g.harvestClock=0;
 return {events,moved,near};
}
export function globeTask(s){const g=s.frontier,p=planet(g.index);if(g.owned.length===p.cells.length)return g.rewardClaimed?{title:'Your guardian is awake!',text:'Keep exploring, or take your guardian to the next planet.',next:true}:{title:'A world is waking…',text:'You placed the final piece. Something is about to happen.',reveal:true};const c=g.selected===null?boundaries(g).sort((a,b)=>distance(g.pos,a.p)-distance(g.pos,b.p))[0]:p.cells[g.selected],rem=globeRemaining(g,c),missing=Object.keys(rem).find(k=>s.bag[k]<rem[k]);if(!missing)return {title:c.key?'Complete a key piece':'Grow the planet',text:c.key?'A golden star marks a small material challenge.':'Tap a frontier cost. Stand on its pad to build.',land:c.id,target:buildAnchor(g,c.id)};
 if(missing==='iron'||missing==='emerald'){
  const a=p.services.find(a=>a.id===(missing==='iron'?'smelt':'cow'));const ingredient=Object.keys(a.cost).find(k=>s.bag[k]<a.cost[k]);if(!ingredient)return {title:missing==='iron'?'Smelt iron':'Feed the cow',text:a.hint,target:a.p};return resourceTask(g,p,ingredient);
 }return resourceTask(g,p,missing);
}
// Shared by GOAL and the legal-action QA planner, including the exhausted-only fallback.
export function gatherGoal(g,type){const p=planet(g.index),cells=g.owned.map(id=>p.cells[id]).filter(c=>c.type===type),nearest=items=>items.sort((a,b)=>distance(g.pos,a.p)-distance(g.pos,b.p))[0];const ready=nearest(cells.filter(c=>nodeState(g,c.id).left>0));if(ready)return {key:`node-${ready.id}`,p:ready.p,cell:ready.id};const cooling=nearest(cells.filter(c=>!nodeState(g,c.id).waitDeparture));if(cooling)return {key:`rest-${cooling.id}`,p:cooling.p,cell:cooling.id,resting:true};const exhausted=nearest(cells);if(!exhausted)return null;const away=nearest(g.owned.map(id=>p.cells[id]).filter(c=>distance(c.p,exhausted.node)>DEPARTURE_RADIUS+.3));return away?{key:`leave-${exhausted.id}-${away.id}`,p:away.p,cell:exhausted.id,departing:true}:null;}
function resourceTask(g,p,type){const goal=gatherGoal(g,type);return {title:goal?.departing?'Try another deposit':`Gather ${RES[type].name.toLowerCase()}`,text:goal?.departing?'Leave the empty spot to let it recover.':goal?.resting?'This deposit is recovering. Collect elsewhere meanwhile.':'Move to another deposit when this one runs out.',target:goal?.p,resource:type};}
