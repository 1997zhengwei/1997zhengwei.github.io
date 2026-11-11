import {productsFor,needsWheat,WHEAT,checkoutCount,TILLS} from './config.mjs';
export function rightWallSegments(s){const back=s.expansions.north?-15:-5,gaps=[];if(s.expansions.warehouse)gaps.push([-7,-3]);if(s.goods.flower?.unlocked)gaps.push([6.7,10.5]);let start=back;const out=[];for(const [a,b]of gaps){if(a>start)out.push([(start+a)/2,a-start]);start=Math.max(start,b);}if(start<16)out.push([(start+16)/2,16-start]);return out;}
export function obstacles(s){
 const PRODUCTS=productsFor(s);
 const r=[];for(const [id,p] of Object.entries(PRODUCTS)){if(!s.goods[id].unlocked){if(p.shelf[1]>(s.expansions.north?-15:-5)+1)r.push({x:p.shelf[0],z:p.shelf[1],w:3,d:3.3});continue;}r.push({x:p.shelf[0],z:p.shelf[1],w:2.8,d:3});if(p.ingredient)r.push({x:p.source[0],z:p.source[1],w:3,d:3});else r.push({x:p.source[0],z:p.source[1],w:7,d:id==='milk'?5:4.5});}
 if(s.goods.bread.unlocked&&needsWheat(s))r.push({x:WHEAT.source[0],z:WHEAT.source[1],w:7,d:3.6});
 for(const [z,d]of [[14,4],[11.4,1.2],[3.5,3],[-3.7,2.3]])r.push({x:-2,z,w:.24,d});
 if(s.expansions.warehouse){r.push({x:24,z:2.7,w:3.9,d:7.3});for(let x=0;x<3;x++)for(let z=0;z<2;z++)r.push({x:21+x*2.5,z:-11+z*3,w:1.8,d:1.8});}
 if(s.expansions.warehouse&&s.storageLevel)r.push({x:21,z:-5,w:1.8,d:1.8});
 for(const [z,d]of rightWallSegments(s))r.push({x:18.4,z,w:.24,d});
 if((s.stars||1)>=3)r.push({x:16.4,z:18.3,w:2.5,d:1});if((s.stars||1)>=5)r.push({x:22.2,z:19,w:1.5,d:1.5});
 for(let i=0;i<checkoutCount(s);i++)r.push({x:TILLS[i].customer[0],z:12,w:4.6,d:1.35});if(s.manager?.level)r.push({x:.4,z:13.2,w:1.2,d:1.1});return r;
}
export class Navigation{
 constructor(s){this.cell=.65;this.refresh(s);}
 refresh(s){this.s=s;this.boxes=obstacles(s);this.minX=-17.5;this.maxX=s.goods.flower?.unlocked?30:s.expansions.warehouse?28:18;this.minZ=s.expansions.north?-28.8:-14.2;this.maxZ=22;this.cols=Math.floor((this.maxX-this.minX)/this.cell)+1;this.rows=Math.floor((this.maxZ-this.minZ)/this.cell)+1;}
 free(x,z,r=.32){return x>=this.minX+r&&x<=this.maxX-r&&z>=this.minZ+r&&z<=this.maxZ-r&&(this.s.expansions.north||x<-2.5||z>-4.3)&&!this.boxes.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);}
 nearest(x,z){let best=null,dist=Infinity;for(let row=0;row<this.rows;row++)for(let col=0;col<this.cols;col++){const px=this.minX+col*this.cell,pz=this.minZ+row*this.cell;if(!this.free(px,pz))continue;const d=(x-px)**2+(z-pz)**2;if(d<dist){dist=d;best=[px,pz,col,row];}}return best;}
 path(from,to){
 const a=this.nearest(...from),b=this.nearest(...to);if(!a||!b)return [];
 const n=this.cols*this.rows,g=new Float64Array(n).fill(Infinity),prev=new Int32Array(n).fill(-1),closed=new Uint8Array(n),start=a[3]*this.cols+a[2],goal=b[3]*this.cols+b[2],open=[start];g[start]=0;
 const heuristic=i=>Math.hypot(i%this.cols-b[2],Math.floor(i/this.cols)-b[3]);
 while(open.length){let k=0;for(let j=1;j<open.length;j++)if(g[open[j]]+heuristic(open[j])<g[open[k]]+heuristic(open[k]))k=j;const i=open.splice(k,1)[0];if(i===goal)break;if(closed[i])continue;closed[i]=1;const col=i%this.cols,row=Math.floor(i/this.cols);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const cx=col+dx,rz=row+dz;if(cx<0||cx>=this.cols||rz<0||rz>=this.rows)continue;const ni=rz*this.cols+cx;if(closed[ni])continue;const x=this.minX+cx*this.cell,z=this.minZ+rz*this.cell;if(!this.free(x,z))continue;if(dx&&dz&&(!this.free(this.minX+col*this.cell,z)||!this.free(x,this.minZ+row*this.cell)))continue;const cost=g[i]+Math.hypot(dx,dz);if(cost<g[ni]){g[ni]=cost;prev[ni]=i;open.push(ni);}}
 }
 if(start!==goal&&prev[goal]===-1)return [];
 const out=[];for(let i=goal;i!==start;i=prev[i])out.push([this.minX+(i%this.cols)*this.cell,this.minZ+Math.floor(i/this.cols)*this.cell]);out.reverse();
 if(this.free(...to))out.push([...to]);return out;
 }
 move(actor,dx,dz){const x=actor.x+dx,z=actor.z+dz;if(this.free(x,z)){actor.x=x;actor.z=z;}else{if(this.free(x,actor.z))actor.x=x;if(this.free(actor.x,z))actor.z=z;}}
}
