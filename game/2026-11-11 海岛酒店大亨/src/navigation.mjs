import {VILLAS} from './progression.mjs';
import {ROOMS} from './config.mjs';
export const STEP=.6;
export function obstacles(s){
 const rects=[{x:0,z:10.1,w:4.4,d:1.15},{x:-10.7,z:12.5,w:1.5,d:4},{x:7.8,z:11.45,w:1.8,d:1.5},{x:10.4,z:11.45,w:1.8,d:1.5},{x:9,z:13.2,w:1.4,d:1.4}];
 for(const side of [-1,1])rects.push({x:side*8.65,z:15.7,w:8.2,d:.28},{x:side*12.92,z:12.8,w:.27,d:5.6});
 for(const def of [...ROOMS,...(s.estate?.villa?VILLAS:[])]){
  const r=s.rooms.find(r=>r.id===def.id),side=Math.sign(def.x);
  if(!r?.built){rects.push({x:def.x,z:def.z,w:8.9,d:7.6});continue;}
  rects.push({x:def.x,z:def.z-3.65,w:9,d:.22},{x:def.x,z:def.z+3.65,w:9,d:.22},{x:side*12.45,z:def.z,w:.22,d:7.3});
  rects.push({x:side*3.55,z:def.z-1.95,w:.22,d:3.4},{x:side*3.55,z:def.z+2.9,w:.22,d:1.5},{x:def.x,z:def.z-.9,w:3.8,d:3.8},{x:def.x+side*3.52,z:def.z+1.8,w:1.05,d:1.7},{x:def.x-2.6,z:def.z-2.2,w:.7,d:.75},{x:def.x+2.6,z:def.z-2.2,w:.7,d:.75});
  if(r.tier>=2)rects.push({x:def.x-side*3.2,z:def.z-.2,w:1.12,d:.9});
 }
 if(s.estate?.villa)rects.push({x:-10.8,z:-38.5,w:1.4,d:2.2});
 if(s.owned.pool)rects.push({x:20,z:-6.8,w:7.8,d:7.8},{x:17,z:-.7,w:1.6,d:1.4});
 if(s.owned.cafe)rects.push({x:-20,z:1,w:6.4,d:1.15});
 return rects;
}
export function walkable(s,x,z,r=.25){
 const floor=(x>=-12.9&&x<=12.9&&z>=-20.6&&z<=15.9)||(s.owned.pool&&x>=12&&x<=27&&z>=-12&&z<=10)||(s.owned.cafe&&x>=-27&&x<=-12&&z>=-9&&z<=10)||(s.estate?.villa&&((x>=-2.35&&x<=2.35&&z>=-38&&z<=-20)||(x>=-12.9&&x<=12.9&&z>=-59&&z<=-36.8))); 
 if(!floor)return false;
 return !obstacles(s).some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);
}
export function findPath(s,from,to){
 if(!to||!Number.isFinite(to.x)||!Number.isFinite(to.z))return [];
 const round=p=>({x:Math.round(p.x/STEP),z:Math.round(p.z/STEP)}),key=p=>`${p.x},${p.z}`;
 const valid=p=>walkable(s,p.x*STEP,p.z*STEP,.27);
 function nearest(p){if(valid(p))return p;for(let radius=1;radius<=10;radius++){let best=null,dist=Infinity;for(let x=-radius;x<=radius;x++)for(let z=-radius;z<=radius;z++){if(Math.abs(x)!==radius&&Math.abs(z)!==radius)continue;const n={x:p.x+x,z:p.z+z};if(valid(n)&&x*x+z*z<dist){best=n;dist=x*x+z*z;}}if(best)return best;}return null;}
 const start=nearest(round(from)),goal=nearest(round(to));if(!start||!goal)return [];
 const endKey=key(goal),open=[{...start,g:0,f:0}],scores=new Map([[key(start),0]]),parents=new Map(),closed=new Set();
 const heuristic=p=>Math.hypot(p.x-goal.x,p.z-goal.z);
 let end=null;
 for(let loops=0;open.length&&loops<14000;loops++){
  let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;
  const cur=open.splice(bi,1)[0],ck=key(cur);if(closed.has(ck))continue;if(ck===endKey){end=cur;break;}closed.add(ck);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
   const n={x:cur.x+dx,z:cur.z+dz},nk=key(n);if(closed.has(nk)||!valid(n))continue;
   if(dx&&dz&&(!valid({x:cur.x+dx,z:cur.z})||!valid({x:cur.x,z:cur.z+dz})))continue;
   const g=cur.g+Math.hypot(dx,dz);if(g>=(scores.get(nk)??Infinity))continue;
   scores.set(nk,g);parents.set(nk,ck);open.push({...n,g,f:g+heuristic(n)});
  }
 }
 if(!end)return [];
 const path=[];let k=endKey;while(k&&k!==key(start)){const [x,z]=k.split(',').map(Number);path.push({x:x*STEP,z:z*STEP});k=parents.get(k);}path.reverse();
 if(walkable(s,to.x,to.z,.27))path.push({x:to.x,z:to.z});return path;
}
export function moveActor(s,a,dt,speed){
 if(!a.path?.length){a.moving=false;return;}
 let budget=dt*speed;a.moving=false;
 while(budget>0&&a.path.length){const p=a.path[0],dx=p.x-a.x,dz=p.z-a.z,d=Math.hypot(dx,dz);if(d<.035){a.path.shift();continue;}const step=Math.min(d,budget);a.x+=dx/d*step;a.z+=dz/d*step;a.angle=Math.atan2(dx,dz);a.moving=true;budget-=step;if(step>=d)a.path.shift();}
}
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
