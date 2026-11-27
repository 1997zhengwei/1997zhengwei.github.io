export const BOSS_TYPES={
 truck:{name:"Plankton's Truck",short:'Truck',hp:3,color:'#437f81',tip:'Dodge the charge. Dash into the truck.',attack:'CHARGE LANE · move sideways',opening:'DASH INTO THE TRUCK'},
 jelly:{name:'King Jellyfish',short:'King Jellyfish',hp:4,color:'#ce8ec4',tip:'Leave the marked circles. Dash when the crown turns green.',attack:'JELLY STRIKES · leave the circles',opening:'EXHAUSTED · dash now!'},
 vacuum:{name:'Mega Vacuum',short:'Mega Vacuum',hp:4,color:'#9d8fc2',tip:'Escape the suction cone. Dash into the cooling motor.',attack:'SUCTION · dash sideways',opening:'MOTOR COOLING · dash now!'},
 crab:{name:'Claw Crusher',short:'Claw Crusher',hp:4,color:'#d57c59',tip:'Leave the landing zone. Dash into the crab after it lands.',attack:'JUMP SLAM · leave the ring',opening:'CLAWS STUCK · dash now!'}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function bossVulnerable(b){return b&&!b.dead&&b.phase!=='arrive'&&(b.kind==='truck'||b.phase==='rest')}
export function bossHint(b){if(b.dead)return 'Street cleared!';if(b.phase==='recover')return 'REPOSITION · attack incoming';if(b.phase==='arrive')return BOSS_TYPES[b.kind].tip;return bossVulnerable(b)?BOSS_TYPES[b.kind].opening:BOSS_TYPES[b.kind].attack;}
export function createBoss(s,kind=s.nextBoss){const def=BOSS_TYPES[kind];return {kind,x:s.beacon?.x||0,z:s.beacon?.z??-8,hp:def.hp,maxHP:def.hp,phase:'arrive',clock:2,angle:0,vx:0,vz:0,hitCD:0,zones:[],wave:0,origin:null,target:null,dead:false};}
function prepare(s,b){b.phase='warning';b.clock=b.kind==='vacuum'?1.6:2.1;b.angle=Math.atan2(s.x-b.x,s.z-b.z);b.zones=[];
 if(b.kind==='jelly'){const a=b.angle;for(let i=0;i<3;i++){const side=(i-1)*5.5;b.zones.push({x:clamp(s.x+Math.cos(a)*side,-21,21),z:clamp(s.z-Math.sin(a)*side,-21,21),r:3.5,active:false});}}
 if(b.kind==='crab'){b.origin={x:b.x,z:b.z};b.target={x:clamp(s.x,-19,19),z:clamp(s.z,-19,19)};b.zones=[{...b.target,r:5.3,active:false}];}
}
export function updateBoss(s,dt,{radius,hurt,emit,defeat}){const b=s.boss;if(!b||b.dead)return;b.hitCD=Math.max(0,b.hitCD-dt);b.clock-=dt;
 if(b.phase==='arrive'||b.phase==='recover'){if(b.clock<=0)prepare(s,b);}
 else if(b.phase==='warning'){if(b.clock<=0){b.phase='attack';b.clock=b.kind==='truck'?2.4:b.kind==='vacuum'?3.6:b.kind==='crab'?1.2:1.4;if(b.kind==='truck'){b.vx=Math.sin(b.angle)*7;b.vz=Math.cos(b.angle)*7;}}}
 else if(b.phase==='attack'){
  if(b.kind==='truck'){b.x+=b.vx*dt;b.z+=b.vz*dt;if(Math.abs(b.x)>22||Math.abs(b.z)>22){b.x=clamp(b.x,-22,22);b.z=clamp(b.z,-22,22);b.clock=0;}if(distance(s,b)<radius+2.1)hurt(s,'Truck collision!');}
  if(b.kind==='jelly'){for(let i=0;i<b.zones.length;i++){const q=b.zones[i],age=1.4-b.clock-i*.3;q.active=age>=0&&age<.45;if(q.active&&distance(s,q)<q.r)hurt(s,'Jelly lightning!');}}
  if(b.kind==='vacuum'){const dx=s.x-b.x,dz=s.z-b.z,d=Math.hypot(dx,dz),facing=(dx*Math.sin(b.angle)+dz*Math.cos(b.angle))/Math.max(.01,d);if(d<15&&(d<radius+1||facing>Math.cos(.6))){if(s.dash<=0){s.x-=dx/Math.max(.1,d)*Math.min(d,dt*3.2);s.z-=dz/Math.max(.1,d)*Math.min(d,dt*3.2);}if(d<radius+2.4)hurt(s,'Caught in the vacuum!');}}
  if(b.kind==='crab'){const flight=Math.min(1,(1.2-b.clock)/.55);b.x=b.origin.x+(b.target.x-b.origin.x)*flight;b.z=b.origin.z+(b.target.z-b.origin.z)*flight;b.wave=flight<1?0:Math.min(5.3,(.65-b.clock)*12);b.zones[0].active=flight>=1;if(flight>=1&&distance(s,b)<5.3)hurt(s,'Crab slam!');}
  if(b.clock<=0){b.phase='rest';b.clock=b.kind==='truck'?4:5;b.zones=[];b.wave=0;emit(s,'opening',BOSS_TYPES[b.kind].opening);}
 }else if(b.clock<=0)prepare(s,b);
 // Every hit requires its own dash; armoured bosses accept hits only in the green opening.
 if(distance(s,b)<radius+2.1&&s.dash>0&&b.hitCD<=0&&b.phase!=='arrive'){
  if(bossVulnerable(b)){b.hp--;b.hitCD=1.8;s.invuln=Math.max(s.invuln,2);s.dash=0;s.dashCD=1;s.steer=null;b.zones=[];b.wave=0;b.phase=b.kind==='truck'?'rest':'recover';b.clock=b.kind==='truck'?3:1.2;emit(s,'bossHit',b.hp?`${BOSS_TYPES[b.kind].short} hit! ${b.hp} hit${b.hp===1?'':'s'} left.`:'Boss defeated! Street cleared.',{x:b.x,z:b.z});if(!b.hp){b.dead=true;defeat(s,b);}}
  else{b.hitCD=.7;emit(s,'bump','Armoured! Wait for the green opening.');}
 }
}
