// node combos.mjs —— 列出每夜的 3 套三星搭配：单品、原价合计、用券后到手价、是否要抢闪购。
import {CATS, NIGHTS, buildNight, starOutfits, totals} from './rules.js';

for (let i = 0; i < NIGHTS.length; i++) {
  const night = buildNight(i);
  console.log(`第${i + 1}夜 ${night.place}（${night.vibe}+${night.tone}色，预算 ¥${night.budget}）`);
  for (const o of starOutfits(night)) {
    const bag = Object.fromEntries(o.items.map(it => [it.cat, {item: it, paid: it.price}]));
    const t = totals(night, bag);
    console.log(`   ${o.name}：${o.items.map(it => `${it.name}¥${it.price}`).join(' + ')} → 到手 ¥${t.pay}${o.free ? '' : '（要抢闪购）'}`);
  }
}
