// main.js —— 采耳小馆：一只真实感 3D 耳朵 + 5 种工具。没有计时、分数、关卡；采干净了换只耳朵。
import * as THREE from 'three';
import * as E from './ear-sdf.js';
import { makeRenderer, makeLights, skinTextures, skinMaterial, makeTowel, makeTissue } from './scene.js';
import { makePick, makeSwab, makeFeather, makeFork, makeFinger, makeScope, makeDropper, makeTowelPad, makePalm } from './tools.js';
import { Asmr } from './asmr-audio.js';
import { Soundscape, SCAPES } from './soundscapes.js';

const V3 = THREE.Vector3;
const $ = s => document.querySelector(s);
const DEV = new URLSearchParams(location.search).has('dev');
const SAVE_KEY = DEV ? 'ear-spa-dev-v1' : 'ear-spa-v1';
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; } }
const save = Object.assign({ ears: 0, muted: false, hints: {}, scapes: {} }, loadSave());
if (!save.scapes) save.scapes = {};
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* 无痕模式 */ } }

const audio = new Asmr();
audio.muted = !!save.muted;
const scapes = new Soundscape(audio, save, () => persist());
const buzz = ms => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch { /* */ } };

// —— 场景 ——
const canvas = $('#stage');
const { renderer, scene, camera } = makeRenderer(canvas);
const lights = makeLights(scene);
const shared = {
  uPress: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] },
  uTwitch: { value: 0 }, uTime: { value: 0 }, uFlip: { value: 1 },
  uBackDir: { value: new V3(0, 0, 1) }, uSSS: { value: 1.15 },
};
const tex = skinTextures();
const earMat = skinMaterial(tex, shared);
const headMat = skinMaterial(tex, shared);
headMat.polygonOffset = true; headMat.polygonOffsetFactor = 2; headMat.polygonOffsetUnits = 6;

const earGroup = new THREE.Group();
scene.add(earGroup);
makeTowel(earGroup);
const tissue = makeTissue(scene);
const tissueBits = new THREE.Group(); tissue.add(tissueBits);

let earMesh = null, headMesh = null, geo = null;
let flip = 1;                  // 1 = 左耳（原始模型），-1 = 镜像成右耳
const flakes = [];
let chunk = null;
let dirtIdx = [];              // 有耳垢的顶点
let vGrid = null;              // 顶点空间哈希
const TONES = [[1, 0.86, 0.8], [1.02, 0.84, 0.74], [0.96, 0.78, 0.68], [1.02, 0.88, 0.83]];

// —— 工具 ——
const tools = { pick: makePick(), scope: makeScope(), swab: makeSwab(), feather: makeFeather(), oil: makeDropper(), rub: makeFinger(), towel: makeTowelPad(), fork: makeFork(), cup: makePalm() };
for (const t of Object.values(tools)) { t.visible = false; scene.add(t); }
let toolName = 'pick';
const HINTS = {
  pick: '用耳勺在耳朵里轻轻刮，耳屑会翘起来',
  swab: '棉签转一转，把油油的耳垢擦干净',
  feather: '鹅毛伸进耳道里转一转～',
  fork: '点一下敲响音叉，慢慢靠近耳朵听',
  rub: '按住揉一揉会变暖，点一下是轻轻拍',
  scope: '可视耳勺：伸进耳道，右上角能看到里面',
  oil: '点一下滴精油，再用揉揉推开更顺滑',
  towel: '按住把热毛巾敷上去，暖烘烘的',
  cup: '按住捂住耳朵，听听里面的"海浪"',
};

// —— 粒子：细粉 / 闪光 ——
const DUST = 260;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(DUST * 3), dustCol = new Float32Array(DUST * 3);
const dust = Array.from({ length: DUST }, () => ({ life: 0, v: new V3(), p: new V3() }));
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
const dustTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,250,235,0.5)'); r.addColorStop(1, 'rgba(255,250,235,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.09, map: dustTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
dustPts.frustumCulled = false;
scene.add(dustPts);
let dustHead = 0;
function emitDust(p, n, count, color, speed = 0.6) {
  for (let i = 0; i < count; i++) {
    const d = dust[dustHead = (dustHead + 1) % DUST];
    d.life = 1.2 + Math.random() * 1.2; d.max = d.life;
    d.p.copy(p);
    d.v.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).multiplyScalar(speed).addScaledVector(n, speed * 0.8);
    d.c = color;
  }
}
function stepDust(dt) {
  for (let i = 0; i < DUST; i++) {
    const d = dust[i];
    if (d.life > 0) {
      d.life -= dt;
      d.v.multiplyScalar(Math.exp(-dt * 1.8)); d.v.y -= dt * 0.05;
      d.p.addScaledVector(d.v, dt);
      const a = clamp(d.life / d.max, 0, 1) * clamp((d.max - d.life) * 6, 0, 1);
      dustPos[i * 3] = d.p.x; dustPos[i * 3 + 1] = d.p.y; dustPos[i * 3 + 2] = d.p.z;
      dustCol[i * 3] = d.c[0] * a; dustCol[i * 3 + 1] = d.c[1] * a; dustCol[i * 3 + 2] = d.c[2] * a;
    } else { dustCol[i * 3] = dustCol[i * 3 + 1] = dustCol[i * 3 + 2] = 0; }
  }
  dustGeo.attributes.position.needsUpdate = true; dustGeo.attributes.color.needsUpdate = true;
}

// 音叉的声波圈
const ripples = [];
const rippleMat = new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
function spawnRipple(p) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 48), rippleMat.clone());
  m.position.copy(p); m.quaternion.copy(camera.quaternion); m.scale.setScalar(0.2);
  scene.add(m); ripples.push({ m, t: 0 });
}

// —— 构建耳朵 ——
function buildInWorker(params) {
  return new Promise(res => {
    try {
      const w = new Worker(new URL('./build-worker.js', import.meta.url), { type: 'module' });
      const to = setTimeout(() => { w.terminate(); res(null); }, 25000);
      w.onmessage = e => { clearTimeout(to); w.terminate(); res(e.data); };
      w.onerror = () => { clearTimeout(to); w.terminate(); res(null); };
      w.postMessage({ params });
    } catch { res(null); }
  });
}

function makeEarGeometry(data) {
  const g = new THREE.BufferGeometry();
  const n = data.positions.length / 3;
  g.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
  g.setIndex(new THREE.BufferAttribute(data.index, 1));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aThick', new THREE.BufferAttribute(data.thick, 1));
  g.setAttribute('aDirt', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aWarm', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aOil', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
  const free = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = data.positions[i * 3], y = data.positions[i * 3 + 1], z = data.positions[i * 3 + 2];
    free[i] = clamp((z - E.headZ(x, y) - 0.35) / 0.9, 0, 1);
  }
  g.setAttribute('aFree', new THREE.BufferAttribute(free, 1));
  g.userData = { ao: data.ao, depth: data.depth };
  g.computeBoundingSphere();
  return g;
}
function makeHeadGeometry(data) {
  const g = new THREE.BufferGeometry();
  const n = data.positions.length / 3;
  g.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
  g.setIndex(new THREE.BufferAttribute(data.index, 1));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  g.setAttribute('aThick', new THREE.BufferAttribute(new Float32Array(n).fill(3), 1));
  g.setAttribute('aDirt', new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('aWarm', new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('aOil', new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('aFree', new THREE.BufferAttribute(new Float32Array(n), 1));
  return g;
}

function paintSkin(tone) {
  const P = geo.attributes.position.array, C = geo.attributes.color.array, ao = geo.userData.ao, dep = geo.userData.depth;
  const n = P.length / 3;
  for (let i = 0; i < n; i++) {
    const x = P[i * 3], y = P[i * 3 + 1];
    let r = tone[0], g = tone[1], b = tone[2];
    // 耳甲腔、耳道越深越红
    const d = dep[i];
    if (d > -0.2) { const k = clamp((d + 0.2) / 1.6, 0, 1); r *= lerp(1, 0.92, k); g *= lerp(1, 0.56, k); b *= lerp(1, 0.55, k); }
    if (E.inConcha(x, y)) { g *= 0.96; b *= 0.95; }
    // 鼓膜：珍珠灰
    if (d > 1.45) { const k = clamp((d - 1.45) / 0.3, 0, 1); r = lerp(r, 0.82, k); g = lerp(g, 0.74, k); b = lerp(b, 0.74, k); }
    const a = 0.18 + 0.82 * Math.pow(ao[i], 1.4);
    C[i * 3] = r * a; C[i * 3 + 1] = g * a; C[i * 3 + 2] = b * a;
  }
  geo.attributes.color.needsUpdate = true;
  const hc = headMesh.geometry.attributes.color.array;
  for (let i = 0; i < hc.length; i += 3) { hc[i] = tone[0]; hc[i + 1] = tone[1]; hc[i + 2] = tone[2]; }
  headMesh.geometry.attributes.color.needsUpdate = true;
}

function buildGrid() {
  const P = geo.attributes.position.array, n = P.length / 3, cs = 0.3;
  const map = new Map();
  for (let i = 0; i < n; i++) {
    const k = `${Math.floor(P[i * 3] / cs)},${Math.floor(P[i * 3 + 1] / cs)},${Math.floor(P[i * 3 + 2] / cs)}`;
    let a = map.get(k); if (!a) map.set(k, a = []); a.push(i);
  }
  vGrid = { map, cs };
}
function near(p, r, fn) {
  const { map, cs } = vGrid, P = geo.attributes.position.array;
  const x0 = Math.floor((p.x - r) / cs), x1 = Math.floor((p.x + r) / cs), y0 = Math.floor((p.y - r) / cs), y1 = Math.floor((p.y + r) / cs), z0 = Math.floor((p.z - r) / cs), z1 = Math.floor((p.z + r) / cs);
  const r2 = r * r;
  for (let a = x0; a <= x1; a++) for (let b = y0; b <= y1; b++) for (let c = z0; c <= z1; c++) {
    const arr = map.get(`${a},${b},${c}`); if (!arr) continue;
    for (const i of arr) {
      const dx = P[i * 3] - p.x, dy = P[i * 3 + 1] - p.y, dz = P[i * 3 + 2] - p.z, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < r2) fn(i, Math.sqrt(d2) / r);
    }
  }
}

// —— 耳屑 ——
let seedN = 1;
function rngOf(seed) { let s = seed >>> 0; return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; }; }
const flakeMats = [
  // 干爽的米白皮屑为主，少量淡金色，不要深褐色
  new THREE.MeshPhysicalMaterial({ color: 0xf4ead6, roughness: 0.8, sheen: 0.9, sheenColor: new THREE.Color(0xffffff) }),
  new THREE.MeshPhysicalMaterial({ color: 0xefdcb4, roughness: 0.7, sheen: 0.8, sheenColor: new THREE.Color(0xfff8e8) }),
  new THREE.MeshPhysicalMaterial({ color: 0xf7f0e2, roughness: 0.85, sheen: 1, sheenColor: new THREE.Color(0xffffff) }),
  new THREE.MeshPhysicalMaterial({ color: 0xe6c88e, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.6, sheenColor: new THREE.Color(0xfff3d6) }),
];
function flakeGeo(size, rng) {
  const sh = new THREE.Shape(), n = 6 + Math.floor(rng() * 4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rng() - 0.5) * 0.5, r = size * (0.55 + rng() * 0.55);
    const x = Math.cos(a) * r, y = Math.sin(a) * r * (0.6 + rng() * 0.35);
    i ? sh.lineTo(x, y) : sh.moveTo(x, y);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.01 + size * 0.05, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.01, bevelSegments: 1, curveSegments: 1 });
  const p = g.attributes.position;
  const curl = 1.2 + rng() * 2;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) + (x * x + y * y) * curl); }
  g.computeVertexNormals();
  return g;
}
function chunkGeo(rng) {
  const g = new THREE.IcosahedronGeometry(0.21, 3);
  const p = g.attributes.position, v = new V3();
  const o = [rng() * 10, rng() * 10, rng() * 10];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + Math.sin(v.x * 23 + o[0]) * Math.sin(v.y * 19 + o[1]) * Math.sin(v.z * 21 + o[2]) * 0.16 + (rng() - 0.5) * 0.06;
    v.multiplyScalar(k); p.setXYZ(i, v.x * 1.05, v.y * 0.85, v.z * 1.25);
  }
  g.computeVertexNormals();
  return g;
}
const Z = new V3(0, 0, 1);
function addFlake(pt, size, mat, rng, kind = 'flake') {
  const root = new THREE.Group();
  const n = new V3(...pt.n);
  root.position.set(...pt.p).addScaledVector(n, 0.004);
  root.quaternion.setFromUnitVectors(Z, n);
  root.rotateZ(rng() * Math.PI * 2);
  const hinge = new THREE.Group(); hinge.position.set(-size * 0.5, 0, 0); root.add(hinge);
  const mesh = new THREE.Mesh(kind === 'chunk' ? chunkGeo(rng) : flakeGeo(size, rng), mat);
  mesh.position.set(size * 0.5, 0, kind === 'chunk' ? 0.12 : 0);
  mesh.castShadow = true; mesh.receiveShadow = true;
  hinge.add(mesh);
  earGroup.add(root);
  const f = { root, hinge, mesh, p: new V3(...pt.p), n, size, hp: 1, state: 'stuck', wob: 0, kind, depth: pt.depth, tilt: 0 };
  return f;
}
function clearWax(clearTissue) {
  // 已经落到纸巾上（或正在飞过去）的耳屑留着，同一位客人两只耳朵的都放在一张纸巾上
  const drop = f => { f.root.removeFromParent(); if (f.state === 'stuck' || f.state === 'carried' || f.state === 'gone') { f.mesh.removeFromParent(); f.mesh.geometry.dispose(); } };
  for (const f of flakes) drop(f);
  flakes.length = 0;
  if (chunk) { drop(chunk); chunk = null; }
  if (clearTissue) {
    flying.length = 0;
    for (const c of [...tissueBits.children]) { c.removeFromParent(); c.geometry && c.geometry.dispose(); }
  }
  for (const t of Object.values(tools)) if (t.userData.slot) for (const c of [...t.userData.slot.children]) c.removeFromParent();
}
// 每只耳朵单独记住采到哪一步，换回来时原样恢复
let earStates = { L: null, R: null };
const sideOf = () => (flip === 1 ? 'L' : 'R');
function saveEarState() {
  if (!geo) return;
  earStates[sideOf()] = {
    flakes: flakes.map(f => (f.state === 'stuck' ? f.hp : -1)),
    chunk: chunk ? (chunk.state === 'stuck' ? chunk.hp : -1) : null,
    dirt: geo.attributes.aDirt.array.slice(), oil: geo.attributes.aOil.array.slice(), warm: geo.attributes.aWarm.array.slice(),
    done, swab: swabDirt,
  };
}
function restoreEarState(st) {
  const gone = f => { f.state = 'gone'; f.root.visible = false; };
  flakes.forEach((f, i) => { const v = st.flakes[i]; if (v === undefined) return; if (v < 0) gone(f); else f.hp = v; });
  if (chunk && st.chunk !== null) { if (st.chunk < 0) gone(chunk); else chunk.hp = st.chunk; }
  geo.attributes.aDirt.array.set(st.dirt); geo.attributes.aOil.array.set(st.oil); geo.attributes.aWarm.array.set(st.warm);
  geo.attributes.aDirt.needsUpdate = geo.attributes.aOil.needsUpdate = geo.attributes.aWarm.needsUpdate = true;
  done = st.done;
}
function seedWax(clearTissue = false) {
  clearWax(clearTissue);
  const rng = rngOf(9001 + seedN * 7919 + (flip === 1 ? 0 : 4999));
  // 每位客人干净程度不一样：有的只有几片
  const amount = 0.55 + rng() * 0.6;
  const pts = E.surfacePoints(rng, Math.round(8 * amount), 'concha');
  for (const pt of pts) flakes.push(addFlake(pt, 0.06 + rng() * 0.1, flakeMats[Math.floor(rng() * 3)], rng));
  const cps = E.surfacePoints(rng, Math.round(11 * amount), 'canal').sort((a, b) => a.depth - b.depth);
  // 最深的一处放大块耳垢，其余是耳道壁上的小片
  let deep = cps.filter(c => c.depth > 0.75 && c.depth < 1.25);
  const big = deep.length ? deep[Math.floor(deep.length / 2)] : cps[cps.length - 1];
  for (const pt of cps) if (pt !== big && Math.hypot(pt.p[0] - big.p[0], pt.p[1] - big.p[1], pt.p[2] - big.p[2]) > 0.35) flakes.push(addFlake(pt, 0.05 + rng() * 0.08, flakeMats[Math.floor(rng() * 4)], rng));
  if (big) { chunk = addFlake(big, 0.17, flakeMats[3], rng, 'chunk'); chunk.hp = 1; chunk.mesh.scale.setScalar(0.85); }
  // 耳垢油膜
  const P = geo.attributes.position.array, D = geo.attributes.aDirt.array, dep = geo.userData.depth;
  dirtIdx = [];
  for (let i = 0; i < D.length; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    let v = 0;
    if (dep[i] > 0.1 && dep[i] < 1.5) v = (0.3 + 0.25 * Math.sin(x * 9 + seedN) * Math.sin(y * 7 - seedN)) * amount;
    else if (E.inConcha(x, y) && z < E.headZ(x, y) - 0.05) v = 0.28 * amount * clamp(Math.sin(x * 6 + seedN * 2) * Math.sin(y * 5) - 0.1, 0, 1);
    D[i] = clamp(v, 0, 0.7);
    if (D[i] > 0.05) dirtIdx.push(i);
  }
  geo.attributes.aDirt.needsUpdate = true;
  const W = geo.attributes.aWarm.array; W.fill(0); geo.attributes.aWarm.needsUpdate = true;
  geo.attributes.aOil.array.fill(0); geo.attributes.aOil.needsUpdate = true;
  asleep = false; wish = null; wishT = 12; hideWish(); moodSaid = {};
  tools.swab.userData.cottonMat.color.setRGB(1, 1, 1); swabDirt = 0;
  done = false; doneT = 0;
  $('#flip-btn').classList.remove('glow');
}

// —— 镜头 ——
const cam = { yaw: 0, pitch: 0, zoom: 1, yawT: 0, pitchT: 0, zoomT: 1, focus: 0, focusT: 0, base: 22 };
const EAR_C = new V3(0.3, -0.55, 0.2);
function canalOpenLocal() { return new V3(...E.canalPoint(0.45)); }
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  cam.base = Math.max(10.6 / (2 * tanH), 6.4 / (2 * tanH * camera.aspect));
}
window.addEventListener('resize', resize);
const camTarget = new V3();
function placeCamera(dt) {
  const k = 1 - Math.exp(-dt * 5), kf = 1 - Math.exp(-dt * 2.6);
  cam.yaw = lerp(cam.yaw, cam.yawT, k); cam.pitch = lerp(cam.pitch, cam.pitchT, k); cam.zoom = lerp(cam.zoom, cam.zoomT, k);
  cam.focus = lerp(cam.focus, cam.focusT, kf);
  const c = EAR_C.clone(); c.x *= flip;
  const o = canalOpenLocal(); o.x *= flip;
  camTarget.copy(c).lerp(o, cam.focus * 0.85);
  const D = E.CANAL.d;
  const yaw = cam.yaw + cam.focus * -D[0] * flip * 0.9, pitch = cam.pitch + cam.focus * D[1] * -0.6;
  const dist = cam.base * cam.zoom * lerp(1, 0.52, cam.focus);
  camera.position.set(camTarget.x + Math.sin(yaw) * Math.cos(pitch) * dist, camTarget.y + Math.sin(pitch) * dist, camTarget.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  camera.lookAt(camTarget);
  // 采耳灯跟着"师傅的头"走：镜头左上方
  const right = new V3().setFromMatrixColumn(camera.matrixWorld, 0), up = new V3().setFromMatrixColumn(camera.matrixWorld, 1);
  lights.lamp.position.copy(camera.position).addScaledVector(right, -3.2 * flip).addScaledVector(up, 3.6);
  lights.lamp.target.position.copy(camTarget).add(new V3(0, 0, -0.6));
  const bd = new V3(0.35 * flip, 0.55, -0.75).normalize().transformDirection(camera.matrixWorldInverse);
  shared.uBackDir.value.copy(bd);
}

// —— 指针 ——
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pointers = new Map();
let contact = null;            // { id, sx, sy, touch }
let hover = null;
let gesture = null;            // 双指 / 右键：转视角+缩放
function screenRay(sx, sy) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((sx - r.left) / r.width) * 2 - 1, -((sy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.ray;
}
// 屏幕坐标 → 耳朵表面（局部坐标的点+法线）
function hitAt(sx, sy) {
  const rr = screenRay(sx, sy);
  const o = earGroup.worldToLocal(rr.origin.clone());
  const d = rr.direction.clone(); d.x *= flip;
  const h = E.trace([o.x, o.y, o.z], [d.x, d.y, d.z], 80);
  if (h) return { p: new V3(...h.p), n: new V3(...h.n) };
  // 头皮外圈：解析面
  let t = (E.headZ(o.x, o.y) - o.z) / d.z;
  for (let i = 0; i < 4; i++) { const px = o.x + d.x * t, py = o.y + d.y * t; t = (E.headZ(px, py) - o.z) / d.z; }
  const p = o.clone().addScaledVector(d, t);
  return { p, n: new V3(0, 0, 1) };
}
function localToWorldP(p) { return earGroup.localToWorld(p.clone()); }
function localToWorldN(n) { return new V3(n.x * flip, n.y, n.z).normalize(); }

canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  if (!started) return;
  closeSheets();
  if (sleep.on) wakeTouch();
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size >= 2 || e.button === 2) {
    endContact();
    const pts = [...pointers.values()];
    gesture = { mouse: e.button === 2, cx: avg(pts, 'x'), cy: avg(pts, 'y'), dist: spread(pts), yaw: cam.yawT, pitch: cam.pitchT, zoom: cam.zoomT };
    return;
  }
  if (gesture) return;
  contact = { id: e.pointerId, sx: e.clientX, sy: e.clientY, touch: e.pointerType !== 'mouse', t0: performance.now(), moved: 0 };
  onContactStart();
});
canvas.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (gesture) {
    const pts = [...pointers.values()];
    if (!pts.length) return;
    const cx = avg(pts, 'x'), cy = avg(pts, 'y');
    cam.yawT = clamp(gesture.yaw - (cx - gesture.cx) * 0.006, -0.75, 0.75);
    cam.pitchT = clamp(gesture.pitch + (cy - gesture.cy) * 0.005, -0.55, 0.6);
    if (pts.length >= 2 && gesture.dist > 10) cam.zoomT = clamp(gesture.zoom * gesture.dist / spread(pts), 0.45, 1.35);
    return;
  }
  if (contact && contact.id === e.pointerId) { contact.moved += Math.hypot(e.clientX - contact.sx, e.clientY - contact.sy); contact.sx = e.clientX; contact.sy = e.clientY; }
  else if (e.pointerType === 'mouse' && !contact) hover = { sx: e.clientX, sy: e.clientY };
});
const endPtr = e => {
  pointers.delete(e.pointerId);
  if (gesture && pointers.size === 0) gesture = null;
  if (contact && contact.id === e.pointerId) endContact();
};
canvas.addEventListener('pointerup', endPtr);
canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover = null; });
canvas.addEventListener('wheel', e => { e.preventDefault(); cam.zoomT = clamp(cam.zoomT * Math.exp(e.deltaY * 0.0012), 0.45, 1.35); }, { passive: false });
function avg(pts, k) { return pts.reduce((s, p) => s + p[k], 0) / pts.length; }
function spread(pts) { return pts.length < 2 ? 0 : Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y); }

// —— 工具状态 ——
const tip = { p: new V3(), n: new V3(0, 0, 1), prev: new V3(), speed: 0, depth: -1, active: false, has: false };
let swabDirt = 0, tickle = 0, rubT = 0, ring = 0, ringT = 0, forkHold = 0;
const press = { v: 0, vel: 0, target: 0, p: new V3() };
let lastGrainT = 0, done = false, doneT = 0, focusHold = 0, zzT = 0;
let dripT = 0, towelT = 0, cupT = 0, holdT = 0, patN = 0;
let relax = 0.08, asleep = false, breathT = 0;
let wish = null, wishT = 14, wishProg = 0;
const drops = [], spreads = [];

function onContactStart() {
  audio.init();
  const t = tools[toolName];
  hideHint(toolName);
  if (toolName === 'fork') { ring = 1; audio.forkStrike(); buzz(12); spawnRipple(t.position.clone()); }
  if (toolName === 'oil') dripT = 0;
  if (toolName === 'towel') { towelT = 0; audio.flop(); buzz(15); }
  if (toolName === 'cup') { cupT = 0; buzz(10); }
  holdT = 0;
  tip.has = false;
}
function endContact() {
  if (!contact) return;
  const c = contact;
  contact = null;
  const dur = (performance.now() - c.t0) / 1000;
  // 揉揉：轻点一下 = 拍一拍
  if (toolName === 'rub' && dur < 0.25 && c.moved < 14 && geo) {
    audio.thump(); buzz(12);
    press.vel += 14; shared.uTwitch.value = Math.max(shared.uTwitch.value, 0.35);
    addRelax(0.02); patN++;
    if (patN % 4 === 0) floater(['啪嗒', '嘿嘿', '轻轻的～'][Math.floor(Math.random() * 3)], tip.p);
  }
  if (toolName === 'towel' && dur > 0.4) {
    emitDust(tools.towel.position.clone(), new V3(0, 1, 0.4), 26, [1, 1, 1], 1.4);
    floater(['好暖～', '热乎乎的', '呼——'][Math.floor(Math.random() * 3)], tip.p);
  }
  if (toolName === 'cup' && dur > 0.4) { audio.release(); floater(['嗡——好安静', '像在海边', '耳朵松开了'][Math.floor(Math.random() * 3)], new V3(0.3, 1.5, 1.2)); }
  tip.active = false;
  audio.allLoopsOff();
  press.target = 0;
  flushCarried();
}

function setTool(name, quiet = false) {
  if (!tools[name]) return;
  if (contact) endContact();
  toolName = name;
  for (const [k, t] of Object.entries(tools)) t.visible = false;
  document.querySelectorAll('.tool').forEach(b => b.classList.toggle('on', b.dataset.tool === name));
  audio.init();
  if (!quiet) { audio.click(); showHint(name); }
}
document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));

// 把勺子/棉签上的耳屑放到纸巾上
const flying = [];
function flushCarried() {
  const carried = flakes.filter(f => f.state === 'carried');
  if (chunk && chunk.state === 'carried') carried.push(chunk);
  carried.forEach((f, i) => {
    const from = new V3(); f.mesh.getWorldPosition(from);
    scene.attach(f.mesh);
    const to = tissue.localToWorld(new V3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.3, 0.06));
    f.state = 'flying';
    flying.push({ f, from, to, t: -i * 0.06, dur: 0.5 + Math.random() * 0.15, spin: new V3(Math.random(), Math.random(), Math.random()) });
  });
}
function stepFlying(dt) {
  for (let i = flying.length - 1; i >= 0; i--) {
    const fl = flying[i];
    fl.t += dt;
    const k = clamp(fl.t / fl.dur, 0, 1), e = 1 - Math.pow(1 - k, 2.2);
    const p = fl.from.clone().lerp(fl.to, e); p.z += Math.sin(k * Math.PI) * 1.4;
    fl.f.mesh.position.copy(p);
    fl.f.mesh.rotation.x += fl.spin.x * dt * 6; fl.f.mesh.rotation.y += fl.spin.y * dt * 6;
    if (k >= 1) {
      tissueBits.attach(fl.f.mesh);
      fl.f.mesh.position.z = 0.03 + Math.random() * 0.02;
      fl.f.state = 'tissue';
      audio.land();
      flying.splice(i, 1);
    }
  }
}

function detach(f, tool) {
  f.state = 'carried';
  const slot = tool.userData.slot;
  slot.attach(f.mesh);
  f.home = new V3((Math.random() - 0.5) * 0.12, Math.random() * 0.1, (Math.random() - 0.2) * 0.06);
  if (f.kind === 'chunk') {
    audio.bigPop(); buzz([30, 40, 60]);
    floater('啵！', f.p, true);
    shake = 0.5;
    emitDust(localToWorldP(f.p), localToWorldN(f.n), 26, [1, 0.85, 0.5], 1.2);
  } else {
    audio.pop(clamp(f.size * 4, 0, 1)); buzz(8 + Math.round(f.size * 60));
    emitDust(localToWorldP(f.p), localToWorldN(f.n), 4 + Math.round(f.size * 20), [1, 0.92, 0.7]);
    if (f.size > 0.16 && Math.random() < 0.6) floater(['唰～', '咔嚓', '下来啦'][Math.floor(Math.random() * 3)], f.p);
  }
}

let shake = 0, cupShade = 0, chunkAim = false;
const cupShadeEl = $('#cup-shade');
const scopeLight = new THREE.PointLight(0xfff0d8, 0, 2.6, 2);
scene.add(scopeLight);
const scopeCam = new THREE.PerspectiveCamera(78, 1, 0.02, 30);
// 精油滴
const dropGeo = new THREE.SphereGeometry(0.06, 14, 10);
const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xf2bb52, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85, emissive: 0x7a4300, emissiveIntensity: 0.25 });
function spawnDrop(tool, pLocal, nLocal) {
  const m = new THREE.Mesh(dropGeo, dropMat);
  m.position.copy(tool.position);
  scene.add(m);
  drops.push({ m, from: tool.position.clone(), to: localToWorldP(pLocal.clone().addScaledVector(nLocal, 0.03)), p: pLocal, t: 0 });
  tools.oil.userData.bulb.scale.y = 0.65;
}
function stepDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]; d.t += dt;
    const k = clamp(d.t / 0.2, 0, 1);
    d.m.position.lerpVectors(d.from, d.to, k * k);
    d.m.scale.set(1 - k * 0.2, 1 + k * 0.6, 1 - k * 0.2);
    if (k >= 1) {
      d.m.removeFromParent(); drops.splice(i, 1);
      audio.drip(); buzz(6);
      spreads.push({ p: d.p.clone(), t: 0 });
      addRelax(0.025);
      if (wish === 'oil') wishProg += 0.7;
      if (Math.random() < 0.35) floater(['凉凉的～', '香香的', '滴答'][Math.floor(Math.random() * 3)], d.p);
    }
  }
  if (!spreads.length || !geo) return;
  const O = geo.attributes.aOil.array;
  for (let i = spreads.length - 1; i >= 0; i--) {
    const sp = spreads[i]; sp.t += dt;
    const r = 0.15 + Math.min(sp.t, 0.8) * 0.55;
    near(sp.p, r, (j, d) => { O[j] = Math.min(1, O[j] + dt * 2.2 * (1 - d)); });
    if (sp.t > 0.8) spreads.splice(i, 1);
  }
  geo.attributes.aOil.needsUpdate = true;
}
function stepTool(dt, now) {
  const t = tools[toolName];
  const ud = t.userData;
  let target = null, nW = null, depth = -1;
  const pointer = contact || hover;
  if (pointer && !gesture) {
    const off = contact && contact.touch && toolName !== 'rub' ? 30 : 0;
    const h = hitAt(pointer.sx, pointer.sy - off);
    if (h && (toolName === 'pick' || toolName === 'scope') && chunk && chunk.state === 'stuck') {
      // 指着深处那一大块时，射线会穿过它打到后面的耳道壁：只要射线从它旁边经过，就吸附到它身上
      const cw = new V3(); chunk.mesh.getWorldPosition(cw);
      if (ray.ray.distanceToPoint(cw) < 0.42) {
        const off = h.p.clone().sub(chunk.p);
        if (off.length() > 0.16) off.setLength(0.16);
        h.p = chunk.p.clone().add(off); h.n = chunk.n.clone();
        chunkAim = true;
      } else chunkAim = false;
    } else chunkAim = false;
    if (h) {
      depth = E.canalDepth(h.p.x, h.p.y, h.p.z);
      tip.p.copy(h.p); tip.n.copy(h.n);
      const lift = toolName === 'fork' ? 1.0 + (contact ? 0 : 0.3) : toolName === 'oil' ? 0.95 : contact ? (toolName === 'rub' ? -0.08 * press.v : 0.015) : 0.45;
      const pl = h.p.clone().addScaledVector(h.n, lift);
      target = localToWorldP(pl); nW = localToWorldN(h.n);
    }
  }
  if (!pointer && toolName === 'fork' && ring > 0.06 && t.visible) { target = t.position.clone(); nW = t.userData.lastN || new V3(0, 0, 1); }
  t.visible = (!!target || (!pointer && started)) && toolName !== 'cup';
  // 手柄方向：从右上方伸过来；伸进耳道时顺着耳道
  const right = new V3().setFromMatrixColumn(camera.matrixWorld, 0), up = new V3().setFromMatrixColumn(camera.matrixWorld, 1);
  const toCam = camera.position.clone().sub(camTarget).normalize();
  if (!target) {
    // 休息位：在耳朵右上方轻轻晃
    const c = localToWorldP(EAR_C);
    target = c.clone().addScaledVector(right, 2.1).addScaledVector(up, 2.2 + Math.sin(now * 1.3) * 0.08).addScaledVector(toCam, 2.6);
    nW = toCam.clone();
  }
  let hd = nW.clone().multiplyScalar(toolName === 'rub' ? 0.9 : 0.42).addScaledVector(toCam, 0.5).addScaledVector(right, 0.5).addScaledVector(up, 0.75);
  if (toolName === 'fork') hd = toCam.clone().multiplyScalar(0.3).addScaledVector(up, 1).addScaledVector(right, 0.25);
  if (toolName === 'oil') hd = toCam.clone().multiplyScalar(0.25).addScaledVector(up, 1).addScaledVector(right, 0.15);
  if (depth > -0.1 && (toolName === 'pick' || toolName === 'scope' || toolName === 'swab' || toolName === 'feather')) {
    const ax = new V3(-E.CANAL.d[0] * flip, -E.CANAL.d[1], -E.CANAL.d[2]).normalize();
    hd.normalize().lerp(ax, clamp((depth + 0.1) * 1.4, 0, 0.88));
  }
  hd.normalize();
  // 工具的 X 轴尽量对齐屏幕右方，Z 朝镜头（音叉两根齿并排、手指甲朝外、勺口朝外）
  const ax = right.clone().addScaledVector(hd, -right.dot(hd)).normalize();
  const az = new V3().crossVectors(ax, hd).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(ax, hd, az));
  let k = 1 - Math.exp(-dt * (contact ? 40 : 14));
  // 热毛巾 / 捂耳：整块盖在耳朵上，面朝耳朵
  if (toolName === 'towel' || toolName === 'cup') {
    const big = toolName === 'cup';
    if (contact) {
      const c = EAR_C.clone(); c.lerp(tip.p, big ? 0.15 : 0.45);
      const a = big ? (cupT = Math.min(cupT + dt * 3.2, 1)) : (towelT = Math.min(towelT + dt * 4, 1));
      const ease = 1 - Math.pow(1 - a, 3);
      const hz = E.headZ(c.x, c.y);
      const z = big ? lerp(hz + 7, hz + 2.4, ease) : lerp(hz + 4.8, hz + 2.05, ease);
      target = localToWorldP(new V3(c.x, c.y, z));
      t.scale.setScalar(1);
      k = 1 - Math.exp(-dt * 18);
    } else t.scale.setScalar(big ? 0.32 : 0.4);
    const zf = toCam.clone();
    const xf = right.clone().addScaledVector(zf, -right.dot(zf)).normalize();
    const yf = new V3().crossVectors(zf, xf).normalize();
    q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xf, yf, zf));
    if (big) q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.25 * flip)));
  } else t.scale.setScalar(1);
  if (!tip.has) { t.position.copy(target); t.quaternion.copy(q); tip.has = true; }
  t.position.lerp(target, k); t.quaternion.slerp(q, k);
  ud.lastN = nW;

  // 速度（局部坐标 cm/s）
  if (contact) {
    if (!tip.active) { tip.prev.copy(tip.p); tip.active = true; tip.speed = 0; }
    const sp = tip.p.distanceTo(tip.prev) / Math.max(dt, 1e-3);
    tip.speed = lerp(tip.speed, Math.min(sp, 30), 1 - Math.exp(-dt * 14));
    tip.prev.copy(tip.p);
  } else tip.speed = lerp(tip.speed, 0, 0.2);
  tip.depth = depth;
  const inCanal = contact ? clamp(depth / 1.3, 0, 1) : 0;
  audio.setDepth(toolName === 'fork' || toolName === 'oil' ? 0 : toolName === 'cup' ? (contact ? 0.8 * cupT : 0) : toolName === 'towel' ? (contact ? 0.35 : 0) : inCanal);
  if (contact && depth > 0.12 && (toolName === 'pick' || toolName === 'scope' || toolName === 'swab' || toolName === 'feather')) focusHold = 1.4;
  if (contact) holdT += dt;
  focusHold -= dt;
  cam.focusT = focusHold > 0 ? 1 : 0;

  const sp = tip.speed, moving = sp > 0.3;
  if (toolName === 'pick' || toolName === 'scope') {
    if (contact) {
      let scraped = 0;
      for (const f of flakes) {
        if (f.state !== 'stuck') continue;
        const d = f.p.distanceTo(tip.p), R = 0.17 + f.size * 0.75;
        if (d < R && moving) {
          f.hp -= dt * Math.min(sp, 9) * 0.85 / (0.45 + f.size * 3.5);
          f.wob = 1; scraped = Math.max(scraped, 1 - d / R);
          if (f.hp <= 0) { detach(f, t); addRelax(0.015); }
        }
      }
      if (chunk && chunk.state === 'stuck') {
        const d = chunk.p.distanceTo(tip.p);
        if (d < 0.5 && (moving || chunkAim)) {
          // 来回刮约 2 秒就会松动；刮得越快越快
          const before = chunk.hp;
          chunk.hp -= dt * (0.22 + Math.min(sp, 8) * 0.07);
          chunk.wob = 1; scraped = 1;
          if (Math.random() < dt * 8) audio.creak(1 - chunk.hp);
          if (Math.random() < dt * 10) { audio.crackle(3, 0.5 + (1 - chunk.hp) * 0.6); buzz(5); }
          if (before > 0.5 && chunk.hp <= 0.5) floater('松动了～', chunk.p);
          if (chunk.hp <= 0) { detach(chunk, t); addRelax(0.08); }
        }
      }
      const lvl = moving ? clamp(sp / 7, 0.1, 1) * (0.45 + scraped * 0.55) : 0;
      audio.loop('scrape', lvl * 0.5, 0.03, 2600 + Math.random() * 1600 - inCanal * 1200);
      // 颗粒感：速度越快越密
      if (moving && now - lastGrainT > 1 / (6 + sp * (4 + scraped * 14))) { audio.grain(0.2 + scraped * 0.8); lastGrainT = now; if (scraped && Math.random() < 0.3) buzz(4); }
      if (moving && Math.random() < dt * sp * 1.5) emitDust(localToWorldP(tip.p), localToWorldN(tip.n), 1, [1, 0.95, 0.82], 0.3);
      if (moving) addRelax(dt * 0.012);
    }
  } else if (toolName === 'swab') {
    ud.bud.rotation.y += dt * (2 + sp * 3);
    if (contact) {
      let removed = 0;
      const D = geo.attributes.aDirt.array;
      const amt = dt * (0.5 + Math.min(sp, 8) * 0.5);
      near(tip.p, 0.36, (i, d) => { if (D[i] > 0) { const r = Math.min(D[i], amt * (1 - d)); D[i] -= r; removed += r; } });
      const O = geo.attributes.aOil.array;
      near(tip.p, 0.36, (i, d) => { if (O[i] > 0) O[i] = Math.max(0, O[i] - amt * 0.6 * (1 - d)); });
      geo.attributes.aOil.needsUpdate = true;
      if (moving) addRelax(dt * 0.015);
      if (removed > 0) { geo.attributes.aDirt.needsUpdate = true; swabDirt = Math.min(swabDirt + removed * 0.004, 0.9); ud.cottonMat.color.setRGB(1 - swabDirt * 0.12, 1 - swabDirt * 0.25, 1 - swabDirt * 0.6); }
      for (const f of flakes) {
        if (f.state === 'stuck' && f.size < 0.12 && moving && f.p.distanceTo(tip.p) < 0.22) { f.hp -= dt * 2.5; f.wob = 1; if (f.hp <= 0) detach(f, t); }
      }
      audio.loop('cotton', clamp(0.25 + sp / 5, 0, 1) * 0.85, 0.05);
      audio.loop('cottonHi', clamp(sp / 8, 0, 0.6) * 0.25 * (1 - inCanal * 0.6), 0.05);
      if (moving && Math.random() < dt * 10) audio.grain(0.08);
    }
  } else if (toolName === 'feather') {
    ud.puff.rotation.y += dt * (contact ? 7 + sp * 2 : 1.5);
    const s = contact ? 0.82 : 1.04; ud.puff.scale.lerp(new V3(s * 1.1, s, s * 1.1), 0.2);
    if (contact) {
      audio.loop('feather', clamp(0.3 + sp / 5, 0, 1) * 0.36, 0.06);
      if (moving && Math.random() < dt * (4 + sp)) emitDust(localToWorldP(tip.p), localToWorldN(tip.n), 1, [1, 1, 1], 0.5);
      if (depth > -0.05) tickle += dt * (0.5 + Math.min(sp, 6) * 0.3);
      addRelax(dt * 0.02);
      if (tickle > 2.3) {
        tickle = 0; shared.uTwitch.value = 1;
        audio.giggle(); buzz([10, 30, 10]);
        floater(['好痒～', '嘻嘻', '嘶～舒服', '痒痒痒'][Math.floor(Math.random() * 4)], tip.p);
      }
    }
  } else if (toolName === 'fork') {
    const ti = ud.tines;
    ring *= Math.exp(-dt / 2.4);
    ti.forEach((m, i) => { m.position.x = (i ? 1 : -1) * (0.27 + Math.sin(now * 160) * 0.012 * ring); });
    const tipW = t.position.clone();
    const o = localToWorldP(canalOpenLocal());
    const close = 1 - clamp((tipW.distanceTo(o) - 0.9) / 5.5, 0, 1);
    audio.forkNear(close * Math.min(1, ring * 3));
    ringT -= dt;
    if (ring > 0.12 && ringT <= 0) { ringT = 0.32; spawnRipple(tipW); }
    if (ring > 0.1) addRelax(dt * 0.025 * close);
    if (ring > 0.3 && close > 0.6 && wish === 'fork') wishProg += dt;
    if (ring > 0.3 && close > 0.6 && Math.random() < dt * 0.8) floater(['嗡～', '好清脆', '脑袋酥酥的'][Math.floor(Math.random() * 3)], tip.p);
  } else if (toolName === 'rub') {
    if (contact) {
      press.target = 1; press.p.copy(tip.p);
      const W = geo.attributes.aWarm.array;
      const O = geo.attributes.aOil.array;
      let oil = 0, on = 0;
      near(tip.p, 0.8, (i, d) => {
        const o = O[i];
        W[i] = Math.min(1, W[i] + dt * 0.3 * (1 - d) * (0.4 + Math.min(sp, 6) * 0.15) * (1 + o));
        if (d < 0.5) { oil += o; on++; }
        // 推开精油
        if (o > 0.05 && moving && d > 0.3) O[i] = Math.min(1, o + dt * 0.4);
      });
      oil = on ? oil / on : 0;
      geo.attributes.aWarm.needsUpdate = true; geo.attributes.aOil.needsUpdate = true;
      const lv = clamp(sp / 6, 0.05, 1) * 0.55;
      audio.loop('rub', lv * (1 - oil * 0.8), 0.04, 900 + Math.min(sp, 8) * 120);
      audio.loop('slick', lv * oil * 0.9, 0.04, 2000 + Math.min(sp, 8) * 160);
      addRelax(dt * (0.02 + oil * 0.02));
      rubT += dt * (moving ? 1 : 0.3);
      if (rubT > 3.5) { rubT = 0; floater(['好舒服～', '暖暖的', '呼——'][Math.floor(Math.random() * 3)], tip.p); }
    }
  }
  if (toolName === 'scope') {
    // LED 照亮耳道
    scopeLight.intensity = t.visible ? (contact ? 1.6 : 0.8) : 0;
    scopeLight.position.copy(t.localToWorld(new V3(0, 0.25, 0.05)));
  } else scopeLight.intensity = 0;
  if (toolName === 'oil') {
    ud.bulb.scale.y = lerp(ud.bulb.scale.y, contact ? 0.78 : 1, 0.3);
    if (contact) {
      dripT -= dt;
      if (dripT <= 0) { dripT = 0.55; spawnDrop(t, tip.p.clone(), tip.n.clone()); }
    }
  }
  if (toolName === 'towel' && contact) {
    const W = geo.attributes.aWarm.array;
    near(tip.p, 1.9, (i, d) => { W[i] = Math.min(1, W[i] + dt * 0.28 * (1 - d) * towelT); });
    geo.attributes.aWarm.needsUpdate = true;
    audio.loop('towel', (0.35 + clamp(sp / 6, 0, 0.6)) * towelT, 0.08);
    audio.loop('steam', 0.12 * towelT, 0.3);
    if (Math.random() < dt * 14) {
      const e = new V3((Math.random() - 0.5) * 3.6, (Math.random() - 0.5) * 4.4, 0.3).applyQuaternion(t.quaternion).add(t.position);
      emitDust(e, new V3(0, 0.6, 0.8).normalize(), 1, [1, 1, 1], 0.7);
    }
    addRelax(dt * 0.035 * towelT);
  }
  if (toolName === 'cup' && contact) {
    audio.loop('ocean', 0.85 * cupT, 0.25);
    audio.loop('towel', clamp(sp / 8, 0, 0.5) * 0.4, 0.06);
    addRelax(dt * 0.03 * cupT);
  }
  cupShade = lerp(cupShade, toolName === 'cup' && contact ? cupT * 0.86 : 0, 0.12);
  cupShadeEl.style.opacity = cupShade.toFixed(3);
  if (contact && wish === toolName && toolName !== 'fork' && toolName !== 'oil') wishProg += dt * (toolName === 'towel' || toolName === 'cup' ? 1 : moving ? 1 : 0.3);
  // 按压弹簧（松手会 Q 弹一下）
  press.vel += ((press.target * (contact && toolName === 'rub' ? 1 : 0)) - press.v) * 140 * dt;
  press.vel *= Math.exp(-dt * 9);
  press.v += press.vel * dt;
  shared.uPress.value[0].set(press.p.x, press.p.y, press.p.z, press.v * 0.9);
  shared.uTwitch.value *= Math.exp(-dt * 5);
}

function stepWax(dt, now) {
  for (const f of flakes) {
    if (f.state !== 'stuck') continue;
    const lift = (1 - f.hp) * 0.85;
    f.tilt = lerp(f.tilt, lift, 0.25);
    f.wob *= Math.exp(-dt * 6);
    f.hinge.rotation.y = -f.tilt - Math.sin(now * 40) * 0.08 * f.wob;
  }
  if (chunk && chunk.state === 'stuck') {
    chunk.wob *= Math.exp(-dt * 5);
    const l = 1 - chunk.hp;
    chunk.hinge.rotation.y = -l * 0.35 - Math.sin(now * 30) * 0.05 * chunk.wob;
    chunk.mesh.scale.set(1 - l * 0.1, 1 + Math.sin(now * 33) * 0.03 * chunk.wob, 1 + l * 0.2);
  }
  // 勺子上的耳屑收拢
  for (const f of flakes) if (f.state === 'carried' && f.home) f.mesh.position.lerp(f.home, 0.25);
  if (chunk && chunk.state === 'carried' && chunk.home) chunk.mesh.position.lerp(chunk.home, 0.25);
}

// 慢慢降温
let warmTick = 0;
function stepWarm(dt) {
  warmTick += dt;
  if (warmTick < 0.25) return;
  const W = geo.attributes.aWarm.array, k = Math.exp(-warmTick * 0.04);
  for (let i = 0; i < W.length; i++) if (W[i] > 0) W[i] = W[i] * k - 0.0004;
  geo.attributes.aWarm.needsUpdate = true;
  const O = geo.attributes.aOil.array, ko = Math.exp(-warmTick * 0.015);
  for (let i = 0; i < O.length; i++) if (O[i] > 0) O[i] = O[i] * ko - 0.0002;
  geo.attributes.aOil.needsUpdate = true;
  warmTick = 0;
}

let checkT = 0;
function stepDone(dt) {
  checkT += dt;
  if (checkT < 0.5) return;
  checkT = 0;
  if (done) {
    zzT += 0.5;
    if (zzT > 2.2 && asleep) { zzT = 0; floater('zZ', new V3(1.2, 2.6, 1.5)); }
    return;
  }
  const left = flakes.filter(f => f.state === 'stuck').length + (chunk && chunk.state === 'stuck' ? 1 : 0);
  const D = geo.attributes.aDirt.array;
  let s = 0; for (const i of dirtIdx) s += D[i];
  const dirt = dirtIdx.length ? s / dirtIdx.length : 0;
  if (DEV) window.__spa.stats = { left, dirt };
  if (left === 0 && dirt < 0.1) {
    done = true; zzT = 0;
    save.ears += 1; persist();
    earsDone[flip === 1 ? 'L' : 'R'] = true;
    audio.chime(); buzz([20, 60, 20]);
    if (earsDone.L && earsDone.R) bothEarsDone();
    else { toast('这只耳朵干干净净～', '换另一只耳朵吧'); $('#flip-btn').classList.add('glow'); }
    emitDust(localToWorldP(new V3(0.2, 0, 0.8)), new V3(0, 0, 1), 40, [1, 0.95, 0.7], 2.2);
  }
}

// —— 客人表情 / 心愿 ——
const FACES = {
  tense: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#ffd9c2" stroke="#c98b6e" stroke-width="1.5"/><circle cx="11.5" cy="15" r="1.6" fill="#4a3426"/><circle cx="20.5" cy="15" r="1.6" fill="#4a3426"/><path d="M12.5 21.5 Q16 22.6 19.5 21.5" fill="none" stroke="#6b4a38" stroke-width="1.8" stroke-linecap="round"/></svg>',
  calm: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#ffd9c2" stroke="#c98b6e" stroke-width="1.5"/><circle cx="11.5" cy="14.5" r="1.6" fill="#4a3426"/><circle cx="20.5" cy="14.5" r="1.6" fill="#4a3426"/><path d="M11.5 20 Q16 23.5 20.5 20" fill="none" stroke="#6b4a38" stroke-width="1.8" stroke-linecap="round"/><circle cx="8.5" cy="19" r="2" fill="#ffb3a0" opacity=".6"/><circle cx="23.5" cy="19" r="2" fill="#ffb3a0" opacity=".6"/></svg>',
  bliss: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#ffd2bb" stroke="#c98b6e" stroke-width="1.5"/><path d="M9 15 Q11.5 12.5 14 15 M18 15 Q20.5 12.5 23 15" fill="none" stroke="#4a3426" stroke-width="1.8" stroke-linecap="round"/><path d="M11 20 Q16 25 21 20" fill="none" stroke="#6b4a38" stroke-width="1.8" stroke-linecap="round"/><circle cx="8.5" cy="19.5" r="2.3" fill="#ff9f8a" opacity=".7"/><circle cx="23.5" cy="19.5" r="2.3" fill="#ff9f8a" opacity=".7"/></svg>',
  sleep: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#ffd2bb" stroke="#c98b6e" stroke-width="1.5"/><path d="M9 15 Q11.5 17 14 15 M18 15 Q20.5 17 23 15" fill="none" stroke="#4a3426" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="16" cy="21.5" rx="2" ry="1.5" fill="#6b4a38"/><text x="23" y="9" font-size="8" fill="#6b8fd8" font-family="sans-serif">z</text></svg>',
};
const MOOD_TEXT = { tense: '刚躺下', calm: '放松了', bliss: '好舒服', sleep: '睡着了' };
let moodNow = '';
let moodSaid = {};
const MOOD_LINE = { calm: '呼…放松下来了', bliss: '好舒服～', sleep: 'zZ…' };
function addRelax(v) { relax = clamp(relax + v, 0, 1); }
function stepMood(dt) {
  relax = clamp(relax - dt * 0.004, 0, 1);
  const m = relax > 0.92 ? 'sleep' : relax > 0.62 ? 'bliss' : relax > 0.3 ? 'calm' : 'tense';
  if (m !== moodNow) {
    const el = $('#face');
    el.innerHTML = FACES[m]; el.title = MOOD_TEXT[m];
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    $('#mood-label').textContent = MOOD_TEXT[m];
    if (started && moodNow && !moodSaid[m] && m !== 'tense') { moodSaid[m] = 1; floater(MOOD_LINE[m], new V3(0.2, 2.3, 1.5)); }
    if (m === 'sleep' && !asleep) { asleep = true; floater('zZ', new V3(1.2, 2.6, 1.5), true); }
    if (m !== 'sleep') asleep = false;
    moodNow = m;
  }
  $('#relax-fill').style.width = `${(relax * 100).toFixed(1)}%`;
  if (asleep) { breathT -= dt; if (breathT <= 0) { breathT = 4.2; audio.breathe(); } }
}
const TOOL_LABEL = { pick: '耳勺', scope: '可视耳勺', swab: '棉签', feather: '鹅毛', oil: '精油', rub: '揉揉', towel: '热毛巾', fork: '音叉', cup: '捂耳朵' };
const lastUsed = {};
function stepWish(dt) {
  if (contact) lastUsed[toolName] = performance.now();
  if (wish) {
    if (wishProg >= 1.3) {
      wish = null; wishProg = 0; wishT = 22 + Math.random() * 16;
      hideWish();
      addRelax(0.18); audio.heart(); buzz([10, 40, 10]);
      floater('❤', tip.p.lengthSq() ? tip.p : EAR_C, true);
      floater('就是这个～', new V3(0.4, 2.2, 1.4));
    }
    return;
  }
  if (done || !started) return;
  wishT -= dt;
  if (wishT > 0) return;
  const now = performance.now();
  const opts = Object.keys(TOOL_LABEL).filter(k => k !== toolName && !(now - (lastUsed[k] || 0) < 12000) && k !== 'pick');
  if (!opts.length) { wishT = 6; return; }
  wish = opts[Math.floor(Math.random() * opts.length)]; wishProg = 0;
  const el = $('#wish');
  el.innerHTML = `试试 <i class="ti ti-${wish}"></i> ${TOOL_LABEL[wish]}～`;
  el.dataset.tool = wish;
  el.classList.add('show');
}
function hideWish() { const el = $('#wish'); el.classList.remove('show'); }
$('#wish').addEventListener('click', () => { const t = $('#wish').dataset.tool; if (t) setTool(t); });

// —— 换只耳朵 ——
let flipping = false;
async function flipEar() {
  if (flipping || !geo) return;
  flipping = true;
  if (contact) endContact();
  audio.init(); audio.click();
  const fade = $('#start');
  cam.yawT = flip * 0.9;
  await wait(260);
  fade.classList.remove('hide'); fade.querySelector('.start-card').style.visibility = 'hidden';
  await wait(420);
  saveEarState();
  flip = -flip;
  earGroup.scale.x = flip;
  shared.uFlip.value = flip;
  audio.setSide(flip === 1 ? -1 : 1);
  seedWax();
  if (earStates[sideOf()]) restoreEarState(earStates[sideOf()]);
  cam.yawT = -flip * 0.9; cam.yaw = cam.yawT;
  updateLabel();
  fade.classList.add('hide');
  await wait(60);
  cam.yawT = 0;
  await wait(600);
  fade.querySelector('.start-card').style.visibility = '';
  flipping = false;
}
$('#flip-btn').addEventListener('click', flipEar);
function updateLabel() {
  $('#guest-label').textContent = `${flip === 1 ? '左耳' : '右耳'} · 放松度`;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

// —— UI ——
const floatersEl = $('#floaters');
function floater(text, pLocal, big = false) {
  const w = localToWorldP(pLocal).project(camera);
  const el = document.createElement('div');
  el.className = 'floater' + (big ? ' big' : '');
  el.textContent = text;
  el.style.left = `${(w.x * 0.5 + 0.5) * 100}%`; el.style.top = `${(-w.y * 0.5 + 0.5) * 100 - 6}%`;
  floatersEl.appendChild(el);
  setTimeout(() => el.remove(), 1700);
}
let toastTimer = 0;
function toast(a, b) {
  const el = $('#toast'); el.innerHTML = `${a}${b ? `<small>${b}</small>` : ''}`;
  el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}
let hintTimer = 0;
function showHint(name) {
  if (save.hints[name] >= 2) return;
  const el = $('#hint'); el.textContent = HINTS[name]; el.classList.add('show');
  clearTimeout(hintTimer); hintTimer = setTimeout(() => el.classList.remove('show'), 4200);
}
function hideHint(name) {
  const el = $('#hint');
  if (el.classList.contains('show')) { save.hints[name] = (save.hints[name] || 0) + 1; persist(); }
  el.classList.remove('show');
}
// —— 音源面板 ——
const sheetSound = $('#sheet-sound'), sheetSleep = $('#sheet-sleep');
function openSheet(el) { audio.init(); for (const x of [sheetSound, sheetSleep]) x.classList.toggle('show', x === el); }
function closeSheets() { sheetSound.classList.remove('show'); sheetSleep.classList.remove('show'); }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeSheets));
function renderScapes() {
  const grid = $('#scape-grid'); grid.innerHTML = '';
  for (const sc of SCAPES) {
    const on = scapes.isOn(sc.id);
    const d = document.createElement('div');
    d.className = 'scape' + (on ? ' on' : '');
    d.innerHTML = `<button type="button"><span class="em">${sc.emoji}</span>${sc.name}<span class="st">${on ? '播放中' : ''}</span></button><input type="range" min="0" max="1" step="0.01" value="${scapes.volume(sc.id)}">`;
    d.querySelector('button').addEventListener('click', () => { save.scapesTouched = true; scapes.toggle(sc.id); renderScapes(); });
    d.querySelector('input').addEventListener('input', e => { if (!scapes.isOn(sc.id)) { save.scapesTouched = true; scapes.toggle(sc.id, true); renderScapes(); } scapes.setVolume(sc.id, +e.target.value); });
    grid.appendChild(d);
  }
  $('#sound-dot').classList.toggle('on', scapes.activeCount() > 0);
}
$('#sound-btn').addEventListener('click', () => { renderScapes(); openSheet(sheetSound); });
$('#scape-off').addEventListener('click', () => { save.scapesTouched = true; for (const sc of SCAPES) scapes.toggle(sc.id, false); renderScapes(); });
const toolSound = $('#tool-sound');
toolSound.checked = !audio.muted;
toolSound.addEventListener('change', () => { audio.init(); audio.setMuted(!toolSound.checked); save.muted = !toolSound.checked; persist(); });

let started = false;
let earsDone = { L: false, R: false };
let curParams = null;
const SKIN = [1.0, 0.85, 0.78];

// 生成耳朵网格（在 worker 里）
async function loadEar(params) {
  const key = JSON.stringify(params);
  if (key === curParams && geo) return;
  E.setParams(params);
  let data = await buildInWorker(params);
  if (!data) { await wait(30); data = { ear: E.buildEar(), head: E.buildHead() }; }
  else E.setField(data.field);
  if (earMesh) { earMesh.removeFromParent(); earMesh.geometry.dispose(); }
  if (headMesh) { headMesh.removeFromParent(); headMesh.geometry.dispose(); }
  geo = makeEarGeometry(data.ear);
  earMesh = new THREE.Mesh(geo, earMat); earMesh.castShadow = true; earMesh.receiveShadow = true;
  headMesh = new THREE.Mesh(makeHeadGeometry(data.head), headMat); headMesh.receiveShadow = true;
  earGroup.add(earMesh, headMesh);
  buildGrid();
  curParams = key;
}

// 只有"你"一个人：点一下开始，躺下听
function startSession() {
  if (started || !geo) return;
  audio.init(); audio.click();
  scapes.restore();
  $('#start').classList.add('hide');
  $('#app').classList.remove('picking');
  started = true;
  setTool('pick');
}
function bothEarsDone() {
  addRelax(0.3);
  toast('两只耳朵都清爽啦～', '开着音源，慢慢睡吧 🌙');
}
$('#start-btn').addEventListener('click', startSession);

// —— 睡眠模式：背景音一直铺着，采耳声随机穿插 + 变暗 + 定时淡出 ——
// 组合 = 背景音源（临时音量）+ 会出现的道具。'mine' 用你自己开着的音源。
const MIXES = [
  { id: 'rain', emoji: '🌧️', name: '雨夜采耳', desc: '雨声 · 心跳 · 耳勺 · 棉签', scapes: { rain: 0.62, heart: 0.5, music: 0.3 }, tools: ['pick', 'swab', 'scope', 'rub', 'towel'] },
  { id: 'forest', emoji: '🌲', name: '森林按摩', desc: '森林 · 溪流 · 揉揉 · 热毛巾', scapes: { forest: 0.6, stream: 0.45 }, tools: ['rub', 'towel', 'swab', 'oil', 'fork'] },
  { id: 'ocean', emoji: '🌊', name: '海边 SPA', desc: '海浪 · 颂钵 · 捂耳朵 · 精油', scapes: { ocean: 0.6, bowl: 0.42 }, tools: ['cup', 'oil', 'rub', 'towel', 'fork'] },
  { id: 'fire', emoji: '🔥', name: '炉边掏耳', desc: '篝火 · 心跳 · 耳勺 · 可视耳勺', scapes: { fire: 0.55, heart: 0.45, fan: 0.25 }, tools: ['pick', 'scope', 'swab', 'rub'] },
  { id: 'pure', emoji: '👂', name: '只听啵啵', desc: '耳边啵啵 · 白噪音 · 棉签', scapes: { pops: 0.6, fan: 0.35 }, tools: ['swab', 'rub', 'cup'] },
  { id: 'mine', emoji: '✨', name: '我的组合', desc: '用你在 ♪ 里开着的音源', scapes: null, tools: ['pick', 'swab', 'rub', 'towel', 'scope', 'cup', 'fork', 'oil'] },
];
// 每种道具在睡眠里的一段：动作路径、时长范围
const SEG = {
  pick: { path: 'conchaScrape', dur: [16, 26] },
  scope: { path: 'canalScrape', dur: [16, 24] },
  swab: { path: 'canalCircle', dur: [16, 26] },
  rub: { path: 'helixKnead', dur: [16, 26] },
  towel: { path: 'hold', dur: [12, 18] },
  cup: { path: 'hold', dur: [10, 16] },
  fork: { path: 'forkFloat', dur: [12, 18] },
  oil: { path: 'helixDrip', dur: [4, 6] },
  feather: { path: 'canalCircle', dur: [8, 12] },
};
const sleep = { on: false, min: save.sleepMin ?? 30, endAt: 0, auto: save.autoOn !== false, mix: save.sleepMix || 'rain', idleT: 0, pauseT: 0, ended: false, prevScapes: [] };
const app = $('#app'), night = $('#night');
function renderSleep() {
  document.querySelectorAll('#sleep-timer button').forEach(b => b.classList.toggle('on', +b.dataset.min === sleep.min));
  $('#auto-on').checked = sleep.auto;
  const grid = $('#mix-grid'); grid.innerHTML = '';
  for (const m of MIXES) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mix' + (m.id === sleep.mix ? ' on' : '');
    b.innerHTML = `<b>${m.emoji} ${m.name}</b><small>${m.desc}</small>`;
    b.addEventListener('click', () => { sleep.mix = m.id; save.sleepMix = m.id; persist(); renderSleep(); });
    grid.appendChild(b);
  }
}
document.querySelectorAll('#sleep-timer button').forEach(b => b.addEventListener('click', () => { sleep.min = +b.dataset.min; save.sleepMin = sleep.min; persist(); renderSleep(); }));
$('#auto-on').addEventListener('change', e => { sleep.auto = e.target.checked; save.autoOn = sleep.auto; persist(); });
$('#sleep-btn').addEventListener('click', () => { if (sleep.on) { stopSleep(); return; } renderSleep(); openSheet(sheetSleep); });
$('#sleep-go').addEventListener('click', startSleep);
$('#sleep-pill').addEventListener('click', stopSleep);
night.addEventListener('click', () => { if (sleep.ended) stopSleep(); });
const curMix = () => MIXES.find(m => m.id === sleep.mix) || MIXES[0];
function startSleep() {
  closeSheets();
  audio.init();
  const mix = curMix();
  if (mix.scapes) sleep.prevScapes = scapes.applyMix(mix.scapes);
  else { sleep.prevScapes = null; if (!scapes.activeCount()) { scapes.toggle('music', true); scapes.toggle('rain', true); } }
  sleep.on = true; sleep.ended = false; sleep.idleT = 0; sleep.pauseT = 0;
  sleep.endAt = sleep.min ? performance.now() + sleep.min * 60000 : 0;
  app.classList.add('sleeping');
  night.style.opacity = '0.55';
  audio.setFade(1, 0.5);
  audio.setSoft(true);
  if (contact) endContact();
  if (sleep.auto) autoStart();
  toast(`${mix.emoji} ${mix.name}`, '晚安～ 点屏幕上方可以退出');
}
function stopSleep() {
  sleep.on = false; sleep.ended = false;
  autoStop();
  if (sleep.prevScapes) { scapes.restoreSet(sleep.prevScapes); sleep.prevScapes = null; }
  app.classList.remove('sleeping', 'idle');
  night.style.opacity = '0'; night.classList.remove('end');
  audio.setFade(1, 0.4);
  audio.setSoft(false);
}
function wakeTouch() {
  // 自己动手时自动采耳让位，12 秒没碰再接着来
  if (auto.on) autoPause();
  sleep.idleT = 0; sleep.pauseT = 12;
  app.classList.remove('idle');
  night.style.opacity = '0.25';
}
function stepSleep(dt) {
  if (!sleep.on) return;
  sleep.idleT += dt;
  if (sleep.idleT > 5) app.classList.add('idle');
  if (sleep.pauseT > 0) { sleep.pauseT -= dt; if (sleep.pauseT <= 0 && sleep.auto && !sleep.ended) { autoStart(); night.style.opacity = '0.55'; } }
  if (sleep.idleT > 8 && !sleep.ended) night.style.opacity = String(Math.min(0.82, 0.55 + (sleep.idleT - 8) / 300));
  let left = 0;
  if (sleep.endAt) {
    left = Math.max(0, sleep.endAt - performance.now()) / 1000;
    if (left < 90 && !sleep.ended) audio.setFade(Math.max(0, left / 90), 1);
    if (left <= 0 && !sleep.ended) {
      sleep.ended = true; autoStop();
      night.style.opacity = '1'; night.classList.add('end');
      $('#night-text').innerHTML = '晚安 🌙<small>点一下回来</small>';
    }
  }
  const m = Math.floor(left / 60), sec = Math.floor(left % 60);
  $('#sleep-pill').textContent = sleep.ended ? '🌙 已经淡出' : `🌙 ${curMix().name} · ${sleep.endAt ? `${m}:${String(sec).padStart(2, '0')} 后淡出` : '睡眠中'} · 点这里退出`;
}

// 自动采耳：从组合的道具里随机挑一段，慢慢做；段与段之间留几秒只有背景音
const auto = { on: false, seg: null, t: 0, dur: 0, gap: 0, strikeT: 0, last: '', segs: 0, chain: null };
const SLOW = 0.55;   // 睡眠里动作放慢，声音也就更轻
function autoPoint(path, t) {
  const cp = (k) => new V3(...E.canalPoint(k));
  switch (path) {
    case 'canalCircle': { const c = cp(0.55 + 0.22 * Math.sin(t * 0.35)); const a = t * 2.1; return c.add(new V3(Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0)); }
    case 'canalScrape': { const c = cp(0.75 + 0.25 * Math.sin(t * 0.3)); return c.add(new V3(Math.sin(t * 3.4) * 0.12, Math.cos(t * 1.7) * 0.06, 0)); }
    case 'conchaScrape': { const x = -0.2 + Math.sin(t * 0.21) * 0.35 + Math.sin(t * 3.1) * 0.22, y = -0.35 + Math.cos(t * 0.17) * 0.55; return new V3(x, y, E.headZ(x, y) - 0.15); }
    case 'helixKnead': { const u = 0.5 + 0.5 * Math.sin(t * 0.16); const x = 1.55 + 0.35 * Math.sin(u * 2.4) + Math.cos(t * 2.4) * 0.14, y = 2.2 - u * 2.6 + Math.sin(t * 2.4) * 0.14; return new V3(x, y, 1.3); }
    case 'forkFloat': { const c = cp(0.3); return c.add(new V3(Math.cos(t * 0.4) * 0.9, Math.sin(t * 0.33) * 0.7, 0)); }
    case 'helixDrip': return new V3(1.45, 1.1 - t * 0.12, 1.3);
    default: return EAR_C.clone();
  }
}
function projectLocal(p) {
  const w = localToWorldP(p).project(camera), r = canvas.getBoundingClientRect();
  return { x: r.left + (w.x * 0.5 + 0.5) * r.width, y: r.top + (-w.y * 0.5 + 0.5) * r.height };
}
function autoStart() { if (!started) return; auto.on = true; auto.seg = null; auto.gap = 2.5; }
function autoPause() { auto.on = false; if (contact && contact.id === 'auto') endContact(); }
function autoStop() { autoPause(); }
function autoPress() {
  const sp = projectLocal(autoPoint(SEG[auto.seg].path, auto.t * SLOW));
  contact = { id: 'auto', sx: sp.x, sy: sp.y, touch: false, t0: performance.now(), moved: 0 };
  onContactStart();
}
function nextSeg() {
  if (auto.chain) { const c = auto.chain; auto.chain = null; return c; }
  const list = curMix().tools.filter(t => t !== auto.last);
  return list[Math.floor(Math.random() * list.length)] || 'rub';
}
function stepAuto(dt) {
  if (!auto.on || flipping) return;
  if (!auto.seg) {
    auto.gap -= dt;
    if (auto.gap > 0) return;
    const name = nextSeg();
    auto.seg = name; auto.t = 0; auto.strikeT = 0;
    const [a, b] = SEG[name].dur; auto.dur = a + Math.random() * (b - a);
    if (name === 'oil') auto.chain = 'rub';     // 滴完精油接着揉开
    setTool(name, true);
    autoPress();
    return;
  }
  auto.t += dt;
  if (contact && contact.id === 'auto') {
    const sp = projectLocal(autoPoint(SEG[auto.seg].path, auto.t * SLOW));
    contact.sx = sp.x; contact.sy = sp.y;
  }
  if (auto.seg === 'fork') {
    auto.strikeT += dt;
    if (auto.strikeT > 6.5) { auto.strikeT = 0; endContact(); autoPress(); }
  }
  if (auto.t >= auto.dur) {
    if (contact && contact.id === 'auto') endContact();
    auto.last = auto.seg; auto.seg = null; auto.segs++;
    // 段与段之间：只有背景音的几秒（精油后马上接揉揉）
    auto.gap = auto.chain ? 0.8 : 5 + Math.random() * 7;
    if (auto.segs % 7 === 0) flipEar();
  }
}

// 可视耳勺的小屏：从 LED 镜头往耳道里看
const scopeEl = $('#scope-view');
function renderScope() {
  const t = tools.scope;
  const on = toolName === 'scope' && t.visible && started;
  scopeEl.classList.toggle('show', on);
  if (!on) return;
  const r = scopeEl.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
  const x = r.left - cr.left + 6, y = cr.bottom - r.bottom + 6, w = r.width - 12, h = r.height - 12;
  scopeCam.aspect = w / h; scopeCam.updateProjectionMatrix();
  scopeCam.position.copy(t.localToWorld(new V3(0, 0.75, 0)));
  scopeCam.up.copy(new V3().setFromMatrixColumn(camera.matrixWorld, 1));
  scopeCam.lookAt(t.localToWorld(new V3(0, -1.5, 0)));
  t.visible = false;
  const bg = scene.background; scene.background = new THREE.Color(0x120804);
  renderer.setScissorTest(true);
  renderer.setScissor(x, y, w, h); renderer.setViewport(x, y, w, h);
  renderer.render(scene, scopeCam);
  renderer.setScissorTest(false);
  const s = renderer.getSize(new THREE.Vector2());
  renderer.setViewport(0, 0, s.x, s.y);
  scene.background = bg;
  t.visible = true;
}

// —— 主循环 ——
let last = performance.now(), frames = 0, fpsT = 0, fps = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  const ts = now / 1000;
  shared.uTime.value = ts;
  placeCamera(dt);
  if (shake > 0) { shake *= Math.exp(-dt * 9); camera.position.x += (Math.random() - 0.5) * shake * 0.08; camera.position.y += (Math.random() - 0.5) * shake * 0.08; }
  if (geo) {
    stepTool(dt, ts);
    stepWax(dt, ts);
    stepWarm(dt);
    stepDone(dt);
    stepDrops(dt);
    stepMood(dt);
    if (!sleep.on) stepWish(dt);
    stepAuto(dt);
    stepSleep(dt);
  }
  stepFlying(dt);
  stepDust(dt);
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i]; r.t += dt;
    r.m.scale.setScalar(0.25 + r.t * 2.2); r.m.material.opacity = 0.3 * (1 - r.t / 1.1);
    r.m.quaternion.copy(camera.quaternion);
    if (r.t > 1.1) { r.m.removeFromParent(); r.m.geometry.dispose(); r.m.material.dispose(); ripples.splice(i, 1); }
  }
  renderer.render(scene, camera);
  renderScope();
  frames++; fpsT += dt; if (fpsT > 1) { fps = frames / fpsT; frames = 0; fpsT = 0; }
}

// —— 启动 ——
async function boot() {
  resize();
  tissue.position.set(1.55, -4.7, 1.1); tissue.rotation.set(-0.5, 0.25, 0.3);
  const t0 = performance.now();
  await loadEar({});
  paintSkin(SKIN);
  seedWax(true);
  audio.setSide(-1);
  updateLabel();
  // 预编译着色器，避免第一次拿起工具时卡一下
  for (const t of Object.values(tools)) t.visible = true;
  renderer.compile(scene, camera);
  for (const t of Object.values(tools)) t.visible = false;
  $('#load-label').textContent = '';
  $('#start-btn').disabled = false;
  if (DEV) window.__spa.buildMs = performance.now() - t0;
}

if (DEV) {
  window.__spa = {
    get state() { return { relax, mood: moodNow, wish, oil: geo ? geo.attributes.aOil.array.reduce((a, b) => a + (b > 0.05), 0) : 0, warm: geo ? geo.attributes.aWarm.array.reduce((a, b) => a + (b > 0.1), 0) : 0, tool: toolName, flip, done, fps, focus: cam.focus, depth: tip.depth, speed: tip.speed, flakes: flakes.filter(f => f.state === 'stuck').length, chunk: chunk && chunk.state, tissue: tissueBits.children.length, ears: save.ears }; },
    tool: setTool, flipEar,
    start: () => startSession(),
    startSleep, stopSleep, sleep, auto, scapes,
    earsDone: () => earsDone,
    screenOf(x, y, z) { const w = localToWorldP(new V3(x, y, z)).project(camera); const r = canvas.getBoundingClientRect(); return { x: r.left + (w.x * 0.5 + 0.5) * r.width, y: r.top + (-w.y * 0.5 + 0.5) * r.height }; },
    flakeScreens() { return flakes.filter(f => f.state === 'stuck').map(f => this.screenOf(f.p.x, f.p.y, f.p.z)); },
    chunkScreen() { return chunk && chunk.state === 'stuck' ? this.screenOf(chunk.p.x, chunk.p.y, chunk.p.z) : null; },
    canalScreen(t = 0.45) { const p = E.canalPoint(t); return this.screenOf(...p); },
    view(yaw = 0, pitch = 0, zoom = 1, focus = 0) { cam.yawT = cam.yaw = yaw; cam.pitchT = cam.pitch = pitch; cam.zoomT = cam.zoom = zoom; cam.focusT = cam.focus = focus; focusHold = focus ? 99 : 0; },
    setWish(t) { wishT = 0; wish = null; const o = Object.keys(TOOL_LABEL); this._w = t; lastUsed[toolName] = 0; if (t) { wish = t; wishProg = 0; const el = $('#wish'); el.innerHTML = `试试 <i class="ti ti-${t}"></i> ${TOOL_LABEL[t]}～`; el.dataset.tool = t; el.classList.add('show'); } },
    clearAll() { for (const f of flakes) if (f.state === 'stuck') { f.state = 'tissue'; f.root.visible = false; } if (chunk) { chunk.state = 'tissue'; chunk.root.visible = false; } geo.attributes.aDirt.array.fill(0); geo.attributes.aDirt.needsUpdate = true; },
    hideTools() { for (const t of Object.values(tools)) t.visible = false; },
    tools, camera, THREE,
    audio,
  };
}
requestAnimationFrame(frame);
boot();
