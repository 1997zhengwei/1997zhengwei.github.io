// 道具：羽毛拾取、加减门、禽类剪刀、大厨
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/geometries/RoundedBoxGeometry.js';
import { buildFeather } from './turkey.mjs';
import { pumpkinGeometry, stemGeometry } from './scenery.mjs';
const HALF_W = 3.0;

function mesh(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}
const shiny = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.02, ...o });
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// ---------- 道具 ----------
export function buildPickup(color) {
  const g = new THREE.Group();
  const f = buildFeather(color);
  f.scale.set(0.9, 0.9, 1); f.position.y = 0.45;
  g.add(f);
  const ring = mesh(new THREE.RingGeometry(0.5, 0.62, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide }), { y: 0.08, rx: -Math.PI / 2, cast: false });
  g.add(ring);
  g.userData.spin = f;
  return g;
}

function gateTex(text, good) {
  return canvasTex(256, 192, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h);
    if (good) { gr.addColorStop(0, 'rgba(60,170,255,.85)'); gr.addColorStop(1, 'rgba(20,90,220,.85)'); }
    else { gr.addColorStop(0, 'rgba(255,90,80,.85)'); gr.addColorStop(1, 'rgba(200,30,40,.85)'); }
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10);
    x.font = '900 96px "Nunito","Microsoft YaHei",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#ffffff'; x.fillText(text, w / 2, h / 2 + 4);
  });
}
export function buildGate(it) {
  const g = new THREE.Group();
  const good = it.op === '+' || it.op === 'x';
  const label = { '+': '+', '-': '−', x: '×', '/': '÷' }[it.op] + it.v;
  const w = it.x1 - it.x0;
  g.position.set((it.x0 + it.x1) / 2, 0, -it.d);
  const panel = mesh(new THREE.PlaneGeometry(1, 2.0), new THREE.MeshBasicMaterial({ map: gateTex(label, good), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }), { y: 1.25, sx: w - 0.1, cast: false });
  g.add(panel);
  const posts = [];
  for (const s of [-1, 1]) { const p = mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.5, 8), shiny(it.slide ? 0xffd24a : 0xffffff), { x: s * (w / 2 - 0.05), y: 1.25 }); g.add(p); posts.push(p); }
  let rail = null;
  if (it.slide) {
    // 滑动门：顶上一条金色滑轨，提示“门会动”
    rail = mesh(new THREE.BoxGeometry(HALF_W * 2, 0.08, 0.1), shiny(0xffd24a, { metalness: 0.8, roughness: 0.25 }), { x: -g.position.x, y: 2.55, cast: false });
    g.add(rail);
  }
  g.userData.panel = panel; g.userData.posts = posts; g.userData.rail = rail;
  return g;
}
// 滑动门每帧更新宽度与位置
export function layoutGate(g, x0, x1) {
  const w = Math.max(0.3, x1 - x0);
  g.position.x = (x0 + x1) / 2;
  g.userData.panel.scale.x = w - 0.1;
  g.userData.posts[0].position.x = -(w / 2 - 0.05); g.userData.posts[1].position.x = w / 2 - 0.05;
  if (g.userData.rail) g.userData.rail.position.x = -g.position.x;
}

export function buildScissors() {
  const g = new THREE.Group();
  const rotor = new THREE.Group(); rotor.position.y = 0.9; g.add(rotor);
  const steel = shiny(0xd8dde4, { metalness: 0.9, roughness: 0.18 });
  for (const s of [-1, 1]) {
    const blade = new THREE.Group(); blade.rotation.z = s * 0.35; rotor.add(blade);
    blade.add(mesh(new THREE.BoxGeometry(1.6, 0.18, 0.06), steel, { x: 0.4 }));
    blade.add(mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 16), shiny(0xd6283a), { x: -0.55 }));
  }
  rotor.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12), shiny(0x333333, { metalness: 0.8 }), { rx: Math.PI / 2 }));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), shiny(0x666666), { y: 0.45 }));
  g.add(mesh(new THREE.RingGeometry(0.8, 0.95, 32), new THREE.MeshBasicMaterial({ color: 0xff3a3a, transparent: true, opacity: 0.5, side: THREE.DoubleSide }), { y: 0.08, rx: -Math.PI / 2, cast: false }));
  return { group: g, rotor };
}

export function buildChef() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  body.add(mesh(new THREE.CapsuleGeometry(0.42, 0.7, 6, 14), shiny(0xffffff, { roughness: 0.7 }), { y: 1.1 }));
  body.add(mesh(new THREE.SphereGeometry(0.34, 18, 14), shiny(0xf0c3a0), { y: 1.95 }));
  body.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.45, 18), shiny(0xffffff), { y: 2.35 }));
  body.add(mesh(new THREE.SphereGeometry(0.36, 16, 12), shiny(0xffffff), { y: 2.6 }));
  for (const s of [-1, 1]) body.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0x120a06 }), { x: s * 0.12, y: 2.0, z: 0.31 }));
  body.add(mesh(new THREE.CapsuleGeometry(0.05, 0.25, 4, 8), shiny(0x3a2216), { y: 1.86, z: 0.32, rz: Math.PI / 2 }));
  // 平底锅
  const pan = new THREE.Group(); pan.position.set(0.55, 1.5, 0.3); pan.rotation.z = -0.6; body.add(pan);
  pan.add(mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.1, 24), shiny(0x2a2a2a, { metalness: 0.7, roughness: 0.3 }), { rx: Math.PI / 2 - 0.3 }));
  pan.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), shiny(0x5a3420), { x: 0.5, y: -0.3, rz: 0.9 }));
  g.add(mesh(new THREE.RingGeometry(1.0, 1.15, 32), new THREE.MeshBasicMaterial({ color: 0xff3a3a, transparent: true, opacity: 0.45, side: THREE.DoubleSide }), { y: 0.08, rx: -Math.PI / 2, cast: false }));
  return { group: g, body, pan };
}

export const softTex = canvasTex(64, 64, (x, w, h) => {
  const gr = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
});


// ---------- 第 2 关起：滚动大南瓜 ----------
export function buildPumpkinRoller() {
  const g = new THREE.Group();
  const roll = new THREE.Group(); roll.position.y = 1.0; g.add(roll);
  const body = new THREE.Mesh(pumpkinGeometry(), new THREE.MeshPhysicalMaterial({ color: 0xe8742c, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15 }));
  body.scale.setScalar(2.6); body.position.y = -1.0; body.castShadow = true;
  roll.add(body);
  const st = new THREE.Mesh(stemGeometry(), shiny(0x5a6a2a, { roughness: 0.7 })); st.scale.setScalar(2.6); st.position.y = -1.0; roll.add(st);
  // 横跨跑道的红色虚线：提示南瓜会滚过这一排
  const dash = canvasTex(256, 16, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? 'rgba(255,60,60,0)' : 'rgba(255,60,60,.85)'; x.fillRect(i * 32, 0, 32, h); } });
  const line = mesh(new THREE.PlaneGeometry(HALF_W * 2, 0.22), new THREE.MeshBasicMaterial({ map: dash, transparent: true, depthWrite: false }), { y: 0.11, rx: -Math.PI / 2, cast: false });
  g.add(line);
  g.userData.line = line;
  return { group: g, roll };
}

// ---------- 第 4 关起：南瓜派（从人群里飞出来，落点有红圈预警） ----------
export function buildPie() {
  const g = new THREE.Group();
  const pie = new THREE.Group(); g.add(pie);
  pie.add(mesh(new THREE.CylinderGeometry(0.52, 0.42, 0.14, 32), shiny(0xc8ccd2, { metalness: 0.9, roughness: 0.25 }), { y: 0.07 }));
  pie.add(mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.05, 32), new THREE.MeshPhysicalMaterial({ color: 0xc8641e, roughness: 0.35, clearcoat: 0.7 }), { y: 0.15 }));
  const rim = new THREE.TorusGeometry(0.48, 0.06, 10, 36);
  { const p = rim.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)); const k = 1 + 0.18 * Math.max(0, Math.sin(a * 18)); p.setZ(i, p.getZ(i) * k); } rim.computeVertexNormals(); }
  pie.add(mesh(rim, new THREE.MeshPhysicalMaterial({ color: 0xe0a860, roughness: 0.5, clearcoat: 0.3 }), { y: 0.16, rx: Math.PI / 2 }));
  const cream = new THREE.MeshPhysicalMaterial({ color: 0xfffaf0, roughness: 0.35, clearcoat: 0.8 });
  for (let i = 0; i < 4; i++) pie.add(mesh(new THREE.SphereGeometry(0.15 - i * 0.03, 16, 12), cream, { y: 0.22 + i * 0.07, sy: 0.7 }));
  pie.add(mesh(new THREE.ConeGeometry(0.03, 0.08, 8), cream, { y: 0.48 }));
  const warn = mesh(new THREE.RingGeometry(0.7, 0.9, 40), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }), { y: 0.12, rx: -Math.PI / 2, cast: false });
  const warnFill = mesh(new THREE.CircleGeometry(0.7, 40), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }), { y: 0.115, rx: -Math.PI / 2, cast: false });
  g.add(warn, warnFill);
  const splat = mesh(new THREE.CircleGeometry(0.85, 20), new THREE.MeshStandardMaterial({ color: 0xd8742a, roughness: 0.5 }), { y: 0.11, rx: -Math.PI / 2, cast: false });
  splat.visible = false; g.add(splat);
  return { group: g, pie, warn, splat };
}

// ---------- 丰收角（Cornucopia）：一次给 6 根彩色羽毛 ----------
function wickerTex() {
  return canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#7a4a1e'; x.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      const up = (row + col) % 2 === 0;
      const gx = col * 32, gy = row * 32;
      const gr = up ? x.createLinearGradient(gx, gy, gx + 32, gy) : x.createLinearGradient(gx, gy, gx, gy + 32);
      gr.addColorStop(0, '#8a5424'); gr.addColorStop(0.5, '#e0a860'); gr.addColorStop(1, '#8a5424');
      x.fillStyle = gr; x.fillRect(gx + 2, gy + 2, 28, 28);
    }
  }, [6, 3]);
}
function hornGeometry() {
  const pts = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector3(Math.sin(t * 2.6) * 0.7 * (1 - t * 0.2), 0.4 + t * 0.5 - Math.cos(t * 2.6) * 0.25, -0.9 + t * 1.5)); }
  const curve = new THREE.CatmullRomCurve3(pts.reverse());
  const N = 40, M = 20;
  const fr = curve.computeFrenetFrames(N, false);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, c = curve.getPointAt(t), rad = 0.04 + 0.42 * Math.pow(t, 1.3);
    for (let j = 0; j <= M; j++) {
      const a = (j / M) * Math.PI * 2;
      const n = fr.normals[i].clone().multiplyScalar(Math.cos(a)).add(fr.binormals[i].clone().multiplyScalar(Math.sin(a)));
      const p = c.clone().addScaledVector(n, rad * (1 + 0.05 * Math.sin(a * 6)));
      pos.push(p.x, p.y, p.z); uv.push(j / M, t);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return { geo: g, mouth: curve.getPointAt(1) };
}
export function buildHorn() {
  const g = new THREE.Group();
  const spin = new THREE.Group(); spin.position.y = 0.2; g.add(spin);
  const { geo, mouth } = hornGeometry();
  spin.add(mesh(geo, new THREE.MeshStandardMaterial({ map: wickerTex(), roughness: 0.75, side: THREE.DoubleSide })));
  const fruit = new THREE.Group(); fruit.position.copy(mouth); spin.add(fruit);
  const gl = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 0.8 });
  fruit.add(mesh(new THREE.SphereGeometry(0.17, 18, 14), gl(0xc8102a), { x: -0.18, y: 0.05, z: 0.1 }));
  fruit.add(mesh(new THREE.SphereGeometry(0.15, 18, 14), gl(0x9ac02a), { x: 0.2, y: 0.02, z: 0.12 }));
  for (let i = 0; i < 9; i++) fruit.add(mesh(new THREE.SphereGeometry(0.06, 10, 8), gl(0x5a2a7a), { x: 0.05 + (i % 3) * 0.08, y: 0.2 - Math.floor(i / 3) * 0.07, z: 0.2 }));
  const pk = new THREE.Mesh(pumpkinGeometry(), gl(0xf08a2a)); pk.scale.setScalar(0.4); pk.position.set(-0.05, -0.12, 0.28); fruit.add(pk);
  fruit.add(mesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 10), gl(0xf2c23a), { x: 0.22, y: -0.1, z: 0.3, rx: 1.2, rz: 0.4 }));
  ['red', 'orange', 'gold', 'teal', 'purple', 'rainbow'].forEach((c, i) => { const f = buildFeather(c); f.scale.set(0.45, 0.6, 1); f.position.set(0, 0.1, -0.05); f.rotation.set(-0.3, 0, -0.9 + i * 0.36); fruit.add(f); });
  const ring = mesh(new THREE.RingGeometry(0.85, 1.05, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd24a).multiplyScalar(2.2), transparent: true, opacity: 0.75, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }), { y: 0.1, rx: -Math.PI / 2, cast: false });
  g.add(ring);
  g.userData.spin = spin;
  return g;
}
