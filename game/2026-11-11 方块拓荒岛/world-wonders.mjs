// Completion-only scenery placement. No resource, cost, collision or save rules.
import {planet,dot,distance,norm} from './globe.mjs';
export function wonderSites(index){
 const p=planet(index),chosen=[],specs=[
  {kind:'tree',name:'Heartwood Sanctuary',biome:'grass',toward:[0,.9,.45]},
  {kind:'sun',name:'Temple of the Sun',biome:'sand',toward:[.75,.25,.7]},
  {kind:'crystal',name:'Amethyst Citadel',biome:'ruins',toward:[-.75,.15,.7]},
  {kind:'frost',name:'Crown of Winter',biome:'snow',toward:[.1,-.8,.6]},
 ];
 for(const spec of specs){const target=norm(spec.toward),c=p.cells.filter(c=>c.biome===spec.biome).sort((a,b)=>{
  const score=c=>dot(c.p,target)-chosen.reduce((n,s)=>n+Math.max(0,7-distance(c.p,s.p))*.8,0);
  return score(b)-score(a);
 })[0];chosen.push({...spec,cell:c.id,p:c.p});}
 return chosen;
}
