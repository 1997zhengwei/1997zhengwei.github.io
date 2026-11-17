import * as THREE from '../vendor/three.module.js';
import { LEVELS, PEOPLE, SEAT, SEATS, WARM_SEATS, DOG_SEATS, HEAD_SEATS, DISHES, ROW_Z } from './data.mjs';
import {
  evaluate, relations, activeRules, ruleText, traitTexts, moodBand, simulate, quoteFor,
  complainLine, enjoyLine, argueLines, threshold, neighborsOf, HIT_LINES,
} from './rules.mjs';
import * as M from './models.mjs';
import { sfx, unlockAudio, setSound, soundOn } from './audio.mjs';

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'tg-seating-v1';
const save = loadSave();

function loadSave() {
  try { return { stars: {}, sound: true, ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch { return { stars: {}, sound: true }; }
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* 无痕模式等 */ } }

// ---------- three 基础 ----------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a1610);
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

scene.add(new THREE.HemisphereLight(0xfff0d8, 0x6b3b22, 1.25));
const sun = new THREE.DirectionalLight(0xffe2b8, 2.1);
sun.position.set(-4, 11, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
sun.shadow.bias = -0.0008;
sun.shadow.radius = 4;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xc8d8ff, 0.45);
fill.position.set(5, 6, 8);
scene.add(fill);

const roomParts = M.buildRoom(scene);
const tableParts = M.buildTable(scene);
const seatObjs = M.buildSeats(scene);
const dishHolder = {};
const dog = M.buildDog();
dog.root.position.set(-2.6, 0.12, 4.25);
dog.root.rotation.y = 0.9;
scene.add(dog.root);

// 人物模型（复用）
const persons = {};
for (const pid in PEOPLE) {
  const p = M.buildPerson(PEOPLE[pid].look);
  p.pid = pid;
  p.baseScale = PEOPLE[pid].look.height;
  persons[pid] = p;
}

// ---------- 状态 ----------
const state = {
  phase: 'home', level: LEVELS[0], assign: {}, selected: null, inspect: null,
  sim: null, speed: 1, skip: false, introClosed: false, lastMoods: {},
};

// ---------- 动画工具 ----------
const tweens = [];
function tween(dur, fn, ease = easeInOut) {
  return new Promise((resolve) => {
    if (state.skip && state.phase === 'dinner') { fn(1); resolve(); return; }
    tweens.push({ t: 0, dur, fn, ease, resolve });
  });
}
function easeInOut(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
function easeOutBack(k) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }
function linear(k) { return k; }
function wait(ms) {
  return new Promise((resolve) => {
    if (state.skip) { resolve(); return; }
    tweens.push({ t: 0, dur: ms / 1000, fn: () => {}, ease: linear, resolve });
  });
}
function lerp(a, b, k) { return a + (b - a) * k; }

const particles = [];
function burst(pos, color, n = 12, power = 2.4) {
  const geo = new THREE.SphereGeometry(0.05, 6, 5);
  const material = M.mat(color);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, material);
    m.position.copy(pos);
    const a = Math.random() * Math.PI * 2;
    const v = new THREE.Vector3(Math.cos(a) * power * (0.4 + Math.random()), 1.5 + Math.random() * 2.2, Math.sin(a) * power * (0.4 + Math.random()));
    scene.add(m);
    particles.push({ m, v, life: 0.9 + Math.random() * 0.4 });
  }
}

// ---------- 画像 ----------
const portraits = {};
function makePortraits() {
  const pr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  pr.setSize(160, 160);
  pr.outputColorSpace = THREE.SRGBColorSpace;
  pr.toneMapping = THREE.ACESFilmicToneMapping;
  const s = new THREE.Scene();
  s.add(new THREE.HemisphereLight(0xfff0d8, 0x8a5a3a, 1.6));
  const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(1, 2, 3); s.add(d);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  for (const pid in PEOPLE) {
    const look = PEOPLE[pid].look;
    const p = M.buildPerson(look);
    M.setExpression(p, 2);
    s.add(p.root);
    const hy = 1.98 * look.height;
    cam.position.set(0.45, hy + 0.15, 2.5);
    cam.lookAt(0, hy - 0.12, 0);
    pr.render(s, cam);
    portraits[pid] = pr.domElement.toDataURL('image/png');
    s.remove(p.root);
  }
  pr.dispose();
  pr.forceContextLoss?.();
}

// ---------- 镜头适配 ----------
const UI = { top: 120, bottom: 190 };
const cam = { basePos: new THREE.Vector3(), baseTarget: new THREE.Vector3(), focus: new THREE.Vector3(), k: 0, kTarget: 0, shake: 0 };
function focusOn(point, k = 0.45) { cam.focus.copy(point); cam.kTarget = k; }
function unfocus() { cam.kTarget = 0; }
function fitCamera() {
  const W = window.innerWidth, H = window.innerHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  const pts = [];
  const seats = state.level.seats.map((id) => SEAT[id]);
  for (const s of seats) {
    const ox = s.side === 'L' ? -0.55 : s.side === 'R' ? 0.55 : 0;
    const oz = s.side === 'H' ? Math.sign(s.z) * 0.5 : 0;
    pts.push(new THREE.Vector3(s.x + ox, 0.2, s.z + oz), new THREE.Vector3(s.x + ox, 2.9, s.z + oz));
  }
  const zs = seats.map((s) => s.z);
  for (const x of [-1.5, 1.5]) for (const z of [Math.min(...zs) - 0.7, Math.max(...zs) + 0.7]) pts.push(new THREE.Vector3(x, 1.1, z));
  const box = new THREE.Box3().setFromPoints(pts);
  const center = box.getCenter(new THREE.Vector3());
  center.y = 0.9;
  const el = THREE.MathUtils.degToRad(W > H ? 34 : 50);
  const dir = new THREE.Vector3(0, Math.sin(el), Math.cos(el));
  const top = UI.top, bottom = state.phase === 'dinner' ? 70 : UI.bottom;
  const availY = Math.max(0.3, (H - top - bottom) / H) * 0.96;
  const availX = 1 - 28 / W;
  camera.clearViewOffset();
  let lo = 3, hi = 60;
  const v = new THREE.Vector3();
  for (let i = 0; i < 30; i++) {
    const d = (lo + hi) / 2;
    camera.position.copy(center).addScaledVector(dir, d);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    let ok = true;
    for (const p of pts) {
      v.copy(p).project(camera);
      if (Math.abs(v.x) > availX || Math.abs(v.y) > availY) { ok = false; break; }
    }
    if (ok) hi = d; else lo = d;
  }
  camera.position.copy(center).addScaledVector(dir, hi);
  camera.lookAt(center);
  cam.basePos.copy(camera.position); cam.baseTarget.copy(center);
  const offsetY = (bottom - top) / 2;
  camera.setViewOffset(W, H, 0, offsetY, W, H);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', fitCamera);

// ---------- 标签层 ----------
const labelsEl = $('labels');
let labels = []; // {el, pos: () => Vector3}
let relLines = [];
const relSvg = $('rel-lines');
const toScreen = (v) => { tmpV2.copy(v).project(camera); return [(tmpV2.x * 0.5 + 0.5) * window.innerWidth, (-tmpV2.y * 0.5 + 0.5) * window.innerHeight]; };
const tmpV2 = new THREE.Vector3();
function drawRelLines(t) {
  if (state.phase !== 'arrange' || !relLines.length) { relSvg.innerHTML = ''; return; }
  let html = '';
  for (const r of relLines) {
    if (!persons[r.a].root.parent || !persons[r.b].root.parent) continue;
    const [x1, y1] = toScreen(headPos(r.a, -0.25)), [x2, y2] = toScreen(headPos(r.b, -0.25));
    if (r.kind === 'like') {
      html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="like" />`;
    } else {
      // 闪电折线
      const n = 7, dx = (x2 - x1) / n, dy = (y2 - y1) / n, len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const nx = -dy / len * n, ny = dx / len * n;
      let d = `M${x1},${y1}`;
      for (let i = 1; i < n; i++) { const j = (i % 2 ? 1 : -1) * (6 + Math.sin(t * 20 + i) * 3); d += ` L${x1 + dx * i + nx * j / n * 1.0},${y1 + dy * i + ny * j / n * 1.0}`; }
      d += ` L${x2},${y2}`;
      html += `<path d="${d}" class="hate" />`;
    }
  }
  relSvg.innerHTML = html;
}
function clearLabels(kind) {
  labels = labels.filter((l) => {
    if (!kind || l.kind === kind) { l.el.remove(); return false; }
    return true;
  });
}
function addLabel(kind, html, cls, posFn, ttl) {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  labelsEl.appendChild(el);
  const l = { kind, el, pos: posFn, born: performance.now(), ttl };
  labels.push(l);
  updateLabel(l);
  return l;
}
const tmpV = new THREE.Vector3();
function updateLabel(l) {
  const p = l.pos();
  if (!p) { l.el.style.display = 'none'; return; }
  tmpV.copy(p).project(camera);
  const x = (tmpV.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-tmpV.y * 0.5 + 0.5) * window.innerHeight;
  l.el.style.display = tmpV.z > 1 ? 'none' : '';
  let cx = x;
  if (l.kind !== 'fx' && l.kind !== 'rel') {
    const half = (l.w ||= l.el.offsetWidth) / 2;
    cx = Math.min(window.innerWidth - half - 6, Math.max(half + 6, x));
  }
  l.el.style.left = cx + 'px';
  l.el.style.top = y + 'px';
}
function headPos(pid, up = 0.48) {
  const p = persons[pid];
  const v = new THREE.Vector3();
  p.head.getWorldPosition(v);
  v.y += up * p.baseScale;
  return v;
}
function bubble(pid, text, cls = '', ms = 1600) {
  // 每人同时只保留一个气泡
  labels.filter((l) => l.kind === 'bubble' && l.pid === pid).forEach((l) => { l.ttl = 0; });
  const l = addLabel('bubble', text, 'bubble ' + cls, () => headPos(pid, 0.62), ms / state.speed);
  l.pid = pid;
}
function fxText(pos, text, cls = '') {
  addLabel('fx', text, 'fx ' + cls, () => pos, 1100);
}

// ---------- 图标化规则（不用读字） ----------
const ZONE_ICON = { likeWarm: '🔥', hateWarm: '🔥', likeDog: '🐶', hateDog: '🐶', likeHead: '👑' };
function ruleChip(rule, status = '') {
  const t = ruleText(rule);
  const good = t.good;
  let inner;
  if (rule.type === 'likePerson' || rule.type === 'hatePerson') inner = `<img src="${portraits[rule.who]}" alt="${PEOPLE[rule.who].name}">`;
  else if (rule.type === 'likeDish' || rule.type === 'hateDish') inner = `<em>${DISHES[rule.dish].icon}</em>`;
  else inner = `<em>${ZONE_ICON[rule.type]}</em>`;
  const mark = good ? '❤️' : rule.type === 'hatePerson' ? '⚡' : '🚫';
  return `<span class="chip ${good ? 'like' : 'hate'} ${status}" title="${t.text}">${inner}<i>${mark}</i></span>`;
}
const TRAIT_CHIPS = { peacemaker: '🕊️ 会劝架', temper: '💢 急脾气', clumsy: '🌀 会砸歪' };
function traitChips(pid) {
  const t = PEOPLE[pid].traits || {};
  return Object.keys(t).filter((k) => t[k]).map((k) => `<span class="tchip">${TRAIT_CHIPS[k]}</span>`).join('');
}
function introHtml(level) {
  return (level.tip || []).map((x) => typeof x === 'string' ? `<span>${x}</span>` : `<img src="${portraits[x.p]}" alt="">`).join('');
}

// ---------- 关卡 ----------
function startLevel(level, keepAssign = false) {
  state.level = level;
  state.phase = 'arrange';
  state.selected = null; state.inspect = null; state.sim = null; state.skip = false; state.speed = 1;
  if (!keepAssign) state.assign = {};
  state.lastMoods = {};
  // 座位显隐
  for (const id in seatObjs) {
    const on = level.seats.includes(id);
    seatObjs[id].root.visible = on;
    seatObjs[id].plate.visible = on;
  }
  M.placeDishes(scene, level, dishHolder);
  dog.root.visible = level.seats.some((s) => DOG_SEATS.includes(s));
  // 清理人物
  for (const pid in persons) {
    const p = persons[pid];
    p.root.parent?.remove(p.root);
    resetPose(p);
    p.splatHolder.clear();
  }
  for (const s in state.assign) attachPerson(state.assign[s], s, false);
  $('level-mode').textContent = level.mode === 'chaos' ? '🔥 食物大战关' : '🕊️ 和睦晚宴关';
  $('level-mode').className = level.mode === 'chaos' ? 'chaos' : '';
  $('level-title').textContent = `第 ${level.id} 关 · ${level.name}`;
  const tip = $('intro-tip');
  tip.innerHTML = `<button aria-label="关闭提示">✕</button><div class="tip-row">${introHtml(level)}</div>`;
  tip.classList.remove('hide');
  tip.querySelector('button').onclick = () => tip.classList.add('hide');
  $('overlay').classList.add('hidden');
  $('dock').hidden = false;
  $('playbar').hidden = true;
  clearLabels();
  buildStaticTags();
  fitCamera();
  refresh();
  showTutorialHand();
}

// 第一关：手势演示“把卡片拖到座位上”
function showTutorialHand() {
  const hand = $('tut-hand');
  hand.hidden = true;
  if (state.level.id !== 1 || Object.keys(state.assign).length || save.tutDone) return;
  setTimeout(() => {
    const card = document.querySelector('#tray .card');
    if (!card || state.phase !== 'arrange' || Object.keys(state.assign).length) return;
    const r = card.getBoundingClientRect();
    const target = SEAT.L2;
    const v = new THREE.Vector3(target.x, 1.4, target.z).project(camera);
    const tx = (v.x * 0.5 + 0.5) * window.innerWidth, ty = (-v.y * 0.5 + 0.5) * window.innerHeight;
    hand.style.setProperty('--x0', `${r.left + r.width / 2}px`); hand.style.setProperty('--y0', `${r.top + r.height / 2}px`);
    hand.style.setProperty('--x1', `${tx}px`); hand.style.setProperty('--y1', `${ty}px`);
    hand.style.setProperty('--img', `url(${portraits[state.level.people[0]]})`);
    hand.hidden = false;
  }, 500);
}

function buildStaticTags() {
  const lv = state.level;
  for (const row in lv.dishes) {
    const d = DISHES[lv.dishes[row]];
    addLabel('static', `${d.icon}`, 'dish-tag', () => new THREE.Vector3(0, 1.3, ROW_Z[row] - 0.62));
  }
  if (lv.seats.some((s) => WARM_SEATS.includes(s))) addLabel('static', '🔥', 'zone-tag big', () => new THREE.Vector3(3.6, 2.9, -5.0));
  if (lv.seats.some((s) => DOG_SEATS.includes(s))) addLabel('static', '🐶', 'zone-tag big dog', () => new THREE.Vector3(-2.6, 1.15, 4.25));
  for (const h of HEAD_SEATS) if (lv.seats.includes(h)) addLabel('static', '👑', 'zone-tag big head', () => (state.assign[h] ? null : new THREE.Vector3(SEAT[h].x, 1.7, SEAT[h].z)));
}

function attachPerson(pid, seatId, animate = true) {
  const p = persons[pid];
  seatObjs[seatId].root.add(p.root);
  p.root.position.set(0, 0, 0);
  resetPose(p);
  if (animate) {
    p.root.scale.setScalar(0.01);
    tween(0.35, (k) => p.root.scale.setScalar(Math.max(0.01, p.baseScale * easeOutBack(k))), linear);
  } else p.root.scale.setScalar(p.baseScale);
}
function detachPerson(pid) { persons[pid].root.parent?.remove(persons[pid].root); }

function resetPose(p) {
  p.body.position.set(0, 0, 0);
  p.body.rotation.set(0, 0, 0);
  p.arms[0].rotation.set(-0.9, 0, -0.12);
  p.arms[1].rotation.set(-0.9, 0, 0.12);
  p.head.rotation.set(0, 0, 0);
}

function seatedPeople() { return Object.values(state.assign); }
function unseated() { return state.level.people.filter((pid) => !seatedPeople().includes(pid)); }
function seatOfPid(pid) { for (const s in state.assign) if (state.assign[s] === pid) return s; return null; }

// ---------- 刷新预览 ----------
function refresh() {
  const lv = state.level;
  const { moods, details } = evaluate(lv, state.assign);
  const rel = relations(lv, state.assign);
  // 表情 + 头顶徽章
  clearLabels('badge');
  clearLabels('rel');
  for (const pid of seatedPeople()) {
    const m = moods[pid];
    M.setExpression(persons[pid], m);
    const b = moodBand(m);
    const seat = seatOfPid(pid);
    const angry = m <= threshold(pid) && neighborsOf(state.assign, seat).some((q) => activeRules(lv, pid).some((r) => r.type === 'hatePerson' && r.who === q));
    const changed = state.lastMoods[pid] !== undefined && state.lastMoods[pid] !== m;
    // 不开心的原因直接画在头顶：讨厌的人头像/暖炉/狗/菜
    const causes = (details[pid] || []).filter((x) => x.delta < 0).map((x) => ruleChip(x.rule, 'bad')).join('');
    const joys = m >= 2 ? '<span class="joy">💕</span>' : '';
    const l = addLabel('badge', `<span class="face">${b.face}</span>${angry ? '<span class="bomb">💣</span>' : ''}${joys}${causes ? `<span class="causes">${causes}</span>` : ''}<span class="nm">${PEOPLE[pid].name}</span>`, 'badge ' + b.cls + (changed ? ' pop' : '') + (angry ? ' angry' : ''), () => headPos(pid));
    l.pid = pid;
  }
  relLines = rel.map((r) => ({ ...r }));
  for (const r of rel) {
    addLabel('rel', r.kind === 'like' ? '❤️' : '⚡', 'rel ' + r.kind, () => {
      const a = headPos(r.a, -0.25), b = headPos(r.b, -0.25);
      return a.add(b).multiplyScalar(0.5);
    });
  }
  state.lastMoods = { ...moods };
  renderTray();
  renderInfo(moods, details);
  renderGoal(moods);
  // 座位光圈
  const sel = state.selected;
  for (const id of lv.seats) {
    const ring = seatObjs[id].ring;
    ring.material.opacity = 0;
    if (sel) {
      ring.material.opacity = state.assign[id] ? (state.assign[id] === sel ? 0.9 : 0.35) : 0.75;
      ring.material.color.set(state.assign[id] === sel ? 0x7fd4ff : state.assign[id] ? 0x9fc4ff : 0xffe08a);
    }
  }
  $('btn-dinner').disabled = unseated().length > 0;
}

function renderTray() {
  const tray = $('tray');
  tray.innerHTML = '';
  const list = unseated();
  if (!list.length) {
    tray.innerHTML = '<div class="empty">✅ 全家坐好了！拖动桌上的人可以换座 👉 按「开饭！」</div>';
    return;
  }
  for (const pid of list) {
    const c = document.createElement('div');
    c.className = 'card' + (state.selected === pid ? ' sel' : '');
    const chips = activeRules(state.level, pid).map((r) => ruleChip(r)).join('');
    c.innerHTML = `<img src="${portraits[pid]}" alt=""><b>${PEOPLE[pid].name}</b><div class="mini">${chips}</div>`;
    c.dataset.pid = pid;
    bindCardDrag(c, pid);
    tray.appendChild(c);
  }
}

function renderInfo(moods, details) {
  const info = $('info');
  const pid = state.selected || state.inspect;
  if (!pid || state.phase !== 'arrange' || preview) { info.hidden = true; return; }
  info.hidden = false;
  const seat = seatOfPid(pid);
  const m = moods[pid];
  const d = details[pid] || [];
  const rules = activeRules(state.level, pid);
  let html = `<div class="who"><img src="${portraits[pid]}" alt=""><div><b>${PEOPLE[pid].name}</b><small>${PEOPLE[pid].title}</small></div>`;
  if (seat) { const b = moodBand(m); html += `<span class="mood">${b.face} ${b.label}</span>`; }
  html += '</div><div class="chips-big">';
  for (const r of rules) {
    let st = '';
    if (seat) {
      const delta = d.find((x) => x.rule === r)?.delta ?? 0;
      st = ruleText(r).good ? (delta > 0 ? 'ok' : '') : (delta < 0 ? 'bad' : 'ok');
    }
    html += ruleChip(r, st);
  }
  html += `</div><div class="traits">${traitChips(pid)}</div>`;
  if (seat) html += `<div class="info-actions"><button class="soft" data-act="stand">⬇ 起身</button><button class="soft" data-act="close">✓ 好</button></div>`;
  else html += '<div class="hint-line">👆 拖到发光的座位上（或点一下座位）</div>';
  info.innerHTML = html;
  info.querySelector('[data-act="stand"]')?.addEventListener('click', () => {
    delete state.assign[seat]; detachPerson(pid); state.selected = null; state.inspect = null; sfx.lift(); refresh();
  });
  info.querySelector('[data-act="close"]')?.addEventListener('click', () => { state.selected = null; state.inspect = null; refresh(); });
}

function renderGoal(moods) {
  const g = $('goal');
  const lv = state.level;
  const vals = Object.values(moods);
  const allSeated = unseated().length === 0;
  const fists = seatedPeople().filter((pid) => {
    const s = seatOfPid(pid);
    return moods[pid] <= threshold(pid) && neighborsOf(state.assign, s).some((q) => activeRules(lv, pid).some((r) => r.type === 'hatePerson' && r.who === q));
  }).length;
  let html = '';
  if (lv.mode === 'harmony') {
    const min = vals.length ? Math.min(...vals) : -9;
    html += `<span class="goal-chip ${fists ? 'warn' : ''}">⭐ 别打架${fists ? ` <b>💣×${fists}</b>` : ''}</span>`;
    html += `<span class="goal-chip ${allSeated && min >= 1 ? 'done' : ''}">⭐⭐ 全员🙂</span>`;
    html += `<span class="goal-chip ${allSeated && min >= 2 ? 'done' : ''}">⭐⭐⭐ 全员😄</span>`;
  } else {
    const [a, b, c] = lv.goal.stars;
    html += `<span class="goal-chip">🎯 开打 ⭐${a}人 ⭐⭐${b}人 ⭐⭐⭐${c}人${lv.goal.protect ? `+<img class="gi" src="${portraits[lv.goal.protect]}">🛡️` : ''}</span>`;
    html += `<span class="goal-chip ${fists ? 'warn' : ''}"><b>💣×${fists}</b> 会先动手</span>`;
  }
  g.innerHTML = html;
}

// ---------- 交互 ----------
const raycaster = new THREE.Raycaster();
function seatAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(state.level.seats.map((id) => seatObjs[id].hit), false);
  return hits[0]?.object.userData.seatId || null;
}

function placeSelected(seatId) {
  const pid = state.selected;
  const from = seatOfPid(pid);
  const occupant = state.assign[seatId];
  if (from === seatId) { state.selected = null; refresh(); return; }
  if (from) {
    delete state.assign[from];
    if (occupant) { state.assign[from] = occupant; attachPerson(occupant, from); }
  } else if (occupant) {
    detachPerson(occupant);
  }
  state.assign[seatId] = pid;
  attachPerson(pid, seatId);
  sfx.place();
  state.selected = null;
  state.inspect = null;
  $('tut-hand').hidden = true; save.tutDone = true; writeSave();
  if (!state.introClosed && Object.keys(state.assign).length >= 2) $('intro-tip').classList.add('hide');
  refresh();
  const m = state.lastMoods[pid];
  if (m >= 2) sfx.happy(); else if (m <= -1) sfx.sad();
}

// 预览：拖到某个座位上时先“试坐”，所有人的反应立刻显示
function computePlace(base, pid, seatId) {
  const a = { ...base };
  let from = null;
  for (const k in a) if (a[k] === pid) from = k;
  const occupant = a[seatId];
  if (from === seatId) return a;
  if (from) { delete a[from]; if (occupant) a[from] = occupant; }
  a[seatId] = pid;
  return a;
}
function applyAssign(next, popPid) {
  const prev = state.assign;
  state.assign = next;
  for (const pid of state.level.people) {
    let ps = null, ns = null;
    for (const k in prev) if (prev[k] === pid) ps = k;
    for (const k in next) if (next[k] === pid) ns = k;
    if (ps === ns) continue;
    if (ns) attachPerson(pid, ns, pid === popPid || !ps); else detachPerson(pid);
  }
  refresh();
}
let preview = null; // { base, pid, seat }
function previewAt(pid, seatId) {
  if (!preview) preview = { base: { ...state.assign }, pid, seat: null };
  if (preview.seat === seatId) return;
  preview.seat = seatId;
  applyAssign(seatId ? computePlace(preview.base, pid, seatId) : { ...preview.base }, pid);
  if (seatId) sfx.select();
}
function endPreview(commitSeat) {
  if (!preview) return;
  const { base, pid } = preview;
  preview = null;
  if (commitSeat) {
    applyAssign(computePlace(base, pid, commitSeat), pid);
    sfx.place();
    const m = state.lastMoods[pid];
    if (m >= 2) sfx.happy(); else if (m <= -1) sfx.sad();
    $('tut-hand').hidden = true; save.tutDone = true; writeSave();
    if (Object.keys(state.assign).length >= 2) $('intro-tip').classList.add('hide');
  } else applyAssign({ ...base });
  state.selected = null; state.inspect = null;
  refresh();
}

function onSeatTap(seatId) {
  if (state.phase !== 'arrange') return;
  unlockAudio();
  if (state.selected) { placeSelected(seatId); return; }
  const occ = state.assign[seatId];
  if (occ) { state.selected = occ; state.inspect = null; sfx.select(); refresh(); }
  else if (unseated().length) { toast('先在下方选一位亲戚'); }
}

let downPt = null;
canvas.addEventListener('pointerdown', (e) => {
  downPt = { x: e.clientX, y: e.clientY, seat: state.phase === 'arrange' ? seatAt(e.clientX, e.clientY) : null, dragging: false };
});
window.addEventListener('pointermove', (e) => {
  if (!downPt || !downPt.seat || state.phase !== 'arrange') return;
  const pid = state.assign[downPt.seat] || (preview && preview.pid);
  if (!pid) return;
  if (!downPt.dragging && Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y) > 12) {
    downPt.dragging = true; downPt.pid = pid;
    ghost.style.backgroundImage = `url(${portraits[pid]})`; ghost.hidden = false;
    state.selected = pid;
  }
  if (downPt.dragging) {
    ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
    const s = seatAt(e.clientX, e.clientY);
    previewAt(downPt.pid, s || downPt.seat);
  }
});
canvas.addEventListener('pointerup', (e) => {
  if (!downPt) return;
  const moved = Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y);
  if (downPt.dragging) {
    ghost.hidden = true;
    const s = seatAt(e.clientX, e.clientY);
    // 拖到桌外 = 起身回托盘
    if (s) endPreview(s);
    else { const pid = downPt.pid; endPreview(null); const k = seatOfPid(pid); if (k) { delete state.assign[k]; detachPerson(pid); sfx.lift(); refresh(); } }
    downPt = null;
    return;
  }
  downPt = null;
  if (moved > 10) return;
  const s = seatAt(e.clientX, e.clientY);
  if (s) onSeatTap(s);
  else if (state.selected || state.inspect) { state.selected = null; state.inspect = null; refresh(); }
});

const ghost = $('drag-ghost');
function bindCardDrag(card, pid) {
  card.addEventListener('pointerdown', (e) => {
    if (state.phase !== 'arrange') return;
    unlockAudio();
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    let dragging = false;
    const move = (ev) => {
      const d = Math.hypot(ev.clientX - start.x, ev.clientY - start.y);
      if (!dragging && d > 10 && Math.abs(ev.clientY - start.y) > Math.abs(ev.clientX - start.x) * 0.7) {
        dragging = true;
        state.selected = pid; refresh();
        ghost.style.backgroundImage = `url(${portraits[pid]})`;
        ghost.hidden = false;
      }
      if (dragging) {
        ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
        const s = seatAt(ev.clientX, ev.clientY);
        for (const id of state.level.seats) seatObjs[id].ring.scale.setScalar(id === s ? 1.25 : 1);
        previewAt(pid, s);
        ghost.classList.toggle('over', !!s);
      }
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      ghost.hidden = true;
      for (const id of state.level.seats) seatObjs[id].ring.scale.setScalar(1);
      if (dragging) {
        const s = seatAt(ev.clientX, ev.clientY);
        endPreview(s);
      } else if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 10) {
        state.selected = state.selected === pid ? null : pid;
        state.inspect = null;
        sfx.select();
        refresh();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
}

$('btn-clear').onclick = () => {
  for (const pid of seatedPeople()) detachPerson(pid);
  state.assign = {}; state.selected = null; state.inspect = null; sfx.lift(); refresh();
};
$('btn-hint').onclick = () => { unlockAudio(); showHint(); };
$('btn-dinner').onclick = () => { unlockAudio(); playDinner(); };
$('btn-home').onclick = () => { if (state.phase === 'dinner') return; showHome(); };
$('btn-sound').onclick = () => { unlockAudio(); save.sound = !soundOn(); setSound(save.sound); writeSave(); $('btn-sound').textContent = save.sound ? '🔊' : '🔇'; };
$('btn-speed').onclick = () => { state.speed = state.speed === 1 ? 2.2 : 1; $('btn-speed').textContent = state.speed === 1 ? '快进 ×2' : '正常速度'; };
$('btn-skip').onclick = () => { state.skip = true; finishTweens(); };
$('btn-retry').onclick = () => { sfx.select(); startLevel(state.level, true); };
$('btn-levels').onclick = () => showHome();
$('btn-next').onclick = () => {
  const lv = state.level;
  const win = state.sim?.win;
  if (!win) { startLevel(lv, true); return; }
  const next = LEVELS.find((l) => l.id === lv.id + 1);
  if (next) startLevel(next); else showHome();
};

let toastTimer = 0;
function toast(text, ms = 1800) {
  const t = $('toast');
  t.textContent = text; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

function showHint() {
  const lv = state.level;
  if (unseated().length) {
    const pid = state.selected || unseated()[0];
    state.selected = pid; refresh();
    toast(`👆 把${PEOPLE[pid].name}拖到发光的座位`, 2200);
    return;
  }
  const { moods, details } = evaluate(lv, state.assign);
  if (lv.mode === 'chaos') {
    toast('💣 越多越好！被砸的人会还手 💥 连锁开打', 3000);
    return;
  }
  const hate = relations(lv, state.assign).find((r) => r.kind === 'hate');
  if (hate) { toast(`⚡ ${PEOPLE[hate.a].name} 和 ${PEOPLE[hate.b].name} 挨着会打起来！`, 2600); return; }
  const pid = Object.keys(moods).sort((a, b) => moods[a] - moods[b])[0];
  const bad = details[pid].find((x) => x.delta < 0);
  const miss = details[pid].find((x) => x.delta === 0 && ruleText(x.rule).good);
  if (bad) toast(`😒 ${PEOPLE[pid].name}：${ruleText(bad.rule).text}`, 2600);
  else if (miss && moods[pid] < 2) toast(`🙂 ${PEOPLE[pid].name}还想：${ruleText(miss.rule).text}`, 2600);
  else toast('已经很完美了，开饭吧！', 2000);
}

// ---------- 晚宴播放 ----------
function finishTweens() {
  for (const t of tweens.splice(0)) { t.fn(1); t.resolve(); }
}

function turnToward(pid, other, k = 1) {
  const p = persons[pid], q = persons[other];
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  p.root.getWorldPosition(a); q.root.getWorldPosition(b);
  const face = SEAT[seatOfPid(pid)].face;
  let ang = Math.atan2(b.x - a.x, b.z - a.z) - face;
  while (ang > Math.PI) ang -= Math.PI * 2;
  while (ang < -Math.PI) ang += Math.PI * 2;
  ang = THREE.MathUtils.clamp(ang, -1.25, 1.25) * k;
  const from = p.body.rotation.y;
  return tween(0.3, (t) => { p.body.rotation.y = lerp(from, ang, t); });
}
function faceFront(pid) {
  const p = persons[pid]; const from = p.body.rotation.y;
  return tween(0.3, (t) => { p.body.rotation.y = lerp(from, 0, t); });
}
function raiseArm(pid, side = 1, to = -2.4) {
  const arm = persons[pid].arms[side === 1 ? 1 : 0];
  const from = arm.rotation.x;
  return tween(0.25, (t) => { arm.rotation.x = lerp(from, to, t); });
}
function hop(pid) {
  const b = persons[pid].body;
  return tween(0.45, (t) => { b.position.y = Math.sin(t * Math.PI) * 0.22; });
}
function shake(pid, dur = 0.6) {
  const b = persons[pid].body;
  return tween(dur, (t) => { b.rotation.z = Math.sin(t * 40) * 0.08 * (1 - t); });
}

async function playDinner() {
  const lv = state.level;
  state.phase = 'dinner';
  state.selected = null; state.inspect = null;
  state.skip = false; state.speed = 1;
  $('btn-speed').textContent = '快进 ×2';
  $('dock').hidden = true; $('info').hidden = true; $('playbar').hidden = false;
  $('intro-tip').classList.add('hide');
  $('goal').innerHTML = '';
  clearLabels('rel'); clearLabels('badge');
  for (const id of lv.seats) seatObjs[id].ring.material.opacity = 0;
  fitCamera();
  const sim = simulate(lv, state.assign);
  state.sim = sim;
  sfx.dinner();
  banner('🦃 开饭啦！', 'start');
  combo = 0;
  await wait(900);
  for (const step of sim.steps) {
    if (state.skip) break;
    await playStep(step, sim);
  }
  state.skip = false;
  finishTweens();
  unfocus(); state.timeScale = 1;
  clearLabels('bubble'); clearLabels('fx');
  await celebrate(sim);
  // 最终表情
  for (const pid of seatedPeople()) M.setExpression(persons[pid], sim.mood[pid]);
  showResult(sim);
}

async function playStep(step, sim) {
  const P = PEOPLE;
  $('play-status').textContent = { env: '大家入座…', cheer: '寒暄碰杯', argue: '有人拌嘴了…', calm: '奶奶在劝架', throw: '🔥 食物大战！', end: '' }[step.t] || '晚宴进行中…';
  if (step.t === 'env') {
    let good = false, bad = false;
    for (const it of step.items) {
      const rule = { type: it.rule, dish: it.dish };
      if (it.good) { bubble(it.p, enjoyLine(rule), '', 1700); hop(it.p); good = true; }
      else { bubble(it.p, complainLine(rule), 'bad', 1700); shake(it.p, 0.8); M.setExpression(persons[it.p], 0); bad = true; }
      if (it.rule === 'likeDog' || it.rule === 'hateDog') dogHop();
    }
    if (good) sfx.happy();
    if (bad) setTimeout(() => sfx.sad(), 200);
    await wait(1300);
  } else if (step.t === 'cheer') {
    const lines = ['干杯！', '感恩节快乐！', '好久不见！', '来，多吃点！'];
    step.items.forEach((it, i) => {
      turnToward(it.a, it.b); turnToward(it.b, it.a);
      raiseArm(it.a); raiseArm(it.b);
      if (i < 4) bubble(it.a, lines[i % lines.length], '', 1500);
      const a = headPos(it.a, -0.1), b = headPos(it.b, -0.1);
      fxText(a.add(b).multiplyScalar(0.5), '💞');
    });
    sfx.chime();
    await wait(1200);
    for (const it of step.items) { faceFront(it.a); faceFront(it.b); raiseArm(it.a, 1, -0.9); raiseArm(it.b, 1, -0.9); }
    await wait(350);
  } else if (step.t === 'argue') {
    const [la, lb] = argueLines(step.a, step.b);
    turnToward(step.a, step.b); turnToward(step.b, step.a);
    M.setExpression(persons[step.a], -1); M.setExpression(persons[step.b], -1);
    bubble(step.a, la, 'angry', 1200); shake(step.a); sfx.argue();
    const mid = headPos(step.a, 0).add(headPos(step.b, 0)).multiplyScalar(0.5);
    focusOn(mid, 0.3);
    await wait(650);
    bubble(step.b, lb, 'angry', 1100); shake(step.b);
    fxText(headPos(step.a, 0.2), '💢');
    fxText(mid, '⚡', 'zap');
    await wait(750);
    unfocus();
  } else if (step.t === 'calm') {
    bubble(step.by, `大过节的，${P[step.p].name}别闹了！`, 'calm', 1600);
    turnToward(step.by, step.p); hop(step.by); sfx.calm();
    await wait(700);
    bubble(step.p, '……好吧，听奶奶的。', '', 1300);
    faceFront(step.p);
    await wait(1100);
    faceFront(step.by);
  } else if (step.t === 'throw') {
    await playThrow(step);
  }
}

let combo = 0;
async function playThrow(step) {
  const from = persons[step.from], to = persons[step.to];
  if (combo === 0) { banner('🔥 食物大战！', 'fight'); sfx.argue(); await wait(700); }
  M.setExpression(from, -2);
  turnToward(step.from, step.aim);
  bubble(step.from, step.missed ? `${PEOPLE[step.aim].name}，看招！` : `${PEOPLE[step.aim].name}，吃我一勺！`, 'angry', 1300);
  // 站起来、后摆
  const arm = from.arms[1];
  await tween(0.28, (t) => { from.body.position.y = 0.32 * t; arm.rotation.x = lerp(-0.9, 0.9, t); });
  // 出手
  sfx.whoosh();
  const start = new THREE.Vector3();
  arm.children[1].getWorldPosition(start);
  const end = headPos(step.to, -0.48);
  const blob = M.buildFoodBlob(step.food);
  blob.position.copy(start);
  scene.add(blob);
  tween(0.18, (t) => { arm.rotation.x = lerp(0.9, -2.5, t); });
  const h = 1.3 + start.distanceTo(end) * 0.15;
  // 第一发慢动作特写
  const slow = combo === 0;
  focusOn(start.clone().add(end).multiplyScalar(0.5), slow ? 0.55 : 0.3);
  if (slow) state.timeScale = 0.35;
  await tween(0.55, (t) => {
    blob.position.lerpVectors(start, end, t);
    blob.position.y += Math.sin(t * Math.PI) * h;
    blob.rotation.x += 0.25; blob.rotation.z += 0.18;
  }, linear);
  scene.remove(blob);
  state.timeScale = 1;
  // 命中
  sfx.splat();
  combo++;
  cam.shake = 0.35;
  screenSplat(DISHES[step.food]?.color ?? 0xf3e3b5);
  showCombo(combo);
  burst(end, DISHES[step.food]?.color ?? 0xf3e3b5, 14);
  const splat = M.buildSplat(step.food);
  splat.position.set((Math.random() - 0.5) * 0.22, (Math.random() - 0.3) * 0.22, 0.27);
  splat.scale.setScalar(0.01);
  to.splatHolder.add(splat);
  tween(0.2, (t) => splat.scale.setScalar(Math.max(0.01, t)), linear);
  fxText(headPos(step.to, 0.1), '啪！', 'splat');
  M.setExpression(to, -2);
  M.setMouthOpen(to, true);
  bubble(step.to, HIT_LINES[step.to] || '我的新衣服！', 'bad', 1100);
  const lean = to.body.rotation.x;
  tween(0.5, (t) => { to.body.rotation.x = lean - Math.sin(t * Math.PI) * 0.35; });
  if (step.missed) setTimeout(() => bubble(step.from, '哎呀，手滑砸歪了！', '', 1100), 300 / state.speed);
  dogHop(); sfx.bark();
  await wait(650);
  tween(0.3, (t) => { from.body.position.y = 0.32 * (1 - t); arm.rotation.x = lerp(-2.5, -0.9, t); });
  M.setExpression(to, -2);
  unfocus();
  await wait(250);
}

// ---------- 演出：横幅、连击、糊屏、庆祝 ----------
function banner(text, cls = '') {
  const b = $('banner');
  b.textContent = text; b.className = cls; b.hidden = false;
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(banner.t);
  banner.t = setTimeout(() => { b.hidden = true; }, 1400 / Math.max(1, state.speed));
}
function showCombo(n) {
  const c = $('combo');
  c.innerHTML = `💥 ×${n}`; c.hidden = false;
  c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  c.style.fontSize = `${Math.min(64, 30 + n * 5)}px`;
}
function screenSplat(color) {
  const el = document.createElement('div');
  el.className = 'screen-splat';
  const hex = '#' + color.toString(16).padStart(6, '0');
  el.style.left = `${10 + Math.random() * 70}%`; el.style.top = `${15 + Math.random() * 55}%`;
  el.style.setProperty('--c', hex);
  el.style.transform = `translate(-50%,-50%) rotate(${Math.random() * 360}deg) scale(${0.8 + Math.random() * 0.6})`;
  $('splats').appendChild(el);
  setTimeout(() => el.remove(), 1600);
}
async function celebrate(sim) {
  $('combo').hidden = true;
  const ppl = seatedPeople();
  if (sim.win && state.level.mode === 'harmony') {
    ppl.forEach((pid) => { raiseArm(pid, 1, -2.6); hop(pid); });
    sfx.chime();
    banner(sim.stars === 3 ? '💯 完美团圆！' : '🎉 团圆成功！', 'win');
    confetti();
    await wait(1500);
  } else if (sim.win) {
    banner(sim.stars === 3 ? '🏆 传说级大战！' : '💥 大战爆发！', 'fight');
    for (let i = 0; i < 6; i++) screenSplat([0xc0213b, 0xf3e3b5, 0xe08a2e][i % 3]);
    confetti();
    await wait(1400);
  } else {
    banner(state.level.mode === 'harmony' ? '😱 翻车了！' : '😴 还不够乱…', 'lose');
    await wait(1200);
  }
}
function confetti() {
  const cols = [0xd9481e, 0xf2b630, 0x4f8a3a, 0x2a7fd0, 0xffffff, 0xc0213b];
  for (let i = 0; i < 70; i++) {
    const pos = new THREE.Vector3((Math.random() - 0.5) * 6, 4 + Math.random() * 2, (Math.random() - 0.5) * 8);
    burst(pos, cols[i % cols.length], 1, 2.5);
  }
}

function dogHop() {
  if (!dog.root.visible) return;
  tween(0.4, (t) => { dog.root.position.y = 0.12 + Math.sin(t * Math.PI) * 0.35; });
}

// ---------- 结算 ----------
function showResult(sim) {
  state.phase = 'result';
  $('playbar').hidden = true;
  const lv = state.level;
  const prev = save.stars[lv.id] || 0;
  if (sim.stars > prev) { save.stars[lv.id] = sim.stars; writeSave(); }
  const ov = $('overlay');
  ov.classList.remove('hidden');
  $('home').hidden = true;
  const r = $('result'); r.hidden = false;
  const starsEl = $('result-stars');
  starsEl.innerHTML = [0, 1, 2].map((i) => `<span class="${i < sim.stars ? 'on' : ''}" style="animation-delay:${0.15 + i * 0.25}s">★</span>`).join('');
  for (let i = 0; i < sim.stars; i++) setTimeout(() => sfx.star(i), 150 + i * 250);
  const title = lv.mode === 'harmony'
    ? (sim.win ? (sim.stars === 3 ? '完美团圆饭！' : '团圆成功！') : '晚宴翻车了！')
    : (sim.win ? (sim.stars === 3 ? '传说级食物大战！' : '大战爆发！') : '还不够乱…');
  $('result-title').textContent = title;
  $('result-reason').textContent = sim.reason;
  if (sim.win) sfx.win(); else sfx.lose();
  const q = $('result-quotes');
  q.innerHTML = '';
  const order = lv.seats.filter((s) => state.assign[s]).map((s) => state.assign[s]);
  for (const pid of order) {
    const div = document.createElement('div');
    div.className = 'q';
    div.innerHTML = `<img src="${portraits[pid]}" alt=""><b>${PEOPLE[pid].name}</b><span>“${quoteFor(lv, sim, pid)}”</span><i>${moodBand(sim.mood[pid]).face}</i>`;
    q.appendChild(div);
  }
  const next = LEVELS.find((l) => l.id === lv.id + 1);
  $('btn-next').textContent = sim.win ? (next ? '下一关 →' : '回到选关') : '再试一次';
  $('btn-retry').textContent = sim.win ? '调整座位' : '回到餐桌';
  $('btn-retry').hidden = !sim.win;
}

// ---------- 首页 ----------
function showHome() {
  state.phase = 'home';
  $('overlay').classList.remove('hidden');
  $('home').hidden = false; $('result').hidden = true;
  const grid = $('level-grid');
  grid.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const unlocked = i === 0 || (save.stars[LEVELS[i - 1].id] || 0) > 0;
    const st = save.stars[lv.id] || 0;
    const b = document.createElement('button');
    b.className = 'lv' + (lv.mode === 'chaos' ? ' chaos' : '') + (lv.id === state.level.id ? ' cur' : '');
    b.disabled = !unlocked;
    b.innerHTML = `<small>${lv.mode === 'chaos' ? '🔥 食物大战' : '🕊️ 和睦晚宴'} · 第${lv.id}关</small><b>${unlocked ? lv.name : '🔒 未解锁'}</b><span class="st">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>`;
    b.onclick = () => { unlockAudio(); sfx.select(); startLevel(lv); };
    grid.appendChild(b);
  });
}

// ---------- 主循环 ----------
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const sp = state.phase === 'dinner' ? state.speed * (state.timeScale || 1) : 1;
  // 晚宴特写与震屏
  cam.k += (cam.kTarget - cam.k) * Math.min(1, dt * 5);
  cam.shake = Math.max(0, cam.shake - dt);
  if (cam.k > 0.001 || cam.shake > 0) {
    const tgt = cam.baseTarget.clone().lerp(cam.focus, cam.k);
    const pos = cam.basePos.clone().lerp(cam.focus.clone().add(cam.basePos.clone().sub(cam.baseTarget).multiplyScalar(0.55)), cam.k);
    const sh = cam.shake * 0.25;
    pos.x += (Math.random() - 0.5) * sh; pos.y += (Math.random() - 0.5) * sh;
    camera.position.copy(pos); camera.lookAt(tgt);
  } else if (cam.basePos.lengthSq() > 0) { camera.position.copy(cam.basePos); camera.lookAt(cam.baseTarget); }
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt * sp;
    const k = Math.min(1, tw.t / tw.dur);
    tw.fn(tw.ease(k));
    if (k >= 1) { tweens.splice(i, 1); tw.resolve(); }
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.v.y -= 9 * dt;
    p.m.position.addScaledVector(p.v, dt);
    if (p.m.position.y < 1.13 && Math.abs(p.m.position.x) < 1.5 && Math.abs(p.m.position.z) < 4) { p.m.position.y = 1.13; p.v.set(0, 0, 0); }
    if (p.m.position.y < 0.02) { p.m.position.y = 0.02; p.v.set(0, 0, 0); }
    p.life -= dt;
    if (p.life <= 0) { scene.remove(p.m); particles.splice(i, 1); }
  }
  // 待机动作
  for (const pid of seatedPeople()) {
    const p = persons[pid];
    p.torso.scale.y = 1 + Math.sin(t * 2 + pid.length) * 0.025;
    {
      // 把脸转向镜头，方便看表情；晚宴中转一半，留给身体的互动转向
      const blend = state.phase === 'dinner' ? 0.6 : 1;
      const face = SEAT[seatOfPid(pid)]?.face ?? 0;
      let look = -face;
      while (look > Math.PI) look -= Math.PI * 2;
      while (look < -Math.PI) look += Math.PI * 2;
      const target = Math.abs(look) > 2.5 ? 0 : THREE.MathUtils.clamp(look - p.body.rotation.y * 0.5, -1.15, 1.15) * blend;
      p.head.rotation.y += (target + Math.sin(t * 0.7 + pid.charCodeAt(0)) * 0.12 - p.head.rotation.y) * Math.min(1, dt * 6);
      p.head.rotation.x += (-0.22 - p.head.rotation.x) * Math.min(1, dt * 6);
    }
  }
  dog.tail.rotation.y = Math.sin(t * 12) * 0.6;
  dog.head.rotation.z = Math.sin(t * 1.3) * 0.12;
  for (const [i, f] of roomParts.flames.entries()) f.scale.y = 1 + Math.sin(t * 9 + i * 1.7) * 0.18;
  roomParts.fireLight.intensity = 5.5 + Math.sin(t * 11) * 0.6 + Math.sin(t * 7.3) * 0.4;
  for (const [i, c] of tableParts.candles.entries()) c.scale.y = 1.6 + Math.sin(t * 13 + i) * 0.25;
  // 座位光圈呼吸
  if (state.selected) for (const id of state.level.seats) seatObjs[id].ring.rotation.z = t;
  // 标签
  const now = performance.now();
  labels = labels.filter((l) => {
    if (l.ttl !== undefined && now - l.born > l.ttl) { l.el.remove(); return false; }
    updateLabel(l);
    return true;
  });
  drawRelLines(t);
  renderer.render(scene, camera);
  lastFrame = performance.now();
  if (!rafPending) { rafPending = true; requestAnimationFrame(onRaf); }
}
// rAF 在被隐藏/节流的预览里可能停住，用低频定时器兜底推进
let lastFrame = 0, rafPending = false;
function onRaf() { rafPending = false; frame(); }
setInterval(() => { if (performance.now() - lastFrame > 200) frame(); }, 33);

// ---------- 启动 ----------
try {
  setSound(save.sound);
  $('btn-sound').textContent = save.sound ? '🔊' : '🔇';
  makePortraits();
  state.level = LEVELS[0];
  for (const id in seatObjs) seatObjs[id].root.visible = state.level.seats.includes(id);
  M.placeDishes(scene, state.level, dishHolder);
  fitCamera();
  showHome();
  frame();
  setTimeout(() => { $('loading').hidden = true; }, 150);
  window.__seating = { state, LEVELS, startLevel, placeSelected, playDinner, persons, camera }; // 调试用
} catch (err) {
  console.error(err);
  $('loading').innerHTML = `<b>加载失败</b><small>${err.message}</small>`;
}
