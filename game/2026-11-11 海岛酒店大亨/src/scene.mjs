import {buildVillaEstate,villaDetails} from './villa-art.mjs';
import {careerTitle,titleIndex,boostActive,poolCapacity} from './progression.mjs';
import {HOTEL_PALETTE as P} from './palette.mjs';
import * as T from '../vendor/three.module.js';
import {M,mat,box,sphere,cylinder,torus,batch,batchSurfaces,textSprite,floorTexture,plant,palm,cashPile,fabricTexture,rippleTexture,contactShadow} from './art.mjs';
import {ROOMS,SPOTS,roomSpot,moneySpot} from './config.mjs';
import {makePerson,disposePerson} from './characters.mjs';
import {buildLobbyShell,lobbyShadows} from './lobby-shell.mjs';
import {seaMaterial,poolMaterial} from './water.mjs';
import {HotelEffects} from './effects.mjs';
import {dressWindow,finishRoom,constructionPad} from './room-details.mjs';
import {WORLD_SCALE,FOLLOW_HEIGHT,CAMERA_OFFSET,projectPoint,screenDirection,pickFloor} from './presentation.mjs';
export class HotelScene{
 constructor(canvas){
  this.canvas=canvas;this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.NoToneMapping;this.renderer.toneMappingExposure=1;
  this.scene=new T.Scene();this.scene.scale.set(WORLD_SCALE,1,WORLD_SCALE);this.scene.background=new T.Color('#8bd9e3');this.scene.fog=new T.Fog('#a9e5e7',90,180);this.camera=new T.OrthographicCamera(-20,20,20,-20,.1,240);this.target=new T.Vector3(0,0,3);this.overview=false;this.ray=new T.Raycaster();this.ground=new T.Plane(new T.Vector3(0,1,0),-.15);this.roomViews=new Map();this.people=new Map();this.palms=[];this.particles=[];this.lastBuild='';
  this.scene.add(new T.HemisphereLight('#ffffff','#cee7fa',1.55));const sun=new T.DirectionalLight('#fffefa',2.05);sun.position.set(-17,34,19);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-39,right:39,top:38,bottom:-38,near:1,far:120});sun.shadow.bias=-.0003;sun.shadow.normalBias=.045;sun.shadow.radius=3;this.scene.add(sun,sun.target);this.sun=sun;
  this.base();this.effects=new HotelEffects(this.scene);this.owner=makePerson('owner',1);this.scene.add(this.owner.root);this.ring=torus(this.scene,0,.2,0,.58,.045,mat('#fff4b7'));this.routeDots=[];for(let i=0;i<36;i++){const d=sphere(this.scene,0,.22,0,.065,mat('#ffcd67'));d.visible=false;this.routeDots.push(d);}
  this.dest=new T.Group();torus(this.dest,0,.47,0,.48,.045,M.teal);const a=textSprite('▼','#ffffff',.65);a.position.set(0,1.7,0);this.dest.add(a);this.scene.add(this.dest);this.dest.visible=false;this.serviceRing=new T.Mesh(new T.RingGeometry(.64,.73,64),new T.MeshBasicMaterial({color:'#ffd45c',side:T.DoubleSide,transparent:true,opacity:.95,depthWrite:false}));this.serviceRing.rotation.x=-Math.PI/2;this.scene.add(this.serviceRing);this.thumbCache=new Map();this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.width=w;this.height=h;}
 base(){
  const g=new T.Group();this.scene.add(g);
  this.water=new T.Mesh(new T.PlaneGeometry(350,350,56,56),seaMaterial());this.water.rotation.x=-Math.PI/2;this.water.position.y=-1;this.scene.add(this.water);
  const island=cylinder(g,0,-1.1,0,31,1.7,mat('#eed6a0'),32);island.scale.set(1.25,1,1.12);
  const shore=cylinder(g,0,-.36,0,29,.3,mat('#f7dfad'));shore.scale.set(1.32,1,1.12);
  const lawn=cylinder(g,0,-.19,0,24.8,.16,mat(P.lawn));lawn.scale.set(1.28,1,1.08);
  const foundation=box(g,0,-.07,-2.3,27.4,.55,38.6,M.ivory,.35);const lobbyMat=new T.MeshStandardMaterial({color:'#ffffff',map:floorTexture('lobby'),roughness:.9});box(g,0,.23,-2.3,26,.1,37.3,lobbyMat,.05);
  box(g,0,.3,-8.2,5.5,.035,25,mat('#f5bd75'),.04);const carpetMap=floorTexture('carpet');carpetMap.repeat.set(1,5);box(g,0,.325,-8.2,4.8,.02,25,new T.MeshStandardMaterial({color:P.runner,map:carpetMap,roughness:.94}),.01);
  for(const x of [-2.5,2.5])box(g,x,.36,-8.2,.035,.025,25,M.gold,.01);
  // Broad entrance steps and arrival garden.
  box(g,0,-.02,16.7,8,.3,3,M.white,.2);box(g,0,-.21,18,9,.16,1,M.ivory,.16);box(g,0,.3,13.2,5.8,.04,2.7,mat('#cb492f'),.06);
  const sign=textSprite('T I D E L I G H T','#fff4d5',.7);sign.position.set(0,3.6,15.3);g.add(sign);
  for(const x of [-4.3,4.3]){cylinder(g,x,1.65,15.1,.13,3.2,M.white);cylinder(g,x,3.2,15.1,.28,.15,M.gold);}box(g,0,3.2,15.1,9.6,.24,.5,M.teal,.1);
  // Reception desk, bell, keys, computer and lounge.
  box(g,0,.88,10.1,4.4,1.35,1.1,mat(P.desk),.25);box(g,0,1.6,10.1,4.7,.16,1.35,M.white,.12);box(g,0,.9,10.68,3.7,.8,.035,mat(P.deskInset),.02);for(let i=-3;i<=3;i++)box(g,i*.45,.94,10.72,.025,.72,.022,M.gold,.005);
  cylinder(g,1.55,1.78,10.15,.16,.12,M.gold);sphere(g,1.55,1.87,10.15,.12,M.gold,[1,.55,1]);box(g,-.9,1.8,9.85,.67,.42,.1,M.dark,.05);box(g,-.9,1.65,9.98,.55,.035,.35,M.ivory,.03);
  box(g,0,.42,8.4,2.6,.035,1.3,mat('#2c956c'),.17);
  const welcome=textSprite('前 台 · 办 理 入 住','#257b7b',.45);welcome.position.set(0,2.3,9.4);g.add(welcome);
  for(const x of [7.8,10.4]){box(g,x,.55,11.3,1.8,.6,1.2,mat('#f7a128'),.2);box(g,x,.98,11.8,1.8,.7,.35,mat('#e58523'),.13);for(const dx of [-.65,.65])cylinder(g,x+dx,.27,11.2,.065,.42,M.wood);}
  cylinder(g,9,.65,13.2,.7,.12,M.ivory);cylinder(g,9,.34,13.2,.09,.6,M.gold);plant(g,11.1,13.9,1.15);plant(g,-4,14,1.1);plant(g,4.1,14,1.1);
  // Linen shelves with visible folded towels.
  box(g,-10.7,1.25,12.5,1.4,2.2,4,M.white,.12);for(const y of [.55,1.05,1.55,2.05])for(let i=0;i<5;i++)box(g,-9.94,y,11.25+i*.59,.12,.17,.44,i%2?mat('#96dcd6'):M.ivory,.03);
  const supply=textSprite('布 草 间','#267f80',.5);supply.position.set(-10.3,2.8,12.5);g.add(supply);torus(g,SPOTS.supplies.x,.36,SPOTS.supplies.z,.72,.035,M.teal);
  for(let i=0;i<11;i++)this.palms.push(palm(g,[-18,19,-26,29,-21,24,-20,18,-28,27,11][i],[-21,-21,-9,-8,16,15,24,24,8,5,24][i],.9+(i%4)*.13,i*1.4));
  for(let i=0;i<7;i++){const x=-30+i*9;box(g,x,-.15,27,1.5,.15,.5,mat('#dfc58b'),.2);}
  // Small dock, tropical arrival boat and beach details.
  for(let i=0;i<13;i++)box(g,0,-.14,19.5+i*.6,5,.16,.54,M.wood,.02);
  for(const x of [-2.2,2.2])for(const z of [20,24,27])cylinder(g,x,-.5,z,.12,1.4,mat('#8d6d4f'));
  const boat=new T.Group();boat.position.set(6,-.5,27);sphere(boat,0,.35,0,1,M.white,[1.2,.55,2.6]);box(boat,0,.7,0,1.4,.5,2.3,M.teal,.25);box(boat,0,1.2,-.35,1,.5,1.2,M.white,.1);box(boat,0,1.2,.28,.8,.35,.035,M.glass,.03);batchSurfaces(boat);boat.userData.preserve=true;g.add(boat);this.boat=boat;
  for(const side of [-1,1])for(let i=0;i<5;i++){
   const x=side*(8+i*.8),z=17.5+Math.sin(i*2)*.6;
   sphere(g,x,.05,z,.58,mat(i%2?'#48a36a':'#6db97d'),[1,.65,1]);
   for(let j=0;j<3;j++)sphere(g,x+Math.sin(j*2+i)*.32,.37,z+Math.cos(j*2+i)*.32,.09,mat(j%2?'#ffe6a0':'#ffad96'));
  }
  buildLobbyShell(g);batchSurfaces(g);lobbyShadows(g); // Immutable hotel shell is combined by material.
 }
 buildRoom(r,villaBase=false){
  if(r.region==='villa'&&!villaBase){this.buildRoom({...r,tier:Math.min(3,r.tier)},true);const v=this.roomViews.get(r.id);v.root.add(villaDetails(r));v.signature=`${r.built}-${r.tier}`;return;}
  const old=this.roomViews.get(r.id);if(old){this.scene.remove(old.root);old.root.traverse(o=>{if(o.isMesh&&!o.geometry.userData.shared)o.geometry.dispose();});}
  const root=new T.Group();root.position.set(r.x,0,r.z);this.scene.add(root);const b=new T.Group();root.add(b);
  if(!r.built){
   constructionPad(b,r);const v={root,signature:`${r.built}-${r.tier}`,cash:null};batch(b);this.roomViews.set(r.id,v);return;
  }
  const accent=P.bed;const wallPaint=new T.MeshStandardMaterial({color:'#ffffff',map:floorTexture('wall'),roughness:.85});
  const floorMat=new T.MeshStandardMaterial({color:'#ffffff',map:floorTexture('parquet'),roughness:.85});box(b,0,.32,0,8.65,.14,7.2,floorMat,.07);
  box(b,0,1.43,-3.65,9,2.2,.26,wallPaint,.07);box(b,0,.68,3.65,9,.78,.26,wallPaint,.05);box(b,Math.sign(r.x)*4.45,1.37,0,.26,2.1,7.3,wallPaint,.06);box(b,0,2.59,-3.65,9.15,.17,.37,M.white,.05);box(b,0,1.13,3.65,9.15,.14,.34,M.white,.04);box(b,Math.sign(r.x)*4.45,2.49,0,.37,.17,7.3,M.white,.05);for(const z of [-3.3,3.3]){cylinder(b,Math.sign(r.x)*4.35,1.43,z,.18,2.2,M.ivory);cylinder(b,Math.sign(r.x)*4.35,.42,z,.24,.2,M.gold);cylinder(b,Math.sign(r.x)*4.35,2.58,z,.24,.17,M.gold);}
  const side=-Math.sign(r.x);box(b,side*4.45,.85,-1.95,.26,1.42,3.4,wallPaint,.05);box(b,side*4.45,.85,2.9,.26,1.42,1.5,wallPaint,.05);
  box(b,side*4.45,.48,.95,.26,.18,2.4,M.gold,.03);
  dressWindow(b,r);
  // Headboard, mattress, rounded quilt, pillows and bedside lighting.
  box(b,0,.66,-.9,3.8,.55,3.8,mat(P.bedFrame[r.tier]),.16);box(b,0,.97,-.9,3.7,.3,3.65,M.white,.2);box(b,0,1.3,-2.72,4.1,1.5,.25,mat(P.bedFrame[r.tier]),.2);box(b,0,1.3,-2.55,3.7,1.2,.06,mat(r.tier===3?'#f4c65a':'#ffac42'),.16);for(const x of [-1.82,1.82]){cylinder(b,x,.7,.93,.09,.65,M.gold);sphere(b,x,1.05,.93,.13,M.gold);}box(b,0,.65,1,3.8,.36,.16,r.tier===3?M.gold:M.wood,.05);
  const blanket=box(root,0,1.16,-.37,3.66,.22,2.5,new T.MeshStandardMaterial({color:accent[r.tier],map:fabricTexture(r.tier),roughness:.7}),.18);blanket.geometry=blanket.geometry.clone();blanket.geometry.userData.shared=false;const blanketBase=blanket.geometry.attributes.position.array.slice();
  for(const x of [-.87,.87]){const pillow=box(b,x,1.23,-2.05,1.45,.23,.75,M.white,.18);pillow.rotation.y=x<0?-.04:.04;box(b,x,1.36,-2.06,1.12,.025,.48,mat('#fff8df'),.07);}
  for(const x of [-2.6,2.6]){box(b,x,.68,-2.2,.7,.55,.75,r.tier===3?M.white:M.wood,.07);cylinder(b,x,1.12,-2.2,.055,.55,M.gold);cylinder(b,x,1.4,-2.2,.27,.33,M.ivory,.18);sphere(b,x,1.25,-2.2,.075,M.gold);}
  box(b,Math.sign(r.x)*3.52,1.14,1.8,1.05,1.55,1.7,mat(r.tier===3?'#efba49':P.furniture),.08);box(b,Math.sign(r.x)*3.52,1.15,2.68,.72,1.25,.025,M.ivory,.04);cylinder(b,Math.sign(r.x)*3.52,1.14,2.72,.045,.3,M.gold);
  plant(b,-Math.sign(r.x)*3.35,-2.5,.7);
  if(r.tier>=2){box(b,-Math.sign(r.x)*3.2,.68,-.2,1.12,.6,.9,mat('#f69e2b'),.17);box(b,-Math.sign(r.x)*3.2,1.04,.1,1.12,.45,.26,mat('#de7d23'),.1);}
  if(r.tier===3){cylinder(b,2.6,.6,.4,.55,.1,M.white);cylinder(b,2.6,.4,.4,.06,.4,M.gold);box(b,2.6,.7,.4,.25,.13,.25,M.teal,.04);const art=box(b,-2.8,1.3,-3.45,1.05,.7,.05,M.gold,.03);box(b,-2.8,1.3,-3.4,.9,.55,.02,mat('#62bfc6'),.01);}
  finishRoom(root,b,r);batchSurfaces(b);batch(b);
  const dirt=new T.Group();root.add(dirt);for(let i=0;i<5;i++){const trash=box(dirt,Math.sin(i*2)*2.3,.44,1.7+Math.cos(i*1.8)*.7,.35,.07,.24,i%2?M.ivory:mat('#dc9f8a'),.025);trash.rotation.y=i;}
  for(let i=0;i<3;i++){const paper=box(dirt,-1.9+i*1.6,.435,2.4-(i%2)*.5,.22,.035,.32,M.white,.01);paper.rotation.y=i*1.6;}
  const cash=cashPile();const p=moneySpot(r);cash.position.set(p.x-r.x,.27,p.z-r.z);root.add(cash);
  this.roomViews.set(r.id,{root,dirt,blanket,blanketBase,cash,signature:`${r.built}-${r.tier}`});
 }
 buildFacilities(s){
  const key=`${s.owned.pool}-${s.owned.cafe}`;if(key===this.lastBuild)return;this.lastBuild=key;
  if(this.facilities){this.facilities.traverse(o=>{if(o.isMesh&&!o.geometry.userData.shared)o.geometry.dispose();if(o.material?.isShaderMaterial)o.material.dispose();});this.scene.remove(this.facilities);}this.facilities=new T.Group();this.scene.add(this.facilities);const g=this.facilities,deckMat=new T.MeshStandardMaterial({color:'#ffffff',map:floorTexture('deck'),roughness:.85});
  for(const side of [-1,1]){const enabled=side>0?s.owned.pool:s.owned.cafe;box(g,side*20,-.08,0,14,.44,24,enabled?deckMat:mat('#71bf3c'),.22);for(const z of [-11,11])box(g,side*20,.17,z,14,.08,.16,M.ivory,.03);
   if(!enabled){for(let i=0;i<5;i++){box(g,side*20+(i-2)*1.5,.25,-3,1.1,.24,1.8,mat('#cfb489'),.06);}for(const x of [-5.7,5.7]){cylinder(g,side*20+x,.7,4,.07,1.3,M.wood);torus(g,side*20+x,.8,4,.11,.025,M.gold,0);}const planned=textSprite(side>0?'海景泳池 · 待开放':'落日咖啡 · 待开放','#b58b59',.65);planned.position.set(side*20,1.6,0);g.add(planned);}
  }
  this.poolWater=null;
  if(s.owned.pool){
   box(g,24.15,.35,-6.8,.45,.65,8.7,M.white,.1);
   for(const [z,length] of [[-10.4,1.1],[-7.8,1.0],[-5.4,1.0],[-3.2,1.0]])box(g,15.85,.35,z,.45,.65,length,M.white,.08);
   for(const z of [-10.95,-2.65])box(g,20,.35,z,8.7,.65,.45,M.white,.1);
   for(const z of [-9,-6.6,-4.2]){
    box(g,15.85,.12,z,.9,.15,1.2,M.ivory,.06);
    for(const dz of [-.42,.42]){
     const curve=new T.CatmullRomCurve3([new T.Vector3(15.2,.35,z+dz),new T.Vector3(15.25,1.0,z+dz),new T.Vector3(15.85,1.02,z+dz),new T.Vector3(16.25,.1,z+dz)]);
     const rail=new T.Mesh(new T.TubeGeometry(curve,15,.035,6,false),M.chrome);rail.castShadow=true;g.add(rail);
    }
   }
   box(g,20,-.1,-6.8,7.9,.15,7.9,mat('#55bbc4'),.02);this.poolWater=box(g,20,.25,-6.8,7.8,.05,7.8,poolMaterial(),.02);

   for(let i=0;i<3;i++){const z=-8.8+i*3.1;box(g,25.2,.42,z,1.3,.25,2.25,M.white,.15);const back=box(g,25.2,.75,z-.65,1.2,.15,1,mat(i%2?'#f0b58d':'#83c8c1'),.08);back.rotation.x=-.5;box(g,25.2,.58,z+.2,1.2,.07,1.2,mat(i%2?'#f0b58d':'#83c8c1'),.05);}
   cylinder(g,25,1.8,-11,.05,3.2,M.gold);const umbrella=new T.Mesh(new T.ConeGeometry(1.8,.6,12),mat('#f1a783'));umbrella.position.set(25,3.3,-11);g.add(umbrella);
   box(g,17,1.05,-.7,1.6,1.2,1.4,M.white,.12);for(let i=0;i<4;i++)box(g,17,1.8+i*.1,-.7,1.3,.09,.8,i%2?M.teal:M.white,.04);
   torus(g,22,.45,-4.5,.6,.14,mat('#ffb887'));const poolSign=textSprite('海 风 泳 池','#086f86',.55);poolSign.position.set(20,2.4,-12);g.add(poolSign);
  }
  if(s.owned.cafe){
   box(g,-20,.9,1,6.4,1.4,1.15,M.coral,.18);box(g,-20,1.65,1,6.8,.16,1.4,M.ivory,.1);
   box(g,-21.5,2,1,.9,.7,.65,M.chrome,.08);box(g,-21.5,2.1,1.35,.5,.25,.05,M.dark,.04);for(const x of [-20,-19.5,-19])cylinder(g,x,1.84,1,.13,.3,M.white);
   for(const x of [-23,-17]){cylinder(g,x,1.95,-1,.08,3.4,M.white);}
   for(const z of [-2.2])box(g,-20,3.6,z,7.8,.22,.22,M.teal,.08);for(let i=0;i<5;i++)box(g,-23.2+i*1.6,3.67,-1.5,.18,.12,1.4,i%2?M.ivory:M.teal,.03);
   for(let i=0;i<3;i++){const z=-4+i*2.7;cylinder(g,-24,.85,z,.75,.15,M.ivory);cylinder(g,-24,.48,z,.08,.7,M.gold);for(const dx of [-1,1]){cylinder(g,-24+dx,.55,z,.38,.16,M.coral);cylinder(g,-24+dx,.3,z,.055,.5,M.gold);}}
   const cafeSign=textSprite('SUNSET · 咖啡吧','#fff9e9',.55);cafeSign.position.set(-20,3,-.15);g.add(cafeSign);plant(g,-26,7,1.1);
  }
  batchSurfaces(g);this.poolCash=cashPile();this.poolCash.position.set(15,.3,2.5);this.cafeCash=cashPile();this.cafeCash.position.set(-16,.3,4);g.add(this.poolCash,this.cafeCash);
 }
 event(e){this.effects.event(e);if(e.type==='build'){const room=this.roomViews.get(this.roomByEvent(e));if(room)room.popAt=e.time;}}
 roomByEvent(e){return [...this.roomViews].find(([,v])=>Math.hypot(v.root.position.x-e.x,v.root.position.z-e.z)<1)?.[0];}
 positionOnFloor(clientX,clientY){const r=this.canvas.getBoundingClientRect();return pickFloor(this.camera,clientX-r.left,clientY-r.top,r.width,r.height);}
 project(x,y,z){return projectPoint(this.camera,x,y,z,this.width,this.height);}
 inputDirection(x,y){return screenDirection(this.camera,x,y);}
 roomThumbnail(r){
  const key=`${r.id}-${r.tier}-${r.built}`;let source=this.roomViews.get(r.id);if(!source||source.signature!==`${r.built}-${r.tier}`){this.buildRoom(r);source=this.roomViews.get(r.id);this.thumbCache.delete(key);}if(this.thumbCache.has(key))return this.thumbCache.get(key);if(!source)return '';
  if(!this.thumbRenderer){this.thumbRenderer=new T.WebGLRenderer({antialias:true,alpha:true});this.thumbRenderer.setSize(360,225);this.thumbRenderer.outputColorSpace=T.SRGBColorSpace;this.thumbRenderer.toneMapping=T.NoToneMapping;}
  const scene=new T.Scene(),room=source.root.clone(true);room.position.set(0,0,0);if(source.cash){const cashIndex=source.root.children.indexOf(source.cash);if(room.children[cashIndex])room.children[cashIndex].visible=false;}if(source.dirt){const index=source.root.children.indexOf(source.dirt);if(room.children[index])room.children[index].visible=false;}scene.add(room);scene.add(new T.HemisphereLight('#ffffff','#cee7fa',1.55));const sun=new T.DirectionalLight('#fffefa',2.05);sun.position.set(-6,12,9);scene.add(sun);const camera=new T.OrthographicCamera(-7.5,7.5,4.7,-4.7,.1,80);camera.position.set(8,10,12);camera.lookAt(0,.6,0);this.thumbRenderer.render(scene,camera);const image=this.thumbRenderer.domElement.toDataURL('image/png');this.thumbCache.set(key,image);return image;
 }
 update(s,dt){
  const t=s.time;
  for(const [id,v] of this.roomViews)if(!s.rooms.some(r=>r.id===id)){this.scene.remove(v.root);this.roomViews.delete(id);this.thumbCache.delete(id);}
  if(s.estate.villa&&!this.villaEstate){this.villaEstate=buildVillaEstate();this.scene.add(this.villaEstate.root);this.palms.push(...this.villaEstate.palms);}
  if(!s.estate.villa&&this.villaEstate){this.scene.remove(this.villaEstate.root);this.palms=this.palms.filter(p=>!this.villaEstate.palms.includes(p));this.villaEstate=null;}
  const title=careerTitle(s).name;if(this.lastCareerTitle!==title){
   if(this.careerPlaque)this.scene.remove(this.careerPlaque);const plaque=new T.Group(),rank=titleIndex(s),label=textSprite(title,'#fff2b5',.42,'#168ccd');label.position.set(6.6,1.9,15.85);plaque.add(label);
   if(rank>=2){const star=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rad=i%2?.09:.21;const x=Math.cos(a)*rad,y=Math.sin(a)*rad;if(i)star.lineTo(x,y);else star.moveTo(x,y);}star.closePath();for(let i=0;i<(rank>=4?5:1);i++){const badge=new T.Mesh(new T.ShapeGeometry(star),M.gold);badge.position.set(6.6+(i-(rank>=4?2:0))*.4,2.5,15.88);plaque.add(badge);}}
   this.careerPlaque=plaque;this.scene.add(plaque);this.lastCareerTitle=title;
  }
  if(this.ownerOutfit!==(s.outfit||'classic')){disposePerson(this.owner);this.owner=makePerson('owner',1,s.outfit);this.scene.add(this.owner.root);this.ownerOutfit=s.outfit||'classic';}
  const shadowAnchor=s.estate.villa?(this.overview?-22:s.player.z<-20?s.player.z+8:0):0;this.sun.position.z=19+shadowAnchor;this.sun.target.position.z=shadowAnchor;
  this.effects.update(s,s.paused?0:dt);
  for(const r of s.rooms){let v=this.roomViews.get(r.id);if(!v||v.signature!==`${r.built}-${r.tier}`){this.buildRoom(r);v=this.roomViews.get(r.id);}if(v.dirt){v.dirt.visible=r.status==='dirty';v.dirt.children.forEach((o,i)=>o.visible=r.clean<(i+1)/v.dirt.children.length);}if(v.blanket&&v.lastStatus!==r.status){const attr=v.blanket.geometry.attributes.position;for(let i=0;i<attr.count;i++){const x=v.blanketBase[i*3],y=v.blanketBase[i*3+1],z=v.blanketBase[i*3+2];attr.setXYZ(i,x,y+(r.status==='dirty'?Math.sin(x*3+z*2)*.1+Math.cos(z*4)*.055:0),z);}attr.needsUpdate=true;v.blanket.geometry.computeVertexNormals();v.lastStatus=r.status;}if(v.cash){v.cash.visible=r.cash>0;v.cash.rotation.y=Math.sin(t*2)*.1;}if(v.popAt!==undefined){const age=t-v.popAt;v.root.scale.y=age<.55?1+Math.sin(Math.min(1,age/.55)*Math.PI)*.08:1;if(age>=.55)delete v.popAt;}}
  this.buildFacilities(s);this.poolCash.visible=s.poolCash>0;this.cafeCash.visible=s.cafeCash>0;
  this.owner.update(s.player,t,dt);if(!s.active)this.owner.root.rotation.y=0;this.ring.position.set(s.player.x,this.owner.root.position.y+.125,s.player.z);const working=['serve','clean','supply','coffee'].includes(s.player.action);let fraction=s.player.action==='serve'?s.serveProgress:s.player.action==='coffee'?s.cafeProgress:s.player.action==='clean'?(s.rooms.find(r=>Math.hypot(r.x-s.player.x,r.z+2.1-s.player.z)<1.5)?.clean||0):s.player.supplyTime/.24;this.serviceRing.visible=working;this.serviceRing.position.copy(this.ring.position);this.serviceRing.position.y+=.015;this.serviceRing.geometry.setDrawRange(0,Math.max(3,Math.floor(fraction*64)*6));this.ring.rotation.z=t*.25;this.ring.material.color.set(boostActive(s)?'#ff9b39':'#fff4b7');
  const actors=[...s.guests.map(a=>({...a,kind:'guest'})),...s.staff.map(a=>({...a,kind:a.id}))],present=new Set();
  for(const a of actors){const key=`${a.kind}-${a.id}`;present.add(key);let p=this.people.get(key);if(!p){p=makePerson(a.kind,a.look??0);this.people.set(key,p);this.scene.add(p.root);}if(a.state==='queue'&&Math.hypot(a.x,a.z-11.7)<.6&&s.serveProgress>0)a.action='greet';p.update(a,t,dt);
   if(a.state==='staying'){const r=s.rooms.find(r=>r.id===a.room);p.root.position.set(r.x,1.1,r.z-.1);p.root.rotation.set(-Math.PI/2,0,0);p.suitcase.visible=false;p.towels.visible=false;}
   if(a.state==='pool'&&!a.path.length){const phase=Math.max(0,Math.min(1,a.progress/.8,(9-a.progress)/.8)),smooth=phase*phase*(3-2*phase);p.root.position.x=a.x+2.7*smooth;p.root.position.z=a.z+Math.sin(t*.9+a.id)*.14*smooth;p.root.position.y=p.root.position.y*(1-smooth)+(-1.04+Math.sin(t*1.7+a.id)*.035)*smooth;p.root.rotation.set(0,.35+Math.sin(t*.5+a.id)*.16,0);p.floatRing.visible=phase>.1;p.armL.rotation.x=-1.05+Math.sin(t*2)*.12;p.armR.rotation.x=-1.05-Math.sin(t*2)*.12;}if(a.state==='coffee'&&!a.path.length){p.root.position.y=-.29;p.root.rotation.y=Math.PI/2;p.legL.rotation.x=p.legR.rotation.x=-1.35;p.kneeL.rotation.x=p.kneeR.rotation.x=1.45;p.armR.rotation.x=-1.15-Math.max(0,Math.sin(t*1.2))*.8;p.cup.rotation.x=-p.armR.rotation.x;}
  }
  for(const [key,p] of this.people)if(!present.has(key)){disposePerson(p);this.people.delete(key);}
  this.routeDots.forEach((o,i)=>{const target=s.player.path?.[i*2];o.visible=!!target;if(target)o.position.set(target.x,.48,target.z);});this.dest.visible=!!s.destination;if(s.destination)this.dest.position.set(s.destination.x,0,s.destination.z);
  for(const p of this.palms)p.leaves.rotation.z=Math.sin(t*.9+p.root.position.x)*.025;
  if(this.poolWater){this.poolWater.material.uniforms.time.value=t;}
  // Keep the actor and next workplace comfortably inside the visible play area.
  const desired=this.overview?new T.Vector3(0,0,(s.estate.villa?-24:-2)*WORLD_SCALE):new T.Vector3((s.player.x+(Math.abs(s.player.x)>13?Math.sign(s.player.x)*1.2:0))*WORLD_SCALE,0,(s.player.z-2.5)*WORLD_SCALE);if(!this.cameraReady){this.target.copy(desired);this.cameraReady=true;}else this.target.lerp(desired,1-Math.exp(-dt*4));
  const aspect=this.width/this.height,vertical=this.overview?Math.max(s.estate.villa?82:44,(s.estate.villa?65:56)/aspect):FOLLOW_HEIGHT;
  this.camera.left=-vertical*aspect/2;this.camera.right=vertical*aspect/2;this.camera.top=vertical/2;this.camera.bottom=-vertical/2;this.camera.updateProjectionMatrix();this.camera.position.copy(this.target).add(new T.Vector3(CAMERA_OFFSET.x,CAMERA_OFFSET.y,CAMERA_OFFSET.z));this.camera.lookAt(this.target);
  this.water.material.uniforms.time.value=t;this.boat.position.y=-.5+Math.sin(t*1.1)*.065;this.boat.rotation.z=Math.sin(t*.8)*.018;
  this.renderer.render(this.scene,this.camera);
 }
}
