// 感恩节大游行 · 纯逻辑：路线生成、气球物理、碰撞、拾取（可在 Node 中测试）
// 坐标：d = 沿街前进距离（世界 z = -d），x = 横向（街道中线 0，右正），y = 高度。

export const STREET_HALF = 6;      // 车道半宽
export const CREW_LIMIT = 5;       // 拉绳队横向范围
export const BALLOON_AHEAD = 7;    // 气球在队伍前方的距离
export const CREW_MAX = 24;

// 超能力：无敌护盾 / 星星磁铁 / 号召观众
export const SKILLS = {
  shield: { name: '无敌护盾', icon: '🛡️', dur: 5, desc: '5 秒无敌，撞什么都撞飞' },
  magnet: { name: '星星磁铁', icon: '🧲', dur: 7, desc: '7 秒内附近星星自动飞来' },
  rally: { name: '号召观众', icon: '📣', dur: 0, desc: '立刻 +4 名拉绳手' },
};
export const ENERGY_PER_CHARGE = 8; // 每 8 颗星充能一次护盾

export const BALLOONS = {
  turkey: { name: '火鸡大气球', desc: '均衡好上手', rx: 2.1, ry: 2.0, rz: 2.1, air: 100, damage: 20, lat: 1.0, unlock: 0 },
  pumpkin: { name: '南瓜大气球', desc: '又大又耐撞，转向慢', rx: 2.55, ry: 2.15, rz: 2.4, air: 150, damage: 20, lat: 0.72, unlock: 1 },
  corn: { name: '玉米大气球', desc: '细长灵活，怕撞', rx: 1.35, ry: 2.7, rz: 1.35, air: 80, damage: 25, lat: 1.4, unlock: 2 },
};

export function balloonHeights(b) {
  // 低空：气球顶部在 5.5 以下（能钻过 6.0 的横幅/桥）；高空：底部在 6.4 以上（能越过 6.0 的红绿灯横杆）
  return { low: Math.max(2.4, 5.5 - b.ry), high: 6.4 + b.ry };
}

export const ROUTES = [
  { id: 1, name: '第五大道', sub: '新手路线', length: 520, speed0: 8, speed1: 10, seed: 11, density: 0.55, gust: 0, types: ['banner', 'arm', 'cones', 'trees', 'cart'] },
  { id: 2, name: '河畔大桥', sub: '注意侧风', length: 720, speed0: 9, speed1: 12, seed: 23, density: 0.7, gust: 0.22, types: ['banner', 'arm', 'cones', 'bridge', 'sign', 'trees', 'cart'] },
  { id: 3, name: '摩天楼峡谷', sub: '高手路线', length: 900, speed0: 10, speed1: 14, seed: 37, density: 0.85, gust: 0.3, types: ['banner', 'arm', 'cones', 'bridge', 'sign', 'trees', 'cart', 'combo'] },
  { id: 4, name: '无尽游行', sub: '能走多远？', length: Infinity, speed0: 9, speed1: 15, seed: 0, density: 0.7, gust: 0.25, types: ['banner', 'arm', 'cones', 'bridge', 'sign', 'trees', 'cart', 'combo'] },
];

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 路线生成 ----------
// 每个元素：{ id, type, d0, d1, x0, x1, y0, y1, ground?, side?, ... }
let nextId = 1;
function box(type, d, depth, x0, x1, y0, y1, extra = {}) {
  return { id: nextId++, type, d0: d - depth / 2, d1: d + depth / 2, x0, x1, y0, y1, ...extra };
}

export function createGenerator(route, seed) {
  const rng = mulberry32(seed ?? (route.seed || (Date.now() & 0xffff)));
  const R = (a, b) => a + (b - a) * rng();
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  let cursor = 45; // 开场留出空地
  let beat = 0;
  const firstSeen = new Set();

  function difficulty(d) {
    if (route.length === Infinity) return Math.min(1, d / 1500);
    return Math.min(1, d / route.length);
  }

  function starsLine(out, d0, d1, x, y, n = 4) {
    for (let i = 0; i < n; i++) {
      const d = d0 + ((d1 - d0) * i) / Math.max(1, n - 1);
      out.push({ id: nextId++, type: 'star', d0: d, d1: d, x, y });
    }
  }

  // 生成到 untilD 为止
  function generate(untilD) {
    const out = [];
    while (cursor < untilD) {
      const d = cursor;
      const diff = difficulty(d);
      beat++;
      // 教学顺序：第一条路线开头先出现单一类型
      let type;
      const tutorial = route.id === 1 ? ['cones', 'banner', 'arm', 'fans', 'trees', 'banner'] : [];
      if (beat <= tutorial.length) type = tutorial[beat - 1];
      else {
        const r = rng();
        if (r < 0.15) type = 'fans';
        else if (r < 0.2) type = 'pump';
        else if (r < 0.27) type = 'gift';
        else if (r < 0.22 + route.gust) type = 'gust';
        else type = pick(route.types);
      }
      const STAR_LOW = 4.0, STAR_HIGH = 8.6;
      switch (type) {
        case 'banner': {
          out.push(box('banner', d, 0.6, -9, 9, 6.0, 7.6));
          starsLine(out, d - 7, d + 5, R(-2.5, 2.5), STAR_LOW, 4);
          break;
        }
        case 'bridge': {
          out.push(box('bridge', d, 4.5, -11, 11, 6.0, 8.5));
          starsLine(out, d - 6, d + 6, R(-3, 3), STAR_LOW, 5);
          break;
        }
        case 'arm': {
          const side = rng() < 0.5 ? -1 : 1;
          const reach = R(0.2, 1.6) * -side; // 横杆伸过中线一点
          const x0 = side < 0 ? -9 : reach, x1 = side < 0 ? reach : 9;
          out.push(box('arm', d, 0.5, x0, x1, 5.1, 6.0, { side }));
          // 奖励：高空越过或绕到另一侧
          starsLine(out, d - 5, d + 5, side * 3, STAR_HIGH, 3);
          break;
        }
        case 'sign': {
          // 楼体侧面的高空招牌：贴边时会撞，靠中间或压低通过
          const side = rng() < 0.5 ? -1 : 1;
          const inner = R(1.5, 3.2);
          const x0 = side < 0 ? -12 : inner, x1 = side < 0 ? -inner : 12;
          out.push(box('sign', d, 3, x0, x1, 6.6, 12, { side }));
          starsLine(out, d - 6, d + 6, side * 4, STAR_LOW, 3);
          break;
        }
        case 'trees': {
          // 两侧行道树：低空贴边会被树冠刮到
          for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
            const dd = d - 10 + k * 10 + (s > 0 ? 4 : 0);
            out.push(box('tree', dd, 2.4, s < 0 ? -8.5 : 4.3, s < 0 ? -4.3 : 8.5, 2.5, 7.0, { side: s }));
          }
          starsLine(out, d - 10, d + 10, 0, rng() < 0.5 ? STAR_LOW : STAR_HIGH, 4);
          break;
        }
        case 'cones': {
          // 半边路障：队伍要换到另一边
          const side = rng() < 0.5 ? -1 : 1;
          const gapEdge = R(-1.2, 1.2);
          const x0 = side < 0 ? -6 : gapEdge + 0.4, x1 = side < 0 ? gapEdge - 0.4 : 6;
          out.push(box('cones', d, 1.0, x0, x1, 0, 1.0, { ground: true, side, loss: 2 }));
          break;
        }
        case 'cart': {
          // 路中间的南瓜推车：从两边绕
          const cx = R(-2.5, 2.5);
          out.push(box('cart', d, 2.2, cx - 1.3, cx + 1.3, 0, 1.6, { ground: true, loss: 3 }));
          break;
        }
        case 'combo': {
          // 横幅 + 地面路障：同时压低和换道
          out.push(box('banner', d, 0.6, -9, 9, 6.0, 7.6));
          const side = rng() < 0.5 ? -1 : 1;
          out.push(box('cones', d - 2, 1.0, side < 0 ? -6 : 0.6, side < 0 ? -0.6 : 6, 0, 1.0, { ground: true, side, loss: 2 }));
          starsLine(out, d - 7, d + 3, -side * 3, STAR_LOW, 3);
          break;
        }
        case 'fans': {
          const x = R(-4, 4);
          out.push({ id: nextId++, type: 'fans', d0: d, d1: d, x, n: rng() < 0.4 ? 4 : 3 });
          break;
        }
        case 'pump': {
          out.push({ id: nextId++, type: 'pump', d0: d, d1: d, x: R(-4, 4), amount: 30 });
          break;
        }
        case 'gift': {
          // 空中技能礼盒：让气球碰到就得到一次技能
          const kind = pick(['shield', 'magnet', 'rally']);
          out.push({ id: nextId++, type: 'gift', d0: d, d1: d, x: R(-3, 3), y: rng() < 0.5 ? STAR_LOW + 0.6 : STAR_HIGH - 0.4, kind });
          break;
        }
        case 'gust': {
          const dir = rng() < 0.5 ? -1 : 1;
          const len = R(28, 40);
          out.push({ id: nextId++, type: 'gust', d0: d, d1: d + len, dir, strength: 5.5 + diff * 4.5 });
          starsLine(out, d + 5, d + len - 5, -dir * 3.5, STAR_HIGH, 4);
          break;
        }
        default: break;
      }
      if (!firstSeen.has(type)) firstSeen.add(type);
      const gap = type === 'fans' || type === 'pump' || type === 'gift' ? R(12, 18) : type === 'gust' ? R(20, 28) : R(22, 34) * (1.25 - route.density * 0.5) * (1.1 - diff * 0.3);
      cursor += Math.max(14, gap);
    }
    return out.filter((it) => route.length === Infinity || it.d0 < route.length - 25);
  }
  return { generate, get cursor() { return cursor; } };
}

// ---------- 状态 ----------
export function createState(route, balloonKey, seed) {
  const b = BALLOONS[balloonKey];
  const h = balloonHeights(b);
  const gen = createGenerator(route, seed);
  const items = gen.generate(200);
  return {
    route, balloonKey, b, h, gen, items,
    t: 0, d: 0, speed: route.speed0,
    crewX: 0, crew: 6, crewInv: 0,
    bx: 0, by: h.high, bvx: 0,
    air: b.air, inv: 0,
    stars: 0, starsTotal: items.filter((i) => i.type === 'star').length,
    taken: new Set(), done: false, result: null, events: [],
    wind: 0, gustDir: 0,
    shield: 0, magnet: 0, energy: 0,
    charges: { shield: 1, magnet: 1, rally: 1 },
    smashed: 0, coins: 0, score: 0,
  };
}

function inBoxEllipsoid(cx, cy, cz, rx, ry, rz, it) {
  // 气球椭球与盒子相交（近似：盒内最近点在椭球内）
  const px = Math.max(it.x0, Math.min(cx, it.x1));
  const py = Math.max(it.y0, Math.min(cy, it.y1));
  const pz = Math.max(it.d0, Math.min(cz, it.d1));
  const dx = (px - cx) / rx, dy = (py - cy) / ry, dz = (pz - cz) / rz;
  return dx * dx + dy * dy + dz * dz <= 1;
}

export function useSkill(s, kind) {
  if (s.done || !(s.charges[kind] > 0)) return false;
  if (kind === 'shield' && s.shield > 0) return false;
  if (kind === 'magnet' && s.magnet > 0) return false;
  s.charges[kind]--;
  if (kind === 'shield') s.shield = SKILLS.shield.dur;
  if (kind === 'magnet') s.magnet = SKILLS.magnet.dur;
  if (kind === 'rally') s.crew = Math.min(CREW_MAX, s.crew + 4);
  s.events.push({ e: 'skill', kind });
  return true;
}

export function crewHalfWidth(n) { return 0.8 + Math.min(n, 16) * 0.04; }
export function grip(n) { return 0.4 + 0.6 * Math.min(1, n / 12); }

// input: { targetX, pull }
export function step(s, input, dt) {
  if (s.done) return s;
  s.events.length = 0;
  const prevD = s.d;
  s.t += dt;
  const R = s.route;
  const prog = R.length === Infinity ? Math.min(1, s.d / 1500) : Math.min(1, s.d / R.length);
  s.speed = R.speed0 + (R.speed1 - R.speed0) * prog;
  s.d += s.speed * dt;
  if (R.length === Infinity || s.d < R.length) {
    const need = s.d + 200;
    if (s.gen.cursor < need) {
      const more = s.gen.generate(need);
      s.items.push(...more);
      s.starsTotal += more.filter((i) => i.type === 'star').length;
    }
  }
  // 队伍横移
  const tx = Math.max(-CREW_LIMIT, Math.min(CREW_LIMIT, input.targetX ?? s.crewX));
  const maxV = 10 * dt;
  s.crewX += Math.max(-maxV, Math.min(maxV, tx - s.crewX));

  // 风
  const bd = s.d + BALLOON_AHEAD;
  let wind = 0, gustDir = 0;
  for (const it of s.items) {
    if (it.type === 'gust' && bd >= it.d0 && bd <= it.d1) { wind = it.dir * it.strength; gustDir = it.dir; }
  }
  s.wind = wind; s.gustDir = gustDir;

  // 气球横向：弹簧 + 阻尼 + 风
  const g = grip(s.crew);
  const k = 3.4 * s.b.lat * g;
  const c = 2.2 * Math.sqrt(k);
  const ax = k * (s.crewX - s.bx) - c * s.bvx + wind * (1.25 - g * 0.75);
  s.bvx += ax * dt;
  s.bx += s.bvx * dt;
  s.bx = Math.max(-8, Math.min(8, s.bx));

  // 高度：按住拉低；人越多拉得越快
  const target = input.pull && s.crew > 0 ? s.h.low : s.h.high;
  const down = Math.min(10, 3 + s.crew * 0.5);
  const up = 4.2;
  const dy = target - s.by;
  s.by += Math.max(-down * dt, Math.min(up * dt, dy));

  s.inv = Math.max(0, s.inv - dt);
  s.shield = Math.max(0, s.shield - dt);
  s.magnet = Math.max(0, s.magnet - dt);
  s.crewInv = Math.max(0, s.crewInv - dt);

  // 碰撞与拾取
  const hw = crewHalfWidth(s.crew);
  for (const it of s.items) {
    if (s.taken.has(it.id)) continue;
    if (it.d1 < s.d - 10) continue;
    if (it.d0 > bd + 5) continue;
    switch (it.type) {
      case 'star': case 'gift': {
        const m = it.type === 'gift' ? 0.9 : 0.6;
        const dx = (it.x - s.bx) / (s.b.rx + m), dy2 = (it.y - s.by) / (s.b.ry + m), dz = (it.d0 - bd) / (s.b.rz + m);
        const near = dx * dx + dy2 * dy2 + dz * dz <= 1;
        const pulled = it.type === 'star' && s.magnet > 0 && it.d0 > bd - 3 && it.d0 < bd + 14 && Math.abs(it.x - s.bx) < 8;
        if (near || pulled) {
          s.taken.add(it.id);
          if (it.type === 'gift') { s.charges[it.kind] = (s.charges[it.kind] || 0) + 1; s.events.push({ e: 'gift', it, kind: it.kind }); }
          else {
            s.stars++;
            s.events.push({ e: 'star', it, magnet: !near });
            s.energy++;
            if (s.energy >= ENERGY_PER_CHARGE) { s.energy = 0; s.charges.shield++; s.events.push({ e: 'charge', kind: 'shield' }); }
          }
        }
        break;
      }
      case 'fans': case 'pump': {
        if (prevD < it.d0 && s.d >= it.d0) {
          if (Math.abs(it.x - s.crewX) < hw + 1.5) {
            s.taken.add(it.id);
            if (it.type === 'fans') { s.crew = Math.min(CREW_MAX, s.crew + it.n); s.events.push({ e: 'fans', it, n: it.n }); }
            else { const before = s.air; s.air = Math.min(s.b.air, s.air + it.amount); s.events.push({ e: 'pump', it, n: Math.round(s.air - before) }); }
          }
        }
        break;
      }
      case 'gust': break;
      default: {
        if (it.ground) {
          // 队伍前排越过时判断
          if (s.d + 0.6 >= it.d0 && s.d - 0.6 <= it.d1 && s.crewX + hw > it.x0 && s.crewX - hw < it.x1 && s.crewInv <= 0) {
            s.taken.add(it.id);
            if (s.shield > 0) { s.smashed++; s.events.push({ e: 'smash', it, ground: true }); break; }
            const loss = Math.min(s.crew, it.loss || 2);
            s.crew -= loss;
            s.crewInv = 0.5;
            s.events.push({ e: 'trip', it, n: loss });
          }
        } else if (s.shield > 0 && inBoxEllipsoid(s.bx, s.by, bd, s.b.rx, s.b.ry, s.b.rz, it)) {
          s.taken.add(it.id);
          s.smashed++;
          s.events.push({ e: 'smash', it });
        } else if (s.inv <= 0 && inBoxEllipsoid(s.bx, s.by, bd, s.b.rx, s.b.ry, s.b.rz, it)) {
          s.air = Math.max(0, s.air - s.b.damage);
          s.inv = 1.1;
          // 反弹
          const cx = (it.x0 + it.x1) / 2;
          const away = it.x1 - it.x0 > 12 ? 0 : Math.sign(s.bx - cx) || 1;
          s.bvx += away * 5;
          s.events.push({ e: 'hit', it });
        }
      }
    }
  }
  // 回收身后元素
  if (s.items.length > 400) s.items = s.items.filter((it) => it.d1 > s.d - 30);

  if (s.air <= 0) finish(s, false, 'pop');
  else if (s.crew <= 0) finish(s, false, 'flyaway');
  else if (s.route.length !== Infinity && s.d >= s.route.length) finish(s, true, 'finish');
  return s;
}

function finish(s, win, why) {
  s.done = true;
  const airPct = s.air / s.b.air;
  const starPct = s.starsTotal ? s.stars / s.starsTotal : 0;
  let stars = 0;
  if (win) {
    stars = 1;
    if (airPct >= 0.5) stars = 2;
    if (airPct >= 0.5 && starPct >= 0.6) stars = 3;
  }
  const score = scoreOf(s, win, stars);
  s.score = score;
  s.coins = coinsOf(score, stars, win);
  s.result = { win, why, stars, airPct, starPct, dist: Math.round(s.d), score, coins: s.coins };
}

// 得分：星星 ×10、距离 ×1、剩余气量、队伍人数、撞飞障碍、通关奖励
export function scoreOf(s, win, stars) {
  return Math.round(s.stars * 10 + s.d + (s.air / s.b.air) * 200 + s.crew * 5 + s.smashed * 15 + (win ? 300 + stars * 150 : 0));
}
export function coinsOf(score, stars, win) {
  return Math.round(score / 10) + (win ? stars * 20 : 0);
}

// 段位：按最高分
export const RANKS = [
  { min: 0, name: '游行新手', icon: '🥉' },
  { min: 1200, name: '街头领队', icon: '🥈' },
  { min: 2000, name: '明星领队', icon: '🥇' },
  { min: 3000, name: '金牌领队', icon: '🏆' },
  { min: 4500, name: '传奇领队', icon: '👑' },
];
export function rankOf(score) {
  let r = RANKS[0];
  for (const x of RANKS) if (score >= x.min) r = x;
  return r;
}

// 拷贝用于前瞻（机器人测试）
export function cloneState(s) {
  return { ...s, charges: { ...s.charges }, taken: new Set(s.taken), events: [], items: s.items, gen: { generate: () => [], cursor: Infinity }, b: s.b, h: s.h };
}
