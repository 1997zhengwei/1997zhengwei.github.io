import {REGIONS} from './empire.mjs';
import {drawHonorCard} from './honor-card.mjs';

const numbers=new Intl.NumberFormat('zh-CN');
const mapStops=[[86,223],[247,179],[416,139],[561,61]];
const shape=(ctx,points)=>{
  ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
};

function drawMap(canvas,company,certificate=false){
  const ctx=canvas.getContext('2d');
  ctx.save();ctx.scale(canvas.width/640,canvas.height/280);
  ctx.fillStyle=certificate?'#132d29':'#173755';ctx.fillRect(0,0,640,280);
  for(const [color,points] of [
    [certificate?'#29644d':'#2c664f',[[0,79],[180,119],[249,216],[380,280],[0,280]]],
    [certificate?'#58784d':'#476648',[[188,0],[409,0],[491,136],[405,238],[296,221],[200,146]]],
    [certificate?'#947446':'#7c6d4f',[[265,0],[528,0],[640,149],[583,236],[409,228],[349,106]]],
    [certificate?'#607c69':'#687fa0',[[455,0],[640,0],[640,210],[538,168],[499,86]]]
  ]){
    shape(ctx,points);ctx.closePath();ctx.fillStyle=color;ctx.fill();
  }
  ctx.lineWidth=1;ctx.strokeStyle=certificate?'#ffe3a243':'#e4f2ff21';
  for(let i=0;i<16;i++){
    ctx.beginPath();ctx.moveTo(0,i*21-80);ctx.bezierCurveTo(220,i*20+122,439,i*20-55,640,i*20-61);ctx.stroke();
  }
  ctx.beginPath();ctx.moveTo(140,0);ctx.bezierCurveTo(205,71,199,111,224,155);
  ctx.bezierCurveTo(264,226,368,215,398,280);
  ctx.lineWidth=19;ctx.strokeStyle=certificate?'#285b55':'#24618f';ctx.stroke();
  ctx.lineWidth=11;ctx.strokeStyle=certificate?'#75c9ae':'#58bfdf';ctx.stroke();
  for(const [x,y,color] of [[43,97,'#7cb547'],[132,162,'#87be5b'],[202,235,'#7cb547'],[335,173,'#adc778'],
    [362,83,'#e8a363'],[464,177,'#e5a55e'],[528,120,'#dcecff'],[610,102,'#e5f0ff'],[592,25,'#e5f0ff']]){
    shape(ctx,[[x-18,y],[x,y-25],[x+18,y]]);ctx.closePath();ctx.fillStyle=color;ctx.fill();
    shape(ctx,[[x,y-25],[x+18,y],[x+6,y]]);ctx.closePath();ctx.fillStyle='#23405c64';ctx.fill();
  }
  shape(ctx,mapStops);ctx.lineWidth=11;ctx.lineCap='round';ctx.strokeStyle='#162b48';ctx.stroke();
  ctx.lineWidth=4;ctx.setLineDash([9,9]);ctx.strokeStyle='#ffd477';ctx.stroke();ctx.setLineDash([]);
  mapStops.forEach(([x,y],i)=>{
    const site=REGIONS[i],owned=company.sites.has(site.id);
    ctx.beginPath();ctx.arc(x,y,26,0,Math.PI*2);ctx.fillStyle='#112940';ctx.fill();
    ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.fillStyle=owned?(certificate?'#ffe180':site.color):(certificate?'#375145':'#344e69');ctx.fill();
    if(company.active===site.id){ctx.strokeStyle='#fff5cb';ctx.lineWidth=3;ctx.stroke();}
    ctx.fillStyle=owned?'#142e46':'#eef4fc';ctx.font='900 19px Nunito, sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(site.number,x,y+1);
    if(certificate){
      ctx.font='700 16px "Microsoft YaHei", sans-serif';ctx.lineWidth=3;
      ctx.strokeStyle='#213628';ctx.strokeText(site.name.slice(0,2),x,y+40);
      ctx.fillStyle=owned?'#fff0b0':'#e0e8cf';ctx.fillText(site.name.slice(0,2),x,y+40);
    }
  });
  const annexCount=company.sites.size-REGIONS.length;
  if(annexCount>0){
    ctx.beginPath();ctx.roundRect(455,219,166,44,8);ctx.fillStyle=certificate?'#253e2c':'#173755';ctx.fill();
    ctx.strokeStyle='#f3d47d';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#ffecaa';ctx.font='900 18px "Microsoft YaHei", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('扩建 +' + numbers.format(annexCount)+' 座',538,242,150);
  }
  ctx.restore();
}

export function renderPortfolio(root,mode,company,onEnter){
  root.replaceChildren();
  if(mode==='atlas'){
    const map=document.createElement('canvas');map.className='atlas-map';map.width=768;map.height=336;
    map.setAttribute('role','img');map.setAttribute('aria-label','四座起始工厂的分布和工业园扩建数量');
    drawMap(map,company);root.append(map);
    for(const site of company.plotSites()){
      const mill=company.sites.get(site.id),rule=company.requirement(site.id),current=company.active===site.id;
      const canOpen=!mill&&rule.delivered>=rule.units&&company.cash>=rule.cash;
      const item=document.createElement('article');item.className='atlas-card';item.style.setProperty('--site',site.color);
      item.innerHTML='<b class="site-index">'+site.number+'</b><div><h3>'+site.name+'</h3><p>'+site.card+'</p><p class="site-progress"></p></div><button class="buy" type="button"></button>';
      item.querySelector('.site-progress').textContent=mill?numbers.format(mill.state.shipped)+' 件交付 · '+mill.state.contract+' 笔订单':
        rule.previous+'出货 '+Math.min(rule.delivered,rule.units)+' / '+rule.units;
      const button=item.querySelector('button');
      button.dataset.site=site.id;
      button.textContent=current?'经营中':mill?'进入':canOpen?'开厂 $'+numbers.format(rule.cash):'$'+numbers.format(rule.cash);
      button.disabled=current||!mill&&!canOpen;
      button.onclick=()=>onEnter(site.id);
      root.append(item);
    }
  }else{
    const board=document.createElement('article');board.className='honor-summary';
    board.innerHTML='<p>企业头衔</p><h3>'+company.title+'</h3><p>'+numbers.format(company.sites.size)+' 座工厂 · '+numbers.format(company.shipped)+' 件交付 · '+numbers.format(company.contracts)+' 笔订单</p>';
    const grid=document.createElement('div');grid.className='honor-grid';
    for(const b of company.badges()){
      const badge=document.createElement('article');badge.className='honor-badge';badge.dataset.earned=String(b.value>=b.total);
      badge.innerHTML='<b>'+b.mark+'</b><h3>'+b.name+'</h3><p>'+b.goal+'</p><span>'+(!b.value||b.value<b.total?numbers.format(b.value)+' / '+numbers.format(b.total):'已获得')+'</span>';
      grid.append(badge);
    }
    const button=document.createElement('button');button.className='buy export-card';button.type='button';
    button.textContent='生成荣誉卡';
    button.onclick=()=>{
      const url=drawHonorCard(company,(canvas,data)=>drawMap(canvas,data,true));
      const image=document.createElement('img');image.className='honor-preview';
      image.src=url;image.alt='松谷木业 · '+company.title+' 荣誉卡预览';
      const link=document.createElement('a');link.className='buy export-card';link.textContent='下载 PNG';
      link.href=url;link.download='松谷木业-'+company.title+'.png';
      const back=document.createElement('button');back.className='buy';back.type='button';back.textContent='返回勋章';
      back.onclick=()=>{renderPortfolio(root,mode,company,onEnter);root.querySelector('.export-card').focus();};
      const actions=document.createElement('div');actions.className='honor-preview-actions';actions.append(back,link);
      root.replaceChildren(image,actions);root.scrollTop=0;link.focus();
    };
    root.append(board,grid,button);
  }
}
