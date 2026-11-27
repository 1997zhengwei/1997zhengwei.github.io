import * as T from '../vendor/three.module.js';
import {DEFAULT_LOOK} from './progression.mjs';
import {buildCouture,buildRibbonTrail} from './couture.mjs';
const materials=new Map();
function mat(color,glow=0,opacity=1){const k=`${color}:${glow}:${opacity}`;if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial({color,metalness:.14,roughness:.32,emissive:color,emissiveIntensity:Math.max(glow,.08),transparent:opacity<1,opacity,side:T.DoubleSide}));return materials.get(k);}
function mesh(g,geo,color,x=0,y=0,z=0,glow=0,opacity=1){const m=new T.Mesh(geo,mat(color,glow,opacity));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;}
const ball=(g,x,y,z,r,c)=>mesh(g,new T.SphereGeometry(r,12,8),c,x,y,z);
const cyl=(g,x,y,z,r,h,c)=>mesh(g,new T.CylinderGeometry(r,r,h,16),c,x,y,z);
function ring(g,x,y,z,r,c,tube=.04){const m=mesh(g,new T.TorusGeometry(r,tube,7,32),c,x,y,z,.3);return m;}
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function rod(g,a,b,r,color){const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av),m=cyl(g,0,0,0,r,delta.length(),color);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
function starGeometry(size=.1){const shape=new T.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2+Math.PI/2,r=i%2?size*.4:size,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i)shape.lineTo(x,y);else shape.moveTo(x,y);}shape.closePath();return new T.ExtrudeGeometry(shape,{depth:size*.18,bevelEnabled:false});}
function heartGeometry(){const s=new T.Shape();s.moveTo(0,-.12);s.bezierCurveTo(-.25,.03,-.17,.23,0,.1);s.bezierCurveTo(.17,.23,.25,.03,0,-.12);return new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:false});}

export function adornAvatar(avatar,look={},worldScene){
 look={...DEFAULT_LOOK,...look};const color=look.color,head=group(avatar.head,0,.45,0),back=group(avatar.body,0,1.1,-.35),dynamic=[],wings=[];
 if(avatar.nativeCrown)avatar.nativeCrown.visible=look.head==='head_none';
 const couture=buildCouture(head,back,look);
 if(!couture.headHandled){
 if(look.head==='party'){
  mesh(head,new T.ConeGeometry(.36,.72,16),color,0,.32,0);for(const [y,r]of[[.06,.32],[.26,.22],[.46,.12]])ring(head,0,y,0,r,'#fff4f8',.025).rotation.x=Math.PI/2;ball(head,0,.74,0,.11,'#ff79b6');
 }else if(look.head==='tophat'){
  cyl(head,0,.3,0,.34,.6,'#303b6c');cyl(head,0,-.01,0,.53,.07,color);cyl(head,0,.07,0,.35,.14,color);ring(head,0,.62,0,.32,'#fff1ad',.025).rotation.x=Math.PI/2;
 }else if(look.head==='halo'){
  const halo=ring(head,0,.3,0,.56,color,.06);halo.rotation.x=Math.PI/2;dynamic.push({m:halo,base:.3,type:'float'});for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ball(head,Math.cos(a)*.56,.3,Math.sin(a)*.56,.05,'#fff8d0');}
 }else if(look.head==='crown'||look.head==='royal'){
  const royal=look.head==='royal';cyl(head,0,.12,0,.43,.23,color);cyl(head,0,0,0,.49,.07,'#ffe29a');
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2,r=.36;mesh(head,new T.ConeGeometry(.13,royal?.52:.35,5),i%2?color:'#ffe08a',Math.cos(a)*r,.35,Math.sin(a)*r,.15);ball(head,Math.cos(a)*r,royal?.67:.54,Math.sin(a)*r,.065,'#fff5ca');}
  mesh(head,new T.OctahedronGeometry(.12),'#a9b8ff',0,.13,.45,.4);
  if(royal){for(let i=0;i<3;i++){const a=ring(head,0,.42,0,.42,'#f2e6ff',.027);a.rotation.y=i*Math.PI/3;}mesh(head,new T.OctahedronGeometry(.18),'#9ef7ff',0,.88,0,.5);}
 }else if(look.head==='antlers'){
  for(const s of[-1,1]){rod(head,[s*.24,0,0],[s*.46,.72,0],.055,color);rod(head,[s*.34,.31,0],[s*.72,.56,.04],.04,'#dcfaff');rod(head,[s*.43,.56,0],[s*.22,.86,0],.04,'#dcfaff');for(const [x,y]of[[.46,.74],[.72,.56],[.22,.86]])mesh(head,new T.OctahedronGeometry(.085),color,s*x,y,.03,.35);}
 }else if(look.head==='orbit'){
  const orbit=group(head,0,.22,0);ring(orbit,0,0,0,.82,color,.035).rotation.x=1.15;ball(orbit,.72,.32,0,.17,'#ffa3ce');ball(orbit,-.71,-.21,.1,.12,'#8cf5ff');ring(orbit,.72,.32,0,.25,'#fff1c4',.015).rotation.x=.8;dynamic.push({m:orbit,type:'orbit'});
 }else if(look.head==='fireworks'){
  cyl(head,0,.1,0,.4,.2,color);for(let i=0;i<6;i++){const a=i/6*Math.PI*2,x=Math.cos(a)*.53,z=Math.sin(a)*.4,y=.45+(i%2)*.23;rod(head,[0,.1,0],[x,y,z],.022,'#ffecbe');const m=mesh(head,starGeometry(.16),i%2?color:'#ffe361',x,y,z,.5);dynamic.push({m,type:'star',base:y});}
 }
 }
 if(!couture.backHandled){
 if(look.back==='bow'){
  for(const s of[-1,1]){const m=ball(back,s*.38,0,-.1,.38,color);m.scale.set(1.15,.8,.3);m.rotation.z=s*.35;const ribbon=mesh(back,new T.BoxGeometry(.2,.63,.06),color,s*.2,-.38,-.1);ribbon.rotation.z=s*.25;}ball(back,0,0,-.2,.16,'#ffefc5');
 }else if(look.back==='cape'){
  const cloth=mesh(back,new T.PlaneGeometry(1.25,1.45,7,9),color,0,-.45,-.12,.04);dynamic.push({m:cloth,type:'cloth'});for(const s of[-1,1])rod(back,[s*.54,.18,-.15],[s*.59,-1.12,-.2],.025,'#ffe5a1');for(const y of[-.2,-.7])mesh(back,starGeometry(.13),'#ffefae',0,y,-.17,.2);
 }else if(['angel','bat','butterfly','galaxy'].includes(look.back)){
  for(const side of[-1,1]){
   const wing=group(back,side*.18,.05,-.08);wings.push({wing,side});
   if(look.back==='angel'){
    for(let i=0;i<6;i++){const f=ball(wing,side*(.35+i*.13),.2+i*.105,-.05,.22,i%2?color:'#fff9ed');f.scale.set(.55,2.4-i*.18,.32);f.rotation.z=side*(-.55-i*.1);}
   }else if(look.back==='bat'){
    const shape=new T.Shape();shape.moveTo(0,0);for(const [x,y]of[[.35,.7],[1.2,1],[1.05,.12],[.78,.35],[.53,-.35],[.24,-.15],[0,0]])shape.lineTo(x*side,y);mesh(wing,new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false}),color,0,0,0,.08);rod(wing,[0,0,0],[side*1.2,1,0],.035,'#ffe4fc');
   }else if(look.back==='butterfly'){
    for(const [x,y,r,sx,sy]of[[.64,.48,.52,1.1,1.45],[.56,-.25,.4,1.05,.95]]){const m=ball(wing,side*x,y,0,r,color);m.scale.set(sx,sy,.1);const gem=mesh(wing,new T.OctahedronGeometry(r*.36),'#fff0cf',side*x,y,.07,.3);gem.scale.z=.2;}
   }else{
    for(let i=0;i<3;i++){const a=side*(.45+i*.45),m=mesh(wing,new T.ConeGeometry(.24,1.7-i*.16,4),i%2?color:'#9ddfff',side*(.6+i*.1),.38-i*.3,0,.25,.85);m.rotation.z=side*(-.7-i*.5);m.scale.z=.2;mesh(wing,starGeometry(.1),'#fff0b4',side*(1.12+i*.1),.9-i*.48,.06,.4);}
   }
  }
 }else if(look.back==='rocket'){
  for(const s of[-1,1]){cyl(back,s*.33,0,0,.2,.7,'#fff2f0');cyl(back,s*.33,-.19,0,.215,.14,color);mesh(back,new T.ConeGeometry(.21,.3,14),color,s*.33,.48,0);const flame=mesh(back,new T.ConeGeometry(.15,.45,12),'#ffb226',s*.33,-.57,0,.5);flame.rotation.z=Math.PI;dynamic.push({m:flame,type:'flame'});}
 }
 }
 const ribbonTrail=['rainbow','flame','stardust','comet'].includes(look.trail)?buildRibbonTrail(worldScene,look):null;
 const trail=ribbonTrail?.root??group(worldScene),trailPieces=[],history=[];
 if(!ribbonTrail&&look.trail!=='trail_none')for(let i=0;i<14;i++){
  const c=look.trail==='rainbow'?['#ff76a1','#ffc547','#b2f582','#8cefff','#bf9aff'][i%5]:look.trail==='flame'?(i%2?'#ffda69':'#ff805b'):look.trail==='stardust'?(i%2?'#bda4ff':'#9bf5ff'):color;
  const geo=look.trail==='hearts'?heartGeometry():look.trail==='stars'||look.trail==='stardust'?starGeometry(.14):look.trail==='flame'?new T.ConeGeometry(.11,.24,7):new T.SphereGeometry(.11,8,6);
  const m=mesh(trail,geo,c,0,0,0,.3,look.trail==='bubbles'?.48:.88);m.castShadow=false;trailPieces.push(m);
 }
 return {look,head,back,trail,update(p,time,dt,presentation=false){
  couture.update(p,time,dt,presentation);ribbonTrail?.update(p,time,dt,presentation);
  for(const {wing,side}of wings)wing.rotation.y=side*(.12+Math.sin(time*4)*.12);
  for(const d of dynamic){if(d.type==='float')d.m.position.y=d.base+Math.sin(time*3)*.07;else if(d.type==='orbit')d.m.rotation.y=time*.9;else if(d.type==='star'){d.m.rotation.y=time;d.m.position.y=d.base+Math.sin(time*4)*.045;}else if(d.type==='flame')d.m.scale.y=1+Math.sin(time*19)*.25;else if(d.type==='cloth'){const a=d.m.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,Math.sin(time*7+a.getY(i)*5)*.09);a.needsUpdate=true;}}
  const moving=Math.hypot(p.vx??0,p.vz??0)>.5;
  if(moving&&!presentation){history.unshift({x:p.x,y:p.y+.18,z:p.z});if(history.length>45)history.pop();}
  trail.visible=!!ribbonTrail||trailPieces.length>0;
  trailPieces.forEach((m,i)=>{
   const h=history[Math.min(history.length-1,i*2)];
   if(p.trailSwatch){const t=i/13;m.position.set(p.x+(t-.5)*2.8,p.y+.2+Math.sin(t*Math.PI)*.15,p.z+Math.sin(t*Math.PI*2)*.4);m.scale.setScalar(.8+(i%3)*.12);}
   else if(presentation||!moving){const a=time*.7+i/14*Math.PI*2;m.position.set(p.x+Math.cos(a)*.9,p.y+.22+Math.sin(a*2)*.12,p.z+Math.sin(a)*.65);m.scale.setScalar(.55+(i%3)*.15);}
   else if(h){m.position.set(h.x+Math.sin(i*3+time*5)*.08,h.y+Math.sin(time*5+i)*.09,h.z);m.scale.setScalar(1-i/18);}
   m.rotation.y=time*2+i;m.rotation.z=Math.sin(time+i)*.15;
  });
 },dispose(){ribbonTrail?.dispose();const seen=new Set();for(const g of[head,back,trail]){g.traverse(o=>{if(o.isSprite||o.isLineSegments)o.material?.dispose();if(o.geometry&&!seen.has(o.geometry)){seen.add(o.geometry);o.geometry.dispose();}});g.removeFromParent();}}};
}
