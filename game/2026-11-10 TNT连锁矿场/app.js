import {TYPES,LESSONS,COLS,MIN_RANDOM_ENERGY,DEPTH_SUPPLIES,createRun,strike,frontier,achieved,cashOut,rating,validRun,cacheRoute,repairRun,upgradeRun} from './core.mjs';
import {MineScene} from './scene.js';
import {MineAudio} from './audio.js';
const $=id=>document.getElementById(id),QA=new URLSearchParams(location.search).get('qa')==='1',KEY=`tnt-mine-rush-v1${QA?'-qa':''}`;
const defaults={stars:[0,0,0],best:0,sound:true,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,run:null};
let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
let store={...defaults,...saved};if(!Array.isArray(store.stars)||store.stars.length!==3)store.stars=[0,0,0];
let run=validRun(store.run)&&(store.run.status==='active'||store.run.mode==='random'&&store.run.status==='exhausted')?store.run:createRun(),scene,busy=false,action=null,modalOpen=false,returnFocus=null,toastUntil=0,chainUntil=0,resupplyUntil=0,now=0,last=performance.now(),finalPending=false;
const migration=upgradeRun(run);
const audio=new MineAudio();audio.enabled=store.sound;
const iconSound=(on)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/>${on?'<path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>':'<path d="m16 9 5 6m0-6-5 6"/>'}</svg>`;
function persist(){store.run=run;try{localStorage.setItem(KEY,JSON.stringify(store));}catch{}}
function newSeed(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0];}
function seedName(){return run.seed.toString(16).padStart(8,'0').toUpperCase();}
function updateUI(){
  const lesson=LESSONS[run.index];$('mode-label').textContent=run.mode==='lesson'?`FIELD NOTES · 0${run.index+1}`:`EXPEDITION · ${seedName()}`;
  $('mine-name').textContent=run.mode==='lesson'?lesson.name:'The deep spark';$('score').textContent=run.score.toLocaleString('en-US');
  $('goal-eyebrow').textContent=run.mode==='lesson'?lesson.subtitle:'A TREASURE AT THE BOTTOM';$('goal-text').textContent=run.mode==='lesson'?lesson.goal:'Find the cache at 24 m';
  $('goal-progress').textContent=run.mode==='random'||lesson.cache?`${Math.min(run.depth,run.grid.length)} / ${run.grid.length} m`:lesson.diamonds?`${run.loot.diamond} / ${lesson.diamonds}`:`${run.score} / ${lesson.target}`;
  $('energy').textContent=run.energy;$('max-energy').textContent=run.maxEnergy;$('energy-fill').style.width=`${Math.max(0,run.energy/run.maxEnergy*100)}%`;$('energy-fill').classList.toggle('low',run.energy/run.maxEnergy<.25);
  const nextSupply=run.mode==='random'&&DEPTH_SUPPLIES.find(s=>!run.depthBonuses.includes(s.depth));$('pickaxe-label').textContent=run.mode!=='random'?'PICKAXE':nextSupply?`PICKAXE · +${nextSupply.amount} AT ${nextSupply.depth} M`:'PICKAXE · SUPPLIES ✓';
  for(const t of ['coal','gold','diamond'])$(`${t}-count`).textContent=run.loot[t];
  $('best-chain').textContent=run.bestChain?`BEST CHAIN ×${run.bestChain}`:'BEST CHAIN —';
  $('finish').disabled=busy||run.strikes===0;$('mines').disabled=busy;$('help').disabled=busy;
  $('route-hint').hidden=run.mode!=='random';$('route-hint').disabled=busy||run.status!=='active';
  $('tip').textContent=run.strikes===0?(run.mode==='lesson'?lesson.hint:'52 hits to start · +6 at 8 m · +6 at 16 m'):run.energy<=6?'Only a few hits left. Make the next spark count.':run.mode==='lesson'&&run.index===0&&run.blasts===0?'The outlined blocks are within reach. Dig toward the TNT.':'Tap outlined blocks to dig · Drag to look around';
  $('sound').innerHTML=iconSound(store.sound);$('sound').setAttribute('aria-label',store.sound?'Mute sound':'Enable sound');document.body.classList.toggle('reduced-motion',store.reduced);if(scene)scene.reduced=store.reduced;
  $('announcer').textContent=`${run.energy} hits left. ${run.score} treasure. ${run.loot.diamond} diamonds.`;
}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=now+2.7;}
function showResupply(supplies){const amount=supplies.reduce((n,s)=>n+s.amount,0);$('resupply-depth').textContent=`${supplies.map(s=>s.depth+' M').join(' + ')} ${supplies.length>1?'CHECKPOINTS':'CHECKPOINT'}`;$('resupply-amount').textContent=`+${amount} PICKAXE HITS`;$('resupply-banner').hidden=false;$('resupply-banner').classList.remove('show');void $('resupply-banner').offsetWidth;$('resupply-banner').classList.add('show');resupplyUntil=now+3.8;audio.resupply();}
function clearResupply(){$('resupply-banner').hidden=true;$('resupply-banner').classList.remove('show');resupplyUntil=0;}
function targets(s,edge,project,size){
  const container=$('cell-targets');const existing=new Map([...container.children].map(e=>[e.dataset.cell,e]));
  for(let r=0;r<s.grid.length;r++)for(let c=0;c<COLS;c++){
    const type=s.grid[r][c],key=`${r},${c}`;if(!type)continue;const p=project(r,c);if(p.y<30||p.y>scene?.height-12||p.x<0||p.x>scene?.width)continue;
    let b=existing.get(key);if(b)existing.delete(key);else{b=document.createElement('button');b.className='cell-target';b.dataset.cell=key;b.tabIndex=-1;b.addEventListener('click',()=>mine(r,c));b.addEventListener('keydown',e=>cellKey(e,r,c));container.append(b);}
    const hits=TYPES[type].hp-s.hits[r][c],reachable=edge?.has(key);b.setAttribute('aria-label',`Row ${r+1}, column ${c+1}: ${TYPES[type].name}. ${type==='bedrock'?'Unbreakable':`${hits} ${hits===1?'hit':'hits'}${reachable?', within reach':', dig a path first'}`}`);
    b.style.left=`${p.x}px`;b.style.top=`${p.y}px`;b.style.width=b.style.height=`${size}px`;b.dataset.reachable=reachable?'true':'false';
  }
  for(const b of existing.values())b.remove();
}
function cellKey(e,r,c){const d={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key];if(!d)return;e.preventDefault();let rr=r,cc=c;for(let i=0;i<24;i++){rr+=d[0];cc+=d[1];if(rr<0||rr>=run.grid.length||cc<0||cc>=7)break;if(run.grid[rr][cc]){scene.follow(rr+1,true);scene.setHover({r:rr,c:cc});$(`cell-targets`).querySelector(`[data-cell="${rr},${cc}"]`)?.focus();break;}}}
function hover(r,c){if(r===null||busy||modalOpen)return;const t=run.grid[r]?.[c];if(!t)return;const remaining=TYPES[t].hp-run.hits[r][c];$('tip').textContent=t==='bedrock'?'Bedrock cannot be mined. Find another route.':t==='tnt'?'TNT · 1 hit · Blasts a 3×3 area · Chains into nearby TNT':`${TYPES[t].name} · ${remaining} ${remaining===1?'hit':'hits'}${TYPES[t].value?` · +${TYPES[t].value} treasure`:''} · ${frontier(run).has(`${r},${c}`)?'Within reach':'Dig a path to it'}`;}
function mine(r,c){
  if(modalOpen||busy||run.status!=='active')return;audio.unlock();const outcome=strike(run,r,c);
  if(!outcome.ok){toast(outcome.reason==='bedrock'?'Bedrock stays put. Try a different route.':'Dig an outlined block to reach this one.');return;}
  busy=true;persist();scene.swing=1;
  const maxWave=Math.max(...outcome.events.map(e=>e.wave));
  action={r,c,events:outcome.events.map(e=>({...e,time:now+e.wave*.19+(e.kind==='blast'?.07:0)})),supplies:outcome.events.filter(e=>e.kind==='supply'),end:now+maxWave*.19+(outcome.chain?.58:.23),chain:outcome.chain,played:0};
  audio.hit(outcome.events[0]?.type);$('finish').disabled=true;$('mines').disabled=true;$('help').disabled=true;
}
function finishAction(){
  const a=action;action=null;busy=false;scene.finishAction(a.r,a.c);updateUI();persist();
  if(a.supplies.length){const amount=a.supplies.reduce((n,s)=>n+s.amount,0);showResupply(a.supplies);$('tip').textContent=`${a.supplies.map(s=>s.depth+' m').join(' / ')} resupply: +${amount} hits!`;$('energy-fill').classList.remove('resupplied');void $('energy-fill').offsetWidth;$('energy-fill').classList.add('resupplied');}
  if(a.chain>=2){$('chain').innerHTML=`<small>ONE SPARK</small><strong>CHAIN ×${a.chain}</strong><span>${a.chain>=5?'Now that is a discovery.':'Beautifully connected.'}</span>`;$('chain').classList.add('show');chainUntil=now+1.15;}
  if(run.status!=='active'){finalPending=true;chainUntil=Math.max(chainUntil,now+.6);}else if(run.energy===5)toast('5 hits left. Look for a TNT shortcut.');
}
function process(dt){now+=dt;
  if(action){while(action.events.length&&action.events[0].time<=now){const e=action.events.shift();if(e.kind!=='supply')scene.animateEvent(e);if(e.kind==='blast'){audio.blast(++action.played);}else if(e.kind==='break'&&e.value)audio.loot(e.type);}if(!action.events.length&&now>=action.end)finishAction();}
  if(toastUntil&&now>toastUntil){$('toast').classList.remove('show');toastUntil=0;}
  if(resupplyUntil&&now>resupplyUntil)clearResupply();
  if(chainUntil&&now>chainUntil){$('chain').classList.remove('show');chainUntil=0;if(finalPending){finalPending=false;showResults();}}
}
// Effects use elapsed active time, not frame count: low frame rates must not
// stretch a half-second chain into a multi-second input lock.
function tick(t){const dt=Math.max(0,(t-last)/1000);last=t;if(!document.hidden&&!modalOpen)process(dt);requestAnimationFrame(tick);}
function float(e,p){const f=document.createElement('span');f.className=`floater ${e.type}`;f.textContent=`+${e.value}`;f.style.left=`${p.x}px`;f.style.top=`${p.y}px`;$('floaters').append(f);f.addEventListener('animationend',()=>f.remove(),{once:true});}
function closeModal(){modalOpen=false;$('modal-layer').hidden=true;returnFocus?.focus();returnFocus=null;}
function openModal(html){clearResupply();returnFocus??=document.activeElement;modalOpen=true;$('modal-layer').hidden=false;$('modal').innerHTML=html;$('modal').focus();}
function modalClose(){return '<button class="modal-close" aria-label="Close dialog" data-action="close">×</button>';}
function showHelp(){
  openModal(`${modalClose()}<div class="modal-eyebrow">FIELD GUIDE</div><h2>A little spark.<br>A big discovery.</h2>
    <div class="help-row"><span class="help-cube">1</span><p><strong>Start at the surface</strong>Tap an outlined block. Each tap costs 1 pickaxe hit. New openings reveal more reachable blocks.</p></div>
    <div class="help-row"><span class="help-cube diamond">•••</span><p><strong>Choose where to spend your hits</strong>Dirt & coal: 1 hit. Stone & gold: 2. Diamonds: 3. Small dots show hardness; cracks show progress.</p></div>
    <div class="help-row"><span class="help-cube tnt">TNT</span><p><strong>Find the chain reaction</strong>One hit ignites TNT. Its 3×3 blast collects everything inside for free and ignites other TNT in range.</p></div>
    <div class="help-row"><span class="help-cube" style="background:#557c60">↕</span><p><strong>Look before you dig</strong>Drag or scroll to look ahead. Tap “Dig site” to return. Your miner is safe from blasts.</p></div>
    ${run.mode==='random'?'<div class="help-row"><span class="help-cube" style="background:#188773">+6</span><p><strong>Earn room to explore</strong>Reach 8 m and 16 m to receive 6 extra hits at each depth, once per mine. Route hints and free repairs remain optional when you get stuck.</p></div>':''}
    <div class="settings-row"><span>Sound effects</span><button class="toggle" role="switch" aria-checked="${store.sound}" data-action="sound">${store.sound?'On':'Off'}</button></div>
    <div class="settings-row"><span>Reduced motion</span><button class="toggle" role="switch" aria-checked="${store.reduced}" data-action="motion">${store.reduced?'On':'Off'}</button></div>
    <p class="help-footer">Keyboard: focus the mine, choose with arrows, then Enter or Space to dig. Progress is saved in this browser.<br><br>Minecraft-inspired original art and puzzles; not an official Minecraft or Pocket Mine product.</p><button class="primary" data-action="close">Back to the mine</button>`);
}
function showMines(){
  openModal(`${modalClose()}<div class="modal-eyebrow">CHOOSE YOUR NEXT DISCOVERY</div><h2>Into the mine.</h2><p>Three field notes, then a new mine every expedition. Retry the same mine to find a better route.</p>
    ${LESSONS.map((s,i)=>`<button class="lesson-card ${run.mode==='lesson'&&run.index===i?'current':''}" data-action="lesson" data-index="${i}"><span class="lesson-number">0${i+1}</span><span><strong>${s.name}</strong><small>${s.goal} · ${s.budget} hits</small></span><span class="lesson-stars">${'★'.repeat(store.stars[i])}${'☆'.repeat(3-store.stars[i])}</span></button>`).join('')}
    <button class="lesson-card expedition-card" data-action="expedition"><span class="lesson-number">✦</span><span><strong>The deep spark</strong><small>24 m · ${MIN_RANDOM_ENERGY}+ hits · depth supplies</small></span><span class="lesson-stars">↗</span></button>
    <p class="help-footer">Start with 52 hits. Earn +6 at 8 m and +6 at 16 m. Hints and free repairs are there if needed.</p><div class="seed-line">EXPEDITION BEST · ${store.best.toLocaleString('en-US')} TREASURE</div>`);
}
function showResults(){
  const stars=rating(run),won=achieved(run),isLesson=run.mode==='lesson',canRepair=!isLesson&&run.status==='exhausted';
  if(isLesson)store.stars[run.index]=Math.max(store.stars[run.index],stars);else store.best=Math.max(store.best,run.score);persist();if(won)audio.win();
  const title=won?(isLesson?'A lovely discovery.':'The cache is yours!'):run.status==='banked'?'A pocket of treasure.':canRepair?'Keep the discovery going.':'One more spark?';
  const text=won?(isLesson?'Good routes save hits. Great routes start chain reactions.':'Twenty-four metres down. One very rewarding little expedition.'):canRepair?'Repair for free and keep this mine, your treasure and every block already cleared.':isLesson?'Try a shorter route through the TNT. Your best discoveries stay in your field notes.':'Every gem is kept in this run’s score. Retry this mine to discover a better route.';
  const primary=canRepair?'<button class="primary" data-action="repair">Free repair · continue</button>':won&&isLesson?`<button class="primary" data-action="${run.index<2?'next':'expedition'}">${run.index<2?'Next field note →':'Start an expedition →'}</button>`:'<button class="primary" data-action="retry">Try this mine again</button>';
  openModal(`<div style="text-align:center"><div class="result-art">${won?'✦':'⛏'}</div><div class="modal-eyebrow">${won?'DISCOVERY COMPLETE':run.status==='banked'?'BACK AT THE SURFACE':'PICKAXE WORN OUT'}</div><h2>${title}</h2><div class="result-stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}<span style="opacity:.25">${'☆'.repeat(3-stars)}</span></div><div class="result-value">${run.score.toLocaleString('en-US')}<small>TREASURE COLLECTED</small></div><p>${text}</p><div class="result-stats"><div><b>${run.depth} m</b><span>DEPTH</span></div><div><b>×${run.bestChain}</b><span>BEST CHAIN</span></div><div><b>${run.energy}</b><span>HITS SAVED</span></div></div></div>
    ${primary}${canRepair?'<button class="secondary" data-action="retry">Retry this mine from the start</button>':won&&isLesson?'<button class="secondary" data-action="retry">Find a better route</button>':!isLesson?'<button class="secondary" data-action="expedition">Explore a new mine</button>':''}
    <button class="secondary" data-action="mines">Choose a mine</button>${!isLesson?`<div class="seed-line" style="text-align:center">MINE ${seedName()} · BEST ${store.best.toLocaleString('en-US')}${run.repairCount?` · REPAIRS ${run.repairCount}`:''}</div>`:''}`);
}
function start(mode,index=0,seed=newSeed()){
  run=createRun(mode,index,seed);busy=false;action=null;finalPending=false;chainUntil=toastUntil=0;clearResupply();$('floaters').replaceChildren();$('chain').classList.remove('show');$('toast').classList.remove('show');closeModal();scene.load(run);updateUI();persist();
}
function resumeAfterRepair(){const result=repairRun(run);if(!result.ok)return;action=null;busy=false;finalPending=false;chainUntil=0;$('chain').classList.remove('show');$('floaters').replaceChildren();closeModal();scene.load(run);updateUI();persist();toast(`Repaired +${result.added} hits. Your mine and treasure are kept.`);}
function toggleSound(){store.sound=!store.sound;audio.enabled=store.sound;if(store.sound){audio.unlock();audio.tone(523,.08);}else audio.stop();persist();updateUI();}
$('modal').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;audio.unlock();switch(b.dataset.action){case'close':closeModal();break;case'lesson':start('lesson',Number(b.dataset.index));break;case'expedition':start('random');break;case'next':start('lesson',run.index+1);break;case'retry':start(run.mode,run.index,run.seed);break;case'mines':showMines();break;case'sound':toggleSound();showHelp();break;case'motion':store.reduced=!store.reduced;persist();updateUI();showHelp();break;case'repair':resumeAfterRepair();break;case'cash':cashOut(run);closeModal();showResults();break;}});
$('mines').addEventListener('click',()=>{if(!busy)showMines();});$('help').addEventListener('click',()=>{if(!busy)showHelp();});$('sound').addEventListener('click',toggleSound);
$('finish').addEventListener('click',()=>{if(busy||!run.strikes)return;openModal(`${modalClose()}<div class="modal-eyebrow">A GOOD DAY’S DIGGING</div><h2>Head to the surface?</h2><p>Finish this run with ${run.score.toLocaleString('en-US')} treasure. You can replay the same mine afterward.</p><button class="primary" data-action="cash">Finish this run</button><button class="secondary" data-action="close">Keep digging</button>`);});
$('look-up').addEventListener('click',()=>scene?.pan(-3));$('look-down').addEventListener('click',()=>scene?.pan(3));$('follow').addEventListener('click',()=>scene?.follow(run.depth));
$('route-hint').addEventListener('click',()=>{if(busy||modalOpen||run.status!=='active')return;const route=cacheRoute(run);if(!route.next)return;const[r,c]=route.next;scene.showRoute(r,c);$('toast').classList.remove('show');toastUntil=0;$('tip').textContent=`Safe route: at most ${route.cost} hits. Follow the arrow.`;$('announcer').textContent=`Next safe step: row ${r+1}, column ${c+1}, ${TYPES[run.grid[r][c]].name}.`;});
$('world').addEventListener('keydown',e=>{if(modalOpen)return;if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Enter',' '].includes(e.key)){e.preventDefault();const b=$('cell-targets').querySelector('[data-reachable="true"]');if(b)b.focus();}});
document.addEventListener('keydown',e=>{
  if(!modalOpen)return;if(e.key==='Escape'&&run.status==='active'){e.preventDefault();closeModal();}
  if(e.key==='Tab'){const els=[...$('modal').querySelectorAll('button:not(:disabled),[tabindex="0"]')];if(!els.length)return;const first=els[0],last=els.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('modal'))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===$('modal'))){e.preventDefault();first.focus();}}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.stop();persist();}last=performance.now();});
window.addEventListener('pagehide',persist);
try {
  $('mine-view').before($('goal'));
  scene=new MineScene($('world'),{mine,targets,hover,float,depth:o=>{$('depth-label').innerHTML=`${o<.5?'SURFACE':'BELOW THE SURFACE'} <span>${String(Math.max(0,Math.round(o))).padStart(2,'0')} m</span>`;}});
  scene.reduced=store.reduced;scene.load(run);$('loading').hidden=true;updateUI();persist();if(migration.added)toast(`Pickaxe upgraded: +${migration.added} hits. Your mine is kept.`);if(run.status==='exhausted')showResults();requestAnimationFrame(tick);
}catch(error){console.error(error);$('loading').classList.add('error');$('loading').innerHTML='<p>This browser could not open the 3D mine.<br>Please enable WebGL or try a recent browser.</p>';}
