import {storeIndex} from './stores.mjs';
// Demand, visible hiring limits and explicit manager income share these values with the UI.
export function traffic(s){const star=Math.max(1,Math.min(5,s.stars||1));return {star,interval:[0,4.6,3.2,2.2,1.6,1.2][star],cap:[0,8,14,20,26,32][star],minQty:[0,1,2,3,3,4][star],maxQty:[0,3,4,5,7,8][star],second:[0,.4,.6,.78,.86,.92][star],label:['','街角客流','邻里常客','人气旺店','繁忙商场','全城热门'][star]};}
export const staffCount=(s,role)=>s.employees.filter(a=>a.role===role).length;
export function staffLimit(s,role){const star=s.stars||1;return role==='cashier'?(star>=3?2:1):role==='fresh'?(star>=4?3:star>=3?2:1):(star>=5?3:star>=3?2:1);}
export function teamInfo(s,role){const count=staffCount(s,role),limit=staffLimit(s,role),base={tomato:380,cashier:650,fresh:850,baker:1100,juicer:1400}[role];return {count,limit,cost:Math.round(base*(count||1)**1.55),reason:!s.staffLevels[role]?'先雇用首位员工':count>=limit?limit===3||role==='cashier'&&limit===2?'本店编制已满':`升至 ${role==='cashier'||count===1?3:role==='fresh'?4:5} 星扩编`:''};}
export function managerInfo(s){const level=s.manager?.level||0,cost=[2800,5500,11000][level]||0;return {level,cost,reason:level>=3?'店长已满级':(s.stars||1)<3?'门店达到 3 星可聘请':!s.staffLevels.cashier||!s.staffLevels.tomato?'先配齐收银员和蔬果补货员':''};}
export function managedRate(r){if(!r.manager?.level||!r.staffLevels.cashier||!r.staffLevels.tomato)return 0;const people=r.employees.filter(a=>a.role!=='manager').length;return Math.round(((r.stars||1)*12+people*6+Object.values(r.staffLevels).reduce((n,v)=>n+v,0)*3)*(1+(r.manager.level-1)*.6));}
export const managedCap=r=>2500+(r.stars||1)*700+(r.manager?.level||0)*1500;
export function empireTitle(count){return count>=24?'商业帝国':count>=12?'城市商业大亨':count>=6?'商圈领航者':count>=3?'连锁主理人':'街角创业者';}
export function chainSummary(s){const all=[s,...Object.values(s.stores||{})];return {count:all.length,managed:all.filter(r=>r.manager?.level).length,five:all.filter(r=>r.stars===5).length,income:all.filter(r=>r!==s).reduce((n,r)=>n+managedRate(r)*2,0),pending:all.reduce((n,r)=>n+(r.dividendCash||0),0),revenue:all.reduce((n,r)=>n+r.stats.revenue,0),title:empireTitle(all.length)};}
export const managerHome=[.4,14.5];
