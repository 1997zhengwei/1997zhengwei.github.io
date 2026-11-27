import {rng,distance} from './math.mjs';
export const CITY={id:'oldtown',name:'老城天际线',subtitle:'晨光屋脊 · 施工钢桥 · 高空花园',gold:85,silver:125,bronze:180};
export const ROOFS=[
 {id:'A',x:0,z:0,w:19,d:30,y:22,name:'起点天台',material:'cream'},
 {id:'B',x:0,z:-34,w:18,d:30,y:22.25,name:'邻里屋脊',material:'brick'},
 {id:'C',x:0,z:-72,w:22,d:32,y:24.3,name:'砖墙工场',material:'brick'},
 {id:'D',x:34,z:-77,w:22,d:24,y:23.15,name:'空中转角',material:'stone'},
 {id:'E',x:34,z:-118,w:22,d:32,y:24.6,name:'蓝调机房',material:'blue'},
 {id:'F',x:34,z:-156.5,w:24,d:32,y:23.9,name:'钢架平台',material:'brick'},
 {id:'G',x:0,z:-164,w:22,d:30,y:25.4,name:'屋顶花园',material:'cream'},
 {id:'H',x:0,z:-204,w:24,d:36,y:23.8,name:'终点天际线',material:'stone'}
];
export const GATES=[
 {x:0,y:22,z:11,name:'起点 · 老城屋脊',spawn:{x:0,y:22,z:12,yaw:0}},
 {x:0,y:22.25,z:-29,name:'邻里屋脊',spawn:{x:0,y:22.25,z:-30,yaw:0}},
 {x:0,y:24.3,z:-64,name:'砖墙工场',spawn:{x:1,y:24.3,z:-65,yaw:-.79}},
 {x:34,y:23.15,z:-77,name:'空中转角',spawn:{x:34,y:23.15,z:-80,yaw:0}},
 {x:34,y:24.6,z:-109,name:'蓝调机房',spawn:{x:34,y:24.6,z:-110,yaw:0}},
 {x:34,y:23.9,z:-149,name:'钢架平台',spawn:{x:33,y:23.9,z:-151,yaw:.8}},
 {x:0,y:25.4,z:-160,name:'屋顶花园',spawn:{x:0,y:25.4,z:-162,yaw:0}},
 {x:0,y:23.8,z:-199,name:'终点屋顶',spawn:{x:0,y:23.8,z:-201,yaw:0}},
 {x:0,y:23.8,z:-214,name:'FINISH · 城市在你脚下',spawn:{x:0,y:23.8,z:-214,yaw:0}}
];
export const NAV=[
 {x:0,z:2,name:'低栏 · 起跳翻越',gate:0},
 {x:0,z:-13.4,name:'第一处断口',gate:0},
 {x:0,z:-29,name:'邻里屋脊',gate:1},
 {x:0,z:-52,name:'施工踏板',gate:1},
 {x:0,z:-64,name:'抓边登上砖墙工场',gate:2},
 {x:7.5,z:-72,name:'右转 · 施工钢桥',gate:2},
 {x:18,z:-72,name:'穿过钢桥',gate:2},
 {x:34,z:-77,name:'空中转角',gate:3},
 {x:34,z:-97,name:'登上消防阶梯',gate:3},
 {x:34,z:-109,name:'蓝调机房',gate:4},
 {x:34,z:-118,name:'滑过横梁或从侧面绕行',gate:4},
 {x:34,z:-137,name:'平衡钢梁',gate:4},
 {x:34,z:-149,name:'钢架平台',gate:5},
 {x:24,z:-155,name:'左转 · 上层阶梯',gate:5},
 {x:17,z:-155,name:'沿消防阶梯上行',gate:5},
 {x:10.5,z:-155,name:'登上屋顶花园',gate:5},
 {x:0,z:-160,name:'屋顶花园',gate:6},
 {x:0,z:-177.5,name:'跃向终点屋顶',gate:6},
 {x:0,z:-199,name:'最后一座屋顶',gate:7},
 {x:0,z:-214,name:'抵达天际线',gate:8}
];
export const LOOKS=[
 {id:'chalk',name:'旧街卫衣',tier:0,price:0,jacket:'#777d72',pants:'#42453e',accent:'#8e9681',shoes:'#999281',hair:'#211d1b',hat:'none',pack:false},
 {id:'cobalt',name:'钴蓝卫衣',tier:1,price:80,jacket:'#407baf',pants:'#1e2931',accent:'#d6f2e1',shoes:'#d9e0df',hair:'#28221d',hat:'none',pack:false},
 {id:'ember',tier:2,name:'余晖街头',price:140,jacket:'#d76f42',pants:'#323847',accent:'#f3ce8f',shoes:'#fcf6df',hair:'#30251e',hat:'cap',pack:true},
 {id:'moss',tier:3,name:'苔绿机能',price:220,jacket:'#697760',pants:'#272e2b',accent:'#cce28e',shoes:'#d8dfcc',hair:'#302921',hat:'none',pack:true},
 {id:'noir',tier:4,name:'午夜反光',price:320,jacket:'#242d35',pants:'#151d26',accent:'#98e6ed',shoes:'#e1f3f5',hair:'#191d22',hat:'beanie',pack:false},
 {id:'sunbeam',tier:5,name:'晨光领跑者',price:480,jacket:'#e9dba9',pants:'#353a40',accent:'#e3a94c',shoes:'#fff5dc',hair:'#30251e',hat:'cap',pack:true}
];
export function box(id,x,y,z,w,h,d,extra={}){return {id,x,y,z,w,h,d,minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2,...extra};}
export function buildWorld(){
 const solids=[],props=[];
 for(const r of ROOFS)solids.push(box('roof-'+r.id,r.x,r.y/2,r.z,r.w,r.y,r.d,{kind:'building',roof:r.id,material:r.material}));
 const add=(id,x,y,z,w,h,d,extra={})=>{const b=box(id,x,y,z,w,h,d,extra);solids.push(b);return b;};
 // These are real supports with the same dimensions used by the renderer.
 add('bridge-bc',0,22.37,-52.5,3.2,.26,9,{kind:'grate'});
 add('bridge-cd',17,24.15,-72,15,.3,4,{kind:'grate'});
 for(const side of[-1,1]){
  add('rail-bc-'+side,side*1.52,22.9,-52.5,.065,.8,8.2,{kind:'rail',vault:true});
  add('rail-cd-'+side,17,24.7,-72+side*1.88,14.7,.8,.065,{kind:'rail',vault:true});
 }
 for(let i=0;i<3;i++)add('stairs-de-'+i,34,[23.48,23.85,24.22][i]-.2,[-92,-97,-101.5][i],5.2,.4,[5.5,5.5,5][i],{kind:'stairs'});
 add('beam-ef',34,24.45,-137.25,1.85,.3,8.5,{kind:'beam'});
 for(let i=0;i<4;i++)add('stairs-fg-'+i,[20.8,17.6,14.4,11.2][i],[24.2,24.6,25,25.4][i]-.2,-155,3.6,.4,3.6,{kind:'stairs'});
 add('canopy-gh',0,24.61,-182.5,4.6,.28,3.5,{kind:'canopy'});
 add('vault-a',0,22.43,4,6,.86,.32,{kind:'rail',vault:true});
 add('vault-b',0,22.69,-36,4.3,.88,1.15,{kind:'vent',vault:true});
 add('vault-cd',17,24.73,-72,.3,.86,3.6,{kind:'rail',vault:true});
 add('vault-ef',34,24.99,-137.5,1.8,.78,.28,{kind:'rail',vault:true});
 add('vault-h',0,24.25,-208,7,.9,.32,{kind:'rail',vault:true});
 add('low-beam',34,26.12,-115,8,.34,1.5,{kind:'pipe',low:true});
 add('pipe-leg-l',29.7,25.36,-115,.25,1.52,.35,{kind:'steel'});
 add('pipe-leg-r',38.3,25.36,-115,.25,1.52,.35,{kind:'steel'});
 add('wallrun-cd',17.1,25.45,-88.5,18.2,4.8,.38,{kind:'wallrun',wallRun:true});
 add('room-e',41,26.1,-123,5,3,7,{kind:'rooftop-room'});
 add('room-g',6.8,26.95,-170,5.5,3.1,7,{kind:'rooftop-room'});
 add('tank-a',-5.7,23.55,7.5,2.65,3.1,2.65,{kind:'tank'});
 add('skylight-b',-5.5,22.66,-43,3.1,.82,4.1,{kind:'skylight',vault:true});
 add('bench-g',-6.5,25.81,-167.5,3.2,.82,1,{kind:'bench',vault:true});
 const r=rng(7981);
 for(const roof of ROOFS){
  for(const side of[-1,1]){
   const x=roof.x+side*(roof.w/2-2.1);let z=roof.z+(r()-.5)*roof.d*.45;
   const type=roof.id==='G'?'planter':r()>.38?'ac':'vent';
   const w=type==='planter'?2.1:1.55,h=type==='planter'?.65:1.05,d=type==='planter'?1.3:1.1;
   if(solids.some(b=>['rooftop-room','tank','skylight','bench'].includes(b.kind)&&x+w/2>b.minX-.5&&x-w/2<b.maxX+.5&&z+d/2>b.minZ-.5&&z-d/2<b.maxZ+.5))z=roof.z+roof.d*.33;
   const p=add(roof.id+'-'+type+'-'+side,x,roof.y+h/2,z,w,h,d,{kind:type,vault:h<1.15});props.push(p);
  }
 }
 const safeEdge=(id,r,side,a,b)=>{if(b-a<.3)return;const vertical=side==='left'||side==='right';const x=vertical?r.x+(side==='left'?-1:1)*(r.w/2-.12):r.x+(a+b)/2,z=vertical?r.z+(a+b)/2:r.z+(side==='front'?-1:1)*(r.d/2-.12);add(id,x,r.y+.25,z,vertical?.24:b-a,.5,vertical?b-a:.24,{kind:'parapet',vault:true});};
 for(const roof of ROOFS){
  // Keep the marked exits open; parapets never close the intended route.
  const leftOpen=roof.id==='D'||roof.id==='F',rightOpen=roof.id==='C'||roof.id==='G';
  if(!leftOpen)safeEdge('edge-'+roof.id+'-l',roof,'left',-roof.d/2,roof.d/2);
  if(!rightOpen)safeEdge('edge-'+roof.id+'-r',roof,'right',-roof.d/2,roof.d/2);
  if(roof.id==='A')safeEdge('edge-A-back',roof,'back',-roof.w/2,roof.w/2);
  if(roof.id==='H')safeEdge('edge-H-front',roof,'front',-roof.w/2,roof.w/2);
 }
 return {solids,props,roofs:ROOFS,gates:GATES,nav:NAV,city:CITY};
}
export function insideXZ(b,x,z,pad=0){return x>=b.minX-pad&&x<=b.maxX+pad&&z>=b.minZ-pad&&z<=b.maxZ+pad;}
export function supportAt(world,x,z,ceiling=Infinity,pad=0){let best=null;for(const b of world.solids)if(!b.noTop&&b.maxY<=ceiling+.001&&insideXZ(b,x,z,pad)&&(!best||b.maxY>best.maxY))best=b;return best;}
export function nearbySolids(world,p,r=4){return world.solids.filter(b=>p.x>b.minX-r&&p.x<b.maxX+r&&p.z>b.minZ-r&&p.z<b.maxZ+r&&p.y>b.minY-3&&p.y<b.maxY+5);}
export function nearestRoof(world,p){return world.roofs.reduce((best,r)=>distance(p,r)<distance(p,best)?r:best,world.roofs[0]);}
