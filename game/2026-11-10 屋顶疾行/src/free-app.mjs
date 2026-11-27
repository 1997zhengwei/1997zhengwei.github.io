import {LOOKS} from './world.mjs';
import {FREE_SPAWNS,districtBounds} from './free-world.mjs';
import {createSession,startSession,stepSession,actionHint,bankFlow,setSessionMarker,returnToMarker} from './physics.mjs';
import {normalizeSave,buyLook} from './progress.mjs';
import {ParkourScene} from './scene.mjs';
import {ParkourInput} from './input.mjs';
import {CityAudio} from './audio.mjs';
import {prepareRunner} from './human-runner.mjs';
import {loadPhotoMaterials} from './materials.mjs';
import {prepareCityKit} from './city-kit.mjs';
import {clamp,normal} from './math.mjs';
import {createHuntSession,stepHunt,settleHunt,useHuntTool} from './hunt.mjs';
import {HuntVisuals} from './hunt-scene.mjs';
import {EquipmentVisuals} from './equipment-visuals.mjs';
import {EQUIPMENT,buyEquipment,unequip} from './equipment.mjs';
import {shopHTML} from './shop-ui.mjs';
import {decorateHuntHUD,updateHuntHUD,huntPause,huntOverview,huntResult,huntHelp} from './hunt-ui.mjs';

const canvas=document.querySelector('#world'),ui=document.querySelector('#ui'),toastNode=document.querySelector('#toast');
const qa=new URLSearchParams(location.search).has('qa'),key='rooftop-flow-v1'+(qa?'-qa':'');
function load(){try{return normalizeSave(JSON.parse(localStorage.getItem(key)));}catch{return normalizeSave(null);}}
let save=load(),world=createSession({free:true}),view='home',mapReturn='home',helpReturn='home',previewLook=save.look;
let equipmentVisuals,shopTab='outfit',previewItem='courier',previewLoadout={...save.loadout},huntVisuals,huntResultData=null,scene,thumbs={},last=performance.now(),elapsed=0,accumulator=0,hudClock=0,toastUntil=0,lastEvent=0,distanceSaved=0;
const queued={jump:false,slide:false,trick:false,trickKind:'front'};
const orbit={yaw:0,pitch:.18,showGhost:false},audio=new CityAudio();audio.enabled=save.sound;
let perfFrames=0,perfSeconds=0;
const perfNode=qa?document.body.appendChild(Object.assign(document.createElement('div'),{id:'qa-performance'})):null;
if(perfNode)perfNode.style.cssText='position:absolute;top:76px;left:50%;transform:translateX(-50%);padding:4px 8px;background:#152c38d9;color:#d8e7ca;font:10px monospace;pointer-events:none;z-index:20;white-space:nowrap';
try{
 document.querySelector('#loading b').textContent='准备自由街区与动作';
 const [,pbr,cityKit]=await Promise.all([prepareRunner(),loadPhotoMaterials(),prepareCityKit()]);scene=new ParkourScene(canvas,world.map,{pbr,cityKit});scene.applyLook(save.look);huntVisuals=new HuntVisuals(scene);equipmentVisuals=new EquipmentVisuals(scene);scene.setEquipment(save.loadout);thumbs=scene.thumbnails();document.querySelector('#loading').remove();
}catch(e){document.querySelector('#loading').innerHTML='<b>城市还没打开</b><span>请检查本地素材并使用支持 WebGL2 的浏览器刷新</span>';console.error(e);throw e;}
const input=new ParkourInput(canvas,orbit,()=>view==='race'&&world.mode==='running',()=>{if(view==='race')pause();else if(view==='pause')resume();else if(view==='help'){if(helpReturn==='race')resume();else{view=helpReturn;render();}}});
const time=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`;
const wallet=()=>`<div class="wallet" aria-label="城市徽币余额"><span>◈</span><b>${save.coins}</b></div>`;
const brand=()=>'<div class="brand"><i>↗</i><span>ROOFTOP<span>FLOW / 屋顶寻宝</span></span></div>';
function persist(){try{localStorage.setItem(key,JSON.stringify(save));}catch{toast('浏览器暂时无法保存进度');}}
function toast(text){toastNode.textContent=text;toastNode.classList.add('show');toastUntil=elapsed+2.8;}
function collectEvents(){for(const e of world.events)if(e.id>lastEvent){lastEvent=e.id;
 if(e.type==='bank'){save.coins+=e.coins;save.freeBest=Math.max(save.freeBest,e.points);save.totalFlow+=e.points;saveDistance();persist();toast(e.coins?`${e.points} FLOW 收下 · ◈ +${e.coins}`:'连招收下 · 本关连招奖励已达6币');}
 else if(['vault','mantle','wallrun','precision','trickland','slide','marker','return','respawn','hunt-fall','tool'].includes(e.type))toast((e.points?'+'+e.points+' · ':'')+e.text);
}}
function saveDistance(){save.freeDistance+=Math.max(0,world.stats.distance-distanceSaved);distanceSaved=world.stats.distance;}
function start(spawn='plaza',hunt=true,seed=null,options={}){
 toastNode.classList.remove('show');toastNode.textContent='';toastUntil=0;
 queued.jump=queued.slide=queued.trick=false;input.reset();input.slowmo=false;input.fastRun=true;world=startSession(hunt?createHuntSession(seed??Math.floor(Math.random()*1e9),{level:save.huntLevel,avoidRoof:save.huntLastRoof,tool:save.loadout.tool,...options}):createSession({free:true,spawn}),{waitForMove:true});huntResultData=null;orbit.yaw=world.player.yaw;orbit.pitch=.18;
 view='race';accumulator=0;lastEvent=0;distanceSaved=0;scene.lastEvent=0;scene.lastFoot=-1;scene.snap=true;scene.applyLook(save.look);scene.setEquipment(save.loadout);audio.reset();audio.unlock();render();
}
function pause(){if(view!=='race')return;queued.jump=queued.slide=queued.trick=false;world.mode='paused';view='pause';input.reset();render();}
function resume(){queued.jump=queued.slide=queued.trick=false;world.mode='running';view='race';input.reset();accumulator=0;audio.unlock();render();}
function finish(){if(world.player.grounded)bankFlow(world);collectEvents();saveDistance();persist();input.reset();world.mode='finished';view='result';render();}
function home(){input.reset();if(world.hunt)world=createSession({free:true});world.mode='ready';view='home';scene.applyLook(save.look);scene.setEquipment(save.loadout);render();}
function openWardrobe(){previewLook=save.look;previewLoadout={...save.loadout};shopTab='outfit';view='wardrobe';input.reset();scene.applyLook(previewLook);scene.setEquipment(previewLoadout);scene.previewYaw=-.22;render();}
function setMarker(){if(world.hunt){toast('寻宝中专注找宝箱 · 练习位置仅在自由练习可用');return;}toast(setSessionMarker(world)?'练习位置已记住 · X 随时回来':'先在宽敞的平地站稳，再设置位置');}
function goBack(){if(world.hunt){toast('寻宝中不能传送返回 · 失足会扣1条命');return;}input.reset();queued.jump=queued.slide=queued.trick=false;returnToMarker(world);orbit.yaw=world.marker.yaw;scene.snap=true;collectEvents();}

function homeHTML(){return `<div class="home-scrim"></div><header class="topbar">${brand()}<div class="top-actions">${wallet()}<button class="icon-button" data-action="sound" aria-label="${save.sound?'关闭声音':'开启声音'}">♫</button><button class="icon-button" data-action="help" aria-label="操作指南">?</button></div></header><section class="hero"><div class="eyebrow"><span class="status-dot"></span> TREASURE CHASE / 第 ${save.huntLevel} 关</div><h1>FIND<br><em>THE GOLD.</em></h1><h2>屋顶寻宝 · 追逐跑酷</h2><p class="hero-copy">看小地图，找到金色宝箱。<br>三位追逐者，就在你的身后。</p><div class="hero-facts"><span>3条生命</span><span>掉落扣1条</span><span>被抓立即失败</span></div><div class="home-buttons"><button class="primary" data-action="start">开始寻宝 <span>↗</span></button><button class="secondary" data-action="practice">自由练习 <small>熟悉街区与动作</small></button><div class="home-links"><button data-action="wardrobe">◈ 街头装备店</button><button data-action="map">⌁ 街区总览</button></div></div><div class="personal-best"><span>TREASURES FOUND</span><b>${save.huntWins||0} 次${save.huntBest?' · 最快 '+time(save.huntBest):''}</b><small>每关换个藏宝屋顶，赚徽币解锁长期装备。</small></div></section><div class="home-coordinate"><span>READ THE MAP / OUTRUN THE CHASE</span><i>${world.map.roofs.length} 座屋顶 · 每关随机藏宝</i></div>`;}

function basehudHTML(){return `<div class="motion-vignette" id="motion-vignette"></div><header class="free-top"><button class="free-place" data-action="map" aria-label="打开街区地图"><small>FREE ROAM / 自由街区</small><b id="location-name">中央天台</b><span>⌁ 换个地方出发</span></button><div class="free-session"><b id="session-distance">0 m</b><small id="session-coins">◈ +0</small></div><button class="icon-button pause-icon" data-action="pause" aria-label="暂停跑酷">Ⅱ</button></header>
 <section class="free-flow"><small>FLOW <span id="flow-value">×1.00</span></small><b id="chain-score">0</b><i><i id="flow-bar"></i></i><span id="flow-note">让动作连起来</span></section>
 <div class="action-message" id="action-message"><span id="action-icon">↗</span><span id="action-cue">想去哪里，就朝哪里跑</span></div><div class="speed-readout"><b id="speed-value">0</b><span>KM/H</span></div>
 <div class="assist-controls"><button data-action="autorun" aria-label="切换连续跑步" id="autorun-button">连续跑 <b>OFF</b></button><button data-action="sprint" aria-label="切换全速奔跑" id="sprint-button">全速 <b>ON</b></button><button data-action="slowmo" aria-label="切换慢动作" id="slow-button">慢动作 <b>OFF</b></button></div>
 <div class="session-tools"><button data-action="marker" aria-label="设置练习位置">⚑ <span>记住位置 <kbd>B</kbd></span></button><button data-action="return" aria-label="返回练习位置">↶ <span>回到位置 <kbd>X</kbd></span></button></div>
 <div class="move-zone"><div class="stick" id="stick" role="group" aria-label="移动摇杆"><span>移动</span><i id="stick-knob"></i><em>W A S D</em></div><div class="camera-nudges"><button data-action="look-left" aria-label="视角向左转">‹</button><button data-action="face" aria-label="镜头转到人物身后">↗</button><button data-action="look-right" aria-label="视角向右转">›</button></div></div>
 <div class="action-buttons"><button class="trick-button" data-action="trick" aria-label="空中前空翻"><i>⟳</i><span>前空翻 <small>F</small></span></button><button class="sideflip-button" data-action="sideflip" aria-label="空中侧空翻">⤾ <span>侧翻 G</span></button><button class="jump-button" data-action="jump" aria-label="跳跃或翻越"><i>↗</i><span id="jump-label">起跳 / 翻越</span><small>SPACE</small></button><button class="slide-button" data-action="slide" aria-label="滑铲或松手"><i>⌁</i><span>滑铲 <small>C</small></span></button></div>
 <div class="desktop-hints"><span><kbd>WASD</kbd> 移动</span><span><kbd>SPACE</kbd> 起跳 / 翻栏</span><span><kbd>F / G</kbd> 空翻</span><span><kbd>Z</kbd> 慢动作</span><span>拖动镜头 · <kbd>Q E</kbd> 转向</span></div>`;}
function basepauseHTML(){return `<div class="modal-scrim"></div><section class="dialog"><div class="eyebrow">TAKE A BREATH</div><h2>没有终点，随时再来。</h2><p>已经跑了 ${Math.round(world.stats.distance)} 米<br>本次已获得 ◈ ${world.earnedCoins} · 最佳连招 ${world.bestChain} PTS</p><button class="primary" data-action="resume">继续自由跑酷 ↗</button><div class="dialog-grid"><button class="secondary" data-action="map">换个地点</button><button class="secondary" data-action="return">回到练习位置</button></div><div class="setting-row"><span>环境与动作声音</span><button class="toggle ${save.sound?'on':''}" data-action="sound">${save.sound?'开启':'关闭'}</button></div><button class="text-button" data-action="help">看看动作说明</button><button class="text-button" data-action="finish">收工 · 保存这次游玩</button></section>`;}
function wardrobeHTML(){return shopHTML({save,tab:shopTab,selectedLook:previewLook,selectedItem:previewItem,thumbs,wallet:wallet()});}
function cityMap(){const bounds=districtBounds(world.map);return `<svg class="free-city-map" viewBox="${bounds.viewBox}" aria-label="可自由往返的街区地图">${world.map.links.map(l=>`<path d="M${l.x1} ${l.z1}L${l.x2} ${l.z2}" stroke="#d5b86e" stroke-width="2"/>`).join('')}${world.map.roofs.map(r=>`<rect x="${r.x-14}" y="${r.z-14}" width="28" height="28" rx="1" fill="${r.zone==='花园旧巷'?'#76916e':r.zone==='施工街区'?'#b49b68':'#8b9c9e'}"/>`).join('')}${FREE_SPAWNS.map((s,i)=>`<circle cx="${s.x}" cy="${s.z}" r="4.8" fill="#172e3b"/><text x="${s.x}" y="${s.z+1.6}" text-anchor="middle" fill="#f0ead7" font-size="5">${i+1}</text>`).join('')}<circle cx="${world.player.x}" cy="${world.player.z}" r="2.3" fill="#d1f28f"/></svg>`;}
function basemapHTML(){return `<div class="map-shade"></div><header class="topbar"><button class="back-button" data-action="map-back" aria-label="关闭街区地图">‹</button><div class="map-title"><span>THE CITY IS YOURS</span><h2>挑个地方，随意出发。</h2></div></header><section class="free-map-panel">${cityMap()}<div><div class="eyebrow">NO ROUTE. YOUR FLOW.</div><h3>每条路，都可以折返。</h3><p>桥梁适合起步，断口留给跨越。<br>黄桥与高墙练动作，花园屋顶练连跳。</p><div class="spawn-grid">${FREE_SPAWNS.map((s,i)=>`<button data-action="travel" data-id="${s.id}"><i>${i+1}</i><b>${s.name}</b><small>${s.subtitle}</small></button>`).join('')}</div></div></section>`;}
function basehelpHTML(){return `<div class="modal-scrim"></div><section class="dialog help-dialog"><div class="eyebrow">FREERUN / YOUR OWN LINE</div><h2>从这一跳开始。</h2><div class="help-grid"><span><kbd>WASD / 摇杆</kbd> 移动</span><span><kbd>SPACE</kbd> 起跳 / 翻栏</span><span><kbd>F / G</kbd> 空中前翻 / 侧翻</span><span><kbd>C</kbd> 滑铲 / 松手</span><span><kbd>B / X</kbd> 记住 / 返回位置</span><span><kbd>Z</kbd> 慢动作开关</span></div><p>拖动场景调整镜头，Q / E 转向。靠近低栏起跳会翻越；够到高台会抓边，继续向前攀上。贴墙向前跳能沿墙跑，再跳可以蹬出。</p><p>起跳后稍等一瞬再按 F / G 空翻；跨过足够距离并落稳才计分。5秒内接续翻栏、攀爬、滑铲或落地，连招收下后赚徽币。反复刷同一物体会减少得分。</p><p class="help-soft">失足会中断未收下的连招，回到刚才站稳的屋顶。没有倒计时、规定路线或必须经过的点。也可以设置自己的练习位置，反复尝试。</p><button class="primary" data-action="help-back">明白了，去试试 ↗</button></section>`;}
function baseresultHTML(){return `<div class="result-shade"></div><section class="result-panel"><div class="eyebrow">SESSION SAVED / FREE ROAM</div><h2>今天，也跑得尽兴。</h2><span class="result-time-label">自由探索</span><b class="result-time">${Math.round(world.stats.distance)}<small> m</small></b><div class="result-stats"><div><small>最佳连招</small><b>${world.bestChain}<i> PTS</i></b></div><div><small>翻越 / 攀上</small><b>${world.stats.vaults} / ${world.stats.climbs}</b></div><div><small>空翻落地</small><b>${world.stats.tricks}<i> 次</i></b></div><div><small>沿墙奔跑</small><b>${world.stats.wallruns}<i> 次</i></b></div></div><div class="reward"><span>◈ +${world.earnedCoins}</span><small>已收下并保存<br>下次还可以换条路线</small></div><button class="primary" data-action="start">再去逛逛 ↗</button><div class="dialog-grid"><button class="secondary" data-action="wardrobe">换身衣服</button><button class="secondary" data-action="map">换个出发点</button></div><button class="text-button" data-action="home">返回天台</button></section>`;}
function hudHTML(){const html=basehudHTML();return world.hunt?decorateHuntHUD(html,world):html;}
function pauseHTML(){return world.hunt?huntPause(world):basepauseHTML();}
function mapHTML(){return world.hunt&&mapReturn!=='home'?huntOverview(world):basemapHTML();}
function helpHTML(){return world.hunt||helpReturn==='home'?huntHelp(basehelpHTML()):basehelpHTML();}
function resultHTML(){return world.hunt?huntResult(world,huntResultData):baseresultHTML();}
function completeHunt(){if(!world.hunt||world.hunt.paid)return;if(world.hunt.status==='won'&&world.player.grounded)bankFlow(world);else{world.chain=0;world.combo=0;}collectEvents();huntResultData=settleHunt(world,save);saveDistance();persist();input.reset();queued.jump=queued.slide=queued.trick=false;toastNode.classList.remove('show');toastUntil=0;view='result';render();}
function render(){ui.className='view-'+view+(world.hunt?' is-hunt':'');ui.innerHTML=view==='home'?homeHTML():view==='race'?hudHTML():view==='pause'?hudHTML()+pauseHTML():view==='wardrobe'?wardrobeHTML():view==='result'?resultHTML():view==='map'?mapHTML():helpHTML();if(view==='race')input.bindHUD(ui);hudClock=.15;updateHUD();}
function updateHUD(){if(!['race','pause'].includes(view))return;const p=world.player,hint=actionHint(world,p.speed>.5?normal(p.vx,p.vz):{x:-Math.sin(orbit.yaw),z:-Math.cos(orbit.yaw)}),set=(id,text)=>{const e=ui.querySelector('#'+id);if(e&&e.textContent!==String(text))e.textContent=text;};
 set('location-name',world.location);set('session-distance',Math.round(world.stats.distance)+' m');set('session-coins','◈ +'+world.earnedCoins);set('speed-value',Math.round(p.speed*3.6));set('chain-score',world.chain);set('flow-value','×'+(1+.15*Math.max(0,world.combo-1)).toFixed(2));set('flow-note',world.chain?'接续动作，或落稳收下连招':'让动作连起来');const bar=ui.querySelector('#flow-bar');if(bar)bar.style.transform=`scaleX(${world.combo?clamp((world.comboUntil-world.elapsed)/5.2,0,1):0})`;
 set('action-cue',hint.text);const cue=ui.querySelector('#action-message');if(cue)cue.className='action-message '+hint.type;set('jump-label',p.hang?'抓边攀上':p.mode==='wallrun'?'蹬墙跃出':hint.type==='vault'?'翻越低栏':'起跳 / 翻越');
 for(const [id,on]of[['autorun-button',input.autoRun],['sprint-button',input.fastRun],['slow-button',input.slowmo]]){const b=ui.querySelector('#'+id);if(b){b.classList.toggle('on',!!on);b.querySelector('b').textContent=on?'ON':'OFF';}}
 ui.querySelector('#motion-vignette')?.style.setProperty('opacity',input.slowmo?'.6':String(clamp((p.speed-5)/10,0,.4)));
 for(const b of ui.querySelectorAll('[data-action="trick"],[data-action="sideflip"]'))b.classList.toggle('available',!p.grounded&&!p.hang&&!p.kinematic);updateHuntHUD(ui,world);
}
ui.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const a=b.dataset.action;
 if(a==='start')start();else if(a==='practice')start('plaza',false);else if(a==='retry')start('plaza',true,world.hunt?.seed,{level:world.hunt.level,avoidRoof:world.hunt.avoidRoof});else if(a==='abandon'){world.hunt.status='lost';world.hunt.reason='abandoned';world.mode='finished';world.finished=true;completeHunt();}else if(a==='map-resume')resume();else if(a==='pause')pause();else if(a==='resume')resume();else if(a==='finish')finish();else if(a==='home')home();else if(a==='wardrobe')openWardrobe();
 else if(a==='preview-look'){previewLook=b.dataset.id;scene.applyLook(previewLook);render();}else if(a==='buy-look'){if(buyLook(save,previewLook)){persist();scene.applyLook(save.look);toast('换好了 · 去跑出自己的风格');render();}}
 else if(a==='shop-tab'){shopTab=b.dataset.id;if(shopTab!=='outfit'){const item=EQUIPMENT.find(i=>i.id===save.loadout[shopTab])||EQUIPMENT.find(i=>i.slot===shopTab);previewItem=item.id;previewLoadout={...save.loadout,[shopTab]:item.id};}else previewLoadout={...save.loadout};scene.setEquipment(previewLoadout);scene.previewYaw=shopTab==='backpack'?Math.PI-.3:-.22;render();}
 else if(a==='preview-item'){previewItem=b.dataset.id;const item=EQUIPMENT.find(i=>i.id===previewItem);previewLoadout={...save.loadout,[item.slot]:item.id};scene.setEquipment(previewLoadout);render();}
 else if(a==='buy-item'){if(buyEquipment(save,previewItem)){persist();previewLoadout={...save.loadout};scene.setEquipment(previewLoadout);toast('装备好了 · 下次出发即可使用');render();}}
 else if(a==='unequip'){unequip(save,b.dataset.id);previewLoadout={...save.loadout};scene.setEquipment(previewLoadout);persist();render();}
 else if(a==='use-tool'){if(!useHuntTool(world))toast(world.hunt?.charges<1?'本关烟雾已用完':'12米内有追兵时可以使用烟雾');}
 else if(a==='sound'){save.sound=!save.sound;audio.setEnabled(save.sound);persist();render();}
 else if(a==='autorun'){input.autoRun=!input.autoRun;audio.unlock();updateHUD();}else if(a==='sprint'){input.fastRun=!input.fastRun;updateHUD();}else if(a==='slowmo'){input.slowmo=!input.slowmo;updateHUD();}
 else if(a==='look-left'){orbit.yaw+=Math.PI/8;updateHUD();}else if(a==='look-right'){orbit.yaw-=Math.PI/8;updateHUD();}else if(a==='face'){orbit.yaw=world.player.yaw;updateHUD();}
 else if(a==='marker')setMarker();else if(a==='return'){goBack();if(view==='pause')resume();}
 else if(a==='map'){mapReturn=view==='race'?'pause':view;world.mode='paused';input.reset();view='map';render();}
 else if(a==='map-back'){view=mapReturn;scene.snap=true;render();}
 else if(a==='travel'){if(world.stats.distance>0){if(world.player.grounded)bankFlow(world);collectEvents();saveDistance();persist();}start(b.dataset.id,false);}
 else if(a==='help'){helpReturn=view;if(world.mode==='running')world.mode='paused';input.reset();view='help';render();}else if(a==='help-back'){if(helpReturn==='race')resume();else{view=helpReturn;render();}}
});
window.addEventListener('resize',()=>scene.resize());document.addEventListener('visibilitychange',()=>{if(document.hidden&&view==='race')pause();});
function frame(now){const rawDt=(now-last)/1000,dt=Math.min(.05,rawDt);last=now;elapsed+=dt;
 if(perfNode){perfFrames++;perfSeconds+=rawDt;if(perfSeconds>=1){perfNode.textContent=`QA · ${Math.round(perfFrames/perfSeconds)} FPS / ${Math.round(scene.renderer.info.render.triangles/1000)}k triangles / ${scene.renderer.info.render.calls} draws`;perfFrames=perfSeconds=0;}}
 if(view==='race'&&world.mode==='running'){
  const controls=input.read(dt);if(controls.tool&&!useHuntTool(world))toast(world.hunt?.charges<1?'本关道具已用完':'12米内有追兵时可用烟雾');if(controls.marker)setMarker();if(controls.return)goBack();for(const a of['jump','slide','trick'])queued[a]||=controls[a];if(controls.trick)queued.trickKind=controls.trickKind;accumulator+=dt*(input.slowmo?.35:1);
  while(accumulator>=1/120&&world.mode==='running'){(world.hunt?stepHunt:stepSession)(world,{...controls,...queued},1/120);queued.jump=queued.slide=queued.trick=false;accumulator-=1/120;}collectEvents();if(world.hunt&&world.hunt.status!=='running')completeHunt();
 }
 audio.update(world);huntVisuals.update(world,view,elapsed);scene.update(world,view,dt,elapsed,orbit);equipmentVisuals.update(world,view,elapsed,dt,view==='wardrobe'?previewLoadout:save.loadout);hudClock+=dt;if(hudClock>.08){updateHUD();hudClock=0;}if(toastUntil&&elapsed>toastUntil){toastNode.classList.remove('show');toastUntil=0;}requestAnimationFrame(frame);
}
render();requestAnimationFrame(frame);
