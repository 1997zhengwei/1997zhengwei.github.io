import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createState,start,tick,purchase,addCash,requestExpansion,cancelExpansion,upgradeCost,loadState,saveState,hallDoor} from '../src/simulation.mjs';
import {FILMS,FILM_BY_ID,seatsLayout,HALLS} from '../src/data.mjs';
const advance=(s,seconds)=>{for(let i=0;i<seconds*10;i++)tick(s,.1);};
function occupied(){const s=createState();start(s);advance(s,3);assert.ok(s.guests.some(g=>g.hall===0));return s;}
function moneyBalances(s){assert.equal(s.cash,180+s.earned-s.spent);assert.ok(s.cash>=0);assert.ok(s.spent>=0);}

test('有观众时可预约，只预付一次，不挪动座位或额外售票，之后自动清洁扩容并营业',()=>{
 const s=occupied(),h=s.halls[0],tickets=s.stats.tickets,cash=s.cash,cost=upgradeCost(s,'seats',0);
 assert.deepEqual(requestExpansion(s,0),{ok:true,cost,queued:true});
 assert.equal(s.cash,cash-cost);assert.equal(h.accepting,false);assert.equal(h.seats,1);
 assert.equal(requestExpansion(s,0).ok,false);assert.equal(purchase(s,'seats',0).ok,false);assert.equal(s.cash,cash-cost);
 s.player={x:0,z:35};let done=false,completionCount=0;
 for(let i=0;i<2400;i++){tick(s,.1);moneyBalances(s);
  if(h.pendingExpansion){assert.equal(s.stats.tickets,tickets);assert.equal(h.seats,1);}
  for(const e of s.events){if(e.type!=='expanded')continue;completionCount++;done=true;
   assert.equal(h.seats,2);assert.equal(h.accepting,true);assert.equal(h.phase,'boarding');
   const d=HALLS[0];assert.ok(!s.guests.some(g=>g.hall===0&&Math.abs(g.x-d.x)<8.7&&Math.abs(g.z-d.z)<10.6));
  }s.events=[];if(done)break;
 }
 assert.ok(done);assert.equal(s.stats.shows,1);assert.equal(s.stats.cleaned,1);assert.equal(s.stats.upgrades,1);
 assert.equal(s.spent,cost);assert.equal(completionCount,1);assert.equal(h.pendingExpansion,null);
 s.player={x:-9,z:23.4};advance(s,15);assert.ok(s.stats.tickets>tickets);assert.equal(h.seats,2);
});

test('空厅立即扩容；资金不足、未开放和满席配置不会扣款',()=>{
 const s=createState();assert.equal(requestExpansion(s,1).ok,false);assert.equal(s.cash,180);
 assert.equal(requestExpansion(s,0).queued,false);assert.equal(s.halls[0].seats,2);assert.equal(s.cash,40);
 assert.equal(requestExpansion(s,0).ok,false);assert.equal(s.cash,40);
 s.halls[0].seats=6;assert.equal(requestExpansion(s,0).ok,false);assert.equal(s.cash,40);moneyBalances(s);
});

test('取消预约原额退款并恢复原来的售票设置，不增加收入、不发升级奖励',()=>{
 const s=occupied(),h=s.halls[0];h.accepting=false;const before={cash:s.cash,earned:s.earned,spent:s.spent,upgrades:s.stats.upgrades};
 const result=requestExpansion(s,0);assert.equal(result.ok,true);assert.equal(cancelExpansion(s,0).refund,result.cost);
 for(const [k,v]of Object.entries(before))assert.equal(k==='upgrades'?s.stats.upgrades:s[k],v);
 assert.equal(h.accepting,false);assert.equal(h.seats,1);assert.equal(cancelExpansion(s,0).ok,false);moneyBalances(s);
});

test('预约及施工进度刷新后继续，资金不再扣，完成后也不会重复扩容',()=>{
 let s=occupied();requestExpansion(s,0);const prepaid=s.spent;s=loadState(saveState(s));
 assert.equal(s.spent,prepaid);assert.ok(s.halls[0].pendingExpansion);assert.equal(s.halls[0].accepting,false);
 s.player={x:0,z:35};for(let i=0;i<2400&&!(s.halls[0].pendingExpansion?.progress>0);i++)tick(s,.1);
 assert.ok(s.halls[0].pendingExpansion.progress>0);const progress=s.halls[0].pendingExpansion.progress,cash=s.cash;
 s=loadState(saveState(s));assert.equal(s.cash,cash);assert.equal(s.halls[0].pendingExpansion.progress,progress);
 advance(s,8);assert.equal(s.halls[0].seats,2);assert.equal(s.halls[0].accepting,true);assert.equal(s.spent,prepaid);
 s=loadState(saveState(s));advance(s,20);assert.equal(s.halls[0].seats,2);assert.equal(s.stats.upgrades,1);moneyBalances(s);
});

test('在等待清洁时预约，无保洁员、经理不在场也可自动整理与扩建',()=>{
 const s=createState();start(s);advance(s,190);assert.equal(s.halls[0].phase,'cleaning');
 s.player={x:0,z:35};assert.equal(requestExpansion(s,0).queued,true);advance(s,15);
 assert.equal(s.halls[0].seats,2);assert.equal(s.halls[0].phase,'boarding');assert.equal(s.stats.cleaned,1);assert.equal(s.staff.cleaner,0);moneyBalances(s);
});

test('单厅预约不影响其他厅接待，保洁员不会与改造团队争用同一影厅',()=>{
 const s=createState();addCash(s,20000,'test-setup');purchase(s,'hall',1);purchase(s,'hall',2);
 for(const role of ['ticket','runner','cleaner'])purchase(s,'staff',role);start(s);advance(s,4);
 assert.ok(s.guests.some(g=>g.hall===0));assert.equal(requestExpansion(s,0).queued,true);s.player={x:0,z:35};
 let otherTickets=0,finished=false;
 for(let i=0;i<2400;i++){tick(s,.1);if(s.halls[0].pendingExpansion){otherTickets+=s.events.filter(e=>e.type==='ticket'&&e.hall!==0).length;assert.notEqual(s.workers.cleaner.target,0);}
  if(s.events.some(e=>e.type==='expanded'))finished=true;s.events=[];moneyBalances(s);if(finished)break;
 }
 assert.ok(finished);assert.ok(otherTickets>0);assert.equal(seatsLayout(s.halls[0].seats).capacity,16);
});

test('六部电影对应六张真实独立素材，旧版已授权影片 ID 和排片继续保留',()=>{
 assert.equal(new Set(FILMS.map(f=>f.asset)).size,6);
 const hashes=FILMS.map(f=>{const bytes=readFileSync(new URL('../assets/films/'+f.asset,import.meta.url));assert.equal(bytes.subarray(1,4).toString(),'PNG');return createHash('sha256').update(bytes).digest('hex');});
 assert.equal(new Set(hashes).size,6);
 const s=createState();s.ownedFilms=FILMS.map(f=>f.id);s.halls[0].film=s.halls[0].nextFilm='moon2';const loaded=loadState(saveState(s));
 assert.deepEqual(loaded.ownedFilms,s.ownedFilms);assert.equal(loaded.halls[0].film,'moon2');assert.equal(FILM_BY_ID[loaded.halls[0].film].name,'珊瑚奇遇');
});
