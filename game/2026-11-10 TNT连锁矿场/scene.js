import * as THREE from './vendor/three.module.js';
import {TYPES,COLS,frontier,blastArea} from './core.mjs';
import {CaveBloom,CaveJewels,CaveAtmosphere} from './visuals.js';
import {PaintedTiles} from './art.js';
const STEP=1.04, tmp=new THREE.Vector3();
export class MineScene {
  constructor(canvas,callbacks){
    this.canvas=canvas;this.callbacks=callbacks;this.run=null;this.blocks=new Map();this.particles=[];this.rings=[];this.t=0;this.offset=0;this.wantOffset=0;this.shake=0;this.swing=0;this.hover=null;this.reduced=false;this.auto=true;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setClearColor(0x20877e,1);this.bloom=new CaveBloom(this.renderer);
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-5,5,5,-5,.1,100);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x426c68,1.2));const sun=new THREE.DirectionalLight(0xfff3cf,1.25);sun.position.set(-5,9,12);this.scene.add(sun);
    const fill=new THREE.DirectionalLight(0x92ffed,.35);fill.position.set(7,-3,5);this.scene.add(fill);
    this.board=new THREE.Group();this.scene.add(this.board);this.decor=new THREE.Group();this.scene.add(this.decor);this.fx=new THREE.Group();this.scene.add(this.fx);
    this.painted=new PaintedTiles();this.jewels=new CaveJewels();this.jewels.painted=this.painted.ready;this.atmosphere=new CaveAtmosphere(this.scene);
    this.geo=new THREE.BoxGeometry(.98,.98,.78);this.rockGeos=[0,1,2].map(v=>this.rockGeometry(v));this.particleGeo=new THREE.BoxGeometry(1,1,1);this.materialCache=new Map();this.crackCache=new Map();this.glows=[];this.pickups=[];this.pickupGeo=new THREE.OctahedronGeometry(.17,0);this.rayGeo=new THREE.PlaneGeometry(.025,.75);this.badgeGeo=new THREE.PlaneGeometry(.3,.075);this.badgeMaterials=new Map();
    this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.marker=new THREE.Group();this.scene.add(this.marker);
    const borderGeo=new THREE.EdgesGeometry(new THREE.BoxGeometry(.99,.99,.82));this.highlightGeo=borderGeo;
    this.cursor=new THREE.LineSegments(borderGeo,new THREE.LineBasicMaterial({color:0xfff0b0,transparent:true,opacity:.9}));this.cursor.visible=false;this.scene.add(this.cursor);this.preview=new THREE.Group();this.scene.add(this.preview);this.previewGeo=new THREE.PlaneGeometry(.98,.98);this.previewMat=new THREE.MeshBasicMaterial({color:0xffd562,transparent:true,opacity:.2,depthTest:false,depthWrite:false});
    this.routeGuide=new THREE.Group();this.scene.add(this.routeGuide);this.routeKey=null;
    const corners=[];for(const sx of[-1,1])for(const sy of[-1,1]){const p=[[.28,.49],[.4,.49],[.4,.49],[.49,.4],[.49,.4],[.49,.28]];for(const[x,y]of p)corners.push(new THREE.Vector3(x*sx,y*sy,.43));}this.highlightGeo=new THREE.BufferGeometry().setFromPoints(corners);
    this.miner=this.makeMiner();const illustratedMiner=this.painted.miner();if(illustratedMiner){for(const child of this.miner.children)child.visible=false;this.miner.add(illustratedMiner);}this.scene.add(this.miner);this.minerPos=new THREE.Vector3(0,.8,1);this.minerGoal=this.minerPos.clone();
    this.makeSurface();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);this.resize();
    this.bindInput();this.lastTime=performance.now();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
  }
  material(type,r=0,c=0){
    if(this.painted.ready)return this.painted.material(type);
    const variant=type!=='tnt'&&type!=='cache'?(r*3+c)%3:0,key=`${this.biome||0}-${type}-${variant}`;if(this.materialCache.has(key))return this.materialCache.get(key);
    const tex=document.createElement('canvas');tex.width=tex.height=96;const x=tex.getContext('2d');x.imageSmoothingEnabled=false;
    const base={dirt:['#705136','#a47b48','#292727'],stone:this.biome===1?['#71532e','#a8894d','#292c29']:['#204353','#416e82','#071e2d'],coal:['#607884','#91acb7','#203443'],gold:['#647e87','#a6b6b5','#243b4e'],diamond:['#20566f','#449da9','#102e48'],tnt:['#e54e30','#ffb077','#702427'],bedrock:['#102939','#2d4a5e','#041521'],cache:['#9d652a','#f0c46e','#432d26']}[type];
    x.fillStyle=base[2];x.fillRect(0,0,96,96);x.fillStyle=base[0];x.fillRect(4,4,88,88);x.fillStyle=base[1];x.fillRect(7,6,79,5);x.fillRect(5,13,4,66);x.fillStyle=base[2];x.fillRect(9,85,78,7);x.fillRect(86,12,6,72);
    if(type!=='tnt'&&type!=='cache'){
      const poly=(color,pts)=>{x.fillStyle=color;x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.fill();};
      x.fillStyle=base[2];x.fillRect(0,0,96,96);
      poly(base[0],[[10,5],[46,3],[85,7],[93,29],[89,78],[76,91],[19,89],[4,68],[4,25]]);
      poly(base[1],[[10,8],[49,5],[85,10],[77,17],[23,16],[9,37]]);
      poly(base[2],[[89,37],[88,77],[75,91],[19,89],[9,72],[36,79],[72,77]]);
      x.globalAlpha=.2;poly(base[1],[[18,33],[49,24],[75,35],[65,64],[29,68],[13,53]]);x.globalAlpha=1;
    }
    let n=33+variant*47+type.length*45;const rnd=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
    for(let i=0;i<9;i++){x.fillStyle=i%2?base[1]:base[2];x.globalAlpha=.25;const px=10+rnd()*60,py=12+rnd()*60,s=8+rnd()*15;x.beginPath();x.moveTo(px,py);x.lineTo(px+s,py-3);x.lineTo(px+s+4,py+7);x.lineTo(px+3,py+11);x.closePath();x.fill();}x.globalAlpha=1;
    if(['coal','gold','diamond'].includes(type)){
      const colors={coal:['#263943','#54717a','#091f2c'],gold:['#ffd94e','#fff7ba','#c87b20'],diamond:['#49e6ee','#d5ffff','#128cbb']}[type];
      x.globalAlpha=.45;for(const [px,py,s]of [[18,20,22],[51,12,21],[55,47,24],[17,56,23],[40,73,11]]){const dx=variant===1?3:0;x.beginPath();x.moveTo(px+dx,py+4);x.lineTo(px+s*.7+dx,py-2);x.lineTo(px+s+dx,py+s*.5);x.lineTo(px+s*.7+dx,py+s);x.lineTo(px+dx-3,py+s*.8);x.closePath();x.lineWidth=7;x.strokeStyle=base[2];x.stroke();x.fillStyle=colors[0];x.fill();x.beginPath();x.moveTo(px+dx,py+4);x.lineTo(px+s*.7+dx,py-2);x.lineTo(px+s*.55+dx,py+s*.38);x.lineTo(px+dx-1,py+s*.65);x.closePath();x.fillStyle=colors[1];x.fill();x.beginPath();x.moveTo(px+s*.55+dx,py+s*.38);x.lineTo(px+s+dx,py+s*.5);x.lineTo(px+s*.7+dx,py+s);x.lineTo(px+dx-3,py+s*.8);x.closePath();x.fillStyle=colors[2];x.fill();}x.globalAlpha=1;
    }
    if(type==='tnt'){
      x.fillStyle='#b34836';for(let i=0;i<6;i++)x.fillRect(10+i*14,9,3,75);
      x.fillStyle='#fcf1d5';x.fillRect(4,32,88,32);x.fillStyle='#dccba9';x.fillRect(4,60,88,4);x.fillStyle='#5c4435';x.font='bold 28px monospace';x.textAlign='center';x.fillText('TNT',48,57);
      x.fillStyle='#ffd990';x.fillRect(43,7,9,9);
    }
    if(type==='cache'){
      x.fillStyle='#e0b767';x.fillRect(4,20,88,8);x.fillRect(4,67,88,8);x.fillStyle='#533f32';x.fillRect(4,42,88,5);x.fillStyle='#ffdc86';x.fillRect(40,36,17,22);x.fillStyle='#a17c3e';x.fillRect(47,42,4,9);
    }
    if(type==='bedrock'){x.fillStyle='#354b4c';for(let i=0;i<4;i++)x.fillRect(7+i*19,18+(i%2)*27,15,27);}
    // One, two or three dots are the number of pickaxe hits; no arbitrary numbers.
    if(Number.isFinite(TYPES[type].hp)&&type!=='tnt'&&type!=='cache')for(let i=0;i<TYPES[type].hp;i++){x.fillStyle='#203e35aa';x.fillRect(9+i*10,77,7,7);x.fillStyle='#f0e5be';x.fillRect(10+i*10,78,5,4);}
    const texture=new THREE.CanvasTexture(tex);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
    const face=new THREE.MeshLambertMaterial({map:texture,emissive:type==='diamond'?0x07303b:type==='gold'?0x302609:0x000000,emissiveIntensity:.45}),side=new THREE.MeshLambertMaterial({color:base[2]}),top=new THREE.MeshLambertMaterial({color:base[1]});
    const mats=[side,side,top,side,face,side];this.materialCache.set(key,mats);return mats;
  }
  box(w,h,d,color,parent,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));m.position.set(x,y,z);parent.add(m);return m;}
  hardnessBadge(hp){let mat=this.badgeMaterials.get(hp);if(!mat){const c=document.createElement('canvas');c.width=128;c.height=32;const x=c.getContext('2d');for(let i=0;i<hp;i++){x.fillStyle='#082333';x.fillRect(4+i*29,5,23,23);x.fillStyle='#f8df96';x.fillRect(7+i*29,7,17,15);x.fillStyle='#fff7ca';x.fillRect(7+i*29,7,17,4);}const texture=new THREE.CanvasTexture(c);texture.magFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});this.badgeMaterials.set(hp,mat);}const m=new THREE.Mesh(this.badgeGeo,mat);m.position.set(-.26,-.38,.74);return m;}
  rockGeometry(v){const shape=new THREE.Shape(),cut=.09+v*.025,p=[[-.49+cut,-.49],[.49-cut,-.49],[.49,-.49+cut],[.49,.49-cut],[.49-cut,.49],[-.49+cut,.49],[-.49,.49-cut],[-.49,-.49+cut]];p.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.78,bevelEnabled:false,curveSegments:1,UVGenerator:{generateTopUV:(geo,vertices,a,b,c)=>[a,b,c].map(i=>new THREE.Vector2(vertices[i*3]+.5,vertices[i*3+1]+.5)),generateSideWallUV:()=>[new THREE.Vector2(0,0),new THREE.Vector2(1,0),new THREE.Vector2(1,1),new THREE.Vector2(0,1)]}});g.translate(0,0,-.39);return g;}
  glowTexture(){if(this.glowMap)return this.glowMap;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),grad=g.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(255,255,205,1)');grad.addColorStop(.12,'rgba(255,233,91,.85)');grad.addColorStop(.4,'rgba(255,174,21,.22)');grad.addColorStop(1,'rgba(255,148,0,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);this.glowMap=new THREE.CanvasTexture(c);return this.glowMap;}
  glow(parent,x,y,size,color=0xffcb58){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glowTexture(),color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));s.position.set(x,y,.48);s.scale.set(size,size,1);parent.add(s);this.glows.push({sprite:s,size,phase:x*3+y});return s;}
  torch(parent,x,y){this.box(.10,.42,.12,0x382a1d,parent,x,y,.43);this.box(.19,.12,.17,0x81592d,parent,x,y+.14,.46);this.box(.10,.22,.05,0xffc345,parent,x,y+.32,.55);this.box(.05,.12,.055,0xffffbb,parent,x,y+.37,.57);this.glow(parent,x,y+.32,1.85);}
  backdrop(rows){
    const c=document.createElement('canvas');c.width=512;c.height=1536;const g=c.getContext('2d'),amber=this.biome===1,ice=this.biome===2;
    const grad=g.createLinearGradient(0,0,0,1536);grad.addColorStop(0,amber?'#e7b517':ice?'#14a6ba':'#218c80');grad.addColorStop(.45,amber?'#d8a015':ice?'#0d97b2':'#1c857b');grad.addColorStop(1,amber?'#ab7017':ice?'#087492':'#176d70');g.fillStyle=grad;g.fillRect(0,0,512,1536);
    let n=442;const rnd=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
    for(let i=0;i<180;i++){const x=rnd()*512,y=rnd()*1536,w=6+rnd()*25,h=5+rnd()*14;g.fillStyle=i%3===0?(amber?'#fff39c24':'#8df4d922'):(amber?'#91521513':'#064f5d16');g.beginPath();g.ellipse(x,y,w,h,rnd(),0,Math.PI*2);g.fill();}
    for(let i=0;i<7;i++){const x=70+rnd()*380,y=100+i*208;g.strokeStyle=amber?'#ffe88932':'#9fffdc24';g.lineWidth=3;g.beginPath();g.arc(x,y,35+rnd()*50,.2,Math.PI*1.5);g.stroke();g.beginPath();g.arc(x,y,55+rnd()*50,1,Math.PI*1.6);g.stroke();}
    if(!amber)for(let i=0;i<4;i++){g.save();g.translate(i%2?420:80,200+i*350);g.rotate(i%2?-.3:.3);g.globalAlpha=ice?.35:.2;g.fillStyle='#35e6e9';g.strokeStyle='#08708c';g.lineWidth=4;g.beginPath();g.moveTo(-45,60);g.lineTo(-55,-25);g.lineTo(-8,-75);g.lineTo(44,-38);g.lineTo(52,42);g.lineTo(0,76);g.closePath();g.fill();g.stroke();g.fillStyle='#abffff';g.beginPath();g.moveTo(-8,-75);g.lineTo(8,-26);g.lineTo(-25,56);g.lineTo(-45,60);g.closePath();g.fill();g.restore();}
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(12,Math.max(35,rows*STEP+6)),new THREE.MeshBasicMaterial({map:tex}));p.position.set(0,2-Math.max(35,rows*STEP+6)/2,-1.2);this.board.add(p);
    for(let r=-2;r<rows+6;r++)for(const sign of[-1,1]){
      const x=sign*(3.8+((r*7+9)%4)*.12);if(this.painted.ready){const wall=new THREE.Mesh(this.rockGeos[(r+30)%3],[this.painted.material('stone')[4],this.painted.material('stone')[0]]);wall.position.set(x,-r*STEP,-.42);this.board.add(wall);}else this.box(.9+((r+4)%2)*.2,1.04,.8,0x164b60,this.board,x,-r*STEP,-.4);
      if(r%5===1)this.torch(this.board,sign*3.55,-r*STEP+.1);
    }
    for(let r=3;r<rows;r+=6){const side=r%2===0?1:-1;for(let j=0;j<6;j++){this.box(.035,.25+j*.04,.035,0x397b5c,this.board,side*(3.08+j*.08),-r*STEP-j*.11,.45);this.box(.12,.06,.06,0x4c9564,this.board,side*(3.08+j*.08),-r*STEP-j*.11-.1,.46);}}
    // Old mining structures behind the playable rock: depth without fake targets.
    for(let r=0;r<rows;r++){this.box(.055,1.02,.06,0x9a733a,this.board,-2.7,-r*STEP,-.73);this.box(.055,1.02,.06,0x9a733a,this.board,-2.2,-r*STEP,-.73);for(let j=0;j<3;j++)this.box(.55,.04,.07,0xb28b48,this.board,-2.45,-r*STEP+.33-j*.32,-.7);}
    const floor=this.box(7.6,12,1,0x071c29,this.board,0,-rows*STEP-5.4,-.2);
    for(let c=0;c<7;c++)this.box(1.03,.4,.9,0x102d3a,this.board,(c-3)*STEP,-rows*STEP+.1,-.1);
  }
  label(text,size,color){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.font='bold 26px monospace';g.fillStyle=color;g.textAlign='center';g.fillText(text,128,39);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));s.scale.set(size,size/4,1);return s;}
  makeSurface(){
    const group=this.surface=new THREE.Group();this.decor.add(group);
    for(let r=-5;r<=-1;r++){for(const x of[-.33,.33])this.box(.07,1.03,.09,0xb68343,group,x,-r*STEP,-.2);for(let j=0;j<3;j++)this.box(.72,.06,.1,0xd3a15b,group,0,-r*STEP+.3-j*.3,-.18);}
    this.box(7.4,.17,.2,0x715035,group,0,1.8,-.35);for(const x of[-3.45,3.45])this.box(.16,2.1,.2,0x715035,group,x,.8,-.35);
    this.torch(group,-2.95,1.1);this.torch(group,2.95,1.1);
    for(const side of[-1,1])for(let j=0;j<5;j++){this.box(.12,.45+j*.1,.07,0x438262,group,side*(2.2+j*.13),1.7-j*.12,.05);this.box(.22,.08,.09,0x65a469,group,side*(2.2+j*.13),1.5-j*.12,.06);}
  }
  makeMiner(){
    const g=new THREE.Group();this.box(.36,.38,.25,0x418b91,g,0,.32,0);this.box(.29,.28,.27,0xe5b67c,g,0,.67,0);this.box(.38,.17,.32,0xe3af43,g,0,.86,0);this.box(.46,.045,.37,0xffd579,g,0,.78,.04);this.box(.105,.09,.055,0xfff1bb,g,0,.86,.19);
    this.box(.13,.24,.14,0x3d5a69,g,-.11,.06,0);this.box(.13,.24,.14,0x3d5a69,g,.11,.06,0);this.box(.15,.08,.23,0x384946,g,-.11,-.07,.035);this.box(.15,.08,.23,0x384946,g,.11,-.07,.035);
    this.box(.13,.27,.13,0xe3b477,g,-.25,.35,.02);this.arm=new THREE.Group();this.arm.position.set(.23,.48,.04);g.add(this.arm);this.box(.13,.28,.13,0xe3b477,this.arm,0,-.12,0);this.box(.07,.55,.07,0x9e7346,this.arm,.07,-.09,.08);this.box(.43,.11,.12,0xaad9cf,this.arm,.07,.16,.08);
    this.box(.045,.05,.015,0x38483d,g,-.07,.69,.145);this.box(.045,.05,.015,0x38483d,g,.07,.69,.145);
    // A readable equipment silhouette, still the same safe cosmetic miner.
    this.box(.35,.29,.15,0x705239,g,0,.39,-.18);this.box(.28,.05,.2,0xc39954,g,0,.4,-.19);this.box(.38,.07,.28,0x725737,g,0,.2,.01);this.box(.10,.08,.035,0xffde8a,g,0,.2,.16);
    for(const x of[-.12,.12]){this.box(.04,.26,.035,0xe8bb5e,g,x,.39,.14);this.box(.12,.065,.06,0xf5d473,g,x,.53,.14);}
    this.box(.25,.05,.035,0x86542a,g,0,.92,.17);this.box(.07,.12,.035,0xffdf86,g,-.15,.86,.09);this.box(.07,.12,.035,0xffdf86,g,.15,.86,.09);this.box(.13,.12,.06,0x576d79,g,0,.86,.185);this.box(.08,.07,.07,0xf9fff0,g,0,.86,.224);
    this.box(.13,.14,.15,0x5c4735,this.arm,0,-.22,0);this.box(.13,.15,.13,0xd9f0ef,this.arm,-.16,.1,.08);this.box(.12,.12,.13,0x6caebd,this.arm,.24,.12,.08);
    g.scale.setScalar(1.08);const lamp=this.glow(g,0,.83,.9,0xbffff0);lamp.position.z=.18;return g;
  }
  load(run){
    this.clearRoute();
    this.jewels.reset();
    this.run=run;for(const m of this.board.children){if(m.geometry&&!m.isSprite&&m.geometry!==this.geo&&!this.rockGeos.includes(m.geometry))m.geometry.dispose();if(m.material&&!Array.isArray(m.material)){if(m.material.map&&m.material.map!==this.glowMap)m.material.map.dispose();m.material.dispose();}}this.glows=this.glows.filter(g=>g.sprite.parent!==this.board);this.board.clear();this.blocks.clear();for(const m of this.marker.children)m.material.dispose();this.marker.clear();this.preview.clear();this.cursor.visible=false;this.hover=null;this.clearFX();this.offset=this.wantOffset=0;this.auto=true;this.biome=run.mode==='lesson'?run.index:run.seed%3;
    this.backdrop(run.grid.length);
    this.renderer.setClearColor(this.biome===1?0xe7b517:this.biome===2?0x14a6ba:0x218c80,1);
    this.atmosphere.load(run.grid.length,this.biome);
    for(let r=0;r<run.grid.length;r++){
      for(let c=0;c<COLS;c++){
        if(run.grid[r][c])this.addBlock(r,c,run.grid[r][c]);
        if(c===0&&r%3===0){const l=this.label(`${r+1}m`,.62,'#e4e2b6');l.position.set(-4.15,-r*STEP,.1);this.board.add(l);}
      }
      if(r%6===3){this.box(7.2,.1,.12,0x8a633a,this.board,0,-r*STEP-.5,-.8);this.torch(this.board,r%2?3.25:-3.25,-r*STEP-.3);}
    }
    this.minerPos.set(0,.8,1);if(run.strikes>0&&run.depth>0){const r=Math.min(run.grid.length-1,run.depth-1),empty=run.grid[r].map((t,c)=>t?null:c).filter(c=>c!==null).sort((a,b)=>Math.abs(a-3)-Math.abs(b-3));if(empty.length)this.minerPos.set((empty[0]-3)*STEP,-r*STEP+.05,.95);}this.minerGoal.copy(this.minerPos);this.setCamera();this.refresh();if(run.depth>2)this.follow(run.depth,true);this.callbacks.depth?.(this.offset);
  }
  addBlock(r,c,type){const mats=this.material(type,r,c),rock=type!=='tnt'&&type!=='cache';const mesh=new THREE.Mesh(rock?this.rockGeos[(r+c)%3]:this.geo,rock?[mats[4],mats[0]]:mats);mesh.position.set((c-3)*STEP,-r*STEP,0);mesh.userData={r,c,type};const ore=this.jewels.cluster(type,r,c);if(ore)mesh.add(ore);if(rock&&Number.isFinite(TYPES[type].hp))mesh.add(this.hardnessBadge(TYPES[type].hp));this.board.add(mesh);this.blocks.set(`${r},${c}`,mesh);if(type==='cache')this.glow(this.board,mesh.position.x,mesh.position.y,2,0xffdc75).userData.cell=`${r},${c}`;return mesh;}
  crack(r,c){const mesh=this.blocks.get(`${r},${c}`);if(!mesh)return;
    const hits=this.run.hits[r][c];if(!hits)return;
    const key=`${r},${c}`;if(mesh.userData.crack){this.board.remove(mesh.userData.crack);mesh.userData.crack.geometry.dispose();mesh.userData.crack.material.dispose();}
    const pts=[[-.08,.4],[.04,.15],[-.12,.02],[.08,-.16],[-.02,-.42],[.08,-.16],[.33,-.1],[.04,.15],[.28,.24]].map(([x,y])=>new THREE.Vector3(mesh.position.x+x,mesh.position.y+y,.411));
    const geo=new THREE.BufferGeometry().setFromPoints(pts),line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x233f38,linewidth:2}));this.board.add(line);mesh.userData.crack=line;
  }
  refresh(){
    if(!this.run)return;this.edge=frontier(this.run);
    for(const m of this.blocks.values())this.crack(m.userData.r,m.userData.c);
    // Reachability has a geometric outline; shared ore materials stay consistent.
    for(const child of this.marker.children)child.material.dispose();this.marker.clear();
    for(const key of this.edge){const m=this.blocks.get(key);if(!m)continue;const l=new THREE.LineSegments(this.highlightGeo,new THREE.LineBasicMaterial({color:0xf8e4a3,transparent:true,opacity:.45}));l.position.copy(m.position);l.position.z=.015;this.marker.add(l);}
    this.syncTargets();
  }
  resize(){const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);this.renderer.setSize(this.width,this.height,false);this.bloom.resize(this.width,this.height);this.worldWidth=8.2;this.worldHeight=this.worldWidth*this.height/this.width;this.camera.left=-this.worldWidth/2;this.camera.right=this.worldWidth/2;this.camera.top=this.worldHeight/2;this.camera.bottom=-this.worldHeight/2;this.camera.updateProjectionMatrix();this.setCamera();this.syncTargets();}
  setCamera(){const y=4.3-this.worldHeight/2-this.offset;this.camera.position.set(1.3,y+1.7,30);this.camera.lookAt(0,y,0);this.camera.updateMatrixWorld();}
  project(r,c,z=.43){tmp.set((c-3)*STEP,-r*STEP,z).project(this.camera);return {x:(tmp.x*.5+.5)*this.width,y:(-.5*tmp.y+.5)*this.height};}
  syncTargets(){if(!this.run)return;this.callbacks.targets?.(this.run,this.edge,(r,c)=>this.project(r,c),this.width/this.worldWidth*.92);}
  follow(depth,immediate=false){this.auto=true;const visible=this.worldHeight-8;this.wantOffset=Math.max(0,depth*STEP-visible);this.clampOffset();if(immediate){this.offset=this.wantOffset;this.setCamera();this.syncTargets();this.callbacks.depth?.(this.offset);}}
  clearRoute(){for(const m of this.routeGuide.children){if(m.isSprite)m.material.map?.dispose();m.material.dispose();}this.routeGuide.clear();this.routeKey=null;}
  showRoute(r,c){this.clearRoute();this.routeKey=`${r},${c}`;const x=(c-3)*STEP,y=-r*STEP,line=new THREE.LineSegments(this.cursor.geometry,new THREE.LineBasicMaterial({color:0xaaffdd,transparent:true,opacity:1,depthTest:false}));line.position.set(x,y,.04);this.routeGuide.add(line);const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const g=canvas.getContext('2d');g.fillStyle='#eaff9a';g.strokeStyle='#155851';g.lineWidth=5;g.beginPath();g.moveTo(10,5);g.lineTo(54,5);g.lineTo(32,60);g.closePath();g.fill();g.stroke();const texture=new THREE.CanvasTexture(canvas),arrow=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));arrow.position.set(x,y+.74,1);arrow.scale.set(.55,.55,1);this.routeGuide.add(arrow);this.follow(r+1,true);}
  pan(amount){this.auto=false;this.wantOffset+=amount;this.clampOffset();}
  clampOffset(){this.wantOffset=Math.max(0,Math.min(Math.max(0,(this.run?.grid.length||7)*STEP-this.worldHeight+7.2),this.wantOffset));}
  pointerCell(clientX,clientY){const r=this.canvas.getBoundingClientRect();this.pointer.set((clientX-r.left)/r.width*2-1,-((clientY-r.top)/r.height)*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects([...this.blocks.values()],false)[0];return hit?.object.userData;}
  bindInput(){
    let down=null;
    this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.canvas.setPointerCapture(e.pointerId);down={x:e.clientX,y:e.clientY,last:e.clientY,drag:false};});
    this.canvas.addEventListener('pointermove',e=>{if(down){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>9)down.drag=true;if(down.drag){this.pan((down.last-e.clientY)/this.height*this.worldHeight);down.last=e.clientY;}return;}if(e.pointerType!=='touch')this.setHover(this.pointerCell(e.clientX,e.clientY));});
    this.canvas.addEventListener('pointerup',e=>{if(!down)return;const click=!down.drag;down=null;if(click){const cell=this.pointerCell(e.clientX,e.clientY);if(cell)this.callbacks.mine?.(cell.r,cell.c);}});
    this.canvas.addEventListener('pointercancel',()=>{down=null;});this.canvas.addEventListener('pointerleave',()=>this.setHover(null));
    this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.pan(Math.sign(e.deltaY)*1.25);},{passive:false});
    window.addEventListener('blur',()=>{down=null;});
  }
  setHover(cell){this.hover=cell;this.cursor.visible=!!cell;this.preview.clear();if(cell){this.cursor.position.set((cell.c-3)*STEP,-cell.r*STEP,.02);this.cursor.material.color.set(this.edge?.has(`${cell.r},${cell.c}`)?0xffedbb:0xc78d72);if(cell.type==='tnt'&&this.edge?.has(`${cell.r},${cell.c}`))for(const[r,c]of blastArea(this.run,cell.r,cell.c)){const p=new THREE.Mesh(this.previewGeo,this.previewMat);p.position.set((c-3)*STEP,-r*STEP,.44);this.preview.add(p);}this.callbacks.hover?.(cell.r,cell.c);}else this.callbacks.hover?.(null,null);}
  animateEvent(event){
    const key=`${event.r},${event.c}`,m=this.blocks.get(key);const pos=new THREE.Vector3((event.c-3)*STEP,-event.r*STEP,.5);
    if(key===this.routeKey)this.clearRoute();
    if(event.kind==='break'){
      this.preview.clear();this.cursor.visible=false;for(let i=this.glows.length-1;i>=0;i--){const g=this.glows[i];if(g.sprite.userData.cell===key){g.sprite.parent?.remove(g.sprite);g.sprite.material.dispose();this.glows.splice(i,1);}}
      if(m){this.board.remove(m);if(m.userData.crack){m.userData.crack.geometry.dispose();m.userData.crack.material.dispose();this.board.remove(m.userData.crack);}this.blocks.delete(key);}
      this.burst(pos,TYPES[event.type].color,event.type==='diamond'?14:8,event.type==='tnt'?1.5:1);
      if(event.value){this.callbacks.float?.(event,this.project(event.r,event.c));for(let i=0;i<(event.type==='diamond'?3:2);i++){const mesh=new THREE.Mesh(this.pickupGeo,new THREE.MeshBasicMaterial({color:event.type==='diamond'?0x7cffff:0xffe676}));mesh.position.copy(pos);mesh.position.x+=(i-1)*.16;mesh.position.z=1.1;this.fx.add(mesh);this.pickups.push({mesh,start:mesh.position.clone(),life:-i*.06});}}
    } else if(event.kind==='blast'){
      this.shake=this.reduced?0:.18;this.burst(pos,'#ffe17b',this.reduced?8:26,2.5);
      if(!this.reduced)for(let i=0;i<10;i++){const angle=i*Math.PI/5+.2,ray=new THREE.Mesh(this.rayGeo,new THREE.MeshBasicMaterial({color:i%2?0xffd45b:0xc1fffa,transparent:true,opacity:.9,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));ray.position.copy(pos);ray.position.z=1.5;ray.rotation.z=angle-Math.PI/2;this.fx.add(ray);this.rings.push({mesh:ray,life:0,max:.42,ray:true,angle,center:pos.clone()});}
      if(!this.reduced)for(let i=0;i<8;i++){const angle=i*Math.PI/4+.4,star=new THREE.Sprite(new THREE.SpriteMaterial({map:this.jewels.starMap,color:i%3?0xfff9ba:0xb9ffff,transparent:true,opacity:1,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending}));star.position.copy(pos);star.position.z=1.6;this.fx.add(star);this.rings.push({mesh:star,life:0,max:.58,flash:true,spark:true,base:.18+(i%3)*.08,angle,center:pos.clone()});}
      const flash=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glowTexture(),color:0xffee96,transparent:true,blending:THREE.AdditiveBlending,depthTest:false}));flash.position.copy(pos);flash.position.z=2;flash.scale.set(5,5,1);this.fx.add(flash);this.rings.push({mesh:flash,life:0,max:.4,flash:true});
      const ring=new THREE.Mesh(new THREE.RingGeometry(.3,.36,32),new THREE.MeshBasicMaterial({color:0xfff8b6,transparent:true,opacity:.9,depthTest:false,side:THREE.DoubleSide}));ring.position.copy(pos);ring.position.z=1;this.fx.add(ring);this.rings.push({mesh:ring,life:0,max:.48});
    } else if(event.kind==='hit'){this.swing=1;this.crack(event.r,event.c);this.burst(pos,TYPES[event.type].color,4,.65);}
    this.swing=1;
  }
  finishAction(r,c){this.refresh();if(this.auto)this.follow(this.run.depth);if(!this.run.grid[r]?.[c])this.minerGoal.set((c-3)*STEP,-r*STEP+.05,.95);}
  burst(pos,color,count,power){if(this.reduced)count=Math.min(count,4);while(this.particles.length+count>160){const old=this.particles.shift();this.fx.remove(old.mesh);old.mesh.material.dispose();}
    for(let i=0;i<count;i++){const s=.05+Math.random()*.1,mesh=new THREE.Mesh(this.particleGeo,new THREE.MeshLambertMaterial({color,transparent:true}));mesh.scale.setScalar(s);mesh.position.copy(pos);this.fx.add(mesh);this.particles.push({mesh,vel:new THREE.Vector3((Math.random()-.5)*4*power,(Math.random()*.8+.3)*3*power,Math.random()*2),life:0,max:.45+Math.random()*.4});}}
  clearFX(){for(const p of [...this.particles,...this.pickups]){this.fx.remove(p.mesh);p.mesh.material.dispose();}for(const r of this.rings){this.fx.remove(r.mesh);if(!r.flash&&!r.ray)r.mesh.geometry.dispose();r.mesh.material.dispose();}this.particles=[];this.pickups=[];this.rings=[];this.shake=0;}
  frame(now){const dt=Math.min(.04,(now-this.lastTime)/1000);this.lastTime=now;this.t+=dt;
    if(document.hidden){this.raf=requestAnimationFrame(this.frame);return;}
    if(Math.abs(this.wantOffset-this.offset)>.003){this.offset+=(this.wantOffset-this.offset)*(this.reduced?1:Math.min(1,dt*9));this.setCamera();this.syncTargets();this.callbacks.depth?.(this.offset);}
    this.shake*=Math.exp(-dt*12);if(this.shake>.001){this.setCamera();this.camera.position.x+=Math.sin(this.t*90)*this.shake;this.camera.position.y+=Math.cos(this.t*70)*this.shake;}
    if(this.shake<=.001)this.setCamera();
    this.swing=Math.max(0,this.swing-dt*4);this.arm.rotation.z=this.reduced?0:-Math.sin(this.swing*Math.PI)*1.2;
    this.miner.rotation.z=this.reduced?0:-Math.sin(this.swing*Math.PI)*.12;
    this.jewels.update(this.t,this.reduced);this.atmosphere.update(this.t,this.reduced);
    for(const g of this.glows){const pulse=this.reduced?1:1+Math.sin(this.t*4+g.phase)*.06;g.sprite.scale.set(g.size*pulse,g.size*pulse,1);g.sprite.material.opacity=this.reduced?.75:.75+Math.sin(this.t*5+g.phase)*.12;}
    this.minerPos.lerp(this.minerGoal,Math.min(1,dt*9));this.miner.position.copy(this.minerPos);this.miner.position.y+=this.reduced?0:Math.sin(this.t*2)*.014;
    for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life+=dt;p.vel.y-=dt*11;p.mesh.position.addScaledVector(p.vel,dt);p.mesh.rotation.x+=dt*3;p.mesh.rotation.z+=dt*5;p.mesh.material.opacity=1-p.life/p.max;if(p.life>=p.max){this.fx.remove(p.mesh);p.mesh.material.dispose();this.particles.splice(i,1);}}
    for(let i=this.pickups.length-1;i>=0;i--){const p=this.pickups[i];p.life+=dt;if(p.life<0)continue;const k=Math.min(1,p.life/.72),e=k*k;const end=new THREE.Vector3(3,4.3-this.offset-.8,2);p.mesh.position.lerpVectors(p.start,end,e);p.mesh.position.y+=Math.sin(k*Math.PI)*1.2;p.mesh.rotation.y+=dt*5;p.mesh.rotation.z+=dt*4;p.mesh.scale.setScalar(1-k*.5);if(k>=1){this.fx.remove(p.mesh);p.mesh.material.dispose();this.pickups.splice(i,1);}}
    for(let i=this.rings.length-1;i>=0;i--){const r=this.rings[i];r.life+=dt;if(r.ray||r.spark){const speed=r.spark?3:5;r.mesh.position.x=r.center.x+Math.cos(r.angle)*r.life*speed;r.mesh.position.y=r.center.y+Math.sin(r.angle)*r.life*speed;}r.mesh.scale.setScalar(r.spark?r.base*(1+r.life):r.ray?1+r.life*1.5:r.flash?5+r.life*5:1+r.life*7);r.mesh.material.opacity=(this.reduced&&r.flash?.3:1)*(1-r.life/r.max);if(r.life>=r.max){this.fx.remove(r.mesh);if(!r.flash&&!r.ray)r.mesh.geometry.dispose();r.mesh.material.dispose();this.rings.splice(i,1);}}
    this.bloom.render(this.scene,this.camera);this.raf=requestAnimationFrame(this.frame);
  }
}
