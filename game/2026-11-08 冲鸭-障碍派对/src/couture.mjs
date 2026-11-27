import * as T from '../vendor/three.module.js';
const mats=new Map(),textures=new Map();let environment;
function env(){
 if(environment)return environment;
 const faces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,128,128);g.addColorStop(0,i%2?'#b0c5ee':'#536fa3');g.addColorStop(.5,'#314b77');g.addColorStop(1,'#7797bf');x.fillStyle=g;x.fillRect(0,0,128,128);x.fillStyle='#fff5db';x.fillRect(i%2?15:83,7,19,94);x.fillStyle='#c6ebff';x.fillRect(25,18,64,9);return c;});
 environment=new T.CubeTexture(faces);environment.colorSpace=T.SRGBColorSpace;environment.needsUpdate=true;return environment;
}
export function studioEnvironment(){return env();}
function tex(kind,color){
 const key=kind+color;if(textures.has(key))return textures.get(key);const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,256,210,0);
 if(kind==='phoenix'){g.addColorStop(0,'#b12a71');g.addColorStop(.3,'#ff7840');g.addColorStop(.7,'#ffca3b');g.addColorStop(1,'#fff2b9');}
 else if(kind==='pearl'){g.addColorStop(0,'#80b7f4');g.addColorStop(.4,'#b4efff');g.addColorStop(.75,'#fffbee');g.addColorStop(1,'#ffc9ec');}
 else{g.addColorStop(0,'#382498');g.addColorStop(.22,'#9254ff');g.addColorStop(.45,color);g.addColorStop(.7,'#36ddf2');g.addColorStop(.9,'#c4f5ff');g.addColorStop(1,'#fff0ba');}
 x.fillStyle=g;x.fillRect(0,0,256,256);
 x.strokeStyle=kind==='phoenix'?'#fff4b4':'#e3f6ff';x.lineWidth=2;x.globalAlpha=.6;
 if(kind==='galaxy'){for(let i=0;i<55;i++){const px=(i*67)%256,py=(i*97)%256,r=i%7===0?2:1;x.beginPath();x.arc(px,py,r,0,7);x.fillStyle='#fff8db';x.fill();}}
 else for(let i=0;i<10;i++){x.beginPath();x.moveTo(128,256);x.bezierCurveTo(128+i*2,200,8+i*24,120,6+i*26,0);x.stroke();}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.set(key,t);return t;
}
function mat(color,kind='metal',map=null){const key=color+kind+(map?.uuid??'');if(!mats.has(key))mats.set(key,new T.MeshPhysicalMaterial({color,map,envMap:env(),envMapIntensity:kind==='metal'?1.05:.85,metalness:kind==='metal'?.62:kind==='glass'?.14:.1,roughness:kind==='metal'?.25:.27,emissive:color,emissiveMap:map,emissiveIntensity:kind==='glass'?.12:kind==='silk'?.055:.02,clearcoat:1,clearcoatRoughness:.14,sheen:kind==='silk'?1:.2,sheenColor:new T.Color(color),iridescence:kind==='glass'?.85:.18,iridescenceIOR:1.35,side:T.DoubleSide}));return mats.get(key);}
function mesh(g,geo,color,x=0,y=0,z=0,kind='metal',map=null){
 if(map&&(geo.type==='ExtrudeGeometry'||geo.type==='PlaneGeometry')){geo.computeBoundingBox();const b=geo.boundingBox,a=geo.attributes.position,uv=geo.attributes.uv,flip=(b.min.x+b.max.x)/2<-.1;for(let i=0;i<a.count;i++){let u=(a.getX(i)-b.min.x)/Math.max(.001,b.max.x-b.min.x);uv.setXY(i,flip?1-u:u,(a.getY(i)-b.min.y)/Math.max(.001,b.max.y-b.min.y));}uv.needsUpdate=true;}
 const m=new T.Mesh(geo,mat(color,kind,map));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;}
function group(g,x=0,y=0,z=0){const a=new T.Group();a.position.set(x,y,z);g.add(a);return a;}
function sphere(g,x,y,z,r,c,kind='metal'){return mesh(g,new T.SphereGeometry(r,18,12),c,x,y,z,kind);}
function ring(g,x,y,z,r,tube,c){return mesh(g,new T.TorusGeometry(r,tube,8,48),c,x,y,z);}
function rod(g,points,r,c){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(g,new T.TubeGeometry(curve,20,r,6,false),c);}
function gem(g,x,y,z,r,c){const m=mesh(g,new T.IcosahedronGeometry(r,0),c,x,y,z,'glass');const edge=new T.LineSegments(new T.EdgesGeometry(m.geometry),new T.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.62}));m.add(edge);return m;}
function glowTexture(){if(textures.has('glow'))return textures.get('glow');const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#ffffffff');g.addColorStop(.18,'#ffffffaa');g.addColorStop(.5,'#ffffff35');g.addColorStop(1,'#ffffff00');x.fillStyle=g;x.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);textures.set('glow',t);return t;}
function glow(g,x,y,z,size,color,opacity=.55){const s=new T.Sprite(new T.SpriteMaterial({map:glowTexture(),color,transparent:true,opacity,blending:T.AdditiveBlending,depthWrite:false}));s.position.set(x,y,z);s.scale.setScalar(size);g.add(s);return s;}
function leaf(length,width){const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-width*.5,length*.2,-width*.65,length*.76,0,length);s.bezierCurveTo(width*.58,length*.8,width*.45,length*.2,0,0);return new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012,curveSegments:8});}
function lobe(side,lower=false){const s=new T.Shape(),k=side;s.moveTo(0,0);if(!lower){s.bezierCurveTo(k*.25,.7,k*1.28,1.35,k*1.5,.76);s.bezierCurveTo(k*1.65,.2,k*.55,-.28,0,0);}else{s.bezierCurveTo(k*.5,.2,k*1.2,-.22,k*.8,-.75);s.bezierCurveTo(k*.3,-1.05,k*.08,-.45,0,0);}return new T.ExtrudeGeometry(s,{depth:.04,bevelEnabled:true,bevelSegments:2,bevelSize:.015,bevelThickness:.015,curveSegments:14});}

export function buildCouture(head,back,look){
 const {color}=look,motion=[],wingJoints=[];const headHandled=['halo','crown','royal','antlers','orbit','fireworks','solar'].includes(look.head),backHandled=['bow','cape','angel','bat','butterfly','galaxy','rocket','phoenix'].includes(look.back);
 if(['crown','royal','solar'].includes(look.head)){
  const solar=look.head==='solar',royal=look.head==='royal'||solar;
  const base=mesh(head,new T.CylinderGeometry(.43,.38,.22,40),'#7d234a',0,.08,0,'silk');
  for(const y of[-.04,.2])ring(head,0,y,0,.43,.035,'#fbd077').rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=Math.cos(a),z=Math.sin(a),h=royal?.58:.36;
   rod(head,[[x*.41,.18,z*.41],[x*.48,h*.8,z*.48],[x*.28,h,z*.28]],.025,'#ffd275');gem(head,x*.43,.25,z*.43,.095,i%2?color:'#95edff');sphere(head,x*.28,h,z*.28,.043,'#fff4b6');
   if(royal)rod(head,[[x*.4,.18,z*.4],[x*.32,.64,z*.32],[0,.78,0]],.018,'#ffe59d');
  }
  if(royal){gem(head,0,.88,0,.15,color);glow(head,0,.86,0,.46,color,.45);}
  if(solar){const disk=group(head,0,.42,-.12);for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const f=mesh(disk,leaf(i%2?.36:.24,.12),'#ffd478',Math.cos(a)*.57,Math.sin(a)*.57,0);f.rotation.z=a-Math.PI/2;}ring(disk,0,0,0,.58,.025,'#ffdf80');motion.push({kind:'spin',g:disk,speed:.18});}
 }else if(look.head==='halo'){
  const h=group(head,0,.25,0);for(const [r,y]of[[.52,0],[.64,.05]])ring(h,0,y,0,r,.028,'#ffdf98').rotation.x=Math.PI/2;for(let i=0;i<10;i++){const a=i/10*6.283;gem(h,Math.cos(a)*.58,.03,Math.sin(a)*.58,.04,color);}glow(h,0,0,0,1.25,color,.3);motion.push({kind:'orbit',g:h});
 }else if(look.head==='antlers'){
  for(const side of[-1,1]){rod(head,[[side*.22,0,0],[side*.36,.35,0],[side*.43,.68,-.02],[side*.38,.9,0]],.035,'#bdefff');for(let i=0;i<3;i++){const y=.24+i*.19;rod(head,[[side*.33,y,0],[side*(.57+i*.03),y+.13,0],[side*(.63+i*.03),y+.28,0]],.025,'#d3f9ff');gem(head,side*(.63+i*.03),y+.28,0,.06,color);}glow(head,side*.4,.85,0,.3,color,.5);}
 }else if(look.head==='orbit'){
  const arm=group(head,0,.26,0);for(let i=0;i<3;i++){const r=ring(arm,0,0,0,.7+i*.06,.017,i%2?color:'#ffe5a5');r.rotation.set(.5+i*.6,0,i*.6);}
  const planet=sphere(arm,.68,.12,0,.19,color,'glass');planet.material=mat('#ffffff','glass',tex('galaxy',color));ring(arm,.68,.12,0,.3,.025,'#f9d98b').rotation.x=1;gem(arm,-.72,-.12,.02,.12,'#8ff7ff');glow(arm,.68,.12,.05,.5,color,.35);motion.push({kind:'spin',g:arm,speed:.6});
 }else if(look.head==='fireworks'){
  ring(head,0,.03,0,.39,.065,'#f4c56c').rotation.x=Math.PI/2;for(let i=0;i<7;i++){const a=i/7*6.283,tip=[Math.cos(a)*.52,.35+(i%3)*.17,Math.sin(a)*.4];rod(head,[[0,.03,0],tip],.014,'#edcf87');const star=gem(head,...tip,.085,i%2?color:'#ffdd81');glow(star,0,0,0,.35,color,.65);motion.push({kind:'twinkle',g:star,phase:i});}
 }
 if(look.back==='angel'||look.back==='phoenix'){
  const phoenix=look.back==='phoenix';
  for(const side of[-1,1]){const wing=group(back,side*.13,.08,0);wingJoints.push({g:wing,side});
   for(let i=0;i<11;i++){const length=(phoenix?1.75:1.5)-i*.045,w=.23+(i%3)*.02,feather=mesh(wing,leaf(length,w),'#ffffff',side*(.06+i*.065),.02+i*.018,-i*.012,'silk',tex(phoenix?'phoenix':'pearl',color));feather.rotation.z=-side*(1.04-i*.065);rod(feather,[[0,.08,.06],[0,length*.45,.07],[0,length*.9,.06]],.009,phoenix?'#ffe19b':'#e1c68c');}
   rod(wing,[[0,0,.02],[side*.58,.55,.05],[side*1.1,.85,.03]],.045,phoenix?'#e99c48':'#d2bd91');
   for(let i=0;i<5;i++){const q=glow(wing,side*(.3+i*.2),.3+i*.08,.1,.28,phoenix?'#ffc45e':'#c3f5ff',.6);motion.push({kind:'twinkle',g:q,phase:i+side});}
  }
  if(phoenix){for(let i=0;i<3;i++){const tail=mesh(back,new T.PlaneGeometry(.18,1.35,3,12),'#ffffff',(i-1)*.2,-.65,-.09,'silk',tex('phoenix',color));tail.rotation.z=(i-1)*.2;motion.push({kind:'cloth',g:tail});}const halo=ring(back,0,.48,-.22,1.05,.018,'#ffd38a');glow(back,0,.5,-.24,2.3,'#ffab64',.2);motion.push({kind:'pulse',g:halo});}
 }else if(look.back==='galaxy'||look.back==='butterfly'){
  const galaxy=look.back==='galaxy';for(const side of[-1,1]){const wing=group(back,side*.12,.12,0);wingJoints.push({g:wing,side});
   for(let i=0;i<(galaxy?3:2);i++){const lower=i>0,part=mesh(wing,lobe(side,lower),'#ffffff',0,i===2?-.28:0,-i*.07,'glass',tex(galaxy?'galaxy':'glass',color));if(i===2){part.scale.set(.8,.8,1);part.rotation.z=-side*.27;}rod(part,[[0,0,.08],[side*.5,lower?-.3:.4,.08],[side*(lower?.75:1.36),lower?-.55:.75,.07]],.013,'#ffe9b2');gem(wing,side*(lower?.52:.7),lower?-.32:.54,.13,.1,lower?color:'#bff8ff');}
   for(let i=0;i<5;i++)glow(wing,side*(.4+i*.2),.25+Math.sin(i)*.4,.15,.2,color,.65);
  }
  if(galaxy){for(const r of[1.1,1.28]){const halo=ring(back,0,.45,-.3,r,.012,'#cce5ff');motion.push({kind:'spin',g:halo,speed:r===1.1?.12:-.1});}for(let i=0;i<9;i++){const a=i/9*6.283;const star=gem(back,Math.cos(a)*1.22,.45+Math.sin(a)*1.22,-.24,.04,color);motion.push({kind:'twinkle',g:star,phase:i});}}
 }else if(look.back==='bat'){
  for(const side of[-1,1]){const w=group(back,side*.1,.1,0);wingJoints.push({g:w,side});const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(side*.3,.65,side*.85,1.08,side*1.4,.75);s.bezierCurveTo(side*1.1,.5,side*1.2,.13,side*1.14,-.07);s.bezierCurveTo(side*.75,.2,side*.65,-.05,side*.63,-.42);s.bezierCurveTo(side*.3,-.13,side*.12,-.26,0,0);mesh(w,new T.ExtrudeGeometry(s,{depth:.05,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:2,curveSegments:14}),'#ffffff',0,0,0,'glass',tex('glass',color));for(const tip of[[1.4,.75],[1.14,-.07],[.63,-.42]])rod(w,[[0,0,.09],[side*.45,.35,.1],[side*tip[0],tip[1],.08]],.025,'#f4b5e8');}
 }else if(look.back==='cape'){
  const cloth=mesh(back,new T.PlaneGeometry(1.4,1.45,10,14),'#ffffff',0,-.44,-.12,'silk',tex('galaxy',color));motion.push({kind:'cloth',g:cloth});for(const side of[-1,1])rod(back,[[side*.6,.22,-.1],[side*.66,-.5,-.1],[side*.68,-1.16,-.1]],.023,'#f2d69b');gem(back,0,.15,-.18,.13,color);
 }else if(look.back==='bow'){
  for(const side of[-1,1]){const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(side*.6,.6,side*.95,.22,side*.68,-.2);s.bezierCurveTo(side*.4,-.43,side*.14,-.22,0,0);const loop=mesh(back,new T.ExtrudeGeometry(s,{depth:.16,bevelEnabled:true,bevelSegments:3,bevelSize:.055,bevelThickness:.04,curveSegments:14}),color,0,0,0,'silk');loop.rotation.y=side*.22;rod(loop,[[0,0,.22],[side*.45,.27,.22],[side*.73,.08,.2]],.015,'#ffe3bd');const tail=mesh(back,leaf(.78,.23),color,side*.14,-.65,.01,'silk');tail.rotation.z=side*.2;}
  const knot=sphere(back,0,0,.1,.18,color,'silk');knot.scale.y=.8;
 }else if(look.back==='rocket'){
  for(const side of[-1,1]){const r=group(back,side*.34,.05,0);mesh(r,new T.CylinderGeometry(.19,.22,.72,24),'#e5e7f1',0,0,0);sphere(r,0,.37,0,.2,color);ring(r,0,-.2,0,.22,.045,'#ffd68c').rotation.x=Math.PI/2;gem(r,0,.06,-.21,.09,'#9befff');for(let i=0;i<3;i++){const fire=mesh(r,new T.ConeGeometry(.16-i*.035,.65-i*.12,12),i===2?'#fff7cc':i?'#ffd249':'#ff7b4e',0,-.65+i*.05,0);fire.rotation.z=Math.PI;motion.push({kind:'flame',g:fire,phase:i});}glow(r,0,-.5,0,.6,'#ffba65',.6);}
 }
 return {headHandled,backHandled,update(p,time,dt,presentation){
  for(const {g,side}of wingJoints){const folded=presentation?(p.showcaseFolded?.65:.05):p.grounded?.65:.08;g.rotation.y=side*(folded+Math.sin(time*3.5)*.1);g.rotation.z=Math.sin(time*3)*.018*side;}
  for(const m of motion){if(m.kind==='spin')m.g.rotation.y=time*m.speed;else if(m.kind==='orbit'){m.g.position.y=.26+Math.sin(time*2)*.06;m.g.rotation.y=time*.32;}else if(m.kind==='twinkle'){const k=.8+Math.sin(time*3+m.phase)*.2;m.g.scale.setScalar(k);}else if(m.kind==='flame')m.g.scale.y=1+Math.sin(time*16+m.phase)*.17;else if(m.kind==='pulse')m.g.scale.setScalar(1+Math.sin(time*2)*.025);else if(m.kind==='cloth'){const a=m.g.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,Math.sin(time*6+a.getY(i)*4)*.1*(.7-a.getY(i))-.05);a.needsUpdate=true;}}
 }};
}

export function buildRibbonTrail(scene,look){
 const root=group(scene),none=look.trail==='trail_none',positions=[],n=42,geo=new T.BufferGeometry(),verts=new Float32Array(n*2*3),colors=new Float32Array(n*2*3),indices=[];
 for(let i=0;i<n-1;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}geo.setAttribute('position',new T.BufferAttribute(verts,3));geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.setIndex(indices);
 const ribbon=new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));root.add(ribbon);
 const coreGeo=geo.clone(),coreVerts=new Float32Array(n*2*3);coreGeo.setAttribute('position',new T.BufferAttribute(coreVerts,3));const core=new T.Mesh(coreGeo,new T.MeshBasicMaterial({color:'#fff7e6',side:T.DoubleSide,transparent:true,opacity:.68,blending:T.AdditiveBlending,depthWrite:false}));root.add(core);
 const sparks=[];for(let i=0;i<18;i++)sparks.push(glow(root,0,0,0,.22,i%2?look.color:'#e4f8ff',.8));
 const bases=look.trail==='comet'?['#ff498a','#ff923c','#ffe15b','#fff3c8']:look.trail==='flame'?['#ff6139','#ffb32b','#fff09a']:look.trail==='rainbow'?['#ff48a2','#ffc63b','#4cffab','#24dcff','#a06bff']:['#b768ff',look.color,'#45dfff','#dceeff'];
 const palette=bases.map(c=>new T.Color(c)),pathPoint=(p,i,time)=>{const t=i/(n-1);if(p.trailSwatch)return {x:p.x+(t-.5)*2.8,y:p.y+.2+Math.sin(t*Math.PI)*.1,z:p.z+Math.sin(t*Math.PI*2)*.42};const a=t*Math.PI*1.8+time*.5;return {x:p.x+Math.cos(a)*1.05,y:p.y+.16+Math.sin(i*.5+time)*.04,z:p.z+Math.sin(a)*.8};};
 return {root,update(p,time,dt,presentation){
  root.visible=!none;if(none)return;const moving=Math.hypot(p.vx??0,p.vz??0)>.3;
  if(!presentation&&moving){positions.unshift({x:p.x,y:p.y+.13,z:p.z});if(positions.length>90)positions.pop();}
  for(let i=0;i<n;i++){
   const staged=presentation||!moving,q=staged?pathPoint(p,i,time):positions[Math.min(positions.length-1,i*2)]??{x:p.x,y:p.y+.13,z:p.z};
   const next=staged?pathPoint(p,Math.min(n-1,i+1),time):positions[Math.min(positions.length-1,i*2+2)]??q,dx=next.x-q.x,dz=next.z-q.z,len=Math.hypot(dx,dz)||1,width=(p.trailSwatch?.14:presentation?.11:.18)*(1-i/(n+2)),u=i/(n-1)*(palette.length-1),k=Math.min(palette.length-2,Math.floor(u)),c=palette[k].clone().lerp(palette[k+1],u-k);
   for(let side=0;side<2;side++){const sign=side?1:-1,idx=(i*2+side)*3,nx=(dz/len||Math.cos(i))*width*sign,nz=-(dx/len||Math.sin(i))*width*sign;verts[idx]=q.x+nx;verts[idx+1]=q.y;verts[idx+2]=q.z+nz;coreVerts[idx]=q.x+nx*.2;coreVerts[idx+1]=q.y+.008;coreVerts[idx+2]=q.z+nz*.2;colors[idx]=c.r;colors[idx+1]=c.g;colors[idx+2]=c.b;}
   if(i<sparks.length){const star=sparks[i],a=time*2+i;star.position.set(q.x+Math.sin(a)*.13,q.y+.06+Math.cos(a)*.1,q.z);star.scale.setScalar((look.trail==='stardust'||look.trail==='comet'?.32:.23)*(1-i/25));star.material.color.copy(palette[i%palette.length]);}
  }
  geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;coreGeo.attributes.position.needsUpdate=true;geo.computeBoundingSphere();coreGeo.computeBoundingSphere();
 },dispose(){geo.dispose();coreGeo.dispose();ribbon.material.dispose();core.material.dispose();for(const s of sparks)s.material.dispose();root.removeFromParent();}};
}
