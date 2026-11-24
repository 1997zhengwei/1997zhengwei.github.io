import * as T from './vendor/three.module.js';
import {goods,moodOf} from './rules.mjs';

const materials = new Map();
function surface(color, metalness = 0, roughness = .67) {
  const key = `${color}/${metalness}/${roughness}`;
  if (!materials.has(key)) materials.set(key,new T.MeshStandardMaterial({color,metalness,roughness}));
  return materials.get(key);
}
function add(group, geometry, material, x=0, y=0, z=0) {
  const mesh = new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
const cube = new T.BoxGeometry(1,1,1);
const ball = new T.SphereGeometry(1,24,16);
const cylinder = new T.CylinderGeometry(1,1,1,32);
function box(g,w,h,d,c,x=0,y=0,z=0) { const m=add(g,cube,surface(c),x,y,z);m.scale.set(w,h,d);return m; }
function oval(g,w,h,d,c,x=0,y=0,z=0) { const m=add(g,ball,surface(c),x,y,z);m.scale.set(w,h,d);return m; }
function round(g,r,h,c,x=0,y=0,z=0) { const m=add(g,cylinder,surface(c,.08,.44),x,y,z);m.scale.set(r,h,r);return m; }
const bevels=new Map();
function shell(g,w,h,d,r,material,x=0,y=0,z=0) {
  const key=[w,h,d,r].join('/');
  if(!bevels.has(key)) {
    const profile=new T.Shape();
    const a=w/2-r,b=h/2-r;
    profile.moveTo(-a,-b);profile.lineTo(a,-b);profile.lineTo(a,b);profile.lineTo(-a,b);profile.closePath();
    const geometry=new T.ExtrudeGeometry(profile,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:3,steps:1});
    geometry.translate(0,0,-d/2+r);
    bevels.set(key,geometry);
  }
  return add(g,bevels.get(key),material,x,y,z);
}
function studioMap() {
  const source=document.createElement('canvas');source.width=320;source.height=160;
  const ctx=source.getContext('2d');const light=ctx.createLinearGradient(0,0,0,160);
  light.addColorStop(0,'#b1d5ea');light.addColorStop(.55,'#7596a9');light.addColorStop(1,'#324e67');
  ctx.fillStyle=light;ctx.fillRect(0,0,320,160);
  ctx.fillStyle='#fffdf0';ctx.fillRect(14,28,114,14);ctx.fillRect(200,36,60,26);
  const map=new T.CanvasTexture(source);map.colorSpace=T.SRGBColorSpace;map.mapping=T.EquirectangularReflectionMapping;return map;
}

function label(group,{text,w,h,x=0,y=0,z=0,bg='#fffdf0',ink='#102b42',font=72,barcode=false,art}) {
  const canvas = document.createElement('canvas');
  canvas.width=512; canvas.height=256;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=bg;
  ctx.fillRect(0,0,512,256);
  if (barcode) {
    ctx.fillStyle=ink;
    let left=43;
    for (const width of [5,14,4,11,7,18,5,16,12,8,15,8,5,17,6,14,8,14,3,13,18,6,11,7,6,5,9]) {
      ctx.fillRect(left,27,width*.93,146);
      left+=width*.93+5;
    }
    ctx.font='bold 31px monospace';ctxt(ctx,'4  552201  1190',219);
  } else if(art) {
    const wash=ctx.createLinearGradient(0,0,512,240);wash.addColorStop(0,bg);wash.addColorStop(1,ink);
    ctx.fillStyle=wash;ctx.fillRect(0,0,512,256);
    ctx.fillStyle='#ffffff26';
    for(let i=0;i<8;i++) {ctx.beginPath();ctx.arc(7+i*83,225-i%2*26,23+i%3*8,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#fff7de';ctx.beginPath();ctx.roundRect(25,30,462,181,31);ctx.fill();
    ctx.fillStyle=ink;ctx.font=`900 ${font}px 'Arial Black',Arial`;ctxt(ctx,text,143);
    ctx.font='bold 25px Arial';ctxt(ctx,art,182);
    ctx.fillStyle='#ffe2a1';ctx.fillRect(40,224,432,13);
  } else {
    ctx.strokeStyle=ink;ctx.lineWidth=8;ctx.strokeRect(18,18,476,220);
    ctx.fillStyle=ink;ctx.font=`900 ${font}px sans-serif`;ctxt(ctx,text,152);
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  map.anisotropy=4;
  const mat=new T.MeshBasicMaterial({map});
  const target=add(group,new T.PlaneGeometry(w,h),mat,x,y,z);
  target.castShadow=false;
  target.receiveShadow=false;
  return target;
}
function ctxt(ctx,text,y) { ctx.textAlign='center';ctx.fillText(text,256,y,447); }

// ——————— 顾客：Q 版购物人（大头、画出来的脸、平滑发型、各自的穿搭） ———————
const designs = [
  {skin:'#f6c9a8', hair:'#2a2236', hairStyle:'bob',     top:'hoodie',   topColor:'#3aa7e0', accent:'#ffd84d', pants:'#33465e', shoes:'#ffffff', eyes:'doe',   iris:'#4a2e22', bag:'tote',  bagColor:'#ff6b6b'},
  {skin:'#a8684a', hair:'#1f1a26', hairStyle:'afro',    top:'puffer',   topColor:'#f2a33a', accent:'#2a9d8f', pants:'#2f3b52', shoes:'#f25c54', eyes:'round', iris:'#2b1a14', glasses:'#3b2a33'},
  {skin:'#ffdcc0', hair:'#b8552f', hairStyle:'beanie',  top:'sweater',  topColor:'#4bb98c', accent:'#ff6b6b', pants:'#3d4a6b', shoes:'#6b4a3a', eyes:'round', iris:'#3a6b4a', hat:'#ff6b6b', scarf:'#ffd84d', freckles:true},
  {skin:'#d9a27a', hair:'#2b2030', hairStyle:'bun',     top:'cardigan', topColor:'#a77bd1', accent:'#fff1c9', pants:'#4a3b5e', shoes:'#2b2030', eyes:'doe',   iris:'#3b2418', earrings:'#ffd84d', bag:'shoulder', bagColor:'#ffd84d'},
  {skin:'#f8cfb2', hair:'#3b2420', hairStyle:'long',    top:'dress',    topColor:'#f487a8', accent:'#ffffff', pants:'#f8cfb2', shoes:'#e8546f', eyes:'doe',   iris:'#5a3424', earrings:'#ffffff', bag:'tote', bagColor:'#3aa7e0', mole:true},
  {skin:'#c98d66', hair:'#1d1b27', hairStyle:'short',   top:'tee',      topColor:'#ef5a4c', accent:'#ffffff', pants:'#2d3e5c', shoes:'#ffffff', eyes:'round', iris:'#2a1a12', glasses:'#20242c', cap:'#2a4d8f'},
  {skin:'#ffe0c8', hair:'#7a4a2c', hairStyle:'pony',    top:'hoodie',   topColor:'#ffc93d', accent:'#ef5a4c', pants:'#4a5a7a', shoes:'#3aa7e0', eyes:'doe',   iris:'#6b4a2a', bag:'basket'},
  {skin:'#8f5a3f', hair:'#17151f', hairStyle:'afro',    top:'puffer',   topColor:'#2fb3a6', accent:'#ffd84d', pants:'#2b2b3a', shoes:'#ffd84d', eyes:'round', iris:'#1e120c', phones:'#ff6b6b'},
];
const HEAD_Y=1.95, HEAD_R=.38, HEAD_S=[1,.95,.93], HEAD_K=1.24, BODY_K=.88;
const FACE={phi0:Math.PI/2-1.0, phiL:2.0, th0:Math.PI/2-.75, thL:1.5};
const skinMat=new Map();
function soft(color,rough=.62){return surface(new T.Color(color).getHex(),0,rough);}
function hairMaterial(color){
  const key='hair'+color;
  if(!materials.has(key))materials.set(key,new T.MeshPhysicalMaterial({color,roughness:.42,clearcoat:.35,clearcoatRoughness:.35,sheen:.6,sheenColor:new T.Color('#ffffff'),sheenRoughness:.5,side:T.DoubleSide}));
  return materials.get(key);
}
// 头部局部坐标里某个 (u,v) 脸部贴图位置对应的 3D 点
function facePoint(u,v,lift=0){
  const phi=FACE.phi0+u*FACE.phiL, th=FACE.th0+(1-v)*FACE.thL, r=HEAD_R+lift;
  return new T.Vector3(-r*Math.cos(phi)*Math.sin(th)*HEAD_S[0],r*Math.cos(th)*HEAD_S[1],r*Math.sin(phi)*Math.sin(th)*HEAD_S[2]);
}
// 贴着头皮的一片发片：phi 范围 × 从 th0 到 edge(phi)，可外扩 flare，边缘可做成一绺一绺
function hairBand(R,phi0,phi1,th0,edge,{flare=0,segs=48,rows=8}={}){
  const pos=[],idx=[];
  for(let i=0;i<=segs;i++){
    const phi=phi0+(phi1-phi0)*i/segs,te=edge(phi);
    for(let j=0;j<=rows;j++){
      const t=j/rows,th=th0+(te-th0)*t,r=R*(1+flare*t*t);
      pos.push(-r*Math.cos(phi)*Math.sin(th)*HEAD_S[0],r*Math.cos(th)*HEAD_S[1],r*Math.sin(phi)*Math.sin(th)*HEAD_S[2]);
    }
  }
  for(let i=0;i<segs;i++)for(let j=0;j<rows;j++){const a=i*(rows+1)+j,b=a+rows+1;idx.push(a,a+1,b,b,a+1,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  return g;
}
const lock=(k,depth,sharp=.45)=>phi=>Math.pow(.5+.5*Math.cos(phi*k),sharp)*depth;
const geoCache=new Map();
const cached=(key,make)=>{if(!geoCache.has(key))geoCache.set(key,make());return geoCache.get(key);};

// 脸：画在头部正面一片球面贴片上，三种心情三张图
const faceTextures=new Map();
function faceTexture(d,index,mood){
  const key=`${index}/${mood}`;if(faceTextures.has(key))return faceTextures.get(key);
  const W=512,H=384,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const U=u=>u*W,V=v=>(1-v)*H;
  const eyeY=V(.49),eyeDX=.155,eyeW=44,eyeH=mood===1?40:56;
  // 腮红
  for(const s of [-1,1]){
    const g=x.createRadialGradient(U(.5+s*.2),V(.36),2,U(.5+s*.2),V(.36),mood===1?46:38);
    g.addColorStop(0,mood===1?'rgba(240,70,70,.55)':'rgba(255,120,130,.42)');g.addColorStop(1,'rgba(255,120,130,0)');
    x.fillStyle=g;x.beginPath();x.ellipse(U(.5+s*.2),V(.36),50,30,0,0,Math.PI*2);x.fill();
  }
  if(d.freckles){x.fillStyle='rgba(150,80,50,.45)';for(const s of [-1,1])for(let k=0;k<4;k++){x.beginPath();x.arc(U(.5+s*(.17+k%2*.04)),V(.39-Math.floor(k/2)*.035)+k*2,2.6,0,Math.PI*2);x.fill();}}
  if(d.mole){x.fillStyle='#5a3424';x.beginPath();x.arc(U(.63),V(.27),3,0,Math.PI*2);x.fill();}
  // 眼睛
  for(const s of [-1,1]){
    const cx=U(.5+s*eyeDX),cy=eyeY;
    x.save();x.beginPath();x.ellipse(cx,cy,eyeW,eyeH,0,0,Math.PI*2);x.clip();
    const ig=x.createLinearGradient(0,cy-eyeH,0,cy+eyeH);ig.addColorStop(0,'#1a1014');ig.addColorStop(.55,d.iris);ig.addColorStop(1,'#c99a6a');
    x.fillStyle=ig;x.fillRect(cx-eyeW,cy-eyeH,eyeW*2,eyeH*2);
    x.fillStyle='#120a0c';x.beginPath();x.ellipse(cx,cy+2,eyeW*.45,eyeH*.5,0,0,Math.PI*2);x.fill();
    if(mood===1){x.fillStyle=d.skin;x.beginPath();x.moveTo(cx-eyeW-4,cy-eyeH-4);x.lineTo(cx+eyeW+4,cy-eyeH-4);x.lineTo(cx+eyeW+4,cy-eyeH*.1+(s>0?-8:8));x.lineTo(cx-eyeW-4,cy-eyeH*.1+(s>0?8:-8));x.fill();}
    x.restore();
    // 高光
    x.fillStyle='#ffffff';x.beginPath();x.ellipse(cx+s*-8+6,cy-eyeH*.38,10,12,0,0,Math.PI*2);x.fill();
    x.beginPath();x.arc(cx-10,cy+eyeH*.35,5,0,Math.PI*2);x.fill();
    // 上眼线与睫毛
    x.strokeStyle='#1a1014';x.lineCap='round';x.lineWidth=7;
    x.beginPath();
    if(mood===1){x.moveTo(cx-eyeW-2,cy-eyeH*.1+(s>0?10:-10));x.lineTo(cx+eyeW+2,cy-eyeH*.1+(s>0?-10:10));}
    else x.ellipse(cx,cy,eyeW+1,eyeH+1,0,Math.PI*1.08,Math.PI*1.92);
    x.stroke();
    if(d.eyes==='doe'&&mood!==1){x.lineWidth=5;const ox=cx+s*(eyeW-2);x.beginPath();x.moveTo(ox,cy-eyeH*.55);x.lineTo(ox+s*14,cy-eyeH*.85);x.moveTo(ox-s*6,cy-eyeH*.78);x.lineTo(ox+s*4,cy-eyeH*1.12);x.stroke();}
    // 眉毛
    x.strokeStyle=d.hair;x.lineWidth=9;x.beginPath();
    const by=cy-(mood===1?56:eyeH)-24;
    if(mood===1){x.moveTo(cx-s*30,by-8);x.lineTo(cx+s*-30+s*60,by+14);}
    else if(mood===2){x.moveTo(cx-28,by+2);x.lineTo(cx+28,by+2);}
    else {x.moveTo(cx-28,by+6);x.quadraticCurveTo(cx,by-10,cx+28,by+4);}
    x.stroke();
  }
  // 鼻子
  x.strokeStyle='rgba(120,60,40,.45)';x.lineWidth=5;x.beginPath();x.arc(U(.5),V(.4),8,.15*Math.PI,.85*Math.PI);x.stroke();
  // 嘴
  const mx=U(.5),my=V(.27);
  if(mood===3){
    x.fillStyle='#7a2638';x.beginPath();x.moveTo(mx-26,my-6);x.quadraticCurveTo(mx,my+36,mx+26,my-6);x.closePath();x.fill();
    x.fillStyle='#ff8a96';x.beginPath();x.ellipse(mx,my+12,13,8,0,0,Math.PI*2);x.fill();
    x.fillStyle='#ffffff';x.fillRect(mx-18,my-6,36,6);
  } else if(mood===2){
    x.strokeStyle='#7a2638';x.lineWidth=7;x.beginPath();x.moveTo(mx-16,my+4);x.quadraticCurveTo(mx,my+10,mx+16,my+4);x.stroke();
  } else {
    x.strokeStyle='#7a2638';x.lineWidth=7;x.beginPath();x.moveTo(mx-22,my+14);x.quadraticCurveTo(mx-10,my,mx,my+8);x.quadraticCurveTo(mx+10,my,mx+22,my+14);x.stroke();
  }
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
  faceTextures.set(key,tex);return tex;
}
function printTexture(text,bg,ink,round=false){
  const key=`print/${text}/${bg}/${ink}`;if(faceTextures.has(key))return faceTextures.get(key);
  const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');
  if(round){x.fillStyle=bg;x.beginPath();x.arc(128,128,120,0,Math.PI*2);x.fill();}else{x.fillStyle=bg;x.fillRect(0,0,256,256);}
  x.fillStyle=ink;x.textAlign='center';x.textBaseline='middle';x.font=`900 ${text.length>3?70:96}px 'Arial Black',Arial`;x.fillText(text,128,134);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;faceTextures.set(key,t);return t;
}

function customer(index) {
  const d=designs[index%designs.length],root=new T.Group(),g=new T.Group();g.scale.set(1,BODY_K,1);root.add(g);
  const skin=soft(d.skin,.58),cloth=soft(d.topColor,.7),accent=soft(d.accent,.6);
  const caps=(r,l)=>cached(`cap${r}/${l}`,()=>new T.CapsuleGeometry(r,l,6,14));
  // 腿和鞋
  for(const s of [-1,1]){
    const leg=add(g,caps(.1,.36),soft(d.pants,.75),s*.14,.36,0);
    const shoe=oval(g,.13,.085,.19,new T.Color(d.shoes).getHex(),s*.15,.07,.05);shoe.material=soft(d.shoes,.5);
  }
  // 身体（车削出平滑的上衣/裙子）
  const dress=d.top==='dress';
  const prof=dress
    ? [[0,.42],[.5,.42],[.46,.56],[.39,.82],[.34,1.05],[.36,1.25],[.37,1.42],[.3,1.56],[.17,1.64],[0,1.66]]
    : [[0,.6],[.31,.6],[.37,.7],[.4,.88],[.41,1.08],[.4,1.27],[.37,1.44],[.3,1.57],[.17,1.64],[0,1.66]];
  const torsoGeo=cached('torso'+dress,()=>new T.LatheGeometry(prof.map(([r,y])=>new T.Vector2(r,y)),40));
  const torso=add(g,torsoGeo,cloth);torso.scale.set(1,1,.82);
  if(!dress){const belt=add(g,cached('belt',()=>new T.TorusGeometry(.33,.035,8,40)),soft(d.pants,.7),0,.64,0);belt.rotation.x=Math.PI/2;belt.scale.set(1,.82,1);}
  if(d.top==='puffer'){
    for(const [y,r] of [[.8,.39],[1.0,.4],[1.2,.395],[1.38,.36]]){const ring=add(g,cached(`puff${r}`,()=>new T.TorusGeometry(r,.032,10,44)),cloth,0,y,0);ring.rotation.x=Math.PI/2;ring.scale.set(1,.82,1);}
    box(g,.025,.9,.02,0xffffff,0,1.08,.345).material=soft('#e8e8e8',.4);
  } else if(d.top==='hoodie'){
    const hood=add(g,cached('hood',()=>new T.TorusGeometry(.2,.085,10,24,Math.PI*1.3)),cloth,0,1.6,-.08);hood.rotation.set(-Math.PI/2-.35,0,-Math.PI*.15-Math.PI/2);
    for(const s of [-1,1])add(g,caps(.012,.16),accent,s*.07,1.42,.33);
    shell(g,.42,.2,.05,.04,cloth,0,.92,.33).scale.set(1,1,1);
  } else if(d.top==='cardigan'){
    box(g,.1,.84,.02,0xffffff,0,1.08,.336).material=accent;
    for(let i=0;i<4;i++)oval(g,.025,.025,.012,0xffffff,.1,1.4-i*.16,.338).material=soft('#f6e7c1',.3);
  } else if(d.top==='sweater'){
    const band=add(g,cached('band',()=>new T.TorusGeometry(.41,.05,8,44)),accent,0,1.1,0);band.rotation.x=Math.PI/2;band.scale.set(1,.82,1);
  } else if(d.top==='tee'||d.top==='dress'){
    const p=add(g,cached('printPlane',()=>new T.PlaneGeometry(.3,.3)),new T.MeshBasicMaterial({map:printTexture(d.top==='tee'?'SALE':'♥',d.top==='tee'?'#ffffff':d.topColor,d.top==='tee'?d.topColor:'#ffffff',true),transparent:true}),0,1.18,.342);
    p.castShadow=false;
  }
  if(d.scarf){
    const sc=add(g,cached('scarf',()=>new T.TorusGeometry(.2,.075,10,30)),soft(d.scarf,.8),0,1.62,0);sc.rotation.x=Math.PI/2;
    add(g,caps(.06,.22),soft(d.scarf,.8),.12,1.42,.2).rotation.z=.2;
  }
  if(d.phones){const hp=add(g,cached('phones',()=>new T.TorusGeometry(.2,.03,8,30,Math.PI)),soft(d.phones,.4),0,1.62,.02);hp.rotation.x=Math.PI/2+.4;for(const s of [-1,1])oval(g,.07,.08,.05,0,s*.2,1.62,.04).material=soft(d.phones,.4);}
  // 手臂
  const arms=[];
  for(const s of [-1,1]){
    const arm=new T.Group();arm.position.set(s*.37,1.48,.02);arm.rotation.z=s*.22;g.add(arm);
    add(arm,caps(.085,.42),cloth,0,-.28,0);
    oval(arm,.085,.09,.085,0,0,-.58,.02).material=skin;
    arms.push(arm);
  }
  // 手里的东西
  if(d.bag==='tote'){
    const bag=new T.Group();bag.position.set(.47,.72,.12);g.add(bag);
    shell(bag,.34,.36,.12,.03,soft(d.bagColor,.75));
    const h=add(bag,cached('handle',()=>new T.TorusGeometry(.1,.015,6,16,Math.PI)),soft(d.bagColor,.6),0,.18,0);
    const p=add(bag,cached('bagPrint',()=>new T.PlaneGeometry(.24,.24)),new T.MeshBasicMaterial({map:printTexture('BF','#ffffff',d.bagColor,true),transparent:true}),0,0,.062);p.castShadow=false;
    arms[1].rotation.z=.08;
  } else if(d.bag==='shoulder'){
    const strap=add(g,cached('strap',()=>new T.TorusGeometry(.42,.018,6,40,Math.PI*.9)),soft('#6b4a3a',.5),.02,1.18,.05);strap.rotation.set(0,0,-.95);strap.scale.set(1,1.1,1);
    const sb=shell(g,.3,.26,.1,.04,soft(d.bagColor,.5),-.43,.74,.14);sb.rotation.z=.12;oval(g,.03,.03,.02,0,-.43,.78,.2).material=soft('#c98a2a',.3);
  } else if(d.bag==='basket'){
    const b=new T.Group();b.position.set(-.5,.78,.18);g.add(b);
    shell(b,.4,.22,.28,.04,soft('#ff6b6b',.55));
    for(let i=0;i<4;i++)box(b,.03,.16,.01,0xffffff,-.14+i*.093,.0,.142).material=soft('#ffe3e3',.5);
    oval(b,.08,.1,.08,0,-.06,.15,0).material=soft('#ffd84d',.5);
    box(b,.12,.14,.1,0,.09,.16,0).material=soft('#3aa7e0',.6);
    arms[0].rotation.z=-.1;
  }
  // 脖子与头
  add(root,cached('neck',()=>new T.CylinderGeometry(.09,.1,.16,16)),skin,0,1.5,0);
  const head=new T.Group();head.position.set(0,HEAD_Y,0);head.scale.setScalar(HEAD_K);root.add(head);
  const skull=add(head,cached('skull',()=>new T.SphereGeometry(HEAD_R,48,32)),skin);skull.scale.set(...HEAD_S);
  for(const s of [-1,1])oval(head,.06,.085,.05,0,s*.36,-.02,0).material=skin;
  const faceMat=new T.MeshStandardMaterial({map:faceTexture(d,index,3),transparent:true,roughness:.55,polygonOffset:true,polygonOffsetFactor:-2});
  const face=add(head,cached('face',()=>new T.SphereGeometry(HEAD_R*1.004,40,30,FACE.phi0,FACE.phiL,FACE.th0,FACE.thL)),faceMat);
  face.scale.set(...HEAD_S);face.castShadow=false;
  // 头发
  const hm=hairMaterial(d.hair),R=HEAD_R*1.05,FR=Math.PI/2;
  const capTop=a=>add(head,cached('hcap'+a,()=>hairBand(R,0,Math.PI*2,0,()=>a,{rows:10,segs:56})),hm);
  const fringe=(k,depth,th=1.2)=>add(head,cached(`fr${k}/${depth}/${th}`,()=>hairBand(R*1.012,FR-1.05,FR+1.05,.5,phi=>th+lock(k,depth)(phi-FR),{rows:7})),hm);
  const back=(edge,flare)=>add(head,cached(`bk${edge}/${flare}`,()=>hairBand(R*1.006,FR+.95,FR+2*Math.PI-.95,.4,()=>edge,{flare,rows:10})),hm);
  if(d.hairStyle==='bob'){capTop(1.15);fringe(9,.2);back(2.15,.18);}
  else if(d.hairStyle==='long'){capTop(1.1);fringe(7,.16,1.15);back(2.45,.28);
    const curtain=shell(g,.66,.7,.12,.06,hm,0,1.66,-.27);curtain.rotation.x=.12;}
  else if(d.hairStyle==='bun'){capTop(1.2);fringe(11,.12,1.12);back(1.95,.05);oval(head,.17,.16,.16,0,0,.43,-.1).material=hm;add(head,cached('tie',()=>new T.TorusGeometry(.11,.025,6,20)),soft(d.accent,.5),0,.33,-.07).rotation.x=Math.PI/2+.4;}
  else if(d.hairStyle==='pony'){capTop(1.18);fringe(8,.18,1.1);back(1.9,.04);
    const tail=add(head,caps(.11,.36),hm,0,-.08,-.43);tail.rotation.x=.45;add(head,cached('tie',()=>new T.TorusGeometry(.11,.025,6,20)),soft(d.accent,.5),0,.14,-.36).rotation.x=1.1;}
  else if(d.hairStyle==='short'){capTop(1.25);fringe(14,.08,1.08);back(1.75,.02);}
  else if(d.hairStyle==='afro'){capTop(1.25);back(1.8,.06);
    const puffs=cached('puff',()=>new T.SphereGeometry(.13,16,12));
    for(let i=0;i<22;i++){const a=i*2.399,y=.16+.22*((i*37)%11)/11,rr=.36-y*.25;const m=add(head,puffs,hm,Math.cos(a)*rr,y+.05,Math.sin(a)*rr*.95-.02);m.scale.setScalar(.85+((i*13)%5)*.07);}
  } else if(d.hairStyle==='beanie'){fringe(9,.16,1.25);back(1.95,.1);
    const hat=add(head,cached('beanie',()=>hairBand(HEAD_R*1.12,0,Math.PI*2,0,()=>1.15,{rows:10,segs:56})),soft(d.hat,.9));
    const rim=add(head,cached('rim',()=>new T.TorusGeometry(HEAD_R*1.04,.065,12,48)),soft(d.hat,.9),0,.15,0);rim.rotation.x=Math.PI/2;
    oval(head,.1,.1,.1,0,0,.47,0).material=soft('#ffffff',.95);
  }
  if(d.cap){const dome=add(head,cached('capdome',()=>hairBand(HEAD_R*1.1,0,Math.PI*2,0,()=>1.05,{rows:8,segs:48})),soft(d.cap,.6));
    const brim=oval(head,.24,.02,.2,0,0,.17,.36);brim.material=soft(d.cap,.6);brim.rotation.x=-.15;}
  if(d.glasses){const rimG=cached('glass',()=>new T.TorusGeometry(.085,.013,8,24));for(const u of [.5-.165,.5+.165]){const p=facePoint(u,.5,.03);const m=add(head,rimG,soft(d.glasses,.3),p.x,p.y,p.z);m.rotation.y=Math.atan2(p.x,p.z)*.8;}
    const p=facePoint(.5,.52,.035);box(head,.1,.018,.018,0,p.x,p.y,p.z).material=soft(d.glasses,.3);}
  if(d.earrings)for(const s of [-1,1])oval(head,.028,.04,.028,0,s*.37,-.1,.02).material=surface(new T.Color(d.earrings).getHex(),.5,.3);
  let shown=-1;
  root.userData.setMood=mood=>{
    if(mood===shown)return;shown=mood;
    faceMat.map=faceTexture(d,index,mood);faceMat.needsUpdate=true;
  };
  root.userData.head=head;root.userData.arms=arms;
  return root;
}

function product(id) {
  const d=goods[id], g=new T.Group();
  let markZ=.36, markY=.28, titleY=.75, titleW=.75,titleH=.36;
  if(d.shape==='carton') {
    const gable=new T.Shape();
    gable.moveTo(-.39,.02);gable.lineTo(.39,.02);gable.lineTo(.39,1.03);
    gable.lineTo(.064,1.26);gable.lineTo(-.064,1.26);gable.lineTo(-.39,1.03);gable.closePath();
    const geometry=new T.ExtrudeGeometry(gable,{depth:.63,bevelSize:.014,bevelThickness:.014,bevelSegments:2,steps:1});
    geometry.translate(0,0,-.315);
    add(g,geometry,surface(0xfff7e4,.02,.48));
    shell(g,.135,.09,.69,.012,surface(0x4495da),0,1.291,0);
    const cap=round(g,.105,.096,0x56a0ea,.18,1.214,.12);cap.rotation.z=.37;
    box(g,.817,.117,.665,0x4698de,0,.108);
    markZ=.333;titleY=.69;
  } else if(d.shape==='bottle'||d.shape==='pump') {
    const points=[[.215,.015],[.277,.035],[.324,.09],[.334,.22],[.333,.76],[.345,.86],[.33,.985],[.232,1.105],[.136,1.18],[.135,1.25]];
    const bottle=new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),40);
    add(g,bottle,new T.MeshPhysicalMaterial({color:d.body,roughness:.31,clearcoat:.82,clearcoatRoughness:.25}));
    round(g,.143,.14,d.trim,0,1.249);
    for(let i=0;i<14;i++) {
      const angle=i*Math.PI/7;
      box(g,.021,.092,.022,d.trim,Math.cos(angle)*.148,1.244,Math.sin(angle)*.148).rotation.y=-angle;
    }
    if(d.shape==='pump') {
      round(g,.071,.125,0xfff7e9,0,1.36);
      shell(g,.30,.075,.116,.021,surface(d.trim),.079,1.429,.018);
    }
    markZ=.352;titleW=.55;titleH=.40;
    round(g,.347,.48,d.trim,0,.693);
  } else if(d.shape==='pouch') {
    const foil=new T.MeshPhysicalMaterial({color:d.body,roughness:.32,metalness:.17,clearcoat:.7});
    shell(g,.92,1.24,.37,.12,foil,0,.642);
    shell(g,.91,.105,.29,.025,surface(d.trim,.15,.34),0,1.178);
    shell(g,.89,.105,.27,.025,surface(d.trim,.15,.34),0,.101);
    for(let i=0;i<21;i++) {
      const x=-.405+i*.04;
      box(g,.009,.05,.008,0xffd675,x,1.18,.149);
      box(g,.009,.05,.008,0xffd675,x,.10,.14);
    }
    markZ=.188;titleY=.73;titleH=.52;
  } else if(d.shape==='tin') {
    shell(g,.97,.67,.73,.075,surface(d.body,.16,.41),0,.338);
    shell(g,1.00,.12,.751,.041,surface(d.trim,.31,.37),0,.645);
    shell(g,.976,.045,.73,.014,surface(0xd8a95e,.42,.4),0,.038);
    markZ=.371;titleY=.462;titleH=.231;markY=.204;
  } else if(d.shape==='toy') {
    shell(g,1.16,.90,.61,.049,surface(d.body,.03,.55),0,.45);
    shell(g,1.04,.43,.024,.009,surface(0x233b64),0,.50,.309);
    shell(g,.69,.129,.093,.035,surface(0xf75042,.12,.32),0,.477,.33);
    shell(g,.32,.134,.085,.030,surface(0x80cdeb),-.081,.553,.333);
    for(const x of [-.232,.232])oval(g,.085,.085,.028,0x233547,x,.409,.376);
    titleY=.793;titleH=.16;markY=.176;markZ=.314;
  } else if(id==='camera') {
    shell(g,.985,.80,.57,.07,surface(0xf9a489,.04,.34),0,.405);
    shell(g,.986,.265,.578,.07,surface(0xdb4b44,.12,.43),0,.2);
    shell(g,.27,.15,.018,.009,surface(0xfff0c3),-.262,.65,.292);
    const lens=cylinder.clone();lens.rotateX(Math.PI/2);
    const bezel=add(g,lens,surface(0x273d57,.26,.31),.192,.43,.312);bezel.scale.set(.189,.189,.136);
    oval(g,.136,.138,.046,0x6b97bc,.187,.447,.391);
    oval(g,.049,.048,.014,0xccedf7,.161,.483,.434);
    shell(g,.19,.055,.13,.02,surface(0xd34e45),-.29,.82);
    markZ=.296;titleW=.347;titleH=.14;titleY=.425;markY=.19;
  } else if(d.shape==='duck') {
    const yellow=new T.MeshPhysicalMaterial({color:0xffd43b,roughness:.25,clearcoat:.9,clearcoatRoughness:.15});
    const body=add(g,ball,yellow,0,.44,0);body.scale.set(.52,.42,.44);
    const head=add(g,ball,yellow,.1,1.0,.02);head.scale.setScalar(.31);
    const tail=add(g,ball,yellow,-.1,.66,-.4);tail.scale.set(.16,.14,.12);tail.rotation.x=-.6;
    for(const s of [-1,1]){const w=add(g,ball,yellow,s*.46,.5,-.02);w.scale.set(.1,.2,.26);w.rotation.z=s*-.3;}
    const beak=oval(g,.15,.055,.13,0xff8a2b,.12,.95,.3);beak.material=new T.MeshPhysicalMaterial({color:0xff8a2b,roughness:.3,clearcoat:.8});
    for(const s of [-1,1]){oval(g,.05,.065,.03,0x1a1014,.1+s*.13,1.07,.27);oval(g,.018,.022,.01,0xffffff,.1+s*.13+.015,1.09,.295);}
    oval(g,.07,.035,.02,0xff8fa3,.1+.22,.98,.2);oval(g,.07,.035,.02,0xff8fa3,.1-.22,.98,.2);
    markZ=.44;markY=.36;titleY=.66;titleW=.4;titleH=.13;
  } else if(d.shape==='turkey') {
    const wrap=new T.MeshPhysicalMaterial({color:0xe9b27a,roughness:.22,clearcoat:1,clearcoatRoughness:.08});
    const body=add(g,ball,wrap,0,.42,0);body.scale.set(.62,.42,.5);
    for(const s of [-1,1]){
      const leg=add(g,new T.CapsuleGeometry(.12,.3,6,12),wrap,s*.3,.72,-.22);leg.rotation.set(-.7,0,s*.5);
      const bone=add(g,new T.CylinderGeometry(.035,.035,.1,10),surface(0xfff8ea),s*.155,.93,-.39);bone.rotation.set(-.7,0,s*.5);
      oval(g,.055,.055,.055,0xfff8ea,s*.13,.97,-.43);oval(g,.055,.055,.055,0xfff8ea,s*.17,.98,-.41);
    }
    const net=new T.MeshBasicMaterial({color:0xc0453a,wireframe:true,transparent:true,opacity:.35});
    const n2=add(g,ball,net,0,.42,0);n2.scale.set(.635,.43,.51);n2.castShadow=false;
    const band=add(g,new T.TorusGeometry(.6,.035,8,40),surface(0xc0453a),0,.5,0);band.rotation.x=Math.PI/2;band.scale.set(1.03,.82,1);
    markZ=.5;markY=.34;titleY=.62;titleW=.52;titleH=.15;
  } else {
    shell(g,.99,1.08,.63,.045,surface(d.body),0,.54);
    shell(g,1.004,.205,.64,.042,surface(d.trim),0,.976);
    box(g,.86,.073,.638,0xffe6a3,0,.13);
    const headband=new T.TorusGeometry(.202,.027,8,32,Math.PI);
    add(g,headband,surface(0x5a52a0),0,.52,.322);
    for(const x of [-.199,.199])shell(g,.102,.192,.044,.019,surface(0x6756a6),x,.462,.347);
    markZ=.321;titleY=.914;titleH=.164;
  }
  const trim=`#${new T.Color(d.trim).getHexString()}`;
  const art={milk:'FRESH',juice:'BUBBLY',crisps:'SEA SALT',headphones:'WIRELESS',camera:'INSTANT',car:'RACING',coffee:'DARK ROAST',soap:'CITRUS',cookies:'BAKED',duck:'SQUEAK',turkey:'FROZEN'}[id];
  label(g,{text:d.label,w:titleW,h:titleH,y:titleY,z:-markZ,bg:trim,ink:'#18344b',font:82,art}).rotation.y=Math.PI;
  label(g,{text:d.label,w:titleW,h:titleH,y:titleY,z:markZ,bg:trim,ink:'#18344b',font:82,art,x:id==='camera'?-.237:0});
  label(g,{barcode:true,w:.49,h:.23,y:markY,z:markZ+.016});
  return g;
}

function buildMarket(scene) {
  const g=new T.Group();scene.add(g);
  box(g,20,.21,24,0xbbd7dd,0,-.18,-2);
  const tile=surface(0xeef7f3,.03,.39);
  const tiles=new T.InstancedMesh(cube,tile,143);tiles.receiveShadow=true;g.add(tiles);
  const transform=new T.Object3D();let tileIndex=0;
  for(let z=-12;z<10;z++)for(let x=-6;x<7;x++) {
    if((x+z)%2===0){
      transform.position.set(x,-.064,z);transform.scale.set(.974,.029,.974);transform.updateMatrix();tiles.setMatrixAt(tileIndex++,transform.matrix);
    }
  }
  const matZone=shell(g,3.79,.026,1.62,.011,surface(0x6ca8a5,.02,.79),-.34,-.037,4.82);
  matZone.castShadow=false;
  shell(g,3.57,.012,1.39,.005,surface(0x80bab1),-.34,-.019,4.82).castShadow=false;
  for(let i=0;i<18;i++) {
    const groove=box(g,.024,.009,1.25,0x75aea6,-1.95+i*.19,-.010,4.82);
    groove.castShadow=false;
  }
  box(g,22,5,.23,0xc4e8ee,0,2.37,-9.5);
  box(g,22,.19,.29,0x2099bc,0,3.27,-9.36);
  box(g,22,.08,.29,0xfff5d8,0,3.41,-9.36);
  for(const x of [-4.5,0,4.5]) {
    box(g,3.86,1.26,.08,0x9ad7ee,x,4.10,-9.36);
    box(g,4.00,.09,.14,0xeffaf3,x,3.48,-9.28);
    for(const bar of [-1.9,0,1.9])box(g,.064,1.26,.16,0xf0faff,x+bar,4.10,-9.29);
  }
  const shelfColors=[0xe99150,0x3bafaa,0xe55f69,0x589ae0,0xffcc50,0x64b978];
  for(const [aisle,x,z,width] of [[0,-4.05,-4.72,2.4],[1,2.45,-5.98,3.1],[2,-2.45,-8.43,2.9]]) {
    box(g,width,2.48,.085,0x5b8fba,x,1.222,z-.226);
    for(const side of [-1,1])box(g,.10,2.49,.65,0xe0eff0,x+side*width/2,1.22,z);
    for(let row=0;row<4;row++) {
      const y=.255+row*.61;
      box(g,width,.084,.63,0xf9fbec,x,y,z);
      box(g,width,.078,.029,0x37a2cc,x,y,z+.321);
      for(let item=0;item<8;item++) {
        const px=x-width*.427+item*(width*.854/7),c=shelfColors[(item+row*2+aisle)%shelfColors.length];
        if((row+aisle)%3===0) {
          round(g,.104,.296,c,px,y+.196,z+.064);
          round(g,.105,.073,0xfff2cc,px,y+.214,z+.064);
          round(g,.092,.043,0xe8f0ed,px,y+.346,z+.064);
        } else {
          box(g,.233,.30+(item%3)*.04,.256,c,px,y+.199,z+.081);
          box(g,.196,.083,.013,0xffefc9,px,y+.221,z+.213);
        }
      }
      for(let item=0;item<4;item++)box(g,.24,.047,.013,0xffffee,x-width*.35+item*width*.23,y,z+.342);
    }
  }
  const signGroup=new T.Group();signGroup.position.set(-.12,3.26,-5.51);g.add(signGroup);
  shell(signGroup,2.38,.54,.113,.043,surface(0x1681ad,.12,.43));
  label(signGroup,{text:'FRESH MART',w:2.16,h:.37,z:.062,bg:'#137ba7',ink:'#fbfff0',font:96});
  for(const x of [-1,1])box(signGroup,.032,1,.033,0x728d9f,x,.76,-.04);
}

function buildCounter(scene) {
  const counter=new T.Group();scene.add(counter);
  shell(counter,7.23,1.15,3.32,.081,surface(0x177fba,.11,.45),0,.54,1.74);
  shell(counter,7.43,.25,3.48,.078,surface(0xfff9e8,.13,.37),0,1.15,1.74);
  shell(counter,7.24,.087,.091,.03,surface(0x86dcd1,.18,.37),0,.928,3.428);
  box(counter,7.10,.07,.05,0x184c74,0,.2,3.408);
  label(counter,{text:'CHECKOUT',w:2.17,h:.32,x:-1.13,y:.635,z:3.411,bg:'#1479b2',ink:'#fff7da',font:102});
  for(let i=0;i<7;i++)box(counter,.083,.24,.039,0x4da5ce,.35+i*.163,.632,3.413);
  shell(counter,3.13,.135,1.94,.046,surface(0x526979,.41,.36),-1.55,1.296,1.44);
  shell(counter,2.99,.094,1.83,.028,surface(0x23394d,.17,.65),-1.55,1.335,1.44);
  const belt=[];
  for(let i=0;i<15;i++) {
    belt.push(box(counter,.029,.011,1.74,0x43566a,-2.96+i*.195,1.384,1.44));
  }
  for(const z of [.477,2.405]) shell(counter,3.08,.064,.078,.019,surface(0xcbe8e9,.57,.34),-1.55,1.412,z);
  shell(counter,1.66,.16,1.87,.062,surface(0x042d51,.24,.34),.94,1.355,1.47);
  shell(counter,1.53,.105,1.71,.043,surface(0x1a9eb5,.22,.36),.94,1.448,1.47);
  shell(counter,1.29,.054,1.47,.021,new T.MeshPhysicalMaterial({color:0x0d4868,metalness:.14,roughness:.21,clearcoat:.85}),.94,1.497,1.47);
  const scanMat=new T.MeshBasicMaterial({color:0xff453e});
  const beam=add(counter,cube,scanMat,.94,1.529,1.47);beam.scale.set(.037,.013,1.48);
  for(const z of [.728,2.211])oval(counter,.062,.026,.063,0xff684a,.94,1.52,z);
  const aura=new T.MeshBasicMaterial({color:0xff5945,transparent:true,opacity:.21,depthWrite:false});
  const halo=add(counter,cube,aura,.94,1.536,1.47);halo.scale.set(.23,.013,1.48);
  const terminal=new T.Group();terminal.position.set(2.56,1.35,1.08);terminal.rotation.y=-.13;counter.add(terminal);
  shell(terminal,1.47,.43,1.65,.11,surface(0x18384b,.08,.42),0,.18);
  shell(terminal,1.35,.10,1.49,.036,surface(0x477f95,.17,.36),0,.418);
  const displayGroup=new T.Group();displayGroup.position.set(0,.68,-.44);displayGroup.rotation.x=-.43;terminal.add(displayGroup);
  shell(displayGroup,1.21,.58,.14,.051,surface(0x234757,.02,.47));
  shell(displayGroup,1.09,.46,.057,.021,surface(0x80ccbb,.10,.32),0,0,.081);
  const display=document.createElement('canvas');display.width=384;display.height=144;
  const displayTexture=new T.CanvasTexture(display);displayTexture.colorSpace=T.SRGBColorSpace;
  const screen=add(displayGroup,new T.PlaneGeometry(1.01,.386),new T.MeshBasicMaterial({map:displayTexture}),0,0,.112);
  screen.castShadow=false;
  for(let row=0;row<3;row++)for(let col=0;col<4;col++) {
    const color=col===3?[0xfa6951,0xf5ce57,0x54c58f][row]:0xb1c7ca;
    shell(terminal,.193,.052,.138,.017,surface(color),-.34+col*.219,.497,-.015+row*.176);
  }
  const printer=new T.Group();printer.position.set(2.51,1.28,-.38);counter.add(printer);
  shell(printer,1.10,.33,.77,.073,surface(0xe3f1ee,.12,.44),0,.159);
  shell(printer,.87,.049,.104,.017,surface(0x385e6d),0,.326,.035);
  oval(printer,.041,.015,.041,0x55d8a4,.407,.328,.151);
  const paper=new T.Group();paper.position.set(0,.349,.028);paper.rotation.x=-.21;printer.add(paper);
  const stub=box(paper,.63,.64,.012,0xfff5dc,0,.315);
  stub.castShadow=false;
  label(paper,{text:'PAID',w:.52,h:.125,y:.427,z:.009,bg:'#fff5dc',ink:'#16856b',font:115});
  for(let i=0;i<4;i++)box(paper,.40-i*.027,.020,.01,0x9aaeab,-.02,.31-i*.048,.009);
  paper.visible=false;

  const drawer=new T.Group();counter.add(drawer);drawer.position.set(1.46,.877,2.93);
  shell(drawer,2.65,.202,1.31,.046,surface(0x1c4358),0,-.02,0);
  shell(drawer,2.47,.057,1.12,.017,surface(0x40586a),0,.095,0);
  for(let i=0;i<4;i++) {
    const x=-.884+i*.589;
    const bills=[0x83caaa,0x58a6d4,0xe1b782,0xc793b5];
    for(let layer=0;layer<4;layer++)box(drawer,.395,.014,.472,bills[i],x,.13+layer*.018,-.211);
    round(drawer,.085,.014,0xffeebb,x,.194,-.211);
    box(drawer,.028,.081,.98,0x162e49,x+.286,.137,.004);
    for(let coin=0;coin<i+2;coin++)round(drawer,.082,.025,coin%2?0xf6c764:0xb9c9c9,x+(coin%2-.5)*.12,.154+Math.floor(coin/2)*.028,.27+(coin%3-1)*.079);
  }
  shell(drawer,2.74,.235,.11,.041,surface(0x156491),0,.012,.626);
  shell(drawer,.72,.072,.052,.022,surface(0x7da9b0),0,.005,.702);
  drawer.visible=false;
  return {belt,beam,halo,display,displayTexture,paper,drawer};
}

const PRESENT=-.36;
const CUR={x:-1.45,y:1.40,z:1.49}, NEXT_X=-2.62, ENTER_X=-3.9;
const HEIGHTS={carton:1.3,bottle:1.4,pump:1.5,pouch:1.25,tin:.72,toy:.92,box:1.1,duck:1.3,turkey:1.0};
const FRONT={x:.30,z:-.54,s:1.19,ry:.14};
const SLOTS=[[-1.55,-2.35],[-2.55,-2.85],[-2.95,-3.9],[-2.0,-4.55],[-1.05,-5.15],[-0.1,-5.75]];
const slot=k=>{if(k>SLOTS.length)return {x:.9+(k-SLOTS.length)*.85,z:-6.3,s:.98,ry:-.2};const [x,z]=SLOTS[k-1];return {x,z,s:.98,ry:.55-k*.12};};
const ENTRANCE={x:4.2,z:-7.2};
const EXIT_HAPPY={x:4.9,z:-1.5,s:1,ry:-1.2}, EXIT_ANGRY={x:-6.2,z:-1.3,s:1,ry:1.6};
const MOOD_COLORS={3:'#3fc28a',2:'#ffc23d',1:'#f0584c',0:'#8a6a74'};
function bubbleMaterial(mood) {
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  x.fillStyle='#ffffff';x.beginPath();x.arc(64,60,54,0,Math.PI*2);x.fill();
  x.beginPath();x.moveTo(52,108);x.lineTo(64,126);x.lineTo(76,108);x.fill();
  x.fillStyle=MOOD_COLORS[mood];x.beginPath();x.arc(64,60,46,0,Math.PI*2);x.fill();
  x.fillStyle='#ffffff';x.strokeStyle='#ffffff';x.lineWidth=8;x.lineCap='round';
  for(const ex of [46,82]){x.beginPath();x.arc(ex,50,6.5,0,Math.PI*2);x.fill();}
  x.beginPath();
  if(mood===3)x.arc(64,66,18,.15*Math.PI,.85*Math.PI);
  else if(mood===2){x.moveTo(48,80);x.lineTo(80,80);}
  else {x.arc(64,92,18,1.15*Math.PI,1.85*Math.PI);x.moveTo(36,34);x.lineTo(54,42);x.moveTo(92,34);x.lineTo(74,42);}
  x.stroke();
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  return new T.SpriteMaterial({map,depthTest:false,transparent:true});
}

export function createStage(root) {
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(1.8,window.devicePixelRatio||1));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  root.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0xe0f4ff);scene.fog=new T.Fog(0xe0f4ff,16,34);
  scene.environment=studioMap();scene.environmentIntensity=.54;
  const camera=new T.OrthographicCamera(-4,4,4,-4,.1,48);
  camera.position.set(2.18,8.6,13.77);camera.lookAt(-.4,1.6,-.6);
  scene.add(new T.HemisphereLight(0xe9fbff,0x8ba3ae,1.55));
  const key=new T.DirectionalLight(0xfff2d2,2.74);key.position.set(-4.7,8.9,4.3);
  key.castShadow=true;Object.assign(key.shadow.camera,{left:-9,right:9,top:9,bottom:-8,near:.4,far:26});
  key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.00035;key.shadow.normalBias=.017;
  scene.add(key);
  const rim=new T.DirectionalLight(0x9fe8ff,1.22);rim.position.set(6,4,-6);scene.add(rim);
  buildMarket(scene);
  const devices=buildCounter(scene);
  const bubbles={3:bubbleMaterial(3),2:bubbleMaterial(2),1:bubbleMaterial(1),0:bubbleMaterial(0)};

  // 商品对象池：同一种商品可能同时出现在台前和传送带上
  const pool=new Map();
  function acquire(id) {
    const list=pool.get(id)||[];pool.set(id,list);
    let m=list.find(o=>!o.userData.busy);
    if(!m){m=list.length?list[0].clone(true):product(id);scene.add(m);list.push(m);}
    m.userData={id,busy:true,x:ENTER_X};m.visible=true;return m;
  }
  const release=m=>{if(m){m.userData.busy=false;m.visible=false;}};
  let fever=false,cur=null,nxt=null,angle=0,yaw=0,movement=0,lift=0,shake=0,flash=0,disappointed=false;
  const carry=[];
  let people=[],fresh=true,printing=0,cashOpen=0,cashTarget=0,jolt=0,beltPhase=0;
  const displayContext=devices.display.getContext('2d');
  let lastDisplay='';
  const particles=Array.from({length:22},(_,i)=>{
    const m=add(scene,cube,new T.MeshBasicMaterial({color:[0xffc574,0xb9f7e5,0xf891b1,0xe6d4ff][i%4]}));
    m.visible=false;m.castShadow=false;return m;
  });
  const project=(x,y,z)=>{const v=new T.Vector3(x,y,z).project(camera);return {x:(v.x+1)/2,y:(1-v.y)/2};};
  function resize() {
    const w=root.clientWidth,h=root.clientHeight;if(!w||!h)return;
    const ratio=w/h,halfW=Math.max(3.3,3.0*ratio),halfH=halfW/ratio;
    // 竖屏多出来的高度给上方的排队区，而不是脚下的空地板
    const up=Math.max(0,halfH-3.4)*.75;
    camera.left=-halfW;camera.right=halfW;camera.top=halfH+up;camera.bottom=-halfH+up;
    camera.updateProjectionMatrix();camera.updateMatrixWorld();renderer.setSize(w,h,false);
  }
  const observer=new ResizeObserver(resize);observer.observe(root);resize();

  return {
    reset(){people.forEach(p=>scene.remove(p.g));people=[];fresh=true;},
    updateQueue(run) {
      const known=new Set(people.map(p=>p.c));
      for(const c of run.queue){
        if(known.has(c)||c.state==='done'||c.state==='left')continue;
        const g=customer(c.design);scene.add(g);
        const bubble=new T.Sprite(bubbles[3]);bubble.scale.setScalar(.46);bubble.position.set(.42,2.78,0);bubble.renderOrder=5;g.add(bubble);
        if(fresh)g.position.set(0,0,0);else{g.position.set(ENTRANCE.x,0,ENTRANCE.z);g.rotation.y=Math.PI*.8;}
        g.scale.setScalar(.98);
        people.push({g,c,bubble,mood:3,gone:false,snap:fresh});
      }
      let k=0;
      for(const p of people){
        const c=p.c;let target;
        if(c.state==='front')target=FRONT;
        else if(c.state==='wait')target=slot(++k);
        else target=c.state==='done'?EXIT_HAPPY:EXIT_ANGRY;
        p.target=target;
        if(p.snap){p.g.position.set(target.x,0,target.z);p.g.rotation.y=target.ry;p.g.scale.setScalar(target.s);p.snap=false;}
        p.mood=c.state==='done'?3:c.state==='left'?0:moodOf(c.p);
        p.bubble.material=bubbles[p.mood];
        p.bubble.visible=c.state==='front'||c.state==='wait'||c.state==='left';
      }
      fresh=false;
      for(const p of people)if(p.gone)scene.remove(p.g);
      people=people.filter(p=>!p.gone);
    },
    showItems(items,index,curFace,feverOn=false) {
      const it=items[index],nt=items[index+1];fever=feverOn;
      release(cur);cur=null;
      if(it){
        if(nxt&&nxt.userData.id===it.id){cur=nxt;nxt=null;}
        else {release(nxt);nxt=null;cur=acquire(it.id);cur.userData.x=NEXT_X-.4;}
        angle=yaw=(curFace??it.face)*Math.PI/2;movement=lift=0;cur.scale.setScalar(1.26);
      } else {release(nxt);nxt=null;}
      if(nt&&!nxt){nxt=acquire(nt.id);nxt.userData.x=ENTER_X;nxt.scale.setScalar(.98);nxt.rotation.set(0,(feverOn?0:nt.face)*Math.PI/2+PRESENT,0);}
    },
    clearItems(){release(cur);release(nxt);cur=nxt=null;},
    turn(side){angle+=side==='right'?-Math.PI/2:Math.PI/2;},
    drag(value){movement=Math.max(0,Math.min(1,value));},
    scanTarget(){return project(.94,1.53,1.49);},
    itemTarget(){return project(cur?cur.userData.x:CUR.x,2.06,CUR.z);},
    itemTop(){
      const id=cur?.userData.id;if(!id)return null;
      return project(cur.userData.x+.1,CUR.y+HEIGHTS[goods[id].shape]*1.26+.2,CUR.z);
    },
    headOf(n){const p=people.find(q=>q.c.n===n);if(!p)return null;const q=p.g.position;return project(q.x,q.y+3.1*p.g.scale.x,q.z);},
    sale(total,cash) {
      cashTarget=Number(cash);
      const text=`¥${total}`;
      if(text===lastDisplay)return;
      lastDisplay=text;
      const ctx=displayContext;
      ctx.fillStyle='#12394c';ctx.fillRect(0,0,384,144);
      ctx.fillStyle='#78d1c7';ctx.fillRect(16,15,352,2);
      ctx.fillStyle='#a6e6d5';ctx.font='700 23px Arial';ctx.fillText('TOTAL',24,44);
      ctx.fillStyle='#e4ffda';ctx.font='bold 68px monospace';ctx.textAlign='right';ctx.fillText(text,355,116);
      ctx.textAlign='left';devices.displayTexture.needsUpdate=true;
    },
    receipt(){printing=.93;},
    clearReceipt(){printing=0;},
    effect(success) {
      flash=.51;disappointed=!success;
      if(success&&cur){carry.push({m:cur,t:.34,x:cur.position.x});cur=null;}
      else if(!success){shake=.4;jolt=.4;}
    },
    angry(){jolt=.5;},
    setFever(on){fever=on;if(on){angle=Math.ceil(angle/(Math.PI*2)+.01)*Math.PI*2;if(nxt)nxt.rotation.y=PRESENT;}},
    cheer(n){const p=people.find(q=>q.c.n===n);if(p)p.cheer=.75;},
    render(time,dt) {
      const ease=1-Math.exp(-dt*15);
      yaw+=(angle-yaw)*ease;lift+=(movement-lift)*ease;
      shake=Math.max(0,shake-dt);jolt=Math.max(0,jolt-dt);
      let rolling=false;
      if(cur){
        const u=cur.userData;const before=u.x;u.x+=(CUR.x-u.x)*(1-Math.exp(-dt*11));rolling||=Math.abs(u.x-before)>.002;
        const wob=shake>0?Math.sin(shake*44)*shake*.5:0;
        cur.rotation.set(-lift*.09,yaw+PRESENT+wob,-.22*lift);
        cur.position.set(u.x+2.48*lift+wob*.3,CUR.y+.24*Math.sin(lift*Math.PI)+.022*Math.sin(time*4),CUR.z);
      }
      if(nxt){const u=nxt.userData;const before=u.x;u.x+=(NEXT_X-u.x)*(1-Math.exp(-dt*7));rolling||=Math.abs(u.x-before)>.002;nxt.position.set(u.x,CUR.y,CUR.z);}
      for(let i=carry.length-1;i>=0;i--){
        const c=carry[i];c.t-=dt;
        if(c.t<=0){release(c.m);carry.splice(i,1);continue;}
        const p=1-c.t/.34;c.m.position.set(c.x+(3.3-c.x)*p,1.52+Math.sin(p*Math.PI)*.45,1.49-.79*p);c.m.scale.setScalar(1.26-p*.35);c.m.rotation.y+=dt*6;
      }
      for(const [i,p] of people.entries()){
        const t=p.target;if(!t||p.gone)continue;const g=p.g;
        const dx=t.x-g.position.x,dz=t.z-g.position.z,dist=Math.hypot(dx,dz);
        const leaving=p.c.state==='done'||p.c.state==='left';
        const speed=(p.c.state==='left'?5.5:p.c.state==='done'?4.2:3.2)*dt;
        if(dist>.01){const m=Math.min(1,speed/dist);g.position.x+=dx*m;g.position.z+=dz*m;}
        const walking=dist>.05;
        g.position.y=walking?Math.abs(Math.sin(time*11+i))*.07:fever?Math.abs(Math.sin(time*Math.PI*2+i*.6))*.16:Math.sin(time*3+i)*.02;
        if(p.cheer>0){p.cheer=Math.max(0,p.cheer-dt);const k=1-p.cheer/.75;g.position.y+=Math.sin(k*Math.PI)*.55;}
        const arms=g.userData.arms;if(arms){const wave=fever&&!leaving?Math.sin(time*12+i)*.5+2.4:(p.cheer>0?2.6:0);arms.forEach((a,j)=>{const base=(j?1:-1)*.22;a.rotation.z+=(((j?1:-1)*wave+base)-a.rotation.z)*(1-Math.exp(-dt*12));});}
        const face=(walking&&(leaving||dist>.6)?Math.atan2(dx,dz):t.ry)+(p.cheer>0?(1-p.cheer/.75)*Math.PI*2:0);
        g.rotation.y+=(face-g.rotation.y)*(1-Math.exp(-dt*8));
        const s=g.scale.x+(t.s-g.scale.x)*(1-Math.exp(-dt*6));g.scale.setScalar(s);
        g.userData.setMood(p.mood===0?1:p.mood);
        const fume=p.mood<=1&&!walking?Math.sin(time*24+i)*.035:0;
        g.rotation.z=(p.c.state==='front'&&jolt>0?Math.sin(jolt*30)*.07:0)+fume;
        p.bubble.position.y=2.78+Math.sin(time*4+i)*.04;
        p.bubble.scale.setScalar(p.mood<=1?.5+Math.abs(Math.sin(time*8))*.06:.46);
        if(leaving&&dist<.3){g.visible=false;p.gone=true;}
      }
      beltPhase+=dt*(rolling?1.1:.18);
      devices.belt.forEach((m,i)=>m.position.x=-2.96+((i*.195+beltPhase)%2.91));
      cashOpen+=(cashTarget-cashOpen)*(1-Math.exp(-dt*9));
      devices.drawer.visible=cashOpen>.024;
      devices.drawer.position.z=2.39+cashOpen*1.38;
      printing=Math.max(0,printing-dt);
      devices.paper.visible=printing>0;
      devices.paper.scale.y=Math.min(1,(.93-printing)*3.8);
      flash=Math.max(0,flash-dt);
      const beamColor=new T.Color(flash>0?(disappointed?0xff423a:0x72ffe1):0xff5047);
      if(fever&&!(flash>0&&disappointed))beamColor.setHSL((time*1.6)%1,.95,.6);
      devices.beam.material.color.copy(beamColor);
      devices.halo.material.color.copy(beamColor);
      devices.halo.material.opacity=.28+.055*Math.sin(time*7)+(flash>0?flash*.55:0);
      particles.forEach((m,i)=>{
        m.visible=flash>0&&!disappointed;
        if(!m.visible)return;
        const age=1-flash/.51,dir=i*2.399;
        m.position.set(.95+Math.cos(dir)*age*1.15,1.51+age*(1.9+(i%5)*.19)-age*age*1.36,1.49+Math.sin(dir)*age*.93);
        m.rotation.set(age*4+i,time*3,dir);m.scale.setScalar((.05+i%3*.015)*(1-age*.85));
      });
      renderer.render(scene,camera);
    },
  };
}
export {customer,surface,product};
