// 纯规则：商品目录、每夜关卡、闪购/抢货市场、满减与计分。浏览器和 node 共用（node sim.mjs 跑机器人）。

export const CATS = ['clothes', 'shoes', 'bag'];
export const CAT_LABEL = {clothes: '衣服', shoes: '鞋子', bag: '包包'};
export const TONES = {粉: '#f2679f', 紫: '#9b6ee0', 绿: '#22a988', 蓝: '#3f8fe6', 红: '#dd3a50'};

const C = (id, name, vibe, tone, type, color, detail) => ({id, name, vibe, tone, type, color, detail});
export const CATALOG = {
  clothes: [
    C('petal', '蔷薇裙', '甜美', '粉', 'dress', '#ed498d', '#ff95bd'),
    C('berry', '莓果茶会裙', '甜美', '红', 'dress', '#b8304f', '#ffd5cd'),
    C('candy', '棉花糖裙', '甜美', '蓝', 'dress', '#7fbcec', '#fff3fb'),
    C('grape', '葡萄泡泡裙', '甜美', '紫', 'dress', '#a35bd0', '#f5ddff'),
    C('plum', '青梅小裙', '甜美', '绿', 'dress', '#5fbf8f', '#f4ffe9'),
    C('luna', '星缎礼服', '闪耀', '紫', 'gown', '#7043c0', '#ebcaff'),
    C('opera', '翡翠晚礼服', '闪耀', '绿', 'gown', '#008b85', '#7debd7'),
    C('rose', '玫瑰缎礼服', '闪耀', '粉', 'gown', '#e65aa0', '#ffd6ec'),
    C('sapphire', '蓝宝石礼服', '闪耀', '蓝', 'gown', '#2f4fb8', '#bcd3ff'),
    C('ruby', '红宝石礼服', '闪耀', '红', 'gown', '#c0203f', '#ffc9d2'),
    C('mint', '薄荷街装', '活力', '绿', 'street', '#36b79f', '#eee7fa'),
    C('sakura', '樱花卫衣', '活力', '粉', 'street', '#f27bb0', '#fff3c4'),
    C('lilac', '丁香运动装', '活力', '紫', 'street', '#9a7be0', '#fff1c9'),
    C('riviera', '海滨条纹裙', '活力', '红', 'stripe', '#d83246', '#fff4df'),
    C('sky', '晴空条纹裙', '活力', '蓝', 'stripe', '#3d8fe0', '#ffffff'),
  ],
  shoes: [
    C('bow', '蝴蝶结鞋', '甜美', '粉', 'pumps', '#e95b91', '#fff1f6'),
    C('cherry', '樱桃单鞋', '甜美', '红', 'pumps', '#d6334f', '#ffe9ee'),
    C('lav', '薰衣草单鞋', '甜美', '紫', 'pumps', '#b98be6', '#fff4ff'),
    C('cloud', '云朵单鞋', '甜美', '蓝', 'pumps', '#8cc6f2', '#ffffff'),
    C('matcha', '抹茶单鞋', '甜美', '绿', 'pumps', '#7cc79a', '#fffbe8'),
    C('star', '银星短靴', '闪耀', '紫', 'boots', '#a98ae6', '#fcdb8d'),
    C('jade', '翡翠短靴', '闪耀', '绿', 'boots', '#1aa58f', '#fcdb8d'),
    C('ice', '冰蓝高靴', '闪耀', '蓝', 'boots', '#5e9cf0', '#e9f3ff'),
    C('flame', '玫瑰短靴', '闪耀', '粉', 'boots', '#ec6aa6', '#ffe1a6'),
    C('garnet', '石榴短靴', '闪耀', '红', 'boots', '#b52240', '#fcdb8d'),
    C('kick', '糖霜球鞋', '活力', '蓝', 'sneakers', '#53b8e8', '#fff6e9'),
    C('limekick', '青柠跑鞋', '活力', '绿', 'sneakers', '#7ccf68', '#ffffff'),
    C('pinkkick', '草莓球鞋', '活力', '粉', 'sneakers', '#f58ab9', '#ffffff'),
    C('cherrykick', '樱桃球鞋', '活力', '红', 'sneakers', '#e0384f', '#ffffff'),
    C('grapekick', '葡萄球鞋', '活力', '紫', 'sneakers', '#9d7ee6', '#fff6e9'),
  ],
  bag: [
    C('peach', '蜜桃小包', '甜美', '粉', 'mini', '#fc8fae', '#bc4e69'),
    C('berrybag', '莓果小包', '甜美', '红', 'mini', '#c93a5a', '#ffd9df'),
    C('lilacbag', '丁香小包', '甜美', '紫', 'mini', '#b48ae8', '#fff0ff'),
    C('cloudbag', '云朵小包', '甜美', '蓝', 'mini', '#8ec9f0', '#ffffff'),
    C('matchabag', '抹茶小包', '甜美', '绿', 'mini', '#86cc9c', '#fffbe8'),
    C('moon', '月光手包', '闪耀', '紫', 'clutch', '#8f6ad8', '#ffe5a4'),
    C('emerald', '祖母绿手包', '闪耀', '绿', 'clutch', '#0f8f7e', '#ffe5a4'),
    C('pearl', '玫瑰手包', '闪耀', '粉', 'clutch', '#ea5c9f', '#ffe5a4'),
    C('ocean', '星海手包', '闪耀', '蓝', 'clutch', '#3b63c9', '#ffe5a4'),
    C('lime', '青柠运动包', '活力', '绿', 'satchel', '#7ccf68', '#456d5f'),
    C('sea', '海盐斜挎包', '活力', '蓝', 'satchel', '#4aa3e0', '#24507a'),
    C('cola', '可乐斜挎包', '活力', '红', 'satchel', '#d8323f', '#5a1f2a'),
    C('taro', '香芋斜挎包', '活力', '紫', 'satchel', '#a184e0', '#4b3477'),
  ],
};

// 每夜：主题（风格+颜色）、限时、预算、优惠券、价格系数、抢货频率、库存范围、闪购节奏。
// 前 4 夜：主题款原价 + 优惠券就买得起（闪购是额外奖励），mercy=对手前 60% 时间不抢光你还没拿的主题款。
// 第 5 夜起才需要等闪购或取舍。
export const NIGHTS = [
  {place: '闺蜜下午茶', vibe: '甜美', tone: '粉', time: 45, budget: 100, coupon: {kind: 'over', at: 90, off: 30}, mul: .8, steal: 9, stock: [3, 3], flashGap: 3.2, flashLen: 5.5, mercy: true},
  {place: '海边音乐节', vibe: '活力', tone: '蓝', time: 45, budget: 100, coupon: {kind: 'pair', rate: .5}, mul: .78, steal: 7.5, stock: [2, 3], flashGap: 3.2, flashLen: 5.5, mercy: true},
  {place: '星光首映夜', vibe: '闪耀', tone: '紫', time: 45, budget: 100, coupon: {kind: 'over', at: 100, off: 25}, mul: .84, steal: 6.5, stock: [2, 3], flashGap: 3.4, flashLen: 5, mercy: true},
  {place: '草莓派对', vibe: '甜美', tone: '红', time: 42, budget: 100, coupon: {kind: 'set', rate: .8}, mul: .92, steal: 5.6, stock: [2, 3], flashGap: 3.4, flashLen: 5, mercy: true},
  {place: '校园运动会', vibe: '活力', tone: '红', time: 42, budget: 100, coupon: {kind: 'second', rate: .5}, mul: .9, steal: 5.2, stock: [2, 3], flashGap: 3.3, flashLen: 5},
  {place: '春日野餐', vibe: '活力', tone: '绿', time: 40, budget: 90, coupon: {kind: 'over', at: 80, off: 20}, mul: .9, steal: 4.8, stock: [1, 3], flashGap: 3.2, flashLen: 4.5},
  {place: '冰雪舞会', vibe: '闪耀', tone: '蓝', time: 40, budget: 100, coupon: {kind: 'over', at: 110, off: 30}, mul: .99, steal: 4.3, stock: [1, 2], flashGap: 3, flashLen: 4.5},
  {place: '樱花约会', vibe: '甜美', tone: '绿', time: 38, budget: 100, coupon: {kind: 'second', rate: .5}, mul: .92, steal: 4.1, stock: [1, 2], flashGap: 3, flashLen: 4.5},
  {place: '薰衣草婚礼', vibe: '甜美', tone: '紫', time: 38, budget: 100, coupon: {kind: 'set', rate: .8}, mul: .95, steal: 3.9, stock: [1, 2], flashGap: 3, flashLen: 4},
  {place: '黑五压轴大秀', vibe: '闪耀', tone: '粉', time: 36, budget: 100, coupon: {kind: 'over', at: 120, off: 35}, mul: 1.06, steal: 3.5, stock: [1, 2], flashGap: 2.8, flashLen: 4},
];

export const RIVALS = ['莉亚', '诺拉'];
const TIERS = {
  clothes: {perfect: [62, 70], vibe: [50, 56], tone: [42, 48], plain: [32, 38]},
  shoes: {perfect: [32, 36], vibe: [26, 29], tone: [22, 25], plain: [16, 19]},
  bag: {perfect: [27, 31], vibe: [21, 24], tone: [18, 20], plain: [13, 16]},
};
export const FLASH_RATE = .5;

export function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (Math.imul(1664525, value) + 1013904223) >>> 0) / 4294967296);
}
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
export function kindOf(item, night) {
  const v = item.vibe === night.vibe, t = item.tone === night.tone;
  return v && t ? 'perfect' : v ? 'vibe' : t ? 'tone' : 'plain';
}

// 同一夜的货架固定（可以记住），闪购和抢货每局随机。
export function buildNight(index) {
  const spec = NIGHTS[index];
  const rng = seeded(4242 + index * 977);
  const night = {...spec, index, rows: {}};
  for (const cat of CATS) {
    const pool = CATALOG[cat];
    const used = new Set();
    const row = [];
    for (const kind of ['perfect', 'vibe', 'tone', 'plain']) {
      let options = pool.filter(item => !used.has(item.id) && kindOf(item, spec) === kind);
      if (!options.length) options = pool.filter(item => !used.has(item.id) && kindOf(item, spec) !== 'perfect');
      const base = pick(options, rng);
      used.add(base.id);
      const [lo, hi] = TIERS[cat][kindOf(base, spec)];
      const price = Math.round((lo + rng() * (hi - lo)) * spec.mul);
      row.push({...base, cat, kind: kindOf(base, spec), price, flashPrice: Math.round(price * FLASH_RATE), stock: 0});
    }
    night.rows[cat] = shuffle(row, rng);
  }
  return night;
}

export function couponText(coupon) {
  if (coupon.kind === 'over') return `满${coupon.at}减${coupon.off}`;
  if (coupon.kind === 'pair') return `鞋+包同买 包${coupon.rate * 10}折`;
  if (coupon.kind === 'second') return '第二贵的一件半价';
  return `凑齐3件 打${coupon.rate * 10}折`;
}

// bag = {clothes:{item,paid,flash}, ...}
export function totals(night, bag) {
  const entries = CATS.map(c => bag[c]).filter(Boolean);
  const original = entries.reduce((s, e) => s + e.item.price, 0);
  const subtotal = entries.reduce((s, e) => s + e.paid, 0);
  const c = night.coupon;
  let off = 0, hint = '';
  if (c.kind === 'over') {
    if (subtotal >= c.at) off = c.off;
    else hint = entries.length ? `再凑 ¥${c.at - subtotal} 立减 ${c.off}` : `满 ${c.at} 立减 ${c.off}`;
  } else if (c.kind === 'second') {
    if (entries.length >= 2) off = Math.round([...entries].sort((a, b) => b.paid - a.paid)[1].paid * (1 - c.rate));
    else hint = '再拿一件，第二贵的那件半价';
  } else if (c.kind === 'pair') {
    if (bag.shoes && bag.bag) off = Math.round(bag.bag.paid * (1 - c.rate));
    else hint = '鞋和包一起买，包半价';
  } else {
    if (entries.length === 3) off = Math.round(subtotal * (1 - c.rate));
    else hint = `再拿 ${3 - entries.length} 件全单8折`;
  }
  const pay = subtotal - off;
  return {count: entries.length, original, subtotal, flashSaved: original - subtotal, off, pay, saved: original - pay, hint, ok: !!bag.clothes && pay <= night.budget};
}

export function stylePoints(night, bag) {
  let points = 0, count = 0;
  for (const c of CATS) {
    const e = bag[c];
    if (!e) continue;
    count++;
    if (e.item.vibe === night.vibe) points += 12;
    if (e.item.tone === night.tone) points += 6;
  }
  return points + (count === 3 ? 6 : 0);
}

// 满分 100：造型 60（每件风格 12 + 颜色 6，凑齐 3 件 +6）、省钱 25、手速 15。走秀是自动演出，不计分。
// 星级：结账成功 1 星；分数到 STAR2 2 星；穿上本夜任意一套「三星搭配」3 星。分数另外用来比排行、刷纪录。
export const STAR2 = 60;
export function scoreRun(night, bag, left) {
  const t = totals(night, bag);
  const style = stylePoints(night, bag);
  const save = Math.min(25, Math.round(t.saved / 2));
  const speed = Math.min(15, Math.floor(Math.max(0, left) / 2.5));
  const total = style + save + speed;
  const outfit = t.ok ? outfitIndex(night, bag) : -1;
  const stars = !t.ok ? 0 : outfit >= 0 ? 3 : total >= STAR2 ? 2 : 1;
  return {style, save, speed, total, stars, outfit, totals: t};
}

// ——三星搭配：每夜 3 套。全套主题款必有；另两套是「两件主题 + 一件同风格」，
// 优先挑原价就买得起的，保证每夜至少一套不靠闪购也能三星；买不起的标「要抢闪购」。——
const PATTERNS = {
  ppp: {name: n => `${n.vibe}${n.tone}·全套`, hint: '衣、鞋、包都是主题款'},
  ppv: {name: (n, it) => `${it[2].name}点睛`, hint: '主题衣 + 主题鞋 + 同风格包'},
  pvp: {name: (n, it) => `${it[1].name}混搭`, hint: '主题衣 + 同风格鞋 + 主题包'},
  vpp: {name: (n, it) => `${it[0].name}换装`, hint: '同风格衣 + 主题鞋 + 主题包'},
};
const CODE = {p: 'perfect', v: 'vibe'};
const outfitCache = new Map();
export function starOutfits(night) {
  const key = night.index;
  if (outfitCache.has(key)) return outfitCache.get(key);
  const list = [];
  for (const pat of Object.keys(PATTERNS)) {
    const items = CATS.map((c, i) => night.rows[c].find(it => it.kind === CODE[pat[i]]));
    if (items.some(x => !x)) continue;
    const bag = Object.fromEntries(items.map(it => [it.cat, {item: it, paid: it.price}]));
    const free = totals(night, bag).ok;
    let reachable = free;
    for (let f = 0; f < 3 && !reachable; f++) reachable = totals(night, {...bag, [items[f].cat]: {item: items[f], paid: items[f].flashPrice}}).ok;
    if (reachable) list.push({pat, items, free, name: PATTERNS[pat].name(night, items), hint: PATTERNS[pat].hint + (free ? '' : '（要抢闪购）')});
  }
  const full = list.filter(o => o.pat === 'ppp');
  const rest = list.filter(o => o.pat !== 'ppp');
  const shift = night.index % Math.max(1, rest.length);
  const rotated = [...rest.slice(shift), ...rest.slice(0, shift)].sort((a, b) => b.free - a.free);
  let chosen = [...full, ...rotated].slice(0, 3);
  if (!chosen.some(o => o.free)) {
    const free = list.find(o => o.free);
    if (free) chosen = [...chosen.slice(0, 2), free];
  }
  outfitCache.set(key, chosen);
  return chosen;
}
export function outfitIndex(night, bag) {
  if (!CATS.every(c => bag[c])) return -1;
  return starOutfits(night).findIndex(o => o.items.every(it => bag[it.cat].item.id === it.id));
}

// 市场：闪购轮换 + 对手抢货。tick 返回事件，给界面和机器人共用。
export function createMarket(night, rng = Math.random) {
  const items = CATS.flatMap(c => night.rows[c].map(item => ({...item})));
  for (const item of items) item.stock = night.stock[0] + Math.floor(rng() * (night.stock[1] - night.stock[0] + 1));
  const m = {
    night, items, t: 0, flash: null, lastFlash: null,
    nextFlash: 2.2, nextSteal: 2.5 + night.steal * .6,
    byId: Object.fromEntries(items.map(i => [i.id, i])),
  };
  const weight = (item, table) => table[item.kind];
  function choose(list, w) {
    const total = list.reduce((s, i) => s + w(i), 0);
    let r = rng() * total;
    for (const i of list) if ((r -= w(i)) <= 0) return i;
    return list[list.length - 1];
  }
  m.left = () => night.time - m.t;
  m.endFlash = () => {
    if (!m.flash) return;
    m.lastFlash = m.flash.item;
    m.flash = null;
    m.nextFlash = m.t + night.flashGap * (m.left() < 10 ? .45 : 1) * (.75 + rng() * .5);
  };
  m.tick = (dt, bag) => {
    const events = [];
    m.t += dt;
    const owned = new Set(CATS.map(c => bag[c]?.item.id).filter(Boolean));
    if (m.flash && m.t >= m.flash.until) {
      events.push({type: 'flashEnd', item: m.flash.item});
      m.endFlash();
    }
    if (!m.flash && m.t >= m.nextFlash && m.left() > 1.2) {
      const options = items.filter(i => i.stock > 0 && !owned.has(i.id) && i !== m.lastFlash);
      if (options.length) {
        const missing = new Set(CATS.filter(c => !bag[c]));
        const item = choose(options, i => weight(i, {perfect: 3, vibe: 2, tone: 1.5, plain: 1}) * (missing.has(i.cat) ? 1.4 : 1));
        const len = Math.min(night.flashLen, m.left() - .4);
        m.flash = {item, start: m.t, until: m.t + len, len};
        events.push({type: 'flash', item});
      }
    }
    if (m.t >= m.nextSteal) {
      const early = night.mercy && m.t < night.time * .6;
      const options = items.filter(i => i.stock > 0 && !(early && i.kind === 'perfect' && i.stock <= 1 && !bag[i.cat]));
      if (options.length) {
        const item = choose(options, i => weight(i, {perfect: 4, vibe: 2, tone: 2, plain: 1}) * (owned.has(i.id) ? .4 : 1));
        item.stock--;
        const who = Math.floor(rng() * RIVALS.length);
        events.push({type: 'steal', item, who, rival: RIVALS[who], soldOut: item.stock === 0});
        if (item.stock === 0 && m.flash?.item === item) {
          events.push({type: 'flashEnd', item});
          m.endFlash();
        }
      }
      const pace = m.left() < 10 ? .75 : 1;
      m.nextSteal = m.t + night.steal * pace * (.7 + rng() * .6);
    }
    return events;
  };
  return m;
}

// 玩家拿货：同类换款时旧款放回货架。返回 null 表示拿不到。
export function take(m, bag, item) {
  if (bag[item.cat]?.item === item || item.stock <= 0) return null;
  const prev = bag[item.cat] || null;
  if (prev) prev.item.stock++;
  item.stock--;
  const flash = m.flash?.item === item;
  const entry = {item, paid: flash ? item.flashPrice : item.price, flash};
  bag[item.cat] = entry;
  if (flash) m.endFlash();
  return {entry, prev};
}
export function putBack(bag, cat) {
  const entry = bag[cat];
  if (!entry) return null;
  entry.item.stock++;
  delete bag[cat];
  return entry;
}
