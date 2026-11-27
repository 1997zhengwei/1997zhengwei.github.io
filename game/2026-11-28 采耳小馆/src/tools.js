// tools.js —— 采耳工具模型：耳勺、棉签、鹅毛棒、音叉、手指。尖端在原点，手柄朝 +Y。单位 cm。
import * as THREE from 'three';

const metal = () => new THREE.MeshPhysicalMaterial({ color: 0xd8dce2, metalness: 1, roughness: 0.22, envMapIntensity: 1.4 });
function bambooMat() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 64, 0);
  grd.addColorStop(0, '#b98a4c'); grd.addColorStop(0.5, '#e2c48a'); grd.addColorStop(1, '#b98a4c');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(120,80,30,${Math.random() * 0.18})`; g.fillRect(Math.random() * 64, 0, 1 + Math.random() * 2, 512); }
  for (const y of [150, 360]) { g.fillStyle = 'rgba(110,70,25,0.65)'; g.fillRect(0, y, 64, 6); g.fillStyle = 'rgba(255,240,200,0.4)'; g.fillRect(0, y + 6, 64, 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.48, clearcoat: 0.4, clearcoatRoughness: 0.35 });
}
function shadowAll(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; } }); return o; }

export function makePick() {
  const g = new THREE.Group();
  // 不锈钢细杆 + 小勺头，后接竹柄
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 1.3, 12), metal());
  neck.position.y = 0.72; g.add(neck);
  const spoon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), metal());
  spoon.material.side = THREE.DoubleSide;
  spoon.scale.set(1, 0.5, 1.3); spoon.rotation.x = Math.PI * 0.5; spoon.position.set(0, 0.06, 0.0);
  g.add(spoon);
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.35, 16), metal());
  ferrule.position.y = 1.45; g.add(ferrule);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 8.5, 18), bambooMat());
  handle.position.y = 1.6 + 4.25; g.add(handle);
  const slot = new THREE.Group(); slot.position.set(0, 0.05, 0.03); g.add(slot);
  g.userData = { slot, kind: 'pick' };
  return shadowAll(g);
}

export function makeSwab() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xf4f6f8, roughness: 0.6 }));
  stick.position.y = 0.4 + 8; g.add(stick);
  const geo = new THREE.SphereGeometry(0.17, 40, 28);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const n = 1 + (Math.sin(v.x * 90) * Math.sin(v.y * 70) * Math.sin(v.z * 80)) * 0.06 + (Math.random() - 0.5) * 0.05;
    v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const cottonMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 1, sheen: 1, sheenRoughness: 1, sheenColor: new THREE.Color(0xffffff) });
  const bud = new THREE.Mesh(geo, cottonMat);
  bud.scale.set(1, 2.0, 1); bud.position.y = 0.3; g.add(bud);
  const slot = new THREE.Group(); slot.position.set(0, 0.2, 0.14); g.add(slot);
  g.userData = { slot, kind: 'swab', cottonMat, bud };
  return shadowAll(g);
}

export function makeFeather() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 16, 12), bambooMat());
  stick.position.y = 0.5 + 8; g.add(stick);
  // 鹅绒团：几百根细绒毛
  const puff = new THREE.Group(); puff.position.y = 0.32; g.add(puff);
  const N = 700;
  const fiber = new THREE.CylinderGeometry(0.0016, 0.006, 1, 3, 1, true); fiber.translate(0, 0.5, 0);
  const fm = new THREE.MeshPhysicalMaterial({ color: 0xfffaf2, roughness: 0.9, sheen: 1, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide });
  const inst = new THREE.InstancedMesh(fiber, fm, N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const dirs = [];
  for (let i = 0; i < N; i++) {
    const d = new THREE.Vector3().randomDirection();
    if (d.y > 0.6) d.y *= 0.3;
    d.normalize();
    const len = 0.2 + Math.pow(Math.random(), 0.6) * 0.34;
    q.setFromUnitVectors(up, d);
    m.compose(new THREE.Vector3(), q, new THREE.Vector3(1, len, 1));
    inst.setMatrixAt(i, m);
    dirs.push({ d, len });
  }
  puff.add(inst);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xfffbf4, roughness: 1, sheen: 1, sheenColor: new THREE.Color(0xffffff), transparent: true, opacity: 0.55, depthWrite: false })); puff.add(core);
  g.userData = { kind: 'feather', puff, inst, dirs };
  return shadowAll(g);
}

export function makeFork() {
  const g = new THREE.Group();
  const mt = metal();
  const tines = [];
  for (const sx of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.4, 16), mt);
    t.position.set(sx * 0.27, 1.2, 0); g.add(t); tines.push(t);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8), mt); cap.position.set(0, -1.2, 0); t.add(cap);
  }
  const u = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.065, 12, 24, Math.PI), mt);
  u.position.y = 2.4; g.add(u);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 12), mt); stem.position.y = 2.67 + 0.6; g.add(stem);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 4.5, 18), new THREE.MeshPhysicalMaterial({ color: 0x6b4a32, roughness: 0.45, clearcoat: 0.5 }));
  knob.position.y = 3.9 + 2.25; g.add(knob);
  g.userData = { kind: 'fork', tines };
  return shadowAll(g);
}

export function makeFinger() {
  const g = new THREE.Group();
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xe9ae92, roughness: 0.5, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffd0c0), clearcoat: 0.15, clearcoatRoughness: 0.5 });
  const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 6, 12, 28), skin);
  f.position.y = 0.48 + 3; f.scale.set(1, 1, 0.84); g.add(f);
  // 指甲在背面（朝镜头），指腹贴耳朵
  const nail = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.4), new THREE.MeshPhysicalMaterial({ color: 0xf6d2c8, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1 }));
  nail.scale.set(0.92, 1.55, 0.32); nail.rotation.x = Math.PI * 0.5; nail.position.set(0, 0.78, 0.34); g.add(nail);
  // 指节褶皱
  for (const y of [2.1, 2.25]) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.012, 6, 32, Math.PI * 0.8), new THREE.MeshBasicMaterial({ color: 0xc98a72, transparent: true, opacity: 0.5 })); c.position.set(0, y, 0); c.rotation.set(Math.PI * 0.5, 0, Math.PI * 0.1); g.add(c); }
  g.userData = { kind: 'rub' };
  return shadowAll(g);
}

// 可视耳勺：细钢勺 + 头部一圈 LED 和小镜头，屏幕右上角实时显示耳道里的画面
export function makeScope() {
  const g = new THREE.Group();
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 1.6, 12), metal());
  neck.position.y = 0.85; g.add(neck);
  const spoon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), metal());
  spoon.material.side = THREE.DoubleSide; spoon.scale.set(1, 0.5, 1.3); spoon.rotation.x = Math.PI * 0.5; spoon.position.set(0, 0.06, 0); g.add(spoon);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.28, 18), new THREE.MeshPhysicalMaterial({ color: 0x2b2f36, metalness: 0.6, roughness: 0.3 }));
  head.position.y = 0.32; g.add(head);
  const led = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.014, 8, 24), new THREE.MeshBasicMaterial({ color: 0xfff6dc }));
  led.rotation.x = Math.PI * 0.5; led.position.y = 0.18; g.add(led);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 12, 20), new THREE.MeshPhysicalMaterial({ color: 0xfaf8f5, roughness: 0.3, clearcoat: 0.8 }));
  body.position.y = 1.65 + 6; g.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.5, 20), new THREE.MeshPhysicalMaterial({ color: 0x8fb59a, roughness: 0.5 }));
  band.position.y = 2.6; g.add(band);
  const slot = new THREE.Group(); slot.position.set(0, 0.05, 0.03); g.add(slot);
  g.userData = { slot, kind: 'scope', led };
  return shadowAll(g);
}

// 精油滴管：玻璃管里是琥珀色的油，顶上橡胶头
export function makeDropper() {
  const g = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.32, depthWrite: false });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.04, 2.6, 20, 1, true), glass);
  tube.position.y = 1.3 + 0.35; g.add(tube);
  const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.035, 1.3, 16), new THREE.MeshPhysicalMaterial({ color: 0xf0b545, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.88, emissive: 0x6a3a00, emissiveIntensity: 0.3 }));
  oil.position.y = 1.0; g.add(oil);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.35, 12), glass); tip.position.y = 0.17; g.add(tip);
  const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.7, 8, 18), new THREE.MeshPhysicalMaterial({ color: 0x3d3a38, roughness: 0.6 }));
  bulb.position.y = 3.5; g.add(bulb);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.18, 18), new THREE.MeshPhysicalMaterial({ color: 0xc9a46a, metalness: 0.8, roughness: 0.3 }));
  collar.position.y = 3.0; g.add(collar);
  g.userData = { kind: 'oil', bulb };
  return shadowAll(g);
}

// 热毛巾：折成方块的白毛巾，盖在耳朵上
export function makeTowelPad() {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { const v = 110 + Math.random() * 145; x.fillStyle = `rgb(${v},${v},${v})`; x.beginPath(); x.arc(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 1.6, 0, 6.3); x.fill(); }
  const bump = new THREE.CanvasTexture(c); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(7, 8);
  const geo = new THREE.BoxGeometry(3.7, 4.5, 0.42, 36, 44, 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i);
    const r = Math.max(Math.abs(X) / 1.85, Math.abs(Y) / 2.25);
    // 盖在耳朵上往两边垂 + 几道软褶
    const fold = Math.sin(X * 2.3 + Y * 0.6) * 0.1 + Math.sin(Y * 3.1 - X) * 0.06 + Math.max(0, 0.25 - Math.abs(Y - 0.6)) * 0.5;
    p.setZ(i, Z * (1 - Math.pow(r, 8) * 0.6) - X * X * 0.1 - Y * Y * 0.04 + fold);
  }
  geo.computeVertexNormals();
  const cc = document.createElement('canvas'); cc.width = 256; cc.height = 256;
  const cx = cc.getContext('2d');
  cx.fillStyle = '#fbf6ee'; cx.fillRect(0, 0, 256, 256);
  for (const y of [26, 40, 216, 230]) { cx.fillStyle = y < 50 || y > 200 ? '#a9cbb2' : '#fff'; cx.fillRect(0, y, 256, 7); }
  for (let i = 0; i < 2500; i++) { cx.fillStyle = `rgba(200,185,165,${Math.random() * 0.25})`; cx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  const map = new THREE.CanvasTexture(cc); map.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshPhysicalMaterial({ map, roughness: 0.98, sheen: 1, sheenRoughness: 0.8, sheenColor: new THREE.Color(0xffffff), bumpMap: bump, bumpScale: 5 });
  const pad = new THREE.Mesh(geo, mat);
  g.add(pad);
  g.userData = { kind: 'towel', pad };
  return shadowAll(g);
}

// 捂耳：一只微微拱起的手掌
export function makePalm() {
  const g = new THREE.Group();
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xe9ae92, roughness: 0.52, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffd0c0), clearcoat: 0.1 });
  const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), skin);
  palm.scale.set(2.3, 2.6, 0.75); g.add(palm);
  const fingers = [[-1.35, 2.5, 0.42, 1.5], [-0.45, 2.9, 0.45, 1.9], [0.45, 2.85, 0.45, 1.8], [1.3, 2.45, 0.4, 1.4]];
  for (const [fx, fy, r, len] of fingers) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 18), skin);
    f.position.set(fx, fy + len * 0.5, 0.1); f.rotation.z = -fx * 0.06; f.rotation.x = 0.25; g.add(f);
  }
  const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.6, 8, 18), skin);
  th.position.set(2.3, -0.6, 0.2); th.rotation.z = -0.9; g.add(th);
  g.userData = { kind: 'cup', palm };
  return shadowAll(g);
}
