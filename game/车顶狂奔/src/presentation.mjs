import {clamp,damp} from './math.mjs';

export function selectAnimationClips(base,authored){
 const clips=new Map(base.map(clip=>[clip.name,clip]));
 for(const clip of authored)clips.set(clip.name,clip);
 return clips;
}

// Analytic damped springs: presentation has no dependency on simulation coordinates or frame rate.
export class Spring {
 constructor(value=0,frequency=24,damping=1){this.value=value;this.velocity=0;this.frequency=frequency;this.damping=damping;}
 reset(value=0){this.value=value;this.velocity=0;return this;}
 step(target,dt){
  if(dt<=0)return this.value;
  const w=this.frequency,z=this.damping,x=this.value-target,v=this.velocity,e=Math.exp(-z*w*dt);
  if(z>=.999){const q=v+w*x;this.value=target+(x+q*dt)*e;this.velocity=(v-w*q*dt)*e;}
  else{const d=w*Math.sqrt(1-z*z),a=x,b=(v+z*w*x)/d,co=Math.cos(d*dt),si=Math.sin(d*dt);this.value=target+e*(a*co+b*si);this.velocity=e*(-z*w*(a*co+b*si)+d*(-a*si+b*co));}
  return this.value;
 }
}

export class MotionRig {
 constructor(){this.eye=new Spring(5.44,34);this.impact=new Spring(0,23,.72);this.nod=new Spring(0,20,.8);this.roll=new Spring(0,15);this.pitch=new Spring(-.17,24);this.fov=new Spring(86,10);this.reset();}
 reset(){this.initialized=false;this.phase=0;this.hit=0;this.last=null;this.impact.reset();this.nod.reset();this.roll.reset();}
 event(e){
  if(e.type==='reset'){this.reset();return;}
  if(e.type==='jump'){this.impact.velocity-=.55;this.nod.velocity+=.055;}
  if(e.type==='land'||e.type==='win'){
   const amount=clamp((e.impact??15)/21,.25,1.15);this.hit=amount;
   this.impact.velocity-=2.9*amount;this.nod.velocity-=.45*amount;
  }
 }
 sample(p,input,dt,{portrait=false,active=true,supportRoll=0}={}){
  const speed=Math.hypot(p.vx||0,p.vs||0),stride=Math.hypot(p.relX||0,p.relS||0),targetY=p.y+1.62-(p.crouch||0)*.82;
  const intensity=clamp((speed-11)/20,0,1),targetFov=(portrait?85:86)+intensity*8+(!p.grounded?1.2:0)-(input.focus?8:0);
  if(!this.initialized){this.eye.reset(targetY);this.fov.reset(targetFov);this.pitch.reset(input.pitch??-.17);this.initialized=true;}
  if(!active&&this.last)return {...this.last,blur:0};
  this.phase+=dt*stride*1.5;this.hit=damp(this.hit,0,10,dt);
  const eye=this.eye.step(targetY,dt),impact=clamp(this.impact.step(0,dt),-.22,.075),nod=this.nod.step(0,dt);
  // Keep horizontal camera position exact. Only the body/eye response is spring filtered.
  const bob=p.grounded?Math.sin(this.phase)*Math.min(.018,stride*.0015):0;
  this.last={y:clamp(eye,targetY-.36,targetY+.24)+impact+bob,pitch:this.pitch.step(input.pitch??-.17,dt)+nod,
   roll:this.roll.step(clamp(-(p.relX||0)*.006-supportRoll*.35,-.085,.085),dt),fov:this.fov.step(targetFov,dt),
   blur:clamp(intensity*.012+(!p.grounded?.0025:0),0,.016)*(input.focus?.30:1),intensity,impact,hit:this.hit};
  return this.last;
 }
}
