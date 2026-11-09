import test from 'node:test';
import assert from 'node:assert/strict';
import {FrontierWorld,newProfile,STATIONS,ENEMY_ARRIVAL,dist,zoneAt} from './starpath-rules.mjs';

function setup(){
  const w=new FrontierWorld(),p=w.enter(newProfile('p','Pilot'));
  w.spawnTimers.fill(Infinity);p.x=0;p.z=-30;p.fire=Infinity;
  return{w,p};
}
function advance(w,seconds){for(let i=0;i<Math.ceil(seconds/.05);i++)w.step(.05,1000)}
function assertClear(w,e){
  assert.ok(w.online().every(p=>dist(p,e)>=8+w.enemyRadius(e.type)-1e-7),'all online players must be clear');
  assert.ok(w.stations.every(s=>s.hp<=0||dist(s,e)>=s.radius+3+w.enemyRadius(e.type)-1e-7),'live oxygen circles must be clear');
  assert.ok(w.clear(e.x,e.z),'materialization must be on open ground');
  assert.equal(zoneAt(e),e.zone,'enemy must remain in its encounter zone');
}

test('a request warns for two full seconds before a real enemy can exist or be damaged',()=>{
  const {w,p}=setup(),request=w.spawnEnemy({x:p.x,z:p.z,zone:0},'scout');
  assert.equal(w.enemies.length,0);assert.equal(w.view(p.id).spawnWarnings.length,1);assertClear(w,request);
  w.damageEnemy(request,1000,p.id);assert.equal(p.profile.records.kills,0);
  advance(w,1.95);assert.equal(w.enemies.length,0);advance(w,.05);
  assert.equal(w.enemies.length,1);assert.equal(w.arrivals.length,0);assertClear(w,w.enemies[0]);
});

test('all eight players are protected, including an online fallen teammate',()=>{
  const {w,p}=setup();p.x=-12;p.z=-32;
  for(let i=1;i<8;i++){const q=w.enter(newProfile('crew'+i));q.x=-16+i*4;q.z=-39-(i%2)*7;q.fire=Infinity;if(i===4)q.down=true;}
  const request=w.spawnEnemy({x:0,z:-40,zone:0},'scout');
  assert.ok(request);if(request.phase==='warning')assertClear(w,request);
  advance(w,2.1);for(const e of w.enemies)assertClear(w,e);
});

test('walking into a warning cancels that location and starts a complete new warning',()=>{
  const {w,p}=setup(),q=w.enter(newProfile('q'));q.z=7;
  const request=w.spawnEnemy({x:0,z:-45,zone:0},'scout'),old={x:request.x,z:request.z},deadline=request.warnUntil;
  advance(w,.8);q.x=old.x;q.z=old.z;q.fire=Infinity;w.step(.05,1000);
  assert.equal(w.enemies.length,0);assert.equal(request.phase,'warning');assert.ok(dist(request,old)>1);assertClear(w,request);
  assert.ok(request.warnUntil>deadline+.7);advance(w,1.2);assert.equal(w.enemies.length,0);
  advance(w,.85);assert.equal(w.enemies.length,1);assertClear(w,w.enemies[0]);
});

test('a newly built station invalidates an already announced spawn',()=>{
  const {w,p}=setup();p.x=-7.5;p.z=-36;
  const request=w.spawnEnemy({x:4,z:-36,zone:0},'scout'),old={x:request.x,z:request.z};
  const station=w.stations[0];assert.ok(dist(old,station)<10.8,'fixture lies inside the newly protected footprint');
  p.profile.metal=p.profile.crystal=100;assert.equal(w.action(p,{type:'stationBuild',station:station.id}),null);
  advance(w,.1);assert.equal(w.enemies.length,0);
  assert.ok(request.phase==='waiting'||dist(request,old)>.5);
  if(request.phase==='warning')assertClear(w,request);
  advance(w,2.1);assert.ok(w.enemies.some(e=>e.id===request.id));for(const e of w.enemies)assertClear(w,e);
});

test('expanding oxygen during the countdown rechecks the actual new radius',()=>{
  const {w,p}=setup(),s=w.stations[0];s.hp=s.maxHp;s.radius=7;p.x=s.x-2.5;p.z=s.z;
  p.profile.metal=p.profile.crystal=100;
  const request=w.spawnEnemy({x:s.x+12,z:s.z,zone:0},'scout'),before={x:request.x,z:request.z};
  assertClear(w,request);assert.ok(dist(before,s)<13.8,'fixture is outside the old circle but inside the expanded footprint');assert.equal(w.action(p,{type:'stationUpgrade',station:s.id}),null);
  advance(w,.1);assert.equal(w.enemies.length,0);if(request.phase==='warning')assertClear(w,request);
  assert.ok(request.phase==='waiting'||dist(before,request)>.1);
  advance(w,2.1);assert.equal(w.enemies.length,1);assertClear(w,w.enemies[0]);
});

test('no eligible point means deferral, never an unsafe fallback; space reopening starts a new warning',()=>{
  const {w,p}=setup(),s=w.stations[0];s.hp=s.maxHp;s.radius=100;
  const request=w.spawnEnemy({x:0,z:-40,zone:0},'scout');
  assert.equal(request.phase,'waiting');advance(w,6);assert.equal(w.enemies.length,0);assert.equal(w.view(p.id).spawnWarnings.length,0);
  s.radius=7;advance(w,.55);assert.equal(request.phase,'warning');assert.equal(w.enemies.length,0);assertClear(w,request);
  advance(w,1.8);assert.equal(w.enemies.length,0);advance(w,.25);assert.equal(w.enemies.length,1);assertClear(w,w.enemies[0]);
});

test('ordinary, tutorial, guardian-add and boss requests all use the same safety gate',()=>{
  for(const source of ['ordinary','tutorial','guardian-add','boss']){
    const {w,p}=setup();let request;
    if(source==='tutorial'){
      p.profile.metal=p.profile.crystal=100;p.x=STATIONS[0].x+2.5;p.z=STATIONS[0].z;
      assert.equal(w.action(p,{type:'stationBuild',station:0}),null);assert.equal(w.arrivals.length,3);
      for(const e of w.arrivals)if(e.phase==='warning')assertClear(w,e);
      advance(w,2);for(const e of w.enemies)assertClear(w,e);continue;
    }
    if(source==='guardian-add'){const ev=w.events[0];ev.state='active';request=w.spawnEnemy({x:p.x,z:p.z,zone:0},'scout',ev.id);}
    else if(source==='boss'){p.profile.xp=490;p.x=0;p.z=-219;const ev=w.events[2];ev.state='active';request=w.spawnEnemy({x:p.x,z:p.z,zone:2},'boss',ev.id);}
    else request=w.spawnEnemy({x:p.x,z:p.z,zone:0});
    assert.equal(w.enemies.length,0);assertClear(w,request);advance(w,2);assert.ok(w.enemies.length>=1);for(const e of w.enemies)assertClear(w,e);
  }
});

test('one second of materialization windup cannot move, attack, or cast a boss ring',()=>{
  for(const type of ['scout','spitter','boss']){
    const {w,p}=setup(),zone=type==='boss'?2:type==='spitter'?1:0;p.z=zone===2?-210:zone===1?-85:-30;
    const request=w.spawnEnemy({x:p.x,z:p.z-12,zone},type);advance(w,2);
    const e=w.enemies.find(e=>e.id===request.id);assert.ok(e);const start={x:e.x,z:e.z};p.x=e.x+1;p.z=e.z;e.specialCd=0;
    const hp=p.hp;advance(w,.9);assert.equal(p.hp,hp);assert.equal(dist(e,start),0);assert.equal(w.hazards.length,0);
    advance(w,.4);assert.ok(p.hp<hp||w.hazards.length>0,'the enemy becomes active after its windup');
  }
});

test('pending guardian-add arrivals prevent premature completion and cancel with their event',()=>{
  const {w,p}=setup(),ev=w.events[0];p.x=0;p.z=-45;ev.state='active';ev.spawned=ev.count;
  w.spawnEnemy({x:9,z:-49,zone:0},'scout',ev.id);advance(w,1);
  assert.equal(ev.state,'active');assert.equal(w.view(p.id).events[0].pending,1);
  ev.state='cooldown';advance(w,.1);assert.equal(w.arrivals.length,0);advance(w,3);assert.equal(w.enemies.length,0);
});

test('pending arrivals count toward local and global population caps',()=>{
  const {w,p}=setup();p.x=4;p.z=-39;w.spawnTimers[0]=0;
  w.step(.05,1000);assert.equal(w.arrivals.filter(e=>e.camp===0).length,1);assert.equal(w.spawnTimers[0],18);
  advance(w,1);assert.ok(Math.abs(w.spawnTimers[0]-17)<1e-7,'regular eighteen-second cadence is unchanged');
  for(let i=0;i<60;i++)w.spawnEnemy({x:0,z:-40,zone:0});assert.equal(w.arrivals.length+w.enemies.length,48);
  assert.equal(w.spawnEnemy({x:0,z:-40,zone:0}),null);
});

test('a functioning oxygen station still restores only oxygen, with no passive health regeneration',()=>{
  const {w,p}=setup(),s=w.stations[0];s.hp=s.maxHp;p.x=s.x+2.5;p.z=s.z;p.hp=40;p.oxygen=10;
  advance(w,8);assert.equal(p.hp,40);assert.ok(p.oxygen>10);
  assert.equal(ENEMY_ARRIVAL.warningSeconds,2);assert.equal(ENEMY_ARRIVAL.windupSeconds,1);
});

test('leaving an ordinary warning area releases its reservation without an unseen spawn',()=>{
  const {w,p}=setup();w.spawnEnemy({x:0,z:-40,zone:0});assert.equal(w.arrivals.length,1);
  p.x=0;p.z=7;advance(w,3);assert.equal(w.arrivals.length,0);assert.equal(w.enemies.length,0);
});

test('a full incoming queue cannot leave a boss event active without its boss',()=>{
  const {w,p}=setup();p.profile.xp=2000;p.profile.cleared=[0,1];const event=w.events[2];p.x=event.x;p.z=event.z+3;
  for(let i=0;i<48;i++)w.spawnEnemy({x:0,z:-220,zone:2});
  assert.ok(w.action(p,{type:'event',id:event.id}));assert.equal(event.state,'idle');
  assert.equal(w.arrivals.filter(e=>e.event===event.id).length,0);
});
