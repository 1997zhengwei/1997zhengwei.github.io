export const VERSION='0.5.0';
export const ROOMS=Array.from({length:6},(_,i)=>({id:101+i,x:i%2?8:-8,z:1-Math.floor(i/2)*8,name:['椰风客房','珊瑚客房','晴空客房','海盐客房','日落套房','星湾套房'][i],cost:[0,0,300,460,720,980][i]}));
export const SPOTS={reception:{x:0,z:8.4},supplies:{x:-8.7,z:12.1},pool:{x:15.8,z:-.8},cafe:{x:-19,z:-.5},entry:{x:0,z:15.5}};
export const ITEMS=[
 {id:'cleaner',name:'清洁员 · 阿葵',cost:260,kind:'staff',desc:'自动取毛巾、前往脏房并打扫。你可以专心接待和扩建。'},
 {id:'receptionist',name:'接待员 · 小满',cost:420,kind:'staff',desc:'自动为等候客人办理入住。房间备好，前台就能持续运转。'},
 {id:'pool',name:'海景泳池',cost:1100,kind:'facility',desc:'开放泳池与日光躺椅。住客游泳后额外支付28；记得补充毛巾。'},
 {id:'poolstaff',name:'泳池服务员 · 阿蓝',cost:520,kind:'staff',requires:'pool',desc:'自动往返布草间与泳池，保持干净毛巾充足。'},
 {id:'cafe',name:'落日咖啡吧',cost:1600,kind:'facility',desc:'开放咖啡露台。走到吧台内制作饮品，每位客人额外支付24。'},
 {id:'barista',name:'咖啡师 · 小夏',cost:640,kind:'staff',requires:'cafe',desc:'自动制作咖啡，照顾露台上的客人。'},
 {id:'speed',name:'轻快步伐',cost:150,kind:'owner',desc:'店长移动速度提升25%，补给、清洁与收款更利落。'},
 {id:'capacity',name:'升级布草托盘',cost:200,kind:'owner',desc:'毛巾容量从4条增加到8条，减少补给往返。'},
 {id:'villaCleaner',name:'别墅管家 · 海棠',cost:1800,kind:'staff',requires:'villa',desc:'驻守海景别墅区，独立补给与清洁。'},
 {id:'magnet',name:'房费收集器',cost:1500,kind:'owner',desc:'自动吸附附近的房费。'},
 {id:'boost',name:'服务冲刺',cost:2400,kind:'owner',desc:'解锁持续8秒的工作加速，可反复使用。'}
];
export const GOALS=[
 {name:'迎接第一位住客',desc:'走到前台内侧，自动办理入住',value:s=>s.stats.served,target:1,reward:40},
 {name:'收取第一笔房费',desc:'客人退房后，走近门外的钞票',value:s=>s.stats.collected,target:46,reward:60},
 {name:'让两间客房焕然一新',desc:'带上毛巾，走到脏房的床尾打扫',value:s=>s.stats.cleaned,target:2,reward:80},
 {name:'扩建第三间客房',desc:'经营面板中开放一间新客房',value:s=>s.rooms.filter(r=>r.id<200&&r.built).length,target:3,reward:100},
 {name:'欢迎第一位清洁员',desc:'雇用阿葵，让打扫工作自动进行',value:s=>+s.owned.cleaner,target:1,reward:100},
 {name:'升级一间舒适客房',desc:'把任一客房升级到舒适级',value:s=>s.rooms.filter(r=>r.id<200&&r.tier>=2).length,target:1,reward:120},
 {name:'把海景泳池带到酒店',desc:'开放右侧泳池，提供新的度假体验',value:s=>+s.owned.pool,target:1,reward:160},
 {name:'让咖啡香飘上海风',desc:'建造左侧落日咖啡吧',value:s=>+s.owned.cafe,target:1,reward:220},
 {name:'六间客房全部营业',desc:'完成酒店主楼的客房扩建',value:s=>s.rooms.filter(r=>r.id<200&&r.built).length,target:6,reward:260},
 {name:'打造你的豪华海岛酒店',desc:'拥有6间海景级客房、泳池和咖啡吧',value:s=>s.owned.pool&&s.owned.cafe?s.rooms.filter(r=>r.id<200&&r.tier===3).length:0,target:6,reward:800}
];
export const roomFee=(r,vip=false,studyRank=0)=>Math.round((r.region==='villa'?[0,240,340,470,640,860][r.tier]:[0,46,76,116][r.tier]||46)*(vip?1.5:1)*(1+studyRank*.01));
export const roomUpgradeCost=r=>r.region==='villa'?[0,2400,4800,9600,19200,0][r.tier]:r.tier===1?180:r.tier===2?440:0;
export const tierName=t=>['','清新','舒适','海景'][t];
export const roomSpot=r=>({x:r.x,z:r.z+2.1});
export const moneySpot=r=>({x:Math.sign(r.x)*2.55,z:r.z+.5});
export const rating=s=>Math.min(5,1+(s.rooms.filter(r=>r.id<200&&r.built).length>=4?1:0)+(+s.owned.pool)+(+s.owned.cafe)+(s.rooms.filter(r=>r.id<200&&r.tier===3).length>=4?1:0));
