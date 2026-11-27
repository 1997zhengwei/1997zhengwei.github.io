export const FILMS = [
 {id:'moon',name:'星月列车',en:'MOONLIGHT EXPRESS',genre:'family',genreName:'奇幻 · 家庭',color:'#77d9c2',accent:'#ffc875',asset:'moonlight-express.png',cost:0,required:0,boost:1,duration:42,tagline:'下一站，是月亮。'},
 {id:'island',name:'海岛飞翼',en:'ISLAND WINGS',genre:'adventure',genreName:'冒险 · 喜剧',color:'#ffb979',accent:'#5dd3ce',asset:'island-wings.png',cost:680,required:2,boost:1.25,duration:46,tagline:'把勇气，飞成一片海。'},
 {id:'detective',name:'雨夜猫探',en:'RAINY NIGHT DETECTIVE',genre:'mystery',genreName:'悬疑 · 探案',color:'#bd9feb',accent:'#efb972',asset:'rainy-detective.png',cost:1900,required:6,boost:1.55,duration:48,tagline:'每一盏灯后，都有一个秘密。'},
 {id:'moon2',name:'珊瑚奇遇',en:'CORAL KINGDOM',genre:'family',genreName:'家庭 · 海底探险',color:'#55dce3',accent:'#ffdf91',asset:'coral-kingdom.png',cost:6200,required:16,boost:2.05,duration:44,tagline:'潜入海底，遇见会发光的奇迹。',lines:['跟上那群发光的小鱼。','原来，海底也藏着一座城！','最珍贵的宝藏，是一路的朋友。']},
 {id:'island2',name:'逐日飞车',en:'SUNRISE RACERS',genre:'adventure',genreName:'冒险 · 云端竞速',color:'#ffb957',accent:'#98e3ff',asset:'sunrise-racers.png',cost:17000,required:32,boost:2.7,duration:48,tagline:'冲出云端，追上第一束晨光。',lines:['下一道弯，在云层上面！','别松开方向盘，我们能做到。','真正的终点，是一起迎接日出。']},
 {id:'detective2',name:'雪境来信',en:'SNOWBOUND LETTERS',genre:'mystery',genreName:'悬疑 · 雪境探案',color:'#b4d9fc',accent:'#ffdc8b',asset:'snowbound-letters.png',cost:48000,required:65,boost:3.6,duration:50,tagline:'极光亮起，最后一封信正在等你。',lines:['雪地上的脚印，为什么少了一行？','这封信，比钟楼还要古老。','灯亮了，谜底就在这里。']},
];
export const FILM_BY_ID=Object.fromEntries(FILMS.map(f=>[f.id,f]));
export const HALLS=Array.from({length:6},(_,i)=>({id:i,name:['翡翠首映厅','绯红光影厅','星河巨幕厅','蜜桃家庭厅','极光臻享厅','金色殿堂厅'][i],x:i%2===0?-12:12,z:-24*Math.floor(i/2),color:['#4dab67','#399d91','#638fd0','#bc6295','#7e6cc0','#c7a850'][i],wall:['#693e95','#71509e','#65518c','#744e95','#59458b','#68508c'][i],cost:[0,680,3400,12500,42000,125000][i]}));
export const ARCADE_SLOTS=[13.8,16.4,19].map(x=>({x,z:15.6}));
export const STATIONS={tickets:{x:-9,z:23.4},machine:{x:-10,z:16.2},snacks:{x:9,z:18.1}};
export const STAFF={ticket:{name:'售票员',description:'持续接待排队观众，让你专心补货与经营。',cost:300},runner:{name:'小食配送员',description:'从机器取货，再把高高的爆米花送上吧台。',cost:720},cleaner:{name:'保洁员',description:'散场后进入影厅清洁，下一场才能开门。',cost:1100}};
export const TITLES=[{name:'一盏放映灯',earned:0,shows:0,color:'#c5e9de'},{name:'街角好影院',earned:1800,shows:3,color:'#8edbc1'},{name:'满座制造者',earned:10000,shows:12,color:'#80bde9'},{name:'城市电影名片',earned:48000,shows:35,color:'#b79bf1'},{name:'星光造梦师',earned:200000,shows:90,color:'#edb967'},{name:'传奇院线掌舵人',earned:1000000,shows:220,color:'#ffd57b'}];
export const QUESTS=[
 {id:'tickets',name:'今晚，从一张票开始',hint:'走到售票柜台，接待 6 位观众',key:'tickets',goal:6,reward:80},
 {id:'snacks',name:'少不了这一口',hint:'机器取货 → 搬到吧台，售出 5 份爆米花',key:'snacks',goal:5,reward:120},
 {id:'show',name:'第一束放映光',hint:'让首场电影完整放映、自然散场',key:'shows',goal:1,reward:150},
 {id:'staff',name:'让同伴搭把手',hint:'雇佣第一位员工',key:'hires',goal:1,reward:150},
 {id:'hall',name:'一座影城的开始',hint:'解锁第二个影厅',key:'halls',goal:2,reward:280},
 {id:'upgrade',name:'好电影，配好座椅',hint:'完成 6 次设施升级',key:'upgrades',goal:6,reward:300},
];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const UPGRADE_CAPS={carry:16,speed:24,machine:36,marketing:12,arcade:3,seats:6,comfort:100,projector:100};
export const price=(base,level,factor=1.23)=>Math.round(Math.min(9e12,base*Math.pow(factor,Math.min(120,level)))/5)*5;
export function seatsLayout(level=1){const rows=Math.min(6,2+level),cols=4+clamp(level-4,0,2);return{rows,cols,capacity:rows*cols};}
export function seatPosition(hall,index){const {rows,cols}=seatsLayout(hall.seats),row=Math.floor(index/cols),column=index%cols;return{x:HALLS[hall.id].x-(column-(cols-1)/2)*2.05,z:HALLS[hall.id].z+3.7-row*2.02,y:.22+row*.32,row,column};}
export function hallFloor(hall,z){const max=seatsLayout(hall.seats).rows-1,local=HALLS[hall.id].z-z;if(local>6.5)return(.22+max*.32)*clamp((10.7-local)/4.2,0,1);return .22+clamp(Math.floor((local+4.7)/2.02),0,max)*.32;}
export function money(n){if(n>=1e9)return(n/1e9).toFixed(2)+'B';if(n>=1e6)return(n/1e6).toFixed(2)+'M';if(n>=1e4)return(n/1e4).toFixed(2)+'万';return Math.floor(n).toLocaleString('zh-CN');}
