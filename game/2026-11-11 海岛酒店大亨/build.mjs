import {cp,mkdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const p of ['index.html','src','vendor'])await cp(p,`dist/${p}`,{recursive:true});
console.log('Built self-contained dist/index.html');
