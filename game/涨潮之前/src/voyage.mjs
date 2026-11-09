import { RECIPES, DECK, dist, clamp, groundHeight, floorHeight, collides, islandRadius, tide, canAfford, spend, gain, findPath } from './rules.mjs';
import { SALVAGE, SAIL_BOUNDS, WRECK, WRECK_MOORING, wreckFloor } from './voyage-state.mjs';

export function beginDayTwo(s) {
  if (!s.won) return false;
  if (!s.voyage.started) {
    s.voyage.started = true; s.voyage.clock = 0;
    for (const type of ['dock', 'workbench']) if (s.buildings.some(b => b.type === type)) s.voyage.goals[type] = true;
  }
  s.free = true; s.day = Math.max(2, s.day); return true;
}
export function dockLaunch(dock) {
  const a = dock.rotation * Math.PI / 2;
  return { x: dock.x + Math.sin(a) * 3, z: dock.z + Math.cos(a) * 3, angle: a };
}
export function nearestDock(s, p = s.player) {
  return s.buildings.filter(b => b.type === 'dock').sort((a, b) => dist(p, a) - dist(p, b))[0] || null;
}
export function canSail(s, x, z) {
  const bounds = SAIL_BOUNDS;
  if (!s.survival?.started&&(x < bounds.left || x > bounds.right || z < bounds.top || z > bounds.bottom)) return false;
  const water = tide(s).water;
  for (const [dx, dz] of [[0,0],[-.46,0],[.46,0],[0,-.46],[0,.46]]) {
    if (floorHeight(s, x + dx, z + dz) > water - .17) return false;
  }
  return true;
}
export function createBoat(s) {
  if (!s.voyage.started) return { ok: false, message: '先在第一天安家，再开始出海。' };
  if (s.voyage.boat) return { ok: false, message: '小艇已经造好了，去码头上船吧。' };
  const dock = nearestDock(s);
  if (!dock) return { ok: false, message: '先把一格海边地板或栈桥升级为码头。' };
  if (dist(s.player, dock) > 4.5) return { ok: false, message: '走到码头附近，再建造小艇。' };
  const p = dockLaunch(dock);
  if (!canSail(s, p.x, p.z)) return { ok: false, message: '码头前方有浅滩或建筑，换个朝向面向深水。' };
  if (!canAfford(s, RECIPES.boat)) return { ok: false, message: '小艇需要 8 木料、3 纤维。砍树能很快备齐。' };
  spend(s, RECIPES.boat.cost);
  s.voyage.boat = { ...p, aboard: false, vx: 0, vz: 0, dockId: dock.id };
  s.voyage.goals.boat = true;
  return { ok: true, message: '小艇系好了！走近后点小艇，或长按“上船”。' };
}
export function boardBoat(s) {
  const b = s.voyage.boat;
  if (!b || b.aboard || dist(s.player, b) > 3.45) return { ok: false, message: '先走到小艇旁的码头或岸边。' };
  b.aboard = true; b.vx = 0; b.vz = 0; s.player.x = b.x; s.player.z = b.z; s.player.angle = b.angle;
  s.voyage.goals.board = true;
  return { ok: true, mode: 'board', message: '出发！摇杆 / WASD 划船，也可以点击水面。航标指向沉船。' };
}
export function boardingApproach(s) {
  const b=s.voyage.boat;if(!b||b.aboard||!s.survival?.started&&dist(s.player,b)>8)return null;
  const points=[],water=tide(s).water;
  for(let r=1.4;r<=3.3;r+=.3)for(let i=0;i<24;i++){
    const a=i*Math.PI/12,p={x:b.x+Math.sin(a)*r,z:b.z+Math.cos(a)*r};
    if(floorHeight(s,p.x,p.z)>water+.07&&!collides(s,p.x,p.z))points.push(p);
  }
  points.sort((a,c)=>dist(s.player,a)-dist(s.player,c));
  for(const p of points.slice(0,40))if(findPath(s,p).reachable)return p;
  return null;
}
export function landingPoint(s) {
  const b = s.voyage.boat; if (!b?.aboard) return null;
  const water = tide(s).water, points = [];
  for (let r = .8; r <= 3.5; r += .3) for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12, p = { x: b.x + Math.sin(a) * r, z: b.z + Math.cos(a) * r };
    if (floorHeight(s, p.x, p.z) > water + .07 && !collides(s, p.x, p.z)) points.push(p);
  }
  for (const d of s.buildings.filter(v => v.type === 'dock')) if (dist(b,d) < 3.6 && !collides(s,d.x,d.z)) points.push({ x:d.x,z:d.z });
  points.sort((a,c)=>dist(a,b)-dist(c,b));return points[0]||null;
}
export function disembark(s) {
  const p = landingPoint(s); if (!p) return { ok: false, message: '再靠近码头、陆地或沉船甲板，就能下船。' };
  const b=s.voyage.boat;b.aboard=false;b.vx=0;b.vz=0;s.player.x=p.x;s.player.z=p.z;
  if (s.voyage.metalFound >= 4 && (islandRadius(p.x,p.z) < 1.13 || s.buildings.some(d=>d.type==='dock'&&dist(d,p)<1.8))) {
    if (!s.voyage.goals.return) s.voyage.trips++;
    s.voyage.goals.return=true;
  }
  return { ok:true,mode:'land',message:s.survival?.started?'已靠岸。走近小艇可再次出发，也可以在这里采集、扩建。':s.voyage.goals.return?'带着金属回家了。在营地搭一张工作台吧。':'已靠岸。走近小艇，随时可以再次出发。' };
}
export function recallBoat(s) {
  const b=s.voyage.boat,d=nearestDock(s);
  if(!b||!d)return {ok:false,message:'需要小艇和码头，才能召回。'};
  if(b.aboard)return {ok:false,message:'先靠岸下船，再召回小艇。'};
  const p=dockLaunch(d);if(!canSail(s,p.x,p.z))return {ok:false,message:'码头前方被挡住了，先清出一片深水。'};
  Object.assign(b,p,{vx:0,vz:0,dockId:d.id});return {ok:true,message:'小艇已经重新系在码头旁。'};
}
export function moveBoat(s, dx, dz, dt) {
  const b=s.voyage.boat;if(!b?.aboard)return 0;
  const n=Math.hypot(dx,dz),speed=4.9,accel=1-Math.exp(-dt*(n>.05?7:12));
  const wantX=n>.05?dx/Math.max(1,n)*speed:0,wantZ=n>.05?dz/Math.max(1,n)*speed:0;
  b.vx+=(wantX-b.vx)*accel;b.vz+=(wantZ-b.vz)*accel;
  if(n>.05){const target=Math.atan2(dx,dz);b.angle+=Math.atan2(Math.sin(target-b.angle),Math.cos(target-b.angle))*Math.min(1,dt*7);}
  const ox=b.x,oz=b.z,steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vz)*dt/.12));
  for(let i=0;i<steps;i++){
    const nx=b.x+b.vx*dt/steps,nz=b.z+b.vz*dt/steps;
    if(canSail(s,nx,nz)){b.x=nx;b.z=nz;}
    else {if(canSail(s,nx,b.z))b.x=nx;else b.vx=0;if(canSail(s,b.x,nz))b.z=nz;else b.vz=0;}
  }
  const moved=Math.hypot(b.x-ox,b.z-oz);s.voyage.distance+=moved;
  s.player.x=b.x;s.player.z=b.z;s.player.angle=b.angle;return moved;
}
export function findBoatPath(s, goal) {
  const boat=s.voyage.boat;if(!boat)return {points:[],reachable:false};
  const frontier=s.survival?.started,cell=frontier?Math.max(.65,Math.abs(boat.x-goal.x)/70,Math.abs(boat.z-goal.z)/70):.65,
    ox=frontier?Math.min(boat.x,goal.x)-9:-28,oz=frontier?Math.min(boat.z,goal.z)-9:-25,
    width=frontier?Math.ceil((Math.abs(boat.x-goal.x)+18)/cell)+1:83,height=frontier?Math.ceil((Math.abs(boat.z-goal.z)+18)/cell)+1:68;
  const ix=x=>Math.round((x-ox)/cell),iz=z=>Math.round((z-oz)/cell),key=(x,z)=>z*width+x;
  const point=k=>({x:ox+(k%width)*cell,z:oz+Math.floor(k/width)*cell});
  const start=key(ix(boat.x),iz(boat.z)),target={x:goal.x,z:goal.z},open=[start],cost=new Map([[start,0]]),prev=new Map(),visited=new Set();
  let best=start,bestD=dist(boat,target);
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for(let it=0;open.length&&it<5700;it++){
    open.sort((a,b)=>cost.get(a)+dist(point(a),target)-cost.get(b)-dist(point(b),target));
    const at=open.shift();if(visited.has(at))continue;visited.add(at);
    const p=point(at),d=dist(p,target);if(d<bestD){bestD=d;best=at;}if(d<Math.max(.5,cell))break;
    const ax=at%width,az=Math.floor(at/width);
    for(const [dx,dz]of dirs){const nx=ax+dx,nz=az+dz;if(nx<0||nx>=width||nz<0||nz>=height)continue;
      const k=key(nx,nz);if(visited.has(k))continue;const np=point(k);
      if(!canSail(s,np.x,np.z)||!canSail(s,(p.x+np.x)/2,(p.z+np.z)/2))continue;
      const c=cost.get(at)+Math.hypot(dx,dz)*cell;if(c<(cost.get(k)??Infinity)){cost.set(k,c);prev.set(k,at);open.push(k);}
    }
  }
  const points=[];let k=best;while(k!==start&&prev.has(k)){points.push(point(k));k=prev.get(k);}
  return {points:points.reverse(),reachable:bestD<Math.max(1,cell*1.4)};
}
export function salvageReady(s,p) { return (s.voyage.readyAt[p.id]||0)<=s.elapsed; }
export function salvage(s,id) {
  const p=SALVAGE.find(p=>p.id===id);
  if(!s.voyage.started||!p||dist(s.player,p)>3.15)return {ok:false,message:'再靠近一点，才能打捞。'};
  if(!s.voyage.boat?.aboard&&wreckFloor(s.player.x,s.player.z)<.5)return {ok:false,message:'乘小艇靠近物资，或登上沉船甲板。'};
  if(!salvageReady(s,p))return {ok:false,message:'这一批已经打捞过，附近的漂流物稍后会补充。'};
  if(p.lowOnly&&tide(s).water>.24)return {ok:false,message:'船舱进水了。先打捞外围物资，低潮时再来。'};
  gain(s,p.cost);s.voyage.metalFound+=p.cost.metal;s.stats.gathered+=Object.values(p.cost).reduce((a,v)=>a+v,0);
  if(!s.voyage.salvaged.includes(id))s.voyage.salvaged.push(id);
  s.voyage.readyAt[id]=s.elapsed+55;
  if(p.lowOnly)s.voyage.lamp=true;
  if(s.voyage.metalFound>=4)s.voyage.goals.salvage=true;
  return {ok:true,amounts:p.cost,message:p.lowOnly?'船舱里找到了金属和一盏旧船灯！工作台会挂起这盏灯。':'打捞到了金属零件。带回营地，能做新的远行装备。'};
}
export function craftWarmer(s) {
  if(s.voyage.warmer)return {ok:false,message:'便携暖包已经装备。营火旁可以补充。'};
  const bench=s.buildings.find(b=>b.type==='workbench'&&dist(s.player,b)<3.2);
  if(!bench||s.voyage.boat?.aboard)return {ok:false,message:'先到工作台旁边，再制作便携暖包。'};
  if(!canAfford(s,RECIPES.warmer))return {ok:false,message:'便携暖包需要 4 纤维、1 金属。'};
  spend(s,RECIPES.warmer.cost);s.voyage.warmer=true;s.voyage.charges=3;s.voyage.goals.warmer=true;
  return {ok:true,message:'暖包装好了！点“取暖”或按 F，远行时恢复 40 温暖，共 3 次。'};
}
export function useWarmer(s) {
  const v=s.voyage;
  if(!v.warmer)return {ok:false,message:'在工作台制作便携暖包后，就能随身取暖。'};
  if(v.charges<=0)return {ok:false,message:'暖包用完了。回营火旁花 1 木料补满。'};
  if(v.warmCooldown>0)return {ok:false,message:'暖包还热着，稍等片刻再用。'};
  if(s.warmth>=98)return {ok:false,message:'现在很暖和，留到出海后再用吧。'};
  v.charges--;v.warmCooldown=6;s.warmth=clamp(s.warmth+40,0,100);
  return {ok:true,message:`暖意回来了。剩余 ${v.charges} 次便携取暖。`};
}
export function advanceVoyage(s,dt) {
  const v=s.voyage;if(!v.started)return [];
  v.clock+=dt;v.warmCooldown=Math.max(0,v.warmCooldown-dt);
  if(!v.boat?.aboard&&v.metalFound>=4&&islandRadius(s.player.x,s.player.z)<1.05){if(!v.goals.return)v.trips++;v.goals.return=true;}
  if(s.warmth>0&&v.goals.board&&v.goals.return&&s.buildings.some(b=>b.type==='workbench')&&v.warmer&&!v.completed){v.completed=true;return ['voyage-win'];}
  return [];
}
export const VOYAGE_GOALS=[
  ['dock','把栈桥变成码头','保留原来的栈桥，挑一格朝深水升级为系船码头。'],
  ['boat','造一艘双桨小艇','备好 8 木料、3 纤维，到码头旁把小艇造出来。'],
  ['board','第一次离开小岛','走近小艇，点击它或长按“上船”。'],
  ['salvage','向沉船借一点新材料','外围物资随时可捞；带回至少 4 份金属零件。'],
  ['return','带着发现，回家','驶回自己的码头，靠岸下船，营地还在等你。'],
  ['workbench','让远方改变营地','用金属零件，在营地搭一张打捞工作台。'],
  ['warmer','把营火的暖意带出门','站到工作台旁，制作有 3 次储热的便携暖包。'],
];
export function voyageMission(s) {
  const i=VOYAGE_GOALS.findIndex(([key])=>!s.voyage.goals[key]);
  return i<0?{index:7,chapter:2,total:7,title:'带着暖意，继续探索',desc:'低潮船舱还有一盏旧灯。暖包用完，可以回营火旁补充。'}:
    {index:i,chapter:2,total:7,title:VOYAGE_GOALS[i][1],desc:VOYAGE_GOALS[i][2]};
}
export function nearbyVoyage(s) {
  if(!s.voyage.started)return [];
  const out=[],b=s.voyage.boat;
  if(b?.aboard){
    for(const p of SALVAGE)if(dist(s.player,p)<3.15&&salvageReady(s,p))out.push({...p,id:`salvage:${p.id}`,kind:'salvage',type:'salvage',name:p.name,hint:p.lowOnly&&tide(s).water>.24?'船舱进水 · 低潮再来':'长按 E / 打捞 · '+(p.lowOnly?'金属 + 旧船灯':'金属零件'),action:'打捞'});
    if(!out.length&&landingPoint(s))out.push({x:b.x,z:b.z,id:'landing',kind:'landing',type:'landing',name:'可以靠岸',hint:'长按 E / 下船 · 保留小艇停泊位置',action:'下船'});
  }else{
    if(b&&dist(s.player,b)<3.45)out.push({...b,id:'boat',kind:'boat',type:'boat',name:'双桨小艇',hint:'长按 E / 上船 · 摇杆或点击水面划行',action:'上船'});
    if(wreckFloor(s.player.x,s.player.z)>.5)for(const p of SALVAGE)if(dist(s.player,p)<3.15&&salvageReady(s,p))out.push({...p,id:`salvage:${p.id}`,kind:'salvage',type:'salvage',name:p.name,hint:p.lowOnly&&tide(s).water>.24?'船舱进水 · 低潮再来':'长按 E / 打捞',action:'打捞'});
    if(!s.voyage.warmer)for(const bench of s.buildings)if(bench.type==='workbench'&&dist(s.player,bench)<2.4)out.push({...bench,id:`bench:${bench.id}`,kind:'craftWarmer',name:'打捞工作台',hint:'长按制作暖包 · 4 纤维 + 1 金属',action:'制作'});
  }
  return out;
}
export function interactVoyage(s,item) {
  if(item.kind==='boat')return boardBoat(s);
  if(item.kind==='landing')return disembark(s);
  if(item.kind==='salvage')return salvage(s,item.id.split(':')[1]);
  if(item.kind==='craftWarmer')return craftWarmer(s);
  return {ok:false,message:'靠近目标，再进行操作。'};
}
export function voyageTarget(s) {
  const m=voyageMission(s),dock=nearestDock(s);
  if(m.index===0){const bridges=s.buildings.filter(b=>b.type==='bridge');return bridges.sort((a,b)=>groundHeight(a.x,a.z)-groundHeight(b.x,b.z))[0]||{x:6.6,z:-2.2};}
  if(m.index<=2)return dock||{x:6.6,z:-2.2};
  if(m.index===3||m.index>=7)return WRECK_MOORING;
  if(m.index===4)return dock?dockLaunch(dock):{x:8.8,z:2};
  if(m.index===5)return s.buildings.find(b=>b.type==='cabin')||{x:-2.2,z:2.2};
  return s.buildings.find(b=>b.type==='workbench')||{x:-2.2,z:2.2};
}
