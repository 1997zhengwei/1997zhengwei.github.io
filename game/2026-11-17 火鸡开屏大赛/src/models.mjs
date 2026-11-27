// 3D 模型汇总：火鸡 / 场景 / 道具 / 环境反射
import * as THREE from '../vendor/three.module.js';
export { buildTurkey, layoutFan, buildFeather, featherMat, FEATHER_STYLE } from './turkey.mjs';
import { buildWorld as buildFarm, setTerrain } from './scenery.mjs';
import { buildThemeWorld } from './worlds.mjs';
import { buildCh2World } from './worlds2.mjs';
export { buildRamp, buildMash, buildFork, buildZone, buildCage, buildFriend, buildCorn, plankGeo, plankMat } from './props2.mjs';
export { buildStage, buildSky, buildHills } from './scenery.mjs';
export { buildPumpkinRoller, buildPie, buildHorn } from './props.mjs';
// 按主题搭建赛道两侧场景；返回的 group.userData.ticks 是每帧动画回调
export function buildWorld(scene, length, theme = 'farm') {
  setTerrain(theme);
  if (theme === 'farm') { const g = buildFarm(scene, length); g.userData.ticks = g.userData.ticks || []; return g; }
  const g = ['float', 'table', 'rescue', 'escape'].includes(theme) ? buildCh2World(theme, length) : buildThemeWorld(theme, length);
  scene.add(g);
  return g;
}
export { buildPickup, buildGate, layoutGate, buildScissors, buildChef, softTex } from './props.mjs';

// 简易环境反射：暖色天空 + 白色顶光 + 草地反光，让金属/虹彩材质有光泽
export function makeEnv(renderer) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: 0x9fc8e8, side: THREE.BackSide })));
  const panel = (w, h, color, k, x, y, z, rx = 0, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m); };
  panel(14, 14, 0xfff4e0, 5, 0, 12, 0, Math.PI / 2);
  panel(10, 6, 0xffc890, 3, 12, 4, -6, 0, -Math.PI / 2.5);
  panel(10, 6, 0xbfe0ff, 2, -12, 4, 6, 0, Math.PI / 2.5);
  panel(30, 30, 0x6a9a3a, 0.8, 0, -8, 0, -Math.PI / 2);
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(env, 0.03).texture;
  pm.dispose();
  return t;
}
