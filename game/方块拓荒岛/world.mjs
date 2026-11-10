export const TILE=2.2;
export const RES={wood:{name:'Wood',color:'#ba783d'},stone:{name:'Stone',color:'#9caebb'},ore:{name:'Iron ore',color:'#d5a07a'},iron:{name:'Iron',color:'#e7eef1'},wheat:{name:'Wheat',color:'#f5cb4f'},emerald:{name:'Emerald',color:'#38eaae'},obsidian:{name:'Obsidian',color:'#a57aff'}};
const rect=(x1,x2,z1,z2)=>{const a=[];for(let z=z1;z<=z2;z++)for(let x=x1;x<=x2;x++)a.push([x,z]);return a;};
export const START=rect(-1,1,-1,1);
// Pad coordinates are on existing ground. Newly built terrain always connects to it.
export const SITES=[
 {id:'meadow',name:'Woodland',verb:'Grow the woodland',at:[1,.55],cost:{wood:8},tiles:rect(2,4,-1,1),biome:'grass',needs:[],kind:'land',hint:'More trees, stone & a workbench'},
 {id:'stone-tools',name:'Stone tools',verb:'Craft stone tools',at:[3,1],cost:{wood:12,stone:8},needs:['meadow'],kind:'tool',tier:2,hint:'2× harvest · mine iron ore'},
 {id:'pasture',name:'Wheat pasture',verb:'Grow the pasture',at:[1.15,-1],cost:{wood:16,stone:10},tiles:rect(1,4,-3,-2),biome:'grass',needs:['meadow'],kind:'land',hint:'Wheat + cow → emeralds'},
 {id:'bridge',name:'Timber bridge',verb:'Build the bridge',at:[4,.5],cost:{wood:22,stone:10},tiles:rect(5,6,0,1),biome:'bridge',needs:['meadow'],kind:'land',hint:'A route to the iron quarry'},
 {id:'quarry',name:'Iron quarry',verb:'Open the quarry',at:[6,1],cost:{wood:24,stone:18},tiles:rect(5,7,2,5),biome:'stone',needs:['bridge'],kind:'land',hint:'Iron ore · needs Stone tools'},
 {id:'furnace',name:'Furnace',verb:'Build a furnace',at:[6,4.7],cost:{stone:18,wood:8},needs:['quarry'],kind:'furnace',hint:'Stand here: 2 ore + 1 wood → 1 iron'},
 {id:'iron-tools',name:'Iron tools',verb:'Craft iron tools',at:[3,1],cost:{iron:10,wood:20},needs:['stone-tools','furnace'],kind:'tool',tier:3,hint:'3× harvest · mine obsidian'},
 {id:'ridge',name:'Sunstone ridge',verb:'Cross the ridge',at:[5,4],cost:{stone:20,iron:6},tiles:rect(3,4,4,5),biome:'sand',needs:['quarry','furnace'],kind:'land',hint:'The ruins lie just beyond'},
 {id:'ruins',name:'Ancient ruins',verb:'Uncover the ruins',at:[3,4.5],cost:{stone:24,iron:8},tiles:[...rect(0,2,3,6),[1,2],[2,2]],biome:'ruins',needs:['ridge'],kind:'land',hint:'Obsidian · villager · broken portal'},
 {id:'grove',name:'Waterfall grove',verb:'Grow the grove',at:[3,-3],cost:{wood:18,stone:12},tiles:rect(2,4,-5,-4),biome:'grass',needs:['pasture'],kind:'land',hint:'A quiet grove with extra trees'},
 {id:'vault',name:'Hidden treasury',verb:'Open the treasury',at:[0,5],cost:{obsidian:10,iron:4},tiles:rect(-3,-1,5,6),biome:'ruins',needs:['ruins'],kind:'land',hint:'A treasure chest with 6 emeralds'},
 {id:'portal',name:'Ancient portal',verb:'Restore the portal',at:[1,6],cost:{obsidian:12,emerald:8,iron:8},needs:['ruins'],kind:'portal',hint:'Your final destination'},
];
export const NODES=[
 {id:'oak0',type:'wood',at:[-.7,-.45],from:null,hits:8,regen:5,tier:1},
 {id:'oak1',type:'wood',at:[2.1,.4],from:'meadow',hits:7,regen:5,tier:1},
 {id:'oak2',type:'wood',at:[2,-.9],from:'meadow',hits:7,regen:5,tier:1},
 {id:'rock0',type:'stone',at:[3,-.7],from:'meadow',hits:7,regen:5,tier:1},
 {id:'rock1',type:'stone',at:[4,1],from:'meadow',hits:7,regen:5,tier:1},
 ...[[1.2,-2.6],[2.5,-2.1],[4,-3]].map((at,i)=>({id:`wheat${i}`,type:'wheat',at,from:'pasture',hits:4,regen:6,tier:1})),
 ...[[5.1,2.5],[6.45,3.25],[7,4.7]].map((at,i)=>({id:`iron${i}`,type:'ore',at,from:'quarry',hits:8,regen:6,tier:2})),
 ...[[5,3],[6.65,2.2]].map((at,i)=>({id:`rockQ${i}`,type:'stone',at,from:'quarry',hits:8,regen:5,tier:1})),
 ...[[2.2,-4.6],[3.3,-4.4],[4,-4.7]].map((at,i)=>({id:`grove${i}`,type:'wood',at,from:'grove',hits:8,regen:5,tier:1})),
 ...[[.2,3.5],[1.4,4.2],[.5,5.7]].map((at,i)=>({id:`obs${i}`,type:'obsidian',at,from:'ruins',hits:7,regen:6,tier:3})),
];
export const SERVICES=[
 {id:'cow',name:'Feed the cow',at:[3.8,-2.05],from:'pasture',cost:{wheat:3},reward:{emerald:1},time:1.3,hint:'3 Wheat → 1 Emerald'},
 {id:'smelt',name:'Smelt iron',at:[6,4.7],from:'furnace',cost:{ore:2,wood:1},reward:{iron:1},time:1.7,hint:'2 Iron ore + 1 Wood → 1 Iron'},
 {id:'trade',name:'Villager trade',at:[2,4.15],from:'ruins',cost:{wood:6,stone:6},reward:{emerald:1},time:1.5,hint:'6 Wood + 6 Stone → 1 Emerald'},
];
export const TREASURE_AT=[-2,5.5];
export function orderedTiles(site) {
  if(!site.tiles) return [];
  const distance=at=>Math.abs(at[0]-site.at[0])+Math.abs(at[1]-site.at[1])+Math.abs(at[0]+at[1]-site.at[0]-site.at[1]);
  const pending=[...site.tiles].sort((a,b)=>distance(a)-distance(b));
  const result=[];
  while(pending.length){
    let i=result.length?pending.findIndex(a=>result.some(b=>{const q=a[0]-b[0],r=a[1]-b[1];return (Math.abs(q)+Math.abs(r)+Math.abs(q+r))===2;})):0;
    if(i<0)i=0;
    result.push(pending.splice(i,1)[0]);
  }
  return result;
}
export function landCount(site,paid={}) {
  if(!site.tiles)return 0;
  const total=Object.values(site.cost).reduce((a,b)=>a+b,0);
  const invested=Object.values(paid[site.id]||{}).reduce((a,b)=>a+b,0);
  return Math.min(site.tiles.length,Math.floor(invested/total*site.tiles.length));
}
export function tilesFor(done,paid={}) {
  const map=new Map(START.map(at=>[at.join(','),{at,biome:'grass',from:null}]));
  for(const site of SITES){const list=orderedTiles(site);const count=done.includes(site.id)?list.length:landCount(site,paid);for(const at of list.slice(0,count))map.set(at.join(','),{at,biome:site.id==='meadow'&&at[0]>=3?'stone':site.id==='ruins'&&at[1]===2?'grass':site.biome,from:site.id});}
  return [...map.values()];
}
export function availableSites(s){return SITES.filter(p=>!s.done.includes(p.id)&&p.needs.every(n=>s.done.includes(n)));}
// Pointy hex lattice, shared by physics, pathing and the renderer.
export const xy=at=>({x:(at[0]+at[1]*.5)*TILE,z:at[1]*TILE*Math.sqrt(3)/2});
export function hexAt(x,z){const r=z/(TILE*Math.sqrt(3)/2),q=x/TILE-r*.5,y=-q-r;let rq=Math.round(q),rr=Math.round(r),ry=Math.round(y);const dq=Math.abs(rq-q),dr=Math.abs(rr-r),dy=Math.abs(ry-y);if(dq>dr&&dq>dy)rq=-ry-rr;else if(dr>dy)rr=-rq-ry;return [rq,rr];}


