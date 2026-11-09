import {THREE,group,box,ball,cylinder,rod,ring,mesh,material,label} from './common.mjs';
import {BOSS_TYPES,bossVulnerable} from './bosses.mjs';
function own(c,options={}){const m=material(c,options);m.userData.owned=true;return m;}
export function makeBossVisual(root,b){
 const g=group(root),body=group(g),kind=b.kind;
 if(kind==='truck'){
  box(body,[4.3,2.6,3.4],'#427f81',[0,1.7,0],.3);box(body,[4.4,.28,3.5],'#e6b44e',[0,3.1,0]);
  for(const x of [-1.8,1.8])for(const z of [-1,1]){const w=cylinder(body,.55,.55,.35,'#324e59',[x,.55,z]);w.rotation.z=Math.PI/2;}
  box(body,[3.4,.5,.2],'#e8c773',[0,.8,1.8]);box(body,[3.4,.65,.12],'#a3d7d1',[0,2.3,1.8]);
  const p=group(body,[0,3.3,0]);ball(p,.47,'#85b66a',[0,.5,0],[.65,1.3,.65]);ball(p,.24,'#f7eac5',[0,.6,.3]);ball(p,.1,'#bb6143',[0,.61,.51]);for(const x of [-.2,.2])rod(p,[x,.9,0],[x*2.5,1.6,0],.025,'#4c7d56');
 }else if(kind==='jelly'){
  ball(body,2.2,own('#d8a1d3',{transparent:true,opacity:.88}),[0,3,0],[1,.67,1]);ring(body,2,.13,'#f1c7e1',[0,2.8,0],Math.PI/2);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(body,[Math.sin(a)*1.5,2.6,Math.cos(a)*1.5],[Math.sin(a)*1.8,.8,Math.cos(a)*1.8],.13,'#b181be');ball(body,.17,'#efbbd7',[Math.sin(a)*1.8,.7,Math.cos(a)*1.8]);}
  cylinder(body,.9,.9,.25,'#f3cb61',[0,4.5,0]);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;mesh(body,new THREE.ConeGeometry(.23,.8,5),'#f3cb61',[Math.sin(a)*.7,4.9,Math.cos(a)*.7]);}
  for(const x of [-.55,.55]){ball(body,.34,'#fff7e2',[x,3.2,1.8]);ball(body,.13,'#624a78',[x,3.2,2.1]);}
 }else if(kind==='vacuum'){
  cylinder(body,1.7,1.9,3,'#9e8dbd',[0,1.9,0]);ring(body,1.73,.15,'#d5bee7',[0,2.8,0],Math.PI/2);ball(body,1.5,'#7389a6',[0,3.5,0],[1,.35,1]);
  const nozzle=cylinder(body,1.15,.65,2,'#425f76',[0,1.6,2]);nozzle.rotation.x=Math.PI/2;ring(body,1.16,.15,'#e2c274',[0,1.6,3.05]);
  for(const x of [-1.5,1.5]){box(body,[.7,.6,2.4],'#405e69',[x,.35,0]);ball(body,.17,'#f1db90',[x,2.8,.9]);}
 }else{
  ball(body,2,'#cf805d',[0,1.6,0],[1,.6,.85]);box(body,[2.4,.45,1.6],'#e9b77b',[0,2.1,0],.3);
  for(const side of [-1,1]){for(let i=0;i<3;i++){const z=(i-1)*1.1;rod(body,[side*1.5,1,z],[side*2.8,.5,z+.5],.17,'#b6604d');rod(body,[side*2.8,.5,z+.5],[side*3.1,.12,z+.8],.13,'#d89768');}
   rod(body,[side*1.4,1.5,.7],[side*2.5,2.1,1.5],.28,'#b45d4e');ball(body,.9,'#df986b',[side*2.7,2.4,1.8],[.8,1,.65]);box(body,[.15,.8,.8],'#663f42',[side*2.7,2.6,2.1]);
   rod(body,[side*.6,2.1,.5],[side*.7,3.2,.8],.1,'#ab6351');ball(body,.3,'#fff0cf',[side*.7,3.2,.8]);ball(body,.12,'#43565a',[side*.7,3.2,1.05]);}
 }
 const target=ring(g,2.6,.1,own('#f0c966'),[0,.07,0],Math.PI/2);
 const title=label(g,BOSS_TYPES[kind].name,0,0,'#395e65',kind==='jelly'?6.4:5.8,6);
 const warning=box(root,[4.3,.025,17],own('#ed8d68',{transparent:true,opacity:.38,depthWrite:false}),[0,.025,0],0);warning.castShadow=false;
 const zones=Array.from({length:3},()=>{const g=group(root),fill=mesh(g,new THREE.CircleGeometry(1,48),own('#e6af54',{transparent:true,opacity:.28,depthWrite:false}),[0,.035,0]);fill.rotation.x=-Math.PI/2;fill.castShadow=false;const edge=ring(g,1,.025,own('#e8b766'),[0,.06,0],Math.PI/2);return {g,fill,edge};});
 const vertices=[];for(let i=0;i<30;i++){const a=-.6+i*1.2/30,c=a+1.2/30;vertices.push(0,0,0,Math.sin(a)*15,0,Math.cos(a)*15,Math.sin(c)*15,0,Math.cos(c)*15);}
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geom.computeVertexNormals();
 const cone=mesh(root,geom,own('#ab8bd8',{transparent:true,opacity:.26,side:THREE.DoubleSide,depthWrite:false}),[0,.05,0]);cone.castShadow=false;
 const suction=Array.from({length:7},()=>{const m=ring(root,.3,.03,'#e4d6ed');m.visible=false;return m;});
 return {g,body,target,title,warning,zones,cone,suction,extras:[warning,...zones.map(o=>o.g),cone,...suction]};
}
export function updateBossVisual(v,b,t){
 v.g.position.set(b.x,0,b.z);v.body.rotation.y=b.angle;v.g.rotation.z=b.dead?.18:0;v.g.scale.setScalar(b.phase==='arrive'?Math.max(.1,1-b.clock/2):1);
 v.body.position.y=b.kind==='jelly'?Math.sin(t*2)*.2:b.kind==='crab'&&b.phase==='attack'&&b.clock>.65?Math.sin((1.2-b.clock)/.55*Math.PI)*4:0;
 const open=bossVulnerable(b);v.target.material.color.set(open?'#70e6ab':'#eeae68');v.target.visible=v.title.visible=!b.dead;
 v.warning.visible=b.kind==='truck'&&b.phase==='warning';v.warning.position.set(b.x+Math.sin(b.angle)*8.5,.04,b.z+Math.cos(b.angle)*8.5);v.warning.rotation.y=b.angle;
 v.zones.forEach((o,i)=>{const q=b.zones[i];o.g.visible=!!q&&!b.dead;if(q){o.g.position.set(q.x,0,q.z);o.g.scale.setScalar(q.r);o.fill.material.color.set(q.active?'#ea789f':'#e8bd62');o.fill.material.opacity=q.active?.5:.22;o.edge.material.color.set(q.active?'#f19db9':'#e8c267');}});
 v.cone.visible=b.kind==='vacuum'&&['warning','attack'].includes(b.phase);v.cone.position.set(b.x,.05,b.z);v.cone.rotation.y=b.angle;v.cone.material.opacity=b.phase==='attack'?.36:.18;
 v.suction.forEach((m,i)=>{m.visible=v.cone.visible&&b.phase==='attack';const d=2+((i*1.7-t*5)%11+11)%11;m.position.set(b.x+Math.sin(b.angle)*d,1.3,b.z+Math.cos(b.angle)*d);m.rotation.y=b.angle;m.scale.setScalar(.5+d*.08);});
}
