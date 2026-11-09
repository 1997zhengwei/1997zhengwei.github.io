export const VERSION=1;
export const names=['North','East','South','West'];
export const size=s=>s.levels.deck+2;
export const capacity=s=>100+(size(s)**2-4)*15;
function random(seed){let x=seed>>>0;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const climates=[{name:'Rolling Swell',mult:1,gap:4.8,extra:0,leak:.9},{name:'Crosswind',mult:.88,gap:3.8,extra:1,leak:1},{name:'Heavy Squall',mult:1.12,gap:3.6,extra:1,leak:1.1},{name:'Long Breakers',mult:1.32,gap:5.2,extra:0,leak:1},{name:'Rogue Set',mult:1.03,gap:3.5,extra:2,leak:1.2}];
export function forecast(seed,round){const rng=random((seed+Math.imul(round,2654435761))>>>0),type=round===1?climates[0]:climates[Math.floor(rng()*climates.length)],count=Math.min(8,3+Math.floor((round-1)/3)+type.extra),base=(10+round*2.3+Math.sqrt(round)*2)*type.mult,first=Math.floor(rng()*4);const waves=[];let at=4;
 for(let i=0;i<count;i++){const dir=type.name==='Crosswind'?(first+i)%4:i%2===0?first:Math.floor(rng()*4),power=Math.round(base*(.84+rng()*.4));waves.push({at,direction:dir,power,leak:type.leak*(1+round*.06),offset:rng()});at+=type.gap+((rng()-.5)*.5)}return {name:type.name,waves,duration:waves.at(-1).at+2,peak:Math.max(...waves.map(w=>w.power))}}
export const fresh=(seed=Date.now()>>>0)=>({version:VERSION,seed:seed>>>0,phase:'calm',round:1,survived:0,levels:{deck:0,net:0,brace:0,sail:0},resources:{wood:4,rope:2,scrap:2},hull:100,heading:0,calmTime:0,stormTime:0,fired:0,netTime:0,netCycles:0,time:0,collected:0,repairs:0,leaks:[],nextLeak:1,storm:forecast(seed,1)});
export const prepDuration=s=>s.round===1?65:Math.max(32,52-s.round*.35);
export function cost(s,id){const n=s.levels[id];if(!Number.isFinite(n))return null;return id==='deck'?{wood:4+n*2,rope:Math.floor(n/3)}:id==='net'?{wood:4+n*2,rope:2+n}:id==='brace'?{wood:3+n*2,scrap:2+n}:{wood:3+n,rope:2+n,scrap:Math.floor(n/2)}}
export function canBuild(s,id){const c=cost(s,id);return s.phase==='calm'&&!!c&&Object.entries(c).every(([r,n])=>s.resources[r]>=n)}
export function build(s,id){if(!canBuild(s,id))return false;const old=capacity(s);for(const [r,n]of Object.entries(cost(s,id)))s.resources[r]-=n;s.levels[id]++;if(id==='deck')s.hull+=capacity(s)-old;return true}
export function collect(s,type,n){if(s.phase==='lost'||!Object.hasOwn(s.resources,type)||!Number.isFinite(n)||n<=0)return false;s.resources[type]+=n;s.collected+=n;return true}
export const yieldFor=(s,type)=>type==='wood'?3+Math.floor(s.round/3):2+Math.floor(s.round/5);
export function startStorm(s){if(s.phase!=='calm')return false;s.phase='storm';s.stormTime=0;s.fired=0;return true}
export function turn(s){if(s.phase==='lost')return false;s.heading=(s.heading+1)%4;return true}
export function damageFor(s,w){const armor=1/(1+s.levels.brace*.38),bow=w.direction===s.heading?Math.max(.38,.74-s.levels.sail*.045):1;return Math.max(1,w.power*armor*bow)}
function wave(s,w){const damage=damageFor(s,w);s.hull=Math.max(0,s.hull-damage);const edge=(size(s)-1)*.825,along=(w.offset*2-1)*edge,localDirection=(w.direction-s.heading+4)%4;const x=localDirection===1?edge:localDirection===3?-edge:along,z=localDirection===0?-edge:localDirection===2?edge:along;if(s.leaks.length<8)s.leaks.push({id:s.nextLeak++,x,z,rate:w.leak/(1+s.levels.brace*.18)});return {kind:'wave',direction:w.direction,damage,power:w.power}}
export function repair(s,id=null){if(s.phase==='lost'||s.resources.wood<2)return false;const i=id===null?-1:s.leaks.findIndex(l=>l.id===id);if(id!==null&&i<0)return false;if(i<0&&s.hull>=capacity(s))return false;s.resources.wood-=2;if(i>=0)s.leaks.splice(i,1);s.hull=Math.min(capacity(s),s.hull+25+capacity(s)*.1);s.repairs++;return true}
function lose(s,events){if(s.hull>0)return false;s.hull=0;s.phase='lost';events.push({kind:'lost'});return true}
export function tick(s,dt){const events=[];if(s.phase==='lost'||!Number.isFinite(dt)||dt<=0)return events;let left=dt;
 // Bounded time steps preserve wave/leak ordering across slow render frames.
 while(left>1e-8&&s.phase!=='lost'){const step=Math.min(.2,left);left-=step;s.time+=step;
 if(s.levels.net){s.netTime+=step;const interval=Math.max(3,6-s.levels.net*.2);if(s.netTime>=interval){s.netTime-=interval;s.netCycles++;const amount=2+s.levels.net+Math.floor(s.round/4);collect(s,'wood',amount);collect(s,'rope',1+Math.floor(s.levels.net/2));if(s.netCycles%3===0)collect(s,'scrap',1+Math.floor(s.levels.net/3));events.push({kind:'net',amount})}}
 if(s.phase==='calm'){s.calmTime+=step;if(s.calmTime>=prepDuration(s)){startStorm(s);events.push({kind:'storm'})}}
 else if(s.phase==='storm'){s.stormTime+=step;for(const l of s.leaks)s.hull-=l.rate*step;if(lose(s,events))break;
 while(s.fired<s.storm.waves.length&&s.stormTime+1e-8>=s.storm.waves[s.fired].at){events.push(wave(s,s.storm.waves[s.fired++]));if(lose(s,events))break}if(s.phase==='lost')break;
 if(s.stormTime>=s.storm.duration){s.survived++;const reward={wood:6+s.round*2,rope:3+Math.floor(s.round/2),scrap:2+Math.floor(s.round/3)};for(const [r,n]of Object.entries(reward))collect(s,r,n);s.round++;s.phase='calm';s.calmTime=0;s.stormTime=0;s.fired=0;s.storm=forecast(s.seed,s.round);events.push({kind:'calm',reward})}}
 }return events;}
export function serialize(s){const {storm,...data}=s;return JSON.stringify(data)}
export function restore(raw){try{const s=JSON.parse(raw);if(s.version!==VERSION||!['calm','storm','lost'].includes(s.phase))return null;for(const key of ['seed','round','survived','hull','heading','calmTime','stormTime','fired','netTime','netCycles','time','collected','repairs','nextLeak'])if(!Number.isFinite(s[key])||s[key]<0)return null;if(!Number.isSafeInteger(s.round)||s.round<1||s.heading>3)return null;for(const key of ['deck','net','brace','sail'])if(!Number.isSafeInteger(s.levels?.[key])||s.levels[key]<0)return null;for(const key of ['wood','rope','scrap'])if(!Number.isFinite(s.resources?.[key])||s.resources[key]<0)return null;if(!Array.isArray(s.leaks)||s.leaks.length>8||s.leaks.some(l=>!['id','x','z','rate'].every(k=>Number.isFinite(l[k]))||l.rate<0))return null;s.storm=forecast(s.seed,s.round);if(s.hull>capacity(s)||s.fired>s.storm.waves.length)return null;return s}catch{return null}}
