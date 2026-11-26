// 纸片人顾客：人物画在一张纸上，像立牌一样站在 3D 超市里。
// 三种纸样（style）：sticker 白边贴纸 / cut 剪纸拼贴 / ink 描线插画。心情变化 = 换一张画好的纸。
import * as T from './vendor/three.module.js';

// 清新亮色版的 8 位顾客（与 3D 版同样的发型/穿搭/包，颜色更透亮）
export const PAPER_DESIGNS = [
  {skin:'#ffd9c2', hair:'#3a2f4a', hairStyle:'bob',    top:'hoodie',   topColor:'#5cc8ff', accent:'#ffe066', pants:'#4f6fa8', shoes:'#ffffff', bag:'tote', bagColor:'#ff7a8a'},
  {skin:'#b97a5a', hair:'#2b2433', hairStyle:'afro',   top:'puffer',   topColor:'#ffb347', accent:'#3fd0b6', pants:'#405580', shoes:'#ff6f61', glasses:'#3b2a33'},
  {skin:'#ffe3cf', hair:'#d9693a', hairStyle:'beanie', top:'sweater',  topColor:'#5fd6a4', accent:'#ff8fa3', pants:'#5266a0', shoes:'#8a5a44', hat:'#ff7a8a', scarf:'#ffe066', freckles:true},
  {skin:'#e8b08a', hair:'#3a2a40', hairStyle:'bun',    top:'cardigan', topColor:'#b99bff', accent:'#fff6dc', pants:'#6a56a0', shoes:'#3a2a40', earrings:'#ffd23f', bag:'shoulder', bagColor:'#ffd23f'},
  {skin:'#ffdcc6', hair:'#5a3424', hairStyle:'long',   top:'dress',    topColor:'#ff9cc2', accent:'#ffffff', pants:'#ffdcc6', shoes:'#ff6f91', earrings:'#ffffff', bag:'tote', bagColor:'#5cc8ff', mole:true},
  {skin:'#d79c74', hair:'#262433', hairStyle:'short',  top:'tee',      topColor:'#ff6f61', accent:'#ffffff', pants:'#3f5a8f', shoes:'#ffffff', glasses:'#2a2f3a', cap:'#4a7bd9'},
  {skin:'#ffe6d2', hair:'#9a5a32', hairStyle:'pony',   top:'hoodie',   topColor:'#ffd23f', accent:'#ff6f61', pants:'#5a6fa0', shoes:'#5cc8ff', bag:'basket'},
  {skin:'#a86c4e', hair:'#1f1c29', hairStyle:'afro',   top:'puffer',   topColor:'#3fd0b6', accent:'#ffe066', pants:'#363a52', shoes:'#ffe066', phones:'#ff7a8a'},
];

const W=512, H=1024;          // 纸的像素
export const PAPER_H=2.75;    // 世界高度（脚到发顶）
const PX=H/PAPER_H, PAPER_W=W/PX;
const INK='#2c2440';
// mono：没有五官、全身一种绿、深绿线条描轮廓（像指示牌上的小人剪成的纸片）
const G1='#86e3ad',G2='#62d18f',GL='#1f7a4c';

// —— 画笔：同一套形状，按纸样决定描边 / 投影 ——
function pen(x,style,d){
  const deep=d?new Set([d.hair,d.shoes,d.bagColor,d.hat,d.cap,d.phones,d.scarf,d.pants].filter(Boolean)):new Set();
  return (draw,color,{line=true}={})=>{
    x.beginPath();draw(x);
    if(style==='mono'){x.fillStyle=deep.has(color)&&color!==d?.skin?G2:G1;x.fill();x.lineWidth=8;x.strokeStyle=GL;x.lineJoin='round';x.stroke();return;}
    x.fillStyle=color;
    if(style==='cut'){x.save();x.shadowColor='rgba(60,40,90,.28)';x.shadowBlur=9;x.shadowOffsetY=5;x.fill();x.restore();}
    else x.fill();
    if(style==='ink'&&line){x.lineWidth=7;x.strokeStyle=INK;x.lineJoin='round';x.stroke();}
  };
}
const rr=(x,a,b,w,h,r)=>x.roundRect(a,b,w,h,r);
const ell=(x,cx,cy,rx,ry)=>x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);

function drawPerson(x,d,mood,style){
  const F=pen(x,style,d),cx=256,mono=style==='mono';
  // mono 下所有“画上去”的装饰（字、扣子、条纹）都不画，或改成深绿细线
  const line=(c)=>mono?GL:c;
  const HY=318,HR=168;                // 头
  // 后层：长发、马尾、丸子、爆炸头
  if(d.hairStyle==='long')F(p=>rr(p,cx-185,HY-120,370,420,[150,150,60,60]),d.hair);
  if(d.hairStyle==='bob')F(p=>rr(p,cx-186,HY-150,372,300,[170,170,70,70]),d.hair);
  if(d.hairStyle==='pony')F(p=>{p.moveTo(cx+140,HY-40);p.quadraticCurveTo(cx+270,HY+40,cx+200,HY+250);p.quadraticCurveTo(cx+170,HY+120,cx+110,HY+40);p.closePath();},d.hair);
  if(d.hairStyle==='bun')F(p=>ell(p,cx,HY-170,74,66),d.hair);
  if(d.hairStyle==='afro')F(p=>{for(let i=0;i<14;i++){const a=i/14*Math.PI*2;p.moveTo(cx+Math.cos(a)*170+70,HY-20+Math.sin(a)*150);p.arc(cx+Math.cos(a)*170,HY-20+Math.sin(a)*150,70,0,Math.PI*2);}},d.hair,{line:false});
  if(d.hairStyle==='afro'&&(style==='ink'||mono)){x.beginPath();ell(x,cx,HY-20,236,214);x.lineWidth=mono?8:7;x.strokeStyle=mono?GL:INK;x.stroke();}
  // 腿和鞋
  const dress=d.top==='dress';
  for(const s of [-1,1]){
    F(p=>rr(p,cx+s*46-24,820,48,150,18),dress?d.skin:d.pants);
    F(p=>ell(p,cx+s*52,972,44,26),d.shoes);
  }
  // 身体
  const body=p=>{
    if(dress){p.moveTo(cx-100,560);p.lineTo(cx+100,560);p.quadraticCurveTo(cx+118,700,cx+170,860);p.quadraticCurveTo(cx,885,cx-170,860);p.quadraticCurveTo(cx-118,700,cx-100,560);p.closePath();}
    else rr(p,cx-118,548,236,300,[70,70,40,40]);
  };
  F(body,d.topColor);
  const clip=()=>{x.save();x.beginPath();body(x);x.clip();};
  if(d.top==='hoodie'){
    F(p=>rr(p,cx-80,720,160,86,30),d.accent);
    x.strokeStyle=line('#ffffff');x.lineWidth=mono?5:7;x.lineCap='round';for(const s of [-1,1]){x.beginPath();x.moveTo(cx+s*26,575);x.lineTo(cx+s*30,650);x.stroke();}
  } else if(d.top==='puffer'){
    clip();x.strokeStyle=mono?GL:'rgba(255,255,255,.55)';x.lineWidth=mono?5:7;for(const y of [620,690,760,830]){x.beginPath();x.moveTo(cx-130,y);x.quadraticCurveTo(cx,y+16,cx+130,y);x.stroke();}
    if(!mono){x.fillStyle='rgba(255,255,255,.8)';x.fillRect(cx-4,548,8,300);}x.restore();
  } else if(d.top==='sweater'){
    clip();if(mono){x.strokeStyle=GL;x.lineWidth=5;for(const y of [650,690]){x.beginPath();x.moveTo(cx-130,y);x.lineTo(cx+130,y);x.stroke();}}
    else{x.fillStyle=d.accent;x.fillRect(cx-130,650,260,40);x.fillStyle='#ffffff';for(let i=0;i<6;i++){x.beginPath();x.arc(cx-100+i*40,670,8,0,Math.PI*2);x.fill();}}x.restore();
  } else if(d.top==='cardigan'){
    F(p=>{p.moveTo(cx-38,552);p.lineTo(cx+38,552);p.lineTo(cx+22,848);p.lineTo(cx-22,848);p.closePath();},d.accent);
    if(!mono){x.fillStyle='#ffd23f';for(let i=0;i<4;i++){x.beginPath();x.arc(cx+46,610+i*60,9,0,Math.PI*2);x.fill();}}
  } else if(d.top==='tee'){
    if(!mono){F(p=>ell(p,cx,690,66,66),'#ffffff');
    x.fillStyle=d.topColor;x.font="900 38px 'Arial Black',Arial";x.textAlign='center';x.textBaseline='middle';x.fillText('SALE',cx,693);}
  } else if(dress&&!mono){
    x.fillStyle='#ffffff';x.font="900 70px Arial";x.textAlign='center';x.textBaseline='middle';x.fillText('♥',cx,700);
    clip();x.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<9;i++){x.beginPath();x.arc(cx-150+i*38,850,12,0,Math.PI*2);x.fill();}x.restore();
  }
  // 包
  if(d.bag==='tote'){
    x.strokeStyle=line(d.bagColor);x.lineWidth=12;x.beginPath();x.arc(cx+160,770,44,Math.PI,0);x.stroke();
    F(p=>rr(p,cx+105,770,112,118,16),d.bagColor);
    if(!mono)x.fillStyle='#ffffff';else x.fillStyle='rgba(0,0,0,0)';x.font="900 40px 'Arial Black',Arial";x.textAlign='center';x.textBaseline='middle';x.fillText('BF',cx+161,830);
  } else if(d.bag==='shoulder'){
    x.strokeStyle=line('#8a5a44');x.lineWidth=10;x.beginPath();x.moveTo(cx+90,560);x.lineTo(cx-120,770);x.stroke();
    F(p=>rr(p,cx-205,760,110,84,22),d.bagColor);
    if(!mono)F(p=>ell(p,cx-150,780,12,12),'#ffffff',{line:false});
  } else if(d.bag==='basket'){
    F(p=>rr(p,cx-232,740,130,98,14),'#ff7a8a');
    if(!mono){x.fillStyle='#ffe3e8';for(let i=0;i<4;i++)x.fillRect(cx-218+i*30,760,10,64);}
    F(p=>ell(p,cx-196,736,24,26),'#ffe066');F(p=>rr(p,cx-160,708,34,40,6),'#5cc8ff');
  }
  if(d.scarf){F(p=>rr(p,cx-112,532,224,48,24),d.scarf);F(p=>rr(p,cx+40,560,46,110,16),d.scarf);}
  // 脖子、耳朵、脸
  F(p=>rr(p,cx-34,470,68,90,20),d.skin,{line:false});
  for(const s of [-1,1])F(p=>ell(p,cx+s*162,HY+28,34,40),d.skin);
  F(p=>ell(p,cx,HY,HR,HR*.96),d.skin);
  // 刘海 / 帽子
  const cap=(edge,scallops,depth)=>F(p=>{
    p.moveTo(cx-HR-8,edge);p.bezierCurveTo(cx-HR-14,HY-HR*1.25,cx+HR+14,HY-HR*1.25,cx+HR+8,edge);
    for(let i=scallops;i>=0;i--){const t=i/scallops,xx=cx-HR+2*HR*t;p.lineTo(xx,edge+(i%2?depth:0));}
    p.closePath();
  },d.hair);
  if(d.hairStyle==='bob')cap(HY-40,10,34);
  else if(d.hairStyle==='long')cap(HY-50,8,30);
  else if(d.hairStyle==='bun')cap(HY-64,12,22);
  else if(d.hairStyle==='pony')cap(HY-56,8,28);
  else if(d.hairStyle==='short')cap(HY-80,14,18);
  else if(d.hairStyle==='afro')cap(HY-92,10,14);
  else if(d.hairStyle==='beanie'){
    cap(HY-64,10,20);
    F(p=>{p.moveTo(cx-HR-10,HY-70);p.bezierCurveTo(cx-HR,HY-HR*1.55,cx+HR,HY-HR*1.55,cx+HR+10,HY-70);p.closePath();},d.hat);
    F(p=>rr(p,cx-HR-16,HY-96,2*HR+32,52,26),d.hat);
    if(!mono){x.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<9;i++)x.fillRect(cx-HR+6+i*38,HY-92,10,44);}
    F(p=>ell(p,cx,HY-HR*1.2,40,38),'#ffffff');
  }
  if(d.cap){
    F(p=>{p.moveTo(cx-HR-6,HY-62);p.bezierCurveTo(cx-HR,HY-HR*1.45,cx+HR,HY-HR*1.45,cx+HR+6,HY-62);p.closePath();},d.cap);
    F(p=>ell(p,cx+40,HY-62,150,26),d.cap);
    if(!mono)F(p=>ell(p,cx,HY-HR*.98,12,12),'#ffffff',{line:false});
  }
  if(d.phones){
    if(mono){x.strokeStyle=GL;x.lineWidth=30;x.beginPath();x.arc(cx,HY+20,HR+18,Math.PI*1.08,Math.PI*1.92);x.stroke();x.strokeStyle=G2;x.lineWidth=16;x.stroke();}
    else{x.strokeStyle=d.phones;x.lineWidth=22;x.beginPath();x.arc(cx,HY+20,HR+18,Math.PI*1.08,Math.PI*1.92);x.stroke();}
    for(const s of [-1,1])F(p=>rr(p,cx+s*170-28,HY-10,56,84,24),d.phones);
  }
  if(mono)return;   // 没有五官
  if(d.earrings)for(const s of [-1,1])F(p=>ell(p,cx+s*166,HY+78,12,12),d.earrings,{line:false});
  // 五官
  const ey=HY+24,ex=62;
  for(const s of [-1,1]){
    x.fillStyle='rgba(255,110,130,.45)';x.beginPath();ell(x,cx+s*104,HY+82,32,20);x.fill();
    const X=cx+s*ex;
    x.fillStyle=INK;
    if(mood===1){x.beginPath();x.moveTo(X-22,ey-6+(s<0?-6:6));x.lineTo(X+22,ey-6+(s<0?6:-6));x.lineTo(X+18,ey+16);x.lineTo(X-18,ey+16);x.closePath();x.fill();}
    else{x.beginPath();ell(x,X,ey,mood===3?20:17,mood===3?28:22);x.fill();
      x.fillStyle='#ffffff';x.beginPath();x.arc(X+6,ey-10,7,0,Math.PI*2);x.fill();x.beginPath();x.arc(X-6,ey+10,3.5,0,Math.PI*2);x.fill();}
    x.strokeStyle=d.hair;x.lineWidth=10;x.lineCap='round';x.beginPath();
    const by=ey-52;
    if(mood===1){x.moveTo(X-s*26,by-10);x.lineTo(X+s*24,by+12);}
    else if(mood===2){x.moveTo(X-24,by+2);x.lineTo(X+24,by+2);}
    else{x.moveTo(X-24,by+6);x.quadraticCurveTo(X,by-10,X+24,by+6);}
    x.stroke();
  }
  if(d.freckles){x.fillStyle='rgba(170,90,50,.5)';for(const s of [-1,1])for(let k=0;k<3;k++){x.beginPath();x.arc(cx+s*(92+k*14),HY+70-(k%2)*10,4,0,Math.PI*2);x.fill();}}
  if(d.mole){x.fillStyle='#5a3424';x.beginPath();x.arc(cx+52,HY+108,4.5,0,Math.PI*2);x.fill();}
  if(d.glasses){x.strokeStyle=d.glasses;x.lineWidth=8;for(const s of [-1,1]){x.beginPath();x.arc(cx+s*ex,ey,42,0,Math.PI*2);x.stroke();}x.beginPath();x.moveTo(cx-20,ey);x.lineTo(cx+20,ey);x.stroke();}
  const my=HY+96;
  x.lineCap='round';
  if(mood===3){x.fillStyle='#8a2b45';x.beginPath();x.moveTo(cx-30,my);x.quadraticCurveTo(cx,my+46,cx+30,my);x.closePath();x.fill();
    x.fillStyle='#ff8a9e';x.beginPath();ell(x,cx,my+22,14,8);x.fill();}
  else if(mood===2){x.strokeStyle='#8a2b45';x.lineWidth=8;x.beginPath();x.moveTo(cx-18,my+12);x.quadraticCurveTo(cx,my+18,cx+18,my+12);x.stroke();}
  else {x.strokeStyle='#8a2b45';x.lineWidth=8;x.beginPath();x.moveTo(cx-26,my+22);x.quadraticCurveTo(cx-12,my+4,cx,my+14);x.quadraticCurveTo(cx+12,my+4,cx+26,my+22);x.stroke();
    x.fillStyle='rgba(240,70,80,.35)';for(const s of [-1,1]){x.beginPath();ell(x,cx+s*104,HY+82,40,26);x.fill();}}
}

function drawArm(x,d,style){
  const F=pen(x,style,d);
  F(p=>rr(p,32,8,64,190,30),d.topColor);
  F(p=>ell(p,64,214,30,30),d.skin);
}

// 白边 / 纸张肌理，最后统一加
function finish(src,style){
  const out=document.createElement('canvas');out.width=src.width;out.height=src.height;const o=out.getContext('2d');
  if(style==='sticker'){
    const edge=document.createElement('canvas');edge.width=src.width;edge.height=src.height;const e=edge.getContext('2d');
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;e.drawImage(src,Math.cos(a)*12,Math.sin(a)*12);}
    e.globalCompositeOperation='source-in';e.fillStyle='#ffffff';e.fillRect(0,0,edge.width,edge.height);
    o.save();o.shadowColor='rgba(70,50,110,.32)';o.shadowBlur=10;o.shadowOffsetY=6;o.drawImage(edge,0,0);o.restore();
  }
  o.drawImage(src,0,0);
  if(style==='cut'){
    // 纸纹：细小的明暗颗粒，只落在人物上
    o.globalCompositeOperation='source-atop';
    for(let i=0;i<2600;i++){o.fillStyle=i%2?'rgba(255,255,255,.10)':'rgba(80,60,100,.07)';o.fillRect(Math.random()*out.width,Math.random()*out.height,3,2);}
    o.globalCompositeOperation='source-over';
  }
  return out;
}
const textures=new Map();
function texture(key,w,h,draw,style){
  if(textures.has(key))return textures.get(key);
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));
  const t=new T.CanvasTexture(finish(c,style));t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
  textures.set(key,t);return t;
}
const plane=new Map();
const planeGeo=(w,h,ox,oy)=>{const k=[w,h,ox,oy].join();if(!plane.has(k)){const g=new T.PlaneGeometry(w,h);g.translate(ox,oy,0);plane.set(k,g);}return plane.get(k);};
const shadowMat=new T.MeshBasicMaterial({color:0x40305a,transparent:true,opacity:.22,depthWrite:false});
const shadowGeo=new T.CircleGeometry(.5,32);

// 和 3D 顾客同样的接口：root.userData.setMood / arms；多一个 card（始终朝向镜头的那张纸）
export function paperCustomer(index,style='sticker'){
  const d=PAPER_DESIGNS[index%PAPER_DESIGNS.length];
  const root=new T.Group(),card=new T.Group();root.add(card);
  const mat=new T.MeshBasicMaterial({transparent:true,alphaTest:.5,side:T.DoubleSide,toneMapped:false});
  const bodyMap=m=>texture(`p${index}/${m}/${style}`,W,H,x=>drawPerson(x,d,m,style),style);
  mat.map=bodyMap(3);
  const geo=planeGeo(PAPER_W,PAPER_H,0,PAPER_H/2);
  // 纸板厚度：后面错开一点的一层浅紫灰
  const back=new T.Mesh(geo,new T.MeshBasicMaterial({map:mat.map,color:0xb8acd0,transparent:true,alphaTest:.5,side:T.DoubleSide,toneMapped:false}));
  back.position.set(.025,-.018,-.03);card.add(back);
  card.add(new T.Mesh(geo,mat));
  const armMap=texture(`arm${index}/${style}`,128,256,x=>drawArm(x,d,style),style);
  const armMat=new T.MeshBasicMaterial({map:armMap,transparent:true,alphaTest:.5,side:T.DoubleSide,toneMapped:false});
  const arms=[];
  for(const s of [-1,1]){
    const arm=new T.Group();arm.position.set(s*118/PX,(H-560)/PX,.02);arm.rotation.z=s*.22;card.add(arm);
    arm.add(new T.Mesh(planeGeo(128/PX,256/PX,0,-104/PX),armMat));
    arms.push(arm);
  }
  const blob=new T.Mesh(shadowGeo,shadowMat);blob.rotation.x=-Math.PI/2;blob.scale.set(1.2,.55,1);blob.position.y=.012;root.add(blob);
  let shown=3;
  root.userData.setMood=mood=>{
    if(mood===shown)return;shown=mood;
    mat.map=bodyMap(mood);back.material.map=mat.map;mat.needsUpdate=back.material.needsUpdate=true;
  };
  root.userData.arms=arms;root.userData.card=card;root.userData.paper=true;
  return root;
}
