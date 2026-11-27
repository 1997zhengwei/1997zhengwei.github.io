import {T,box,drum,group} from './geometry.js';

const textures=new Map();
function ink(key,w,h,draw){
  if(!textures.has(key)){
    const image=document.createElement('canvas');image.width=w;image.height=h;
    draw(image.getContext('2d'),w,h);
    const t=new T.CanvasTexture(image);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;textures.set(key,t);
  }
  return textures.get(key);
}
function surface(parent,x,y,z,w,h,map,flat=false,opacity=1,lit=false){
  const params={map,transparent:true,opacity,depthWrite:lit,polygonOffset:true,polygonOffsetFactor:-1};
  const mat=lit?new T.MeshStandardMaterial({...params,roughness:.48,metalness:.035}):new T.MeshBasicMaterial(params);
  const obj=new T.Mesh(new T.PlaneGeometry(w,h),mat);
  if(flat)obj.rotation.x=-Math.PI/2;obj.position.set(x,y,z);obj.receiveShadow=lit;obj.userData.disposable=true;parent.add(obj);return obj;
}
function lines(c,points,color,width){
  c.beginPath();c.strokeStyle=color;c.lineWidth=width;points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
// Night floors: each map has its own material, drawn once into a canvas.
const floorStyles={
  sun:{base:'#d9c9a6',draw(c,w,h){
    const n=6;for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      const x=i*w/n,y=j*h/n;c.fillStyle=(i+j)%2?'#e8dcc0':'#c9b48c';c.fillRect(x,y,w/n,h/n);
      c.fillStyle='rgba(255,255,255,.18)';for(let k=0;k<3;k++){c.beginPath();c.ellipse(x+((i*37+k*53)%100)/100*w/n,y+((j*61+k*29)%100)/100*h/n,22,5,.6,0,7);c.fill();}
    }
    c.strokeStyle='#b8913f';c.lineWidth=5;for(let i=0;i<=n;i++){c.beginPath();c.moveTo(i*w/n,0);c.lineTo(i*w/n,h);c.stroke();c.beginPath();c.moveTo(0,i*h/n);c.lineTo(w,i*h/n);c.stroke();}
    c.fillStyle='#e9c25a';for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){c.save();c.translate(i*w/n,j*h/n);c.rotate(Math.PI/4);c.fillRect(-8,-8,16,16);c.restore();}
  }},
  tide:{base:'#9a6a40',draw(c,w,h){
    const tones=['#a8774a','#9a6a40','#b5824f','#8f5f38'],rows=12;
    for(let j=0;j<rows;j++){
      let x=-((j*97)%180);const y=j*h/rows;
      while(x<w){const len=180+((x*7+j*13)%140);c.fillStyle=tones[(j+Math.floor(x/90))%4];c.fillRect(x,y,len,h/rows);
        c.fillStyle='rgba(60,35,20,.55)';c.fillRect(x,y,3,h/rows);
        c.fillStyle='rgba(255,230,190,.12)';c.fillRect(x+6,y+4,len-12,3);
        c.fillStyle='#5c3d27';c.beginPath();c.arc(x+10,y+12,3,0,7);c.arc(x+10,y+h/rows-12,3,0,7);c.fill();
        c.strokeStyle='rgba(70,40,20,.25)';c.lineWidth=2;c.beginPath();c.moveTo(x+30,y+h/rows*.45);c.bezierCurveTo(x+len*.4,y+h/rows*.2,x+len*.6,y+h/rows*.8,x+len-20,y+h/rows*.5);c.stroke();
        x+=len;}
      c.fillStyle='rgba(40,22,12,.6)';c.fillRect(0,y,w,3);
    }
  }},
  clock:{base:'#585377',draw(c,w,h){
    const n=5;for(let j=0;j<n;j++)for(let i=0;i<n;i++){c.fillStyle=['#5d5880','#544f75','#615b86'][(i*2+j)%3];c.fillRect(i*w/n+3,j*h/n+3,w/n-6,h/n-6);
      c.fillStyle='rgba(255,255,255,.08)';c.fillRect(i*w/n+3,j*h/n+3,w/n-6,4);}
    c.save();c.translate(w/2,h/2);c.strokeStyle='#c9a04f';c.fillStyle='rgba(201,160,79,.25)';c.lineWidth=7;
    const gear=(r,teeth)=>{c.beginPath();for(let k=0;k<teeth*2;k++){const a=k*Math.PI/teeth,rr=k%2?r:r+r*.16;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fill();c.stroke();
      c.beginPath();c.arc(0,0,r*.35,0,7);c.stroke();};
    gear(150,14);c.translate(250,-260);gear(80,9);c.translate(-520,560);gear(95,10);c.restore();
  }},
  candy:{base:'#ffd6e8',draw(c,w,h){
    const n=8;for(let j=0;j<n;j++)for(let i=0;i<n;i++){c.fillStyle=(i+j)%2?'#f2c4da':'#e07fae';c.fillRect(i*w/n,j*h/n,w/n,h/n);}
    const cols=['#5be3b8','#ffd24a','#62a8ff','#ffffff','#c48af5'];
    for(let k=0;k<160;k++){c.save();c.translate((k*131)%w,(k*257)%h);c.rotate(k);c.fillStyle=cols[k%5];c.fillRect(-9,-3,18,6);c.restore();}
  }}
};
export function tileFloor(p,cfg,x=0,z=0){
  const style=floorStyles[cfg.theme]||floorStyles.sun;
  const map=ink('floor-'+cfg.theme,1024,1024,(c,w,h)=>{c.fillStyle=style.base;c.fillRect(0,0,w,h);style.draw(c,w,h);});
  return surface(p,x,.009,z,9,9,map,true,1,true);
}
// Runner carpet down the middle of display halls.
export function carpet(p,theme,x,z,w,d,rot=0){
  const map=ink('carpet-'+theme,128,512,(c,W,H)=>{
    const [a,b,e]=theme==='tide'?['#2f5f7a','#3f7d9b','#e9c27a']:theme==='clock'?['#5b2f6b','#76408a','#e9c25a']:theme==='candy'?['#5bc8b0','#7fe0c8','#ffffff']:['#8f2230','#b0303f','#e9c25a'];
    c.fillStyle=a;c.fillRect(0,0,W,H);c.fillStyle=b;c.fillRect(12,0,W-24,H);c.fillStyle=e;c.fillRect(6,0,4,H);c.fillRect(W-10,0,4,H);
    for(let y=20;y<H;y+=64){c.save();c.translate(W/2,y);c.rotate(Math.PI/4);c.strokeStyle=e;c.lineWidth=3;c.strokeRect(-14,-14,28,28);c.restore();}
  });
  const m=surface(p,x,.02,z,w,d,map,true,.95,true);m.rotation.z=rot;return m;
}
// Additive radial glow for lamp pools, relic beacons and beams.
export function glow(p,x,y,z,size,color,opacity=.5,flat=true){
  const t=ink('glow',128,128,(c,W,H)=>{const g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,W,H);});
  const mat=new T.MeshBasicMaterial({map:t,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  const m=new T.Mesh(new T.PlaneGeometry(size,size),mat);if(flat)m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.userData.disposable=true;m.renderOrder=1;p.add(m);return m;
}
// Soft vertical light shaft that marks loot from across the map.
export function shaft(p,x,z,h,r,color,opacity=.35){
  const t=ink('shaft',16,128,(c,W,H)=>{const g=c.createLinearGradient(0,H,0,0);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,W,H);});
  const mat=new T.MeshBasicMaterial({map:t,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false});
  const m=new T.Mesh(new T.CylinderGeometry(r*.7,r,h,20,1,true),mat);m.position.set(x,h/2,z);m.userData.disposable=true;m.renderOrder=2;p.add(m);return m;
}export function sign(p,x,y,z,w,h,title,sub='',bg='#17304c',accent='#6fe4ec'){
  const map=ink([title,sub,bg,accent].join('/'),512,144,(c,W,H)=>{
    c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle=accent;c.fillRect(0,0,10,H);
    c.font='bold '+(sub?61:72)+'px Segoe UI, sans-serif';c.fillStyle='#f5f9ff';c.fillText(title,29,sub?77:99,458);
    if(sub){c.fillStyle=accent;c.font='bold 25px Segoe UI, sans-serif';c.fillText(sub,32,119,454);}
  });
  return surface(p,x,y,z,w,h,map);
}
const noteTexture=()=>ink('banknote',192,92,(c,w,h)=>{
  c.fillStyle='#8ce995';c.fillRect(0,0,w,h);c.strokeStyle='#328959';c.lineWidth=4;c.strokeRect(5,5,w-10,h-10);
  c.lineWidth=1;c.strokeRect(11,11,w-22,h-22);
  for(const x of [23,169])for(const y of [23,69]){c.fillStyle='#478f60';c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fill();}
  c.fillStyle='#478f60';c.beginPath();c.ellipse(95,46,29,31,0,0,Math.PI*2);c.fill();
  c.fillStyle='#dbf3a2';c.font='bold 36px Georgia';c.textAlign='center';c.fillText('S',95,59);
  for(const x of [37,132])for(let i=0;i<4;i++)lines(c,[[x,34+i*6],[x+23,34+i*6]],'#579f69',2);
});
export function noteSurface(p){
  return surface(p,0,0,0,.39,.226,noteTexture(),true);
}
export function bankStack(p,x,y,z,scale=1,tiers=1){
  const g=group(p,x,y,z);g.scale.setScalar(scale);
  for(let n=0;n<tiers;n++){
    const a=group(g,.015*(n%2),.106*n,0);a.rotation.y=(n%3-1)*.048;
    box(a,0,.050,0,.48,.100,.27,'#469959');
    box(a,0,.099,0,.48,.016,.27,'#98e985');
    for(const h of [.03,.060])box(a,0,h,.137,.47,.009,.006,'#99c872');
    box(a,0,.055,0,.094,.116,.278,'#fff0a1');
    for(const s of [-1,1])box(a,s*.164,.112,0,.05,.006,.102,'#51a96a');
  }
  return g;
}
export function contact(p,x,z,w,d,opacity=.35){
  const t=ink('ambient',96,96,(c,W,H)=>{const g=c.createRadialGradient(48,48,0,48,48,47);g.addColorStop(0,'rgba(24,39,76,.92)');g.addColorStop(.42,'rgba(25,47,82,.65)');g.addColorStop(1,'rgba(45,62,98,0)');c.fillStyle=g;c.fillRect(0,0,W,H);});
  return surface(p,x,.034,z,w,d,t,true,opacity);
}
export function glassPanel(p,x,y,z,w,h,rotation=0){
  const mat=new T.MeshPhysicalMaterial({color:'#a3dff2',transparent:true,opacity:.19,roughness:.14,metalness:.12,side:T.DoubleSide,depthWrite:false});
  const pane=new T.Mesh(new T.PlaneGeometry(w,h),mat);pane.position.set(x,y,z);pane.rotation.y=rotation;pane.userData.disposable=true;p.add(pane);
}
export function screen(p,x,y,z,w,h,code='SEC'){
  const tex=ink('live-'+code,256,144,(c,W,H)=>{
    c.fillStyle='#102845';c.fillRect(0,0,W,H);c.fillStyle='#56d9ce';c.fillRect(13,13,7,7);c.font='bold 12px sans-serif';c.fillText(code,30,21);
    c.strokeStyle='#294a61';c.lineWidth=1;for(let i=0;i<8;i++){c.strokeRect(14+i*28,40,28,66);}
    lines(c,[[14,97],[43,89],[66,95],[80,62],[101,71],[120,53],[145,67],[169,49],[207,62],[241,43]],'#69ecce',4);
    c.fillStyle='#52788c';c.fillRect(15,119,70,4);c.fillRect(97,119,30,4);
  });
  return surface(p,x,y,z,w,h,tex);
}

