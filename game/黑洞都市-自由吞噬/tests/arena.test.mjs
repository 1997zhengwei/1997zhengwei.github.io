import test from 'node:test';
import assert from 'node:assert/strict';
import {createArena,stepArena,arenaBot,arenaRadius,canConsume,arenaResult,settleArena,ARENA_SIZE,canSwallow,rivalRelation,RESPAWN_SECONDS,SPAWN_SHIELD} from '../src/arena-rules.mjs';
import {defaultSave} from '../src/rules.mjs';
function empty(){const w=createArena(11);w.mode='play';w.items=[];w.players=w.players.slice(0,1);return w;}
test('free movement reaches all four directions with equal diagonal speed',()=>{
 const lengths=[];for(const input of[{x:1,z:0},{x:-1,z:0},{x:0,z:1},{x:0,z:-1},{x:1,z:1}]){const w=empty(),p=w.players[0],x=p.x,z=p.z;for(let n=0;n<60;n++)stepArena(w,1/60,input);lengths.push(Math.hypot(p.x-x,p.z-z));assert.ok((p.x-x)*input.x>=0);assert.ok((p.z-z)*input.z>=0);}for(const n of lengths)assert.ok(Math.abs(n-lengths[0])<.001);
});
test('collecting consumes one real object once and unlocks larger objects',()=>{const w=empty(),p=w.players[0];w.items=[{id:1,type:'crate',x:p.x,z:p.z,scale:1,state:'idle'}];stepArena(w,1/60);assert.equal(p.count,1);assert.equal(p.score,5);assert.ok(p.radius>.93);stepArena(w,1/60);assert.equal(p.count,1);assert.equal(canConsume(p,{type:'tower',scale:2,state:'idle'}),false);p.radius=arenaRadius(4000);assert.equal(canConsume(p,{type:'tower',scale:2,state:'idle'}),true);});
test('large buildings block small characters and become consumable after growth',()=>{const w=empty(),p=w.players[0];p.x=0;p.z=0;const building={id:1,type:'tower',x:5,z:0,scale:2,state:'idle'};w.items=[building];for(let n=0;n<120;n++)stepArena(w,1/60,{x:1,z:0});assert.ok(p.x<2);assert.equal(building.state,'idle');p.mass=4000;p.radius=arenaRadius(p.mass);for(let n=0;n<45;n++)stepArena(w,1/60,{x:1,z:0});assert.equal(building.state,'falling');assert.ok(p.x>3);});
test('diagonal movement cannot slip through a building corner',()=>{const w=empty(),p=w.players[0];p.x=0;p.z=0;w.items=[{id:1,type:'tower',x:5,z:5,scale:2,rotation:0,state:'idle'}];for(let n=0;n<100;n++){stepArena(w,1/60,{x:1,z:1});assert.ok(!(p.x>1.001&&p.x<8.999&&p.z>1.301&&p.z<8.699));}});
test('a bot blocked by an oversized building turns and reaches food beyond it',()=>{const w=createArena(11);w.mode='play';w.players=w.players.slice(0,2);w.players[0].x=-65;w.players[0].z=-65;const p=w.players[1];Object.assign(p,{x:0,z:0});const can={id:900,type:'can',x:12,z:0,scale:1,state:'idle'};w.items=[{id:901,type:'tower',x:5,z:0,scale:2,rotation:0,state:'idle'},can];for(let n=0;n<1200&&can.state==='idle';n++)stepArena(w,1/60);assert.equal(can.state,'falling');assert.equal(p.count,1);});
test('world bounds hold on both axes and pause freezes timers and actors',()=>{const w=empty(),p=w.players[0];p.x=81;p.z=81;for(let n=0;n<90;n++)stepArena(w,1/60,{x:1,z:1});assert.ok(p.x<=ARENA_SIZE&&p.z<=ARENA_SIZE);w.mode='paused';const before=JSON.stringify(w);stepArena(w,.05,{x:1,z:1});assert.equal(JSON.stringify(w),before);});
test('predation needs a size advantage and actual containment, with spawn grace',()=>{const w=createArena(11);w.items=[];w.mode='play';const [p,q]=w.players;q.x=p.x;q.z=p.z;p.radius=4;stepArena(w,.01);assert.equal(q.retired,false);w.time=13;stepArena(w,.01);assert.equal(q.retired,true);assert.equal(p.kills,1);assert.ok(p.score>=35);});
test('being swallowed naturally ends the player run and awards no prize',()=>{const w=createArena(11);w.items=[];w.mode='play';w.time=15;const [p,q]=w.players;q.x=p.x;q.z=p.z;q.radius=4;stepArena(w,.01);assert.equal(w.mode,'result');assert.equal(p.retired,true);assert.equal(arenaResult(w).coins,0);});
test('timer ends the round and podium settlement is only paid once',()=>{const w=empty(),p=w.players[0],save=defaultSave();w.time=119.99;p.score=500;stepArena(w,.02);assert.equal(w.mode,'result');assert.equal(w.remaining,0);assert.equal(settleArena(w,save).coins,200);settleArena(w,save);assert.equal(save.coins,200);});
test('a seeded city has connected streets, parks, small loot and edible buildings',()=>{const w=createArena(11);assert.ok(w.items.length>450);assert.ok(w.items.some(i=>i.type==='car'));assert.ok(w.items.some(i=>i.type==='tower'));assert.ok(w.items.filter(i=>Math.hypot(i.x,i.z-6)<9&&canConsume(w.players[0],i)).length>=20);const next=createArena(12);assert.ok(next.items.every(i=>i.state==='idle'));assert.ok(next.players.every(p=>!p.retired&&p.mass===0));});
test('full rule simulation grows by collecting, moves through the city, and ends',()=>{const w=createArena(741);w.mode='play';for(let n=0;n<7300&&w.mode!=='result';n++)stepArena(w,1/60,arenaBot(w,w.players[0]));assert.equal(w.mode,'result');const p=w.players[0];assert.ok(p.count>20);assert.ok(p.radius>2);assert.ok(p.score>100);assert.ok(w.time<=120.02);});

test('rival cues and bots use the same size and protection rules',()=>{
 const w=createArena(9);w.time=20;w.items=[];const [p,q]=w.players;Object.assign(p,{x:0,z:0,radius:3});Object.assign(q,{x:5,z:0,radius:2,personality:'hunter'});
 assert.equal(canSwallow(w,p,q),true);assert.equal(rivalRelation(w,p,q),'prey');assert.equal(rivalRelation(w,q,p),'danger');
 const flee=arenaBot(w,q);assert.equal(q.behavior,'flee');assert.ok(flee.x>0);
 Object.assign(q,{radius:4.2});const hunt=arenaBot(w,q);assert.equal(q.behavior,'hunt');assert.equal(q.targetId,0);assert.ok(hunt.x<0);
 q.shieldUntil=22;assert.equal(canSwallow(w,q,p),false);assert.equal(canSwallow(w,p,q),false);assert.equal(rivalRelation(w,p,q),'shield');
});

test('equal-sized holes cannot swallow one another, and overlapping prey pays once',()=>{
 const w=createArena(9);w.items=[];w.mode='play';w.time=20;w.players=w.players.slice(0,2);const [p,q]=w.players;Object.assign(p,{x:0,z:0,radius:2});Object.assign(q,{x:0,z:0,radius:2});stepArena(w,.01);assert.equal(p.retired,false);assert.equal(q.retired,false);
 p.radius=3;stepArena(w,.01);assert.equal(q.retired,true);const score=p.score;stepArena(w,.01);assert.equal(p.kills,1);assert.equal(p.score,score);
});

test('swallowed bots return after five seconds, away from the player, with a two-way shield',()=>{
 const w=createArena(9);w.items=[];w.mode='play';w.time=20;w.players=w.players.slice(0,2);const [p,q]=w.players;Object.assign(p,{x:0,z:0,radius:4,mass:855,score:700});Object.assign(q,{x:0,z:0});
 stepArena(w,.01);assert.equal(q.retired,true);assert.equal(w.mode,'play');assert.equal(q.respawnAt,w.time+RESPAWN_SECONDS);
 w.time=q.respawnAt-.02;stepArena(w,.01);assert.equal(q.retired,true);stepArena(w,.02);assert.equal(q.retired,false);assert.ok(Math.hypot(p.x-q.x,p.z-q.z)>30);assert.equal(q.shieldUntil,w.time+SPAWN_SHIELD);assert.ok(q.radius<p.radius);assert.equal(p.kills,1);
 Object.assign(p,{x:q.x,z:q.z});stepArena(w,.01);assert.equal(q.retired,false);assert.equal(canSwallow(w,p,q),false);
 w.time=q.shieldUntil+.01;stepArena(w,.01);assert.equal(q.retired,true);assert.equal(p.kills,2);
});

test('city resources renew out of view and can be collected again, never under a player',()=>{
 const w=empty(),p=w.players[0];w.time=20;Object.assign(p,{x:0,z:0});const item={id:1,type:'can',x:0,z:0,scale:1,state:'idle'};w.items=[item];stepArena(w,.01);assert.equal(p.count,1);w.time=item.renewAt+.1;stepArena(w,.01);assert.equal(item.state,'falling');
 p.x=55;w.nextRenewal=w.time;stepArena(w,.01);assert.equal(item.state,'idle');Object.assign(p,{x:0,z:0});stepArena(w,.01);assert.equal(p.count,2);assert.equal(p.score,6);
});

test('fourth place has no prize and a fresh match resets rivalry without changing the wallet',()=>{
 const w=createArena(9);w.players.forEach((p,i)=>p.score=i===0?150:i<4?300:0);assert.equal(arenaResult(w).rank,4);assert.equal(arenaResult(w).coins,0);
 const save=defaultSave();save.coins=270;settleArena(w,save);settleArena(w,save);assert.equal(save.coins,270);const next=createArena(10);assert.ok(next.players.every(p=>p.kills===0&&!p.retired&&p.respawnAt===0&&p.mass===0));
});
