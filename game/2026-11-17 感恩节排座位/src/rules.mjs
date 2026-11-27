// 纯规则：不依赖 DOM / three，可在 node 中测试。
import { SEATS, SEAT, NEIGHBORS, WARM_SEATS, DOG_SEATS, HEAD_SEATS, DISHES, PEOPLE } from './data.mjs';

const SEAT_ORDER = Object.fromEntries(SEATS.map((s, i) => [s.id, i]));
export const BASE_MOOD = 1;
export const LIKE = 1;
export const HATE = -2;
export const HIT = -2;

export function dishAt(level, seatId) {
  return level.dishes[SEAT[seatId].row] || null;
}

function ruleActive(level, rule) {
  const seats = level.seats;
  switch (rule.type) {
    case 'likePerson': case 'hatePerson': return level.people.includes(rule.who);
    case 'likeDish': case 'hateDish': return seats.some((s) => dishAt(level, s) === rule.dish);
    case 'likeWarm': case 'hateWarm': return seats.some((s) => WARM_SEATS.includes(s));
    case 'likeDog': case 'hateDog': return seats.some((s) => DOG_SEATS.includes(s));
    case 'likeHead': return seats.some((s) => HEAD_SEATS.includes(s));
    default: return false;
  }
}

export function activeRules(level, pid) {
  return PEOPLE[pid].rules.filter((r) => ruleActive(level, r));
}

export function ruleText(rule) {
  const n = (id) => PEOPLE[id].name;
  switch (rule.type) {
    case 'likePerson': return { icon: '❤️', good: true, text: `想挨着${n(rule.who)}` };
    case 'hatePerson': return { icon: '⚡', good: false, text: `不想挨着${n(rule.who)}` };
    case 'likeDish': return { icon: DISHES[rule.dish].icon, good: true, text: `爱吃${DISHES[rule.dish].name}` };
    case 'hateDish': return { icon: '🚫', good: false, text: `别靠近${DISHES[rule.dish].name}` };
    case 'likeWarm': return { icon: '🔥', good: true, text: '怕冷，想靠暖炉' };
    case 'hateWarm': return { icon: '🥵', good: false, text: '怕热，别靠暖炉' };
    case 'likeDog': return { icon: '🐶', good: true, text: '想挨着狗狗豆豆' };
    case 'hateDog': return { icon: '🤧', good: false, text: '怕狗毛，别靠狗窝' };
    case 'likeHead': return { icon: '👑', good: true, text: '想坐桌头主位' };
    default: return { icon: '?', good: true, text: '' };
  }
}

export function traitTexts(pid) {
  const t = PEOPLE[pid].traits || {};
  const out = [];
  if (t.peacemaker) out.push({ icon: '🕊️', text: '心情好时，会劝住身边要动手的人（一次）' });
  if (t.temper) out.push({ icon: '💢', text: '急脾气：心情到 0 就会动手' });
  if (t.clumsy) out.push({ icon: '🌀', text: '手滑：扔东西总会砸偏到旁边的人' });
  return out;
}

export function threshold(pid) {
  return PEOPLE[pid].traits?.temper ? 0 : -1;
}

export function neighborsOf(assign, seatId) {
  return NEIGHBORS[seatId].filter((s) => assign[s]).map((s) => assign[s]);
}

export function seatOf(assign, pid) {
  for (const s in assign) if (assign[s] === pid) return s;
  return null;
}

function ruleScore(level, assign, seatId, rule) {
  const nb = neighborsOf(assign, seatId);
  switch (rule.type) {
    case 'likePerson': return nb.includes(rule.who) ? LIKE : 0;
    case 'hatePerson': return nb.includes(rule.who) ? HATE : 0;
    case 'likeDish': return dishAt(level, seatId) === rule.dish ? LIKE : 0;
    case 'hateDish': return dishAt(level, seatId) === rule.dish ? HATE : 0;
    case 'likeWarm': return WARM_SEATS.includes(seatId) ? LIKE : 0;
    case 'hateWarm': return WARM_SEATS.includes(seatId) ? HATE : 0;
    case 'likeDog': return DOG_SEATS.includes(seatId) ? LIKE : 0;
    case 'hateDog': return DOG_SEATS.includes(seatId) ? HATE : 0;
    case 'likeHead': return HEAD_SEATS.includes(seatId) ? LIKE : 0;
    default: return 0;
  }
}

// 返回每个已入座者的心情和逐条规则结果
export function evaluate(level, assign) {
  const moods = {};
  const details = {};
  for (const seatId of level.seats) {
    const pid = assign[seatId];
    if (!pid) continue;
    let m = BASE_MOOD;
    const d = [];
    for (const rule of activeRules(level, pid)) {
      const delta = ruleScore(level, assign, seatId, rule);
      m += delta;
      d.push({ rule, delta });
    }
    moods[pid] = m;
    details[pid] = d;
  }
  return { moods, details };
}

// 邻座关系（只列出有喜欢/讨厌的组合），用于桌面连线与晚宴寒暄
export function relations(level, assign) {
  const out = [];
  const seen = new Set();
  for (const seatId of level.seats) {
    const a = assign[seatId];
    if (!a) continue;
    for (const ns of NEIGHBORS[seatId]) {
      const b = assign[ns];
      if (!b) continue;
      const key = [a, b].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const ra = activeRules(level, a), rb = activeRules(level, b);
      const hate = ra.some((r) => r.type === 'hatePerson' && r.who === b) || rb.some((r) => r.type === 'hatePerson' && r.who === a);
      const like = ra.some((r) => r.type === 'likePerson' && r.who === b) || rb.some((r) => r.type === 'likePerson' && r.who === a);
      if (hate) out.push({ a, b, sa: seatId, sb: ns, kind: 'hate' });
      else if (like) out.push({ a, b, sa: seatId, sb: ns, kind: 'like' });
    }
  }
  return out;
}

export function moodBand(m) {
  if (m >= 3) return { face: '😍', label: '超开心', cls: 'm3' };
  if (m === 2) return { face: '😄', label: '开心', cls: 'm2' };
  if (m === 1) return { face: '🙂', label: '还行', cls: 'm1' };
  if (m === 0) return { face: '😒', label: '不太爽', cls: 'm0' };
  return { face: '😡', label: '要发火', cls: 'mn' };
}

const FOOD_FALLBACK = 'potato';

// 完整晚宴模拟：返回分阶段步骤，供画面按顺序播放
export function simulate(level, assign) {
  const { moods: startMoods, details } = evaluate(level, assign);
  const mood = { ...startMoods };
  const rel = relations(level, assign);
  const steps = [];

  // 1. 环境反应（同时出现）
  const env = [];
  for (const pid in details) {
    for (const { rule, delta } of details[pid]) {
      if (delta === 0 || rule.type === 'likePerson' || rule.type === 'hatePerson') continue;
      env.push({ p: pid, rule: rule.type, dish: rule.dish, good: delta > 0 });
    }
  }
  if (env.length) steps.push({ t: 'env', items: env });

  // 2. 寒暄碰杯（同时）
  const cheers = rel.filter((r) => r.kind === 'like');
  if (cheers.length) steps.push({ t: 'cheer', items: cheers.map((r) => ({ a: r.a, b: r.b })) });

  // 3. 斗嘴（逐对）
  for (const r of rel.filter((x) => x.kind === 'hate')) steps.push({ t: 'argue', a: r.a, b: r.b });

  // 4. 食物大战
  const throwsLeft = {}, calmsLeft = {}, lastHitBy = {}, hits = {};
  for (const pid in mood) { throwsLeft[pid] = 2; calmsLeft[pid] = PEOPLE[pid].traits?.peacemaker ? 1 : 0; hits[pid] = 0; }
  const order = (pid) => SEAT_ORDER[seatOf(assign, pid)];
  const hatedNeighbor = (pid) => {
    const s = seatOf(assign, pid);
    const hates = activeRules(level, pid).filter((r) => r.type === 'hatePerson').map((r) => r.who);
    const cands = neighborsOf(assign, s).filter((b) => hates.includes(b));
    cands.sort((x, y) => order(x) - order(y));
    return cands[0] || null;
  };
  let queue = Object.keys(mood)
    .filter((pid) => mood[pid] <= threshold(pid) && hatedNeighbor(pid))
    .sort((a, b) => mood[a] - mood[b] || order(a) - order(b));
  const involved = new Set();
  let thrown = 0, guard = 0;
  while (queue.length && guard++ < 80) {
    const p = queue.shift();
    if (throwsLeft[p] <= 0) continue;
    const target = lastHitBy[p] || hatedNeighbor(p);
    if (!target) continue;
    const ps = seatOf(assign, p);
    const pm = neighborsOf(assign, ps)
      .filter((q) => calmsLeft[q] > 0 && mood[q] >= 1)
      .sort((x, y) => order(x) - order(y))[0];
    if (pm) {
      calmsLeft[pm]--;
      steps.push({ t: 'calm', by: pm, p, target });
      continue;
    }
    let victim = target;
    if (PEOPLE[p].traits?.clumsy) {
      const ts = seatOf(assign, target);
      const alt = neighborsOf(assign, ts).filter((q) => q !== p).sort((x, y) => order(x) - order(y))[0];
      if (alt) victim = alt;
    }
    const food = dishAt(level, ps) || FOOD_FALLBACK;
    steps.push({ t: 'throw', from: p, to: victim, aim: target, food, missed: victim !== target });
    thrown++;
    throwsLeft[p]--;
    lastHitBy[p] = null;
    involved.add(p); involved.add(victim);
    hits[victim]++;
    mood[victim] += HIT;
    lastHitBy[victim] = p;
    if (PEOPLE[victim].traits?.peacemaker) calmsLeft[victim] = 0;
    if (mood[victim] <= threshold(victim) && throwsLeft[victim] > 0 && !queue.includes(victim)) queue.push(victim);
  }

  const result = scoreResult(level, { startMoods, mood, involved, hits, thrown });
  steps.push({ t: 'end' });
  return { steps, startMoods, mood, involved: [...involved], hits, thrown, details, ...result };
}

export function scoreResult(level, { startMoods, mood, involved, hits, thrown }) {
  const people = Object.keys(startMoods);
  if (level.mode === 'harmony') {
    if (thrown > 0) return { stars: 0, win: false, reason: '饭桌上打起来了！' };
    const min = Math.min(...people.map((p) => mood[p]));
    if (min >= 2) return { stars: 3, win: true, reason: '全家都开心，完美的一餐！' };
    if (min >= 1) return { stars: 2, win: true, reason: '没人吵架，大家都还满意。' };
    return { stars: 1, win: true, reason: '没打起来，但有人不太高兴。' };
  }
  const n = involved.size;
  const [s1, s2, s3] = level.goal.stars;
  const protect = level.goal.protect;
  const protectedOk = !protect || !(hits[protect] > 0);
  let stars = 0;
  if (n >= s1) stars = 1;
  if (n >= s2) stars = 2;
  if (stars === 2 && n >= s3 && protectedOk) stars = 3;
  const reason = stars === 0 ? `只有 ${n} 人卷入，还不够热闹。`
    : stars === 3 ? `${n} 人卷入${protect ? `，${PEOPLE[protect].name}毫发无伤` : ''}，史诗级大战！`
      : `${n} 人卷入了食物大战！${protect && !protectedOk ? `（${PEOPLE[protect].name}被砸到了）` : ''}`;
  return { stars, win: stars > 0, reason, count: n };
}

// 结算页每人一句话：解释心情来源
export function quoteFor(level, sim, pid) {
  const P = PEOPLE;
  if (sim.hits[pid] > 0) {
    const by = sim.steps.find((s) => s.t === 'throw' && s.to === pid);
    return `${P[by.from].name}！${HIT_LINES[pid] || '我的新衣服！'}`;
  }
  const threw = sim.steps.find((s) => s.t === 'throw' && s.from === pid);
  if (threw) return threw.missed ? '呃……我本来不是砸你的。' : `${P[threw.aim].name}，吃我一勺！`;
  const calm = sim.steps.find((s) => s.t === 'calm' && s.by === pid);
  if (calm) return `大过节的，${P[calm.p].name}别闹了。`;
  const d = sim.details[pid] || [];
  const worst = d.filter((x) => x.delta < 0)[0];
  if (worst) return complainLine(worst.rule);
  const best = d.filter((x) => x.delta > 0);
  if (best.length) return enjoyLine(best[best.length - 1].rule);
  return '挺好的，开饭吧。';
}

export const HIT_LINES = {
  grandma: '我的老花镜！', grandpa: '胡子上全是吃的！', dad: '我的围裙啊！', mom: '刚做的头发！',
  uncle: '好小子，你等着！', cousin: '眼镜全糊了！', girl: '呜呜，我的蝴蝶结！', boy: '哈哈好玩，再来！',
  aunt: '这是素的吗？！', sis: '我的新裙子！', bf: '……这是你们家的传统？',
};

export function complainLine(rule) {
  const P = PEOPLE;
  switch (rule.type) {
    case 'hatePerson': return `怎么又让我挨着${P[rule.who].name}……`;
    case 'hateDish': return `能把${DISHES[rule.dish].name}挪远点吗？`;
    case 'hateWarm': return '这儿热死了……';
    case 'hateDog': return '阿嚏！全是狗毛！';
    default: return '唉……';
  }
}

export function enjoyLine(rule) {
  const P = PEOPLE;
  switch (rule.type) {
    case 'likePerson': return `能挨着${P[rule.who].name}真好！`;
    case 'likeDish': return `${DISHES[rule.dish].name}就在手边，完美！`;
    case 'likeWarm': return '暖炉边真暖和～';
    case 'likeDog': return '豆豆乖，给你一块～';
    case 'likeHead': return '主位，舒坦。';
    default: return '开心！';
  }
}

export const ARGUE_LINES = {
  'cousin|uncle': ['这事你根本不懂！', '您那套早过时了！'],
  'boy|girl': ['别抢我的鸡腿！', '略略略～'],
  'bf|uncle': ['小伙子，一个月挣多少？', '呃……还、还行……'],
};
export function argueLines(a, b) {
  const key = [a, b].sort().join('|');
  const lines = ARGUE_LINES[key] || ['哼！', '你才哼！'];
  // 按排序后的顺序给出台词
  const [x] = [a, b].sort();
  return a === x ? lines : [lines[1], lines[0]];
}

// 逐座位穷举（测试与提示用）
export function* allAssignments(level) {
  const seats = level.seats, people = level.people;
  const assign = {};
  const used = new Set();
  function* rec(i) {
    if (i === people.length) { yield assign; return; }
    for (const s of seats) {
      if (used.has(s)) continue;
      used.add(s); assign[s] = people[i];
      yield* rec(i + 1);
      used.delete(s); delete assign[s];
    }
  }
  yield* rec(0);
}
