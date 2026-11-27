import test from 'node:test';
import assert from 'node:assert/strict';
import {ParkSimulation} from '../src/simulation.mjs';
import {RIDES,rideStats,UPGRADE_LIMIT} from '../src/data.mjs';
import {dropHeight,makeBumperMotion} from '../src/ride-motion.mjs';
import {trackFrame,coasterMotion,coasterCurve} from '../src/track.mjs';
const advance=(sim,seconds)=>{for(let i=0;i<seconds*10;i++)sim.step(.1);};
function validatePeople(s){const ids=s.guests.map(g=>g.id);assert.equal(new Set(ids).size,ids.length);for(const [id,r] of Object.entries(s.rides)){assert(r.queue.length<=rideStats(RIDES.find(d=>d.id===id),r).queueCap);assert.equal(new Set([...r.queue,...r.riders]).size,r.queue.length+r.riders.length);for(const n of r.queue)assert(s.guests.some(g=>g.id===n&&g.mode==='queue'&&g.target===id));for(const n of r.riders)assert(s.guests.some(g=>g.id===n&&['riding','boarding'].includes(g.mode)&&g.target===id));}assert(s.guests.length<=s.capacity);assert(s.cash>=0);}
test('a visitor pays each completed ride exactly once; the same guest is not queued and seated',()=>{const s=new ParkSimulation();s.services.gate=2;advance(s,200);validatePeople(s);assert(s.ridesServed>0);assert.equal(s.rides.carousel.revenue,s.ridesServed*18);const first=s.cash;s.claimGoal();const second=s.cash;assert(second>first);assert.equal(s.claimGoal(),false);assert.equal(s.cash,second);});
test('construction cannot spend twice or overspend and closed facilities cannot earn',()=>{const s=new ParkSimulation();assert.equal(s.build('coaster'),false);assert.equal(s.cash,850);assert.equal(s.upgrade('ship'),false);assert.equal(s.build('ship'),true);assert.equal(s.cash,200);assert.equal(s.build('ship'),false);assert.equal(s.cash,200);advance(s,300);validatePeople(s);assert(s.rides.ship.revenue>0);assert.equal(s.rides.wheel.revenue,0);});
test('a busy eight-facility park keeps queues and batches consistent across twenty minutes',()=>{const s=new ParkSimulation();s.cash=100000;for(const d of RIDES)s.build(d.id);for(let i=0;i<4;i++)s.upgradeService('gate');for(let i=0;i<3;i++)s.upgradeService('staff');for(let i=0;i<1200;i++){s.step(1);if(i%20===0)validatePeople(s);}assert(s.ridesServed>500);assert(RIDES.every(d=>s.rides[d.id].rounds>0));validatePeople(s);});
test('save and restore preserve guests, in-flight rides and the ledger without replaying payments',()=>{const s=new ParkSimulation();s.build('ship');advance(s,130);s.claimGoal();const restored=new ParkSimulation(JSON.parse(JSON.stringify(s.save())));assert.equal(restored.cash,s.cash);assert.equal(restored.ridesServed,s.ridesServed);assert.deepEqual(restored.claimed,s.claimed);assert.deepEqual(restored.guests,s.guests);assert(restored.rides.ship.built);assert.equal(restored.rides.carousel.revenue,s.rides.carousel.revenue);advance(s,40);advance(restored,40);assert.equal(restored.cash,s.cash);assert.equal(restored.ridesServed,s.ridesServed);validatePeople(restored);});
test('all capacity upgrades fit actual seats and max levels and corrupt saves are bounded',()=>{for(const d of RIDES){const cap=rideStats(d,{level:UPGRADE_LIMIT}).capacity;assert(cap<=({carousel:12,ship:10,wheel:16,coaster:12,cups:12,bumpers:10,swing:12,drop:12}[d.id]));}const s=new ParkSimulation({version:1,cash:-4,services:{gate:1000},rides:{carousel:{built:false,level:1e9}}});assert.equal(s.cash,850);assert.equal(s.services.gate,8);assert.equal(s.rides.carousel.level,UPGRADE_LIMIT);assert.equal(s.rides.carousel.built,true);});
test('track and train share a continuous forward frame and a monotonic full lap',()=>{let last=0;for(let i=0;i<=1000;i++){const p=i/1000,m=coasterMotion(p),f=trackFrame(m.u);assert(m.u>=last);last=m.u;assert(f.p.y>1.5);assert(Math.abs(f.bank)<=.521);assert(Number.isFinite(f.q.w));assert(Math.abs(f.f.dot(f.up))<1e-6);assert(Math.abs(f.side.length()-1)<1e-6);}assert(last>.999);assert(trackFrame(0).p.distanceTo(trackFrame(1).p)<1e-6);assert(coasterCurve.getLength()>100);});
test('the track has no near crossing between distant path segments',()=>{let min=Infinity,pair=null;const samples=400;for(let a=0;a<samples;a++)for(let b=a+20;b<samples;b++){if(samples-b+a<20)continue;const distance=trackFrame(a/samples).p.distanceTo(trackFrame(b/samples).p);if(distance<min){min=distance;pair=[a,b];}}assert(min>2.0,`track clearance ${min.toFixed(2)} at ${pair}`);});
test('food revenue requires physically reaching the shop and is charged once',()=>{const s=new ParkSimulation();s.services.food=1;const g=s.guests[0];s.rides.carousel.queue=s.rides.carousel.queue.filter(id=>id!==g.id);g.x=2;g.z=15;s.exit(g);const cash=s.cash;assert.equal(g.mode,'foodwalk');assert.equal(s.cash,cash);let purchases=0;for(let i=0;i<800;i++){s.step(.1);purchases+=s.drainEvents().filter(e=>e.kind==='food'&&e.amount===13).length;if(g.ate)break;}assert.equal(g.ate,true);assert.equal(g.mode,'exit');assert(purchases>0);const before=s.cash;s.exit(g);assert.equal(s.cash,before);});


test('v0.2 four-ride saves retain progress and unlock four unbuilt expansions without charging',()=>{
 const original=new ParkSimulation();original.build('ship');advance(original,90);original.claimGoal();
 const legacy=original.save();for(const id of ['cups','bumpers','swing','drop'])delete legacy.rides[id];
 const migrated=new ParkSimulation(JSON.parse(JSON.stringify(legacy)));
 assert.equal(Object.keys(migrated.rides).length,8);assert.equal(migrated.cash,original.cash);assert.deepEqual(migrated.claimed,original.claimed);
 assert.equal(migrated.rides.ship.built,true);
 for(const id of ['cups','bumpers','swing','drop']){assert.equal(migrated.rides[id].built,false);assert.equal(migrated.rides[id].revenue,0);}
 const guest=migrated.guests[0];guest.x=-65;guest.z=27;guest.mode='rest';guest.target=null;guest.path=[];
 const again=new ParkSimulation(migrated.save());assert.equal(again.guests.find(g=>g.id===guest.id).x,-65);
});

test('wing-bound visitors use the outer promenade instead of crossing existing ride footprints',()=>{
 const sim=new ParkSimulation();sim.cash=100000;sim.build('drop');
 const g={id:2,x:65,z:-7.6,mode:'rest',target:null,path:[],pathIndex:0,visited:[],visits:0,budget:3};
 assert.deepEqual(sim.walkway(g),[[46,-7.6],[46,26],[4.7,26]]);
 sim.choose(g);assert(g.path.some(p=>p[0]===46&&p[1]===26));
});


test('bumper cars stay separated, remain in the arena and stop at the end of a rehearsal',()=>{
 const motion=makeBumperMotion();let previous=null;
 for(let i=0;i<=1800;i++){
  const cars=motion(i/1800);
  for(let j=0;j<cars.length;j++){
   const c=cars[j];assert(Object.values(c).every(Number.isFinite));assert(Math.abs(c.x)<10.15&&Math.abs(c.z)<6.95);
   if(previous)assert(Math.hypot(c.x-previous[j].x,c.z-previous[j].z)<.12);
   for(let k=j+1;k<cars.length;k++)assert(Math.hypot(c.x-cars[k].x,c.z-cars[k].z)>2.60);
  }
  previous=cars;
 }
 assert(motion(1).every(c=>c.speed===0));
 assert.equal(dropHeight(0),0);assert.equal(dropHeight(.55),25);assert.equal(dropHeight(1),0);
});


test('eight-ride saves restore visitors in the wings and preserve subsequent batch payments',()=>{
 const sim=new ParkSimulation();sim.cash=100000;for(const d of RIDES)sim.build(d.id);
 sim.services.gate=4;sim.services.staff=3;advance(sim,600);
 assert(sim.guests.some(g=>Math.abs(g.x)>48));
 const restored=new ParkSimulation(JSON.parse(JSON.stringify(sim.save())));
 assert.deepEqual(restored.guests,sim.guests);assert.deepEqual(restored.rides,sim.rides);
 advance(sim,100);advance(restored,100);
 assert.equal(restored.cash,sim.cash);assert.equal(restored.ridesServed,sim.ridesServed);validatePeople(restored);
});
