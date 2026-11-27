import {SPECIES} from './data.mjs';
import {SHORE} from './shore.mjs';
export function walkable(x,z,layout=SPECIES,end=34){
 if(z<SHORE.rampStart){if(Math.abs(x)>24||z< -39)return false;}
 else if(z<2){if(Math.abs(x)>SHORE.halfLane)return false;}
 else if(Math.abs(x)>16||z>end)return false;
 if(z>12&&z<23)for(const px of [-3.2,3.2])for(const pz of [13.5,17.5,21.5])if(Math.hypot(x-px,z-pz)<.4)return false;
 if(z>2)for(const s of layout.byRow?(layout.byRow.get(Math.floor(z/12))||[]):layout)if(Math.hypot(x-s.x,z-s.z)<s.r+.6)return false;
 return true;
}
export function moveSlide(actor,dx,dz,layout=SPECIES,end=34){
 const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.22));
 for(let i=0;i<n;i++){if(walkable(actor.x+dx/n,actor.z+dz/n,layout,end)){actor.x+=dx/n;actor.z+=dz/n;}else{if(walkable(actor.x+dx/n,actor.z,layout,end))actor.x+=dx/n;if(walkable(actor.x,actor.z+dz/n,layout,end))actor.z+=dz/n;}}
}
const key=(x,z)=>x+','+z;
export function findPath(start,end,layout=SPECIES,bound=34){
 // Long galleries route through their unobstructed central aisle in short sections.
 if(Math.abs(start.z-end.z)>28){const step=end.z>start.z?20:-20,points=[{x:0,z:start.z}];for(let z=start.z+step;step>0?z<end.z:z>end.z;z+=step)points.push({x:0,z});points.push({x:0,z:end.z},end);let from=start,path=[];for(const point of points){if(Math.hypot(from.x-point.x,from.z-point.z)<.1)continue;const section=localPath(from,point,layout,bound);if(!section.length)return [];path.push(...section);from=point;}return path;}
 return localPath(start,end,layout,bound);
}
function localPath(start,end,layout,bound){
 const sx=Math.round(start.x),sz=Math.round(start.z),ex=Math.round(end.x),ez=Math.round(end.z);
 if(!walkable(ex,ez,layout,bound))return [];
 const open=[{x:sx,z:sz,g:0,f:0}],best=new Map([[key(sx,sz),0]]),parents=new Map();let reached=null,steps=0;
 while(open.length&&steps++<6000){let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;const cur=open.splice(bi,1)[0];if(cur.x===ex&&cur.z===ez){reached=cur;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=cur.x+dx,z=cur.z+dz;if(!walkable(x,z,layout,bound)||!walkable(cur.x+dx,cur.z,layout,bound)||!walkable(cur.x,cur.z+dz,layout,bound)||!walkable(cur.x+dx*.5,cur.z+dz*.5,layout,bound))continue;const g=cur.g+(dx&&dz?1.414:1),k=key(x,z);if((best.get(k)??Infinity)<=g)continue;best.set(k,g);parents.set(k,key(cur.x,cur.z));open.push({x,z,g,f:g+Math.hypot(ex-x,ez-z)});}
 }
 if(!reached)return [];const path=[];let k=key(ex,ez);while(k!==key(sx,sz)){const [x,z]=k.split(',').map(Number);path.push({x,z});k=parents.get(k);if(!k)return [];}path.reverse();path.push({x:end.x,z:end.z});return path;
}
export function followPath(actor,dt,speed,layout=SPECIES,bound=34){if(!actor.path?.length){actor.moving=false;return true;}let remaining=dt*speed;actor.moving=true;
 while(actor.path.length&&remaining>0){const p=actor.path[0],dx=p.x-actor.x,dz=p.z-actor.z,d=Math.hypot(dx,dz);if(d<.05){actor.path.shift();continue;}actor.heading=Math.atan2(-dx,-dz);const n=Math.min(d,remaining);moveSlide(actor,dx/d*n,dz/d*n,layout,bound);remaining-=n;if(d<=n+.02&&Math.hypot(actor.x-p.x,actor.z-p.z)<.08)actor.path.shift();}
 return actor.path.length===0;
}
