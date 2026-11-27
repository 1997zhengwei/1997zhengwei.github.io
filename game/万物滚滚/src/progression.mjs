import {WORLD_METRES,clamp} from './data.mjs';

export const TRAILS=[
 {id:'none',name:'轻装出发',price:0,icon:'○',colors:['#fff9df'],note:'保留清爽的脚步，不显示尾迹。'},
 {id:'confetti',name:'彩纸派对',price:80,icon:'✦',colors:['#ffcf28','#f65069','#2ec5cd'],note:'身后洒开彩纸，脚下亮起欢快光圈。'},
 {id:'mint',name:'薄荷涟漪',price:140,icon:'◎',colors:['#25c8ad','#abf8de','#45acd9'],note:'青绿涟漪与轻盈的薄荷色碎光。'},
 {id:'stardust',name:'星光脚步',price:260,icon:'✧',colors:['#a36cf2','#ffda53','#f4e9ff'],note:'紫金星尘随脚步闪动，留下闪亮脚印。'},
 {id:'rainbow',name:'彩虹漫游',price:420,icon:'虹',colors:['#fa5575','#ffbe32','#5aca75','#35b9e3','#9c68e8'],note:'脚下光圈轮换彩虹，尾迹随步伐变色。'}
];
export const UPGRADES=[
 {id:'duration',name:'聚合续航',icon:'↯',prices:[180,360,600],effect:level=>`冲刺持续 ${4+level} 秒`,note:'每级增加1秒聚合冲刺时间。'},
 {id:'magnet',name:'磁力范围',icon:'◎',prices:[160,320,560],effect:level=>level?`吸附半径额外增加球半径的 ${level*8}%`:'标准接触范围',note:'每级额外扩大球半径8%的收集范围。'},
 {id:'shield',name:'缓冲护盾',icon:'◇',prices:[200,400,700],effect:level=>level?`每局抵挡 ${level} 次撞击`:'暂无开局护盾',note:'每级增加一次护盾；每局补满，保护期间不消耗。'}
];
export function normalizeProgression(raw={}){
 const ownedTrails=[...new Set(['none',...(Array.isArray(raw.ownedTrails)?raw.ownedTrails:[])])].filter(id=>TRAILS.some(t=>t.id===id));
 const upgrades=Object.fromEntries(UPGRADES.map(u=>[u.id,clamp(Math.floor(Number(raw.upgrades?.[u.id])||0),0,u.prices.length)]));
 return {ownedTrails,trail:ownedTrails.includes(raw.trail)?raw.trail:'none',upgrades};
}
// Every complete ten centimetres of peak diameter earns two spendable points.
export const scoreForDiameter=diameter=>Number.isFinite(diameter)?Math.max(0,Math.floor((diameter*WORLD_METRES+1e-9)/.1)*2):0;
export function buyTrail(save,id){const trail=TRAILS.find(t=>t.id===id);if(!trail)return false;if(!save.ownedTrails.includes(id)){if(save.coins<trail.price)return false;save.coins-=trail.price;save.ownedTrails.push(id);}save.trail=id;return true;}
export function buyUpgrade(save,id){const upgrade=UPGRADES.find(u=>u.id===id),level=save.upgrades[id]||0;if(!upgrade||level>=upgrade.prices.length||save.coins<upgrade.prices[level])return false;save.coins-=upgrade.prices[level];save.upgrades[id]=level+1;return true;}
