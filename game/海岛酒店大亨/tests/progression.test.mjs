import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,tick,navigate,buy,buyRoom,upgradeRoom,openEstate,buyStudy,selectOutfit,claimContract,activateBoost,saveSnapshot,restoreSnapshot} from '../src/simulation.mjs';
import {roomSpot,moneySpot,roomFee,ITEMS,GOALS} from '../src/config.mjs';
import {VILLA_SPOTS,ESTATE_COST,careerTitle,levelOf,maxItemLevel,ensureContracts,contractProgress,ownerCapacity,poolCapacity,facilityPayout} from '../src/progression.mjs';
import {findPath,walkable} from '../src/navigation.mjs';
function run(s,seconds){for(let n=0;n<seconds*20;n++)tick(s,.05);}
function prepared(){const s=createState(73);s.active=true;s.cash=500000;s.goalsDone=GOALS.length;for(const r of s.rooms){r.built=true;r.tier=3;}buy(s,'pool');buy(s,'cafe');return s;}
function expanded(){const s=prepared();assert.equal(openEstate(s).ok,true);return s;}

test('legacy progress earns titles retroactively without granting money or replacing the classic outfit',()=>{
 const old=prepared();buy(old,'cleaner');buy(old,'capacity');old.stats.earned=24500;old.player.towels=7;
 for(const k of ['estate','levels','studyRank','outfit','titleSeen','contracts','contractSerial'])delete old[k];
 const s=restoreSnapshot(saveSnapshot(old));assert.equal(s.cash,old.cash);assert.equal(s.rooms.length,6);assert.equal(s.stats.earned,24500);assert.equal(careerTitle(s).name,'海岛主理人');assert.equal(s.outfit,'classic');assert.equal(levelOf(s,'cleaner'),1);assert.equal(ownerCapacity(s),8);assert.equal(s.player.towels,7);assert.equal(s.contracts.length,3);
 run(s,.2);assert.equal(s.cash,old.cash);assert.equal(s.events.some(e=>e.type==='title'),false);
});
test('expansion requires a completed main hotel, spends once and retains every main room',()=>{
 const s=createState();s.cash=100000;assert.equal(openEstate(s).ok,false);s.rooms.forEach(r=>{r.built=true;r.tier=3;});buy(s,'pool');assert.equal(openEstate(s).ok,false);buy(s,'cafe');s.cash=ESTATE_COST-1;assert.equal(openEstate(s).ok,false);s.cash=ESTATE_COST;
 const old=s.rooms.map(r=>({...r}));assert.equal(openEstate(s).ok,true);assert.equal(s.cash,0);assert.deepEqual(s.rooms.slice(0,6),old);assert.equal(s.rooms.length,10);assert.equal(s.rooms.filter(r=>r.region==='villa'&&!r.built).length,4);assert.equal(openEstate(s).ok,false);assert.equal(s.cash,0);
});
test('all villa doors, money piles and local linen are reached along the real bridge',()=>{
 const s=expanded();for(const r of s.rooms.filter(r=>r.region==='villa')){buyRoom(s,r.id);while(r.tier<5)assert.equal(upgradeRoom(s,r.id).ok,true);}
 for(const p of [VILLA_SPOTS.entry,VILLA_SPOTS.supplies,...s.rooms.filter(r=>r.region==='villa').flatMap(r=>[roomSpot(r),moneySpot(r)])]){
  const path=findPath(s,s.player,p);assert.ok(path.length,JSON.stringify(p));assert.ok(path.some(n=>n.z<-26&&n.z>-33&&Math.abs(n.x)<2.4));assert.ok(Math.hypot(path.at(-1).x-p.x,path.at(-1).z-p.z)<.05);
  assert.ok(path.every(n=>walkable(s,n.x,n.z,.26)));assert.equal(navigate(s,p),true);let n=0;while(s.player.path.length&&n++<2500)tick(s,.05);assert.ok(Math.hypot(s.player.x-p.x,s.player.z-p.z)<.5);s.player.x=0;s.player.z=7.5;s.player.path=[];
 }
});
test('villa VIP physically crosses the bridge, stays, leaves a higher fee and is cleaned locally',()=>{
 const s=expanded();s.spawnTime=10000;buyRoom(s,201);buy(s,'receptionist');buy(s,'villaCleaner');s.player.x=10;s.player.z=10;
 s.guests=[{id:700,x:0,z:11.7,angle:0,path:[],moving:false,look:3,vip:true,state:'queue',patience:100,progress:0}];
 run(s,1.5);const guest=s.guests.find(g=>g.id===700),room=s.rooms.find(r=>r.id===201);assert.equal(guest.room,201);assert.equal(guest.state,'toRoom');assert.equal(room.cash,0);
 let bridge=false,entered=false,cleaned=false;for(let i=0;i<2600;i++){tick(s,.05);if(guest.z<-26&&guest.z>-33)bridge=true;if(guest.state==='staying')entered=true;if(s.stats.villaCleaned){cleaned=true;break;}}
 assert.ok(bridge);assert.ok(entered);assert.equal(s.stats.villaServed,1);assert.equal(room.cash,360);assert.equal(s.stats.earned,360);assert.ok(cleaned);const worker=s.staff.find(a=>a.id==='villaCleaner');assert.ok(worker.z<-36);assert.equal(s.stats.cleaned,1);
});
test('training upgrades existing workers, applies real cleaning speed, and caps purchases',()=>{
 const s=prepared();s.spawnTime=10000;s.player.x=8;s.player.z=12;buy(s,'cleaner');const worker=s.staff[0],r=s.rooms[0];worker.x=r.x;worker.z=r.z+2.1;worker.towels=4;worker.job=r.id;r.status='dirty';
 run(s,1);const base=r.clean;r.clean=0;r.linen=false;buy(s,'cleaner');run(s,1);assert.ok(r.clean>base*1.15);assert.equal(s.staff.filter(a=>a.id==='cleaner').length,1);
 while(levelOf(s,'cleaner')<maxItemLevel('cleaner'))assert.equal(buy(s,'cleaner').ok,true);const cash=s.cash;assert.equal(buy(s,'cleaner').ok,false);assert.equal(s.cash,cash);assert.equal(s.staff.length,1);
 buy(s,'capacity');buy(s,'capacity');assert.equal(ownerCapacity(s),10);buy(s,'pool');assert.equal(poolCapacity(s),14);assert.equal(facilityPayout(s,'pool'),36);
});
test('service boost has eight seconds of actual faster movement, saved cooldown and frozen pause',()=>{
 const s=prepared();s.spawnTime=10000;s.player.x=0;s.player.z=-7;buy(s,'boost');const base=restoreSnapshot(saveSnapshot(s));assert.equal(activateBoost(s).ok,true);tick(s,.1,{x:0,z:-1});tick(base,.1,{x:0,z:-1});assert.ok((-7-s.player.z)>(-7-base.player.z)*1.24);
 assert.equal(activateBoost(s).ok,false);s.paused=true;const time=s.time;run(s,20);assert.equal(s.time,time);s.paused=false;const restored=restoreSnapshot(saveSnapshot(s));assert.equal(restored.boostUntil,s.boostUntil);assert.equal(restored.nextBoost,s.nextBoost);run(restored,8);assert.equal(restored.time>restored.boostUntil,true);assert.equal(activateBoost(restored).ok,false);run(restored,33);assert.equal(activateBoost(restored).ok,true);
});
test('orders refresh after one claim, survive saves and cannot manufacture title progress',()=>{
 const s=prepared();s.stats.earned=1200;ensureContracts(s);const c=s.contracts[0];s.stats[c.stat]=c.start+c.target;const earned=s.stats.earned,balance=s.cash;assert.equal(contractProgress(s,c),c.target);assert.equal(claimContract(s,c.id).ok,true);assert.equal(s.cash,balance+c.reward);assert.equal(s.stats.earned,earned);assert.equal(s.contracts.length,3);assert.equal(s.contracts[0].type===c.type,false);assert.equal(claimContract(s,c.id).ok,false);
 const restored=restoreSnapshot(saveSnapshot(s));assert.equal(restored.contractsClaimed,1);assert.deepEqual(restored.contracts,s.contracts);assert.equal(claimContract(restored,c.id).ok,false);restored.cash=0;assert.equal(careerTitle(restored).name,'新晋店长');assert.equal(selectOutfit(restored,'azure').ok,true);assert.equal(selectOutfit(restored,'ivory').ok,false);
});
test('villa five-tier upgrades and repeatable study increase actual payouts and persist',()=>{
 const s=expanded();assert.equal(buyStudy(s).ok,false);buyRoom(s,201);buyRoom(s,202);const r=s.rooms.find(r=>r.id===201),fees=[roomFee(r)];while(r.tier<5){upgradeRoom(s,r.id);fees.push(roomFee(r));}assert.deepEqual(fees,[240,340,470,640,860]);assert.equal(upgradeRoom(s,r.id).ok,false);
 const before=s.cash;assert.equal(buyStudy(s).ok,true);assert.equal(before-s.cash,5000);assert.equal(roomFee(r,false,s.studyRank),869);assert.equal(buyStudy(s).ok,true);assert.equal(s.studyRank,2);
 const saved=restoreSnapshot(saveSnapshot(s));assert.equal(saved.estate.villa,true);assert.equal(saved.studyRank,2);assert.equal(saved.rooms.find(r=>r.id===201).tier,5);assert.equal(saved.rooms.length,10);assert.equal(saved.cash,s.cash);
});
test('collection equipment extends real pickup range and keeps it after restoring',()=>{
 const s=prepared();s.spawnTime=10000;const r=s.rooms[0],p=moneySpot(r);s.player.x=p.x+2;s.player.z=p.z;r.cash=116;run(s,.1);assert.equal(r.cash,116);buy(s,'magnet');const balance=s.cash;run(s,.1);assert.equal(r.cash,0);assert.equal(s.cash,balance+116);const restored=restoreSnapshot(saveSnapshot(s));assert.equal(levelOf(restored,'magnet'),1);assert.equal(restored.stats.collected,116);
});
test('trained workers fill their enlarged tray before leaving the linen cupboard',()=>{
 const s=expanded();s.spawnTime=10000;s.poolTowels=12;s.player.x=0;s.player.z=-30;
 for(const id of ['cleaner','villaCleaner','poolstaff']){buy(s,id);buy(s,id);}
 run(s,20);for(const worker of s.staff){assert.equal(worker.towels,6,worker.id);assert.equal(worker.refilling,false,worker.id);}assert.equal(s.stats.cleaned,0);
});
test('expanded ten-room business keeps serving, crossing and cleaning without stalls over ten minutes',()=>{
 const s=expanded();for(const r of s.rooms.filter(r=>r.region==='villa'))buyRoom(s,r.id);for(const id of ['cleaner','villaCleaner','receptionist','poolstaff','barista'])buy(s,id);s.player.x=0;s.player.z=-38;
 run(s,600);assert.ok(s.stats.served>50);assert.ok(s.stats.villaServed>12);assert.ok(s.stats.villaCleaned>8);assert.ok(s.stats.poolVisits>0&&s.stats.coffee>0);assert.ok(s.guests.length<24);assert.ok(s.rooms.every(r=>Number.isFinite(r.cash)&&r.cash>=0));assert.ok([...s.staff,...s.guests].every(a=>Number.isFinite(a.x)&&Number.isFinite(a.z)));assert.ok(s.contracts.length===3);
});
