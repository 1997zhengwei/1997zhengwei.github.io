// ear-sdf.js —— 程序化人耳：2D 烘焙的耳廓起伏 + 3D 距离场（耳甲腔、耳道、耳屏），再用 surface nets 出网格。
// 单位 cm。耳朵局部坐标：x → 脑后（屏幕右），y ↑，z 朝镜头（离开头皮）。纯函数，Node 可跑：
//   node -e "import('./src/ear-sdf.js').then(E=>{const t=Date.now();const m=E.buildEar();console.log(m.positions.length/3,Date.now()-t)})"

const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const gauss = (v, w) => Math.exp(-(v * v) / (w * w));

// —— 耳廓外轮廓（顺时针：耳轮脚 → 顶 → 后缘 → 耳垂 → 前缘）——
const CTRL0 = [
  [-0.95, 1.05], [-1.08, 1.78], [-0.78, 2.48], [-0.18, 2.95], [0.55, 3.08], [1.22, 2.88], [1.72, 2.38],
  [1.98, 1.66], [2.04, 0.86], [1.9, 0.05], [1.64, -0.74], [1.32, -1.48], [1.02, -2.18], [0.78, -2.82],
  [0.38, -3.28], [-0.12, -3.36], [-0.52, -3.08], [-0.74, -2.58], [-0.96, -1.98], [-1.26, -1.46],
  [-1.46, -0.8], [-1.48, -0.02], [-1.28, 0.6],
];
// 每个控制点的"游离耳轮"权重（前缘贴着脸，没有卷边）
const RIMW = [0.05, 0.4, 0.9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.9, 0.55, 0.35, 0.2, 0, 0, 0, 0, 0, 0];

function catmull(pts, w, per = 10) {
  const out = [], ow = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      ow.push(w[i] + (w[(i + 1) % n] - w[i]) * t);
    }
  }
  return { pts: out, w: ow };
}
// 每位客人的耳朵参数：stand 外翻程度，lobe 耳垂大小，rim 耳轮卷边粗细
const DEFAULT_PARAMS = { stand: 1, lobe: 1, rim: 0.25 };
let PARAMS = { ...DEFAULT_PARAMS };
function outlineFor(P) {
  const pts = CTRL0.map(([x, y]) => (y < -1.9 ? [0.12 + (x - 0.12) * (0.8 + 0.2 * P.lobe), -1.9 + (y + 1.9) * P.lobe] : [x, y]));
  return catmull(pts, RIMW, 12);
}
let OUTLINE = outlineFor(PARAMS);
export function setParams(p) {
  PARAMS = { ...DEFAULT_PARAMS, ...(p || {}) };
  OUTLINE = outlineFor(PARAMS);
  FIELD = null;
}

function polyDist(px, py, poly) {
  // 带符号距离（里面为负）+ 最近点的参数索引
  let best = 1e9, bi = 0, inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i];
    const ex = bx - ax, ey = by - ay, wx = px - ax, wy = py - ay;
    const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
    const dx = wx - ex * t, dy = wy - ey * t, d = dx * dx + dy * dy;
    if (d < best) { best = d; bi = j + t; }
    if ((ay > py) !== (by > py) && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) inside = !inside;
  }
  return { d: inside ? -Math.sqrt(best) : Math.sqrt(best), s: bi };
}
function segDist(px, py, ax, ay, bx, by) {
  const ex = bx - ax, ey = by - ay, wx = px - ax, wy = py - ay;
  const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
  return Math.hypot(wx - ex * t, wy - ey * t);
}
function polylineDist(px, py, line) {
  let d = 1e9;
  for (let i = 0; i < line.length - 1; i++) d = Math.min(d, segDist(px, py, line[i][0], line[i][1], line[i + 1][0], line[i + 1][1]));
  return d;
}
const ANTIHELIX = [[0.42, -1.42], [0.86, -0.72], [1.02, 0.12], [0.92, 0.86], [0.62, 1.42]];
const SUP_CRUS = [[0.62, 1.42], [0.6, 2.0], [0.32, 2.42]];
const INF_CRUS = [[0.62, 1.42], [0.08, 1.5], [-0.56, 1.36]];
const HELIX_CRUS = [[-1.05, 1.05], [-0.62, 0.72], [-0.18, 0.48], [0.18, 0.36]];

// 头皮：微微鼓起的头侧
export const headZ = (x, y) => -((x - 0.4) ** 2) / 22 - ((y + 0.3) ** 2) / 34;

export const DOMAIN = { x0: -4.2, x1: 4.6, y0: -5.2, y1: 4.8 };
const G = 0.03;

// 耳道：从耳甲腔底部往头里斜插
export const CANAL = (() => {
  const o = [-0.68, -0.42, headZ(-0.68, -0.42) - 0.05];
  const dx = -0.22, dy = 0.12, dz = -1, l = Math.hypot(dx, dy, dz);
  return { o, d: [dx / l, dy / l, dz / l], len: 2.35, r0: 0.4, r1: 0.29 };
})();

function bake() {
  const nx = Math.ceil((DOMAIN.x1 - DOMAIN.x0) / G) + 1, ny = Math.ceil((DOMAIN.y1 - DOMAIN.y0) / G) + 1;
  const SD = new Float32Array(nx * ny), S = new Float32Array(nx * ny), B = new Float32Array(nx * ny), H = new Float32Array(nx * ny);
  const RW = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const y = DOMAIN.y0 + j * G;
    for (let i = 0; i < nx; i++) {
      const x = DOMAIN.x0 + i * G, k = j * nx + i;
      const pd = polyDist(x, y, OUTLINE.pts);
      const s0 = Math.floor(pd.s) % OUTLINE.w.length, s1 = (s0 + 1) % OUTLINE.w.length;
      const rimW = OUTLINE.w[s0] + (OUTLINE.w[s1] - OUTLINE.w[s0]) * (pd.s - Math.floor(pd.s));
      const d = Math.max(-pd.d, 0);
      const h = headZ(x, y);
      // 耳廓平面：越往后越翘，耳垂贴近脸
      const stand = sstep(-1.3, 1.7, x) * (1 - 0.62 * sstep(-1.7, -2.9, y)) + 0.12 * sstep(1.2, 2.9, y);
      const P = h + 0.12 + 1.18 * PARAMS.stand * stand;
      // 耳舟底
      let s = P - 0.2 - 0.1 * gauss(d - 0.7, 0.25);
      // 耳轮卷边
      const r = PARAMS.rim;
      const rimTop = P + 0.1 + Math.sqrt(Math.max(r * r - (d - r) * (d - r), 0)) - Math.max(d - 2 * r, 0) * 2.5;
      s = smax(s, rimTop * rimW + (P - 0.3) * (1 - rimW), 0.09);
      // 对耳轮 + 上下脚
      const da = polylineDist(x, y, ANTIHELIX), ds = polylineDist(x, y, SUP_CRUS), di = polylineDist(x, y, INF_CRUS);
      s = smax(s, P + 0.16 - da * da * 2.4, 0.1);
      s = smax(s, P + 0.02 - ds * ds * 2.6, 0.1);
      s = smax(s, P + 0.0 - di * di * 3.0, 0.1);
      // 三角窝
      s = smin(s, P - 0.3 + (((x - 0.28) / 0.32) ** 2 + ((y - 1.92) / 0.3) ** 2) * 0.14, 0.12);
      // 耳垂：肉乎乎、厚
      const ly = -1.9 + (PARAMS.lobe - 1) * -0.5;
      const wl = sstep(ly - 0.15, ly - 0.75, y);
      const lobeS = h + 0.3 + 0.26 * PARAMS.lobe * sstep(0, 0.7, d) + 0.1 * stand;
      s = s * (1 - wl) + lobeS * wl;
      let thick = 0.42 + 0.2 * wl + 0.1 * gauss(da, 0.3) + 0.12 * (1 - rimW);
      // 头：带耳屏
      let hf = h;
      const tg = ((x + 1.34) / 0.34) ** 2 + ((y + 0.5) / 0.52) ** 2;
      hf = smax(hf, h + 0.62 - 0.62 * tg, 0.18);
      SD[k] = pd.d; S[k] = s; B[k] = s - thick; H[k] = hf; RW[k] = rimW;
    }
  }
  const blur = (A, pass) => {
    const T = new Float32Array(A.length);
    for (let p = 0; p < pass; p++) {
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const a = Math.max(i - 1, 0), b = Math.min(i + 1, nx - 1);
        T[j * nx + i] = (A[j * nx + a] + 2 * A[j * nx + i] + A[j * nx + b]) * 0.25;
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const a = Math.max(j - 1, 0), b = Math.min(j + 1, ny - 1);
        A[j * nx + i] = (T[a * nx + i] + 2 * T[j * nx + i] + T[b * nx + i]) * 0.25;
      }
    }
  };
  blur(S, 3); blur(B, 3); blur(H, 2); blur(RW, 3);
  return { nx, ny, SD, S, B, H, RW };
}

let FIELD = null;
function field() { return FIELD || (FIELD = bake()); }
export function getField() { return field(); }
export function setField(f) { FIELD = f; }
function sample(A, x, y) {
  const F = field();
  const fx = clamp((x - DOMAIN.x0) / G, 0, F.nx - 1.001), fy = clamp((y - DOMAIN.y0) / G, 0, F.ny - 1.001);
  const i = fx | 0, j = fy | 0, tx = fx - i, ty = fy - j, k = j * F.nx + i;
  return (A[k] * (1 - tx) + A[k + 1] * tx) * (1 - ty) + (A[k + F.nx] * (1 - tx) + A[k + F.nx + 1] * tx) * ty;
}

function canalSDF(x, y, z) {
  const C = CANAL, wx = x - C.o[0], wy = y - C.o[1], wz = z - C.o[2] - 0.35;
  // 入口往外延伸一点，开口圆润
  let t = wx * C.d[0] + wy * C.d[1] + wz * C.d[2];
  const tc = clamp(t, -0.6, C.len);
  const px = wx - C.d[0] * tc, py = wy - C.d[1] * tc, pz = wz - C.d[2] * tc;
  const r = C.r0 + (C.r1 - C.r0) * clamp(tc / C.len, 0, 1);
  // 耳道微微弯：往前上方偏
  const bend = 0.12 * Math.sin(clamp(tc / C.len, 0, 1) * Math.PI);
  return Math.hypot(px + bend * 0.5, py - bend, pz) - r;
}
function conchaSDF(x, y, z) {
  const cz = headZ(-0.25, -0.35) + 0.62;
  const ex = (x + 0.28) / 0.98, ey = (y + 0.32) / 1.42, ez = (z - cz) / 0.95;
  const l = Math.hypot(ex, ey, ez);
  return (l - 1) * 0.92;
}

export function sdf(x, y, z) {
  const F = field();
  const sd = sample(F.SD, x, y), s = sample(F.S, x, y), b = sample(F.B, x, y), hf = sample(F.H, x, y);
  // 头
  let d = (z - hf) * 0.9;
  // 耳廓板：圆角挤出
  const t = s - b, m = (s + b) * 0.5;
  const rr = Math.min(0.22, t * 0.5 - 0.01);
  const qx = sd + rr, qz = Math.abs(z - m) - t * 0.5 + rr;
  const dp = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - rr;
  d = smin(d, dp, 0.22);
  // 耳甲腔挖下去
  d = smax(d, -conchaSDF(x, y, z), 0.2);
  // 耳轮脚：从耳轮前端伸进耳甲腔，越往里越低、越细，最后没入腔底
  {
    let best = 1e9, bu = 0;
    for (let i = 0; i < HELIX_CRUS.length - 1; i++) {
      const [ax, ay] = HELIX_CRUS[i], [bx, by] = HELIX_CRUS[i + 1];
      const ex = bx - ax, ey = by - ay, t = clamp(((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey), 0, 1);
      const dd = Math.hypot(x - ax - ex * t, y - ay - ey * t);
      if (dd < best) { best = dd; bu = (i + t) / (HELIX_CRUS.length - 1); }
    }
    const zc = headZ(x, y) + 0.42 - 0.62 * bu;
    const rad = 0.19 - 0.08 * bu;
    const tube = Math.hypot(best, (z - zc) * 1.25) - rad;
    d = smin(d, tube, 0.26);
  }
  // 耳轮脚根部和耳屏上方之间填一点肉，避免出现黑缝
  {
    const fx = (x + 1.12) / 0.42, fy = (y - 0.88) / 0.4, fz = (z - headZ(x, y) - 0.12) / 0.32;
    d = smin(d, (Math.hypot(fx, fy, fz) - 1) * 0.32, 0.25);
  }
  // 对耳屏
  {
    const ax = (x - 0.38) / 0.34, ay = (y + 1.5) / 0.3, az = (z - headZ(0.38, -1.5) - 0.42) / 0.3;
    d = smin(d, (Math.hypot(ax, ay, az) - 1) * 0.28, 0.2);
  }
  // 耳道
  d = smax(d, -canalSDF(x, y, z), 0.22);
  return d;
}

export function grad(x, y, z, e = 0.02) {
  const gx = sdf(x + e, y, z) - sdf(x - e, y, z);
  const gy = sdf(x, y + e, z) - sdf(x, y - e, z);
  const gz = sdf(x, y, z + e) - sdf(x, y, z - e);
  const l = Math.hypot(gx, gy, gz) || 1;
  return [gx / l, gy / l, gz / l];
}

// 光线求交（sphere tracing）。返回 {p, n, t} 或 null
export function trace(o, dir, tMax = 60) {
  let t = 0;
  for (let i = 0; i < 160; i++) {
    const x = o[0] + dir[0] * t, y = o[1] + dir[1] * t, z = o[2] + dir[2] * t;
    if (x < DOMAIN.x0 - 2 || x > DOMAIN.x1 + 2 || y < DOMAIN.y0 - 2 || y > DOMAIN.y1 + 2) { if (t > 0 && z < 4) return null; }
    const d = sdf(x, y, z);
    if (d < 0.002) return { p: [x, y, z], n: grad(x, y, z), t };
    t += Math.max(d * 0.8, 0.004);
    if (t > tMax) return null;
  }
  return null;
}

// 离耳道多深（>0 表示在耳道里）
// 耳道深度（只在耳道附近有效，离轴太远返回 -9）
export function canalDepth(x, y, z) {
  const C = CANAL;
  const wx = x - C.o[0], wy = y - C.o[1], wz = z - C.o[2] - 0.35;
  const t = wx * C.d[0] + wy * C.d[1] + wz * C.d[2];
  const rad = Math.hypot(wx - C.d[0] * t, wy - C.d[1] * t, wz - C.d[2] * t);
  if (rad > 0.85) return -9;
  return canalAxial(x, y, z);
}
export function canalAxial(x, y, z) {
  const C = CANAL;
  return (x - C.o[0]) * C.d[0] + (y - C.o[1]) * C.d[1] + (z - C.o[2] + 0.25) * C.d[2];
}
export function inConcha(x, y) { return ((x + 0.28) / 0.98) ** 2 + ((y + 0.32) / 1.42) ** 2 < 0.85; }

// —— surface nets（只在耳朵附近细分；外圈头皮另用高度网格）——
export const FINE = { x0: -2.15, x1: 2.7, y0: -4.0, y1: 3.75 };
export function buildEar(step = 0.055) {
  const T0 = Date.now();
  const F = field();
  const D = FINE, zMin = -3.0, zMax = 2.4;
  const nx = Math.ceil((D.x1 - D.x0) / step) + 1, ny = Math.ceil((D.y1 - D.y0) / step) + 1, nz = Math.ceil((zMax - zMin) / step) + 1;
  const V = new Float32Array(nx * ny * nz);
  const idx = (i, j, k) => (k * ny + j) * nx + i;
  const C = CANAL;
  for (let j = 0; j < ny; j++) {
    const y = D.y0 + j * step;
    for (let i = 0; i < nx; i++) {
      const x = D.x0 + i * step;
      const s = sample(F.S, x, y), b = sample(F.B, x, y), hf = sample(F.H, x, y), sd = sample(F.SD, x, y);
      const top = (sd < 0.35 ? Math.max(s, hf) : hf + 0.3) + 0.3;
      const nearCanal = Math.hypot(x - C.o[0] - 0.12, y - C.o[1]) < 1.2;
      const low = nearCanal ? zMin : inConcha(x, y) ? hf - 1.2 : Math.min(b, hf) - 0.4;
      for (let k = 0; k < nz; k++) {
        const z = zMin + k * step;
        V[idx(i, j, k)] = z > top ? 1 : z < low ? -1 : sdf(x, y, z);
      }
    }
  }
  const vid = new Int32Array(nx * ny * nz).fill(-1);
  const pos = [];
  const corners = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { const q = corners[c]; cv[c] = V[idx(i + q[0], j + q[1], k + q[2])]; if (cv[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, cnt = 0;
    for (const [a, b] of edges) {
      if ((cv[a] < 0) === (cv[b] < 0)) continue;
      const t = cv[a] / (cv[a] - cv[b]), qa = corners[a], qb = corners[b];
      sx += qa[0] + (qb[0] - qa[0]) * t; sy += qa[1] + (qb[1] - qa[1]) * t; sz += qa[2] + (qb[2] - qa[2]) * t; cnt++;
    }
    vid[idx(i, j, k)] = pos.length / 3;
    pos.push(D.x0 + (i + sx / cnt) * step, D.y0 + (j + sy / cnt) * step, zMin + (k + sz / cnt) * step);
  }
  const ind = [];
  const tri = (a, b, c, ax, sgn) => {
    // 用几何法线和期望朝向（沿轴、指向外面）比对，保证三角形一致朝外
    const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2];
    const vx = pos[c * 3] - pos[a * 3], vy = pos[c * 3 + 1] - pos[a * 3 + 1], vz = pos[c * 3 + 2] - pos[a * 3 + 2];
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx][ax];
    if (n * sgn >= 0) ind.push(a, b, c); else ind.push(a, c, b);
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const v0 = V[idx(i, j, k)];
    for (let a = 0; a < 3; a++) {
      const v1 = a === 0 ? V[idx(i + 1, j, k)] : a === 1 ? V[idx(i, j + 1, k)] : V[idx(i, j, k + 1)];
      if ((v0 < 0) === (v1 < 0)) continue;
      let q;
      if (a === 0) q = [idx(i, j - 1, k - 1), idx(i, j, k - 1), idx(i, j, k), idx(i, j - 1, k)];
      else if (a === 1) q = [idx(i - 1, j, k - 1), idx(i, j, k - 1), idx(i, j, k), idx(i - 1, j, k)];
      else q = [idx(i - 1, j - 1, k), idx(i, j - 1, k), idx(i, j, k), idx(i - 1, j, k)];
      const vv = [vid[q[0]], vid[q[1]], vid[q[2]], vid[q[3]]];
      if (vv[0] < 0 || vv[1] < 0 || vv[2] < 0 || vv[3] < 0) continue;
      const sgn = v0 < 0 ? 1 : -1;  // 里面→外面 的方向就是外法线
      tri(vv[0], vv[1], vv[2], a, sgn); tri(vv[0], vv[2], vv[3], a, sgn);
    }
  }
  const T1 = Date.now();
  const n = pos.length / 3;
  const positions = new Float32Array(pos), normals = new Float32Array(n * 3), thick = new Float32Array(n), ao = new Float32Array(n), depth = new Float32Array(n);
  const e = 0.012;
  for (let v = 0; v < n; v++) {
    let x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
    for (let it = 0; it < 2; it++) {
      const d = sdf(x, y, z);
      const gx = sdf(x + e, y, z) - d, gy = sdf(x, y + e, z) - d, gz = sdf(x, y, z + e) - d;
      const gl = (gx * gx + gy * gy + gz * gz) / (e * e) || 1;
      x -= (gx / e) * d / gl; y -= (gy / e) * d / gl; z -= (gz / e) * d / gl;
    }
    positions[v * 3] = x; positions[v * 3 + 1] = y; positions[v * 3 + 2] = z;
    const g = grad(x, y, z, 0.035);
    normals[v * 3] = g[0]; normals[v * 3 + 1] = g[1]; normals[v * 3 + 2] = g[2];
    const hf = sample(F.H, x, y);
    let th = 1.1;
    {
      let pv = sdf(x - g[0] * 0.03, y - g[1] * 0.03, z - g[2] * 0.03), pt = 0.03;
      for (let t = 0.09; t < 1.1; t += 0.07) {
        const v = sdf(x - g[0] * t, y - g[1] * t, z - g[2] * t);
        if (v > 0) { th = pt + (t - pt) * (-pv / (v - pv + 1e-6)); break; }
        pv = v; pt = t;
      }
    }
    thick[v] = th;
    let occ = 0;
    for (let s = 1; s <= 4; s++) { const h = s * 0.14; occ += (h - Math.max(sdf(x + g[0] * h, y + g[1] * h, z + g[2] * h), 0)) / (1 << s); }
    ao[v] = clamp(1 - occ * 3.0, 0.12, 1);
    depth[v] = canalDepth(x, y, z);
  }
  // 厚度沿网格邻接平滑两遍，去掉锯齿
  for (let pass = 0; pass < 3; pass++) {
    const acc = new Float32Array(n), cnt = new Float32Array(n);
    for (let f = 0; f < ind.length; f += 3) {
      const a = ind[f], b = ind[f + 1], c = ind[f + 2];
      acc[a] += thick[b] + thick[c]; acc[b] += thick[a] + thick[c]; acc[c] += thick[a] + thick[b];
      cnt[a] += 2; cnt[b] += 2; cnt[c] += 2;
    }
    for (let v = 0; v < n; v++) if (cnt[v]) thick[v] = thick[v] * 0.4 + (acc[v] / cnt[v]) * 0.6;
  }
  // 按顶点法线统一三角形朝向
  for (let f = 0; f < ind.length; f += 3) {
    const a = ind[f] * 3, b = ind[f + 1] * 3, c = ind[f + 2] * 3;
    const ux = positions[b] - positions[a], uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a], vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
    const nx_ = uy * vz - uz * vy, ny_ = uz * vx - ux * vz, nz_ = ux * vy - uy * vx;
    const sx = normals[a] + normals[b] + normals[c], sy = normals[a + 1] + normals[b + 1] + normals[c + 1], sz = normals[a + 2] + normals[b + 2] + normals[c + 2];
    if (nx_ * sx + ny_ * sy + nz_ * sz < 0) { const t = ind[f + 1]; ind[f + 1] = ind[f + 2]; ind[f + 2] = t; }
  }
  if (typeof process !== 'undefined' && process.env && process.env.EAR_PROFILE) console.log('grid', T1 - T0, 'verts', Date.now() - T1);
  return { positions, normals, index: n > 65535 ? new Uint32Array(ind) : new Uint16Array(ind), thick, ao, depth };
}

// 外圈头皮：整片高度网格，中间留出细网格的洞
export function buildHead(res = 0.2) {
  const D = { x0: -13, x1: 13, y0: -11, y1: 11 }, M = 0.18;
  const nx = Math.round((D.x1 - D.x0) / res) + 1, ny = Math.round((D.y1 - D.y0) / res) + 1;
  const pos = new Float32Array(nx * ny * 3), nor = new Float32Array(nx * ny * 3);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = D.x0 + i * res, y = D.y0 + j * res, k = (j * nx + i) * 3;
    pos[k] = x; pos[k + 1] = y; pos[k + 2] = headZ(x, y);
    const gx = (headZ(x + 0.01, y) - headZ(x - 0.01, y)) / 0.02, gy = (headZ(x, y + 0.01) - headZ(x, y - 0.01)) / 0.02;
    const l = Math.hypot(gx, gy, 1); nor[k] = -gx / l; nor[k + 1] = -gy / l; nor[k + 2] = 1 / l;
  }
  const ind = [];
  const inside = (x, y) => x > FINE.x0 + M && x < FINE.x1 - M && y > FINE.y0 + M && y < FINE.y1 - M;
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const x = D.x0 + i * res, y = D.y0 + j * res;
    if (inside(x, y) && inside(x + res, y) && inside(x, y + res) && inside(x + res, y + res)) continue;
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    ind.push(a, b, d, a, d, c);
  }
  return { positions: pos, normals: nor, index: new Uint32Array(ind) };
}

// 在耳甲腔 / 耳道壁上撒点（耳屑位置）
export function canalPoint(t) { const C = CANAL; return [C.o[0] + C.d[0] * t, C.o[1] + C.d[1] * t, C.o[2] + 0.35 + C.d[2] * t]; }
export function surfacePoints(rng, count, where) {
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 60) {
    let x, y, z;
    if (where === 'canal') {
      const C = CANAL, t = 0.55 + rng() * 1.45, a = rng() * Math.PI * 2;
      const c = [C.o[0] + C.d[0] * t, C.o[1] + C.d[1] * t, C.o[2] + 0.35 + C.d[2] * t];
      // 垂直于轴的两个方向
      const u = [0, 1, 0], ux = [C.d[1] * u[2] - C.d[2] * u[1], C.d[2] * u[0] - C.d[0] * u[2], C.d[0] * u[1] - C.d[1] * u[0]];
      const ul = Math.hypot(...ux); ux[0] /= ul; ux[1] /= ul; ux[2] /= ul;
      const vx = [C.d[1] * ux[2] - C.d[2] * ux[1], C.d[2] * ux[0] - C.d[0] * ux[2], C.d[0] * ux[1] - C.d[1] * ux[0]];
      x = c[0] + (ux[0] * Math.cos(a) + vx[0] * Math.sin(a)) * 0.3;
      y = c[1] + (ux[1] * Math.cos(a) + vx[1] * Math.sin(a)) * 0.3;
      z = c[2] + (ux[2] * Math.cos(a) + vx[2] * Math.sin(a)) * 0.3;
    } else {
      x = -0.28 + (rng() * 2 - 1) * 0.95; y = -0.32 + (rng() * 2 - 1) * 1.35;
      if (!inConcha(x, y)) continue;
      const h = trace([x, y, 4], [0, 0, -1], 10);
      if (!h) continue;
      [x, y, z] = h.p;
      if (z > headZ(x, y) + 0.35) continue;
    }
    for (let it = 0; it < 6; it++) { const d = sdf(x, y, z), g = grad(x, y, z); x -= g[0] * d; y -= g[1] * d; z -= g[2] * d; }
    if (Math.abs(sdf(x, y, z)) > 0.01) continue;
    const n = grad(x, y, z, 0.03);
    if (out.some(o => Math.hypot(o.p[0] - x, o.p[1] - y, o.p[2] - z) < 0.16)) continue;
    out.push({ p: [x, y, z], n, depth: canalDepth(x, y, z) });
  }
  return out;
}
