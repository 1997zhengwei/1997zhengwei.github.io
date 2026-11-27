// 感恩节排座位 · 数据：座位、菜品、亲戚、关卡
// 坐标：餐桌沿 z 轴，z 小的一端在画面上方（远处），z 大的一端靠近镜头。

export const ROW_Z = { 1: -2.4, 2: -0.8, 3: 0.8, 4: 2.4 };

export const SEATS = [
  { id: 'H0', side: 'H', row: 1, x: 0, z: -4.05, face: 0 },
  { id: 'L1', side: 'L', row: 1, x: -1.75, z: ROW_Z[1], face: Math.PI / 2 },
  { id: 'R1', side: 'R', row: 1, x: 1.75, z: ROW_Z[1], face: -Math.PI / 2 },
  { id: 'L2', side: 'L', row: 2, x: -1.75, z: ROW_Z[2], face: Math.PI / 2 },
  { id: 'R2', side: 'R', row: 2, x: 1.75, z: ROW_Z[2], face: -Math.PI / 2 },
  { id: 'L3', side: 'L', row: 3, x: -1.75, z: ROW_Z[3], face: Math.PI / 2 },
  { id: 'R3', side: 'R', row: 3, x: 1.75, z: ROW_Z[3], face: -Math.PI / 2 },
  { id: 'L4', side: 'L', row: 4, x: -1.75, z: ROW_Z[4], face: Math.PI / 2 },
  { id: 'R4', side: 'R', row: 4, x: 1.75, z: ROW_Z[4], face: -Math.PI / 2 },
  { id: 'H5', side: 'H', row: 4, x: 0, z: 4.05, face: Math.PI },
];
export const SEAT = Object.fromEntries(SEATS.map((s) => [s.id, s]));
export const HEAD_SEATS = ['H0', 'H5'];

// 邻座：同侧左右、正对面、桌头与两侧第一位。
const ADJ = [
  ['L1', 'L2'], ['L2', 'L3'], ['L3', 'L4'],
  ['R1', 'R2'], ['R2', 'R3'], ['R3', 'R4'],
  ['L1', 'R1'], ['L2', 'R2'], ['L3', 'R3'], ['L4', 'R4'],
  ['H0', 'L1'], ['H0', 'R1'], ['H5', 'L4'], ['H5', 'R4'],
];
export const NEIGHBORS = Object.fromEntries(SEATS.map((s) => [s.id, []]));
for (const [a, b] of ADJ) { NEIGHBORS[a].push(b); NEIGHBORS[b].push(a); }
export const ADJ_PAIRS = ADJ;

// 暖炉在右上角，小狗窝在左下角。
export const WARM_SEATS = ['R1', 'H0'];
export const DOG_SEATS = ['L4', 'H5'];

export const DISHES = {
  pie: { name: '南瓜派', icon: '🥧', color: 0xe08a2e },
  turkey: { name: '烤火鸡', icon: '🍗', color: 0xb8692f },
  potato: { name: '土豆泥', icon: '🥔', color: 0xf3e3b5 },
  cranberry: { name: '蔓越莓酱', icon: '🍒', color: 0xc0213b },
  corn: { name: '烤玉米', icon: '🌽', color: 0xf2c230 },
};

// look: 外观参数，交给 models.mjs 建模
export const PEOPLE = {
  grandma: {
    name: '奶奶', title: '和事佬',
    look: { skin: 0xf3c9a8, shirt: 0x8e5aa8, hair: 0xe9e6e2, hairStyle: 'bun', glasses: true, height: 0.92, width: 1.08 },
    rules: [
      { type: 'likeDish', dish: 'pie' },
      { type: 'likeWarm' },
      { type: 'likePerson', who: 'girl' },
    ],
    traits: { peacemaker: true },
  },
  grandpa: {
    name: '爷爷', title: '一家之主',
    look: { skin: 0xe9b995, shirt: 0x5b6f4a, hair: 0xd9d9d6, hairStyle: 'bald', beard: true, height: 0.98, width: 1.05, hat: 'flat' },
    rules: [
      { type: 'likeHead' },
      { type: 'hateDog' },
    ],
  },
  dad: {
    name: '老爸', title: '火鸡大厨',
    look: { skin: 0xeab48f, shirt: 0x3f6fb0, hair: 0x4a3222, hairStyle: 'short', height: 1.05, width: 1.08, apron: true },
    rules: [
      { type: 'likeDish', dish: 'turkey' },
      { type: 'likePerson', who: 'grandpa' },
    ],
  },
  mom: {
    name: '老妈', title: '操心总管',
    look: { skin: 0xf0c09c, shirt: 0xd2553f, hair: 0x7a3b1e, hairStyle: 'long', height: 1.0, width: 1.0 },
    rules: [
      { type: 'likePerson', who: 'boy' },
      { type: 'likeDish', dish: 'cranberry' },
    ],
  },
  uncle: {
    name: '大伯', title: '急脾气',
    look: { skin: 0xe2a882, shirt: 0xb83a2e, hair: 0x2d2018, hairStyle: 'short', mustache: true, height: 1.08, width: 1.22, cap: 0x2a4a8a },
    rules: [
      { type: 'hatePerson', who: 'cousin' },
      { type: 'hateWarm' },
      { type: 'likeDish', dish: 'turkey' },
    ],
    traits: { temper: true },
  },
  cousin: {
    name: '表哥', title: '辩论社社长',
    look: { skin: 0xf1c6a2, shirt: 0x2f8f7d, hair: 0x1d1a18, hairStyle: 'spiky', glasses: true, height: 1.04, width: 0.95 },
    rules: [
      { type: 'hatePerson', who: 'uncle' },
      { type: 'likeDish', dish: 'potato' },
      { type: 'likePerson', who: 'grandma' },
    ],
  },
  girl: {
    name: '小妹', title: '狗狗头号粉丝',
    look: { skin: 0xf5cfae, shirt: 0xf08bb0, hair: 0x6a3a1c, hairStyle: 'pigtails', height: 0.8, width: 0.86, bow: 0xe8425a },
    rules: [
      { type: 'likeDog' },
      { type: 'hatePerson', who: 'boy' },
      { type: 'likePerson', who: 'grandma' },
    ],
  },
  boy: {
    name: '小弟', title: '手滑大王',
    look: { skin: 0xf2c7a4, shirt: 0xf2b630, hair: 0x3a2618, hairStyle: 'messy', height: 0.78, width: 0.86 },
    rules: [
      { type: 'likeDog' },
      { type: 'hatePerson', who: 'girl' },
    ],
    traits: { clumsy: true },
  },
  aunt: {
    name: '姑姑', title: '坚定素食者',
    look: { skin: 0xf0c3a0, shirt: 0x4f9a5a, hair: 0xb8562a, hairStyle: 'curly', height: 1.0, width: 0.98, earrings: true },
    rules: [
      { type: 'hateDish', dish: 'turkey' },
      { type: 'likeDish', dish: 'cranberry' },
    ],
  },
  sis: {
    name: '表姐', title: '带男友回家',
    look: { skin: 0xf3cba9, shirt: 0xf07a3a, hair: 0x2b1b12, hairStyle: 'bob', height: 0.98, width: 0.94 },
    rules: [
      { type: 'likePerson', who: 'bf' },
      { type: 'likePerson', who: 'grandma' },
    ],
  },
  bf: {
    name: '阿杰', title: '表姐的男友',
    look: { skin: 0xd9a27a, shirt: 0xe8e3d6, hair: 0x15110e, hairStyle: 'side', height: 1.06, width: 0.95, tie: 0x2a4a8a },
    rules: [
      { type: 'likePerson', who: 'sis' },
      { type: 'hatePerson', who: 'uncle' },
    ],
  },
};

// mode: harmony 和睦晚宴；chaos 食物大战
// goal(chaos): stars[i] 为达到 i+1 星需要卷入的人数；protect 为三星附加条件
export const LEVELS = [
  {
    id: 1, tip: [{ p: 'uncle' }, '⚡', { p: 'cousin' }, '一挨着就开吵！隔开他俩（对面也算挨着）'], name: '小小家宴', mode: 'harmony',
    intro: '大伯和表哥一见面就吵。别让他们挨着坐（旁边、正对面都算挨着）。',
    seats: ['L2', 'R2', 'L3', 'R3'],
    dishes: { 2: 'pie', 3: 'turkey' },
    people: ['grandma', 'dad', 'uncle', 'cousin'],
  },
  {
    id: 2, tip: [{ p: 'grandma' }, '❤️🔥', { p: 'uncle' }, '🚫🔥', { p: 'grandpa' }, '❤️👑', { p: 'aunt' }, '🚫🍗'], name: '怕冷的奶奶', mode: 'harmony',
    intro: '右上角的暖炉很暖和：奶奶喜欢，大伯嫌热。爷爷想坐桌头主位。',
    seats: ['H0', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3'],
    dishes: { 1: 'pie', 2: 'turkey', 3: 'cranberry' },
    people: ['grandma', 'grandpa', 'dad', 'uncle', 'cousin', 'aunt'],
  },
  {
    id: 3, tip: [{ p: 'girl' }, '❤️🐶', { p: 'boy' }, '❤️🐶', '可他俩', '⚡', '！'], name: '孩子们来了', mode: 'harmony',
    intro: '左下角是狗狗豆豆的窝。两个小家伙都想挨着狗，可他们互相看不顺眼。',
    seats: ['L1', 'R1', 'L2', 'R2', 'L3', 'R3', 'L4', 'R4'],
    dishes: { 1: 'pie', 2: 'turkey', 3: 'potato', 4: 'cranberry' },
    people: ['grandma', 'mom', 'dad', 'girl', 'boy', 'uncle', 'cousin'],
  },
  {
    id: 4, tip: ['🔥 反过来！让', '💣', '越多越好，被砸的人会还手', { p: 'boy' }, '🌀会砸歪'], name: '第一次食物大战', mode: 'chaos',
    intro: '这回反着来：被砸中的人会生气并还手，小弟手滑会砸偏。让尽量多的人卷进来！',
    seats: ['L1', 'R1', 'L2', 'R2', 'L3', 'R3'],
    dishes: { 1: 'potato', 2: 'turkey', 3: 'cranberry' },
    people: ['mom', 'dad', 'uncle', 'cousin', 'girl', 'boy'],
    goal: { stars: [4, 5, 6] },
  },
  {
    id: 5, tip: [{ p: 'aunt' }, '🚫🍗', { p: 'grandpa' }, '🚫🐶', '10 个座位挑着坐'], name: '素食姑姑', mode: 'harmony',
    intro: '姑姑吃素，坐在烤火鸡旁会很难受。爷爷怕狗毛。',
    seats: ['H0', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3', 'L4', 'R4', 'H5'],
    dishes: { 1: 'pie', 2: 'turkey', 3: 'cranberry', 4: 'potato' },
    people: ['grandma', 'grandpa', 'dad', 'mom', 'aunt', 'uncle', 'cousin', 'girl'],
  },
  {
    id: 6, tip: [{ p: 'bf' }, '⚡', { p: 'uncle' }, { p: 'sis' }, '❤️', { p: 'bf' }, '满座！'], name: '新男友上门', mode: 'harmony',
    intro: '表姐第一次带男友阿杰回家。阿杰最怕被大伯盘问。满桌十个人，一个空位都没有！',
    seats: ['H0', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3', 'L4', 'R4', 'H5'],
    dishes: { 1: 'pie', 2: 'turkey', 3: 'potato', 4: 'cranberry' },
    people: ['grandma', 'grandpa', 'dad', 'mom', 'uncle', 'cousin', 'aunt', 'sis', 'bf', 'girl'],
  },
  {
    id: 7, tip: ['🎯 让 7 人开打', '+', { p: 'grandma' }, '🛡️ 别砸到奶奶'], name: '全面开战', mode: 'chaos',
    intro: '终极食物大战！奶奶开心时会劝架，三星要让她全程不被砸中。',
    seats: ['H0', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3', 'L4', 'R4', 'H5'],
    dishes: { 1: 'corn', 2: 'turkey', 3: 'potato', 4: 'cranberry' },
    people: ['grandma', 'grandpa', 'dad', 'mom', 'uncle', 'cousin', 'girl', 'boy', 'sis', 'bf'],
    goal: { stars: [5, 6, 7], protect: 'grandma' },
  },
];
