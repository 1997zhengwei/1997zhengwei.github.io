import {BASE_IDS,productsFor} from './config.mjs';
export const STAR_NAMES=['','街角小店','社区生鲜','精品超市','人气商场','五星旗舰'];
export const STAR_REWARDS={2:200,3:600,4:1200,5:2000};
export const STAR_UNLOCKS={2:'客流增加，升级门头与花箱，开启更多装扮',3:'更多客人，可增聘帮手、增开第二收银台、聘请店长',4:'繁忙客流，开放花卉专区，生鲜团队可增至三人',5:'全城热门，团队再次扩编，交给店长并继续开新店'};
const rule=(label,value,target)=>({label,value,target,done:value>=target});
export function starRequirements(s){const next=(s.stars||1)+1,goods=BASE_IDS.filter(id=>s.goods[id].unlocked).length,trained=Object.values(s.staffLevels).filter(n=>n>=2).length;
 if(next===2)return [rule('开售商品',goods,3),rule('累计营业额',s.stats.revenue,900),rule('服务顾客',s.stats.customers,20)];
 if(next===3)return [rule('开售商品',goods,6),rule('建好北侧工坊',Number(s.expansions.north),1),rule('累计营业额',s.stats.revenue,4500),rule('服务顾客',s.stats.customers,60)];
 if(next===4)return [rule('建好配送仓库',Number(s.expansions.warehouse),1),rule('商品陈列达到 Lv.2',BASE_IDS.filter(id=>s.goods[id].level>=1).length,6),rule('累计营业额',s.stats.revenue,12000),rule('服务顾客',s.stats.customers,130)];
 if(next===5)return [rule('商品陈列达到 Lv.3',BASE_IDS.filter(id=>s.goods[id].level>=2).length,6),rule('培训员工达到 Lv.2',trained,3),rule('售出'+productsFor(s).flower.name,s.goods.flower.sold||0,15),rule('累计营业额',s.stats.revenue,25000),rule('服务顾客',s.stats.customers,260)];
 return [];
}
export function canRate(s){const req=starRequirements(s);return req.length>0&&req.every(r=>r.done);}
export const starText=s=>'★'.repeat(s.stars||1)+'☆'.repeat(5-(s.stars||1));
