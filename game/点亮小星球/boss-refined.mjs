import * as THREE from './vendor/three.module.js';

// Organic surfaces and articulated trim for the three chapter-three bosses.
// The accepted Aegis model remains in boss-art.mjs, unchanged.
export function createRefinedBossRig(spec){
 const root=new THREE.Group(),body=new THREE.Group();root.name='boss-'+spec.id;body.name='body';root.add(body);
 const geos=new Set(),mats=new Map();let disposed=false,animate;
 const own=g=>(geos.add(g),g);
 const sphere=own(new THREE.SphereGeometry(1,40,28)),torus=own(new THREE.TorusGeometry(1,.045,12,64));
 const scaleGeo=own(new THREE.SphereGeometry(1,32,20,0,Math.PI*2,0,Math.PI*.58));
 const c={ink:'#263f58',ivory:'#edf5ee',cream:'#f4e6c8',gold:'#dab36c',teal:'#65d6cc',violet:'#9189c5',skin:'#b67472',deep:'#744b5c'};
 function material(color,kind='shell',vertexColors=false){const k=color+kind+vertexColors;if(!mats.has(k))mats.set(k,new THREE.MeshPhysicalMaterial({color,roughness:kind==='metal'?.25:kind==='skin'?.40:kind==='glass'?.18:.30,metalness:kind==='metal'?.58:.12,clearcoat:.82,clearcoatRoughness:.17,emissive:color,emissiveIntensity:kind==='energy'?.30:0,iridescence:kind==='pearl'?.6:0,iridescenceIOR:1.3,iridescenceThicknessRange:[140,360],vertexColors,side:THREE.DoubleSide}));return mats.get(k);}
 function shape(g,geo,col,x,y,z,sx=1,sy=sx,sz=sx,kind='shell',vertex=false){const m=new THREE.Mesh(geo,material(col,kind,vertex));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=kind!=='energy';m.receiveShadow=true;g.add(m);return m;}
 const ball=(g,col,x,y,z,sx,sy,sz,kind)=>shape(g,sphere,col,x,y,z,sx,sy,sz,kind);
 const shell=(g,col,x,y,z,sx,sy,sz,kind='pearl')=>shape(g,scaleGeo,col,x,y,z,sx,sy,sz,kind);
 const ring=(g,col,x,y,z,r,kind='metal')=>shape(g,torus,col,x,y,z,r,r,r,kind);
 const joint=(g,name,x=0,y=0,z=0)=>{const n=new THREE.Group();n.name=name;n.position.set(x,y,z);g.add(n);return n;};
 const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>x*x*(3-2*x);
 const state=t=>({wind:clamp(t/.36),strike:clamp((t-.36)/.16),open:ease(clamp((t-.56)/.18)),phase:t<.36?'windup':t<.56?'attack':'exposed'});
 function tube(g,col,points,radius=.10,kind='shell',taper=1){
  const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),n=48,sides=16,frames=curve.computeFrenetFrames(n,false),verts=[],idx=[];
  for(let i=0;i<=n;i++){const u=i/n,p=curve.getPointAt(u),r=typeof radius==='function'?radius(u):radius*(taper?Math.pow(1-u,.8)*.98+.02:1);for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,v=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);verts.push(v.x,v.y,v.z);if(i<n&&j<sides){const q=i*(sides+1)+j;idx.push(q,q+sides+1,q+1,q+1,q+sides+1,q+sides+2);}}}
  const geo=own(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();return {mesh:shape(g,geo,col,0,0,0,1,1,1,kind),curve,frames};
 }
 function gem(g,col,x,y,z,r=.2,h=.5){const p=[new THREE.Vector2(0,-h*.5),new THREE.Vector2(r*.7,-h*.34),new THREE.Vector2(r,h*.03),new THREE.Vector2(r*.72,h*.30),new THREE.Vector2(0,h*.5)];const geo=own(new THREE.LatheGeometry(p,8));return shape(g,geo,col,x,y,z,1,1,1,'glass');}
 function eyes(g,width,y,z,size=.14){for(const side of [-1,1]){ball(g,c.ink,side*width,y,z,size*1.25,size*.76,size*.48,'glass');ball(g,'#b4efdd',side*width,y+.005,z+size*.37,size*.56,size*.60,size*.16,'energy');ball(g,'#1f344c',side*width,y,z+size*.50,size*.14,size*.50,size*.08);ball(g,'#ffffff',side*width-size*.20,y+size*.27,z+size*.52,size*.17,size*.15,size*.08,'energy');}}

 if(spec.id==='thornback'){
  // A continuous muscular body covered by overlapping, gently curved carapace.
  ball(body,c.skin,0,1.70,-.35,1.19,.96,1.63,'skin');ball(body,'#c99783',0,1.24,.10,1.04,.55,1.37,'skin');
  const head=joint(body,'horned-head',0,1.57,1.18);ball(head,'#aa6769',0,.12,.03,.87,.76,.86,'skin');ball(head,'#dbb999',0,-.20,.78,.72,.39,.62,'skin');ball(head,'#e9d7b8',0,-.39,.69,.64,.15,.46);
  shell(head,c.ivory,0,.68,.08,.90,.31,.79);shell(head,'#d9ccb0',0,.39,.70,.45,.15,.52);
  eyes(head,.54,.25,.79,.13);
  for(const side of [-1,1]){
   const brow=shell(head,c.deep,side*.57,.43,.65,.32,.12,.31,'skin');brow.rotation.z=-side*.18;
   const cheek=shell(head,'#e0c29b',side*.74,-.01,.26,.35,.28,.62);cheek.rotation.z=-side*.6;
   ball(head,'#574154',side*.30,-.14,1.30,.095,.065,.045);tube(head,'#76505c',[[side*.58,-.31,1.0],[side*.3,-.34,1.32],[0,-.34,1.37]],.018,'skin',0);
   const ear=joint(head,'ear-'+side,side*.84,.58,-.26);const e=ball(ear,c.skin,side*.09,0,0,.30,.14,.38,'skin');e.rotation.z=-side*.25;ball(ear,'#e0afab',side*.10,.055,.06,.21,.06,.25,'skin');
   tube(head,c.cream,[[side*.58,.52,.46],[side*.78,.88,.74],[side*.68,1.22,1.17],[side*.46,1.36,1.50]],.22,'pearl');
   const band=ring(head,c.gold,side*.59,.55,.49,.22);band.rotation.x=-.7;
  }
  tube(head,c.cream,[[0,.26,1.03],[0,.58,1.48],[0,1.06,1.86],[0,1.48,1.97]],.28,'pearl');
  tube(head,c.gold,[[0,1.17,1.92],[0,1.36,1.98],[0,1.49,1.97]],.08,'metal');
  const legs=[];for(const side of [-1,1])for(const z of [-1.12,.78]){const leg=joint(body,'hoof-'+side+'-'+z,side*.85,1.35,z);legs.push(leg);ball(leg,c.skin,0,-.15,0,.41,.57,.44,'skin');ball(leg,c.deep,0,-.70,.04,.31,.44,.34,'skin');shell(leg,c.ivory,0,-.20,.12,.48,.28,.48);ball(leg,c.ink,0,-1.02,.12,.39,.27,.47);for(let i=-1;i<=1;i++)ball(leg,c.cream,i*.22,-1.08,.49,.105,.14,.17);ring(leg,c.gold,0,-.69,.04,.31).rotation.x=Math.PI/2;}
  const crystals=[];for(let i=0;i<4;i++){
   const z=-1.45+i*.60,y=2.32+Math.sin(i/3*Math.PI)*.28;
   const plate=shell(body,i%2?'#e3d2b4':c.ivory,0,y,z,.92,.39,.49);plate.rotation.x=.15;
   const socket=ring(body,c.gold,0,y+.34,z,.24);socket.rotation.x=Math.PI/2;
   const m=gem(body,'#a1e7dd',0,y+.64,z,.25,.78);m.userData.baseY=y+.64;crystals.push(m);
   for(const side of [-1,1]){const scale=shell(body,'#d5bc98',side*.88,1.93,z,.43,.29,.45);scale.rotation.z=-side*.55;ball(body,c.teal,side*1.08,2.05,z,.045,.06,.045,'energy');}
  }
  const tail=joint(body,'tail',0,1.6,-1.70);tube(tail,c.skin,[[0,0,0],[.12,.05,-.55],[.37,.31,-.90]],.18,'skin');shell(tail,c.ivory,.28,.24,-.73,.24,.19,.34);
  animate=(time,t)=>{const a=state(t),run=a.phase==='attack';body.position.z=run?a.strike*1.3:a.phase==='exposed'?1.3*(1-a.open):-.14*a.wind;body.position.y=run?Math.abs(Math.sin(a.strike*20))*.06:a.phase==='exposed'?-.17*a.open:Math.sin(time*1.2)*.025;head.rotation.x=a.phase==='windup'?.25*a.wind:run?.30:-.06*a.open;legs.forEach((g,i)=>g.rotation.x=run?Math.sin(a.strike*20+(i===0||i===3?0:Math.PI))*.35:0);tail.rotation.y=Math.sin(time*1.6)*.13;crystals.forEach((m,i)=>{m.position.y=m.userData.baseY+a.open*.15;m.rotation.y=time*.1+i*.25;});};
 }else if(spec.id==='moonwing'){
  // Volumetric cambered wings with smooth rolled edges and colored membranes.
  function wingPoint(u,v,side){const front=1.1*(1-u)+.43*Math.sin(u*Math.PI)-.48*u*u,back=-1.40*(1-u)-.65*Math.sin(u*Math.PI)-.48*u*u;return new THREE.Vector3(side*(.33+3.45*u),.12+.28*Math.sin(u*Math.PI)-.24*u*u+.19*Math.sin(v*Math.PI)*(1-u*.7),front+(back-front)*v);}
  function wingGeometry(side){const n=28,m=22,verts=[],colors=[],idx=[],rootColor=new THREE.Color('#a49bd1'),tip=new THREE.Color('#82cdc9'),edge=new THREE.Color('#e3e9df');
   for(let layer=0;layer<2;layer++)for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){const u=i/n,v=j/m,p=wingPoint(u,v,side),thickness=.025+.07*(1-u)*Math.sin(v*Math.PI);p.y+=layer?-thickness:thickness;verts.push(p.x,p.y,p.z);const color=rootColor.clone().lerp(tip,u*.72).lerp(edge,Math.pow(Math.abs(v-.5)*2,7)*.75);colors.push(color.r,color.g,color.b);}
   const stride=m+1,layer=(n+1)*stride;for(let l=0;l<2;l++)for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=l*layer+i*stride+j,b=a+stride;if(l===0)idx.push(a,b,a+1,a+1,b,b+1);else idx.push(a,a+1,b,a+1,b+1,b);}
   for(let i=0;i<n;i++)for(const j of [0,m]){const a=i*stride+j,b=a+stride;idx.push(a,a+layer,b,b,a+layer,b+layer);}for(let j=0;j<m;j++)for(const i of [0,n]){const a=i*stride+j;idx.push(a,a+1,a+layer,a+1,a+layer+1,a+layer);}
   const geo=own(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;}
  body.position.y=1.35;ball(body,'#9b8ec3',0,.28,-.02,.68,.37,1.35,'pearl');ball(body,c.ivory,0,.11,.17,.52,.20,1.18,'pearl');
  const head=joint(body,'ray-head',0,.30,1.04);ball(head,'#b0a5d7',0,0,0,.57,.29,.58,'pearl');ball(head,c.ivory,0,-.13,.25,.43,.13,.38);eyes(head,.31,.055,.46,.12);
  for(const side of [-1,1]){tube(head,c.cream,[[side*.42,-.02,.14],[side*.65,.01,.55],[side*.62,.18,.92]],.09,'pearl');const brow=shell(head,c.gold,side*.31,.19,.28,.23,.055,.27,'metal');brow.rotation.z=-side*.12;}
  const wings=[];for(const side of [-1,1]){
   const wing=joint(body,'ray-wing-'+side,0,.26,-.09);wings.push(wing);const membrane=shape(wing,wingGeometry(side),'#ffffff',0,0,0,1,1,1,'pearl',true);membrane.name='cambered-membrane-'+side;
   for(const v of [.10,.34,.65,.89]){const pts=Array.from({length:9},(_,i)=>{const p=wingPoint(i/8*.91,v,side);p.y+=.105;return p.toArray();});tube(wing,v===.10?c.gold:'#b9f1df',pts,v===.10?.022:.015,v===.10?'metal':'energy',0);}
   for(let j=0;j<6;j++){const u=.2+j*.11,p=wingPoint(u,.42+(j%2)*.13,side);ball(wing,'#dcfff4',p.x,p.y+.11,p.z,.035,.025,.035,'energy');}
   const fin=shell(wing,'#d2c9e8',side*.78,.16,-.83,.65,.08,.62,'pearl');fin.rotation.y=side*.50;
  }
  const tail=joint(body,'ray-tail',0,.27,-1.03);tube(tail,'#b1a0d2',[[0,0,0],[.12,.01,-.84],[.48,.24,-1.75],[.35,.65,-2.75]],.145,'pearl');
  for(const side of [-1,1])tube(tail,side===1?c.gold:'#8ddcd3',[[side*.14,-.03,-.15],[side*.27,-.03,-.85],[side*.38,.24,-1.67],[side*.25,.53,-2.16]],.035,side===1?'metal':'energy');
  const tailGem=gem(tail,'#9fe8de',.35,.64,-2.74,.13,.42);tailGem.rotation.x=-.25;
  const core=ball(body,c.teal,0,.66,-.10,.26,.18,.36,'glass');const setting=ring(body,c.gold,0,.65,-.1,.39);setting.rotation.x=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(body,c.ivory,Math.cos(a)*.35,.67,-.10+Math.sin(a)*.35,.035,.035,.035);}
  const gills=[];for(const side of [-1,1])for(let i=0;i<3;i++){const g=joint(body,'ray-gill-'+side+'-'+i,side*.45,.14,-.35-i*.27);const scale=shell(g,c.ivory,0,0,0,.22,.09,.30);scale.rotation.y=side*.34;gills.push(g);}
  animate=(time,t)=>{const a=state(t);body.position.y=1.45+Math.sin(time*1.6)*.085-(a.phase==='exposed'?a.open*.88:0);body.rotation.x=a.phase==='windup'?-.12*a.wind:a.phase==='attack'?.12:0;wings.forEach((g,i)=>g.rotation.z=(i?1:-1)*(a.phase==='windup'?.56*a.wind:a.phase==='attack'?.56-a.strike*.92:Math.sin(time*1.7)*.10));tail.rotation.y=Math.sin(time*1.4)*.16;gills.forEach((g,i)=>g.rotation.z=(i<3?-1:1)*(a.open*.28+Math.sin(time*2+i)*.035));core.scale.set(.26*(1+a.open*.35),.18,.36*(1+a.open*.25));};
 }else if(spec.id==='starcrown'){
  // One continuous tapering body replaces the disconnected bead-like segments.
  const path=[[2.8,.49,-2.3],[1.65,.60,-2.85],[-.15,.78,-2.45],[-1.75,.91,-1.37],[-1.60,1.02,.12],[.03,1.10,.48],[1.22,1.20,-.42],[.72,1.60,-1.27],[-.45,2.40,-.55],[-.64,3.05,.72]];
  const radius=u=>.12+.52*Math.sin(u*Math.PI*.80),spine=tube(body,'#365666',path,radius,'skin',0),curve=spine.curve;spine.mesh.name='continuous-serpent-body';const skinColors=[],underside=new THREE.Color('#a4c8c1'),dorsal=new THREE.Color('#4a7182');for(let i=0;i<=48;i++){const center=curve.getPointAt(i/48),r=radius(i/48);for(let j=0;j<=16;j++){const y=spine.mesh.geometry.attributes.position.getY(i*17+j),t=clamp((y-center.y)/Math.max(.01,r)*.5+.5),col=underside.clone().lerp(dorsal,t);skinColors.push(col.r,col.g,col.b);}}spine.mesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(skinColors,3));spine.mesh.material=material('#ffffff','pearl',true);
  const scutes=[];for(let i=0;i<22;i++){
   const u=.06+i*.0415,p=curve.getPointAt(u),r=radius(u),g=joint(body,'serpent-segment-'+i,p.x,p.y,p.z);const tangent=curve.getTangentAt(u);g.rotation.y=Math.atan2(tangent.x,tangent.z);
   const dome=shell(g,i%3===0?'#dfd6b8':c.ivory,0,r*.50,0,r*.96,r*.52,.34);dome.rotation.x=.10;const rim=shell(g,c.gold,0,r*.47,-.05,r*.99,r*.14,.36,'metal');
   for(const side of [-1,1]){const scale=shell(g,'#86b5b6',side*r*.68,r*.11,.04,r*.41,r*.30,.25,'pearl');scale.rotation.z=-side*.65;}scutes.push(g);
  }
  const end=curve.getPointAt(1),head=joint(body,'serpent-head',end.x,end.y+.08,end.z+.37);
  ball(head,c.ivory,0,.04,.08,.64,.48,.84,'pearl');ball(head,'#c9d9cf',0,-.15,.65,.48,.24,.56);ball(head,c.ink,0,-.28,.65,.46,.07,.45);
  shell(head,c.gold,0,.41,.18,.44,.11,.60,'metal');eyes(head,.39,.18,.68,.14);
  for(const side of [-1,1]){
   const cheek=shell(head,c.ivory,side*.54,.01,-.03,.28,.28,.69);cheek.rotation.z=-side*.3;
   const brow=shell(head,c.gold,side*.39,.36,.50,.28,.08,.31,'metal');brow.rotation.z=-side*.15;
   tube(head,c.cream,[[side*.47,.30,-.25],[side*.74,.68,-.70],[side*.58,1.05,-1.0],[side*.30,1.11,-.80]],.14,'pearl');
   tube(head,c.gold,[[side*.37,-.15,.80],[side*.86,-.15,1.07],[side*1.17,.11,1.17],[side*1.07,.38,.92]],.045,'metal');
   const frill=shell(head,'#bddbd2',side*.63,.17,-.54,.43,.10,.73,'pearl');frill.rotation.z=-side*.62;frill.rotation.y=side*.2;
  }
  const crown=joint(head,'serpent-crown',0,.79,.02);const crownRing=ring(crown,c.gold,0,.12,0,.55);crownRing.rotation.x=Math.PI/2;const crownGem=gem(crown,'#91ded3',0,.38,.02,.18,.55);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const p=[Math.cos(a)*.53,.19,Math.sin(a)*.53];tube(crown,c.gold,[p,[p[0]*1.06,.45,p[2]*1.06],[p[0]*.9,.62,p[2]*.9]],.04,'metal');ball(crown,c.teal,p[0]*.9,.61,p[2]*.9,.055,.065,.055,'glass');}
  const armor=[];for(const u of [.34,.67]){const p=curve.getPointAt(u),g=joint(body,'breakable-star-ring',p.x,p.y,p.z);g.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),curve.getTangentAt(u));const r=radius(u)+.15;ring(g,c.gold,0,0,0,r);ring(g,c.teal,0,0,.025,r-.055,'energy');for(let j=0;j<4;j++){const a=j*Math.PI/2;shell(g,c.ivory,Math.cos(a)*r,Math.sin(a)*r,0,.13,.16,.11);}g.userData.rest=g.position.clone();armor.push(g);}
  const p=curve.getPointAt(.57),star=joint(body,'exposed-starcore',p.x,p.y+radius(.57)*.9,p.z);gem(star,c.teal,0,.18,0,.30,.70);const inner=ring(star,c.gold,0,.23,0,.40);inner.rotation.x=Math.PI/2;for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(star,'#e8fff3',Math.cos(a)*.36,.23,Math.sin(a)*.36,.055,.065,.055,'energy');}
  const tail=joint(body,'serpent-tail',path[0][0],path[0][1],path[0][2]);for(const side of [-1,1]){const fin=shell(tail,'#96c6c4',side*.16,.10,-.22,.28,.06,.64,'pearl');fin.rotation.y=side*.3;}
  animate=(time,t)=>{const a=state(t);body.rotation.y=a.phase==='windup'?-.17*a.wind:a.phase==='attack'?-.17+a.strike*.48:Math.sin(time*.65)*.025;body.position.y=Math.sin(time*1.3)*.025;head.rotation.y=Math.sin(time*1.1)*.08;head.rotation.x=a.phase==='windup'?-.12*a.wind:0;tail.rotation.y=Math.sin(time*1.4)*.18;crown.rotation.y=Math.sin(time*.7)*.09;armor.forEach((g,i)=>{g.position.copy(g.userData.rest);g.position.x+=(i?1:-1)*a.open*.85;g.scale.setScalar(1-a.open*.65);});star.visible=a.open>.12;star.scale.setScalar(.8+a.open*.5);star.rotation.y=time*.25;};
 }else throw Error('Unknown refined boss');
 let phase='idle';function update(time=0,t=null){if(disposed)return;time=Number.isFinite(time)?time:0;const p=Number.isFinite(t)?clamp(t):0;animate(time,p);phase=t===null?'idle':state(p).phase;root.userData.phase=phase;}
 update(0,null);return {root,spec,update,get phase(){return phase;},dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const g of geos)g.dispose();for(const m of mats.values())m.dispose();}};
}
