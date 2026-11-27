// models.js —— 程序化高精度水果 / 贴合式糖衣碎壳 / 工具模型 / 程序贴图（零外部资源）
import * as THREE from 'three';

const V3 = THREE.Vector3;

// ======================= 噪声与随机 =======================
function hashi(x, y, z) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
export function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = smooth(x - xi), v = smooth(y - yi), w = smooth(z - zi);
  return lerp(
    lerp(lerp(hashi(xi, yi, zi), hashi(xi + 1, yi, zi), u), lerp(hashi(xi, yi + 1, zi), hashi(xi + 1, yi + 1, zi), u), v),
    lerp(lerp(hashi(xi, yi, zi + 1), hashi(xi + 1, yi, zi + 1), u), lerp(hashi(xi, yi + 1, zi + 1), hashi(xi + 1, yi + 1, zi + 1), u), v),
    w,
  );
}
export function fbm3(x, y, z) {
  return vnoise(x, y, z) * 0.55 + vnoise(x * 2.03 + 5.1, y * 2.03, z * 2.03) * 0.3 + vnoise(x * 4.1, y * 4.1 + 3.3, z * 4.1) * 0.15;
}
// 可平铺 2D 噪声（周期 P）
function tnoise(x, y, P) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = smooth(x - xi), v = smooth(y - yi);
  const h = (a, b) => hashi(((a % P) + P) % P, ((b % P) + P) % P, 17);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}
export function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; };
}
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const col = hex => new THREE.Color(hex);

// ======================= 程序贴图 =======================
function canvasTex(w, h, draw, { srgb = true, repeat = false } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function normalFromHeight(w, h, heightAt, strength) {
  const H = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) H[y * w + x] = heightAt(x, y);
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const l = H[y * w + ((x - 1 + w) % w)], r = H[y * w + ((x + 1) % w)];
      const u = H[((y - 1 + h) % h) * w + x], d = H[((y + 1) % h) * w + x];
      let nx = (l - r) * strength, ny = (d - u) * strength, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * w + x) * 4;
      data[i] = (nx / len * 0.5 + 0.5) * 255;
      data[i + 1] = (ny / len * 0.5 + 0.5) * 255;
      data[i + 2] = (nz / len * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

let TEX = null;
export function textures() {
  if (TEX) return TEX;
  const rnd = seeded(77);
  TEX = {
    // 金壳/裂壳的发光裂纹（emissiveMap）
    crack: canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 5;
      for (let i = 0; i < 9; i++) {
        let a = (i / 9) * Math.PI * 2 + rnd() * 0.5, x = 128, y = 128, len = 0;
        const pts = [[x, y]];
        while (len < 125) {
          const st = 9 + rnd() * 12; a += (rnd() - 0.5) * 0.8;
          x += Math.cos(a) * st; y += Math.sin(a) * st; len += st; pts.push([x, y]);
        }
        ctx.lineWidth = 3.2 - i * 0.12;
        ctx.beginPath(); pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
        for (let b = 2; b < pts.length - 1; b += 2) {
          if (rnd() < 0.55) continue;
          let [bx, by] = pts[b]; let ba = a + (rnd() < 0.5 ? 1 : -1) * (0.7 + rnd() * 0.6);
          ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(bx, by);
          for (let s = 0; s < 3; s++) { bx += Math.cos(ba) * 9; by += Math.sin(ba) * 9; ba += (rnd() - 0.5) * 0.9; ctx.lineTo(bx, by); }
          ctx.stroke();
        }
      }
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 26);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(128, 128, 26, 0, Math.PI * 2); ctx.fill();
    }, { srgb: false }),
    // 娇嫩壳：虚线圈 + 小爱心（emissiveMap，颜色随工具切换）
    fragile: canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; ctx.setLineDash([17, 12]); ctx.lineCap = 'round';
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(128, 128, 74, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(128, 150);
      ctx.bezierCurveTo(96, 128, 100, 100, 118, 104);
      ctx.bezierCurveTo(124, 105, 128, 112, 128, 116);
      ctx.bezierCurveTo(128, 112, 132, 105, 138, 104);
      ctx.bezierCurveTo(156, 100, 160, 128, 128, 150);
      ctx.fill();
    }, { srgb: false }),
    emblem: Object.fromEntries(['heart', 'star', 'drop', 'diamond', 'crown'].map(shape => [shape, canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      ctx.translate(128, 128); ctx.beginPath();
      if (shape === 'heart') {
        ctx.moveTo(0, 26); ctx.bezierCurveTo(-38, 0, -30, -34, -10, -30); ctx.bezierCurveTo(-4, -29, 0, -22, 0, -16);
        ctx.bezierCurveTo(0, -22, 4, -29, 10, -30); ctx.bezierCurveTo(30, -34, 38, 0, 0, 26);
      } else if (shape === 'star' || shape === 'crown') {
        const R1 = shape === 'crown' ? 36 : 32, R2 = R1 * 0.45;
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R2 : R1; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      } else if (shape === 'drop') {
        ctx.moveTo(0, -32); ctx.bezierCurveTo(14, -12, 26, 2, 22, 14); ctx.arc(0, 12, 22, 0.1, Math.PI - 0.1); ctx.bezierCurveTo(-26, 2, -14, -12, 0, -32);
      } else {
        ctx.moveTo(0, -32); ctx.lineTo(24, 0); ctx.lineTo(0, 32); ctx.lineTo(-24, 0);
      }
      ctx.closePath(); ctx.fill();
      if (shape === 'crown') { ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.stroke(); }
    }, { srgb: false })])),
    // 冰糖厚壳磨砂粗糙度
    frost: canvasTex(256, 256, (ctx) => {
      const img = ctx.createImageData(256, 256);
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        const n = tnoise(x / 9, y / 9, 256 / 9 | 0) * 0.6 + tnoise(x / 3, y / 3, 85) * 0.4;
        const v = 120 + n * 135; const i = (y * 256 + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }, { srgb: false, repeat: true }),
    // 糖衣流淌波纹法线
    ripple: normalFromHeight(256, 256, (x, y) => tnoise(x / 32, y / 32, 8) * 0.7 + tnoise(x / 12, y / 12, 21) * 0.3, 2.4),
    // 橙皮油胞凹点法线（经纬展开）
    orangePores: (() => {
      const W = 1024, H = 512, h = new Float32Array(W * H);
      const r2 = seeded(5);
      for (let i = 0; i < 9000; i++) {
        const cx = r2() * W, cy = r2() * H, rad = 2.2 + r2() * 2.6, dep = 0.6 + r2() * 0.4;
        const sx = Math.max(1, rad / Math.max(0.25, Math.sin(Math.PI * cy / H)));
        for (let y = Math.floor(cy - rad); y <= cy + rad; y++) {
          if (y < 0 || y >= H) continue;
          for (let x = Math.floor(cx - sx); x <= cx + sx; x++) {
            const dx = (x - cx) / sx, dy = (y - cy) / rad, d2 = dx * dx + dy * dy;
            if (d2 < 1) { const xx = ((x % W) + W) % W; h[y * W + xx] -= dep * (1 - d2) * (1 - d2); }
          }
        }
      }
      return normalFromHeight(W, H, (x, y) => h[y * W + x], 1.1);
    })(),
    // 软绒细噪（桃/蓝莓）
    fuzz: normalFromHeight(512, 256, (x, y) => tnoise(x / 3, y / 3, 170) * 0.5 + tnoise(x / 14, y / 10, 36) * 0.5, 1.2),
    // 山楂表皮：深红 + 浅色皮孔斑点
    hawthorn: canvasTex(512, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#a50f1f'); g.addColorStop(0.45, '#d21f2c'); g.addColorStop(1, '#9e0c1c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        const x = rnd() * w, y = 14 + rnd() * (h - 28);
        ctx.fillStyle = `rgba(${240 + rnd() * 15 | 0},${170 + rnd() * 60 | 0},${110 + rnd() * 50 | 0},${0.35 + rnd() * 0.45})`;
        ctx.beginPath(); ctx.ellipse(x, y, 0.8 + rnd() * 1.6, 0.6 + rnd() * 1.1, 0, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(80,0,10,${0.1 + rnd() * 0.12})`;
        ctx.beginPath(); ctx.ellipse(rnd() * w, rnd() * h, 6 + rnd() * 14, 4 + rnd() * 8, rnd() * 3, 0, Math.PI * 2); ctx.fill();
      }
    }),
    woodGrain: canvasTex(64, 256, (ctx, w, h) => {
      ctx.fillStyle = '#e9c99b'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        ctx.strokeStyle = `rgba(150,100,55,${0.12 + rnd() * 0.18})`; ctx.lineWidth = 0.6 + rnd() * 1.4;
        const x0 = rnd() * w; ctx.beginPath(); ctx.moveTo(x0, 0);
        for (let y = 0; y <= h; y += 16) ctx.lineTo(x0 + Math.sin(y * 0.03 + i) * 2.5, y);
        ctx.stroke();
      }
    }, { repeat: true }),
    // 粒子：星芒 / 圆点 / 冲击环 / 腮红
    star: canvasTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 40);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const lg = ctx.createLinearGradient(64 - dx * 62, 64 - dy * 62, 64 + dx * 62, 64 + dy * 62);
        lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,1)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = lg;
        if (dx) ctx.fillRect(2, 62, 124, 4); else ctx.fillRect(62, 2, 4, 124);
      }
    }),
    dot: canvasTex(64, 64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    }),
    ring: canvasTex(128, 128, (ctx) => {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2); ctx.stroke();
    }),
    blush: canvasTex(64, 64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 31);
      g.addColorStop(0, 'rgba(255,92,128,0.75)'); g.addColorStop(0.6, 'rgba(255,110,140,0.35)'); g.addColorStop(1, 'rgba(255,120,150,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    }),
  };
  return TEX;
}

// ======================= 几何工具 =======================
// 沿射线从外向内找最外层表面（星形包络），对并集/平滑并集都稳
function radialBySDF(sdf, d, hi = 2.0, step = 0.035) {
  let s = hi;
  while (s > 0.03) {
    const s2 = s - step;
    if (sdf(d.x * s2, d.y * s2, d.z * s2) <= 0) {
      let lo = s2, h = s;
      for (let i = 0; i < 14; i++) { const m = (lo + h) * 0.5; if (sdf(d.x * m, d.y * m, d.z * m) <= 0) lo = m; else h = m; }
      return (lo + h) * 0.5;
    }
    s = s2;
  }
  return 0.03;
}

// 平滑法线：合并接缝/极点处重合顶点的法线
function weldNormals(geo) {
  geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal, map = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${Math.round(p.getX(i) * 1e4)}_${Math.round(p.getY(i) * 1e4)}_${Math.round(p.getZ(i) * 1e4)}`;
    let e = map.get(k); if (!e) { e = { v: new V3(), ids: [] }; map.set(k, e); }
    e.v.x += n.getX(i); e.v.y += n.getY(i); e.v.z += n.getZ(i); e.ids.push(i);
  }
  for (const e of map.values()) { e.v.normalize(); for (const i of e.ids) n.setXYZ(i, e.v.x, e.v.y, e.v.z); }
  n.needsUpdate = true;
}

// 以球面网格为底，按径向函数塑形（保留经纬 UV），可选顶点色
function radialMesh(radial, wSeg, hSeg, colorFn, displaceFn) {
  const geo = new THREE.SphereGeometry(1, wSeg, hSeg);
  const p = geo.attributes.position;
  const colors = colorFn ? new Float32Array(p.count * 3) : null;
  const d = new V3(), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    d.set(p.getX(i), p.getY(i), p.getZ(i)).normalize();
    let r = radial(d);
    const extra = displaceFn ? displaceFn(d, r) : 0;
    r -= extra;
    p.setXYZ(i, d.x * r, d.y * r, d.z * r);
    if (colorFn) { colorFn(d, r, extra, c); colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
  }
  if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  weldNormals(geo);
  return geo;
}

// 叶片/萼片：沿 +X 伸展，带叶形轮廓、V 形中脉、下垂弧度
function leafGeometry({ len = 0.5, width = 0.2, droop = 0.15, lift = 0.0, crease = 0.25, twist = 0, base = '#1e7a38', mid = '#43b05c', tip = '#6ccf74', rib = '#8fe08f', segL = 14, segW = 6 }) {
  const geo = new THREE.PlaneGeometry(1, 1, segL, segW);
  const p = geo.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const cb = col(base), cm = col(mid), ct = col(tip), cr = col(rib), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5, v = p.getY(i) * 2;
    const prof = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 0.85) * (u < 0.06 ? u / 0.06 * 0.6 + 0.4 : 1);
    const x = u * len;
    const z = v * width * 0.5 * prof;
    const y = lift * u - droop * Math.pow(u, 1.7) + Math.abs(v) * width * crease * prof * 0.5 + Math.sin(u * 9 + v * 2) * 0.004;
    const tw = twist * u;
    p.setXYZ(i, x, y * Math.cos(tw) - z * Math.sin(tw), y * Math.sin(tw) + z * Math.cos(tw));
    if (u < 0.5) c.copy(cb).lerp(cm, u * 2); else c.copy(cm).lerp(ct, (u - 0.5) * 2);
    c.lerp(cr, Math.max(0, 1 - Math.abs(v) * 7) * 0.55 * (1 - u * 0.6));
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function tube(points, radius, mat, seg = 16) {
  const curve = new THREE.CatmullRomCurve3(points.map(a => new V3(...a)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, 10, false), mat);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), mat);
  cap.position.copy(curve.getPoint(1));
  m.add(cap);
  m.castShadow = true;
  return m;
}

const leafMat = () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25, side: THREE.DoubleSide, sheen: 0.3, sheenColor: col('#d9ffd0') });
const goldMat = () => new THREE.MeshPhysicalMaterial({ color: '#ffcf4a', metalness: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });

// ======================= 六种水果 =======================
const STRAW_Y0 = -0.98, STRAW_H = 1.86;
function strawR(t) {
  if (t <= 0 || t >= 1) return 0;
  const tp = 0.7;
  if (t < tp) { const u = t / tp; return 0.93 * (0.42 * Math.pow(u, 0.72) + 0.58 * (1 - (1 - u) * (1 - u))); }
  const v = (t - tp) / (1 - tp);
  return 0.93 * Math.sqrt(Math.max(0, 1 - v * v));
}
const strawSDF = (x, y, z) => { const t = (y - STRAW_Y0) / STRAW_H; if (t <= 0 || t >= 1) return 1; return Math.hypot(x, z) - strawR(t); };

const GRAPES = (() => {
  const g = [];
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; g.push({ c: new V3(Math.cos(a) * 0.36, 0.42, Math.sin(a) * 0.36), r: 0.33 }); }
  g.push({ c: new V3(0, 0.6, 0), r: 0.3 });
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.push({ c: new V3(Math.cos(a) * 0.4, 0.0, Math.sin(a) * 0.4), r: 0.34 }); }
  for (let k = 0; k < 3; k++) { const a = Math.PI / 6 + k * Math.PI * 2 / 3 + 0.4; g.push({ c: new V3(Math.cos(a) * 0.28, -0.4, Math.sin(a) * 0.28), r: 0.32 }); }
  g.push({ c: new V3(0.02, -0.74, 0.03), r: 0.3 });
  return g;
})();
const grapeD = (x, y, z, s) => Math.hypot(x - s.c.x, (y - s.c.y) / 1.08, z - s.c.z) - s.r;
const grapeSDF = (x, y, z) => { let d = 9; for (const s of GRAPES) d = Math.min(d, grapeD(x, y, z, s)); return d; };
const grapeShellSDF = (x, y, z) => { let d = 9; for (const s of GRAPES) d = smin(d, grapeD(x, y, z, s), 0.24); return d; };

const HAW = [{ y: 0.62, r: 0.45 }, { y: 0.0, r: 0.47 }, { y: -0.62, r: 0.44 }];
const hawSDF = (x, y, z) => { let d = 9; for (const b of HAW) d = Math.min(d, Math.hypot(x, y - b.y, z) - b.r); return d; };
const hawShellSDF = (x, y, z) => { let d = 9; for (const b of HAW) d = smin(d, Math.hypot(x, y - b.y, z) - b.r, 0.2); return d; };

const ell = (a, b, c) => d => 1 / Math.sqrt((d.x / a) ** 2 + (d.y / b) ** 2 + (d.z / c) ** 2);
const orangeBase = ell(0.95, 0.87, 0.95);
const orangeR = d => orangeBase(d) - 0.04 * Math.exp(-(1 - d.y) / 0.006) - 0.02 * Math.exp(-(1 + d.y) / 0.004);
const PEACH_G = new V3(0.62, 0, 0.78).normalize();
const PEACH_PN = new V3(-PEACH_G.z, 0, PEACH_G.x);
const peachBase = ell(0.95, 0.9, 0.9);
const peachR = d => {
  const s = d.dot(PEACH_PN);
  const side = Math.max(0, d.x * PEACH_G.x + d.z * PEACH_G.z + 0.25);
  const groove = 0.055 * Math.exp(-((s / 0.085) ** 2)) * Math.min(1, side * 2) * (1 - 0.4 * d.y * d.y);
  return peachBase(d) - groove - 0.07 * Math.exp(-(1 - d.y) / 0.03) + 0.035 * Math.exp(-(1 + d.y) / 0.01);
};
const blueBase = ell(0.93, 0.8, 0.93);
const blueR = d => {
  const c = 1 - d.y;
  return blueBase(d) - 0.12 * Math.exp(-((c / 0.028) ** 2)) + 0.03 * Math.exp(-(((c - 0.055) / 0.022) ** 2));
};

function hexColorLerp(a, b, t, out) { return out.copy(col(a)).lerp(col(b), Math.max(0, Math.min(1, t))); }

function buildStrawberry(gold) {
  const g = new THREE.Group();
  const rnd = seeded(11);
  const seeds = [];
  const N = 130;
  for (let i = 0; i < N; i++) {
    const t = 0.06 + 0.78 * Math.pow((i + 0.5) / N, 0.85);
    const phi = i * 2.39996;
    const y = STRAW_Y0 + t * STRAW_H, r = strawR(t);
    seeds.push(new V3(Math.cos(phi) * r, y, Math.sin(phi) * r));
  }
  const radial = d => radialBySDF(strawSDF, d);
  const tmp = new V3();
  const geo = radialMesh(radial, 84, 64, (d, r, dimple, c) => {
    const y = d.y * r, t = (y - STRAW_Y0) / STRAW_H;
    const n = fbm3(d.x * 4, d.y * 4, d.z * 4);
    hexColorLerp('#c50f28', '#f0283c', n, c);
    if (t > 0.74) c.lerp(col('#ff7a6e'), Math.min(1, (t - 0.74) / 0.12));
    if (t > 0.88) c.lerp(col('#ffd9b8'), Math.min(1, (t - 0.88) / 0.08));
    if (t < 0.1) c.lerp(col('#a80b20'), 1 - t / 0.1);
    if (dimple > 0.003) c.multiplyScalar(0.82);
  }, (d, r) => {
    tmp.copy(d).multiplyScalar(r);
    let dep = 0;
    for (const s of seeds) { const dd = tmp.distanceToSquared(s); if (dd < 0.004) dep += 0.016 * Math.exp(-dd / 0.0011); }
    return Math.min(0.02, dep);
  });
  const body = new THREE.Mesh(geo, gold ? goldMat() : new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12, sheen: 0.25, sheenColor: col('#ffb0b0'),
  }));
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);

  // 草莓籽：嵌在凹坑里的小椭球（实例化）
  const seedMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshPhysicalMaterial({ roughness: 0.25, clearcoat: 0.8, color: gold ? '#fff2b0' : '#ffffff' }), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new V3(0, 1, 0), c = new THREE.Color();
  seeds.forEach((s, i) => {
    const e = 0.003;
    const n = new V3(strawSDF(s.x + e, s.y, s.z) - strawSDF(s.x - e, s.y, s.z), strawSDF(s.x, s.y + e, s.z) - strawSDF(s.x, s.y - e, s.z), strawSDF(s.x, s.y, s.z + e) - strawSDF(s.x, s.y, s.z - e)).normalize();
    const tu = up.clone().addScaledVector(n, -n.dot(up)).normalize();
    const tx = new V3().crossVectors(tu, n);
    q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tx, tu, n));
    m4.compose(s.clone().addScaledVector(n, -0.009), q, new V3(0.017, 0.027, 0.013));
    seedMesh.setMatrixAt(i, m4);
    seedMesh.setColorAt(i, hexColorLerp('#f6d66a', '#cdd96a', rnd(), c));
  });
  g.add(seedMesh);

  // 萼片 + 果梗
  const lm = gold ? goldMat() : leafMat();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rnd() * 0.2;
    const leaf = new THREE.Mesh(leafGeometry({ len: 0.4 + rnd() * 0.1, width: 0.16 + rnd() * 0.04, droop: 0.2 + rnd() * 0.06, lift: 0.05, twist: (rnd() - 0.5) * 0.5 }), lm);
    leaf.position.set(Math.cos(a) * 0.05, 0.875, Math.sin(a) * 0.05);
    leaf.rotation.y = -a;
    leaf.castShadow = true;
    g.add(leaf);
  }
  g.add(tube([[0, 0.84, 0], [0.01, 0.98, 0], [0.05, 1.1, 0.02], [0.1, 1.16, 0.03]], 0.032, gold ? goldMat() : new THREE.MeshPhysicalMaterial({ color: '#4f9a3c', roughness: 0.5, sheen: 0.4 })));
  return g;
}

function buildOrange(gold) {
  const g = new THREE.Group();
  const T = textures();
  const geo = radialMesh(orangeR, 96, 72, (d, r, e, c) => {
    hexColorLerp('#ff8400', '#ffa01f', fbm3(d.x * 3 + 2, d.y * 3, d.z * 3), c);
    if (d.y > 0.9) c.lerp(col('#e9a020'), (d.y - 0.9) * 6);
  });
  const mat = gold ? goldMat() : new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.42, normalMap: T.orangePores, normalScale: new THREE.Vector2(0.9, 0.9), clearcoat: 0.45, clearcoatRoughness: 0.28,
  });
  if (!gold) mat.normalMap.repeat.set(1, 1);
  const body = new THREE.Mesh(geo, mat);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const top = orangeR(new V3(0, 1, 0));
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.05, 14), new THREE.MeshPhysicalMaterial({ color: gold ? '#e6b33a' : '#5d7d2a', roughness: 0.6 }));
  btn.position.y = top + 0.01;
  g.add(btn);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    const s = new THREE.Mesh(leafGeometry({ len: 0.1, width: 0.06, droop: 0.02, base: '#4d6d22', mid: '#5f8a2a', tip: '#7aa33a', rib: '#7aa33a', segL: 4, segW: 2 }), leafMat());
    s.position.set(0, top - 0.005, 0); s.rotation.y = -a;
    g.add(s);
  }
  g.add(tube([[0, top, 0], [0.01, top + 0.1, 0], [0.04, top + 0.17, 0]], 0.022, new THREE.MeshPhysicalMaterial({ color: '#6b7d2c', roughness: 0.55 })));
  const leaf = new THREE.Mesh(leafGeometry({ len: 0.62, width: 0.3, droop: 0.05, lift: 0.16, crease: 0.35, twist: 0.25, base: '#1d6b2e', mid: '#2c8f3e', tip: '#3ea34d', rib: '#a7e39a' }), gold ? goldMat() : leafMat());
  leaf.position.set(0.03, top + 0.14, 0); leaf.rotation.set(0, -0.5, 0.1);
  leaf.castShadow = true;
  g.add(leaf);
  return g;
}

function buildPeach(gold) {
  const g = new THREE.Group();
  const T = textures();
  const blushDir = new V3(-0.3, 0.45, 0.85).normalize();
  const geo = radialMesh(peachR, 96, 72, (d, r, e, c) => {
    const n = fbm3(d.x * 2.5 + 7, d.y * 2.5, d.z * 2.5);
    hexColorLerp('#ffc27e', '#ffb06e', n, c);
    const bl = Math.max(0, Math.min(1, (d.dot(blushDir) + 0.25) / 0.95)) * (0.55 + 0.45 * fbm3(d.x * 5, d.y * 5, d.z * 5));
    c.lerp(col('#f0556b'), bl * 0.9);
    if (d.y > 0.86) c.lerp(col('#f6d27c'), (d.y - 0.86) * 4);
  });
  const mat = gold ? goldMat() : new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.62, sheen: 1, sheenRoughness: 0.42, sheenColor: col('#fff1e8'), normalMap: T.fuzz, normalScale: new THREE.Vector2(0.25, 0.25),
  });
  const body = new THREE.Mesh(geo, mat);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const top = peachR(new V3(0, 1, 0));
  g.add(tube([[0, top - 0.02, 0], [0.01, top + 0.08, 0], [-0.02, top + 0.15, 0.01]], 0.028, new THREE.MeshPhysicalMaterial({ color: '#7a5532', roughness: 0.75 })));
  const lm = gold ? goldMat() : leafMat();
  for (const [ry, tw, ln] of [[-0.3, 0.3, 0.62], [2.4, -0.3, 0.5]]) {
    const leaf = new THREE.Mesh(leafGeometry({ len: ln, width: 0.24, droop: 0.12, lift: 0.18, crease: 0.4, twist: tw, base: '#2a7d35', mid: '#3c9a45', tip: '#59b554', rib: '#b8eaa0' }), lm);
    leaf.position.set(0, top + 0.1, 0); leaf.rotation.y = ry;
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

function buildGrapes(gold) {
  const g = new THREE.Group();
  const rnd = seeded(23);
  const sphere = new THREE.SphereGeometry(1, 44, 32);
  const stemMat = new THREE.MeshPhysicalMaterial({ color: gold ? '#d9a530' : '#8ea24a', roughness: 0.55, metalness: gold ? 0.8 : 0 });
  const dotMat = new THREE.MeshStandardMaterial({ color: '#6c5a2a', roughness: 0.8 });
  for (const s of GRAPES) {
    const mat = gold ? goldMat() : new THREE.MeshPhysicalMaterial({
      color: hexColorLerp('#a9d64c', '#cde86f', rnd(), new THREE.Color()), roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06,
      sheen: 0.6, sheenRoughness: 0.5, sheenColor: col('#f3ffd2'), emissive: col('#4a7010'), emissiveIntensity: 0.16,
    });
    const m = new THREE.Mesh(sphere, mat);
    m.position.copy(s.c); m.scale.set(s.r, s.r * 1.08, s.r);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
    const out = new V3(s.c.x, -0.7, s.c.z).normalize();
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), dotMat);
    dot.position.copy(s.c).addScaledVector(out, s.r * 0.99);
    g.add(dot);
  }
  g.add(tube([[0, 0.78, 0], [0.02, 0.98, 0], [0.08, 1.12, 0.02], [0.16, 1.18, 0.02]], 0.035, stemMat));
  for (let k = 0; k < 4; k++) {
    const s = GRAPES[k];
    g.add(tube([[0, 0.8, 0], [s.c.x * 0.5, 0.82, s.c.z * 0.5], [s.c.x * 0.9, s.c.y + s.r * 0.95, s.c.z * 0.9]], 0.016, stemMat, 8));
  }
  const leaf = new THREE.Mesh(leafGeometry({ len: 0.5, width: 0.36, droop: 0.08, lift: 0.1, crease: 0.3, twist: 0.4, base: '#3d8a2e', mid: '#5aa83c', tip: '#79c258', rib: '#c8f0a8' }), gold ? goldMat() : leafMat());
  leaf.position.set(0.1, 1.06, 0); leaf.rotation.set(0, 0.6, 0.25);
  g.add(leaf);
  return g;
}

function buildBlueberry(gold) {
  const g = new THREE.Group();
  const T = textures();
  const geo = radialMesh(blueR, 96, 72, (d, r, e, c) => {
    hexColorLerp('#1f2f7c', '#3a52b4', fbm3(d.x * 3 + 4, d.y * 3, d.z * 3), c);
    if (d.y > 0.94) c.lerp(col('#141838'), Math.min(1, (d.y - 0.94) * 20));
  });
  const mat = gold ? goldMat() : new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.5, sheen: 1, sheenRoughness: 0.7, sheenColor: col('#c4d0ff'), clearcoat: 0.2, clearcoatRoughness: 0.5,
    normalMap: T.fuzz, normalScale: new THREE.Vector2(0.18, 0.18),
  });
  const body = new THREE.Mesh(geo, mat);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const top = blueR(new V3(0, 1, 0));
  const crownMat = new THREE.MeshPhysicalMaterial({ color: gold ? '#c99a2e' : '#1c2360', roughness: 0.55, sheen: 0.6, sheenColor: col('#8090d0') });
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 5), crownMat);
    const rr = 0.25;
    s.position.set(Math.cos(a) * rr * 0.82, top + 0.07, Math.sin(a) * rr * 0.82);
    s.lookAt(Math.cos(a) * 2, top + 1.6, Math.sin(a) * 2);
    s.rotateX(Math.PI / 2);
    g.add(s);
  }
  return g;
}

function buildHawthorns(gold) {
  const g = new THREE.Group();
  const T = textures();
  const calyxMat = new THREE.MeshStandardMaterial({ color: '#3b1a12', roughness: 0.9 });
  HAW.forEach((b, i) => {
    const mat = gold ? goldMat() : new THREE.MeshPhysicalMaterial({ map: T.hawthorn, roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.12 });
    const m = new THREE.Mesh(new THREE.SphereGeometry(b.r, 56, 40), mat);
    m.position.y = b.y; m.rotation.y = i * 1.7;
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
    const a = 0.9 + i * 2.2;
    const n = new V3(Math.cos(a) * 0.75, 0.35 - i * 0.3, Math.sin(a) * 0.75).normalize();
    const cal = new THREE.Group();
    const disk = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), calyxMat);
    cal.add(disk);
    for (let k = 0; k < 5; k++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 4), calyxMat);
      const ka = k / 5 * Math.PI * 2;
      sp.position.set(Math.cos(ka) * 0.03, Math.sin(ka) * 0.03, 0.02);
      sp.rotation.x = Math.PI / 2;
      cal.add(sp);
    }
    cal.position.set(0, b.y, 0).addScaledVector(n, b.r + 0.002);
    cal.lookAt(cal.position.clone().add(n));
    g.add(cal);
  });
  return g;
}

function stickMesh(yTop, yBottom) {
  const T = textures();
  const len = yTop - yBottom;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, len, 14), new THREE.MeshPhysicalMaterial({ map: T.woodGrain, roughness: 0.65, clearcoat: 0.2 }));
  m.position.y = (yTop + yBottom) / 2;
  m.castShadow = true;
  return m;
}

// 每种水果：表面径向函数、糖衣内壁径向函数、开孔、脸的位置
export const FRUIT_SPECS = {
  strawberry: {
    radial: d => radialBySDF(strawSDF, d),
    shellRadial: d => radialBySDF(strawSDF, d) + 0.03,
    topCut: 0.8, bottomCut: -0.985,
    build: buildStrawberry, stick: [-0.7, -1.42],
    face: { center: new V3(0, 0, 0), dir: new V3(0, -0.02, 1), scale: 1.0, radial: d => radialBySDF(strawSDF, d) },
  },
  grape: {
    radial: d => radialBySDF(grapeSDF, d),
    shellRadial: d => radialBySDF(grapeShellSDF, d, 1.5) + 0.02,
    topCut: 0.9, bottomCut: -0.985,
    build: buildGrapes, stick: [-0.62, -1.42],
    face: { center: GRAPES[6].c.clone(), dir: new V3(0, 0.04, 1), scale: 0.62, radial: () => 0.34 },
  },
  peach: {
    radial: peachR,
    shellRadial: d => peachR(d) + 0.022,
    topCut: 0.93, bottomCut: -0.985,
    build: buildPeach, stick: [-0.6, -1.42],
    face: { center: new V3(0, 0, 0), dir: new V3(-0.06, 0.02, 1), scale: 1.0, radial: peachR },
  },
  orange: {
    radial: orangeR,
    shellRadial: d => orangeR(d) + 0.022,
    topCut: 0.95, bottomCut: -0.985,
    build: buildOrange, stick: [-0.6, -1.42],
    face: { center: new V3(0, 0, 0), dir: new V3(0, 0.02, 1), scale: 1.0, radial: orangeR },
  },
  blueberry: {
    radial: blueR,
    shellRadial: d => blueR(d) + 0.022,
    topCut: 0.95, bottomCut: -0.985,
    build: buildBlueberry, stick: [-0.55, -1.42],
    face: { center: new V3(0, 0, 0), dir: new V3(0, 0.02, 1), scale: 1.0, radial: blueR },
  },
  skewer: {
    radial: d => radialBySDF(hawSDF, d),
    shellRadial: d => radialBySDF(hawShellSDF, d, 1.4) + 0.02,
    topCut: 0.97, bottomCut: -0.985,
    build: buildHawthorns, stick: [0.5, -1.42],
    face: { center: new V3(0, 0, 0), dir: new V3(0, 0.02, 1), scale: 0.78, radial: () => 0.47 },
  },
};

export function buildFruit(type, gold) {
  const spec = FRUIT_SPECS[type] || FRUIT_SPECS.strawberry;
  const g = spec.build(gold);
  g.add(stickMesh(spec.stick[0], spec.stick[1]));
  return g;
}

// ======================= 立体萌脸 =======================
export function buildFace(type) {
  const spec = (FRUIT_SPECS[type] || FRUIT_SPECS.strawberry).face;
  const T = textures();
  const s = spec.scale;
  const c0 = spec.center;
  const fd = spec.dir.clone().normalize();
  const C = c0.clone().addScaledVector(fd, spec.radial(fd));
  const right = new V3().crossVectors(new V3(0, 1, 0), fd).normalize();
  const up = new V3().crossVectors(fd, right).normalize();

  function place(obj, u, v, lift = 0.006) {
    const P = C.clone().addScaledVector(right, u * s).addScaledVector(up, v * s);
    const d = P.sub(c0).normalize();
    obj.position.copy(c0).addScaledVector(d, spec.radial(d) + lift * s);
    const r2 = right.clone().addScaledVector(d, -d.dot(right)).normalize();
    const u2 = new V3().crossVectors(d, r2);
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r2, u2, d));
    return obj;
  }

  const ink = new THREE.MeshPhysicalMaterial({ color: '#1d1418', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 });
  const white = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const mouthMat = new THREE.MeshPhysicalMaterial({ color: '#3a141c', roughness: 0.3, clearcoat: 1 });
  const root = new THREE.Group();
  const moods = { normal: new THREE.Group(), happy: new THREE.Group(), hurt: new THREE.Group() };
  const blinkers = [];

  // 腮红（三种表情共用）
  for (const side of [-1, 1]) {
    const ch = new THREE.Mesh(new THREE.CircleGeometry(0.09 * s, 24), new THREE.MeshBasicMaterial({ map: T.blush, transparent: true, depthWrite: false }));
    root.add(place(ch, side * 0.29, -0.07, 0.008));
  }
  // normal：亮晶晶黑眼睛 + 高光 + 小微笑
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), ink);
    ball.scale.set(0.058 * s, 0.072 * s, 0.03 * s);
    const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.021 * s, 12, 10), white);
    h1.position.set(-0.018 * s, 0.026 * s, 0.026 * s);
    const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.01 * s, 10, 8), white);
    h2.position.set(0.02 * s, -0.022 * s, 0.024 * s);
    eye.add(ball, h1, h2);
    moods.normal.add(place(eye, side * 0.19, 0.06, 0.004));
    blinkers.push(eye);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04 * s, 0.011 * s, 8, 24, Math.PI), mouthMat);
  smile.rotation.z = Math.PI;
  const smileHolder = new THREE.Group(); smileHolder.add(smile);
  moods.normal.add(place(smileHolder, 0, -0.07, 0.006));

  // happy：^ ^ 眯眼 + 张嘴笑
  for (const side of [-1, 1]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.048 * s, 0.013 * s, 8, 20, Math.PI), ink);
    const h = new THREE.Group(); h.add(arc);
    moods.happy.add(place(h, side * 0.19, 0.04, 0.006));
  }
  const open = new THREE.Group();
  const lip = new THREE.Mesh(new THREE.CircleGeometry(0.07 * s, 24, Math.PI, Math.PI), new THREE.MeshPhysicalMaterial({ color: '#7a1424', roughness: 0.3, clearcoat: 1, side: THREE.DoubleSide }));
  const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.036 * s, 16, Math.PI, Math.PI), new THREE.MeshPhysicalMaterial({ color: '#ff7d93', roughness: 0.4, side: THREE.DoubleSide }));
  tongue.position.set(0, -0.026 * s, 0.002 * s);
  open.add(lip, tongue);
  moods.happy.add(place(open, 0, -0.05, 0.006));

  // hurt：> < + 泪珠 + 瘪嘴
  for (const side of [-1, 1]) {
    const h = new THREE.Group();
    for (const k of [-1, 1]) {
      const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.012 * s, 0.06 * s, 4, 8), ink);
      bar.rotation.z = side * k * 0.55 + Math.PI / 2;
      bar.position.set(side * 0.012 * s, k * 0.018 * s, 0);
      h.add(bar);
    }
    moods.hurt.add(place(h, side * 0.19, 0.06, 0.006));
    const tear = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 12), new THREE.MeshPhysicalMaterial({ color: '#69bfff', roughness: 0.05, clearcoat: 1, transmission: 0.3 }));
    tear.scale.set(0.022 * s, 0.032 * s, 0.016 * s);
    moods.hurt.add(place(tear, side * 0.27, -0.03, 0.02));
  }
  const frown = new THREE.Mesh(new THREE.TorusGeometry(0.034 * s, 0.011 * s, 8, 20, Math.PI), mouthMat);
  const fh = new THREE.Group(); fh.add(frown);
  moods.hurt.add(place(fh, 0, -0.1, 0.006));

  root.add(moods.normal, moods.happy, moods.hurt);
  const setMood = (m) => { for (const k in moods) moods[k].visible = k === m; };
  setMood('normal');
  return { root, setMood, blinkers };
}

// ======================= 贴合糖衣碎壳 =======================
export const SHELL_THICK = { normal: 0.07, stress: 0.08, delicate: 0.052, thick: 0.125 };

function buildPieceGeo(triList, triV, U, rIn, thickFn, anchor, tan, bit, uvSpan, gap) {
  const loc = new Map(); const O = [], I = [];
  for (const t of triList) {
    for (let k = 0; k < 3; k++) {
      const u = triV[t * 3 + k];
      if (loc.has(u)) continue;
      loc.set(u, O.length);
      const d = U[u];
      O.push(d.clone().multiplyScalar(rIn[u] + thickFn(u)));
      I.push(d.clone().multiplyScalar(rIn[u]));
    }
  }
  const cen = new V3(); for (const p of O) cen.add(p); cen.divideScalar(O.length);
  const cdir = cen.clone().normalize();
  let Lmax = 1e-3; const tmp = new V3();
  for (const p of O) { tmp.copy(p).sub(cen); tmp.addScaledVector(cdir, -tmp.dot(cdir)); Lmax = Math.max(Lmax, tmp.length()); }
  const f = gap / Lmax;
  for (const arr of [O, I]) for (const p of arr) { tmp.copy(p).sub(cen); tmp.addScaledVector(cdir, -tmp.dot(cdir)); p.addScaledVector(tmp, -f); }

  const tris = triList.map(t => [loc.get(triV[t * 3]), loc.get(triV[t * 3 + 1]), loc.get(triV[t * 3 + 2])]);
  const nO = O.map(() => new V3()), nI = O.map(() => new V3());
  const e1 = new V3(), e2 = new V3(), fn = new V3();
  for (const [a, b, c] of tris) {
    fn.crossVectors(e1.subVectors(O[b], O[a]), e2.subVectors(O[c], O[a])); nO[a].add(fn); nO[b].add(fn); nO[c].add(fn);
    fn.crossVectors(e1.subVectors(I[b], I[a]), e2.subVectors(I[c], I[a])); nI[a].sub(fn); nI[b].sub(fn); nI[c].sub(fn);
  }
  nO.forEach(n => n.normalize()); nI.forEach(n => n.normalize());
  const edges = new Map();
  for (const [a, b, c] of tris) {
    for (const [x, y] of [[a, b], [b, c], [c, a]]) {
      const key = x < y ? x * 131072 + y : y * 131072 + x;
      const e = edges.get(key);
      if (e) e.n++; else edges.set(key, { a: x, b: y, n: 1 });
    }
  }
  const pos = [], nor = [], uv = [], uv1 = [];
  const push = (p, n) => {
    const lx = p.x - anchor.x, ly = p.y - anchor.y, lz = p.z - anchor.z;
    pos.push(lx, ly, lz); nor.push(n.x, n.y, n.z);
    const tu = lx * tan.x + ly * tan.y + lz * tan.z, tv = lx * bit.x + ly * bit.y + lz * bit.z;
    uv.push(tu / uvSpan + 0.5, tv / uvSpan + 0.5);
    uv1.push(tu * 2.2, tv * 2.2);
  };
  for (const [a, b, c] of tris) { push(O[a], nO[a]); push(O[b], nO[b]); push(O[c], nO[c]); }
  for (const [a, b, c] of tris) { push(I[a], nI[a]); push(I[c], nI[c]); push(I[b], nI[b]); }
  for (const e of edges.values()) {
    if (e.n !== 1) continue;
    const Oa = O[e.a], Ob = O[e.b], Ia = I[e.a], Ib = I[e.b];
    fn.crossVectors(e1.subVectors(Ia, Oa), e2.subVectors(Ob, Oa)).normalize();
    // 侧壁法线向外略混入表面法线，边缘出圆润高光
    const na = fn.clone().multiplyScalar(0.8).add(nO[e.a].clone().multiplyScalar(0.35)).normalize();
    const nb = fn.clone().multiplyScalar(0.8).add(nO[e.b].clone().multiplyScalar(0.35)).normalize();
    push(Oa, na); push(Ia, fn); push(Ob, nb);
    push(Ob, nb); push(Ia, fn); push(Ib, fn);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('uv1', new THREE.Float32BufferAttribute(uv1, 2));
  geo.computeBoundingSphere();
  return { geo, outerCount: tris.length, O };
}


// 边界平滑：owner 不同的三角形之间的边（以及开孔边）视为裂缝线，
// 对裂缝线上的顶点沿线做拉普拉斯平滑，交汇点固定 → 圆润自然的裂纹
function smoothBoundary(triList, ownerOf, triV, dirs, iters = 7) {
  const edges = new Map();
  for (const t of triList) {
    const o = ownerOf(t);
    for (let k = 0; k < 3; k++) {
      const a = triV[t * 3 + k], b = triV[t * 3 + (k + 1) % 3];
      const key = a < b ? a * 131072 + b : b * 131072 + a;
      const e = edges.get(key);
      if (e) { e.n++; if (e.o !== o) e.diff = true; } else edges.set(key, { a, b, o, n: 1, diff: false });
    }
  }
  const nb = new Map();
  const link = (a, b) => { let l = nb.get(a); if (!l) nb.set(a, l = []); l.push(b); };
  for (const e of edges.values()) if (e.n === 1 || e.diff) { link(e.a, e.b); link(e.b, e.a); }
  const out = new Map();
  for (const [u] of nb) out.set(u, dirs[u].clone());
  for (let it = 0; it < iters; it++) {
    const next = new Map();
    for (const [u, l] of nb) {
      const cur = out.get(u);
      if (l.length !== 2) { next.set(u, cur); continue; }
      const avg = out.get(l[0]).clone().add(out.get(l[1])).multiplyScalar(0.5);
      next.set(u, cur.clone().lerp(avg, 0.6).normalize());
    }
    for (const [u, v] of next) out.set(u, v);
  }
  const res = dirs.slice();
  for (const [u, v] of out) res[u] = v;
  return res;
}

let ICO_CACHE = null;
const RADIAL_CACHE = new Map();
function icoTopology() {
  if (ICO_CACHE) return ICO_CACHE;
  const ico = new THREE.IcosahedronGeometry(1, 19);
  const P = ico.attributes.position;
  const keyMap = new Map(); const U = []; const triV = new Int32Array(P.count);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), l = Math.hypot(x, y, z);
    const key = `${Math.round(x / l * 20000)}_${Math.round(y / l * 20000)}_${Math.round(z / l * 20000)}`;
    let id = keyMap.get(key);
    if (id === undefined) { id = U.length; U.push(new V3(x / l, y / l, z / l)); keyMap.set(key, id); }
    triV[i] = id;
  }
  const nTri = P.count / 3;
  const cent = [];
  for (let t = 0; t < nTri; t++) cent.push(U[triV[t * 3]].clone().add(U[triV[t * 3 + 1]]).add(U[triV[t * 3 + 2]]).normalize());
  ico.dispose();
  ICO_CACHE = { U, triV, nTri, cent };
  return ICO_CACHE;
}

// shells: rules 里的壳数据（pos/kind）。返回每块壳的几何（整片 + 预切碎块）
export function buildShellPieces(type, shells, seed = 1) {
  const spec = FRUIT_SPECS[type] || FRUIT_SPECS.strawberry;
  const { U, triV, nTri, cent } = icoTopology();
  const rnd = seeded(seed);
  // 糖衣内壁半径只与水果种类有关 → 按种类缓存，换关不再重复求交
  let cache = RADIAL_CACHE.get(type);
  if (!cache) {
    const rIn = new Float32Array(U.length), ripple = new Float32Array(U.length);
    for (let i = 0; i < U.length; i++) {
      rIn[i] = spec.shellRadial(U[i]);
      ripple[i] = fbm3(U[i].x * 2.6 + 11, U[i].y * 2.6, U[i].z * 2.6);
    }
    cache = { rIn, ripple };
    RADIAL_CACHE.set(type, cache);
  }
  const { rIn, ripple } = cache;
  const seeds = shells.map(s => new V3(s.pos.x, s.pos.y, s.pos.z).normalize());
  const lists = shells.map(() => []);
  const owner = new Int32Array(nTri).fill(-1);
  for (let t = 0; t < nTri; t++) {
    const c = cent[t];
    if (c.y > spec.topCut || c.y < spec.bottomCut) continue;
    let best = -1, bd = 1e9;
    for (let i = 0; i < seeds.length; i++) {
      const d = 1 - c.dot(seeds[i]) + 0.07 * vnoise(c.x * 4.5 + i * 7.3, c.y * 4.5, c.z * 4.5 - i * 3.1);
      if (d < bd) { bd = d; best = i; }
    }
    lists[best].push(t);
    owner[t] = best;
  }
  const allTris = [];
  for (let t = 0; t < nTri; t++) if (owner[t] >= 0) allTris.push(t);
  const adjSets = shells.map(() => new Set());
  const edgeOwner = new Map();
  for (const t of allTris) {
    for (let k = 0; k < 3; k++) {
      const a = triV[t * 3 + k], b = triV[t * 3 + (k + 1) % 3];
      const key = a < b ? a * 131072 + b : b * 131072 + a;
      const o = owner[t], prev = edgeOwner.get(key);
      if (prev === undefined) edgeOwner.set(key, o);
      else if (prev !== o) { adjSets[o].add(prev); adjSets[prev].add(o); }
    }
  }
  const Us = smoothBoundary(allTris, t => owner[t], triV, U);
  const rS = new Float32Array(U.length);
  for (let i = 0; i < U.length; i++) rS[i] = Us[i] === U[i] ? rIn[i] : spec.shellRadial(Us[i]);
  const result = shells.map((s, i) => {
    const tris = lists[i];
    const thick = SHELL_THICK[s.kind] || 0.07;
    const thickFn = u => thick * (0.7 + 0.6 * ripple[u]);
    // 锚点：该片的面积中心
    const cd = new V3(); for (const t of tris) cd.add(cent[t]);
    const sd = (tris.length ? cd : seeds[i].clone()).normalize();
    const anchor = sd.clone().multiplyScalar(spec.shellRadial(sd) + thick * 0.5);
    const tan = new V3().crossVectors(Math.abs(sd.y) > 0.95 ? new V3(1, 0, 0) : new V3(0, 1, 0), sd).normalize();
    const bit = new V3().crossVectors(sd, tan);
    let span = 0.15;
    const tmp = new V3();
    for (const t of tris) {
      tmp.copy(cent[t]).multiplyScalar(rIn[triV[t * 3]]).sub(anchor);
      tmp.addScaledVector(sd, -tmp.dot(sd));
      span = Math.max(span, tmp.length());
    }
    const uvSpan = span * 2.1;
    const intact = buildPieceGeo(tris, triV, Us, rS, thickFn, anchor, tan, bit, uvSpan, 0.008);

    // 预切碎块：最远点采样 + 噪声边界 → 参差裂纹
    const m = Math.max(3, Math.min(7, Math.round(tris.length / 150)));
    const fs = [];
    if (tris.length) {
      fs.push(cent[tris[Math.floor(rnd() * tris.length)]]);
      while (fs.length < m) {
        let bt = null, bdist = -1;
        for (let k = 0; k < tris.length; k += 3) {
          const c = cent[tris[k]];
          let md = 9; for (const f of fs) md = Math.min(md, 1 - c.dot(f));
          if (md > bdist) { bdist = md; bt = c; }
        }
        fs.push(bt);
      }
    }
    const fl = fs.map(() => []);
    const fo = new Map();
    for (const t of tris) {
      const c = cent[t];
      let best = 0, bd = 1e9;
      fs.forEach((f, k) => { const d = 1 - c.dot(f) + 0.03 * vnoise(c.x * 9 + k * 5, c.y * 9, c.z * 9); if (d < bd) { bd = d; best = k; } });
      fl[best].push(t);
      fo.set(t, best);
    }
    // 碎块边界单独平滑（外轮廓沿用整片的平滑结果）
    const Uf = smoothBoundary(tris, t => fo.get(t), triV, Us, 5);
    const rF = new Float32Array(U.length);
    for (const t of tris) for (let k = 0; k < 3; k++) { const u = triV[t * 3 + k]; rF[u] = Uf[u] === Us[u] ? rS[u] : spec.shellRadial(Uf[u]); }
    const frags = fl.filter(l => l.length > 4).map(l => {
      const { geo } = buildPieceGeo(l, triV, Uf, rF, thickFn, anchor, tan, bit, uvSpan, 0.014);
      geo.computeBoundingBox();
      const c = new V3(); geo.boundingBox.getCenter(c);
      geo.translate(-c.x, -c.y, -c.z);
      geo.computeBoundingSphere();
      return { geo, center: c, size: geo.boundingSphere.radius };
    });

    const glints = [];
    for (let k = 0; k < 2 && tris.length; k++) {
      const t = tris[Math.floor(rnd() * tris.length)];
      const c = cent[t];
      const p = c.clone().multiplyScalar(rIn[triV[t * 3]] + thick * 1.15).sub(anchor);
      glints.push(p);
    }
    return { anchor, dir: sd, intactGeo: intact.geo, frags, glints, empty: tris.length === 0 };
  });
  result.adjacency = adjSets.map(st => [...st].sort((a, b) => a - b));
  return result;
}

// ======================= 工具模型 =======================
export function buildHammer() {
  const T = textures();
  const root = new THREE.Group();
  const model = new THREE.Group();
  const wood = new THREE.MeshPhysicalMaterial({ color: '#d79a5e', map: T.woodGrain, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.2 });
  const band = new THREE.MeshPhysicalMaterial({ color: '#dfe6ee', metalness: 1, roughness: 0.18 });
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.15, 8, 24), wood);
  const b1 = new THREE.Mesh(new THREE.TorusGeometry(0.106, 0.014, 8, 32), band); b1.rotation.x = Math.PI / 2; b1.position.y = 0.065;
  const b2 = b1.clone(); b2.position.y = -0.065;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 0.66, 14), wood);
  handle.rotation.z = Math.PI / 2; handle.position.x = 0.43;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.2, 14), new THREE.MeshPhysicalMaterial({ color: '#ff7a9a', roughness: 0.45, sheen: 0.6 }));
  grip.rotation.z = Math.PI / 2; grip.position.x = 0.66;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 10), band); knob.position.x = 0.77;
  model.add(head, b1, b2, handle, grip, knob);
  model.position.x = -0.66;
  model.traverse(o => { if (o.isMesh) o.castShadow = true; });
  root.add(model);
  root.visible = false;
  return {
    root, model,
    setGold(on) { wood.color.set(on ? '#ffcf4a' : '#d79a5e'); wood.metalness = on ? 0.9 : 0; wood.map = on ? null : T.woodGrain; wood.needsUpdate = true; },
  };
}

export function buildPick() {
  const root = new THREE.Group();
  const model = new THREE.Group();
  const steel = new THREE.MeshPhysicalMaterial({ color: '#eef3f7', metalness: 1, roughness: 0.12 });
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.32, 14), steel);
  needle.rotation.x = Math.PI; needle.position.y = 0.16;
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.07, 16), steel); ferrule.position.y = 0.35;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.034, 0.34, 18), new THREE.MeshPhysicalMaterial({ color: '#7fe3c4', roughness: 0.12, clearcoat: 1, transmission: 0.35, thickness: 0.1 }));
  handle.position.y = 0.55;
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshPhysicalMaterial({ color: '#ff9ec0', roughness: 0.02, transmission: 0.7, thickness: 0.1, ior: 1.7, clearcoat: 1 }));
  gem.position.y = 0.76; gem.scale.y = 1.4;
  model.add(needle, ferrule, handle, gem);
  model.traverse(o => { if (o.isMesh) o.castShadow = true; });
  root.add(model);
  root.visible = false;
  return { root, model };
}

// ======================= 陶瓷甜品盘 =======================
export function buildPlate() {
  const g = new THREE.Group();
  const prof = [
    [0.0, 0.075], [0.6, 0.075], [1.2, 0.08], [1.46, 0.11], [1.64, 0.16], [1.74, 0.2], [1.775, 0.205], [1.79, 0.19],
    [1.7, 0.13], [1.45, 0.05], [1.12, 0.0], [1.06, -0.07], [0.98, -0.08], [0.94, -0.02], [0.0, -0.02],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const plate = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), new THREE.MeshPhysicalMaterial({
    color: '#fffaf4', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0.3, sheenColor: col('#ffe9f0'), side: THREE.DoubleSide,
  }));
  plate.receiveShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.772, 0.014, 10, 120), new THREE.MeshPhysicalMaterial({ color: '#f5c451', metalness: 1, roughness: 0.22 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.205;
  const inner = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.006, 6, 120), new THREE.MeshPhysicalMaterial({ color: '#ffb3c6', roughness: 0.3 }));
  inner.rotation.x = Math.PI / 2; inner.position.y = 0.082;
  g.add(plate, rim, inner);
  return g;
}
// 盘面高度（局部半径 → 世界 y 偏移，盘心 y=0.075）
export function plateSurfaceY(r) {
  if (r < 1.2) return 0.075 + r * 0.004;
  if (r < 1.46) return 0.08 + (r - 1.2) / 0.26 * 0.03;
  if (r < 1.64) return 0.11 + (r - 1.46) / 0.18 * 0.05;
  if (r < 1.77) return 0.16 + (r - 1.64) / 0.13 * 0.045;
  return -10;
}

// ======================= 晶洞（糖晶盲盒） =======================
export function buildGeode() {
  const T = textures();
  const root = new THREE.Group();
  const rnd = seeded(91);
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: '#cfb2ff', roughness: 0.38, sheen: 1, sheenColor: col('#ffd9f4'), sheenRoughness: 0.5, clearcoat: 0.8, clearcoatRoughness: 0.2, iridescence: 0.35,
    normalMap: T.ripple, normalScale: new THREE.Vector2(0.9, 0.9), emissive: col('#c58bff'), emissiveMap: T.crack, emissiveIntensity: 0,
  });
  const innerMat = new THREE.MeshPhysicalMaterial({ color: '#5b2bb8', roughness: 0.35, side: THREE.BackSide, emissive: col('#3a1680'), emissiveIntensity: 0.25 });
  const rimMat = new THREE.MeshPhysicalMaterial({ color: '#efe6ff', roughness: 0.6, sheen: 1, sheenColor: col('#ffffff'), side: THREE.DoubleSide });
  const crystalMat = new THREE.MeshPhysicalMaterial({ color: '#cfa8ff', roughness: 0.05, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, emissive: col('#8a4dff'), emissiveIntensity: 0.55, iridescence: 0.6, flatShading: true });
  const halves = [];
  for (const side of [1, -1]) {
    const h = new THREE.Group();
    // 前半球(z>=0) 绕 Y 转 90° → 右半球(x>=0)；后半球 → 左半球
    const outerGeo = new THREE.SphereGeometry(0.95, 72, 54, side > 0 ? 0 : Math.PI, Math.PI);
    const p = outerGeo.attributes.position, d = new V3();
    for (let i = 0; i < p.count; i++) {
      d.set(p.getX(i), p.getY(i), p.getZ(i)).normalize();
      const r = 0.95 * (1 + (fbm3(d.x * 3.2 + 4, d.y * 3.2, d.z * 3.2) - 0.5) * 0.12);
      p.setXYZ(i, d.x * r, d.y * r, d.z * r);
    }
    outerGeo.rotateY(Math.PI / 2);
    weldNormals(outerGeo);
    const outer = new THREE.Mesh(outerGeo, shellMat);
    outer.castShadow = true;
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.78, 48, 36, side > 0 ? 0 : Math.PI, Math.PI).rotateY(Math.PI / 2), innerMat);
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.92, 64), rimMat);
    rim.rotation.y = Math.PI / 2;
    // 内壁晶簇：朝心生长的晶柱
    const n = 64;
    const cones = new THREE.InstancedMesh(new THREE.ConeGeometry(0.045, 0.24, 6), crystalMat, n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new V3(0, 1, 0);
    for (let i = 0; i < n; i++) {
      let v;
      do { v = new V3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1); } while (v.lengthSq() > 1 || v.lengthSq() < 0.1);
      v.normalize(); v.x = Math.max(0.15, Math.abs(v.x)) * side; v.normalize();
      const inward = v.clone().negate();
      inward.x += (rnd() - 0.5) * 0.4; inward.y += (rnd() - 0.5) * 0.4; inward.normalize();
      q.setFromUnitVectors(up, inward);
      const len = 0.6 + rnd() * 0.9;
      m4.compose(v.clone().multiplyScalar(0.74), q, new V3(1, len, 1));
      cones.setMatrixAt(i, m4);
    }
    // 外壳上的糖晶颗粒
    const studs = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.05, 0), new THREE.MeshPhysicalMaterial({ color: '#ffd6f0', roughness: 0.05, clearcoat: 1, iridescence: 0.8, emissive: col('#ff8ad8'), emissiveIntensity: 0.25, flatShading: true }), 40);
    for (let i = 0; i < 40; i++) {
      let v;
      do { v = new V3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1); } while (v.lengthSq() > 1 || v.lengthSq() < 0.1);
      v.normalize(); v.x = Math.max(0.08, Math.abs(v.x)) * side; v.normalize();
      q.setFromUnitVectors(up, v);
      const sc = 0.6 + rnd() * 0.9;
      m4.compose(v.clone().multiplyScalar(0.95), q, new V3(sc, sc * 0.9, sc));
      studs.setMatrixAt(i, m4);
    }
    h.add(outer, inner, rim, cones, studs);
    h.userData.side = side;
    root.add(h);
    halves.push(h);
  }
  const prizeSlot = new THREE.Group();
  root.add(prizeSlot);
  return { root, halves, prizeSlot, shellMat };
}

export function buildPrize(id) {
  const g = new THREE.Group();
  let mesh;
  if (id === 'gold-star') {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.13 : 0.3;
      if (i) shape.lineTo(Math.cos(a) * r, Math.sin(a) * r); else shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4 });
    geo.center();
    mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#ffcf3a', metalness: 1, roughness: 0.15, clearcoat: 1, emissive: col('#ff9d00'), emissiveIntensity: 0.25 }));
  } else if (id === 'rainbow-diamond') {
    const prof = [[0, -0.3], [0.26, 0.02], [0.2, 0.12], [0.1, 0.16], [0, 0.16]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh = new THREE.Mesh(new THREE.LatheGeometry(prof, 10), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0, transmission: 1, thickness: 0.4, ior: 2.2, dispersion: 0.8, iridescence: 1, iridescenceIOR: 1.8, clearcoat: 1, flatShading: true }));
    mesh.scale.setScalar(1.25);
  } else {
    const c = id === 'mint-gem' ? '#5fe6bf' : '#ff9fc6';
    mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.02, transmission: 0.8, thickness: 0.3, ior: 1.7, clearcoat: 1, emissive: col(c), emissiveIntensity: 0.3, flatShading: true }));
    mesh.scale.set(1, 1.35, 1);
  }
  mesh.castShadow = true;
  g.add(mesh);
  return g;
}
