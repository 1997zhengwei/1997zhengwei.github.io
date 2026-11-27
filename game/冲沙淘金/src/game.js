import { CHAPTERS,chapterOf,cols,createSluice,finds,rows,sites } from './flow.js';
import { createWorld } from './world.js';
import { SHOP,buy,levelStars,loadSave,recordClear,totalStars,unlocked,writeSave } from './progress.js';

const $=id=>document.getElementById(id);
try {
  start();
} catch(error) {
  console.error(error);
  $('error').hidden=false;
  $('valve').disabled=true;
}

function start() {
  const stage=$('stage');
  const canvas=$('canyon');
  const world=createWorld(canvas,{lowFx:new URLSearchParams(location.search).has('lowfx')});
  const valve=$('valve');
  const tick=.044;
  const split=.55;
  const GRACE=1.3; // seconds the water keeps running after the last gem, so flakes in transit still count
  const save=loadSave();
  let number,model,pointer=null,lastCell=null;
  let running=false,completed=false,points=0,flakePoints=0,comboPoints=0;
  let combo=0,lastCatchAt=-9,lastCatchC=17,gemNotes=0,slowRemaining=0,lastTinkle=0;
  const COMBO_WINDOW=1.1; // seconds between catches that still count as one chain
  const COMBO_NAMES=['','','二连淘！','三连淘！','四连淘！','五连淘！'];
  let now=0,accumulator=0,revealAt=Infinity,noticeUntil=0,doneAt=Infinity,run=null;
  let valveOpenedAt=0,usedAtOpen=0,warnedSpring=false;
  let audio,lastDig=-1,waterGain=null;
  let markers=[];
  let tool=null,magnetOn=false;
  let shopTab='tool';
  let activeSheet=null;

  // ---------- Audio ----------
  function unlock() {
    const Mixer=window.AudioContext||window.webkitAudioContext;
    if(!Mixer)return;
    audio??=new Mixer();
    if(audio.state==='suspended')void audio.resume().catch(()=>{});
    if(!waterGain&&audio){
      const noise=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);
      const data=noise.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      const source=audio.createBufferSource();
      source.buffer=noise;source.loop=true;
      const band=audio.createBiquadFilter();
      band.type='bandpass';band.frequency.value=820;band.Q.value=.7;
      waterGain=audio.createGain();
      waterGain.gain.value=0;
      source.connect(band).connect(waterGain).connect(audio.destination);
      source.start();
    }
  }
  function play(notes,level=.045,span=.115,type='sine') {
    if(audio?.state!=='running')return;
    for(const [i,note] of notes.entries()){
      const t=audio.currentTime+i*span*.69;
      const tone=audio.createOscillator(),gain=audio.createGain();
      tone.type=type;
      tone.frequency.value=note;
      gain.gain.setValueAtTime(.001,t);
      gain.gain.exponentialRampToValueAtTime(level,t+.012);
      gain.gain.exponentialRampToValueAtTime(.001,t+span);
      tone.connect(gain).connect(audio.destination);
      tone.start(t);
      tone.stop(t+span+.02);
    }
  }
  function hiss(duration,frequency,level,type='lowpass') {
    if(audio?.state!=='running')return;
    const length=Math.ceil(audio.sampleRate*duration);
    const buffer=audio.createBuffer(1,length,audio.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length)**2;
    const source=audio.createBufferSource();
    source.buffer=buffer;
    const filter=audio.createBiquadFilter();
    filter.type=type;filter.frequency.value=frequency;
    const gain=audio.createGain();
    gain.gain.value=level;
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start();
  }
  const buzz=ms=>{try{if(navigator.userActivation?.hasBeenActive!==false)navigator.vibrate?.(ms);}catch{}};

  // ---------- HUD ----------
  function notice(text,seconds=1.65,tone='') {
    $('notice').textContent=text;
    $('notice').dataset.tone=tone;
    $('notice').hidden=false;
    $('notice').style.animation='none';void $('notice').offsetWidth;$('notice').style.animation='';
    noticeUntil=now+seconds;
  }
  function floater(point,text,sub='') {
    const box=stage.getBoundingClientRect();
    const node=document.createElement('div');
    node.className='floater';
    node.textContent=text;
    if(sub){const small=document.createElement('small');small.textContent=sub;node.append(small);}
    node.style.left=(point.x-box.left)+'px';
    node.style.top=(point.y-box.top)+'px';
    $('floaters').append(node);
    setTimeout(()=>node.remove(),1300);
  }
  function bump(node) {
    node.removeAttribute('data-bump');void node.offsetWidth;node.setAttribute('data-bump','');
  }
  function renderCoins(animate=false) {
    $('coins').textContent=save.coins;
    $('shop-coins').textContent=save.coins;
    if(animate)bump($('coins'));
  }
  function renderStars(node,stars) {
    [...node.children].forEach((star,k)=>star.toggleAttribute('data-on',!!stars[k]));
  }
  function gauge(id,value,par) {
    const node=$(id);
    const full=par*1.5;
    node.querySelector('b').style.width=Math.min(100,value/full*100)+'%';
    node.querySelector('output').textContent=value+' / '+par;
    node.toggleAttribute('data-over',value>par);
  }
  function updateGauges() {
    const site=sites[number];
    gauge('g-water',run?run.water:model.used,site.par.water);
    gauge('g-dig',run?run.dig:model.dug,site.par.dig);
  }
  function renderTools() {
    for(const id of ['bomb','magnet']){
      const node=$(id);
      node.querySelector('sup').textContent=save.tools[id]||0;
      const active=id==='bomb'?tool==='bomb':magnetOn;
      node.setAttribute('aria-pressed',String(active));
      node.disabled=completed||(id==='magnet'&&magnetOn)||(!active&&!(save.tools[id]>0));
    }
    stage.dataset.tool=tool??'';
  }
  function resizeHud() {
    world.setInsets($('hud').offsetHeight+16,6);
  }

  function visibleFound() {
    let count=0;
    for(const treasure of model.required){
      markers[treasure.id].toggleAttribute('data-found',treasure.found);
      if(treasure.found)count++;
    }
    $('count').textContent=count+' / '+model.required.length;
    return count===model.required.length;
  }

  function setHint() {
    const site=sites[number];
    $('hint').textContent=tool==='bomb'?'点一块岩石把它炸开（再点🧨取消）':
      completed||run?'宝石已入筛':running?
      (site.drains?'把水引到下方金边筛口':'让水经过宝石，流进筛盘'):
      (site.springs.length>1?'从两个发光的水口挖沟，经过宝石':'从发光的水口往下划，挖沟经过宝石');
  }
  function setValve(value) {
    running=value;
    valve.setAttribute('aria-pressed',String(value));
    valve.textContent=value?'停水':'放水';
    stage.dataset.phase=completed?'complete':value?'flow':'dig';
    if(value){valveOpenedAt=now;usedAtOpen=model.used;warnedSpring=false;}
    setHint();
  }

  function release() {
    const held=pointer;
    pointer=null;
    lastCell=null;
    if(held!==null && canvas.hasPointerCapture(held))canvas.releasePointerCapture(held);
  }

  function reset(i) {
    release();
    number=i;
    const site=sites[i];
    model=createSluice(site);
    world.setLook(save.equip);
    world.setChapter(chapterOf(i));
    world.setSite(site,model);
    stage.dataset.chapter=chapterOf(i);
    stage.style.setProperty('--sky',site.sky);
    stage.style.setProperty('--rim',site.rim);
    stage.style.setProperty('--sand',site.sand);
    renderStars($('hud-stars'),levelStars(save,i));
    completed=false;
    run=null;
    points=flakePoints=comboPoints=accumulator=0;
    combo=gemNotes=0;lastCatchAt=-9;slowRemaining=0;
    revealAt=doneAt=Infinity;
    tool=null;magnetOn=false;
    $('result').hidden=$('notice').hidden=true;
    valve.disabled=false;
    setValve(false);
    markers=model.required.map(t=>{
      const mark=document.createElement('i');
      mark.title=finds[t.type].name;
      mark.setAttribute('aria-label',finds[t.type].name);
      mark.style.setProperty('--gem',finds[t.type].hue);
      return mark;
    });
    $('bag').replaceChildren(...markers);
    visibleFound();
    updateGauges();
    renderTools();
    save.last=i;
    writeSave(save);
    requestAnimationFrame(resizeHud);
    // New mechanic: explain it on the chapter's first level until that level is cleared.
    const chapter=CHAPTERS[chapterOf(i)];
    if(chapter.tip&&i===chapter.from&&!save.levels[i]?.clears)notice(chapter.tip,5);
  }

  function sweep(point) {
    if(!point || point.c<-.7||point.c>cols-.3||point.r<-.72||point.r>rows-.25){
      lastCell=null;
      return;
    }
    const previous=lastCell??point;
    const length=Math.hypot(point.c-previous.c,point.r-previous.r);
    const segments=Math.max(1,Math.ceil(length/split));
    let total=0;
    for(let i=1;i<=segments;i++){
      const u=i/segments;
      const c=previous.c+(point.c-previous.c)*u,r=previous.r+(point.r-previous.r)*u;
      const cut=model.dig(c,r);
      world.carve(cut);
      if(cut.length){
        total+=cut.length;
        world.puff(c,r,sites[number].sand,Math.min(6,cut.length));
      }
    }
    lastCell=point;
    if(total>0){
      updateGauges();
      if(now-lastDig>.08){
        lastDig=now;
        hiss(.07,900+Math.random()*500,.05);
        play([173+Math.random()*61],.018,.07,'triangle');
      }
    }
  }

  function take(treasure) {
    const item=finds[treasure.type];
    const at=world.showCatch(treasure);
    if(treasure.bonus){
      flakePoints+=item.score;
      floater(at,'+'+item.score,'沙金');
      play([880,1175],.04,.09,'triangle');
      return;
    }
    points+=item.score;
    lastCatchC=treasure.c;
    // Chain catches: gems that land within a moment of each other pay a growing bonus.
    combo=now-lastCatchAt<COMBO_WINDOW?combo+1:1;
    lastCatchAt=now;
    notice('淘到'+item.name+'  +'+item.score);
    floater(at,'+'+item.score,item.name);
    if(combo>=2){
      const bonus=(combo-1)*5;
      comboPoints+=bonus;
      const box=stage.getBoundingClientRect();
      const node=document.createElement('div');
      node.className='combo';
      node.textContent=(COMBO_NAMES[combo]||combo+'连淘！')+' +'+bonus;
      node.style.top=(box.height*.42)+'px';
      $('floaters').append(node);
      setTimeout(()=>node.remove(),1500);
      play([523,659,784,1047].map(f=>f*2**((combo-2)*2/12)),.06,.12,'square');
      buzz([15,40,15]);
    }
    bump($('count').parentElement);
    // Each gem in a level rings a step higher.
    const lift=2**(gemNotes*2/12);
    gemNotes++;
    play([440,554,740,880].map(f=>f*lift),.057,.13,'triangle');
    buzz(15);
  }

  // All required gems are in: freeze the water/dig numbers, keep the flow briefly for flakes in transit.
  function allIn() {
    run={water:model.used,dig:model.dug};
    // Finale: brief slow motion, camera push to the sieve and a burst of light.
    world.startFinale(lastCatchC);
    slowRemaining=.75;
    hiss(.9,2400,.05,'highpass');
    setTimeout(()=>play([784,988,1175,1568],.06,.22,'sine'),180);
    doneAt=now+GRACE;
    tool=null;
    release();
    updateGauges();
    setHint();
    renderTools();
  }

  function settle() {
    doneAt=Infinity;
    completed=true;
    valve.disabled=true;
    setValve(false);
    release();
    const result=recordClear(save,number,{...run,gemScore:points,flakeScore:flakePoints,comboScore:comboPoints});
    world.celebrate(result.runStars);
    if(result.runStars===3){
      [523,659,784,1047,1319,1568].forEach((f,k)=>setTimeout(()=>play([f],.05,.2,'triangle'),k*90));
      setTimeout(()=>play([1047,1319,1568,2093],.045,.35,'sine'),620);
    }
    renderStars($('hud-stars'),levelStars(save,number));
    renderTools();
    revealAt=now+(result.runStars===3?1.7:1.0);
    showResult.data=result;
  }

  function showResult() {
    revealAt=Infinity;
    const result=showResult.data;
    const site=sites[number];
    $('notice').hidden=true;
    $('result-title').textContent=result.runStars===3?'完美淘金！':result.runStars===2?'宝石都淘出来了':'淘出来了，还能更省';
    const labels=['全部宝石','用水 ≤ '+site.par.water,'挖沙 ≤ '+site.par.dig];
    $('result-stars').replaceChildren(...labels.map((label,k)=>{
      const node=document.createElement('div');
      node.className='big-star';
      node.style.setProperty('--d',(.15+k*.28)+'s');
      node.toggleAttribute('data-on',result.stars[k]);
      node.innerHTML='<i></i>';
      node.append(label);
      return node;
    }));
    result.stars.forEach((on,k)=>{if(on)setTimeout(()=>play([660+k*220,990+k*220],.05,.16,'triangle'),150+k*280);});
    $('result-text').textContent='用水 '+run.water+' · 挖沙 '+run.dig+(flakePoints?' · 沙金 '+flakePoints/finds.flake.score+' 粒':'');
    const rows=[['宝石',result.coins.gems],['沙金',result.coins.flakes],['连淘奖励',result.coins.combo],['星星奖励',result.coins.stars],['首次三星',result.coins.perfect],['今日加成',result.coins.daily]]
      .filter(([,v])=>v>0);
    const ledger=$('ledger');
    ledger.replaceChildren(...rows.map(([name,value])=>{
      const line=document.createElement('div');
      line.innerHTML='<span></span><b></b>';
      line.firstChild.textContent=name;
      line.lastChild.textContent='+'+value;
      return line;
    }));
    const total=document.createElement('div');
    total.className='total';
    total.innerHTML='<span>金币</span><b>+0</b>';
    ledger.append(total);
    const start=performance.now();
    (function count(){
      const t=Math.min(1,(performance.now()-start)/900);
      total.lastChild.textContent='+'+Math.round(result.total*t);
      if(t<1)requestAnimationFrame(count); else renderCoins(true);
    })();
    $('next').textContent=number===sites.length-1?'回到第一关':'下一关';
    $('result').hidden=false;
    $('next').focus({preventScroll:true});
  }

  // ---------- Map / shop ----------
  function openSheet(id) {
    activeSheet=id;
    for(const sheet of ['map','shop'])$(sheet).hidden=sheet!==id;
    $('controls').inert=id!==null;
    release();
    if(id&&waterGain&&audio)waterGain.gain.setTargetAtTime(0,audio.currentTime,.06);
  }
  function mapSummary(site,record,available) {
    if(!available)return '通关上一关解锁';
    if(!record?.clears)return '用水 ≤ '+site.par.water+' · 挖沙 ≤ '+site.par.dig;
    if(!Number.isFinite(record.bestWater)||!Number.isFinite(record.bestDig))return '已通关';
    return '最佳 用水 '+record.bestWater+' · 挖沙 '+record.bestDig;
  }
  function renderMap() {
    $('map-stars').textContent='★ '+totalStars(save)+'/'+sites.length*3;
    $('daily-note').textContent=save.daily.left>0?'今日加成：还剩 '+save.daily.left+' 次通关，宝石和沙金金币翻倍':'今日加成已用完，明天再来';
    $('trail').replaceChildren(...sites.flatMap((site,i)=>{
      const items=[];
      const chapter=CHAPTERS.find(ch=>ch.from===i);
      if(chapter){
        const head=document.createElement('li');
        head.className='chapter-head';
        head.textContent='第'+'一二三四五六'[CHAPTERS.indexOf(chapter)]+'章 · '+chapter.name;
        items.push(head);
      }
      const li=document.createElement('li');
      const node=document.createElement('button');
      node.type='button';
      node.className='node';
      node.disabled=!unlocked(save,i);
      node.setAttribute('aria-current',String(i===number));
      node.style.setProperty('--c',site.sky);
      const record=save.levels[i];
      node.innerHTML='<span class="num"></span><span><span class="nm"></span><br><span class="sub"></span></span><span class="stars"><i></i><i></i><i></i></span>';
      node.querySelector('.num').textContent=node.disabled?'🔒':String(i+1);
      node.querySelector('.nm').textContent=site.name;
      node.querySelector('.sub').textContent=mapSummary(site,record,!node.disabled);
      renderStars(node.querySelector('.stars'),levelStars(save,i));
      node.addEventListener('click',()=>{openSheet(null);reset(i);});
      li.append(node);
      items.push(li);
      return items;
    }));
  }
  function renderShop() {
    renderCoins();
    const tabs=[['tool','道具'],['water','水色'],['trail','拖尾'],['tray','筛盘']];
    $('shop-tabs').replaceChildren(...tabs.map(([id,label])=>{
      const tab=document.createElement('button');
      tab.type='button';tab.textContent=label;
      tab.setAttribute('aria-pressed',String(id===shopTab));
      tab.addEventListener('click',()=>{shopTab=id;renderShop();});
      return tab;
    }));
    $('goods').replaceChildren(...SHOP.filter(item=>item.kind===shopTab).map(item=>{
      const row=document.createElement('div');
      row.className='good';
      const swatch=document.createElement('span');
      swatch.className='sw';
      if(item.swatch){swatch.style.setProperty('--a',item.swatch[1]);swatch.style.setProperty('--b',item.swatch[0]);}
      else swatch.textContent=item.icon;
      const text=document.createElement('div');
      text.innerHTML='<div class="nm"></div><div class="sub"></div>';
      text.firstChild.textContent=item.name;
      const owned=save.owned.includes(item.id);
      text.lastChild.textContent=item.kind==='tool'?item.note+' · 持有 '+(save.tools[item.id]||0):
        owned?(save.equip[item.kind]===item.id?'装备中':'已拥有'):'用金币购买，买后自动装备';
      const button=document.createElement('button');
      button.type='button';
      if(item.kind!=='tool'&&owned){
        const on=save.equip[item.kind]===item.id;
        button.className='buy equip'+(on?' on':'');
        button.textContent=on?'使用中':'装备';
        button.disabled=on;
        button.addEventListener('click',()=>{
          save.equip[item.kind]=item.id;
          writeSave(save);
          applyLook();
          renderShop();
        });
      } else {
        button.className='buy coin-pill';
        button.textContent=item.price;
        button.disabled=save.coins<item.price;
        button.addEventListener('click',()=>{
          if(!buy(save,item.id))return;
          renderCoins(true);
          play([784,1047],.05,.12,'triangle');
          if(item.kind!=='tool')applyLook();
          renderTools();
          renderShop();
        });
      }
      row.append(swatch,text,button);
      return row;
    }));
  }
  // Tray changes rebuild the level, so only do it while nothing is in progress.
  function applyLook() {
    world.setLook(save.equip);
    if(!running&&!model.used&&!model.dug&&!completed)reset(number);
  }

  // ---------- Input ----------
  canvas.addEventListener('pointerdown',event=>{
    if(activeSheet||completed||run||event.button!==0||pointer!==null)return;
    unlock();
    if(tool==='bomb'){
      const point=world.pointerCell(event.clientX,event.clientY);
      const k=point?world.rockAt(point.c,point.r,model):-1;
      if(k<0){notice('点在岩石上才能引爆',1.2,'warn');return;}
      model.blast(k);
      world.blast(k);
      save.tools.bomb--;
      writeSave(save);
      tool=null;
      hiss(.5,320,.22);
      play([92,61],.09,.3,'sine');
      buzz(40);
      setHint();
      renderTools();
      return;
    }
    pointer=event.pointerId;
    canvas.setPointerCapture(pointer);
    sweep(world.pointerCell(event.clientX,event.clientY));
  });
  canvas.addEventListener('pointermove',event=>{
    if(event.pointerId===pointer && !completed && !run)sweep(world.pointerCell(event.clientX,event.clientY));
  });
  for(const kind of ['pointerup','pointercancel','lostpointercapture']){
    canvas.addEventListener(kind,event=>{if(event.pointerId===pointer)release();});
  }
  addEventListener('blur',release);
  valve.addEventListener('click',()=>{
    if(completed||run)return;
    unlock();
    setValve(!running);
    if(running)play([247,311,415],.037,.15,'triangle');
  });
  $('bomb').addEventListener('click',()=>{
    if(completed||run)return;
    tool=tool==='bomb'?null:'bomb';
    setHint();
    renderTools();
  });
  $('magnet').addEventListener('click',()=>{
    if(completed||run||magnetOn||!(save.tools.magnet>0))return;
    save.tools.magnet--;
    writeSave(save);
    magnetOn=true;
    model.reach=4.3;
    notice('磁石生效：本局水流能吸走更远的宝石',1.8);
    play([523,784],.04,.14,'sine');
    renderTools();
  });
  $('reset').addEventListener('click',()=>reset(number));
  $('again').addEventListener('click',()=>reset(number));
  $('next').addEventListener('click',()=>reset((number+1)%sites.length));
  $('open-map').addEventListener('click',()=>{renderMap();openSheet('map');});
  $('open-shop').addEventListener('click',()=>{renderShop();openSheet('shop');});
  for(const close of document.querySelectorAll('[data-close]'))close.addEventListener('click',()=>openSheet(null));
  for(const id of ['map','shop'])$(id).addEventListener('click',event=>{if(event.target===$(id))openSheet(null);});
  addEventListener('keydown',event=>{
    if(event.code==='Escape'){openSheet(null);return;}
    if(activeSheet||event.code!=='Space'||event.repeat||event.target?.tagName==='BUTTON')return;
    event.preventDefault();
    valve.click();
  });

  new ResizeObserver(()=>{world.resize();resizeHud();}).observe(canvas);
  world.resize();
  renderCoins();
  reset(unlocked(save,save.last)&&sites[save.last]?save.last:0);
  resizeHud();
  if(new URLSearchParams(location.search).has('dev'))window.__sluice={save,world,get model(){return model;},reset,
    sweep:(points)=>{lastCell=null;for(const p of points)sweep(p);lastCell=null;}};

  let last=performance.now();
  function update(time) {
    const realDt=Math.min(.1,Math.max(0,(time-last)/1000));
    last=time;
    if(!document.hidden&&!activeSheet){
      const dt=realDt*(slowRemaining>0?.3:1);
      slowRemaining=Math.max(0,slowRemaining-realDt);
      now+=dt;
      accumulator+=dt;
      while(accumulator>=tick){
        accumulator-=tick;
        const flowing=running||doneAt<Infinity;
        if(!flowing && !model.water.length)continue;
        const caught=model.step(flowing);
        for(const prize of caught)take(prize);
        if(!run&&visibleFound())allIn();
      }
      if(running&&!run){
        updateGauges();
        // Valve open but nothing entered the board: the channel does not reach the spring.
        if(!warnedSpring&&now-valveOpenedAt>1.1&&model.used===usedAtOpen){
          warnedSpring=true;
          notice('水口还没接通：从发光的水口往下挖',2.6,'warn');
        }
      }
      if(now>=doneAt)settle();
      if(now>=noticeUntil)$('notice').hidden=true;
      if(now>=revealAt)showResult();
      if(waterGain&&audio)waterGain.gain.setTargetAtTime(Math.min(1,model.water.length/45)*.06,audio.currentTime,.12);
      world.render(model,accumulator/tick,now,dt,running||doneAt<Infinity,realDt);
      for(const event of world.drainEvents()){
        if(event==='melt'&&now-lastTinkle>.07){lastTinkle=now;play([1800+Math.random()*900],.018,.08,'sine');}
        else if(event==='pop')play([620+Math.random()*200,930],.025,.05,'triangle');
        else if(event==='crab'){play([1400,1700,1400],.03,.06,'square');notice('一只小螃蟹被挖出来了！',1.6);}
      }
    }
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
