// 关卡：火鸡一路赶往「火鸡赦免大会」的六站，每站一个感恩节场景 + 一个新玩法
// theme 决定场景、天空和光照；pool 是本关可能出现的危险；intro 是本关首次登场的新元素（开头就安排一次）
// 难度梯度：speed 跑速、haz 危险移动快慢、gap 羽毛段间距（越小越密）、choice 动脑门概率、
//          choiceBad 是否出现“两扇红门取其轻”、double 连续两个危险的概率、par 本关目标羽毛数
export const LEVELS = [
  {
    id: 'farm', par: 60, name: '晨光农场', emoji: '🌾', theme: 'farm', seed: 158, length: 300,
    sub: '出发！沿着农场红毯一路收集羽毛',
    intro: null, pool: ['scissors', 'chef'], gates: 't1',
    speed: 9.5, haz: 1.0, gap: 1.0, choice: 0, double: 0,
  },
  {
    id: 'pumpkin', par: 78, name: '南瓜丰收田', emoji: '🍂', theme: 'pumpkin', seed: 149, length: 330,
    sub: '新：滚动的大南瓜！还有装满羽毛的丰收角',
    intro: 'pumpkin', pool: ['scissors', 'pumpkin', 'chef', 'pumpkin'], gates: 't2', horn: true,
    speed: 10.0, haz: 1.08, gap: 0.95, choice: 0.2, double: 0,
  },
  {
    id: 'bog', par: 100, name: '蔓越莓湿地', emoji: '🍒', theme: 'bog', seed: 4, length: 350,
    sub: '新：会左右滑动的门，看准时机再穿过',
    intro: 'slide', pool: ['pumpkin', 'scissors', 'chef', 'scissors'], gates: 't3', horn: true, slide: 0.5,
    speed: 10.6, haz: 1.16, gap: 0.9, choice: 0.3, choiceBad: true, double: 0.15,
  },
  {
    id: 'town', par: 122, name: '小镇游行大街', emoji: '🎈', theme: 'town', seed: 85, length: 370,
    sub: '新：围观群众扔南瓜派！看地上的红圈',
    intro: 'pie', pool: ['pie', 'scissors', 'chef', 'pie', 'pumpkin'], gates: 't4', horn: true, slide: 0.4,
    speed: 11.2, haz: 1.25, gap: 0.85, choice: 0.35, choiceBad: true, double: 0.3,
  },
  {
    id: 'fair', par: 148, name: '丰收夜集市', emoji: '🎡', theme: 'fair', seed: 139, length: 390,
    sub: '更快、更密，门上还要算账：×3 还是 +20？',
    intro: null, pool: ['pumpkin', 'pie', 'chef', 'scissors', 'pie'], gates: 't5', horn: true, slide: 0.5,
    speed: 11.8, haz: 1.35, gap: 0.8, choice: 0.4, choiceBad: true, double: 0.5,
  },
  {
    id: 'gala', par: 176, name: '赦免大会主会场', emoji: '🏛️', theme: 'gala', seed: 44, length: 410,
    sub: '第一章终点！危险接二连三，全场最美才能被赦免',
    intro: null, pool: ['chef', 'pie', 'pumpkin', 'scissors', 'chef', 'pie'], gates: 't6', horn: true, slide: 0.6,
    speed: 12.4, haz: 1.45, gap: 0.75, choice: 0.45, choiceBad: true, double: 0.75,
  },
  // ---------- 第二章：感恩节当天（被赦免的火鸡回去救伙伴） ----------
  {
    id: 'float', par: 194, name: '花车大道', emoji: '🎺', theme: 'float', seed: 150, length: 420, chapter: 2, stage: '感恩节大游行',
    sub: '第二章！冲上花车跳台飞起来，空中羽毛、地上一排南瓜派都在等你',
    intro: 'ramp', pool: ['pie', 'scissors', 'chef', 'pumpkin'], gates: 't7', horn: true, slide: 0.4,
    speed: 11.8, haz: 1.4, gap: 0.85, choice: 0.4, choiceBad: true, double: 0.4, ramp: 0.75, rampHaz: 'pie',
  },
  {
    id: 'table', par: 205, name: '巨人餐桌', emoji: '🍽️', theme: 'table', seed: 17, length: 430, chapter: 2, stage: '感恩节大餐',
    sub: '跑上感恩节大餐桌！肉汁会打滑、土豆泥会黏脚、叉子从天而降',
    intro: 'zone', pool: ['fork', 'mash', 'fork', 'scissors', 'fork'], gates: 't8', horn: true, slide: 0.4,
    speed: 12.0, haz: 1.45, gap: 0.82, choice: 0.45, choiceBad: true, double: 0.45, zone: { kind: 'gravy', len: 16, p: 0.45 }, ramp: 0.2, rampHaz: 'mash',
  },
  {
    id: 'rescue', par: 220, name: '货车大营救', emoji: '🚚', theme: 'rescue', seed: 89, length: 440, chapter: 2, stage: '伙伴大团圆',
    sub: '撞开笼子救出小火鸡！伙伴会替你挡危险，终点每只送 3 根羽毛',
    intro: 'cage', pool: ['chef', 'scissors', 'pumpkin', 'chef'], gates: 't9', horn: true, slide: 0.5,
    speed: 12.4, haz: 1.5, gap: 0.8, choice: 0.45, choiceBad: true, double: 0.5, cage: 0.6,
  },
  {
    id: 'escape', par: 230, name: '午夜大逃亡', emoji: '❄️', theme: 'escape', seed: 53, length: 460, chapter: 2, stage: '火鸡自由啦！',
    sub: '最终关！大厨在后面追，吃金玉米冲刺甩开他；冰面打滑、跳台、笼子全都来',
    intro: null, pool: ['scissors', 'pumpkin', 'chef', 'scissors', 'pumpkin'], gates: 't10', horn: true, slide: 0.5,
    speed: 12.8, haz: 1.6, gap: 0.78, choice: 0.45, choiceBad: true, double: 0.7,
    zone: { kind: 'ice', len: 18, p: 0.4 }, ramp: 0.35, cage: 0.2, corn: 0.9, chase: { start: 13, rate: 1.25 },
  },
];
