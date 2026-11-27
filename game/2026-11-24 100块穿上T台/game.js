import {T, stage, readSave, writeSave} from './scene-kit.js';
import {model, runwaySet, catalogImages, portraits} from './fashion.js';
import {CATS, CAT_LABEL, TONES, NIGHTS, CATALOG, buildNight, createMarket, take, putBack, totals, scoreRun, couponText, STAR2, starOutfits, outfitIndex, RIVALS, stylePoints} from './rules.js';
import {createAudio} from './audio.js';

const $ = id => document.getElementById(id);
const game = $('game'), host = $('fitting'), fx = $('fx');
const audio = createAudio(), sfx = audio.sfx;
const SAVE_KEY = 'hundred-runway-v5';
const save = readSave(SAVE_KEY, {stars: [], best: [], outfits: {}});
save.outfits ||= {};
const dev = new URLSearchParams(location.search).has('dev');

// ——3D——
const art = stage(host, '#3a2150', {fov: 40});
art.scene.background = null;
const studio = new T.Group();
const shadow = new T.Mesh(new T.PlaneGeometry(8, 8), new T.ShadowMaterial({opacity: .18}));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = .121; shadow.receiveShadow = true;
studio.add(shadow);
art.scene.add(studio);
const show = runwaySet(art.scene);
const HERO_LOOK = {skin: '#f2c3a6', hair: '#2a1916', eyes: '#3b2318', bow: '#ff6fa8', bangs: 'air',
  face: {eye: 'soft', lips: '#f0647f', gradientLips: true, aegyo: true, shadow: 'rgba(245,140,150,.3)', blush: .45, smile: .9, lash: '#1c0f0d'}};
const RIVAL_LOOKS = [
  {skin: '#9f6151', hair: '#221420', eyes: '#4a2f1e', style: 'bun',
    face: {eye: 'cat', lips: '#b0223e', shadow: 'rgba(150,60,140,.45)', lash: '#120909', blush: .22, smile: .5, mole: true}},
  {skin: '#f3c9b2', hair: '#b0623f', eyes: '#3f7d8a', style: 'pony',
    face: {eye: 'calm', lips: '#e88a86', freckles: true, blush: .42, smile: .45}},
];
const hero = model(art.scene, HERO_LOOK);
const rivals = RIVAL_LOOKS.map(look => model(art.scene, look));
const [heroFace, ...rivalFaces] = portraits([HERO_LOOK, ...RIVAL_LOOKS]);
rivals.forEach(r => (r.root.visible = false));
const images = catalogImages(CATALOG);
const view = new T.Vector3(0, 1.3, 0), lookAt = new T.Vector3(0, 1.3, 0), camGoal = new T.Vector3();

// ——状态——
let screen = 'title';
let night = null, market = null, bag = {}, nightIndex = 0;
let lastSecond = 99, tryTime = -10, poseState = null, runwayStart = 0, result = null;
let cards = {}, rivalHaul = [{}, {}], lastOutfit = -1;
const buzz = ms => {
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try { navigator.vibrate?.(ms); } catch { /* 不支持震动 */ }
};
const timers = new Set();
const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
const clearLater = () => { timers.forEach(clearTimeout); timers.clear(); };

function setScreen(next) {
  screen = next;
  game.dataset.screen = next;
  for (const id of ['title', 'intro', 'receipt', 'pose', 'result']) $(id).hidden = id !== next;
  const showing = next === 'runway' || next === 'pose' || next === 'result';
  show.root.visible = showing;
  studio.visible = !showing;
  rivals.forEach(r => (r.root.visible = showing));
  art.scene.background = showing ? new T.Color('#2b1840') : null;
  if (next === 'pose') { $('pose').hidden = false; }
}

// ——标题/选夜——
const unlocked = () => Math.min(NIGHTS.length - 1, save.stars.filter(s => s > 0).length);
function renderNights() {
  const open = unlocked();
  $('nights').replaceChildren(...NIGHTS.map((n, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'night-btn' + (i === nightIndex ? ' current' : '');
    b.disabled = i > open && !dev;
    const s = save.stars[i] || 0;
    const found = (save.outfits[i] || []).length;
    b.innerHTML = `<b>${i + 1}</b><small>${n.place}</small><span class="mini-stars"><em>${'★'.repeat(s)}</em>${'★'.repeat(3 - s)}</span>`
      + `<span class="mini-book">搭配 ${found}/3</span>`;
    b.addEventListener('click', () => { nightIndex = i; sfx.tap(); renderNights(); });
    return b;
  }));
}
function titleScreen() {
  clearLater();
  setScreen('title');
  audio.setMode('menu');
  nightIndex = Math.min(nightIndex, unlocked());
  renderNights();
  if (!night) loadNight(nightIndex, false);
}

// ——开一夜——
function toneLabel(t) { return t + '色'; }
function paintWants(vibeEl, toneEl, n) {
  vibeEl.textContent = n.vibe;
  toneEl.style.setProperty('--tone', TONES[n.tone]);
  toneEl.querySelector('span').textContent = toneLabel(n.tone);
}
function loadNight(index, live = true) {
  nightIndex = index;
  night = buildNight(index);
  market = createMarket(night);
  bag = {};
  lastOutfit = -1;
  rivalHaul = [{}, {}];
  lastSecond = 99;
  $('night-name').textContent = `第${index + 1}夜 · ${night.place}`;
  paintWants($('want-vibe'), $('want-tone'), night);
  $('budget').textContent = night.budget;
  $('coupon').textContent = couponText(night.coupon);
  $('feed').replaceChildren();
  buildShelf();
  hero.root.position.set(0, .125, 0);
  hero.root.rotation.set(0, .06, 0);
  hero.equip({});
  refresh();
  if (live) intro();
}
function intro() {
  clearLater();
  setScreen('intro');
  audio.setMode('menu');
  $('intro-night').textContent = `第 ${nightIndex + 1} 夜`;
  $('intro-place').textContent = night.place;
  paintWants($('intro-vibe'), $('intro-tone'), night);
  $('intro-time').textContent = night.time + '秒';
  $('intro-budget').textContent = '¥' + night.budget;
  $('intro-coupon').textContent = couponText(night.coupon);
  const found = (save.outfits[nightIndex] || []).length;
  $('intro-goal').textContent = `穿上任意一套三星搭配 = 3 星（已解锁 ${found}/3）`;
  $('go').classList.remove('on');
  later(() => { $('go').classList.add('on'); sfx.go(); }, 1150);
  later(beginShopping, 1650);
}
function beginShopping() {
  clearLater();
  setScreen('shop');
  audio.setMode('shop');
  toast('点商品就是抢！对上 ' + night.vibe + ' + ' + toneLabel(night.tone), 'good', 2200);
}

// ——货架——
function buildShelf() {
  cards = {};
  $('rows').replaceChildren(...CATS.map(cat => {
    const row = document.createElement('div');
    row.className = 'row';
    const label = document.createElement('span');
    label.className = 'row-label';
    label.textContent = CAT_LABEL[cat];
    row.append(label);
    for (const item of market.items.filter(i => i.cat === cat)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'card' + (item.kind === 'perfect' ? ' perfect' : '');
      b.dataset.id = item.id;
      const vibeHit = item.vibe === night.vibe, toneHit = item.tone === night.tone;
      b.innerHTML = `<span class="stock"></span>${item.kind === 'perfect' ? '<span class="match">完美</span>' : ''}<img alt="" src="${images[item.id]}"><span class="name">${item.name}</span>`
        + `<span class="price"></span><span class="chips"><span class="chip${vibeHit ? ' hit' : ''}">${item.vibe}</span>`
        + `<span class="chip dot${toneHit ? ' hit' : ''}" style="--c:${TONES[item.tone]}">${item.tone}</span></span>`;
      b.setAttribute('aria-label', `${item.name} ${item.vibe} ${item.tone}色`);
      b.addEventListener('click', () => onCard(item));
      cards[item.id] = b;
      row.append(b);
    }
    return row;
  }));
}
function paintCard(item) {
  const b = cards[item.id];
  const owned = bag[item.cat]?.item === item;
  const flashing = market.flash?.item === item;
  b.classList.toggle('in-bag', owned);
  b.classList.toggle('sold', item.stock <= 0 && !owned);
  b.classList.toggle('flash', flashing);
  const stock = b.querySelector('.stock');
  stock.textContent = owned ? '' : item.stock > 0 ? '剩' + item.stock : '';
  stock.hidden = owned || item.stock <= 0;
  stock.classList.toggle('low', item.stock === 1);
  const price = b.querySelector('.price');
  const paid = owned ? bag[item.cat].paid : null;
  if (flashing) price.innerHTML = `<s>¥${item.price}</s>¥${item.flashPrice}`;
  else if (owned && bag[item.cat].flash) price.innerHTML = `<s>¥${item.price}</s>¥${paid}`;
  else price.textContent = '¥' + item.price;
  let tag = b.querySelector('.flash-tag');
  if (flashing && !tag) {
    tag = document.createElement('span');
    tag.className = 'flash-tag';
    tag.innerHTML = '闪购5折<i></i>';
    b.append(tag);
  } else if (!flashing && tag) tag.remove();
}
function refresh() {
  for (const item of market.items) paintCard(item);
  const t = totals(night, bag);
  $('pay').textContent = '¥' + t.pay;
  const over = t.pay > night.budget;
  $('wallet').classList.toggle('over', over);
  $('meter-fill').style.width = Math.min(100, t.pay / night.budget * 100) + '%';
  const couponOn = t.off > 0;
  $('coupon-hint').textContent = couponOn ? `已减 ¥${t.off} ✓` : t.hint;
  $('coupon-hint').parentElement.classList.toggle('on', couponOn);
  // 购物袋
  $('bag').replaceChildren(...CATS.map(cat => {
    const e = bag[cat];
    const s = document.createElement('button');
    s.type = 'button';
    s.className = 'slot' + (e ? ' filled' : '') + (e?.flash ? ' flashy' : '');
    s.dataset.cat = cat;
    if (e) s.innerHTML = `<img alt="" src="${images[e.item.id]}"><span class="paid">¥${e.paid}</span>`;
    else s.innerHTML = `<span class="label">${CAT_LABEL[cat]}</span>`;
    s.setAttribute('aria-label', e ? `放回 ${e.item.name}` : `${CAT_LABEL[cat]}空位`);
    s.addEventListener('click', () => onSlot(cat));
    return s;
  }));
  const btn = $('checkout');
  btn.classList.toggle('over', over);
  btn.classList.toggle('ready', t.ok && t.count === 3);
  btn.disabled = screen !== 'shop' || !t.ok;
  btn.innerHTML = !bag.clothes ? '先抢一件衣服' : over ? `超预算 ¥${t.pay - night.budget}` : `结账 ¥${t.pay} <small>越早越加分</small>`;
  hero.equip({clothes: bag.clothes?.item, shoes: bag.shoes?.item, bag: bag.bag?.item});
  updateGuide();
}

// ——第一夜手指引导：衣 → 鞋 → 包 → 结账——
function guiding() { return screen === 'shop' && nightIndex === 0 && !save.guided; }
function updateGuide() {
  const g = $('guide');
  if (!night || !guiding()) { g.hidden = true; return; }
  const cat = CATS.find(c => !bag[c]);
  let target, text;
  if (cat) {
    const options = market.items.filter(i => i.cat === cat && i.stock > 0);
    const best = options.find(i => i.kind === 'perfect') || options.find(i => i.kind === 'vibe') || options[0];
    if (!best) { g.hidden = true; return; }
    target = cards[best.id];
    text = cat === 'clothes' ? `点这件：${night.vibe}+${toneLabel(night.tone)}` : cat === 'shoes' ? '再配一双鞋' : '最后挑个包';
  } else if (totals(night, bag).ok) { target = $('checkout'); text = '凑齐了，快结账！'; }
  else { g.hidden = true; return; }
  const c = center(target);
  g.style.left = c.x + 'px';
  g.style.top = c.y + 'px';
  $('guide-text').textContent = text;
  g.hidden = false;
}

// ——反馈——
function toast(text, kind = '', ms = 1500, avatar = null) {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  if (avatar) { const img = new Image(); img.className = 'avatar'; img.src = avatar; img.alt = ''; el.append(img); }
  el.append(text);
  const feed = $('feed');
  feed.prepend(el);
  while (feed.children.length > 2) feed.lastChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
}
function center(el) {
  const r = el.getBoundingClientRect(), g = game.getBoundingClientRect();
  return {x: r.left - g.left + r.width / 2, y: r.top - g.top + r.height / 2};
}
function floater(text, from, kind = '') {
  const el = document.createElement('div');
  el.className = 'floater ' + kind;
  el.textContent = text;
  el.style.left = from.x + 'px';
  el.style.top = from.y + 'px';
  fx.append(el);
  el.animate([{transform: 'translate(-50%,-50%) scale(.6)', opacity: 0}, {transform: 'translate(-50%,-110%) scale(1.15)', opacity: 1, offset: .25}, {transform: 'translate(-50%,-260%) scale(1)', opacity: 0}], {duration: 1000, easing: 'ease-out'}).onfinish = () => el.remove();
}
function flyToBag(item) {
  const card = cards[item.id], slot = $('bag').querySelector(`[data-cat=${item.cat}]`);
  if (!card || !slot) return;
  const a = center(card), b = center(slot);
  const img = document.createElement('img');
  img.className = 'fly';
  img.src = images[item.id];
  img.alt = '';
  img.style.left = a.x - 26 + 'px';
  img.style.top = a.y - 26 + 'px';
  fx.append(img);
  img.animate([{transform: 'translate(0,0) scale(1)'}, {transform: `translate(${(b.x - a.x) * .5}px,${(b.y - a.y) * .5 - 60}px) scale(1.3)`, offset: .45}, {transform: `translate(${b.x - a.x}px,${b.y - a.y}px) scale(.6)`}], {duration: 420, easing: 'cubic-bezier(.4,0,.6,1)'}).onfinish = () => {
    img.remove();
    slot.classList.add('pop');
  };
}
function edgeFlash() {
  const el = document.createElement('div');
  el.className = 'edge-flash';
  fx.append(el);
  setTimeout(() => el.remove(), 700);
}
function confetti(n = 40) {
  const w = game.clientWidth;
  const colors = ['#ff2f86', '#ffc93c', '#2fc9a6', '#9b6ee0', '#ffffff'];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('i');
    el.className = 'confetti';
    el.style.left = Math.random() * w + 'px';
    el.style.top = '-20px';
    el.style.background = colors[i % colors.length];
    fx.append(el);
    const dx = (Math.random() - .5) * 120, rot = Math.random() * 720;
    el.animate([{transform: 'translate(0,0) rotate(0)'}, {transform: `translate(${dx}px,${game.clientHeight + 40}px) rotate(${rot}deg)`}], {duration: 1400 + Math.random() * 1200, delay: Math.random() * 400, easing: 'cubic-bezier(.3,.2,.7,1)'}).onfinish = () => el.remove();
  }
}

// ——操作——
function onCard(item) {
  if (screen !== 'shop') return;
  if (bag[item.cat]?.item === item) { onSlot(item.cat); return; }
  if (item.stock <= 0) {
    sfx.nope(); buzz(35);
    cards[item.id].classList.remove('shake'); void cards[item.id].offsetWidth; cards[item.id].classList.add('shake');
    toast('售罄了，换一件！', 'steal', 900);
    return;
  }
  const res = take(market, bag, item);
  if (!res) return;
  const from = center(cards[item.id]);
  buzz(res.entry.flash ? [18, 40, 18] : 12);
  if (res.entry.flash) {
    sfx.flashGrab();
    floater(`闪购到手 省¥${item.price - item.flashPrice}`, from, 'gold');
  } else if (item.kind === 'perfect') {
    sfx.grab(); sfx.perfect();
    floater('完美单品!', from);
  } else {
    sfx.grab();
    floater('-¥' + res.entry.paid, from);
  }
  const before = totals(night, {...bag, [item.cat]: res.prev || undefined});
  tryTime = performance.now() / 1000;
  refresh();
  flyToBag(item);
  const now = totals(night, bag);
  if (now.off > 0 && before.off === 0) { later(() => { sfx.coupon(); toast(`满减生效 立减 ¥${now.off}`, 'good'); }, 260); }
  if (now.pay > night.budget) toast(`超预算 ¥${now.pay - night.budget}，换便宜的`, 'steal', 1200);
  checkOutfit();
}
// 凑齐一套三星搭配时立刻提示（还没超预算才算数）
function checkOutfit() {
  const idx = outfitIndex(night, bag);
  if (idx >= 0 && idx !== lastOutfit && totals(night, bag).ok) {
    const o = starOutfits(night)[idx];
    const isNew = !(save.outfits[nightIndex] || []).includes(idx);
    later(() => { sfx.perfect(); toast(`三星搭配「${o.name}」凑齐！${isNew ? '新解锁' : ''}`, 'good', 1800); }, 420);
    buzz([10, 40, 10]);
  }
  lastOutfit = idx;
}
function onSlot(cat) {
  if (screen !== 'shop' || !bag[cat]) return;
  const e = putBack(bag, cat);
  sfx.back();
  toast('放回 ' + e.item.name, '', 900);
  refresh();
  lastOutfit = outfitIndex(night, bag);
}
function handle(events) {
  for (const ev of events) {
    if (ev.type === 'flash') {
      sfx.flash();
      edgeFlash();
      toast(`闪购！${ev.item.name} 5折 只要 ¥${ev.item.flashPrice}`, 'flash', 1800);
    } else if (ev.type === 'steal') {
      const card = cards[ev.item.id];
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      const hot = ev.item.kind === 'perfect';
      if (hot || ev.soldOut) sfx.steal();
      rivalHaul[ev.who][ev.item.cat] = ev.item;
      toast(`${ev.rival} 抢走了 ${ev.item.name}${ev.soldOut ? ' · 售罄' : ''}`, 'steal', 1300, rivalFaces[ev.who]);
      if (hot && ev.soldOut) buzz(30);
    }
  }
  if (events.length) refresh();
}

function checkout(auto = false) {
  const t = totals(night, bag);
  if (screen !== 'shop') return;
  if (!t.ok) { failRun(!bag.clothes ? '时间到，购物袋里没有衣服' : `时间到，超预算 ¥${t.pay - night.budget}，刷卡失败`); return; }
  const left = Math.max(0, market.left());
  result = {left, totals: t, bag: {...bag}};
  if (nightIndex === 0 && !save.guided) { save.guided = true; writeSave(SAVE_KEY, save); }
  $('guide').hidden = true;
  setScreen('receipt');
  audio.setMode(null);
  if (auto) sfx.go();
  const lines = $('receipt-lines');
  lines.replaceChildren();
  $('receipt-pay').textContent = '¥0';
  $('saved-stamp').classList.remove('on');
  $('to-runway').hidden = true;
  const rows = [];
  for (const cat of CATS) {
    const e = bag[cat];
    if (!e) continue;
    rows.push([`<span>${e.item.name}</span>`, e.flash ? `<b><s>¥${e.item.price}</s>¥${e.paid}</b>` : `<b>¥${e.paid}</b>`, e.flash ? 'sub' : '']);
  }
  if (t.off) rows.push([`<span>${couponText(night.coupon)}</span>`, `<b>-¥${t.off}</b>`, 'sub coupon']);
  rows.forEach(([a, b, cls], i) => later(() => {
    const li = document.createElement('li');
    li.className = cls;
    li.innerHTML = a + b;
    lines.append(li);
    sfx.line();
  }, 350 + i * 260));
  const end = 350 + rows.length * 260;
  later(() => { $('receipt-pay').textContent = '¥' + t.pay; sfx.kaching(); }, end + 80);
  later(() => {
    $('saved-stamp').textContent = `省 ¥${t.saved}`;
    $('saved-stamp').classList.add('on');
    sfx.stamp();
  }, end + 520);
  later(() => { $('to-runway').hidden = false; $('to-runway').focus({preventScroll: true}); }, end + 900);
}
function failRun(reason) {
  clearLater();
  setScreen('result');
  audio.setMode(null);
  sfx.fail();
  $('result-night').textContent = `第${nightIndex + 1}夜 · ${night.place}`;
  $('stars').querySelectorAll('i').forEach(i => i.classList.remove('on'));
  $('result-title').textContent = '这单没买成…';
  $('result-line').textContent = reason;
  $('breakdown').replaceChildren();
  $('result-total').textContent = '0';
  $('result-best').textContent = '';
  $('rank').replaceChildren();
  renderOutfitBook(-1, false);
  $('next').textContent = '再抢一次';
  $('next').dataset.action = 'retry';
}

// ——走秀——
// 自动走秀：按今晚风格从动作库里随机抽 3 个 POSE，机位随机左右，最后一拍推近景；点屏幕可跳过
const BEATS = [1.0, 2.1, 3.2];
const POSES = {
  spin: {label: '转个圈', spin: true},
  heart: {label: '头顶比心', p: {rl: 2.75, rr: 2.75, fl: .25, fr: .25, hz: .08}},
  peace: {label: '比个耶', p: {rr: 2.5, fr: .35, rl: .15, hz: -.12}},
  hip: {label: '叉腰定格', p: {rl: .5, rr: .5, fl: -.6, fr: -.6, bz: .09, hy: -.3, hz: .08}},
  kiss: {label: '送个飞吻', p: {fr: 1.9, rr: .45, hy: .25, hz: .15}},
  curtsy: {label: '优雅屈膝', p: {bx: .22, rl: .55, rr: .55, kl: .25, kr: -.12, hz: .1}},
  jump: {label: '跳起来！', hop: true, p: {rl: 2.5, rr: 2.5, kl: .35, kr: -.2}},
  point: {label: '点名观众', p: {fr: 1.55, rr: .15, hy: .4, bz: -.05}},
  lean: {label: '侧身凹造型', p: {bz: .15, rl: .65, fl: -.25, hz: .16, hy: .25}},
  kick: {label: '踢个腿', p: {kr: .95, rl: 1.1, rr: 1.1, bx: -.08}},
  flip: {label: '撩个头发', p: {rr: 2.1, fr: .9, hz: .16, hy: -.3}},
};
const POSE_SETS = {
  甜美: ['heart', 'kiss', 'curtsy', 'flip', 'peace', 'spin'],
  闪耀: ['hip', 'lean', 'kiss', 'point', 'flip', 'spin'],
  活力: ['jump', 'peace', 'kick', 'point', 'heart', 'spin'],
};
const RIVAL_POSES = ['hip', 'lean', 'peace', 'kiss', 'point'];
const pickOne = list => list[Math.floor(Math.random() * list.length)];
function pickPoses(vibe) {
  const pool = [...POSE_SETS[vibe]];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const seq = pool.slice(0, 3);
  const spin = seq.indexOf('spin');
  if (spin > 0) { seq.splice(spin, 1); seq.unshift('spin'); } // 转圈放开场，收尾一定是定格动作
  return seq.map(key => POSES[key]);
}
function startRunway() {
  clearLater();
  setScreen('pose');
  audio.setMode('runway');
  runwayStart = performance.now() / 1000;
  poseState = {seq: pickPoses(night.vibe), at: [], cheerAt: -10, big: stylePoints(night, result.bag) >= 48,
    side: Math.random() < .5 ? 1 : -1, rivalPose: [POSES[pickOne(RIVAL_POSES)], POSES[pickOne(RIVAL_POSES)]]};
  $('pose-word').textContent = '';
  BEATS.forEach((beat, i) => later(() => autoPose(i), beat * 1000));
  later(finish, 4400);
  const looks = rivalLooks();
  result.rivals = looks;
  rivals.forEach((r, i) => {
    r.equip(looks[i]);
    r.root.position.set(i ? 1.15 : -1.15, .16, -3.3);
    r.root.rotation.set(0, i ? -.26 : .26, 0);
  });
  hero.root.position.set(0, .165, -2.8);
}
// 对手穿的就是她们在店里抢走的货；没抢到的类别随手拿一件
function rivalLooks() {
  return rivalHaul.map(haul => Object.fromEntries(CATS.map(c => {
    if (haul[c]) return [c, haul[c]];
    const pool = Math.random() < .5 ? CATALOG[c].filter(i => i.vibe === night.vibe) : CATALOG[c];
    return [c, pool[Math.floor(Math.random() * pool.length)]];
  })));
}
function autoPose(i) {
  if (screen !== 'pose') return;
  const t = performance.now() / 1000 - runwayStart;
  const last = i === BEATS.length - 1, pose = poseState.seq[i];
  poseState.at[i] = t;
  $('pose-word').innerHTML = pose.label + (last && poseState.big ? '<small>全场尖叫！</small>' : '');
  $('pose-word').animate([{transform: 'scale(1.6)', opacity: 0}, {transform: 'scale(1)', opacity: 1}], {duration: 240, easing: 'ease-out'});
  sfx.shutter();
  $('flashbulb').classList.remove('on'); void $('flashbulb').offsetWidth; $('flashbulb').classList.add('on');
  poseState.cheerAt = t;
  sfx.cheer(poseState.big || last);
  if (last && poseState.big) sfx.perfect();
}
function skipRunway() {
  if (screen !== 'pose') return;
  clearLater();
  const t = performance.now() / 1000 - runwayStart;
  poseState.seq.forEach((_, i) => { if (poseState.at[i] == null) poseState.at[i] = t - (poseState.seq.length - i) * .5; });
  finish();
}
function finish() {
  setScreen('result');
  audio.setMode('menu');
  const score = scoreRun(night, result.bag, result.left);
  const prevStars = save.stars[nightIndex] || 0, prevBest = save.best[nightIndex] || 0;
  save.stars[nightIndex] = Math.max(prevStars, score.stars);
  save.best[nightIndex] = Math.max(prevBest, score.total);
  const book = save.outfits[nightIndex] ||= [];
  const newOutfit = score.outfit >= 0 && !book.includes(score.outfit);
  if (newOutfit) book.push(score.outfit);
  writeSave(SAVE_KEY, save);
  renderOutfitBook(score.outfit, newOutfit);
  $('result-night').textContent = `第${nightIndex + 1}夜 · ${night.place}`;
  const titles = ['差一点点…', '穿上T台了！', '全场焦点！', '今晚你最靓！'];
  $('result-title').textContent = titles[score.stars];
  $('result-line').textContent = `¥${score.totals.pay} 穿出 ${score.stars} 星 · 比原价省了 ¥${score.totals.saved}`;
  const rows = [
    ['造型', score.style, 60, '#ff2f86'],
    ['省钱', score.save, 25, '#2fc9a6'],
    ['手速', score.speed, 15, '#3f8fe6'],
  ];
  $('breakdown').replaceChildren(...rows.map(([label, v, max, c]) => {
    const row = document.createElement('div');
    row.className = 'bd-row';
    row.innerHTML = `<span>${label}</span><span class="bar"><i style="--w:${Math.round(v / max * 100)}%;--c:${c}"></i></span><b>${v}/${max}</b>`;
    return row;
  }));
  $('result-total').textContent = score.total;
  const board = [{name: '你', face: heroFace, points: score.total, you: true, note: `¥${score.totals.pay} · 省 ¥${score.totals.saved}`},
    ...result.rivals.map((look, i) => {
      const entry = Object.fromEntries(CATS.map(c => [c, {item: look[c], paid: look[c].price}]));
      const stolen = CATS.filter(c => rivalHaul[i][c]);
      const points = stylePoints(night, entry) + 14 + Math.floor(Math.random() * 18) + stolen.length * 2;
      return {name: RIVALS[i], face: rivalFaces[i], points, note: stolen.length ? `穿着她抢走的${look[stolen[0]].name}` : '没抢到什么'};
    })].sort((a, b) => b.points - a.points);
  $('rank').replaceChildren(...board.map((row, i) => {
    const li = document.createElement('li');
    if (row.you) li.className = 'you';
    li.innerHTML = `<em>${i + 1}</em><img alt="" src="${row.face}"><span>${row.name}<small>${row.note}</small></span><b>${row.points}</b>`;
    return li;
  }));
  const place = board.findIndex(r => r.you);
  if (place > 0) $('result-line').textContent += ` · ${board[0].name} 以 ${board[0].points} 分压你一头`;
  const tip = score.stars < 2 ? ` · 再 ${STAR2 - score.total} 分到 2 星` : score.stars < 3 ? ' · 穿上下面任意一套拿第 3 颗星'
    : book.length < starOutfits(night).length ? ' · 还有别的三星搭配没解锁' : ' · 抢闪购能刷更高分';
  $('result-best').textContent = (score.total > prevBest ? '新纪录！' : `最高 ${prevBest}`) + tip;
  const stars = $('stars').querySelectorAll('i');
  stars.forEach(i => i.classList.remove('on'));
  for (let i = 0; i < score.stars; i++) later(() => { stars[i].classList.add('on'); sfx.star(i); }, 250 + i * 320);
  later(() => {
    if (score.stars >= 3) { sfx.win(); confetti(newOutfit ? 70 : 45); }
    else if (score.stars === 0) sfx.fail();
  }, 250 + score.stars * 320);
  const canNext = nightIndex < NIGHTS.length - 1 && score.stars > 0 || (save.stars[nightIndex] > 0 && nightIndex < NIGHTS.length - 1);
  $('next').textContent = canNext ? '下一夜 →' : nightIndex === NIGHTS.length - 1 && score.stars > 0 ? '全部通关！' : '再来一次';
  $('next').dataset.action = canNext ? 'next' : nightIndex === NIGHTS.length - 1 && score.stars > 0 ? 'menu' : 'retry';
  if (dev) window.__last = score;
}

function renderOutfitBook(current, isNew) {
  const outfits = starOutfits(night), book = save.outfits[nightIndex] || [];
  $('ob-count').textContent = `${book.length}/${outfits.length}`;
  $('outfits').replaceChildren(...outfits.map((o, i) => {
    const found = book.includes(i);
    const card = document.createElement('div');
    card.className = 'ob-card ' + (found ? 'found' : 'locked') + (i === current ? ' now' : '') + (i === current && isNew ? ' new' : '');
    card.innerHTML = `<div class="ob-items">${o.items.map(it => `<img alt="" src="${images[it.id]}">`).join('')}</div>`
      + `<span class="ob-name">${found ? o.name : o.hint}</span>`;
    return card;
  }));
}

// ——事件——
$('start').addEventListener('click', () => { audio.unlock(); sfx.go(); loadNight(nightIndex); });
$('intro').addEventListener('click', () => { if (screen === 'intro') { audio.unlock(); beginShopping(); } });
$('checkout').addEventListener('click', () => checkout(false));
$('to-runway').addEventListener('click', () => { sfx.tap(); startRunway(); });
$('pose').addEventListener('pointerdown', e => { e.preventDefault(); skipRunway(); });
$('retry').addEventListener('click', () => { sfx.tap(); loadNight(nightIndex); });
$('next').addEventListener('click', () => {
  sfx.tap();
  const action = $('next').dataset.action;
  if (action === 'next') loadNight(nightIndex + 1);
  else if (action === 'menu') { night = null; titleScreen(); }
  else loadNight(nightIndex);
});
$('menu').addEventListener('click', () => { sfx.tap(); titleScreen(); });
$('mute').addEventListener('click', () => {
  const on = audio.toggle();
  $('mute').setAttribute('aria-pressed', String(on));
});
$('mute').setAttribute('aria-pressed', String(!audio.muted));
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && screen === 'pose') { e.preventDefault(); skipRunway(); }
});
let drag = null, spin = 0;
host.addEventListener('pointerdown', e => { if (screen === 'shop') drag = {id: e.pointerId, x: e.clientX}; });
host.addEventListener('pointermove', e => { if (drag?.id === e.pointerId) { spin += (e.clientX - drag.x) * .018; drag.x = e.clientX; } });
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) host.addEventListener(ev, () => (drag = null));

// ——主循环——
function shopLogic(dt) {
    handle(market.tick(dt, bag));
    const left = market.left();
    const sec = Math.max(0, Math.ceil(left));
    $('time').textContent = sec;
    $('clock-ring').style.strokeDashoffset = 119.4 * (1 - Math.max(0, left) / night.time);
    $('clock').classList.toggle('urgent', left <= 10);
    if (sec !== lastSecond) {
      if (sec <= 10 && sec > 0) sfx.tick(sec <= 3);
      if (sec === 10 && lastSecond > 10) { audio.setMode('rush'); toast('最后10秒！闪购加速', 'flash', 1400); }
      lastSecond = sec;
    }
    if (market.flash) {
      const tag = cards[market.flash.item.id]?.querySelector('.flash-tag i');
      if (tag) tag.style.setProperty('--left', Math.max(0, (market.flash.until - market.t) / market.flash.len * 100) + '%');
    }
    if (left <= 0) checkout(true);
    if (guiding()) updateGuide();
  }

let prev = performance.now();
function frame(nowMs) {
  step(nowMs, Math.min(.06, (nowMs - prev) / 1000));
  prev = nowMs;
  requestAnimationFrame(frame);
}
function step(nowMs, dt) {
  const t = nowMs / 1000;
  const portrait = art.camera.aspect < 1;
  if (screen === 'shop' && market) shopLogic(dt);
  // 镜头和人物
  if (screen === 'runway' || screen === 'pose' || screen === 'result') {
    const s = t - runwayStart, walk = Math.min(s / 2.6, 1);
    hero.root.position.set(0, .165, -2.8 + walk * 4.0);
    let rot = .12 + Math.max(0, walk - .9) * 1.2, lift = 0;
    // 当前 POSE 淡入、上一个 POSE 淡出；转圈和跳跃改根节点
    let cur = -1;
    if (poseState) poseState.at.forEach((at, i) => { if (at != null && s >= at) cur = i; });
    const posing = [];
    if (cur >= 0) {
      const P = poseState.seq[cur], since = s - poseState.at[cur], k = Math.min(1, since / .22);
      if (P.spin) rot += Math.PI * 2 * (1 - (1 - Math.min(1, since / .6)) ** 3);
      else posing.push([P.p, k]);
      if (P.hop && since < .5) lift = Math.sin(Math.PI * since / .5) * .35;
      const prevP = cur > 0 ? poseState.seq[cur - 1] : null;
      if (prevP?.p && k < 1) posing.push([prevP.p, 1 - k]);
    }
    hero.root.position.y = .165 + lift;
    hero.root.rotation.y = rot;
    hero.animate(t, walk < 1 ? .31 : 0, walk >= 1 ? .25 : 0);
    for (const [pose, k] of posing) hero.addPose(pose, k);
    rivals.forEach((r, i) => {
      r.animate(t + i, .016, .3);
      if (poseState?.rivalPose[i]?.p) r.addPose(poseState.rivalPose[i].p, .85);
    });
    const cheer = poseState ? Math.max(0, 1 - (s - poseState.cheerAt) / (poseState.big ? 1.6 : 1.1)) : 0;
    show.animateCrowd(t, hero.root.position.z, cheer);
    show.glitter.forEach((p, i) => {
      const a = t * .68 + i * 2.39, pulse = .68 + .29 * Math.sin(i + t * 4.4);
      p.position.set(Math.cos(a) * (1.3 + (i % 3) * .31), .34 + (i * .29 + t * .62) % 3.7, Math.sin(a) * .81 - .19);
      p.scale.set(.027 * pulse, .058 * pulse, .027 * pulse);
    });
    // 斜侧机位（每场随机从左或右拍，另一侧看台做背景）；最后一拍推成近景
    const hz = hero.root.position.z, side = poseState?.side ?? 1;
    const lastAt = poseState?.at[BEATS.length - 1];
    if (lastAt != null && s > lastAt + .15) {
      view.set(0, 2.25, hz);
      camGoal.set(side * (portrait ? .5 : .8), 2.6, hz + (portrait ? 3.6 : 3.0));
    } else {
      view.set(-side * (portrait ? .25 : .7), 1.6, hz * .55 - .4);
      camGoal.set(side * (portrait ? 1.7 : 2.3), portrait ? 2.5 : 2.7, (portrait ? 6.6 : 5.0) + hz * .6);
    }
  } else {
    const since = t - tryTime, flourish = since < 1 ? Math.sin(Math.PI * since) ** 2 : 0;
    hero.root.position.set(0, .125 + (since < .35 ? Math.sin(Math.PI * since / .35) * .14 : 0), 0);
    hero.root.rotation.y = .06 + spin + Math.sin(t * .85) * .12 + flourish * .5;
    hero.animate(t, 0, .13 + flourish * .7);
    // The camera frames the avatar inside the fitting area below the HUD.
    const stacked = host.clientWidth === game.clientWidth;
    view.set(stacked ? 0 : -.1, stacked ? 1.55 : 1.8, 0);
    camGoal.set(stacked ? .48 : .7, stacked ? 1.92 : 2.05, stacked ? 5.4 : 6.3);
  }
  art.camera.position.lerp(camGoal, Math.min(1, dt * 5));
  lookAt.lerp(view, Math.min(1, dt * 5.5));
  art.camera.lookAt(lookAt);
  art.webgl.render(art.scene, art.camera);
}
art.camera.position.set(.4, 2, 7);
titleScreen();
requestAnimationFrame(frame);
if (dev) window.__rw = {get market() { return market; }, get bag() { return bag; }, get night() { return night; }, get screen() { return screen; }, loadNight, checkout, startRunway, skipRunway, POSES, get poseState() { return poseState; }, frames(n) { let t = performance.now(); for (let i = 0; i < n; i++) step(t += 60, .06); }, advance(sec) { for (let i = 0; i < sec * 30 && screen === 'shop'; i++) shopLogic(1 / 30); }};
