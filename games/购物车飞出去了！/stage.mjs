import * as T from './vendor/three.module.js';
import {CAR_ROOF} from './rules.mjs';



const pool=new Map();
const signs=new Map();
function mat(color,metalness=0,roughness=.72) {
  const key=`${color}/${metalness}/${roughness}`;
  if(!pool.has(key))pool.set(key,new T.MeshStandardMaterial({color,metalness,roughness}));
  return pool.get(key);
}
const cube=new T.BoxGeometry(1,1,1);
const sphere=new T.SphereGeometry(1,20,14);
const roundShape=new T.CylinderGeometry(1,1,1,24);
const ridgeShape=new T.IcosahedronGeometry(1,2);
const pennant=new T.Shape();pennant.moveTo(-.16,0);pennant.lineTo(.16,0);pennant.lineTo(0,-.30);pennant.closePath();
const pennantGeometry=new T.ShapeGeometry(pennant);
const rounded=new Map();
const themes=[
  {sky:'#3ba4e3',horizon:'#d4f4e9',fog:0xb2e6ea, pavement:0xf4ce91, grass:0x70ba48, verge:0xa6d852, road:0x405878,
    fronts:[0xf4c052,0xefa15e,0x35adc1,0xe97c56], trim:[0x1d6b96,0x176c86,0x195884,0xb44947], flags:[0xff8866,0xffd547,0x26afbb],
    rails:0xffce55,deck:0xf26745,deep:0xb45440,trees:[0x287c62,0x55af62,0x9cce54], signs:['MARKET','PICK UP','FLASH SALE'],cloud:0xf7fcf4},
  {sky:'#259eb9',horizon:'#d0f4dd',fog:0xa7dccc,pavement:0xe7cf9d,grass:0x82bd62,verge:0xb0d97f,road:0x4a6172,
    fronts:[0xb99663,0xe7bd73,0x64b3ab,0x997354],trim:[0x694834,0x356b6e,0x336e6b,0x615040],flags:[0xfdb250,0x58bcab,0xfff0b5],
    rails:0xffd85b,deck:0x35ae9b,deep:0x227f7d,trees:[0x197d69,0x359d7b,0x79bb67],signs:['DEPOT','QUICK LOAD','PACK & GO'],cloud:0xf1faf1},
  {sky:'#5157ae',horizon:'#ef9dba',fog:0xb9a7d2,pavement:0x9d86ae,grass:0x7594a7,verge:0x8eb4af,road:0x3a496a,
    fronts:[0x535ba3,0x7b79bb,0x237f9d,0xb7709d],trim:[0x234a77,0x4a437e,0x246474,0x743b7b],flags:[0x75ebd5,0xffcb65,0xf987af],
    rails:0x7af9df,deck:0x696cdb,deep:0x3e4fa3,trees:[0x3a646f,0x578d7a,0x8eb89c],signs:['NIGHT MARKET','PICK UP','CLOSING SOON'],cloud:0xf6c9e0},
];
function mesh(g,shape,paint,x=0,y=0,z=0) {
  const m=new T.Mesh(shape,paint);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
function box(g,w,h,d,c,x=0,y=0,z=0) {const m=mesh(g,cube,mat(c),x,y,z);m.scale.set(w,h,d);return m;}
function oval(g,w,h,d,c,x=0,y=0,z=0) {const m=mesh(g,sphere,mat(c),x,y,z);m.scale.set(w,h,d);return m;}
function cylinder(g,r,h,c,x=0,y=0,z=0) {const m=mesh(g,roundShape,mat(c,.22,.42),x,y,z);m.scale.set(r,h,r);return m;}
function molded(g,w,h,d,r,c,x=0,y=0,z=0) {
  const key=[w,h,d,r].join('/');
  if(!rounded.has(key)) {
    const a=w/2-r,b=h/2-r;
    const shape=new T.Shape();shape.moveTo(-a,-b);shape.lineTo(a,-b);shape.lineTo(a,b);shape.lineTo(-a,b);shape.closePath();
    const geometry=new T.ExtrudeGeometry(shape,{depth:d-2*r,steps:1,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:3});
    geometry.translate(0,0,-d/2+r);rounded.set(key,geometry);
  }
  return mesh(g,rounded.get(key),mat(c,.08,.39),x,y,z);
}
function rod(g,a,b,r,c) {
  const p=new T.Vector3(...a),q=new T.Vector3(...b);
  const center=p.clone().lerp(q,.5);
  const m=cylinder(g,r,p.distanceTo(q),c,center.x,center.y,center.z);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());
  return m;
}

function sign(g,text,tone,x,y,z,w,h) {
  const key=`${text}/${tone}`;
  if(!signs.has(key)) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=120;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#ffedaa';ctx.fillRect(0,0,512,120);
    ctx.fillStyle=tone;ctx.fillRect(7,7,498,106);ctx.fillStyle='#fff5d4';
    ctx.font='900 70px "Arial Black",Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,63,452);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    signs.set(key,new T.MeshBasicMaterial({map}));
  }
  const m=mesh(g,new T.PlaneGeometry(w,h),signs.get(key),x,y,z);
  m.castShadow=false;return m;
}

function batchScenery(group,moving) {
  const groups=new Map();
  for(const child of group.children) {
    if(moving.has(child)||![cube,sphere,roundShape,ridgeShape,pennantGeometry].includes(child.geometry))continue;
    const key=`${child.geometry.id}/${child.material.id}/${child.castShadow}`;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(child);
  }
  for(const instances of groups.values()) {
    if(instances.length<3)continue;
    const sample=instances[0];
    const merged=new T.InstancedMesh(sample.geometry,sample.material,instances.length);
    merged.castShadow=sample.castShadow;merged.receiveShadow=sample.receiveShadow;
    for(const [index,child] of instances.entries()){
      child.updateMatrix();merged.setMatrixAt(index,child.matrix);group.remove(child);
    }
    merged.instanceMatrix.needsUpdate=true;group.add(merged);
  }
}

function makeSky(theme) {
  const canvas=document.createElement('canvas');canvas.width=16;canvas.height=256;
  const ctx=canvas.getContext('2d');const gradient=ctx.createLinearGradient(0,0,0,256);
  gradient.addColorStop(0,theme.sky);gradient.addColorStop(.82,theme.horizon);gradient.addColorStop(1,theme.horizon);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,16,256);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return map;
}

function scenery(scene,index,offset=0) {
  const theme=themes[index];
  const background=new T.Group();scene.add(background);background.position.x=offset;
  box(background,79.05,.30,65,theme.grass,20.55,-.21,-10);
  box(background,79.05,.055,6.0,theme.road,20.55,-.035,.1);
  box(background,79.05,.15,.18,0xffe3a3,20.55,.039,-3.02);
  box(background,79.05,.15,.18,0xffe3a3,20.55,.039,3.14);
  box(background,79.05,.065,3.8,theme.pavement,20.55,-.015,-5.03);
  box(background,79.05,.065,2.55,theme.pavement,20.55,-.015,4.48);
  box(background,79.05,.012,1.7,theme.verge,20.55,-.034,6.66);
  for(let x=-18.9;x<60;x+=2.3) {
    box(background,1.37,.014,.089,0xffffdb,x,-.004,2.17);
    box(background,1.37,.014,.076,0xffffdb,x,-.004,-2.25);
    for(const z of [3.62,5.28,-3.73,-5.66])box(background,.019,.013,1.63,0xbb9b70,x,.029,z);
  }
  for(let i=0;i<10;i++) {
    const x=-15+i*7.9,z=-10.9-(i%2)*1.6;
    const building=theme.fronts[i%4],trim=theme.trim[i%4];
    const roofY=3.44+(i%3)*.45;
    box(background,6.43,roofY,1.99,building,x,roofY*.49,z-1);
    box(background,6.57,.21,2.14,trim,x,roofY,z-.99);
    box(background,6.49,.096,2.19,theme.flags[1],x,roofY-.168,z-.958);
    box(background,6.50,.29,.63,trim,x,2.64,z+.08);
    for(let j=0;j<4;j++) {
      const px=x-2.35+j*1.56,portal=index===1&&j%2===1;
      box(background,1.38,2.16,.12,trim,px,1.22,z+.068);
      box(background,1.21,1.98,.064,portal?0x3c5a60:index===2?0x765ba0:0x5296b4,px,1.225,z+.146);
      if(portal) {
        for(let l=0;l<11;l++)box(background,1.18,.025,.036,0x759798,px,.32+l*.164,z+.19);
      } else {
        box(background,1.18,.46,.068,index===2?0xffb984:0xf6d179,px,.53,z+.184);
        box(background,.049,1.87,.065,0xffefd5,px,1.24,z+.214);
        box(background,1.16,.040,.058,0xffefd5,px,1.57,z+.213);
        for(const offset of [-.27,.27]) {
          box(background,.065,.79,.014,index===2?0xefd5ff:0xb9e6ee,px+offset,1.23,z+.25).rotation.z=-.26;
        }
        box(background,.075,.153,.077,0xffe6a3,px+.107,1.13,z+.259);
      }
      for(let stripe=0;stripe<6;stripe++) {
        const color=stripe%2?0xfff1d8:theme.flags[i%3];
        box(background,.248,.105,.82,color,px-.619+stripe*.247,2.404,z+.48).rotation.x=.29;
        box(background,.248,.161,.064,color,px-.619+stripe*.247,2.200,z+.870);
      }
    }
    const label=theme.signs[i%theme.signs.length];
    box(background,3.95,.55,.166,trim,x,3.08,z+.12);
    sign(background,label,`#${trim.toString(16).padStart(6,'0')}`,x,3.08,z+.218,3.65,.44);
    if(index===1&&i%2===0)for(let k=0;k<4;k++){
      box(background,.68,.056,.84,0x9e7654,x+1.86+k*.36,.071,z+1.1);
      box(background,.58,.47,.59,0xe0b174,x+1.8+k*.36,.34+(k%2)*.44,z+1.06);
    }
  }
  for(let i=0;i<12;i++) {
    const x=-12+i*6.583,z=-4.65;
    if(i%2) {
      cylinder(background,.068,2.91,0x356278,x,1.45,z);
      rod(background,[x,2.77,z],[x+.45,2.74,z+.36],.043,0x356278);
      box(background,.51,.11,.32,0x285475,x+.53,2.70,z+.41);
      box(background,.38,.032,.23,0xffe6a4,x+.55,2.63,z+.425);
      cylinder(background,.18,.14,0x5c91a3,x,.069,z);
    } else {
      box(background,1.02,.25,.92,0xdd9566,x,.132,z);
      box(background,.91,.048,.80,0x84674e,x,.265,z);
      cylinder(background,.085,.97,0x866041,x,.675,z);
      for(let n=0;n<5;n++) {
        const a=n*2.399;
        const top=mesh(background,ridgeShape,mat(theme.trees[n%3]),x+Math.cos(a)*.30,1.30+n*.103,z+Math.sin(a)*.29);
        top.scale.set(.48+(n%2)*.105,.56,.43);
        top.rotation.y=a;
      }
    }
    if(i%3===1)for(let stripe=0;stripe<5;stripe++)box(background,.19,.014,1.71,0xffefc6,x-.45+stripe*.235,-.003,1.11);
    if(i%4===3) {
      molded(background,2.82,.61,1.274,.115,theme.flags[0],x-2,.42,-7.75);
      molded(background,1.58,.47,1.15,.112,theme.flags[0],x-2.4,.90,-7.75);
      box(background,1.32,.267,.053,0x4c7898,x-2.4,.94,-7.16);
      box(background,.045,.27,.063,0xffe8dd,x-2.332,.945,-7.13);
      box(background,.211,.094,.11,0xffe8b4,x-.565,.388,-7.37);
      for(const side of [-1,1]) {
        const w=cylinder(background,.255,.12,0x28354a,x-2+side*.82,.277,-7.09);w.rotation.x=Math.PI/2;
        const hub=cylinder(background,.131,.134,0xffd58c,x-2+side*.82,.277,-7.081);hub.rotation.x=Math.PI/2;
      }
    }
  }
  for(let i=0;i<17;i++) {
    const x=-10+i*4.647,z=5.15;
    box(background,1.04,.077,.35,0x8e8d70,x,.065,z);
    for(const side of [-1,1])box(background,.18,.011,.348,theme.flags[1],x+side*.331,.109,z);
    if(i%3===0)for(const offset of [-.31,.31]) {
      cylinder(background,.08,.57,0x3d6d83,x+offset,.31,z+.61);
      cylinder(background,.087,.13,theme.flags[0],x+offset,.46,z+.61);
    }
  }
  const sun=mesh(background,sphere,new T.MeshBasicMaterial({color:index===2?0xffd0ab:0xffe795}),12,7.7,-25);
  sun.scale.setScalar(index===2?2.3:1.22);sun.visible=false;
  sun.castShadow=false;
  const horizon=[];
  for(let i=0;i<10;i++) {
    const hill=oval(background,5.7+i%4,2.0+(i%4)*.55,3.2,theme.trees[i%3],i*7-23,.16,-20-(i%2)*4);
    hill.castShadow=false;
    const cloud=new T.Group();cloud.position.set(-17+i*8,5.5+(i%3)*1.36,-19-i%3*2.6);background.add(cloud);
    for(let n=0;n<4;n++) {
      const puff=oval(cloud,1.38+n*.11,.38+n%2*.19,.62,theme.cloud,n*.7,n%2*.17,0);
      puff.castShadow=false;
    }
    horizon.push({cloud,x:cloud.position.x});
  }
  for(let i=0;i<9;i++) {
    const x=-11+i*8.78;
    const top=index===2?3.72:3.25;
    for(const end of [-1,1])cylinder(background,.052,top,0x43808a,x+end*2.83,top/2,-5.93);
    for(let j=0;j<11;j++) {
      const a=x-2.83+j*.514,b=a+.514;
      const y=top-.273*Math.sin(j*Math.PI/11),ry=top-.273*Math.sin((j+1)*Math.PI/11);
      rod(background,[a,y,-5.93],[b,ry,-5.93],.014,0x447075);
      const m=mesh(background,pennantGeometry,mat(theme.flags[j%3]),a+.24,y,-5.931);
      m.castShadow=false;
    }
  }
  batchScenery(background,new Set([sun,...horizon.map(({cloud})=>cloud)]));
  return {background,sun,horizon};
}

function driver() {
  const g=new T.Group();
  const skin=0xeca979,hair=0x2d283b,top=0xf26647,shoe=0xfff0c7;
  const body=oval(g,.236,.327,.275,top,-.105,.89,0);body.rotation.z=-.34;
  molded(g,.24,.31,.065,.019,0xd64936,-.169,.842,.258).rotation.z=-.31;
  molded(g,.089,.276,.038,.012,0xffe89d,-.078,.908,.288).rotation.z=-.36;
  // 头：正圆的头 + 画在脸部球面贴片上的五官（左右对称），整颗头微微转向前进方向
  oval(g,.1,.1,.1,skin,-.05,1.12,0);
  const head=new T.Group();head.position.set(-.02,1.34,0);head.rotation.y=.42;head.scale.setScalar(1.15);g.add(head);
  const R=.25,S=[1,.96,.95];
  const skull=mesh(head,new T.SphereGeometry(R,40,28),mat(skin,0,.6));skull.scale.set(...S);
  for(const s of [-1,1])oval(head,.05,.07,.04,skin,s*R*.98,-.01,0);
  const faces={};
  const faceMat=new T.MeshStandardMaterial({transparent:true,roughness:.6,polygonOffset:true,polygonOffsetFactor:-2});
  const patch=mesh(head,new T.SphereGeometry(R*1.004,40,30,Math.PI/2-1,2,Math.PI/2-.75,1.5),faceMat);patch.scale.set(...S);patch.castShadow=false;
  // 后脑和鬓角的头发（避开脸），帽檐下一排刘海
  const hairMat=new T.MeshPhysicalMaterial({color:hair,roughness:.5,clearcoat:.25});
  const back=mesh(head,new T.SphereGeometry(R*1.04,40,20,Math.PI/2+.95,Math.PI*2-1.9,0,1.95),hairMat);back.scale.set(...S);
  const fringe=mesh(head,new T.SphereGeometry(R*1.035,40,6,Math.PI/2-.95,1.9,.98,.3),hairMat);fringe.scale.set(...S);
  // 帽子：帽顶 + 帽檐朝脸的方向 + 小徽章
  const capMat=mat(0xffd64e,0,.55);
  const dome=mesh(head,new T.SphereGeometry(R*1.09,40,16,0,Math.PI*2,0,1.12),capMat);dome.scale.set(...S);
  const band=mesh(head,new T.TorusGeometry(R*1.0,.022,8,40),mat(0x18a9a5,0,.5));band.position.y=R*.41;band.rotation.x=Math.PI/2;
  const brim=oval(head,.22,.03,.17,0x18a9a5,0,R*.44,R*.95);brim.rotation.x=.1;
  oval(head,.05,.04,.02,0xfff4cd,0,R*.72,R*.84).rotation.x=-.6;
  function paint(kind){
    if(faces[kind])return faces[kind];
    const W=512,H=384,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
    const U=u=>u*W,V=v=>(1-v)*H;
    for(const s of [-1,1]){const gr=x.createRadialGradient(U(.5+s*.2),V(.36),2,U(.5+s*.2),V(.36),40);gr.addColorStop(0,'rgba(255,120,120,.5)');gr.addColorStop(1,'rgba(255,120,120,0)');x.fillStyle=gr;x.fillRect(0,0,W,H);}
    x.lineCap='round';
    for(const s of [-1,1]){
      const cx=U(.5+s*.16),cy=V(.49);
      if(kind==='dizzy'){x.strokeStyle='#2a1a1c';x.lineWidth=11;x.beginPath();x.moveTo(cx-28,cy-28);x.lineTo(cx+28,cy+28);x.moveTo(cx+28,cy-28);x.lineTo(cx-28,cy+28);x.stroke();continue;}
      const ew=kind==='wow'?42:38,eh=kind==='wow'?56:50;
      x.fillStyle='#ffffff';x.beginPath();x.ellipse(cx,cy,ew+6,eh+6,0,0,Math.PI*2);x.fill();
      const ig=x.createLinearGradient(0,cy-eh,0,cy+eh);ig.addColorStop(0,'#1a1014');ig.addColorStop(1,'#6b4a2a');
      x.fillStyle=ig;x.beginPath();x.ellipse(cx,cy+2,ew*.8,eh*.82,0,0,Math.PI*2);x.fill();
      x.fillStyle='#ffffff';x.beginPath();x.ellipse(cx+7,cy-eh*.35,9,11,0,0,Math.PI*2);x.fill();x.beginPath();x.arc(cx-8,cy+eh*.35,4,0,Math.PI*2);x.fill();
      x.strokeStyle='#1a1014';x.lineWidth=6;x.beginPath();x.ellipse(cx,cy,ew+7,eh+7,0,Math.PI*1.1,Math.PI*1.9);x.stroke();
      x.strokeStyle=`#${hair.toString(16).padStart(6,'0')}`;x.lineWidth=9;x.beginPath();
      const by=cy-eh-(kind==='wow'?34:24);x.moveTo(cx-26,by+6);x.quadraticCurveTo(cx,by-8,cx+26,by+6);x.stroke();
    }
    x.strokeStyle='rgba(140,70,50,.5)';x.lineWidth=5;x.beginPath();x.arc(U(.5),V(.4),7,.15*Math.PI,.85*Math.PI);x.stroke();
    const mx=U(.5),my=V(.27);
    if(kind==='wow'){x.fillStyle='#7a2638';x.beginPath();x.ellipse(mx,my+6,22,30,0,0,Math.PI*2);x.fill();x.fillStyle='#ff8a96';x.beginPath();x.ellipse(mx,my+18,11,8,0,0,Math.PI*2);x.fill();}
    else if(kind==='dizzy'){x.strokeStyle='#7a2638';x.lineWidth=7;x.beginPath();x.moveTo(mx-24,my+8);for(let i=1;i<=6;i++)x.lineTo(mx-24+i*8,my+8+(i%2?-8:8));x.stroke();}
    else {x.fillStyle='#7a2638';x.beginPath();x.moveTo(mx-30,my-4);x.quadraticCurveTo(mx,my+40,mx+30,my-4);x.closePath();x.fill();x.fillStyle='#ffffff';x.fillRect(mx-16,my-4,32,6);}
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;faces[kind]=t;return t;
  }
  let shown='';
  const setFace=kind=>{if(kind===shown)return;shown=kind;faceMat.map=paint(kind);faceMat.needsUpdate=true;};
  setFace('smile');
  for(const side of [-1,1]) {
    rod(g,[-.19,.96,side*.22],[.153,.67,side*.29],.077,top);
    oval(g,.079,.085,.076,0xffcf63,.137,.683,side*.289);
    oval(g,.083,.068,.067,skin,.194,.66,side*.285);
  }
  const legs=[];
  for(const side of [-1,1]) {
    const leg=new T.Group();leg.position.set(-.14,.58,side*.12);g.add(leg);legs.push(leg);
    oval(leg,.102,.249,.103,0x304d6d,0,-.16,0);
    molded(leg,.317,.131,.206,.047,shoe,.052,-.37,0);
    molded(leg,.324,.047,.211,.017,0x31a99c,.054,-.426,0);
  }
  return {g,legs,setFace};
}

function basket() {
  const g=new T.Group();const metal=0x8fcee1;const grip=0xffa647;
  molded(g,1.53,.17,.98,.049,0x177f9c,.046,.029);
  molded(g,1.394,.093,.864,.037,0xc2e0e6,.107,.174);
  for(const z of [-.481,.481])molded(g,1.33,.070,.028,.012,0x49c0d1,.072,.065,z);
  const lower=[[-.57,.22,-.39],[.72,.22,-.39],[.72,.22,.39],[-.57,.22,.39]];
  const upper=[[-.68,.83,-.49],[.88,.75,-.49],[.88,.75,.49],[-.68,.83,.49]];
  for(let i=0;i<4;i++) {
    rod(g,lower[i],lower[(i+1)%4],.035,metal);rod(g,lower[i],upper[i],.041,metal);
    rod(g,upper[i],upper[(i+1)%4],.056,i===2?0x2fc0be:metal);
  }
  for(const z of [-1,1]) {
    for(let i=0;i<10;i++) {
      const p=i/9;
      rod(g,[-.57+p*1.29,.221,z*.39],[-.68+p*1.56,.83-p*.08,z*.488],.021,metal);
    }
    for(let i=1;i<=3;i++) {
      const p=i/4;
      rod(g,[-.57-p*.11,.22+p*.61,z*(.39+p*.10)],[.72+p*.16,.22+p*.53,z*(.39+p*.10)],.018,metal);
    }
    rod(g,[-.57,.32,z*.37],[-1.03,.74,z*.46],.055,metal);
  }
  for(let i=1;i<7;i++)rod(g,[.72,.22,-.39+i*.11],[.88,.75,-.49+i*.14],.02,metal);
  rod(g,[-1.03,.74,-.46],[-1.03,.74,.46],.069,grip);
  molded(g,.43,.232,.055,.022,0xffca4b,.193,.537,.497);
  sign(g,'DASH','#167984',.193,.536,.527,.354,.127);
  for(const z of [-.46,.46])oval(g,.067,.066,.058,0xe46b3a,-1.03,.740,z);
  const wheels=[];
  for(const x of [-.51,.605]) for(const z of [-.49,.49]) {
    const group=new T.Group();group.position.set(x,-.154,z);g.add(group);wheels.push(group);
    const wheel=cylinder(group,.225,.155,0x243342);wheel.rotation.x=Math.PI/2;
    const hub=cylinder(group,.136,.169,0xffba3c);hub.rotation.x=Math.PI/2;
    const ring=new T.TorusGeometry(.173,.017,8,28);
    mesh(group,ring,mat(0x779eaf,.29,.35),0,0,z>0?.082:-.082);
    for(let i=0;i<5;i++) {
      const angle=i*Math.PI*.4;
      box(group,.149,.035,.036,0xffdf75,0,0,z>0?.086:-.086).rotation.z=angle;
    }
  }
  return {g,wheels};
}

// ——————— 车里的货（越堆越高） ———————
const ITEM_H={tv:.36,gift:.42,coffee:.46,duck:.42,turkey:.36,sofa:.4};
function itemModel(id) {
  const g=new T.Group();
  if(id==='tv'){
    molded(g,.92,.52,.18,.04,0xffc654,0,.26);molded(g,.84,.44,.05,.02,0x19334d,0,.27,.08);
    box(g,.7,.34,.01,0x437fbb,0,.28,.11);box(g,.07,.24,.004,0x95bfd9,-.2,.3,.118).rotation.z=-.5;
  } else if(id==='gift'){
    molded(g,.56,.42,.5,.035,0xef5b54,0,.21);box(g,.1,.44,.52,0xffd769,0,.21);box(g,.58,.44,.1,0xffd769,0,.21);
    for(const s of [-1,1])oval(g,.12,.06,.07,0xffd769,s*.09,.45).rotation.z=s*.5;
  } else if(id==='coffee'){
    molded(g,.46,.46,.4,.03,0x36beac,0,.23);molded(g,.3,.2,.04,.015,0x274957,0,.22,.2);cylinder(g,.07,.1,0xffecc6,0,.16,.24);
  } else if(id==='duck'){
    oval(g,.28,.2,.24,0xffd43b,0,.2);oval(g,.15,.15,.15,0xffd43b,.12,.42);oval(g,.08,.03,.07,0xff8a2b,.25,.4);
    oval(g,.025,.03,.015,0x1a1014,.19,.46,.08);
  } else if(id==='turkey'){
    const b=oval(g,.32,.2,.25,0xe9b27a,0,.2);b.material=new T.MeshPhysicalMaterial({color:0xe9b27a,roughness:.25,clearcoat:1});
    for(const s of [-1,1]){rod(g,[-.15,.25,s*.12],[-.32,.42,s*.15],.06,0xe9b27a);oval(g,.04,.04,.04,0xfff8ea,-.34,.44,s*.15);}
  } else {
    oval(g,.34,.22,.3,0x8b6cf0,0,.22);oval(g,.2,.1,.18,0xa58cff,.05,.38);
  }
  return g;
}

// ——————— 跳台、货架、停着的车、金币 ———————
const coinGeo=new T.CylinderGeometry(.24,.24,.06,22);
const coinMat=new T.MeshStandardMaterial({color:0xffd43b,metalness:.6,roughness:.25,emissive:0x6b4a00,emissiveIntensity:.35});
function rampScenery(scene,r,themeIndex) {
  const group=new T.Group();scene.add(group);
  const theme=themes[themeIndex];
  const steps=22,slope=x=>{const s=Math.max(0,Math.min(1,x/r.len));return r.h*s*s;};
  const ramp=new T.Group();ramp.position.x=r.x0;group.add(ramp);
  for(let i=0;i<steps;i++){
    const x=r.len*i/steps,q=r.len*(i+1)/steps,y=slope(x),z=slope(q);
    const m=box(ramp,Math.hypot(q-x,z-y)+.013,.118,2.66,i%6===0?theme.deep:theme.deck,(x+q)/2,(y+z)/2-.059,0);
    m.rotation.z=Math.atan2(z-y,q-x);
    for(const edge of [-1,1])rod(ramp,[x,y+.016,edge*1.31],[q,z+.016,edge*1.31],.039,theme.rails);
    if(i%5===2){const d=box(ramp,.3,.014,.5,0xffeab9,(x+q)/2,(y+z)/2+.014,0);d.rotation.z=m.rotation.z;}
  }
  for(let x=1.6;x<=r.len-.1;x+=1.0){
    const height=slope(x);
    for(const z of [-1.18,1.18])rod(ramp,[x,0,z],[x,height-.08,z],.061,theme.deep);
    box(ramp,.33,.076,2.71,0x44586d,x,.042,0);
  }
  for(const z of [-1.5,1.5]){cylinder(ramp,.06,r.h+.6,theme.deep,r.len,(r.h+.6)/2,z);oval(ramp,.13,.13,.13,theme.rails,r.len,r.h+.66,z);}
  // 闪购货架：经过时往车里塞一件
  const stall=new T.Group();stall.position.set(r.shelf,0,-2.0);group.add(stall);
  molded(stall,1.9,.9,.9,.06,theme.flags[0],0,.45);
  box(stall,1.96,.08,1,0xffffff,0,.92);
  for(const x of [-.85,.85])cylinder(stall,.05,1.5,theme.deep,x,1.6,-.3);
  box(stall,2.1,.42,.12,theme.deep,0,2.35,-.3);
  sign(stall,'闪购','#e8463c',0,2.35,-.23,1.2,.34);
  const offer=itemModel(r.item);offer.position.set(0,.98,0);offer.scale.setScalar(1.3);stall.add(offer);
  // 停着的车：落上去会弹起来
  let carGroup=null;
  if(r.car){
    carGroup=new T.Group();carGroup.position.set(r.car.x,0,0);group.add(carGroup);
    const tone=[0xff6b6b,0x3aa7e0,0xffc93d,0x4bb98c][r.car.color];
    molded(carGroup,r.car.len,.62,1.7,.16,tone,0,.5);
    molded(carGroup,r.car.len*.58,.42,1.5,.14,tone,-.1,.98);
    for(const s of [-1,1])box(carGroup,r.car.len*.5,.3,.02,0x9fd9ef,-.1,1.0,s*.755);
    box(carGroup,r.car.len*CAR_ROOF.lengthRatio,CAR_ROOF.thickness,1.52,0xffffff,CAR_ROOF.offsetX,CAR_ROOF.height-CAR_ROOF.thickness/2,0);
    for(const x of [-.95,.95])for(const z of [-.82,.82]){const w=cylinder(carGroup,.26,.2,0x28354a,x,.26,z);w.rotation.x=Math.PI/2;}
    sign(carGroup,'弹!','#ff3d7f',-.1,1.45,0,.7,.3).rotation.x=-Math.PI/2+.4;
  }
  const coins=r.coins.map(c=>{const m=new T.Mesh(coinGeo,coinMat);m.position.set(c.x,c.y,0);m.rotation.x=Math.PI/2;m.castShadow=false;group.add(m);return m;});
  return {group,offer,coins,carGroup,r};
}

// ——————— 小旗（上次翻车处 / 最远纪录） ———————
function flagPole(scene,text,tone) {
  const g=new T.Group();scene.add(g);
  cylinder(g,.05,3.2,0xf4f1e6,0,1.6,-1.9);
  const cloth=box(g,1.4,.62,.03,0xffffff,.72,2.85,-1.9);cloth.material=mat(new T.Color(tone).getHex(),0,.8);
  sign(g,text,tone,.72,2.85,-1.87,1.32,.5);
  g.visible=false;return g;
}

export function createStage(root) {
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(1.8,devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  root.append(renderer.domElement);
  const scene=new T.Scene();scene.fog=new T.Fog(themes[0].fog,24,62);
  const camera=new T.PerspectiveCamera(42,1,.2,120);
  const ambient=new T.HemisphereLight(0xe4f8ff,0x72928d,1.65);scene.add(ambient);
  const light=new T.DirectionalLight(0xffe4b2,3.14);light.position.set(-4,9,6);
  light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-18,right:18,top:12,bottom:-12,near:1,far:30});
  light.shadow.bias=-.0003;light.shadow.normalBias=.025;scene.add(light,light.target);
  const rim=new T.DirectionalLight(0xa5e7ff,1.15);rim.position.set(2,5,-8);scene.add(rim);
  const sun=mesh(scene,sphere,new T.MeshBasicMaterial({color:0xffe795}),0,7.7,-26);sun.castShadow=false;sun.scale.setScalar(1.3);
  const skies=themes.map(makeSky);
  // 购物车 + 推车小人 + 货堆，全挂在 rig 上一起翻
  const PIV=.7,rig=new T.Group();scene.add(rig);
  const cart=basket();rig.add(cart.g);cart.g.position.y=.38-PIV;
  const person=driver();rig.add(person.g);
  const pileGroup=new T.Group();pileGroup.position.set(.12,.62,0);cart.g.add(pileGroup);
  let pileKey='',pileMeshes=[];
  function syncPile(pile){
    const key=pile.join(',');if(key===pileKey)return;pileKey=key;
    pileMeshes.forEach(m=>pileGroup.remove(m));
    let y=0;pileMeshes=pile.map((id,i)=>{const m=itemModel(id);m.position.set(((i*37)%3-1)*.14,y,((i*53)%3-1)*.08);m.rotation.y=((i*29)%7-3)*.12;y+=ITEM_H[id]*.92;pileGroup.add(m);m.userData.h=y;return m;});
  }
  const wakes=Array.from({length:16},(_,i)=>{
    const m=mesh(scene,sphere,new T.MeshBasicMaterial({color:i%2?0xffeba5:0xd6f7f7,transparent:true,opacity:0,depthWrite:false}));
    m.castShadow=false;m.visible=false;return m;
  });
  const bits=Array.from({length:26},(_,i)=>{const m=box(scene,.12,.1,.12,[0xffe489,0xf99287,0x98ead0,0xc39dec][i%4]);m.castShadow=false;m.visible=false;return m;});
  let burst={t:9,x:0,y:0,kind:'dust'};
  // 翻车时四散的东西：{obj,p,v,w}
  let debris=[];
  const chunks=new Map(),ramps=new Map();
  const CH=79,CH0=-18.95;
  const themeOf=c=>Math.min(2,Math.floor(Math.max(0,c)/2));
  const lastFlag=flagPole(scene,'上次','#e8463c'),bestFlag=flagPole(scene,'最远','#258286');
  let focus=0,lift=0,themeNow=-1,shake=0,crashT=0;
  const dispose=group=>{scene.remove(group);group.traverse(m=>{if(m.isInstancedMesh)m.dispose();});};
  function resize(){
    const w=root.clientWidth,h=root.clientHeight;if(!w||!h)return;
    camera.aspect=w/h;camera.fov=camera.aspect<.6?48:42;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
  }
  new ResizeObserver(resize).observe(root);resize();
  function setTheme(i){
    if(i===themeNow)return;themeNow=i;const t=themes[i];
    scene.background=skies[i];scene.fog.color.setHex(t.fog);
    ambient.color.setHex(i===2?0xd5c9ff:0xe4f8ff);light.color.setHex(i===2?0xffc2a8:0xffe8b5);
    sun.material.color.setHex(i===2?0xffd0ab:0xffe795);sun.scale.setScalar(i===2?2.3:1.3);
  }
  function manageWorld(run){
    const c0=Math.floor((focus-CH0-20)/CH),c1=Math.floor((focus-CH0+45)/CH);
    for(let c=c0;c<=c1;c++)if(!chunks.has(c))chunks.set(c,scenery(scene,themeOf(c),c*CH).background);
    for(const [c,g] of chunks)if(c<c0-0||c>c1+1){dispose(g);chunks.delete(c);}
    for(const r of run.ramps){
      if(r.x0>focus+55||r.x0+r.len+r.gap<focus-30)continue;
      if(!ramps.has(r))ramps.set(r,rampScenery(scene,r,themeOf(Math.floor((r.x0-CH0)/CH))));
    }
    for(const [r,o] of ramps)if(r.x0+r.len+r.gap<focus-30||!run.ramps.includes(r)){dispose(o.group);ramps.delete(r);}
    setTheme(themeOf(Math.floor((focus-CH0)/CH)));
  }
  function crashBurst(run){
    debris=[];
    const base=new T.Vector3(run.x,run.y+.5,0);
    const push=(obj,v,w)=>{const p=new T.Vector3();obj.getWorldPosition(p);const q=new T.Quaternion();obj.getWorldQuaternion(q);
      obj.removeFromParent();scene.add(obj);obj.position.copy(p);obj.quaternion.copy(q);debris.push({obj,v,w});};
    pileMeshes.forEach((m,i)=>push(m,new T.Vector3(run.vx*.6+(Math.random()-.3)*4,4+Math.random()*5,(Math.random()-.5)*5),new T.Vector3(Math.random()*9,Math.random()*9,Math.random()*9)));
    pileMeshes=[];pileKey='crashed';
    push(person.g,new T.Vector3(run.vx*.9+2,6.5,1.5),new T.Vector3(2,1,-9));
    push(cart.g,new T.Vector3(run.vx*.5,3,0),new T.Vector3(0,0,-7));
    burst={t:0,x:base.x,y:base.y,kind:'crash'};shake=.5;crashT=0;
  }
  function rebuildRig(){
    debris.forEach(d=>scene.remove(d.obj));debris=[];
    rig.add(cart.g);cart.g.position.set(0,.38-PIV,0);cart.g.rotation.set(0,0,0);cart.g.quaternion.identity();
    rig.add(person.g);person.g.rotation.set(0,0,0);person.g.position.set(-1.2,-PIV,0);
    pileKey='';
  }
  return {
    reset(run,marks={}){
      rebuildRig();
      for(const [,o] of ramps)dispose(o.group);ramps.clear();
      focus=run.x+3;manageWorld(run);
      lastFlag.visible=marks.last>0;lastFlag.position.x=marks.last||0;
      bestFlag.visible=marks.best>0&&Math.abs((marks.best||0)-(marks.last||0))>3;bestFlag.position.x=marks.best||0;
    },
    event(e,run){
      if(e.type==='crash'){crashBurst(run);person.setFace('dizzy');}
      else if(e.type==='land'||e.type==='bounce'){burst={t:0,x:run.x,y:run.y,kind:e.grade==='perfect'?'spark':'dust'};shake=e.grade==='sloppy'?.25:.1;
        if(e.lostItem){const m=itemModel(e.lostItem);scene.add(m);m.position.set(run.x,1.4,0);debris.push({obj:m,v:new T.Vector3(-2,5,2.5),w:new T.Vector3(4,6,3)});}}
      else if(e.type==='pickup'){const o=[...ramps.values()].find(o=>o.r===currentRampOf(run));if(o)o.offer.visible=false;}
    },
    screenOf(x,y){const v=new T.Vector3(x,y,0).project(camera);return {x:(v.x+1)/2,y:(1-v.y)/2};},
    render(run,time,dt){
      const air=run.phase==='air',crashed=run.phase==='crash';
      const ahead=air?1.6:2.2;
      focus+=((crashed?run.crash.x+1:run.x+ahead)-focus)*(1-Math.exp(-dt*(crashed?2:6)));
      lift+=((air?Math.max(0,run.y-1.2)*.75:0)-lift)*(1-Math.exp(-dt*3));
      manageWorld(run);
      shake=Math.max(0,shake-dt);
      const sx=shake?Math.sin(time*70)*shake*.35:0;
      const portrait=camera.aspect<.8;
      const dist=crashed?9.5-Math.min(1.5,crashT)*1.2:(portrait?12.5:11)+(air?1.8:0);
      camera.position.set(focus+1.0+sx,3.1+lift+(crashed?-.4:0),dist);
      camera.lookAt(focus,(portrait?2.6:2.0)+lift*.9,0);camera.updateMatrixWorld();
      light.position.set(focus-6,9,6);light.target.position.set(focus,0,0);
      sun.position.x=focus*.85+10;
      if(!crashed){
        syncPile(run.pile);
        rig.position.set(run.x,run.y+PIV,0);rig.rotation.z=run.angle;
        const riding=air;
        person.setFace(air?'wow':'smile');
        person.g.position.x+=((riding?-.66:-1.2)-person.g.position.x)*(1-Math.exp(-dt*10));
        person.g.position.y+=((riding?.36:0)-PIV-person.g.position.y)*(1-Math.exp(-dt*10));
        person.legs.forEach((leg,i)=>leg.rotation.z=riding?.9*Math.sin(time*14+i*Math.PI)+.4:Math.sin(time*(10+run.speed)+i*Math.PI)*.7);
        for(const wheel of cart.wheels)wheel.rotation.z=-run.x*4.2;
        // 货堆跟着翻转甩：角速度越大越歪
        pileMeshes.forEach((m,i)=>{m.rotation.z=-run.av*.025*(i+1)+Math.sin(time*9+i)*.02*(i>3?1:0);});
      } else crashT+=dt;
      for(let i=debris.length-1;i>=0;i--){
        const d=debris[i],o=d.obj;
        d.v.y-=12*dt;o.position.addScaledVector(d.v,dt);
        o.rotation.x+=d.w.x*dt;o.rotation.y+=d.w.y*dt;o.rotation.z+=d.w.z*dt;
        if(o.position.y<.05&&d.v.y<0){o.position.y=.05;d.v.y*=-.42;d.v.x*=.7;d.v.z*=.7;d.w.multiplyScalar(.6);}
      }
      wakes.forEach((m,i)=>{
        m.visible=air;if(!air)return;
        const t=i/15,off=(time*1.9+t)%1;
        m.position.set(run.x-.6-off*3,run.y+.25-off*.3,(i%3-1)*.3);
        m.scale.set(.14+off*.25,.05+off*.1,.05+off*.07);m.material.opacity=(1-off)*.6;
      });
      burst.t+=dt;
      bits.forEach((m,i)=>{
        const big=burst.kind==='crash',age=burst.t;
        m.visible=age<(big?1.6:.8);if(!m.visible)return;
        const phi=i*2.399,speed=(big?2.4:1.1)+(i%5)*.4;
        m.position.set(burst.x+Math.cos(phi)*age*speed,burst.y+.1+Math.max(0,age*(big?5:3)-age*age*(big?4:4.5)),Math.sin(phi)*age*speed);
        m.material=mat(burst.kind==='spark'?[0xffdc6c,0xffffff,0x9af0a1,0xff8fb0][i%4]:burst.kind==='crash'?[0xffdc6c,0xf87e52,0x30c9ca,0xd1af88][i%4]:[0xd1af88,0xefd6aa,0xc1bf9f][i%3]);
        m.rotation.set(i+age*7,age*3.3,i*.8+age*5);m.scale.setScalar((i%3+2)*(big?.09:.06)*Math.max(0,1-age/(big?1.8:.9)));
      });
      for(const [,o] of ramps){
        o.coins.forEach((m,i)=>{const c=o.r.coins[i];m.visible=!c.got;m.rotation.z=time*3+i;m.position.x+=(c.x-m.position.x)*(1-Math.exp(-dt*8));m.position.y+=(c.y-m.position.y)*(1-Math.exp(-dt*8));});
        if(o.carGroup&&o.r.car?.used){o.carGroup.scale.y=1+Math.max(0,Math.sin(time*20))*.0;}
      }
      renderer.render(scene,camera);
    },
  };
}
const currentRampOf=run=>run.ramps[run.rampIndex];
export {driver,basket};
