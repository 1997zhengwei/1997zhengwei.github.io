const assert=require('node:assert/strict'),R=require('./rules.js');
function run(s,seconds){for(let t=0;t<seconds;t+=.01)R.tick(s,.01);}
for(const target of R.C.targets){let q=R.chargeFor(target);assert.ok(Math.abs(R.pose(q,.9).x-target)<1e-8);assert.equal(R.pose(q,0).y,R.pose(q,.9).y);}
let s=R.create();for(let n=0;n<3;n++){assert.ok(R.begin(s));s.charge=R.chargeFor(s.target);assert.ok(R.release(s));assert.equal(R.release(s),false);run(s,2.2);}assert.equal(s.phase,'result');assert.equal(s.score,450);assert.equal(s.served,3);assert.equal(s.lives,3);run(s,5);assert.equal(s.score,450);
s=R.create();for(let n=0;n<3;n++){R.begin(s);R.release(s);run(s,2.2);}assert.equal(s.phase,'result');assert.equal(s.lives,0);assert.equal(s.served,0);
s=R.create();R.begin(s);run(s,.4);R.pause(s,true);assert.equal(s.phase,'ready');assert.equal(s.charge,0);run(s,3);assert.equal(s.phase,'ready');R.pause(s,false);R.begin(s);s.charge=.5;R.release(s);run(s,.3);R.pause(s,true);let t=s.time;run(s,5);assert.equal(s.time,t);R.pause(s,false);run(s,2);assert.notEqual(s.phase,'flying');
for(const sign of [-1,1]){s=R.create();R.begin(s);s.charge=R.chargeFor(s.target+sign*(R.C.tolerance-0.01));R.release(s);run(s,1);assert.equal(s.last.hit,true);s=R.create();R.begin(s);s.charge=R.chargeFor(s.target+sign*(R.C.tolerance+0.01));R.release(s);run(s,1);assert.equal(s.last.hit,false);}
assert.deepEqual(R.create(),R.create());console.log('PASS: trajectory, 3-order win, 3-miss loss, no duplicate scoring, pause/cancel/resume, catch boundaries, fresh reset');
