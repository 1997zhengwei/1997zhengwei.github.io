import {box} from './world.mjs';

export const FREE_SPAWNS=[
 {id:'plaza',name:'中央天台',subtitle:'低栏、短跳与四面屋顶',x:0,y:22,z:10,yaw:0},
 {id:'garden',name:'空中花园',subtitle:'低矮连廊与连续落差',x:-32,y:23.2,z:-56,yaw:0},
 {id:'works',name:'起重机工场',subtitle:'脚手架、蹬墙与高台',x:64,y:24,z:-57,yaw:0},
 {id:'sunset',name:'余晖街角',subtitle:'开阔助跑与跨楼飞跃',x:32,y:23,z:-88,yaw:Math.PI/2},
 {id:'east',name:'东岸工坊',subtitle:'新连廊、机房与侧向跨楼',x:96,y:24.6,z:-56,yaw:0},
 {id:'north',name:'北街茶室',subtitle:'花园露台与环线连接桥',x:0,y:23.8,z:-120,yaw:0}
];
const heights=[[21.6,22,23.4,22.8,23.4],[22.4,22.4,24.5,23.6,24],[23.2,24.2,25.2,24,24.6],[22.4,23.2,23,25.5,25],[23,23.8,24.2,24.8,25.4]];
const names=[['旧巷露台','中央天台','红砖会馆','水塔街角','东岸机房'],['晾衣屋脊','邻里天台','机房广场','黄桥工场','连廊仓库'],['空中花园','白墙庭院','钢架露台','起重机工场','东岸工坊'],['花园眺台','艺术屋顶','余晖街角','工场高台','高架露台'],['藤架花园','北街茶室','钟楼广场','旧厂天桥','塔楼眺台']];

export function districtBounds(map,padding=4){
 const minX=Math.min(...map.roofs.map(r=>r.x-r.w/2))-padding,maxX=Math.max(...map.roofs.map(r=>r.x+r.w/2))+padding,minZ=Math.min(...map.roofs.map(r=>r.z-r.d/2))-padding,maxZ=Math.max(...map.roofs.map(r=>r.z+r.d/2))+padding;
 return {minX,maxX,minZ,maxZ,width:maxX-minX,depth:maxZ-minZ,x:(minX+maxX)/2,z:(minZ+maxZ)/2,viewBox:`${minX} ${minZ} ${maxX-minX} ${maxZ-minZ}`};
}

export function buildFreeWorld(){
 const solids=[],props=[],roofs=[],links=[];
 const add=(id,x,y,z,w,h,d,extra={})=>{const b=box(id,x,y,z,w,h,d,extra);solids.push(b);return b;};
 const rows=heights.length,cols=heights[0].length;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const garden=col===0||row===4&&col===1;
  const r={id:`F${row}${col}`,x:(col-1)*32,z:-row*32,w:28,d:28,y:heights[row][col],name:names[row][col],material:col>=3?'stone':garden?'cream':row%2?'brick':'blue',zone:garden?'花园旧巷':col>=3?'施工街区':'老城屋脊'};
  roofs.push(r);add('roof-'+r.id,r.x,r.y/2,r.z,r.w,r.y,r.d,{kind:'building',roof:r.id,material:r.material});
  // All four edges are usable. Only corners have low parapets.
  for(const sx of[-1,1])for(const sz of[-1,1]){
   add(r.id+`-corner-${sx}-${sz}`,r.x+sx*13.7,r.y+.24,r.z+sz*11.9,.30,.48,3.6,{kind:'parapet',vault:true});
   add(r.id+`-return-${sx}-${sz}`,r.x+sx*11.9,r.y+.24,r.z+sz*13.7,3.6,.48,.30,{kind:'parapet',vault:true});
  }
  const px=r.x-8,pz=r.z-8;
  const p=add(r.id+'-service',px,r.y+(garden?.36:.56),pz,garden?3.4:2.4,garden?.72:1.12,1.7,{kind:garden?'planter':'ac',vault:true});props.push(p);
  add(r.id+'-rail',r.x,r.y+.43,r.z+4,6,.86,.28,{kind:'rail',vault:true});
  add(r.id+'-ledge',r.x+3.5,r.y+.62,r.z-6,4.2,1.24,5.8,{kind:'concrete-platform',vault:true});
  if((row+col)%2===0){
   add(r.id+'-upper',r.x+7.5,r.y+1.28,r.z-8,4,2.56,5,{kind:'concrete-platform'});
   for(let i=0;i<3;i++)add(r.id+'-terrace-'+i,r.x+7.5,r.y+.34*(i+1)-.12,r.z-1-i*1.8,3.5,.24,1.9,{kind:'stairs'});
  }else add(r.id+'-crossrail',r.x-7,r.y+.48,r.z-3,.25,.96,5.6,{kind:'rail',vault:true});
  if(row>0)add(r.id+'-block',r.x+7,r.y+.50,r.z-4,1.7,1,2.8,{kind:'vent',vault:true});
  if((row+col)%3===0)add(r.id+'-room',r.x+8.5,r.y+1.45,r.z+8,5,2.9,5,{kind:'rooftop-room'});
 }
 // Walkable connections form loops; the unbridged 4m gaps remain jumpable shortcuts.
 const connect=(a,b,width=3.1)=>{
  const alongX=a.z===b.z,lo=alongX?Math.min(a.x,b.x)+14:Math.min(a.z,b.z)+14,hi=alongX?Math.max(a.x,b.x)-14:Math.max(a.z,b.z)-14;
  const low=(alongX?a.x<b.x:a.z<b.z)?a:b,high=low===a?b:a,n=5,span=hi-lo;
  for(let i=0;i<n;i++){const t=(i+.5)/n,top=low.y+(high.y-low.y)*t,pos=lo+span*t;add(`link-${a.id}-${b.id}-${i}`,alongX?pos:a.x,top-.10,alongX?a.z:pos,alongX?span/n+.08:width,.20,alongX?width:span/n+.08,{kind:'stairs'});}
  links.push({a:a.id,b:b.id,x1:a.x,z1:a.z,x2:b.x,z2:b.z});
 };
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const r=roofs[row*cols+col];
  if(col<cols-1&&((row+col)%2===0||row===rows-1))connect(r,roofs[row*cols+col+1],row===rows-1?3.8:3.1);
  if(row<rows-1&&((row+col)%2===1||col===cols-1))connect(r,roofs[(row+1)*cols+col],col===cols-1?3.8:3.1);
 }
 // Two parallel walls and a low pipe make the construction roofs a trick playground.
 for(const z of[-31,-67]){
  add('free-wall-'+z,64,25.6,z,17,4,.35,{kind:'wallrun',wallRun:true});
  add('wall-deck-'+z,64,23.45,z+2.4,19,.24,3.5,{kind:'grate'});
 }
 add('free-low-beam',32,24.52,-31,7,.3,1.2,{kind:'pipe',low:true});
 for(const x of[28.4,35.6])add('pipe-foot-'+x,x,23.8,-31,.20,1.6,.3,{kind:'steel'});
 add('free-tank',58,24.35,-5,2.65,3.1,2.65,{kind:'tank'});
 // The central roof has an upper terrace and a passable space underneath.
 add('plaza-upper-deck',-7,25.1,-5,7,.25,6,{kind:'grate'});
 for(const x of[-10,-4])for(const z of[-7.5,-2.5])add(`plaza-post-${x}-${z}`,x,23.5,z,.23,3,.23,{kind:'steel'});
 for(let i=0;i<8;i++)add('plaza-stair-'+i,-9,22+.4*(i+1)-.12,7-i*1.45,3.4,.24,1.55,{kind:'stairs'});
 add('plaza-upper-rail',-7,25.67,-7.8,6.8,.88,.22,{kind:'rail',vault:true});
 // Real slabs above the north-east roof, reachable from broad stepping platforms.
 const base=roofs.find(r=>r.id==='F23');
 for(let i=0;i<4;i++)add('scaffold-step-'+i,72-i*2.5,base.y+.38*(i+1)-.13,-70,2.65,.26,3.6,{kind:'stairs'});
 add('scaffold-deck',64,25.52,-70,7,.28,6,{kind:'grate'});
 for(const x of[61,67])for(const z of[-72.5,-67.5])add(`scaffold-post-${x}-${z}`,x,24.7,z,.18,2,.18,{kind:'steel'});
 const center=roofs[1];
 return {id:'freeroam',free:true,solids,props,roofs,links,spawns:FREE_SPAWNS,spawn:{...FREE_SPAWNS[0]},gates:[],nav:[],city:{name:'自由街区',subtitle:'老城屋脊 / 花园旧巷 / 施工工场'},center};
}
