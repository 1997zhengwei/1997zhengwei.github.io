// The visual ramp, swimmer pose and shoreline navigation use one profile.
export const SHORE={swimEnd:-7.0,rampStart:-4.8,rampEnd:.8,seaFeet:-1.75,deck:.205,halfLane:1.7,rampHalfWidth:2.6};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const isSwimming=z=>z<SHORE.rampStart;
export function rampHeight(z){return mix(SHORE.seaFeet,SHORE.deck,clamp((z-SHORE.rampStart)/(SHORE.rampEnd-SHORE.rampStart)));}
export function shorePose(z){const swim=1-smooth((z-SHORE.swimEnd)/(SHORE.rampStart-SHORE.swimEnd));return {swim,feet:rampHeight(z)+.01,tilt:-Math.PI/2*swim,lift:.95*swim};}
export function cargoFrame(z,count){const pose=shorePose(z),visible=Math.min(12,count),height=.55+visible*.16,angle=pose.swim*Math.PI/2;return {visible,height,angle,y:mix(2.25+height/2,1.10,pose.swim),z:mix(.48,1.2+height/2,pose.swim),feet:pose.feet};}
export function cargoItem(actor,index,count){const f=cargoFrame(actor.z,count),along=-f.height/2+.29+index*.16,x=index%2?.065:-.065,z=f.z+Math.sin(f.angle)*along,y=f.feet+f.y+Math.cos(f.angle)*along,heading=actor.heading;return {x:actor.x+Math.cos(heading)*x+Math.sin(heading)*z,y,z:actor.z-Math.sin(heading)*x+Math.cos(heading)*z};}
export const LEG_HEIGHT=.61;
export const SHOES={diver:{width:.31,height:.15,depth:.82,y:-.54,z:-.22},guest:{width:.26,height:.15,depth:.41,y:-.54,z:-.08}};
export function shoeCorners(shoe){const points=[];for(const x of [-shoe.width/2,shoe.width/2])for(const y of [shoe.y-shoe.height/2,shoe.y+shoe.height/2])for(const z of [shoe.z-shoe.depth/2,shoe.z+shoe.depth/2])points.push([x,y,z]);return points;}
const corners={diver:shoeCorners(SHOES.diver),guest:shoeCorners(SHOES.guest)};
export function footLift(actorZ,feetY,heading,legX,rx,rz,diver=true){
 const cx=Math.cos(rx),sx=Math.sin(rx),cz=Math.cos(rz),sz=Math.sin(rz),ch=Math.cos(heading),sh=Math.sin(heading);let lift=0;
 for(const [x,y,z] of corners[diver?'diver':'guest']){const xx=cz*x-sz*y,yy=sz*x+cz*y,rotY=cx*yy-sx*z,rotZ=sx*yy+cx*z,worldZ=actorZ-sh*(legX+xx)+ch*rotZ,ground=rampHeight(worldZ);lift=Math.max(lift,ground+.008-(feetY+LEG_HEIGHT+rotY));}
 return lift;
}
