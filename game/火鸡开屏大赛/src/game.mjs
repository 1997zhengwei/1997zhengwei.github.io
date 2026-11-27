// 火鸡开屏大赛 · 纯逻辑：跑道、羽毛、加减门、剪刀、大厨、计分
// 火鸡沿 -z 方向前进；d = 已跑距离（世界 z = -d）；x 为左右

export const HALF = 3.0;          // 跑道半宽
export const SPEED = 9.5;         // 前进速度
export const COLORS = ['red', 'orange', 'gold', 'teal', 'purple', 'rainbow'];
import { LEVELS } from './levels.mjs';
export { LEVELS };
export const COLOR_NAMES = { red: '蔓越莓红', orange: '南瓜橙', gold: '玉米金', teal: '鼠尾草绿', purple: '葡萄紫', rainbow: '丰收彩虹' };

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 关卡由“段落”拼成，节奏：收集 → 选门 → 收集 → 危险（→ 丰收角）…
// 每关的门：越往后数值越大、乘法门越多（mul = 本关最多几扇 ×门），羽毛总量逐关拉开
const P = (v) => ({ op: '+', v }), Mi = (v) => ({ op: '-', v }), X = (v) => ({ op: 'x', v }), D = (v) => ({ op: '/', v });
const GATES = {
  t1: { good: [P(5), P(6), P(8)], bad: [Mi(4), Mi(5), Mi(6)], mul: 0 },
  t2: { good: [P(6), P(8), P(10), X(2)], bad: [Mi(6), Mi(8), D(2)], mul: 1 },
  t3: { good: [P(8), P(10), P(12), X(2)], bad: [Mi(8), Mi(10), D(2)], mul: 1 },
  t4: { good: [P(10), P(12), P(15), X(2)], bad: [Mi(10), Mi(12), D(2)], mul: 2 },
  t5: { good: [P(12), P(15), P(20), X(2), X(3)], bad: [Mi(12), Mi(15), D(2), D(3)], mul: 2 },
  t6: { good: [P(15), P(20), P(25), X(2), X(3)], bad: [Mi(15), Mi(20), D(2), D(3)], mul: 3 },
  t7: { good: [P(15), P(20), P(25), X(2)], bad: [Mi(15), Mi(20), D(2)], mul: 2 },
  t8: { good: [P(15), P(20), P(30), X(2), X(3)], bad: [Mi(15), Mi(25), D(2), D(3)], mul: 2 },
  t9: { good: [P(20), P(25), P(30), X(2), X(3)], bad: [Mi(20), Mi(25), D(2), D(3)], mul: 3 },
  t10: { good: [P(20), P(25), P(30), X(2), X(3)], bad: [Mi(20), Mi(30), D(2), D(3)], mul: 3 },
};
// 动脑门：两扇都是蓝门（挑更划算的）或两扇都是红门（两害相权取其轻）
const CHOICE = {
  good: [[P(10), X(2)], [P(15), X(2)], [P(25), X(2)], [P(30), X(3)]],
  bad: [[Mi(8), D(2)], [Mi(15), D(2)], [Mi(25), D(2)]],
};
export const CAP = 320;
export function gateResult(n, it) {
  const m = it.op === '+' ? n + it.v : it.op === '-' ? Math.max(0, n - it.v) : it.op === 'x' ? n * it.v : Math.floor(n / it.v);
  return Math.min(m, Math.max(n, CAP));
}
export const HIT_LABEL = { scissors: '禽类剪刀咔嚓！', chef: '大厨的烤盘！', pumpkin: '被大南瓜撞到！', pie: '南瓜派糊脸！', mash: '一脚踩进土豆泥！', fork: '大叉子从天而降！', caught: '被大厨追上了！' };
// 跳台：起跳后在空中停留 dur 秒，最高 h 米
export const JUMP = { dur: 1.0, h: 2.6 };
export const FRIEND_CAP = 20;
export function buildTrack(level) {
  const L = level;
  const rng = mulberry32(L.seed);
  const R = (a, b) => a + (b - a) * rng();
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const length = L.length;
  const items = [];
  let id = 1;
  let d = 18;
  let muls = 0;
  let colorIdx = 0;
  const nextColor = () => COLORS[Math.floor(colorIdx++ / 2) % COLORS.length];
  const feathersLine = (x0, x1, n, color) => {
    for (let i = 0; i < n; i++) {
      const k = n === 1 ? 0 : i / (n - 1);
      items.push({ id: id++, type: 'feather', d: d + i * 1.6, x: x0 + (x1 - x0) * k, color });
    }
    d += n * 1.6;
  };
  const line = () => {
    const c = nextColor();
    const kind = Math.floor(rng() * 3);
    if (kind === 0) feathersLine(R(-2, 2), R(-2, 2), 6, c);
    else if (kind === 1) { const x = R(-2.2, 2.2); feathersLine(x, x, 5, c); }
    else feathersLine(-2.2, 2.2, 7, c);
    d += 6 * (L.gap || 1);
  };
  const gate = (forceSlide = false) => {
    const G = GATES[L.gates || 't1'];
    const canMul = muls < G.mul;
    let a = pick(canMul ? G.good : G.good.filter((g) => g.op === '+')), b = pick(G.bad);
    if (L.choice && rng() < L.choice && (canMul || L.choiceBad)) {
      const pair = pick(L.choiceBad && (!canMul || rng() < 0.35) ? CHOICE.bad : CHOICE.good);
      [a, b] = rng() < 0.5 ? pair : [pair[1], pair[0]];
    } else if (rng() < 0.5) [a, b] = [b, a];
    if (a.op === 'x' || b.op === 'x') muls++;
    const slide = forceSlide || (L.slide && rng() < L.slide) ? { amp: 1.7, freq: R(0.3, 0.42) * (L.haz || 1), phase: rng() * 6 } : null;
    items.push({ id: id++, type: 'gate', side: 'L', d, x0: -HALF, x1: 0, slide, ...a });
    items.push({ id: id++, type: 'gate', side: 'R', d, x0: 0, x1: HALF, slide, ...b });
    d += 10;
  };
  const hazard = (type) => {
    const hk = L.haz || 1;
    if (type === 'scissors') {
      items.push({ id: id++, type, d, x: R(-1.0, 1.0), amp: Math.min(2.4, R(1.2, 2.2) * Math.sqrt(hk)), freq: R(0.4, 0.7) * hk, phase: rng() * 6 });
      d += 4; feathersLine(R(-2.4, -1.6) * (rng() < 0.5 ? 1 : -1), 0, 3, nextColor()); d += 6;
    } else if (type === 'chef') {
      items.push({ id: id++, type, d, x: 0, amp: 2.0, freq: 0.35 * hk, phase: rng() * 6 });
      d += 12;
    } else if (type === 'pumpkin') {
      // 在左右护栏之间来回滚
      items.push({ id: id++, type, d, x: 0, amp: 2.3, freq: R(0.32, 0.45) * hk, phase: rng() * 6 });
      d += 5; feathersLine(R(-2, 2), R(-2, 2), 4, nextColor()); d += 5;
    } else if (type === 'mash') {
      // 土豆泥小山：占一条道，踩进去会被黏住减速
      const li = Math.floor(rng() * 3);
      items.push({ id: id++, type, d, x: LANES[li], amp: 0, freq: 0, phase: 0 });
      if (rng() < 0.6) items.push({ id: id++, type, d: d + 4, x: LANES[(li + 1 + Math.floor(rng() * 2)) % 3], amp: 0, freq: 0, phase: 0 });
      d += 8; feathersLine(R(-2, 2), R(-2, 2), 4, nextColor()); d += 4;
    } else if (type === 'fork') {
      // 两把大叉子先后插进两条道，地上先出现影子
      const safe = Math.floor(rng() * 3);
      let k = 0;
      LANES.forEach((x, i) => { if (i !== safe) items.push({ id: id++, type, d: d + (k++) * 3.5, x, amp: 0, freq: 0, phase: 0 }); });
      d += 9; feathersLine(LANES[safe], LANES[safe], 3, nextColor()); d += 5;
    } else if (type === 'pie') {
      // 三条车道里砸两条，留一条空当
      const lanes = [-2.1, 0, 2.1];
      const safe = Math.floor(rng() * 3);
      lanes.forEach((x, i) => { if (i !== safe) items.push({ id: id++, type, d: d + i * 0.01, x, amp: 0, freq: 0, phase: 0 }); });
      d += 6; feathersLine(lanes[safe], lanes[safe], 3, nextColor()); d += 6;
    }
  };
  const horn = () => { items.push({ id: id++, type: 'horn', d, x: (rng() < 0.5 ? -1 : 1) * R(1.8, 2.3) }); d += 8; };
  const LANES = [-1.9, 0, 1.9];
  // 跳台：沿起跳弧线摆一串空中羽毛；有时弧线下方的地面整排都是危险，只能飞过去
  const ramp = (force) => {
    const li = Math.floor(rng() * 3), x = LANES[li];
    feathersLine(x, x, 2, nextColor()); d += 3;
    items.push({ id: id++, type: 'ramp', d, x, w: 1.8 });
    const span = (L.speed || SPEED) * JUMP.dur;
    const c = nextColor();
    for (let i = 1; i <= 7; i++) { const k = (i + 0.5) / 9; items.push({ id: id++, type: 'feather', d: d + span * k, x, y: JUMP.h * 4 * k * (1 - k), color: i === 4 ? 'rainbow' : c }); }
    if (L.rampHaz && (force || rng() < 0.6)) LANES.forEach((lx) => items.push({ id: id++, type: L.rampHaz, d: d + span * 0.5 + rng() * 0.01, x: lx, amp: 0, freq: 0, phase: 0 }));
    d += span + 7;
  };
  // 笼子：撞开就多几只小火鸡伙伴，被撞时伙伴替你挡
  const cage = () => {
    const x = LANES[Math.floor(rng() * 3)];
    const n = 2 + Math.floor(rng() * 3);
    feathersLine(x * 0.4, x, 3, nextColor()); d += 2;
    items.push({ id: id++, type: 'cage', d, x, n });
    d += 8 * (L.gap || 1);
  };
  // 打滑区（肉汁 / 冰面）：盖住接下来的危险
  const zone = () => { items.push({ id: id++, type: 'zone', kind: L.zone.kind, d: d - 4, len: L.zone.len }); };
  const corn = () => { items.push({ id: id++, type: 'corn', d, x: LANES[Math.floor(rng() * 3)] + R(-0.3, 0.3) }); d += 5; };

  let introDone = !L.intro;
  let cycle = 0;
  const pool = L.pool || ['scissors', 'chef'];
  const first = !introDone;
  while (d < length - 30) {
    if (L.cage && ((first && cycle === 0 && L.intro === 'cage') || rng() < L.cage)) cage(); else line();
    if (d >= length - 30) break;
    gate(!introDone && L.intro === 'slide');
    if (L.intro === 'slide') introDone = true;
    if (d >= length - 30) break;
    if (L.ramp && ((first && cycle === 0 && L.intro === 'ramp') || rng() < L.ramp)) ramp(first && cycle === 0); else line();
    if (d >= length - 30) break;
    let hz = !introDone && pool.includes(L.intro) ? L.intro : pool[cycle % pool.length];
    if (rng() < 0.3) hz = pick(pool);
    introDone = true;
    if (L.zone && ((first && cycle === 0 && L.intro === 'zone') || rng() < L.zone.p)) zone();
    hazard(hz);
    if (L.corn && rng() < L.corn) corn();
    if (L.double && rng() < L.double && d < length - 40) hazard(pick(pool));
    if (L.horn && cycle % 3 === 1 && d < length - 35) horn();
    cycle++;
  }
  items.sort((a, b) => a.d - b.d);
  return { items, length: Math.max(length, d + 20) };
}

export function createRun(level = LEVELS[0]) {
  const L = typeof level === 'number' ? { ...LEVELS[0], seed: level } : level;
  const t = buildTrack(L);
  const avail = t.items.reduce((a, it) => a + (it.type === 'feather' ? 1 : it.type === 'horn' ? 6 : 0), 0);
  return {
    level: L, t: 0, d: 0, x: 0, vx: 0, targetX: 0, speed: L.speed || SPEED, curSpeed: L.speed || SPEED,
    stats: { hits: 0, gates: 0, goodGates: 0, got: 0, avail, rescued: 0, caught: 0, jumps: 0, corn: 0 },
    y: 0, air: null, friends: 0, slowT: 0, boostT: 0, slip: null, bonus: 0,
    chase: L.chase ? { gap: L.chase.start } : null,
    zones: t.items.filter((it) => it.type === 'zone'),
    items: t.items, length: t.length,
    feathers: [],            // 收集到的羽毛颜色列表
    taken: new Set(), events: [], state: 'run', hitCD: 0, best: 0,
  };
}

// 门的左右分界：滑动门会左右来回移动
export function gateSplit(it, t) {
  return it.slide ? Math.sin(t * Math.PI * 2 * it.slide.freq + it.slide.phase) * it.slide.amp : 0;
}
export function gateBounds(it, t) {
  const m = gateSplit(it, t);
  return it.side === 'L' ? [-HALF, m] : [m, HALF];
}

function applyGate(s, it) {
  const n = s.feathers.length;
  const m = gateResult(n, it);
  if (m > n) {
    // 新增羽毛：按已有颜色循环，没有就给金色
    const src = s.feathers.length ? s.feathers.slice() : ['gold'];
    for (let i = n; i < m; i++) s.feathers.push(src[i % src.length]);
  } else s.feathers.length = m;
  return m - n;
}

export const HAZ_W = { scissors: 0.9, chef: 1.1, pumpkin: 0.95, pie: 0.85, mash: 0.95, fork: 0.62 };
export function hazardX(it, t) {
  return it.x + Math.sin(t * Math.PI * 2 * it.freq + it.phase) * it.amp;
}

// input: { targetX }
export function step(s, input, dt) {
  s.events.length = 0;
  if (s.state !== 'run') return s;
  s.t += dt;
  const prevD = s.d;
  s.slowT = Math.max(0, s.slowT - dt); s.boostT = Math.max(0, s.boostT - dt);
  s.curSpeed = s.speed * (s.slowT > 0 ? 0.6 : 1) * (s.boostT > 0 ? 1.4 : 1);
  s.d += s.curSpeed * dt;
  if (input.targetX !== undefined) s.targetX = Math.max(-HALF + 0.5, Math.min(HALF - 0.5, input.targetX));
  // 打滑区：方向几乎不听使唤，会顺着惯性滑
  s.slip = null;
  for (const z of s.zones) if (s.d >= z.d && s.d <= z.d + z.len) { s.slip = z.kind; break; }
  const slip = s.slip && s.y < 0.2;
  // 跟手但有一点惯性
  const ax = slip ? (s.targetX - s.x) * 7 - s.vx * 0.9 : (s.targetX - s.x) * 60 - s.vx * 12;
  s.vx += ax * dt; s.x += s.vx * dt;
  if (s.x < -HALF + 0.4 || s.x > HALF - 0.4) { s.x = Math.max(-HALF + 0.4, Math.min(HALF - 0.4, s.x)); if (slip) s.vx *= -0.3; }
  s.hitCD = Math.max(0, s.hitCD - dt);
  // 跳台腾空
  if (s.air) {
    const k = (s.t - s.air.t0) / JUMP.dur;
    if (k >= 1) { s.air = null; s.y = 0; s.events.push({ e: 'land' }); } else s.y = JUMP.h * 4 * k * (1 - k);
  }
  // 大厨追击：差距 = 火鸡速度 − 大厨速度 的积分
  if (s.chase) {
    s.chase.gap = Math.min(22, s.chase.gap + (s.curSpeed - (s.speed + s.level.chase.rate)) * dt);
    if (s.chase.gap <= 0.4 && s.hitCD <= 0) {
      const n = s.feathers.length;
      const lost = s.feathers.splice(n - Math.min(n, Math.max(5, Math.ceil(n * 0.3))));
      s.chase.gap = 10; s.hitCD = 1.0; s.stats.hits++; s.stats.caught++;
      s.events.push({ e: 'hit', it: { type: 'caught', id: -1 }, lost, n: s.feathers.length });
    }
  }
  for (const it of s.items) {
    if (s.taken.has(it.id)) continue;
    if (it.d > s.d + 2) break;
    const crossed = prevD < it.d && s.d >= it.d;
    if (it.type === 'zone') continue;
    if (it.type === 'feather') {
      if (Math.abs(it.d - s.d) < 0.9 && Math.abs(it.x - s.x) < 0.95 && Math.abs((it.y || 0) - s.y) < 0.9) {
        s.taken.add(it.id);
        s.feathers.push(it.color); s.stats.got++;
        s.events.push({ e: 'feather', it, n: s.feathers.length });
      }
    } else if (it.type === 'horn') {
      if (Math.abs(it.d - s.d) < 0.9 && Math.abs(it.x - s.x) < 1.05) {
        s.taken.add(it.id);
        const off = Math.floor(it.d) % COLORS.length;
        const got = [0, 1, 2, 3, 4, 5].map((k) => COLORS[(off + k) % COLORS.length]);
        s.feathers.push(...got); s.stats.got += 6;
        s.events.push({ e: 'horn', it, got, n: s.feathers.length });
      }
    } else if (it.type === 'ramp' && crossed) {
      s.taken.add(it.id);
      if (!s.air && Math.abs(it.x - s.x) < it.w / 2 + 0.25) { s.air = { t0: s.t }; s.stats.jumps++; s.events.push({ e: 'jump', it }); }
    } else if (it.type === 'cage') {
      if (Math.abs(it.d - s.d) < 0.9 && Math.abs(it.x - s.x) < 1.05 && s.y < 1.2) {
        s.taken.add(it.id);
        const add = Math.min(it.n, FRIEND_CAP - s.friends);
        s.friends += add; s.stats.rescued += add;
        s.events.push({ e: 'cage', it, add, friends: s.friends });
      }
    } else if (it.type === 'corn') {
      if (Math.abs(it.d - s.d) < 0.9 && Math.abs(it.x - s.x) < 1.0 && s.y < 1.2) {
        s.taken.add(it.id);
        s.boostT = 1.4; s.stats.corn++;
        s.events.push({ e: 'corn', it });
      }
    } else if (it.type === 'gate' && crossed) {
      const [gx0, gx1] = gateBounds(it, s.t);
      if (s.x >= gx0 && s.x < gx1) {
        s.taken.add(it.id);
        const other = s.items.find((o) => o.type === 'gate' && o.d === it.d && o.id !== it.id);
        for (const o of s.items) if (o.type === 'gate' && o.d === it.d) s.taken.add(o.id);
        const n0 = s.feathers.length;
        const smart = !other || gateResult(n0, it) >= gateResult(n0, other);
        s.stats.gates++; if (smart) s.stats.goodGates++;
        const delta = applyGate(s, it);
        s.events.push({ e: 'gate', it, delta, smart, n: s.feathers.length });
      }
    } else if (HAZ_W[it.type] && s.hitCD <= 0 && s.y < 0.7) {
      const hx = hazardX(it, s.t);
      const w = HAZ_W[it.type];
      if (Math.abs(it.d - s.d) < 0.8 && Math.abs(hx - s.x) < w) {
        s.taken.add(it.id);
        if (it.type === 'mash') s.slowT = 0.9;
        if (s.chase) s.chase.gap -= 3;
        if (s.friends > 0) {
          // 小火鸡伙伴挡在前面，羽毛一根不掉，伙伴吓跑了
          const gone = Math.min(s.friends, it.type === 'chef' ? 3 : 2);
          s.friends -= gone; s.hitCD = 0.6; s.stats.hits++;
          s.events.push({ e: 'hit', it, lost: [], shield: gone, friends: s.friends, n: s.feathers.length });
          continue;
        }
        const n = s.feathers.length;
        const lose = Math.min(n, it.type === 'chef' ? Math.ceil(n * 0.5) : it.type === 'pie' ? Math.max(2, Math.ceil(n * 0.2)) : it.type === 'pumpkin' || it.type === 'fork' ? Math.max(3, Math.ceil(n * 0.25)) : it.type === 'mash' ? Math.max(3, Math.ceil(n * 0.15)) : Math.max(3, Math.ceil(n * 0.3)));
        const lost = s.feathers.splice(n - lose, lose);
        s.hitCD = 0.6; s.stats.hits++;
        s.events.push({ e: 'hit', it, lost, n: s.feathers.length });
      }
    }
  }
  if (s.feathers.length > CAP) s.feathers.length = CAP;
  s.best = Math.max(s.best, s.feathers.length);
  if (s.d >= s.length) { s.d = s.length; finish(s); }
  return s;
}

// 三位评委各看一项（满分各 10）：
//  小黄看「尾屏大小」= 羽毛数 / 本关目标 par，越多越高但边际递减
//  老白看「色彩」= 六种颜色是否齐全且均匀（信息熵），彩虹羽毛额外加分
//  小粉看「台风」= 一路上被撞几次、门选得聪不聪明、路上的羽毛吃了多少
export function scoreOf(feathers, par = 50, stats = null) {
  const n = feathers.length;
  const cnt = {};
  for (const c of feathers) cnt[c] = (cnt[c] || 0) + 1;
  const colors = Object.keys(cnt).length;
  let H = 0;
  for (const c of COLORS) if (cnt[c]) { const p = cnt[c] / Math.max(1, n); H -= p * Math.log(p); }
  H /= Math.log(COLORS.length);
  const size = n === 0 ? 1 : 1 + 9 * (1 - Math.exp(-2.4 * n / par));
  const color = n === 0 ? 1 : 1 + 0.9 * colors + 3.6 * H;
  let poise = 10, detail = null;
  if (stats) {
    const rate = stats.avail ? Math.min(1, stats.got / stats.avail) : 1;
    const bad = stats.gates - stats.goodGates;
    poise = 10 - 1.3 * stats.hits - 0.9 * bad - 4 * (1 - rate);
    detail = { hits: stats.hits, badGates: bad, gates: stats.gates, rate };
  }
  const r1 = (v) => Math.max(1, Math.min(10, Math.round(v * 10) / 10));
  const judges = [size, color, poise].map(r1);
  const raw = n * 10 + colors * 40;
  return { raw, judges, total: Math.round(judges.reduce((a, b) => a + b, 0) * 10) / 10, colors, n, detail };
}

function finish(s) {
  s.state = 'done';
  // 救出的伙伴每只送 3 根羽毛
  if (s.friends > 0) {
    s.bonus = s.friends * 3;
    for (let i = 0; i < s.bonus; i++) s.feathers.push(COLORS[i % COLORS.length]);
    s.feathers.length = Math.min(s.feathers.length, CAP);
  }
  const sc = scoreOf(s.feathers, s.level.par || 50, s.stats);
  const stars = sc.total >= 27 ? 3 : sc.total >= 22 ? 2 : sc.total >= 15 ? 1 : 0;
  s.result = { ...sc, stars };
  s.events.push({ e: 'finish' });
}
