import {Mill} from './mill.mjs';

export const REGIONS = [
  {
    id:'pine', number:'01', name:'松谷锯木厂', area:'松谷林场', product:'松木板', unit:'块',
    card:'原木 → 锯切 → 木板', badge:'锯坊开张', color:'#ff8c3d', grass:'#80c338',
    shaded:'#3f8624', light:'#c5edbc', floor:'#abaebf', roof:'#2b72c3', machine:'#f34c2d',
    belt:'#119ce0', truck:'#f46b2c', forest:['#21883e','#38ac34','#76cf42'], cost:0,
    demand:['林站首单','谷仓修缮','林间栈道','松谷木屋','山线车站'], scale:1, size:12
  },
  {
    id:'river', number:'02', name:'河湾烘干厂', area:'河湾工业带', product:'烘干板', unit:'块',
    card:'毛板 → 循环热风 → 烘干板', badge:'热风掌控', color:'#38c7e8', grass:'#76c654',
    shaded:'#3f8c59', light:'#bbe2e4', floor:'#a3bac8', roof:'#187fb9', machine:'#088fa9',
    belt:'#218df2', truck:'#11aeb1', forest:['#287d64','#3eac66','#92d96c'], cost:240, from:12,
    demand:['河湾地板','滨水木栈','码头改造','湖畔别墅','河湾贸易'], scale:1.72, size:12,
    finish:{id:'kiln',name:'启动热风窑',operator:'窑炉技师',label:'烘干中',building:'HEAT KILN',ratio:1,cap:8,seconds:7.6,base:180,crew:265}
  },
  {
    id:'redwood', number:'03', name:'红杉精刨厂', area:'红杉台地', product:'精刨板', unit:'块',
    card:'毛板 → 精刨打磨 → 家具板', badge:'金纹精刨', color:'#ff9c50', grass:'#c8a94e',
    shaded:'#927542', light:'#edc7a3', floor:'#b0a3ad', roof:'#bc454b', machine:'#de4840',
    belt:'#386ee2', truck:'#e96631', forest:['#a25637','#e18834','#ffb644'], cost:1850, from:48,
    demand:['红杉工坊','长桌订单','家具展陈','红杉设计馆','百货旗舰'], scale:2.9, size:18,
    finish:{id:'plane',name:'启动精刨线',operator:'精刨师傅',label:'精刨中',building:'PLANER',ratio:1,cap:10,seconds:6.4,base:240,crew:420}
  },
  {
    id:'ridge', number:'04', name:'雪岭木构厂', area:'雪岭高原', product:'承重木梁', unit:'根',
    card:'两块毛板 → 压合 → 承重梁', badge:'雪岭栋梁', color:'#a0b2ff', grass:'#e0edf6',
    shaded:'#8db3c6', light:'#dce7fa', floor:'#a7b3d0', roof:'#3e54b0', machine:'#4f57c5',
    belt:'#26bfeb', truck:'#357fdf', forest:['#496e9a','#80b2c5','#d4f1f4'], cost:5600, from:84,
    demand:['雪线支架','滑雪木屋','高山桥梁','极地站房','雪岭体育馆'], scale:5.6, size:18,
    finish:{id:'press',name:'启动压梁机',operator:'木构班长',label:'压梁中',building:'BEAM PRESS',ratio:2,cap:8,seconds:9.1,base:380,crew:680}
  }
];

const saveKey='pine-ridge-empire-v2';
const oldKey='pine-ridge-mill-v1';
const finite=(v,fallback=0)=>Number.isFinite(v)&&v>=0?Math.floor(v):fallback;
const annexRoles=['锯木厂','烘干厂','精刨厂','木构厂'];

export function siteAt(index){
  if(index<REGIONS.length)return REGIONS[index];
  const annex=index-REGIONS.length,role=annex%REGIONS.length;
  const template=REGIONS[role],serial=index+1,number=String(serial).padStart(2,'0');
  return {...template,id:'annex-'+serial,biome:template.id,number,name:number+'号'+annexRoles[role],
    area:'工业园扩建区',cost:7800+4200*annex+460*annex*annex,from:36+6*annex,
    scale:Math.max(2.65,template.scale)*(1.25+.057*annex)};
}

function siteIndex(id){
  const base=REGIONS.findIndex(site=>site.id===id);
  if(base>=0)return base;
  const annex=typeof id==='string'&&/^annex-(\d+)$/.exec(id);
  return annex&&Number.isSafeInteger(Number(annex[1]))&&Number(annex[1])>REGIONS.length?Number(annex[1])-1:-1;
}

export class Company {
  constructor(storage,listener=()=>{}) {
    this.storage=storage;this.listener=listener;this.timer=0;
    const current=this.read(saveKey);
    const data=current?.version===2?current:null;
    const legacy=data?null:this.read(oldKey);
    this.active=data?.active??'pine';
    this.cash=finite(data?.cash??legacy?.cash,85);
    this.sound=(data?.sound??legacy?.sound)!==false;
    this.sites=new Map();
    for(const cfg of REGIONS){
      const state=data?.sites?.[cfg.id]??(cfg.id==='pine'?legacy:null);
      if(cfg.id==='pine'||state)this.add(cfg,state);
    }
    const count=Object.keys(data?.sites??{}).length;
    for(let i=REGIONS.length;i<count;i++){
      const cfg=siteAt(i),state=data.sites[cfg.id];
      if(!state)break;
      this.add(cfg,state);
    }
    if(!this.sites.has(this.active))this.active='pine';
  }

  read(key){
    try{return JSON.parse(this.storage?.getItem(key)??'null');}catch{return null;}
  }

  add(config,checkpoint){
    const mill=new Mill(null,event=>this.listener(event,config.id),config,checkpoint);
    Object.defineProperty(mill.state,'cash',{
      enumerable:true,get:()=>this.cash,set:value=>{this.cash=finite(value);}
    });
    if(!checkpoint&&config.finish)mill.state.logs=4;
    this.sites.set(config.id,mill);
    return mill;
  }

  get mill(){return this.sites.get(this.active);}
  get shipped(){return [...this.sites.values()].reduce((sum,m)=>sum+m.state.shipped,0);}
  get sales(){return [...this.sites.values()].reduce((sum,m)=>sum+m.state.revenue,0);}
  get contracts(){return [...this.sites.values()].reduce((sum,m)=>sum+m.state.contract,0);}
  get peak(){return Math.max(0,...[...this.sites.values()].map(m=>m.state.peak));}

  get nextPlot(){return siteAt(this.sites.size);}

  plotSites(){return Array.from({length:Math.max(REGIONS.length,this.sites.size+1)},(_,i)=>siteAt(i));}

  get nextSite(){
    const site=this.nextPlot;
    const rule=this.requirement(site.id);
    return rule&&this.cash>=rule.cash&&rule.delivered>=rule.units?site:null;
  }

  requirement(id){
    const index=siteIndex(id);
    if(index<1)return null;
    const current=siteAt(index),previous=siteAt(index-1);
    return {cash:current.cost,units:current.from,previous:previous.name,
      delivered:this.sites.get(previous.id)?.state.shipped??0};
  }

  open(id){
    if(this.sites.has(id))return this.sites.get(id);
    const config=this.nextPlot,rule=this.requirement(id);
    if(config.id!==id)return null;
    if(!rule||rule.delivered<rule.units||this.cash<rule.cash)return null;
    this.cash-=rule.cash;
    const mill=this.add(config,null);
    this.save();
    return mill;
  }

  select(id){
    if(!this.sites.has(id))return false;
    this.active=id;this.save();return true;
  }

  badges(){
    const items=REGIONS.map((cfg,index)=>{
      const s=this.sites.get(cfg.id)?.state;
      return {name:cfg.badge,goal:cfg.name+' 完成首单',value:+!!s?.contract,total:1,mark:['I','II','III','IV'][index]};
    });
    return [...items,
      {name:'高垛之王',goal:'单厂同时堆到 54 件成品',value:this.peak,total:54,mark:'54'},
      {name:'百木车队',goal:'全厂累计发货 150 件',value:this.shipped,total:150,mark:'150'},
      {name:'四地之主',goal:'建成四座工厂',value:this.sites.size,total:4,mark:'4'},
      {name:'千木企业',goal:'全厂累计发货 1,000 件',value:this.shipped,total:1000,mark:'1K'}
    ];
  }

  get title(){
    if(this.sites.size>=16)return '木业集团领袖';
    if(this.sites.size>=8)return '联合木业大亨';
    if(this.sites.size>=5)return '工业园拓建者';
    const amount=this.badges().filter(b=>b.value>=b.total).length;
    return amount>=8?'山脉木业传奇':amount>=6?'四地木业大亨':amount>=4?'木业领袖':amount>=2?'区域经营家':amount>=1?'新锐厂长':'见习厂长';
  }

  step(dt){
    for(const mill of this.sites.values())mill.step(dt);
    this.timer+=dt;
    if(this.timer>=1){this.timer=0;this.save();}
  }
  save(){
    try{
      const sites=Object.fromEntries([...this.sites].map(([id,m])=>[id,{version:1,...m.state}]));
      this.storage?.setItem(saveKey,JSON.stringify({version:2,active:this.active,cash:this.cash,sound:this.sound,sites}));
    }catch{}
  }
}
