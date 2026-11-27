// scene.js —— 渲染器、灯光（采耳灯）、皮肤材质（透光/油光/泛红/按压形变）、毛巾、纸巾
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { headZ } from './ear-sdf.js';

export function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x24150e);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.3, 120);
  return { renderer, scene, camera };
}

export function makeLights(scene) {
  // 采耳头灯：从镜头左上方斜照进耳道，带软阴影
  const lamp = new THREE.SpotLight(0xfff0da, 300, 60, 0.36, 0.8, 1.6);
  lamp.position.set(-3.2, 4.2, 17);
  lamp.target.position.set(-0.3, -0.4, -0.6);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.camera.near = 8; lamp.shadow.camera.far = 30;
  lamp.shadow.bias = -0.0004; lamp.shadow.normalBias = 0.02; lamp.shadow.radius = 4;
  scene.add(lamp, lamp.target);
  // 房间暖色环境光
  const hemi = new THREE.HemisphereLight(0xffe0c8, 0x3a2418, 0.42);
  scene.add(hemi);
  // 侧后方暖光：照亮耳轮边缘
  const rim = new THREE.DirectionalLight(0xffc49a, 0.9);
  rim.position.set(6, 6, 2);
  scene.add(rim);
  return { lamp, hemi, rim };
}

// —— 程序化皮肤贴图：低频斑驳 + 毛孔 ——
function noiseCanvas(size, fn) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  fn(img.data, size);
  g.putImageData(img, 0, 0);
  return c;
}
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function tileNoise(x, y, period) {
  // 可平铺的值噪声
  const p = period;
  const n = (xx, yy) => vnoise(((xx % p) + p) % p, ((yy % p) + p) % p);
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = n(xi, yi), b = n(xi + 1, yi), c = n(xi, yi + 1), d = n(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function skinTextures() {
  const S = 512;
  const color = noiseCanvas(S, (D, n) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const u = x / n, v = y / n;
      const m = tileNoise(u * 6, v * 6, 6) * 0.55 + tileNoise(u * 14, v * 14, 14) * 0.3 + tileNoise(u * 40, v * 40, 40) * 0.15;
      const r = 236 + (m - 0.5) * 26, g = 214 + (m - 0.5) * 30 - (tileNoise(u * 9 + 3, v * 9, 9) - 0.5) * 18, b = 206 + (m - 0.5) * 30;
      const k = (y * n + x) * 4; D[k] = r; D[k + 1] = g; D[k + 2] = b; D[k + 3] = 255;
    }
  });
  const bump = noiseCanvas(S, (D, n) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const u = x / n, v = y / n;
      let p = tileNoise(u * 90, v * 90, 90); p = Math.pow(p, 3) * 1.6;           // 毛孔
      const w = tileNoise(u * 26, v * 8, 26) * 0.35;                            // 细纹
      const val = 200 - p * 120 - w * 60 + tileNoise(u * 180, v * 180, 180) * 30;
      const k = (y * n + x) * 4; D[k] = D[k + 1] = D[k + 2] = Math.max(0, Math.min(255, val)); D[k + 3] = 255;
    }
  });
  const ct = new THREE.CanvasTexture(color); ct.colorSpace = THREE.SRGBColorSpace;
  const bt = new THREE.CanvasTexture(bump);
  for (const t of [ct, bt]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }
  return { color: ct, bump: bt };
}

// 皮肤材质：顶点色(含 AO)、透光、耳垢油光、按摩泛红、按压形变、小抖动
export function skinMaterial(tex, shared) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true, map: tex.color, bumpMap: tex.bump, bumpScale: 0.55,
    roughness: 0.5, sheen: 0.45, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xffd9cc),
    clearcoat: 0.1, clearcoatRoughness: 0.45, specularIntensity: 0.55,
  });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, shared);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aThick; attribute float aDirt; attribute float aWarm; attribute float aFree; attribute float aOil;
        varying float vThick; varying float vDirt; varying float vWarm; varying float vOil; varying vec2 vSkinUv;
        uniform vec4 uPress[3]; uniform float uTwitch; uniform float uTime; uniform float uFlip;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vThick = aThick; vDirt = aDirt; vWarm = aWarm; vOil = aOil;
        vSkinUv = vec2(position.x * uFlip, position.y) * 0.11 + vec2(position.z * 0.05, 0.0);
        for (int i = 0; i < 3; i++) {
          vec3 dd = position - uPress[i].xyz;
          float w = uPress[i].w * exp(-dot(dd, dd) / 0.6);
          transformed -= objectNormal * w * 0.3;
        }
        transformed += objectNormal * aFree * uTwitch * sin(uTime * 46.0) * 0.035;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vThick; varying float vDirt; varying float vWarm; varying float vOil; varying vec2 vSkinUv;
        uniform vec3 uBackDir; uniform float uSSS;`)
      .replace('#include <map_fragment>', `
        vec4 texelColor = texture2D(map, vSkinUv);
        diffuseColor *= texelColor;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.8, 0.64, 0.38), clamp(vDirt, 0.0, 1.0) * 0.8);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.12, 0.68, 0.64), clamp(vWarm, 0.0, 1.0) * 0.7);
        diffuseColor.rgb *= mix(1.0, 0.9, clamp(vOil, 0.0, 1.0));`)
      .replace('#include <bumpmap_pars_fragment>', THREE.ShaderChunk.bumpmap_pars_fragment.replace(/vBumpMapUv/g, 'vSkinUv'))
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.26, clamp(vDirt, 0.0, 1.0) * 0.75);
        roughnessFactor = mix(roughnessFactor, 0.09, clamp(vOil, 0.0, 1.0) * 0.9);`)
      .replace('#include <opaque_fragment>', `
        float thin = exp(-vThick * 2.4);
        float back = clamp(dot(-normal, normalize(uBackDir)) * 0.5 + 0.5, 0.0, 1.0);
        vec3 sss = vec3(1.0, 0.32, 0.2) * thin * (0.18 + 0.82 * back * back) * uSSS;
        outgoingLight += sss * diffuseColor.rgb;
        outgoingLight += diffuseColor.rgb * vec3(0.06, 0.012, 0.008);
        #include <opaque_fragment>`);
    mat.userData.shader = sh;
  };
  mat.customProgramCacheKey = () => 'skin-v1';
  return mat;
}

export function makeTowel(scene) {
  // 包头的白毛巾：沿耳朵上后方一圈的粗管子，毛圈纹理
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 1.2 + Math.random() * 2.2;
    const v = 120 + Math.random() * 135;
    g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const bump = new THREE.CanvasTexture(c); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(30, 5);
  const pts = [[-9, 5.6], [-4, 5.9], [0, 5.8], [3.3, 5.1], [5.2, 3.5], [6.2, 1.0], [6.5, -2.2], [6.4, -6]].map(([x, y]) => new THREE.Vector3(x, y, headZ(x, y) + 0.5));
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 160, 1.25, 32, false);
  // 压扁成带子 + 毛巾褶皱
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const hz = headZ(x, y) + 0.5;
    const nz = hz + (z - hz) * 0.55 + Math.sin(x * 2.1 + y * 2.9) * 0.1 + Math.sin(x * 5.3 - y * 4.1) * 0.03;
    p.setZ(i, Math.max(nz, headZ(x, y) - 0.2));
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xfbf5ec, roughness: 0.97, sheen: 1, sheenRoughness: 0.85, sheenColor: new THREE.Color(0xfff6ea), bumpMap: bump, bumpScale: 4 });
  const towel = new THREE.Mesh(geo, mat);
  towel.castShadow = true; towel.receiveShadow = true;
  scene.add(towel);
  return towel;
}

export function makeTissue(scene) {
  // 放耳屑的小纸巾（浮在脸颊旁，像师傅另一只手托着）
  const geo = new THREE.PlaneGeometry(2.0, 1.9, 24, 24);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, Math.sin(x * 2.6) * 0.06 + Math.cos(y * 3.4 + x) * 0.05 + (x * x + y * y) * 0.05 + Math.max(0, Math.abs(x + y * 0.3) - 0.02) * 0.0 + (Math.abs(x) < 0.05 ? -0.03 : 0));
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xfbf8f3, roughness: 0.92, sheen: 0.6, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide });
  const tissue = new THREE.Mesh(geo, mat);
  tissue.receiveShadow = true; tissue.castShadow = true;
  scene.add(tissue);
  return tissue;
}
