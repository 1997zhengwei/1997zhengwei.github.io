// 规则层（纯逻辑，界面与 balance.mjs 机器人共用）——无尽模式。
// 顾客源源不断进店，越往后来得越快、买得越多、越没耐心。成交额就是分数。
// 顾客等不及摔手走人记 1 个差评；3 个差评店长喊打烊，本局结束。漏撕黑五贴纸=多收钱，顾客炸毛、不给小费。
// 连扫攒满「爆单槽」进入爆单时间：几秒内条码全朝你、贴纸自动撕、顾客秒付款、耐心冻结、每扫一件额外进账。
// 成交额每破一个里程碑，店长点赞抵消 1 个差评。

export const goods = {
  milk: {name:'鲜牛奶', price:16, body:'#f9f0d5', trim:'#6b9bf6', label:'MILK', shape:'carton'},
  juice: {name:'橙子汽水', price:12, body:'#ffb052', trim:'#48936a', label:'ORANGE', shape:'bottle'},
  crisps: {name:'海盐薯片', price:18, body:'#f7d14b', trim:'#f87854', label:'CRUNCH', shape:'pouch'},
  headphones: {name:'无线耳机', price:88, body:'#d3c9ff', trim:'#7763bf', label:'SOUND', shape:'box'},
  camera: {name:'即拍相机', price:122, body:'#ffc4a6', trim:'#e35a62', label:'CLICK', shape:'box'},
  car: {name:'玩具赛车', price:39, body:'#9cdbc6', trim:'#428a8d', label:'TURBO', shape:'toy'},
  coffee: {name:'冷萃咖啡', price:28, body:'#ba7d55', trim:'#fff0c9', label:'COLD BREW', shape:'bottle'},
  soap: {name:'泡泡洗手液', price:30, body:'#a0e1e1', trim:'#4fadb8', label:'BUBBLE', shape:'pump'},
  cookies: {name:'曲奇礼盒', price:37, body:'#f5b7d7', trim:'#bd5d87', label:'COOKIE', shape:'tin'},
  duck: {name:'捏捏小黄鸭', price:9, body:'#ffd43b', trim:'#ff8a2b', label:'QUACK', shape:'duck'},
  turkey: {name:'冷冻大火鸡', price:68, body:'#e9b27a', trim:'#c0453a', label:'TURKEY', shape:'turkey'},
};
const IDS = Object.keys(goods);
export const NAMES = ['蓝莓','阿桥','橘子','米粒','小满','豆豆','阿杰','可乐','糖糖','老周','七七','大熊','阿紫','小鹿','果冻','阿福','麦麦','团子','芒果','阿星'];
export const DESIGN_COUNT = 16;
export const BILLS = [50, 20, 10, 5, 1];
export const STRIKES = 3;
export const MILESTONES = [500, 1000, 2000, 3000, 5000, 8000, 12000, 20000, 30000, 50000];
export const RANKS = [[0,'实习收银员'],[1500,'熟练收银员'],[3500,'金牌收银员'],[7000,'爆单收银员'],[16000,'收银之神']];
export const rankOf = gmv => RANKS.filter(([v]) => gmv >= v).pop()[1];

export const WAIT_FACTOR = .45;         // 排队时耐心掉落速度 = 台前 × 0.45
export const MOOD = [.6, .3];           // ≥0.6 开心，≥0.3 一般，否则不爽
export const PENALTY = {wrongScan:.09, overcharge:.35, wrongChange:.12};
export const COMBO_BONUS = .035;
export const TIP = {3:.2, 2:.08, 1:0};  // 小费 = 实付 × 比例
export const FEVER_NEED = 12;           // 爆单槽：成功扫 12 件攒满
export const FEVER_TIME = 7;           // 爆单时间持续秒数
export const FEVER_COIN = 10;          // 爆单时每扫一件额外进账

export const tapsFor = face => [0, 1, 2, 1][face];
export const stickerOff = price => Math.max(5, Math.round(price * .3 / 5) * 5);
export const moodOf = p => p >= MOOD[0] ? 3 : p >= MOOD[1] ? 2 : p > 0 ? 1 : 0;

// 难度随「第几位进店的顾客」爬坡；每 5 位顾客升一档
export function difficulty(n) {
  const L = Math.floor(n / 5);
  return {
    level: L,
    items: L < 3 ? [2, 3] : L < 6 ? [2, 4] : L < 9 ? [3, 4] : [3, 5],
    faces: L < 1 ? [3, 3, 1, 1] : L < 3 ? [2, 3, 2, 2] : L < 6 ? [2, 3, 3, 3] : [1, 3, 3, 3],
    cash: n < 2 ? 0 : .4,
    sticker: n < 5 ? 0 : L < 6 ? .28 : .36,
    drain: Math.min(.064, .028 + .0038 * L),
    arrival: Math.max(2.4, 7.2 - .42 * L),
    vip: n > 0 && n % 10 === 9,
  };
}

export function rngFrom(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
}
const pickWeighted = (w, rng) => { let r = rng() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) if ((r -= w[i]) < 0) return i; return w.length - 1; };

export function changeCoins(amount) {
  const out = []; for (const b of BILLS) while (amount >= b) { out.push(b); amount -= b; } return out;
}
function cashBill(total) {
  return [20, 50, 100, 200, 300].find(b => b > total && changeCoins(b - total).length <= 4) || 0;
}

function makeCustomer(run, flash = false) {
  const n = run.ids++, d = difficulty(flash ? Math.max(0, run.spawned - 1) : run.spawned++), rng = run.rng;
  if (flash) Object.assign(d, {vip: false, cash: 0, sticker: 0, faces: [1, 0, 0, 0], items: [2, 2]});
  const count = d.vip ? 5 + Math.floor(rng() * 2) : d.items[0] + Math.floor(rng() * (d.items[1] - d.items[0] + 1));
  const items = [];
  let lastId = '';
  for (let i = 0; i < count; i++) {
    let id; do id = IDS[Math.floor(rng() * IDS.length)]; while (id === lastId);
    lastId = id;
    const sticker = rng() < d.sticker ? stickerOff(goods[id].price) : 0;
    items.push({id, face: pickWeighted(d.faces, rng), sticker, peeled: false, scanned: false});
  }
  if (n === 0) { items[0].face = 0; items[1].face = 1; }   // 第一位顾客教你：先拖，再转
  const recent = new Set(run.queue.slice(-6).map(c => c.name));
  let name; do name = NAMES[Math.floor(rng() * NAMES.length)]; while (recent.has(name));
  const full = items.reduce((s, it) => s + goods[it.id].price - it.sticker, 0);
  const bill = rng() < d.cash ? cashBill(full) : 0;
  const recentLooks = new Set(run.queue.slice(-4).map(q => q.design));
  let design; do design = Math.floor(rng() * DESIGN_COUNT); while (recentLooks.has(design));
  const c = {n, name, design, items, bill, p: 1, state: 'wait', drain: d.drain,
    hearts: 0, paid: 0, tip: 0, saved: 0, vip: d.vip, flash};
  run.queue.push(c);
  emit(run, 'arrive', {customer: n, vip: d.vip, level: d.level, flash});
  return c;
}

export function startRun(seed = Math.floor(Math.random() * 1e9)) {
  const run = {seed, rng: rngFrom(seed), queue: [], spawned: 0, ids: 0, front: -1, item: 0, face: 0, phase: 'idle',
    total: 0, taken: 0, combo: 0, bestCombo: 0, gmv: 0, tips: 0, saved: 0, served: 0, happy: 0,
    strikes: 0, strikeLog: [], time: 0, nextArrival: 0, milestone: 0, charge: 0, fever: 0, fevers: 0, feverCoins: 0, events: []};
  for (let i = 0; i < 3; i++) makeCustomer(run);
  run.nextArrival = difficulty(3).arrival;
  run.events.length = 0;
  callNext(run);
  run.events.length = 0;
  return run;
}

export const frontCustomer = run => run.front >= 0 ? run.queue[run.front] : null;
export const currentItem = run => frontCustomer(run)?.items[run.item];
export const changeDue = run => { const c = frontCustomer(run); return c?.bill ? c.bill - run.total : 0; };
export const waiting = run => run.queue.filter(c => c.state === 'wait');
export const levelNow = run => difficulty(Math.max(0, run.spawned - 1)).level;

function emit(run, type, data = {}) { run.events.push({type, ...data}); }
function hurt(c, amount) { c.p = Math.max(0, c.p - amount); }
function strike(run, reason, c) {
  run.strikes++; run.strikeLog.push({reason, name: c.name});
  emit(run, 'strike', {reason, customer: c.n, strikes: run.strikes});
  if (run.strikes >= STRIKES) { run.phase = 'over'; emit(run, 'over'); }
}

export function turn(run, side) {
  if (run.phase !== 'scan') return false;
  run.face = side === 'right' ? (run.face + 3) % 4 : (run.face + 1) % 4;
  return true;
}

export function peel(run) {
  const it = currentItem(run);
  if (run.phase !== 'scan' || !it?.sticker || it.peeled) return 0;
  it.peeled = true;
  frontCustomer(run).p = Math.min(1, frontCustomer(run).p + .05);
  emit(run, 'peel', {amount: it.sticker});
  return it.sticker;
}

export function scan(run) {
  if (run.phase !== 'scan') return false;
  const c = frontCustomer(run), it = currentItem(run);
  if (run.fever > 0 && it.sticker && !it.peeled) { it.peeled = true; emit(run, 'peel', {amount: it.sticker, auto: true}); }
  if (run.face !== 0 && run.fever <= 0) {
    run.combo = 0; run.charge = Math.max(0, run.charge - 3); hurt(c, PENALTY.wrongScan);
    emit(run, 'wrong');
    return false;
  }
  it.scanned = true;
  const price = goods[it.id].price;
  run.combo++; run.bestCombo = Math.max(run.bestCombo, run.combo);
  c.p = Math.min(1, c.p + COMBO_BONUS * Math.min(run.combo, 6) / 3);
  if (it.sticker && !it.peeled) {
    run.total += price;                       // 多收了：顾客当场炸毛，耐心大跌、不给小费
    hurt(c, PENALTY.overcharge); c.noTip = true;
    emit(run, 'overcharge', {amount: it.sticker});
  } else {
    run.total += price - it.sticker;
    if (it.sticker) c.saved += it.sticker;
  }
  const fever = run.fever > 0;
  if (fever) { run.gmv += FEVER_COIN; run.feverCoins += FEVER_COIN; }
  emit(run, 'scan', {combo: run.combo, price, fever, id: it.id});
  if (!fever && ++run.charge >= FEVER_NEED) { run.charge = 0; run.fever = FEVER_TIME; run.fevers++; emit(run, 'fever');
    for (let k = 0; k < 3; k++) makeCustomer(run, true); }   // 闪购开抢：一波顾客涌进来，全是小单
  run.item++;
  if (run.item >= c.items.length) {
    run.phase = 'pay'; run.taken = 0; emit(run, 'bagged');
    if (run.fever > 0) settle(run);          // 爆单时间：顾客手机一扫秒付款
  } else run.face = run.fever > 0 ? 0 : c.items[run.item].face;
  return true;
}

export function payCard(run) {
  const c = frontCustomer(run);
  if (run.phase !== 'pay' || c.bill) return false;
  return settle(run);
}

// 点一张钱：凑到正好自动结账；超了算找错，清零重凑
export function giveChange(run, value) {
  const c = frontCustomer(run);
  if (run.phase !== 'pay' || !c.bill) return 'no';
  run.taken += value;
  const due = changeDue(run);
  if (run.taken === due) return settle(run) ? 'done' : 'no';
  if (run.taken > due) {
    run.taken = 0; run.combo = 0; run.charge = Math.max(0, run.charge - 3); hurt(c, PENALTY.wrongChange);
    emit(run, 'wrongChange'); return 'over';
  }
  return 'more';
}

function settle(run) {
  const c = frontCustomer(run);
  const mood = moodOf(c.p);
  if (mood === 0) {
    leaveFront(run, c);
    return false;
  }
  const rush = run.fever > 0;
  c.paid = run.total;
  c.tip = c.noTip ? 0 : Math.round(c.paid * (TIP[mood] ?? 0) * (rush ? 2 : 1));
  c.hearts = mood;
  c.state = 'done';
  run.gmv += c.paid + c.tip; run.tips += c.tip; run.saved += c.saved; run.served++;
  if (mood === 3) run.happy++;
  emit(run, 'settle', {customer: c.n, mood, paid: c.paid, tip: c.tip, saved: c.saved, rush, gmv: run.gmv});
  while (run.milestone < MILESTONES.length && run.gmv >= MILESTONES[run.milestone]) {
    const heal = run.strikes > 0; if (heal) run.strikes--;
    emit(run, 'milestone', {value: MILESTONES[run.milestone], heal}); run.milestone++;
  }
  callNext(run);
  return true;
}

function callNext(run) {
  run.item = 0; run.total = 0; run.taken = 0;
  const next = run.queue.findIndex(c => c.state === 'wait');
  if (next < 0) { run.front = -1; run.phase = 'idle'; return; }
  run.front = next;
  const c = run.queue[next];
  c.state = 'front'; run.phase = 'scan'; run.face = run.fever > 0 ? 0 : c.items[0].face;
  emit(run, 'next', {customer: c.n, vip: c.vip});
}

function leaveFront(run, customer) {
  customer.state = 'left';
  run.combo = 0;
  emit(run, 'leave', {customer: customer.n, waiting: false});
  strike(run, '结账太慢走了', customer);
  if (run.phase !== 'over') callNext(run);
}

export function tick(run, dt) {
  if (run.phase === 'over') return;
  run.time += dt;
  run.nextArrival -= dt;
  if (run.nextArrival <= 0) {
    makeCustomer(run);
    const d = difficulty(run.spawned);
    run.nextArrival = d.arrival * (.8 + run.rng() * .4);
  }
  if (run.fever > 0) {
    run.fever -= dt;
    if (run.fever <= 0) { run.fever = 0; emit(run, 'feverEnd'); }
    if (run.phase === 'idle') callNext(run);
    return;                                   // 爆单时间里大家都在兴头上，耐心不掉
  }
  if (run.phase === 'idle') callNext(run);
  for (const c of run.queue) {
    if (c.state === 'front') c.p = Math.max(0, c.p - c.drain * dt);
    else if (c.state === 'wait') {
      c.p = Math.max(0, c.p - c.drain * WAIT_FACTOR * dt);
      if (c.p <= 0) {
        c.state = 'left'; emit(run, 'leave', {customer: c.n, waiting: true});
        strike(run, '排队太久走了', c); if (run.phase === 'over') return;
      }
    }
  }
  const c = frontCustomer(run);
  if (c && c.p <= 0) leaveFront(run, c);
}
