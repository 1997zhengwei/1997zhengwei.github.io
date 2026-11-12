export const VERSION='0.4.0';
export const SPECIES=[
 {id:'clown',name:'小丑鱼',tag:'珊瑚浅湾',color:'#ff8e37',accent:'#fff3d9',price:22,cost:0,x:-8,z:7,r:3.1,sea:[-5,-8],size:.65,count:20,catch:1.0},
 {id:'tang',name:'蓝吊鱼',tag:'蓝色礁湖',color:'#3594ed',accent:'#ffe760',price:34,cost:180,x:8,z:7,r:3.1,sea:[7,-11],size:.7,count:18,catch:1.2},
 {id:'koi',name:'锦鲤',tag:'流光花园',color:'#fff2d6',accent:'#ff7158',price:52,cost:520,x:-8,z:17,r:3.2,sea:[-12,-17],size:.85,count:16,catch:1.45},
 {id:'butterfly',name:'蝴蝶鱼',tag:'金色珊瑚',color:'#ffe263',accent:'#303e57',price:78,cost:1100,x:8,z:17,r:3.2,sea:[11,-22],size:.75,count:16,catch:1.6},
 {id:'ray',name:'斑点鳐',tag:'翡翠海床',color:'#637dba',accent:'#b9f4ee',price:124,cost:2200,x:-8,z:28,r:3.65,sea:[-11,-29],size:1.25,count:10,catch:2.1},
 {id:'shark',name:'黑鳍礁鲨',tag:'深蓝秘境',color:'#82aebc',accent:'#edfaff',price:186,cost:4200,x:8,z:28,r:3.65,sea:[10,-34],size:1.45,count:9,catch:2.7}
];
export const BY_ID=Object.fromEntries(SPECIES.map(s=>[s.id,s]));
export const UPGRADES={
 bag:{name:'扩容网兜',desc:'每级多装 5 条鱼',base:110,max:10},
 net:{name:'专业渔网',desc:'捕鱼更快，范围更大',base:150,max:8},
 speed:{name:'轻盈脚蹼',desc:'步行与游泳速度提升',base:130,max:8},
 oxygen:{name:'长效气瓶',desc:'每级多潜水 15 秒',base:120,max:8},
 staff:{name:'潜水助手',desc:'亲自下海捕鱼、运回展缸',base:600,max:3},
 visitors:{name:'海岸宣传',desc:'更多顾客，更快来到展馆',base:220,max:8}
};
export const MILESTONES=[
 {id:'first',name:'第一网收获',text:'亲自捕获 5 条鱼',field:'caught',need:5,reward:70},
 {id:'sale',name:'开门红',text:'售出 12 条鱼',field:'sold',need:12,reward:120},
 {id:'two',name:'缤纷水世界',text:'开设 2 个展缸',field:'built',need:2,reward:160},
 {id:'explore',name:'海湾探险家',text:'亲自捕获 50 条鱼',field:'caught',need:50,reward:280},
 {id:'three',name:'人气海洋馆',text:'开设 3 个展缸',field:'built',need:3,reward:350},
 {id:'hundred',name:'源源不断',text:'售出 100 条鱼',field:'sold',need:100,reward:550},
 {id:'five',name:'海洋收藏家',text:'开设 5 个展缸',field:'built',need:5,reward:850},
 {id:'six',name:'海岸之星',text:'开设 6 个营业展缸',field:'built',need:6,reward:1400},
 {id:'empire',name:'蔚蓝大亨',text:'累计营业额达到 30,000',field:'earned',need:30000,reward:2500}
];
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const total=bag=>Object.values(bag).reduce((a,b)=>a+b,0);
export const approach=d=>({x:d.x+(d.x<0?1:-1)*(d.r+1.2),z:d.z});
export const priceFor=(kind,level)=>Math.round(UPGRADES[kind].base*Math.pow(1.7,level));
