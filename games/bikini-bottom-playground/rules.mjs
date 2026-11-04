import {SLIDE_TYPES,trySlide,updateSlide} from './slides.mjs';
import {EXTRA_TYPES,conveyorInside,portalPairs,updateExtraActor,extraInteraction,touchToy} from './expansion.mjs';
export const LIMIT=64, EDGE={x:16,z:14};
export const TYPES={...SLIDE_TYPES,...EXTRA_TYPES,trampoline:{name:'Trampoline',icon:'↟',color:'#ee91af',hint:'Bounce high. Rotate to choose the launch direction.'},fan:{name:'Fan',icon:'≋',color:'#8bd6ce',hint:'Blows along its arrow. SpongeBob flies furthest!'},bubble:{name:'Bubble lift',icon:'◌',color:'#a8b9ee',hint:'Step close to float up, then drift with a fan.'},ramp:{name:'Slide',icon:'↗',color:'#f0bf72',hint:'Walk onto the blue end. Slide out along the arrow.'},crate:{name:'Box',icon:'▣',color:'#c99561',hint:'Push it, knock it over, or stack boxes in Build mode.'},burger:{name:'Krabby Patty',icon:'☰',color:'#efaa74',hint:'Patrick follows the smell. Build something in his path!'}};
export const STARTS=[{id:'sponge',name:'SpongeBob',x:-4,z:4,mass:1},{id:'patrick',name:'Patrick',x:4.8,z:4,mass:2.7},{id:'squidward',name:'Squidward',x:4.5,z:-4,mass:1.5}];
export const POOL={x:4.6,z:-.8,r:2.05};
export const defaultLayout=()=>[{id:1,type:'trampoline',x:-4,z:1.5,rot:0},{id:2,type:'fan',x:-6,z:-1,rot:Math.PI/2},{id:3,type:'bubble',x:-2,z:-2,rot:0},{id:4,type:'ramp',x:1,z:3,rot:-Math.PI/2},{id:5,type:'burger',x:4.6,z:-.8,rot:0},{id:6,type:'crate',x:0,z:-4,rot:0},{id:7,type:'crate',x:0,z:-4,rot:0,level:1},{id:8,type:'crate',x:0,z:-4,rot:0,level:2},{id:9,type:'waterslide',x:-10,z:0,rot:0},{id:10,type:'spiralslide',x:10,z:7,rot:0},{id:11,type:'jumpslide',x:-2,z:7,rot:0}];
export function validLayout(raw,endless=false){return Array.isArray(raw)&&(endless||raw.length<=LIMIT)&&raw.every(o=>o&&Number.isInteger(o.id)&&o.id>0&&Object.hasOwn(TYPES,o.type)&&Number.isFinite(o.x)&&(endless||Math.abs(o.x)<=EDGE.x)&&Number.isFinite(o.z)&&(endless||Math.abs(o.z)<=EDGE.z)&&Number.isFinite(o.rot)&&(o.level===undefined||Number.isInteger(o.level)&&o.level<=3&&o.level>=0))&&new Set(raw.map(o=>o.id)).size===raw.length;}
export function makeWorld(layout,{endless=false}={}){return {endless,time:0,portalLinks:portalPairs(layout),bestCombo:0,actors:STARTS.map(p=>({...p,y:0,vx:0,vz:0,vy:0,heading:0,cool:0,bubble:0,wet:0,react:0,say:'',homeX:p.x,homeZ:p.z})),objects:layout.map(o=>({...o,y:o.type==='crate'?(o.level||0)*.95:0,vx:0,vz:0,vy:0,cool:0,eaten:0,tilt:0,knocked:false})),earned:[],stats:{bounces:0,splashes:0,knocks:0},events:[]};}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function emit(w,type,a,text){w.events.push({type,actor:a.id,x:a.x,y:a.y,z:a.z,text});a.say=text;a.react=2.4;}
function earn(w,id,a){if(!w.earned.includes(id)){w.earned.push(id);w.events.push({type:'discovery',id,x:a.x,y:a.y,z:a.z});}}
function constrain(b,endless=false){if(endless)return;for(const axis of ['x','z']){const edge=EDGE[axis]-.3;if(Math.abs(b[axis])>edge){b[axis]=Math.sign(b[axis])*edge;b['v'+axis]*=-.45;}}}
export function step(w,dt,control={id:'sponge',x:0,z:0,target:null}){
 dt=Math.min(.033,Math.max(0,dt));w.events=[];w.time+=dt;const active=w.endless?w.objects.filter(o=>w.actors.some(a=>Math.abs(o.x-a.x)<36&&Math.abs(o.z-a.z)<36)):w.objects;
 for(const o of active){o.cool=Math.max(0,o.cool-dt);o.eaten=Math.max(0,o.eaten-dt);if(o.type!=='crate')continue;for(const belt of active)if(belt.type==='conveyor'&&conveyorInside(o,belt)){o.vx+=Math.sin(belt.rot)*18*dt;o.vz-=Math.cos(belt.rot)*18*dt;}o.vy-=dt*13;o.y+=o.vy*dt;o.x+=o.vx*dt;o.z+=o.vz*dt;o.vx*=Math.exp(-dt*2.3);o.vz*=Math.exp(-dt*2.3);let support=0;for(const b of active)if(b!==o&&b.type==='crate'&&Math.abs(o.x-b.x)<.75&&Math.abs(o.z-b.z)<.75&&b.y+.9<=o.y+.25)support=Math.max(support,b.y+.95);if(o.y<support){o.y=support;o.vy=0;}o.tilt*=Math.exp(-dt*1.7);constrain(o,w.endless);}
 for(const a of w.actors){a.cool=Math.max(0,a.cool-dt);a.react=Math.max(0,a.react-dt);a.wet=Math.max(0,a.wet-dt);a.bubble=Math.max(0,a.bubble-dt);if(updateSlide(w,a,dt,emit,touchToy,earn)||updateExtraActor(w,a,dt,emit,earn))continue;let dx=0,dz=0;
  if(a.id===control.id){dx=control.x||0;dz=control.z||0;if(control.target&&!dx&&!dz){const d=distance(a,control.target);if(d>.22){dx=(control.target.x-a.x)/d;dz=(control.target.z-a.z)/d;}}}
  else if(a.id==='patrick'){let b=active.filter(o=>o.type==='burger'&&!o.eaten).sort((b,c)=>distance(a,b)-distance(a,c))[0];if(b){let d=distance(a,b);if(d>.45){dx=(b.x-a.x)/d;dz=(b.z-a.z)/d;}else if(a.y<.8){b.eaten=7;emit(w,'eat',a,'Worth the trip.');}}}
  else if(a.id==='squidward'){const target={x:a.homeX,z:a.homeZ},d=distance(a,target);if(d>.3){dx=(target.x-a.x)/d;dz=(target.z-a.z)/d;}}
  else {dx=Math.sin(w.time*.34)*.28;dz=Math.cos(w.time*.27)*.28;}
  const len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len;}const ground=a.y<.1&&!a.bubble,accel=ground?19:6;
  a.vx+=dx*accel*dt;a.vz+=dz*accel*dt;const damping=ground?5:.65;a.vx*=Math.exp(-dt*damping);a.vz*=Math.exp(-dt*damping);a.vy-=13*dt;
  if(a.bubble){a.vy=Math.max(a.vy,1.8);if(a.y>4.8){a.bubble=0;a.vy=1;emit(w,'pop',a,'Pop!');}}
  for(const o of active){trySlide(w,a,o,emit);extraInteraction(w,a,o,dt,emit,earn);const d=distance(a,o),fx=Math.sin(o.rot),fz=-Math.cos(o.rot);if(o.type==='fan'){const ax=a.x-o.x,az=a.z-o.z,along=ax*fx+az*fz,side=Math.abs(ax*fz-az*fx);if(along>-.2&&along<5.5&&side<1.5&&a.y<5.5){touchToy(w,a,'fan',earn);const force=23/a.mass*(1-along/7);a.vx+=fx*force*dt;a.vz+=fz*force*dt;if(a.y>.3)a.vy+=dt*3/a.mass;}}
   if(o.type==='bubble'&&d<1.15&&a.y<.35&&!a.cool){touchToy(w,a,'bubble',earn);a.bubble=2.8;a.cool=5;a.vy=2.3;emit(w,'bubble',a,a.id==='sponge'?'I am a bubble!':'Floating?!');}
   if(o.type==='trampoline'&&d<1.08&&a.y<.4&&a.vy<=0&&!a.cool){touchToy(w,a,'trampoline',earn);a.vy=a.id==='patrick'?10:12.5;a.vx+=fx*3.4;a.vz+=fz*3.4;a.cool=.7;o.cool=.4;w.stats.bounces++;emit(w,'bounce',a,a.id==='patrick'?'Again!':'Boing!');}
   if(o.type==='ramp'&&d<.95&&a.y<.15&&!a.cool){touchToy(w,a,'ramp',earn);a.vx=fx*9;a.vz=fz*9;a.vy=5.3;a.cool=1.2;emit(w,'slide',a,'Wheee!');}
   if(o.type==='crate'&&Math.abs(a.y-o.y)<.85&&d<1.0&&d>.001){const nx=(a.x-o.x)/d,nz=(a.z-o.z)/d,impact=Math.hypot(a.vx,a.vz);o.vx-=nx*(impact+2)*a.mass*.7;o.vz-=nz*(impact+2)*a.mass*.7;o.tilt=.45; a.x+=nx*(1-d)*.65;a.z+=nz*(1-d)*.65;if(impact>1.8&&!o.knocked){touchToy(w,a,'crate',earn);o.knocked=true;w.stats.knocks++;emit(w,'bonk',a,a.id==='patrick'?'Oops.':'Timber!');}}
  }
  a.vx=Math.max(-14,Math.min(14,a.vx));a.vz=Math.max(-14,Math.min(14,a.vz));a.x+=a.vx*dt;a.z+=a.vz*dt;a.y+=a.vy*dt;
  if(a.y<=0){const impact=-a.vy;a.y=0;a.vy=0;if(impact>4){a.squash=.5;if(distance(a,POOL)<POOL.r){w.stats.splashes++;a.wet=2;emit(w,'splash',a,a.id==='squidward'?'My book!':'SPLASH!');if(a.id==='patrick')earn(w,'pool',a);if(a.airmail)earn(w,'airmail',a);}else if(impact>9)emit(w,'land',a,'Soft landing!');}}
  const inPool=distance(a,POOL)<POOL.r&&a.y<.1;if(inPool&&!a.inPool&&!a.wet){a.wet=2;w.stats.splashes++;emit(w,'splash',a,'Pool party!');if(a.id==='patrick')earn(w,'pool',a);if(a.airmail)earn(w,'airmail',a);}a.inPool=inPool;
  if(a.y>4)earn(w,'bounce',a);if(a.id==='sponge'&&a.bubble&&a.y>2.5)earn(w,'bubble',a);if(w.stats.knocks>=3)earn(w,'tower',a);
  if(a.id==='squidward'&&a.react>1.8&&a.say!=='A little peace, please.'&&Math.abs(a.vx)+Math.abs(a.vz)>4){a.homeX=a.x>0?-5:5;a.homeZ=-5;a.say='A little peace, please.';}
  a.squash=Math.max(0,(a.squash||0)-dt*2);if(Math.hypot(a.vx,a.vz)>.4)a.heading=Math.atan2(a.vx,a.vz);constrain(a,w.endless);
 }
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){const a=w.actors[i],b=w.actors[j],d=distance(a,b);if(!a.ride&&!b.ride&&d<1&&d>.001&&Math.abs(a.y-b.y)<1){const nx=(b.x-a.x)/d,nz=(b.z-a.z)/d,push=(1-d)*.5;a.x-=nx*push;b.x+=nx*push;a.z-=nz*push;b.z+=nz*push;const relative=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;if(relative>0){const k=relative*.9/(a.mass+b.mass);a.vx-=nx*k*b.mass;a.vz-=nz*k*b.mass;b.vx+=nx*k*a.mass;b.vz+=nz*k*a.mass;}}}
 return w.events;
}
