import {TOWER_SPECS,towerStats,towerUpgradePrice,towerRepairPrice,towerAdvancePrice,towerTierUnlocked,OXYGEN_FACTORS,crewScale,normalizeJourney,JOURNEY_EXPIRY_MS,eventCleared} from './frontier-balance.mjs';
import {updateBoss,bossDamage,hazardContains,rebalanceBoss} from './boss-combat.mjs';
export const VERSION = 'Starpath Horizons · 0.9.0';
export const MAX_PLAYERS=8, MOVE_SPEED=5.2, GATE_Z=-12, MAX_DEPTH=1620, MAX_LEVEL=60;
export const ENEMY_ARRIVAL=Object.freeze({playerDistance:8,stationBuffer:3,warningSeconds:2,windupSeconds:1,retrySeconds:.5});
export const BOUNDS={halfWidth:23,minZ:GATE_Z-MAX_DEPTH,maxZ:22};
export const XP=[0];for(let i=1;i<MAX_LEVEL;i++)XP.push(XP[i-1]+20+i*7+Math.floor(i/5)*3);
export const ZONES=[
 {id:0,name:'Mint Quarry',start:0,end:80,color:'#91d4be',recommend:1},
 {id:1,name:'Amber Dunes',start:80,end:170,color:'#e6c58d',recommend:6},
 {id:2,name:'Amethyst Grove',start:170,end:270,color:'#b5a3de',recommend:11},
 {id:3,name:'Frost Canyon',start:270,end:380,color:'#a3daec',recommend:16},
 {id:4,name:'Derelict Reach',start:380,end:500,color:'#9bb6c9',recommend:21},
 {id:5,name:'Starcore Rift',start:500,end:620,color:'#d7a4cc',recommend:26},
 {id:6,name:'Aurora Rise',start:700,end:800,color:'#71e1d5',recommend:31},
 {id:7,name:'Relay Canyon',start:800,end:920,color:'#80bfe9',recommend:36},
 {id:8,name:'Celestial Vault',start:920,end:1060,color:'#b5a0ef',recommend:41},
 {id:9,name:'Starfall Gardens',start:1140,end:1300,color:'#99ddc6',recommend:46},
 {id:10,name:'Moonpetal Canyon',start:1300,end:1460,color:'#b0bfee',recommend:52},
 {id:11,name:'Crown of Stars',start:1460,end:1620,color:'#edc9a0',recommend:57},
];
export const AURORA=Object.freeze({
 base:{id:2,name:'Aurora Outpost',x:0,z:GATE_Z-660,depth:660,halfWidth:14,minDepth:635,maxDepth:695},
 radar:{id:'radar',name:'Aurora Survey Radar',x:-8,z:GATE_Z-740,r:1.8,required:30},
 roverStart:{x:0,z:GATE_Z-812},roverEnd:{x:0,z:GATE_Z-896},roverRadius:8,roverHealth:520,roverSpeed:1.75,
 vault:{id:'guardian',name:'Celestial Mechanical Guardian',x:0,z:GATE_Z-1000,health:7200},
 exit:{x:0,z:GATE_Z-1020},
 facilities:[{id:'training2',x:-8,z:-666,r:2.3,label:'AURORA TRAINING'},{id:'shop2',x:8,z:-666,r:2.3,label:'AURORA GEAR SHOP'},{id:'command2',x:-8,z:-686,r:2.4,label:'AURORA COMMAND'}],
 rewards:{arrival:{xp:300,metal:70,crystal:50},radar:{xp:1500,metal:150,crystal:100},escort:{xp:1900,metal:200,crystal:150},guardian:{xp:2400,metal:260,crystal:190}},
});
export const STARFALL={id:3,name:'Starfall Harbor',x:0,z:GATE_Z-1110,depth:1110,halfWidth:14,minDepth:1070,maxDepth:1140};
const ORIGINAL_BASE={id:1,name:'Starpath Base',x:0,z:7};
export function nearestBase(p){const f=p.profile||p,bases=[ORIGINAL_BASE];if(sixCleared(f)||depth(p)>=635)bases.push(AURORA.base);if(f.starfall?.arrived||f.aurora?.guardian||depth(p)>1060)bases.push(STARFALL);return {...bases.sort((a,b)=>dist(a,p)-dist(b,p))[0]}}
export const SUITS=[
 ['Trail Mint','#43c9b2','#a7ffdf'],['Survey Blue','#579ad9','#82d9ff'],['Dune Gold','#d8ae5d','#ffe3a1'],
 ['Prism Violet','#9c83dc','#d0afff'],['Aurora Teal','#42bac5','#91fff2'],['Polar Pearl','#b2d8e8','#d4f5ff'],
 ['Relay Indigo','#647dc9','#a6baff'],['Nova Rose','#d58eaf','#ffbde4'],['Solar Gold','#dfb665','#ffde8a'],['Starborn Pearl','#d7eae6','#b9fffa'],
 ['Aurora Ranger','#43daca','#a7fff2'],['Canyon Vanguard','#739bdc','#b1d7ff'],['Vault Sentinel','#a88bdc','#e2c0ff'],['Celestial Titan','#e1c491','#fff0b4'],['Aurora Sovereign','#c9e8ec','#d3fffd'],['Starfall Scout','#6dcdb8','#a5ffe4'],['Twin Nova','#729cdd','#a8d6ff'],['Moonpetal Knight','#c394db','#eed1ff'],['Stellar Rider','#deab78','#ffe4b0'],['Starcrown Regent','#e4d5a7','#fff4c0'],
].map(([name,color,bullet],id)=>({id,name,color,bullet,level:1+id*3}));
export const WEAPONS={
 pulse:{name:'Pulse Blaster',level:1,metal:0,crystal:0,range:9,interval:.46,damage:1,detail:'Steady bolts. Rank 2 adds a two-shot burst.'},
 scatter:{name:'Comet Scatter',level:4,metal:12,crystal:6,range:6.3,interval:.8,damage:.56,detail:'A wide pellet fan. Strong close up and against groups.'},
 rail:{name:'Prism Rail',level:10,metal:28,crystal:16,range:11,interval:1.15,damage:2.15,detail:'Locks aim, then pierces armor and several foes. Move during its brief charge.'},
 arc:{name:'Aurora Arc',level:16,metal:46,crystal:25,range:9,interval:.72,damage:1.05,detail:'Chains between nearby enemies. Best against clustered packs.'},
};
export const FACILITIES=[{id:'training',x:-6,z:0,r:1.8,label:'OXYGEN TRAINING'},{id:'shop',x:6,z:0,r:1.8,label:'GEAR SHOP'},{id:'ship',x:0,z:16,r:2.6,label:'STARPATH BASE'}];
export const STATIONS=ZONES.flatMap(zone=>[.27,.66].map((f,j)=>({id:zone.id*2+j,x:j?7:-5,z:GATE_Z-zone.start-(zone.end-zone.start)*f,zone:zone.id,name:[['First Light','Quarry Rest'],['Dune Oasis','Sun Shelter'],['Prism Grove','Violet Rest'],['Ice Lantern','Polar Haven'],['Relay Camp','Signal Rest'],['Nova Shelter','Warden Watch'],['Aurora Lantern','Survey Rest'],['Relay Waypoint','Rover Haven'],['Vault Refuge','Celestial Rest'],['Petal Springs','Starlit Rest'],['Moon Lantern','Canyon Haven'],['Crown Refuge','Last Light']][zone.id][j],level:zone.recommend})));
export const STATION_COST={metal:5,crystal:3};
export function stationCost(s){return s.zone===0?{metal:5,crystal:3}:{metal:5+Math.floor(s.zone*1.5),crystal:4+Math.floor(s.zone*1.35)}}
export const STATION_REPAIR_COST={metal:2,crystal:2},STATION_EXPAND_COST={metal:6,crystal:6};
export const towerUpgradeCost=towerUpgradePrice;
export const EVENTS=[...ZONES.slice(0,6).map((zone,i)=>({id:['quarry-sentinel','dune-ram','prism-matron','icebreaker','relay-titan','starcore-warden'][i],name:['Quarry Sentinel','Dune Ram','Prism Matron','Icebreaker','Relay Titan','Starcore Warden'][i],zone:i,type:'boss',x:0,z:GATE_Z-zone.end+15,health:[360,650,1100,1750,2600,3800][i]})),{id:'aurora-guardian',name:AURORA.vault.name,zone:8,type:'boss',x:AURORA.vault.x,z:AURORA.vault.z,health:AURORA.vault.health,aurora:true}];
EVENTS.push(...ZONES.slice(9).map((z,i)=>({id:'starfall-'+i,name:['Thornback Alpha','Moonwing Matriarch','Starcrown Colossus'][i],zone:z.id,type:'boss',x:0,z:GATE_Z-z.end+22,health:[9000,12500,24000][i],starfall:true})));
export const TOWERS=TOWER_SPECS;
export const PADS=[...STATIONS.flatMap(s=>[[-3.4,-4],[3.4,-4],[-3.4,4],[3.4,4]].map(([x,z],i)=>({id:`s${s.id}-${i}`,station:s.id,x:s.x+x,z:s.z+z}))),...EVENTS.flatMap(e=>[[-6,-5],[6,-5],[-6,3],[6,3]].map(([x,z],i)=>({id:`${e.id}-${i}`,event:e.id,x:e.x+x,z:e.z+z})))];
export const OBSTACLES=ZONES.flatMap(z=>Array.from({length:5},(_,i)=>({x:(i%2?-1:1)*(14+i%3),z:GATE_Z-z.start-(z.end-z.start)*(.14+i*.17),r:1.6+i*.17})));
export const ENEMY_ZONE_STATS=[{hp:34,damage:7},{hp:58,damage:10},{hp:88,damage:13},{hp:125,damage:17},{hp:170,damage:21},{hp:220,damage:26},{hp:260,damage:28},{hp:315,damage:32},{hp:370,damage:36},{hp:470,damage:39},{hp:590,damage:43},{hp:740,damage:48}];
export const ENEMY_ROSTERS=[['scout','scout','runner'],['runner','brute','scout'],['spitter','support','runner'],['shield','spitter','brute'],['artillery','shield','runner'],['artillery','support','shield','brute'],['runner','shield','scout'],['brute','spitter','support'],['shield','artillery','runner'],['runner','brute','support'],['spitter','shield','runner','support'],['artillery','support','brute','shield']];
export function enemyStats(zone,type){const boss=type==='boss';return {hp:boss?(EVENTS.find(e=>e.zone===zone)?.health||AURORA.vault.health):ENEMY_ZONE_STATS[zone].hp*(type==='brute'?1.7:type==='shield'?1.35:type==='support'?.85:1),speed:boss?(zone===8?.95:1.45):type==='runner'?3.2:type==='brute'?1.75:2.05+zone*.09,damage:boss?14+zone*4:ENEMY_ZONE_STATS[zone].damage}}
export const REACTIONS={hello:['👋','Hello, explorer!'],go:['🚀','Heading out!'],help:['🆘','Could use a hand!'],thanks:['💛','Thank you!'],nice:['✨','Love that equipment!'],home:['🏠','Back to base!']};
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const depth=p=>Math.max(0,GATE_Z-p.z);
export const inHub=p=>(Math.abs(p.x||0)<=14&&depth(p)>=1070&&depth(p)<=1140)||p.z>=GATE_Z||(Math.abs(p.x||0)<=AURORA.base.halfWidth&&depth(p)>=AURORA.base.minDepth&&depth(p)<=AURORA.base.maxDepth);
export const zoneAt=p=>ZONES.find(z=>depth(p)<z.end)?.id??11;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const random=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
export function levelOf(xp){let l=1;while(l<MAX_LEVEL&&xp>=XP[l])l++;return l}
// Derived from the existing save. No migration, purchase or new progression flag.
export function combatEvolution(profile){return profile?.aurora?.arrived?clamp(Math.floor((levelOf(profile.xp)-31)/5)+1,0,3):0}
export const sixCleared=profile=>Array.from({length:6},(_,i)=>i).every(i=>profile.cleared?.includes(i));
export function frontierOf(profile){if(profile.aurora?.guardian&&!profile.starfall?.arrived)return 9;if(profile.starfall?.arrived)return 9+Math.min(2,profile.starfall.cleared.length);let i=0;while(i<5&&profile.cleared?.includes(i))i++;if(!sixCleared(profile))return i;return profile.aurora?.escort?8:profile.aurora?.radar?7:6}
export function levelCap(profile){if(profile.starfall?.arrived)return profile.starfall.cleared.includes(10)?60:profile.starfall.cleared.includes(9)?57:51;if(!sixCleared(profile))return Math.min(30,(frontierOf(profile)+1)*5);const a=profile.aurora,m=a?.milestones||[];if(a?.guardian)return 45;if(a?.escort)return [41,43,44][Math.min(2,m.filter(k=>k.startsWith('vault-')).length)];if(a?.radar)return 36+Math.min(2,a.escortCheckpoint||0)*2;if(a?.arrived)return 31+Math.min(2,m.filter(k=>k.startsWith('radar-')).length)*2;return 30}
export function fireInterval(profile){const s=stats(profile),w=WEAPONS[s.weapon];return s.weapon==='arc'&&profile.starfall?.arrived?[.72,.63,.54,.45,.36][s.weaponRank-1]:w.interval-Math.min(.07,(s.weaponRank-1)*.025);}
export function weaponCost(profile,key){const w=WEAPONS[key],rank=profile.weapons[key]||0;return rank?{metal:10+rank*10+Math.floor(w.level/3),crystal:5+rank*5+Math.floor(w.level/5),level:rank>=3?(rank===3?31:40):Math.min(28,w.level+(rank===1?3:9))}:{metal:w.metal,crystal:w.crystal,level:w.level}}
export function stats(profile){
 const level=levelOf(profile.xp),m=profile.modules,key=WEAPONS[profile.weapon]?profile.weapon:'pulse',w=WEAPONS[key],rank=profile.weapons?.[key]||1,tier=Math.floor((level-1)/3)+1;
 return {level,tier,style:profile.suit>=0?Math.min(tier-1,profile.suit):tier-1,hp:100+(level-1)*4+m.armor*18+(profile.starfall?.arrived?Math.max(0,level-45)*12:0),oxygen:100+m.oxygen*24,drain:Math.max(1.6,3-(level-1)*.025-m.oxygen*.18),damage:14*(1+(level-1)*.045+(rank-1)*.18)*(profile.starfall?.arrived?1+Math.max(0,level-45)*.045:1),range:w.range+(rank-1)*.35,weapon:key,weaponRank:rank,recommended:ZONES[frontierOf(profile)].end,cap:levelCap(profile),speed:MOVE_SPEED};
}
export function cleanName(name){return String(name||'Explorer').replace(/[\x00-\x1f<>]/g,'').trim().slice(0,18)||'Explorer'}
export function newProfile(id,name='Explorer'){return {id,name:cleanName(name),xp:0,metal:2,crystal:0,modules:{oxygen:0,armor:0},weapon:'pulse',weapons:{pulse:1,scatter:0,rail:0,arc:0},suit:-1,skin:'mint',homeBase:1,starfall:{arrived:false,cleared:[],pet:false,petXp:0,petStage:0,petName:'Nova',complete:false},aurora:{arrived:false,radar:false,escort:false,guardian:false,escortCheckpoint:0,milestones:[]},cleared:[],visited:[],tutorial:{gathered:0,relay:false,defenseKills:0,defended:false,advanced:false},records:{distance:0,rescues:0,bosses:0,deliveries:0,kills:0},unlocks:[],created:Date.now(),updated:Date.now()}}
export function normalizeProfile(v,id){
 const p=newProfile(id,v?.name);if(!v)return p;p.journey=normalizeJourney(v.journey);
 for(const k of ['xp','metal','crystal'])p[k]=clamp(Number(v[k])||0,0,k==='xp'?XP[MAX_LEVEL-1]:1e8);
 for(const k of Object.keys(p.modules))p.modules[k]=clamp(Math.floor(Number(v.modules?.[k])||0),0,8);
 for(const k of Object.keys(p.weapons))p.weapons[k]=clamp(Math.floor(Number(v.weapons?.[k])||0),k==='pulse'?1:0,5);
 p.weapon=WEAPONS[v.weapon]&&p.weapons[v.weapon]?v.weapon:'pulse';p.suit=clamp(Math.floor(v.suit===undefined?-1:Number(v.suit)),-1,Math.floor((levelOf(p.xp)-1)/3));if(!Number.isFinite(p.suit))p.suit=-1;
 p.skin=['mint','coral','violet'].includes(v.skin)?v.skin:'mint';
 for(const k of Object.keys(p.records))p.records[k]=Math.max(0,Number(v.records?.[k])||0);
 for(const k of ['relay','defended','advanced'])p.tutorial[k]=v.tutorial?.[k]===true;
 for(const k of ['gathered','defenseKills'])p.tutorial[k]=clamp(Math.floor(Number(v.tutorial?.[k])||0),0,1000);
 p.cleared=Array.isArray(v.cleared)?[...new Set(v.cleared.filter(n=>Number.isInteger(n)&&n>=0&&n<6))]:[];
 p.visited=Array.isArray(v.visited)?[...new Set(v.visited.filter(n=>Number.isInteger(n)&&n>=0&&n<STATIONS.length))]:[];
 if(sixCleared(p)){p.aurora.arrived=v.aurora?.arrived===true||v.homeBase===2;p.aurora.radar=p.aurora.arrived&&v.aurora?.radar===true;p.aurora.escort=p.aurora.radar&&v.aurora?.escort===true;p.aurora.guardian=p.aurora.escort&&v.aurora?.guardian===true;p.aurora.escortCheckpoint=p.aurora.escort?3:p.aurora.radar?clamp(Math.floor(Number(v.aurora?.escortCheckpoint)||0),0,3):0;p.homeBase=p.aurora.arrived?2:1;}
 if(p.aurora.guardian&&v.starfall?.arrived){p.starfall={arrived:true,cleared:[9,10,11].filter(n=>v.starfall?.cleared?.includes(n)),pet:!!v.starfall.pet,petXp:Math.max(0,Number(v.starfall.petXp)||0),petStage:Math.max(0,Math.min(3,Number(v.starfall.petStage)||0)),petName:cleanName(v.starfall.petName||'Nova'),complete:!!v.starfall.complete};p.homeBase=3;}
 p.aurora.milestones=Array.isArray(v.aurora?.milestones)?[...new Set(v.aurora.milestones.filter(k=>/^(radar|escort|vault)-[12]$/.test(k)))]:[];
 p.unlocks=Array.isArray(v.unlocks)?v.unlocks.filter(x=>/^station-\d+$|^region-\d+$/.test(x)):[];p.created=Number(v.created)||p.created;return p;
}
export function trainingCost(profile,type){const n=profile.modules[type]||0;return {metal:8+n*9,crystal:4+n*4,level:n>=5?31+(n-5)*5:1+n*5}}
export function publicProfile(p){const s=stats(p);return {id:p.id,name:p.name,xp:p.xp,level:s.level,tier:s.tier,style:s.style,skin:p.skin,suit:p.suit,modules:{...p.modules},weapon:p.weapon,weapons:{...p.weapons},homeBase:p.homeBase||1,starfall:{...p.starfall},aurora:{...p.aurora},cleared:[...p.cleared],visited:[...p.visited],recommended:s.recommended,cap:s.cap,records:{...p.records},unlocks:[...p.unlocks]}}
export const NODES=ZONES.flatMap(zone=>Array.from({length:22},(_,i)=>{
 const row=Math.floor(i/2),f=.045+row*.084;let z=GATE_Z-zone.start-(zone.end-zone.start)*f,x=(i%2?1:-1)*(2+((row*3+zone.id)%5)*2);
 if(STATIONS.some(s=>Math.hypot(x-s.x,z-s.z)<3)||EVENTS.some(e=>Math.hypot(x-e.x,z-e.z)<3))x=x<0?-12:12;
 return {x,z,type:i%2?'crystal':'metal',zone:zone.id};
})).map((n,id)=>({...n,id}));
const SPAWNS=ZONES.flatMap(zone=>Array.from({length:5},(_,i)=>({x:(i%2?-1:1)*(9+random(i+zone.id*7)*5),z:GATE_Z-zone.start-(zone.end-zone.start)*(.17+i*.16),zone:zone.id}))).map((c,id)=>({...c,id}));
export const SPAWN_POINTS=[{x:0,z:7},{x:-2.5,z:7},{x:2.5,z:7},{x:0,z:10},{x:-2.5,z:10},{x:2.5,z:10},{x:-4.5,z:9},{x:4.5,z:9}];
const spawnPoint=slot=>({...SPAWN_POINTS[slot]});
export function basePosition(profile,slot=0){const point=spawnPoint(clamp(Math.floor(slot)||0,0,MAX_PLAYERS-1));return profile?.homeBase===3?{x:point.x,z:STARFALL.z+(point.z-7)}:profile?.homeBase===2&&sixCleared(profile)?{x:point.x,z:AURORA.base.z+(point.z-7)}:point}
const roverPosition=checkpoint=>({x:AURORA.roverStart.x,z:AURORA.roverStart.z+(AURORA.roverEnd.z-AURORA.roverStart.z)*clamp(checkpoint,0,3)/3});
export function guideFor(world,p){
 if(p.profile.aurora.guardian){const a=p.profile.starfall;if(!a?.arrived)return {step:201,total:206,title:'STARFALL HARBOR AWAITS',text:'Chapter three · Take the harbor shuttle from Base, or follow the road north. Your new home saves automatically.',target:{...STARFALL,kind:'base'}};const l=stats(p.profile).level;const next=world.events.find(e=>e.starfall&&!a.cleared.includes(e.zone));return {step:202,total:206,title:l<48?'Reach LV 48 · Twin fire':l<51?'Twin fire online · Reach LV 51':!a.pet?'Rescue your starbeast':a.petStage<2?(l>=54?'Companion evolution available':'Grow together · Evolve at LV 54'):!a.complete?'Explore with your companion':'STARFALL EXPEDITION COMPLETE',text:!a.pet&&l>=51?'Approach the glowing cocoon at 1210m. Press Interact to rescue Nova.':`LV ${l} / 60 · ${a.pet?(a.petStage>=3?'Starcore companion complete. ':'Nova XP '+a.petXp+' · Evolve at harbor. '):''}${next?'Challenge '+next.name+'. Build O₂ along the marked route.':'All three guardians defeated. Refit and help your crew.'}`,target:!a.pet&&l>=51?{x:-8,z:GATE_Z-1210,name:'Starbeast cocoon',kind:'pet'}:next?{...next,kind:'event'}:null};}

 if(sixCleared(p.profile)){
  const a=p.profile.aurora||{};
  if(!a.arrived)return {step:101,total:105,title:'AURORA OUTPOST AWAITS',text:'Six guardians cleared. Follow the north road beyond 620m, or take the base shuttle to Aurora Outpost. Arrival saves your new home.',target:{...AURORA.base,kind:'base'}};
  if(!a.radar)return {step:102,total:105,title:'Deploy the Aurora radar',text:`LV 31 · Activate the survey radar, stay nearby and defend its ${AURORA.radar.required}-second scan. Unlocks LV 36 and Relay Canyon.`,target:{...AURORA.radar,kind:'aurora',task:'radar'}};
  if(!a.escort){
   const rover=world.aurora?.rover,active=rover&&['moving','paused'].includes(rover.stage),checkpoint=a.escortCheckpoint||0,position=active?rover:roverPosition(checkpoint),failed=rover?.stage==='failed';
   return {step:103,total:105,title:failed?`Rover disabled · retry checkpoint ${checkpoint}`:'Escort the power rover',text:failed?`${checkpoint?`Checkpoint ${checkpoint}/3 is saved.`:'No checkpoint reached yet.'} Follow the marker back to the Rover restart point at ${Math.round(depth(position))}m and interact to restart this leg. Repair the moving rover for 6M + 3C before its health runs out.`:'LV 36 · Activate the rover and stay within its moving O₂ circle. It refills oxygen only. Protect it, repair with Interact and save each checkpoint. Unlocks LV 41.',target:{...position,name:active?'Power rover':'Rover restart point',kind:'aurora',task:'escort'}};
  }
  if(!a.guardian)return {step:104,total:105,title:'Open the Celestial Vault',text:'LV 41 · Challenge the mechanical guardian. Walk out of orange marks; its armor weakens when the core opens. Victory unlocks LV 45.',target:{...AURORA.vault,kind:'aurora',task:'guardian'}};
  return {step:105,total:105,title:'AURORA EXPEDITION COMPLETE',text:'Radar restored. Power delivered. Vault secured. Refine your LV 45 gear, return to either base and help your crew.',target:null};
 }
 const firstCleared=p.profile.cleared.includes(0),t=p.profile.tutorial,materials={metal:p.profile.metal+p.pouch.metal,crystal:p.profile.crystal+p.pouch.crystal};
 if(!firstCleared&&(t.gathered<2||(!t.relay&&(materials.metal<5||materials.crystal<3)))){const type=materials.metal<5?'metal':materials.crystal<3?'crystal':null,target=NODES.filter(n=>(!type||n.type===type)&&world.nodeTimers[n.id]<=0&&n.zone===0).sort((a,b)=>dist(a,p)-dist(b,p))[0];return {step:1,total:5,title:'Gather metal & crystal',text:`Walk forward ↑. Tap Gather beside glowing deposits (${Math.min(2,t.gathered)}/2).`,target:target?{...target,kind:'node'}:null}}
 if(!firstCleared&&!t.relay)return {step:2,total:5,title:'Build your first O₂ station',text:'Follow O₂. Build for 5 metal + 3 crystal. The field refills oxygen.',target:{...STATIONS[0],kind:'station'}};
 if(!firstCleared&&!t.defended)return {step:3,total:5,title:'Defeat 3 scavengers',text:`Move to dodge. Your gun fires automatically (${Math.min(3,t.defenseKills)}/3).`,target:{x:0,z:STATIONS[0].z-6,kind:'defense'}};
 if(!firstCleared&&p.profile.weapons.pulse<2&&!Object.entries(p.profile.weapons).some(([key,n])=>key!=='pulse'&&n>0))return {step:4,total:5,title:'Return for burst fire',text:'Visit GEAR SHOP. Improve Pulse to Rank 2, or try the Comet Scatter.',target:{...FACILITIES[1],kind:'shop'}};
 if(!p.profile.cleared.includes(0))return {step:5,total:5,title:'Challenge the Quarry Sentinel',text:'Reach LV 4–5. Follow the guardian beacon. Walk out of orange attack rings.',target:{...EVENTS[0],kind:'event'}};
 const f=frontierOf(p.profile),guardian=EVENTS[f],done=p.profile.cleared.length===6;
 const stop=world.stations.filter(s=>s.zone===f&&s.hp<=0&&depth(s)>depth(p)-10).sort((a,b)=>depth(a)-depth(b))[0];
 if(!done&&stop){const c=stationCost(stop);return {step:6,total:5,title:`Establish O₂ · ${stop.name}`,text:`${ZONES[f].name} · Build your next foothold (${c.metal}M / ${c.crystal}C), then challenge ${guardian.name}.`,target:{...stop,kind:'station'}}}

 return {step:6,total:5,title:done?'SIX FRONTIERS COMPLETE':inHub(p)?'Refit. Redeploy. Go farther.':ZONES[zoneAt(p)].name,text:done?'All guardians defeated. Explore, change weapons and help your crew.':`LV ${ZONES[f].recommend}–${Math.min(30,ZONES[f].recommend+4)} · Defeat ${guardian.name} to open the next region.`,target:done?null:{...guardian,kind:'event'}};
}

export class FrontierWorld{
  constructor({id='BASE-01',onDirty=()=>{},board=[]}={}){
    this.id=id;this.onDirty=onDirty;this.builtStations=new Set();this.players=new Map();this.enemies=[];this.arrivals=[];this.towers=[];this.hazards=[];
    this.stations=STATIONS.map(s=>({...s,hp:0,maxHp:160+s.zone*60,level:1,radius:7}));
    this.events=EVENTS.map(e=>({...e,state:'idle',time:0,hp:100,participants:[],spawned:0,cooldown:0}));
    this.aurora={radar:{...AURORA.radar,state:'idle',progress:0,participants:[],wave:0,abandoned:0},rover:{...AURORA.roverStart,hp:AURORA.roverHealth,maxHp:AURORA.roverHealth,health:1,radius:AURORA.roverRadius,stage:'idle',checkpoint:0,participants:[],abandoned:0,wave:-1},guardian:this.events.find(e=>e.aurora)};
    this.nodeTimers=NODES.map(()=>0);this.spawnTimers=SPAWNS.map(()=>2);this.board=board.slice(-20);
    this.effects=[];this.messages=[];this.beams=[];this.orbs=[];this.time=0;this.uid=1;this.eventId=0;this.lastUsed=Date.now();
  }
  emit(type,data={}){this.effects.push({type,...data,eventId:++this.eventId,time:this.time});if(this.effects.length>120)this.effects.shift()}
  dirty(p){if(p)p.profile.updated=Date.now();this.onDirty()}
  record(text,profile){this.board.push({id:`${this.id}-${Date.now()}-${++this.eventId}`,name:profile.name,playerId:profile.id,text:String(text).slice(0,110),at:Date.now()});this.board=this.board.slice(-20);this.dirty()}
  online(){return [...this.players.values()].filter(p=>p.online)}
  enter(profile){
    profile.homeBase=profile.starfall?.arrived?3:profile.homeBase===2&&sixCleared(profile)?2:1;profile.aurora={arrived:false,radar:false,escort:false,guardian:false,escortCheckpoint:0,milestones:[],...profile.aurora};
    const present=q=>q.online||q.joinUntil>Date.now(),others=[...this.players.values()].filter(q=>q.id!==profile.id&&present(q));
    if(others.length>=MAX_PLAYERS)throw Error('This base is full.');
    const slot=Array.from({length:MAX_PLAYERS},(_,i)=>i).find(i=>!others.some(q=>q.slot===i));
    let p=this.players.get(profile.id);
    if(p){this.clearEvolution(p,'reenter');if(p.profile.journey&&Date.now()-p.profile.journey.savedAt>JOURNEY_EXPIRY_MS)this.restoreJourney(p);p.online=true;p.slot=slot;p.profile=profile;p.input={x:0,z:0};p.rescuing=false;p.lastInput=0;p.charge=null;p.burst=null;this.restoreAurora(profile);this.checkpointPlayer(p);return p}
    const s=stats(profile);p={id:profile.id,profile,slot,...basePosition(profile,slot),online:true,hp:s.hp,oxygen:s.oxygen,input:{x:0,z:0},lastInput:0,
      rescuing:false,down:false,downTime:0,revive:0,hurt:0,fire:0,headingX:0,headingZ:1,pouch:{metal:0,crystal:0},gatherCd:0,lastReaction:-99,lastRescue:-99};
    this.players.set(p.id,p);this.restoreAurora(profile);this.restoreJourney(p);this.record(`arrived at ${nearestBase(p).name}.`,profile);this.emit('arrive',{playerId:p.id,x:p.x,z:p.z});return p;
  }
  checkpointPlayer(p){p.profile.journey={room:this.id,x:p.x,z:p.z,hp:p.hp,oxygen:p.oxygen,pouch:{...p.pouch},down:p.down,downTime:p.downTime,savedAt:Date.now(),pendingFee:p.shuttle?2:0};this.dirty(p)}
  restoreJourney(p){
    const j=normalizeJourney(p.profile.journey);if(!j)return;
    p.pouch={...j.pouch};p.hp=Math.min(stats(p.profile).hp,j.hp);p.oxygen=Math.min(stats(p.profile).oxygen,j.oxygen);p.down=j.down||p.hp<=0;p.downTime=j.downTime;
    if(j.pendingFee)p.profile.metal+=j.pendingFee;
    const expired=Date.now()-j.savedAt>JOURNEY_EXPIRY_MS,legalDepth=depth(j)<=ZONES[frontierOf(p.profile)].end;
    if(!expired&&j.room===this.id&&legalDepth){
      const candidates=[{x:j.x,z:j.z}];for(const radius of [.5,1,2,3])for(let i=0;i<12;i++)candidates.push({x:j.x+Math.sin(i*Math.PI/6)*radius,z:j.z+Math.cos(i*Math.PI/6)*radius});
      const point=candidates.find(q=>this.clear(q.x,q.z));if(point){Object.assign(p,point);this.emit('reconnected',{playerId:p.id,x:p.x,z:p.z});this.checkpointPlayer(p);return;}
    }
    // Long absences / a different room use the same carried-material loss as
    // evacuation. A reload never becomes a free full-health bank operation.
    this.evacuate(p);this.checkpointPlayer(p);
  }
  disconnect(id){const p=this.players.get(id);if(p){this.checkpointPlayer(p);this.clearEvolution(p,'disconnect');p.charge=null;p.burst=null;p.online=false;p.joinUntil=0;p.input={x:0,z:0};p.rescuing=false;p.lastSeen=this.time}}
  restoreAurora(profile){
    const a=profile.aurora,r=this.aurora.rover;
    if(a.radar&&this.aurora.radar.state==='idle')this.aurora.radar.state='complete';
    if(!['moving','paused'].includes(r.stage)&&(a.escort||a.escortCheckpoint>r.checkpoint)){r.checkpoint=a.escort?3:a.escortCheckpoint;Object.assign(r,roverPosition(r.checkpoint));r.stage=a.escort?'complete':'idle';r.hp=r.maxHp;}
    if(a.guardian&&this.aurora.guardian.state==='idle')this.aurora.guardian.completed=true;
  }
  arriveAurora(p){
    if(!sixCleared(p.profile)||!inHub(p)||depth(p)<AURORA.base.minDepth)return false;
    const first=!p.profile.aurora.arrived;p.profile.homeBase=p.profile.starfall?.arrived?3:2;p.profile.aurora.arrived=true;
    if(first){const reward=AURORA.rewards.arrival;p.profile.metal+=reward.metal;p.profile.crystal+=reward.crystal;this.awardXp(p,reward.xp);this.record('established a new home at Aurora Outpost.',p.profile);this.emit('auroraArrival',{playerId:p.id,x:p.x,z:p.z,homeBase:2});this.emit('auroraBase',{playerId:p.id,x:p.x,z:p.z,homeBase:2,message:'Aurora Outpost is your new home. Progress saved.'});}
    if(first||p.savedHomeBase!==2){p.savedHomeBase=2;this.dirty(p)}return first;
  }
  oxygenSource(p){const r=this.aurora.rover;return inHub(p)?{...nearestBase(p),base:true}:this.stations.find(s=>s.hp>0&&dist(s,p)<=s.radius)||(r.hp>0&&dist(r,p)<=r.radius?{id:'aurora-rover',name:'Power Rover O₂',x:r.x,z:r.z,radius:r.radius,rover:true}:null)}
  clear(x,z){
    if(this.enemies.some(e=>e.hp>0&&e.pillars?.some(p=>Math.hypot(x-p.x,z-p.z)<1.3)))return false;
    if([-9,9].some(s=>Math.hypot(x-s,z-STARFALL.z)<3.9)||Math.hypot(x+8,z-(GATE_Z-1210))<1.8)return false;
    if(Math.abs(x)>BOUNDS.halfWidth-.5||z<BOUNDS.minZ+.5||z>BOUNDS.maxZ-.5)return false;
    if(z>GATE_Z&&Math.abs(x)>12)return false;
    if(Math.abs(z-GATE_Z)<.7&&Math.abs(x)>5.1)return false;
    return ![...FACILITIES,...AURORA.facilities,AURORA.radar,{x:-8,z:AURORA.vault.z,r:1.4},{x:8,z:AURORA.vault.z,r:1.4}].some(f=>Math.hypot(x-f.x,z-f.z)<f.r+.9)&&!EVENTS.some(f=>{const ev=this.events.find(e=>e.id===f.id);const flat=f.aurora||f.starfall&&(ev?.state!=='idle'||this.online().some(p=>dist(p,f)<2.3));return !flat&&Math.hypot(x-f.x,z-f.z)<1.7})&&
      !OBSTACLES.some(f=>Math.hypot(x-f.x,z-f.z)<f.r+.9)&&!this.stations.some(s=>s.hp>0&&Math.hypot(x-s.x,z-s.z)<1.25)&&
      !this.towers.some(t=>t.hp>0&&Math.hypot(x-t.x,z-t.z)<1.05);
  }
  canPay(p,cost){return ['metal','crystal'].every(k=>p.profile[k]+p.pouch[k]>=(cost[k]||0))}
  pay(p,cost){if(!this.canPay(p,cost))return false;for(const key of ['metal','crystal']){const n=cost[key]||0,trip=Math.min(n,p.pouch[key]);p.pouch[key]-=trip;p.profile[key]-=n-trip}this.dirty(p);return true}
  awardXp(p,n){const before=stats(p.profile),cap=levelCap(p.profile),max=cap>=MAX_LEVEL?XP[MAX_LEVEL-1]:cap===30?XP[29]:XP[cap]-1;p.profile.xp=Math.max(p.profile.xp,Math.min(max,p.profile.xp+Math.max(0,Math.round(n))));const after=stats(p.profile);if(after.level>before.level){p.hp=Math.min(after.hp,p.hp+after.hp-before.hp+12);p.oxygen=Math.min(after.oxygen,p.oxygen+15);this.emit('level',{playerId:p.id,level:after.level,x:p.x,z:p.z});this.record(`reached Level ${after.level}${after.tier>before.tier?' · new suit & shot style!':'.'}`,p.profile)}this.dirty(p)}
  deposit(p){const {metal,crystal}=p.pouch;if(!metal&&!crystal)return;p.profile.metal+=metal;p.profile.crystal+=crystal;p.pouch={metal:0,crystal:0};p.profile.records.deliveries++;this.awardXp(p,Math.min(12,Math.ceil((metal+crystal)*.6)));this.emit('bank',{playerId:p.id,metal,crystal});if(metal+crystal>=6)this.record(`returned with ${metal} metal + ${crystal} crystal.`,p.profile)}
  hurt(p,damage,source='enemy'){if(!p.online||p.down||p.hurt>0||inHub(p))return;if(p.shuttle){p.profile.metal+=2;p.shuttle=null;this.dirty(p);this.emit('shuttleCancel',{playerId:p.id})}p.hp=Math.max(0,p.hp-damage);p.hurt=.35;this.emit('hurt',{playerId:p.id,damage,source,x:p.x,z:p.z});if(!p.hp)this.down(p)}
  down(p){if(p.shuttle){p.profile.metal+=2;p.shuttle=null;this.dirty(p)}this.clearEvolution(p,'down');p.charge=null;p.burst=null;p.down=true;p.downTime=20;p.revive=0;p.input={x:0,z:0};this.emit('down',{playerId:p.id,x:p.x,z:p.z})}
  evacuate(p){this.clearEvolution(p,'evacuate');p.charge=null;p.burst=null;const lost={metal:Math.ceil(p.pouch.metal*.35),crystal:Math.ceil(p.pouch.crystal*.35)};p.pouch.metal-=lost.metal;p.pouch.crystal-=lost.crystal;Object.assign(p,basePosition(p.profile,p.slot));p.down=false;p.downTime=0;p.revive=0;p.hp=Math.ceil(stats(p.profile).hp*.65);p.oxygen=stats(p.profile).oxygen;p.hurt=2;this.deposit(p);this.emit('evacuate',{playerId:p.id,...lost})}
  gather(p){if(p.gatherCd>0)return 'Collecting…';const n=NODES.filter(n=>this.nodeTimers[n.id]<=0&&dist(n,p)<2.9).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(!n)return 'Walk close to a glowing resource. Then Gather.';const amount=(n.type==='metal'?5:4)+Math.floor(n.zone/2);p.pouch[n.type]+=amount;p.profile.tutorial.gathered++;p.gatherCd=.7;this.nodeTimers[n.id]=18;this.awardXp(p,Math.max(1,3+n.zone*2-Math.max(0,stats(p.profile).level-ZONES[n.zone].recommend-5)));this.emit('pickup',{playerId:p.id,x:n.x,z:n.z,resource:n.type,amount});return null}
  stationAction(p,a){
    const s=this.stations.find(s=>s.id===a.station);if(!s||dist(s,p)>7)return 'Stand beside an O₂ foundation.';
    if(a.type==='stationBuild'){
      if(s.hp>0)return 'This oxygen station is already online.';
      if(stats(p.profile).level<STATIONS[s.id].level)return `Level ${STATIONS[s.id].level} equipment is recommended for this foundation.`;
      if(this.online().some(q=>q.id!==p.id&&!q.down&&dist(q,s)<1.6))return 'Step off the foundation, then build.';
      if(s.zone>frontierOf(p.profile))return 'Defeat the previous region guardian first.';const free=!this.builtStations.has(s.id)&&p.profile.unlocks.includes('station-'+s.id),cost=free?{metal:0,crystal:0}:stationCost(s);if(!this.pay(p,cost))return `Building needs ${cost.metal} metal + ${cost.crystal} crystal.`;
      this.builtStations.add(s.id);s.level=1;s.radius=7;s.maxHp=160+s.zone*60;s.hp=s.maxHp;s.owner=p.id;if(dist(p,s)<1.65){p.x=s.x+(s.x<0?2:-2);p.z=s.z;}
      if(!p.profile.unlocks.includes('station-'+s.id)){p.profile.unlocks.push('station-'+s.id);this.awardXp(p,12)}
      p.profile.tutorial.relay=true;this.dirty(p);this.emit('station',{playerId:p.id,station:s.id,state:'built',x:s.x,z:s.z});
      this.record(`built ${s.name} · shared oxygen online.`,p.profile);
      if(s.id===0)for(let i=0;i<3;i++)this.spawnEnemy({x:s.x+[-6,5,0][i],z:s.z-7-i*2,zone:0},'scout',null,s.id);
      return null;
    }
    if(s.hp<=0)return 'Build this oxygen station first.';
    if(a.type==='stationRepair'){if(s.hp>=s.maxHp)return 'Station is fully repaired.';if(!this.pay(p,STATION_REPAIR_COST))return 'Repair needs 2 metal + 2 crystal.';s.hp=s.maxHp;this.emit('station',{playerId:p.id,station:s.id,state:'repaired',x:s.x,z:s.z});return null}
    if(a.type==='stationUpgrade'){if(s.level>=2)return 'Station is fully expanded.';if(!this.pay(p,STATION_EXPAND_COST))return 'Expansion needs 6 metal + 6 crystal.';s.level=2;s.radius=10;s.maxHp+=120;s.hp=s.maxHp;this.awardXp(p,6);this.emit('station',{playerId:p.id,station:s.id,state:'expanded',x:s.x,z:s.z});return null}
    return 'Choose build, repair or expand.';
  }
  missionMilestone(p,task,index){
    const a=p.profile.aurora,prefix=task==='guardian'?'vault':task,key=prefix+'-'+index;a.milestones||=[];if(a[task]||a.milestones.includes(key))return false;
    a.milestones.push(key);this.awardXp(p,{radar:500,escort:600,guardian:800}[task]);this.dirty(p);this.emit('missionMilestone',{playerId:p.id,task,index,level:stats(p.profile).level,x:p.x,z:p.z});return true;
  }
  auroraReward(p,task){
    const a=p.profile.aurora;if(a[task])return false;a[task]=true;
    if(task==='escort')a.escortCheckpoint=3;
    // Missing milestones (e.g. a late helper) are paid once at completion. The
    // same total reward is retained, with progress flags preventing retry farms.
    const chunk={radar:500,escort:600,guardian:800}[task],prefix=task==='guardian'?'vault':task;a.milestones||=[];let paid=0;
    for(const i of [1,2]){const key=prefix+'-'+i;if(a.milestones.includes(key))paid+=chunk;else a.milestones.push(key);}
    const reward=AURORA.rewards[task];p.profile.metal+=reward.metal;p.profile.crystal+=reward.crystal;this.awardXp(p,reward.xp-paid);
    p.oxygen=Math.min(stats(p.profile).oxygen,p.oxygen+30);this.dirty(p);this.record(`completed Aurora ${task==='radar'?'radar survey':task==='escort'?'power-rover escort':'mechanical guardian'} · permanent progress saved.`,p.profile);this.emit('auroraComplete',{playerId:p.id,task,x:p.x,z:p.z});this.emit('auroraMission',{playerId:p.id,task,x:p.x,z:p.z,message:`${task==='radar'?'Radar survey':task==='escort'?'Power delivered':'Celestial guardian defeated'} · LV ${levelCap(p.profile)} unlocked. Progress saved.`});return true;
  }
  auroraEligible(p,task){const a=p.profile.aurora;return p.online&&!p.down&&sixCleared(p.profile)&&a.arrived&&(task==='radar'||a.radar)&&(task!=='guardian'||a.escort)&&(task==='guardian'||!a[task])}
  auroraAction(p,a){
    if(!sixCleared(p.profile))return 'Clear all six original guardians before the Aurora expedition.';
    if(!p.profile.aurora.arrived)return 'Establish your new home at Aurora Outpost first.';
    const task=a.target||(!p.profile.aurora.radar?'radar':!p.profile.aurora.escort?'escort':'guardian');
    if(!['radar','escort','guardian'].includes(task))return 'Choose the radar, power rover or guardian.';
    if(task!=='radar'&&!p.profile.aurora.radar)return 'Complete your radar survey first.';
    if(task==='guardian'&&!p.profile.aurora.escort)return 'Complete your power-rover escort first.';
    const object=task==='radar'?this.aurora.radar:task==='escort'?this.aurora.rover:this.aurora.guardian;
    const resume=task==='escort'&&!['moving','paused'].includes(object.stage)&&dist(p,roverPosition(p.profile.aurora.escortCheckpoint))<=7;
    if(dist(p,object)>7&&!resume)return `Stand beside the ${task==='radar'?'survey radar':task==='escort'?'power rover':'vault beacon'}.`;
    if(task==='escort'&&['moving','paused'].includes(object.stage)){
      if(!object.participants.includes(p.id)&&this.auroraEligible(p,'escort'))object.participants.push(p.id);
      if(object.hp>=object.maxHp)return 'Rover is fully repaired. Stay in its moving O₂ circle.';
      if(!this.pay(p,{metal:6,crystal:3}))return 'Rover repair needs 6 metal + 3 crystal.';
      object.hp=Math.min(object.maxHp,object.hp+120);this.emit('roverRepair',{playerId:p.id,x:object.x,z:object.z});return null;
    }
    if(p.profile.aurora[task]&&task!=='guardian')return 'This permanent Aurora mission is already complete.';
    const required=task==='radar'?31:task==='escort'?36:41;if(stats(p.profile).level<required)return `Reach Level ${required} for this Aurora mission.`;
    if(task==='radar'){
      if(object.state!=='active'){this.clearAuroraThreats('radar');const resume=Math.min(2,(p.profile.aurora.milestones||[]).filter(k=>k.startsWith('radar-')).length);Object.assign(object,{state:'active',progress:object.required*resume/3,wave:resume,abandoned:0,participants:[]});this.emit('auroraStart',{playerId:p.id,task,x:object.x,z:object.z});}
      if(!object.participants.includes(p.id))object.participants.push(p.id);return null;
    }
    if(task==='escort'){
      this.clearAuroraThreats('escort');const checkpoint=clamp(p.profile.aurora.escortCheckpoint,0,3);Object.assign(object,roverPosition(checkpoint),{stage:'moving',checkpoint,hp:object.maxHp,wave:checkpoint-1,participants:[p.id],abandoned:0});
      this.emit('auroraStart',{playerId:p.id,task,x:object.x,z:object.z,checkpoint});return null;
    }
    return this.startAuroraGuardian(object,p);
  }
  startAuroraGuardian(e,p){
    if(!this.auroraEligible(p,'guardian'))return 'Complete your radar survey and power-rover escort first.';
    if(stats(p.profile).level<41)return 'Reach Level 41 for the mechanical guardian.';
    if(e.state==='active')return 'The mechanical guardian is already active. Join your crew nearby.';
    e.state='active';e.time=0;e.hp=100;e.participants=[p.id];e.abandoned=0;
    const enemy=this.spawnEnemy({x:e.x,z:e.z-7,zone:8},'boss',e.id);
    if(!enemy){e.state='idle';e.participants=[];return 'Too many arrivals. Try again shortly.'}
    const crew=this.bossCrew({zone:8,x:e.x,z:e.z}).length;
    Object.assign(enemy,{auroraGuardian:true,coreOpen:false,coreClock:0,coreRemaining:7,baseMaxHp:e.health,crewCount:crew,crewScale:crewScale(crew),hp:e.health*crewScale(crew),maxHp:e.health*crewScale(crew)});
    this.emit('event',{name:e.name,state:'active',zone:8,x:e.x,z:e.z});return null;
  }
  auroraWave(task,checkpoint=0){
    const center=task==='radar'?this.aurora.radar:this.aurora.rover,zone=task==='radar'?6:7;
    const crew=Math.max(1,this.online().filter(p=>!p.down&&dist(p,center)<24).length),count=Math.min(6,3+Math.floor((crew-1)/2));
    for(let i=0;i<count;i++){const e=this.spawnEnemy({x:center.x+(i%2?12:-12),z:center.z-6-i*3,zone},['runner','scout','spitter'][(checkpoint+i)%3]);if(e)e.auroraTask=task;}
    this.emit('auroraWave',{task,checkpoint,x:center.x,z:center.z});
  }
  clearAuroraThreats(task){
    const owned=[...this.enemies,...this.arrivals].filter(e=>e.auroraTask===task),owners=new Set(owned.map(e=>e.id));
    for(const arrival of this.arrivals)if(arrival.auroraTask===task&&arrival.phase==='warning')this.emit('spawnCancelled',{id:arrival.id,x:arrival.x,z:arrival.z});
    // Retrying removes the abandoned attempt without treating cleanup as a kill.
    this.enemies=this.enemies.filter(e=>e.auroraTask!==task);this.arrivals=this.arrivals.filter(e=>e.auroraTask!==task);
    this.hazards=this.hazards.filter(h=>h.auroraTask!==task&&!owners.has(h.owner));
  }
  updateAurora(dt){
    const radar=this.aurora.radar,rover=this.aurora.rover;
    if(radar.state==='active'){
      const present=this.online().filter(p=>this.auroraEligible(p,'radar')&&stats(p.profile).level>=31&&dist(p,radar)<10);
      for(const p of present)if(!radar.participants.includes(p.id))radar.participants.push(p.id);
      if(present.length){radar.abandoned=0;radar.progress=Math.min(radar.required,radar.progress+dt);const wave=Math.min(3,1+Math.floor(radar.progress/(radar.required/3)));if(wave>radar.wave){radar.wave=wave;this.auroraWave('radar',wave-1)}
        for(const p of present)for(const i of [1,2])if(radar.progress>=radar.required*i/3)this.missionMilestone(p,'radar',i);
        if(radar.progress>=radar.required-1e-8){radar.state='complete';for(const p of present)if(radar.participants.includes(p.id))this.auroraReward(p,'radar');this.emit('auroraRadar',{state:'complete',x:radar.x,z:radar.z});}
      }else{radar.abandoned+=dt;if(radar.abandoned>=12){this.clearAuroraThreats('radar');radar.state='idle';radar.progress=0;radar.participants=[];}}
    }
    if(['moving','paused'].includes(rover.stage)){
      const present=this.online().filter(p=>this.auroraEligible(p,'escort')&&stats(p.profile).level>=36&&dist(p,rover)<=rover.radius+1);
      for(const p of present)if(!rover.participants.includes(p.id))rover.participants.push(p.id);
      if(rover.hp<=0){this.clearAuroraThreats('escort');rover.stage='failed';rover.hp=0;this.emit('roverFailed',{x:rover.x,z:rover.z,checkpoint:rover.checkpoint});}
      else if(!present.length){rover.stage='paused';rover.abandoned+=dt;if(rover.abandoned>=12){this.clearAuroraThreats('escort');rover.stage='failed';this.emit('roverFailed',{x:rover.x,z:rover.z,checkpoint:rover.checkpoint});}}
      else{
        rover.stage='moving';rover.abandoned=0;
        if(rover.wave<rover.checkpoint){rover.wave=rover.checkpoint;this.auroraWave('escort',rover.checkpoint);}
        rover.z=Math.max(AURORA.roverEnd.z,rover.z-AURORA.roverSpeed*dt);
        const next=Math.min(3,Math.floor((AURORA.roverStart.z-rover.z)/(AURORA.roverStart.z-AURORA.roverEnd.z)*3+1e-8));
        if(next>rover.checkpoint){rover.checkpoint=next;for(const p of present)if(p.profile.aurora.escortCheckpoint>=next-1){p.profile.aurora.escortCheckpoint=next;if(next<3)this.missionMilestone(p,'escort',next);this.dirty(p);this.emit('roverCheckpoint',{playerId:p.id,checkpoint:next,x:rover.x,z:rover.z});}}
        if(next>=3){rover.stage='complete';for(const p of present)if(p.profile.aurora.escortCheckpoint>=3)this.auroraReward(p,'escort');this.emit('auroraEscort',{state:'complete',x:rover.x,z:rover.z});}
      }
    }
    rover.health=Math.max(0,rover.hp/rover.maxHp);
  }
  action(p,a,now=Date.now()){
    if(!p?.online)return 'Reconnect to your explorer.';if(!a||typeof a.type!=='string')return 'Invalid action.';
    if(a.type==='input'){if(!Number.isFinite(a.x)||!Number.isFinite(a.z))return 'Invalid direction.';const l=Math.max(1,Math.hypot(a.x,a.z));p.input={x:a.x/l,z:a.z/l};p.lastInput=now;p.rescuing=!!a.rescuing;return null}
    if(['dash','skill','role'].includes(a.type))return 'Move to aim. Your suit fires automatically.';
    if(a.type==='name'){p.profile.name=cleanName(a.name);this.dirty(p);return null}
    if(a.type==='return'){if(!p.down)return 'Walk home to secure all of your supplies.';this.evacuate(p);return null}
    if(p.down)return 'Wait for a rescue, or evacuate to base.';
    if(a.type==='aurora')return this.auroraAction(p,a);
    if(a.type==='resumeAurora'){
      if(!inHub(p))return 'Return to a home base before taking the checkpoint shuttle.';
      const progress=p.profile.aurora,checkpoint=progress.escortCheckpoint;
      if(!sixCleared(p.profile)||!progress.arrived||!progress.radar||progress.escort||!Number.isInteger(checkpoint)||checkpoint<=0||checkpoint>3)return 'Save a power-rover checkpoint before requesting this shuttle.';
      const center=roverPosition(checkpoint),candidates=[];
      for(const radius of [3,5,1])for(let i=0;i<16;i++){const angle=i*Math.PI/8;candidates.push({x:center.x+Math.cos(angle)*radius,z:center.z+Math.sin(angle)*radius});}
      const threats=[...this.enemies.filter(e=>e.hp>0),...this.arrivals.filter(e=>e.phase==='warning')];
      const target=candidates.find(point=>this.clear(point.x,point.z)&&zoneAt(point)===7&&
        !threats.some(e=>dist(e,point)<ENEMY_ARRIVAL.playerDistance+this.enemyRadius(e.type))&&
        !this.hazards.some(h=>h.time>0&&dist(h,point)<h.radius+2)&&
        !this.online().some(q=>q.id!==p.id&&dist(q,point)<1.6));
      if(!target)return 'The saved rover checkpoint is under attack. No safe landing; no metal charged.';
      if(!this.pay(p,{metal:2}))return 'Checkpoint shuttle needs 2 metal.';
      this.clearEvolution(p,'travel');
      Object.assign(p,target,{input:{x:0,z:0},rescuing:false,shuttle:null,charge:null,burst:null});
      this.emit('auroraResume',{playerId:p.id,checkpoint,x:p.x,z:p.z});this.emit('auroraMission',{playerId:p.id,task:'escort',x:p.x,z:p.z,message:`Returned to rover checkpoint ${checkpoint}. Interact at the restart marker to resume this leg.`});return null;
    }
    if(a.type==='travelBase'){
      if(!inHub(p))return 'Take the base shuttle from a safe home base.';
      const base=Number(a.base);if(![1,2].includes(base))return 'Choose Starpath Base or Aurora Outpost.';
      if(base===2&&!sixCleared(p.profile))return 'Clear all six original guardians before visiting Aurora Outpost.';
      this.clearEvolution(p,'base');this.deposit(p);Object.assign(p,basePosition({...p.profile,homeBase:base},p.slot));p.input={x:0,z:0};p.shuttle=null;p.charge=null;p.burst=null;
      if(base===2)this.arriveAurora(p);
      p.hp=stats(p.profile).hp;p.oxygen=stats(p.profile).oxygen;this.dirty(p);this.emit('baseTravel',{playerId:p.id,base,x:p.x,z:p.z});return null;
    }
    if(a.type==='reaction'){if(this.time-p.lastReaction<3)return 'Give your crew a moment.';const r=REACTIONS[a.key];if(!r)return 'Choose a signal.';p.lastReaction=this.time;const message={id:++this.eventId,playerId:p.id,name:p.profile.name,emoji:r[0],text:r[1],x:p.x,z:p.z,time:this.time};this.messages.push(message);this.messages=this.messages.slice(-12);this.emit('reaction',message);return null}
    if(a.type==='post'){if(!inHub(p))return 'Visit base to leave a message.';if(this.time-(p.lastPost??-99)<15)return 'Let others leave a message too.';if(!REACTIONS[a.key])return 'Choose a message.';p.lastPost=this.time;this.record(REACTIONS[a.key][1],p.profile);return null}
    if(a.type==='gather')return this.gather(p);
    if(['stationBuild','stationRepair','stationUpgrade'].includes(a.type))return this.stationAction(p,a);
    if(a.type==='exchange'){if(!inHub(p))return 'Exchange at base.';this.deposit(p);const n=a.batch===5?5:1;if(!this.pay(p,{metal:n*6}))return 'Exchange needs 6 metal per crystal.';p.profile.crystal+=n;this.dirty(p);return null}
    if(a.type==='weapon'){
      if(!inHub(p))return 'Refit weapons at base.';const key=a.weapon,w=WEAPONS[key];if(!w)return 'Choose a weapon.';this.deposit(p);
      if(a.upgrade){const rank=p.profile.weapons[key],cost=weaponCost(p.profile,key);if(rank>=5)return 'Weapon is fully upgraded.';if(stats(p.profile).level<cost.level)return `Reach Level ${cost.level}.`;if(!this.pay(p,cost))return 'Gather more metal and crystal.';p.profile.weapons[key]++;this.awardXp(p,6)}
      if(!p.profile.weapons[key])return 'Unlock this weapon first.';this.clearEvolution(p,'refit');p.profile.weapon=key;p.charge=null;p.burst=null;p.fire=.3;this.dirty(p);this.emit('refit',{playerId:p.id,weapon:key});return null;
    }
    if(a.type==='suit'){if(!inHub(p))return 'Change suits at base.';if(!Number.isInteger(a.suit)||a.suit < -1||a.suit>=stats(p.profile).tier)return 'This suit is not unlocked yet.';p.profile.suit=a.suit;this.dirty(p);this.emit('wardrobe',{playerId:p.id});return null}
    if(a.type==='shuttle'){
      if(p.shuttle)return 'Shuttle is already arriving.';const station=this.stations.find(s=>s.id===a.station&&s.hp>0&&dist(p,s)<s.radius);if(!station)return 'Stand inside an online oxygen field.';
      if(this.enemies.some(e=>e.hp>0&&dist(p,e)<18)||this.arrivals.some(e=>e.phase==='warning'&&dist(p,e)<18))return 'Clear nearby enemies before calling the shuttle.';
      if(!this.pay(p,{metal:2}))return 'Shuttle needs 2 metal.';this.clearEvolution(p,'shuttle');p.charge=null;p.burst=null;p.shuttle={time:3,x:p.x,z:p.z,hp:p.hp};return null;
    }
    if(a.type==='deploy'){
      if(!inHub(p))return 'Deploy from base.';const station=this.stations.find(s=>s.id===a.station&&s.hp>0&&p.profile.visited.includes(s.id)&&s.zone<=frontierOf(p.profile));if(!station)return 'Visit and build this station first.';
      if(this.enemies.some(e=>e.hp>0&&dist(e,station)<12)||this.arrivals.some(e=>e.phase==='warning'&&dist(e,station)<12))return 'This outpost is under attack.';
      this.clearEvolution(p,'deploy');this.deposit(p);p.x=station.x+(station.x<0?2:-2);p.z=station.z;p.input={x:0,z:0};p.oxygen=stats(p.profile).oxygen;this.emit('deployed',{playerId:p.id,x:p.x,z:p.z});return null;
    }
    if(a.type==='train'){
      if(!inHub(p))return 'Return to base to train or shop.';if(!['oxygen','armor'].includes(a.module))return 'Choose an upgrade.';
      const cost=trainingCost(p.profile,a.module);if(p.profile.modules[a.module]>=8)return 'Equipment is fully upgraded.';if(stats(p.profile).level<cost.level)return `Reach Level ${cost.level} for this upgrade.`;
      this.deposit(p);if(!this.pay(p,cost))return 'Gather more metal and crystal, then return to base.';
      p.profile.modules[a.module]++;this.awardXp(p,12);const s=stats(p.profile);p.hp=s.hp;p.oxygen=s.oxygen;
      this.emit('train',{playerId:p.id,module:a.module,x:p.x,z:p.z});this.record(`upgraded ${a.module==='weapon'?'their blaster':a.module==='oxygen'?'their oxygen pack':'their armor'}.`,p.profile);return null;
    }
    if(a.type==='skin'){if(!inHub(p))return 'Return to the gear shop to change accents.';if(!['mint','coral','violet'].includes(a.skin))return 'Choose a suit accent.';p.profile.skin=a.skin;this.dirty(p);this.emit('wardrobe',{playerId:p.id});return null}
    if(a.type==='build'){
      const spec=TOWERS[a.tower],pad=PADS.find(pad=>pad.id===a.pad);if(!spec||!pad)return 'Choose a turret foundation.';if(dist(p,pad)>12)return 'Move closer to that turret foundation.';
      if(this.towers.some(t=>t.pad===pad.id&&t.hp>0))return 'A turret is already here.';if(this.online().some(q=>!q.down&&dist(q,pad)<1.1))return 'An explorer is standing on this foundation.';
      if(!this.pay(p,spec))return 'Gather more metal and crystal.';this.towers.push({id:this.uid++,pad:pad.id,type:a.tower,tier:1,owner:p.id,x:pad.x,z:pad.z,hp:100,maxHp:100,level:1,cd:0});this.awardXp(p,5);this.emit('build',{playerId:p.id,x:pad.x,z:pad.z});return null;
    }
    if(a.type==='towerRepair'||a.type==='towerAdvance'){
      const t=this.towers.find(t=>t.id===a.id&&t.hp>0);if(!t||dist(t,p)>13)return 'Walk closer to the turret.';
      if(a.type==='towerRepair'){if(t.hp>=t.maxHp)return 'Turret is fully repaired.';if(!this.pay(p,towerRepairPrice(t)))return 'Gather more repair supplies.';t.hp=t.maxHp;this.dirty(p);this.emit('build',{playerId:p.id,x:t.x,z:t.z});return null;}
      const tier=t.tier||1,cost=towerAdvancePrice(tier);if(t.level<5)return 'Upgrade the turret to Level 5 first.';if(tier>=3)return 'Starfall technology complete.';
      if(towerTierUnlocked(p.profile,stats(p.profile).level)<=tier)return `Reach Level ${cost.level} and establish the next chapter base.`;
      if(!this.pay(p,cost))return 'Gather more advancement supplies.';t.tier=tier+1;t.maxHp=towerStats(t).maxHp;t.hp=t.maxHp;this.dirty(p);this.emit('build',{playerId:p.id,x:t.x,z:t.z});return null;
    }
    if(a.type==='upgrade'){const t=this.towers.find(t=>t.id===a.id);if(!t||dist(t,p)>13)return 'Walk closer to the turret.';if(t.level>=5)return 'Turret fully upgraded.';if(stats(p.profile).level<(t.level-1)*5+1)return `Reach Level ${(t.level-1)*5+1} to improve this turret.`;if(!this.pay(p,towerUpgradeCost(t.level)))return 'Gather more supplies.';t.level++;t.maxHp=towerStats(t).maxHp;t.hp=t.maxHp;this.awardXp(p,5);this.emit('build',{playerId:p.id,x:t.x,z:t.z});return null}
    if(a.type==='event'){
      const e=this.events.find(e=>e.id===a.id);if(!e||dist(p,e)>7)return 'Walk closer to the guardian beacon.';return this.startGuardian(e,p);
    }
    return 'Unknown action.';
  }
  bossCrew(e){return this.online().filter(p=>!p.down&&!inHub(p)&&dist(p,e)<30&&frontierOf(p.profile)>=e.zone)}
  startGuardian(e,p){
    if(e.aurora)return this.startAuroraGuardian(e,p);
    if(e.state!=='idle')return 'Guardian is active or recovering.';if(e.zone>frontierOf(p.profile))return 'Defeat the previous guardian first.';if(stats(p.profile).level<ZONES[e.zone].recommend)return `Reach Level ${ZONES[e.zone].recommend}.`;
    e.state='active';e.time=0;e.hp=100;e.participants=[p.id];e.spawned=0;e.abandoned=0;
    const enemy=this.spawnEnemy({x:e.x,z:e.z-6,zone:e.zone},'boss',e.id);if(!enemy){e.state='idle';e.participants=[];return 'Too many arrivals. Try again shortly.'}
    const crew=this.bossCrew(e).length;Object.assign(enemy,{baseMaxHp:e.health,crewCount:crew,crewScale:crewScale(crew)});enemy.hp=enemy.maxHp=e.health*crewScale(crew);this.emit('event',{name:e.name,state:'active',zone:e.zone,x:e.x,z:e.z});return null;
  }
  spawnEnemy(camp,kind=null,event=null,station=null){
    if(!camp||!Number.isFinite(camp.x)||!Number.isFinite(camp.z)||!ZONES[camp.zone])return null;
    if(this.enemies.filter(e=>e.hp>0).length+this.arrivals.length>=48)return null;
    const zone=camp.zone,type=kind||ENEMY_ROSTERS[zone][this.uid%ENEMY_ROSTERS[zone].length],boss=type==='boss',spec=enemyStats(zone,type);
    const hp=spec.hp,e={id:this.uid++,x:null,z:null,homeX:camp.x,homeZ:camp.z,zone,type,hp,maxHp:hp,speed:spec.speed,damage:spec.damage,cd:1.2,specialCd:boss?3:4,slow:0,event,station,contributors:{},camp:camp.id,phase:'waiting',warnUntil:0,retryAt:this.time};
    this.arrivals.push(e);this.placeArrival(e);return e;
  }
  enemyRadius(type){return type==='boss'?2.5:type==='brute'?1.2:.8}
  safeArrival(x,z,type,zone,ignoreId=null){
    const r=this.enemyRadius(type),point={x,z};if(Math.hypot(Math.max(0,Math.abs(x)-14),Math.max(1070-depth(point),0,depth(point)-1140))<3+r)return false;
    if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>BOUNDS.halfWidth-r||z<BOUNDS.minZ+r||z>GATE_Z-3-r||zoneAt(point)!==zone)return false;
    const b=AURORA.base,d=depth(point),hubDistance=Math.hypot(Math.max(0,Math.abs(x)-b.halfWidth),Math.max(b.minDepth-d,0,d-b.maxDepth));
    if(hubDistance<ENEMY_ARRIVAL.stationBuffer+r)return false;
    if(this.online().some(p=>dist(p,point)<ENEMY_ARRIVAL.playerDistance+r))return false;
    if(this.stations.some(s=>s.hp>0&&dist(s,point)<s.radius+ENEMY_ARRIVAL.stationBuffer+r))return false;
    const rover=this.aurora.rover;if(rover.hp>0&&dist(rover,point)<rover.radius+ENEMY_ARRIVAL.stationBuffer+r)return false;
    if(!this.clear(x,z)||OBSTACLES.some(o=>dist(o,point)<o.r+r)||EVENTS.some(o=>dist(o,point)<1.7+r)||this.towers.some(t=>t.hp>0&&dist(t,point)<1.05+r))return false;
    if(this.enemies.some(e=>e.hp>0&&dist(e,point)<r+this.enemyRadius(e.type)+.5))return false;
    return !this.arrivals.some(e=>e.id!==ignoreId&&e.phase==='warning'&&dist(e,point)<r+this.enemyRadius(e.type)+.5);
  }
  placeArrival(e){
    const phase=random(e.id+11)*Math.PI*2,candidates=[{x:e.homeX+(random(e.id+1)*2-1)*1.5,z:e.homeZ+(random(e.id+2)*2-1)*1.5}];
    for(const radius of [4,8,12,16,20])for(let i=0;i<16;i++){
      const angle=phase+i*Math.PI/8;candidates.push({x:e.homeX+Math.cos(angle)*radius,z:e.homeZ+Math.sin(angle)*radius});
    }
    const point=candidates.find(p=>this.safeArrival(p.x,p.z,e.type,e.zone,e.id));
    if(!point){e.phase='waiting';e.x=e.z=null;e.retryAt=this.time+ENEMY_ARRIVAL.retrySeconds;return false}
    Object.assign(e,point,{phase:'warning',warnUntil:this.time+ENEMY_ARRIVAL.warningSeconds});
    this.emit('spawnWarning',{id:e.id,x:e.x,z:e.z,kind:e.type,duration:ENEMY_ARRIVAL.warningSeconds});return true;
  }
  updateArrivals(){
    const keep=[];
    for(const e of this.arrivals){
      if(e.event&&!this.events.some(v=>v.id===e.event&&v.state==='active'))continue;
      if(e.station!==null&&!this.stations.some(s=>s.id===e.station&&s.hp>0))continue;
      if(!e.event&&!this.online().some(p=>!p.down&&!inHub(p)&&dist(p,{x:e.homeX,z:e.homeZ})<36)){
        // Abandoned warnings release their reservation; otherwise a long trip
        // would fill the shared cap with unseen arrivals in distant regions.
        continue;
      }
      if(e.phase==='waiting'){
        if(this.time>=e.retryAt)this.placeArrival(e);keep.push(e);continue;
      }
      // Recheck during the countdown AND at materialization. No fallback may
      // bypass this gate, even when all eight players occupy the local area.
      if(!this.safeArrival(e.x,e.z,e.type,e.zone,e.id)){
        this.emit('spawnCancelled',{id:e.id,x:e.x,z:e.z});this.placeArrival(e);keep.push(e);continue;
      }
      if(this.time+1e-8<e.warnUntil){keep.push(e);continue}
      const {phase,warnUntil,retryAt,...enemy}=e;
      Object.assign(enemy,{bornAt:this.time,readyAt:this.time+ENEMY_ARRIVAL.windupSeconds,wake:ENEMY_ARRIVAL.windupSeconds});
      this.enemies.push(enemy);this.emit('spawn',{id:enemy.id,x:enemy.x,z:enemy.z,kind:enemy.type});
    }
    this.arrivals=keep;
  }
  damageEnemy(e,damage,owner,kind='pulse'){
    if(!this.enemies.includes(e)||e.hp<=0)return;
    damage=bossDamage(this,e,damage,owner);
    if(e.type==='shield'&&kind!=='rail'){const p=this.players.get(owner),f={x:e.faceX??e.x,z:e.faceZ??e.z+1};if(p){const a={x:p.x-e.x,z:p.z-e.z},b={x:f.x-e.x,z:f.z-e.z};if(a.x*b.x+a.z*b.z>0)damage*=.55}}
    e.hp-=damage;if(e.auroraGuardian)for(const p of this.bossCrew(e))if(this.auroraEligible(p,'guardian'))for(const [i,ratio]of [[1,.5],[2,.25]])if(e.hp/e.maxHp<=ratio)this.missionMilestone(p,'guardian',i);if(owner)e.contributors[owner]=this.time;this.emit('hit',{x:e.x,z:e.z});if(e.hp>0)return;
    const boss=e.type==='boss',elite=['brute','shield','support','artillery'].includes(e.type);
    for(const p of this.online())if(!p.down&&!inHub(p)&&dist(p,e)<stats(p.profile).range+2.5)e.contributors[p.id]=this.time;
    for(const [id,time]of Object.entries(e.contributors)){
      const p=this.players.get(id);if(!p?.online||p.down||inHub(p)||this.time-time>18||dist(p,e)>30)continue;
      p.profile.records.kills++;if(!boss){p.pouch.metal+=2+Math.floor(e.zone/2);if(elite||p.profile.records.kills%2===0)p.pouch.crystal+=elite?2+Math.floor(e.zone/2):1+Math.floor(e.zone/3);const over=Math.max(0,stats(p.profile).level-ZONES[e.zone].recommend-5);this.awardXp(p,Math.max(1,(6+e.zone*4)*(elite?1.3:1)*(over?Math.max(.1,1-over*.18):1)))}
      const t=p.profile.tutorial;if(t.relay&&!t.defended&&e.zone===0){t.defenseKills++;if(t.defenseKills>=3){t.defended=true;p.pouch.metal+=8;p.pouch.crystal+=6;p.oxygen=Math.min(stats(p.profile).oxygen,p.oxygen+20);this.awardXp(p,18);this.emit('tutorial',{playerId:p.id,state:'defended',x:p.x,z:p.z});this.record('secured their first oxygen outpost.',p.profile)}}
    }
    this.emit('kill',{x:e.x,z:e.z,boss});if(boss){const event=this.events.find(v=>v.id===e.event);if(event){for(const id of Object.keys(e.contributors))if(!event.participants.includes(id))event.participants.push(id);this.completeEvent(event)}}
  }
  evolutionMeta(p,s=stats(p.profile),phase=combatEvolution(p.profile)){return {owner:p.id,weapon:s.weapon,style:s.style,phase,level:s.level}}
  clearEvolution(p,reason='cancelled'){
    for(const list of [this.beams,this.orbs])for(const a of list)if(a.owner===p.id)this.emit('evoEnd',{owner:p.id,weapon:a.weapon,lifeId:a.id,id:a.id,x:a.x,z:a.z,reason});
    this.beams=this.beams.filter(a=>a.owner!==p.id);this.orbs=this.orbs.filter(a=>a.owner!==p.id);
  }
  evolvedPulse(p,target,damage,s){
    const meta=this.evolutionMeta(p,s),origin={x:target.x,z:target.z};
    this.emit('evoPulse',{...meta,sx:p.x,sz:p.z,...origin,target:target.id,duration:.18,damage});
    this.damageEnemy(target,damage,p.id,'pulse');
    // Fragments go only to other living enemies. They call damageEnemy directly,
    // never playerShot, so kills or another fragment cannot recursively split.
    const fragments=this.enemies.filter(e=>e.hp>0&&e.id!==target.id&&dist(e,origin)<3.4+meta.phase*.35).sort((a,b)=>dist(a,origin)-dist(b,origin)||a.id-b.id).slice(0,meta.phase===3?3:2);
    for(const e of fragments){const amount=damage*(.15+meta.phase*.015);this.emit('evoFragment',{...meta,sx:origin.x,sz:origin.z,x:e.x,z:e.z,target:e.id,duration:.2,damage:amount});this.damageEnemy(e,amount,p.id,'pulse')}
  }
  knockbackEnemy(e,dx,dz,distance){
    if(e.type==='boss'||e.hp<=0)return;
    const r=this.enemyRadius(e.type),extra=Math.max(0,r-.9),start={x:e.x,z:e.z},steps=Math.ceil(distance/.12);
    // Sweep the whole path; a far endpoint on the opposite side of a building
    // must not allow teleporting through it. Brutes retain their wider body.
    for(let i=1;i<=steps;i++){
      const x=start.x+dx*distance*i/steps,z=start.z+dz*distance*i/steps;
      if(Math.abs(x)>BOUNDS.halfWidth-r||z<BOUNDS.minZ+r||z>BOUNDS.maxZ-r||zoneAt({z})!==e.zone||!this.clear(x,z))break;
      if(extra&&Array.from({length:8},(_,j)=>j*Math.PI/4).some(a=>!this.clear(x+Math.cos(a)*extra,z+Math.sin(a)*extra)))break;
      e.x=x;e.z=z;
    }
  }
  evolvedScatter(p,target,s,phase){
    const len=Math.max(.001,dist(p,target)),dx=(target.x-p.x)/len,dz=(target.z-p.z)/len,spread=1.08+(phase-1)*.1;
    const hits=this.enemies.filter(e=>{
      if(e.hp<=0||dist(p,e)>s.range+this.enemyRadius(e.type))return false;
      const x=e.x-p.x,z=e.z-p.z,t=x*dx+z*dz,side=Math.abs(x*dz-z*dx);
      return t>0&&Math.atan2(side,t)<=spread/2+Math.asin(Math.min(.8,this.enemyRadius(e.type)/Math.max(.1,dist(p,e))));
    }).sort((a,b)=>dist(a,p)-dist(b,p)||a.id-b.id).slice(0,3+phase);
    // One hit per enemy, sharing at most the original pellet volley's budget.
    const damage=s.damage*WEAPONS.scatter.damage*(2+s.weaponRank)/Math.max(1,hits.length),targets=[];
    for(const e of hits){
      const from={x:e.x,z:e.z},d=Math.max(.001,dist(p,e));this.damageEnemy(e,damage,p.id,'scatter');
      this.knockbackEnemy(e,(from.x-p.x)/d,(from.z-p.z)/d,1.4+phase*.4);
      targets.push({id:e.id,sx:from.x,sz:from.z,x:e.x,z:e.z,damage});
    }
    this.emit('evoShockwave',{...this.evolutionMeta(p,s,phase),sx:p.x,sz:p.z,x:p.x+dx*s.range,z:p.z+dz*s.range,dx,dz,range:s.range,spread,targets,duration:.34,damage});
  }
  startEvolutionBeam(p,s,charge){
    // A charge resolves into this beam only; the original full-damage rail shot
    // is replaced by six scheduled fractions of exactly that damage budget.
    if(this.beams.some(a=>a.owner===p.id)||this.beams.length>=MAX_PLAYERS)return;
    const ticks=6,tickInterval=.14,duration=ticks*tickInterval,id=this.uid++,phase=charge.phase,damage=s.damage*WEAPONS.rail.damage/ticks;
    const beam={...this.evolutionMeta(p,s,phase),id,lifeId:id,sx:p.x,sz:p.z,x:p.x,z:p.z,dx:charge.dx,dz:charge.dz,range:s.range,width:.74+phase*.14,start:this.time,duration,ticks,tickInterval,next:1,damage,rank:s.weaponRank,followOwner:true};
    this.beams.push(beam);this.emit('evoBeam',{...beam,x:p.x+beam.dx*beam.range,z:p.z+beam.dz*beam.range,totalDamage:damage*ticks});
  }
  startEvolutionOrb(p,target,s,phase){
    // Three per owner covers the regular firing interval without an unbounded
    // projectile list. A saturated owner waits for its next normal shot.
    const limit=p.profile.starfall?.arrived&&s.level>=48?6:3;if(this.orbs.filter(a=>a.owner===p.id).length>=limit||this.orbs.length>=MAX_PLAYERS*6)return false;
    const d=Math.max(.001,dist(p,target)),dx=(target.x-p.x)/d,dz=(target.z-p.z)/d,id=this.uid++,quick=!!p.profile.starfall?.arrived,speed=quick?8:3.8,duration=quick?.9:1.6,firstTick=quick?.12:.2,tickInterval=quick?.14:.26;
    const orb={...this.evolutionMeta(p,s,phase),id,lifeId:id,sx:p.x,sz:p.z,x:p.x,z:p.z,dx,dz,speed,duration,firstTick,tickInterval,start:this.time,next:0,ticks:3+phase,hit:new Set(),damage:s.damage*WEAPONS.arc.damage,range:4.6+phase*.3};
    this.orbs.push(orb);const {hit,...visual}=orb;this.emit('evoOrb',{...visual,x:p.x+dx*speed*duration,z:p.z+dz*speed*duration});return true;
  }
  updateEvolution(){
    const valid=a=>{const p=this.players.get(a.owner);return p?.online&&!p.down&&!p.shuttle&&!inHub(p)&&p.profile.weapon===a.weapon&&combatEvolution(p.profile)>0?p:null};
    const beams=[];
    for(const beam of this.beams){
      const p=valid(beam);if(!p){this.emit('evoEnd',{owner:beam.owner,weapon:beam.weapon,id:beam.id,lifeId:beam.id,x:beam.x,z:beam.z,reason:'owner'});continue}
      beam.x=p.x+(-beam.dz)*(beam.lane||0);beam.z=p.z+beam.dx*(beam.lane||0);
      while(beam.next<=beam.ticks&&this.time+1e-8>=beam.start+beam.next*beam.tickInterval){
        const targets=this.enemies.filter(e=>e.hp>0).map(e=>{const x=e.x-beam.x,z=e.z-beam.z;return {e,t:x*beam.dx+z*beam.dz,side:Math.abs(x*beam.dz-z*beam.dx)}}).filter(v=>v.t>0&&v.t<beam.range&&v.side<beam.width+this.enemyRadius(v.e.type)*.45).sort((a,b)=>a.t-b.t||a.e.id-b.e.id).slice(0,2+beam.rank);
        targets.forEach(({e},i)=>this.damageEnemy(e,beam.damage*Math.pow(.82,i),p.id,'rail'));
        beam.next++;
      }
      if(beam.next>beam.ticks)this.emit('evoEnd',{owner:beam.owner,weapon:beam.weapon,id:beam.id,lifeId:beam.id,x:p.x,z:p.z,reason:'complete'});else beams.push(beam);
    }
    this.beams=beams;
    const orbs=[];
    for(const orb of this.orbs){
      const p=valid(orb);if(!p){this.emit('evoEnd',{owner:orb.owner,weapon:orb.weapon,id:orb.id,lifeId:orb.id,x:orb.x,z:orb.z,reason:'owner'});continue}
      while(orb.next<orb.ticks&&this.time+1e-8>=orb.start+(orb.firstTick??.2)+orb.next*(orb.tickInterval??.26)){
        // Evaluate each discharge at its scheduled position, even if two become
        // due during one simulation step. Damage never scales with frame count.
        const age=(orb.firstTick??.2)+orb.next*(orb.tickInterval??.26),x=orb.sx+orb.dx*orb.speed*age,z=orb.sz+orb.dz*orb.speed*age;
        const target=this.enemies.filter(e=>e.hp>0&&!orb.hit.has(e.id)&&dist({x,z},e)<orb.range).sort((a,b)=>dist(a,{x,z})-dist(b,{x,z})||a.id-b.id)[0];
        if(target){const damage=orb.damage*Math.pow(.8,orb.hit.size);orb.hit.add(target.id);this.emit('evoArc',{owner:orb.owner,weapon:orb.weapon,style:orb.style,phase:orb.phase,level:orb.level,lifeId:orb.id,id:orb.id,hop:orb.hit.size,target:target.id,sx:x,sz:z,x:target.x,z:target.z,duration:.22,damage});this.damageEnemy(target,damage,p.id,'arc')}
        orb.next++;
      }
      const age=Math.min(orb.duration,Math.max(0,this.time-orb.start));orb.x=orb.sx+orb.dx*orb.speed*age;orb.z=orb.sz+orb.dz*orb.speed*age;
      if(this.time+1e-8>=orb.start+orb.duration)this.emit('evoEnd',{owner:orb.owner,weapon:orb.weapon,id:orb.id,lifeId:orb.id,x:orb.x,z:orb.z,reason:'complete'});else orbs.push(orb);
    }
    this.orbs=orbs;
  }
  fireWeapon(p,s){
    const phase=combatEvolution(p.profile);
    if(p.burst&&this.time>=p.burst.at){const e=this.enemies.find(e=>e.id===p.burst.target&&e.hp>0);if(e&&dist(p,e)<=s.range+1)this.playerShot(p,e,p.burst.damage,'pulse');p.burst=null}
    if(p.charge){if(this.time>=p.charge.at){const a=p.charge;if(a.phase)this.startEvolutionBeam(p,s,a);else{const targets=this.enemies.filter(e=>e.hp>0).map(e=>{const x=e.x-p.x,z=e.z-p.z;return{e,t:x*a.dx+z*a.dz,side:Math.abs(x*a.dz-z*a.dx)}}).filter(v=>v.t>0&&v.t<s.range&&v.side<.95+this.enemyRadius(v.e.type)*.45).sort((a,b)=>a.t-b.t).slice(0,2+s.weaponRank);const endpoint={x:p.x+a.dx*s.range,z:p.z+a.dz*s.range};this.emit('shot',{sx:p.x,sz:p.z,...endpoint,kind:'player',weapon:'rail',style:s.style,owner:p.id});targets.forEach(({e},i)=>this.damageEnemy(e,s.damage*WEAPONS.rail.damage*Math.pow(.82,i),p.id,'rail'))}p.charge=null;p.fire=.65}return}
    if(this.beams.some(a=>a.owner===p.id))return;
    if(p.fire>0)return;
    const target=this.enemies.filter(e=>e.hp>0&&dist(p,e)<s.range).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(!target)return;
    const w=WEAPONS[s.weapon],rank=s.weaponRank,d=s.damage;p.fire=fireInterval(p.profile);p.headingX=target.x-p.x;p.headingZ=target.z-p.z;
    if(s.weapon==='pulse'){const damage=d*(rank>1?.69:1);this.playerShot(p,target,damage,'pulse');if(rank>1)p.burst={at:this.time+.12,target:target.id,damage};}
    if(s.weapon==='scatter'){
      if(phase){this.evolvedScatter(p,target,s,phase);return}
      const angle=Math.atan2(target.x-p.x,target.z-p.z),count=2+rank,spread=.54;
      for(let i=0;i<count;i++){const a=angle+(i/(count-1)-.5)*spread,dx=Math.sin(a),dz=Math.cos(a);const hits=this.enemies.filter(e=>e.hp>0).map(e=>{const x=e.x-p.x,z=e.z-p.z;return{e,t:x*dx+z*dz,side:Math.abs(x*dz-z*dx)}}).filter(v=>v.t>0&&v.t<s.range&&v.side<this.enemyRadius(v.e.type)+.18).sort((a,b)=>a.t-b.t);const hit=hits[0]?.e,end=hit||{x:p.x+dx*s.range,z:p.z+dz*s.range};this.emit('shot',{sx:p.x,sz:p.z,x:end.x,z:end.z,kind:'player',weapon:'scatter',style:s.style,owner:p.id});if(hit)this.damageEnemy(hit,d*w.damage,p.id,'scatter')}
    }
    if(s.weapon==='rail'){const len=Math.max(.001,dist(p,target));p.charge={at:this.time+.6,dx:(target.x-p.x)/len,dz:(target.z-p.z)/len,phase};this.emit('charge',{sx:p.x,sz:p.z,x:target.x,z:target.z,style:s.style,playerId:p.id,owner:p.id,weapon:'rail',phase,level:s.level,duration:.6})}
    if(s.weapon==='arc'){if(phase){if(this.startEvolutionOrb(p,target,s,phase)===false)p.fire=.05;return}const hit=new Set();let from=p,next=target;for(let i=0;i<2+rank&&next;i++){hit.add(next.id);this.playerShot(from,next,d*w.damage*Math.pow(.8,i),'arc',p,s);from=next;next=this.enemies.filter(e=>e.hp>0&&!hit.has(e.id)&&dist(from,e)<4.5).sort((a,b)=>dist(from,a)-dist(from,b))[0]}}
  }
  playerShot(from,to,damage,weapon,owner=from,s=stats(owner.profile)){if(weapon==='pulse'&&combatEvolution(owner.profile)){this.evolvedPulse(owner,to,damage,s);return}this.emit('shot',{sx:from.x,sz:from.z,x:to.x,z:to.z,kind:'player',weapon,style:s.style,owner:owner.id});this.damageEnemy(to,damage,owner.id,weapon)}
  shot(from,to,damage,kind,owner,splash=0){this.emit('shot',{sx:from.x,sz:from.z,x:to.x,z:to.z,kind,owner});if(splash){for(const e of this.enemies)if(e.hp>0&&dist(e,to)<splash)this.damageEnemy(e,damage,owner)}else this.damageEnemy(to,damage,owner)}
  completeEvent(e){
    if(e.starfall){const owners=this.enemies.filter(a=>a.event===e.id).map(a=>a.id);for(const a of this.enemies)if(a.event===e.id)a.hp=0;this.arrivals=this.arrivals.filter(a=>a.event!==e.id);this.hazards=this.hazards.filter(h=>!owners.includes(h.owner));e.state='cooldown';e.cooldown=90;for(const id of e.participants){const p=this.players.get(id);if(!p||p.down||dist(p,e)>34||!p.profile.starfall?.arrived||frontierOf(p.profile)<e.zone)continue;const a=p.profile.starfall;if(!a.cleared.includes(e.zone)){a.cleared.push(e.zone);a.complete=a.cleared.includes(11);p.profile.records.bosses++;p.pouch.metal+=180;p.pouch.crystal+=180;this.awardXp(p,1200);this.dirty(p);this.emit('guardianClear',{playerId:p.id,name:e.name,zone:e.zone,first:true,x:e.x,z:e.z});}}return;}
    if(e.aurora){
      const owners=this.enemies.filter(a=>a.event===e.id).map(a=>a.id);for(const enemy of this.enemies)if(enemy.event===e.id)enemy.hp=0;
      this.arrivals=this.arrivals.filter(a=>a.event!==e.id);this.hazards=this.hazards.filter(h=>!owners.includes(h.owner));
      e.state='idle';e.completed=true;e.hp=0;
      for(const id of e.participants){const p=this.players.get(id);if(p&&this.auroraEligible(p,'guardian')&&dist(p,e)<=34){p.profile.records.bosses++;this.auroraReward(p,'guardian');}}
      this.emit('event',{name:e.name,state:'complete',zone:e.zone,x:e.x,z:e.z});return;
    }
    e.state='cooldown';e.cooldown=65;const adds=this.enemies.filter(a=>a.event===e.id&&a.type!=='boss');for(const a of adds)a.hp=0;this.arrivals=this.arrivals.filter(a=>a.event!==e.id);this.hazards=this.hazards.filter(h=>!adds.some(a=>a.id===h.owner)&&!this.enemies.some(a=>a.type==='boss'&&a.event===e.id&&a.id===h.owner));for(const id of e.participants){const p=this.players.get(id);if(!p?.online||p.down||inHub(p)||dist(p,e)>34||frontierOf(p.profile)<e.zone)continue;const first=!p.profile.cleared.includes(e.zone);if(first)p.profile.cleared.push(e.zone);p.profile.records.bosses++;p.pouch.metal+=first?20+e.zone*8:5;p.pouch.crystal+=first?14+e.zone*6:3;this.awardXp(p,first?80+e.zone*40:12);p.oxygen=Math.min(stats(p.profile).oxygen,p.oxygen+25);if(first&&e.zone===0){p.profile.tutorial.advanced=true;this.emit('tutorial',{playerId:p.id,state:'complete'})}this.record(`defeated ${e.name}${first?' · new frontier unlocked!':'.'}`,p.profile);this.emit('guardianClear',{playerId:p.id,zone:e.zone,name:e.name,first,final:first&&p.profile.cleared.length===6,x:e.x,z:e.z})}
    this.emit('event',{name:e.name,state:'complete',zone:e.zone,x:e.x,z:e.z});
  }
  guardianAttack(e,targets){
    const target=targets[0];if(!target)return;const zone=e.zone>=9?e.zone-9:e.zone,phase=e.hp/e.maxHp<.45?2:1;
    const add=(x,z,r=2.3,t=2.4,damage=e.damage)=>{const h={id:this.uid++,x,z,radius:r,time:t,duration:t,damage,owner:e.id};this.hazards.push(h);this.emit('warning',h)};
    if(zone===0)for(const p of targets.slice(0,3))add(p.x,p.z,2.6,2.6);
    if(zone===1){const d=Math.max(1,dist(e,target)),dx=(target.x-e.x)/d,dz=(target.z-e.z)/d;for(let k=1;k<=5;k++)add(e.x+dx*k*2,e.z+dz*k*2,1.55,2.2,e.damage*1.15)}
    if(zone===2){add(target.x,target.z,2.4,2.4);if(this.enemies.filter(n=>n.event===e.event&&n.hp>0).length+this.arrivals.filter(n=>n.event===e.event).length<4)this.spawnEnemy({x:e.x+6,z:e.z,zone:e.zone},'support',e.event)}
    if(zone===3){for(let k=0;k<3+phase;k++){const a=k*Math.PI*2/(3+phase);add(target.x+Math.cos(a)*3.5,target.z+Math.sin(a)*3.5,1.9,2.5)}}
    if(zone===4||zone===5){for(const p of targets.slice(0,4)){add(p.x,p.z,2.2,2.3);if(phase===2)add(p.x+(p.x>0?-4:4),p.z-3,1.9,2.7)}if(zone===5)for(const a of [0,Math.PI])add(e.x+Math.cos(a)*5,e.z+Math.sin(a)*5,2.8,2.8)}
    if(e.auroraGuardian){for(const p of targets.slice(0,4)){add(p.x,p.z,2.6,2.8,e.damage);if(phase===2)add(p.x+(p.x>0?-5:5),p.z-4,2.1,3.1,e.damage*.85)}e.specialCd=5.2;return;}
    e.specialCd=Math.max(3.8,6-zone*.25-(phase-1)*.7);
  }
  step(rawDt,now=Date.now()){
    const people=this.online();if(!people.length)return;const dt=Math.min(.1,rawDt);this.time+=dt;this.lastUsed=now;this.messages=this.messages.filter(m=>this.time-m.time<8);this.nodeTimers=this.nodeTimers.map(t=>Math.max(0,t-dt));
    for(const p of people){
      p.fire-=dt;p.hurt=Math.max(0,p.hurt-dt);p.gatherCd=Math.max(0,p.gatherCd-dt);if(now-p.lastInput>600){p.input={x:0,z:0};p.rescuing=false}
      const s=stats(p.profile);p.maxHpForBoss=s.hp;
      if(p.down){const helper=people.find(q=>!q.down&&q.rescuing&&dist(q,p)<3);p.revive=helper?p.revive+dt:0;p.downTime-=dt;if(p.revive>=2){p.down=false;p.downTime=0;p.revive=0;p.hp=Math.ceil(s.hp*.6);p.oxygen=Math.max(50,p.oxygen);p.hurt=3;if(this.time-helper.lastRescue>50){helper.profile.records.rescues++;helper.lastRescue=this.time;this.awardXp(helper,15);this.record(`rescued ${p.profile.name}.`,helper.profile)}this.emit('revive',{playerId:p.id,x:p.x,z:p.z})}else if(p.downTime<=0)this.evacuate(p);continue}
      const input=Math.hypot(p.input.x,p.input.z);
      if(input>.05&&!p.rescuing){p.headingX=p.input.x/input;p.headingZ=p.input.z/input;const x=p.x+p.input.x*(p.mounted?7.8:MOVE_SPEED)*dt,z=p.z+p.input.z*(p.mounted?7.8:MOVE_SPEED)*dt;if(this.clear(x,p.z))p.x=x;if(this.clear(p.x,z)&&GATE_Z-z<=ZONES[frontierOf(p.profile)].end-.6)p.z=z;else if(GATE_Z-z>ZONES[frontierOf(p.profile)].end-.6&&this.time-(p.gateNotice||-99)>4){p.gateNotice=this.time;this.emit('gateLocked',{playerId:p.id,zone:frontierOf(p.profile)})}}
      if(sixCleared(p.profile)&&inHub(p)&&depth(p)>=AURORA.base.minDepth)this.arriveAurora(p);
      const d=depth(p);if(d>p.profile.records.distance+.05){p.profile.records.distance=Math.round(d*10)/10;this.dirty(p)}
      const zone=zoneAt(p),unlock='region-'+zone;if(zone>0&&!p.profile.unlocks.includes(unlock)){p.profile.unlocks.push(unlock);this.awardXp(p,15+zone*5);this.emit('discover',{playerId:p.id,zone})}
      const source=this.oxygenSource(p);if(source&&!source.base&&!source.rover&&!p.profile.visited.includes(source.id)){p.profile.visited.push(source.id);this.dirty(p)}p.oxygen=clamp(p.oxygen+(source?source.base?34:26:-(input>.05?s.drain:s.drain*(zone>=6?.5:p.profile.tutorial.advanced?.32:.4))*(OXYGEN_FACTORS[zone]||1))*dt,0,s.oxygen);
      if(source&&!source.base&&p.profile.tutorial.gathered>=2&&!p.profile.tutorial.relay){p.profile.tutorial.relay=true;this.dirty(p);this.emit('tutorial',{playerId:p.id,state:'refilled'})}
      if(p.oxygen<=0){p.hp=Math.max(0,p.hp-8*dt);if(!p.hp){this.down(p);continue}}
      if(inHub(p)){p.hp=Math.min(s.hp,p.hp+18*dt);this.deposit(p)}
      if(p.shuttle){const unsafe=input>.05||p.hp<p.shuttle.hp||this.enemies.some(e=>e.hp>0&&dist(e,p)<18)||this.arrivals.some(e=>e.phase==='warning'&&dist(e,p)<18);if(unsafe){p.shuttle=null;p.profile.metal+=2;this.emit('shuttleCancel',{playerId:p.id});this.dirty(p)}else{p.shuttle.time-=dt;if(p.shuttle.time<=0){Object.assign(p,basePosition(p.profile,p.slot));p.shuttle=null;p.charge=null;p.burst=null;this.deposit(p);this.emit('shuttled',{playerId:p.id})}}}
      if(!inHub(p)&&!p.shuttle)this.fireWeapon(p,s);else{this.clearEvolution(p,'base');p.charge=null;p.burst=null}
    }
    this.updateEvolution();
    this.updateAurora(dt);
    // Encounters are regional; a veteran never advances a shared global difficulty.
    for(const c of SPAWNS){
      this.spawnTimers[c.id]-=dt;const crew=people.filter(p=>!p.down&&depth(p)>5&&zoneAt(p)===c.zone&&frontierOf(p.profile)>=c.zone&&dist(p,c)<30).length;
      const present=this.enemies.filter(e=>e.camp===c.id&&e.hp>0).length+this.arrivals.filter(e=>e.camp===c.id).length,cap=Math.min(5,(c.zone>=10?3:2)+Math.floor(crew/2));
      if(this.spawnTimers[c.id]<=0&&crew&&present<cap&&this.enemies.length+this.arrivals.length<38){
        const pack=Math.min(cap-present,1+(c.zone>=9?1:0)+Math.floor((crew-1)/3));let requested=0;
        for(let i=0;i<pack&&this.enemies.length+this.arrivals.length<38;i++){const spec={...c,x:c.x+(i?i%2?2.1:-2.1:0),z:c.z+Math.floor(i/2)*2.3},roster=ENEMY_ROSTERS[c.zone];if(this.spawnEnemy(spec,roster[(c.id+i+Math.floor(this.time/18))%roster.length]))requested++;}
        if(requested)this.spawnTimers[c.id]=18/(1+.1*Math.max(0,crew-1));
      }
    }

    for(const ev of this.events){
      if(ev.state==='cooldown'){ev.cooldown-=dt;if(ev.cooldown<=0){ev.state='idle';ev.hp=100}continue}
      if(ev.state==='idle'){const p=people.find(p=>!p.down&&dist(p,ev)<5.5&&frontierOf(p.profile)>=ev.zone&&stats(p.profile).level>=ZONES[ev.zone].recommend&&(ev.aurora?this.auroraEligible(p,'guardian')&&!p.profile.aurora.guardian:!(ev.starfall?p.profile.starfall?.cleared:p.profile.cleared)?.includes(ev.zone)));if(p)this.startGuardian(ev,p);continue}
      ev.time+=dt;const nearby=people.filter(p=>!p.down&&!inHub(p)&&dist(p,ev)<32&&(!ev.aurora||this.auroraEligible(p,'guardian')));for(const p of nearby)if(!ev.participants.includes(p.id))ev.participants.push(p.id);
      ev.abandoned=nearby.length?0:ev.abandoned+dt;if(ev.abandoned>12){ev.state='idle';ev.participants=[];this.enemies=this.enemies.filter(e=>e.event!==ev.id);this.arrivals=this.arrivals.filter(e=>e.event!==ev.id);this.hazards=this.hazards.filter(h=>this.enemies.some(e=>e.id===h.owner))}
    }
    this.updateArrivals();
    for(const t of this.towers){t.cd-=dt;const spec=towerStats(t),target=this.enemies.filter(e=>e.hp>0&&dist(t,e)<spec.range).sort((a,b)=>dist(a,t)-dist(b,t))[0];if(target&&t.cd<=0){this.shot(t,target,spec.damage,t.type,t.owner,spec.splash);if(t.type==='frost'){target.slow=2;if(target.type==='boss'&&(t.tier||1)>=2)target.brittle=1.8;}t.cd=spec.interval}}
    for(const e of this.enemies){
      if(e.hp<=0)continue;e.cd-=dt;e.slow=Math.max(0,e.slow-dt);e.brittle=Math.max(0,(e.brittle||0)-dt);e.wake=Math.max(0,(e.readyAt||0)-this.time);if(e.wake>1e-8)continue;
      if(e.type==='boss'&&e.zone<8)rebalanceBoss(this,e,dt);if(updateBoss(this,e,people,dt))continue;
      if(e.auroraGuardian){const before=e.coreOpen;e.coreClock+=dt;const phase=e.coreClock%12;e.coreOpen=phase>=7;e.coreRemaining=e.coreOpen?12-phase:7-phase;if(e.coreOpen!==before)this.emit('guardianCore',{x:e.x,z:e.z,open:e.coreOpen,duration:e.coreRemaining});}
      const targets=people.filter(p=>!p.down&&!inHub(p)&&dist(p,e)<(e.type==='boss'?28:20)),target=targets.sort((a,b)=>dist(a,e)-dist(b,e))[0];
      if(e.type==='boss'&&target){e.specialCd-=dt;if(e.specialCd<=0)this.guardianAttack(e,targets)}if(e.type==='support'){e.specialCd-=dt;if(e.specialCd<=0){for(const ally of this.enemies)if(ally.hp>0&&ally.type!=='boss'&&dist(ally,e)<7)ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*.12);e.specialCd=4;this.emit('healPulse',{x:e.x,z:e.z})}}
      const event=null;
      if(!event&&!people.some(p=>!p.down&&!inHub(p)&&dist(p,e)<36)){e.faceX=e.homeX;e.faceZ=e.homeZ;continue;}
      const station=(e.station!==null?this.stations.find(s=>s.id===e.station&&s.hp>0):null)||this.stations.filter(s=>s.hp>0&&dist(s,e)<9).sort((a,b)=>dist(a,e)-dist(b,e))[0];
      const tower=this.towers.find(t=>t.hp>0&&dist(t,e)<2),rover=this.aurora.rover,roverTarget=['moving','paused'].includes(rover.stage)&&rover.hp>0&&e.zone===7&&dist(e,rover)<16?rover:null,objective=event?{...event,objective:true}:null;
      let destination=tower||(target&&(!station&&!roverTarget||dist(target,e)<7)?target:null)||roverTarget||station||target||objective||{x:e.homeX,z:e.homeZ};
      if(!event&&dist(e,{x:e.homeX,z:e.homeZ})>24)destination={x:e.homeX,z:e.homeZ};
      const range=destination===tower?2:['spitter','artillery','support'].includes(e.type)?7:destination===station||destination===objective||destination===roverTarget?2:1.6;
      if(dist(e,destination)<=range){if(e.cd<=0){if(destination===tower)tower.hp-=e.damage;else if(destination===roverTarget)rover.hp=Math.max(0,rover.hp-e.damage);else if(destination===station){station.hp=Math.max(0,station.hp-e.damage);if(!station.hp)this.emit('station',{station:station.id,state:'destroyed',x:station.x,z:station.z})}else if(destination===target){if(['spitter','artillery'].includes(e.type)){const h={id:this.uid++,x:target.x,z:target.z,time:e.type==='artillery'?1.6:1,duration:e.type==='artillery'?1.6:1,radius:e.type==='artillery'?2:1.2,damage:e.damage,owner:e.id,auroraTask:e.auroraTask};this.hazards.push(h);this.emit('warning',h)}else this.hurt(target,e.damage);}else if(destination===objective)event.hp-=e.damage;
          if(destination===tower||destination===station||destination===target||destination===objective||destination===roverTarget)this.emit('enemyShot',{sx:e.x,sz:e.z,x:destination.x,z:destination.z,kind:e.type});e.cd=e.type==='boss'?1.5:1.3}}
      else{const d=dist(e,destination),speed=e.speed*(e.slow>0?.45:1),x=e.x+(destination.x-e.x)/d*speed*dt,z=e.z+(destination.z-e.z)/d*speed*dt;if(z<GATE_Z-1.8){if(this.clear(x,e.z))e.x=x;if(this.clear(e.x,z)&&zoneAt({z})===e.zone)e.z=z}}
      e.faceX=destination.x;e.faceZ=destination.z;
    }
    for(const h of this.hazards){h.time-=dt;if(h.time<=0){for(const p of people)if((h.damage??24)>0&&hazardContains(h,p,.3))this.hurt(p,h.damage??24,'attack-ring');for(const t of this.towers)if(h.damage!==0&&hazardContains(h,t,.5))t.hp-=18;for(const s of this.stations)if(h.damage!==0&&s.hp>0&&hazardContains(h,s,1))s.hp=Math.max(0,s.hp-18);this.emit('impact',h)}}
    this.hazards=this.hazards.filter(h=>h.time>0);this.enemies=this.enemies.filter(e=>e.hp>0);this.towers=this.towers.filter(t=>t.hp>0);
  }
  view(id){
    const p=this.players.get(id);if(!p)return null;
    const guardian=this.aurora.guardian,boss=[...this.enemies,...this.arrivals].find(e=>e.event===guardian.id&&e.type==='boss'&&e.hp>0);
    const guardianMax=boss?.maxHp||guardian.health,guardianHp=boss?.hp??(guardian.completed?0:guardian.health);
    const {participants:radarCrew,...radar}=this.aurora.radar,{participants:roverCrew,...rover}=this.aurora.rover;
    return {version:VERSION,room:this.id,time:this.time,me:id,environment:{oxygenFactor:OXYGEN_FACTORS[zoneAt(p)]||1},guide:guideFor(this,p),
      aurora:{base:{...AURORA.base},radar:{...radar},rover:{...rover,health:Math.max(0,rover.hp/rover.maxHp),resume:{...roverPosition(p.profile.aurora.escortCheckpoint||0),checkpoint:p.profile.aurora.escortCheckpoint||0}},guardian:{id:guardian.id,name:guardian.name,x:guardian.x,z:guardian.z,state:guardian.state==='active'?'active':guardian.completed?'complete':'idle',hp:guardianHp,maxHp:guardianMax,health:guardianHp/guardianMax,coreOpen:!!boss?.coreOpen,coreRemaining:Math.max(0,boss?.coreRemaining||0),armor:boss?.coreOpen?'exposed':'armored'}},
      self:{...publicProfile(p.profile),tutorial:{...p.profile.tutorial},stats:stats(p.profile),metal:p.profile.metal,crystal:p.profile.crystal,pouch:{...p.pouch}},
      players:this.online().map(q=>({...publicProfile(q.profile),slot:q.slot,x:q.x,z:q.z,depth:depth(q),inHub:inHub(q),hp:q.hp,maxHp:stats(q.profile).hp,oxygen:q.oxygen,maxOxygen:stats(q.profile).oxygen,headingX:q.headingX,headingZ:q.headingZ,down:q.down,downTime:q.downTime,revive:q.revive,shuttle:q.shuttle?Math.max(0,q.shuttle.time):0,mounted:!!q.mounted,pet:q.pet?{...q.pet}:null,charging:!!q.charge})),
      enemies:this.enemies.filter(e=>dist(p,e)<65).map(({contributors,...e})=>e),towers:this.towers.filter(t=>dist(t,p)<75),
      spawnWarnings:this.arrivals.filter(e=>e.phase==='warning'&&dist(e,p)<65).map(e=>({id:e.id,x:e.x,z:e.z,type:e.type,event:e.event,remaining:Math.max(0,e.warnUntil-this.time),duration:ENEMY_ARRIVAL.warningSeconds})),
      stations:this.stations.map(s=>({...s})),hazards:this.hazards.filter(h=>dist(p,h)<65),nodes:NODES.filter(n=>dist(n,p)<55).map(n=>({...n,wait:this.nodeTimers[n.id]})),
      events:this.events.map(e=>({...e,pending:this.arrivals.filter(a=>a.event===e.id).length,participants:[...e.participants]})),effects:this.effects.filter(e=>e.playerId===id||typeof e.x!=='number'||dist(e,p)<70),eventId:this.eventId,messages:this.messages,board:this.board.slice(-10)};
  }
}

import {installStarfall} from './starfall-rules.mjs';
installStarfall({FrontierWorld,stats,XP,dist,depth,inHub,STARFALL,GATE_Z,WEAPONS});
