import * as T from '../vendor/three.module.js';
import {Simulation,createState,restoreState,serialize,current} from './simulation.mjs';
import {BAY_X,branchDef,PHASES,TYPES,careFor,phaseFor} from './config.mjs';
import {environment} from './art.mjs';
import {World} from './world.mjs';
import {CarVisual} from './car.mjs';
import {Effects} from './effects.mjs';
import {Audio} from './audio.mjs';
import {StylePreview} from './preview.mjs';
import {UI} from './ui.mjs';
import {setIcon} from './icons.mjs';
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search),qa=query.get('qa'),slot=query.get('slot'),key='foam-coast-v1'+(qa?'-qa-'+qa:slot?'-slot-'+slot.slice(0,48):'');
window.addEventListener('error',e=>{console.error('Foam Coast:',e.error||e.message);$('fatal').hidden=false;});
let raw;try{raw=JSON.parse(localStorage.getItem(key));}catch{}const s=restoreState(raw),audio=new Audio();audio.mute=s.settings.mute;
const scene=new T.Scene(),canvas=$('game'),renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=.92;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;scene.environment=environment(renderer);scene.environmentIntensity=.55;
const camera=new T.OrthographicCamera(-15,15,15,-15,.1,170),focus=new T.Vector3(BAY_X[s.selected],.3,0);let viewHeight=20,overview=false,width=1,height=1;
const hemi=new T.HemisphereLight('#eaf7f1','#799e9b',1.25);scene.add(hemi);const sun=new T.DirectionalLight('#f4f8f4',2.25);sun.position.set(-14,30,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:34,bottom:-32,near:1,far:95});sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun,sun.target);const fill=new T.DirectionalLight('#d1f5ff',.65);fill.position.set(15,14,-12);scene.add(fill);
const effects=new Effects(scene),preview=new StylePreview(scene.environment),cars=new Map();let ui,paused=false,modal=false,lastStation=-1;
const save=()=>{try{localStorage.setItem(key,serialize(s));}catch{}};
const sim=new Simulation(s,e=>{
if(['finish','phase','purchase','vip'].includes(e.type))audio.play(e.type==='finish'&&e.vip?'vip':e.type);
if(e.type==='hint')ui?.toast(e.text);
if(e.type==='phase'){const c=current(s).bays[e.lane].car;effects.burst(new T.Vector3(BAY_X[e.lane],1.1,0),'phase',phaseFor(c).color);}
if(e.type==='vip'){ui?.announceVIP(e);effects.burst(new T.Vector3(BAY_X[e.lane],1.4,0),'arrival');}
if(e.type==='finish'){ui?.float(e);effects.burst(new T.Vector3(BAY_X[e.lane],1.3,0),e.vip?'vip':'finish');save();}
if(e.type==='reward'){ui?.toast(`${e.label||'订单奖励'} +${e.amount} 金币`);audio.play('finish');save();}
if(e.type==='purchase'){ui?.toast('已经为小店安排好了');save();}
if(e.type==='star'){ui?.toast(`小店升至 ${e.stars} 星！`);audio.play('finish');save();}
if(e.type==='branch'){for(const c of cars.values())c.dispose();cars.clear();focus.set(BAY_X[0],.3,0);overview=false;save();}
});
const world=new World(scene,s);
function project(x,y,z){const v=new T.Vector3(x,y,z).project(camera);return {x:(v.x+1)*width/2,y:(1-v.y)*height/2,visible:v.z>-1&&v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1};}
function servicePoint(v,c,index){const t=TYPES[c.type];let p=v.cells[index];if(c.phase===3){if(t.care==='rims'){const wheel=Math.min(3,Math.floor(c.progress*4));p={x:(wheel<2?-1:1)*t.w*.54,y:.48,z:(wheel%2?1:-1)*t.l*.31};}else if(t.care==='crystal')p=v.cells[Math.min(9,Math.floor((c.progress*2%1)*10))*6+3];else p={x:t.w*.33,y:1.3,z:c.progress<.5?.6:-.65};}return v.root.localToWorld(new T.Vector3(p.x,p.y+.15,p.z));}
const actions={save,unlock:()=>audio.unlock(),project,focus(){overview=false;},overview(){overview=!overview;$('overview').classList.toggle('selected',overview);},pause(value){if(ui.open){ui.close();return;}if(!s.started)return;paused=typeof value==='boolean'?value:!paused;clearInput();$('paused').hidden=!paused;setIcon($('pause'),paused?'player-play':'player-pause');save();},modal(value){modal=value;clearInput();},sound(){audio.unlock();audio.mute=s.settings.mute;audio.spray(false);save();},preview:(canvas,id)=>preview.show(canvas,id)};
ui=new UI(sim,actions);
function clearInput(){sim.holding=false;sim.brush=null;dragging=false;ui?.stop();audio.spray(false);}
let dragging=false,pointerOrigin=null;
const ray=new T.Raycaster(),pointer=new T.Vector2();
function brushAt(x,y){pointer.set(x/width*2-1,1-y/height*2);ray.setFromCamera(pointer,camera);const st=current(s),b=st.bays[s.selected],c=b.car;if(c?.state!=='work')return false;const visual=cars.get(c.id);if(!visual)return false;const hits=ray.intersectObjects(visual.hitMeshes,false);if(!hits.length)return false;const local=visual.root.worldToLocal(hits[0].point.clone());let index=0,best=Infinity;for(let i=0;i<visual.cells.length;i++){const p=visual.cells[i],d=(local.x-p.x)**2+(local.y-p.y)**2+(local.z-p.z)**2;if(d<best){best=d;index=i;}}sim.brush={index,local:local.toArray()};return true;}
canvas.onpointerdown=e=>{if(!s.started||paused||modal||e.button!==0)return;audio.unlock();dragging=true;pointerOrigin=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);brushAt(e.clientX,e.clientY);};canvas.onpointermove=e=>{if(dragging)brushAt(e.clientX,e.clientY);};canvas.onpointerup=e=>{const brushed=!!sim.brush;sim.brush=null;dragging=false;if(!brushed&&pointerOrigin&&Math.hypot(e.clientX-pointerOrigin[0],e.clientY-pointerOrigin[1])<10){pointer.set(e.clientX/width*2-1,1-e.clientY/height*2);ray.setFromCamera(pointer,camera);const p=new T.Vector3();if(ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-.2),p)&&p.z>-7&&p.z<10){const i=BAY_X.reduce((a,_,i)=>Math.abs(BAY_X[i]-p.x)<Math.abs(BAY_X[a]-p.x)?i:a,0);if(current(s).bays[i].unlocked){sim.select(i);overview=false;}else{ui.show('equipment');ui.lane=i;ui.render();}}}pointerOrigin=null;};canvas.onpointercancel=()=>{sim.brush=null;dragging=false;};
window.addEventListener('keydown',e=>{if(['Space','KeyQ','KeyE','Escape','Digit1','Digit2','Digit3'].includes(e.code))e.preventDefault();if(e.repeat&&e.code!=='Space')return;if(e.code==='Escape'){if(ui.open)ui.close();else actions.pause();return;}if(!s.started||modal||paused)return;if(e.code==='Space'){audio.unlock();sim.holding=true;$('work').classList.add('working');}if(e.code==='KeyQ')actions.overview();if(e.code==='KeyE')ui.show('equipment');if(/^Digit[123]$/.test(e.code)){sim.select(Number(e.code.at(-1))-1);overview=false;}});window.addEventListener('keyup',e=>{if(e.code==='Space')ui.stop();});window.addEventListener('blur',clearInput);window.addEventListener('pagehide',()=>{clearInput();save();});document.addEventListener('visibilitychange',()=>{clearInput();save();});
function resize(){width=innerWidth;height=innerHeight;renderer.setSize(width,height);if(ui.open&&ui.tab==='style')ui.render();}window.addEventListener('resize',resize);resize();
let last=performance.now(),hudTimer=0,saveTimer=0,metricTimer=0,frameTimes=[];
if(query.get('metrics')==='1'){const el=document.createElement('div');el.id='metrics';$('hud').append(el);}
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;const frozen=paused||modal||document.hidden||!s.started,step=frozen?0:dt;sim.paused=frozen;sim.update(dt);const st=current(s),theme=branchDef(st.id).theme;
if(lastStation!==st.id){lastStation=st.id;scene.background=new T.Color(theme==='night'?'#586b90':theme==='desert'?'#b7beb3':'#91b9c5');hemi.intensity=theme==='night'?1.05:1.25;sun.color.set(theme==='night'?'#bbd2ff':'#f4f8f4');sun.intensity=theme==='night'?1.5:2.25;}
const ids=new Set(st.cars.map(c=>c.id));for(const [id,v]of cars)if(!ids.has(id)){v.dispose();cars.delete(id);}for(const c of st.cars){if(!cars.has(c.id))cars.set(c.id,new CarVisual(scene,c));const b=st.bays[c.lane],servicing=!frozen&&c.state==='work'&&(b.worker||b.level>=2||s.selected===c.lane&&(sim.holding||sim.brush));cars.get(c.id).update(c,s.time,step,servicing);}world.update(s,s.time,step);
const wide=width>=800&&width>height;const target=overview?new T.Vector3(0,.3,2):new T.Vector3(BAY_X[s.selected]+(wide?2.4:.7),.5,wide?1:1.1);focus.lerp(target,1-Math.exp(-dt*5));const wanted=overview?Math.max(48,43/(width/height)):wide?17.5:height<650?18.5:21;viewHeight+=(wanted-viewHeight)*(1-Math.exp(-dt*5));const aspect=width/height,shift=!wide&&!overview?viewHeight*aspect*.07:0;camera.left=-viewHeight*aspect/2-shift;camera.right=viewHeight*aspect/2-shift;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();camera.position.copy(focus).add(new T.Vector3(18,27,24));camera.lookAt(focus);camera.updateMatrixWorld();
effects.beam.visible=false;let spraying=false;const car=st.bays[s.selected].car;if(!frozen&&car?.state==='work'&&(sim.holding||sim.brush)){const v=cars.get(car.id),idx=sim.brush?.index??Math.floor((s.time*17)%60),to=servicePoint(v,car,idx),from=world.owner.root.localToWorld(new T.Vector3(.4,1.1,.5));effects.spray(from,to,car.phase,step,phaseFor(car).color);spraying=true;}for(let i=0;i<3;i++){const c=st.bays[i].car;if(!frozen&&c?.state==='work'&&(st.bays[i].worker||st.bays[i].level>=2)){const v=cars.get(c.id),pos=servicePoint(v,c,Math.floor((s.time*11+i*19)%60));if(Math.random()<step*25)effects.emit(pos,phaseFor(c).color,3,.7);}}
audio.spray(spraying);effects.update(step);preview.frame(s.time+now*.0001);ui.frame(dt);hudTimer-=dt;saveTimer+=step;if(hudTimer<=0){hudTimer=.12;document.body.classList.toggle('overview-mode',overview&&s.started&&!modal);ui.update();ui.labels(world,camera,width,height,overview);}if(saveTimer>3){saveTimer=0;save();}renderer.render(scene,camera);
if($('metrics')){frameTimes.push(dt);metricTimer+=dt;if(metricTimer>.5){const avg=frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length;$('metrics').textContent=`${Math.round(1/avg)} fps · ${renderer.info.render.calls} draws · ${Math.round(renderer.info.render.triangles/1000)}k tris`;metricTimer=0;frameTimes=[];}}
requestAnimationFrame(frame);}
requestAnimationFrame(frame);



