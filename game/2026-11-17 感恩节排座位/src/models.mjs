// 程序化三维模型：房间、餐桌、椅子、菜品、亲戚、小狗
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/geometries/RoundedBoxGeometry.js';
import { SEATS, ROW_Z, DISHES } from './data.mjs';

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0, ...opts }));
  return matCache.get(key);
}

function mesh(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

function woodFloorTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    const colors = ['#9a5f35', '#a86a3c', '#8f5630', '#b07445', '#9c6238'];
    const plank = 64;
    for (let i = 0; i < w / plank; i++) {
      for (let j = 0; j < 4; j++) {
        const off = (i % 2) * 64;
        g.fillStyle = colors[(i * 3 + j * 2) % colors.length];
        g.fillRect(i * plank, j * 128 + off - 128, plank, 128);
        g.fillRect(i * plank, j * 128 + off, plank, 128);
      }
    }
    g.globalAlpha = 0.18;
    for (let k = 0; k < 220; k++) {
      g.strokeStyle = k % 2 ? '#5c341b' : '#c98b56';
      g.beginPath();
      const x = Math.random() * w, y = Math.random() * h;
      g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 6, y + 30 + Math.random() * 60);
      g.stroke();
    }
    g.globalAlpha = 0.55;
    g.strokeStyle = '#4a2814'; g.lineWidth = 3;
    for (let i = 0; i <= w / plank; i++) { g.beginPath(); g.moveTo(i * plank, 0); g.lineTo(i * plank, h); g.stroke(); }
  }, [5, 5]);
}

function wallpaperTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#e9d3a8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#dcbf8c';
    for (let i = 0; i < 8; i++) g.fillRect(i * 32 + 12, 0, 8, h);
    g.fillStyle = '#c9773c';
    for (let y = 16; y < h; y += 64) for (let x = 16; x < w; x += 64) {
      g.save(); g.translate(x + ((y / 64) % 2) * 32, y); g.rotate(0.6);
      g.beginPath(); g.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2); g.fill(); g.restore();
    }
  }, [6, 2]);
}

function clothTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#f6ead2'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(196,92,46,0.18)';
    for (let i = 0; i < w; i += 32) { g.fillRect(i, 0, 14, h); g.fillRect(0, i, w, 14); }
  }, [2, 5]);
}

// ---------- 房间 ----------
export function buildRoom(scene) {
  const room = new THREE.Group();
  const floor = mesh(new THREE.PlaneGeometry(14, 16), new THREE.MeshStandardMaterial({ map: woodFloorTexture(), roughness: 0.8 }), { rx: -Math.PI / 2, cast: false, receive: true });
  room.add(floor);

  // 地毯
  const rug = mesh(new RoundedBoxGeometry(6.4, 0.04, 10.6, 2, 0.02), mat(0x7a2e2a), { y: 0.02, cast: false, receive: true });
  const rugIn = mesh(new RoundedBoxGeometry(5.8, 0.05, 10.0, 2, 0.02), mat(0xb5582f), { y: 0.025, cast: false, receive: true });
  room.add(rug, rugIn);

  const wallMat = new THREE.MeshStandardMaterial({ map: wallpaperTexture(), roughness: 0.9 });
  const back = mesh(new THREE.PlaneGeometry(14, 5), wallMat, { y: 2.5, z: -6.6, cast: false, receive: true });
  const left = mesh(new THREE.PlaneGeometry(16, 5), wallMat, { x: -5.4, y: 2.5, ry: Math.PI / 2, cast: false, receive: true });
  const right = mesh(new THREE.PlaneGeometry(16, 5), wallMat, { x: 5.4, y: 2.5, ry: -Math.PI / 2, cast: false, receive: true });
  room.add(back, left, right);
  // 护墙板
  const wainMat = mat(0x6b3b22);
  room.add(mesh(new THREE.BoxGeometry(14, 1.1, 0.12), wainMat, { y: 0.55, z: -6.55, receive: true }));
  room.add(mesh(new THREE.BoxGeometry(0.12, 1.1, 16), wainMat, { x: -5.35, y: 0.55, receive: true }));
  room.add(mesh(new THREE.BoxGeometry(0.12, 1.1, 16), wainMat, { x: 5.35, y: 0.55, receive: true }));

  // 后墙窗户（秋天的院子）
  const view = canvasTexture(256, 160, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#f7b267'); grd.addColorStop(0.6, '#f4845f'); grd.addColorStop(1, '#c75146');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const tree = (x, y, r, c) => { g.fillStyle = '#5a3420'; g.fillRect(x - 3, y, 6, 50); g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
    tree(40, 90, 34, '#d9481e'); tree(120, 80, 40, '#e8a33a'); tree(205, 95, 32, '#b8341b');
    g.fillStyle = '#6b8f3a'; g.fillRect(0, 135, w, 25);
  });
  for (const wx of [-2.6, 2.6]) {
    const frame = mesh(new RoundedBoxGeometry(2.3, 1.9, 0.18, 2, 0.05), mat(0xf3ead6), { x: wx, y: 2.75, z: -6.52 });
    const glass = mesh(new THREE.PlaneGeometry(2.0, 1.6), new THREE.MeshBasicMaterial({ map: view }), { x: wx, y: 2.75, z: -6.41, cast: false });
    const bar1 = mesh(new THREE.BoxGeometry(0.08, 1.6, 0.06), mat(0xf3ead6), { x: wx, y: 2.75, z: -6.38 });
    const bar2 = mesh(new THREE.BoxGeometry(2.0, 0.08, 0.06), mat(0xf3ead6), { x: wx, y: 2.75, z: -6.38 });
    room.add(frame, glass, bar1, bar2);
  }

  // 彩旗挂饰
  const flagColors = [0xd9481e, 0xf2b630, 0x8a3b1e, 0x6b8f3a, 0xe8742c];
  for (let i = 0; i < 15; i++) {
    const t = i / 14;
    const x = -5 + t * 10;
    const y = 4.3 - Math.sin(t * Math.PI) * 0.5;
    const flag = mesh(new THREE.ConeGeometry(0.2, 0.42, 3), mat(flagColors[i % 5]), { x, y: y - 0.2, z: -6.45, rz: Math.PI });
    room.add(flag);
  }

  // 暖炉（右上角）
  const fire = new THREE.Group();
  fire.position.set(3.95, 0, -5.4);
  fire.rotation.y = -0.55;
  fire.add(mesh(new RoundedBoxGeometry(2.4, 2.2, 0.8, 2, 0.06), mat(0xa04a32), { y: 1.1 }));
  fire.add(mesh(new RoundedBoxGeometry(2.8, 0.22, 1.0, 2, 0.05), mat(0x5a3020), { y: 2.25 }));
  fire.add(mesh(new THREE.BoxGeometry(1.3, 1.0, 0.5), mat(0x1c120e), { y: 0.65, z: 0.2 }));
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa23a });
  const flameMat2 = new THREE.MeshBasicMaterial({ color: 0xffe07a });
  const flames = [];
  for (let i = 0; i < 3; i++) {
    const f = mesh(new THREE.ConeGeometry(0.2, 0.6, 8), flameMat, { x: -0.3 + i * 0.3, y: 0.55, z: 0.35, cast: false });
    const f2 = mesh(new THREE.ConeGeometry(0.1, 0.35, 8), flameMat2, { x: -0.3 + i * 0.3, y: 0.48, z: 0.45, cast: false });
    flames.push(f, f2); fire.add(f, f2);
  }
  for (let i = 0; i < 3; i++) fire.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), mat(0x6b3b22), { y: 0.25, z: 0.3, rz: Math.PI / 2, ry: (i - 1) * 0.4 }));
  // 炉台小南瓜
  fire.add(mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(0xe8742c), { x: -0.8, y: 2.55, sy: 0.75 }));
  fire.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), mat(0xf2b630), { x: 0.85, y: 2.5, sy: 0.75 }));
  const fireLight = new THREE.PointLight(0xff8a3a, 6, 7, 1.6);
  fireLight.position.set(0, 0.9, 1.0);
  fire.add(fireLight);
  room.add(fire);
  // 暖意光圈
  const warmGlow = mesh(new THREE.CircleGeometry(1.9, 40), new THREE.MeshBasicMaterial({ color: 0xff9a3a, transparent: true, opacity: 0.16, depthWrite: false }), { x: 2.6, y: 0.05, z: -3.9, rx: -Math.PI / 2, cast: false });
  room.add(warmGlow);

  // 狗窝（左下角）
  const bed = new THREE.Group();
  bed.position.set(-2.6, 0, 4.25);
  bed.add(mesh(new THREE.TorusGeometry(0.62, 0.2, 10, 24), mat(0x3f6fb0), { y: 0.2, rx: Math.PI / 2 }));
  bed.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 24), mat(0xf3ead6), { y: 0.1 }));
  room.add(bed);

  // 角落装饰：草垛、玉米束、南瓜
  const hay = mesh(new RoundedBoxGeometry(1.4, 0.8, 0.9, 2, 0.12), mat(0xe2b85a), { x: -4.3, y: 0.4, z: -5.4, ry: 0.3 });
  room.add(hay);
  for (const [x, z, r, c] of [[-4.0, -4.6, 0.38, 0xe8742c], [-4.7, -4.4, 0.28, 0xd9481e], [4.5, 4.8, 0.36, 0xe8742c], [3.9, 5.3, 0.25, 0xf2b630]]) {
    room.add(mesh(new THREE.SphereGeometry(r, 16, 12), mat(c), { x, y: r * 0.7, z, sy: 0.75 }));
    room.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 6), mat(0x4f6b2a), { x, y: r * 1.25, z }));
  }
  for (let i = 0; i < 3; i++) {
    room.add(mesh(new THREE.CapsuleGeometry(0.1, 0.9, 4, 8), mat(0xe2b03a), { x: -4.9 + i * 0.12, y: 1.2, z: -6.3, rz: (i - 1) * 0.15 }));
  }
  scene.add(room);
  return { room, flames, fireLight };
}

// ---------- 餐桌与座椅 ----------
export function buildTable(scene) {
  const g = new THREE.Group();
  const wood = mat(0x7a4426);
  g.add(mesh(new RoundedBoxGeometry(3.0, 0.16, 8.0, 3, 0.06), wood, { y: 1.02, receive: true }));
  const cloth = new THREE.MeshStandardMaterial({ map: clothTexture(), roughness: 0.95 });
  g.add(mesh(new THREE.BoxGeometry(3.1, 0.03, 8.1), cloth, { y: 1.115, receive: true }));
  g.add(mesh(new THREE.BoxGeometry(1.0, 0.035, 8.12), mat(0xb5402a), { y: 1.13, receive: true }));
  for (const [x, z] of [[-1.25, -3.6], [1.25, -3.6], [-1.25, 3.6], [1.25, 3.6], [-1.25, 0], [1.25, 0]]) {
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.08, 1.0, 10), wood, { x, y: 0.5, z }));
  }
  // 蜡烛
  const candles = [];
  for (const z of [-1.6, 1.6]) {
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.08, 14), mat(0xc9a45a, { metalness: 0.6, roughness: 0.3 }), { y: 1.18, z }));
    for (const dx of [-0.12, 0.12]) {
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 10), mat(0xf6ead2), { x: dx, y: 1.42, z }));
      const flame = mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffc35a }), { x: dx, y: 1.67, z, sy: 1.6, cast: false });
      candles.push(flame); g.add(flame);
    }
    const l = new THREE.PointLight(0xffb35a, 1.6, 3.5, 2);
    l.position.set(0, 1.9, z);
    g.add(l);
  }
  scene.add(g);
  return { table: g, candles };
}

function buildTurkeyCenterpiece() {
  const t = new THREE.Group();
  t.add(mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.08, 24), mat(0xf3ead6), { y: 0.04 }));
  t.add(mesh(new THREE.SphereGeometry(0.42, 20, 16), mat(0xb8692f, { roughness: 0.45 }), { y: 0.3, sx: 1.15, sy: 0.75 }));
  for (const s of [-1, 1]) {
    t.add(mesh(new THREE.CapsuleGeometry(0.1, 0.25, 4, 8), mat(0xa85a28, { roughness: 0.45 }), { x: s * 0.25, y: 0.42, z: 0.32, rx: 1.1, rz: s * 0.4 }));
    t.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0xf6ead2), { x: s * 0.33, y: 0.55, z: 0.48 }));
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    t.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(i % 2 ? 0x6b8f3a : 0xc0213b), { x: Math.cos(a) * 0.55, y: 0.1, z: Math.sin(a) * 0.55 }));
  }
  return t;
}

function buildChair() {
  const c = new THREE.Group();
  const wood = mat(0x8a4f2c);
  c.add(mesh(new RoundedBoxGeometry(0.78, 0.1, 0.72, 2, 0.03), wood, { y: 0.62 }));
  c.add(mesh(new RoundedBoxGeometry(0.66, 0.06, 0.6, 2, 0.02), mat(0xc0583a), { y: 0.69 }));
  c.add(mesh(new RoundedBoxGeometry(0.78, 1.0, 0.1, 2, 0.03), wood, { y: 1.1, z: -0.34 }));
  c.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.06), mat(0xd9a05a), { y: 1.4, z: -0.3 }));
  for (const [x, z] of [[-0.32, -0.3], [0.32, -0.3], [-0.32, 0.3], [0.32, 0.3]]) c.add(mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.62, 8), wood, { x, y: 0.31, z }));
  return c;
}

// 每个座位：椅子、餐盘、选择光环、点击碰撞体
export function buildSeats(scene) {
  const seats = {};
  const ringGeo = new THREE.RingGeometry(0.5, 0.62, 40);
  const hitGeo = new THREE.CylinderGeometry(0.62, 0.62, 2.2, 12);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  for (const s of SEATS) {
    const root = new THREE.Group();
    root.position.set(s.x, 0, s.z);
    // face: 人物朝向餐桌的方向（绕 y 轴）。椅背在人物背后。
    root.rotation.y = s.face;
    const chair = buildChair();
    root.add(chair);
    const ring = mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }), { y: 0.03, rx: -Math.PI / 2, cast: false });
    root.add(ring);
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.position.y = 1.1;
    hit.userData.seatId = s.id;
    root.add(hit);
    // 餐盘放在桌上（世界坐标，朝桌心方向偏移）
    const plate = new THREE.Group();
    const toward = new THREE.Vector3(-s.x, 0, -s.z).setY(0);
    if (s.side === 'H') toward.set(0, 0, -Math.sign(s.z));
    else toward.set(-Math.sign(s.x), 0, 0);
    plate.position.set(s.x + toward.x * 0.95, 1.13, s.z + toward.z * 0.95);
    plate.add(mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.04, 22), mat(0xfbf6ea), { y: 0.02 }));
    plate.add(mesh(new THREE.TorusGeometry(0.26, 0.012, 6, 28), mat(0xc9a45a, { metalness: 0.5, roughness: 0.4 }), { y: 0.042, rx: Math.PI / 2, cast: false }));
    plate.add(mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0xd8eef0, transparent: true, opacity: 0.55, roughness: 0.1 }), { x: 0.36 * (toward.z !== 0 ? 1 : 0), z: 0.36 * (toward.x !== 0 ? -toward.x : 0), y: 0.12 }));
    scene.add(root, plate);
    seats[s.id] = { def: s, root, chair, ring, hit, plate };
  }
  return seats;
}

// 每排的菜品（放在桌子中线两侧）
export function buildDish(type) {
  const g = new THREE.Group();
  const d = DISHES[type];
  g.add(mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.06, 22), mat(0xfbf6ea), { y: 0.03 }));
  if (type === 'pie') {
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.27, 0.1, 24), mat(0xc98a4a), { y: 0.1 }));
    g.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 24), mat(d.color, { roughness: 0.5 }), { y: 0.15 }));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.04, 8, 6), mat(0xfff6e0), { x: Math.cos(a) * 0.15, y: 0.18, z: Math.sin(a) * 0.15 })); }
  } else if (type === 'turkey') {
    g.clear();
    const t = buildTurkeyCenterpiece();
    t.scale.setScalar(0.82);
    g.add(t);
    return g;
  } else if (type === 'potato') {
    g.add(mesh(new THREE.SphereGeometry(0.24, 16, 12), mat(d.color, { roughness: 0.9 }), { y: 0.08, sy: 0.55 }));
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.03, 0.1), mat(0xf6d55c), { y: 0.21, ry: 0.5 }));
  } else if (type === 'cranberry') {
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.14, 18), new THREE.MeshStandardMaterial({ color: 0xdfe9ef, transparent: true, opacity: 0.6, roughness: 0.15 }), { y: 0.1 }));
    g.add(mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.1, 18), mat(d.color, { roughness: 0.25 }), { y: 0.1 }));
  } else if (type === 'corn') {
    for (let i = -1; i <= 1; i++) g.add(mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 10), mat(d.color, { roughness: 0.5 }), { x: i * 0.15, y: 0.1, rx: Math.PI / 2 }));
  }
  return g;
}

export function placeDishes(scene, level, holder) {
  if (holder.group) scene.remove(holder.group);
  const g = new THREE.Group();
  for (const row in level.dishes) {
    const type = level.dishes[row];
    const d = buildDish(type);
    d.position.set(0, 1.13, ROW_Z[row]);
    if (type !== 'turkey') d.scale.setScalar(1.25);
    g.add(d);
  }
  scene.add(g);
  holder.group = g;
  return g;
}

// ---------- 人物 ----------
// 返回 { root, body, head, armL, armR, face parts, splats } 便于动画
export function buildPerson(look) {
  const root = new THREE.Group();
  const scale = look.height;
  const body = new THREE.Group();
  root.add(body);
  const shirt = mat(look.shirt, { roughness: 0.8 });
  const skin = mat(look.skin, { roughness: 0.6 });
  const hairM = mat(look.hair, { roughness: 0.85 });

  // 坐姿：腿朝前（+z 为人物前方）
  const pants = mat(0x3b3550);
  for (const s of [-1, 1]) {
    body.add(mesh(new THREE.CapsuleGeometry(0.11, 0.32, 4, 8), pants, { x: s * 0.13, y: 0.78, z: 0.2, rx: Math.PI / 2 }));
    body.add(mesh(new THREE.CapsuleGeometry(0.1, 0.36, 4, 8), pants, { x: s * 0.13, y: 0.45, z: 0.4 }));
    body.add(mesh(new RoundedBoxGeometry(0.16, 0.1, 0.26, 2, 0.04), mat(0x2a201c), { x: s * 0.13, y: 0.06, z: 0.46 }));
  }
  // 躯干
  const torso = mesh(new THREE.CapsuleGeometry(0.3 * look.width, 0.42, 6, 14), shirt, { y: 1.18, sz: 0.85 });
  body.add(torso);
  if (look.apron) body.add(mesh(new RoundedBoxGeometry(0.42, 0.5, 0.06, 2, 0.03), mat(0xf6ead2), { y: 1.1, z: 0.25 }));
  if (look.tie) body.add(mesh(new THREE.BoxGeometry(0.08, 0.32, 0.04), mat(look.tie), { y: 1.3, z: 0.27 }));
  body.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 10), skin, { y: 1.55 }));

  // 手臂：肩部枢轴，便于举杯/扔东西
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * (0.3 * look.width + 0.08), 1.42, 0);
    const upper = mesh(new THREE.CapsuleGeometry(0.085, 0.36, 4, 8), shirt, { y: -0.24 });
    const hand = mesh(new THREE.SphereGeometry(0.085, 10, 8), skin, { y: -0.5 });
    pivot.add(upper, hand);
    pivot.rotation.x = -0.9; // 默认手放在桌上
    pivot.rotation.z = s * 0.12;
    body.add(pivot);
    arms.push(pivot);
  }

  // 头
  const head = new THREE.Group();
  head.position.y = 1.98;
  head.scale.setScalar(1.38);
  body.add(head);
  const headR = 0.3;
  const skull = mesh(new THREE.SphereGeometry(headR, 22, 18), skin, { sy: 1.02 });
  head.add(skull);
  // 耳朵
  for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), skin, { x: s * 0.29, y: -0.02, sz: 0.6 }));
  // 眼睛
  const eyeWhite = mat(0xffffff, { roughness: 0.3 });
  const pupil = mat(0x1d1a18, { roughness: 0.2 });
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Group();
    e.position.set(s * 0.1, 0.04, 0.26);
    e.add(mesh(new THREE.SphereGeometry(0.062, 12, 10), eyeWhite, { sz: 0.6, cast: false }));
    e.add(mesh(new THREE.SphereGeometry(0.036, 10, 8), pupil, { z: 0.03, cast: false }));
    head.add(e); eyes.push(e);
  }
  // 眉毛
  const brows = [];
  for (const s of [-1, 1]) {
    const b = mesh(new THREE.BoxGeometry(0.1, 0.022, 0.02), mat(look.hairStyle === 'bald' ? 0xbcbcb8 : look.hair), { x: s * 0.1, y: 0.13, z: 0.27, cast: false });
    head.add(b); brows.push(b);
  }
  // 嘴：三种形状切换
  const mouthMat = mat(0x7a2a24, { roughness: 0.5 });
  const smile = mesh(new THREE.TorusGeometry(0.075, 0.017, 6, 16, Math.PI), mouthMat, { y: -0.08, z: 0.275, rz: Math.PI, cast: false });
  const frown = mesh(new THREE.TorusGeometry(0.06, 0.017, 6, 16, Math.PI), mouthMat, { y: -0.13, z: 0.27, cast: false });
  const flat = mesh(new THREE.BoxGeometry(0.1, 0.022, 0.02), mouthMat, { y: -0.1, z: 0.285, cast: false });
  const open = mesh(new THREE.SphereGeometry(0.05, 10, 8), mouthMat, { y: -0.1, z: 0.27, sz: 0.5, cast: false });
  head.add(smile, frown, flat, open);
  // 腮红
  const blushM = new THREE.MeshBasicMaterial({ color: 0xff8a8a, transparent: true, opacity: 0.45 });
  for (const s of [-1, 1]) head.add(mesh(new THREE.CircleGeometry(0.045, 12), blushM, { x: s * 0.17, y: -0.04, z: 0.255, ry: s * 0.5, cast: false }));
  // 鼻子
  head.add(mesh(new THREE.SphereGeometry(0.04, 8, 8), mat(look.skin - 0x0a0a0a > 0 ? look.skin - 0x0a1010 : look.skin), { y: -0.02, z: 0.3, cast: false }));

  // 发型
  const hs = look.hairStyle;
  if (hs !== 'bald') head.add(mesh(new THREE.SphereGeometry(headR * 1.05, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.45), hairM, { y: 0.02, rx: -0.15 }));
  if (hs === 'bun') head.add(mesh(new THREE.SphereGeometry(0.13, 12, 10), hairM, { y: 0.3, z: -0.12 }));
  if (hs === 'long') { head.add(mesh(new RoundedBoxGeometry(0.62, 0.55, 0.22, 2, 0.1), hairM, { y: -0.15, z: -0.14 })); }
  if (hs === 'bob') head.add(mesh(new THREE.SphereGeometry(headR * 1.1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hairM, { y: 0.0, z: -0.04, rx: -0.3 }));
  if (hs === 'pigtails') for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.11, 10, 8), hairM, { x: s * 0.33, y: 0.0, z: -0.05, sy: 1.4 }));
  if (hs === 'spiky') for (let i = 0; i < 5; i++) head.add(mesh(new THREE.ConeGeometry(0.07, 0.18, 6), hairM, { x: (i - 2) * 0.1, y: 0.32, z: -0.02 + (i % 2) * 0.05, rz: (i - 2) * -0.2 }));
  if (hs === 'messy') for (let i = 0; i < 6; i++) head.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), hairM, { x: Math.cos(i) * 0.18, y: 0.27, z: Math.sin(i * 1.7) * 0.15 }));
  if (hs === 'curly') for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; head.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), hairM, { x: Math.cos(a) * 0.27, y: 0.12 + Math.sin(i * 2.1) * 0.05, z: Math.sin(a) * 0.2 - 0.06 })); }
  if (hs === 'side') head.add(mesh(new THREE.SphereGeometry(0.14, 10, 8), hairM, { x: 0.12, y: 0.26, z: 0.1, sx: 1.6, sy: 0.6 }));
  if (hs === 'short') head.add(mesh(new THREE.SphereGeometry(headR * 1.03, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.35), hairM, { y: 0.05, z: -0.02 }));
  if (hs === 'bald') for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.1, 8, 8), hairM, { x: s * 0.26, y: 0.06, z: -0.08, sy: 1.2 }));
  if (look.beard) head.add(mesh(new THREE.SphereGeometry(0.2, 14, 10), hairM, { y: -0.2, z: 0.12, sy: 0.9, sz: 0.8 }));
  if (look.mustache) head.add(mesh(new THREE.CapsuleGeometry(0.03, 0.14, 4, 8), hairM, { y: -0.05, z: 0.29, rz: Math.PI / 2, cast: false }));
  if (look.glasses) {
    const gm = mat(0x2a2a2a, { metalness: 0.4, roughness: 0.3 });
    for (const s of [-1, 1]) head.add(mesh(new THREE.TorusGeometry(0.075, 0.012, 6, 18), gm, { x: s * 0.1, y: 0.04, z: 0.29, cast: false }));
    head.add(mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), gm, { y: 0.05, z: 0.3, cast: false }));
  }
  if (look.bow) { for (const s of [-1, 1]) head.add(mesh(new THREE.ConeGeometry(0.08, 0.14, 4), mat(look.bow), { x: 0.15 + s * 0.08, y: 0.3, z: 0.05, rz: s * Math.PI / 2 })); }
  if (look.cap) { head.add(mesh(new THREE.SphereGeometry(headR * 1.06, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), mat(look.cap), { y: 0.05 })); head.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 18, 1, false, 0, Math.PI), mat(look.cap), { y: 0.16, z: 0.12, ry: -Math.PI / 2 })); }
  if (look.hat === 'flat') { head.add(mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.12, 18), mat(0x6b5a44), { y: 0.26, rx: -0.1 })); head.add(mesh(new THREE.BoxGeometry(0.3, 0.03, 0.15), mat(0x6b5a44), { y: 0.22, z: 0.28 })); }
  if (look.earrings) for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.035, 8, 8), mat(0xf2c230, { metalness: 0.7, roughness: 0.3 }), { x: s * 0.29, y: -0.12 }));

  root.scale.setScalar(scale);
  const parts = { root, body, head, arms, eyes, brows, mouth: { smile, frown, flat, open }, torso };
  // 食物污渍挂在这里
  parts.splatHolder = new THREE.Group();
  head.add(parts.splatHolder);
  return parts;
}

export function setExpression(p, mood) {
  const { smile, frown, flat, open } = p.mouth;
  smile.visible = mood >= 1; frown.visible = mood <= -1; flat.visible = mood === 0; open.visible = false;
  const big = mood >= 3;
  smile.scale.set(big ? 1.3 : 1, big ? 1.4 : 1, 1);
  // 眉毛角度
  const ang = mood <= -1 ? 0.45 : mood === 0 ? 0.12 : -0.1;
  p.brows[0].rotation.z = -ang; p.brows[1].rotation.z = ang;
  p.brows.forEach((b) => (b.position.y = mood <= -1 ? 0.11 : 0.13));
}

export function setMouthOpen(p, on) {
  if (on) { for (const k in p.mouth) p.mouth[k].visible = false; p.mouth.open.visible = true; }
}

// 小狗
export function buildDog() {
  const d = new THREE.Group();
  const fur = mat(0xc98a4a), dark = mat(0x6b3b22);
  d.add(mesh(new THREE.CapsuleGeometry(0.2, 0.4, 6, 12), fur, { y: 0.32, rz: Math.PI / 2, rx: 0 }));
  const head = new THREE.Group(); head.position.set(0.38, 0.52, 0); d.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.19, 14, 12), fur));
  head.add(mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(0xf3ead6), { x: 0.15, y: -0.05, sy: 0.8 }));
  head.add(mesh(new THREE.SphereGeometry(0.035, 8, 8), mat(0x1d1a18), { x: 0.24, y: -0.02 }));
  for (const s of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.03, 8, 8), mat(0x1d1a18), { x: 0.14, y: 0.06, z: s * 0.08 }));
    head.add(mesh(new THREE.CapsuleGeometry(0.06, 0.14, 4, 8), dark, { x: -0.02, y: 0.02, z: s * 0.17, rx: s * 0.3 }));
  }
  for (const [x, z] of [[0.22, 0.1], [0.22, -0.1], [-0.22, 0.1], [-0.22, -0.1]]) d.add(mesh(new THREE.CapsuleGeometry(0.05, 0.14, 4, 8), fur, { x, y: 0.12, z }));
  const tail = new THREE.Group(); tail.position.set(-0.38, 0.4, 0); d.add(tail);
  tail.add(mesh(new THREE.CapsuleGeometry(0.04, 0.2, 4, 8), dark, { y: 0.1, rz: -0.6 }));
  d.add(mesh(new THREE.TorusGeometry(0.13, 0.03, 6, 16), mat(0xd9481e), { x: 0.3, y: 0.42, ry: Math.PI / 2, rz: 0.4 }));
  return { root: d, head, tail };
}

// 投掷用的食物小块
export function buildFoodBlob(type) {
  const g = new THREE.Group();
  const c = DISHES[type]?.color ?? 0xf3e3b5;
  if (type === 'pie') {
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 3, 1, false, 0, Math.PI / 2.2), mat(0xc98a4a)));
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 3, 1, false, 0, Math.PI / 2.2), mat(c), { y: 0.05 }));
  } else if (type === 'turkey') {
    g.add(mesh(new THREE.CapsuleGeometry(0.06, 0.16, 4, 8), mat(c), { rz: 0.8 }));
    g.add(mesh(new THREE.SphereGeometry(0.04, 8, 8), mat(0xf6ead2), { x: 0.1, y: 0.1 }));
  } else if (type === 'corn') {
    g.add(mesh(new THREE.CapsuleGeometry(0.06, 0.2, 4, 8), mat(c), { rz: Math.PI / 2 }));
  } else {
    g.add(mesh(new THREE.SphereGeometry(0.11, 12, 10), mat(c, { roughness: type === 'cranberry' ? 0.25 : 0.9 }), { sy: 0.8 }));
  }
  return g;
}

export function buildSplat(type) {
  const c = DISHES[type]?.color ?? 0xf3e3b5;
  const g = new THREE.Group();
  const m = mat(c, { roughness: type === 'cranberry' ? 0.2 : 0.85 });
  g.add(mesh(new THREE.SphereGeometry(0.11, 10, 8), m, { sz: 0.45, cast: false }));
  for (let i = 0; i < 4; i++) {
    const a = Math.random() * Math.PI * 2;
    g.add(mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 8, 6), m, { x: Math.cos(a) * 0.12, y: Math.sin(a) * 0.12, sz: 0.5, cast: false }));
  }
  return g;
}
