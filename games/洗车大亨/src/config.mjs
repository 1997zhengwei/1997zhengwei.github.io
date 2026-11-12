export const VERSION='0.3.0';
export const PHASES=[{name:'泡沫',verb:'喷洒泡沫',color:'#ecb5dd',duration:4.2},{name:'冲洗',verb:'高压冲洗',color:'#41d7eb',duration:5.6},{name:'上蜡',verb:'细致上蜡',color:'#ffd367',duration:4.8}];
export const TYPES=[{id:'compact',name:'城市小轿车',w:1.86,l:3.95,h:1.55,pay:64},{id:'sedan',name:'旅行轿车',w:1.96,l:4.6,h:1.52,pay:78},{id:'suv',name:'越野旅行家',w:2.12,l:4.7,h:1.94,pay:98},{id:'sport',name:'流线跑车',w:2.08,l:4.7,h:1.22,pay:120},{id:'van',name:'复古面包车',w:2.1,l:4.9,h:2.2,pay:110},{id:'starlight',name:'星耀 GT 超跑',w:2.08,l:4.7,h:1.26,pay:220,care:'rims'},{id:'obsidian',name:'曜石行政座驾',w:2.1,l:4.85,h:1.5,pay:245,care:'crystal'},{id:'cloud',name:'云境豪华 SUV',w:2.15,l:4.85,h:1.96,pay:270,care:'cabin'}];
export const CARE_DEFS={rims:{name:'轮毂',title:'镜面轮毂精洗',verb:'轮毂精洗',desc:'四只轮毂逐一去渍抛光',duration:5.2,color:'#77e8ff',bonus:.55},crystal:{name:'镀晶',title:'双层镀晶封釉',verb:'双层镀晶',desc:'完成两遍镀晶，锁住镜面光泽',duration:6,color:'#c5a8ff',bonus:.65},cabin:{name:'内饰',title:'内饰蒸汽护理',verb:'蒸汽护理',desc:'前舱、后舱依次蒸汽深度护理',duration:5.6,color:'#8ceac8',bonus:.6}};
export const careFor=c=>c?CARE_DEFS[TYPES[c.type]?.care]||null:null;
export const phaseFor=c=>c?.phase===3?careFor(c)||PHASES[2]:PHASES[c?.phase??0];
export function careStep(c){if(!careFor(c))return '';if(c.phase<3)return '完成三段清洗后，进行专属护理';const p=Math.min(.999,c.progress);return TYPES[c.type].care==='rims'?`正在精洗第 ${Math.floor(p*4)+1} / 4 只轮毂`:TYPES[c.type].care==='crystal'?`第 ${Math.floor(p*2)+1} / 2 遍镀晶封釉`:p<.5?'前舱蒸汽护理':'后舱蒸汽护理';}
export const COLORS=['#1aafb6','#efb92d','#e97155','#478ac8','#8c72ba','#e7e9df','#76ac79','#283e50'];
export const BAY_X=[-7.2,0,7.2];
export const BRANCHES=[{name:'海岸洗车场',short:'海岸店',theme:'coast',price:0,need:0},{name:'棕榈公路站',short:'公路店',theme:'desert',price:4200,need:35},{name:'霓虹汽车会所',short:'夜光店',theme:'night',price:9800,need:85}];
export const UPGRADE_DEFS={pressure:{name:'高压水泵',desc:'亲手作业速度 +28%，喷头覆盖范围增加',icon:'↗',base:160,growth:1.72},price:{name:'护理套餐',desc:'每次洗车基础售价 +20%，车漆护理更值钱',icon:'✦',base:220,growth:1.8},marketing:{name:'沿街招牌',desc:'更多来客，更容易遇到高价车型',icon:'⚑',base:280,growth:1.85}};
export const STYLE_DEFS=[{id:'classic',name:'海盐工作服',cost:0,color:'#197e90',desc:'干净利落的第一套工装',need:0},{id:'sunset',name:'落日赛车服',cost:900,color:'#ef8846',desc:'暖橘拼色 · 护目镜 · 赛车条纹',need:8},{id:'mint',name:'薄荷技师',cost:1800,color:'#69c8a7',desc:'薄荷白套装 · 银色工具腰带',need:18},{id:'royal',name:'金牌主理人',cost:3800,color:'#514785',desc:'深紫金边 · 专属金色喷枪',need:40}];
export function branchDef(id){const b=BRANCHES[id%3];return {...b,name:id<3?b.name:`${b.short} · 第${Math.floor(id/3)+1}商圈`,price:id<3?b.price:Math.round(9800*Math.pow(1.48,id-2)),need:id<3?b.need:85+(id-2)*45};}
export function starCount(washed){return 1+[5,16,35,70].filter(n=>washed>=n).length;}
export function upgradeCost(key,level){const d=UPGRADE_DEFS[key];return Math.round(d.base*Math.pow(d.growth,level)/10)*10;}
export function laneCost(index){return [0,520,1480][index];}
export function workerCost(index){return [250,480,780][index];}
export function machineCost(level){return Math.round(700*Math.pow(1.85,level-1)/10)*10;}
export function contract(n){const count=n===0?3:n===1?8:8+6*(n-1);return {count,reward:n===0?120:Math.min(650,170+n*50),title:n===0?'洗净最初的 3 辆车':n===1?'成为街区的人气洗车店':`第 ${n+1} 份口碑订单`};}
