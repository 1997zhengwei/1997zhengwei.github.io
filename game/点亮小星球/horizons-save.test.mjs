import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {startServer} from './starpath-server.mjs';
import {XP,PADS,stats} from './starpath-rules.mjs';
const token='horizons-independent-save-fixture-20261108';
async function join(app){const base=`http://127.0.0.1:${app.port}`,r=await fetch(base+'/api/enter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,name:'Save fixture'})});assert.equal(r.status,200);return {...await r.json(),base};}
async function live(c){const abort=new AbortController(),r=await fetch(c.base+`/api/stream?token=${token}&session=${c.session}`,{signal:abort.signal});assert.equal(r.status,200);const reader=r.body.getReader();await reader.read();return async()=>{await reader.cancel().catch(()=>{});abort.abort();};}
test('real authenticated rejoin and server restart retain injury, carried resources, room and shared upgraded structures',async()=>{
 const root=path.resolve(os.tmpdir()),dir=await mkdtemp(path.join(root,'horizons-save-'));let app,closeLive;
 try{
  app=await startServer({port:0,dataDir:dir});let c=await join(app);closeLive=await live(c);let w=app.rooms.get(c.room),p=w.players.get(c.id);
  Object.assign(p.profile,{xp:XP[59],metal:3000,crystal:3000,homeBase:3,cleared:[0,1,2,3,4,5],modules:{oxygen:8,armor:8},aurora:{arrived:true,radar:true,escort:true,guardian:true,escortCheckpoint:3,milestones:[]},starfall:{arrived:true,cleared:[9,10],pet:false,petStage:0,petXp:0,complete:false}});w.spawnTimers.fill(Infinity);p.fire=Infinity;
  const st=w.stations.find(s=>s.zone===9),pad=PADS.find(p=>p.station===st.id);p.x=st.x+2;p.z=st.z;
  assert.equal(w.action(p,{type:'stationBuild',station:st.id}),null);assert.equal(w.action(p,{type:'build',tower:'gun',pad:pad.id}),null);
  const t=w.towers[0];t.level=5;t.tier=3;t.maxHp=720;t.hp=321;p.x=5;p.z=-1480;p.hp=73;p.oxygen=51;p.pouch={metal:100,crystal:80};w.dirty(p);const bank=p.profile.metal;await app.flush();
  await closeLive();closeLive=null;c=await join(app);closeLive=await live(c);p=app.rooms.get(c.room).players.get(c.id);
  assert.equal(p.z,-1480);assert.equal(p.hp,73);assert.equal(p.profile.metal,bank);assert.equal(p.pouch.metal,100);assert.ok(p.oxygen<=51&&p.oxygen>49);
  await app.flush();await closeLive();closeLive=null;await app.close();app=null;
  const stored=JSON.parse(await readFile(path.join(dir,'profiles.json'),'utf8'));assert.equal(stored.worlds.length,1);assert.equal(stored.worlds[0].towers[0].tier,3);
  app=await startServer({port:0,dataDir:dir});c=await join(app);closeLive=await live(c);w=app.rooms.get(c.room);p=w.players.get(c.id);w.spawnTimers.fill(Infinity);p.fire=Infinity;
  assert.equal(p.z,-1480);assert.equal(p.hp,73);assert.equal(p.profile.metal,bank);assert.equal(p.pouch.metal,100);assert.equal(stats(p.profile).level,60);
  assert.equal(w.stations.find(s=>s.id===st.id).hp,st.maxHp);assert.equal(w.towers.length,1);assert.equal(w.towers[0].tier,3);assert.equal(w.towers[0].hp,321);assert.equal(w.towers[0].maxHp,720);assert.equal(w.enemies.length,0);
 }finally{if(closeLive)await closeLive();if(app)await app.close();assert.equal(path.dirname(path.resolve(dir)),root);assert.ok(path.basename(dir).startsWith('horizons-save-'));await rm(dir,{recursive:true,force:true});}
});
