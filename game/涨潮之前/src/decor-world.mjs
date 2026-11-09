import * as T from '../vendor/three.module.js';
import {buildingBase} from './rules.mjs';
import {WORLD_STYLES} from './world-state.mjs';
export function decorStructure(b,s,{box,cylinder,beam,sphere,batch}){
 const g=new T.Group(),y=buildingBase(s,b),accent=WORLD_STYLES[b.tint]||WORLD_STYLES.sea,wood='#b7986c',cream='#f0d4a0';
 if(b.type==='fence'){
  for(const x of [-.92,.92]){box(g,wood,x,y+.52,.88,.13,1.05,.13);sphere(g,cream,x,y+1.08,.88,.1);}
  for(const h of [.34,.77])box(g,wood,0,y+h,.88,1.9,.12,.09);
  for(const x of [-.6,-.3,0,.3,.6])box(g,accent,x,y+.54,.88,.13,.69,.08);
 }else if(b.type==='arch'){
  for(const x of [-.84,.84]){box(g,wood,x,y+1.1,0,.2,2.2,.27);box(g,cream,x,y+.1,0,.33,.2,.4);}
  box(g,wood,0,y+2.22,0,2.1,.2,.35);beam(g,[-1.05,y+2.3,0],[0,y+2.7,0],.1,accent);beam(g,[0,y+2.7,0],[1.05,y+2.3,0],.1,accent);
  for(const x of [-.55,0,.55])sphere(g,accent,x,y+2.4-Math.abs(x)*.25,.1,.12);
 }else if(b.type==='flowerbed'){
  box(g,'#79674b',0,y+.13,0,1.6,.24,1.6);
  for(const z of [-.85,.85])box(g,wood,0,y+.2,z,1.8,.35,.1);
  for(const x of [-.85,.85])box(g,wood,x,y+.2,0,.1,.35,1.8);
  for(let i=0;i<9;i++){
   const x=(i%3-1)*.48,z=(Math.floor(i/3)-1)*.48,h=.4+(i%3)*.1;cylinder(g,'#728f5b',x,y+h,z,.025,.025,h);
   for(let j=0;j<5;j++){const a=j*Math.PI*2/5;sphere(g,i%2?accent:cream,x+Math.sin(a)*.09,y+h+.17,z+Math.cos(a)*.09,.09);}
  }
 }else if(b.type==='lantern'){
  cylinder(g,'#929c88',0,y+.12,0,.23,.32,.24);cylinder(g,wood,0,y+.97,0,.055,.08,1.7);
  box(g,accent,0,y+1.88,0,.45,.08,.45);box(g,cream,0,y+1.63,0,.32,.43,.32);box(g,accent,0,y+1.4,0,.41,.07,.41);
 }
 batch(g);
 if(b.type==='lantern'){const light=new T.PointLight('#ffda93',2.5,6,1.6);light.position.set(0,y+1.65,0);g.add(light);g.userData.light=light;}
 g.position.set(b.x,0,b.z);g.rotation.y=b.rotation*Math.PI/2;g.traverse(o=>{if(o.isMesh)o.userData.buildingId=b.id;});return g;
}
