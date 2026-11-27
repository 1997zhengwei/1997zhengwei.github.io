import * as T from '../vendor/three.module.js';
export const UP=new T.Vector3(0,1,0);
export const coasterCurve=new T.CatmullRomCurve3([
 [-10,1.7,10],[-11,1.7,5],[-12,5,-1],[-12,12,-8],[-8,19,-13],[-1,18.5,-14],[6,5.5,-12],[11,2.4,-7],[12,4,-1],[8,9,4],[1,6,5],[-4,3,-1],[0,3,-6],[5,4,-4],[6,2,1],[5,1.9,8],[0,1.7,12],[-5,1.7,12]
].map(p=>new T.Vector3(...p)),true,'centripetal');
coasterCurve.arcLengthDivisions=1600;coasterCurve.updateArcLengths();
export const trackLength=coasterCurve.getLength();
export function supportClear(u){const top=coasterCurve.getPointAt(u);for(let i=0;i<300;i++){const v=i/300;let d=Math.abs(v-u);d=Math.min(d,1-d);if(d<.045)continue;const p=coasterCurve.getPointAt(v);if(p.y<=top.y+.3&&Math.hypot(p.x-top.x,p.z-top.z)<1.4)return false;}return true;}
export function trackFrame(u){u=((u%1)+1)%1;const p=coasterCurve.getPointAt(u),f=coasterCurve.getTangentAt(u).normalize();const before=coasterCurve.getTangentAt((u-.009+1)%1),after=coasterCurve.getTangentAt((u+.009)%1);const turn=before.x*after.z-before.z*after.x;const bank=T.MathUtils.clamp(-turn*2.2,-.52,.52);const up=UP.clone().applyAxisAngle(f,bank),side=new T.Vector3().crossVectors(f,up).normalize();up.crossVectors(side,f).normalize();const matrix=new T.Matrix4().makeBasis(side,up,f.clone().negate());return {p,f,side,up,bank,q:new T.Quaternion().setFromRotationMatrix(matrix)};}
const table=[{u:0,t:0,v:3.8}];let totalTime=0;
for(let i=1;i<=1000;i++){const u=i/1000,p=coasterCurve.getPointAt(Math.min(.999999,u));let speed=u<.285?3.8:Math.min(20,Math.sqrt(32+2*9.8*Math.max(0,19-p.y)));if(u>.86)speed=3.8+(speed-3.8)*Math.max(0,(1-u)/.14);const duration=trackLength/1000/speed;totalTime+=duration;table.push({u,t:totalTime,v:speed});}
export const motionDuration=totalTime;
export function coasterMotion(progress){const t=T.MathUtils.clamp(progress,0,.999999)*totalTime;let lo=0,hi=table.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(table[mid].t<t)lo=mid;else hi=mid;}const a=table[lo],b=table[hi],k=(t-a.t)/(b.t-a.t);return {u:a.u+(b.u-a.u)*k,speed:a.v+(b.v-a.v)*k};}
