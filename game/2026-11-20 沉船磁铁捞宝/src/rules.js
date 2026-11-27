
export const recordCasts = 3;
export const xEdge = 7.55;
export const maxDepth = 500;
export const vaultId = 'abyssVault';
export const vaultBonus = 24000;
export const vaultSite = { x: .94, d: maxDepth - .55 };
export const vaultRevealSeconds = 2;
export const magnetRadius = 1.19;
const aimStart = [.04, .23, .42, .61, .80];

export const zones = [
  { start: 0, name: '晴帆湾' },
  { start: 24, name: '古船水道' },
  { start: 52, name: '灯珊礁' },
  { start: 81, name: '沉钟遗迹' },
  { start: 115, name: '月光裂谷' },
  { start: 151, name: '海蚀拱廊' },
  { start: 218, name: '黑潮钟城' },
  { start: 302, name: '星砂深谷' },
  { start: 402, name: '沉海王庭' },
];

export const zoneAt = depth => zones.findLast(zone => depth >= zone.start) ?? zones[0];

export const artifacts = [
  { id: 'key', name: '锈钥匙', glyph: '🔑', value: 12, hue: '#c8bb91', radius: .37 },
  { id: 'gear', name: '旧齿轮', glyph: '⚙', value: 14, hue: '#d7a679', radius: .41 },
  { id: 'wheel', name: '铜舵轮', glyph: '✻', value: 22, hue: '#f0ae68', radius: .47 },
  { id: 'bell', name: '航海钟', glyph: '♧', value: 30, hue: '#ffe095', radius: .46 },
  { id: 'cup', name: '船长银杯', glyph: '♜', value: 52, hue: '#c8f5ff', radius: .46 },
  { id: 'watch', name: '宝石怀表', glyph: '✦', value: 72, hue: '#ffbc85', radius: .45 },
  { id: 'chest', name: '珊瑚宝匣', glyph: '◆', value: 100, hue: '#ffb4d2', radius: .54 },
  { id: 'seal', name: '潮纹印章', glyph: '❖', value: 78, hue: '#c3c3fc', radius: .39 },
  { id: 'sextant', name: '铜质六分仪', glyph: '✣', value: 111, hue: '#ffd4a1', radius: .46 },
  { id: 'lamp', name: '珊瑚航灯', glyph: '✺', value: 138, hue: '#ffd3e3', radius: .44 },
  { id: 'amulet', name: '碧海护符', glyph: '◈', value: 172, hue: '#a7efdc', radius: .40 },
  { id: 'anchor', name: '银月短锚', glyph: '⚓', value: 192, hue: '#bddcfb', radius: .50 },
  { id: 'crown', name: '潮汐冠冕', glyph: '♛', value: 237, hue: '#ffdc9e', radius: .54 },
  { id: 'clock', name: '星砂怀表', glyph: '✷', value: 285, hue: '#e2c8ff', radius: .48 },
  { id: 'kingKey', name: '裂谷王钥', glyph: '✶', value: 358, hue: '#fff3b1', radius: .51 },
  { id: 'coralHarp', name: '珊瑚竖琴', glyph: '♫', value: 510, hue: '#ffa8a6', radius: .48 },
  { id: 'tideCompass', name: '黑潮罗盘', glyph: '✥', value: 790, hue: '#bff4dc', radius: .49 },
  { id: 'prism', name: '星砂晶簇', glyph: '✧', value: 1180, hue: '#ddceff', radius: .47 },
  { id: 'regalia', name: '王庭权杖', glyph: '✵', value: 1760, hue: '#ffe4a2', radius: .51 },
  { id: vaultId, name: '深渊王匣', glyph: '✦', value: 6800, hue: '#ffdc78', radius: .71 },
];

export const vaultKind = artifacts.length - 1;

export const slots = [
  { x: -.26, fall: .66 },
  { x: .31, fall: .73 },
  { x: -.68, fall: 1.24 },
  { x: .68, fall: 1.31 },
  { x: -.05, fall: 1.53 },
  { x: -.89, fall: 1.90 },
  { x: .92, fall: 1.94 },
  { x: -.46, fall: 2.42 },
  { x: .45, fall: 2.47 },
  { x: -.87, fall: 2.90 },
  { x: .87, fall: 2.94 },
  { x: 0, fall: 3.03 },
  { x: -.49, fall: 3.49 },
  { x: .47, fall: 3.55 },
];

const wreckGaps = [
  { d: 13.6, spans: [[-6.1, -1.63], [.65, 3.25]] },
  { d: 29.3, spans: [[-4.72, -2.04], [.25, 4.75]] },
  { d: 47.8, spans: [[-6.44, -1.70], [.96, 3.65]] },
  { d: 63.4, spans: [[-4.86, -2.1], [-.24, 4.55]] },
  { d: 77.9, spans: [[-6.08, -1.54], [.77, 3.56]] },
  { d: 94.0, spans: [[-4.9, -2.17], [.08, 4.84]] },
  { d: 110.5, spans: [[-5.95, -1.31], [1.04, 3.95]] },
  { d: 128.1, spans: [[-4.1, -1.44], [.84, 5.44]] },
  { d: 142.6, spans: [[-6.23, -1.47], [.54, 3.24]] },
  { d: 173.4, spans: [[-4.20, -1.46], [.09, 4.71]] },
  { d: 211.9, spans: [[-6.13, -1.56], [.57, 3.37]] },
  { d: 252.6, spans: [[-4.79, -2.23], [.35, 4.89]], sway: .65 },
  { d: 287.2, spans: [[-6.38, -1.70], [.77, 3.51]], sway: .72 },
  { d: 332.5, spans: [[-5.03, -2.31], [-.03, 4.58]], sway: .85 },
  { d: 374.4, spans: [[-5.94, -1.42], [.76, 3.25]], sway: .90 },
  { d: 423.2, spans: [[-4.35, -1.48], [.30, 4.59]], sway: .93 },
  { d: 466.4, spans: [[-6.25, -1.89], [.63, 3.18]], sway: .96 },
  { d: 485.8, spans: [[-4.42, -1.82], [.56, 4.78]], sway: .97 },
];

function gateGeometry(d, gaps, sway) {
  return {
    d, gaps, sway,
    beams: [[-8.85, gaps[0][0]], [gaps[0][1], gaps[1][0]], [gaps[1][1], 8.85]],
  };
}

export function layoutFor(round) {
  const mirror = round % 2 ? -1 : 1;
  return wreckGaps.map(({ d, spans, sway = 0 }) => {
    const gaps = spans.map(([a, b]) => mirror < 0 ? [-b, -a] : [a, b]).sort((a, b) => a[0] - b[0]);
    return gateGeometry(d, gaps, sway);
  });
}

export function gateAt(gate, time) {
  if (!gate.sway) return gate;
  const offset = gate.sway * Math.sin(time * 1.28 + gate.d);
  return gateGeometry(gate.d, gate.gaps.map(([a, b]) => [a + offset, b + offset]), gate.sway);
}

export function nextSweetSpot(previous) {
  const options = aimStart.filter(start => start !== previous?.[0]);
  const start = options[Math.floor(Math.random() * options.length)];
  return [start, Math.round((start + .16) * 100) / 100];
}

export function castPower(phase) {
  return 1 - Math.abs(1 - (phase % 1) * 2);
}

export function castDepth(power, [start, end]) {
  const miss = Math.max(start - power, power - end, 0);
  const perfect = miss === 0;
  return { perfect, depth: perfect ? maxDepth : maxDepth - 2 - Math.round(miss * 60) };
}

export function reelSeconds(depth) {
  if (depth > 150) return reelSeconds(150) + (depth - 150) * .081;
  return 8.9 + depth * .063 + Math.max(0, depth - 42) * .075;
}

function rng(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function lootFor(round, cast) {
  const random = rng(1145179 + 8851 * round + 7109 * cast);
  const mirror = round % 2 ? -1 : 1;
  const shallow = [
    [4.3, [-4.05, -.15, 2.78, 6.17]],
    [7.4, [-6.14, -2.66, .6, 4.57]],
    [10.2, [-4.58, -1.75, 2.1, 6.64]],
    [15.4, [-5.44, -3.27, .2, 1.83, 5.82]],
    [17.7, [-6.21, -2.92, .35, 3.30, 6.3]],
    [20.9, [-5.0, -1.71, .25, 4.36]],
    [24.1, [-6.42, -3.35, .16, 3.1, 5.6]],
    [27.4, [-4.3, -1.82, 1.63, 6.1]],
    [31.15, [-5.75, -3.19, 1.26, 3.45, 6.6]],
    [33.9, [-6.48, -3.8, .2, 2.32, 6.33]],
    [36.6, [-4.49, -1.58, 1.44, 4.17]],
    [39.6, [-6.12, -2.53, .39, 3.31, 6.16]],
  ];
  const coastal = shallow.flatMap(([depth, lanes], row) => lanes.map((lane, i) => {
    const roll = random();
    let kind = roll < .49 ? 0 : roll < .84 ? 1 : 2;
    if (depth > 15 && roll > .73) kind = 3;
    if (depth > 23 && roll > .86) kind = 4;
    if (depth > 34 && roll > .91) kind = 5;
    if (row === 4 && i === 2) kind = 1;
    if (row === 3 && i === 3) kind = cast % 2 ? 5 : 4;
    if (row === 8 && i === 1) kind = cast % 2 ? 4 : 5;
    if (row === 11 && i === (cast + round) % lanes.length) kind = 6;
    const driftX = (random() - .5) * .59;
    const driftY = (random() - .5) * .83;
    return { x: mirror * (lane + driftX), d: depth + driftY, kind, spin: random() * 6.28 };
  }));
  const deep = [];
  const groups = [
    { from: 43.1, to: 52, rare: [7, 8] },
    { from: 53.8, to: 81, rare: [9, 10] },
    { from: 82.4, to: 115, rare: [11, 12] },
    { from: 117.2, to: 149.4, rare: [13, 14] },
  ];
  for (const { from, to, rare } of groups) {
    for (let depth = from, row = 0; depth < to; depth += 4.05, row++) {
      const lanes = [-6.18, -3.15, .08, 3.27, 6.05];
      const prizeLane = (row + cast + round) % lanes.length;
      for (let i = 0; i < lanes.length; i++) {
        const roll = random();
        const kind = i === prizeLane ? rare[row % 2] : roll > .82 ? rare[1] : roll > .44 ? rare[0] : 4 + (row + i) % 3;
        deep.push({
          x: mirror * (lanes[i] + (random() - .5) * 1.59),
          d: depth + (random() - .5) * 1.48,
          kind, spin: random() * 6.28,
        });
      }
    }
  }
  for (const [zoneIndex, zone] of zones.entries()) {
    if (zone.start <= 150) continue;
    const kind = zoneIndex + 10;
    const end = zones[zoneIndex + 1]?.start ?? maxDepth - 7;
    for (let d = zone.start + 3.1, row = 0; d < end; d += 7.2, row++) {
      const lanes = [-6.16, -3.08, 0, 3.16, 6.21];
      const rareLane = (row + cast + round + zoneIndex) % lanes.length;
      lanes.forEach((lane, i) => {
        const relic = i === rareLane || random() > .47 ? kind : kind - 1;
        deep.push({
          x: mirror * (lane + (random() - .5) * 1.22),
          d: d + (random() - .5) * 1.26,
          kind: relic, spin: random() * 6.28,
        });
      });
    }
  }
  return [...coastal, ...deep];
}

export function contactAt(gate, centerX, cargo) {
  if (!cargo.length) return -1;
  let worst = 0;
  let hit = -1;
  const clearance = (x, r) => Math.max(...gate.gaps.map(([a, b]) => Math.min(x - a, b - x) - r));
  const tool = clearance(centerX, .38);
  cargo.forEach(({ x, radius }, i) => {
    const pressure = Math.max(-clearance(x, radius), tool < 0 ? .08 + Math.abs(x - centerX) * .4 : 0);
    if (pressure > worst + .009) {
      worst = pressure;
      hit = i;
    }
  });
  return hit;
}
