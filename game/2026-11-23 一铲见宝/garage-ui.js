import {parts,finishes,cost,saveGarage,MAX_RANK} from './garage.js';
import {wallThumbnail} from './mosaics.js';
const $=id=>document.getElementById(id);
export function setupGarage(account,levels,events){
  const drawer=$('drawer'),panels=['options','stages','finishes'],partButtons=[],stageButtons=[];
  const message=document.createElement('p');message.className='message';message.hidden=true;message.setAttribute('role','status');drawer.append(message);
  function open(panel,title){
    events.pause();panels.forEach(id=>$(id).hidden=id!==panel);
    $('sheet-title').textContent=title;message.hidden=true;drawer.showModal();$('close').focus();
  }
  $('close').onclick=()=>drawer.close();
  drawer.addEventListener('close',events.resume);
  $('map').onclick=()=>open('stages','选择矿区');
  $('settings').onclick=()=>open('options','设置');
  $('skins').onclick=()=>open('finishes','机械涂装');
  $('restart').onclick=()=>{drawer.close();events.restart();};
  function sync(){
    $('cash').textContent=Math.max(0,account.cash-(events.inflight?.()||0)).toLocaleString('zh-CN');
    parts.forEach((p,i)=>{
      const b=partButtons[i],rank=account.ranks[p.key],max=rank>=MAX_RANK,price=cost(p,rank);
      b.querySelector('.rank').textContent='Lv.'+(rank+1);
      b.querySelector('.price').textContent=max?'满级':price;
      b.classList.toggle('afford',!max&&account.cash>=price);b.classList.toggle('max',max);b.disabled=max;
      b.setAttribute('aria-label',p.name+' '+(rank+1)+'级，'+(max?'已满级':'升级需要 '+price+' 工钱'));
    });
    [...$('finishes').children].forEach((b,i)=>b.querySelector('b').textContent=i===account.skin?'已装备':account.owned[i]?'装备':'$'+finishes[i].price);
  }
  for(const p of parts){
    const b=document.createElement('button');b.type='button';b.className='part';b.dataset.part=p.key;
    b.innerHTML='<svg aria-hidden="true"><use href="#art-'+p.key+'"/></svg><small class="rank"></small><strong>'+p.name+'</strong><b class="price"></b>';
    b.onclick=()=>{
      const rank=account.ranks[p.key],price=cost(p,rank);
      if(rank>=MAX_RANK)return;
      if(account.cash<price){events.say('还差 $'+(price-account.cash)+'，拆砖可赚工钱');return;}
      account.cash-=price;account.ranks[p.key]++;saveGarage(account);events.tune();sync();events.say(p.benefit);
    };
    partButtons.push(b);$('upgrades').append(b);
  }
  const chapters=['第一章 · 初出茅庐','第二章 · 奇珍异宝','第三章 · 钢铁难关','第四章 · 双宝秘境'];
  levels.forEach((level,i)=>{
    if(i%4===0){const h=document.createElement('h3');h.className='chapter';h.textContent=chapters[i/4]||'';$('stages').append(h);}
    const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',level.name);
    const img=new Image();img.src=wallThumbnail(i);img.alt='';const span=document.createElement('span');
    span.append(document.createTextNode(level.name),document.createElement('small'));b.append(img,span);
    b.onclick=()=>{drawer.close();events.load(i);};$('stages').append(b);stageButtons.push(b);
  });
  finishes.forEach((skin,i)=>{
    const b=document.createElement('button');b.type='button';
    b.innerHTML='<i aria-hidden="true"></i><span>'+skin.name+'</span><b></b>';
    b.querySelector('i').style.background='linear-gradient(135deg,'+skin.arm+' 44%,'+skin.body+' 45% 78%,'+skin.blade+' 79%)';
    b.onclick=()=>{
      if(!account.owned[i]&&account.cash<skin.price){message.textContent='还差 $'+(skin.price-account.cash);message.hidden=false;return;}
      if(!account.owned[i]){account.cash-=skin.price;account.owned[i]=true;}
      account.skin=i;saveGarage(account);events.tune();sync();drawer.close();
    };
    $('finishes').append(b);
  });
  const vault=document.createElement('button');vault.type='button';vault.className='vault-door';vault.hidden=true;
  vault.innerHTML='<b>宝库</b><small>十六座矿墙的宝石陈列厅</small>';
  vault.onclick=()=>{drawer.close();events.finale?.();};$('stages').append(vault);
  sync();
  return {sync,map(index,saved){
    vault.hidden=!saved[levels.length-1]?.cleared;
    stageButtons.forEach((b,i)=>{
      b.setAttribute('aria-current',String(i===index));
      b.querySelector('small').textContent=saved[i]?.stars?'★'.repeat(saved[i].stars):saved[i]?.cleared?'已发现':'';
    });
  }};
}
