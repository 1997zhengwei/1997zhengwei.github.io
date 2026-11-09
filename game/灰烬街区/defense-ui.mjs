import {nearbyGate,barricade,rebuildDoor} from './sim.mjs';
import {BUILDINGS} from './world.mjs';

export function createDefenseUI(getState,showPanel,commit,showWoodMap){
 const $=id=>document.getElementById(id);let feedback='';
 $('defense-close').onclick=()=>showPanel('play');
 $('defense-board').onclick=()=>act(()=>barricade(getState(),'reinforce'));
 $('defense-remove').onclick=()=>act(()=>barricade(getState(),'remove'));
 $('defense-rebuild').onclick=()=>act(()=>rebuildDoor(getState()));
 $('wood-map').onclick=showWoodMap;
 function act(fn){const s=getState(),start=s.events.length;fn();feedback=s.events.slice(start).findLast(e=>e.text)?.text||'';commit();render();}
 function render(){const s=getState(),g=nearbyGate(s),inv=s.player.inv;
  const building=g&&BUILDINGS.find(b=>b.id===g.building);
  $('defense-title').textContent=g?(g.kind==='door'?'门体防护':'窗户防护'):'靠近门窗施工';
  $('defense-target').textContent=g?(building?.name||'附近建筑')+' · '+(g.broken?'破口已出现':g.open?'已打开':'已关闭'):'站在门窗旁，再打开这个面板。';
  $('defense-state').textContent=g?'门窗本体 '+Math.max(0,g.hp)+' / '+(g.kind==='door'?100:45)+' · 木板屏障 '+g.barricade+' / 160':'当前没有可施工目标';
  $('defense-materials').textContent='随身木板 '+(inv.wood||0)+' · 钉子 '+(inv.nails||0);
  $('defense-board').disabled=!g||g.barricade>0;
  $('defense-board').textContent=g?.barricade>0?'已有木板屏障':'钉板加固 / 临时封堵';
  $('defense-remove').disabled=!g||g.barricade<=0;
  $('defense-rebuild').disabled=!g||g.kind!=='door'||!g.broken;
  $('defense-feedback').textContent=feedback||'施工时世界暂停；关闭后，噪声引来的感染者继续行动。';
 }
 return {open(){feedback='';showPanel('defense');render();},render};
}
