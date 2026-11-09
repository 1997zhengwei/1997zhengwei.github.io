import {THREE,box,ball,cylinder,rod,ring,group,material,mesh,textSprite,effects} from './world.mjs';
import {sponge,patrick,squidward} from './characters.mjs';
import {burger} from './common.mjs';
import {texture,footsteps} from './polish.mjs';
import {LANES,STATIONS,distance,flightPose} from './rules.mjs';

export function createScene(host){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#52a6ae');scene.fog=new THREE.Fog('#52a6ae',35,65);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.setClearColor('#52a6ae');renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;host.append(renderer.domElement);
 const camera=new THREE.OrthographicCamera(-8,8,8,-8,.1,100);camera.position.set(0,18,17);camera.lookAt(0,.3,-.8);
 scene.add(new THREE.HemisphereLight('#d9fbff','#997350',2));const sun=new THREE.DirectionalLight('#ffe2b1',3.1);sun.position.set(-7,15,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-11,right:11,top:12,bottom:-12,near:1,far:40});sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;sun.shadow.radius=3;scene.add(sun);const fill=new THREE.DirectionalLight('#8bddd9',1.6);fill.position.set(6,10,-9);scene.add(fill);
 const root=group(scene);const floorMat=material('#ffffff',{map:texture('wood'),roughness:.72});floorMat.map.repeat.set(2.3,2.3);
 box(root,[14.3,.55,15.2],'#244b51',[0,-.45,-.6],.2);box(root,[14,.22,15],floorMat,[0,-.17,-.6],.1);
 // Irregular planks, brass nails and a checkerboard work area.
 for(let x=-6.4;x<7;x+=1.3)for(const z of [-6.6,5.4]){cylinder(root,.028,.028,.015,'#5e6b59',[x,.025,z],6);}
 for(let x=-4;x<=4;x++)for(let z=-3;z<=4;z++)box(root,[.98,.015,.98],(x+z)%2?'#eadabb':'#91b1a4',[x,.025,z],0);
 box(root,[14,4.4,.35],'#46918d',[0,2,-7.5],.1);for(let x=-6.5;x<=6.5;x+=1.3)box(root,[.09,4.4,.12],'#2c6b6d',[x,2,-7.24],.02);box(root,[14.25,.25,.65],'#a1653f',[0,4.15,-7.5]);box(root,[14.25,.25,.65],'#c09053',[0,.35,-7.5]);
 for(const x of [-5.6,5.6]){cylinder(root,1,1,.18,'#ba9959',[x,2.6,-7.1]).rotation.x=Math.PI/2;ball(root,.83,material('#90e4df',{roughness:.17,metalness:.25}),[x,2.6,-6.98],[1,1,.07]);ring(root,.86,.09,'#e6c888',[x,2.6,-6.89]);for(let i=0;i<8;i++)ball(root,.045,'#8f7c51',[x+Math.cos(i*Math.PI/4)*.87,2.6+Math.sin(i*Math.PI/4)*.87,-6.77]);}
 const sign=textSprite(root,'THE KRUSTY KRAB',{bg:'#a94736',color:'#fff1c9',scale:6});sign.position.set(0,3.55,-7.05);
 const subtitle=textSprite(root,'FRESH PATTIES • HAPPY FISH',{bg:'#286567',color:'#d8efc9',scale:4.6});subtitle.position.set(0,2.65,-7.02);
 // Serving bar, three unambiguous trays.
 box(root,[13.6,1.15,1.5],'#2c7774',[0,.58,-4.95]);box(root,[13.9,.18,1.75],'#e2c490',[0,1.24,-4.95],.09);for(let x=-6;x<=6;x+=1)box(root,[.07,.93,.05],'#76b8a4',[x,.57,-4.15],.01);
 const trayGroups=[],trayRings=[],customers=[];
 for(const [i,x]of LANES.entries()){
  const tray=group(root,[x,1.4,-4.65]);box(tray,[1.6,.09,1.05],'#e0b957');box(tray,[1.42,.03,.88],'#f9ecc6',[0,.06,0]);trayGroups.push(tray);
  const marker=ring(root,.68,.07,'#f4d16b',[x,.075,-3.3],Math.PI/2);trayRings.push(marker);const tag=textSprite(root,String(i+1),{bg:'#285f61',scale:1.4});tag.position.set(x,1.75,-4.1);
  const c=group(root,[x,0,-6.2]);const body=group(c);ball(body,.46,['#b2bbde','#edaa7f','#98c69a'][i],[0,1,0],[.8,1.2,.64]);box(body,[.65,.65,.55],['#ca715d','#e4bb59','#8d7da3'][i],[0,.5,0],.16);ball(body,.4,['#b2bbde','#edaa7f','#98c69a'][i],[0,1.64,.05],[1.1,.85,.8]);for(const xx of [-.17,.17]){ball(body,.15,'#fff6df',[xx,1.7,.34],[.85,1,.5]);ball(body,.046,'#2d4548',[xx,1.7,.415]);rod(body,[xx,.28,0],[xx,.04,.1],.07,'#4f7771');}ball(body,.16,'#7e5650',[0,1.45,.34],[1,.25,.3]);const arms=[];for(const s of [-1,1]){const a=group(body,[s*.38,1.05,0]);rod(a,[0,0,0],[s*.16,-.22,.15],.075,['#b2bbde','#edaa7f','#98c69a'][i]);arms.push(a)}customers.push({group:c,body,arms,celebrate:0});
 }
 // Side workstations leave a broad walkable middle.
 const stationLabels={};
 for(const [key,x,col,title]of [['grill',-5.6,'#d67c48','1 · GRILL'],['build',5.6,'#4b9f86','2 · PREP']]){
  box(root,[2,1.25,3.2],col,[x,.63,2.75],.13);box(root,[2.12,.2,3.35],'#f0d8a2',[x,1.34,2.75],.1);for(const z of [1.8,3.4])box(root,[1.72,.65,.09],key==='grill'?'#4a6060':'#37766b',[x,.65,z],.08);const t=textSprite(root,title,{bg:col,scale:2.4});t.position.set(x,2.55,3.2);stationLabels[key]=t;ring(root,.7,.05,col,[STATIONS[key].x,.08,2.7],Math.PI/2);
 }
 box(root,[1.64,.1,2.65],'#354e4b',[-5.6,1.49,2.65]);for(let z=1.5;z<3.9;z+=.24)box(root,[1.5,.04,.05],'#91a59a',[-5.6,1.56,z],0);
 const grillItems=[];for(let i=0;i<4;i++){const x=-5.99+(i%2)*.78,z=1.95+Math.floor(i/2)*1.2;const patty=ball(root,.32,material('#a66a36').clone(),[x,1.65,z],[1,.25,1]);const ready=ring(root,.4,.045,'#7bdf9a',[x,1.59,z],Math.PI/2);const steam=[];for(let j=0;j<3;j++){const m=ball(root,.08,material('#e5f4d5',{transparent:true,opacity:.42,depthWrite:false}),[x,1.8,z]);m.castShadow=false;steam.push(m)}grillItems.push({patty,ready,steam,x,z});}
 // Ingredient trays, a chopping board and squeeze bottles.
 box(root,[1.35,.07,1.1],'#ac7147',[5.6,1.49,2.9]);for(let i=0;i<3;i++){cylinder(root,.27,.28,.11,'#b8c8b5',[5.15+i*.47,1.53,1.6]);for(let j=0;j<3;j++)ball(root,.18,['#f5cf6b','#77b55a','#e57e50'][i],[5.15+i*.47,1.61+j*.055,1.6],[1,.25,1]);}for(const [i,c]of ['#d95336','#e9bb48'].entries()){cylinder(root,.12,.16,.45,c,[5.15+i*.42,1.7,4]);cylinder(root,.025,.07,.15,'#fff0bf',[5.15+i*.42,2,4]);}
 const prepBurger=burger(root,[5.6,1.5,2.9]);prepBurger.visible=false;
 const bounce=group(root,[0,.1,1]);cylinder(bounce,.91,1,.13,'#4a9ead');cylinder(bounce,.77,.77,.035,'#a7e2d8',[0,.08,0]);ring(bounce,.86,.045,'#f7dc8a',[0,.1,0],Math.PI/2);const bounceText=textSprite(root,'BOUNCE BONUS',{bg:'#2f7785',scale:2});bounceText.position.set(0,.46,1);
 // Dining nook and warm hanging lamps.
 for(const x of [-5.8,5.8]){const pot=group(root,[x,0,5.5]);cylinder(pot,.35,.25,.52,'#c9774e',[0,.26,0]);for(let i=0;i<5;i++){const leaf=ball(pot,.5,'#53875f',[Math.sin(i*2.3)*.22,.9,Math.cos(i*2.3)*.22],[.3,1.1,.3]);leaf.rotation.z=Math.sin(i*2)*.4;}}
 for(const x of [-4,4]){rod(root,[x,6,-5],[x,4.2,-5],.035,'#345f5d');cylinder(root,.2,.65,.4,'#c79f58',[x,4.2,-5]);ball(root,.21,new THREE.MeshBasicMaterial({color:'#ffe7a6'}),[x,3.99,-5],[1,.4,1]);}
 const vent=group(root,[-6.78,0,-.6]);box(vent,[.12,1.1,1.3],'#4d6963',[0,.6,0]);for(let y=.2;y<1;y+=.14)box(vent,[.16,.045,1.05],'#9aa88c',[.03,y,0]);
 const squid=squidward(root);squid.scale.setScalar(.65);squid.position.set(6.1,0,-6.3);const closedSign=textSprite(root,'ON BREAK',{bg:'#985c72',scale:2.3});closedSign.position.set(0,2.5,-4.8);closedSign.visible=false;
 const player=sponge(root);player.scale.setScalar(.82);player.userData.faceCamera=true;const chefhat=group(player,[0,2.69,0]);cylinder(chefhat,.4,.4,.18,'#fff6dd');for(const x of [-.22,0,.22])ball(chefhat,.23,'#fff9e8',[x,.21,0]);
 const held=[];for(let i=0;i<4;i++){const g=group(player,[.82+(i%2)*.32,1.2+Math.floor(i/2)*.55,.55]);g.scale.setScalar(.8);const b=burger(g);const patty=ball(g,.37,'#805337',[0,.2,0],[1,.24,1]);held.push({g,b,patty});}
 const pat=patrick(root);pat.scale.setScalar(.68);const patText=textSprite(root,'HUNGRY!',{bg:'#bb6786',scale:2});pat.add(patText);patText.position.y=3.2;
 const plank=group(root);cylinder(plank,.2,.27,.85,'#7ca858',[0,.55,0]);ball(plank,.24,'#8ab968',[0,.96,0]);ball(plank,.15,'#f4e29a',[0,.94,.23]);ball(plank,.07,'#aa4c3e',[0,.94,.35]);for(const s of [-1,1]){rod(plank,[s*.12,1.1,0],[s*.27,1.65,0],.026,'#557c46');rod(plank,[s*.16,.2,0],[s*.28,.05,.12],.04,'#557c46');}box(plank,[.35,.5,.13],'#ffedb5',[.35,.5,.1]);const plankText=textSprite(plank,'CATCH ME!',{bg:'#697b40',scale:2});plankText.position.y=2.2;
 const targetRing=ring(root,.7,.08,material('#ffe27e',{emissive:'#b57d1d',emissiveIntensity:.4}),[0,.12,0],Math.PI/2);const dots=[];for(let i=0;i<12;i++){const m=ball(root,.07,'#fff3a7',[0,.08,0],[1,.3,1]);m.castShadow=false;dots.push(m)}
 const arrow=mesh(root,new THREE.ConeGeometry(.22,.5,3),'#ffe16b');arrow.rotation.x=Math.PI/2;
 const arcPoints=new Float32Array(33*3),arcGeo=new THREE.BufferGeometry();arcGeo.setAttribute('position',new THREE.BufferAttribute(arcPoints,3));const arc=new THREE.Line(arcGeo,new THREE.LineDashedMaterial({color:'#fff5a4',dashSize:.25,gapSize:.12}));arc.frustumCulled=false;scene.add(arc);
 const flying=Array.from({length:8},()=>burger(root));const dropped=Array.from({length:8},()=>burger(root));const puddles=Array.from({length:3},()=>ball(root,1,material('#e58437',{roughness:.25,transparent:true,opacity:.82}),[0,.07,0],[1,.025,.7]));
 const fx=effects(root);const dust=[];for(let i=0;i<13;i++){const m=ball(root,.025,material('#e7ffdd',{transparent:true,opacity:.45}),[Math.sin(i*2)*6,1+i%4,Math.cos(i*2)*6]);m.castShadow=false;dust.push(m)}
 let width=1,height=1;
 function resize(){width=host.clientWidth;height=host.clientHeight;renderer.setSize(width,height,false);const a=width/height;const halfX=a<1?7.5:Math.max(9,a*8);const halfY=halfX/a;camera.left=-halfX;camera.right=halfX;camera.top=halfY;camera.bottom=-halfY;camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(host);resize();
 const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 function ground(clientX,clientY){const r=host.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);const v=new THREE.Vector3();return ray.ray.intersectPlane(plane,v)?{x:v.x,z:v.z}:null;}
 function project(pos){const v=new THREE.Vector3(pos.x,pos.y||1,pos.z).project(camera);return {x:(v.x*.5+.5)*width,y:(-.5*v.y+.5)*height};}
 function flightHeight(t,bank){return 1.65+Math.sin(Math.PI*t)*2.1-(bank?Math.exp(-Math.pow((t-.48)*14,2))*1.8:0);}
 function update(s,dt,aim){const t=s.time,p=s.player;player.position.set(p.x,Math.sin(t*14)*.035,p.z);const moving=Math.hypot(p.x-(player.userData.lastX??p.x),p.z-(player.userData.lastZ??p.z))>.002;player.userData.lastX=p.x;player.userData.lastZ=p.z;if(moving){const a=Math.atan2(p.dx,p.dz);player.rotation.y+=Math.atan2(Math.sin(a-player.rotation.y),Math.cos(a-player.rotation.y))*Math.min(1,dt*15);}footsteps(player,t,moving);player.rotation.z=moving?Math.sin(t*14)*.045:0;if(s.dash>0){player.rotation.x=-.18; if(Math.random()<.4)fx.burst(new THREE.Vector3(p.x,.2,p.z),'#eff0b8',2);}else player.rotation.x=0;
  held.forEach((h,i)=>{h.g.visible=!!s.hands[i];h.b.visible=s.hands[i]==='burger';h.patty.visible=s.hands[i]==='patty';h.g.rotation.z=Math.sin(t*7)*.04});
  grillItems.forEach((g,i)=>{const data=s.grills[i];g.patty.visible=!!data;g.ready.visible=!!data?.ready;g.ready.scale.setScalar(1+Math.sin(t*5)*.04);if(data)g.patty.material.color.set(data.ready?'#7d4929':'#bb7650');g.steam.forEach((m,j)=>{m.visible=!!data;m.position.set(g.x+Math.sin(t+j)*.09,1.8+((t*.5+j*.3)%1.2),g.z);m.scale.setScalar(.4+((t*.5+j*.3)%1.2));});});
  prepBurger.visible=s.buildFlash>0;prepBurger.position.y=1.5+Math.sin(s.buildFlash*7)*.3;
  customers.forEach((c,i)=>{const o=s.orders[i];c.group.visible=!!o;c.celebrate=Math.max(0,c.celebrate-dt);c.group.position.y=c.celebrate>0?Math.abs(Math.sin(c.celebrate*12))*.35:Math.sin(t*2+i)*.025;c.body.rotation.z=o&&o.patience<12?Math.sin(t*9)*.07:0;c.arms.forEach((a,j)=>{a.rotation.x=c.celebrate>0?-1.7:Math.sin(t*2+j)*.12;});const closed=s.event?.kind==='squid'&&s.event.phase==='active'&&s.event.lane===i;trayRings[i].visible=!!o;trayRings[i].material.color.set(closed?'#c97989':aim?.lane===i?'#fff5ac':'#f4d16b');trayGroups[i].scale.setScalar(aim?.lane===i?1.12:1);});
  const e=s.event,patState=e?.kind==='patrick'?e:s.helper;pat.visible=!!patState;plank.visible=e?.kind==='plankton';if(pat.visible){pat.position.set(patState.x,Math.abs(Math.sin(t*7))*.04,patState.z);pat.rotation.y=Math.atan2(p.x-patState.x,p.z-patState.z);patText.visible=!s.helper;}if(plank.visible){plank.position.set(e.x,Math.abs(Math.sin(t*16))*.08,e.z);plank.rotation.z=Math.sin(t*12)*.12;}
  const breaking=e?.kind==='squid'&&e.phase==='active';closedSign.visible=breaking;squid.position.x=breaking?0:6.1;squid.position.y=breaking?Math.sin(t*2)*.02:0;squid.rotation.y=breaking?Math.sin(t)*.1:0;
  const rec=s.recommended(),goal=rec.target;const active=s.phase==='running';targetRing.visible=active;targetRing.position.set(goal.x,.08,goal.z);targetRing.scale.setScalar(1+Math.sin(t*4)*.07);const d=distance(p,goal);dots.forEach((m,i)=>{const u=(i+1)/14;m.visible=active&&d>1.4;m.position.set(p.x+(goal.x-p.x)*u,.1,p.z+(goal.z-p.z)*u);});arrow.visible=active&&d>1.5;arrow.position.set(p.x+(goal.x-p.x)*.7,.17,p.z+(goal.z-p.z)*.7);arrow.rotation.z=-Math.atan2(goal.x-p.x,goal.z-p.z);
  arc.visible=!!aim&&active;if(aim){const bank=distance(p,{x:0,z:1})<1.35;for(let i=0;i<33;i++){const u=i/32;const pos=flightPose(p,{x:LANES[aim.lane],z:-4.5},u,bank);arcPoints[i*3]=pos.x;arcPoints[i*3+1]=pos.y;arcPoints[i*3+2]=pos.z;}arc.geometry.attributes.position.needsUpdate=true;arc.computeLineDistances();arc.material.color.set(aim.hold>1.35?'#f5a36e':'#fff3aa');}
  flying.forEach((m,i)=>{const f=s.flights[i];m.visible=!!f;if(f){m.position.set(f.x,f.y??1.65,f.z);m.rotation.y=f.t*7;m.rotation.z=Math.sin(f.t*Math.PI)*.25;}});dropped.forEach((m,i)=>{const d=s.drops[i];m.visible=!!d;if(d){m.position.set(d.x,.15+Math.sin(t*4)*.06,d.z);m.rotation.y=t*.4;}});puddles.forEach((m,i)=>{const q=s.puddles[i];m.visible=!!q;if(q)m.position.set(q.x,.06,q.z);});bounce.visible=s.total>0;bounceText.visible=s.total>0;dust.forEach((m,i)=>{m.position.y=.5+(t*.12+i*.7)%4.5;});fx.update(dt);renderer.render(scene,camera);
 }
 function onEvent(e,s){if(e.type==='bounce')fx.burst(new THREE.Vector3(0,.3,1),'#9eeadd',15);if(e.type==='serve'){customers[e.lane].celebrate=1.2;fx.burst(new THREE.Vector3(LANES[e.lane],2,-4.6),e.bank?'#8fe9de':'#ffdd65',24);}if(['take','build','catch','feed'].includes(e.type))fx.burst(new THREE.Vector3(s.player.x,1.3,s.player.z),'#daef9b',12);if(e.type==='damage')fx.burst(new THREE.Vector3(s.player.x,1.5,s.player.z),'#ef9581',15);}
 return {update,ground,project,onEvent,renderer};
}
