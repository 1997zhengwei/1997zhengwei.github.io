// 难度标定：不同水平的机器人跑六关，看羽毛数、三项分、星级是否逐关拉开
import { createRun, step, hazardX, LEVELS, HAZ_W, gateBounds, gateResult, mulberry32 } from '../src/game.mjs';

// skill: 1 = 高手（选门全对、反应快）；0.5 = 普通；0.2 = 手残
export function makeBot(skill, seed = 1) {
  const rng = mulberry32(seed);
  let plan = null, nextThink = 0;
  return (s) => {
    if (s.t < nextThink && plan !== null) return { targetX: plan };
    nextThink = s.t + 0.05 + (1 - skill) * 0.25 * rng();          // 反应间隔
    const look = 8 + skill * 8;
    const ahead = s.items.filter((it) => !s.taken.has(it.id) && it.d > s.d && it.d < s.d + look);
    let tx = s.x;
    const v = s.speed;
    const gates = ahead.filter((it) => it.type === 'gate');
    const fe = ahead.find((it) => ['feather', 'horn', 'cage', 'corn', 'ramp'].includes(it.type));
    const cg = ahead.find((it) => it.type === 'cage' || it.type === 'corn');
    if (cg && (!gates.length || cg.d < gates[0].d) && rng() < 0.3 + skill * 0.7) tx = cg.x;
    else if (gates.length) {
      const d0 = gates[0].d;
      const pair = gates.filter((g) => g.d === d0);
      const n = s.feathers.length;
      let best = pair.slice().sort((a, b) => gateResult(n, b) - gateResult(n, a))[0];
      // 低水平：凭颜色选（蓝门），动脑门常选错
      if (rng() > skill) best = pair.find((g) => g.op === '+' || g.op === 'x') || pair[Math.floor(rng() * 2)];
      if (rng() > 0.5 + skill * 0.5) best = pair[Math.floor(rng() * pair.length)];
      const [a, b] = gateBounds(best, s.t + (best.d - s.d) / v);
      tx = (a + b) / 2;
    } else if (fe && rng() < 0.4 + skill * 0.6) tx = fe.x;
    const hz = ahead.filter((it) => HAZ_W[it.type] && it.d < s.d + 4 + skill * 4);
    if (rng() < 0.55 + skill * 0.45) {
      const bad = hz.find((h) => Math.abs(hazardX(h, s.t + (h.d - s.d) / v) - tx) < HAZ_W[h.type] + 0.45);
      if (bad) {
        const cands = [-2.4, -1.2, 0, 1.2, 2.4].filter((c) => hz.every((h) => Math.abs(hazardX(h, s.t + (h.d - s.d) / v) - c) > HAZ_W[h.type] + 0.45));
        if (cands.length) tx = cands.sort((a, b) => Math.abs(a - s.x) - Math.abs(b - s.x))[0];
      }
    }
    plan = tx;
    return { targetX: tx };
  };
}

export function play(L, skill, seed) {
  const s = createRun(L);
  const bot = makeBot(skill, seed);
  for (let i = 0; i < 60 * 90 && s.state === 'run'; i++) step(s, bot(s), 1 / 60);
  return s;
}

if (/calib\.mjs$/.test(process.argv[1] || '')) {
  for (const L of LEVELS) {
    const row = [];
    for (const sk of [1, 0.6, 0.3]) {
      let tot = 0, n = 0, st = 0, hits = 0; const J = [0, 0, 0]; const K = 8;
      for (let k = 0; k < K; k++) {
        const s = play(L, sk, 7 + k * 13);
        tot += s.result.total; n += s.result.n; st += s.result.stars; hits += s.stats.hits;
        s.result.judges.forEach((v, i) => (J[i] += v));
      }
      row.push(`skill${sk}: n=${(n / K).toFixed(0)} 分=${(tot / K).toFixed(1)} [${J.map((v) => (v / K).toFixed(1)).join('/')}] ★${(st / K).toFixed(1)} 撞${(hits / K).toFixed(1)}`);
    }
    const s0 = createRun(L);
    console.log(`${L.name} par${L.par} 可吃${s0.stats.avail}根 门${s0.items.filter((i) => i.type === 'gate').length / 2}个 危险${s0.items.filter((i) => HAZ_W[i.type]).length}个\n   ` + row.join('\n   '));
  }
}
