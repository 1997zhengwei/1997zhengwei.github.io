// rules.js —— 糖果小岛 v6：一圈果子种在岛上，剥光咬掉后原地再长出来。没有关卡、分数、计时、收集。
// 纯函数，Node 可直接跑：node -e "import('./rules.js').then(R=>console.log(R.layout(R.FRUITS[0]).pos.length))"

export const FRUITS = [
  { fruit: 'strawberry', name: '草莓', flesh: '#ff9aa8', juice: 0xff5a7a, palette: ['pink', 'gold', 'sky'], shells: 30 },
  { fruit: 'orange', name: '香橙', flesh: '#ffc061', juice: 0xffa62b, palette: ['gold', 'pink', 'mint'], shells: 30 },
  { fruit: 'peach', name: '蜜桃', flesh: '#ffe2a8', juice: 0xffc98a, palette: ['pink', 'mint', 'gold'], shells: 30 },
  { fruit: 'blueberry', name: '蓝莓', flesh: '#d9e6b4', juice: 0x8b7bff, palette: ['sky', 'mint', 'pink'], shells: 28 },
  { fruit: 'grape', name: '青提', flesh: '#e8f7b8', juice: 0xb6e05a, palette: ['mint', 'gold', 'sky'], shells: 32 },
  { fruit: 'skewer', name: '山楂串', flesh: '#ffe0b0', juice: 0xff4a4a, palette: ['pink', 'gold', 'sky'], shells: 34 },
];
export const SLOTS = 8;           // 岛上一圈 8 个位置
export const BITES = 3;
export const JAR_CAP = 520;

export function seededRng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; };
}

export function spherePoints(n, rng) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const off = rng() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const y = 0.84 - (i + 0.5) / n * 1.74;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i + off + (rng() - 0.5) * 0.25;
    pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
  }
  return pts;
}

// 每种果子的壳的切法固定（几何体缓存复用），颜色每次长出来都重新分配
export function layout(spec) {
  const rng = seededRng(20261128 + spec.shells * 131 + spec.fruit.length * 7);
  const pos = spherePoints(spec.shells, rng);
  return { pos, shells: pos.map((p, i) => ({ id: i, pos: p })) };
}

// 颜色"成团生长"：相邻同色连成小片，好看
export function colorize(adj, palette, rng = Math.random) {
  const n = adj.length, colors = new Array(n).fill(null);
  let guard = 0;
  while (colors.some(c => c === null) && guard++ < 999) {
    const free = colors.map((c, i) => (c === null ? i : -1)).filter(i => i >= 0);
    const start = free[Math.floor(rng() * free.length)];
    const c = palette[Math.floor(rng() * palette.length)];
    const size = 3 + Math.floor(rng() * 5);
    const queue = [start];
    let got = 0;
    while (queue.length && got < size) {
      const i = queue.splice(Math.floor(rng() * queue.length), 1)[0];
      if (colors[i] !== null) continue;
      colors[i] = c; got++;
      for (const j of adj[i]) if (colors[j] === null) queue.push(j);
    }
  }
  return colors;
}

// 再生时挑一种和左右邻居都不一样的果子
export function pickRegrow(neighborTypes, rng = Math.random) {
  const opts = FRUITS.map((_, i) => i).filter(i => !neighborTypes.includes(i));
  return opts[Math.floor(rng() * opts.length)];
}

export function emptyJar() { return { layers: [], total: 0, full: 0 }; }
export function jarAdd(jar, color, n = 1) {
  const top = jar.layers[jar.layers.length - 1];
  if (top && top.c === color) top.n += n; else jar.layers.push({ c: color, n });
  jar.total += n;
  if (jar.total >= JAR_CAP) { jar.full += 1; jar.layers = []; jar.total = 0; return true; }
  return false;
}
export function loadJar(meta) {
  return meta.jar && Array.isArray(meta.jar.layers) ? { layers: meta.jar.layers.map(l => ({ ...l })), total: meta.jar.total || 0, full: meta.jar.full || 0 } : emptyJar();
}
