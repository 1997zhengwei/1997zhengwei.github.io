import {elasticRope} from './rope.mjs?v=elastic-2';
import {THREE,box,ball,cylinder,rod,ring,group,mesh,material,coral} from './world.mjs?v=elastic-2';
import {sponge,patrick,gary} from './characters.mjs?v=elastic-2';
import {dressSponge,dressPatrick} from './sportswear.mjs?v=elastic-2';
import {jellyPosition,chapterIndex} from './rules.mjs?v=elastic-2';
import {actorPose,ROUTE_FINISH} from './landing.mjs?v=elastic-2';
const V=(x,y,z=0)=>new THREE.Vector3(x,y,z);
export function createScene(host,s){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#83d1cf');scene.fog=new THREE.Fog('#83d1cf',36,100);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;host.append(renderer.domElement);
 const camera=new THREE.OrthographicCamera(-10,10,9,-9,.1,160);
 scene.add(new THREE.HemisphereLight('#e8ffff','#829c7a',2.5));
 const sun=new THREE.DirectionalLight('#fff0ce',3.3);sun.position.set(-10,18,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:12,bottom:-10,near:.5,far:70});sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
 const decorations=new THREE.Group();scene.add(decorations);
 const actors=[sponge(scene),patrick(scene)];dressSponge(actors[0]);dressPatrick(actors[1]);actors.forEach(a=>a.scale.setScalar(.63));
 const shield=ball(scene,1.1,material('#d0fff0',{transparent:true,opacity:.19,metalness:.45,roughness:.1,depthWrite:false}));shield.castShadow=false;shield.visible=false;
 // Art and collision use separate groups: model squash never changes foot positions.
 const anchorRing=ring(scene,.48,.045,'#fff1a1',[0,.06,.05],Math.PI/2);anchorRing.scale.set(1.15,1,1);anchorRing.material=material('#fff4c0',{emissive:'#d6a64d',emissiveIntensity:.25});
 const landingRing=ring(scene,.49,.06,'#a4f6ab',[0,.07,.05],Math.PI/2);landingRing.material=material('#8ceaa7',{emissive:'#68dd8e',emissiveIntensity:.48});
 const arrow=mesh(scene,new THREE.ConeGeometry(.17,.3,3),material('#fff0af',{emissive:'#d4a442',emissiveIntensity:.2}));arrow.rotation.z=Math.PI;
 const rope=elasticRope(scene);
 const dashed=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:'#effde0',transparent:true,opacity:.45,dashSize:.13,gapSize:.16}));scene.add(dashed);
 const platforms=new Map(),foods=new Map(),jellies=new Map(),effects=[];
 function burger(parent,x,y,scale=.5){const g=group(parent,[x,y,.12]);g.scale.setScalar(scale);ball(g,.55,'#e7a748',[0,.3,0],[1,.52,.8]);cylinder(g,.52,.53,.17,'#e4a349',[0,-.23,0]);cylinder(g,.55,.55,.16,'#714838',[0,-.06,0]);cylinder(g,.58,.54,.07,'#72b66d',[0,.06,0]);box(g,[.82,.055,.68],'#f6d64e',[0,.14,0],.02).rotation.y=.2;for(let i=0;i<6;i++)ball(g,.025,'#fff1c0',[(i%3-1)*.22,.54-(i%2)*.06,(i<3?.15:-.15)],[.5,1,1]);return g;}
 function addPlatform(p){
  if(platforms.has(p.id))return;const g=group(scene,[p.x,p.y,0]);
  const colors={sand:['#f2dfaa','#bf9e75'],wood:['#d4aa77','#7f6c68'],coral:['#d8b8cf','#9b809e'],glass:['#b6e4dc','#71a8a8']};const c=colors[p.type];
  if(p.type==='sand'){
   box(g,[p.w,.32,2.6],c[0],[0,-.16,0],.12);box(g,[p.w-.12,5.5,2.35],c[1],[0,-3.03,-.02],.11);
   for(let i=0;i<Math.max(3,Math.floor(p.w*2));i++)ball(g,.035,'#ceac79',[(i+.4)*p.w/Math.ceil(p.w*2)-p.w/2,.015,.6-(i%3)*.45],[1,.2,1]);
   coral(g,[-p.w/2+.45,-.03,-1.1],p.id%2?'#cb9eb9':'#dc9a7d',.5);
  }else{
   box(g,[p.w,.25,2],c[0],[0,-.13,0],.06);box(g,[p.w+.04,.12,2.03],c[1],[0,-.31,0],.035);
   for(let i=0;i<Math.floor(p.w/.4);i++)box(g,[.018,.01,1.85],c[1],[-p.w/2+.3+i*.4,.003,0],0);
   if(p.type==='wood'){for(const x of [-p.w*.28,p.w*.28])cylinder(g,.075,.09,2.5,'#a68872',[x,-1.5,-.5],7);}
   if(p.type==='coral'){for(const x of [-p.w*.32,p.w*.32])ball(g,.27,'#ac8ea6',[x,-.47,-.3],[1,1.5,1]);}
   if(p.type==='glass'){const m=ball(g,.6,material('#bdece3',{transparent:true,opacity:.28,metalness:.2,roughness:.2}),[0,-.7,0],[1,.8,1]);m.castShadow=false;}
  }
  if(p.checkpoint&&p.id>0){rod(g,[0,0,-.75],[0,2.4,-.75],.045,'#fdedbc');box(g,[.85,.48,.045],'#ec9f99',[.4,2.12,-.75],.06);ring(g,.13,.025,'#fff7d1',[.4,2.12,-.71]);}
  platforms.set(p.id,g);
  if(p.burger)foods.set(p.id,burger(scene,p.x,1.4,.72));
  if(p.jelly){const j=group(scene);ball(j,.48,material('#ed9ec5',{transparent:true,opacity:.82,roughness:.25}),[0,.1,0],[1,.65,.85]);ring(j,.42,.035,'#ffe3e2',[0,-.04,0],Math.PI/2);for(const x of [-.26,0,.26])rod(j,[x,-.05,0],[x+.08,-.65,0],.025,'#c48ab9');for(const x of [-.14,.14])ball(j,.038,'#796580',[x,.1,.38]);jellies.set(p.id,j);}
 }
 s.platforms.forEach(addPlatform);
 // Quiet background shapes give depth without obscuring the actual route.
 const bg=new THREE.Group();scene.add(bg);
 for(let i=-2;i<20;i++){
  const x=i*13;ball(bg,5.7,'#73bfc3',[x,-5,-10],[1.5,1.3,.5]);ball(bg,5.2,'#68b3be',[x+7,-7,-15],[1.6,2,.7]);
  const pts=[];for(let j=0;j<=100;j++){const a=j/100*Math.PI*2,r=1.55+Math.sin(a*5)*.48;pts.push(V(x+4+Math.cos(a)*r,7.3+Math.sin(a)*r,-22));}
  bg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:i%2?'#b3d8c1':'#6ebbbc',transparent:true,opacity:.65})));ring(bg,.26,.045,'#b6d9bd',[x+4,7.3,-21.9]);
 }
 // SpongeBob's pineapple and neighboring rock, built as actual scene geometry.
 const home=group(decorations,[-5.3,-.02,-3.5]);ball(home,2,'#d9a469',[0,1.7,0],[.72,1,.65]);
 for(let row=0;row<5;row++)for(let col=0;col<4;col++){const x=(col-1.5)*.53+(row%2)*.22;rod(home,[x-.2,.35+row*.6,1.15],[x+.2,.8+row*.6,1.15],.025,'#b98959');rod(home,[x+.2,.35+row*.6,1.15],[x-.2,.8+row*.6,1.15],.025,'#b98959');}
 for(let i=0;i<7;i++){const a=i*2.4;const leaf=ball(home,.9,'#5eae88',[Math.sin(a)*.55,3.9+Math.cos(a)*.2,Math.cos(a)*.35],[.2,1,.22]);leaf.rotation.z=Math.sin(a)*.55;}
 box(home,[.65,1.05,.1],'#61949a',[0,.52,1.28],.15);ring(home,.36,.06,'#8ac3c5',[.64,1.9,1.2]);ball(home,.27,'#8ebdc2',[.64,1.9,1.18],[1,1,.2]);
 ball(decorations,1.7,'#bc9a91',[-10,.1,-4],[1.5,.6,1]);const snail=gary(decorations);snail.position.set(-3.7,0,1);snail.scale.setScalar(.65);
 const finish=group(decorations,[121,0,-3.1]);box(finish,[7,3.1,3.5],'#b89878',[0,1.5,0],.15);const roof=mesh(finish,new THREE.CylinderGeometry(2.8,2.8,7.4,18,1,false,0,Math.PI),'#698e83',[0,3.05,0]);roof.rotation.z=Math.PI/2;roof.rotation.x=Math.PI/2;box(finish,[1.2,1.9,.12],'#789a91',[0,.95,1.8],.12);for(const x of [-2.3,2.3]){ball(finish,.55,'#86bfc0',[x,1.7,1.8],[1,1,.14]);ring(finish,.55,.06,'#dfca9a',[x,1.7,1.87]);}rod(finish,[4,0,0],[4,5.7,0],.065,'#dbc99f');const sign=box(finish,[3.2,1.4,.2],'#e1cbb2',[4,5.5,0],.4);const tc=document.createElement('canvas');tc.width=512;tc.height=256;const ctx=tc.getContext('2d');ctx.fillStyle='#decaaf';ctx.fillRect(0,0,512,256);ctx.fillStyle='#844f4f';ctx.font='bold 66px Trebuchet MS';ctx.textAlign='center';ctx.fillText('KRUSTY',256,112);ctx.fillText('KRAB',256,188);const tx=new THREE.CanvasTexture(tc);tx.colorSpace=THREE.SRGBColorSpace;mesh(finish,new THREE.PlaneGeometry(2.9,1.2),new THREE.MeshBasicMaterial({map:tx}),[4,5.5,.17]);
 const bubbleGeo=new THREE.SphereGeometry(.06,8,6),bubbleMat=new THREE.MeshBasicMaterial({color:'#e4ffff',transparent:true,opacity:.4});const bubbles=[];for(let i=0;i<45;i++){const b=new THREE.Mesh(bubbleGeo,bubbleMat);scene.add(b);bubbles.push({m:b,x:(i*7.31)%42-15,y:(i*2.43)%18-4,z:-3-i%8});}
 let cx=-2,cy=2.4,width=0,height=0;
 function resetRoute(){rope.reset();for(const map of [platforms,foods,jellies]){for(const node of map.values()){node.removeFromParent();node.traverse(o=>o.geometry?.dispose());}map.clear();}for(const e of effects){e.m.removeFromParent();e.m.geometry.dispose();}effects.length=0;s.platforms.forEach(addPlatform);cx=-2;}
 function resize(){width=host.clientWidth;height=host.clientHeight;renderer.setSize(width,height,false);const aspect=width/height;const w=aspect<.8?13.2:aspect<1.2?16.8:Math.min(35,aspect*17);const h=w/aspect;camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(host);resize();
 function burst(x,y,color,count=12){for(let i=0;i<count;i++){const m=mesh(scene,new THREE.OctahedronGeometry(.055),color,[x,y+.5,.6]);m.castShadow=false;effects.push({m,life:1,v:V((Math.random()-.5)*3,Math.random()*3,0)});}}
 function puff(x,y){for(let i=0;i<7;i++){const m=mesh(scene,new THREE.SphereGeometry(.045,6,4),'#efdbb0',[x+(Math.random()-.5)*.5,y+.03,.55+Math.random()*.16]);m.castShadow=false;effects.push({m,life:.42,total:.42,v:V((Math.random()-.5)*1.3,.3+Math.random()*.5,0)});}}
 function update(dt){
  for(const p of s.platforms)addPlatform(p);
  const anchor=s.actors[s.anchor],free=s.actors[1-s.anchor];
  shield.visible=s.shieldTime>0;shield.position.set(free.x,free.y+.8,.2);shield.scale.setScalar(1+Math.sin(s.time*8)*.05);finish.visible=!s.endless;finish.position.x=ROUTE_FINISH+1;
  const ch=chapterIndex(anchor.x);const sky=new THREE.Color(['#83d1cf','#86c9cf','#75b6bf'][ch]);scene.background.lerp(sky,.02);scene.fog.color.copy(scene.background);
  const intro=s.phase==='ready',portrait=width/height<1.2;
  const targetX=intro?(portrait?0:-4):(anchor.x+(portrait?2.4:3.8));
  cx+=(targetX-cx)*(1-Math.exp(-dt*5));const worldH=camera.top*2;
  const targetY=(portrait?worldH*.085:worldH*.04)+.3;cy+=(targetY-cy)*(1-Math.exp(-dt*3));camera.position.set(cx,cy+2.1,35);camera.lookAt(cx,cy,-2);
  sun.position.set(cx-7,18,12);sun.target.position.set(cx,0,0);sun.target.updateMatrixWorld();
  actors.forEach((model,i)=>{
   const a=s.actors[i],pose=actorPose(a);
   const flying=!a.grounded&&s.phase==='playing'&&!a.hopping;
   model.position.set(a.x,a.y+.14+(pose?.height??0),.25);const squash=pose?.squash??0;
   model.scale.set(.63*(1+squash*.45),.63*(1-squash),.63*(1+squash*.25));
   model.rotation.z=pose?pose.lean:(flying?Math.cos(s.theta)*-.18:Math.sin(s.time*3)*.02);
   model.rotation.y=Math.sin(s.time*1.8)*.045;
   model.userData.legs?.forEach((leg,j)=>{leg.rotation.z=(j===0?1:-1)*(pose?.leg??(flying?Math.sin(s.theta*2)*.10:0));});
   model.userData.arms?.forEach((arm,j)=>{arm.rotation.z=(j===0?-1:1)*(flying?.85:pose?.leg?Math.abs(pose.leg)*.8+.18:.16);});
  });
  anchorRing.position.set(anchor.x,.06+anchor.y,.1);anchorRing.visible=!['falling','lost'].includes(s.phase);anchorRing.material.color.set(s.anchor===0?'#ffe090':'#f9b6c9');
  landingRing.visible=s.canCatch;landingRing.position.set(free.x,.08+free.y,.1);landingRing.scale.setScalar(1+Math.sin(s.time*15)*.08);
  arrow.position.set(anchor.x,anchor.y+2.45+Math.sin(s.time*4)*.1,.3);arrow.material.color.set(s.anchor===0?'#ffe090':'#f5a8c4');arrow.visible=anchorRing.visible;
  const from=V(s.actors[0].x,s.actors[0].y+.8+(actorPose(s.actors[0])?.height??0),.4),to=V(s.actors[1].x,s.actors[1].y+.8+(actorPose(s.actors[1])?.height??0),.4);
  rope.update(from,to,s.length,s.rope.pulse,dt);
  const points=s.preview.map(p=>V(p.x,p.y+.1,-.12));dashed.geometry.dispose();dashed.geometry=new THREE.BufferGeometry().setFromPoints(points);dashed.computeLineDistances();dashed.visible=s.phase==='playing'&&points.length>1;
  for(const p of s.platforms){const food=foods.get(p.id);if(food){food.visible=!s.collected.includes(p.id);food.position.y=1.4+Math.sin(s.time*2+p.id)*.1;food.rotation.y=s.time*.6;}const j=jellies.get(p.id);if(j){const pos=jellyPosition(p,s.time);j.position.set(pos.x,pos.y,.2);j.scale.y=1+Math.sin(s.time*4)*.06;}const g=platforms.get(p.id);g.visible=Math.abs(p.x-cx)<45;}
  bubbles.forEach((b,i)=>{b.m.position.set(cx*.65+b.x,(b.y+s.time*.18+i*.03+8)%22-8,b.z);});
  for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.v.y-=dt*4;e.m.position.addScaledVector(e.v,dt);e.m.scale.setScalar(Math.max(0,e.life/(e.total??1)));if(e.life<=0){e.m.removeFromParent();e.m.geometry.dispose();effects.splice(i,1);}}
  renderer.render(scene,camera);
 }
 function project(x,y){const v=V(x,y,.3).project(camera);return {x:(v.x*.5+.5)*width,y:(-.5*v.y+.5)*height};}
 return {update,burst,puff,project,renderer,camera,scene,resetRoute};
}
