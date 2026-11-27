// 方块玩偶顾客：方头方身、简笔笑脸、亮面塑料 + 粗黑描边（像玩具小人），清新亮色。
// 原创造型：圆角方头、各自的方块发型与穿搭，不照搬任何现成游戏的角色。
import * as T from './vendor/three.module.js';

export const BLOCK_DESIGNS = [
  {skin:'#ffe0c4', hair:'#2b2433', hairStyle:'spiky', top:'suit',    topColor:'#2f3448', shirt:'#ffffff', tie:'#ff5a6e', pants:'#2f3448', shoes:'#1f2230'},
  {skin:'#c58a63', hair:'#2b2433', hairStyle:'afro',  top:'puffer',  topColor:'#ffb347', accent:'#ffffff', pants:'#4a5f9e', shoes:'#ff6f61', glasses:true},
  {skin:'#ffe6d2', hair:'#e07a3f', hairStyle:'beanie',top:'hoodie',  topColor:'#5fd6a4', accent:'#ffffff', pants:'#5266a0', shoes:'#ffffff', hat:'#ff7a8a'},
  {skin:'#f1c09a', hair:'#3a2a40', hairStyle:'bun',   top:'tee',     topColor:'#b99bff', accent:'#ffe066', pants:'#ffffff', shoes:'#b99bff', bag:'#ffd23f'},
  {skin:'#ffdcc6', hair:'#7a4a2c', hairStyle:'long',  top:'dress',   topColor:'#ff9cc2', accent:'#ffffff', pants:'#ffdcc6', shoes:'#ff6f91', bag:'#5cc8ff'},
  {skin:'#d79c74', hair:'#262433', hairStyle:'cap',   top:'tee',     topColor:'#ff6f61', accent:'#ffffff', pants:'#3f5a8f', shoes:'#ffffff', cap:'#4a7bd9'},
  {skin:'#ffe8d6', hair:'#f2c14e', hairStyle:'pony',  top:'hoodie',  topColor:'#5cc8ff', accent:'#ffe066', pants:'#ffffff', shoes:'#5cc8ff', bag:'#ff7a8a'},
  {skin:'#a86c4e', hair:'#1f1c29', hairStyle:'spiky', top:'suit',    topColor:'#ffffff', shirt:'#5cc8ff', tie:'#2f3448', pants:'#2f3448', shoes:'#2f3448', glasses:true},
  // —— 第二批：不同年龄、职业、身材 ——
  {skin:'#ffe0c4', hair:'#5a3a24', hairStyle:'propeller', top:'tee', topColor:'#46d160', accent:'#ffffff', pants:'#3d8bff', shoes:'#ff4d6d', size:'kid', backpack:'#ff8a1f', print:'★'},
  {skin:'#f6d2b8', hair:'#d9d6e0', hairStyle:'bun',   top:'cardigan', topColor:'#c58bff', accent:'#ffffff', pants:'#5a4a7a', shoes:'#5a4a7a', glasses:true, size:'elder', basket:true},
  {skin:'#e8b08a', hair:'#2b2433', hairStyle:'helmet', top:'puffer', topColor:'#ffd23f', accent:'#2f3448', pants:'#2f3448', shoes:'#2f3448', helmet:'#ffd23f', backpack:'#ffd23f', box:true},
  {skin:'#ffe0c4', hair:'#3a2a20', hairStyle:'chef',  top:'chef',     topColor:'#ffffff', accent:'#ff4d6d', pants:'#2f3448', shoes:'#1f2230', mustache:true},
  {skin:'#d79c74', hair:'#3a2a20', hairStyle:'bald',  top:'tee',      topColor:'#14c4a0', accent:'#ffd23f', pants:'#f2e6c9', shoes:'#8a5a44', beard:true, size:'chubby', shopping:['#ff4d6d','#3d8bff'], print:'✿'},
  {skin:'#ffe6d2', hair:'#ff4fa3', hairStyle:'mohawk', top:'jacket',  topColor:'#1e1a2b', accent:'#ffd23f', pants:'#3d8bff', shoes:'#ffffff'},
  {skin:'#c58a63', hair:'#2b2433', hairStyle:'twintails', top:'track', topColor:'#ff4d6d', accent:'#ffffff', pants:'#ff4d6d', shoes:'#ffffff', band:'#ffffff', size:'tall'},
  {skin:'#ffe8d6', hair:'#5a3a24', hairStyle:'dino',  top:'dino',     topColor:'#46d160', accent:'#ffd23f', pants:'#46d160', shoes:'#ff8a1f', size:'kid'},
];

const OUTLINE=new T.MeshBasicMaterial({color:0x1e1a2b,side:T.BackSide});
const mats=new Map();
const plastic=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.36,metalness:0}));return mats.get(c);};
const geos=new Map();
function rbox(w,h,d,r){
  const k=[w,h,d,r].join();
  if(!geos.has(k)){
    const s=new T.Shape(),a=w/2-r,b=h/2-r;
    s.moveTo(-a,-b-r);s.lineTo(a,-b-r);s.quadraticCurveTo(a+r,-b-r,a+r,-b);s.lineTo(a+r,b);s.quadraticCurveTo(a+r,b+r,a,b+r);
    s.lineTo(-a,b+r);s.quadraticCurveTo(-a-r,b+r,-a-r,b);s.lineTo(-a-r,-b);s.quadraticCurveTo(-a-r,-b-r,-a,-b-r);
    const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:3,curveSegments:4});
    g.translate(0,0,-d/2+r);g.computeVertexNormals();geos.set(k,g);
  }
  return geos.get(k);
}
// 一块带描边的方块
function block(parent,w,h,d,color,x,y,z,{r=.05,line=.035,rot}={}){
  const g=rbox(w,h,d,Math.min(r,w/2-.001,h/2-.001,d/2-.001));
  const m=new T.Mesh(g,plastic(color));m.position.set(x,y,z);if(rot)m.rotation.set(...rot);
  m.castShadow=true;parent.add(m);
  if(line){const o=new T.Mesh(g,OUTLINE);o.scale.set(1+line/w*2,1+line/h*2,1+line/d*2);m.add(o);}
  return m;
}

// 简笔脸：两颗椭圆黑眼睛（带高光）+ 弯弯的嘴，三种心情
const faces=new Map();
function faceTex(d,mood){
  const key=`${d.skin}/${mood}/${d.glasses?1:0}/${d.beard?1:0}/${d.mustache?1:0}/${d.hair}`;if(faces.has(key))return faces.get(key);
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  x.fillStyle=d.skin;x.fillRect(0,0,256,256);
  x.fillStyle='rgba(255,120,140,.35)';for(const s of [-1,1]){x.beginPath();x.ellipse(128+s*74,160,24,14,0,0,Math.PI*2);x.fill();}
  x.fillStyle='#1e1a2b';
  for(const s of [-1,1]){
    const ex=128+s*44,ey=112;
    x.beginPath();
    if(mood===1){x.moveTo(ex-20,ey-12+(s<0?-6:6));x.lineTo(ex+20,ey-12+(s<0?6:-6));x.lineTo(ex+16,ey+16);x.lineTo(ex-16,ey+16);x.closePath();}
    else x.ellipse(ex,ey,mood===3?13:11,mood===3?20:15,0,0,Math.PI*2);
    x.fill();
    if(mood!==1){x.fillStyle='#ffffff';x.beginPath();x.arc(ex+4,ey-8,4.5,0,Math.PI*2);x.fill();x.fillStyle='#1e1a2b';}
    if(mood===1){x.strokeStyle='#1e1a2b';x.lineWidth=8;x.lineCap='round';x.beginPath();x.moveTo(ex-s*22,ey-40);x.lineTo(ex+s*16,ey-26);x.stroke();}
  }
  if(d.glasses){x.strokeStyle='#1e1a2b';x.lineWidth=7;for(const s of [-1,1]){x.beginPath();x.roundRect(128+s*44-30,84,60,54,12);x.stroke();}x.beginPath();x.moveTo(112,108);x.lineTo(144,108);x.stroke();}
  if(d.beard){x.fillStyle=d.hair;x.beginPath();x.moveTo(30,150);x.quadraticCurveTo(128,300,226,150);x.lineTo(226,256);x.lineTo(30,256);x.closePath();x.fill();
    x.fillStyle=d.skin;x.beginPath();x.ellipse(128,182,44,24,0,0,Math.PI*2);x.fill();}
  if(d.mustache||d.beard){x.fillStyle=d.hair;for(const s of [-1,1]){x.beginPath();x.ellipse(128+s*22,146,26,11,s*.25,0,Math.PI*2);x.fill();}}
  x.strokeStyle='#1e1a2b';x.lineWidth=8;x.lineCap='round';x.beginPath();
  if(mood===3&&(d.mustache||d.beard)){x.arc(128,160,24,.2*Math.PI,.8*Math.PI);}
  else if(mood===3){x.arc(128,150,34,.18*Math.PI,.82*Math.PI);}
  else if(mood===2){x.moveTo(108,176);x.lineTo(148,176);}
  else {x.arc(128,204,30,1.2*Math.PI,1.8*Math.PI);}
  x.stroke();
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;faces.set(key,t);return t;
}
const printTex=new Map();
function print(text,bg,ink){
  const k=text+bg+ink;if(printTex.has(k))return printTex.get(k);
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  x.fillStyle=bg;x.fillRect(0,0,128,128);x.fillStyle=ink;x.font="900 40px 'Arial Black',Arial";x.textAlign='center';x.textBaseline='middle';x.fillText(text,64,68);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;printTex.set(k,t);return t;
}
const Q=Math.PI/4;
const decal=(parent,w,h,map,x,y,z)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,toneMapped:false}));m.position.set(x,y,z);parent.add(m);return m;};

// 尺寸（世界单位）：腿 .7、身 .78、头 .64，整只约 2.6 高
const HEAD=.64;
export function blockyCustomer(index){
  const d=BLOCK_DESIGNS[index%BLOCK_DESIGNS.length];
  const root=new T.Group(),g=new T.Group();root.add(g);
  // 身材：小孩矮一截头更大，胖叔叔身子宽，高个子腿长，老奶奶微微低头
  const kid=d.size==='kid';
  const LEG=d.size==='tall'?.84:kid?.5:.7, BODY=kid?.62:.78, BW=d.size==='chubby'?1.02:.82, BD=d.size==='chubby'?.56:.42;
  if(kid)g.scale.setScalar(.92);
  const hipY=LEG, topY=LEG+BODY;
  // 腿 + 鞋
  for(const s of [-1,1]){
    block(g,.33,LEG-.1,.36,d.pants,s*(BW/2-.22),.1+(LEG-.1)/2,0);
    block(g,.35,.14,.42,d.shoes,s*(BW/2-.22),.07,.03,{r:.05});
  }
  // 身体
  const dress=d.top==='dress';
  block(g,BW,BODY,BD,d.topColor,0,hipY+BODY/2,0,{r:d.size==='chubby'?.14:.05});
  if(dress)block(g,.98,.34,.52,d.topColor,0,hipY+.08,0,{r:.08});
  const front=BD/2+.004;
  if(d.top==='suit'){
    block(g,.24,BODY-.12,.02,d.shirt,0,hipY+BODY/2+.05,.215,{line:0,r:.01});
    block(g,.09,.42,.02,d.tie,0,hipY+BODY/2,.228,{line:.015,r:.01});
    for(const s of [-1,1])block(g,.12,.36,.02,d.topColor,s*.14,hipY+BODY-.2,.232,{line:.015,r:.01,rot:[0,0,s*.35]});
  } else if(d.top==='hoodie'){
    block(g,.5,.2,.04,d.accent,0,hipY+.2,.22,{line:.02,r:.02});
    block(g,.7,.22,.3,d.topColor,0,topY+.02,-.12,{r:.1});
    for(const s of [-1,1])block(g,.03,.2,.03,d.accent,s*.09,topY-.14,.23,{line:0,r:.01});
  } else if(d.top==='puffer'){
    for(const y of [.2,.42,.62])block(g,.86,.07,.46,d.accent,0,hipY+y,0,{line:0,r:.03});
  } else if(d.top==='tee'){
    decal(g,.32,.32,print(d.print??'SALE',d.accent,d.topColor),0,hipY+BODY*.55,front);
  } else if(d.top==='cardigan'){
    block(g,.22,BODY-.06,.02,d.accent,0,hipY+BODY/2,front,{line:0,r:.01});
    for(let i=0;i<3;i++)block(g,.06,.06,.03,'#ffd23f',.16,hipY+.2+i*.2,front+.01,{line:.012,r:.02});
  } else if(d.top==='chef'){
    for(const sx of [-.12,.12])for(let i=0;i<3;i++)block(g,.06,.06,.03,'#d8dbe6',sx,hipY+.2+i*.2,front+.01,{line:.012,r:.02});
    block(g,.5,.12,.48,d.accent,0,topY-.04,0,{r:.04});
  } else if(d.top==='jacket'){
    block(g,.3,BODY-.1,.02,d.accent,0,hipY+BODY/2+.04,front,{line:0,r:.01});
    for(const s of [-1,1])for(let i=0;i<3;i++)block(g,.05,.05,.03,'#e8eefc',s*.3,hipY+.25+i*.17,front+.01,{line:.01,r:.02});
  } else if(d.top==='track'){
    for(const s of [-1,1])block(g,.06,BODY-.04,.02,d.accent,s*.3,hipY+BODY/2,front,{line:0,r:.01});
    block(g,.03,BODY-.1,.02,'#ffffff',0,hipY+BODY/2,front,{line:0,r:.01});
  } else if(d.top==='dino'){
    for(let i=0;i<4;i++)block(g,.16,.16,.16,d.accent,0,hipY+.15+i*.2,-BD/2-.04,{r:.03,rot:[Q,0,0]});
    block(g,.4,.4,.02,'#bff5c9',0,hipY+.3,front,{line:0,r:.1});
  }
  if(d.backpack){block(g,.6,.6,.26,d.backpack,0,hipY+BODY*.55,-BD/2-.12,{r:.08});
    if(d.box)block(g,.7,.6,.6,d.backpack,0,topY+.1,-BD/2-.36,{r:.06});}
  if(d.basket){block(g,.46,.3,.32,'#ff8a1f',-.6,hipY+.08,.16,{r:.05});block(g,.18,.14,.14,'#46d160',-.66,hipY+.28,.16,{r:.04});block(g,.12,.18,.1,'#ff4d6d',-.5,hipY+.3,.16,{r:.03});}
  if(d.shopping)d.shopping.forEach((c,i)=>{const s=i?1:-1;block(g,.36,.4,.18,c,s*(BW/2+.22),hipY-.02,.08,{r:.04});block(g,.04,.2,.04,c,s*(BW/2+.22),hipY+.24,.08,{r:.02,line:.02});});
  if(d.bag){
    const bag=block(g,.34,.36,.14,d.bag,.56,hipY+.12,.12,{r:.05});
    block(g,.04,.42,.04,d.bag,.48,hipY+.46,.12,{r:.02,line:.02,rot:[0,0,.4]});
  }
  // 手臂（肩膀处转动）
  const arms=[];
  for(const s of [-1,1]){
    const arm=new T.Group();arm.position.set(s*(BW/2+.17),topY-.08,0);arm.rotation.z=s*.12;g.add(arm);
    const bare=d.top==='tee'||dress;
    block(arm,.28,kid?.5:.62,.34,bare?d.skin:d.topColor,0,kid?-.25:-.31,0);
    if(d.top==='track')block(arm,.06,.5,.36,d.accent,s*.12,-.3,0,{line:0,r:.01});
    if(!bare)block(arm,.3,.14,.36,d.topColor,0,-.06,0,{line:0});
    block(arm,.26,.18,.3,d.skin,0,kid?-.57:-.69,0,{r:.07});
    arms.push(arm);
  }
  // 头
  const head=new T.Group();head.position.set(0,topY+.06+HEAD/2,0);g.add(head);
  if(kid)head.scale.setScalar(1.12);
  if(d.size==='elder'){head.position.z=.06;head.rotation.x=.08;}
  block(g,.26,.1,.26,d.skin,0,topY+.04,0,{line:0});
  const skull=block(head,.7,HEAD,.62,d.skin,0,0,0,{r:.14,line:.04});
  const faceMat=new T.MeshBasicMaterial({map:faceTex(d,3),toneMapped:false,transparent:false});
  const face=new T.Mesh(new T.PlaneGeometry(.56,.52),faceMat);face.position.set(0,-.02,.312);head.add(face);
  const H=d.hair;
  const top=(h=.2,y=.32,front=.08)=>block(head,.76,h,.68,H,0,y,-.01,{r:.08});
  if(d.hairStyle==='spiky'){
    top(.18,.3);
    for(let i=0;i<7;i++){const a=(i-3)*.32;block(head,.16,.3,.18,H,Math.sin(a)*.3,.44+Math.cos(a)*.06,-.05+(i%2)*.12,{r:.03,rot:[0,0,-a*1.4]});}
    block(head,.74,.4,.14,H,0,.12,-.3,{r:.05});
  } else if(d.hairStyle==='afro'){
    block(head,.96,.56,.78,H,0,.27,-.13,{r:.24});
  } else if(d.hairStyle==='bun'){
    top();block(head,.3,.26,.3,H,0,.5,-.08,{r:.12});block(head,.74,.44,.14,H,0,.08,-.3,{r:.05});
  } else if(d.hairStyle==='long'){
    top(.22,.32);block(head,.8,.95,.2,H,0,-.18,-.28,{r:.08});
    for(const s of [-1,1])block(head,.12,.6,.5,H,s*.4,0,-.04,{r:.05});
  } else if(d.hairStyle==='pony'){
    top();block(head,.24,.5,.22,H,0,-.06,-.42,{r:.1,rot:[.4,0,0]});for(const s of [-1,1])block(head,.1,.36,.46,H,s*.39,.1,-.06,{r:.04});
  } else if(d.hairStyle==='beanie'){
    block(head,.78,.32,.7,d.hat,0,.34,-.01,{r:.12});block(head,.82,.12,.74,d.hat,0,.2,-.01,{r:.05});
    block(head,.2,.2,.2,'#ffffff',0,.56,-.01,{r:.09});
    for(const s of [-1,1])block(head,.1,.24,.4,H,s*.39,.02,-.08,{r:.04});
  } else if(d.hairStyle==='cap'){
    block(head,.76,.24,.68,d.cap,0,.36,-.01,{r:.1});block(head,.6,.06,.34,d.cap,0,.26,.4,{r:.03});
    for(const s of [-1,1])block(head,.08,.22,.44,H,s*.39,.12,-.1,{r:.03});
  }
  else if(d.hairStyle==='propeller'){
    top(.2,.32);block(head,.78,.12,.7,'#3d8bff',0,.42,-.01,{r:.05});block(head,.66,.16,.62,'#ffd23f',0,.52,-.01,{r:.06});
    block(head,.05,.16,.05,'#1e1a2b',0,.66,0,{r:.02,line:.015});
    for(const [c,a] of [['#ff4d6d',0],['#46d160',Math.PI/2]])block(head,.62,.04,.12,c,0,.75,0,{r:.02,line:.015,rot:[0,a+.4,0]});
  } else if(d.hairStyle==='helmet'){
    block(head,.86,.46,.7,d.helmet,0,.3,-.09,{r:.2});block(head,.66,.08,.06,'#1e1a2b',0,.34,.27,{r:.03,line:0});
    block(head,.12,.3,.6,d.helmet,0,.42,-.02,{r:.05});
  } else if(d.hairStyle==='chef'){
    top(.14,.28);block(head,.74,.14,.66,'#ffffff',0,.36,-.01,{r:.05});
    for(const [x,z] of [[-.18,0],[.18,0],[0,-.14],[0,.12]])block(head,.34,.4,.34,'#ffffff',x,.62,z,{r:.15});
  } else if(d.hairStyle==='bald'){
    for(const s of [-1,1])block(head,.08,.24,.42,H,s*.38,0,-.1,{r:.03});
    block(head,.3,.06,.3,'#ffffff',-.1,.33,.05,{line:0,r:.03});
  } else if(d.hairStyle==='mohawk'){
    for(const s of [-1,1])block(head,.08,.2,.5,'#3a2a40',s*.38,.08,-.08,{r:.03});
    for(let i=0;i<5;i++)block(head,.16,.34-Math.abs(i-2)*.04,.16,H,0,.44+(2-Math.abs(i-2))*.04,.24-i*.13,{r:.04,rot:[Q*.4,0,0]});
  } else if(d.hairStyle==='twintails'){
    top(.22,.32);block(head,.82,.1,.7,d.band,0,.24,-.01,{r:.04});
    for(const s of [-1,1]){block(head,.24,.56,.24,H,s*.52,-.12,-.12,{r:.1,rot:[0,0,s*.25]});block(head,.12,.1,.12,'#ff4d6d',s*.44,.18,-.12,{r:.04});}
  } else if(d.hairStyle==='dino'){
    block(head,.88,.5,.7,d.topColor,0,.28,-.1,{r:.2});
    for(let i=0;i<4;i++)block(head,.14,.18,.14,d.accent,0,.52-i*.06,.18-i*.18,{r:.03,rot:[Q,0,0]});
    for(const s of [-1,1])block(head,.1,.1,.06,'#ffffff',s*.22,.5,.24,{r:.02,line:.012});
  }
  let shown=3;
  root.userData.setMood=mood=>{if(mood===shown)return;shown=mood;faceMat.map=faceTex(d,mood);faceMat.needsUpdate=true;};
  root.userData.arms=arms;root.userData.head=head;
  return root;
}
