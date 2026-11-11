import {highestStars,storeRecords} from './stores.mjs';
export const COSMETICS={
 'outfit:starter':{kind:'outfit',name:'经典绿围裙',emoji:'👕',price:0,stars:1,tier:0,desc:'熟悉的开店装束',color:'#00af8b',trim:'#fff0a6'},
 'outfit:denim':{kind:'outfit',name:'牛仔工装',emoji:'🧵',price:650,stars:2,tier:1,desc:'牛仔背带、皮革扣与双口袋',color:'#367bad',trim:'#d9a365'},
 'outfit:sailor':{kind:'outfit',name:'海盐水手服',emoji:'⚓',price:2200,stars:3,tier:2,desc:'海军蓝领口、白帽与领巾',color:'#fff6df',trim:'#387eae'},
 'outfit:gold':{kind:'outfit',name:'金边店长礼服',emoji:'🎩',price:7800,stars:4,tier:3,desc:'深色西装、金领章与礼帽',color:'#304360',trim:'#f5c55c'},
 'outfit:royal':{kind:'outfit',name:'星耀主理人',emoji:'👑',price:18000,stars:5,stores:2,tier:4,desc:'紫金长外套、星章与主理人冠',color:'#6d4a9a',trim:'#ffd463'},
 'tray:wood':{kind:'tray',name:'旧木托盘',emoji:'📦',price:0,stars:1,tier:0,desc:'从第一摞货开始',color:'#edb85f',trim:'#ffe09b'},
 'tray:steel':{kind:'tray',name:'精工金属托盘',emoji:'🔩',price:550,stars:2,tier:1,desc:'银色包边、铆钉与结实握柄',color:'#acccd4',trim:'#e5f3ed'},
 'tray:walnut':{kind:'tray',name:'胡桃木匠作盘',emoji:'🪵',price:1900,stars:3,tier:2,desc:'深色木纹、黄铜护角',color:'#865137',trim:'#e9bb61'},
 'tray:gilded':{kind:'tray',name:'鎏金搬运盘',emoji:'✨',price:6500,stars:4,tier:3,desc:'金色框架、宝石扣与侧翼',color:'#e5af36',trim:'#fff0a7'},
 'tray:starlight':{kind:'tray',name:'星光悬浮盘',emoji:'💎',price:15000,stars:5,stores:2,tier:4,desc:'晶体核心与环形悬浮底座',color:'#8de0e6',trim:'#e8daff'},
 'decor:classic':{kind:'decor',name:'原木开店',emoji:'🏪',price:0,stars:1,tier:0,desc:'温暖木地板与经典绿招牌',floor:'#ece2cb',accent:'#27a77d',trim:'#f7d9a1'},
 'decor:mint':{kind:'decor',name:'清爽薄荷',emoji:'🌿',price:900,stars:2,tier:1,desc:'薄荷条纹棚、白木地板和花箱',floor:'#e8eadb',accent:'#66b99e',trim:'#f7fae9'},
 'decor:coast':{kind:'decor',name:'海滨假日',emoji:'🐚',price:3500,stars:3,tier:2,desc:'珊瑚遮阳棚、蓝色镶边与贝壳饰',floor:'#e8e4ce',accent:'#ee9780',trim:'#78cbd7'},
 'decor:metro':{kind:'decor',name:'都会金典',emoji:'🏛️',price:9500,stars:4,tier:3,desc:'棋盘地面、深木招牌与金色灯柱',floor:'#e4dbc7',accent:'#3c5266',trim:'#edc76c'},
 'decor:flagship':{kind:'decor',name:'五星流光',emoji:'🌟',price:20000,stars:5,stores:2,tier:4,desc:'金色地面纹样、紫金门头与星冠',floor:'#eee2cf',accent:'#8c74b9',trim:'#f8cd65'}
};
export const starterCosmetics=()=>({owned:['outfit:starter','tray:wood','decor:classic'],equipped:{outfit:'outfit:starter',tray:'tray:wood'}});
export function cosmeticInfo(s,id){const d=COSMETICS[id],owned=s.cosmetics.owned.includes(id),selected=d.kind==='decor'?s.decorId===id:s.cosmetics.equipped[d.kind]===id;return {...d,id,owned,selected,reason:owned?'':highestStars(s)<d.stars?`任一门店达到 ${d.stars} 星`:d.stores&&(1+Object.keys(s.stores||{}).length)<d.stores?`开设 ${d.stores} 家门店`:''};}
export function outfitFor(s){return COSMETICS[s?.cosmetics?.equipped?.outfit]||COSMETICS['outfit:starter'];}
export function trayFor(s){return COSMETICS[s?.cosmetics?.equipped?.tray]||COSMETICS['tray:wood'];}
export function decorFor(s){return COSMETICS[s?.decorId]||COSMETICS['decor:classic'];}
