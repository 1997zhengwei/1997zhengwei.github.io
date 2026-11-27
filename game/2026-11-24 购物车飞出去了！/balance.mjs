// node balance.mjs [局数] —— 无尽连跳：三档机器人各跑 N 局，看能跳多少次、活多久、拿多少返现、怎么翻车的。
// 目标：新手约 1 分钟；熟练 2 分钟左右；高手能玩很久但最终也会翻（贪翻）。
import {startRun, step, G, DRIFT, spinRate, wrap, rankOf, currentRamp} from './rules.mjs';

const BOTS = [
  // greed：目标翻几圈（按空中时间够不够）；noise：判断落地角度的误差；react：反应间隔
  {name:'新手', greed:0, noise:.32, react:.14, late:.08, windSense:.3},
  {name:'熟练', greed:1, noise:.18, react:.1, late:.05, windSense:.6},
  {name:'高手', greed:2, noise:.09, react:.07, late:.03, windSense:.9},
];
function landTime(run) {
  const floor = 0, a = -G / 2, b = run.vy, c = run.y - floor;
  return (-b - Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
}
function play(bot, seed, cap = 600) {
  const run = startRun(seed);
  let s = seed ^ 0x5bd1e995; const rng = () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
  let hold = false, think = 0, aim = 0, bias = 0;
  while (run.phase !== 'crash' && run.time < cap) {
    if (run.phase === 'air') {
      if (run.airTime < 1 / 60 + 1e-9) { // 刚起跳：决定这跳翻几圈
        const t = landTime(run);
        const can = Math.floor((spinRate(run) * (t - .25) + DRIFT * 0) / (Math.PI * 2) + .1);
        aim = Math.max(0, Math.min(bot.greed, can)); bias = (rng() - .5) * 2 * bot.noise;
      }
      if ((think -= 1 / 60) <= 0) {
        think = bot.react;
        const t = landTime(run);
        const tt = Math.max(0, t - bot.late);
        const final = run.angle + (DRIFT + currentRamp(run).wind * bot.windSense) * tt + (run.av - DRIFT) / 5 * (1 - Math.exp(-5 * tt)) + bias;
        hold = final < aim * Math.PI * 2 - .12;
      }
    } else hold = false;
    step(run, 1 / 60, hold);
  }
  run.events.length = 0;
  return run;
}
const N = Number(process.argv[2] || 200);
const med = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
for (const bot of BOTS) {
  const runs = Array.from({length: N}, (_, k) => play(bot, 3000 + k * 7919));
  const ranks = {}; runs.forEach(r => ranks[rankOf(r.score)] = (ranks[rankOf(r.score)] || 0) + 1);
  const capped = runs.filter(r => r.phase !== 'crash').length;
  console.log(`${bot.name}: 时长中位 ${med(runs.map(r => r.time)).toFixed(0)}s  跳数中位 ${med(runs.map(r => r.jumps))}  返现中位 ¥${med(runs.map(r => r.score))}  翻圈中位 ${med(runs.map(r => r.flips))}  完美率 ${(runs.reduce((s, r) => s + r.perfects / Math.max(1, r.jumps), 0) / N * 100).toFixed(0)}%  未翻车 ${capped}`);
  console.log(`   第1跳就翻车 ${runs.filter(r => r.jumps === 0).length} 局  称号 ${JSON.stringify(ranks)}`);
}
