import {supportAt} from './world.mjs';
import {rng,distance} from './math.mjs';

const SOCKETS=[[-4,-5],[-10,0],[7,1],[-4,8],[3,9],[10,-4],[-4,-10],[0,-10],[-10,7]];
export function safeTreasurePoint(map,p){
 for(const dx of[-.72,0,.72])for(const dz of[-.58,0,.58]){const s=supportAt(map,p.x+dx,p.z+dz,p.y+.04);if(!s||Math.abs(s.maxY-p.y)>.06)return false;}
 return !map.solids.some(b=>b.maxY>p.y+.08&&b.minY<p.y+2.4&&p.x>b.minX-1.05&&p.x<b.maxX+1.05&&p.z>b.minZ-1.05&&p.z<b.maxZ+1.05);
}
export function treasureSites(map){
 const sites=[];
 for(const r of map.roofs){if(distance(r,map.spawn)<50)continue;
  for(let i=0;i<SOCKETS.length;i++){const [dx,dz]=SOCKETS[i],p={id:r.id+'-'+i,roofId:r.id,name:r.name+'宝箱',x:r.x+dx,y:r.y,z:r.z+dz};
   if(r.zone==='花园旧巷'&&[-8,8].some(x=>Math.hypot(dx-x,dz+9)<2.3))continue;
   if(r.id.endsWith('1')&&Math.abs(dx+9)<1.6&&dz>-7&&dz<8)continue;
   if(dx<-8.5&&dz>7)continue;
   if(safeTreasurePoint(map,p))sites.push(p);
  }
 }
 return sites;
}
export function chooseTreasure(map,nav,seed,avoidRoof=null){
 const random=rng(seed),sites=treasureSites(map),roofs=[...new Set(sites.map(s=>s.roofId))].filter(id=>id!==avoidRoof);
 const first=Math.floor(random()*roofs.length);
 for(let n=0;n<roofs.length;n++){const candidates=sites.filter(s=>s.roofId===roofs[(first+n)%roofs.length]),offset=Math.floor(random()*candidates.length);
  for(let i=0;i<candidates.length;i++){const base=candidates[(offset+i)%candidates.length],p={...base,x:base.x+(random()-.5)*1.1,z:base.z+(random()-.5)*1.1};
   for(const point of[safeTreasurePoint(map,p)?p:base,base])if(nav.path(map.spawn,point).length)return {...point};
  }
 }
 throw new Error('No reachable treasure position');
}
