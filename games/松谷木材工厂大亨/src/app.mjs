import {Company} from './empire.mjs';
import {MillView} from './scene.mjs';
import {PINS,CONTROL_PADS} from './yard.mjs';
import {renderPortfolio} from './portfolio.mjs';
import {ParkView} from './park.mjs';

const $=id=>document.getElementById(id);
const number=new Intl.NumberFormat('zh-CN');
const outlines={
  map:'M2 6 L9 3 L17 6 L24 3 V21 L17 24 L9 21 L2 24 Z M9 3 V21 M17 6 V24',
  trophy:'M8 4 H18 V10 Q18 16 13 17 Q8 16 8 10 Z M8 6 H3 V9 Q3 13 9 13 M18 6 H23 V9 Q23 13 17 13 M13 17 V22 M8 23 H18',
  finish:'M3 19 H23 V23 H3 Z M5 19 V6 H21 V19 M9 6 V3 H17 V6 M8 12 H18 M10 15 H16',
  tree:'M12 2 L5 10 H8 L4 15 H9 L3 21 H21 L15 15 H20 L16 10 H19 Z M12 21 V25',
  order:'M7 5 H4 V23 H21 V5 H17 M8 4 H10 V2 H15 V4 H17 V8 H8 Z M8 12 H17 M8 16 H17 M8 20 H14',
  view:'M9 3 H3 V9 M17 3 H23 V9 M23 17 V23 H17 M9 23 H3 V17 M9 13 H17 M13 9 V17',
  sound:'M3 10 H8 L14 5 V21 L8 16 H3 Z M18 9 Q22 13 18 17 M21 6 Q27 13 21 20',
  mute:'M3 10 H8 L14 5 V21 L8 16 H3 Z M18 10 L23 16 M23 10 L18 16',
  truck:'M2 6 H16 V18 H2 Z M16 9 H20 L24 13 V18 H16 M18 10 V14 H24 M7 18 A2.5 2.5 0 1 0 7 23 A2.5 2.5 0 1 0 7 18 M20 18 A2.5 2.5 0 1 0 20 23 A2.5 2.5 0 1 0 20 18',
  saw:'M13 3 L16 6 L20 5 L21 10 L24 13 L21 16 L20 21 L16 20 L13 24 L10 20 L6 21 L5 16 L2 13 L5 10 L6 5 L10 6 Z M16 13 A3 3 0 1 0 10 13 A3 3 0 1 0 16 13',
  fork:'M2 12 H8 L10 17 H15 V20 H2 Z M5 12 V5 H10 L13 13 M16 4 V19 H24 M7 20 A2 2 0 1 0 7 24 A2 2 0 1 0 7 20 M13 20 A2 2 0 1 0 13 24 A2 2 0 1 0 13 20',
  stack:'M3 6 L18 3 L24 6 L10 10 Z M3 6 V11 L10 15 L24 10 V6 M3 12 V16 L10 20 L24 15 V11 M3 17 V21 L10 25 L24 20 V16 M10 10 V14 M10 16 V19 M10 21 V24',
  log:'M7 6 L18 3 Q25 4 24 10 Q23 14 19 15 L8 20 M7 6 C1 6 1 20 7 20 C14 20 14 6 7 6 Z M7 10 C4 10 4 16 7 16 C10 16 10 10 7 10 Z M11 8 L20 5 M13 13 L24 10',
  gear:'M11 3 H15 L16 6 L18 7 L21 6 L23 10 L21 13 L21 15 L23 18 L20 22 L17 21 L15 24 H11 L10 21 L8 20 L5 21 L3 17 L5 14 L5 12 L3 9 L6 5 L9 6 Z M16.7 13 A3.7 3.7 0 1 0 9.3 13 A3.7 3.7 0 1 0 16.7 13'
};

function icon(node,name=node.dataset.icon){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=56;canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');
  ctx.scale(2,2);ctx.translate(1,1);
  ctx.strokeStyle=getComputedStyle(node).color;ctx.lineWidth=1.85;
  ctx.lineCap=ctx.lineJoin='round';
  ctx.stroke(new Path2D(outlines[name]||outlines.gear));
  node.replaceChildren(canvas);
}
function paintIcons(root=document){
  root.querySelectorAll('[data-icon]').forEach(node=>icon(node));
}

class MillSound {
  constructor(){ this.ctx=null; this.enabled=true; }
  init(){
    if(!this.enabled)return;
    try {
      if(!this.ctx) this.ctx=new AudioContext();
      if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
    } catch {}
  }
  note(from,to,seconds,volume,wave='sine',delay=0){
    const c=this.ctx;
    if(!this.enabled||!c||c.state!=='running')return;
    const at=c.currentTime+delay,osc=c.createOscillator(),gain=c.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(from,at);
    osc.frequency.exponentialRampToValueAtTime(to,at+seconds);
    gain.gain.setValueAtTime(.001,at);
    gain.gain.linearRampToValueAtTime(volume,at+.018);
    gain.gain.exponentialRampToValueAtTime(.001,at+seconds);
    osc.connect(gain);gain.connect(c.destination);osc.start(at);osc.stop(at+seconds+.01);
  }
  event(event){
    if(event.type==='start') {
      if(event.station==='inbound')this.note(105,64,.50,.069,'triangle');
      else this.note(245,185,.137,.043,'triangle');
    }
    if(event.type==='cut'){
      this.note(99,73,.80,.036,'sawtooth');this.note(250,163,.84,.028,'triangle',.06);
    }
    if(event.type==='piece'&&event.station==='saw')this.note(130,78,.075,.045,'triangle');
    if(event.type==='piece'&&event.station==='inbound')this.note(85,63,.077,.043,'triangle');
    if(event.type==='upgrade'||event.type==='hire')this.note(405,610,.15,.048,'sine');
    if(event.type==='sale') [452,592,752,874].forEach((f,i)=>this.note(f,f,.19,.061,'sine',i*.071));
  }
}

const audio=new MillSound();
const actionButtons=Object.fromEntries([...document.querySelectorAll('[data-action]')].map(b=>[b.dataset.action,b]));
const pins=Object.fromEntries([...document.querySelectorAll('[data-pin]')].map(b=>[b.dataset.pin,b]));
const plates=Object.fromEntries([...document.querySelectorAll('[data-upgrade]')].map(b=>[b.dataset.upgrade,b]));
const stationsOnMap=Object.fromEntries([...document.querySelectorAll('[data-station-pin]')].map(node=>[node.dataset.stationPin,node]));
const views=new Map();
let view,mill,company,tipTimer,tab='upgrade',shown=false,lastUi=0;
let portfolioMode='',portfolioState='',awards=0;
let park,parkOpen=false,selectedPlot='',drag=null;
const parkTags=new Map();

function tip(message,duration=2300){
  const t=$('tip');
  t.textContent=message;t.hidden=false;
  clearTimeout(tipTimer);
  tipTimer=setTimeout(()=>{t.hidden=true;},duration);
}

function floating(message,where,type=''){
  if(!view)return;
  const pos=view.project(PINS[where]);
  if(!pos.visible)return;
  const node=document.createElement('div');node.className='float '+type;
  node.textContent=message;node.style.left=pos.x+'px';node.style.top=pos.y+'px';
  $('floaters').append(node);
  setTimeout(()=>node.remove(),1280);
}

function eventHandler(event,siteId){
  if(['start','sale','upgrade','hire','end'].includes(event.type))company.save();
  let medal;
  if(event.type==='sale'){
    const unlocked=company.badges().filter(b=>b.value>=b.total);
    if(unlocked.length>awards){
      awards=unlocked.length;
      medal=unlocked.at(-1).name;
      $('honor').classList.remove('celebrate');
      requestAnimationFrame(()=>$('honor').classList.add('celebrate'));
    }
  }
  if(siteId!==company.active||parkOpen){
    if(medal)tip('勋章解锁 · '+medal+'　'+company.title,3200);
    return;
  }
  audio.event(event);
  if(event.type==='cut')view?.sparks(-.22,1.12,.51,20);
  if(event.type==='piece'&&event.station==='saw'&&event.job.done===event.job.total){
    floating((mill.finish?'毛板':'松木板')+' +'+event.job.total,mill.finish?'finish':'stack');
  }
  if(event.type==='end'&&event.station==='finish')floating(mill.region.product+' +'+event.total,'stack');
  if(event.type==='end'&&event.station==='inbound')floating('原木 +'+event.total,'inbound');
  if(event.type==='sale'){
    floating('+$'+number.format(event.payout),'dispatch','sale');
    tip(medal?'勋章解锁 · '+medal+'　+$'+number.format(event.payout):
      event.finished.length?'订单完成 · '+event.finished.at(-1).name+'　+$'+number.format(event.payout):
      event.total+' '+mill.region.unit+'发货到账 · +$'+number.format(event.payout),3050);
  }
  if(event.type==='upgrade')tip(event.station==='yard'?'新料位启用 · 容量 +18 件':mill.stationConfig(event.station).name+' 已升级');
  if(event.type==='hire')tip(mill.stationConfig(event.station).operator+' 已上岗 · 自动生产');
}

function focus(name){
  if(!view)return;
  const selected=name===view.focus?'overview':name;
  view.setFocus(selected);
  $('game').dataset.focus=selected;
  projectPins();
}

function projectPins(){
  if(view.focus!=='overview')return;
  for(const [name,node] of Object.entries(stationsOnMap)){
    if(node.hidden)continue;
    const {x,y}=view.project(CONTROL_PADS[name]);
    node.style.setProperty('--x',Math.round(x)+'px');
    node.style.setProperty('--y',Math.round(y)+'px');
  }
}

function start(station){
  audio.init();
  const s=mill.state;
  const first=station==='inbound'?!s.firstSeen:station==='saw'?s.sawn===0:station==='finish'?s.refined===0:s.trucks===0;
  if(!mill.start(station))return;
  if(first&&view.focus!==station)focus(station);
  refresh();
}

function setText(node,text){
  const value=String(text);
  if(node.textContent!==value)node.textContent=value;
}

function refresh(){
  const s=mill.state,order=mill.order;
  const stations=mill.stations;
  const badges=company.badges();
  const badgeCount=badges.filter(b=>b.value>=b.total).length;
  if(badgeCount>awards){
    awards=badgeCount;
    $('honor').classList.remove('celebrate');
    requestAnimationFrame(()=>$('honor').classList.add('celebrate'));
  }
  setText($('factory-count'),number.format(company.sites.size));
  setText($('badge-count'),badgeCount+'/'+badges.length);
  setText($('cash'),number.format(s.cash));
  setText($('order'),order.name);
  setText($('rank'),company.title);
  setText($('order-count'),s.filled+' / '+order.units);
  setText($('order-bonus'),'达成 +$'+number.format(order.bonus));
  $('order-bar').style.width=s.filled/order.units*100+'%';
  for(const [id,count,capacity] of [['logs',s.logs,mill.logsCap],['rough',s.rough,mill.roughCap],['boards',s.planks,mill.boardsCap]]){
    const stock=$(id);
    if(stock.firstChild.nodeValue!==String(count))stock.firstChild.nodeValue=String(count);
    setText(stock.querySelector('span'),' / '+capacity);
  }
  const info=Object.fromEntries(stations.map(k=>[k,mill.info(k)]));
  const nextSite=company.nextSite;
  $('atlas').classList.toggle('can-open',!!nextSite);
  const atlasLabel=parkOpen?'返回工厂':nextSite?'工业园地图，可开新厂':'工业园地图';
  if($('atlas').getAttribute('aria-label')!==atlasLabel)$('atlas').setAttribute('aria-label',atlasLabel);
  let recommended='';
  if(info.dispatch.ready&&(s.planks>=mill.truckCap||!info.saw.ready&&!s.jobs.saw&&!info.finish?.ready)) recommended='dispatch';
  else if(info.finish?.ready&&(s.rough>=mill.finishCap*mill.finish.ratio||!s.jobs.saw&&!info.saw.ready||!s.planks))recommended='finish';
  else if(info.saw.ready)recommended='saw';
  else if(info.inbound.ready&&!s.logs)recommended='inbound';
  else if(info.dispatch.ready)recommended='dispatch';
  else if(info.inbound.ready&&s.logs<mill.logsCap/2)recommended='inbound';
  const instruction=recommended==='dispatch'?'装车发货，按车次结算订单':
    recommended==='finish'?'加工毛板，产出'+mill.region.product:
    recommended==='saw'?'锯切原木，每根产出 '+mill.batch+' 块':
    recommended==='inbound'?'叫一辆原木车，补充锯台原料':'继续生产，装车后交付订单';
  setText($('order-instruction'),nextSite?'资金和出货已达标，去工业园开设'+nextSite.name:instruction);
  for(const key of stations){
    const data=info[key],job=s.jobs[key],button=actionButtons[key];
    button.disabled=!data.ready;
    button.dataset.active=String(!!job);
    if(button.dataset.recommend!==String(recommended===key)){
      button.dataset.recommend=String(recommended===key);
      icon(button.querySelector('.action-icon'));
    }
    setText(button.querySelector('strong'),data.text);
    setText(button.querySelector('small'),job?(job.done+' / '+job.total+(key==='inbound'?' 根':key==='saw'?' 块':' '+mill.region.unit)):
      s.crew[key]&&s.auto[key]?'自动已开':
      key==='dispatch'&&data.ready?'预计 +$'+number.format(mill.estimate()):
      key==='inbound'?'运入原木':key==='saw'?'每根 '+mill.batch+' 块':key==='finish'?'每批 '+mill.finishCap+' '+mill.region.unit:'订单交付');
    button.querySelector('.action-fill').style.width=(data.progress*100)+'%';
  }
  for(const key of [...stations,'yard']){
    const plate=plates[key],cost=mill.quote(key);
    const operation=key==='yard'?'扩建':'升级';
    const label=cost===null?'已满级':operation+' $'+number.format(cost);
    plate.disabled=cost===null||s.cash<cost;
    setText(plate,label);
    const description=mill.stationConfig(key).name+' · '+label;
    if(plate.title!==description){plate.title=description;plate.setAttribute('aria-label',description);}
  }
  if(shown) refreshShop();
  if(portfolioMode)refreshPortfolio();
  if(parkOpen)refreshParkPanel();
}

function refreshShop(){
  const s=mill.state;
  $('shipped').textContent=number.format(s.shipped);$('peak').textContent=number.format(s.peak);
  $('manage-cards').querySelectorAll('.buy').forEach(button=>{
    const station=button.dataset.station;
    if(tab==='upgrade') {
      const cost=mill.quote(station);
      button.disabled=cost===null||s.cash<cost;
      button.textContent=cost===null?'已满级':'$'+number.format(cost)+' 升级';
      button.closest('.upgrade-card').querySelector('b').textContent='Lv. '+s.levels[station]+' / '+(station==='yard'?7:15);
    } else if(s.crew[station]){
      button.disabled=false;button.textContent=s.auto[station]?'自动 · 开':'自动 · 关';
      button.closest('.upgrade-card').querySelector('b').textContent='已上岗';
    } else {
      const cost=mill.hirePrice(station);
      button.disabled=s.cash<cost;button.textContent='$'+number.format(cost)+' 雇用';
    }
  });
}

function renderShop(nextTab=tab){
  tab=nextTab;
  document.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tab===tab)));
  const cards=$('manage-cards');
  cards.replaceChildren();
  const list=tab==='crew'?mill.stations:[...mill.stations,'yard'];
  for(const station of list){
    const item=mill.stationConfig(station),row=document.createElement('article');
    row.className='upgrade-card';
    const title=tab==='crew'?item.operator:item.name;
    const effect=tab==='crew'?(station==='dispatch'?'优先攒满一车再发货，可自行开关。':'自动执行'+item.name+'，可自行开关。'):item.effect;
    row.innerHTML='<span class="badge" data-icon="'+item.icon+'" aria-hidden="true"></span>'+
      '<div><h3>'+title+' <b></b></h3><p>'+effect+'</p></div>'+
      '<button class="buy" type="button" data-station="'+station+'"></button>';
    row.querySelector('.buy').onclick=()=>{
      audio.init();
      if(tab==='upgrade')mill.upgrade(station);
      else if(mill.state.crew[station])mill.toggle(station);
      else mill.hire(station);
      company.save();
      refresh();
    };
    cards.append(row);
  }
  paintIcons(cards);refreshShop();
}

function describeSite(){
  const site=company.mill.region;
  setText($('factory-number'),site.number+' 号厂 · '+site.area);
  setText($('factory-name'),site.name);
}

function loadSite(){
  const site=company.mill.region;
  const next=views.get(site.id)??new MillView($('scene'),company.mill,view?.renderer);
  if(view&&view!==next)view.deactivate();
  view=next;mill=company.mill;
  view.activate();views.delete(site.id);views.set(site.id,view);
  if(views.size>3){
    const [id,oldest]=views.entries().next().value;
    oldest.dispose();views.delete(id);
  }
  describeSite();
  setText($('product-label'),site.product);
  $('rough-stock').hidden=stationsOnMap.finish.hidden=!mill.finish;
  $('game').dataset.finishing=String(!!mill.finish);
  $('game').style.setProperty('--site',site.color);
  $('game').dataset.focus=view.focus;
  $('floaters').replaceChildren();
  refresh();view.render(0);projectPins();
}

function enterSite(id){
  const wasOpen=company.sites.has(id);
  if(!company.open(id)||!company.select(id))return;
  if(portfolioMode)closePortfolio();
  if(parkOpen)closePark();
  loadSite();
  if(!wasOpen){
    audio.event({type:'sale'});
    tip(mill.region.name+' · 正式投产',3000);
  }
}

function refreshParkPanel(){
  const site=park.plots.find(plot=>plot.id===selectedPlot);
  if(!site)return;
  const factory=company.sites.get(site.id),rule=company.requirement(site.id);
  const next=site.id===company.nextPlot.id;
  const action=$('park-plot-action');
  setText($('factory-number'),number.format(company.sites.size)+' 座工厂 · 可扩建');
  setText($('park-plot-name'),site.name);
  setText($('park-plot-type'),factory?'已投产':next?'待扩建地块':'待开放地块');
  setText($('park-plot-details'),factory?site.card+' · 已交付 '+number.format(factory.state.shipped)+' 件':
    rule.previous+'出货 '+number.format(Math.min(rule.delivered,rule.units))+' / '+number.format(rule.units));
  setText(action,factory?'进入厂区':'建厂 $'+number.format(site.cost));
  action.disabled=!factory&&company.nextSite?.id!==site.id;
}

function selectPlot(id){
  selectedPlot=id;park.focus(id);refreshParkPanel();
}

function projectParkTags(){
  const visible=new Set(),nextId=company.nextPlot.id;
  $('park-nodes').classList.toggle('compact-tags',park.width/park.extentNow<5);
  for(const [index,lot] of park.lots){
    const {x,y}=park.project(index),site=park.plots[index];
    if(x<37||x>park.width-37||y<87||y>park.height-118)continue;
    if(x>park.width-87&&y<125)continue;
    visible.add(site.id);
    let tag=parkTags.get(site.id);
    if(!tag){
      tag=document.createElement('button');tag.type='button';tag.className='park-tag';
      tag.innerHTML='<b></b><span></span>';tag.querySelector('b').textContent=site.number;
      tag.onclick=()=>selectPlot(site.id);parkTags.set(site.id,tag);$('park-nodes').append(tag);
    }
    tag.style.left=Math.round(x)+'px';tag.style.top=Math.round(y)+'px';
    tag.dataset.owned=String(lot.owned);
    tag.dataset.next=String(site.id===nextId);
    tag.setAttribute('aria-pressed',String(site.id===selectedPlot));
    tag.setAttribute('aria-label',site.name+(lot.owned?'，已投产':'，地块'));
    setText(tag.querySelector('span'),lot.owned?site.name:site.id===nextId?'下一块地':'待开放');
  }
  for(const [id,tag] of parkTags)if(!visible.has(id)){tag.remove();parkTags.delete(id);}
}

function openPark(){
  if(!park)park=new ParkView($('scene'),company,view.renderer);
  parkOpen=true;selectedPlot=company.active;
  view.deactivate();park.activate(selectedPlot);
  $('game').dataset.mode='park';$('park-ui').hidden=false;
  setText($('factory-name'),'松谷工业园');setText($('atlas-label'),'返回');
  $('floaters').replaceChildren();$('tip').hidden=true;
  refresh();park.render(0);projectParkTags();
}

function closePark(){
  parkOpen=false;drag=null;park.deactivate();view.activate();
  $('game').dataset.mode='factory';$('park-ui').hidden=true;
  setText($('atlas-label'),'园区');describeSite();refresh();
}

function buildPlot(){
  if(company.sites.has(selectedPlot)){enterSite(selectedPlot);return;}
  const built=company.open(selectedPlot);
  if(!built)return;
  park.sync();refresh();audio.init();audio.event({type:'sale'});
  tip(built.region.name+' · 正式投产',2400);
}

function refreshPortfolio(){
  const signature=JSON.stringify([portfolioMode,company.active,company.cash,company.badges().map(b=>b.value),
    [...company.sites.values()].map(m=>m.state.shipped)]);
  if(signature===portfolioState)return;
  portfolioState=signature;
  const content=$('portfolio-content'),scroll=content.scrollTop;
  if(content.querySelector('.honor-preview'))return;
  const current=document.activeElement?.dataset.site;
  renderPortfolio(content,portfolioMode,company,enterSite);
  content.scrollTop=scroll;
  if(current)content.querySelector('[data-site="'+current+'"]')?.focus({preventScroll:true});
}

function openPortfolio(mode){
  portfolioMode=mode;portfolioState='';
  $('portfolio-content').replaceChildren();
  $('portfolio-title').textContent=mode==='atlas'?'工厂列表':'荣誉馆';
  $('portfolio').hidden=false;
  refreshPortfolio();$('close-portfolio').focus();
}

function closePortfolio(){
  const toggle=$(portfolioMode==='atlas'&&parkOpen?'park-list':portfolioMode);
  portfolioMode='';$('portfolio').hidden=true;toggle?.focus();
}

function closeShop(){
  shown=false;$('management').hidden=true;$('manage').focus();
}

function bind(){
  for(const [key,button] of Object.entries(actionButtons))button.onclick=()=>start(key);
  for(const [key,button] of Object.entries(pins))button.onclick=()=>focus(key);
  for(const [key,plate] of Object.entries(plates))plate.onclick=()=>{
    audio.init();
    if(mill.upgrade(key))refresh();
  };
  $('order-toggle').onclick=()=>{
    const detail=$('order-detail'),expanded=detail.hidden;
    detail.hidden=!expanded;
    $('order-toggle').setAttribute('aria-expanded',String(expanded));
  };
  $('overview').onclick=()=>focus('overview');
  $('log-stock').onclick=()=>focus('inbound');
  $('rough-stock').onclick=()=>focus('finish');
  $('board-stock').onclick=()=>focus('stack');
  $('manage').onclick=()=>{
    audio.init();shown=true;$('management').hidden=false;renderShop();$('close-sheet').focus();
  };
  $('close-sheet').onclick=closeShop;
  $('atlas').onclick=()=>parkOpen?closePark():openPark();
  $('honor').onclick=()=>openPortfolio('honor');
  $('park-list').onclick=()=>openPortfolio('atlas');
  $('park-next').onclick=()=>selectPlot(company.nextPlot.id);
  $('park-zoom-in').onclick=()=>park.zoom(-1);
  $('park-zoom-out').onclick=()=>park.zoom(1);
  $('park-plot-action').onclick=buildPlot;
  const canvas=$('scene');
  canvas.addEventListener('pointerdown',event=>{
    if(!parkOpen||event.button!==0||drag)return;
    canvas.setPointerCapture(event.pointerId);
    drag={id:event.pointerId,x:event.offsetX,y:event.offsetY};
  });
  canvas.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId||!parkOpen)return;
    park.pan(drag.x,drag.y,event.offsetX,event.offsetY);
    drag.x=event.offsetX;drag.y=event.offsetY;
  });
  canvas.addEventListener('lostpointercapture',()=>{drag=null;});
  canvas.addEventListener('wheel',event=>{
    if(!parkOpen)return;
    event.preventDefault();park.zoom(event.deltaY);
  },{passive:false});
  $('close-portfolio').onclick=closePortfolio;
  $('portfolio').addEventListener('click',e=>{if(e.target===$('portfolio'))closePortfolio();});
  $('management').addEventListener('click',e=>{if(e.target===$('management'))closeShop();});
  document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>renderShop(button.dataset.tab));
  $('sound').onclick=()=>{
    company.sound=!company.sound;audio.enabled=company.sound;
    $('sound').setAttribute('aria-pressed',String(audio.enabled));
    $('sound').setAttribute('aria-label',audio.enabled?'关闭音效':'开启音效');
    icon($('sound').querySelector('[data-icon]'),audio.enabled?'sound':'mute');
    audio.init();company.save();
  };
  addEventListener('keydown',e=>{
    if(portfolioMode&&e.key==='Escape'){closePortfolio();return;}
    if(shown&&e.key==='Escape'){closeShop();return;}
    if(parkOpen&&e.key==='Escape'){closePark();return;}
    if(shown||portfolioMode||parkOpen||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
    const key=({q:'inbound',w:'saw',e:'dispatch',r:'finish'})[e.key.toLowerCase()];
    if(key)start(key);
  });
  addEventListener('pagehide',()=>company.save());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)company.save();});
}

function boot(){
  let storage=null;
  try{storage=window.localStorage;}catch{}
  company=new Company(storage,eventHandler);audio.enabled=company.sound;
  awards=company.badges().filter(b=>b.value>=b.total).length;
  try{loadSite();}
  catch(error){
    $('loading').textContent='当前浏览器未能启动 3D。请使用开启 WebGL 的 Chrome 或 Edge。';
    Object.values(actionButtons).forEach(b=>{b.disabled=true;});
    console.error(error);return;
  }
  paintIcons();bind();
  if(!audio.enabled){
    $('sound').setAttribute('aria-pressed','false');
    $('sound').setAttribute('aria-label','开启音效');
    icon($('sound').querySelector('[data-icon]'),'mute');
  }
  refresh();view.render(0);projectPins();$('loading').hidden=true;
  let last=performance.now();
  function frame(now){
    requestAnimationFrame(frame);
    const dt=Math.min((now-last)/1000,.3);last=now;
    if(document.hidden)return;
    company.step(dt);
    if(parkOpen){park.render(dt);projectParkTags();}
    else{view.render(dt);projectPins();}
    if(now-lastUi>=92){lastUi=now;refresh();}
  }
  requestAnimationFrame(frame);
}

boot();
