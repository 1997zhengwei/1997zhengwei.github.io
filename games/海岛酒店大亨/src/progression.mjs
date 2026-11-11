export const VILLAS=[
 {id:201,x:-8,z:-44,name:'椰影海景别墅',cost:3200,region:'villa'},
 {id:202,x:8,z:-44,name:'珊瑚花园别墅',cost:4500,region:'villa'},
 {id:203,x:-8,z:-54,name:'日落皇家别墅',cost:6500,region:'villa'},
 {id:204,x:8,z:-54,name:'星湾总统别墅',cost:9000,region:'villa'}
];
export const VILLA_SPOTS={entry:{x:0,z:-38},supplies:{x:-9,z:-38.4},gate:{x:0,z:-20.2}};
export const ESTATE_COST=6000;
export const TITLES=[
 {name:'实习店长',earned:0,description:'从第一位客人开始',outfit:'classic'},
 {name:'新晋店长',earned:1000,description:'解锁蓝金礼服',outfit:'azure'},
 {name:'人气店长',earned:5000,description:'人气门牌与金色徽记'},
 {name:'海岛主理人',earned:20000,description:'解锁白金礼服',outfit:'ivory'},
 {name:'五星总经理',earned:60000,description:'五星门牌与荣耀徽记'},
 {name:'度假村董事长',earned:150000,description:'解锁皇家紫礼服',outfit:'royal'}
];
export const OUTFITS={classic:{name:'经典店长制服',earned:0},azure:{name:'蓝金礼服',earned:1000},ivory:{name:'白金礼服',earned:20000},royal:{name:'皇家紫礼服',earned:150000}};
export const TRAINING_COSTS={
 cleaner:[650,1600,3800,8500],receptionist:[900,2200,5200,11000],poolstaff:[1100,2600,6000,13000],barista:[1300,3000,6800,15000],villaCleaner:[2500,5500,11000,22000],
 pool:[2000,4500,9000,18000],cafe:[2600,5500,11000,22000],speed:[850,2200,5500,12000],capacity:[1000,2600,6200,14000],magnet:[3800,9000],boost:[6000,14000]
};
export const levelOf=(s,id)=>Math.max(0,Math.floor(s.levels?.[id]||0),s.owned?.[id]?1:0);
export const maxItemLevel=id=>1+(TRAINING_COSTS[id]?.length||0);
export const nextItemCost=(s,item)=>levelOf(s,item.id)===0?item.cost:TRAINING_COSTS[item.id]?.[levelOf(s,item.id)-1]??0;
export const titleIndex=s=>TITLES.reduce((rank,t,i)=>s.stats.earned>=t.earned?i:rank,0);
export const careerTitle=s=>TITLES[titleIndex(s)];
export const mainHotelReady=s=>s.rooms.filter(r=>r.id<200&&r.built&&r.tier===3).length===6&&s.owned.pool&&s.owned.cafe;
export const maxRoomTier=r=>r.region==='villa'?5:3;
export const roomTierName=r=>r.region==='villa'?['','海景','花园','豪华','皇家','总统'][r.tier]:['','清新','舒适','海景'][r.tier];
export const ownerCapacity=s=>[4,8,10,12,14,16][Math.min(5,levelOf(s,'capacity'))];
export const ownerSpeed=s=>5.8*[1,1.25,1.38,1.52,1.65,1.8][Math.min(5,levelOf(s,'speed'))];
export const linenInterval=s=>.24/(1+Math.max(0,levelOf(s,'capacity')-1)*.16);
export const staffCapacity=(s,id)=>Math.min(8,4+(Math.max(1,levelOf(s,id))-1)*2);
export const staffSpeed=(s,id)=>(id==='cleaner'?4.6:id==='villaCleaner'?4.9:id==='poolstaff'?5:id==='barista'?4.4:4.2)*(1+.09*Math.max(0,levelOf(s,id)-1));
export const poolCapacity=s=>12+Math.max(0,levelOf(s,'pool')-1)*2;
export const hotelMultiplier=s=>1+Math.max(0,s.studyRank||0)*.01;
export const facilityPayout=(s,id)=>Math.round((id==='pool'?[28,36,46,58,72]:[24,32,42,54,68])[Math.max(0,Math.min(4,levelOf(s,id)-1))]*hotelMultiplier(s));
export const studyCost=s=>Math.round(5000*1.35**Math.min(40,s.studyRank||0));
export const collectionRadius=s=>[1.25,2.5,3.5,4.5][Math.min(3,levelOf(s,'magnet'))];
export const boostActive=s=>(s.boostUntil||0)>s.time;
export function upgradeDescription(s,item){
 const id=item.id,n=levelOf(s,id),next=Math.min(maxItemLevel(id),n+1);
 if(id==='cleaner'||id==='villaCleaner')return `移动 ${staffSpeed(s,id).toFixed(1)} · 携带 ${staffCapacity(s,id)}条 · 打扫 ${(3.5/(1+.2*Math.max(0,n-1))).toFixed(1)}秒。升级会加快工作并增加携带量。`;
 if(id==='receptionist')return `独立办理入住，当前 ${(1.2/(1+.15*Math.max(0,n-1))).toFixed(2)}秒/位。`;
 if(id==='poolstaff')return `自动搬运泳池毛巾，速度 ${staffSpeed(s,id).toFixed(1)}，每次携带${staffCapacity(s,id)}条。`;
 if(id==='barista')return `独立制作咖啡，当前 ${(1.5/(1+.16*Math.max(0,n-1))).toFixed(2)}秒/杯。`;
 if(id==='pool')return `每次消费 ￥${facilityPayout(s,id)} · 毛巾库存 ${poolCapacity(s)}条。升级提高收益与库存。`;
 if(id==='cafe')return `每杯收益 ￥${facilityPayout(s,id)}。升级改善出品效率与收益。`;
 if(id==='speed')return `当前步速 ${(ownerSpeed(s)/5.8*100).toFixed(0)}%。下一档 ${(100*[1,1.25,1.38,1.52,1.65,1.8][next]).toFixed(0)}%。`;
 if(id==='capacity')return `当前容量 ${ownerCapacity(s)}条；下一档 ${[4,8,10,12,14,16][next]}条，同时加快布草补给。`;
 if(id==='magnet')return n?`自动收取附近 ${collectionRadius(s)}米内的房费。`:'靠近房费即可吸附收取，首次范围2.5米。';
 if(id==='boost')return `服务冲刺持续8秒，移动+25%、打扫效率+80%。${n?'当前冷却'+(45-n*5)+'秒；继续升级缩短冷却。':'首次冷却40秒，可反复使用。'}`;
 return item.desc;
}

export const CONTRACTS=[
 {type:'guests',name:'迎来新面孔',stat:'served',target:12,reward:180,unit:'位住客'},
 {type:'clean',name:'焕然一新',stat:'cleaned',target:10,reward:220,unit:'间清洁'},
 {type:'pool',name:'泳池好时光',stat:'poolVisits',target:8,reward:180,unit:'次泳池消费',requires:'pool'},
 {type:'coffee',name:'咖啡飘香',stat:'coffee',target:8,reward:180,unit:'杯咖啡',requires:'cafe'},
 {type:'vip',name:'贵宾到访',stat:'vipServed',target:4,reward:300,unit:'位贵宾'},
 {type:'income',name:'人气营业日',stat:'earned',target:4000,reward:320,unit:'营业额'},
 {type:'villa',name:'海景假期',stat:'villaServed',target:6,reward:700,unit:'位别墅住客',requires:'villa'},
 {type:'villaClean',name:'别墅管家日',stat:'villaCleaned',target:4,reward:450,unit:'间别墅清洁',requires:'villa'}
];
export const contractProgress=(s,c)=>Math.min(c.target,Math.max(0,(s.stats[c.stat]||0)-c.start));
export function makeContract(s,avoid=[]){
 const eligible=CONTRACTS.filter(c=>(!c.requires||(c.requires==='villa'?s.estate.villa:s.owned[c.requires]))&&!avoid.includes(c.type));
 const index=s.contractSerial++,template=eligible[index%eligible.length];
 return {...template,id:index,start:s.stats[template.stat]||0};
}
export function ensureContracts(s){
 if(s.stats.earned<1000)return;
 while(s.contracts.length<3)s.contracts.push(makeContract(s,s.contracts.map(c=>c.type)));
}
