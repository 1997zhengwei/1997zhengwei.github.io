export const baySize=9;
export const exit={x:0,z:7.38};
const entryCenter=2.75;
export const foyer={bench:[-2.95,5.51,1.75,.64],desk:[2.99,5.40,1.38,.88]};
const bayKey=(col,row)=>col+','+row;
export function zoneAt(room,x,z){
  return room.byCell.get(bayKey(Math.round(x/baySize),Math.round((entryCenter-z)/baySize)));
}
// Bay-relative point: column, row, offset across, offset toward the entrance.
const P=(col,row,dx=0,dz=0)=>[col*baySize+dx,entryCenter-row*baySize+dz];
// Laser across the doorway between two neighbouring bays.
function doorLaser(a,b,on=1.5,off=1.6,phase=0){
  const [ax,az]=P(...a),[bx,bz]=P(...b),x=(ax+bx)/2,z=(az+bz)/2;
  return ax===bx?{a:[x-1.6,z],b:[x+1.6,z],on,off,phase}:{a:[x,z-1.6],b:[x,z+1.6],on,off,phase};
}
const cam=(col,row,dx,dz,a0,a1,period=5,phase=0)=>({at:P(col,row,dx,dz),a0,a1,period,phase});

const maps=[
  {
    name:'黄金展厅',theme:'sun',sky:['#1d2747','#33406a','#4a5680'],
    bays:[
      [0,0,'接待厅','entry'],[-1,0,'文物展廊','display'],[1,0,'贵宾厅','office'],
      [-1,1,'典藏档案室','archive'],[1,1,'珠宝展室','display'],
      [-1,2,'修复工坊','workshop'],[0,2,'地下金库','vault'],[1,2,'清点室','office']
    ],
    yard:[0,1]
  },
  {
    name:'海盗船舱',theme:'tide',sky:['#10283a','#1c4458','#2c5d70'],
    bays:[
      [0,0,'登船口','entry'],[0,1,'十字甲板','junction'],[-1,1,'缆机舱','workshop'],[1,1,'海关仓','archive'],
      [-1,2,'左舷货舱','freight'],[1,2,'右舷货舱','freight'],
      [-1,3,'海图室','office'],[0,3,'船长密室','vault'],[1,3,'水手舱','display']
    ],
    yard:[0,2]
  },
  {
    name:'发条钟楼',theme:'clock',sky:['#1f1a3c','#352e5e','#4c4377'],
    bays:[
      [0,0,'钟楼门厅','entry'],[1,0,'报时厅','display'],
      [-1,1,'配重间','archive'],[0,1,'上弦廊','junction'],[1,1,'弹簧工坊','workshop'],
      [-1,2,'传动室','workshop'],[0,2,'星轨大厅','rail'],[1,2,'东侧表廊','display'],
      [-1,3,'西回廊','office'],[0,3,'摆锤厅','junction'],[-1,4,'校时室','archive'],[0,4,'塔顶宝库','vault']
    ],
    closed:[[[0,1],[0,2]],[[-1,2],[-1,3]]]
  },
  {
    name:'午夜糖果厂',theme:'candy',sky:['#2a1840','#4a2a63','#6a3d80'],
    bays:[
      [-1,0,'包装车间','freight'],[0,0,'糖果厂门厅','entry'],[1,0,'糖果橱窗','display'],
      [-1,1,'熬糖房','workshop'],[0,1,'搅拌大厅','junction'],[1,1,'配方档案室','archive'],
      [-1,2,'品控室','office'],[0,2,'彩虹传送带','rail'],[1,2,'冷库','freight'],
      [-1,3,'巧克力喷泉','display'],[0,3,'糖果金库','vault'],[1,3,'糖纸工坊','workshop']
    ],
    closed:[[[-1,3],[0,3]],[[1,3],[0,3]]]
  }
];

// Twelve nights: three per map, each adding one new trick.
const nights=[
  {map:0,title:'初次潜入',parSeconds:55,tip:'灯光扫过来时，松开手指躲进箱子。',
    relics:[
      {kind:'scarab',name:'日轮圣甲虫',value:30,at:P(-1,0,1.7,.5),motion:'skitter'},
      {kind:'ruby',name:'沙海红宝石',value:65,at:P(1,1,1,-1.65)},
      {kind:'mask',name:'法老金面',value:95,at:P(0,2,-.52,-2.18)}],
    patrols:[
      {points:[[1.35,2.75],[9,2.75],[9,1.65],[7.9,1.65],[7.9,2.75]],speed:1.35},
      {points:[[-9,1],[-9,-7.8],[-7,-7.8],[-7.3,-5.6],[-9,-5.6]],speed:1.48},
      {points:[[8,-5],[10.6,-5],[10.6,-7.9],[8,-7.9]],speed:1.53},
      {points:[[-3,-15.25],[4.6,-15.25],[1.45,-15.25],[1.45,-13.6],[-3,-13.6]],speed:1.62}]},
  {map:0,title:'双人夜巡',parSeconds:65,tip:'守卫发现可疑的箱子会停下来盯着看——千万别动！',
    relics:[
      {kind:'vase',name:'青花瓷瓶',value:50,at:P(1,0,2.5,-2.4)},
      {kind:'sapphire',name:'星蓝宝石',value:75,at:P(-1,1,2.3,-2.6)},
      {kind:'goldbar',name:'镇馆金砖',value:110,at:P(1,2,2.4,-2.5)}],
    patrols:[
      {points:[[1.4,2.75],[9,2.75],[9,-.2],[9,2.75]],speed:1.45},
      {points:[[-9,1],[-9,-7.8],[-7,-7.8],[-7.3,-5.6],[-9,-5.6]],speed:1.52},
      {points:[[8,-5],[10.6,-5],[10.6,-7.9],[8,-7.9]],speed:1.55},
      {points:[[-9.5,-14.1],[9.5,-14.1]],speed:1.75},
      {points:[[-1.8,-16.6],[1.8,-16.6]],speed:1.1}]},
  {map:0,title:'监控上线',parSeconds:60,tip:'红色扇形是监控探头，它不会累，只会来回扫。',
    relics:[
      {kind:'trophy',name:'冠军金杯',value:70,at:P(-1,2,2.5,-2.5)},
      {kind:'diamond',name:'粉色之心',value:130,at:P(1,1,2.6,-2.5)},
      {kind:'cat',name:'招财金猫',value:95,at:P(0,2,2.2,-2.6)}],
    patrols:[
      {points:[[1.4,2.75],[9,2.75],[9,-.2],[9,2.75]],speed:1.5},
      {points:[[-9,1],[-9,-7.8],[-7,-7.8],[-7.3,-5.6],[-9,-5.6]],speed:1.55},
      {points:[[7.6,-4.6],[10.4,-4.6],[10.4,-7.4],[7.6,-7.4]],speed:1.55},
      {points:[[-9.5,-14.1],[9.5,-14.1]],speed:1.8},
      {points:[[-1.8,-16.6],[1.8,-16.6]],speed:1.2}],
    cameras:[cam(-1,0,-4.05,-3.9,.25,1.35,5),cam(0,2,3.9,-4.0,-1.4,-.2,4.6,1.2)]},
  {map:1,title:'登船',parSeconds:65,tip:'甲板上守卫更多，先摸清巡逻路线。',
    relics:[
      {kind:'pearl',name:'月光海珠',value:40,at:P(0,1,-1.3,1.3)},
      {kind:'compass',name:'船长罗盘',value:75,at:P(-1,2,-.35,-1.45)},
      {kind:'crown',name:'珊瑚王冠',value:110,at:P(0,3,.9,-2.05)}],
    patrols:[
      {points:[[-2,-5.15],[1.6,-5.15],[1.6,-7.6],[-2,-7.6]],speed:1.40},
      {points:[[-9,-8.4],[-9,-16.5],[-7.5,-16.5],[-7.5,-14.5],[-9,-14.5]],speed:1.60},
      {points:[[9,-12.9],[9,-22.7],[10,-22.7],[10,-21],[9,-21]],speed:1.7},
      {points:[[-2,-24.25],[2,-24.25],[2,-22.9],[-2,-22.9]],speed:1.46}]},
  {map:1,title:'激光舱门',parSeconds:70,tip:'激光亮起前会闪烁。躲进箱子，激光就照不到你。',
    relics:[
      {kind:'bottle',name:'瓶中帆船',value:60,at:P(-1,1,2.4,-2.5)},
      {kind:'emerald',name:'人鱼翡翠',value:85,at:P(1,2,2.5,-2.5)},
      {kind:'anchor',name:'黄金船锚',value:130,at:P(0,3,2.3,-2.5)}],
    patrols:[
      {points:[[-2,-5.15],[1.6,-5.15],[1.6,-7.6],[-2,-7.6]],speed:1.45},
      {points:[[-9,-8.4],[-9,-16.5],[-7.5,-16.5],[-7.5,-14.5],[-9,-14.5]],speed:1.62},
      {points:[[9,-12.9],[9,-22.7],[10,-22.7],[10,-21],[9,-21]],speed:1.72},
      {points:[[-2.2,-23.1],[2.2,-23.1]],speed:1.3}],
    lasers:[doorLaser([0,0],[0,1],1.4,1.8,0),doorLaser([0,1],[-1,1],1.6,1.6,.8),doorLaser([0,1],[1,1],1.6,1.6,2.4),
      doorLaser([-1,3],[0,3],1.8,1.4,.3),doorLaser([0,3],[1,3],1.8,1.4,1.9)]},
  {map:1,title:'船长的眼睛',parSeconds:75,tip:'探头加激光：看准节奏，一口气冲过去。',
    relics:[
      {kind:'coffer',name:'海盗金币匣',value:60,at:P(0,1,2.6,-2.6)},
      {kind:'spyglass',name:'黄铜望远镜',value:80,at:P(-1,3,2.4,-2.5)},
      {kind:'skull',name:'水晶骷髅',value:150,at:P(1,3,2.6,-2.5)}],
    patrols:[
      {points:[[-2,-5.15],[1.6,-5.15],[1.6,-7.6],[-2,-7.6]],speed:1.45},
      {points:[[-9,-8.4],[-9,-16.5],[-7.5,-16.5],[-7.5,-14.5],[-9,-14.5]],speed:1.65},
      {points:[[9,-12.9],[9,-22.7],[10,-22.7],[10,-21],[9,-21]],speed:1.75},
      {points:[[-2,-24.25],[2,-24.25],[2,-22.9],[-2,-22.9]],speed:1.5}],
    cameras:[cam(0,1,0,-4.05,-1.1,1.1,6),cam(1,2,4.05,0,-2.2,-.9,5,1)],
    lasers:[doorLaser([-1,1],[-1,2],1.5,1.5,0),doorLaser([1,1],[1,2],1.5,1.5,1.5),
      doorLaser([-1,3],[0,3],1.7,1.5,.5),doorLaser([0,3],[1,3],1.7,1.5,2)]},
  {map:2,title:'上弦',parSeconds:75,tip:'钟楼路线绕，先看小地图找通道。',
    relics:[
      {kind:'key',name:'上弦金钥',value:45,at:P(1,0,-1.45,-.50)},
      {kind:'orb',name:'流动星核',value:90,at:P(0,2,0,-.85),motion:'rail'},
      {kind:'watch',name:'午夜怀表',value:120,at:P(0,4,-1,-2.35)}],
    patrols:[
      {points:[[6,2.75],[10.5,2.75],[10.5,1.75],[6,1.75]],speed:1.47},
      {points:[[-9,-5],[-9,-15.25],[-7.55,-15.25],[-7.55,-13.2],[-9,-13.2]],speed:1.61},
      {points:[[9,-7.5],[9,-15.25],[6.8,-15.25],[6.8,-16.25],[9,-16.25]],speed:1.65},
      {points:[[-1.65,-15.25],[2.1,-15.25],[2.1,-13.7],[-1.65,-13.7]],speed:1.56},
      {points:[[0,-26],[0,-33.25],[1.7,-33.25],[1.7,-31.7],[0,-31.7]],speed:1.61}]},
  {map:2,title:'看门狗',parSeconds:85,tip:'狗看得不远，但耳朵灵。轻推摇杆慢慢走就没有脚步声。',
    relics:[
      {kind:'hourglass',name:'星砂沙漏',value:70,at:P(1,0,2.4,-2.5)},
      {kind:'musicbox',name:'旋转八音盒',value:100,at:P(-1,3,2.4,-2.5)},
      {kind:'gear',name:'黄金齿轮',value:140,at:P(0,4,2.3,-2.5)}],
    patrols:[
      {points:[[6,2.75],[10.5,2.75],[10.5,1.75],[6,1.75]],speed:1.5},
      {points:[[-9,-5],[-9,-15.25],[-7.55,-15.25],[-7.55,-13.2],[-9,-13.2]],speed:1.9,dog:true},
      {points:[[9,-7.5],[9,-15.25],[6.8,-15.25],[6.8,-16.25],[9,-16.25]],speed:1.65},
      {points:[[-1.65,-15.25],[2.1,-15.25],[2.1,-13.7],[-1.65,-13.7]],speed:1.56},
      {points:[[-1.2,-24.25],[-8.6,-24.25]],speed:1.8,dog:true},
      {points:[[0,-26],[0,-33.25],[1.7,-33.25],[1.7,-31.7],[0,-31.7]],speed:1.61}]},
  {map:2,title:'午夜钟声',parSeconds:85,tip:'狗、激光、探头一起上岗。慢慢来，箱子是你最好的朋友。',
    relics:[
      {kind:'amethyst',name:'暮光紫晶',value:110,at:P(1,2,2.5,-2.5)},
      {kind:'cuckoo',name:'布谷鸟钟',value:90,at:P(-1,4,2.4,-2.5)},
      {kind:'astrolabe',name:'星辰星盘',value:160,at:P(0,4,2.3,-2.5)}],
    patrols:[
      {points:[[6,2.75],[10.5,2.75],[10.5,1.75],[6,1.75]],speed:1.55},
      {points:[[-9,-5],[-9,-15.25],[-7.55,-15.25],[-7.55,-13.2],[-9,-13.2]],speed:1.9,dog:true},
      {points:[[9,-7.5],[9,-15.25],[6.8,-15.25],[6.8,-16.25],[9,-16.25]],speed:1.9,dog:true},
      {points:[[-1.65,-15.25],[2.1,-15.25],[2.1,-13.7],[-1.65,-13.7]],speed:1.6},
      {points:[[-1.2,-24.25],[-8.6,-24.25]],speed:1.85,dog:true},
      {points:[[0,-26],[0,-33.25],[1.7,-33.25],[1.7,-31.7],[0,-31.7]],speed:1.65}],
    cameras:[cam(1,1,4.05,-3.9,-1.45,-.25,5)],
    lasers:[doorLaser([0,2],[0,3],1.5,1.7,0),doorLaser([0,3],[0,4],1.5,1.7,1),doorLaser([1,1],[1,2],1.4,1.6,.4)]},
  {map:3,title:'甜蜜金库',parSeconds:85,tip:'金库大门锁着：先找到钥匙卡，门才会打开。',
    relics:[
      {kind:'lollipop',name:'彩虹棒棒糖',value:80,at:P(1,0,2.4,-2.5)},
      {kind:'donut',name:'金箔甜甜圈',value:110,at:P(1,2,2.5,-2.5)},
      {kind:'cake',name:'草莓城堡蛋糕',value:170,at:P(0,3,2.3,-2.5)}],
    key:P(-1,1,2.4,-2.5),gate:[[0,2],[0,3]],
    patrols:[
      {points:[[-1.8,-4.6],[1.8,-4.6],[1.8,-7.9],[-1.8,-7.9]],speed:1.4},
      {points:[[-9,.5],[-9,-15]],speed:1.6},
      {points:[[9,.5],[9,-15]],speed:1.6},
      {points:[[-3,-14],[3,-14]],speed:1.5}],
    cameras:[cam(0,3,-3.9,-4.0,.2,1.3,5)]},
  {map:3,title:'冷库惊魂',parSeconds:95,tip:'钥匙卡藏在冷库后面，狗在那条走廊来回跑。',
    relics:[
      {kind:'bear',name:'软糖熊大王',value:90,at:P(-1,0,2.4,-2.5)},
      {kind:'gumball',name:'七彩扭蛋机',value:120,at:P(-1,3,2.4,-2.5)},
      {kind:'choco',name:'巧克力金币山',value:180,at:P(0,3,2.3,-2.5)}],
    key:P(1,3,2.4,-2.5),gate:[[0,2],[0,3]],
    patrols:[
      {points:[[-1.8,-4.6],[1.8,-4.6],[1.8,-7.9],[-1.8,-7.9]],speed:1.45},
      {points:[[9,-3],[9,-24]],speed:1.9,dog:true},
      {points:[[-9,.5],[-9,-24]],speed:1.7},
      {points:[[-3,-14],[3,-14]],speed:1.55}],
    cameras:[cam(0,1,-4.05,-3.9,.3,1.3,5)],
    lasers:[doorLaser([0,1],[0,2],1.5,1.5,0),doorLaser([-1,2],[-1,3],1.5,1.5,.7)]},
  {map:3,title:'糖果大劫案',parSeconds:95,tip:'找到钥匙卡，打开金库。把糖果王冠带回接应车，赢得「传奇大盗」称号！',
    relics:[
      {kind:'icecream',name:'不化冰淇淋',value:110,at:P(-1,1,2.4,-2.5)},
      {kind:'jar',name:'彩虹糖罐',value:130,at:P(1,1,2.5,-2.5)},
      {kind:'candycrown',name:'糖果王冠',value:240,at:P(0,3,2.3,-2.5)}],
    key:P(-1,3,2.4,-2.5),gate:[[0,2],[0,3]],
    patrols:[
      {points:[[-1.8,-4.6],[1.8,-4.6],[1.8,-7.9],[-1.8,-7.9]],speed:1.5},
      {points:[[9,-3],[9,-24]],speed:2.0,dog:true},
      {points:[[-9,-3],[-9,-24]],speed:2.0,dog:true},
      {points:[[-3,-14],[3,-14]],speed:1.7},
      {points:[[5.5,2.75],[12,2.75]],speed:1.5}],
    cameras:[cam(0,1,-4.05,-3.9,.3,1.3,5),cam(0,3,3.9,-4.0,-1.3,-.2,4.6)],
    lasers:[doorLaser([0,1],[0,2],1.5,1.5,0),doorLaser([-1,2],[-1,3],1.5,1.5,.7),doorLaser([1,2],[1,3],1.5,1.5,1.5)]}
];

// Fixed furniture stays at the room edges. The middle lines connect to the doorways.
const fittings={
  entry:[],junction:[[-2.7,-2.65,1.42,1.08,'station'],[2.85,2.38,1.3,1,'plant']],
  office:[[-2.72,-2.08,1.82,1.22,'station'],[2.72,2.36,1.45,1.10,'file']],
  archive:[[-2.92,-2.18,1.05,3.05,'file'],[2.9,2.10,1.10,2.25,'file']],
  display:[[-2.75,-2.35,1.68,1.30,'exhibit'],[2.73,2.58,1.61,1.17,'exhibit']],
  workshop:[[-2.72,-2.37,1.85,1.20,'exhibit'],[2.78,2.42,1.58,1.1,'station']],
  freight:[[-2.72,-2,1.68,1.72,'cargo'],[2.69,2.10,1.80,1.38,'cargo']],
  vault:[[-2.85,-2.41,1.20,1.10,'cargo'],[2.90,2.35,1.54,1.16,'exhibit']],
  rail:[[-2.9,2.39,1.48,1.16,'exhibit'],[2.85,-2.58,1.40,1.18,'station']]
};
function compile(night,index){
  const config={...maps[night.map],...night,closed:[...(maps[night.map].closed||[])]};
  const bays=config.bays.map(([col,row,name,role])=>({col,row,name,role,x:col*baySize,z:entryCenter-row*baySize}));
  const byCell=new Map(bays.map(b=>[bayKey(b.col,b.row),b])),walls=[],doors=[],props=[],coins=[];
  const pair=(a,b)=>[a.join(','),b.join(',')].sort().join('/');
  const blocked=new Set(config.closed.map(([a,b])=>pair(a,b)));
  const gateKey=night.gate?pair(...night.gate):'';
  let gate=null;
  for(const b of bays){
    for(const [dx,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const other=byCell.get(bayKey(b.col+dx,b.row+dr));
      if(other&&(dx<0||dr<0))continue;
      const isExit=b.role==='entry'&&dr===-1;
      const gap=isExit?2.36:other&&!blocked.has(pair([b.col,b.row],[other.col,other.row]))?3.35:0;
      const x=b.x+dx*baySize/2,z=b.z-dr*baySize/2,vertical=dx!==0;
      const side=other?'inner':dr===1?'back':'outer';
      const segment=(offset,length)=>{
        const rect=vertical?[x,z+offset,.26,length]:[x+offset,z,length,.26];
        walls.push({rect,side});
      };
      if(!gap)segment(0,baySize);
      else{
        const len=(baySize-gap)/2,offset=(baySize+gap)/4;
        segment(-offset,len);segment(offset,len);const door={x,z,vertical,gap,isExit,a:b,b:other};doors.push(door);
        if(other&&pair([b.col,b.row],[other.col,other.row])===gateKey){
          gate={door,rect:vertical?[x,z,.34,gap]:[x,z,gap,.34]};
        }else if(other)coins.push([x,z]);
      }
    }
    for(const [dx,dz,w,d,type] of fittings[b.role])props.push({rect:[b.x+dx,b.z+dz,w,d],type,bay:b});
    if(b.role!=='entry')coins.push([b.x-.55,b.z+.78]);
  }
  const relics=config.relics.map(r=>({...r,x:r.at[0],z:r.at[1]}));
  const bounds={left:Math.min(...bays.map(b=>b.x))-4.5,right:Math.max(...bays.map(b=>b.x))+4.5,
    back:Math.min(...bays.map(b=>b.z))-4.5,front:entryCenter+4.5};
  const lasers=(night.lasers||[]).map(l=>({ax:l.a[0],az:l.a[1],bx:l.b[0],bz:l.b[1],on:l.on,off:l.off,phase:l.phase}));
  // Lasers sit inside doorways, so the coin that would mark that doorway is dropped.
  const freeCoins=coins.filter(([x,z])=>!lasers.some(l=>Math.hypot((l.ax+l.bx)/2-x,(l.az+l.bz)/2-z)<.5));
  return {...config,index,bays,byCell,walls,doors,props,bounds,relics,coins:freeCoins,vault:bays.find(b=>b.role==='vault'),
    solids:[...walls.map(w=>w.rect),...props.map(p=>p.rect),foyer.bench,foyer.desk],
    gate,key:night.key?{x:night.key[0],z:night.key[1]}:null,lasers,
    cameras:(night.cameras||[]).map(c=>({x:c.at[0],z:c.at[1],a0:c.a0,a1:c.a1,period:c.period,phase:c.phase,angle:.36,range:5.2})),
    patrols:config.patrols.map(({points:path,speed,dog},i)=>dog?
      {path,speed,dog:true,angle:.85,range:2.45,hearing:3.6,phase:.65+i*.85}:
      {path,speed,angle:.45,range:4.13,phase:.65+i*.85})};
}
export const rooms=nights.map(compile);
export const mapList=maps.map((m,i)=>({...m,levels:rooms.map((r,k)=>r.map===i?k:-1).filter(k=>k>=0)}));
