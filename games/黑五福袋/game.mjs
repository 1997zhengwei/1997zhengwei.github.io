import {products,levels,size,drop,settle,applyPressure,total,capacity,cellOpen} from './packing.mjs';
import {packingStage} from './stage.mjs';
import {createAudio} from './audio.mjs';

const $=id=>document.getElementById(id);
const game=document.querySelector('.game');
const stage=packingStage($('stage'));
const images=stage.thumbnails();
const storageKey='black-friday-bag-v1';
// v3 stored scores but no stars. Use its original thresholds when importing a legacy save.
const v3Thresholds=[
  [500,830],[920,1210],[1200,1490],
  [1020,1450],[1250,1580],[1210,1610],
  [1310,1850],[1470,2040],[1600,2130],
];
let data;
try {data=JSON.parse(localStorage.getItem(storageKey));} catch {}
data={best:[],unlocked:0,muted:false,...data};
if(!Array.isArray(data.best))data.best=[];
const needsStarMigration=!Array.isArray(data.bestStars);
if(needsStarMigration){
  data.bestStars=levels.map((entry,index)=>{
    const best=data.best[index]??0;
    const [target,gold]=v3Thresholds[index];
    return Math.max(grade(entry,best),grade({target,gold},best));
  });
}
data.bestStars.forEach((stars,index)=>{
  if(stars>0)data.unlocked=Math.max(data.unlocked,Math.min(index+1,levels.length-1));
});
if(needsStarMigration)save();
let levelIndex=0, level=levels[0], layout=[], history=[];
let selected=null, turned=false, column=0, pointer=null, hover=false;
let overlayMode=null, feedbackTimer;
let stockFit=new Map();
const stock=new Map();

function save() {
  try {localStorage.setItem(storageKey,JSON.stringify(data));} catch {}
}

const kit=createAudio(()=>data.muted), sfx=kit.sfx;
const SOFT=['cookies','cocoa','tea','candles','audio','plush'];
function sound(kind,weight=2,id=null) {
  if(kind==='drop')sfx.drop(weight,id&&SOFT.includes(products[id].kind));
  else if(kind==='break')sfx.break();
  else if(kind==='rotate')sfx.rotate();
  else if(kind==='back')sfx.back();
  else if(kind==='cash')sfx.kaching();
}
// 第一次触碰时解锁音频并开背景乐（浏览器要求声音由用户操作触发）
for(const type of ['pointerdown','keydown'])document.addEventListener(type,()=>{kit.unlock();kit.music(true);},{once:true});

function message(text,warn=false) {
  const status=$('feedback');
  status.textContent=text;
  status.setAttribute('data-show','');
  status.toggleAttribute('data-warn',warn);
  clearTimeout(feedbackTimer);
  feedbackTimer=setTimeout(()=>status.removeAttribute('data-show'),1650);
}

function select(id) {
  if(selected===id)return;
  selected=id;
  turned=layout.find(item=>item.id===id)?.turned??false;
  const width=id?size(id,turned).w:1;
  column=Math.min(column,level.w-width);
}

function render(resetMotion=false) {
  const value=total(layout);
  const open=capacity(level)-layout.reduce((sum,item)=>sum+item.w*item.h,0);
  $('value').textContent='¥'+value;
  $('capacity').textContent=open ? '空 '+open+' 格' : '袋子满了';
  $('capacity').toggleAttribute('data-tight',open<=6);
  $('progress').style.width=Math.min(100,value/level.gold*100)+'%';
  $('pass-marker').style.left=(level.target/level.gold*100)+'%';
  const progress=$('progress').parentElement;
  progress.setAttribute('aria-valuemax',level.gold);
  progress.setAttribute('aria-valuenow',Math.min(level.gold,value));
  const cart=new Map(layout.map(item=>[item.id,item]));
  stockFit=new Map();
  let nextForGold=false;
  for(const id of level.items){
    const item=products[id];
    const orientations=item.w===item.h?[false]:[false,true];
    const legal=orientations.map(turned=>fits(id,turned));
    stockFit.set(id,legal);
    if(value>=level.target&&value<level.gold&&!cart.has(id)&&value+item.value>=level.gold){
      nextForGold||=orientations.some(turned=>fits(id,turned,true));
    }
  }
  $('objective').textContent=value>=level.gold ? '★★★ 已达三星'
    : value>=level.target ? '已达过关价 · 三星还差 ¥'+(level.gold-value) : '过关 ¥'+level.target+' · 三星 ¥'+level.gold;
  $('guide').textContent=nextForGold ? '再塞一件可冲三星'
    : layout.length ? (open<=6?'找找剩下的小空位':'拖回柜台可调整') : level.hint||'拖商品进袋，重物垫底';
  $('guide').toggleAttribute('data-chance',nextForGold);
  $('undo').disabled=!history.length;
  $('rotate').disabled=!selected;
  $('submit').disabled=!layout.length;
  for(const [id,{button,price}] of stock){
    const item=cart.get(id);
    button.toggleAttribute('data-packed',!!item);
    button.toggleAttribute('data-broken',!!item?.broken);
    button.toggleAttribute('data-no-fit',!item&&!stockFit.get(id).some(Boolean));
    button.setAttribute('aria-pressed',String(selected===id));
    price.textContent=item?.broken?'压坏':item?'已装':'¥'+products[id].value;
  }
  renderStage(resetMotion);
}

function fits(id,turned,protect=false) {
  const width=size(id,turned).w;
  for(let x=0;x<=level.w-width;x++){
    const result=drop(layout,id,turned,x,level);
    if(result.layout&&(!protect||!result.broken.length))return true;
  }
  return false;
}

function renderStage(resetMotion=false) {
  const preview=hover && selected ? drop(layout,selected,turned,column,level):null;
  const dragging=pointer?.moved ? {...pointer,turned} : null;
  stage.update(layout,preview,dragging,resetMotion);
  const label=$('selection');
  if(!selected){
    label.textContent='';label.removeAttribute('data-danger');return;
  }
  const item=products[selected],{w,h}=size(selected,turned);
  const options=stockFit.get(selected)??[], fitsThisWay=options[Number(turned)]??options[0];
  label.toggleAttribute('data-danger',!!preview?.broken?.length||(!preview?.layout&&!!preview));
  if(preview?.broken?.length)label.textContent=products[preview.broken[0]].name+'会被压坏';
  else if(preview?.reason==='shape')label.textContent=options.some(Boolean)?'袋沿或隔板挡住了':'这件太大';
  else if(!fitsThisWay)label.textContent=options.some(Boolean)?'旋转后有空位':'这件暂时放不下';
  else label.textContent=(item.limit?'易碎 · ':item.weight>=4?'重物 · ':'')+w+'×'+h+' 格';
}

function init(index) {
  levelIndex=index;level=levels[index];layout=[];history=[];
  selected=null;turned=false;column=0;hover=false;pointer=null;
  $('feedback').removeAttribute('data-show');
  $('levels').textContent='关卡 '+(index+1)+'/'+levels.length+' ⌄';
  $('bag-name').textContent=level.name;
  // 前三关没写底色：薄荷 / 天蓝 / 柠檬轮换
  $('stage').style.setProperty('--bag-backdrop',level.backdrop??['#c8f0e3','#d3ecff','#fff1c2'][index%3]);
  $('stage').style.setProperty('--bag-glow',level.glow??'#ffffff');
  stage.reset(level);
  stock.clear();
  $('stock').setAttribute('data-six',String(level.items.length===6));
  $('stock').toggleAttribute('data-wide',level.items.length>=9);
  $('stock').replaceChildren(...level.items.map(id=>{
    const item=products[id],button=document.createElement('button'),price=document.createElement('b');
    button.className='item';button.type='button';button.dataset.id=id;
    button.setAttribute('aria-label',item.name+'，原价 '+item.value+' 元'+(item.limit?'，易碎':''));
    const img=new Image();img.alt='';img.draggable=false;img.src=images[id];
    const name=document.createElement('span');name.textContent=item.name;
    price.className='price';
    button.append(img,name,price);stock.set(id,{button,price});return button;
  }));
  select(level.items[0]);hover=true;render();
}

function rotate() {
  if(!selected || overlayMode)return;
  turned=!turned;
  if(pointer?.moved)updatePointer(pointer.clientX,pointer.clientY);
  else {
    hover=true;
    column=Math.min(column,level.w-size(selected,turned).w);
    renderStage();
  }
  sound('rotate');
}

function commit(next,broken=[],landing=null) {
  history.push(layout);
  layout=next;
  render();
  if(landing) {
    stage.land(landing.entry,layout,broken,landing.origin,()=>sound(broken.length?'break':'drop',products[landing.entry.id].weight,landing.entry.id));
  }else sound(broken.length?'break':'back');
  if(broken.length){
    message(products[broken[0]].name+'被压坏了 · 可撤回',true);
  }
}

function place(origin=null) {
  if(!selected)return;
  const result=drop(layout,selected,turned,column,level);
  hover=false;
  if(!result.layout) {
    message(result.reason==='shape'?'袋沿或隔板挡住了 · 试试换个方向':'装不下 · 换一列或旋转',true);
    renderStage();return;
  }
  const id=selected, wasPacked=layout.some(item=>item.id===id);
  const next=wasPacked ? id : level.items.find(id=>!result.layout.some(item=>item.id===id));
  select(next??null);
  commit(result.layout,result.broken,{entry:result.entry,origin});
  if(!result.broken.length && !wasPacked)message('装入'+products[id].name+'　+¥'+products[id].value);
}

function remove(id){
  const next=settle(layout.filter(item=>item.id!==id),level);
  const broken=applyPressure(next,level);
  commit(next,broken);
  if(!broken.length)message(products[id].name+'放回柜台');
}

function undo() {
  if(!history.length)return;
  layout=history.pop();hover=false;
  message('已撤回');
  render(true);
}

function inBag(grid) {
  return grid.x>=-.18&&grid.x<=level.w+.18&&grid.y>=-.18&&grid.y<=level.h+.72;
}

function aim(grid) {
  const width=size(selected,turned).w;
  column=Math.max(0,Math.min(level.w-width,Math.round(grid.x-width/2)));
}

function updatePointer(clientX,clientY){
  const point=stage.point(clientX,clientY), grid=stage.grid(point);
  Object.assign(pointer,{point,clientX,clientY});
  pointer.moved||=Math.hypot(clientX-pointer.x,clientY-pointer.y)>6;
  hover=pointer.moved&&inBag(grid);
  if(hover)aim(grid);
  renderStage();
}

game.addEventListener('pointerdown',event=>{
  if(pointer || overlayMode || !event.isPrimary || event.button!==0)return;
  const tile=event.target.closest('[data-id]');
  const onStage=$('stage').contains(event.target);
  if(!tile && !onStage)return;
  const point=stage.point(event.clientX,event.clientY), grid=stage.grid(point);
  const piece=onStage && layout.find(item=>grid.x>=item.x && grid.x<item.x+item.w && grid.y>=item.y && grid.y<item.y+item.h);
  const id=tile?.dataset.id||piece?.id||selected;
  if(!id || (onStage&&!inBag(grid)))return;
  select(id);hover=false;
  pointer={id,pointerId:event.pointerId,x:event.clientX,y:event.clientY,fromBag:!!layout.find(item=>item.id===id),piece:!!piece,tile:!!tile,point,moved:false};
  game.setPointerCapture(event.pointerId);
  render();
});
game.addEventListener('pointermove',event=>{
  if(pointer?.pointerId===event.pointerId)updatePointer(event.clientX,event.clientY);
});
game.addEventListener('pointerup',event=>{
  if(pointer?.pointerId!==event.pointerId)return;
  const action=pointer;
  const point=stage.point(event.clientX,event.clientY), grid=stage.grid(point);
  pointer=null;
  hover=false;
  if(inBag(grid) && (action.moved || (!action.tile&&!action.piece))){
    aim(grid);place(point);
  }else if(action.moved && action.fromBag && event.clientY>=$('stock').getBoundingClientRect().top){
    remove(action.id);
  }else {
    hover=action.tile && !action.moved;
    renderStage();
  }
});
game.addEventListener('lostpointercapture',event=>{
  if(pointer?.pointerId!==event.pointerId)return;
  pointer=null;hover=false;renderStage();
});
$('stock').addEventListener('click',event=>{
  if(event.detail!==0)return;
  const button=event.target.closest('[data-id]');
  if(button){select(button.dataset.id);hover=true;$('stage').focus({preventScroll:true});render();}
});
$('rotate').addEventListener('click',rotate);
$('undo').addEventListener('click',undo);
document.addEventListener('keydown',event=>{
  if(overlayMode || event.altKey || event.metaKey)return;
  if(event.key.toLowerCase()==='r'){event.preventDefault();rotate();}
  if(event.ctrlKey && event.key.toLowerCase()==='z'){event.preventDefault();undo();}
  if(!selected || event.ctrlKey)return;
  if(['ArrowLeft','ArrowRight'].includes(event.key)){
    event.preventDefault();
    column=Math.max(0,Math.min(level.w-size(selected,turned).w,column+(event.key==='ArrowLeft'?-1:1)));
    hover=true;renderStage();
  }else if(event.key==='Enter' && hover && document.activeElement?.tagName!=='BUTTON'){
    event.preventDefault();place();
  }
});

function openOverlay(mode,children) {
  overlayMode=mode;
  $('overlay-body').replaceChildren(...children);
  if(!$('overlay').open)$('overlay').showModal();
}
$('overlay').addEventListener('close',()=>{overlayMode=null;});

function element(tag,text,className=''){
  const node=document.createElement(tag);node.textContent=text;node.className=className;return node;
}

function grade(entry,value) {
  return value>=entry.gold?3:value>=Math.ceil((entry.target+entry.gold)/2)?2:value>=entry.target?1:0;
}

function bagBadge(entry) {
  const badge=element('span','','bag-badge');
  badge.style.setProperty('--cols',entry.w);
  badge.style.setProperty('--rows',entry.h);
  badge.style.setProperty('--bag-ink',entry.trim??'#bb7447');
  badge.setAttribute('aria-hidden','true');
  for(let y=entry.h-1;y>=0;y--)for(let x=0;x<entry.w;x++){
    const cell=element('i','');
    cell.classList.toggle('open',cellOpen(entry,x,y));
    cell.classList.toggle('seam',entry.divider?.column===x&&y<entry.divider.height);
    badge.append(cell);
  }
  return badge;
}

$('levels').addEventListener('click',()=>{
  const list=element('div','','level-options');
  levels.forEach((entry,index)=>{
    const best=data.best[index]??0;
    const button=element('button','','level-card');
    button.disabled=index>data.unlocked;
    const label=element('span','','level-card-name');
    label.append(element('b',(index+1)+' · '+entry.name),
      element('small',button.disabled?'通关上一袋解锁':best?'最佳 ¥'+best:'过关 ¥'+entry.target));
    const stars=data.bestStars[index]??0;
    button.append(bagBadge(entry),label,
      element('span','★'.repeat(stars)+'☆'.repeat(3-stars),'level-stars'));
    if(index===levelIndex)button.setAttribute('aria-current','true');
    button.addEventListener('click',()=>{
      if(index!==levelIndex)init(index);
      $('overlay').close();
    });
    list.append(button);
  });
  openOverlay('levels',[element('h2','选择福袋'),list]);
});

// ——结账开袋：商品一件件弹出、价格滚动累加、福袋惊喜赠品、赚了几倍、盖章、星星——
// 赠品按装满程度抽：装得越满惊喜越大。赠品只算进「总价值」，不影响过关和星级。
const GIFTS={
  big:[{name:'黑五金卡',value:200},{name:'蓝牙耳夹',value:199},{name:'拍立得相纸',value:129}],
  mid:[{name:'保温杯',value:89},{name:'香薰蜡烛',value:69},{name:'毛绒挂件',value:59}],
  small:[{name:'暖手宝',value:39},{name:'帆布袋',value:29},{name:'钥匙扣',value:19}],
};
let revealTimers=[];
function clearReveal(){revealTimers.forEach(clearTimeout);revealTimers=[];}
function later(fn,ms){revealTimers.push(setTimeout(fn,ms));}
function confettiIn(host,count){
  const colors=['#e4573d','#f3c242','#2f8f6c','#7b6bd0','#fff4d6'];
  for(let i=0;i<count;i++){
    const bit=element('i','','rv-confetti');
    bit.style.left=Math.random()*100+'%';
    bit.style.background=colors[i%colors.length];
    host.append(bit);
    bit.animate([{transform:'translateY(-20px) rotate(0)',opacity:1},{transform:`translate(${(Math.random()-.5)*80}px,${260+Math.random()*160}px) rotate(${Math.random()*720}deg)`,opacity:0}],
      {duration:1300+Math.random()*900,delay:Math.random()*300,easing:'cubic-bezier(.3,.2,.7,1)'}).onfinish=()=>bit.remove();
  }
}
function showResult(){
  clearReveal();
  const value=total(layout), pass=value>=level.target, stars=grade(level,value);
  const prevBest=data.best[levelIndex]??0;
  data.best[levelIndex]=Math.max(value,prevBest);
  data.bestStars[levelIndex]=Math.max(stars,data.bestStars[levelIndex]??0);
  if(pass)data.unlocked=Math.max(data.unlocked,Math.min(levelIndex+1,levels.length-1));
  save();
  const used=layout.reduce((sum,item)=>sum+item.w*item.h,0), fill=used/capacity(level);
  const tier=fill>=.95?'big':fill>=.85?'mid':'small';
  const pool=GIFTS[tier], gift=pool[Math.floor(Math.random()*pool.length)];
  const worth=value+gift.value;

  const box=element('div','','reveal');
  const title=element('h2',pass?'开袋！':'还差 ¥'+(level.target-value)+' 过关');
  const items=element('ul','','rv-items');
  const sorted=[...layout].sort((a,b)=>products[b.id].value-products[a.id].value);
  const chips=sorted.map(item=>{
    const li=element('li','',item.broken?'broken':'');
    const img=new Image();img.alt='';img.src=images[item.id];
    li.append(img,element('span',products[item.id].name),element('b',item.broken?'压坏':'¥'+products[item.id].value));
    items.append(li);return li;
  });
  const giftRow=element('div','','rv-gift');
  giftRow.append(element('i','','rv-giftbox'),element('span',`福袋惊喜 · 装满 ${Math.round(fill*100)}%`),element('b',`${gift.name} ¥${gift.value}`));
  const sum=element('div','','rv-sum');
  const worthNum=element('b','¥0','rv-worth');
  const times=element('b','','rv-times');
  sum.append(element('span','实付 ¥99 → 到手价值'),worthNum,times);
  const starRow=element('div','','rv-stars');
  const starEls=[0,1,2].map(()=>{const s=element('i','');starRow.append(s);return s;});
  const stamp=element('div',`省 ¥${Math.max(0,worth-99)}`,'rv-stamp');
  const note=element('p',pass?(stars<3?`三星要装到 ¥${level.gold}，还差 ¥${level.gold-value}`:value>prevBest?'新纪录！':'三星福袋！'):'换掉占地大又不值钱的，再试一次','rv-note');
  const actions=element('div','','result-actions');
  const adjust=element('button','继续调整',pass?'secondary':'primary');
  const retry=element('button','重新装','secondary');
  adjust.addEventListener('click',()=>{clearReveal();$('overlay').close();});
  retry.addEventListener('click',()=>{clearReveal();init(levelIndex);$('overlay').close();});
  actions.append(adjust,retry);
  if(pass&&levelIndex<levels.length-1){
    const next=element('button','下一关 →','primary');
    next.addEventListener('click',()=>{clearReveal();init(levelIndex+1);$('overlay').close();});
    actions.append(next);
  }
  box.append(title,items,giftRow,sum,starRow,note,stamp,actions);
  openOverlay('results',[box]);
  sfx.kaching();

  // 演出时间线；点一下弹窗任意处直接跳到结果
  let shown=0, running=0;
  const showChip=i=>{chips[i].classList.add('in');sfx.line();running+=chips[i].classList.contains('broken')?0:products[sorted[i].id].value;worthNum.textContent='¥'+running;};
  chips.forEach((_,i)=>later(()=>{showChip(i);shown=i+1;},250+i*170));
  const t0=250+chips.length*170;
  const finale=()=>{
    for(let i=shown;i<chips.length;i++){chips[i].classList.add('in');}
    shown=chips.length;
    giftRow.classList.add('in');worthNum.textContent='¥'+worth;
    times.textContent=`赚了 ${(worth/99).toFixed(1)} 倍`;times.classList.add('in');
    starEls.forEach((s,i)=>{if(i<stars)s.classList.add('on');});
    stamp.classList.add('in');note.classList.add('in');actions.classList.add('in');
  };
  later(()=>{giftRow.classList.add('in');sfx.gift();worthNum.textContent='¥'+worth;},t0+200);
  later(()=>{times.textContent=`赚了 ${(worth/99).toFixed(1)} 倍`;times.classList.add('in');sfx.kaching();},t0+650);
  for(let i=0;i<stars;i++)later(()=>{starEls[i].classList.add('on');sfx.star(i);},t0+1000+i*260);
  later(()=>{stamp.classList.add('in');sfx.stamp();note.classList.add('in');actions.classList.add('in');
    if(stars===3){sfx.win();confettiIn(box,60);}else if(!pass)sfx.fail();},t0+1100+stars*260);
  box.addEventListener('pointerdown',event=>{
    if(event.target.closest('button')||actions.classList.contains('in'))return;
    clearReveal();finale();
    if(stars===3)confettiIn(box,40);
  });
}
$('submit').addEventListener('click',showResult);
$('overlay').addEventListener('close',clearReveal);

function updateMute(){
  $('mute').textContent=data.muted?'♪̸':'♪';
  $('mute').setAttribute('aria-pressed',String(data.muted));
}
$('mute').addEventListener('click',()=>{data.muted=!data.muted;save();updateMute();kit.muteChanged();});
updateMute();
init(Math.min(data.unlocked,levels.length-1));
