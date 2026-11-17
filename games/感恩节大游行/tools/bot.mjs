// 前瞻机器人：验证路线可通关（不是游戏 AI）
import { createState, step, cloneState, ROUTES, BALLOONS } from '../src/sim.mjs';

const TARGETS = [-4.5, -3, -1.5, 0, 1.5, 3, 4.5];

function score(s0, action, horizon, dt) {
  const s = cloneState(s0);
  let crew0 = s.crew, air0 = s.air, stars0 = s.stars;
  for (let t = 0; t < horizon; t += dt) {
    step(s, action, dt);
    if (s.done) break;
  }
  let v = 0;
  v -= (air0 - s.air) * 50;
  v += (s.crew - crew0) * 60;
  v += (s.stars - stars0) * 6;
  if (s.done && !s.result.win) v -= 1e6;
  v -= Math.abs(action.targetX) * 0.3;
  return v;
}

export function runBot(route, balloonKey, seed, { dt = 1 / 30, decide = 0.2, horizon = 2.2, maxT = 400 } = {}) {
  const s = createState(route, balloonKey, seed);
  let action = { targetX: 0, pull: false };
  let next = 0;
  while (!s.done && s.t < maxT) {
    if (s.t >= next) {
      let best = -Infinity;
      for (const tx of TARGETS) for (const pull of [false, true]) {
        const a = { targetX: tx, pull };
        const v = score(s, a, horizon, 1 / 15);
        if (v > best) { best = v; action = a; }
      }
      next = s.t + decide;
    }
    step(s, action, dt);
    if (route.length === Infinity && s.d > 1200) break;
  }
  return s;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('bot.mjs')) {
  for (const route of ROUTES) {
    for (const bk of Object.keys(BALLOONS)) {
      const t0 = Date.now();
      const s = runBot(route, bk, route.seed || 5);
      const r = s.result || { win: 'endless', dist: Math.round(s.d) };
      console.log(`${route.name} ${bk}: win=${r.win} why=${r.why} dist=${r.dist} air=${Math.round(s.air)}/${s.b.air} crew=${s.crew} stars=${s.stars}/${s.starsTotal} ★${r.stars ?? '-'} (${Date.now() - t0}ms)`);
    }
  }
}
