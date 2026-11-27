import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {CameraRig,project,screenDirection,pickFloor} from '../src/presentation.mjs';
const setup=(w,h)=>{const c=new T.OrthographicCamera(),rig=new CameraRig(c);rig.resize(w,h);rig.focus.set(0,.3,0);rig.update({x:0,z:1.8},1);return c;};
test('keyboard and joystick left/right/up/down agree with screen directions',()=>{for(const [w,h]of [[1280,720],[400,580],[320,580]]){const c=setup(w,h),p=project(c,0,.25,0,w,h);for(const [x,y]of [[1,0],[-1,0],[0,1],[0,-1]]){const d=screenDirection(c,x,y),q=project(c,d.x,.25,d.y,w,h);assert(x?Math.sign(q.x-p.x)===x:Math.sign(q.y-p.y)===y);}}});
test('ground taps project back to the same physical point at all supported sizes',()=>{for(const [w,h]of [[1280,720],[400,580],[320,580]]){const c=setup(w,h),p=project(c,2,.25,5,w,h),ground=pickFloor(c,p.x,p.y,w,h);assert(Math.abs(ground[0]-2)<1e-6);assert(Math.abs(ground[1]-5)<1e-6);}});
