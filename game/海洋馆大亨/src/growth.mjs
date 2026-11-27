import {SPECIES,UPGRADES} from './data.mjs';

// Exactly one physical tank per species. Its inner edge stays fixed as it grows outwards.
export function tankShape(base,tank={}){
 const steps=Math.max(0,(tank.level||1)-1)+(tank.bonusCapacity||0)/7;
 const r=base.r+1.3*(1-Math.exp(-steps*.28)),heightScale=1+.10*Math.log2(1+steps);
 return {r,heightScale,x:Math.sign(base.x)*(Math.abs(base.x)-base.r+r),z:base.z};
}
export function galleryDefinitions(tanks={}){
 const defs=SPECIES.map((d,i)=>({...d,...tankShape(d,tanks[d.id]),baseRadius:d.r,kind:d.id,number:i+1,extension:false}));
 defs.byRow=new Map();for(const d of defs)for(let row=Math.floor((d.z-d.r-.7)/12);row<=Math.floor((d.z+d.r+.7)/12);row++){if(!defs.byRow.has(row))defs.byRow.set(row,[]);defs.byRow.get(row).push(d);}return defs;
}
export const galleryEnd=()=>34;
export function consolidateLegacyTanks(saved){
 if(saved.growthVersion!==1)return saved;
 const tanks={},oldLevels=Object.values(saved.tanks||{}).reduce((n,t)=>n+(t.built?Math.max(0,Math.min(10000,t.level||1)-1):0),0);
 for(const base of SPECIES){const sources=[saved.tanks?.[base.id]];for(const [id,t] of Object.entries(saved.tanks||{})){const m=/^gallery-(\d+)$/.exec(id);if(m&&SPECIES[Number(m[1])%6].id===base.id&&t.built)sources.push(t);}const owned=sources.filter(t=>t?.built),level=Math.max(1,...owned.map(t=>Math.min(10000,Math.max(1,t.level||1))));let capacity=0,stock=0,rareStock=0;
  for(const t of owned){const c=16+(Math.min(10000,Math.max(1,t.level||1))-1)*7;capacity+=c;stock+=Math.max(0,Math.min(t.stock||0,c));rareStock+=Math.max(0,Math.min(t.rareStock||0,t.stock||0,c));}
  tanks[base.id]={built:base.id==='clown'||owned.length>0,level,stock,rareStock,bonusCapacity:Math.max(0,capacity-(16+(level-1)*7))};
 }
 const mergedLevels=Object.values(tanks).reduce((n,t)=>n+(t.built?t.level-1:0),0),rareExhibits={};for(const kind of Object.keys(saved.rareExhibits||{}))if(tanks[kind]?.built)rareExhibits[kind]=kind;
 return {...saved,growthVersion:2,tanks,rareExhibits,legacyLevelCredit:Math.max(0,oldLevels-mergedLevels),migrationNotice:true,guests:[],staff:(saved.staff||[]).map(a=>({...a,tank:a.kind,path:[],mode:'choose'}))};
}
export function growingPrice(base,level,factor=1.7,knee=8){return Math.round(base*Math.pow(factor,Math.min(level,knee))*Math.pow(1+Math.max(0,level-knee)/5,2.2));}
export function museumLevel(earned,expansions=0,upgrades=0){return 1+Math.floor(Math.sqrt(Math.max(0,earned)/180))+Math.floor(expansions*1.5)+Math.floor(upgrades/8);}
export function equipmentLimit(id,level,expansions){const stage=Math.floor((level-1)/5);return UPGRADES[id].max+(id==='staff'?Math.floor(stage/2):stage*(id==='bag'?4:3)+expansions);}
export const TITLE_TIERS=[
 {name:'海边小馆长',level:1,wealth:0,color:'#71d9c4'},
 {name:'珊瑚收藏家',level:3,wealth:1200,color:'#79cdd8'},
 {name:'珍珠馆长',level:6,wealth:6000,color:'#bcb1ed'},
 {name:'星光策展人',level:10,wealth:20000,color:'#ffcf76'},
 {name:'蔚蓝领航者',level:16,wealth:60000,color:'#67d8e7'},
 {name:'海洋传奇',level:25,wealth:180000,color:'#efa1cb'},
 {name:'璀璨海洋之冠',level:40,wealth:600000,color:'#ffd76c'}
];
export function honorFor(level,earned){let rank=0;for(let i=1;i<TITLE_TIERS.length;i++)if(level>=TITLE_TIERS[i].level||earned>=TITLE_TIERS[i].wealth)rank=i;
 if(rank===6){const extra=Math.max(0,Math.floor((level-40)/20),Math.floor(Math.log(Math.max(1,earned/600000))/Math.log(4)));return {...TITLE_TIERS[6],rank:6+extra,name:TITLE_TIERS[6].name+(extra?' · '+(extra+1)+'星':'')};}return {...TITLE_TIERS[rank],rank};}
export function nextHonor(honor){return honor.rank<6?TITLE_TIERS[honor.rank+1]:{name:'璀璨海洋之冠 · '+(honor.rank-4)+'星',level:40+(honor.rank-5)*20,wealth:600000*Math.pow(4,honor.rank-5)};}
export const RARE_NAMES={clown:'日耀小丑鱼',tang:'月辉蓝吊鱼',koi:'流金锦鲤',butterfly:'琉璃蝴蝶鱼',ray:'星河斑点鳐',shark:'极光黑鳍鲨'};
export const RARE_COLORS={clown:'#ffda7b',tang:'#bdacf7',koi:'#f9d273',butterfly:'#e998dc',ray:'#9cacf7',shark:'#83e9ce'};
export function wealthShape(cash){return {count:cash>0?Math.min(360,Math.ceil(cash/20)):0,height:1+Math.max(0,Math.log10(Math.max(1,cash/7200)))*.22};}
