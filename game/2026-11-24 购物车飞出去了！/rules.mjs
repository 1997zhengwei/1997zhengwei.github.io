// 规则层（纯逻辑，界面与 balance.mjs 机器人共用）——无尽连跳。
// 购物车自动往前冲，一个接一个跳台自动起跳。空中按住=后空翻，松手=车头慢慢往下栽。
// 轮子朝下落地才算成功；翻一整圈倍率 +1，落得越平越好。头着地/侧翻=大翻车，本局结束。
// 每过一个闪购货架往车里塞一件货，货越堆越高：每跳返现越多，但翻得越慢。

export const ITEMS = [
  {id:'tv', name:'大电视'}, {id:'gift', name:'超值礼盒'}, {id:'coffee', name:'咖啡机'},
  {id:'duck', name:'小黄鸭'}, {id:'turkey', name:'冷冻火鸡'}, {id:'sofa', name:'懒人沙发'},
];
export const G = 9.5;                    // 重力（偏小，留够空中翻转的时间）
export const START_X = -4;
export const RAMP_LEN = 5.6;
export const CAR_ROOF = { offsetX: -.1, lengthRatio: .6, height: 1.225, thickness: .04 };
export const SPIN = 7.8;                 // 按住时的翻转角速度（rad/s，货越多越慢）
export const DRIFT = -1.8;               // 松手时车头往下栽的角速度
export const LAND = {perfect: .24, ok: .55, sloppy: .9};   // 落地角度容差（弧度）
export const MAX_PILE = 10;
export const MILESTONES = [300, 800, 1500, 3000, 5000, 8000, 12000, 20000];
export const RANKS = [[0,'推车新手'],[300,'停车场飞人'],[1000,'翻滚达人'],[3000,'黑五特技王'],[8000,'购物车之神']];
export const rankOf = v => RANKS.filter(([m]) => v >= m).pop()[1];

export function rngFrom(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
}
const TAU = Math.PI * 2;
export const wrap = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };

// 第 k 个跳台：越往后越高、车速上限越高；部分落地区停着车（踩车顶弹起）
// 以最高车速从高 h 的跳台飞出的最远距离，用来摆下一个跳台，保证不会落到下一个坡上
function flightReach(h) {
  const th = Math.atan(2 * h / RAMP_LEN), v = 12 * 1.12, vx = v * Math.cos(th), vy = v * Math.sin(th);
  return vx * (vy + Math.sqrt(vy * vy + 2 * G * h)) / G;
}
function makeRamp(run, k) {
  const rng = run.rng, prev = run.ramps[run.ramps.length - 1];
  const x0 = prev ? prev.x0 + prev.len + prev.gap : 6;
  const h = Math.min(3.2, 1.8 + k * .07 + rng() * .3);
  const gap = flightReach(h) + 7 + rng() * 4;
  const r = {k, x0, len: RAMP_LEN, h, gap, shelf: x0 - 6.5, item: ITEMS[Math.floor(rng() * ITEMS.length)].id, car: null, coins: [],
    wind: k < 8 ? 0 : (rng() < .5 ? -1 : 1) * Math.min(1.0, .25 + (k - 8) * .05) * (.6 + rng() * .4)};   // 侧风：空中额外的翻转力矩
  r.theta = Math.atan(2 * h / RAMP_LEN);
  if (k >= 3 && rng() < .4) r.car = {x: x0 + RAMP_LEN + 7 + rng() * 4, len: 3, color: Math.floor(rng() * 4)};
  if (r.car) { r.car.x = x0 + RAMP_LEN + flightReach(h) * .55 + rng() * 3; r.gap += 12; }
  // 一串金币沿飞行轨迹挂在车身上方一点：直着飞够不着，后空翻时车、人、货甩开一圈就能扫到
  r.coins = Array.from({length: 5}, () => ({x: 0, y: 0, got: false}));
  placeCoins(r, 7);
  run.ramps.push(r);
  return r;
}
// 按真实起跳速度把金币摆到轨迹上（生成时先按起步车速摆，起跳瞬间按实际车速再摆一次）
export const COIN_LIFT = 1.15;
function placeCoins(r, speed) {
  const v = speed * 1.12, vx = v * Math.cos(r.theta), vy = v * Math.sin(r.theta);
  const T = (vy + Math.sqrt(vy * vy + 2 * G * r.h)) / G;
  r.coins.forEach((c, i) => {
    const t = T * (.2 + .13 * i);
    c.x = r.x0 + r.len + vx * t; c.y = r.h + vy * t - G * t * t / 2 + PIVOT + COIN_LIFT;
  });
}
export const PIVOT = .7;                 // 车身中心离车底的高度
// 吃金币的半径：翻转时整车甩开一圈，判定跟着变大（货越高甩得越远）
export const coinReach = run => Math.abs(run.av) > 2 ? 1.5 + .05 * run.pile.length : .8;
function ensureRamps(run) { while (!run.ramps.length || run.ramps[run.ramps.length - 1].x0 < run.x + 70) makeRamp(run, run.ramps.length); }

export function startRun(seed = Math.floor(Math.random() * 1e9)) {
  const run = {seed, rng: rngFrom(seed), ramps: [], x: START_X, y: 0, vx: 7, vy: 0, speed: 7, angle: 0, av: 0,
    phase: 'ground', hold: false, pile: [], score: 0, jumps: 0, flips: 0, bestFlips: 0, perfects: 0, bounces: 0,
    coins: 0, airFlips: 0, launchAngle: 0, rampIndex: 0, time: 0, airTime: 0, lost: 0, milestone: 0, crash: null,
    streak: 0, events: []};
  ensureRamps(run);
  run.pile.push(ITEMS[1].id);
  return run;
}

const emit = (run, type, data = {}) => run.events.push({type, ...data});
export const currentRamp = run => run.ramps[run.rampIndex];
// 货堆越高越难落稳
export const tolerance = run => { const n = run.pile.length; return {perfect: LAND.perfect - n * .006, ok: LAND.ok - n * .012, sloppy: LAND.sloppy - n * .02}; };
export const spinRate = run => SPIN / (1 + .045 * run.pile.length);
// 车轮进入下一整圈的可落地区间，就预览该圈的倍率。
export const airborneFlips = run => Math.max(0, Math.floor((run.angle + tolerance(run).sloppy) / TAU));

// 地面高度：跳台是二次曲面，其余是平地（车顶单独判断）
export function groundAt(run, x) {
  for (const r of run.ramps) {
    if (x >= r.x0 && x <= r.x0 + r.len) { const s = (x - r.x0) / r.len; return r.h * s * s; }
    if (r.x0 > x) break;
  }
  return 0;
}

export function step(run, dt, hold) {
  if (run.phase === 'crash') { run.time += dt; return; }
  run.time += dt; run.hold = hold;
  ensureRamps(run);
  const r = currentRamp(run);
  if (run.phase === 'ground') {
    run.speed += (Math.max(7, run.speed) - run.speed) * dt;
    run.x += run.speed * dt;
    // 闪购货架：经过就往车里塞一件
    if (!r.shelfTaken && run.x >= r.shelf) {
      r.shelfTaken = true;
      if (run.pile.length < MAX_PILE) { run.pile.push(r.item); emit(run, 'pickup', {item: r.item, pile: run.pile.length}); }
    }
    if (run.x >= r.x0 && run.x < r.x0 + r.len) {
      const s = (run.x - r.x0) / r.len;
      run.y = r.h * s * s;
      run.angle = Math.atan(2 * r.h * s / r.len);
    } else if (run.x >= r.x0 + r.len) {
      run.phase = 'air'; run.airTime = 0;
      run.launchAngle = run.angle = r.theta; run.av = 0;
      const v = run.speed * 1.12;
      run.vx = v * Math.cos(r.theta); run.vy = v * Math.sin(r.theta); run.y = r.h;
      placeCoins(r, run.speed);
      emit(run, 'launch', {ramp: r.k});
    } else { run.y = 0; run.angle = 0; }
    return;
  }
  // 空中
  run.airTime += dt;
  const target = hold ? spinRate(run) : DRIFT;
  run.av += (target - run.av) * Math.min(1, dt * (hold ? 12 : 5));
  run.angle += (run.av + r.wind) * dt;
  run.x += run.vx * dt; run.vy -= G * dt; run.y += run.vy * dt;
  const car = r.car;
  let onRoof = false;
  if (car && !car.used && run.vy < 0) {
    // 取本步向下穿过车顶平面时的位置，排除从车头或车尾侧面进入。
    const sinceContact = (run.y - CAR_ROOF.height) / run.vy;
    const contactX = run.x - run.vx * sinceContact;
    const roofCenter = car.x + CAR_ROOF.offsetX;
    if (sinceContact >= 0 && sinceContact <= dt && Math.abs(contactX - roofCenter) <= car.len * CAR_ROOF.lengthRatio / 2) {
      onRoof = true;
      run.x = contactX;
      run.y = CAR_ROOF.height;
      run.angle -= (run.av + r.wind) * sinceContact;
    }
  }
  const reach = coinReach(run), cy = run.y + PIVOT;
  for (const c of r.coins) if (!c.got && Math.hypot(c.x - run.x, c.y - cy) < reach) {
    c.got = true; run.coins++; run.score += 5; emit(run, 'coin', {x: c.x, y: c.y});
  }
  if (run.y <= 0 && run.vy < 0 || onRoof) {
    run.y = onRoof ? CAR_ROOF.height : 0;
    const a = wrap(run.angle), err = Math.abs(a);
    const flips = airborneFlips(run);
    const tol = tolerance(run);
    if (err > tol.sloppy) {
      run.phase = 'crash';
      run.crash = {x: run.x, y: run.y, angle: run.angle, flips, pile: [...run.pile]};
      emit(run, 'crash', {head: Math.abs(a) > 2.2, flips});
      return;
    }
    const grade = err <= tol.perfect ? 'perfect' : err <= tol.ok ? 'ok' : 'sloppy';
    run.airFlips += flips;
    const mult = 1 + run.airFlips;
    const pts = Math.round(10 * run.pile.length * mult * (grade === 'perfect' ? 2 : 1));
    if (onRoof) {                                        // 踩车顶：弹起来再飞一次，翻转数接着算
      run.score += pts; run.bounces++;
      run.vy = 7.5; run.angle = a; run.launchAngle = a; run.av = 0;
      run.flips += flips; run.bestFlips = Math.max(run.bestFlips, run.airFlips);
      emit(run, 'bounce', {grade, flips, pts, mult});
      car.used = true;                                  // 同一辆车只弹一次
      return;
    }
    run.score += pts; run.jumps++; run.flips += flips; run.bestFlips = Math.max(run.bestFlips, run.airFlips);
    let lostItem = null;
    if (grade === 'perfect') { run.perfects++; run.streak++; run.speed = Math.min(12, run.speed + .5); }
    else { run.streak = 0; run.speed = Math.max(6.5, run.speed - (grade === 'sloppy' ? 1 : .3)); }
    if (grade === 'sloppy' && run.pile.length > 1) { lostItem = run.pile.pop(); run.lost++; }
    emit(run, 'land', {grade, flips: run.airFlips, pts, mult, lostItem, streak: run.streak});
    run.phase = 'ground'; run.angle = 0; run.av = 0; run.vy = 0; run.airFlips = 0;
    run.rampIndex++;
    while (run.score >= (MILESTONES[run.milestone] ?? Infinity)) { emit(run, 'milestone', {value: MILESTONES[run.milestone]}); run.milestone++; }
  }
}
