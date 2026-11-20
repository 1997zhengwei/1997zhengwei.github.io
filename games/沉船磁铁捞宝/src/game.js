import { artifacts, castDepth, castPower, contactAt, gateAt, layoutFor, lootFor, maxDepth, nextSweetSpot, recordCasts, reelSeconds, slots, vaultId, vaultRevealSeconds, xEdge } from './rules.js';
import { commission, createLedger, purchaseUpgrade, rankIndex, recordDescent, recordHaul, upgradeValue, upgrades, wealthRanks } from './progress.js';
import { createIllustration } from './illustration.js';
import { treasureIcons, workshopIcons } from './sprites.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, alpha) => start + (end - start) * alpha;
const number = new Intl.NumberFormat('zh-CN');
const pickupNotes = [329.6, 392, 440, 523, 587, 659, 784];
const $ = (key) => document.getElementById(key);
const canvas = $('sea');
try {
  start();
} catch (error) {
  console.error(error);
  $('error').hidden = false;
  $('cast').disabled = true;
}

function start() {
  const illustration = createIllustration(canvas);
  const popLayer = $('float-points');
  const boostButton = $('reel-boost');
  const boostLabel = $('boost-label');
  const vaultNotice = $('vault-discovery');
  const pops = [];

  const ledger = createLedger();
  const recentHauls = [];
  let progress = ledger.read();
  let personalDepth = progress.deepest;
  let fitting = false;
  let currentLimit = upgradeValue(progress, 'capacity');
  let currentRadius = upgradeValue(progress, 'field');
  let guard = 0;
  let shieldHit = null;
  let shieldUntil = 0;
  const workshop = [...$('workshop').querySelectorAll('[data-upgrade]')].map(button => {
    const index = upgrades.findIndex(def => def.id === button.dataset.upgrade);
    const def = upgrades[index];
    button.querySelector('img').src = workshopIcons[index];
    button.addEventListener('click', () => fitEquipment(def.id));
    return { button, def, effect: button.querySelector('[data-effect]'), price: button.querySelector('[data-price]') };
  });
  const tabs = [...$('workshop').querySelectorAll('[data-workshop]')];
  const panels = [...$('workshop').querySelectorAll('[data-panel]')];
  for (const tab of tabs) tab.addEventListener('click', () => selectWorkshop(tab.dataset.workshop));
  const catalogSlots = artifacts.map(({ name, hue }, kind) => {
    const slot = document.createElement('span');
    slot.style.setProperty('--item-color', hue);
    const icon = new Image();
    icon.src = treasureIcons[kind];
    icon.alt = '';
    slot.append(icon);
    slot.title = name;
    $('catalog').append(slot);
    return slot;
  });

  let run = 0;
  let current = 0;
  let score = 0;
  let lifted = 0;
  let biggest = null;
  let deepestVoyage = 0;
  let phase = 'setup';
  let phaseTime = 0;
  let worldTime = 0;
  let power = 0;
  let sweetSpot;
  let startDepth = 0;
  let vaultRevealing = false;
  let duration = 0;
  let depth = .47;
  let cameraDepth = 2.38;
  let x = 0;
  let vx = 0;
  let targetX = 0;
  let drag = null;
  let shake = 0;
  let tilt = 0;
  let pingFlash = 0;
  let noticeUntil = 0;
  let lastDepth = -1;
  let air = [];
  let cargo = [];
  let lost = [];
  let gates = [];
  const passed = new Set();
  const moving = new Set();
  const boostKeys = new Set();
  let boostPointer = null;
  let audio;
  const music = [
    { file: 'still-water.mp3', underwater: false, level: .53, volume: null, loading: null },
    { file: 'far-tide.mp3', underwater: true, level: .63, volume: null, loading: null },
  ];
  let soundOn = true;

  function selectWorkshop(name) {
    for (const tab of tabs) tab.setAttribute('aria-pressed', String(tab.dataset.workshop === name));
    for (const panel of panels) panel.hidden = panel.dataset.panel !== name;
  }

  function showProgress() {
    $('wallet').textContent = number.format(progress.wallet);
    personalDepth = Math.max(personalDepth, progress.deepest);
    $('best-depth').textContent = personalDepth;
    $('aim-hint').textContent = progress.discoveries.includes(vaultId) ?
      '看准青色区下钩' : '看准青色区下钩，直达 500 米';
    for (const { button, def, effect, price } of workshop) {
      const level = progress.levels[def.id];
      const cost = def.prices[level];
      const value = def.values[level];
      const format = amount => def.precision === undefined ? amount : amount.toFixed(def.precision);
      effect.textContent = cost === undefined ? format(value) + def.suffix :
        (def.id === 'beacon' && level === 0 ? '开通 ' + def.values[1] + def.suffix :
          format(value) + ' → ' + format(def.values[level + 1]) + def.suffix);
      price.textContent = cost === undefined ? '已满级' : cost + ' 金币';
      button.disabled = fitting || cost === undefined || progress.wallet < cost;
      button.dataset.affordable = String(!button.disabled);
    }
    const order = commission(progress);
    const brief = order.name + ' · ' + order.hint + ' ' + Math.min(order.done, order.goal) + '/' + order.goal;
    if ($('commission-text').textContent !== brief) $('commission-text').textContent = brief;
    $('commission-bonus').textContent = '+' + order.bonus;
  }

  async function updateLedger(mutate) {
    const result = await ledger.change(mutate);
    progress = result.record;
    showProgress();
    return result;
  }

  async function fitEquipment(id) {
    if (fitting || (phase !== 'ready' && phase !== 'end')) return;
    fitting = true;
    showProgress();
    try {
      const { outcome } = await updateLedger(record => purchaseUpgrade(record, id));
      if (outcome) {
        const value = upgradeValue(progress, id);
        const notices = {
          capacity: '磁铁已加固 · 下一钩能带 ' + value + ' 件',
          field: '磁场已增强 · 吸附距离 ' + value.toFixed(1) + ' 米',
          guard: '护套已装好 · 每钩挡 ' + value + ' 次碰撞',
          beacon: '灯塔运营中 · 每分钟 +' + value + ' 金币',
        };
        message(notices[id], 'good', 2.4);
        sound();
        tones([392, 587, 784], .13);
      }
    } finally {
      fitting = false;
      showProgress();
    }
  }

  function sound() {
    if (!soundOn) return;
    const Mixer = window.AudioContext || window.webkitAudioContext;
    if (!Mixer) return;
    audio ??= new Mixer();
    $('sound').setAttribute('aria-pressed', 'true');
    syncAudio();
    for (const track of music) {
      track.loading ??= startMusic(track).catch(() => { track.loading = null; });
    }
  }

  function syncAudio() {
    if (!audio) return;
    const active = soundOn && !document.hidden;
    void (active ? audio.resume() : audio.suspend()).catch(() => {});
  }

  async function startMusic(music) {
    const response = await fetch(new URL('../assets/' + music.file, import.meta.url));
    if (!response.ok) throw new Error('Music request failed');
    const buffer = await audio.decodeAudioData(await response.arrayBuffer());
    const track = audio.createBufferSource();
    const volume = audio.createGain();
    track.buffer = buffer;
    track.loop = true;
    volume.gain.value = music.underwater === steering() ? music.level : 0;
    track.connect(volume).connect(audio.destination);
    track.start();
    music.volume = volume;
  }

  function mixMusic() {
    if (!audio) return;
    const underwater = steering();
    for (const track of music) {
      track.volume?.gain.setTargetAtTime(track.underwater === underwater ? track.level : 0, audio.currentTime, .14);
    }
  }

  function tones(notes, time = .13, gain = .081, type = 'sine') {
    if (!soundOn || audio?.state !== 'running') return;
    notes.forEach((frequency, i) => {
      const start = audio.currentTime + i * time * .64;
      const wave = audio.createOscillator();
      const amp = audio.createGain();
      wave.type = type;
      wave.frequency.setValueAtTime(frequency, start);
      amp.gain.setValueAtTime(.001, start);
      amp.gain.exponentialRampToValueAtTime(gain, start + .012);
      amp.gain.exponentialRampToValueAtTime(.001, start + time);
      wave.connect(amp).connect(audio.destination);
      wave.start(start);
      wave.stop(start + time + .012);
    });
  }

  function message(text, style = '', ttl = 1.34) {
    const toast = $('feedback');
    toast.textContent = text;
    toast.dataset.kind = style;
    toast.hidden = false;
    noticeUntil = worldTime + ttl;
  }

  function popPoints(amount, atX, atDepth) {
    const node = document.createElement('span');
    node.textContent = (amount > 0 ? '+' : '−') + Math.abs(amount);
    if (amount < 0) node.className = 'loss';
    popLayer.append(node);
    pops.push({ node, x: atX, d: atDepth, life: 0 });
  }

  function animatePoints(dt) {
    for (let i = pops.length - 1; i >= 0; i--) {
      const pop = pops[i];
      pop.life += dt;
      const u = pop.life / .83;
      if (u >= 1) {
        pop.node.remove();
        pops.splice(i, 1);
        continue;
      }
      const side = pop.x > 5.5 ? -1 : 1;
      const { halfWidth, halfHeight } = illustration.size;
      const screenX = (pop.x + side * (1.03 + u * .41)) / halfWidth;
      const screenY = (pop.d - .19 - u * 1.50 - cameraDepth) / halfHeight;
      pop.node.style.left = clamp(50 + screenX * 50, 7, 93) + '%';
      pop.node.style.top = (50 + screenY * 50) + '%';
      pop.node.style.opacity = Math.min(1, (1 - u) * 3);
    }
  }

  const steering = () => phase === 'down' || phase === 'discover' || phase === 'up';

  function setPhase(next) {
    const wasActive = steering();
    phase = next;
    phaseTime = 0;
    $('field').dataset.phase = next;
    const ready = next === 'ready';
    const active = steering();
    $('aim').hidden = !ready;
    $('steer-guide').hidden = next !== 'up';
    boostButton.hidden = next !== 'up';
    $('cast').hidden = next === 'up';
    $('cast').disabled = !ready;
    $('report').hidden = !ready || current === 0;
    $('workshop').hidden = !ready && next !== 'end';
    $('reading').hidden = !active;
    $('cargo').hidden = !active || next === 'discover';
    $('cast-label').textContent = ready ? '下钩' :
      ({ down:'下沉中', discover:'海底', up:'收线中', dock:'入舱中', end:'查看战报' })[next];
    $('gate-warning').hidden = true;
    if (wasActive !== active) mixMusic();
    if (next !== 'up') clearBoost();
    if (!active) {
      releaseDrag();
      moving.clear();
    }
  }

  function showMeter() {
    power = castPower(phaseTime * .51);
    $('needle').style.setProperty('--power', (power * 100).toFixed(2) + '%');
    $('meter').dataset.aligned = String(power >= sweetSpot[0] && power <= sweetSpot[1]);
  }

  function showCargo() {
    $('cargo-count').textContent = cargo.length + ' / ' + currentLimit;
    const icons = cargo.slice(0, 7).map(item => {
      const icon = new Image();
      icon.src = treasureIcons[item.kind];
      icon.alt = artifacts[item.kind].name;
      return icon;
    });
    if (cargo.length > 7) {
      const rest = document.createElement('b');
      rest.textContent = '+' + (cargo.length - 7);
      icons.push(rest);
    }
    $('cargo-icons').replaceChildren(...icons);
    $('guard-count').hidden = upgradeValue(progress, 'guard') === 0;
    $('guard-count').textContent = guard > 0 ? '护套 ×' + guard : '护套已用完';
  }

  function prepare() {
    cargo = [];
    lost = [];
    passed.clear();
    shieldHit = null;
    $('shield-event').hidden = true;
    depth = .47;
    currentLimit = upgradeValue(progress, 'capacity');
    currentRadius = upgradeValue(progress, 'field');
    guard = upgradeValue(progress, 'guard');
    x = vx = targetX = 0;
    gates = layoutFor(run + current);
    sweetSpot = nextSweetSpot(sweetSpot);
    $('meter').style.setProperty('--aim-start', Math.round(sweetSpot[0] * 100) + '%');
    $('meter').style.setProperty('--aim-end', Math.round(sweetSpot[1] * 100) + '%');
    showCargo();
    air = lootFor(run + current, current).map(drop => ({
      ...drop, px: drop.x, y: drop.d, angle: 0, state: 'rest', radius: artifacts[drop.kind].radius,
    }));
    setPhase('ready');
    showMeter();
  }

  function beginRound() {
    score = lifted = current = deepestVoyage = 0;
    biggest = null;
    recentHauls.length = 0;
    $('result').hidden = $('feedback').hidden = true;
    prepare();
  }

  function cast() {
    if (phase !== 'ready' || fitting) return;
    sound();
    currentLimit = upgradeValue(progress, 'capacity');
    currentRadius = upgradeValue(progress, 'field');
    guard = upgradeValue(progress, 'guard');
    showCargo();
    const landing = castDepth(power, sweetSpot);
    startDepth = landing.depth;
    duration = Math.min(5.2, 1.22 + startDepth * .019);
    setPhase('down');
    const title = landing.perfect ? '正中青色区！深潜 ' : '磁铁下潜 ';
    message(title + startDepth + ' 米', landing.perfect ? 'good' : '', 1.64);
    tones(landing.perfect ? [349, 523, 697] : [293, 220], .15);
    illustration.emit(0, -.12, true);
  }

  function beginReel() {
    vaultRevealing = false;
    vaultNotice.hidden = true;
    duration = reelSeconds(startDepth);
    setPhase('up');
    tones([297, 391], .14);
  }

  function land() {
    const reach = startDepth;
    const improved = reach > personalDepth;
    const mayDiscover = reach === maxDepth && !progress.discoveries.includes(vaultId);
    if (improved) {
      personalDepth = reach;
      $('best-depth').textContent = reach;
    }
    if (mayDiscover) {
      setPhase('discover');
      $('feedback').hidden = true;
      void updateLedger(record => recordDescent(record, reach)).then(({ outcome }) => {
        if (!outcome) {
          beginReel();
          return;
        }
        phaseTime = 0;
        vaultRevealing = true;
        vaultNotice.hidden = false;
        tones([440, 587, 740, 880, 1175], .19, .098, 'triangle');
      });
    } else {
      if (improved) void updateLedger(record => recordDescent(record, reach));
      beginReel();
    }
  }

  function upcomingGate() {
    return gates.findLast(gate => !passed.has(gate) && startDepth >= gate.d + .55 && depth > gate.d - .63);
  }

  function haul(dt) {
    const previous = depth;
    const next = upcomingGate();
    const speed = startDepth / duration;
    const nearGate = Boolean(next && depth - next.d < 7.5);
    const holdingBoost = boostPointer !== null || boostKeys.size > 0;
    const boosting = holdingBoost && !nearGate;
    showBoost(holdingBoost ? (nearGate ? 'near-gate' : 'fast') : 'ready');
    const reelSpeed = nearGate ? Math.min(speed, 5.6) : boosting ? speed * 2 : speed;
    depth = Math.max(0, depth - reelSpeed * dt);
    if (cargo.length < currentLimit) {
      for (const item of air) {
        if (item.state !== 'rest') continue;
        if (item.d < depth - .53 || item.d > previous + .68) continue;
        if (Math.abs(item.px - x) <= currentRadius + (cargo.length > 3 ? .18 : 0)) collect(item);
        if (cargo.length === currentLimit) break;
      }
    }
    for (const gate of gates) {
      if (startDepth < gate.d + .55 || passed.has(gate) || depth > gate.d - .63) continue;
      passed.add(gate);
      const hit = contactAt(gateAt(gate, worldTime), x, cargo.map((item, i) => ({ x: cargoX(slots[i]), radius: item.radius })));
      if (hit !== -1) scrape(hit);
    }
    updateCargo(dt);
    if (depth <= 0) bank();
  }

  function collect(item) {
    item.state = 'held';
    cargo.push(item);
    const { name, value, glyph } = artifacts[item.kind];
    pingFlash = .33;
    popPoints(value, x, depth);
    illustration.emit(item.px, item.y, false, item.kind > 3);
    const step = cargo.length - 1;
    const pitch = pickupNotes[step % pickupNotes.length] * 2 ** Math.floor(step / pickupNotes.length);
    tones(item.kind > 3 ? [pitch, pitch * 1.26] : [pitch], .16, .081, 'triangle');
    message(glyph + ' 吸到' + name + ' · ' + value + ' 分', 'good');
    showCargo();
  }

  function scrape(index) {
    if (guard > 0) {
      guard--;
      shieldHit = { x, d: depth, time: worldTime };
      shieldUntil = worldTime + 1.85;
      $('shield-left').textContent = guard ? '剩余 ' + guard + ' 次' : '本钩护套已耗尽';
      $('shield-event').hidden = false;
      $('shield-event').animate([{ opacity: .15, scale: .83 }, { opacity: 1, scale: 1 }], { duration: 210, easing: 'ease-out' });
      illustration.emit(x, depth, false, true);
      tones([185, 555, 925], .10, .13, 'triangle');
      showCargo();
      return;
    }
    const [item] = cargo.splice(index, 1);
    item.state = 'lost';
    item.escape = { time: 0, speed: (item.px >= x ? 1 : -1) * 1.13 };
    lost.push(item);
    shake = .31;
    popPoints(-artifacts[item.kind].value, x, depth);
    illustration.emit(item.px, item.y, false, true);
    tones([144, 96], .17, .09, 'triangle');
    message('蹭到横梁，掉了' + artifacts[item.kind].name, 'loss', 1.85);
    showCargo();
  }

  function cargoX(slot) {
    return x + slot.x - vx * (.033 + .009 * slot.fall);
  }

  function updateCargo(dt) {
    cargo.forEach((item, i) => {
      const offset = slots[i];
      const goal = cargoX(offset);
      const swing = Math.sin(worldTime * 6 + i * 1.6) * .065;
      const ease = 1 - Math.exp(-13 * dt);
      item.px = lerp(item.px, goal, ease);
      item.y = lerp(item.y, depth + offset.fall - swing, ease);
      item.angle = .29 * Math.sin(worldTime * 4 + item.spin) + vx * .029;
    });
  }

  function bank() {
    const value = cargo.reduce((sum, item) => sum + artifacts[item.kind].value, 0);
    score += value;
    lifted += cargo.length;
    deepestVoyage = Math.max(deepestVoyage, startDepth);
    const prizes = cargo.map(({ kind }) => artifacts[kind]);
    for (const a of prizes) {
      if (!biggest || a.value > biggest.value) biggest = a;
    }
    recentHauls.push(value);
    if (recentHauls.length > recordCasts) recentHauls.shift();
    const streakScore = recentHauls.length === recordCasts ? recentHauls.reduce((sum, amount) => sum + amount, 0) : 0;
    const returned = cargo.map(({ kind, d }) => ({ kind, d }));
    void updateLedger(record => recordHaul(record, returned, value, streakScore)).then(({ outcome }) => {
      if (phase !== 'dock' && phase !== 'ready') return;
      if (outcome.bonus) {
        message('完成委托 · 额外 +' + outcome.bonus + ' 金币', 'good', 3.3);
        tones([523,659,784,1047], .13);
      } else if (outcome.newRank) {
        message('晋升 ' + outcome.newRank, 'good', 2.5);
      }
    });
    message(cargo.length ? '已入舱 +' + number.format(value) + ' 金币' : '未带回藏品', 'good', 2.5);
    tones(value ? [440, 554, 659, 880] : [330, 247], .145, .077);
    setPhase('dock');
  }

  function results() {
    if (phase !== 'ready' || current === 0) return;
    setPhase('end');
    $('feedback').hidden = true;
    $('result').hidden = false;
    $('result-caption').textContent = '打捞 ' + current + ' 钩 · 带回 ' + lifted + ' 件 · 最深 ' + deepestVoyage + ' m' +
      (biggest ? ' · ' + biggest.name + ' 最值钱' : '');
    $('total').textContent = number.format(score);
    $('best').textContent = progress.best ? number.format(progress.best) : '—';
    $('catalog-count').textContent = progress.discoveries.length + ' / ' + artifacts.length;
    const recordDepth = Math.max(deepestVoyage, personalDepth);
    $('depth-record').textContent = '最深纪录 ' + recordDepth + ' 米' +
      (progress.discoveries.includes(vaultId) ? ' · 已找到深渊王匣' : '');
    $('wealth-record').textContent = wealthRanks[rankIndex(progress.fortune)].name +
      ' · 累计 ' + number.format(progress.fortune) + ' 金币';
    catalogSlots.forEach((slot, i) => {
      const item = artifacts[i];
      const found = progress.discoveries.includes(item.id);
      slot.dataset.found = found;
      slot.setAttribute('aria-label', (found ? '已收录' : '尚未收录') + item.name);
    });
    $('resume').focus({ preventScroll: true });
  }

  function resume() {
    if (phase !== 'end') return;
    $('result').hidden = true;
    setPhase('ready');
    showMeter();
    $('cast').focus({ preventScroll: true });
  }

  function updateAir() {
    for (const item of air) {
      if (item.state !== 'rest') continue;
      item.px = item.x + Math.sin(worldTime * 1.25 + item.spin) * .137;
      item.y = item.d - Math.cos(worldTime * 1.63 + item.spin) * .138;
      item.angle = Math.cos(item.spin + worldTime * .99) * .32;
    }
  }

  function updateLost(dt) {
    lost = lost.filter(item => {
      item.escape.time += dt;
      const { time, speed } = item.escape;
      item.y += (.7 + time * 2.8) * dt;
      item.px += speed * dt;
      item.angle += speed * 2 * dt;
      return time < 1.54;
    });
  }

  function releaseDrag() {
    const pointer = drag;
    drag = null;
    if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
    $('field').dataset.drag = false;
  }

  function followPointer(event) {
    const rect = canvas.getBoundingClientRect();
    targetX = clamp(((event.clientX - rect.left) / rect.width * 2 - 1) * illustration.size.halfWidth, -xEdge, xEdge);
  }

  function showBoost(mode) {
    if (boostButton.dataset.mode === mode) return;
    boostButton.dataset.mode = mode;
    boostLabel.textContent = { ready: '按住加速', fast: '2× 收线', 'near-gate': '过闸减速' }[mode];
  }

  function clearBoost() {
    const pointer = boostPointer;
    boostPointer = null;
    boostKeys.clear();
    if (pointer !== null && boostButton.hasPointerCapture(pointer)) boostButton.releasePointerCapture(pointer);
    showBoost('ready');
  }

  boostButton.addEventListener('pointerdown', event => {
    if (phase !== 'up' || event.button !== 0 || boostPointer !== null) return;
    boostPointer = event.pointerId;
    boostButton.setPointerCapture(boostPointer);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    boostButton.addEventListener(type, event => {
      if (event.pointerId === boostPointer) boostPointer = null;
    });
  }
  boostButton.addEventListener('contextmenu', event => event.preventDefault());

  canvas.addEventListener('pointerdown', (event) => {
    if (!steering() || drag !== null || event.button !== 0) return;
    drag = event.pointerId;
    canvas.setPointerCapture(drag);
    $('field').dataset.drag = true;
    followPointer(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId === drag) followPointer(event);
  });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(eventName, event => { if (event.pointerId === drag) releaseDrag(); });
  }

  const directions = new Map([['ArrowLeft', -1], ['KeyA', -1], ['ArrowRight', 1], ['KeyD', 1]]);
  addEventListener('keydown', event => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    if (phase === 'up' && (event.key === 'Shift' ||
      (event.target === boostButton && (event.code === 'Space' || event.code === 'Enter')))) {
      event.preventDefault();
      boostKeys.add(event.code);
    } else if (event.code === 'Escape' && phase === 'end') {
      event.preventDefault();
      resume();
    } else if (event.code === 'Space' && phase === 'ready' && !event.repeat &&
      !['BUTTON', 'INPUT'].includes(event.target?.tagName)) {
      event.preventDefault();
      cast();
    } else if (steering() && directions.has(event.code)) {
      event.preventDefault();
      moving.add(event.code);
    }
  });
  addEventListener('keyup', event => {
    moving.delete(event.code);
    if (boostKeys.delete(event.code)) event.preventDefault();
  });
  addEventListener('blur', () => { moving.clear(); releaseDrag(); clearBoost(); });
  $('sound').addEventListener('click', () => {
    if (audio) soundOn = !soundOn;
    if (soundOn) sound();
    else {
      $('sound').setAttribute('aria-pressed', 'false');
      syncAudio();
    }
  });
  document.addEventListener('click', event => {
    if (!audio && event.target !== $('sound')) sound();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearBoost();
    syncAudio();
  });
  $('cast').addEventListener('click', cast);
  $('report').addEventListener('click', results);
  $('resume').addEventListener('click', resume);
  $('again').addEventListener('click', () => { run++; beginRound(); $('cast').focus({ preventScroll: true }); });

  function input(dt) {
    let direction = 0;
    for (const code of moving) direction += directions.get(code);
    targetX = clamp(targetX + direction * 12 * dt, -xEdge, xEdge);
    vx = lerp(vx, clamp((targetX - x) * 12, -20, 20), 1 - Math.exp(-17 * dt));
    x = clamp(x + vx * dt, -xEdge, xEdge);
  }

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    illustration.resize(width, height);
  }

  function draw(dt) {
    const { halfHeight } = illustration.size;
    const focus = clamp(depth + 1.36, halfHeight * .36, maxDepth - halfHeight * .51);
    const cameraSpeed = phase === 'down' && startDepth > 150 ? 18 : 6.2;
    cameraDepth = lerp(cameraDepth, focus, 1 - Math.exp(-cameraSpeed * dt));
    tilt = lerp(tilt, vx * .028, 1 - Math.exp(-10 * dt));
    pingFlash = Math.max(0, pingFlash - dt);
    shake = Math.max(0, shake - dt);
    if (shieldHit && worldTime - shieldHit.time > .72) shieldHit = null;
    updateAir();
    updateLost(dt);
    animatePoints(dt);
    illustration.render({
      time: worldTime, dt, cameraDepth, shake, x, d: depth + (phase === 'ready' ? .23 : 0),
      tilt, phase, items: air, gates, run: run + current, ping: pingFlash, levels: progress.levels,
      radius: currentRadius, guard, shieldHit,
      rank: rankIndex(progress.fortune), vaultFound: progress.discoveries.includes(vaultId),
      vaultAge: vaultRevealing ? phaseTime : null,
    });
  }

  function frame(now) {
    const dt = Math.max(0, Math.min(.068, (now - previous) / 1000));
    previous = now;
    if (document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    worldTime += dt;
    phaseTime += dt;
    if (steering()) input(dt);
    if (phase === 'ready') {
      showMeter();
    } else if (phase === 'down') {
      const landing = Math.min(1, phaseTime / duration);
      depth = .47 + (startDepth - .47) * (1 - (1 - landing) ** 1.08);
      if (landing === 1) land();
    } else if (phase === 'discover') {
      if (vaultRevealing && phaseTime >= vaultRevealSeconds) beginReel();
    } else if (phase === 'up') {
      haul(dt);
    } else if (phase === 'dock') {
      x = lerp(x, 0, 1 - Math.exp(-5.7 * dt));
      depth = lerp(depth, .47, 1 - Math.exp(-7.5 * dt));
      updateCargo(dt);
      if (phaseTime > .93) {
        current++;
        prepare();
      }
    }
    const reading = Math.round(depth);
    if (reading !== lastDepth) {
      $('depth').textContent = reading;
      lastDepth = reading;
    }
    const nextGate = phase === 'up' ? upcomingGate() : undefined;
    const lead = Math.max(5.6, startDepth / duration * 2.15);
    const warning = nextGate && depth < nextGate.d + lead;
    $('gate-warning').hidden = !warning;
    if (warning) {
      const tip = nextGate.sway ? '潮门在移动 · 对齐青灯宽口' : '横梁在上方 · 走青灯宽口';
      if ($('gate-warning').textContent !== tip) $('gate-warning').textContent = tip;
    }
    if (worldTime > shieldUntil) $('shield-event').hidden = true;
    if (!$('feedback').hidden && worldTime > noticeUntil) $('feedback').hidden = true;
    draw(dt);
    requestAnimationFrame(frame);
  }

  resize();
  beginRound();
  showProgress();
  void updateLedger().then(({ paid }) => {
    if (paid > 0 && phase === 'ready') message('灯塔离港收益  +' + paid + ' 金币', 'good', 2.8);
  });
  setInterval(() => { if (upgradeValue(progress, 'beacon') > 0) void updateLedger(); }, 1000);
  addEventListener('storage', event => {
    if (event.key === 'wreck-and-reel-v1') {
      progress = ledger.read();
      showProgress();
    }
  });
  new ResizeObserver(resize).observe(canvas);
  let previous = performance.now();
  requestAnimationFrame(frame);
}
