import {T,ball,box,column,group,material,mesh,rod,sign,ring,seeded,painted} from './scene-kit.js';

const brass = material('#e8bb79',.37,.31);
const pearl = material('#fff3e0',.13,.35);
const cut = new T.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI*.71);
const diamond = new T.OctahedronGeometry(1);
const shapes = new Map();
function profile(parent, levels, zScale, color, x=0,y=0,z=0) {
  const key = JSON.stringify(levels);
  if (!shapes.has(key)) shapes.set(key, new T.LatheGeometry(levels.map(([r,h])=>new T.Vector2(r,h)),36));
  return mesh(parent,shapes.get(key),color,x,y,z,1,1,zScale);
}

import {CATALOG} from './rules.js';
export const wardrobe = CATALOG;

const textiles = new Map();
function skirtFabric(item) {
  if (textiles.has(item.color+item.type)) return textiles.get(item.color+item.type);
  const satin = item.type==='gown';
  const print = painted(512,256,(ctx,w,h)=>{
    ctx.fillStyle=item.color;
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle=item.detail;
    if(item.type==='stripe'){
      for(let row=0;row<5;row++)ctx.fillRect(0,22+row*50,w,19);
    }
    ctx.fillRect(0,h-13,w,3);
    ctx.fillRect(0,h-6,w,2);
    for(let i=0;i<16;i++){
      const x=i*32+16, y=h-30-(i%2)*8;
      ctx.save();
      ctx.translate(x,y);
      for(let petal=0;petal<(satin?4:5);petal++){
        ctx.rotate(Math.PI*2/(satin?4:5));
        ctx.beginPath();
        ctx.ellipse(0,-4, satin?1.5:3.4,5,0,0,Math.PI*2);
        ctx.fill();
      }
      ctx.fillStyle='#ffe4a0';
      ctx.fillRect(-2,-2,4,4);
      ctx.restore();
    }
  });
  const fabric=new T.MeshPhysicalMaterial({map:print,roughness:satin?.32:.72,
    sheen:satin?.94:.35,sheenColor:item.detail,sheenRoughness:satin?.32:.72,side:T.DoubleSide});
  textiles.set(item.color+item.type,fabric);
  return fabric;
}
function flaredSkirt(parent,item,length,hem) {
  const key='skirt-'+item.type;
  if(!shapes.has(key)){
    const geo=new T.PlaneGeometry(1,1,96,24), pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const a=geo.attributes.uv.getX(i)*Math.PI*2, t=1-geo.attributes.uv.getY(i);
      const folds=Math.sin(a*(item.type==='gown'?9:14)+t*.75);
      const radius=.293+(hem-.293)*t**1.25+.060*folds*t**1.4;
      pos.setXYZ(i,Math.sin(a)*radius,.065-length*t+.022*folds*t**3,Math.cos(a)*radius*.82);
    }
    geo.computeVertexNormals();
    shapes.set(key,geo);
  }
  mesh(parent,shapes.get(key),skirtFabric(item),0,0,0);
}

export function clothing(parent, item, y=0, z=0) {
  const shiny = item.type === 'gown';
  const fabric = material(item.color,shiny ? .29 : .04,shiny ? .31 : .69);
  const accent = material(item.detail, .21, .43);
  const base = group(parent,0,y,z);
  if (item.type === 'street') {
    profile(base,[[0,0],[.35,.01],[.32,.28],[.35,.51],[.39,.66],[.23,.74],[0,.75]],.7,fabric);
    for (const d of [-1,1]) {
      ball(base,d*.38,.6,.003,.13,.15,.14,fabric);
      rod(base,[d*.36,.48,.056],[d*.44,.72,.052],.023,accent);
      profile(base,[[0,0],[.16,.01],[.17,.48],[.18,.71],[0,.72]],.85,'#4d3d85',d*.17,-.7);
      box(base,d*.17,-.58,.147,.15,.05,.022,accent);
    }
    box(base,0,.31,.227,.022,.51,.024,accent);
    ball(base,0,.79,-.12,.29,.12,.2,fabric);
    return base;
  }
  profile(base,[[0,0],[.30,.01],[.242,.22],[.32,.52],[.305,.61],[.20,.65],[0,.66]],.7,fabric);
  const hem = shiny ? .64 : .54;
  const length = shiny ? 1.16 : .72;
  flaredSkirt(base,item,length,hem);
  profile(base,[[.255,.055],[.271,.079],[.266,.146],[.254,.151]],.74,accent);
  if (shiny) {
    for (let i=0;i<18;i++) {
      const a=i*2.4, h=-(.16+(i%8)*.117), radius=.266+(-h)*.249;
      mesh(base,diamond,i%3 ? accent : brass,Math.cos(a)*radius,h,Math.sin(a)*radius*.82,.016,.027,.016,false);
    }
    rod(base,[.19,.52,.12],[.27,.762,-.018],.048,accent);
  } else {
    for (const d of [-1,1]) {
      ball(base,d*.353,.55,0,.12,.108,.146,fabric);
      ball(base,d*.081,.104,.196,.105,.052,.034,accent).rotation.z=d*.38;
    }
    ball(base,0,.105,.227,.044,.041,.035,brass);
  }
  return base;
}

export function shoe(parent, item, x=0,y=0,z=0) {
  const base = group(parent,x,y,z);
  ball(base,0,.054,.08,.119,.048,.216,item.type==='sneakers' ? '#f4eced' : '#30213c');
  ball(base,0,.105,.067,.115,.085,.204,item.color);
  if (item.type === 'boots') {
    column(base,0,.21,.01,.111,.23,.12,item.color);
    ball(base,0,.319,.028,.115,.033,.129,item.detail);
    mesh(base,diamond,brass,0,.228,.142,.05,.06,.018);
  } else if (item.type === 'pumps') {
    box(base,0,.056,-.083,.084,.115,.087,item.color);
    for (const d of [-1,1]) ball(base,d*.041,.164,.19,.053,.03,.029,item.detail).rotation.z=d*.27;
  } else {
    for (let i=0;i<3;i++) box(base,0,.172,.047+i*.037,.123,.012,.014,item.detail);
    box(base,0,.093,.103,.219,.026,.034,item.detail);
  }
  return base;
}

export function handbag(parent, item, x=0,y=0,z=0) {
  const base = group(parent,x,y,z);
  const w = item.type==='clutch' ? .34 : .31;
  const half=w*.5;
  const outline=new T.Shape();
  outline.moveTo(-half+.036,-.095);
  outline.quadraticCurveTo(-half,-.095,-half,-.056);
  outline.lineTo(-half+.014,.054);
  outline.quadraticCurveTo(-half+.012,.089,-half+.052,.093);
  outline.lineTo(half-.052,.093);
  outline.quadraticCurveTo(half-.013,.089,half-.014,.054);
  outline.lineTo(half,-.056);
  outline.quadraticCurveTo(half,-.095,half-.036,-.095);
  outline.closePath();
  const key='purse-'+item.type;
  if(!shapes.has(key)) shapes.set(key,new T.ExtrudeGeometry(outline,{depth:.074,bevelSize:.014,bevelThickness:.012,bevelSegments:3,curveSegments:8}));
  mesh(base,shapes.get(key),material(item.color,.06,.42),0,0,-.035);
  const flap=new T.Shape();
  flap.moveTo(-half+.017,.077);
  flap.lineTo(half-.017,.077);
  flap.quadraticCurveTo(half-.018,.003,.027,-.018);
  flap.quadraticCurveTo(0,-.030,-.027,-.018);
  flap.quadraticCurveTo(-half+.018,.003,-half+.017,.077);
  if(!shapes.has(key+'-flap')) shapes.set(key+'-flap',new T.ShapeGeometry(flap));
  mesh(base,shapes.get(key+'-flap'),item.detail,0,0,.053);
  const handle = mesh(base,new T.TorusGeometry(w*.31,.015,8,24,Math.PI),brass,0,.057,0);
  handle.scale.y = item.type==='clutch' ? .48 : 1;
  mesh(base,diamond,brass,0,-.010,.059,.021,.026,.009);
  for(const d of [-1,1])ball(base,d*w*.31,.069,.029,.015,.019,.012,brass);
  if (item.type==='satchel') rod(base,[-.14,.068,.031],[.09,.21,.015],.015,item.detail);
  return base;
}

// Elliptical, tapered locks follow a spline so the hairstyle has a continuous silhouette.
const hairShapes=new Map();
function hairLock(parent,coords,width,depth,surface){
  const key=JSON.stringify([coords,width,depth]);
  if(!hairShapes.has(key)){
    const path=new T.CatmullRomCurve3(coords.map(p=>new T.Vector3(...p)));
    const vertices=[],triangles=[];
    for(let i=0;i<=22;i++){
      const t=i/22, p=path.getPoint(t), dir=path.getTangent(t);
      const axis=new T.Vector3(-dir.y,dir.x,0).normalize();
      const cross=new T.Vector3().crossVectors(dir,axis).normalize();
      const radius=.012+.988*Math.pow(Math.sin(Math.PI*t),.64);
      for(let j=0;j<12;j++){
        const a=j*Math.PI/6;
        const v=p.clone().addScaledVector(axis,width*radius*Math.cos(a)).addScaledVector(cross,depth*radius*Math.sin(a));
        vertices.push(v.x,v.y,v.z);
        if(i){const k=i*12+j,n=i*12+(j+1)%12;triangles.push(k-12,n-12,k,n-12,n,k);}
      }
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(triangles);geo.computeVertexNormals();
    hairShapes.set(key,geo);
  }
  mesh(parent,hairShapes.get(key),surface,0,0,0);
}
// ——脸：五官画在一张贴花纹理上（大眼、睫毛、眉、腮红、唇），按选项缓存——
const FACE_LEVELS=[[0,-.165],[.07,-.152],[.148,-.108],[.214,-.03],[.26,.08],[.276,.194],[.258,.29],[.212,.378],[.125,.424],[0,.447]];
const FW=.28, FTOP=.44, FH=.62;
let faceGeo=null;
function faceGeometry(){
  if(faceGeo) return faceGeo;
  const geo=new T.LatheGeometry(FACE_LEVELS.map(([r,h])=>new T.Vector2(r,h)),48);
  const pos=geo.attributes.position, uv=geo.attributes.uv;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    if(z<0) uv.setXY(i,0,0);
    else uv.setXY(i,(x+FW)/(2*FW),(y-(FTOP-FH))/FH);
  }
  return faceGeo=geo;
}
function shade(hex,k){
  const c=new T.Color(hex);
  c.lerp(new T.Color(k<0?'#000000':'#ffffff'),Math.abs(k));
  return '#'+c.getHexString();
}
function rgba(hex,a){
  const c=new T.Color(hex), s=c.getStyle(T.SRGBColorSpace).match(/\d+(\.\d+)?/g);
  return `rgba(${s[0]},${s[1]},${s[2]},${a})`;
}
const PX=512/(2*FW), PY=512/FH;
const fx=x=>(x+FW)*PX, fy=y=>(FTOP-y)*PY;
const EYE_SHAPES={
  doe:{y:.108,x:.106,w:.132,h:.13,tilt:-.05,top:.62,iris:.47,lash:.15,wing:.06,lashes:3,browW:.104,browT:.016,arch:1},
  cat:{y:.118,x:.108,w:.13,h:.098,tilt:.24,top:.56,iris:.45,lash:.16,wing:.17,lashes:2,browW:.11,browT:.017,arch:1.35},
  calm:{y:.114,x:.105,w:.118,h:.088,tilt:.03,top:.4,iris:.52,lash:.13,wing:.04,lashes:2,browW:.1,browT:.019,arch:.55},
  soft:{y:.108,x:.104,w:.134,h:.098,tilt:.03,top:.5,iris:.58,lash:.13,wing:.07,lashes:2,browW:.112,browT:.018,arch:.38},
  plain:{y:.118,x:.098,w:.088,h:.06,tilt:0,top:.55,iris:.44,lash:.1,wing:0,lashes:0,browW:.09,browT:.016,arch:.8},
};
const bez=(a,b,c,d,t)=>{const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d;};
function drawEye(c,cx,cy,dir,e,o){
  const ew=e.w*PX, eh=e.h*PY, L=-ew/2, R=ew/2;
  const P=[[L,eh*.12],[L+ew*.12,-eh*e.top*1.05],[R-ew*.3,-eh*e.top*1.1],[R,-eh*.1]];
  const top=()=>{c.moveTo(...P[0]);c.bezierCurveTo(...P[1],...P[2],...P[3]);};
  c.save();
  c.translate(cx,cy); c.scale(dir,1); c.rotate(-e.tilt);
  if(o.shadow){
    const g=c.createRadialGradient(ew*.1,-eh*.35,eh*.05,ew*.1,-eh*.35,ew*.72);
    g.addColorStop(0,o.shadow); g.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g; c.fillRect(-ew,-eh*1.5,ew*2.2,eh*1.6);
  }
  c.beginPath(); top(); c.bezierCurveTo(R-ew*.18,eh*.5,L+ew*.22,eh*.58,L,eh*.12); c.closePath();
  c.fillStyle='#fffaf6'; c.fill();
  c.save(); c.clip();
  const ix=ew*.03, iy=eh*.1, r=eh*e.iris;
  const g=c.createRadialGradient(ix,iy+r*.4,r*.08,ix,iy,r);
  g.addColorStop(0,shade(o.iris,.5)); g.addColorStop(.5,o.iris); g.addColorStop(1,shade(o.iris,-.62));
  c.fillStyle=g; c.beginPath(); c.arc(ix,iy,r,0,Math.PI*2); c.fill();
  c.strokeStyle=shade(o.iris,-.75); c.lineWidth=r*.09; c.stroke();
  c.fillStyle='#140b0b'; c.beginPath(); c.ellipse(ix,iy,r*.4,r*.46,0,0,Math.PI*2); c.fill();
  const s=c.createLinearGradient(0,-eh*.75,0,-eh*.02);
  s.addColorStop(0,'rgba(55,22,28,.6)'); s.addColorStop(1,'rgba(55,22,28,0)');
  c.fillStyle=s; c.fillRect(-ew,-eh,ew*2,eh);
  c.fillStyle='#ffffff';
  c.beginPath(); c.arc(ix-r*.36*dir,iy-r*.34,r*.27,0,Math.PI*2); c.fill();
  c.globalAlpha=.85; c.beginPath(); c.arc(ix+r*.4*dir,iy+r*.36,r*.12,0,Math.PI*2); c.fill(); c.globalAlpha=1;
  c.restore();
  c.strokeStyle=o.lash; c.lineCap='round'; c.lineJoin='round';
  c.beginPath(); top(); c.lineWidth=eh*e.lash; c.stroke();
  if(e.wing){
    c.beginPath(); c.moveTo(R-ew*.06,-eh*.12);
    c.quadraticCurveTo(R+ew*e.wing*.5,-eh*.16,R+ew*e.wing,-eh*(.28+e.tilt*.8));
    c.lineWidth=eh*e.lash*.65; c.stroke();
  }
  for(let i=0;i<e.lashes;i++){
    const t=.68+i*.13, px=bez(P[0][0],P[1][0],P[2][0],P[3][0],t), py=bez(P[0][1],P[1][1],P[2][1],P[3][1],t);
    c.beginPath(); c.moveTo(px,py);
    c.quadraticCurveTo(px+ew*.05*(1+i*.35),py-eh*.1,px+ew*.08*(1+i*.4),py-eh*(.2+i*.04));
    c.lineWidth=eh*.045; c.stroke();
  }
  c.globalAlpha=.5; c.lineWidth=eh*.035;
  c.beginPath(); c.moveTo(R-ew*.04,eh*.02); c.bezierCurveTo(R-ew*.2,eh*.46,L+ew*.5,eh*.56,L+ew*.3,eh*.46); c.stroke();
  c.globalAlpha=1;
  if(o.aegyo){
    c.lineCap='round';
    c.strokeStyle='rgba(255,240,232,.28)'; c.lineWidth=eh*.11;
    c.beginPath(); c.moveTo(R-ew*.12,eh*.42); c.bezierCurveTo(R-ew*.3,eh*.78,L+ew*.42,eh*.82,L+ew*.2,eh*.6); c.stroke();
    c.strokeStyle=rgba(shade(o.skin,-.3),.22); c.lineWidth=eh*.025;
    c.beginPath(); c.moveTo(R-ew*.14,eh*.6); c.bezierCurveTo(R-ew*.3,eh*.95,L+ew*.42,eh*.98,L+ew*.24,eh*.78); c.stroke();
  }
  if(!o.male){
    c.strokeStyle=rgba(shade(o.skin,-.45),.45); c.lineWidth=eh*.028;
    c.beginPath(); c.moveTo(L+ew*.18,-eh*e.top*.95-eh*.14);
    c.bezierCurveTo(L+ew*.35,-eh*e.top*1.22-eh*.12,R-ew*.28,-eh*e.top*1.22-eh*.1,R-ew*.04,-eh*.36); c.stroke();
  }
  c.restore();
}
function drawBrow(c,cx,cy,dir,e,o){
  const w=e.browW*PX, th=(o.male?e.browT*1.55:e.browT)*PY, a=e.arch;
  c.save(); c.translate(cx,cy); c.scale(dir,1);
  c.beginPath();
  c.moveTo(-w*.5,-th*.45);
  c.quadraticCurveTo(w*.12,-th*1.7*a-th*.4,w*.52,th*.35);
  c.quadraticCurveTo(w*.1,-th*.7*a+th*.5,-w*.5,th*.55);
  c.closePath();
  c.fillStyle=o.brow; c.globalAlpha=.92; c.fill();
  c.restore();
}
function paintFace(c,o){
  const e=EYE_SHAPES[o.eye||'doe'];
  if(o.blush){
    for(const d of [-1,1]){
      const g=c.createRadialGradient(fx(d*.158),fy(.052),2,fx(d*.158),fy(.052),.062*PX);
      g.addColorStop(0,`rgba(255,110,140,${o.blush})`); g.addColorStop(1,'rgba(255,110,140,0)');
      c.fillStyle=g; c.fillRect(0,0,512,512);
    }
  }
  if(o.freckles){
    c.fillStyle=rgba(shade(o.skin,-.4),.55);
    const pts=[[-.13,.07],[-.15,.055],[-.115,.05],[-.165,.075],[-.14,.035],[-.05,.07],[.05,.072]];
    for(const [x,y] of pts) for(const d of [1,-1]){ if(Math.abs(x)<.06&&d<0) continue; c.beginPath(); c.arc(fx(x*d),fy(y),2.6,0,Math.PI*2); c.fill(); }
  }
  for(const d of [-1,1]){
    drawEye(c,fx(d*e.x),fy(e.y),d,e,o);
    drawBrow(c,fx(d*(e.x+.006)),fy(e.y+e.h*.5+.048),d,e,o);
  }
  c.strokeStyle=rgba(shade(o.skin,-.42),.55); c.lineWidth=3.4; c.lineCap='round';
  c.beginPath(); c.moveTo(fx(-.014),fy(.046)); c.quadraticCurveTo(fx(0),fy(.034),fx(.014),fy(.046)); c.stroke();
  c.fillStyle='rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(fx(0),fy(.08),3,9,0,0,Math.PI*2); c.fill();
  const my=fy(o.mouthY??-.008), w=(o.male?.064:.074)*PX, sm=o.smile??1;
  if(o.lips){
    if(o.gradientLips){
      const g=c.createRadialGradient(fx(0),my+w*.05,1,fx(0),my+w*.05,w*.5);
      g.addColorStop(0,o.lips); g.addColorStop(.55,rgba(o.lips,.75)); g.addColorStop(1,rgba(o.lips,0));
      c.fillStyle=g;
    } else c.fillStyle=o.lips;
    c.globalAlpha=.9;
    c.beginPath(); c.ellipse(fx(0),my+w*.15,w*.33,w*.15,0,0,Math.PI*2); c.fill();
    c.beginPath(); c.moveTo(fx(0)-w*.44,my+w*.02);
    c.quadraticCurveTo(fx(0)-w*.16,my-w*.17,fx(0),my-w*.06);
    c.quadraticCurveTo(fx(0)+w*.16,my-w*.17,fx(0)+w*.44,my+w*.02);
    c.quadraticCurveTo(fx(0),my+w*.1,fx(0)-w*.44,my+w*.02); c.fill();
    c.globalAlpha=.55; c.fillStyle='#ffffff';
    c.beginPath(); c.ellipse(fx(0)+w*.08,my+w*.12,w*.09,w*.035,0,0,Math.PI*2); c.fill();
    c.globalAlpha=1;
  }
  c.strokeStyle=o.lips?shade(o.lips,-.5):rgba(shade(o.skin,-.55),.8);
  c.lineWidth=w*.075;
  c.beginPath(); c.moveTo(fx(0)-w*.46,my-w*.03*sm);
  c.quadraticCurveTo(fx(0),my+w*.16*sm,fx(0)+w*.46,my-w*.03*sm); c.stroke();
  if(o.mole){ c.fillStyle=rgba(shade(o.skin,-.6),.8); c.beginPath(); c.arc(fx(.12),fy(.0),2.8,0,Math.PI*2); c.fill(); }
}
const faceMats=new Map();
export function faceMaterial(o){
  const key=JSON.stringify(o);
  if(faceMats.has(key)) return faceMats.get(key);
  const size=o.small?256:512;
  const tex=painted(size,size,(c)=>{ c.scale(size/512,size/512); paintFace(c,o); });
  tex.anisotropy=8;
  const mat=new T.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,roughness:.55,
    polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
  faceMats.set(key,mat);
  return mat;
}

// ——头部：脸型 + 贴花五官 + 发型（long 长卷 / bun 丸子 / pony 高马尾 / bob 短发 / short 男生短发）——
const sideLocks={
  long:d=>[[d*.12,.486,.03],[d*.294,.282,.05],[d*.297,-.004,.094],[d*.349,-.217,.098],[d*.245,-.445,.15]],
  bob:d=>[[d*.12,.486,.03],[d*.3,.28,.05],[d*.322,.02,.08],[d*.3,-.13,.13]],
  bun:d=>[[d*.12,.486,.03],[d*.29,.29,.06],[d*.3,.09,.1],[d*.262,-.05,.14]],
};
sideLocks.pony=sideLocks.bun;
export function buildHead(parent,{skin,hair,face,style='long',scale=[.96,1,.97],y=.985,bow=null,light=false,bangs=null}){
  const head=group(parent,0,y);
  head.scale.set(...scale);
  const cast=!light;
  ball(head,0,.19,-.069,.34,style==='short'?.33:.405,.31,hair,cast);
  mesh(head,cut,hair,0,.235,-.112,.349,.376,.291,cast);
  profile(head,FACE_LEVELS,.89,skin,0,0,.067).castShadow=cast;
  const decal=new T.Mesh(faceGeometry(),faceMaterial({skin,...face}));
  decal.position.set(0,0,.069); decal.scale.set(1.004,1.004,.89*1.004); decal.renderOrder=2;
  head.add(decal);
  if(!light) for(const d of [-1,1]) ball(head,d*.274,.102,.06,.044,.064,.048,skin);
  if(style==='short'){
    hairLock(head,[[.16,.47,.02],[.05,.52,.16],[-.1,.47,.24],[-.24,.36,.22]],.09,.06,hair);
    hairLock(head,[[-.2,.46,.04],[-.06,.53,.15],[.1,.48,.23],[.23,.38,.2]],.08,.05,hair);
    for(const d of [-1,1]) hairLock(head,[[d*.2,.44,.05],[d*.29,.3,.07],[d*.29,.16,.08]],.06,.06,hair);
    return head;
  }
  for(const d of [-1,1]) hairLock(head,sideLocks[style](d),.095,.107,hair);
  const highlight=new T.Color(hair).lerp(new T.Color('#ffc18a'),.17);
  const streak=material('#'+highlight.getHexString(),.02,.51);
  const fringe=bangs==='air'?0:style==='bob'?3:4;
  if(bangs==='air'){
    const rAt=y=>{for(let i=1;i<FACE_LEVELS.length;i++){const [r1,y1]=FACE_LEVELS[i-1],[r2,y2]=FACE_LEVELS[i];if(y<=y2)return r1+(r2-r1)*(y-y1)/(y2-y1);}return 0;};
    const zs=(x,y)=>Math.sqrt(Math.max(0,rAt(y)**2-x*x))*.89+.067+.024;
    for(let i=-4;i<=4;i++){
      const x=i*.04, sway=(i%2?.01:-.007), end=.252+(i%3)*.012+Math.abs(i)*.004;
      const pts=[[x*.7,.47],[x*.95+sway,.4],[x+sway,.32],[x*1.05-sway*.5,end]].map(([px,py])=>[px,py,zs(px,py)]);
      pts[0][2]-=.05;
      hairLock(head,pts,.034,.02,hair);
    }
    for(const d of [-1,1]) hairLock(head,[[d*.16,.44,.16],[d*.235,.33,.2],[d*.255,.2,.18],[d*.25,.07,.16]],.05,.035,hair);
  }
  for(let i=0;i<fringe;i++){
    const h=i*.024;
    hairLock(head,[[.114,.465-h,-.05],[.06,.506-h,.13+h],[-.105,.4-h,.262+h*.3],[-.245,.275-h,.224],[-.285,.12-h,.15]],.048,.038,i===1&&!light?streak:hair);
  }
  hairLock(head,[[.09,.49,.014],[.214,.434,.17],[.29,.27,.16],[.295,.035,.136],[.333,-.16,.148]],.065,.058,hair);
  if(style==='long'){
    for(const d of [-1,1]) hairLock(head,[[d*.08,.38,-.24],[d*.22,.05,-.3],[d*.25,-.32,-.24],[d*.17,-.62,-.12]],.13,.1,hair);
  } else if(style==='bun'){
    ball(head,0,.58,-.16,.17,.16,.17,hair,cast);
    mesh(head,new T.TorusGeometry(.12,.025,8,24),material('#f3c45c',.4,.35),0,.5,-.13,1,1,1,cast).rotation.x=Math.PI/2.6;
  } else if(style==='pony'){
    hairLock(head,[[0,.47,-.24],[0,.36,-.44],[0,.06,-.5],[0,-.32,-.42],[0,-.62,-.32]],.12,.11,hair);
    mesh(head,new T.TorusGeometry(.06,.022,8,20),material('#e94d7c',.1,.4),0,.42,-.33,1,1,1,cast).rotation.x=-.5;
  }
  if(bow){
    const b=group(head,.24,.4,.2); b.rotation.set(.2,.6,-.5);
    for(const d of [-1,1]) ball(b,d*.07,0,0,.075,.05,.03,bow).rotation.z=d*.35;
    ball(b,0,0,.01,.03,.034,.03,shade(bow,-.2));
  }
  return head;
}

function headSpec({skin='#dc9c7f', hair='#79432e', eyes='#526f61', face={}, style='long', bow=null, bangs=null}={}) {
  return {skin,hair,style,bow,bangs,face:{iris:eyes,lash:'#2a1512',brow:shade(hair,-.25),...face}};
}
// 头像：给吐司和排行榜用，和 3D 人物共用同一张脸部纹理
export function portraits(looks, size=96) {
  const scene=new T.Scene(), cam=new T.PerspectiveCamera(30,1,.01,20);
  const r=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  r.setSize(size,size); r.outputColorSpace=T.SRGBColorSpace;
  r.toneMapping=T.ACESFilmicToneMapping; r.toneMappingExposure=1.2;
  scene.add(new T.HemisphereLight(0xfff4fb,0xb7a3c9,2.4));
  const key=new T.DirectionalLight(0xffeadd,2.2); key.position.set(-1,2,3); scene.add(key);
  cam.position.set(0,.2,1.75); cam.lookAt(0,.19,0);
  const out=looks.map(look=>{
    const g=new T.Group(); scene.add(g);
    buildHead(g,{...headSpec(look),y:0,scale:[1,1,1]});
    r.render(scene,cam);
    const url=r.domElement.toDataURL();
    scene.remove(g);
    return url;
  });
  r.dispose(); r.forceContextLoss();
  return out;
}

export function model(parent, look={}) {
  const {skin='#dc9c7f'}=look;
  const root = group(parent);
  const body = group(root,0,1.48);
  const head = buildHead(body,headSpec(look));
  rod(body,[0,.746,0],[0,1.0,.013],.082,skin);
  profile(body,[[0,.47],[.24,.49],[.328,.60],[.29,.665],[.17,.715],[.111,.792],[0,.80]],.62,skin);
  const arms = [-1,1].map(d=>{
    const limb=group(body,d*.351,.625,.008);
    const elbow = [d*.126,-.417,.026];
    const upper=profile(limb,[[.056,-.419],[.072,-.30],[.086,-.12],[.075,-.018],[.028,.025]],.96,skin);
    upper.rotation.z=d*.29;
    const fore=profile(limb,[[.040,-.334],[.044,-.23],[.066,-.095],[.059,0]],.95,skin,...elbow);
    fore.rotation.x=-.24;
    ball(limb,...elbow,.060,.064,.060,skin);
    ball(limb,d*.14,-.766,.105,.067,.102,.05,skin);
    return limb;
  });
  const feet = [-1,1].map(d=>{
    const limb=group(root,d*.157,1.49,0);
    profile(limb,[[.052,-1.40],[.047,-1.32],[.068,-1.10],[.094,-.91],[.083,-.76],[.077,-.67],[.092,-.54],[.125,-.30],[.133,-.04],[.104,.01]],.96,skin,d*.026);
    return {limb,shoe:group(limb,d*.04,-1.49,0)};
  });
  const attire = group(body), accessory = group(arms[1],.159,-.91,.115);
  const defaults = {
    clothes:{type:'dress',color:'#f5f0f0',detail:'#ac80bb'},
    shoes:{type:'pumps',color:'#8d6da0',detail:'#fff0d9'},
    bag:null,
  };
  let lastLook={};
  function equip(look) {
    if (lastLook.clothes !== look.clothes || !attire.children.length) {
      attire.clear();
      clothing(attire,look.clothes || defaults.clothes);
    }
    if (lastLook.shoes !== look.shoes || !feet[0].shoe.children.length) {
      for (const part of feet) {
        part.shoe.clear();
        shoe(part.shoe,look.shoes || defaults.shoes);
      }
    }
    if (lastLook.bag !== look.bag) {
      accessory.clear();
      if (look.bag) handbag(accessory,look.bag);
    }
    lastLook={...look};
  }
  equip({});
  return {
    root,equip,
    // wave：右手举高比耶（走秀第三拍）
    animate(now, stride=0, pose=0, wave=0) {
      const gait=Math.sin(now*10);
      const sway=Math.sin(now*1.65);
      feet[0].limb.rotation.x=gait*stride + pose*.08;
      feet[1].limb.rotation.x=-gait*stride - pose*.07;
      arms[0].rotation.x=-gait*stride*.68;
      arms[1].rotation.x=gait*stride*.68;
      arms[0].rotation.z= -.09-sway*.032-pose*.30;
      arms[1].rotation.z= .09+sway*.025+pose*.12;
      body.rotation.z=sway*.023 + pose*.059;
      body.rotation.x=0;
      body.position.y=1.48+Math.abs(gait)*stride*.095;
      head.rotation.y=sway*.11 - pose*.19;
      if(wave){
        arms[1].rotation.z+=wave*2.5;
        arms[1].rotation.x-=wave*.35;
        head.rotation.z=-wave*.12;
      } else head.rotation.z=0;
    },
    // 走秀 POSE：rl/rr 手臂向外抬，fl/fr 手臂向前抬，kl/kr 踢腿，bx/bz 身体前倾/侧弯，hy/hz 转头/歪头
    addPose(p,k=1){
      if(!k) return;
      arms[0].rotation.z-=(p.rl||0)*k; arms[1].rotation.z+=(p.rr||0)*k;
      arms[0].rotation.x-=(p.fl||0)*k; arms[1].rotation.x-=(p.fr||0)*k;
      feet[0].limb.rotation.x-=(p.kl||0)*k; feet[1].limb.rotation.x-=(p.kr||0)*k;
      body.rotation.x+=(p.bx||0)*k; body.rotation.z+=(p.bz||0)*k;
      head.rotation.y+=(p.hy||0)*k; head.rotation.z+=(p.hz||0)*k;
    },
  };
}

function rack(parent,x,z,items) {
  rod(parent,[x-.78,.12,z],[x-.78,2.22,z],.035,brass);
  rod(parent,[x+.78,.12,z],[x+.78,2.22,z],.035,brass);
  rod(parent,[x-.78,2.16,z],[x+.78,2.16,z],.035,brass);
  box(parent,x,.15,z,1.74,.20,.52,'#b475a9');
  items.forEach((item,i)=>{
    const nx=x+(i-1)*.48;
    rod(parent,[nx,2.13,z],[nx,1.97,z],.015,brass);
    const piece=clothing(parent,item,1.69,z);
    piece.position.x=nx;
    piece.scale.setScalar(.44);
    piece.rotation.y=.24;
  });
}

function decorPlant(parent,x,z) {
  column(parent,x,.22,z,.28,.46,.28,'#f3a3ad');
  column(parent,x,.46,z,.30,.12,.30,brass);
  for (let i=0;i<7;i++) {
    const a=i*2.4;
    const leaf=ball(parent,x+Math.cos(a)*.16,.64+i*.065,z+Math.sin(a)*.16,.09,.31,.087,i%2 ? '#43a27e' : '#82bc87');
    leaf.rotation.z=Math.cos(a)*.7;
  }
}

function drape(parent,x,z,color,direction) {
  const positions=[],indices=[];
  const cols=28,rows=20;
  for(let row=0;row<=rows;row++){
    const t=row/rows;
    const knot=Math.exp(-Math.pow((t-.36)/.19,2));
    const width=.59-knot*.35;
    for(let c=0;c<=cols;c++){
      const u=c/cols-.5;
      positions.push(x+direction*(u*width+knot*.16),.29+t*2.89,z+Math.cos(u*6*Math.PI*2)*(.068-knot*.04));
      if(row<rows&&c<cols){
        const a=row*(cols+1)+c;
        indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);
      }
    }
  }
  const ge=new T.BufferGeometry();
  ge.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  ge.setIndex(indices);
  ge.computeVertexNormals();
  mesh(parent,ge,new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.76}),0,0,0);
  rod(parent,[x-.41,3.20,z],[x+.42,3.20,z],.029,brass);
  ball(parent,x+direction*.16,1.33,z+.061,.126,.048,.034,brass);
  ball(parent,x+direction*.16,1.25,z+.080,.033,.072,.031,brass);
}

const storefronts = {
  clothes:{name:'PETAL HOUSE',tag:'FASHION',trim:'#e575b5',floor:'#f6aabf',back:'#6f4f9f',accent:'#b83c82'},
  shoes:{name:'SOLE STUDIO',tag:'FOOTWEAR',trim:'#5fc4df',floor:'#8edfe6',back:'#477aa6',accent:'#267ba1'},
  bag:{name:'CHARM ROOM',tag:'ACCESSORIES',trim:'#ac83e7',floor:'#d3a6ef',back:'#7659a9',accent:'#78419f'},
  show:{name:'STAR STAGE',tag:'RUNWAY',trim:'#db73d2',floor:'#eea0d2',back:'#6a427e',accent:'#8c326f'},
};

const marble = material('#e9f5fa',.07,.44);
const glassTrim = material('#acd5e8',.26,.44);
const darkBeam = material('#795aa4',.15,.45);
const glass = material('#b4effa',.26,.27);
const displayWindows=[
  {kind:'clothes',wide:[-3.77,1.64],phone:[-1.36,3.29]},
  {kind:'shoes',wide:[-1.26,1.82],phone:[1.36,3.29]},
  {kind:'bag',wide:[1.26,1.64],phone:[-1.36,1.00]},
  {kind:'show',wide:[3.77,1.82],phone:[1.36,1.00]},
];

function packets(parent,x,y,z,tint) {
  const p=group(parent,x,y,z);
  p.rotation.y=.14+x*.07;
  box(p,0,.19,0,.3,.38,.18,tint);
  box(p,0,.353,.088,.30,.037,.02,'#fff1c6');
  mesh(p,new T.TorusGeometry(.069,.011,8,22,Math.PI),brass,0,.381,0,1,.65,1);
}

function windowDisplay(parent,spec,x,y,w,h) {
  const shop=storefronts[spec];
  const room=group(parent,x,y,0);
  box(room,0,0,-.88,w,h,.18,glassTrim);
  box(room,0,0,-.765,w-.22,h-.29,.11,shop.back);
  box(room,0,-h*.48,-.19,w,.13,1.34,marble);
  box(room,0,-h*.442,-.244,w-.25,.04,1.14,shop.floor);
  for(const d of [-1,1]){
    box(room,d*(w/2-.056),0,.32,.114,h,.17,marble);
    box(room,d*(w/2-.079),-.05,-.21,.09,h-.29,.98,shop.trim);
    box(room,d*.37,h*.36,-.14,.17,.041,.19,'#fff4bd',false);
  }
  box(room,0,h*.462,.30,w,.095,.21,marble);
  box(room,0,h*.39,.24,w-.14,.055,.13,brass);
  sign(room,shop.name,0,h*.36,.41,w-.32,h*.178,{ground:shop.accent,ink:'#fff1ea',small:shop.tag});
  const floor=-h*.39;
  if(spec==='clothes'){
    for(const d of [-1,1]){
      const gx=d*w*.22;
      const dress=wardrobe.clothes[d<0 ? 0 : 1];
      const scale=h*.265;
      const waist=floor+(dress.type==='gown' ? 1.16 : .72)*scale+.05;
      column(room,gx,floor,.10,.24,.067,.21,brass);
      rod(room,[gx,floor,.10],[gx,floor+.55,.10],.035,brass);
      const item=clothing(room,dress,waist,.10);
      item.position.x=gx;
      item.scale.setScalar(scale);
      item.rotation.y=d*.22;
      ball(room,gx,waist+scale*.84,.10,.083,.109,.08,'#f4ddf6');
    }
  } else if (spec==='shoes'){
    for(let i=0;i<3;i++){
      const x2=(i-1)*w*.24, height=floor+.19+i*.16;
      box(room,x2,height-.06,-.032,w*.22,.13+i*.055,.43,shop.trim);
      const item=shoe(room,wardrobe.shoes[i],x2,height+.06,.045);
      item.scale.setScalar(h*.57);
      item.rotation.y=-.57+i*.26;
    }
    box(room,0,.01,-.515,w*.62,.038,.18,brass);
  } else if(spec==='bag'){
    for(let i=0;i<3;i++){
      const gx=(i-1)*w*.251;
      const lift= i===1 ? .38 : .19;
      column(room,gx,floor+lift/2,.015,.253,lift,.216,i===1 ? shop.trim : marble);
      const item=handbag(room,wardrobe.bag[i],gx,floor+lift+.17,.015);
      item.scale.setScalar(h*.56);
      item.rotation.y=(i-1)*.26;
    }
  } else {
    column(room,0,floor+.095,.04,.63,.19,.40,'#d558a3');
    column(room,0,floor+.214,.04,.46,.06,.31,'#f3c5ed');
    column(room,0,floor+.31,.08,.176,.14,.14,brass);
    profile(room,[[0,0],[.095,.04],[.12,.22],[.29,.43],[.32,.58],[.274,.63],[.255,.58]],.73,brass,0,floor+.36,.08);
    for(const d of [-1,1]){
      const handle=mesh(room,new T.TorusGeometry(.16,.026,8,20),brass,d*.23,floor+.76,.08,.72,1.2,1);
      handle.rotation.z=d*.12;
      mesh(room,diamond,'#fff0b3',d*.48,floor+.69,.014,.049,.123,.064);
    }
  }
  for(const d of [-1,1]){
    const stripe=box(room,d*w*.385,.16,.38,.025,h*.48,.018,glass,false);
    stripe.rotation.z=-d*.16;
  }
  return {kind:spec, anchor:new T.Vector3(x,y,.49), width:w,height:h};
}

export function mallFront(scene,mobile) {
  const root=group(scene);
  box(root,0,-.15,1.6,22,.27,13,'#c8eff4');
  for(let x=-8;x<=8;x++)for(let z=-2;z<=6;z++){
    if((x+z)%2===0)box(root,x,.002,z,.98,.012,.98,'#a5d4de',false);
  }
  const roofY=mobile ? 4.67 : 3.77;
  const width=mobile ? 6.60 : 11.6;
  box(root,0,roofY/2,-1.22,width,roofY,.43,marble);
  box(root,0,roofY-.03,-.275,width+.28,.28,1.61,darkBeam);
  box(root,0,roofY+.23,-.327,width+.44,.20,1.29,marble);
  box(root,0,roofY-.20,.48,width+.45,.058,.20,'#ffcfdf');
  box(root,0,.118,.37,width+.84,.24,1.56,marble);
  box(root,0,.039,1.25,width+1.1,.09,.32,'#a1c5df');
  const meta=displayWindows.map(spec=>{
    const [x,y]=mobile ? spec.phone : spec.wide;
    const h=mobile ? 2.18 : spec.kind==='shoes' ? 2.94 : 2.60;
    return windowDisplay(root,spec.kind,x,y,mobile ? 2.38 : 2.29,h);
  });
  const titleY=mobile ? 4.91 : 4.04;
  sign(root,'OPAL MALL',0,titleY+.13,.65,mobile ? 3.54 : 4.21,.42,{ground:'#693b98',ink:'#fff3cf'});
  for(const d of [-1,1]){
    const x=d*(mobile?2.75:5.18);
    box(root,x,roofY*.49,.19,.22,roofY,.28,glassTrim);
    box(root,x,.29,.38,.29,.12,.33,marble);
    decorPlant(root,d*(mobile?2.17:5.16),1.19);
    for(let i=0;i<3;i++)packets(root,d*(mobile?1.61+i*.315:4.21+i*.325),.03,1.52+i*.17,['#df5395','#65bde0','#f5b95e'][i]);
  }
  const backdrop=mesh(root,new T.PlaneGeometry(70,24),new T.MeshBasicMaterial({color:'#addff4',toneMapped:false}),0,4,-9,1,1,1,false);
  backdrop.receiveShadow=false;
  for(let i=0;i<9;i++){
    const x=(i-4)*3.9;
    const cloud=ball(root,x,5.22+.45*(i%3),-7,1.3,.31,.19,'#e2f6ff',false);
    cloud.material=new T.MeshBasicMaterial({color:'#e7f8fe',toneMapped:false});
  }
  root.visible=false;
  return {root,meta};
}

export function boutique(scene) {
  const root=group(scene);
  const ice='#ffe5d2', wall='#dfaeae', blush='#d778ae', white='#fff1ea';
  box(root,0,-.13,-.7,18,.24,15,'#e5b29a');
  for (let x=-7;x<=7;x++) for (let z=-6;z<=5;z++) {
    if ((x+z)%2===0) box(root,x,.001,z,.99,.012,.99,ice,false);
  }
  box(root,0,2.42,-3.5,14,4.86,.28,wall);
  box(root,0,4.58,-3.26,13.9,.46,.45,blush);
  box(root,0,4.32,-3.23,13.8,.075,.38,brass);
  for (const x of [-6.8,-3.62,3.62,6.8]) {
    box(root,x,2.12,-3.2,.25,4.31,.25,white);
    box(root,x,.13,-3.14,.37,.24,.32,brass);
  }
  for (const [x,name,tone] of [[-5.32,'SOLE STUDIO','#9fc9ef'],[0,'PETAL HOUSE','#d86ea8'],[5.32,'CHARM ROOM','#ad8dda']]) {
    const width=x ? 2.72 : 6.36;
    box(root,x,2.12,-3.27,width,3.24,.18,tone);
    box(root,x,2.2,-3.145,width-.21,2.57,.08,x ? '#dbc3ec' : '#f4bfd8');
    for (const dx of [-1,1]) box(root,x+dx*(width*.5-.06),2.06,-3.05,.055,2.89,.14,brass);
    sign(root,name,x,3.78,-3.03,width-.19,.50,{ground:x ? '#402957' : '#8d3673',ink:'#ffedeb',small:x ? 'BLACK FRIDAY' : 'FASHION ATELIER'});
  }
  for (const x of [-1.4,0,1.4]) {
    box(root,x,2.45,-3.05,.90,2.08,.11,'#b663a4');
    ball(root,x,3.46,-3.04,.454,.36,.067,'#b663a4');
    box(root,x,2.40,-2.98,.75,1.93,.08,'#f8d8e8');
    ball(root,x,3.36,-2.97,.378,.31,.062,'#f8d8e8');
  }
  rack(root,-2.43,-1.75,wardrobe.clothes);
  rack(root,2.43,-1.75,wardrobe.clothes.slice().reverse());
  drape(root,-1.77,-2.35,'#bc4784',1);
  drape(root,1.77,-2.35,'#bc4784',-1);
  for (const d of [-1,1]) {
    const x=d*4.52;
    box(root,x,.72,-2.18,1.69,1.44,.73,'#9675b3');
    for (let i=0;i<3;i++) {
      box(root,x,.43+i*.44,-1.75,1.54,.055,.82,pearl);
      const item=d<0 ? shoe(root,wardrobe.shoes[i],x,.46+i*.44,-1.48) : handbag(root,wardrobe.bag[i],x,.61+i*.44,-1.49);
      item.scale.setScalar(1.22);
      item.rotation.y=d*.18;
    }
    decorPlant(root,d*3.63,-1.4);
    box(root,d*2.78,.43,1.58,.88,.20,.83,'#eeb1d7');
    column(root,d*2.78,.188,1.58,.28,.30,.28,brass);
  }
  column(root,0,.038,0,1.24,.076,1.21,'#a863a6');
  column(root,0,.093,0,1.18,.052,1.15,'#f6c9ea');
  ring(root,0,.13,0,1.075,.015,'#fff3d5');
  const banner=sign(root,'SALE',3.28,2.91,-2.49,1.18,.49,{ground:'#d43782',ink:'#fff6e1',small:'BLACK FRIDAY'});
  banner.rotation.z=-.09;
  return root;
}

export function specialtyShop(scene, category) {
  const isShoes=category==='shoes';
  const colors=isShoes
    ? {wall:'#b4cae8', edge:'#7d99ca', niche:'#91acda', trim:'#d9ecfb', floor:'#dae8f2', title:'#385c8a'}
    : {wall:'#f0becc', edge:'#c782a5', niche:'#dba3c5', trim:'#fce6dd', floor:'#efd4dc', title:'#8c3e6f'};
  const room=group(scene);
  box(room,0,-.10,-.4,16,.20,14,colors.floor);
  for(let ix=-8;ix<=8;ix++){
    for(let iz=-6;iz<=5;iz++){
      if((ix+iz)%2===0)box(room,ix,.004,iz,.984,.013,.984,colors.trim,false);
    }
  }
  box(room,0,2.37,-3.6,14.2,4.77,.34,colors.wall);
  box(room,0,4.36,-3.39,14,.54,.39,colors.edge);
  box(room,0,4.10,-3.17,13.9,.049,.08,brass);
  sign(room,isShoes ? 'SOLE STUDIO' : 'CHARM ROOM',0,3.79,-3.32,5.61,.59,{ground:colors.title,ink:'#fff2df',small:isShoes ? 'FOOTWEAR' : 'BAGS & ACCESSORIES'});
  for(const x of [-5.2,-2.44,0,2.44,5.2]){
    box(room,x,1.71,-3.28,1.91,2.79,.235,colors.niche);
    box(room,x,1.54,-3.13,1.68,2.64,.032,colors.trim);
    ball(room,x,2.83,-3.134,.834,.321,.06,colors.trim,false);
    if (x===0) {
      box(room,0,1.66,-3.02,1.11,2.28,.070,brass);
      box(room,0,1.68,-2.979,.99,2.13,.022,material(isShoes?'#b4d1f6':'#d6b6e1',.58,.25));
      continue;
    }
    for(let row=0;row<3;row++){
      const y=.65+row*.68;
      box(room,x,y,-2.93,1.64,.075,.52,brass);
      const item=wardrobe[category][(row+(x<0?0:1))%3];
      for(const dx of [-.27,.25]){
        const part=isShoes ? shoe(room,item,x+dx,y+.05,-2.76) : handbag(room,item,x+dx,y+.21,-2.74);
        part.scale.setScalar(1.19);
        part.rotation.y=dx*.76;
      }
    }
  }
  for(const d of [-1,1]){
    decorPlant(room,d*3.69,-.74);
    column(room,d*2.55,.47,.72,.45,.91,.45,colors.edge);
    column(room,d*2.55,.93,.72,.46,.095,.46,pearl);
    const mark=isShoes ? shoe(room,wardrobe.shoes[d+1],d*2.55,1,.72) : handbag(room,wardrobe.bag[d+1],d*2.55,1.21,.72);
    mark.scale.setScalar(1.7);
    mark.rotation.y=d*.28;
  }
  column(room,0,.062,0,1.23,.125,1.21,colors.edge);
  column(room,0,.127,0,1.19,.045,1.18,colors.trim);
  ring(room,0,.155,0,1.085,.014,'#fff1d2');
  room.visible=false;
  return room;
}

// ——观众：坐在两侧看台上的真人，有脸、有发型，头跟着走秀的人转，有人鼓掌、有人举手机拍——
const CROWD_SKIN=['#f3cdb3','#e8b392','#d39a76','#b37a58','#8a5a3f','#5f3b2a'];
const CROWD_HAIR=['#1b1314','#2f1d16','#4a2c1d','#6e4429','#a87b4f','#d7b47a','#7a7a82','#5b2620'];
const CROWD_TOP=['#2f3b55','#767c8a','#c8b79e','#25272e','#ebe6dd','#4b6d8f','#8d3b4a','#5b6b4a','#b8577a','#e0a33c'];
const CROWD_PANTS=['#262b38','#3c4a63','#4a4038','#1d1d22','#5f5348'];
const CROWD_IRIS=['#3a2418','#563620','#2d4a5c','#4a5a2e','#2b1c14'];
const CROWD_LIPS=['#c65a6e','#d77380','#b84d5d','#c96a5d'];
const flashGeo=new T.SphereGeometry(.035,10,8), flashMat=new T.MeshBasicMaterial({color:'#ffffff'});
function spectator(root,x,y,z,facing,rng){
  const pick=list=>list[Math.floor(rng()*list.length)];
  const male=rng()<.42;
  const skin=pick(CROWD_SKIN), hair=pick(CROWD_HAIR), top=pick(CROWD_TOP), pants=pick(CROWD_PANTS);
  const g=group(root,x,y,z);
  g.rotation.y=facing;
  for(const d of [-1,1]){
    box(g,d*.1,.5,.13,.14,.13,.36,pants,false);
    box(g,d*.1,.27,.3,.12,.44,.13,pants,false);
    ball(g,d*.1,.06,.36,.068,.05,.11,'#1c1b22',false);
  }
  profile(g,[[0,0],[.16,.01],[.18,.18],[.205,.36],[.19,.43],[.09,.47],[0,.48]],.7,top,0,.47,0).castShadow=false;
  column(g,0,.98,.01,.052,.12,.05,skin,false);
  const face={eye:'plain',small:true,male,skin,iris:pick(CROWD_IRIS),lash:'#1e1210',brow:shade(hair,-.3),
    lips:male?null:pick(CROWD_LIPS),blush:male?0:.22,smile:pick([.2,.7,1]),freckles:rng()<.15,mole:rng()<.12};
  const style=male?'short':pick(['bob','pony','long','bun']);
  const head=buildHead(g,{skin,hair,style,face,scale:[.55,.58,.55],y:1.04,light:true});
  const mode=rng()<.38?'phone':rng()<.6?'clap':'lap';
  const fore=[];
  let flash=null;
  for(const s of [-1,1]){
    const shoulder=[s*.19,.87,0], elbow=[s*.22,.65,.07];
    rod(g,shoulder,elbow,.046,top).castShadow=false;
    const f=group(g,...elbow);
    let dir=[-s*.07,-.05,.22];
    if(mode==='clap') dir=[-s*.13,.13,.17];
    if(mode==='phone'&&s===1) dir=[-.06,.25,.13];
    rod(f,[0,0,0],dir,.038,top).castShadow=false;
    ball(f,...dir,.042,.048,.042,skin,false);
    if(mode==='phone'&&s===1){
      const p=group(f,dir[0],dir[1]+.06,dir[2]+.02);
      p.rotation.x=-.25;
      box(p,0,0,0,.075,.14,.012,'#17161d',false);
      mesh(p,new T.PlaneGeometry(.062,.122),new T.MeshBasicMaterial({color:'#cfe9ff'}),0,0,-.0075,1,1,1,false).rotation.y=Math.PI;
      flash=mesh(p,flashGeo,flashMat,.02,.05,.012,1,1,1,false);
      flash.visible=false;
    }
    fore.push({f,s});
  }
  return {g,head,fore,mode,flash,phase:rng()*6,x,z,facing};
}

export function runwaySet(scene) {
  const root=group(scene);
  box(root,0,-.22,0,20,.42,16,'#392657');
  box(root,0,2.22,-4.5,15,4.5,.36,'#503069');
  for (let i=-7;i<=7;i++) {
    const color=i%3===0 ? '#bb4e91' : '#754397';
    box(root,i,.0,-4.26,.66,8.1,.10,color,false);
  }
  box(root,0,.076,.33,3.12,.16,8.45,'#d94b9b');
  const crowd=[];
  for (const d of [-1,1]) {
    box(root,d*1.51,.108,.33,.064,.14,8.45,'#fbe3a9',false);
    box(root,d*3.45,.2,.33,.95,.4,8.6,'#2a1b3d',false);
    box(root,d*2.62,.2,.33,.5,.4,8.6,'#33224a',false);
    box(root,d*3.55,.615,.33,.42,.43,8.6,'#33224a',false);
    const random=seeded(42+d);
    for (let j=0;j<16;j++) {
      const row=j%2;
      const x=d*(2.55+row*.88+random()*.06);
      const z=-3.6+Math.floor(j/2)*.98+random()*.1;
      crowd.push(spectator(root,x,row?.4:0,z,d<0?Math.PI/2:-Math.PI/2,random));
    }
  }
  sign(root,'STYLE NIGHT',0,3.89,-4.12,5.25,.76,{ground:'#572a78',ink:'#ffeab7',small:'BLACK FRIDAY RUNWAY'});
  ring(root,0,.167,1.42,.93,.018,'#ffe5bd');
  const glitter=Array.from({length:26},(_,i)=>mesh(root,diamond,new T.MeshBasicMaterial({color:i%3 ? '#ffdd9f' : '#fad2f6'}),0,0,0,.027,.058,.027,false));
  root.visible=false;
  // cheer 0..1：摆 POSE 后观众一阵欢呼——鼓掌加速、点头、手机闪光灯此起彼伏
  function animateCrowd(t,heroZ,cheer=0){
    for(const p of crowd){
      const yaw=Math.atan2(-p.x,heroZ-p.z)-p.facing;
      const look=Math.max(-1.1,Math.min(1.1,Math.atan2(Math.sin(yaw),Math.cos(yaw))));
      p.head.rotation.y+= (look-p.head.rotation.y)*.12;
      p.head.rotation.x=Math.sin(t*1.3+p.phase)*.04 - cheer*Math.abs(Math.sin(t*9+p.phase))*.12;
      if(p.mode==='clap') for(const {f,s} of p.fore) f.rotation.y=s*(.1+(.12+cheer*.06)*Math.sin(t*(13+cheer*9)+p.phase));
      if(p.mode==='phone'){
        p.fore[1].f.rotation.x=Math.sin(t*.9+p.phase)*.06;
        p.flash.visible=cheer>.05 && Math.sin(t*23+p.phase*7)>.55;
      }
      if(p.mode==='lap') for(const {f,s} of p.fore) f.rotation.x=-cheer*.9*(.6+.4*Math.sin(t*11+p.phase));
    }
  }
  return {root,glitter,animateCrowd};
}

export function catalogImages(source=wardrobe) {
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(33,1,.01,50);
  const r=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  r.setSize(120,120);
  r.setClearColor(0,0);
  r.outputColorSpace=T.SRGBColorSpace;
  scene.add(new T.HemisphereLight(0xfffaff,0xcab4e0,2.1));
  const light=new T.DirectionalLight(0xffdfce,2.9);
  light.position.set(3,6,4);
  scene.add(light);
  const output={};
  for (const [category,items] of Object.entries(source)) {
    for (const item of items) {
      let obj,focus;
      if(category==='clothes') {
        obj=clothing(scene,item);
        focus=new T.Vector3(0,item.type==='gown' ? -.18 : 0,0);
        camera.position.set(1.43,.67,3.8);
      } else if (category==='shoes') {
        obj=shoe(scene,item);
        focus=new T.Vector3(0,.12,.062);
        camera.position.set(.61,.38,.65);
      } else {
        obj=handbag(scene,item);
        focus=new T.Vector3(0,.03,0);
        camera.position.set(.21,.25,.73);
      }
      camera.lookAt(focus);
      r.render(scene,camera);
      output[item.id]=r.domElement.toDataURL();
      obj.removeFromParent();
    }
  }
  r.dispose();
  r.forceContextLoss();
  return output;
}
