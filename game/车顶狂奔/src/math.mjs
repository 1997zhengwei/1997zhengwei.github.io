export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const damp=(a,b,k,dt)=>mix(a,b,1-Math.exp(-k*dt));
export const smooth=t=>(t=clamp(t,0,1))*t*(3-2*t);
export const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function random(seed=1){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function localPoint(truck,x,s){const c=Math.cos(truck.yaw),q=Math.sin(truck.yaw),dx=x-truck.x,ds=s-truck.s;return{x:dx*c-ds*q,s:dx*q+ds*c};}
export function worldPoint(truck,x,s){const c=Math.cos(truck.yaw),q=Math.sin(truck.yaw);return{x:truck.x+x*c+s*q,s:truck.s-x*q+s*c};}
export function roofAt(truck,x,s,margin=0){const q=localPoint(truck,x,s),tilt=Math.sin(truck.pitch||0)*q.s+Math.sin(truck.roll||0)*q.x;if(Math.abs(q.x)>1.68+margin)return null;if(q.s>=-7.6-margin&&q.s<=4.15+margin)return 3.82+truck.y+tilt;if(q.s>=4.23-margin&&q.s<=7.85+margin)return 3.14+truck.y+tilt;return null;}
