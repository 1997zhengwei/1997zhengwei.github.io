import {makeCourse} from './courses.mjs';
import {Game} from './simulation.mjs';
import {Scene} from './scene.mjs';
import {Input} from './input.mjs';
import {UI} from './ui.mjs';
import {Audio} from './audio.mjs';
import {mapProgress,nextMapStage} from './progress.mjs';
import {touchLayout} from './controls.mjs';
const params=new URLSearchParams(location.search),qaSlot=(params.get('qa')||'1').replace(/[^a-z0-9_-]/gi,'').slice(0,32);
const key='convoy-leap-v1'+(params.has('qa')?'-qa'+(qaSlot==='1'?'':'-'+qaSlot):''),defaults={runs:{},world:0,stage:0,sound:true,quality:'high',view:'first'};
let save;try{save={...defaults,...JSON.parse(localStorage.getItem(key)||'{}')};if(!save.runs||typeof save.runs!=='object')save.runs={};}catch{save={...defaults,runs:{}};}
const persist=()=>{try{localStorage.setItem(key,JSON.stringify(save));}catch{}};
let world=Math.max(0,Math.min(2,Number(save.world)||0)),stage=Math.max(0,Math.min(2,Number(save.stage)||0)),mode='menu',menuPage='maps',game=new Game(makeCourse(world,stage)),view=save.view==='third'?'third':'first',lastFrame=performance.now(),accumulator=0,lastUI=0,now=0,pausedForHelp=false;
let scene,ui,input,audio,characterReturn='maps';
function updateControls(){const touch=save.controls==='touch'||save.controls!=='desktop'&&touchLayout({width:innerWidth,maxTouchPoints:navigator.maxTouchPoints,coarse:matchMedia('(pointer:coarse)').matches,anyCoarse:matchMedia('(any-pointer:coarse)').matches});document.querySelector('#ui').dataset.controls=touch?'touch':'desktop';const button=document.querySelector('#controls-button');if(button)button.textContent=touch?'隐藏摇杆':'显示摇杆';}
function setQuality(){const low=save.quality==='low';scene.renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.65));scene.renderer.shadowMap.enabled=true;scene.sun.shadow.mapSize.set(low?1024:2048,low?1024:2048);scene.sun.shadow.map?.dispose();scene.sun.shadow.map=null;scene.finishing.setQuality(low);scene.resize();}
function prepare(newCourse=true){if(newCourse){game=new Game(makeCourse(world,stage));scene.load(game.course);}else game.reset();game.renderPrev=null;game.renderAlpha=1;input.reset();accumulator=0;save.world=world;save.stage=stage;persist();}
function showMenu(page='maps'){if(game.state==='playing')game.pause();mode='menu';menuPage=page;input.playing=false;input.clear();if(game.state!=='ready')prepare(true);if(page==='maps')ui.maps();else ui.menu(world,stage);}
function start(){if(ui.helpOpen||(mode==='menu'&&menuPage!=='routes'))return;prepare(false);mode='play';game.begin();input.playing=true;ui.hud(game.course,view);input.bindTouch(ui.root);audio.start();scene.canvas.focus({preventScroll:true});}
function retry(){if(ui.helpOpen||mode!=='play')return;start();}
function next(){if(game.state!=='won'||ui.helpOpen)return;const following=nextMapStage(save.runs,world,stage);if(following===null){showMenu();return;}stage=following;prepare(true);start();}
function pause(){if(mode!=='play'||ui.helpOpen)return;if(game.state==='playing'){game.pause();input.clear();input.playing=false;ui.overlay('paused',game);}else if(game.state==='paused')resume();}
function resume(){if(game.state==='paused'){game.resume();input.clear();input.playing=true;ui.clearOverlay();scene.canvas.focus({preventScroll:true});}}
function help(){if(ui.helpOpen)return;pausedForHelp=game.state==='playing';if(pausedForHelp){game.pause();input.clear();input.playing=false;}ui.help();}
function closeHelp(){ui.closeHelp();if(pausedForHelp&&mode==='play'&&game.state==='paused'){game.resume();input.playing=true;}pausedForHelp=false;}
function changeWorld(value){world=Number(value);stage=mapProgress(save.runs,world).nextStage;prepare(true);showMenu('routes');}
function changeStage(value){stage=Number(value);prepare(true);showMenu('routes');}
function character(){if(menuPage==='character')return;characterReturn=menuPage;menuPage='character';ui.character(characterReturn);}
function characterBack(){showMenu(characterReturn);}
function toggleView(){view=view==='first'?'third':'first';save.view=view;persist();const button=document.querySelector('#view-button');if(button)button.innerHTML=(view==='first'?'第一人称':'第三人称')+' <small>V</small>';}
const callbacks={controls:()=>{save.controls=document.querySelector('#ui').dataset.controls==='touch'?'desktop':'touch';persist();updateControls();},start,retry,next,pause,resume,help,closeHelp,character,characterBack,rotateCharacter:value=>{scene.previewAngle+=Number(value)*.65;},view:toggleView,world:changeWorld,stage:changeStage,menu:()=>showMenu(),auto:()=>{input.auto=!input.auto;const button=document.querySelector('#auto-button');button.textContent=input.auto?'前进中 · 点击停下':'连续前进';button.classList.toggle('active',input.auto);scene.canvas.focus({preventScroll:true});},recenter:()=>{input.yaw=Math.atan2((game.course.curve||0)*Math.cos(game.player.s/160)/160,1);input.pitch=-.17;},sound:()=>{save.sound=!save.sound;audio.setEnabled(save.sound);persist();for(const b of document.querySelectorAll('[data-action="sound"]'))b.textContent=save.sound?'声音 开':'声音 关';},quality:()=>{save.quality=save.quality==='low'?'high':'low';persist();setQuality();for(const b of document.querySelectorAll('[data-action="quality"]'))b.textContent=save.quality==='low'?'流畅':'高清';}};
try{
 scene=new Scene(document.querySelector('#world'));scene.load(game.course);audio=new Audio(save.sound);ui=new UI(document.querySelector('#ui'),callbacks,save);input=new Input(scene.canvas,{...callbacks,primary:()=>{if(mode==='menu')start();else if(game.state==='failed')retry();else if(game.state==='won')next();else if(game.state==='paused')resume();},blur:()=>{if(mode==='play'&&game.state==='playing'){game.pause();input.playing=false;ui.overlay('paused',game);}}});
 setQuality();updateControls();window.addEventListener('resize',updateControls);matchMedia('(any-pointer:coarse)').addEventListener('change',updateControls);ui.maps();document.querySelector('#loading').remove();
 function frame(stamp){
  const raw=Math.max(0,(stamp-lastFrame)/1000);lastFrame=stamp;const dt=Math.min(raw,.075);now+=dt;
  const controls=input.sample(dt);
  if(game.state==='playing'&&mode==='play'){
   accumulator+=Math.min(dt,.065);let count=0,jump=controls.jump;
   while(accumulator>=1/120&&count<9){const p=game.player;game.renderPrev={x:p.x,y:p.y,s:p.s};game.step(1/120,{...controls,jump});jump=false;accumulator-=1/120;count++;}
   // Preserve one-frame button presses when a render arrives before the next physics step.
   if(!count&&controls.jump)input.jumpEdge=true;
  }else accumulator=0;
  game.renderAlpha=game.state==='playing'?accumulator*120:1;
  for(const e of game.events.splice(0)){
   scene.event(e,game);audio.event(e);
   if(e.type==='land'&&e.transfer)ui.toast(e.combo>1?`漂亮换车  ×${e.combo}`:'稳稳落地 ↗',now);
   if(e.type==='fail'){input.clear();input.playing=false;ui.overlay('failed',game);}
   if(e.type==='win'){input.clear();input.playing=false;const id=`${world}-${stage}`,previous=save.runs[id];save.runs[id]={stars:Math.max(game.stars(),previous?.stars||0),time:Math.min(game.time,previous?.time||Infinity),transfers:Math.max(game.landings,previous?.transfers||0)};persist();ui.overlay('won',game);}
  }
  if(stamp-lastUI>50){ui.update(game,view,now);const stats=scene.finishing.stats||scene.renderer.info.render;if(ui.refs?.telemetry)ui.refs.telemetry.textContent+=` | ${Math.round(scene.fps)}fps · ${stats.calls} calls · ${Math.round(stats.triangles/1000)}k tris | ${input.lastKey||''}`;lastUI=stamp;}
  audio.update(game);scene.render(game,input,dt,{menu:mode==='menu',preview:mode==='menu'&&menuPage==='character',view});requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}catch(e){console.error(e);document.querySelector('#loading').innerHTML=`<strong>场景暂时没能启动</strong><small>${e.message}</small><small>请通过本地试玩服务打开，或刷新后重试。</small>`;}
