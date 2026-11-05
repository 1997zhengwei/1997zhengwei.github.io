import { createWorld } from './world.mjs';
import { icon, costText, audio } from './ui.mjs';
import { RECIPES, RESOURCE_NAMES, YIELDS, GRID, DECK, createState, restore, tide, groundHeight, floorHeight, nodeReady, nodeBlocked, needsAxe, dist, snap, harvest, craftAxe, build, validateBuild, canAfford, tileBuildings, covered, shelter, collides, movePlayer, interactBuilding, advance, rescue, currentMission as firstMission, findPath } from './rules.mjs';
import { beginDayTwo, createBoat, boardBoat, boardingApproach, disembark, landingPoint, nearestDock, dockLaunch, recallBoat, moveBoat, findBoatPath, canSail, nearbyVoyage, interactVoyage, craftWarmer, useWarmer, advanceVoyage, voyageMission, voyageTarget, salvageReady } from './voyage.mjs';
import { SALVAGE, WRECK_MOORING, WRECK } from './voyage-state.mjs';
import {beginSurvival,supplyPosition,forecast,readForecast,prepareTonight,restTomorrow,nearbySurvival,interactSurvival,advanceSurvival,survivalMission,streamResources,closestNewIsland} from './survival.mjs';
import {createSandbox,createBuildHistory,placePatch,validatePatch,createWorldLibrary,applyWorldSettings,homePosition,returnHome,visitPosition} from './sandbox.mjs';
import {isArchitect} from './world-state.mjs';
import {WEATHER_NAMES,WIND_NAMES} from './frontier-state.mjs';
const currentMission=s=>s.world?.mode==='creative'?{index:0,total:1,title:'这是你的世界了',desc:'自由搭建、拆除和重建。打开建造视角，从一块地板开始。'}:s.survival.started?survivalMission(s):s.voyage.started?voyageMission(s):firstMission(s);

const $ = id => document.getElementById(id);
const canvas = $('world');
const qa = new URLSearchParams(location.search).get('qa') === '1';
const SAVE = qa ? 'tidehaven-qa-v1' : 'tidehaven-camp-v1';
const library=createWorldLibrary(localStorage,SAVE);
let saved = null, storageOK = true;
try {
  const text=localStorage.getItem(SAVE),raw=text?JSON.parse(text):null;saved=restore(raw);
  if(saved&&raw.version===1&&!localStorage.getItem(SAVE+'-backup-before-day2'))localStorage.setItem(SAVE+'-backup-before-day2',text);
  if(saved&&raw.version<3&&!localStorage.getItem(SAVE+'-backup-before-day3'))localStorage.setItem(SAVE+'-backup-before-day3',text);
  if(saved&&raw.version<4&&!localStorage.getItem(SAVE+'-backup-before-worlds'))localStorage.setItem(SAVE+'-backup-before-worlds',text);
} catch { storageOK = false; }
let state = saved || createState(), mode = 'intro';
let world, sound = audio(), previous = performance.now(), hudTimer = 0, saveTimer = 0, toastTimer = 0;
let selected = null, held = false, holdProgress = 0, heldTarget = null, autoGather = null, path = [], destination = null;
let placement = null, panelOpen = false, gathering = false, moving = 0, pauseOnBlur = false;
let keys = new Set(), joy = { x: 0, y: 0 }, pointerStart = null, lastMission = -1, lastTide = '', failType = null, resultClick;
let floats = [], labels = [], confirmReset = false, lastAction = 0, targetStuck = 0, lastPos = null;
let missionFolded = innerWidth < 800 && innerHeight < 650;
let craftTab='camp';
let actionLatched=false;
let editorFocus=null,history=null,brushSize=1,picking=false,worldPreviousMode='playing';

function toast(message, duration = 3.4) { $('toast').textContent = message; $('toast').classList.add('show'); toastTimer = duration; }
function save() {
  if (mode === 'intro') return;
  try { library.save(state); storageOK = true; } catch { storageOK = false; }
}
function resetInput() { keys.clear(); held = false; holdProgress = 0; heldTarget = null; joy = { x: 0, y: 0 }; $('stick').style.transform = ''; autoGather = null; path = []; destination = null; if(state.voyage.boat){state.voyage.boat.vx=0;state.voyage.boat.vz=0;} }
function resetRun() {
  if(state.world)state.world.editor=false;editorFocus=null;history=null;
  const previousWorld=state.world;state=previousWorld.id==='legacy'&&previousWorld.mode==='survival'?createState():createSandbox({id:previousWorld.id,name:previousWorld.name,mode:previousWorld.mode});state.world.id=previousWorld.id;state.world.name=previousWorld.name; saved = null; mode = 'playing'; lastMission = -1; lastTide = ''; placement = null; panelOpen = false; floats.forEach(v => v.el.remove()); floats = [];
  resetInput(); $('intro').hidden = true; $('result').hidden = true; $('pause-overlay').hidden = true; $('hud').hidden = false; $('build-panel').hidden = true; $('placement').hidden = true;
  world.resetCamera(state.player); save();if(state.world.mode==='creative')enterEditor();else toast(state.survival.started?'空白世界已准备好，先给自己搭个营地吧。':'点击海滩上的漂流木，先收集 4 份木料。', 5);
}
function start() {
  $('intro').hidden = true; $('hud').hidden = false; mode = 'playing'; world.resetCamera(state.player);
  if (state.won) beginDayTwo(state);
  if(state.voyage.completed&&state.voyage.resultSeen)beginSurvival(state);
  streamResources(state);
  if(state.voyage.started){craftTab=state.survival.started?'advanced':'sea';if(innerWidth<800){missionFolded=true;document.querySelector('.mission').classList.add('folded');$('fold-mission').textContent='+';}}
  toast(saved ? state.survival.started?'新的一天。原来的营地、小艇、材料和装备都在。':state.voyage.started?'天亮了。营地和材料都在，远处的沉船露出了桅杆。':'欢迎回家。营地和材料都在。' : '点击漂流木，走近后会自动采集。', 6); save();
  if(state.voyage.completed&&!state.voyage.resultSeen)showResult('voyage');
  else if(state.survival.completed&&!state.survival.resultSeen)showResult('survival');
}
function showResult(type) {
  failType = type; resetInput(); mode = 'result'; $('result').hidden = false; $('context').classList.remove('visible');
  placement = null; panelOpen = false; $('placement').hidden = true; $('build-panel').hidden = true; world.setPreview(null);
  if (type === 'win') {
    $('result-kicker').textContent = '从一无所有，到站稳脚跟'; $('result-art').textContent = '⌂'; $('result-title').textContent = '这一次，海潮没带走家。';
    $('result-copy').textContent = '你走过浅滩，搭起屋顶，也守住了风雨里的火光。现在，这座小岛属于你了。';
    $('result-stats').innerHTML = `<span><b>${state.stats.built}</b>次建设</span><span><b>${state.stats.gathered}</b>份资源</span><span><b>${Math.floor(state.elapsed / 60)}:${String(Math.floor(state.elapsed % 60)).padStart(2, '0')}</b>安家时间</span>`;
    $('result-primary').textContent = '天亮了，开始第二天'; $('result-secondary').textContent = '换一种布局，重新上岛';
    resultClick = () => { beginDayTwo(state);craftTab='sea';lastMission=-1;mode = 'playing'; $('result').hidden = true; toast('第二天：小艇与沉船。把一格海边栈桥升级成码头，再出发探索。', 7); save(); }; sound.play('win');
    world.burst(state.player.x, DECK + 1.5, state.player.z, '#efce83', 40);
  } else if(type==='voyage'){
    $('result-kicker').textContent='第二天 · 小艇与沉船';$('result-art').textContent='≈';$('result-title').textContent='把远方，带回了家。';
    $('result-copy').textContent='你造了小艇，打捞了沉船，也用带回的零件改善了营地。下一次出发，暖意会和你同行。';
    $('result-stats').innerHTML=`<span><b>${Math.round(state.voyage.distance)}</b>米航程</span><span><b>${state.voyage.metalFound}</b>金属零件</span><span><b>${state.voyage.charges}</b>次便携取暖</span>`;
    $('result-primary').textContent='天亮了，开始第三天';$('result-secondary').textContent='换一座新岛，从头开始';
    resultClick=()=>{state.voyage.resultSeen=true;beginSurvival(state);streamResources(state);craftTab='advanced';lastMission=-1;mode='playing';$('result').hidden=true;toast('第三天：营地与风雨。先回营地，收下今天的漂流补给。',6);save();};sound.play('win');
  } else if(type==='survival'){
    $('result-kicker').textContent='第三天 · 营地与风雨';$('result-art').textContent='⌂';$('result-title').textContent='家，能守住更多的夜晚了。';
    $('result-copy').textContent='抬高的地基、迎浪的石堤、雨中的炉火，都成了营地的力量。接下来每天的天气与时长会变化，继续扩建，或坐小艇发现新的小岛。';
    $('result-stats').innerHTML=`<span><b>${state.buildings.length}</b>座营地设施</span><span><b>${Math.floor(state.survival.protectedTime)}</b>秒守住风雨</span><span><b>∞</b>继续营造</span>`;
    $('result-primary').textContent='继续营造，迎接不同的明天';$('result-secondary').textContent='从新岛重新开始';
    resultClick=()=>{state.survival.resultSeen=true;mode='playing';$('result').hidden=true;toast('工坊已开放自由营造。点任务按钮看预报，也可以休息到明天。',7);save();};sound.play('win');
  } else {
    $('result-kicker').textContent = '休整一下，营地还在'; $('result-art').textContent = '≈'; $('result-title').textContent = '海浪把你送回了高地';
    $('result-copy').textContent = state.voyage.started?'海上的寒意让你需要休整。营地、背包和小艇都会保留，小艇会重新系回码头。回营火旁暖一暖，再出发。':'温暖耗尽了。回高地缓一缓，再去搭好地板、屋顶和营火。已经建好的营地和背包材料都会保留。';
    $('result-stats').innerHTML = ''; $('result-primary').textContent = '回高地，继续建设'; $('result-secondary').textContent = '从一座新岛开始';
    resultClick = () => { rescue(state); if(state.voyage.boat)recallBoat(state);mode = 'playing'; $('result').hidden = true; world.resetCamera(); toast(state.voyage.started?'营地、材料和小艇都保留了。到火边暖一暖，再出发。':'先避开水，屋顶下的营火能让你暖起来。', 5); save(); }; sound.play('warn');
  }
  save();
}
function setPaused(value) {
  if (mode === 'intro' || mode === 'result') return;
  if (value) { resetInput(); mode = 'paused'; $('pause-overlay').hidden = false; confirmReset = false; $('restart').textContent = '重新开始'; save(); }
  else { mode = 'playing'; $('pause-overlay').hidden = true; previous = performance.now(); }
}
function openPanel() {
  if (mode !== 'playing') return;
  if(state.voyage.boat?.aboard&&!isArchitect(state)){toast('先靠岸下船，再展开工坊。');return;}
  resetInput(); placement = null; world.setPreview(null); $('placement').hidden = true;
  panelOpen = !panelOpen; $('build-panel').hidden = !panelOpen; $('context').classList.remove('visible'); renderRecipes();
}
function renderRecipes() {
  $('craft-tabs').hidden=!state.voyage.started;$('craft-camp').classList.toggle('active',craftTab==='camp');$('craft-sea').classList.toggle('active',craftTab==='sea');
  $('craft-advanced').hidden=!state.survival.started;$('craft-advanced').classList.toggle('active',craftTab==='advanced');
  $('creative').hidden=!state.survival.started;$('creative').textContent=state.survival.creative?'∞ 自由营造：开启':'自由营造：关闭';
  $('craft-decor').hidden=!state.survival.started;$('craft-decor').classList.toggle('active',craftTab==='decor');$('enter-builder').hidden=!state.survival.started||isArchitect(state);
  $('creative').disabled=isArchitect(state)||state.world.mode==='creative';
  $('recipe-list').replaceChildren();
  for (const [type, r] of Object.entries(RECIPES)) {
    if(r.day3&&!state.survival.started||r.day2&&!state.voyage.started)continue;
    if(craftTab==='decor'? !r.decor&&type!=='remove':r.decor)continue;
    if(craftTab==='advanced'?!r.day3&&type!=='remove':craftTab==='sea'?!r.day2&&type!=='remove':craftTab==='camp'&&(r.day2||r.day3))continue;
    const owned = type === 'axe' && state.axe || type==='boat'&&Boolean(state.voyage.boat)||type==='warmer'&&state.voyage.warmer;
    const locked = r.requires && !state[r.requires]?'需石斧':type==='boat'&&!nearestDock(state)?'需码头':type==='warmer'&&!state.buildings.some(b=>b.type==='workbench')?'需工作台':'';
    const b = document.createElement('button'); b.className = `recipe${owned ? ' owned' : ''}`; b.dataset.recipe = type;
    b.innerHTML = `${icon(type)}<b>${r.name}</b>${locked ? `<span class="locked">${locked}</span>` : ''}<span class="cost">${owned ? type==='boat'?'已系泊':'已装备' : costText(r.cost)}</span><span class="effect">${r.effect}</span>`;
    b.setAttribute('aria-label', `${r.name}，${owned ? '已装备' : costText(r.cost)}，${r.effect}`);
    b.disabled = owned; b.addEventListener('click', () => selectRecipe(type)); $('recipe-list').append(b);
  }
}
function selectRecipe(type) {
  picking=false;
  if(['boat','warmer'].includes(type)){
    const res=type==='boat'?createBoat(state):craftWarmer(state);toast(res.message,6);
    if(res.ok){sound.play('build');panelOpen=false;$('build-panel').hidden=true;save();}else renderRecipes();return;
  }
  if (type === 'axe') { const res = craftAxe(state); toast(res.message, 5); if (res.ok) { sound.play('build'); world.burst(state.player.x, floorHeight(state, state.player.x, state.player.z) + 1, state.player.z); save(); } renderRecipes(); return; }
  const r = RECIPES[type];
  if (r.requires && !state[r.requires]) { toast('先制作石斧，就能解锁栈桥。'); return; }
  panelOpen = false; $('build-panel').hidden = true; $('placement').hidden = false;
  if(isArchitect(state)){placement={type,x:snap(editorFocus.x),z:snap(editorFocus.z),rotation:0};updatePlacement();return;}
  let x = snap(state.player.x), z = snap(state.player.z);
  // First construction offers a clear home site; later pieces begin in front of the player.
  if (type === 'platform' && !state.milestones.deck && dist(state.player, { x: -2.2, z: 2.2 }) < 6) { x = -2.2; z = 2.2; }
  if (['cabin', 'brace', 'fire', 'remove'].includes(type)) {
    const candidate = state.buildings.filter(b => type === 'brace' ? b.type === 'cabin' && !b.braced : type === 'remove' ? true : b.type === 'platform' && (type !== 'cabin' || !tileBuildings(state, b.x, b.z).some(v => ['cabin', 'net'].includes(v.type))));
    candidate.sort((a, b) => dist(state.player, a) - dist(state.player, b));
    if (candidate.length && dist(state.player, candidate[0]) < 6.7) { x = candidate[0].x; z = candidate[0].z; }
  }
  let rotation=0;
  if(type==='dock'){
    const options=[];
    for(const b of state.buildings.filter(b=>['platform','bridge'].includes(b.type)))for(let r=0;r<4;r++){
      if(validateBuild(state,'dock',b.x,b.z,{range:false,materials:false,rotation:r}).ok)options.push({x:b.x,z:b.z,rotation:r,score:groundHeight(b.x,b.z)+dist(state.player,b)*.025});
    }
    options.sort((a,b)=>a.score-b.score);const candidate=options.find(b=>dist(state.player,b)<6.7)||options[0];
    if(candidate){x=candidate.x;z=candidate.z;rotation=candidate.rotation;}
  }
  if(type==='workbench'){
    const home=state.buildings.find(b=>b.type==='cabin')||state.player,options=[];
    for(const [dx,dz]of [[GRID,0],[-GRID,0],[0,GRID],[0,-GRID],[GRID,GRID],[-GRID,-GRID]]){
      const p={x:snap(home.x+dx),z:snap(home.z+dz)};if(validateBuild(state,'workbench',p.x,p.z,{range:false,materials:false}).ok)options.push(p);
    }
    options.sort((a,b)=>dist(state.player,a)-dist(state.player,b));if(options[0]){x=options[0].x;z=options[0].z;}
  }
  if (type === 'bridge') {
    const bx = [6.6, 8.8, 11].find(v => !state.buildings.some(b => Math.abs(b.x - v) < .1 && Math.abs(b.z + 2.2) < .1));
    if (bx && dist(state.player, { x: bx, z: -2.2 }) < 6.7) { x = bx; z = -2.2; }
  }
  if(type==='highdeck'){
    const home=state.buildings.find(b=>b.type==='cabin'),floors=state.buildings.filter(b=>['platform','bridge'].includes(b.type)&&!b.raised&&!tileBuildings(state,b.x,b.z).some(v=>v.type==='dock'));
    floors.sort((a,b)=>(home?dist(a,home)-dist(b,home):dist(a,state.player)-dist(b,state.player)));if(floors[0]){x=floors[0].x;z=floors[0].z;}
  }
  const oldFire=type==='stove'?state.buildings.filter(b=>b.type==='fire').sort((a,b)=>dist(a,state.player)-dist(b,state.player))[0]:null;
  if(oldFire&&dist(oldFire,state.player)<=6.7){x=oldFire.x;z=oldFire.z;}
  if(RECIPES[type].day3&&type!=='highdeck'&&!oldFire){
    const home=state.buildings.find(b=>b.type==='cabin')||state.player,options=[];
    rotation=['seawall','windbreak'].includes(type)?state.survival.plan.wind:0;
    const a=rotation*Math.PI/2,ideal={x:home.x+Math.sin(a)*GRID,z:home.z+Math.cos(a)*GRID};
    for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
      const p={x:snap(home.x+dx*GRID),z:snap(home.z+dz*GRID)};
      if(dist(state.player,p)<=6.7&&validateBuild(state,type,p.x,p.z,{range:false,materials:false,rotation}).ok)options.push(p);
    }
    options.sort((a,b)=>['seawall','windbreak'].includes(type)?dist(a,ideal)-dist(b,ideal):dist(a,state.player)-dist(b,state.player));
    if(options[0]){x=options[0].x;z=options[0].z;}
  }
  placement = { type, x, z, rotation }; updatePlacement();
}
function updatePlacement() {
  if (!placement) return;
  const { type, x, z, rotation } = placement, res = isArchitect(state)?validatePatch(state,type,x,z,rotation,brushSize):validateBuild(state,type,x,z,{rotation});
  $('placement-title').textContent = `${RECIPES[type].name} · ${state.survival.creative?'∞ 自由营造':costText(RECIPES[type].cost)}${['seawall','windbreak'].includes(type)?' · 箭头朝'+WIND_NAMES[rotation]:''}`;
  $('placement-info').textContent = res.message; $('placement-info').style.color = res.ok ? '#57836b' : '#b07750';
  $('confirm-build').disabled = !res.ok; $('confirm-build').textContent = type === 'remove' ? '拆除并返还' : type === 'brace' ? '加固这间小屋' : '建在这里';
  $('rotate-build').disabled = ['remove', 'brace', 'fire'].includes(type);
  $('brush-options').hidden=!isArchitect(state)||!['platform','bridge'].includes(type);
  $('brush-one').classList.toggle('active',brushSize===1);$('brush-nine').classList.toggle('active',brushSize===3);
  if(isArchitect(state)&&['platform','bridge'].includes(type)&&brushSize===3)$('placement-title').textContent+=' · 3 × 3';
  world.setPreview(type, x, z, rotation, res.ok, state,brushSize);
}
function cancelPlacement() { placement = null; $('placement').hidden = true; world.setPreview(null); resetInput(); }
function place() {
  if (!placement || mode !== 'playing') return;
  const { type, x, z, rotation } = placement, res = isArchitect(state)?history.run(()=>placePatch(state,type,x,z,rotation,brushSize)):build(state, type, x, z, rotation);
  if (!res.ok) { toast(res.message); return; }
  world.burst(x, DECK + .2, z, type === 'remove' ? '#cbbd98' : '#f0d08e', 20); sound.play('build'); toast(res.message);
  if(isArchitect(state)){if(['platform','bridge'].includes(type))placement.x+=GRID*brushSize;updatePlacement();save();return;}
  // Keep floors and bridges selected for rapid connected construction.
  if (['platform', 'bridge'].includes(type)) {
    if (type === 'bridge') placement.x += GRID;
    else { cancelPlacement(); }
  } else cancelPlacement();
  updatePlacement(); save();
}
function rotatePlacement() { if (placement) { placement.rotation = (placement.rotation + 1) % 4; updatePlacement(); } }

function floatGain(amounts, x, y, z) {
  const el = document.createElement('div'); el.className = 'world-label float';
  el.innerHTML = `<span>${Object.entries(amounts).filter(([, v]) => v).map(([k, v]) => `+${v} ${ { wood: '木料', stone: '石头', fiber: '纤维',metal:'金属' }[k] }`).join('　')}</span>`;
  $('world-labels').append(el); floats.push({ el, x, y, z, age: 0 });
}
function getNearest() {
  const candidates = state.voyage.boat?.aboard?[]:state.nodes.filter(n => nodeReady(state, n) && !nodeBlocked(state, n) && dist(state.player, n) < 2.05).map(n => ({ ...n, kind: 'node' }));
  if(!state.voyage.boat?.aboard)for (const b of state.buildings) if (dist(state.player, b) < 2.1 && (b.type === 'net' || ['fire','stove'].includes(b.type) && (!b.lit||state.voyage.warmer&&state.voyage.charges<3))) candidates.push({ ...b, kind: 'building' });
  candidates.push(...nearbySurvival(state),...nearbyVoyage(state));
  candidates.sort((a, b) => (a.kind==='node'?1:0)-(b.kind==='node'?1:0)||dist(state.player, a) - dist(state.player, b));
  if (autoGather) { const auto = candidates.find(n => n.id === autoGather); if (auto) return auto; }
  return candidates[0] || null;
}
function moveTo(point, nodeId = null, precise = false) {
  if (!point) return;
  let goal = { x: point.x, z: point.z };
  if (nodeId) {
    const n = state.nodes.find(n => n.id === nodeId); if (!n || !nodeReady(state, n)) return;
    let options = [];
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, p = { x: n.x + Math.cos(a) * 1.05, z: n.z + Math.sin(a) * 1.05 }; if (!collides(state, p.x, p.z)) options.push(p); }
    options.sort((a, b) => dist(state.player, a) - dist(state.player, b)); goal = options[0] || n;
    if (needsAxe(n) && !state.axe) { toast(n.type === 'tree' ? '这棵树需要石斧。先捡海滩上的漂流木。' : '带上石斧，再来开采矿石。'); return; }
  }
  const result = findPath(state, goal);
  if (!result.reachable && result.points.length < 2) { toast('还过不去，先接上栈桥，或换一条路。'); return; }
  path = result.points; destination = goal; autoGather = nodeId; targetStuck = 0; lastPos = null;
  if(precise&&result.reachable&&!collides(state,goal.x,goal.z))path.push(goal);
  if (!result.reachable) { autoGather = null; toast('先走到岸边。搭好桥，就能继续向前。'); }
}
function boatNavigate(point,id=null){
  const result=findBoatPath(state,point);path=result.points;destination=point;autoGather=id;targetStuck=0;
  if(!result.reachable){autoGather=null;toast('这片浅水暂时过不去，沿外海绕行，或换个靠岸点。',5);}
}
function goBoat(){
  const b=state.voyage.boat;if(!b){toast('先到码头旁，在工坊造一艘小艇。');return;}
  if(b.aboard){boatNavigate(WRECK_MOORING);return;}
  if(dist(state.player,b)<3.45){applyInteraction(boardBoat(state));return;}
  const approach=boardingApproach(state);
  if(approach){moveTo(approach,null,true);autoGather='boat';return;}
  if(dist(state.player,WRECK)<7){toast('沿甲板走近小艇，再点击船或长按上船。',5);return;}
  let dock=nearestDock(state,b);
  if(!dock||dist(b,dock)>5){const res=recallBoat(state);if(!res.ok){toast(res.message);return;}dock=nearestDock(state);toast(res.message);}
  moveTo(dock||b,null,true);autoGather='boat';
}
function homeTarget(){return state.buildings.find(b=>b.type==='cabin')||{x:0,z:2.2};}
function survivalTarget(item){
  if(item.kind==='supply'){moveTo(item);autoGather='survival:supply';return;}
  moveTo(item);autoGather=item.id;
}
function goSurvival(){
  const v=state.survival,m=survivalMission(state),home=homeTarget();
  if(state.world.mode==='creative'){openWorlds();return;}
  if(v.completed){showForecast();return;}
  if(state.voyage.boat?.aboard){boatNavigate(dockLaunch(nearestDock(state)||{...home,rotation:0}));toast('先返航营地，靠岸下船后继续准备。');return;}
  if(m.index===0){survivalTarget({...supplyPosition(state),kind:'supply'});return;}
  if(dist(state.player,home)>6){moveTo(home);return;}
  if(m.index===2){const b=state.buildings.find(b=>b.type==='station');if(b&&dist(state.player,b)<2.4){applyInteraction(readForecast(state));}else if(b)survivalTarget({...b,id:`forecast:${b.id}`,kind:'forecast'});return;}
  if(m.index===6){const res=prepareTonight(state);toast(res.message,6);moveTo(home);save();return;}
  selectRecipe(({1:'station',3:'highdeck',4:'seawall',5:'stove'})[m.index]);
}
function showForecast(){
  const f=forecast(state),fmt=p=>`${Math.floor(p.duration/60)} 分 ${p.duration%60} 秒`;
  resetInput();mode='forecast';$('forecast-overlay').hidden=false;
  $('forecast-today').textContent=`第 ${state.survival.day} 天 · ${f.kind} · ${f.wind}`;
  $('forecast-detail').textContent=`今天 ${fmt(f.today)}，准备 ${f.today.prepare} 秒、预警 ${f.today.warning} 秒、挑战 ${f.today.challenge} 秒。${f.hint}`;
  $('forecast-next').textContent=`明天：${WEATHER_NAMES[f.next.kind]} · ${WIND_NAMES[f.next.wind]} · ${fmt(f.next)}`;
  $('forecast-tonight').disabled=state.survival.clock>=f.today.prepare+f.today.warning;
  $('forecast-rest').disabled=!state.survival.dayRewarded&&tide(state).phase!=='rest';
  save();
}
function closeForecast(){mode='playing';$('forecast-overlay').hidden=true;previous=performance.now();}
function goVoyage(){
  if(state.survival.started&&mode==='playing'&&!placement&&!panelOpen){goSurvival();return;}
  if(mode!=='playing'||placement||panelOpen||!state.voyage.started)return;
  const m=voyageMission(state),aboard=state.voyage.boat?.aboard,target=voyageTarget(state);
  if(m.index===0){if(dist(state.player,target)<5)selectRecipe('dock');else moveTo(target);}
  else if(m.index===1){if(dist(state.player,target)<4.5)selectRecipe('boat');else moveTo(target);}
  else if(m.index===2)goBoat();
  else if(m.index===3||m.index>=7){if(aboard)boatNavigate(WRECK_MOORING);else goBoat();}
  else if(m.index===4){if(aboard)boatNavigate(target);else goBoat();}
  else if(m.index===5){if(dist(state.player,target)<7)selectRecipe('workbench');else moveTo(target);}
  else if(m.index===6){if(dist(state.player,target)<3.2)selectRecipe('warmer');else moveTo(target);}
}
function applyInteraction(res){
  toast(res.message||'完成了。',5);
  if(res.ok){if(res.mode)resetInput();if(res.mode==='forecast')showForecast();sound.play('collect');save();}
}
function centerAction(){
  if(isArchitect(state)){openPanel();return;}
  if(!state.voyage.boat?.aboard){openPanel();return;}
  if(landingPoint(state))applyInteraction(disembark(state));
  else {const dock=nearestDock(state);if(dock){boatNavigate(dockLaunch(dock));toast('航向自己的码头。靠近后点“靠岸下船”。',5);}else toast('靠近陆地或沉船甲板，就能下船。');}
}
function warmUp(){if(mode==='playing'&&!placement&&!panelOpen)applyInteraction(useWarmer(state));}
function gather(dt) {
  gathering = false;
  if (mode !== 'playing' || panelOpen || placement || isArchitect(state)) { holdProgress = 0; return; }
  selected = getNearest();
  if(held&&actionLatched&&!autoGather){holdProgress=0;return;}
  if (!(held || autoGather && selected?.id === autoGather) || !selected || moving > .1) { holdProgress = 0; heldTarget = null; return; }
  if (selected.kind === 'node' && needsAxe(selected) && !state.axe) { if (!heldTarget) toast('需要先制作石斧。'); heldTarget = selected.id; holdProgress = 0; return; }
  if (heldTarget !== selected.id) { heldTarget = selected.id; holdProgress = 0; }
  gathering = true;if(!state.voyage.boat?.aboard)state.player.angle = Math.atan2(selected.x - state.player.x, selected.z - state.player.z);
  holdProgress += dt / (selected.kind === 'salvage'?1.1:selected.kind !== 'node' ? .45 : state.axe ? .44 : .68);
  if (holdProgress < 1) return;
  const item=selected;
  const res = item.kind === 'building' ? interactBuilding(state, item.id) : item.kind==='node'?harvest(state, item.id):['supply','repair','forecast','production'].includes(item.kind)?interactSurvival(state,item):interactVoyage(state,item);
  if (res.ok) {
    if (res.amounts) floatGain(res.amounts, item.x, Math.max(tide(state).water,floorHeight(state, item.x, item.z)) + 1, item.z);
    world.burst(item.x, Math.max(tide(state).water,floorHeight(state, item.x, item.z)) + .4, item.z, item.type === 'stone' || item.type === 'ore' ? '#cfddc9' : '#f0cf91', 10);
    if(res.mode)resetInput();if(res.mode==='forecast')showForecast();
    if(item.kind!=='node')actionLatched=true;
    sound.play(); save(); if (res.message) toast(res.message);
  } else toast(res.message);
  if (autoGather === item.id) autoGather = null;
  holdProgress = 0; selected = null;
}
function updateMovement(dt) {
  moving = 0;
  if (mode !== 'playing' || panelOpen) return;
  if(autoGather==='boat'&&!path.length&&!state.voyage.boat?.aboard&&state.voyage.boat&&dist(state.player,state.voyage.boat)>3.45){
    autoGather=null;const p=boardingApproach(state);if(p){moveTo(p,null,true);autoGather='boat';}
  }
  const v = world.cameraBasis();
  if(isArchitect(state)){
    const h=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x,f=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-joy.y;
    const n=Math.max(1,Math.hypot(h,f));editorFocus.x+=(v.right.x*h+v.forward.x*f)/n*10*dt;editorFocus.z+=(v.right.z*h+v.forward.z*f)/n*10*dt;return;
  }
  let horizontal = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + joy.x;
  let vertical = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - joy.y;
  let dx = v.right.x * horizontal + v.forward.x * vertical, dz = v.right.z * horizontal + v.forward.z * vertical;
  if (Math.abs(horizontal) + Math.abs(vertical) > .06) { autoGather = null; path = []; destination = null; }
  else if (path.length) {
    const point = path[0], d = dist(state.player, point);
    if (d < (state.voyage.boat?.aboard ? .35 : .16)) path.shift();
    else { dx = (point.x - state.player.x) / d; dz = (point.z - state.player.z) / d; }
    if (!path.length) { destination = null; }
  }
  const length = Math.hypot(dx, dz);
  if(state.voyage.boat?.aboard){
    const traveled=moveBoat(state,dx,dz,dt);moving=traveled>dt*.3?1:0;
    if(path.length&&!moving&&length>.1){targetStuck+=dt;if(targetStuck>1){path=[];destination=null;autoGather=null;toast('前面是浅滩或建筑，沿外海绕开。',4);targetStuck=0;}}else targetStuck=0;
    return;
  }
  if (length > .05) {
    const speed = placement ? 2.5 : 3.7, factor = Math.min(1, length) / length;
    const ox = state.player.x, oz = state.player.z;
    movePlayer(state, dx * factor * speed * dt, dz * factor * speed * dt);
    moving = Math.hypot(state.player.x - ox, state.player.z - oz) > dt * .3 ? 1 : 0;
    state.player.angle = Math.atan2(dx, dz);
    if (path.length && !moving) { targetStuck += dt; if (targetStuck > 1.3) { path = []; destination = null; autoGather = null; toast('这里有障碍，换个位置走过去。'); targetStuck = 0; } } else targetStuck = 0;
  }
}
function renderLabels(dt) {
  labels.forEach(el => el.remove()); labels = [];
  const missionRect = document.querySelector('.mission').getBoundingClientRect();
  function label(x, y, z, text, cls = '', data = {}) {
    const p = world.screen(x, y, z); if (!p.visible || p.y < 170 || p.y > innerHeight - 130) return;
    if (p.x < missionRect.right + 45 && p.y < missionRect.bottom + 26) return;
    const el = document.createElement('div'); el.className = `world-label ${cls}`; el.style.left = `${p.x}px`; el.style.top = `${p.y}px`; el.innerHTML = `<span>${text}</span>`;
    for (const [k, v] of Object.entries(data)) el.dataset[k] = v;
    $('world-labels').append(el); labels.push(el);
  }
  if (mode !== 'intro' && !panelOpen && !placement && !isArchitect(state)) {
    const near = state.nodes.filter(n => nodeReady(state, n) && !nodeBlocked(state, n) && dist(state.player, n) < 6.2 && (!needsAxe(n) || state.axe));
    near.sort((a, b) => dist(state.player, a) - dist(state.player, b));
    for (const n of near.slice(0, 3)) label(n.x, Math.max(groundHeight(n.x, n.z), tide(state).water) + (n.type === 'tree' ? 2.4 : .8), n.z, `${RESOURCE_NAMES[n.type]}${needsAxe(n) ? ' · 石斧' : ''}`, `resource${selected?.id === n.id ? ' selected' : ''}`, { nodeId: n.id });
    if (!state.visitedReef) label(13.3, 1.8, -3.5, '礁岛 · 稀有矿石', 'discovery', { landmark: 'reef' });
    if (!state.milestones.deck) label(-2.2, 1, 2.2, '在喜欢的位置搭个家', 'discovery', { landmark: 'home' });
    for (const b of state.buildings) if (b.type === 'net' && b.stored > 0) label(b.x, floorHeight(state, b.x, b.z) + 1.7, b.z, `收集网 · ${b.stored} 木料`, 'resource', { buildingId: b.id });
    if(state.survival.started){
      let damageLabels=0;
      const p=supplyPosition(state);if(state.survival.supplyDay!==state.survival.day)label(p.x,groundHeight(p.x,p.z)+1,p.z,'今日漂流补给','discovery',{survivalId:'supply'});
      for(const b of state.buildings)if(dist(state.player,b)<9){
        if(b.type==='station')label(b.x,floorHeight(state,b.x,b.z)+2.5,b.z,'气象台 · 今晚预报','resource',{survivalId:`forecast:${b.id}`});
        if(b.stock&&Object.values(b.stock).some(v=>v>0))label(b.x,floorHeight(state,b.x,b.z)+1.7,b.z,RECIPES[b.type].name+' · 可收取','resource',{survivalId:`produce:${b.id}`});
        if((b.hp??100)<90&&damageLabels++<2)label(b.x,floorHeight(state,b.x,b.z)+1.4,b.z,`修缮 · ${Math.ceil(b.hp)}%`,'resource',{survivalId:`repair:${b.id}`});
      }
    }
    if(state.voyage.started){
      const b=state.voyage.boat;if(b&&!b.aboard)label(b.x,tide(state).water+1.0,b.z,'双桨小艇 · 点击上船','discovery',{voyageId:'boat'});
      for(const p of SALVAGE)if(dist(state.player,p)<12&&salvageReady(state,p))label(p.x,Math.max(tide(state).water+.9,.9),p.z,p.lowOnly?(tide(state).water>.24?'船舱 · 等低潮':'低潮船舱 · 旧船灯'):p.name+' · 金属','resource',{voyageId:`salvage:${p.id}`});
      if(dist(state.player,WRECK)<20)label(WRECK.x,4.6,WRECK.z,'近海沉船','discovery',{landmark:'wreck'});
      for(const d of state.buildings)if(d.type==='dock')label(d.x,DECK+1.1,d.z,'我的码头','discovery',{buildingId:d.id});
    }
  }
  if (placement) {
    const p = placement; label(p.x, DECK + 1, p.z, `选址 ${Math.round(p.x / GRID)}, ${Math.round(p.z / GRID)}`, 'discovery', { landmark: 'placement' });
  }
  floats = floats.filter(f => {
    f.age += dt; if (f.age > 1.65) { f.el.remove(); return false; }
    const p = world.screen(f.x, f.y + f.age * .6, f.z); f.el.style.left = `${p.x}px`; f.el.style.top = `${p.y}px`; f.el.style.opacity = Math.min(1, (1.65 - f.age) * 2); return true;
  });
}
function updateHud() {
  const t = tide(state), env = shelter(state), mission = currentMission(state);
  for (const k of ['wood', 'stone', 'fiber']) $('res-' + k).innerHTML = `${icon(k)}<b>${state.survival.creative?'∞':state.inventory[k]}</b>`;
  const v=state.voyage,aboard=Boolean(v.boat?.aboard);
  document.body.classList.toggle('voyaging',v.started);
  $('res-metal').hidden=!v.started;$('res-metal').innerHTML=`${icon('metal')}<b>${state.survival.creative?'∞':state.inventory.metal}</b>`;
  $('axe-status').innerHTML = icon('axe'); $('axe-status').classList.toggle('owned', state.axe); $('axe-status').title = state.axe ? '石斧已装备' : '尚未制作石斧';
  $('weather').textContent = t.name;
  const seconds = Math.ceil(t.remaining);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  $('countdown').textContent = state.survival.started?`${{prepare:'准备',warning:'预警',challenge:'挑战',rest:'休整'}[t.phase]} ${time} · 今日 ${state.survival.plan.duration} 秒`:v.started?`${t.water<=.24?'低潮窗口':'退潮前'} ${time}`:t.stage === 'peace' ? '营地已站稳脚跟' : t.stage === 'low' || t.stage === 'rising' ? `涨潮前 ${time}` : t.stage === 'storm' ? `风雨 ${time}` : `退潮 ${time}`;
  if (panelOpen || placement || isArchitect(state)) $('countdown').textContent = '工坊中 · 潮汐暂停';
  if(state.world.frozen&&!panelOpen&&!placement&&!isArchitect(state))$('countdown').textContent='时间停住了 · 世界设置可恢复';
  $('tide-fill').style.width = `${Math.max(3, t.progress * 100)}%`; $('day').textContent = `第 ${state.survival.started?state.survival.day:state.day} 天`;
  $('warmth-fill').style.width = `${state.warmth}%`; $('warmth-value').textContent = Math.ceil(state.warmth); document.body.classList.toggle('danger', state.warmth < 35);
  $('shelter-status').textContent = aboard?'海风渐冷 · 暖包可取暖':env.flooded ? '涉水失温 · 返回高处' : env.cozy ? env.braced ? '挡风小屋 · 温暖恢复' : '屋顶 + 营火 · 温暖恢复' : env.roof ? '屋顶挡雨 · 还需要营火' : env.fire ? '火光在身边' : t.rain > .2 ? '正在淋雨 · 找屋顶' : '海风轻轻吹';
  $('mission-index').textContent = state.survival.started?`${Math.min(mission.total,mission.index+1)} / ${mission.total}`:v.started?mission.index<7?`${String(mission.index+1).padStart(2,'0')} / 07`:'探索 / 继续':mission.index >= 7 ? '安家 / 继续' : `${String(mission.index + 1).padStart(2, '0')} / 07`;
  $('chapter-name').textContent=state.world.mode==='creative'?state.world.name:state.survival.started?'营地与多变天气':v.started?'第二天 · 航海手记':'小岛手记';
  $('mission-title').textContent = mission.title; $('mission-desc').textContent = mission.desc;
  $('invite-storm').hidden = v.started||mission.index !== 7 || t.stage === 'storm' || t.stage === 'peace';
  $('invite-storm').disabled = !env.cozy;
  $('invite-storm').textContent = env.cozy ? '准备好了，提前迎潮' : '回屋烤火后，可提前迎潮';
  $('mission-dots').innerHTML = Array.from({ length: mission.total||7 }, (_, i) => `<i class="${i < mission.index ? 'done' : i === mission.index ? 'active' : ''}"></i>`).join('');
  $('voyage-go').hidden=!v.started;$('voyage-bearing').hidden=!v.started;
  if(v.started&&!state.survival.started){
    const names=['前往栈桥，升级码头','到码头旁，建造小艇','走近小艇，准备出发',aboard?'沿航标前往沉船':'走近小艇，继续出海',aboard?'返航自己的码头':'回到小艇，驶向码头','在营地安放工作台','到工作台制作暖包','再次出海，继续探索'];
    $('voyage-go').textContent=names[Math.min(7,mission.index)];
    const p=voyageTarget(state),d=Math.round(dist(state.player,p)),sp=world.screen(p.x,1,p.z);
    const a=Math.atan2(sp.y-innerHeight*.5,sp.x-innerWidth*.5),arrows=['→','↘','↓','↙','←','↖','↑','↗'],arrow=arrows[(Math.round(a/(Math.PI/4))+8)%8];
    $('voyage-bearing').textContent=`${arrow} ${mission.index===3||mission.index>=7?'沉船方向':'当前目标'} · ${d} 米${mission.index===3?` · 金属 ${Math.min(4,v.metalFound)}/4`:''}`;
  }
  if(state.survival.started){
    $('voyage-go').textContent=state.world.mode==='creative'?'我的世界 / 建造设置':aboard?'返航营地，继续准备':state.survival.completed?'查看预报 / 休息到明天':['走近补给箱，收取材料','布置气象台','查看今晚的预报','抬高家的地基','迎风布置石堤','布置防雨火炉','准备好了，提前迎接今晚'][mission.index];
    $('voyage-bearing').textContent=`${WIND_NAMES[t.wind]} · ${env.protection.wave?'石堤挡浪':env.protection.wind?'背风保护':'留意来风'}${env.protection.lamp?' · 灯塔照明':''}${state.survival.protectedTime>0?' · 守住 '+Math.floor(state.survival.protectedTime)+'/16 秒':''}`;
  }
  $('warmer').hidden=!v.warmer;$('warmer').innerHTML=`取暖 <span>${v.charges}</span><kbd>F</kbd>`;$('warmer').disabled=v.charges<=0||v.warmCooldown>0;
  $('recall-boat').hidden=!v.boat||aboard;
  $('build-menu').innerHTML=aboard?(landingPoint(state)?'<span>⚓</span> 靠岸下船':'<span>≈</span> 返航码头'):'<span>⌂</span> 制作 / 建造 <kbd>B</kbd>';
  $('move-hint').textContent=aboard?'点击水面划行 · 长按打捞 / 下船':'点击地面前往 · 点击资源采集';
  if (lastMission >= 0 && mission.index > lastMission && mode === 'playing') { toast(mission.title, 4); sound.play('build'); }
  lastMission = mission.index;
  if (lastTide && lastTide !== t.stage && mode === 'playing' && !state.free) {
    if (t.stage === 'rising') toast('潮水开始上涨了。把地板、屋顶和营火准备好。', 5);
    if (t.stage === 'storm') { toast('风雨来了！回到小屋，守住火光。', 5); sound.play('warn'); }
    if (t.stage === 'falling') toast('潮水退了。可以继续采集、完善营地。', 4);
  }
  lastTide = t.stage;
  $('save-status').textContent = !storageOK ? '浏览器未允许保存 · 本局仍可游玩' : qa ? `试玩检查 · ${state.player.x.toFixed(1)}, ${state.player.z.toFixed(1)} · 本地独立存档` : `${state.world.name} · 本地自动保存`;
  document.body.classList.toggle('architect',isArchitect(state));$('editor-bar').hidden=!isArchitect(state);
  if(isArchitect(state)){$('undo-build').disabled=!history?.undoCount;$('redo-build').disabled=!history?.redoCount;$('pick-template').classList.toggle('active',picking);$('editor-position').textContent=`建造视角 · ${editorFocus.x.toFixed(1)}, ${editorFocus.z.toFixed(1)} · 拖动画面 / 摇杆移镜头`; }
  const target = mode === 'playing' && !panelOpen && !placement && !isArchitect(state) ? getNearest() : null;
  selected = target;
  $('context').classList.toggle('visible', Boolean(target) && toastTimer <= 0);
  $('toast').style.visibility = placement || panelOpen ? 'hidden' : 'visible';
  if (target) {
    $('context-name').textContent = target.name|| (target.kind === 'building' ? target.type === 'net' ? '收集网' : target.lit?`${target.type==='stove'?'防雨火炉':'营火'} · 补充暖包`:`熄灭的${target.type==='stove'?'火炉':'营火'}` : RESOURCE_NAMES[target.type]);
    $('context-hint').textContent = target.hint||(target.kind === 'building' ? target.type === 'net' ? `长按收取 · 已收集 ${target.stored || 0} / 8 木料` : target.lit?'长按补满暖包 · 1 木料':'长按重新点火' : needsAxe(target) && !state.axe ? '先在工坊制作石斧' : `长按 E / 采集 · ${costText(YIELDS[target.type])}`);
  }
  $('action-text').textContent = target?.action||(target?.type === 'net' ? '收取' : ['fire','stove'].includes(target?.type) ? target.lit?'补充':'点火' : aboard?'打捞':'采集');
  $('action-symbol').textContent = target ? '✦' : '·';
  $('action').style.opacity = target ? '1' : '.65';
  $('action-progress').style.strokeDashoffset = `${226.2 * (1 - Math.min(1, holdProgress))}`;
  if (placement) updatePlacement();
}
function tick(now) {
  const dt = Math.min(.05, Math.max(0, (now - previous) / 1000)); previous = now;
  if (!document.hidden) {
    if (mode === 'playing') {
      updateMovement(dt); gather(dt);
      if (!placement && !panelOpen && !isArchitect(state)) {
        const events = [...advance(state, dt),...advanceVoyage(state,dt),...advanceSurvival(state,dt)];
        for (const event of events) {
          if (event === 'rescue') { showResult('rescue'); break; }
          if (event === 'win') { showResult('win'); break; }
          if(event==='survival-win'){showResult('survival');break;}
          if(event==='day-reward')toast('今晚的防护奏效了！获得扩建材料，随时继续营造。',6);
          if(event==='endless-new-day')toast(`第 ${state.survival.day} 天：${state.world.calm?'晴朗营造':WEATHER_NAMES[state.survival.plan.kind]}，今天 ${state.survival.plan.duration} 秒。`,7);
          if (event === 'voyage-win') { showResult('voyage'); break; }
          if (event === 'new-day' && !state.won) toast('新的一天。营地还在，下一场风雨前继续准备。', 5);
          if (event === 'fire-out') toast(state.survival.started?'低处的火光熄灭了。抬高地基、布置石堤，或用屋顶挡雨。':'露天营火被浇灭了，把火移到屋顶下。', 4);
        }
      }
      saveTimer += dt; if (saveTimer > 3) { save(); saveTimer = 0; }
    } else moving = 0;
    if(isArchitect(state))streamResources(state,editorFocus);
    world.update(state, dt, { selected, gathering, moving, destination, intro: mode === 'intro',editor:isArchitect(state)?editorFocus:null });
    hudTimer += dt; if (hudTimer >= .1) { updateHud(); hudTimer = 0; }
    renderLabels(dt);
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('show'); }
  }
  requestAnimationFrame(tick);
}

// Canvas gestures are disjoint from the native UI buttons and joystick.
canvas.addEventListener('pointerdown', e => { if (mode !== 'playing' || panelOpen) return; pointerStart = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', e => {
  if (!pointerStart || mode !== 'playing') return;
  const distance = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y); pointerStart = null; if (distance > 12) return;
  const hit = world.pick(e.clientX, e.clientY); if (!hit.point) return;
  if(isArchitect(state)&&picking){const b=state.buildings.find(b=>b.id===hit.buildingId);if(b){picking=false;brushSize=1;selectRecipe(b.type);placement.rotation=b.rotation;placement.x=b.x+GRID;placement.z=b.z;updatePlacement();toast('已吸取 '+RECIPES[b.type].name+'，点击空地继续放置。');}return;}
  if (placement) { placement.x = snap(hit.point.x); placement.z = snap(hit.point.z); updatePlacement(); return; }
  if(isArchitect(state))return;
  if(state.survival.started&&hit.survivalId){
    const id=hit.survivalId;if(id==='supply')survivalTarget({...supplyPosition(state),kind:'supply'});
    else {const target=nearbySurvival(state).find(v=>v.id===id);if(target)applyInteraction(interactSurvival(state,target));else {const b=state.buildings.find(v=>v.id===Number(id.split(':')[1]));if(b)survivalTarget({...b,id,kind:id.startsWith('forecast')?'forecast':id.startsWith('repair')?'repair':'production'});}}return;
  }
  if(state.voyage.started&&hit.voyageId){
    if(hit.voyageId==='boat'){if(!state.voyage.boat?.aboard)goBoat();return;}
    if(hit.voyageId.startsWith('salvage:')){
      const p=SALVAGE.find(p=>p.id===hit.voyageId.split(':')[1]);if(!p)return;
      if(state.voyage.boat?.aboard){
        const options=[];for(let i=0;i<16;i++){const a=i*Math.PI/8,q={x:p.x+Math.sin(a)*1.8,z:p.z+Math.cos(a)*1.8};if(canSail(state,q.x,q.z))options.push(q);}
        options.sort((a,b)=>dist(state.player,a)-dist(state.player,b));boatNavigate(options[0]||p,hit.voyageId);
      }else if(dist(state.player,WRECK)<5){moveTo(p);autoGather=hit.voyageId;}
      else toast('先坐上小艇，才能去打捞近海物资。');return;
    }
    if(hit.voyageId==='wreck'){if(state.voyage.boat?.aboard)boatNavigate(WRECK_MOORING);else if(dist(state.player,WRECK)<6)moveTo(hit.point);else toast('沉船在海的另一边。先到码头造船、上船。');return;}
  }
  if(state.voyage.boat?.aboard){boatNavigate(hit.point);return;}
  if (hit.buildingId) {
    const b = state.buildings.find(v => v.id === hit.buildingId);
    if (b && ['net', 'fire','stove'].includes(b.type) && dist(state.player, b) < 2.2) { const res = interactBuilding(state, b.id); toast(res.message || '收集到了木料。'); if (res.amounts) floatGain(res.amounts, b.x, floorHeight(state, b.x, b.z) + 1, b.z); if (res.ok) { sound.play(); save(); } return; }
    if(state.survival.started&&b&&['station','lumbermill','recycler','garden'].includes(b.type)){const item={...b,id:`${b.type==='station'?'forecast':'produce'}:${b.id}`,kind:b.type==='station'?'forecast':'production'};if(dist(state.player,b)<2.4)applyInteraction(interactSurvival(state,item));else survivalTarget(item);return;}
    if (b?.type === 'cabin') { moveTo({ x: b.x, z: b.z }); return; }
    if(b?.type==='workbench'){if(dist(state.player,b)<3.2)selectRecipe('warmer');else moveTo(b);return;}
  }
  if(state.voyage.started&&floorHeight(state,hit.point.x,hit.point.z)<-.35){toast('这片海需要小艇。走近小艇后，上船再点击水面。');return;}
  moveTo(hit.point, hit.nodeId);
});
canvas.addEventListener('pointermove',e=>{if(!pointerStart||!isArchitect(state)||panelOpen)return;const dx=e.clientX-(pointerStart.lastX??pointerStart.x),dy=e.clientY-(pointerStart.lastY??pointerStart.y);pointerStart.lastX=e.clientX;pointerStart.lastY=e.clientY;if(Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<10)return;const v=world.cameraBasis(),scale=innerWidth<650?.055:.025;editorFocus.x-=v.right.x*dx*scale-v.forward.x*dy*scale;editorFocus.z-=v.right.z*dx*scale-v.forward.z*dy*scale;});
canvas.addEventListener('pointercancel', () => { pointerStart = null; });
canvas.addEventListener('wheel', e => { e.preventDefault(); world.zoom(Math.sign(e.deltaY) * 1.4); }, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());
const action = $('action');
action.addEventListener('pointerdown', e => { if (mode !== 'playing' || panelOpen || placement) return; action.setPointerCapture(e.pointerId); held = true;actionLatched=false; autoGather = null; path = []; destination = null;if(state.voyage.boat?.aboard){state.voyage.boat.vx=0;state.voyage.boat.vz=0;} e.preventDefault(); });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) action.addEventListener(type, () => { held = false; holdProgress = 0;actionLatched=false; });
const stick = $('joystick'); let stickPointer = null;
function joystickEvent(e) {
  const r = stick.getBoundingClientRect(), radius = r.width * .31;
  let x = (e.clientX - r.x - r.width / 2) / radius, y = (e.clientY - r.y - r.height / 2) / radius;
  const length = Math.hypot(x, y); if (length > 1) { x /= length; y /= length; }
  joy = { x, y }; $('stick').style.transform = `translate(${x * radius}px,${y * radius}px)`;
}
stick.addEventListener('pointerdown', e => { if (mode !== 'playing' || panelOpen) return; stickPointer = e.pointerId; stick.setPointerCapture(e.pointerId); joystickEvent(e); e.preventDefault(); });
stick.addEventListener('pointermove', e => { if (e.pointerId === stickPointer) joystickEvent(e); });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(type, () => { stickPointer = null; joy = { x: 0, y: 0 }; $('stick').style.transform = ''; });
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
  if(isArchitect(state)&&mode==='playing'&&(e.ctrlKey||e.metaKey)&&['z','y'].includes(k)){e.preventDefault();editHistory(k==='y'||e.shiftKey?'redo':'undo');return;}
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e', 'b', 'r', 'f', 'escape', ' '].includes(k)) {
    if (e.target instanceof HTMLButtonElement && [' ', 'enter'].includes(k)) return;
    e.preventDefault();
    if (k === 'escape' && !e.repeat) { if(mode==='worlds'){closeWorlds();return;} if(mode==='forecast'){closeForecast();return;} if (placement) cancelPlacement(); else if (panelOpen) { panelOpen = false; $('build-panel').hidden = true; } else if (mode !== 'intro' && mode !== 'result') setPaused(mode !== 'paused'); return; }
    if (mode !== 'playing') return;
    if (k === 'b' && !e.repeat) { openPanel(); return; }
    if (k === 'r' && !e.repeat) { rotatePlacement(); return; }
    if (k === 'f' && !e.repeat) { warmUp(); return; }
    if (k === ' ' && placement && !e.repeat) { place(); return; }
    keys.add(k); if (k === 'e'&&!e.repeat) { held = true;actionLatched=false; autoGather = null; }
  }
});
window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys.delete(k); if (k === 'e') { held = false; holdProgress = 0;actionLatched=false; } });
window.addEventListener('blur', () => { resetInput(); if (mode === 'playing') { pauseOnBlur = true; setPaused(true); } });
document.addEventListener('visibilitychange', () => { previous = performance.now(); if (document.hidden) { save(); resetInput(); if (mode === 'playing') setPaused(true); } });
window.addEventListener('pagehide', save);
$('start').addEventListener('click', start);
$('fresh').addEventListener('click', () => { if (!confirmReset) { confirmReset = true; $('fresh').textContent = '确认清空旧营地，重新上岛'; return; } resetRun(); });
$('pause').addEventListener('click', () => setPaused(true)); $('resume').addEventListener('click', () => setPaused(false));
$('restart').addEventListener('click', () => { if (!confirmReset) { confirmReset = true; $('restart').textContent = '确认清空营地，重新上岛'; return; } confirmReset = false; resetRun(); });
$('sound').addEventListener('click', () => { const muted = sound.toggle(); $('sound').innerHTML = muted ? '♪<span class="mute-mark">×</span>' : '♪'; $('sound').setAttribute('aria-label', muted ? '开启音效' : '关闭音效'); $('sound').title = muted ? '开启音效' : '关闭音效'; });
$('build-menu').addEventListener('click', centerAction); $('close-build').addEventListener('click', () => { panelOpen = false; $('build-panel').hidden = true; });
$('voyage-go').addEventListener('click',goVoyage);$('warmer').addEventListener('click',warmUp);
$('craft-decor').addEventListener('click',()=>{craftTab='decor';renderRecipes();});
$('craft-advanced').addEventListener('click',()=>{craftTab='advanced';renderRecipes();});
$('creative').addEventListener('click',()=>{if(isArchitect(state)||state.world.mode==='creative')return;state.survival.creative=!state.survival.creative;renderRecipes();save();});
$('forecast-close').addEventListener('click',closeForecast);
$('forecast-tonight').addEventListener('click',()=>{const res=prepareTonight(state);if(res.ok){closeForecast();moveTo(homeTarget());save();}toast(res.message,6);});
$('forecast-rest').addEventListener('click',()=>{const res=restTomorrow(state);if(res.ok){closeForecast();save();}toast(res.message,6);});
$('explore-new').addEventListener('click',()=>{const p=closestNewIsland(state);if(!p){toast('往外海继续探索。');return;}closeForecast();if(state.voyage.boat?.aboard){boatNavigate({x:p.x,z:p.z+p.rz+1.8});toast('向新海域划行。靠岸下船后，可以采集和建设。',6);}else {goBoat();toast('走近小艇上船后，再打开预报中的“探索新岛”。',6);}});
$('craft-camp').addEventListener('click',()=>{craftTab='camp';renderRecipes();});$('craft-sea').addEventListener('click',()=>{craftTab='sea';renderRecipes();});
$('recall-boat').addEventListener('click',()=>{const res=recallBoat(state);if(res.ok){setPaused(false);save();}toast(res.message,5);});
$('cancel-build').addEventListener('click', cancelPlacement); $('rotate-build').addEventListener('click', rotatePlacement); $('confirm-build').addEventListener('click', place);
$('camera-left').addEventListener('click', () => world.rotate(-1)); $('camera-right').addEventListener('click', () => world.rotate(1)); $('camera-home').addEventListener('click', () => world.overview());
$('zoom-in').addEventListener('click', () => world.zoom(-2)); $('zoom-out').addEventListener('click', () => world.zoom(2));
$('fold-mission').addEventListener('click', () => { missionFolded = !missionFolded; document.querySelector('.mission').classList.toggle('folded', missionFolded); $('fold-mission').textContent = missionFolded ? '+' : '−'; });
$('invite-storm').addEventListener('click', () => {
  if (mode !== 'playing' || placement || panelOpen || currentMission(state).index !== 7 || !shelter(state).cozy) return;
  state.time = 174; resetInput(); toast('风雨会在 6 秒后到来，留在小屋里守住火光。', 6); sound.play('warn'); save();
});
$('result-primary').addEventListener('click', () => resultClick?.());
$('result-secondary').addEventListener('click', () => { if (!confirmReset) { confirmReset = true; $('result-secondary').textContent = '确认重新上岛，清空本次营地'; return; } confirmReset = false; resetRun(); });


function worldMessage(message){$('world-message').textContent=message;}
function renderWorlds(){
 $('world-list').replaceChildren();
 for(const item of library.list().worlds){
  const row=document.createElement('div');row.className='world-row';const text=document.createElement('div'),name=document.createElement('b'),meta=document.createElement('small'),button=document.createElement('button');
  name.textContent=item.name;meta.textContent=`${item.mode==='creative'?'自由世界':'生存世界'} · 第 ${item.day} 天 · ${item.buildings} 座建筑`;text.append(name,meta);button.textContent=item.id===state.world.id?'当前世界':'进入';button.disabled=item.id===state.world.id;
  button.addEventListener('click',()=>{try{const next=library.load(item.id);activateWorld(next);}catch(e){worldMessage(e.message);}});row.append(text,button);$('world-list').append(row);
 }
 const w=state.world;$('world-name').value=w.name;$('world-mode').value=w.mode;$('world-pace').value=w.pace;$('world-style').value=w.style;$('world-calm').checked=w.calm;$('world-frozen').checked=w.frozen;
 for(const id of ['world-mode','world-pace','world-calm','world-frozen','world-build'])$(id).disabled=!state.survival.started;
 $('world-home').disabled=w.mode!=='creative';
 $('world-next').disabled=!state.survival.started||(w.mode!=='creative'&&!state.survival.dayRewarded&&tide(state).phase!=='rest');
}
function openWorlds(){
 if(mode==='worlds')return;worldPreviousMode=mode;resetInput();panelOpen=false;$('build-panel').hidden=true;placement=null;$('placement').hidden=true;world.setPreview(null);mode='worlds';$('world-overlay').hidden=false;
 try{library.save(state);storageOK=true;worldMessage('每个世界单独保存。原来的营地会一直留在列表里。');}catch{storageOK=false;worldMessage('本机存储空间不足，先导出备份；当前世界仍在本次会话中。');}
 renderWorlds();
}
function closeWorlds(){mode=worldPreviousMode==='intro'?'intro':worldPreviousMode==='paused'?'paused':'playing';$('world-overlay').hidden=true;previous=performance.now();}
function activateWorld(next,edit=false){
 library.save(state);library.save(next);state=next;state.world.editor=false;editorFocus=null;history=null;saved=state;resetInput();placement=null;panelOpen=false;lastMission=-1;lastTide='';
 for(const id of ['intro','result','pause-overlay','forecast-overlay','world-overlay','build-panel','placement'])$(id).hidden=true;
 $('hud').hidden=false;mode='playing';if(state.won)beginDayTwo(state);if(state.voyage.completed&&state.voyage.resultSeen)beginSurvival(state);craftTab=state.survival.started?'advanced':'camp';floats.forEach(f=>f.el.remove());floats=[];streamResources(state);world.resetCamera(state.player);
 toast(`欢迎来到「${state.world.name}」。`,5);if(edit)enterEditor();else if(state.voyage.completed&&!state.voyage.resultSeen)showResult('voyage');else if(state.survival.completed&&!state.survival.resultSeen)showResult('survival');save();updateHud();
}
function enterEditor(){
 if(!state.survival.started){toast('第三天解锁建造视角，也可以在“世界”里直接创建自由世界。');return;}
 state.survival.creative=true;state.world.editor=true;editorFocus={x:state.player.x,z:state.player.z};history=createBuildHistory(state);brushSize=1;picking=false;resetInput();
 mode='playing';panelOpen=false;placement=null;for(const id of ['world-overlay','build-panel','placement'])$(id).hidden=true;world.setPreview(null);world.resetCamera(editorFocus);toast('拖动画面或用摇杆移动镜头。工坊选建筑，自由放置；此时世界暂停。',7);updateHud();save();
}
function leaveEditor(){
 state.world.editor=false;editorFocus=null;history=null;picking=false;cancelPlacement();panelOpen=false;$('build-panel').hidden=true;
 if(!state.voyage.boat?.aboard&&collides(state,state.player.x,state.player.z)){if(state.world.mode==='creative')returnHome(state);else rescue(state);}
 streamResources(state);world.resetCamera(state.player);toast('回到自己建造的世界，走一走看看吧。',5);save();updateHud();
}
function editHistory(direction){if(mode!=='playing'||!history)return;const ok=history[direction]();if(ok){world.setPreview(null);updatePlacement();save();toast(direction==='undo'?'已撤销上一笔建造。':'已重做上一笔建造。');}updateHud();}
$('world-menu').addEventListener('click',openWorlds);$('intro-worlds').addEventListener('click',openWorlds);$('world-close').addEventListener('click',closeWorlds);
$('new-world-form').addEventListener('submit',e=>{
 e.preventDefault();try{library.save(state);const seed=new Uint32Array(1);crypto.getRandomValues(seed);const next=createSandbox({id:library.newId(),name:$('new-world-name').value,mode:$('new-world-mode').value,preset:$('new-world-preset').value,seed:seed[0]});library.add(next);activateWorld(next,next.world.mode==='creative');}catch(error){worldMessage('创建未完成：'+error.message+'。原世界仍保留。');}
});
$('world-settings-form').addEventListener('submit',e=>{
 e.preventDefault();if(state.world.editor&&$('world-mode').value!=='creative')leaveEditor();applyWorldSettings(state,{name:$('world-name').value,mode:$('world-mode').value,pace:$('world-pace').value,style:$('world-style').value,calm:$('world-calm').checked,frozen:$('world-frozen').checked});
 if(state.world.mode!=='creative'&&state.world.editor){state.world.editor=false;editorFocus=null;history=null;}
 try{library.save(state);worldMessage('设置已保存。回到世界即可体验。');renderWorlds();}catch{worldMessage('设置留在本次会话，但本机保存失败。请导出备份。');}
});
$('world-build').addEventListener('click',enterEditor);$('enter-builder').addEventListener('click',enterEditor);$('editor-done').addEventListener('click',leaveEditor);
$('editor-visit').addEventListener('click',()=>{const res=visitPosition(state,editorFocus);if(res.ok)leaveEditor();else toast(res.message,5);});
$('editor-center').addEventListener('click',()=>{if(editorFocus){editorFocus={x:state.player.x,z:state.player.z};world.resetCamera(editorFocus);}});
$('undo-build').addEventListener('click',()=>editHistory('undo'));$('redo-build').addEventListener('click',()=>editHistory('redo'));
$('pick-template').addEventListener('click',()=>{picking=!picking;placement=null;$('placement').hidden=true;world.setPreview(null);toast('点击想复制的建筑，再到空地放置同款。');});
$('brush-one').addEventListener('click',()=>{brushSize=1;updatePlacement();});$('brush-nine').addEventListener('click',()=>{brushSize=3;updatePlacement();});
$('world-next').addEventListener('click',()=>{const res=restTomorrow(state);if(res.ok){save();renderWorlds();}worldMessage(res.message);});
$('world-home').addEventListener('click',()=>{const res=returnHome(state);if(res.ok){state.world.editor=false;editorFocus=null;history=null;closeWorlds();world.resetCamera(state.player);streamResources(state);save();}else worldMessage(res.message);});
$('set-home').addEventListener('click',()=>{if(state.voyage.boat?.aboard||floorHeight(state,state.player.x,state.player.z)<.15||collides(state,state.player.x,state.player.z)){worldMessage('先让角色站在干燥可通行的地面或地板上，再设为家。');return;}state.world.home={x:state.player.x,z:state.player.z};save();worldMessage('已经把角色站立的位置设为家。');});
$('duplicate-world').addEventListener('click',()=>{try{library.save(state);library.duplicate(state);renderWorlds();worldMessage('副本已单独保存。可以进入副本放心尝试另一种布局。');}catch(e){worldMessage('复制未完成：'+e.message);}});
$('export-world').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({format:'TidehavenWorld',version:1,state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=state.world.name.replace(/[^\p{L}\p{N}_-]/gu,'_')+'-小岛备份.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);worldMessage('已生成当前世界备份。保留下载文件，之后可以导入为新世界。');});
$('import-world').addEventListener('click',()=>$('import-file').click());$('import-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>8*1024*1024)throw Error('文件超过当前 8 MB 导入限制');const next=library.import(await file.text());renderWorlds();worldMessage(`「${next.world.name}」已作为独立世界导入，原世界没有被覆盖。`);}catch(error){worldMessage('导入未完成：'+error.message);}e.target.value='';});

try {
  world = createWorld(canvas); world.update(state, .016, { intro: true });
  $('load').hidden = true; $('intro').hidden = false;
  document.querySelector('.mission').classList.toggle('folded', missionFolded); $('fold-mission').textContent = missionFolded ? '+' : '−';
  if (saved) { $('start').innerHTML = '回到我的营地 <span>↗</span>'; $('fresh').hidden = false; }
  updateHud(); requestAnimationFrame(tick);
} catch (error) {
  console.error(error); $('load').textContent = '小岛未能加载。请使用支持 WebGL 2 的浏览器打开本地试玩地址。';
}
