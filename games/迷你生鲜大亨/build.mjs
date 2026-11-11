import {cp,mkdir,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const file of await readdir('src')){
 if(!file.endsWith('.mjs'))continue;
 const result=spawnSync(process.execPath,['--check',`src/${file}`],{encoding:'utf8'});
 if(result.status!==0)throw new Error(result.stderr||`Invalid module: ${file}`);
}
await mkdir('dist',{recursive:true});
for(const p of ['index.html','src','vendor'])await cp(p,`dist/${p}`,{recursive:true});
console.log('Built self-contained dist/index.html');
