export const cols = 34;
export const rows = 36;
export const cell = .25;
export const bottom = 1.64;
export const earth = 1;
export const rock = 2;
export const clay = 3; // diggable, but each cell counts as three dug cells
export const ice = 4;  // not diggable; melts after water touches it for a while
export const CLAY_COST = 3;
export const MELT_TICKS = 9;

export const CHAPTERS = [
  { name:'河谷初探', from:0 },
  { name:'红土高原', from:8, tip:'红土能挖，但挖一格算三格挖沙量。能绕就绕，绕太远又费水。' },
  { name:'冰川河谷', from:14, tip:'冰块挖不动。把水引过去冲一会儿，冰就会融化。' },
  { name:'金脉深处', from:20, tip:'红土和冰块会一起出现，先想好水的路线再动手。' },
];
export const chapterOf = i => CHAPTERS.reduce((found,ch,k)=>i>=ch.from?k:found,0);
export const maxDrops = 220;
const defaultDrains = [[0,cols-1]];
export const drainsFor = site => site.drains ?? defaultDrains;

// par = reference water drops / dug cells for the 2nd and 3rd star (see tools/solve-pars.mjs).
export const sites = [
  {
    name:'琥珀溪谷', springs:[17], sand:'#efc391', deep:'#c18963', sky:'#63d6cd', rim:'#cb725f',
    rocks:[[5,10,7,5],[22,20,10,6],[26,30,6,5],[3,26,4,7]],
    finds:[{c:17,r:13,type:'gold'},{c:11,r:25,type:'jade'}],
  },
  {
    name:'古河阶梯', springs:[9], sand:'#f1cc9d', deep:'#ca946d', sky:'#a192e4', rim:'#a367aa',
    rocks:[[24,9,12,5],[8,17,10,6],[13,29,10,6],[28,28,6,9]],
    finds:[{c:10,r:10,type:'gold'},{c:23,r:24,type:'ruby'}],
  },
  {
    name:'蓝晶矿窟', springs:[25], sand:'#ecc6a8', deep:'#bf8fa1', sky:'#82aaf0', rim:'#876cae',
    rocks:[[7,9,11,6],[21,17,8,8],[28,26,7,8],[6,30,10,5]],
    finds:[{c:24,r:9,type:'crystal'},{c:11,r:21,type:'jade'},{c:18,r:30,type:'ruby'}],
  },
  {
    name:'断桥浅滩', springs:[7], sand:'#f1c390', deep:'#d29b72', sky:'#f49a97', rim:'#be6576',
    rocks:[[10,13,14,5],[25,22,12,6],[7,25,7,8],[17,32,7,6]],
    finds:[{c:7,r:7,type:'gold'},{c:20,r:16,type:'crystal'},{c:27,r:29,type:'jade'}],
  },
  {
    name:'双泉峡谷', springs:[8,25], sand:'#f0cd92', deep:'#c39d71', sky:'#69cbdf', rim:'#5298aa',
    rocks:[[16,9,8,7],[5,19,7,7],[21,21,8,7],[16,30,11,7]],
    finds:[{c:9,r:10,type:'gold'},{c:7,r:27,type:'jade'},{c:25,r:15,type:'amber'},{c:28,r:28,type:'ruby'}],
  },
  {
    name:'赤岩折道', springs:[17], sand:'#efba95', deep:'#d38c83', sky:'#ea91ba', rim:'#ba6283',
    rocks:[[19,10,17,5],[9,19,14,6],[24,27,13,5],[5,31,6,6]],
    finds:[{c:9,r:11,type:'amber'},{c:20,r:19,type:'ruby'},{c:16,r:29,type:'gold'}],
  },
  {
    name:'翡翠筛场', springs:[16], sand:'#eace99', deep:'#bfa47e', sky:'#72d7ae', rim:'#589c8c',
    rocks:[[20,11,14,5],[7,20,10,7],[23,26,10,6],[10,31,8,5]],
    drains:[[24,29]],
    finds:[{c:11,r:12,type:'jade'},{c:17,r:24,type:'gold'},{c:25,r:33,type:'amber'}],
  },
  {
    name:'双溪遗宝', springs:[8,25], sand:'#f0c09d', deep:'#c896ab', sky:'#a28ded', rim:'#925eaa',
    rocks:[[15,10,11,6],[22,19,9,7],[9,23,7,7],[17,30,9,8]],
    drains:[[4,9],[25,30]],
    finds:[{c:8,r:12,type:'crystal'},{c:12,r:26,type:'jade'},{c:27,r:17,type:'ruby'},{c:26,r:30,type:'amber'}],
  },
  // ---- 第二章 红土高原：红土能挖，但一格算三格挖沙量 ----
  {
    name:'红土初试', springs:[17], sand:'#ebb58a', deep:'#b9765c', sky:'#f2a97c', rim:'#b8604f',
    rocks:[[8,9,9,5],[27,13,8,6],[6,30,8,5],[27,30,7,5]],
    clay:[[17,19,26,5]],
    finds:[{c:15,r:9,type:'gold'},{c:23,r:27,type:'jade'}],
  },
  {
    name:'赭石阶梯', springs:[5], sand:'#e9b88f', deep:'#b97a5e', sky:'#e7a0a6', rim:'#a8586a',
    rocks:[[14,8,12,4],[22,16,12,4],[11,24,12,4],[24,31,10,5]],
    clay:[[28,8,8,6],[5,17,8,6],[30,24,6,6]],
    finds:[{c:4,r:12,type:'gold'},{c:16,r:20,type:'crystal'},{c:27,r:27,type:'jade'}],
  },
  {
    name:'泥中双泉', springs:[7,26], sand:'#ecb995', deep:'#bc7d63', sky:'#f0b07a', rim:'#b5674d',
    rocks:[[17,12,6,15],[4,29,6,6],[30,29,6,6]],
    clay:[[7,22,12,4],[26,22,12,4]],
    drains:[[12,21]],
    finds:[{c:7,r:9,type:'gold'},{c:26,r:9,type:'amber'},{c:11,r:28,type:'jade'},{c:23,r:30,type:'ruby'}],
  },
  {
    name:'窄缝红岩', springs:[17], sand:'#eab18c', deep:'#b37159', sky:'#e98f8f', rim:'#a5525a',
    rocks:[[8,11,14,5],[26,11,14,5],[17,22,10,5],[5,25,8,6],[29,25,8,6],[19,33,8,3]],
    clay:[[17,15,8,4]],
    finds:[{c:17,r:7,type:'crystal'},{c:17,r:16,type:'gold'},{c:24,r:19,type:'jade'},{c:10,r:31,type:'amber'}],
  },
  {
    name:'赤土回廊', springs:[30], sand:'#edb48c', deep:'#bb735a', sky:'#f6a786', rim:'#b25c48',
    rocks:[[20,8,27,3],[14,16,27,3],[20,24,27,3],[14,31,23,3]],
    clay:[[3,8,7,4],[31,16,6,4],[3,24,7,4]],
    drains:[[27,33]],
    finds:[{c:16,r:4,type:'gold'},{c:20,r:12,type:'crystal'},{c:12,r:20,type:'jade'},{c:22,r:28,type:'ruby'}],
  },
  {
    name:'红土宝库', springs:[10,24], sand:'#ecb48f', deep:'#b8705c', sky:'#d993b5', rim:'#9d5272',
    rocks:[[4,14,6,8],[30,14,6,8],[17,27,6,6],[5,30,7,5],[29,30,7,5]],
    clay:[[17,13,14,10]],
    drains:[[14,20]],
    finds:[{c:17,r:13,type:'gold'},{c:9,r:24,type:'jade'},{c:25,r:24,type:'crystal'},{c:17,r:33,type:'amber'}],
  },
  // ---- 第三章 冰川河谷：冰块挖不动，让水流冲一会儿就会融化 ----
  {
    name:'初见冰层', springs:[17], sand:'#e7ddce', deep:'#a7a3b8', sky:'#8fd0f2', rim:'#5d89b5',
    rocks:[[7,14,11,5],[27,14,11,5],[6,28,8,6],[28,28,8,6]],
    ice:[[13,13,9,2]],
    finds:[{c:17,r:8,type:'crystal'},{c:17,r:26,type:'jade'}],
  },
  {
    name:'冰封红晶', springs:[8], sand:'#e9dfcf', deep:'#a9a1b6', sky:'#9ec6f5', rim:'#6a7fbd',
    rocks:[[17,7,6,7],[16,19,20,4],[29,28,8,6],[5,31,7,5]],
    ice:[[22,10,5,4]],
    finds:[{c:7,r:12,type:'gold'},{c:24,r:11,type:'ruby'},{c:15,r:28,type:'jade'}],
  },
  {
    name:'冰墙双泉', springs:[6,27], sand:'#e6dccf', deep:'#a4a2bb', sky:'#86c2e8', rim:'#5578a8',
    rocks:[[17,10,8,12],[17,29,8,6]],
    ice:[[0,20,34,2]],
    finds:[{c:6,r:12,type:'gold'},{c:27,r:12,type:'crystal'},{c:9,r:30,type:'jade'},{c:25,r:30,type:'amber'}],
  },
  {
    name:'冰川折道', springs:[6], sand:'#e8decf', deep:'#a8a0b4', sky:'#a3bdf0', rim:'#6b73b5',
    rocks:[[12,8,25,3],[22,16,25,3],[12,24,25,3]],
    ice:[[25,7,9,2],[0,15,10,2],[25,23,9,2]],
    finds:[{c:15,r:4,type:'gold'},{c:18,r:12,type:'crystal'},{c:14,r:20,type:'jade'},{c:20,r:29,type:'ruby'}],
  },
  {
    name:'冰下双藏', springs:[12], sand:'#e9e0d2', deep:'#aaa5b9', sky:'#93d6e6', rim:'#4f8fa3',
    rocks:[[17,12,6,8],[9,29,12,4],[28,8,8,5]],
    ice:[[4,14,5,4],[20,22,5,4]],
    drains:[[24,30]],
    finds:[{c:12,r:7,type:'jade'},{c:6,r:15,type:'amber'},{c:22,r:23,type:'crystal'}],
    route:[[[12,-0.4],[12,7],[6,12],[6,19],[22,20],[22,26],[27,30],[27,35.6]]],
  },
  {
    name:'冰河终点', springs:[9,25], sand:'#e6ddd0', deep:'#a3a0b9', sky:'#8fb4ef', rim:'#5a6db0',
    rocks:[[17,9,6,11],[6,27,6,6],[28,27,6,6]],
    ice:[[0,17,34,1],[14,30,6,2]],
    drains:[[14,19]],
    finds:[{c:5,r:10,type:'ruby'},{c:28,r:9,type:'gold'},{c:12,r:24,type:'crystal'},{c:22,r:26,type:'amber'}],
  },
  // ---- 第四章 金脉深处：红土和冰块一起出现 ----
  {
    name:'金脉入口', springs:[17], sand:'#f0c98e', deep:'#b9876a', sky:'#f3c26b', rim:'#b8743d',
    rocks:[[6,14,8,8],[28,14,8,8],[6,28,8,6],[28,28,8,6]],
    clay:[[17,9,10,4]], ice:[[13,21,9,2]],
    drains:[[14,20]],
    finds:[{c:17,r:5,type:'gold'},{c:17,r:16,type:'jade'},{c:17,r:28,type:'ruby'}],
  },
  {
    name:'九曲金河', springs:[3], sand:'#f1c793', deep:'#bb8569', sky:'#e8b26f', rim:'#a8693c',
    rocks:[[13,8,22,3],[21,15,22,3],[13,22,22,3],[21,29,22,3]],
    clay:[[30,8,6,3]], ice:[[2,15,5,2],[29,22,5,2]],
    drains:[[29,33]],
    finds:[{c:18,r:4,type:'gold'},{c:14,r:12,type:'crystal'},{c:20,r:19,type:'jade'},{c:12,r:26,type:'amber'},{c:22,r:33,type:'ruby'}],
  },
  {
    name:'冰火双泉', springs:[8,26], sand:'#f0c595', deep:'#b9806d', sky:'#c99be6', rim:'#8a5aa8',
    rocks:[[17,13,4,20],[17,31,10,4]],
    clay:[[8,18,12,5]], ice:[[22,15,8,3]],
    drains:[[0,5],[28,33]],
    finds:[{c:8,r:8,type:'gold'},{c:26,r:8,type:'amber'},{c:5,r:27,type:'jade'},{c:29,r:27,type:'crystal'}],
  },
  {
    name:'黄金矿心', springs:[10,24], sand:'#f2c88c', deep:'#bd8763', sky:'#f0a95e', rim:'#b0603a',
    rocks:[[17,8,8,6],[4,18,6,10],[30,18,6,10],[10,27,6,4],[24,27,6,4]],
    clay:[[17,20,10,6]], ice:[[15,31,4,2]],
    drains:[[14,19]],
    finds:[{c:10,r:6,type:'ruby'},{c:24,r:6,type:'crystal'},{c:17,r:20,type:'gold'},{c:17,r:28,type:'amber'}],
  },
];


// Star thresholds [water drops, dug cells]: solver best water ×1.3+12, dig ×1.35+10 (tools/solve-pars.mjs).
const pars=[[60,168],[60,194],[117,203],[72,210],[108,308],[65,198],[64,184],[119,310],[60,222],[71,234],[111,375],[72,248],[147,431],[111,472],[81,148],[120,262],[150,299],[163,299],[353,233],[142,397],[64,213],[147,388],[111,356],[113,353]];
sites.forEach((site,i)=>{const [water,dig]=pars[i]??[999,9999];site.par={water,dig};});

export const finds = {
  gold: { name:'金砂', hue:'#ffcb60', score:5 },
  jade: { name:'翡翠', hue:'#59e9ba', score:10 },
  ruby: { name:'日光红晶', hue:'#ff777f', score:13 },
  crystal: { name:'蓝晶', hue:'#8fc9ff', score:12 },
  amber: { name:'琥珀', hue:'#ffa74f', score:15 },
  // Bonus gold flakes: optional pickups that pay coins but cost extra digging and water.
  flake: { name:'沙金', hue:'#ffd96a', score:3 },
};

export const worldX = c => (c+.5-cols/2)*cell;
export const worldY = r => bottom+(rows-r-.5)*cell;
const indexOf = (c,r) => r*cols+c;
const inBounds = (c,r) => c>=0&&c<cols&&r>=0&&r<rows;

export function rockMask(site) {
  const owner=new Int8Array(cols*rows).fill(-1);
  for(const [k,[centerC,centerR,width,height]] of site.rocks.entries()){
    for(let r=Math.max(0,Math.floor(centerR-height/2));r<=Math.min(rows-1,Math.ceil(centerR+height/2));r++){
      for(let c=Math.max(0,Math.floor(centerC-width/2));c<=Math.min(cols-1,Math.ceil(centerC+width/2));c++){
        if(((c-centerC)/(width*.5))**2+((r-centerR)/(height*.5))**2<=1)owner[indexOf(c,r)]=k;
      }
    }
  }
  return owner;
}

const inEllipse=(c,r,[cc,cr,w,h])=>((c-cc)/(w*.5))**2+((r-cr)/(h*.5))**2<=1;
const inRect=(c,r,[c0,r0,w,h])=>c>=c0&&c<c0+w&&r>=r0&&r<r0+h;
// Base terrain for a site: earth, rocks, clay ellipses and ice rectangles.
export function terrainOf(site) {
  const owner=rockMask(site);
  const land=new Uint8Array(cols*rows).fill(earth);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const i=indexOf(c,r);
    if(owner[i]>=0){land[i]=rock;continue;}
    if(site.ice?.some(box=>inRect(c,r,box)))land[i]=ice;
    else if(site.clay?.some(blob=>inEllipse(c,r,blob)))land[i]=clay;
  }
  return {land,owner};
}

// Deterministic flake spots per site: in loose sand, away from rocks, gems, springs and each other.
export function flakeSpots(site,count=3) {
  const owner=rockMask(site);
  let seed=[...site.name].reduce((s,ch)=>Math.imul(s^ch.charCodeAt(0),16777619)>>>0,2166136261);
  const rand=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
  const spots=[];
  for(let attempt=0;attempt<800&&spots.length<count;attempt++){
    const c=3+Math.floor(rand()*(cols-6)), r=6+Math.floor(rand()*(rows-10));
    let clear=true;
    for(let y=r-2;y<=r+2&&clear;y++)for(let x=c-2;x<=c+2;x++)if(inBounds(x,y)&&owner[indexOf(x,y)]>=0){clear=false;break;}
    if(!clear)continue;
    if(site.ice?.some(box=>inRect(c,r,[box[0]-1,box[1]-1,box[2]+2,box[3]+2])))continue;
    if(site.finds.some(f=>Math.hypot(f.c-c,f.r-r)<5.5))continue;
    if(site.springs.some(s=>Math.abs(s-c)<3))continue;
    if(spots.some(([x,y])=>Math.hypot(x-c,y-r)<7))continue;
    spots.push([c,r]);
  }
  return spots;
}

export function createSluice(site) {
  const {land,owner} = terrainOf(site);
  const melt = new Uint8Array(cols*rows);
  const cache = new Uint8Array(cols*rows);
  const treasure = site.finds.map((item,id)=>({...item,id,carrier:null,found:false,bonus:false}));
  for(const [c,r] of site.flakes ?? flakeSpots(site)){
    treasure.push({c,r,type:'flake',id:treasure.length,carrier:null,found:false,bonus:true});
  }
  const water = [];
  const drains = new Uint8Array(cols);
  for(const [from,to] of drainsFor(site))drains.fill(1,from,to+1);
  let serial=0;
  const rocks=site.rocks.map(()=>[]);
  for(let i=0;i<owner.length;i++)if(owner[i]>=0)rocks[owner[i]].push(i);
  const model={ land,melt,treasure,water,rocks,drains,dig,step,blast,used:0,dug:0,reach:2.43,
    melted:[], required:treasure.filter(t=>!t.bonus) };

  // Explosives turn a whole rock into open space; those cells do not count as dug sand.
  function blast(k) {
    const cells=rocks[k];
    if(!cells?.length)return [];
    for(const i of cells)if(land[i]===rock)land[i]=0;
    rocks[k]=[];
    return cells;
  }

  function dig(c,r,radius=1.86) {
    const opened=[];
    const lowC=Math.max(0,Math.floor(c-radius)), highC=Math.min(cols-1,Math.ceil(c+radius));
    const lowR=Math.max(0,Math.floor(r-radius)), highR=Math.min(rows-1,Math.ceil(r+radius));
    for(let x=lowC;x<=highC;x++){
      for(let y=lowR;y<=highR;y++){
        const i=indexOf(x,y);
        if((land[i]===earth||land[i]===clay) && (x-c)**2+(y-r)**2<=radius*radius){
          model.dug+=land[i]===clay?CLAY_COST:1;
          land[i]=0;
          opened.push(i);
        }
      }
    }
    return opened;
  }

  function open(c,r) {return inBounds(c,r)&&land[indexOf(c,r)]===0;}
  function free(c,r) {return open(c,r)&&!cache[indexOf(c,r)];}

  function direction(drop) {
    const {c,r,bias}=drop;
    if(free(c,r+1))return [c,r+1];
    for(const sign of [bias,-bias]){
      if(free(c+sign,r+1)&&(open(c+sign,r)||open(c,r+1)))return [c+sign,r+1];
    }
    let best=null, distance=cols;
    for(const sign of [bias,-bias]){
      if(!free(c+sign,r))continue;
      for(let offset=1;offset<cols;offset++){
        const across=c+offset*sign;
        if(!open(across,r))break;
        if(r===rows-1 ? drains[across] : open(across,r+1)){
          if(offset<distance){best=[c+sign,r];distance=offset;}
          break;
        }
      }
    }
    if(best)return best;
    if(drop.stuck<=3){
      if(free(c+bias,r))return [c+bias,r];
      if(free(c-bias,r))return [c-bias,r];
    }
    return null;
  }

  function bindTreasure(drop) {
    if(drop.cargo)return;
    for(const jewel of treasure){
      if(jewel.found||jewel.carrier||!open(jewel.c,jewel.r))continue;
      if(Math.hypot(jewel.c-drop.c,jewel.r-drop.r)>model.reach)continue;
      jewel.carrier=drop;
      drop.cargo=jewel;
      return;
    }
  }

  function step(running) {
    const recovered=[];
    cache.fill(0);
    for(const d of water)cache[indexOf(d.c,d.r)]=1;
    if(running) {
      for(const spring of site.springs){
        if(water.length>=maxDrops)break;
        const c=[spring,spring-1,spring+1].find(candidate=>free(candidate,0));
        if(c===undefined)continue;
        const id=serial++;
        model.used++;
        water.push({id,c,r:0,pc:c,pr:-1,bias:id%2?1:-1,stuck:0,cargo:null});
        cache[indexOf(c,0)]=1;
      }
    }

    water.sort((a,b)=>a.r-b.r||b.id-a.id);
    for(let i=water.length-1;i>=0;i--){
      const d=water[i];
      d.pc=d.c; d.pr=d.r;
      bindTreasure(d);
      if(d.r===rows-1 && drains[d.c]){
        if(d.cargo){
          const prize=d.cargo;
          prize.c=d.c;
          prize.r=d.r;
          prize.carrier=null;
          prize.found=true;
          recovered.push(prize);
        }
        model.drained=(model.drained||0)+1;
        model.lastDrain=d.c;
        cache[indexOf(d.c,d.r)]=0;
        water.splice(i,1);
        continue;
      }
      const next=direction(d);
      if(next){
        cache[indexOf(d.c,d.r)]=0;
        const lowered=next[1]>d.r;
        [d.c,d.r]=next;
        cache[indexOf(d.c,d.r)]=1;
        d.stuck=lowered?0:d.stuck+1;
        bindTreasure(d);
      } else d.stuck++;
      if(d.stuck<=cols+10)continue;
      if(d.cargo){
        d.cargo.carrier=null;d.cargo.c=d.c;d.cargo.r=d.r;
      }
      cache[indexOf(d.c,d.r)]=0;
      water.splice(i,1);
    }
    // Ice touching water (side or below) slowly melts into open space.
    for(const d of water){
      for(const [dc,dr] of [[0,1],[1,0],[-1,0],[0,-1]]){
        const x=d.c+dc,y=d.r+dr;
        if(!inBounds(x,y))continue;
        const i=indexOf(x,y);
        if(land[i]!==ice)continue;
        if(++melt[i]>=MELT_TICKS){land[i]=0;model.melted.push(i);}
      }
    }
    return recovered;
  }
  return model;
}
