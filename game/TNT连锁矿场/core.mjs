export const COLS = 7;
export const MIN_RANDOM_ENERGY=52;
export const EXPLORATION_ALLOWANCE=14;
export const DEPTH_SUPPLIES=[{depth:8,amount:6},{depth:16,amount:6}];
export const TYPES = {
  dirt: {name:'Dirt', hp:1, value:0, color:'#946951'},
  stone: {name:'Stone', hp:2, value:0, color:'#7b8789'},
  coal: {name:'Coal', hp:1, value:8, color:'#b3beb6'},
  gold: {name:'Gold', hp:2, value:35, color:'#f8c85c'},
  diamond: {name:'Diamond', hp:3, value:100, color:'#62d8d4'},
  tnt: {name:'TNT', hp:1, value:0, color:'#e56849'},
  bedrock: {name:'Bedrock', hp:Infinity, value:0, color:'#414c56'},
  cache: {name:'Core Cache', hp:1, value:300, color:'#ffdb8c'}
};
const SYMBOLS = {'.':null,d:'dirt',s:'stone',c:'coal',g:'gold',D:'diamond',T:'tnt',X:'bedrock',C:'cache'};
export const LESSONS = [
  {id:0, name:'A little dynamite', subtitle:'ONE GOOD SPARK', budget:14,
    hint:'Dig the dirt above the TNT. One spark can start a chain.', goal:'Collect 200 treasure', target:200,
    rows:['dd.d.cd','cd.dgd.','.sdTgsd','sgTTgs.','sgDDgcs','.sgsgs.','XXsssXX']},
  {id:1, name:'The clever way down', subtitle:'SAVE YOUR PICKAXE', budget:20,
    hint:'Diamonds take 3 hits. A nearby TNT clears them for just 1.', goal:'Collect 4 diamonds', diamonds:4,
    rows:['dc.s.dd','dsTgds.','.gDDTsd','sXsgDgs','gXTgDsc','sXgsgs.','.sgTgc.','sgDDgs.','XXsssXX']},
  {id:2, name:'Follow the fuse', subtitle:'THE FIRST EXPEDITION', budget:28,
    hint:'Follow the TNT pockets to the golden cache at 12 m.', goal:'Find the Core Cache', cache:true,
    rows:['dd.d.dd','dsdTgs.','.gDgTsc','sgsgXs.','csDgXgs','sTsgDgs','sTDDgc.','sXsgDgs','sXgggs.','sgDgTss','.sggTss','XXgCgXX']}
];
export function rng(seed) { let a=seed>>>0; return ()=>{a+=0x6D2B79F5; let t=a; t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}; }
export function createRun(mode='lesson', index=0, seed=1) {
  const random=rng(seed), spec=LESSONS[index] || LESSONS[0]; let grid;
  if(mode==='lesson') grid=spec.rows.map(row=>[...row].map(s=>SYMBOLS[s]));
  else {
    grid=Array.from({length:24},(_,r)=>Array.from({length:COLS},()=>{
      const n=random(); return r<2?(n<.65?'dirt':n<.83?'coal':'stone'):n<.025?'tnt':n<.16?'coal':n<.34?'gold':n<.43?'diamond':n<.49?'dirt':'stone';
    }));
    // A dependable, inexpensive descent with optional richer side pockets.
    let col=3;
    grid[0][col]='dirt';
    for(let r=2;r<23;r+=4){col=Math.max(1,Math.min(5,col+Math.floor(random()*3)-1));grid[r][col]='tnt';grid[r-1][col]='stone';
      const side=col+(col<3?1:-1);grid[r][side]=random()<.5?'tnt':'gold';grid[Math.min(23,r+1)][side]='diamond';}
    grid[23][3]='cache';grid[22][3]='tnt';grid[23][0]='bedrock';grid[23][6]='bedrock';
    // Natural cavities break up the wall. Only ordinary rock is carved; no
    // treasure/TNT is silently removed and the core route remains intact.
    for(let r=0;r<23;r+=3){const center=1+Math.floor(random()*5);for(let y=r;y<Math.min(23,r+2);y++)for(let x=center-1;x<=Math.min(6,center+1);x++)if(['stone','dirt'].includes(grid[y][x])&&random()<.75)grid[y][x]=null;}
    grid[0][3]='dirt';
  }
  const run={version:1,mode,index,seed:seed>>>0,grid,hits:grid.map(row=>row.map(()=>0)),
    maxEnergy:spec.budget,energy:spec.budget,balanceVersion:3,repairCount:0,depthBonuses:[],
    score:0,loot:{coal:0,gold:0,diamond:0,cache:0},blasts:0,bestChain:0,broken:0,depth:0,strikes:0,status:'active'};
  if(mode==='random'){const route=cacheRoute(run);if(!Number.isFinite(route.cost))throw Error('Generated mine has no route to its cache');run.routeCostAtStart=route.cost;run.energy=run.maxEnergy=Math.max(MIN_RANDOM_ENERGY,route.cost+EXPLORATION_ALLOWANCE);run.baseEnergy=run.maxEnergy;}
  return run;
}
export function neighbors(r,c){return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];}
export function inBounds(run,r,c){return Number.isInteger(r)&&Number.isInteger(c)&&r>=0&&r<run.grid.length&&c>=0&&c<COLS;}
export function frontier(run) {
  const air=new Set(),queue=[];
  for(let c=0;c<COLS;c++)if(!run.grid[0][c]){air.add(`0,${c}`);queue.push([0,c]);}
  for(let i=0;i<queue.length;i++)for(const [r,c] of neighbors(...queue[i]))if(inBounds(run,r,c)&&!run.grid[r][c]&&!air.has(`${r},${c}`)){air.add(`${r},${c}`);queue.push([r,c]);}
  const edge=new Set();for(let c=0;c<COLS;c++)if(run.grid[0][c]&&run.grid[0][c]!=='bedrock')edge.add(`0,${c}`);
  for(const p of queue)for(const [r,c]of neighbors(...p))if(inBounds(run,r,c)&&run.grid[r][c]&&run.grid[r][c]!=='bedrock')edge.add(`${r},${c}`);
  return edge;
}
export function canMine(run,r,c){return run.status==='active'&&inBounds(run,r,c)&&frontier(run).has(`${r},${c}`);}
// Conservative path cost: every solid block is charged at its remaining
// hardness, even TNT. Actual chain reactions can only make this route cheaper.
export function cacheRoute(run){
  const count=run.grid.length*COLS,dist=new Float64Array(count).fill(Infinity),prev=new Int16Array(count).fill(-1),closed=new Uint8Array(count);
  const cost=(r,c)=>{const t=run.grid[r][c];return t==='bedrock'?Infinity:t?Math.max(1,TYPES[t].hp-run.hits[r][c]):0;};
  for(let c=0;c<COLS;c++)dist[c]=cost(0,c);let end=-1;
  for(let iter=0;iter<count;iter++){
    let at=-1,best=Infinity;for(let i=0;i<count;i++)if(!closed[i]&&dist[i]<best){at=i;best=dist[i];}
    if(at<0)break;closed[at]=1;const r=Math.floor(at/COLS),c=at%COLS;if(run.grid[r][c]==='cache'){end=at;break;}
    for(const[y,x]of neighbors(r,c)){if(!inBounds(run,y,x))continue;const next=y*COLS+x,n=best+cost(y,x);if(!closed[next]&&n<dist[next]){dist[next]=n;prev[next]=at;}}
  }
  if(end<0)return{cost:run.loot.cache?0:Infinity,path:[],next:null};
  const path=[];for(let at=end;at>=0;at=prev[at])path.push([Math.floor(at/COLS),at%COLS]);path.reverse();
  return{cost:dist[end],path,next:path.find(([r,c])=>!!run.grid[r][c])||null};
}
export function blastArea(run,r,c){const out=[];for(let y=r-1;y<=r+1;y++)for(let x=c-1;x<=c+1;x++)if(inBounds(run,y,x)&&run.grid[y][x]&&run.grid[y][x]!=='bedrock')out.push([y,x]);return out;}
export function achieved(run) {
  if(run.mode==='random')return run.loot.cache>0;
  const s=LESSONS[run.index];return s.cache?run.loot.cache>0:s.diamonds?run.loot.diamond>=s.diamonds:run.score>=s.target;
}
export function strike(run,r,c) {
  if(!canMine(run,r,c))return {ok:false,reason:run.status!=='active'?'finished':run.grid[r]?.[c]==='bedrock'?'bedrock':'blocked',events:[]};
  const type=run.grid[r][c],events=[];run.energy--;run.strikes++;run.hits[r][c]++;
  if(run.hits[r][c]<TYPES[type].hp)events.push({kind:'hit',r,c,type,wave:0});
  else {
    const bombs=[],queued=new Set();
    const remove=(y,x,wave)=>{
      const t=run.grid[y]?.[x];if(!t||t==='bedrock')return;
      run.grid[y][x]=null;run.hits[y][x]=0;run.broken++;run.depth=Math.max(run.depth,y+1);
      if(t in run.loot)run.loot[t]++;
      run.score+=TYPES[t].value;
      events.push({kind:'break',r:y,c:x,type:t,value:TYPES[t].value,wave});
      if(t==='tnt'&&!queued.has(`${y},${x}`)){queued.add(`${y},${x}`);bombs.push({r:y,c:x,wave:wave+1});}
    };
    remove(r,c,0);
    for(let i=0;i<bombs.length;i++){
      const bomb=bombs[i];events.push({kind:'blast',...bomb});
      for(const [y,x]of blastArea(run,bomb.r,bomb.c))remove(y,x,bomb.wave);
    }
    run.blasts+=bombs.length;run.bestChain=Math.max(run.bestChain,bombs.length);
  }
  // Depth rewards are paid once, after the chain, even on the final hit.
  if(run.mode==='random'&&run.balanceVersion>=3){run.depthBonuses??=[];for(const supply of DEPTH_SUPPLIES)if(run.depth>=supply.depth&&!run.depthBonuses.includes(supply.depth)){run.depthBonuses.push(supply.depth);run.energy+=supply.amount;run.maxEnergy+=supply.amount;events.push({kind:'supply',r,c,amount:supply.amount,depth:supply.depth,wave:Math.max(0,...events.map(e=>e.wave))});}}
  // Resolve the entire chain before evaluating the final point of durability.
  if(achieved(run))run.status='won';else if(run.energy<=0)run.status='exhausted';
  return {ok:true,events,chain:events.filter(e=>e.kind==='blast').length};
}
export function cashOut(run){if(run.status==='active')run.status='banked';return run;}
export function repairRun(run){
  if(run.mode!=='random'||run.status!=='exhausted'||achieved(run))return{ok:false,added:0};
  const route=cacheRoute(run);if(!Number.isFinite(route.cost))return{ok:false,added:0};
  const added=Math.max(24,route.cost+12);run.energy=added;run.status='active';run.repairCount=(run.repairCount||0)+1;return{ok:true,added};
}
export function upgradeRun(run){
  if(run.mode!=='random'||run.balanceVersion>=3||!['active','exhausted'].includes(run.status))return{run,added:0};
  const fresh=createRun('random',run.index,run.seed),largeBudget=run.maxEnergy>=80;let added=0;
  run.baseEnergy=fresh.baseEnergy;run.routeCostAtStart=fresh.routeCostAtStart;run.repairCount=run.repairCount||0;
  if(largeBudget&&run.strikes===0){run.energy=run.maxEnergy=fresh.maxEnergy;run.depthBonuses=[];}
  else if(largeBudget){run.depthBonuses=DEPTH_SUPPLIES.map(s=>s.depth);}
  else{const paid=DEPTH_SUPPLIES.filter(s=>run.depth>=s.depth);run.depthBonuses=paid.map(s=>s.depth);const desired=fresh.baseEnergy+paid.reduce((n,s)=>n+s.amount,0);added=Math.max(0,desired-run.maxEnergy);run.energy+=added;run.maxEnergy=Math.max(run.maxEnergy,desired);if(run.status==='exhausted'&&run.energy>0)run.status='active';}
  run.balanceVersion=3;return{run,added};
}
export function rating(run){if(run.mode==='random')return run.loot.cache?3:run.score>=1500?2:run.score>=500?1:0; if(!achieved(run))return 0;return run.energy>=Math.ceil(run.maxEnergy*.4)?3:run.energy>=Math.ceil(run.maxEnergy*.15)?2:1;}
export function validRun(run){return !!run&&run.version===1&&['lesson','random'].includes(run.mode)&&Number.isInteger(run.index)&&run.index>=0&&run.index<3&&Array.isArray(run.grid)&&run.grid.length>0&&run.grid.length<=24&&run.grid.every(row=>row.length===7&&row.every(t=>t===null||t in TYPES))&&Array.isArray(run.hits)&&run.hits.length===run.grid.length&&run.hits.every(row=>row.length===7&&row.every(n=>Number.isFinite(n)&&n>=0))&&Number.isFinite(run.energy)&&run.energy>=0&&Number.isFinite(run.score)&&!!run.loot&&['active','won','exhausted','banked'].includes(run.status);}
