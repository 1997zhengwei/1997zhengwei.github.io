export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const randomFor=seed=>()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
export const ITEMS={
 plate:{name:'搪瓷餐盘',chapter:0,color:'#fff8e4',volume:.7,height:.05},
 candy:{name:'彩纸糖果',chapter:0,color:'#ff4785',volume:.8,height:.65},
 berry:{name:'草莓',chapter:0,color:'#f03a4f',volume:1,height:.85},
 orange:{name:'小橘子',chapter:0,color:'#ff9a20',volume:1,height:1},
 dice:{name:'游戏骰子',chapter:0,color:'#fff3d7',volume:1.1,height:.9},
 block:{name:'彩虹积木',chapter:0,color:'#11a9dc',volume:1.1,height:1},
 pencil:{name:'彩色铅笔',chapter:0,color:'#f9c447',volume:.65,height:.3},
 donut:{name:'草莓甜甜圈',chapter:0,color:'#ff5ca8',volume:.9,height:.45},
 duck:{name:'小黄鸭',chapter:0,color:'#ffda19',volume:1,height:.85},
 cup:{name:'搪瓷茶杯',chapter:1,color:'#11b9c6',volume:1.1,height:.95},
 book:{name:'故事书',chapter:1,color:'#eb4e3b',volume:.9,height:.3},
 toycar:{name:'玩具小汽车',chapter:1,color:'#ffba1f',volume:1.1,height:.65},
 ball:{name:'条纹皮球',chapter:1,color:'#389de9',volume:1,height:1},
 plant:{name:'小盆栽',chapter:1,color:'#38b74d',volume:1.2,height:1},
 bear:{name:'泰迪熊',chapter:1,color:'#c77a3f',volume:1.1,height:1},
 chair:{name:'木头椅子',chapter:1,color:'#d48c39',volume:1.25,height:1},
 lamp:{name:'蘑菇台灯',chapter:1,color:'#f5483f',volume:1.1,height:1},
 bin:{name:'街角垃圾桶',chapter:2,color:'#179caa',volume:1.2,height:1},
 bush:{name:'圆圆灌木',chapter:2,color:'#7ac62d',volume:1,height:.85},
 bench:{name:'公园长椅',chapter:2,color:'#c77b34',volume:1.2,height:.65},
 scooter:{name:'小摩托',chapter:2,color:'#f153a0',volume:1.3,height:.7},
 car:{name:'街头汽车',chapter:2,color:'#2795e8',volume:1.5,height:.65},
 van:{name:'冰淇淋餐车',chapter:2,color:'#ffda49',volume:1.5,height:.95},
 tree:{name:'糖果树',chapter:2,color:'#35a942',volume:1.3,height:1},
 house:{name:'彩色小屋',chapter:2,color:'#ffdf79',volume:1.7,height:1},
 planet:{name:'口袋小星球',chapter:0,color:'#26b3c9',volume:1.1,height:1,rare:true},
 rocket:{name:'太空小火箭',chapter:1,color:'#fa6557',volume:1.2,height:1,rare:true},
 gramophone:{name:'野餐留声机',chapter:2,color:'#eeb72d',volume:1.3,height:1,rare:true}
};
export const ITEM_COUNT=Object.keys(ITEMS).length;
export const CHAPTER_ITEMS=[0,1,2].map(chapter=>Object.keys(ITEMS).filter(type=>ITEMS[type].chapter===chapter));
export const COURSE_POOLS={sunny:[['candy','berry','orange','donut','duck'],['cup','book','plant','lamp','chair'],['bush','bench','car','house','tree']],playdate:[['dice','block','pencil','duck','candy'],['toycar','ball','bear','chair','book'],['bin','scooter','van','house','tree']],golden:[['berry','candy','donut','dice','orange'],['cup','plant','lamp','bear','toycar'],['van','car','bush','bench','scooter']]};
export const CHAPTERS=[{id:'table',name:'桌面奇遇',subtitle:'糖果也能成为一整个世界',color:'#f3ba73'},{id:'room',name:'玩具大逃亡',subtitle:'那些大东西，现在也可以卷走了',color:'#75c9bc'},{id:'town',name:'小镇卷卷日',subtitle:'把热闹的街道，滚成你的收藏',color:'#e394a0'}];
export const COURSES=[{id:'sunny',name:'晴日出走',tag:'温暖木桌 · 玩具长廊 · 彩色小镇',seed:314,color:'#df865c',accent:'#65b8ac',sky:'#a6d7e5',souvenir:'planet'},{id:'playdate',name:'玩具巡游',tag:'积木小径 · 起伏飞跃 · 玩具街区',seed:818,color:'#a18ec1',accent:'#f1ba76',sky:'#c3dfe9',souvenir:'rocket'},{id:'golden',name:'落日野餐',tag:'甜点派对 · 绿意花园 · 夕阳市集',seed:975,color:'#b9bd73',accent:'#e88d85',sky:'#f0cfb3',souvenir:'gramophone'}];
export const LOOKS=[{id:'citrus',name:'柠檬小旅人',color:'#ffce25',accent:'#22b769',price:0},{id:'soda',name:'薄荷苏打',color:'#1bbdc4',accent:'#f6d980',price:120},{id:'berry',name:'草莓奶昔',color:'#f04f91',accent:'#ffe9b1',price:240},{id:'violet',name:'星野紫罗兰',color:'#935ce8',accent:'#c7e0d3',price:380},{id:'sunset',name:'蜜桃晚霞',color:'#ff814b',accent:'#c2c1e9',price:560},{id:'royal',name:'日光收藏家',color:'#f0bb23',accent:'#fff3c6',price:850}];
export const NAMES=['你','糖糖','卷心菜','小橘子','阿饼','慢吞吞'];
export const COLORS=['#ffce25','#e995a6','#78b8c8','#ad9acb','#edaa72','#8db58f'];

export const ITEM_STORIES={
 plate:'桌边的餐盘，现在也能卷进滚团，成为收藏。',
 candy:'第一颗小糖果，也能成为卷走整条街的开始。',berry:'把草莓的红色，藏进今天的滚团里。',orange:'圆滚滚的小橘子，好像也在和你一起旅行。',dice:'这一次，往前滚的运气掌握在自己手里。',block:'一块积木，就能拼出一小段彩色世界。',pencil:'桌上的小铅笔，画出了比想象更长的路。',donut:'甜甜圈中间的洞，也被一起带走了吗？',duck:'今天的小黄鸭，没有待在浴缸里。',
 cup:'茶喝完以后，杯子也能跟着出发。',book:'书里的大冒险，这次滚到了书外。',toycar:'小时候推着跑的小车，现在黏在球上一起跑。',ball:'再圆的皮球，也会变成滚团的一部分。',plant:'给越滚越大的旅程，添一点小小的绿意。',bear:'把最熟悉的玩伴，也带进这个大世界。',chair:'刚出发时的大椅子，后来只是一个小装饰。',lamp:'小蘑菇一样的灯，照亮了一点奇怪的想象。',
 bin:'连街角的小东西，也值得留个位置。',bush:'一团绿意，被卷进了更大的一团。',bench:'绕着长椅跑的日子，变成了把长椅卷走的日子。',scooter:'两只小轮子，现在跟着一只大滚团旅行。',car:'当汽车也变小，才发现自己已经走了好远。',van:'冰淇淋餐车，给这趟路留下一点夏天。',tree:'把一棵糖果色的树，种在自己的滚团上。',house:'原来把小屋带走，也只需要再长大一点。',
 planet:'晴日出走的桌面尽头，右侧藏着一颗袖珍星球。',rocket:'玩具巡游的第二站，靠左经过金色跳台，在空中接住它。',gramophone:'落日野餐的市集中，靠右寻找这段带着音乐的旧时光。'
};

// Consistent dimensions: one world unit represents18cm. Repeated objects retain their size.
export const WORLD_METRES=.18;
export const OBJECT_RADII={plate:.90,candy:.13,berry:.22,orange:.24,dice:.15,block:.30,pencil:.45,donut:.29,duck:.30,cup:.50,book:.65,toycar:.75,ball:.85,plant:1.35,bear:1.10,chair:2.40,lamp:1.30,bin:2.20,bush:2.80,bench:4.20,scooter:4.60,car:7.50,van:11.30,tree:9.50,house:13.50};

export const OBJECT_FOOTPRINTS={plate:1.021,candy:1.092,berry:.808,orange:.972,dice:1.394,block:1.267,pencil:1.029,donut:1.020,duck:1.020,cup:1.146,book:1.308,toycar:1.113,ball:1.021,plant:.616,bear:.676,chair:.715,lamp:.740,bin:.838,bush:1.021,bench:1.093,scooter:1.028,car:1.113,van:1.113,tree:.731,house:1.176,planet:.991,rocket:.438,gramophone:.967};
