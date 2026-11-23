import {capacity} from './market.js';

export const savingsPerTicket=250;
export const legacySavingsPerTicket=100;
export const garageVersion=2;
export const pile=level=>capacity+3+level*2;
const pushSpeeds=[0,.19,.38,.57,.76,.95];
const startBoosts=[0,1.6,3.2,4.8,6.4,8];
export const upgrades=[
  {
    key:'wheels',name:'竞速车轮',mark:'wheel',costs:[5,11,21,35,54],
    effect:level=>level===0?'普通车轮':`最高速 +${Math.round(pushSpeeds[level]/5.35*100)}% · 起步 +${Math.round(startBoosts[level]/8*100)}%`
  },{
    key:'basket',name:'扩容车筐',mark:'cart',costs:[6,13,25,43],
    effect:level=>`一车最多摞 ${pile(level)} 件`
  },{
    key:'straps',name:'防掉货绑带',mark:'shield',costs:[4,12,26],
    effect:level=>level===0?'还没有掉货保护':`每趟抵消 ${level} 次掉货 · 货堆稳 ${level*15}%`
  }
];
function whole(n,max=Number.MAX_SAFE_INTEGER){
  return Number.isFinite(n)?Math.min(max,Math.max(0,Math.floor(n))):0;
}
export function garageState(saved,previousRate=legacySavingsPerTicket){
  const levels=Object.fromEntries(upgrades.map(u=>[u.key,whole(saved?.levels?.[u.key],u.costs.length)]));
  if(saved?.version===garageVersion){
    return {version:garageVersion,issued:whole(saved.issued),progress:whole(saved.progress,savingsPerTicket-1),levels};
  }
  // Earlier wallets stored savings and inferred vouchers from the current rate.
  // Freeze the vouchers already issued and convert fractional progress once.
  const earned=whole(saved?.earned);
  const issued=Math.floor(earned/previousRate);
  const progress=Math.floor((earned%previousRate)*savingsPerTicket/previousRate);
  return {version:garageVersion,issued,progress,levels};
}
export function ticketBalance(garage){
  const spent=upgrades.reduce((total,u)=>total+u.costs.slice(0,garage.levels[u.key]).reduce((sum,cost)=>sum+cost,0),0);
  return Math.max(0,garage.issued-spent);
}
export function creditSavings(garage,savings){
  const total=garage.progress+whole(savings);
  const gained=Math.floor(total/savingsPerTicket);
  garage.issued+=gained;
  garage.progress=total%savingsPerTicket;
  return gained;
}
export function buyUpgrade(garage,key){
  const upgrade=upgrades.find(u=>u.key===key);
  const level=garage.levels[key],cost=upgrade?.costs[level];
  if(cost===undefined||ticketBalance(garage)<cost)return false;
  garage.levels[key]=level+1;
  return true;
}
export function cartStats(levels){
  const {wheels,basket,straps}=garageState({levels}).levels;
  return {maxSpeed:5.35+pushSpeeds[wheels],acceleration:8+startBoosts[wheels],capacity:pile(basket),protection:straps,basket,grip:1+straps*.15};
}
