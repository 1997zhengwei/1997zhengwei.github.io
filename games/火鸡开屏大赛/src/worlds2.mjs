// 第二章「感恩节当天」四关场景：花车大道 / 巨人餐桌 / 货车大营救 / 午夜大逃亡
// 与第一章同样的原则：重复物件实例化 + 按 z 分块；文字与图案用画布贴图
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from '../vendor/utils/BufferGeometryUtils.js';
import * as T from './tex.mjs';
import { HALF } from './game.mjs';
import { mesh, std, instanced, noisy, jitterColors, treeGeometries, pumpkinGeometry, stemGeometry, cornGeometry } from './scenery.mjs';
import { carpet, grassBits, treeRow, stringLights, bunting, mergedChunks, placed, uvRect, signAtlas, crowd, stripeTex, facadeAtlas, asphaltTex, sidewalkTex, balloonTurkey, balloonPumpkin, balloonPie, hdr, gold, FONT } from './worlds.mjs';

const PI = Math.PI;
const glossy = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, ...o });
const nonIdx = (g) => (g.index ? g.toNonIndexed() : g);
const merged = (parts) => mergeGeometries(parts.map(nonIdx));
const at = (geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => placed(geo, { x, y, z, rx, ry, rz, sx, sy, sz }).geo;

export function buildCh2World(theme, length) {
  const g = new THREE.Group();
  g.userData.ticks = [];
  g.userData.camZ = 0;
  ({ float: floatWorld, table: tableWorld, rescue: rescueWorld, escape: escapeWorld })[theme](g, length, T.rng(131 + length));
  return g;
}

// 在镜头附近循环飘落的粒子（彩纸 / 雪花）
function fallingParticles(g, { n, cols, size, map = null, fall = 1.5, sway = 0.6, w = 16, h = 18, additive = false }) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), ph = new Float32Array(n);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * w * 2; pos[i * 3 + 1] = Math.random() * h; pos[i * 3 + 2] = -Math.random() * 70 + 8;
    c.set(cols[i % cols.length]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; ph[i] = Math.random() * 6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, vertexColors: true, map, transparent: !!map, depthWrite: !map, alphaTest: map ? 0.02 : 0, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true }));
  pts.frustumCulled = false;
  g.add(pts);
  g.userData.ticks.push((t, dt) => {
    const cz = g.userData.camZ;
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      pos[j + 1] -= fall * dt * (0.7 + 0.6 * ((i * 7) % 10) / 10);
      pos[j] += Math.sin(t * 1.3 + ph[i]) * sway * dt;
      const rz = pos[j + 2] - cz;
      if (pos[j + 1] < -0.2 || rz > 8 || rz < -75) { pos[j + 1] = h * (0.6 + Math.random() * 0.4); pos[j + 2] = cz - Math.random() * 70 + 6; pos[j] = (Math.random() - 0.5) * w * 2; }
    }
    geo.attributes.position.needsUpdate = true;
  });
  return pts;
}

// =====================================================================
// 第 7 关：花车大道（晴朗正午的感恩节大游行）
// =====================================================================
function skirtTex(c1, c2) {
  return T.tex(T.canvas(512, 128, (x, w, h) => {
    for (let i = 0; i < 32; i++) { const gr = x.createLinearGradient(i * 16, 0, i * 16 + 16, 0); gr.addColorStop(0, c1); gr.addColorStop(0.5, c2); gr.addColorStop(1, c1); x.fillStyle = gr; x.fillRect(i * 16, 0, 16, h); }
    x.fillStyle = '#e8b030'; x.fillRect(0, 0, w, 14); x.fillStyle = '#fff1c8'; for (let i = 0; i < 32; i++) { x.beginPath(); x.arc(i * 16 + 8, 14, 7, 0, PI); x.fill(); }
  }), { repeat: [3, 1] });
}
function hornTube(scale = 1) {
  const pts = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector3(Math.sin(t * 2.6) * 0.7 * (1 - t * 0.2), 0.4 + t * 0.5 - Math.cos(t * 2.6) * 0.25, -0.9 + t * 1.5).multiplyScalar(scale)); }
  const curve = new THREE.CatmullRomCurve3(pts.reverse());
  const N = 40, M = 22, fr = curve.computeFrenetFrames(N, false);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, c = curve.getPointAt(t), rad = (0.04 + 0.42 * Math.pow(t, 1.3)) * scale;
    for (let j = 0; j <= M; j++) { const a = (j / M) * PI * 2; const n = fr.normals[i].clone().multiplyScalar(Math.cos(a)).add(fr.binormals[i].clone().multiplyScalar(Math.sin(a))); const p = c.clone().addScaledVector(n, rad); pos.push(p.x, p.y, p.z); uv.push(j / M, t); }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return { geo, mouth: curve.getPointAt(1) };
}
function wicker() {
  return T.tex(T.canvas(256, 256, (x, w, h) => {
    x.fillStyle = '#6a3a14'; x.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) { const up = (row + col) % 2 === 0, gx = col * 32, gy = row * 32; const gr = up ? x.createLinearGradient(gx, gy, gx + 32, gy) : x.createLinearGradient(gx, gy, gx, gy + 32); gr.addColorStop(0, '#8a5424'); gr.addColorStop(0.5, '#e8b468'); gr.addColorStop(1, '#8a5424'); x.fillStyle = gr; x.fillRect(gx + 2, gy + 2, 28, 28); }
  }), { repeat: [6, 3] });
}
function buildFloat(kind, s, r) {
  const f = new THREE.Group();
  const SK = [['#a8102a', '#e83a4a'], ['#d8661e', '#ffa040'], ['#1f5a8a', '#3a8ad8'], ['#2a6a3a', '#4aa060'], ['#6a2a8a', '#a050d0']][kind % 5];
  f.add(mesh(new THREE.BoxGeometry(3.2, 1.1, 7.6), [new THREE.MeshStandardMaterial({ map: skirtTex(...SK), roughness: 0.7 }), new THREE.MeshStandardMaterial({ map: skirtTex(...SK), roughness: 0.7 }), std(0x2a1a10), std(0x2a1a10), new THREE.MeshStandardMaterial({ map: skirtTex(...SK), roughness: 0.7 }), new THREE.MeshStandardMaterial({ map: skirtTex(...SK), roughness: 0.7 })], { y: 0.6 }));
  f.add(mesh(new RoundedBoxGeometry(3.5, 0.22, 7.9, 3, 0.08), gold(), { y: 1.25 }));
  f.add(mesh(new RoundedBoxGeometry(3.2, 0.12, 7.6, 2, 0.04), new THREE.MeshPhysicalMaterial({ color: 0x3a8a3a, roughness: 0.9, sheen: 1, sheenColor: new THREE.Color(0x9adf6a) }), { y: 1.38 }));
  const top = new THREE.Group(); top.position.y = 1.45; f.add(top);
  const face = s > 0 ? -PI / 2 : PI / 2;
  if (kind === 0) { const b = balloonTurkey(); b.scale.setScalar(0.85); b.position.y = 2.3; b.rotation.y = face; top.add(b); }
  else if (kind === 1) {
    const h = hornTube(2.6); const hm = mesh(h.geo, new THREE.MeshStandardMaterial({ map: wicker(), roughness: 0.75, side: THREE.DoubleSide }), { y: 0.2 }); top.add(hm);
    const fr = new THREE.Group(); fr.position.copy(h.mouth).add(new THREE.Vector3(0, 0.2, 0)); top.add(fr);
    const pk = new THREE.Mesh(pumpkinGeometry(), glossy(0xf08a2a)); pk.scale.setScalar(1.6); fr.add(pk);
    [[0xc8102a, -0.9, 0.5, 0.4, 0.55], [0x9ac02a, 0.8, 0.4, 0.5, 0.5], [0xe8c02a, 0.2, 1.0, 0.7, 0.45], [0x7a2a9a, -0.4, 0.2, 1.0, 0.4]].forEach(([c, x, y, z, rr]) => fr.add(mesh(new THREE.SphereGeometry(rr, 24, 18), glossy(c), { x, y, z })));
    for (let i = 0; i < 12; i++) fr.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), glossy(0x5a1a6a), { x: 0.9 + (i % 3) * 0.24, y: 0.9 - Math.floor(i / 3) * 0.2, z: 0.6 }));
    top.rotation.y = s > 0 ? PI : 0;
  } else if (kind === 2) {
    const P = [[0, 0.7, 0, 1.6], [-0.9, 0.5, 1.6, 1.25], [0.9, 0.5, -1.6, 1.3], [0.8, 0.5, 1.9, 1.0], [-0.8, 0.5, -1.9, 1.05], [0, 1.7, 0.2, 1.1], [0, 0.5, -3.0, 0.9], [0, 0.5, 3.1, 0.95]];
    const PCOL = [0xe8742c, 0xf08a2a, 0xefe6d2, 0xd8601a, 0xf2a03a, 0xe86a20];
    P.forEach(([x, y, z, k], i) => { const p = new THREE.Mesh(pumpkinGeometry(), glossy(PCOL[i % PCOL.length], { roughness: 0.35 })); p.scale.setScalar(k * 1.3); p.position.set(x, y - 0.5, z); p.castShadow = true; top.add(p); const st = new THREE.Mesh(stemGeometry(), std(0x5a6a2a)); st.scale.setScalar(k * 1.3); st.position.copy(p.position); top.add(st); });
    for (const z of [-3.4, 3.4]) for (const x of [-1.2, 1.2]) { const cs = new THREE.Mesh(cornGeometry(), std(0xc8a050, { roughness: 0.8 })); cs.scale.set(1.2, 1.6, 1.2); cs.position.set(x, 0, z); top.add(cs); }
  } else if (kind === 3) {
    [[0, 0.95, 1.0], [2.1, 0.7, 0.75], [4.0, 0.5, 0.52]].forEach(([y, k], i) => { const pie = balloonPie(); pie.rotation.x = 0; pie.scale.setScalar(k); pie.position.y = y + 0.5; top.add(pie); if (i < 2) top.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 12), gold(), { y: y + 1.3 })); });
  } else {
    const sign = T.tex(T.canvas(1024, 300, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8a0a20'); gr.addColorStop(1, '#4a0410'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.strokeStyle = '#ffd24a'; x.lineWidth = 16; x.strokeRect(12, 12, w - 24, h - 24); x.font = `900 150px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ffb040'; x.shadowBlur = 24; x.fillStyle = '#ffe9a8'; x.fillText('感恩节快乐', w / 2, h / 2 + 8); }));
    top.add(mesh(new THREE.PlaneGeometry(6.6, 1.95), new THREE.MeshBasicMaterial({ map: sign, toneMapped: false, side: THREE.DoubleSide }), { y: 2.4, ry: face }));
    for (const z of [-3.4, 3.4]) top.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 10), gold(), { y: 1.7, z }));
    for (let i = 0; i < 18; i++) top.add(mesh(new THREE.IcosahedronGeometry(0.3, 2), std([0xd9481e, 0xf2b630, 0xffffff, 0xe8742c][i % 4], { roughness: 0.6 }), { x: (r() - 0.5) * 2.4, y: 0.25, z: -3.4 + (i / 17) * 6.8 }));
  }
  return f;
}
function floatWorld(g, length, r) {
  const L = length + 30, zc = -length / 2 + 5;
  carpet(g, length);
  g.add(mesh(new THREE.PlaneGeometry((HALF + 9.5) * 2, L), new THREE.MeshStandardMaterial({ map: asphaltTex(L), roughness: 0.85 }), { rx: -PI / 2, y: 0.005, z: zc, cast: false, receive: true }));
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.PlaneGeometry(0.14, L), std(0xffffff, { roughness: 0.6 }), { x: s * (HALF + 1.0), y: 0.012, z: zc, rx: -PI / 2, cast: false }));
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.2, L), std(0xb8b0a4, { roughness: 0.7 }), { x: s * (HALF + 9.5), y: 0.1, z: zc, cast: false, receive: true }));
    g.add(mesh(new THREE.BoxGeometry(3.4, 0.18, L), new THREE.MeshStandardMaterial({ map: sidewalkTex(L), roughness: 0.8 }), { x: s * (HALF + 11.3), y: 0.09, z: zc, cast: false, receive: true }));
  }
  // 花车：停在两侧慢慢起伏，5 种造型轮换
  const floats = [];
  let k = 0;
  for (let z = -18; z > -length + 16; z -= 34) {
    const s = k % 2 ? 1 : -1;
    const f = buildFloat(k % 5, s, r); f.position.set(s * (HALF + 3.6), 0, z); g.add(f); floats.push({ f, ph: z * 0.13 }); k++;
  }
  const bulbs = [], bc = [];
  for (const { f } of floats) for (let i = 0; i < 26; i++) { const t = i / 26; const per = 2 * (3.5 + 7.9); let d = t * per, x, z; if (d < 3.5) { x = -1.75 + d; z = -3.95; } else if (d < 3.5 + 7.9) { x = 1.75; z = -3.95 + (d - 3.5); } else if (d < 7 + 7.9) { x = 1.75 - (d - 11.4); z = 3.95; } else { x = -1.75; z = 3.95 - (d - 14.9); } bulbs.push({ x: f.position.x + x, y: 1.4, z: f.position.z + z }); bc.push(hdr(['#ffd27a', '#fff0b0', '#ff9a5a'][i % 3], 3)); }
  g.add(instanced(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), bulbs, { colors: bc, cast: false, receive: false }));
  g.userData.ticks.push((t) => { for (const o of floats) { o.f.position.y = Math.sin(t * 1.6 + o.ph) * 0.05; o.f.rotation.z = Math.sin(t * 1.1 + o.ph) * 0.008; } });
  // 看台 + 欢呼人群
  const uni = { value: 0 };
  g.userData.ticks.push((t) => { uni.value = t; });
  const steps = [], people = [], skirts = [];
  const sx0 = HALF + 6.6;
  for (let z = 4; z > -length + 12; z -= 6) for (const s of [-1, 1]) {
    for (let tier = 0; tier < 3; tier++) steps.push({ x: s * (sx0 + tier * 1.0), y: 0.3 + tier * 0.45, z: z - 3, sy: 1.2 + tier * 1.8 });
    skirts.push({ x: s * (sx0 - 0.52), y: 0.4, z: z - 3, ry: s > 0 ? -PI / 2 : PI / 2 });
  }
  for (let z = 4; z > -length + 12; z -= 0.82) for (const s of [-1, 1]) for (let tier = 0; tier < 3; tier++) if (r() < 0.85) people.push({ x: s * (sx0 + tier * 1.0 + (r() - 0.5) * 0.25), y: 0.62 + tier * 0.9, z: z + (r() - 0.5) * 0.3, ry: -s * PI / 2 + (r() - 0.5) * 0.5, s: 0.9 + r() * 0.2 });
  g.add(instanced(new THREE.BoxGeometry(1.0, 0.5, 6), std(0xd8d0c4, { roughness: 0.6 }), steps, { cast: false }));
  const skirt = T.tex(T.canvas(512, 64, (x, w, h) => { const C = ['#c0392b', '#f2ead8', '#e67e22', '#f2ead8']; for (let i = 0; i < 16; i++) { x.fillStyle = C[i % 4]; x.fillRect(i * 32, 0, 32, h); } }));
  g.add(instanced(new THREE.PlaneGeometry(6, 0.8), new THREE.MeshStandardMaterial({ map: skirt, roughness: 0.7, side: THREE.DoubleSide }), skirts, { cast: false }));
  crowd(g, people, uni);
  // 城市高楼：立面图集
  const fa = facadeAtlas();
  const fronts = [], bodies = [];
  const WALLC = ['#9a3a2a', '#efe0c4', '#8aa88a', '#2e4a6a', '#d8a83a', '#f2efe8', '#6a3a24', '#c8683a'];
  const bx0 = HALF + 13.2;
  for (const s of [-1, 1]) {
    let z = 16;
    while (z > -length - 30) {
      const w = 8 + r() * 5, h = 16 + r() * 14, dpt = 10, v = Math.floor(r() * 8), zc2 = z - w / 2;
      const body = new THREE.BoxGeometry(dpt, h, w - 0.08);
      const ca = [], col = new THREE.Color(WALLC[v]).multiplyScalar(0.92);
      for (let i = 0; i < body.attributes.position.count; i++) ca.push(col.r, col.g, col.b);
      body.setAttribute('color', new THREE.Float32BufferAttribute(ca, 3));
      bodies.push(placed(body, { x: s * (bx0 + dpt / 2), y: h / 2, z: zc2 }));
      for (let fl = 0; fl * 8 < h - 1; fl++) {
        const fh = Math.min(8, h - fl * 8);
        const fr = new THREE.PlaneGeometry(w - 0.08, fh); const [u0, v0, u1, v1] = fa.rect(v); uvRect(fr, u0, v0 + (v1 - v0) * (1 - fh / 8), u1, v1);
        fronts.push(placed(fr, { x: s * (bx0 - 0.02), y: fl * 8 + fh / 2, z: zc2, ry: -s * PI / 2 }));
      }
      z -= w;
    }
  }
  mergedChunks(g, bodies, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), { cast: false });
  mergedChunks(g, fronts, new THREE.MeshStandardMaterial({ map: fa.map, emissiveMap: fa.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.7 }), { cast: false });
  // 头顶的巨型游行气球（随风起伏）+ 牵绳
  const bl = [];
  const FN = [balloonTurkey, balloonPumpkin, balloonPie];
  for (let z = -40, i = 0; z > -length + 30; z -= 62, i++) {
    const x = (i % 2 ? 1 : -1) * (1.5 + r() * 2);
    const b = FN[i % 3](); b.scale.setScalar(1.25); b.position.set(x, 16, z); b.rotation.y = PI; g.add(b); bl.push({ b, y: 16, ph: z });
    const pts = []; for (const [dx, dz] of [[4.5, 2], [-4.5, -2], [4.5, -2], [-4.5, 2]]) pts.push(new THREE.Vector3(x, 14, z), new THREE.Vector3(x + dx * 1.6, 0.2, z + dz));
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x3a2a20 })));
  }
  g.userData.ticks.push((t) => { for (const o of bl) { o.b.position.y = o.y + Math.sin(t * 0.9 + o.ph) * 0.45; o.b.rotation.z = Math.sin(t * 0.7 + o.ph) * 0.07; } });
  // 彩旗、灯杆横幅
  bunting(g, length, { step: 12, h: 8.4, x: HALF + 9.4, cols: ['#d6283a', '#ff8a1a', '#ffc21a', '#3a8ad8', '#fff1d6'] });
  const sa = signAtlas(['感恩节大游行', '火鸡加油！', '丰收快乐', '感恩有你'].map((t, i) => ({ text: t, bg: [['#8a0a20', '#5a0612'], ['#d8661e', '#a8461a'], ['#1f5a8a', '#143a5a'], ['#2a6a3a', '#1a4a2a']][i], fg: '#fff3d0', size: 70 })), 2);
  const poles = [], bans = [];
  for (let z = -6; z > -length + 6; z -= 17) for (const s of [-1, 1]) {
    poles.push({ x: s * (HALF + 9.0), y: 4, z });
    const bg = new THREE.PlaneGeometry(1.7, 0.6); const [a0, b0, a1, b1] = sa.rect(Math.abs(Math.round(z / 17)) % 4); uvRect(bg, a0, b0, a1, b1);
    bans.push(placed(bg, { x: s * (HALF + 9.0), y: 6.6, z: z - 0.92, ry: 0 }));
  }
  g.add(instanced(new THREE.CylinderGeometry(0.08, 0.1, 8, 10), std(0x1a1a1a, { metalness: 0.6, roughness: 0.4 }), poles));
  mergedChunks(g, bans, new THREE.MeshStandardMaterial({ map: sa.tex, roughness: 0.6, side: THREE.DoubleSide }), { cast: false });
  treeRow(g, length, r, { x0: HALF + 12.2, x1: HALF + 12.3, step: 24, scale: 0.85, variants: [0, 2] });
  // 漫天彩纸
  fallingParticles(g, { n: 1400, cols: ['#d6283a', '#ffc21a', '#16b8a8', '#ff7a1a', '#8a4ad9', '#ffffff', '#3a8ad8'], size: 0.13, fall: 1.4, sway: 1.2, w: 14, h: 16 });
}

// =====================================================================
// 第 8 关：巨人餐桌（火鸡变成小人，跑在感恩节长餐桌上）
// =====================================================================
function linenTex() {
  return T.tex(T.canvas(256, 256, (x, w, h) => {
    x.fillStyle = '#efe6d4'; x.fillRect(0, 0, w, h);
    const r = T.rng(9);
    for (let i = 0; i < w; i += 2) { x.fillStyle = `rgba(150,120,90,${0.04 + r() * 0.05})`; x.fillRect(i, 0, 1, h); x.fillRect(0, i, w, 1); }
    x.strokeStyle = 'rgba(200,150,60,.35)'; x.lineWidth = 3; x.strokeRect(10, 10, w - 20, h - 20);
  }), { repeat: [8, 120], aniso: 16 });
}
function runnerTex(len) {
  const c = T.canvas(512, 1024, (x, w, h) => {
    x.fillStyle = '#b8864a'; x.fillRect(0, 0, w, h);
    const r = T.rng(5);
    for (let i = 0; i < 9000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(255,230,180,.10)' : 'rgba(60,30,10,.10)'; x.fillRect(r() * w, r() * h, 3, 1.2); }
    for (let y = 0; y < h; y += 4) { x.fillStyle = 'rgba(80,40,10,.08)'; x.fillRect(0, y, w, 1); }
    // 两侧格纹边带
    for (const ox of [0, w - 70]) { x.fillStyle = '#7a1a14'; x.fillRect(ox, 0, 70, h); x.fillStyle = '#e8b030'; x.fillRect(ox + 10, 0, 8, h); x.fillRect(ox + 52, 0, 8, h); for (let y = 0; y < h; y += 40) { x.fillStyle = 'rgba(232,176,48,.55)'; x.fillRect(ox, y, 70, 6); } }
    // 枫叶与麦穗印花
    const leaf = (cx, cy, s, rot, col) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s, s); x.fillStyle = col; x.beginPath(); for (let k = 0; k < 5; k++) { const a = -PI / 2 + (k - 2) * 0.62; x.lineTo(Math.cos(a) * 40, Math.sin(a) * 40); x.lineTo(Math.cos(a + 0.31) * 16, Math.sin(a + 0.31) * 16); } x.lineTo(0, 30); x.closePath(); x.fill(); x.restore(); };
    for (let y = 70; y < h; y += 170) { leaf(w / 2, y, 1.4, 0, '#c8461a'); leaf(w / 2 - 95, y + 85, 0.9, -0.5, '#e8862a'); leaf(w / 2 + 95, y + 85, 0.9, 0.5, '#a8321a'); }
  });
  const t = T.tex(c, { repeat: [1, len / 12], aniso: 16 });
  return t;
}
function woodTex(rep) {
  return T.tex(T.canvas(256, 512, (x, w, h) => {
    const r = T.rng(3);
    for (let i = 0; i < 8; i++) { const c = 70 + r() * 30; x.fillStyle = `rgb(${c + 40},${c},${c * 0.55})`; x.fillRect(i * 32, 0, 32, h); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(i * 32, 0, 2, h); for (let k = 0; k < 40; k++) { x.strokeStyle = `rgba(40,20,5,${0.1 + r() * 0.1})`; x.beginPath(); const yy = r() * h; x.moveTo(i * 32 + 3, yy); x.bezierCurveTo(i * 32 + 10, yy + 20, i * 32 + 22, yy - 20, i * 32 + 30, yy + 8); x.stroke(); } }
  }), { repeat: rep });
}
function wallpaperTex() {
  return T.tex(T.canvas(256, 256, (x, w, h) => {
    x.fillStyle = '#6a2a1e'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#7a3424' : '#5e2418'; x.fillRect(i * 64, 0, 64, h); }
    x.fillStyle = 'rgba(232,176,48,.35)';
    for (const [cx, cy] of [[32, 64], [96, 192], [160, 64], [224, 192]]) { x.beginPath(); x.ellipse(cx, cy, 14, 30, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx, cy - 34, 8, 10, 0, 0, 7); x.fill(); }
  }), { repeat: [60, 6] });
}
function plateGeometry() {
  const pts = [[0, 0], [2.4, 0], [2.6, 0.08], [2.75, 0.32], [3.1, 0.42], [3.15, 0.36], [2.85, 0.22], [2.55, 0.1], [0, 0.1]].map(([a, b]) => new THREE.Vector2(a, b));
  return new THREE.LatheGeometry(pts, 48);
}
function glassGeometry() {
  const pts = [[0, 0], [1.3, 0], [1.25, 0.15], [0.18, 0.35], [0.14, 3.0], [0.3, 3.3], [1.15, 3.8], [1.45, 5.0], [1.4, 6.6], [1.32, 6.6], [1.36, 5.0], [1.08, 3.85], [0.0, 3.45]].map(([a, b]) => new THREE.Vector2(a, b));
  return new THREE.LatheGeometry(pts, 40);
}
function forkGeometry(len = 7) {
  const parts = [];
  const h = new THREE.CapsuleGeometry(0.22, len * 0.55, 4, 12); h.scale(1, 1, 0.35); h.rotateX(PI / 2); h.translate(0, 0, len * 0.22); parts.push(h);
  const neck = new THREE.BoxGeometry(0.75, 0.1, 0.9); neck.translate(0, 0, -len * 0.14); parts.push(neck);
  for (let i = 0; i < 4; i++) { const t = new THREE.BoxGeometry(0.11, 0.09, len * 0.28); t.translate(-0.3 + i * 0.2, 0, -len * 0.14 - len * 0.17); parts.push(t); }
  return merged(parts);
}
function knifeGeometry(len = 7.5) {
  const parts = [];
  const h = new THREE.CapsuleGeometry(0.22, len * 0.4, 4, 12); h.scale(1, 1, 0.35); h.rotateX(PI / 2); h.translate(0, 0, len * 0.28); parts.push(h);
  const shape = new THREE.Shape(); shape.moveTo(-0.3, 0); shape.lineTo(0.3, 0); shape.lineTo(0.3, len * 0.5); shape.quadraticCurveTo(0.2, len * 0.62, -0.3, len * 0.55); shape.closePath();
  const b = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }); b.rotateX(PI / 2); b.translate(0, 0.05, -len * 0.48); parts.push(b);
  return merged(parts);
}
function tableWorld(g, length, r) {
  const L = length + 60, zc = -length / 2 + 5;
  const FLOOR = -13;
  // 桌面（亚麻桌布）+ 桌布垂边 + 中间的丰收桌旗（跑道）
  g.add(mesh(new THREE.BoxGeometry(32, 1.2, L), std(0x5a3418), { y: -0.62, z: zc, cast: false, receive: true }));
  g.add(mesh(new THREE.PlaneGeometry(31, L), new THREE.MeshPhysicalMaterial({ map: linenTex(), color: 0xd8ccb6, roughness: 0.85, sheen: 0.4, sheenColor: new THREE.Color(0xfff0d8) }), { rx: -PI / 2, y: 0.005, z: zc, cast: false, receive: true }));
  for (const s of [-1, 1]) {
    const dr = new THREE.PlaneGeometry(L, 12.6, Math.round(L / 0.6), 1);
    { const p = dr.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 2.4) * 0.22 * (0.4 + 0.6 * (6.3 - y) / 12.6)); } dr.computeVertexNormals(); }
    g.add(mesh(dr, new THREE.MeshPhysicalMaterial({ map: linenTex(), color: 0xc8bca6, roughness: 0.85, sheen: 0.5, sheenColor: new THREE.Color(0xfff0d8), side: THREE.DoubleSide }), { x: s * 15.5, y: -6.3, z: zc, ry: s * PI / 2, cast: false, receive: true }));
  }
  g.add(mesh(new RoundedBoxGeometry(HALF * 2 + 1.0, 0.07, L, 2, 0.03), new THREE.MeshStandardMaterial({ map: runnerTex(L), roughness: 0.9 }), { y: 0.04, z: zc, cast: false, receive: true }));
  // 地板、墙纸、护墙板、窗户、天花梁
  g.add(mesh(new THREE.PlaneGeometry(110, L + 60), new THREE.MeshStandardMaterial({ map: woodTex([14, 60]), roughness: 0.55 }), { rx: -PI / 2, y: FLOOR, z: zc, cast: false, receive: true }));
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.PlaneGeometry(L + 60, 52), new THREE.MeshStandardMaterial({ map: wallpaperTex(), roughness: 0.8 }), { x: s * 48, y: FLOOR + 26, z: zc, ry: -s * PI / 2, cast: false }));
    g.add(mesh(new THREE.BoxGeometry(1.2, 9, L + 60), new THREE.MeshStandardMaterial({ map: woodTex([60, 2]), roughness: 0.6 }), { x: s * 47.5, y: FLOOR + 4.5, z: zc, cast: false }));
  }
  const winM = new THREE.MeshBasicMaterial({ map: T.tex(T.canvas(128, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a1a4a'); gr.addColorStop(0.55, '#a04a6a'); gr.addColorStop(0.8, '#ff9a4a'); gr.addColorStop(1, '#ffd08a'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = '#2a1408'; x.fillRect(w / 2 - 4, 0, 8, h); x.fillRect(0, h * 0.45, w, 8); x.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 14; i++) x.fillRect((i * 37) % w, (i * 53) % (h * 0.4), 2, 2); })), toneMapped: false });
  const wins = [], frames = [], curt = [];
  for (let z = -10; z > -length - 20; z -= 42) for (const s of [-1, 1]) {
    wins.push(placed(new THREE.PlaneGeometry(10, 20), { x: s * 47.3, y: FLOOR + 22, z, ry: -s * PI / 2 }));
    frames.push(placed(new THREE.BoxGeometry(0.8, 21.5, 11.5), { x: s * 47.6, y: FLOOR + 22, z }));
    for (const dz of [-6.2, 6.2]) curt.push(placed((() => { const c = new THREE.PlaneGeometry(3.2, 26, 16, 1); const p = c.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 5) * 0.3); c.computeVertexNormals(); return c; })(), { x: s * 46.6, y: FLOOR + 22, z: z + dz, ry: -s * PI / 2 }));
  }
  mergedChunks(g, frames, std(0x3a2010, { roughness: 0.6 }), { cast: false });
  mergedChunks(g, wins, winM, { cast: false, receive: false });
  mergedChunks(g, curt, new THREE.MeshPhysicalMaterial({ color: 0x7a0a1e, roughness: 0.55, sheen: 1, sheenColor: new THREE.Color(0xff6a7a), side: THREE.DoubleSide }), { cast: false });
  g.add(mesh(new THREE.PlaneGeometry(100, L + 60), std(0x2a160c, { roughness: 0.9 }), { rx: PI / 2, y: FLOOR + 50, z: zc, cast: false }));
  const beams = []; for (let z = 10; z > -length - 40; z -= 14) beams.push({ x: 0, y: FLOOR + 48.6, z });
  g.add(instanced(new THREE.BoxGeometry(100, 2.2, 1.6), std(0x3a2010, { roughness: 0.7 }), beams, { cast: false }));
  // 吊灯：金环 + 烛形灯泡（辉光）
  const rings = [], cbulbs = [], chains = [];
  for (let z = -30; z > -length - 10; z -= 55) {
    rings.push({ x: 0, y: 22, z });
    for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; cbulbs.push({ x: Math.cos(a) * 4.2, y: 23.1, z: z + Math.sin(a) * 4.2 }); }
    chains.push(new THREE.Vector3(0, 22, z), new THREE.Vector3(0, FLOOR + 48, z));
  }
  const ringGeo = merged([(() => { const t = new THREE.TorusGeometry(4.2, 0.22, 10, 48); t.rotateX(PI / 2); return t; })(), (() => { const t = new THREE.TorusGeometry(2.4, 0.16, 10, 36); t.rotateX(PI / 2); t.translate(0, 1.6, 0); return t; })(), (() => { const c = new THREE.CylinderGeometry(0.25, 0.4, 3.2, 12); c.translate(0, 0.8, 0); return c; })()]);
  g.add(instanced(ringGeo, gold(), rings, { cast: false }));
  g.add(instanced(new THREE.SphereGeometry(0.32, 12, 10), new THREE.MeshBasicMaterial({ color: hdr(0xffd890, 4), toneMapped: false }), cbulbs, { cast: false, receive: false }));
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(chains), new THREE.LineBasicMaterial({ color: 0x8a6a2a })));
  // 高背椅（桌边只露出椅背）
  const chairGeo = merged([
    ...[-1.6, 1.6].map((dx) => { const b = new THREE.BoxGeometry(0.5, 21, 0.5); b.translate(0, 10.5, dx); return b; }),
    (() => { const b = new RoundedBoxGeometry(0.6, 1.4, 4.4, 2, 0.2); b.translate(0, 20.4, 0); return b; })(),
    ...[-0.8, 0, 0.8].map((dz) => { const b = new THREE.CylinderGeometry(0.14, 0.14, 8, 8); b.translate(0, 15.4, dz); return b; }),
    (() => { const b = new THREE.BoxGeometry(0.5, 0.6, 3.6); b.translate(0, 11.3, 0); return b; })(),
  ]);
  const chairs = [];
  for (let z = 0; z > -length - 10; z -= 10.5) for (const s of [-1, 1]) chairs.push({ x: s * 18.8, y: FLOOR, z: z + (s > 0 ? 5 : 0) });
  g.add(instanced(chairGeo, new THREE.MeshStandardMaterial({ map: woodTex([1, 4]), color: 0x8a5a3a, roughness: 0.45 }), chairs, { cast: false }));
  // 餐具：瓷盘 + 金边、刀叉、高脚杯（蔓越莓汁）、餐巾
  const plates = [], rims = [], forks = [], knives = [], glasses = [], juice = [], naps = [], napC = [];
  const foods = { potato: [], pc: [], pie: [], cran: [], corn: [], bean: [], bread: [], butter: [] };
  let fi = 0;
  for (let z = -6; z > -length + 8; z -= 11) for (const s of [-1, 1]) {
    const zz = z + (s > 0 ? 5.5 : 0), px = s * 8.2;
    plates.push({ x: px, y: 0.02, z: zz }); rims.push({ x: px, y: 0.44, z: zz });
    forks.push({ x: px - 4.3, y: 0.06, z: zz + 0.5, ry: 0 }); knives.push({ x: px + 4.2, y: 0.06, z: zz + 0.5, ry: 0 });
    glasses.push({ x: s * 12.4, y: 0.02, z: zz - 3.6 }); juice.push({ x: s * 12.4, y: 3.9, z: zz - 3.6 });
    naps.push({ x: px, y: 0.12, z: zz - 2.0, ry: (r() - 0.5) * 0.3 }); napC.push(['#a8102a', '#d8661e', '#e8b030'][Math.floor(r() * 3)]);
    const v = fi++ % 6;
    if (v === 0) for (let k = 0; k < 7; k++) { const a = k * 2.3; foods.potato.push({ x: px + Math.cos(a) * 1.1 * (k % 2 ? 1 : 0.5), y: 0.7, z: zz + Math.sin(a) * 1.1 * (k % 2 ? 1 : 0.5), s: 0.55 + r() * 0.2, ry: r() * 6, rx: r() }); foods.pc.push(['#c8862a', '#b8701e', '#d89a3a'][k % 3]); }
    else if (v === 1) foods.pie.push({ x: px, y: 0.3, z: zz, ry: r() * 6 });
    else if (v === 2) foods.cran.push({ x: px, y: 0.3, z: zz });
    else if (v === 3) { foods.corn.push({ x: px - 0.6, y: 0.75, z: zz, ry: 0.3 }); foods.corn.push({ x: px + 0.7, y: 0.75, z: zz + 0.3, ry: -0.2 }); foods.butter.push({ x: px + 0.2, y: 1.25, z: zz - 1.2 }); }
    else if (v === 4) for (let k = 0; k < 16; k++) foods.bean.push({ x: px + (r() - 0.5) * 2.4, y: 0.42 + (k % 3) * 0.12, z: zz + (r() - 0.5) * 2.2, ry: r() * 6, rz: PI / 2 + (r() - 0.5) * 0.3 });
    else for (let k = 0; k < 3; k++) foods.bread.push({ x: px + (k - 1) * 1.15, y: 0.75, z: zz + (k % 2) * 0.5 - 0.25, ry: (r() - 0.5) * 0.4 });
  }
  const porcelain = new THREE.MeshPhysicalMaterial({ color: 0xfbf8f2, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.15 });
  g.add(instanced(plateGeometry(), porcelain, plates));
  g.add(instanced((() => { const t = new THREE.TorusGeometry(3.06, 0.05, 6, 64); t.rotateX(PI / 2); return t; })(), gold(), rims, { cast: false }));
  g.add(instanced(forkGeometry(7), silver, forks));
  g.add(instanced(knifeGeometry(7.5), silver, knives));
  g.add(instanced(glassGeometry(), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }), glasses, { cast: false }));
  g.add(instanced(new THREE.CylinderGeometry(1.32, 1.05, 1.9, 32), new THREE.MeshPhysicalMaterial({ color: 0x9a0a22, roughness: 0.1, transparent: true, opacity: 0.85, clearcoat: 1 }), juice, { cast: false }));
  // 折扇形餐巾：半圆 + 褶皱，竖在盘子后侧
  const napGeo = (() => { const c = new THREE.CircleGeometry(1.25, 24, 0, PI); const p = c.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)); p.setZ(i, Math.sin(a * 14) * 0.08 * Math.hypot(p.getX(i), p.getY(i))); } c.computeVertexNormals(); return c; })();
  g.add(instanced(napGeo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.7, sheen: 0.8, sheenColor: new THREE.Color(0xffe0d0), side: THREE.DoubleSide }), naps, { colors: napC }));
  g.add(instanced(noisy(new THREE.IcosahedronGeometry(0.6, 2), 0.18, 3), glossy(0xffffff, { roughness: 0.4 }), foods.potato, { colors: foods.pc }));
  const pieGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.absarc(0, 0, 2.2, -0.45, 0.45, false); sh.closePath(); const e = new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 12 }); e.rotateX(-PI / 2); e.translate(-1.1, 0, 0); return e; })();
  g.add(instanced(pieGeo, glossy(0xc8641e, { roughness: 0.4 }), foods.pie));
  g.add(instanced((() => { const c = new THREE.SphereGeometry(0.45, 14, 10); c.scale(1, 0.7, 1); c.translate(-0.2, 0.85, 0); return c; })(), glossy(0xfffaf0), foods.pie, { cast: false }));
  const cranGeo = new THREE.CylinderGeometry(1.25, 1.25, 1.8, 40, 6); { const p = cranGeo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 - 0.035 * Math.abs(Math.sin((y + 0.9) * PI * 2.5)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } cranGeo.computeVertexNormals(); cranGeo.translate(0, 0.9, 0); }
  g.add(instanced(cranGeo, new THREE.MeshPhysicalMaterial({ color: 0x8a0614, roughness: 0.08, clearcoat: 1, transmission: 0, sheen: 0.4, sheenColor: new THREE.Color(0xff4060) }), foods.cran));
  const cornCob = (() => { const c = new THREE.CapsuleGeometry(0.42, 2.6, 8, 20); const p = c.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), y = p.getY(i); const k = 1 + 0.05 * Math.max(0, Math.sin(a * 12)) * Math.max(0, Math.sin(y * 14)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } c.computeVertexNormals(); c.rotateZ(PI / 2); return c; })();
  g.add(instanced(cornCob, glossy(0xf2c23a, { roughness: 0.35 }), foods.corn));
  g.add(instanced(new RoundedBoxGeometry(0.8, 0.5, 0.8, 2, 0.1), glossy(0xfff0a0, { roughness: 0.3 }), foods.butter, { cast: false }));
  g.add(instanced((() => { const b = new THREE.CapsuleGeometry(0.08, 1.2, 3, 8); return b; })(), std(0x4a8a2a, { roughness: 0.5 }), foods.bean, { cast: false }));
  g.add(instanced(new RoundedBoxGeometry(1.0, 0.8, 1.0, 2, 0.12), glossy(0xe8b04a, { roughness: 0.6 }), foods.bread));
  // 跑道两侧：高烛台（摇曳火苗）、小南瓜和葫芦、橡果、散落的秋叶、银色餐罩、盐瓶胡椒瓶
  const holders = [], candles = [], flames = [], gourds = [], gc = [], cloches = [], shakers = [], shC = [];
  let side = 1;
  for (let z = -14; z > -length + 10; z -= 21) {
    side = -side;
    const cx = side * 5.0;
    holders.push({ x: cx, y: 0, z }); candles.push({ x: cx, y: 0.9, z }); flames.push({ x: cx, y: 8.55, z });
    for (let k = 0; k < 5; k++) { const a = k * 1.3; gourds.push({ x: cx + Math.cos(a) * 1.4, y: 0, z: z + Math.sin(a) * 1.6 + 2.6, s: 0.5 + r() * 0.4, ry: r() * 6 }); gc.push(['#e8742c', '#efe6d2', '#d8a83a', '#6a8a3a', '#d8601a'][k]); }
    cloches.push({ x: -side * 12.0, y: 0.02, z: z - 8 });
    shakers.push({ x: -side * 5.2, y: 0, z: z - 6 }, { x: -side * 5.2, y: 0, z: z - 7.3 }); shC.push('#f6f2ea', '#3a3a3a');
  }
  const holderGeo = new THREE.LatheGeometry([[0, 0], [1.1, 0], [1.1, 0.2], [0.5, 0.35], [0.3, 0.8], [0.45, 0.9], [0.62, 1.0], [0.6, 1.1], [0, 1.1]].map(([a, b]) => new THREE.Vector2(a, b)), 32);
  g.add(instanced(holderGeo, gold(), holders));
  const candleGeo = new THREE.CylinderGeometry(0.42, 0.46, 7.4, 24); candleGeo.translate(0, 3.7, 0);
  g.add(instanced(candleGeo, new THREE.MeshPhysicalMaterial({ color: 0xfff4e0, roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color(0xffe0b0), emissive: 0x3a2008 }), candles));
  const flameM = new THREE.MeshBasicMaterial({ map: T.softDot(), color: hdr(0xffb04a, 3.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const fg = new THREE.PlaneGeometry(0.9, 1.6);
  const fl = instanced(fg, flameM, flames, { cast: false, receive: false }); g.add(fl);
  const glowM = new THREE.MeshBasicMaterial({ map: T.softDot(), color: hdr(0xff9a40, 0.55), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  g.add(instanced(new THREE.PlaneGeometry(3.2, 3.2), glowM, flames, { cast: false, receive: false }));
  g.userData.ticks.push((t) => { flameM.color.copy(hdr(0xffb04a, 2.9 + Math.sin(t * 17) * 0.3 + Math.sin(t * 5.3) * 0.2)); });
  const pg = pumpkinGeometry();
  g.add(instanced(pg, glossy(0xffffff, { roughness: 0.4 }), gourds, { colors: gc }));
  const clocheGeo = merged([(() => { const s = new THREE.SphereGeometry(2.6, 40, 20, 0, PI * 2, 0, PI / 2); s.scale(1, 0.8, 1); return s; })(), (() => { const c = new THREE.CylinderGeometry(2.75, 2.75, 0.12, 40); c.translate(0, 0.06, 0); return c; })(), (() => { const k = new THREE.SphereGeometry(0.3, 16, 12); k.translate(0, 2.3, 0); return k; })()]);
  g.add(instanced(clocheGeo, silver, cloches));
  const shGeo = merged([(() => { const c = new THREE.CylinderGeometry(0.5, 0.6, 2.0, 20); c.translate(0, 1.0, 0); return c; })(), (() => { const c = new THREE.SphereGeometry(0.5, 20, 10, 0, PI * 2, 0, PI / 2); c.translate(0, 2.0, 0); return c; })()]);
  g.add(instanced(shGeo, glossy(0xffffff, { roughness: 0.2 }), shakers, { colors: shC }));
  const leaves = [], lc = [];
  for (let i = 0; i < 1300; i++) { const s = r() < 0.5 ? -1 : 1; const x = s * (HALF + 0.9 + Math.pow(r(), 1.3) * 11), z = -r() * (length + 20) + 8; leaves.push({ x, y: 0.03, z, rx: -PI / 2, rz: r() * 6, s: 0.3 + r() * 0.25 }); lc.push(['#d9681e', '#c8461a', '#e8a22a', '#a83a1a', '#8a2a10'][i % 5]); }
  const lg = new THREE.CircleGeometry(1, 5); lg.scale(1, 0.62, 1);
  g.add(instanced(lg, std(0xffffff, { roughness: 0.8, side: THREE.DoubleSide }), leaves, { colors: lc, cast: false }));
  // 远处壁炉的暖光
  g.add(mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ map: T.softDot(), color: hdr(0xff8a3a, 0.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), { y: 4, z: -length - 30, cast: false }));
}

// =====================================================================
// 第 9 关：货车大营救（初冬清晨的乡间公路）
// =====================================================================
function signTex(draw, w = 512, h = 256) { return T.tex(T.canvas(w, h, draw)); }
function truckLivery() {
  return signTex((x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f6f2ea'); gr.addColorStop(1, '#d8d2c6'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = '#c0392b'; x.fillRect(0, h - 46, w, 30); x.fillStyle = '#e8b030'; x.fillRect(0, h - 56, w, 8);
    x.fillStyle = '#7a2a14'; x.font = `900 92px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('火鸡速运', w / 2 + 50, h / 2 - 20);
    // 小火鸡标志
    const cx = 80, cy = h / 2 - 20; const C = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#8e44ad'];
    for (let i = 0; i < 5; i++) { const a = -PI * 0.85 + (i / 4) * PI * 0.7; x.fillStyle = C[i]; x.beginPath(); x.ellipse(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38, 14, 30, a + PI / 2, 0, 7); x.fill(); }
    x.fillStyle = '#7a4a22'; x.beginPath(); x.arc(cx, cy + 10, 30, 0, 7); x.fill(); x.fillStyle = '#9ac0e8'; x.beginPath(); x.arc(cx, cy - 22, 12, 0, 7); x.fill();
  }, 1024, 320);
}
function crateGeometry() {
  const parts = [];
  for (const y of [0.15, 0.6, 1.05]) for (const s of [-1, 1]) { const b = new THREE.BoxGeometry(1.4, 0.22, 0.08); b.translate(0, y, s * 0.66); parts.push(b); const c = new THREE.BoxGeometry(0.08, 0.22, 1.4); c.translate(s * 0.66, y, 0); parts.push(c); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = new THREE.BoxGeometry(0.14, 1.3, 0.14); p.translate(sx * 0.66, 0.6, sz * 0.66); parts.push(p); }
  const top = new THREE.BoxGeometry(1.44, 0.08, 1.44); top.translate(0, 1.24, 0); parts.push(top);
  return merged(parts);
}
function buildTruck(r, flip) {
  const t = new THREE.Group();
  const red = glossy(0xb8202a, { roughness: 0.35 }), dark = std(0x1a1a1a, { roughness: 0.6 }), chrome = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.2 });
  t.add(mesh(new RoundedBoxGeometry(2.5, 2.2, 2.2, 3, 0.3), red, { y: 1.7, z: -4.2 }));
  t.add(mesh(new RoundedBoxGeometry(2.3, 0.9, 0.08, 2, 0.04), new THREE.MeshPhysicalMaterial({ color: 0x1a2a3a, roughness: 0.05, clearcoat: 1 }), { y: 2.25, z: -5.31 }));
  t.add(mesh(new RoundedBoxGeometry(2.0, 0.6, 0.1, 2, 0.04), chrome, { y: 1.1, z: -5.32 }));
  for (const s of [-1, 1]) t.add(mesh(new THREE.CircleGeometry(0.2, 20), new THREE.MeshBasicMaterial({ color: hdr(0xfff2d0, 2.2), toneMapped: false }), { x: s * 0.85, y: 1.15, z: -5.38, ry: PI, cast: false }));
  // 平板 + 层层叠叠的笼子（里面探出火鸡头）
  t.add(mesh(new THREE.BoxGeometry(2.6, 0.3, 7), dark, { y: 0.95, z: 0.6 }));
  const livery = truckLivery();
  for (const s of [-1, 1]) t.add(mesh(new THREE.PlaneGeometry(7, 2.2), new THREE.MeshStandardMaterial({ map: livery, roughness: 0.6 }), { x: s * 1.31, y: 2.2, z: 0.6, ry: s * PI / 2 }));
  t.add(mesh(new THREE.BoxGeometry(2.6, 2.4, 0.1), std(0xe8e2d6), { y: 2.2, z: -2.85 }));
  for (const [x, z] of [[-1.2, -4.2], [1.2, -4.2], [-1.2, 2.2], [1.2, 2.2], [-1.2, 3.4], [1.2, 3.4]]) { t.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 24), dark, { x, y: 0.55, z, rz: PI / 2 })); t.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.47, 16), chrome, { x, y: 0.55, z, rz: PI / 2, cast: false })); }
  t.rotation.y = flip ? PI : 0;
  return t;
}
function rescueWorld(g, length, r) {
  const L = length + 30, zc = -length / 2 + 5;
  const RW = HALF + 1.5;
  g.add(mesh(new THREE.PlaneGeometry(RW * 2, L), new THREE.MeshStandardMaterial({ map: asphaltTex(L), roughness: 0.82 }), { rx: -PI / 2, y: 0.02, z: zc, cast: false, receive: true }));
  for (const s of [-1, 1]) g.add(mesh(new THREE.PlaneGeometry(0.16, L), std(0xf6f2ea, { roughness: 0.6 }), { x: s * (HALF + 0.9), y: 0.03, z: zc, rx: -PI / 2, cast: false }));
  const dashes = []; for (let z = 6; z > -length - 10; z -= 6) dashes.push({ x: 0, y: 0.031, z, rx: -PI / 2 });
  g.add(instanced(new THREE.PlaneGeometry(0.16, 3), std(0xf2c21a, { roughness: 0.6 }), dashes, { cast: false }));
  // 碎石路肩 + 结霜草地
  const gravel = T.tex(T.canvas(128, 128, (x, w, h) => { x.fillStyle = '#9a8e80'; x.fillRect(0, 0, w, h); const q = T.rng(2); for (let i = 0; i < 1600; i++) { const c = 90 + q() * 90; x.fillStyle = `rgb(${c},${c * 0.95},${c * 0.88})`; x.fillRect(q() * w, q() * h, 2 + q() * 2, 2 + q() * 2); } }), { repeat: [1, L / 2] });
  for (const s of [-1, 1]) g.add(mesh(new THREE.PlaneGeometry(2.2, L), new THREE.MeshStandardMaterial({ map: gravel, roughness: 0.95 }), { x: s * (RW + 1.1), y: 0.015, z: zc, rx: -PI / 2, cast: false, receive: true }));
  grassBits(g, length, r, { tufts: 1800, flowers: 60, leaves: 700, x0: RW + 2.2, x1: RW + 14, lo: '#4a5a3a', hi: '#dfe6d8' });
  // 护栏（部分路段）
  const gposts = [], beams = [];
  for (let z = 4; z > -length + 6; z -= 2) for (const s of [-1, 1]) { if (((Math.floor(-z / 60) + (s > 0 ? 1 : 0)) % 2) === 0) continue; gposts.push({ x: s * (RW + 0.6), y: 0.4, z }); if (Math.round(-z / 2) % 2 === 0) beams.push({ x: s * (RW + 0.5), y: 0.62, z: z - 1 }); }
  g.add(instanced(new THREE.BoxGeometry(0.12, 0.8, 0.12), std(0x8a8a8a, { metalness: 0.7, roughness: 0.35 }), gposts));
  const beamGeo = (() => { const b = new THREE.BoxGeometry(0.06, 0.32, 4.02, 1, 4, 1); const p = b.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + Math.sin(p.getY(i) * 20) * 0.03); b.computeVertexNormals(); return b; })();
  g.add(instanced(beamGeo, new THREE.MeshStandardMaterial({ color: 0xcfd4da, metalness: 0.9, roughness: 0.25 }), beams));
  // 电线杆 + 电线
  const poles = [], arms = [], wires = [];
  let prev = null;
  for (let z = 10; z > -length - 20; z -= 32) {
    const x = -(RW + 5.5);
    poles.push({ x, y: 4.5, z }); arms.push({ x, y: 8.4, z });
    if (prev) for (const dx of [-1.1, 0, 1.1]) { const a = new THREE.Vector3(x + dx, 8.55, prev), b = new THREE.Vector3(x + dx, 8.55, z); let pp = a; for (let k = 1; k <= 10; k++) { const t2 = k / 10; const q = a.clone().lerp(b, t2); q.y -= Math.sin(t2 * PI) * 0.7; wires.push(pp, q); pp = q; } }
    prev = z;
  }
  g.add(instanced(new THREE.CylinderGeometry(0.16, 0.2, 9, 10), new THREE.MeshStandardMaterial({ map: T.barkTex(), color: 0x8a6a4a, roughness: 0.9 }), poles));
  g.add(instanced(new THREE.BoxGeometry(2.8, 0.18, 0.18), std(0x5a4030), arms));
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wires), new THREE.LineBasicMaterial({ color: 0x2a2420 })));
  // 木栅栏
  const fposts = [], frails = [];
  for (let z = 6; z > -length - 6; z -= 3) for (const s of [-1, 1]) { fposts.push({ x: s * (RW + 9), y: 0.6, z }); for (const y of [0.5, 0.95]) frails.push({ x: s * (RW + 9), y, z: z - 1.5 }); }
  const logM = new THREE.MeshStandardMaterial({ map: T.barkTex(), color: 0xa89a8a, roughness: 0.9 });
  g.add(instanced(new THREE.CylinderGeometry(0.08, 0.1, 1.2, 8), logM, fposts));
  const rg = new THREE.CylinderGeometry(0.05, 0.05, 3.1, 6); rg.rotateX(PI / 2);
  g.add(instanced(rg, logM, frails, { cast: false }));
  // 停在路边的货车 + 装笼子的板条箱（里面的火鸡在张望）
  const crates = [], heads = [], wattles = [];
  let k = 0;
  for (let z = -30; z > -length + 20; z -= 66) {
    const s = k++ % 2 ? 1 : -1;
    const tr = buildTruck(r, false); tr.position.set(s * (RW + 3.2), 0, z); g.add(tr);
    for (let i = 0; i < 6; i++) { const cx = s * (RW + 3.2) + ((i % 2) - 0.5) * 1.45, cz = z - 1.6 + Math.floor(i / 2) * 1.5; crates.push({ x: cx, y: 1.1, z: cz, ry: (r() - 0.5) * 0.1 }); heads.push({ x: cx + (r() - 0.5) * 0.4, y: 2.0 + r() * 0.15, z: cz + (r() - 0.5) * 0.4 }); wattles.push({ x: heads[heads.length - 1].x, y: heads[heads.length - 1].y - 0.18, z: heads[heads.length - 1].z - 0.12 }); if (i < 2) { crates.push({ x: cx, y: 2.4, z: cz + 0.75, ry: 0.05 }); } }
    // 路锥
    for (let c = 0; c < 4; c++) crates.length && g.add(mesh(new THREE.ConeGeometry(0.28, 0.75, 16), std(0xff6a1a, { roughness: 0.5 }), { x: s * (RW + 0.9), y: 0.38, z: z + 6 + c * 2.4 }));
  }
  g.add(instanced(crateGeometry(), new THREE.MeshStandardMaterial({ map: T.barkTex(), color: 0xd8b888, roughness: 0.85 }), crates));
  g.add(instanced(new THREE.SphereGeometry(0.2, 14, 10), glossy(0x9ac0e8, { roughness: 0.4 }), heads, { cast: false }));
  g.add(instanced(new THREE.SphereGeometry(0.08, 10, 8), glossy(0xd61a2a), wattles, { cast: false }));
  // 路牌
  const signs = [
    { at: -20, s: 1, text: ['赦免大会', '→ 12 km'], bg: '#1f6a3a' },
    { at: -150, s: -1, text: ['前方', '火鸡出没'], bg: '#f2c21a', diamond: true },
    { at: -270, s: 1, text: ['火鸡自由农场', '3 km'], bg: '#1f6a3a' },
    { at: -380, s: -1, text: ['感恩节快乐', '慢行'], bg: '#c0392b' },
  ];
  for (const sg of signs) {
    if (-sg.at > length - 10) continue;
    const tx = signTex((x, w, h) => { x.fillStyle = sg.bg; x.fillRect(0, 0, w, h); x.strokeStyle = sg.diamond ? '#1a1a1a' : '#ffffff'; x.lineWidth = 12; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = sg.diamond ? '#1a1a1a' : '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `900 76px ${FONT}`; x.fillText(sg.text[0], w / 2, h * 0.34); x.font = `800 62px ${FONT}`; x.fillText(sg.text[1], w / 2, h * 0.7); });
    const x0 = sg.s * (RW + 2.3);
    g.add(mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.5, side: THREE.DoubleSide }), { x: x0, y: 3.1, z: sg.at, ry: sg.diamond ? 0 : 0 }));
    for (const dx of [-1.2, 1.2]) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 8), std(0x8a8a8a, { metalness: 0.7, roughness: 0.4 }), { x: x0 + dx, y: 1.5, z: sg.at + 0.05 }));
  }
  // 圆草捆、信箱
  const bales = [], ends = [];
  for (let i = 0; i < 70; i++) { const s = r() < 0.5 ? -1 : 1; const x = s * (RW + 12 + r() * 30), z = -r() * length; bales.push({ x, y: 0.75, z, ry: r() * 6 }); }
  const baleGeo = new THREE.CylinderGeometry(0.75, 0.75, 1.3, 24); baleGeo.rotateZ(PI / 2);
  g.add(instanced(baleGeo, new THREE.MeshStandardMaterial({ map: T.strawTex(), roughness: 0.95 }), bales));
  void ends;
  const mail = []; for (let z = -60; z > -length + 10; z -= 90) mail.push({ x: (RW + 2.0), y: 0, z });
  g.add(instanced(merged([(() => { const p = new THREE.BoxGeometry(0.1, 1.1, 0.1); p.translate(0, 0.55, 0); return p; })(), (() => { const b = new THREE.CapsuleGeometry(0.2, 0.5, 4, 12); b.rotateX(PI / 2); b.translate(0, 1.25, 0); return b; })()]), glossy(0x2a5aa8), mail));
  treeRow(g, length, r, { x0: RW + 14, x1: RW + 26, step: 12, scale: 1.0 });
  // 低低的晨雾
  const mistM = new THREE.SpriteMaterial({ map: T.cloudTex(), color: 0xfff4ee, transparent: true, opacity: 0.35, depthWrite: false });
  for (let i = 0; i < 40; i++) { const sp = new THREE.Sprite(mistM); sp.scale.set(24, 5, 1); sp.position.set((r() < 0.5 ? -1 : 1) * (RW + 14 + r() * 30), 1.6, -r() * length); g.add(sp); }
}

// =====================================================================
// 第 10 关：午夜大逃亡（初雪月夜的松林小径）
// =====================================================================
function snowTex(len) {
  return T.tex(T.canvas(256, 512, (x, w, h) => {
    x.fillStyle = '#dfe6f2'; x.fillRect(0, 0, w, h);
    const q = T.rng(8);
    for (let i = 0; i < 5000; i++) { x.fillStyle = q() < 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(120,140,180,.10)'; x.fillRect(q() * w, q() * h, 2, 2); }
    // 雪橇辙与脚印
    x.strokeStyle = 'rgba(120,140,190,.30)'; x.lineWidth = 7;
    for (const cx of [70, 186]) { x.beginPath(); x.moveTo(cx, 0); for (let y = 0; y <= h; y += 32) x.lineTo(cx + Math.sin(y * 0.02) * 6, y); x.stroke(); }
    x.fillStyle = 'rgba(110,130,180,.30)';
    for (let y = 10; y < h; y += 46) { x.beginPath(); x.ellipse(118, y, 7, 12, 0.2, 0, 7); x.fill(); x.beginPath(); x.ellipse(140, y + 23, 7, 12, -0.2, 0, 7); x.fill(); }
  }), { repeat: [1, len / 8], aniso: 16 });
}
function snowPineGeo() {
  const green = [], white = [];
  for (let k = 0; k < 4; k++) {
    const r0 = 1.5 - k * 0.32, y = 1.2 + k * 1.0;
    const cg = new THREE.ConeGeometry(r0, 1.7, 16, 1); cg.translate(0, y, 0); green.push(cg);
    const cw = new THREE.ConeGeometry(r0 * 0.82, 0.9, 16, 1); cw.translate(0, y + 0.42, 0); white.push(cw);
  }
  const trunk = new THREE.CylinderGeometry(0.14, 0.22, 1.4, 8); trunk.translate(0, 0.7, 0);
  return { green: noisy(merged(green), 0.08, 3), white: noisy(merged(white), 0.06, 4), trunk };
}
function escapeWorld(g, length, r) {
  const L = length + 30, zc = -length / 2 + 5;
  // 压实的雪道 + 两侧雪堆
  g.add(mesh(new RoundedBoxGeometry(HALF * 2 + 0.6, 0.06, L, 2, 0.03), new THREE.MeshStandardMaterial({ map: snowTex(L), color: 0xc8d2e6, roughness: 0.55, metalness: 0.0 }), { y: 0.02, z: zc, cast: false, receive: true }));
  g.add(mesh(new THREE.PlaneGeometry(60, L), std(0xc4cee2, { roughness: 0.7 }), { rx: -PI / 2, y: -0.01, z: zc, cast: false, receive: true }));
  const banks = [];
  for (let z = 8; z > -length - 8; z -= 1.6) for (const s of [-1, 1]) banks.push({ x: s * (HALF + 0.9 + r() * 0.3), y: 0, z: z + r(), sx: 0.9 + r() * 0.5, sy: 0.35 + r() * 0.25, sz: 1.4 + r() * 0.6, ry: r() });
  g.add(instanced(noisy(new THREE.SphereGeometry(1, 14, 10), 0.12, 5), std(0xd8e0f0, { roughness: 0.6 }), banks, { cast: false }));
  // 灯笼桩（暖光 + 辉光）
  const posts = [], lanterns = [], glows = [];
  for (let z = 2; z > -length + 4; z -= 9) for (const s of [-1, 1]) { const zz = z + (s > 0 ? 4.5 : 0); posts.push({ x: s * (HALF + 1.7), y: 0.9, z: zz }); lanterns.push({ x: s * (HALF + 1.7), y: 1.95, z: zz }); glows.push({ x: s * (HALF + 1.7), y: 1.95, z: zz }); }
  g.add(instanced(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 8), std(0x3a2a1a, { roughness: 0.8 }), posts));
  g.add(instanced(merged([new RoundedBoxGeometry(0.42, 0.55, 0.42, 2, 0.06), (() => { const c = new THREE.ConeGeometry(0.36, 0.25, 4); c.rotateY(PI / 4); c.translate(0, 0.4, 0); return c; })()]), std(0x1a1a1a, { metalness: 0.5, roughness: 0.5 }), lanterns));
  g.add(instanced(new THREE.BoxGeometry(0.34, 0.42, 0.44), new THREE.MeshBasicMaterial({ color: hdr(0xffb050, 3), toneMapped: false }), lanterns, { cast: false, receive: false }));
  g.add(instanced(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: T.softDot(), color: hdr(0xff9a40, 0.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), glows, { cast: false, receive: false }));
  // 积雪木栅栏
  const fposts = [], frails = [], fsnow = [];
  for (let z = 6; z > -length - 6; z -= 3) for (const s of [-1, 1]) { fposts.push({ x: s * (HALF + 3.4), y: 0.6, z }); fsnow.push({ x: s * (HALF + 3.4), y: 1.24, z }); for (const y of [0.5, 0.95]) frails.push({ x: s * (HALF + 3.4), y, z: z - 1.5 }); }
  const logM = new THREE.MeshStandardMaterial({ map: T.barkTex(), color: 0x8a7a6a, roughness: 0.9 });
  g.add(instanced(new THREE.CylinderGeometry(0.08, 0.1, 1.2, 8), logM, fposts));
  const rg = new THREE.CylinderGeometry(0.05, 0.05, 3.1, 6); rg.rotateX(PI / 2);
  g.add(instanced(rg, logM, frails, { cast: false }));
  g.add(instanced(noisy(new THREE.SphereGeometry(0.16, 10, 6), 0.03, 2), std(0xffffff, { roughness: 0.6 }), fsnow, { cast: false }));
  // 雪松林（近处密，远处由地形补齐）
  const pg = snowPineGeo();
  const pines = [];
  for (let i = 0; i < 900; i++) { const s = r() < 0.5 ? -1 : 1; const x = s * (HALF + 4.5 + Math.pow(r(), 0.9) * 28), z = 10 - r() * (length + 40); if (z < -length + 6 && Math.abs(x) < 12) continue; pines.push({ x, y: 0, z, s: 0.9 + r() * 1.3, ry: r() * 6 }); }
  g.add(instanced(pg.trunk, std(0x3a2a1a), pines));
  g.add(instanced(pg.green, new THREE.MeshStandardMaterial({ color: 0x24402e, roughness: 0.85 }), pines));
  g.add(instanced(pg.white, std(0xf4f8ff, { roughness: 0.6 }), pines, { cast: false }));
  // 雪石
  const rocks = []; for (let i = 0; i < 160; i++) { const s = r() < 0.5 ? -1 : 1; rocks.push({ x: s * (HALF + 4 + r() * 20), y: 0, z: -r() * length, s: 0.4 + r() * 0.8, ry: r() * 6 }); }
  g.add(instanced(noisy(new THREE.SphereGeometry(1, 12, 8, 0, PI * 2, 0, PI / 2), 0.25, 9), std(0xeef2fa, { roughness: 0.6 }), rocks));
  // 小木屋：发光的窗、屋顶积雪、烟囱
  const cabinsAt = [[-1, -60], [1, -170], [-1, -290], [1, -390]];
  for (const [s, z] of cabinsAt) {
    if (-z > length - 10) continue;
    const c = new THREE.Group(); c.position.set(s * (HALF + 13), 0, z); c.rotation.y = s > 0 ? -PI / 2 : PI / 2; g.add(c);
    const logs = []; for (let y = 0; y < 8; y++) for (const [x, zz, ry, len] of [[0, 2.5, 0, 6], [0, -2.5, 0, 6], [3, 0, PI / 2, 5], [-3, 0, PI / 2, 5]]) logs.push({ x, y: 0.2 + y * 0.38, z: zz, ry, len });
    for (const lg of logs) { const m = mesh(new THREE.CylinderGeometry(0.2, 0.2, lg.len + 0.5, 10), logM, { x: lg.x, y: lg.y, z: lg.z, rz: lg.ry === 0 ? PI / 2 : 0, rx: lg.ry === 0 ? 0 : PI / 2 }); c.add(m); }
    const prism = (hw, hh, len) => { const sh = new THREE.Shape(); sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(0, hh); sh.closePath(); const e = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); e.translate(0, 0, -len / 2); e.rotateY(PI / 2); return e; };
    c.add(mesh(prism(3.3, 2.1, 6.9), std(0x4a3020), { y: 3.15 }));
    c.add(mesh(prism(3.55, 2.3, 7.2), std(0xf6f9ff, { roughness: 0.6 }), { y: 3.25, sy: 1, cast: false }));
    for (const dx of [-1.5, 1.5]) c.add(mesh(new THREE.PlaneGeometry(1.1, 1.0), new THREE.MeshBasicMaterial({ color: hdr(0xffb050, 2.4), toneMapped: false }), { x: dx, y: 1.6, z: 2.75, cast: false }));
    c.add(mesh(new THREE.BoxGeometry(0.8, 2.4, 0.8), std(0x6a5a5a), { x: 1.8, y: 4.8, z: -1 }));
  }
  // 结冰的池塘
  for (const [s, z] of [[1, -110], [-1, -230], [1, -340]]) { if (-z > length) continue; g.add(mesh(new THREE.CircleGeometry(7, 40), new THREE.MeshPhysicalMaterial({ color: 0x9ac0e8, roughness: 0.05, clearcoat: 1, metalness: 0.1 }), { x: s * (HALF + 15), y: 0.02, z, rx: -PI / 2, sy: 0.6, cast: false, receive: true })); }
  // 月晕
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.softDot(), color: hdr(0x9ab0ff, 0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  halo.scale.set(260, 260, 1); halo.position.set(60, 70, -330); g.add(halo);
  g.userData.ticks.push(() => { halo.position.z = g.userData.camZ - 330; });
  // 飘雪
  fallingParticles(g, { n: 2600, cols: ['#ffffff', '#e8f0ff', '#dfe8ff'], size: 0.16, map: T.softDot(), fall: 1.3, sway: 0.8, w: 18, h: 16 });
}
