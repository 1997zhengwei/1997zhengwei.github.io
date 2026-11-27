import {ITEMS} from './world.mjs';
import {cargoCapacity} from './vehicles.mjs';
import {weight,vehicleAccess,parkedAtHome,cargoTransfer,cargoTransferAll,unloadHome,serviceVehicle} from './sim.mjs';

export function createVehicleUI(getState,showPanel,commit){
 const $=id=>document.getElementById(id);
 let id=null,side='bag',tab='cargo',feedback='';
 function act(fn){const s=getState(),start=s.events.length;fn();feedback=s.events.slice(start).findLast(e=>e.text)?.text||'已完成转移。';commit();render();}
 $('vehicle-close').onclick=()=>showPanel('play');
 $('vehicle-cargo-tab').onclick=()=>{tab='cargo';render();};
 $('vehicle-service-tab').onclick=()=>{tab='service';render();};
 $('cargo-side-bag').onclick=()=>{side='bag';render();};
 $('cargo-side-car').onclick=()=>{side='car';render();};
 $('cargo-bulk').onclick=()=>act(()=>cargoTransferAll(getState(),id,side==='bag'));
 $('cargo-home').onclick=()=>act(()=>unloadHome(getState(),id));
 $('vehicle-refuel').onclick=()=>act(()=>serviceVehicle(getState(),id,'fuel'));
 $('vehicle-repair').onclick=()=>act(()=>serviceVehicle(getState(),id,'repair'));
 function render(){
  const s=getState(),v=s.vehicles.find(v=>v.id===id);if(!v)return;
  $('vehicle-title').textContent=v.name;
  $('vehicle-stats').textContent='油量 '+(Math.floor(v.fuel*10)/10).toFixed(1)+'% · 车况 '+(Math.floor(v.hp*10)/10).toFixed(1)+'%';
  $('cargo-weight').textContent='后备箱 '+weight(v.cargo).toFixed(1)+' / '+cargoCapacity(v)+' kg';
  $('cargo-capacity').style.width=Math.min(100,weight(v.cargo)/cargoCapacity(v)*100)+'%';
  $('cargo-bag-weight').textContent='背包 '+weight(s.player.inv).toFixed(1)+' / 16 kg';
  $('vehicle-cargo').classList.toggle('hidden',tab!=='cargo');$('vehicle-service').classList.toggle('hidden',tab!=='service');
  for(const key of ['cargo','service'])$('vehicle-'+key+'-tab').classList.toggle('selected',tab===key);
  for(const key of ['bag','car']){$('cargo-side-'+key).classList.toggle('selected',side===key);$('cargo-side-'+key).setAttribute('aria-pressed',String(side===key));}
  const source=side==='bag'?s.player.inv:v.cargo,rows=$('cargo-items');rows.replaceChildren();
  for(const [item,n] of Object.entries(source)){
   if(n<=0||!ITEMS[item])continue;const data=ITEMS[item],row=document.createElement('article'),icon=document.createElement('span'),info=document.createElement('div');icon.className='item-icon';icon.style.color=data.color;icon.textContent=data.icon;const title=document.createElement('b'),detail=document.createElement('small');title.textContent=data.name+' ×'+n;detail.textContent=(data.weight*n).toFixed(1)+' kg';info.append(title,detail);row.append(icon,info);
   for(const all of [false,true]){const b=document.createElement('button');b.textContent=all?(side==='bag'?'全装':'全取'):(side==='bag'?'装1':'取1');b.setAttribute('aria-label',(side==='bag'?'装入 ':'取出 ')+data.name+(all?' 全部':' 1件'));b.onclick=()=>act(()=>cargoTransfer(s,id,item,all?Infinity:1,side==='bag'));row.append(b);}rows.append(row);
  }
  if(!rows.childElementCount){const empty=document.createElement('p');empty.textContent=side==='bag'?'背包是空的。物资可以留在后备箱中运输。':'后备箱是空的。切到“背包装车”放入物资。';rows.append(empty);}
  $('cargo-bulk').textContent=side==='bag'?'装入全部':'取出可携带物资';
  const home=parkedAtHome(v),canAccess=!!vehicleAccess(s,id,false);
  $('cargo-home').disabled=!home||!canAccess||weight(v.cargo)===0;
  $('cargo-home-note').textContent=home?'已在17号安全屋卸货区 · 一键送入屋内储物箱':'开回17号安全屋门外的金色卸货区，再下车卸货。';
  const stock=item=>(s.player.inv[item]||0)+(v.cargo[item]||0);
  $('fuel-stock').textContent='可用汽油 '+stock('fuel')+' 罐 · 背包与后备箱均可取用';
  $('repair-stock').textContent='维修包 '+stock('repairkit')+' · 废金属 '+stock('scrap');
  $('vehicle-refuel').disabled=!canAccess||v.fuel>=99.999||stock('fuel')<1;
  $('vehicle-repair').disabled=!canAccess||v.hp>=99.999||stock('repairkit')<1||stock('scrap')<2;
  $('vehicle-refuel').textContent=v.fuel>=99.999?'油箱已满':'加油 +25%';
  $('vehicle-repair').textContent=v.hp>=99.999?'车况良好':'维修 +35%';
  $('vehicle-feedback').textContent=feedback||'操作期间世界暂停。关闭面板后继续。';
 }
 return {get id(){return id;},render,open(next){id=next;side='bag';tab='cargo';feedback='';showPanel('vehicle');render();}};
}
