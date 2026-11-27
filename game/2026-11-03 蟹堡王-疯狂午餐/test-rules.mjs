import assert from 'node:assert/strict';
import {Kitchen,STATIONS,LANES,distance} from './rules.mjs';
const tick=(s,seconds,input={x:0,z:0})=>{for(let i=0;i<Math.ceil(seconds*60);i++)s.update(1/60,input);};
function go(s,x,z){for(let i=0;i<1500;i++){const dx=x-s.player.x,dz=z-s.player.z,d=Math.hypot(dx,dz);if(d<.12)return;s.update(1/60,{x:dx/d,z:dz/d});}throw new Error(`Unreachable ${x},${z}; at ${JSON.stringify(s.player)}`);}
function cook(s,n=1){go(s,STATIONS.grill.x,STATIONS.grill.z);for(let i=0;i<n;i++)s.action();tick(s,2.6/s.grillSpeed);for(let i=0;i<n;i++)s.action();go(s,STATIONS.build.x,STATIONS.build.z);s.action();}
function serve(s){const lane=s.recommended().lane;assert.notEqual(lane,undefined);go(s,LANES[lane],-3.3);s.action();}
const s=new Kitchen(42);s.start();tick(s,100);assert.equal(s.hearts,5);assert.equal(s.orders[1].patience,s.orders[1].max,'First order must not time out');cook(s);assert.deepEqual(s.hands,['burger']);serve(s);assert.equal(s.total,1);assert.equal(s.tutorial,4);
cook(s,2);assert.deepEqual(s.hands,['burger','burger']);assert.equal(s.toss(s.activeLanes()[0],.5),true);tick(s,2);assert.equal(s.total,2);assert.equal(s.perfects,1);assert.equal(s.hands.length,1);
// Misses are recoverable, rather than silently losing a burger.
assert.ok(s.toss(s.activeLanes()[0],2.6));tick(s,2);assert.equal(s.drops.length,1);go(s,s.drops[0].x,s.drops[0].z);
// Context prioritizes the serving tray: deliver a held burger, but recover when empty.
if(s.context().kind!=='recover')go(s,s.drops[0].x,s.drops[0].z+.7);s.action();assert.ok(s.hands.includes('burger'),'Dropped burger should be recoverable');assert.equal(s.drops.length,0);
// Scenario fixtures below exercise rare boundaries; they are not browser-play claims.
const pause=new Kitchen(4);pause.start();pause.action();pause.phase='paused';tick(pause,30);assert.equal(pause.grills[0].cook,0);assert.equal(pause.time,0);
const cap=new Kitchen(4);cap.start();cook(cap,2);assert.equal(cap.hands.length,2);go(cap,-4.15,2.7);cap.action();tick(cap,3);cap.action();assert.ok(cap.hands.length<=cap.capacity);
const helper=new Kitchen(2);helper.start();helper.total=2;helper.hands=['burger'];helper.startEvent('patrick');tick(helper,3.1);for(let i=0;i<300&&distance(helper.player,helper.event)>1.4;i++){const d=distance(helper.player,helper.event);helper.update(1/60,{x:(helper.event.x-helper.player.x)/d,z:(helper.event.z-helper.player.z)/d});}helper.action();assert.ok(helper.helper);assert.equal(helper.event,null);tick(helper,13);assert.ok(helper.events.some(e=>e.type==='message'&&e.text.includes('Patrick saved')),'Feeding Patrick must have an actual gameplay benefit');
const closed=new Kitchen(7);closed.start();closed.total=1;closed.spawnOrder(0);closed.spawnOrder(2);closed.startEvent('squid');tick(closed,3.1);const patience=closed.orders[1].patience;tick(closed,2);assert.equal(closed.orders[1].patience,patience,'Closed lane patience must pause');assert.equal(closed.deliver(1,{kind:'hand'}),false);assert.ok(closed.activeLanes().includes(0));
const doomed=new Kitchen(7);doomed.start();doomed.total=1;tick(doomed,240);assert.equal(doomed.phase,'lost');assert.equal(doomed.hearts,0);doomed.reset();doomed.start();assert.equal(doomed.hearts,5);assert.equal(doomed.total,0);assert.deepEqual(doomed.hands,[]);assert.equal(doomed.event,null);
// Full campaign through movement + cooking + real delivery actions (no score edits).
const run=new Kitchen(93);run.start();let meals=0;
while(!['win','lost'].includes(run.phase)&&meals++<70){if(run.phase==='upgrade'){run.upgrade(run.shift===1?'grill':'dash');continue;}if(!run.hands.includes('burger'))cook(run,Math.min(2,run.capacity));while(run.hands.includes('burger')&&run.phase==='running'){if(!run.activeLanes().length)tick(run,4);serve(run);}}
assert.equal(run.phase,'win',`Campaign should be winnable; hearts ${run.hearts}, orders ${run.total}`);assert.equal(run.total,18);assert.deepEqual(run.upgrades,['grill','dash']);run.overtime();assert.equal(run.shift,4);assert.equal(run.phase,'running');assert.ok(run.tips>0);assert.equal(run.served,0);assert.equal(run.goal,10);
console.log(`PASS: tutorial grace, two-item cooking, toss scoring, recoverable misses, capacity, pause, Patrick helper, Squidward lane closure, death/reset, complete 18-order campaign (${Math.round(run.time)} sim seconds), upgrades and endless overtime.`);
