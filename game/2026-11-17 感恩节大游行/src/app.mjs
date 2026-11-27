import * as THREE from '../vendor/three.module.js';
import { ROUTES, BALLOONS, SKILLS, ENERGY_PER_CHARGE, createState, step, useSkill, BALLOON_AHEAD, rankOf, RANKS } from './sim.mjs';
import * as M from './models.mjs';
import { sfx, unlockAudio, setSound, soundOn, startMusic, stopMusic } from './audio.mjs';

const $ = (id) => document.getElementById(id);
const SKILL_BTNS = [...document.querySelectorAll('#skills .skill')];
for (const b of SKILL_BTNS) { b._cnt = b.querySelector('.cnt'); b._tm = b.querySelector('.tm'); }
const ENERGY_CIRCLE = document.querySelector('#skills .skill[data-skill="shield"] .energy circle');
const SAVE_KEY = 'tg-parade-v1';
const DEFAULT_SAVE = {
  best: {}, bestDist: 0, bestScore: 0, sound: true, balloon: 'turkey', route: 1, coins: 0,
  owned: { hat: ['none'], glasses: ['none'], neck: ['none'], skin: ['classic'], trail: ['none'], uniform: ['red'] },
  equip: { hat: 'none', glasses: 'none', neck: 'none', skin: 'classic', trail: 'none', uniform: 'red' },
};
const save = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return { ...DEFAULT_SAVE, ...s, owned: { ...DEFAULT_SAVE.owned, ...(s.owned || {}) }, equip: { ...DEFAULT_SAVE.equip, ...(s.equip || {}) } };
  } catch { return structuredClone(DEFAULT_SAVE); }
})();
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* ignore */ } }
const outfit = (over = {}) => ({ hat: save.equip.hat, glasses: save.equip.glasses, neck: save.equip.neck, skin: save.equip.skin, trail: save.equip.trail, ...over });

// ---------- three ----------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe6f2);
scene.fog = new THREE.Fog(0xe9dcc4, 70, 165);
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 400);
scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a7a66, 1.35));
const sun = new THREE.DirectionalLight(0xffe6c0, 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 22, bottom: -22, near: 1, far: 80 });
sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);

function resize() {
  const W = window.innerWidth, H = window.innerHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.fov = W > H ? 50 : 62;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- 世界对象 ----------
const chunks = new Map();
const itemObjs = new Map();
let finishObj = null;
let balloon = null;
let walkers = [];
function buildCrew() {
  for (const w of walkers) scene.remove(w.root);
  walkers = [];
  const u = M.UNIFORMS[save.equip.uniform] || M.UNIFORMS.red;
  for (let i = 0; i < 24; i++) {
    const w = M.buildWalker(u.body, false, u);
    w.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    w.root.visible = false;
    w.state = 'off';
    scene.add(w.root);
    walkers.push(w);
  }
}
buildCrew();
const ropeGeo = new THREE.BufferGeometry();
const ropePos = new Float32Array(24 * 2 * 3);
ropeGeo.setAttribute('position', new THREE.BufferAttribute(ropePos, 3));
const ropes = new THREE.LineSegments(ropeGeo, new THREE.LineBasicMaterial({ color: 0xf4f1e8 }));
ropes.frustumCulled = false;
scene.add(ropes);
const fallers = [];
const particles = [];
const flyers = []; // 被磁铁吸来的星星 / 被撞飞的障碍

// ---------- 状态 ----------
const app = { phase: 'home', s: null, input: { targetX: 0, pull: false }, keys: {}, acc: 0, seenTypes: new Set(), hintTimer: 0, shake: 0, camX: 0, routeId: save.route, balloonKey: save.balloon, finishT: 0, swipeShown: false, shopTab: 'hat' };

function routeUnlocked(r) {
  if (r.id === 1) return true;
  if (r.id === 4) return (save.best[1] || 0) > 0;
  return (save.best[r.id - 1] || 0) > 0;
}
function balloonUnlocked(k) {
  const u = BALLOONS[k].unlock;
  return u === 0 || (save.best[u] || 0) > 0;
}

// ---------- 预览图（气球 + 装扮） ----------
const pr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
pr.setPixelRatio(1); pr.setSize(240, 240); pr.outputColorSpace = THREE.SRGBColorSpace; pr.toneMapping = THREE.ACESFilmicToneMapping; pr.toneMappingExposure = 1.15;
const prScene = new THREE.Scene();
prScene.add(new THREE.HemisphereLight(0xffffff, 0xd9c2a0, 1.5));
const prKey = new THREE.DirectionalLight(0xffffff, 2.2); prKey.position.set(3, 5, 9); prScene.add(prKey);
const prRim = new THREE.DirectionalLight(0xffe2b0, 1.2); prRim.position.set(-6, 3, -6); prScene.add(prRim);
const prCam = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
const _box = new THREE.Box3(), _sph = new THREE.Sphere();
function snap(obj, { turn = 0.45, size = 240, pad = 1.08, lift = 0, elev = 0.15 } = {}) {
  pr.setSize(size, size);
  obj.rotation.y += turn;
  prScene.add(obj);
  obj.updateMatrixWorld(true);
  _box.setFromObject(obj); _box.getBoundingSphere(_sph);
  const dist = (_sph.radius * pad) / Math.sin(THREE.MathUtils.degToRad(prCam.fov / 2));
  const ev = Math.atan(elev);
  prCam.position.set(_sph.center.x, _sph.center.y + Math.sin(ev) * dist + lift, _sph.center.z + Math.cos(ev) * dist);
  prCam.lookAt(_sph.center.x, _sph.center.y + lift, _sph.center.z);
  pr.render(prScene, prCam);
  prScene.remove(obj);
  return pr.domElement.toDataURL('image/png');
}
function balloonPic(key, of = outfit(), turn = 0.45) {
  const b = M.buildBalloon(key, BALLOONS[key], of);
  b.root.rotation.y = Math.PI;
  M.animateFace(b.face, 0.5, 'idle', 30);
  return snap(b.root, { turn });
}

// ---------- 首页 ----------
function showHome() {
  app.phase = 'home';
  stopMusic();
  $('overlay').classList.remove('hidden');
  for (const id of ['shop', 'pause', 'result']) $(id).hidden = true;
  $('home').hidden = false;
  for (const id of ['hud', 'stats', 'controls', 'hint', 'wind-warn', 'cue']) $(id).hidden = true;
  if (!balloonUnlocked(app.balloonKey)) app.balloonKey = 'turkey';
  if (!routeUnlocked(ROUTES.find((r) => r.id === app.routeId))) app.routeId = 1;
  const rank = rankOf(save.bestScore || 0);
  $('rank-badge').textContent = `${rank.icon} ${rank.name} · 最高 ${save.bestScore || 0}`;
  $('coin-home').textContent = save.coins;
  $('home-preview').src = balloonPic(app.balloonKey);
  const bg = $('balloon-grid'); bg.innerHTML = '';
  for (const k in BALLOONS) {
    const b = BALLOONS[k];
    const ok = balloonUnlocked(k);
    const el = document.createElement('button');
    el.className = 'bl' + (k === app.balloonKey ? ' sel' : '');
    el.disabled = !ok;
    el.innerHTML = `<img src="${balloonPic(k, { hat: 'none', glasses: 'none', neck: 'none' })}" alt=""><b>${ok ? b.name : '🔒 ' + b.name}</b><small>${ok ? b.desc : `通关「${ROUTES[b.unlock - 1].name}」解锁`}</small>`;
    el.onclick = () => { unlockAudio(); sfx.click(); app.balloonKey = k; showHome(); };
    bg.appendChild(el);
  }
  const rg = $('route-grid'); rg.innerHTML = '';
  for (const r of ROUTES) {
    const ok = routeUnlocked(r);
    const st = save.best[r.id] || 0;
    const el = document.createElement('button');
    el.className = 'rt' + (r.id === app.routeId ? ' sel' : '');
    el.disabled = !ok;
    const tail = r.length === Infinity ? `最远 ${save.bestDist || 0} m` : `${'★'.repeat(st)}${'☆'.repeat(3 - st)}`;
    el.innerHTML = `<b>${ok ? '' : '🔒 '}${r.name}</b><small>${r.sub}${r.length !== Infinity ? ` · ${r.length} m` : ''}</small><span class="st">${tail}</span>`;
    el.onclick = () => { unlockAudio(); sfx.click(); app.routeId = r.id; showHome(); };
    rg.appendChild(el);
  }
}

// ---------- 商店：3D 展台 + 试穿 + 稀有度 ----------
const SHOP_TABS = [
  { id: 'hat', name: '帽子' }, { id: 'glasses', name: '脸饰' }, { id: 'neck', name: '围脖' },
  { id: 'skin', name: '皮肤' }, { id: 'trail', name: '拖尾' }, { id: 'uniform', name: '队服' },
];
const catalog = (tab) => (tab === 'uniform' ? M.UNIFORMS : M.OUTFITS[tab]);
const stage = { renderer: null, scene: null, cam: null, balloon: null, walkers: [], ring: null, glow: null, parts: [], emitT: 0, spinT: 0, sparkle: [] };
function initStage() {
  if (stage.renderer) return;
  const c = $('stage-canvas');
  stage.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
  stage.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.renderer.outputColorSpace = THREE.SRGBColorSpace; stage.renderer.toneMapping = THREE.ACESFilmicToneMapping; stage.renderer.toneMappingExposure = 1.15;
  stage.scene = new THREE.Scene();
  stage.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9c2a0, 1.4));
  const k = new THREE.DirectionalLight(0xffffff, 2.2); k.position.set(3, 6, 10); stage.scene.add(k);
  const r = new THREE.DirectionalLight(0xffd9a0, 1.4); r.position.set(-6, 4, -6); stage.scene.add(r);
  stage.cam = new THREE.PerspectiveCamera(30, 1.6, 0.1, 100);
  // 展台：圆盘 + 稀有度光圈
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.5, 48), new THREE.MeshStandardMaterial({ color: 0xfff1d6, roughness: 0.5 }));
  disc.position.y = -0.25; stage.scene.add(disc);
  stage.ring = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.12, 8, 64), new THREE.MeshBasicMaterial({ color: 0x7a9a6a }));
  stage.ring.rotation.x = Math.PI / 2; stage.ring.position.y = 0.02; stage.scene.add(stage.ring);
  const gc = document.createElement('canvas'); gc.width = 4; gc.height = 128;
  const gx = gc.getContext('2d'); const gr = gx.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff'); gx.fillStyle = gr; gx.fillRect(0, 0, 4, 128);
  const fade = new THREE.CanvasTexture(gc);
  stage.glow = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.3, 9, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8a21a, alphaMap: fade, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  stage.glow.position.y = 4.5; stage.scene.add(stage.glow);
}
function rebuildStage() {
  initStage();
  const t = app.tryOn;
  const over = t && t.tab !== 'uniform' ? { [t.tab]: t.key } : {};
  if (stage.balloon) stage.scene.remove(stage.balloon.root);
  stage.balloon = M.buildBalloon(app.balloonKey, BALLOONS[app.balloonKey], outfit(over));
  stage.balloon.root.rotation.y = Math.PI;
  stage.scene.add(stage.balloon.root);
  for (const w of stage.walkers) stage.scene.remove(w.root);
  const uKey = t && t.tab === 'uniform' ? t.key : save.equip.uniform;
  const u = M.UNIFORMS[uKey];
  stage.walkers = [-1.9, 0, 1.9].map((x, i) => {
    const w = M.buildWalker(u.body, false, u);
    w.root.position.set(x, 0, 2.6 - (i === 1 ? 0.4 : 0));
    w.root.scale.setScalar(1.25);
    w.arms[0].rotation.x = -2.6; w.arms[1].rotation.x = -2.6;
    stage.scene.add(w.root);
    return w;
  });
  const item = t ? catalog(t.tab)[t.key] : null;
  const rar = M.RARITY[item ? item.rarity : 0];
  stage.ring.material.color.set(rar.color);
  stage.glow.material.color.set(rar.color);
  stage.glow.material.opacity = item && item.rarity >= 2 ? (item.rarity === 3 ? 0.55 : 0.35) : 0;
  for (const p of stage.parts) stage.scene.remove(p.o);
  stage.parts = [];
  $('stage-name').innerHTML = `${BALLOONS[app.balloonKey].name}`;
  stage.balloon.root.position.y = 4.6;
  stage.balloon.root.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(stage.balloon.inner);
  stage.top = Math.max(bb.max.y, 7) + 0.6;
  resizeStage();
}
function resizeStage() {
  const c = $('stage-canvas');
  const w = c.clientWidth || 320, h = c.clientHeight || 220;
  stage.renderer.setSize(w, h, false);
  stage.cam.aspect = w / h; stage.cam.updateProjectionMatrix();
}
function renderStage(dt, t) {
  if (!stage.renderer || $('shop').hidden) return;
  const b = stage.balloon;
  stage.spinT += dt;
  b.root.rotation.y = Math.PI + Math.sin(stage.spinT * 0.6) * 0.75;
  b.root.position.y = 4.6 + Math.sin(t * 1.6) * 0.15;
  M.animateBalloon(b, t, dt);
  stage.walkers.forEach((w, i) => { w.body.position.y = Math.abs(Math.sin(t * 6 + i)) * 0.1; w.legs[0].rotation.x = Math.sin(t * 6 + i) * 0.3; w.legs[1].rotation.x = -Math.sin(t * 6 + i) * 0.3; });
  stage.ring.material.opacity = 1;
  // 试穿/已装备的拖尾在展台上循环播放
  const t2 = app.tryOn && app.tryOn.tab === 'trail' ? app.tryOn.key : save.equip.trail;
  stage.emitT -= dt;
  if (t2 !== 'none' && stage.emitT <= 0) {
    stage.emitT = 0.07;
    const o = M.trailParticle(t2, Math.floor(t * 20));
    const a = t * 2.2;
    o.position.set(b.root.position.x + Math.cos(a) * 3.0, b.root.position.y - 1 + Math.sin(a * 1.3) * 1.2, Math.sin(a) * 2.2 - 0.5);
    stage.scene.add(o);
    stage.parts.push({ o, life: 1.4, v: new THREE.Vector3((Math.random() - 0.5) * 0.6, -0.6, 0.4) });
  }
  // 购买时的闪光
  for (const list of [stage.parts, stage.sparkle]) for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.life -= dt;
    p.o.position.addScaledVector(p.v, dt);
    if (p.o.material) p.o.material.opacity = Math.max(0, Math.min(1, p.life * 1.5));
    if (p.life <= 0) { stage.scene.remove(p.o); list.splice(i, 1); }
  }
  // 从地面到帽顶整体入镜
  const top = stage.top || 9, half = top / 2 + 0.3;
  const vf = THREE.MathUtils.degToRad(stage.cam.fov / 2);
  const dH = half / Math.tan(vf), dW = 5.2 / (Math.tan(vf) * stage.cam.aspect);
  const dist = Math.max(dH, dW) + 3;
  stage.cam.position.set(0, half + 1.4, dist); stage.cam.lookAt(0, half - 0.2, 0);
  stage.renderer.render(stage.scene, stage.cam);
}
function stageSparkle() {
  for (let i = 0; i < 40; i++) {
    const o = M.trailParticle(i % 2 ? 'sparkle' : 'confetti', i);
    o.position.set((Math.random() - 0.5) * 2, 4.5 + (Math.random() - 0.5) * 2, 0);
    stage.scene.add(o);
    const a = Math.random() * Math.PI * 2;
    stage.sparkle.push({ o, life: 1.1, v: new THREE.Vector3(Math.cos(a) * 6, Math.random() * 6 - 1, Math.sin(a) * 3) });
  }
}

// 缩略图：渲染物品本身
const thumbCache = new Map();
function itemThumb(tab, key) {
  const ck = `${tab}:${key}:${tab === 'skin' ? app.balloonKey : ''}`;
  if (thumbCache.has(ck)) return thumbCache.get(ck);
  let url = '';
  if (key === 'none') url = '';
  else if (tab === 'hat') url = snap(M.buildHat(key), { turn: 0.5, size: 160, pad: 0.82, elev: 0.55 });
  else if (tab === 'glasses') { const g = M.buildGlasses(key); g.rotation.y = Math.PI; url = snap(g, { turn: 0.35, size: 160, pad: 0.9 }); }
  else if (tab === 'neck') { const g = M.buildNeck(key, 0.75); g.rotation.x = 0.5; g.rotation.y = Math.PI; url = snap(g, { turn: 0.2, size: 160, pad: 0.9, elev: 0.3 }); }
  else if (tab === 'skin') { const b = M.buildBalloon(app.balloonKey, BALLOONS[app.balloonKey], { skin: key }); b.root.rotation.y = Math.PI; M.animateFace(b.face, 0.5, 'idle', 30); url = snap(b.root, { turn: 0.4, size: 160, pad: 0.8 }); }
  else if (tab === 'uniform') { const u = M.UNIFORMS[key]; const w = M.buildWalker(u.body, false, u); w.root.rotation.y = Math.PI; w.arms[0].rotation.x = -2.6; w.arms[1].rotation.x = -2.6; url = snap(w.root, { turn: 0.5, size: 160, pad: 1.05 }); }
  else if (tab === 'trail') {
    const g = new THREE.Group();
    const boost = key === 'confetti' ? 2.2 : key === 'rainbow' ? 1.25 : 1;
    for (let i = 0; i < 9; i++) { const o = M.trailParticle(key, key === 'rainbow' ? i * 2 : i); o.position.set(-2 + i * 0.5, Math.sin(i * 0.9) * 0.6 - i * 0.05, 0); o.scale.multiplyScalar((1 - i * 0.05) * boost); g.add(o); }
    url = snap(g, { turn: 0, size: 160, pad: 1.0 });
  }
  thumbCache.set(ck, url);
  return url;
}

function showShop() {
  $('home').hidden = true; $('shop').hidden = false;
  app.tryOn = null;
  rebuildStage();
  renderShop();
}
function renderShop() {
  $('coin-shop').textContent = save.coins;
  const tab = app.shopTab;
  $('shop-tabs').innerHTML = SHOP_TABS.map((t) => `<button data-tab="${t.id}" class="${t.id === tab ? 'sel' : ''}">${t.name}</button>`).join('');
  $('shop-tabs').querySelectorAll('button').forEach((b) => { b.onclick = () => { sfx.click(); app.shopTab = b.dataset.tab; app.tryOn = null; rebuildStage(); renderShop(); }; });
  const grid = $('shop-grid'); grid.innerHTML = '';
  const list = catalog(tab);
  for (const key in list) {
    const it = list[key];
    const owned = save.owned[tab].includes(key);
    const on = save.equip[tab] === key;
    const trying = app.tryOn && app.tryOn.tab === tab && app.tryOn.key === key;
    const rar = M.RARITY[it.rarity];
    const el = document.createElement('button');
    el.className = `item r${it.rarity}` + (on ? ' on' : '') + (trying ? ' trying' : '');
    el.style.setProperty('--rc', rar.color);
    const img = itemThumb(tab, key);
    el.innerHTML = `<span class="rar">${rar.name}</span>${img ? `<img src="${img}" alt="">` : '<span class="ic">🚫</span>'}<b>${it.name}</b><small>${on ? '✓ 穿戴中' : owned ? '已拥有' : `<i class="coin"></i>${it.price}`}</small>`;
    el.onclick = () => { unlockAudio(); sfx.click(); app.tryOn = { tab, key }; rebuildStage(); renderShop(); };
    grid.appendChild(el);
  }
  renderShopBar();
}
function renderShopBar() {
  const btn = $('btn-buy');
  const t = app.tryOn;
  if (!t) {
    $('sel-name').textContent = '点任意装扮，展台上先试穿';
    $('sel-rarity').textContent = ''; btn.hidden = true; return;
  }
  const it = catalog(t.tab)[t.key];
  const rar = M.RARITY[it.rarity];
  $('sel-name').textContent = it.name;
  $('sel-rarity').textContent = rar.name; $('sel-rarity').style.background = rar.color;
  btn.hidden = false; btn.disabled = false; btn.className = 'primary';
  const owned = save.owned[t.tab].includes(t.key);
  if (save.equip[t.tab] === t.key) { btn.textContent = '✓ 穿戴中'; btn.disabled = true; }
  else if (owned) btn.textContent = '穿上';
  else if (save.coins >= it.price) btn.innerHTML = `<i class="coin"></i>${it.price} 买下并穿上`;
  else { btn.innerHTML = `金币不足 · 还差 <i class="coin"></i>${it.price - save.coins}`; btn.disabled = true; btn.className = 'primary poor'; }
}
$('btn-buy').onclick = () => {
  const t = app.tryOn; if (!t) return;
  const it = catalog(t.tab)[t.key];
  const owned = save.owned[t.tab].includes(t.key);
  if (!owned) {
    if (save.coins < it.price) return;
    save.coins -= it.price; save.owned[t.tab].push(t.key);
    sfx.win(); stageSparkle();
  } else sfx.cheer();
  save.equip[t.tab] = t.key;
  writeSave();
  if (t.tab === 'uniform') buildCrew();
  renderShop();
};
$('stage-prev').onclick = () => cycleStageBalloon(-1);
$('stage-next').onclick = () => cycleStageBalloon(1);
function cycleStageBalloon(dir) {
  const keys = Object.keys(BALLOONS).filter(balloonUnlocked);
  const i = keys.indexOf(app.balloonKey);
  app.balloonKey = keys[(i + dir + keys.length) % keys.length];
  sfx.click();
  for (const k of [...thumbCache.keys()]) if (k.startsWith('skin:')) thumbCache.delete(k);
  rebuildStage(); renderShop();
}
$('btn-shop').onclick = () => { unlockAudio(); sfx.click(); showShop(); };
$('btn-shop-back').onclick = () => { sfx.click(); app.tryOn = null; showHome(); };
window.addEventListener('resize', () => { if (stage.renderer && !$('shop').hidden) resizeStage(); });

// ---------- 开局 ----------
function clearWorld() {
  for (const [, o] of itemObjs) scene.remove(o);
  itemObjs.clear();
  for (const [, c] of chunks) scene.remove(c);
  chunks.clear();
  if (finishObj) { scene.remove(finishObj); finishObj = null; }
  if (balloon) { scene.remove(balloon.root); balloon = null; }
  for (const f of fallers) scene.remove(f.root);
  fallers.length = 0;
  for (const p of particles) scene.remove(p.m);
  particles.length = 0;
  for (const f of flyers) scene.remove(f.o);
  flyers.length = 0;
  for (const p of trails) scene.remove(p.o);
  trails.length = 0;
  document.querySelectorAll('.fx').forEach((e) => e.remove());
}

function startRun() {
  unlockAudio();
  const route = ROUTES.find((r) => r.id === app.routeId);
  save.route = app.routeId; save.balloon = app.balloonKey; writeSave();
  clearWorld();
  const seed = route.length === Infinity ? (Date.now() & 0xffff) : route.seed;
  app.s = createState(route, app.balloonKey, seed);
  balloon = M.buildBalloon(app.balloonKey, BALLOONS[app.balloonKey], outfit());
  balloon.root.rotation.y = Math.PI; // 脸朝向拉绳队和镜头
  scene.add(balloon.root);
  for (const w of walkers) { w.state = 'off'; w.root.visible = false; }
  app.input = { targetX: 0, pull: false };
  app.acc = 0; app.shake = 0; app.camX = 0; app.finishT = 0;
  app.seenTypes = new Set();
  app.phase = 'play';
  $('overlay').classList.add('hidden');
  for (const id of ['hud', 'stats', 'controls']) $(id).hidden = false;
  $('cue').hidden = true;
  $('swipe-hand').classList.toggle('hide', app.swipeShown);
  showHint(route.id === 1 ? '🥁 游行开始！在下方左右拖动带队' : `🥁 ${route.name}：${route.sub}！`, 2600);
  syncWorld();
  updateHud(true);
  warmUp();
  startMusic();
}
// 让护盾、磁铁光环、粒子在开局就完成着色器编译
function warmUp() {
  const tmp = [];
  balloon.shield.visible = true; balloon.magnet.visible = true;
  for (const c of [0xffd23a, 0x5ac8ff, 0xff6a6a, 0xffa83a, 0x7fc4ff]) {
    if (!burstMats.has(c)) burstMats.set(c, new THREE.MeshBasicMaterial({ color: c }));
    const m = new THREE.Mesh(BURST_GEO, burstMats.get(c)); m.position.copy(balloon.root.position); scene.add(m); tmp.push(m);
  }
  if (balloon.trail !== 'none') { const o = M.trailParticle(balloon.trail, 0); o.position.copy(balloon.root.position); scene.add(o); tmp.push(o); }
  try { renderer.compile(scene, camera); } catch { /* 旧浏览器忽略 */ }
  balloon.shield.visible = false; balloon.magnet.visible = false;
  for (const o of tmp) scene.remove(o);
}

// ---------- 提示 ----------
const TYPE_HINTS = {
  banner: '🎌 横幅！按住【拉低】钻过去',
  bridge: '🌉 大桥！按住【拉低】钻桥洞',
  arm: '🚦 红绿灯横杆！松手升高 或 走另一边',
  sign: '🪧 高处招牌！别贴着那一侧',
  tree: '🍁 行道树！气球待在路中间',
  cones: '🚧 路障！拉绳队从空的一边绕过',
  cart: '🎃 南瓜推车！从旁边绕开',
  fans: '🙋 路边观众想加入！走过绿圈',
  pump: '💨 打气站！走过蓝圈补气',
  gust: '🌬️ 强风！往反方向拉住',
  gift: '🎁 超能力礼盒！让气球碰到它',
};
function showHint(text, ms = 2400) {
  const h = $('hint');
  h.textContent = text; h.hidden = false;
  h.style.animation = 'none'; void h.offsetWidth; h.style.animation = '';
  clearTimeout(app.hintTimer);
  app.hintTimer = setTimeout(() => { h.hidden = true; }, ms);
}

// 时机提示：前方需要压低/升高/躲开时，在屏幕中间和按钮上闪烁
function updateCue() {
  const s = app.s;
  const cue = $('cue');
  const btn = $('btn-pull');
  const bd = s.d + BALLOON_AHEAD;
  let mode = null;
  if (s.shield <= 0) {
    for (const it of s.items) {
      if (s.taken.has(it.id) || it.ground || ['star', 'fans', 'pump', 'gust', 'gift'].includes(it.type)) continue;
      const ahead = it.d0 - bd;
      if (ahead < -1 || ahead > 16) continue;
      const lat = s.bx + s.b.rx > it.x0 && s.bx - s.b.rx < it.x1;
      if (!lat) continue;
      const needLow = it.y0 >= 5.9 && it.y0 < 7; // 横幅、大桥、招牌底
      const needHigh = it.y1 <= 6.1 && it.y0 > 4; // 红绿灯横杆
      if (needLow && !app.input.pull) { mode = 'low'; break; }
      if (needHigh && app.input.pull) { mode = 'high'; break; }
      if (it.type === 'tree') { mode = 'dodge'; break; }
    }
  }
  if (!mode) {
    for (const it of s.items) {
      if (!it.ground || s.taken.has(it.id)) continue;
      const ahead = it.d0 - s.d;
      if (ahead < 0 || ahead > 9) continue;
      const hw = 0.8 + Math.min(s.crew, 16) * 0.04;
      if (s.crewX + hw > it.x0 && s.crewX - hw < it.x1 && s.shield <= 0) { mode = 'ground'; break; }
    }
  }
  btn.classList.toggle('cue', mode === 'low');
  $('pull-label').textContent = app.input.pull ? '拉低中…' : mode === 'low' ? '快按住！' : '按住拉低';
  if (!mode) { cue.hidden = true; return; }
  cue.hidden = false;
  cue.className = mode === 'low' ? '' : mode === 'high' ? 'up' : 'dodge';
  cue.textContent = mode === 'low' ? '⬇ 按住拉低！' : mode === 'high' ? '⬆ 松手升高！' : mode === 'ground' ? '↔ 带队绕开！' : '↔ 往中间躲！';
}

// ---------- 输入 ----------
let drag = null;
const knob = $('knob');
canvas.addEventListener('pointerdown', (e) => {
  if (app.phase !== 'play') return;
  unlockAudio();
  drag = { id: e.pointerId, x0: e.clientX, t0: app.input.targetX };
  knob.classList.add('drag');
  if (!app.swipeShown) { app.swipeShown = true; $('swipe-hand').classList.add('hide'); }
});
window.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const gain = 15 / Math.min(window.innerWidth, 700);
  app.input.targetX = Math.max(-5, Math.min(5, drag.t0 + (e.clientX - drag.x0) * gain));
});
const endDrag = (e) => { if (drag && e.pointerId === drag.id) { drag = null; knob.classList.remove('drag'); } };
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);
const pullBtn = $('btn-pull');
const setPull = (on) => {
  if (!app.input.pull && on) sfx.pull();
  app.input.pull = on;
  pullBtn.classList.toggle('on', on);
};
pullBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); unlockAudio(); pullBtn.setPointerCapture(e.pointerId); setPull(true); });
pullBtn.addEventListener('pointerup', () => setPull(false));
pullBtn.addEventListener('pointercancel', () => setPull(false));
pullBtn.addEventListener('lostpointercapture', () => setPull(false));
SKILL_BTNS.forEach((b) => {
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); unlockAudio(); trySkill(b.dataset.skill); });
});
function trySkill(kind) {
  if (app.phase !== 'play') return;
  if (useSkill(app.s, kind)) { handleEvents(); updateHud(false); }
}
window.addEventListener('keydown', (e) => {
  app.keys[e.code] = true;
  if (['Space', 'ArrowDown', 'KeyS'].includes(e.code)) { setPull(true); e.preventDefault(); }
  if (e.code === 'Digit1') trySkill('shield');
  if (e.code === 'Digit2') trySkill('magnet');
  if (e.code === 'Digit3') trySkill('rally');
  if (e.code === 'Escape' && app.phase === 'play') pause();
});
window.addEventListener('keyup', (e) => {
  app.keys[e.code] = false;
  if (['Space', 'ArrowDown', 'KeyS'].includes(e.code)) setPull(app.keys.Space || app.keys.ArrowDown || app.keys.KeyS || false);
});
window.addEventListener('blur', () => { setPull(false); app.keys = {}; if (app.phase === 'play') pause(); });

function pause() {
  if (app.phase !== 'play') return;
  app.phase = 'pause'; stopMusic(); setPull(false);
  $('overlay').classList.remove('hidden');
  for (const id of ['home', 'result', 'shop']) $(id).hidden = true;
  $('pause').hidden = false;
}
$('btn-pause').onclick = pause;
$('btn-resume').onclick = () => { $('overlay').classList.add('hidden'); app.phase = 'play'; clock.getDelta(); startMusic(); };
$('btn-quit').onclick = showHome;
$('btn-start').onclick = startRun;
$('btn-again').onclick = startRun;
$('btn-home').onclick = showHome;
$('btn-next').onclick = () => {
  const r = app.s.route;
  if (app.s.result.win && r.id < 3) { app.routeId = r.id + 1; startRun(); } else if (!app.s.result.win) startRun(); else showHome();
};
$('btn-sound').onclick = () => { unlockAudio(); save.sound = !soundOn(); setSound(save.sound); writeSave(); $('btn-sound').textContent = save.sound ? '🔊' : '🔇'; if (save.sound && app.phase === 'play') startMusic(); };

// ---------- 世界同步 ----------
function syncWorld() {
  const s = app.s;
  const ci = Math.floor(s.d / M.CHUNK);
  for (let i = ci - 1; i <= ci + 4; i++) {
    if (i < -1 || chunks.has(i)) continue;
    const c = M.buildChunk(i);
    scene.add(c); chunks.set(i, c);
  }
  for (const [i, c] of chunks) if (i < ci - 1 || i > ci + 5) { scene.remove(c); disposeGroup(c); chunks.delete(i); }
  for (const it of s.items) {
    if (itemObjs.has(it.id)) continue;
    if (it.d0 > s.d + 150 || it.d1 < s.d - 12) continue;
    if (s.taken.has(it.id) && it.type !== 'cones' && it.type !== 'cart') continue;
    const o = M.buildItem(it);
    o.userData.it = it;
    scene.add(o); itemObjs.set(it.id, o);
  }
  for (const [id, o] of itemObjs) {
    const it = o.userData.it;
    if (it.d1 < s.d - 14 || (o.userData.dead && o.userData.deadT > 1)) { scene.remove(o); disposeGroup(o); itemObjs.delete(id); }
  }
  if (s.route.length !== Infinity && !finishObj && s.d > s.route.length - 160) {
    finishObj = M.buildFinish(s.route.length);
    scene.add(finishObj);
  }
}
function disposeGroup(g) { g.traverse((o) => { if (o.isMesh && o.geometry && !o.geometry.userData?.shared) o.geometry.dispose?.(); }); }

// ---------- HUD ----------
const fxEl = $('labels');
const tmp = new THREE.Vector3();
function fx(pos3, text, cls = '') {
  tmp.copy(pos3).project(camera);
  const el = document.createElement('div');
  el.className = 'fx ' + cls;
  el.textContent = text;
  el.style.left = Math.min(window.innerWidth - 60, Math.max(60, (tmp.x * 0.5 + 0.5) * window.innerWidth)) + 'px';
  el.style.top = (-tmp.y * 0.5 + 0.5) * window.innerHeight + 'px';
  fxEl.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}
let lastHud = {};
function bumpStat(el) { if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function updateHud(force) {
  const s = app.s;
  const len = s.route.length;
  const p = len === Infinity ? 0 : Math.min(1, s.d / len);
  const dm = Math.floor(s.d);
  if (dm !== lastHud.dm || force) {
    lastHud.dm = dm;
    $('progress-fill').style.width = len === Infinity ? '0' : `calc(${(p * 100).toFixed(1)}% - 8px)`;
    $('progress-balloon').style.left = len === Infinity ? '50%' : `${(4 + p * 92).toFixed(1)}%`;
    $('dist').textContent = len === Infinity ? `${dm} m · 最远 ${save.bestDist || 0}` : `${dm} / ${len} m`;
  }
  const airPct = Math.round((s.air / s.b.air) * 100);
  if (force || airPct !== lastHud.air) {
    $('air-num').textContent = airPct + '%';
    $('air-fill').style.width = airPct + '%';
    $('air-fill').classList.toggle('low', airPct <= 40);
    if (!force) bumpStat($('stat-air'));
  }
  if (force || s.crew !== lastHud.crew) { $('crew-num').textContent = s.crew; if (!force) bumpStat($('stat-crew')); }
  if (force || s.stars !== lastHud.stars) { $('star-num').textContent = s.stars; if (!force) bumpStat($('stat-star')); }
  Object.assign(lastHud, { air: airPct, crew: s.crew, stars: s.stars });
  // 只在数值变化时写 DOM，避免每帧触发重绘
  for (const b of SKILL_BTNS) {
    const k = b.dataset.skill;
    const n = s.charges[k] || 0;
    const active = (k === 'shield' && s.shield > 0) || (k === 'magnet' && s.magnet > 0);
    const left = k === 'shield' ? s.shield / SKILLS.shield.dur : k === 'magnet' ? s.magnet / SKILLS.magnet.dur : 0;
    const pct = Math.round(left * 20) * 5; // 5% 一档
    const key = `${n}|${active}|${pct}`;
    if (b._k === key && !force) continue;
    b._k = key;
    b._cnt.textContent = n;
    b.disabled = n <= 0 && !active;
    b.classList.toggle('ready', n > 0 && !active);
    b.classList.toggle('active', active);
    b._tm.style.setProperty('--p', `${pct}%`);
  }
  const e = Math.round(113 - (113 * s.energy) / ENERGY_PER_CHARGE);
  if (e !== lastHud.e || force) ENERGY_CIRCLE.style.setProperty('--e', e);
  const kl = Math.round((s.crewX + 5) * 10);
  if (kl !== lastHud.kl || force) knob.style.left = `${kl}%`;
  const pvOn = s.shield > 0 || s.magnet > 0, pvMag = s.shield <= 0 && s.magnet > 0;
  if (pvOn !== lastHud.pvOn || pvMag !== lastHud.pvMag || force) {
    const pv = $('power-vignette');
    pv.classList.toggle('on', pvOn);
    pv.classList.toggle('mag', pvMag);
  }
  Object.assign(lastHud, { e, kl, pvOn, pvMag });
  const ww = $('wind-warn');
  const bd = s.d + BALLOON_AHEAD;
  const g = s.items.find((it) => it.type === 'gust' && it.d1 > bd && it.d0 < bd + 35);
  if (g) { ww.hidden = false; ww.textContent = g.dir > 0 ? '强风 →→→ 往左拉住！' : '往右拉住！←←← 强风'; } else ww.hidden = true;
  updateCue();
}

// ---------- 事件反馈 ----------
const SKILL_NAMES = { shield: '🛡️ 无敌护盾！', magnet: '🧲 星星磁铁！', rally: '📣 观众集合！' };
function handleEvents() {
  const s = app.s;
  const bpos = () => balloon.root.position.clone();
  for (const ev of s.events) {
    const o = ev.it ? itemObjs.get(ev.it.id) : null;
    if (ev.e === 'star') {
      sfx.star(s.stars);
      M.setBalloonMood(balloon, 'joy', 0.5);
      if (o) {
        if (ev.magnet) { flyers.push({ o, from: o.position.clone(), t: 0, kind: 'magnet' }); itemObjs.delete(ev.it.id); }
        else { o.userData.dead = true; o.userData.deadT = 0; }
      }
      burst(new THREE.Vector3(ev.it.x, ev.it.y, -ev.it.d0), 0xffd23a, 8, 3);
    } else if (ev.e === 'hit') {
      sfx.hit();
      app.shake = 0.5;
      M.setBalloonMood(balloon, 'ouch', 1.1);
      const f = $('flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 80);
      fx(bpos().add(new THREE.Vector3(0, 2.5, 0)), `哎哟！-${Math.round((s.b.damage / s.b.air) * 100)}%`, 'bad');
      if (o) o.userData.wobble = 1;
    } else if (ev.e === 'trip') {
      sfx.trip();
      app.shake = Math.max(app.shake, 0.25);
      fx(new THREE.Vector3(s.crewX, 2.5, -s.d), `摔倒 ${ev.n} 人！`, 'bad');
      if (o) o.userData.knock = 1;
      dropWalkers(ev.n);
    } else if (ev.e === 'fans') {
      sfx.cheer();
      fx(new THREE.Vector3(ev.it.x, 2.8, -s.d), `+${ev.n} 拉绳手！`, 'good');
      if (o) { o.userData.dead = true; o.userData.deadT = 0; }
    } else if (ev.e === 'pump') {
      sfx.pump();
      fx(new THREE.Vector3(ev.it.x, 3, -s.d), `+${ev.n}% 气`, 'good');
      burst(bpos(), 0x7fc4ff, 14, 4);
    } else if (ev.e === 'gift') {
      sfx.cheer();
      M.setBalloonMood(balloon, 'joy', 0.8);
      fx(bpos().add(new THREE.Vector3(0, 3, 0)), `${SKILLS[ev.kind].icon} +1`, 'big');
      if (o) { o.userData.dead = true; o.userData.deadT = 0; }
      burst(bpos(), 0xffd23a, 18, 5);
      bumpStat(document.querySelector(`#skills .skill[data-skill="${ev.kind}"]`));
    } else if (ev.e === 'charge') {
      fx(bpos().add(new THREE.Vector3(0, 3.5, 0)), '⭐×8 → 🛡️ +1', 'big');
      bumpStat(document.querySelector('#skills .skill[data-skill="shield"]'));
    } else if (ev.e === 'skill') {
      sfx.win();
      fx(bpos().add(new THREE.Vector3(0, 3.2, 0)), SKILL_NAMES[ev.kind], 'skillfx');
      if (ev.kind === 'shield') M.setBalloonMood(balloon, 'power', 99);
      if (ev.kind === 'rally') { sfx.cheer(); burst(new THREE.Vector3(s.crewX, 2, -s.d), 0xff6a6a, 20, 5); }
      burst(bpos(), ev.kind === 'magnet' ? 0x5ac8ff : 0xffd23a, 26, 6);
    } else if (ev.e === 'smash') {
      sfx.trip(); sfx.star(5);
      app.shake = Math.max(app.shake, 0.35);
      fx((ev.ground ? new THREE.Vector3(s.crewX, 2, -s.d) : bpos()).add(new THREE.Vector3(0, 2.8, 0)), '💥 撞飞！+15', 'big');
      if (o) { flyers.push({ o, from: o.position.clone(), t: 0, kind: 'smash', dir: Math.random() < 0.5 ? -1 : 1 }); itemObjs.delete(ev.it.id); }
      burst(ev.ground ? new THREE.Vector3(s.crewX, 1, -s.d) : bpos(), 0xffa83a, 20, 7);
    }
  }
  s.events.length = 0;
}

function dropWalkers(n) {
  const active = walkers.filter((w) => w.state === 'on');
  const u = M.UNIFORMS[save.equip.uniform] || M.UNIFORMS.red;
  for (let i = 0; i < n && active.length; i++) {
    const w = active.pop();
    w.state = 'off'; w.root.visible = false;
    const f = M.buildWalker(u.body, false, u);
    f.root.position.copy(w.root.position);
    f.root.rotation.y = w.root.rotation.y;
    f.t = 0;
    scene.add(f.root);
    fallers.push(f);
  }
}

const BURST_GEO = new THREE.SphereGeometry(0.12, 6, 5);
BURST_GEO.userData.shared = true;
const burstMats = new Map();
function burst(pos, color, n, power) {
  const geo = BURST_GEO;
  if (!burstMats.has(color)) burstMats.set(color, new THREE.MeshBasicMaterial({ color }));
  const m0 = burstMats.get(color);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, m0);
    m.position.copy(pos);
    const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI;
    particles.push({ m, v: new THREE.Vector3(Math.cos(a) * Math.sin(e), Math.cos(e) + 0.5, Math.sin(a) * Math.sin(e)).multiplyScalar(power * (0.5 + Math.random())), life: 0.8 + Math.random() * 0.4, g: 6 });
    scene.add(m);
  }
}
function confetti(pos) {
  const cols = [0xd9481e, 0xf2b630, 0x4f8a3a, 0x2a7fd0, 0xffffff, 0xc0213b];
  const geo = new THREE.PlaneGeometry(0.3, 0.18);
  for (let i = 0; i < 120; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
    m.position.set(pos.x + (Math.random() - 0.5) * 16, pos.y + Math.random() * 4, pos.z + (Math.random() - 0.5) * 6);
    particles.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 6, (Math.random() - 0.5) * 4), life: 3 + Math.random() * 2, g: 2.2, spin: true });
    scene.add(m);
  }
}

// ---------- 结束 ----------
function endRun() {
  const s = app.s;
  const r = s.result;
  stopMusic(); setPull(false);
  const route = s.route;
  if (route.length === Infinity) { if (r.dist > (save.bestDist || 0)) save.bestDist = r.dist; }
  else if (r.stars > (save.best[route.id] || 0)) save.best[route.id] = r.stars;
  const record = r.score > (save.bestScore || 0);
  const oldRank = rankOf(save.bestScore || 0);
  if (record) save.bestScore = r.score;
  save.coins += r.coins;
  writeSave();
  if (r.win) { sfx.win(); confetti(new THREE.Vector3(0, 10, -s.d - 10)); M.setBalloonMood(balloon, 'joy', 99); } else { sfx.lose(); M.setBalloonMood(balloon, 'ouch', 99); }
  setTimeout(() => {
    app.phase = 'result';
    $('overlay').classList.remove('hidden');
    for (const id of ['home', 'pause', 'shop']) $(id).hidden = true;
    $('result').hidden = false;
    for (const id of ['hud', 'stats', 'controls', 'wind-warn', 'cue']) $(id).hidden = true;
    const endless = route.length === Infinity;
    $('result-stars').innerHTML = endless ? '' : [0, 1, 2].map((i) => `<span class="${i < r.stars ? 'on' : ''}" style="animation-delay:${0.15 + i * 0.25}s">★</span>`).join('');
    $('result-title').textContent = r.win ? (r.stars === 3 ? '完美游行！' : '游行成功！') : endless ? `走了 ${r.dist} 米！` : '游行中断…';
    $('result-reason').textContent = r.win
      ? (r.stars === 3 ? '气球饱满、星星满天，全城都在欢呼！' : r.stars === 2 ? '再多收集星星（≥60%）就能拿三星。' : '气球剩余不到一半；少撞几次能拿更多星。')
      : r.why === 'pop' ? '气球漏光了气……试试在横幅前开 🛡️ 无敌！' : '拉绳队全摔倒了，气球飞走了！多接路边观众或用 📣。';
    $('record').hidden = !record;
    countUp($('score-num'), r.score, 900);
    countUp($('coin-num'), r.coins, 1100, () => sfx.star(2));
    const nr = rankOf(save.bestScore);
    const next = RANKS.find((x) => x.min > save.bestScore);
    $('result-rank').textContent = (nr.name !== oldRank.name ? `🎉 升级为 ${nr.icon} ${nr.name}！` : `${nr.icon} ${nr.name}`) + (next ? ` · 再 ${next.min - save.bestScore} 分升 ${next.icon} ${next.name}` : ' · 已是最高段位');
    $('result-stats').innerHTML = `<div>距离<b>${r.dist} m</b></div><div>剩余气量<b>${Math.round(r.airPct * 100)}%</b></div><div>星星<b>${s.stars} / ${s.starsTotal}</b></div><div>撞飞障碍<b>${s.smashed}</b></div>`;
    const nextOk = r.win && route.id < 3;
    $('btn-next').textContent = r.win ? (nextOk ? '下一条路线 →' : '返回首页') : '再试一次';
    $('btn-again').hidden = !r.win;
  }, r.win ? 1600 : 1200);
}
function countUp(el, to, ms, tick) {
  const t0 = performance.now();
  let last = -1;
  const f = () => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    const v = Math.round(to * (1 - Math.pow(1 - k, 3)));
    el.textContent = v;
    const step8 = Math.floor(v / Math.max(1, to / 8));
    if (tick && step8 !== last) { last = step8; tick(); }
    if (k < 1) setTimeout(f, 30);
  };
  f();
}

// ---------- 主循环 ----------
const clock = new THREE.Clock();
const DT = 1 / 60;
function frame() {
  lastFrame = performance.now();
  if (!rafPending) { rafPending = true; requestAnimationFrame(onRaf); }
  try { frameBody(); } catch (err) { console.error(err); }
}
function frameBody() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (app.phase === 'play') {
    const kx = (app.keys.ArrowRight || app.keys.KeyD ? 1 : 0) - (app.keys.ArrowLeft || app.keys.KeyA ? 1 : 0);
    if (kx) app.input.targetX = Math.max(-5, Math.min(5, app.input.targetX + kx * 9 * dt));
    app.acc += dt;
    while (app.acc >= DT && app.phase === 'play') {
      app.acc -= DT;
      const hadShield = app.s.shield > 0;
      step(app.s, app.input, DT);
      if (hadShield && app.s.shield <= 0) M.setBalloonMood(balloon, 'idle', 0);
      handleEvents();
      firstSightHints();
      if (app.s.done) { app.phase = 'ending'; endRun(); break; }
    }
    updateHud(false);
    syncWorld();
  }
  if (app.s) renderWorld(dt, t);
  renderStage(dt, t);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.v.y -= p.g * dt;
    p.m.position.addScaledVector(p.v, dt);
    if (p.spin) { p.m.rotation.x += dt * 5; p.m.rotation.y += dt * 3; }
    p.life -= dt;
    if (p.life <= 0) { scene.remove(p.m); particles.splice(i, 1); }
  }
  renderer.render(scene, camera);
}
let lastFrame = 0, rafPending = false;
function onRaf() { rafPending = false; frame(); }
setInterval(() => { if (performance.now() - lastFrame > 200) frame(); }, 33);

function firstSightHints() {
  const s = app.s;
  const bd = s.d + BALLOON_AHEAD;
  for (const it of s.items) {
    if (it.d0 < bd + 8 || it.d0 > bd + 42) continue;
    const type = it.type;
    if (app.seenTypes.has(type)) continue;
    app.seenTypes.add(type);
    if (TYPE_HINTS[type]) { showHint(TYPE_HINTS[type], 2600); break; }
  }
}

const v3 = new THREE.Vector3();
function renderWorld(dt, t) {
  const s = app.s;
  const crewZ = -s.d;
  const running = app.phase === 'play' || app.phase === 'ending';
  const n = s.crew;
  let k = 0;
  for (let i = 0; i < walkers.length; i++) {
    const w = walkers[i];
    if (k < n) {
      if (w.state === 'off') {
        w.state = 'on'; w.root.visible = true;
        w.root.position.set(s.crewX + (Math.random() < 0.5 ? -5 : 5), 0, crewZ + 3);
      }
      const row = Math.floor(k / 2), col = k % 2;
      const tx = s.crewX + (col ? 0.55 : -0.55) + Math.sin(row * 1.3) * 0.15;
      const tz = crewZ + row * 1.05;
      w.root.position.x += (tx - w.root.position.x) * Math.min(1, dt * 8);
      w.root.position.z += (tz - w.root.position.z) * Math.min(1, dt * 10);
      w.root.rotation.y = Math.PI;
      const ph = t * 11 + i;
      const amp = running ? 0.7 : 0.1;
      w.legs[0].rotation.x = Math.sin(ph) * amp; w.legs[1].rotation.x = -Math.sin(ph) * amp;
      w.body.position.y = Math.abs(Math.sin(ph)) * 0.08 * (running ? 1 : 0);
      const lean = app.input.pull ? -0.38 : -0.1;
      w.body.rotation.x += (lean - w.body.rotation.x) * Math.min(1, dt * 8);
      w.arms[0].rotation.x = -2.3; w.arms[1].rotation.x = -2.5;
      k++;
    } else if (w.state === 'on') { w.state = 'off'; w.root.visible = false; }
  }
  for (let i = fallers.length - 1; i >= 0; i--) {
    const f = fallers[i];
    f.t += dt;
    f.root.rotation.x = -Math.min(Math.PI / 2, f.t * 6);
    f.root.position.y = Math.max(0.15, 0.4 - f.t);
    if (f.root.position.z > crewZ + 25) { scene.remove(f.root); fallers.splice(i, 1); }
  }
  if (balloon) {
    const bz = -(s.d + BALLOON_AHEAD);
    const airK = 0.72 + 0.28 * (s.air / s.b.air);
    const pop = s.done && !s.result?.win && s.result?.why === 'pop';
    const sc = pop ? Math.max(0.2, airK - (app.finishT += dt) * 0.6) : airK * (s.shield > 0 ? 1.12 : 1);
    balloon.root.scale.setScalar(sc);
    let by = s.by + Math.sin(t * 1.6) * 0.15;
    if (s.done && s.result?.why === 'flyaway') { app.finishT += dt; by += app.finishT * app.finishT * 4; }
    balloon.root.position.set(s.bx, by, bz);
    balloon.root.rotation.z = s.bvx * 0.05;
    balloon.root.rotation.x = (s.h.high - s.by) * 0.03;
    balloon.inner.visible = !(s.inv > 0 && Math.floor(t * 14) % 2 === 0 && !s.done);
    M.animateBalloon(balloon, t, dt);
    emitTrail(dt, t);
    balloon.shield.visible = s.shield > 0;
    if (s.shield > 0) { balloon.shield.rotation.y += dt * 2; balloon.shield.material.opacity = 0.22 + Math.sin(t * 10) * 0.08 + (s.shield < 1.2 ? (Math.floor(t * 10) % 2) * 0.15 : 0); }
    balloon.magnet.visible = s.magnet > 0;
    if (s.magnet > 0) { const r = 3 + ((t * 4) % 3); balloon.magnet.scale.setScalar(r); balloon.magnet.material.opacity = 1 - (r - 3) / 3; }
    let ri = 0;
    const active = walkers.filter((w) => w.state === 'on');
    balloon.root.updateMatrixWorld(true);
    for (let i = 0; i < 24; i++) {
      if (i < active.length && !(s.done && s.result?.why === 'flyaway')) {
        active[i].hand.getWorldPosition(v3);
        ropePos[ri++] = v3.x; ropePos[ri++] = v3.y; ropePos[ri++] = v3.z;
        balloon.anchors[i % 4].getWorldPosition(v3);
        ropePos[ri++] = v3.x; ropePos[ri++] = v3.y; ropePos[ri++] = v3.z;
      } else for (let j = 0; j < 6; j++) ropePos[ri++] = 0;
    }
    ropeGeo.attributes.position.needsUpdate = true;
    ropeGeo.setDrawRange(0, Math.min(active.length, 24) * 2);
  }
  for (let i = flyers.length - 1; i >= 0; i--) {
    const f = flyers[i];
    f.t += dt;
    if (f.kind === 'magnet') {
      const k2 = Math.min(1, f.t / 0.35);
      f.o.position.lerpVectors(f.from, balloon.root.position, k2 * k2);
      f.o.scale.setScalar(1 - k2 * 0.7);
      if (k2 >= 1) { scene.remove(f.o); flyers.splice(i, 1); }
    } else {
      f.o.position.set(f.from.x + f.dir * f.t * 14, f.from.y + f.t * 12 - f.t * f.t * 9, f.from.z - f.t * 10);
      f.o.rotation.z += dt * 8 * f.dir; f.o.rotation.x += dt * 5;
      if (f.t > 1.6) { scene.remove(f.o); disposeGroup(f.o); flyers.splice(i, 1); }
    }
  }
  for (const [, o] of itemObjs) {
    const it = o.userData.it;
    if (o.userData.spin) { o.rotation.y += dt * 2.5; if (it.type === 'gift') o.position.y = it.y + Math.sin(t * 3) * 0.3; }
    if (o.userData.dead) {
      o.userData.deadT += dt;
      if (it.type === 'star' || it.type === 'gift') { o.scale.setScalar(Math.max(0.01, 1 + o.userData.deadT * 3)); o.visible = o.userData.deadT < 0.15; }
      if (it.type === 'fans') o.visible = false;
    }
    if (o.userData.people) for (const [i, p] of o.userData.people.entries()) {
      p.body.position.y = Math.abs(Math.sin(t * 7 + i)) * 0.35;
      p.arms[0].rotation.z = -2.6 + Math.sin(t * 9 + i) * 0.4; p.arms[1].rotation.z = 2.6 - Math.sin(t * 9 + i) * 0.4;
    }
    if (o.userData.wobble) { o.userData.wobble = Math.max(0, o.userData.wobble - dt * 1.5); o.rotation.z = Math.sin(t * 30) * 0.03 * o.userData.wobble; }
    if (o.userData.knock) { o.userData.knock = Math.min(2, o.userData.knock + dt * 3); o.children.forEach((c, i) => { c.rotation.x = -Math.min(1.5, (o.userData.knock - 1) * 2) * (i % 2 ? 1 : 0.7); }); }
    if (o.userData.leaves) for (const l of o.userData.leaves) {
      l.position.x += o.userData.dir * dt * 9;
      if (l.position.x > 11) l.position.x = -11; if (l.position.x < -11) l.position.x = 11;
      l.rotation.x += dt * 4; l.rotation.y += dt * 3;
    }
  }
  for (const [, c] of chunks) c.userData.crowds?.forEach((m, i) => { m.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.12; });
  app.shake = Math.max(0, app.shake - dt);
  app.camX += (s.crewX * 0.55 + s.bx * 0.15 - app.camX) * Math.min(1, dt * 3);
  const portrait = window.innerHeight > window.innerWidth;
  const sh = app.shake * 0.6;
  const camH = portrait ? 13 : 11.5, back = portrait ? 18 : 16;
  camera.position.set(app.camX + (Math.random() - 0.5) * sh, camH + (Math.random() - 0.5) * sh, crewZ + back);
  const pitch = THREE.MathUtils.degToRad(portrait ? 16 : 18);
  camera.lookAt(app.camX * 0.7 + s.bx * 0.15, camH - Math.tan(pitch) * 40, crewZ + back - 40);
  sun.position.set(camera.position.x - 8, 24, crewZ + 6);
  sun.target.position.set(0, 0, crewZ - 8);
}

// 气球拖尾：粒子留在原地，随队伍前进被甩到身后
const trails = [];
let trailT = 0, trailN = 0;
function emitTrail(dt, t) {
  for (let i = trails.length - 1; i >= 0; i--) {
    const p = trails[i];
    p.life -= dt;
    p.o.position.addScaledVector(p.v, dt);
    const k = Math.max(0, p.life / p.max);
    if (p.o.material) p.o.material.opacity = k;
    p.o.scale.setScalar(p.s * (0.5 + k * 0.5));
    if (p.life <= 0) { scene.remove(p.o); trails.splice(i, 1); }
  }
  const kind = balloon?.trail;
  if (!kind || kind === 'none' || !(app.phase === 'play' || app.phase === 'ending')) return;
  trailT -= dt;
  while (trailT <= 0) {
    trailT += kind === 'rainbow' ? 0.03 : 0.06;
    const o = M.trailParticle(kind, trailN++);
    const bp = balloon.root.position;
    const spread = kind === 'rainbow' ? 0.3 : 1.6;
    const side = (trailN % 2 ? 1 : -1) * (kind === 'rainbow' ? 0 : 1.4);
    o.position.set(bp.x + side + (Math.random() - 0.5) * spread, bp.y - app.s.b.ry * 1.05 + (Math.random() - 0.5) * spread * 0.6, bp.z + 0.6);
    scene.add(o);
    const max = kind === 'rainbow' ? 1.0 : 1.3;
    trails.push({ o, life: max, max, s: o.scale.x, v: new THREE.Vector3((Math.random() - 0.5) * 1.2, kind === 'confetti' ? -1.5 : 0.4, 0) });
  }
}

// ---------- 启动 ----------
try {
  setSound(save.sound);
  $('btn-sound').textContent = save.sound ? '🔊' : '🔇';
  app.s = createState(ROUTES[0], 'turkey', 1);
  balloon = M.buildBalloon(save.balloon || 'turkey', BALLOONS[save.balloon || 'turkey'], outfit());
  balloon.root.rotation.y = Math.PI;
  scene.add(balloon.root);
  syncWorld();
  showHome();
  frame();
  setTimeout(() => { $('loading').hidden = true; }, 150);
  window.__parade = { app, save, startRun, showShop, ROUTES, step, useSkill, renderer, scene, camera, trySkill: (k) => trySkill(k) };
} catch (err) {
  console.error(err);
  $('loading').innerHTML = `<b>加载失败</b><small>${err.message}</small>`;
}
