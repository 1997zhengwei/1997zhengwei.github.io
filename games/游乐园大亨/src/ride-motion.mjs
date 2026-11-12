const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
export const cycle=p=>p-Math.sin(p*Math.PI*2)/(Math.PI*2);
export const flight=p=>ease(p/.18)*(1-ease((p-.78)/.22));
export function dropHeight(p){
 if(p<.12)return 0;
 if(p<.49)return 25*ease((p-.12)/.37);
 if(p<.61)return 25;
 if(p<.73)return 25*(1-ease((p-.61)/.12));
 if(p<.88)return Math.sin((p-.73)/.15*Math.PI)*3.6;
 return 0;
}
export function dropStage(p){return p<.12?'压杆已锁定 · 准备升空':p<.49?'缓缓升空 · 整座海岛在脚下':p<.61?'高空悬停 · 准备迎接失重！':p<.73?'自由落下 · 放声尖叫吧！':p<.88?'柔和回弹 · 安全减速':'平稳回站 · 欢迎再来';}

// Deterministic bumper-car rehearsal shared by the real cars and passenger cameras.
// Fixed integration steps keep pair collisions stable across render frame rates.
export function makeBumperMotion(duration=30,count=10){
 const dt=1/60,frames=[],cars=Array.from({length:count},(_,i)=>{
  const a=i*Math.PI*2/count;
  return {x:Math.cos(a)*7.8,z:Math.sin(a)*4.7,vx:-Math.sin(a)*2.5,vz:Math.cos(a)*2.5,yaw:Math.atan2(Math.sin(a),-Math.cos(a)),bump:0};
 });
 for(let step=0;step<=Math.ceil(duration/dt);step++){
  const t=step*dt,p=t/duration,speedEnvelope=ease(t/2)*(1-ease((p-.90)/.10));
  if(step){
   for(let i=0;i<count;i++){
    const c=cars[i],turn=Math.sin(t*.7+i*1.7)*.24*dt,cos=Math.cos(turn),sin=Math.sin(turn);
    [c.vx,c.vz]=[c.vx*cos-c.vz*sin,c.vx*sin+c.vz*cos];
    const len=Math.hypot(c.vx,c.vz)||1,target=2.6+(i%3)*.17;
    c.vx*=target/len;c.vz*=target/len;c.x+=c.vx*dt*speedEnvelope;c.z+=c.vz*dt*speedEnvelope;c.bump*=.86;
    for(const [pos,vel,bound]of [['x','vx',10],['z','vz',6.8]])if(Math.abs(c[pos])>bound){c[pos]=Math.sign(c[pos])*bound;c[vel]=-Math.sign(c[pos])*Math.abs(c[vel]);c.bump=.13;}
   }
   for(let pass=0;pass<3;pass++)for(let i=0;i<count;i++)for(let j=i+1;j<count;j++){
    const a=cars[i],b=cars[j],dx=b.x-a.x,dz=b.z-a.z,dist=Math.hypot(dx,dz);
    if(dist>=2.65)continue;
    const nx=dist?dx/dist:1,nz=dist?dz/dist:0,push=(2.65-dist)*.5+.001;
    a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;
    const approach=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;
    if(approach<0){const impulse=-approach*.92;a.vx-=nx*impulse;a.vz-=nz*impulse;b.vx+=nx*impulse;b.vz+=nz*impulse;a.bump=b.bump=.13;}
   }
   for(const c of cars){const yaw=Math.atan2(-c.vx,-c.vz),delta=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw));c.yaw+=delta*.14;}
  }
  frames.push(cars.map(c=>({x:c.x,z:c.z,yaw:c.yaw,bump:c.bump,speed:Math.hypot(c.vx,c.vz)*speedEnvelope})));
 }
 return p=>{
  const f=clamp(p)* (frames.length-1),a=frames[Math.floor(f)],b=frames[Math.min(frames.length-1,Math.floor(f)+1)],t=f%1;
  return a.map((c,i)=>Object.fromEntries(Object.keys(c).map(k=>[k,c[k]+(b[i][k]-c[k])*t])));
 };
}
