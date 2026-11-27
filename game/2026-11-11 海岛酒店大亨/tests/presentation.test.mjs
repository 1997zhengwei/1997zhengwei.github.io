import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {projectPoint,pickFloor,screenDirection,WORLD_SCALE,CAMERA_OFFSET,FOLLOW_HEIGHT,floorHeightAt} from '../src/presentation.mjs';
function camera(w,h){const c=new T.OrthographicCamera(-FOLLOW_HEIGHT/2*w/h,FOLLOW_HEIGHT/2*w/h,FOLLOW_HEIGHT/2,-FOLLOW_HEIGHT/2,.1,200);c.position.set(CAMERA_OFFSET.x,CAMERA_OFFSET.y,CAMERA_OFFSET.z);c.lookAt(0,0,0);c.updateProjectionMatrix();c.updateMatrixWorld(true);return c;}
test('floor picking returns the displayed world position after the visual rescale',()=>{for(const [w,h] of [[400,580],[390,780],[1280,720]]){const c=camera(w,h);for(const [x,z] of [[0,8.4],[-8,3.1],[8,-4.9],[15.8,-.8],[-19,-.5]]){const p=projectPoint(c,x,floorHeightAt(x,z),z,w,h),back=pickFloor(c,p.x,p.y,w,h);assert.ok(Math.abs(back.x-x)<1e-7);assert.ok(Math.abs(back.z-z)<1e-7);}}});
test('left/right and up/down input stay screen-relative in the new camera',()=>{const c=camera(400,580),origin=projectPoint(c,0,floorHeightAt(0,0),0,400,580);for(const [x,y] of [[-1,0],[1,0],[0,-1],[0,1]]){const d=screenDirection(c,x,y),p=projectPoint(c,d.x,floorHeightAt(d.x,d.z),d.z,400,580);assert.ok(Math.abs(Math.hypot(d.x,d.z)-1)<1e-7);if(x)assert.ok((p.x-origin.x)*x>0);if(y)assert.ok((p.y-origin.y)*y>0);}assert.ok(WORLD_SCALE>0);});
