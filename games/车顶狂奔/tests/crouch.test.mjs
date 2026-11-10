import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/simulation.mjs';
import {makeCourse} from '../src/courses.mjs';
import {crouchGate} from '../src/controls.mjs';

test('crouching really clears the low beam that blocks a standing player on the same truck',()=>{
 const create=()=>{const course=makeCourse(2,0),gate={...course.gates[0]},game=new Game(course);course.gates=[{...gate,s:game.startS+12,x:game.player.x}];game.begin();return game;};
 const standing=create(),ducking=create();
 for(let i=0;i<150;i++){standing.step(1/120,{});ducking.step(1/120,{crouch:true});}
 assert.equal(standing.state,'failed');assert.match(standing.reason,/限高架/);
 assert.equal(ducking.state,'playing');assert.ok(ducking.player.s>ducking.course.gates[0].s+2);
 assert.ok(ducking.player.y+1.65-ducking.player.crouch*.85<ducking.course.gates[0].bottom);
});

test('crouch is offered only near a relevant low beam, never on ordinary road sections',()=>{
 assert.equal(crouchGate(makeCourse(0,0),{x:0,s:400}),null);
 const course=makeCourse(2,0),gate=course.gates[0];
 assert.equal(crouchGate(course,{x:gate.x,s:gate.s-100}),null);
 assert.equal(crouchGate(course,{x:gate.x,s:gate.s-80}),gate);
 assert.equal(crouchGate(course,{x:gate.x+12,s:gate.s-40}),null);
 assert.equal(crouchGate(course,{x:gate.x,s:gate.s+5}),gate);
 assert.equal(crouchGate(course,{x:gate.x,s:gate.s+10}),null);
});
