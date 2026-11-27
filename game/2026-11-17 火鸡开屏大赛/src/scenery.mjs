// 场景（高精度版）：天空云朵远山、草地落叶、红毯金边、白栅栏、秋树、南瓜、草卷、玉米、串灯、餐桌、舞台
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from '../vendor/utils/BufferGeometryUtils.js';
import * as T from './tex.mjs';
import { HALF } from './game.mjs';
import { THEMES } from './themes.mjs';

export function mesh(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}
export const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
const _o = new THREE.Object3D();
// 按 z 分块（每 40m 一块），让视锥/阴影相机能剔除远处和身后的实例
export function instanced(geo, mat, list, opts = {}) {
  const zs = list.map((t) => t.z || 0);
  const zmin = Math.min(...zs), zmax = Math.max(...zs);
  if (list.length < 40 || zmax - zmin < 60) return instancedOne(geo, mat, list, opts);
  const g = new THREE.Group(), buckets = new Map();
  list.forEach((t, i) => { const k = Math.floor((t.z || 0) / 40); if (!buckets.has(k)) buckets.set(k, { l: [], c: [] }); const b = buckets.get(k); b.l.push(t); if (opts.colors) b.c.push(opts.colors[i]); });
  for (const b of buckets.values()) g.add(instancedOne(geo, mat, b.l, { ...opts, colors: opts.colors ? b.c : null }));
  return g;
}
function instancedOne(geo, mat, list, { cast = true, receive = true, colors = null } = {}) {
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((t, i) => {
    _o.position.set(t.x || 0, t.y || 0, t.z || 0);
    _o.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0);
    const s = t.s ?? 1; _o.scale.set(t.sx ?? s, t.sy ?? s, t.sz ?? s);
    _o.updateMatrix(); im.setMatrixAt(i, _o.matrix);
    if (colors) im.setColorAt(i, new THREE.Color(colors[i]));
  });
  im.castShadow = cast; im.receiveShadow = receive;
  im.computeBoundingSphere();
  return im;
}
// 给几何体按高度着色（顶部亮、底部暗）
export function vertexGradient(geo, bottom, top, y0, y1) {
  const p = geo.attributes.position, c = new Float32Array(p.count * 3);
  const a = new THREE.Color(bottom), b = new THREE.Color(top), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const k = Math.min(1, Math.max(0, (p.getY(i) - y0) / (y1 - y0))); t.copy(a).lerp(b, k); c[i * 3] = t.r; c[i * 3 + 1] = t.g; c[i * 3 + 2] = t.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo;
}
export function noisy(geo, amt, seed = 1) {
  const r = T.rng(seed);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  const cache = new Map();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    if (!cache.has(key)) cache.set(key, 1 + (r() - 0.5) * amt);
    v.multiplyScalar(cache.get(key));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// ---------- 天空与远景 ----------
export function buildSky(scene) {
  const g = new THREE.Group();
  const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), skyMat);
  sky.renderOrder = -10;
  g.add(sky);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.softDot(), color: 0xffe2a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  g.add(sun);
  const cloud = T.cloudTex();
  const r = T.rng(21);
  const clouds = [];
  for (let i = 0; i < 16; i++) {
    const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloud, transparent: true, depthWrite: false, fog: false, opacity: 0.85 }));
    const w = 60 + r() * 70;
    c.scale.set(w, w * 0.4, 1);
    c.position.set((r() - 0.5) * 500, 60 + r() * 70, -150 - r() * 200);
    g.add(c); clouds.push(c);
  }
  // 夜空星星（只在夜晚主题显示）
  const sp = [], sc = [];
  for (let i = 0; i < 1400; i++) {
    const u = r() * Math.PI * 2, v = Math.acos(r() * 0.92);
    const R = 380;
    sp.push(Math.cos(u) * Math.sin(v) * R, Math.cos(v) * R, Math.sin(u) * Math.sin(v) * R);
    const k = 0.6 + r() * 2.2; sc.push(k, k * (0.9 + r() * 0.1), k * (0.85 + r() * 0.25));
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.6, vertexColors: true, fog: false, depthWrite: false, sizeAttenuation: true, transparent: true, opacity: 0.95 }));
  stars.renderOrder = -9;
  g.add(stars);
  const texCache = {};
  g.userData.setTheme = (name) => {
    const th = THEMES[name] || THEMES.farm;
    if (!texCache[name]) texCache[name] = T.skyTex(th.sky);
    skyMat.map = texCache[name]; skyMat.needsUpdate = true;
    sun.material.color.setHex(th.sun.color);
    sun.scale.set(th.sun.size, th.sun.size, 1); sun.position.set(...th.sun.pos);
    clouds.forEach((c) => { c.material.color.setHex(th.clouds.color); c.material.opacity = th.clouds.opacity; });
    stars.visible = !!th.night;
    g.visible = !th.indoor;
  };
  g.userData.setTheme('farm');
  g.userData.sun = sun;
  scene.add(g);
  return g;
}
// 起伏的秋日农田地形：路两侧 14m 内平坦，往外缓缓隆起成丘陵；顶点色画出牧草/麦田/翻耕地块
const sstep = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
let TERRAIN = 'farm';
export function setTerrain(name) { TERRAIN = name; }
export function terrainH(x, z) {
  const ax = Math.abs(x);
  if (TERRAIN === 'bog') {
    // 蔓越莓田：水面以下的浅池 + 方格土埂，远处才起丘陵
    const gx = (ax - HALF - 3) / 24, gz = z / 30;
    const dx = Math.abs(gx - Math.round(gx)) * 24, dz = Math.abs(gz - Math.round(gz)) * 30;
    const dyke = ax > HALF + 2 ? 1 - sstep(0.6, 1.6, Math.min(dx, dz)) : 0;
    return -0.45 + dyke * 0.75 + sstep(70, 120, ax) * 14;
  }
  if (TERRAIN === 'town' || TERRAIN === 'gala' || TERRAIN === 'float') return sstep(30, 90, ax) * 12 + sstep(60, 130, ax) * 8;
  const n = Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.031 + 0.7) + 0.55 * Math.sin(x * 0.11 + z * 0.07 + 2.1) + 0.3 * Math.sin(x * 0.23 - z * 0.17 + 0.4) + 0.15 * Math.sin(z * 0.4 + x * 0.3);
  return sstep(14, 46, ax) * (2.5 + 8 * (0.5 + 0.5 * n)) + sstep(30, 110, ax) * 10;
}
function hash2(a, b) { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); }
export function buildHills(parent, length, theme = 'farm') {
  setTerrain(theme);
  const TH = THEMES[theme] || THEMES.farm;
  const g = new THREE.Group();
  const W = 260, L = length + 360, z0 = 60;
  const geo = new THREE.PlaneGeometry(W, L, 200, Math.round(L / 1.8));
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, z0 - L / 2);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3);
  const FIELD = TH.fields.map((c) => new THREE.Color(c));
  const meadow = new THREE.Color(TH.meadow[0]), meadow2 = new THREE.Color(TH.meadow[1]), c = new THREE.Color(), tmp = new THREE.Color();
  const mud = new THREE.Color('#3a1a12');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), ax = Math.abs(x);
    const h = terrainH(x, z);
    p.setY(i, h - 0.03);
    const mott = 0.5 + 0.5 * Math.sin(x * 0.7 + Math.sin(z * 0.3) * 2) * Math.cos(z * 0.45 + x * 0.2);
    c.copy(meadow).lerp(meadow2, mott * 0.7);
    const fx = Math.floor((x + (x > 0 ? 3 : -3)) / 16), fz = Math.floor((z + Math.sin(x * 0.05) * 6) / 22);
    const hh = hash2(fx, fz);
    tmp.copy(FIELD[Math.floor(hh * FIELD.length)]);
    if (hh > 0.3 && hh < 0.75) tmp.multiplyScalar(0.92 + 0.12 * Math.sin((z + x * 0.3) * 2.2));
    c.lerp(tmp, sstep(17, 24, ax));
    if (theme === 'bog' && h < -0.2) c.copy(mud);
    c.multiplyScalar(0.88 + Math.min(0.2, Math.max(0, h) * 0.012));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: TH.snow ? null : T.grassDetailTex(), roughness: TH.snow ? 0.75 : 0.95 }));
  ground.receiveShadow = true;
  g.add(ground);
  const r = T.rng(31);
  const crownGeo = jitterColors(noisy(new THREE.SphereGeometry(1, 10, 8), 0.22, 77), 0.18, 5);
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 1.6, 6); trunkGeo.translate(0, 0.8, 0);
  const pineGeo = (() => { const parts = []; for (let k = 0; k < 3; k++) { const cg = new THREE.ConeGeometry(1.1 - k * 0.25, 1.6, 14); cg.translate(0, 1.4 + k * 0.85, 0); parts.push(cg); } return jitterColors(mergeGeometries(parts), 0.15, 6); })();
  pineGeo.computeVertexNormals();
  const crowns = [], cc = [], trunks = [], pines = [], pc = [];
  const AUT = TH.trees;
  const place = (x, z, big = 1) => {
    const y = terrainH(x, z);
    if (r() < (TH.pine ?? 0.18)) { pines.push({ x, y: y - 0.1, z, s: (0.8 + r() * 0.6) * big, ry: r() * 6 }); const PC = TH.pineCols || ['#2f5a2e', '#3c6a34', '#294e2a']; pc.push(PC[Math.floor(r() * PC.length)]); return; }
    const s = (1.1 + r() * 0.9) * big;
    trunks.push({ x, y: y - 0.1, z, s });
    crowns.push({ x, y: y + 1.5 * s + 0.9 * s, z, sx: 1.25 * s, sy: 1.1 * s, sz: 1.25 * s, ry: r() * 6 });
    cc.push(AUT[Math.floor(r() * AUT.length)]);
  };
  for (let i = 0; i < 520; i++) {
    const side = r() < 0.5 ? -1 : 1;
    const x = side * ((theme === 'town' || theme === 'gala' || theme === 'float' ? 38 : theme === 'bog' ? 66 : 20) + r() * 90);
    let z = z0 - 20 - r() * (L - 40);
    if (r() < 0.6) z = Math.round(z / 22) * 22 + (r() - 0.5) * 2;
    place(x, z, Math.abs(x) > 60 ? 1.4 : 1);
  }
  const autM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  g.add(instanced(trunkGeo, std(0x4a3020, { roughness: 0.9 }), trunks, { receive: false }));
  g.add(instanced(crownGeo, autM, crowns, { colors: cc }));
  g.add(instanced(pineGeo, autM, pines, { colors: pc }));
  const barnBody = new THREE.BoxGeometry(4, 3, 6); barnBody.translate(0, 1.5, 0);
  const roof = new THREE.CylinderGeometry(2.4, 2.4, 6.2, 3, 1); roof.rotateX(Math.PI / 2); roof.rotateZ(Math.PI / 2); roof.scale(1, 0.55, 1); roof.translate(0, 3.6, 0);
  for (const [bx, bz] of (theme === 'farm' || theme === 'pumpkin' || theme === 'rescue' ? [[-46, -70], [52, -160], [-58, -250], [40, -320], [-50, -400]] : [])) {
    if (-bz > length + 100) continue;
    const y = terrainH(bx, bz);
    const barn = new THREE.Group(); barn.position.set(bx, y - 0.2, bz); barn.rotation.y = r() * 3; g.add(barn);
    barn.add(mesh(barnBody, std(0xa8281e, { roughness: 0.8 })));
    barn.add(mesh(roof, std(0x3a2a24, { roughness: 0.7 })));
    barn.add(mesh(new THREE.BoxGeometry(1.6, 2, 0.1), std(0xf2ead8), { y: 1.0, z: 3.02 }));
  }
  parent.add(g);
  return g;
}
// 顶点亮度随机抖动：让团簇树冠有“叶丛”层次
export function jitterColors(geo, amt, seed) {
  const r = T.rng(seed);
  const p = geo.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 - amt + r() * amt * 2 + Math.max(-0.25, Math.min(0.2, y * 0.08)); c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo;
}

// ---------- 树、南瓜、草卷、玉米 ----------
const TREE_COLS = [['#7a2a10', '#e8742c'], ['#8a3a10', '#f2b630'], ['#6a1a10', '#d9481e'], ['#7a4a10', '#e8a02a']];
export function treeGeometries(variant) {
  const r = T.rng(100 + variant);
  // 树干 + 两根枝
  const trunk = new THREE.CylinderGeometry(0.18, 0.3, 2.6, 12); trunk.translate(0, 1.3, 0);
  const b1 = new THREE.CylinderGeometry(0.06, 0.12, 1.2, 8); b1.rotateZ(0.8); b1.translate(0.45, 2.2, 0);
  const b2 = new THREE.CylinderGeometry(0.05, 0.1, 1.0, 8); b2.rotateZ(-0.9); b2.translate(-0.4, 2.4, 0.1);
  const wood = mergeGeometries([trunk, b1, b2]);
  // 树冠：若干扰动过的球团
  const parts = [];
  const n = 13 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const s = new THREE.SphereGeometry(0.5 + r() * 0.35, 10, 7);
    noisy(s, 0.3, 200 + i + variant * 13);
    // 球壳上撒点，形成饱满的伞形树冠
    const u = r() * Math.PI * 2, v = Math.acos(1 - r() * 1.3), rad = 0.9 + r() * 0.35;
    s.translate(Math.cos(u) * Math.sin(v) * rad * 1.15, 3.55 + Math.cos(v) * rad * 0.85, Math.sin(u) * Math.sin(v) * rad * 1.15);
    parts.push(s);
  }
  const crown = mergeGeometries(parts);
  const [lo, hi] = TREE_COLS[variant % TREE_COLS.length];
  vertexGradient(crown, lo, hi, 2.4, 4.8);
  { const cAttr = crown.attributes.color, rr = T.rng(300 + variant); for (let i = 0; i < cAttr.count; i++) { const k = 0.82 + rr() * 0.36; cAttr.setXYZ(i, cAttr.getX(i) * k, cAttr.getY(i) * k, cAttr.getZ(i) * k); } }
  return { wood, crown };
}
export function pumpkinGeometry() {
  const pts = [];
  for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI; pts.push(new THREE.Vector2(Math.sin(a) * 0.5, -Math.cos(a) * 0.38)); }
  const g = new THREE.LatheGeometry(pts, 40);
  // 南瓜棱
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const ang = Math.atan2(v.z, v.x);
    const rib = 1 - 0.08 * Math.pow(Math.abs(Math.sin(ang * 5)), 0.6);
    p.setXYZ(i, v.x * rib, v.y, v.z * rib);
  }
  g.computeVertexNormals();
  g.translate(0, 0.38, 0);
  return g;
}
export function stemGeometry() {
  const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.7, 0), new THREE.Vector3(0.02, 0.82, 0), new THREE.Vector3(0.08, 0.9, 0.02), new THREE.Vector3(0.14, 0.92, 0.04)]);
  return new THREE.TubeGeometry(c, 10, 0.045, 8, false);
}
export function cornGeometry() {
  const parts = [];
  const stalk = new THREE.CylinderGeometry(0.035, 0.055, 2.6, 8); stalk.translate(0, 1.3, 0);
  parts.push(vertexGradient(stalk, '#7a8a3a', '#b8b060', 0, 2.6));
  for (let k = 0; k < 6; k++) {
    // 弯曲的长叶片
    const leaf = new THREE.PlaneGeometry(0.12, 1.1, 1, 8);
    const p = leaf.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 0.55; p.setXYZ(i, p.getX(i) * (1 - y * 0.6), y, -y * y * 0.5); }
    leaf.rotateY((k / 6) * Math.PI * 2 + k);
    leaf.translate(0, 0.5 + k * 0.32, 0);
    leaf.computeVertexNormals();
    parts.push(vertexGradient(leaf, '#6a8a2a', '#c8b858', 0.3, 2.4));
  }
  const cob = new THREE.CapsuleGeometry(0.06, 0.24, 4, 8); cob.rotateZ(-0.35); cob.translate(0.08, 1.5, 0);
  parts.push(vertexGradient(cob, '#e8a020', '#f6d050', 1.3, 1.7));
  return mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
}

// ---------- 世界 ----------
export function buildWorld(scene, length, theme = 'farm', extra = null) {
  setTerrain(theme);
  if (theme !== 'farm' && extra) { const g = extra(theme, length); scene.add(g); return g; }
  const g = new THREE.Group();
  const r = T.rng(7);
  // 草地
  // 红毯 + 金色绳边
  const carpet = T.carpetTex(length + 30);
  g.add(mesh(new RoundedBoxGeometry(HALF * 2 + 0.3, 0.1, length + 30, 2, 0.04), new THREE.MeshPhysicalMaterial({ map: carpet.map, normalMap: carpet.normalMap, color: 0x8a8a8a, roughness: 0.78, sheen: 0.6, sheenRoughness: 0.45, sheenColor: new THREE.Color(0xff3a4e) }), { y: 0.04, z: -length / 2 + 5, cast: false, receive: true }));
  const rope = new THREE.MeshPhysicalMaterial({ color: 0xe8b030, metalness: 0.9, roughness: 0.25, clearcoat: 1 });
  for (const s of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, length + 30, 12), rope, { x: s * (HALF + 0.12), y: 0.1, z: -length / 2 + 5, rx: Math.PI / 2, cast: false }));
  // 草丛与落叶（实例化）
  const tuft = (() => { const parts = []; for (let k = 0; k < 9; k++) { const hgt = 0.28 + (k % 4) * 0.07; const b = new THREE.ConeGeometry(0.018, hgt, 3); b.translate(0, hgt / 2, 0); b.rotateZ((k - 4) * 0.13); b.rotateY(k * 0.7); b.translate(Math.cos(k * 2.4) * 0.05, 0, Math.sin(k * 2.4) * 0.05); parts.push(b); } return vertexGradient(mergeGeometries(parts), '#2e5a18', '#b4cc58', 0, 0.45); })();
  const tufts = [], leaves = [], lc = [];
  for (let i = 0; i < 3200; i++) {
    const s = r() < 0.5 ? -1 : 1;
    tufts.push({ x: s * (HALF + 0.35 + Math.pow(r(), 1.6) * 11), z: -r() * (length + 30) + 10, ry: r() * 6, s: 0.8 + r() * 0.8 });
  }
  for (let i = 0; i < 900; i++) {
    const s = r() < 0.5 ? -1 : 1;
    leaves.push({ x: s * (HALF + 0.3 + r() * 9), y: 0.02, z: -r() * (length + 30) + 10, rx: -Math.PI / 2, rz: r() * 6, s: 0.12 + r() * 0.1 });
    lc.push(['#d9681e', '#c8461a', '#e8a22a', '#a83a1a', '#8a2a10'][i % 5]);
  }
  g.add(instanced(tuft, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), tufts, { cast: false }));
  // 小野花
  const fl = [], fc = [];
  for (let i = 0; i < 700; i++) { const sd = r() < 0.5 ? -1 : 1; fl.push({ x: sd * (HALF + 0.5 + r() * 10), y: 0.22 + r() * 0.1, z: -r() * (length + 30) + 10, s: 0.035 + r() * 0.025 }); fc.push(['#fff6e0', '#ffd23a', '#c88ae8', '#ff9a6a'][i % 4]); }
  g.add(instanced(new THREE.IcosahedronGeometry(1, 1), std(0xffffff, { roughness: 0.6 }), fl, { colors: fc, cast: false }));
  const leafGeo = new THREE.CircleGeometry(1, 5); leafGeo.scale(1, 0.6, 1);
  g.add(instanced(leafGeo, std(0xffffff, { roughness: 0.8, side: THREE.DoubleSide }), leaves, { colors: lc, cast: false }));
  // 白色木栅栏
  const picket = new THREE.BoxGeometry(0.12, 0.9, 0.05); picket.translate(0, 0.45, 0);
  const tip = new THREE.ConeGeometry(0.085, 0.14, 4); tip.rotateY(Math.PI / 4); tip.translate(0, 0.97, 0);
  const picketGeo = mergeGeometries([picket.toNonIndexed(), tip.toNonIndexed()]);
  const pickets = [], rails = [];
  const fx = HALF + 1.3;
  for (let z = 6; z > -length + 20; z -= 0.42) for (const s of [-1, 1]) pickets.push({ x: s * fx, z, ry: Math.PI / 2 });
  for (let z = 6; z > -length + 20; z -= 4) for (const s of [-1, 1]) for (const y of [0.3, 0.7]) rails.push({ x: s * (fx + 0.04), y, z: z - 2, sx: 1, sy: 1, sz: 1 });
  const white = new THREE.MeshStandardMaterial({ color: 0xfaf6ee, roughness: 0.55 });
  g.add(instanced(picketGeo, white, pickets));
  g.add(instanced(new THREE.BoxGeometry(0.04, 0.07, 4), white, rails));
  // 树
  for (let v = 0; v < 4; v++) {
    const geo = treeGeometries(v);
    const list = [];
    for (let z = -4 - v * 5; z > -length - 30; z -= 20) for (const s of [-1, 1]) list.push({ x: s * (HALF + 5 + r() * 5), z: z + (r() - 0.5) * 6, ry: r() * 6, s: 0.9 + r() * 0.5 });
    g.add(instanced(geo.wood, new THREE.MeshStandardMaterial({ map: T.barkTex(), roughness: 0.9 }), list));
    g.add(instanced(geo.crown, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }), list));
  }
  // 南瓜堆
  const pg = pumpkinGeometry(), sg = stemGeometry();
  const pList = [], pCol = [], sList = [];
  for (let z = 2; z > -length; z -= 7) for (const s of [-1, 1]) {
    if (r() < 0.35) continue;
    const bx = s * (HALF + 2.2 + r() * 1.2);
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const sc = 0.7 + r() * 0.7;
      const t = { x: bx + (r() - 0.5) * 1.2, z: z + (r() - 0.5) * 1.4, ry: r() * 6, s: sc };
      pList.push(t); sList.push(t);
      pCol.push(['#e8742c', '#f08a2a', '#d8601a', '#f2a03a', '#e8e0c8'][Math.floor(r() * 5)]);
    }
  }
  g.add(instanced(pg, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 }), pList, { colors: pCol }));
  g.add(instanced(sg, std(0x5a6a2a, { roughness: 0.7 }), sList));
  // 圆草卷
  const hay = new THREE.CylinderGeometry(0.7, 0.7, 1.1, 32, 1, false);
  const hayM = [new THREE.MeshStandardMaterial({ map: T.strawTex(), roughness: 0.95 }), new THREE.MeshStandardMaterial({ map: T.strawEndTex(), roughness: 0.95 }), new THREE.MeshStandardMaterial({ map: T.strawEndTex(), roughness: 0.95 })];
  const hList = [];
  for (let z = -10; z > -length; z -= 26) for (const s of [-1, 1]) if (r() < 0.7) hList.push({ x: s * (HALF + 3.6 + r() * 2), y: 0.7, z: z + r() * 8, rz: Math.PI / 2, ry: r() * 0.6 });
  const hayMesh = new THREE.InstancedMesh(hay, hayM, hList.length);
  hList.forEach((t, i) => { _o.position.set(t.x, t.y, t.z); _o.rotation.set(0, t.ry, t.rz); _o.scale.setScalar(1); _o.updateMatrix(); hayMesh.setMatrixAt(i, _o.matrix); });
  hayMesh.castShadow = true; hayMesh.receiveShadow = true;
  g.add(hayMesh);
  // 玉米地
  const cg = cornGeometry();
  const cList = [];
  for (let z = -18; z > -length; z -= 34) for (const s of [-1, 1]) for (let a = 0; a < 18; a++) cList.push({ x: s * (HALF + 7 + (a % 3) * 0.7 + r() * 0.3), z: z + Math.floor(a / 3) * 0.8 + r() * 0.3, ry: r() * 6, s: 0.9 + r() * 0.3 });
  g.add(instanced(cg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide }), cList));
  // 串灯：木杆 + 弧形电线 + 暖光灯泡（辉光会让它们发亮）
  const poleList = [], bulbList = [], bulbCol = [];
  const wirePts = [];
  for (let z = -8; z > -length + 10; z -= 16) {
    for (const s of [-1, 1]) poleList.push({ x: s * (HALF + 0.9), y: 3.1, z });
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, x = -HALF - 0.9 + t * (HALF * 2 + 1.8), y = 6.0 - Math.sin(t * Math.PI) * 0.6;
      wirePts.push(new THREE.Vector3(x, y, z));
      if (i > 0 && i < 14) { bulbList.push({ x, y: y - 0.12, z }); bulbCol.push(['#ffd27a', '#ff9a5a', '#fff0b0'][i % 3]); }
    }
  }
  g.add(instanced(new THREE.CylinderGeometry(0.06, 0.08, 6.2, 10), std(0x6a4426, { roughness: 0.8 }), poleList));
  const bulbM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  g.add(instanced(new THREE.SphereGeometry(0.075, 10, 8), bulbM, bulbList, { colors: bulbCol.map((c) => new THREE.Color(c).multiplyScalar(4)), cast: false, receive: false }));
  const wireGeo = new THREE.BufferGeometry();
  const segs = [];
  for (let i = 0; i < wirePts.length - 1; i++) if (Math.abs(wirePts[i].z - wirePts[i + 1].z) < 0.01) segs.push(wirePts[i], wirePts[i + 1]);
  wireGeo.setFromPoints(segs);
  g.add(new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: 0x2a1a10 })));
  // 稻草人（少量，精致一点）
  for (const z of [-60, -150, -230]) {
    const sx = (z % 2 ? 1 : -1) * (HALF + 3.2);
    const sc = new THREE.Group(); sc.position.set(sx, 0, z); g.add(sc);
    sc.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.8, 8), std(0x6a4426), { y: 1.4 }));
    sc.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 8), std(0x6a4426), { y: 2.0, rz: Math.PI / 2 }));
    sc.add(mesh(new RoundedBoxGeometry(0.75, 0.85, 0.38, 3, 0.1), new THREE.MeshStandardMaterial({ color: 0x3a6ab0, roughness: 0.85 }), { y: 1.85 }));
    sc.add(mesh(new RoundedBoxGeometry(0.2, 0.25, 0.4, 2, 0.05), std(0xc0392b), { x: 0.15, y: 1.8, z: 0.0 }));
    sc.add(mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshStandardMaterial({ map: T.strawTex(), roughness: 0.9 }), { y: 2.55 }));
    sc.add(mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 24), std(0xb8904a), { y: 2.76 }));
    sc.add(mesh(new THREE.CylinderGeometry(0.22, 0.27, 0.32, 20), std(0xb8904a), { y: 2.92 }));
  }
  // 路边餐桌：今晚菜单
  {
    const tz = -length + 22, tx = HALF + 2.6;
    const tbl = new THREE.Group(); tbl.position.set(tx, 0, tz); g.add(tbl);
    tbl.add(mesh(new RoundedBoxGeometry(2.4, 0.12, 4.2, 3, 0.04), new THREE.MeshStandardMaterial({ color: 0xfff6e6, roughness: 0.75 }), { y: 1.0 }));
    for (const [lx, lz] of [[-1, -1.9], [1, -1.9], [-1, 1.9], [1, 1.9]]) tbl.add(mesh(new THREE.CylinderGeometry(0.06, 0.05, 1, 10), std(0x6a4426), { x: lx, y: 0.5, z: lz }));
    tbl.add(mesh(new RoundedBoxGeometry(1.3, 0.18, 0.9, 3, 0.06), new THREE.MeshPhysicalMaterial({ color: 0xd0d4da, metalness: 1, roughness: 0.2 }), { y: 1.16 }));
    tbl.add(mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.12, 32), new THREE.MeshPhysicalMaterial({ color: 0xd8742a, roughness: 0.45, clearcoat: 0.6 }), { y: 1.14, z: 1.4 }));
    for (const z2 of [-1.4]) tbl.add(mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.05, 32), std(0xffffff, { roughness: 0.3 }), { y: 1.09, z: z2 }));
    const menu = T.tex(T.canvas(512, 320, (x, w, h) => { x.fillStyle = '#fff8ec'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a5a2a'; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14); x.fillStyle = '#b8102a'; x.font = '900 64px "Microsoft YaHei",sans-serif'; x.textAlign = 'center'; x.fillText('今晚菜单', w / 2, 110); x.fillStyle = '#3a2216'; x.font = '900 80px "Microsoft YaHei",sans-serif'; x.fillText('烤火鸡？', w / 2, 230); }));
    tbl.add(mesh(new THREE.PlaneGeometry(1.4, 0.88), new THREE.MeshStandardMaterial({ map: menu, side: THREE.DoubleSide, roughness: 0.8 }), { x: -1.3, y: 1.9, ry: Math.PI / 2, cast: false }));
    tbl.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), std(0x6a4426), { x: -1.3, y: 1.0, z: 0.5 }));
  }
  // 起点牌
  {
    const st = T.tex(T.canvas(1024, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8a5a2a'); gr.addColorStop(1, '#5a3418'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.strokeStyle = '#e8b030'; x.lineWidth = 12; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#ffe08a'; x.font = '900 110px "Microsoft YaHei",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('火鸡赦免大会 →', w / 2, h / 2 + 6); }));
    g.add(mesh(new RoundedBoxGeometry(3.4, 0.86, 0.08, 2, 0.03), [std(0x5a3418), std(0x5a3418), std(0x5a3418), std(0x5a3418), new THREE.MeshStandardMaterial({ map: st, roughness: 0.6 }), std(0x5a3418)], { x: -HALF - 2.4, y: 2.2, z: -6, ry: 0.45 }));
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.2, 10), std(0x5a3418), { x: -HALF - 2.4, y: 1.1, z: -6 }));
  }
  scene.add(g);
  return g;
}

// ---------- 终点舞台 ----------
export function buildStage(length, title = '火鸡赦免大会') {
  const g = new THREE.Group();
  g.position.z = -length;
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xe8b030, metalness: 1, roughness: 0.18, clearcoat: 1 });
  // 圆形舞台：象牙白台面 + 金边 + 台阶
  g.add(mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.5, 96), [new THREE.MeshPhysicalMaterial({ color: 0x7a0c20, roughness: 0.5, sheen: 1, sheenColor: new THREE.Color(0xff5060) }), new THREE.MeshPhysicalMaterial({ map: T.stageFloorTex(), color: 0xe6dccb, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }), gold], { y: 0.25, z: -2.5, receive: true }));
  g.add(mesh(new THREE.TorusGeometry(4.25, 0.08, 12, 96), gold, { y: 0.5, z: -2.5, rx: Math.PI / 2 }));
  g.add(mesh(new THREE.CylinderGeometry(4.6, 4.8, 0.2, 72), new THREE.MeshPhysicalMaterial({ color: 0x8a0a22, roughness: 0.6, sheen: 1, sheenColor: new THREE.Color(0xff5060) }), { y: 0.1, z: -2.5, receive: true }));
  // 丝绒帷幕（波浪褶皱）
  const curtainGeo = new THREE.PlaneGeometry(12, 8, 120, 1);
  { const p = curtainGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 4.2) * 0.18); } curtainGeo.computeVertexNormals(); }
  g.add(mesh(curtainGeo, new THREE.MeshPhysicalMaterial({ color: 0x7a0a1e, roughness: 0.55, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(0xff6a7a) }), { y: 4, z: -7.2, cast: false, receive: true }));
  // 金色拱框 + 灯泡
  const arch = new THREE.Group(); arch.position.z = -6.8; g.add(arch);
  for (const s of [-1, 1]) arch.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 7.4, 24), gold, { x: s * 5.6, y: 3.7 }));
  arch.add(mesh(new THREE.TorusGeometry(5.6, 0.22, 16, 80, Math.PI), gold, { y: 7.4 - 0.0 }));
  const bulbs = [];
  for (let i = 0; i <= 26; i++) { const a = (i / 26) * Math.PI; bulbs.push({ x: Math.cos(a) * 5.6, y: 7.4 + Math.sin(a) * 5.6, z: 0.25 }); }
  arch.add(instanced(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe6a0).multiplyScalar(3), toneMapped: false }), bulbs, { cast: false, receive: false }));
  // 招牌
  const sign = T.tex(T.canvas(1024, 256, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#7a0a1e'); gr.addColorStop(0.5, '#b8102a'); gr.addColorStop(1, '#7a0a1e');
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#e8b030'; x.lineWidth = 10; x.strokeRect(12, 12, w - 24, h - 24);
    x.font = '900 112px "Nunito","Microsoft YaHei",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = '#ffcc55'; x.shadowBlur = 20; x.fillStyle = '#ffe9a8'; x.fillText(title, w / 2, h / 2 + 6);
  }));
  g.add(mesh(new THREE.PlaneGeometry(7, 1.75), new THREE.MeshBasicMaterial({ map: sign, toneMapped: false }), { y: 9.0, z: -6.6, cast: false }));
  // 两侧聚光灯光柱
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  for (const s of [-1, 1]) {
    const beam = mesh(new THREE.ConeGeometry(1.6, 9, 32, 1, true), beamM, { x: s * 4.5, y: 4.6, z: -1.5, rz: s * 0.45, cast: false });
    g.add(beam);
  }
  // 两侧花篮
  for (const s of [-1, 1]) {
    const pot = new THREE.Group(); pot.position.set(s * 4.4, 0.5, 0.2); g.add(pot);
    pot.add(mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.7, 24), gold, { y: 0.35 }));
    for (let k = 0; k < 9; k++) { const a = k * 2.4; pot.add(mesh(new THREE.IcosahedronGeometry(0.22, 2), std([0xe8742c, 0xd9481e, 0xf2b630][k % 3], { roughness: 0.6 }), { x: Math.cos(a) * 0.25, y: 0.85 + (k % 3) * 0.12, z: Math.sin(a) * 0.25 })); }
  }
  return { group: g, judges: [] };
}
