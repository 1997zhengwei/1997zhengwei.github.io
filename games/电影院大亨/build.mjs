import {cp,mkdir,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const file of await readdir('src'))if(file.endsWith('.mjs')){const r=spawnSync(process.execPath,['--check',`src/${file}`],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
await mkdir('dist',{recursive:true});for(const p of ['index.html','src','vendor','assets'])await cp(p,`dist/${p}`,{recursive:true});console.log('Built self-contained dist/index.html');
