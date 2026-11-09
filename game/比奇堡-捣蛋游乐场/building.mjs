import {SLIDE_TYPES,slideBounds} from './slides.mjs';
import {EDGE} from './rules.mjs';
// The whole ride, including its entrance, must fit inside a bounded park.
export function fitToy(type,p,rot=0,endless=false){
 if(endless||!SLIDE_TYPES[type])return p;
 const b=slideBounds(type,rot);
 return {x:Math.max(-EDGE.x-b.minX,Math.min(EDGE.x-b.maxX,p.x)),z:Math.max(-EDGE.z-b.minZ,Math.min(EDGE.z-b.maxZ,p.z))};
}
