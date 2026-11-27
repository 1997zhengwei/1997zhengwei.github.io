const serif='"Noto Serif CJK SC", "Songti SC", SimSun, serif';
const sans='"Microsoft YaHei", "PingFang SC", sans-serif';
const format=new Intl.NumberFormat('zh-CN');
const width=1200,height=1500;

function metal(ctx,y,depth){
  const gold=ctx.createLinearGradient(0,y,0,y+depth);
  for(const [position,color] of [[0,'#fff4bb'],[.22,'#fcd77c'],[.46,'#b87127'],[.58,'#e2a445'],[.78,'#ffe589'],[1,'#a66e29']]){
    gold.addColorStop(position,color);
  }
  return gold;
}

function type(ctx,text,x,y,size,color,{face=sans,weight=700,maxWidth=width-170}={}){
  ctx.fillStyle=color;
  ctx.font=`${weight} ${size}px ${face}`;
  ctx.fillText(text,x,y,maxWidth);
}

function poly(ctx,points,fill){
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for(const p of points.slice(1))ctx.lineTo(...p);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
}

function jewel(ctx,x,y,r){
  poly(ctx,[[x,y-r],[x+r*.82,y],[x,y+r],[x-r*.82,y]],metal(ctx,y-r,2*r));
  poly(ctx,[[x,y-r*.68],[x+r*.52,y],[x,y+r*.71],[x-r*.52,y]],'#a9e5c3');
  poly(ctx,[[x,y-r*.68],[x+r*.52,y],[x,y+r*.71],[x-r*.11,y]],'#238467');
}

function corner(ctx,x,y,sx,sy){
  ctx.save();ctx.translate(x,y);ctx.scale(sx,sy);
  ctx.strokeStyle=metal(ctx,-9,112);ctx.lineWidth=5;ctx.lineCap='round';
  for(const scale of [1,.71,.44]){
    ctx.beginPath();ctx.moveTo(0,125*scale);ctx.bezierCurveTo(0,28*scale,28*scale,0,125*scale,0);ctx.stroke();
  }
  ctx.beginPath();ctx.moveTo(28,88);ctx.bezierCurveTo(22,62,42,37,77,42);ctx.bezierCurveTo(101,48,76,72,57,58);ctx.stroke();
  jewel(ctx,24,23,12);
  ctx.restore();
}

function laurel(ctx,x,y,side,length){
  ctx.save();ctx.translate(x,y);ctx.scale(side*length/100,length/100);
  ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-61,-9,-81,-92);
  ctx.lineWidth=3.2;ctx.strokeStyle='#e9b85d';ctx.stroke();
  for(let i=0;i<7;i++){
    const p=i/7,x=-17-63*p,y=-5-73*p*p;
    for(const side of [-1,1]){
      ctx.save();ctx.translate(x,y);ctx.rotate(-.47-i*.11+side*.53);
      ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-11,-12,-5,-29+i*.75);
      ctx.quadraticCurveTo(8,-14,0,0);
      ctx.fillStyle=metal(ctx,-31,31);ctx.fill();ctx.restore();
    }
  }
  ctx.restore();
}

function royalSeal(ctx){
  const x=600,y=219;
  const rays=ctx.createRadialGradient(x,y,58,x,y,251);
  rays.addColorStop(0,'#ffda6188');rays.addColorStop(1,'#eeb14d00');
  ctx.fillStyle=rays;ctx.fillRect(x-251,y-251,502,502);
  for(let i=0;i<36;i++){
    const a=i*Math.PI/18,r=i%3===0?175:137;
    ctx.beginPath();ctx.moveTo(x+Math.cos(a)*94,y+Math.sin(a)*94);
    ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.lineWidth=i%3===0?2:1;
    ctx.strokeStyle='#efcf8066';ctx.stroke();
  }
  laurel(ctx,x-72,y+83,1,102);laurel(ctx,x+72,y+83,-1,102);
  const shield=[[x-90,y-66],[x,y-46],[x+90,y-66],[x+78,y+34],[x+52,y+73],[x,y+104],[x-52,y+73],[x-78,y+34]];
  ctx.save();ctx.shadowColor='#000b';ctx.shadowBlur=24;ctx.shadowOffsetY=10;
  poly(ctx,shield,metal(ctx,y-66,178));ctx.restore();
  const enamel=ctx.createLinearGradient(x-65,y-54,x+86,y+106);
  enamel.addColorStop(0,'#59ac78');enamel.addColorStop(.5,'#0e5343');enamel.addColorStop(1,'#112e2a');
  poly(ctx,shield.map(([a,b])=>[x+(a-x)*.88,y+(b-y)*.88]),enamel);
  poly(ctx,[[x,y-16],[x-32,y+25],[x-16,y+25],[x-44,y+51],[x-7,y+51],[x-7,y+66],[x+7,y+66],[x+7,y+51],
    [x+44,y+51],[x+16,y+25],[x+32,y+25]],metal(ctx,y-16,82));
  poly(ctx,[[x-54,y-105],[x-28,y-96],[x,y-119],[x+28,y-96],[x+54,y-105],[x+44,y-68],[x-44,y-68]],metal(ctx,y-120,53));
  jewel(ctx,x,y-91,13);
}

function panel(ctx,x,y,w,h,r,fill,stroke){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
  ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();
}

function medal(ctx,x,y,mark){
  const gold=metal(ctx,y-44,88);
  poly(ctx,[[x-34,y-34],[x-5,y-33],[x-19,y+53],[x-32,y+45],[x-48,y+50]],'#1c765d');
  poly(ctx,[[x+34,y-34],[x+5,y-33],[x+19,y+53],[x+32,y+45],[x+48,y+50]],'#1c765d');
  const points=Array.from({length:24},(_,i)=>{
    const a=(i/24-.25)*Math.PI*2,r=i%2?37:44;
    return [x+Math.cos(a)*r,y+Math.sin(a)*r];
  });
  poly(ctx,points,gold);
  ctx.beginPath();ctx.arc(x,y,33,0,Math.PI*2);ctx.fillStyle='#754017';ctx.fill();
  ctx.beginPath();ctx.arc(x,y,28,0,Math.PI*2);ctx.fillStyle='#ffe5a0';ctx.fill();
  ctx.strokeStyle='#d69a4b';ctx.lineWidth=3;ctx.stroke();
  type(ctx,mark,x,y,mark.length>2?21:25,'#613309');
}

export function drawHonorCard(company,drawMap){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';
  const velvet=ctx.createRadialGradient(600,278,40,600,570,1000);
  velvet.addColorStop(0,'#28644b');velvet.addColorStop(.48,'#133b30');velvet.addColorStop(1,'#061811');
  ctx.fillStyle=velvet;ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='#e3ca7a16';ctx.lineWidth=1;
  for(let x=-height;x<width;x+=28){
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+height,height);ctx.stroke();
  }
  for(const [gap,line] of [[17,8],[33,2],[47,2],[63,1]]){
    ctx.strokeStyle=metal(ctx,0,height);ctx.lineWidth=line;ctx.strokeRect(gap,gap,width-2*gap,height-2*gap);
  }
  corner(ctx,47,47,1,1);corner(ctx,width-47,47,-1,1);
  corner(ctx,47,height-47,1,-1);corner(ctx,width-47,height-47,-1,-1);
  royalSeal(ctx);
  type(ctx,'松谷木业 · 荣誉证书',600,351,33,'#f8df9f',{face:serif});
  ctx.save();ctx.shadowColor='#000a';ctx.shadowBlur=12;ctx.shadowOffsetY=5;
  type(ctx,company.title,600,431,93,metal(ctx,375,109),{face:serif,weight:900});ctx.restore();
  ctx.lineWidth=2;ctx.strokeStyle='#bb8c45';ctx.beginPath();ctx.moveTo(193,495);ctx.lineTo(1007,495);ctx.stroke();
  jewel(ctx,600,495,14);

  const map=document.createElement('canvas');map.width=1056;map.height=390;
  drawMap(map,company);
  panel(ctx,132,533,936,378,22,'#0b211a',metal(ctx,533,378));
  ctx.save();ctx.beginPath();ctx.roundRect(142,543,916,338,14);ctx.clip();
  ctx.drawImage(map,142,543,916,338);ctx.restore();
  type(ctx,'商业版图',600,894,20,'#f9dc8d',{face:serif});

  const stats=[['建成工厂',format.format(company.sites.size)],['累计交付',format.format(company.shipped)],
    ['完成订单',format.format(company.contracts)],['库存峰值',format.format(company.peak)]];
  stats.forEach(([name,value],i)=>{
    const x=132+237*i;
    panel(ctx,x,942,225,110,15,'#123529','#976b31');
    type(ctx,value,x+112.5,978,43,'#ffde8f',{face:serif,maxWidth:200});
    type(ctx,name,x+112.5,1025,25,'#fae8b7');
  });

  const badges=company.badges(),earned=badges.filter(b=>b.value>=b.total);
  type(ctx,`已获勋章 ${earned.length} / ${badges.length}`,600,1095,27,'#ffde8f',{face:serif});
  if(!earned.length){type(ctx,'完成首单后点亮第一枚勋章',600,1246,29,'#e6d7a7');}
  earned.forEach((badge,i)=>{
    const batch=Math.floor(i/4),count=Math.min(4,earned.length-batch*4);
    const x=600+((i%4)-(count-1)/2)*220,y=1173+batch*128;
    medal(ctx,x,y,badge.mark);
    type(ctx,badge.name,x,y+67,24,'#fbe9b4',{maxWidth:213});
  });
  jewel(ctx,600,1436,14);
  return canvas.toDataURL('image/png');
}
