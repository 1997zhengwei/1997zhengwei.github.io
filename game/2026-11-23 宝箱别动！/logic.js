import {rooms,exit} from './rooms.js';
const limit=(n,l,h)=>Math.max(l,Math.min(h,n));
const diff=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export const speed=3.65;
export const SNEAK=.62;
// Shop upgrades: rank 0..3 for each.
export const perkTable={
  shoes:[1,1.07,1.14,1.22],
  armor:[1,.84,.71,.6],
  magnet:[.6,1.15,1.7,2.3]
};
function occludersFor(room,path,range){
  const xs=path.map(p=>p[0]),zs=path.map(p=>p[1]);
  const xmin=Math.min(...xs)-range,xmax=Math.max(...xs)+range,zmin=Math.min(...zs)-range,zmax=Math.max(...zs)+range;
  return room.solids.filter(([cx,cz,w,d])=>cx+w/2>=xmin&&cx-w/2<=xmax&&cz+d/2>=zmin&&cz-d/2<=zmax);
}
export function newRun(index,perks={}){
  const room=rooms[index],guards=room.patrols.map(p=>{
    const [x,z]=p.path[0],[tx,tz]=p.path[1];
    const g={...p,x,z,next:1,rotation:Math.atan2(tx-x,tz-z),pause:0,stride:0,pace:0,noticed:false,
      occluders:occludersFor(room,p.path,Math.max(p.range,p.hearing||0)),puzzle:0,distract:0,alert:0,cool:0,lookX:0,lookZ:0,bark:0};
    for(let t=0;t<p.phase;t+=.04)patrol(g,.04);
    return g;
  });
  const cameras=room.cameras.map(c=>({...c,rotation:c.a0,noticed:false,occluders:occludersFor(room,[[c.x,c.z]],c.range)}));
  return {index,room,guards,cameras,x:0,z:6.30,facing:Math.PI,hidden:false,started:false,phase:'play',clock:0,time:0,
    hidingTime:0,warning:0,closeCalls:0,spotted:0,coins:0,value:0,secured:0,events:[],noise:false,sneak:false,
    perks:{shoes:perkTable.shoes[perks.shoes|0],armor:perkTable.armor[perks.armor|0],magnet:perkTable.magnet[perks.magnet|0]},
    decoys:perks.decoys|0,flying:[],keyTaken:false,gateOpen:!room.gate,
    lasers:room.lasers.map(l=>({...l,active:false,charge:0})),
    relics:room.relics.map(r=>({...r,px:r.x,pz:r.z,taken:false})),
    change:room.coins.map(([x,z])=>({x,z,taken:false}))};
}
function patrol(g,dt){
  const target=g.path[g.next],dx=target[0]-g.x,dz=target[1]-g.z,d=Math.hypot(dx,dz);
  if(d<.025){g.x=target[0];g.z=target[1];g.next=(g.next+1)%g.path.length;g.pause=g.dog?.2:.38;g.pace=0;return;}
  const a=Math.atan2(dx,dz),turn=diff(g.rotation,a);
  g.rotation+=limit(turn,-2.9*dt,2.9*dt);
  if(g.pause>0){g.pause-=dt;g.pace=0;return;}
  if(Math.abs(turn)>.53){g.pace=0;return;}
  const step=Math.min(d,g.speed*dt);
  g.x+=dx/d*step;g.z+=dz/d*step;g.pace=1;g.stride+=step*(g.dog?8.5:6.4);
}
function face(g,x,z,dt,rate=4.2){
  const turn=diff(g.rotation,Math.atan2(x-g.x,z-g.z));g.rotation+=limit(turn,-rate*dt,rate*dt);g.pace=0;
}
// Same segment/box intersection for the rendered beam and the guard's sight.
export function beamLength(room,g,angle){
  const dx=Math.sin(angle),dz=Math.cos(angle);
  let distance=g.range;
  for(const [x,z,w,d] of g.occluders||room.solids){
    const ox=x-g.x,oz=z-g.z;
    if(Math.abs(ox)>distance+w/2||Math.abs(oz)>distance+d/2)continue;
    let near=0,far=distance;
    if(Math.abs(dx)>.00001){
      const t=ox/dx,span=w/(2*Math.abs(dx));near=Math.max(near,t-span);far=Math.min(far,t+span);
    }else if(Math.abs(ox)>w/2)continue;
    if(Math.abs(dz)>.00001){
      const t=oz/dz,span=d/(2*Math.abs(dz));near=Math.max(near,t-span);far=Math.min(far,t+span);
    }else if(Math.abs(oz)>d/2)continue;
    if(near<=far)distance=near;
  }
  return Math.max(0,distance);
}
function clearLine(room,from,x,z,occluders){
  const d=Math.hypot(x-from.x,z-from.z);
  return beamLength(room,{x:from.x,z:from.z,range:d,occluders},Math.atan2(x-from.x,z-from.z))>=d-.05;
}
export function inCone(room,v,x,z){
  const dx=x-v.x,dz=z-v.z,d=Math.hypot(dx,dz),a=Math.atan2(dx,dz);
  return Math.abs(diff(v.rotation,a))<=v.angle&&d<=v.range&&d<=beamLength(room,v,a)+.015;
}
export function laserState(l,clock){
  const cycle=l.on+l.off,t=((clock+l.phase)%cycle+cycle)%cycle;
  return {active:t<l.on,charge:t>=l.on?limit(1-(cycle-t)/.55,0,1):0};
}
function segDist(px,pz,l){
  const vx=l.bx-l.ax,vz=l.bz-l.az,t=limit(((px-l.ax)*vx+(pz-l.az)*vz)/(vx*vx+vz*vz),0,1);
  return Math.hypot(px-(l.ax+vx*t),pz-(l.az+vz*t));
}
function solidsOf(s){return s.gateOpen?s.room.solids:[...s.room.solids,s.room.gate.rect];}
function travel(s,dx,dz){
  // Resolve the two axes independently so the runner slides along case edges.
  const solids=solidsOf(s);
  const blocked=(x,z)=>solids.some(([cx,cz,w,d])=>Math.hypot(
    Math.max(Math.abs(x-cx)-w/2,0),Math.max(Math.abs(z-cz)-d/2,0))<.32);
  const bounds=s.room.bounds;
  const x=limit(s.x+dx,bounds.left+.32,bounds.right-.32);
  if(!blocked(x,s.z))s.x=x;
  const door=Math.abs(s.x)<.93&&s.secured;
  const z=limit(s.z+dz,bounds.back+.32,door?exit.z+.5:bounds.front-.32);
  if(!blocked(s.x,z))s.z=z;
}
// Toss a decoy coin ahead; guards in earshot turn to stare at where it lands.
export function throwDecoy(s){
  if(s.phase!=='play'||s.decoys<=0||s.flying.length)return false;
  const a=s.facing,room=s.room;
  const reach=beamLength(room,{x:s.x,z:s.z,range:3.6,occluders:solidsOf(s)},a);
  const d=Math.max(.6,reach-.35);
  s.decoys--;s.flying.push({fx:s.x,fz:s.z,x:s.x+Math.sin(a)*d,z:s.z+Math.cos(a)*d,t:0,life:0});
  s.events.push({kind:'toss'});return true;
}
export function step(s,dt,input){
  s.events.length=0;
  if(s.phase!=='play')return;
  s.clock+=dt;
  if(input.active)s.started=true;
  if(s.started)s.time+=dt;
  s.hidden=s.started&&!input.active;s.hidingTime=s.hidden?s.hidingTime+dt:0;
  const length=Math.hypot(input.x,input.z),moving=input.active&&length>.12;
  s.noise=moving&&!input.sneak&&length>SNEAK;s.sneak=moving&&!s.noise;
  for(const l of s.lasers){const st=laserState(l,s.clock);l.active=st.active;l.charge=st.charge;}
  for(const c of s.cameras){
    const u=.5-.5*Math.cos((s.clock+c.phase)*Math.PI*2/c.period);c.rotation=c.a0+(c.a1-c.a0)*u;
  }
  // Decoys in flight, then on the floor for a while.
  for(let i=s.flying.length-1;i>=0;i--){
    const f=s.flying[i];
    if(f.t<1){f.t=Math.min(1,f.t+dt/.45);if(f.t===1){
      s.events.push({kind:'decoy',x:f.x,z:f.z});
      for(const g of s.guards){
        if(Math.hypot(g.x-f.x,g.z-f.z)<7.5&&clearLine(s.room,g,f.x,f.z,g.occluders)){g.distract=3.3;g.puzzle=0;g.alert=0;g.lookX=f.x;g.lookZ=f.z;g.noticed=false;s.events.push({kind:'look',i:s.guards.indexOf(g)});}
      }
    }}else{f.life+=dt;if(f.life>3.3)s.flying.splice(i,1);}
  }
  for(const [i,g] of s.guards.entries()){
    g.cool=Math.max(0,g.cool-dt);g.bark=Math.max(0,g.bark-dt);
    if(g.puzzle>0){
      g.puzzle-=dt;face(g,s.x,s.z,dt,3);
      if(g.puzzle<=0){g.cool=1.4;s.events.push({kind:'shrug',i});}
    }else if(g.distract>0){g.distract-=dt;face(g,g.lookX,g.lookZ,dt);}
    else if(g.alert>0){g.alert-=dt;face(g,g.lookX,g.lookZ,dt,6);}
    else patrol(g,dt);
  }
  for(const r of s.relics){
    if(r.taken)continue;
    if(r.motion==='skitter'){r.px=r.x+.53*Math.sin(s.clock*1.65);r.pz=r.z+.25*Math.sin(s.clock*3.3);}
    if(r.motion==='rail')r.px=r.x+1.93*Math.sin(s.clock*1.18);
  }
  if(!s.started)return;
  if(moving){
    const pace=(s.noise?1:.52)*s.perks.shoes,k=speed*pace*dt/Math.max(1e-6,length);
    travel(s,input.x*k,input.z*k);
    s.facing+=diff(s.facing,Math.atan2(input.x,input.z))*(1-Math.exp(-16*dt));
  }
  // Dogs hear running feet through open floor, then whip round to look.
  if(s.noise)for(const [i,g] of s.guards.entries()){
    if(!g.dog||g.puzzle>0||g.distract>0)continue;
    const d=Math.hypot(s.x-g.x,s.z-g.z);
    if(d<g.hearing&&clearLine(s.room,g,s.x,s.z,g.occluders)){
      g.alert=1.5;g.lookX=s.x;g.lookZ=s.z;
      if(g.bark<=0){g.bark=1.6;s.events.push({kind:'bark',i});}
    }
  }
  let seen=false,glare=false;
  for(const [i,g] of s.guards.entries()){
    const inside=inCone(s.room,g,s.x,s.z);
    if(inside&&!s.hidden){seen=true;if(!g.noticed&&!g.puzzle)s.spotted++;g.noticed=true;if(g.puzzle>0)glare=true;}
    if(inside&&s.hidden&&g.noticed){
      s.closeCalls++;g.noticed=false;
      if(g.cool<=0&&g.puzzle<=0){g.puzzle=1.9;g.distract=0;g.alert=0;s.events.push({kind:'puzzle',i});}
      else s.events.push({kind:'dodge'});
    }
    if(!inside)g.noticed=false;
  }
  for(const c of s.cameras){
    const inside=inCone(s.room,c,s.x,s.z);
    if(inside&&!s.hidden){seen=true;if(!c.noticed)s.spotted++;c.noticed=true;}
    if(inside&&s.hidden&&c.noticed){s.closeCalls++;s.events.push({kind:'dodge'});}
    if(!inside||s.hidden)c.noticed=false;
  }
  const prior=s.warning;
  s.warning=s.hidden?0:limit(s.warning+dt*(seen?1.27*(glare?3.2:1)*s.perks.armor:-2.15),0,1);
  if(!prior&&s.warning)s.events.push({kind:'warning'});
  if(s.warning>=1){s.phase='caught';s.cause='guard';s.events.push({kind:'caught'});return;}
  if(!s.hidden)for(const l of s.lasers)if(l.active&&segDist(s.x,s.z,l)<.36){
    s.phase='caught';s.cause='laser';s.events.push({kind:'zap'},{kind:'caught'});return;
  }
  if(!moving)return;
  const reach=s.perks.magnet;
  for(const coin of s.change){
    if(!coin.taken&&Math.hypot(coin.x-s.x,coin.z-s.z)<reach){
      coin.taken=true;s.coins+=2;s.events.push({kind:'coin',x:coin.x,z:coin.z});
    }
  }
  if(s.room.key&&!s.keyTaken&&Math.hypot(s.room.key.x-s.x,s.room.key.z-s.z)<.8){
    s.keyTaken=true;s.gateOpen=true;s.events.push({kind:'key',x:s.room.key.x,z:s.room.key.z});
  }
  for(const [i,r] of s.relics.entries()){
    if(!r.taken&&Math.hypot(r.px-s.x,r.pz-s.z)<.77+(reach-.6)*.2){
      r.taken=true;s.secured++;s.value+=r.value;s.events.push({kind:'relic',i,x:r.px,z:r.pz});
    }
  }
  if(s.secured&&Math.hypot(s.x-exit.x,s.z-exit.z)<.74){s.phase='escape';s.events.push({kind:'escape'});}
}
