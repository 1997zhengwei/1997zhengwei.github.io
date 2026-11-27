import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Mill} from '../src/mill.mjs';

function memory(){
  let value=null;
  return {getItem:()=>value,setItem:(_key,data)=>{value=data;}};
}

function stockFirstOrder(mill){
  assert.equal(mill.start('inbound'),true);
  mill.step(8);
  assert.equal(mill.state.logs,6);
  for(let i=0;i<2;i++){
    assert.equal(mill.start('saw'),true);
    mill.step(7);
  }
  assert.equal(mill.state.planks,12);
}

test('pickup, transfer, and revenue happen at separate times and resume once after reload',()=>{
  const store=memory(), initial=new Mill(store);
  stockFirstOrder(initial);
  assert.equal(initial.estimate(),204);
  assert.equal(initial.start('dispatch'),true);
  initial.step(4.0);
  assert.equal(initial.state.jobs.dispatch.picked,6);
  assert.equal(initial.state.jobs.dispatch.done,0);
  assert.equal(initial.state.planks,6);
  assert.equal(initial.state.cash,85);
  initial.save();
  const resumed=new Mill(store);
  assert.equal(resumed.state.jobs.dispatch.picked,6);
  resumed.step(8);
  assert.equal(resumed.state.planks,0);
  assert.equal(resumed.state.trucks,1);
  assert.equal(resumed.state.shipped,12);
  assert.equal(resumed.state.cash,289);
  assert.equal(resumed.order.name,'谷仓修缮');
  new Mill(store).step(100);
  assert.equal(new Mill(store).state.cash,289);
});

test('sawmill pauses before overshooting capacity and a real expansion makes room',()=>{
  const mill=new Mill();
  stockFirstOrder(mill);
  mill.state.cash=300;
  for(let i=0;i<4;i++){assert.equal(mill.start('saw'),true);mill.step(7);}
  assert.equal(mill.state.planks,36);
  assert.equal(mill.state.peak,36);
  mill.start('inbound');mill.step(8);
  assert.equal(mill.start('saw'),false);
  assert.equal(mill.upgrade('yard'),true);
  assert.equal(mill.boardsCap,54);
  assert.equal(mill.start('saw'),true);
  mill.step(7);
  assert.equal(mill.state.planks,42);
});

test('automatic dispatch waits for a full truck while the mill can still make boards',()=>{
  const mill=new Mill();
  stockFirstOrder(mill);
  mill.state.cash=500;
  assert.equal(mill.hire('dispatch'),true);
  assert.equal(mill.hire('saw'),true);
  mill.step(.01);
  assert.ok(mill.state.jobs.dispatch);
  mill.step(5);
  assert.equal(mill.state.planks,6+mill.state.jobs.saw.done);
  mill.step(5);
  assert.equal(mill.state.shipped,12);
  assert.equal(mill.state.planks,6);
  assert.equal(mill.state.jobs.dispatch,null);
  mill.step(6.3);
  assert.equal(mill.state.jobs.dispatch.total,12);
});
