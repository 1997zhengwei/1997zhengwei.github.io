import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {makeActor} from '../src/actors.mjs';
import {createState} from '../src/simulation.mjs';
import {product} from '../src/products.mjs';
import {IDS} from '../src/config.mjs';
import {COSMETICS} from '../src/cosmetics.mjs';
// Geometry smoke check only; screenshots in the real browser verify rendering.
globalThis.document??={createElement:()=>({width:64,height:64,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
test('all customer archetypes and owned outfits build, move and dispose without missing geometry helpers',()=>{const scene=new T.Scene(),s=createState(3);for(let style=0;style<48;style++){const a={id:'customer-art',style,x:0,z:0,angle:.5,walk:1,walking:true,bag:{tomato:2},action:''},v=makeActor(scene,a,s);v.update(a,1,.016);assert(v.root.children.length>1);v.dispose();}for(const id of Object.keys(COSMETICS).filter(id=>id.startsWith('outfit:'))){s.cosmetics.equipped.outfit=id;const a={...s.player,bag:{tomato:6}},v=makeActor(scene,a,s);v.update(a,1,.016);v.dispose();}assert.equal(scene.children.length,0);});

test('all store product models and tray tiers construct finite 3D geometry',()=>{for(const store of ['corner','seaside','night'])for(const id of IDS){const m=product(id,store);assert(m.geometry.attributes.position.count>0);assert([...m.geometry.attributes.position.array].every(Number.isFinite));}const scene=new T.Scene(),s=createState(4);for(const id of Object.keys(COSMETICS).filter(id=>id.startsWith('tray:'))){s.cosmetics.equipped.tray=id;const a={...s.player,bag:{flower:3}},v=makeActor(scene,a,s);v.update(a,1,.016);v.dispose();}assert.equal(scene.children.length,0);});
