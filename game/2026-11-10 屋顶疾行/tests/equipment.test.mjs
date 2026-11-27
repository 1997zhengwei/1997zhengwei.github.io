import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSave} from '../src/progress.mjs';
import {EQUIPMENT,buyEquipment,unequip,huntReward} from '../src/equipment.mjs';
import {createHuntSession} from '../src/hunt.mjs';
import {bankFlow} from '../src/physics.mjs';

test('purchases, independent slots, re-equipping and reload preserve currency and the existing wardrobe',()=>{
 const save=normalizeSave({coins:180,owned:['chalk','ember'],look:'ember'});assert.equal(buyEquipment(save,'holo-pack'),false);assert.equal(save.coins,180);assert.ok(buyEquipment(save,'courier'));assert.equal(save.coins,0);assert.ok(buyEquipment(save,'courier'));assert.equal(save.coins,0);
 const loaded=normalizeSave(JSON.parse(JSON.stringify(save)));assert.equal(loaded.look,'ember');assert.equal(loaded.loadout.backpack,'courier');assert.equal(loaded.loadout.trail,'none');assert.equal(loaded.loadout.tool,'none');assert.ok(loaded.ownedItems.includes('courier'));assert.ok(unequip(loaded,'backpack'));assert.equal(loaded.loadout.backpack,'outfit');assert.ok(loaded.ownedItems.includes('courier'));
 const bad=normalizeSave({ownedItems:['aurora','invalid'],loadout:{tool:'aurora',trail:'smoke',backpack:'courier'},huntLevel:-4});assert.equal(bad.loadout.tool,'none');assert.equal(bad.loadout.trail,'none');assert.equal(bad.loadout.backpack,'outfit');assert.equal(bad.huntLevel,1);assert.equal(EQUIPMENT.length,9);
});

test('rewards now favor completing hunts and cannot exceed the per-hunt flow cap',()=>{
 const w=createHuntSession(42);w.clock=20;assert.equal(Object.values(huntReward(w)).reduce((a,b)=>a+b),28);w.clock=90;w.stats.falls=2;w.hunt.lives=1;assert.equal(Object.values(huntReward(w)).reduce((a,b)=>a+b),18);
 for(let i=0;i<12;i++){w.chain=1086;bankFlow(w);}assert.equal(w.earnedCoins,6);assert.equal(w.chain,0);assert.equal(bankFlow(w),0);
});
