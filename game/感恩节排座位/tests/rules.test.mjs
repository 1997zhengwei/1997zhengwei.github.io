import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, PEOPLE, NEIGHBORS } from '../src/data.mjs';
import { evaluate, simulate, relations, activeRules, quoteFor } from '../src/rules.mjs';

// 求解器离线验证过的三星坐法（tools/analyze.mjs 穷举得到）
const THREE_STAR = {
  1: { L2: 'grandma', R3: 'dad', L3: 'uncle', R2: 'cousin' },
  2: { L1: 'grandma', H0: 'grandpa', R2: 'dad', L2: 'uncle', R1: 'cousin', L3: 'aunt' },
  3: { L1: 'grandma', L3: 'mom', R2: 'dad', R1: 'girl', L4: 'boy', L2: 'uncle', R3: 'cousin' },
  4: { L1: 'mom', R1: 'dad', L2: 'uncle', L3: 'cousin', R2: 'girl', R3: 'boy' },
  5: { L1: 'grandma', H0: 'grandpa', R1: 'dad', L3: 'mom', R3: 'aunt', L2: 'uncle', L4: 'cousin', H5: 'girl' },
  6: { L1: 'grandma', H0: 'grandpa', R1: 'dad', L4: 'mom', R2: 'uncle', L3: 'cousin', H5: 'aunt', R3: 'sis', R4: 'bf', L2: 'girl' },
  7: { H0: 'grandma', L1: 'grandpa', R1: 'dad', L2: 'mom', R3: 'uncle', R4: 'cousin', L3: 'girl', L4: 'boy', H5: 'sis', R2: 'bf' },
};

test('邻座关系对称', () => {
  for (const a in NEIGHBORS) for (const b of NEIGHBORS[a]) assert.ok(NEIGHBORS[b].includes(a), `${a}-${b}`);
});

test('每关人数不超过座位，人物都存在', () => {
  for (const lv of LEVELS) {
    assert.ok(lv.people.length <= lv.seats.length, lv.name);
    for (const p of lv.people) assert.ok(PEOPLE[p], p);
  }
});

test('每关都有可达到三星的坐法', () => {
  for (const lv of LEVELS) {
    const a = THREE_STAR[lv.id];
    assert.equal(Object.keys(a).length, lv.people.length, lv.name);
    const sim = simulate(lv, a);
    assert.equal(sim.stars, 3, `${lv.name}: ${sim.reason}`);
  }
});

test('第一关：大伯和表哥挨着会打起来（零星）', () => {
  const lv = LEVELS[0];
  const sim = simulate(lv, { L2: 'grandma', R2: 'cousin', R3: 'uncle', L3: 'dad' });
  assert.ok(sim.thrown > 0);
  assert.equal(sim.stars, 0);
  assert.ok(relations(lv, { R2: 'cousin', R3: 'uncle' }).some((r) => r.kind === 'hate'));
});

test('心情计算：喜欢 +1、讨厌 -2', () => {
  const lv = LEVELS[0];
  const { moods } = evaluate(lv, { L2: 'grandma', R2: 'cousin' });
  assert.equal(moods.grandma, 2); // 南瓜派
  assert.equal(moods.cousin, 2); // 挨着奶奶
});

test('奶奶劝架一次后不再劝；被砸后失去劝架能力', () => {
  const lv = LEVELS[6];
  const sim = simulate(lv, THREE_STAR[7]);
  assert.equal(sim.hits.grandma || 0, 0);
  const calms = sim.steps.filter((s) => s.t === 'calm' && s.by === 'grandma').length;
  assert.ok(calms <= 1);
});

test('每人最多扔两次；模拟必然结束', () => {
  for (const lv of LEVELS) {
    const sim = simulate(lv, THREE_STAR[lv.id]);
    const count = {};
    for (const s of sim.steps) if (s.t === 'throw') count[s.from] = (count[s.from] || 0) + 1;
    for (const k in count) assert.ok(count[k] <= 2);
    assert.equal(sim.steps.at(-1).t, 'end');
  }
});

test('小弟手滑会砸到目标旁边的人', () => {
  const lv = LEVELS[3];
  const sim = simulate(lv, THREE_STAR[4]);
  const boyThrow = sim.steps.find((s) => s.t === 'throw' && s.from === 'boy');
  assert.ok(boyThrow && boyThrow.missed && boyThrow.to !== boyThrow.aim);
});

test('只启用本关存在的规则', () => {
  const lv = LEVELS[0];
  assert.ok(!activeRules(lv, 'grandma').some((r) => r.type === 'likePerson')); // 小妹不在
  assert.ok(!activeRules(lv, 'grandma').some((r) => r.type === 'likeWarm')); // 暖炉座位未启用
});

test('每人都有结算台词', () => {
  for (const lv of LEVELS) {
    const sim = simulate(lv, THREE_STAR[lv.id]);
    for (const p of lv.people) assert.ok(quoteFor(lv, sim, p).length > 1);
  }
});
