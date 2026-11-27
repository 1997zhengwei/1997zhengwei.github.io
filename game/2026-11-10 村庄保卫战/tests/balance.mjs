import{createGame,startNight,step,drainEvents}from'../core.mjs';
import{prepareDay,createPilot,pilotInput}from'../qa/pilot.mjs';
export function campaign(seed=1,policy=4,active=true,dt=.1){
 const r=createGame(seed),pilot=createPilot(),log=[];
 for(let n=1;n<=20;n++){
  prepareDay(r,policy);startNight(r);let ticks=0,peak=0;
  while(r.phase==='night'&&ticks++<8000){step(r,dt,active?pilotInput(r,pilot,dt):{x:0,z:0});drainEvents(r);peak=Math.max(peak,r.enemies.length);}
  log.push({n:r.night,phase:r.phase,bell:Math.round(r.bell.hp),coins:r.emeralds,kills:r.nightKills,seconds:Math.round(ticks*dt),peak});
  if(r.phase==='won'||r.phase==='lost'||ticks>=8000)break;while(r.phase==='dawn')step(r,dt);
 }return{r,log};
}
