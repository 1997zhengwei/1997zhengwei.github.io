// 3D version of the doodle look: flat toon colours with one shade step and a dark ink outline
// (inverted hull). Static props are merged into one vertex-coloured mesh to keep draw calls low.
import * as THREE from './vendor/three.module.js';
export { THREE };

export const INK = '#2b2431';
const ramp = new THREE.DataTexture(new Uint8Array([150, 150, 150, 255, 205, 205, 205, 255, 255, 255, 255, 255]), 3, 1);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
export const toon = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp });

const outlineCache = new Map();
export function outlineMaterial(thickness = .05) {
  if (outlineCache.has(thickness)) return outlineCache.get(thickness);
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = shader => {
    shader.vertexShader = 'attribute vec3 outlineNormal;\n' + shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n  transformed += outlineNormal * ' + thickness.toFixed(3) + ';');
  };
  m.customProgramCacheKey = () => 'outline' + thickness;
  outlineCache.set(thickness, m);
  return m;
}

const BOX = new THREE.BoxGeometry(1, 1, 1);
const SPH = new THREE.SphereGeometry(1, 14, 10);
const cylCache = new Map();
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3();

// Collects coloured primitives, then merges them into one geometry with smoothed outline normals.
export class Parts {
  constructor() { this.geos = []; }
  push(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    tmpM.compose(tmpV.set(x, y, z), tmpQ.setFromEuler(tmpE.set(rx, ry, rz)), tmpS.set(sx, sy, sz));
    g.applyMatrix4(tmpM);
    const c = new THREE.Color(color), n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k);
    this.geos.push(g); return this;
  }
  // y is the bottom of the box
  box(w, h, d, color, x, y, z, ry = 0, rx = 0, rz = 0) { return this.push(BOX, color, x, y + h / 2, z, rx, ry, rz, w, h, d); }
  cyl(rt, rb, h, color, x, y, z, seg = 14, rx = 0, rz = 0) {
    const key = rt + '/' + rb + '/' + seg;
    if (!cylCache.has(key)) cylCache.set(key, new THREE.CylinderGeometry(rt, rb, 1, seg));
    return this.push(cylCache.get(key), color, x, y + h / 2, z, rx, 0, rz, 1, h, 1);
  }
  ball(r, color, x, y, z, sx = 1, sy = 1, sz = 1) { return this.push(SPH, color, x, y, z, 0, 0, 0, r * sx, r * sy, r * sz); }
  cone(r, h, color, x, y, z, seg = 12) { return this.push(new THREE.ConeGeometry(r, h, seg), color, x, y + h / 2, z); }
  // gable roof prism: ridge runs along x, peak height h, depth d (z), centred on (x, y, z)
  gable(w, h, d, color, x, y, z, ry = 0) {
    const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2);
    return this.push(g, color, x, y, z, 0, ry, 0);
  }
  geometry() {
    let count = 0; for (const g of this.geos) count += g.attributes.position.count;
    const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), col = new Float32Array(count * 3);
    let o = 0;
    for (const g of this.geos) {
      if (!g.attributes.normal) g.computeVertexNormals();
      pos.set(g.attributes.position.array, o); nor.set(g.attributes.normal.array, o); col.set(g.attributes.color.array, o);
      o += g.attributes.position.count * 3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    // outline normals averaged per position so the hull has no cracks at hard box edges
    const sum = new Map(), key = i => Math.round(pos[i] * 200) + ',' + Math.round(pos[i + 1] * 200) + ',' + Math.round(pos[i + 2] * 200);
    for (let i = 0; i < pos.length; i += 3) { const k = key(i); const s = sum.get(k) || [0, 0, 0]; s[0] += nor[i]; s[1] += nor[i + 1]; s[2] += nor[i + 2]; sum.set(k, s); }
    const on = new Float32Array(pos.length);
    for (let i = 0; i < pos.length; i += 3) { const s = sum.get(key(i)); const l = Math.hypot(s[0], s[1], s[2]) || 1; on[i] = s[0] / l; on[i + 1] = s[1] / l; on[i + 2] = s[2] / l; }
    geo.setAttribute('outlineNormal', new THREE.BufferAttribute(on, 3));
    geo.computeBoundingSphere();
    return geo;
  }
  model(thickness = .05) {
    const group = new THREE.Group(), geo = this.geometry();
    const body = new THREE.Mesh(geo, toon); group.add(body);
    if (thickness) { const line = new THREE.Mesh(geo, outlineMaterial(thickness)); line.raycast = () => {}; group.add(line); }
    group.userData.body = body;
    return group;
  }
}

// soft round contact shadow
const shadowTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
  const g = c.createRadialGradient(32, 32, 4, 32, 32, 31); g.addColorStop(0, 'rgba(52,36,64,.42)'); g.addColorStop(1, 'rgba(52,36,64,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv);
})();
const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
const PLANE = new THREE.PlaneGeometry(1, 1);
export function blob(parent, x, y, z, rx, rz = rx) {
  const m = new THREE.Mesh(PLANE, shadowMat); m.rotation.x = -Math.PI / 2; m.position.set(x, y + .02, z); m.scale.set(rx * 2, rz * 2, 1); m.raycast = () => {}; parent.add(m); return m;
}

// ---------------------------------------------------------------- items (3D versions of the list icons)
export const ITEM3D = {
  bell(p) { p.cyl(.13, .27, .34, '#ffc93c', 0, .08, 0, 16).ball(.13, '#ffc93c', 0, .42, 0).ball(.07, '#c98d2f', 0, .06, 0).cyl(.05, .05, .1, '#c98d2f', 0, .52, 0, 8); },
  compass(p) { p.cyl(.27, .27, .08, '#f2c35a', 0, 0, 0, 20).cyl(.21, .21, .02, '#fffaf0', 0, .08, 0, 20).box(.06, .02, .3, '#ef5a4a', 0, .1, 0, .6).cyl(.05, .05, .08, '#f2c35a', 0, 0, -.3, 8, Math.PI / 2); },
  boat(p) { p.box(.56, .14, .22, '#ff9d3c', 0, 0, 0).box(.4, .06, .24, '#e2574c', 0, .12, 0).cyl(.02, .02, .5, '#7a5236', 0, .14, 0, 6).gable(.02, .36, .3, '#ffffff', .12, .2, 0, Math.PI / 2); },
  gift(p) { p.box(.38, .3, .38, '#ff6f91', 0, 0, 0).box(.42, .08, .42, '#ff8fab', 0, .28, 0).box(.08, .38, .43, '#ffd34d', 0, 0, 0).box(.43, .38, .08, '#ffd34d', 0, 0, 0).ball(.08, '#ffd34d', -.07, .42, 0, 1.2, .8, .8).ball(.08, '#ffd34d', .07, .42, 0, 1.2, .8, .8); },
  kite(p) { p.box(.42, .42, .03, '#6fb4ff', 0, .35, 0, 0, 0, Math.PI / 4).box(.04, .6, .035, '#ffffff', 0, .2, 0).box(.6, .04, .035, '#ffffff', 0, .35, 0).box(.03, .3, .03, '#ff6f91', .08, -.05, 0, 0, 0, .4); },
  duck(p) { p.ball(.26, '#ffd23f', 0, .2, 0, 1.2, .85, 1).ball(.16, '#ffd23f', .16, .45, 0).cone(.07, .14, '#ff9d3c', .3, .38, 0).ball(.03, INK, .25, .5, .08).ball(.03, INK, .25, .5, -.08).cone(.06, .12, '#fff3b0', -.05, .62, 0); },
  coin(p) { for (let k = 0; k < 4; k++) p.cyl(.26, .26, .07, k % 2 ? '#ffd23f' : '#ffc12e', (k % 2) * .04, k * .075, 0, 16); p.box(.12, .02, .03, '#fff3b0', 0, .31, .08); },
  key(p) { p.cyl(.14, .14, .06, '#ffc93c', -.18, 0, 0, 14).box(.42, .06, .08, '#ffc93c', .1, 0, 0).box(.06, .06, .14, '#ffc93c', .26, 0, .07); },
};
export function itemModel(id, scale = 1.6) {
  const p = new Parts(); ITEM3D[id](p); const m = p.model(.03); m.scale.setScalar(scale); return m;
}

// ---------------------------------------------------------------- people
const SKIN = ['#f6d0a8', '#e7b48a', '#c98d62', '#8d5a3c'], HAIR = ['#3b2a2a', '#6b4630', '#d99a4a', '#2b2431', '#b05a3a'];
const SHIRT = ['#ef6b6b', '#4d8fe0', '#ffd23f', '#7cd36a', '#9d7cf0', '#ff9d3c', '#ff7aa8', '#3fb6a8'], PANTS = ['#3f4a75', '#5a3e57', '#3d5d57', '#6b5a48'];
export function person(seed, opts = {}) {
  let s = seed * 9301 + 49297; const R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pick = a => a[Math.floor(R() * a.length)];
  const skin = opts.skin || pick(SKIN), shirt = opts.shirt || pick(SHIRT), pants = pick(PANTS), hair = pick(HAIR), k = opts.kid ? .75 : 1;
  const root = new THREE.Group();
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * .1 * k, .5 * k, 0);
    const p = new Parts(); p.cyl(.075 * k, .075 * k, .5 * k, pants, 0, -.5 * k, 0, 8).ball(.09 * k, '#3b3640', .03, -.5 * k, 0, 1.3, .7, 1);
    leg.add(p.model(.025)); root.add(leg); legs.push(leg);
  }
  const b = new Parts();
  b.cyl(.2 * k, .23 * k, .5 * k, shirt, 0, .48 * k, 0, 12);
  b.cyl(.06 * k, .06 * k, .42 * k, shirt, -.26 * k, .52 * k, 0, 8, 0, .25).cyl(.06 * k, .06 * k, .42 * k, shirt, .26 * k, .52 * k, 0, 8, 0, -.25);
  b.ball(.22 * k, skin, 0, 1.18 * k, 0);
  b.ball(.235 * k, hair, 0, 1.25 * k, -.03, 1, .75, 1);
  b.ball(.03, INK, .08 * k, 1.2 * k, .19 * k).ball(.03, INK, -.08 * k, 1.2 * k, .19 * k);
  if (opts.hat) b.cyl(.2 * k, .22 * k, .14 * k, opts.hat, 0, 1.36 * k, 0, 14).cyl(.3 * k, .3 * k, .03, opts.hat, 0, 1.36 * k, .05, 16);
  if (opts.bag) b.box(.14, .2, .1, opts.bag, .25, .5, 0);
  root.add(b.model(.03));
  root.userData.legs = legs;
  blob(root, 0, 0, 0, .32);
  return root;
}
