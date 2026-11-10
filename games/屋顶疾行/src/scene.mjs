import * as T from '../vendor/three.module.js';
import {makeTextures,uvBox,labelTexture,environmentTexture} from './materials.mjs';
import {Runner} from './human-runner.mjs';
import {rng,clamp,lerp,damp,rayBox3} from './math.mjs';
import {supportAt,ROOFS,GATES,NAV,LOOKS} from './world.mjs';
import {ghostAt} from './progress.mjs';
import {MODES} from './physics.mjs';
import {batchStatic} from './batch.mjs';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';
import {addCityKit,cityBackdrops} from './city-kit.mjs';
import {EQUIPMENT} from './equipment.mjs';
import {districtBounds} from './free-world.mjs';
const O=new T.Object3D(),P=new T.Vector3(),Q=new T.Quaternion();
const palette={cream:'#d1cab8',brick:'#cfbcb0',stone:'#abb1ad',blue:'#a4bac0'};
export class ParkourScene{
 constructor(canvas,map,{pbr={},cityKit=null}={}){
  this.cityKit=cityKit;
  this.canvas=canvas;this.map=map;this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
  this.scene=new T.Scene();this.scene.fog=new T.Fog('#bccdd4',100,480);this.camera=new T.PerspectiveCamera(65,1,.08,1600);this.textures=makeTextures();this.scene.environment=environmentTexture(this.renderer);this.scene.environmentIntensity=.6;
  this.materials={};const mat=(name,color,map=null,roughness=.85,metalness=0)=>this.materials[name]=new T.MeshStandardMaterial({color,map,roughness,metalness,vertexColors:!!map});
  mat('concrete','#e0dccc',this.textures.concrete);mat('brick','#e5cdc0',this.textures.brick);mat('roof','#bfc4ba',this.textures.roof);mat('asphalt','#a5afab',this.textures.asphalt);mat('steel','#738286',null,.5,.55);mat('grate','#9da8a6',this.textures.metal,.7,.5);mat('dark','#28373b',null,.7,.25);mat('white','#e9e6da');mat('wood','#8a7157',null,.95);mat('leaf','#667a4e');mat('yellow','#d9b348',null,.75);mat('mint','#a4db9f',null,.6);mat('blue','#557d8a',null,.65,.2);mat('pane','#667f86',null,.24,.65);this.materials.roof.bumpMap=this.textures.roof;this.materials.roof.bumpScale=.055;this.materials.concrete.bumpMap=this.textures.concrete;this.materials.concrete.bumpScale=.035;this.materials.brick.bumpMap=this.textures.brick;this.materials.brick.bumpScale=.055;
  for(const name of['brick','roof','concrete']){if(pbr[name]){Object.assign(this.materials[name],pbr[name]);this.materials[name].bumpMap=null;this.materials[name].normalScale.setScalar(name==='brick'?.7:.38);this.materials[name].aoMapIntensity=.7;this.materials[name].roughness=.95;this.materials[name].color.set(name==='roof'?'#e6e3db':'#ffffff');}}
  this.materials.wood.map=this.textures.wood;this.materials.wood.color.set('#e1cba7');this.materials.wood.bumpMap=this.textures.wood;this.materials.wood.bumpScale=.015;this.materials.roof.color.multiplyScalar(1.18);
  this.renderer.toneMappingExposure=1.02;this.scene.environmentIntensity=.46;if(pbr.hdri){const pmrem=new T.PMREMGenerator(this.renderer);this.scene.environment.dispose();this.scene.environment=pmrem.fromEquirectangular(pbr.hdri).texture;this.scene.environmentRotation.y=.55;pmrem.dispose();pbr.hdri.dispose();}
  this.scene.add(new T.HemisphereLight('#c4d9ef','#736455',.88));this.sun=new T.DirectionalLight('#ffe1af',3.65);this.sun.castShadow=true;this.sun.shadow.mapSize.set(4096,4096);Object.assign(this.sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:2,far:180});this.sun.shadow.bias=-.00025;this.sun.shadow.normalBias=.025;this.sun.shadow.radius=3;this.scene.add(this.sun,this.sun.target);
  this.sky=new T.Mesh(new T.SphereGeometry(1100,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#588cbe')},horizon:{value:new T.Color('#d4d6ce')}},vertexShader:'varying vec3 vWorld;void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'uniform vec3 top;uniform vec3 horizon;varying vec3 vWorld;void main(){vec3 d=normalize(vWorld-cameraPosition);float h=smoothstep(-.15,.55,d.y);vec3 c=mix(horizon,top,h);float s=pow(max(0.,dot(d,normalize(vec3(-.46,.48,.4)))),110.);c+=vec3(.42,.31,.15)*s;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));this.sky.renderOrder=-10;this.scene.add(this.sky);
  this.clouds=[];const random=rng(873);for(let i=0;i<16;i++){const sprite=new T.Sprite(new T.SpriteMaterial({map:this.textures.cloud,transparent:true,opacity:.32+random()*.18,depthWrite:false,fog:false}));sprite.position.set((random()-.5)*850,105+random()*90,(random()-.5)*800-90);sprite.scale.set(100+random()*120,40+random()*45,1);sprite.renderOrder=-5;this.scene.add(sprite);this.clouds.push(sprite);}
  this.root=new T.Group();this.scene.add(this.root);this.windowFrames=[];this.windowPanes=[];this.flags=[];this.traffic=[];this.birds=[];this.buildingMaterials=new Map();this.signMaterials=new Map();this.sun.shadow.camera.updateProjectionMatrix();
  this.buildCity();this.buildWindows();if(cityKit)addCityKit(this,cityKit);this.buildRoute();this.buildLife();batchStatic(this.root);
  this.runner=new Runner(this.textures);this.ghost=new Runner(this.textures,{ghost:true});this.scene.add(this.runner.root,this.ghost.root);this.ghost.root.visible=false;this.ghostLabel=this.sprite('自己的最佳',1.2,.24,{font:'600 40px Arial',background:'#18414ca8',w:512,h:96});this.scene.add(this.ghostLabel);this.ghostLabel.visible=false;
  this.footShadows=['foot_l','foot_r'].map(name=>{const mesh=new T.Mesh(new T.PlaneGeometry(.34,.32),new T.MeshBasicMaterial({map:this.textures.contact,transparent:true,opacity:.24,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));mesh.rotation.x=-Math.PI/2;this.scene.add(mesh);return {name,mesh};});
  this.dust=[];for(let i=0;i<32;i++){const s=new T.Sprite(new T.SpriteMaterial({map:this.textures.dust,transparent:true,opacity:0,depthWrite:false}));this.scene.add(s);this.dust.push({sprite:s,life:0,max:1,v:new T.Vector3()});}this.dustCursor=0;this.lastFoot=-1;this.lastEvent=0;this.shake=0;
  this.camera.position.set(10,26,19);this.focus=new T.Vector3(0,23,0);this.camera.lookAt(this.focus);this.snap=true;this.previewYaw=2.9;this.lookId='chalk';this.resize();
 }
 box(w,h,d,material,x,y,z,parent=this.root,cast=true,uv=2){const mesh=new T.Mesh(uvBox(w,h,d,uv),material);mesh.position.set(x,y,z);mesh.castShadow=cast;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 rounded(w,h,d,material,x,y,z,radius=.035,parent=this.root){const g=new RoundedBoxGeometry(w,h,d,2,Math.min(radius,w/4,h/4,d/4)),mesh=new T.Mesh(g,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 cylinder(rt,rb,h,m,x,y,z,parent=this.root,n=14){const mesh=new T.Mesh(new T.CylinderGeometry(rt,rb,h,n),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 sprite(text,w,h,options={}){const m=new T.SpriteMaterial({map:labelTexture(text,options),transparent:true,depthWrite:false});const s=new T.Sprite(m);s.scale.set(w,h,1);return s;}
 sign(text,w,h,x,y,z,rotation=0,color='#ede6d3',background='#29424a'){const key=text+'|'+color+'|'+background;let m=this.signMaterials.get(key);if(!m){const tex=labelTexture(text,{color,background,w:1024,h:256,font:'800 114px Arial'});m=new T.MeshStandardMaterial({map:tex,roughness:.85,transparent:!background,polygonOffset:true,polygonOffsetFactor:-2});this.signMaterials.set(key,m);}const mesh=new T.Mesh(new T.PlaneGeometry(w,h),m);mesh.position.set(x,y,z);mesh.rotation.y=rotation;this.root.add(mesh);return mesh;}
 floorText(text,w,d,x,y,z,color='#ebe5d2'){const mesh=this.sign(text,w,d,x,y,z,0,color,null);mesh.rotation.x=-Math.PI/2;return mesh;}
 building(r,main=false){const detailed=main||Math.abs(r.x)<85&&r.z> -260&&r.z<55,key=r.material+':'+Math.floor(r.y)%3+':'+Number(detailed);let material=this.buildingMaterials.get(key);if(!material){material=(r.material==='brick'?this.materials.brick:this.materials.concrete).clone();if(!detailed){material.normalMap=null;material.roughnessMap=null;material.aoMap=null;}material.color.set(r.material==='brick'?'#fff9f0':palette[r.material]||r.color||'#c4c3b9').multiplyScalar(.93+(Math.floor(r.y)%3)*.04);this.buildingMaterials.set(key,material);}const mesh=this.box(r.w-(main&&this.cityKit?.7:0),r.y,r.d-(main&&this.cityKit?.7:0),material,r.x,r.y/2,r.z,this.root,main,r.material==='brick'?1.2:3.4);mesh.userData.background=!main;
  this.box(r.w+.35,.24,r.d+.35,this.materials.white,r.x,r.y-.12,r.z,this.root,main,3.2);this.box(r.w-.25,.065,r.d-.25,this.materials.roof,r.x,r.y+.018,r.z,this.root,false,3.5);
  const colsX=Math.max(2,Math.floor(r.w/3.3)),colsZ=Math.max(2,Math.floor(r.d/3.3)),rows=Math.max(2,Math.floor((r.y-2)/3.1));
  const sx=r.material==='blue'?1.32:r.material==='brick'?.94:1.08,sy=r.material==='blue'?.91:1;
  for(let row=0;row<rows;row++){const y=2.0+row*3.05;if(y>r.y-1.8||main&&this.cityKit&&y>r.y-7.8)continue;
   for(let col=0;col<colsX;col++){const x=r.x+(col-(colsX-1)/2)*3.1;this.windowFrames.push({x,y,z:r.z+r.d/2+.045,rot:0,main,sx,sy});this.windowFrames.push({x,y,z:r.z-r.d/2-.045,rot:Math.PI,main,sx,sy});}
   for(let col=0;col<colsZ;col++){const z=r.z+(col-(colsZ-1)/2)*3.1;this.windowFrames.push({x:r.x+r.w/2+.045,y,z,rot:Math.PI/2,main,sx,sy});this.windowFrames.push({x:r.x-r.w/2-.045,y,z,rot:-Math.PI/2,main,sx,sy});}
  }
  if(main){this.box(r.w+.14,.13,.22,this.materials.concrete,r.x,r.y-1.1,r.z+r.d/2+.07,this.root,false);this.box(.22,.13,r.d+.14,this.materials.concrete,r.x+r.w/2+.07,r.y-1.1,r.z,this.root,false);}
  this.buildingDetails(r,main);
 }
 beamBetween(a,b,width=.09,material=this.materials.steel){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start),mesh=this.box(width,delta.length(),width,material,0,0,0);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return mesh;}
 buildingDetails(r,main){
  const near=Math.abs(r.x)<110&&r.z> -275&&r.z<60,style=Math.abs(Math.floor(r.x*3+r.z))%3;
  const band=(y,h=.16,out=.18,m=this.materials.concrete)=>{for(const side of[-1,1]){this.box(r.w+out*2,h,out,m,r.x,y,r.z+side*(r.d/2+out*.5),this.root,main);this.box(out,h,r.d,m,r.x+side*(r.w/2+out*.5),y,r.z,this.root,main);}};
  band(r.y-.48,.22,.26);band(.85,.7,.20);
  if(!near)return;
  if(style!==1)for(let y=5.0;y<r.y-2;y+=9.15)band(y,.12,.12);
  if(style===1)for(const side of[-1,1])for(let col=0;col<=Math.floor(r.w/6.2);col++){const x=r.x+(col-Math.floor(r.w/6.2)/2)*6.2;this.box(.28,r.y-2,.16,this.materials.concrete,x,(r.y-2)/2+1,r.z+side*(r.d/2+.05),this.root,false);}
  if(!main){
   for(const side of[-1,1]){this.box(r.w,.48,.18,this.materials.concrete,r.x,r.y+.2,r.z+side*(r.d/2-.1),this.root,false);this.box(.18,.48,r.d,this.materials.concrete,r.x+side*(r.w/2-.1),r.y+.2,r.z,this.root,false);}
   const x=r.x+r.w*.25,z=r.z-r.d*.22;this.box(2.2,1.8,1.5,this.materials.brick,x,r.y+.9,z,this.root,false);this.box(2.5,.13,1.8,this.materials.dark,x,r.y+1.87,z,this.root,false);
   const mast=this.cylinder(.035,.035,3.8,this.materials.steel,r.x-r.w*.28,r.y+1.9,r.z,this.root,7);for(const h of[1.5,2.6,3.4])this.box(1.1,.025,.025,this.materials.steel,mast.position.x,r.y+h,r.z,this.root,false);
  }
  // Fire escapes sit against facades, with open treads and diagonal bracing.
  if(style===0){const x=r.x+r.w/2+.65,z=r.z-r.d*.23;for(let y=5.2;y<r.y-1.8;y+=6.1){this.box(1.4,.12,3.3,this.materials.grate,x,y,z,this.root,main);this.box(.05,.85,3.3,this.materials.dark,x+.66,y+.45,z,this.root,false);this.box(.06,.055,3.3,this.materials.steel,x+.66,y+.88,z,this.root,false);this.beamBetween([x+.66,y-1.5,z-1.4],[x+.66,y,z+1.4],.07);for(let t=0;t<9;t++)this.box(.85,.05,.18,this.materials.steel,x,y-1.5+t*.17,z-1.4+t*.32,this.root,false);}}
  if(r.material==='brick')for(const x of[-1,1])for(const z of[-1,1])for(let y=2.5;y<r.y-1;y+=3.05)this.box(.52,.24,.52,this.materials.concrete,r.x+x*(r.w/2-.12),y,r.z+z*(r.d/2-.12),this.root,false);
  if(style===2&&Math.abs(r.x)<75&&r.z<0&&r.z> -260){for(const face of[-1,1])for(const sx of[-.26,.26])for(let y=7.5;y<r.y-2;y+=6.1){const x=r.x+r.w*sx,z=r.z+face*(r.d/2+.52);this.box(2.1,.13,1.12,this.materials.concrete,x,y,z,this.root,false);this.box(2.02,.045,.04,this.materials.dark,x,y+.91,z+face*.48,this.root,false);for(const dx of[-.96,-.48,0,.48,.96])this.box(.025,.84,.025,this.materials.dark,x+dx,y+.46,z+face*.48,this.root,false);for(const dx of[-1,1])this.box(.035,.045,1.0,this.materials.dark,x+dx,y+.91,z,this.root,false);}}
  for(const side of[-1,1]){const pipe=this.cylinder(.045,.045,r.y-1.2,this.materials.steel,r.x+side*(r.w/2-.7),(r.y-1.2)/2+.4,r.z+r.d/2+.12,this.root,7);for(let y=3;y<r.y;y+=4)this.box(.18,.06,.16,this.materials.dark,pipe.position.x,y,pipe.position.z,this.root,false);}
 }
 buildCity(){
  this.box(710,.2,690,this.materials.asphalt,0,-.16,-100,this.root,false,5);
  const pavement=new T.MeshStandardMaterial({color:'#aaa99c',roughness:1,map:this.textures.concrete});
  for(let x=-252;x<=252;x+=42){this.box(4,.14,620,pavement,x,.01,-95,this.root,false,2);for(let z=-360;z<165;z+=14)this.box(.13,.015,5,this.materials.white,x+9,.04,z,this.root,false);}
  for(let z=-340;z<=140;z+=40){this.box(610,.15,3.4,pavement,0,.015,z,this.root,false,2);for(let x=-275;x<=275;x+=14)this.box(5,.015,.13,this.materials.white,x,.04,z+8.2,this.root,false);}
  const random=rng(67931);
  for(let gx=-6;gx<=6;gx++)for(let gz=-7;gz<=3;gz++){
   const x=gx*42+(random()-.5)*4,z=gz*40+(random()-.5)*4-25,w=22+random()*9,d=23+random()*9;
   if(this.map.solids.some(b=>b.kind==='building'&&x+w/2+5>b.minX&&x-w/2-5<b.maxX&&z+d/2+5>b.minZ&&z-d/2-5<b.maxZ))continue;
   if(x>9&&x<25&&z>-180&&z< -60)continue;if(this.cityKit&&cityBackdrops(this.map).some(([bx,bz])=>Math.abs(x-bx)<w/2+17&&Math.abs(z-bz)<d/2+17))continue;
   const h=12+random()*44+(Math.abs(gx)>3?random()*45:0),r={x,z,w,d,y:h,material:random()>.58?'brick':random()>.5?'blue':'stone'};this.building(r,false);
   if(random()>.3)this.box(3.2,1.2,2.2,this.materials.grate,x+w*.2,h+.65,z,this.root,false);
  }
  for(const r of this.map.roofs)this.building(r,true);
  for(const b of this.map.solids){
   if(b.kind==='building')continue;
   if(b.kind==='parapet'){this.box(b.w,b.h,b.d,this.materials.brick,b.x,b.y,b.z,this.root,true,1.1);this.rounded(b.w+.08,.07,b.d+.08,this.materials.concrete,b.x,b.maxY+.018,b.z,.013);}
   else if(b.kind==='grate'||b.kind==='beam'||b.kind==='stairs'){this.box(b.w,b.h,b.d,this.materials.grate,b.x,b.y,b.z);const alongX=b.w>b.d;
    for(const side of[-1,1])this.box(alongX?b.w:.12,.45,alongX?.12:b.d,this.materials.steel,b.x+(alongX?0:side*(b.w/2-.09)),b.y-.25,b.z+(alongX?side*(b.d/2-.09):0));
    if(b.kind==='stairs'){for(let i=0;i<5;i++)this.box(b.w,.025,.08,this.materials.white,b.x,b.maxY+.016,b.minZ+.2+i*b.d/5,this.root,false);}
   }else if(b.kind==='rail'){const alongX=b.w>b.d,len=alongX?b.w:b.d,count=Math.max(2,Math.ceil(len/1.6));for(let i=0;i<count;i++){const t=i/(count-1)-.5;this.cylinder(.035,.035,b.h,this.materials.dark,b.x+(alongX?t*len:0),b.y,b.z+(alongX?0:t*len),this.root,8);}this.box(alongX?len:.06,.065,alongX?.06:len,this.materials.yellow,b.x,b.maxY-.03,b.z);this.box(alongX?len:.035,.045,alongX?.035:len,this.materials.steel,b.x,b.y-.08,b.z);}
   else if(b.kind==='vent'||b.kind==='ac')this.acUnit(b);
   else if(b.kind==='rooftop-room')this.roofRoom(b);
   else if(b.kind==='wallrun'){this.box(b.w,b.h,b.d,this.map.free?this.materials.blue:this.materials.brick,b.x,b.y,b.z);this.box(b.w+.1,.12,b.d+.14,this.materials.white,b.x,b.maxY+.03,b.z);if(this.map.free)for(let x=b.minX+.2;x<b.maxX;x+=2.8)this.box(.065,b.h-.15,.04,this.materials.steel,x,b.y,b.maxZ+.03,this.root,false);this.sign(this.map.free?'FLOW / WALL DISTRICT':'TAKE THE HIGH LINE',13,.8,b.x,b.y+.7,b.maxZ+.025,0,'#d9d8be',null);this.box(b.w-.4,.055,.025,this.materials.mint,b.x,b.minY+.6,b.maxZ+.03);}
   else if(b.kind==='pipe'){const mesh=this.cylinder(.17,.17,b.w,this.materials.steel,b.x,b.y,b.z);mesh.rotation.z=Math.PI/2;for(const s of[-1,1]){const collar=this.cylinder(.23,.23,.12,this.materials.dark,b.x+s*b.w*.36,b.y,b.z);collar.rotation.z=Math.PI/2;}}
   else if(b.kind==='concrete-platform'){this.rounded(b.w,b.h,b.d,this.materials.concrete,b.x,b.y,b.z,.045);this.box(b.w+.02,.055,b.d+.02,this.materials.white,b.x,b.maxY+.005,b.z,this.root,false);for(let i=0;i<4;i++)this.box(.055,b.h-.12,.022,this.materials.dark,b.minX+.18+i*.18,b.y,b.maxZ+.012,this.root,false);}
   else if(b.kind==='steel')this.box(b.w,b.h,b.d,this.materials.steel,b.x,b.y,b.z);
   else if(b.kind==='canopy'){this.box(b.w,b.h,b.d,this.materials.blue,b.x,b.y,b.z);for(const s of[-1,1])this.box(.09,2.5,.09,this.materials.steel,b.x+s*b.w*.44,b.y-1.2,b.z);this.floorText('FLOW',2.6,1,b.x,b.maxY+.012,b.z,'#d8e0d1');}
   else if(b.kind==='tank')this.waterTank(b);
   else if(b.kind==='skylight')this.skylight(b);
   else if(b.kind==='planter')this.planter(b);
   else if(b.kind==='bench'){this.box(b.w,.13,b.d*.7,this.materials.wood,b.x,b.minY+.46,b.z);for(const s of[-1,1])this.box(.09,.46,b.d*.7,this.materials.steel,b.x+s*b.w*.38,b.minY+.23,b.z);this.box(b.w,.4,.12,this.materials.wood,b.x,b.maxY-.1,b.z+.4);}
  }
  for(const b of this.map.solids)if(['ac','vent','tank','planter','rooftop-room'].includes(b.kind)){const shadow=new T.Mesh(new T.PlaneGeometry(b.w+1.0,b.d+1.0),new T.MeshBasicMaterial({map:this.textures.contact,transparent:true,opacity:.35,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));shadow.rotation.x=-Math.PI/2;shadow.position.set(b.x,b.minY+.036,b.z);this.root.add(shadow);}
  // Rooftop detail is concentrated outside the clear running line.
  for(const r of this.map.roofs){
   const side=r.id.charCodeAt(0)%2?1:-1;this.cylinder(.055,.055,.85,this.materials.steel,r.x+side*(r.w/2-1),r.y+.45,r.z+4);this.cylinder(.17,.17,.08,this.materials.grate,r.x+side*(r.w/2-1),r.y+.89,r.z+4);
   this.box(.1,.045,r.d*.45,this.materials.steel,r.x+side*(r.w/2-1.2),r.y+.1,r.z,this.root,false);
   const hatch=this.box(2,.085,1.6,this.materials.grate,r.x+(this.map.free?side*10:-side*3.8),r.y+.08,r.z+r.d*.32);this.box(.7,.025,.08,this.materials.dark,hatch.position.x,r.y+.15,hatch.position.z);
   // Low service runs remain below the step height and outside the main line.
   const cx=r.x+side*(r.w/2-1.55),cz=r.z-r.d*.27;
   this.box(.12,.06,r.d*.42,this.materials.dark,cx,r.y+.055,r.z,this.root,false);
   for(let i=0;i<4;i++)this.box(.28,.08,.08,this.materials.grate,cx,r.y+.08,r.z-r.d*.15+i*2,this.root,false);
   const coil=new T.Mesh(new T.TorusGeometry(.38,.017,5,32),this.materials.dark);coil.rotation.x=Math.PI/2;coil.position.set(r.x-side*3.8,r.y+.06,cz);this.root.add(coil);
   this.floorText(r.id+' / SERVICE',1.6,.28,r.x+side*4.4,r.y+.06,r.z+5,'#78847b');
  }
  if(!this.map.free){for(const z of[-73.85,-70.15]){this.beamBetween([10,22.8,z],[24,22.8,z],.13);for(let x=10;x<24;x+=3.5){this.beamBetween([x,22.8,z],[x+3.5,24.05,z],.10);this.beamBetween([x,24.05,z],[x+3.5,22.8,z],.10);}}
  for(const x of[31.6,36.4]){this.beamBetween([x,21.7,-89.5],[x,22.8,-103.5],.14);for(let z=-90;z> -103;z-=3)this.beamBetween([x,22.0,z],[x,23.8,z-2.5],.09);}
  }
  const wet=new T.MeshPhysicalMaterial({color:'#6c7776',roughness:.13,metalness:.10,clearcoat:1,transparent:true,opacity:.24,depthWrite:false});
  for(const r of this.map.roofs){const random=rng(r.id.charCodeAt(0)*378);for(let n=0;n<2;n++){const shape=new T.Shape();for(let i=0;i<=20;i++){const a=i/20*Math.PI*2,rad=.7+random()*.45,x=Math.cos(a)*rad*1.3,y=Math.sin(a)*rad*.53;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}const puddle=new T.Mesh(new T.ShapeGeometry(shape),wet);puddle.rotation.x=-Math.PI/2;puddle.position.set(r.x+(n?1:-1)*(r.w/2-3.5),r.y+.058,r.z+r.d*.18);puddle.receiveShadow=true;this.root.add(puddle);}}
  this.floorText('ROOFTOP / FLOW',9,1.8,0,22.06,10,'#e8e4d1');this.floorText('OLD TOWN DISTRICT',7,.8,0,22.065,12.1,'#5f6b65');
  if(!this.map.free){this.floorText('FINISH',8,2.3,0,23.88,-213,'#e3e0cd');this.floorText('THE CITY IS YOURS',7,.7,0,23.88,-216,'#6c7a77');
  const endDisc=new T.Mesh(new T.RingGeometry(4.5,4.6,64),new T.MeshBasicMaterial({color:'#d8b85b',side:T.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));endDisc.rotation.x=-Math.PI/2;endDisc.position.set(0,23.86,-212);this.root.add(endDisc);}
  this.sign('FLOW DISTRICT',12,2,0,14.3,15.18,0,'#e4dbb9','#37494d');
 }
 acUnit(b){this.rounded(b.w,b.h,b.d,this.materials.grate,b.x,b.y,b.z,.045);this.rounded(b.w+.035,.07,b.d+.035,this.materials.steel,b.x,b.maxY-.015,b.z,.02);for(const s of[-1,1])this.box(b.w*.92,.09,.07,this.materials.dark,b.x,b.minY+.08,b.z+s*b.d*.34,this.root,false);const count=Math.max(1,Math.floor(b.w/1.4)),radius=Math.min(b.d*.36,b.w/(count*2.7));for(let i=0;i<count;i++){const x=b.x+(i-(count-1)/2)*b.w/count;this.cylinder(radius,radius,.035,this.materials.dark,x,b.maxY+.03,b.z,this.root,28);for(let j=0;j<6;j++){const a=j*Math.PI/3,blade=this.box(radius*.8,.016,radius*.24,this.materials.steel,x+Math.cos(a)*radius*.37,b.maxY+.055,b.z+Math.sin(a)*radius*.37,this.root,false);blade.rotation.y=-a-.2;}this.cylinder(radius*.17,radius*.17,.04,this.materials.grate,x,b.maxY+.07,b.z,this.root,14);for(const scale of[.45,.72,1]){const ring=new T.Mesh(new T.TorusGeometry(radius*scale,.007,4,28),this.materials.grate);ring.rotation.x=Math.PI/2;ring.position.set(x,b.maxY+.09,b.z);this.root.add(ring);}for(let n=0;n<4;n++){const a=n*Math.PI/4;const wire=this.box(radius*2,.012,.014,this.materials.grate,x,b.maxY+.09,b.z,this.root,false);wire.rotation.y=a;}}
  for(let i=0;i<7;i++){this.box(b.w*.88,.035,.035,this.materials.dark,b.x,b.minY+.16+i*(b.h-.25)/7,b.maxZ+.019,this.root,false);this.box(.035,.035,b.d*.70,this.materials.dark,b.maxX+.019,b.minY+.16+i*(b.h-.25)/7,b.z,this.root,false);}
  for(const x of[-1,1])for(const y of[-1,1]){const screw=this.cylinder(.012,.012,.02,this.materials.white,b.x+x*b.w*.43,b.y+y*b.h*.32,b.maxZ+.038,this.root,7);screw.rotation.x=Math.PI/2;}
  this.sign('HVAC / SERVICE',Math.min(1.1,b.w*.70),.12,b.x,b.minY+.1,b.maxZ+.042,0,'#c9d1c4','#344348');
 }
 roofRoom(b){const m=(b.id==='room-e'?this.materials.blue:this.materials.concrete);this.box(b.w,b.h,b.d,m,b.x,b.y,b.z);this.box(b.w+.25,.15,b.d+.25,this.materials.white,b.x,b.maxY+.05,b.z);this.box(1,2,.065,this.materials.dark,b.x,b.minY+1,b.maxZ+.04);this.box(.1,.03,.035,this.materials.metal||this.materials.steel,b.x+.35,b.minY+1.05,b.maxZ+.085);this.sign(b.id==='room-e'?'SERVICE / 05':'ROOFTOP GARDEN',b.w*.83,.4,b.x,b.maxY-.4,b.maxZ+.045,0,'#e0e9dd',null);for(let i=0;i<3;i++)this.box(1.15,.08,2.2,this.materials.pane,b.x+(i-1)*1.3,b.maxY+.2,b.z).rotation.x=-.16;}
 waterTank(b){const bottom=b.minY;for(const x of[-.8,.8])for(const z of[-.8,.8])this.box(.085,1.08,.085,this.materials.steel,b.x+x,bottom+.54,b.z+z);this.cylinder(1.20,1.18,1.77,this.materials.wood,b.x,bottom+1.835,b.z,this.root,48);for(const y of[1.04,1.87,2.66]){const ring=new T.Mesh(new T.TorusGeometry(1.21,.024,6,48),this.materials.steel);ring.rotation.x=Math.PI/2;ring.position.set(b.x,bottom+y,b.z);this.root.add(ring);for(let i=0;i<12;i++){const a=i*Math.PI/6;this.box(.04,.06,.04,this.materials.dark,b.x+Math.sin(a)*1.22,bottom+y,b.z+Math.cos(a)*1.22,this.root,false);}}this.cylinder(0,1.25,.38,this.materials.dark,b.x,b.maxY-.19,b.z,this.root,48);this.beamBetween([b.x-.8,bottom+.15,b.z-.8],[b.x+.8,bottom+.95,b.z-.8],.05);this.beamBetween([b.x+.8,bottom+.15,b.z-.8],[b.x-.8,bottom+.95,b.z-.8],.05);}
 skylight(b){this.box(b.w,.16,b.d,this.materials.dark,b.x,b.minY+.08,b.z);const g=this.box(b.w-.18,b.h-.12,b.d-.2,this.materials.pane,b.x,b.y+.04,b.z);for(const s of[-1,1])this.box(.06,b.h+.05,b.d,this.materials.steel,b.x+s*b.w*.47,b.y,b.z);for(let i=0;i<4;i++)this.box(b.w,.045,.055,this.materials.steel,b.x,b.maxY+.03,b.minZ+.15+i*b.d/3.2);}
 planter(b){this.box(b.w,b.h,b.d,this.materials.concrete,b.x,b.y,b.z);this.box(b.w-.12,.035,b.d-.12,this.materials.wood,b.x,b.maxY+.015,b.z);for(let i=0;i<9;i++){const x=b.x+Math.sin(i*4.3)*b.w*.37,z=b.z+Math.cos(i*2.8)*b.d*.35;const leaf=new T.Mesh(new T.IcosahedronGeometry(.3,1),this.materials.leaf);leaf.position.set(x,b.maxY+.2,z);leaf.scale.set(.8,.8+Math.sin(i)*.3,.8);leaf.castShadow=true;this.root.add(leaf);}}
 buildWindows(){
  const shape=new T.Shape();shape.moveTo(-.66,-.94);shape.lineTo(.66,-.94);shape.lineTo(.66,.94);shape.lineTo(-.66,.94);shape.closePath();
  const hole=new T.Path();hole.moveTo(-.565,-.83);hole.lineTo(-.565,.83);hole.lineTo(.565,.83);hole.lineTo(.565,-.83);hole.closePath();shape.holes.push(hole);
  const frameGeo=new T.ExtrudeGeometry(shape,{depth:.095,bevelEnabled:false,steps:1}),frameMat=new T.MeshStandardMaterial({color:'#b7b9b0',roughness:.75}),paneGeo=new T.PlaneGeometry(1.12,1.65),sillGeo=new T.BoxGeometry(1.48,.08,.3),barGeo=new T.BoxGeometry(.032,1.65,.08);
  const paneMat=new T.MeshStandardMaterial({color:'#e4eaec',map:this.textures.window,roughness:.24,metalness:.3}),farMat=new T.MeshBasicMaterial({map:this.textures.farWindow,color:'#b4c4ca',fog:true}),farGeo=new T.PlaneGeometry(1.32,1.88),chunks=new Map(),random=rng(195);
  for(const v of this.windowFrames){const near=v.main||Math.abs(v.x)<85&&v.z> -260&&v.z<55,key=Number(near);let chunk=chunks.get(key);if(!chunk){chunk={near,windows:[]};chunks.set(key,chunk);}chunk.windows.push(v);}
  for(const chunk of chunks.values()){
   const count=chunk.windows.length,panes=new T.InstancedMesh(chunk.near?paneGeo:farGeo,chunk.near?paneMat:farMat,count),frames=chunk.near?new T.InstancedMesh(frameGeo,frameMat,count):null,sills=chunk.near?new T.InstancedMesh(sillGeo,frameMat,count):null,bars=chunk.near?new T.InstancedMesh(barGeo,frameMat,count):null;
   let i=0;for(const v of chunk.windows){O.position.set(v.x,v.y,v.z);O.rotation.set(0,v.rot,0);O.scale.set(v.sx,v.sy,1);O.updateMatrix();if(frames){frames.setMatrixAt(i,O.matrix);bars.setMatrixAt(i,O.matrix);}const c=random()>.84?new T.Color().setHSL(.10,.12,.62):new T.Color().setHSL(.56,.07,.32+random()*.48);panes.setColorAt(i,c);if(chunk.near)O.translateZ(-.024);O.updateMatrix();panes.setMatrixAt(i,O.matrix);if(sills){O.position.y-=.95*v.sy;O.translateZ(.05);O.updateMatrix();sills.setMatrixAt(i,O.matrix);}i++;}
   for(const mesh of[panes,frames,sills,bars].filter(Boolean)){mesh.receiveShadow=chunk.near;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();this.root.add(mesh);}
  }
 }
 buildRoute(){this.gateMarkers=[];this.navPaint=[];if(this.map.free){this.freeDecor();return;}for(let i=1;i<GATES.length;i++){const g=GATES[i],group=new T.Group();group.userData.dynamic=true;group.position.set(g.x,g.y+.045,g.z);const ring=new T.Mesh(new T.RingGeometry(1.05,1.1,40),new T.MeshBasicMaterial({color:'#d4b661',side:T.DoubleSide,transparent:true,opacity:.7,depthWrite:false}));ring.rotation.x=-Math.PI/2;group.add(ring);const n=this.sprite(String(i).padStart(2,'0'),.85,.4,{color:'#e9eddf',background:'#203940e5',font:'700 80px Arial'});n.position.y=1.6;group.add(n);for(const side of[-1,1]){const cone=new T.Mesh(new T.ConeGeometry(.12,.36,8),this.materials.yellow);cone.position.set(side*1.2,.18,0);cone.castShadow=true;group.add(cone);}this.root.add(group);this.gateMarkers.push({group,ring,label:n});}
  this.navPaint=[];for(let i=0;i<NAV.length;i++){const n=NAV[i],next=NAV[Math.min(NAV.length-1,i+1)],s=supportAt(this.map,n.x,n.z,60,.01);if(!s)continue;const arrow=new T.Shape();arrow.moveTo(0,-.85);arrow.lineTo(.46,-.25);arrow.lineTo(.18,-.25);arrow.lineTo(.18,.62);arrow.lineTo(-.18,.62);arrow.lineTo(-.18,-.25);arrow.lineTo(-.46,-.25);arrow.closePath();const mesh=new T.Mesh(new T.ShapeGeometry(arrow),new T.MeshBasicMaterial({color:'#e4c66c',side:T.DoubleSide,transparent:true,opacity:.78,depthWrite:false}));mesh.userData.dynamic=true;mesh.rotation.x=-Math.PI/2;mesh.rotation.z=Math.atan2(next.x-n.x,-(next.z-n.z));mesh.position.set(n.x,s.maxY+.025,n.z);this.root.add(mesh);this.navPaint.push({mesh,index:i});}
  for(const {x,y,z,w,angle}of[{x:0,y:22.035,z:-13.8,w:5,angle:0},{x:5.5,y:22.28,z:-47.8,w:3,angle:0},{x:34,y:24.64,z:-132.8,w:4,angle:0},{x:0,y:25.44,z:-178,w:4.5,angle:0}]){for(let i=0;i<5;i++){const stripe=this.box(w/5-.13,.015,.28,this.materials.yellow,x-w/2+(i+.5)*w/5,y,z,this.root,false);stripe.rotation.y=angle;}}
  this.sign('WALL RUN',4,.45,16.8,24.7,-88.27,0,'#c8ddbf',null);
 }
 buildLife(){const treeMats=['#697b59','#76825d','#526b55','#958d65'].map(color=>new T.MeshStandardMaterial({color,roughness:1}));const random=rng(788);for(let i=0;i<30;i++){const x=(Math.floor(random()*12)-6)*42+13,z=-330+random()*480;const group=new T.Group();group.position.set(x,0,z);this.cylinder(.12,.2,3.2,this.materials.wood,0,1.6,0,group,7);for(let j=0;j<6;j++){const leaf=new T.Mesh(new T.IcosahedronGeometry(1.35,1),treeMats[(i+j)%treeMats.length]);leaf.position.set(Math.sin(j*2.4)*.8,3+random()*1.3,Math.cos(j*2.4)*.8);leaf.scale.set(.9,.9+random()*.4,.9);leaf.castShadow=false;group.add(leaf);}this.root.add(group);}
  for(let i=0;i<12;i++){const group=new T.Group(),m=new T.MeshStandardMaterial({color:['#ad9c81','#5b7887','#c1c3bc','#4c5958'][i%4],roughness:.45,metalness:.35});this.box(1.65,.7,3.5,m,0,.65,0,group,false);this.box(1.4,.63,1.9,this.materials.pane,0,1.21,-.16,group,false);for(const side of[-1,1])for(const z of[-1.1,1.1]){const wheel=this.cylinder(.31,.31,.17,this.materials.dark,side*.78,.37,z,group,10);wheel.rotation.z=Math.PI/2;}const x=(i%6-3)*42+8.5;group.position.set(x,0,-340+i*36);group.userData.dynamic=true;this.root.add(group);this.traffic.push({group,z:-340+i*36,speed:3.2+i%3,direction:i%2?1:-1});}
  for(let i=0;i<5;i++){const group=new T.Group();const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([0,0,.17,-.5,0,0,0,0,-.13,0,0,.17,0,0,-.13,.5,0,0],3));geo.computeVertexNormals();const wing=new T.Mesh(geo,new T.MeshBasicMaterial({color:'#63777a',side:T.DoubleSide}));group.add(wing);this.scene.add(group);this.birds.push({group,wing,phase:i*1.8});}
 }
 freeDecor(){
  const m=this.materials;
  // Distinct silhouettes help players choose routes by sight, without route arrows.
  for(const r of this.map.roofs){
   if(r.zone==='花园旧巷'){
    this.floorText('BREATHE / KEEP MOVING',8,.55,r.x,r.y+.065,r.z+9,'#c4c5a4');
    for(const dx of[-8,8]){const x=r.x+dx,z=r.z-9;this.cylinder(.11,.17,2.1,m.wood,x,r.y+1.05,z);for(let i=0;i<7;i++){const leaf=new T.Mesh(new T.IcosahedronGeometry(.85,2),m.leaf);leaf.position.set(x+Math.sin(i*2.4)*.6,r.y+2.5+(i%3)*.4,z+Math.cos(i*2.4)*.6);leaf.scale.y=1.1;leaf.castShadow=true;this.root.add(leaf);}}
   }else if(r.zone==='施工街区'){
    this.floorText('FIND YOUR LINE',7,.65,r.x,r.y+.065,r.z+10,'#d8b454');
    for(const dx of[-10,10]){this.box(.14,2.4,.14,m.yellow,r.x+dx,r.y+1.2,r.z-10);this.box(3,.11,.16,m.yellow,r.x+dx,r.y+2.4,r.z-10);}
   }
   // Drain channels, rooftop brickwork and cable runs create readable scale.
   this.sign(r.name,4.8,.70,r.x,r.y-1.0,r.z+14.04,0,'#e5d6b9','#28434d');
   if(r.id.endsWith('1')){const a=[r.x-9,r.y+2.4,r.z-6],b=[r.x-9,r.y+2.4,r.z+7];this.beamBetween([a[0],r.y,a[2]],a,.035);this.beamBetween([b[0],r.y,b[2]],b,.035);this.beamBetween(a,b,.012);for(let i=0;i<5;i++){const cloth=new T.Mesh(new T.PlaneGeometry(.7,.9),new T.MeshStandardMaterial({color:['#d5b79c','#94aeb4','#d5d5c1'][i%3],side:T.DoubleSide,roughness:1}));cloth.position.set(a[0],r.y+1.9,r.z-4+i*2.1);cloth.rotation.y=Math.PI/2+.12;cloth.castShadow=true;this.root.add(cloth);}}
  }
  // Yellow lattice crane, placed outside the running surfaces.
  const cx=Math.max(...this.map.roofs.map(r=>r.x+r.w/2))+5,cz=-74,top=41;
  for(const x of[-.65,.65])for(const z of[-.65,.65])this.box(.14,top,.14,m.yellow,cx+x,top/2,cz+z);
  for(let y=2;y<top;y+=3)for(const s of[-1,1]){
   this.beamBetween([cx-.65,y,cz+s*.65],[cx+.65,y+3,cz+s*.65],.08,m.yellow);
   this.beamBetween([cx+s*.65,y,cz-.65],[cx+s*.65,y+3,cz+.65],.08,m.yellow);
  }
  for(const z of[-.55,.55]){
   this.beamBetween([cx-37,top,cz+z],[cx+12,top,cz+z],.14,m.yellow);
   this.beamBetween([cx-37,top+1.4,cz+z],[cx+12,top+1.4,cz+z],.14,m.yellow);
   for(let x=-36;x<12;x+=3)this.beamBetween([cx+x,top,cz+z],[cx+x+3,top+1.4,cz+z],.08,m.yellow);
  }
  this.box(2.2,1.7,2.5,m.blue,cx-1.2,top-1,cz);this.box(5,1.2,2.2,m.concrete,cx+10,top+.4,cz);
  this.beamBetween([cx-30,top,cz],[cx-30,28,cz],.023,m.dark);this.cylinder(.09,.09,.5,m.yellow,cx-30,27.8,cz);
  // Framed platforms and pipes contrast the softer garden district.
  for(const link of this.map.links){const a=this.map.roofs.find(r=>r.id===link.a),b=this.map.roofs.find(r=>r.id===link.b);if(a.x!==b.x&&a.zone==='施工街区')for(const dz of[-1.7,1.7])this.beamBetween([a.x+14,a.y-.4,a.z+dz],[b.x-14,b.y-.4,b.z+dz],.10,m.yellow);}
  this.markerFlag=new T.Group();this.markerFlag.userData.dynamic=true;this.root.add(this.markerFlag);this.cylinder(.018,.018,.85,m.steel,0,.43,0,this.markerFlag,8);this.box(.38,.23,.016,m.mint,.2,.72,0,this.markerFlag,false);
 }
 applyLook(id){this.lookId=id;this.runner.applyLook(id);}
 setEquipment(loadout){this.runner.setEquipment(loadout);}
 resize(){const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.portrait=w/h<.9;this.baseFov=this.portrait?74:67;this.camera.fov=this.baseFov;this.camera.updateProjectionMatrix();this.snap=true;this.lastView=null;}
 puff(p,count=7){for(let i=0;i<count;i++){const a=this.dust[this.dustCursor++%this.dust.length];a.life=a.max=.35+Math.random()*.25;a.sprite.position.set(p.x+(Math.random()-.5)*.3,p.y+.08,p.z+(Math.random()-.5)*.3);a.v.set((Math.random()-.5)*.7,.18+Math.random()*.25,(Math.random()-.5)*.7);a.sprite.scale.setScalar(.15+Math.random()*.1);}}
 update(w,view,dt,time,orbit){const cpuStart=performance.now(),p=w.player,isPlay=view==='race'||view==='pause',isResult=view==='result';
  for(const c of this.traffic)c.group.position.z=-340+((c.z+time*c.speed*c.direction+340)%530+530)%530;
  for(const b of this.birds){b.group.position.set(40+Math.cos(time*.08+b.phase)*70,44+Math.sin(time*.13+b.phase)*7,-120+Math.sin(time*.08+b.phase)*65);b.group.rotation.y=-time*.08-b.phase;b.wing.rotation.z=Math.sin(time*7+b.phase)*.18;}
  let target,desired;
  if(isPlay){this.runner.setWorld(p,w.waitingForMove?time:w.elapsed);target=new T.Vector3(p.x,p.y+1.22,p.z);const distance=this.portrait?5.8:5.2,height=distance*Math.tan(orbit.pitch??.28);desired=new T.Vector3(target.x+Math.sin(orbit.yaw)*distance,target.y+height,target.z+Math.cos(orbit.yaw)*distance);desired.x+=Math.cos(orbit.yaw)*.22;desired.z-=Math.sin(orbit.yaw)*.22;
   const delta=desired.clone().sub(target),len=delta.length(),dir=delta.normalize();let clipped=len;for(const b of this.map.solids){const d=rayBox3(target,dir,b,len,.12);if(d!==null&&d>.03)clipped=Math.min(clipped,Math.max(.95,d-.18));}if(clipped<len){desired.copy(target).addScaledVector(dir,clipped);this.camera.position.copy(desired);}
   if(this.snap){this.camera.position.copy(desired);this.focus.copy(target);this.snap=false;}else{this.camera.position.lerp(desired,1-Math.exp(-dt*9));this.focus.lerp(target,1-Math.exp(-dt*15));}
   const foot=Math.floor(w.elapsed*(p.speed>7?4.4:3.6));if(w.mode==='running'&&p.grounded&&p.speed>2&&foot!==this.lastFoot){this.lastFoot=foot;this.puff(p,2);}
   for(const e of w.events)if(e.id>this.lastEvent){this.lastEvent=e.id;if(['precision','roll','respawn','wallkick'].includes(e.type))this.puff(p,e.type==='roll'?14:8);if(e.type==='roll')this.shake=.09;if(e.type==='respawn'){this.snap=true;orbit.yaw=p.yaw;}}
   const g=!w.free&&orbit.showGhost?ghostAt(w.ghost,w.clock):null;this.ghost.root.visible=!!g;this.ghostLabel.visible=!!g;if(g){this.ghost.setWorld({...g,mode:MODES[g.mode]||'run',actionProgress:g.phase,grounded:g.mode<2},w.clock);this.ghostLabel.position.set(g.x,g.y+2.15,g.z);}
  }else{
   this.ghost.root.visible=false;this.ghostLabel.visible=false;const pos=isResult?(w.free?{x:0,y:22,z:8.5}:{x:0,y:23.8,z:-212}):{x:this.portrait?0:2.8,y:22,z:8.5};
   this.runner.root.position.set(pos.x,pos.y+.015,pos.z);this.runner.root.rotation.y=view==='wardrobe'?this.previewYaw:2.75+Math.sin(time*.13)*.07;this.runner.pose({mode:isResult&&w.hunt?.status==='lost'?'idle':isResult?'celebrate':'idle',speed:0},time,true);
   if(view==='map'){if(this.map.free){const b=districtBounds(this.map),scale=Math.max(b.width,b.depth)/132;target=new T.Vector3(b.x,20,b.z);desired=new T.Vector3(b.x+94*scale,20+129*scale,b.z+96*scale);}else{target=new T.Vector3(14,13,-103);desired=new T.Vector3(68,168,-45);}}
   else if(view==='wardrobe'){target=new T.Vector3(pos.x+(this.portrait?0:-.9),pos.y+(this.portrait?-.18:.97),pos.z);desired=new T.Vector3(pos.x-.5,pos.y+1.3,pos.z-(this.portrait?4.2:3.25));}
   else if(isResult){target=w.free?new T.Vector3(-.8,23,8.5):new T.Vector3(0,25,-212);desired=w.free?new T.Vector3(3.5,24,3):new T.Vector3(5.8,26.4,-204);}
   else{target=new T.Vector3(this.portrait?0:1.0,this.portrait?22.15:23.1,this.portrait?8.5:7.6);desired=new T.Vector3(this.portrait?2.1:6.0,this.portrait?24.0:24.0,this.portrait?14.2:12.9);}
   if(this.lastView!==view){this.camera.position.copy(desired);this.focus.copy(target);}else{this.camera.position.lerp(desired,1-Math.exp(-dt*3.5));this.focus.lerp(target,1-Math.exp(-dt*5));}
  }
  this.camera.fov=damp(this.camera.fov,(view==='map'?54:this.baseFov)+(isPlay?Math.min(7,p.speed*.65):0),5,dt);this.camera.updateProjectionMatrix();this.shake=Math.max(0,this.shake-dt*.45);this.camera.lookAt(this.focus.clone().add(new T.Vector3(Math.sin(time*82)*this.shake,Math.sin(time*61)*this.shake*.6,0)));this.sky.position.copy(this.camera.position);
  const lightTarget=isPlay?p:isResult?this.runner.root.position:{x:0,y:22,z:0};this.sun.target.position.set(lightTarget.x,lightTarget.y-5,lightTarget.z-8);this.sun.position.set(lightTarget.x-48,lightTarget.y+49,lightTarget.z+31);
  for(let i=0;i<this.gateMarkers.length;i++){const g=this.gateMarkers[i],active=i===w.gate;g.group.visible=view==='map'||isPlay&&i>=w.gate&&i<w.gate+2;g.ring.material.color.set(i<w.gate?'#96cbb2':active?'#e5c468':'#8ea7a7');g.label.position.y=1.6+Math.sin(time*1.7+i)*.04;}
  for(const n of this.navPaint){n.mesh.material.opacity=view==='map'?.8:isPlay&&n.index>=w.nav&&n.index<=w.nav+2?.88:.22;n.mesh.material.color.set(n.index===w.nav?'#efd37b':'#d4c69b');}
  for(const a of this.dust)if(a.life>0){a.life-=dt;a.sprite.position.addScaledVector(a.v,dt);a.sprite.scale.multiplyScalar(1+dt*1.1);a.sprite.material.opacity=Math.max(0,a.life/a.max)*.28;}else a.sprite.material.opacity=0;
  for(const shadow of this.footShadows){const foot=this.runner.bones.get(shadow.name).getWorldPosition(new T.Vector3()),ground=supportAt(this.map,foot.x,foot.z,foot.y+.12,.02);shadow.mesh.visible=!!ground&&view!=='map';if(ground){const height=Math.max(0,foot.y-ground.maxY);shadow.mesh.position.set(foot.x,ground.maxY+.07,foot.z);shadow.mesh.material.opacity=Math.max(0,1-height/.6)*.28;shadow.mesh.scale.setScalar(1+height*.5);}}
  if(isPlay){const bank=p.mode==='wallrun'?.09*Math.sin(p.yaw-orbit.yaw):this.runner.bank*.45;this.camera.rotateZ(bank);}
  if(this.markerFlag){this.markerFlag.visible=isPlay&&!!w.markerPlaced;if(w.marker)this.markerFlag.position.set(w.marker.x,w.marker.y+.04,w.marker.z);}
  this.lastView=view;this.renderer.render(this.scene,this.camera);this.cpuMs=performance.now()-cpuStart;
 }
 thumbnails(){const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(180,230);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;const s=new T.Scene();s.environment=environmentTexture(renderer);s.add(new T.HemisphereLight('#ecf5f0','#6b7273',2.2));const light=new T.DirectionalLight('#fff2dc',3.4);light.position.set(-3,5,-4);s.add(light);const c=new T.PerspectiveCamera(35,180/230,.1,20);c.position.set(-1,1.35,-3.2);c.lookAt(0,.97,0);const actor=new Runner(this.textures);actor.root.rotation.y=-.2;s.add(actor.root);const imgs={};for(const look of LOOKS){actor.applyLook(look.id);actor.pose({mode:'idle',speed:0},0,true);renderer.render(s,c);imgs[look.id]=renderer.domElement.toDataURL('image/png');}actor.applyLook('chalk');actor.root.rotation.y=.2;c.position.set(.7,1.45,1.7);c.lookAt(0,1.32,.14);for(const item of EQUIPMENT.filter(i=>i.slot==='backpack')){actor.setEquipment({backpack:item.id});actor.pose({mode:'idle',speed:0},0,true);renderer.render(s,c);imgs[item.id]=renderer.domElement.toDataURL('image/png');}actor.dispose();s.environment.dispose();renderer.dispose();return imgs;}
}
