import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,PHYSICS} from '../src/simulation.mjs';
import {makeCourse,roadX} from '../src/courses.mjs';
import {localPoint,worldPoint,roofAt} from '../src/math.mjs';
const tick=(g,seconds,input={})=>{for(let i=0;i<Math.round(seconds*120);i++)g.step(1/120,input);};
const create=(w=0,s=0)=>{const g=new Game(makeCourse(w,s));g.begin();return g;};

test('A points left in camera coordinates, D points right, including a turned view',()=>{
 for(const yaw of[0,.6,-.6]){const left=create(),right=create(),a={x:left.player.x,s:left.player.s},b={x:right.player.x,s:right.player.s};tick(left,.12,{x:-1,yaw});tick(right,.12,{x:1,yaw});const projection=p=>(p.x-a.x)*Math.cos(yaw)-(p.s-a.s)*Math.sin(yaw);assert.ok(projection(left.player)<projection(right.player));assert.ok(left.player.relX<0);assert.ok(right.player.relX>0);}
});
test('standing still remains attached to the exact local contact through a curved road',()=>{
 const g=create(2),p=g.player,start=p.s,local={x:p.localX,s:p.localS};tick(g,4);assert.equal(g.state,'playing');assert.equal(p.grounded,true);assert.ok(p.s>start+30);const actual=localPoint(g.trucks[p.support],p.x,p.s);assert.ok(Math.abs(actual.x-local.x)<.001);assert.ok(Math.abs(actual.s-local.s)<.001);
});
test('rotated truck roof uses its local bounds and distinguishes cab height',()=>{
 const t={x:10,s:20,y:0,yaw:.63,pitch:0};for(const [x,s,height]of[[0,-5,3.82],[1.4,2,3.82],[0,6,3.14],[2.1,0,null]]){const p=worldPoint(t,x,s);assert.equal(roofAt(t,p.x,p.s),height);}const q=localPoint(t,...Object.values(worldPoint(t,.7,-4)));assert.ok(Math.abs(q.x-.7)<1e-8&&Math.abs(q.s+4)<1e-8);
});
test('jump inherits the carrier velocity and rises above the roof',()=>{
 const g=create();tick(g,.4);const p=g.player,s=p.s,speed=p.vs;g.step(1/120,{jump:true});assert.equal(p.grounded,false);assert.ok(p.vy>12);assert.ok(p.vs>speed-1);tick(g,.28);assert.ok(p.y>6);assert.ok(p.s>s+speed*.20);
});
test('held jump offers a little more height than a tap, and can land back on its carrier',()=>{
 const a=create(),b=create();a.step(1/120,{jump:true});b.step(1/120,{jump:true,jumpHeld:true});let maxA=0,maxB=0;for(let i=0;i<180;i++){a.step(1/120,{});b.step(1/120,{jumpHeld:true});maxA=Math.max(maxA,a.player.y);maxB=Math.max(maxB,b.player.y);}assert.ok(maxB>maxA+.45);assert.equal(a.state,'playing');assert.equal(b.state,'playing');assert.equal(a.player.grounded,true);assert.equal(b.player.grounded,true);
});
test('walking over an edge grants coyote time, but not an unlimited air jump',()=>{
 const g=create();let i=0;while(g.player.grounded&&i++<200)g.step(1/120,{x:1});assert.equal(g.player.grounded,false);assert.ok(g.player.coyote>0);g.step(1/120,{jump:true,x:1});assert.ok(g.player.vy>12);tick(g,.20);const before=g.jumps;g.step(1/120,{jump:true});assert.equal(g.jumps,before);
});
test('pause freezes the player, convoy, timer and focus energy',()=>{
 const g=create();tick(g,.5,{z:1});g.pause();const before=JSON.stringify({p:g.player,trucks:g.trucks,time:g.time,focus:g.focus});tick(g,3,{jump:true,x:1,focus:true});assert.equal(JSON.stringify({p:g.player,trucks:g.trucks,time:g.time,focus:g.focus}),before);g.resume();tick(g,.1);assert.ok(g.time>.5);
});
test('slow motion slows physics while using a bounded real-time energy budget',()=>{
 const g=create();tick(g,1,{focus:true});assert.ok(Math.abs(g.time-.38)<.001);assert.ok(Math.abs(g.focus-(1-1/3.6))<.001);tick(g,4,{focus:true});assert.ok(g.focus>=0&&g.focus<=1);assert.ok(g.time>1.4);
});
test('failure stops scoring and same-course retry resets all transient state deterministically',()=>{
 const g=create();const original=JSON.stringify(g.trucks);tick(g,3,{x:1});assert.equal(g.state,'failed');const time=g.time;tick(g,2,{jump:true,z:1});assert.equal(g.time,time);g.reset();assert.equal(g.state,'ready');assert.equal(g.landings,0);assert.equal(g.time,0);assert.equal(g.focus,1);assert.equal(JSON.stringify(g.trucks),original);
});
test('all nine course configurations are finite, distinct and keep an open route around dividers',()=>{
 const lengths=new Set();for(let w=0;w<3;w++)for(let s=0;s<3;s++){const c=makeCourse(w,s);lengths.add(c.length);assert.ok(c.goal.minS>c.roadEnd);assert.ok(c.obstacles.length>=3);for(const o of c.obstacles)assert.ok(o.w<c.width*.3);assert.equal(new Game(c).state,'ready');}assert.equal(lengths.size,9);
});
test('end-to-end control sequence jumps between 15 actual carriers and reaches the real finish',()=>{
 const g=create();let iterations=0;while(g.state==='playing'&&iterations++<7000){const p=g.player,t=g.trucks[p.support],dx=roadX(g.course,p.s)-8.7-p.x;g.step(1/120,{x:p.grounded?0:Math.max(-1,Math.min(1,dx*1.1)),z:1,jump:p.grounded&&!!t&&p.localS>3.6,jumpHeld:true});}assert.equal(g.state,'won',g.reason);assert.ok(g.landings>=10);assert.ok(g.player.s>=g.course.goal.minS);assert.equal(g.stars(),3);assert.ok(g.time<60);const end=g.time;tick(g,3,{z:1});assert.equal(g.time,end);
});
test('landing needs a descending crossing of the actual roof, not proximity to a truck',()=>{
 const g=create();const p=g.player;g.step(1/120,{jump:true});const before=g.landings;tick(g,.25);assert.equal(p.grounded,false);assert.equal(g.landings,before);assert.ok(p.y>3.82+2);assert.ok(p.vy>0);
});
