// 第 2~6 关的主题场景：南瓜丰收田 / 蔓越莓湿地 / 小镇游行大街 / 丰收夜集市 / 赦免大会主会场
// 原则：大量重复物件一律实例化并按 z 分块（视锥 + 阴影剔除）；招牌/立面用贴图图集合并成少量网格
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from '../vendor/utils/BufferGeometryUtils.js';
import * as T from './tex.mjs';
import { HALF } from './game.mjs';
import { mesh, std, instanced, vertexGradient, noisy, jitterColors, treeGeometries, pumpkinGeometry, stemGeometry, cornGeometry, terrainH } from './scenery.mjs';

const PI = Math.PI;
const hdr = (c, k) => new THREE.Color(c).multiplyScalar(k);
const gold = () => new THREE.MeshPhysicalMaterial({ color: 0xe8b030, metalness: 1, roughness: 0.2, clearcoat: 1 });
const FONT = '"Microsoft YaHei","PingFang SC",sans-serif';

export function buildThemeWorld(theme, length) {
  const g = new THREE.Group();
  g.userData.ticks = [];
  const B = { pumpkin: pumpkinWorld, bog: bogWorld, town: townWorld, fair: fairWorld, gala: galaWorld }[theme];
  B(g, length, T.rng(91 + length));
  return g;
}

// ---------- 通用件 ----------
function carpet(g, length, { width = HALF * 2 + 0.3, rope = true, y = 0.04 } = {}) {
  const c = T.carpetTex(length + 30);
  g.add(mesh(new RoundedBoxGeometry(width, 0.1, length + 30, 2, 0.04), new THREE.MeshPhysicalMaterial({ map: c.map, normalMap: c.normalMap, color: 0x8a8a8a, roughness: 0.78, sheen: 0.6, sheenRoughness: 0.45, sheenColor: new THREE.Color(0xff3a4e) }), { y, z: -length / 2 + 5, cast: false, receive: true }));
  if (rope) { const m = gold(); for (const s of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, length + 30, 12), m, { x: s * (width / 2 - 0.03), y: y + 0.06, z: -length / 2 + 5, rx: PI / 2, cast: false })); }
}
const tuftGeo = (() => { const parts = []; for (let k = 0; k < 9; k++) { const h = 0.28 + (k % 4) * 0.07; const b = new THREE.ConeGeometry(0.018, h, 3); b.translate(0, h / 2, 0); b.rotateZ((k - 4) * 0.13); b.rotateY(k * 0.7); b.translate(Math.cos(k * 2.4) * 0.05, 0, Math.sin(k * 2.4) * 0.05); parts.push(b); } return mergeGeometries(parts); })();
function grassBits(g, length, r, { tufts = 1800, flowers = 300, leaves = 600, x0 = HALF + 0.4, x1 = HALF + 10, lo = '#2e5a18', hi = '#b4cc58', yAt = null } = {}) {
  const geo = vertexGradient(tuftGeo.clone(), lo, hi, 0, 0.45);
  const tl = [], fl = [], fc = [], ll = [], lc = [];
  const Y = (x, z) => (yAt ? yAt(x, z) : 0);
  for (let i = 0; i < tufts; i++) { const s = r() < 0.5 ? -1 : 1; const x = s * (x0 + Math.pow(r(), 1.6) * (x1 - x0)), z = -r() * (length + 30) + 10; tl.push({ x, y: Y(x, z), z, ry: r() * 6, s: 0.8 + r() * 0.8 }); }
  for (let i = 0; i < flowers; i++) { const s = r() < 0.5 ? -1 : 1; const x = s * (x0 + r() * (x1 - x0)), z = -r() * (length + 30) + 10; fl.push({ x, y: Y(x, z) + 0.22 + r() * 0.1, z, s: 0.035 + r() * 0.025 }); fc.push(['#fff6e0', '#ffd23a', '#c88ae8', '#ff9a6a'][i % 4]); }
  for (let i = 0; i < leaves; i++) { const s = r() < 0.5 ? -1 : 1; const x = s * (x0 + r() * (x1 - x0)), z = -r() * (length + 30) + 10; ll.push({ x, y: Y(x, z) + 0.02, z, rx: -PI / 2, rz: r() * 6, s: 0.12 + r() * 0.1 }); lc.push(['#d9681e', '#c8461a', '#e8a22a', '#a83a1a', '#8a2a10'][i % 5]); }
  if (tl.length) g.add(instanced(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), tl, { cast: false }));
  if (fl.length) g.add(instanced(new THREE.IcosahedronGeometry(1, 1), std(0xffffff, { roughness: 0.6 }), fl, { colors: fc, cast: false }));
  if (ll.length) { const lg = new THREE.CircleGeometry(1, 5); lg.scale(1, 0.6, 1); g.add(instanced(lg, std(0xffffff, { roughness: 0.8, side: THREE.DoubleSide }), ll, { colors: lc, cast: false })); }
}
function treeRow(g, length, r, { x0, x1, step = 16, scale = 1, variants = [0, 1, 2, 3], yAt = null, skipNearStage = true }) {
  for (const v of variants) {
    const geo = treeGeometries(v);
    const list = [];
    for (let z = 4 - v * (step / variants.length); z > -length - 40; z -= step) for (const s of [-1, 1]) {
      const x = s * (x0 + r() * (x1 - x0)), zz = z + (r() - 0.5) * 5;
      if (skipNearStage && zz < -length + 6 && Math.abs(x) < 12) continue;
      list.push({ x, y: yAt ? yAt(x, zz) : 0, z: zz, ry: r() * 6, s: (0.85 + r() * 0.45) * scale });
    }
    g.add(instanced(geo.wood, new THREE.MeshStandardMaterial({ map: T.barkTex(), roughness: 0.9 }), list));
    g.add(instanced(geo.crown, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }), list));
  }
}
// 横跨跑道的串灯：杆 + 弧线 + HDR 灯泡（辉光）
function stringLights(g, length, { step = 16, h = 6, sag = 0.6, x = HALF + 0.9, cols = ['#ffd27a', '#ff9a5a', '#fff0b0'], k = 4, start = -8, zig = false, pole = 0x6a4426 } = {}) {
  const poles = [], bulbs = [], bc = [], wire = [];
  for (let z = start; z > -length + 8; z -= step) {
    for (const s of [-1, 1]) poles.push({ x: s * x, y: h / 2 + 0.1, z });
    const z2 = zig ? z - step / 2 : z;
    let prev = null;
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, px = -x + t * x * 2, py = h - Math.sin(t * PI) * sag, pz = z + (z2 - z) * Math.sin(t * PI);
      const p = new THREE.Vector3(px, py, pz);
      if (prev) wire.push(prev, p);
      prev = p;
      if (i > 0 && i < 16) { bulbs.push({ x: px, y: py - 0.12, z: pz }); bc.push(hdr(cols[i % cols.length], k)); }
    }
  }
  g.add(instanced(new THREE.CylinderGeometry(0.06, 0.08, h + 0.2, 10), std(pole, { roughness: 0.8 }), poles));
  g.add(instanced(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), bulbs, { colors: bc, cast: false, receive: false }));
  const wg = new THREE.BufferGeometry().setFromPoints(wire);
  g.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x2a1a10 })));
}
// 三角彩旗绳
function bunting(g, length, { step = 14, h = 6.4, x = HALF + 1.2, cols = ['#d6283a', '#ff8a1a', '#ffc21a', '#3f8f74', '#fff1d6'], start = -14 } = {}) {
  const pos = [], col = [];
  const c = new THREE.Color();
  for (let z = start; z > -length + 10; z -= step) {
    const n = 18;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 0.7) / n;
      const p0 = new THREE.Vector3(-x + t0 * 2 * x, h - Math.sin(t0 * PI) * 0.7, z), p1 = new THREE.Vector3(-x + t1 * 2 * x, h - Math.sin(t1 * PI) * 0.7, z);
      const tip = p0.clone().lerp(p1, 0.5); tip.y -= 0.5;
      pos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, tip.x, tip.y, tip.z);
      c.set(cols[i % cols.length]); for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  g.add(mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7 }), { cast: false }));
}
// 把一组已摆好位置的几何体按 z 分块合并成少量网格
function mergedChunks(g, list, material, { cast = true, receive = true } = {}) {
  const buckets = new Map();
  for (const it of list) { const k = Math.floor(it.z / 40); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(it.geo); }
  for (const geos of buckets.values()) { const m = new THREE.Mesh(mergeGeometries(geos), material); m.castShadow = cast; m.receiveShadow = receive; g.add(m); }
}
function placed(geo, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 }) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  const out = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(m);
  return { geo: out, z };
}
function uvRect(geo, u0, v0, u1, v1) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  return geo;
}
// 文字招牌图集：每格 512×160
function signAtlas(items, cols = 2) {
  const CW = 512, CH = 160, rows = Math.ceil(items.length / cols);
  const c = T.canvas(CW * cols, CH * rows, (x) => {
    items.forEach((it, i) => {
      const ox = (i % cols) * CW, oy = Math.floor(i / cols) * CH;
      const gr = x.createLinearGradient(0, oy, 0, oy + CH); gr.addColorStop(0, it.bg[0]); gr.addColorStop(1, it.bg[1]);
      x.fillStyle = gr; x.fillRect(ox, oy, CW, CH);
      x.strokeStyle = it.edge || '#e8b030'; x.lineWidth = 10; x.strokeRect(ox + 8, oy + 8, CW - 16, CH - 16);
      x.fillStyle = it.fg || '#fff3d0'; x.font = `900 ${it.size || 78}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      if (it.glow) { x.shadowColor = it.glow; x.shadowBlur = 18; }
      x.fillText(it.text, ox + CW / 2, oy + CH / 2 + 4);
      x.shadowBlur = 0;
    });
  });
  const tx = T.tex(c, { aniso: 8 });
  const rect = (i) => { const cx = i % cols, cy = Math.floor(i / cols); return [cx / cols, 1 - (cy + 1) / rows, (cx + 1) / cols, 1 - cy / rows]; };
  return { tex: tx, rect };
}
function scarecrow(g, x, z, ry = 0) {
  const sc = new THREE.Group(); sc.position.set(x, 0, z); sc.rotation.y = ry; g.add(sc);
  sc.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.8, 8), std(0x6a4426), { y: 1.4 }));
  sc.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 8), std(0x6a4426), { y: 2.0, rz: PI / 2 }));
  sc.add(mesh(new RoundedBoxGeometry(0.75, 0.85, 0.38, 3, 0.1), new THREE.MeshStandardMaterial({ color: 0x3a6ab0, roughness: 0.85 }), { y: 1.85 }));
  sc.add(mesh(new RoundedBoxGeometry(0.2, 0.25, 0.4, 2, 0.05), std(0xc0392b), { x: 0.15, y: 1.8 }));
  sc.add(mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshStandardMaterial({ map: T.strawTex(), roughness: 0.9 }), { y: 2.55 }));
  sc.add(mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 24), std(0xb8904a), { y: 2.76 }));
  sc.add(mesh(new THREE.CylinderGeometry(0.22, 0.27, 0.32, 20), std(0xb8904a), { y: 2.92 }));
}
function woodSign(g, text, x, z, ry, w = 3.4) {
  const st = T.tex(T.canvas(1024, 256, (c, W, H) => { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8a5a2a'); gr.addColorStop(1, '#5a3418'); c.fillStyle = gr; c.fillRect(0, 0, W, H); c.strokeStyle = '#e8b030'; c.lineWidth = 12; c.strokeRect(10, 10, W - 20, H - 20); c.fillStyle = '#ffe08a'; c.font = `900 104px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2 + 6); }));
  const wood = std(0x5a3418);
  g.add(mesh(new RoundedBoxGeometry(w, 0.86, 0.08, 2, 0.03), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: st, roughness: 0.6 }), wood], { x, y: 2.2, z, ry }));
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.2, 10), wood, { x, y: 1.1, z }));
}
// 人群：胶囊身体 + 头 + 帽子，实例化；顶点着色器里按实例号上下欢呼跳动
function crowdMaterial(color, uni) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uni;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float ph = float(gl_InstanceID) * 1.731;\n  transformed.y += max(0.0, sin(uTime * 7.0 + ph)) * 0.16 * step(0.5, fract(ph * 0.37));');
  };
  return m;
}
function crowd(g, list, uni) {
  const SKIN = ['#f2c8a0', '#e0a878', '#c08060', '#8a5a3a', '#f6d6b8'];
  const COAT = ['#c0392b', '#e67e22', '#2e86c1', '#27ae60', '#8e44ad', '#f4d03f', '#5d4037', '#ecf0f1', '#16a085', '#d35400'];
  const HAT = ['#c0392b', '#f39c12', '#2c3e50', '#ecf0f1', '#27ae60', '#8e44ad'];
  const HAIR = ['#2a1a12', '#4a2a18', '#7a4a22', '#c89a4a', '#1a1a1a', '#8a3a1a'];
  const body = new THREE.CapsuleGeometry(0.24, 0.62, 3, 8); body.translate(0, 0.6, 0);
  const head = new THREE.SphereGeometry(0.2, 14, 12); head.translate(0, 1.32, 0);
  // 帽子 / 头发：每个人都有（用同一份实例列表，跳动时和头完全同步）
  const hat = new THREE.SphereGeometry(0.212, 14, 6, 0, PI * 2, 0, PI * 0.46); hat.rotateX(-0.25); hat.translate(0, 1.345, -0.01);
  // 脸：两只眼睛 + 弯弯的笑嘴（深色），两团腮红（粉色）；局部 +z 朝向跑道
  const eye = (x) => { const e = new THREE.SphereGeometry(0.034, 8, 6); e.scale(1, 1.25, 0.6); e.translate(x, 1.35, 0.183); return e.toNonIndexed(); };
  const smile = new THREE.TorusGeometry(0.06, 0.014, 5, 12, PI); smile.rotateZ(PI); smile.translate(0, 1.29, 0.188);
  const face = mergeGeometries([eye(-0.072), eye(0.072), smile.toNonIndexed()]);
  const cheek = (x) => { const c = new THREE.CircleGeometry(0.036, 10); c.translate(x, 1.29, 0.192); c.rotateY(x > 0 ? 0.38 : -0.38); return c.toNonIndexed(); };
  const cheeks = mergeGeometries([cheek(-0.115), cheek(0.115)]);
  const r = T.rng(list.length + 3);
  const bc = list.map(() => COAT[Math.floor(r() * COAT.length)]), hc = list.map(() => SKIN[Math.floor(r() * SKIN.length)]);
  const tc = list.map((_, i) => (i % 3 === 0 ? HAIR[Math.floor(r() * HAIR.length)] : HAT[Math.floor(r() * HAT.length)]));
  g.add(instanced(body, crowdMaterial(0xffffff, uni), list, { colors: bc }));
  g.add(instanced(head, crowdMaterial(0xffffff, uni), list, { colors: hc, cast: false }));
  g.add(instanced(hat, crowdMaterial(0xffffff, uni), list, { colors: tc, cast: false }));
  g.add(instanced(face, crowdMaterial(0x24140e, uni), list, { cast: false, receive: false }));
  const cm = crowdMaterial(0xff7a8a, uni); cm.transparent = true; cm.opacity = 0.75; cm.depthWrite = false;
  g.add(instanced(cheeks, cm, list, { cast: false, receive: false }));
}

// ================= 第 2 关：南瓜丰收田（午后金光） =================
function pumpkinWorld(g, length, r) {
  carpet(g, length);
  grassBits(g, length, r, { tufts: 1500, flowers: 120, leaves: 900, lo: '#4a5218', hi: '#d0b45a', x1: HALF + 4 });
  // 原木分栏围栏
  const posts = [], rails = [];
  const fx = HALF + 1.2;
  for (let z = 8; z > -length + 6; z -= 3) for (const s of [-1, 1]) {
    posts.push({ x: s * fx, y: 0.55, z, ry: r() * 0.4 });
    for (const y of [0.42, 0.86]) rails.push({ x: s * fx, y: y + (r() - 0.5) * 0.06, z: z - 1.5, rx: (r() - 0.5) * 0.06, ry: (r() - 0.5) * 0.05 });
  }
  const logM = new THREE.MeshStandardMaterial({ map: T.barkTex(), color: 0xb89a7a, roughness: 0.9 });
  g.add(instanced(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 8), logM, posts));
  const railGeo = new THREE.CylinderGeometry(0.055, 0.06, 3.15, 7); railGeo.rotateX(PI / 2);
  g.add(instanced(railGeo, logM, rails));
  // 南瓜地：近处高模、远处低模，叶片铺满
  const near = pumpkinGeometry();
  const lathePumpkin = (seg, rings) => { const pts = []; for (let i = 0; i <= rings; i++) { const a = (i / rings) * PI; pts.push(new THREE.Vector2(Math.sin(a) * 0.5, -Math.cos(a) * 0.38)); } const lg = new THREE.LatheGeometry(pts, seg); const p = lg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 - 0.08 * Math.pow(Math.abs(Math.sin(Math.atan2(v.z, v.x) * 5)), 0.6); p.setXYZ(i, v.x * k, v.y, v.z * k); } lg.computeVertexNormals(); lg.translate(0, 0.38, 0); return lg; };
  const mid = lathePumpkin(26, 10);
  const far = (() => { const pts = []; for (let i = 0; i <= 8; i++) { const a = (i / 8) * PI; pts.push(new THREE.Vector2(Math.sin(a) * 0.5, -Math.cos(a) * 0.38)); } const lg = new THREE.LatheGeometry(pts, 18); const p = lg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 - 0.08 * Math.pow(Math.abs(Math.sin(Math.atan2(v.z, v.x) * 5)), 0.6); p.setXYZ(i, v.x * k, v.y, v.z * k); } lg.computeVertexNormals(); lg.translate(0, 0.38, 0); return lg; })();
  const PC = ['#e8742c', '#f08a2a', '#d8601a', '#f2a03a', '#efe6d2', '#e86a20', '#c85a18'];
  const nl = [], nc = [], fl = [], fc = [], stems = [], leaves = [], lc = [];
  for (let z = 6; z > -length + 4; z -= 1.25) for (const s of [-1, 1]) for (let row = 0; row < 8; row++) {
    if (r() < 0.45) continue;
    const x = s * (HALF + 2.0 + row * 1.5 + (r() - 0.5) * 0.6), zz = z + (r() - 0.5) * 0.8;
    const t = { x, z: zz, ry: r() * 6, s: 0.55 + r() * 0.6 };
    if (row < 3) { nl.push(t); nc.push(PC[Math.floor(r() * PC.length)]); stems.push(t); } else { fl.push(t); fc.push(PC[Math.floor(r() * PC.length)]); }
  }
  for (let i = 0; i < 2600; i++) { const s = r() < 0.5 ? -1 : 1; leaves.push({ x: s * (HALF + 1.7 + r() * 12), y: 0.08 + r() * 0.12, z: -r() * (length + 10) + 6, rx: -PI / 2 + (r() - 0.5) * 0.6, rz: r() * 6, s: 0.28 + r() * 0.22 }); lc.push(['#3f6a24', '#4f7a2a', '#5a7a2e', '#6a8a34'][i % 4]); }
  const pM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  g.add(instanced(mid, pM, nl, { colors: nc }));
  g.add(instanced(far, pM, fl, { colors: fc, cast: false }));
  g.add(instanced(stemGeometry(), std(0x5a6a2a, { roughness: 0.7 }), stems));
  const leafGeo = new THREE.CircleGeometry(1, 9); { const p = leafGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, (x * x + y * y) * 0.18); } leafGeo.computeVertexNormals(); }
  g.add(instanced(leafGeo, std(0xffffff, { roughness: 0.65, side: THREE.DoubleSide }), leaves, { colors: lc, cast: false }));
  // 冠军大南瓜 + 蓝丝带
  const sa = signAtlas([{ text: '冠军南瓜', bg: ['#1f4fa8', '#143a80'], edge: '#ffd24a' }, { text: '自摘南瓜 →', bg: ['#8a5a2a', '#5a3418'] }, { text: '丰收大集', bg: ['#b8102a', '#7a0a1e'] }, { text: '新鲜苹果酒', bg: ['#3f6a24', '#2a4a18'] }]);
  const signs = [];
  for (const [i, z] of [[0, -40], [1, -110], [2, -190], [3, -270]].map(([k, z], i) => [i, z])) {
    if (-z > length - 20) continue;
    const s = i % 2 ? 1 : -1, x = s * (HALF + 3.6);
    const big = new THREE.Mesh(near, new THREE.MeshPhysicalMaterial({ color: 0xe8742c, roughness: 0.32, clearcoat: 0.8 }));
    big.position.set(x, 0, z); big.scale.setScalar(3.3); big.rotation.y = r() * 6; big.castShadow = true; g.add(big);
    g.add(mesh(stemGeometry(), std(0x5a6a2a), { x, z, sx: 3.3, sy: 3.3, sz: 3.3 }));
    const ros = new THREE.Group(); ros.position.set(x - s * 1.55, 1.2, z); ros.rotation.y = -s * PI / 2; g.add(ros);
    ros.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 24), std(0x1f4fa8), { rx: PI / 2, cast: false }));
    ros.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24), gold(), { rx: PI / 2, z: 0.01, cast: false }));
    for (const k of [-1, 1]) ros.add(mesh(new THREE.BoxGeometry(0.12, 0.42, 0.02), std(0x1f4fa8), { x: k * 0.07, y: -0.36, rz: k * 0.2, cast: false }));
    const pl = new THREE.PlaneGeometry(2.6, 0.81); const [u0, v0, u1, v1] = sa.rect(0); uvRect(pl, u0, v0, u1, v1);
    signs.push(placed(pl, { x: x - s * 0.3, y: 3.0, z: z + 1.9, ry: 0 }));
  }
  // 路牌
  [[1, -18, -1], [2, -150, 1], [3, -230, -1]].forEach(([i, z, s]) => {
    if (-z > length - 20) return;
    const pl = new THREE.PlaneGeometry(2.6, 0.81); const [u0, v0, u1, v1] = sa.rect(i); uvRect(pl, u0, v0, u1, v1);
    signs.push(placed(pl, { x: s * (HALF + 2.3), y: 2.3, z, ry: s * -0.5 }));
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.0, 8), std(0x5a3418), { x: s * (HALF + 2.3), y: 1.0, z: z - 0.05 }));
  });
  mergedChunks(g, signs, new THREE.MeshStandardMaterial({ map: sa.tex, roughness: 0.6, side: THREE.DoubleSide }), { cast: false });
  // 玉米秆束（感恩节门口最常见的装饰）
  const shock = (() => { const parts = []; for (let k = 0; k < 14; k++) { const a = (k / 14) * PI * 2; const c = new THREE.CylinderGeometry(0.03, 0.06, 2.6, 5); c.translate(0, 1.3, 0); c.rotateZ(Math.cos(a) * 0.18); c.rotateX(Math.sin(a) * 0.18); parts.push(vertexGradient(c.toNonIndexed(), '#8a6a2a', '#e0c070', 0, 2.6)); const leaf = new THREE.PlaneGeometry(0.1, 0.9, 1, 4); const lp = leaf.attributes.position; for (let i = 0; i < lp.count; i++) { const y = lp.getY(i) + 0.45; lp.setXYZ(i, lp.getX(i), y, -y * y * 0.4); } leaf.rotateY(a); leaf.translate(Math.cos(a) * 0.2, 1.6 + (k % 3) * 0.3, Math.sin(a) * 0.2); parts.push(vertexGradient(leaf.toNonIndexed(), '#a8843a', '#e8cf80', 1.3, 2.6)); } const band = new THREE.TorusGeometry(0.2, 0.035, 6, 16); band.rotateX(PI / 2); band.translate(0, 1.35, 0); parts.push(vertexGradient(band.toNonIndexed(), '#8a2a1a', '#a8321a', 1.3, 1.4)); return mergeGeometries(parts); })();
  shock.computeVertexNormals();
  const shocks = [];
  for (let z = -6; z > -length + 10; z -= 18) for (const s of [-1, 1]) shocks.push({ x: s * (HALF + 2.0), z: z + s * 4, ry: r() * 6, s: 0.95 + r() * 0.2 });
  g.add(instanced(shock, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), shocks));
  // 运南瓜的木板车
  for (const z of [-70, -165, -245]) {
    if (-z > length - 20) continue;
    const s = z === -165 ? 1 : -1;
    const w = new THREE.Group(); w.position.set(s * (HALF + 6), 0, z); w.rotation.y = 0.3 * s; g.add(w);
    const plank = new THREE.MeshStandardMaterial({ map: T.barkTex(), color: 0xc8a070, roughness: 0.85 });
    w.add(mesh(new THREE.BoxGeometry(1.8, 0.12, 3.2), plank, { y: 0.9 }));
    for (const k of [-1, 1]) { w.add(mesh(new THREE.BoxGeometry(0.08, 0.6, 3.2), plank, { x: k * 0.9, y: 1.25 })); }
    for (const k of [-1, 1]) w.add(mesh(new THREE.BoxGeometry(1.8, 0.6, 0.08), plank, { y: 1.25, z: k * 1.6 }));
    for (const [wx, wz] of [[-1, -1.1], [1, -1.1], [-1, 1.1], [1, 1.1]]) {
      const wh = new THREE.Group(); wh.position.set(wx * 1.0, 0.55, wz); wh.rotation.y = PI / 2; w.add(wh);
      wh.add(mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 24), std(0x4a2a14)));
      for (let k = 0; k < 6; k++) wh.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 5), std(0x5a3418), { rz: (k / 6) * PI }));
    }
    w.add(mesh(new THREE.BoxGeometry(0.08, 0.08, 2.0), plank, { y: 0.8, z: -2.4 }));
    for (let k = 0; k < 9; k++) { const p = new THREE.Mesh(near, pM.clone()); p.material.color.set(PC[k % PC.length]); p.position.set((r() - 0.5) * 1.2, 0.95 + (k > 5 ? 0.45 : 0), (r() - 0.5) * 2.4); p.scale.setScalar(0.7 + r() * 0.3); p.castShadow = true; w.add(p); }
  }
  // 方草垛金字塔
  const bale = new RoundedBoxGeometry(1.2, 0.55, 0.62, 2, 0.06);
  const bales = [];
  for (let z = -30; z > -length + 15; z -= 48) for (const s of [-1, 1]) {
    const bx = s * (HALF + 4.2), bz = z + s * 9;
    [[0, 0], [1.22, 0], [0.61, 0.55]].forEach(([dx, dy]) => bales.push({ x: bx + (dx - 0.61) * 0.98, y: 0.28 + dy, z: bz, ry: PI / 2 + (r() - 0.5) * 0.1 }));
  }
  g.add(instanced(bale, new THREE.MeshStandardMaterial({ map: T.strawTex(), roughness: 0.95 }), bales));
  [[-1, -55], [1, -130], [-1, -215], [1, -285]].forEach(([s, z]) => { if (-z < length - 15) scarecrow(g, s * (HALF + 8.5), z, s * -0.4); });
  // 远处秋树林带 + 彩旗
  treeRow(g, length, r, { x0: HALF + 15, x1: HALF + 20, step: 12 });
  bunting(g, length, { step: 22, cols: ['#e8742c', '#ffc21a', '#a8321a', '#fff1d6', '#3f6a24'] });
}

// ================= 第 3 关：蔓越莓湿地（晨雾粉紫） =================
function cranberryWaterTex() {
  const W = 512;
  const draw = (x, color) => {
    x.fillStyle = color ? '#7a0a18' : '#000'; x.fillRect(0, 0, W, W);
    const r = T.rng(77);
    for (let i = 0; i < 3600; i++) {
      const cx = r() * W, cy = r() * W, rr = 6 + r() * 4;
      if (color) {
        const g = x.createRadialGradient(cx - rr * 0.35, cy - rr * 0.35, 1, cx, cy, rr);
        const hue = r();
        g.addColorStop(0, hue < 0.2 ? '#ff7a8a' : '#ff5a6a'); g.addColorStop(0.45, hue < 0.5 ? '#c8102a' : hue < 0.85 ? '#a80c24' : '#d83a2a'); g.addColorStop(1, '#4a0610');
        x.fillStyle = g;
      } else { const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; }
      x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill();
    }
  };
  const col = T.canvas(W, W, (x) => draw(x, true));
  const hgt = T.canvas(W, W, (x) => draw(x, false));
  return { map: T.tex(col, { repeat: [34, 120], aniso: 16 }), normalMap: T.normalFromHeight(hgt, 2.5, [34, 120]) };
}
function planksTex(len) {
  return T.tex(T.canvas(512, 512, (x, w, h) => {
    const r = T.rng(5);
    for (let i = 0; i < 8; i++) {
      const y = i * 64; const base = 120 + Math.floor(r() * 40);
      x.fillStyle = `rgb(${base + 40},${base},${base - 50})`; x.fillRect(0, y, w, 62);
      for (let k = 0; k < 40; k++) { x.strokeStyle = `rgba(60,35,15,${0.08 + r() * 0.15})`; x.lineWidth = 1 + r(); x.beginPath(); const yy = y + 4 + r() * 54; x.moveTo(0, yy); x.bezierCurveTo(w * 0.3, yy + (r() - 0.5) * 6, w * 0.6, yy + (r() - 0.5) * 6, w, yy); x.stroke(); }
      x.fillStyle = 'rgba(30,18,8,.9)'; x.fillRect(0, y + 62, w, 2);
      for (const nx of [24, w - 24]) { x.fillStyle = '#3a3a3a'; x.beginPath(); x.arc(nx, y + 16, 3, 0, 7); x.arc(nx, y + 46, 3, 0, 7); x.fill(); }
    }
  }), { repeat: [1, len / 4], aniso: 16 });
}
function bogWorld(g, length, r) {
  // 栈道：木板 + 窄红毯 + 木桩
  const L = length + 30, zc = -length / 2 + 5;
  const deck = new THREE.MeshStandardMaterial({ map: planksTex(L), roughness: 0.8 });
  g.add(mesh(new THREE.BoxGeometry(HALF * 2 + 0.6, 0.2, L), deck, { y: -0.02, z: zc, cast: false, receive: true }));
  carpet(g, length, { width: 3.8, rope: true, y: 0.1 });
  const posts = [], lanterns = [], ropes = [];
  for (let z = 8; z > -length + 6; z -= 3) for (const s of [-1, 1]) {
    posts.push({ x: s * (HALF + 0.15), y: 0.2, z, s: 1 });
    ropes.push({ x: s * (HALF + 0.15), y: 0.88, z: z - 1.5 });
    if (Math.round(z / 3) % 4 === 0) lanterns.push({ x: s * (HALF + 0.15), y: 1.33, z });
  }
  const postGeo = new THREE.CylinderGeometry(0.09, 0.1, 2.0, 8); postGeo.translate(0, -0.05, 0);
  g.add(instanced(postGeo, new THREE.MeshStandardMaterial({ map: T.barkTex(), color: 0x9a7a5a, roughness: 0.9 }), posts));
  const ropeGeo = new THREE.CylinderGeometry(0.03, 0.03, 3.0, 6); ropeGeo.rotateX(PI / 2);
  g.add(instanced(ropeGeo, std(0xc8a878, { roughness: 0.95 }), ropes, { cast: false }));
  const lantern = (() => { const parts = [new THREE.BoxGeometry(0.22, 0.04, 0.22), new THREE.BoxGeometry(0.2, 0.04, 0.2)]; parts[0].translate(0, 0.16, 0); parts[1].translate(0, -0.16, 0); const cap = new THREE.ConeGeometry(0.18, 0.12, 4); cap.rotateY(PI / 4); cap.translate(0, 0.24, 0); parts.push(cap); return mergeGeometries(parts.map((p) => p.toNonIndexed())); })();
  g.add(instanced(lantern, std(0x2a2a2a, { metalness: 0.6, roughness: 0.4 }), lanterns, { cast: false }));
  g.add(instanced(new THREE.BoxGeometry(0.16, 0.28, 0.16), new THREE.MeshBasicMaterial({ color: hdr(0xffc86a, 3), toneMapped: false }), lanterns, { cast: false, receive: false }));
  // 漂满蔓越莓的水面
  const cw = cranberryWaterTex();
  const water = mesh(new THREE.PlaneGeometry(260, length + 360), new THREE.MeshPhysicalMaterial({ map: cw.map, normalMap: cw.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 0.5 }), { rx: -PI / 2, y: -0.12, z: 60 - (length + 360) / 2, cast: false, receive: true });
  g.add(water);
  // 栈道两侧的立体浮果（近景视差）
  const berries = [], bcl = [];
  for (let i = 0; i < 2200; i++) { const s = r() < 0.5 ? -1 : 1; const x = s * (HALF + 0.5 + Math.pow(r(), 1.4) * 10), z = -r() * (length + 20) + 8; if (terrainH(x, z) > -0.15) continue; berries.push({ x, y: -0.1, z, s: 0.07 + r() * 0.04 }); bcl.push(['#c8102a', '#a80c24', '#e0304a', '#8a0a1e', '#d8402a'][i % 5]); }
  g.add(instanced(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, clearcoat: 1 }), berries, { colors: bcl, cast: false }));
  // 黄色围油栏式的采收浮栏（把浮果圈起来）
  const booms = [];
  for (const [x, z, R, a0] of [[-12, -30, 7, 0.2], [13, -90, 8, 2.4], [-14, -150, 6.5, 1.0], [12, -215, 7.5, 3.3], [-13, -280, 8, 0.6], [14, -330, 7, 2.0]]) {
    if (-z > length - 10) continue;
    const pts = []; for (let i = 0; i <= 24; i++) { const a = a0 + (i / 24) * PI * 1.3; pts.push(new THREE.Vector3(x + Math.cos(a) * R, -0.02, z + Math.sin(a) * R)); }
    booms.push({ geo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.16, 8, false).toNonIndexed(), z });
  }
  mergedChunks(g, booms, new THREE.MeshPhysicalMaterial({ color: 0xf2c21a, roughness: 0.35, clearcoat: 0.6 }), { cast: false });
  // 香蒲 / 芦苇
  const reeds = [], tips = [];
  for (let i = 0; i < 900; i++) { const s = r() < 0.5 ? -1 : 1; const x = s * (HALF + 0.8 + r() * 14), z = -r() * (length + 20) + 8; const h = terrainH(x, z); if (h < -0.05 && r() < 0.7) continue; const sc = 0.8 + r() * 0.6; reeds.push({ x, y: Math.max(-0.1, h), z, rz: (r() - 0.5) * 0.2, s: sc }); if (r() < 0.45) tips.push({ x: x + 0, y: Math.max(-0.1, h) + 1.25 * sc, z, s: sc }); }
  const reedGeo = new THREE.CylinderGeometry(0.012, 0.02, 1.4, 4); reedGeo.translate(0, 0.7, 0);
  g.add(instanced(vertexGradient(reedGeo, '#4a6a2a', '#a8b060', 0, 1.4), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), reeds, { cast: false }));
  g.add(instanced(new THREE.CapsuleGeometry(0.035, 0.16, 2, 6), std(0x5a3418, { roughness: 0.9 }), tips, { cast: false }));
  // 土埂上的木箱（装满蔓越莓）
  const crates = [], crateTops = [];
  for (let z = -20; z > -length + 15; z -= 26) for (const s of [-1, 1]) {
    if (r() < 0.35) continue;
    const bx = s * (HALF + 3), bz = Math.round(z / 30) * 30 + (r() - 0.5) * 2;
    for (let k = 0; k < 3; k++) { const c = { x: bx + s * (k % 2) * 0.75, y: 0.31 + (k === 2 ? 0.58 : 0), z: bz + (k === 1 ? 0.65 : 0) + (k === 2 ? 0.3 : 0), ry: (r() - 0.5) * 0.3 }; crates.push(c); crateTops.push({ ...c, y: c.y + 0.27 }); }
  }
  g.add(instanced(new RoundedBoxGeometry(0.7, 0.55, 0.55, 2, 0.03), new THREE.MeshStandardMaterial({ map: planksTex(4), roughness: 0.85 }), crates));
  const topGeo = noisy(new THREE.BoxGeometry(0.62, 0.06, 0.48, 8, 1, 6), 0.0, 3);
  const ct = cw.map.clone(); ct.repeat.set(1.3, 1.1); ct.needsUpdate = true;
  g.add(instanced(topGeo, new THREE.MeshStandardMaterial({ map: ct, roughness: 0.4 }), crateTops, { cast: false }));
  // 加工坊（红色木屋 + 招牌）
  const sa = signAtlas([{ text: '蔓越莓加工坊', bg: ['#b8102a', '#7a0a1e'], size: 66 }, { text: '新鲜蔓越莓酱', bg: ['#fff3e0', '#f0dcc0'], fg: '#8a0a1e', edge: '#8a0a1e', size: 66 }]);
  for (const [s, z, i] of [[-1, -95, 0], [1, -235, 1]]) {
    if (-z > length - 20) continue;
    const h = new THREE.Group(); h.position.set(s * (HALF + 9), 0, z); g.add(h);
    h.add(mesh(new THREE.BoxGeometry(6, 3.6, 8), std(0xa8281e, { roughness: 0.8 }), { y: 1.8 }));
    const roof = new THREE.CylinderGeometry(4.4, 4.4, 8.4, 3, 1); roof.rotateX(PI / 2); roof.rotateZ(PI / 2); roof.scale(1, 0.5, 1);
    h.add(mesh(roof, std(0x3a2a24, { roughness: 0.7 }), { y: 4.6 }));
    h.add(mesh(new THREE.BoxGeometry(0.1, 2.2, 2.4), std(0xf2ead8), { x: -s * 3.02, y: 1.1 }));
    const pl = new THREE.PlaneGeometry(4.2, 1.31); const [u0, v0, u1, v1] = sa.rect(i); uvRect(pl, u0, v0, u1, v1);
    h.add(mesh(pl, new THREE.MeshStandardMaterial({ map: sa.tex, roughness: 0.6 }), { x: -s * 3.06, y: 3.05, ry: -s * PI / 2, cast: false }));
  }
  // 土埂上的红枫与白桦
  treeRow(g, length, r, { x0: HALF + 11, x1: HALF + 15, step: 15, variants: [0, 2], yAt: (x, z) => Math.max(0, terrainH(x, z)) });
  const birch = new THREE.CylinderGeometry(0.1, 0.14, 4.2, 8); birch.translate(0, 2.1, 0);
  const birchCrown = jitterColors(noisy(new THREE.SphereGeometry(1, 12, 9), 0.25, 8), 0.2, 9);
  const bl = [], bcr = [];
  for (let z = -10; z > -length - 20; z -= 13) for (const s of [-1, 1]) { const x = s * (HALF + 18 + r() * 8), zz = z + (r() - 0.5) * 6; const y = Math.max(0, terrainH(x, zz)); bl.push({ x, y, z: zz, s: 0.9 + r() * 0.3 }); bcr.push({ x, y: y + 4.2, z: zz, sx: 1.2, sy: 1.6, sz: 1.2 }); }
  g.add(instanced(birch, new THREE.MeshStandardMaterial({ color: 0xece6dc, roughness: 0.7 }), bl));
  g.add(instanced(birchCrown, new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xf2c23a, roughness: 0.8 }), bcr));
  // 低空薄雾
  const mist = T.cloudTex();
  for (let i = 0; i < 26; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mist, transparent: true, opacity: 0.35, depthWrite: false })); const s = r() < 0.5 ? -1 : 1; sp.position.set(s * (HALF + 8 + r() * 20), 0.8 + r() * 1.2, -r() * length); sp.scale.set(16 + r() * 10, 3 + r() * 2, 1); g.add(sp); }
}

// ================= 第 4 关：小镇游行大街（日落） =================
function facadeAtlas() {
  // 8 种立面：砖红 / 奶油 / 鼠尾草绿 / 藏青 / 芥末黄 / 白色护墙板 / 棕砖 / 赭石
  const W = 512, H = 512;
  const WALL = ['#9a3a2a', '#efe0c4', '#8aa88a', '#2e4a6a', '#d8a83a', '#f2efe8', '#6a3a24', '#c8683a'];
  const r = T.rng(13);
  const lit = [];
  const draw = (x, emissive) => {
    WALL.forEach((wall, i) => {
      const ox = (i % 4) * W, oy = Math.floor(i / 4) * H;
      x.save(); x.translate(ox, oy);
      if (emissive) { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); }
      else {
        x.fillStyle = wall; x.fillRect(0, 0, W, H);
        if (i === 0 || i === 6) { x.strokeStyle = 'rgba(40,15,10,.25)'; x.lineWidth = 1.5; for (let y = 0; y < H; y += 12) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); for (let k = (y / 12) % 2 ? 0 : 14; k < W; k += 28) { x.beginPath(); x.moveTo(k, y); x.lineTo(k, y + 12); x.stroke(); } } }
        if (i === 5) { x.strokeStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H; y += 14) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); } }
        // 檐口
        x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(0, 0, W, 22); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 22, W, 6);
        // 一层店面底框
        x.fillStyle = 'rgba(40,25,20,.85)'; x.fillRect(0, H * 0.66, W, H * 0.34);
      }
      // 上两层窗户
      for (let fl = 0; fl < 2; fl++) for (let k = 0; k < 3; k++) {
        const wx = 52 + k * 150, wy = 60 + fl * 140, ww = 96, wh = 104;
        const on = (i * 7 + fl * 3 + k * 5) % 3 !== 0;
        if (emissive) { if (on) { const gg = x.createLinearGradient(0, wy, 0, wy + wh); gg.addColorStop(0, '#ffcf7a'); gg.addColorStop(1, '#ff9a3a'); x.fillStyle = gg; x.fillRect(wx + 6, wy + 6, ww - 12, wh - 12); } continue; }
        x.fillStyle = '#f6f0e4'; x.fillRect(wx - 8, wy - 8, ww + 16, wh + 22);
        const gg = x.createLinearGradient(0, wy, 0, wy + wh);
        if (on) { gg.addColorStop(0, '#ffe2a0'); gg.addColorStop(1, '#f0a050'); } else { gg.addColorStop(0, '#5a6a8a'); gg.addColorStop(1, '#2a3248'); }
        x.fillStyle = gg; x.fillRect(wx, wy, ww, wh);
        x.fillStyle = '#f6f0e4'; x.fillRect(wx + ww / 2 - 3, wy, 6, wh); x.fillRect(wx, wy + wh / 2 - 3, ww, 6);
        if (i % 2) { x.fillStyle = ['#2a4a3a', '#6a1a1a', '#1a2a4a', '#3a2a1a'][i % 4]; x.fillRect(wx - 30, wy - 4, 20, wh + 8); x.fillRect(wx + ww + 10, wy - 4, 20, wh + 8); }
      }
      // 店面大玻璃 + 门
      const sy = H * 0.7;
      if (emissive) { const gg = x.createLinearGradient(0, sy, 0, H); gg.addColorStop(0, '#ffd890'); gg.addColorStop(1, '#ff9a40'); x.fillStyle = gg; x.fillRect(40, sy + 10, 280, H - sy - 30); x.fillRect(360, sy + 10, 100, H - sy - 20); }
      else { const gg = x.createLinearGradient(0, sy, 0, H); gg.addColorStop(0, '#ffe8b0'); gg.addColorStop(1, '#e89a50'); x.fillStyle = gg; x.fillRect(40, sy + 10, 280, H - sy - 30); x.fillStyle = '#6a3a1a'; x.fillRect(360, sy + 10, 100, H - sy - 20); x.fillStyle = '#ffd890'; x.fillRect(372, sy + 22, 76, 60); x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(176, sy + 10, 6, H - sy - 30); }
      x.restore();
    });
  };
  const col = T.canvas(W * 4, H * 2, (x) => draw(x, false));
  const emi = T.canvas(W * 4, H * 2, (x) => draw(x, true));
  void r; void lit;
  return { map: T.tex(col, { aniso: 8 }), emissiveMap: T.tex(emi, { aniso: 8 }), rect: (i) => [(i % 4) / 4, 1 - (Math.floor(i / 4) + 1) / 2, ((i % 4) + 1) / 4, 1 - Math.floor(i / 4) / 2] };
}
function sidewalkTex(len) {
  return T.tex(T.canvas(256, 256, (x, w, h) => {
    x.fillStyle = '#c8bcae'; x.fillRect(0, 0, w, h);
    const r = T.rng(4);
    for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,50,40'},.07)`; x.fillRect(r() * w, r() * h, 2, 2); }
    x.strokeStyle = 'rgba(80,70,60,.55)'; x.lineWidth = 3;
    for (let k = 0; k <= 4; k++) { x.beginPath(); x.moveTo(0, k * 64); x.lineTo(w, k * 64); x.stroke(); x.beginPath(); x.moveTo(k * 64, 0); x.lineTo(k * 64, h); x.stroke(); }
  }), { repeat: [1, len / 3.5], aniso: 16 });
}
function asphaltTex(len) {
  return T.tex(T.canvas(256, 256, (x, w, h) => {
    x.fillStyle = '#4a4648'; x.fillRect(0, 0, w, h);
    const r = T.rng(6);
    for (let i = 0; i < 9000; i++) { const v = r(); x.fillStyle = v < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.12)'; x.fillRect(r() * w, r() * h, 1.5, 1.5); }
  }), { repeat: [2, len / 6], aniso: 16 });
}
function balloonTurkey() {
  const b = new THREE.Group();
  const shiny = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 });
  b.add(mesh(new THREE.SphereGeometry(1.6, 32, 24), shiny(0x8a4a22), { sy: 1.1 }));
  const fan = ['#d6283a', '#ff8a1a', '#ffc21a', '#3f8f74', '#6a3a9a'];
  for (let i = 0; i < 9; i++) { const a = -1.1 + (i / 8) * 2.2; b.add(mesh(new THREE.SphereGeometry(0.75, 20, 14), shiny(fan[i % 5]), { x: Math.sin(a) * 2.2, y: 0.9 + Math.cos(a) * 2.0, z: 0.9, sx: 0.55, sy: 1.25, sz: 0.3, rz: -a })); }
  b.add(mesh(new THREE.SphereGeometry(0.75, 24, 18), shiny(0xcfe2f6), { y: 1.9, z: -1.0 }));
  b.add(mesh(new THREE.ConeGeometry(0.22, 0.5, 16), shiny(0xf2c060), { y: 1.8, z: -1.8, rx: -PI / 2 }));
  b.add(mesh(new THREE.SphereGeometry(0.22, 16, 12), shiny(0xd61a2a), { y: 1.3, z: -1.55, sy: 1.6 }));
  for (const s of [-1, 1]) { b.add(mesh(new THREE.SphereGeometry(0.2, 16, 12), shiny(0xffffff), { x: s * 0.33, y: 2.1, z: -1.6 })); b.add(mesh(new THREE.SphereGeometry(0.1, 12, 8), shiny(0x1a1a1a), { x: s * 0.36, y: 2.12, z: -1.78 })); }
  return b;
}
function balloonPumpkin() {
  const b = new THREE.Group();
  const p = new THREE.Mesh(pumpkinGeometry(), new THREE.MeshPhysicalMaterial({ color: 0xf08a2a, roughness: 0.25, clearcoat: 1 }));
  p.scale.setScalar(4.2); p.position.y = -1.6; b.add(p);
  b.add(mesh(stemGeometry(), std(0x5a6a2a), { y: -1.6, sx: 4.2, sy: 4.2, sz: 4.2 }));
  return b;
}
function balloonPie() {
  const b = new THREE.Group();
  b.add(mesh(new THREE.CylinderGeometry(2.4, 2.0, 0.9, 40), new THREE.MeshPhysicalMaterial({ color: 0xd8a05a, roughness: 0.4, clearcoat: 0.6 })));
  b.add(mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.2, 40), new THREE.MeshPhysicalMaterial({ color: 0xc8641e, roughness: 0.3, clearcoat: 0.8 }), { y: 0.4 }));
  b.add(mesh(new THREE.TorusGeometry(2.3, 0.28, 12, 40), new THREE.MeshPhysicalMaterial({ color: 0xe8b870, roughness: 0.4, clearcoat: 0.6 }), { y: 0.45, rx: PI / 2 }));
  for (let i = 0; i < 6; i++) b.add(mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xfff8ee, roughness: 0.3, clearcoat: 1 }), { x: Math.cos(i) * 1.1, y: 0.75, z: Math.sin(i) * 1.1, sy: 0.7 }));
  b.rotation.x = 0.5;
  return b;
}
function townWorld(g, length, r) {
  const L = length + 30, zc = -length / 2 + 5;
  carpet(g, length);
  // 路面、路缘石、人行道
  g.add(mesh(new THREE.PlaneGeometry((HALF + 2.4) * 2, L), new THREE.MeshStandardMaterial({ map: asphaltTex(L), roughness: 0.85 }), { rx: -PI / 2, y: 0.005, z: zc, cast: false, receive: true }));
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.18, L), std(0xb8b0a4, { roughness: 0.7 }), { x: s * (HALF + 2.4), y: 0.09, z: zc, cast: false, receive: true }));
    g.add(mesh(new THREE.BoxGeometry(3.6, 0.16, L), new THREE.MeshStandardMaterial({ map: sidewalkTex(L), roughness: 0.8 }), { x: s * (HALF + 4.3), y: 0.08, z: zc, cast: false, receive: true }));
    // 道路黄线
    g.add(mesh(new THREE.PlaneGeometry(0.12, L), std(0xf2c21a, { roughness: 0.6 }), { x: s * (HALF + 0.9), y: 0.012, z: zc, rx: -PI / 2, cast: false }));
  }
  // 两侧连排小楼：立面图集 + 合并网格
  const fa = facadeAtlas();
  const fronts = [], bodies = [], corn = [], awnings = [], signs = [];
  const WALLC = ['#9a3a2a', '#efe0c4', '#8aa88a', '#2e4a6a', '#d8a83a', '#f2efe8', '#6a3a24', '#c8683a'];
  const SHOP = ['面包房', '南瓜派', '丰收超市', '感恩节快乐', '苹果酒屋', '花店', '咖啡馆', '玉米面包', '糖果铺', '旧书店', '烘焙坊', '火鸡加油！'];
  const sa = signAtlas(SHOP.map((t, i) => ({ text: t, bg: [['#2a1a10', '#1a0f08'], ['#7a0a1e', '#4a0612'], ['#1f3f6a', '#142a48'], ['#2a4a2a', '#1a2e1a']][i % 4], fg: '#ffe08a', edge: '#e8b030', size: 76, glow: '#ffb040' })), 3);
  const AW = ['#c0392b', '#e67e22', '#27ae60', '#2e86c1', '#8e44ad', '#16a085'];
  const awTex = T.tex(T.canvas(256, 64, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#dddddd'; x.fillRect(i * 32, 0, 32, h); } }));
  const awList = [], awCol = [];
  const bx0 = HALF + 6.1;
  let si = 0;
  for (const s of [-1, 1]) {
    let z = 14;
    while (z > -length - 14) {
      const w = 7 + r() * 4, h = 8 + r() * 5, dpt = 9, v = Math.floor(r() * 8);
      const zc2 = z - w / 2;
      if (zc2 < -length + 8 && zc2 > -length - 12) { z -= w; continue; }
      const x = s * (bx0 + dpt / 2);
      const body = new THREE.BoxGeometry(dpt, h, w - 0.06);
      const cAttr = []; const col = new THREE.Color(WALLC[v]).multiplyScalar(0.92);
      for (let i = 0; i < body.attributes.position.count; i++) cAttr.push(col.r, col.g, col.b);
      body.setAttribute('color', new THREE.Float32BufferAttribute(cAttr, 3));
      bodies.push(placed(body, { x, y: h / 2, z: zc2 }));
      const fr = new THREE.PlaneGeometry(w - 0.06, h); const [u0, v0, u1, v1] = fa.rect(v); uvRect(fr, u0, v0, u1, v1);
      fronts.push(placed(fr, { x: s * (bx0 - 0.02), y: h / 2, z: zc2, ry: -s * PI / 2 }));
      // 檐口
      const cor = new THREE.BoxGeometry(0.5, 0.45, w);
      corn.push(placed(cor, { x: s * (bx0 + 0.1), y: h + 0.2, z: zc2 }));
      // 遮阳篷 + 招牌
      awList.push({ x: s * (bx0 - 0.7), y: 3.2, z: zc2, rz: s * 0.45, sx: 1.6, sz: w * 0.8 }); awCol.push(AW[Math.floor(r() * AW.length)]);
      const sp = new THREE.PlaneGeometry(Math.min(4.6, w * 0.7), 1.35); const [a0, b0, a1, b1] = sa.rect(si++ % SHOP.length); uvRect(sp, a0, b0, a1, b1);
      signs.push(placed(sp, { x: s * (bx0 - 0.08), y: 4.6, z: zc2, ry: -s * PI / 2 }));
      z -= w;
    }
  }
  mergedChunks(g, bodies, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), { cast: false });
  mergedChunks(g, fronts, new THREE.MeshStandardMaterial({ map: fa.map, emissiveMap: fa.emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.25, roughness: 0.7 }), { cast: false });
  mergedChunks(g, corn, std(0xf2ece0, { roughness: 0.6 }), { cast: false });
  mergedChunks(g, signs, new THREE.MeshStandardMaterial({ map: sa.tex, emissiveMap: sa.tex, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.5 }), { cast: false });
  const awGeo = new THREE.BoxGeometry(0.06, 1, 1);
  g.add(instanced(awGeo, new THREE.MeshStandardMaterial({ map: awTex, roughness: 0.8 }), awList, { colors: awCol, cast: false }));
  // 路灯 + 灯杆旗
  const lamps = [], heads = [], flags = [], flagC = [];
  for (let z = 4; z > -length + 6; z -= 14) for (const s of [-1, 1]) {
    lamps.push({ x: s * (HALF + 2.9), y: 2.6, z });
    heads.push({ x: s * (HALF + 2.9), y: 5.25, z });
    flags.push({ x: s * (HALF + 2.95), y: 3.9, z: z - 0.45 }); flagC.push(['#d6283a', '#e8742c', '#f2b630'][Math.abs(Math.round(z / 14)) % 3]);
  }
  const lampGeo = mergeGeometries([new THREE.CylinderGeometry(0.07, 0.1, 5.2, 10).toNonIndexed(), (() => { const b = new THREE.CylinderGeometry(0.18, 0.2, 0.3, 10); b.translate(0, -2.5, 0); return b.toNonIndexed(); })()]);
  g.add(instanced(lampGeo, std(0x1a1a1a, { metalness: 0.6, roughness: 0.4 }), lamps));
  g.add(instanced(new THREE.SphereGeometry(0.28, 14, 10), new THREE.MeshBasicMaterial({ color: hdr(0xffd890, 3.2), toneMapped: false }), heads, { cast: false, receive: false }));
  const flagGeo = new THREE.PlaneGeometry(0.05, 1.3, 1, 1); flagGeo.scale(1, 1, 1);
  const fg = new THREE.BoxGeometry(0.03, 1.3, 0.8);
  g.add(instanced(fg, std(0xffffff, { roughness: 0.7 }), flags, { colors: flagC, cast: false }));
  void flagGeo;
  // 路栏 + 围观人群（欢呼跳动）
  const uni = { value: 0 };
  g.userData.ticks.push((t) => { uni.value = t; });
  const people = [], barr = [];
  for (let z = 6; z > -length + 6; z -= 0.72) for (const s of [-1, 1]) {
    if (Math.abs(((z % 14) + 14) % 14 - 0) < 0.8) continue;
    for (let row = 0; row < 2; row++) if (r() < 0.82) people.push({ x: s * (HALF + 3.4 + row * 1.0 + (r() - 0.5) * 0.3), y: 0.16, z: z + (r() - 0.5) * 0.3, ry: s * PI / 2 * -1 + (r() - 0.5) * 0.6, s: 0.9 + r() * 0.25 });
  }
  for (let z = 6; z > -length + 6; z -= 2.2) for (const s of [-1, 1]) barr.push({ x: s * (HALF + 2.75), y: 0.18, z });
  crowd(g, people, uni);
  const barGeo = mergeGeometries([(() => { const b = new THREE.BoxGeometry(0.06, 0.18, 2.0); b.translate(0, 0.85, 0); return b.toNonIndexed(); })(), (() => { const b = new THREE.BoxGeometry(0.06, 0.12, 2.0); b.translate(0, 0.45, 0); return b.toNonIndexed(); })(), ...[-0.9, 0.9].map((zz) => { const b = new THREE.BoxGeometry(0.08, 0.95, 0.08); b.translate(0, 0.47, zz); return b.toNonIndexed(); })]);
  const barTex = T.tex(T.canvas(256, 32, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#d6283a' : '#ffffff'; x.fillRect(i * 32, 0, 32, h); } }));
  g.add(instanced(barGeo, new THREE.MeshStandardMaterial({ map: barTex, roughness: 0.6 }), barr));
  // 行道树（秋枫）
  treeRow(g, length, r, { x0: HALF + 3.3, x1: HALF + 3.4, step: 28, scale: 0.8, variants: [0, 2] });
  // 横跨大街的彩旗与串灯
  bunting(g, length, { step: 14, h: 7.2, x: HALF + 5.8, cols: ['#d6283a', '#ff8a1a', '#ffc21a', '#8a3a1a', '#fff1d6'] });
  // 游行气球（随风轻摆）
  const bl = [];
  [[balloonTurkey, -40, -1.2], [balloonPumpkin, -110, 1.5], [balloonPie, -180, -1.0], [balloonTurkey, -250, 1.8], [balloonPumpkin, -320, -1.5]].forEach(([fn, z, x]) => {
    if (-z > length - 20) return;
    const b = fn(); b.position.set(x, 13, z); b.rotation.y = PI; g.add(b); bl.push({ b, y: 13, ph: z });
    const pts = [new THREE.Vector3(x, 11, z), new THREE.Vector3(x + 2.4, 0.2, z + 1), new THREE.Vector3(x, 11, z), new THREE.Vector3(x - 2.4, 0.2, z - 1)];
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x3a2a20 })));
  });
  g.userData.ticks.push((t) => { for (const o of bl) { o.b.position.y = o.y + Math.sin(t * 1.1 + o.ph) * 0.35; o.b.rotation.z = Math.sin(t * 0.8 + o.ph) * 0.06; } });
}

// ================= 第 5 关：丰收夜集市（夜晚彩灯） =================
function stripeTex(c1, c2, n = 16) { return T.tex(T.canvas(512, 64, (x, w, h) => { for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? c2 : c1; x.fillRect((i * w) / n, 0, w / n + 1, h); } })); }
function fairWorld(g, length, r) {
  carpet(g, length);
  grassBits(g, length, r, { tufts: 1200, flowers: 0, leaves: 500, lo: '#1e3a14', hi: '#5a7a34', x1: HALF + 3 });
  // 摊位：木柜台 + 条纹尖顶篷 + 发光招牌 + 暖光内壁
  const tents = [[0xd6283a, 0xfff4e6], [0xe8a02a, 0xfff4e6], [0x2e7a5a, 0xfff4e6]].map(([a, b]) => new THREE.MeshStandardMaterial({ map: stripeTex('#' + a.toString(16).padStart(6, '0'), '#' + b.toString(16).padStart(6, '0')), roughness: 0.7, side: THREE.DoubleSide }));
  const roofs = [[], [], []], counters = [], backs = [], posts = [], signs = [], goods = [], gc = [];
  const NAMES = ['烤玉米', '苹果酒', '南瓜派', '套圈游戏', '棉花糖', '焦糖苹果', '蔓越莓汁', '烤红薯', '丰收面包', '热可可'];
  const sa = signAtlas(NAMES.map((t, i) => ({ text: t, bg: ['#1a0f08', '#2a1408'], fg: ['#ffe08a', '#ffb0c0', '#a8f0ff', '#c8ff9a'][i % 4], edge: ['#ffb040', '#ff6a8a', '#40d0ff', '#8aff5a'][i % 4], glow: ['#ffb040', '#ff6a8a', '#40d0ff', '#8aff5a'][i % 4], size: 84 })), 2);
  let k = 0;
  for (let z = -4; z > -length + 10; z -= 9) for (const s of [-1, 1]) {
    const x = s * (HALF + 4.2), zz = z + (s > 0 ? 4.5 : 0);
    if (zz < -length + 10) continue;
    const ti = Math.floor(r() * 3);
    roofs[ti].push({ x, y: 3.35, z: zz, ry: PI / 4 });
    counters.push({ x: x - s * 1.2, y: 0.55, z: zz });
    backs.push({ x: x + s * 1.45, y: 1.6, z: zz, ry: PI / 2 });
    for (const [dx, dz] of [[-1.3, -1.3], [-1.3, 1.3], [1.3, -1.3], [1.3, 1.3]]) posts.push({ x: x + dx, y: 1.45, z: zz + dz });
    const pl = new THREE.PlaneGeometry(2.4, 0.75); const [u0, v0, u1, v1] = sa.rect(k++ % NAMES.length); uvRect(pl, u0, v0, u1, v1);
    signs.push(placed(pl, { x: x - s * 1.42, y: 2.45, z: zz, ry: -s * PI / 2 }));
    for (let j = 0; j < 5; j++) { goods.push({ x: x - s * 1.2 + (r() - 0.5) * 0.3, y: 1.18, z: zz + (j - 2) * 0.45, s: 0.32 + r() * 0.1, ry: r() * 6 }); gc.push(['#e8742c', '#d6283a', '#f2c23a', '#8a2a1a'][j % 4]); }
  }
  const roofGeo = new THREE.ConeGeometry(2.05, 1.5, 4, 1, true);
  roofs.forEach((list, i) => g.add(instanced(roofGeo, tents[i], list, { cast: false })));
  g.add(instanced(new RoundedBoxGeometry(0.7, 1.1, 2.6, 2, 0.04), new THREE.MeshStandardMaterial({ map: planksTex(3), roughness: 0.8 }), counters));
  g.add(instanced(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ color: hdr(0xffb060, 0.9), side: THREE.DoubleSide }), backs, { cast: false }));
  g.add(instanced(new THREE.CylinderGeometry(0.05, 0.05, 2.9, 6), std(0x6a4426), posts, { cast: false }));
  g.add(instanced(pumpkinGeometry(), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, clearcoat: 0.6 }), goods, { colors: gc, cast: false }));
  mergedChunks(g, signs, new THREE.MeshBasicMaterial({ map: sa.tex, color: hdr(0xffffff, 1.6), toneMapped: false, side: THREE.DoubleSide }), { cast: false, receive: false });
  // 密集的之字形串灯
  stringLights(g, length, { step: 7, h: 6.2, sag: 0.9, x: HALF + 1.6, zig: true, cols: ['#ffd27a', '#ff6a8a', '#7ad0ff', '#fff0b0', '#9aff6a'], k: 2.6, pole: 0x3a2a1e });
  // 草垛 + 玉米秆 + 灯笼
  const bale = new RoundedBoxGeometry(1.2, 0.55, 0.62, 2, 0.06);
  const bales = [];
  for (let z = -8; z > -length + 10; z -= 9) for (const s of [-1, 1]) if (r() < 0.6) bales.push({ x: s * (HALF + 1.9), y: 0.28, z: z + s * 2.2, ry: (r() - 0.5) * 0.3 });
  g.add(instanced(bale, new THREE.MeshStandardMaterial({ map: T.strawTex(), roughness: 0.95 }), bales));
  const cl = [];
  for (let i = 0; i < bales.length; i++) if (i % 2 === 0) cl.push({ x: bales[i].x, y: 0.75, z: bales[i].z });
  g.add(instanced(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: hdr(0xff9a3a, 3), toneMapped: false }), cl, { cast: false, receive: false }));
  const cg = cornGeometry(); const cList = [];
  for (let z = -16; z > -length; z -= 20) for (const s of [-1, 1]) for (let a = 0; a < 24; a++) cList.push({ x: s * (HALF + 8.4 + (a % 4) * 0.7 + r() * 0.3), z: z + Math.floor(a / 4) * 0.8, ry: r() * 6, s: 1.0 + r() * 0.3 });
  g.add(instanced(cg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide }), cList));
  // 摩天轮（远处，缓慢旋转，灯泡发光）
  const wheel = new THREE.Group(); wheel.position.set(-34, 19, -Math.min(length * 0.55, 220)); g.add(wheel);
  const rot = new THREE.Group(); wheel.add(rot);
  const steel = std(0xe8e0d0, { metalness: 0.5, roughness: 0.4 });
  for (const zz of [-0.8, 0.8]) { rot.add(mesh(new THREE.TorusGeometry(16, 0.25, 8, 96), steel, { z: zz, cast: false })); rot.add(mesh(new THREE.TorusGeometry(15.2, 0.12, 6, 96), steel, { z: zz, cast: false })); }
  for (let i = 0; i < 16; i++) rot.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 32, 6), steel, { rz: (i / 16) * PI, cast: false }));
  const wb = [], wbc = [];
  for (let i = 0; i < 96; i++) { const a = (i / 96) * PI * 2; for (const zz of [-0.8, 0.8]) { wb.push({ x: Math.cos(a) * 16, y: Math.sin(a) * 16, z: zz }); wbc.push(hdr(['#ff5a8a', '#ffd27a', '#7ad0ff'][i % 3], 5)); } }
  rot.add(instanced(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), wb, { colors: wbc, cast: false, receive: false }));
  const cabins = [];
  for (let i = 0; i < 16; i++) { const c = new THREE.Group(); const a = (i / 16) * PI * 2; c.userData.a = a; rot.add(c); c.add(mesh(new RoundedBoxGeometry(1.8, 1.6, 1.4, 2, 0.2), std(['#d6283a', '#f2b630', '#2e86c1', '#27ae60'][i % 4], { roughness: 0.4 }), { y: -1.2, cast: false })); c.add(mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ color: hdr(0xffd890, 2), toneMapped: false }), { y: -1.0, z: 0.71, cast: false })); cabins.push(c); }
  for (const s of [-1, 1]) wheel.add(mesh(new THREE.CylinderGeometry(0.35, 0.5, 22, 8), steel, { x: s * 5, y: -9, rz: s * 0.25, cast: false }));
  g.userData.ticks.push((t) => { rot.rotation.z = t * 0.12; for (const c of cabins) { const a = c.userData.a + rot.rotation.z; c.position.set(Math.cos(c.userData.a) * 16, Math.sin(c.userData.a) * 16, 0); c.rotation.z = -rot.rotation.z; void a; } });
  // 入口拱门
  const sa2 = signAtlas([{ text: '丰收夜集市', bg: ['#7a0a1e', '#4a0612'], fg: '#ffe08a', glow: '#ffb040', size: 92 }], 1);
  const arch = new THREE.Group(); arch.position.set(0, 0, -10); g.add(arch);
  for (const s of [-1, 1]) arch.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 7.2, 12), std(0x6a4426), { x: s * (HALF + 1.4), y: 3.6 }));
  const ap = new THREE.PlaneGeometry(6.2, 1.94); const [u0, v0, u1, v1] = sa2.rect(0); uvRect(ap, u0, v0, u1, v1);
  arch.add(mesh(ap, new THREE.MeshBasicMaterial({ map: sa2.tex, color: hdr(0xffffff, 1.5), toneMapped: false, side: THREE.DoubleSide }), { y: 7.2, cast: false }));
  // 萤火虫
  const ff = [];
  for (let i = 0; i < 160; i++) { const s = r() < 0.5 ? -1 : 1; ff.push({ x: s * (HALF + 2 + r() * 10), y: 0.6 + r() * 2.5, z: -r() * length, s: 0.05 }); }
  const ffm = instanced(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ color: hdr(0xd8ff7a, 4), toneMapped: false }), ff, { cast: false, receive: false });
  g.add(ffm);
  g.userData.ticks.push((t) => { ffm.position.y = Math.sin(t * 0.7) * 0.25; ffm.position.x = Math.sin(t * 0.4) * 0.3; });
}

// ================= 第 6 关：赦免大会主会场（夜晚、烟花、聚光灯） =================
function marbleTex(len) {
  return T.tex(T.canvas(512, 512, (x, w, h) => {
    x.fillStyle = '#efe8dc'; x.fillRect(0, 0, w, h);
    const r = T.rng(19);
    for (let i = 0; i < 50; i++) { x.strokeStyle = `rgba(140,120,100,${0.05 + r() * 0.1})`; x.lineWidth = 0.6 + r() * 1.4; x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - 0.5) * 120; py += (r() - 0.3) * 90; x.lineTo(px, py); } x.stroke(); }
    x.strokeStyle = '#c99a2e'; x.lineWidth = 4;
    for (let k = 0; k <= 2; k++) { x.beginPath(); x.moveTo(0, k * 256); x.lineTo(w, k * 256); x.stroke(); x.beginPath(); x.moveTo(k * 256, 0); x.lineTo(k * 256, h); x.stroke(); }
    x.fillStyle = '#7a0c20'; for (const [cx, cy] of [[0, 0], [256, 0], [0, 256], [256, 256], [512, 0], [0, 512], [512, 512], [256, 512], [512, 256]]) { x.save(); x.translate(cx, cy); x.rotate(PI / 4); x.fillRect(-14, -14, 28, 28); x.restore(); }
  }), { repeat: [4, len / 4], aniso: 16 });
}
function bannerTex() {
  return T.tex(T.canvas(256, 640, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#5a0612'); gr.addColorStop(0.5, '#a8102a'); gr.addColorStop(1, '#5a0612');
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#e8b030'; x.lineWidth = 10; x.strokeRect(14, 14, w - 28, h - 70);
    // 金色尾屏徽章
    const cx = w / 2, cy = 190;
    for (let i = 0; i < 9; i++) { const a = -PI * 0.85 + (i / 8) * PI * 0.7; x.fillStyle = i % 2 ? '#f2c94a' : '#d8a32a'; x.beginPath(); x.ellipse(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, 18, 40, a + PI / 2, 0, 7); x.fill(); }
    x.fillStyle = '#e8b030'; x.beginPath(); x.arc(cx, cy + 18, 34, 0, 7); x.fill();
    x.fillStyle = '#5a0612'; x.beginPath(); x.arc(cx, cy + 18, 22, 0, 7); x.fill();
    x.fillStyle = '#ffe08a'; x.font = `900 76px ${FONT}`; x.textAlign = 'center';
    x.fillText('赦', cx, 360); x.fillText('免', cx, 450);
    x.fillStyle = '#e8b030'; for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(14 + i * 33, h - 56); x.lineTo(30 + i * 33, h - 10); x.lineTo(46 + i * 33, h - 56); x.fill(); }
  }));
}
function galaWorld(g, length, r) {
  const L = length + 30, zc = -length / 2 + 5;
  g.add(mesh(new THREE.BoxGeometry(HALF * 2 + 9, 0.12, L), new THREE.MeshPhysicalMaterial({ map: marbleTex(L), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 }), { y: -0.04, z: zc, cast: false, receive: true }));
  carpet(g, length, { rope: true });
  // 金色隔离柱 + 红色天鹅绒绳
  const st = [], ropes = [];
  for (let z = 6; z > -length + 6; z -= 2.6) for (const s of [-1, 1]) { st.push({ x: s * (HALF + 0.75), y: 0, z }); ropes.push({ x: s * (HALF + 0.75), y: 0.82, z: z - 1.3 }); }
  const stGeo = mergeGeometries([(() => { const b = new THREE.CylinderGeometry(0.2, 0.24, 0.06, 16); b.translate(0, 0.03, 0); return b.toNonIndexed(); })(), (() => { const b = new THREE.CylinderGeometry(0.04, 0.05, 0.95, 10); b.translate(0, 0.5, 0); return b.toNonIndexed(); })(), (() => { const b = new THREE.SphereGeometry(0.075, 12, 8); b.translate(0, 1.0, 0); return b.toNonIndexed(); })()]);
  g.add(instanced(stGeo, gold(), st));
  const rg = new THREE.CylinderGeometry(0.045, 0.045, 2.6, 8); rg.rotateX(PI / 2); { const p = rg.attributes.position; for (let i = 0; i < p.count; i++) { const zz = p.getZ(i); p.setY(i, p.getY(i) - (1 - (zz / 1.3) ** 2) * 0.16); } rg.computeVertexNormals(); }
  g.add(instanced(rg, new THREE.MeshPhysicalMaterial({ color: 0x8a0a22, roughness: 0.5, sheen: 1, sheenColor: new THREE.Color(0xff5060) }), ropes, { cast: false }));
  // 观礼台（三级台阶 + 欢呼人群）
  const uni = { value: 0 };
  g.userData.ticks.push((t) => { uni.value = t; });
  const steps = [], people = [];
  for (let z = 4; z > -length + 10; z -= 6) for (const s of [-1, 1]) for (let tier = 0; tier < 3; tier++) steps.push({ x: s * (HALF + 2.6 + tier * 1.1), y: 0.25 + tier * 0.45, z: z - 3, sy: 1 + tier * 0.9 });
  for (let z = 4; z > -length + 10; z -= 0.7) for (const s of [-1, 1]) for (let tier = 0; tier < 3; tier++) if (r() < 0.8) people.push({ x: s * (HALF + 2.6 + tier * 1.1 + (r() - 0.5) * 0.3), y: 0.5 + tier * 0.9, z: z + (r() - 0.5) * 0.3, ry: -s * PI / 2 + (r() - 0.5) * 0.5, s: 0.9 + r() * 0.2 });
  g.add(instanced(new THREE.BoxGeometry(1.1, 0.5, 6), std(0x3a2a3a, { roughness: 0.6 }), steps, { cast: false }));
  crowd(g, people, uni);
  // 白色柱廊 + 金色檐 + 红金长幡
  const colX = HALF + 7.2;
  const cols = [], caps = [], bases = [], bans = [];
  for (let z = 6; z > -length - 6; z -= 5) for (const s of [-1, 1]) {
    if (z < -length + 8 && z > -length - 12) continue;
    cols.push({ x: s * colX, y: 5, z }); caps.push({ x: s * colX, y: 10.15, z }); bases.push({ x: s * colX, y: 0.2, z });
    if (Math.round(z / 5) % 2 === 0) bans.push({ x: s * (colX - 0.55), y: 6.2, z: z - 2.5, ry: -s * PI / 2 });
  }
  const shaft = new THREE.CylinderGeometry(0.42, 0.48, 10, 20, 1);
  { const p = shaft.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 - 0.04 * Math.max(0, Math.cos(a * 20)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } shaft.computeVertexNormals(); }
  const marble = new THREE.MeshPhysicalMaterial({ color: 0xf6f0e6, roughness: 0.3, clearcoat: 0.6 });
  g.add(instanced(shaft, marble, cols));
  g.add(instanced(new RoundedBoxGeometry(1.3, 0.35, 1.3, 2, 0.05), marble, caps));
  g.add(instanced(new RoundedBoxGeometry(1.3, 0.4, 1.3, 2, 0.05), marble, bases));
  const ent = [];
  for (let z = 6; z > -length - 6; z -= 40) for (const s of [-1, 1]) ent.push(placed(new THREE.BoxGeometry(1.6, 1.0, 40), { x: s * colX, y: 10.8, z: z - 20 }));
  mergedChunks(g, ent, marble, { cast: false });
  const trim = [];
  for (let z = 6; z > -length - 6; z -= 40) for (const s of [-1, 1]) trim.push(placed(new THREE.BoxGeometry(1.7, 0.12, 40), { x: s * colX, y: 10.35, z: z - 20 }));
  mergedChunks(g, trim, gold(), { cast: false });
  g.add(instanced(new THREE.PlaneGeometry(2.0, 5.0), new THREE.MeshStandardMaterial({ map: bannerTex(), roughness: 0.6, side: THREE.DoubleSide, emissive: 0x330008 }), bans, { cast: false }));
  // 金色火盆（火焰精灵）
  const braz = [], flames = [];
  for (let z = 2; z > -length + 8; z -= 10) for (const s of [-1, 1]) { braz.push({ x: s * (colX - 1.2), y: 0, z }); flames.push({ x: s * (colX - 1.2), y: 1.45, z }); }
  const bGeo = mergeGeometries([(() => { const b = new THREE.CylinderGeometry(0.08, 0.14, 1.1, 10); b.translate(0, 0.55, 0); return b.toNonIndexed(); })(), (() => { const b = new THREE.CylinderGeometry(0.38, 0.18, 0.32, 16); b.translate(0, 1.22, 0); return b.toNonIndexed(); })()]);
  g.add(instanced(bGeo, gold(), braz));
  const flameM = new THREE.MeshBasicMaterial({ map: T.softDot(), color: hdr(0xff9a3a, 3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const flameGeo = new THREE.PlaneGeometry(0.9, 1.2);
  const fm = instanced(flameGeo, flameM, flames, { cast: false, receive: false });
  g.add(fm);
  // 扫动的聚光灯光柱
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const beamGeo = new THREE.ConeGeometry(2.6, 60, 24, 1, true); beamGeo.translate(0, -30, 0); beamGeo.rotateX(PI);
  const beams = [];
  for (let z = -20; z > -length - 20; z -= 45) for (const s of [-1, 1]) { const b = new THREE.Mesh(beamGeo, beamM); b.position.set(s * (colX + 4), 0, z); b.userData.ph = z * 0.1 + s; g.add(b); beams.push(b); }
  g.userData.ticks.push((t) => { for (const b of beams) { b.rotation.z = Math.sin(t * 0.6 + b.userData.ph) * 0.45; b.rotation.x = -0.25 + Math.cos(t * 0.45 + b.userData.ph) * 0.2; } });
  // 烟花：池化粒子，周期性在前方夜空绽放
  const N = 7, P = 140;
  const pos = new Float32Array(N * P * 3), col = new Float32Array(N * P * 3);
  const vel = new Float32Array(N * P * 3);
  const life = new Float32Array(N);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const fw = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.3, vertexColors: true, map: T.softDot(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  fw.frustumCulled = false;
  g.add(fw);
  const FW = [[1, 0.35, 0.4], [1, 0.8, 0.3], [0.5, 0.8, 1], [0.6, 1, 0.5], [1, 0.5, 1], [1, 1, 1]];
  let next = 0, slot = 0;
  g.userData.camZ = 0;
  g.userData.ticks.push((t, dt) => {
    next -= dt;
    if (next <= 0) {
      next = 0.6 + Math.random() * 0.8;
      const i = slot++ % N; life[i] = 2.2;
      const cx = (Math.random() - 0.5) * 70, cy = 34 + Math.random() * 22, cz = g.userData.camZ - 90 - Math.random() * 70;
      const c = FW[Math.floor(Math.random() * FW.length)];
      for (let k = 0; k < P; k++) {
        const j = (i * P + k) * 3;
        const u = Math.random() * PI * 2, v = Math.acos(2 * Math.random() - 1), sp = 9 + Math.random() * 3;
        pos[j] = cx; pos[j + 1] = cy; pos[j + 2] = cz;
        vel[j] = Math.cos(u) * Math.sin(v) * sp; vel[j + 1] = Math.cos(v) * sp; vel[j + 2] = Math.sin(u) * Math.sin(v) * sp;
      }
      fw.userData[i] = c;
    }
    for (let i = 0; i < N; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt;
      const c = fw.userData[i] || FW[0];
      const k2 = Math.max(0, life[i] / 2.2) * 4;
      for (let k = 0; k < P; k++) {
        const j = (i * P + k) * 3;
        vel[j] *= 0.985; vel[j + 1] = vel[j + 1] * 0.985 - 6 * dt; vel[j + 2] *= 0.985;
        pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
        col[j] = c[0] * k2; col[j + 1] = c[1] * k2; col[j + 2] = c[2] * k2;
      }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    flameM.color.copy(hdr(0xff9a3a, 2.6 + Math.sin(t * 13) * 0.4));
  });
  // 两侧金灯笼串
  stringLights(g, length, { step: 10, h: 7.5, sag: 0.5, x: HALF + 1.7, cols: ['#ffd27a', '#fff0b0'], k: 4, pole: 0xc99a2e });
}

// 第二章场景复用的通用件
export { carpet, grassBits, treeRow, stringLights, bunting, mergedChunks, placed, uvRect, signAtlas, crowd, woodSign, stripeTex, facadeAtlas, asphaltTex, sidewalkTex, balloonTurkey, balloonPumpkin, balloonPie, hdr, gold, FONT };
