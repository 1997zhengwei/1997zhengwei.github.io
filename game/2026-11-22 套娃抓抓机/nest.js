// 套娃抓抓机: every machine hides one glowing nesting capsule in its pile. Pull it out and the
// capsule flies at the camera, splits open, and the camera dives into the smaller machine inside.
import { THREE, Parts, toon, INK } from './kit3d.js';
import { THEMES } from './themes.js';
import { makeMusic } from './music.js';

const $ = id => document.getElementById(id);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const cache = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
const remember = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// ---------------------------------------------------------------- renderer
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const revealScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, .1, 300);
const sky = new THREE.HemisphereLight('#ffffff', '#c7b6d6', 1.9);
scene.add(sky); revealScene.add(sky.clone());
const sun = new THREE.DirectionalLight('#fff2da', 2.2); sun.position.set(-6, 22, 14); scene.add(sun); revealScene.add(sun.clone());
const cam = { az: 0, goal: null, el: .62, elGoal: null, r: 29, zoom: 1, target: new THREE.Vector3(0, 2.4, .6), view: 0, spin: 0 };
const VIEWS = [0, -Math.PI / 2, Math.PI, Math.PI / 2];
function placeCamera() {
  const c = Math.cos(cam.el);
  const r = cam.r * cam.zoom;
  camera.position.set(cam.target.x + Math.sin(cam.az) * c * r, cam.target.y + Math.sin(cam.el) * r, cam.target.z + Math.cos(cam.az) * c * r);
  camera.lookAt(cam.target);
}
function resize() {
  const r = canvas.getBoundingClientRect(); if (!r.width) return;
  renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height;
  camera.fov = camera.aspect < .75 ? 50 : 38; cam.r = camera.aspect < .75 ? 30 : 27; camera.updateProjectionMatrix();
}

// ---------------------------------------------------------------- audio
const audio = (() => {
  let ac = null, on = cache('msh-sound', true), motor = null, music = null, activated=false;
  const sync = () => { $('sound').textContent = on ? '♪' : '×'; $('sound').setAttribute('aria-pressed',String(on)); };
  sync(); $('sound').onclick = () => { on = !on; remember('msh-sound', on); sync(); if (on) ready(); else if (motor) motor.g.gain.value = 0; music?.tick(on && !document.hidden); };
  const ready = () => { if (!activated || !on || !window.AudioContext) return false; ac ??= new AudioContext(); if (ac.state === 'suspended') ac.resume().catch(() => {}); return true; };
  function activate() { activated=true; ready(); }
  addEventListener('pointerdown',activate,{once:true,capture:true});
  addEventListener('keydown',activate,{once:true,capture:true});
  function musicTick() {
    if (!ac) return;
    music ??= makeMusic(ac);
    music.tick(on && !document.hidden);
  }
  document.addEventListener('visibilitychange',musicTick);
  function tone(notes, dur = .12, vol = .08, type = 'triangle', gap = .62) {
    if (!ready()) return;
    notes.forEach((hz, i) => { const t = ac.currentTime + i * dur * gap, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = hz; g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .02); });
  }
  function slide(from, to, dur = .5, vol = .07, type = 'sine') {
    if (!ready()) return;
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.type = type; o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur = .2, freq = 900, vol = .06) {
    if (!ready()) return;
    const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f).connect(g).connect(ac.destination); s.start();
  }
  function hum(level) {
    if (!on || ac?.state!=='running') return;
    if (!motor) { const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = 70; f.type = 'lowpass'; f.frequency.value = 300; g.gain.value = 0; o.connect(f).connect(g).connect(ac.destination); o.start(); motor = { o, g }; }
    motor.g.gain.setTargetAtTime(level * .035, ac.currentTime, .05); motor.o.frequency.setTargetAtTime(60 + level * 40, ac.currentTime, .1);
  }
  return { tone, slide, noise, hum, ready, musicTick };
})();

// ---------------------------------------------------------------- themes and models
const PRIZE_NAMES = { teddy: '小熊', block: '积木', duck: '小黄鸭', car: '玩具车', donut: '甜甜圈', macaron: '马卡龙', cupcake: '纸杯蛋糕', candy: '糖果', starfish: '海星', pearl: '珍珠', fish: '小丑鱼', shell: '海螺', planet: '小行星', rocket: '小火箭', alien: '外星人', star: '星星', coin: '金币' };
const C = (hex, k) => new THREE.Color(hex).offsetHSL(0, 0, k).getStyle();
function prizeParts(id) {
  const p = new Parts();
  switch (id) {
    case 'teddy': p.ball(.42, '#c98d55', 0, .42, 0).ball(.3, '#c98d55', 0, .95, 0).ball(.11, '#c98d55', -.22, 1.18, 0).ball(.11, '#c98d55', .22, 1.18, 0).ball(.12, '#f3d2a8', 0, .9, .25).ball(.04, INK, -.1, 1, .26).ball(.04, INK, .1, 1, .26).ball(.13, '#c98d55', -.38, .5, .15).ball(.13, '#c98d55', .38, .5, .15).box(.3, .08, .06, '#ef5a4a', 0, .7, .3); break;
    case 'block': p.box(.6, .6, .6, '#4d8fe0', 0, 0, 0).box(.62, .3, .62, '#ffd23f', 0, .15, 0).cyl(.12, .12, .12, '#4d8fe0', -.15, .6, -.15, 10).cyl(.12, .12, .12, '#4d8fe0', .15, .6, .15, 10); break;
    case 'duck': p.ball(.34, '#ffd23f', 0, .3, 0, 1.2, .85, 1).ball(.22, '#ffd23f', .2, .66, 0).cone(.09, .18, '#ff9d3c', .4, .56, 0).ball(.04, INK, .32, .72, .1).ball(.04, INK, .32, .72, -.1); break;
    case 'car': p.box(.9, .3, .5, '#ef6b6b', 0, .14, 0).box(.5, .25, .44, '#ffb3b3', -.05, .44, 0); for (const [x, z] of [[-.3, -.26], [.3, -.26], [-.3, .26], [.3, .26]]) p.cyl(.13, .13, .1, '#3a3442', x, .1, z, 10, Math.PI / 2); break;
    case 'donut': for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; p.ball(.2, '#e8a04c', Math.cos(a) * .32, .2, Math.sin(a) * .32); p.ball(.15, k % 3 ? '#ff8fb0' : '#ffffff', Math.cos(a) * .32, .34, Math.sin(a) * .32); } break;
    case 'macaron': p.cyl(.36, .36, .18, '#9ee6c9', 0, 0, 0, 16).cyl(.33, .33, .1, '#fff6e8', 0, .18, 0, 16).cyl(.36, .36, .18, '#9ee6c9', 0, .28, 0, 16); break;
    case 'cupcake': p.cyl(.32, .24, .42, '#ff8fb0', 0, 0, 0, 12).ball(.36, '#fff6e8', 0, .55, 0, 1, .7, 1).cone(.22, .3, '#fff6e8', 0, .7, 0).ball(.08, '#ef3b5a', 0, 1.02, 0); break;
    case 'candy': p.ball(.28, '#9d7cf0', 0, .32, 0, 1.2, 1, 1).cone(.16, .26, '#ffd23f', -.48, .2, 0).cone(.16, .26, '#ffd23f', .48, .2, 0); break;
    case 'starfish': for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; p.box(.22, .14, .55, '#ff8a5c', Math.cos(a) * .25, 0, Math.sin(a) * .25, -a + Math.PI / 2); } p.ball(.18, '#ff8a5c', 0, .1, 0); break;
    case 'pearl': p.ball(.36, '#fffaf0', 0, .36, 0).ball(.1, '#ffffff', -.12, .5, .22); break;
    case 'fish': p.ball(.34, '#ff9d3c', 0, .34, 0, 1.3, 1, .8).box(.1, .5, .6, '#ffffff', 0, .1, 0).cone(.2, .3, '#ff9d3c', -.5, .2, 0).ball(.05, INK, .3, .44, .18); break;
    case 'shell': p.cone(.34, .8, '#f6c3d0', 0, 0, 0, 10).cone(.2, .5, '#ffe3ec', 0, .5, 0, 10); break;
    case 'planet': p.ball(.36, '#7cd36a', 0, .4, 0).cyl(.62, .62, .04, '#ffd23f', 0, .4, 0, 24).ball(.1, '#5bb45d', .15, .6, .2); break;
    case 'rocket': p.cyl(.2, .2, .7, '#ffffff', 0, .1, 0, 12).cone(.2, .35, '#ef5a4a', 0, .8, 0, 12).box(.1, .3, .4, '#ef5a4a', .16, .1, 0).box(.1, .3, .4, '#ef5a4a', -.16, .1, 0).ball(.08, '#6fc3ff', 0, .5, .19); break;
    case 'alien': p.ball(.32, '#7cd36a', 0, .4, 0).ball(.1, '#ffffff', -.12, .5, .25).ball(.1, '#ffffff', .12, .5, .25).ball(.05, INK, -.12, .5, .33).ball(.05, INK, .12, .5, .33).cyl(.03, .03, .25, '#7cd36a', -.1, .65, 0, 6).cyl(.03, .03, .25, '#7cd36a', .1, .65, 0, 6).ball(.06, '#ffd23f', -.1, .92, 0).ball(.06, '#ffd23f', .1, .92, 0); break;
    case 'star': for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + Math.PI / 2; p.cone(.16, .42, '#ffd23f', Math.cos(a) * .22, .2 + Math.sin(a) * .22, 0); } p.ball(.2, '#ffd23f', 0, .25, 0); break;
    case 'coin': for (let k = 0; k < 3; k++) p.cyl(.3, .3, .08, k % 2 ? '#ffd23f' : '#ffc12e', 0, k * .09, 0, 16); break;
  }
  return p;
}
const octahedron = new THREE.OctahedronGeometry(.58);
function coverParts(theme, seed) {
  const kind = theme.cover;
  const p = new Parts(), R = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  if (kind === 'ball') p.ball(.46, pick(['#ff6f91', '#ffd23f', '#6fc3ff', '#7cd36a', '#9d7cf0', '#ff9d3c']), 0, .46, 0);
  else if (kind === 'jelly') { const c = pick(['#ff8fb0', '#9ee6c9', '#ffe27a', '#c9a7ff', '#ffb36b']); p.box(.9, .75, .9, c, 0, 0, 0).box(.7, .08, .7, C(c, .12), 0, .75, 0); }
  else if (kind === 'rock') { const c = pick(['#f6b3c8', '#9ee6c9', '#ffe27a', '#a8d8ff', '#c9a7ff', '#ffc09a']); p.ball(.55, c, 0, .4, 0, 1, .7, .9).ball(.3, C(c, .08), .25, .6, .1); if (R() < .4) p.cyl(.05, .05, .9, '#3f9a6a', -.3, .3, .2, 6, .3, .2); }
  else if (kind === 'moon') { const c = pick(['#b9a7ff', '#8fa2ff', '#d0b7ff', '#7fd1c4', '#ff9fc8']); p.ball(.55, c, 0, .42, 0, 1, .75, 1).ball(.14, C(c, -.1), .2, .78, .2, 1, .4, 1).ball(.1, C(c, -.1), -.25, .74, -.1, 1, .4, 1); }
  else {
    const c = [theme.cab, theme.trim, C(theme.cab,.12), C(theme.floor,.06)][Math.floor(R()*4)];
    const light = C(c,.15), shade = C(c,-.14);
    switch (kind) {
      case 'cap': p.cyl(.14,.19,.42,'#f5dba4',0,0,0).ball(.46,c,0,.49,0,1,.64,1).ball(.07,'#fff3c4',.2,.69,.1); break;
      case 'ice': case 'gem': p.push(octahedron,c,0,.43,0,0,.48,0,1,.95,1).box(.11,.25,.11,light,-.16,.43,.22); break;
      case 'bun': p.ball(.49,c,0,.33,0,1,.71,1).ball(.38,light,.03,.51,.01,1,.65,1).ball(.08,shade,.08,.75,0); break;
      case 'brick': p.box(.94,.42,.58,c,0,.08,0).box(.48,.23,.52,light,.05,.5,0).ball(.13,shade,-.29,.13,.25).ball(.13,shade,.29,.13,.25); break;
      case 'honey': p.cyl(.48,.43,.55,c,0,0,0,6).cyl(.29,.33,.10,shade,0,.53,0,6).ball(.12,light,.08,.65,0); break;
      case 'petal': p.ball(.29,light,0,.35,0); for(let i=0;i<5;i++){const a=i*6.283/5; p.ball(.23,c,.27*Math.sin(a),.31,.27*Math.cos(a),1,1.22,1);} break;
      case 'pyramid': p.cone(.62,.78,c,0,0,0,4).box(.62,.09,.62,light,0,.02,0); break;
      case 'pixel': p.box(.78,.68,.78,c,0,0,0).box(.5,.13,.48,light,.09,.60,.08).box(.16,.31,.1,shade,-.30,.08,.38); break;
      case 'cloud': for(const [x,y,z] of [[-.23,.28,0],[0,.48,0],[.24,.31,.05],[0,.28,.23]])p.ball(.28,c,x,y,z,1,1,.9); break;
      case 'fossil': case 'ore': case 'ember': p.push(octahedron,c,0,.42,0,0,1.5,0,1.22,.81,1).push(octahedron,light,.22,.50,.09,0,0,0,.47,.65,.44).box(.32,.13,.1,shade,-.12,.40,.3); break;
      case 'disc': p.cyl(.46,.46,.32,c,0,0,0,20).cyl(.41,.43,.06,shade,0,.32,0,24).cyl(.16,.16,.05,light,0,.38,0,16); break;
      case 'ticket': p.cyl(.47,.45,.10,light,0,0,0,15).cyl(.31,.33,.49,c,0,.1,0,13).cyl(.34,.34,.10,shade,0,.13,0,13); break;
      case 'book': p.box(.8,.55,.7,'#faedc9',0,.06,0).box(.87,.08,.78,c,0,.62,0).box(.11,.6,.76,c,-.39,.06,0).box(.18,.02,.44,light,.04,.7,.06); break;
    }
  }
  return p;
}
const lowerShell = new THREE.SphereGeometry(.65, 26, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
const upperShell = new THREE.SphereGeometry(.65, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2);
const shellBand = new THREE.TorusGeometry(.642, .055, 8, 32);
function capsuleModel() {
  const egg = new THREE.Group();
  const base = new Parts().push(lowerShell, '#ffe5a4', 0, .67, 0);
  base.cyl(.632, .632, .044, '#ffc242', 0, .626, 0, 26);
  base.push(shellBand, '#eb9258', 0, .678, 0, Math.PI / 2);
  egg.add(base.model(.026));
  const lid = new THREE.Group();
  lid.position.y = .687;
  const crown = new Parts().push(upperShell, '#ffce43', 0, 0, 0, 0, 0, 0, 1, 1.23, 1);
  crown.cyl(.626, .626, .034, '#ffefa6', 0, -.016, 0, 26);
  crown.ball(.18, '#ff856e', 0, .25, .601, 1, 1, .27);
  crown.ball(.102, '#fff9d5', 0, .255, .65, 1, 1, .18);
  crown.ball(.092, '#fff4b8', -.24, .56, .38, .74, 1, .42);
  lid.add(crown.model(.026)); egg.add(lid);
  egg.userData.lid = lid;
  return egg;
}

// ---------------------------------------------------------------- claw rig (shared by all machines)
const SIZE = 8, CHUTE = new THREE.Vector3(6.2, 0, 6.2), TOP = 10.2, TIP = .95;
const claw = { x: 0, z: -1, tx: 0, tz: -1, y: TOP, open: 1, state: 'idle', held: [], t: 0, wob: 0 };
const rig = new THREE.Group(); scene.add(rig);
const carriage = new THREE.Group(); rig.add(carriage);
{ const p = new Parts(); p.box(.4, .3, 16, '#c9ccd8', 0, 11, 0); carriage.add(p.model(.04)); }
const trolley = new THREE.Group(); rig.add(trolley);
{ const p = new Parts(); p.box(1, .5, 1, '#ff6f91', 0, 10.6, 0).box(.6, .2, .6, '#ffd23f', 0, 10.45, 0); trolley.add(p.model(.04)); }
const cable = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1, 6), new THREE.MeshBasicMaterial({ color: '#4a4152' })); cable.raycast = () => {}; rig.add(cable);
const head = new THREE.Group(); rig.add(head);
{ const p = new Parts(); p.cyl(.38, .42, .45, '#c9ccd8', 0, -.2, 0, 16).ball(.24, '#ff6f91', 0, .3, 0).cyl(.2, .2, .12, '#9aa3b5', 0, -.3, 0, 12); head.add(p.model(.04)); }
const prongs = [];
for (let k = 0; k < 3; k++) {
  const around = new THREE.Group(); around.rotation.y = k * Math.PI * 2 / 3; head.add(around);
  const hinge = new THREE.Group(); hinge.position.set(.3, -.25, 0); around.add(hinge);
  const p = new Parts(); p.box(.12, .55, .12, '#c9ccd8', .1, -.5, 0, 0, 0, -.35).box(.12, .45, .12, '#c9ccd8', .14, -.9, 0, 0, 0, .35).box(.22, .1, .14, '#9aa3b5', 0, -.98, 0);
  hinge.add(p.model(.035)); prongs.push(hinge);
}
const aimRim = new THREE.Mesh(new THREE.RingGeometry(.57, .95, 40),
  new THREE.MeshBasicMaterial({ color: '#443046', transparent: true, opacity: .8, depthWrite: false, side: THREE.DoubleSide }));
aimRim.rotation.x = -Math.PI / 2; aimRim.renderOrder = 4; rig.add(aimRim);
const aim = new THREE.Mesh(new THREE.RingGeometry(.63, .88, 40), new THREE.MeshBasicMaterial({ color: '#ff6f91', transparent: true, opacity: .85, depthWrite: false }));
aim.rotation.x = -Math.PI / 2; aim.raycast = () => {}; aim.renderOrder = 5; rig.add(aim);
const laser = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1, 6), new THREE.MeshBasicMaterial({ color: '#ff6f91', transparent: true, opacity: .45, depthWrite: false })); laser.raycast = () => {}; rig.add(laser);

// ---------------------------------------------------------------- one machine
let M = null;          // current machine { group, objects, solids, theme, depth }
let depth = 1, tries = 0, over = false, diving = null, roundId = 0;
const totalLevels = THEMES.length;
const title = '套娃探索宗师';
const checkpointKey = 'msh-claw-20-cleared';
let cleared = clamp(Math.trunc(Number(cache(checkpointKey,0)) || 0),0,totalLevels);
let replay = false;
let finale = false;
const best = () => Math.min(totalLevels,cache('msh-nest-best',0));
let bestAtStart = best();
function saveBest() {
  if (depth > best()) remember('msh-nest-best', depth);
}
// Retain the existing points balance. Each machine attempt allows one exchange.
const META = cache('msh-nest-meta', {points:0});
const saveMeta = () => remember('msh-nest-meta', META);
const extraCost = 25;
let runPoints=0, extraBought=false;
function gain(n, at) { if (!n) return; runPoints += n; META.points += n; saveMeta(); if (at) popText('+' + n, '#ffe58a'); }
const glowTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,240,150,1)'); g.addColorStop(.4, 'rgba(255,220,90,.55)'); g.addColorStop(1, 'rgba(255,220,90,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();

const zigzag = [[-2.8,0],[.45,2.4],[3.7,.65]];
const boardLimit = 3.65;
const notchRadius = .75;
const barClearance = .83;
const coolingRadius = .94;
const coldTime = 5.5;
function pathDistance(x,z,[a,b],[c,d]) {
  const dx=c-a,dz=d-b;
  const k=clamp(((x-a)*dx+(z-b)*dz)/(dx*dx+dz*dz),0,1);
  return Math.hypot(x-a-dx*k,z-b-dz*k);
}
function buildMachine(level) {
  const theme = THEMES[level - 1], rule = theme.rule;
  const group = new THREE.Group();
  const objects = [], solids = [];
  // cabinet
  const p = new Parts();
  p.box(19, 3.4, 19, theme.cab, 0, -3.6, 0);
  for (let i = 0; i < 2; i++) p.box(19.06, .32, 19.06, i ? '#ffffff' : theme.trim, 0, -3.1 + i * .9, 0);
  p.box(18.4, .2, 18.4, theme.trim, 0, -.35, 0);
  for (const [x, z] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) p.cyl(.35, .35, 12.4, theme.trim, x, -.3, z, 12).ball(.5, theme.cab, x, 12.3, z);
  p.box(18.4, .35, .35, theme.cab, 0, 11.6, -9); for (const x of [-9, 9]) p.box(.35, .35, 18.4, theme.cab, x, 11.6, 0);
  p.box(17, .25, .3, '#9aa3b5', 0, 11.2, -7.9);
  p.box(2.6, .06, 2.6, '#2b2431', CHUTE.x, .02, CHUTE.z);
  for (let k = 0; k < 6; k++) { const c = k % 2 ? '#2b2431' : '#ffd23f'; p.box(.46, .5, .2, c, CHUTE.x - 1.15 + k * .46, 0, CHUTE.z - 1.4); p.box(.2, .5, .46, c, CHUTE.x - 1.4, 0, CHUTE.z - 1.15 + k * .46); }
  p.box(2.4, 1.4, .1, '#ffd23f', CHUTE.x, -1.6, SIZE + 1.55).box(1.6, .7, .06, '#2b2431', CHUTE.x, -1.35, SIZE + 1.6);
  for (const side of [-1, 1]) {
    p.box(5.2, .15, .6, theme.trim, side * 5.5, 8.2, -8.76);
    p.box(4.7, .10, .34, '#fff4d2', side * 5.5, 8.36, -8.75);
    for (let j = 0; j < 5; j++) {
      p.ball(.15, j % 2 ? '#fff2b1' : theme.cab, side * 5.5 - 1.7 + j * .85, 8.51, -8.54);
    }
  }
  if (level > 1) {
    const emblem = coverParts(theme, level * 31).model(.035);
    emblem.scale.setScalar(3.25);
    emblem.position.set(0, 6.4, -8.24);
    group.add(emblem);
  }
  const cab = p.model(); group.add(cab);
  const fl = new Parts(); fl.box(16, .1, 16, theme.floor, 0, -.1, 0);
  if (theme.key === 'sea') for (let k = 0; k < 9; k++) fl.cyl(.08, .08, rand(1.5, 3.2), '#3f9a6a', rand(-7.4, 7.4), 0, -7.6 + (k % 2) * .3, 6);
  if (theme.key === 'space') for (let k = 0; k < 14; k++) fl.ball(.08, '#ffffff', rand(-7.5, 7.5), rand(2, 9), -8.6);
  const floor = fl.model(); group.add(floor); floor.traverse(o => { if (o.isMesh && o.material === toon) { o.userData.obj = { kind: 'floor' }; solids.push(o); } });
  const glass = new THREE.MeshBasicMaterial({ color: theme.key === 'sea' ? '#7fd3f5' : '#d8f3ff', transparent: true, opacity: theme.key === 'sea' ? .16 : .07, depthWrite: false, side: THREE.DoubleSide });
  for (const [x, z, ry] of [[0, -9, 0], [0, 9, 0], [-9, 0, Math.PI / 2], [9, 0, Math.PI / 2]]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), glass); g.position.set(x, 5.9, z); g.rotation.y = ry; g.raycast = () => {}; group.add(g); }
  const glint = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .3, depthWrite: false });
  for (const [x, w] of [[-6, .5], [-5, .2], [4, .35]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, 9), glint); s.position.set(x, 6, 9.02); s.rotation.z = .5; s.raycast = () => {}; group.add(s); }

  // pile: a grid of cover pieces in two layers, with prizes, coins and the capsule tucked in
  const step = theme.cover === 'ball' ? .95 : 1.05, cells = [];
  for (let x = -7.2; x <= 7.2; x += step) for (let z = -7.2; z <= 7.2; z += step) if (!(x > 4.4 && z > 4.4)) cells.push([x + rand(-.12, .12), z + rand(-.12, .12)]);
  const starter = level === 1;
  const center = starter ? [-2.45,-.55] : rule.at.map(coord=>coord+rand(-.45,.45));
  const [cx,cz] = center;
  const route = rule.zigzag ? zigzag.map(([x,z])=>[cx+x,cz+z]) : [];
  const tileSpots = rule.cool ? [[2.55,2.35]] : [];
  const bonusSpots = rule.twin ? [[3.55,1.85]] : [];
  const touchesPath = (x,z,margin) => {
    const dist = Math.hypot(x-cx,z-cz);
    if (route.length) return route.some((point,index)=>pathDistance(x,z,point,route[(index+1)%route.length])<margin);
    if (rule.orbit) return Math.abs(Math.hypot(x-cx,(z-cz)/(rule.oval||1))-rule.orbit)<margin/(rule.oval||1);
    if (rule.shuttle) return Math.abs(x-cx)<rule.shuttle+margin && Math.abs(z-cz)<margin;
    return dist<margin;
  };
  const pads = [[-4.85,3.35],[4.82,1.55],[-5.65,-3.7],[4.65,-4.8],[1.1,4.9]]
    .filter(([x,z]) => !touchesPath(x,z,2.35)).slice(0,rule.keys||0);
  const reserved = (x,z) => (rule.seesaw && Math.abs(x-cx)<4.72 && Math.abs(z-cz)<1.58) || (rule.shell && Math.abs(x)<5.35 && Math.abs(z+1.25)<1.85) || [...pads,...tileSpots,...bonusSpots].some(([px,pz])=>Math.hypot(x-px,z-pz)<1.38) ||
    touchesPath(x,z,starter ? .78 : rule.lids ? 1.68 : 1.24);
  const openCells = cells.filter(([x,z]) => !reserved(x,z));
  const shuffled = [...openCells];
  for (let i = shuffled.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const level2 = starter ? .52 : Math.min(.47, .15 + level * .013);
  const prizeCells = shuffled.slice(0, 9);
  function add(kind, id, parts, x, y, z, r) {
    const m = kind==='cover' ? parts.clone() : parts.model(.035); m.position.set(x, y, z); m.rotation.y = rand(0, Math.PI * 2); group.add(m);
    const o = { kind, id, obj: m, r, state: 'rest', v: 0 };
    m.traverse(n => { if (n.isMesh && n.material === toon) { n.userData.obj = o; solids.push(n); } });
    objects.push(o); return o;
  }
  const coverH = theme.cover === 'ball' ? .92 : theme.cover === 'jelly' ? .83 : .78;
  const coverCache = new Map();
  function filler(index) {
    const style = index % 10;
    if (!coverCache.has(style)) coverCache.set(style, coverParts(theme, (style+1)*791).model(.04));
    return coverCache.get(style);
  }
  for (const [i, cell] of openCells.entries()) {
    const [x, z] = cell;
    const prizeIndex = prizeCells.indexOf(cell);
    if (prizeIndex >= 0) {
      const id = prizeIndex < 2 ? 'coin' : pick(theme.prizes);
      add(id === 'coin' ? 'coin' : 'prize', id, prizeParts(id), x, 0, z, .55);
    } else add('cover', theme.cover, filler(i), x, 0, z, .5);
    if (Math.random() < level2 && !touchesPath(x,z,1.68) && !(x > 3.6 && z > 3.6)) {
      add('cover', theme.cover, filler(i+3), x+rand(-.13,.13), coverH, z+rand(-.13,.13), .5);
    }
  }

  const pedestal = new Parts();
  if (rule.orbit) {
    if (rule.oval) {
      const disc = new THREE.CylinderGeometry(rule.orbit+1,rule.orbit+1.08,.12,40);
      pedestal.push(disc,'#62536a',0,.02,0,0,0,0,1,1,rule.oval+.18); disc.dispose();
    } else pedestal.cyl(rule.orbit+1,rule.orbit+1.08,.12,'#62536a',0,-.04,0,40);
    pedestal.push(new THREE.TorusGeometry(rule.orbit,.09,8,56),theme.trim,0,.11,0,Math.PI/2,0,0,1,rule.oval||1,1);
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6;
      pedestal.ball(.105,i%3===0?'#fff7de':theme.cab,rule.orbit*Math.cos(angle),.23,rule.orbit*Math.sin(angle)*(rule.oval||1));
    }
  } else if (route.length) {
    for (const [i,[x,z]] of zigzag.entries()) {
      const [nx,nz]=zigzag[(i+1)%zigzag.length];
      pedestal.cyl(1.01,1.13,.12,theme.trim,x,.02,z,14);
      pedestal.box(.37,.10,Math.hypot(nx-x,nz-z),'#62536a',(x+nx)*.5,.025,(z+nz)*.5,Math.atan2(nx-x,nz-z));
    }
  } else if (rule.shuttle) {
    pedestal.box(rule.shuttle*2+2,.13,1.9,'#6b6175',0,0,0);
    for(const z of [-.51,.51]) pedestal.box(rule.shuttle*2+1.7,.045,.10,theme.trim,0,.15,z);
  } else {
    pedestal.cyl(1.1,1.19,.16,theme.cab,0,.01,0,26).cyl(.97,.97,.07,theme.trim,0,.17,0,26);
  }
  const board = pedestal.model(.028); board.position.set(cx,0,cz); group.add(board);
  board.visible=!rule.shell && !rule.seesaw;
  const trayWidth = rule.lids ? 1.11+(rule.lids-1)*.145 : .91;
  const tray = new Parts().cyl(trayWidth,trayWidth+.09,.16,theme.cab,0,0,0,24)
    .cyl(trayWidth-.11,trayWidth-.02,.09,'#fff4cb',0,.16,0,24).model(.03);
  tray.visible=!rule.shell && !rule.seesaw;
  group.add(tray);
  const lampMaterial = new THREE.MeshBasicMaterial({color:'#54f2aa'});
  const lamp = new THREE.Mesh(new THREE.TorusGeometry(.92,.064,8,36),lampMaterial);
  lamp.rotation.x = -Math.PI/2; lamp.position.y = .15; tray.add(lamp);
  const egg = capsuleModel();
  egg.scale.setScalar(starter ? 1.36 : 1.10);
  group.add(egg);
  const capsule = {kind:'capsule',id:'capsule',obj:egg,state:'rest',v:0,fixed:true};
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map:glowTex, transparent:true, depthWrite:false, depthTest:true, blending:THREE.AdditiveBlending
  }));
  halo.scale.setScalar(2.05); halo.position.y=1.38;
  egg.add(halo); capsule.halo=halo; objects.push(capsule);
  const registerSolid = object => object.obj.traverse(node => {
    if (node.isMesh && node.material===toon) { node.userData.obj=object; solids.push(node); }
  });
  registerSolid(capsule);
  const bonusEggs = bonusSpots.map(([x,z])=>{
    const base = new Parts().cyl(.91,1,.17,theme.cab,0,0,0,20)
      .cyl(.76,.86,.08,'#fff3cf',0,.17,0,20).model(.028);
    base.position.set(x,.20,z); group.add(base);
    const light = new THREE.Mesh(new THREE.TorusGeometry(.92,.068,8,36),new THREE.MeshBasicMaterial({color:'#ff8c46'}));
    light.rotation.x=-Math.PI/2; light.position.y=.16; base.add(light);
    const model=capsuleModel();
    model.scale.setScalar(1.10); model.position.set(x,.45,z);
    group.add(model);
    const extra={kind:'capsule',obj:model,state:'rest',v:0,fixed:true,base,light,spot:[x,z],ready:false};
    registerSolid(extra); objects.push(extra); return extra;
  });
  const tiles = tileSpots.map(([x,z],i)=>{
    const color = '#83d9ef';
    const base = new Parts().cyl(.84,1.03,.18,'#394d62',0,.01,0,20)
      .cyl(.75,.86,.075,color,0,.19,0,20).model(.025);
    const material=new THREE.MeshBasicMaterial({color});
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.86,.075,8,28),material);
    rim.rotation.x=-Math.PI/2;rim.position.y=.21;base.add(rim);
    base.position.set(x,0,z);group.add(base);
    return {x,z,color,material};
  });
  const lids = Array.from({length:rule.lids||0}, (_,i) => {
    // Each cover is an open-bottom shell over the actual egg. Nested shells sit outside the previous one.
    const width = 1.05+i*.145, rise = 1.72+i*.11;
    const profile = [[width-.10,0],[width,0],[width,.21],[width*.87,rise*.66],
      [width*.56,rise*.94],[.12,rise],[0,rise],[0,rise-.10],
      [.12,rise-.10],[width*.51,rise*.87],[width*.79,rise*.62],[width-.10,.20],[width-.10,0]];
    const shape = new THREE.LatheGeometry(profile.map(([r,h])=>new THREE.Vector2(r,h)),32,.48,Math.PI*2-.96);
    const cap = new Parts().push(shape,i%2?theme.trim:theme.cab,0,0,0)
      .cyl(.14,.22,.13,theme.trim,0,rise-.01,0)
      .ball(.19,i%2?theme.cab:'#fff3be',0,rise+.17,0,1,.61,1);
    shape.dispose();
    const lid = add('lid',theme.cover,cap,cx,.55+i*.035,cz,width);
    lid.obj.rotation.y=0;
    lid.fixed=true;
    return lid;
  });
  const keyLoop = new THREE.TorusGeometry(.23,.067,8,18);
  const keys = pads.map(([x,z]) => {
    const socket = new Parts().cyl(.92,1.01,.14,'#487371',0,.02,0,20).cyl(.72,.84,.05,'#b9f4a7',0,.16,0).model(.023);
    socket.position.set(x,0,z); group.add(socket);
    const model = new Parts().push(keyLoop,'#79eb8c',0,.95,.02)
      .box(.148,.57,.13,'#56d97c',0,.20,.021)
      .box(.28,.12,.13,'#9df2a0',.092,.24,.02)
      .box(.20,.11,.13,'#93e68e',.065,.40,.023)
      .cyl(.35,.38,.13,'#fff4ae',0,0,0,16);
    const key = add('key','key',model,x,.21,z,.60);
    key.fixed=true;
    return key;
  });
  const shutters = rule.pulse ? [-1,1].map(side => {
    const wing = new Parts().box(.16,.62,1.38,theme.trim,0,0,0)
      .box(.16,.10,1.42,'#fff4c5',0,.56,0)
      .box(.15,.13,.33,theme.cab,0,.20,0).model(.025);
    tray.add(wing);
    return {side,wing};
  }) : [];
  const shells = rule.shell ? [-3.65,0,3.65].map(x=>{
    const hat = new Parts().cyl(1.04,1.11,.13,'#fcda75',0,.03,0,22)
      .cyl(.73,.81,1.12,'#8e3e71',0,.16,0,22)
      .cyl(.82,.85,.25,'#f5ae68',0,.17,0,22)
      .cyl(.75,.76,.13,'#a84e84',0,1.20,0,22)
      .ball(.17,'#f8d586',0,1.37,0);
    const piece=add('hat','hat',hat,x,.35,-1.25,1);
    piece.fixed=true; return piece;
  }) : [];
  const balance = rule.seesaw ? buildSeesaw(group,cx,cz) : null;
  const delivery = rule.delivery ? buildDelivery(group) : null;
  const challenge = {balance, delivery, center, tray, lamp, lids, keys, shutters, route, tiles, shells, phase:0, unlockedFor:0, gateOpen:true, aperture:0, progress:0, charge:0, lastTile:-1};
  const machine = { group, objects, solids, theme, depth:level, capsule, bonusEggs, challenge };
  if (rule.shell) resetShells(machine);
  positionChallenge(machine,0);
  if (theme.key === 'sea') { const water = new THREE.Mesh(new THREE.BoxGeometry(17.9, 11.8, 17.9), new THREE.MeshBasicMaterial({ color: '#4fb8e8', transparent: true, opacity: .1, depthWrite: false })); water.position.y = 5.9; water.raycast = () => {}; group.add(water); }
  return machine;
}

const hatSlots = [-3.65,0,3.65];
const shellIntro = 1.85;
const swapLength = .86;
function resetShells(machine,running=false) {
  const {challenge}=machine;
  const deck=challenge.shells;
  challenge.realHat=pick(deck);
  challenge.shellClock=0;
  challenge.shellRunning=running;
  challenge.swaps=[];
  let previous=-1;
  const pairs=[[0,1],[1,2],[0,2]];
  for(let i=0;i<4;i++) {
    const turn=pick([0,1,2].filter(j=>j!==previous));
    challenge.swaps.push(pairs[turn]); previous=turn;
  }
  deck.forEach((hat,i)=>{
    Object.assign(hat,{state:'rest',v:0,slot:i});
    hat.obj.visible=true; hat.obj.scale.setScalar(1); hat.obj.rotation.set(0,0,0);
  });
}
function moveShells(machine,dt) {
  const {capsule,challenge}=machine;
  const {shells,swaps,realHat}=challenge;
  const time=challenge.shellClock+=challenge.shellRunning ? dt : 0;
  const shuffle=Math.max(0,time-shellIntro);
  const slots=shells.slice();
  const done=Math.min(swaps.length,Math.floor(shuffle/swapLength));
  for(let i=0;i<done;i++) {
    const [a,b]=swaps[i]; [slots[a],slots[b]]=[slots[b],slots[a]];
  }
  const [a,b]=swaps[done]||[-1,-1];
  const slide=ease(clamp((shuffle/swapLength-done)/.85,0,1));
  const intro=time<shellIntro;
  slots.forEach((hat,i)=>{
    if(hat.state!=='rest')return;
    const next=i===a?b:i===b?a:i;
    const depth=i===a?1:i===b?-1:0;
    const x=hatSlots[i]+(hatSlots[next]-hatSlots[i])*slide;
    const y=intro ? .30+2.2*(1-ease(clamp((time-1.12)/.57,0,1))) : .30;
    hat.obj.position.set(x,y,-1.25+depth*Math.sin(Math.PI*slide)*1.2);
  });
  capsule.obj.position.set(realHat.obj.position.x,.42,-1.25);
  capsule.obj.visible=time<1.58;
  capsule.halo.visible=capsule.obj.visible;
  challenge.gateOpen=done===swaps.length;
}
function buildSeesaw(group,x,z) {
  const platform = new THREE.Group();
  platform.position.set(x,1.18,z); group.add(platform);
  const stand = new Parts().cyl(.35,.78,1.02,'#624535',x,0,z,16)
    .cyl(.45,.37,.16,'#c79764',x,.96,z,18).model(.035);
  group.add(stand);
  const wood = new Parts();
  for (const side of [-1,1]) {
    wood.box(3.43,.18,1.85,'#d99353',side*2.41,-.19,0);
    wood.box(3.48,.14,.13,'#ffd48b',side*2.40,.02,-.91);
    wood.box(3.48,.11,.13,'#a4603b',side*2.40,.01,.91);
    wood.box(.79,.13,1.65,side===-1?'#61bda7':'#8bb9eb',side*3.53,-.02,0);
    wood.box(.19,.31,1.86,side===-1?'#96e1cf':'#aedafa',side*4.02,-.10,0);
  }
  wood.cyl(.79,.91,.19,'#a4603b',0,-.37,0,30);
  wood.cyl(.67,.73,.10,'#683f38',0,-.18,0,30);
  platform.add(wood.model(.025));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.76,.047,8,30),new THREE.MeshBasicMaterial({color:'#ffdd86'}));
  ring.rotation.x=-Math.PI/2; ring.position.y=-.025; platform.add(ring);
  return {platform, ring, x, z, pos:-3.15, speed:0, tilt:0, pressure:0, seated:false};
}
function pressSeesaw(balance) {
  const dx=claw.x-balance.x;
  return Math.abs(claw.z-balance.z)<1.18 && Math.abs(dx)>2.43 && Math.abs(dx)<4.55 ? Math.sign(dx) : 0;
}
function rollIntoNotch(machine,dt) {
  const {capsule,challenge}=machine;
  const board=challenge.balance;
  const press=pressSeesaw(board);
  const pressure=board.seated?0:press;
  board.pressure=pressure;
  board.tilt+=(-pressure*.225-board.tilt)*Math.min(1,dt*9);
  board.platform.rotation.z=board.tilt;
  if (!board.seated && dt>0) {
    board.speed=(board.speed-Math.sin(board.tilt)*21*dt)*Math.exp(-(pressure ? .95 : 2.7)*dt);
    board.pos=clamp(board.pos+board.speed*dt,-boardLimit,boardLimit);
    if(Math.abs(board.pos)>=boardLimit && Math.sign(board.speed)===Math.sign(board.pos))board.speed*=-.20;
    if (!pressure && Math.abs(board.pos)<notchRadius && Math.abs(board.speed)<2.4) {
      board.seated=true; board.speed=0;
      audio.tone([460,610,820],.12,.075);
      toast('进槽了！移到金蛋正上方再抓。',2.2);
    }
  }
  if (board.seated) board.pos*=Math.exp(-dt*12);
  const seatDepth=board.seated ? -.135 : .025;
  capsule.obj.position.set(board.x+Math.cos(board.tilt)*board.pos,1.18+Math.sin(board.tilt)*board.pos+seatDepth,board.z);
  capsule.obj.rotation.z=board.tilt;
  capsule.obj.rotation.y=board.pos*.72;
  board.ring.material.color.set(board.seated?'#65ef9b':'#ffcc64');
  challenge.gateOpen=board.seated;
}
function buildDelivery(group) {
  const bars = [-.75,2.65].map((z,i)=>{
    const width=i?5.7:6.15;
    const beam = new Parts().box(width,.31,.36,'#d85c59',0,0,0);
    for (let n=0;n<11;n++) beam.box(.24,.32,.38,n%2?'#e87565':'#ffdf8c',(n-5)*width/12,0,0);
    for (const d of [-1,1]) beam.ball(.27,'#ffad70',d*width*.51,.16,0);
    const model=beam.model(.028); group.add(model);
    return {z,width,model,x:0};
  });
  const goal=new THREE.Mesh(new THREE.TorusGeometry(.96,.075,9,35),new THREE.MeshBasicMaterial({color:'#71f4ab'}));
  goal.rotation.x=-Math.PI/2; goal.position.set(CHUTE.x,.19,CHUTE.z);group.add(goal);
  return {bars,goal,time:0,bump:0};
}
function moveDelivery(machine,dt) {
  const d=machine.challenge.delivery;
  d.time+=dt; d.bump=Math.max(0,d.bump-dt);
  d.bars.forEach((bar,i)=>{
    bar.x=Math.sin(d.time*(i?.77:.63)+i*2.15)*2.28;
    bar.model.position.set(bar.x,8.43,bar.z);
  });
  d.goal.material.color.set(claw.state==='deliver'?'#71f4ab':'#e4bf78');
}
function blocksDelivery(x,z) {
  const d=M.challenge.delivery;
  const hit=d.bars.some(bar=>Math.abs(z-bar.z)<barClearance && Math.abs(x-bar.x)<bar.width/2+.62 &&
    Math.abs(z-bar.z)<=Math.abs(claw.z-bar.z)+.001);
  if (hit && d.bump===0) {
    d.bump=.66;
    claw.wob+=2.8;
    toast('碰到软杆了，往旁边绕。',1.35);
    audio.tone([220,166],.09,.065);
  }
  return hit;
}

function positionChallenge(machine, dt) {
  const {theme, capsule, challenge} = machine;
  const {rule} = theme;
  const {center,tray,lamp,lids,keys} = challenge;
  if (rule.shell) {moveShells(machine,dt);return;}
  if (rule.seesaw) {
    if (capsule.state==='rest') rollIntoNotch(machine,dt);
    return;
  }
  if (rule.delivery) moveDelivery(machine,dt);
  challenge.phase = (challenge.phase+dt/(rule.period||1))%1;
  const phase = challenge.phase, angle = phase*Math.PI*2;
  const direction = rule.reverse ? -1 : 1;
  let [x,z] = center;
  if (challenge.route.length) {
    const at=phase*challenge.route.length, i=Math.floor(at);
    const k=ease(clamp((at-i-.24)/.63,0,1));
    const [a,b]=challenge.route[i], [c,d]=challenge.route[(i+1)%challenge.route.length];
    x=a+(c-a)*k; z=b+(d-b)*k;
  }
  if (rule.orbit) {
    x += rule.orbit*Math.cos(angle*direction);
    z += rule.orbit*Math.sin(angle*direction)*(rule.oval||1);
  }
  if (rule.shuttle) {
    x += rule.shuttle * clamp(Math.cos(angle)*1.32,-1,1);
  }
  const height = rule.lift ? (rule.high||2.1)*(.5-.5*Math.cos(angle)) : 0;
  if(capsule.state==='rest') {
    tray.position.set(x,.20+height,z);
    capsule.obj.position.set(x,.45+height,z);
  }
  for (const extra of machine.bonusEggs) {
    if(extra.state!=='rest')continue;
    const [ex,ez]=extra.spot;
    const rise=(rule.high||2.1)*(.5+.5*Math.cos(angle));
    extra.base.position.set(ex,.20+rise,ez);
    extra.obj.position.set(ex,.45+rise,ez);
    extra.ready=phase<.19||phase>.81;
    extra.light.material.color.set(extra.ready?'#59f499':'#ff8c46');
  }
  const covered = lids.some(lid => lid.state!=='gone');
  capsule.halo.visible = !covered;
  const timed = (!rule.pulse || (phase >= .16 && phase <= (machine.depth===6 ? .71 : .57))) &&
    (!rule.lift || phase >= .31 && phase <= .69);
  challenge.gateOpen = !covered && keys.every(key => key.state==='gone') && timed && specialReady(machine);
  lamp.material.color.set(challenge.gateOpen ? '#59f499' : '#ff8c46');
  challenge.aperture += (Number(challenge.gateOpen)-challenge.aperture)*Math.min(1,dt*14);
  for (const {side,wing} of challenge.shutters) {
    wing.visible=!covered;
    wing.position.set(side*(.66+.34*challenge.aperture),.12,0);
    wing.rotation.z = -side*challenge.aperture*1.13;
  }
}

function specialReady(machine) {
  return !machine.theme.rule.cool || machine.challenge.unlockedFor>0;
}
function updateSpecial(dt) {
  if (!M.theme.rule.cool) return;
  const c=M.challenge, pad=c.tiles[0];
  if (!atCoolingPad()) {
    c.charge=0;
    c.unlockedFor=Math.max(0,c.unlockedFor-dt);
    if (!c.unlockedFor) pad.material.color.set(pad.color);
    return;
  }
  const before=c.charge;
  c.charge=Math.min(1,before+dt/.72);
  pad.material.color.set(pad.color).lerp(new THREE.Color('#fff7de'),c.charge);
  if (c.charge<1) return;
  c.unlockedFor=coldTime;
  if (before<1) {
    $('clue').hidden=true;
    audio.tone([530,740],.10,.065);
  }
}

// ---------------------------------------------------------------- physics-lite
const ray = new THREE.Raycaster();
function shown(o) { for (let n = o; n; n = n.parent) if (!n.visible) return false; return true; }
// surface below a point, ignoring one object (and anything held or falling)
function surface(x, z, ignore = null) {
  ray.set(new THREE.Vector3(x, TOP + 3, z), new THREE.Vector3(0, -1, 0));
  for (const h of ray.intersectObjects(M.solids, false)) {
    const o = h.object.userData.obj;
    if (!o || o === ignore || !shown(h.object)) continue;
    if (o.kind !== 'floor' && o.state !== 'rest') continue;
    return { y: h.point.y, o };
  }
  return { y: 0, o: null };
}
function settle() {
  // anything left hanging in the air drops onto whatever is below it now
  for (const o of M.objects) {
    if (o.fixed || o.state !== 'rest') continue;
    const s = surface(o.obj.position.x, o.obj.position.z, o);
    if (o.obj.position.y > s.y + .08) { o.state = 'falling'; o.v = 0; o.land = s.y; }
  }
}

// ---------------------------------------------------------------- claw actions
const grabButton = $('grab');
const shop = $('shop');
const distanceToClaw = object => Math.hypot(object.obj.position.x-claw.x,object.obj.position.z-claw.z);
function preciseTarget() {
  const {challenge, capsule} = M;
  if (M.theme.rule.shell) return challenge.gateOpen
    ? challenge.shells.find(hat=>hat.state==='rest'&&distanceToClaw(hat)<.65) : null;
  const lid = challenge.lids.findLast(object => object.state==='rest');
  const targets = [...challenge.keys,lid,...M.bonusEggs.filter(egg=>egg.ready),challenge.gateOpen ? capsule : null];
  return targets.find(object => object?.state==='rest' && distanceToClaw(object) <= (object===capsule ? (depth<=5 ? .65 : .56) : .72));
}
function gateMessage() {
  const {rule}=M.theme;
  const {challenge}=M;
  if (rule.shell) {
    if (!challenge.shellRunning) return '点这里开始换位';
    return challenge.gateOpen ? '选一顶帽子' : '跟住藏蛋的帽子';
  }
  if (rule.cool) {
    if (challenge.unlockedFor>0) return atCoolingPad() ? '冷却完成 · 去抓金蛋' : '抓蛋剩 '+Math.ceil(challenge.unlockedFor)+' 秒';
    return atCoolingPad() ? '正在给爪子冷却' : '先把爪子移到蓝台';
  }
  if (rule.seesaw) return challenge.balance.seated ? '金蛋进槽 · 可以抓了' : '滚到中间 · 把爪子移开';
  if (rule.delivery) return claw.state==='deliver' ? '绕开挡杆 · 移到出奖口' : '抓稳后亲手运送';
  if (rule.twin) return '金蛋 '+[M.capsule,...M.bonusEggs].filter(o=>o.state==='gone').length+'/2';
  const lids = M.challenge.lids.filter(o => o.state!=='gone').length;
  const keys = M.challenge.keys.filter(o => o.state!=='gone').length;
  if (lids || keys) return [lids ? '护盖 '+lids : '',keys ? '钥匙 '+keys : ''].filter(Boolean).join(' · ');
  return M.challenge.gateOpen ? '金蛋可抓' : '等台灯变绿';
}
function atCoolingPad() {
  if (!M?.theme.rule.cool) return false;
  const {x,z}=M.challenge.tiles[0];
  return Math.hypot(x-claw.x,z-claw.z)<coolingRadius;
}
function canLowerClaw() {
  return shop.hidden && $('level-menu').hidden && claw.state==='idle' && !over && !diving && tries>0 &&
    (!M.theme.rule.shell || M.challenge.gateOpen) && !atCoolingPad() &&
    (!M.theme.rule.seesaw || M.challenge.gateOpen);
}
function startGrab() {
  if (!canLowerClaw()) return;
  const target = preciseTarget();
  if (!target && M.bonusEggs.some(egg=>egg.state==='rest' && !egg.ready && distanceToClaw(egg)<.8)) {
    toast('等这台矿梯的灯变绿。',1.8); return;
  }
  if (!target && !specialReady(M) && M.challenge.tiles.some(({x,z})=>Math.hypot(x-claw.x,z-claw.z)<1)) {
    toast(M.theme.hint,2.5); return;
  }
  if (!target && !M.challenge.gateOpen && distanceToClaw(M.capsule)<.89) {
    toast(gateMessage(),1.6); return;
  }
  claw.target = target;
  audio.ready(); tries--; claw.state = 'drop'; claw.t = 0;
  const s = surface(claw.x, claw.z); claw.stopY = Math.max(.1, s.y) + TIP - .2;
  audio.slide(300, 160, .6, .05); hud();
}
function closeGrab() {
  const tipY = claw.y - TIP;
  const near = M.objects.filter(o => o.state === 'rest').map(o => {
    const p = o.obj.position; return { o, d: Math.hypot(p.x - claw.x, p.z - claw.z), dy: tipY - p.y };
  }).filter(c => c.d < reachR() && c.dy < 1.5 && c.dy > -.7).sort((a, b) => a.d - b.d);
  claw.held = [];
  const exact = claw.target;
  if (exact?.state === 'rest') {
    exact.state = 'held';
    head.attach(exact.obj);
    exact.slipAt = null;
    claw.held.push(exact);
  }
  for (const { o, d } of (M.theme.rule.delivery && exact===M.capsule ? [] : near.slice(0,3))) {
    if (claw.held.length >= 3) break;
    if (o.state !== 'rest' || ['lid','key','hat'].includes(o.kind) || (o.kind==='capsule' && (!M.challenge.gateOpen || M.theme.rule.shell || M.theme.rule.twin))) continue;
    const base = o.kind === 'cover' ? .65 : o.kind === 'capsule' ? Math.max(.6, .92 - .03 * (depth - 1)) : .85;
    if (Math.random() < Math.min(.98, base * clamp(1 - (d / reachR()) ** 2 * .8, .2, 1))) {
      o.state = 'held'; head.attach(o.obj); claw.held.push(o);
      o.slipAt = o.kind === 'cover' ? (Math.random() < .25 ? rand(3, TOP - 1) : null) : (Math.random() < ((o.kind === 'capsule' ? .08 + .025 * depth : .1) + d * .25) ? rand(2.5, TOP - 1) : null);
    }
  }
  if (!claw.held.length) {
    toast(near.length ? pick(['差一点点！', '爪子滑开了…', '没夹住！']) : '空的，什么也没抓到', 1.4);
    audio.slide(500, 200, .5, .06);
  } else {
    audio.noise(.10, 750, .064);
    audio.tone([310,465],.07,.05);
    if (claw.held.some(o => o.kind === 'capsule')) { toast(exact===M.capsule ? '稳稳夹住了！' : '夹住扭蛋了！稳住…', 1.6); audio.tone([660, 880], .1, .07); }
  }
  settle();
}
const reachR = () => .98;
function dropOne(o, slip, toss = false) {
  M.group.attach(o.obj); o.state = 'falling'; o.v = 0; o.spin = rand(-5, 5); o.vx = o.vz = 0;
  const p = o.obj.position;
  if (Math.abs(p.x - CHUTE.x) < 1.2 && Math.abs(p.z - CHUTE.z) < 1.2) { o.state = 'chute'; return; }
  if (toss) {
    // filler gets flung aside so it does not land right back on what you were digging for
    const fall = Math.sqrt(2 * Math.max(1, p.y) / 20);
    for (let k = 0; k < 8; k++) {
      const a = rand(0, Math.PI * 2), dist = rand(2.4, 4), x = clamp(p.x + Math.cos(a) * dist, -7.3, 7.3), z = clamp(p.z + Math.sin(a) * dist, -7.3, 7.3);
      if (x > 4.6 && z > 4.6) continue;
      o.vx = (x - p.x) / fall; o.vz = (z - p.z) / fall; break;
    }
    const fx = p.x + o.vx * fall, fz = p.z + o.vz * fall;
    o.land = surface(fx, fz, o).y; return;
  }
  o.land = surface(p.x, p.z, o).y;
  if (slip && o.kind !== 'cover') { toast(o.kind === 'capsule' ? '啊！扭蛋掉回去了！' : pick(['半路掉了！', '滑走了…好可惜！']), 1.8); audio.slide(800, 200, .6, .07); popText('掉了!', '#ffffff'); }
}
function award(o) {
  o.state = 'gone'; o.obj.visible = false;
  if (o.kind === 'capsule') {
    gain(30 * depth);
    if (M.theme.rule.twin && [M.capsule,...M.bonusEggs].some(egg=>egg.state!=='gone')) {
      popText('+'+30*depth+' 积分','#ffe58a');
      toast('抓到第一颗，还有一颗！',2.6);
      audio.tone([659,784,988],.12,.075);
      hud(); later(checkOver,400); return;
    }
    if (!replay) {
      cleared = Math.max(cleared,depth);
      remember(checkpointKey,cleared);
    }
    startDive(); return;
  }
  if (o.kind==='hat') {
    if (o===M.challenge.realHat) {
      award(M.capsule);
    } else {
      gain(5); popText('+5 积分','#ffe58a');
      toast('空帽子！点「开始换位」再试一次。',2.5);
      audio.tone([392,330],.10,.06);
      resetShells(M); moveShells(M,0);
      hud(); later(checkOver,400);
    }
    return;
  }
  if (o.kind === 'lid' || o.kind === 'key') {
    gain(3 * depth);
    toast(o.kind === 'lid' ? '护盖移开了！' : '收下一枚钥匙！',1.6);
    audio.tone([523,784,988],.1,.07);
    hud(); later(checkOver,400); return;
  }
  const points = o.kind==='coin' ? 10 : o.kind==='prize' ? 10*depth : depth;
  gain(points);
  popText('+'+points+' 积分', '#ffe58a');
  const notes = o.kind==='coin' ? [988,1319,1568] : o.kind==='prize' ? [660,880,1175] : [548,734];
  audio.tone(notes,.09,.055);
  if (o.kind==='prize') toast('抓到'+PRIZE_NAMES[o.id]+'！',1.25);
  hud(); later(checkOver, 400);
}
function checkOver() {
  if (over || diving || tries > 0 || claw.state !== 'idle') return;
  if (M.objects.some(o => o.state === 'falling' || o.state === 'chute' || o.state === 'held')) { later(checkOver, 400); return; }
  over = true;
  saveBest();
  finale = false;
  $('again').textContent = '重试第 '+depth+' 层';
  $('result-levels').hidden = cleared<totalLevels;
  $('result-title').textContent = '第 ' + depth + ' 层 · 次数用完了';
  $('result-note').textContent = `本局积分 +${runPoints}（共 ${META.points}）· 最深纪录 第 ${best()} 层${depth > bestAtStart && bestAtStart ? ' · 新纪录！' : ''}`;
  $('result').hidden = false; audio.slide(500, 180, .8, .06);
}
const later = (fn, ms) => { const id = roundId; setTimeout(() => { if (id === roundId) fn(); }, ms); };

// ---------------------------------------------------------------- the dive
// The reveal is composited over the cabinet so the prize can never sit behind its glass.
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(200, 200),
  new THREE.MeshBasicMaterial({ color: '#38213e', transparent: true, opacity: 0, depthWrite: false }));
revealScene.add(backdrop);
const sparkleShape = new THREE.Shape();
for (let i = 0; i < 8; i++) {
  const angle = i * Math.PI / 4;
  const radius = i % 2 ? .036 : .15;
  const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
  if (i === 0) sparkleShape.moveTo(x, y); else sparkleShape.lineTo(x, y);
}
sparkleShape.closePath();
const sparkleGeometry = new THREE.ShapeGeometry(sparkleShape);
const sparkles = Array.from({ length: 15 }, (_, i) => {
  const star = new THREE.Mesh(sparkleGeometry, new THREE.MeshBasicMaterial({
    color: ['#fff8ce', '#ffb1ca', '#aef6fb'][i % 3], transparent: true, depthWrite: false
  }));
  star.visible = false;
  revealScene.add(star); return star;
});

function removeGeometry(group) {
  const geometries = new Set(), materials = new Set();
  group.traverse(node => {
    // The toon and outlines are shared across cabinets. Other materials here belong to this cabinet.
    if (node.isMesh) geometries.add(node.geometry);
    if (node.material && node.material !== toon && node.material.onBeforeCompile === THREE.Material.prototype.onBeforeCompile) {
      materials.add(node.material);
    }
  });
  group.removeFromParent();
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

const diveTitle = $('dive-title');
function crownModel() {
  const p = new Parts().cyl(1.05,1.32,.30,'#aa553a',0,0,0,20)
    .cyl(.89,1.05,.20,'#fff0a1',0,.30,0,20)
    .cyl(.99,.89,.46,'#ffc147',0,.54,0,22);
  for (let i=0;i<7;i++) {
    const theta=i*Math.PI*2/7, x=Math.cos(theta)*.87, z=Math.sin(theta)*.87;
    p.cone(.26,i%2?.76:1.12,'#ffd956',x,.83,z,5);
    p.ball(.115,i%2?'#ff928f':'#c28af0',x,i%2?1.57:1.88,z);
  }
  p.push(octahedron,'#fa7976',0,.78,.95,0,.2,0,.36,.45,.21);
  return {group:p.model(.036),theme:M.theme};
}
function startDive() {
  const cap = capsuleModel();
  const celebrating = replay || depth===totalLevels;
  const next = celebrating ? crownModel() : buildMachine(depth + 1);
  const forward = camera.getWorldDirection(new THREE.Vector3());
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const front = camera.position.clone().addScaledVector(forward, 12.6);
  const miniature = front.clone().addScaledVector(up, .17);
  const start = new THREE.Vector3(CHUTE.x, .5, CHUTE.z);
  cap.position.copy(start); cap.scale.setScalar(.8);
  next.group.visible = false;
  revealScene.add(cap, next.group);
  backdrop.position.copy(camera.position).addScaledVector(forward, 66);
  backdrop.quaternion.copy(camera.quaternion);
  backdrop.material.opacity = 0;
  diving = { t: 0, cap, next, start, front, miniature, up, celebrating, revealed: false };
  $('stage').classList.add('dive-active');
  $('clue').hidden = true;
  if (!shop.hidden) closeShop(false);
  cam.goal = cam.elGoal = null; cam.spin = 0;
  rig.visible = false;
  audio.hum(0);
  audio.slide(340, 1100, .52, .07, 'triangle');
  hud();
}
function updateDive(dt) {
  const d = diving, t = d.t += dt;
  const lift = ease(clamp(t / .58, 0, 1));
  const split = ease(clamp((t - .58) / .52, 0, 1));
  const enter = d.celebrating ? 0 : ease(clamp((t - 1.43) / 1.02, 0, 1));
  const { cap, next } = d;
  const lid = cap.userData.lid;
  const bottom = cap.children[0];

  cap.position.lerpVectors(d.start, d.front, lift);
  cap.position.y += Math.sin(Math.PI * lift) * 1.5;
  cap.rotation.y = cam.az + Math.PI * 2 * lift;
  cap.scale.setScalar(.8 + .25 * lift);
  // Both halves clear the center while the miniature rises through the opening.
  lid.position.set(2.27 * split, .687 + .35 * split, -.40 * split);
  lid.rotation.z = -.91 * split;
  bottom.position.set(-2.22 * split, -.25 * split, -.36 * split);
  bottom.rotation.z = .83 * split;
  cap.visible = t < 1.43;
  backdrop.material.opacity = .66 * lift * (1 - enter);
  if (!d.revealed && t >= .64) {
    d.revealed = true; next.group.visible = true;
    diveTitle.textContent = d.celebrating ? (replay ? '找到了！' : '头衔解锁 · '+title) : '下一层 · ' + next.theme.name;
    diveTitle.hidden = false;
    audio.tone([784, 988, 1319, 1568], .12, .08);
  }
  if (d.revealed) {
    const bloom = clamp((t - .66) / .63, 0, 1);
    const previewSize = d.celebrating ? .28+.76*ease(bloom) : .032 + .138 * ease(bloom);
    next.group.scale.setScalar(previewSize + (1 - previewSize) * enter);
    next.group.position.copy(d.miniature).addScaledVector(d.up, .25 * Math.sin(Math.PI * bloom));
    next.group.position.y -= (d.celebrating ? 1.06 : 3.95) * previewSize;
    next.group.position.multiplyScalar(1 - enter);
    next.group.rotation.y = d.celebrating ? cam.az+t*1.2 : -.42 * (1-bloom);
  }
  for (let i = 0; i < sparkles.length; i++) {
    const star = sparkles[i], age = clamp((t - .59 - (i % 4) * .024) / .8, 0, 1);
    star.visible = age > 0 && age < 1;
    if (!star.visible) continue;
    const angle = 2.4 * i, radius = (.55 + age * (1.25 + i % 3 * .37));
    const off = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, .6);
    star.position.copy(d.miniature).add(off.applyQuaternion(camera.quaternion));
    star.quaternion.copy(camera.quaternion);
    star.rotateZ(i * .34 + age);
    star.scale.setScalar(Math.sin(Math.PI * age) * (1 + i % 3 * .33));
    star.material.opacity = 1 - age * .76;
  }
  if (t >= 1.43 && !d.entering && !d.celebrating) {
    d.entering = true;
    $('stage').style.background = next.theme.bg;
    audio.slide(340, 850, .78, .055);
  }
  M.group.position.y = -24 * enter;
  M.group.visible = enter < .69;
  if (t >= 2.45) finishDive();
}
function finishDive() {
  const d = diving;
  removeGeometry(d.cap);
  if (d.celebrating) {
    removeGeometry(d.next.group);
    diving=null; over=true; rig.visible=true;
    diveTitle.hidden=true;
    $('stage').classList.remove('dive-active');
    finale=!replay;
    $('result-title').textContent=finale ? title : M.theme.name+' · 试玩完成';
    $('result-note').textContent=finale ? '20 台机器全部通关。现在可以自由选关。' : '已把金蛋送到出奖口。';
    $('again').textContent=finale ? '从第一层试玩' : '再玩这一层';
    $('result-levels').hidden=false;
    $('result').hidden=false;
    hud(); audio.tone([523,659,784,988,1047],.15,.10);
    return;
  }
  removeGeometry(M.group);
  M = d.next; scene.add(M.group); M.group.position.set(0, 0, 0); M.group.scale.setScalar(1);
  depth = M.depth; saveBest();
  diving = null; rig.visible = true;
  claw.x = claw.tx = 0; claw.z = claw.tz = -1; claw.y = TOP; claw.open = 1; claw.state = 'idle'; claw.held = [];
  head.position.set(claw.x, claw.y, claw.z);
  tries = triesFor(depth)+Math.min(1,tries); extraBought=false;
  diveTitle.hidden = true;
  $('stage').classList.remove('dive-active');
  hud(); popText('第 ' + depth + ' 层！', '#ffffff');
  if (M.theme.rule.cool) $('clue').hidden=true; else toast(M.theme.hint,5.6);
  audio.tone([523, 659, 784, 1047], .14, .09);
}
const triesFor = level => {
  const {rule}=THEMES[level-1];
  return (level<=3 ? 5 : 3)+(rule.lids||0)+(rule.keys||0)+Number(Boolean(rule.twin));
};

// ---------------------------------------------------------------- UI
let toastUntil = 0;
function toast(text, sec = 2.2) { $('clue').textContent = text; $('clue').hidden = false; toastUntil = performance.now() + sec * 1000; }
function popText(text, color) { const d = document.createElement('div'); d.className = 'pop'; d.textContent = text; d.style.color = color; $('stage').append(d); setTimeout(() => d.remove(), 1300); }
function hud() {
  $('tries').textContent = tries; $('depth').textContent = '第 '+depth+' 层'; $('theme').textContent = M.theme.name;
  $('open-levels').hidden = cleared < totalLevels;
  $('title-badge').hidden = cleared < totalLevels;
  $('best').textContent = Math.max(best(), 1); $('points').textContent = META.points;
  $('result-shop').hidden = M.capsule.state==='gone' || extraBought || META.points<extraCost;
  grabButton.disabled = !canLowerClaw();
  updateAimLabel();

}
function updateAimLabel() {
  const aligned = !grabButton.disabled && Boolean(preciseTarget());
  let text = aligned ? '抓稳！' : '抓！';
  if (M.theme.rule.seesaw && !M.challenge.gateOpen) text='先压板';
  if (claw.state==='deliver') text='运送中';
  if (atCoolingPad() && claw.state==='idle' && !over && !diving) text=M.challenge.unlockedFor>0 ? '去抓蛋' : '冷却中';
  if (grabButton.textContent !== text) {
    grabButton.textContent = text;
  }
  grabButton.toggleAttribute('data-locked', aligned);
  grabButton.toggleAttribute('data-cooling',atCoolingPad());
  grabButton.toggleAttribute('data-guided',claw.state==='deliver'||(M.theme.rule.seesaw&&!M.challenge.gateOpen));
}
function newGame(level = 1, practice = false) {
  bestAtStart=best();
  roundId++; over=false; finale=false; replay=practice; depth=level;
  cam.az=0; cam.el=.62; cam.view=0; cam.zoom=1; cam.goal=cam.elGoal=null;
  runPoints=0; extraBought=false;
  tries=triesFor(depth);
  if (M) removeGeometry(M.group);
  M=buildMachine(depth); scene.add(M.group);
  Object.assign(claw,{x:0,tx:0,z:-1,tz:-1,y:TOP,state:'idle',open:1,held:[],target:null});
  head.position.set(0,TOP,-1);
  $('stage').style.background=M.theme.bg;
  $('result').hidden=true;
  hud(); if (M.theme.rule.cool) $('clue').hidden=true; else toast(M.theme.hint,5.6);
}

// ---------------------------------------------------------------- input
const keys = new Set();
const touches = new Map(); let pinch = null;
canvas.oncontextmenu = e => e.preventDefault();
canvas.onpointerdown = e => {
  if (!shop.hidden || !$('level-menu').hidden || diving) return;
  audio.ready(); canvas.setPointerCapture(e.pointerId);
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY, orbit: e.button === 2 || e.shiftKey });
  pinch = touches.size === 2 ? twoFinger() : null; cam.goal = cam.elGoal = null;
};
function twoFinger() { const [a, b] = touches.values(); return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, gap: Math.hypot(a.x - b.x, a.y - b.y) || 1 }; }
function orbit(dx, dy) { cam.az -= dx * .008; cam.el = clamp(cam.el + dy * .005, .3, 1.25); }
canvas.onpointermove = e => {
  const t = touches.get(e.pointerId); if (!t) return;
  const dx = e.clientX - t.x, dy = e.clientY - t.y; t.x = e.clientX; t.y = e.clientY;
  if (touches.size === 2) { const n = twoFinger(); if (pinch) { orbit(n.x - pinch.x, n.y - pinch.y); cam.zoom = clamp(cam.zoom * pinch.gap / n.gap, .7, 1.35); } pinch = n; return; }
  if (t.orbit) { orbit(dx, dy); return; }
  if ((claw.state==='idle' || claw.state==='deliver') && !diving) moveBy(dx * .028, dy * .028);
};
canvas.onpointerup = canvas.onpointercancel = e => { touches.delete(e.pointerId); pinch = null; };
canvas.addEventListener('wheel', e => { e.preventDefault(); cam.zoom = clamp(cam.zoom * Math.exp(e.deltaY * .001), .7, 1.35); }, { passive: false });
for (const [id, dir] of [['rot-left', 1], ['rot-right', -1]]) {
  const b = $(id);
  b.onpointerdown = e => { e.preventDefault(); cam.goal = null; cam.spin = dir; b.setPointerCapture(e.pointerId); };
  b.onpointerup = b.onpointercancel = b.onlostpointercapture = () => { cam.spin = 0; };
}
function moveBy(right, back) { const c = Math.cos(cam.az), s = Math.sin(cam.az); claw.tx = clamp(claw.tx + right * c + back * s, -7.3, 7.3); claw.tz = clamp(claw.tz - right * s + back * c, -7.3, 7.3); }
addEventListener('keydown', e => {
  if (!shop.hidden || !$('level-menu').hidden || e.target.closest?.('button, input, select, textarea, [contenteditable]')) return;
  const key = e.key.toLowerCase();
  if (['arrowright', 'arrowleft', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) {
    e.preventDefault();
    keys.add(key);
  }
  if (e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat) startGrab();
  }
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
$('grab').onclick = startGrab;
$('angle').onclick = () => { cam.view = (cam.view + 1) % VIEWS.length; cam.goal = VIEWS[cam.view]; cam.elGoal = .62; cam.zoom = 1; toast(['正面', '左侧', '背面', '右侧'][cam.view] + '视角 · 双指或右键拖动可以自由旋转', 1.6); };
// ------------------------------------------------ extra attempt
const canBuy = () => !diving && M.capsule.state!=='gone' && !extraBought && META.points>=extraCost;
function renderShop() {
  $('shop-points').textContent = META.points;
  $('buy-attempt').disabled = !canBuy();
  $('buy-attempt').textContent = extraBought ? '本关已兑换' : extraCost+' 积分';
}
$('buy-attempt').onclick = () => {
  if (!canBuy()) return;
  META.points-=extraCost; saveMeta();
  extraBought=true; tries++;
  if (over) {
    over=false;
    $('result').hidden=true;
  }
  closeShop(false);
  popText('+1 次','#ffd23f');
  audio.tone([784,988,1175],.1,.07);
};
let shopOpener;
const playPanels = [$('stage'), document.querySelector('footer'), $('result')];
function openShop(event) {
  if (diving) return;
  keys.clear(); cam.spin = 0;
  shopOpener = event.currentTarget;
  renderShop(); shop.hidden = false;
  $('shop-close').focus();
  for (const panel of playPanels) panel.inert = true;
  hud();
}
function closeShop(restoreFocus = true) {
  shop.hidden = true;
  for (const panel of playPanels) panel.inert = false;
  if (restoreFocus) shopOpener?.focus();
  hud();
}
$('open-shop').onclick = $('result-shop').onclick = openShop;
$('shop-close').onclick = () => closeShop();
shop.addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); closeShop(); }
});
$('again').onclick = () => newGame(finale ? 1 : depth,replay || cleared===totalLevels);

const levelMenu = $('level-menu');
let levelOpener;
function closeLevelMenu(focus = true) {
  levelMenu.hidden=true;
  for (const panel of playPanels) panel.inert=false;
  if (focus) levelOpener?.focus();
  hud();
}
function openLevelMenu(event) {
  if (cleared<totalLevels || diving || (claw.state!=='idle' && !over)) return;
  keys.clear(); cam.spin=0;
  levelOpener=event.currentTarget;
  const list=$('level-list');
  const groupLabels=['基础练习','组合机关','移动目标','特别挑战'];
  list.replaceChildren(...THEMES.flatMap((theme,index) => {
    const button=document.createElement('button');
    const label=document.createElement('span'), number=document.createElement('b');
    number.textContent=String(index+1).padStart(2,'0'); label.textContent=theme.name;
    button.style.setProperty('--machine',theme.cab);
    button.append(number,label);
    button.onclick=()=>{closeLevelMenu(false);newGame(index+1,true);};
    if (index%5) return [button];
    const heading=document.createElement('strong');
    heading.className='level-group';
    heading.textContent=groupLabels[index/5];
    return [heading,button];
  }));
  levelMenu.hidden=false;
  $('level-close').focus();
  for (const panel of playPanels) panel.inert=true;
  hud();
}
$('open-levels').onclick=$('result-levels').onclick=openLevelMenu;
$('level-close').onclick=()=>closeLevelMenu();
levelMenu.addEventListener('keydown',e=>{
  if (e.key==='Escape') { e.preventDefault();closeLevelMenu(); }
});
$('gate').onclick=()=>{
  if (!over && !diving && claw.state==='idle') {
    if (M.theme.rule.shell) {
      if (M.challenge.gateOpen) resetShells(M);
      M.challenge.shellRunning=true;
      moveShells(M,0);
    }
  }
  toast(M.theme.hint,5);
};


// ---------------------------------------------------------------- frame
let last = performance.now();
function update(dt, nowMs) {
  const now = nowMs / 1000;
  if (cam.goal !== null) { let d = cam.goal - cam.az; d = Math.atan2(Math.sin(d), Math.cos(d)); cam.az += d * Math.min(1, dt * 5); if (Math.abs(d) < .002) cam.goal = null; }
  if (cam.elGoal !== null) { cam.el += (cam.elGoal - cam.el) * Math.min(1, dt * 5); if (Math.abs(cam.elGoal - cam.el) < .002) cam.elGoal = null; }
  if (cam.spin) cam.az += cam.spin * dt * 1.6;
  if (diving) { updateDive(dt); return; }
  const active = !over && shop.hidden && $('level-menu').hidden && claw.state==='idle';
  if (active) updateSpecial(dt);
  const piloting=claw.state==='deliver';
  positionChallenge(M,active || piloting ? dt : 0);
  if (active) {
    M.capsule.obj.updateMatrixWorld(true);
    for(const piece of [...M.bonusEggs,...M.challenge.shells])piece.obj.updateMatrixWorld(true);
  }
  if (M.theme.rule.shell || M.theme.rule.cool || M.theme.rule.seesaw) grabButton.disabled=!canLowerClaw();
  const ruleText = gateMessage(), ruleLabel = $('gate');
  if (ruleLabel.textContent!==ruleText) ruleLabel.textContent=ruleText;
  ruleLabel.toggleAttribute('data-ready',M.challenge.gateOpen);
  const kx = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
  const kz = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0);
  if ((kx || kz) && (claw.state==='idle' || piloting)) moveBy(kx * dt * 5, kz * dt * 5);
  let moving = 0;
  const isToolPickup = ['lid','key','hat'].includes(claw.target?.kind);
  if (claw.state==='idle' || claw.state==='carry' || piloting) {
    const automatic=claw.state==='carry';
    const gx=automatic?CHUTE.x:claw.tx, gz=automatic?CHUTE.z:claw.tz;
    const dx = gx - claw.x, dz = gz - claw.z, d = Math.hypot(dx, dz), st = Math.min(d,dt*(automatic?(isToolPickup?8:6):7));
    if (d>.001) {
      const nx=claw.x+dx/d*st,nz=claw.z+dz/d*st;
      if (piloting && blocksDelivery(nx,nz)) {
        claw.tx=claw.x; claw.tz=claw.z;
      } else {
        claw.x=nx; claw.z=nz; moving=Math.min(1,d*2); claw.wob+=st*1.5;
      }
    }
    const intoGoal=piloting && Math.hypot(claw.x-CHUTE.x,claw.z-CHUTE.z)<.82;
    if ((automatic && d<.02)||intoGoal) {
      if (intoGoal) {
        // Bring the egg down directly above the hatch once the player reaches its ring.
        claw.x=claw.tx=CHUTE.x; claw.z=claw.tz=CHUTE.z;
      }
      claw.state='release'; claw.t=0;
    }
  }
  if (claw.state === 'drop') { claw.y = Math.max(claw.stopY, claw.y - dt * 6); moving = .8; if (claw.y <= claw.stopY + .001) { claw.state = 'close'; claw.t = 0; } }
  else if (claw.state === 'close') { claw.t += dt; claw.open = Math.max(0, 1 - claw.t / .35); if (claw.t > .45) { closeGrab(); claw.state = 'lift'; } }
  else if (claw.state === 'lift') {
    claw.y = Math.min(TOP, claw.y + dt * (isToolPickup ? 6.1 : 4.6)); moving = .7;
    for (const o of [...claw.held]) if (o.slipAt && claw.y > o.slipAt) { claw.held.splice(claw.held.indexOf(o), 1); dropOne(o, true, o.kind === 'cover'); }
    if (claw.y >= TOP - .001) {
      // everything still in the claw rides to the prize chute, small filler included
      if (M.theme.rule.delivery && claw.held.includes(M.capsule)) {
        claw.state='deliver'; claw.tx=claw.x; claw.tz=claw.z;
        toast('拖动爪子，绕开挡杆，到绿圈会自动投放。',3.3);
        hud();
      } else if (claw.held.length) claw.state='carry'; else { claw.state = 'idle'; claw.open = 1; hud(); later(checkOver, 600); }
    }
  }
  else if (claw.state === 'release') {
    claw.t += dt; claw.open = Math.min(1, claw.t / .25);
    if (claw.t > .25 && claw.held.length) { for (const o of claw.held) dropOne(o, false); claw.held = []; }
    if (claw.t > .5) { claw.state = 'idle'; hud(); later(checkOver, 900); }
  }
  if (claw.state === 'idle' || claw.state === 'drop') claw.open = Math.min(1, claw.open + dt * 3);
  audio.hum(moving);
  const bump = M.challenge.delivery?.bump || 0;
  const sway = Math.sin(claw.wob*3)*Math.min(.12,claw.wob*.01)+Math.sin(bump*39)*bump*.55; claw.wob *= Math.pow(.2, dt);
  carriage.position.set(claw.x, 0, 0); trolley.position.set(claw.x, 0, claw.z);
  head.position.set(claw.x + sway, claw.y, claw.z); head.rotation.z = sway * .6;
  const len = 10.45 - claw.y; cable.scale.y = Math.max(.01, len); cable.position.set(claw.x + sway / 2, claw.y + len / 2, claw.z);
  prongs.forEach(pr => { pr.rotation.z = .08 + claw.open * .55; });
  const s = surface(claw.x, claw.z);
  const selected = claw.state==='idle' ? preciseTarget() : null;
  const locked = Boolean(selected);
  const color = locked ? '#42e289' : atCoolingPad() ? '#59e2ff' : '#fff8d4';
  aim.position.set(claw.x, Math.max(s.y, locked ? selected.obj.position.y + .95 : 0) + .07, claw.z);
  aimRim.position.copy(aim.position); aimRim.position.y -= .012;
  aim.material.color.set(color); laser.material.color.set(locked ? '#48e88c' : '#ff748d');
  aim.material.opacity = aimRim.material.opacity = claw.state === 'idle' ? .95 : .18;
  updateAimLabel();
  laser.position.set(claw.x, (s.y + claw.y - TIP) / 2, claw.z); laser.scale.y = Math.max(.01, claw.y - TIP - s.y); laser.visible = claw.state === 'idle';
  // falling pieces and things going down the chute
  let landed = false;
  for (const o of M.objects) {
    if (o.state === 'falling') {
      o.v -= 20 * dt; o.obj.position.y += o.v * dt; if (o.spin) o.obj.rotation.y += o.spin * dt;
      if (o.vx || o.vz) { o.obj.position.x += o.vx * dt; o.obj.position.z += o.vz * dt; }
      if (o.obj.position.y <= o.land) { o.obj.position.y = o.land; o.state = 'rest'; o.v = 0; o.vx = o.vz = 0; landed = true; if (o.kind !== 'cover') audio.tone([260, 200], .08, .05); }
    } else if (o.state === 'chute') {
      o.v -= 20 * dt; o.obj.position.y += o.v * dt; o.obj.scale.multiplyScalar(Math.pow(.6, dt));
      if (o.obj.position.y < -2.2) award(o);
    }
    if (o.halo) o.halo.material.opacity = .55 + Math.sin(now*4)*.3;
  }
  if (landed) settle();
  placeCamera();
}
let frozen = false;
const coldGuide = $('cool-guide');
const coldGuideText = $('cool-guide-text');
const coldGuideFill = $('cool-guide-fill');
const projectedGuide = new THREE.Vector3();
function drawCoolingGuide() {
  coldGuide.hidden = !M?.theme.rule.cool || claw.state!=='idle' || !shop.hidden ||
    !$('level-menu').hidden || over || !!diving;
  if (coldGuide.hidden) return;
  const {challenge,capsule}=M;
  const {x,z}=challenge.tiles[0];
  const onPad=atCoolingPad();
  const ready=challenge.unlockedFor>0 && (!onPad || challenge.charge>=1);
  const point=capsule.obj.position;
  if (ready) projectedGuide.set(point.x,point.y+2.10,point.z);
  else projectedGuide.set(x,.75,z);
  projectedGuide.project(camera);
  const w=canvas.clientWidth,h=canvas.clientHeight;
  coldGuide.style.left=clamp((projectedGuide.x+1)*w/2,63,w-63)+'px';
  coldGuide.style.top=clamp((1-projectedGuide.y)*h/2,128,h-63)+'px';
  const text=ready ? '② 移到金蛋上方' : onPad ? '冷却中…继续停住' : '① 移爪到蓝台';
  if (coldGuideText.textContent!==text) coldGuideText.textContent=text;
  coldGuide.toggleAttribute('data-ready',ready);
  coldGuideFill.style.transform='scaleX('+(ready? challenge.unlockedFor/coldTime : onPad ? challenge.charge : 0)+')';
}
const finaleGuide=$('finale-guide');
function drawFinaleGuide() {
  const balance=M?.challenge.balance;
  const carrying=claw.state==='deliver';
  const visible=(!over && !diving && shop.hidden && $('level-menu').hidden) &&
    ((balance && claw.state==='idle') || carrying);
  finaleGuide.hidden=!visible;
  if (!visible) return;
  let label;
  if (carrying) {
    projectedGuide.set(CHUTE.x,1.23,CHUTE.z);
    label='出奖口 · 拖到这里';
  } else if (balance.seated) {
    projectedGuide.set(balance.x,2.52,balance.z);
    label='已进槽 · 对准金蛋';
  } else {
    const nextEnd=balance.pos<0 ? 1 : -1;
    const nearNotch=Math.abs(balance.pos)<1.35;
    if (nearNotch) {
      projectedGuide.set(balance.x,1.8,balance.z);
      label='离开板端，让金蛋入槽';
    } else {
      projectedGuide.set(balance.x+nextEnd*3.53,1.24,balance.z);
      label=balance.pressure===nextEnd ? '滚近中间就移开爪子' : '移爪压这一端';
    }
  }
  projectedGuide.project(camera);
  const w=canvas.clientWidth,h=canvas.clientHeight;
  finaleGuide.style.left=clamp((projectedGuide.x+1)*w/2,73,w-73)+'px';
  finaleGuide.style.top=clamp((1-projectedGuide.y)*h/2,132,h-95)+'px';
  if(finaleGuide.textContent!==label)finaleGuide.textContent=label;
  finaleGuide.toggleAttribute('data-ready',carrying||Boolean(balance?.seated));
}
function frame(nowMs) {
  const dt = Math.min(.05, (nowMs - last) / 1000); last = nowMs;
  audio.musicTick();
  if (!frozen) update(dt, nowMs);
  renderer.render(scene, camera);
  if (diving) {
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(revealScene, camera);
    renderer.autoClear = true;
  }
  drawCoolingGuide();
  drawFinaleGuide();
  if (nowMs > toastUntil) $('clue').hidden = true;
  requestAnimationFrame(frame);
}
new ResizeObserver(resize).observe(canvas); resize();
newGame(cleared===totalLevels ? 1 : cleared+1,cleared===totalLevels);
if (new URLSearchParams(location.search).has('dev')) window.__nest = { claw, get M() { return M; }, startGrab, newGame, surface, advance(sec) { for (let t = 0; t < sec; t += 1 / 30) { update(1 / 30, performance.now() + t * 1000); scene.updateMatrixWorld(true); } }, state: () => ({ depth, tries, over, diving: !!diving, runPoints, cleared, replay }), dive: () => award(M.capsule), freeze(v) { frozen = v; } };
requestAnimationFrame(frame);
