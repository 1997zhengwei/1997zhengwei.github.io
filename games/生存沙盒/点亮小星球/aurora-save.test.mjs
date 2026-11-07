import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {startServer} from './starpath-server.mjs';
import {AURORA,MAX_LEVEL,XP,basePosition,inHub,levelCap,levelOf,newProfile,normalizeProfile} from './starpath-rules.mjs';

const CLEARED=[0,1,2,3,4,5];
const EMPTY_AURORA={arrived:false,radar:false,escort:false,guardian:false,escortCheckpoint:0,milestones:[]};
const TOKEN_PREFIX='aurora-isolated-save-test-';
const TEMP_PREFIX='pocket-aurora-save-';
const hash=token=>createHash('sha256').update(token).digest('hex');
const tokenFor=name=>TOKEN_PREFIX+name.padEnd(32,'0');

// These are deliberately constructed test profiles, not claims of UI playthrough.
function veteranFixture(id,name='Persistence Pilot'){
  const profile=newProfile(id,name);
  Object.assign(profile,{xp:XP[29],metal:431,crystal:257,weapon:'arc',suit:9,skin:'violet',cleared:[...CLEARED],visited:[0,3,7,11],unlocks:['station-0','station-11','region-5']});
  Object.assign(profile.modules,{oxygen:5,armor:4});
  Object.assign(profile.weapons,{pulse:3,scatter:2,rail:3,arc:2});
  Object.assign(profile.tutorial,{gathered:27,relay:true,defenseKills:8,defended:true,advanced:true});
  Object.assign(profile.records,{distance:620,rescues:4,bosses:6,deliveries:12,kills:93});
  return profile;
}

function preservedFields(profile){
  const {name,xp,metal,crystal,modules,weapon,weapons,suit,skin,cleared,visited,tutorial,records,unlocks,homeBase,aurora}=profile;
  return structuredClone({name,xp,metal,crystal,modules,weapon,weapons,suit,skin,cleared,visited,tutorial,records,unlocks,homeBase,aurora});
}

function assertAtHome(player,base){
  assert.equal(player.profile.homeBase,base);
  assert.ok(inHub(player),'login must spawn inside a safe base');
  const expected=basePosition(player.profile,player.slot);
  assert.ok(Math.hypot(player.x-expected.x,player.z-expected.z)<1e-7,'login must use the saved home base spawn');
  if(base===2)assert.ok(Math.abs(player.z-AURORA.base.z)<20,'second-base spawn stays near Aurora Base');
  else assert.ok(player.z>=-12,'fresh/legacy explorers stay at the original base');
}

async function post(base,endpoint,payload,headers={}){
  const response=await fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload)});
  return {status:response.status,body:await response.json()};
}

async function enter(app,token,name='Save Tester',extra={}){
  const base='http://127.0.0.1:'+app.port;
  const result=await post(base,'/api/enter',{token,name,...extra});
  assert.equal(result.status,200,JSON.stringify(result.body));
  assert.match(result.body.session,/^[a-f0-9]{32}$/);
  return {base,token,...result.body,seq:0,inputSeq:0};
}

function playerFor(app,client){return app.rooms.get(client.room).players.get(client.id)}

async function command(client,action){
  const seq=action.type==='input'?++client.inputSeq:++client.seq;
  return post(client.base,'/api/command',{token:client.token,session:client.session,seq,action});
}

async function stream(client){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  let reader;
  try{
    const response=await fetch(client.base+`/api/stream?token=${encodeURIComponent(client.token)}&session=${encodeURIComponent(client.session)}`,{signal:controller.signal});
    assert.equal(response.status,200);
    assert.match(response.headers.get('Content-Type'),/^text\/event-stream/);
    reader=response.body.getReader();
    const decoder=new TextDecoder();let buffer='';
    for(;;){
      const {value,done}=await reader.read();
      assert.equal(done,false,'stream must publish an initial authenticated snapshot');
      buffer+=decoder.decode(value,{stream:true});
      const event=buffer.split('\n\n').find(part=>part.startsWith('data: '));
      if(event){
        clearTimeout(timer);
        return {snapshot:JSON.parse(event.slice(6)),async close(){await reader.cancel().catch(()=>{});controller.abort()}};
      }
    }
  }catch(error){clearTimeout(timer);await reader?.cancel().catch(()=>{});controller.abort();throw error}
}

async function withSave(run){
  const tempRoot=path.resolve(os.tmpdir());
  const dir=await mkdtemp(path.join(tempRoot,TEMP_PREFIX));
  const apps=[],streams=[];
  const context={dir,streams,async start(){const app=await startServer({port:0,dataDir:dir});apps.push(app);return app},async connect(client){const live=await stream(client);streams.push(live);return live}};
  try{await run(context)}finally{
    await Promise.allSettled(streams.map(live=>live.close()));
    for(const app of apps.reverse())if(app.server.listening)await app.close();
    const absolute=path.resolve(dir);
    assert.equal(path.dirname(absolute),tempRoot,'cleanup must remain directly inside the temporary directory');
    assert.ok(path.basename(absolute).startsWith(TEMP_PREFIX),'cleanup must target exactly this test fixture');
    await rm(absolute,{recursive:true,force:true});
  }
}

test('legacy Level 30 six-frontier profiles retain equipment, supplies and completed tasks without claiming Aurora',()=>{
  assert.equal(MAX_LEVEL,60);
  assert.equal(AURORA.base.x,0);assert.equal(AURORA.base.z,-672);
  const original=veteranFixture('legacy-pilot');
  delete original.homeBase;delete original.aurora;
  const migrated=normalizeProfile(original,original.id);
  assert.equal(levelOf(migrated.xp),30);
  assert.equal(levelCap(migrated),30);
  assert.equal(migrated.homeBase,1);
  assert.deepEqual(migrated.aurora,EMPTY_AURORA);
  for(const field of ['xp','metal','crystal','modules','weapon','weapons','suit','skin','cleared','visited','tutorial','records','unlocks'])assert.deepEqual(migrated[field],original[field],`legacy ${field} must survive`);
  const fresh=newProfile('fresh-pilot');
  assert.equal(fresh.homeBase,1);assert.deepEqual(fresh.aurora,EMPTY_AURORA);
});

test('normalization enforces arrival and task prerequisites and accepts every new Level 31 through 45',()=>{
  const forged=newProfile('forged');
  Object.assign(forged,{homeBase:2,aurora:{arrived:true,radar:true,escort:true,guardian:true,escortCheckpoint:99}});
  const locked=normalizeProfile(forged,forged.id);
  assert.equal(locked.homeBase,1);assert.deepEqual(locked.aurora,EMPTY_AURORA);
  const skipped=veteranFixture('skipped');
  Object.assign(skipped,{homeBase:1,aurora:{arrived:false,radar:true,escort:true,guardian:true,escortCheckpoint:2}});
  const ordered=normalizeProfile(skipped,skipped.id);
  assert.equal(ordered.homeBase,1);assert.deepEqual(ordered.aurora,EMPTY_AURORA);
  const outOfOrder=veteranFixture('out-of-order');
  Object.assign(outOfOrder,{homeBase:2,aurora:{arrived:true,radar:false,escort:true,guardian:true,escortCheckpoint:2}});
  const gated=normalizeProfile(outOfOrder,outOfOrder.id);
  assert.equal(gated.aurora.arrived,true);assert.equal(gated.aurora.radar,false);assert.equal(gated.aurora.escort,false);assert.equal(gated.aurora.guardian,false);assert.equal(gated.aurora.escortCheckpoint,0);
  for(let level=31;level<=45;level++){
    const profile=veteranFixture('level-'+level);
    Object.assign(profile,{xp:XP[level-1],homeBase:2,aurora:{arrived:true,radar:true,escort:true,guardian:true,escortCheckpoint:3}});
    const restored=normalizeProfile(profile,profile.id);
    assert.equal(levelOf(restored.xp),level,`Level ${level} must not be truncated to the former Level 30 maximum`);
    assert.equal(restored.homeBase,2);assert.equal(restored.aurora.guardian,true);
  }
});

test('HTTP identity, online stream, session replacement and command ordering still guard Aurora unlocks',async()=>withSave(async context=>{
  const app=await context.start(),token=tokenFor('forgery');
  const client=await enter(app,token,'Fresh',{homeBase:2,xp:XP[44],cleared:CLEARED,aurora:{arrived:true,radar:true,escort:true,guardian:true}});
  const player=playerFor(app,client);
  assertAtHome(player,1);assert.equal(levelOf(player.profile.xp),1);
  assert.equal((await command(client,{type:'travelBase',base:2})).status,400,'enter alone must not bypass the required live stream');
  await context.connect(client);
  for(const action of [{type:'travelBase',base:2},...['radar','escort','guardian'].map(target=>({type:'aurora',target,homeBase:2,x:0,z:AURORA.base.z}))]){
    const result=await command(client,action);assert.equal(result.status,400,JSON.stringify(action));
    assert.equal(player.profile.homeBase,1);assert.deepEqual(player.profile.aurora,EMPTY_AURORA);
  }
  const badOrigin=await post(client.base,'/api/command',{token,session:client.session,seq:99,action:{type:'travelBase',base:2}},{Origin:'http://unrelated.invalid'});
  assert.equal(badOrigin.status,403);
  const replacement=await enter(app,token);
  assert.notEqual(replacement.session,client.session);
  assert.equal((await command(client,{type:'name',name:'Stale Session'})).status,400,'a replaced session must lose control');
  const rejectedStream=await fetch(client.base+`/api/stream?token=${token}&session=${client.session}`);
  assert.equal(rejectedStream.status,400);
  assert.equal((await command(replacement,{type:'travelBase',base:2})).status,400,'a replacement session also needs its own live stream');
  await context.connect(replacement);
  const input=await command(replacement,{type:'input',x:0,z:0});assert.equal(input.status,200);assert.equal(input.body.duplicate,undefined,'input has an independent sequence');
  const renamed=await command(replacement,{type:'name',name:'Current Session'});assert.equal(renamed.status,200);
  const duplicate=await post(replacement.base,'/api/command',{token,session:replacement.session,seq:replacement.seq,action:{type:'name',name:'Duplicate Must Not Run'}});
  assert.equal(duplicate.status,200);assert.equal(duplicate.body.duplicate,true);assert.equal(player.profile.name,'Current Session');
  assert.deepEqual(player.profile.aurora,EMPTY_AURORA);
}));

test('real travel, flush, server restart and enter retain second-base home and all permanent 31–45 milestones',async()=>withSave(async context=>{
  let app=await context.start();const clients=[],expected=new Map();
  const stages=[
    {level:31,radar:false,escort:false,guardian:false,escortCheckpoint:0},
    {level:36,radar:true,escort:false,guardian:false,escortCheckpoint:1},
    {level:41,radar:true,escort:true,guardian:false,escortCheckpoint:3},
    {level:45,radar:true,escort:true,guardian:true,escortCheckpoint:3},
  ];
  for(const stage of stages){
    const client=await enter(app,tokenFor('milestone-'+stage.level),'Level '+stage.level);clients.push(client);
    await context.connect(client);
    const player=playerFor(app,client),room=app.rooms.get(client.room),fixture=veteranFixture(client.id,'Level '+stage.level);
    app.accounts.get(hash(client.token)).profile=fixture;player.profile=fixture;room.dirty(player);
    const arrival=await command(client,{type:'travelBase',base:2});
    assert.equal(arrival.status,200,JSON.stringify(arrival.body));
    assertAtHome(player,2);assert.equal(player.profile.aurora.arrived,true);assert.ok(levelOf(player.profile.xp)>=31);
    player.profile.xp=XP[stage.level-1];
    Object.assign(player.profile.aurora,{arrived:true,radar:stage.radar,escort:stage.escort,guardian:stage.guardian,escortCheckpoint:stage.escortCheckpoint});
    room.step(.05);room.dirty(player);expected.set(client.id,preservedFields(player.profile));
  }
  const fresh=await enter(app,tokenFor('separate-newcomer'),'Newcomer');await context.connect(fresh);
  assertAtHome(playerFor(app,fresh),1);
  for(const client of clients)assertAtHome(playerFor(app,client),2);
  const visitOriginal=await command(clients[0],{type:'travelBase',base:1});
  assert.equal(visitOriginal.status,200);assert.ok(playerFor(app,clients[0]).z>=-12);
  assert.equal(playerFor(app,clients[0]).profile.homeBase,2,'visiting the original base must not undo the permanent second-base home');
  const positions=new Map(clients.map(c=>[c.id,{x:playerFor(app,c).x,z:playerFor(app,c).z}]));
  await app.flush();
  const saved=JSON.parse(await readFile(path.join(context.dir,'profiles.json'),'utf8'));
  for(const client of clients)assert.deepEqual(preservedFields(saved.accounts[hash(client.token)].profile),expected.get(client.id));
  await app.close();
  app=await context.start();
  for(const old of clients){
    const loaded=app.accounts.get(hash(old.token)).profile;
    assert.deepEqual(preservedFields(loaded),expected.get(old.id),'normalization must retain mission, gear and supply state');
    const returning=await enter(app,old.token);const live=await context.connect(returning),player=playerFor(app,returning);
    assert.equal(player.profile.homeBase,2);assert.equal(player.x,positions.get(old.id).x);assert.equal(player.z,positions.get(old.id).z);assert.equal(live.snapshot.self.homeBase,2);assert.deepEqual(live.snapshot.self.aurora,loaded.aurora);
    assert.equal(live.snapshot.self.level,levelOf(expected.get(old.id).xp));
    assert.deepEqual(preservedFields(player.profile),expected.get(old.id));
    // Enter must also honor the home base when this account already has a room player.
    player.online=false;player.x=11;player.z=AURORA.vault.z+5;player.down=true;player.hp=0;player.oxygen=0;player.input={x:1,z:-1};
    const reentered=await enter(app,old.token);await context.connect(reentered);
    assert.equal(player.down,true);assert.equal(player.z,AURORA.vault.z+5);assert.equal(player.hp,0);assert.deepEqual(player.input,{x:0,z:0});assert.equal((await command(reentered,{type:'return'})).status,200);assertAtHome(player,2);
    assert.deepEqual(preservedFields(player.profile),expected.get(old.id));
  }
  const newArrival=await enter(app,fresh.token);await context.connect(newArrival);assertAtHome(playerFor(app,newArrival),1);
  const privateSave=await fetch('http://127.0.0.1:'+app.port+'/.aurora-data/profiles.json');assert.equal(privateSave.status,404);
}));

test('a synthetic old-format save enters base one, travels to Aurora and survives another restart',async()=>withSave(async context=>{
  const token=tokenFor('legacy-on-disk'),key=hash(token),legacy=veteranFixture('p-'+key.slice(0,12),'Legacy Veteran');
  delete legacy.homeBase;delete legacy.aurora;
  await writeFile(path.join(context.dir,'profiles.json'),JSON.stringify({schema:1,accounts:{[key]:{profile:legacy}},board:[]}));
  let app=await context.start(),client=await enter(app,token);await context.connect(client);
  let player=playerFor(app,client);
  assertAtHome(player,1);assert.equal(levelOf(player.profile.xp),30);assert.deepEqual(player.profile.aurora,EMPTY_AURORA);
  for(const field of ['metal','crystal','modules','weapon','weapons','suit','skin','cleared','visited','tutorial','records','unlocks'])assert.deepEqual(player.profile[field],legacy[field]);
  assert.equal((await command(client,{type:'travelBase',base:2})).status,200);assertAtHome(player,2);
  app.rooms.get(client.room).step(.05);
  const expected=preservedFields(player.profile);await app.flush();await app.close();
  app=await context.start();client=await enter(app,token);await context.connect(client);player=playerFor(app,client);
  assertAtHome(player,2);assert.deepEqual(preservedFields(player.profile),expected);
  assert.equal(player.profile.weapon,'arc');assert.deepEqual(player.profile.cleared,CLEARED);
}));
