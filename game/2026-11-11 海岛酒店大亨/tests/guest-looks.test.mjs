import test from 'node:test';
import assert from 'node:assert/strict';
import {GUEST_LOOKS,guestAppearance,availableGuestLook,preserveDistinctLooks} from '../src/guest-looks.mjs';
import {createState,tick,saveSnapshot,restoreSnapshot} from '../src/simulation.mjs';

test('24 guests have distinct visual identities, with geometry and wardrobe variety',()=>{
 assert.equal(GUEST_LOOKS.length,24);
 const signature=p=>[p.hairStyle,p.shape,p.top,p.bottom,p.bag,p.hat,p.glasses,p.height,p.build].join('/');
 assert.equal(new Set(GUEST_LOOKS.map(signature)).size,24);
 for(const [field,min] of [['hairStyle',10],['shape',7],['bag',5],['skin',12]])assert.ok(new Set(GUEST_LOOKS.map(p=>p[field])).size>=min,field);
});
test('an occupied hotel fills all 24 appearance slots without repeats',()=>{
 const guests=[];
 for(let i=0;i<24;i++)guests.push({look:availableGuestLook(guests,(i*.171)%1)});
 assert.equal(new Set(guests.map(g=>g.look)).size,24);
 const leaving=guests.splice(7,1)[0];assert.equal(availableGuestLook(guests,.99),leaving.look);
});
test('normal arrivals receive distinct looks and keep them through save/restore',()=>{
 const s=createState(125);s.active=true;
 for(let i=0;i<300;i++)tick(s,.1,{x:0,z:0});
 assert.ok(s.guests.length>=4);
 assert.equal(new Set(s.guests.map(g=>g.look)).size,s.guests.length);
 assert.deepEqual(restoreSnapshot(saveSnapshot(s)).guests.map(g=>g.look),s.guests.map(g=>g.look));
 assert.equal(guestAppearance(0).id,0);
 assert.equal(guestAppearance(-1).id,23);
});
test('legacy duplicate appearances are diversified without replacing unique identities',()=>{
 const guests=[{id:1,look:2},{id:2,look:2},{id:3,look:7},{id:4,look:7},{id:5,look:4}];
 preserveDistinctLooks(guests);assert.equal(new Set(guests.map(g=>g.look)).size,5);
 assert.equal(guests[0].look,2);assert.equal(guests[2].look,7);assert.equal(guests[4].look,4);
});
test('waiting guests leave enough room for the larger bodies and hand luggage',()=>{
 const s=createState(53);s.active=true;s.player.x=-8;s.player.z=3.1;
 for(let i=0;i<550;i++)tick(s,.1,{x:0,z:0});
 const queue=s.guests.filter(g=>g.state==='queue');assert.equal(queue.length,5);
 for(let i=0;i<queue.length;i++)for(let j=i+1;j<queue.length;j++)assert.ok(Math.hypot(queue[i].x-queue[j].x,queue[i].z-queue[j].z)>=1.3);
});
