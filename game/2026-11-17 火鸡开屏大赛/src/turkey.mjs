// 选美参赛火鸡（高精度版）+ 尾屏
import * as THREE from '../vendor/three.module.js';
import * as T from './tex.mjs';

function mesh(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}

export const FEATHER_STYLE = {
  red: { base: '#9a0f28', mid: '#d4344a', edge: '#3a040e', eye: '#0f3a30', eyeHi: '#3fd0b0', ring: '#1f5a4a' },
  orange: { base: '#b8501a', mid: '#f08a3a', edge: '#4a1a06', eye: '#14285a', eyeHi: '#4a8aff', ring: '#2a3a6a' },
  gold: { base: '#b8841a', mid: '#f6cc52', edge: '#4a2e06', eye: '#5a0a1a', eyeHi: '#e04a5a', ring: '#9a0f28' },
  teal: { base: '#22604e', mid: '#5aa88a', edge: '#0a221a', eye: '#3a0a2a', eyeHi: '#c04a9a', ring: '#6a2a5a' },
  purple: { base: '#4a2266', mid: '#8a5ab8', edge: '#16061e', eye: '#0f3a30', eyeHi: '#3fd0b0', ring: '#1f5a4a' },
  rainbow: { base: 'rainbow', mid: '', edge: '#2a170c', eye: '#14285a', eyeHi: '#ffffff', ring: '#f2c230' },
};

// ---------- 尾屏羽毛 ----------
const featherGeo = (() => {
  const g = new THREE.PlaneGeometry(0.5, 1, 6, 16);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    // 纵向弯曲 + 横向微拱 + 尖端轻微扭转
    p.setZ(i, -y * y * 0.16 - Math.abs(x) * x * 0.0 - (x * x) * 0.35 + x * y * 0.05);
  }
  g.computeVertexNormals();
  return g;
})();
const featherMats = {};
export function featherMat(color) {
  if (!featherMats[color]) {
    featherMats[color] = new THREE.MeshPhysicalMaterial({
      map: T.tailFeatherTex(FEATHER_STYLE[color]), transparent: false, alphaTest: 0.5, alphaToCoverage: true,
      side: THREE.DoubleSide, roughness: 0.42, metalness: 0.05, iridescence: 0.25, iridescenceThicknessRange: [300, 600],
      sheen: 0.35, sheenRoughness: 0.5, sheenColor: new THREE.Color(0x553322), envMapIntensity: 0.7,
    });
  }
  return featherMats[color];
}
export function buildFeather(color) {
  const m = new THREE.Mesh(featherGeo, featherMat(color));
  m.castShadow = true;
  return m;
}

// ---------- 共享材质 ----------
let MATS = null;
function mats() {
  if (MATS) return MATS;
  const head = T.headSkin();
  MATS = {
    plume: new THREE.MeshPhysicalMaterial({ color: 0x3a2214, roughness: 0.4, metalness: 0.2, iridescence: 0.5, iridescenceIOR: 1.5, iridescenceThicknessRange: [300, 700], clearcoat: 0.25, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color(0x8a5a2a) }),
    bodyF: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.15, iridescence: 0.38, iridescenceIOR: 1.6, iridescenceThicknessRange: [250, 650], clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: new THREE.Color(0xc08040), side: THREE.DoubleSide }),
    beard: new THREE.MeshStandardMaterial({ color: 0x140c08, roughness: 0.7 }),
    wingF: new THREE.MeshPhysicalMaterial({ map: T.wingFeatherTex(), alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.15, iridescence: 0.3 }),
    skin: new THREE.MeshPhysicalMaterial({ map: head.map, normalMap: head.normalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: new THREE.Color(0xffffff) }),
    wattle: new THREE.MeshPhysicalMaterial({ color: 0xb80c26, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15, sheen: 0.5, sheenColor: new THREE.Color(0xff6a7a) }),
    beak: new THREE.MeshPhysicalMaterial({ color: 0xe6c98e, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }),
    gold: new THREE.MeshPhysicalMaterial({ color: 0xe8b030, metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: 0xd0102e, roughness: 0.02, transmission: 0.4, thickness: 0.1, ior: 1.77, clearcoat: 1, emissive: 0x300008 }),
    sash: new THREE.MeshPhysicalMaterial({ color: 0x8a0a22, roughness: 0.45, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color(0xff6070), side: THREE.DoubleSide }),
    leg: new THREE.MeshPhysicalMaterial({ map: T.legSkin(), roughness: 0.4, clearcoat: 0.6 }),
    eyeW: new THREE.MeshPhysicalMaterial({ color: 0xfbf8f2, roughness: 0.05, clearcoat: 1 }),
    iris: new THREE.MeshPhysicalMaterial({ color: 0x3a1606, roughness: 0.05, clearcoat: 1, emissive: 0x0a0300 }),
    pupil: new THREE.MeshBasicMaterial({ color: 0x050302 }),
    lash: new THREE.MeshStandardMaterial({ color: 0x120a06, roughness: 0.6 }),
    hi: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  };
  return MATS;
}

export function buildTurkey() {
  const M = mats();
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  // 躯干：椭球内核 + 沿表面层层覆盖的 3D 古铜覆羽（一个 InstancedMesh）
  const torso = new THREE.Group(); torso.position.set(0, 1.13, -0.04); torso.rotation.x = 0.22; body.add(torso);
  const EA = 0.54, EB = 0.63, EC = 0.6;
  torso.add(mesh(new THREE.SphereGeometry(1, 64, 48), M.plume, { sx: EA * 0.97, sy: EB * 0.97, sz: EC * 0.97 }));
  torso.add(buildBodyFeathers(M, EA, EB, EC));
  // 胸前“胡须”：一撮黑色硬羽（雄火鸡的标志）
  {
    const th = 0.86, ph = -Math.PI / 2 + 0.22;
    const pt = new THREE.Vector3(EA * Math.sin(th) * Math.cos(ph), EB * Math.cos(th), EC * Math.sin(th) * Math.sin(ph));
    const beard = new THREE.Group(); beard.position.copy(pt).multiplyScalar(1.06); torso.add(beard);
    for (let k = 0; k < 11; k++) beard.add(mesh(new THREE.CylinderGeometry(0.004, 0.009, 0.22, 5), M.beard, { x: (k - 5) * 0.006, y: -0.1, z: -0.02 - Math.abs(k - 5) * 0.003, rz: (k - 5) * 0.03, rx: 0.25, cast: false }));
  }
  // 绶带：贴合椭球表面的斜挎缎带 + 金色滚边
  {
    const u = new THREE.Vector3(0.8, -0.6, 0).normalize(), v = new THREE.Vector3(0, 0, 1), nP = new THREE.Vector3().crossVectors(u, v).normalize();
    const SEG = 160, HW = 0.085, lift = 1.12;
    const center = [], pos = [], uv = [], idx = [];
    for (let i = 0; i <= SEG; i++) {
      const ph = (i / SEG) * Math.PI * 2;
      const d = u.clone().multiplyScalar(Math.cos(ph)).addScaledVector(v, Math.sin(ph));
      const k = 1 / Math.sqrt((d.x / EA) ** 2 + (d.y / EB) ** 2 + (d.z / EC) ** 2);
      const c = d.multiplyScalar(k * lift);
      center.push(c);
      for (const sgn of [-1, 1]) { const q = c.clone().addScaledVector(nP, sgn * HW); pos.push(q.x, q.y, q.z); uv.push(sgn < 0 ? 0 : 1, i / SEG * 8); }
      if (i < SEG) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    rg.setIndex(idx); rg.computeVertexNormals();
    torso.add(mesh(rg, M.sash, { cast: false }));
    for (const sgn of [-1, 1]) torso.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(center.slice(0, SEG).map((c) => c.clone().addScaledVector(nP, sgn * HW)), true), 160, 0.011, 6, true), M.gold, { cast: false }));
    // 勋章：挂在绶带正前方偏下
    const ph = -Math.PI / 2 + 0.42;
    const d = u.clone().multiplyScalar(Math.cos(ph)).addScaledVector(v, Math.sin(ph));
    const k = 1 / Math.sqrt((d.x / EA) ** 2 + (d.y / EB) ** 2 + (d.z / EC) ** 2);
    const at = d.clone().multiplyScalar(k * lift);
    const nrm = new THREE.Vector3(at.x / (EA * EA), at.y / (EB * EB), at.z / (EC * EC)).normalize();
    var medalAt = { at, nrm };
  }
  // 颈根羽领：一圈小羽片
  const collar = new THREE.Group(); collar.position.set(0, 1.5, -0.3); collar.rotation.x = -0.35; body.add(collar);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const f = mesh(new THREE.SphereGeometry(0.1, 14, 10), M.plume, { x: Math.cos(a) * 0.16, z: Math.sin(a) * 0.16, sx: 0.8, sy: 1.5, sz: 0.4, ry: -a, rx: 0.5, cast: false });
    collar.add(f);
  }
  // 脖子
  const neckCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.42, -0.26), new THREE.Vector3(0, 1.66, -0.35), new THREE.Vector3(0, 1.86, -0.37), new THREE.Vector3(0, 1.98, -0.4)]);
  body.add(mesh(new THREE.TubeGeometry(neckCurve, 24, 0.115, 20, false), M.skin));
  // 肉瘤：一簇圆润小疙瘩
  const bumps = new THREE.Group(); bumps.position.set(0, 1.7, -0.43); body.add(bumps);
  [[-0.05, 0.02, 0.032], [0.05, 0.03, 0.03], [0, -0.03, 0.036]].forEach(([x, y, r]) => bumps.add(mesh(new THREE.SphereGeometry(r, 16, 12), M.wattle, { x, y, z: -0.02 })));
  // 头
  const head = new THREE.Group(); head.position.set(0, 2.1, -0.43); head.scale.setScalar(1.42); body.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.15, 40, 30), M.skin, { sy: 1.05, sz: 1.25, z: -0.02 }));
  // 眼睛：眼球 + 虹膜 + 瞳孔 + 两点高光 + 上下眼睑 + 睫毛
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * 0.084, 0.042, -0.152); e.rotation.y = s * 0.32; e.scale.setScalar(1.45); head.add(e);
    e.add(mesh(new THREE.SphereGeometry(0.048, 24, 18), M.eyeW, { sz: 0.6, cast: false }));
    e.add(mesh(new THREE.SphereGeometry(0.039, 24, 16), M.iris, { z: -0.014, sz: 0.5, cast: false }));
    e.add(mesh(new THREE.SphereGeometry(0.022, 16, 12), M.pupil, { z: -0.022, sz: 0.4, cast: false }));
    e.add(mesh(new THREE.SphereGeometry(0.011, 10, 8), M.hi, { x: 0.012, y: 0.014, z: -0.031, sz: 0.5, cast: false }));
    e.add(mesh(new THREE.SphereGeometry(0.005, 8, 6), M.hi, { x: -0.01, y: -0.01, z: -0.031, sz: 0.5, cast: false }));
    e.add(mesh(new THREE.SphereGeometry(0.052, 24, 6, 0, Math.PI * 2, 0, Math.PI * 0.17), M.lash, { sz: 0.66, rx: -0.35, cast: false }));
    e.add(mesh(new THREE.SphereGeometry(0.051, 24, 8, 0, Math.PI * 2, Math.PI * 0.72, Math.PI * 0.28), M.skin, { sz: 0.62, cast: false }));
    for (let k = 0; k < 4; k++) e.add(mesh(new THREE.CapsuleGeometry(0.003, 0.022, 2, 4), M.lash, { x: (k - 1.5) * 0.016, y: 0.04, z: -0.022, rz: (k - 1.5) * 0.35, rx: -0.6, cast: false }));
  }
  // 喙：上喙微勾 + 下喙
  head.add(mesh(new THREE.ConeGeometry(0.04, 0.12, 20), M.beak, { y: -0.005, z: -0.21, rx: -Math.PI / 2 - 0.35 }));
  head.add(mesh(new THREE.ConeGeometry(0.03, 0.08, 16), M.beak, { y: -0.035, z: -0.19, rx: -Math.PI / 2 + 0.2 }));
  // 鼻垂（snood）：从额头垂下的弯曲肉条
  const snoodCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.0, 0.06, -0.16), new THREE.Vector3(0.004, 0.02, -0.225), new THREE.Vector3(0.012, -0.05, -0.245), new THREE.Vector3(0.022, -0.11, -0.225)]);
  const snood = mesh(new THREE.TubeGeometry(snoodCurve, 20, 0.014, 10, false), M.wattle);
  head.add(snood);
  head.add(mesh(new THREE.SphereGeometry(0.017, 12, 10), M.wattle, { x: 0.022, y: -0.11, z: -0.225 }));
  // 下颌肉垂（wattle）：车削水滴
  const wProf = [[0, 0.05], [0.04, 0.03], [0.055, -0.03], [0.045, -0.09], [0, -0.12]].map(([r, y]) => new THREE.Vector2(r, y));
  head.add(mesh(new THREE.LatheGeometry(wProf, 24), M.wattle, { y: -0.12, z: -0.1, sz: 0.7 }));
  // 金冠：镂空冠身 + 五尖 + 宝石
  const crown = new THREE.Group(); crown.position.set(0, 0.13, 0.0); crown.rotation.x = -0.12; head.add(crown);
  crown.add(mesh(new THREE.CylinderGeometry(0.1, 0.092, 0.06, 40, 1, true), M.gold, { cast: false }));
  crown.add(mesh(new THREE.TorusGeometry(0.096, 0.008, 8, 40), M.gold, { y: -0.03, rx: Math.PI / 2, cast: false }));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    crown.add(mesh(new THREE.ConeGeometry(0.026, 0.1, 4), M.gold, { x: Math.cos(a) * 0.092, y: 0.078, z: Math.sin(a) * 0.092, cast: false }));
    crown.add(mesh(new THREE.SphereGeometry(0.014, 12, 8), M.gold, { x: Math.cos(a) * 0.092, y: 0.135, z: Math.sin(a) * 0.092, cast: false }));
  }
  crown.add(mesh(new THREE.OctahedronGeometry(0.028, 1), M.ruby, { y: 0.0, z: -0.1, cast: false }));
  // 绶带 + 胸前金质徽章
  const medal = new THREE.Group(); medal.position.copy(medalAt.at).addScaledVector(medalAt.nrm, 0.02); torso.add(medal);
  medal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), medalAt.nrm);
  medal.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.025, 40), M.gold, { rx: Math.PI / 2 }));
  medal.add(mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 40), M.gold, { z: -0.012 }));
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.03 : 0.07; const a = (i / 10) * Math.PI * 2 + Math.PI / 2; if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r); else star.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  medal.add(mesh(new THREE.ExtrudeGeometry(star, { depth: 0.012, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 }), M.ruby, { z: -0.03, rx: Math.PI }));
  for (const s of [-1, 1]) medal.add(mesh(new THREE.BoxGeometry(0.06, 0.16, 0.01), M.sash, { x: s * 0.05, y: -0.15, z: 0.01, rz: s * 0.25 }));
  // 翅膀：叠起来的真飞羽
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(s * 0.5, 1.32, -0.08); body.add(w);
    w.add(mesh(new THREE.SphereGeometry(0.3, 32, 24), M.plume, { x: s * 0.04, y: -0.08, z: 0.05, sx: 0.32, sy: 0.7, sz: 1.0, rx: 0.4 }));
    for (let k = 0; k < 7; k++) {
      const f = new THREE.Mesh(featherGeo, M.wingF);
      f.castShadow = true;
      f.position.set(s * (0.07 + k * 0.006), -0.05 - k * 0.025, 0.05 + k * 0.07);
      f.rotation.set(Math.PI + 0.9 - k * 0.05, s * Math.PI / 2, 0);
      f.scale.set(0.34, 0.62 + k * 0.03, 1);
      w.add(f);
    }
    wings.push(w);
  }
  // 腿脚：鳞纹 + 关节 + 三前趾一后趾 + 爪
  const legs = [];
  for (const s of [-1, 1]) {
    const l = new THREE.Group(); l.position.set(s * 0.17, 0.72, 0.06); root.add(l);
    l.add(mesh(new THREE.SphereGeometry(0.075, 16, 12), M.plume, { y: 0.02, sy: 1.3 }));
    l.add(mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.66, 14), M.leg, { y: -0.33 }));
    l.add(mesh(new THREE.SphereGeometry(0.036, 12, 10), M.leg, { y: -0.66 }));
    for (const k of [-1, 0, 1]) {
      const toe = new THREE.Group(); toe.position.y = -0.68; toe.rotation.y = k * 0.45; l.add(toe);
      toe.add(mesh(new THREE.CapsuleGeometry(0.019, 0.14, 4, 10), M.leg, { z: -0.085, rx: Math.PI / 2 }));
      toe.add(mesh(new THREE.ConeGeometry(0.012, 0.04, 8), M.beak, { z: -0.17, rx: -Math.PI / 2 }));
    }
    l.add(mesh(new THREE.CapsuleGeometry(0.016, 0.07, 4, 8), M.leg, { y: -0.67, z: 0.05, rx: -Math.PI / 2 + 0.3 }));
    legs.push(l);
  }
  const tail = new THREE.Group(); tail.position.set(0, 1.26, 0.42); body.add(tail);
  return { root, body, head, wings, legs, tail, snood, feathers: [] };
}


// 身体覆羽：一片杯状圆头羽毛几何（根部暗古铜→铜亮→墨绿虹彩→黑带→浅金边）
const bodyFeatherGeo = (() => {
  const g = new THREE.PlaneGeometry(1, 1, 6, 16);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  const stops = [[0, '#1e120a'], [0.45, '#4e2c16'], [0.72, '#8e5424'], [0.86, '#3a2a16'], [0.93, '#0c0805'], [1, '#2a1a0c']].map(([k, c]) => [k, new THREE.Color(c)]);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const w = y > 0.5 ? Math.sqrt(Math.max(0, 1 - ((y - 0.5) / 0.5) ** 2)) : 0.8 + 0.2 * (y / 0.5);
    const xx = x * w;
    p.setXYZ(i, xx, y, 0.16 * (0.25 - xx * xx) - 0.06 * y * y);
    let j = 0; while (j < stops.length - 2 && y > stops[j + 1][0]) j++;
    const [k0, c0] = stops[j], [k1, c1] = stops[j + 1];
    c.copy(c0).lerp(c1, Math.min(1, Math.max(0, (y - k0) / (k1 - k0))));
    const shaft = Math.max(0, 1 - Math.abs(x) * 9) * 0.25;
    col[i * 3] = c.r + shaft * 0.3; col[i * 3 + 1] = c.g + shaft * 0.2; col[i * 3 + 2] = c.b + shaft * 0.1;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
})();
function buildBodyFeathers(M, A, B, C) {
  const mats4 = [];
  const r = T.rng(5);
  for (let th = 0.38; th < 2.62; th += 0.155) {
    const circ = 2 * Math.PI * Math.sqrt((A * A + C * C) / 2) * Math.sin(th);
    const n = Math.max(6, Math.round(circ / 0.115));
    const off = (Math.round(th / 0.155) % 2) * 0.5;
    for (let j = 0; j < n; j++) {
      const ph = ((j + off) / n) * Math.PI * 2;
      const p = new THREE.Vector3(A * Math.sin(th) * Math.cos(ph), B * Math.cos(th), C * Math.sin(th) * Math.sin(ph));
      const nn = new THREE.Vector3(p.x / (A * A), p.y / (B * B), p.z / (C * C)).normalize();
      const t = new THREE.Vector3(A * Math.cos(th) * Math.cos(ph), -B * Math.sin(th), C * Math.cos(th) * Math.sin(ph)).normalize();
      const Y = t.clone().addScaledVector(nn, 0.14).normalize();
      const X = new THREE.Vector3().crossVectors(Y, nn).normalize();
      const Z = new THREE.Vector3().crossVectors(X, Y).normalize();
      const sc = 0.95 + r() * 0.15;
      const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(0.165 * sc), Y.multiplyScalar(0.215 * sc), Z.multiplyScalar(0.3));
      m.setPosition(p.addScaledVector(nn, 0.004));
      const front = Math.max(0, -nn.z);
      const k = (0.9 + r() * 0.2) * (1 - front * 0.22);
      mats4.push([m, new THREE.Color(k, k * (0.97 + r() * 0.06), k)]);
    }
  }
  const im = new THREE.InstancedMesh(bodyFeatherGeo, M.bodyF, mats4.length);
  mats4.forEach(([m, c], i) => { im.setMatrixAt(i, m); im.setColorAt(i, c); });
  im.castShadow = true;
  im.computeBoundingSphere();
  return im;
}

// 尾屏布局：同心多层扇面，每层羽毛等角距、眼斑首尾相接排成整齐的弧
// faceFront=true 时（终场转身后）短羽层移到前面，正面看到层层叠叠的眼斑
const RINGS = [
  { cap: 17, step: 11.2, k: 1.0 },
  { cap: 16, step: 11.6, k: 0.8 },
  { cap: 14, step: 12.4, k: 0.63 },
  { cap: 12, step: 13.2, k: 0.48 },
];
export function layoutFan(turkey, colors, open = 0.55, t = 0, faceFront = false) {
  const tail = turkey.tail;
  while (turkey.feathers.length < colors.length) {
    const f = buildFeather(colors[turkey.feathers.length]);
    f.userData.pop = 0;
    tail.add(f); turkey.feathers.push(f);
  }
  while (turkey.feathers.length > colors.length) tail.remove(turkey.feathers.pop());
  const n = colors.length;
  const grow = Math.min(1, n / 50);
  const base = (1.0 + grow * 0.95) * (0.9 + open * 0.2);
  const spread = 0.5 + 0.5 * Math.min(1.1, open);
  let i = 0;
  for (let ri = 0; i < n; ri++) {
    const R = RINGS[ri % RINGS.length];
    const lap = Math.floor(ri / RINGS.length);
    const cnt = Math.min(R.cap, n - i);
    // 第一圈 4 层由长到短往前叠；更多羽毛做成更长的外圈放在后面，绝不盖住头
    const o = lap === 0 ? 0 : (lap - 1) * RINGS.length + (ri % RINGS.length) + 1;
    const depth = lap === 0 ? ri : -o;
    const len = lap === 0 ? base * R.k : base * (1 + 0.06 * Math.min(o, 7));
    const step = THREE.MathUtils.degToRad(R.step) * spread;
    for (let j = 0; j < cnt; j++, i++) {
      const f = turkey.feathers[i];
      if (f.material !== featherMat(colors[i])) f.material = featherMat(colors[i]);
      const a = (j - (cnt - 1) / 2) * step;
      f.userData.pop = Math.min(1, (f.userData.pop || 0) + 0.12);
      const pop = f.userData.pop < 1 ? 0.2 + 0.8 * (1 - Math.pow(1 - f.userData.pop, 3)) * (1 + 0.25 * Math.sin(f.userData.pop * Math.PI)) : 1;
      f.position.set(0, 0, (faceFront ? -1 : 1) * (depth * 0.05 + 0.001 * j));
      f.rotation.set(-0.3 + open * 0.2 + Math.max(0, depth) * 0.04 * (faceFront ? -1 : 1), 0, -a);
      f.scale.set(len * 0.52 * pop, len * pop, 1);
      f.rotation.x += Math.sin(t * 9 + i) * 0.03 * (1 - Math.min(1, open));
    }
  }
}
