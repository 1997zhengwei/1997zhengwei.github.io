import {branchMaps} from './layouts.js';
export const duration=60,capacity=5;
const bounds={left:-18.1,right:18.1,back:-13.25,front:8.62};
const tills=[{x:0,z:7.1},{x:-13,z:7.1},{x:13,z:7.1}];
export const departments=[
  {name:'影音厅',x:0,color:'#9360dd',sign:'SCREEN ROOM'},
  {name:'厨电馆',x:-12.5,color:'#ff875c',sign:'KITCHEN CLUB'},
  {name:'数码街',x:12.5,color:'#21c7bb',sign:'TECH ARCADE'}
];
export const goods={
  fryer:{name:'空气炸锅',list:399,price:159},pan:{name:'珐琅煎锅',list:149,price:49},
  phones:{name:'无线耳机',list:239,price:99},toast:{name:'烤面包机',list:219,price:89},
  speaker:{name:'便携音箱',list:199,price:79},iron:{name:'蒸汽熨斗',list:189,price:69},
  tv:{name:'55″ 大电视',list:1990,price:199,big:true},
  oled:{name:'77″ 影院屏',list:2680,price:268,big:true},
  crt:{name:'复古小彩电',list:1180,price:118},
  camera:{name:'微单相机',list:1790,price:179},
  espresso:{name:'意式咖啡机',list:1680,price:168},
  mixer:{name:'行星厨师机',list:1290,price:129},
  console:{name:'掌上游戏机',list:1090,price:109},
  radio:{name:'口袋收音机',list:299,price:119},
  kettle:{name:'搪瓷水壶',list:299,price:99}
};
export const saving=k=>goods[k].list-goods[k].price;
export const bulky=k=>!!goods[k].big;
const racks=[
  {x:-4.77,z:0,w:7.16,d:1.42,theme:'mint'},{x:2.54,z:0,w:2.70,d:1.42,theme:'rose'},
  {x:-6.46,z:-4.87,w:1.64,d:3.78,theme:'cream'},{x:6.85,z:-5.85,w:1.50,d:3.65,theme:'aqua'},
  {x:-6.55,z:4.48,w:1.58,d:3.1,theme:'cream'},{x:6.85,z:5.12,w:1.50,d:2.9,theme:'rose'},
  {x:-13.2,z:-5,w:5.2,d:1.35,theme:'cream'},{x:-16.6,z:.4,w:1.45,d:3.5,theme:'rose'},
  {x:-10.65,z:1.3,w:1.35,d:4.7,theme:'mint'},{x:13.7,z:-4.8,w:5.0,d:1.35,theme:'aqua'},
  {x:10.9,z:.85,w:1.45,d:4.6,theme:'rose'},{x:16.5,z:1.35,w:1.35,d:3.8,theme:'aqua'},
  {x:-4.7,z:-10.7,w:3.1,d:1.22,theme:'rose'},{x:6.6,z:-10.6,w:3.15,d:1.22,theme:'mint'}
];

const basicSpots=[
  [0,2.15,'fryer'],[-3.8,2.28,'pan'],[3.62,2.28,'phones'],[-3.65,-2.12,'toast'],[2.84,-2.30,'speaker'],
  [5.62,1.55,'pan'],[-4.27,-5.36,'phones'],[4.29,-5.21,'iron'],
  [-13,3.25,'kettle'],[-15,4.65,'toast'],[-13,-1.5,'fryer'],[-16.4,-7.5,'kettle'],[-10,-8.5,'iron'],[-9,-11.8,'toast'],
  [13,3.25,'radio'],[15.5,4.6,'phones'],[13.5,-1.55,'speaker'],[16.6,-7.7,'radio'],[9.5,-8.2,'phones'],[9,-11.8,'speaker'],
  [-2.0,-11.5,'radio'],[2.7,-11.75,'kettle']
];
const baseMap={id:0,name:'三分区大卖场',tip:'中间是快道，两翼也有收银台',color:'#9060d8',floor:'#85a6ff',
  bounds,racks,tills,size:[38.5,-15,10],start:[0,4.36],rivals:[[-3.9,4.05],[5.55,3.2],[-3.6,-3.7]],
  stock:basicSpots,flash:[[0,-6.75],[-13.25,-9.35],[13.25,-9.35]],gates:[{x:0,z:0,half:1.19}]};
export const maps=[baseMap,...branchMaps];
// Savings needed for the third star, about half of what a tidy bot run makes.
const targets=[5500,5000,4500,4500,4500,5000,5500,5000,5500,5000];
for(const map of maps){
  map.target=targets[map.id]||5000;
  map.fixtures=[...map.racks,...(map.garden?[map.garden]:[]),
    ...(!map.id?[{x:0,z:-8.13,w:4.9,d:1.17}]:[]),
    ...map.tills.map(t=>({x:t.x+(t.side||1)*3,z:t.z+.38,w:1.70,d:1.78}))];
}
const editions=[['tv','crt','oled'],['espresso','mixer'],['camera','console']];
export function newStock(round,map=maps[0]){
  const spots=map.stock;
  const items=spots.map(([x,z],i)=>{
    const j=i===0?0:1+(i-1+round)%(spots.length-1);
    return {x,z,kind:spots[j][2],owner:null,available:true,restockAt:0};
  });
  const waves=[];
  for(let i=0;i<3;i++){
    const spot=(round+i)%3,kinds=editions[(map.id+spot)%3];
    const [x,z]=map.flash[spot];
    const n=(Math.floor(round/3)+round%3+Math.floor(map.id/3))%kinds.length;
    const zone=map.id?['A 区','B 区','C 区'][spot]:departments[spot].name;
    const p={x,z,kind:kinds[n],zone,flash:true,wave:i,owner:null,available:i===0};
    waves.push(p);items.push(p);
  }
  return {pickups:items,waves};
}
function solid(x,z,map,radius){
  return map.fixtures.some(r=>Math.hypot(Math.max(0,Math.abs(x-r.x)-r.w/2),Math.max(0,Math.abs(z-r.z)-r.d/2))<radius);
}
export function canMove(x,z,map=maps[0]){
  const b=map.bounds;
  return x>=b.left&&x<=b.right&&z>=b.back&&z<=b.front&&!solid(x,z,map,.43);
}
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function atTill(a,map=maps[0]){
  return map.tills.some(t=>Math.abs(a.x-t.x)<1.95&&Math.abs(a.z-t.z)<.76);
}
export function reachesStand(a,p,map){
  const dx=p.x-a.x,dz=p.z-a.z,r=bulky(p.kind)?1.14:.95;
  const x=Math.sin(a.angle),z=-Math.cos(a.angle);
  const reach=Math.max(0,Math.min(.84,dx*x+dz*z));
  if(Math.hypot(dx-x*reach,dz-z*reach)>r)return false;
  // Require a clear line to the display, including when the cart noses around a shelf.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)*5));
  for(let i=1;i<steps;i++)if(solid(a.x+dx*i/steps,a.z+dz*i/steps,map,.05))return false;
  return true;
}
export function gateAt(map,x,z,margin=0){
  return map.gates.find(g=>Math.abs(x-g.x)<g.half+.045&&Math.abs(z-g.z)<1.33+margin);
}
const navigation=new WeakMap();
function grid(map){
  if(navigation.has(map))return navigation.get(map);
  const b=map.bounds,x0=Math.ceil(b.left),z0=Math.ceil(b.back);
  const cols=Math.floor(b.right)-x0+1,rows=Math.floor(b.front)-z0+1;
  const nodes=Array.from({length:cols*rows},(_,i)=>{
    const x=i%cols+x0,z=Math.floor(i/cols)+z0;
    return {x,z,clear:canMove(x,z,map),wide:!gateAt(map,x,z),edges:[]};
  });
  for(const [i,a] of nodes.entries()){
    if(!a.clear)continue;
    for(const di of [-1,1,-cols,cols]){
      const b=nodes[i+di];
      if(b?.clear&&distance(a,b)===1&&canMove((a.x+b.x)/2,(a.z+b.z)/2,map))a.edges.push(i+di);
    }
  }
  const g={cols,rows,x0,z0,nodes,fields:new Map()};navigation.set(map,g);return g;
}
function nearby(a,wide,g,map){
  const ix=Math.round(a.x)-g.x0,iz=Math.round(a.z)-g.z0;
  let best=-1,min=Infinity;
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
    const col=ix+dx,row=iz+dz;if(col<0||col>=g.cols||row<0||row>=g.rows)continue;
    const i=row*g.cols+col,b=g.nodes[i];if(!b.clear||(wide&&!b.wide))continue;
    const d=distance(a,b);
    if(d<min&&canMove((2*a.x+b.x)/3,(2*a.z+b.z)/3,map)&&canMove((a.x+2*b.x)/3,(a.z+2*b.z)/3,map)){min=d;best=i;}
  }
  return best;
}
function field(end,wide,g){
  const key=end*2+Number(wide);
  if(g.fields.has(key))return g.fields.get(key);
  const steps=new Int16Array(g.nodes.length).fill(-1),queue=[end];steps[end]=0;
  for(let i=0;i<queue.length;i++)for(const j of g.nodes[queue[i]].edges){
    if(steps[j]>=0||(wide&&!g.nodes[j].wide))continue;
    steps[j]=steps[queue[i]]+1;queue.push(j);
  }
  g.fields.set(key,steps);return steps;
}
export function pathTo(from,to,wide=false,map=maps[0]){
  const g=grid(map);
  let i=nearby(from,wide,g,map);
  const end=nearby(to,wide,g,map);
  if(i<0||end<0)return [];
  const steps=field(end,wide,g);
  if(steps[i]<0)return [];
  const path=[g.nodes[i]];
  while(steps[i]>0){
    i=g.nodes[i].edges.find(j=>steps[j]===steps[i]-1);path.push(g.nodes[i]);
  }
  path.push(to);return path;
}
export function nearestTill(a,map=maps[0]){
  const wide=a.items?.some(bulky),g=grid(map),start=nearby(a,wide,g,map);
  let best=map.tills[0],min=Infinity;
  for(const t of map.tills){
    const end=nearby(t,wide,g,map);
    const steps=start>=0&&end>=0?field(end,wide,g)[start]:-1;
    const cost=steps>=0?steps+distance(g.nodes[end],t):60+distance(a,t);
    if(cost<min){min=cost;best=t;}
  }
  return best;
}
