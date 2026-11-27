import {T,group,product,batch,shopper,grabMat,print} from './art.js';
import {scenery,display} from './store.js';
import {newShop,advanceShop,bagValue,rankings,dash,stackHeight,comboRate,comboWindow,frenzyAt,listBonus} from './rules.js';
import {goods,saving,bulky,maps,distance,nearestTill,duration,pathTo} from './market.js';
import {storeAudio} from './audio.js';
import {upgrades,savingsPerTicket,legacySavingsPerTicket,garageVersion,garageState,ticketBalance,creditSavings,buyUpgrade,cartStats} from './upgrades.js';

const el=id=>document.getElementById(id),canvas=el('game'),panel=el('panel');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function stored(k,fallback){try{return localStorage.getItem('rushmart.'+k)??fallback;}catch{return fallback;}}
function save(k,v){try{localStorage.setItem('rushmart.'+k,String(v));}catch{}}
const query=new URLSearchParams(location.search);
const previousTicketRate=query.get('wallet')==='v2'?savingsPerTicket:legacySavingsPerTicket;
function readGarage(fallback=garageState()){
  try{
    const raw=stored('garage',null);
    if(raw===null)return fallback;
    const saved=JSON.parse(raw),decoded=garageState(saved,previousTicketRate);
    if(saved?.version!==garageVersion)save('garage',JSON.stringify(decoded));
    return decoded;
  }catch{return fallback;}
}
let garage=readGarage();
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(err){el('error').hidden=false;throw err;}
renderer.setClearColor(0x586ec1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(),cam=new T.OrthographicCamera(-8,8,8,-8,.1,90);
scene.add(new T.HemisphereLight(0xf2f4ff,0xa5a1ef,1.65));
const sun=new T.DirectionalLight(0xfffaff,1.7);sun.position.set(14,28,-7);sun.castShadow=true;
const bounce=new T.DirectionalLight(0xf4eaff,.48);bounce.position.set(0,5,9);scene.add(bounce);
Object.assign(sun.shadow.camera,{left:-27,right:27,top:26,bottom:-26,near:.2,far:68});sun.shadow.mapSize.set(1536,1536);
sun.shadow.normalBias=.023;sun.shadow.bias=-.00023;scene.add(sun);

const nextRound=Math.max(0,Math.floor(Number(stored('marketRound',0))||0))%100000;
let catalog;
try{const data=JSON.parse(stored('catalog','[]'));catalog=new Set(Array.isArray(data)?data.filter(k=>goods[k]):[]);}catch{catalog=new Set();}
let guide='auto',cachedGoal,boardKey='';
const rememberedMap=maps[Number(stored('mapId','0'))]||maps[0];
let s=newShop(nextRound,rememberedMap,garage.levels),paused=false,focusX=0,focusZ=0,clock=0,shake=0,splash=0;
let ticketsEarned=0,protectedUntil=0,stampT=0,alarmT=0,comboPulse=0,moneyPulse=0,shownMoney=0;
const view={w:0,h:0},touch={active:null,fromStart:false,x:0,y:0,dx:0,dz:0},keys=new Set();
let soundOn=stored('sound','on')==='on';
const recordKey=map=>map.id?'best60-map-'+map.id:'best60';
const mapRecord=map=>Number(stored(recordKey(map),'0'))||0;
let releaseMarket=scenery(group(scene),s.map);
const audio=storeAudio(soundOn);
function soundIcon(){el('audio').querySelector('use').setAttribute('href',soundOn?'#soundI':'#muteI');el('audio').setAttribute('aria-label',soundOn?'关闭声音':'打开声音');el('audio').setAttribute('aria-pressed',String(soundOn));}
soundIcon();
const models=new Map();
for(const kind of Object.keys(goods)){const temp=new T.Group(),model=product(temp,kind);batch(model);models.set(kind,model);}
let props=[];
function stock(){
  for(const p of props){p.traverse(m=>{if(m.isInstancedMesh)m.dispose();});p.removeFromParent();}
  props=s.pickups.map(p=>{
    const stand=group(scene),item=display(stand,{...p,price:saving(p.kind)});stand.userData.item=item;item.visible=p.available;return stand;
  });
}
stock();
const spotlightRing=new T.Mesh(new T.RingGeometry(1.07,1.15,50), new T.MeshBasicMaterial({color:0xff9d17,transparent:true,opacity:.8,depthWrite:false}));
spotlightRing.rotation.x=-Math.PI/2;scene.add(spotlightRing);
// Contact discs anchor the wheels; the dashed ground ring belongs to the player.
const discGeo=new T.CircleGeometry(1,40);
function shadow(parent,w,d){
  const m=new T.Mesh(discGeo,new T.MeshBasicMaterial({color:0x363577,transparent:true,opacity:.30,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.scale.set(w,d,1);m.position.set(-.05,.047,.17);parent.add(m);
}
const people=[0,1,2,3].map(i=>{const v=shopper(scene,i);shadow(v.actor,.56,.93);return v;});
// Dizzy stars over a rammed shopper.
const starGeo=new T.OctahedronGeometry(.13,0),starMat=new T.MeshBasicMaterial({color:0xffe14a});
const stars=people.map(()=>{const g=new T.Group();for(let k=0;k<4;k++){const m=new T.Mesh(starGeo,starMat);m.position.set(Math.cos(k*1.57)*.45,0,Math.sin(k*1.57)*.45);g.add(m);}g.visible=false;scene.add(g);return g;});
const looseMeshes=new Map(),ringMat=grabMat();
function addLoose(item){
  const m=models.get(item.kind).clone();m.scale.setScalar(bulky(item.kind)?.6:.95);scene.add(m);
  const ring=new T.Mesh(new T.PlaneGeometry(1.5,1.5),ringMat.clone());ring.rotation.x=-Math.PI/2;ring.renderOrder=2;scene.add(ring);
  looseMeshes.set(item.id,{m,ring});
}
function dropLoose(id){const e=looseMeshes.get(id);if(!e)return;scene.remove(e.m);scene.remove(e.ring);e.ring.material.dispose();e.ring.geometry.dispose();looseMeshes.delete(id);}
function syncLoose(){for(const item of s.loose)if(!looseMeshes.has(item.id))addLoose(item);for(const id of [...looseMeshes.keys()])if(!s.loose.some(l=>l.id===id))dropLoose(id);}
// The till each checkout happened at, for the conveyor show.
function tillNear(x,z){let best=s.map.tills[0],d=1e9;for(const t of s.map.tills){const e=Math.hypot(t.x-x,t.z-z);if(e<d){d=e;best=t;}}return best;}
const player=people[0],halo=group(player.actor,0,.087,.84);
const guardRing=new T.Mesh(new T.RingGeometry(.88,.97,42),new T.MeshBasicMaterial({color:0x9af7d5,transparent:true,depthWrite:false}));
guardRing.rotation.x=-Math.PI/2;guardRing.position.set(0,.09,-.37);guardRing.visible=false;player.actor.add(guardRing);
// The cutout's feet are behind the cart origin. Both rings follow that point.
const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=128;
const haloCtx=haloCanvas.getContext('2d'),glow=haloCtx.createRadialGradient(64,64,0,64,64,63);
for(const [at,color] of [[0,'#62ffdf20'],[.60,'#69ffe538'],[.65,'#275a8099'],[.68,'#fcffff'],[.72,'#f7ffff'],[.74,'#58ffe4'],[.79,'#21edcf'],[.81,'#227c96'],[.83,'#70ffe455'],[1,'#64ffe400']])glow.addColorStop(at,color);
haloCtx.fillStyle=glow;haloCtx.fillRect(0,0,128,128);
const haloTex=new T.CanvasTexture(haloCanvas);haloTex.colorSpace=T.SRGBColorSpace;
const haloFace=new T.Mesh(new T.PlaneGeometry(2.15,2.15),new T.MeshBasicMaterial({map:haloTex,transparent:true,depthWrite:false,toneMapped:false}));
haloFace.rotation.x=-Math.PI/2;haloFace.renderOrder=2;halo.add(haloFace);
const ripple=new T.Mesh(new T.RingGeometry(.885,.92,64),new T.MeshBasicMaterial({color:0xb2fff2,transparent:true,depthWrite:false,toneMapped:false}));
ripple.rotation.x=-Math.PI/2;ripple.renderOrder=3;halo.add(ripple);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const flights=[],notes=[],sparkles=[],particleGeo=new T.BoxGeometry(.10,.10,.055);
const particleMats=[0xffc840,0xff5b46,0xfff6d0,0x52b4a4].map(color=>new T.MeshBasicMaterial({color}));
function burst(x,y,z,n=14){
  for(let i=0;i<n;i++){const m=new T.Mesh(particleGeo,particleMats[i%4]);scene.add(m);m.position.set(x,y,z);
    const a=i*2.39996;const power=.75+(i%5)*.34;sparkles.push({m,life:.65,dx:Math.cos(a)*power,dz:Math.sin(a)*power,dy:1.2+i%4*.55});}
}
const point=new T.Vector3();
const head=new T.Vector3();
function project(x,y,z){point.set(x,y,z).project(cam);return [(point.x+1)*view.w/2,(1-point.y)*view.h/2];}
function note(msg,x,y,z,bad=false){const node=document.createElement('div');node.className='float'+(bad?' bad':'');node.textContent=msg;el('floats').append(node);notes.push({node,x,y,z,life:1.05});}
function message(text,duration){el('callout').textContent=text;el('callout').hidden=false;splash=duration;}
const currency=n=>'¥'+n.toLocaleString('en-US');
function goal(){
  const t=nearestTill(s,s.map),flash=s.waves[s.wave],full=s.items.length>=s.cart.capacity;
  if(s.phase==='ready')return {p:s.pickups[0],y:1.3,name:'空气炸锅',title:'装车 → 绿线结账 → 再抢',tag:'60 秒 · 比谁省得多',icon:'bagI'};
  const headHome=s.items.length&&(guide==='pay'||full||
    (guide!=='hunt'&&(s.time<distance(s,t)/4+5||s.items.some(bulky)||bagValue(s.items)>950)));
  if(headHome)return {p:t,y:.38,name:'收银台',title:full?'满车了，去结账':'推过绿线，再抢一车',tag:'车内待结 '+currency(bagValue(s.items)),icon:'arrowI',pay:true};
  if(flash?.available)return {p:flash,y:bulky(flash.kind)?2.20:1.65,name:goods[flash.kind].name,title:goods[flash.kind].name+' · 省'+saving(flash.kind),tag:'闪购 '+(s.wave+1)+'/3 · '+flash.zone,icon:bulky(flash.kind)?'tvI':'bagI'};
  let p=null;
  for(const item of s.pickups)if(item.available&&(!p||distance(s,item)<distance(s,p)))p=item;
  if(!p)return {p:t,y:.38,name:'收银台',title:'到收银台落袋',tag:'本场限时抢购',icon:'arrowI',pay:true};
  const next=s.waves[s.wave+1],upcoming=next?'下轮'+next.zone+' · '+Math.ceil((s.wave+1)*20-s.elapsed)+'秒':'附近好货';
  return {p,y:1.27,name:goods[p.kind].name,title:goods[p.kind].name+' · 省'+saving(p.kind),tag:upcoming,icon:'bagI'};
}
const radar=el('radar'),mapCtx=radar.getContext('2d');
function planView(c,map){
  const {bounds:b}=map;
  const scaleX=110/(b.right-b.left),scaleZ=64/(b.front-b.back);
  const mapX=x=>5+(x-b.left)*scaleX, mapZ=z=>5+(z-b.back)*scaleZ;
  c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,120,74);
  c.fillStyle=map.floor;c.globalAlpha=.40;c.fillRect(2,2,116,70);c.globalAlpha=1;
  c.fillStyle='#8a7db0';
  for(const r of map.racks)c.fillRect(mapX(r.x-r.w/2),mapZ(r.z-r.d/2),r.w*scaleX,r.d*scaleZ);
  if(map.garden){
    const r=map.garden;c.fillStyle='#90baa0';c.fillRect(mapX(r.x-r.w/2),mapZ(r.z-r.d/2),r.w*scaleX,r.d*scaleZ);
  }
  c.fillStyle='#087b65';
  for(const t of map.tills)c.fillRect(mapX(t.x-1.95),mapZ(t.z)-1.65,3.9*scaleX,3.3);
  return {mapX,mapZ};
}
function drawMap(){
  const c=mapCtx,{mapX,mapZ}=planView(c,s.map);
  if(cachedGoal){
    const trail=pathTo(s,cachedGoal.p,s.items.some(bulky),s.map);
    if(trail.length){
      c.beginPath();c.moveTo(mapX(s.x),mapZ(s.z));
      for(const p of trail)c.lineTo(mapX(p.x),mapZ(p.z));
      c.setLineDash([2,2]);c.lineWidth=1;c.strokeStyle=cachedGoal.pay?'#087b65':'#7446ae';c.stroke();c.setLineDash([]);
    }
  }
  const flash=s.waves[s.wave];
  if(flash?.available){const x=mapX(flash.x),y=mapZ(flash.z);c.fillStyle='#ffbd22';c.strokeStyle='#72502d';c.lineWidth=1;c.beginPath();c.moveTo(x,y-5);c.lineTo(x+4,y);c.lineTo(x,y+5);c.lineTo(x-4,y);c.closePath();c.fill();c.stroke();}
  for(const [i,a] of [...s.rivals,s].entries()){
    const me=i===3,x=mapX(a.x),z=mapZ(a.z);
    if(me){c.beginPath();c.arc(x,z,5.3,0,Math.PI*2);c.fillStyle='#38ebce';c.fill();c.strokeStyle='#29728a';c.lineWidth=.9;c.stroke();}
    c.fillStyle=me?'#ff752d':['#9361cc','#39acb1','#dd76a3'][i];c.strokeStyle=me?'#fff':'#493569';c.lineWidth=me?1.2:.7;
    c.beginPath();c.arc(x,z,me?3:2.5,0,Math.PI*2);c.fill();c.stroke();
  }
}
let lastMap=-1;
function refreshHUD(){
  const g=cachedGoal=goal();
  const limit=s.cart.capacity,full=s.items.length>=limit;
  el('objIcon').setAttribute('href','#'+g.icon);el('eyebrow').textContent=g.tag;el('mission').textContent=g.title;
  el('count').textContent=s.items.length+'/'+limit+(full?' · 满车':s.items.length?(g.pay?' · 看货':' · 去结账'):' 件');
  el('load').disabled=!s.items.length||full;
  el('load').setAttribute('aria-label',el('count').textContent+'，切换结账或寻货指引');
  el('shieldCount').hidden=!s.cart.protection;
  el('shieldCount').textContent='护 '+s.protection;
  el('shieldCount').setAttribute('aria-label','本趟剩余 '+s.protection+' 次掉货保护');
  el('ticketCount').textContent=ticketBalance(garage).toLocaleString('zh-CN')+' 券';
  el('garageButton').disabled=s.phase!=='ready';
  el('marker').classList.toggle('pay',!!g.pay);
  const order=rankings(s),key=order.map(r=>r.id+'-'+r.paid).join('/');
  if(key!==boardKey){
    boardKey=key;const list=el('scoreboard');list.replaceChildren();
    for(const row of order){const chip=document.createElement('span');chip.className='score who'+row.id;
      chip.innerHTML='<i>'+row.rank+'</i><em>'+(row.id?row.name:'你')+'</em><b>'+currency(row.paid)+'</b>';chip.title='第 '+row.rank+' 名';list.append(chip);}
  }
  const listKey=[s.list,s.listDone,s.listPaid,s.list.filter(k=>s.items.includes(k))].join('|');
  if(el('list').dataset.key!==listKey){
    el('list').dataset.key=listKey;
    el('list').innerHTML='<h4>购物清单<small>'+(s.listPaid?'已完成':'买齐 +'+listBonus)+'</small></h4>'+s.list.map(k=>'<span class="'+(s.listDone.includes(k)?'done':s.items.includes(k)?'got':'')+'">'+goods[k].name+'</span>').join('');
  }
}
function layout(){
  view.w=canvas.clientWidth;view.h=canvas.clientHeight;const aspect=view.w/view.h;
  const height=clamp(10.8/aspect,15.7,23.4);
  cam.left=-height*aspect/2;cam.right=-cam.left;cam.top=height/2;cam.bottom=-cam.top;cam.updateProjectionMatrix();
  renderer.setSize(view.w,view.h,false);
  el('controlText').textContent=matchMedia('(pointer:coarse)').matches?'拖动推车':'WASD / 方向键';
}
new ResizeObserver(layout).observe(canvas);
layout();
function camera(dt,instant=false){
  const aspect=view.w/view.h;
  const targetX=s.x*(aspect>1.3?.89:.97);
  const front=s.map.bounds.front;
  const targetZ=s.phase==='ready'?s.z-(aspect>1.3?6.76:5.46):Math.min(front-5.57,s.z*.86-.75);
  const f=instant?1:1-Math.exp(-dt*5.4);focusX+=(targetX-focusX)*f;focusZ+=(targetZ-focusZ)*f;
  const sx=Math.sin(clock*67)*shake*.055;
  cam.position.set(focusX+.65+sx,15.35,focusZ+15.65);cam.lookAt(focusX+sx,.15,focusZ);
  cam.updateMatrixWorld();
}
function positionTags(){
  const show=!panel.open&&['play','ready'].includes(s.phase);
  el('marker').hidden=el('you').hidden=!show;if(!show)return;
  const g=cachedGoal,a=project(g.p.x,g.y,g.p.z);
  player.person.crown.getWorldPosition(head);
  const b=project(head.x,head.y,head.z);
  const edgeTop=view.w<560?107:54,edgeBottom=view.h-85,edge=a[1]<edgeTop||a[1]>edgeBottom||a[0]<50||a[0]>view.w-50;
  const left=a[0]<50,right=a[0]>view.w-50,up=a[1]<edgeTop,down=a[1]>edgeBottom;
  const arrow=left?(up?'↖':down?'↙':'←'):right?(up?'↗':down?'↘':'→'):up?'↑':'↓';
  el('markerText').textContent=(edge?arrow+' ':'')+g.name;
  const marker=el('marker');marker.classList.toggle('edge',edge);marker.style.left=clamp(a[0],63,view.w-63)+'px';marker.style.top=clamp(a[1],edgeTop,edgeBottom)+'px';
  el('you').style.left=b[0]+'px';el('you').style.top=b[1]+'px';
}
// The haul is a real tower: one layer per item, each layer leaning a little further.
function pack(v,items,skew,tilt=0){
  const sig=items.join(',');
  if(v.cargo.userData.sig!==sig){
    const before=v.cargo.children.length;
    v.cargo.clear();v.cargo.userData.sig=sig;
    let y=.04,layer=0;
    items.filter(k=>!bulky(k)).forEach((k,i)=>{
      const m=models.get(k).clone();m.scale.setScalar(.86);
      m.userData={layer:layer++,y,x:(i%2?1:-1)*.06,spin:.35*(i%3-1)};m.position.set(m.userData.x,y,0);m.rotation.y=m.userData.spin;v.cargo.add(m);
      y+=.3;
    });
    items.filter(bulky).forEach((k,i)=>{const screen=models.get(k).clone();screen.name='big-screen';screen.userData={layer:layer,y:y+.24,x:0,spin:0};layer+=2;screen.position.set(0,y+.24,-.1);v.cargo.add(screen);y+=.5;});
    if(v.cargo.children.length>before&&v.cargo.children.length)v.cargo.userData.pop=1;
  }
  const pop=v.cargo.userData.pop||0;
  for(const m of v.cargo.children){
    const {layer,y,x,spin}=m.userData,lean=tilt*Math.pow(layer+1,1.35);
    m.position.set(x+lean*.05+Math.sin(clock*9+layer)*Math.abs(tilt)*.02,y+(layer===v.cargo.children.length-1?pop*.25:0),m.name==='big-screen'?-.1:0);
    m.rotation.z=-lean*.06;m.rotation.y=m.name==='big-screen'?-skew:spin;
    if(m.name==='big-screen')m.rotation.x=-.10;
  }
  if(pop)v.cargo.userData.pop=Math.max(0,pop-.08);
}
function animatePeople(){
  const pulse=(clock/1.55)%1;
  ripple.visible=!reduceMotion.matches;
  ripple.scale.setScalar(1+.24*pulse);ripple.material.opacity=.52*(1-pulse);
  const guard=Math.max(0,(protectedUntil-clock)/.62);
  guardRing.visible=guard>0;
  guardRing.material.opacity=guard*.95;
  guardRing.scale.setScalar(reduceMotion.matches?1:1+.62*(1-guard));
  player.extensions.forEach((mesh,i)=>{mesh.visible=i<s.cart.basket;});
  [s,...s.rivals].forEach((a,i)=>{
    const v=people[i],pace=i?a.pace:Math.hypot(a.vx,a.vz);
    v.actor.position.set(a.x,0,a.z);v.actor.rotation.y=-a.angle;
    const haul=a.items;
    v.person.update(a.angle,a.stride,pace||0,clock,haul.some(bulky),i===0&&s.jam);
    v.wheels.forEach(w=>{w.rotation.x=-a.stride*.82;});
    v.skin.rotation.z=i?0:clamp(s.sway,-.8,.8)*.045;
    const r=i?s.rivals[i-1]:null;
    v.skin.scale.set(1,1,!i&&s.dashT>0?1.12:1);
    if(r&&r.stun>0){v.actor.position.y=Math.abs(Math.sin(clock*12))*.12;}
    stars[i].visible=!!(r&&r.stun>0);if(stars[i].visible){stars[i].position.set(a.x,2.55,a.z);stars[i].rotation.y=clock*6;}
    pack(v,haul,i?0:s.skew,i?0:s.tilt);
  });
  for(const [id,{m,ring}] of looseMeshes){
    const item=s.loose.find(l=>l.id===id);if(!item)continue;
    const u=Math.min(1,item.age/.4);
    m.position.set(item.fromX+(item.x-item.fromX)*u,Math.sin(u*Math.PI)*1.2+(u>=1?.15+.06*Math.sin(clock*5+id):0),item.fromZ+(item.z-item.fromZ)*u);
    m.rotation.y=clock*2+id;ring.position.set(item.x,.06,item.z);ring.rotation.z=-clock*2;ring.visible=u>=1;
    ring.material.opacity=item.age>11?(Math.sin(clock*20)>0?.95:.15):.95;
  }
}
function effects(dt){
  shake=Math.max(0,shake-dt*2.8);
  if(splash>0&&(splash-=dt)<=0)el('callout').hidden=true;
  for(let i=flights.length-1;i>=0;i--){
    const a=flights[i];const was=a.t;a.t=Math.min(1,a.t+dt/a.duration);
    if(a.t<0)continue;a.m.visible=true;
    const t=a.t,end=a.to||(a.drop?{x:a.x+.95,y:.15,z:a.z+.63}:people[a.person].actor.position);
    a.m.position.set(T.MathUtils.lerp(a.x,end.x,t),T.MathUtils.lerp(a.y,a.to?a.to.y:a.drop?.16:1.2,t)+Math.sin(Math.PI*t)*1.45,T.MathUtils.lerp(a.z,end.z,t));
    a.m.rotation.y=t*(a.drop?3.8:1.2);a.m.scale.setScalar(1-.38*t);
    if(t>=1){
      if(a.to){audio.play('scan',a.scan);burst(end.x,end.y+.3,end.z,5);}
      scene.remove(a.m);flights.splice(i,1);
    }
  }
  if(stampT>0&&(stampT-=dt)<=0)el('stamp').className='';
  if(alarmT>0&&(alarmT-=dt)<=0)el('alarm').className='';
  for(const [i,b] of [...el('bubbles').children].entries()){
    if(b.hidden)continue;b.dataset.t-=dt;if(b.dataset.t<=0){b.hidden=true;continue;}
    const a=i?s.rivals[i-1]:s,[x,y]=project(a.x,2.7,a.z);b.style.left=x+'px';b.style.top=y+'px';
  }
  comboPulse=Math.max(0,comboPulse-dt*3);moneyPulse=Math.max(0,moneyPulse-dt*2.5);
  el('combo').style.setProperty('--pulse',comboPulse);el('money').style.setProperty('--pulse',moneyPulse);
  if(s.combo>1&&s.phase==='play'){el('combo').hidden=false;el('comboN').textContent='×'+comboRate(s.combo).toFixed(2).replace(/\.?0+$/,'');el('comboBar').style.transform='scaleX('+Math.max(0,1-(s.elapsed-s.lastPick)/comboWindow)+')';el('comboCount').textContent='连抢 '+s.combo;}
  else el('combo').hidden=true;
  const ready=s.dashCD<=0;el('dash').classList.toggle('cool',!ready);el('dash').style.setProperty('--cd',ready?0:s.dashCD/2.4);
  const tilt=Math.abs(s.tilt);el('wobble').hidden=tilt<.45||s.phase!=='play';el('wobble').style.setProperty('--t',Math.min(1,tilt));
  for(let i=sparkles.length-1;i>=0;i--){const p=sparkles[i];p.life-=dt;p.dy-=6*dt;p.m.position.x+=p.dx*dt;p.m.position.y+=p.dy*dt;p.m.position.z+=p.dz*dt;p.m.rotation.z+=dt*8;p.m.scale.setScalar(Math.min(1,p.life*5));if(p.life<=0){scene.remove(p.m);sparkles.splice(i,1);}}
  for(let i=notes.length-1;i>=0;i--){const n=notes[i];n.life-=dt;
    const [x,y]=project(n.x,n.y+(1.05-n.life)*1.35,n.z);n.node.style.left=x+'px';n.node.style.top=y+'px';n.node.style.opacity=clamp(n.life*3,0,1);
    if(n.life<=0){n.node.remove();notes.splice(i,1);}}
}
function fly(kind,x,z,person,drop=false){
  const m=models.get(kind).clone();scene.add(m);flights.push({m,x,z,y:drop?1.15:.40,drop,t:0,person,duration:drop?.48:.34});
}
function stopInput(){
  keys.clear();touch.active=null;touch.fromStart=false;touch.dx=touch.dz=0;el('joy').hidden=true;
}
function showPanel(title,description,rows,actions){
  stopInput();el('callout').hidden=true;el('marker').hidden=el('you').hidden=true;
  el('resultTitle').textContent=title;el('resultDesc').textContent=description;
  panel.classList.remove('mapChooser','garagePanel','resultsPanel');
  const details=el('details');details.classList.remove('catalog','mapGrid');details.replaceChildren();
  for(const [left,right,cls=''] of rows){
    const d=document.createElement('div');d.className='line '+cls;
    const l=document.createElement('span'),r=document.createElement('b');l.textContent=left;r.textContent=right;d.append(l,r);details.append(d);
  }
  const area=el('buttons');area.replaceChildren();
  for(const [label,fn,primary] of actions){const btn=document.createElement('button');btn.textContent=label;if(primary)btn.className='primary';btn.onclick=fn;area.append(btn);}
  if(!panel.open)panel.showModal();
}
function reset(replay=false,map=s.map){
  last=performance.now();
  if(panel.open)panel.close();stopInput();paused=false;
  if(map!==s.map){releaseMarket();releaseMarket=scenery(group(scene),map);save('mapId',map.id);}
  garage=readGarage(garage);
  s=newShop(s.round+(replay===true?1:0),map,garage.levels);stock();guide='auto';splash=shake=0;el('callout').hidden=true;
  ticketsEarned=protectedUntil=0;
  people.forEach(v=>v.person.reset());
  flights.forEach(f=>scene.remove(f.m));sparkles.forEach(p=>scene.remove(p.m));flights.length=sparkles.length=0;
  notes.forEach(n=>n.node.remove());notes.length=0;el('how').hidden=false;
  for(const id of [...looseMeshes.keys()])dropLoose(id);shownMoney=0;el('amount').textContent=currency(0);
  document.body.classList.remove('playing','frenzy');el('startCard').hidden=false;el('stamp').className='';el('alarm').className='';stampT=alarmT=0;
  for(const b of el('bubbles').children)b.hidden=true;syncStart();
  el('seconds').textContent=duration;el('clock').classList.remove('urgent');
  refreshHUD();syncMapTitle();drawMap();camera(0,true);animatePeople();canvas.focus({preventScroll:true});
}
function showCatalog(back){
  const rows=Object.entries(goods).map(([k,g])=>[g.name,catalog.has(k)?'✓':'待收集',catalog.has(k)?'':'sub']);
  showPanel('黑五购物图鉴',catalog.size+' / '+rows.length+' 种已结账带回',rows,[['返回',back,true]]);
  el('details').classList.add('catalog');
}
function showGarage(back,purchased){
  garage=readGarage(garage);
  showPanel('推车升级',`每累计实省 ¥${savingsPerTicket}，就能领 1 张升级券。`,[],[['返回',back,true]]);
  panel.classList.add('garagePanel');
  const detail=el('details'),balance=ticketBalance(garage);
  const wallet=document.createElement('div');wallet.className='garageWallet';
  const amount=document.createElement('strong');amount.textContent=balance.toLocaleString('zh-CN')+' 张升级券';
  const remaining=savingsPerTicket-garage.progress;
  const hint=document.createElement('small');hint.textContent=purchased?purchased+'已升级':'距下一张还差 '+currency(remaining);
  hint.setAttribute('aria-live','polite');wallet.append(amount,hint);detail.append(wallet);

  for(const upgrade of upgrades){
    const level=garage.levels[upgrade.key],cost=upgrade.costs[level],maxed=cost===undefined;
    const card=document.createElement('section');card.className='upgradeCard '+upgrade.mark;
    const icon=document.createElement('span');icon.className='upgradeIcon';icon.setAttribute('aria-hidden','true');
    const info=document.createElement('div');info.className='upgradeInfo';
    const title=document.createElement('strong');title.textContent=upgrade.name;
    const current=document.createElement('span');current.textContent=upgrade.effect(level);
    const track=document.createElement('span');track.className='upgradeTrack';
    track.setAttribute('aria-label','等级 '+level+' / '+upgrade.costs.length);
    for(const [i] of upgrade.costs.entries()){
      const rung=document.createElement('i');rung.classList.toggle('active',i<level);track.append(rung);
    }
    const next=document.createElement('small');next.textContent=maxed?'已升满':'下级 '+upgrade.effect(level+1);
    info.append(title,current,track,next);
    const button=document.createElement('button');button.type='button';button.className='upgradeBuy';
    button.textContent=maxed?'满级':cost+' 券';
    button.setAttribute('aria-label',maxed?upgrade.name+'已满级':`升级${upgrade.name}，${cost} 张券`);
    button.disabled=maxed||balance<cost;
    button.onclick=()=>{
      garage=readGarage(garage);
      if(!buyUpgrade(garage,upgrade.key)){showGarage(back);return;}
      save('garage',JSON.stringify(garage));
      if(s.phase==='ready'){s.cart=cartStats(garage.levels);s.protection=s.cart.protection;}
      audio.unlock();audio.play('upgrade');refreshHUD();
      showGarage(back,upgrade.name);
      const updated=detail.querySelector('.'+upgrade.mark+' .upgradeBuy');
      (updated.disabled?el('buttons').firstElementChild:updated).focus();
    };
    card.append(icon,info,button);detail.append(card);
  }
}
function readStars(){try{const a=JSON.parse(stored('stars','[]'));return maps.map((_,i)=>Math.max(0,Math.min(3,Math.floor(Number(a[i])||0))));}catch{return maps.map(()=>0);}}
const starText=n=>'★'.repeat(n)+'☆'.repeat(3-n);
function syncStart(){
  const st=readStars()[s.map.id];
  el('startMapName').textContent=(s.map.id+1)+'. '+s.map.name;el('startTip').textContent=s.map.tip;
  el('startStars').textContent=starText(st);el('startGoal').textContent='目标 '+currency(s.map.target)+(mapRecord(s.map)?' · 纪录 '+currency(mapRecord(s.map)):'');
  el('startTickets').textContent=ticketBalance(garage)+' 券';
  el('startList').textContent='本局清单：'+s.list.map(k=>goods[k].name).join('、');
}
function receipt(){
  const board=rankings(s),me=board.find(r=>!r.id),best=mapRecord(s.map),record=s.newRecord??(s.paid>best);
  s.newRecord=record;
  if(record)save(recordKey(s.map),s.paid);
  save('marketRound',(s.round+1)%100000);
  const goals=[me.rank===1,s.listPaid,s.paid>=s.map.target],got=goals.filter(Boolean).length;
  if(s.starsSaved===undefined){const all=readStars();s.starsSaved=got>all[s.map.id];all[s.map.id]=Math.max(all[s.map.id],got);save('stars',JSON.stringify(all));}
  const rows=board.map(r=>['第 '+r.rank+' 名　'+r.name,currency(r.paid),r.id===0?'mine':'']);
  rows.unshift([(goals[0]?'★':'☆')+' 拿下第 1 名',goals[0]?'达成':'差一点','star'+(goals[0]?' on':'')],
    [(goals[1]?'★':'☆')+' 买齐购物清单',s.listDone.length+' / 3','star'+(goals[1]?' on':'')],
    [(goals[2]?'★':'☆')+' 省到 '+currency(s.map.target),currency(s.paid),'star'+(goals[2]?' on':'')]);
  rows.push(['你的结账',s.trips+' 趟 · '+s.banked.length+' 件 · 最高连抢 '+s.bestCombo,'sub']);
  if(s.rams)rows.push(['撞翻对手',s.rams+' 次','sub']);
  if(ticketsEarned)rows.push(['本场升级券','+'+ticketsEarned+' 券','sub']);
  if(s.items.length)rows.push(['关门时留在车里',s.items.length+' 件 · '+currency(bagValue(s.items)),'sub']);
  if(s.lost.length)rows.push(['半路掉货',s.lost.length+' 件','sub']);
  rows.push([record?'新的个人纪录':'本站最高收益',currency(Math.max(best,s.paid)),'major'],['已带回的商品',catalog.size+' / '+Object.keys(goods).length+' 种','sub']);
  const tied=board.filter(r=>r.rank===me.rank).length>1;
  const next=maps[(s.map.id+1)%maps.length];
  showPanel(starText(got)+'　'+(tied?'并列':'')+'第 '+me.rank+' 名',s.map.name+' · '+(s.paid?'小票收益已入账。':'下一场记得推过绿线。'),rows,[
    ['下一张',()=>reset(true,next),true],['升级推车',()=>showGarage(receipt),false],
    ['重玩',()=>reset(true),false],['商品图鉴',()=>showCatalog(receipt),false]]);
  panel.classList.add('resultsPanel');
}
function pause(){
  if(!['ready','play'].includes(s.phase)||paused)return;paused=true;
  showPanel('暂停营业中','购物车停在原地，倒计时也停了。',[],[['继续抢购',resume,true],['重新开局',reset,false]]);
}
function syncMapTitle(){el('branchName').textContent=s.map.name+' ▾';}
function mapChooser(back){
  if(s.phase==='play')paused=true;
  showPanel('选择卖场',s.phase==='play'?'换地图会重开本局。':'十张地图，每场 60 秒。',[],[['返回',back,true]]);
  panel.classList.add('mapChooser');
  const grid=el('details');grid.classList.add('mapGrid');
  for(const map of maps){
    const button=document.createElement('button');button.type='button';button.className='branchCard';
    if(map===s.map)button.classList.add('current');
    const thumb=document.createElement('canvas');thumb.width=240;thumb.height=148;
    planView(thumb.getContext('2d'),map);
    const label=document.createElement('strong');label.textContent=(map.id+1)+'. '+map.name;
    const tip=document.createElement('small');tip.textContent=starText(readStars()[map.id])+' · '+(mapRecord(map)?'纪录 '+currency(mapRecord(map)):map.tip);
    button.append(thumb,label,tip);
    button.onclick=()=>{if(map===s.map&&s.phase!=='closed')resume();else reset(s.phase==='closed',map);};
    grid.append(button);
  }
}
function mapPanel(){
  if(panel.open||s.phase==='closed')return;
  paused=true;drawMap();
  const rows=s.waves.map(p=>[p.zone,goods[p.kind].name+' · '+(p.wave>s.wave?Math.ceil(p.wave*20-s.elapsed)+'秒后':p.available?'抢购中':'已结束')]);
  showPanel(s.map.name,'青圈是你，金菱形是特卖，绿线可以结账。',rows,[['继续抢购',resume,true],['选地图',()=>mapChooser(resume),false]]);
  const map=document.createElement('canvas');map.width=radar.width;map.height=radar.height;map.className='largeMap';
  map.getContext('2d').drawImage(radar,0,0);el('details').prepend(map);
}
function resume(){if(!panel.open)return;last=performance.now();paused=false;panel.close();canvas.focus({preventScroll:true});}
const rivalLines={charge:['让开！我的！','这是我先看上的！','小伙子别跑！'],ram:['哎哟喂！','我的锅！','你推我干嘛！'],grab:['手慢无～','嘿嘿归我了']};
const pick=a=>a[Math.floor(Math.random()*a.length)];
function bubble(i,text,t=1.3,cls=''){const b=el('bubbles').children[i];if(!b)return;b.textContent=text;b.className=cls;b.hidden=false;b.dataset.t=t;}
function stamp(text,sub,cls=''){
  const node=el('stamp');node.className='';void node.offsetWidth;node.className='show '+cls;
  node.querySelector('b').textContent=text;node.querySelector('small').textContent=sub;stampT=1.6;
}
function alarm(text,sub,cls=''){
  const node=el('alarm');node.className='';void node.offsetWidth;node.className='show '+cls;
  node.querySelector('b').textContent=text;node.querySelector('small').textContent=sub;alarmT=2.4;
}
// Items hop from the cart onto the till one by one, each beep a little higher.
function checkoutShow(e){
  const t=tillNear(e.x,e.z),tx=t.x+(t.side||1)*3,tz=t.z+.38;
  e.items.forEach((k,i)=>{
    const m=models.get(k).clone();scene.add(m);m.visible=false;
    flights.push({m,x:s.x,z:s.z,y:1.4,drop:false,t:-i*.16/.32,person:-1,duration:.32,to:{x:tx,y:1.25,z:tz},scan:i});
  });
  const match=s;
  setTimeout(()=>{
    if(s!==match||s.phase!=='play')return;
    const subtitle=e.double?'关门甩卖 ×2':e.comboBonus?'连抢奖励 '+currency(e.comboBonus):'';
    stamp('省 '+currency(e.amount)+'！',subtitle,e.double?'gold':'');audio.play('kaching');shake=.4;
  },e.items.length*160+250);
}
function events(){
  for(const e of s.events){
    if(e.type==='start'){el('how').hidden=true;el('startCard').hidden=true;document.body.classList.add('playing');}
    if(e.type==='sale'){audio.play('siren');alarm('⚠ 限时 1 折！',e.p.zone+' · '+goods[e.p.kind].name+' 只要 ¥'+goods[e.p.kind].price);burst(e.p.x,1.6,e.p.z,24);}
    if(e.type==='pickup'){
      const you=e.who==='you',who=you?0:e.who+1;
      people[who].person.reach(clock);fly(e.kind,e.x,e.z,who);burst(e.x,.8,e.z,you?14:6);
      if(you){audio.play(e.flash?'tv':'pickup',s.combo);note('+'+currency(saving(e.kind)),e.x,1.25,e.z);}
      else if(e.flash||e.loose)bubble(who,pick(rivalLines.grab));
      if(e.flash)message(you?'抢到'+goods[e.kind].name+'！快去结账':s.rivals[e.who].name+'抢走了'+goods[e.kind].name+'！',1.65);
    }
    if(e.type==='combo'){comboPulse=1;if(e.bonus)note('连抢 ×'+comboRate(e.n).toFixed(2).replace(/\.?0+$/,'')+' +'+e.bonus,e.x,1.9,e.z);}
    if(e.type==='full'){message('车堆满了！先推去结账',1.65);}
    if(e.type==='jam'){shake=.6;message('卡住了！继续推，斜着过',1.15);}
    if(e.type==='wobble'){audio.play('wobble');message('摇摇欲坠！慢点转弯',1.1);}
    if(e.type==='topple'){audio.play('crash');shake=1;message('哗啦——货堆倒了！快捡回来',1.5);}
    if(e.type==='protect'){
      protectedUntil=clock+.62;shake=.36;audio.play('protect');burst(s.x,.88,s.z,9);
      note('绑带保住了货！',s.x,2.02,s.z);
    }
    if(e.type==='drop'){audio.play('drop');shake=Math.max(shake,.7);note('掉了'+goods[e.kind].name,s.x,1.85,s.z,true);}
    if(e.type==='bump'){audio.play('bump');shake=.5;}
    if(e.type==='dash'){audio.play('dash');for(let k=0;k<6;k++)burst(s.x-Math.sin(s.angle)*.8,.2,s.z+Math.cos(s.angle)*.8,2);}
    if(e.type==='ram'){audio.play('ram');shake=.8;bubble(e.who+1,pick(rivalLines.ram),1.3,'hit');burst(e.x,1,e.z,16);if(e.kind)note('撞掉了'+goods[e.kind].name+'！',e.x,2.2,e.z);}
    if(e.type==='charge'){bubble(e.who+1,pick(rivalLines.charge),1.2,'mad');audio.play('charge');}
    if(e.type==='rammed'){audio.play('ram');shake=1;message(s.rivals[e.who].name+'撞过来了！',1.2);}
    if(e.type==='list'){audio.play('check');note('清单 ✓ '+goods[e.kind].name,s.x,2.3,s.z);}
    if(e.type==='listDone'){audio.play('upgrade');setTimeout(()=>stamp('清单买齐！','+'+currency(e.amount),'mint'),900);}
    if(e.type==='frenzy'){audio.play('siren');alarm('关门大甩卖！','最后 10 秒 · 结账翻倍 ×2','gold');document.body.classList.add('frenzy');}
    if(e.type==='bank'){
      if(e.who==='you'){
        guide='auto';audio.play('paid');checkoutShow(e);
        for(const k of s.banked)catalog.add(k);
        save('catalog',JSON.stringify([...catalog]));
        garage=readGarage(garage);
        const gained=creditSavings(garage,e.amount);ticketsEarned+=gained;
        save('garage',JSON.stringify(garage));
        if(gained)note('+'+gained+' 升级券',e.x,2.4,e.z);
        moneyPulse=1;
      }
      else note(s.rivals[e.who].name+' +'+e.amount,e.x,1.55,e.z);
    }
    if(e.type==='end'){audio.play('closed');document.body.classList.remove('frenzy');receipt();}
  }
  if(s.events.length){s.pickups.forEach((p,i)=>props[i].userData.item.visible=p.available);syncLoose();refreshHUD();}
}
function step(dt,input){
  const oldTime=Math.ceil(s.time);
  advanceShop(s,dt,input);events();
  if(Math.ceil(s.time)!==oldTime){refreshHUD();el('seconds').textContent=Math.ceil(s.time);if(s.time<=5){el('clock').classList.add('urgent');if(s.phase==='play')audio.play('tick');}}
}
const moves=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
window.addEventListener('keydown',e=>{
  if(e.code==='Escape'||e.code==='KeyP'){if(!e.repeat){if(paused)resume();else pause();}e.preventDefault();return;}
  if(e.code==='Space'&&!panel.open&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();if(!e.repeat){audio.unlock();if(dash(s))events();}return;}
  if(!moves.has(e.code)||panel.open)return;e.preventDefault();audio.unlock();keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
function input(){return {x:touch.dx+Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),z:touch.dz+Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))};}
function beginDrag(e,fromStart=false){
  if(panel.open||touch.active!==null||e.button!==0)return;
  audio.unlock();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
  Object.assign(touch,{active:e.pointerId,fromStart,x:e.clientX,y:e.clientY,dx:0,dz:0});
  const j=el('joy');j.style.left=e.clientX+'px';j.style.top=e.clientY+'px';j.firstElementChild.style.transform='none';j.hidden=false;
}
function startRush(){
  if(panel.open||s.phase!=='ready')return;
  audio.unlock();canvas.focus({preventScroll:true});step(0,{x:0,z:0,start:true});
}
canvas.addEventListener('pointerdown',e=>beginDrag(e));
el('startRush').addEventListener('pointerdown',e=>beginDrag(e,true));
el('startRush').addEventListener('click',startRush);
canvas.addEventListener('pointermove',e=>{
  if(e.pointerId!==touch.active)return;
  const x=e.clientX-touch.x,y=e.clientY-touch.y,len=Math.hypot(x,y),r=Math.max(38,len);
  touch.dx=x/r;touch.dz=y/r;el('joy').firstElementChild.style.transform='translate('+touch.dx*29+'px,'+touch.dz*29+'px)';
});
function lift(e){
  if(e.pointerId!==touch.active)return;
  const tapStart=touch.fromStart&&e.type==='pointerup';
  touch.active=null;touch.fromStart=false;touch.dx=touch.dz=0;el('joy').hidden=true;
  if(tapStart)startRush();
}
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,lift);
el('load').onclick=()=>{if(!s.items.length)return;guide=cachedGoal.pay?'hunt':'pay';refreshHUD();canvas.focus({preventScroll:true});};
el('dash').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();audio.unlock();if(dash(s))events();});
el('startMap').onclick=()=>{paused=true;mapChooser(resume);};
el('startGarage').onclick=()=>{paused=true;showGarage(resume);};
el('startBook').onclick=()=>{paused=true;showCatalog(resume);};
el('pause').onclick=pause;panel.addEventListener('cancel',e=>{e.preventDefault();if(paused)resume();});
el('mapButton').onclick=mapPanel;
el('branchName').onclick=()=>{paused=true;mapChooser(resume);};
el('garageButton').onclick=()=>{if(s.phase==='ready'){paused=true;showGarage(resume);}};
el('audio').onclick=()=>{soundOn=!soundOn;save('sound',soundOn?'on':'off');audio.set(soundOn);if(soundOn){audio.unlock();audio.play('pickup');}soundIcon();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&s.phase==='play')pause();});
window.addEventListener('blur',stopInput);
refreshHUD();syncMapTitle();syncStart();camera(0,true);
if(query.has('qa'))window.cartLab={state:()=>s,step:(dt,x,z)=>{for(let a=0;a<dt-1e-8;a+=1/60)step(Math.min(1/60,dt-a),{x,z});},reset,renderer,dash:()=>{if(dash(s))events();},receipt,frame:()=>{camera(0);animatePeople();effects(1/60);renderer.render(scene,cam);}};
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const elapsed=Math.max(0,(now-last)/1000),dt=Math.min(.30,elapsed);last=now;if(document.hidden)return;
  if(!paused){clock+=dt;
    const move=input();
    const matchTime=s.phase==='play'?Math.min(s.time,elapsed):dt;
    for(let t=0;t<matchTime&&s.phase!=='closed';t+=1/45)step(Math.min(1/45,matchTime-t),move);
    if(s.phase==='play')audio.tick(dt,s.frenzy);
    camera(dt);animatePeople();
    props.forEach((stand,i)=>{const p=stand.userData.item;if(p.visible){p.position.y=(bulky(s.pickups[i].kind)?.43:.22)+.055*Math.sin(clock*2.3+i);}});
    const offer=s.waves[s.wave];spotlightRing.visible=!!offer?.available;
    if(spotlightRing.visible){const phase=clock*1.26%1;spotlightRing.position.set(offer.x,.21,offer.z);spotlightRing.scale.set(1.5+phase,.72+phase*.5,1);spotlightRing.material.opacity=1-phase;}
    if(clock-lastMap>.10||lastMap<0){drawMap();lastMap=clock;}
    if(shownMoney!==s.paid){shownMoney=s.paid<shownMoney?s.paid:Math.min(s.paid,shownMoney+Math.max(7,(s.paid-shownMoney)*dt*4));el('amount').textContent=currency(Math.round(shownMoney));}
    props.forEach(stand=>{const st=stand.userData.item.userData.sticker;if(st)st.rotation.z=Math.sin(clock*3+stand.position.x)*.08;});
    effects(dt);
  }
  positionTags();renderer.render(scene,cam);
}
requestAnimationFrame(frame);
