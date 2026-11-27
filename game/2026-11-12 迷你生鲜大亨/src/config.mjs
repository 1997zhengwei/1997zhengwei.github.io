import {productVariant,storeTheme} from './stores.mjs';
export const VERSION='0.4.0';
export const PRODUCTS={
 tomato:{name:'番茄',emoji:'🍅',color:'#ee4937',price:10,shelf:[5,7],restock:[2.9,7],shop:[7.1,7],source:[-11,6.5],pickup:[-6.3,6.5],rate:1.5,cost:0},
 egg:{name:'鲜鸡蛋',emoji:'🥚',color:'#ffcd55',price:18,shelf:[12,7],restock:[9.9,7],shop:[14.1,7],source:[-11,-9],pickup:[-6.3,-9],rate:2.2,cost:130},
 eggplant:{name:'茄子',emoji:'🍆',color:'#8954bd',price:24,shelf:[5,-1],restock:[2.9,-1],shop:[7.1,-1],source:[-11,-1.2],pickup:[-6.3,-1.2],rate:2.5,cost:230},
 milk:{name:'鲜牛奶',emoji:'🥛',color:'#64b8ef',price:32,shelf:[12,-1],restock:[9.9,-1],shop:[14.1,-1],source:[-11,-23.5],pickup:[-6.3,-23.5],rate:3,cost:0,north:true},
 bread:{name:'手作面包',emoji:'🥖',color:'#e8a14e',price:48,shelf:[5,-9],restock:[2.9,-9],shop:[7.1,-9],source:[4.5,-23],pickup:[6.8,-23],input:[2.1,-23],ingredient:'wheat',recipe:2,yield:2,rate:4.5,cost:750,north:true},
 juice:{name:'番茄汁',emoji:'🧃',color:'#ff8353',price:62,shelf:[12,-9],restock:[9.9,-9],shop:[14.1,-9],source:[12,-23],pickup:[14.3,-23],input:[9.6,-23],ingredient:'tomato',recipe:2,yield:1,rate:4,cost:1200,north:true},
 flower:{name:'鲜花花束',emoji:'💐',color:'#e788b0',price:66,shelf:[21,8.6],restock:[18.9,8.6],shop:[23.1,8.6],source:[25,13],pickup:[20.3,13],rate:3.4,cost:0,north:true,star:4}
};
const variants=new Map();
export function productsFor(s){const id=storeTheme(s?.storeId);if(!variants.has(id))variants.set(id,Object.fromEntries(Object.entries(PRODUCTS).map(([key,p])=>[key,{...p,...productVariant(id,key)}])));return variants.get(id);}
export const BASE_IDS=['tomato','egg','eggplant','milk','bread','juice'];
export const needsWheat=s=>productsFor(s).bread.ingredient==='wheat';
export const WHEAT={name:'小麦',emoji:'🌾',source:[-11,-17],pickup:[-6.3,-17],rate:1.7};
export const IDS=Object.keys(PRODUCTS);
export const TILL={service:[7.5,10.25],customer:[7.5,13.5],cash:[4.1,11.6]};
export const TILLS=[TILL,{service:[13.4,10.25],customer:[13.4,13.5],cash:TILL.cash}];
export const checkoutCount=s=>Math.max(1,Math.min(2,s.employees.filter(a=>a.role==='cashier').length));
export const queuePosition=(lane,index)=>[TILLS[lane].customer[0]+(Math.ceil(Math.floor(index/7)/2)*1.45)*(Math.floor(index/7)%2?-1:1),TILLS[lane].customer[1]+index%7*1.05];
export const STAFF={
 tomato:{name:'蔬果补货员',desc:'采收番茄 → 补满货架',cost:140,color:'#ffbd5a'},
 cashier:{name:'收银员',desc:'到岗扫码，让你腾出双手',cost:180,color:'#ed87ac'},
 fresh:{name:'生鲜补货员',desc:'负责鸡蛋、茄子和鲜牛奶',cost:420,color:'#86bcf2'},
 baker:{name:'面包师',desc:'收麦 → 烘焙 → 补货',cost:650,color:'#fff1bd',needs:'bread'},
 juicer:{name:'果汁师',desc:'番茄榨汁 → 补货',cost:900,color:'#b19be7',needs:'juice'}
};
export const bagCapacity=s=>6+s.upgrades.bag*4;
export const moveSpeed=s=>5.7+s.upgrades.speed*.65;
export const shelfCapacity=(s,id)=>24+s.goods[id].level*8+(s.expansions.warehouse?8:0);
export const reserveCapacity=s=>(s.storageLevel||0)*12;
export const STORAGE_SPOT=[19.7,-5.2];
export const unitPrice=(s,id)=>Math.round(productsFor(s)[id].price*(1+s.goods[id].level*.14+s.upgrades.research*.025));
export const titleFor=s=>[...[[0,'街角新店'],[600,'人气小店'],[3000,'生鲜达人'],[12000,'街区明星'],[40000,'零售大亨']]].reverse().find(([v])=>s.stats.revenue>=v)[1];
export function lockedReason(s,key){
 const products=productsFor(s);
 if(key==='north')return !s.goods.egg.unlocked||!s.goods.eggplant.unlocked?`先开售${products.egg.name}和${products.eggplant.name}`:s.stats.revenue<400?'营业额达到 400':'';
 if(key==='warehouse')return !BASE_IDS.every(id=>s.goods[id].unlocked)?'先开售全部 6 种商品':s.stats.revenue<2500?'营业额达到 2,500':'';
 if(key==='flower'&&!s.goods.flower.unlocked)return '升至 4 星自动开放';
 if(PRODUCTS[key]?.north&&!s.expansions.north)return '先扩建北侧工坊';
 if(STAFF[key]?.needs&&!s.goods[STAFF[key].needs].unlocked)return '先开售'+products[STAFF[key].needs].name;
 if(key==='research'&&!s.expansions.warehouse)return '先建配送仓库';
 if(key==='storage'&&!s.expansions.warehouse)return '先建配送仓库';
 return '';
}
export function purchaseInfo(s,key){
 let cost,name,done=false;
 if(key==='north'){cost=900;name='北侧工坊';done=s.expansions.north;}
 else if(key==='warehouse'){cost=2600;name='配送仓库';done=s.expansions.warehouse;}
 else if(key==='bag'||key==='speed'){const lv=s.upgrades[key];cost=(key==='bag'?90:110)*(lv+1)**2;name=key==='bag'?'搬运容量':'轻快脚步';done=lv>=4;}
 else if(key==='research'){cost=1800*(s.upgrades.research+1);name='经营研修';}
 else if(key==='storage'){cost=Math.round(950*((s.storageLevel||0)+1)**1.6);name='周转仓扩容';}
 else if(key.startsWith('staff:')){const id=key.slice(6),lv=s.staffLevels[id];cost=lv?Math.round(STAFF[id].cost*(1+lv*.75)):STAFF[id].cost;name=STAFF[id].name;done=lv>=4;}
 else {const p=productsFor(s)[key],g=s.goods[key];cost=g.unlocked?Math.round(180*p.price/10*(g.level+1)**1.6):p.cost;name=g.unlocked?p.name+'陈列升级':'开售'+p.name;done=g.unlocked&&g.level>=3;}
 const reason=lockedReason(s,key.startsWith('staff:')?key.slice(6):key);
 return {key,name,cost,remaining:Math.max(0,cost-(s.investments[key]||0)),done,reason};
}
export const PAD_DEFS=[{key:'egg',pos:[-6.1,-6.4]},{key:'eggplant',pos:[-6.1,1.7]},{key:'north',pos:[0,-3.5]},{key:'bread',pos:[4.5,-18.8]},{key:'juice',pos:[12,-18.8]},{key:'warehouse',pos:[16.3,-5]}];
