import {createState,restoreSnapshot,saveSnapshot,tick,navigate,buy,buyRoom,upgradeRoom,moneyTargets,openEstate,buyStudy,selectOutfit,claimContract,activateBoost,nearestSupplies} from './simulation.mjs';
import {roomSpot,SPOTS} from './config.mjs';
import {HotelScene} from './scene.mjs';
import {HotelUI} from './ui.mjs';
import {createInput} from './input.mjs';
import {HotelAudio} from './audio.mjs';
const query=new URLSearchParams(location.search),qa=query.get('qa'),showroomMode=query.get('showroom'),showroom=['1','estate'].includes(showroomMode),key=qa?`tidelight-hotel-v1-qa-${qa}`:'tidelight-hotel-v1';
let s=createState(),storageWorks=true;
try{const saved=localStorage.getItem(key);if(saved&&!showroom)s=restoreSnapshot(saved);}catch{storageWorks=false;}
if(showroom){
 s=createState(90);s.cash=20000;s.active=true;
 for(const r of s.rooms){if(!r.built)buyRoom(s,r.id);if(r.id>=103)upgradeRoom(s,r.id);if(r.id>=105)upgradeRoom(s,r.id);}
 for(const id of ['pool','cafe','cleaner','receptionist','poolstaff','barista'])buy(s,id);s.events=[];s.goalsDone=0;
 if(showroomMode==='estate'){
  s.cash=300000;for(const r of s.rooms)while(r.tier<3)upgradeRoom(s,r.id);openEstate(s);
  for(const [i,r] of s.rooms.filter(r=>r.region==='villa').entries()){buyRoom(s,r.id);const tier=[1,2,4,5][i];while(r.tier<tier)upgradeRoom(s,r.id);}
  buy(s,'villaCleaner');s.player.x=0;s.player.z=-47;s.goalsDone=10;s.events=[];
 }
 const banner=document.createElement('div');banner.className='showroom-banner';banner.textContent='美术陈列样板 · 非经营进度 · 不写入存档';document.body.append(banner);
}
let soundMuted=false;try{soundMuted=localStorage.getItem(key+'-mute')==='1';}catch{}
const audio=new HotelAudio(soundMuted),scene=new HotelScene(document.querySelector('#world'));
let ui,input,last=performance.now(),uiTime=0,saveTime=0,firstFrame=true;
function save(){if(showroom)return;try{localStorage.setItem(key,JSON.stringify(saveSnapshot(s)));}catch{if(storageWorks){storageWorks=false;ui?.toast('浏览器暂时无法保存，请保持当前页面开启');}}}
function go(target,label){if(!s.active)return;audio.unlock();if(!navigate(s,target,label))ui.toast('这处暂时还没开放，先去其他岗位吧');}
const actions={
 go,supplies(){go(nearestSupplies(s),'布草间 · 补充毛巾');},boost(){audio.unlock();const result=activateBoost(s);ui.toast(result.message,result.ok?'success':'notice');if(result.ok)save();},clean(){const r=s.rooms.filter(r=>r.built&&r.status==='dirty').sort((a,b)=>Math.hypot(a.x-s.player.x,a.z-s.player.z)-Math.hypot(b.x-s.player.x,b.z-s.player.z))[0];if(r)go(roomSpot(r),`${r.id} 清洁客房`);else ui.toast('现在没有脏房，先接待下一位客人吧');},
 money(){const p=moneyTargets(s)[0];if(p)go(p,p.label);else ui.toast('客人退房后会在门外留下房费');},
 overview(){scene.overview=!scene.overview;ui?.toast(scene.overview?'酒店全景 · 再点一次回到店长身边':'跟随店长 · 点击地面或岗位可行走');},
 roomThumb:r=>scene.roomThumbnail(r),save,muted:()=>audio.muted,sound(){audio.unlock();audio.muted=!audio.muted;try{localStorage.setItem(key+'-mute',audio.muted?'1':'0');}catch{}},
 buy(kind,id){audio.unlock();const result=kind==='item'?buy(s,id):kind==='room'?buyRoom(s,id):kind==='estate'?openEstate(s):kind==='study'?buyStudy(s):kind==='outfit'?selectOutfit(s,id):kind==='contract'?claimContract(s,id):upgradeRoom(s,id);if(result.ok){audio.play('build');save();}return result;},
 reset(){try{localStorage.setItem(key+'-previous',JSON.stringify(saveSnapshot(s)));}catch{}s=createState();ui.setState(s);ui.showIntro();input.clear();save();},
 floor(x,y){if(!s.active||s.paused)return;const p=scene.positionOnFloor(x,y);if(p)go(p,'选定位置');},unlockAudio:()=>audio.unlock(),pause(){if(ui.mode==='intro')return;if(ui.mode)ui.close();else ui.open('pause');input.clear();},manage(){if(s.active)ui.open('manage');}
};
ui=new HotelUI(s,actions);input=createInput(document.querySelector('#world'),actions);
window.addEventListener('pointerdown',()=>audio.unlock(),{once:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){input.clear();if(s.active&&!s.paused)ui.open('pause');save();}});window.addEventListener('pagehide',save);
function frame(now){
 const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;tick(s,dt,input.direction(scene));scene.update(s,dt);uiTime+=dt;saveTime+=dt;
 if(firstFrame){ui.update(scene);document.querySelector('#loading')?.remove();firstFrame=false;}
 while(s.events.length){const e=s.events.shift();audio.play(e.type);scene.event(e);ui.effect(e,scene);if(['goal','build','notice','title'].includes(e.type))ui.toast(e.text,e.type==='goal'?'goal':e.type==='notice'?'notice':'success',e.amount);}
 if(uiTime>.1){ui.update(scene);uiTime=0;}if(saveTime>2){save();saveTime=0;}requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
