// 第二章道具：跳台、土豆泥、大叉子、肉汁/冰面、笼子、小火鸡伙伴、金玉米
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from '../vendor/utils/BufferGeometryUtils.js';
import { buildFeather } from './turkey.mjs';
import { noisy } from './scenery.mjs';
import * as T from './tex.mjs';
import { HALF } from './game.mjs';

const PI = Math.PI;
function mesh(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}
const glossy = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, ...o });
const hdr = (c, k) => new THREE.Color(c).multiplyScalar(k);
const nonIdx = (g) => (g.index ? g.toNonIndexed() : g);
const softDot = T.softDot();
const warnRing = (r0 = 0.9, r1 = 1.05) => mesh(new THREE.RingGeometry(r0, r1, 40), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }), { y: 0.1, rx: -PI / 2, cast: false });

// ---------- 跳台 ----------
const RAMP_STYLE = {
  float: { body: 0xb8102a, top: ['#c8102a', '#ffd24a'], rail: 0xe8b030 },
  table: { body: 0x8a5a2a, top: ['#a8743a', '#fff0c8'], rail: 0xd8dde4 },
  escape: { body: 0xe8eef8, top: ['#cfe0f6', '#2a6ab8'], rail: 0x9ab0d8 },
};
function chevronTex(c1, c2) {
  return T.tex(T.canvas(128, 256, (x, w, h) => {
    x.fillStyle = c1; x.fillRect(0, 0, w, h);
    x.fillStyle = c2;
    for (let y = -20; y < h; y += 64) { x.beginPath(); x.moveTo(14, y + 48); x.lineTo(w / 2, y + 10); x.lineTo(w - 14, y + 48); x.lineTo(w - 14, y + 72); x.lineTo(w / 2, y + 34); x.lineTo(14, y + 72); x.closePath(); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(0, 0, 8, h); x.fillRect(w - 8, 0, 8, h);
  }));
}
export function buildRamp(it, theme) {
  const st = RAMP_STYLE[theme] || RAMP_STYLE.float;
  const g = new THREE.Group();
  const LEN = 2.8, H = 0.85, W = it.w;
  const sh = new THREE.Shape(); sh.moveTo(-LEN / 2, 0); sh.lineTo(LEN / 2, 0); sh.lineTo(LEN / 2, H); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  geo.translate(0, 0, -W / 2); geo.rotateY(PI / 2);
  g.add(mesh(geo, glossy(st.body, { roughness: 0.4 }), { receive: true }));
  const slope = Math.atan2(H, LEN);
  const len = Math.hypot(LEN, H);
  g.add(mesh(new THREE.PlaneGeometry(W - 0.1, len - 0.06), new THREE.MeshStandardMaterial({ map: chevronTex(...st.top), roughness: 0.5 }), { y: H / 2 + 0.03, rx: -PI / 2 + slope, cast: false, receive: true }));
  for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.08, 0.08, len), new THREE.MeshStandardMaterial({ color: st.rail, metalness: 0.9, roughness: 0.2 }), { x: s * (W / 2), y: H / 2 + 0.08, rx: slope, cast: false }));
  const bulbs = new THREE.Group(); g.add(bulbs);
  for (let i = 0; i < 7; i++) bulbs.add(mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: hdr(0xffe08a, 3), toneMapped: false }), { x: -W / 2 + 0.15 + i * (W - 0.3) / 6, y: H + 0.06, z: -LEN / 2, cast: false }));
  // 地面箭头提示：前方 4m 一条亮色引导带
  g.add(mesh(new THREE.PlaneGeometry(W, 3.2), new THREE.MeshBasicMaterial({ map: chevronTex('rgba(0,0,0,0)', 'rgba(255,220,90,.9)'), transparent: true, depthWrite: false }), { y: 0.09, z: LEN / 2 + 1.7, rx: -PI / 2, cast: false }));
  g.position.set(it.x, 0, -it.d + LEN / 2);
  g.userData.bulbs = bulbs;
  return g;
}

// ---------- 土豆泥小山 ----------
const mashGeo = (() => { const g = noisy(new THREE.SphereGeometry(1, 32, 20), 0.14, 7); g.scale(1.05, 0.62, 1.05); return g; })();
export function buildMash() {
  const g = new THREE.Group();
  g.add(mesh(mashGeo, new THREE.MeshPhysicalMaterial({ color: 0xf2e0b0, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0xfff8e0) }), { y: 0.05, receive: true }));
  g.add(mesh(new THREE.CircleGeometry(0.42, 24), glossy(0x6a3410, { roughness: 0.1, clearcoat: 1 }), { y: 0.64, rx: -PI / 2, cast: false }));
  g.add(mesh(new RoundedBoxGeometry(0.36, 0.14, 0.36, 2, 0.04), glossy(0xfff0a0, { roughness: 0.25 }), { x: 0.12, y: 0.72, z: 0.05, ry: 0.5, rz: 0.15 }));
  for (let i = 0; i < 5; i++) g.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0x3a7a2a }), { x: Math.cos(i * 1.3) * 0.5, y: 0.55, z: Math.sin(i * 1.3) * 0.5, cast: false }));
  const steam = [];
  for (let i = 0; i < 3; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false })); sp.scale.setScalar(0.7); sp.position.set((i - 1) * 0.3, 1.0 + i * 0.3, 0); g.add(sp); steam.push(sp); }
  g.add(warnRing(1.15, 1.3));
  g.userData.steam = steam;
  return g;
}

// ---------- 从天而降的大叉子 ----------
const forkUpGeo = (() => {
  const parts = [];
  const h = new THREE.CapsuleGeometry(0.2, 3.6, 4, 14); h.scale(1, 1, 0.42); h.translate(0, 3.6, 0); parts.push(h);
  const neck = new THREE.CylinderGeometry(0.16, 0.42, 0.7, 14); neck.scale(1, 1, 0.3); neck.translate(0, 1.55, 0); parts.push(neck);
  const bridge = new RoundedBoxGeometry(0.95, 0.24, 0.13, 2, 0.05); bridge.translate(0, 1.15, 0); parts.push(bridge);
  for (let i = 0; i < 4; i++) { const t = new THREE.CylinderGeometry(0.055, 0.035, 1.4, 8); t.translate(-0.36 + i * 0.24, 0.42, 0); parts.push(t); }
  return mergeGeometries(parts.map(nonIdx));
})();
const silverM = new THREE.MeshStandardMaterial({ color: 0xe6eaef, metalness: 1, roughness: 0.14 });
export function buildFork() {
  const g = new THREE.Group();
  const fork = mesh(forkUpGeo, silverM, { y: 12 }); fork.rotation.z = 0.08; g.add(fork);
  const shadow = mesh(new THREE.CircleGeometry(0.8, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0, depthWrite: false }), { y: 0.1, rx: -PI / 2, cast: false });
  g.add(shadow);
  const ring = warnRing(0.75, 0.9); g.add(ring);
  g.userData.fork = fork; g.userData.shadow = shadow; g.userData.ring = ring;
  return g;
}

// ---------- 打滑区：肉汁 / 冰面 ----------
function blobShape(hw, hl, seed) {
  const r = T.rng(seed);
  const sh = new THREE.Shape();
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * PI * 2;
    const k = 1 + 0.06 * Math.sin(a * 5 + r() * 2) + 0.04 * Math.sin(a * 11);
    const x = Math.cos(a) * hw * k, y = Math.sin(a) * hl * Math.min(1.02, k);
    if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
  }
  return sh;
}
function crackTex() {
  return T.tex(T.canvas(256, 256, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    const r = T.rng(12);
    x.strokeStyle = 'rgba(80,120,170,.55)'; x.lineWidth = 1.4;
    for (let i = 0; i < 16; i++) { let px = r() * w, py = r() * h; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - 0.5) * 60; py += (r() - 0.5) * 60; x.lineTo(px, py); } x.stroke(); }
    for (let i = 0; i < 80; i++) { x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(r() * w, r() * h, 2, 2); }
  }), { repeat: [2, 6] });
}
export function buildZone(it) {
  const g = new THREE.Group();
  const hw = HALF + 0.25, hl = it.len / 2;
  const geo = new THREE.ExtrudeGeometry(blobShape(hw, hl, it.id * 7 + 3), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.12, bevelSegments: 3, curveSegments: 4 });
  geo.rotateX(-PI / 2);
  if (it.kind === 'gravy') {
    g.add(mesh(geo, new THREE.MeshStandardMaterial({ color: 0x6a2c08, roughness: 0.16, metalness: 0.1, envMapIntensity: 0.25, emissive: 0x2a0e02 }), { y: 0.06, cast: false, receive: true }));
    // 打翻的肉汁船
    const boat = new THREE.Group(); boat.position.set(HALF + 1.6, 0.45, hl * 0.6); boat.rotation.set(0.2, -0.6, 1.15); g.add(boat);
    const bowl = new THREE.SphereGeometry(0.8, 32, 16, 0, PI * 2, PI / 2, PI / 2); bowl.scale(1.6, 0.9, 1);
    boat.add(mesh(bowl, new THREE.MeshPhysicalMaterial({ color: 0xfbf8f2, roughness: 0.15, clearcoat: 1, side: THREE.DoubleSide })));
    boat.add(mesh(new THREE.TorusGeometry(0.35, 0.07, 10, 20, PI), new THREE.MeshPhysicalMaterial({ color: 0xfbf8f2, roughness: 0.15, clearcoat: 1 }), { x: -1.3, y: -0.2 }));
    boat.add(mesh(new THREE.CircleGeometry(0.75, 24), glossy(0x5a2a0c, { roughness: 0.08 }), { y: -0.1, rx: -PI / 2, sx: 1.55, cast: false }));
    g.userData.label = '肉汁打滑！';
  } else {
    g.add(mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, map: crackTex(), roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, metalness: 0.05, transparent: true, opacity: 0.92 }), { y: 0.03, cast: false, receive: true }));
    const sp = new THREE.Group(); g.add(sp);
    for (let i = 0; i < 14; i++) sp.add(mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: softDot, color: hdr(0xcfe8ff, 2.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), { x: (Math.random() - 0.5) * hw * 1.6, y: 0.15, z: (Math.random() - 0.5) * hl * 1.6, cast: false }));
    g.userData.sparkle = sp;
    g.userData.label = '冰面打滑！';
  }
  g.position.set(0, 0, -(it.d + hl));
  return g;
}

// ---------- 小火鸡伙伴 ----------
const FM = (() => {
  const bronze = new THREE.MeshPhysicalMaterial({ color: 0x6a3a18, roughness: 0.45, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color(0xe8a040), clearcoat: 0.3 });
  return {
    bronze, breast: new THREE.MeshPhysicalMaterial({ color: 0x8a4a1e, roughness: 0.5, sheen: 1, sheenColor: new THREE.Color(0xffc060) }),
    skin: glossy(0x9ac0e8, { roughness: 0.45 }), red: glossy(0xd61a2a, { roughness: 0.35 }), beak: glossy(0xf2c060, { roughness: 0.4 }),
    white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }), black: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.1 }), leg: glossy(0xe89a5a, { roughness: 0.5 }),
    body: (() => { const s = new THREE.SphereGeometry(0.42, 24, 18); s.scale(1, 1.0, 1.15); s.translate(0, 0.62, 0); return s; })(),
    breastG: (() => { const s = new THREE.SphereGeometry(0.3, 18, 14); s.scale(1, 1.1, 0.7); s.translate(0, 0.6, -0.3); return s; })(),
    neck: (() => { const c = new THREE.CapsuleGeometry(0.09, 0.3, 4, 10); c.rotateX(-0.35); c.translate(0, 0.98, -0.32); return c; })(),
    head: (() => { const s = new THREE.SphereGeometry(0.16, 18, 14); s.translate(0, 1.2, -0.42); return s; })(),
    beakG: (() => { const c = new THREE.ConeGeometry(0.05, 0.14, 10); c.rotateX(-PI / 2); c.translate(0, 1.18, -0.6); return c; })(),
    snood: (() => { const c = new THREE.CapsuleGeometry(0.025, 0.14, 3, 6); c.translate(0.02, 1.13, -0.6); return c; })(),
    wattle: (() => { const s = new THREE.SphereGeometry(0.055, 10, 8); s.scale(1, 1.4, 1); s.translate(0, 1.06, -0.52); return s; })(),
    eye: new THREE.SphereGeometry(0.045, 12, 10), pupil: new THREE.SphereGeometry(0.025, 10, 8),
    legG: (() => { const c = new THREE.CylinderGeometry(0.03, 0.03, 0.34, 6); c.translate(0, -0.17, 0); return c; })(),
  };
})();
const FAN_C = ['red', 'orange', 'gold', 'teal', 'purple', 'rainbow'];
export function buildFriend(seed = 0) {
  const root = new THREE.Group();
  const body = new THREE.Group(); body.position.y = 0.32; root.add(body);
  body.add(new THREE.Mesh(FM.body, FM.bronze), new THREE.Mesh(FM.breastG, FM.breast), new THREE.Mesh(FM.neck, FM.skin), new THREE.Mesh(FM.head, FM.skin), new THREE.Mesh(FM.beakG, FM.beak), new THREE.Mesh(FM.snood, FM.red), new THREE.Mesh(FM.wattle, FM.red));
  for (const s of [-1, 1]) {
    body.add(mesh(FM.eye, FM.white, { x: s * 0.09, y: 1.24, z: -0.53, cast: false }));
    body.add(mesh(FM.pupil, FM.black, { x: s * 0.1, y: 1.245, z: -0.565, cast: false }));
  }
  const fan = new THREE.Group(); fan.position.set(0, 0.62, 0.4); body.add(fan);
  for (let i = 0; i < 9; i++) { const f = buildFeather(FAN_C[(i + seed) % 6]); const a = (i - 4) * 0.3; f.rotation.set(-0.25, 0, -a); f.scale.set(0.42, 0.62, 1); f.position.z = 0.01 * i; fan.add(f); }
  const legs = [];
  for (const s of [-1, 1]) { const l = mesh(FM.legG, FM.leg, { x: s * 0.13, y: 0.34 }); root.add(l); legs.push(l); }
  root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return { root, body, fan, legs };
}

// ---------- 笼子 ----------
const crateGeo = (() => {
  const parts = [];
  for (const y of [0.18, 0.7, 1.22]) for (const s of [-1, 1]) { const b = new THREE.BoxGeometry(1.6, 0.24, 0.09); b.translate(0, y, s * 0.76); parts.push(b); const c = new THREE.BoxGeometry(0.09, 0.24, 1.6); c.translate(s * 0.76, y, 0); parts.push(c); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = new THREE.BoxGeometry(0.16, 1.5, 0.16); p.translate(sx * 0.76, 0.72, sz * 0.76); parts.push(p); }
  const top = new THREE.BoxGeometry(1.66, 0.1, 1.66); top.translate(0, 1.47, 0); parts.push(top);
  return mergeGeometries(parts.map(nonIdx));
})();
const crateM = new THREE.MeshStandardMaterial({ map: T.barkTex(), color: 0xe0c090, roughness: 0.85 });
export function buildCage(it) {
  const g = new THREE.Group();
  const box = new THREE.Group(); g.add(box);
  box.add(mesh(crateGeo, crateM));
  // 笼里的小火鸡在张望
  const kids = [];
  for (let i = 0; i < it.n; i++) { const f = buildFriend(i); f.root.scale.setScalar(0.62); f.root.position.set((i % 2 - 0.5) * 0.6, 0.05, (Math.floor(i / 2) - 0.5) * 0.5); f.root.rotation.y = PI + (Math.random() - 0.5) * 0.8; box.add(f.root); kids.push(f); }
  // 锁 + 发光提示圈 + 头顶 “+n” 牌
  box.add(mesh(new RoundedBoxGeometry(0.3, 0.32, 0.12, 2, 0.04), new THREE.MeshStandardMaterial({ color: 0xe8b030, metalness: 1, roughness: 0.25 }), { y: 0.75, z: 0.84 }));
  const ring = mesh(new THREE.RingGeometry(1.15, 1.35, 40), new THREE.MeshBasicMaterial({ color: hdr(0x5ad0ff, 2.2), transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }), { y: 0.1, rx: -PI / 2, cast: false });
  g.add(ring);
  const tag = T.tex(T.canvas(256, 128, (x, w, h) => { x.fillStyle = 'rgba(20,90,160,.92)'; x.beginPath(); x.roundRect(6, 6, w - 12, h - 12, 40); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 8; x.stroke(); x.fillStyle = '#fff'; x.font = '900 72px "Nunito","Microsoft YaHei",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(`救 +${it.n}`, w / 2, h / 2 + 4); }));
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tag, depthWrite: false, toneMapped: false })); label.scale.set(1.3, 0.65, 1); label.position.y = 2.25; g.add(label);
  g.position.set(it.x, 0, -it.d);
  g.userData.box = box; g.userData.kids = kids; g.userData.label = label; g.userData.ring = ring;
  return g;
}
export const crateGeometry = crateGeo; export const crateMaterial = crateM;

// ---------- 金玉米（冲刺） ----------
const cobGeo = (() => { const c = new THREE.CapsuleGeometry(0.2, 0.75, 8, 20); const p = c.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), y = p.getY(i); const k = 1 + 0.07 * Math.max(0, Math.sin(a * 10)) * Math.max(0, Math.sin(y * 30)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } c.computeVertexNormals(); return c; })();
export function buildCorn() {
  const g = new THREE.Group();
  const spin = new THREE.Group(); spin.position.y = 0.9; g.add(spin);
  spin.add(mesh(cobGeo, new THREE.MeshPhysicalMaterial({ color: 0xffc21a, emissive: 0x8a5a00, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.25, clearcoat: 1 }), { rz: 0.25 }));
  const husk = new THREE.MeshStandardMaterial({ color: 0x9ab84a, roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) { const l = new THREE.PlaneGeometry(0.28, 0.75, 1, 4); const p = l.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setX(k, p.getX(k) * (1 - (y + 0.375) * 0.8)); p.setZ(k, Math.pow(y + 0.375, 2) * 0.5); } l.computeVertexNormals(); l.translate(0, -0.1, 0); const m = mesh(l, husk, { y: -0.35, ry: (i / 3) * PI * 2, rz: 0.25 }); spin.add(m); }
  g.add(mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: softDot, color: hdr(0xffc040, 1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), { y: 0.9, cast: false }));
  g.add(mesh(new THREE.RingGeometry(0.75, 0.92, 40), new THREE.MeshBasicMaterial({ color: hdr(0xffd24a, 2.2), transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }), { y: 0.1, rx: -PI / 2, cast: false }));
  g.userData.cornSpin = spin;
  return g;
}

// ---------- 破笼木板（飞散用） ----------
export const plankGeo = new THREE.BoxGeometry(1.5, 0.22, 0.09);
export const plankMat = crateM;
