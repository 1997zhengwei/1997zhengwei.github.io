import {T,group,box,ball,bake,clearRoom,tau,clamp} from './geometry.js';
import {rooms,mapList} from './rooms.js';
import {floorplan} from './floorplan.js';
import {newRun,step,beamLength,throwDecoy,SNEAK} from './logic.js';
import {makeSet,laserRig,gateRig} from './set.js';
import {character,animateFigure,chestOf,relicModel,dog,animateDog,securityCam,keycard,disguises} from './cast.js';
import {makeAudio} from './sound.js';
import {bankStack,contact,noteSurface,glow,shaft} from './graphics.js';

const $=id=>document.getElementById(id),canvas=$('world'),app=$('app'),modal=$('panel');
const icon=name=>'<svg aria-hidden="true"><use href="#i-'+name+'"/></svg>';
const dev=new URLSearchParams(location.search).has('dev');
const key='box-heist-v2';
let old={};try{old=JSON.parse(localStorage.getItem(key))||{};}catch{}
if(!old.found){try{const v1=JSON.parse(localStorage.getItem('box-heist-v1'))||{};
  if(v1.found){old.wallet=v1.wallet;old.found=[];[0,3,6].forEach((n,i)=>{old.found[n]=v1.found[i];});}}catch{}}
const int=(v,max)=>clamp(Math.floor(Number(v)||0),0,max);
const record={wallet:int(old.wallet,1e7),sound:old.sound!==false,
  found:rooms.map((r,i)=>r.relics.map((_,k)=>old.found?.[i]?.[k]===true)),
  stars:rooms.map((_,i)=>int(old.stars?.[i],3)),best:rooms.map((_,i)=>Number(old.best?.[i])||0),
  last:int(old.last,rooms.length-1),perks:{shoes:int(old.perks?.shoes,3),armor:int(old.perks?.armor,3),magnet:int(old.perks?.magnet,3)},
  decoys:int(old.decoys,5),owned:Array.isArray(old.owned)?old.owned.filter(id=>disguises.some(d=>d.id===id)):['crate'],
  skin:disguises.some(d=>d.id===old.skin)?old.skin:'crate',tips:old.tips||{}};
if(!record.owned.includes('crate'))record.owned.unshift('crate');
const save=()=>{try{localStorage.setItem(key,JSON.stringify(record));}catch{}};
const pars=rooms.map(room=>room.parSeconds);
const finale=rooms[rooms.length-1];
const crownIndex=finale.relics.findIndex(relic=>relic.kind==='candycrown');
// The collection records only banked loot, including crowns brought home in earlier v2 saves.
const hasLegendTitle=()=>record.found[finale.index][crownIndex]===true;
const unlocked=i=>i===0||record.stars[i-1]>0||dev;
const audio=makeAudio(record.sound),scene=new T.Scene(),camera=new T.PerspectiveCamera(45,1,.15,145);
const projected=new T.Vector3(),eye=new T.Vector3(0,.795,.607).normalize(),focus=new T.Vector3();
let cameraDistance=20,zoom=0;
let sunlight,updateRadar,radarTime=0;
let renderer,root,s,set,hero,crate,guards=[],cams=[],lasers=[],gate=null,cardMesh=null,loot=[],coins=[],shadows=[],effects=[],playerRing,haul=[],decoyMesh,noiseRing;
let last=0,anim=0,runStride=0,fold=0,settleTime=0,stepTimer=0,tagTime=0,noteTime=0,tagPos=null,slow=0,flash=0,sweat=0,secShown=-1,frozen=false,ticks=0;
let lastControl=false,dialogMode='',drag=null,paused=false,firstClear=false;
const keys=new Set(),idle={x:0,z:0,active:false};
const gemColors=['#ffd771','#ff8492','#a3eade'];
const shrugLines=['……只是个箱子','眼花了吧','今天箱子真多','奇怪，刚才明明……','肯定是风','嗯……没事'];
function groundRing(parent,x,z,r,color,opacity=1){
  const mat=new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false});
  const m=new T.Mesh(new T.RingGeometry(r-.035,r+.035,36),mat);m.rotation.x=-Math.PI/2;
  m.userData.disposable=true;m.position.set(x,.060,z);parent.add(m);return m;
}
// Flashlight fan: bright at the lamp, fading out to the edge, added on top of the floor.
function beamModel(core,rim){
  const n=40,vertices=new Float32Array(n*9),colors=new Float32Array(n*9);
  const c0=new T.Color(core),c1=new T.Color(rim);
  for(let i=0;i<n;i++)for(let j=0;j<3;j++){const c=j===0?c0:c1;c.toArray(colors,i*9+j*3);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(vertices,3).setUsage(T.DynamicDrawUsage));
  geo.setAttribute('color',new T.BufferAttribute(colors,3));
  const mat=new T.MeshBasicMaterial({color:0xffffff,vertexColors:true,transparent:true,opacity:1,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false});
  const fill=new T.Mesh(geo,mat);fill.renderOrder=2;fill.position.y=.079;fill.frustumCulled=false;fill.userData.disposable=true;root.add(fill);
  const lines=new Float32Array((n+3)*3),outline=new T.BufferGeometry();outline.setAttribute('position',new T.BufferAttribute(lines,3));
  const edge=new T.Line(outline,new T.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.35,depthWrite:false,blending:T.AdditiveBlending}));
  edge.renderOrder=3;edge.frustumCulled=false;edge.position.y=.085;edge.userData.disposable=true;root.add(edge);
  return {fill,edge,vertices,lines,n};
}
function drawBeam(v,b,tint){
  let x0,z0;
  b.lines[0]=v.x;b.lines[1]=0;b.lines[2]=v.z;
  for(let i=0;i<=b.n;i++){
    const angle=v.rotation-v.angle+v.angle*2*i/b.n;
    const d=beamLength(s.room,v,angle),x=v.x+Math.sin(angle)*d,z=v.z+Math.cos(angle)*d;
    b.lines.set([x,0,z],(i+1)*3);
    if(i)b.vertices.set([v.x,0,v.z,x0,0,z0,x,0,z],(i-1)*9);
    x0=x;z0=z;
  }
  b.lines.set([v.x,0,v.z],(b.n+2)*3);
  b.fill.geometry.attributes.position.needsUpdate=b.edge.geometry.attributes.position.needsUpdate=true;
  b.fill.material.color.set(tint);b.edge.material.color.set(tint);
}
function attachShadow(parent,r){return contact(parent,0,0,r*2.85,r*2.24,.65);}
function buildLoot(r,i){
  const holder=group(root,r.x,0,r.z),object=group(holder);
  relicModel(object,r.kind);object.scale.setScalar(1.23);
  const marker=groundRing(holder,0,0,.48,gemColors[i],.9);
  const halo=glow(holder,0,.05,0,2.2,gemColors[i],.55),beam=shaft(holder,0,0,3.2,.42,gemColors[i],.28);
  const glints=group(holder);for(let k=0;k<3;k++){
    const x=Math.cos(k*2.1)*.45,z=Math.sin(k*2.1)*.32,y=.73+(k%2)*.16;
    box(glints,x,y,z,.026,.17,.03,'#fff0aa');box(glints,x,y,z,.12,.025,.03,'#fff5ba');
  }bake(glints,false);
  return {holder,object,marker,glints,halo,beam,fly:-1,from:null};
}
function buildCoin(c,i){
  const pile=group(root,c.x,.033,c.z);bankStack(pile,0,0,0,.73,2);pile.rotation.y=i*1.74;bake(pile);
  const fly=group(root);for(let n=0;n<3;n++)noteSurface(fly).visible=false;
  return {pile,fly,t:-1};
}
function reset(i){
  clearInput();if(modal.open)modal.close();paused=false;dialogMode='';if(root)clearRoom(root);
  root=group(scene);s=newRun(i,{...record.perks,decoys:record.decoys});record.last=i;save();
  anim=runStride=fold=settleTime=stepTimer=tagTime=noteTime=slow=flash=zoom=0;lastControl=false;secShown=-1;
  tagPos=null;effects=[];shadows=[];firstClear=false;
  const cfg=s.room;for(const [n,c] of cfg.sky.entries())app.style.setProperty('--sky'+(n+1),c);
  scene.background=new T.Color(cfg.sky[0]);scene.fog=new T.Fog(cfg.sky[0],28,52);set=makeSet(root,cfg);
  hero=character(root,'player',cfg.theme);hero.pivot.scale.setScalar(1.12);crate=chestOf(hero.pivot,record.skin);shadows.push(attachShadow(root,.48));
  haul=s.relics.map((r,k)=>{
    const g=group(hero.torso,-.24+.16*k,.99+.06*(k%2),-.35);
    relicModel(g,r.kind);g.scale.setScalar(.50);g.rotation.z=(k-1)*-.30;g.visible=false;return g;
  });
  playerRing=groundRing(root,s.x,s.z,.47,'#c5ffda',.90);playerRing.renderOrder=3;
  noiseRing=groundRing(root,0,0,1,'#ffe066',0);noiseRing.renderOrder=3;
  guards=s.guards.map(g=>{
    const a=g.dog?dog(root):character(root,'guard',cfg.theme);
    const beam=g.dog?beamModel('#3d7a52','#0a1a10'):beamModel('#8a7448','#120d05');
    shadows.push(attachShadow(root,g.dog?.38:.43));return {a,beam};
  });
  cams=s.cameras.map(c=>{const m=securityCam(root,c.x,c.z);return {m,beam:beamModel('#7a2230','#1a0508')};});
  lasers=s.lasers.map(l=>laserRig(root,l));
  gate=cfg.gate?gateRig(root,cfg.gate):null;
  cardMesh=null;
  if(cfg.key){const g=group(root,cfg.key.x,0,cfg.key.z),card=group(g,0,.75,0);keycard(card);
    glow(g,0,.05,0,2.2,'#3ad6ff',.6);shaft(g,0,0,3.2,.42,'#3ad6ff',.3);cardMesh={g,card,fly:-1};}
  loot=s.relics.map(buildLoot);coins=s.change.map(buildCoin);
  decoyMesh=group(root);const dc=new T.Mesh(new T.CylinderGeometry(.17,.17,.05,18),new T.MeshStandardMaterial({color:'#ffcf3e',metalness:.6,roughness:.3,emissive:'#7a5208',emissiveIntensity:.4}));
  dc.userData.disposable=true;dc.rotation.x=Math.PI/2;decoyMesh.add(dc);glow(decoyMesh,0,-.4,0,1.6,'#ffd24a',.6);decoyMesh.visible=false;
  $('place').textContent=cfg.name;$('chapter').textContent='第 '+String(i+1).padStart(2,'0')+' 夜';
  $('tag').hidden=true;$('alert').hidden=true;
  $('slots').innerHTML=s.relics.map(r=>'<svg role="img" aria-label="'+r.name+'"><use href="#i-gem"/></svg>').join('')+(cfg.key?'<svg class="card" role="img" aria-label="钥匙卡"><use href="#i-card"/></svg>':'');
  $('notice').textContent='';
  $('bubbles').replaceChildren(...s.guards.map(()=>{const b=document.createElement('b');b.hidden=true;return b;}));
  updateRadar=floorplan($('radar'),s);radarTime=0;
  $('nightTitle').textContent=cfg.title;$('nightTip').textContent=cfg.tip;$('guide').hidden=false;
  $('par').textContent='★ '+fmt(pars[i]);
  hud();view(0,idle);
}
const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
function hud(){
  $('cash').textContent=record.wallet;
  const score=$('score');score.textContent=s.secured+' / '+s.relics.length;
  [...$('slots').children].forEach((el,i)=>el.classList.toggle('on',i<s.relics.length?s.relics[i].taken:s.keyTaken));
  $('entry').textContent='↓ 接应车';$('entry').classList.toggle('open',!!s.secured);
  $('decoy').hidden=s.decoys<=0;$('decoyCount').textContent=s.decoys;
}
function say(msg,seconds){$('notice').textContent=msg;noteTime=seconds;}
function tag(msg,x,z){$('tag').textContent=msg;$('tag').hidden=false;tagTime=1.05;tagPos={x,z};}
function bubble(i,text,seconds=1.4,kind=''){
  const b=$('bubbles').children[i];if(!b)return;b.textContent=text;b.className=kind;b.hidden=false;b.dataset.t=seconds;
}
function scatter(x,z,color,n=7,y=.6){
  for(let k=0;k<n;k++){
    const o=ball(root,x,y,z,.10,.10,.10,color),a=k*tau/n,t=.48+k%3*.06;
    effects.push({o,t,left:t,vx:Math.sin(a)*1.3,vz:Math.cos(a)*1.3,vy:1.2+k%3*.4});
  }
}
function events(){
  for(const e of s.events){
    if(e.kind==='warning'){audio.play('warning');continue;}
    if(e.kind==='dodge'){say('躲过去了！',1.1);continue;}
    if(e.kind==='puzzle'){bubble(e.i,'?',1.9,'ask');audio.play('puzzle');say('它在盯着你……千万别动！',1.9);continue;}
    if(e.kind==='shrug'){bubble(e.i,shrugLines[Math.floor(Math.random()*shrugLines.length)],1.5);audio.play('shrug');say('好险！',1);continue;}
    if(e.kind==='bark'){bubble(e.i,'汪！汪！',1,'bark');audio.play('bark');say('脚步太响了！轻推摇杆慢慢走',1.8);continue;}
    if(e.kind==='look'){bubble(e.i,'咦？金币！',1.6);continue;}
    if(e.kind==='toss'){
      record.decoys=s.decoys;
      save();
      audio.play('toss');hud();continue;
    }
    if(e.kind==='decoy'){audio.play('decoy');continue;}
    if(e.kind==='zap'){audio.play('zap');flash=1;continue;}
    if(e.kind==='key'){
      audio.play('key');setTimeout(()=>audio.play('gate'),250);tag('钥匙卡 ✔',e.x,e.z);say('金库大门打开了！',2.4);
      cardMesh.fly=0;scatter(e.x,e.z,'#3ad6ff');hud();continue;
    }
    if(e.kind==='coin'){
      audio.play('coin');tag('+2',e.x,e.z);continue;
    }
    if(e.kind==='relic'){
      const a=loot[e.i],r=s.relics[e.i];a.fly=0;a.from={x:r.px,z:r.pz};a.marker.visible=a.glints.visible=a.halo.visible=a.beam.visible=false;
      tag(r.name+' +'+r.value,e.x,e.z);say(s.secured===3?'收齐了，回到接应车！':'已拿到宝物，可以撤离',2.5);
      scatter(e.x,e.z,gemColors[e.i],10);audio.play('relic');hud();continue;
    }
    if(e.kind==='caught'){audio.play('caught');s.guards.forEach((g,i)=>{if(g.noticed||g.puzzle>0)bubble(i,g.dog?'汪汪汪！':'抓到你了！',3,g.dog?'bark':'');});say(s.cause==='laser'?'滋——被激光扫到了':'被发现了！',1.6);settleTime=0;slow=.75;clearInput();}
    if(e.kind==='escape'){
      s.earnedLegend=s.room===finale&&s.relics[crownIndex].taken&&!hasLegendTitle();
      const earned=s.coins+s.value;record.wallet+=earned;s.relics.forEach((r,i)=>{if(r.taken)record.found[s.index][i]=true;});
      const stars=1+(s.secured===s.relics.length?1:0)+(s.time<=pars[s.index]?1:0);s.stars=stars;
      s.record=stars>record.stars[s.index];firstClear=!record.stars[s.index];record.stars[s.index]=Math.max(record.stars[s.index],stars);
      if(!record.best[s.index]||s.time<record.best[s.index])record.best[s.index]=s.time;
      save();hud();audio.play('escape');setTimeout(()=>audio.play('honk'),500);say('宝物已装车',1.45);settleTime=0;clearInput();
    }
  }
  s.events.length=0;
}
function overlay(el,x,y,z){
  projected.set(x,y,z).project(camera);
  el.style.left=((projected.x+1)*canvas.clientWidth/2)+'px';
  el.style.top=((1-projected.y)*canvas.clientHeight/2)+'px';
}
function view(dt,input){
  anim+=dt;
  followCamera(dt);
  radarTime-=dt;if(radarTime<=0){$('zoneName').textContent=updateRadar();radarTime=.11;}
  const running=s.phase==='play'&&input.active?Math.min(1,Math.hypot(input.x,input.z)):0;
  const hiding=s.hidden&&s.phase==='play';
  fold+=(Number(hiding)-fold)*(1-Math.exp(-dt*(hiding?18:14)));
  runStride+=running*dt*(s.sneak?8:13);stepTimer+=running*dt;
  if(stepTimer>(s.sneak?.5:.32)){stepTimer=0;if(!s.sneak)audio.play('step');}
  hero.pivot.position.set(s.x,0,s.z);hero.pivot.rotation.y=s.facing;
  animateFigure(hero,runStride,s.sneak?running*.45:running,fold);
  if(s.sneak&&!hiding){hero.figure.position.y-=.05;hero.torso.rotation.x=.32;}
  const watched=s.guards.some(g=>g.puzzle>0);
  crate.g.visible=fold>.025;
  crate.g.rotation.y=-s.facing+.035*Math.sin(anim*2.7);
  crate.g.position.x=watched&&hiding?Math.sin(anim*55)*.025:0;
  crate.g.scale.setScalar(Math.max(.01,fold*(1+.065*Math.sin(Math.PI*fold))));
  const peek=s.hidingTime>.42&&!watched?.13+.065*Math.sin(anim*3.6):0;
  if(crate.lid){crate.lid.rotation.x=-(1-fold)*1.8-peek;crate.lid.position.y=.68+peek*.35;}
  if(watched&&hiding){sweat-=dt;if(sweat<=0){sweat=.22;const side=Math.random()<.5?-1:1;
    const o=ball(root,s.x+side*.4,1.1,s.z,.09,.13,.09,'#8fd8ff');effects.push({o,t:.5,left:.5,vx:side*.9,vz:0,vy:1.4});}}
  playerRing.position.set(s.x,.073,s.z);playerRing.scale.setScalar(hiding?1.08:1);
  playerRing.material.opacity=hiding?.62:.34;
  shadows[0].position.set(s.x,.051,s.z);
  const dogs=s.guards.some(g=>g.dog);
  if(dogs&&s.noise){noiseRing.position.set(s.x,.07,s.z);const u=(anim*1.6)%1;noiseRing.scale.setScalar(.6+u*3);noiseRing.material.opacity=.55*(1-u);}
  else noiseRing.material.opacity=0;
  s.guards.forEach((g,i)=>{
    const {a,beam}=guards[i];a.pivot.position.set(g.x,0,g.z);a.pivot.rotation.y=g.rotation;
    if(g.dog)animateDog(a,g.stride,g.pace,g.alert>0||g.puzzle>0,anim);else animateFigure(a,g.stride,g.pace,0);
    shadows[i+1].position.set(g.x,.052,g.z);
    const hot=g.noticed&&!s.hidden;
    drawBeam(g,beam,hot?'#ff5a6e':g.puzzle>0?'#ffb04a':g.distract>0?'#fff6a0':g.dog?(g.alert>0?'#ffb04a':'#ffffff'):'#ffffff');
    const b=$('bubbles').children[i];
    if(b&&!b.hidden){b.dataset.t-=dt;if(b.dataset.t<=0)b.hidden=true;else overlay(b,g.x,g.dog?1.6:2.5,g.z);}
  });
  s.cameras.forEach((c,i)=>{
    const {m,beam}=cams[i];m.head.rotation.y=c.rotation;
    m.led.material.color.set(Math.sin(anim*8)>0||c.noticed?'#ff3b4b':'#4a0d12');
    drawBeam(c,beam,c.noticed&&!s.hidden?'#ff8a96':'#ffffff');
  });
  s.lasers.forEach((l,i)=>{
    const r=lasers[i],on=l.active,charge=l.charge>0&&Math.sin(anim*40)>0;
    for(const b of r.beams)b.visible=on||charge;
    r.mat.opacity=on?.95:.35;r.floor.material.opacity=on?.55:charge?.2:0;
    if(on&&!l.was&&Math.hypot(s.x-(l.ax+l.bx)/2,s.z-(l.az+l.bz)/2)<7)audio.play('laserOn');l.was=on;
  });
  if(gate){
    const target=s.gateOpen?-1.7:0;gate.bars.position.y+=(target-gate.bars.position.y)*(1-Math.exp(-dt*3));
    gate.light.material.color.set(s.gateOpen?'#4dff9a':'#ff3b4b');gate.pad.material.color.set(s.gateOpen?'#4dff9a':'#ff3b4b');
  }
  if(cardMesh){
    if(cardMesh.fly<0){cardMesh.card.rotation.y=anim*2;cardMesh.card.position.y=.75+Math.sin(anim*3)*.1;}
    else if(cardMesh.g.visible){cardMesh.fly+=dt*2.4;const u=clamp(cardMesh.fly,0,1);
      cardMesh.g.position.set(s.room.key.x+(s.x-s.room.key.x)*u,Math.sin(u*Math.PI)*.9,s.room.key.z+(s.z-s.room.key.z)*u);
      cardMesh.g.scale.setScalar(1-u*.9);if(u===1)cardMesh.g.visible=false;}
  }
  const f=s.flying[0];decoyMesh.visible=!!f;
  if(f){const u=f.t;decoyMesh.position.set(f.fx+(f.x-f.fx)*u,.2+Math.sin(u*Math.PI)*1.6,f.fz+(f.z-f.fz)*u);decoyMesh.rotation.y=anim*(u<1?14:3);decoyMesh.rotation.z=u<1?anim*9:0;}
  s.relics.forEach((r,i)=>{
    const a=loot[i];
    if(r.taken){
      if(a.fly>=0){a.fly+=dt*2.65;const u=clamp(a.fly,0,1);
        a.holder.position.set(a.from.x+(s.x-a.from.x)*u,.55+Math.sin(u*Math.PI)*.95,a.from.z+(s.z-a.from.z)*u);
        a.holder.scale.setScalar(1-u*.95);if(u===1){a.holder.visible=false;a.fly=-1;haul[i].visible=true;}}
      return;
    }
    a.holder.position.set(r.px,0,r.pz);a.object.position.y=.47+Math.sin(anim*2.7+i)*.09;
    a.object.rotation.y=r.motion==='skitter'?Math.atan2(Math.cos(s.clock*1.65),Math.cos(s.clock*3.3))*.8:anim*.83+i*.85;
    a.object.rotation.z=.06*Math.sin(anim*2.1+i);a.glints.rotation.y=anim*.58+i;
    a.glints.scale.setScalar(.85+.16*Math.sin(anim*4.8+i));a.marker.material.opacity=.65+.25*Math.sin(anim*3+i);
    a.halo.material.opacity=.4+.18*Math.sin(anim*3+i);
  });
  s.change.forEach((c,i)=>{
    const b=coins[i];if(!c.taken||b.t>=1.30)return;
    b.pile.visible=false;b.t=Math.max(0,b.t)+dt*2.3;
    b.fly.children.forEach((m,n)=>{
      const u=clamp(b.t-n*.11,0,1);m.visible=u>0&&u<1;
      m.position.set(c.x+(s.x-c.x)*u+.28*Math.sin(u*Math.PI+n)*Math.sin(u*Math.PI),
        .16+.87*u+.74*Math.sin(u*Math.PI),c.z+(s.z-c.z)*u);
      m.rotation.set(-Math.PI*.44+Math.sin(u*7+n)*.65,u*1.5,.3*Math.sin(u*5+n));m.scale.setScalar(1-u*.45);
    });
  });
  for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.left-=dt;
    if(e.left<=0){e.o.removeFromParent();effects.splice(i,1);continue;}
    e.o.position.x+=dt*e.vx;e.o.position.z+=dt*e.vz;e.o.position.y+=dt*e.vy;e.vy-=dt*5;e.o.scale.setScalar(.105*e.left/e.t);}
  set.pad.visible=!!s.secured;set.pad.scale.setScalar(.98+.06*Math.sin(anim*5.7));
  if(set.hand)set.hand.rotation.z=-anim*.55;
  const vault=s.room.vault;
  set.vault.rotation.y=.56+clamp(1-Math.hypot(s.x-vault.x,s.z-vault.z+2)/7,0,1)*.57;
  const alertLevel=s.phase==='caught'?1:s.warning;
  $('alarmWash').style.opacity=String(alertLevel*(.44+.11*Math.sin(anim*13)));
  flash*=Math.exp(-dt*5);$('flash').style.opacity=String(flash);
  if(s.phase==='escape'){
    hero.pivot.visible=false;playerRing.visible=false;shadows[0].visible=false;
    set.car.position.x=1.35+Math.pow(Math.max(0,settleTime-.30),2)*6;
    set.car.rotation.z=Math.sin(settleTime*21)*.023;
  }
  if(s.phase==='caught'){
    zoom+=(1-zoom)*(1-Math.exp(-dt*4));
    hero.torso.rotation.z=.12*Math.sin(settleTime*20);hero.figure.position.y=Math.abs(Math.sin(Math.min(1.2,settleTime*2.4)*Math.PI))*.4;
    for(const {arm,side} of hero.limbs){arm.rotation.x=-2.9;arm.rotation.z=side*.25;}
    if(s.cause==='laser'){hero.torso.rotation.y=Math.sin(settleTime*40)*.15;}
  }
  $('alert').hidden=s.warning<.015||s.phase==='escape';if(!$('alert').hidden){overlay($('alert'),s.x,1.9,s.z);$('alert').querySelector('i').style.transform='scaleX('+s.warning+')';}
  if(s.phase==='caught'){$('alert').hidden=false;overlay($('alert'),s.x,2.1,s.z);$('alert').querySelector('i').style.transform='scaleX(1)';}
  if(tagTime>0){tagTime-=dt;overlay($('tag'),tagPos.x,1.1+(1.05-tagTime)*.46,tagPos.z);}else $('tag').hidden=true;
  overlay($('entry'),-.90,.25,7.48);$('entry').hidden=!s.secured||s.phase==='escape'||Math.hypot(s.x,s.z-7.4)>8;
  if(noteTime>0){noteTime-=dt;if(noteTime<=0)$('notice').textContent='';}
  const sec=Math.floor(s.time);if(sec!==secShown){secShown=sec;$('timer').textContent=fmt(s.time);$('clock').classList.toggle('late',s.time>pars[s.index]);}
  const tension=s.phase==='play'?Math.max(s.warning,watched?.6:0):0;
  audio.tick(dt,s.phase==='play'&&running>0,tension,s.index);
}
function inputState(){
  const x=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA'));
  const z=Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'));
  if(x||z){const sneak=keys.has('ShiftLeft')||keys.has('ShiftRight'),k=sneak?.5/Math.hypot(x,z):1;return {x:x*k,z:z*k,active:true,sneak};}
  return drag?{x:drag.dx,z:drag.dz,active:true}:idle;
}
function clearInput(){drag=null;keys.clear();$('joy').hidden=true;}
function simulate(dt,input){
  // Substeps keep collision, light exposure and loot pickup independent of frame rate.
  while(dt>.00001&&s.phase==='play'){const h=Math.min(dt,1/40);step(s,h,input);events();dt-=h;}
}
function advance(dt){
  const input=inputState();
  if(input.active&&!lastControl&&!s.started){$('notice').textContent='';$('guide').hidden=true;}
  if(!input.active&&lastControl&&s.phase==='play')audio.play('hide');
  lastControl=input.active;
  let world=dt;if(slow>0){slow-=dt;world=dt*.3;}
  if(s.phase==='play')simulate(world,input);
  else if(dialogMode===''){settleTime+=world;if(settleTime>(s.phase==='escape'?1.5:1.35))result();}
  view(world,input);
}
function frame(now){
  const dt=last?Math.min(.12,(now-last)/1000):0;last=now;
  if(!document.hidden&&!paused){
    if(!frozen)advance(dt);
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
}
function followCamera(dt){
  const t=dt===0?1:1-Math.exp(-dt*5.6);
  const {bounds,vault}=s.room;
  const fx=s.phase==='caught'?s.x:clamp(s.x,bounds.left+2.0,bounds.right-2.0),fz=s.phase==='caught'?s.z:clamp(s.z-2.5,bounds.back+2.9,3.55);
  focus.x+=(fx-focus.x)*t;focus.y=.18;
  focus.z+=(fz-focus.z)*t;
  const vaultCloseup=clamp(1-Math.hypot(focus.x-vault.x,focus.z-vault.z)/7,0,1);
  if(sunlight){
    sunlight.target.position.set(focus.x,0,focus.z);
    sunlight.position.set(focus.x-7,13,focus.z-4);
  }
  camera.position.copy(focus).addScaledVector(eye,cameraDistance*(1-.15*vaultCloseup)*(1-.45*zoom));camera.lookAt(focus);camera.updateMatrixWorld();
}
function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  camera.aspect=w/h;
  cameraDistance=Math.max(13.15,8.75/camera.aspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
  camera.updateProjectionMatrix();if(s)followCamera(0);renderer.setSize(w,h,false);
}
function openPanel(kind,title,sub,mark='map'){
  clearInput();lastControl=false;paused=true;dialogMode=kind;
  $('atlas').hidden=kind!=='map';modal.dataset.kind=kind;
  $('close').hidden=kind==='result';$('panelTitle').textContent=title;$('panelSub').textContent=sub;
  $('panel').querySelector('.sheetmark').innerHTML=icon(mark);
  $('choices').replaceChildren();$('outcome').replaceChildren();$('panelButtons').replaceChildren();if(!modal.open)modal.showModal();
}
function panelButton(text,handler,primary=false){const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='main';b.onclick=()=>{audio.play('click');handler();};$('panelButtons').append(b);return b;}
function resume(){
  if(modal.open)modal.close();paused=false;dialogMode='';last=0;canvas.focus({preventScroll:true});
}
const starRow=n=>'<span class="stars">'+[0,1,2].map(k=>'<i class="'+(k<n?'on':'')+'">★</i>').join('')+'</span>';
function menu(){
  openPanel('map',s.room.name+' · '+s.room.title,'当前位置 · '+($('zoneName').textContent||'入口'));
  floorplan($('atlasPlan'),s,true);
  const total=record.stars.reduce((a,b)=>a+b,0);
  mapList.forEach((m,mi)=>{
    const block=document.createElement('section');block.className='mapblock theme-'+m.theme;
    block.innerHTML='<h3>'+m.name+'<small>藏品 '+m.levels.reduce((n,i)=>n+record.found[i].filter(Boolean).length,0)+' / 9</small></h3>';
    const row=document.createElement('div');row.className='nights';
    for(const i of m.levels){
      const b=document.createElement('button'),current=i===s.index&&s.phase==='play',open=unlocked(i);
      b.type='button';b.className='night';b.disabled=!open;if(current)b.setAttribute('aria-current','location');
      b.innerHTML='<i>'+String(i+1).padStart(2,'0')+'</i>'+(open?starRow(record.stars[i]):'<span class="lock">🔒</span>')+'<small>'+rooms[i].title+'</small>';
      b.onclick=()=>{audio.unlock();audio.play('click');if(current)resume();else reset(i);};row.append(b);
    }
    block.append(row);$('choices').append(block);
  });
  const sum=document.createElement('p');sum.className='total';sum.textContent='总星数 '+total+' / '+rooms.length*3;$('choices').append(sum);
  if(hasLegendTitle())sum.append(' · 称号「传奇大盗」');
  const sound=panelButton(record.sound?'♪ 开':'♪ 关',()=>{record.sound=!record.sound;save();audio.set(record.sound);sound.textContent=record.sound?'♪ 开':'♪ 关';});
  panelButton('🛒 商店',()=>shop('menu'));
  if(s.phase==='play')panelButton('继续本局',resume,true);
  else panelButton('返回结算',result,true);
}
const perkInfo=[
  {key:'shoes',name:'软底跑鞋',lines:['移速 +7%','移速 +14%','移速 +22%'],prices:[120,300,600]},
  {key:'armor',name:'加厚纸板',lines:['被照到时警报慢 16%','慢 29%','慢 40%'],prices:[150,360,700]},
  {key:'magnet',name:'磁铁手套',lines:['金币吸取范围 ×2','×3','×4'],prices:[100,260,520]}
];
function shop(from){
  openPanel('shop','黑市小卖部','金币：'+record.wallet,'bag');
  const wrap=$('choices');
  const head=document.createElement('h3');head.className='shophead';head.textContent='伪装箱 · 松手时你会变成它';wrap.append(head);
  const grid=document.createElement('div');grid.className='skins';
  disguises.forEach(d=>{
    const own=record.owned.includes(d.id),on=record.skin===d.id,b=document.createElement('button');
    b.type='button';b.className='skin skin-'+d.id+(on?' on':'');
    b.innerHTML='<span class="pic"></span><strong>'+d.name+'</strong><small>'+d.blurb+'</small><em>'+(on?'使用中':own?'换上':'$'+d.price)+'</em>';
    b.disabled=!own&&record.wallet<d.price;
    b.onclick=()=>{
      if(!own){record.wallet-=d.price;record.owned.push(d.id);audio.play('buy');}else audio.play('click');
      record.skin=d.id;save();if(s.phase==='play'){const keep={x:crate.g.position.x};crate.g.removeFromParent();crate=chestOf(hero.pivot,record.skin);crate.g.position.x=keep.x;}
      hud();shop(from);
    };
    grid.append(b);
  });
  wrap.append(grid);
  const head2=document.createElement('h3');head2.className='shophead';head2.textContent='装备 · 下一局生效';wrap.append(head2);
  for(const p of perkInfo){
    const rank=record.perks[p.key],max=rank>=3,b=document.createElement('button');
    b.type='button';b.className='perk';
    b.innerHTML='<strong>'+p.name+'</strong><span class="pips">'+[0,1,2].map(k=>'<i class="'+(k<rank?'on':'')+'"></i>').join('')+'</span><small>'+(max?'已满级':p.lines[rank])+'</small><em>'+(max?'MAX':'$'+p.prices[rank])+'</em>';
    b.disabled=max||record.wallet<p.prices[rank];
    b.onclick=()=>{record.wallet-=p.prices[rank];record.perks[p.key]++;save();audio.play('buy');hud();shop(from);};
    wrap.append(b);
  }
  const d=document.createElement('button'),full=record.decoys>=5;d.type='button';d.className='perk';
  d.innerHTML='<strong>诱饵金币</strong><span class="pips">'+'●'.repeat(record.decoys)+'○'.repeat(5-record.decoys)+'</span><small>点右下角按钮扔出，守卫会转头去看</small><em>'+(full?'满':'$25')+'</em>';
  d.disabled=full||record.wallet<25;d.onclick=()=>{record.wallet-=25;record.decoys++;if(s.phase==='play')s.decoys++;save();audio.play('buy');hud();shop(from);};
  wrap.append(d);
  panelButton('返回',()=>from==='result'?result():menu(),true);
}
function result(){
  const won=s.phase==='escape';
  const last=s.index===rooms.length-1;
  openPanel('result',won?(s.earnedLegend?'传奇大盗！':s.secured===3?'满载而归！':'撤离成功！'):s.cause==='laser'?'被激光扫到了':'被发现了',won?
    '带回 '+s.secured+' 件宝物，入账 '+(s.value+s.coins)+' 金币':s.cause==='laser'?'激光闪烁时就该停下——躲在箱子里激光照不到你。':'灯光扫过来时，松开手指躲进宝箱。',won?'bag':'box');
  if(won){
    const goals=[[true,'成功撤离'],[s.secured===s.relics.length,'带回全部 '+s.relics.length+' 件'],[s.time<=pars[s.index],'用时 '+fmt(s.time)+' ≤ '+fmt(pars[s.index])]];
    const box=document.createElement('div');box.className='goals';
    goals.forEach(([ok,text],k)=>{const g=document.createElement('div');g.className='goal';g.innerHTML='<i>★</i><span>'+text+'</span>';box.append(g);
      if(ok)setTimeout(()=>{g.classList.add('on');audio.play('star');},300+k*320);});
    $('outcome').append(box);
    if(s.record)$('outcome').insertAdjacentHTML('beforeend','<p class="newbest">新纪录！</p>');
    if(last&&firstClear)$('outcome').insertAdjacentHTML('beforeend','<p class="newbest">全部 12 夜通关！</p>');
    if(s.earnedLegend)$('outcome').insertAdjacentHTML('beforeend','<p class="newbest">糖果王冠已入藏，称号已解锁。</p>');
    else if(last&&!hasLegendTitle())$('outcome').insertAdjacentHTML('beforeend','<p>带回金库里的糖果王冠，即可解锁终夜称号。</p>');
  }
  for(const r of s.relics){const line=document.createElement('div');line.className='find'+(won&&r.taken?'':' missed');
    line.innerHTML=icon('gem')+'<span>'+r.name+'</span><b>'+(won&&r.taken?'+'+r.value:'未带回')+'</b>';$('outcome').append(line);}
  if(won&&s.coins){const line=document.createElement('div');line.className='find';line.innerHTML=icon('coin')+'<span>沿路零钱</span><b>+'+s.coins+'</b>';$('outcome').append(line);}
  if(won){panelButton('再探一次',()=>reset(s.index));panelButton('商店',()=>shop('result'));panelButton(s.index<rooms.length-1?'下一夜':'藏宝地图',()=>s.index<rooms.length-1?reset(s.index+1):menu(),true);}
  else{panelButton('地图',menu);panelButton('商店',()=>shop('result'));panelButton('再试一次',()=>reset(s.index),true);}
}
$('map').onclick=()=>{if(s.phase==='play'){audio.unlock();menu();}};
$('close').onclick=()=>{if(s.phase==='play')resume();else result();};
$('decoy').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();audio.unlock();if(throwDecoy(s))events();});
modal.addEventListener('cancel',e=>{e.preventDefault();if(s.phase==='play')resume();else result();});
function joystick(e){
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y,d=Math.hypot(dx,dy),range=46;
  const scale=d<2?0:1/Math.max(range,d);drag.dx=dx*scale;drag.dz=dy*scale;
  $('joy').firstElementChild.style.transform='translate('+drag.dx*30+'px,'+drag.dz*30+'px)';
  $('joy').classList.toggle('sneak',Math.hypot(drag.dx,drag.dz)<=SNEAK&&d>5);
}
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||drag||paused||s.phase!=='play')return;e.preventDefault();canvas.focus({preventScroll:true});audio.unlock();
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dz:0};canvas.setPointerCapture(e.pointerId);
  const r=app.getBoundingClientRect();Object.assign($('joy').style,{left:e.clientX-r.left+'px',top:e.clientY-r.top+'px'});$('joy').hidden=false;
  $('joy').classList.toggle('dogs',s.guards.some(g=>g.dog));joystick(e);
});
canvas.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId)joystick(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(drag?.id===e.pointerId){drag=null;$('joy').hidden=true;}});
const controls=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight']);
window.addEventListener('keydown',e=>{
  if(e.code==='Space'&&!paused&&s.phase==='play'){e.preventDefault();if(throwDecoy(s))events();return;}
  if(!controls.has(e.code)||paused||s.phase!=='play')return;e.preventDefault();audio.unlock();keys.add(e.code);});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{clearInput();last=0;});
try{
  renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:dev});
  renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;
  // Moonlit night: cool sky fill, a blue moon casting the shadows, warm lamp pools are painted on the floors.
  scene.add(new T.HemisphereLight('#8ea4ff','#231c3d',.62));
  const sun=new T.DirectionalLight('#b9c8ff',1.3);sun.position.set(-7,13,-4);sun.castShadow=true;
  sunlight=sun;scene.add(sun.target);
  Object.assign(sun.shadow.camera,{left:-10,right:10,top:13,bottom:-12,near:.5,far:40});sun.shadow.mapSize.set(1536,1536);sun.shadow.bias=-.00027;sun.shadow.normalBias=.015;scene.add(sun);
  const rimLight=new T.DirectionalLight('#ffb98a',.55);rimLight.position.set(5,6,7);scene.add(rimLight);
  resize();new ResizeObserver(resize).observe(app);reset(record.last);requestAnimationFrame(frame);
}catch(e){console.error(e);$('error').hidden=false;}
if(dev)window.heist={state:()=>s,load:reset,warp(x,z){s.x=x;s.z=z;s.started=true;},cash(n){record.wallet+=n;save();hud();},
  freeze(v=true){frozen=v;},advance(sec,input=idle){for(let t=0;t<sec;t+=1/60)advance(1/60);},
  hold(x,z,sec,sneak=false){for(let t=0;t<sec;t+=1/60){keys.clear();const inp={x,z,active:true,sneak};
    if(!s.started){s.started=true;}if(s.phase==='play')simulate(1/60,inp);view(1/60,inp);}},
  result,menu,shop:()=>shop('menu'),record,pars};
