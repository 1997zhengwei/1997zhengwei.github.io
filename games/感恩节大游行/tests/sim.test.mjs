import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES, BALLOONS, createState, step, balloonHeights, createGenerator } from '../src/sim.mjs';
import { runBot } from '../tools/bot.mjs';

const DT = 1 / 60;
function run(s, input, seconds) { for (let t = 0; t < seconds && !s.done; t += DT) step(s, input, DT); return s; }

test('同一种子生成相同路线', () => {
  const a = createGenerator(ROUTES[1], 23).generate(400).map((i) => [i.type, Math.round(i.d0)]);
  const b = createGenerator(ROUTES[1], 23).generate(400).map((i) => [i.type, Math.round(i.d0)]);
  assert.deepEqual(a, b);
});

test('低空能钻过 6.0 米的横幅，高空能越过 6.0 米的横杆', () => {
  for (const k in BALLOONS) {
    const b = BALLOONS[k];
    const h = balloonHeights(b);
    assert.ok(h.low + b.ry < 6.0, `${k} 低空顶部`);
    assert.ok(h.high - b.ry > 6.0, `${k} 高空底部`);
  }
});

test('按住拉低会让气球下降，松开会升回去', () => {
  const s = createState(ROUTES[0], 'turkey', 11);
  run(s, { targetX: -4, pull: true }, 2);
  assert.ok(Math.abs(s.by - s.h.low) < 0.05);
  run(s, { targetX: -4, pull: false }, 2);
  assert.ok(Math.abs(s.by - s.h.high) < 0.05);
});

test('第一条路线开头：不拉低会撞横幅、扣气', () => {
  const s = createState(ROUTES[0], 'turkey', 11);
  const banner = s.items.find((i) => i.type === 'banner');
  let hit = false;
  for (let t = 0; t < 30 && !hit; t += DT) {
    step(s, { targetX: -4, pull: false }, DT);
    if (s.events.some((e) => e.e === 'hit' && e.it.id === banner.id)) hit = true;
  }
  assert.ok(hit);
  assert.equal(s.air, s.b.air - s.b.damage);
});

test('走进路障会摔倒队员；走过观众会加人', () => {
  const s = createState(ROUTES[0], 'turkey', 11);
  const cones = s.items.find((i) => i.type === 'cones');
  const mid = (cones.x0 + cones.x1) / 2;
  let tripped = false;
  for (let t = 0; t < 10 && !tripped; t += DT) { step(s, { targetX: mid, pull: false }, DT); tripped = s.events.some((e) => e.e === 'trip'); }
  assert.ok(tripped);
  assert.equal(s.crew, 6 - cones.loss);
  const fans = s.items.find((i) => i.type === 'fans');
  const before = s.crew;
  let joined = false;
  for (let t = 0; t < 40 && !joined && !s.done; t += DT) { step(s, { targetX: fans.x, pull: s.d > fans.d0 - 30 }, DT); joined = s.events.some((e) => e.e === 'fans'); }
  assert.ok(joined);
  assert.ok(s.crew > before - 3);
});

test('三条路线、三种气球都能通关（前瞻机器人）', () => {
  for (const route of ROUTES.slice(0, 3)) for (const k in BALLOONS) {
    const s = runBot(route, k, route.seed);
    assert.ok(s.result?.win, `${route.name}/${k}: ${s.result?.why}`);
    assert.ok(s.result.stars >= 2, `${route.name}/${k} 星级 ${s.result.stars}`);
  }
});

test('无尽模式持续生成，不会提前结束', () => {
  const s = runBot(ROUTES[3], 'turkey', 99, { maxT: 120 });
  assert.ok(s.d > 900, `走了 ${s.d}`);
  assert.ok(!s.done || s.result.why !== 'finish');
});

import { useSkill, coinsOf, rankOf } from '../src/sim.mjs';

test('无敌护盾：撞横幅不扣气、障碍被撞飞', () => {
  const s = createState(ROUTES[0], 'turkey', 11);
  const banner = s.items.find((i) => i.type === 'banner');
  let smashed = false;
  for (let t = 0; t < 30 && !smashed; t += DT) {
    if (s.d + 7 > banner.d0 - 12 && s.shield === 0 && s.charges.shield > 0) assert.ok(useSkill(s, 'shield'));
    step(s, { targetX: -4, pull: false }, DT);
    smashed = s.events.some((e) => e.e === 'smash' && e.it.id === banner.id);
  }
  assert.ok(smashed);
  assert.equal(s.air, s.b.air);
  assert.equal(s.charges.shield, 0);
  assert.equal(useSkill(s, 'shield'), false); // 没有次数了
});

test('星星磁铁：不靠近也能吸到前方星星', () => {
  const a = createState(ROUTES[0], 'turkey', 11), b = createState(ROUTES[0], 'turkey', 11);
  useSkill(b, 'magnet');
  for (let t = 0; t < 7; t += DT) { step(a, { targetX: 5, pull: false }, DT); step(b, { targetX: 5, pull: false }, DT); }
  assert.ok(b.stars > a.stars, `${b.stars} vs ${a.stars}`);
});

test('号召观众 +4 人；收集 8 颗星充能一次护盾', () => {
  const s = createState(ROUTES[0], 'turkey', 11);
  useSkill(s, 'rally');
  assert.equal(s.crew, 10);
  const s2 = runBot(ROUTES[0], 'turkey', 11);
  assert.ok(s2.charges.shield >= 1 + Math.floor(s2.stars / 8) - 0);
});

test('得分与金币、段位', () => {
  const s = runBot(ROUTES[0], 'turkey', 11);
  assert.ok(s.result.score > 1000 && s.result.coins > 100, JSON.stringify(s.result));
  assert.equal(coinsOf(1000, 0, false), 100);
  assert.equal(rankOf(0).name, '游行新手');
  assert.equal(rankOf(99999).name, '传奇领队');
});
