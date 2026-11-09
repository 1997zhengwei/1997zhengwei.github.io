import {CARS} from './world.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const CAR_SIZE={halfWidth:.86,halfLength:2.05};
const NAMES={sedan:'旅行轿车',police:'巡逻车',van:'货运面包车',ambulance:'救护车'};
export const cargoCapacity=v=>({sedan:60,police:50,van:120,ambulance:80})[v.type]||60;
export function createVehicles(){return CARS.map(([type,x,z,angle],i)=>({id:'car-'+i,type,name:NAMES[type],x:i===0?-10.3:x,z:i===0?21.5:z,angle:i===0?Math.PI/2:angle,speed:0,fuel:72-i*7,hp:100,cargo:{},engine:false,noiseAt:0,crashAt:0,hornAt:0}));}
export function vehicleContains(v,x,z,r=0){const dx=x-v.x,dz=z-v.z,c=Math.cos(v.angle),sn=Math.sin(v.angle);return Math.abs(dx*c-dz*sn)<CAR_SIZE.halfWidth+r&&Math.abs(dx*sn+dz*c)<CAR_SIZE.halfLength+r;}
export function hull(v){const c=Math.cos(v.angle),sn=Math.sin(v.angle);return {x:v.x,z:v.z,w:2*(Math.abs(c)*CAR_SIZE.halfWidth+Math.abs(sn)*CAR_SIZE.halfLength),d:2*(Math.abs(sn)*CAR_SIZE.halfWidth+Math.abs(c)*CAR_SIZE.halfLength)};}
export function vehicleRectOverlap(v,b){const dx=b.x-v.x,dz=b.z-v.z,c=Math.cos(v.angle),sn=Math.sin(v.angle),a=CAR_SIZE.halfWidth,l=CAR_SIZE.halfLength,bx=b.w/2,bz=b.d/2;return Math.abs(dx)<Math.abs(c)*a+Math.abs(sn)*l+bx&&Math.abs(dz)<Math.abs(sn)*a+Math.abs(c)*l+bz&&Math.abs(dx*c-dz*sn)<a+Math.abs(c)*bx+Math.abs(sn)*bz&&Math.abs(dx*sn+dz*c)<l+Math.abs(sn)*bx+Math.abs(c)*bz;}
export function vehicleCollision(s,v,rectangles){return Math.abs(v.x)+hull(v).w/2>59||Math.abs(v.z)+hull(v).d/2>59||rectangles.some(b=>vehicleRectOverlap(v,b))||s.vehicles.some(o=>o.id!==v.id&&vehicleRectOverlap(v,hull(o)));}
export function driveVehicle(s,v,dt,input,rectangles,emitNoise,emit){
 const braking=!!input.brake,throttle=clamp(input.throttle||0,-1,1),steer=clamp(input.steer||0,-1,1);
 v.steering=steer;
 if(v.fuel<=0||v.hp<=0)v.engine=false;
 let accel=v.engine?throttle*(v.speed*throttle<0?11:throttle<0?4.7:5.5):0;
 if(braking)accel=-Math.sign(v.speed)*Math.min(16,Math.abs(v.speed)/dt);
 else if(!throttle||!v.engine)accel=-Math.sign(v.speed)*Math.min(2.7,Math.abs(v.speed)/dt);
 v.speed=clamp(v.speed+accel*dt,-4.2,12.5*(.55+.45*v.hp/100));
 if(Math.abs(v.speed)<.025)v.speed=0;
 const travel=v.speed*dt,turn=steer*1.55*clamp(Math.abs(v.speed)/3,0,1)*Math.sign(v.speed)*dt;
 const count=Math.max(1,Math.ceil(Math.abs(travel)/.16));let hit=false;
 for(let i=0;i<count;i++){
  const next={...v,angle:v.angle+turn/count,x:v.x+Math.sin(v.angle)*travel/count,z:v.z+Math.cos(v.angle)*travel/count};
  if(vehicleCollision(s,next,rectangles)){hit=true;break;}v.x=next.x;v.z=next.z;v.angle=next.angle;
 }
 if(hit){const impact=Math.abs(v.speed);if(impact>1.5&&s.elapsed>v.crashAt){v.hp=Math.max(0,v.hp-impact*.95);v.crashAt=s.elapsed+.7;emitNoise(s,v.x,v.z,20+impact,'crash');emit(s,'message','撞上障碍了。减速转向，注意车况。');}v.speed=0;}
 if(v.engine){v.fuel=Math.max(0,v.fuel-dt*(.018+Math.abs(throttle)*.045+Math.abs(v.speed)*.002));if(s.elapsed>=v.noiseAt){v.noiseAt=s.elapsed+1;emitNoise(s,v.x,v.z,13+Math.abs(v.speed)*1.7,'engine');}}
 for(const z of s.zombies){if(z.hp<=0||Math.abs(v.speed)<2.8||(z.ramUntil||0)>s.elapsed||!vehicleContains(v,z.x,z.z,.2))continue;z.ramUntil=s.elapsed+1;z.hp-=Math.abs(v.speed)*9;v.hp=Math.max(0,v.hp-2);v.speed*=.78;z.cool=1.1;if(z.hp<=0){z.state='dead';s.kills++;emit(s,'kill','感染者被撞倒了。');}emitNoise(s,v.x,v.z,20,'crash');}
 if(v.hp<=0){v.engine=false;v.speed=0;}
}
