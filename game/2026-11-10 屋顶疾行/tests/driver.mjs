import {createSession,startSession,stepSession,actionHint} from '../src/physics.mjs';
import {NAV} from '../src/world.mjs';
import {normal} from '../src/math.mjs';
export function driveRoute({practice=false,sprint=true}={}){const w=createSession({practice});startSession(w);let jumpAt=-9,slideAt=-9,oldNav=0,stuck=0;const checkpoints=[];let gate=0;
 for(let i=0;i<120*240&&w.mode==='running';i++){const p=w.player,n=NAV[w.nav],d=normal(n.x-p.x,n.z-p.z),hint=actionHint(w,d);let jump=false,slide=false;
  if(p.grounded&&w.elapsed-jumpAt>.45&&p.speed>2&&((hint.type==='gap'&&hint.distance<1.35)||(['vault','climb'].includes(hint.type)&&hint.distance<1.15))){jump=true;jumpAt=w.elapsed;}
  if(hint.type==='slide'&&hint.distance<1.65&&w.elapsed-slideAt>1){slide=true;slideAt=w.elapsed;}
  stepSession(w,{...d,sprint,jump,slide},1/120);
  if(w.gate!==gate){gate=w.gate;checkpoints.push({gate,time:w.clock,x:p.x,y:p.y,z:p.z});}
  if(w.nav===oldNav)stuck++;else{oldNav=w.nav;stuck=0;}if(stuck>120*15||w.stats.falls>10)break;
 }
 return {world:w,checkpoints};
}
