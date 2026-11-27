// Presentation only: these dimensions never change inventory, capacity or prices.
export const ACTOR_SCALE=1.14;
export const PICKUP_FLIGHT=.26;
export const RESTOCK_FLIGHT=.25;
const packing={tomato:[.68,.4,1.18],egg:[.65,.38,1.02],eggplant:[.72,.37,.94],milk:[.85,.43,1.04],bread:[.51,.26,1.03],juice:[.79,.4,1.03],wheat:[.7,.37,.98],flower:[.78,.43,.85]};
export function cargoPoses(entries,cart=false){let y=1.05;return entries.map((entry,index)=>{const id=typeof entry==='string'?entry:entry.id,[step,centre,scale]=packing[id];if(cart==='basket')return {x:(index%2-.5)*.25,y:.95+Math.floor(index/4)*.28,z:.55+Math.floor(index%4/2)*.26,scale:.44,rx:0,ry:0,rz:0,boardY:0};if(cart==='tote')return {x:-.58+(index%2)*.13,y:1+Math.floor(index/2)*.19,z:.08,scale:.33,rx:0,ry:0,rz:0,boardY:0};if(cart)return {x:(index%3-1)*.32,y:.91+Math.floor(index/6)*.36,z:.85+Math.floor(index%6/3)*.35,scale:.6,rx:0,ry:0,rz:0,boardY:0};const pose={x:.12,y:y+centre,z:.84,scale,rx:id==='eggplant'?Math.PI/2:0,ry:index%2?.09:-.07,rz:0,boardY:y};y+=step;return pose;});}
export function cargoHeight(bag){const entries=Object.entries(bag).flatMap(([id,n])=>Array(Math.max(0,n)).fill(id)),poses=cargoPoses(entries);return poses.length?(poses.at(-1).y+.48)*ACTOR_SCALE:2.2*ACTOR_SCALE;}
export class CargoMotion{
 constructor(){this.entries=[];this.initialized=false;this.next=1;this.swayX=0;this.swayZ=0;this.velocityX=0;this.velocityZ=0;this.impact=0;}
 sync(bag,instant=false){const counts={};for(const e of this.entries)counts[e.id]=(counts[e.id]||0)+1;const excess=Object.fromEntries(Object.entries(counts).map(([id,n])=>[id,Math.max(0,n-(bag[id]||0))]));for(let i=this.entries.length-1;i>=0;i--)if(excess[this.entries[i].id]>0){excess[this.entries[i].id]--;counts[this.entries[i].id]--;this.entries.splice(i,1);}for(const [id,n]of Object.entries(bag))for(let i=counts[id]||0;i<n;i++)this.entries.push({id,key:this.next++,age:!this.initialized||instant?10:0,y:null});this.initialized=true;}
 update(dt,{walking=false,phase=0,turn=0,accelX=0,accelZ=0,cart=false}={}){
  dt=Math.min(.1,Math.max(0,dt));const targetX=Math.max(-.15,Math.min(.15,-turn*.09-accelX*.016)),targetZ=Math.max(-.1,Math.min(.1,-accelZ*.014));
  this.velocityX+=(targetX-this.swayX)*65*dt-this.velocityX*10*dt;this.velocityZ+=(targetZ-this.swayZ)*65*dt-this.velocityZ*10*dt;this.swayX+=this.velocityX*dt;this.swayZ+=this.velocityZ*dt;this.impact*=Math.exp(-dt*13);
  const poses=cargoPoses(this.entries,cart);return this.entries.map((e,i)=>{e.age+=dt;const p=poses[i];e.y??=p.y;e.y+=(p.y-e.y)*(1-Math.exp(-dt*24));const arrive=cart?1:Math.max(0,Math.min(1,(e.age-PICKUP_FLIGHT)/.12)),pop=arrive<1?Math.sin(arrive*Math.PI)*.14:0;const height=cart?0:Math.min(2.8,i*.16);return {...p,key:e.key,id:e.id,y:e.y+(walking?Math.sin(phase-i*.19)*.018:0)+this.impact*.018,boardY:p.boardY+(e.y-p.y),x:p.x+this.swayX*height+(walking?Math.sin(phase*.55-i*.25)*.012*height:0),z:p.z+this.swayZ*height,rz:-this.swayX*.35,scale:p.scale*(arrive>0?1+pop:0),arrival:arrive};});
 }
 last(id){return this.entries.findLast(e=>e.id===id);}
 pose(key,cart=false){const index=this.entries.findIndex(e=>e.key===key);return index<0?null:cargoPoses(this.entries,cart)[index];}
 pulse(){this.impact=1;}
}
