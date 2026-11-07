import {COURSE,SKINS,clamp,makeRunner,stepRunner,botInput,standings} from './course.mjs';
import {Stadium} from './scene.mjs';
import {TRACK_ID,MAPS,selectTrack,sectionName} from './tracks.mjs';
import {ACCESSORIES,CATEGORIES,DYES,DEFAULT_LOOK,migrateSave,equipOwned,buyAccessory,raceReward,PODIUM_PRIZES} from './progression.mjs';
const $=s=>document.querySelector(s),qa=new URLSearchParams(location.search).has('qa'),saveKey=`party-dash-v1${qa?'-qa':''}`;
let rawSave;try{rawSave=JSON.parse(localStorage.getItem(saveKey)||'null');}catch{}
const save=migrateSave(rawSave);selectTrack(save.track);
const newRaceSeed=()=>crypto.getRandomValues(new Uint32Array(1))[0]||1;
function persist(){try{localStorage.setItem(saveKey,JSON.stringify(save));return true;}catch{toast('当前浏览器无法保存衣柜');return false;}}
const runners=[makeRunner({skin:save.skin}),...Array.from({length:11},(_,i)=>makeRunner({id:i+1,x:((i+1)%4-1.5)*2.05,z:10+Math.floor(i/4)*1.1,skin:['cat','shark','robot','duck','astro','cat','shark','gold','robot','duck','astro'][i],speed:7.3}))];
const game={raceSeed:newRaceSeed(),state:'lobby',time:0,countdown:3.0,round:0,finishedCount:0,place:1,preview:save.skin,category:'skin',previewLook:{...save.loadout},returnTo:'lobby',result:null,events:[],paused:false,collected:new Set(),raceCoins:0};
const input={x:0,z:0,jumpPressed:false,divePressed:false},keys=new Set(),physicalPointers=new Set();let stickX=0,stickZ=0,stickPointer=null,jumpPointer=null,audio,lastHUD=0,thumbnails={};
$('#ui').innerHTML='<div class="loader"><b class="outlined">冲鸭！障碍派对</b><small>正在准备赛场…</small></div>';
let stadium;
try{stadium=new Stadium($('#scene'),runners,save.loadout);thumbnails=stadium.thumbnails();}catch(error){$('#ui').innerHTML='<div class="loader"><div class="loading-error"><b>赛场未能启动</b><p>请在支持 WebGL 的 Chrome 或 Edge 中开启硬件加速后重试。</p></div></div>';throw error;}
function event(type,detail={}){game.events.push({type,t:+game.time.toFixed(2),...detail});if(game.events.length>120)game.events.shift();}
function fmt(t){return t===null?'—':`${t.toFixed(1)}s`;}
function sound(kind){if(!save.sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const notes={jump:[420,610],land:[160],hit:[160,110],fall:[240,170,100],start:[523,659,880],count:[650],win:[523,659,784,1047],coin:[1047,1397],tap:[480],dive:[280,620],spring:[400,700,1000]}[kind]??[440],t=audio.currentTime;notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type=kind==='hit'?'triangle':'sine';o.frequency.setValueAtTime(f,t+i*.065);g.gain.setValueAtTime(.001,t+i*.065);g.gain.exponentialRampToValueAtTime(.045,t+i*.065+.008);g.gain.exponentialRampToValueAtTime(.001,t+i*.065+.14);o.connect(g);g.connect(audio.destination);o.start(t+i*.065);o.stop(t+i*.065+.17);});}catch{}}
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,2200);}
function clearInput(){keys.clear();stickX=stickZ=0;stickPointer=jumpPointer=null;input.x=input.z=0;input.jumpPressed=input.divePressed=false;$('.knob')?.style.setProperty('transform','none');$('.jump')?.classList.remove('held');}
const coin=()=>`<div class="coin"><i>✦</i><b>${save.coins}</b></div>`;
const soundButton=()=>`<button class="round-btn" data-action="sound" aria-label="${save.sound?'关闭声音':'开启声音'}" title="声音">${save.sound?'♪':'♩'}</button>`;
const logo='<div class="small-brand outlined">PARTY<br><em>DASH!</em></div>';
function bindActions(){document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{if(game.state==='result'&&performance.now()<game.resultReadyAt)return;sound('tap');({start:startRace,closet:()=>wardrobe(game.state),back:closeWardrobe,sound:toggleSound,pause:pause,resume:resume,lobby:lobby,buy:buySelected,help:showHelp,maps:showMaps,closemaps:closeMaps,shuffle:shuffleLook,turn:()=>{stadium.inspectAngle=(stadium.inspectAngle??0)+Math.PI;},fold:()=>{stadium.previewFolded=!stadium.previewFolded;const b=$('[data-action=fold]');if(b)b.textContent=stadium.previewFolded?'展翼':'收翼';}})[b.dataset.action]?.();});}
function showHelp(){
 const layer=document.createElement('div');layer.className='paused-screen';layer.innerHTML=`<section class="pause-box" role="dialog" aria-modal="true" aria-label="操作说明" tabindex="-1"><h2 class="outlined">准备好开跑了吗？</h2><p>左手拖动摇杆移动，右手点击跳跃。<br>空中再点一次，可以向前飞扑。<br>电脑也可用 WASD / 方向键 + 空格。<br>安全直道跳跃后再飞扑，也能抢出距离。<br><br>你和 11 位电脑对手竞速：1 位新手、2 位熟练、3 位高手、5 位技巧型。只有前三名获得奖金。<br>${COURSE.hint}<br>冠军 200、亚军 140、季军 100 金币。<br>赛道收集仅在进入前三后结算，第 4 名起本场收入为 0。</p><button class="big-btn">知道了，冲鸭！</button></section>`;$('#ui').append(layer);layer.querySelector('button').onclick=()=>layer.remove();layer.querySelector('section').focus();
}
function toggleSound(){save.sound=!save.sound;persist();if(!save.sound&&audio)audio.suspend();const b=$('[data-action="sound"]');if(b){b.textContent=save.sound?'♪':'♩';b.setAttribute('aria-label',save.sound?'关闭声音':'开启声音');}toast(save.sound?'声音开启':'声音关闭');}
function lobby(){
 clearInput();game.state='lobby';game.paused=false;stadium.view='lobby';resetRunners();stadium.setSkin(0,save.skin);stadium.setLook(0,save.loadout);game.preview=save.skin;document.body.classList.remove('dressing');document.body.classList.toggle('adorned',save.loadout.head!=='head_none'||save.loadout.back!=='back_none');
 $('#ui').innerHTML=`<header class="topbar">${logo}<div class="top-tools">${coin()}${soundButton()}</div></header><div class="hero-logo"><span class="en outlined">PARTY DASH!</span><strong>冲鸭！</strong><strong>障碍派对</strong></div><div class="lobby-actions"><div class="prize-strip" aria-label="前三名奖金">${PODIUM_PRIZES.map((n,i)=>`<span><b>${['冠军','亚军','季军'][i]}</b> ${n} <i>✦</i></span>`).join('')}</div><button class="big-btn" data-action="start">开跑！ ▶</button><div class="lobby-row"><button class="alt-btn" data-action="closet">装扮工坊</button><button class="alt-btn" data-action="maps">选择地图 <span class="new-dot">${MAPS.length}</span></button><button class="round-btn help-button" data-action="help" aria-label="操作说明">?</button></div><div class="mode-note outlined">${COURSE.name} · ${COURSE.distance??COURSE.start-COURSE.finish}米 · 11位电脑对手</div><div class="best-note outlined">${save.best?`个人最佳 ${fmt(save.best)} · `:''}${save.wins} 次冠军</div></div>`;
 bindActions();
}
function showMaps(){
 clearTimeout(toast.timer);$('#toast').hidden=true;clearInput();game.mapReturn=game.state;game.state='maps';
 const layer=document.createElement('div');layer.className='map-screen';layer.innerHTML=`<section class="map-dialog" role="dialog" aria-modal="true" aria-label="选择比赛地图"><header><div><small>CHOOSE YOUR COURSE</small><h2>下一站，去哪跑？</h2></div><button class="round-btn" data-action="closemaps" aria-label="关闭地图选择">×</button></header><div class="map-grid">${MAPS.map((m,i)=>`<button class="map-card ${m.id===TRACK_ID?'active':''}" style="--accent:${m.accent}" data-map="${m.id}" aria-label="选择${m.name}" aria-pressed="${m.id===TRACK_ID}"><div class="map-art ${m.theme}"><img src="${m.preview}" alt="${m.name}三维赛场" onerror="this.hidden=true"><span>${i===0?'经典':'新地图'}</span><b>${m.distance??m.start-m.finish} m</b></div><div class="map-copy"><h3>${m.name}</h3><p>${m.tag}</p><small>${save.bestTracks[m.id]?`最佳 ${fmt(save.bestTracks[m.id])}`:'等待你的第一个纪录'}${m.id===TRACK_ID?' · 当前地图':''}</small></div></button>`).join('')}</div><p class="map-footer">${MAPS.length} 张地图全部开放 · 每张地图独立记录最佳成绩</p></section>`;$('#ui').append(layer);bindActions();
 layer.querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>{if(selectTrack(b.dataset.map)){save.track=TRACK_ID;save.best=save.bestTracks[TRACK_ID]??null;resetRunners();stadium.setCourse();persist();lobby();toast(`${COURSE.name}，准备开跑！`);}});layer.querySelector('[data-action=closemaps]').focus();
}
function closeMaps(){game.state=game.mapReturn;$('.map-screen')?.remove();}
function resetRunners(){
 for(const [i,p]of runners.entries())Object.assign(p,makeRunner({id:i,x:i?(i%4-1.5)*2.05:0,z:i?10+Math.floor((i-1)/4)*1.1:8,skin:i?p.skin:save.skin,speed:7.3,raceSeed:game.raceSeed}));
}
const jumpSVG='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M21 43V16l-9 9-6-6L24 2l18 17-6 6-9-9v27z"/></svg>';
function raceUI(){
 $('#ui').innerHTML=`<div class="race-hud"><div class="objective"><small>目标</small><b>争夺前三！</b></div><div class="race-right"><div class="qualify"><small>完赛</small><b id="finished-count">0/12</b></div><button class="round-btn" data-action="pause" aria-label="暂停比赛">Ⅱ</button></div></div><div class="race-info"><span class="place">第 <b id="place">1</b> / 12</span><span class="clock" id="clock">00.0</span><span class="race-earn" id="race-earn">✦ 0</span></div><div class="section-name outlined" id="section-name">${COURSE.name}</div><div class="progress-track"><i id="progress"></i></div><div class="countdown" id="countdown">3</div><div class="touch-controls"><div class="stick" role="application" aria-label="移动摇杆"><div class="knob"></div></div><button class="jump" aria-label="跳跃，空中再次点击飞扑">${jumpSVG}<span id="jump-text">跳跃</span></button></div><div class="tutorial">拖动摇杆移动 · 点按跳跃 · 空中再点飞扑</div><div class="game-tip" id="game-tip">${COURSE.hint}</div>`;
 bindActions();bindTouch();
}
function startRace(){
 clearInput();game.raceSeed=newRaceSeed();resetRunners();lastHUD=-1;if(stadium.avatars.get(0).skin!==save.skin)stadium.setSkin(0,save.skin);game.round++;Object.assign(game,{state:'countdown',time:0,countdown:3.0,finishedCount:0,place:1,result:null,events:[],paused:false,collected:new Set(),raceCoins:0});stadium.resetCoins();stadium.setLook(0,save.loadout);stadium.view='race';stadium.update(0,0,true);raceUI();event('start');
}
function jumpAction(){if(game.state!=='racing'||game.paused)return;const p=runners[0];if(p.grounded||p.coyote>0)input.jumpPressed=true;else input.divePressed=true;}
function bindTouch(){
 const stick=$('.stick'),button=$('.jump');
 function move(e){const r=stick.getBoundingClientRect(),max=r.width*.31,dx=e.clientX-r.left-r.width/2,dz=e.clientY-r.top-r.height/2,n=Math.hypot(dx,dz),k=n>max?max/n:1;stickX=dx*k/max;stickZ=dz*k/max;if(n<6)stickX=stickZ=0;$('.knob').style.transform=`translate(${dx*k}px,${dz*k}px)`;}
 stick.onpointerdown=e=>{if(game.state!=='racing'||game.paused)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);move(e);};stick.onpointermove=e=>{if(e.pointerId===stickPointer){e.preventDefault();move(e);}};
 for(const name of['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,e=>{if(e.pointerId===stickPointer){stickPointer=null;stickX=stickZ=0;$('.knob').style.transform='none';}});
 button.onpointerdown=e=>{if(game.state!=='racing'||game.paused)return;e.preventDefault();jumpPointer=e.pointerId;button.setPointerCapture(e.pointerId);button.classList.add('held');jumpAction();};
 for(const name of['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,e=>{if(e.pointerId===jumpPointer){jumpPointer=null;button.classList.remove('held');}});
}
function pause(){if(!['racing','countdown'].includes(game.state)||game.paused)return;clearInput();game.paused=true;event('pause');const layer=document.createElement('div');layer.className='paused-screen';layer.innerHTML=`<section class="pause-box" role="dialog" aria-modal="true" aria-label="比赛暂停"><h2 class="outlined">休息一下</h2><button class="big-btn" data-action="resume">继续比赛 ▶</button><button class="alt-btn" data-action="start">重新开跑</button><button class="alt-btn" data-action="lobby">返回大厅</button><p>比赛和电脑对手都已暂停。</p></section>`;$('#ui').append(layer);bindActions();layer.querySelector('button').focus();}
function resume(){game.paused=false;$('.paused-screen')?.remove();event('resume');}
function wardrobe(previous){
 clearInput();game.returnTo=previous;game.state='wardrobe';game.preview=save.skin;game.category='skin';game.previewLook={...save.loadout};stadium.view='wardrobe';stadium.inspectAngle=0;stadium.previewFolded=false;document.body.classList.add('dressing');renderWardrobe();
}
function wardrobeItems(){return game.category==='skin'?SKINS:ACCESSORIES.filter(a=>a.slot===game.category);}
function selectedItem(){return wardrobeItems().find(s=>s.id===(game.category==='skin'?game.preview:game.previewLook[game.category]));}
function renderWardrobe(){
 const previousGrid=$('.boutique-grid'),previousScroll=previousGrid?.dataset.categoryGrid===game.category?previousGrid.scrollTop:0;
 const items=wardrobeItems(),selected=selectedItem(),body=SKINS.find(s=>s.id===game.preview),owned=game.category==='skin'?save.unlocked.includes(selected.id):save.ownedAccessories.includes(selected.id),legend=!!selected.wins,afford=save.coins>=(selected.price??Infinity);
 if(stadium.avatars.get(0).skin!==body.id)stadium.setSkin(0,body.id);stadium.setLook(0,game.previewLook);
 if(game.category!=='skin'&&!thumbnails[items[0].id])Object.assign(thumbnails,stadium.accessoryThumbnails(items));
 const label=owned?'保存当前搭配':legend?'赢得 3 次冠军解锁':afford?`${selected.price} 金币 · 买下并装备`:`还差 ${selected.price-save.coins} 金币`;
 $('#ui').innerHTML=`<button class="round-btn back-button" data-action="back" aria-label="返回">‹</button><div class="wardrobe-title outlined">装扮工坊</div><div class="topbar" style="pointer-events:none;justify-content:flex-end">${coin()}</div><div class="skin-name outlined"><span class="rarity">${selected.rarity}</span><b>${selected.name}</b><p>${owned?'已拥有 · 自由搭配其他部位':legend?`冠军进度 ${save.wins} / 3`:'试穿不扣金币，买下才解锁'}</p></div><div class="model-hitbox" aria-label="拖动旋转角色"></div><div class="inspect-buttons"><button data-action="turn" aria-label="转身查看">↻</button><button data-action="fold" aria-label="展开或收起羽翼">${stadium.previewFolded?'展翼':'收翼'}</button></div><section class="wardrobe-panel boutique-panel"><nav class="category-tabs" aria-label="装扮分类">${CATEGORIES.map(c=>`<button data-category="${c.id}" class="${game.category===c.id?'active':''}" aria-pressed="${game.category===c.id}">${c.name}</button>`).join('')}</nav><div class="skin-grid boutique-grid" data-category-grid="${game.category}">${items.map(item=>{const has=game.category==='skin'?save.unlocked.includes(item.id):save.ownedAccessories.includes(item.id);return `<button class="skin-tile ${item.id===selected.id?'active':''} ${has?'':'locked'}" data-item="${item.id}" aria-label="预览${item.name}" aria-pressed="${item.id===selected.id}"><img src="${thumbnails[item.id]}" alt="${item.name}的3D造型"><b>${item.name}</b>${has?'':`<span class="lock">${item.wins?'3 冠军':item.price+' ✦'}</span>`}</button>`;}).join('')}</div><div class="dye-row"><span>装饰配色</span><div class="swatches">${DYES.map((c,i)=>`<button data-dye="${c}" style="--dye:${c}" class="${c===game.previewLook.color?'active':''}" aria-label="配色${i+1}" aria-pressed="${c===game.previewLook.color}"></button>`).join('')}</div><button class="shuffle-btn" data-action="shuffle">随机搭配</button></div><button class="big-btn" data-action="buy" ${!owned&&(!afford||legend)?'disabled':''}>${label}</button><div class="wardrobe-note outlined">头饰 + 背饰 + 尾迹可独立组合 · 外观不改变比赛能力</div></section>`;
 const hit=$('.model-hitbox');let dragX=null;hit.onpointerdown=e=>{dragX=e.clientX;hit.setPointerCapture(e.pointerId);};hit.onpointermove=e=>{if(dragX!==null){e.preventDefault();stadium.inspectAngle=(stadium.inspectAngle??0)+(e.clientX-dragX)*.012;dragX=e.clientX;}};hit.onpointerup=hit.onpointercancel=()=>dragX=null;
 $('.boutique-grid').scrollTop=previousScroll;bindActions();document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{if(game.category==='skin')game.preview=b.dataset.item;else game.previewLook[game.category]=b.dataset.item;renderWardrobe();sound('tap');});
 document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{game.category=b.dataset.category;renderWardrobe();});
 document.querySelectorAll('[data-dye]').forEach(b=>b.onclick=()=>{game.previewLook.color=b.dataset.dye;renderWardrobe();});
}
function buySelected(){
 const item=selectedItem();let spent=0;
 if(game.category==='skin'){
  if(!save.unlocked.includes(item.id)){if(item.wins||save.coins<item.price)return;spent=item.price;save.coins-=item.price;save.unlocked.push(item.id);}save.skin=item.id;runners[0].skin=item.id;equipOwned(save,game.previewLook);
 }else{
  const result=buyAccessory(save,item.id,game.previewLook);if(!result.ok)return;if(result.bought)spent=item.price;
 }
 persist();sound(spent?'coin':'tap');event('outfit',{id:item.id,spent});toast(spent?`${item.name} 已解锁并装备！`:'搭配已保存，开跑就能穿上！');renderWardrobe();
}
function shuffleLook(){for(const slot of['head','back','trail']){const choices=ACCESSORIES.filter(a=>a.slot===slot&&save.ownedAccessories.includes(a.id));game.previewLook[slot]=choices[Math.floor(Math.random()*choices.length)].id;}game.previewLook.color=DYES[Math.floor(Math.random()*DYES.length)];renderWardrobe();toast('已搭好一套，喜欢就点保存');}
function closeWardrobe(){document.body.classList.remove('dressing');if(stadium.avatars.get(0).skin!==save.skin)stadium.setSkin(0,save.skin);stadium.setLook(0,save.loadout);if(game.returnTo==='result'){game.state='result';stadium.view='result';renderResult();}else lobby();}
function finishRace(timedOut=false){
 if(game.state!=='racing')return;clearInput();game.state='result';game.paused=false;
 const order=standings(runners),rank=order.findIndex(p=>p.id===0)+1,finished=!timedOut&&runners[0].finishTime!==null,podium=finished&&rank<=3,win=podium&&rank===1,reward=raceReward(rank,finished,game.raceCoins),banked=podium?game.raceCoins:0;
 const third=order[2],gap=finished&&rank>3&&third?.finishTime!==null?Math.max(0,game.time-third.finishTime):null;
 save.coins+=reward;save.races++;if(win)save.wins++;if(save.wins>=3&&!save.unlocked.includes('gold'))save.unlocked.push('gold');
 if(finished&&(!save.best||game.time<save.best))save.best=+game.time.toFixed(3);save.bestTracks[TRACK_ID]=save.best;persist();
 game.resultBlockedPointers=new Set(physicalPointers);game.resultReadyAt=physicalPointers.size?Infinity:performance.now()+350;
 game.result={rank,podium,win,reward,prize:podium?PODIUM_PRIZES[rank-1]:0,collected:game.raceCoins,banked,gap,time:game.time,timedOut};stadium.view='result';stadium.celebrate=podium;runners[0].vx=runners[0].vz=0;runners[0].waiting=0;runners[0].y=0;
 sound(podium?'win':'fall');stadium.burst(45,3.6,5,podium?70:0);event('result',{rank,podium,reward});renderResult();
}
function unlockResultButtons(){if(game.state==='result'&&performance.now()>=game.resultReadyAt)document.querySelectorAll('.result-actions button').forEach(b=>b.disabled=false);}
function renderResult(){
 const r=game.result,title=r.podium?['冠军！','亚军！','季军！'][r.rank-1]:r.timedOut?'下次再冲！':r.gap<=3?'差一点！':'完成比赛！';
 const caption=r.win?'这次，你就是全场最靓的鸭。':r.podium?'登上领奖台，奖金到手！':r.timedOut?'先熟悉路线，再来一次。':`距离第三名 ${r.gap.toFixed(2)} 秒，下次争夺领奖台！`;
 const note=r.podium?`名次奖金 ${r.prize} + 赛道收集 ${r.banked}`:`第 4 名起无奖金 · 本场收集 ${r.collected} 不结算`;
 $('#ui').innerHTML=`<header class="topbar">${logo}<div class="top-tools">${coin()}${soundButton()}</div></header><div class="result-title"><strong>${title}</strong><small class="outlined">${caption}</small></div><div class="result-panel"><div class="result-stats outlined"><div>本场名次<strong>第 ${r.rank} 名</strong></div><div>${r.timedOut?'比赛用时':'冲线用时'}<strong>${fmt(r.time)}</strong></div><div>本场收入<strong class="reward">+${r.reward} ✦</strong></div></div><div class="result-actions"><button class="big-btn" data-action="start">再跑一场 ▶</button><button class="alt-btn" data-action="closet">装扮工坊</button></div><button class="change-map" data-action="maps">换张地图 →</button><div class="result-note outlined">${note}<br>${save.wins>=3?'冠军金鸭已解锁':`金鸭冠军进度 ${save.wins} / 3`}</div></div>`;bindActions();if(performance.now()<game.resultReadyAt){document.querySelectorAll('.result-actions button').forEach(b=>b.disabled=true);if(Number.isFinite(game.resultReadyAt))setTimeout(unlockResultButtons,Math.max(0,game.resultReadyAt-performance.now()+10));}
}
function tick(dt){
 if(game.paused||!['countdown','racing'].includes(game.state))return;
 if(game.state==='countdown'){
  const previous=Math.ceil(game.countdown);game.countdown-=dt;const next=Math.ceil(game.countdown);if(next!==previous&&next>0)sound('count');$('#countdown').textContent=next>0?String(next):'GO!';
  if(game.countdown<=-.5){game.state='racing';$('#countdown').remove();sound('start');event('go');}return;
 }
 game.time+=dt;
 input.x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)||stickX;
 input.z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)||stickZ;
 const events=stepRunner(runners[0],input,dt,game.time);input.jumpPressed=input.divePressed=false;
 for(const kind of events){event(kind);if(['jump','dive','hit','fall','land','spring'].includes(kind))sound(kind);if(kind==='spring')toast('弹簧飞跃！空中稳住方向');if(kind==='hit')toast('被碰到了，稳住继续冲！');if(kind==='fall')toast('回到检查点，继续追！');if(kind==='checkpoint')toast('检查点！前面还有机会反超');if(kind==='land')stadium.burst(runners[0].x,.12,runners[0].z,4);}
 for(const c of COURSE.coins)if(!game.collected.has(c.id)&&Math.hypot(runners[0].x-c.x,runners[0].z-c.z)<.85&&runners[0].y<1.7){game.collected.add(c.id);game.raceCoins+=c.value;stadium.collectCoin(c.id);sound('coin');event('coin',{id:c.id,value:c.value});}
 for(const p of runners.slice(1)){const es=stepRunner(p,botInput(p,game.time),dt,game.time);if(es.includes('hit'))stadium.burst(p.x,p.y+1,p.z,5);}
 const order=standings(runners);game.place=order.findIndex(p=>p.id===0)+1;game.finishedCount=runners.filter(p=>p.finishTime!==null).length;
 if(runners[0].finishTime!==null){finishRace();return;}
 if(game.time>COURSE.timeLimit){finishRace(true);return;}
 if(game.time-lastHUD>.08){lastHUD=game.time;$('#finished-count').textContent=`${game.finishedCount}/12`;$('#place').textContent=game.place;$('#clock').textContent=game.time.toFixed(1);$('#progress').style.width=`${clamp((COURSE.start-runners[0].z)/(COURSE.start-COURSE.finish),0,1)*100}%`;const airborne=!runners[0].grounded;$('.jump').classList.toggle('air',airborne);$('#jump-text').textContent=airborne?'飞扑':'跳跃';const z=runners[0].z;$('#section-name').textContent=sectionName(z);$('#race-earn').textContent='✦ '+game.raceCoins+' 待结算';$('#game-tip').hidden=game.time>6;}
}
document.addEventListener('pointerdown',e=>physicalPointers.add(e.pointerId),true);
for(const type of['pointerup','pointercancel'])document.addEventListener(type,e=>{physicalPointers.delete(e.pointerId);if(game.state==='result'&&game.resultBlockedPointers?.delete(e.pointerId)&&game.resultBlockedPointers.size===0){game.resultReadyAt=performance.now()+200;setTimeout(unlockResultButtons,210);}},true);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(game.paused)resume();else if(game.state==='wardrobe')closeWardrobe();else if(game.state==='maps')closeMaps();else pause();return;}
 if(e.key==='Tab'&&game.paused){const controls=[...$('.paused-screen').querySelectorAll('button')],index=controls.indexOf(document.activeElement);if(e.shiftKey&&index<=0){e.preventDefault();controls.at(-1).focus();}else if(!e.shiftKey&&index===controls.length-1){e.preventDefault();controls[0].focus();}return;}
 if(game.state!=='racing'||game.paused)return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown',' '].includes(key)){e.preventDefault();keys.add(key);if(key===' '&&!e.repeat)jumpAction();}
});document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{clearInput();physicalPointers.clear();if(game.state==='result'){game.resultBlockedPointers?.clear();game.resultReadyAt=performance.now()+200;setTimeout(unlockResultButtons,210);}pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();physicalPointers.clear();pause();}});
window.render_game_to_text=()=>JSON.stringify({state:game.state,paused:game.paused,time:+game.time.toFixed(3),round:game.round,countdown:+game.countdown.toFixed(2),place:game.place,finishedCount:game.finishedCount,player:{...runners[0]},runners:runners.map(p=>({id:p.id,x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),skin:p.skin,tier:p.tier,skill:p.skill,speed:p.speed,pace:p.pace,hits:p.hits,stun:p.stun,hurt:p.hurt,mistakes:p.mistakes,tricks:p.tricks,dives:p.dives,finishTime:p.finishTime,falls:p.falls})),result:game.result,wardrobe:{...save},preview:game.preview,previewLook:{...game.previewLook},track:TRACK_ID,theme:COURSE.theme,raceSeed:game.raceSeed,trackLength:COURSE.distance??COURSE.start-COURSE.finish,raceCoins:game.raceCoins,events:game.events.slice(-35)});
let previous=performance.now(),accumulator=0,visualTime=0;
function frame(now){
 if(document.hidden){previous=now;accumulator=0;requestAnimationFrame(frame);return;}
 const playing=['racing','countdown'].includes(game.state)&&!game.paused,budget=playing?1000/40:1000/20;
 if(now-previous<budget){requestAnimationFrame(frame);return;}const elapsed=Math.min((now-previous)/1000,.08);previous=now;visualTime+=elapsed;accumulator+=elapsed;while(accumulator>=1/100){tick(1/100);accumulator-=1/100;}stadium.update(game.time,elapsed,false,visualTime);requestAnimationFrame(frame);
}
lobby();requestAnimationFrame(frame);
