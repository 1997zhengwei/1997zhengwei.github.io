import * as THREE from '../vendor/three.module.js';
import { createRun, step, hazardX, gateBounds, COLORS, COLOR_NAMES, HALF, LEVELS, HIT_LABEL } from './game.mjs';
import { THEMES } from './themes.mjs';
import * as M from './models.mjs';
import { createPost } from './post.mjs';
import { sfx, unlockAudio, setSound, soundOn, startMusic, stopMusic } from './audio.mjs';

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'tg-turkeyfan-v1';
const save = (() => { try { return { best: 0, sound: true, stars: {}, bests: {}, level: 0, ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch { return { best: 0, sound: true, stars: {}, bests: {}, level: 0 }; } })();
save.stars = save.stars || {}; save.bests = save.bests || {};
const unlocked = (i) => i === 0 || (save.stars[LEVELS[i - 1].id] || 0) >= 1;
const writeSave = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* ignore */ } };
const COLOR_HEX = { red: '#a3122e', orange: '#d8661e', gold: '#e8b02a', teal: '#3f8f74', purple: '#6a3a8a', rainbow: 'conic-gradient(#a3122e,#d8661e,#e8b02a,#3f8f74,#2a6ab0,#6a3a8a,#a3122e)' };

// ---------- 渲染 ----------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping; // 色调映射在后期里做
renderer.outputColorSpace = THREE.SRGBColorSpace;
const post = createPost(renderer);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffd9a8);
scene.fog = new THREE.Fog(0xf8d4a8, 70, 300);
scene.environment = M.makeEnv(renderer);
scene.environmentIntensity = 0.75;
const sky = M.buildSky(scene);
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 600);
// 黄金时刻：前方偏右的低角度暖阳 + 天光 + 镜头一侧的冷补光
const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x5a4422, 0.7); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffcf96, 3.8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 14, bottom: -14, near: 1, far: 80 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
scene.add(sun, sun.target);
const fillL = new THREE.DirectionalLight(0xbcd4ff, 0.9); scene.add(fillL, fillL.target);
const stageKey = new THREE.SpotLight(0xfff0d0, 0, 30, 0.5, 0.6, 1.2); scene.add(stageKey, stageKey.target);
// 夜晚关卡：跟着火鸡的暖色追光
const follow = new THREE.SpotLight(0xffe8c0, 0, 26, 0.42, 0.55, 1.1); scene.add(follow, follow.target);
function applyTheme(name) {
  const th = THEMES[name] || THEMES.farm;
  sky.userData.setTheme(name);
  scene.fog.color.setHex(th.fog[0]); scene.fog.near = th.fog[1]; scene.fog.far = th.fog[2];
  scene.background.setHex(th.fog[0]);
  hemi.color.setHex(th.hemi[0]); hemi.groundColor.setHex(th.hemi[1]); hemi.intensity = th.hemi[2];
  sun.color.setHex(th.key[0]); sun.intensity = th.key[1];
  fillL.color.setHex(th.fill[0]); fillL.intensity = th.fill[1];
  scene.environmentIntensity = th.env;
  post.comp.uniforms.exposure.value = th.post.exposure; post.comp.uniforms.bloom.value = th.post.bloom;
  post.comp.uniforms.tint.value.set(...th.post.tint);
  follow.userData.k = th.followSpot || 0;
  app.theme = th;
}
function resize() {
  const W = window.innerWidth, H = window.innerHeight;
  renderer.setSize(W, H, false);
  const pr = renderer.getPixelRatio();
  post.size(Math.round(W * pr), Math.round(H * pr));
  camera.aspect = W / H; camera.fov = W > H ? 48 : 60; camera.updateProjectionMatrix();
  try { app.baseFov = camera.fov; } catch { /* app 尚未创建 */ }
}
window.addEventListener('resize', resize); resize();

// ---------- 状态 ----------
const app = { baseFov: camera.fov, boostFov: 0, friendObjs: [], fleeing: [], phase: 'home', level: Math.min(save.level || 0, LEVELS.length - 1), worldKey: null, env: null, s: null, objs: null, turkey: null, drag: null, targetX: 0, acc: 0, fanOpen: 0.55, finT: 0, camX: 0, loose: [], confetti: [], shake: 0 };

function disposeTree(o) {
  o.traverse((m) => {
    if (m.geometry) m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mt of mats) { for (const k of ['map', 'normalMap', 'emissiveMap']) if (mt[k] && !mt[k].userData.keep) mt[k].dispose(); mt.dispose(); }
  });
}
function buildRunScene() {
  const s = app.s;
  const L = s.level;
  const key = L.id + ':' + s.length;
  // 场景（地形、两侧景物、舞台）按关卡缓存；重玩同一关只重建道具和火鸡
  if (app.worldKey !== key) {
    if (app.env) { scene.remove(app.env); disposeTree(app.env); }
    const env = new THREE.Group(); scene.add(env);
    const world = M.buildWorld(env, s.length, L.theme);
    if (!(THEMES[L.theme] || {}).indoor) M.buildHills(env, s.length, L.theme);
    const stage = M.buildStage(s.length, L.stage); env.add(stage.group);
    app.env = env; app.envParts = { world, stage }; app.worldKey = key;
  }
  applyTheme(L.theme);
  if (app.objs) { scene.remove(app.objs.root); }
  const root = new THREE.Group(); scene.add(root);
  const itemObjs = new Map();
  for (const it of s.items) {
    let o = null;
    if (it.type === 'feather') { o = M.buildPickup(it.color); o.position.set(it.x, it.y || 0, -it.d); if (it.y) o.scale.setScalar(1.15); }
    else if (it.type === 'ramp') o = M.buildRamp(it, L.theme);
    else if (it.type === 'cage') o = M.buildCage(it);
    else if (it.type === 'corn') { o = M.buildCorn(); o.position.set(it.x, 0, -it.d); }
    else if (it.type === 'mash') { o = M.buildMash(); o.position.set(it.x, 0, -it.d); o.userData.mash = true; }
    else if (it.type === 'fork') { o = M.buildFork(); o.position.set(it.x, 0, -it.d); }
    else if (it.type === 'zone') o = M.buildZone(it);
    else if (it.type === 'gate') o = M.buildGate(it);
    else if (it.type === 'scissors') { const sc = M.buildScissors(); sc.group.position.set(it.x, 0, -it.d); o = sc.group; o.userData.rotor = sc.rotor; }
    else if (it.type === 'chef') { const ch = M.buildChef(); ch.group.position.set(it.x, 0, -it.d); o = ch.group; o.userData.chef = ch; }
    else if (it.type === 'pumpkin') { const pk = M.buildPumpkinRoller(); pk.group.position.set(0, 0, -it.d); pk.roll.position.x = it.x; o = pk.group; o.userData.roller = pk.roll; }
    else if (it.type === 'pie') { const pi = M.buildPie(); pi.group.position.set(it.x, 0, -it.d); o = pi.group; o.userData.pie = pi; pi.pie.visible = false; }
    else if (it.type === 'horn') { o = M.buildHorn(); o.position.set(it.x, 0, -it.d); o.userData.hornSpin = o.userData.spin; o.userData.spin = null; }
    if (o) { o.userData.it = it; root.add(o); itemObjs.set(it.id, o); }
  }
  const turkey = M.buildTurkey();
  turkey.root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  root.add(turkey.root);
  app.turkey = turkey;
  // 伙伴队伍 / 追兵大厨
  app.friendObjs = []; app.fleeing = [];
  app.chaser = null;
  if (s.chase) { const ch = M.buildChef(); ch.group.scale.setScalar(1.15); ch.group.children[ch.group.children.length - 1].visible = false; root.add(ch.group); app.chaser = ch; ch.group.position.set(0, 0, 12); }
  app.objs = { root, world: app.envParts.world, stage: app.envParts.stage, itemObjs };
}

// ---------- 开局 ----------
function start(levelIdx = app.level) {
  unlockAudio();
  app.level = levelIdx; save.level = levelIdx; writeSave();
  app.s = createRun(LEVELS[levelIdx]);
  buildRunScene();
  app.targetX = 0; app.acc = 0; app.fanOpen = 0.55; app.finT = 0; app.camX = 0; app.shake = 0; app.fanTop = 0; app.camH = 0;
  app.opened = false; app.cardShown = []; app.resultShown = false; app.fanFront = false; app.bonusShown = false; app.cageFrom = null;
  stageKey.intensity = 0;
  for (const l of app.loose) scene.remove(l.m); app.loose = [];
  for (const c of app.confetti) scene.remove(c.m); app.confetti = [];
  M.layoutFan(app.turkey, [], 0.55, 0);
  app.phase = 'run';
  $('overlay').classList.add('hidden');
  $('hud').hidden = false; $('drag-hint').hidden = false; showLevelBanner(); $('cards').hidden = true; $('cards').innerHTML = '';
  const Lv = LEVELS[levelIdx];
  $('status').hidden = !(Lv.cage || Lv.chase); $('friends').hidden = !Lv.cage; $('chase').hidden = !Lv.chase; $('friends-n').textContent = '0';
  $('danger').classList.remove('on'); app.squash = 0; app.lastFriends = 0; app.boostFov = 0;
  renderColors();
  updateHud(true);
  startMusic();
}

// ---------- 输入：左右拖动 ----------
window.addEventListener('pointerdown', (e) => {
  if (app.phase !== 'run' || e.target.closest('button, .panel')) return;
  unlockAudio();
  app.drag = { id: e.pointerId, x0: e.clientX, t0: app.targetX };
  $('drag-hint').hidden = true;
});
window.addEventListener('pointermove', (e) => {
  if (!app.drag || e.pointerId !== app.drag.id) return;
  const gain = (HALF * 2.4) / Math.min(window.innerWidth, 600);
  app.targetX = Math.max(-HALF, Math.min(HALF, app.drag.t0 + (e.clientX - app.drag.x0) * gain));
});
const endDrag = () => { app.drag = null; };
window.addEventListener('pointerup', endDrag); window.addEventListener('pointercancel', endDrag);
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
$('btn-start').onclick = () => { sfx.click(); start(app.level); };
$('btn-again').onclick = () => { sfx.click(); start(app.level); };
$('btn-next').onclick = () => { sfx.click(); start(Math.min(LEVELS.length - 1, app.level + 1)); };
$('btn-home').onclick = () => { sfx.click(); showHome(); };
// 关卡选择
function renderLevels() {
  $('levels').innerHTML = LEVELS.map((L, i) => {
    const st = save.stars[L.id] || 0, ok = unlocked(i);
    return `<button class="lv ${i === app.level ? 'sel' : ''} ${ok ? '' : 'locked'} ${L.chapter === 2 ? 'ch2' : ''}" data-i="${i}" ${ok ? '' : 'aria-disabled="true"'}><span class="lv-n">${i + 1}</span><span class="lv-e">${ok ? L.emoji : '🔒'}</span><b>${L.name}</b><span class="lv-s">${[0, 1, 2].map((k) => `<i class="${k < st ? 'on' : ''}">★</i>`).join('')}</span></button>`;
  }).join('');
  const L = LEVELS[app.level];
  const lvI = LEVELS.indexOf(L);
  $('lv-sub').innerHTML = `${L.sub}<br><small>${L.chapter === 2 ? '第二章 · 感恩节当天' : '第一章 · 赶往赦免大会'} · 目标 <b>${L.par}</b> 根羽毛 · 难度 ${lvI < 5 ? '🔥'.repeat(lvI + 1) : '🔥×' + (lvI + 1)}</small>`;
  $('btn-start').textContent = `开跑！第 ${app.level + 1} 关`;
  document.querySelector('#home .story').innerHTML = L.chapter === 2
    ? '感恩节当天，被赦免的火鸡没有忘记伙伴：冲上游行花车、跑过大餐桌、拦下运火鸡的货车，<b>带着大家逃向自由</b> 🦃'
    : '感恩节前夜，火鸡们一路赶往<b>「火鸡赦免大会」</b>：开屏最美的那只<b>被赦免</b>，其余的……今晚上餐桌 🍗';
  $('levels').querySelectorAll('.lv').forEach((b) => { b.onclick = () => { const i = +b.dataset.i; if (!unlocked(i)) { sfx.gateBad(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; } sfx.click(); app.level = i; renderLevels(); previewLevel(i); }; });
}
function previewLevel(i) {
  app.s = createRun(LEVELS[i]);
  buildRunScene();
  camera.position.set(0, 4.4, 7.2); camera.lookAt(0, 1.5, -7);
}
function showHome() {
  app.phase = 'home';
  $('status').hidden = true; $('danger').classList.remove('on');
  $('overlay').classList.remove('hidden');
  $('home').hidden = false; $('result').hidden = true; $('hud').hidden = true; $('cards').hidden = true; $('drag-hint').hidden = true;
  renderLevels();
  previewLevel(app.level);
}
function showLevelBanner() {
  const L = LEVELS[app.level];
  const b = $('lv-banner');
  b.innerHTML = `<small>第 ${app.level + 1} 关</small><b>${L.emoji} ${L.name}</b><span>${L.sub}</span>`;
  b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
}
$('btn-sound').onclick = () => { unlockAudio(); save.sound = !soundOn(); setSound(save.sound); writeSave(); $('btn-sound').textContent = save.sound ? '🔊' : '🔇'; if (save.sound && app.phase === 'run') startMusic(); };

// ---------- HUD ----------
function renderColors() {
  const have = new Set(app.s ? app.s.feathers : []);
  $('colors').innerHTML = COLORS.map((c) => `<i class="${have.has(c) ? 'on' : ''}" title="${COLOR_NAMES[c]}" style="background:${COLOR_HEX[c]}"></i>`).join('');
}
let lastN = -1, lastColors = 0;
function updateHud(force) {
  const s = app.s;
  const n = s.feathers.length;
  if (n !== lastN || force) {
    $('n').textContent = n;
    const c = $('count'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
    lastN = n;
    const nc = new Set(s.feathers).size;
    if (nc !== lastColors || force) { renderColors(); lastColors = nc; }
  }
  $('prog-fill').style.width = `${Math.min(100, (s.d / s.length) * 100).toFixed(1)}%`;
}
function fly(pos3, text, cls = '') {
  const v = pos3.clone().project(camera);
  const el = document.createElement('div');
  el.className = 'fly ' + cls; el.textContent = text;
  el.style.left = `${Math.min(window.innerWidth - 50, Math.max(50, (v.x * 0.5 + 0.5) * window.innerWidth))}px`;
  el.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
  $('fx').appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// ---------- 事件反馈 ----------
const tmp = new THREE.Vector3();
const _fanBox = new THREE.Box3();
function tailWorld() { app.turkey.tail.getWorldPosition(tmp); return tmp.clone(); }
function spawnLoose(color, from, power = 6) {
  const m = M.buildFeather(color);
  m.position.copy(from);
  scene.add(m);
  const a = Math.random() * Math.PI * 2;
  app.loose.push({ m, v: new THREE.Vector3(Math.cos(a) * power * 0.6, 4 + Math.random() * power * 0.6, Math.sin(a) * power * 0.4 + 2), spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8), life: 1.6 });
}
function burstConfetti(at, n = 120) {
  const cols = [0xd6283a, 0xffc21a, 0x16b8a8, 0x8a4ad9, 0xff7a1a, 0xffffff];
  const geo = new THREE.PlaneGeometry(0.22, 0.12);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
    m.position.set(at.x + (Math.random() - 0.5) * 8, at.y + Math.random() * 3, at.z + (Math.random() - 0.5) * 4);
    scene.add(m);
    app.confetti.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 3, 3 + Math.random() * 5, (Math.random() - 0.5) * 3), life: 3 + Math.random() * 2 });
  }
}
function handleEvents() {
  const s = app.s;
  for (const ev of s.events) {
    const o = ev.it ? app.objs.itemObjs.get(ev.it.id) : null;
    if (ev.e === 'feather') {
      sfx.feather(ev.n);
      if (o) { o.visible = false; o.userData.gone = true; }
      const firstOfColor = s.feathers.filter((c) => c === ev.it.color).length === 1;
      fly(tailWorld().add(new THREE.Vector3(0, 1.2, 0)), firstOfColor ? `新颜色！${COLOR_NAMES[ev.it.color]}` : '+1', firstOfColor ? 'good' : 'small');
    } else if (ev.e === 'gate') {
      const good = ev.delta >= 0;
      if (good) sfx.gateGood(); else { sfx.gateBad(); for (let i = 0; i < Math.min(12, -ev.delta); i++) spawnLoose(s.feathers[i % Math.max(1, s.feathers.length)] || 'gold', tailWorld(), 4); }
      const label = { '+': '+', '-': '−', x: '×', '/': '÷' }[ev.it.op] + ev.it.v;
      const tricky = s.items.some((o) => o.type === 'gate' && o.d === ev.it.d && o.id !== ev.it.id && (o.op === '+' || o.op === 'x') === (ev.it.op === '+' || ev.it.op === 'x'));
      fly(tailWorld().add(new THREE.Vector3(0, 2, 0)), tricky ? (ev.smart ? `${label} 算得好！` : `${label} 选亏了…`) : `${label} 羽毛`, good && (ev.smart || !tricky) ? 'good' : 'bad');
      // 两扇门都淡出
      for (const [, g] of app.objs.itemObjs) if (g.userData.it.type === 'gate' && g.userData.it.d === ev.it.d) g.userData.fade = 1;
    } else if (ev.e === 'hit' && ev.shield) {
      sfx.shield(); app.shake = 0.2;
      fly(tailWorld().add(new THREE.Vector3(0, 2, 0)), `伙伴替你挡住了！−${ev.shield} 伙伴`, 'bad');
      if (o && o.userData.chef) o.userData.swing = 1;
      if (o && o.userData.pie) { o.userData.pie.pie.visible = false; o.userData.pie.splat.visible = true; }
    } else if (ev.e === 'hit') {
      sfx.hit(); setTimeout(() => sfx.gobble(), 120);
      app.shake = 0.35;
      const f = $('flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 90);
      for (let i = 0; i < Math.min(24, ev.lost.length); i++) spawnLoose(ev.lost[i], tailWorld(), 7);
      fly(tailWorld().add(new THREE.Vector3(0, 2, 0)), `${HIT_LABEL[ev.it.type] || '哎呀！'}−${ev.lost.length}`, 'bad');
      if (o && o.userData.chef) o.userData.swing = 1;
      if (o && o.userData.pie) { o.userData.pie.pie.visible = false; o.userData.pie.splat.visible = true; }
    } else if (ev.e === 'horn') {
      sfx.gateGood(); setTimeout(() => sfx.feather(ev.n), 90); setTimeout(() => sfx.feather(ev.n + 3), 180);
      if (o) { o.visible = false; o.userData.gone = true; }
      fly(tailWorld().add(new THREE.Vector3(0, 2, 0)), '丰收角！+6 彩羽', 'good');
      const f = $('flash'); f.classList.add('gold'); setTimeout(() => f.classList.remove('gold'), 160);
    } else if (ev.e === 'jump') {
      sfx.jump();
      fly(tailWorld().add(new THREE.Vector3(0, 1.6, 0)), '起飞！', 'good');
    } else if (ev.e === 'land') {
      sfx.land(); app.squash = 1;
    } else if (ev.e === 'cage') {
      sfx.crate(); setTimeout(() => sfx.gobble(), 150);
      if (o) {
        o.visible = false; o.userData.gone = true;
        const p0 = o.position.clone();
        for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(M.plankGeo, M.plankMat); m.position.copy(p0).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.3 + Math.random() * 1.2, (Math.random() - 0.5) * 1.2)); m.castShadow = true; scene.add(m); const a = Math.random() * Math.PI * 2; app.loose.push({ m, v: new THREE.Vector3(Math.cos(a) * 4, 5 + Math.random() * 3, Math.sin(a) * 3 - 3), spin: new THREE.Vector3(Math.random() * 9, Math.random() * 9, Math.random() * 9), life: 1.4 }); }
        app.cageFrom = p0;
      }
      fly(tailWorld().add(new THREE.Vector3(0, 2, 0)), `救出 ${ev.add} 只伙伴！`, 'good');
      const f = $('flash'); f.classList.add('blue'); setTimeout(() => f.classList.remove('blue'), 160);
    } else if (ev.e === 'corn') {
      sfx.corn();
      if (o) { o.visible = false; o.userData.gone = true; }
      fly(tailWorld().add(new THREE.Vector3(0, 2, 0)), '金玉米冲刺！', 'good');
      const f = $('flash'); f.classList.add('gold'); setTimeout(() => f.classList.remove('gold'), 160);
    } else if (ev.e === 'finish') {
      beginFinale();
    }
  }
}

// ---------- 终点开屏 ----------
function beginFinale() {
  app.phase = 'finale';
  $('status').hidden = true; $('danger').classList.remove('on');
  if (app.chaser) app.chaser.group.visible = false;
  app.finT = 0;
  app.finFrom = camera.position.clone();
  stopMusic();
  $('drag-hint').hidden = true;
}
function finaleTick(dt) {
  const s = app.s, t = app.turkey;
  app.finT += dt;
  const T = app.finT;
  const stageZ = -s.length - 2.5;
  // 0~1s 走上舞台中央并转身
  const k1 = Math.min(1, T / 1.0);
  t.root.position.x += (0 - t.root.position.x) * Math.min(1, dt * 4);
  t.root.position.z = -s.length + (stageZ + s.length) * k1;
  t.root.position.y = 0.5 * k1;
  t.root.rotation.y = Math.PI * Math.min(1, Math.max(0, (T - 0.6) / 0.6));
  app.fanFront = T > 0.9;
  if (app.friendObjs.length) friendsToStage(dt, stageZ);
  if (T > 1.5 && s.bonus && !app.bonusShown) { app.bonusShown = true; fly(new THREE.Vector3(0, 4.6, stageZ), `伙伴们送来 +${s.bonus} 根羽毛！`, 'good'); }
  // 1.2s 开屏
  if (T > 1.2 && !app.opened) { app.opened = true; sfx.fanOpen(); burstConfetti(new THREE.Vector3(0, 4, stageZ)); }
  if (T > 1.2) app.fanOpen = Math.min(1.25, app.fanOpen + dt * 1.6);
  // 2.2s 起评委亮分
  const res = s.result;
  [0, 1, 2].forEach((i) => {
    const at = 2.3 + i * 0.6;
    if (T > at && !app.cardShown?.[i]) {
      app.cardShown = app.cardShown || [];
      app.cardShown[i] = true;
      $('cards').hidden = false;
      const c = document.createElement('div');
      c.className = 'card'; c.innerHTML = `<span class="av">${['🐥', '🐔', '🐤'][i]}</span><b>${res.judges[i].toFixed(1)}</b><small>${['小黄 · 尾屏', '老白 · 色彩', '小粉 · 台风'][i]}</small>`;
      $('cards').appendChild(c);
      sfx.card(i);
      const jd = app.objs.stage.judges[i]; if (jd && jd.chick) jd.chick.userData.jump = 1;
    }
  });
  if (T > 4.6 && !app.resultShown) { app.resultShown = true; sfx.cheer(); showResult(); }
  // 镜头：从背后绕到正面
  const camK = Math.min(1, Math.max(0, (T - 0.3) / 1.4));
  const ease = camK * camK * (3 - 2 * camK);
  const back = app.finFrom ? app.finFrom.clone().setX(0) : new THREE.Vector3(0, 4.2, -s.length + 7.5), front = new THREE.Vector3(0, 3.4, stageZ - 9.5 + 18);
  const push = Math.min(1, Math.max(0, (T - 2.0) / 1.5)); const pe = push * push * (3 - 2 * push);
  camera.position.lerpVectors(back, new THREE.Vector3(0, 2.25 + 0.35 * pe, stageZ + 7.2 - 1.0 * pe), ease);
  camera.lookAt(0, 2.15 + 0.85 * ease, stageZ);
  stageKey.position.set(1.5, 6, stageZ + 6); stageKey.target.position.set(0, 1.4, stageZ); stageKey.intensity = 60 * ease;
  if (T > 1.2 && Math.random() < 0.5) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.softTex, color: 0xffd36a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.setScalar(0.12 + Math.random() * 0.12);
    sp.position.set((Math.random() - 0.5) * 7, 0.5 + Math.random() * 6, stageZ + (Math.random() - 0.2) * 3);
    scene.add(sp);
    app.confetti.push({ m: sp, v: new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.3 + Math.random() * 0.4, 0), life: 2.5 });
  }
}
function showResult() {
  const r = app.s.result;
  const L = app.s.level;
  if (r.total > save.best) save.best = r.total;
  if (r.total > (save.bests[L.id] || 0)) save.bests[L.id] = r.total;
  if (r.stars > (save.stars[L.id] || 0)) save.stars[L.id] = r.stars;
  writeSave();
  setTimeout(() => {
    app.phase = 'result';
    $('overlay').classList.remove('hidden');
    $('home').hidden = true; $('result').hidden = false;
    $('r-stars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < r.stars ? 'on' : ''}" style="animation-delay:${0.15 + i * 0.25}s">★</span>`).join('');
    for (let i = 0; i < r.stars; i++) setTimeout(() => sfx.star(i), 150 + i * 250);
    const pardoned = r.stars >= 1;
    $('r-title').textContent = pardoned ? (r.stars === 3 ? '全场最美！成功赦免！' : '赦免成功！') : '没能赦免…';
    $('cert').hidden = !pardoned; $('doom').hidden = pardoned;
    if (pardoned) {
      $('cert-text').innerHTML = `兹证明本火鸡在「${L.name}」以 <b>${r.n} 根</b>羽毛、<b>${r.colors} 种</b>丰收色的华丽开屏，荣获评委 <b>${r.total.toFixed(1)}</b> 分，<b>今年感恩节免上餐桌</b>，特发此证！`;
      const d = new Date(); $('cert-date').textContent = `${d.getFullYear()} 年感恩节`;
      sfx.gateGood();
    } else {
      $('doom-text').textContent = `只有 ${r.n} 根羽毛……大厨端着烤盘走过来了！快再跑一次！`;
    }
    $('r-total').textContent = r.total.toFixed(1);
    const dt0 = r.detail || { hits: 0, badGates: 0, rate: 1 };
    const why = [];
    if (dt0.hits) why.push(`被撞 ${dt0.hits} 次`);
    if (dt0.badGates) why.push(`选亏 ${dt0.badGates} 扇门`);
    why.push(`吃到 ${Math.round(dt0.rate * 100)}% 路上羽毛`);
    if (app.s.stats.caught) why.unshift(`被大厨追上 ${app.s.stats.caught} 次`);
    $('r-stats').innerHTML = `<div><i>尾屏</i><b>${r.judges[0].toFixed(1)}</b><em>${r.n} / 目标 ${L.par} 根</em></div>`
      + `<div><i>色彩</i><b>${r.judges[1].toFixed(1)}</b><em>${r.colors}/6 色${r.colors === 6 ? '，越均匀越高' : '，凑齐 6 色'}</em></div>`
      + `<div><i>台风</i><b>${r.judges[2].toFixed(1)}</b><em>${why.join('，')}</em></div>`
      + (L.cage ? `<p class="best">救出 ${app.s.stats.rescued} 只伙伴，${app.s.friends} 只陪你走到终点（+${app.s.bonus} 根羽毛）</p>` : '')
      + `<p class="best">本关最佳 ${(save.bests[L.id] || 0).toFixed(1)} 分</p>`;
    $('r-level').textContent = `第 ${app.level + 1} 关 · ${L.name}`;
    const hasNext = app.level < LEVELS.length - 1;
    $('btn-next').hidden = !(hasNext && unlocked(app.level + 1));
    $('btn-next').textContent = hasNext ? `下一关：${LEVELS[app.level + 1].name} →` : '';
    $('btn-again').className = $('btn-next').hidden ? 'primary' : 'ghost';
    if (!hasNext && r.stars >= 1) $('r-title').textContent = r.stars === 3 ? '总冠军！全场最美火鸡！' : '通关！成功赦免！';
  }, 900);
}

// ---------- 主循环 ----------
const clock = new THREE.Clock();
function frame() {
  lastFrame = performance.now();
  if (!rafPending) { rafPending = true; requestAnimationFrame(onRaf); }
  try { frameBody(); } catch (err) { console.error(err); }
}
let lastFrame = 0, rafPending = false;
function onRaf() { rafPending = false; frame(); }
setInterval(() => { if (performance.now() - lastFrame > 200) frame(); }, 33);

let simT = 0;
function frameBody(dtOv) {
  // dtOv：调试用固定步长（窗格隐藏时浏览器会节流计时器）
  const dt = dtOv || Math.min(clock.getDelta(), 0.05);
  simT += dt;
  const t = simT;
  const s = app.s;
  if (s && app.phase === 'run') {
    const kx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    if (kx) app.targetX = Math.max(-HALF, Math.min(HALF, app.targetX + kx * 8 * dt));
    app.acc += dt;
    while (app.acc >= 1 / 60 && app.phase === 'run') { app.acc -= 1 / 60; step(s, { targetX: app.targetX }, 1 / 60); handleEvents(); }
    updateHud(false);
  }
  if (s && app.turkey) renderRun(dt, t);
  if (app.phase === 'finale' || app.phase === 'result') finaleTick(dt);
  // 飞散的羽毛与彩纸
  for (let i = app.loose.length - 1; i >= 0; i--) {
    const l = app.loose[i];
    l.v.y -= 9 * dt; l.v.multiplyScalar(0.985);
    l.m.position.addScaledVector(l.v, dt);
    l.m.rotation.x += l.spin.x * dt; l.m.rotation.y += l.spin.y * dt; l.m.rotation.z += l.spin.z * dt;
    l.life -= dt;
    if (l.life <= 0 || l.m.position.y < -1) { scene.remove(l.m); app.loose.splice(i, 1); }
  }
  for (let i = app.confetti.length - 1; i >= 0; i--) {
    const c = app.confetti[i];
    c.v.y -= 3 * dt; c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += dt * 6; c.m.rotation.y += dt * 4;
    c.life -= dt;
    if (c.life <= 0) { scene.remove(c.m); app.confetti.splice(i, 1); }
  }
  if (app.camOv) { camera.position.copy(app.camOv.p); camera.lookAt(app.camOv.l); }
  post.render(scene, camera);
}

function renderRun(dt, t) {
  const s = app.s, tk = app.turkey;
  const running = app.phase === 'run';
  if (running) {
    tk.root.position.set(s.x, s.y, -s.d);
    tk.root.rotation.y = 0;
    tk.body.rotation.z = -s.vx * (s.slip ? 0.09 : 0.04);
    tk.root.rotation.x = s.air ? -0.18 * Math.cos(Math.PI * Math.min(1, (s.t - s.air.t0))) : 0;
  }
  app.squash = Math.max(0, (app.squash || 0) - dt * 5);
  { const q = Math.sin(app.squash * Math.PI) * 0.12; tk.body.scale.set(1 + q, 1 - q, 1 + q); }
  const ph = t * 16;
  const amp = running ? (s.air ? 0.05 : 0.6) : 0.1;
  tk.legs[0].rotation.x = Math.sin(ph) * amp; tk.legs[1].rotation.x = -Math.sin(ph) * amp;
  tk.body.position.y = running ? Math.abs(Math.sin(ph)) * 0.08 : 0;
  // 昂首点头的走秀步伐
  tk.head.position.z = -0.44 + (running ? Math.sin(ph) * 0.05 : Math.sin(t * 2.5) * 0.03);
  tk.head.rotation.x = running ? -0.1 + Math.sin(ph) * 0.06 : -0.15 + Math.sin(t * 2.5) * 0.06;
  tk.body.rotation.x = running ? -0.04 : -0.08;
  tk.wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * (0.15 + (running ? Math.abs(Math.sin(ph * 0.5)) * 0.25 : Math.sin(t * 6) * 0.2)); });
  tk.snood.rotation.z = Math.sin(t * 8) * 0.06;
  M.layoutFan(tk, s.feathers, app.fanOpen, t, !!app.fanFront);
  const leanT = running ? 0.62 * Math.min(1, s.feathers.length / 100) : 0;
  tk.tail.rotation.x += (leanT - tk.tail.rotation.x) * Math.min(1, dt * 4);
  // 跑动时尾屏收小一点（不挡路），到终点舞台再完全展开
  const tailS = running ? 1 - 0.2 * Math.min(1, s.feathers.length / 80) : 1;
  tk.tail.scale.setScalar(tk.tail.scale.x + (tailS - tk.tail.scale.x) * Math.min(1, dt * 3));
  // 尾屏越大，火鸡越昂首挺胸
  const n = s.feathers.length;
  tk.root.scale.setScalar(1 + Math.min(0.25, n / 240));
  // 道具动画
  for (const [, o] of app.objs.itemObjs) {
    const it = o.userData.it;
    const ahead = it.d - s.d;
    if (!o.userData.gone) o.visible = (it.type === 'zone' ? ahead + it.len : ahead) > -12 && ahead < 75;
    if (!o.visible) continue;
    if (o.userData.spin) { o.userData.spin.rotation.y += dt * 2.5; o.userData.spin.position.y = 0.45 + Math.sin(t * 3 + it.d) * 0.12; }
    if (o.userData.hornSpin) { o.userData.hornSpin.rotation.y = Math.PI + 0.5 + Math.sin(t * 1.5) * 0.5; o.userData.hornSpin.position.y = 0.3 + Math.sin(t * 3) * 0.1; }
    if (o.userData.roller) { const nx = hazardX(it, s.t); const r0 = o.userData.roller; r0.rotation.z -= (nx - r0.position.x) / 1.25; r0.position.x = nx; }
    if (o.userData.pie && !s.taken.has(it.id)) {
      // 派从路边人群飞出、落到红圈里
      const pi = o.userData.pie;
      const land = Math.min(1, Math.max(0, (s.d - (it.d - 26)) / 10));
      pi.pie.visible = land > 0;
      const from = new THREE.Vector3(Math.sign(it.x || 1) * 7 - it.x, 2.5, 6);
      pi.pie.position.set(from.x * (1 - land), from.y * (1 - land) + Math.sin(land * Math.PI) * 4, from.z * (1 - land));
      pi.pie.rotation.x = (1 - land) * 8;
      pi.warn.scale.setScalar(1 + Math.sin(t * 10) * 0.08);
    }
    if (it.type === 'gate' && it.slide) { const [a, b] = gateBounds(it, s.t); M.layoutGate(o, a, b); }
    if (o.userData.bulbs) o.userData.bulbs.children.forEach((b, i) => { b.visible = Math.floor(t * 8 - i) % 3 !== 0; });
    if (o.userData.cornSpin) { o.userData.cornSpin.rotation.y += dt * 3; o.userData.cornSpin.position.y = 0.9 + Math.sin(t * 4) * 0.12; }
    if (o.userData.steam) o.userData.steam.forEach((sp, i) => { const k = (t * 0.6 + i / 3) % 1; sp.position.y = 0.8 + k * 1.4; sp.material.opacity = 0.3 * Math.sin(k * Math.PI); });
    if (o.userData.sparkle) o.userData.sparkle.children.forEach((sp, i) => { sp.scale.setScalar(0.4 + Math.max(0, Math.sin(t * 3 + i * 1.7)) * 1.2); });
    if (o.userData.label && o.userData.kids) { o.userData.label.position.y = 2.25 + Math.sin(t * 3) * 0.1; o.userData.kids.forEach((k, i) => { k.body.position.y = 0.32 + Math.abs(Math.sin(t * 6 + i)) * 0.06; k.root.rotation.y = Math.PI + Math.sin(t * 2 + i) * 0.5; }); }
    if (o.userData.fork) {
      // 叉子：前方 24m 起开始坠落，16m 时插进桌面
      const k = Math.min(1, Math.max(0, (24 - ahead) / 8));
      const fk = o.userData.fork;
      fk.position.y = k < 1 ? 12 * (1 - k * k) - 0.55 * k * k : -0.55 + Math.sin(Math.max(0, t * 30)) * 0.02 * Math.max(0, 1 - (16 - ahead) / 3);
      fk.rotation.z = 0.08 * (1 - k);
      o.userData.shadow.material.opacity = 0.12 + 0.35 * k; o.userData.shadow.scale.setScalar(0.5 + 0.6 * k);
      o.userData.ring.material.opacity = 0.35 + 0.35 * Math.abs(Math.sin(t * 8));
      if (k >= 1 && !o.userData.landed) { o.userData.landed = true; if (ahead < 30) { sfx.land(); app.shake = Math.max(app.shake, 0.12); } }
    }
    if (o.userData.rotor) { o.position.x = hazardX(it, s.t); o.userData.rotor.rotation.z = t * 10; }
    if (o.userData.chef) {
      const ch = o.userData.chef;
      const nx = hazardX(it, s.t);
      ch.body.rotation.z = (nx - o.position.x) * -2;
      o.position.x = nx;
      ch.body.position.y = Math.abs(Math.sin(t * 8)) * 0.1;
      if (o.userData.swing) { o.userData.swing = Math.max(0, o.userData.swing - dt * 2); ch.pan.rotation.z = -0.6 - Math.sin(o.userData.swing * Math.PI) * 1.2; }
    }
    if (o.userData.fade) { o.userData.fade = Math.max(0, o.userData.fade - dt * 2.5); o.scale.y = o.userData.fade; if (o.userData.fade <= 0) { o.visible = false; o.userData.gone = true; } }
  }
  for (const j of app.objs.stage.judges) if (j.chick.userData.jump) { j.chick.userData.jump = Math.max(0, j.chick.userData.jump - dt * 1.5); j.chick.position.y = 1.6 + Math.sin(j.chick.userData.jump * Math.PI) * 0.8; }
  updateFriends(dt, t);
  updateChaser(dt, t);
  // 镜头：跟在火鸡身后上方，尾屏越大镜头越拉远
  if (running) {
    app.shake = Math.max(0, app.shake - dt);
    app.camX += (s.x * 0.55 - app.camX) * Math.min(1, dt * 4);
    if ((app.fanTick = (app.fanTick || 0) + 1) % 5 === 0 || !app.fanTop) {
      _fanBox.setFromObject(tk.tail);
      app.fanTopT = Number.isFinite(_fanBox.max.y) ? _fanBox.max.y - tk.root.position.y : 2;
      app.fanZ = Number.isFinite(_fanBox.max.z) ? _fanBox.max.z + s.d : 0.6;
      if (!app.fanTop) app.fanTop = app.fanTopT;
    }
    app.fanTop += (app.fanTopT - app.fanTop) * Math.min(1, dt * 3);
    const H = Math.max(2.2, app.fanTop);
    const Dz = 7.2 + Math.min(2.4, Math.max(0, H - 2.6) * 0.9);
    const AHEAD = 11.5;
    const fz = Math.min(Dz - 1, Math.max(0, app.fanZ || 0.6));
    const Hc = Math.max(4.4, (H + 0.5) + (H + 0.5) * (Dz - fz) / (AHEAD + fz));
    const sh = app.shake * 0.4;
    app.camH = app.camH ? app.camH + (Hc - app.camH) * Math.min(1, dt * 2.5) : Hc;
    const camY = app.camH + s.y * 0.55;
    camera.position.set(app.camX + (Math.random() - 0.5) * sh, camY, -s.d + Dz);
    // 俯仰角：让火鸡脚下固定落在画面约 80% 高度处（横屏竖屏都不出画）
    const aT = Math.atan2(camY - s.y * 0.75, Dz);
    const th = aT - Math.atan(0.6 * Math.tan(THREE.MathUtils.degToRad(app.baseFov / 2)));
    camera.lookAt(app.camX * 0.8, camY - Math.tan(th) * 20, -s.d + Dz - 20);
    // 金玉米冲刺：镜头视角拉宽
    const fovT = s.boostT > 0 ? 7 : 0;
    app.boostFov += (fovT - app.boostFov) * Math.min(1, dt * 5);
    if (Math.abs(camera.fov - (app.baseFov + app.boostFov)) > 0.05) { camera.fov = app.baseFov + app.boostFov; camera.updateProjectionMatrix(); }
  }
  for (const f of app.objs.world.userData.ticks || []) f(t, dt);
  app.objs.world.userData.camZ = camera.position.z;
  // 阳光在前方右侧低角度照来，影子拖向镜头，逆光勾边
  const tp = tk.root.position;
  follow.intensity = (follow.userData.k || 0) * (app.phase === 'run' ? 1 : 0.4);
  follow.position.set(tp.x + 0.5, 9, tp.z + 4); follow.target.position.set(tp.x, 0.8, tp.z - 1);
  sun.position.set(tp.x + 9, 13, tp.z - 16);
  sun.target.position.set(tp.x, 0, tp.z - 2);
  fillL.position.set(camera.position.x - 4, camera.position.y + 4, camera.position.z + 6);
  fillL.target.position.copy(tp);
}

// ---------- 第二章：伙伴队伍 ----------
const SLOTS = [];
// 伙伴排在火鸡两侧（不挡镜头）：每排左右各两只，往后错开
for (let row = 0; row < 5; row++) for (let k = 0; k < 4; k++) { const side = k % 2 ? 1 : -1, lane = k < 2 ? 0 : 1; SLOTS.push([side * (1.15 + lane * 0.85 + (row % 2) * 0.2), -0.7 + row * 0.7 + lane * 0.3]); }
function updateFriends(dt, t) {
  const s = app.s, root = app.objs.root;
  const want = app.phase === 'run' ? s.friends : app.friendObjs.length;
  while (app.friendObjs.length < want) {
    const f = M.buildFriend(app.friendObjs.length);
    const from = app.cageFrom || app.turkey.root.position;
    f.root.position.set(from.x, 0, from.z); f.root.scale.setScalar(0.01); f.pop = 0;
    root.add(f.root); app.friendObjs.push(f);
  }
  while (app.friendObjs.length > want) {
    const f = app.friendObjs.pop();
    const dir = f.root.position.x >= s.x ? 1 : -1;
    app.fleeing.push({ f, v: new THREE.Vector3(dir * 7, 4, 3), life: 1.6 });
  }
  if (app.phase === 'run' && s.friends !== app.lastFriends) { $('friends-n').textContent = s.friends; const e = $('friends'); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); app.lastFriends = s.friends; }
  const tp = app.turkey.root.position;
  app.friendObjs.forEach((f, i) => {
    f.pop = Math.min(1, f.pop + dt * 3);
    const k = f.pop < 1 ? 0.2 + 0.8 * (1 - Math.pow(1 - f.pop, 3)) * (1 + 0.3 * Math.sin(f.pop * Math.PI)) : 1;
    f.root.scale.setScalar(k * 0.72);
    if (app.phase === 'run') {
      const [ox, oz] = SLOTS[i % SLOTS.length];
      // 靠近路边时整队往里收
      const cx = Math.max(-HALF + 1.2, Math.min(HALF - 1.2, tp.x));
      const tx = Math.max(-HALF - 0.6, Math.min(HALF + 0.6, cx + ox)), tz = tp.z + oz;
      f.root.position.x += (tx - f.root.position.x) * Math.min(1, dt * (5 - (i % 3)));
      f.root.position.z += (tz - f.root.position.z) * Math.min(1, dt * 8);
      f.root.position.y = Math.max(0, tp.y * (0.6 - i * 0.03));
      f.root.rotation.y = 0;
      const ph = t * 17 + i * 1.3;
      f.legs[0].rotation.x = Math.sin(ph) * 0.7; f.legs[1].rotation.x = -Math.sin(ph) * 0.7;
      f.body.position.y = 0.32 + Math.abs(Math.sin(ph)) * 0.07;
      f.fan.scale.setScalar(1);
    }
  });
  for (let i = app.fleeing.length - 1; i >= 0; i--) {
    const q = app.fleeing[i];
    q.v.y -= 9 * dt; q.f.root.position.addScaledVector(q.v, dt); q.f.root.rotation.y += dt * 8; q.life -= dt;
    if (q.life <= 0) { root.remove(q.f.root); app.fleeing.splice(i, 1); }
  }
}
function updateChaser(dt, t) {
  const s = app.s, ch = app.chaser;
  if (!ch) return;
  const running = app.phase === 'run';
  const gap = s.chase.gap;
  // 视觉距离压缩：差距 0~16m 映射到火鸡侧后方 1.4~6.2m，从画面一侧追上来，不挡火鸡
  const vd = 1.4 + Math.min(16, Math.max(0, gap)) * 0.3;
  const tp = app.turkey.root.position;
  ch.group.visible = running && gap < 16;
  if (running) {
    ch.group.position.z = tp.z + vd;
    const sideX = tp.x > 0.3 ? tp.x - 2.1 : tp.x < -0.3 ? tp.x + 2.1 : (ch.group.position.x >= tp.x ? tp.x + 2.1 : tp.x - 2.1);
    ch.group.position.x += (Math.max(-HALF - 0.8, Math.min(HALF + 0.8, sideX)) - ch.group.position.x) * Math.min(1, dt * 2.5);
    ch.group.rotation.y = Math.atan2(ch.group.position.x - tp.x, 3) * 0.6;
    ch.body.position.y = Math.abs(Math.sin(t * 13)) * 0.18;
    ch.body.rotation.x = -0.25;
    ch.pan.rotation.z = -0.6 - Math.abs(Math.sin(t * 6.5)) * 1.1;
    const near = gap < 5;
    $('chase-fill').style.width = `${Math.max(0, Math.min(100, (gap / 18) * 100)).toFixed(0)}%`;
    $('chase-m').textContent = `${Math.max(0, gap).toFixed(0)}m`;
    $('chase').classList.toggle('near', near);
    $('danger').classList.toggle('on', near);
  } else $('danger').classList.remove('on');
}
function friendsToStage(dt, stageZ) {
  const n = app.friendObjs.length;
  app.friendObjs.forEach((f, i) => {
    const side = i % 2 ? 1 : -1, k = Math.floor(i / 2);
    const tx = side * (1.85 + (k % 4) * 0.58), tz = stageZ - 0.5 - Math.floor(k / 4) * 0.75 - (k % 4) * 0.2;
    f.root.position.x += (tx - f.root.position.x) * Math.min(1, dt * 3);
    f.root.position.z += (tz - f.root.position.z) * Math.min(1, dt * 3);
    f.root.position.y += (0.5 - f.root.position.y) * Math.min(1, dt * 4);
    f.root.rotation.y += (Math.PI - side * 0.25 - f.root.rotation.y) * Math.min(1, dt * 4);
    f.fan.scale.setScalar(Math.min(1.5, f.fan.scale.x + dt * 1.2));
    f.legs[0].rotation.x = f.legs[1].rotation.x = 0;
    f.body.position.y = 0.32 + Math.abs(Math.sin(app.finT * 5 + i)) * 0.05;
  });
  void n;
}

// ---------- 首页大图 ----------
function makeHero() {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(460, 400); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
  const sc = new THREE.Scene();
  sc.environment = M.makeEnv(r);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x8a6a4a, 1.2));
  const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(-3, 5, -6); sc.add(d);
  const rimL = new THREE.DirectionalLight(0xffd090, 1.6); rimL.position.set(4, 3, 4); sc.add(rimL);
  const tk = M.buildTurkey();
  const cols = []; for (let i = 0; i < 42; i++) cols.push(COLORS[i % COLORS.length]);
  for (let k = 0; k < 12; k++) M.layoutFan(tk, cols, 1.2, 0);
  tk.root.rotation.y = 0.35;
  sc.add(tk.root);
  const cam = new THREE.PerspectiveCamera(32, 460 / 400, 0.1, 50);
  cam.position.set(-1.2, 2.3, -8.6); cam.lookAt(0, 2.0, 0);
  r.render(sc, cam);
  const url = r.domElement.toDataURL('image/png');
  r.dispose(); r.forceContextLoss?.();
  return url;
}

// ---------- 启动 ----------
try {
  setSound(save.sound);
  $('btn-sound').textContent = save.sound ? '🔊' : '🔇';
  $('hero').src = makeHero();
  $('best').textContent = save.best ? `最高纪录：${save.best.toFixed(1)} 分` : '';
  // 首页背景：当前选中关卡的静止跑道
  if (!unlocked(app.level)) app.level = 0;
  renderLevels();
  previewLevel(app.level);
  frame();
  setTimeout(() => { $('loading').hidden = true; }, 150);
  window.__tf = { app, start, M, THREE, COLORS, LEVELS, save, scene, camera, renderer, post, showHome, sim: (sec, dt = 1 / 30) => { for (let k = 0; k < sec / dt; k++) frameBody(dt); } };
} catch (err) {
  console.error(err);
  $('loading').innerHTML = `<b>加载失败</b><small>${err.message}</small>`;
}
