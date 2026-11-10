export const golemCount=level=>level>=5?3:level>=3?2:level>0?1:0;
export const golemMaxHP=level=>[0,180,220,255,295,340][level]||0;
export const recruitPrice=level=>[0,3,3,4,5,6][level]||0;
export function resizeCrew(b,oldLevel=0){
 const old=b.crew||[],max=golemMaxHP(b.level),oldMax=golemMaxHP(oldLevel)||1;
 b.crew=Array.from({length:golemCount(b.level)},(_,i)=>({hp:old[i]?old[i].hp>0?Math.min(max,Math.max(1,Math.round(old[i].hp/oldMax*max))):0:max}));
}
export function unitServiceCost(b,slot){
 if(b.type!=='golem'||!Number.isInteger(slot)||slot<0||slot>=golemCount(b.level))return Infinity;
 const hp=b.crew?.[slot]?.hp||0,max=golemMaxHP(b.level);
 return hp<=0?recruitPrice(b.level):Math.max(0,Math.ceil((max-hp)/90));
}
export function crewServiceCost(b,slot=null){
 if(slot!==null)return unitServiceCost(b,slot);
 return Array.from({length:golemCount(b.level)},(_,i)=>unitServiceCost(b,i)).reduce((n,c)=>n+c,0);
}
export function crewStatus(b){
 const total=golemCount(b.level),max=golemMaxHP(b.level);let ready=0,injured=0,hp=0;
 for(let i=0;i<total;i++){const life=b.crew?.[i]?.hp||0;hp+=life;if(life>0){ready++;if(life<max)injured++;}}
 return{total,ready,fallen:total-ready,injured,hp,maxHp:total*max,cost:crewServiceCost(b)};
}
