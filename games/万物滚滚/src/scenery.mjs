import {OBJECT_RADII,randomFor} from './data.mjs';
export const SCENERY_POOLS={
 sunny:[['book','cup','pencil','plant'],['chair','plant','lamp','bear'],['house','house','tree','van']],
 playdate:[['block','dice','pencil','bear'],['chair','plant','lamp','bear'],['house','house','tree','van']],
 golden:[['donut','cup','berry','book'],['plant','tree','bench','bush'],['house','house','tree','van']]
};
export function sceneryTypesFor(id){return new Set([...SCENERY_POOLS[id].flat(),'chair','plant','tree','house','plate']);}
export function createLooseScenery(track){
 const rng=randomFor(track.seed+447),props=[],add=(type,s,u,r,variant=0,rotation=0,yOffset=0)=>props.push({type,s,u,r,variant,rotation,yOffset,scenery:true,chapter:s<track.chapterStarts[1]?0:s<track.chapterStarts[2]?1:2});
 for(let i=0;i<track.rows.length;i++){const row=track.rows[i],{s,r,chapter}=row;
  if(i%4===0)for(const sign of[-1,1]){const pool=SCENERY_POOLS[track.id][chapter],type=pool[Math.floor(rng()*pool.length)],size=OBJECT_RADII[type]*(.92+rng()*.2);add(type,s+(rng()-.5)*r*4,sign*(chapter===0?1.15+rng()*.20:1.2+rng()*1.2),size,i%5,rng()*Math.PI*2);}
  if(chapter===0&&i%9===3)for(const sign of[-1,1])add(i%2?'chair':'plant',s,sign*2.4,i%2?2.4:1.35,0,.2,-4.5);
  if(chapter===2&&i%4===2)for(const sign of[-1,1])add('tree',s+r,sign*(1.6+rng()*.3),9+rng()*2);
 }
 for(const i of[7,17,29])add('plate',track.rows[i].s,1.08,.90);
 for(let i=0;i<5;i++)for(const sign of[-1,1])add(i%2?'house':'tree',track.length+track.keys.at(-1).r*(2+i*3.2),sign*(1.65+i%2*.5),i%2?13.5:9.5,i%5,sign*.4);
 return props;
}
