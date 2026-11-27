import {roomsPanel,itemsPanel,growthPanel,longTermGoal} from './growth-ui.mjs';
import {careerTitle,maxRoomTier,roomTierName,ownerCapacity,poolCapacity,levelOf,boostActive,VILLA_SPOTS} from './progression.mjs';
import {guestAppearance} from './guest-looks.mjs';
import {avatarPortrait} from './characters.mjs';
import {ITEMS,GOALS,SPOTS,roomSpot,roomFee,roomUpgradeCost,rating} from './config.mjs';
export const icon=(name)=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${({coin:'<circle cx="12" cy="12" r="9"/><path d="M12 6v12m3-9c-5-4-8 4-3 3s5 6-3 3"/>',bed:'<path d="M3 18V6m18 12V9M3 14h18M3 10h6v4m0-6h10a2 2 0 0 1 2 2v4M3 18v2m18-2v2"/>',clean:'<path d="m15 3-4 11m-5 0 7 2-2 6-8-3 3-5Zm12-7v5m-2-2h4"/>',towel:'<path d="M4 6h16v13H4zM7 3h10v3M7 10h10M7 16h10"/>',expand:'<path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5M9 9l-5-5m11 5 5-5M9 15l-5 5m11-5 5 5"/>',pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m8 5 11 7-11 7V5Z"/>',staff:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3m3-14a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5"/>',build:'<path d="M3 21V9l9-6 9 6v12H3Zm5 0v-7h8v7M8 9h1m6 0h1"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',sound:'<path d="m11 4-5 4H2v8h4l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 1c0 2-3 2-3 5m0 3h.01"/>',star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>',pool:'<path d="M3 20c3-3 3 3 6 0s3 3 6 0 3 3 6 0M7 17V5a2 2 0 0 1 4 0m4 12V5a2 2 0 0 1 4 0M7 9h8m-8 5h8"/>',coffee:'<path d="M4 8h13v6a6 6 0 0 1-12 0L4 8Zm13 1h2a3 3 0 0 1 0 6h-2M3 22h16M7 2v2m5-2v2"/>'})[name]||'<circle cx="12" cy="12" r="5"/>'}</svg>`;
const fmt=n=>Math.floor(n).toLocaleString('zh-CN');
const shortMoney=n=>n>=1000000?(n/1000000).toFixed(1)+'M':n>=10000?(n/1000).toFixed(1)+'K':fmt(n);
const stateText={ready:'可入住',reserved:'住客前往',occupied:'入住中',dirty:'待清洁'};
export class HotelUI{
 constructor(s,actions){this.s=s;this.a=actions;this.mode='';this.tab='rooms';this.root=document.querySelector('#ui');this.labels=document.querySelector('#labels');this.root.innerHTML=`
 <header class="hud"><div class="brand"><span class="brand-mark"><img src="${avatarPortrait('owner',1)}" alt="店长"></span><div><small id="career-title">实习店长</small><h1>海岛酒店大亨</h1><span id="stars" class="stars"></span></div></div><button id="money" class="wallet" aria-label="前往收取房费"><i>${icon('coin')}</i><div><small>酒店资金</small><strong id="cash">60</strong></div><span>↗</span></button></header>
 <button class="goal-card" id="goal"><span class="goal-eyebrow">今天的小目标 <b id="goal-reward">+40</b></span><strong id="goal-title">迎接第一位住客</strong><span id="goal-sub">走到前台内侧</span><span class="goal-line"><i id="goal-bar"></i></span></button>
 <nav class="tools" aria-label="酒店工具"><button id="overview" class="circle" aria-label="切换酒店全景">${icon('expand')}</button><button id="help" class="circle" aria-label="经营帮助">${icon('help')}</button><button id="pause" class="circle" aria-label="暂停营业">${icon('pause')}</button><button id="career" class="circle" aria-label="店长成长与海岛扩建">${icon('star')}</button></nav>
 <button id="boost" class="boost-button" hidden>服务冲刺</button>
 <div class="hotel-readout"><span id="rooms-readout">2间客房</span><span id="day">营业第1天</span></div>
 <div class="carry"><span>${icon('towel')}</span><b id="linen">3 / 4</b><small>干净毛巾</small></div>
 <div id="work-hint" class="work-hint"><span id="work-title"></span><span class="work-line"><i id="work-bar"></i></span></div>
 <div id="stick" class="stick" role="application" aria-label="移动摇杆"><span class="stick-arrow">↑</span><i id="stick-thumb"></i><small>移动</small></div>
 <div class="quick-actions"><button id="go-front" aria-label="前往前台">${icon('bed')}<span>前台</span></button><button id="go-clean" aria-label="前往待清洁客房">${icon('clean')}<span>清洁</span><b id="dirty-badge"></b></button><button id="go-linen" aria-label="前往布草间补充毛巾">${icon('towel')}<span>毛巾</span></button></div>
 <button class="manage-button" id="manage">${icon('build')}<span>扩建 · 雇员</span></button><div class="keyboard-note">WASD 移动 · 点击地面导航 · Q 全景 · E 经营</div>
 <div id="effects"></div><div id="toast" role="status" aria-live="polite"></div><div id="modal-layer"></div><output id="diagnostics"></output>`;
 const on=(id,fn)=>document.getElementById(id).onclick=fn;
 on('go-front',()=>actions.go(SPOTS.reception,'前台 · 办理入住'));on('go-clean',()=>actions.clean());on('go-linen',()=>actions.supplies());on('money',()=>actions.money());on('manage',()=>this.open('manage'));on('pause',()=>this.open('pause'));on('help',()=>this.open('help'));on('overview',()=>actions.overview());on('goal',()=>{if(this.s.goalsDone>=GOALS.length){this.tab='growth';this.open('manage');}else this.open('goals');});on('career',()=>{this.tab='growth';this.open('manage');});on('boost',()=>actions.boost());
 this.guestLabels=new Map();this.labelMap=new Map();this.showIntro();
 }
 setState(s){this.s=s;this.labels.innerHTML='';this.labelMap.clear();this.guestLabels.clear();}
 showIntro(){if(!this.s.active)this.open('intro');else this.close();}
 open(mode,room=null){this.mode=mode;this.room=room;this.s.paused=true;document.body.classList.toggle('welcome',mode==='intro');this.drawModal();}
 close(){if(!this.s.active){this.open('intro');return;}this.mode='';this.s.paused=false;document.body.classList.remove('welcome');document.querySelector('#modal-layer').innerHTML='';}
 drawModal(){
  const s=this.s,layer=document.querySelector('#modal-layer');let body='';
  if(this.mode==='intro'){layer.innerHTML=`<div class="intro-shade"></div><section class="intro-card"><span class="intro-kicker">新 店 开 业</span><h2>从第一位客人开始！</h2><p>走近岗位自动工作，收好房费，<br>把你的小旅馆经营成五星度假村。</p><button class="primary intro-start" id="start">开始经营 ${icon('arrow')}</button><small>走近岗位自动工作 · 支持触屏与键盘</small></section>`;document.querySelector('#start').onclick=()=>{s.active=true;this.close();this.a.save();};return;}
  if(this.mode==='manage'){
   const tabs=[['rooms','客房'],['staff','雇员'],['facility','设施'],['owner','店长'],['growth','成长']];
   if(this.tab==='rooms')body=roomsPanel(s,r=>this.a.roomThumb(r));
   else if(this.tab==='growth')body=growthPanel(s);
   else body=itemsPanel(s,this.tab==='staff'?'staff':this.tab==='facility'?'facility':'owner',icon);
   layer.innerHTML=`<div class="modal-backdrop" data-close></div><section class="sheet"><div class="sheet-header"><div><small>TIDELIGHT / MANAGEMENT</small><h2>升级你的海岛酒店</h2></div><button class="close" data-close aria-label="关闭经营面板">${icon('close')}</button></div><div class="sheet-wallet">可用资金 <b>￥${fmt(s.cash)}</b><span>营业已暂停</span></div><nav class="sheet-tabs">${tabs.map(([id,name])=>`<button data-tab="${id}" class="${this.tab===id?'selected':''}">${name}</button>`).join('')}</nav><div class="sheet-content">${body}</div><div class="sheet-footer">收益来自实际入住与服务，房费走近即可收取。</div></section>`;
  }else if(this.mode==='room'){
   const r=this.room;body=`<span class="modal-eyebrow">${r.id} / ${r.built?roomTierName(r)+'级客房':'新的客房'}</span><h2>${r.name}</h2><div class="room-preview-icon tier-${r.tier}">${icon('bed')}</div><p>${r.built?`${stateText[r.status]} · 本次房价 ￥${roomFee(r,false,s.studyRank)}${r.status==='dirty'?'<br>带一条干净毛巾，走到床尾即可自动打扫。':''}`:'开放新客房后，就能接待更多客人。'}</p>${r.built?`<button class="primary" data-room-go>前往客房 ${icon('arrow')}</button>${r.tier<maxRoomTier(r)?`<button class="secondary" data-upgrade="${r.id}" ${s.cash<roomUpgradeCost(r)?'disabled':''}>升级为${roomTierName({...r,tier:r.tier+1})}级 · ￥${roomUpgradeCost(r)}</button>`:''}`:`<button class="primary" data-build="${r.id}" ${s.cash<r.cost?'disabled':''}>开放客房 · ￥${r.cost}</button>`}`;
  }else if(this.mode==='pause')body=`<span class="modal-eyebrow">TAKE A LITTLE ISLAND BREAK</span><h2>海风吹着，等你回来。</h2><p>酒店与客人已暂停，进度自动保存在本机。</p><button class="primary" id="resume">继续营业 ${icon('play')}</button><button class="secondary" id="pause-manage">酒店经营面板</button><button class="secondary" id="sound">${this.a.muted()?'开启':'关闭'}游戏声音</button><button class="subtle" id="restart">重新经营一家酒店</button>`;
  else if(this.mode==='reset')body=`<span class="modal-eyebrow">A FRESH START</span><h2>重新开一家酒店？</h2><p>当前资金、客房与雇员将重新开始。上一份进度会留一本本机备份。</p><button class="primary" id="confirm-reset">确认重新经营</button><button class="secondary" data-close>继续原来的酒店</button>`;
  else if(this.mode==='help')body=`<span class="modal-eyebrow">YOUR FIRST DAY AT TIDELIGHT</span><h2>一步一步，开好酒店。</h2><div class="help-steps"><p><b>01 · 接待客人</b>走到前台内侧，停留即可自动办理入住。客房准备好，客人才会出发。</p><p><b>02 · 房费与清洁</b>退房后门外留下钞票，走近自动收取。到布草间拿毛巾，再到脏房床尾自动打扫。</p><p><b>03 · 招聘和扩建</b>清洁员会自动取布草、打扫；接待员会自动办理入住。升级客房提高房价，建设泳池和咖啡吧拓展服务。员工可继续培训。</p><p><b>长期 · 继续成长</b>点右上星形按钮查看头衔与订单。主楼六间满级并建好配套后，可修栈桥开四栋别墅；两栋营业后，解锁可重复的经营研修。</p><p><b>04 · 手机与电脑</b>左下摇杆或 WASD 移动；点击地面可自动寻路。右侧快捷按钮会带你前往岗位。Q 查看全景，E 打开经营。</p></div><button class="primary" data-close>开始忙起来 ${icon('arrow')}</button>`;
  else if(this.mode==='goals')body=`<span class="modal-eyebrow">YOUR HOTEL STORY</span><h2>从两间房，到海岛度假村。</h2><div class="goals-list">${GOALS.map((g,i)=>`<div class="goal-row ${i<s.goalsDone?'done':''}"><b>${i<s.goalsDone?'✓':String(i+1).padStart(2,'0')}</b><div><strong>${g.name}</strong><small>${g.desc}</small></div><span>+${g.reward}</span></div>`).join('')}</div><button class="primary" data-close>回到酒店 ${icon('arrow')}</button>`;
  if(this.mode!=='manage')layer.innerHTML=`<div class="modal-backdrop" data-close></div><section class="dialog ${this.mode==='help'||this.mode==='goals'?'tall':''}"><button class="close" data-close aria-label="关闭弹窗">${icon('close')}</button>${body}</section>`;
  layer.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>this.close());layer.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{this.tab=b.dataset.tab;this.drawModal();});
  layer.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>this.purchase('item',b.dataset.buy));layer.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>this.purchase('room',Number(b.dataset.build)));layer.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>this.purchase('upgrade',Number(b.dataset.upgrade)));
  for(const kind of ['estate','study','contract','outfit'])layer.querySelectorAll('[data-'+kind+']').forEach(b=>b.onclick=()=>this.purchase(kind,b.dataset[kind]));
  layer.querySelectorAll('[data-growth]').forEach(b=>b.onclick=()=>{this.tab='growth';this.drawModal();});
  layer.querySelectorAll('[data-villa]').forEach(b=>b.onclick=()=>{this.close();this.a.go(VILLA_SPOTS.entry,'海景别墅区');});
  layer.querySelectorAll('[data-villa-rooms]').forEach(b=>b.onclick=()=>{this.tab='rooms';this.drawModal();const content=layer.querySelector('.sheet-content'),card=content?.querySelectorAll('.upgrade-card')[6];if(card)content.scrollTop=card.offsetTop-content.offsetTop;});
  layer.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const r=s.rooms.find(r=>r.id===+b.dataset.go);this.close();this.a.go(roomSpot(r),`${r.id} ${r.name}`);});
  if(layer.querySelector('[data-room-go]'))layer.querySelector('[data-room-go]').onclick=()=>{this.close();this.a.go(roomSpot(this.room),`${this.room.id} 客房`);};
  const bind=(id,fn)=>{const b=layer.querySelector('#'+id);if(b)b.onclick=fn;};bind('resume',()=>this.close());bind('pause-manage',()=>this.open('manage'));bind('sound',()=>{this.a.sound();this.drawModal();});bind('restart',()=>this.open('reset'));bind('confirm-reset',()=>this.a.reset());
 }
 purchase(kind,id){const scrollTop=document.querySelector('.sheet-content')?.scrollTop||0,result=this.a.buy(kind,id);this.toast(result.message,result.ok?'success':'notice');if(result.ok){if(this.mode==='room')this.close();else{this.drawModal();const content=document.querySelector('.sheet-content');if(content)content.scrollTop=scrollTop;}}}
 toast(text,kind='notice',amount=0){const el=document.querySelector('#toast');el.innerHTML=`<span>${kind==='success'||kind==='goal'?'✓':'✦'}</span><div>${text}${amount?`<b>+￥${fmt(amount)}</b>`:''}</div>`;el.className=`show ${kind}`;this.toastUntil=performance.now()+3200;}
 effect(e,scene){
  if(!['money','clean','checkin'].includes(e.type))return;
  const pos=e.type==='checkin'?SPOTS.reception:e,p=scene.project(pos.x,2.3,pos.z,innerWidth,innerHeight);if(!p.visible)return;
  const node=document.createElement('div');node.className='world-pop '+e.type;node.textContent=e.type==='money'?`+￥${e.amount}`:e.type==='clean'?'清洁完成 ✓':'入住成功 ✓';node.style.left=p.x+'px';node.style.top=p.y+'px';document.querySelector('#effects').append(node);setTimeout(()=>node.remove(),1500);
 }
 update(scene){
  const s=this.s,el=id=>document.getElementById(id),g=GOALS[s.goalsDone];document.body.classList.toggle('is-overview',scene.overview);el('cash').textContent=shortMoney(s.cash);const pending=s.rooms.reduce((n,r)=>n+r.cash,0)+s.poolCash+s.cafeCash;document.querySelector('#money small').textContent=pending?'待收 ￥'+shortMoney(pending):'酒店资金';el('stars').textContent='★'.repeat(rating(s))+'☆'.repeat(5-rating(s));
  const long=longTermGoal(s);el('career-title').textContent=careerTitle(s).name;
  if(this.hudOutfit!==s.outfit){document.querySelector('.brand-mark img').src=avatarPortrait('owner',1,s.outfit);this.hudOutfit=s.outfit;}
  el('goal-title').textContent=g?g.name+'  '+Math.min(g.target,g.value(s))+'/'+g.target:long.title;el('goal-sub').textContent=g?`${g.desc}  ${Math.min(g.target,g.value(s))}/${g.target}`:long.sub;el('goal-reward').textContent=g?`+${g.reward}`:long.tag;el('goal-bar').style.width=`${g?Math.min(100,g.value(s)/g.target*100):long.progress*100}%`;
  const boost=el('boost');boost.hidden=!levelOf(s,'boost');const cooldown=Math.max(0,Math.ceil(s.nextBoost-s.time));boost.disabled=cooldown>0;boost.classList.toggle('boost-active',boostActive(s));boost.textContent=boostActive(s)?'冲刺中 '+Math.ceil(s.boostUntil-s.time)+'s':cooldown?'冷却 '+cooldown+'s':'服务冲刺 · 8s';
  const built=s.rooms.filter(r=>r.built),dirty=built.filter(r=>r.status==='dirty');el('rooms-readout').textContent=`${built.length}间客房 · ${built.filter(r=>r.status==='occupied'||r.status==='reserved').length}间入住${dirty.length?' · '+dirty.length+'间待清洁':''}`;el('day').textContent=`营业第${Math.floor(s.time/180)+1}天`;el('linen').textContent=`${s.player.towels} / ${ownerCapacity(s)}`;el('dirty-badge').textContent=dirty.length||'';
  let title=s.destination?`前往 ${s.destination.label}`:'点击岗位开始工作，酒店在等你。',progress=0;const a=s.player;
  if(a.action==='serve'){title='正在办理入住';progress=s.serveProgress*100;}if(a.action==='coffee'){title='正在制作咖啡';progress=s.cafeProgress*100;}if(a.action==='supply')title='正在搬运干净毛巾';if(a.action==='clean'){const r=dirty.find(r=>Math.hypot(r.x-a.x,r.z+2.1-a.z)<1.3);title=`正在打扫 ${r?.id||''} · ${Math.floor((r?.clean||0)*100)}%`;progress=(r?.clean||0)*100;}if(a.action==='needsTowels')title='需要干净毛巾 · 点击右侧“毛巾”补给';
  if(!s.destination&&a.action==='idle'&&Math.hypot(a.x,a.z-8.4)<1.5)title=built.some(r=>r.status==='ready')?'前台待客 · 停留即可办理入住':'没有空房了 · 先清洁或扩建客房';el('work-title').textContent=title;el('work-bar').style.width=`${progress}%`;el('work-hint').classList.toggle('working',progress>0);el('work-hint').classList.toggle('active',!!s.destination||['clean','serve','coffee','supply','needsTowels'].includes(a.action));
  if(this.lastCash!==undefined&&s.cash>this.lastCash){el('money').classList.add('cash-gain');setTimeout(()=>el('money').classList.remove('cash-gain'),380);}this.lastCash=s.cash;
  if(this.toastUntil&&performance.now()>this.toastUntil)el('toast').classList.remove('show');
  for(const r of s.rooms){
   let b=this.labelMap.get(r.id);if(!b){b=document.createElement('button');b.onclick=()=>this.open('room',r);this.labels.append(b);this.labelMap.set(r.id,b);}
   const text=r.built?`<b>${r.id}</b><i>${r.status==='dirty'?icon('clean'):r.status==='occupied'?'Zz':r.status==='reserved'?icon('arrow'):'✓'}</i>${r.cash?`<span class="room-cash">${shortMoney(r.cash)}</span>`:''}`:`<i>＋</i><b>${r.id}</b><small>￥${r.cost}</small>`;
   if(b.innerHTML!==text)b.innerHTML=text;b.className=`room-label ${r.built?r.status:'locked'}`;b.setAttribute('aria-label',`${r.id} ${r.name} ${r.built?stateText[r.status]:'扩建客房'}`);const p=scene.project(r.built?r.x-Math.sign(r.x)*3.2:r.x,r.built?1.3:1.4,r.z+(r.built?1.2:3.15));b.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;b.hidden=!p.visible||p.y<135||p.y>innerHeight-125;
  }
  for(const [id,x,z,title,target] of [['pool',20,2.4,'海景泳池',SPOTS.pool],['cafe',-20,5.5,'落日咖啡',SPOTS.cafe]]){
   let b=this.labelMap.get(id);if(!b){b=document.createElement('button');this.labels.append(b);this.labelMap.set(id,b);b.onclick=()=>{if(this.s.owned[id])this.a.go(target,title);else{this.tab='facility';this.open('manage');}};}
   b.className='room-label facility-label '+(s.owned[id]?'ready':'locked')+(id==='pool'&&s.owned.pool&&s.poolTowels===0?' empty-stock':'');b.innerHTML=s.owned[id]?`${icon(id==='pool'?'pool':'coffee')}<b>${title}</b><small>${id==='pool'?(s.poolTowels===0?'缺毛巾！':'毛巾 '+s.poolTowels+'/'+poolCapacity(s)):(s.cafeProgress>0?'咖啡制作中':s.guests.some(g=>g.state==='cafeQueue')?'客人等候中':'营业中')}</small>`:`＋ ${title}<small>￥${ITEMS.find(i=>i.id===id).cost}</small>`;b.setAttribute('aria-label',s.owned[id]?'前往'+title:'开放'+title);const p=scene.project(x,1.8,z);b.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;b.hidden=!p.visible||p.y<168||p.y>innerHeight-135;
  }
  if(s.estate.villa||s.rooms.filter(r=>r.id<200&&r.built&&r.tier===3).length===6){
   let b=this.labelMap.get('estate');if(!b){b=document.createElement('button');b.onclick=()=>{this.tab='growth';this.open('manage');};this.labels.append(b);this.labelMap.set('estate',b);}
   b.className='room-label facility-label '+(s.estate.villa?'ready':'locked');b.innerHTML='<b>海景别墅区</b><small>'+(s.estate.villa?'栈桥已开放 · 成长':'扩建栈桥 ￥6,000')+'</small>';b.setAttribute('aria-label','海景别墅区扩建与成长');const p=scene.project(0,1.6,-20.2);b.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;b.hidden=!p.visible||p.y<168||p.y>innerHeight-135;
  }
  const queue=s.guests.filter(g=>g.state==='queue').slice(0,3),shown=new Set();
  for(const guest of queue){
   if(Math.hypot(guest.x-s.player.x,guest.z-s.player.z)>12)continue;
   const look=guestAppearance(guest.look),p=scene.project(guest.x,2.95*look.height,guest.z);
   if(!p.visible||p.y<143||p.y>innerHeight-110)continue;
   shown.add(guest.id);let node=this.guestLabels.get(guest.id);
   if(!node){node=document.createElement('span');node.className='guest-bubble';node.innerHTML=icon(guest.vip?'star':'bed');this.labels.append(node);this.guestLabels.set(guest.id,node);}
   node.classList.toggle('vip',guest.vip);node.classList.toggle('impatient',guest.patience<30);node.setAttribute('aria-label',look.name+' · 等候入住');node.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-100%)`;
  }
  for(const [id,node] of this.guestLabels)if(!shown.has(id)){node.remove();this.guestLabels.delete(id);}
  const qa=new URLSearchParams(location.search).has('qa');el('diagnostics').hidden=!qa;if(qa)el('diagnostics').textContent=`${s.paused?'paused':'active'} · ${s.time.toFixed(1)}s · x ${a.x.toFixed(2)} z ${a.z.toFixed(2)} · 服务 ${s.stats.served} / 退房 ${s.stats.checkedOut} / 清洁 ${s.stats.cleaned} / 收款 ${s.stats.collected} · 客人 ${s.guests.length} · ${scene.renderer.info.render.calls} calls · ${(scene.renderer.info.render.triangles/1000).toFixed(0)}k tris`;
 }
}
