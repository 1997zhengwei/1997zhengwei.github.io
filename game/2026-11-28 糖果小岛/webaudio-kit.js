// webaudio-kit.js —— 小游戏通用程序化音效 + 背景音乐（ES module，零音频文件）。
// 来源：100块穿上T台、黑五福袋等项目里验证过的实现，复制到游戏目录后按需删减。
//
// 用法：
//   import {createAudio} from './webaudio-kit.js';
//   const audio = createAudio({muteKey: 'mygame-muted'});
//   document.addEventListener('pointerdown', () => { audio.unlock(); audio.setMode('game'); }, {once: true});
//   audio.sfx.grab(); audio.sfx.drop(4.5, true); audio.setMode('rush');
//   muteButton.onclick = () => muteButton.setAttribute('aria-pressed', String(audio.toggle()));
//
// 静默测试：localStorage[muteKey]='1' 时完全不创建 AudioContext；
// 要验证有输出，可把 window.AudioContext 临时替换为 OfflineAudioContext，触发音效后 startRendering() 算 RMS。

const MODES = {
  menu: {bpm: 92, kick: false, hat: .5, arp: false, stab: .7, lead: true},
  game: {bpm: 108, kick: true, hat: 1, arp: false, stab: 1, lead: true},
  rush: {bpm: 140, kick: true, hat: 1, arp: true, stab: 1, lead: false},   // 最后 10 秒
  show: {bpm: 116, kick: true, hat: 1, arp: true, stab: .8, clap: true},   // 走秀/结算展示
  calm: {bpm: 76, kick: false, hat: .25, arp: false, stab: .55, lead: true}, // 纯解压：慢、轻、没有鼓
};
// Cmaj7 – Am7 – Fmaj7 – G6，每和弦一小节
const CHORDS = [
  {root: 65.41, notes: [261.63, 329.63, 392.0, 493.88]},
  {root: 55.0, notes: [220.0, 261.63, 329.63, 392.0]},
  {root: 43.65, notes: [174.61, 220.0, 261.63, 329.63]},
  {root: 49.0, notes: [196.0, 246.94, 293.66, 329.63]},
];

export function createAudio({muteKey = 'game-muted', sfxVolume = 1.1, musicVolume = .3} = {}) {
  const readMuted = () => { try { return localStorage.getItem(muteKey) === '1'; } catch { return false; } };
  let muted = readMuted();
  let ctx = null, master, sfxBus, musicBus, noiseBuf, reverb;
  let mode = null, timer = null, step = 0, nextAt = 0;

  function ensure() {
    if (muted) return null;
    if (!ctx) {
      try { ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)(); } catch { return null; }
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = .85; master.connect(comp).connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = sfxVolume; sfxBus.connect(master);
      const musicLP = ctx.createBiquadFilter(); musicLP.type = 'lowpass'; musicLP.frequency.value = 2400; musicLP.Q.value = .4;
      musicBus = ctx.createGain(); musicBus.gain.value = musicVolume; musicBus.connect(musicLP).connect(master);
      // 小房间混响：让糖壳碎裂有空间感（ASMR 关键）
      reverb = ctx.createConvolver();
      const irLen = Math.floor(ctx.sampleRate * 1.6), ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 3.4); }
      reverb.buffer = ir;
      const wet = ctx.createGain(); wet.gain.value = .38; reverb.connect(wet).connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  function tone(freq, dur, {type = 'sine', vol = .2, at = 0, slide = 0, bus, wet = 0} = {}) {
    if (!ensure()) return;
    const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(bus || sfxBus); o.start(t); o.stop(t + dur + .02);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(reverb); }
  }
  function noise(dur, {vol = .2, at = 0, type = 'highpass', freq = 3000, to = 0, q = 1, bus, wet = 0} = {}) {
    if (!ensure()) return;
    const t = ctx.currentTime + at, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f).connect(g).connect(bus || sfxBus); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(reverb); }
  }
  // 细碎“噼啪”：一串极短带通噪声颗粒 = 糖壳碎裂的 ASMR 质感
  function crunch(n, {bright = 1, vol = .2, spread = .012, at = 0, wet = .2} = {}) {
    let t = at;
    for (let i = 0; i < n; i++) {
      noise(.008 + Math.random() * .02, {type: 'bandpass', freq: (2200 + Math.random() * 5200) * bright, q: 2.5 + Math.random() * 5, vol: vol * (.5 + Math.random() * .7), at: t, wet});
      t += spread * (.4 + Math.random() * 1.2);
    }
  }
  // 玻璃糖“叮”：非谐波分音 + 混响尾巴
  function glass(f, {vol = .05, at = 0, dur = .32, wet = .55} = {}) {
    [1, 2.76, 5.4].forEach((m, i) => tone(f * m, dur / (1 + i * .6), {vol: vol / (1 + i * 1.3), at, wet}));
  }

  // 连续噪声环（撕膜的"嘶——"）：set(音量, 频率) 每帧调，stop() 淡出
  function loop({type = 'bandpass', freq = 1800, q = .9, wetAmt = .25} = {}) {
    let src = null, f = null, g = null;
    return {
      set(level, fq) {
        if (!ensure()) return;
        if (!src) {
          src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
          f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
          g = ctx.createGain(); g.gain.value = 0;
          src.connect(f).connect(g).connect(sfxBus);
          const w = ctx.createGain(); w.gain.value = wetAmt; g.connect(w).connect(reverb);
          src.start();
        }
        g.gain.setTargetAtTime(Math.max(0, level), ctx.currentTime, .035);
        if (fq) f.frequency.setTargetAtTime(fq, ctx.currentTime, .05);
      },
      stop() {
        if (!src || !ctx) return;
        const s = src; g.gain.setTargetAtTime(0, ctx.currentTime, .05);
        setTimeout(() => { try { s.stop(); } catch {} }, 400);
        src = null;
      },
    };
  }

  // ——音效库：名字按「玩家事件」起，接线时一一对应——
  const sfx = {
    tap() { tone(700, .07, {vol: .08}); },
    grab() { tone(560, .09, {type: 'triangle', slide: 1050, vol: .22}); tone(1400, .08, {at: .06, vol: .09}); },
    back() { tone(900, .1, {type: 'triangle', slide: 420, vol: .14}); },
    nope() { tone(220, .12, {type: 'square', vol: .06}); tone(180, .14, {type: 'square', at: .09, vol: .06}); },
    perfect() { [1047, 1319, 1568].forEach((f, i) => tone(f, .16, {type: 'triangle', at: i * .05, vol: .12})); },
    rotate() { noise(.12, {type: 'bandpass', freq: 900, to: 2600, q: 2, vol: .18}); },
    // 落地：越重越闷越响；soft=true 加一声「噗」
    drop(weight = 2, soft = false) {
      const w = Math.min(7, weight);
      tone(150 - w * 9, .16 + w * .02, {slide: 55, vol: .18 + w * .05});
      noise(.08 + w * .015, {type: 'lowpass', freq: 500 + (7 - w) * 120, vol: .15 + w * .04});
      if (soft) noise(.12, {type: 'bandpass', freq: 700, q: .8, vol: .12, at: .02});
    },
    shatter() { noise(.07, {type: 'lowpass', freq: 600, vol: .3}); noise(.35, {freq: 4500, vol: .22, at: .02}); for (let i = 0; i < 6; i++) tone(2400 + Math.random() * 2600, .09, {type: 'triangle', vol: .05, at: .03 + i * .035}); },
    alarm() { for (let i = 0; i < 2; i++) { tone(1175, .08, {type: 'square', at: i * .16, vol: .07}); tone(1568, .08, {type: 'square', at: i * .16 + .08, vol: .07}); } },
    steal() { noise(.32, {type: 'bandpass', freq: 2400, to: 300, q: 2, vol: .35}); tone(330, .22, {type: 'sawtooth', slide: 140, vol: .05}); },
    tick(urgent) { tone(urgent ? 1760 : 1320, .04, {type: 'square', vol: .05}); },
    coupon() { [1319, 1760].forEach((f, i) => tone(f, .18, {at: i * .07, vol: .13})); },
    kaching() { noise(.08, {freq: 5000, vol: .25}); tone(2093, .35, {type: 'triangle', at: .03, vol: .14}); tone(2637, .4, {type: 'triangle', at: .07, vol: .1}); },
    line() { noise(.03, {freq: 6000, vol: .1}); tone(1100, .03, {type: 'square', vol: .03}); },
    stamp() { tone(120, .18, {slide: 50, vol: .45}); noise(.1, {type: 'lowpass', freq: 900, vol: .3}); },
    shutter() { noise(.05, {freq: 3500, vol: .3}); noise(.04, {freq: 2500, vol: .22, at: .07}); },
    gift() { [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, .22, {type: 'triangle', vol: .1, at: i * .06})); },
    cheer(big) { noise(big ? 1.3 : .9, {type: 'bandpass', freq: 950, to: 1300, q: .8, vol: big ? .32 : .2}); for (let i = 0; i < (big ? 14 : 8); i++) noise(.035, {freq: 1800 + Math.random() * 2000, vol: .15, at: Math.random() * (big ? 1.1 : .7)}); },
    star(i) { const f = [1047, 1319, 1568][i] || 1568; tone(f, .3, {type: 'triangle', vol: .16}); tone(f * 2, .25, {at: .04, vol: .05}); },
    win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .26, {type: 'triangle', at: i * .07, vol: .13})); },
    fail() { [392, 330, 262].forEach((f, i) => tone(f, .25, {type: 'triangle', at: i * .12, vol: .13})); },
    go() { tone(523, .12, {type: 'square', vol: .07}); tone(784, .12, {type: 'square', at: .1, vol: .07}); tone(1047, .3, {type: 'square', at: .2, vol: .08}); },
    // —— ASMR 糖壳专属音效 ——
    hammerTock() {
      tone(230, .08, {slide: 120, vol: .3});
      noise(.035, {type: 'bandpass', freq: 1100, q: 1.4, vol: .22});
      tone(720, .035, {type: 'triangle', vol: .05});
    },
    pickTing() {
      tone(4600, .1, {slide: 5400, vol: .06, wet: .35});
      noise(.018, {type: 'highpass', freq: 7500, vol: .09});
    },
    crackLight() { crunch(4, {vol: .16}); },
    crackHeavy() {
      crunch(7, {bright: .75, vol: .22, spread: .01});
      tone(1300, .12, {type: 'triangle', slide: 760, vol: .04, at: .01});
      glass(2100, {vol: .035, at: .02, dur: .25});
    },
    peelPop(combo = 0, soft = false) {
      const up = Math.min(10, combo) * .045;
      if (soft) {
        noise(.14, {type: 'bandpass', freq: 2600, to: 5200, q: 1.2, vol: .14, wet: .2});
        tone(880 * (1 + up), .12, {slide: 1320 * (1 + up), vol: .12, at: .02});
        glass(3300 * (1 + up), {vol: .04, at: .05});
      } else {
        crunch(9, {vol: .24, spread: .009});
        tone(620 * (1 + up), .09, {slide: 980 * (1 + up), vol: .13, at: .01});
        noise(.3, {type: 'highpass', freq: 6500, vol: .05, at: .03, wet: .3});
      }
    },
    shardBurst(combo = 0, quiet = false) {
      const up = Math.min(10, combo) * .05;
      crunch(quiet ? 3 : 6, {vol: quiet ? .12 : .18, at: .005});
      glass((2600 + Math.random() * 900) * (1 + up), {vol: quiet ? .025 : .045, at: .02});
    },
    tinkle(size = .1, vol = 1) {
      const f = (2400 + Math.random() * 2600) * Math.max(.7, Math.min(1.6, .16 / Math.max(.04, size)));
      glass(f, {vol: .035 * vol + .01, dur: .22 + Math.random() * .15, wet: .5});
    },
    landShatter() {
      crunch(8, {vol: .16, spread: .007, bright: 1.1});
      glass(3100 + Math.random() * 800, {vol: .04});
    },
    landThump() {
      tone(140, .14, {slide: 70, vol: .22});
      noise(.06, {type: 'lowpass', freq: 600, vol: .12});
    },
    boop() {
      tone(300, .14, {slide: 470, vol: .12});
      tone(150, .1, {vol: .07});
    },
    chainShatter() {
      tone(130, .22, {slide: 48, vol: .28});
      noise(.12, {type: 'lowpass', freq: 900, vol: .2});
      crunch(18, {vol: .2, spread: .016, wet: .3});
      for (let i = 0; i < 6; i++) glass(2200 + i * 380 + Math.random() * 200, {vol: .03, at: .04 + i * .05});
      noise(.6, {type: 'highpass', freq: 7000, vol: .05, at: .05, wet: .4});
    },
    bellRing() {
      [1568, 1976, 2349, 3136].forEach((f, i) => glass(f, {vol: .06, at: i * .04, dur: .9, wet: .7}));
      tone(110, .4, {slide: 55, vol: .22});
    },
    bruiseSquish() {
      noise(.24, {type: 'lowpass', freq: 1500, to: 260, q: 2, vol: .36});
      tone(160, .2, {slide: 70, vol: .26});
      tone(240, .14, {type: 'sawtooth', slide: 120, vol: .03, at: .02});
      for (let i = 0; i < 3; i++) tone(520 + Math.random() * 300, .06, {slide: 1100, vol: .06, at: .14 + i * .07, wet: .3});
    },
    bounce() {
      tone(1900, .07, {type: 'triangle', slide: 2600, vol: .08});
      glass(4200, {vol: .03, dur: .15});
    },
    clearChime() {
      [1047, 1319, 1568, 2093].forEach((f, i) => { tone(f, .5, {at: i * .07, vol: .085, wet: .6}); tone(f * 2.01, .3, {at: i * .07, vol: .022, wet: .6}); });
    },
    // —— 一笔连剥：五声音阶，越连越高 ——
    selectNote(k = 0) {
      const scale = [523, 587, 659, 784, 880];
      const f = scale[k % 5] * Math.pow(2, Math.floor(k / 5));
      tone(f, .09, {type: 'triangle', vol: .07});
      glass(f * 2, {vol: .02, dur: .14, wet: .3});
      noise(.012, {type: 'bandpass', freq: 6000, q: 4, vol: .06});
    },
    chainNote(k = 0) {
      const scale = [523, 587, 659, 784, 880];
      const f = scale[k % 5] * Math.pow(2, Math.floor(k / 5));
      crunch(4, {vol: .16, spread: .007});
      glass(f * 2, {vol: .05, dur: .35, wet: .5});
      tone(f, .16, {vol: .06, wet: .3});
    },
    burstChord() {
      tone(98, .5, {slide: 49, vol: .3});
      noise(.18, {type: 'lowpass', freq: 1200, vol: .26});
      crunch(26, {vol: .2, spread: .012, wet: .35});
      [1047, 1319, 1568, 2093, 2637].forEach((f, i) => glass(f, {vol: .05, at: .05 + i * .045, dur: .7, wet: .7}));
      noise(.9, {type: 'highpass', freq: 7000, vol: .06, at: .1, wet: .5});
    },
    // —— 一笔圈住 ——
    lassoSnap(pure = false) {   // 圈闭合的一瞬
      const fs = pure ? [1568, 2093, 2637, 3136] : [1319, 1760, 2349];
      fs.forEach((f, i) => glass(f, {vol: .05, at: i * .035, dur: .45, wet: .6}));
      tone(660, .16, {type: 'triangle', slide: 1320, vol: .05});
      noise(.06, {type: 'bandpass', freq: 4200, to: 9000, q: 3, vol: .05});
    },
    lassoNote(k = 0, pure = false) {
      const scale = pure ? [784, 880, 1047, 1175, 1319] : [659, 784, 880, 988, 1175];
      const f = scale[k % 5] * (k >= 5 ? 2 : 1);
      crunch(3, {vol: .15, spread: .006});
      glass(f * 2, {vol: .045, dur: .3, wet: .5});
    },
    lassoFinish(big = false) {
      tone(140, .4, {slide: 62, vol: .26});
      noise(.32, {type: 'bandpass', freq: 600, to: 5200, q: 1.5, vol: .14, wet: .4});
      crunch(big ? 22 : 12, {vol: .18, spread: .011, wet: .35});
      const ch = big ? [1047, 1319, 1568, 2093, 2637] : [1175, 1568, 2093];
      ch.forEach((f, i) => glass(f, {vol: .05, at: .06 + i * .045, dur: .7, wet: .7}));
    },
    starDing(i = 0) {   // 剥完一颗：星星一颗颗亮起
      const f = [1319, 1568, 2093][i] || 2093;
      glass(f, {vol: .07, dur: .6, wet: .65});
      tone(f / 2, .25, {type: 'triangle', vol: .06, wet: .4});
      if (i === 2) [2637, 3136].forEach((g, k) => glass(g, {vol: .04, at: .08 + k * .06, dur: .7, wet: .7}));
    },
    starLose() {        // 超过门槛：轻轻"叮咚"往下，不刺耳
      tone(1175, .14, {type: 'triangle', vol: .04, wet: .3});
      tone(880, .2, {type: 'triangle', vol: .035, at: .09, wet: .3});
    },
    lassoGain() {
      glass(2349, {vol: .04, dur: .3});
      glass(3136, {vol: .035, at: .07, dur: .35});
    },
    geodeCrack(level = 1) {
      tone(180 - level * 15, .1, {slide: 80, vol: .3});
      crunch(5 + level * 3, {bright: .7 + level * .1, vol: .22, spread: .01});
      glass(1500 + level * 400, {vol: .03, at: .02});
    },
    geodeOpen(rarity = 0) {
      tone(80, .6, {slide: 40, vol: .32});
      crunch(30, {vol: .22, spread: .01, wet: .4});
      const notes = rarity >= 2 ? [784, 988, 1175, 1568, 1976, 2349, 3136] : rarity === 1 ? [880, 1109, 1319, 1760, 2217] : [1047, 1319, 1568, 2093];
      notes.forEach((f, i) => { glass(f, {vol: .06, at: .25 + i * .07, dur: .9, wet: .75}); tone(f / 2, .4, {at: .25 + i * .07, vol: .04, wet: .5}); });
    },
    // —— v5 纯解压 ——
    swipeCrack(k = 0, fast = .5) {   // 快划：指尖下当场"咔"，越快越密越脆；同一笔里音高慢慢往上走
      const scale = [523, 587, 659, 784, 880];
      const f = scale[k % 5] * Math.pow(2, Math.min(2, Math.floor(k / 5)));
      crunch(3 + Math.round(fast * 5), {vol: .13 + fast * .07, spread: .005 + (1 - fast) * .004, bright: .9 + fast * .35, wet: .22});
      glass(f * 2, {vol: .028, dur: .26, wet: .5});
      noise(.03, {type: 'highpass', freq: 5200, vol: .05 + fast * .05});
    },
    peelJoin(k = 0) {                // 慢拉：又一块被揭起来，黏黏的"啵"
      noise(.03, {type: 'bandpass', freq: 2400 + Math.random() * 1400, q: 3, vol: .1});
      tone(380 + Math.min(12, k) * 18, .07, {type: 'triangle', slide: 620 + Math.min(12, k) * 22, vol: .045});
      crunch(2, {vol: .06, bright: .55, spread: .01});
    },
    crackle(v = .5) { crunch(1, {vol: .05 + v * .06, bright: .5 + Math.random() * .3, wet: .15}); },
    sheetRip(n = 1) {                // 整片揭下来：拉长的"嘶啦——啵"
      const big = Math.min(1, n / 14);
      noise(.28 + big * .3, {type: 'bandpass', freq: 3800, to: 900, q: 1.1, vol: .16 + big * .1, wet: .3});
      crunch(8 + Math.round(big * 14), {vol: .1, bright: .6, spread: .014});
      tone(300, .14, {slide: 820 + big * 400, vol: .12, at: .05});
      glass(2600 + big * 600, {vol: .035, at: .1, dur: .4});
    },
    sheetLand(n = 1) {               // 整片掉在盘子上摔开：一阵哗啦
      const big = Math.min(1, n / 14);
      tone(150, .16, {slide: 70, vol: .14 + big * .1});
      crunch(10 + Math.round(big * 18), {vol: .16, spread: .009, bright: 1.05, wet: .35});
      for (let i = 0; i < 3 + Math.round(big * 6); i++) glass(2400 + Math.random() * 2800, {vol: .03, at: .02 + i * .035 + Math.random() * .02, dur: .3, wet: .55});
    },
    pileTouch(n = 1) {               // 手指扒拉盘里的碎糖
      crunch(Math.min(7, 2 + n), {vol: .09, bright: 1.25, spread: .008, wet: .3});
      if (n > 2) glass(3200 + Math.random() * 1800, {vol: .02, dur: .2});
    },
    bite(k = 1) {                    // "咔嚓"一口 + 爆汁
      tone(190 - k * 10, .12, {slide: 85, vol: .26});
      crunch(12, {bright: .8, vol: .2, spread: .006, wet: .2});
      noise(.26, {type: 'lowpass', freq: 1900, to: 380, q: 3, vol: .26, at: .04});
      for (let i = 0; i < 3; i++) tone(560 + Math.random() * 380, .07, {slide: 1100 + Math.random() * 300, vol: .05, at: .12 + i * .07, wet: .35});
    },
    sprout() { tone(220, .28, {type: 'triangle', slide: 520, vol: .1, wet: .3}); noise(.18, {type: 'bandpass', freq: 900, to: 2600, q: 1.2, vol: .06}); },
    crystallize(k = 0) {             // 糖壳一块块结晶回来：轻轻往上走的玻璃音
      const scale = [784, 880, 988, 1175, 1319, 1568, 1760, 1976, 2349];
      glass(scale[k % 9] * (k >= 9 ? 2 : 1), {vol: .03, dur: .35, wet: .6});
      noise(.02, {type: 'bandpass', freq: 6800, q: 4, vol: .035});
    },
    yum() { [784, 988, 1175, 1568].forEach((f, i) => { tone(f, .3, {type: 'triangle', at: i * .07, vol: .07, wet: .5}); }); },
    pourTink(i = 0) { glass(2200 + Math.random() * 3200, {vol: .022, dur: .2 + Math.random() * .12, wet: .55}); if (i % 3 === 0) crunch(2, {vol: .05, bright: 1.3}); },
    pourStart() { noise(1.1, {type: 'bandpass', freq: 5200, to: 2600, q: .7, vol: .07, wet: .45}); },
    jarFull() { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => glass(f, {vol: .06, at: i * .07, dur: .8, wet: .7})); tone(262, .5, {type: 'triangle', vol: .08, wet: .5}); },
    toolSwitch(isHammer) {
      if (isHammer) tone(220, .07, {type: 'triangle', slide: 150, vol: .15});
      else tone(1250, .07, {type: 'sine', slide: 1680, vol: .12});
    },
  };

  // ——背景音乐：16 分音符排程——
  function kick(t) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); o.connect(g).connect(musicBus); o.start(t); o.stop(t + .2); }
  function hat(t, vol) { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7500; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); s.connect(f).connect(g).connect(musicBus); s.start(t, Math.random() * .5); s.stop(t + .06); }
  function clap(t) { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = 1500; g.gain.setValueAtTime(.45, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); s.connect(f).connect(g).connect(musicBus); s.start(t, Math.random() * .5); s.stop(t + .15); }
  function note(freq, t, dur, type, vol) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g).connect(musicBus); o.start(t); o.stop(t + dur + .02); }
  function schedule() {
    if (!ctx || !mode) return;
    const spec = MODES[mode], sixteenth = 60 / spec.bpm / 4;
    while (nextAt < ctx.currentTime + .14) {
      const t = nextAt, s = step % 16, chord = CHORDS[Math.floor(step / 16) % 4];
      if (spec.kick && s % 4 === 0) kick(t);
      if (spec.clap && (s === 4 || s === 12)) clap(t);
      if (s % 4 === 2) hat(t, .12 * spec.hat); else if (spec.hat >= 1 && s % 2 === 1) hat(t, .035);
      if (s % 2 === 0) note(chord.root * (s % 4 === 2 ? 2 : 1), t, sixteenth * 1.7, 'triangle', .36);
      if (s % 4 === 2 || s === 15) chord.notes.slice(0, 3).forEach(f => note(f, t, sixteenth * 2.2, 'triangle', .03 * spec.stab));
      if (spec.arp) note(chord.notes[[0, 1, 2, 3, 2, 1][step % 6]] * 2, t, sixteenth * .9, 'triangle', .05);
      if (spec.lead && s === 0 && Math.floor(step / 16) % 2 === 0) note(chord.notes[3] * 2, t, sixteenth * 6, 'sine', .05);
      nextAt += sixteenth; step++;
    }
  }
  function setMode(next) {
    mode = next;
    if (!mode) { clearInterval(timer); timer = null; return; }
    if (!ensure()) return;
    if (!timer) { nextAt = ctx.currentTime + .05; timer = setInterval(schedule, 25); }
  }
  function toggle() {
    muted = !muted;
    try { localStorage.setItem(muteKey, muted ? '1' : '0'); } catch { /* 无痕模式 */ }
    if (muted) { clearInterval(timer); timer = null; if (ctx) ctx.suspend().catch(() => {}); }
    else { ensure(); const m = mode; mode = null; setMode(m); }
    return !muted;
  }
  return {sfx, tone, noise, loop, setMode, toggle, unlock: ensure, get muted() { return muted; }};
}
