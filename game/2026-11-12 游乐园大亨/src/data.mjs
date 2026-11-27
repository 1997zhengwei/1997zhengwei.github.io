export const VERSION='0.3.2';
export const RIDES=[
 {id:'carousel',name:'云朵旋转木马',short:'旋转木马',tag:'童话花园',color:'#f486ae',cost:0,ticket:18,capacity:8,duration:21,x:-18,z:11,w:18,d:18,height:12,appeal:1,description:'金色木马轻轻起伏，坐在旋转的糖果屋檐下，绕花园兜一圈。'},
 {id:'ship',name:'海盗湾大摆船',short:'海盗船',tag:'海盗港湾',color:'#f5aa47',cost:650,ticket:28,capacity:6,duration:27,x:18,z:12,w:18,d:20,height:16,appeal:1.4,description:'从轻轻摇晃，到掠过树梢的大幅摆荡。抓紧压杆，迎着海风出发！'},
 {id:'wheel',name:'海风之眼摩天轮',short:'摩天轮',tag:'海岸天际线',color:'#64c7d1',cost:1450,ticket:42,capacity:12,duration:40,x:-19,z:-19,w:19,d:20,height:25,appeal:1.8,description:'独立吊舱始终保持水平。慢慢升到最高点，把整座岛屿尽收眼底。'},
 {id:'coaster',name:'逐浪飞龙过山车',short:'过山车',tag:'极速海岸',color:'#f26b55',cost:3200,ticket:68,capacity:8,duration:30,x:20,z:-23,w:33,d:34,height:21,appeal:2.6,description:'链条缓缓爬升，随后连续俯冲、掠海转弯。三节列车沿真实轨道行驶。'},
 {id:'cups',name:'糖果旋转杯',short:'旋转杯',tag:'糖果花园',color:'#ee89b6',cost:2600,ticket:48,capacity:8,maxSeats:12,duration:26,x:-65,z:13,w:24,d:22,height:8,appeal:1.9,description:'坐进有金边和彩色杯柄的大茶杯，大转盘与小茶杯交错旋转，和朋友一起兜风。'},
 {id:'bumpers',name:'霓虹碰碰车',short:'碰碰车',tag:'电光俱乐部',color:'#60c6cf',cost:4200,ticket:72,capacity:6,maxSeats:10,duration:30,x:65,z:13,w:28,d:24,height:9,appeal:2.5,description:'十辆彩色电光车在围场里转向与软碰反弹。亲自坐进车里，看看下一秒会遇上谁。'},
 {id:'swing',name:'星空飞椅',short:'飞椅',tag:'星光飞行湾',color:'#bd9bdf',cost:5600,ticket:85,capacity:8,maxSeats:12,duration:32,x:-65,z:-23,w:24,d:26,height:21,appeal:2.8,description:'彩色飞椅升到半空，吊链随着旋转向外展开。迎着海风，飞过花园与城堡。'},
 {id:'drop',name:'云霄跳楼机',short:'跳楼机',tag:'失重天际线',color:'#65b6dc',cost:7800,ticket:110,capacity:8,maxSeats:12,duration:27,x:65,z:-23,w:22,d:26,height:35,appeal:3.2,description:'缓缓升至塔顶，悬停数秒再迅速落下，最后柔和回弹。勇敢尝试海岛最高的乘坐体验！'}
];
export const RIDE_BY_ID=Object.fromEntries(RIDES.map(r=>[r.id,r]));
export const GOALS=[
 {id:'first',name:'第一声欢呼',detail:'接待 8 人次乘坐',target:8,key:'rides',reward:260},
 {id:'two',name:'海盗湾开张',detail:'拥有 2 座营业设施',target:2,key:'built',reward:360},
 {id:'busy',name:'人气小乐园',detail:'累计接待 50 人次乘坐',target:50,key:'rides',reward:550},
 {id:'three',name:'点亮天际线',detail:'拥有 3 座营业设施',target:3,key:'built',reward:750},
 {id:'coast',name:'全岛尖叫时刻',detail:'建成逐浪飞龙过山车',target:1,key:'coaster',reward:1100},
 {id:'happy',name:'欢乐地标',detail:'累计接待 250 人次乘坐',target:250,key:'rides',reward:1600},
 {id:'five',name:'欢乐向两翼延伸',detail:'拥有 5 座营业设施',target:5,key:'built',reward:1400},
 {id:'six',name:'海岛游玩一整天',detail:'拥有 6 座营业设施',target:6,key:'built',reward:1800},
 {id:'eight',name:'八星梦幻乐园',detail:'拥有 8 座营业设施',target:8,key:'built',reward:2600},
 {id:'thousand',name:'欢笑不打烊',detail:'累计接待 1000 人次乘坐',target:1000,key:'rides',reward:3200}
];
export const SERVICE_DEFS=[
 {id:'gate',name:'入口与停车场',desc:'减少入园间隔，提高园内人数上限',base:220,color:'#70bfea'},
 {id:'staff',name:'设施运营团队',desc:'缩短上客时间，自动整理长队',base:300,color:'#a992eb'},
 {id:'food',name:'海风冰淇淋屋',desc:'每位游客离园前消费，提高满意度',base:260,color:'#f59ebc'},
 {id:'garden',name:'花园与休息区',desc:'提高排队耐心，增加园区吸引力',base:240,color:'#7ac797'}
];
export const UPGRADE_LIMIT=20;
export const price=(n)=>Math.floor(n).toLocaleString('en-US');
export function rideStats(def,state){const l=state?.level||1;return {ticket:Math.round(def.ticket*(1+(l-1)*.24)),capacity:Math.min((def.maxSeats||{carousel:12,ship:10,wheel:16,coaster:12}[def.id]),def.capacity+Math.floor((l-1)/2)*2),duration:def.duration,upgrade:Math.ceil((120+def.cost*.22)*Math.pow(1.48,l-1)),queueCap:18+Math.floor((l-1)/3)*4};}
export function serviceCost(def,level){return Math.ceil(def.base*Math.pow(1.75,level));}
