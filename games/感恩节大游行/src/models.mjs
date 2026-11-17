// 程序化三维模型：街区、障碍物、气球、拉绳队
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/geometries/RoundedBoxGeometry.js';
import { mulberry32 } from './sim.mjs';

const cache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...opts }));
  return cache.get(key);
}
function mesh(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}
function tex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

// ---------- 共享材质 ----------
const roadTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#4a4a52'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { g.fillStyle = Math.random() < 0.5 ? '#55555e' : '#404048'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.fillStyle = '#f2c230'; g.fillRect(w / 2 - 5, 0, 4, h); g.fillRect(w / 2 + 2, 0, 4, h);
  g.fillStyle = '#f4f1e8';
  for (const x of [w * 0.25, w * 0.75]) for (let y = 0; y < h; y += 64) g.fillRect(x - 2, y, 4, 32);
}, [1, 4]);
const walkTex = tex(128, 128, (g, w, h) => {
  g.fillStyle = '#cfc6b8'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#b3a998'; g.lineWidth = 2;
  for (let i = 0; i <= w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
}, [1, 10]);
function windowTex(base, win) {
  return tex(128, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 10; y < h - 8; y += 24) for (let x = 8; x < w - 8; x += 24) {
      g.fillStyle = Math.random() < 0.25 ? '#ffd98a' : win; g.fillRect(x, y, 14, 16);
      g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x, y + 14, 14, 2);
    }
  });
}
const FACADES = [['#b5563a', '#5a6e85'], ['#d9a066', '#4d6178'], ['#8a6b56', '#43566b'], ['#c9b48f', '#5b7189'], ['#6f7d8c', '#2f3d4f'], ['#a8443a', '#3e4f63'], ['#e2cfa6', '#58708a']];
const facadeMats = FACADES.map(([b, w]) => new THREE.MeshStandardMaterial({ map: windowTex(b, w), roughness: 0.85 }));
const BUNTING = [0xd9481e, 0xf2b630, 0x8a3b1e, 0x4f8a3a, 0xe8742c, 0xffffff];

// ---------- 街区（40 米一段） ----------
export const CHUNK = 40;
const boxG = new THREE.BoxGeometry(1, 1, 1);
const sphereG = new THREE.SphereGeometry(1, 12, 10);
const capsuleG = new THREE.CapsuleGeometry(0.22, 0.6, 4, 8);
const headG = new THREE.SphereGeometry(0.2, 10, 8);
for (const g of [boxG, sphereG, capsuleG, headG]) g.userData.shared = true;

export function buildChunk(index) {
  const rng = mulberry32(index * 9301 + 49297);
  const g = new THREE.Group();
  const z0 = -index * CHUNK;
  g.position.z = z0 - CHUNK / 2;
  // 路面与人行道
  const road = mesh(new THREE.PlaneGeometry(12, CHUNK), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.95 }), { rx: -Math.PI / 2, cast: false, receive: true });
  g.add(road);
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(4, 0.25, CHUNK), new THREE.MeshStandardMaterial({ map: walkTex, roughness: 0.9 }), { x: s * 8, y: 0.12, cast: false, receive: true }));
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.3, CHUNK), mat(0xe8e2d6), { x: s * 6.05, y: 0.15, cast: false, receive: true }));
    // 楼
    let z = -CHUNK / 2;
    while (z < CHUNK / 2) {
      const w = 7 + rng() * 6;
      const h = 14 + rng() * 26;
      const dep = 8 + rng() * 6;
      const m = mesh(boxG, facadeMats[Math.floor(rng() * facadeMats.length)], { x: s * (10 + dep / 2), y: h / 2, z: z + w / 2, sx: dep, sy: h, sz: w - 0.4, cast: false, receive: true });
      g.add(m);
      // 屋顶檐
      g.add(mesh(boxG, mat(0x3b3530), { x: s * (10 + dep / 2), y: h + 0.3, z: z + w / 2, sx: dep + 0.4, sy: 0.6, sz: w, cast: false }));
      // 一楼雨棚
      g.add(mesh(boxG, mat(BUNTING[Math.floor(rng() * 5)]), { x: s * 9.6, y: 3.3, z: z + w / 2, sx: 1.2, sy: 0.2, sz: w * 0.7, rz: s * 0.3, cast: false }));
      z += w;
    }
    // 观众（实例化）
    const n = 34;
    const bodies = new THREE.InstancedMesh(capsuleG, new THREE.MeshStandardMaterial({ roughness: 0.8 }), n);
    const heads = new THREE.InstancedMesh(headG, mat(0xf0c3a0), n);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const row = i % 2;
      dummy.position.set(s * (7.2 + row * 1.0 + rng() * 0.3), 0.25 + 0.55, -CHUNK / 2 + (i / n) * CHUNK + rng() * 0.6);
      dummy.scale.setScalar(0.9 + rng() * 0.3);
      dummy.rotation.set(0, s * -Math.PI / 2, 0);
      dummy.updateMatrix();
      bodies.setMatrixAt(i, dummy.matrix);
      col.setHSL(rng(), 0.6, 0.5); bodies.setColorAt(i, col);
      dummy.position.y += 0.62 * dummy.scale.y;
      dummy.updateMatrix();
      heads.setMatrixAt(i, dummy.matrix);
      col.setHSL(0.07, 0.4 + rng() * 0.2, 0.45 + rng() * 0.3); heads.setColorAt(i, col);
    }
    bodies.castShadow = false;
    g.add(bodies, heads);
    g.userData.crowds = (g.userData.crowds || []).concat([bodies, heads]);
    // 路灯
    for (const lz of [-12, 8]) {
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.13, 5, 8), mat(0x2d3a2f), { x: s * 6.4, y: 2.5, z: lz }));
      g.add(mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff1c4, emissive: 0xffd27a, emissiveIntensity: 0.6 }), { x: s * 6.4, y: 5.1, z: lz }));
      // 灯杆旗帜
      g.add(mesh(new THREE.PlaneGeometry(0.8, 1.4), new THREE.MeshStandardMaterial({ color: BUNTING[Math.floor(rng() * 5)], side: THREE.DoubleSide }), { x: s * 6.0, y: 4.0, z: lz, ry: Math.PI / 2, cast: false }));
    }
  }
  // 高空彩旗（在气球上方，纯装饰）
  for (const bz of [-10, 10]) {
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const x = -9.5 + t * 19;
      const y = 18.5 - Math.sin(t * Math.PI) * 1.2;
      g.add(mesh(new THREE.ConeGeometry(0.35, 0.8, 3), mat(BUNTING[i % BUNTING.length]), { x, y, z: bz, rz: Math.PI, cast: false }));
    }
  }
  return g;
}

// ---------- 障碍物 ----------
function textTex(text, bg, fg, w = 512, h = 96, font = 54) {
  return tex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = `900 ${font}px "Nunito","Microsoft YaHei",sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 2);
  });
}
const bannerMat = new THREE.MeshStandardMaterial({ map: textTex('HAPPY THANKSGIVING · 感恩节快乐', '#b5402a', '#ffe9b0', 1024, 112, 60), side: THREE.DoubleSide, roughness: 0.9 });
const bridgeSideMat = new THREE.MeshStandardMaterial({ map: textTex('RIVERSIDE BRIDGE', '#8d8a84', '#f4f1e8', 512, 64, 36), roughness: 0.9 });
const signMats = ['🥧 PIE SHOP', '🦃 TURKEY DAY', '🌽 HARVEST'].map((t, i) => new THREE.MeshStandardMaterial({ map: textTex(t, ['#2a4a8a', '#7a2e2a', '#2f6b4a'][i], '#ffe9b0', 512, 192, 70), roughness: 0.6, emissive: 0x111111 }));

export function buildItem(it) {
  const g = new THREE.Group();
  const dMid = (it.d0 + it.d1) / 2;
  g.position.set(0, 0, -dMid);
  const depth = it.d1 - it.d0;
  switch (it.type) {
    case 'banner': {
      for (const s of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.15, 0.18, 7.8, 10), mat(0x3b3530), { x: s * 8.8, y: 3.9 }));
      g.add(mesh(new THREE.BoxGeometry(17.6, 1.6, 0.12), bannerMat, { y: 6.8 }));
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 17.6, 6), mat(0x3b3530), { y: 7.62, rz: Math.PI / 2 }));
      break;
    }
    case 'bridge': {
      g.add(mesh(new THREE.BoxGeometry(24, 1.8, depth), mat(0x9a958c), { y: 6.9, receive: true }));
      g.add(mesh(new THREE.BoxGeometry(24.2, 0.6, 0.3), bridgeSideMat, { y: 6.6, z: depth / 2 + 0.05 }));
      for (const s of [-1, 1]) {
        g.add(mesh(new THREE.BoxGeometry(24, 0.9, 0.15), mat(0x6a6660), { y: 8.25, z: s * depth / 2 }));
        g.add(mesh(new THREE.BoxGeometry(2, 6, depth + 0.6), mat(0x8d8a84), { x: s * 11, y: 3 }));
      }
      // 桥上的观众
      for (let i = 0; i < 12; i++) g.add(mesh(new THREE.CapsuleGeometry(0.22, 0.6, 4, 8), mat(new THREE.Color().setHSL(i / 12, 0.6, 0.55).getHex()), { x: -9 + i * 1.6, y: 8.3, z: depth / 2 - 0.5 }));
      break;
    }
    case 'arm': {
      const s = it.side;
      const px = s * 8.6;
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.25, 6.2, 10), mat(0x2d3a2f), { x: px, y: 3.1 }));
      const len = Math.abs((s < 0 ? it.x1 : it.x0) - px);
      const cx = (px + (s < 0 ? it.x1 : it.x0)) / 2;
      g.add(mesh(new THREE.BoxGeometry(len, 0.35, 0.35), mat(0x2d3a2f), { x: cx, y: 5.8 }));
      // 红绿灯
      for (const k of [0.35, 0.75]) {
        const lx = px + (s < 0 ? 1 : -1) * len * k;
        g.add(mesh(new RoundedBoxGeometry(0.6, 1.5, 0.6, 2, 0.1), mat(0xf2c230), { x: lx, y: 4.85 }));
        [0xe0402a, 0xf2b630, 0x4fb84a].forEach((c, i) => g.add(mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i === 0 ? 0.9 : 0.15 }), { x: lx, y: 5.3 - i * 0.45, z: 0.3, cast: false })));
      }
      // 警示条纹
      g.add(mesh(new THREE.BoxGeometry(len, 0.08, 0.37), mat(0xffffff), { x: cx, y: 6.0, cast: false }));
      break;
    }
    case 'sign': {
      const s = it.side;
      const inner = s < 0 ? it.x1 : it.x0;
      const outer = s * 10;
      const w = Math.abs(outer - inner);
      const cx = (outer + inner) / 2;
      g.add(mesh(new THREE.BoxGeometry(w, 4.6, 0.4), signMats[Math.abs(it.id) % signMats.length], { x: cx, y: 9.3 }));
      g.add(mesh(new THREE.BoxGeometry(w + 0.3, 0.25, 0.6), mat(0x3b3530), { x: cx, y: 11.7 }));
      for (const k of [-0.35, 0.35]) g.add(mesh(new THREE.BoxGeometry(0.15, 5.2, 0.15), mat(0x3b3530), { x: cx + k * w, y: 9.3, z: -0.3 }));
      break;
    }
    case 'tree': {
      const cx = (it.x0 + it.x1) / 2 + it.side * 0.8;
      g.add(mesh(new THREE.CylinderGeometry(0.25, 0.35, 3.2, 8), mat(0x5a3a22), { x: cx, y: 1.6 }));
      const cols = [0xd9481e, 0xe8742c, 0xf2b630, 0xb8341b];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.add(mesh(sphereG, mat(cols[i % 4], { roughness: 0.9 }), { x: cx + Math.cos(a) * 1.2, y: 4.8 + Math.sin(i * 2.3) * 0.6, z: Math.sin(a) * 0.9, sx: 1.6, sy: 1.5, sz: 1.4 }));
      }
      g.add(mesh(sphereG, mat(0xe8742c, { roughness: 0.9 }), { x: cx, y: 5.9, sx: 1.8, sy: 1.5, sz: 1.5 }));
      break;
    }
    case 'cones': {
      const n = Math.max(2, Math.round((it.x1 - it.x0) / 0.9));
      for (let i = 0; i < n; i++) {
        const x = it.x0 + 0.4 + (i * (it.x1 - it.x0 - 0.8)) / Math.max(1, n - 1);
        g.add(mesh(new THREE.ConeGeometry(0.3, 0.9, 12), mat(0xff7a1a), { x, y: 0.5 }));
        g.add(mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 12), mat(0xffffff), { x, y: 0.55, cast: false }));
        g.add(mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), mat(0x222222), { x, y: 0.05, cast: false }));
      }
      g.add(mesh(new THREE.BoxGeometry(it.x1 - it.x0, 0.12, 0.12), mat(0xffffff), { x: (it.x0 + it.x1) / 2, y: 0.8 }));
      break;
    }
    case 'cart': {
      const cx = (it.x0 + it.x1) / 2;
      g.add(mesh(new RoundedBoxGeometry(2.4, 0.5, 1.8, 2, 0.08), mat(0x8a4f2c), { x: cx, y: 0.8 }));
      for (const [wx, wz] of [[-0.9, 0.9], [0.9, 0.9], [-0.9, -0.9], [0.9, -0.9]]) g.add(mesh(new THREE.TorusGeometry(0.3, 0.08, 6, 14), mat(0x3b3530), { x: cx + wx, y: 0.35, z: wz }));
      for (let i = 0; i < 5; i++) g.add(mesh(sphereG, mat(i % 2 ? 0xe8742c : 0xf2a03a), { x: cx - 0.7 + (i % 3) * 0.7, y: 1.35 + Math.floor(i / 3) * 0.4, z: (i % 2) * 0.5 - 0.25, sx: 0.42, sy: 0.33, sz: 0.42 }));
      break;
    }
    case 'fans': {
      g.position.x = it.x;
      const people = [];
      for (let i = 0; i < it.n; i++) {
        const p = buildWalker(new THREE.Color().setHSL(i / it.n + 0.05, 0.7, 0.55).getHex(), true);
        p.root.position.set((i - (it.n - 1) / 2) * 0.75, 0, 0);
        p.root.rotation.y = Math.PI;
        g.add(p.root);
        people.push(p);
      }
      const sign = mesh(new THREE.PlaneGeometry(1.6, 0.7), new THREE.MeshBasicMaterial({ map: textTex(`+${it.n} 加入!`, '#ffffff', '#c0213b', 256, 112, 64), side: THREE.DoubleSide }), { y: 2.6, cast: false });
      g.add(sign);
      g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), mat(0x8a4f2c), { y: 1.9 }));
      const ring = mesh(new THREE.RingGeometry(1.5, 1.8, 32), new THREE.MeshBasicMaterial({ color: 0x7fe07a, transparent: true, opacity: 0.7, side: THREE.DoubleSide }), { y: 0.06, rx: -Math.PI / 2, cast: false });
      g.add(ring);
      g.userData.people = people;
      g.userData.bob = true;
      break;
    }
    case 'pump': {
      g.position.x = it.x;
      g.add(mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.6, 16), mat(0x2a7fd0), { y: 0.8 }));
      g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), mat(0xc9c9c9, { metalness: 0.6 }), { y: 2.1 }));
      g.add(mesh(new THREE.BoxGeometry(0.8, 0.12, 0.12), mat(0x3b3530), { y: 2.7 }));
      g.add(mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 20, Math.PI * 1.4), mat(0x1d1d1d), { x: 0.5, y: 1.2, rz: 1 }));
      const sign = mesh(new THREE.PlaneGeometry(1.8, 0.7), new THREE.MeshBasicMaterial({ map: textTex('打气 +30%', '#2a7fd0', '#ffffff', 256, 100, 56), side: THREE.DoubleSide }), { y: 3.4, cast: false });
      g.add(sign);
      g.add(mesh(new THREE.RingGeometry(1.5, 1.8, 32), new THREE.MeshBasicMaterial({ color: 0x7fc4ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }), { y: 0.06, rx: -Math.PI / 2, cast: false }));
      break;
    }
    case 'gift': {
      g.position.set(it.x, it.y, -it.d0);
      g.add(buildGift(it.kind));
      g.userData.spin = true;
      break;
    }
    case 'star': {
      g.position.set(it.x, it.y, -it.d0);
      g.add(mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffa800, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.35 }), { cast: false }));
      g.userData.spin = true;
      break;
    }
    case 'gust': {
      // 风区：飘动的落叶在 update 中移动
      const leaves = [];
      const len = depth;
      for (let i = 0; i < 26; i++) {
        const l = mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshStandardMaterial({ color: [0xd9481e, 0xf2b630, 0xe8742c][i % 3], side: THREE.DoubleSide }), { cast: false });
        l.userData.base = new THREE.Vector3(Math.random() * 20 - 10, 2 + Math.random() * 10, (Math.random() - 0.5) * len);
        l.position.copy(l.userData.base);
        g.add(l); leaves.push(l);
      }
      g.userData.leaves = leaves;
      g.userData.dir = it.dir;
      break;
    }
    default: break;
  }
  return g;
}

const starShape = new THREE.Shape();
for (let i = 0; i < 10; i++) {
  const r = i % 2 ? 0.28 : 0.62;
  const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
  if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
}
const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
starGeo.center();
starGeo.userData.shared = true;

// 终点拱门
export function buildFinish(d) {
  const g = new THREE.Group();
  g.position.z = -d;
  for (const s of [-1, 1]) g.add(mesh(new RoundedBoxGeometry(1.2, 15, 1.2, 2, 0.2), mat(0xc0213b), { x: s * 9, y: 7.5 }));
  g.add(mesh(new THREE.BoxGeometry(19.2, 2.2, 1), new THREE.MeshStandardMaterial({ map: textTex('终 点 · FINISH', '#f2b630', '#7a2e2a', 1024, 120, 80) }), { y: 14 }));
  for (let i = 0; i < 14; i++) g.add(mesh(new THREE.SphereGeometry(0.6, 12, 10), mat(BUNTING[i % 5]), { x: -8 + (i * 16) / 13, y: 15.5 + Math.sin(i) * 0.2 }));
  // 看台
  for (const s of [-1, 1]) for (let r = 0; r < 4; r++) {
    g.add(mesh(new THREE.BoxGeometry(3, 0.5, 14), mat(r % 2 ? 0xe8e2d6 : 0xd6cfc2), { x: s * (7.4 + r * 0.9), y: 0.5 + r * 0.7, z: 8 }));
  }
  return g;
}

// ---------- 拉绳队员 ----------
// rarity: 0 普通 1 稀有 2 史诗 3 传说
export const UNIFORMS = {
  red: { name: '红色鼓号队', price: 0, rarity: 0, body: 0xc0213b, hat: 0xffffff, band: 0x1d2a4a, legs: 0xf4f1e8 },
  blue: { name: '蓝色水手', price: 100, rarity: 0, body: 0x2a6fd0, hat: 0xffffff, band: 0x1d2a4a, legs: 0xffffff },
  pumpkin: { name: '南瓜橙', price: 160, rarity: 1, body: 0xe8742c, hat: 0x4f6b2a, band: 0x3a2618, legs: 0x3a2618 },
  green: { name: '森林精灵', price: 240, rarity: 1, body: 0x3f8f4a, hat: 0xc0213b, band: 0xf2b630, legs: 0x2a3a22 },
  pilgrim: { name: '清教徒', price: 320, rarity: 2, body: 0x2a2624, hat: 0x1d1a18, band: 0xf2c230, legs: 0x2a2624, collar: 0xffffff },
  gold: { name: '金色冠军', price: 520, rarity: 3, body: 0xf2b630, hat: 0xffffff, band: 0xc0213b, legs: 0x7a2e2a, metal: true },
};

export function buildWalker(color = 0xc0213b, fan = false, uniform = null) {
  const u = uniform || { body: color, hat: 0xffffff, band: 0x1d2a4a, legs: 0xf4f1e8 };
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const skinCols = [0xf0c3a0, 0xd9a27a, 0xb8794f, 0xf5d0b0];
  const skin = mat(skinCols[Math.floor(Math.random() * skinCols.length)]);
  const bodyMat = u.metal ? mat(u.body, { metalness: 0.55, roughness: 0.3 }) : mat(u.body);
  body.add(mesh(new THREE.CapsuleGeometry(0.24, 0.45, 4, 10), bodyMat, { y: 1.05 }));
  if (!fan) {
    body.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.05), mat(u.band), { y: 1.15, z: -0.23, cast: false }));
    for (const s of [-1, 1]) body.add(mesh(new THREE.SphereGeometry(0.04, 6, 6), mat(0xf2c230, { metalness: 0.6 }), { x: s * 0.08, y: 1.3, z: -0.24, cast: false }));
    if (u.collar) body.add(mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.08, 14), mat(u.collar), { y: 1.42 }));
  }
  body.add(mesh(new THREE.SphereGeometry(0.22, 12, 10), skin, { y: 1.62 }));
  if (!fan) {
    body.add(mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.3, 12), mat(u.hat), { y: 1.9 }));
    body.add(mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 14), mat(u.band), { y: 1.76 }));
    body.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(u.band), { y: 2.08 }));
  } else {
    body.add(mesh(new THREE.SphereGeometry(0.23, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(0x3a2618), { y: 1.66 }));
  }
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.12, 0.72, 0);
    leg.add(mesh(new THREE.CapsuleGeometry(0.09, 0.45, 4, 8), mat(fan ? 0x3b4a6b : u.legs), { y: -0.32 }));
    leg.add(mesh(new THREE.BoxGeometry(0.16, 0.1, 0.26), mat(0x2a201c), { y: -0.66, z: -0.05 }));
    body.add(leg); legs.push(leg);
    const arm = new THREE.Group(); arm.position.set(s * 0.3, 1.32, 0);
    arm.add(mesh(new THREE.CapsuleGeometry(0.07, 0.4, 4, 8), bodyMat, { y: -0.25 }));
    arm.add(mesh(new THREE.SphereGeometry(0.08, 8, 6), fan ? skin : mat(0xffffff), { y: -0.5 }));
    body.add(arm); arms.push(arm);
  }
  const hand = new THREE.Object3D(); hand.position.set(0, 1.7, -0.3); body.add(hand);
  return { root, body, legs, arms, hand };
}

// ---------- 装扮目录 ----------
export const RARITY = [
  { name: '普通', color: '#7a9a6a' },
  { name: '稀有', color: '#2a7fd0' },
  { name: '史诗', color: '#8a4ad9' },
  { name: '传说', color: '#e8a21a' },
];
export const OUTFITS = {
  hat: {
    none: { name: '不戴', price: 0, rarity: 0 },
    party: { name: '派对尖帽', price: 80, rarity: 0 },
    pilgrim: { name: '感恩节礼帽', price: 160, rarity: 1 },
    cowboy: { name: '牛仔帽', price: 220, rarity: 1 },
    chef: { name: '大厨高帽', price: 300, rarity: 2 },
    crown: { name: '黄金皇冠', price: 480, rarity: 3 },
    halo: { name: '天使光环', price: 620, rarity: 3 },
  },
  glasses: {
    none: { name: '不戴', price: 0, rarity: 0 },
    shades: { name: '酷炫墨镜', price: 120, rarity: 0 },
    hearts: { name: '爱心眼镜', price: 200, rarity: 1 },
    stars: { name: '明星眼镜', price: 340, rarity: 2 },
  },
  neck: {
    none: { name: '不戴', price: 0, rarity: 0 },
    scarf: { name: '格纹围巾', price: 100, rarity: 0 },
    bowtie: { name: '红色领结', price: 150, rarity: 1 },
    lei: { name: '丰收花环', price: 260, rarity: 2 },
    medal: { name: '冠军金牌', price: 450, rarity: 3 },
  },
  skin: {
    classic: { name: '经典原色', price: 0, rarity: 0 },
    sakura: { name: '樱花粉', price: 180, rarity: 1 },
    frost: { name: '冰霜蓝', price: 260, rarity: 2 },
    gold: { name: '黄金气球', price: 480, rarity: 3 },
    rainbow: { name: '流光彩虹', price: 700, rarity: 3 },
  },
  trail: {
    none: { name: '无拖尾', price: 0, rarity: 0 },
    sparkle: { name: '星光闪闪', price: 140, rarity: 1 },
    hearts: { name: '爱心泡泡', price: 220, rarity: 1 },
    confetti: { name: '派对彩纸', price: 320, rarity: 2 },
    rainbow: { name: '彩虹尾迹', price: 560, rarity: 3 },
  },
};

const shiny = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.28, metalness: 0.04, ...o });
const GOLD = () => shiny(0xf2c230, { metalness: 0.85, roughness: 0.18, emissive: 0x553300, emissiveIntensity: 0.3 });

export function buildHat(kind) {
  const g = new THREE.Group();
  if (kind === 'party') {
    g.add(mesh(new THREE.ConeGeometry(0.55, 1.4, 24), shiny(0x7a4ad9), { y: 0.7 }));
    for (let i = 0; i < 4; i++) g.add(mesh(new THREE.TorusGeometry(0.5 - i * 0.11, 0.05, 6, 20), shiny(0xf2c230), { y: 0.18 + i * 0.32, rx: Math.PI / 2 }));
    g.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), shiny(0xff5a8a), { y: 1.45 }));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.06, 6, 6), shiny(0xff5a8a), { x: Math.cos(a) * 0.5, y: 0.05, z: Math.sin(a) * 0.5 })); }
  } else if (kind === 'pilgrim') {
    g.add(mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.1, 32), shiny(0x1d1a18), { y: 0.05 }));
    g.add(mesh(new THREE.CylinderGeometry(0.58, 0.68, 1.15, 28), shiny(0x1d1a18), { y: 0.62 }));
    g.add(mesh(new THREE.CylinderGeometry(0.69, 0.69, 0.24, 28), shiny(0x4a3424), { y: 0.25 }));
    g.add(mesh(new RoundedBoxGeometry(0.46, 0.36, 0.08, 2, 0.03), GOLD(), { y: 0.26, z: -0.68 }));
    g.add(mesh(new THREE.BoxGeometry(0.24, 0.18, 0.1), shiny(0x1d1a18), { y: 0.26, z: -0.7 }));
  } else if (kind === 'cowboy') {
    const brown = shiny(0x8a5a32, { roughness: 0.6 });
    const brim = mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.08, 36), brown, { y: 0.06 });
    brim.scale.set(1, 1, 0.85); g.add(brim);
    for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 12, Math.PI), brown, { x: s * 1.0, y: 0.25, rz: s * Math.PI / 2, ry: Math.PI / 2 }));
    g.add(mesh(new THREE.SphereGeometry(0.62, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2), brown, { y: 0.1, sy: 1.15 }));
    g.add(mesh(new THREE.CylinderGeometry(0.63, 0.63, 0.14, 24), shiny(0x3a2618), { y: 0.2 }));
    g.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), GOLD(), { y: 0.2, z: -0.63 }));
  } else if (kind === 'chef') {
    g.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.55, 28), shiny(0xffffff), { y: 0.28 }));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.4, 16, 12), shiny(0xffffff), { x: Math.cos(a) * 0.38, y: 0.78, z: Math.sin(a) * 0.38 })); }
    g.add(mesh(new THREE.SphereGeometry(0.48, 16, 12), shiny(0xffffff), { y: 1.0 }));
    g.add(mesh(new THREE.TorusGeometry(0.6, 0.04, 6, 28), shiny(0xc0213b), { y: 0.1, rx: Math.PI / 2 }));
  } else if (kind === 'crown') {
    const gold = GOLD();
    g.add(mesh(new THREE.CylinderGeometry(0.72, 0.68, 0.42, 28, 1, true), gold, { y: 0.22 }));
    g.add(mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 28), gold, { y: 0.02, rx: Math.PI / 2 }));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      g.add(mesh(new THREE.ConeGeometry(0.16, 0.52, 10), gold, { x: Math.cos(a) * 0.66, y: 0.64, z: Math.sin(a) * 0.66 }));
      g.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), gold, { x: Math.cos(a) * 0.66, y: 0.92, z: Math.sin(a) * 0.66 }));
      g.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), shiny([0xe0402a, 0x2a7fd0, 0x4fb84a][i % 3], { emissive: [0x501010, 0x102050, 0x105010][i % 3], roughness: 0.1 }), { x: Math.cos(a) * 0.72, y: 0.22, z: Math.sin(a) * 0.72 }));
    }
  } else if (kind === 'halo') {
    const glow = new THREE.MeshStandardMaterial({ color: 0xffc21a, emissive: 0xffb000, emissiveIntensity: 1.2, metalness: 0.6, roughness: 0.15 });
    g.add(mesh(new THREE.TorusGeometry(0.78, 0.14, 14, 48), glow, { y: 0.75, rx: Math.PI / 2 - 0.45, cast: false }));
    g.add(mesh(new THREE.TorusGeometry(0.78, 0.22, 10, 48), new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }), { y: 0.75, rx: Math.PI / 2 - 0.45, cast: false }));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xfff6c0 }), { x: Math.cos(a) * 0.78, y: 0.95, z: Math.sin(a) * 0.78, cast: false })); }
    g.userData.float = true;
  }
  return g;
}
export function buildGlasses(kind) {
  const g = new THREE.Group();
  if (kind === 'shades') {
    const black = shiny(0x111111, { roughness: 0.05, metalness: 0.5 });
    for (const s of [-1, 1]) {
      g.add(mesh(new RoundedBoxGeometry(0.62, 0.42, 0.1, 3, 0.12), black, { x: s * 0.38 }));
      g.add(mesh(new THREE.BoxGeometry(0.18, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }), { x: s * 0.38 - 0.12, y: 0.1, z: -0.06, rz: 0.5, cast: false }));
    }
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.07, 0.08), black, { y: 0.1 }));
  } else if (kind === 'hearts') {
    const heart = new THREE.Shape();
    heart.moveTo(0, -0.3); heart.bezierCurveTo(-0.48, 0.02, -0.27, 0.34, 0, 0.15); heart.bezierCurveTo(0.27, 0.34, 0.48, 0.02, 0, -0.3);
    const geo = new THREE.ExtrudeGeometry(heart, { depth: 0.06, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
    for (const s of [-1, 1]) g.add(mesh(geo, shiny(0xff4f8a, { roughness: 0.1, transparent: true, opacity: 0.9 }), { x: s * 0.4, rx: Math.PI }));
    g.add(mesh(new THREE.BoxGeometry(0.25, 0.05, 0.05), shiny(0xff4f8a), { y: 0.05 }));
  } else if (kind === 'stars') {
    const st = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.17 : 0.4; const a = (i / 10) * Math.PI * 2 + Math.PI / 2; if (i === 0) st.moveTo(Math.cos(a) * r, Math.sin(a) * r); else st.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    const geo = new THREE.ExtrudeGeometry(st, { depth: 0.06, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
    for (const s of [-1, 1]) g.add(mesh(geo, shiny(0xffd23a, { metalness: 0.6, roughness: 0.2, emissive: 0x664400, emissiveIntensity: 0.4 }), { x: s * 0.42, rx: Math.PI }));
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), GOLD(), { y: 0.05 }));
  }
  return g;
}
export function buildNeck(kind, r) {
  const g = new THREE.Group();
  if (kind === 'scarf') {
    g.add(mesh(new THREE.TorusGeometry(r, 0.24, 12, 32), shiny(0xc0213b, { roughness: 0.75 }), { rx: Math.PI / 2 }));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.add(mesh(new THREE.TorusGeometry(0.235, 0.05, 6, 14), shiny(0xf6ead2), { x: Math.cos(a) * r, z: Math.sin(a) * r, ry: -a })); }
    const tail = new THREE.Group(); tail.position.set(0.4, -0.1, -r * 0.92); tail.rotation.z = 0.18; g.add(tail);
    tail.add(mesh(new RoundedBoxGeometry(0.42, 1.2, 0.12, 2, 0.06), shiny(0xc0213b, { roughness: 0.75 }), { y: -0.55 }));
    for (let i = 0; i < 3; i++) tail.add(mesh(new THREE.BoxGeometry(0.44, 0.06, 0.14), shiny(0xf6ead2), { y: -0.2 - i * 0.32 }));
  } else if (kind === 'bowtie') {
    const red = shiny(0xd9302a);
    for (const s of [-1, 1]) g.add(mesh(new THREE.ConeGeometry(0.34, 0.64, 4), red, { x: s * 0.32, z: -r - 0.06, rz: s * Math.PI / 2 }));
    g.add(mesh(new THREE.SphereGeometry(0.15, 12, 10), red, { z: -r - 0.12 }));
    for (const s of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.05, 6, 6), shiny(0xffffff), { x: s * 0.35, y: 0.08, z: -r - 0.2 }));
  } else if (kind === 'lei') {
    const cols = [0xe8742c, 0xf2b630, 0xc0213b, 0xffffff, 0xd9481e];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      g.add(mesh(new THREE.SphereGeometry(0.2, 10, 8), shiny(cols[i % cols.length], { roughness: 0.5 }), { x: Math.cos(a) * r, z: Math.sin(a) * r, sy: 0.7 }));
      if (i % 2) g.add(mesh(new THREE.SphereGeometry(1, 8, 6), shiny(0x4f8a3a), { x: Math.cos(a) * (r + 0.12), y: -0.08, z: Math.sin(a) * (r + 0.12), sx: 0.16, sy: 0.04, sz: 0.1, ry: -a }));
    }
  } else if (kind === 'medal') {
    for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.22, 1.0, 0.04), shiny(s < 0 ? 0xc0213b : 0x2a6fd0), { x: s * 0.2, y: 0.1, z: -r - 0.05, rz: s * 0.35 }));
    const disc = new THREE.Group(); disc.position.set(0, -0.45, -r - 0.12); g.add(disc);
    disc.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 28), GOLD(), { rx: Math.PI / 2 }));
    disc.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 28), shiny(0xffe066, { metalness: 0.7, roughness: 0.25 }), { rx: Math.PI / 2, z: -0.02 }));
    const st = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? 0.08 : 0.19; const a = (i / 10) * Math.PI * 2 + Math.PI / 2; if (i === 0) st.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else st.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    disc.add(mesh(new THREE.ExtrudeGeometry(st, { depth: 0.04, bevelEnabled: false }), shiny(0xc0213b), { z: -0.07, rx: Math.PI }));
  }
  return g;
}

// ---------- 气球表情 ----------
function buildFace(parent, { x, y, z, eye, mouthY, mouthW }) {
  const before = parent.children.length;
  const face = { eyes: [], brows: [], lids: [] };
  const white = shiny(0xffffff, { roughness: 0.15 });
  const iris = shiny(0x3a2414, { roughness: 0.1 });
  const pupil = new THREE.MeshBasicMaterial({ color: 0x0d0a08 });
  const hi = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * x, y, z); parent.add(e);
    e.add(mesh(new THREE.SphereGeometry(eye, 20, 16), white, { sz: 0.55, cast: false }));
    const pup = new THREE.Group(); e.add(pup);
    pup.add(mesh(new THREE.SphereGeometry(eye * 0.62, 16, 12), iris, { z: -eye * 0.32, sz: 0.4, cast: false }));
    pup.add(mesh(new THREE.SphereGeometry(eye * 0.36, 12, 10), pupil, { z: -eye * 0.42, sz: 0.4, cast: false }));
    pup.add(mesh(new THREE.SphereGeometry(eye * 0.16, 8, 6), hi, { x: eye * 0.18, y: eye * 0.2, z: -eye * 0.52, cast: false }));
    pup.add(mesh(new THREE.SphereGeometry(eye * 0.08, 6, 6), hi, { x: -eye * 0.15, y: -eye * 0.18, z: -eye * 0.52, cast: false }));
    const lid = mesh(new THREE.SphereGeometry(eye * 1.04, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), parent.userData.skinMat, { cast: false, sz: 0.6 });
    lid.scale.y = 0.05; lid.userData.lid = true; e.add(lid);
    const brow = mesh(new THREE.CapsuleGeometry(eye * 0.12, eye * 0.8, 4, 8), shiny(0x3a2414), { x: s * x, y: y + eye * 1.25, z: z - eye * 0.1, rz: Math.PI / 2, cast: false });
    parent.add(brow);
    face.eyes.push({ e, pup }); face.lids.push(lid); face.brows.push(brow);
  }
  const mouth = new THREE.Group(); mouth.position.set(0, mouthY, z + 0.02); parent.add(mouth);
  mouth.add(mesh(new THREE.SphereGeometry(mouthW, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), shiny(0x6b1a1a), { sz: 0.35, cast: false }));
  mouth.add(mesh(new THREE.SphereGeometry(mouthW * 0.55, 12, 8), shiny(0xff7a8a), { y: -mouthW * 0.55, z: -0.03, sz: 0.3, cast: false }));
  face.mouth = mouth;
  for (const s of [-1, 1]) parent.add(mesh(new THREE.SphereGeometry(eye * 0.5, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff8a9a, transparent: true, opacity: 0.55 }), { x: s * x * 1.75, y: y - eye * 1.1, z: z + eye * 0.25, sz: 0.25, cast: false }));
  // 标记五官：换皮肤时不改它们的颜色
  for (let i = before; i < parent.children.length; i++) parent.children[i].traverse((o) => { if (!o.userData.lid) o.userData.face = true; });
  return face;
}

export function animateFace(face, t, mood, k = 1) {
  if (!face) return;
  const blink = (t % 3.4) < 0.12;
  for (const [i, lid] of face.lids.entries()) {
    let target = 0.05;
    if (blink) target = 1;
    if (mood === 'joy') target = 0.32;
    if (mood === 'ouch') target = 1;
    if (mood === 'power') target = 0.3;
    lid.scale.y += (target - lid.scale.y) * Math.min(1, k * 0.4);
    face.eyes[i].pup.position.x = Math.sin(t * 0.7) * 0.03;
  }
  for (const [i, b] of face.brows.entries()) {
    const s = i === 0 ? -1 : 1;
    const ang = mood === 'ouch' ? -0.5 * s : mood === 'power' ? 0.45 * s : mood === 'joy' ? -0.2 * s : 0;
    b.rotation.z = Math.PI / 2 + ang;
  }
  const open = mood === 'ouch' ? 1.6 : mood === 'joy' ? 1.35 : 1 + Math.sin(t * 2) * 0.05;
  face.mouth.scale.set(mood === 'ouch' ? 0.7 : 1, open, 1);
}

// ---------- 皮肤 ----------
function applySkin(root, skin) {
  if (!skin || skin === 'classic') return;
  let idx = 0;
  const hsl = { h: 0, s: 0, l: 0 };
  root.traverse((o) => {
    if (!o.isMesh || o.userData.face || o.userData.outfit || o.userData.fx) return;
    const m = o.material.clone();
    m.color.getHSL(hsl);
    const l = hsl.l;
    if (skin === 'sakura') { m.color.setHSL(0.95 + (idx % 3) * 0.015, 0.7, Math.min(0.85, 0.55 + l * 0.45)); }
    else if (skin === 'frost') { m.color.setHSL(0.55 + (idx % 2) * 0.03, 0.6, Math.min(0.88, 0.5 + l * 0.5)); m.roughness = 0.12; m.metalness = 0.15; }
    else if (skin === 'gold') { m.color.setHSL(0.125, 0.92, Math.max(0.48, Math.min(0.68, 0.42 + l * 0.45))); m.metalness = 0.45; m.roughness = 0.22; m.emissive = new THREE.Color(0x6a4200); m.emissiveIntensity = 0.55; }
    else if (skin === 'rainbow') {
      const geo = o.geometry.clone();
      const pos = geo.attributes.position;
      geo.computeBoundingBox();
      const y0 = geo.boundingBox.min.y, y1 = geo.boundingBox.max.y;
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
      geo.userData.rb = { y0, span: Math.max(0.001, y1 - y0), off: (idx * 0.11) % 1 };
      o.geometry = geo;
      m.color.set(0xffffff); m.vertexColors = true; m.userData.rainbow = true; m.roughness = 0.25;
      rainbowPaint(geo, 0);
    }
    o.material = m;
    idx++;
  });
}

const _c = new THREE.Color();
function rainbowPaint(geo, t) {
  const { y0, span, off } = geo.userData.rb;
  const pos = geo.attributes.position, col = geo.attributes.color;
  for (let i = 0; i < pos.count; i++) {
    const h = (((pos.getY(i) - y0) / span) * 0.85 + off - t * 0.25) % 1;
    _c.setHSL((h + 1) % 1, 1.0, 0.5);
    col.setXYZ(i, _c.r, _c.g, _c.b);
  }
  col.needsUpdate = true;
}

// 每种气球的装扮挂点（在头部/身体局部坐标里校准过）
function outfitFit(key, b) {
  if (key === 'turkey') return { hat: [0, 0.92, 0.05, 1.3], glasses: [0, 0.27, -1.08, 1.12], neck: [0, -0.92, 0.12], neckR: 0.82 };
  if (key === 'pumpkin') return { hat: [0, b.ry * 0.93, 0, 1.95], glasses: [0, 0.47, -b.rz * 1.06, 2.05], neck: [0, -b.ry * 0.55, 0], neckR: b.rx * 0.88 };
  return { hat: [0, 2.38, 0, 1.45], glasses: [0, 0.77, -b.rz * 1.1, 1.2], neck: [0, -0.3, 0], neckR: b.rx * 1.08 };
}

// ---------- 气球 ----------
export function buildBalloon(key, b, outfit = {}) {
  const g = new THREE.Group();
  const inner = new THREE.Group(); g.add(inner);
  const parts = { wings: [], feathers: [], leaves: [], feet: [], floaters: [] };
  let headGroup, face, stem = null;
  if (key === 'turkey') {
    const brown = shiny(0x8a4a22);
    inner.userData.skinMat = shiny(0xa86a3c);
    inner.add(mesh(new THREE.SphereGeometry(1, 36, 28), brown, { sx: b.rx * 0.92, sy: b.ry * 0.95, sz: b.rz * 0.92 }));
    inner.add(mesh(new THREE.SphereGeometry(1, 28, 20), shiny(0xf0d2a6), { y: -0.35, z: -1.05, sx: 1.35, sy: 1.25, sz: 0.85 }));
    const cols = [0xc0213b, 0xe8742c, 0xf2b630, 0xd9481e, 0x8a3b1e, 0xd9481e, 0xf2b630, 0xe8742c, 0xc0213b];
    for (let i = 0; i < 9; i++) {
      const a = -1.35 + (i / 8) * 2.7;
      const f = new THREE.Group();
      f.position.set(0, 0.7, 1.35); f.rotation.z = -a;
      f.add(mesh(new THREE.SphereGeometry(1, 18, 14), shiny(cols[i]), { y: 2.0, sx: 0.62, sy: 1.75, sz: 0.2 }));
      f.add(mesh(new THREE.SphereGeometry(1, 14, 10), shiny(0xfff0c8), { y: 2.75, z: -0.08, sx: 0.36, sy: 0.55, sz: 0.12, cast: false }));
      f.add(mesh(new THREE.SphereGeometry(1, 14, 10), shiny(0x5a2a14), { y: 2.85, z: -0.12, sx: 0.18, sy: 0.25, sz: 0.08, cast: false }));
      inner.add(f); parts.feathers.push(f);
    }
    headGroup = new THREE.Group(); headGroup.position.set(0, 1.45, -1.55); inner.add(headGroup);
    headGroup.userData.skinMat = inner.userData.skinMat;
    headGroup.add(mesh(new THREE.SphereGeometry(1.05, 28, 22), inner.userData.skinMat));
    headGroup.scale.setScalar(1.15);
    face = buildFace(headGroup, { x: 0.42, y: 0.25, z: -0.8, eye: 0.36, mouthY: -0.5, mouthW: 0.3 });
    headGroup.add(mesh(new THREE.ConeGeometry(0.22, 0.5, 14), shiny(0xf2b630), { y: -0.15, z: -1.18, rx: -Math.PI / 2 }));
    const snood = mesh(new THREE.CapsuleGeometry(0.12, 0.55, 6, 10), shiny(0xd9302a), { x: 0.15, y: -0.32, z: -1.05, rz: 0.2 });
    headGroup.add(snood); parts.snood = snood;
    for (const s of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(s * 1.75, 0.2, 0.1); inner.add(w);
      w.add(mesh(new THREE.SphereGeometry(1, 18, 14), shiny(0x6b3418), { x: s * 0.25, y: -0.4, sx: 0.38, sy: 1.0, sz: 0.85 }));
      w.add(mesh(new THREE.SphereGeometry(1, 14, 10), shiny(0xe8742c), { x: s * 0.3, y: -1.15, sx: 0.3, sy: 0.4, sz: 0.6 }));
      parts.wings.push(w);
    }
    for (const s of [-1, 1]) {
      const foot = new THREE.Group(); foot.position.set(s * 0.6, -1.85, -0.2); inner.add(foot);
      foot.add(mesh(new THREE.CapsuleGeometry(0.14, 0.55, 4, 8), shiny(0xf2a03a), { y: -0.35 }));
      for (const k2 of [-1, 0, 1]) foot.add(mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 6), shiny(0xf2a03a), { y: -0.75, z: -0.15, x: k2 * 0.12, rx: Math.PI / 2 - 0.3, rz: k2 * 0.4 }));
      parts.feet.push(foot);
    }
  } else if (key === 'pumpkin') {
    inner.userData.skinMat = shiny(0xf08a3c);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      inner.add(mesh(new THREE.SphereGeometry(1, 28, 20), shiny(i % 2 ? 0xe8742c : 0xf59a46), { x: Math.cos(a) * b.rx * 0.36, z: Math.sin(a) * b.rz * 0.36, sx: b.rx * 0.66, sy: b.ry * 0.97, sz: b.rz * 0.66 }));
    }
    stem = new THREE.Group(); stem.position.y = b.ry * 0.92; inner.add(stem);
    stem.add(mesh(new THREE.CylinderGeometry(0.22, 0.38, 0.9, 10), shiny(0x5a7a2a), { y: 0.35, rz: 0.25 }));
    stem.add(mesh(new THREE.TorusGeometry(0.35, 0.07, 6, 16, Math.PI * 1.6), shiny(0x6b8f3a), { x: -0.5, y: 0.5, rx: 0.3 }));
    for (const s of [-1, 1]) {
      const leaf = new THREE.Group(); leaf.position.set(s * 0.5, 0.15, 0); stem.add(leaf);
      leaf.add(mesh(new THREE.SphereGeometry(1, 14, 10), shiny(0x4f8a3a), { x: s * 0.45, sx: 0.65, sy: 0.08, sz: 0.38 }));
      parts.leaves.push(leaf);
    }
    face = buildFace(inner, { x: 0.78, y: 0.45, z: -b.rz * 0.93, eye: 0.42, mouthY: -0.5, mouthW: 0.55 });
    for (const s of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(s * b.rx * 0.95, -0.2, -0.3); inner.add(w);
      w.add(mesh(new THREE.CapsuleGeometry(0.12, 0.8, 4, 8), shiny(0x5a7a2a), { x: s * 0.4, y: -0.1, rz: s * 1.1 }));
      w.add(mesh(new THREE.SphereGeometry(1, 12, 8), shiny(0x4f8a3a), { x: s * 0.85, y: 0.15, sx: 0.4, sy: 0.12, sz: 0.3 }));
      parts.wings.push(w);
    }
    headGroup = inner;
  } else {
    inner.userData.skinMat = shiny(0xf7cf3c);
    inner.add(mesh(new THREE.CapsuleGeometry(b.rx * 0.9, b.ry * 1.0, 8, 22), inner.userData.skinMat));
    for (let r = 0; r < 9; r++) for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + (r % 2) * 0.32;
      const y = -1.7 + r * 0.42;
      if (Math.abs(Math.sin(a) + 1) < 0.5 && y > -0.6 && y < 1.4) continue;
      const rad = b.rx * 0.9 * Math.sqrt(Math.max(0.2, 1 - Math.pow(y / 2.6, 4)));
      inner.add(mesh(new THREE.SphereGeometry(0.17, 8, 6), shiny(0xffe066), { x: Math.cos(a) * rad, y, z: Math.sin(a) * rad, cast: false }));
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const leaf = mesh(new THREE.SphereGeometry(1, 14, 10), shiny(0x6fb04a), { x: Math.cos(a) * 0.95, y: -1.6, z: Math.sin(a) * 0.95, rx: Math.sin(a) * 0.5, rz: -Math.cos(a) * 0.5, sx: 0.55, sy: 1.7, sz: 0.25 });
      inner.add(leaf); parts.leaves.push(leaf);
    }
    face = buildFace(inner, { x: 0.45, y: 0.75, z: -b.rz * 0.92, eye: 0.3, mouthY: 0.05, mouthW: 0.32 });
    headGroup = inner;
  }
  // 皮肤（只改身体材质，不改五官）
  applySkin(inner, outfit.skin);
  // 装扮：按气球校准的位置和大小挂上
  const fit = outfitFit(key, b);
  const tag = (o) => { o.traverse((c) => { c.userData.outfit = true; }); return o; };
  if (outfit.hat && outfit.hat !== 'none') {
    const hat = tag(buildHat(outfit.hat));
    hat.position.set(fit.hat[0], fit.hat[1], fit.hat[2]); hat.scale.setScalar(fit.hat[3]); hat.rotation.x = -0.12;
    headGroup.add(hat);
    if (hat.userData.float) parts.floaters.push(hat);
    if (stem && outfit.hat !== 'halo') stem.visible = false;
  }
  if (outfit.glasses && outfit.glasses !== 'none') {
    const gl = tag(buildGlasses(outfit.glasses));
    gl.position.set(fit.glasses[0], fit.glasses[1], fit.glasses[2]); gl.scale.setScalar(fit.glasses[3]);
    headGroup.add(gl);
  }
  if (outfit.neck && outfit.neck !== 'none') {
    const nk = tag(buildNeck(outfit.neck, fit.neckR));
    nk.position.set(fit.neck[0], fit.neck[1], fit.neck[2]);
    headGroup.add(nk);
  }
  const anchors = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const o = new THREE.Object3D();
    o.position.set(Math.cos(a) * b.rx * 0.6, -b.ry * 0.85, Math.sin(a) * b.rz * 0.6);
    inner.add(o); anchors.push(o);
  }
  const shield = mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffa800, emissiveIntensity: 0.6, transparent: true, opacity: 0.28, depthWrite: false }), { sx: b.rx * 1.45, sy: b.ry * 1.55, sz: b.rz * 1.45, cast: false });
  shield.visible = false; g.add(shield);
  const magnet = mesh(new THREE.TorusGeometry(1, 0.08, 8, 48), new THREE.MeshBasicMaterial({ color: 0x5ac8ff, transparent: true, opacity: 0.8 }), { rx: Math.PI / 2, cast: false });
  magnet.visible = false; g.add(magnet);
  g.traverse((o) => { if (o.isMesh && o !== shield && o !== magnet && !o.userData.fx) o.castShadow = true; });
  const rainbowMats = [];
  inner.traverse((o) => { if (o.isMesh && o.material.userData?.rainbow) rainbowMats.push(o.geometry); });
  return { root: g, inner, anchors, face, parts, shield, magnet, key, mood: 'idle', moodT: 0, rainbowMats, trail: outfit.trail || 'none' };
}

export function animateBalloon(bal, t, dt) {
  bal.moodT = Math.max(0, bal.moodT - dt);
  if (bal.moodT <= 0 && bal.mood !== 'power') bal.mood = 'idle';
  const mood = bal.mood;
  const flap = mood === 'ouch' ? 1.6 : mood === 'joy' ? 1.2 : 0.5;
  bal.parts.wings.forEach((w, i) => { const s = i === 0 ? -1 : 1; w.rotation.z = s * (0.15 + Math.sin(t * (mood === 'idle' ? 3 : 9)) * 0.25 * flap); });
  bal.parts.feathers.forEach((f, i) => { f.rotation.x = Math.sin(t * 2 + i * 0.5) * 0.06; });
  bal.parts.feet.forEach((f, i) => { f.rotation.x = Math.sin(t * 4 + i * Math.PI) * 0.35; });
  bal.parts.leaves.forEach((l, i) => { l.rotation.z = Math.sin(t * 3 + i) * 0.25; });
  bal.parts.floaters.forEach((h) => { h.children.forEach((c) => { c.position.y = 0.75 + Math.sin(t * 2.5) * 0.08; }); h.rotation.y = t * 0.8; });
  if (bal.parts.snood) bal.parts.snood.rotation.z = 0.2 + Math.sin(t * 5) * 0.25;
  if (bal.rainbowMats.length && (bal.rbT = (bal.rbT || 0) + dt) > 0.07) { bal.rbT = 0; for (const g of bal.rainbowMats) rainbowPaint(g, t); }
  animateFace(bal.face, t, mood, dt * 30);
  const sq = 1 + Math.sin(t * 2.2) * 0.025;
  bal.inner.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
}
export function setBalloonMood(bal, mood, dur = 0.8) {
  if (!bal) return;
  if (bal.mood === 'ouch' && mood === 'joy' && bal.moodT > 0.3) return;
  bal.mood = mood; bal.moodT = dur;
}

// ---------- 拖尾粒子 ----------
const emojiTexCache = new Map();
function emojiTex(ch) {
  if (!emojiTexCache.has(ch)) {
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const x = c.getContext('2d'); x.font = '76px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 48, 54);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    emojiTexCache.set(ch, t);
  }
  return emojiTexCache.get(ch);
}
const trailGeo = new THREE.SphereGeometry(0.22, 10, 8);
trailGeo.userData.shared = true;
const confGeo = new THREE.PlaneGeometry(0.4, 0.24);
confGeo.userData.shared = true;
// 生成一个拖尾粒子（由 app 负责移动和回收）
export function trailParticle(kind, i) {
  let o;
  if (kind === 'sparkle') {
    o = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(i % 3 ? '✨' : '⭐'), transparent: true, depthWrite: false }));
    o.scale.setScalar(0.9 + Math.random() * 0.5);
  } else if (kind === 'hearts') {
    o = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(['💖', '💕', '💗'][i % 3]), transparent: true, depthWrite: false }));
    o.scale.setScalar(1.0 + Math.random() * 0.5);
  } else if (kind === 'confetti') {
    const cols = [0xd9481e, 0xf2b630, 0x4f8a3a, 0x2a7fd0, 0xff5a8a, 0x8a4ad9];
    o = new THREE.Mesh(confGeo, new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, transparent: true }));
    o.rotation.set(Math.random() * 6, Math.random() * 6, 0);
  } else {
    o = new THREE.Mesh(trailGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL((i * 0.07) % 1, 1.0, 0.52), transparent: true, opacity: 0.9, depthWrite: false }));
    o.scale.setScalar(1.6);
  }
  o.userData.fx = true;
  return o;
}

// 空中技能礼盒
export function buildGift(kind) {
  const g = new THREE.Group();
  const col = { shield: 0xf2b630, magnet: 0x2a9fd0, rally: 0xd9302a }[kind];
  g.add(mesh(new RoundedBoxGeometry(1.1, 1.1, 1.1, 3, 0.12), shiny(col, { emissive: col, emissiveIntensity: 0.25 })));
  g.add(mesh(new THREE.BoxGeometry(1.14, 1.14, 0.22), shiny(0xffffff)));
  g.add(mesh(new THREE.BoxGeometry(0.22, 1.14, 1.14), shiny(0xffffff)));
  for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(0.22, 0.07, 8, 16), shiny(0xffffff), { x: s * 0.2, y: 0.66, rz: s * 0.6 }));
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex({ shield: '🛡️', magnet: '🧲', rally: '📣' }[kind]), depthTest: false }));
  sp.position.y = 1.3; sp.scale.set(1.1, 1.1, 1);
  g.add(sp);
  g.add(mesh(new THREE.TorusGeometry(1.0, 0.06, 6, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7 }), { cast: false }));
  g.userData.spin = true;
  return g;
}
