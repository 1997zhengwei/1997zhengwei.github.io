
import { artifacts, magnetRadius, maxDepth, slots, vaultBonus, vaultId, vaultKind } from './rules.js';

export const upgrades = [
  { id: 'capacity', values: Array.from({ length: slots.length - 3 }, (_, index) => index + 4), prices: [36, 75, 128, 210, 310, 465, 680, 970, 1350, 1850], suffix: ' 件' },
  {
    id: 'depth',
    // Keep the original prices to recover cumulative wealth from older saves.
    retired: true,
    values: [24, 29, 34, 38, 42, 48, 55, 62, 70, 79, 88, 98, 109, 122, 136, 150, 175, 205, 240, 280, 325, 380, 440, maxDepth],
    prices: [44, 88, 148, 235, 320, 430, 590, 770, 1000, 1300, 1660, 2070, 2600, 3350, 4480, 5200, 6800, 8900, 11500, 15300, 19600, 25000, 33000],
    suffix: ' m',
  },
  { id: 'field', values: [magnetRadius, 1.34, 1.49, 1.64, 1.79, 1.94, 2.09, 2.24], prices: [72, 144, 260, 440, 716, 1120, 1640], suffix: ' m', precision: 1 },
  { id: 'guard', values: [0, 1, 2, 3], prices: [124, 440, 1240], suffix: ' 次/钩' },
  { id: 'beacon', values: [0, 3, 6, 11, 18, 27, 40, 54, 70, 92, 115], prices: [52, 105, 164, 246, 365, 530, 756, 1050, 1490, 2050], suffix: '/分' },
];

export const wealthRanks = [
  { name: '湾港新手', coins: 0 },
  { name: '码头船东', coins: 2500 },
  { name: '商会名人', coins: 12500 },
  { name: '深海船王', coins: 50000 },
  { name: '海湾富豪', coins: 180000 },
  { name: '大洋巨富', coins: 320000 },
];

export const rankIndex = fortune => wealthRanks.findLastIndex(rank => fortune >= rank.coins);

const saveKey = 'wreck-and-reel-v1';
const maxAway = 4 * 60 * 60 * 1000;
const validItems = new Set(artifacts.map(({ id }) => id));
const integer = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;

export function upgradeValue(record, id) {
  const definition = upgrades.find(entry => entry.id === id);
  return definition.values[record.levels[id]];
}

export function normalizeProgress(raw, now) {
  const levels = Object.fromEntries(upgrades.map(def => [def.id, Math.min(integer(raw?.levels?.[def.id]), def.values.length - 1)]));
  const best = integer(raw?.best);
  const wallet = raw?.wallet === undefined ? best : integer(raw.wallet);
  const spent = upgrades.reduce((total, def) => total + def.prices.slice(0, levels[def.id]).reduce((sum, cost) => sum + cost, 0), 0);
  return {
    best,
    wallet,
    fortune: Math.max(integer(raw?.fortune), wallet + spent),
    levels,
    discoveries: [...new Set(Array.isArray(raw?.discoveries) ? raw.discoveries.filter(id => validItems.has(id)) : [])],
    deepest: Math.min(maxDepth, integer(raw?.deepest)),
    order: {
      index: integer(raw?.order?.index),
      done: integer(raw?.order?.done),
      limit: Math.min(maxDepth, Math.max(24, integer(raw?.order?.limit))),
    },
    updatedAt: raw?.updatedAt > 0 && raw.updatedAt <= now ? raw.updatedAt : now,
    carry: Number.isFinite(raw?.carry) && raw.carry >= 0 && raw.carry < 1 ? raw.carry : 0,
  };
}

export function commission(record) {
  const { index, done, limit } = record.order;
  const scale = Math.min(14, Math.floor((limit - 24) / 14));
  const bonus = 72 + scale * 55 + (index % 4) * 12;
  if (index % 3 === 1) {
    return { name: '商船补给', hint: '入舱金币', kind: 'value', goal: 104 + scale * 70, done, bonus };
  }
  if (index % 3 === 2) {
    const depth = Math.max(12, Math.floor(limit * .65));
    return { name: '深水回收', hint: depth + 'm 以下的藏品', kind: 'depth', depth, goal: 3 + Math.floor(scale / 2), done, bonus };
  }
  return { name: '码头订单', hint: '带回宝物', kind: 'count', goal: 6 + scale, done, bonus };
}

export function recordDescent(record, depth) {
  record.deepest = Math.max(record.deepest, depth);
  if (depth !== maxDepth || record.discoveries.includes(vaultId)) return false;
  record.discoveries.push(vaultId);
  const reward = vaultBonus + artifacts[vaultKind].value;
  record.wallet += reward;
  record.fortune += reward;
  return true;
}

export function recordHaul(record, cargo, value, streakScore) {
  const previousRank = rankIndex(record.fortune);
  const ids = cargo.map(item => artifacts[item.kind].id);
  record.discoveries = [...new Set([...record.discoveries, ...ids])];
  record.best = Math.max(record.best, streakScore);
  const order = commission(record);
  const count = order.kind === 'value' ? value :
    order.kind === 'depth' ? cargo.filter(item => item.d >= order.depth).length : cargo.length;
  record.order.done += count;
  const bonus = record.order.done >= order.goal ? order.bonus : 0;
  if (bonus) record.order = { index: record.order.index + 1, done: 0, limit: maxDepth };
  const income = value + bonus;
  record.wallet += income;
  record.fortune += income;
  const rank = rankIndex(record.fortune);
  return { bonus, newRank: rank > previousRank ? wealthRanks[rank].name : '' };
}

export function gainIncome(record, now) {
  const rate = upgradeValue(record, 'beacon');
  const elapsed = Math.min(maxAway, Math.max(0, now - record.updatedAt));
  const coins = record.carry + elapsed * rate / 60000;
  const paid = Math.floor(coins);
  record.wallet += paid;
  record.fortune += paid;
  record.carry = coins - paid;
  record.updatedAt = now;
  return paid;
}

export function purchaseUpgrade(record, id) {
  const def = upgrades.find(entry => entry.id === id);
  if (!def || def.retired) return false;
  const level = record.levels[id];
  const price = def.prices[level];
  if (price === undefined || record.wallet < price) return false;
  record.wallet -= price;
  record.levels[id]++;
  return true;
}

export function createLedger() {
  let memory;

  function read() {
    try {
      const stored = localStorage.getItem(saveKey);
      if (stored) {
        memory = normalizeProgress(JSON.parse(stored), Date.now());
        return memory;
      }
    } catch {
      // Fall back to the last valid in-session copy.
    }
    return memory ??= normalizeProgress(undefined, Date.now());
  }

  function change(mutate) {
    function apply() {
      const record = read();
      const paid = gainIncome(record, Date.now());
      const outcome = mutate?.(record);
      memory = record;
      try {
        localStorage.setItem(saveKey, JSON.stringify(record));
      } catch {
        // The in-session copy remains usable if storage is disabled.
      }
      return { record, paid, outcome };
    }
    if (!navigator.locks) return Promise.resolve(apply());
    let started = false;
    return navigator.locks.request(saveKey, () => {
      started = true;
      return apply();
    }).catch(error => {
      if (started) throw error;
      return apply();
    });
  }

  return { read, change };
}
