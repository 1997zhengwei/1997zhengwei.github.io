// QA only: plans ordinary gathering, recipes, walking and paid construction.
import {planet,boundaries,distance,globeRemaining,selectLand,buildAnchor,globePath,gatherGoal,dot,add,mul,norm,globeCanStand,cross} from './globe.mjs';
export class GlobePilot{
 constructor({limit=642}={}){this.limit=limit;this.target=null;this.key='';this.path=[];this.status='Starting global frontier';this.failed=null;this.finished=false;this.stall=0;this.previous=null;}
 resource(s,type,amount){const g=s.frontier,p=planet(g.index);if(s.bag[type]>=amount)return null;
  if(type==='iron'){const deficit=amount-s.bag.iron;if(s.bag.ore<2*deficit)return this.resource(s,'ore',2*deficit);if(s.bag.wood<deficit)return this.resource(s,'wood',deficit);return {key:'smelt',p:p.services.find(a=>a.id==='smelt').p};}
  if(type==='emerald'){const deficit=amount-s.bag.emerald;if(s.bag.wheat<3*deficit)return this.resource(s,'wheat',3*deficit);return {key:'cow',p:p.services.find(a=>a.id==='cow').p};}
  const goal=gatherGoal(g,type);if(!goal)this.failed=`Missing renewable resource: ${type}`;return goal;
 }
 choose(s){const g=s.frontier,p=planet(g.index);if(g.owned.length>=this.limit){this.finished=true;return null;}if(this.target===null||g.owned.includes(this.target)){const c=boundaries(g).sort((a,b)=>a.depth-b.depth||distance(g.pos,a.p)-distance(g.pos,b.p))[0];if(!c){this.finished=true;return null;}this.target=c.id;}const c=p.cells[this.target],rem=globeRemaining(g,c);for(const[k,v]of Object.entries(rem)){const goal=this.resource(s,k,v);if(goal){g.selected=null;return goal;}}if(g.selected!==c.id)selectLand(g,c.id);return {key:`land-${c.id}`,p:buildAnchor(g,c.id)};}
 input(s,dt){const g=s.frontier,goal=this.choose(s);if(!goal)return [0,0,0];this.status=goal.key;
  if(distance(g.pos,goal.p)<.25){this.key='';this.path=[];this.stall=0;return [0,0,0];}
  if(this.key!==goal.key||!this.path.length){this.key=goal.key;this.path=globePath(g,goal.p);if(!this.path.length){this.failed=`No route: ${goal.key}`;return [0,0,0];}}
  while(this.path.length&&distance(g.pos,this.path[0])<.13)this.path.shift();if(!this.path.length)return [0,0,0];const target=this.path[0],d=distance(g.pos,target),direction=norm(add(target,mul(g.pos,-dot(g.pos,target))));let input=mul(direction,Math.min(1,d/(3.7*dt)));
  if(!globeCanStand(g,norm(add(g.pos,mul(input,.1/18.64))))){for(const angle of[.6,-.6,1.1,-1.1,1.5,-1.5]){const side=cross(g.pos,input),tryInput=add(mul(input,Math.cos(angle)),mul(side,Math.sin(angle)));if(globeCanStand(g,norm(add(g.pos,mul(tryInput,.15/18.64))))){input=tryInput;break;}}}
  if(this.previous&&distance(g.pos,this.previous)<.001)this.stall+=dt;else this.stall=0;this.previous=[...g.pos];if(this.stall>12)this.failed=`Blocked walking to ${goal.key}`;return input;
 }
}
