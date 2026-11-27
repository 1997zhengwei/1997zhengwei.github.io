// Save data, star records and the coin shop. Everything stays in localStorage.
import { sites } from './flow.js';

const SAVE_KEY='sand-sluice-save-v2';
const OLD_KEY='sand-sluice-cleared-v1';

export const SHOP = [
  { id:'bomb', kind:'tool', name:'炸药', icon:'🧨', price:120, note:'点一块岩石，把它炸开' },
  { id:'magnet', kind:'tool', name:'磁石', icon:'🧲', price:80, note:'本局水流吸附宝石的范围变大' },
  { id:'water-clear', kind:'water', name:'清泉蓝', price:0, swatch:['#0d3f74','#2fc6e8'] },
  { id:'water-mint', kind:'water', name:'薄荷绿', price:300, swatch:['#0b5a52','#5ff0c0'] },
  { id:'water-rose', kind:'water', name:'樱花粉', price:500, swatch:['#8a2f6a','#ff9ccf'] },
  { id:'water-gold', kind:'water', name:'熔金', price:900, swatch:['#8a4a06','#ffd34d'] },
  { id:'water-galaxy', kind:'water', name:'星河', price:1500, swatch:['#2a1a6e','#9fb8ff'] },
  { id:'trail-dust', kind:'trail', name:'沙尘', price:0, swatch:['#e8c08f','#fff1d0'] },
  { id:'trail-gold', kind:'trail', name:'金粉', price:250, swatch:['#ffcf4a','#fff6c0'] },
  { id:'trail-petal', kind:'trail', name:'花瓣', price:500, swatch:['#ff9fc8','#fff0f6'] },
  { id:'trail-star', kind:'trail', name:'星光', price:900, swatch:['#8fd8ff','#ffffff'] },
  { id:'tray-teal', kind:'tray', name:'青铜筛', price:0, swatch:['#2d8f8b','#ffc771'] },
  { id:'tray-brass', kind:'tray', name:'黄铜筛', price:350, swatch:['#b07a2a','#ffe08a'] },
  { id:'tray-sakura', kind:'tray', name:'樱木筛', price:650, swatch:['#c46a8c','#ffe3ef'] },
  { id:'tray-amethyst', kind:'tray', name:'紫晶筛', price:1100, swatch:['#6a4bb8','#d9c7ff'] },
];
export const SHOP_BY_ID = Object.fromEntries(SHOP.map(item=>[item.id,item]));
export const SLOT_NAMES = { water:'水色', trail:'挖沙拖尾', tray:'筛盘' };

const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};

function fresh() {
  return { v:2, coins:0, levels:{}, tools:{bomb:1,magnet:1},
    owned:['water-clear','trail-dust','tray-teal'],
    equip:{water:'water-clear',trail:'trail-dust',tray:'tray-teal'}, daily:{day:'',left:0}, last:0 };
}

export function loadSave() {
  let save=fresh();
  try {
    const data=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(data?.v===2){
      save={...save,...data,tools:{...save.tools,...data.tools},equip:{...save.equip,...data.equip},
        daily:{...save.daily,...data.daily}};
    } else {
      const old=JSON.parse(localStorage.getItem(OLD_KEY));
      if(Array.isArray(old))for(const i of old)if(Number.isInteger(i)&&sites[i])save.levels[i]={stars:[true,false,false],clears:1};
    }
  } catch {}
  delete save.items; delete save.claimed; delete save.pity; // fields of the removed collection book
  if(!Number.isFinite(save.coins)||save.coins<0)save.coins=0;
  for(const id of ['water-clear','trail-dust','tray-teal'])if(!save.owned.includes(id))save.owned.push(id);
  for(const [slot,id] of Object.entries(save.equip))if(!save.owned.includes(id)||SHOP_BY_ID[id]?.kind!==slot)save.equip[slot]=slot==='water'?'water-clear':slot==='trail'?'trail-dust':'tray-teal';
  if(save.daily.day!==today())save.daily={day:today(),left:3};
  return save;
}

export function writeSave(save) {
  try { localStorage.setItem(SAVE_KEY,JSON.stringify(save)); } catch {}
}

export const levelStars = (save,i) => save.levels[i]?.stars ?? [false,false,false];
export const starCount = (save,i) => levelStars(save,i).filter(Boolean).length;
export const totalStars = save => sites.reduce((sum,_,i)=>sum+starCount(save,i),0);
export const unlocked = (save,i) => i===0 || !!save.levels[i-1]?.clears || !!save.levels[i]?.clears;

// Records a finished run and returns everything the result card shows.
export function recordClear(save,i,run) {
  const site=sites[i];
  const stars=[true,run.water<=site.par.water,run.dig<=site.par.dig];
  const runStars=stars.filter(Boolean).length;
  const level=save.levels[i] ?? {stars:[false,false,false],clears:0};
  const before=level.stars.filter(Boolean).length;
  level.stars=level.stars.map((had,k)=>had||stars[k]);
  level.clears=(level.clears||0)+1;
  level.bestWater=Math.min(level.bestWater??Infinity,run.water);
  level.bestDig=Math.min(level.bestDig??Infinity,run.dig);
  save.levels[i]=level;
  const firstPerfect=before<3&&level.stars.every(Boolean);
  const coins={ gems:run.gemScore, flakes:run.flakeScore, combo:run.comboScore||0, stars:runStars*8, perfect:firstPerfect?40:0, daily:0 };
  if(save.daily.day!==today())save.daily={day:today(),left:3};
  const daily=save.daily.left>0;
  // Daily bonus: the first three clears of each day pay their gem and flake coins twice.
  if(daily){save.daily.left--;coins.daily=coins.gems+coins.flakes;}
  const total=coins.gems+coins.flakes+coins.combo+coins.stars+coins.perfect+coins.daily;
  save.coins+=total;
  save.last=i;
  writeSave(save);
  return { stars, runStars, coins, daily, total };
}

export function buy(save,id) {
  const item=SHOP_BY_ID[id];
  if(!item||save.coins<item.price)return false;
  if(item.kind!=='tool'&&save.owned.includes(id))return false;
  save.coins-=item.price;
  if(item.kind==='tool')save.tools[id]=(save.tools[id]||0)+1;
  else { save.owned.push(id); save.equip[item.kind]=id; }
  writeSave(save);
  return true;
}
