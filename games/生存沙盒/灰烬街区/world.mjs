export const BUILDINGS=[
 {id:'home',name:'17号 · 临时安全屋',type:'home',x:-14,z:13,w:12,d:10,color:0xa8a18c,roof:0x55534a},
 {id:'market',name:'GREENWAY · 食品杂货店',type:'market',x:14,z:13,w:16,d:12,color:0xaba68c,roof:0x53625a},
 {id:'clinic',name:'社区诊所',type:'clinic',x:-14,z:-14,w:12,d:12,color:0xa5b2ae,roof:0x555b63},
 {id:'hardware',name:'MILLER · 五金店',type:'hardware',x:14,z:-14,w:15,d:12,color:0xac9580,roof:0x695748},
 {id:'house',name:'榆树街 · 空置住宅',type:'house',x:-34,z:15,w:12,d:10,color:0xb1a68d,roof:0x596358},
 {id:'garage',name:'北岸维修库',type:'hardware',x:15,z:-36,w:15,d:11,color:0x9b9e91,roof:0x63676a},
 {id:'cottage',name:'林边住宅',type:'house',x:-14,z:36,w:12,d:11,color:0xb5aba2,roof:0x635955},
 {id:'pharmacy',name:'旧街药房',type:'clinic',x:35,z:13,w:12,d:10,color:0xabb2a3,roof:0x566259}
];
export const ITEMS={food:{name:'罐头食物',weight:.6,icon:'◉',color:'#c5a270'},water:{name:'瓶装饮水',weight:.7,icon:'◒',color:'#89b6bf'},bandage:{name:'干净绷带',weight:.15,icon:'✚',color:'#c7c4b4'},wood:{name:'木板',weight:.8,icon:'▰',color:'#b69164'},nails:{name:'钉子',weight:.05,icon:'⠿',color:'#b1b9b7'},scrap:{name:'废金属',weight:.3,icon:'◇',color:'#b7b5a1'},cloth:{name:'布料',weight:.2,icon:'▱',color:'#baa89b'}};
ITEMS.fuel={name:'便携汽油罐',weight:2.5,icon:'▧',color:'#c4ad6d'};
ITEMS.repairkit={name:'车辆维修包',weight:1.4,icon:'⚒',color:'#9bb8b3'};
export const HOME={x:-14,z:18,parking:{x:-12,z:24.5,w:14,d:9}};
export const CARS=[['sedan',5,9,.12],['police',-5,-23,.1],['van',24,4,1.57],['ambulance',-21,-5,1.5],['sedan',4,28,2.8]];
export const TREES=Array.from({length:55},(_,i)=>({i,x:Math.sin(i*42.3)*58,z:Math.cos(i*83.1)*58})).filter(p=>Math.abs(p.x)>=8&&Math.abs(p.z)>=7&&!BUILDINGS.some(b=>Math.abs(p.x-b.x)<b.w/2+3&&Math.abs(p.z-b.z)<b.d/2+3));
export const HOUSES=Array.from({length:10},(_,i)=>({i,x:(i%2?-1:1)*(35+(i%3)*8),z:-42+(i%5)*20})).filter(p=>!BUILDINGS.some(b=>Math.abs(p.x-b.x)<b.w/2+8&&Math.abs(p.z-b.z)<b.d/2+8));
export const PROPS=[];
const add=(b,model,dx,dz,height=1,rot=0,loot=null,kind='prop',size=null)=>PROPS.push({id:b.id+'-'+PROPS.length,building:b.id,model,x:b.x+dx,z:b.z+dz,height,rot,loot,kind,size});
for(const b of BUILDINGS){
 if(['home','house'].includes(b.type)){
  add(b,'furniture-kit/bedSingle',-3,-2,1,0,null,'bed');add(b,'furniture-kit/loungeSofa',3,-2,1,Math.PI);
  add(b,'furniture-kit/kitchenFridge',-4,1,1.7,0,{food:2,water:2},'container');
  add(b,'furniture-kit/kitchenCabinet',-2,1,1,0,{food:1,cloth:2},'container');
  add(b,'furniture-kit/table',2,1,1);add(b,'furniture-kit/chair',3.6,1,.9,Math.PI/2);
  add(b,'furniture-kit/bookcaseOpen',4,-3,1.8,Math.PI/2,{bandage:1,nails:4},'container');
  if(b.id==='home')add(b,'survival-kit/chest',-3,3,.9,0,{},'stash');
 }else if(b.type==='market'){
  for(const dx of [-5,0,5]){add(b,'furniture-kit/bookcaseOpen',dx,-2,1.9,Math.PI,{food:3,water:2},'container');add(b,'furniture-kit/bookcaseOpen',dx,1,1.9,Math.PI,{food:2,cloth:1},'container');}
  add(b,'furniture-kit/kitchenFridgeLarge',-6,-4,1.9,0,{water:4,food:1},'container');add(b,'furniture-kit/desk',5,4,1,Math.PI);
 }else if(b.type==='clinic'){
  add(b,'furniture-kit/bedSingle',-3,-2,1,0,null,'bed');add(b,'furniture-kit/bedSingle',2,-2,1);
  add(b,'furniture-kit/bookcaseOpen',-4,1,1.8,Math.PI/2,{bandage:4,cloth:2},'container');add(b,'furniture-kit/kitchenCabinet',3,2,1,0,{bandage:2,water:2},'container');
  add(b,'furniture-kit/desk',0,3,1,Math.PI);
 }else{
  add(b,'survival-kit/workbench',-3,-3,1.3,0,{wood:5,nails:12,scrap:3},'container');
  add(b,'survival-kit/resource-planks',3,-3,.6,0,{wood:6},'container');
  add(b,'survival-kit/box',-4,1,1,0,{wood:3,nails:8},'container');add(b,'survival-kit/barrel',3,1,1.2,0,{scrap:4,cloth:2},'container');
 }
}
// A low, step-over lumber pile near home: an actual finite container, not scenery.
PROPS.push({id:'outdoor-lumber',building:'outdoor',name:'旧木料堆',model:'survival-kit/resource-planks',x:-22,z:30,height:.45,rot:0,loot:{wood:8},kind:'container',passable:true});
// Shells have real door and window gaps. These rectangles are shared by rendering and collision.
export function shell(b){
 const x=b.x,z=b.z,w=b.w,d=b.d,t=.22;
 return [
  {x:x-w/2,z,w:t,d}, {x:x+w/2,z,w:t,d},
  {x:x-w/4-0.75,z:z+d/2,w:w/2-1.5,d:t}, {x:x+w/4+.75,z:z+d/2,w:w/2-1.5,d:t},
  {x:x-w/4-.8,z:z-d/2,w:w/2-1.6,d:t},{x:x+w/4+.8,z:z-d/2,w:w/2-1.6,d:t}
 ];
}
export const inside=(p,b,pad=0)=>Math.abs(p.x-b.x)<b.w/2+pad&&Math.abs(p.z-b.z)<b.d/2+pad;
export function gates(){return BUILDINGS.flatMap(b=>[{id:b.id+'-door',building:b.id,kind:'door',x:b.x,z:b.z+b.d/2,w:2.8,d:.24,hp:100,open:b.id==='home',broken:false,barricade:0},{id:b.id+'-window',building:b.id,kind:'window',x:b.x,z:b.z-b.d/2,w:3,d:.2,hp:45,open:false,broken:false,barricade:0}]);}
export function supplyItems(p){if(p.building==='home'&&p.model==='furniture-kit/kitchenCabinet')return {fuel:1,repairkit:1};if(['hardware','garage'].includes(p.building)&&p.model==='survival-kit/workbench')return {repairkit:2};if(['hardware','garage'].includes(p.building)&&p.model==='survival-kit/barrel')return {fuel:3};return {};}
export function loot(seed=42){let n=seed;const rand=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);return PROPS.filter(p=>p.kind==='container'||p.kind==='stash').map(p=>({...p,items:{...p.loot,...supplyItems(p)},searched:false})).map(p=>{if(p.kind!=='stash'&&rand()>.75)p.items.scrap=(p.items.scrap||0)+1;return p;});}
export const staticObstacles=()=>[...BUILDINGS.flatMap(shell),...PROPS.filter(p=>!p.passable).map(p=>({id:p.id,x:p.x,z:p.z,w:p.model.includes('bed')?1.6:p.model.includes('Sofa')?2.5:1.3,d:p.model.includes('bed')?2.5:1.1})),...TREES.map(t=>({x:t.x,z:t.z,w:.6,d:.6})),...HOUSES.map(h=>({x:h.x,z:h.z,w:7.5,d:7.5})),...[[22,21],[-23,20],[23,-23],[-25,-24]].map(([x,z])=>({x,z,w:1.8,d:1.3}))];
