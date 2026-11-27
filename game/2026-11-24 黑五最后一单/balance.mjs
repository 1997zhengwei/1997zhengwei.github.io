// node balance.mjs [局数] —— 无尽模式：三档机器人各跑 N 局，看一局能撑多久、成交额多少、怎么输的。
// 目标：新手约 3 分钟；熟练 4–5 分钟；高手 6 分钟左右也会被人潮淹没（不能无限玩下去）。
import {startRun, tick, turn, peel, scan, payCard, giveChange, changeDue, changeCoins, currentItem, frontCustomer, rankOf} from './rules.mjs';

const BOTS = [
  {name:'新手', look:.75, tap:.42, drag:.75, peel:.6, miss:.25, wrong:.1, card:.7, cashThink:1.4, coin:.5, cashErr:.15, firstLook:.6},
  {name:'熟练', look:.45, tap:.32, drag:.55, peel:.4, miss:.08, wrong:.04, card:.5, cashThink:.9, coin:.38, cashErr:.05, firstLook:.4},
  {name:'高手', look:.28, tap:.24, drag:.4, peel:.3, miss:.02, wrong:.01, card:.35, cashThink:.55, coin:.28, cashErr:.01, firstLook:.25},
];
const CAP = 900;

function play(bot, seed) {
  const run = startRun(seed);
  let s = seed ^ 0x9e3779b9; const rng = () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
  const live = () => run.phase !== 'over' && run.time < CAP;
  const wait = t => { const n = Math.round(t * (.75 + rng() * .5) * 30); for (let i = 0; i < n && live(); i++) tick(run, 1 / 30); };
  let lastFront = -2;
  while (live()) {
    if (run.phase === 'idle') { wait(.2); continue; }
    if (run.front !== lastFront) { lastFront = run.front; wait(bot.firstLook); continue; }
    if (run.phase === 'scan') {
      const it = currentItem(run);
      wait(run.fever > 0 ? bot.look * .4 : bot.look);
      if (run.phase !== 'scan' || currentItem(run) !== it) continue;
      if (run.fever <= 0 && it.sticker && !it.peeled && rng() > bot.miss) { wait(bot.peel); if (currentItem(run) !== it) continue; peel(run); }
      if (run.fever <= 0 && rng() < bot.wrong && run.face !== 0) { wait(bot.drag); if (currentItem(run) === it) scan(run); continue; }
      while (live() && run.phase === 'scan' && currentItem(run) === it && run.face !== 0) {
        wait(bot.tap); if (currentItem(run) !== it) break;
        turn(run, run.face === 1 ? 'right' : 'left');
      }
      if (currentItem(run) !== it) continue;
      wait(run.fever > 0 ? bot.drag * .7 : bot.drag); if (currentItem(run) === it && run.phase === 'scan') scan(run);
    } else if (run.phase === 'pay') {
      const c = frontCustomer(run);
      if (!c.bill) { wait(bot.card); if (frontCustomer(run) === c && run.phase === 'pay') payCard(run); continue; }
      wait(bot.cashThink);
      if (frontCustomer(run) !== c || run.phase !== 'pay') continue;
      const coins = changeCoins(changeDue(run));
      if (rng() < bot.cashErr) coins.unshift(changeDue(run) >= 20 ? 50 : 20);
      for (const v of coins) { if (frontCustomer(run) !== c || run.phase !== 'pay') break; wait(bot.coin); if (frontCustomer(run) !== c || run.phase !== 'pay') break; if (giveChange(run, v) === 'over') break; }
    }
  }
  run.events.length = 0;
  return run;
}

const N = Number(process.argv[2] || 200);
for (const bot of BOTS) {
  const runs = Array.from({length: N}, (_, k) => play(bot, 5000 + k * 7919));
  const med = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
  const time = runs.map(r => r.time), gmv = runs.map(r => r.gmv), served = runs.map(r => r.served);
  const reasons = {}; runs.forEach(r => r.strikeLog.forEach(x => reasons[x.reason] = (reasons[x.reason] || 0) + 1));
  const capped = runs.filter(r => r.time >= CAP).length;
  const ranks = {}; runs.forEach(r => ranks[rankOf(r.gmv)] = (ranks[rankOf(r.gmv)] || 0) + 1);
  const fev = med(runs.map(r => r.fevers));
  console.log(`${bot.name}: 爆单中位 ${fev} 次  时长中位 ${med(time).toFixed(0)}s (最短 ${Math.min(...time).toFixed(0)} 最长 ${Math.max(...time).toFixed(0)}, 撑满${CAP}s ${capped}局) 成交额中位 ¥${med(gmv)} 接待中位 ${med(served)}`);
  console.log(`   差评来源 ${JSON.stringify(reasons)}  称号 ${JSON.stringify(ranks)}`);
}
