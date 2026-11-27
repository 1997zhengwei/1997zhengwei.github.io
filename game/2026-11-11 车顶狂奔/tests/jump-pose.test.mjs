import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
import {createCourier} from '../src/courier.mjs';
import {createAthleticJump,athleticJumpProgress} from '../src/jump-pose.mjs';

test('jump timing tucks at the real apex and prepares to land during descent',()=>{
 assert.equal(athleticJumpProgress(14,14),0);
 assert.equal(athleticJumpProgress(0,14),.5);
 assert.equal(athleticJumpProgress(-14,14),1);
 assert.equal(athleticJumpProgress(-30,14),1);
});

test('new jump keeps knees and ankles narrow through the entire flight and staggers the tuck',()=>{
 const c=createCourier(JSON.parse(readFileSync(new URL('../assets/courier-rig.json',import.meta.url),'utf8'))),clip=createAthleticJump(c.root,c.bones),mixer=new T.AnimationMixer(c.root),action=mixer.clipAction(clip).play();action.paused=true;
 const position=name=>c.bones[name].getWorldPosition(new T.Vector3());let apexLift=0,stagger=0;
 for(let i=0;i<=100;i++){
  action.time=Math.min(.999,i/100);mixer.update(0);c.root.updateMatrixWorld(true);
  const leftKnee=position('calf_l'),rightKnee=position('calf_r'),leftFoot=position('foot_l'),rightFoot=position('foot_r');
  assert.ok(leftKnee.x-rightKnee.x>0&&leftKnee.x-rightKnee.x<.30,'knees stay forward without crossing or wide splay');
  assert.ok(leftFoot.x-rightFoot.x>0&&leftFoot.x-rightFoot.x<.30,'ankles stay within a normal stance');
  if(i===50){apexLift=leftKnee.y;stagger=Math.abs(leftFoot.z-rightFoot.z);}
  c.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),o.name));
 }
 assert.ok(apexLift>.65,'lead knee lifts toward the chest');assert.ok(stagger>.15,'feet stagger front/back instead of sideways');
 assert.ok(position('foot_l').y<.13,'legs extend before landing');
});
