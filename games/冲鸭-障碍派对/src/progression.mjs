import {SKINS} from './course.mjs';
import {TRACK_ID,MAPS} from './tracks.mjs';
export const DYES=['#ffd239','#b891ff','#70edff','#ff8dc9','#80ffd2','#ff754c','#e8f5ff','#89a3ff'];
export const CATEGORIES=[{id:'skin',name:'角色'},{id:'head',name:'头饰'},{id:'back',name:'背饰'},{id:'trail',name:'尾迹'}];
export const ACCESSORIES=[
 {id:'head_none',slot:'head',name:'不戴头饰',rarity:'基础',price:0},
 {id:'party',slot:'head',name:'彩虹派对帽',rarity:'精致',price:45},
 {id:'tophat',slot:'head',name:'绅士高礼帽',rarity:'稀有',price:120},
 {id:'halo',slot:'head',name:'星光悬浮环',rarity:'稀有',price:180},
 {id:'crown',slot:'head',name:'宝石大王冠',rarity:'史诗',price:320},
 {id:'antlers',slot:'head',name:'水晶鹿角',rarity:'史诗',price:420},
 {id:'orbit',slot:'head',name:'银河行星环',rarity:'史诗',price:580},
 {id:'fireworks',slot:'head',name:'庆典烟花冠',rarity:'传说',price:760},
 {id:'royal',slot:'head',name:'极光皇家冠',rarity:'传说',price:1050},
 {id:'solar',slot:'head',name:'日冕神冠',rarity:'神话',price:1280},
 {id:'back_none',slot:'back',name:'不戴背饰',rarity:'基础',price:0},
 {id:'bow',slot:'back',name:'巨型蝴蝶结',rarity:'精致',price:65},
 {id:'cape',slot:'back',name:'星辰长披风',rarity:'稀有',price:150},
 {id:'angel',slot:'back',name:'云朵天使翼',rarity:'史诗',price:300},
 {id:'bat',slot:'back',name:'夜色恶魔翼',rarity:'史诗',price:360},
 {id:'butterfly',slot:'back',name:'幻彩蝴蝶翼',rarity:'史诗',price:480},
 {id:'rocket',slot:'back',name:'双子火箭背包',rarity:'史诗',price:560},
 {id:'galaxy',slot:'back',name:'银河六翼',rarity:'传说',price:980},
 {id:'phoenix',slot:'back',name:'曜金凤凰羽翼',rarity:'神话',price:1480},
 {id:'trail_none',slot:'trail',name:'不带尾迹',rarity:'基础',price:0},
 {id:'spark',slot:'trail',name:'闪闪星屑',rarity:'精致',price:55},
 {id:'hearts',slot:'trail',name:'甜心泡泡',rarity:'稀有',price:140},
 {id:'rainbow',slot:'trail',name:'彩虹跑道',rarity:'稀有',price:230},
 {id:'stars',slot:'trail',name:'流星之路',rarity:'史诗',price:340},
 {id:'bubbles',slot:'trail',name:'珍珠泡泡',rarity:'史诗',price:410},
 {id:'flame',slot:'trail',name:'烈焰疾行',rarity:'史诗',price:530},
 {id:'stardust',slot:'trail',name:'银河星尘',rarity:'传说',price:820},
 {id:'comet',slot:'trail',name:'彗星龙焰',rarity:'神话',price:1160}
];
export const DEFAULT_LOOK={head:'head_none',back:'back_none',trail:'trail_none',color:DYES[0]};
const none=['head_none','back_none','trail_none'];
export function migrateSave(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const finite=(v)=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
 const unlocked=[...new Set(['duck','cat',...(Array.isArray(raw.unlocked)?raw.unlocked:[]).filter(id=>SKINS.some(s=>s.id===id))])];
 const ownedAccessories=[...new Set([...none,...(Array.isArray(raw.ownedAccessories)?raw.ownedAccessories:[]).filter(id=>ACCESSORIES.some(s=>s.id===id))])];
 const loadout={...DEFAULT_LOOK};for(const slot of['head','back','trail'])if(ownedAccessories.includes(raw.loadout?.[slot])&&ACCESSORIES.some(a=>a.id===raw.loadout[slot]&&a.slot===slot))loadout[slot]=raw.loadout[slot];
 if(DYES.includes(raw.loadout?.color))loadout.color=raw.loadout.color;
 const bestTracks={...(raw.bestTracks&&typeof raw.bestTracks==='object'?raw.bestTracks:{})};
 if(raw.best&&(!raw.version||raw.version<2))bestTracks.classic=finite(raw.best);
 const track=MAPS.some(m=>m.id===raw.track)?raw.track:'grand-tour-v2';
 const {difficulty:legacyDifficulty,...rest}=raw;
 return {...rest,version:4,track,coins:finite(raw.coins),wins:finite(raw.wins),races:finite(raw.races),bestTracks,best:finite(bestTracks[track])||null,skin:unlocked.includes(raw.skin)?raw.skin:'duck',unlocked,ownedAccessories,loadout,sound:raw.sound!==false};
}
export function equipOwned(save,preview){
 const loadout={...save.loadout};for(const slot of['head','back','trail'])if(save.ownedAccessories.includes(preview[slot])&&ACCESSORIES.some(a=>a.id===preview[slot]&&a.slot===slot))loadout[slot]=preview[slot];
 if(DYES.includes(preview.color))loadout.color=preview.color;save.loadout=loadout;return loadout;
}
export function buyAccessory(save,id,preview={}){
 const item=ACCESSORIES.find(a=>a.id===id);if(!item)return {ok:false,reason:'missing'};
 const owned=save.ownedAccessories.includes(id);if(!owned&&save.coins<item.price)return {ok:false,reason:'funds'};
 if(!owned){save.coins-=item.price;save.ownedAccessories.push(id);}
 equipOwned(save,{...preview,[item.slot]:id});return {ok:true,bought:!owned,item};
}
export const PODIUM_PRIZES=Object.freeze([200,140,100]);
export function raceReward(rank,finished,collected=0){
 if(finished!==true||!Number.isInteger(rank)||rank<1||rank>3)return 0;
 return PODIUM_PRIZES[rank-1]+(Number.isFinite(collected)?Math.max(0,Math.floor(collected)):0);
}
