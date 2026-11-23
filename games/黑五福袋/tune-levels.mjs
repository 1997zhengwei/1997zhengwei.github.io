// node tune-levels.mjs —— 随机重启 + 贪心落位，估每关最优装法，给出建议过关线/三星线。
// 也统计「能达到三星线的不同商品组合」有几种，用来确认三星不止一条路。
import {products, levels, size, drop, total, capacity} from './packing.mjs';

let seed = 11;
const rnd = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
const TRIES = Number(process.argv[2] || 8000);

for (const [li, level] of levels.entries()) {
  const all = level.items.reduce((s, id) => s + products[id].value, 0);
  const cells = level.items.reduce((s, id) => s + products[id].w * products[id].h, 0);
  const results = [];
  for (let t = 0; t < TRIES; t++) {
    // 三种排序策略混着来：按单格价值、按重量、纯随机；再随机跳过一些商品
    const mode = t % 3;
    const order = [...level.items].sort((a, b) => {
      const A = products[a], B = products[b];
      if (mode === 0) return B.value / (B.w * B.h) - A.value / (A.w * A.h) + (rnd() - .5) * 30;
      if (mode === 1) return B.weight - A.weight + (rnd() - .5) * 2;
      return rnd() - .5;
    }).filter(() => rnd() > .12);
    let layout = [];
    for (const id of order) {
      const opts = [];
      for (const turned of products[id].w === products[id].h ? [false] : [false, true])
        for (let x = 0; x + size(id, turned).w <= level.w; x++) {
          const r = drop(layout, id, turned, x, level);
          if (r.layout && !r.broken.length) opts.push(r);
        }
      if (!opts.length) continue;
      opts.sort((a, b) => a.entry.y - b.entry.y + (rnd() - .5) * 1.5);
      layout = opts[0].layout.map(i => ({...i}));
    }
    results.push({v: total(layout), set: layout.map(i => i.id).sort().join(',')});
  }
  const best = Math.max(...results.map(r => r.v));
  const target = Math.round(best * .68 / 10) * 10, gold = Math.round(best * .94 / 10) * 10;
  const goldSets = new Set(results.filter(r => r.v >= gold).map(r => r.set));
  const curGold = new Set(results.filter(r => r.v >= level.gold).map(r => r.set));
  console.log(`${li + 1} ${level.name}: 容量${capacity(level)} 商品${cells}格(${Math.round(cells / capacity(level) * 100)}%) 全价¥${all} | 搜到最高¥${best} → 建议过关¥${target} 三星¥${gold}（${goldSets.size}种组合）| 现在 过关¥${level.target} 三星¥${level.gold}（${curGold.size}种组合）`);
}
