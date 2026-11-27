// Shared geometry and serializable data. Kept independent of the renderer/rules
// so visual hulls, walking support, and migrated saves use the same coordinates.
export const WRECK = { x: -15.4, z: -13.2, angle: -.4, deck: .96 };
export const SAIL_BOUNDS = { left: -28, right: 25, top: -25, bottom: 18 };
export const VOYAGE_CYCLE = 220;
export function wreckPoint(x, z) {
  return { x: WRECK.x + x * Math.cos(WRECK.angle) + z * Math.sin(WRECK.angle), z: WRECK.z - x * Math.sin(WRECK.angle) + z * Math.cos(WRECK.angle) };
}
export function wreckLocal(x, z) {
  const dx = x - WRECK.x, dz = z - WRECK.z;
  return { x: dx * Math.cos(WRECK.angle) - dz * Math.sin(WRECK.angle), z: dx * Math.sin(WRECK.angle) + dz * Math.cos(WRECK.angle) };
}
export function wreckWidth(z) { return Math.abs(z) <= 2 ? 1.32 : Math.max(0, 1.32 - (Math.abs(z) - 2) * 1.15); }
export function wreckFloor(x, z) {
  const p = wreckLocal(x, z);
  return Math.abs(p.z) < 3 && Math.abs(p.x) < wreckWidth(p.z) ? WRECK.deck : -.95;
}
export const WRECK_OBSTACLES = [
  { x: -.93, z: -1.8, radius: .28 }, { x: .92, z: 1.45, radius: .26 }, { x: 0, z: -.7, radius: .19 },
];
export const WRECK_MOORING = wreckPoint(2.9, 1.1);
export const SALVAGE = [
  { id: 'drift', name: '外围漂流箱', x: -10.5, z: -9.9, cost: { metal: 2, wood: 5 }, lowOnly: false },
  { id: 'stern', name: '船尾物资桶', ...wreckPoint(-2.6, -2.3), cost: { metal: 2, fiber: 3 }, lowOnly: false },
  { id: 'hold', name: '低潮船舱', ...wreckPoint(0, 1.12), cost: { metal: 3, fiber: 3 }, lowOnly: true },
];
export function newVoyage() {
  return { started: false, clock: 0, goals: {}, boat: null, metalFound: 0, trips: 0, distance: 0,
    salvaged: [], readyAt: {}, lamp: false, warmer: false, charges: 0, warmCooldown: 0,
    completed: false, resultSeen: false };
}
export function readVoyage(raw, won, num, elapsed, frontier=false) {
  const v = newVoyage(); if (!won || !raw || typeof raw !== 'object') return v;
  v.started = Boolean(raw.started); v.clock = num(raw.clock, 0, 0, 1e8);
  for (const k of ['dock', 'boat', 'board', 'salvage', 'return', 'workbench', 'warmer']) v.goals[k] = Boolean(raw.goals?.[k]);
  v.metalFound = Math.floor(num(raw.metalFound, 0, 0, 1e6)); v.trips = Math.floor(num(raw.trips, 0, 0, 1e6)); v.distance = num(raw.distance, 0, 0, 1e8);
  v.salvaged = Array.isArray(raw.salvaged) ? SALVAGE.filter(p => raw.salvaged.includes(p.id)).map(p => p.id) : [];
  for (const p of SALVAGE) v.readyAt[p.id] = num(raw.readyAt?.[p.id], 0, 0, elapsed + 90);
  v.lamp = Boolean(raw.lamp); v.warmer = Boolean(raw.warmer); v.charges = v.warmer ? Math.floor(num(raw.charges, 0, 0, 3)) : 0;
  v.warmCooldown = num(raw.warmCooldown, 0, 0, 8); v.completed = Boolean(raw.completed); v.resultSeen = Boolean(raw.resultSeen);
  const b = raw.boat;
  if (v.started && b && Number.isFinite(b.x) && Number.isFinite(b.z) && (frontier||b.x >= SAIL_BOUNDS.left && b.x <= SAIL_BOUNDS.right && b.z >= SAIL_BOUNDS.top && b.z <= SAIL_BOUNDS.bottom)) {
    v.boat = { x: b.x, z: b.z, angle: num(b.angle, 0, -1e5, 1e5), vx: 0, vz: 0, aboard: Boolean(b.aboard), dockId: Math.floor(num(b.dockId, 0, 0, 1e7)) };
  }
  return v;
}
export function dayTwoTide(s) {
  const t = s.voyage.clock % VOYAGE_CYCLE;
  const closes=91.25,opens=175+(.76-.24)/.86*45;
  const remaining=t<=closes?closes-t:t<opens?opens-t:VOYAGE_CYCLE+closes-t;
  if (t < 80) return { water: -.10 + t / 80 * .22, rain: 0, stage: 'voyage-low', remaining, progress: .08 + t / 80 * .12, name: '第二天 · 低潮出航' };
  if (t < 140) return { water: .12 + (t - 80) / 60 * .64, rain: Math.max(0, (t - 110) / 60) * .5, stage: 'voyage-rising', remaining, progress: .2 + (t - 80) / 60 * .65, name: '海潮上涨 · 船舱将进水' };
  if (t < 175) return { water: .76 + Math.sin(t) * .025, rain: .45, stage: 'voyage-high', remaining, progress: .88, name: '海风阵雨 · 注意温暖' };
  return { water: .76 - (t - 175) / 45 * .86, rain: Math.max(0, .4 - (t - 175) / 45), stage: 'voyage-falling', remaining, progress: .85 - (t - 175) / 45 * .8, name: '海潮渐退 · 船舱即将露出' };
}
