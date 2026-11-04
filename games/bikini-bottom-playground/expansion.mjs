export const EXTRA_TYPES={
 cannon:{name:'Sponge cannon',icon:'➶',color:'#dc9d76',hint:'Step into the cannon. It launches after a short countdown! Rotate to aim.'},
 conveyor:{name:'Conveyor',icon:'»',color:'#9fc5a0',hint:'Carries characters AND boxes along the arrow. Connect several belts.'},
 geyser:{name:'Geyser',icon:'♨',color:'#80cbe4',hint:'Water bursts every 5 seconds. Stand on the grate and wait for the spray!'},
 portal:{name:'Portal',icon:'◎',color:'#b7a0df',hint:'Place TWO portals. Matching letters connect them. Rotate the exit direction.'},
 disco:{name:'Dance floor',icon:'♫',color:'#e8a6c9',hint:'Step onto the glowing tiles. Even Squidward secretly loves to dance.'}
};
export const EXTRA_GOALS=[
 {id:'portal',title:'Shortcut!',hint:'Walk through a linked pair of portals.'},
 {id:'dance',title:'Not a bad dancer',hint:'Bring Squidward onto a dance floor.'},
 {id:'airmail',title:'Splash delivery',hint:'Launch a character from a cannon into the pool. Try Splash Lab.'},
 {id:'combo',title:'Chain reaction',hint:'Use 3 different kinds of toys within 7 seconds with one character. Try Portal Parade.'}
];
const obj=(type,x,z,rot=0,level=0)=>({type,x,z,rot,level});
const numbered=list=>list.map((o,i)=>({...o,id:i+1}));
export const PRESETS={
 slides:{name:'Slide Carnival',detail:'Three big slides: waves, spirals and a flying finish.',tip:'Walk to the yellow steps. Try a wave, spiral or jump slide!',spawns:{sponge:{x:-9,z:7.2},patrick:{x:7,z:6},squidward:{x:7.3,z:-4}},layout:()=>numbered([obj('waterslide',-9,0),obj('spiralslide',8,6),obj('jumpslide',0,6),obj('burger',4.6,-.8),obj('trampoline',2,-5),obj('fan',-5,-4,Math.PI/2),obj('portal',-5,7),obj('portal',7,-5)])},
 splash:{name:'Splash Lab',detail:'Cannon → pool! Plus bubbles, fans and a timed geyser.',tip:'Walk into the orange cannon. It is already aimed at the pool!',spawns:{sponge:{x:-1.5,z:2},patrick:{x:4.8,z:4},squidward:{x:7.3,z:-4}},layout:()=>numbered([obj('cannon',-1.5,-.8,Math.PI/2),obj('burger',4.6,-.8),obj('geyser',-4,3),obj('bubble',-4,-3),obj('fan',-6,-3,Math.PI/2),obj('trampoline',1,4),obj('disco',5,-4)])},
 parade:{name:'Portal Parade',detail:'A conveyor carries you through a portal and onto a trampoline.',tip:'Step onto the green conveyor. Belt → portal → bounce!',spawns:{sponge:{x:-5,z:5.4},patrick:{x:4.5,z:4},squidward:{x:7.3,z:-4}},layout:()=>numbered([obj('conveyor',-5,3.6),obj('portal',-5,1.7),obj('portal',-1,-3.5,Math.PI/2),obj('trampoline',.5,-3.5,Math.PI/2),obj('fan',-1,-5,Math.PI/2),obj('burger',4.6,-.8),obj('disco',4.5,-4),obj('geyser',0,3)])},
 bowling:{name:'Patrick Express',detail:'Hungry Patrick, a box tower, and a very suspicious lunch.',tip:'Watch Patrick follow his lunch through the box tower. Move the patty to change his route.',spawns:{sponge:{x:-4,z:4},patrick:{x:0,z:5},squidward:{x:7.3,z:-4}},layout:()=>numbered([obj('conveyor',0,3.5),obj('conveyor',0,1),obj('crate',0,-1.3),obj('crate',0,-1.3,0,1),obj('crate',0,-1.3,0,2),obj('burger',0,-4.5),obj('disco',4.5,-4),obj('cannon',-4,-1,Math.PI/2),obj('trampoline',-5,2),obj('geyser',5,4)])}
};
export function conveyorInside(b,o){const dx=b.x-o.x,dz=b.z-o.z,fx=Math.sin(o.rot),fz=-Math.cos(o.rot);return Math.abs(dx*fx+dz*fz)<1.5&&Math.abs(dx*fz-dz*fx)<.85&&b.y<.35;}
export function portalPairs(objects){const p=objects.filter(o=>o.type==='portal').sort((a,b)=>a.id-b.id);return new Map(p.map((o,i)=>[o.id,{partner:p[i^1],label:String.fromCharCode(65+Math.floor(i/2)),index:Math.floor(i/2)}]));}
export const geyserActive=(time,o)=>(time+(o.id%3)*.5)%5>3.65;

// Entry into different toy types forms a short, per-character chain.
export function touchToy(w,a,type,earn){a.chain=(a.chain||[]).filter(c=>w.time-c.time<7);const found=a.chain.find(c=>c.type===type);if(found)found.time=w.time;else a.chain.push({type,time:w.time});w.bestCombo=Math.max(w.bestCombo||0,a.chain.length);if(a.chain.length>=3)earn(w,'combo',a);}

export function updateExtraActor(w,a,dt,emit,earn){
 a.portalLock=Math.max(0,(a.portalLock||0)-dt);a.dance=Math.max(0,(a.dance||0)-dt);a.danceLock=Math.max(0,(a.danceLock||0)-dt);a.airmail=Math.max(0,(a.airmail||0)-dt);a.chain=(a.chain||[]).filter(c=>w.time-c.time<7);
 if(!a.loaded)return false;
 const cannon=w.objects.find(o=>o.id===a.loaded.id);if(!cannon){a.loaded=null;return false;}
 a.loaded.left-=dt;a.x=cannon.x;a.z=cannon.z;a.y=.45;a.vx=a.vz=a.vy=0;a.heading=cannon.rot+Math.PI;a.say='Ready…';a.react=.2;
 if(a.loaded.left<=0){const speed=a.id==='patrick'?6.8:7.3;a.vx=Math.sin(cannon.rot)*speed;a.vz=-Math.cos(cannon.rot)*speed;a.vy=a.id==='patrick'?7.8:8.5;a.loaded=null;a.cool=1.5;a.airmail=4;cannon.cool=1.8;touchToy(w,a,'cannon',earn);emit(w,'launch',a,'Special delivery!');return false;}
 return true;
}
export function extraInteraction(w,a,o,dt,emit,earn){
 const d=Math.hypot(a.x-o.x,a.z-o.z),fx=Math.sin(o.rot),fz=-Math.cos(o.rot);
 if(o.type==='conveyor'&&conveyorInside(a,o)){a.vx+=fx*34*dt;a.vz+=fz*34*dt;touchToy(w,a,'conveyor',earn);}
 if(o.type==='cannon'&&d<.9&&a.y<.25&&!a.cool&&!o.cool&&!a.loaded){a.loaded={id:o.id,left:.7};o.cool=2.5;emit(w,'load',a,'Ready…');}
 if(o.type==='geyser'&&d<1.05&&a.y<.45&&!a.cool&&geyserActive(w.time,o)){a.vy=a.id==='patrick'?9.8:12;a.cool=1.5;a.bubble=0;touchToy(w,a,'geyser',earn);emit(w,'geyser',a,'Surprise shower!');}
 if(o.type==='portal'&&d<.8&&a.y<1.3&&!a.portalLock){const pair=w.portalLinks.get(o.id),out=pair?.partner;if(out){a.x=out.x+Math.sin(out.rot)*1.3;a.z=out.z-Math.cos(out.rot)*1.3;a.y=Math.max(.15,a.y);a.vx=Math.sin(out.rot)*2;a.vz=-Math.cos(out.rot)*2;a.portalLock=2;a.inPool=false;touchToy(w,a,'portal',earn);emit(w,'teleport',a,'Wrong door? Right door!');earn(w,'portal',a);}}
 if(o.type==='disco'&&d<1.8&&a.y<.2){a.dance=.2;touchToy(w,a,'disco',earn);if(!a.danceLock){a.danceLock=5;emit(w,'dance',a,a.id==='squidward'?'Do not tell anyone.':'Dance break!');if(a.id==='squidward')earn(w,'dance',a);}}
}
