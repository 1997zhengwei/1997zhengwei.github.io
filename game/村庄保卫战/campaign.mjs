export const TOTAL_NIGHTS=20, MAX_LEVEL=5;
export const WORLD={minX:-17,maxX:17,minZ:-18,maxZ:17};
export const BELL={x:0,z:4.8,max:240};
export const DISTRICTS={
  village:{name:'Village',short:'HOME',x:0,z:1,width:28,unlock:1},
  north:{name:'North ridge',short:'NORTH',x:0,z:-9,width:25,unlock:6},
  east:{name:'East approach',short:'EAST',x:8,z:-2,width:25,unlock:6},
  west:{name:'West approach',short:'WEST',x:-8,z:1,width:25,unlock:6},
  south:{name:'South meadow',short:'SOUTH',x:0,z:10,width:25,unlock:11}
};
export const LANES=[
  {name:'North road',short:'N',points:[[0,-19],[0,-14],[0,-10.6],[0,-7.5],[0,-3.7],[0,.8],[0,4.1]],wall:'north-gate',walls:['north-outergate','north-gate']},
  {name:'East road',short:'E',points:[[18,-5],[14,-4.6],[11,-4.1],[8,-3.3],[5.3,.8],[2.7,3.4],[.7,4.8]],wall:'east-gate',walls:['east-outergate','east-gate']},
  {name:'West road',short:'W',points:[[-18,-1],[-14,-1],[-11.5,-.5],[-9,.1],[-5.6,3.8],[-2.7,5.2],[-.7,4.8]],wall:'west-gate',walls:['west-outergate','west-gate']},
  {name:'South road',short:'S',points:[[0,18],[0,14.5],[0,10.6],[0,7.3],[0,5.6]],wall:'south-gate',walls:['south-gate']}
];
const site=(id,name,type,x,z,district='village',unlock=1,lane)=>({id,name,type,x,z,district,unlock,...(lane===undefined?{}:{lane})});
export const SITES=[
  site('northwatch','Northwatch','tower',-2.6,-1.7,'village',1,0),
  site('eastwatch','Eastwatch','tower',3.4,1.5,'village',1,1),
  site('westwatch','Westwatch','tower',-3.5,2,'village',1,2),
  site('bellwatch','Bellwatch','tower',3.1,5.8,'village',1,1),
  site('north-gate','North barricade','wall',0,-3.7,'village',1,0),
  site('east-gate','East barricade','wall',5.3,.8,'village',1,1),
  site('west-gate','West barricade','wall',-5.6,3.8,'village',1,2),
  site('wheat-field','Wheat field','farm',4.4,8.2),
  site('pumpkin-patch','Pumpkin patch','farm',-3.2,8.4),
  site('golem-yard','Golem yard','golem',-3.3,4.7),
  site('smithy','Village forge','forge',3.7,-5.8),
  site('north-ridge','Ridge watch','tower',-2.8,-8.6,'north',6,0),
  site('east-ridge','East outpost','tower',8.8,-4,'east',6,1),
  site('west-ridge','West outpost','tower',-9.2,-.1,'west',6,2),
  site('north-outergate','Ridge barricade','wall',0,-10.6,'north',6,0),
  site('east-outergate','East outer barricade','wall',11,-4.1,'east',6,1),
  site('west-outergate','West outer barricade','wall',-11.5,-.5,'west',6,2),
  site('meadow-field','Meadow farm','farm',6.4,12.3,'south',6),
  site('southwatch','Meadow watch','tower',2.2,8.2,'south',11,3),
  site('south-gate','South barricade','wall',0,10.6,'south',11,3),
  site('south-yard','Meadow golem yard','golem',-4.3,10.1,'south',11),
  site('ridge-yard','Ridge golem yard','golem',4.9,-11.3,'north',16),
  {...site('south-ridge','South ridge watch','tower',-3,14.2,'south',16,3),exposed:true}
];
export const OBSTACLES=[
  {x:-6.5,z:-7,w:3.2,d:3},{x:6.8,z:-7.4,w:3.5,d:3.1},
  {x:-8,z:7.8,w:2.7,d:3},{x:7.6,z:8,w:2.8,d:3},
  {x:-10.5,z:-12.6,w:3.1,d:3},{x:10.8,z:-12.2,w:3.3,d:3.1},
  {x:-10.3,z:13.2,w:3,d:3},{x:11.6,z:12.9,w:3,d:2.8}
];
export const MOBS={
  zombie:{name:'Zombie',hp:32,speed:1.18,damage:9,period:1.25,range:1.05,score:10},
  skeleton:{name:'Skeleton',hp:27,speed:1.02,damage:8,period:2.1,range:6.1,score:15},
  creeper:{name:'Creeper',hp:29,speed:1.38,damage:48,period:1,range:1.35,score:20},
  spider:{name:'Spider',hp:28,speed:2.05,damage:7,period:.95,range:1.15,score:18},
  armored:{name:'Armored zombie',hp:155,speed:.88,damage:19,period:1.45,range:1.25,score:80},
  ravager:{name:'Ravager',hp:540,speed:.82,damage:34,period:1.7,range:1.65,score:250}
};
const pack=(type,count,lane,at=0)=>({type,count,lane,at});
// Hand-authored composition and staggered reinforcements; no run-time difficulty lottery.
export const WAVES=[
  [pack('zombie',8,0)],
  [pack('zombie',6,0),pack('zombie',5,1,2)],
  [pack('zombie',7,2),pack('skeleton',3,0,2),pack('creeper',3,1,5)],
  [pack('zombie',8,1),pack('skeleton',5,2,3),pack('creeper',4,0,7)],
  [pack('zombie',9,0),pack('zombie',6,2,2),pack('skeleton',5,1,5),pack('armored',1,0,14)],
  [pack('zombie',9,1),pack('skeleton',6,0,3),pack('creeper',5,2,8),pack('zombie',5,2,12)],
  [pack('spider',8,2),pack('zombie',8,0,3),pack('skeleton',6,1,6),pack('creeper',4,0,12)],
  [pack('spider',9,1),pack('zombie',9,2,2),pack('skeleton',7,0,6),pack('creeper',4,2,14)],
  [pack('zombie',10,0),pack('spider',10,2,3),pack('skeleton',8,1,7),pack('creeper',5,0,15)],
  [pack('zombie',12,1),pack('skeleton',8,2,3),pack('spider',8,0,5),pack('creeper',6,1,13),pack('armored',2,2,18)],
  [pack('zombie',10,3),pack('spider',10,0,3),pack('skeleton',8,2,7),pack('creeper',6,1,12),pack('zombie',5,3,20)],
  [pack('spider',12,3),pack('zombie',10,2,3),pack('skeleton',10,1,7),pack('creeper',7,0,13),pack('armored',2,3,20)],
  [pack('zombie',12,0),pack('spider',12,1,2),pack('skeleton',10,3,7),pack('creeper',8,2,13),pack('armored',2,0,22)],
  [pack('spider',13,2),pack('zombie',13,3,2),pack('skeleton',11,0,7),pack('creeper',9,1,14),pack('armored',2,3,24)],
  [pack('zombie',14,0),pack('spider',12,3,2),pack('skeleton',12,1,7),pack('creeper',9,2,15),pack('armored',3,0,22),pack('ravager',1,3,27)],
  [pack('spider',16,0),pack('zombie',15,2,3),pack('skeleton',13,3,8),pack('creeper',10,1,16),pack('armored',3,2,24)],
  [pack('zombie',16,3),pack('spider',16,1,2),pack('skeleton',14,2,7),pack('creeper',11,0,16),pack('armored',4,3,25)],
  [pack('spider',18,2),pack('zombie',17,0,2),pack('skeleton',15,1,8),pack('creeper',11,3,17),pack('armored',4,0,25),pack('ravager',1,2,31)],
  [pack('zombie',18,1),pack('spider',19,3,2),pack('skeleton',16,0,8),pack('creeper',12,2,17),pack('armored',4,1,26),pack('ravager',1,3,32)],
  [pack('zombie',20,0),pack('spider',20,3,2),pack('skeleton',18,2,8),pack('creeper',14,1,18),pack('armored',5,0,26),pack('ravager',1,2,33),pack('ravager',1,3,38)]
];
const names=['First footsteps','Two roads','Hissing in the dark','Crossfire','The first siege','Beyond the walls','Eight-legged scouts','The fast flank','Three-front pressure','The iron siege','A southern breach','Meadow rush','Split the defenses','Four roads burn','The ravager siege','No quiet road','The long watch','Heavy footsteps','Before the final dawn','The last stand'];
export function raidDetails(night){const stage=Math.floor((night-1)/5),siege=night%5===0;return{name:names[night-1],stage,siege,chapter:['Village watch','Outer defenses','Four-front siege','The last stand'][stage],spacing:Math.max(.62,1.04-(night-1)*.018)};}
export function enemyStats(type,night){const base=MOBS[type];return{...base,hp:Math.ceil(base.hp*(1+(night-1)*.115)),damage:Math.round(base.damage*(1+(night-1)*.035)),speed:base.speed*(1+Math.min(.22,(night-1)*.011))};}
