export const parts=[
  {key:'reach',name:'臂长',price:28,benefit:'机械臂伸长，可以切到更远的支撑。'},
  {key:'tank',name:'油箱',price:22,benefit:'油箱扩容，本趟和以后每趟都多 16 格油。'},
  {key:'power',name:'动力',price:30,benefit:'单次咬合更有力，硬砖能更快切开。'},
  {key:'size',name:'锯径',price:26,benefit:'锯片变大，每刀能切到更宽的一排砖。'},
];
export const finishes=[
  {name:'工地黄',price:0,arm:'#098de7',blade:'#f42453',body:'#ffbb13'},
  {name:'薄荷汽水',price:85,arm:'#11b594',blade:'#ff7049',body:'#94f3c2'},
  {name:'极夜霓虹',price:160,arm:'#8963e6',blade:'#18e6df',body:'#535da9'},
  {name:'熔岩金',price:260,arm:'#e0a82e',blade:'#ff4a1e',body:'#3b2a2a'},
  {name:'星辰银',price:380,arm:'#c9d6ea',blade:'#7f9cff',body:'#2c3a9a'},
];
export const jobs=[
  {tank:100,anchors:[],mounts:[[7,25,-1]],loot:{coin:5,fuel:0,tnt:1}},
  {tank:92,anchors:[],mounts:[[9,21,-1],[40,24,1]],loot:{coin:5,fuel:1,tnt:1}},
  {tank:84,anchors:[[15,34]],mounts:[[27,21,1]],loot:{coin:5,fuel:1,tnt:2}},
  {tank:78,anchors:[[17,21]],mounts:[[14,23,-1],[29,33,1]],loot:{coin:6,fuel:1,tnt:2}},
  {tank:72,anchors:[[18,16],[30,40]],mounts:[[26,30,1]],loot:{coin:6,fuel:2,tnt:2}},
  {tank:65,anchors:[[12,42],[36,38]],mounts:[[11,28,-1]],loot:{coin:6,fuel:1,tnt:3}},
  {tank:65,anchors:[[12,12],[19,38]],mounts:[[22,33,-1]],loot:{coin:7,fuel:2,tnt:2}},
  {tank:64,anchors:[[12,24],[18,43],[31,14]],mounts:[[9,20,-1]],loot:{coin:7,fuel:2,tnt:3}},
  {tank:66,anchors:[[13,30]],mounts:[[41,26,1]],loot:{coin:7,fuel:2,tnt:2},
    steel:[[9,39,14,52],[34,39,39,52],[21.3,39,26.7,52],[3,13,45,17.4]]},
  {tank:64,anchors:[[9,24]],mounts:[[42,20,1]],loot:{coin:7,fuel:2,tnt:3},place:[['tnt',18.2,43.5],['tnt',29.8,43.5]],
    steel:[[20,36,21.2,50],[22.2,36,23.4,50],[24.6,36,25.8,50],[26.8,36,28,50],[19,38.4,29,39.6]]},
  {tank:84,anchors:[[12,40],[36,40]],mounts:[[8,34,-1]],loot:{coin:7,fuel:2,tnt:3},place:[['tnt',32.2,22.4],['tnt',15.8,22.4]],
    steel:[{ring:[24,22.4,6.3,4.5]}]},
  {tank:84,anchors:[[10.5,36],[37.5,36]],mounts:[[33,12,1]],loot:{coin:8,fuel:2,tnt:3},place:[['tnt',19.4,16.4],['tnt',21,22.8],['tnt',27.6,26.4]],
    steel:[[23.2,13,24.8,20.6],{seg:[24,20,29.8,23.7,1.5]}]},
  {tank:150,anchors:[[10,36],[38,36]],mounts:[[45,27,1]],loot:{coin:8,fuel:2,tnt:2},
    steel:[[17.3,30,19.3,46],[28.7,30,30.7,46]]},
  {tank:138,anchors:[[13,44],[35,44]],mounts:[[6,30,-1]],loot:{coin:8,fuel:2,tnt:3},
    steel:[[9,47.6,39,52]]},
  {tank:148,anchors:[[30,34],[12,30]],mounts:[[40,40,1]],loot:{coin:8,fuel:2,tnt:3},place:[['tnt',24,28.8]],
    steel:[[21,24.4,27,25.8],[20.2,37,21.6,47.4]]},
  {tank:185,anchors:[[10,20],[38,20],[24,48]],mounts:[[6,30,-1],[42,30,1]],loot:{coin:9,fuel:3,tnt:3},place:[['tnt',24,24.4],['tnt',17,33.4]],
    steel:[[12.2,30.2,18.9,31.8],[29.1,30.2,35.8,31.8],[23.2,19.2,24.8,25.9],[23.2,36.1,24.8,42.8],{ring:[24,31,5.2,3.95]}]},
];
export function readGarage(){
  let data;try{data=JSON.parse(localStorage.getItem('shovel-treasure-garage'));}catch{}
  const int=(n,max,fallback=0)=>Number.isSafeInteger(n)?Math.max(0,Math.min(max,n)):fallback;
  const owned=finishes.map((_,i)=>i===0||data?.owned?.[i]===true);
  const skin=int(data?.skin,finishes.length-1);
  return {cash:int(data?.cash,99999999,24),ranks:Object.fromEntries(parts.map(p=>[p.key,int(data?.ranks?.[p.key],MAX_RANK)])),
    owned,skin:owned[skin]?skin:0};
}
export function saveGarage(data){try{localStorage.setItem('shovel-treasure-garage',JSON.stringify(data));}catch{}}
export const MAX_RANK=5;
export const cost=(part,rank)=>Math.round(part.price*[1,1.7,2.6,3.8,5.4][rank]);
export function specs(data,stage){
  const r=data.ranks;
  return {reach:8.8+r.reach*1.32,tank:jobs[stage].tank+r.tank*16,power:1+r.power*.47,
    bite:7+r.power*2,radius:.56+r.size*.095,scale:.91+r.size*.13};
}
