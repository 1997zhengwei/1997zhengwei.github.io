import {spawn,execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';

const endpoint='http://127.0.0.1:8944/';
const localPlay='http://localhost:8944/';

async function status(){
  try{
    const response=await fetch(endpoint,{signal:AbortSignal.timeout(500)});
    await response.body?.cancel();
    return response.headers.get('X-Game-App')==='pine-ridge-mill'?'ready':'other';
  }catch{return 'closed';}
}

let result=await status();
if(result==='closed'){
  const server=fileURLToPath(new URL('./server.mjs',import.meta.url));
  const child=spawn(process.execPath,[server,'8944'],{detached:true,stdio:'ignore',windowsHide:true});
  child.unref();
  for(let attempt=0;attempt<27&&result==='closed';attempt++){
    await sleep(120);
    result=await status();
  }
}
if(result!=='ready'){
  console.error('松谷木业无法启动。请确认 8944 端口可用。');
  process.exitCode=1;
}else{
  if(process.platform==='win32')execFile('cmd.exe',['/d','/c','start','',localPlay],{windowsHide:true});
  else console.log(localPlay);
}
