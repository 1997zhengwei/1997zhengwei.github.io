import test from 'node:test';
import assert from 'node:assert/strict';
import {Company,REGIONS} from '../src/empire.mjs';

function memory(){
  const values=new Map();
  return {getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
}

function execute(company,mill,station){
  assert.equal(mill.start(station),true,`${mill.region.id} starts ${station}`);
  company.step(mill.state.jobs[station].duration);
}

function deliverTo(company,mill,target){
  while(mill.state.shipped<target){
    if(mill.state.planks>=mill.truckCap){
      execute(company,mill,'dispatch');
    }else if(mill.finish&&mill.state.rough>=mill.finish.ratio){
      execute(company,mill,'finish');
    }else{
      if(!mill.state.logs)execute(company,mill,'inbound');
      execute(company,mill,'saw');
    }
  }
}

test('an unmodified start can fund and unlock all four sites through shipped goods',()=>{
  const storage=memory(),company=new Company(storage),pine=company.mill;
  assert.equal(company.open('river'),null);
  assert.equal(company.open('ridge'),null);
  deliverTo(company,pine,12);
  assert.equal(company.cash,289);
  assert.equal(company.nextSite.id,'river');
  const river=company.open('river');
  assert.equal(company.cash,49);
  assert.equal(company.open('river'),river);
  assert.equal(company.cash,49);
  assert.equal(company.open('redwood'),null);
  assert.equal(river.state.logs,4);
  deliverTo(company,river,48);
  // Complete the next order to raise capital for the third site.
  while(company.cash<1850)deliverTo(company,river,river.state.shipped+12);
  const redwood=company.open('redwood');
  assert.equal(redwood.region.product,'精刨板');
  deliverTo(company,redwood,84);
  while(company.cash<5600)deliverTo(company,redwood,redwood.state.shipped+12);
  const ridge=company.open('ridge');
  assert.equal(ridge.region.product,'承重木梁');
  deliverTo(company,ridge,24);
  assert.equal(company.badges().filter(b=>b.value>=b.total).length,6);
  assert.equal(company.title,'四地木业大亨');
  company.select('ridge');
  const reloaded=new Company(storage);
  assert.equal(reloaded.active,'ridge');
  assert.equal(reloaded.cash,company.cash);
  assert.equal(reloaded.mill.state.rough,ridge.state.rough);
  assert.equal(reloaded.shipped,company.shipped);
  assert.equal(reloaded.sites.size,4);
});

test('old staff, inventory, and paid/unpaid trucks migrate while background staff keep working',()=>{
  const storage=memory();
  const previous={version:1,cash:300,firstSeen:true,sound:false,logs:5,planks:12,shipped:12,sawn:5,contract:1,peak:24,
    levels:{inbound:2,saw:1,dispatch:1,yard:2},crew:{inbound:true},jobs:{dispatch:{elapsed:4,duration:9.2,total:6,picked:6,done:0,loadFrom:17}}};
  storage.setItem('pine-ridge-mill-v1',JSON.stringify(previous));
  const company=new Company(storage),pine=company.mill;
  assert.equal(company.sound,false);
  assert.equal(company.cash,300);
  assert.equal(pine.state.levels.yard,2);
  const river=company.open('river');
  company.select('river');
  assert.equal(company.cash,60);
  company.step(10);
  assert.equal(company.cash,150);
  assert.equal(pine.state.planks,12);
  assert.ok(pine.state.jobs.inbound);
  assert.equal(river.state.logs,4);
  const restored=new Company(storage);
  restored.step(10);
  assert.equal(restored.cash,150);
  assert.equal(restored.sites.get('pine').state.shipped,18);
  assert.equal(JSON.parse(storage.getItem('pine-ridge-mill-v1')).cash,300);
});

test('two rough boards make one beam and output resumes exactly once after save',()=>{
  const storage=memory(),company=new Company(storage);
  const ridge=company.add(REGIONS[3],null);
  execute(company,ridge,'saw');
  assert.equal(ridge.state.rough,6);
  assert.equal(ridge.state.planks,0);
  assert.equal(ridge.start('dispatch'),false);
  assert.equal(ridge.start('finish'),true);
  const job=ridge.state.jobs.finish;
  assert.equal(job.total,3);
  assert.equal(ridge.state.rough,0);
  company.step(job.duration*.75);
  assert.equal(ridge.state.planks,1);
  const resumed=new Company(storage).sites.get('ridge');
  resumed.step(job.duration);
  assert.equal(resumed.state.planks,3);
  assert.equal(resumed.state.refined,3);
  assert.equal(resumed.state.rough,0);
});

test('the park appends a working plot after the base four and preserves later factories on reload',()=>{
  const storage=memory(),company=new Company(storage);
  for(const region of REGIONS.slice(1))company.add(region,null);
  company.cash=80000;
  const ridge=company.sites.get('ridge');
  const fifth=company.nextPlot;
  assert.equal(fifth.id,'annex-5');
  assert.equal(company.open(fifth.id),null);
  deliverTo(company,ridge,36);
  assert.equal(company.nextSite.id,fifth.id);
  assert.equal(company.open('annex-6'),null);
  const before=company.cash;
  const annex=company.open(fifth.id);
  assert.equal(company.cash,before-fifth.cost);
  assert.equal(company.open(fifth.id),annex);
  assert.equal(company.cash,before-fifth.cost);
  assert.equal(company.nextPlot.id,'annex-6');
  deliverTo(company,annex,company.nextPlot.from);
  const sixth=company.open(company.nextPlot.id);
  assert.equal(sixth.finish.id,'kiln');
  company.select(sixth.region.id);
  execute(company,sixth,'saw');
  execute(company,sixth,'finish');
  const loaded=new Company(storage);
  assert.equal(loaded.mill.state.planks,6);
  assert.equal(loaded.sites.get(fifth.id).state.shipped,annex.state.shipped);
  assert.equal(loaded.nextPlot.id,'annex-7');
  assert.equal(loaded.title,'工业园拓建者');
});
