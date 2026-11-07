// Shared, deterministic rules used by the server, UI and model adapter.
export const TOWER_SPECS={
 gun:{name:'Tracer turret',metal:4,crystal:4,range:12,damage:15,interval:.42},
 frost:{name:'Frost lens',metal:5,crystal:5,range:12,damage:9,interval:.9},
 mortar:{name:'Arc mortar',metal:6,crystal:6,range:16,damage:28,interval:1.7}
};
export const TOWER_MARKS=['','Field Mk I','Aurora Mk II','Starfall Mk III'];
export function towerStats(t){
 const spec=TOWER_SPECS[t.type]||TOWER_SPECS.gun,tier=Math.max(1,Math.min(3,t.tier||1)),level=Math.max(1,Math.min(5,t.level||1));
 return {...spec,tier,damage:spec.damage*(1+(level-1)*.6)*[0,1,1.45,1.95][tier],range:spec.range+(tier-1)*(t.type==='mortar'?2:1.25),splash:t.type==='mortar'?3+(tier-1)*.6:0,maxHp:100+(level-1)*50+(tier>=2?180:0)+(tier>=3?240:0)};
}
export const towerUpgradePrice=level=>({metal:3+level*2,crystal:3+level*2});
export const towerAdvancePrice=tier=>tier===1?{metal:22,crystal:24,level:31}:{metal:34,crystal:36,level:46};
export function towerRepairPrice(t){const missing=Math.max(0,1-t.hp/t.maxHp);return {metal:2+Math.ceil(missing*4*(t.tier||1)),crystal:2+Math.ceil(missing*3*(t.tier||1))};}
export const OXYGEN_FACTORS=[1,1,1,1,1,1,1.4,1.7,2,2.4,2.8,3.2];
export const crewScale=n=>1+.45*(Math.max(1,Math.min(8,n))-1);
export const chapterAt=distance=>distance>1060?3:distance>620?2:1;
export function eventCleared(profile,event){return event.aurora?!!profile.aurora?.guardian:event.starfall?!!profile.starfall?.cleared?.includes(event.zone):!!profile.cleared?.includes(event.zone);}
export function towerTierUnlocked(profile,level){return level>=46&&profile.starfall?.arrived?3:level>=31&&profile.aurora?.arrived?2:1;}
export const JOURNEY_EXPIRY_MS=20*60*1000;
export function normalizeJourney(v){
 if(!v||!Number.isFinite(v.x)||!Number.isFinite(v.z)||!Number.isFinite(v.savedAt)||!/^BASE-\d+$/.test(v.room||''))return null;
 const finite=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
 return {room:v.room,x:finite(v.x,-22.5,22.5),z:finite(v.z,-1631.5,21.5),hp:finite(v.hp,0,10000),oxygen:finite(v.oxygen,0,1000),pouch:{metal:finite(v.pouch?.metal,0,1e8),crystal:finite(v.pouch?.crystal,0,1e8)},down:!!v.down,downTime:finite(v.downTime,0,20),savedAt:v.savedAt,pendingFee:v.pendingFee===2?2:0};
}
