import {createNovaCompanion} from './nova-companion.mjs';
import * as THREE from './vendor/three.module.js';
import {STARFALL,GATE_Z} from './starpath-rules.mjs';
export function createStarfallArt({scene,root,part,ring,textSprite,optimizeTree,releaseTree}){
 const tags=[];const base=new THREE.Group();base.position.set(0,0,STARFALL.z);root.add(base);
 const b=(g,c,x,y,z,w,h,d,glow=0)=>part(g,'round',c,x,y,z,w,h,d,glow);
 const label=(text,x,y,z)=>{const t=textSprite(text,{width:5,color:'#f5fff4',bg:'#254555ee'});t.position.set(x,y,z);base.add(t);tags.push({tag:t,g:base});};
 b(base,'#5d8190',0,.06,0,29,.16,66);b(base,'#def0df',0,.17,0,28.5,.08,65);
 b(base,'#6b9d9d',0,.22,0,7,.04,65);
 for(const x of [-4,4])b(base,'#a9ffe5',x,.25,0,.13,.05,64,.15);
 for(let z=-28;z<30;z+=5){for(const side of [-1,1]){const m=b(base,'#e5ffe0',side*.28,.27,z,.12,.03,.8);m.rotation.y=-side*.65;}}
 for(const side of [-1,1]){
  const g=new THREE.Group();g.position.set(side*9,0,0);base.add(g);
  part(g,'cylinder','#4c7689',0,.3,0,3.4,.5,3.4);b(g,'#f0f8e9',0,1.3,0,4,1.7,4);
  part(g,'ball',side<0?'#b3e9d2':'#d0b7ef',0,2.3,0,4.4,1.5,4.4);b(g,'#294a65',0,1.4,2.01,2.7,.8,.08);
  for(const x of [-1,1])part(g,'ball','#b1ffe6',x,1.4,2.10,.23,.23,.10,.25);
 }
 label('NOVA COMPANION LAB',-9,3.8,0);label('TWIN FIRE WORKSHOP',9,3.8,0);
 const gate=new THREE.Group();gate.position.set(0,0,-27);base.add(gate);
 for(const x of [-5.5,5.5]){b(gate,'#f2f8e9',x,3,0,.75,6,1);b(gate,'#99edcd',x,3,.55,.18,4.5,.06,.2);}b(gate,'#edf8e5',0,6,0,12,.75,1.3);label('GARDENS · LV 46–51',0,6.7,-27);
 for(let i=0;i<48;i++){
  const g=new THREE.Group(),d=1150+i*9;g.position.set((i%2?1:-1)*(16+(i%4)*1.1),0,GATE_Z-d);root.add(g);
  const tint=i<17?'#9aedd1':i<34?'#c2b5f0':'#f5d299';
  part(g,'cylinder','#6c9d92',0,1.5,0,.09,3,.09);
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5;const petal=part(g,'ball',tint,Math.cos(a)*.65,2.9,Math.sin(a)*.65,.9,.25,.7,.08);petal.rotation.y=-a;}
  part(g,'ball','#fff6c6',0,3,0,.42,.30,.42,.17);
 }
 const cocoon=new THREE.Group();cocoon.position.set(-8,0,GATE_Z-1210);root.add(cocoon);part(cocoon,'ball','#e3c8ff',0,.9,0,1.25,1.9,1.25,.12);ring(cocoon,1.6,'#d7fff0',.65,.06).position.y=.13;
 const ct=textSprite('RESCUE · LV 51',{width:3.5});ct.position.y=2.6;cocoon.add(ct);
 const actors=new Map();
 function actor(p){const g=new THREE.Group();scene.add(g);const pet=new THREE.Group(),board=new THREE.Group(),guns=new THREE.Group();g.add(pet,board,guns);guns.scale.setScalar(1.32);
  const stage=p.starfall?.petStage||1,col=stage===3?'#f2d28e':stage===2?'#aa9adf':'#83d9c6';
  const companion=createNovaCompanion(stage);pet.add(companion.root);const legs=[];
  b(board,'#eff8ed',0,.18,0,1.65,.17,2.8);b(board,'#7498b2',0,.27,0,1.1,.08,2.3);for(const x of [-.8,.8]){b(board,'#9bffe4',x,.16,0,.11,.1,2.2,.3);part(board,'ball','#b9fff1',x,.10,.9,.21,.25,.5,.3);}
  optimizeTree(board);return {g,pet,board,guns,legs,stage,companion,rank:Math.floor((p.level-46)/3)};
 }
 function dispose(a){a.companion.dispose();releaseTree(a.g);}

 return {tags,update(dt,state,clock,pilots){if(!state)return;cocoon.visible=!state.self.starfall?.pet;
  const ids=new Set(state.players.map(p=>p.id));for(const [id,a]of actors)if(!ids.has(id)){dispose(a);actors.delete(id);}
  for(const p of state.players){if(!p.starfall?.arrived)continue;let a=actors.get(p.id);const stage=p.starfall.petStage||1;if(a&&(a.stage!==stage||a.rank!==Math.floor((p.level-46)/3))){dispose(a);actors.delete(p.id);a=null;}if(!a){a=actor(p);actors.set(p.id,a);}a.pet.visible=!!p.pet&&!p.down;a.board.visible=!!p.mounted;a.guns.visible=p.level>=48&&!p.down;
   const dest=new THREE.Vector3(p.pet?.x??p.x,0,p.pet?.z??p.z);if(!a.initialized){a.pet.position.copy(dest);a.initialized=true;}const moving=a.pet.position.distanceTo(dest)>.07;
   a.pet.position.lerp(dest,1-Math.exp(-12*dt));const heading=p.pet?.heading??Math.atan2(p.headingX||0,p.headingZ||1);a.pet.rotation.y+=Math.atan2(Math.sin(heading-a.pet.rotation.y),Math.cos(heading-a.pet.rotation.y))*Math.min(1,dt*10);
   a.companion.update(clock,moving,(p.pet?.attackUntil||0)>state.time);const visual=pilots?.get(p.id)?.rig.root;if(visual){a.board.position.copy(visual.position);a.board.position.y=.05+Math.sin(clock*3)*.03;a.board.rotation.y=visual.rotation.y;}else{a.board.position.set(p.x,.05,p.z);a.board.rotation.y=heading;}

  }
 }};
}
