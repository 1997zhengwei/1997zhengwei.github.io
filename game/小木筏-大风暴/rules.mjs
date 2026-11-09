export const costs={deck:{wood:3},net:{wood:3,rope:2},brace:{wood:3,scrap:2},sail:{wood:2,rope:2}};
export const fresh=()=>({phase:'gather',resources:{wood:0,rope:0,scrap:0},built:{deck:false,net:false,brace:false,sail:false},hull:100,maxHull:100,collected:0,waves:0,time:0,stormTime:0,netTime:0,repairs:0});
export function collect(s,type,amount){if(!['gather','aftermath'].includes(s.phase)||!(type in s.resources)||amount<=0)return false;s.resources[type]+=amount;s.collected+=amount;return true}
export function canBuild(s,id){return ['gather','aftermath'].includes(s.phase)&&!!costs[id]&&!s.built[id]&&(id!=='sail'||s.built.deck)&&Object.entries(costs[id]).every(([r,n])=>s.resources[r]>=n)}
export function build(s,id){if(!canBuild(s,id))return false;for(const [r,n]of Object.entries(costs[id]))s.resources[r]-=n;s.built[id]=true;if(id==='deck'){s.maxHull=125;s.hull+=25}return true}
export function startStorm(s){if(s.phase!=='gather')return false;s.phase='storm';s.stormTime=0;s.waves=0;return true}
export function repair(s){if(!['storm','aftermath'].includes(s.phase)||s.resources.wood<2||s.hull>=s.maxHull)return false;s.resources.wood-=2;s.hull=Math.min(s.maxHull,s.hull+30);s.repairs++;return true}
export function tick(s,dt){const events=[];if(!['gather','storm','aftermath','sailing'].includes(s.phase))return events;s.time+=dt;
 if(['gather','aftermath'].includes(s.phase)&&s.built.net){s.netTime+=dt;while(s.netTime>=6){s.netTime-=6;collect(s,'wood',2);collect(s,'rope',1);events.push('net')}}
 if(s.phase==='storm'){s.stormTime+=dt;while(s.waves<4&&s.stormTime>=(s.waves+1)*4){s.waves++;s.hull=Math.max(0,s.hull-(s.built.brace?14:36));events.push('wave');if(s.hull<=0){s.phase='lost';events.push('lost');return events}}if(s.stormTime>=18){s.phase='aftermath';events.push('calm')}}
 return events;}
export function depart(s){if(s.phase!=='aftermath'||!s.built.sail||s.hull<=0)return false;s.phase='sailing';return true}
export function arrive(s){if(s.phase!=='sailing')return false;s.phase='won';return true}
