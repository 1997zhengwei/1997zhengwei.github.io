import {TILE,RES,START,SITES,NODES,SERVICES,tilesFor,availableSites,xy,hexAt,orderedTiles,landCount,TREASURE_AT} from './world.mjs';
export {TILE,RES,START,SITES,NODES,SERVICES,tilesFor,availableSites,xy,hexAt,orderedTiles,landCount,TREASURE_AT};
import {restoreFrontier,startPlanetGame} from './globe.mjs';
export const VERSION=4;
export function createPlanetState(){return startPlanetGame(createState());}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createState(){return {version:VERSION,time:0,player:{x:.1,z:1.35,angle:0},bag:Object.fromEntries(Object.keys(RES).map(r=>[r,0])),done:[],paid:{},tier:1,nodes:Object.fromEntries(NODES.map(n=>[n.id,{left:n.hits,ready:0}])),harvestClock:0,depositClock:0,serviceClock:0,serviceId:null,idle:0,totalGathered:0,totalSpent:0,totalTrades:0,terrainVersion:0,treasure:false,won:false,muted:false,frontier:null};}
export function restore(raw) {
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!v || ![1,2,3,VERSION].includes(v.version)) return createState();
    const s = createState();
    // Rebuild the dependency closure instead of accepting impossible unlocks.
    for (let pass = 0; pass < SITES.length; pass++) {
      for (const site of SITES) {
        if (v.done?.includes(site.id) && !s.done.includes(site.id) && site.needs.every(id => s.done.includes(id))) s.done.push(site.id);
      }
    }
    s.tier = s.done.includes('iron-tools') ? 3 : s.done.includes('stone-tools') ? 2 : 1;
    for (const k in RES) s.bag[k] = Math.min(1e6, Math.max(0, Math.floor(Number(v.bag?.[k]) || 0)));
    for (const site of SITES) {
      s.paid[site.id] = {};
      for (const k in site.cost) s.paid[site.id][k] = Math.min(site.cost[k], Math.max(0, Math.floor(Number(v.paid?.[site.id]?.[k]) || 0)));
    }
    s.time = Math.max(0, Number(v.time) || 0);
    for (const n of NODES) {
      const r = v.nodes?.[n.id];
      if (r) s.nodes[n.id] = {left: Math.min(n.hits, Math.max(0, Number(r.left) || 0)), ready: Math.max(0, Number(r.ready) || 0)};
    }
    s.treasure = !!v.treasure && s.done.includes('vault');
    s.won = s.done.includes('portal');
    s.mode = v.mode==='planet'?'planet':'island';
    s.frontier = restoreFrontier(v.frontier,s.won||s.mode==='planet');
    s.starCount = Math.min(s.frontier?.index||0,Math.max(0,Math.floor(Number(v.starCount)||0)));
    if(s.frontier){s.frontier.blessing=s.starCount>0?1:0;if(!s.starCount)s.frontier.rewardClaimed=false;}
    if(s.mode==='planet')s.tier=3;
    s.muted = !!v.muted;
    for (const k of ['totalGathered', 'totalSpent', 'totalTrades']) s[k] = Math.max(0, Number(v[k]) || 0);
    let position=v.player;
    if(v.version===1&&v.player){
      let q=v.player.x/TILE,r=v.player.z/TILE;
      if(q>=11.5&&r< -1.5){q-=15;r+=8;}
      else if(q>=11.5){q-=12;r+=4;}
      else if(q>=9.5){q-=7;r+=4;}
      else if(q>=6.5){q-=2;r+=3;}
      position=xy([q,r]);
    }
    if (Number.isFinite(position?.x) && Number.isFinite(position?.z) && canStand(s, position.x, position.z)) s.player = {x:position.x,z:position.z,angle:Number(v.player.angle)||0};
    return s;
  } catch { return createState(); }
}
export function remaining(s,site){return Object.fromEntries(Object.entries(site.cost).map(([k,v])=>[k,Math.max(0,v-(s.paid[site.id]?.[k]||0))]));}
export function activeNodes(s){return NODES.filter(n=>!n.from||s.done.includes(n.from)||(SITES.find(p=>p.id===n.from)?.tiles&&onGround(s,xy(n.at).x,xy(n.at).z,.05)));}
export function nodeReady(s,n){return s.nodes[n.id].left>0;}
const groundCache=new WeakMap();
export function onGround(s,x,z,radius=.21){
  let cached=groundCache.get(s);
  if(!cached||cached.version!==s.terrainVersion||cached.count!==s.done.length){cached={version:s.terrainVersion,count:s.done.length,map:new Set(tilesFor(s.done,s.paid).map(t=>t.at.join(',')))};groundCache.set(s,cached);}
  const probes=[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius],[radius*.7,radius*.7],[-radius*.7,-radius*.7],[radius*.7,-radius*.7],[-radius*.7,radius*.7]];
  return probes.every(([dx,dz])=>cached.map.has(hexAt(x+dx,z+dz).join(',')));
}
export function canStand(s,x,z){
  if(!onGround(s,x,z))return false;
  for(const n of activeNodes(s)){if(n.type==='wheat'||!nodeReady(s,n))continue;const at=xy(n.at);if(Math.hypot(x-at.x,z-at.z)<(n.type==='wood'?.62:.67))return false;}
  const solids=[];
  const arrival=xy([.65,-.6]);for(const dx of[-.31,.31])solids.push({x:arrival.x+dx,z:arrival.z,dz:0,r:.22});
  if(s.done.includes('meadow'))solids.push({...xy([3,1]),dz:-2.05,r:.8});
  if(s.done.includes('furnace'))solids.push({...xy(SERVICES.find(p=>p.id==='smelt').at),dz:-2.05,r:.85});
  if(s.done.includes('ruins'))for(const dx of[-.98,.98])solids.push({x:xy(SITES.find(p=>p.id==='portal').at).x+dx,z:xy(SITES.find(p=>p.id==='portal').at).z,dz:-2.05,r:.52});
  return !solids.some(p=>Math.hypot(x-p.x,z-p.z-p.dz)<p.r);
}
export function move(s,dx,dz,dt){const len=Math.hypot(dx,dz);if(!len)return false;const speed=3.7;const vx=dx/Math.max(1,len)*speed*dt,vz=dz/Math.max(1,len)*speed*dt;let moved=false;for(let j=0;j<3;j++){if(canStand(s,s.player.x+vx/3,s.player.z)){s.player.x+=vx/3;moved=true;}if(canStand(s,s.player.x,s.player.z+vz/3)){s.player.z+=vz/3;moved=true;}}if(moved)s.player.angle=Math.atan2(dx,dz);return moved;}
export function nearestNode(s){return activeNodes(s).filter(n=>nodeReady(s,n)&&dist(s.player,xy(n.at))<1.75).sort((a,b)=>dist(s.player,xy(a.at))-dist(s.player,xy(b.at)))[0];}
export function nearby(s){const site=availableSites(s).filter(p=>Math.abs(s.player.x-xy(p.at).x)<.72&&Math.abs(s.player.z-xy(p.at).z)<.66).sort((a,b)=>dist(s.player,xy(a.at))-dist(s.player,xy(b.at)))[0];if(site)return {kind:'site',data:site};const service=SERVICES.find(p=>s.done.includes(p.from)&&dist(s.player,xy(p.at))<1.2);if(service)return {kind:'service',data:service};const node=nearestNode(s);if(node)return {kind:'node',data:node};return null;}
export function tick(s,dt,input={x:0,z:0}){dt=Math.min(.1,Math.max(0,dt));const events=[];s.time+=dt;const moved=move(s,input.x||0,input.z||0,dt);s.idle=moved?0:s.idle+dt;
 for(const n of activeNodes(s)){const r=s.nodes[n.id];if(r.left===0&&s.time>=r.ready&&(n.type==='wheat'||dist(s.player,xy(n.at))>.93)){r.left=n.hits;events.push({type:'regrow',node:n.id});}}
 const near=nearby(s);
 if(near?.kind==='site'&&s.idle>.28){s.depositClock+=dt;if(s.depositClock>=.065){s.depositClock=0;const site=near.data;const rem=remaining(s,site);const k=Object.keys(rem).find(k=>rem[k]>0&&s.bag[k]>0);if(k){s.bag[k]--;s.totalSpent++;s.paid[site.id]??={};s.paid[site.id][k]=(s.paid[site.id][k]||0)+1;s.terrainVersion++;events.push({type:'deposit',site:site.id,resource:k});}if(Object.values(remaining(s,site)).every(v=>v===0)){s.done.push(site.id);if(site.tier)s.tier=site.tier;if(site.id==='portal'){s.won=true;events.push({type:'win'});}events.push({type:'build',site:site.id});}}}else s.depositClock=0;
 if(near?.kind==='service'&&s.idle>.28){const a=near.data;if(s.serviceId!==a.id){s.serviceClock=0;s.serviceId=a.id;}if(Object.entries(a.cost).every(([k,v])=>s.bag[k]>=v)){s.serviceClock+=dt;if(s.serviceClock>=a.time){s.serviceClock=0;for(const [k,v]of Object.entries(a.cost)){s.bag[k]-=v;s.totalSpent+=v;}for(const [k,v]of Object.entries(a.reward))s.bag[k]+=v;s.totalTrades++;events.push({type:'service',service:a.id,reward:a.reward});}}else s.serviceClock=0;}else {s.serviceClock=0;s.serviceId=null;}
 const working=near?.kind==='site'?Object.entries(remaining(s,near.data)).some(([k,v])=>v>0&&s.bag[k]>0):near?.kind==='service'&&Object.entries(near.data.cost).every(([k,v])=>s.bag[k]>=v);
 const n=nearestNode(s);if(n&&s.tier>=n.tier&&!(working&&s.idle>.28)){s.harvestClock+=dt;if(s.harvestClock>=.47-(s.tier-1)*.055){s.harvestClock=0;const r=s.nodes[n.id];r.left--;const amount=s.tier;s.bag[n.type]+=amount;s.totalGathered+=amount;events.push({type:'harvest',node:n.id,resource:n.type,amount});s.player.angle=Math.atan2(xy(n.at).x-s.player.x,xy(n.at).z-s.player.z);if(r.left===0){r.ready=s.time+n.regen;events.push({type:'deplete',node:n.id});}}}else s.harvestClock=0;
 if(!s.treasure&&s.done.includes('vault')&&dist(s.player,xy(TREASURE_AT))<1.4){s.treasure=true;s.bag.emerald+=6;events.push({type:'treasure'});}
 return {events,moved,near};}
// Grid pathing uses the same ground and solid-resource collision as free movement.
export function findPath(s,target){const step=.55;const key=(x,z)=>`${x},${z}`;const start=[Math.round(s.player.x/step),Math.round(s.player.z/step)];let goal=[Math.round(target.x/step),Math.round(target.z/step)];if(!canStand(s,goal[0]*step,goal[1]*step)){let best=null,bd=Infinity;for(let dz=-4;dz<=4;dz++)for(let dx=-4;dx<=4;dx++){const x=goal[0]+dx,z=goal[1]+dz,d=dx*dx+dz*dz;if(d<bd&&canStand(s,x*step,z*step)){bd=d;best=[x,z];}}if(!best)return [];goal=best;}
 const open=[start],came=new Map([[key(...start),null]]);let found=false;for(let i=0;i<open.length&&i<18000;i++){const [x,z]=open[i];if(x===goal[0]&&z===goal[1]){found=true;break;}for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(came.has(k)||!canStand(s,nx*step,nz*step))continue;if(dx&&dz&&(!canStand(s,(x+dx)*step,z*step)||!canStand(s,x*step,(z+dz)*step)))continue;came.set(k,[x,z]);open.push([nx,nz]);}}
 if(!found)return [];const path=[];let p=goal;while(p){path.push({x:p[0]*step,z:p[1]*step});p=came.get(key(...p));}path.reverse();return path.slice(1);}
export function task(s){if(s.won)return {title:'Expand the whole planet',text:'Tap EXPAND PLANET to enter the 642-tile global frontier.',target:null};let id=!s.done.includes('meadow')?'meadow':!s.done.includes('stone-tools')?'stone-tools':!s.done.includes('bridge')?'bridge':!s.done.includes('quarry')?'quarry':!s.done.includes('furnace')?'furnace':!s.done.includes('iron-tools')?'iron-tools':!s.done.includes('ridge')?'ridge':!s.done.includes('ruins')?'ruins':'portal';const site=SITES.find(p=>p.id===id);const rem=remaining(s,site);const missing=Object.keys(rem).find(k=>s.bag[k]<rem[k]);if(!missing)return {title:site.verb,text:'Stand in its glowing pad to deliver materials.',target:xy(site.at),site:id};if(missing==='iron'){const oreNeed=2*Math.ceil(rem.iron-s.bag.iron);if(s.bag.ore<oreNeed){const n=NODES.find(n=>n.type==='ore');return {title:'Mine iron ore',text:'Stone tools break the copper-flecked rocks.',target:xy(n.at),site:id,resource:'ore'};}if(s.bag.wood<Math.ceil(rem.iron-s.bag.iron))return {title:'Gather fuel',text:'The furnace needs 1 Wood for each Iron.',target:xy([2.1,.4]),resource:'wood',site:id};return {title:'Smelt iron',text:'Stand at the furnace: 2 Ore + 1 Wood → 1 Iron.',target:xy(SERVICES.find(p=>p.id==='smelt').at),site:id,resource:'iron'};}
 if(missing==='emerald')return {title:'Trade for emeralds',text:'Villager: 6 Wood + 6 Stone → 1 Emerald. Or feed cows!',target:xy(SERVICES.find(p=>p.id==='trade').at),site:id,resource:'emerald'};
 const candidates=activeNodes(s).filter(n=>n.type===missing);const n=candidates.sort((a,b)=>dist(s.player,xy(a.at))-dist(s.player,xy(b.at)))[0];return {title:`Gather ${RES[missing].name.toLowerCase()}`,text:s.totalGathered===0?'Move close to the tree. Your axe works automatically.':`${site.name} needs ${Object.entries(rem).filter(([,v])=>v>0).map(([k,v])=>`${v} ${RES[k].name}`).join(' + ')}.`,target:n?xy(n.at):xy(site.at),site:id,resource:missing};}

