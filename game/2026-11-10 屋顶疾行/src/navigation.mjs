import {insideXZ} from './world.mjs';
import {rayBox2D,distance} from './math.mjs';

const CELL=1.4,R=.31,HEIGHT=1.79,DIRS=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
class Heap{
 constructor(){this.a=[];}
 push(n){const a=this.a;a.push(n);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].f<=n.f)break;a[i]=a[p];i=p;}a[i]=n;}
 pop(){const a=this.a,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=last.f)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
}
export class RoofNavigation{
 constructor(map){
  this.map=map;this.nodes=[];this.cells=new Map();this.buckets=new Map();this.neighborCache=new Map();
  for(const b of map.solids){for(let x=Math.floor((b.minX-.5)/CELL);x<=Math.ceil((b.maxX+.5)/CELL);x++)for(let z=Math.floor((b.minZ-.5)/CELL);z<=Math.ceil((b.maxZ+.5)/CELL);z++){const key=x+','+z;if(!this.buckets.has(key))this.buckets.set(key,[]);this.buckets.get(key).push(b);}}
  const buildings=map.solids.filter(b=>b.kind==='building'),minX=Math.floor(Math.min(...buildings.map(b=>b.minX))/CELL),maxX=Math.ceil(Math.max(...buildings.map(b=>b.maxX))/CELL),minZ=Math.floor(Math.min(...buildings.map(b=>b.minZ))/CELL),maxZ=Math.ceil(Math.max(...buildings.map(b=>b.maxZ))/CELL);
  for(let ix=minX;ix<=maxX;ix++)for(let iz=minZ;iz<=maxZ;iz++){
   const x=ix*CELL,z=iz*CELL,near=this.buckets.get(ix+','+iz)||[],tops=[];
   for(const b of near)if(b.w>.85&&b.d>.85&&b.maxY>20&&!b.noTop&&insideXZ(b,x,z,-R)&&!tops.some(y=>Math.abs(y-b.maxY)<.08)){
    if(!this.clearPoint(x,b.maxY,z,near))continue;tops.push(b.maxY);
    const n={id:this.nodes.length,ix,iz,x,y:b.maxY,z,support:b.id};this.nodes.push(n);const key=ix+','+iz;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(n);
   }
  }
  // Grid samples alone are too far from a 4m rooftop gap. Explicit launch
  // points keep each jump within the slower runners' physical flight range.
  for(const a of map.roofs)for(const b of map.roofs){if(a.id>=b.id)continue;const horizontal=a.z===b.z&&Math.abs(a.x-b.x)===32,vertical=a.x===b.x&&Math.abs(a.z-b.z)===32;if(!horizontal&&!vertical)continue;
   for(const offset of[-5.6,0,5.6])for(const r of[a,b]){const other=r===a?b:a,dx=Math.sign(other.x-r.x),dz=Math.sign(other.z-r.z);const p={x:r.x+dx*13.6+(vertical?offset:0),y:r.y,z:r.z+dz*13.6+(horizontal?offset:0)};if(!this.clearPoint(p.x,p.y,p.z))continue;
    const ix=Math.round(p.x/CELL),iz=Math.round(p.z/CELL),key=ix+','+iz,n={...p,id:this.nodes.length,ix,iz,support:'roof-'+r.id};this.nodes.push(n);if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(n);
   }
  }
 }
 nearby(x,z){return this.buckets.get(Math.round(x/CELL)+','+Math.round(z/CELL))||[];}
 clearPoint(x,y,z,near=this.nearby(x,z)){
  return !near.some(b=>b.maxY>y+.08&&b.minY<y+HEIGHT&&x>b.minX-R&&x<b.maxX+R&&z>b.minZ-R&&z<b.maxZ+R);
 }
 walkClear(a,b){
  const length=distance(a,b),dx=(b.x-a.x)/length,dz=(b.z-a.z)/length;if(!length)return true;
  const unique=new Set([...this.nearby(a.x,a.z),...this.nearby(b.x,b.z)]);
  for(const box of unique){if(box.maxY<=Math.min(a.y,b.y)+.46||box.minY>=Math.max(a.y,b.y)+HEIGHT)continue;const hit=rayBox2D(a.x,a.z,dx,dz,box,R);if(hit&&hit.far>.02&&hit.near<length-.02)return false;}return true;
 }
 jumpClear(a,b){
  const d=distance(a,b);if(d>4.95||b.y-a.y>1.75||a.y-b.y>3.6)return false;
  for(let i=1;i<9;i++){const t=i/9,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=a.y+(b.y-a.y)*t+1.76*Math.sin(t*Math.PI);if(!this.clearPoint(x,y,z))return false;}
  return true;
 }
 neighbors(n){
  if(this.neighborCache.has(n.id))return this.neighborCache.get(n.id);const edges=[];
  for(const [dx,dz]of DIRS){let walked=false;
   for(const next of this.cells.get((n.ix+dx)+','+(n.iz+dz))||[])if(Math.abs(next.y-n.y)<=.43&&this.walkClear(n,next)){edges.push({node:next,jump:false,cost:distance(n,next)+Math.abs(n.y-next.y)});walked=true;}
   if(walked)continue;
   for(let step=2;step<=3;step++)for(const next of this.cells.get((n.ix+dx*step)+','+(n.iz+dz*step))||[])if(this.jumpClear(n,next))edges.push({node:next,jump:true,cost:distance(n,next)*1.15+2+Math.max(0,next.y-n.y)});
  }
  this.neighborCache.set(n.id,edges);return edges;
 }
 nearest(p){const close=this.nodes.map(n=>({n,c:distance(p,n)+Math.abs(p.y-n.y)*2.3})).sort((a,b)=>a.c-b.c).slice(0,24);return close.find(({n})=>Math.abs(n.y-p.y)<.65&&this.walkClear(n,p))?.n||close[0]?.n||null;}
 path(from,to){
  const start=this.nearest(from),goal=this.nearest(to);if(!start||!goal)return[];if(start.id===goal.id)return[{...goal,jump:false}];
  const open=new Heap(),g=new Map([[start.id,0]]),parent=new Map(),closed=new Set();open.push({n:start,f:distance(start,goal)});let visited=0;
  while(open.a.length&&visited++<14000){const {n}=open.pop();if(closed.has(n.id))continue;if(n.id===goal.id){const out=[];let cur=n;while(cur.id!==start.id){const prev=parent.get(cur.id);out.push({...cur,jump:prev.jump});cur=prev.node;}out.push({...start,jump:false});return out.reverse();}closed.add(n.id);
   for(const e of this.neighbors(n)){const cost=g.get(n.id)+e.cost;if(cost>=(g.get(e.node.id)??Infinity))continue;g.set(e.node.id,cost);parent.set(e.node.id,{node:n,jump:e.jump});open.push({n:e.node,f:cost+distance(e.node,goal)+Math.abs(e.node.y-goal.y)});}
  }return[];
 }
}
