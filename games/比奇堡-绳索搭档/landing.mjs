export const ROUTE_STRIDE=4.4;
export const ROUTE_FINISH=120;
// The landing recoil is cosmetic; all forward steps now require player input.
export function sampleLanding(landing){
 const t=Math.max(0,Math.min(1,landing.age/landing.duration));
 if(t<.28)return {stage:'impact',squash:Math.sin(t/.28*Math.PI)*.14,lean:0,leg:0,height:0};
 const bounce=Math.sin((t-.28)/.72*Math.PI);
 return {stage:t===1?'ready':'rebound',squash:-bounce*.045,lean:0,leg:bounce*.11,height:bounce*.075};
}
export function actorPose(actor){
 if(actor.hopping){const p=Math.min(1,actor.hopAge/.38);return {stage:'manual-hop',squash:-Math.sin(p*Math.PI)*.04,lean:-Math.sign(actor.vx)*.07,leg:Math.sin(p*Math.PI*2)*.3,height:0};}
 if(actor.impactAge>=0&&actor.impactAge<.28)return sampleLanding({age:actor.impactAge,duration:.28});
 return null;
}
