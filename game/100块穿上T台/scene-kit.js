import * as T from './vendor/three.module.js';

export { T };
const cube = new T.BoxGeometry(1, 1, 1);
const sphere = new T.SphereGeometry(1, 24, 16);
const tube = new T.CylinderGeometry(1, 1, 1, 24);
const mats = new Map();

export function material(color, metalness = 0, roughness = .63) {
  const key = [color, metalness, roughness].join('|');
  if (!mats.has(key)) mats.set(key, new T.MeshStandardMaterial({color, metalness, roughness}));
  return mats.get(key);
}

export function mesh(parent, geometry, surface, x, y, z, sx = 1, sy = 1, sz = 1, casts = true) {
  const obj = new T.Mesh(geometry, typeof surface === 'object' ? surface : material(surface));
  obj.position.set(x, y, z);
  obj.scale.set(sx, sy, sz);
  obj.castShadow = casts;
  obj.receiveShadow = true;
  parent.add(obj);
  return obj;
}

export function box(parent, x,y,z, sx,sy,sz, color, casts = true) {
  return mesh(parent, cube, color, x,y,z,sx,sy,sz,casts);
}

export function ball(parent, x,y,z, sx,sy,sz, color, casts = true) {
  return mesh(parent, sphere, color, x,y,z,sx,sy,sz,casts);
}

export function column(parent, x,y,z, rx,h,rz, color, casts = true) {
  return mesh(parent, tube, color, x,y,z,rx,h,rz,casts);
}

export function rod(parent, from, to, radius, color) {
  const a = new T.Vector3(...from), b = new T.Vector3(...to), delta = b.clone().sub(a);
  const center = a.clone().lerp(b, .5);
  const part = column(parent, center.x, center.y, center.z, radius, delta.length(), radius, color);
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  return part;
}

export function group(parent, x=0,y=0,z=0) {
  const obj = new T.Group();
  obj.position.set(x,y,z);
  parent.add(obj);
  return obj;
}

export function painted(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function sign(parent, words, x,y,z, width,height, options={}) {
  const {ground='#1f1736', ink='#fff1ca', small='', rotate=0} = options;
  const tex = painted(768, 192, (c,w,h) => {
    c.fillStyle = ground;
    c.fillRect(0,0,w,h);
    c.strokeStyle = ink;
    c.globalAlpha = .38;
    c.lineWidth = 3;
    c.strokeRect(12,12,w-24,h-24);
    c.globalAlpha = 1;
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '800 72px Arial, sans-serif';
    c.fillText(words,w/2,small ? 76 : h/2,w-58);
    if (small) {
      c.font = '700 27px Arial, sans-serif';
      c.fillText(small,w/2,136,w-58);
    }
  });
  const plaque = mesh(parent, new T.PlaneGeometry(width,height), new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}), x,y,z,1,1,1,false);
  plaque.rotation.y = rotate;
  return plaque;
}

export function ring(parent, x,y,z, radius, thickness, color) {
  const result = mesh(parent,new T.TorusGeometry(radius,thickness,10,54),new T.MeshBasicMaterial({color}),x,y,z,1,1,1,false);
  result.rotation.x = -Math.PI/2;
  return result;
}

export function stage(host, background, {fov=42, fog=null, shadowArea=9}={}) {
  const scene = new T.Scene();
  scene.background = new T.Color(background);
  if (fog) scene.fog = new T.Fog(background, fog[0], fog[1]);
  const camera = new T.PerspectiveCamera(fov,1,.08,160);
  const webgl = new T.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
  webgl.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
  webgl.shadowMap.enabled = true;
  webgl.shadowMap.type = T.PCFSoftShadowMap;
  webgl.toneMapping = T.ACESFilmicToneMapping;
  webgl.toneMappingExposure = 1.27;
  webgl.outputColorSpace = T.SRGBColorSpace;
  host.prepend(webgl.domElement);
  const ambient = new T.HemisphereLight(0xfff1fc,0xa094bb,2.55);
  scene.add(ambient);
  const key = new T.DirectionalLight(0xffedd9,3.05);
  key.position.set(-5,9,6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -shadowArea;
  key.shadow.camera.right = key.shadow.camera.top = shadowArea;
  key.shadow.camera.near = .2;
  key.shadow.camera.far = 48;
  key.shadow.normalBias = .035;
  key.shadow.bias = -.00018;
  scene.add(key,key.target);
  const fill = new T.DirectionalLight(0xb9d5ff,1.05);
  fill.position.set(8,5,-7);
  scene.add(fill);
  const resize = () => {
    const width = Math.max(1,host.clientWidth), height = Math.max(1,host.clientHeight);
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    webgl.setSize(width,height,false);
  };
  new ResizeObserver(resize).observe(host);
  resize();
  return {scene,camera,webgl,key,ambient};
}

export function disposeOwned(groupObject) {
  groupObject.removeFromParent();
  groupObject.traverse(obj => {
    if (obj.geometry && ![cube,sphere,tube].includes(obj.geometry)) obj.geometry.dispose();
    const m = obj.material;
    if (m && ![...mats.values()].includes(m)) {
      if (m.map) m.map.dispose();
      m.dispose();
    }
  });
}

export function soundBoard() {
  let context;
  let enabled = true;
  const play = (notes, wave='sine', length=.12, volume=.095) => {
    if (!enabled || !globalThis.AudioContext) return;
    context ??= new AudioContext();
    if (context.state === 'suspended') context.resume().catch(()=>{});
    for (const [i,note] of notes.entries()) {
      const at = context.currentTime+i*.072;
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = wave;
      oscillator.frequency.value = note;
      gain.gain.setValueAtTime(.0001,at);
      gain.gain.exponentialRampToValueAtTime(volume,at+.018);
      gain.gain.exponentialRampToValueAtTime(.0001, at+length);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at+length+.03);
    }
  };
  return {
    tap: () => play([540], 'sine', .09, .045),
    good: () => play([659,880,1175]),
    bad: () => play([260,195], 'triangle'),
    win: () => play([523,659,784,1047,1319], 'triangle', .2),
    toggle: () => (enabled = !enabled),
  };
}

export function readSave(key, fallback) {
  try { return {...fallback,...JSON.parse(localStorage.getItem(key) || '{}')}; }
  catch { return {...fallback}; }
}

export function writeSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch { /* A private preview can disable storage. */ }
}

export function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (Math.imul(1664525,value) + 1013904223) >>> 0) / 4294967296);
}
