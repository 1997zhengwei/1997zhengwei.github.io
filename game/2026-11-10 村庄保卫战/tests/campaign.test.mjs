import test from'node:test';import assert from'node:assert/strict';import{campaign}from'./balance.mjs';import{WAVES}from'../core.mjs';
test('legal economy, repair and active movement can complete all 20 nights',()=>{
 for(const seed of[1,3,19,42])for(const dt of[.05,.1]){const{r,log}=campaign(seed,4,true,dt);assert.equal(r.phase,'won',`seed ${seed} dt ${dt} lost at ${r.night}`);assert.equal(log.length,20);assert.equal(r.kills,WAVES.flat().reduce((n,w)=>n+w.count,0));assert.ok(r.bell.hp>0);assert.ok(log.every(n=>n.seconds<120));}
});
test('building with the same policy while standing idle fails before the final siege',()=>{const{r}=campaign(1,4,false,.05);assert.equal(r.phase,'lost');assert.ok(r.night>5&&r.night<20);});
