import {createState,restore,build,validateBuild,GRID,snap,tileBuildings,RECIPES,invalidateBuildings,collides,floorHeight} from './rules.mjs';
import {newWorldSettings,isArchitect} from './world-state.mjs';
import {dayPlan} from './frontier-state.mjs';
import {streamResources} from './survival.mjs';

export function createSandbox({id='world',name='我的新世界',mode='creative',preset='blank',seed=12345}={}){
 const s=createState();s.world={...newWorldSettings(),id,name:name.trim().slice(0,24)||'我的新世界',mode:mode==='survival'?'survival':'creative',calm:mode!=='survival'};
 s.won=true;s.free=true;s.day=4;s.axe=true;s.visitedReef=true;
 for(const k of ['wood','deck','roof','fire','axe','reef','brace'])s.milestones[k]=true;
 Object.assign(s.voyage,{started:true,completed:true,resultSeen:true,warmer:true,charges:3});
 s.survival={...s.survival,started:true,completed:true,resultSeen:true,day:4,seed:seed>>>0,creative:true};s.survival.plan=dayPlan(s.survival.seed,4);
 if(preset==='camp'){
  s.world.editor=true;
  for(const [type,x,z]of [['platform',-2.2,2.2],['cabin',-2.2,2.2],['stove',0,2.2],['lantern',-4.4,2.2]]){
   const result=build(s,type,x,z);if(!result.ok)throw Error(result.message);
  }
  s.world.editor=false;s.world.home={x:-2.2,z:2.2};
 }
 s.survival.creative=s.world.mode==='creative';s.inventory=s.world.mode==='survival'?{wood:36,stone:24,fiber:18,metal:8}:{wood:0,stone:0,fiber:0,metal:0};
 return s;
}
export function applyWorldSettings(s,values){
 const w=s.world;if(typeof values.name==='string')w.name=values.name.trim().slice(0,24)||w.name;
 if(s.survival.started){
  w.mode=values.mode==='creative'?'creative':'survival';s.survival.creative=w.mode==='creative';
  w.calm=w.mode==='creative'&&Boolean(values.calm);w.frozen=Boolean(values.frozen);w.pace=[.75,1,1.5].includes(Number(values.pace))?Number(values.pace):1;
 }
 if(['sea','sunset','meadow'].includes(values.style))w.style=values.style;
}
export function homePosition(s){return s.world.home||s.buildings.find(b=>b.type==='cabin')||{x:0,z:3.6};}
export function visitPosition(s,p){
 if(s.world.mode!=='creative')return{ok:false,message:'自由世界可以瞬间回家；生存模式请步行或划船返航。'};
 streamResources(s,p);const candidates=[p];for(let r=.6;r<=5;r+=.6)for(let a=0;a<Math.PI*2;a+=Math.PI/6)candidates.push({x:p.x+Math.cos(a)*r,z:p.z+Math.sin(a)*r});
 const q=candidates.find(p=>floorHeight(s,p.x,p.z)>.15&&!collides(s,p.x,p.z));if(!q)return{ok:false,message:'这里没有安全落脚点，先铺地板或把镜头移到空地。'};
 if(s.voyage.boat?.aboard)s.voyage.boat.aboard=false;s.player={...q,angle:0};s.warmth=100;return{ok:true,message:'可以在这里漫游，亲自看看刚建好的世界了。'};
}

export function returnHome(s){return visitPosition(s,homePosition(s));}

// History records only changed building objects and material deltas, never time,
// weather, exploration or complete world copies. It is confined to one edit session.
export function createBuildHistory(s){
 const undo=[],redo=[];
 function apply(entry,reverse){
  const from=reverse?entry.after:entry.before,to=reverse?entry.before:entry.after,ids=new Set([...from,...to].map(b=>b.id));
  s.buildings=s.buildings.filter(b=>!ids.has(b.id));s.buildings.push(...structuredClone(to));s.buildings.sort((a,b)=>a.id-b.id);
  for(const [k,v]of Object.entries(entry.materials))s.inventory[k]+=(reverse?-1:1)*v;
  s.stats.built+=(reverse?-1:1)*entry.built;invalidateBuildings(s);
 }
 return{
  run(fn){
   if(!isArchitect(s))return{ok:false,message:'先开启自由营造的建造视角。'};
   const before=new Map(s.buildings.map(b=>[b.id,JSON.stringify(b)])),inventory={...s.inventory},built=s.stats.built;
   const res=fn();if(!res.ok)return res;
   const after=new Map(s.buildings.map(b=>[b.id,JSON.stringify(b)])),changed=[...new Set([...before.keys(),...after.keys()])].filter(id=>before.get(id)!==after.get(id));
   if(changed.length){undo.push({before:changed.filter(id=>before.has(id)).map(id=>JSON.parse(before.get(id))),after:changed.filter(id=>after.has(id)).map(id=>JSON.parse(after.get(id))),materials:Object.fromEntries(Object.entries(s.inventory).map(([k,v])=>[k,v-inventory[k]])),built:s.stats.built-built});if(undo.length>30)undo.shift();redo.length=0;}
   return res;
  },
  undo(){if(!isArchitect(s)||!undo.length)return false;const e=undo.pop();apply(e,true);redo.push(e);return true;},
  redo(){if(!isArchitect(s)||!redo.length)return false;const e=redo.pop();apply(e,false);undo.push(e);return true;},
  get undoCount(){return undo.length;},get redoCount(){return redo.length;},clear(){undo.length=redo.length=0;},
 };
}
export function validatePatch(s,type,x,z,rotation=0,size=1){
 if(!isArchitect(s)||!['platform','bridge'].includes(type)||size===1)return validateBuild(s,type,x,z,{rotation});
 const tiles=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const p={x:snap(x+dx*GRID),z:snap(z+dz*GRID)};if(!tileBuildings(s,p.x,p.z).length)tiles.push(p);}
 if(!tiles.length)return{ok:false,message:'这片已经铺好了，换一处继续。'};
 for(const p of tiles){const v=validateBuild(s,type,p.x,p.z,{rotation});if(!v.ok)return v;}
 return{ok:true,message:`将铺设 ${tiles.length} 格，跳过已有建筑；这一整笔可以撤销。`,tiles};
}
export function placePatch(s,type,x,z,rotation=0,size=1){
 if(!isArchitect(s)||!['platform','bridge'].includes(type)||size===1)return build(s,type,x,z,rotation);
 const plan=validatePatch(s,type,x,z,rotation,size);if(!plan.ok)return plan;
 for(const p of plan.tiles)build(s,type,p.x,p.z,rotation);
 return{ok:true,message:`一次铺好了 ${plan.tiles.length} 格${RECIPES[type].name}，可以撤销这一整笔。`};
}

export function createWorldLibrary(storage,key){
 const INDEX=key+'-worlds-v4',slot=id=>key+'-world-'+id;
 function index(){try{const raw=JSON.parse(storage.getItem(INDEX));if(raw?.version===1&&Array.isArray(raw.worlds))return raw;}catch{}return{version:1,active:null,worlds:[]};}
 function commit(i){storage.setItem(INDEX,JSON.stringify(i));}
 function id(){return 'w'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);}
 function store(s,i){
  const text=JSON.stringify(s);storage.setItem(slot(s.world.id),text);
  const summary={id:s.world.id,name:s.world.name,day:s.survival.started?s.survival.day:s.day,mode:s.world.mode,buildings:s.buildings.length,updated:Date.now()},at=i.worlds.findIndex(w=>w.id===summary.id);
  if(at<0)i.worlds.push(summary);else i.worlds[at]=summary;commit(i);
 }
 return{
  list:()=>index(),newId:id,
  save(s){const i=index();store(s,i);i.active=s.world.id;commit(i);storage.setItem(key,JSON.stringify(s));},
  load(worldId){const s=restore(JSON.parse(storage.getItem(slot(worldId))||'null'));if(!s)throw Error('这个世界暂时无法读取，当前世界仍保留。');s.world.id=worldId;return s;},
  add(s){const i=index();if(i.worlds.some(w=>w.id===s.world.id))throw Error('世界编号重复。');store(s,i);},
  duplicate(s){const copy=restore(JSON.parse(JSON.stringify(s)));copy.world.id=id();copy.world.name=(s.world.name.slice(0,18)+' · 副本').slice(0,24);this.add(copy);return copy;},
  import(text){if(text.length>8*1024*1024)throw Error('这个文件太大，当前导入支持 8 MB 以内的世界备份。');const raw=JSON.parse(text),s=restore(raw.state||raw);if(!s)throw Error('这不是可读取的小岛世界备份。');s.world.id=id();this.add(s);return s;},
 };
}
