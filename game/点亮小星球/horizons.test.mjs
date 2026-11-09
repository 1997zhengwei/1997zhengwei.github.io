import test from 'node:test';
import assert from 'node:assert/strict';
import {FrontierWorld,newProfile,XP,stats,PADS,STATIONS,AURORA,STARFALL} from './starpath-rules.mjs';
import {towerStats,crewScale,JOURNEY_EXPIRY_MS} from './frontier-balance.mjs';
import {snapshotOutpost,restoreOutpost} from './outpost-storage.mjs';
import {bossDamage} from './boss-combat.mjs';
function fixture(level=60,id='captain'){
 const w=new FrontierWorld(),f=newProfile(id,'Test captain');Object.assign(f,{xp:XP[level-1],metal:3000,crystal:3000,homeBase:3,modules:{oxygen:8,armor:8},weapons:{pulse:5,scatter:5,rail:5,arc:5},cleared:[0,1,2,3,4,5],aurora:{arrived:true,radar:true,escort:true,guardian:true,escortCheckpoint:3,milestones:[]},starfall:{arrived:true,cleared:[9,10],pet:false,petStage:0,petXp:0,petName:'Nova',complete:false}});const p=w.enter(f);w.spawnTimers.fill(Infinity);return {w,f,p};
}
test('same-room reconnect preserves position, injury, oxygen and carried supplies without banking or healing',()=>{
 const {w,f,p}=fixture();p.x=5;p.z=-1500;p.hp=1;p.oxygen=37;p.pouch={metal:100,crystal:80};const bank=f.metal;w.disconnect(p.id);const again=w.enter(f);assert.equal(again,p);assert.equal(p.hp,1);assert.equal(p.oxygen,37);assert.equal(p.z,-1500);assert.equal(f.metal,bank);assert.deepEqual(p.pouch,{metal:100,crystal:80});
});
test('downed reconnect keeps the rescue/evacuate decision and cannot bypass its carried-resource penalty',()=>{
 const {w,f,p}=fixture();p.x=5;p.z=-1500;p.hp=0;p.pouch={metal:100,crystal:100};w.down(p);w.disconnect(p.id);w.enter(f);assert.equal(p.down,true);assert.equal(p.pouch.metal,100);w.action(p,{type:'return'});assert.equal(p.down,false);assert.equal(p.z,STARFALL.z);assert.equal(f.metal,3065);
});
test('a saved short journey restores the field after a new world; expired journeys evacuate once',()=>{
 const {w,f,p}=fixture();p.x=5;p.z=-1500;p.hp=64;p.oxygen=57;p.pouch={metal:100,crystal:80};w.checkpointPlayer(p);
 const copy=structuredClone(f),next=new FrontierWorld();let q=next.enter(copy);assert.equal(q.z,-1500);assert.equal(q.hp,64);assert.equal(q.pouch.metal,100);
 const expired=structuredClone(f);expired.journey.savedAt=Date.now()-JOURNEY_EXPIRY_MS-1;const old=new FrontierWorld();q=old.enter(expired);assert.equal(q.z,STARFALL.z);assert.equal(expired.metal,3065);assert.equal(q.hp,Math.ceil(stats(expired).hp*.65));old.disconnect(q.id);old.enter(expired);assert.equal(expired.metal,3065);
});
test('maximum level towers can be repaired, promoted twice, and gain real HP/range/damage with explicit gates',()=>{
 const {w,f,p}=fixture(),pad=PADS[0];p.x=pad.x+2;p.z=pad.z;assert.equal(w.action(p,{type:'build',tower:'gun',pad:pad.id}),null);const t=w.towers[0];for(let i=0;i<4;i++)assert.equal(w.action(p,{type:'upgrade',id:t.id}),null);
 t.hp=1;assert.equal(w.action(p,{type:'towerRepair',id:t.id}),null);assert.equal(t.hp,300);
 const dmg=towerStats(t).damage;assert.equal(w.action(p,{type:'towerAdvance',id:t.id}),null);assert.equal(t.tier,2);assert.equal(t.hp,480);assert.equal(w.action(p,{type:'towerAdvance',id:t.id}),null);assert.equal(t.hp,720);assert.ok(towerStats(t).damage>dmg*1.9);assert.equal(towerStats(t).range,14.5);
 f.xp=XP[29];t.tier=1;assert.ok(w.action(p,{type:'towerAdvance',id:t.id}));
});
test('tower damage applies the level factor exactly once',()=>{
 const {w,p}=fixture(),pad=PADS[0];p.x=pad.x+2;p.z=pad.z;w.action(p,{type:'build',tower:'gun',pad:pad.id});const t=w.towers[0];t.level=5;t.cd=0;p.fire=Infinity;
 const enemy={id:999,x:t.x+3,z:t.z,hp:10000,maxHp:10000,zone:0,type:'scout',contributors:{},readyAt:999,cd:0,slow:0};w.enemies=[enemy];w.step(.05);assert.ok(Math.abs(10000-enemy.hp-towerStats(t).damage)<1e-6);
});
test('outpost snapshot retains structures, upgrades and damage, excludes combat, and validates restored pads',()=>{
 const {w,p}=fixture(),s=w.stations[0],pad=PADS[0];p.x=s.x+2;p.z=s.z;w.action(p,{type:'stationBuild',station:s.id});w.action(p,{type:'build',tower:'gun',pad:pad.id});const t=w.towers[0];t.level=5;t.tier=3;t.maxHp=720;t.hp=321;s.hp=65;
 const snapshot=snapshotOutpost(w),next=new FrontierWorld();restoreOutpost(next,{...snapshot,towers:[...snapshot.towers,{...snapshot.towers[0],pad:'invalid'}]});assert.equal(next.towers.length,1);assert.equal(next.towers[0].hp,321);assert.equal(next.towers[0].maxHp,720);assert.equal(next.stations[0].hp,65);assert.equal(next.enemies.length,0);assert.ok(next.builtStations.has(0));
});
test('oxygen use changes by deep sector while oxygen stations still never heal',()=>{
 const {w,p}=fixture();p.x=2;p.z=-1520;p.fire=Infinity;p.input={x:1,z:0};p.lastInput=Date.now();const before=p.oxygen;w.step(.1);assert.ok(Math.abs(before-p.oxygen-1.6*3.2*.1)<1e-6);const s=w.stations.find(s=>s.zone===11);s.hp=s.maxHp;p.x=s.x+2;p.z=s.z;p.hp=100;p.oxygen=50;w.step(.1);assert.equal(p.hp,100);assert.ok(p.oxygen>50);
});
test('radar milestones are earned during the scan, persist through retries, and retain the total reward',()=>{
 const {w,f,p}=fixture(31);f.starfall.arrived=false;f.homeBase=2;f.aurora={arrived:true,radar:false,escort:false,guardian:false,escortCheckpoint:0,milestones:[]};p.x=AURORA.radar.x+3;p.z=AURORA.radar.z;p.fire=Infinity;w.aurora.radar.state='active';w.auroraWave=()=>{};
 for(let i=0;i<202;i++)w.step(.05);assert.ok(f.aurora.milestones.includes('radar-1'));assert.ok(stats(f).level>31&&stats(f).level<36);const xp=f.xp;assert.equal(w.missionMilestone(p,'radar',1),false);assert.equal(f.xp,xp);
 for(let i=0;i<402;i++)w.step(.05);assert.equal(f.aurora.radar,true);assert.equal(stats(f).level,36);assert.ok(f.aurora.milestones.includes('radar-2'));
});
test('crew changes adjust maximum health smoothly after a grace period while preserving percentage and broken rings',()=>{
 const {w,p}=fixture(),ev=w.events.find(e=>e.zone===11);p.x=4;p.z=ev.z+3;w.startGuardian(ev,p);const e=w.arrivals[0];w.arrivals=[];e.x=0;e.z=ev.z-8;e.readyAt=0;e.cd=0;e.slow=0;w.enemies=[e];p.fire=Infinity;
 for(let i=0;i<4;i++)w.step(.05);e.hp=e.maxHp*.6;e.rings[0].hp=0;const max=e.maxHp;
 for(let i=1;i<8;i++){const q=w.enter({...structuredClone(p.profile),id:'friend'+i,journey:null});q.x=p.x+1;q.z=p.z;q.fire=Infinity;}
 for(let i=0;i<250;i++)w.step(.05);assert.ok(e.maxHp>max*3.8);assert.ok(Math.abs(e.hp/e.maxHp-.6)<1e-6);assert.equal(e.rings[0].hp,0);assert.ok(e.maxHp<=ev.health*crewScale(8)+1e-6);
 for(const q of w.online())if(q.id!==p.id)w.disconnect(q.id);for(let i=0;i<250;i++)w.step(.05);assert.ok(Math.abs(e.maxHp-max)<1);assert.equal(e.rings[0].hp,0);
});

test('radar checkpoints survive a new world and resume without paying the same milestone twice',()=>{
 const {w,f,p}=fixture(31);f.homeBase=2;f.starfall.arrived=false;Object.assign(f.aurora,{radar:false,escort:false,guardian:false,milestones:[]});
 w.missionMilestone(p,'radar',1);const xp=f.xp;f.journey=null;const next=new FrontierWorld(),q=next.enter(structuredClone(f));q.x=AURORA.radar.x+3;q.z=AURORA.radar.z;
 assert.equal(next.action(q,{type:'aurora',target:'radar'}),null);assert.equal(next.aurora.radar.progress,10);assert.equal(next.missionMilestone(q,'radar',1),false);assert.equal(q.profile.xp,xp);
});

test('an established Aurora guardian can be deliberately replayed but never auto-starts or duplicates first-clear rewards',()=>{
 const {w,f,p}=fixture(45);const ev=w.aurora.guardian;p.x=ev.x+3;p.z=ev.z;p.fire=Infinity;w.step(.05);assert.equal(ev.state,'idle');
 const xp=f.xp,bank=[f.metal,f.crystal];assert.equal(w.action(p,{type:'aurora',target:'guardian'}),null);assert.equal(ev.state,'active');assert.equal(w.auroraReward(p,'guardian'),false);assert.equal(f.xp,xp);assert.deepEqual([f.metal,f.crystal],bank);
});

test('Frost Mk II marks a boss and grants exactly twelve percent support damage while preserving armor reduction',()=>{
 const {w,p}=fixture(),pad=PADS[0];p.x=pad.x+2;p.z=pad.z;w.action(p,{type:'build',tower:'frost',pad:pad.id});const t=w.towers[0];t.tier=2;t.cd=0;p.fire=Infinity;
 const e={id:999,x:t.x+3,z:t.z,hp:10000,maxHp:10000,zone:8,type:'boss',bossKind:'aegis',bossStage:'ready',bossTime:100,bossDuration:100,bossCycle:0,coreOpen:false,contributors:{},readyAt:999,cd:0,slow:0};w.enemies=[e];w.step(.05);
 assert.ok(e.brittle>1.7);assert.ok(Math.abs(bossDamage(w,e,100,p.id)-17.92)<1e-8);e.brittle=0;assert.equal(bossDamage(w,e,100,p.id),16);
});
