// Grid path finding over a level, used for the par time and by the test bot.
const cell=.3;
const grids=new Map();
function grid(room,open){
  const id=room.index+':'+open;
  if(grids.has(id))return grids.get(id);
  const {left,right,back,front}=room.bounds,w=Math.ceil((right-left)/cell),h=Math.ceil((front+1-back)/cell);
  const solids=open||!room.gate?room.solids:[...room.solids,room.gate.rect];
  const free=new Uint8Array(w*h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    const x=left+(i+.5)*cell,z=back+(j+.5)*cell;
    if(x<left+.4||x>right-.4||z<back+.4)continue;
    if(z>front-.4&&Math.abs(x)>.9)continue;
    free[j*w+i]=solids.some(([cx,cz,sw,sd])=>Math.hypot(Math.max(Math.abs(x-cx)-sw/2,0),Math.max(Math.abs(z-cz)-sd/2,0))<.42)?0:1;
  }
  const g={w,h,free,left,back};grids.set(id,g);return g;
}
export function route(room,from,to,open=true){
  const g=grid(room,open),{w,h,free,left,back}=g;
  const idx=(x,z)=>{const i=Math.max(0,Math.min(w-1,Math.floor((x-left)/cell))),j=Math.max(0,Math.min(h-1,Math.floor((z-back)/cell)));return j*w+i;};
  const near=k=>{
    if(free[k])return k;
    const i0=k%w,j0=Math.floor(k/w);
    for(let r=1;r<6;r++)for(let j=j0-r;j<=j0+r;j++)for(let i=i0-r;i<=i0+r;i++)if(i>=0&&j>=0&&i<w&&j<h&&free[j*w+i])return j*w+i;
    return k;
  };
  const start=near(idx(from.x,from.z)),goal=near(idx(to.x,to.z));
  const cost=new Float32Array(w*h).fill(Infinity),prev=new Int32Array(w*h).fill(-1);
  const gx=goal%w,gz=Math.floor(goal/w),hd=k=>Math.hypot(k%w-gx,Math.floor(k/w)-gz);
  const heap=[[hd(start),start]];cost[start]=0;
  const push=item=>{heap.push(item);let n=heap.length-1;while(n){const p=(n-1)>>1;if(heap[p][0]<=heap[n][0])break;[heap[p],heap[n]]=[heap[n],heap[p]];n=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let n=0;for(;;){const l=2*n+1,r=l+1;let m=n;
    if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===n)break;[heap[m],heap[n]]=[heap[n],heap[m]];n=m;}}return top;};
  while(heap.length){
    const [,k]=pop();if(k===goal)break;
    const i=k%w,j=Math.floor(k/w);
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
      if(!di&&!dj)continue;const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=w||nj>=h)continue;
      const n=nj*w+ni;if(!free[n])continue;
      if(di&&dj&&(!free[j*w+ni]||!free[nj*w+i]))continue;
      const c=cost[k]+(di&&dj?1.414:1);
      if(c<cost[n]){cost[n]=c;prev[n]=k;push([c+hd(n),n]);}
    }
  }
  if(!isFinite(cost[goal]))return null;
  const pts=[];for(let k=goal;k!==-1;k=prev[k])pts.push({x:left+(k%w+.5)*cell,z:back+(Math.floor(k/w)+.5)*cell});
  pts.reverse();pts.push({x:to.x,z:to.z});
  return {points:pts,length:cost[goal]*cell};
}
// A relaxed target time: walk the shortest tour, then allow for hiding and waiting.
export function parTime(room,speed=3.65){
  let at={x:0,z:6.3},total=0;
  const stops=[];if(room.key)stops.push(room.key);
  const left=room.relics.map(r=>({x:r.x,z:r.z}));
  let open=!room.gate;
  if(room.key){const r=route(room,at,room.key,false);total+=r?r.length:30;at=room.key;open=true;}
  while(left.length){
    let best=0,bestLen=Infinity;
    left.forEach((p,i)=>{const r=route(room,at,p,open);if(r&&r.length<bestLen){bestLen=r.length;best=i;}});
    total+=bestLen;at=left.splice(best,1)[0];
  }
  const back=route(room,at,{x:0,z:7.38},open);total+=back?back.length:30;
  return Math.ceil((total/speed*2.1+14)/5)*5;
}
