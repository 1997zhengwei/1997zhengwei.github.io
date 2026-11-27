import * as T from 'three';
import {packModels} from './crafted-resources.mjs';
import {TILE,SITES,NODES,SERVICES,tilesFor,orderedTiles,landCount,hexAt,xy,TREASURE_AT} from './world.mjs';
import {mat,box,character,tree,rock,wheat,cow,villager,workbench,furnace,portal,chest,axe,resourceModel} from './models.mjs';
const RAD=18,CENTER=new T.Vector3(8,-RAD,2.5),UP=new T.Vector3(0,1,0),icons=new Map();
export const surface=(x,z)=>Math.sqrt(Math.max(16,RAD*RAD-(x-CENTER.x)**2-(z-CENTER.z)**2))-RAD+.8;
const normalAt=(x,z)=>new T.Vector3(x-CENTER.x,surface(x,z)+RAD-.8,z-CENTER.z).normalize();
export function icon(type){return `<img class="icon" src="${icons.get(type)||icons.get('axe')||''}" alt="" aria-hidden="true">`;}
export function makeIcons(){
 if(icons.size)return;
 const r=new T.WebGLRenderer({alpha:true,antialias:true});r.setSize(192,192);r.outputColorSpace=T.SRGBColorSpace;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-.66,.66,.66,-.66,.1,30);
 scene.add(new T.HemisphereLight('#fff9ed','#6b87a1',1.65));const sun=new T.DirectionalLight('#fff6df',2.7);sun.position.set(-3,5,5);scene.add(sun);
 const reset=()=>{camera.position.set(2.2,1.8,3.4);camera.lookAt(0,0,0);};reset();
 for(const type of ['wood','stone','ore','iron','emerald','obsidian','wheat','axe','pick','diamond-axe','diamond-pick','avatar','bag']){
  let model;
  if(type==='axe'||type==='pick'||type.startsWith('diamond-')){model=new T.Group();axe(model,type.startsWith('diamond-')?4:2);model.rotation.z=-.6;model.position.y=.15;if(type.endsWith('pick'))box(model,-.28,.03,0,.56,.17,.12,type.startsWith('diamond-')?'#aaffed':'#d7e5f2');}
  else if(type==='avatar'){model=character().root;model.position.y=-1.48;model.rotation.y=.4;camera.position.set(.4,.15,4);camera.lookAt(0,0,0);}
  else if(type==='bag'){model=new T.Group();box(model,0,0,0,.63,.75,.35,'#719743');box(model,0,.04,.2,.46,.46,.12,'#a9c75d');box(model,0,.43,0,.28,.13,.12,'#a9c75d');box(model,0,.1,.28,.1,.13,.03,'#eee8b1');}
  else model=resourceModel(type);
  if(!['avatar','axe','pick','diamond-axe','diamond-pick'].includes(type)){camera.left=-.47;camera.right=.47;camera.top=.47;camera.bottom=-.47;}else{camera.left=-.66;camera.right=.66;camera.top=.66;camera.bottom=-.66;}camera.updateProjectionMatrix();scene.add(model);r.render(scene,camera);icons.set(type,r.domElement.toDataURL('image/png'));model.removeFromParent();reset();
 }
 r.dispose();r.forceContextLoss();
}
function tileGeometry(at,biome,index){
 const p=xy(at),r=TILE/Math.sqrt(3),base=surface(p.x,p.z),pos=[],colors=[];
 const palettes={grass:['#a2d97a','#a9df83','#9bd173'],bridge:['#dcb376'],stone:['#ca896d','#d09072','#c58569'],sand:['#e1b067','#e8ba72'],ruins:['#8c91b7','#9aa2c4']};
 const palette=palettes[biome]||palettes.grass,top=new T.Color(palette[index%palette.length]);
 const side=new T.Color(biome==='grass'?'#8a9d55':biome==='bridge'?'#916741':biome==='stone'?'#8b5949':biome==='sand'?'#af8050':'#625d86');
 const v=[];for(let k=0;k<6;k++){const a=Math.PI/6+k*Math.PI/3,x=Math.cos(a)*r,z=Math.sin(a)*r;v.push([x,surface(p.x+x,p.z+z)-base,z]);}
 const tri=(a,b,c,color)=>{pos.push(...a,...b,...c);for(let i=0;i<3;i++)colors.push(color.r,color.g,color.b);};
 for(let k=0;k<6;k++){const a=v[k],b=v[(k+1)%6],aa=[a[0],a[1]-.72,a[2]],bb=[b[0],b[1]-.72,b[2]];tri([0,0,0],b,a,top);tri(a,b,aa,side);tri(b,bb,aa,side);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();return geo;
}
export class Art{
 constructor(canvas,s){
  makeIcons();this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.NoToneMapping;this.renderer.toneMappingExposure=1;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;
  this.scene=new T.Scene();this.scene.background=new T.Color('#252344');this.scene.add(new T.HemisphereLight('#fff','#9eabc5',2.1));
  this.sun=new T.DirectionalLight('#fff7df',1.9);this.sun.position.set(-8,18,9);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1536,1536);Object.assign(this.sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,far:70});this.sun.shadow.bias=-.0006;this.sun.shadow.normalBias=.035;this.scene.add(this.sun,this.sun.target);
  this.camera=new T.OrthographicCamera(-10,10,15,-15,.1,240);this.focus=new T.Vector3(s.player.x,surface(s.player.x,s.player.z),s.player.z);this.zoom=14.2;this.time=0;this.effects=[];this.nodes=new Map();this.props=new Map();this.pads=new Map();this.tiles=new Map();this.decor=[];this.world=new T.Group();this.scene.add(this.world);this.ray=new T.Raycaster();
  this.makePlanet();this.makeGround();this.makeNodes();this.makeProps();this.player=character();this.player.root.scale.setScalar(1);this.world.add(this.player.root);
  this.swish=new T.Mesh(new T.RingGeometry(.94,1.08,30,1,0,Math.PI*1.18),new T.MeshBasicMaterial({color:'#fffee8',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));this.swish.rotation.x=-Math.PI/2;this.swish.position.y=.6;this.player.root.add(this.swish);
  this.waypoint=new T.Mesh(new T.RingGeometry(.25,.31,20),new T.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));this.waypoint.rotation.x=-Math.PI/2;this.world.add(this.waypoint);this.waypoint.visible=false;this.sync(s,true);this.resize();
 }
 place(root,x,z){root.position.set(x,surface(x,z),z);root.quaternion.setFromUnitVectors(UP,normalAt(x,z));return root;}
 makePlanet(){
  const material=new T.ShaderMaterial({vertexShader:'varying vec3 n;varying vec3 p;void main(){n=normalize(mat3(modelMatrix)*normal);p=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',fragmentShader:'varying vec3 n;varying vec3 p;void main(){vec3 v=normalize(cameraPosition-p);float rim=pow(1.-max(0.,dot(normalize(n),v)),2.8);float light=.92+.08*dot(normalize(n),normalize(vec3(-.3,1.,.4)));gl_FragColor=vec4(vec3(.005,.70,1.)*light+rim*vec3(0.,.28,.0),1.);}'});
  this.planet=new T.Mesh(new T.SphereGeometry(RAD,80,48),material);this.planet.position.copy(CENTER);this.scene.add(this.planet);const waterShadow=new T.Mesh(new T.SphereGeometry(RAD+.008,80,48),new T.ShadowMaterial({color:'#006bb2',opacity:.46}));waterShadow.position.copy(CENTER);waterShadow.receiveShadow=true;this.scene.add(waterShadow);
  const stars=[];for(let i=0;i<85;i++)stars.push(Math.sin(i*68.23)*140,Math.cos(i*71.84)*95-10,-100+Math.sin(i*19)*30);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(stars,3));this.scene.add(new T.Points(geo,new T.PointsMaterial({color:'#bfc1ec',size:.12,transparent:true,opacity:.56,sizeAttenuation:true,depthWrite:false})));
 }
 makeGround(){
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,emissive:'#1b260d',emissiveIntensity:.65});
  tilesFor(SITES.map(s=>s.id)).forEach((tile,i)=>{const at=xy(tile.at),root=new T.Group();root.position.set(at.x,surface(at.x,at.z),at.z);const mesh=new T.Mesh(tileGeometry(tile.at,tile.biome,i),material);mesh.receiveShadow=true;mesh.castShadow=true;root.add(mesh);this.world.add(root);this.tiles.set(tile.at.join(','),{...tile,root,base:root.position.y,born:-100,visible:false});
   if(tile.biome==='grass'&&tile.at[1]===0){const points=[];for(let j=0;j<10;j++){const x0=-TILE/2+j*TILE/10,x1=x0+TILE/10,z0=Math.sin((at.x+x0)*.8)*.13,z1=Math.sin((at.x+x1)*.8)*.13;const v=(x,z)=>[x,surface(at.x+x,at.z+z)-surface(at.x,at.z)+.014,z];points.push(...v(x0,z0-.22),...v(x0,z0+.22),...v(x1,z1-.22),...v(x1,z1-.22),...v(x0,z0+.22),...v(x1,z1+.22));}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.computeVertexNormals();root.add(new T.Mesh(geo,new T.MeshBasicMaterial({color:'#c3e998',side:T.DoubleSide})));}
   if(tile.biome==='grass'&&i%4===0){const g=new T.Group();this.place(g,at.x+.6,at.z+.5);for(let j=0;j<3;j++){const m=box(g,j*.1,.11,0,.04,.22,.035,'#70af68',false);m.rotation.z=(j-1)*.4;}this.world.add(g);this.decor.push({g,key:tile.at.join(',')});}
  });
 }
 makeNodes(){NODES.forEach((n,i)=>{const at=xy(n.at),root=new T.Group(),plant=new T.Group();this.place(root,at.x,at.z);root.add(plant);const bits=n.type==='wood'?tree(plant,i):n.type==='wheat'?wheat(plant):rock(plant,n.type,i);
  if(n.type==='wood'){plant.scale.setScalar(1.3);const sapling=new T.Group();sapling.position.set(.66,0,-.38);sapling.scale.setScalar(.56);tree(sapling,i+1);root.add(sapling);bits.sapling=sapling;}
  const fadeMeshes=[];plant.traverse(m=>{if(m.isMesh&&!m.material.map){m.material=m.material.clone();fadeMeshes.push(m);}});
  const stump=new T.Group();box(stump,0,.1,0,.43,.2,.43,n.type==='wood'?'#b6885b':'#8d809c');stump.visible=false;root.add(stump);this.world.add(root);this.nodes.set(n.id,{root,plant,bits,stump,fadeMeshes,fade:1,hit:0,fall:0,grow:1});
 });}
 makeProps(){
  const prop=(id,at,fn,offset=0)=>{const g=new T.Group(),p=xy(at);this.place(g,p.x,p.z+offset);const extra=fn(g);this.world.add(g);this.props.set(id,{root:g,extra});return g;};
  prop('workbench',[3,1],workbench,-2.05);prop('furnace',SERVICES.find(p=>p.id==='smelt').at,furnace,-2.05);prop('cow',[3.8,-2.05],cow,-.8);prop('villager',SERVICES.find(p=>p.id==='trade').at,villager,-.8);prop('portal',SITES.find(p=>p.id==='portal').at,portal,-2.05);prop('chest',TREASURE_AT,chest);
  const arrival=prop('arrival',[.65,-.6],portal);arrival.scale.setScalar(.32);arrival.rotateY(.2);
  prop('waterfall',[4.4,-4.5],g=>{const m=new T.Mesh(new T.BoxGeometry(.65,4,.12),new T.MeshBasicMaterial({color:'#b8fdff',transparent:true,opacity:.7}));m.position.y=-1.8;g.add(m);return m;});
  for(const site of [...SITES,...SERVICES]){const p=xy(site.at),g=new T.Group();this.place(g,p.x,p.z);g.position.y+=.08;const fill=new T.Mesh(new T.PlaneGeometry(1.05,.85),new T.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.08,depthWrite:false}));fill.rotation.x=-Math.PI/2;g.add(fill);for(const z of[-.43,.43])box(g,0,.01,z,1.12,.035,.055,'#fff',false);for(const x of[-.55,.55])box(g,x,.01,0,.055,.035,.9,'#fff',false);this.world.add(g);this.pads.set(site.id,{root:g,fill});}
 }
 sync(s,instant=false){
  const visible=new Set(tilesFor(s.done,s.paid).map(t=>t.at.join(',')));
  for(const[key,tile]of this.tiles){const show=visible.has(key);if(show&&!tile.visible){tile.born=instant?-100:this.time;if(!instant)this.puff({x:tile.root.position.x,z:tile.root.position.z},'#e4f8b5',5);}tile.visible=show;tile.root.visible=show;}
  for(const n of NODES){const at=xy(n.at);this.nodes.get(n.id).root.visible=!n.from||s.done.includes(n.from)||visible.has(hexAt(at.x,at.z).join(','));}
  const show={workbench:s.done.includes('meadow'),furnace:s.done.includes('furnace'),cow:s.done.includes('pasture'),villager:s.done.includes('ruins'),portal:s.done.includes('ruins'),chest:s.done.includes('vault'),waterfall:s.done.includes('grove'),arrival:true};
  for(const[id,p]of this.props){if(id.startsWith('ghost-')){const site=p.extra;p.root.visible=!s.done.includes(site.id)&&site.needs.every(n=>s.done.includes(n));const list=orderedTiles(site),next=list[Math.min(list.length-1,landCount(site,s.paid))],at=xy(next);this.place(p.root,at.x,at.z);p.root.position.y+=.06;}else p.root.visible=!!show[id];}
  for(const site of [...SITES,...SERVICES])this.pads.get(site.id).root.visible=site.from?s.done.includes(site.from):!s.done.includes(site.id)&&site.needs.every(id=>s.done.includes(id));for(const d of this.decor)d.g.visible=visible.has(d.key);this.revision=s.terrainVersion;this.doneCount=s.done.length;
 }
 updateWorld(s,instant=false){this.sync(s,instant);}
 resize(){const r=this.renderer.domElement.getBoundingClientRect();this.w=r.width;this.h=r.height;this.renderer.setSize(r.width,r.height,false);}
 movement(x,y){
  const p=this.player.root.position,height=Math.max(2,surface(p.x,p.z)+RAD-.8),hx=-(p.x-CENTER.x)/height,hz=-(p.z-CENTER.z)/height;
  const right=new T.Vector3(1,0,0).applyQuaternion(this.camera.quaternion),down=new T.Vector3(0,-1,0).applyQuaternion(this.camera.quaternion);
  const tx=new T.Vector3(1,hx,0),tz=new T.Vector3(0,hz,1),a=right.dot(tx),b=right.dot(tz),c=down.dot(tx),d=down.dot(tz),det=a*d-b*c;
  const vx=(d*x-b*y)/det,vz=(-c*x+a*y)/det,length=Math.hypot(vx,vz)||1,magnitude=Math.min(1,Math.hypot(x,y));
  return {x:vx/length*magnitude,z:vz/length*magnitude};
 }
 project(x,y,z){const p=new T.Vector3(x,surface(x,z)+y,z).project(this.camera);return {x:(p.x*.5+.5)*this.w,y:(-.5*p.y+.5)*this.h,visible:p.z<1&&Math.abs(p.x)<1.2&&Math.abs(p.y)<1.2};}
 groundPoint(x,y){this.ray.setFromCamera(new T.Vector2(x/this.w*2-1,1-y/this.h*2),this.camera);const ray=this.ray.ray;let t=(this.focus.y-ray.origin.y)/ray.direction.y;for(let i=0;i<6;i++){const p=ray.at(t,new T.Vector3());t+=(surface(p.x,p.z)-p.y)/ray.direction.y;}const p=ray.at(t,new T.Vector3());return {x:p.x,z:p.z};}
 puff(at,color,count=8){for(let i=0;i<count;i++){const mesh=box(this.world,at.x,surface(at.x,at.z)+.5,at.z,.13,.13,.13,color,false);this.effects.push({kind:'puff',mesh,age:0,life:.55,vx:(Math.random()-.5)*2.7,vy:1+Math.random()*2,vz:(Math.random()-.5)*2.7});}}
 fly(from,to,type,amount=1){for(let i=0;i<Math.min(3,amount);i++){const mesh=resourceModel(type);mesh.scale.setScalar(.6);this.world.add(mesh);this.effects.push({kind:'fly',mesh,age:-i*.055,life:.42,from:{...from,y:surface(from.x,from.z)+from.y},to:{...to,y:surface(to.x,to.z)+to.y}});}}
 handle(s,e){
  if(e.type==='harvest'){const n=NODES.find(n=>n.id===e.node),p=xy(n.at);this.nodes.get(n.id).hit=.3;this.player.swing=.43;this.puff(p,n.type==='wood'?'#e5f3b2':n.type==='obsidian'?'#c6a0ff':'#e7d8ec',7);this.fly({...p,y:1.1},{...s.player,y:1.6},n.type,e.amount);}
  if(e.type==='deplete'){const n=NODES.find(n=>n.id===e.node);this.nodes.get(n.id).fall=.4;this.puff(xy(n.at),n.type==='wood'?'#a3deae':'#cbb8e5',14);}
  if(e.type==='regrow')this.nodes.get(e.node).grow=0;
  if(e.type==='deposit'){const p=xy(SITES.find(p=>p.id===e.site).at);this.fly({...s.player,y:1.55},{...p,y:.15},e.resource);}
  if(e.type==='build'){this.sync(s);this.puff(xy(SITES.find(p=>p.id===e.site).at),'#fff0a8',20);}
  if(e.type==='service')this.puff(xy(SERVICES.find(p=>p.id===e.service).at),'#fff3b0',12);
  if(e.type==='treasure')this.puff(xy(TREASURE_AT),'#65ffc4',25);
 }
 render(s,dt,{moved=false,overview=false,near=null,path=[]}={}){
  this.time+=dt;if(this.revision!==s.terrainVersion||this.doneCount!==s.done.length)this.sync(s);
  for(const tile of this.tiles.values())if(tile.visible){const age=this.time-tile.born,f=Math.min(1,age*3);tile.root.position.y=tile.base-(1-f)*2;tile.root.scale.setScalar(Math.max(.02,Math.min(1,age*4)));}
  const p=this.player;this.place(p.root,s.player.x,s.player.z);const diff=Math.atan2(Math.sin(s.player.angle-p.body.rotation.y),Math.cos(s.player.angle-p.body.rotation.y));p.body.rotation.y+=diff*Math.min(1,dt*16);p.walk+=dt*(moved?12:2);const stride=moved?Math.sin(p.walk)*.7:0;p.legs[0].rotation.x=stride;p.legs[1].rotation.x=-stride;p.arms[0].rotation.x=-stride*.7;p.arms[1].rotation.x=stride*.7;p.body.position.y=moved?Math.abs(Math.sin(p.walk))*.055:0;
  p.swing=Math.max(0,p.swing-dt);this.swish.material.opacity=p.swing>0?Math.sin(p.swing/.43*Math.PI)*.8:0;this.swish.rotation.z=-s.player.angle-1.8;
  if(p.swing>0){const wave=Math.sin((1-p.swing/.43)*Math.PI);p.arms[1].rotation.x=-wave*1.65;p.arms[1].rotation.z=-wave*.75;p.body.rotation.y-=wave*.12;}else p.arms[1].rotation.z=0;
  if(p.tier!==s.tier){p.tool.removeFromParent();p.tool=axe(p.arms[1],s.tier);p.tool.position.set(0,-.55,.13);p.tool.rotation.z=-.3;p.tier=s.tier;}
  const sig=Object.values(s.bag).join(',');if(this.stackSig!==sig){this.stackSig=sig;packModels(p.stack,s.bag);}p.stack.rotation.z=Math.sin(p.walk*.6)*(moved?.065:.005);p.stack.rotation.x=moved?-.07:0;
  for(const n of NODES){const o=this.nodes.get(n.id),r=s.nodes[n.id];o.hit=Math.max(0,o.hit-dt);o.fall=Math.max(0,o.fall-dt);o.grow=Math.min(1,o.grow+dt*2.5);o.plant.visible=r.left>0||o.fall>0;o.stump.visible=r.left===0;o.plant.rotation.z=Math.sin(o.hit*55)*o.hit*.18+(r.left===0?(1-o.fall/.4)*.7:0);o.plant.scale.setScalar((n.type==='wood'?1.3:1)*o.grow*(r.left===0?o.fall/.4:1));if(o.bits.sapling)o.bits.sapling.visible=r.left>0;if(o.bits.leaf)o.bits.leaf.rotation.z=Math.sin(this.time+n.at[0])*.018;}
  for(const[id,pad]of this.pads)if(pad.root.visible){const active=(near?.kind==='site'||near?.kind==='service')&&near.data.id===id;pad.fill.material.opacity=active?.4:.06+Math.sin(this.time*3)*.02;}
  const gate=this.props.get('portal');gate.extra.material.uniforms.time.value=this.time;gate.extra.material.uniforms.power.value=s.won?1:0;const arrival=this.props.get('arrival');arrival.extra.material.uniforms.time.value=this.time;arrival.extra.material.uniforms.power.value=.65;
  for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.age+=dt;if(e.age<0)continue;const t=Math.min(1,e.age/e.life);if(e.kind==='fly'){e.mesh.position.set(T.MathUtils.lerp(e.from.x,e.to.x,t),T.MathUtils.lerp(e.from.y,e.to.y,t)+Math.sin(t*Math.PI)*1.0,T.MathUtils.lerp(e.from.z,e.to.z,t));e.mesh.rotation.y+=dt*7;}else{e.mesh.position.x+=e.vx*dt;e.mesh.position.y+=e.vy*dt;e.mesh.position.z+=e.vz*dt;e.vy-=7*dt;e.mesh.rotation.x+=dt*5;e.mesh.scale.setScalar(.13*(1-t));}if(t>=1){e.mesh.removeFromParent();this.effects.splice(i,1);}}
  const target=overview?new T.Vector3(8,surface(8,2.5),2.5):new T.Vector3(s.player.x,surface(s.player.x,s.player.z)+.5,s.player.z);this.focus.lerp(target,Math.min(1,dt*6));const aspect=this.w/this.h,desired=overview?(aspect<1?46:53):aspect<1?14.2:Math.max(25,16*aspect);this.zoom+=(desired-this.zoom)*Math.min(1,dt*5);this.camera.left=-this.zoom/2;this.camera.right=this.zoom/2;this.camera.top=this.zoom/aspect/2;this.camera.bottom=-this.zoom/aspect/2;this.camera.updateProjectionMatrix();
  const radial=normalAt(this.focus.x,this.focus.z),tangent=new T.Vector3(-18,0,9);tangent.addScaledVector(radial,-tangent.dot(radial)).normalize().multiplyScalar(20);
  this.camera.up.copy(radial);this.camera.position.copy(this.focus).add(radial.clone().multiplyScalar(24)).add(tangent);this.camera.lookAt(this.focus);this.camera.setViewOffset(this.w,this.h,0,this.h*.035,this.w,this.h);this.sun.position.copy(this.focus).add(new T.Vector3(-8,20,12));this.sun.target.position.copy(this.focus);
  // Foreground resources fade when their canopy hides the explorer.
  this.player.root.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);
  const direction=this.camera.getWorldDirection(new T.Vector3()),head=this.player.root.localToWorld(new T.Vector3(0,1.45,0)),torso=this.player.root.localToWorld(new T.Vector3(0,.85,0));
  for(const o of this.nodes.values())if(o.root.visible){o.root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(o.plant);let covered=false;for(const target of [head,torso]){const origin=target.clone().addScaledVector(direction,-100),hit=new T.Ray(origin,direction).intersectBox(bounds,new T.Vector3());if(hit&&hit.distanceTo(origin)<99.8){covered=true;break;}}o.fade+=( (covered?.2:1)-o.fade)*Math.min(1,dt*12);for(const m of o.fadeMeshes){m.material.opacity=o.fade;m.material.transparent=o.fade<.995;m.material.depthWrite=o.fade>.99;}}
  if(path.length){const at=path.at(-1);this.place(this.waypoint,at.x,at.z);this.waypoint.position.y+=.09;this.waypoint.visible=true;}else this.waypoint.visible=false;
  this.renderer.render(this.scene,this.camera);
 }
}
