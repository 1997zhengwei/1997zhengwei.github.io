// Finds a cheap channel for every site and prints reference water / dig numbers.
// Usage: node tools/solve-pars.mjs   (the star thresholds in src/flow.js (pars) are based on this output)
import { cols, rows, rock, clay, ice, sites, createSluice, drainsFor, terrainOf } from '../src/flow.js';
const showMap=process.argv.includes('--map');
const only=process.argv.find(a=>/^\d+$/.test(a));

const moves=[[0,1,1],[-1,1,1.45],[1,1,1.45],[-1,0,1.25],[1,0,1.25]];

function route(land,from,isGoal) {
  const cost=new Float64Array(cols*rows).fill(Infinity);
  const prev=new Int32Array(cols*rows).fill(-1);
  const start=from[1]*cols+from[0];
  cost[start]=0;
  const open=[start];
  while(open.length){
    let best=0;
    for(let i=1;i<open.length;i++)if(cost[open[i]]<cost[open[best]])best=i;
    const at=open.splice(best,1)[0];
    const c=at%cols,r=(at-c)/cols;
    if(isGoal(c,r)){
      const path=[];
      for(let p=at;p>=0;p=prev[p])path.unshift([p%cols,Math.floor(p/cols)]);
      return path;
    }
    for(const [dc,dr,w] of moves){
      const x=c+dc,y=r+dr;
      if(x<0||x>=cols||y>=rows)continue;
      const i=y*cols+x;
      if(land[i]===rock)continue;
      // Water cannot squeeze diagonally between two blocked corners.
      if(dc&&dr&&land[r*cols+x]===rock&&land[y*cols+c]===rock)continue;
      // Clay costs three dug cells; ice has to melt first, so the solver avoids both when it can.
      const next=cost[at]+w*(land[i]===clay?2.6:land[i]===ice?3.5:1);
      if(next<cost[i]){cost[i]=next;prev[i]=at;open.push(i);}
    }
  }
  return null;
}

function* permutations(list) {
  if(list.length<=1){yield list;return;}
  for(let i=0;i<list.length;i++){
    for(const rest of permutations([...list.slice(0,i),...list.slice(i+1)]))yield [list[i],...rest];
  }
}

function attempt(site,plan) {
  const model=createSluice(site);
  const drains=new Set();
  for(const [a,b] of drainsFor(site))for(let c=a;c<=b;c++)drains.add(c);
  for(const {spring,gems} of plan){
    let at=[spring,0];
    const legs=[...gems.map(g=>(c,r)=>c===g.c&&r===g.r),(c,r)=>r===rows-1&&drains.has(c)];
    for(const goal of legs){
      const path=route(model.land,at,goal);
      if(!path)return null;
      for(const [c,r] of path)model.dig(c,r);
      at=path.at(-1);
    }
  }
  const dugMask=model.land.slice();
  for(let t=0;t<4000;t++){
    model.step(true);
    if(model.required.every(j=>j.found))return {water:model.used,dig:model.dug,dugMask};
  }
  return null;
}

const pars=[];
function draw(site,mask) {
  const base=terrainOf(site).land;
  const drains=new Set();
  for(const [a,b] of drainsFor(site))for(let c=a;c<=b;c++)drains.add(c);
  const lines=[];
  for(let r=0;r<rows;r++){
    let line='';
    for(let c=0;c<cols;c++){
      const i=r*cols+c, gem=site.finds.find(f=>f.c===c&&f.r===r);
      line+=gem?'G':base[i]===rock?'#':base[i]===ice?'~':mask&&mask[i]===0?'.':base[i]===clay?'%':(r===0&&site.springs.includes(c))?'S':' ';
    }
    lines.push('|'+line+'|');
  }
  lines.push(' '+Array.from({length:cols},(_,c)=>drains.has(c)?'=':' ').join(''));
  return lines.join(String.fromCharCode(10));
}
for(const [index,site] of sites.entries()){
  if(only&&Number(only)!==index+1)continue;
  const gems=site.finds.map((f,i)=>({...f,i}));
  let best=null;
  const assignments=site.springs.length===1?[gems.map(()=>0)]:
    Array.from({length:2**gems.length},(_,mask)=>gems.map((_,i)=>mask>>i&1));
  for(const assign of assignments){
    const groups=site.springs.map((spring,s)=>({spring,gems:gems.filter((_,i)=>assign[i]===s)}));
    const orders=groups.map(g=>[...permutations(g.gems)].filter(o=>o.every((x,i)=>!i||x.r>=o[i-1].r)));
    const combos=orders.reduce((acc,list)=>acc.flatMap(a=>list.map(o=>[...a,o])),[[]]);
    for(const combo of combos){
      const plan=groups.map((g,s)=>({spring:g.spring,gems:combo[s]})).filter(g=>g.gems.length);
      const result=attempt(site,plan);
      if(result&&(!best||result.water+result.dig*.6<best.water+best.dig*.6))best=result;
    }
  }
  // Hand-drawn reference routes (site.route: chains of [c,r] waypoints dug as straight strokes).
  if(site.route){
    const model=createSluice(site);
    for(const chain of site.route){
      for(let k=0;k<chain.length-1;k++){
        const [a,b]=[chain[k],chain[k+1]];
        const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.55);
        for(let i=0;i<=steps;i++)model.dig(a[0]+(b[0]-a[0])*i/steps,a[1]+(b[1]-a[1])*i/steps);
      }
    }
    const dugMask=model.land.slice();
    for(let t=0;t<4000;t++){
      model.step(true);
      if(model.required.every(j=>j.found)){
        const result={water:model.used,dig:model.dug,dugMask};
        if(!best||result.water+result.dig*.6<best.water+best.dig*.6)best=result;
        break;
      }
    }
  }
  console.log(index+1,site.name,best?JSON.stringify({water:best.water,dig:best.dig}):'NO ROUTE');
  if(showMap)console.log(draw(site,best?.dugMask));
  if(best)pars.push([Math.round(best.water*1.3+12),Math.round(best.dig*1.35+10)]);
}
if(!only)console.log('pars =',JSON.stringify(pars));
