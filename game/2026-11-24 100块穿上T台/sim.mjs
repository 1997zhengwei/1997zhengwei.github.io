// node sim.mjs —— 用机器人跑 8 夜，看每夜星级分布是否“新手能过、老手能三星”。
import {CATS, NIGHTS, buildNight, createMarket, take, totals, scoreRun, stylePoints} from './rules.js';

function evaluate(night, bag) {
  const t = totals(night, bag);
  if (!t.ok) return -1;
  return stylePoints(night, bag) + Math.min(20, Math.round(t.saved / 2.5));
}
function cheapestFill(night, m, bag) {
  const trial = {...bag};
  for (const c of CATS) {
    if (trial[c]) continue;
    const options = m.items.filter(i => i.cat === c && i.stock > 0).sort((a, b) => a.price - b.price);
    if (options[0]) trial[c] = {item: options[0], paid: options[0].price};
  }
  return trial;
}
// 拿了这件后，用最便宜的补齐还能不超预算吗？
function feasible(night, m, bag, item) {
  const trial = {...bag, [item.cat]: {item, paid: m.flash?.item === item ? item.flashPrice : item.price}};
  return totals(night, cheapestFill(night, m, trial)).pay <= night.budget;
}

function play(index, seed, skill) {
  const night = buildNight(index);
  let s = seed;
  const rng = () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
  const m = createMarket(night, rng);
  const bag = {};
  const react = skill === 'pro' ? .6 : 1.3;
  let cool = skill === 'pro' ? 1.2 : 2.2;
  const dt = 1 / 30;
  const waitUntil = skill === 'pro' ? night.time * .45 : night.time;
  while (m.left() > 0) {
    m.tick(dt, bag);
    cool -= dt;
    if (cool > 0) continue;
    cool = react;
    const t = totals(night, bag);
    const current = evaluate(night, bag);
    // 新手：看「完美」角标先拿，其次风格对的，超预算就换便宜的；一凑齐就结账
    if (skill === 'novice') {
      const empty = CATS.find(c => !bag[c]);
      if (empty) {
        const options = m.items.filter(i => i.cat === empty && i.stock > 0)
          .sort((a, b) => (b.kind === 'perfect') - (a.kind === 'perfect') || (b.vibe === night.vibe) - (a.vibe === night.vibe) || a.price - b.price);
        if (options[0]) take(m, bag, options[0]);
        continue;
      }
      if (!t.ok) {
        // 超预算：试每一种「换一件」，挑换完不超预算里造型分最高的；都不行就换降价最多的
        let pick = null, pickScore = -1, fallback = null, drop = 0;
        for (const it of m.items) {
          if (it.stock <= 0 || bag[it.cat]?.item === it) continue;
          const trial = {...bag, [it.cat]: {item: it, paid: m.flash?.item === it ? it.flashPrice : it.price}};
          const tt = totals(night, trial);
          if (tt.ok && stylePoints(night, trial) > pickScore) { pick = it; pickScore = stylePoints(night, trial); }
          if (t.pay - tt.pay > drop) { drop = t.pay - tt.pay; fallback = it; }
        }
        if (pick || fallback) take(m, bag, pick || fallback);
        continue;
      }
      break;
    }
    // 老手：闪购优先，空格子按“能补齐”的最好单品拿，满了等闪购升级
    let best = null, bestScore = current;
    for (const item of m.items) {
      if (item.stock <= 0 || bag[item.cat]?.item === item) continue;
      if (!feasible(night, m, bag, item)) continue;
      const trial = {...bag, [item.cat]: {item, paid: m.flash?.item === item ? item.flashPrice : item.price}};
      const full = cheapestFill(night, m, trial);
      const score = evaluate(night, full) + (bag[item.cat] ? 0 : 30);
      const base = evaluate(night, cheapestFill(night, m, bag)) + 0;
      if (score > Math.max(bestScore, base) + (bag[item.cat] ? 1 : -99)) { best = item; bestScore = score; }
    }
    if (best) { take(m, bag, best); continue; }
    if (t.count === 3 && t.ok && m.t >= waitUntil) break;
  }
  const left = Math.max(0, m.left());
  const t = totals(night, bag);
  if (!t.ok) return {stars: 0, total: 0, fail: true};
  return scoreRun(night, bag, left);
}

for (let i = 0; i < NIGHTS.length; i++) {
  const line = [`第${i + 1}夜`];
  for (const skill of ['novice', 'pro']) {
    const stars = [0, 0, 0, 0];
    let sum = 0, fails = 0, styleSum = 0, saveSum = 0;
    const N = 400;
    for (let k = 0; k < N; k++) {
      const r = play(i, 9000 + k * 31, skill);
      stars[r.stars]++;
      sum += r.total;
      if (r.fail) fails++;
      else { styleSum += r.style; saveSum += r.save; }
    }
    line.push(`${skill}: 均分${(sum / N).toFixed(0)} 风格${(styleSum / (N - fails || 1)).toFixed(0)} 省钱${(saveSum / (N - fails || 1)).toFixed(0)} 失败${fails} 星[0/1/2/3]=${stars.join('/')}`);
  }
  console.log(line.join(' | '));
}
const n0 = buildNight(0);
for (const c of CATS) console.log(c, n0.rows[c].map(i => `${i.name}(${i.kind})¥${i.price}`).join(' '));
