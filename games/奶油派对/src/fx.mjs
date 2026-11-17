// 可爱粒子特效：爱心、星星、闪光、泡泡、彩带。一块 2D 画布盖在游戏上（不挡触控）。
const TAU=Math.PI*2;
export const PASTEL=['#ff8fbf','#ffb3d4','#ffd36e','#c6a6ff','#8fd8ff','#9fe8c4','#ffffff','#ff7aa8'];
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];

function heart(c,s){c.beginPath();c.moveTo(0,s*.35);c.bezierCurveTo(-s*1.1,-s*.35,-s*.45,-s*1.05,0,-s*.45);c.bezierCurveTo(s*.45,-s*1.05,s*1.1,-s*.35,0,s*.35);c.closePath();}
function star(c,s){c.beginPath();for(let i=0;i<10;i++){const r=i%2?s*.45:s,a=i/10*TAU-Math.PI/2;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();}
function spark(c,s){c.beginPath();c.moveTo(0,-s);c.quadraticCurveTo(s*.12,-s*.12,s,0);c.quadraticCurveTo(s*.12,s*.12,0,s);c.quadraticCurveTo(-s*.12,s*.12,-s,0);c.quadraticCurveTo(-s*.12,-s*.12,0,-s);c.closePath();}

export class Fx{
  constructor(host){
    this.host=host;this.canvas=document.createElement('canvas');this.canvas.id='fx';this.canvas.setAttribute('aria-hidden','true');
    host.append(this.canvas);this.c=this.canvas.getContext('2d');this.p=[];this.ambient=false;this.ambT=0;this.dirty=false;
    this.calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
    new ResizeObserver(()=>this.resize()).observe(host);this.resize();
  }
  resize(){const r=this.host.getBoundingClientRect();this.w=r.width;this.h=r.height;this.dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=Math.round(r.width*this.dpr);this.canvas.height=Math.round(r.height*this.dpr);}
  // client 坐标 → 画布坐标
  local(x,y){const r=this.host.getBoundingClientRect();return [x-r.left,y-r.top];}
  add(o){if(this.p.length>420)this.p.shift();this.p.push(o);}
  burst(cx,cy,{n=12,colors=PASTEL,kinds=['heart','star','spark'],speed=170,size=[5,11],g=240,life=[.55,1.05],up=40,spin=4}={}){
    if(this.calm)n=Math.ceil(n/3);const [x,y]=this.local(cx,cy);
    for(let i=0;i<n;i++){const a=rnd(0,TAU),v=rnd(.35,1)*speed;this.add({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-up,g,drag:1.6,life:0,max:rnd(...life),s:rnd(...size),rot:rnd(-.5,.5),vr:rnd(-spin,spin),k:pick(kinds),col:pick(colors),tw:rnd(8,16)});}
  }
  // 挤奶油时从嘴尖冒出的小爱心/闪光
  puff(cx,cy,color){const [x,y]=this.local(cx,cy);const k=Math.random()<.55?'heart':Math.random()<.6?'spark':'dot';
    this.add({x:x+rnd(-6,6),y:y+rnd(-6,6),vx:rnd(-50,25),vy:rnd(-95,-35),g:-20,drag:1.2,life:0,max:rnd(.55,.95),s:k==='heart'?rnd(4,7.5):rnd(3,6),rot:rnd(-.4,.4),vr:rnd(-2,2),k,col:Math.random()<.45?color:pick(['#ffffff','#ffc2dc','#ff8fbf','#ffe27a']),tw:rnd(10,18)});}
  // 刮刀刀边的闪烁星光
  glint(cx,cy){const [x,y]=this.local(cx,cy);this.add({x,y,vx:rnd(-12,12),vy:rnd(-30,-6),g:0,drag:2,life:0,max:rnd(.35,.7),s:rnd(4,9),rot:0,vr:0,k:'spark',col:pick(['#ffffff','#fff4b8','#ffd6ea','#d9f2ff']),tw:rnd(14,22)});}
  // 结算庆祝：从顶部落下爱心、星星、彩带
  rain(n=70){if(this.calm)n=Math.ceil(n/4);for(let i=0;i<n;i++){const k=pick(['heart','heart','star','ribbon','ribbon','dot']);this.add({x:rnd(0,this.w),y:rnd(-this.h*.5,-10),vx:rnd(-40,40),vy:rnd(60,170),g:120,drag:.35,life:0,max:rnd(2.2,3.6),s:k==='ribbon'?rnd(5,8):rnd(6,12),rot:rnd(0,TAU),vr:rnd(-5,5),k,col:pick(PASTEL.slice(0,6).concat(['#ff7aa8'])),tw:rnd(4,8),sway:rnd(1.5,3),ph:rnd(0,TAU)});}}
  ambientTick(dt){if(!this.ambient||this.calm)return;this.ambT+=dt;if(this.ambT<.32)return;this.ambT=0;const bubble=Math.random()<.6;
    this.add({x:rnd(10,this.w-10),y:this.h+10,vx:0,vy:rnd(-42,-24),g:0,drag:0,life:0,max:rnd(7,10),s:bubble?rnd(5,13):rnd(5,8),rot:rnd(-.3,.3),vr:rnd(-.4,.4),k:bubble?'bubble':pick(['heart','star']),col:pick(['#ffb3d4','#ffd36e','#c6a6ff','#8fd8ff','#ff8fbf']),tw:rnd(2,4),sway:rnd(.8,1.6),ph:rnd(0,TAU),soft:true});}
  update(dt){
    this.ambientTick(dt);
    const c=this.c,P=this.p;
    if(!P.length){if(this.dirty){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);this.dirty=false;}return;}
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);this.dirty=true;
    for(let i=P.length-1;i>=0;i--){
      const o=P[i];o.life+=dt;if(o.life>=o.max||o.y>this.h+40){P.splice(i,1);continue;}
      const f=Math.exp(-o.drag*dt);o.vx*=f;o.vy=o.vy*f+o.g*dt;
      o.x+=o.vx*dt+(o.sway?Math.sin(o.life*o.sway+o.ph)*24*dt:0);o.y+=o.vy*dt;o.rot+=o.vr*dt;
      const t=o.life/o.max,grow=Math.min(1,o.life*9);
      let alpha=o.soft?Math.min(1,o.life*1.5)*(1-t)*.55:(t<.7?1:1-(t-.7)/.3);
      let scale=grow*(o.k==='spark'?.65+.35*Math.abs(Math.sin(o.life*o.tw)):1);
      c.setTransform(this.dpr*scale,0,0,this.dpr*scale,o.x*this.dpr,o.y*this.dpr);c.rotate(o.rot);c.globalAlpha=Math.max(0,alpha);
      const s=o.s;
      if(o.k==='heart'){heart(c,s);c.fillStyle=o.col;c.fill();c.globalAlpha*=.75;c.fillStyle='#ffffff';c.beginPath();c.ellipse(-s*.38,-s*.45,s*.18,s*.11,-.6,0,TAU);c.fill();}
      else if(o.k==='star'){star(c,s);c.fillStyle=o.col;c.fill();c.lineWidth=s*.16;c.strokeStyle='#ffffffaa';c.stroke();}
      else if(o.k==='spark'){spark(c,s);c.fillStyle=o.col;c.fill();}
      else if(o.k==='ribbon'){c.scale(1,Math.cos(o.life*o.tw));c.fillStyle=o.col;c.beginPath();c.roundRect(-s*.5,-s*1.1,s,s*2.2,s*.35);c.fill();}
      else if(o.k==='bubble'){c.beginPath();c.arc(0,0,s,0,TAU);c.fillStyle=o.col+'55';c.fill();c.lineWidth=1.4;c.strokeStyle=o.col;c.stroke();c.fillStyle='#ffffffcc';c.beginPath();c.ellipse(-s*.35,-s*.4,s*.28,s*.16,-.6,0,TAU);c.fill();}
      else {c.beginPath();c.arc(0,0,s*.55,0,TAU);c.fillStyle=o.col;c.fill();}
    }
    c.globalAlpha=1;
  }
}
