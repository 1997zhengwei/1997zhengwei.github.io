import {THREE,group,box,ball,cylinder,rod,ring,material,textSprite} from './world.mjs';
import {geyserActive} from './expansion.mjs';
const portalColors=['#aa92e0','#efb578','#90cba5','#e6a1b7'];
export function buildExtra(g,o,arrow){
 if(o.type==='cannon'){
  box(g,[1.4,.35,1.4],'#ba856b',[0,.3,0],.12);
  for(const x of [-.78,.78]){const wheel=cylinder(g,.4,.4,.16,'#4a7377',[x,.3,.25]);wheel.rotation.z=Math.PI/2;}
  const barrel=group(g,[0,.8,-.2]);barrel.rotation.x=-Math.PI/3;
  cylinder(barrel,.56,.44,1.6,'#e8ad70');cylinder(barrel,.45,.45,.025,'#34575a',[0,.81,0]);ring(barrel,.53,.07,'#fff1bc',[0,.78,0],Math.PI/2);
  for(const y of [-.6,.4])ring(barrel,.53,.035,'#bd785a',[0,y,0],Math.PI/2);
  g.userData.barrel=barrel;arrow(g);ball(g,.13,'#ffdf9a',[0,.65,.8]);
 }
 if(o.type==='conveyor'){
  box(g,[1.7,.2,3],'#56827b',[0,.12,0],.12);box(g,[1.45,.07,2.9],'#97c7a2',[0,.25,0]);
  for(const x of [-.85,.85])box(g,[.12,.3,3.1],'#e7dcb3',[x,.16,0],.04);
  const slats=[];for(let i=0;i<7;i++)slats.push(box(g,[1.35,.04,.09],'#c3e4b2',[0,.3,-1.4+i*.42],.01));g.userData.slats=slats;arrow(g,'#fff4b9');
 }
 if(o.type==='geyser'){
  cylinder(g,1.02,1.12,.2,'#76a4ad',[0,.1,0],32);ring(g,.9,.08,'#d3e8d6',[0,.23,0],Math.PI/2);
  for(let i=-2;i<=2;i++)box(g,[1.25,.05,.08],'#3e727d',[0,.23,i*.22],.02);
  const jet=group(g,[0,.25,0]);cylinder(jet,.3,.5,1,material('#b1edeb',{transparent:true,opacity:.62,roughness:.2}),[0,.5,0]);
  for(let i=0;i<7;i++)ball(jet,.16,'#d4f7e5',[Math.sin(i*3)*.6,.7+(i%3)*.15,Math.cos(i*3)*.6],[1,.5,1]);g.userData.jet=jet;
  const ticks=[];for(let i=0;i<5;i++)ticks.push(ball(g,.09,'#ffc979',[Math.sin(i*1.256)*.8,.28,Math.cos(i*1.256)*.8]));g.userData.ticks=ticks;
 }
 if(o.type==='portal'){
  const color=portalColors[(o.pairIndex||0)%portalColors.length];cylinder(g,.93,1.05,.18,'#657e97',[0,.09,0],32);
  ring(g,1,.15,color,[0,1.1,0]);const inner=ring(g,.82,.045,'#ecddfa',[0,1.1,0]);g.userData.portalRing=inner;
  const glass=ball(g,.84,material(color,{transparent:true,opacity:.22,depthWrite:false}),[0,1.1,0],[1,1,.1]);glass.castShadow=false;
  const label=textSprite(g,o.linked===false?'ADD 2ND':(o.pairLabel||'A'),{scale:o.linked===false?1.7:1.4,bg:'#52647b',color:'#fff3cf'});label.position.set(0,2.45,0);g.userData.portalLabel=label;arrow(g,color);
 }
 if(o.type==='disco'){
  cylinder(g,1.8,1.8,.15,'#967c9c',[0,.08,0],40);ring(g,1.78,.05,'#f8d3c4',[0,.18,0],Math.PI/2);
  for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)box(g,[.82,.05,.82],['#d4b0ce','#a7d8cb','#e6cb92'][(x+z+6)%3],[x*.88,.18,z*.88],.08);
  for(const x of [-1.95,1.95]){box(g,[.55,.9,.5],'#506775',[x,.5,0],.08);for(const y of [.3,.7])ball(g,.16,'#abb8c8',[x,y,.26],[1,1,.2]);}
  rod(g,[0,0,-1.6],[0,3.2,-1.6],.05,'#aa92aa');const mirror=ball(g,.38,'#c3d7e2',[0,3.2,-1.6]);g.userData.mirror=mirror;
 }
}
export function animateExtra(m,o,w,mode){
 const t=w.time;
 if(m.userData.slats)m.userData.slats.forEach((s,i)=>s.position.z=1.4-((t*2.7+i*.42)%2.8));
 if(m.userData.barrel){const loaded=w.actors.some(a=>a.loaded?.id===o.id);m.userData.barrel.scale.y=loaded?1+Math.sin(t*15)*.04:1;m.userData.barrel.position.z=-.2+(o.cool>1.3&&!loaded ? .15 : 0);}
 if(m.userData.jet){const active=mode==='play'&&geyserActive(t,o);m.userData.jet.scale.y=active?3.2+Math.sin(t*13)*.5:.15;m.userData.jet.visible=active||mode==='build';const phase=(t+(o.id%3)*.5)%5;m.userData.ticks.forEach((b,i)=>b.scale.setScalar(phase>i?.9: .4));}
 if(m.userData.portalRing){m.userData.portalRing.scale.setScalar(.96+Math.sin(t*2)*.04);m.userData.portalRing.rotation.z=t*.4;}
 if(m.userData.mirror)m.userData.mirror.rotation.y=t*.8;
}
