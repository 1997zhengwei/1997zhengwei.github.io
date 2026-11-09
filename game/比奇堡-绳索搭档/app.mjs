import {actorPose,ROUTE_FINISH} from './landing.mjs?v=elastic-2';
import {createGame,start,step,act,hop,setLength,retry,CHAPTERS,chapterIndex,readState} from './rules.mjs?v=elastic-2';
import {createScene} from './scene.mjs?v=elastic-2';
const $=s=>document.querySelector(s),qa=new URLSearchParams(location.search).has('qa');
let s=createGame(),view,paused=false,selectedMode='easy',best=0,toastUntil=0,checkpointUntil=0,sound=false,ac,held=false,pointerId=null,last=performance.now();
const hopInputs=new Map();
function clearHops(){hopInputs.clear();s.hopDir=0;for(const b of document.querySelectorAll('.hop-key'))b.classList.remove('held');}
function hopPress(id,dir){if(paused||s.phase!=='playing')return;hopInputs.set(id,dir);s.hopDir=dir;hop(s,dir);}
function hopRelease(id){hopInputs.delete(id);s.hopDir=[...hopInputs.values()].at(-1)??0;}
const saveKey=qa?'rope-relay-qa-v1':'rope-relay-v1';
try{best=Number(localStorage.getItem(saveKey))||0;}catch{}
try{view=createScene($('#world'),s);}catch(e){$('#load-error').hidden=false;console.error(e);throw e;}
function tone(kind){if(!sound)return;try{ac??=new AudioContext();ac.resume();if(kind==='step'){const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type='triangle';o.frequency.setValueAtTime(170,t);o.frequency.exponentialRampToValueAtTime(80,t+.055);g.gain.setValueAtTime(.012,t);g.gain.exponentialRampToValueAtTime(.0001,t+.07);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.08);return;}const notes=kind==='fall'?[210,150]:kind==='burger'?[660,880,1100]:kind==='perfect'?[440,660,880]:[380,520];notes.forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+i*.065;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.23);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.25);});}catch{}}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');toastUntil=performance.now()+1800;}
function overlay(id){$('#overlay').classList.remove('hidden');for(const m of document.querySelectorAll('.modal'))m.classList.toggle('hidden',m.id!==id);}
function hideOverlay(){$('#overlay').classList.add('hidden');}
function release(){held=false;s.holding=false;pointerId=null;$('#action').classList.remove('held');}
function begin(endless=false){release();clearHops();Object.assign(s,createGame({mode:selectedMode,endless}));view.resetRoute();$('#reach').value='4.4';$('#reach-value').textContent='4.4';paused=false;start(s);hideOverlay();$('#mode-label').textContent=endless?'无尽海底接力':s.mode==='easy'?'轻松接力':'默契挑战';$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','暂停游戏');toast('左右小跳调站位 · 绿圈换手 · 绳子拉紧会回弹');}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{selectedMode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(n=>n.classList.toggle('selected',n===b));});
$('#start').onclick=()=>begin();
$('#action').addEventListener('pointerdown',e=>{if(e.button!==0||paused||s.phase!=='playing')return;e.preventDefault();pointerId=e.pointerId;$('#action').setPointerCapture(e.pointerId);held=true;s.holding=true;$('#action').classList.add('held');act(s);});
$('#action').addEventListener('pointerup',release);$('#action').addEventListener('pointercancel',release);$('#action').addEventListener('lostpointercapture',release);
// Keyboard click activation and screen readers use the same action as pointers.
$('#action').addEventListener('click',e=>{if(e.detail===0&&!paused)act(s);});
window.addEventListener('keydown',e=>{
 if(e.code==='Space'&&e.target.tagName!=='INPUT'){e.preventDefault();if(e.repeat||paused||s.phase!=='playing')return;held=true;s.holding=true;$('#action').classList.add('held');act(s);}
 if(e.code==='Escape'&&s.phase==='playing')togglePause();
 const dir=['ArrowLeft','KeyA'].includes(e.code)?-1:['ArrowRight','KeyD'].includes(e.code)?1:0;
 if(dir&&e.target.tagName!=='INPUT'){e.preventDefault();if(!e.repeat)hopPress(e.code,dir);}
});
window.addEventListener('keyup',e=>{if(e.code==='Space')release();hopRelease(e.code);});
for(const [selector,dir] of [['#hop-left',-1],['#hop-right',1]]){
 const b=$(selector);
 b.addEventListener('pointerdown',e=>{if(paused||s.phase!=='playing')return;e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('held');hopPress('pointer-'+e.pointerId,dir);});
 const up=e=>{hopRelease('pointer-'+e.pointerId);b.classList.remove('held');};
 b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
 b.addEventListener('click',e=>{if(e.detail===0&&!paused)hop(s,dir);});
}
$('#reach').oninput=e=>{setLength(s,Number(e.target.value));$('#reach-value').textContent=s.pendingLength.toFixed(1);};
function togglePause(){if(s.phase!=='playing'&&s.phase!=='falling')return;release();clearHops();paused=!paused;if(paused){overlay('pause-modal');$('#pause').textContent='▷';$('#pause').setAttribute('aria-label','继续游戏');}else{hideOverlay();$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','暂停游戏');last=performance.now();}}
$('#pause').onclick=togglePause;$('#help').onclick=()=>{if(s.phase==='playing'&&!paused)togglePause();};$('#resume').onclick=()=>{if(paused)togglePause();};
$('#restart').onclick=()=>begin(s.endless);
$('#retry').onclick=()=>{if(s.phase==='won'){begin(true);return;}release();clearHops();retry(s);paused=false;hideOverlay();toast(s.checkpoint?'回到安全检查点，搭档抓稳！':'再来一次！按住接力，或等绿圈出现时点按');};
$('#new-game').onclick=()=>begin(s.endless);
$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent=sound?'♫':'♪';$('#sound').setAttribute('aria-label',sound?'关闭音效':'打开音效');$('#sound').setAttribute('aria-pressed',String(sound));tone('perfect');};
function loseFocus(){release();clearHops();if(['playing','falling'].includes(s.phase)&&!paused)togglePause();}
window.addEventListener('blur',loseFocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();});
function result(win){release();clearHops();$('#result-eyebrow').textContent=win?'BEST FRIENDS MAKE IT FURTHER':'EVEN BEST FRIENDS NEED A RETRY';$('#result-title').textContent=win?'搭档，到饭点啦！':'再搭把手！';$('#result-copy').textContent=win?'你们一起穿过水母田，抵达了蟹堡王。继续无尽接力，看看默契能走多远？':s.reason;$('#result-distance').textContent=s.distance+' m';$('#result-food').textContent=String(s.burgers);$('#result-combo').textContent=String(s.perfect);$('#retry').textContent=win?'继续无尽接力 ↗':s.checkpoint?'从检查点再来 ↗':'再试一次 ↗';overlay('result');if(s.distance>best){best=s.distance;try{localStorage.setItem(saveKey,String(best));}catch{}}}
function events(){for(const e of s.events.splice(0)){if(['catch','perfect'].includes(e.type)){tone(e.type);view.burst(e.x,e.y,e.type==='perfect'?'#fff1a0':'#b5f1b9');if(s.swaps===1)toast('就是这样！现在换海绵宝宝摆过去');else if(s.swaps%5===0)toast('默契连击 × '+s.combo);}if(e.type==='landing-impact'||e.type==='hop'){view.puff(e.x,e.y);tone('step');}if(e.type==='burger'){tone('burger');view.burst(e.x,e.y,'#ffd858',8);toast('蟹黄堡 +1 · 派大星很满意');}if(e.type==='shield'){tone('burger');view.burst(e.x,e.y,'#c9fff0',20);toast('泡泡护盾挡住了水母！下个检查点补充');}if(e.type==='checkpoint'){toast('检查点已点亮！掉落后从这里继续');checkpointUntil=performance.now()+2000;}if(e.type==='fall'){release();clearHops();tone('fall');}if(e.type==='lost')result(false);if(e.type==='won'){tone('perfect');result(true);} }}
function ui(){
 const a=s.actors[s.anchor],f=s.actors[1-s.anchor],ch=chapterIndex(a.x),pose=actorPose(a),motion=pose?.stage??'swing';
 $('#game').dataset.motion=motion;$('#game').dataset.phase=s.phase;$('#game').dataset.hops=String(s.hops);$('#game').dataset.anchorX=a.x.toFixed(3);$('#game').dataset.ropeStretch=s.rope.extension.toFixed(3);
 $('#distance').textContent=String(s.distance);$('#burgers').textContent=String(s.burgers);$('#chapter-en').textContent=s.endless?'ONE ROPE · ENDLESS OCEAN':CHAPTERS[ch].en;$('#chapter').textContent=s.endless?'∞ / 无尽海底接力':String(ch+1).padStart(2,'0')+' / '+CHAPTERS[ch].name;$('#progress').style.width=Math.min(100,a.x/ROUTE_FINISH*100)+'%';
 $('#anchored').textContent=(s.anchor===0?'海绵宝宝':'派大星')+(a.hopping?'小跳中':'抓稳了');$('.dot').classList.toggle('patrick',s.anchor===1);
 $('#swing-status').textContent=s.phase==='ready'?'左右自己蹦，绿圈换手':a.hopping?'小跳牵动绳子':s.canCatch?'落脚稳了，现在换手！':s.rope.extension>s.length*.06?'绳子绷紧，回弹！':(s.anchor===0?'派大星':'海绵宝宝')+'正在摆荡';
 $('#action').classList.toggle('ready',s.canCatch);$('#action-label').textContent=s.canCatch?'落稳啦，换手！':held?'搭档，抓稳咯…':'换手，向前！';$('#action-sub').textContent=s.mode==='easy'?'空格 / 按住连续接力':'绿圈出现时点按 / 空格';$('#best-label').textContent='最好成绩 '+best+' m';
 $('#toast').classList.toggle('show',performance.now()<toastUntil);$('#checkpoint-note').style.opacity=performance.now()<checkpointUntil?'1':'0';const p=view.project(f.x,f.y+2);$('#landing-hint').style.left=p.x+'px';$('#landing-hint').style.top=p.y+'px';$('#landing-hint').style.opacity=s.canCatch&&!paused?'1':'0';$('#landing-hint b').textContent='现在换手！';
}
function frame(t){const dt=Math.min((t-last)/1000,1/30);last=t;if(!paused){step(s,dt);events();}view.update(paused?0:dt);ui();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
// Read-only diagnostics for local verification; no hidden state mutation or skip controls.
if(qa)Object.defineProperty(window,'ropeQA',{value:()=>readState(s)});
