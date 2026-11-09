import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),files=[];
async function walk(dir){for(const ent of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())await walk(p);else files.push(p);}}
await walk(path.join(root,'src'));
for(const file of files.filter(p=>p.endsWith('.mjs'))){const source=await readFile(file,'utf8');for(const match of source.matchAll(/(?:import|export)\s+[^;]*?from\s*['"]([^'"]+)['"]/g)){assert.ok(match[1].startsWith('.'),`Runtime import is not bundled: ${match[1]}`);await stat(path.resolve(path.dirname(file),match[1]));}}
const html=await readFile(path.join(root,'index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){assert.ok(match[1].startsWith('./'),`External runtime asset: ${match[1]}`);await stat(path.join(root,match[1]));}
const audio=await stat(path.join(root,'assets/audio/pocket-parade.mp3'));assert.ok(audio.size>100000);assert.ok(await stat(path.join(root,'vendor/LICENSE')));console.log(JSON.stringify({status:'ok',sourceFiles:files.length,musicBytes:audio.size,externalRuntimeRequests:0}));
