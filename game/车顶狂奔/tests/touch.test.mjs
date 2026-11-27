import test from 'node:test';
import assert from 'node:assert/strict';
import {Input} from '../src/input.mjs';
import {touchLayout} from '../src/controls.mjs';
import {Game} from '../src/simulation.mjs';
import {makeCourse} from '../src/courses.mjs';

class Element extends EventTarget{
 constructor(){super();this.style={};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};}
 setPointerCapture(id){this.capture=id;}
 getBoundingClientRect(){return{left:0,top:0,width:110,height:110};}
}
function setup(){
 const previous={window:globalThis.window,document:globalThis.document};
 globalThis.window=new EventTarget();globalThis.document=new EventTarget();
 const nodes=Object.fromEntries(['canvas','stick','knob','jump','focus','crouch'].map(k=>[k,new Element()]));
 const lookup={'[data-joystick]':nodes.stick,'.stick-knob':nodes.knob,'[data-hold="jump"]':nodes.jump,'[data-hold="focus"]':nodes.focus,'[data-hold="crouch"]':nodes.crouch};
 const root={querySelector:s=>lookup[s],querySelectorAll:()=>Object.values(nodes).filter(n=>n.classes.has('pressed'))};
 const input=new Input(nodes.canvas,{});input.playing=true;input.bindTouch(root);
 return{...nodes,input,restore(){globalThis.window=previous.window;globalThis.document=previous.document;}};
}
function pointer(target,type,id=1,extra={}){const event=new Event(type,{cancelable:true});Object.assign(event,{pointerId:id,clientX:55,clientY:55,...extra});target.dispatchEvent(event);}

test('touch layout covers landscape phones, large tablets and hybrid pointer devices',()=>{
 assert.equal(touchLayout({width:400}),true);
 assert.equal(touchLayout({width:844,maxTouchPoints:5}),true);
 assert.equal(touchLayout({width:1280,anyCoarse:true}),true);
 assert.equal(touchLayout({width:1024,coarse:true}),true);
 assert.equal(touchLayout({width:1280}),false);
});

test('a screen jump press feeds the same real physics as the keyboard',()=>{
 const h=setup();try{const game=new Game(makeCourse());game.begin();const y=game.player.y;pointer(h.jump,'pointerdown');assert.equal(h.input.sample(.01).jump,true);assert.equal(h.input.touchJump,true);pointer(h.jump,'pointerup');pointer(h.jump,'pointerdown');game.step(1/120,h.input.sample(.01));for(let i=0;i<35;i++)game.step(1/120,h.input.sample(.01));assert.equal(game.player.grounded,false);assert.ok(game.player.y>y+2);pointer(h.jump,'pointerup');assert.equal(h.input.touchJump,false);assert.equal(h.input.sample(.01).jump,false);}finally{h.restore();}
});

test('second fingers, cancellation and lost capture cannot leave jump or movement held',()=>{
 const h=setup();try{pointer(h.jump,'pointerdown',1);pointer(h.jump,'pointerup',2);assert.equal(h.input.touchJump,true);pointer(h.jump,'lostpointercapture',1);assert.equal(h.input.touchJump,false);pointer(h.focus,'pointerdown',3);pointer(h.focus,'pointercancel',3);assert.equal(h.input.touchFocus,false);pointer(h.stick,'pointerdown',4,{clientY:10});assert.ok(h.input.touchZ>.9);pointer(h.stick,'lostpointercapture',4);assert.equal(h.input.touchZ,0);pointer(h.jump,'pointerdown',5);h.input.clear();assert.equal(h.input.touchJump,false);assert.equal(h.jump.classes.has('pressed'),false);pointer(h.jump,'pointerdown',6);assert.equal(h.input.touchJump,true);pointer(h.jump,'pointerup',5);assert.equal(h.input.touchJump,true);pointer(h.jump,'pointerup',6);assert.equal(h.input.touchJump,false);}finally{h.restore();}
});

test('paused touch controls do not start jumps or move the stick',()=>{
 const h=setup();try{h.input.playing=false;pointer(h.jump,'pointerdown');pointer(h.stick,'pointerdown',2,{clientY:0});assert.equal(h.input.sample(.01).jump,false);assert.equal(h.input.touchZ,0);}finally{h.restore();}
});
