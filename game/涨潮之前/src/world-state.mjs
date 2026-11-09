export const WORLD_STYLES={sea:'#75b9b0',sunset:'#db9b83',meadow:'#a2b66f'};
export function newWorldSettings(){return{id:'legacy',name:'最初的小岛',mode:'survival',calm:false,frozen:false,pace:1,style:'sea',home:null,editor:false};}
export function readWorldSettings(raw){
 const w=newWorldSettings();if(!raw||typeof raw!=='object')return w;
 w.id=typeof raw.id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(raw.id)?raw.id:w.id;
 w.name=typeof raw.name==='string'?raw.name.trim().slice(0,24)||w.name:w.name;
 w.mode=raw.mode==='creative'?'creative':'survival';w.calm=Boolean(raw.calm);w.frozen=Boolean(raw.frozen);
 w.pace=[.75,1,1.5].includes(raw.pace)?raw.pace:1;w.style=Object.hasOwn(WORLD_STYLES,raw.style)?raw.style:'sea';
 if(raw.home&&Number.isFinite(raw.home.x)&&Number.isFinite(raw.home.z)&&Math.abs(raw.home.x)<1e9&&Math.abs(raw.home.z)<1e9)w.home={x:raw.home.x,z:raw.home.z};
 return w;
}
export const isArchitect=s=>Boolean(s.world?.editor&&s.survival?.started&&s.survival.creative);
