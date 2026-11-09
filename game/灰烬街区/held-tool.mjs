import * as T from './vendor/build/three.module.js';

// The mesh origin is at the bottom of the handle. Put the actual handle grip
// at the palm, and cancel the character's normalization scale exactly once.
export function attachHeldTool(character,toolScene,bodyScale){
 const hand=character.getObjectByName('RightHand');
 if(!hand)throw Error('角色缺少RightHand骨骼，无法握持工具');
 const bounds=new T.Box3().setFromObject(toolScene),height=bounds.max.y-bounds.min.y;
 const grip=new T.Group();grip.name='RightPalmToolGrip';grip.position.set(0,.13,-.012);grip.rotation.z=2.2;grip.scale.setScalar(1/bodyScale);hand.add(grip);
 const meshScale=.60/height,handlePoint=new T.Vector3(0,bounds.min.y+height*.33,0);
 toolScene.scale.multiplyScalar(meshScale);toolScene.position.copy(handlePoint).multiplyScalar(-meshScale);grip.add(toolScene);
 return {grip,hand,toolScene,handlePoint,bodyScale};
}

const overrides=new WeakMap();
export function resetToolSwing(character){const previous=overrides.get(character);if(previous){for(const [bone,quaternion] of previous)bone.quaternion.copy(quaternion);overrides.delete(character);}}
export function toolSwing(character,cool){
 if(cool<=0)return;const arm=character.getObjectByName('RightArm'),forearm=character.getObjectByName('RightForeArm');
 const phase=Math.max(0,Math.min(1,1-cool/.65)),amount=Math.sin(phase*Math.PI);
 overrides.set(character,[arm,forearm].filter(Boolean).map(b=>[b,b.quaternion.clone()]));
 arm?.rotateX(-amount*.95);forearm?.rotateX(-amount*.55);
}
