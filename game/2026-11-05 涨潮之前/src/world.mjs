import * as T from '../vendor/three.module.js';
import { GRID, DECK, groundHeight, floorHeight, islandRadius, nodeReady, nodeBlocked, tide, covered, snap, deckHeight, buildingBase, nearBuildings } from './rules.mjs';
import {decorStructure} from './decor-world.mjs';
import { createFrontierWorld,survivalStructure } from './survival-world.mjs';
import { createVoyageWorld, voyageStructure } from './voyage-world.mjs';

const MAT = new Map();
function material(color, extra = {}) {
  const key = `${color}/${JSON.stringify(extra)}`;
  if (!MAT.has(key)) MAT.set(key, new T.MeshStandardMaterial({ color, roughness: .94, flatShading: true, ...extra }));
  return MAT.get(key);
}
function mesh(geo, color, parent, x = 0, y = 0, z = 0, extra = {}) {
  const m = new T.Mesh(geo, typeof color === 'string' || typeof color === 'number' ? material(color, extra) : color);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function box(parent, color, x, y, z, w, h, d, extra) { return mesh(new T.BoxGeometry(w, h, d), color, parent, x, y, z, extra); }
function sphere(parent, color, x, y, z, radius, sx = 1, sy = 1, sz = 1) {
  const m = mesh(new T.IcosahedronGeometry(radius, 1), color, parent, x, y, z); m.scale.set(sx, sy, sz); return m;
}
function cylinder(parent, color, x, y, z, rt, rb, h, sides = 8) { return mesh(new T.CylinderGeometry(rt, rb, h, sides), color, parent, x, y, z); }
function beam(parent, a, b, radius, color, sides = 6) {
  const av = new T.Vector3(...a), bv = new T.Vector3(...b), delta = bv.clone().sub(av);
  const m = cylinder(parent, color, 0, 0, 0, radius, radius, delta.length(), sides);
  m.position.copy(av.add(bv).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()); return m;
}
function leaf(parent, color, a, b, width, bend = .2) {
  const av = new T.Vector3(...a), bv = new T.Vector3(...b), d = bv.clone().sub(av);
  const cross = new T.Vector3(d.z, 0, -d.x).normalize().multiplyScalar(width);
  const mid = av.clone().lerp(bv, .48); mid.y += bend;
  const vs = [...av, ...mid.clone().add(cross), ...bv, ...av, ...bv, ...mid.clone().sub(cross)];
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(vs, 3)); geo.computeVertexNormals();
  return mesh(geo, material(color, { side: T.DoubleSide }), parent);
}
function circle(parent, radius, color, x, y, z, opacity = 1) {
  const m = mesh(new T.CircleGeometry(radius, 40), material(color, { transparent: opacity < 1, opacity, depthWrite: false }), parent, x, y, z);
  m.rotation.x = -Math.PI / 2; m.castShadow = false; return m;
}
function ring(parent, inner, outer, color, y = 0, opacity = 1) {
  const m = mesh(new T.RingGeometry(inner, outer, 64), material(color, { side: T.DoubleSide, transparent: true, opacity, depthWrite: false }), parent, 0, y, 0);
  m.rotation.x = -Math.PI / 2; m.castShadow = false; return m;
}
const hash = n => { const v = Math.sin(n * 78.233 + 1.1) * 43758.5453; return v - Math.floor(v); };

// Batch static pieces into vertex-colored meshes. Palms and beach grass should
// not each cost dozens of draw calls, especially on a phone.
function batch(group) {
  group.updateMatrixWorld(true);
  const positions = [], normals = [], colors = [], point = new T.Vector3(), normal = new T.Vector3(), normalMatrix = new T.Matrix3();
  const geometries = [], inverse=group.matrixWorld.clone().invert(), relative=new T.Matrix4();
  group.traverse(o => {
    if (!o.isMesh) return;
    const geo = o.geometry, p = geo.attributes.position, n = geo.attributes.normal, index = geo.index, color = o.material.color;
    relative.multiplyMatrices(inverse,o.matrixWorld); normalMatrix.getNormalMatrix(relative); geometries.push(geo);
    const count = index ? index.count : p.count;
    for (let i = 0; i < count; i++) {
      const j = index ? index.getX(i) : i;
      point.fromBufferAttribute(p, j).applyMatrix4(relative); positions.push(point.x, point.y, point.z);
      normal.fromBufferAttribute(n, j).applyMatrix3(normalMatrix).normalize(); normals.push(normal.x, normal.y, normal.z);
      colors.push(color.r, color.g, color.b);
    }
  });
  group.clear(); geometries.forEach(g => g.dispose());
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(normals, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95, side: T.DoubleSide }), group);
  return group;
}

function terrain(scene, bounds, step = .35) {
  const [x0, z0, w, h] = bounds, nx = Math.round(w / step), nz = Math.round(h / step), pos = [], cols = [], idx = [];
  const color = new T.Color();
  for (let z = 0; z <= nz; z++) for (let x = 0; x <= nx; x++) {
    const px = x0 + x / nx * w, pz = z0 + z / nz * h, py = groundHeight(px, pz);
    pos.push(px, py, pz);
    if (py < .1) color.set('#8fc3b5'); else if (py > .85) color.set('#8fa869'); else color.set('#efd5a0');
    color.multiplyScalar(.97 + hash(x * 3 + z * 37) * .06); cols.push(color.r, color.g, color.b);
  }
  for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) {
    const a = z * (nx + 1) + x, b = a + nx + 1; idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }), scene); m.castShadow = false; return m;
}
export function resourceModel(type) {
  const g = new T.Group();
  if (type === 'wood') {
    for (let i = 0; i < 2; i++) {
      const log = cylinder(g, i ? '#a1744b' : '#b08756', i * .12, .16 + i * .15, i * .2, .14, .16, 1.1 - i * .2, 8);
      log.rotation.z = Math.PI / 2; log.rotation.y = i * .35 - .2;
      const end = cylinder(log, '#e4c58f', 0, .55 - i * .1, 0, .135, .135, .018, 8);
      cylinder(end, '#a77f50', 0, .012, 0, .059, .059, .01, 8);
    }
  } else if (type === 'stone' || type === 'ore') {
    const ore = type === 'ore';
    sphere(g, ore ? '#758d93' : '#a4aaa0', 0, .25, 0, .48, 1.1, .8, .9);
    sphere(g, ore ? '#516a76' : '#858f87', .3, .13, .25, .27);
    sphere(g, ore ? '#cde5df' : '#c4c8b5', -.22, .28, -.12, .23);
    if (ore) for (let i = 0; i < 3; i++) mesh(new T.OctahedronGeometry(.17), '#a9dacf', g, -.15 + i * .2, .5 + i % 2 * .12, .02);
  } else if (type === 'fiber') {
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; leaf(g, i % 2 ? '#649765' : '#86ac6c', [0, 0, 0], [Math.sin(a) * .48, .35 + i % 3 * .12, Math.cos(a) * .48], .13, .2); }
    for (let i = 0; i < 3; i++) sphere(g, '#e6bb74', Math.sin(i * 2) * .22, .5, Math.cos(i * 2) * .22, .065);
  } else if (type === 'tree') {
    for (let i = 0; i < 6; i++) { const y = i * .46, x = i * i * .014; const trunk = cylinder(g, i % 2 ? '#aa8657' : '#b99967', x, y + .23, 0, .13 - i * .009, .16 - i * .007, .48, 7); trunk.rotation.z = -.09; }
    const top = [.36, 2.83, 0];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .2; leaf(g, i % 2 ? '#47866a' : '#689b66', top, [top[0] + Math.sin(a) * 1.65, 2.48 + i % 2 * .2, Math.cos(a) * 1.65], .34, .48); beam(g, top, [top[0] + Math.sin(a) * 1.4, 2.66, Math.cos(a) * 1.4], .02, '#8eac6f', 4); }
    sphere(g, '#9c774a', .45, 2.64, .14, .18); sphere(g, '#ad8c54', .18, 2.58, -.14, .16);
  } else if(type==='scrap'){
    box(g,'#93ada5',0,.3,0,.76,.53,.62);for(const x of [-.28,.28])box(g,'#597c7a',x,.32,.33,.08,.64,.05);cylinder(g,'#d4ddd0',.08,.67,0,.18,.18,.18,6);
  } else if (type === 'crate') {
    box(g, '#a37c50', 0, .32, 0, .85, .6, .7); for (const x of [-.32, .32]) box(g, '#d3b079', x, .34, .36, .09, .68, .035);
    box(g, '#d9b780', 0, .64, 0, .9, .08, .76); beam(g, [-.34, .1, .375], [.34, .6, .375], .035, '#e1bd83', 4);
  }
  return batch(g);
}

export function structureModel(b, state) {
  if(['fence','arch','flowerbed','lantern'].includes(b.type))return decorStructure(b,state,{box,cylinder,beam,sphere,batch});
  if(['station','seawall','windbreak','stove','beacon','lumbermill','recycler','garden'].includes(b.type))return survivalStructure(b,state,{box,cylinder,beam,sphere,batch});
  if(['dock','workbench'].includes(b.type))return voyageStructure(b,state,{box,cylinder,beam,sphere});
  const g = new T.Group(), type = b.type, base = state?buildingBase(state,b):DECK;
  if (type === 'platform' || type === 'bridge') {
    for (let i = 0; i < 7; i++) box(g, i % 2 ? '#c3945d' : '#d3aa71', (i - 3) * .303, base - .1, 0, .28, .17, 2.14);
    for (const x of [-.89, .89]) for (const z of [-.88, .88]) {
      const low = groundHeight(b.x + x, b.z + z) - .1, high = base - .12;
      cylinder(g, '#927047', x, (low + high) / 2, z, .075, .1, Math.max(.2, high - low), 7);
      cylinder(g, '#e2bd82', x, base + .05, z, .09, .09, .15, 7);
    }
    box(g, '#987044', 0, base - .24, -.72, 2.15, .2, .12); box(g, '#987044', 0, base - .24, .72, 2.15, .2, .12);
    if (type === 'platform') {
      for (let i = 0; i < (b.raised?6:3); i++) box(g, i % 2 ? '#b88a55' : '#cda267', 0, base - .25 - i * .28, 1.15 + i * .26, 1.02, .16, .32);
      beam(g, [-.48, .4, 1.88], [-.48, base - .2, .95], .055, '#936b43'); beam(g, [.48, .4, 1.88], [.48, base - .2, .95], .055, '#936b43');
    } else {
      for (const z of [-.97, .97]) for (const x of [-.85, .85]) cylinder(g, '#ac8452', x, base + .25, z, .045, .055, .55, 6);
      for (const z of [-.97, .97]) beam(g, [-.85, base + .48, z], [.85, base + .48, z], .023, '#e4cc99', 5);
    }
  }
  if (type === 'cabin') {
    const cg = new T.Group(); cg.position.y = base; g.add(cg);
    for (const x of [-.96, .96]) for (const z of [-.96, .96]) cylinder(cg, '#8d6744', x, .71, z, .062, .075, 1.5, 7);
    for (const x of [-.94, .94]) for (let i = 0; i < 5; i++) box(cg, i % 2 ? '#caa56b' : '#d8b87c', x, .18 + i * .19, 0, .075, .15, 1.88);
    for (let i = 0; i < 5; i++) box(cg, i % 2 ? '#caa56b' : '#d8b87c', 0, .18 + i * .19, -.94, 1.86, .15, .075);
    // Visible front doorway and a low open front let the player read the interior.
    for (const x of [-.76, .76]) for (let i = 0; i < 3; i++) box(cg, '#cba66d', x, .17 + i * .2, .94, .33, .16, .075);
    beam(cg, [-1.05, 1.12, -.96], [1.05, 1.12, -.96], .06, '#916b41');
    beam(cg, [-.96, .12, -.92], [-.96, 1.15, .92], .045, '#977447');
    const roofMat = new T.MeshStandardMaterial({ color: '#719b69', flatShading: true, roughness: 1, side: T.DoubleSide, transparent: true });roofMat.userData.local=true;
    const positions = [-1.3, 1.2, -1.3, 0, 2.05, -1.3, -1.3, 1.2, 1.3, 0, 2.05, -1.3, 0, 2.05, 1.3, -1.3, 1.2, 1.3,
      0, 2.05, -1.3, 1.3, 1.2, -1.3, 0, 2.05, 1.3, 1.3, 1.2, -1.3, 1.3, 1.2, 1.3, 0, 2.05, 1.3];
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); geo.computeVertexNormals();
    const roof = mesh(geo, roofMat, cg); g.userData.roof = roof;
    const ribs = new T.Group(); cg.add(ribs); g.userData.ribs = ribs;
    for (let i = 0; i < 6; i++) { const z = -1.21 + i * .48; beam(ribs, [-1.31, 1.23, z], [0, 2.08, z], .025, '#b3b77d'); beam(ribs, [0, 2.08, z], [1.31, 1.23, z], .025, '#b3b77d'); }
    beam(ribs, [0, 2.08, -1.4], [0, 2.08, 1.4], .055, '#bbb47a');
    // A little lantern makes the house recognisable from across the island.
    cylinder(cg, '#665c42', .62, 1.23, 1.03, .07, .07, .05, 6);
    box(cg, '#f8c877', .62, 1.09, 1.03, .15, .22, .14, { emissive: '#e8a84d', emissiveIntensity: .55 });
    box(cg, '#836342', .62, .95, 1.03, .19, .04, .18);
    if (b.braced) {
      for (const x of [-.94, .94]) for (const z of [-.92, .92]) sphere(cg, '#9baba0', x, .05, z, .22, 1.2, .6, 1.1);
      for (const x of [-.98, .98]) { beam(cg, [x, .1, -.9], [x, .95, .9], .055, '#946c44'); beam(cg, [x, .95, -.9], [x, .1, .9], .055, '#946c44'); }
      box(cg, '#b49360', 0, 1.02, -.98, 1.86, .14, .08);
    }
  }
  if (type === 'fire') {
    const y = state?buildingBase(state,b):DECK;
    const fire = new T.Group(); fire.position.set(0, y, .2); g.add(fire);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; sphere(fire, '#8a9287', Math.sin(a) * .4, .08, Math.cos(a) * .4, .12, 1, .7, 1); }
    for (let i = 0; i < 3; i++) { const log = cylinder(fire, '#78543d', 0, .12 + i * .05, 0, .065, .07, .61); log.rotation.z = Math.PI / 2; log.rotation.y = i * 1.1; }
    const flames = new T.Group(); fire.add(flames); g.userData.flames = flames;
    mesh(new T.ConeGeometry(.23, .68, 7), material('#f8a34d', { emissive: '#ff842a', emissiveIntensity: .6 }), flames, 0, .46, 0);
    mesh(new T.ConeGeometry(.13, .48, 7), material('#ffe2a0', { emissive: '#ffc66b', emissiveIntensity: .6 }), flames, .03, .36, .08);
    const glow = circle(fire, 1.6, '#ffd083', 0, .012, 0, .11); g.userData.glow = glow;
    const light = new T.PointLight('#ffb869', 2.6, 5, 1.5); light.position.set(0, y + .6, .2); g.add(light); g.userData.light = light;
  }
  if (type === 'net') {
    const y = state?buildingBase(state,b):DECK;
    for (const x of [-.65, .65]) cylinder(g, '#9b754b', x, y + .7, 0, .055, .07, 1.5, 7);
    beam(g, [-.7, y + 1.25, 0], [.7, y + 1.25, 0], .04, '#d6b780');
    for (let i = 0; i < 6; i++) { const x = -.58 + i * .23; beam(g, [x, y + .15, .16], [x, y + 1.17, 0], .013, '#d9c498', 4); }
    for (let i = 0; i < 5; i++) beam(g, [-.62, y + .18 + i * .23, .15 - i * .03], [.62, y + .18 + i * .23, .15 - i * .03], .013, '#d9c498', 4);
    const logs = new T.Group(); logs.position.y = y; g.add(logs); g.userData.logs = logs;
    const model = resourceModel('wood'); model.scale.setScalar(.65); logs.add(model);
  }
  if(['platform','bridge'].includes(type))batch(g);
  g.position.set(b.x, 0, b.z); g.rotation.y = b.rotation * Math.PI / 2;
  g.traverse(o => { if (o.isMesh) o.userData.buildingId = b.id; });
  return g;
}

function character() {
  const g = new T.Group(), body = new T.Group(); g.add(body);
  box(body, '#df9d55', 0, .68, 0, .46, .49, .31); box(body, '#efbf70', 0, .73, .17, .26, .21, .035);
  box(body, '#5d857b', 0, .66, -.23, .35, .39, .18); box(body, '#7d9c80', 0, .92, -.23, .31, .09, .17);
  const warmer=new T.Group();body.add(warmer);warmer.visible=false;
  box(warmer,'#c97558',.29,.58,.04,.17,.23,.13);box(warmer,'#f0d39b',.29,.59,.112,.1,.025,.012);box(warmer,'#f0d39b',.29,.59,.113,.025,.1,.012);
  for (const x of [-.18, .18]) box(body, '#a97d4f', x, .71, .13, .045, .46, .05);
  cylinder(body, '#efbb8f', 0, .98, 0, .11, .11, .13);
  sphere(body, '#f1c699', 0, 1.2, .02, .29, .9, 1, .85);
  sphere(body, '#815f45', 0, 1.33, -.035, .27, .96, .7, .9);
  for (const x of [-.093, .093]) sphere(body, '#283d3f', x, 1.21, .239, .027, .8, 1.2, .6);
  box(body, '#b87560', 0, 1.105, .255, .058, .017, .018);
  cylinder(body, '#e6c58e', 0, 1.46, 0, .46, .44, .055, 12); cylinder(body, '#e8c58a', 0, 1.55, -.02, .23, .28, .19, 10); cylinder(body, '#b87956', 0, 1.49, -.02, .28, .29, .07, 10);
  const arms = [], legs = [];
  for (const sign of [-1, 1]) {
    const arm = new T.Group(); arm.position.set(sign * .3, .88, 0); body.add(arm); arms.push(arm);
    box(arm, '#e4a35d', 0, -.15, 0, .16, .31, .21); sphere(arm, '#efbf90', 0, -.34, .02, .09);
    const leg = new T.Group(); leg.position.set(sign * .13, .45, 0); g.add(leg); legs.push(leg);
    box(leg, '#4f7272', 0, -.17, 0, .19, .31, .22); box(leg, '#655641', 0, -.36, .05, .2, .12, .31);
  }
  const axe = new T.Group(); arms[1].add(axe); axe.position.set(.04, -.27, .06); axe.rotation.z = -.3;
  cylinder(axe, '#8c663f', 0, .01, .13, .027, .029, .49, 6); box(axe, '#879e9b', .08, .24, .13, .24, .15, .07); box(axe, '#c8d6c5', .19, .24, .13, .04, .13, .09);
  g.userData = { body, arms, legs, axe, warmer };
  return g;
}

function dispose(obj){obj.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.vertexColors||o.material.userData.local)o.material.dispose();}});}

export function createWorld(canvas) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
  const scene = new T.Scene(); scene.background = new T.Color('#b0dcd4'); scene.fog = new T.Fog('#b0dcd4', 38, 90);
  const camera = new T.OrthographicCamera(-15, 15, 15, -15, .1, 180);
  const hemi = new T.HemisphereLight('#fff8db', '#55998c', 2.4); scene.add(hemi);
  const sun = new T.DirectionalLight('#ffe3ae', 3.5); sun.position.set(-10, 22, 12); sun.castShadow = true; scene.add(sun);
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -22; sun.shadow.camera.right = 22; sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22; sun.shadow.normalBias = .035; sun.shadow.bias = -.00035;
  const wreckTerrain=terrain(scene,[-21,-18.5,11,10]);wreckTerrain.visible=false;
  const terrains = [terrain(scene, [-10, -9, 20, 18]), terrain(scene, [9.2, -6.5, 8.5, 8.5]),wreckTerrain];
  const waterMat = new T.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStorm: { value: 0 } }, transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vWorld; void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
    fragmentShader: `uniform float uTime; uniform float uStorm; varying vec3 vWorld;
      void main(){ vec2 p=vWorld.xz; float a=sin(p.x*.9+p.y*1.4+uTime*.75); float b=sin(p.x*1.8-p.y*.65-uTime*.6);
      float crest=smoothstep(.94,1.,a*.55+b*.45); float bands=sin(p.y*.3+p.x*.12)*.025;
      vec3 c=mix(vec3(.14,.60,.63),vec3(.20,.43,.50),uStorm*.6); c+=bands+crest*.12;
      float glint=smoothstep(.98,1.,sin(p.x*3.8+sin(p.y*3.5)+uTime*.5))*.05; c+=glint; gl_FragColor=vec4(c,.82); }`,
  });
  const sea = new T.Mesh(new T.PlaneGeometry(250, 250), waterMat); sea.rotation.x = -Math.PI / 2; sea.position.y = -.12; sea.renderOrder = 4; scene.add(sea);
  // Soft translucent shelves give shallow water a different color from open sea.
  const shoal = circle(scene, 10, '#aadac0', -.3, -.8, 0); shoal.scale.set(1.02, .91, 1);
  const shoal2 = circle(scene, 4.4, '#b2d8c1', 13.5, -.79, -2.2); shoal2.scale.set(1, .91, 1);
  const foams = [];
  for (let k = 0; k < 2; k++) {
    const geo = new T.BufferGeometry(), points = new Float32Array(129 * 3); geo.setAttribute('position', new T.BufferAttribute(points, 3));
    const line = new T.Line(geo, new T.LineBasicMaterial({ color: '#e4f3dc', transparent: true, opacity: .6, depthWrite: false })); line.renderOrder = 6; scene.add(line); foams.push(line);
  }
  const beachDetails = new T.Group(); scene.add(beachDetails);
  // Small beach details are deterministic and stay out of the interaction system.
  for (let i = 0; i < 115; i++) {
    const x = hash(i + 41) * 15 - 7.5, z = hash(i + 234) * 13 - 6.5, h = groundHeight(x, z);
    if (h < .4) continue;
    if (h > .9 || i % 5 === 0) {
      for (let j = 0; j < 3; j++) leaf(beachDetails, j % 2 ? '#a2b77c' : '#8da471', [x, h, z], [x + (j - 1) * .12, h + .16 + hash(i) * .12, z + .09], .028, .03);
    } else {
      sphere(beachDetails, i % 3 ? '#f7e6be' : '#c5b391', x, h + .025, z, .035 + hash(i + 4) * .055, 1.4, .5, 1);
    }
  }
  batch(beachDetails);
  // A weathered wayfinding post faces the reef, not an invisible quest marker.
  const sign = new T.Group(); sign.position.set(5.3, groundHeight(5.3, -2.2), -2.2); scene.add(sign);
  cylinder(sign, '#9d7a50', 0, .56, 0, .045, .055, 1.15); box(sign, '#cdb17a', 0, 1.02, 0, .8, .28, .06);
  beam(sign, [-.22, 1.02, .04], [.21, 1.02, .04], .025, '#6e7860', 4); beam(sign, [.08, 1.12, .04], [.23, 1.02, .04], .025, '#6e7860', 4); beam(sign, [.08, .92, .04], [.23, 1.02, .04], .025, '#6e7860', 4);
  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const c = new T.Group(); scene.add(c); c.position.set(-30 + i * 11, 8 + i % 3, -24 - i % 2 * 10);
    for (let j = 0; j < 4; j++) sphere(c, '#fff4d9', j * 1.2, Math.sin(j * 1.8) * .4, j % 2 * .5, 1.2 + hash(i * 7 + j), 1.4, .55, .7);
    c.traverse(o => { if (o.isMesh) o.castShadow = false; }); clouds.push(c);
  }
  const gulls = [];
  for (let i = 0; i < 4; i++) {
    const g = new T.Group(); scene.add(g);
    beam(g, [-.35, 0, .03], [0, .1, 0], .018, '#eaf0d9', 4); beam(g, [0, .1, 0], [.35, 0, .03], .018, '#eaf0d9', 4); gulls.push(g);
  }
  const nodeModels = new Map(), buildings = new Map(), pickable = [];
  const actor = character(); actor.traverse(o => { if (o.isMesh) o.castShadow = false; }); scene.add(actor);
  const actorShadow = circle(scene, .39, '#184e4a', 0, 0, 0, .12);
  const voyageWorld=createVoyageWorld(scene,{mesh,box,cylinder,beam,sphere,material});
  const frontierWorld=createFrontierWorld(scene,{terrain,resourceModel,dispose});
  scene.add(sun.target);let shadowChunk='';
  const selectedRing = ring(scene, .64, .71, '#ffdf8d', .7, .9);
  const marker = ring(scene, .2, .27, '#fff0b8', .7, .9); marker.visible = false;
  const goalHalo = ring(scene, .87, .93, '#fbe8a7', .7, .65);
  const bridgeHints = [];
  for (const x of [6.6, 8.8, 11]) { const m = ring(scene, .27, .31, '#fbebba', 1.22, .45); m.position.x = x; m.position.z = -2.2; bridgeHints.push(m); }
  let ghost = null, ghostType = null, ghostRotation = 0;
  const ghostMaterials = [material('#8dd5b0', { transparent: true, opacity: .52, depthWrite: false }), material('#dd8c70', { transparent: true, opacity: .5, depthWrite: false })];
  const gridGeo = new T.BufferGeometry(), gridPositions = [];
  for (let i = -8; i <= 9; i++) { gridPositions.push(i * GRID - GRID / 2, DECK + .015, -9.9, i * GRID - GRID / 2, DECK + .015, 9.9); }
  for (let i = -4; i <= 5; i++) { gridPositions.push(-18.7, DECK + .015, i * GRID - GRID / 2, 20.9, DECK + .015, i * GRID - GRID / 2); }
  gridGeo.setAttribute('position', new T.Float32BufferAttribute(gridPositions, 3));
  const grid = new T.LineSegments(gridGeo, new T.LineBasicMaterial({ color: '#fff5cf', transparent: true, opacity: .18, depthWrite: false })); grid.visible = false; scene.add(grid);
  const sparks = [];
  let yaw = .48, targetYaw = .48, zoom = 17.8, targetZoom = 17.8, overview = false, camTarget = new T.Vector3(-.3, 0, 0), last = performance.now(), visualTime = 0, lastState;
  let width = 1, height = 1;
  const ray = new T.Raycaster(), ndc = new T.Vector2(), projected = new T.Vector3();
  const look = new T.Vector3();
  function resize() {
    width = canvas.clientWidth; height = canvas.clientHeight; renderer.setSize(width, height, false);
    const half = zoom * (width < 650 ? .68 : .55), aspect = width / height;
    camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();
  function sync(s,focus=s.player) {
    const nodes=new Map(s.nodes.map(n=>[n.id,n]));
    for(const [id,obj]of nodeModels)if(!nodes.has(id)){scene.remove(obj);dispose(obj);nodeModels.delete(id);}
    for(const n of s.nodes)if(!nodeModels.has(n.id)){
      const model=resourceModel(n.type);model.position.set(n.x,groundHeight(n.x,n.z),n.z);model.rotation.y=hash(n.x*3+n.z)*6.28;
      model.traverse(o=>{if(o.isMesh)o.userData.nodeId=n.id;});scene.add(model);nodeModels.set(n.id,model);renderer.shadowMap.needsUpdate=true;
    }
    const active=nearBuildings(s,focus.x,focus.z,38),ids=new Set(active.map(b=>b.id));
    for(const [id,obj]of buildings)if(!ids.has(id)){scene.remove(obj);dispose(obj);buildings.delete(id);renderer.shadowMap.needsUpdate=true;}
    for(const b of active){
      const signature=`${b.x}/${b.z}/${b.tint}/${b.type}/${b.rotation}/${b.braced}/${b.raised}/${Math.round(buildingBase(s,b)*100)}/${Math.floor((b.hp??100)/25)}/${b.type==='workbench'&&s.voyage?.lamp}`;
      if(buildings.get(b.id)?.userData.signature!==signature){
        if(buildings.has(b.id)){const old=buildings.get(b.id);scene.remove(old);dispose(old);}
        const obj=structureModel(b,s);obj.userData.signature=signature;scene.add(obj);buildings.set(b.id,obj);renderer.shadowMap.needsUpdate=true;
      }
    }
  }

  function setPreview(type, x, z, rotation, valid, s,patch=1) {
    grid.visible = Boolean(type);
    if (!type) { if (ghost) {scene.remove(ghost);dispose(ghost);} ghost = null; ghostType = null; return; }
    const signature=`${type}/${patch}/${Math.round(floorHeight(s,x,z)*100)}`;
    if(s.survival.started)grid.position.set(snap(x),0,snap(z));
    if (signature !== ghostType || rotation !== ghostRotation) {
      if (ghost) {scene.remove(ghost);dispose(ghost);}
      ghost = ['remove','brace','highdeck'].includes(type) ? new T.Group() : structureModel({ id: -1, x, z, rotation: 0, type, lit: true }, s);
      if (['remove', 'brace','highdeck'].includes(type)) box(ghost, '#9ed6b3', 0, type==='highdeck'?2.55:floorHeight(s,x,z)+.15, 0, 2.08, .3, 2.08);
      if(patch===3&&['platform','bridge'].includes(type))box(ghost,'#9ed6b3',0,DECK-.08,0,GRID*3-.06,.12,GRID*3-.06);
      ghost.traverse(o => { if (o.isMesh) { o.material = ghostMaterials[0]; o.castShadow = false; o.receiveShadow = false; o.userData = {}; } if (o.isLight) o.visible = false; });
      scene.add(ghost); ghostType = signature; ghostRotation = rotation;
    }
    ghost.position.set(x, 0, z); ghost.rotation.y = rotation * Math.PI / 2;
    ghost.traverse(o => { if (o.isMesh) o.material = ghostMaterials[valid ? 0 : 1]; });
  }
  function burst(x, y, z, color = '#f4d795', count = 12) {
    for (let i = 0; i < count; i++) {
      const m = mesh(new T.BoxGeometry(.06, .06, .06), color, scene, x, y, z); m.castShadow = false;
      sparks.push({ mesh: m, life: 1, vx: (hash(i * 7 + visualTime) - .5) * 2.6, vy: 1.5 + hash(i + 18) * 1.9, vz: (hash(i * 6 + 4 + visualTime) - .5) * 2.6 });
    }
  }
  // Rain follows the player, so mobile rendering never pays for rain over the sea.
  const rainPositions = new Float32Array(380 * 6), rainGeo = new T.BufferGeometry();
  rainGeo.setAttribute('position', new T.BufferAttribute(rainPositions, 3));
  const rain = new T.LineSegments(rainGeo, new T.LineBasicMaterial({ color: '#d2e4d5', transparent: true, opacity: .4, depthWrite: false })); rain.frustumCulled = false; scene.add(rain);
  function update(s, dt, { selected = null, moving = 0, gathering = 0, destination = null, intro = false, editor = null } = {}) {
    lastState = s; visualTime += dt;const focus=editor||s.player; sync(s,focus);
    const weather = tide(s); sea.position.set(focus.x,weather.water,focus.z);
    frontierWorld.update(s,visualTime,focus);
    const sk=`${Math.floor(focus.x/16)},${Math.floor(focus.z/16)}`;if(sk!==shadowChunk){shadowChunk=sk;sun.position.set(focus.x-10,22,focus.z+12);sun.target.position.set(focus.x,0,focus.z);renderer.shadowMap.needsUpdate=true;}
    if(wreckTerrain.visible!==Boolean(s.voyage?.started)){wreckTerrain.visible=Boolean(s.voyage?.started);renderer.shadowMap.needsUpdate=true;}
    voyageWorld.update(s,visualTime,moving);
    waterMat.uniforms.uTime.value = visualTime; waterMat.uniforms.uStorm.value = weather.rain;
    const sky = new T.Color('#b8dfd4').lerp(new T.Color('#668d98'), weather.rain * .75).lerp(new T.Color('#596d85'),(1-(weather.daylight??1))*.55); scene.background.copy(sky); scene.fog.color.copy(sky);
    sun.intensity = (3.5-weather.rain*2.2)*(weather.daylight??1); hemi.intensity = (2.4-weather.rain*.7)*(.5+.5*(weather.daylight??1));
    scene.fog.near=weather.fog?16:38;scene.fog.far=weather.fog?40:90;
    const currentNodes=new Map(s.nodes.map(n=>[n.id,n]));
    for (const [id, obj] of nodeModels) {
      const n = currentNodes.get(id), visible = nodeReady(s, n) && !nodeBlocked(s, n);
      if (visible !== obj.visible) renderer.shadowMap.needsUpdate = true;
      obj.visible = visible;
      if (n.type === 'wood') obj.position.y = Math.max(groundHeight(n.x, n.z), weather.water - .05) + Math.sin(visualTime * 2 + n.x) * .018;
    }
    let lights=0;
    for (const b of nearBuildings(s,focus.x,focus.z,38).sort((a,b)=>Math.hypot(a.x-focus.x,a.z-focus.z)-Math.hypot(b.x-focus.x,b.z-focus.z))) {
      const obj = buildings.get(b.id); if (!obj) continue;
      if(obj.userData.light)obj.userData.light.visible=lights++<8&&(['beacon','lantern'].includes(b.type)||b.lit);
      if (b.type === 'cabin') {
        const inside = covered(s, s.player.x, s.player.z)?.id === b.id;
        obj.userData.roof.material.opacity = T.MathUtils.lerp(obj.userData.roof.material.opacity, inside ? .16 : .98, .12);
        obj.userData.roof.castShadow = !inside; obj.userData.ribs.visible = !inside;
      }
      if (b.type === 'fire') {
        obj.userData.flames.visible = Boolean(b.lit); obj.userData.glow.visible = Boolean(b.lit); obj.userData.light.visible = Boolean(b.lit)&&lights<=8;
        obj.userData.flames.scale.set(1 + Math.sin(visualTime * 13) * .09, 1 + Math.sin(visualTime * 9) * .16, 1);
        obj.userData.light.intensity = 2.6 + Math.sin(visualTime * 11) * .25;
      }
      if(b.type==='stove'){obj.userData.flames.visible=Boolean(b.lit);obj.userData.flames.scale.y=1+Math.sin(visualTime*10)*.09;}
      if (b.type === 'net') obj.userData.logs.visible = b.stored > 0;
    }
    actor.position.x = s.player.x; actor.position.z = s.player.z;
    const aboard=Boolean(s.voyage?.boat?.aboard),fy = aboard?weather.water+.46:floorHeight(s, s.player.x, s.player.z); actor.position.y = T.MathUtils.lerp(actor.position.y, fy, 1 - Math.exp(-dt * 12));
    let delta = Math.atan2(Math.sin(s.player.angle - actor.rotation.y), Math.cos(s.player.angle - actor.rotation.y)); actor.rotation.y += delta * Math.min(1, dt * 14);
    const anim = actor.userData; anim.axe.visible = s.axe&&!aboard;anim.warmer.visible=Boolean(s.voyage?.warmer);
    const stride = visualTime * 12; anim.body.position.y = moving ? Math.abs(Math.sin(stride)) * .045 : Math.sin(visualTime * 2) * .012;
    anim.legs[0].rotation.x = aboard?-.9:Math.sin(stride) * .55 * moving; anim.legs[1].rotation.x = aboard?-.9:-Math.sin(stride) * .55 * moving;
    anim.arms[0].rotation.x = aboard?-.55+Math.sin(visualTime*7.5)*.22*moving:-Math.sin(stride) * .45 * moving; anim.arms[1].rotation.x = aboard?-.55+Math.sin(visualTime*7.5)*.22*moving:gathering ? -.8 + Math.sin(visualTime * 17) * .8 : Math.sin(stride) * .45 * moving;
    actorShadow.visible=!aboard;actorShadow.position.set(s.player.x, fy + .016, s.player.z);
    if (selected) { selectedRing.visible = true; selectedRing.position.set(selected.x, Math.max(floorHeight(s, selected.x, selected.z), weather.water) + .05, selected.z); selectedRing.scale.setScalar(1 + Math.sin(visualTime * 4) * .06); } else selectedRing.visible = false;
    marker.visible = Boolean(destination); if (destination) marker.position.set(destination.x, Math.max(floorHeight(s, destination.x, destination.z),aboard?weather.water:-1) + .025, destination.z);
    goalHalo.position.set(-2.2, Math.max(.65, weather.water + .03), 2.2); goalHalo.visible = !s.milestones.deck;
    goalHalo.material.opacity = .35 + Math.sin(visualTime * 2) * .15;
    bridgeHints.forEach((m, i) => { m.visible = s.axe && !s.visitedReef && !s.buildings.some(b => ['bridge', 'platform'].includes(b.type) && Math.abs(b.x - [6.6, 8.8, 11][i]) < .1 && Math.abs(b.z + 2.2) < .1); m.position.y = Math.max(.72, weather.water + .04); m.material.opacity = .25 + Math.sin(visualTime * 2 - i) * .13; });
    foams.forEach((line, i) => {
      const points = line.geometry.attributes.position.array, r = i ? 3.3 : 7.9;
      const f = 1 - Math.max(0, weather.water - .4) * .08;
      for (let j = 0; j < 129; j++) { const a = j / 128 * Math.PI * 2, rad = r * (1 + .045 * Math.sin(a * 5 + 1) + .035 * Math.cos(a * 3)) * f; points[j * 3] = (i ? 13.5 : -.3) + Math.cos(a) * (rad + Math.sin(visualTime + a * 7) * .08); points[j * 3 + 1] = weather.water + .025; points[j * 3 + 2] = (i ? -2.2 : 0) + Math.sin(a) * rad * .925; }
      line.geometry.attributes.position.needsUpdate = true;
    });
    for (let i = 0; i < gulls.length; i++) { const a = visualTime * .14 + i * 1.6; gulls[i].position.set(Math.sin(a) * 13 + 3, 5.2 + i * .5 + Math.sin(visualTime * 1.5 + i) * .2, Math.cos(a) * 8 - 2); gulls[i].rotation.y = -a; gulls[i].rotation.z = Math.sin(visualTime * 4 + i) * .15; gulls[i].visible = weather.rain < .4; }
    clouds.forEach((c, i) => { c.position.x += dt * .13; if (c.position.x > 50) c.position.x = -40; });
    rain.visible = weather.rain > .15;
    if (rain.visible) {
      const pos = rain.geometry.attributes.position.array;
      for (let i = 0; i < 380; i++) {
        const x = s.player.x + (hash(i * 4 + 77) - .5) * 30, z = s.player.z + (hash(i * 8 + 4) - .5) * 24;
        const y = 10 - (visualTime * (7 + hash(i) * 4) + hash(i * 3) * 12) % 12;
        pos.set([x, y, z, x - .09, y + .45, z + .1], i * 6);
      }
      rain.geometry.attributes.position.needsUpdate = true; rain.material.opacity = weather.rain * .35;
    }
    for (let i = sparks.length - 1; i >= 0; i--) { const p = sparks[i]; p.life -= dt; p.vy -= dt * 5; p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt; p.mesh.rotation.x += dt * 3; p.mesh.scale.setScalar(Math.max(0, p.life)); if (p.life <= 0) { scene.remove(p.mesh); p.mesh.geometry.dispose(); sparks.splice(i, 1); } }
    yaw += Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw)) * Math.min(1, dt * 7);
    zoom = T.MathUtils.lerp(zoom, targetZoom, 1 - Math.exp(-dt * 6));
    if(editor){look.set(editor.x,.5,editor.z);} else if (intro) { look.set(2, .5, 0); } else if (overview) { look.set(s.survival.started?s.player.x:s.voyage?.started?s.player.x*.45+2:3.7, .5, s.survival.started?s.player.z:s.voyage?.started?s.player.z*.45-.2:-.4); } else {
      const ahead = width < 650 ? (s.voyage?.started?3.7:3) : .8;
      look.set(s.player.x - Math.sin(yaw) * ahead, .5, s.player.z - Math.cos(yaw) * ahead);
    }
    camTarget.lerp(look, 1 - Math.exp(-dt * (intro ? .8 : 4)));
    const distance = 30; camera.position.set(camTarget.x + Math.sin(yaw) * distance, 26, camTarget.z + Math.cos(yaw) * distance); camera.lookAt(camTarget);
    resize(); renderer.render(scene, camera);
  }
  function pick(x, y) {
    const rect = canvas.getBoundingClientRect(); ndc.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2); ray.setFromCamera(ndc, camera);
    const objs = [...terrains.filter(v=>v.visible), sea, ...[...nodeModels.values()].filter(v=>v.visible),...frontierWorld.pickables(), ...buildings.values(),...voyageWorld.pickables()];
    const hits = ray.intersectObjects(objs, true);
    const useful = hits.find(h => h.object.userData.nodeId || h.object.userData.buildingId || h.object.userData.voyageId || h.object.userData.survivalId);
    const ground = hits.find(h => h.object === sea || terrains.includes(h.object) || frontierWorld.pickables().includes(h.object) || h.object.userData.buildingId || h.object.userData.voyageId || h.object.userData.survivalId);
    return { point: (ground || hits[0])?.point, nodeId: useful?.object.userData.nodeId, buildingId: useful?.object.userData.buildingId,voyageId:useful?.object.userData.voyageId,survivalId:useful?.object.userData.survivalId };
  }
  function screen(x, y, z) { projected.set(x, y, z).project(camera); return { x: (projected.x + 1) * width / 2, y: (1 - projected.y) * height / 2, visible: projected.z < 1 && projected.z > -1 && Math.abs(projected.x) < 1.2 && Math.abs(projected.y) < 1.2 }; }
  return { renderer, scene, camera, update, pick, screen, burst, setPreview,
    cameraBasis: () => ({ right: { x: Math.cos(yaw), z: -Math.sin(yaw) }, forward: { x: -Math.sin(yaw), z: -Math.cos(yaw) } }),
    rotate: direction => { targetYaw += direction * Math.PI / 2; },
    zoom: delta => { overview = false; targetZoom = T.MathUtils.clamp(targetZoom + delta, 10, 25); },
    overview: () => { overview = !overview; targetZoom = overview ? (width < 650 ? 22 : 24) : (width < 650 ? 14 : 17.8); },
    resetCamera: (p={x:0,z:2}) => { overview = false; targetYaw = .48; targetZoom = width < 650 ? 14.8 : 17.8; camTarget.set(p.x, .5, p.z); },
  };
}
