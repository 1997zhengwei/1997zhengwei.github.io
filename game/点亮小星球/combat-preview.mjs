import {THREE,createPilotRig,disposePilotRig,createEnemyRig,disposeEnemyRig} from './starpath-world.mjs';
import {FrontierWorld,newProfile,XP,SUITS,WEAPONS,stats,publicProfile,combatEvolution} from './starpath-rules.mjs';
import {createCombatEvolutionVfx} from './combat-vfx.mjs';
import {createEnemyStudioEnvironment} from './enemy-surface.mjs';
const $=s=>document.querySelector(s),canvas=$('#range'),renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-8,8,8,-8,.1,100),anchor=-752;
scene.add(new THREE.HemisphereLight('#e4fbff','#31445e',1.3));
for(const [x,y,z,color,intensity]of [[-6,12,8,'#fff1d5',2.6],[7,6,-9,'#96c9ff',1.8]]){const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,anchor+z);scene.add(l)}
const environment=createEnemyStudioEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.55;
const floor=new THREE.Mesh(new THREE.CylinderGeometry(10,10,.16,72),new THREE.MeshStandardMaterial({color:'#254356',roughness:.65,metalness:.18}));floor.position.set(0,-.12,anchor-2);scene.add(floor);
for(const r of [5,9.5]){const m=new THREE.Mesh(new THREE.RingGeometry(r-.025,r+.025,72),new THREE.MeshBasicMaterial({color:'#74c3bb',transparent:true,opacity:.28,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(0,-.025,anchor-2);scene.add(m)}
const grid=new THREE.GridHelper(18,18,'#75b9bc','#416170');grid.position.set(0,-.028,anchor-2);grid.material.transparent=true;grid.material.opacity=.17;scene.add(grid);
const vfx=createCombatEvolutionVfx({scene});
const descriptions={pulse:['Split Pulse','Large energy rounds split into smaller fragments on impact.'],scatter:['Comet Shockwave','A solid forward arc hits once per enemy and pushes small enemies back.'],rail:['Prism Lance','Charge, then hold a thick piercing beam. Its origin follows the shooter.'],arc:['Aurora Orb','A slow electric sphere releases separate discharges into different targets.']};
const forms=['Heavy Exoskeleton','Deployable Mecha','Starcore Hover Frame'];
let level=31,weapon='pulse',auto=true,world,player,hero,targets=[],cursor=0,clock=0,cycle=0,last=performance.now(),fireUntil=0,hitEvents=0,damage=0,angle=-.50;
$('#levels').innerHTML=[31,36,41,45].map(l=>`<button data-level="${l}">LV ${l}</button>`).join('');
$('#weapons').innerHTML=Object.entries(descriptions).map(([k,[name,text]])=>`<button data-weapon="${k}"><b>${name}</b><span>${WEAPONS[k].name}</span></button>`).join('');
function empty(){if(hero)disposePilotRig(hero);for(const t of targets)disposeEnemyRig(t.rig);targets=[];hero=null}
function holograms(){
 for(const t of targets)disposeEnemyRig(t.rig);targets=[];
 const positions=[[-3.1,-4.6],[-1.5,-3.9],[0,-3.5],[1.5,-3.9],[3.1,-4.6]];
 world.enemies=positions.map(([x,z],i)=>({id:200+i,x,z:anchor+z,zone:6,type:'scout',hp:310,maxHp:310,speed:0,damage:0,contributors:{},homeX:x,homeZ:anchor+z,cd:1,specialCd:4,station:null,event:null}));
 for(const e of world.enemies){const rig=createEnemyRig(e);rig.root.position.set(e.x,0,e.z);rig.root.rotation.y=.15;scene.add(rig.root);
  const bg=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.09),new THREE.MeshBasicMaterial({color:'#28445c'})),fill=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.07),new THREE.MeshBasicMaterial({color:'#85e4d0'})),bar=new THREE.Group();bar.position.y=rig.height+.23;fill.position.z=.005;bar.add(bg,fill);rig.root.add(bar);targets.push({e,rig,bar,fill});
 }
 cycle=0;
}
function build(){
 empty();vfx.update(10);world=new FrontierWorld({id:'PREVIEW-ONLY'});
 const p=newProfile('preview','Hologram preview');Object.assign(p,{xp:XP[level-1],homeBase:2,cleared:[0,1,2,3,4,5],weapon,suit:-1});Object.assign(p.aurora,{arrived:true,radar:level>=36,escort:level>=41,guardian:level===45});Object.assign(p.modules,{armor:7,oxygen:7});for(const k of Object.keys(WEAPONS))p.weapons[k]=level>=40?5:4;
 player=world.enter(p);player.x=0;player.z=anchor+3;player.headingX=0;player.headingZ=-1;hero=createPilotRig(publicProfile(p));hero.root.position.set(player.x,0,player.z);hero.root.rotation.y=Math.PI;scene.add(hero.root);cursor=world.eventId;hitEvents=0;damage=0;fireUntil=0;holograms();
 const phase=combatEvolution(p);$('#stageLabel').textContent=`LV ${level} · EVOLUTION ${['I','II','III'][phase-1]}`;$('#form').textContent=forms[phase-1];$('#description').textContent=descriptions[weapon][1];$('#weaponTitle').textContent=descriptions[weapon][0];
 for(const b of document.querySelectorAll('[data-level]'))b.classList.toggle('active',+b.dataset.level===level);for(const b of document.querySelectorAll('[data-weapon]'))b.classList.toggle('active',b.dataset.weapon===weapon);
}
for(const b of document.querySelectorAll('[data-level]'))b.onclick=()=>{level=+b.dataset.level;build()};for(const b of document.querySelectorAll('[data-weapon]'))b.onclick=()=>{weapon=b.dataset.weapon;build()};
$('#auto').onclick=()=>{auto=!auto;$('#auto').textContent='Auto fire: '+(auto?'on':'off')};$('#reset').onclick=()=>{world.clearEvolution(player,'preview-reset');world.effects=[];cursor=world.eventId;player.fire=0;player.burst=player.charge=null;vfx.update(10);holograms();hitEvents=0;damage=0};
let front=false;$('#view').onclick=()=>{front=!front;angle=front?Math.PI-.50:-.50;$('#view').textContent=front?'View back':'View front';resize()};
let drag=null;canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX}};canvas.onpointermove=e=>{if(drag&&drag.id===e.pointerId){angle+=(e.clientX-drag.x)*.006;drag.x=e.clientX;resize()}};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight,aspect=w/h,span=aspect<1?8.9:6.8;renderer.setSize(w,h,false);camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.position.set(Math.sin(angle)*18,15,anchor+Math.cos(angle)*18);camera.lookAt(0,1.0,anchor-1.7);camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(canvas);resize();build();
function frame(now){
 const dt=Math.min(.06,(now-last)/1000);last=now;clock+=dt;cycle+=dt;world.time+=dt;player.fire-=dt;
 // A stationary hologram bench: run the same real weapon methods, without
 // pretending these nonattacking targets are an actual shared-world battle.
 if(auto)world.fireWeapon(player,stats(player.profile));world.updateEvolution();
 for(const e of world.effects)if(e.eventId>cursor){vfx.handle(e);if(['evoPulse','evoShockwave','evoBeam','evoOrb'].includes(e.type))fireUntil=clock+(e.type==='evoBeam'?e.duration:.24);if(e.type==='hit')hitEvents++;if(e.damage&&['evoPulse','evoFragment','evoArc'].includes(e.type))damage+=e.damage;cursor=e.eventId;}
 hero.updateVisual?.(publicProfile(player.profile),clock,false,clock<fireUntil);hero.muzzle.visible=clock<fireUntil;
 for(const t of targets){t.rig.root.position.set(t.e.x,Math.sin(clock*1.8+t.e.id)*.025,t.e.z);t.rig.root.visible=t.e.hp>0;t.bar.quaternion.copy(camera.quaternion);const ratio=Math.max(0,t.e.hp/t.e.maxHp);t.fill.scale.x=ratio;t.fill.position.x=-(1-ratio)*1.15/2;}
 vfx.update(dt,{players:[{id:player.id,x:player.x,z:player.z}]});
 const alive=world.enemies.filter(e=>e.hp>0).length;$('#hitCount').textContent=`${hitEvents} hits · ${5-alive}/5 targets cleared`;$('#readout').textContent=`${forms[combatEvolution(player.profile)-1]} · ${vfx.stats().active} active effects`;
 if(cycle>8||!alive&&cycle>3){world.clearEvolution(player,'preview-cycle');player.fire=.45;player.burst=player.charge=null;holograms();}
 renderer.render(scene,camera);requestAnimationFrame(frame);
}requestAnimationFrame(frame);
addEventListener('pagehide',e=>{if(e.persisted)return;empty();vfx.dispose();environment.dispose();renderer.dispose()});
