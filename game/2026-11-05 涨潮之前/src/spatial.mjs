const GRID=2.2,cache=new WeakMap();
const key=(x,z)=>`${Math.round(x/GRID)},${Math.round(z/GRID)}`;
export function invalidateBuildings(s){cache.delete(s);}
export function buildingIndex(s){
  let c=cache.get(s);if(c&&c.array===s.buildings&&c.count===s.buildings.length)return c;
  const tiles=new Map();for(const b of s.buildings){const k=key(b.x,b.z);if(!tiles.has(k))tiles.set(k,[]);tiles.get(k).push(b);}
  c={array:s.buildings,count:s.buildings.length,tiles};cache.set(s,c);return c;
}
export function atTile(s,x,z){return buildingIndex(s).tiles.get(key(x,z))||[];}
export function nearBuildings(s,x,z,r=4){
  const c=buildingIndex(s),gx=Math.round(x/GRID),gz=Math.round(z/GRID),n=Math.ceil(r/GRID),out=[];
  for(let i=gx-n;i<=gx+n;i++)for(let j=gz-n;j<=gz+n;j++)for(const b of c.tiles.get(`${i},${j}`)||[])if(Math.hypot(b.x-x,b.z-z)<=r+1.2)out.push(b);return out;
}
export function connectedFoundations(s,groundHeight,ignored=new Set()){
  const all=s.buildings.filter(b=>['platform','bridge'].includes(b.type)&&!ignored.has(b.id)),map=new Map(all.map(b=>[key(b.x,b.z),b])),queue=[],seen=new Set();
  for(const b of all)if(b.freeAnchor||groundHeight(b.x,b.z)>=.15){seen.add(b.id);queue.push(b);}
  for(let i=0;i<queue.length;i++){const b=queue[i];for(const [dx,dz]of [[GRID,0],[-GRID,0],[0,GRID],[0,-GRID]]){const n=map.get(key(b.x+dx,b.z+dz));if(n&&!seen.has(n.id)){seen.add(n.id);queue.push(n);}}}
  return{all,seen};
}
