export const products = {
  coffee: {name:'咖啡机', w:2, h:3, value:279, weight:7, color:'#d1543c', kind:'coffee'},
  audio: {name:'无线耳机', w:3, h:2, value:249, weight:2.6, color:'#4e479c', kind:'audio'},
  perfume: {name:'玻璃香水', w:1, h:3, value:149, weight:1.1, limit:1.35, color:'#ea6998', kind:'bottle'},
  cookies: {name:'黄油饼干', w:2, h:1, value:49, weight:1.15, limit:2.6, color:'#e0a337', kind:'cookies'},
  tea: {name:'冷泡茶盒', w:2, h:1, value:69, weight:.7, color:'#18876e', kind:'tea'},
  cocoa: {name:'可可礼盒', w:1, h:2, value:89, weight:.9, color:'#895036', kind:'cocoa'},
  speaker: {name:'蓝牙音箱', w:2, h:2, value:329, weight:4.2, color:'#2095a9', kind:'speaker'},
  glass: {name:'气泡酒', w:1, h:3, value:219, weight:1.4, limit:1.4, color:'#3b8459', kind:'bottle'},
  candles: {name:'香薰套装', w:3, h:1, value:139, weight:1.9, limit:2.9, color:'#b33f61', kind:'candles'},
  crackers: {name:'芝士脆饼', w:2, h:2, value:79, weight:1.0, limit:1.7, color:'#ef8a3b', kind:'cookies'},
  jam: {name:'莓果酱', w:1, h:2, value:119, weight:1.0, limit:1.6, color:'#8756ac', kind:'jam'},
  camera: {name:'即拍相机', w:3, h:2, value:459, weight:4.6, color:'#db6251', kind:'camera'},
  kettle: {name:'手冲壶', w:2, h:3, value:259, weight:4.8, color:'#327e9c', kind:'kettle'},
  lamp: {name:'蘑菇台灯', w:2, h:3, value:309, weight:2.4, limit:2.3, color:'#dc654e', kind:'lamp'},
  pot: {name:'珐琅锅', w:3, h:2, value:399, weight:6, color:'#8a73c7', kind:'pot'},
  pad: {name:'游戏手柄', w:3, h:1, value:229, weight:1.5, color:'#7869b8', kind:'pad'},
  watch: {name:'运动手表', w:1, h:2, value:189, weight:.55, color:'#f09647', kind:'watch'},
  plant: {name:'多肉盆栽', w:2, h:2, value:129, weight:1.7, limit:1.8, color:'#65a380', kind:'plant'},
  drive: {name:'迷你闪存', w:1, h:1, value:99, weight:.38, color:'#3c9fa9', kind:'drive'},
  thermos: {name:'旅行保温壶', w:1, h:4, value:289, weight:3.3, color:'#d59b4d', kind:'thermos'},
  mug: {name:'猫耳马克杯', w:2, h:2, value:159, weight:1.35, limit:1.35, color:'#e886a7', kind:'mug'},
  plush: {name:'狐狸抱枕', w:2, h:2, value:109, weight:.52, limit:3.55, color:'#e28855', kind:'plush'},
  // 下面三件是「看着大、其实不值」的陷阱货：每格只值 15–21 元
  bigplush: {name:'巨型抱枕', w:3, h:2, value:119, weight:.8, limit:3.8, color:'#c9a0dc', kind:'plush'},
  snackbox: {name:'零食大礼包', w:3, h:2, value:99, weight:1.5, color:'#d8a03a', kind:'tea'},
  chocobox: {name:'巧克力大盒', w:2, h:3, value:109, weight:1.3, color:'#7b4030', kind:'cocoa'},
};

// 第 1 关是教学（全部装得下）；从第 2 关起商品总格数是袋子容量的 110%–125%，必须挑「每格最值钱」的装。
// target / gold 由 tune-levels.mjs 搜索最优装法后按约 66% / 93% 定。
export const levels = [
  {name:'试装一袋', w:6, h:5, target:500, gold:830, items:['coffee','audio','perfume','cookies','tea','cocoa']},
  {name:'精品抢购', w:6, h:5, target:960, gold:1360, items:['coffee','speaker','glass','candles','crackers','jam','audio','cookies','bigplush']},
  {name:'末班福袋', w:7, h:5, target:1210, gold:1700, items:['camera','kettle','speaker','perfume','glass','candles','cookies','jam','chocobox','snackbox']},
  {
    name:'斜肩纸袋', w:6, h:6, tops:[4,6,6,6,6,4], target:1130, gold:1590,
    items:['pot','lamp','speaker','glass','jam','drive','cookies','tea','bigplush','crackers'],
    hint:'矮肩留给小商品', trim:'#a05740', paper:'#dda36d', accent:'#985743', backdrop:'#cfe8ff', glow:'#ffffff',
  },
  {
    name:'抬底手提袋', w:7, h:5, floors:[0,0,1,1,1,0,0], target:1200, gold:1690,
    items:['camera','lamp','kettle','pad','watch','mug','plush','drive','snackbox'],
    hint:'两侧更深，中间底板抬高', trim:'#90609d', paper:'#d9a1b4', accent:'#7e4c92', backdrop:'#e6ddff', glow:'#ffffff',
  },
  {
    name:'窄口抽绳袋', w:6, h:6, tops:[3,5,6,6,5,3], target:1150, gold:1620,
    items:['thermos','camera','audio','lamp','perfume','plant','tea','drive','watch'],
    hint:'长壶可竖放，也能横过来', trim:'#4b8871', paper:'#8ab7a0', accent:'#3b7e72', backdrop:'#cdf3e6', glow:'#ffffff',
  },
  {
    name:'双仓礼袋', w:7, h:5, divider:{column:3,height:3}, target:1370, gold:1940,
    items:['pot','speaker','camera','audio','mug','jam','watch','drive','chocobox','crackers'],
    hint:'大件可搭在隔板上方', trim:'#9c586b', paper:'#e2acb3', accent:'#a04268', backdrop:'#ffdbe6', glow:'#ffffff',
  },
  {
    name:'侧兜帆布袋', w:7, h:6, tops:[3,5,6,6,6,5,4], floors:[1,0,0,0,0,0,1], target:1410, gold:1980,
    items:['pot','thermos','camera','lamp','pad','mug','plush','watch','drive','snackbox'],
    hint:'两边小兜，记得留给零碎', trim:'#95664b', paper:'#ccad77', accent:'#935635', backdrop:'#e6f6c8', glow:'#ffffff',
  },
  {
    name:'黑五压轴袋', w:7, h:6, tops:[3,5,6,6,6,5,4], floors:[0,0,0,1,0,0,1], divider:{column:4,height:2},
    target:1520, gold:2140,
    items:['camera','pot','lamp','thermos','speaker','pad','perfume','watch','drive','plant'],
    hint:'抬底、斜肩和隔板都在', trim:'#ad743c', paper:'#dc9a57', accent:'#964b35', backdrop:'#ffe3c8', glow:'#fffbe8',
  },
];

export function cellOpen(level,x,y) {
  return x>=0&&x<level.w&&y>=(level.floors?.[x]??0)&&y<(level.tops?.[x]??level.h);
}

export function capacity(level) {
  return Array.from({length:level.w},(_,x)=>(level.tops?.[x]??level.h)-(level.floors?.[x]??0))
    .reduce((sum,height)=>sum+height,0);
}

export function size(id, turned) {
  const {w,h}=products[id];
  return turned ? {w:h,h:w} : {w,h};
}

function overlap(a,b) {
  return Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
}

function verticalBounds(level,{x,w}) {
  let floor=0,ceiling=level.h;
  for(let col=x;col<x+w;col++){
    floor=Math.max(floor,level.floors?.[col]??0);
    ceiling=Math.min(ceiling,level.tops?.[col]??level.h);
  }
  const divider=level.divider;
  if(divider&&x<divider.column&&x+w>divider.column)floor=Math.max(floor,divider.height);
  return {floor,ceiling};
}

function restOn(item,stack,height) {
  for(const support of stack){
    if(overlap(item,support))height=Math.max(height,support.y+support.h);
  }
  return height;
}

export function drop(layout, id, turned, x, level) {
  const remaining=settle(layout.filter(item=>item.id!==id),level);
  const entry={id,turned,x,y:0,...size(id,turned),broken:layout.find(item=>item.id===id)?.broken??false};
  if(x<0 || x+entry.w>level.w) return {entry,remaining,layout:null,reason:'edge',ceiling:level.h};
  const {floor,ceiling}=verticalBounds(level,entry);
  entry.y=restOn(entry,remaining,floor);
  if(entry.y+entry.h>ceiling){
    const reason=floor+entry.h>ceiling?'shape':'full';
    return {entry,remaining,layout:null,reason,ceiling};
  }
  const result=[...remaining,entry];
  const broken=applyPressure(result,level);
  return {entry,remaining,layout:result,broken};
}

export function settle(layout,level) {
  const stack=[];
  for(const item of [...layout].sort((a,b)=>a.y-b.y)) {
    const y=restOn(item,stack,verticalBounds(level,item).floor);
    stack.push({...item,y});
  }
  return stack;
}

export function supportContacts(layout,item) {
  return layout.filter(support=>support.y+support.h===item.y && overlap(item,support));
}

export function measurePressure(layout,level) {
  const loads=new Map();
  for(const item of [...layout].sort((a,b)=>b.y-a.y)) {
    const pressure=loads.get(item.id)??0;
    const supports=supportContacts(layout,item);
    let contact=supports.reduce((sum,support)=>sum+overlap(item,support),0);
    if(level){
      for(let col=item.x;col<item.x+item.w;col++) {
        if((level.floors?.[col]??0)===item.y)contact++;
      }
      const wall=level.divider;
      if(wall&&item.y===wall.height&&item.x<wall.column&&item.x+item.w>wall.column) contact+=.5;
    }
    for(const support of supports) {
      const load=(pressure+products[item.id].weight)*overlap(item,support)/contact;
      loads.set(support.id,(loads.get(support.id)??0)+load);
    }
  }
  return loads;
}

export function applyPressure(layout,level) {
  const loads=measurePressure(layout,level),broken=[];
  for(const item of layout){
    const pressure=loads.get(item.id)??0;
    if(!item.broken && pressure>(products[item.id].limit??Infinity)) {
      item.broken=true;
      broken.push(item.id);
    }
  }
  return broken;
}

export function total(layout) {
  return layout.reduce((value,item)=>value+(item.broken?0:products[item.id].value),0);
}
