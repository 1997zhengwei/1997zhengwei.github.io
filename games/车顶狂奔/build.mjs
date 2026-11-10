import {mkdir,cp,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('.',import.meta.url)),out=resolve(root,'dist');
await mkdir(out,{recursive:true});
for(const name of['index.html','src','vendor'])await cp(resolve(root,name),resolve(out,name),{recursive:true});
await mkdir(resolve(out,'assets'),{recursive:true});
for(const entry of await readdir(resolve(root,'assets'),{withFileTypes:true})){
 // The former mesh is retained only for historical tests; the game uses the new courier.
 if(entry.name==='runner.glb')continue;
 await cp(resolve(root,'assets',entry.name),resolve(out,'assets',entry.name),{recursive:true});
}
console.log('CONVOY LEAP v0.4.2: static game built in dist/ (no install or CDN required).');
