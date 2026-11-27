// 给每关挑一个赛道种子：让高手的羽毛数逐关递增（接近 target），且普通/手残玩家明显更少
import { LEVELS, createRun } from '../src/game.mjs';
import { play } from './calib.mjs';

const TARGET = { farm: 70, pumpkin: 100, bog: 130, town: 160, fair: 195, gala: 225, float: 250, table: 265, rescue: 280, escape: 295 };
// 各关新玩法至少出现几次
const REQ = { float: { ramp: 4 }, table: { zone: 3, fork: 8 }, rescue: { cage: 4 }, escape: { zone: 2, cage: 1, ramp: 2, corn: 5 } };
const ONLY = process.argv[2] ? process.argv[2].split(',') : null;
for (const L0 of LEVELS.filter((l) => !ONLY || ONLY.includes(l.id))) {
  const res = [];
  for (let seed = 1; seed <= 160; seed++) {
    const L = { ...L0, seed };
    const s0 = createRun(L);
    const gates = s0.items.filter((i) => i.type === 'gate').length / 2;
    if (gates < 5) continue;
    const cnt = {}; s0.items.forEach((i) => (cnt[i.type] = (cnt[i.type] || 0) + 1));
    if (Object.entries(REQ[L0.id] || {}).some(([k, v]) => (cnt[k] || 0) < v)) continue;
    const avg = (sk) => { let n = 0; for (let k = 0; k < 4; k++) n += play(L, sk, 3 + k * 17).result.n; return n / 4; };
    const hi = avg(1), lo = avg(0.3);
    const err = Math.abs(hi - TARGET[L.id]) / TARGET[L.id] + Math.max(0, lo / hi - 0.75);
    res.push({ seed, hi, lo, gates, err });
  }
  res.sort((a, b) => a.err - b.err);
  console.log(L0.id, 'target', TARGET[L0.id], res.slice(0, 4).map((r) => `seed${r.seed}: 高手${r.hi.toFixed(0)} 手残${r.lo.toFixed(0)} 门${r.gates}`).join(' | '));
}
