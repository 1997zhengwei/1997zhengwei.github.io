export const STORES={
 corner:{id:'corner',name:'街角生鲜店',short:'街角店',emoji:'🍅',tag:'从第一篮番茄开始',cost:0,needs:null,sign:'FRESH MART',ground:'#7dcc57',floor:'#ece2cb',path:'#82d7df',accent:'#27a77d',sky:'#7dcb58'},
 seaside:{id:'seaside',name:'海滨果饮店',short:'海滨店',emoji:'🏝️',tag:'芒果、椰子与香烤菠萝',cost:4000,needs:'corner',sign:'SUNNY COAST',ground:'#f2d699',floor:'#f5e8c8',path:'#67d4d4',accent:'#ff9260',sky:'#8edee6'},
 night:{id:'night',name:'灯火夜市店',short:'夜市店',emoji:'🏮',tag:'柠檬汽水与现烤菌菇串',cost:9000,needs:'seaside',sign:'MOONLIGHT MART',ground:'#425574',floor:'#d8c8b0',path:'#7489a4',accent:'#e9848b',sky:'#243449'}
};
const THEMES=['corner','seaside','night'];
export function storeIndex(id){const m=/^(corner|seaside|night)(?:-([2-9]\d*|1\d+))?$/.exec(id||'');if(!m)return -1;const n=Number(m[2]||1);return Number.isSafeInteger(n)?(n-1)*3+THEMES.indexOf(m[1]):-1;}
export function storeIdAt(index){const theme=THEMES[index%3],n=Math.floor(index/3)+1;return n===1?theme:`${theme}-${n}`;}
export const storeTheme=id=>THEMES[Math.max(0,storeIndex(id))%3];
export function storeDef(s){const id=typeof s==='string'?s:s?.storeId,index=Math.max(0,storeIndex(id)),base=STORES[storeTheme(id)],district=Math.floor(index/3)+1;return {...base,id:id||'corner',theme:base.id,index,district,...(index>=3?{name:`第${district}商圈 · ${base.name}`,short:`${base.short}${district}号`,cost:Math.round(9000*(1+(index-2)*.32)**1.25),needs:storeIdAt(index-1)}:{})};}
export function productVariant(store,id){
 store=storeTheme(store);
 if(store==='seaside')return {
  tomato:{name:'芒果',emoji:'🥭',color:'#ffb929',price:14,renderId:'mango',shelf:[5,8],restock:[2.9,8],shop:[7.1,8]},
  egg:{name:'鲜椰子',emoji:'🥥',color:'#a7bb4f',price:24,renderId:'coconut',shelf:[12,5],restock:[9.9,5],shop:[14.1,5]},
  eggplant:{name:'菠萝',emoji:'🍍',color:'#e4ac39',price:30,renderId:'pineapple',shelf:[5,0],restock:[2.9,0],shop:[7.1,0]},
  milk:{name:'牧场鲜奶',emoji:'🥛',price:40,shelf:[12,-3],restock:[9.9,-3],shop:[14.1,-3]},
  bread:{name:'香烤菠萝',emoji:'🍍',color:'#d98c38',price:68,renderId:'grilled',ingredient:'eggplant',recipe:2,yield:2,rate:5.5,shelf:[5,-8],restock:[2.9,-8],shop:[7.1,-8]},
  juice:{name:'芒果冰饮',emoji:'🍹',color:'#ffb834',price:82,renderId:'smoothie',recipe:3,yield:2,rate:5,shelf:[12,-11],restock:[9.9,-11],shop:[14.1,-11]},
  flower:{name:'海岛花束',emoji:'🌺',color:'#ff929f',price:82,renderId:'tropicalFlower'}
 }[id]||{};
 if(store==='night')return {
  tomato:{name:'鲜柠檬',emoji:'🍋',color:'#f4d34f',price:17,renderId:'lemon',shelf:[3,7],restock:[.9,7],shop:[5.1,7]},
  egg:{name:'土鸡蛋',emoji:'🥚',price:28,shelf:[14,7],restock:[11.9,7],shop:[16.1,7]},
  eggplant:{name:'鲜蘑菇',emoji:'🍄',color:'#b88975',price:37,renderId:'mushroom',shelf:[3,-1],restock:[.9,-1],shop:[5.1,-1]},
  milk:{name:'香浓豆浆',emoji:'🥛',color:'#f0d49a',price:46,renderId:'soymilk',shelf:[14,-1],restock:[11.9,-1],shop:[16.1,-1]},
  bread:{name:'香烤菌菇串',emoji:'🍢',color:'#b9794e',price:79,renderId:'skewer',ingredient:'eggplant',recipe:3,yield:2,rate:5.5,shelf:[3,-9],restock:[.9,-9],shop:[5.1,-9]},
  juice:{name:'冰柠汽水',emoji:'🍋',color:'#b7df88',price:96,renderId:'lemonade',shelf:[14,-9],restock:[11.9,-9],shop:[16.1,-9]},
  flower:{name:'月光花束',emoji:'💐',color:'#beafff',price:98,renderId:'moonFlower'}
 }[id]||{};return {};
}
export function modelId(id,store='corner'){return productVariant(store,id).renderId||id;}
export const STORE_FIELDS=['player','goods','wheat','staffLevels','employees','customers','nextId','spawnTimer','expansions','investments','stats','registerCash','contract','deliveryTimer','deliveries','stars','decorId','dividendCash','manager','storageLevel'];
export function storeSnapshot(s){return structuredClone(Object.fromEntries(STORE_FIELDS.map(k=>[k,s[k]])));}
export function storeRecords(s){return [{...storeSnapshot(s),id:s.storeId},...Object.entries(s.stores||{}).filter(([id])=>id!==s.storeId).map(([id,r])=>({...r,id}))];}
export const highestStars=s=>Math.max(1,s.stars||1,...Object.values(s.stores||{}).map(r=>r.stars||1));
export function branchInfo(s,id){const def=storeDef(id),opened=id===s.storeId||!!s.stores[id],parent=def.needs===s.storeId?s:s.stores[def.needs];return {...def,opened,current:id===s.storeId,reason:storeIndex(id)<0?'未知门店':!opened&&def.needs&&(parent?.stars||0)<5?`${storeDef(def.needs).short}达到 5 星`:!opened&&def.index>=3&&!parent?.manager?.level?`先为${storeDef(def.needs).short}聘请店长`:''};}
export function nextBranch(s){const last=Math.max(storeIndex(s.storeId),...Object.keys(s.stores||{}).map(storeIndex));return storeIdAt(last+1);}
