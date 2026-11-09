export const DIRS=['N','E','S','W'];
export const V={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]};
export const OPP={N:'S',E:'W',S:'N',W:'E'};
export const key=p=>`${p[0]},${p[1]}`;
export const point=k=>k.split(',').map(Number);
export const same=(a,b)=>a&&b&&a[0]===b[0]&&a[1]===b[1];
export const canonical=ports=>DIRS.filter(d=>ports.includes(d)).join('');
// Only explicitly authored branch choices are interactive. A plain merge
// must never acquire a hidden switch state through a tap or an old save.
export const isSwitch=tile=>tile?.ports.length===3&&tile.switchable===true;
export function direction(a,b){const dx=b[0]-a[0],dy=b[1]-a[1];return DIRS.find(d=>V[d][0]===dx&&V[d][1]===dy);}
export function canBuild(l,p){return p[0]>=0&&p[1]>=0&&p[0]<l.w&&p[1]<l.h&&!l.blocked.some(q=>same(p,q))&&!(l.water||[]).some(q=>same(p,q));}
export function copyLayout(layout){return Object.fromEntries(Object.entries(layout).map(([k,t])=>[k,{...t}]));}
export function allTracks(l,placed={},switches={}){
  const tracks={...copyLayout(l.fixed),...copyLayout(placed)};
  for(const [k,s]of Object.entries(switches))if(isSwitch(tracks[k]))tracks[k].switch=s;
  return tracks;
}
export function nextDirection(tile,incoming){
  if(!tile||!tile.ports.includes(incoming))return null;
  const p=tile.ports;
  if(p.length===4)return OPP[incoming];
  if(p.length===3){const stem=tile.stem|| (p.includes('E')?'E':p[0]);const branches=DIRS.filter(d=>p.includes(d)&&d!==stem);return incoming===stem?branches[(tile.switch||0)%2]:stem;}
  return [...p].find(d=>d!==incoming)||null;
}
export function tracksFromRoutes(routes,cars,exit,exitDir='E'){
  const tiles={};
  const add=(p,dirs)=>{const k=key(p);tiles[k]={ports:canonical((tiles[k]?.ports||'')+dirs)};};
  for(const route of routes)for(let i=0;i<route.length;i++){
    const dirs=[i?direction(route[i],route[i-1]):null,i<route.length-1?direction(route[i],route[i+1]):null].filter(Boolean).join('');add(route[i],dirs);
  }
  for(const car of cars)add(car.p,OPP[car.dir]);add(exit,exitDir);
  return tiles;
}

// All cars advance together. A crossing occupied on the same beat, a head-on
// edge swap, a blocked car, and a wrong coupling order are distinct failures.
// Rendering consumes these immutable frames; UI input never changes a live run.
export function simulate(l,placed={},switches={}){
  const tracks=allTracks(l,placed,switches),count=Object.keys(placed).length;
  const cars=l.cars.map(c=>({id:c.id,p:[...c.p],incoming:OPP[c.dir],heading:c.dir,status:'active',wait:0,waited:null,portal:null}));
  const frames=[],events=[],coupled=[];let failure=null;
  const capture=()=>frames.push({cars:cars.map(c=>({...c,p:[...c.p]})),coupled:[...coupled]});capture();
  if(count>l.budget)return {ok:false,frames,events,coupled,failure:{type:'budget',message:'Too many rails',detail:`Remove ${count-l.budget} track tile${count-l.budget>1?'s':''}.`,tick:0},tracks};
  for(let tick=1;tick<=180;tick++){
    const active=cars.filter(c=>c.status==='active'),proposals=[];
    for(const c of active){
      const k=key(c.p),signal=(l.signals||{})[k];
      if(signal&&c.waited!==k){c.wait=signal;c.waited=k;}
      if(c.wait>0){c.wait--;proposals.push({car:c,p:[...c.p],incoming:c.incoming,heading:c.heading,waiting:true});continue;}
      const tunnel=(l.tunnels||[]).find(t=>same(t.a,c.p)||same(t.b,c.p));
      if(tunnel&&c.portal!==k){const fromA=same(tunnel.a,c.p),p=fromA?tunnel.b:tunnel.a,heading=fromA?tunnel.dirB:tunnel.dirA;proposals.push({car:c,p:[...p],incoming:OPP[heading],heading,teleport:true});continue;}
      const out=nextDirection(tracks[k],c.incoming);
      if(!out){failure={type:'broken',message:'A break in the line',detail:`Car ${c.id} cannot leave this track. Join the rail ends, then try again.`,car:c.id,p:[...c.p],tick};break;}
      const p=[c.p[0]+V[out][0],c.p[1]+V[out][1]],destination=tracks[key(p)];
      if(!canBuild(l,p)||!destination||!destination.ports.includes(OPP[out])){failure={type:'derail',message:'End of the line',detail:`Car ${c.id} ran out of connected track. The white rail ends need to meet.`,car:c.id,p:[...c.p],toward:p,tick};break;}
      proposals.push({car:c,p,incoming:OPP[out],heading:out});
    }
    if(failure){capture();break;}
    for(let i=0;i<proposals.length&&!failure;i++)for(let j=i+1;j<proposals.length;j++){
      const a=proposals[i],b=proposals[j];
      if(same(a.p,b.p)||(same(a.p,b.car.p)&&same(b.p,a.car.p)&&!a.waiting&&!b.waiting)){
        failure={type:'collision',message:'Mind the junction!',detail:`Cars ${a.car.id} and ${b.car.id} meet at the same time. Give one of them a longer route.`,cars:[a.car.id,b.car.id],p:[...a.p],tick};break;
      }
    }
    if(failure){for(const p of proposals)if(!p.waiting){p.car.p=p.p;p.car.incoming=p.incoming;p.car.heading=p.heading;}capture();break;}
    for(const proposal of proposals){
      const c=proposal.car;if(proposal.waiting)continue;c.p=proposal.p;c.incoming=proposal.incoming;c.heading=proposal.heading;c.portal=proposal.teleport?key(c.p):null;
      if(proposal.teleport)events.push({type:'tunnel',id:c.id,tick,p:[...c.p]});
      if(same(c.p,l.exit)){
        const expected=coupled.length+1;
        if(c.id!==expected){failure={type:'order',message:`Car ${expected} needs to arrive first`,detail:`Car ${c.id} reached the engine before car ${expected}. Reroute it so the carriages connect in numbered order.`,car:c.id,expected,p:[...c.p],tick};break;}
        c.status='coupled';coupled.push(c.id);events.push({type:'couple',id:c.id,tick,p:[...c.p]});
      }
    }
    capture();if(failure)break;
    if(coupled.length===cars.length){events.push({type:'win',tick});return {ok:true,frames,events,coupled,failure:null,tracks,ticks:tick};}
    if(tick===180)failure={type:'loop',message:'Going in circles',detail:'A carriage has no way to reach the engine. Open a route out of the loop.',tick,p:cars.find(c=>c.status==='active')?.p};
  }
  return {ok:false,frames,events,coupled,failure,tracks,ticks:frames.length-1};
}
