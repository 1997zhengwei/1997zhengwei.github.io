export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const damp=(a,b,k,dt)=>lerp(a,b,1-Math.exp(-k*dt));
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export const mixAngle=(a,b,t)=>a+angleDelta(a,b)*t;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const normal=(x,z)=>{const n=Math.hypot(x,z);return n>1e-7?{x:x/n,z:z/n}:{x:0,z:0};};
export function cameraMove(x,forward,yaw){return {x:Math.cos(yaw)*x-Math.sin(yaw)*forward,z:-Math.sin(yaw)*x-Math.cos(yaw)*forward};}
export const bearing=(from,to)=>Math.atan2(from.x-to.x,from.z-to.z);
export function rng(seed=1024){return()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function rayBox2D(x,z,dx,dz,b,pad=0){let near=-Infinity,far=Infinity;for(const [p,d,min,max]of[[x,dx,b.minX-pad,b.maxX+pad],[z,dz,b.minZ-pad,b.maxZ+pad]]){if(Math.abs(d)<1e-8){if(p<min||p>max)return null;continue;}let a=(min-p)/d,c=(max-p)/d;if(a>c)[a,c]=[c,a];near=Math.max(near,a);far=Math.min(far,c);if(near>far)return null;}return far<0?null:{near:Math.max(0,near),far};}
export function rayBox3(origin,direction,b,limit=Infinity,pad=0){let near=0,far=limit;for(const [p,d,min,max]of[[origin.x,direction.x,b.minX-pad,b.maxX+pad],[origin.y,direction.y,b.minY-pad,b.maxY+pad],[origin.z,direction.z,b.minZ-pad,b.maxZ+pad]]){if(Math.abs(d)<1e-8){if(p<min||p>max)return null;continue;}let a=(min-p)/d,c=(max-p)/d;if(a>c)[a,c]=[c,a];near=Math.max(near,a);far=Math.min(far,c);if(near>far)return null;}return near;}
