import {goods,BILLS,STRIKES,FEVER_NEED,FEVER_TIME,FEVER_COIN,startRun,frontCustomer,currentItem,changeDue,waiting,levelNow,turn,peel,scan,payCard,giveChange,tick,
  moodOf,rankOf,RANKS} from './rules.mjs';
import {createStage} from './stage.mjs';
import {createAudio} from './audio.mjs';

const $=id=>document.getElementById(id);
const dev=new URLSearchParams(location.search).has('dev');
const muteKey=dev?'last-checkout-qa-muted':'last-checkout-v1-muted';
const saveKey=dev?'last-checkout-v4-qa':'last-checkout-v4';
const yuan=v=>`¥${Math.round(v).toLocaleString('en-US')}`;
const audio=createAudio({muteKey,musicVolume:.19,sfxVolume:.75});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
// 扫码嘀声连起来是一段循环小调（原创），扫得越顺越像在弹琴
const JINGLE=[0,4,7,4,9,7,4,2,0,4,7,12,11,7,9,12];
const MOOD_TEXT={3:'开心',2:'一般',1:'不爽',0:'走了'};
const save=readSave();
let stage;
try { stage=createStage($('scene'),{paper:new URLSearchParams(location.search).get('paper')||'blocky'}); } catch { $('scene').classList.add('fallback'); }

let run,playing=false,drag=null,shown='',total=0,endDelay=-1,guideScans=0,printTimer=null,shownGmv=0,lastLevel=0,musicMode='game';

function readSave() {
  try { const s=JSON.parse(localStorage.getItem(saveKey)); if(s&&typeof s.best==='number')return s; } catch { /* 无存档 */ }
  return {best:0,bestServed:0,plays:0};
}
function writeSave() { try { localStorage.setItem(saveKey,JSON.stringify(save)); } catch { /* 无痕模式 */ } }

// ——————— 飘字 / 横幅 ———————
function floater(text,pos,kind='') {
  if(!pos)return;
  const n=document.createElement('span');n.className=`floater ${kind}`;n.textContent=text;
  n.style.left=`${pos.x*100}%`;n.style.top=`${pos.y*100}%`;
  $('floaters').append(n);setTimeout(()=>n.remove(),1100);
}
let bannerTimer=null;
function banner(text,kind='') {
  const b=$('banner');b.textContent=text;b.className=`banner ${kind}`;b.hidden=false;
  if(!reduced)b.animate([{scale:.6,opacity:0},{scale:1.08,opacity:1,offset:.6},{scale:1,opacity:1}],{duration:320,easing:'ease-out'});
  clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>{b.hidden=true;},1400);
}
function confetti() {
  if(reduced)return;
  const box=$('floaters'),colors=['#ffd43b','#ff5c8a','#3fc28a','#4cb3ff','#ff8a2b'];
  for(let i=0;i<26;i++){
    const n=document.createElement('i');n.className='confetti';n.style.left=`${10+Math.random()*80}%`;n.style.background=colors[i%5];
    n.style.animationDelay=`${Math.random()*.25}s`;n.style.setProperty('--dx',`${(Math.random()-.5)*120}px`);
    box.append(n);setTimeout(()=>n.remove(),1600);
  }
}
const itemPos=()=>stage?.itemTop()??{x:.33,y:.55};
const headPos=n=>stage?.headOf(n)??{x:.5,y:.3};

// ——————— 绘制 ———————
function drawHud() {
  const strikes=$('strikes');
  [...strikes.children].forEach((n,i)=>n.classList.toggle('on',i<run.strikes));
  const combo=$('combo');combo.hidden=run.combo<3;
  combo.classList.toggle('rush',run.fever>0);
  if(run.combo>=3){combo.querySelector('b').textContent=`×${run.combo}`;combo.querySelector('span').textContent=run.fever>0?'爆单中':'连扫';}
  drawFever();
  const w=waiting(run).length;
  $('queue-chip').textContent=w?`排队 ${w} 人`:'店里暂时没人';
  $('queue-chip').classList.toggle('busy',w>=4);
  $('level').textContent=`客流 Lv.${levelNow(run)+1}`;
}
function drawFever() {
  const on=run.fever>0,m=$('fever-meter');
  $('fever-fill').style.width=`${(on?run.fever/FEVER_TIME:run.charge/FEVER_NEED)*100}%`;
  m.classList.toggle('on',on);m.classList.toggle('ready',!on&&run.charge>=FEVER_NEED-3);
  $('fever-label').textContent=on?`爆单中 ${Math.ceil(run.fever)}s`:`爆单槽 ${run.charge}/${FEVER_NEED}`;
}
function coinFly() {
  if(reduced)return;
  const st=$('stage').getBoundingClientRect(),from=stage?.scanTarget()??{x:.6,y:.6},to=$('gmv').getBoundingClientRect();
  const c=document.createElement('i');c.className='coin';$('floaters').append(c);
  const x0=from.x*st.width,y0=from.y*st.height,x1=to.left-st.left+to.width*.6,y1=to.top-st.top+to.height*.5;
  c.animate([{transform:`translate(${x0}px,${y0}px) scale(.6)`},{transform:`translate(${(x0+x1)/2}px,${Math.min(y0,y1)-60}px) scale(1.2)`,offset:.5},{transform:`translate(${x1}px,${y1}px) scale(.5)`}],{duration:520,easing:'ease-in'}).onfinish=()=>c.remove();
}
function drawGmv(dt) {
  const target=run.gmv;
  if(shownGmv===target)return;
  shownGmv=dt?Math.min(target,shownGmv+Math.max(1,(target-shownGmv)*Math.min(1,dt*7))):target;
  if(target-shownGmv<1)shownGmv=target;
  $('gmv').textContent=yuan(shownGmv);
}
function drawPatron() {
  const c=run.phase==='over'?null:frontCustomer(run);
  if(!c){$('customer').textContent=run.phase==='over'?'打烊':'等顾客…';$('patience').style.width='0';$('mood').textContent='';$('subtotal').textContent='';return;}
  $('customer').textContent=c.vip?`${c.name} · 大单`:c.name;
  const m=moodOf(c.p),bar=$('patience');
  bar.style.width=`${Math.max(2,c.p*100)}%`;bar.dataset.mood=m;
  $('mood').textContent=MOOD_TEXT[m];$('mood').dataset.mood=m;
  $('subtotal').textContent=yuan(run.total);
}
function drawPanel() {
  const c=frontCustomer(run),scanning=run.phase==='scan';
  $('scan-panel').hidden=!scanning;$('payment').hidden=run.phase!=='pay';$('idle-panel').hidden=run.phase!=='idle';
  drawPatron();
  stage?.sale(run.total,run.phase==='pay'&&Boolean(c?.bill));
  if(scanning){
    const it=currentItem(run),g=goods[it.id];
    $('product-name').textContent=g.name;
    $('product-step').textContent=`第 ${run.item+1}/${c.items.length} 件`;
    $('product-price').innerHTML=it.sticker&&it.peeled?`<s>¥${g.price}</s> ¥${g.price-it.sticker}`:`¥${g.price}`;
  } else if(run.phase==='pay') drawPayment();
  drawSticker();drawGuide();
}
function drawPayment() {
  const c=frontCustomer(run);
  const opts=$('pay-options');
  if(!c.bill){
    $('pay-title').textContent=`应收 ${yuan(run.total)}`;
    $('pay-detail').textContent='顾客刷卡';
    opts.className='pay-options';
    const b=document.createElement('button');b.type='button';b.className='primary card-pay';b.innerHTML='<i aria-hidden="true"></i>刷卡收款';
    b.addEventListener('click',()=>act(()=>payCard(run)));
    opts.replaceChildren(b);
  } else {
    const due=changeDue(run);
    $('pay-title').innerHTML=`收 ${yuan(c.bill)} · 找零 <b class="due">${yuan(due)}</b>`;
    $('pay-detail').textContent=run.taken?`已拿 ${yuan(run.taken)}，还差 ${yuan(due-run.taken)}`:'点钱凑出正好的找零';
    opts.className='pay-options bills';
    opts.replaceChildren(...BILLS.map(v=>{
      const b=document.createElement('button');b.type='button';b.className=`bill b${v}`;b.innerHTML=`<small>¥</small>${v}`;
      b.addEventListener('click',()=>giveBill(v));
      return b;
    }));
  }
}
function giveBill(v) {
  const r=act(()=>giveChange(run,v));
  if(r==='more'){audio.sfx.tap();audio.noise(.05,{freq:5200,vol:.12});drawPayment();}
  return r;
}
function drawSticker() {
  const it=run.phase==='scan'?currentItem(run):null;
  const s=$('sticker');
  s.hidden=!(playing&&it?.sticker&&!it.peeled);
  if(!s.hidden)s.querySelector('b').textContent=`−¥${it.sticker}`;
}
function placeSticker() {
  const s=$('sticker');if(s.hidden)return;
  const p=itemPos();s.style.left=`${p.x*100}%`;s.style.top=`${p.y*100}%`;
}
function drawGuide() {
  const g=$('guide');
  const it=run.phase==='scan'?currentItem(run):null;
  let text='';
  if(it&&guideScans<3&&save.plays<2)text=run.face===0?'条码朝你了 → 把商品拖过红线':'看不到条码？点商品左边或右边，把它转过来';
  else if(it?.sticker&&!it.peeled&&save.plays<3&&run.saved===0)text='黄色贴纸先点掉，不然多收钱顾客会炸毛';
  g.hidden=!text;g.textContent=text;
}
function syncItems() {
  const key=`${run.front}/${run.item}/${run.phase}`;
  if(key===shown)return;
  shown=key;
  const c=frontCustomer(run);
  if(!c||run.phase!=='scan'){stage?.clearItems();return;}
  stage?.showItems(c.items,run.item,run.face,run.fever>0);
}
function setMusic() {
  const want=run.fever>0?'show':waiting(run).length>=4||run.strikes>=STRIKES-1?'rush':'game';
  if(want!==musicMode){musicMode=want;audio.setMode(want);}
}

// ——————— 规则事件 → 声音、特效 ———————
function handleEvents() {
  const events=run.events.splice(0);
  for(const e of events){
    if(e.type==='scan'){
      const note=784*2**(JINGLE[(e.combo-1)%JINGLE.length]/12)*(e.fever?2:1);
      audio.tone(note,.09,{type:'square',vol:.05});audio.tone(note*1.5,.07,{type:'triangle',vol:.03,at:.02});audio.sfx.line();
      if(e.fever)audio.noise(.06,{type:'lowpass',freq:300,vol:.4});
      if(e.id==='duck'){audio.tone(1300,.12,{type:'sawtooth',slide:2100,vol:.08});audio.tone(1900,.1,{type:'sawtooth',slide:1200,vol:.06,at:.12});floater('嘎！',itemPos(),'hint');}
      if(e.id==='turkey'){audio.sfx.drop(6);floater('咚！',itemPos(),'hint');}
      if(e.combo>=10&&e.combo%10===0){audio.sfx.perfect();banner(`${e.combo} 连扫！`,'combo');}
      stage?.effect(true);
      floater(e.fever?`+¥${FEVER_COIN}`:e.combo>=3?`×${e.combo}`:'嘀',stage?.scanTarget()??{x:.6,y:.6},e.fever?'money':'scan');
      if(e.fever)coinFly();
      guideScans++;
      if(navigator.vibrate&&navigator.userActivation?.hasBeenActive)navigator.vibrate(12);
    } else if(e.type==='wrong'){
      audio.sfx.nope();stage?.effect(false);floater('条码没对准',itemPos(),'bad');
    } else if(e.type==='peel'){
      if(!e.auto)audio.sfx.coupon();floater(`−¥${e.amount}`,itemPos(),'save');
    } else if(e.type==='overcharge'){
      audio.sfx.alarm();stage?.angry();floater(`多收我 ¥${e.amount}？！`,headPos(frontCustomer(run)?.n),'bad big');
    } else if(e.type==='bagged'){
      audio.sfx.drop(2,true);
    } else if(e.type==='wrongChange'){
      audio.sfx.nope();stage?.angry();floater('找错了！',headPos(frontCustomer(run)?.n),'bad');
    } else if(e.type==='settle'){
      audio.sfx.kaching();stage?.receipt();
      floater(`+${yuan(e.paid)}`,headPos(e.customer),'money big');
      if(e.tip)setTimeout(()=>floater(`小费 +${yuan(e.tip)}${e.rush?' ×2':''}`,headPos(e.customer),'love'),220);
      if(e.mood===3){audio.tone(1568,.18,{type:'triangle',vol:.1,at:.18});stage?.cheer(e.customer);}
      const g=$('gmv-box');if(!reduced)g.animate([{scale:1},{scale:1.12},{scale:1}],{duration:260});
    } else if(e.type==='milestone'){
      banner(e.heal?`破 ${yuan(e.value)}！店长点赞，差评 −1`:`成交额破 ${yuan(e.value)}！`,'milestone');audio.sfx.gift();confetti();
    } else if(e.type==='fever'){
      banner('爆单时间！','fever');audio.sfx.cheer(true);confetti();
      stage?.setFever(true);$('stage').classList.add('fever');
    } else if(e.type==='feverEnd'){
      stage?.setFever(false);$('stage').classList.remove('fever');
      floater('爆单结束，继续攒！',{x:.5,y:.45},'hint');
    } else if(e.type==='arrive'){
      if(e.level>lastLevel){lastLevel=e.level;if(e.level%2===0)banner(e.level>=6?'人潮汹涌！':'客人越来越多了','last');}
      if(e.vip)floater('大单顾客进店',{x:.8,y:.3},'hint');
    } else if(e.type==='next'){
      if(e.vip)banner('大单来了！','last');
    } else if(e.type==='leave'){
      audio.sfx.fail();floater(e.waiting?'不排了！':'不买了！',headPos(e.customer),'bad big');
    } else if(e.type==='strike'){
      banner(`差评 ${e.strikes}/${STRIKES}`,'bad');
      const s=$('strikes');if(!reduced)s.animate([{translate:'0 0'},{translate:'-4px 0'},{translate:'4px 0'},{translate:'0 0'}],{duration:260,iterations:2});
    } else if(e.type==='over'){
      endDelay=1.4;audio.setMode(null);banner('店长：打烊了！','bad');stage?.clearItems();
    }
  }
  if(events.length){syncItems();drawPanel();drawHud();setMusic();}
}

// ——————— 流程 ———————
function openStart() {
  $('start-best').textContent=save.best?`最高成交额 ${yuan(save.best)} · ${rankOf(save.best)}`:'第一次上岗，加油';
  setup();
  $('result').hidden=true;$('start').hidden=false;
}
function setup() {
  run=startRun();shown='';playing=false;endDelay=-1;drag=null;shownGmv=0;lastLevel=0;musicMode='game';
  $('gmv').textContent=yuan(0);$('floaters').replaceChildren();$('banner').hidden=true;clearTimeout(bannerTimer);
  $('best').textContent=save.best?`最高 ${yuan(save.best)}`:'';
  stage?.reset();stage?.setFever(false);$('stage').classList.remove('fever');stage?.updateQueue(run);
  syncItems();drawPanel();drawHud();
}
function begin() {
  audio.unlock();audio.sfx.go();audio.setMode('game');
  $('start').hidden=true;$('result').hidden=true;playing=true;drawPanel();
  if(!reduced)$('stage').animate([{filter:'brightness(1.2)'},{filter:'none'}],{duration:300});
}
function act(fn) {
  if(!playing)return;
  const r=fn();handleEvents();drawPanel();return r;
}
function doTurn(side) {
  if(!playing||run.phase!=='scan')return;
  turn(run,side);stage?.turn(side);audio.sfx.rotate();drawGuide();
}
function doScan() { act(()=>scan(run)); }
function doPeel() { act(()=>peel(run)); }

function finish() {
  playing=false;drawSticker();audio.setMode('show');
  const record=run.gmv>save.best;
  save.plays++;save.best=Math.max(save.best,run.gmv);save.bestServed=Math.max(save.bestServed,run.served);writeSave();
  const m=Math.floor(run.time/60),s=String(Math.floor(run.time%60)).padStart(2,'0');
  const lines=[
    ['head','FRESH MART · 黑五夜班'],['sub',`营业 ${m}:${s} · 客流 Lv.${levelNow(run)+1}`],['rule'],
    ['sum','接待顾客',`${run.served} 位`],
    ['sum','开心离店',`${run.happy} 位`],
    ['sum','小费',yuan(run.tips)],
    ['sum','帮顾客省',yuan(run.saved)],
    ['sum','最高连扫',`×${run.bestCombo}`],
    ['sum','爆单时间',`${run.fevers} 次 +${yuan(run.feverCoins)}`],
    ['rule'],
    ...run.strikeLog.map(x=>['row gone',`差评 · ${x.name}`,x.reason]),
    ['rule'],
    ['sum strong','今日成交额',yuan(run.gmv)],
    ['sum',record?'新纪录！':'历史最高',yuan(save.best)],
  ];
  const box=$('receipt-lines');box.replaceChildren();
  $('stamp').hidden=true;$('result-actions').hidden=true;$('result-note').textContent='';
  $('result').hidden=false;
  const lineNodes=lines.map(([cls,a,b])=>{
    const n=document.createElement('div');n.className=cls.split(' ').map(x=>`r-${x}`).join(' ');
    if(cls==='head'||cls==='sub')n.textContent=a;
    else if(cls!=='rule')n.innerHTML=`<span>${a}</span><span>${b??''}</span>`;
    return n;
  });
  let k=0;
  const reveal=()=>{
    $('stamp').hidden=false;$('stamp-title').textContent=rankOf(run.gmv);
    $('stamp-sub').textContent=record?'新纪录':'';
    if(!reduced)$('stamp').animate([{scale:2.2,opacity:0,rotate:'-20deg'},{scale:1,opacity:1,rotate:'-8deg'}],{duration:280,easing:'cubic-bezier(.3,1.6,.6,1)'});
    audio.sfx.stamp();
    setTimeout(()=>{if(record){audio.sfx.win();confetti();}else audio.sfx.star(1);},260);
    const nextRank=RANKS.slice(1).find(([v])=>run.gmv<v);
    $('result-note').textContent=nextRank?`再卖 ${yuan(nextRank[0]-run.gmv)} 就是「${nextRank[1]}」`:'你就是今晚的收银之神';
    $('result-actions').hidden=false;
  };
  const stepLine=()=>{
    if(k<lineNodes.length){box.append(lineNodes[k++]);box.scrollTop=box.scrollHeight;audio.sfx.line();printTimer=setTimeout(stepLine,reduced?0:110);}
    else {printTimer=null;reveal();}
  };
  $('result').onclick=e=>{
    if(!printTimer||e.target.closest('button'))return;
    clearTimeout(printTimer);printTimer=null;while(k<lineNodes.length)box.append(lineNodes[k++]);reveal();
  };
  stepLine();
}

// ——————— 输入 ———————
$('go').addEventListener('click',begin);
$('turn-left').addEventListener('click',()=>doTurn('left'));
$('turn-right').addEventListener('click',()=>doTurn('right'));
$('scan').addEventListener('click',doScan);
$('sticker').addEventListener('click',e=>{e.stopPropagation();doPeel();});
$('sticker').addEventListener('pointerdown',e=>e.stopPropagation());
$('retry').addEventListener('click',()=>{setup();begin();});
$('mute').addEventListener('click',()=>{audio.toggle();$('mute').setAttribute('aria-pressed',String(audio.muted));});
$('mute').setAttribute('aria-pressed',String(audio.muted));

const touch=$('stage');
const toPx=(p,r)=>({x:r.left+p.x*r.width,y:r.top+p.y*r.height});
touch.addEventListener('pointerdown',event=>{
  if(!playing||run.phase!=='scan'||drag||event.button!==0)return;
  const r=touch.getBoundingClientRect();
  const item=stage?toPx(stage.itemTarget(),r):{x:r.left+r.width*.33,y:r.top+r.height*.6};
  if(Math.abs(event.clientX-item.x)>r.width*.24||Math.abs(event.clientY-item.y)>Math.max(70,r.height*.16))return;
  const target=stage?toPx(stage.scanTarget(),r).x:r.left+r.width*.66;
  try{touch.setPointerCapture(event.pointerId);}catch{/* 合成事件 */}audio.sfx.grab();
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,cx:item.x,target,distance:Math.max(44,target-item.x)};
});
touch.addEventListener('pointermove',event=>{
  if(drag?.id!==event.pointerId)return;
  stage?.drag((event.clientX-drag.x)/drag.distance);
});
function release(event,canceled) {
  if(drag?.id!==event.pointerId)return;
  const moved=event.clientX-drag.x,vertical=Math.abs(event.clientY-drag.y);
  const reached=event.clientX>=drag.target-24,d=drag;
  drag=null;stage?.drag(0);
  if(canceled)return;
  if(moved>=35&&reached)doScan();
  else if(moved<=-35)doTurn('right');
  else if(Math.abs(moved)<12&&vertical<14)doTurn(event.clientX<d.cx?'left':'right');
  else floater('拖过红线才能扫',itemPos(),'hint');
}
touch.addEventListener('pointerup',e=>release(e,false));
touch.addEventListener('pointercancel',e=>release(e,true));
document.addEventListener('keydown',event=>{
  if(event.repeat)return;
  if(!$('start').hidden&&(event.code==='Enter'||event.code==='Space')){event.preventDefault();begin();return;}
  if(!playing)return;
  if(event.target instanceof HTMLButtonElement&&(event.code==='Space'||event.code==='Enter'))return;
  if(run.phase==='scan'){
    if(event.code==='ArrowLeft'){event.preventDefault();doTurn('left');}
    if(event.code==='ArrowRight'){event.preventDefault();doTurn('right');}
    if(event.code==='Space'){event.preventDefault();doScan();}
    if(event.code==='KeyS'){event.preventDefault();doPeel();}
  } else if(run.phase==='pay'){
    if(!frontCustomer(run).bill&&(event.code==='Enter'||event.code==='Space')){event.preventDefault();act(()=>payCard(run));}
    const n=/^Digit([1-5])$/.exec(event.code);
    if(n&&frontCustomer(run).bill)giveBill(BILLS[Number(n[1])-1]);
  }
});

// ——————— 主循环 ———————
let last=0,acc=0;
function step(dt) {
  total+=dt;
  if(playing&&run.phase!=='over'){
    tick(run,dt);
    acc+=dt;if(acc>.1){acc=0;drawPatron();}
  }
  handleEvents();
  if(run.fever>0)drawFever();
  drawGmv(dt);
  if(endDelay>=0){endDelay-=dt;if(endDelay<0){finish();}}
  stage?.updateQueue(run);
  stage?.render(total,dt);
  placeSticker();
}
function frame(now) {
  const dt=last?Math.min(.06,(now-last)/1000):.016;last=now;step(dt);requestAnimationFrame(frame);
}
openStart();
requestAnimationFrame(frame);
if(dev){
  window.__lc={get run(){return run;},step,advance(sec){for(let n=0;n<sec*30;n++)step(1/30);},begin,doTurn,doScan,doPeel,
    pay:v=>v?giveBill(v):act(()=>payCard(run)),openStart,stage};
}
