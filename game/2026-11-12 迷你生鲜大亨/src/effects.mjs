import * as T from '../vendor/three.module.js';
import {productObject} from './products.mjs';
import {textSprite} from './art.mjs';
import {PRODUCTS,productsFor} from './config.mjs';
import {sourcePose,shelfPose,reservePose} from './goods-layout.mjs';
import {PICKUP_FLIGHT,RESTOCK_FLIGHT} from './cargo.mjs';
export class Effects{
 constructor(scene,s){this.scene=scene;this.s=s;this.active=[];this.pending=new Map();}
 clear(){for(const a of this.active){a.o.removeFromParent();if(a.text){a.o.material.map.dispose();a.o.material.dispose();}}this.active=[];this.pending.clear();}
 pendingAt(id,slot){return this.pending.has(id+':'+slot);}
 release(a){if(a.id!==undefined){const key=a.id+':'+a.slot,n=(this.pending.get(key)||1)-1;if(n>0)this.pending.set(key,n);else this.pending.delete(key);}}
 event(e,transfer={}){if(this.active.length>48)return;
  if(e.type==='pickup'||e.type==='restock'){
   const pickup=e.type==='pickup',p=e.from==='shelf'?shelfPose(e.id,e.sourceSlot,this.s):e.to==='source'?sourcePose(e.id,e.targetSlot,this.s):e.from==='reserve'||e.to==='reserve'?reservePose(e.id,pickup?e.sourceSlot:e.targetSlot):pickup?sourcePose(e.id,e.sourceSlot,this.s):e.to==='machine'?{x:(this.s?productsFor(this.s):PRODUCTS)[e.machineId].source[0],y:1.6,z:(this.s?productsFor(this.s):PRODUCTS)[e.machineId].source[1]}:shelfPose(e.id,e.targetSlot,this.s);
   const object=productObject(e.id,this.s?.storeId||'corner'),from=pickup?new T.Vector3(p.x,p.y,p.z):transfer?.from||new T.Vector3(e.x,1.5,e.z),to=pickup?transfer?.to||(()=>new T.Vector3(e.x,1.5,e.z)):()=>new T.Vector3(p.x,p.y,p.z);
   const a={o:object,start:from.clone(),to,t:0,duration:pickup?PICKUP_FLIGHT:RESTOCK_FLIGHT,scale:pickup?p.scale:transfer?.fromScale||1.03,targetScale:pickup?transfer?.toScale||1.1:p.scale||.85,pickup,ry:p.ry||0};
   if(!pickup&&e.to==='shelf'){a.id=e.id;a.slot=e.targetSlot;const key=a.id+':'+a.slot;this.pending.set(key,(this.pending.get(key)||0)+1);}
   object.position.copy(from);object.scale.setScalar(a.scale);this.scene.add(object);this.active.push(a);
  }
  if(e.type==='sale'){const o=textSprite('+'+e.amount,'#20845c',.52,'#fff5c9');o.position.set(7.5,2.6,12);this.scene.add(o);this.active.push({o,start:o.position.clone(),to:()=>new T.Vector3(7.5,4,12),t:0,duration:1.1,text:true});}
 }
 update(dt){for(const a of this.active){a.t+=dt;const t=Math.min(1,a.t/a.duration),end=a.to()||a.start;a.o.position.lerpVectors(a.start,end,t);if(!a.text){a.o.position.y+=Math.sin(t*Math.PI)*(.75+Math.min(1.4,Math.abs(end.y-a.start.y)*.13));a.o.rotation.y=a.ry+Math.sin(t*Math.PI)*.55;a.o.scale.setScalar((a.scale+(a.targetScale-a.scale)*t)*(1+Math.sin(t*Math.PI)*.12));}else a.o.material.opacity=1-t*t;if(t>=1){a.remove=true;this.release(a);a.o.removeFromParent();if(a.text){a.o.material.map.dispose();a.o.material.dispose();}}}this.active=this.active.filter(a=>!a.remove);}
}
