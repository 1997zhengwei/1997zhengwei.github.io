import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, hazardX, scoreOf, LEVELS, HAZ_W, gateBounds, gateResult } from '../src/game.mjs';
import { play } from '../tools/calib.mjs';

// 简单自动玩家：选好门（滑动门按到达时刻的位置）、追羽毛和丰收角、躲所有危险
function bot(s) {
  const ahead = s.items.filter((it) => !s.taken.has(it.id) && it.d > s.d && it.d < s.d + 14);
  let tx = s.x;
  const gs = ahead.filter((it) => it.type === 'gate'); const gate = gs.length ? gs.filter((g) => g.d === gs[0].d).sort((a, b) => gateResult(s.feathers.length, b) - gateResult(s.feathers.length, a))[0] : null;
  const fe = ahead.find((it) => ['feather', 'horn', 'cage', 'corn', 'ramp'].includes(it.type));
  if (gate && gate.d < s.d + 10) { const [a, b] = gateBounds(gate, s.t + (gate.d - s.d) / s.speed); tx = (a + b) / 2; }
  else if (fe) tx = fe.x;
  const hz = ahead.filter((it) => HAZ_W[it.type] && it.d < s.d + 6);
  for (let k = 0; k < 3; k++) {
    const bad = hz.find((h) => Math.abs(hazardX(h, s.t + (h.d - s.d) / s.speed) - tx) < HAZ_W[h.type] + 0.45);
    if (!bad) break;
    const cands = [-2.4, -1.2, 0, 1.2, 2.4].filter((c) => hz.every((h) => Math.abs(hazardX(h, s.t + (h.d - s.d) / s.speed) - c) > HAZ_W[h.type] + 0.45));
    if (cands.length) tx = cands.sort((a, b) => Math.abs(a - s.x) - Math.abs(b - s.x))[0];
    break;
  }
  return { targetX: tx };
}

for (const L of LEVELS) {
  test(`第 ${LEVELS.indexOf(L) + 1} 关「${L.name}」机器人能跑完且 ★≥2`, () => {
    const s = createRun(L);
    let hits = 0;
    for (let i = 0; i < 60 * 80 && s.state === 'run'; i++) { step(s, bot(s), 1 / 60); hits += s.events.filter((e) => e.e === 'hit').length; }
    assert.equal(s.state, 'done');
    assert.ok(s.result.stars >= 2, `★${s.result.stars} 总分 ${s.result.total} 羽毛 ${s.result.n} 被撞 ${hits}`);
    console.log(`  ${L.name}: ★${s.result.stars} ${s.result.total} 分, ${s.result.n} 根, 被撞 ${hits} 次`);
  });
  test(`第 ${LEVELS.indexOf(L) + 1} 关不动也能走完`, () => {
    const s = createRun(L);
    for (let i = 0; i < 60 * 80 && s.state === 'run'; i++) step(s, { targetX: 0 }, 1 / 60);
    assert.equal(s.state, 'done');
  });
}

test('丰收角一次给 6 根不同颜色', () => {
  const s = createRun(LEVELS[1]);
  const h = s.items.find((it) => it.type === 'horn');
  s.d = h.d - 0.05; s.x = h.x; s.targetX = h.x;
  step(s, { targetX: h.x }, 1 / 60);
  assert.equal(s.feathers.length, 6);
  assert.equal(new Set(s.feathers).size, 6);
});

test('不动也能走完，但分数低', () => {
  const s = createRun(3);
  for (let i = 0; i < 60 * 60 && s.state === 'run'; i++) step(s, { targetX: 0 }, 1 / 60);
  assert.equal(s.state, 'done');
});

test('门的加减乘除', () => {
  const s = createRun(3);
  s.feathers = ['red', 'red', 'gold', 'gold', 'teal', 'teal'];
  const g = s.items.find((it) => it.type === 'gate');
  s.x = (g.x0 + g.x1) / 2; s.targetX = s.x; s.d = g.d - 0.05;
  const before = s.feathers.length;
  step(s, { targetX: s.x }, 1 / 60);
  const exp = g.op === '+' ? before + g.v : g.op === '-' ? before - g.v : g.op === 'x' ? before * g.v : Math.floor(before / g.v);
  assert.equal(s.feathers.length, exp);
});

test('颜色越多分越高', () => {
  const a = scoreOf(Array(30).fill('red'));
  const b = scoreOf(['red', 'orange', 'gold', 'teal', 'purple', 'rainbow'].flatMap((c) => Array(5).fill(c)));
  assert.ok(b.total > a.total);
});

test('难度梯度：高手羽毛数逐关递增，手残星级逐关下降', () => {
  const avg = (L, sk, f) => { let v = 0; for (let k = 0; k < 6; k++) v += f(play(L, sk, 5 + k * 11)); return v / 6; };
  const hi = LEVELS.map((L) => avg(L, 1, (s) => s.result.n));
  for (let i = 1; i < hi.length; i++) assert.ok(hi[i] > hi[i - 1], `第${i + 1}关高手羽毛 ${hi[i]} 不多于上一关 ${hi[i - 1]}`);
  const lo = LEVELS.map((L) => avg(L, 0.3, (s) => s.result.stars));
  assert.ok(lo[5] < lo[0] - 0.5 && lo[9] < lo[0] - 0.5, `手残星级 ${lo.map((v) => v.toFixed(1)).join(',')}`);
  console.log('  高手羽毛', hi.map((v) => v.toFixed(0)).join(' → '), ' 手残星', lo.map((v) => v.toFixed(1)).join(' → '));
});

test('评分不封顶：被撞、选错门、漏羽毛都会扣台风分', () => {
  const f = ['red', 'orange', 'gold', 'teal', 'purple', 'rainbow'].flatMap((c) => Array(20).fill(c));
  const clean = scoreOf(f, 100, { hits: 0, gates: 5, goodGates: 5, got: 90, avail: 90 });
  const messy = scoreOf(f, 100, { hits: 2, gates: 5, goodGates: 3, got: 60, avail: 90 });
  assert.ok(clean.total > messy.total + 3);
  assert.ok(clean.judges[2] === 10 && messy.judges[2] < 7);
  assert.ok(scoreOf(f, 60).judges[0] > scoreOf(f, 150).judges[0], '同样羽毛，后面关卡尾屏分更低');
});

test('跳台：踩上去腾空，能吃到空中羽毛、飞过地面危险', () => {
  const L = LEVELS.find((l) => l.id === 'float');
  const s = createRun(L);
  const r = s.items.find((it) => it.type === 'ramp');
  s.d = r.d - 0.3; s.x = r.x; s.targetX = r.x; s.vx = 0;
  const before = s.feathers.length;
  for (let i = 0; i < 70; i++) step(s, { targetX: r.x }, 1 / 60);
  assert.ok(s.stats.jumps === 1 && s.stats.hits === 0, `跳${s.stats.jumps} 撞${s.stats.hits}`);
  assert.ok(s.feathers.length - before >= 6, `空中羽毛 ${s.feathers.length - before}`);
});

test('笼子伙伴替你挡危险；终点每只伙伴送 3 根', () => {
  const s = createRun(LEVELS.find((l) => l.id === 'rescue'));
  const c = s.items.find((it) => it.type === 'cage');
  s.d = c.d - 0.05; s.x = c.x; s.targetX = c.x;
  step(s, { targetX: c.x }, 1 / 60);
  assert.equal(s.friends, c.n);
  s.feathers = Array(40).fill('gold');
  const h = s.items.find((it) => it.type === 'scissors' || it.type === 'pumpkin' || it.type === 'chef');
  const hx = hazardX(h, s.t); s.d = h.d - 0.05; s.x = hx; s.targetX = hx; s.hitCD = 0;
  step(s, { targetX: hx }, 1 / 60);
  assert.equal(s.feathers.length, 40, '有伙伴时羽毛不掉');
  assert.ok(s.friends < c.n);
});

test('大厨追击：不吃玉米会被追上，吃玉米能拉开距离', () => {
  const L = LEVELS.find((l) => l.id === 'escape');
  const idle = createRun(L);
  for (let i = 0; i < 60 * 40 && idle.state === 'run'; i++) step(idle, { targetX: 0 }, 1 / 60);
  assert.ok(idle.stats.caught >= 1, '站着不动应被追上');
  const s = createRun(L);
  const g0 = s.chase.gap; s.boostT = 1.4;
  for (let i = 0; i < 60; i++) step(s, { targetX: s.x }, 1 / 60);
  assert.ok(s.chase.gap > g0 + 3);
});

test('肉汁打滑：同样的操作横向移动更慢、带惯性', () => {
  const s = createRun(LEVELS.find((l) => l.id === 'table'));
  const z = s.zones[0];
  s.d = z.d + 1; s.x = 0; s.vx = 0;
  for (let i = 0; i < 15; i++) step(s, { targetX: 2 }, 1 / 60);
  const slipX = s.x;
  const n = createRun(LEVELS[0]); n.d = 5;
  for (let i = 0; i < 15; i++) step(n, { targetX: 2 }, 1 / 60);
  assert.ok(slipX < n.x * 0.6, `打滑 ${slipX.toFixed(2)} vs 正常 ${n.x.toFixed(2)}`);
});
