import * as T from '../vendor/three.module.js';
import {clamp} from './math.mjs';

// Rise -> compact staggered tuck -> extend for landing, driven by actual vertical speed.
export function athleticJumpProgress(verticalSpeed,jumpSpeed){
 return .5-.5*clamp(verticalSpeed/jumpSpeed,-1,1);
}

export function createAthleticJump(root,bones){
 root.updateMatrixWorld(true);
 const names=Object.keys(bones),rest={},world={},axis={};
 for(const name of names){const b=bones[name];rest[name]={q:b.quaternion.clone(),p:b.position.clone()};world[name]=b.getWorldQuaternion(new T.Quaternion());}
 const children={thigh_l:'calf_l',thigh_r:'calf_r',calf_l:'foot_l',calf_r:'foot_r',upperarm_l:'lowerarm_l',upperarm_r:'lowerarm_r',lowerarm_l:'hand_l',lowerarm_r:'hand_r'};
 for(const[name,child]of Object.entries(children))axis[name]=bones[child].getWorldPosition(new T.Vector3()).sub(bones[name].getWorldPosition(new T.Vector3())).normalize();
 const times=[0,.18,.42,.58,.80,1],values=Object.fromEntries(names.map(n=>[n,[]]));
 const poses=[
  {pitch:.025,lead:[0,-.995,.10],trail:[0,-.998,.06],shinL:[0,-.998,-.06],shinR:[0,-.999,-.035],armL:[.12,-.98,.1],armR:[-.12,-.98,.1],foreL:[.02,-.7,.71],foreR:[-.02,-.7,.71],toe:.015},
  {pitch:.10,lead:[.015,-.62,.78],trail:[-.015,-.86,.51],shinL:[0,-.92,-.39],shinR:[0,-.54,-.84],armL:[.12,-.95,-.29],armR:[-.1,-.8,.59],foreL:[.02,-.20,.98],foreR:[-.02,.52,.85],toe:.16},
  {pitch:.14,lead:[.012,-.39,.92],trail:[-.012,-.76,.65],shinL:[0,-.93,-.36],shinR:[0,-.47,-.88],armL:[.12,-.95,-.29],armR:[-.10,-.82,.56],foreL:[.02,.1,.99],foreR:[-.02,.65,.76],toe:.20},
  {pitch:.12,lead:[.012,-.46,.89],trail:[-.012,-.79,.61],shinL:[0,-.95,-.31],shinR:[0,-.55,-.84],armL:[.12,-.97,-.22],armR:[-.10,-.86,.5],foreL:[.02,-.2,.98],foreR:[-.02,.52,.85],toe:.14},
  {pitch:.07,lead:[.008,-.82,.57],trail:[-.008,-.96,.28],shinL:[0,-.98,-.20],shinR:[0,-.88,-.47],armL:[.12,-.98,.08],armR:[-.12,-.97,.21],foreL:[.02,-.55,.83],foreR:[-.02,-.32,.95],toe:.06},
  {pitch:.025,lead:[0,-.995,.10],trail:[0,-.998,.06],shinL:[0,-.998,-.06],shinR:[0,-.999,-.035],armL:[.12,-.98,.12],armR:[-.12,-.98,.12],foreL:[.02,-.68,.73],foreR:[-.02,-.68,.73],toe:0}
 ];
 const xAxis=new T.Vector3(1,0,0),parentQ=new T.Quaternion();
 function worldRotation(name,q){const b=bones[name];b.parent.getWorldQuaternion(parentQ).invert();b.quaternion.copy(parentQ).multiply(q);b.updateWorldMatrix(false,true);}
 function aim(name,direction){const delta=new T.Quaternion().setFromUnitVectors(axis[name],new T.Vector3(...direction).normalize());worldRotation(name,delta.multiply(world[name]));}
 for(const pose of poses){
  for(const name of names){bones[name].quaternion.copy(rest[name].q);bones[name].position.copy(rest[name].p);}root.updateMatrixWorld(true);
  worldRotation('pelvis',new T.Quaternion().setFromAxisAngle(xAxis,pose.pitch).multiply(world.pelvis));
  aim('thigh_l',pose.lead);aim('thigh_r',pose.trail);aim('calf_l',pose.shinL);aim('calf_r',pose.shinR);
  for(const side of['l','r'])worldRotation('foot_'+side,new T.Quaternion().setFromAxisAngle(xAxis,pose.toe).multiply(world['foot_'+side]));
  aim('upperarm_l',pose.armL);aim('upperarm_r',pose.armR);aim('lowerarm_l',pose.foreL);aim('lowerarm_r',pose.foreR);
  for(const name of names)bones[name].quaternion.toArray(values[name],values[name].length);
 }
 for(const name of names){bones[name].quaternion.copy(rest[name].q);bones[name].position.copy(rest[name].p);}root.updateMatrixWorld(true);
 const tracks=names.map(name=>new T.QuaternionKeyframeTrack(name+'.quaternion',times,values[name]));
 tracks.push(new T.VectorKeyframeTrack('pelvis.position',[0,1],[...rest.pelvis.p.toArray(),...rest.pelvis.p.toArray()]));
 return new T.AnimationClip('jump',1,tracks);
}
