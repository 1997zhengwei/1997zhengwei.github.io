export let TRACK_ID='grand-tour-v2';
export let COURSE={id:TRACK_ID,name:'云端大奖赛',finish:-374,start:8,width:16,timeLimit:150,
 floors:[
  {id:'start',x:0,z:5,w:16,d:22,y:0,color:'blue'},
  {id:'spin',x:0,z:-24,w:16,d:36,y:0,color:'blue'},
  {id:'push',x:0,z:-61,w:16,d:38,y:0,color:'blue'},
  {id:'approach',x:0,z:-83,w:16,d:6,y:0,color:'yellow'},
  {id:'jump1',x:0,z:-92,w:14,d:8,y:0,color:'blue',openEdges:true},
  {id:'jump2',x:1.4,z:-103,w:11,d:8,y:0,color:'yellow',openEdges:true},
  {id:'jump3',x:-1.4,z:-114,w:11,d:8,y:0,color:'blue',openEdges:true},
  {id:'jump4',x:0,z:-125,w:14,d:8,y:0,color:'yellow',openEdges:true},
  {id:'belt-entry',x:0,z:-133,w:16,d:8,y:0,color:'blue'},
  {id:'conveyor',x:0,z:-164,w:16,d:54,y:0,color:'blue'},
  {id:'fork-entry',x:0,z:-197,w:16,d:12,y:0,color:'yellow'},
  {id:'main-route',x:2.3,z:-230,w:9.2,d:54,y:0,color:'blue'},
  {id:'short1',x:-5.3,z:-209,w:3.8,d:12,y:0,color:'yellow',openEdges:true},
  {id:'short2',x:-5.3,z:-224,w:3.8,d:12,y:0,color:'yellow',openEdges:true},
  {id:'short3',x:-5.3,z:-239,w:3.8,d:12,y:0,color:'yellow',openEdges:true},
  {id:'short4',x:-5.3,z:-253,w:3.8,d:10,y:0,color:'yellow',openEdges:true},
  {id:'last-entry',x:0,z:-265,w:16,d:16,y:0,color:'blue'},
  {id:'gauntlet',x:0,z:-315,w:16,d:84,y:0,color:'blue'},
  {id:'final',x:0,z:-369,w:16,d:24,y:0,color:'blue'}
 ],
 spinners:[
  {id:'spin0',x:-3.6,z:-15,r:3.5,speed:1.15,phase:.1},
  {id:'spin1',x:3.6,z:-26,r:3.5,speed:-1.3,phase:1.5},
  {id:'spin2',x:-3.6,z:-36,r:3.5,speed:1.4,phase:2.2},
  {id:'spin3',x:-3.6,z:-283,r:3.5,speed:-1.65,phase:.9},
  {id:'spin4',x:3.6,z:-302,r:3.5,speed:1.7,phase:1.8},
  {id:'spin5',x:0,z:-322,r:5.2,speed:-1.5,phase:2.2}
 ],
 pushers:[
  {id:'push0',side:-1,z:-49,w:5.5,d:1.6,h:1.5,speed:1.5,phase:0},
  {id:'push1',side:1,z:-60,w:5.5,d:1.6,h:1.5,speed:1.5,phase:1.1},
  {id:'push2',side:-1,z:-72,w:5.5,d:1.6,h:1.5,speed:1.5,phase:2.2},
  {id:'push3',side:1,z:-292,w:5.5,d:1.6,h:1.5,speed:1.9,phase:.3},
  {id:'push4',side:-1,z:-312,w:5.5,d:1.6,h:1.5,speed:1.9,phase:1.6},
  {id:'push5',side:1,z:-334,w:5.5,d:1.6,h:1.5,speed:2,phase:2.5}
 ],
 bumpers:[
  ...[-215,-230,-245].flatMap((z,i)=>[0,4.6].map((x,j)=>({id:`fork-bumper-${i}-${j}`,x,z,r:.78}))),
  ...[-4.5,0,4.5].map((x,i)=>({id:`bumper-${i}`,x,z:-350,r:.8}))
 ],
 hammers:[{id:'hammer0',x:-2,z:-150,length:4.1,speed:1.55,phase:0},{id:'hammer1',x:2,z:-171,length:4.1,speed:1.65,phase:1.4},{id:'hammer2',x:0,z:-341,length:4.1,speed:1.8,phase:2.1}],
 belts:[{id:'fast-left',x:-4.9,z:-164,w:4,d:43,vz:-2.1,color:'#45ddba'},{id:'slow-middle',x:0,z:-164,w:4,d:43,vz:1.6,color:'#ff849f'},{id:'fast-right',x:4.9,z:-164,w:4,d:43,vz:-1.7,color:'#45ddba'},{id:'fork-belt',x:2.3,z:-230,w:8.6,d:50,vz:2,color:'#ff849f'}],
 checkpoints:[{z:7,x:0},{z:-43,x:0},{z:-130,x:0},{z:-192,x:0},{z:-260,x:0},{z:-358,x:0}],
 sections:[{end:-42,name:'旋转广场'},{end:-86,name:'糖果伸缩墙'},{end:-130,name:'云端跳台'},{end:-191,name:'极速传送带'},{end:-258,name:'双路捷径'},{end:-357,name:'决胜机关城'},{end:-382,name:'最后冲刺！'}],
 coins:[...[-8,-40,-80,-133,-190,-263,-359].flatMap((z,i)=>[-4,0,4].map((x,j)=>({id:`coin-${i}-${j}`,x,z,value:5}))),...[-208,-223,-238,-251].map((z,i)=>({id:`shortcut-coin-${i}`,x:-5.3,z,value:8}))]
};
export function sectionName(z){return COURSE.sections.find(s=>z>s.end)?.name??'终点';}
export function hammerPose(o,t){const angle=Math.sin(t*o.speed+o.phase)*.86;return {angle,x:o.x+Math.sin(angle)*o.length,y:5-Math.cos(angle)*o.length,z:o.z};}

const floor=(id,near,far,w=16,x=0,extra={})=>({id,x,z:(near+far)/2,w,d:near-far,y:0,color:'blue',...extra});
const spinner=(id,x,z,r=3.5,speed=1.3)=>({id,x,z,r,speed,phase:z*.13});
const pusher=(id,side,z,speed=1.7)=>({id,side,z,w:5.5,d:1.6,h:1.5,speed,phase:z*.17});
const hammer=(id,x,z)=>({id,x,z,length:4.1,speed:1.65,phase:z*.11});
const belt=(id,x,z,w,d,vx,vz,color)=>({id,x,z,w,d,vx,vz,color:color??(vz<0?'#45ddba':'#ff849f')});
const coins=(rows)=>rows.flatMap((z,i)=>[-4,0,4].map((x,j)=>({id:`coin-${i}-${j}`,x,z,value:5})));
const base={start:8,width:16,timeLimit:150,spinners:[],pushers:[],bumpers:[],hammers:[],belts:[],jets:[],springs:[],winds:[],aiZones:[]};
// The centreline is shared by collision, rendering, AI and camera look-ahead.
export function floorCenter(f,z){
 if(!f?.curve)return f?.x??0;
 const points=f.curve;if(z>=points[0].z)return points[0].x;if(z<=points.at(-1).z)return points.at(-1).x;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(z>=b.z){const t=(a.z-z)/(a.z-b.z);return a.x+(b.x-a.x)*t;}}
 return f.x;
}
export function courseCenter(z){const f=COURSE.floors.find(f=>z<=f.z+f.d/2+.06&&z>=f.z-f.d/2-.06);return floorCenter(f,z);}
const sCurve=(id,near,far,amplitude,w)=>floor(id,near,far,w,0,{curve:Array.from({length:49},(_,i)=>({z:near+(far-near)*i/48,x:Math.sin(i/48*Math.PI*2)*amplitude}))});
const slalom={...base,id:'cloud-serpentine',name:'云海 S 弯',theme:'cloud',tag:'连续 S 弯 · 弯心走线',hint:'提前看弯道，摇杆左右走线；弯后平台可以调整节奏。',accent:'#ff9dce',finish:-320,
 floors:[floor('start',16,-8),sCurve('sweep-a',-8,-140,-10.5,9.4),floor('mid-plaza',-140,-166),sCurve('sweep-b',-166,-262,8.2,9),floor('jump-entry',-262,-270,14),floor('jump-a',-272,-284,12,0,{openEdges:true}),floor('jump-b',-287,-299,12,0,{openEdges:true}),floor('final',-299,-327)],
 spinners:[spinner('s-mid-spin',3.5,-153,3.4,1.4),spinner('s-final-spin',-3.4,-306,3.4,-1.6)],
 pushers:[pusher('s-mid-push',-1,-146,1.45)],
 bumpers:[{id:'s-apex0',x:-10.5,z:-41,r:.7},{id:'s-apex1',x:10.5,z:-107,r:.7},{id:'s-apex2',x:8.2,z:-190,r:.7},{id:'s-apex3',x:-8.2,z:-238,r:.7}],
 checkpoints:[{z:7,x:0},{z:-72,x:-1},{z:-141,x:0},{z:-212,x:1},{z:-263,x:0},{z:-300,x:0}],
 sections:[{end:-74,name:'云海左弯'},{end:-140,name:'彩虹回旋'},{end:-166,name:'弯后机关台'},{end:-214,name:'外环右弯'},{end:-262,name:'回头 S 弯'},{end:-299,name:'云桥接力跳'},{end:-327,name:'弯道王者冲线'}],
 coins:[...[-22,-58,-88,-124,-177,-204,-225,-251].map((z,i)=>({id:`s-coin-${i}`,x:0,z,value:5})),...coins([-141,-263,-300,-316])]
};
for(const coin of slalom.coins){const f=slalom.floors.find(f=>coin.z<=f.z+f.d/2&&coin.z>=f.z-f.d/2);if(f?.curve)coin.x=floorCenter(f,coin.z);}
slalom.distance=Math.round(slalom.start-slalom.finish+slalom.floors.filter(f=>f.curve).reduce((sum,f)=>sum+f.curve.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-f.curve[i].x,p.z-f.curve[i].z),0)-f.d,0));

const neon={...base,id:'neon-foundry',name:'霓虹机巧城',theme:'neon',tag:'交叉传送带 · 连环摆锤',hint:'看箭头选传送带，提前绕开摆锤。',accent:'#b99aff',finish:-330,
 floors:[floor('start',16,-6),floor('gate-hall',-6,-65),floor('cross-belt',-65,-124),floor('speed-hall',-124,-180),floor('jump-entry',-180,-188,14),floor('jump-a',-190,-202,13,0,{openEdges:true}),floor('jump-b',-205,-217,12,1,{openEdges:true}),floor('jump-c',-220,-232,13,0,{openEdges:true}),floor('double-gates',-232,-276),floor('final',-276,-337)],
 spinners:[spinner('n-spin0',0,-59,5),spinner('n-spin1',-3.6,-143),spinner('n-spin2',3.6,-165),spinner('n-spin3',-3.6,-284,3.5,1.8),spinner('n-spin4',3.6,-304,3.5,-1.8)],
 pushers:[pusher('n-push0',-1,-21),pusher('n-push1',1,-36),pusher('n-push2',-1,-50),pusher('n-push3',1,-244),pusher('n-push4',-1,-258),pusher('n-push5',1,-271)],
 hammers:[hammer('n-hammer0',0,-87),hammer('n-hammer1',0,-117),hammer('n-hammer2',0,-293)],
 belts:[belt('n-cross0',0,-76,14,13,2.6,0,'#956ce0'),belt('n-cross1',0,-96,14,13,-2.8,0,'#3abecb'),belt('n-cross2',0,-114,14,13,2.5,0,'#956ce0'),belt('n-fast-left',-4.8,-153,4,49,0,-2.2),belt('n-back',0,-153,4,49,0,1.6),belt('n-fast-right',4.8,-153,4,49,0,-1.8)],
 bumpers:[-4.5,0,4.5].map((x,i)=>({id:`n-bumper${i}`,x,z:-319,r:.8})),
 checkpoints:[{z:7,x:0},{z:-66,x:0},{z:-125,x:0},{z:-181,x:0},{z:-233,x:0},{z:-277,x:0}],
 sections:[{end:-65,name:'机巧门廊'},{end:-124,name:'交叉传送带'},{end:-180,name:'霓虹加速港'},{end:-232,name:'悬空接力桥'},{end:-276,name:'双向重工门'},{end:-340,name:'霓虹决胜圈'}],
 aiZones:[{z1:-179,z2:-125,type:'boost',lanes:[-4.8,4.8]}],coins:coins([-8,-64,-125,-180,-233,-277,-322])
};
const ice={...base,id:'aurora-glacier',name:'极光冰川',theme:'ice',tag:'冰面漂移 · 弹簧飞跃',hint:'冰面要提前转向，蓝色弹簧垫会自动弹起。',accent:'#87f3ee',finish:-304,
 floors:[floor('start',16,-6),floor('ice-plaza',-6,-62,16,0,{surface:'ice'}),floor('wind-bridge',-62,-104,12,0,{surface:'ice',openEdges:true}),floor('launch-a',-104,-116,14),floor('land-a',-122,-138,14,0,{surface:'ice'}),floor('launch-b',-138,-151,14),floor('land-b',-157,-176,14,0,{surface:'ice'}),floor('ice-slalom',-176,-238,16,0,{surface:'ice'}),floor('jump-entry',-238,-246,14),floor('jump-a',-248,-259,12,0,{openEdges:true}),floor('jump-b',-262,-273,12,0,{openEdges:true}),floor('final',-273,-312,16,0,{surface:'ice'})],
 spinners:[spinner('i-spin0',-3.4,-20),spinner('i-spin1',3.4,-39),spinner('i-spin2',-3.4,-55),spinner('i-spin3',3.2,-294,3.8,-1.7)],
 pushers:[pusher('i-push0',-1,-188,1.3),pusher('i-push1',1,-209,1.4),pusher('i-push2',-1,-228,1.3)],
 hammers:[hammer('i-hammer',0,-282)],
 bumpers:[{id:'i-bumper',x:0,z:-82,r:.8}],
 winds:[{z1:-100,z2:-68,vx:.9},{z1:-235,z2:-180,vx:-.6}],
 springs:[{id:'spring-a',x:0,z:-115,w:10,d:1.6,power:14.6},{id:'spring-b',x:0,z:-150,w:10,d:1.6,power:14.6}],
 checkpoints:[{z:7,x:0},{z:-63,x:0},{z:-105,x:0},{z:-170,x:0},{z:-239,x:0},{z:-274,x:0}],
 sections:[{end:-62,name:'冰晶旋转场'},{end:-104,name:'极光侧风桥'},{end:-176,name:'弹簧飞跃谷'},{end:-238,name:'冰面回旋廊'},{end:-273,name:'雪峰连跳'},{end:-315,name:'冰川冲线'}],
 aiZones:[{z1:-176,z2:-102,type:'spring',lanes:[0,0]}],coins:coins([-8,-61,-104,-170,-238,-274,-301])
};
const lava={...base,id:'ember-ruins',name:'熔岩遗迹',theme:'lava',tag:'喷发预警 · 危桥捷径',hint:'琥珀色地圈先预警，火柱升起时从侧面绕开。',accent:'#ffb866',finish:-340,
 floors:[floor('start',16,-6),floor('ember-plaza',-6,-70),floor('stone-a',-72,-85,12,-1.4,{openEdges:true}),floor('stone-b',-88,-101,11,1.4,{openEdges:true}),floor('stone-c',-104,-117,12,0,{openEdges:true}),floor('ruin-hall',-117,-180),floor('fork-entry',-180,-192),floor('main-route',-192,-252,9.2,2.3),floor('short1',-192,-205,3.8,-5.3,{openEdges:true}),floor('short2',-208,-221,3.8,-5.3,{openEdges:true}),floor('short3',-224,-237,3.8,-5.3,{openEdges:true}),floor('short4',-240,-253,3.8,-5.3,{openEdges:true}),floor('ruin-exit',-252,-288),floor('final',-288,-347)],
 spinners:[spinner('l-spin0',-3.6,-17),spinner('l-spin1',3.6,-132),spinner('l-spin2',-3.6,-168),spinner('l-spin3',0,-318,5,-1.5)],
 pushers:[pusher('l-push0',1,-145),pusher('l-push1',-1,-271)],
 hammers:[hammer('l-hammer',0,-297)],
 jets:[...[-30,-48,-64,-335].flatMap((z,i)=>[-4,0,4].map((x,j)=>({id:`jet-${i}-${j}`,x,z,r:1.05,period:3.6,on:.9,warn:1,phase:j*1.15+i*.4}))),...[-151,-175].map((z,i)=>({id:`jet-hall-${i}`,x:0,z,r:1.25,period:3.3,on:1,warn:1,phase:i*.7}))],
 belts:[belt('l-slow',2.3,-222,8.6,55,0,1.8)],
 bumpers:[-207,-222,-237].map((z,i)=>({id:`l-bumper${i}`,x:i%2?4.6:0,z,r:.85})),
 checkpoints:[{z:7,x:0},{z:-69,x:0},{z:-118,x:0},{z:-181,x:0},{z:-254,x:0},{z:-289,x:0}],
 sections:[{end:-70,name:'喷发广场'},{end:-117,name:'浮石连跳'},{end:-180,name:'古城火廊'},{end:-253,name:'熔河双路桥'},{end:-288,name:'遗迹守门关'},{end:-350,name:'余烬冲刺'}],
 aiZones:[{z1:-253,z2:-182,type:'fork',fastX:-5.3,safeX:2.2,fastEnd:-253}],coins:[...coins([-8,-69,-118,-180,-254,-289,-331]),...[-199,-214,-229,-245].map((z,i)=>({id:`l-short-coin-${i}`,x:-5.3,z,value:8}))]
};
COURSE.theme='cloud';COURSE.tag='经典长图 · 多路竞速';COURSE.hint='绿色传送带加速，粉色逆行，左侧窄桥可抄近路。';COURSE.accent='#ffd441';
COURSE.aiZones=[{z1:-189,z2:-134,type:'boost',lanes:[-4.9,4.9]},{z1:-258,z2:-193,type:'fork',fastX:-5.3,safeX:2.2,fastEnd:-258},{z1:-130,z2:-86,type:'jump'}];
export const MAPS=[COURSE,slalom,ice,neon,lava].map(m=>({...base,...m,preview:`assets/maps/${m.id}.png`}));
COURSE=MAPS[0];
export function selectTrack(id){const found=MAPS.find(m=>m.id===id);if(!found)return false;COURSE=found;TRACK_ID=found.id;return true;}
export function jetState(j,time){const cycle=((time+j.phase)%j.period+j.period)%j.period;return {active:cycle<j.on,warning:cycle>=j.period-j.warn,cycle};}
