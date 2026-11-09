export const PHYSICS={gravity:9.8,stiffness:36,damping:2.8,maxStretch:1.38,dt:1/120};
// Brief ground-control assistance keeps a requested small hop small, even when
// the other partner is moving quickly. The rope still pulls on both bodies.
const effectiveMass=p=>(p.mass??1)*(p.hopping?7:1);
export function springForce(a,b,rest){
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.0001,Math.hypot(dx,dy)),nx=dx/d,ny=dy/d;
 const extension=Math.max(0,d-rest),speed=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
 const tension=extension>0?Math.max(0,PHYSICS.stiffness*extension+PHYSICS.damping*speed):0;
 return {x:nx*tension,y:ny*tension,tension,extension,distance:d};
}
export function integratePair(a,b,rest,dt){
 const force=springForce(a,b,rest);
 for(const [i,p] of [a,b].entries()){
  if(p.grounded){p.vx=0;p.vy=0;continue;}
  const direction=i===0?1:-1,mass=effectiveMass(p);
  p.vx+=(direction*force.x/mass-p.vx*.025)*dt;
  p.vy+=(direction*force.y/mass-PHYSICS.gravity-p.vy*.025)*dt;
  p.x+=p.vx*dt;p.y+=p.vy*dt;
 }
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.0001,Math.hypot(dx,dy)),limit=rest*PHYSICS.maxStretch;
 if(d>limit){const invA=a.grounded?0:1/effectiveMass(a),invB=b.grounded?0:1/effectiveMass(b),sum=invA+invB;
  if(sum){const nx=dx/d,ny=dy/d,excess=d-limit;a.x+=nx*excess*invA/sum;a.y+=ny*excess*invA/sum;b.x-=nx*excess*invB/sum;b.y-=ny*excess*invB/sum;const outward=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   if(outward>0){a.vx+=nx*outward*.75*invA/sum;a.vy+=ny*outward*.75*invA/sum;b.vx-=nx*outward*.75*invB/sum;b.vy-=ny*outward*.75*invB/sum;}}
 }
 return springForce(a,b,rest);
}
export function simulateLaunch(from,pivot,rest,vx,vy,mass=1){
 const a={...pivot,vx:0,vy:0,grounded:true,mass:1},b={...from,vx,vy,grounded:false,mass};const points=[{x:b.x,y:b.y}];let previous={...b},maxStrain=0;
 for(let i=0;i<600;i++){
  previous={...b};const force=integratePair(a,b,rest,PHYSICS.dt);maxStrain=Math.max(maxStrain,force.extension/rest);
  if(i%6===0)points.push({x:b.x,y:b.y});
  if(b.y<=pivot.y&&b.vy<0&&i>15){const t=(previous.y-pivot.y)/Math.max(.00001,previous.y-b.y);const x=previous.x+(b.x-previous.x)*t;points.push({x,y:pivot.y});return {x,time:(i+t)*PHYSICS.dt,points,maxStrain};}
 }
 return {x:b.x,time:5,points,maxStrain};
}
// A small launch assist preserves the readable forward relay. After launch,
// both bodies obey spring forces: moving the anchor changes the actual flight.
export function planLaunch(from,pivot,rest,targetX,mass=1){
 const vy=11.2*Math.sqrt(rest/4.4),maxVX=12*Math.sqrt(rest/4.4);let best=null;
 const candidate=vx=>{const path=simulateLaunch(from,pivot,rest,vx,vy,mass),error=Math.abs(path.x-targetX);if(!best||error<best.error)best={vx,vy,path,error};};
 for(let i=0;i<=32;i++)candidate(maxVX*i/32);
 let radius=maxVX/32;for(let i=0;i<8;i++){const mid=best.vx;candidate(Math.max(0,mid-radius*.5));candidate(mid+radius*.5);radius*=.5;}
 return best;
}
