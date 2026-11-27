// game.js —— 糖果小岛 v6：一圈糖衣水果种在岛上；快划碎、慢拉揭、画圈；剥光咬掉后原地再长出来；碎糖撒满岛、倒进水晶罐
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as R from './rules.js';
import { createAudio } from './webaudio-kit.js';
import * as M from './models.js';

const V3 = THREE.Vector3;
const META_KEY = 'crystal-island6-meta-v1';
const MUTE_KEY = 'crystal-island6-muted-v1';
const TAU = Math.PI * 2;

function loadMeta() { try { const raw = localStorage.getItem(META_KEY); if (raw) return JSON.parse(raw); } catch {} return {}; }
const meta0 = loadMeta();
let hints = { swipe: false, peel: false, ...(meta0.hints || {}) };
let eaten = Math.max(0, meta0.eaten || 0), todayEaten = 0;
const jar = R.loadJar(meta0);
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify({ eaten, jar, hints })); } catch {} }

let pendingTimers = [];
function later(fn, ms) { const id = setTimeout(() => { pendingTimers = pendingTimers.filter(t => t !== id); fn(); }, ms); pendingTimers.push(id); return id; }

// ——————— DOM ———————
const $ = id => document.getElementById(id);
const app = $('app');
const canvas = $('stage-canvas');
const levelDot = $('level-dot'), levelLabel = $('level-label');
const muteBtn = $('mute-btn'), muteIconOn = $('mute-icon-on'), muteIconOff = $('mute-icon-off');
const toastLayer = $('toast-layer');
const guidePointer = $('guide-pointer'), guideBubble = $('guide-bubble');
const introOverlay = $('intro-overlay'), introStartBtn = $('intro-start-btn');
const hintCard = $('hint-card'), biteHint = $('bite-hint');
const jarBtn = $('jar-btn'), jarCanvas = $('jar-canvas'), jarCount = $('jar-count');
const shelfOverlay = $('shelf-overlay'), shelfJar = $('shelf-jar'), shelfFruits = $('shelf-fruits'), shelfFull = $('shelf-full'), shelfTag = $('shelf-tag');
const shelfClose = $('shelf-close');
const trailCanvas = $('trail-canvas'), tctx = trailCanvas.getContext('2d');

// ——————— 音频 ———————
const audio = createAudio({ muteKey: MUTE_KEY, sfxVolume: 1.8, musicVolume: 0.14 });
const peelLoop = audio.loop({ type: 'bandpass', freq: 1600, q: 0.8, wetAmt: 0.3 });
function syncMuteUI() {
  muteBtn.setAttribute('aria-pressed', String(audio.muted));
  muteIconOn.style.display = audio.muted ? 'none' : 'block';
  muteIconOff.style.display = audio.muted ? 'block' : 'none';
}
syncMuteUI();
muteBtn.addEventListener('click', () => { audio.toggle(); syncMuteUI(); });
document.addEventListener('pointerdown', (e) => { if (!e.isTrusted) return; audio.unlock(); audio.setMode('calm'); }, { once: true });
let lastBuzz = 0;
const buzz = (ms, force = false) => { const n = performance.now(); if (!force && n - lastBuzz < 45) return; lastBuzz = n; try { navigator.vibrate?.(ms); } catch {} };

// ——————— 渲染器 / 灯光 ———————
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;   // 阴影隔帧更新：8 颗果子的阴影每帧都画太费
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
scene.environmentIntensity = 0.95;
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
scene.add(new THREE.HemisphereLight(0xffffff, 0xffd9e4, 0.6));
const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.2);
keyLight.position.set(4, 9, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
Object.assign(keyLight.shadow.camera, { near: 1, far: 26, left: -6.5, right: 6.5, top: 6.5, bottom: -6.5 });
keyLight.shadow.bias = -0.0004;
keyLight.shadow.normalBias = 0.03;
scene.add(keyLight);
const rimPink = new THREE.DirectionalLight(0xffa6c9, 1.3); rimPink.position.set(-6, 4, -4); scene.add(rimPink);
const rimCyan = new THREE.DirectionalLight(0xa6e6ff, 1.1); rimCyan.position.set(6, 2, -5); scene.add(rimCyan);
const hitLight = new THREE.PointLight(0xffffff, 0, 3.2, 2); scene.add(hitLight);

// ——————— 小岛 ———————
const GROUND_Y = -1.5, ISLAND_R = 4.95, RING_R = 3.3, FRUIT_Y = GROUND_Y + 1.46;
const TEX = M.textures();
TEX.ripple.channel = 1;
function buildIsland() {
  const g = new THREE.Group();
  const prof = [[0, -0.9], [ISLAND_R * 0.55, -0.85], [ISLAND_R * 0.9, -0.55], [ISLAND_R + 0.08, -0.18], [ISLAND_R + 0.12, -0.04], [ISLAND_R + 0.05, 0.02], [ISLAND_R - 0.1, 0.0], [0, 0.0]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), new THREE.MeshPhysicalMaterial({ color: '#fff7fb', roughness: 0.35, sheen: 0.5, sheenColor: new THREE.Color('#ffd6e7'), clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.DoubleSide }));
  body.receiveShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(ISLAND_R + 0.08, 0.05, 12, 160), new THREE.MeshPhysicalMaterial({ color: '#f5c451', metalness: 1, roughness: 0.22 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = -0.04;
  // 一圈奶油小路 + 撒点糖珠装饰
  const path = new THREE.Mesh(new THREE.RingGeometry(RING_R - 0.75, RING_R + 0.75, 128), new THREE.MeshPhysicalMaterial({ color: '#ffeaf2', roughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') }));
  path.rotation.x = -Math.PI / 2; path.position.y = 0.004; path.receiveShadow = true;
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshPhysicalMaterial({ roughness: 0.2, clearcoat: 1 }), 160);
  const m4 = new THREE.Matrix4(), c = new THREE.Color(), cols = ['#ff9cc8', '#ffe36b', '#8ff0cf', '#9fd4ff', '#d7b4ff'];
  for (let i = 0; i < 160; i++) {
    let r, a;
    do { r = Math.sqrt(Math.random()) * (ISLAND_R - 0.25); a = Math.random() * TAU; } while (Math.abs(r - RING_R) < 0.85);
    const s = 0.035 + Math.random() * 0.03;
    m4.compose(new V3(Math.sin(a) * r, s * 0.5, Math.cos(a) * r), new THREE.Quaternion(), new V3(s, s * 0.7, s));
    dots.setMatrixAt(i, m4); dots.setColorAt(i, c.set(cols[i % cols.length]));
  }
  g.add(body, rim, path, dots);
  g.position.y = GROUND_Y;
  return g;
}
scene.add(buildIsland());

// ——————— 玻璃糖材质 ———————
const COLOR_STYLE = {
  pink: { color: '#ff8fc4', att: '#ff2f8a', emis: '#ff4f9a', spark: 0xff8fc0 },
  gold: { color: '#ffe45c', att: '#ffc000', emis: '#ffc61a', spark: 0xffd447 },
  mint: { color: '#78f0c4', att: '#00c28a', emis: '#14d99c', spark: 0x7ff0cf },
  sky: { color: '#8ccfff', att: '#1d8bff', emis: '#3aa0ff', spark: 0x8fd0ff },
};
const style = c => COLOR_STYLE[c] || COLOR_STYLE.pink;
function makeShellMat(c) {
  const st = style(c);
  return new THREE.MeshPhysicalMaterial({
    color: st.color, roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.03, ior: 1.5, transmission: 0.6, thickness: 0.34,
    attenuationColor: new THREE.Color(st.att), attenuationDistance: 0.55, specularIntensity: 1, envMapIntensity: 1.3,
    normalMap: TEX.ripple, normalScale: new THREE.Vector2(0.14, 0.14), iridescence: 0.3, iridescenceIOR: 1.3,
    emissive: st.emis, emissiveIntensity: 0.16,
  });
}

// ——————— 咬一口：每颗果子自己的一组"球形缺口"uniform ———————
const BITE_MAX = 12;
function biteUniforms(flesh) { return { bites: { value: Array.from({ length: BITE_MAX }, () => new THREE.Vector4(0, 0, 0, 0)) }, mat: { value: new THREE.Matrix4() }, flesh: { value: new THREE.Color(flesh) } }; }
function addBiteShader(root, U) {
  root.traverse(o => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m || m.userData.bite) continue;
      const flesh = m.side === THREE.FrontSide && !m.transparent;
      m.userData.bite = true;
      if (flesh) m.side = THREE.DoubleSide;
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uBites = U.bites; sh.uniforms.uBiteMat = U.mat; sh.uniforms.uFlesh = U.flesh;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vBiteW;')
          .replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_INSTANCING\n vBiteW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\n vBiteW = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vBiteW;\nuniform vec4 uBites[12];\nuniform mat4 uBiteMat;\nuniform vec3 uFlesh;')
          .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nfloat biteEdge = 1e3, biteNear = 1e3;\n{ vec3 bl = (uBiteMat * vec4(vBiteW, 1.0)).xyz; for (int i = 0; i < 12; i++) { vec4 b = uBites[i]; if (b.w > 0.0) { float d = distance(bl, b.xyz); if (d < b.w) discard; biteEdge = min(biteEdge, d - b.w); biteNear = min(biteNear, d); } } }');
        if (flesh) sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = mix(uFlesh * 1.12, uFlesh * 0.58, clamp((biteNear - 0.3) / 1.2, 0.0, 1.0));\nelse if (biteEdge < 0.045) diffuseColor.rgb = mix(uFlesh * 1.2, diffuseColor.rgb, smoothstep(0.0, 0.045, biteEdge));');
      };
      m.customProgramCacheKey = () => (flesh ? 'bite-flesh' : 'bite');
      m.needsUpdate = true;
    }
  });
}

// ——————— 每种果子的模型与切壳只算一次，之后复用 ———————
const CACHE = {};
function cacheType(ti) {
  if (CACHE[ti]) return CACHE[ti];
  const spec = R.FRUITS[ti];
  const core = M.buildFruit(spec.fruit, false);
  core.traverse(o => { if (o.geometry) o.geometry.userData.keep = true; });
  const lay = R.layout(spec);
  const pieces = M.buildShellPieces(spec.fruit, lay.shells, 4000 + ti * 77);
  for (const p of pieces) {
    p.intactGeo.userData.keep = true;
    for (const f of p.frags) f.geo.userData.keep = true;
    const pos = p.intactGeo.attributes.position, samples = [];
    const stride = Math.max(1, Math.floor(pos.count / 10));
    for (let i = 0; i < pos.count && samples.length < 10; i += stride) samples.push(new V3().fromBufferAttribute(pos, i));
    p.samples = samples;
  }
  const order = pieces.map((p, i) => i).sort((a, b) => pieces[b].anchor.y - pieces[a].anchor.y);
  return (CACHE[ti] = { core, pieces, adj: pieces.adjacency, order });
}
const disposeGeo = g => { if (g && !g.userData.keep) g.dispose(); };

// ——————— 岛上的 8 个位置 ———————
const fruits = [];
for (let k = 0; k < R.SLOTS; k++) {
  const a = k / R.SLOTS * TAU;
  const pivot = new THREE.Group();
  pivot.position.set(Math.sin(a) * RING_R, FRUIT_Y, Math.cos(a) * RING_R);
  scene.add(pivot);
  fruits.push({ k, angle: a, base: pivot.position.clone(), pivot, state: 'empty', ti: -1, meshes: [], shells: [], regrowAt: 0, rotY: Math.random() * TAU, wob: 0, wobV: 0, tilt: 0, tiltV: 0, moodT: 0, blinkT: 2, growT: 0, popT: 0, screen: { x: 0, y: 0, r: 60, on: false } });
}

function buildShellGroup(piece, s, F) {
  const g = new THREE.Group();
  g.position.copy(piece.anchor);
  const mat = makeShellMat(s.color);
  const intact = new THREE.Mesh(piece.intactGeo, mat);
  g.add(intact);
  const frags = piece.frags.map(f => {
    const m = new THREE.Mesh(f.geo, mat);
    m.position.copy(f.center); m.visible = false; m.userData.size = f.size;
    g.add(m);
    return m;
  });
  // 闪光精灵每个都是一次绘制：一座岛上 240 块壳太多，只给三分之一的壳
  const glints = piece.glints.slice(0, s.id % 3 === 0 ? 1 : 0).map(p => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.position.copy(p); sp.userData.phase = Math.random() * 10; sp.scale.setScalar(0.001);
    g.add(sp);
    return sp;
  });
  g.userData = { shellId: s.id, F, color: s.color, dir: piece.dir.clone(), anchor: piece.anchor.clone(), mat, intact, frags, glints, samples: piece.samples, gone: false, peel: null, grow: 1 };
  intact.userData.shellG = g;
  return g;
}
function clearSlot(F) {
  for (const ch of [...F.pivot.children]) {
    F.pivot.remove(ch);
    ch.traverse(o => { disposeGeo(o.geometry); if (o.userData.ownMat) o.material.dispose(); });
  }
  F.meshes = []; F.shells = []; F.core = null; F.face = null;
  F.pivot.scale.setScalar(1); F.pivot.position.copy(F.base);
}
function spawnFruit(F, ti, grow) {
  clearSlot(F);
  const spec = R.FRUITS[ti], C = cacheType(ti);
  F.ti = ti; F.spec = spec; F.biteN = 0; F.bitesDone = 0;
  F.U = biteUniforms(spec.flesh);
  const core = C.core.clone(true);
  core.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.userData.ownMat = true; } });
  F.face = M.buildFace(spec.fruit);
  core.add(F.face.root);
  addBiteShader(core, F.U);
  core.userData.slot = F;
  F.core = core; F.pivot.add(core);
  const colors = R.colorize(C.adj, spec.palette);
  F.shells = C.pieces.map((p, i) => ({ id: i, color: colors[i], peeled: false }));
  F.meshes = C.pieces.map((p, i) => { const g = buildShellGroup(p, F.shells[i], F); F.pivot.add(g); return g; });
  F.order = C.order;
  F.wob = F.wobV = F.tilt = F.tiltV = 0; F.moodT = 0;
  F.state = grow ? 'grow' : 'peel'; F.growT = grow ? 0 : 99;
  if (grow) for (const g of F.meshes) { g.userData.grow = 0; g.scale.setScalar(0.001); }
}
function angDiff(a, b) { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
// 屏幕上最大、最靠中间的那颗当"正面"
function frontFruit() {
  let best = null, bs = -1e9;
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  for (const F of fruits) { if (!F.screen.on) continue; const sc = F.screen.r - 0.35 * Math.hypot(F.screen.x - cx, (F.screen.y - cy) * 0.6); if (sc > bs) { bs = sc; best = F; } }
  return best;
}

// ——————— 相机：自由三维 —— 左右转、上下俯仰、滚轮/双指缩放（近=特写一颗，远=整岛全景） ———————
let camA = 0, camVel = 0, camTarget = null, camD = 12;
let camPitch = 0.42, pitchT = 0.42, zoom = 0, zoomT = 0;
const PITCH_MIN = 0.08, PITCH_MAX = 1.35;
let shakeAmp = 0;
const camLook = new V3();
function placeCamera() {
  const d = new V3(Math.sin(camA), 0, Math.cos(camA));
  const front = d.clone().multiplyScalar(RING_R - 0.4).setY(FRUIT_Y - 0.15);
  camLook.copy(front).lerp(new V3(0, GROUND_Y + 0.55, 0), zoom);
  const D = THREE.MathUtils.lerp(camD, Math.max(camD * 2.7, 24), zoom);
  const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  camera.position.set(camLook.x + d.x * D * cp, camLook.y + D * sp, camLook.z + d.z * D * cp);
  const right = new V3(Math.cos(camA), 0, -Math.sin(camA));
  camera.position.addScaledVector(right, (Math.random() - 0.5) * shakeAmp).y += (Math.random() - 0.5) * shakeAmp;
  camera.lookAt(camLook);
  camera.updateMatrixWorld();
}
let rect = canvas.getBoundingClientRect();
function resize() {
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camD = Math.max(1.85 / (t * Math.min(camera.aspect, 1)), 8.5);
  camera.updateProjectionMatrix();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  trailCanvas.width = Math.round(w * dpr); trailCanvas.height = Math.round(h * dpr);
  tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  jarCanvas.width = Math.round(60 * dpr); jarCanvas.height = Math.round(84 * dpr);
  shelfJar.width = Math.round(120 * dpr); shelfJar.height = Math.round(168 * dpr);
  rect = canvas.getBoundingClientRect();
  drawJar(jarCanvas, jar);
}
window.addEventListener('resize', resize);

// ——————— 提示 ———————
function toast(text, kind = 'good', y = 35) {
  const el = document.createElement('div');
  el.className = `float-msg ${kind}`; el.textContent = text; el.style.top = `${y}%`;
  toastLayer.appendChild(el); later(() => el.remove(), 950);
}
function bigWord(text) {
  const el = document.createElement('div');
  el.className = 'big-word'; el.textContent = text;
  toastLayer.appendChild(el); later(() => el.remove(), 1100);
}
function clientOfWorld(v) {
  const p = v.clone().project(camera);
  return { x: rect.left + (p.x * 0.5 + 0.5) * rect.width, y: rect.top + (-p.y * 0.5 + 0.5) * rect.height, z: p.z };
}
function updateLabel() { levelLabel.textContent = `糖果小岛 · 吃掉 ${eaten} 颗`; }
function learn(k) { if (hints[k]) return; hints[k] = true; saveMeta(); syncHintCard(); }
function syncHintCard() { hintCard.classList.toggle('hide', hints.swipe && hints.peel && todayEaten >= 2); }

// ——————— 特效 ———————
const debris = [], sprites = [];
const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
const crumbGeo = new THREE.OctahedronGeometry(1, 0); crumbGeo.userData.keep = true;
const dropGeo = new THREE.SphereGeometry(1, 10, 8); dropGeo.userData.keep = true;
const crumbMats = {}, juiceMats = {};
function crumbMat(hex) { return crumbMats[hex] || (crumbMats[hex] = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.08, clearcoat: 1, transmission: 0.4, thickness: 0.05, emissive: hex, emissiveIntensity: 0.12 })); }
function juiceMat(hex) { return juiceMats[hex] || (juiceMats[hex] = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.03, clearcoat: 1, transmission: 0.5, thickness: 0.2, ior: 1.33, emissive: hex, emissiveIntensity: 0.15 })); }
function worldPosOf(obj) { const v = new V3(); if (obj) obj.getWorldPosition(v); return v; }
function worldNormalOf(g) { return g.userData.dir.clone().transformDirection(g.matrixWorld); }
const camRight = () => new V3(1, 0, 0).applyQuaternion(camera.quaternion);
const camUp = () => new V3(0, 1, 0).applyQuaternion(camera.quaternion);
const camFwd = () => new V3(0, 0, -1).applyQuaternion(camera.quaternion);
let tinkleBudget = 0;
function addDebris(mesh, vel, o = {}) {
  debris.push({ mesh, vel, ang: o.ang || new V3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12), life: o.life ?? 6, rad: o.rad ?? 0.03, kind: o.kind || 'shard', size: o.size || 0.1, color: o.color, baseScale: mesh.scale.clone() });
  if (debris.length > 240) for (let i = 0; i < debris.length - 240; i++) debris[i].life = Math.min(debris[i].life, 0.2);
}
function spawnSparkles(pos, hex, n = 12, speed = 2.4, size = 0.16) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star, color: hex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.copy(pos);
    const dir = new V3(Math.random() - 0.5, Math.random() * 0.9 + 0.1, Math.random() - 0.5).normalize();
    scene.add(s);
    const life = 0.45 + Math.random() * 0.45;
    sprites.push({ s, vel: dir.multiplyScalar(speed * (0.4 + Math.random() * 0.8)), life, max: life, size: size * (0.5 + Math.random()), grav: 1.6, drag: 2.6, spin: (Math.random() - 0.5) * 6 });
  }
}
function spawnRing(pos, hex, size = 0.9) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.ring, color: hex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.position.copy(pos); scene.add(s);
  sprites.push({ s, vel: new V3(), life: 0.3, max: 0.3, size, ring: true });
}
function spawnShockRing(hex, at) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 80), new THREE.MeshBasicMaterial({ color: hex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = Math.PI / 2; m.position.copy(at); scene.add(m);
  sprites.push({ s: m, vel: new V3(), life: 0.55, max: 0.55, size: 2.6, ring: true, torus: true });
}
function spawnCrumbs(pos, hex, n = 8, power = 1, mat = null, geo = crumbGeo) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, mat || crumbMat(hex));
    const sc = 0.012 + Math.random() * 0.02;
    m.scale.set(sc, sc * (0.7 + Math.random() * 0.8), sc); m.position.copy(pos);
    scene.add(m);
    addDebris(m, new V3((Math.random() - 0.5) * 3, Math.random() * 2.4 + 0.8, (Math.random() - 0.5) * 3).multiplyScalar(power), { kind: 'crumb', rad: sc, life: 1.6 + Math.random() });
  }
}
function flash(pos, hex, k = 6) { hitLight.position.copy(pos); hitLight.color.setHex(hex); hitLight.intensity = k; }
function kick(F, amount, side = 0) { if (!F) return; F.wobV += amount * 9; F.tiltV += side * amount * 6; }

function shatterGroup(g, { power = 1, quiet = false, lite = false, baseVel = null } = {}) {
  const u = g?.userData;
  if (!u || !g.parent || u.gone) return null;
  u.gone = true;
  g.updateMatrixWorld(true);
  const P = new V3().setFromMatrixPosition(g.matrixWorld);
  const N = worldNormalOf(g);
  const hex = style(u.color).spark;
  u.intact.visible = false;
  for (const s of u.glints) s.visible = false;
  for (const f of [...u.frags]) {
    f.visible = true;
    scene.attach(f);
    const out = f.position.clone().sub(P); out.addScaledVector(N, -out.dot(N)).normalize();
    const v = N.clone().multiplyScalar((0.9 + Math.random() * 1.0) * power).addScaledVector(out, 0.6 + Math.random() * 0.7);
    v.x *= 0.8; v.z *= 0.6; v.y += 1.2 + Math.random() * 1.0;
    if (baseVel) v.multiplyScalar(0.45).add(baseVel);
    addDebris(f, v, { size: f.userData.size, rad: 0.02, color: u.color });
  }
  g.parent.remove(g);
  spawnSparkles(P, hex, lite ? 3 : quiet ? 5 : 10, 2.6, 0.17);
  spawnCrumbs(P, hex, lite ? 2 : quiet ? 3 : 6, power);
  if (!quiet && !lite) { spawnRing(P, hex, 0.8); flash(P, hex, 5); }
  return P;
}

// ——————— 岛上的碎糖堆：BatchedMesh + 高度场 ———————
const PILE_MAX = 900, PILE_VERTS = 560000;
const pileMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, transmission: 0.45, thickness: 0.12, ior: 1.5, iridescence: 0.3, iridescenceIOR: 1.3, specularIntensity: 1, envMapIntensity: 1.4 });
const HF_N = 70, HF_EXT = 5.2, HF_S = HF_EXT * 2 / HF_N;
const HF = new Float32Array(HF_N * HF_N);
let pile = null;
const tmpM = new THREE.Matrix4(), tmpC = new THREE.Color();
function newPile() {
  if (pile) { scene.remove(pile.mesh); pile.mesh.dispose(); }
  const mesh = new THREE.BatchedMesh(PILE_MAX, PILE_VERTS, 0, pileMat);
  mesh.perObjectFrustumCulled = false; mesh.sortObjects = false; mesh.frustumCulled = false;
  scene.add(mesh);
  pile = { mesh, recs: [], verts: 0, pouring: false };
  HF.fill(0);
}
const hfCell = (x, z) => { const i = Math.floor((x + HF_EXT) / HF_S), j = Math.floor((z + HF_EXT) / HF_S); return i < 0 || j < 0 || i >= HF_N || j >= HF_N ? -1 : j * HF_N + i; };
function floorAt(x, z) {
  if (Math.hypot(x, z) > ISLAND_R - 0.05) return -99;
  const c = hfCell(x, z);
  return GROUND_Y + (c >= 0 ? Math.min(0.3, HF[c]) : 0);
}
function hfAdd(rec) { const c = hfCell(rec.pos.x, rec.pos.z); if (c < 0) return; rec.cell = c; rec.h = rec.size * 0.34; HF[c] += rec.h; }
function hfRemove(rec) { if (rec.cell >= 0) { HF[rec.cell] = Math.max(0, HF[rec.cell] - rec.h); rec.cell = -1; } }
function recMatrix(rec) { tmpM.compose(rec.pos, rec.quat, rec.scale); pile.mesh.setMatrixAt(rec.iid, tmpM); }
const aliveCount = () => (pile ? pile.recs.reduce((n, r) => n + (r.alive ? 1 : 0), 0) : 0);
function toPile(d) {
  if (!pile || pile.pouring) return false;
  const geo = d.mesh.geometry, vc = geo.attributes.position.count;
  if (pile.recs.length >= PILE_MAX - 1 || pile.verts + vc > PILE_VERTS) return false;
  let iid;
  try { const gid = pile.mesh.addGeometry(geo); iid = pile.mesh.addInstance(gid); } catch { return false; }
  pile.verts += vc;
  const rec = { iid, pos: d.mesh.position.clone(), quat: d.mesh.quaternion.clone(), scale: d.mesh.scale.clone(), vel: new V3(), ang: new V3(), rest: true, size: d.size, rad: d.rad, color: d.color || 'pink', cell: -1, h: 0, alive: true };
  pile.mesh.setColorAt(iid, tmpC.set(style(rec.color).color));
  recMatrix(rec); hfAdd(rec);
  pile.recs.push(rec);
  scene.remove(d.mesh); disposeGeo(geo);
  if (pile.verts > PILE_VERTS * 0.86) later(startPour, 300);
  return true;
}
let lastPileSfx = 0;
function pileSfx(n) { const t = performance.now(); if (n <= 0 || t - lastPileSfx < 70) return; lastPileSfx = t; audio.sfx.pileTouch(n); buzz(4); }
function pileNear(p, rad) { let n = 0; if (pile && !pile.pouring) for (const r of pile.recs) if (r.alive && (r.pos.x - p.x) ** 2 + (r.pos.z - p.z) ** 2 < rad * rad) n++; return n; }
function stirPile(p, delta, dtSec, press = false) {
  if (!pile || pile.pouring) return;
  const rad = press ? 0.3 : 0.34;
  let n = 0;
  for (const rec of pile.recs) {
    if (!rec.alive) continue;
    const dx = rec.pos.x - p.x, dz = rec.pos.z - p.z;
    if (dx * dx + dz * dz > rad * rad) continue;
    if (rec.rest) hfRemove(rec);
    rec.rest = false;
    if (press) rec.vel.set(dx * 3 + (Math.random() - 0.5) * 0.6, 1.1 + Math.random() * 1.1, dz * 3 + (Math.random() - 0.5) * 0.6);
    else {
      const v = delta.clone().multiplyScalar(0.9 / Math.max(0.008, dtSec));
      if (v.length() > 5) v.setLength(5);
      rec.vel.set(v.x + (Math.random() - 0.5) * 0.5, 0.4 + Math.random() * 0.9, v.z + (Math.random() - 0.5) * 0.5);
    }
    rec.ang.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
    n++;
  }
  pileSfx(n);
}
function stepPile(dt) {
  if (!pile) return;
  for (const rec of pile.recs) {
    if (!rec.alive || rec.rest || rec.pour) continue;
    rec.vel.y -= 9.2 * dt;
    rec.pos.addScaledVector(rec.vel, dt);
    tmpQ.setFromEuler(tmpE.set(rec.ang.x * dt, rec.ang.y * dt, rec.ang.z * dt));
    rec.quat.multiply(tmpQ);
    const fl = floorAt(rec.pos.x, rec.pos.z) + rec.rad;
    if (rec.pos.y < fl && fl > GROUND_Y - 1 && rec.vel.y < 0) {
      const impact = -rec.vel.y;
      rec.pos.y = fl;
      rec.vel.y = impact * 0.25; rec.vel.x *= 0.55; rec.vel.z *= 0.55; rec.ang.multiplyScalar(0.45);
      if (impact > 1.2 && tinkleBudget > 0) { tinkleBudget -= 0.6; audio.sfx.tinkle(rec.size, Math.min(1, impact / 5) * 0.7); }
      if (impact < 0.6 && rec.vel.lengthSq() < 0.5) { rec.rest = true; rec.vel.set(0, 0, 0); hfAdd(rec); }
    }
    if (rec.pos.y < GROUND_Y - 2.5) { rec.alive = false; pile.mesh.setVisibleAt(rec.iid, false); continue; }
    recMatrix(rec);
  }
}

// ——————— 拾取 ———————
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function setRay(x, y) { ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(ndc, camera); }
function ownerOf(o) { while (o) { if (o.userData.shellG) return { g: o.userData.shellG, F: o.userData.shellG.userData.F }; if (o.userData.slot) return { F: o.userData.slot, core: true }; o = o.parent; } return null; }
function updateFruitScreens() {
  scene.updateMatrixWorld();
  const cr = camRight();
  for (const F of fruits) {
    const a = clientOfWorld(F.pivot.position), b = clientOfWorld(F.pivot.position.clone().addScaledVector(cr, 1.0));
    F.screen.x = a.x; F.screen.y = a.y; F.screen.r = Math.max(10, Math.hypot(a.x - b.x, a.y - b.y));
    F.screen.on = a.z < 1 && a.x > rect.left - F.screen.r && a.x < rect.right + F.screen.r && a.y > rect.top - F.screen.r && a.y < rect.bottom + F.screen.r;
  }
}
// 只对手指附近的果子做射线，省力
function nearFruits(x0, y0, x1, y1, pad = 1.25) {
  // 只有正面和左右相邻的果子能摸到；后排远处的只是风景（拖它们那块空中可以转岛）
  let maxR = 0; for (const F of fruits) if (F.screen.on) maxR = Math.max(maxR, F.screen.r);
  const minR = Math.max(26, maxR * 0.72);
  return fruits.filter(F => F.screen.on && F.screen.r >= minR && segDist(F.screen, { x: x0, y: y0 }, { x: x1, y: y1 }).d < F.screen.r * pad);
}
function pickAt(x, y, fs) {
  setRay(x, y);
  const targets = [];
  for (const F of fs) {
    if (F.state === 'peel') for (const g of F.meshes) if (g.parent === F.pivot && !g.userData.gone && !g.userData.peel) targets.push(g.userData.intact);
    if ((F.state === 'peel' || F.state === 'bite') && F.core) targets.push(F.core);
  }
  const hits = raycaster.intersectObjects(targets, true);
  return hits.length ? { ...ownerOf(hits[0].object), point: hits[0].point } : null;
}
function facing(g) { const P = worldPosOf(g); return worldNormalOf(g).dot(camera.position.clone().sub(P).normalize()); }
function segDist(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y, L = vx * vx + vy * vy;
  const t = L < 1e-6 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / L));
  return { d: Math.hypot(a.x + vx * t - p.x, a.y + vy * t - p.y), t };
}
// 这一小段手指轨迹碰到了哪些壳（可以跨好几颗果子），按先后排序
function shellsAlong(x0, y0, x1, y1) {
  const fs = nearFruits(x0, y0, x1, y1).filter(F => F.state === 'peel');
  if (!fs.length) return [];
  const hit = new Map();
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 9));
  for (let i = 0; i <= steps; i++) {
    const h = pickAt(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps, fs);
    if (h?.g && !hit.has(h.g)) hit.set(h.g, i / steps);
  }
  const a = { x: x0, y: y0 }, b = { x: x1, y: y1 };
  for (const F of fs) {
    const brush = F.screen.r * 0.17;
    for (const g of F.meshes) {
      if (hit.has(g) || g.parent !== F.pivot || g.userData.gone || g.userData.peel) continue;
      if (facing(g) < 0.25) continue;
      const r = segDist(clientOfWorld(worldPosOf(g)), a, b);
      if (r.d < brush) hit.set(g, r.t);
    }
  }
  return [...hit].sort((p, q) => p[1] - q[1]).map(p => p[0]);
}
const peelData = g => g.userData.F.shells[g.userData.shellId];
function markPeeled(g) { const s = peelData(g); if (!s || s.peeled) return false; s.peeled = true; return true; }

// ——————— 快划 ———————
let swipeK = 0, lastCrackSfx = 0, strokeCracks = 0;
function crackShell(g) {
  if (!markPeeled(g)) return;
  const fastK = Math.max(0, Math.min(1, (speed - 3) / 8));
  const P = shatterGroup(g, { power: 1 + fastK * 0.6, quiet: swipeK % 2 === 1, lite: swipeK > 6 && swipeK % 3 !== 0, baseVel: dragWorld.clone().multiplyScalar(1.4 * fastK) });
  const t = performance.now();
  if (t - lastCrackSfx > 16) { audio.sfx.swipeCrack(swipeK, fastK); lastCrackSfx = t; }
  swipeK++; strokeCracks++;
  buzz(6);
  kick(g.userData.F, 0.03, (Math.random() - 0.5) * 0.4);
  shakeAmp = Math.max(shakeAmp, 0.006 + Math.min(0.03, swipeK * 0.002));
  if (P && swipeK % 4 === 0) flash(P, style(g.userData.color).spark, 4);
}

// ——————— 慢拉 ———————
let sheet = null;
const flying = [];
const dragWorld = new V3(1, 0.4, 0).normalize();
function joinSheet(g) {
  if (!g || g.userData.gone || !markPeeled(g)) return;
  if (!sheet) sheet = { members: [], born: clock };
  const F = g.userData.F, dir = g.userData.dir;
  const dl = dragWorld.clone().applyQuaternion(F.pivot.quaternion.clone().invert());
  const t = dl.addScaledVector(dir, -dl.dot(dir));
  if (t.lengthSq() < 1e-5) t.set(1, 0, 0).addScaledVector(dir, -dir.x);
  t.normalize();
  g.userData.peel = { k: 0, axis: new V3().crossVectors(t, dir).normalize(), seed: Math.random() * 10 };
  sheet.members.push(g);
  audio.sfx.peelJoin(sheet.members.length);
  buzz(4);
  spawnSparkles(worldPosOf(g), style(g.userData.color).spark, 2, 0.8, 0.1);
}
function sheetToShatter() {
  const ms = sheet.members; sheet = null; peelLoop.stop();
  for (const g of ms) { g.userData.peel = null; g.scale.setScalar(1); swipeK++; shatterGroup(g, { power: 1.1 }); audio.sfx.swipeCrack(swipeK, 0.4); }
}
function releaseSheet(rip) {
  const members = sheet.members.filter(g => g.parent && g.parent.isGroup && !g.userData.gone);
  sheet = null; peelLoop.stop();
  if (!members.length) return;
  const n = members.length;
  scene.updateMatrixWorld();
  const c = new V3(); for (const g of members) c.add(worldPosOf(g)); c.divideScalar(n);
  const body = new THREE.Group(); body.position.copy(c); scene.add(body); body.updateMatrixWorld(true);
  let rad = 0.1;
  for (const g of members) { rad = Math.max(rad, worldPosOf(g).distanceTo(c)); body.attach(g); }
  const F0 = members[0].userData.F;
  const out = c.clone().sub(F0.pivot.position).normalize();
  const vel = dragWorld.clone().multiplyScalar(rip ? 1.6 : 0.6).addScaledVector(out, 0.5);
  vel.y += 2.0 + Math.min(0.8, n * 0.03);
  const ang = new V3().crossVectors(new V3(0, 1, 0), dragWorld).normalize().multiplyScalar((rip ? 6 : 3.5) * (Math.random() < 0.5 ? -1 : 1));
  ang.x += (Math.random() - 0.5) * 2; ang.z += (Math.random() - 0.5) * 2;
  flying.push({ body, vel, ang, members, rad, t: 0, n });
  audio.sfx.sheetRip(n);
  buzz(rip ? 30 : 18, true);
  for (const F of new Set(members.map(g => g.userData.F))) { kick(F, 0.08 + Math.min(0.25, n * 0.015), Math.random() - 0.5); if (n >= 3 && F.state === 'peel') { F.face?.setMood('happy'); F.moodT = 0.7; } }
  spawnSparkles(c, 0xfff0c0, 4 + Math.min(10, n), 1.8, 0.16);
  if (n >= 16) bigWord(`一整张揭下来！×${n}`);
  else if (n >= 8) bigWord(`整片揭下来 ×${n}`);
  if (n >= 3) learn('peel');
}
function landSheet(f) {
  const v = f.vel.clone(); v.y = Math.abs(v.y) * 0.15; v.multiplyScalar(0.3);
  f.members.forEach((g, i) => { g.userData.peel = null; g.userData.mat.emissiveIntensity = 0.16; shatterGroup(g, { power: 0.55, quiet: i % 2 === 1, lite: i > 6 && i % 3 !== 0, baseVel: v }); });
  audio.sfx.sheetLand(f.n);
  buzz(20, true);
  shakeAmp = Math.max(shakeAmp, 0.02 + Math.min(0.08, f.n * 0.004));
  scene.remove(f.body);
}
function stepFlying(dt) {
  for (let i = flying.length - 1; i >= 0; i--) {
    const f = flying[i];
    f.t += dt;
    f.vel.y -= 9.2 * dt;
    f.body.position.addScaledVector(f.vel, dt);
    tmpQ.setFromEuler(tmpE.set(f.ang.x * dt, f.ang.y * dt, f.ang.z * dt));
    f.body.quaternion.multiply(tmpQ);
    const p = f.body.position, fl = floorAt(p.x, p.z);
    if ((f.t > 0.2 && f.vel.y < 0 && p.y < fl + f.rad * 0.4) || f.t > 2.6 || p.y < GROUND_Y - 2) { landSheet(f); flying.splice(i, 1); }
  }
}
function stepSheet(dt) {
  if (!sheet) return;
  const ms = sheet.members, n = ms.length;
  // 指尖在果子前方的 3D 位置：揭起来的壳朝指尖卷过去聚拢
  setRay(lastX, lastY);
  const F0 = ms[0]?.userData.F;
  const c = F0 ? F0.pivot.position.clone() : camLook.clone(), fw = camFwd();
  const t = (c.clone().addScaledVector(fw, -1.05).sub(raycaster.ray.origin).dot(fw)) / Math.max(1e-3, raycaster.ray.direction.dot(fw));
  const fingerW = raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, t);
  if (!sheet.finger) sheet.finger = fingerW.clone(); else sheet.finger.lerp(fingerW, Math.min(1, dt * 14));
  const tmpT = new V3(), fl = new V3();
  ms.forEach((g, i) => {
    const u = g.userData, p = u.peel;
    if (!p || g.parent !== u.F.pivot) return;
    fl.copy(sheet.finger); u.F.pivot.worldToLocal(fl);
    const age = n - 1 - i;
    const target = Math.min(1, 0.45 + 0.11 * age);
    p.k += (target - p.k) * Math.min(1, dt * 9);
    const pull = Math.min(0.62, 0.12 + 0.07 * age) * p.k;
    const jit = 0.006 * Math.sin(clock * 55 + p.seed);
    g.position.copy(u.anchor).addScaledVector(u.dir, 0.05 + 0.2 * p.k + jit).lerp(fl, pull);
    tmpT.copy(fl).sub(u.anchor); tmpT.addScaledVector(u.dir, -tmpT.dot(u.dir));
    if (tmpT.lengthSq() > 1e-5) p.axis.crossVectors(tmpT.normalize(), u.dir).normalize();
    g.quaternion.setFromAxisAngle(p.axis, 1.15 * p.k);
    g.scale.setScalar(1 - 0.18 * pull);
    u.mat.emissiveIntensity = 0.25 + 0.7 * p.k;
  });
  if (pointerDown) {
    peelLoop.set(0.035 + Math.min(1, speed / 4) * 0.2, 1300 + Math.min(4, speed) * 380);
    if (speed > 0.4 && Math.random() < Math.min(0.85, speed * 0.2)) audio.sfx.crackle(Math.min(1, speed / 4));
  }
}

// ——————— 画个圈 ———————
let stroke = [], trailFx = [];
function segInt(p, p2, q, q2) {
  const rx = p2.x - p.x, ry = p2.y - p.y, sx = q2.x - q.x, sy = q2.y - q.y;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-6) return null;
  const t = ((q.x - p.x) * sy - (q.y - p.y) * sx) / den;
  const u = ((q.x - p.x) * ry - (q.y - p.y) * rx) / den;
  if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null;
  return { x: p.x + rx * t, y: p.y + ry * t };
}
function polyArea(poly) { let a = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y); return a / 2; }
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
function shellsInPoly(poly) {
  const out = [];
  for (const F of fruits) {
    if (F.state !== 'peel' || !F.screen.on) continue;
    for (const g of F.meshes) {
      if (g.parent !== F.pivot || g.userData.gone || g.userData.peel || peelData(g).peeled) continue;
      if (facing(g) < 0.12) continue;
      const c = clientOfWorld(worldPosOf(g));
      if (inPoly(c.x, c.y, poly)) { out.push({ g, c }); continue; }
      let hit = 0;
      for (const sp of g.userData.samples) { const s = clientOfWorld(g.localToWorld(sp.clone())); if (inPoly(s.x, s.y, poly)) hit++; }
      if (hit >= Math.ceil(g.userData.samples.length * 0.5)) out.push({ g, c });
    }
  }
  return out;
}
function addStrokePoint(x, y) {
  const last = stroke[stroke.length - 1];
  if (last && Math.hypot(x - last.x, y - last.y) < 6) return;
  stroke.push({ x, y });
  if (stroke.length > 220) stroke.splice(0, stroke.length - 220);
  if (stroke.length < 8) return;
  const n = stroke.length, a = stroke[n - 2], b = stroke[n - 1];
  for (let j = 0; j < n - 4; j++) {
    const hit = segInt(stroke[j], stroke[j + 1], a, b);
    if (hit) { if (handleLoop([hit, ...stroke.slice(j + 1, n - 1)])) stroke = [b]; return; }
  }
}
function handleLoop(poly) {
  if (Math.abs(polyArea(poly)) < 1800) return false;
  const inside = shellsInPoly(poly);
  if (inside.length < 2) return false;
  let cx = 0, cy = 0; for (const p of poly) { cx += p.x; cy += p.y; } cx /= poly.length; cy /= poly.length;
  const a0 = Math.atan2(poly[0].y - cy, poly[0].x - cx), sgn = Math.sign(polyArea(poly)) || 1;
  const order = inside.map(o => { let a = (Math.atan2(o.c.y - cy, o.c.x - cx) - a0) * sgn; a = ((a % TAU) + TAU) % TAU; return { g: o.g, a }; }).sort((p, q) => p.a - q.a);
  const n = order.length;
  audio.sfx.lassoSnap(!fast);
  buzz(22, true);
  trailFx.push({ pts: poly, t: 0, kind: 'lasso', color: fast ? 0xfff0b0 : 0xffc35a });
  if (!fast) { for (const o of order) joinSheet(o.g); if (n >= 6) toast(`圈起一整片 ×${n}`, 'gold', 62); return true; }
  for (const o of order) markPeeled(o.g);
  const step = Math.max(28, 55 - n * 2);
  order.forEach((o, k) => later(() => {
    shatterGroup(o.g, { power: 1.15 + k * 0.03, quiet: k > 4 && k % 2 === 1, lite: k > 8 && k % 3 !== 0 });
    audio.sfx.lassoNote(k, false);
    kick(o.g.userData.F, 0.04, (k % 2 ? 1 : -1) * 0.3);
    shakeAmp = Math.max(shakeAmp, 0.01 + k * 0.002);
  }, 60 + k * step));
  later(() => {
    audio.sfx.lassoFinish(n >= 8);
    buzz(30, true);
    spawnShockRing(0xfff0b0, order[0].g.userData.F.pivot.position);
    if (n >= 8) bigWord(`一圈哗啦！×${n}`);
  }, 60 + n * step);
  return true;
}

// ——————— 剥光 → 咬三口 → 消失 → 过一会儿原地再长出来 ———————
function enterBite(F) {
  F.state = 'bite';
  F.face?.setMood('happy'); F.moodT = 0;
  kick(F, 0.25);
  if (F.screen.on) audio.sfx.clearChime();
  const c = F.pivot.position;
  for (let i = 0; i < 3; i++) spawnSparkles(c.clone().add(new V3((Math.random() - 0.5) * 1.2, (Math.random() - 0.3) * 1.4, 0)), [0xffe08a, 0xffb3cf, 0xbdeeff][i], 8, 2.4, 0.2);
  F.biteReadyAt = clock + 0.35;
}
const BITE_DIRS = [[0.78, -0.62], [-0.82, -0.5], [0.15, -1]];
function doBite(F, x, y) {
  if (clock < F.biteReadyAt || F.bitesDone >= R.BITES) return;
  F.bitesDone++;
  scene.updateMatrixWorld();
  const c = F.pivot.position.clone(), cs = clientOfWorld(c);
  let ox = x - cs.x, oy = y - cs.y;
  const len = Math.hypot(ox, oy);
  if (len < F.screen.r * 0.3) [ox, oy] = BITE_DIRS[(F.bitesDone - 1) % 3];
  else { ox /= len; oy /= len; }
  const side = camRight().multiplyScalar(ox).addScaledVector(camUp(), -oy).normalize();
  const dirW = side.clone().multiplyScalar(0.78).addScaledVector(camFwd(), -0.62).normalize();
  const tan = new V3().crossVectors(side, camFwd()).normalize();
  raycaster.set(c.clone().addScaledVector(dirW, 2.5), dirW.clone().negate());
  const hits = F.core ? raycaster.intersectObject(F.core, true).filter(h => h.object.geometry.type === 'SphereGeometry' && !h.object.isInstancedMesh) : [];
  const S0 = hits.length ? hits[0].point.clone() : c.clone().addScaledVector(dirW, 0.9);
  const C = S0.clone().addScaledVector(dirW, 0.05);
  for (const [o, r, d] of [[-0.34, 0.25, 0.06], [-0.12, 0.36, 0.1], [0.12, 0.36, 0.1], [0.34, 0.25, 0.06]]) {
    if (F.biteN >= BITE_MAX) break;
    const p = S0.clone().addScaledVector(tan, o).addScaledVector(dirW, d);
    F.pivot.worldToLocal(p);
    F.U.bites.value[F.biteN++].set(p.x, p.y, p.z, r);
  }
  const sp = F.spec;
  spawnCrumbs(C, sp.juice, 10, 0.9, juiceMat(sp.juice), dropGeo);
  spawnSparkles(C, sp.juice, 8, 2.2, 0.16);
  flash(C, sp.juice, 5);
  audio.sfx.bite(F.bitesDone);
  buzz(28, true);
  kick(F, 0.22, ox > 0 ? -0.6 : 0.6);
  shakeAmp = Math.max(shakeAmp, 0.03);
  if (F.bitesDone >= R.BITES) later(() => popFruit(F, true), 420);
}
function popFruit(F, ate) {
  F.state = 'pop'; F.popT = 0;
  if (ate) {
    audio.sfx.yum();
    if (F.screen.on) bigWord(['好吃！', '真甜～', '咔嚓！', '还会再长哦'][Math.floor(Math.random() * 4)]);
    spawnSparkles(F.pivot.position, 0xffe08a, 14, 2.8, 0.22);
    eaten++; todayEaten++; saveMeta(); updateLabel(); syncHintCard();
    if (aliveCount() >= 220) later(startPour, 300);
  }
  later(() => { clearSlot(F); F.state = 'empty'; F.regrowAt = clock + 3.5 + Math.random() * 4; }, 560);
}
function regrow(F) {
  const n = fruits.length;
  const neigh = [fruits[(F.k + 1) % n].ti, fruits[(F.k + n - 1) % n].ti];
  spawnFruit(F, R.pickRegrow(neigh), true);
  if (F.screen.on) audio.sfx.sprout();
}
function stepGrow(F, dt) {
  F.growT += dt;
  // 0–0.7s：果子从地里"啵"地长出来（带回弹）；之后糖壳一块块结晶回去
  const u = Math.min(1, F.growT / 0.7);
  const el = u >= 1 ? 1 : 1 - Math.pow(2, -9 * u) * Math.cos(u * 11);
  F.pivot.scale.setScalar(Math.max(0.001, el));
  F.pivot.position.y = F.base.y - (1 - u) * 1.2;
  if (F.state !== 'grow') return;
  const t2 = F.growT - 0.55;
  const per = 0.045;
  const n = F.meshes.length;
  for (let i = 0; i < n; i++) {
    const g = F.meshes[F.order[i]];
    const k = Math.max(0, Math.min(1, (t2 - i * per) / 0.18));
    if (k > 0 && g.userData.grow === 0) {
      g.userData.grow = 0.001;
      if (F.screen.on && i % 2 === 0) { audio.sfx.crystallize(i >> 1); spawnSparkles(worldPosOf(g), style(g.userData.color).spark, 2, 0.6, 0.1); }
    }
    if (k > 0) { g.userData.grow = k; g.scale.setScalar(Math.max(0.001, 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.12)); }
  }
  if (t2 > n * per + 0.2) { for (const g of F.meshes) { g.userData.grow = 1; g.scale.setScalar(1); } F.state = 'peel'; if (F.screen.on) audio.sfx.lassoGain(); }
}

// ——————— 水晶罐 ———————
const pours = [];
function jarWorldTarget() {
  const r = jarCanvas.getBoundingClientRect();
  setRay(r.left + r.width / 2, r.top + r.height * 0.55);
  return raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 4.2);
}
function startPour() {
  if (!pile || pile.pouring) return;
  const recs = pile.recs.filter(r => r.alive);
  if (!recs.length) return;
  pile.pouring = true;
  const target = jarWorldTarget();
  const order = ['pink', 'gold', 'mint', 'sky'].sort(() => Math.random() - 0.5);
  recs.sort((a, b) => order.indexOf(a.color) - order.indexOf(b.color) || a.pos.x - b.pos.x);
  const span = Math.min(1.6, 0.5 + recs.length * 0.004);
  recs.forEach((rec, i) => {
    rec.pour = { t: -(i / recs.length) * span, dur: 0.6, p0: rec.pos.clone(), p1: rec.pos.clone().lerp(target, 0.5).add(new V3(0, 1.4, 0)), s0: rec.scale.clone(), i };
    pours.push(rec);
  });
  audio.sfx.pourStart();
  toast('碎糖倒进水晶罐～', 'gold', 18);
}
let lastJarDraw = 0;
function stepPour(dt) {
  if (!pours.length) return;
  const target = jarWorldTarget();
  for (let i = pours.length - 1; i >= 0; i--) {
    const rec = pours[i], p = rec.pour;
    p.t += dt;
    if (p.t < 0) continue;
    const u = Math.min(1, p.t / p.dur), e = u * u * (3 - 2 * u), a = 1 - e;
    rec.pos.set(0, 0, 0).addScaledVector(p.p0, a * a).addScaledVector(p.p1, 2 * a * e).addScaledVector(target, e * e);
    rec.scale.copy(p.s0).multiplyScalar(1 - 0.75 * e);
    recMatrix(rec);
    if (u >= 1) {
      pile.mesh.setVisibleAt(rec.iid, false); rec.alive = false;
      pours.splice(i, 1);
      const full = R.jarAdd(jar, rec.color, 1);
      if (tinkleBudget > 0) { tinkleBudget -= 0.5; audio.sfx.pourTink(p.i); }
      if (full) onJarFull();
      const now = performance.now();
      if (now - lastJarDraw > 60) { lastJarDraw = now; drawJar(jarCanvas, jar); jarBtn.classList.remove('clink'); void jarBtn.offsetWidth; jarBtn.classList.add('clink'); }
    }
  }
  if (!pours.length) { drawJar(jarCanvas, jar); saveMeta(); newPile(); }
}
function onJarFull() {
  audio.sfx.jarFull();
  buzz(50, true);
  jarBtn.classList.remove('full'); void jarBtn.offsetWidth; jarBtn.classList.add('full');
  bigWord(`装满第 ${jar.full} 罐！`);
}
function drawJar(cv, j) {
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.scale(W / 60, H / 84);
  const body = new Path2D(); body.roundRect(7, 17, 46, 64, 11);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill(body);
  ctx.save(); ctx.clip(body);
  const tops = []; let y = 80;
  j.layers.forEach(l => { y -= (l.n / R.JAR_CAP) * 60; tops.push(y); });
  for (let i = j.layers.length - 1; i >= 0; i--) {
    const top = tops[i], amp = Math.min(1.8, (j.layers[i].n / R.JAR_CAP) * 60 * 0.5 + 0.3);
    ctx.beginPath(); ctx.moveTo(5, 84);
    for (let x = 5; x <= 55; x += 2) ctx.lineTo(x, top + Math.sin(x * 0.33 + i * 1.9) * amp);
    ctx.lineTo(55, 84); ctx.closePath();
    const st = style(j.layers[i].c);
    const gr = ctx.createLinearGradient(7, 0, 53, 0); gr.addColorStop(0, st.color); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.62, st.color); gr.addColorStop(1, st.att);
    ctx.globalAlpha = 0.92; ctx.fillStyle = gr; ctx.fill(); ctx.globalAlpha = 1;
  }
  if (j.total > 0) {
    const top = 80 - (j.total / R.JAR_CAP) * 60;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let k = 0; k < Math.min(14, 2 + j.total / 30); k++) { const sx = 10 + ((k * 37) % 40), sy = top + 2 + ((k * 53) % Math.max(1, 78 - top)); ctx.fillRect(sx, sy, 1.3, 1.3); }
  }
  ctx.restore();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke(body);
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(120,110,160,0.35)'; ctx.stroke(body);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(13, 28); ctx.lineTo(13, 64); ctx.stroke();
  const lid = new Path2D(); lid.roundRect(12, 6, 36, 11, 4);
  const lg = ctx.createLinearGradient(0, 6, 0, 17); lg.addColorStop(0, '#ffe39a'); lg.addColorStop(1, '#f0a92b');
  ctx.fillStyle = lg; ctx.fill(lid); ctx.strokeStyle = 'rgba(180,110,20,0.5)'; ctx.lineWidth = 1; ctx.stroke(lid);
  ctx.restore();
  if (cv === jarCanvas) jarCount.textContent = `${Math.round((j.total / R.JAR_CAP) * 100)}%`;
}
jarBtn.addEventListener('click', () => {
  audio.sfx.tap();
  drawJar(shelfJar, jar);
  shelfTag.textContent = `第 ${jar.full + 1} 罐 · ${Math.round((jar.total / R.JAR_CAP) * 100)}%`;
  shelfFruits.textContent = eaten;
  shelfFull.textContent = jar.full;
  shelfOverlay.classList.add('show');
});
shelfClose.addEventListener('click', () => { audio.sfx.tap(); shelfOverlay.classList.remove('show'); });

// ——————— 引导 & 咬一口提示 ———————
let guideT = 0;
function updateGuide(dt) {
  const stage = !hints.swipe ? 'swipe' : !hints.peel ? 'peel' : null;
  const F = frontFruit();
  if (!stage || phase !== 'play' || pointerDown || !F || F.state !== 'peel' || Math.abs(camVel) > 0.05) { guidePointer.classList.remove('show'); return; }
  const dur = stage === 'swipe' ? 1.5 : 2.8;
  guideT = (guideT + dt / dur) % 1;
  const Rr = F.screen.r * 0.75;
  const move = stage === 'swipe' ? Math.min(1, guideT / 0.28) : Math.min(1, guideT / 0.85);
  const e = stage === 'swipe' ? move : move * move * (3 - 2 * move);
  const x = F.screen.x - Rr + 2 * Rr * e, y = F.screen.y + (stage === 'swipe' ? -0.25 : 0.15) * Rr + Math.sin(e * Math.PI) * 0.12 * Rr;
  guidePointer.style.left = `${x - rect.left}px`; guidePointer.style.top = `${y - rect.top}px`;
  guideBubble.textContent = stage === 'swipe' ? '快速划过 → 咔咔碎' : '慢慢拉 → 整片揭下来';
  guidePointer.classList.add('show');
}
function updateBiteHint() {
  let best = null, bd = 1e9;
  for (const F of fruits) if (F.state === 'bite' && F.screen.on && clock > F.biteReadyAt) { const d = Math.abs(F.screen.x - (rect.left + rect.width / 2)); if (d < bd) { bd = d; best = F; } }
  if (!best || pointerDown) { biteHint.classList.remove('show'); return; }
  biteHint.style.left = `${best.screen.x - rect.left}px`;
  biteHint.style.top = `${best.screen.y - rect.top - best.screen.r * 1.45}px`;
  biteHint.textContent = best.bitesDone ? `再咬一口 ${best.bitesDone}/${R.BITES}` : '点一下 · 咬一口';
  biteHint.classList.add('show');
}

// ——————— 指针 ———————
let phase = 'intro';
let pointerDown = false, mode = null, lastX = 0, lastY = 0, lastT = 0, lastMoveClock = 0;
let speed = 0, fast = false, scrR = 100, sweepP = null, strokeFruit = null;
function groundPoint(x, y) {
  setRay(x, y);
  const ray = raycaster.ray, yy = GROUND_Y + 0.1;
  if (Math.abs(ray.direction.y) < 1e-4) return null;
  const t = (yy - ray.origin.y) / ray.direction.y;
  if (t <= 0) return null;
  const p = ray.origin.clone().addScaledVector(ray.direction, t);
  return Math.hypot(p.x, p.z) < ISLAND_R ? p : null;
}
function endStroke() {
  if (sheet) releaseSheet(false);
  if (strokeCracks >= 4) learn('swipe');
  if (stroke.length > 1) trailFx.push({ pts: stroke, t: 0, kind: 'line', fast });
  stroke = [];
  peelLoop.stop();
  // 拉近看的时候，松手后镜头慢慢把刚才剥的那颗转到正中
  if (strokeFruit && zoom < 0.35) camTarget = camA + angDiff(strokeFruit.angle, camA);
}
const touches = new Map();
let primaryId = null, pinch0 = null, downX = 0, downY = 0, lastTap = { t: -9, x: 0, y: 0 };
const pinchDist = () => { const p = [...touches.values()]; return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
canvas.addEventListener('pointerdown', (e) => {
  if (phase !== 'play') return;
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  if (touches.size === 2) {
    // 第二根手指落下：结束正在剥的这一笔，改成捏合缩放
    if (mode === 'peel') endStroke();
    mode = 'pinch'; pinch0 = { d: Math.max(20, pinchDist()), zoom: zoomT };
    return;
  }
  if (touches.size > 2) return;
  primaryId = e.pointerId; downX = e.clientX; downY = e.clientY;
  rect = canvas.getBoundingClientRect();
  pointerDown = true; lastX = e.clientX; lastY = e.clientY; lastT = e.timeStamp;
  mode = null; strokeFruit = null;
  updateFruitScreens();
  const h = pickAt(e.clientX, e.clientY, nearFruits(e.clientX, e.clientY, e.clientX, e.clientY, 1.6));
  if (h?.F) {
    const F = h.F;
    if (F.state === 'bite') { doBite(F, e.clientX, e.clientY); return; }
    if (F.state === 'peel') {
      mode = 'peel'; speed = 0; fast = false; swipeK = 0; strokeCracks = 0; strokeFruit = F; camTarget = null; camVel = 0;
      scrR = F.screen.r;
      stroke = [{ x: e.clientX, y: e.clientY }];
      if (h.g) joinSheet(h.g);
      return;
    }
  }
  // 咬一口：点在果子附近就算，不用点得很准
  for (const F of nearFruits(e.clientX, e.clientY, e.clientX, e.clientY, 1.35)) if (F.state === 'bite') { doBite(F, e.clientX, e.clientY); return; }
  const p = groundPoint(e.clientX, e.clientY);
  if (p && pileNear(p, 0.32) >= 3) { mode = 'sweep'; sweepP = p; stirPile(p, new V3(), 0.016, true); return; }
  mode = 'orbit'; camTarget = null; camVel = 0;
});
function onMove(e) {
  if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (mode === 'pinch') {
    if (touches.size >= 2 && pinch0) zoomT = Math.max(0, Math.min(1, pinch0.zoom - Math.log(pinchDist() / pinch0.d) * 0.9));
    return;
  }
  if (!pointerDown || e.pointerId !== primaryId) return;
  const x = e.clientX, y = e.clientY;
  const dx = x - lastX, dy = y - lastY;
  const dtm = Math.max(1, e.timeStamp - lastT);
  if (mode === 'peel') {
    const inst = Math.hypot(dx, dy) / dtm * 1000 / scrR;
    const w = Math.min(0.8, dtm / 40);
    speed = speed * (1 - w) + inst * w;
    if (!fast && speed > 4.8) fast = true;
    else if (fast && speed < 3.0) fast = false;
    if (Math.hypot(dx, dy) > 1.5) dragWorld.lerp(camRight().multiplyScalar(dx).addScaledVector(camUp(), -dy).normalize(), 0.4).normalize();
    if (fast && sheet) { if (sheet.members.length <= 2 && clock - sheet.born < 0.25) sheetToShatter(); else releaseSheet(true); }
    updateFruitScreens();
    for (const g of shellsAlong(lastX, lastY, x, y)) { if (fast) crackShell(g); else joinSheet(g); }
    addStrokePoint(x, y);
    lastMoveClock = clock;
  } else if (mode === 'sweep') {
    const p = groundPoint(x, y);
    if (p && sweepP) stirPile(p, p.clone().sub(sweepP), dtm / 1000);
    sweepP = p;
  } else if (mode === 'orbit') {
    const k = 0.0048;
    camA -= dx * k;
    camVel = camVel * 0.5 + (-dx * k / (dtm / 1000)) * 0.5;
    pitchT = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitchT + dy * 0.0042));
  }
  lastX = x; lastY = y; lastT = e.timeStamp;
}
window.addEventListener('pointermove', onMove);
function toggleOverview() {
  const far = zoomT < 0.5;
  zoomT = far ? 0.9 : 0; pitchT = far ? 0.95 : 0.42;
  audio.sfx.rotate();
}
function onUp(e) {
  touches.delete(e.pointerId);
  if (mode === 'pinch') { if (touches.size === 0) { mode = null; pointerDown = false; pinch0 = null; } return; }
  if (!pointerDown || e.pointerId !== primaryId) return;
  pointerDown = false;
  if (mode === 'peel') endStroke();
  if (mode === 'orbit') {
    camVel = Math.max(-2.4, Math.min(2.4, camVel));
    // 在空白处点两下：特写 <-> 全景
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 8) {
      if (clock - lastTap.t < 0.32 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40) { toggleOverview(); lastTap.t = -9; }
      else lastTap = { t: clock, x: e.clientX, y: e.clientY };
    }
  }
  mode = null; sweepP = null;
}
canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (phase === 'play') zoomT = Math.max(0, Math.min(1, zoomT + e.deltaY * 0.0011)); }, { passive: false });
window.addEventListener('pointerup', onUp);
window.addEventListener('pointercancel', onUp);

function startGame() {
  if (phase !== 'intro') return;
  introOverlay.classList.remove('show');
  phase = 'play';
  camTarget = camA + angDiff(Math.round(camA / (TAU / R.SLOTS)) * (TAU / R.SLOTS), camA);
  if (!audio.muted && audio.unlock()) audio.setMode('calm');
}
introStartBtn.addEventListener('click', () => { audio.sfx.tap(); startGame(); });

// ——————— 2D 轨迹 ———————
function strokePath(pts, close) { tctx.beginPath(); pts.forEach((p, i) => (i ? tctx.lineTo(p.x, p.y) : tctx.moveTo(p.x, p.y))); if (close) tctx.closePath(); }
function drawGlowLine(pts, close, rgb, alpha, width) {
  tctx.lineJoin = 'round'; tctx.lineCap = 'round';
  strokePath(pts, close);
  tctx.strokeStyle = `rgba(${rgb},${0.28 * alpha})`; tctx.lineWidth = width * 3.2; tctx.stroke();
  tctx.strokeStyle = `rgba(${rgb},${0.9 * alpha})`; tctx.lineWidth = width; tctx.stroke();
  tctx.strokeStyle = `rgba(255,255,255,${alpha})`; tctx.lineWidth = Math.max(1, width * 0.4); tctx.stroke();
}
const hexRgb = h => `${(h >> 16) & 255},${(h >> 8) & 255},${h & 255}`;
const FAST_RGB = '255,120,180', SLOW_RGB = '255,184,72';
function drawTrail(dt) {
  tctx.clearRect(0, 0, rect.width + rect.left, rect.height + rect.top);
  tctx.save();
  tctx.translate(-rect.left, -rect.top);
  if (mode === 'peel' && stroke.length > 1) drawGlowLine(stroke.slice(-40), false, fast ? FAST_RGB : SLOW_RGB, 0.85, fast ? 3 : 5);
  for (let i = trailFx.length - 1; i >= 0; i--) {
    const f = trailFx[i];
    f.t += dt;
    if (f.kind === 'line') {
      const a = 1 - f.t / 0.25;
      if (a <= 0) { trailFx.splice(i, 1); continue; }
      drawGlowLine(f.pts.slice(-40), false, f.fast ? FAST_RGB : SLOW_RGB, 0.8 * a, f.fast ? 3 : 5);
    } else {
      const u = Math.min(1, f.t / 0.42), e = u * u;
      if (f.t > 0.6) { trailFx.splice(i, 1); continue; }
      let cx = 0, cy = 0; for (const p of f.pts) { cx += p.x; cy += p.y; } cx /= f.pts.length; cy /= f.pts.length;
      const k = 1 - e * 0.82;
      const pts = f.pts.map(p => ({ x: cx + (p.x - cx) * k, y: cy + (p.y - cy) * k }));
      const rgb = hexRgb(f.color);
      const a = f.t < 0.42 ? 1 : 1 - (f.t - 0.42) / 0.18;
      strokePath(pts, true);
      tctx.fillStyle = `rgba(${rgb},${0.22 * a})`; tctx.fill();
      drawGlowLine(pts, true, rgb, a, 5 + e * 6);
    }
  }
  tctx.restore();
}

// ——————— 主循环 ———————
function stepWorld(dt) {
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i];
    d.life -= dt;
    if (!d.rest) {
      d.vel.y -= 9.2 * dt;
      d.mesh.position.addScaledVector(d.vel, dt);
      tmpQ.setFromEuler(tmpE.set(d.ang.x * dt, d.ang.y * dt, d.ang.z * dt));
      d.mesh.quaternion.multiply(tmpQ);
      const p = d.mesh.position;
      const floor = floorAt(p.x, p.z) + d.rad;
      if (p.y < floor && floor > GROUND_Y - 1 && d.vel.y < 0) {
        const impact = -d.vel.y;
        p.y = floor;
        d.vel.y = impact * (d.kind === 'crumb' ? 0.25 : 0.32);
        d.vel.x *= 0.55; d.vel.z *= 0.55; d.ang.multiplyScalar(0.5);
        if (d.kind === 'shard' && impact > 1.4 && tinkleBudget > 0) { tinkleBudget--; audio.sfx.tinkle(d.size, Math.min(1, impact / 5)); }
        if (impact < 0.7) {
          d.rest = true; d.vel.set(0, 0, 0);
          if (d.kind === 'shard' && toPile(d)) { debris.splice(i, 1); continue; }
        }
      }
      if (p.y < GROUND_Y - 3) d.life = 0;
    }
    if (d.life < 0.35 && d.life > 0) d.mesh.scale.copy(d.baseScale).multiplyScalar(Math.max(0.01, d.life / 0.35));
    if (d.life <= 0) { scene.remove(d.mesh); disposeGeo(d.mesh.geometry); debris.splice(i, 1); }
  }
  for (let i = sprites.length - 1; i >= 0; i--) {
    const p = sprites[i];
    p.life -= dt;
    const k = Math.max(0, p.life / p.max);
    if (p.ring) {
      const sc = p.size * (1 - k * k) + 0.05;
      p.s.scale.set(sc, sc, p.torus ? 1 : sc);
      p.s.material.opacity = k;
    } else {
      p.vel.y -= p.grav * dt;
      p.vel.multiplyScalar(Math.max(0, 1 - p.drag * dt));
      p.s.position.addScaledVector(p.vel, dt);
      p.s.scale.setScalar(p.size * Math.sin(k * Math.PI) * (0.6 + 0.4 * Math.sin(p.life * 40 + i)) + 0.001);
      p.s.material.rotation += p.spin * dt;
      p.s.material.opacity = Math.min(1, k * 2);
    }
    if (p.life <= 0) { scene.remove(p.s); p.s.material.dispose(); if (p.torus) p.s.geometry.dispose(); sprites.splice(i, 1); }
  }
  hitLight.intensity *= Math.exp(-dt * 14);
}

function stepFruit(F, dt) {
  if (F.state === 'empty') { if (clock > F.regrowAt) regrow(F); return; }
  if (F.state === 'grow') stepGrow(F, dt);
  if (F.state === 'bite') {
    const to = camera.position.clone().sub(F.pivot.position);
    const target = Math.atan2(to.x, to.z);
    F.rotY += angDiff(target, F.rotY) * Math.min(1, dt * 4);
  } else if (F.state !== 'pop') F.rotY += dt * 0.22;
  F.wobV += (-260 * F.wob - 11 * F.wobV) * dt; F.wob += F.wobV * dt;
  F.tiltV += (-180 * F.tilt - 9 * F.tiltV) * dt; F.tilt += F.tiltV * dt;
  const sq = Math.max(-0.4, Math.min(0.4, F.wob));
  let k = F.state === 'grow' ? F.pivot.scale.x : 1, hop = 0;
  if (F.state === 'pop') { F.popT += dt; const u = Math.min(1, F.popT / 0.5); k = Math.max(0.001, 1 - u * u); hop = Math.sin(u * Math.PI) * 0.5; F.rotY += dt * 8; }
  F.pivot.rotation.set(0, F.rotY, F.tilt * 0.35);
  F.pivot.scale.set((1 + sq * 0.5) * k, (1 - sq * 0.55) * k, (1 + sq * 0.5) * k);
  if (F.state !== 'grow') F.pivot.position.set(F.base.x, F.base.y - sq * 0.25 + hop, F.base.z);
  F.pivot.updateMatrixWorld(true);
  if (F.U) F.U.mat.value.copy(F.pivot.matrixWorld).invert();
  if (F.moodT > 0) { F.moodT -= dt; if (F.moodT <= 0 && F.state === 'peel') F.face?.setMood('normal'); }
  F.blinkT -= dt;
  const bk = F.blinkT < 0.12 && F.blinkT > 0 ? Math.abs(Math.sin((F.blinkT / 0.12) * Math.PI)) : 0;
  if (F.blinkT <= 0) F.blinkT = 2 + Math.random() * 3;
  if (F.face) for (const e of F.face.blinkers) e.scale.y = 1 - bk * 0.9;
  for (const g of F.meshes) {
    if (g.parent !== F.pivot || g.userData.peel) continue;
    for (const s of g.userData.glints) { const kk = Math.pow(Math.max(0, Math.sin(clock * 1.7 + s.userData.phase)), 14); s.scale.setScalar(0.02 + kk * 0.2); }
  }
  // 剥光（手里/空中也没有它的壳）→ 等着咬
  if (F.state === 'peel' && F.meshes.every(g => g.userData.gone)) enterBite(F);
}

let clock = 0, frameNo = 0;
function step(dt) {
  clock += dt;
  tinkleBudget = Math.min(3, tinkleBudget + dt * 18);
  // 镜头：拖动 → 惯性 → 吸附到最近的果子
  camPitch += (pitchT - camPitch) * Math.min(1, dt * 8);
  zoom += (zoomT - zoom) * Math.min(1, dt * 6);
  if (!(pointerDown && mode === 'orbit')) {
    if (phase === 'intro') camA += dt * 0.12;
    else if (camTarget !== null) { camA += (camTarget - camA) * Math.min(1, dt * 3.2); if (Math.abs(camTarget - camA) < 0.002) { camA = camTarget; camTarget = null; } }
    else if (Math.abs(camVel) > 0.5) { camA += camVel * dt; camVel *= Math.exp(-dt * 6); }
    else if (!pointerDown && zoomT < 0.35 && mode !== 'pinch') { camVel = 0; const slot = TAU / R.SLOTS; camTarget = camA + angDiff(Math.round(camA / slot) * slot, camA); }
    else camVel = 0;
  }
  shakeAmp *= Math.exp(-dt * 12);
  placeCamera();
  updateFruitScreens();
  // 手指按住不动：果子在慢慢转，指尖下的壳照样被揭起来
  if (pointerDown && mode === 'peel') {
    if (clock - lastMoveClock > 0.04) { speed *= Math.exp(-dt * 10); if (fast && speed < 3) fast = false; }
    if (!fast && clock - lastMoveClock > 0.03) for (const g of shellsAlong(lastX, lastY, lastX, lastY)) joinSheet(g);
  }
  for (const F of fruits) stepFruit(F, dt);
  stepSheet(dt);
  stepFlying(dt);
  stepWorld(dt);
  stepPile(dt);
  stepPour(dt);
  if (phase === 'play') { updateGuide(dt); updateBiteHint(); }
  frameNo++;
  if (frameNo % 2 === 0) renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
  drawTrail(dt);
}

let lastNow = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000));
  lastNow = now;
  step(dt);
  requestAnimationFrame(frame);
}

if (location.search.includes('dev')) {
  window.__game = {
    get state() { return { phase, camA: +camA.toFixed(3), front: frontFruit()?.k, fruits: fruits.map(F => `${F.k}:${F.state}:${F.ti}:${F.shells.filter(s => !s.peeled).length}`).join(' '), sheet: sheet ? sheet.members.length : 0, flying: flying.length, pile: aliveCount(), pileVerts: pile?.verts, jar: { total: jar.total, layers: jar.layers.length, full: jar.full }, eaten, hints: { ...hints }, fast, speed: +speed.toFixed(2) }; },
    front() { const F = frontFruit(); return { k: F.k, x: F.screen.x, y: F.screen.y, r: F.screen.r, state: F.state }; },
    slot(k) { const F = fruits[k]; return { x: F.screen.x, y: F.screen.y, r: F.screen.r, on: F.screen.on, state: F.state }; },
    clearFront() { const F = frontFruit(); let n = 0; for (const g of F.meshes) if (markPeeled(g)) { shatterGroup(g, { lite: true }); n++; } return n; },
    biteFront() { const F = frontFruit(); if (F.state === 'bite') { F.biteReadyAt = 0; doBite(F, F.screen.x, F.screen.y); } return F.bitesDone; },
    eatFront() { const F = frontFruit(); for (const g of F.meshes) if (markPeeled(g)) shatterGroup(g, { lite: true }); return F.k; },
    regrowAll() { for (const F of fruits) if (F.state === 'empty') F.regrowAt = 0; },
    pour() { startPour(); },
    spin(a) { camA = a; camTarget = null; camVel = 0; },
    view(pitch, z) { pitchT = camPitch = pitch; zoomT = zoom = z; },
    get cam() { return { camA: +camA.toFixed(3), pitch: +camPitch.toFixed(3), zoom: +zoom.toFixed(3) }; },
    dbg(k) { const F = fruits[k]; const out = []; F.core.traverse(o => { if (!o.isMesh) return; const pr = renderer.properties.get(o.material); out.push([o.geometry.type, o.material.side, !!o.material.userData.bite, pr.uniforms ? pr.uniforms.uBites === F.U.bites : null, o.visible]); }); return { bites: F.U.bites.value.map(v => v.w), mat: F.U.mat.value.elements.map(x => +x.toFixed(2)), out: out.slice(0, 6) }; },
    hideShells(k) { for (const g of fruits[k].meshes) g.visible = false; },
    get fx() { return { debris: debris.length, sprites: sprites.length, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; },
  };
}

// 预热：所有果子（带咬痕着色器）、糖壳、碎糖堆、晶洞、奖品的着色器先编译
function warmupShaders() {
  const g = new THREE.Group();
  for (const c of Object.keys(COLOR_STYLE)) g.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), makeShellMat(c)));
  for (let i = 0; i < R.FRUITS.length; i++) { const fr = cacheType(i).core.clone(true); fr.traverse(o => { if (o.isMesh) o.material = o.material.clone(); }); fr.add(M.buildFace(R.FRUITS[i].fruit).root); addBiteShader(fr, biteUniforms('#ffffff')); g.add(fr); }
  g.add(new THREE.Mesh(dropGeo, juiceMat(0xff5a7a)));
  const bm = new THREE.BatchedMesh(2, 200, 0, pileMat); bm.addInstance(bm.addGeometry(new THREE.TetrahedronGeometry(0.1))); bm.setColorAt(0, tmpC.set('#ff8fc4'));
  g.add(bm);
  g.position.copy(camLook);
  scene.add(g);
  try { renderer.compile(scene, camera); } catch {}
  scene.remove(g);
  bm.dispose();
}

// ——————— 开局：岛上种满果子 ———————
resize();
newPile();
const startTypes = [0, 1, 2, 3, 4, 5, 0, 2].sort(() => Math.random() - 0.5);
fruits.forEach((F, i) => spawnFruit(F, startTypes[i], false));
updateLabel();
drawJar(jarCanvas, jar);
syncHintCard();
placeCamera();
introOverlay.classList.add('show');
warmupShaders();
requestAnimationFrame(frame);
