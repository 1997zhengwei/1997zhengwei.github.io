import {T,clamp,ease,mix,dispose,buildRig,poseRig,bladeZ,bladeRadius} from './models.js';
import {gemContact} from './pickup.js';
import {workshop,crystalModel,gemSpec} from './workshop.js';
import {makeWall,debris,bottom,binX,binZ} from './masonry.js';
import {sparks as makeSparks,blasts as makeBlasts} from './fx.js';
import {audioKit} from './audio.js';
import {levels} from './levels.js';
import {readGarage,saveGarage,specs,finishes,jobs} from './garage.js';
import {setupGarage} from './garage-ui.js';
import {treasury} from './finale.js';

const $=id=>document.getElementById(id);
const canvas=$('view'), shell=$('game'), arena=$('arena'), pops=$('pops');
const ray=new T.Raycaster(), plane=new T.Plane(new T.Vector3(0,0,1),-.44);
const touchPoint=new T.Vector2(), touchWorld=new T.Vector3(), projected=new T.Vector3();
const desired=new T.Vector2(), tip=new T.Vector2(), previousTip=new T.Vector2(), keys=new Set();
const bounded=new T.Vector2(), offset=new T.Vector3(), lookTarget=new T.Vector3();
const audio=audioKit($('sound'));
const camera=new T.OrthographicCamera(-6,6,6,-6,.1,95);
const scene=new T.Scene();
const home=new T.Vector3(.05,5.25,.15);
const eye=new T.Vector3(4.25,9.05,24.2);
const BLAST=1.25;
// Vibrate only after the player has touched the page, so the browser never logs a refusal.
const buzz=ms=>{if(navigator.userActivation?.hasBeenActive)navigator.vibrate?.(ms);};
const lootIcon={coin:'art-coin',fuel:'art-can',tnt:'art-tnt'}, lootName={coin:'方孔钱',fuel:'油桶',tnt:'TNT'};
let renderer,root,wall,rig,board,dust,spark,blast,level,index,goal,reachMark,gems=[],focusGem=null,finaleBurst=false;
let mode='dig', pointer=null, dragging=false, resultTime=0, comboTime=0, dustTime=0, hitTime=0;
let clock=0,shake=0,flash=0,engaged=false,contacting=false,strokeRequested=false;
let feedback='', feedbackUntil=0, previous=0, lastClear=-1;
let lockTap=null,returnToVault=false;
let baseChips=0,showedBraceHint=false;
let garage,tool,fuel=0,started=false,lastFuel=-1,lastLocks=-1;
// Juice and economy state for the current trip.
let heat=0,slowmo=0,focus=0,pending=[],trip=0,brickPaid=0,swallowedTotal=0,inflight=0,dug={coin:0,fuel:0,tnt:0};
let burned=0,endless=false,finaleRoom=null,finaleTime=0,nextFirework=0,steelToldAt=0,crushTime=0,nextClack=0,nextCrunch=0,coached=true,frozen=false,dryTold=false,resultToken=0;
const account=readGarage();
let saved={};
try{saved=JSON.parse(localStorage.getItem('shovel-treasure-v1'))||{};}catch{}
function saveProgress(){
  try{localStorage.setItem('shovel-treasure-v1',JSON.stringify(saved));}catch{}
}

function setup(){
  renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:new URLSearchParams(location.search).has('dev')});
  renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=.98;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  const hemi=new T.HemisphereLight('#fffdf4','#a0afbd',1.08);scene.add(hemi);
  const sun=new T.DirectionalLight('#fff2dc',2.05);sun.position.set(-5,11,8);
  sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-9,right:9,top:13,bottom:-13,near:1,far:30});
  sun.shadow.bias=-.0003;sun.shadow.normalBias=.019;scene.add(sun);
  const rim=new T.DirectionalLight('#cde8ff',.76);rim.position.set(5,5,-4);scene.add(rim);

  const lighting=new T.Scene();lighting.background=new T.Color('#859a9e');
  const white=new T.Mesh(new T.PlaneGeometry(11,8),new T.MeshBasicMaterial({color:new T.Color(4,3.2,2.7),side:T.DoubleSide}));
  white.position.set(-4,5,6);white.lookAt(0,0,0);lighting.add(white);
  const blue=new T.Mesh(new T.PlaneGeometry(6,9),new T.MeshBasicMaterial({color:new T.Color(.9,2,3.4),side:T.DoubleSide}));
  blue.position.set(5,3,1);blue.lookAt(0,0,0);lighting.add(blue);
  const generator=new T.PMREMGenerator(renderer);
  scene.environment=generator.fromScene(lighting,.12).texture;
  scene.environmentIntensity=.48;
  generator.dispose();dispose(lighting);
  garage=setupGarage(account,levels,{load,restart:()=>load(index,returnToVault),pause:stopInput,
    resume:()=>{previous=0;canvas.focus({preventScroll:true});},tune,inflight:()=>inflight,finale:()=>showFinale(),
    say:message=>{audio.wake();say(message,2.5);canvas.focus({preventScroll:true});}});
  const entry=Number(new URLSearchParams(location.search).get('stage'));
  load(Number.isInteger(entry)&&entry>=1&&entry<=levels.length?entry-1:0);
  resize();new ResizeObserver(resize).observe(canvas);
  requestAnimationFrame(frame);
}

function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w||!h||!renderer)return;
  renderer.setSize(w,h,false);
  const aspect=w/h;
  const width=finaleRoom?Math.max(11.9,aspect*13.0):Math.max(11.62,aspect*(h<435?18.7:17)),height=width/aspect;
  camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;
  camera.updateProjectionMatrix();
  if(finaleRoom)layoutPlinths();
  if(!$('coach').hidden)placeCoach();
}
function stopInput(){
  keys.clear();pointer=null;lockTap=null;dragging=engaged=contacting=strokeRequested=false;audio.hum(false,false);
}
function tune(){
  const before=tool.tank;tool=specs(account,index);fuel=Math.min(tool.tank,fuel+tool.tank-before);
  rig.finish(finishes[account.skin],tool.scale,account.ranks.tank);lastFuel=-1;updateFuel();
}
function updateFuel(){
  const pct=Math.ceil(100*fuel/tool.tank);if(lastFuel===pct)return;lastFuel=pct;
  $('fuel-fill').style.transform='scaleY('+pct/100+')';$('fuel-pct').textContent=pct+'%';
  $('gauge').setAttribute('aria-valuenow',String(pct));$('gauge').classList.toggle('low',pct<=24);
}

// ---- screen helpers, floating text and coin flights ----
function screen(x,y,z=.9,frame=shell){
  projected.set(x,y,z).project(camera);
  const c=canvas.getBoundingClientRect(),f=frame.getBoundingClientRect();
  return [(projected.x+1)*c.width/2+c.left-f.left,(1-projected.y)*c.height/2+c.top-f.top];
}
function popAt(text,kind,x,y,z=.9){
  const [sx,sy]=screen(x,y,z),el=document.createElement('div');
  el.className='pop '+kind;el.textContent=text;el.style.left=sx+'px';el.style.top=sy+'px';
  el.addEventListener('animationend',()=>el.remove());pops.append(el);
}
function bumpWallet(){
  const w=$('cash').parentElement;w.classList.remove('bump');void w.offsetWidth;w.classList.add('bump');
}
function flyCoins(from,amount){
  const w=$('cash').parentElement.getBoundingClientRect(),f=shell.getBoundingClientRect();
  const to=[w.left-f.left+16,w.top-f.top+w.height/2];
  const n=Math.min(amount,6);
  for(let i=0;i<n;i++){
    const value=Math.floor(amount/n)+(i<amount%n?1:0);
    const el=document.createElementNS('http://www.w3.org/2000/svg','svg');el.setAttribute('class','fly-coin');
    el.innerHTML='<use href="#art-coin"/>';pops.append(el);
    const x0=from[0]+(Math.random()-.5)*26,y0=from[1]+(Math.random()-.5)*16;
    const mx=mix(x0,to[0],.4)+(Math.random()-.5)*40,my=Math.min(y0,to[1])-60-Math.random()*50;
    const anim=el.animate([
      {transform:`translate(${x0}px,${y0}px) scale(.5)`},
      {transform:`translate(${mx}px,${my}px) scale(1.2)`,offset:.45},
      {transform:`translate(${to[0]}px,${to[1]}px) scale(.75)`},
    ],{duration:640+i*55,delay:i*55,easing:'cubic-bezier(.5,0,.55,1)',fill:'both'});
    anim.onfinish=()=>{el.remove();inflight=Math.max(0,inflight-value);garage.sync();bumpWallet();audio.pay();};
  }
}
function credit(amount,from){
  if(amount<=0)return;
  account.cash+=amount;trip+=amount;saveGarage(account);
  if(from&&!frozen){inflight+=amount;flyCoins(from,amount);}
  garage.sync();
}
function settleBricks(){
  const due=Math.floor(wall.stats().removed/20)-brickPaid;
  if(due>0){brickPaid+=due;credit(due);}
}
function startCut(){
  if(mode!=='dig')return;
  if(wall.building())wall.build(0,true);
  if(!started){started=true;$('ready').hidden=true;say(wall.anchors.length?'切松金色铆钉，再取宝石':'按住切割，松手省油',2);}
  audio.wake();
}

function brief(){
  const card=$('brief');card.style.animation='none';void card.offsetWidth;card.style.animation='';
  $('brief-tag').textContent=level.tag||'';$('brief-gem').textContent=gems.map(g=>g.spec.name).join(' + ');
  const loot=jobs[index].loot||{};
  $('brief-loot').innerHTML=Object.entries(loot).filter(([,n])=>n).map(([k,n])=>
    `<span title="${lootName[k]}"><svg aria-hidden="true"><use href="#${lootIcon[k]}"/></svg>×${n}</span>`).join('')+
    (wall.anchors.length?`<span>金扣×${wall.anchors.length}</span>`:'')+(wall.steel?'<span class="steel">钢砖</span>':'');
  const best=saved[index]?.stars||0;
  $('brief-goals').innerHTML=['取宝','剩油22%','剩油40%+连塌70'].map((t,i)=>
    `<li class="${best>i?'done':''}"><i>${'★'.repeat(i+1)}</i>${t}</li>`).join('');
}
function placeCoach(){
  const pin=wall.mounts[0];if(!pin)return;
  const a=screen(pin.base.x-1.25,pin.base.y-.05,.9,arena),b=screen(pin.base.x+.55,pin.base.y-.05,.9,arena);
  const coach=$('coach');
  coach.style.setProperty('--x0',a[0]-16+'px');coach.style.setProperty('--y0',a[1]-3+'px');
  coach.style.setProperty('--x1',b[0]-16+'px');coach.style.setProperty('--y1',b[1]-3+'px');
  coach.hidden=false;
}
function builtUp(){
  shake=Math.max(shake,.05);audio.collapse(6);
  dust.impact(wall.gemX,40);
  if(!coached)placeCoach();
}

function load(number,fromVault=false){
  if(wall)settleBricks();
  const leavingVault=!!finaleRoom;
  $('finale').hidden=true;$('plinths').hidden=true;$('plinths').replaceChildren();
  shell.classList.remove('finale-on');finaleRoom=null;returnToVault=fromVault;
  index=(number+levels.length)%levels.length;level=levels[index];
  stopInput();if(root)dispose(root);
  root=new T.Group();scene.add(root);
  board=workshop(root,level,index);
  wall=makeWall(root,level,index);
  gems=wall.spots.map((spot,k)=>{
    const prize=crystalModel(root,level,index,k);
    const g={k,prize,touches:gemContact(prize.jewel),goal:new T.Vector3(spot.x,spot.y,-.32),state:'buried',at:0,t:0,spec:gemSpec(level,index,k)};
    prize.gemRoot.position.copy(g.goal);prize.gemRoot.scale.setScalar(.61);prize.jewel.rotation.y=.24;
    return g;
  });
  focusGem=gems[0];goal=gems[0].goal;
  rig=buildRig(root);dust=debris(root);spark=makeSparks(root);blast=makeBlasts(root);
  tool=specs(account,index);fuel=tool.tank;started=false;lastFuel=lastLocks=-1;
  rig.finish(finishes[account.skin],tool.scale,account.ranks.tank);updateFuel();
  const arc=Array.from({length:27},(_,i)=>{const a=-.21+i*.42/26;return new T.Vector3(Math.cos(a),Math.sin(a),0);});
  reachMark=new T.Line(new T.BufferGeometry().setFromPoints(arc),new T.LineDashedMaterial({color:'#fff8d3',dashSize:.025,gapSize:.015,depthTest:false,transparent:true,opacity:.9}));
  reachMark.computeLineDistances();reachMark.position.set(rig.pivot.x,rig.pivot.y,bladeZ+.03);
  reachMark.visible=false;reachMark.renderOrder=2;root.add(reachMark);
  for(const [prop,val] of [['sky',level.sky],['base',level.low],['accent',level.accent]])shell.style.setProperty('--'+prop,val);
  $('site').textContent=level.name;$('stage-number').textContent=String(index+1).padStart(2,'0');
  garage.map(index,saved);$('ready').hidden=false;
  desired.set(-1.31,index===1?4.30:4.05);tip.copy(desired);
  mode='dig';pointer=null;keys.clear();resultTime=comboTime=dustTime=hitTime=shake=flash=0;
  dragging=strokeRequested=false;previousTip.copy(tip);
  engaged=contacting=false;feedback='';feedbackUntil=0;lastClear=-1;
  baseChips=0;showedBraceHint=false;
  heat=slowmo=focus=crushTime=0;pending=[];trip=brickPaid=swallowedTotal=0;burned=0;dug={coin:0,fuel:0,tnt:0};dryTold=false;
  resultToken++;
  coached=index!==0||!!saved[0]?.cleared;$('coach').hidden=true;
  $('result').hidden=$('combo').hidden=true;
  $('hint').textContent=level.intro;
  $('target-note').textContent='点收宝石';
  brief();updateHUD();
  if(leavingVault){placeCamera(0);resize();}
}

function updateHUD(){
  const stats=wall.stats();
  const stored=gems.filter(g=>g.state==='hauling'||g.state==='stored').length;
  const key=stats.clear+'|'+stats.opened+'|'+stored+'|'+mode;
  if(lastClear===key)return;
  lastClear=key;lastLocks=stats.opened;
  const p=(stats.clear/stats.count+stats.opened)/(1+stats.locks);
  $('objective').textContent=mode==='haul'||mode==='won'?'宝石已收取':mode==='exposed'?'宝石已露出':
    (stats.locks?'金扣 '+stats.opened+'/'+stats.locks+' · ':'')+(gems.length>1?'宝石 '+stored+'/'+gems.length:level.gem);
  $('progress').setAttribute('aria-valuenow',String(Math.round(p*100)));
  $('progress-fill').style.transform='scaleX('+p+')';
}

function pointerRay(event){
  const r=canvas.getBoundingClientRect();
  touchPoint.set((event.clientX-r.left)*2/r.width-1,1-(event.clientY-r.top)*2/r.height);
  ray.setFromCamera(touchPoint,camera);
}
function aimAt(event){
  pointerRay(event);
  if(ray.ray.intersectPlane(plane,touchWorld)){
    desired.set(clamp(touchWorld.x,-4.92,5.62),clamp(touchWorld.y,.30,12.16));
    if(mode==='crumbling'||mode==='exposed')strokeRequested=dragging||aimedNearGem();
  }
}
function aimedNearGem(){return gems.some(g=>g.state==='exposed'&&Math.hypot(desired.x-g.goal.x,desired.y-g.goal.y)<2.02);}
function tappedLockedGem(e){
  if(mode!=='dig'||!wall.anchors.some(a=>!a.open)||wall.building())return false;
  const stats=wall.stats();
  const rect=canvas.getBoundingClientRect();
  pointerRay(e);
  return gems.some(g=>{
    const seal=stats.gems[g.k];
    if(g.state!=='buried'||!seal.clear)return false;
    const jewel=g.prize.jewel;
    jewel.updateWorldMatrix(true,false);
    const hit=ray.intersectObject(jewel,false)[0];
    if(hit)return !wall.occludes(ray,hit.distance);
    // Give a fully uncovered gem a fingertip-sized target on narrow screens.
    if(seal.clear!==seal.count||!wall.openView(g.k))return false;
    jewel.getWorldPosition(projected).project(camera);
    return Math.hypot(e.clientX-rect.left-(1+projected.x)*rect.width/2,
      e.clientY-rect.top-(1-projected.y)*rect.height/2)<20;
  });
}
function beginStroke(e){
  startCut();
  pointer=e.pointerId;dragging=false;try{canvas.setPointerCapture(pointer);}catch{}audio.wake();
  camera.updateMatrixWorld();
  aimAt(e);hitTime=.12;
}
canvas.addEventListener('pointerdown',e=>{
  if((e.button!==0 && e.pointerType==='mouse')||pointer!==null||lockTap||!['dig','crumbling','exposed'].includes(mode)||!renderer)return;
  if(tappedLockedGem(e)){
    lockTap={id:e.pointerId,x:e.clientX,y:e.clientY};
    canvas.setPointerCapture(e.pointerId);return;
  }
  beginStroke(e);
});
canvas.addEventListener('pointermove',e=>{
  if(lockTap?.id===e.pointerId){
    if(Math.hypot(e.clientX-lockTap.x,e.clientY-lockTap.y)<8)return;
    lockTap=null;beginStroke(e);
  }
  if(e.pointerId===pointer){dragging=true;aimAt(e);}
});
for(const ev of ['pointerup','pointercancel','lostpointercapture']){
  canvas.addEventListener(ev,e=>{
    if(lockTap?.id===e.pointerId){
      lockTap=null;
      const left=wall.anchors.filter(a=>!a.open).length;
      if(ev==='pointerup'&&left){wall.flashLocks();say('还有 '+left+' 枚金扣，锯开闪光处',1.8);}
    }
    if(e.pointerId===pointer){pointer=null;if(ev!=='pointerup')strokeRequested=false;audio.hum(false,false);}
  });
}
window.addEventListener('blur',stopInput);
window.addEventListener('keydown',e=>{
  if(!renderer||$('drawer').open||!['dig','crumbling','exposed'].includes(mode)||e.target.closest?.('button'))return;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))return;
  e.preventDefault();if(e.code==='Space'&&!keys.has('Space')){startCut();hitTime=.12;audio.wake();feedbackUntil=0;}
  keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
$('play').onclick=()=>{startCut();canvas.focus({preventScroll:true});};
$('again').onclick=()=>load(index,returnToVault);
$('next').onclick=()=>{
  if(mode==='won'&&(returnToVault||index===levels.length-1)){showFinale();return;}
  if(mode==='empty')load(index,returnToVault);else load(index+1);
};
$('finale-again').onclick=()=>load(0);
$('finale-close').onclick=()=>{load(levels.length-1);$('map').click();};
$('target').onclick=()=>{
  const g=gems.find(o=>o.state==='exposed');if(!g)return;
  audio.wake();desired.set(g.goal.x,g.goal.y);strokeRequested=true;
};

function say(text,seconds){feedback=text;feedbackUntil=clock+seconds;}
function collapse(count,x,y){
  comboTime=1.7;
  const c=$('combo');
  $('combo-title').textContent=count>=70?'惊天崩塌':count>=40?'大崩塌':'连片坍塌';
  $('combo-count').textContent=count;
  c.className='combo'+(count>=70?' huge':count>=40?' big':'');
  c.hidden=true;void c.offsetWidth;c.hidden=false;
  dust.burst(x,y,level.palette[1],17,1.23);
  audio.collapse(count);shake=Math.max(shake,Math.min(.16,.042+count*.0003));
  if(count>=48)buzz(32);
}
// Shared bookkeeping after anything knocks bricks loose: saw bites and dynamite alike.
function afterBreak(r,x,y){
  if(r.falling>=14)collapse(r.falling,x,y);
  else if(r.count)shake=Math.max(shake,.028);
  const stats=wall.stats();
  if(r.opened){audio.loosen();say('金扣松开！ '+stats.opened+'/'+stats.locks,1.1);popAt('金扣松开','lock',x,y+.6);}
  else if(r.unbolted){audio.loosen();dust.burst(x,y,'#69d9ff',10,.58);say('蓝栓已锯开',1.2);popAt('蓝栓断开','pin',x,y+.6);}
  const unlocked=stats.opened===stats.locks;
  for(const g of gems){
    const st=stats.gems[g.k];
    if(g.state==='buried'&&unlocked&&st.clear>=st.count){g.state='crumbling';g.at=clock+.59;}
  }
  if(mode==='dig'&&gems.every(g=>g.state!=='buried')){
    mode='crumbling';say('砖块正在崩落',.62);
  }else if(mode==='dig'&&!unlocked&&r.count&&gems.some(g=>stats.gems[g.k].clear>=stats.gems[g.k].count)){
    say('宝石周围已清空，还要松开金扣',1.25);
  }
  updateHUD();
}
function dig(dt){
  const active=engaged&&mode==='dig';
  contacting=false;
  if(active){
    hitTime+=dt;
    if(hitTime>=.082){
      hitTime=0;
      const beforeFuel=fuel,result=wall.hit(tip.x,tip.y,tool);
      const spend=result.contact?1.05+result.count*.035:.82;burned+=spend;
      if(!endless)fuel=Math.max(0,fuel-spend);updateFuel();
      if(beforeFuel>tool.tank*.22&&fuel<=tool.tank*.22)say('剩油不多，松手可以停锯',1.4);
      contacting=result.contact;
      if(result.contact){
        audio.chip();dust.burst(tip.x,tip.y,level.palette[1],result.count?8:4,.58);
        if(result.at){
          // Sparks leave the rim where the teeth meet brick, along the spin direction.
          const ang=Math.atan2(result.at.y-tip.y,result.at.x-tip.x);
          const reach=Math.min(Math.hypot(result.at.y-tip.y,result.at.x-tip.x),bladeRadius*tool.scale*.95);
          spark.emit(tip.x+Math.cos(ang)*reach,tip.y+Math.sin(ang)*reach,bladeZ+.12,Math.sin(ang),-Math.cos(ang),result.count?7:4,4.4+tool.power);
        }
        if(!coached){coached=true;$('coach').hidden=true;}
        if(result.steel&&!result.count){
          audio.clank();spark.burst(tip.x,tip.y,bladeZ,5,3.2);
          if(clock>steelToldAt){steelToldAt=clock+5;say('钢砖锯不动：用 TNT 炸开，或掏空它周围让它整片掉落',2.6);}
        }
      }
      if(!showedBraceHint&&result.count&&tip.y<3.3&&!result.unbolted){
        baseChips+=result.count;
        if(baseChips>=28&&wall.mounts.some(b=>b.state==='wall')){
          showedBraceHint=true;say('上方还有蓝栓支撑，试试从侧面下锯',2.3);
        }
      }
      afterBreak(result,tip.x,tip.y);
    }else{
      contacting=wall.near(tip.x,tip.y,tool.radius);
    }
  }
  for(const g of gems)if(g.state==='crumbling'&&clock>=g.at&&(wall.openView(g.k)||clock>=g.at+1.4))expose(g);
  if(mode==='crumbling'&&!gems.some(g=>g.state==='crumbling')){mode='exposed';updateHUD();}
}
function explode(p){
  const r=wall.blast(p.x,p.y,BLAST);
  blast.boom(p.x,p.y,.95,1);spark.burst(p.x,p.y,1,30,7.5);dust.burst(p.x,p.y,level.palette[1],22,1.7);
  flash=Math.max(flash,.36);shake=Math.max(shake,.22);audio.boom();buzz(50);
  popAt('轰！','boom',p.x,p.y+.2);
  afterBreak(r,p.x,p.y);
}
function collectLoot(){
  const {events,swallowed}=wall.take();
  for(const e of events){
    dug[e.type]++;
    if(e.type==='coin'){
      credit(3,screen(e.x,e.y));popAt('+$3','gold',e.x,e.y);audio.coin();spark.burst(e.x,e.y,1,8,2.6);
    }else if(e.type==='fuel'){
      fuel=Math.min(tool.tank,fuel+tool.tank*.22);updateFuel();dryTold=false;
      popAt('+22% 燃油','fuel',e.x,e.y);audio.glug();
      const g=$('gauge');g.classList.add('refill');setTimeout(()=>g.classList.remove('refill'),700);
    }else if(['dig','crumbling','exposed'].includes(mode)){
      pending.push({x:e.x,y:e.y,at:clock+.3});audio.fuse();spark.burst(e.x,e.y,1,12,2.4);
    }
  }
  if(swallowed){
    swallowedTotal+=swallowed;crushTime=.3;
    if(clock>=nextCrunch){audio.crunch();nextCrunch=clock+.14;}
    const due=Math.min(Math.floor(swallowedTotal/20),Math.floor(wall.stats().removed/20))-brickPaid;
    if(due>0){brickPaid+=due;credit(due,screen(binX,.2,binZ));}
  }
}
function expose(g){
  g.state='exposed';g.at=clock;focusGem=g;
  audio.reveal();flash=.3;shake=Math.max(shake,.06);slowmo=.85;
  dust.burst(g.goal.x,g.goal.y,g.spec.light,16,.95);spark.burst(g.goal.x,g.goal.y,1,26,4.2);
  say(gems.some(o=>o.state==='buried')?'一颗宝石露出来了，锯齿碰一下就收下':'锯齿碰到即可收取，也可以轻点宝石',2.4);
  updateHUD();
}
function collect(g){
  g.state='hauling';g.t=0;
  const record=saved[index]||{},collected=record.collected||[];
  if(!record.cleared&&!collected.includes(g.k)){
    saved[index]={...record,collected:[...collected,g.k]};saveProgress();
  }
  audio.pickup();flash=Math.max(flash,.2);buzz(20);
  dust.burst(g.goal.x,g.goal.y,g.spec.light,12,.55);
  if(gems.every(o=>o.state==='hauling'||o.state==='stored')){
    mode='haul';resultTime=0;finaleBurst=false;pointer=null;keys.clear();engaged=contacting=strokeRequested=false;
    audio.hum(false,false);$('target').hidden=true;
    say('宝石正在滚进收集槽',2.1);
  }else{
    const left=gems.filter(o=>o.state!=='hauling'&&o.state!=='stored').length;
    say('收下一颗！墙里还有 '+left+' 颗',2.2);
  }
  updateHUD();
}
function reveal(dt,elapsed){
  if(mode==='haul')resultTime+=elapsed;
  const finale=mode==='haul'||mode==='won', shown=finale&&resultTime>1.07, stats=wall.stats();
  for(const g of gems){
    const {gemRoot,jewel,stars,rays}=g.prize;
    let glow=0;
    if(g.state==='buried'||g.state==='crumbling'){
      const st=stats.gems[g.k],ratio=st.clear/st.count;
      gemRoot.visible=true;gemRoot.position.copy(g.goal);
      gemRoot.position.z=-.74+ratio*.23;
      gemRoot.scale.setScalar(.53+ratio*.17);
      jewel.material.emissiveIntensity=.075+ratio*.2;
      jewel.rotation.y=.24+Math.sin(clock*1.6+g.k)*.08;
    }else if(g.state==='exposed'){
      const rise=ease(clamp((clock-g.at)/.28,0,1));
      gemRoot.visible=true;
      gemRoot.position.set(g.goal.x,g.goal.y+.042*Math.sin(clock*4+g.k),mix(-.51,.61,rise));
      gemRoot.scale.setScalar(.88);
      jewel.material.emissiveIntensity=.29+Math.sin(clock*5)*.055;
      jewel.rotation.y+=dt*.55;
      g.sparkle=(g.sparkle||0)+dt;
      if(g.sparkle>.35){g.sparkle=0;dust.burst(g.goal.x,g.goal.y+.25,g.spec.light,2,.27);}
      glow=.8;
    }else{
      if(g.state==='hauling')g.t+=elapsed;
      if(g.state==='hauling'&&g.t<1.07){
        // Arc down onto the belt and into the hopper.
        const k=clamp(g.t/1.07,0,1),line=ease(k);
        gemRoot.visible=true;
        gemRoot.position.set(mix(g.goal.x,binX,k*.82+k*k*.18),mix(g.goal.y,.43,line)+Math.sin(Math.PI*k)*1.14,mix(.61,binZ+.27,line));
        gemRoot.scale.setScalar(.88-.27*k);jewel.rotation.x+=dt*7;jewel.rotation.y+=dt*4.3;
        glow=.35;
      }else if(!finale){
        if(g.state==='hauling'){
          g.state='stored';audio.coin();flash=Math.max(flash,.25);
          dust.burst(binX,.69,g.spec.light,18,1);
          const n=gems.filter(o=>o.state==='stored').length;
          popAt('宝石 '+n+'/'+gems.length,'gold',binX,1.2,binZ);
        }
        gemRoot.visible=false;
      }else if(!shown){
        gemRoot.visible=false;
      }else{
        // Every gem of the wall rises out of the hopper onto the display line.
        const k=ease(clamp((resultTime-1.07)/.60,0,1)),many=gems.length>1;
        const slot=.37+(g.k-(gems.length-1)/2)*(many?2.15:0),size=many?1.12:1.45;
        gemRoot.visible=true;
        gemRoot.position.set(mix(binX,slot,k),mix(.43,4.4,k)+Math.sin(Math.PI*k)*.47,mix(binZ+.27,2.6,k));
        gemRoot.scale.setScalar(mix(.61,size,k));
        jewel.rotation.x=mix(jewel.rotation.x,.19,1-Math.exp(-8*dt));jewel.rotation.y+=dt*1.44;
        jewel.material.emissiveIntensity=.26;glow=.95;
        if(!finaleBurst){
          finaleBurst=true;flash=.54;shake=.11;audio.prize();
          dust.burst(binX,.69,g.spec.light,26,1.27);spark.burst(.37,4.4,2.6,34,6);
        }
      }
    }
    const lit=g.state==='exposed'||shown&&gemRoot.visible;
    for(const [i,star] of stars.entries()){
      const a=clock*.82+i*Math.PI*2/stars.length;
      star.position.set(Math.cos(a)*1.06,Math.sin(a)*.86+.10,.62);
      const brightness=lit?(.4+.6*Math.sin(clock*3.2+i)**2):0;
      star.material.opacity=brightness;star.scale.setScalar(.7+brightness*.38);
      star.quaternion.copy(camera.quaternion);
    }
    rays.material.opacity+=(glow-rays.material.opacity)*(1-Math.exp(-5*dt));
    rays.visible=rays.material.opacity>.01;
    rays.position.set(0,0,-.25);rays.quaternion.copy(camera.quaternion);rays.rotateZ(clock*.32+g.k);
    rays.scale.setScalar(.92+.08*Math.sin(clock*2.3));
  }
  if(mode==='haul'&&resultTime>=1.98)finish();
}
function lootLine(){
  const parts=Object.entries(dug).filter(([,n])=>n).map(([k,n])=>`<svg aria-label="${lootName[k]}"><use href="#${lootIcon[k]}"/></svg>${n}`);
  return parts.length?parts.join(' '):'—';
}
function tally(rows){
  $('tally').innerHTML=rows.map(([k,v])=>`<li><span>${k}</span><b>${v}</b></li>`).join('');
}
function countEarn(total){
  const el=$('earn'),token=resultToken,steps=Math.min(24,Math.max(1,total));let i=0;
  el.textContent='0';
  const tickUp=()=>{
    if(token!==resultToken)return;
    i++;el.textContent=String(Math.round(total*i/steps));if(i%2)audio.count();
    if(i<steps)setTimeout(tickUp,32);
  };
  setTimeout(tickUp,520);
}
function showResult(){
  $('result').hidden=false;$('next').focus({preventScroll:true});
}
function showEmpty(){
  mode='empty';stopInput();settleBricks();resultToken++;
  const stats=wall.stats();
  $('rating').className='stars empty';$('rating').textContent='⛽';$('badge').hidden=true;
  $('prize-name').textContent='这箱油用完了';
  tally([['拆下砖块',stats.removed+' 块'],['最大连塌',stats.largest+' 块'],['挖出宝物',lootLine()]]);
  $('record-line').textContent=stats.opened<stats.locks?'下次先拆金扣附近的支撑':wall.loot.some(l=>l.type==='tnt'&&l.brick.loot)?'锯开 TNT，让它替你炸开支撑':'从细支撑下锯，更省油';
  countEarn(trip);
  $('next').textContent='免费加满，再开一趟';$('again').hidden=true;showResult();
}
function finish(){
  mode='won';settleBricks();resultToken++;
  const {largest}=wall.stats();
  const efficient=fuel/tool.tank,stars=1+Number(efficient>=.22)+Number(efficient>=.40&&largest>=70);
  const bonus=15+index*3+stars*5;credit(bonus,screen(.37,4.4,2.6));
  const before=saved[index];
  const record=!before?.cleared||stars>(before.stars||0);
  saved[index]={collapse:Math.max(largest,before?.collapse||0),stars:Math.max(stars,before?.stars||0),cleared:true};
  saveProgress();
  garage.map(index,saved);
  const rating=$('rating');rating.className='stars';rating.innerHTML='<i></i><i></i><i></i>';
  const token=resultToken;
  [...rating.children].forEach((star,i)=>setTimeout(()=>{
    if(token!==resultToken)return;
    star.classList.add('show');if(i<stars){star.classList.add('lit');audio.star(i);}
  },280+i*300));
  $('badge').hidden=!record;$('badge').textContent=before?.cleared?'星级新纪录':'首次发现';
  $('prize-name').textContent='发现 '+gems.map(g=>g.spec.name).join(' + ');
  tally([['剩余燃油',Math.ceil(efficient*100)+'%'],['最大连塌',largest+' 块'],['挖出宝物',lootLine()]]);
  $('record-line').textContent=stars===3?'满星通关！':stars===1?'剩油到 22% 就能拿第二颗星':
    efficient<.4?'剩油 40% 并且一次连塌 70 块，拿第三颗星':'再来一次连塌 70 块就是三星，TNT 很好用';
  countEarn(trip);
  $('again').hidden=false;
  $('next').textContent=returnToVault?'回到宝库':index<levels.length-1?'下一座墙':'打开宝库';
  showResult();
}
// Ending: swap the quarry for the treasury room and keep fireworks going.
function layoutPlinths(){
  const grid=$('plinths'),{topLeft,bottomRight}=finaleRoom;
  const [x,y]=screen(topLeft.x,topLeft.y,topLeft.z,arena);
  const [right,bottom]=screen(bottomRight.x,bottomRight.y,bottomRight.z,arena);
  Object.assign(grid.style,{left:x+'px',top:y+'px',width:right-x+'px',height:bottom-y+'px'});
}
function showFinale(){
  if(wall)settleBricks();
  mode='finale';stopInput();resultToken++;
  if(root)dispose(root);
  root=new T.Group();scene.add(root);
  spark=makeSparks(root);blast=makeBlasts(root);gems=[];focus=0;
  finaleRoom=treasury(root,levels,saved);finaleTime=0;nextFirework=.6;
  for(const id of ['result','ready','combo','target','hint','coach'])$(id).hidden=true;
  shell.classList.add('finale-on');
  shell.style.setProperty('--sky','#40347a');shell.style.setProperty('--base','#7a68b8');shell.style.setProperty('--accent','#ffd76a');
  const grid=$('plinths');grid.replaceChildren();
  for(const {index:i,offset} of finaleRoom.vacancies){
    const button=document.createElement('button');button.type='button';
    button.style.gridColumn=String(i%4+1);button.style.gridRow=String(Math.floor(i/4)+1);
    button.style.setProperty('--socket-x',(50+offset*100)+'%');
    button.title='第 '+(i+1)+' 关 · '+levels[i].name;button.setAttribute('aria-label','去寻宝：'+button.title);
    button.onclick=()=>{load(i,true);$('play').focus({preventScroll:true});};grid.append(button);
  }
  grid.hidden=!grid.childElementCount;
  const stars=levels.reduce((n,_,i)=>n+(saved[i]?.stars||0),0);
  const best=Math.max(0,...levels.map((_,i)=>saved[i]?.collapse||0));
  $('finale-title').textContent=finaleRoom.found===finaleRoom.total?'宝库已集齐！':'点空展台，去寻宝';
  $('finale-line').textContent='已通关 '+finaleRoom.clearedCount+'/'+levels.length+' 关 · 已收藏 '+finaleRoom.found+'/'+finaleRoom.total+' 颗宝石';
  $('finale-tally').innerHTML=[['总星数',stars+' / '+levels.length*3],['最大连塌',best+' 块'],['工钱','$'+account.cash]]
    .map(([k,v])=>`<li><span>${k}</span><b>${v}</b></li>`).join('');
  $('finale-again').textContent=stars<levels.length*3?'从第一关再刷三星':'从第一关再玩一遍';
  $('finale').hidden=false;
  camera.zoom=1;camera.position.set(0,7.7,24);camera.lookAt(0,7.7,0);camera.updateMatrixWorld();resize();
  flash=.7;audio.prize();setTimeout(()=>audio.prize(),650);
}
function placeCamera(dt){
  shake*=Math.exp(-9*dt);
  const fg=gems.find(g=>g.state==='exposed');
  if(fg)goal=fg.goal;
  const want=fg?(clock-fg.at<1.15?1:mode==='exposed'?.4:0):0;
  focus+=(want-focus)*(1-Math.exp(-4.5*dt));
  offset.set((goal.x-home.x)*.55*focus,(goal.y-home.y)*.55*focus,0);
  camera.zoom=1+.3*focus;camera.updateProjectionMatrix();
  camera.position.set(eye.x+offset.x+Math.sin(clock*74)*shake,eye.y+offset.y+Math.cos(clock*81)*shake,eye.z);
  camera.lookAt(lookTarget.copy(home).add(offset));camera.updateMatrixWorld();
}
function label(){
  const target=$('target');
  const open=gems.find(g=>g.state==='exposed'&&clock-g.at>.3);
  target.hidden=!open||mode==='haul'||mode==='won';
  if(!target.hidden){
    projected.set(open.goal.x,open.goal.y+.99,.65).project(camera);
    target.style.left=clamp((projected.x+1)*canvas.clientWidth/2,42,canvas.clientWidth-42)+'px';
    target.style.top=(1-projected.y)*canvas.clientHeight/2-11+'px';
  }
  const count=wall.stats().removed;
  const line=clock<feedbackUntil?feedback:
    mode==='exposed'||open?'轻点宝石，或用锯齿碰一下':
    mode==='haul'||mode==='won'?'宝石已找到':count===0?level.intro:'';
  if($('hint').textContent!==line)$('hint').textContent=line;
  $('hint').hidden=!line||mode==='won';
}
function tick(now){
  if(document.hidden||$('drawer').open){previous=0;return;}
  const elapsed=previous?(now-previous)/1000:0,dt=Math.min(elapsed,.048);previous=now;
  clock+=elapsed;
  if(mode==='finale'){
    finaleTime+=dt;finaleRoom.animate(dt);spark.animate(dt);blast.animate(dt,camera);
    if(finaleTime>nextFirework){
      nextFirework=finaleTime+.8+Math.random()*.9;
      const x=.37+(Math.random()-.5)*10,y=9+Math.random()*6;
      spark.burst(x,y,1.6,44,6.5);blast.boom(x,y,1.4,.55,false);audio.coin();
    }
    flash*=Math.exp(-6*dt);$('flash').style.opacity=flash;
    renderer.render(scene,camera);return;
  }
  // A brief slow-motion beat when the gem breaks free.
  const sdt=dt*(slowmo>0?.36:1);slowmo=Math.max(0,slowmo-elapsed);
  if(wall.building()){
    const landed=wall.build(dt);
    if(landed&&clock>=nextClack){audio.clack();nextClack=clock+.05;}
    if(!wall.building())builtUp();
  }
  const dx=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')),
    dy=Number(keys.has('ArrowUp'))-Number(keys.has('ArrowDown'));
  desired.x=clamp(desired.x+dx*6.3*dt,-4.92,5.62);
  desired.y=clamp(desired.y+dy*6.3*dt,bottom+.12,12.16);
  engaged=(pointer!==null||keys.has('Space'))&&(mode==='dig'&&fuel>0&&!wall.building()||mode==='exposed');
  if(mode==='exposed'&&(dx||dy))strokeRequested=true;
  if(mode==='haul'||mode==='won')desired.set(-2.9,1.1);
  previousTip.copy(tip);
  bounded.copy(desired);
  reachMark.visible=false;
  if(mode==='dig'){
    const vx=desired.x-rig.pivot.x,vy=desired.y-rig.pivot.y,r=Math.hypot(vx,vy);
    if(r>tool.reach){
      bounded.set(rig.pivot.x+vx*tool.reach/r,rig.pivot.y+vy*tool.reach/r);
      reachMark.visible=engaged;reachMark.scale.setScalar(tool.reach);reachMark.rotation.z=Math.atan2(vy,vx);
      if(engaged&&clock>=feedbackUntil)say('已到臂长上限，找找近处的接缝',1);
    }
    // Walk the blade along its path so a tap behind solid masonry still has to cut in.
    let budget=Math.min(elapsed,.16),dist=tip.distanceTo(bounded);
    while(budget>.0001&&dist>.004){
      const step=Math.min(.18,dist);let ux=(bounded.x-tip.x)/dist,uy=(bounded.y-tip.y)/dist;
      let nx=tip.x+ux*step,ny=tip.y+uy*step;
      // Steel stops the blade: it slides along a plate but never pushes into one.
      if(wall.steel){
        const here=wall.steelGap(tip.x,tip.y),ahead=wall.steelGap(nx,ny);
        if(ahead<.36&&ahead<here-1e-4){
          const e=.06,gx=wall.steelGap(tip.x+e,tip.y)-wall.steelGap(tip.x-e,tip.y),gy=wall.steelGap(tip.x,tip.y+e)-wall.steelGap(tip.x,tip.y-e),gl=Math.hypot(gx,gy);
          if(gl<1e-6)break;
          const into=ux*gx/gl+uy*gy/gl,sx=ux-Math.min(0,into)*gx/gl,sy=uy-Math.min(0,into)*gy/gl,sl=Math.hypot(sx,sy);
          if(sl<.25)break;
          ux=sx/sl;uy=sy/sl;nx=tip.x+ux*step;ny=tip.y+uy*step;
          const slid=wall.steelGap(nx,ny);if(slid<.36&&slid<here-1e-4)break;
        }
      }
      const solid=wall.near(nx,ny,.43);
      const speed=solid?(engaged?2.8+tool.power*.78:0):16;
      if(!speed)break;
      const move=Math.min(step,speed*budget);tip.x+=ux*move;tip.y+=uy*move;budget-=move/speed;dist-=move;
    }
  }else{
    const d=desired.distanceTo(tip);if(d>.004)tip.lerp(desired,Math.min(1,Math.min(elapsed,.18)*17/d));
  }
  placeCamera(dt);
  dig(dt);
  heat=contacting&&engaged?Math.min(1,heat+dt*.8):Math.max(0,heat-dt*1.5);rig.heat(heat);
  for(const impact of wall.animate(sdt,elapsed)){
    dust.burst(impact.x,.35,level.palette[1],Math.min(21,5+impact.count),1.10);
    if(impact.count>=12)dust.impact(impact.x,impact.count);
    if(impact.count>=6){shake=Math.max(shake,.08);audio.collapse(Math.min(25,impact.count*.12));}
  }
  collectLoot();
  for(let i=pending.length-1;i>=0;i--)if(clock>=pending[i].at){
    const p=pending.splice(i,1)[0];
    if(['dig','crumbling','exposed'].includes(mode))explode(p);
  }
  dust.animate(sdt);spark.animate(sdt);blast.animate(sdt,camera);reveal(sdt,elapsed);
  // Teeth touching a revealed gem collect it. With every gem out, only a deliberate stroke counts.
  for(const g of gems){
    if(g.state!=='exposed'||clock-g.at<.3)continue;
    const intent=mode!=='exposed'||strokeRequested||keys.has('Space')||pointer!==null&&(dragging||aimedNearGem());
    if(intent&&g.touches(previousTip,tip,camera,bladeZ,bladeRadius*tool.scale)){collect(g);break;}
  }
  if(strokeRequested&&tip.distanceToSquared(desired)<.0001)strokeRequested=false;
  if(mode==='dig'&&fuel<=0){
    // Out of fuel, but give falling chunks and lit dynamite the chance to finish the job.
    if(!pending.length&&!wall.busy()&&!gems.some(g=>['crumbling','exposed','hauling'].includes(g.state)))showEmpty();
    else if(!dryTold){dryTold=true;say('燃油耗尽……看看还会不会塌',2);}
  }
  audio.hum(engaged,contacting);
  poseRig(rig,tip.x,tip.y,engaged||strokeRequested,clock,dt);
  crushTime=Math.max(0,crushTime-dt);board.advance(dt,crushTime>0);
  board.pitRing.material.emissiveIntensity=(mode==='haul'||mode==='won')?1.25:.32+crushTime*1.6;
  flash*=Math.exp(-8*dt);$('flash').style.opacity=flash;
  comboTime=Math.max(0,comboTime-dt);if(!comboTime)$('combo').hidden=true;
  label();
  renderer.render(scene,camera);
}
function frame(now){
  if(!frozen)tick(now);else if(renderer)renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{previous=0;});

try{setup();}
catch(error){console.error(error);$('error').hidden=false;}
if(new URLSearchParams(location.search).has('dev'))window.quarry={
  state:()=>({mode,index,...wall.stats(),fuel,tool:{...tool},cash:account.cash,trip,dug:{...dug},pending:pending.length,building:wall.building(),ranks:{...account.ranks},skin:account.skin,engaged,tip:tip.toArray(),gem:goal.toArray(),gems:gems.map(g=>({x:+g.goal.x.toFixed(2),y:+g.goal.y.toFixed(2),state:g.state})),anchors:wall.anchors.map(a=>({x:a.center.base.x,y:a.center.base.y,open:a.open}))}),
  sites:()=>wall.bricks.filter(b=>b.state==='wall').map(b=>({x:b.base.x,y:b.base.y,row:b.row,col:b.col})),
  loot:()=>wall.loot.map(l=>({type:l.type,x:+l.brick.base.x.toFixed(2),y:+l.brick.base.y.toFixed(2),on:!!l.brick.loot})),
  mounts:()=>wall.mounts.map(b=>({x:+b.base.x.toFixed(2),y:+b.base.y.toFixed(2),on:b.state==='wall'})),
  screen(x,y){projected.set(x,y,.44).project(camera);const r=canvas.getBoundingClientRect();return [(projected.x+1)*r.width/2+r.left,(1-projected.y)*r.height/2+r.top];},
  freeze(v=true){frozen=v;previous=0;},
  advance(seconds){let t=performance.now();previous=0;tick(t);for(let s=0;s<seconds;s+=1/60){t+=1000/60;tick(t);}},
  hold(x,y){desired.set(x,y);startCut();pointer=-1;},
  aim(x,y){desired.set(x,y);},
  release(){pointer=null;},
  load:n=>load(n),
  setFuel(v){fuel=v;updateFuel();},
  endless(v=true){endless=v;},
  warp(x,y){tip.set(x,y);desired.set(x,y);},
  burned:()=>burned/tool.tank,
  finale:()=>showFinale(),
  audit:()=>wall.audit(BLAST),
};
