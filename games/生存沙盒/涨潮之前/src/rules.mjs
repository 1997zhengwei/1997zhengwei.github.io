// World units, construction, survival, and save data. No renderer dependencies.
import { newVoyage, readVoyage, dayTwoTide, wreckFloor, wreckLocal, WRECK_OBSTACLES } from './voyage-state.mjs';
import {newSurvival,readSurvival,survivalWeather,generatedHeight} from './frontier-state.mjs';
import {atTile,nearBuildings,buildingIndex,invalidateBuildings,connectedFoundations} from './spatial.mjs';
export {nearBuildings,invalidateBuildings};
import {newWorldSettings,readWorldSettings,isArchitect} from './world-state.mjs';
export const VERSION = 4;
export const GRID = 2.2;
export const DECK = 1.65;
export const DAY = 260;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const snap = v => Math.round(v / GRID) * GRID;
export const tileKey = (x, z) => `${Math.round(x / GRID)},${Math.round(z / GRID)}`;
export const RECIPES = {
  platform: { name: '高脚地板', cost: { wood: 4 }, effect: '抬高脚下，避开涨潮', hint: '选在岛上，或连接已有地板。', kind: 'structure' },
  cabin: { name: '叶顶小屋', cost: { wood: 4, fiber: 3 }, effect: '挡雨，让营火保持干燥', hint: '搭在高脚地板上，门朝箭头方向。', kind: 'structure' },
  fire: { name: '营火', cost: { wood: 3, stone: 3 }, effect: '靠近火光，恢复温暖', hint: '屋顶下的火不会被雨浇灭。', kind: 'structure' },
  axe: { name: '石斧', cost: { wood: 3, stone: 3 }, effect: '砍树、采矿，解锁桥梁', hint: '制作后采集更快，还能砍树采矿。', kind: 'tool' },
  bridge: { name: '栈桥', cost: { wood: 3, fiber: 1 }, effect: '连接水面，走向礁岛', hint: '沿东侧浅滩，一格一格接到礁岛。', requires: 'axe', kind: 'structure' },
  net: { name: '收集网', cost: { wood: 4, fiber: 2 }, effect: '每 12 秒收集 2 木料', hint: '放在海岸或栈桥边，靠近收取。', kind: 'structure' },
  brace: { name: '加固小屋', cost: { wood: 2, stone: 4 }, effect: '封住海风，保温恢复更快', hint: '选择已有小屋，加装石基与挡风板。', kind: 'upgrade' },
  dock: { name: '系船码头', cost: { wood: 4, fiber: 2 }, effect: '升级海边地板，停靠小艇', hint: '选择海边地板或栈桥，箭头朝开阔水面。', kind: 'structure', day2: true },
  boat: { name: '双桨小艇', cost: { wood: 8, fiber: 3 }, effect: '划向近海沉船，自由靠岸', hint: '到码头附近建造，一艘小艇就够出发。', kind: 'tool', day2: true },
  workbench: { name: '打捞工作台', cost: { wood: 5, stone: 2, metal: 3 }, effect: '把金属零件变成远行装备', hint: '在营地空地或空地板上搭工作台。', kind: 'structure', day2: true },
  warmer: { name: '便携暖包', cost: { fiber: 4, metal: 1 }, effect: '携带 3 次取暖，出海恢复温暖', hint: '在工作台旁制作；营火旁花 1 木料补满。', kind: 'tool', day2: true },
  station:{name:'气象台',cost:{wood:3,fiber:2,metal:1},effect:'查看风向、今晚和明天的预报',hint:'放在营地空地，靠近后读取预报。',kind:'structure',day3:true},
  seawall:{name:'防浪石堤',cost:{stone:4,wood:2},effect:'背后 7 米降低海浪与进水',hint:'箭头朝来风方向，庇护背后的营地。',kind:'structure',day3:true},
  windbreak:{name:'挡风木墙',cost:{wood:4,fiber:2},effect:'背风面降低寒风失温',hint:'箭头朝来风方向，人在墙背后取暖。',kind:'structure',day3:true},
  highdeck:{name:'抬高地基',cost:{wood:4,stone:2},effect:'整格抬高至 2.55 米',hint:'选择已有地板或栈桥，连同屋子一起抬高。',kind:'upgrade',day3:true},
  stove:{name:'防雨火炉',cost:{wood:3,stone:4,metal:1},effect:'雨夜也能在炉边恢复温暖',hint:'可升级原来的营火，也可放在干燥空地板上。',kind:'structure',day3:true},
  beacon:{name:'引航灯塔',cost:{wood:4,stone:2,metal:1},effect:'照亮雾夜，标记回家的方向',hint:'灯光照亮周围，雾夜可以靠灯辨认营地。',kind:'structure',day3:true},
  lumbermill:{name:'育林工坊',cost:{wood:6,stone:2,metal:1},effect:'每 15 秒备好 5 木料',hint:'持续补充建造材料，走近收取。',kind:'structure',day3:true},
  recycler:{name:'打捞分拣台',cost:{wood:4,metal:2},effect:'每 20 秒分拣石头与金属',hint:'持续分拣海上漂流物，走近收取。',kind:'structure',day3:true},
  garden:{name:'纤维花圃',cost:{wood:3,fiber:2},effect:'每 18 秒收获 4 纤维',hint:'花圃会重新生长，让营地持续有材料可用。',kind:'structure',day3:true},
  fence:{name:'木栅栏',cost:{wood:2},effect:'围出庭院与道路边界',hint:'沿这一格的前沿设置栅栏，留出中央通路。',kind:'structure',day3:true,decor:true},
  arch:{name:'庭院拱门',cost:{wood:3,fiber:1},effect:'可步行穿过的庭院入口',hint:'两侧立柱有碰撞，中间可通行。',kind:'structure',day3:true,decor:true},
  flowerbed:{name:'缤纷花坛',cost:{wood:2,fiber:2},effect:'按世界配色种出不同花色',hint:'可铺在陆地或地板上，给世界添一点自己的颜色。',kind:'structure',day3:true,decor:true},
  lantern:{name:'庭院灯',cost:{wood:2,metal:1},effect:'照亮 4 米，雾夜也可辨路',hint:'小灯也能提供附近的浓雾保护。',kind:'structure',day3:true,decor:true},
  remove: { name: '拆除返还', cost: {}, effect: '拆除该格，返还实付材料', hint: '点击建筑所在格；相连桥梁需保留支撑。', kind: 'remove' },
};
export const RESOURCE_NAMES = { wood: '漂流木', stone: '石块', fiber: '纤维丛', tree: '椰子树', ore: '礁岛矿石', crate: '搁浅物资',scrap:'漂流零件' };
export const YIELDS = { wood: { wood: 3 }, stone: { stone: 3 }, fiber: { fiber: 4 }, tree: { wood: 7, fiber: 2 }, ore: { stone: 6 }, crate: { wood: 5, fiber: 3 },scrap:{metal:2,wood:2} };

export function islandRadius(x, z, reef = false) {
  const cx = reef ? 13.5 : -.3, cz = reef ? -2.2 : 0;
  const dx = (x - cx) / (reef ? 3.35 : 7.9), dz = (z - cz) / (reef ? 3.1 : 7.3);
  const a = Math.atan2(dz, dx);
  return Math.hypot(dx, dz) / (1 + .045 * Math.sin(a * 5 + 1) + .035 * Math.cos(a * 3));
}
export function groundHeight(x, z) {
  const r = islandRadius(x, z), rr = islandRadius(x, z, true);
  let main = -.95, reef = -.95;
  if (r < 1.15) {
    const hill = 1.05 * Math.max(0, 1 - Math.hypot((x + 3.1) / 3.7, (z + 2) / 3.3)) ** .8;
    main = r < .87 ? .58 + hill + .055 * Math.sin(x * .6) * Math.cos(z) : .58 - Math.max(0, r - .87) * 5.5;
  }
  if (rr < 1.15) reef = rr < .82 ? .72 + .3 * Math.max(0, 1 - rr) : .72 - (rr - .82) * 5.5;
  const sandbarR = Math.hypot((x + 15.4) / 4, (z + 13.2) / 3.6);
  const sandbar = sandbarR < 1 ? .16 - Math.max(0, sandbarR - .35) * 1.8 : -.95;
  return Math.max(main, reef, sandbar,generatedHeight(x,z));
}

export function createNodes() {
  const groups = {
    wood: [[-1, 4.7], [1.8, 4.4], [4, 3.5], [5.6, 1.8], [2.8, -5], [-5.5, 2.2], [-5.5, -3.9], [-2.9, -5.9], [-3.8, 5.2], [.3, 6]],
    stone: [[-1.6, .1], [3.1, .3], [-4.9, -2], [.3, -3.2], [-4, 3.1]],
    fiber: [[2.5, 2.6], [-3.8, 4.3], [4.4, -2.9], [-2.5, -4.7], [-5.8, -.2]],
    tree: [[-6, 1], [1.9, -4.3], [5.2, -.4], [-1.6, 5.7], [-4.7, -4.5]],
    ore: [[13.1, -3.5], [15.3, -1.6]], crate: [[13, -.7]],
  };
  return Object.entries(groups).flatMap(([type, points]) => points.map(([x, z], i) => ({ id: `${type}-${i}`, type, x, z, readyAt: 0 })));
}
export function createState() {
  return { version: VERSION, elapsed: 0, time: 0, day: 1, player: { x: 0, z: 3.6, angle: 0 },
    inventory: { wood: 0, stone: 0, fiber: 0, metal: 0 }, axe: false, warmth: 100,
    buildings: [], nodes: createNodes(), nextId: 1, milestones: {}, visitedReef: false,
    stormHeld: 0, won: false, free: false, rescued: 0, stats: { gathered: 0, built: 0 }, voyage: newVoyage(),survival:newSurvival(),world:newWorldSettings(),
  };
}
export function tide(state) {
  if(state.survival?.started)return survivalWeather(state);
  if (state.voyage?.started) return dayTwoTide(state);
  if (state.free) return { water: .08, rain: 0, stage: 'peace', remaining: 0, progress: 0, name: '风雨已过 · 自由扩建' };
  const t = state.time;
  if (t < 80) return { water: -.12 + t / 80 * .08, rain: 0, stage: 'low', remaining: 180 - t, progress: t / 240, name: '晴朗 · 退潮海滩' };
  if (t < 180) return { water: -.04 + (t - 80) / 100 * 1.2, rain: clamp((t - 160) / 25, 0, .65), stage: 'rising', remaining: 180 - t, progress: t / 240, name: '潮水上涨 · 返回营地' };
  if (t < 225) return { water: 1.16 + .035 * Math.sin(t), rain: 1, stage: 'storm', remaining: 225 - t, progress: t / 240, name: '风雨来临 · 守住火光' };
  return { water: 1.16 - (t - 225) / 35 * 1.28, rain: clamp(1 - (t - 225) / 16, 0, 1), stage: 'falling', remaining: 260 - t, progress: Math.max(0, 1 - (t - 225) / 35), name: '海潮退去 · 天色渐暖' };
}
export function sameTile(b, x, z) { return tileKey(b.x, b.z) === tileKey(x, z); }
export function tileBuildings(s, x, z) { return atTile(s,x,z); }
export function deckHeight(b){return DECK+(b?.raised ? .9 : 0);}
export function foundationAt(s, x, z) { return nearBuildings(s,x,z,GRID).filter(b => ['platform', 'bridge'].includes(b.type) && Math.abs(x - b.x) <= GRID / 2 + .04 && Math.abs(z - b.z) <= GRID / 2 + .04).sort((a,b)=>deckHeight(b)-deckHeight(a))[0]; }
export function buildingBase(s,b){return Math.max(groundHeight(b.x,b.z),foundationAt(s,b.x,b.z)?deckHeight(foundationAt(s,b.x,b.z)):-.95);}
export function floorHeight(s, x, z) {
  const foundation=foundationAt(s,x,z);let h = Math.max(groundHeight(x, z), wreckFloor(x, z), foundation ? deckHeight(foundation) : -.95);
  for (const b of nearBuildings(s,x,z,4)) if (b.type === 'platform') {
    const a = b.rotation * Math.PI / 2, dx = x - b.x, dz = z - b.z;
    const lx = dx * Math.cos(a) - dz * Math.sin(a), lz = dx * Math.sin(a) + dz * Math.cos(a);
    if (Math.abs(lx) <= .53) for (let i = 0; i < (b.raised?6:3); i++) if (Math.abs(lz - 1.15 - i * .26) <= .17) h = Math.max(h, deckHeight(b) - .17 - i * .28);
  }
  return h;
}
export function canAfford(s, recipe) { return s.survival?.started&&s.survival.creative||Object.entries(recipe.cost).every(([k, v]) => s.inventory[k] >= v); }
export function spend(s, cost) { if(s.survival?.started&&s.survival.creative)return;for (const [k, v] of Object.entries(cost)) s.inventory[k] -= v; }
export function gain(s, amounts) { for (const [k, v] of Object.entries(amounts)) s.inventory[k] = (s.inventory[k] || 0) + v; }
export function nodeReady(s, n) { return n.readyAt <= s.elapsed; }
export function nodeBlocked(s,n){return Boolean(foundationAt(s,n.x,n.z))||nearBuildings(s,n.x,n.z,2).some(b=>['workbench','station','lumbermill','recycler','garden','stove','beacon','seawall','windbreak'].includes(b.type)&&Math.abs(b.x-n.x)<.9&&Math.abs(b.z-n.z)<.75);}
export function needsAxe(n) { return ['tree', 'ore'].includes(n.type); }
export function harvest(s, nodeId) {
  const n = s.nodes.find(n => n.id === nodeId);
  if (!n || !nodeReady(s, n) || nodeBlocked(s, n) || dist(s.player, n) > 2.05) return { ok: false, message: '先走近一点。' };
  if (needsAxe(n) && !s.axe) return { ok: false, message: n.type === 'tree' ? '先制作石斧，就能砍树。' : '礁岛矿石需要石斧。' };
  gain(s, YIELDS[n.type]);
  s.stats.gathered += Object.values(YIELDS[n.type]).reduce((a, v) => a + v, 0);
  n.readyAt = s.elapsed + (n.type === 'tree' ? 45 : n.type === 'ore' ? 24 : n.type === 'crate' ? 45 : n.type === 'wood' ? 18 : 25);
  if(n.remote&&s.survival)s.survival.resourceTimers[n.id]=n.readyAt;
  if (s.inventory.wood >= 4) s.milestones.wood = true;
  return { ok: true, amounts: YIELDS[n.type], node: n };
}
export function craftAxe(s) {
  if (s.axe) return { ok: false, message: '石斧已经装备好了。' };
  if (!canAfford(s, RECIPES.axe)) return { ok: false, message: '制作石斧需要 3 木料、3 石头。' };
  spend(s, RECIPES.axe.cost); s.axe = true; s.milestones.axe = true;
  return { ok: true, message: '石斧装备好了！现在可以砍树、采矿、搭桥。' };
}
function anchored(s, building, ignored = new Set(), visited = new Set()) {
  if (groundHeight(building.x, building.z) >= .15) return true;
  const c=buildingIndex(s);if(!c.support)c.support=connectedFoundations(s,groundHeight);
  return [[GRID,0],[-GRID,0],[0,GRID],[0,-GRID]].some(([dx,dz])=>atTile(s,building.x+dx,building.z+dz).some(b=>['platform','bridge'].includes(b.type)&&c.support.seen.has(b.id)));
}
export function validateBuild(s, type, x, z, { range = true, materials = true, rotation = 0 } = {}) {
  const r = RECIPES[type];
  if (!r || r.kind === 'tool' || !Number.isFinite(x + z)) return { ok: false, message: '请选择建筑位置。' };
  if (r.day2 && !s.voyage?.started) return { ok: false, message: '安家后，第二天会解锁出海工坊。' };
  if(r.day3&&!s.survival?.started)return{ok:false,message:'第二天完成远行装备后，第三天会解锁营地进阶。'};
  if (s.voyage?.boat?.aboard&&!isArchitect(s)) return { ok: false, message: '先靠岸下船，再展开工坊。' };
  x = snap(x); z = snap(z);
  if(!s.survival?.started&&(Math.abs(x)>18||Math.abs(z)>11))return{ok:false,message:'这里离小岛太远了。'};
  if (range && !isArchitect(s) && dist(s.player, { x, z }) > 6.7) return { ok: false, message: '走近一些，再在这里建造。' };
  if (r.requires && !s[r.requires]) return { ok: false, message: '先制作石斧，解锁栈桥。' };
  const bs = tileBuildings(s, x, z);
  const floor = bs.find(b => ['platform', 'bridge'].includes(b.type));
  const cabin = bs.find(b => b.type === 'cabin');
  if (type === 'remove') {
    if (!bs.length) return { ok: false, message: '这格没有可拆除的建筑。' };
    const ignored = new Set(bs.map(b => b.id));
    const support=connectedFoundations(s,groundHeight,ignored);if(support.all.some(b=>!support.seen.has(b.id)))return { ok: false, message: '这格支撑着水面上的桥，先从桥的尽头拆起。' };
    return { ok: true, message: '拆除本格建筑，返还实付材料。自由营造建筑不返还。' };
  }
  if (materials && !canAfford(s, r)) return { ok: false, message: '材料还不够，先去采集一些。' };
  if (['platform', 'bridge'].includes(type)) {
    if(s.voyage?.boat&&dist(s.voyage.boat,{x,z})<1.5)return {ok:false,message:'小艇停在这里，先把它划开或召回码头。'};
    if (floor || bs.length) return { ok: false, message: '这里已经有建筑了。' };
    if (!isArchitect(s)&&s.nodes.some(n => needsAxe(n) && n.type === 'tree' && nodeReady(s, n) && Math.abs(n.x - x) < 1 && Math.abs(n.z - z) < 1)) return { ok: false, message: '先用石斧清理这棵树。' };
    if (!isArchitect(s)&&!anchored(s, { id: -1, type, x, z })) return { ok: false, message: '需要连接陆地或已有地板，不能悬空。' };
  } else if (type === 'cabin') {
    if (!floor || floor.type !== 'platform') return { ok: false, message: '小屋需要建在高脚地板上。' };
    if (cabin || bs.some(b => b.type === 'net')) return { ok: false, message: '这格已被占用，换一块地板吧。' };
  } else if (type === 'brace') {
    if (!cabin) return { ok: false, message: '选择已有的叶顶小屋。' };
    if (cabin.braced) return { ok: false, message: '这间小屋已经加固了。' };
  } else if(type==='highdeck'){
    if(!floor)return{ok:false,message:'选择一格已有的地板或栈桥。'};
    if(floor.raised)return{ok:false,message:'这格已经抬高了。'};
    if(bs.some(b=>b.type==='dock'))return{ok:false,message:'保留低位码头供上下船，抬高其他营地地板。'};
  } else if (type === 'fire') {
    if (bs.some(b => ['fire', 'net'].includes(b.type))) return { ok: false, message: '这格已经有设施了。' };
    if (!floor && groundHeight(x, z) < .45) return { ok: false, message: '营火需要干燥的陆地或地板。' };
  } else if (type === 'dock') {
    if (!floor) return { ok: false, message: '先铺一块海边地板或栈桥，再升级成码头。' };
    if (bs.some(b => !['platform', 'bridge'].includes(b.type))) return { ok: false, message: '码头需要一格空的地板或栈桥。' };
    const a = rotation * Math.PI / 2, bx = x + Math.sin(a) * 3, bz = z + Math.cos(a) * 3;
    if ([[0,0],[-.46,0],[.46,0],[0,-.46],[0,.46]].some(([dx,dz])=>floorHeight(s,bx+dx,bz+dz)>-.29)) return { ok: false, message: '箭头前方需要深水，旋转码头避开陆地或桥。' };
  } else if (type === 'workbench') {
    if (bs.some(b => !['platform', 'bridge'].includes(b.type))) return { ok: false, message: '工作台需要营地的一格空地。' };
    if (!floor && groundHeight(x, z) < .5) return { ok: false, message: '在干燥陆地或地板上搭工作台。' };
    if(!isArchitect(s)&&!floor&&s.nodes.some(n=>['stone','tree'].includes(n.type)&&nodeReady(s,n)&&Math.abs(n.x-x)<.85&&Math.abs(n.z-z)<.7))return {ok:false,message:'先清理这里的石块或树木，再搭工作台。'};
  } else if (type === 'net') {
    if (bs.some(b => ['cabin', 'net', 'fire'].includes(b.type))) return { ok: false, message: '收集网需要一格空地。' };
    if (!floor && groundHeight(x, z) < .15) return { ok: false, message: '先建地板，才能在水面架网。' };
    if (!floor && islandRadius(x, z) < .65 && islandRadius(x, z, true) > 1.1) return { ok: false, message: '靠海一点，才能网到漂流木。' };
  }else if(type==='stove'&&bs.some(b=>b.type==='fire')){
    if(!isArchitect(s)&&dist(s.player,{x,z})<.34)return{ok:false,message:'往旁边挪一步，再把营火升级成火炉。'};
  }else if(r.day3){
    if(!isArchitect(s)&&['station','lumbermill','recycler','beacon','stove','seawall','windbreak'].includes(type)&&dist(s.player,{x,z})<.85)return{ok:false,message:'把设施放在身旁，给自己留出站立的位置。'};
    if(bs.some(b=>!['platform','bridge'].includes(b.type)))return{ok:false,message:'这里已有设施，选一格空地或空地板。'};
    if(!floor&&groundHeight(x,z)<.35)return{ok:false,message:'设施需要陆地或连通的地板。'};
    if(!isArchitect(s)&&!floor&&s.nodes.some(n=>['stone','tree'].includes(n.type)&&nodeReady(s,n)&&Math.abs(n.x-x)<.75&&Math.abs(n.z-z)<.7))return{ok:false,message:'先清理这格的树木或石块。'};
  }
  return { ok: true, message: r.hint };
}
export function build(s, type, px, pz, rotation = 0) {
  const x = snap(px), z = snap(pz), valid = validateBuild(s, type, x, z, { rotation });
  if (!valid.ok) return valid;
  const bs = tileBuildings(s, x, z);
  if (type === 'remove') {
    const refund = { wood: 0, stone: 0, fiber: 0 };
    for (const b of bs) {
      if(!b.free)for (const [k, v] of Object.entries(RECIPES[b.type].cost)) refund[k] = (refund[k]||0)+v;
      if (b.braced&&!b.bracedFree) for (const [k, v] of Object.entries(RECIPES.brace.cost)) refund[k] = (refund[k]||0)+v;
      if(b.raised&&!b.raisedFree)for(const [k,v]of Object.entries(RECIPES.highdeck.cost))refund[k]=(refund[k]||0)+v;
      if (b.type === 'net') refund.wood += b.stored || 0;
      if(b.priorFirePaid)for(const [k,v]of Object.entries(RECIPES.fire.cost))refund[k]=(refund[k]||0)+v;
      if(b.stock)for(const [k,v]of Object.entries(b.stock))refund[k]=(refund[k]||0)+v;
    }
    gain(s, refund); s.buildings = s.buildings.filter(b => !sameTile(b, x, z));invalidateBuildings(s);
    return { ok: true, message: '已拆除，实付材料已返还。可以试试另一种布局。', removed: bs, amounts: refund };
  }
  spend(s, RECIPES[type].cost);
  if (type === 'brace') {
    bs.find(b => b.type === 'cabin').braced = true; s.milestones.brace = true;
    if(s.survival?.creative)bs.find(b=>b.type==='cabin').bracedFree=true;
  }else if(type==='highdeck'){
    const f=bs.find(b=>['platform','bridge'].includes(b.type));f.raised=true;if(s.survival.creative)f.raisedFree=true;
  }else if(type==='stove'&&bs.some(b=>b.type==='fire')){
    const f=bs.find(b=>b.type==='fire');f.priorFirePaid=!f.free;f.type='stove';f.lit=true;f.wet=0;if(s.survival.creative)f.free=true;else delete f.free;
  } else {
    s.buildings.push({ id: s.nextId++, type, x, z, rotation: ((rotation % 4) + 4) % 4, lit: ['fire','stove'].includes(type), wet: 0, stored: 0, collected: 0, braced: false,...(s.survival?.creative?{free:true}:{}),...(isArchitect(s)&&['platform','bridge'].includes(type)?{freeAnchor:true}:{}),...(RECIPES[type].decor?{tint:s.world.style,lit:type==='lantern'}:{}) });
  }
  invalidateBuildings(s);
  s.stats.built++; if (type === 'platform') s.milestones.deck = true;
  if (s.voyage?.started && ['dock', 'workbench'].includes(type)) s.voyage.goals[type] = true;
  if(s.survival?.started){if(['station','seawall','stove'].includes(type))s.survival.goals[type]=true;if(type==='highdeck')s.survival.goals.raised=true;}
  if (type === 'cabin') s.milestones.roof = true;
  if (s.buildings.some(b => b.type === 'fire' && b.lit && covered(s, b.x, b.z))) s.milestones.fire = true;
  return { ok: true, message: type === 'brace' ? '挡风板与石基装好了，屋里更暖和了。' : `${RECIPES[type].name}建好了。` };
}
export function covered(s, x, z) {
  return nearBuildings(s,x,z,2).find(b => b.type === 'cabin' && Math.abs(x - b.x) < 1.03 && Math.abs(z - b.z) < 1.03);
}
export function campProtection(s,x,z,w=tide(s)){
  let wave=false,wind=false,lamp=false;const a=(w.wind||0)*Math.PI/2,n={x:Math.sin(a),z:Math.cos(a)};
  for(const b of nearBuildings(s,x,z,10)){
    if(['beacon','lantern'].includes(b.type)&&(b.hp??100)>20&&Math.hypot(x-b.x,z-b.z)<(b.type==='lantern'?4:10))lamp=true;
    if(!['seawall','windbreak'].includes(b.type)||(b.hp??100)<25)continue;
    const facing={x:Math.sin(b.rotation*Math.PI/2),z:Math.cos(b.rotation*Math.PI/2)};
    if(facing.x*n.x+facing.z*n.z<.7)continue;
    const dx=x-b.x,dz=z-b.z,back=-(dx*n.x+dz*n.z),side=Math.abs(dx*n.z-dz*n.x);
    if(back>.1&&back<7.5&&side<1.25+back*.28){wind=true;if(b.type==='seawall')wave=true;}
  }return{wave,wind,lamp,water:w.water-(wave ? .75 : 0)};
}
export function shelter(s) {
  const roof = covered(s, s.player.x, s.player.z);
  const fire = nearBuildings(s,s.player.x,s.player.z,4.3).find(b => ['fire','stove'].includes(b.type) && b.lit && dist(s.player, b) < (b.type==='stove'?4.2:3.1) && Math.abs(floorHeight(s, b.x, b.z) - floorHeight(s, s.player.x, s.player.z)) < 1.4);
  const aboard = Boolean(s.voyage?.boat?.aboard);
  const protection=campProtection(s,s.player.x,s.player.z),flooded = !aboard && protection.water > floorHeight(s, s.player.x, s.player.z) + .13;
  return { roof, fire, aboard, flooded,protection, cozy: Boolean(roof && fire && !flooded && !aboard), braced: Boolean(roof?.braced&&(roof.hp??100)>=45) };
}
export function collides(s, x, z) {
  if (floorHeight(s, x, z) < -.35) return true;
  const wp = wreckLocal(x, z);
  if (WRECK_OBSTACLES.some(o => Math.hypot(wp.x - o.x, wp.z - o.z) < o.radius + .19)) return true;
  for (const n of s.nodes) {
    if (!nodeReady(s, n) || nodeBlocked(s, n)) continue;
    const rad = n.type === 'tree' ? .37 : n.type === 'ore' ? .58 : n.type === 'stone' ? .36 : 0;
    if (rad && Math.hypot(x - n.x, z - n.z) < rad + .19) return true;
  }
  for (const b of nearBuildings(s,x,z,3)) {
    if (b.type === 'cabin') {
      const a = b.rotation * Math.PI / 2, dx = x - b.x, dz = z - b.z;
      const lx = dx * Math.cos(a) - dz * Math.sin(a), lz = dx * Math.sin(a) + dz * Math.cos(a);
      // Walls are actual obstacles; a broad doorway remains on the front edge.
      if (Math.abs(lx) < 1.17 && Math.abs(lz) < 1.17 && ((Math.abs(lx) > .78) || lz < -.78 || (lz > .79 && Math.abs(lx) > .51))) return true;
    }
    if(b.type==='fence'){const a=b.rotation*Math.PI/2,lx=(x-b.x)*Math.cos(a)-(z-b.z)*Math.sin(a),lz=(x-b.x)*Math.sin(a)+(z-b.z)*Math.cos(a);if(Math.abs(lx)<1.06&&Math.abs(lz-.88)<.16)return true;}
    if(b.type==='arch'){const a=b.rotation*Math.PI/2,lx=(x-b.x)*Math.cos(a)-(z-b.z)*Math.sin(a),lz=(x-b.x)*Math.sin(a)+(z-b.z)*Math.cos(a);if(Math.abs(Math.abs(lx)-.84)<.19&&Math.abs(lz)<.23)return true;}
    if (b.type === 'net' && Math.hypot(x - b.x, z - b.z) < .45) return true;
    if (b.type === 'workbench' && Math.abs(x - b.x) < .72 && Math.abs(z - b.z) < .48) return true;
    if(['seawall','windbreak'].includes(b.type)){const a=b.rotation*Math.PI/2,lx=(x-b.x)*Math.cos(a)-(z-b.z)*Math.sin(a),lz=(x-b.x)*Math.sin(a)+(z-b.z)*Math.cos(a);if(Math.abs(lx)<1.08&&Math.abs(lz)<.23)return true;}
    if(['station','lumbermill','recycler','beacon','stove'].includes(b.type)&&Math.hypot(x-b.x,z-b.z)<(b.type==='stove'?.34:.55))return true;
  }
  return false;
}
export function movePlayer(s, dx, dz) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .12));
  for (let i = 0; i < steps; i++) {
    const nx = s.player.x + dx / steps, nz = s.player.z + dz / steps;
    if (!collides(s, nx, nz)) { s.player.x = nx; s.player.z = nz; }
    else {
      if (!collides(s, nx, s.player.z)) s.player.x = nx;
      if (!collides(s, s.player.x, nz)) s.player.z = nz;
    }
  }
  if (islandRadius(s.player.x, s.player.z, true) < .86) { s.visitedReef = true; s.milestones.reef = true; }
}
export function interactBuilding(s, id) {
  const b = s.buildings.find(b => b.id === id);
  if (!b || dist(s.player, b) > 2.2) return { ok: false, message: '先走近一点。' };
  if (b.type === 'net') {
    const count = b.stored || 0;
    if (!count) return { ok: false, message: '还在等待漂流木，12 秒收集一次。' };
    s.inventory.wood += count; b.stored = 0; return { ok: true, amounts: { wood: count }, message: `收到了 ${count} 份木料。` };
  }
  if (['fire','stove'].includes(b.type) && !b.lit) {
    if (campProtection(s,b.x,b.z).water > floorHeight(s, b.x, b.z) + .05) return { ok: false, message: '这里被水淹了，把火建在高脚地板上。' };
    if (b.type==='fire'&&tide(s).rain > .3 && !covered(s, b.x, b.z)) return { ok: false, message: '雨太大，先搭屋顶。' };
    b.lit = true; b.wet = 0; return { ok: true, message: '营火重新亮起来了。' };
  }
  if (['fire','stove'].includes(b.type) && b.lit && s.voyage?.warmer && s.voyage.charges < 3) {
    if (!canAfford(s,{cost:{wood:1}})) return { ok: false, message: '补满暖包需要 1 份木料。' };
    spend(s,{wood:1}); s.voyage.charges = 3;
    return { ok: true, message: '用营火补满了 3 次便携取暖。' };
  }
  return { ok: false, message: '靠近营火，就能恢复温暖。' };
}
export function advance(s, dt) {
  const events = [];
  s.elapsed += dt; s.time += s.free ? 0 : dt;
  if (s.time >= DAY) { s.time -= DAY; s.day++; events.push('new-day'); }
  const t = tide(s), env = shelter(s);
  for (const b of nearBuildings(s,s.player.x,s.player.z,58)) {
    if (b.type === 'net') {
      b.collected = (b.collected || 0) + dt;
      if (b.collected >= 12) { b.stored = Math.min(8, (b.stored || 0) + Math.floor(b.collected / 12) * 2); b.collected %= 12; }
    }
    if (['fire','stove'].includes(b.type)) {
      const wet = campProtection(s,b.x,b.z,t).water > floorHeight(s, b.x, b.z) + .05 || b.type==='fire'&&t.rain > .4 && !covered(s, b.x, b.z);
      b.wet = wet ? b.wet + dt : 0;
      if (b.wet > 3 && b.lit) { b.lit = false; events.push('fire-out'); }
    }
  }
  let change = .6;
  if (env.aboard) change = -.8 - t.rain * 1.5;
  else if (env.flooded) change = -11;
  else if (env.cozy) change = env.braced ? 7 : 3;
  else if(env.fire?.type==='stove')change=4;
  else if (env.fire && !t.rain) change = 4;
  else if (t.rain > .2) change = env.roof ? -.8 * t.rain : -3.5 * t.rain;
  if(s.survival?.started&&!env.cozy&&!env.fire){change-=t.cold*(env.protection.wind ? .5 : 3.5);if(env.protection.wind&&change<0)change*=.4;}
  s.warmth = clamp(s.warmth + change * dt, 0, 100);
  if (t.stage === 'storm' && env.cozy) s.stormHeld += dt;
  if (!s.won && env.cozy && env.braced && s.visitedReef && s.stormHeld >= 12 && t.stage === 'storm') {
    s.won = true; events.push('win');
  }
  if(s.world?.mode==='creative')s.warmth=100;
  if (s.warmth <= 0) events.push('rescue');
  return events;
}
export function rescue(s) {
  if (s.voyage?.boat) { s.voyage.boat.aboard = false; s.voyage.boat.vx = 0; s.voyage.boat.vz = 0; }
  s.player = { x: -3.1, z: -2.1, angle: 0 }; s.warmth = 88; s.rescued++;
  // Remain above the high-water line even if the player built over the return point.
  if (collides(s, s.player.x, s.player.z)) {
    for (let r = .4; r < 3; r += .4) {
      let done = false;
      for (let a = 0; a < 6.28; a += .5) {
        const x = -3.1 + Math.cos(a) * r, z = -2.1 + Math.sin(a) * r;
        if (floorHeight(s, x, z) > 1.15 && !collides(s, x, z)) { s.player.x = x; s.player.z = z; done = true; break; }
      }
      if (done) break;
    }
  }
}
export const MISSIONS = [
  ['wood', '先收集 4 份木料', '点击海滩上的漂流木，收集至少 4 木料。'],
  ['deck', '给自己一块干燥的地板', '打开工坊，在喜欢的位置搭高脚地板。'],
  ['roof', '把屋顶搭起来', '采集纤维，把叶顶小屋搭在地板上。'],
  ['fire', '让家里亮起火光', '收集石块，在屋顶下建一堆营火。'],
  ['axe', '带上石斧，去更远处', '制作石斧，砍树能获得更多木料。'],
  ['reef', '搭一条通往礁岛的桥', '沿东侧浅滩接栈桥，走到另一座小岛。'],
  ['brace', '加固小屋，迎接风雨', '开采礁岛矿石，加固小屋后回屋里烤火。'],
];
export function currentMission(s) {
  const i = MISSIONS.findIndex(([key]) => !s.milestones[key]);
  if (i >= 0) return { index: i, title: MISSIONS[i][1], desc: MISSIONS[i][2] };
  if (!s.won) return { index: 7, title: '在自己的家里，守住火光', desc: '风雨来临时，在加固的小屋里烤火 12 秒。' };
  return { index: 8, title: '这是你的小岛了', desc: '自由扩建、收取漂流木，或试试另一种布局。' };
}
export function restore(raw) {
  if (!raw || ![1,2,3, VERSION].includes(raw.version)) return null;
  const s = createState();
  const num = (v, fallback, lo, hi) => Number.isFinite(v) ? clamp(v, lo, hi) : fallback;
  s.elapsed = num(raw.elapsed, 0, 0, 1e8); s.time = num(raw.time, 0, 0, DAY - .001);
  s.day = Math.floor(num(raw.day, 1, 1, 1e5));
  s.player = { x: num(raw.player?.x, 0, -1e9, 1e9), z: num(raw.player?.z, 3.6, -1e9, 1e9), angle: num(raw.player?.angle, 0, -1e5, 1e5) };
  for (const k of Object.keys(s.inventory)) s.inventory[k] = Math.floor(num(raw.inventory?.[k], 0, 0, 99999));
  s.axe = Boolean(raw.axe); s.warmth = num(raw.warmth, 100, 1, 100);
  s.won = Boolean(raw.won); s.free = s.won && Boolean(raw.free); s.visitedReef = Boolean(raw.visitedReef);
  s.rescued = Math.floor(num(raw.rescued, 0, 0, 1e5)); s.stormHeld = num(raw.stormHeld, 0, 0, 1e6);
  s.stats = { gathered: num(raw.stats?.gathered, 0, 0, 1e8), built: num(raw.stats?.built, 0, 0, 1e6) };
  s.voyage = readVoyage(raw.voyage, s.won, num, s.elapsed,Boolean(raw.survival?.started));
  s.survival=readSurvival(raw.survival,s.voyage.completed,num);s.world=readWorldSettings(raw.world);
  for (const [key] of MISSIONS) s.milestones[key] = Boolean(raw.milestones?.[key]);
  if (Array.isArray(raw.nodes)) for (const n of s.nodes) {
    const saved = raw.nodes.find(v => v.id === n.id); n.readyAt = num(saved?.readyAt, 0, 0, s.elapsed + 60);
  }
  if (Array.isArray(raw.buildings)) {
    const duplicates=new Set(),ids=new Set();
    for (const b of raw.buildings) {
      if (!RECIPES[b.type]||['axe','boat','warmer','brace','highdeck','remove'].includes(b.type)|| !Number.isFinite(b.x) ||!Number.isFinite(b.z)) continue;
      const x = snap(b.x), z = snap(b.z);
      const k=`${b.type}/${tileKey(x,z)}`;if(duplicates.has(k))continue;duplicates.add(k);
      const id = Number.isInteger(b.id) && b.id > 0 && !ids.has(b.id) ? b.id : s.nextId;ids.add(id);
      s.nextId = Math.max(s.nextId, id + 1);
      s.buildings.push({ id, type: b.type, x, z, rotation: Math.floor(num(b.rotation, 0, 0, 3)), braced: b.type === 'cabin' && Boolean(b.braced), lit: b.type === 'fire' && Boolean(b.lit), wet: num(b.wet, 0, 0, 10), stored: num(b.stored, 0, 0, 8), collected: num(b.collected, 0, 0, 12) });
      const out=s.buildings[s.buildings.length-1];if(b.type==='stove')out.lit=Boolean(b.lit);
      for(const field of ['free','bracedFree','raised','raisedFree','priorFirePaid','freeAnchor'])if(b[field])out[field]=true;
      if(RECIPES[b.type].decor){out.tint=['sea','sunset','meadow'].includes(b.tint)?b.tint:'sea';if(b.type==='lantern')out.lit=true;}
      if(Number.isFinite(b.hp))out.hp=num(b.hp,100,20,100);
      if(b.stock){out.stock={};for(const k of ['wood','stone','fiber','metal'])if(Number.isFinite(b.stock[k]))out.stock[k]=num(b.stock[k],0,0,200);}
      if(Number.isFinite(b.production))out.production=num(b.production,0,0,60);
    }
    // Invalid/orphaned structures from damaged storage are discarded, never refunded.
    s.buildings = s.buildings.filter(b => b.type === 'platform' || b.type === 'bridge' || ['fire','workbench','station','seawall','windbreak','stove','beacon','garden','lumbermill','recycler','fence','arch','flowerbed','lantern'].includes(b.type) && (groundHeight(b.x, b.z) > .3 || foundationAt(s, b.x, b.z)) || ['cabin', 'net','dock'].includes(b.type) && (foundationAt(s, b.x, b.z) || b.type === 'net' && groundHeight(b.x, b.z) >= .15));invalidateBuildings(s);
  }
  if (s.voyage.boat?.aboard) { s.player.x = s.voyage.boat.x; s.player.z = s.voyage.boat.z; s.player.angle = s.voyage.boat.angle; }
  else if (collides(s, s.player.x, s.player.z)) rescue(s);
  return s;
}

// A small grid pathfinder for tap-to-walk. All waypoints use the same terrain,
// construction support, and wall collision rules as direct movement.
export function findPath(s, goal) {
  const cell = .4, remote = Math.min(s.player.x, goal.x, s.player.z, goal.z) < -9 ||Math.max(s.player.x,goal.x)>18||Math.max(s.player.z,goal.z)>9;
  const ox = remote ? Math.floor((Math.min(s.player.x, goal.x) - 3) / cell) * cell : -10;
  const oz = remote ? Math.floor((Math.min(s.player.z, goal.z) - 3) / cell) * cell : -10;
  const width = remote ? Math.ceil((Math.max(s.player.x, goal.x) - ox + 3) / cell) + 1 : 76;
  const height = remote ? Math.ceil((Math.max(s.player.z, goal.z) - oz + 3) / cell) + 1 : 52;
  const ix = x => Math.round((x - ox) / cell), iz = z => Math.round((z - oz) / cell);
  const key = (x, z) => z * width + x;
  const sx = ix(s.player.x), sz = iz(s.player.z), gx = ix(goal.x), gz = iz(goal.z);
  const start = key(sx, sz), open = [start], costs = new Map([[start, 0]]), prev = new Map();
  const point = k => ({ x: ox + k % width * cell, z: oz + Math.floor(k / width) * cell });
  const target = { x: ox + gx * cell, z: oz + gz * cell };
  const water=s.voyage?.started?tide(s).water:-2;
  let best = start, bestD = dist(s.player, target), visited = new Set();
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  for (let it = 0; open.length && it < 5000; it++) {
    open.sort((a, b) => costs.get(a) + dist(point(a), target) - costs.get(b) - dist(point(b), target));
    const at = open.shift(); if (visited.has(at)) continue; visited.add(at);
    const p = point(at), d = dist(p, target); if (d < bestD) { best = at; bestD = d; } if (d < .3) break;
    const ax = at % width, az = Math.floor(at / width);
    for (const [dx, dz] of dirs) {
      const nx = ax + dx, nz = az + dz; if (nx < 0 || nx >= width || nz < 0 || nz >= height) continue;
      const k = key(nx, nz); if (visited.has(k)) continue;
      const np = point(k);
      if (collides(s, np.x, np.z) || collides(s, (np.x + p.x) / 2, (np.z + p.z) / 2)) continue;
      const cost = costs.get(at) + Math.hypot(dx, dz) * cell + (floorHeight(s,np.x,np.z)<water+.06?1.8:0);
      if (cost < (costs.get(k) ?? Infinity)) { costs.set(k, cost); prev.set(k, at); open.push(k); }
    }
  }
  const path = []; let k = best;
  while (k !== start && prev.has(k)) { path.push(point(k)); k = prev.get(k); }
  return { points: path.reverse(), reachable: bestD < .65 };
}
