import {ITEMS,START_X,MILESTONES,airborneFlips,startRun,step as simulate,currentRamp,rankOf,RANKS} from './rules.mjs';
import {createStage} from './stage.mjs';
import {createAudio} from './audio.mjs';

const $=id=>document.getElementById(id);
const dev=new URLSearchParams(location.search).has('dev');
const saveKey=dev?'cart-takeoff-v3-qa':'cart-takeoff-v3';
const audio=createAudio({muteKey:dev?'cart-takeoff-qa-muted':'cart-takeoff-v1-muted',musicVolume:.22,sfxVolume:.75});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const yen=v=>`¥${Math.round(v).toLocaleString('en-US')}`;
const itemName=id=>ITEMS.find(i=>i.id===id)?.name??'货';
const AREAS=['晴天市集','配送大院','霓虹夜场'];
let stage;
try{stage=createStage($('scene'));}catch{$('scene').classList.add('fallback');}

const save=readSave();
let run,playing=false,holding=false,total=0,slow=0,slowScale=1,endDelay=-1,shownScore=0,halfTurns=0,printTimer=null,guide=0;
const holders=new Set();

function readSave(){try{const s=JSON.parse(localStorage.getItem(saveKey));if(s&&typeof s.best==='number')return s;}catch{/* 无存档 */}return {best:0,bestX:0,lastX:0,plays:0,bestFlips:0};}
function writeSave(){try{localStorage.setItem(saveKey,JSON.stringify(save));}catch{/* 无痕模式 */}}

// ——————— 飘字、横幅、撒花 ———————
function floater(text,pos,kind=''){
  if(!pos)return;const n=document.createElement('span');n.className=`floater ${kind}`;n.textContent=text;
  n.style.left=`${pos.x*100}%`;n.style.top=`${pos.y*100}%`;$('floaters').append(n);setTimeout(()=>n.remove(),1150);
}
let bannerTimer=null;
function banner(text,kind=''){
  const b=$('banner');b.textContent=text;b.className=`banner ${kind}`;b.hidden=false;
  if(!reduced)b.animate([{scale:.5,opacity:0},{scale:1.1,opacity:1,offset:.6},{scale:1,opacity:1}],{duration:320,easing:'ease-out'});
  clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>b.hidden=true,kind==='crash'?2200:1200);
}
function confetti(){
  if(reduced)return;const box=$('floaters'),colors=['#ffd43b','#ff5c8a','#2fbf8b','#3aa7e0','#ff8a2b'];
  for(let i=0;i<26;i++){const n=document.createElement('i');n.className='confetti';n.style.left=`${8+Math.random()*84}%`;n.style.background=colors[i%5];
    n.style.animationDelay=`${Math.random()*.25}s`;n.style.setProperty('--dx',`${(Math.random()-.5)*120}px`);box.append(n);setTimeout(()=>n.remove(),1700);}
}
const cartPos=(dy=1.6)=>stage?.screenOf(run.x,run.y+dy)??{x:.4,y:.45};

// ——————— HUD ———————
function drawHud(dt){
  if(shownScore!==run.score){shownScore=dt?Math.min(run.score,shownScore+Math.max(1,(run.score-shownScore)*Math.min(1,dt*8))):run.score;$('score').textContent=yen(shownScore);}
  $('dist').textContent=Math.max(0,Math.floor(run.x-START_X));
  $('pile').textContent=run.pile.length;
  const air=run.phase==='air';
  const now=air?run.airFlips+airborneFlips(run):0;
  const f=$('flips');
  if(now>0){if(f.hidden||f.dataset.n!==String(now)){f.hidden=false;f.dataset.n=now;f.querySelector('b').textContent=`×${now+1}`;f.querySelector('span').textContent=now>1?`${now} 连翻`:'后空翻';f.classList.remove('pop');void f.offsetWidth;f.classList.add('pop');}}
  else f.hidden=true;
  const r=currentRamp(run),w=$('wind');
  w.hidden=!(r?.wind)||run.phase==='crash';
  if(!w.hidden)w.textContent=r.wind>0?'侧风 ↺ 会帮你翻':'侧风 ↻ 车头更沉';
  const area=Math.min(2,Math.floor(Math.max(0,run.x+18.95)/158));
  $('area').textContent=`${AREAS[area]} · 第 ${run.rampIndex+1} 跳`;
}
function drawHint(){
  const h=$('hint');let t='';
  if(playing&&run.phase!=='crash'&&save.plays<2&&run.rampIndex<3){
    if(run.phase==='air')t=Math.cos(run.angle)<.6||run.av>1?'松手！让车头落下来':'车头往下栽了？按住抬起来';
    else if(run.rampIndex===0)t='冲上跳台后，按住=后空翻';
  }
  h.hidden=!t;h.textContent=t;
}

// ——————— 事件 ———————
function handle(events){
  for(const e of events){
    stage?.event(e,run);
    if(e.type==='launch'){audio.sfx.go();halfTurns=0;}
    else if(e.type==='pickup'){audio.sfx.grab();floater(`+${itemName(e.item)}`,cartPos(2.4),'item');}
    else if(e.type==='coin'){audio.tone(1568,.06,{type:'square',vol:.04});audio.tone(2093,.08,{type:'triangle',vol:.05,at:.04});floater('+¥5',stage?.screenOf(e.x,e.y)??cartPos(),'coin');}
    else if(e.type==='land'||e.type==='bounce'){
      const perfect=e.grade==='perfect';
      audio.sfx.drop(e.grade==='sloppy'?6:3,!perfect);
      if(perfect){audio.sfx.perfect();slow=.22;slowScale=.35;}
      if(e.pts)setTimeout(()=>{audio.sfx.kaching();},80);
      const label=e.type==='bounce'?'弹车顶！':perfect?'完美落地！':e.grade==='ok'?'稳！':'好险！';
      floater(label,cartPos(2.6),perfect||e.type==='bounce'?'perfect':e.grade==='sloppy'?'bad':'');
      setTimeout(()=>floater(`+${yen(e.pts)}${e.mult>1?` ×${e.mult}`:''}`,cartPos(1.6),'money'),160);
      if(e.lostItem)setTimeout(()=>floater(`${itemName(e.lostItem)}掉了！`,cartPos(.8),'bad'),300);
      if(e.streak&&e.streak%5===0){banner(`${e.streak} 连完美！`,'streak');audio.sfx.cheer(false);}
      if(navigator.vibrate&&navigator.userActivation?.hasBeenActive)navigator.vibrate(perfect?[10,30,10]:20);
    } else if(e.type==='milestone'){banner(`返现破 ${yen(e.value)}！`,'milestone');audio.sfx.gift();confetti();}
    else if(e.type==='crash'){
      audio.sfx.shatter();audio.sfx.drop(7);setTimeout(()=>audio.sfx.fail(),350);audio.setMode(null);
      banner(e.head?'倒栽葱！购物车飞出去了！':'购物车飞出去了！','crash');
      slow=1.2;slowScale=.3;endDelay=2.2;setHold(false);
      if(navigator.vibrate&&navigator.userActivation?.hasBeenActive)navigator.vibrate([60,40,120]);
    }
  }
}

// ——————— 流程 ———————
function setup(){
  run=startRun();playing=false;endDelay=-1;shownScore=0;slow=0;holders.clear();setHold(false);
  $('floaters').replaceChildren();$('banner').hidden=true;
  $('score').textContent=yen(0);$('best').textContent=save.best?`最高 ${yen(save.best)}`:'';
  stage?.reset(run,{last:save.lastX,best:save.bestX});drawHud(0);
}
function openStart(){
  $('start-best').textContent=save.best?`最高返现 ${yen(save.best)} · ${rankOf(save.best)} · 最多连翻 ${save.bestFlips} 圈`:'第一次推车，冲！';
  setup();$('result').hidden=true;$('start').hidden=false;
}
function begin(){
  audio.unlock();audio.sfx.go();audio.setMode('game');
  $('start').hidden=true;$('result').hidden=true;playing=true;
}
function setHold(on){
  if(holding===on)return;holding=on;$('hold').classList.toggle('on',on);
  if(on&&playing&&run.phase==='air')audio.noise(.12,{type:'bandpass',freq:700,to:1600,q:2,vol:.12});
}
function finish(){
  playing=false;audio.setMode('show');
  const record=run.score>save.best;
  save.plays++;save.best=Math.max(save.best,run.score);save.lastX=run.crash?.x??run.x;save.bestX=Math.max(save.bestX,save.lastX);save.bestFlips=Math.max(save.bestFlips,run.bestFlips);writeSave();
  const m=Math.floor(run.x-START_X);
  const lines=[
    ['head','黑五停车场 · 返现小票'],['sub',`飞了 ${m} 米 · ${run.time.toFixed(0)} 秒`],['rule'],
    ['sum','成功落地',`${run.jumps} 跳`],
    ['sum','完美落地',`${run.perfects} 次`],
    ['sum','后空翻',`${run.flips} 圈 · 最多连翻 ${run.bestFlips}`],
    ['sum','弹车顶',`${run.bounces} 次`],
    ['sum','吃到金币',`${run.coins} 枚`],
    ['sum','车里的货',`${run.crash?.pile.length??run.pile.length} 件（全飞了）`],
    ['rule'],
    ['sum strong','本车返现',yen(run.score)],
    ['sum',record?'新纪录！':'历史最高',yen(save.best)],
  ];
  const box=$('receipt-lines');box.replaceChildren();$('stamp').hidden=true;$('retry').hidden=true;$('result-note').textContent='';$('result').hidden=false;
  const nodes=lines.map(([cls,a,b])=>{const n=document.createElement('div');n.className=cls.split(' ').map(x=>`r-${x}`).join(' ');
    if(cls==='head'||cls==='sub')n.textContent=a;else if(cls!=='rule')n.innerHTML=`<span>${a}</span><span>${b}</span>`;return n;});
  let k=0;
  const reveal=()=>{
    $('stamp').hidden=false;$('stamp-title').textContent=rankOf(run.score);$('stamp-sub').textContent=record?'新纪录':'';
    if(!reduced)$('stamp').animate([{scale:2.2,opacity:0,rotate:'-20deg'},{scale:1,opacity:1,rotate:'-8deg'}],{duration:280,easing:'cubic-bezier(.3,1.6,.6,1)'});
    audio.sfx.stamp();setTimeout(()=>{if(record){audio.sfx.win();confetti();}else audio.sfx.star(1);},260);
    const next=RANKS.slice(1).find(([v])=>run.score<v);
    $('result-note').textContent=next?`再返 ${yen(next[0]-run.score)} 就是「${next[1]}」 · 路边的红旗是你这次翻车的地方`:'你就是购物车之神';
    $('retry').hidden=false;
  };
  const stepLine=()=>{if(k<nodes.length){box.append(nodes[k++]);audio.sfx.line();printTimer=setTimeout(stepLine,reduced?0:100);}else{printTimer=null;reveal();}};
  $('result').onclick=e=>{if(!printTimer||e.target.closest('button'))return;clearTimeout(printTimer);printTimer=null;while(k<nodes.length)box.append(nodes[k++]);reveal();};
  stepLine();
}

// ——————— 输入：按钮、舞台、空格都能按住 ———————
function press(id){holders.add(id);setHold(true);}
function release(id){holders.delete(id);if(!holders.size)setHold(false);}
for(const el of [$('hold'),$('stage')]){
  el.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch{/* 合成事件 */}if(!playing&&!$('start').hidden)return;press('p'+e.pointerId);});
  el.addEventListener('pointerup',e=>release('p'+e.pointerId));
  el.addEventListener('pointercancel',e=>release('p'+e.pointerId));
  el.addEventListener('lostpointercapture',e=>release('p'+e.pointerId));
}
document.addEventListener('keydown',e=>{
  if(e.code!=='Space'&&e.code!=='ArrowUp')return;e.preventDefault();if(e.repeat)return;
  if(!$('start').hidden){begin();return;}
  if(!$('result').hidden&&!$('retry').hidden){$('retry').click();return;}
  press('k');
});
document.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='ArrowUp')release('k');});
window.addEventListener('blur',()=>{holders.clear();setHold(false);});
$('go').addEventListener('click',begin);
$('retry').addEventListener('click',()=>{setup();begin();});
$('mute').addEventListener('click',()=>{audio.toggle();$('mute').setAttribute('aria-pressed',String(audio.muted));});
$('mute').setAttribute('aria-pressed',String(audio.muted));

// ——————— 主循环 ———————
function step(dt){
  total+=dt;
  if(slow>0){slow-=dt;}
  const sdt=dt*(slow>0?slowScale:1);
  if(playing&&run.phase!=='crash'){
    const n=Math.max(1,Math.ceil(sdt/(1/120)));
    for(let i=0;i<n;i++)simulate(run,sdt/n,holding);
    if(run.phase==='air'){
      const h=Math.floor((run.angle-run.launchAngle)/Math.PI);
      if(h>halfTurns){halfTurns=h;audio.noise(.1,{type:'bandpass',freq:500+h*120,to:1400+h*200,q:2,vol:.14});}
    }
  } else if(run.phase==='crash')simulate(run,sdt,false);
  handle(run.events.splice(0));
  if(endDelay>=0){endDelay-=dt;if(endDelay<0)finish();}
  drawHud(dt);drawHint();
  stage?.render(run,total,sdt);
}
let last=0;
function frame(now){const dt=last?Math.min(.05,(now-last)/1000):.016;last=now;step(dt);requestAnimationFrame(frame);}
openStart();requestAnimationFrame(frame);
if(dev)window.__ct={get run(){return run;},step,begin,setup,press,release,advance(sec,policy){for(let i=0;i<sec*60;i++){if(policy){const h=policy(run);if(h)press('bot');else release('bot');}step(1/60);}}};
