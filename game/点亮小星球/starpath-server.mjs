import {snapshotOutpost,restoreOutpost} from './outpost-storage.mjs';
import http from 'node:http';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';
import {FrontierWorld,newProfile,normalizeProfile,publicProfile,VERSION,MAX_PLAYERS} from './starpath-rules.mjs';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const hash=s=>createHash('sha256').update(s).digest('hex');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))}
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>8192)throw Error('Request too large.')}return JSON.parse(data||'{}')}
export async function startServer({port=8820,host='127.0.0.1',dataDir=path.join(ROOT,'.horizons-data'),persist=true}={}){
 const accounts=new Map(),rooms=new Map(),streams=new Map(),sessions=new Map(),limits=new Map();let revision=0,savedRevision=0,saving=Promise.resolve(),closing=false,lastSaveError='',board=[];
 const dirty=()=>revision++;
 if(persist){await mkdir(dataDir,{recursive:true});try{const data=JSON.parse(await readFile(path.join(dataDir,'profiles.json'),'utf8'));if(data.schema!==1)throw Error('Unsupported save schema');for(const [key,v]of Object.entries(data.accounts||{}))accounts.set(key,{profile:normalizeProfile(v.profile,v.profile.id),roomId:v.roomId||null});board=Array.isArray(data.board)?data.board.slice(-24):[];for(const state of data.worlds||[]){if(!/^BASE-\d+$/.test(state.id||'')||rooms.size>=24)continue;const room=new FrontierWorld({id:state.id,onDirty:dirty,board});restoreOutpost(room,state);rooms.set(room.id,room)}}catch(e){if(e.code!=='ENOENT')throw Error(`Cannot safely read existing Starpath save: ${e.message}`)}}
 let lastWorld='';async function flush(){if(!persist)return;for(const room of rooms.values())for(const p of room.players.values())if(p.online)room.checkpointPlayer(p);const worldText=JSON.stringify([...rooms.values()].map(snapshotOutpost));if(worldText!==lastWorld){lastWorld=worldText;dirty()}if(revision===savedRevision)return;saving=saving.catch(()=>{}).then(async()=>{if(revision===savedRevision)return;const rev=revision,allBoard=[...rooms.values()].flatMap(r=>r.board),unique=new Map([...board,...allBoard].map(x=>[x.id,x]));const data={schema:1,savedAt:new Date().toISOString(),accounts:Object.fromEntries([...accounts].map(([k,a])=>[k,{profile:a.profile,roomId:a.roomId}])),worlds:[...rooms.values()].map(snapshotOutpost),board:[...unique.values()].sort((a,b)=>a.at-b.at).slice(-24)};const text=JSON.stringify(data);await writeFile(path.join(dataDir,'profiles.tmp'),text);await rename(path.join(dataDir,'profiles.tmp'),path.join(dataDir,'profiles.json'));savedRevision=rev;lastSaveError=''});try{await saving}catch(e){lastSaveError='Local save unavailable. Keep this server open.';throw e}}
 const present=p=>!!p&&(p.online||p.joinUntil>Date.now()),occupancy=room=>[...room.players.values()].filter(present).length;
 function view(room,id){const v=room.view(id);if(v){v.saveStatus=lastSaveError||(revision===savedRevision?'Saved to server':'Saving progress…');v.capacity=MAX_PLAYERS;v.records=[...accounts.values()].map(a=>publicProfile(a.profile)).sort((a,b)=>b.records.distance-a.records.distance).slice(0,12)}return v}
 function publish(room){for(const [id,s]of streams){if(s.room!==room)continue;if(s.res.destroyed){streams.delete(id);continue}if(s.res.writableLength>1024*512){s.res.destroy();continue}s.res.write(`data: ${JSON.stringify(view(room,id))}\n\n`)}}
 function identify(data){if(typeof data.token!=='string'||!/^[a-zA-Z0-9_-]{32,100}$/.test(data.token))throw Error('A valid explorer identity is required.');const account=accounts.get(hash(data.token));if(!account)throw Error('Enter camp first.');const session=sessions.get(account.profile.id);if(!session||session.nonce!==data.session)throw Error('This explorer opened in another tab. Re-enter camp to take control.');const room=rooms.get(session.room),player=room?.players.get(account.profile.id);if(!player)throw Error('Your camp is reconnecting.');return{account,session,room,player}}
 const server=http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');const url=new URL(req.url,'http://localhost');
  try{
   if(url.pathname.startsWith('/api/')){
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Use the game on its own server.'});
    if(req.method==='POST'){
     const ip=req.socket.remoteAddress,now=Date.now(),b=limits.get(ip);if(!b||now-b.time>1000)limits.set(ip,{time:now,count:1});else if(++b.count>180)return json(res,429,{error:'Please slow down.'});const data=await body(req);
     if(url.pathname==='/api/enter'){
      if(typeof data.token!=='string'||!/^[a-zA-Z0-9_-]{32,100}$/.test(data.token))return json(res,400,{error:'A valid explorer identity is required.'});const key=hash(data.token);let account=accounts.get(key);if(!account){account={profile:newProfile('p-'+key.slice(0,12),data.name)};accounts.set(key,account);dirty()}
      const id=account.profile.id,old=sessions.get(id);let room=old?rooms.get(old.room):rooms.get(account.roomId||account.profile.journey?.room);if(!room||(occupancy(room)>=MAX_PLAYERS&&!present(room.players.get(id))))room=[...rooms.values()].find(r=>occupancy(r)<MAX_PLAYERS);if(!room){if(rooms.size>=24)return json(res,503,{error:'The local outposts are busy. Try again soon.'});let next=1;while(rooms.has(`BASE-${String(next).padStart(2,'0')}`))next++;room=new FrontierWorld({id:`BASE-${String(next).padStart(2,'0')}`,onDirty:dirty,board});rooms.set(room.id,room)}
      const previous=streams.get(id);if(previous){streams.delete(id);previous.res.end();previous.room.disconnect(id)}
      account.roomId=room.id;const player=room.enter(account.profile),nonce=randomBytes(16).toString('hex');sessions.set(id,{nonce,room:room.id,lastSeq:0,lastInputSeq:0});player.online=false;player.joinUntil=Date.now()+15000;player.lastSeen=room.time;await flush();return json(res,200,{id,room:room.id,session:nonce,version:VERSION});
     }
     const {session,room,player}=identify(data);
     if(url.pathname==='/api/command'){
      if(!Number.isSafeInteger(data.seq)||data.seq<1||typeof data.action?.type!=='string')return json(res,400,{error:'Invalid command.'});const key=data.action.type==='input'?'lastInputSeq':'lastSeq';if(data.seq<=session[key])return json(res,200,{ok:true,duplicate:true});session[key]=data.seq;const error=room.action(player,data.action);if(error)return json(res,400,{error});if(data.action.type!=='input'){await flush();publish(room)}return json(res,200,{ok:true,...(data.action.type==='input'?{}:{snapshot:view(room,player.id)})});
     }
     if(url.pathname==='/api/leave'){const stream=streams.get(player.id);if(stream){streams.delete(player.id);stream.res.end()}room.disconnect(player.id);await flush();publish(room);return json(res,200,{ok:true})}
     return json(res,404,{error:'Unknown endpoint.'});
    }
    if(req.method==='GET'&&url.pathname==='/api/stream'){
     const {room,player}=identify({token:url.searchParams.get('token'),session:url.searchParams.get('session')}),id=player.id;const prior=streams.get(id);if(prior)prior.res.end();res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write('retry: 1000\n\n');const stream={room,res};streams.set(id,stream);player.online=true;player.input={x:0,z:0};publish(room);req.on('close',()=>{if(streams.get(id)!==stream)return;streams.delete(id);room.disconnect(id);dirty();publish(room)});return;
    }
    if(req.method==='GET'&&url.pathname==='/api/info')return json(res,200,{version:VERSION,port:server.address().port,rooms:rooms.size,online:streams.size,capacity:MAX_PLAYERS,persistence:persist});
    return json(res,405,{error:'Unsupported request.'});
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Unsupported request.'});const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname),filename=path.resolve(ROOT,'.'+relative);if(!filename.startsWith(ROOT+path.sep)||relative.includes('..')||relative.includes('\\')||relative.split('/').some(p=>p.startsWith('.'))||/server|start-starpath|\.test\.|package|README|BUILD-NOTES|QA|\.json/i.test(relative)||!MIME[path.extname(filename)])return json(res,404,{error:'Not found.'});const data=await readFile(filename);res.writeHead(200,{'Content-Type':MIME[path.extname(filename)],'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
  }catch(e){json(res,e.code==='ENOENT'?404:400,{error:e.code==='ENOENT'?'Not found.':e.message})}
 });
 let elapsed=0,last=performance.now();const tick=setInterval(()=>{if(closing)return;const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;for(const r of rooms.values()){r.step(dt/2);r.step(dt/2)}elapsed+=dt;if(elapsed>=.1){elapsed=0;for(const r of rooms.values())if(r.online().length)publish(r)}},50);
 const saver=setInterval(()=>flush().catch(e=>console.warn('Starpath save failed:',e.message)),2000),sweeper=setInterval(()=>{for(const [ip,b]of limits)if(Date.now()-b.time>60000)limits.delete(ip);for(const r of rooms.values())for(const [id,p]of r.players)if(!p.online&&r.time-(p.lastSeen??r.time)>120)r.players.delete(id)},60000);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve)});
 return{server,rooms,accounts,port:server.address().port,flush,async close(){closing=true;clearInterval(tick);clearInterval(saver);clearInterval(sweeper);for(const s of streams.values())s.res.end();streams.clear();await flush();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const app=await startServer({port:Number(process.env.PORT||8820),host:process.env.HOST||'127.0.0.1'});console.log(`Starpath Horizons: http://127.0.0.1:${app.port}/`);for(const sig of ['SIGINT','SIGTERM'])process.on(sig,async()=>{await app.close();process.exit(0)})}

