import test from 'node:test';
import assert from 'node:assert/strict';
import {AURORA,MAX_DEPTH,MAX_LEVEL,SUITS,XP,FrontierWorld,newProfile,normalizeProfile,basePosition,inHub,dist,depth,stats,levelCap,frontierOf,trainingCost,weaponCost,guideFor,ENEMY_ARRIVAL} from './starpath-rules.mjs';

const six=[0,1,2,3,4,5];
function profile(id='pilot',phase='arrival'){
  const p=newProfile(id);p.cleared=[...six];p.xp=XP[29];
  if(phase!=='legacy'){p.homeBase=2;p.aurora.arrived=true;p.xp=XP[30];}
  if(['radar','escort','guardian'].includes(phase)){p.aurora.radar=true;p.xp=XP[35];}
  if(['escort','guardian'].includes(phase)){p.aurora.escort=true;p.aurora.escortCheckpoint=3;p.xp=XP[40];}
  if(phase==='guardian'){p.aurora.guardian=true;p.xp=XP[44];}
  return p;
}
function setup(phase='arrival'){const w=new FrontierWorld(),p=w.enter(profile('pilot',phase));w.spawnTimers.fill(Infinity);p.fire=Infinity;return{w,p}}
function advance(w,seconds,follow=false){for(let i=0;i<Math.ceil(seconds/.05);i++){if(follow){pFollow(w)}w.step(.05,1000)}}
function pFollow(w){const p=w.players.get('pilot'),r=w.aurora.rover;p.x=r.x+2;p.z=r.z;p.fire=Infinity;}

test('Aurora extends the expedition, milestones and caps while retaining the original training and weapon gates',()=>{
  assert.equal(MAX_DEPTH,1620);assert.equal(MAX_LEVEL,60);assert.equal(XP.length,60);assert.equal(SUITS.length,20);
  assert.deepEqual(SUITS.slice(10,15).map(s=>s.level),[31,34,37,40,43]);
  for(const [phase,cap,frontier] of [['legacy',30,6],['arrival',31,6],['radar',36,7],['escort',41,8],['guardian',45,9]]){const p=profile('p',phase);assert.equal(levelCap(p),cap);assert.equal(frontierOf(p),frontier);}
  const p=profile('p','legacy');p.modules.armor=4;assert.equal(trainingCost(p,'armor').level,21);p.modules.armor=5;assert.equal(trainingCost(p,'armor').level,31);
  p.modules.armor=6;assert.equal(trainingCost(p,'armor').level,36);p.modules.armor=7;assert.equal(trainingCost(p,'armor').level,41);
  p.weapons.pulse=2;assert.equal(weaponCost(p,'pulse').level,10);p.weapons.pulse=3;assert.equal(weaponCost(p,'pulse').level,31);p.weapons.pulse=4;assert.equal(weaponCost(p,'pulse').level,40);
});

test('arrival saves a permanent new home and returning to the original base never resets that home or repeats rewards',()=>{
  const {w,p}=setup('legacy');const starting={xp:p.profile.xp,metal:p.profile.metal,crystal:p.profile.crystal};
  assert.equal(p.profile.homeBase,1);assert.equal(guideFor(w,p).step,101);
  p.x=0;p.z=AURORA.base.z+20;w.step(.05,1000);
  assert.equal(p.profile.homeBase,2);assert.equal(p.profile.aurora.arrived,true);assert.equal(stats(p.profile).level,31);assert.equal(guideFor(w,p).step,102);
  assert.equal(p.profile.metal,starting.metal+AURORA.rewards.arrival.metal);const saved=JSON.stringify(p.profile.aurora),metal=p.profile.metal;
  assert.equal(w.action(p,{type:'travelBase',base:1}),null);assert.ok(p.z>=-12);assert.equal(p.profile.homeBase,2);
  w.disconnect(p.id);const again=w.enter(p.profile);assert.equal(again.z,7,'short reconnect keeps the visited original base');assert.ok(inHub(again));assert.equal(JSON.stringify(again.profile.aurora),saved);assert.equal(again.profile.metal,metal);
  assert.equal(w.action(p,{type:'travelBase',base:2}),null);assert.equal(p.profile.metal,metal);
});

test('fresh or partially cleared players cannot travel to Aurora or cross the 620m frontier',()=>{
  const w=new FrontierWorld(),p=w.enter(newProfile('young'));assert.ok(w.action(p,{type:'travelBase',base:2}));
  p.profile.cleared=[0,1,2,3,4];p.x=0;p.z=-631;p.input={x:0,z:-1};p.lastInput=1000;w.spawnTimers.fill(Infinity);advance(w,1);assert.ok(depth(p)<620);
  p.profile.cleared.push(5);advance(w,1);assert.ok(depth(p)>620);
});

test('the radar grants its permanent reward only once and only to present explorers with their own prerequisites',()=>{
  const {w,p}=setup();p.x=AURORA.radar.x+3;p.z=AURORA.radar.z;
  const absent=w.enter(profile('absent'));w.disconnect(absent.id);
  const newcomer=w.enter(newProfile('newcomer'));newcomer.x=p.x;newcomer.z=p.z;
  assert.equal(w.action(p,{type:'aurora',target:'radar'}),null);
  for(let i=0;i<Math.ceil(AURORA.radar.required*10)+1;i++)w.updateAurora(.1);
  assert.equal(p.profile.aurora.radar,true);assert.equal(stats(p.profile).level,36);assert.equal(absent.profile.aurora.radar,false);assert.equal(newcomer.profile.aurora.radar,false);
  const xp=p.profile.xp,metal=p.profile.metal;assert.ok(w.action(p,{type:'aurora',target:'radar'}));assert.equal(p.profile.xp,xp);assert.equal(p.profile.metal,metal);
  assert.ok(w.view(p.id).effects.some(e=>e.type==='auroraMission'&&e.task==='radar'));
});

test('the rover gives moving oxygen without health regeneration, and checkpoints survive death and a new room',()=>{
  let {w,p}=setup('radar');w.auroraWave=()=>{};Object.assign(p,{x:AURORA.roverStart.x+2,z:AURORA.roverStart.z,hp:40,oxygen:1});
  const beforeHp=stats(p.profile).hp;assert.equal(w.action(p,{type:'aurora',target:'escort'}),null);advance(w,16.2,true);
  assert.equal(p.profile.aurora.escortCheckpoint,1);assert.equal(p.hp,40+stats(p.profile).hp-beforeHp+12,'only milestone level-up repairs the suit');assert.ok(p.oxygen>50);assert.equal(p.profile.aurora.escort,false);
  w.down(p);w.evacuate(p);const saved=normalizeProfile(p.profile,p.id);w=new FrontierWorld();p=w.enter(saved);w.spawnTimers.fill(Infinity);w.auroraWave=()=>{};p.fire=Infinity;
  assert.equal(w.aurora.rover.checkpoint,1);assert.ok(dist(w.aurora.rover,AURORA.roverStart)>27);pFollow(w);
  assert.equal(w.action(p,{type:'aurora',target:'escort'}),null);advance(w,32.2,true);
  assert.equal(p.profile.aurora.escort,true);assert.equal(p.profile.aurora.escortCheckpoint,3);assert.equal(w.aurora.rover.stage,'complete');assert.equal(stats(p.profile).level,41);
  p.hp=40;p.oxygen=1;advance(w,3,true);assert.equal(p.hp,40);assert.ok(p.oxygen>50);
});

test('a late escort join cannot skip earlier checkpoints, while an absent explorer cannot inherit a crew clear',()=>{
  const {w,p}=setup('radar');w.auroraWave=()=>{};pFollow(w);assert.equal(w.action(p,{type:'aurora',target:'escort'}),null);advance(w,17,true);
  const late=w.enter(profile('late','radar')),absent=w.enter(profile('absent','radar'));w.disconnect(absent.id);
  for(let i=0;i<650;i++){pFollow(w);late.x=w.aurora.rover.x-2;late.z=w.aurora.rover.z;late.fire=Infinity;w.step(.05,1000)}
  assert.equal(p.profile.aurora.escort,true);assert.equal(late.profile.aurora.escort,false);assert.equal(late.profile.aurora.escortCheckpoint,0);assert.equal(absent.profile.aurora.escort,false);
});

test('the mechanical guardian exposes a timed core, keeps walking warnings, and cannot grant missing prerequisites',()=>{
  const {w,p}=setup('escort');Object.assign(p,{x:AURORA.vault.x+3,z:AURORA.vault.z,fire:Infinity});
  const skipped=w.enter(profile('skipped','radar'));skipped.x=p.x;skipped.z=p.z;skipped.profile.xp=XP[40];skipped.fire=Infinity;
  assert.ok(w.action(skipped,{type:'aurora',target:'guardian'}));assert.equal(w.action(p,{type:'aurora',target:'guardian'}),null);
  const request=w.arrivals.find(e=>e.auroraGuardian);assert.ok(request);advance(w,2);const boss=w.enemies.find(e=>e.auroraGuardian);assert.ok(boss);boss.speed=0;boss.specialCd=Infinity;
  assert.equal(boss.coreOpen,false);let hp=boss.hp;w.damageEnemy(boss,100,p.id);assert.ok(Math.abs(hp-boss.hp-16)<1e-6);
  advance(w,8.2);assert.equal(boss.coreOpen,true);hp=boss.hp;w.damageEnemy(boss,100,p.id);assert.ok(Math.abs(hp-boss.hp-120)<1e-6);
  w.guardianAttack(boss,[p]);assert.ok(w.hazards.every(h=>h.time>=2.8&&h.radius<h.time*5.2));assert.equal(w.view(p.id).aurora.guardian.coreOpen,true);
  w.damageEnemy(boss,1e9,p.id);assert.equal(p.profile.aurora.guardian,true);assert.equal(stats(p.profile).level,45);assert.equal(skipped.profile.aurora.guardian,false);assert.equal(guideFor(w,p).step,201);
});

test('the second base and moving oxygen bubble use the full arrival body buffer and warning restarts',()=>{
  const {w,p}=setup('radar');p.x=0;p.z=AURORA.roverStart.z+3;
  assert.equal(w.safeArrival(0,-645,'scout',6),false);assert.equal(w.safeArrival(15,-672,'boss',6),false);
  const r=w.aurora.rover;assert.equal(w.safeArrival(r.x+11,r.z,'scout',7),false);
  const request=w.spawnEnemy({x:r.x+14,z:r.z-12,zone:7},'scout');assert.ok(request);
  if(request.phase==='warning'){assert.ok(dist(request,r)>=r.radius+3+w.enemyRadius(request.type));const before=request.warnUntil;r.x=request.x;r.z=request.z;w.updateArrivals();assert.ok(request.phase==='waiting'||request.warnUntil>=before);}
  assert.equal(ENEMY_ARRIVAL.warningSeconds,2);assert.equal(ENEMY_ARRIVAL.windupSeconds,1);
});

test('re-entering while down preserves the rescue decision and explicit evacuation applies the normal loss',()=>{
  const {w,p}=setup('radar');const m=p.profile.metal,c=p.profile.crystal;p.pouch={metal:20,crystal:10};p.x=0;p.z=-840;w.down(p);w.disconnect(p.id);
  const again=w.enter(p.profile);assert.equal(again.down,true);assert.deepEqual(again.pouch,{metal:20,crystal:10});assert.equal(again.profile.metal,m);assert.equal(w.action(again,{type:'return'}),null);assert.equal(again.profile.metal,m+13);assert.equal(again.profile.crystal,c+6);assert.deepEqual(again.pouch,{metal:0,crystal:0});assert.equal(again.down,false);assert.equal(again.profile.homeBase,2);assert.ok(inHub(again));
});

test('a personal escort resume beacon restarts a completed shared rover without allowing an active convoy to be reset',()=>{
  const {w,p}=setup('radar');p.profile.aurora.escortCheckpoint=1;Object.assign(w.aurora.rover,AURORA.roverEnd,{stage:'complete',checkpoint:3});
  const resume=w.view(p.id).aurora.rover.resume;assert.equal(resume.checkpoint,1);assert.ok(dist(resume,AURORA.roverStart)>27);assert.equal(guideFor(w,p).target.z,resume.z);
  p.x=resume.x+2;p.z=resume.z;assert.equal(w.action(p,{type:'aurora',target:'escort'}),null);assert.equal(w.aurora.rover.checkpoint,1);assert.equal(w.aurora.rover.stage,'moving');
  const q=w.enter(profile('other','radar'));q.x=AURORA.roverStart.x;q.z=AURORA.roverStart.z;assert.ok(w.action(q,{type:'aurora',target:'escort'}));assert.equal(w.aurora.rover.checkpoint,1);assert.equal(w.aurora.rover.stage,'moving');
});

function abandonedThreats(w,task){
  const taskEnemy={id:9001,x:-15,z:-850,type:'spitter',hp:100,auroraTask:task},ordinary={id:9002,x:15,z:-870,type:'scout',hp:100};
  w.enemies.push(taskEnemy,ordinary);
  w.arrivals.push({id:9003,x:-12,z:-860,type:'scout',hp:100,phase:'warning',auroraTask:task},{id:9004,x:12,z:-880,type:'scout',hp:100,phase:'warning'});
  w.hazards.push({id:9010,owner:taskEnemy.id,time:10},{id:9011,owner:9003,time:10},{id:9012,owner:ordinary.id,time:10},{id:9013,owner:8999,time:10,auroraTask:task});
}

test('destroyed and abandoned escorts clear only task threats and their attack marks without paying kill rewards',()=>{
  for(const mode of ['destroyed','abandoned']){
    const {w,p}=setup('radar'),r=w.aurora.rover;Object.assign(r,{stage:'moving',checkpoint:1,hp:mode==='destroyed'?0:r.maxHp});
    if(mode==='destroyed')pFollow(w);else Object.assign(p,basePosition(p.profile));
    abandonedThreats(w,'escort');const before=JSON.stringify({xp:p.profile.xp,metal:p.profile.metal,crystal:p.profile.crystal,pouch:p.pouch,records:p.profile.records});
    w.updateAurora(mode==='destroyed'?.1:12.1);
    assert.equal(r.stage,'failed');assert.deepEqual(w.enemies.map(e=>e.id),[9002]);assert.deepEqual(w.arrivals.map(e=>e.id),[9004]);assert.deepEqual(w.hazards.map(h=>h.id),[9012]);
    assert.equal(JSON.stringify({xp:p.profile.xp,metal:p.profile.metal,crystal:p.profile.crystal,pouch:p.pouch,records:p.profile.records}),before);
    assert.ok(w.effects.some(e=>e.type==='spawnCancelled'&&e.id===9003));assert.equal(w.effects.some(e=>e.type==='kill'),false);
  }
});

test('repeated escort retries discard stale mission arrivals instead of stacking attempts and preserve ordinary foes',()=>{
  const {w,p}=setup('radar'),ordinary={id:9999,x:20,z:-870,type:'scout',hp:100};w.enemies.push(ordinary);
  for(let attempt=0;attempt<3;attempt++){
    const r=w.aurora.rover;Object.assign(r,{stage:'failed',hp:0});Object.assign(p,w.view(p.id).aurora.rover.resume);p.x+=2;
    w.arrivals.push({id:8000+attempt,x:-15,z:-855,type:'scout',hp:100,phase:'warning',auroraTask:'escort'});
    assert.equal(w.action(p,{type:'aurora',target:'escort'}),null);assert.equal(w.arrivals.some(e=>e.auroraTask==='escort'),false);
    w.updateAurora(.1);assert.equal(w.arrivals.filter(e=>e.auroraTask==='escort').length,3);assert.ok(w.enemies.includes(ordinary));
    r.hp=0;w.updateAurora(.1);assert.equal(r.stage,'failed');assert.equal(w.arrivals.some(e=>e.auroraTask==='escort'),false);
  }
});

test('abandoning or restarting the radar removes its exclusive attackers without removing regional threats or granting rewards',()=>{
  const {w,p}=setup();Object.assign(w.aurora.radar,{state:'active',progress:8,participants:[p.id]});abandonedThreats(w,'radar');const before=p.profile.xp;
  w.updateAurora(12.1);assert.equal(w.aurora.radar.state,'idle');assert.equal(w.aurora.radar.progress,0);assert.deepEqual(w.enemies.map(e=>e.id),[9002]);assert.deepEqual(w.arrivals.map(e=>e.id),[9004]);assert.deepEqual(w.hazards.map(h=>h.id),[9012]);assert.equal(p.profile.xp,before);assert.equal(p.profile.aurora.radar,false);
  w.arrivals.push({id:9998,x:-15,z:-750,type:'scout',hp:100,phase:'warning',auroraTask:'radar'});p.x=AURORA.radar.x+3;p.z=AURORA.radar.z;
  assert.equal(w.action(p,{type:'aurora',target:'radar'}),null);assert.equal(w.arrivals.some(e=>e.auroraTask==='radar'),false);assert.ok(w.enemies.some(e=>e.id===9002));
});

test('a failed convoy explains the saved checkpoint and points to the personal restart beacon',()=>{
  const {w,p}=setup('radar');w.aurora.rover.stage='failed';w.aurora.rover.z-=25;
  for(const checkpoint of [0,1,2]){
    p.profile.aurora.escortCheckpoint=checkpoint;const guide=guideFor(w,p),resume=w.view(p.id).aurora.rover.resume;
    assert.equal(guide.step,103);assert.equal(guide.title,`Rover disabled · retry checkpoint ${checkpoint}`);assert.equal(guide.target.name,'Rover restart point');assert.equal(guide.target.z,resume.z);assert.match(guide.text,/Follow the marker back/);assert.match(guide.text,/interact to restart this leg/);
    assert.match(guide.text,checkpoint?new RegExp(`Checkpoint ${checkpoint}/3 is saved`):/No checkpoint reached yet/);
  }
});

test('checkpoint shuttle returns only to the saved escort leg, charges once, and cannot heal or advance progress',()=>{
  for(const checkpoint of [1,2]){
    const {w,p}=setup('radar');p.profile.aurora.escortCheckpoint=checkpoint;p.profile.metal=10;p.hp=37;p.oxygen=42;
    Object.assign(p,{input:{x:1,z:0},charge:{at:2},burst:{at:2}});const before=JSON.stringify(p.profile.aurora),xp=p.profile.xp,resume=w.view(p.id).aurora.rover.resume;
    assert.equal(w.action(p,{type:'resumeAurora',checkpoint:3,x:20,z:-1050}),null);
    assert.ok(dist(p,resume)<=5);assert.equal(p.profile.metal,8);assert.equal(p.hp,37);assert.equal(p.oxygen,42);assert.equal(p.profile.xp,xp);assert.equal(JSON.stringify(p.profile.aurora),before);assert.equal(p.profile.homeBase,2);assert.deepEqual(p.input,{x:0,z:0});assert.equal(p.charge,null);assert.equal(p.burst,null);assert.equal(p.profile.aurora.escort,false);
    assert.ok(w.action(p,{type:'resumeAurora'}));assert.equal(p.profile.metal,8);assert.ok(w.effects.some(e=>e.type==='auroraResume'&&e.checkpoint===checkpoint));
  }
});

test('checkpoint shuttle rejects fresh, unearned, completed and field requests without charging',()=>{
  const cases=[p=>{p.profile.aurora.escortCheckpoint=0},p=>{p.profile.aurora.radar=false},p=>{p.profile.aurora.arrived=false},p=>{p.profile.cleared=[0,1,2,3,4]},p=>{p.profile.aurora.escort=true},p=>{p.x=0;p.z=-800},p=>{p.down=true},p=>{p.profile.aurora.escortCheckpoint=99}];
  for(const change of cases){const {w,p}=setup('radar');p.profile.aurora.escortCheckpoint=1;p.profile.metal=10;change(p);const point={x:p.x,z:p.z};assert.ok(w.action(p,{type:'resumeAurora',checkpoint:2}));assert.equal(p.profile.metal,10);assert.equal(dist(point,p),0);}
  const w=new FrontierWorld(),fresh=w.enter(newProfile('fresh'));fresh.profile.metal=10;assert.ok(w.action(fresh,{type:'resumeAurora',checkpoint:2}));assert.equal(fresh.profile.metal,10);
});

test('checkpoint shuttle avoids active enemies, warning bodies and hazards, and a blocked landing never charges',()=>{
  for(const obstacle of ['enemy','warning','hazard']){
    const {w,p}=setup('radar');p.profile.aurora.escortCheckpoint=2;p.profile.metal=10;const center=w.view(p.id).aurora.rover.resume;
    if(obstacle==='enemy')w.enemies.push({id:9000,...center,type:'boss',hp:100});
    if(obstacle==='warning')w.arrivals.push({id:9000,...center,type:'scout',hp:100,phase:'warning'});
    if(obstacle==='hazard')w.hazards.push({id:9000,...center,radius:5,time:3});
    const point={x:p.x,z:p.z};assert.match(w.action(p,{type:'resumeAurora'}),/No safe landing/);assert.equal(p.profile.metal,10);assert.equal(dist(point,p),0);
  }
  const {w,p}=setup('radar');p.profile.aurora.escortCheckpoint=2;p.profile.metal=10;const center=w.view(p.id).aurora.rover.resume,enemy={id:9000,x:center.x+11,z:center.z,type:'brute',hp:100};w.enemies.push(enemy);
  assert.equal(w.action(p,{type:'resumeAurora'}),null);assert.ok(dist(p,enemy)>=8+w.enemyRadius(enemy.type));assert.ok(dist(p,center)<=5);assert.equal(p.profile.metal,8);
});

test('checkpoint shuttle with a safe landing and insufficient metal does not move or alter stored progress',()=>{
  const {w,p}=setup('radar');p.profile.aurora.escortCheckpoint=1;p.profile.metal=1;const before={x:p.x,z:p.z},progress=JSON.stringify(p.profile.aurora);
  assert.match(w.action(p,{type:'resumeAurora'}),/2 metal/);assert.equal(dist(p,before),0);assert.equal(p.profile.metal,1);assert.equal(JSON.stringify(p.profile.aurora),progress);
});
