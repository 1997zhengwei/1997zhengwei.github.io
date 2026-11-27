// 轻量后期：MSAA 场景 → 亮部提取 → 三级模糊辉光 → ACES 色调映射 + 暖色调 + 暗角 → sRGB
import * as THREE from '../vendor/three.module.js';

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const BRIGHT = `uniform sampler2D tDiffuse; uniform float threshold; varying vec2 vUv;
void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = max(max(c.r, c.g), c.b); float k = smoothstep(threshold, threshold + 0.6, l); gl_FragColor = vec4(c * k, 1.0); }`;
const BLUR = `uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;
void main(){ vec3 s = texture2D(tDiffuse, vUv).rgb * 0.2270270;
  s += texture2D(tDiffuse, vUv + dir * 1.3846153).rgb * 0.3162162; s += texture2D(tDiffuse, vUv - dir * 1.3846153).rgb * 0.3162162;
  s += texture2D(tDiffuse, vUv + dir * 3.2307692).rgb * 0.0702703; s += texture2D(tDiffuse, vUv - dir * 3.2307692).rgb * 0.0702703;
  gl_FragColor = vec4(s, 1.0); }`;
const COMPOSITE = `uniform sampler2D tScene; uniform sampler2D tB1; uniform sampler2D tB2; uniform sampler2D tB3;
uniform float exposure; uniform float bloom; uniform float vignette; uniform vec3 tint; varying vec2 vUv;
vec3 RRTAndODTFit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 color){
  const mat3 ACESInputMat = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 ACESOutputMat = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color *= exposure / 0.6; color = ACESInputMat * color; color = RRTAndODTFit(color); color = ACESOutputMat * color; return clamp(color, 0.0, 1.0); }
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
void main(){
  vec3 c = texture2D(tScene, vUv).rgb;
  vec3 b = texture2D(tB1, vUv).rgb * 0.55 + texture2D(tB2, vUv).rgb * 0.35 + texture2D(tB3, vUv).rgb * 0.3;
  c += b * bloom;
  c *= tint;
  c = aces(c);
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);
  // 轻微提饱和
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = mix(vec3(l), c, 1.08);
  vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * vignette;
  gl_FragColor = vec4(toSRGB(clamp(c, 0.0, 1.0)), 1.0);
}`;

export function createPost(renderer) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const quad = new THREE.Mesh(geo);
  quad.frustumCulled = false;
  const fsScene = new THREE.Scene(); fsScene.add(quad);
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mk = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
  const bright = mk(BRIGHT, { tDiffuse: { value: null }, threshold: { value: 1.15 } });
  const blur = mk(BLUR, { tDiffuse: { value: null }, dir: { value: new THREE.Vector2() } });
  const comp = mk(COMPOSITE, { tScene: { value: null }, tB1: { value: null }, tB2: { value: null }, tB3: { value: null }, exposure: { value: 1.0 }, bloom: { value: 0.55 }, vignette: { value: 0.9 }, tint: { value: new THREE.Vector3(1.03, 1.0, 0.95) } });
  const opts = { type: THREE.HalfFloatType, depthBuffer: false };
  let main, b = [];
  function size(w, h) {
    main?.dispose(); b.forEach((x) => { x.a.dispose(); x.b.dispose(); });
    main = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
    b = [2, 4, 8].map((d) => ({ a: new THREE.WebGLRenderTarget(Math.max(1, w / d | 0), Math.max(1, h / d | 0), opts), b: new THREE.WebGLRenderTarget(Math.max(1, w / d | 0), Math.max(1, h / d | 0), opts) }));
  }
  function pass(mat, target) { quad.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); }
  function render(scene, camera) {
    renderer.setRenderTarget(main);
    renderer.render(scene, camera);
    // 亮部 → 逐级缩小模糊
    bright.uniforms.tDiffuse.value = main.texture; pass(bright, b[0].a);
    for (let i = 0; i < 3; i++) {
      const L = b[i];
      if (i > 0) { blur.uniforms.tDiffuse.value = b[i - 1].a.texture; blur.uniforms.dir.value.set(0, 0); pass(blur, L.a); }
      for (let k = 0; k < 2; k++) {
        blur.uniforms.tDiffuse.value = L.a.texture; blur.uniforms.dir.value.set(1 / L.a.width, 0); pass(blur, L.b);
        blur.uniforms.tDiffuse.value = L.b.texture; blur.uniforms.dir.value.set(0, 1 / L.a.height); pass(blur, L.a);
      }
    }
    comp.uniforms.tScene.value = main.texture;
    comp.uniforms.tB1.value = b[0].a.texture; comp.uniforms.tB2.value = b[1].a.texture; comp.uniforms.tB3.value = b[2].a.texture;
    pass(comp, null);
  }
  return { size, render, comp, bright };
}
