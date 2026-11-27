// Development controller. It issues ordinary movement/jump inputs; it never edits the simulation.
import {Game,PHYSICS} from '../src/simulation.mjs';
import {makeCourse,hammerPosition} from '../src/courses.mjs';
import {clamp,worldPoint} from '../src/math.mjs';
export function probe(world,stage,{threshold=3.5,aim=-1.5,focus=false}={}){
 const game=new Game(makeCourse(world,stage));game.begin();let target=null,used=0;
 const safe=(x,s,y,time)=>{
  for(const o of game.course.obstacles)if(Math.abs(x-o.x)<o.w/2+.6&&Math.abs(s-o.s)<o.d/2+2)return false;
  for(const h of game.course.hammers){const b=hammerPosition(h,time);if(Math.abs(s-h.s)<3.5&&Math.hypot(x-b.x,y+.7-b.y)<h.radius+1)return false;}
  for(const g of game.course.gates)if(Math.abs(s-g.s)<2&&Math.abs(x-g.x)<g.w/2+.5)return false;
  return true;
 };
 for(let frame=0;frame<14000&&game.state==='playing';frame++){
  const p=game.player,carrier=game.trucks[p.support],input={x:0,z:1,jumpHeld:true,focus:false};
  if(p.grounded){
   target=null;
   const urgent=game.course.obstacles.some(o=>o.s-p.s>0&&o.s-p.s<29&&Math.abs(o.x-p.x)<o.w/2+2);
   if(carrier&&(p.localS>threshold||urgent)){
    const flight=1.32;let best=-Infinity;
    const candidates=game.trucks.filter(t=>t.id!==p.support&&!t.falling&&Math.abs(t.roll)<.45&&t.s>p.s-12&&t.s<p.s+60).map(t=>({t,x:t.x+t.vx*flight,s:t.s+t.vs*flight+aim,y:3.82+t.y}));
    const goal=game.course.goal;if(goal.minS-p.s<55)candidates.push({t:null,x:clamp(p.x,goal.x-goal.w/2+1,goal.x+goal.w/2-1),s:goal.minS+3,y:goal.y});
    for(const q of candidates){const relS=q.s-p.s-p.inheritS*flight,dx=q.x-p.x,cost=Math.hypot(dx/(PHYSICS.side*flight),relS/(PHYSICS.airRun*flight));if(cost>1.08||relS< -4)continue;if(!safe(q.x,q.s,q.y,game.time+flight))continue;let pathSafe=true;for(let k=1;k<=16;k++){const t=flight*k/16,a=k/16,x=p.x+dx*a,s=p.s+(q.s-p.s)*a,y=p.y+PHYSICS.jump*t-PHYSICS.gravity*t*t*.5+.5*a;if(!safe(x,s,y,game.time+t)){pathSafe=false;break;}}if(!pathSafe)continue;const score=(q.t?.s??game.course.length)-p.s-Math.abs(dx)*.8-Math.abs(relS-12)*.2;if(score>best){best=score;target=q;}}
    if(target)input.jump=true;else input.z=0;
   }
  }else if(target){
   const remaining=Math.max(.12,(p.vy+Math.sqrt(Math.max(0,p.vy*p.vy+2*PHYSICS.gravity*(p.y-target.y))))/PHYSICS.gravity),t=target.t;
   const tx=t?t.x+t.vx*remaining:target.x,ts=t?t.s+t.vs*remaining+aim:target.s;
   const vx=(tx-p.x)/remaining-p.inheritX,vs=(ts-p.s)/remaining-p.inheritS;
   input.x=clamp((vx+(vx-p.relX)/Math.max(1,6.8*remaining))/PHYSICS.side,-1,1);
   input.z=clamp((vs+(vs-p.relS)/Math.max(1,6.8*remaining))/PHYSICS.airRun,-1,1);
   if(focus&&game.course.hammers.some(h=>Math.abs(h.s-p.s)<24)&&game.focus>.08)input.focus=true;
  }
  game.step(1/120,input);used++;
 }
 return {world,stage,state:game.state,time:+game.time.toFixed(2),s:Math.round(game.player.s),landings:game.landings,reason:game.reason,used};
}
if(process.argv[1]?.endsWith('route-probe.mjs'))for(let w=0;w<3;w++)for(let s=0;s<3;s++)console.log(JSON.stringify(probe(w,s)));
