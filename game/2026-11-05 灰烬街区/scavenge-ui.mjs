import {ITEMS} from './world.mjs';
import {nearbyLoot,takeLoot,takeAllLoot,weight} from './sim.mjs';

export function containerName(box){if(box.name)return box.name;const name=box.model.split('/').at(-1);return ({kitchenCabinet:'厨房储物柜',kitchenFridge:'冰箱',kitchenFridgeLarge:'大冰箱',bookcaseOpen:'置物架',workbench:'工作台',box:'物资箱',barrel:'油桶', 'resource-planks':'木料架'})[name]||'储物容器';}
export function createScavengeUI(getState,showPanel,commit){
 const $=id=>document.getElementById(id);let selected=null,feedback='';
 $('scavenge-close').onclick=()=>showPanel('play');
 $('scavenge-all').onclick=()=>act(()=>takeAllLoot(getState(),selected));
 function act(fn){const s=getState(),start=s.events.length;fn();feedback=s.events.slice(start).filter(e=>e.text).at(-1)?.text||'请靠近容器，再试一次。';commit();render();}
 function render(){
  const s=getState(),boxes=nearbyLoot(s);if(!boxes.some(b=>b.id===selected))selected=(boxes.find(b=>Object.values(b.items).some(n=>n>0))||boxes[0])?.id||null;const box=boxes.find(b=>b.id===selected),tabs=$('scavenge-containers');tabs.replaceChildren();
  for(const b of boxes){const button=document.createElement('button'),count=Object.values(b.items).reduce((a,n)=>a+n,0);button.textContent=containerName(b)+' · '+(count?count+'件':'已空');button.classList.toggle('selected',b.id===selected);button.setAttribute('aria-pressed',String(b.id===selected));button.onclick=()=>{selected=b.id;feedback='';render();};tabs.append(button);}
  $('scavenge-title').textContent=box?containerName(box):'附近搜刮';
  $('scavenge-hint').textContent=box?'选容器，再点拿取。超出负重的物资会留在原处。':'先关面板，走近柜子、冰箱或物资箱，再点搜刮。';
  $('scavenge-weight').textContent=weight(s.player.inv).toFixed(1)+' / 16 kg';$('scavenge-meter').style.width=weight(s.player.inv)/16*100+'%';
  const rows=$('scavenge-items');rows.replaceChildren();let count=0;
  for(const [id,n] of Object.entries(box?.items||{})){if(n<=0||!ITEMS[id])continue;count+=n;const item=ITEMS[id],row=document.createElement('article'),icon=document.createElement('span'),info=document.createElement('div'),title=document.createElement('b'),detail=document.createElement('small');icon.className='item-icon';icon.style.color=item.color;icon.textContent=item.icon;title.textContent=item.name+' ×'+n;detail.textContent=item.weight+' kg / 件';info.append(title,detail);row.append(icon,info);for(const all of [false,true]){const button=document.createElement('button');button.textContent=all?'全拿':'拿1';button.setAttribute('aria-label','拿取 '+item.name+(all?' 全部':' 1件'));button.onclick=()=>act(()=>takeLoot(s,selected,id,all?Infinity:1));row.append(button);}rows.append(row);}
  if(!count){const empty=document.createElement('div');empty.className='loot-empty';empty.textContent=box?'这个容器已搜空。可以切换上方其他容器，或继续探索。':'靠近物资后，右下“搜刮”按钮会显示附近容器数量。';rows.append(empty);}
  $('scavenge-all').disabled=!count;$('scavenge-feedback').textContent=feedback||'打开面板时世界暂停，关闭后继续。';
 }
 return {render,open(id){selected=id;feedback='';showPanel('scavenge');render();}};
}
