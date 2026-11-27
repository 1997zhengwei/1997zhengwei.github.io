// 程序化音效 + 轻快的商场背景乐（WebAudio，无音频文件）。静音时完全不创建音频。
const CHORDS = [
  {root: 65.41, notes: [261.63, 329.63, 392.0, 493.88]},   // Cmaj7
  {root: 55.0, notes: [220.0, 261.63, 329.63, 392.0]},     // Am7
  {root: 43.65, notes: [174.61, 220.0, 261.63, 329.63]},   // Fmaj7
  {root: 49.0, notes: [196.0, 246.94, 293.66, 349.23]},    // G7
];
const MELODY = [0, 2, 1, 3, 2, 1, 0, -1]; // 每两拍一个音，-1 休止

export function createAudio(isMuted) {
  let ctx = null, master, sfxBus, musicBus, noiseBuf, timer = null, step = 0, nextAt = 0, playing = false;

  function ensure() {
    if (isMuted()) return null;
    if (!ctx) {
      try { ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)(); } catch { return null; }
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = .85; master.connect(comp).connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1.1; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = .26; musicBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  function tone(freq, dur, {type = 'sine', vol = .2, at = 0, slide = 0, bus} = {}) {
    if (!ensure()) return;
    const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(bus || sfxBus); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, {vol = .2, at = 0, type = 'highpass', freq = 3000, to = 0, q = 1, bus} = {}) {
    if (!ensure()) return;
    const t = ctx.currentTime + at, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f).connect(g).connect(bus || sfxBus); src.start(t, Math.random() * .5); src.stop(t + dur + .02);
  }

  const sfx = {
    pick() { tone(880, .05, {vol: .07}); },
    rotate() { noise(.12, {type: 'bandpass', freq: 900, to: 2600, q: 2, vol: .18}); tone(520, .08, {type: 'triangle', slide: 700, vol: .05}); },
    // 落袋：越重越闷、越响；软包装多一声「噗」
    drop(weight = 2, soft = false) {
      const w = Math.min(7, weight);
      tone(150 - w * 9, .16 + w * .02, {slide: 55, vol: .18 + w * .05});
      noise(.08 + w * .015, {type: 'lowpass', freq: 500 + (7 - w) * 120, vol: .15 + w * .04});
      if (soft) noise(.12, {type: 'bandpass', freq: 700, q: .8, vol: .12, at: .02});
      else tone(330 - w * 18, .06, {type: 'triangle', vol: .05, at: .01});
    },
    // 压碎：一下闷响 + 一串玻璃碎片
    break() {
      noise(.07, {type: 'lowpass', freq: 600, vol: .3});
      noise(.35, {freq: 4500, vol: .22, at: .02});
      for (let i = 0; i < 6; i++) tone(2400 + Math.random() * 2600, .09, {type: 'triangle', vol: .05, at: .03 + i * .035});
    },
    back() { tone(700, .1, {type: 'triangle', slide: 380, vol: .12}); },
    nope() { tone(220, .1, {type: 'square', vol: .05}); tone(180, .12, {type: 'square', vol: .05, at: .08}); },
    line() { tone(1320, .04, {type: 'square', vol: .035}); noise(.03, {freq: 6000, vol: .08}); },
    kaching() { noise(.08, {freq: 5000, vol: .25}); tone(2093, .35, {type: 'triangle', vol: .14, at: .03}); tone(2637, .4, {type: 'triangle', vol: .1, at: .07}); },
    gift() { [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, .22, {type: 'triangle', vol: .1, at: i * .06})); noise(.4, {freq: 7000, vol: .06, at: .1}); },
    stamp() { tone(120, .18, {slide: 50, vol: .45}); noise(.1, {type: 'lowpass', freq: 900, vol: .3}); },
    star(i) { const f = [1047, 1319, 1568][i] || 1568; tone(f, .3, {type: 'triangle', vol: .16}); tone(f * 2, .25, {vol: .05, at: .04}); },
    win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .26, {type: 'triangle', vol: .13, at: i * .07})); },
    fail() { [392, 330, 262].forEach((f, i) => tone(f, .25, {type: 'triangle', vol: .12, at: i * .12})); },
  };

  // ——背景乐：100 BPM，轻鼓 + 低音 + 钢琴感和弦 + 简单旋律——
  function note(freq, t, dur, type, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(musicBus); o.start(t); o.stop(t + dur + .02);
  }
  function kick(t) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(g).connect(musicBus); o.start(t); o.stop(t + .18); }
  function hat(t, vol) { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 8000; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .04); s.connect(f).connect(g).connect(musicBus); s.start(t, Math.random() * .5); s.stop(t + .05); }
  function schedule() {
    if (!ctx || !playing) return;
    const eighth = 60 / 100 / 2;
    while (nextAt < ctx.currentTime + .15) {
      const t = nextAt, s = step % 8, chord = CHORDS[Math.floor(step / 8) % 4];
      if (s === 0 || s === 4) kick(t);
      if (s % 2 === 1) hat(t, .08);
      if (s % 2 === 0) note(chord.root * (s % 4 === 2 ? 2 : 1), t, eighth * 1.8, 'triangle', .3);
      if (s === 2 || s === 6) chord.notes.slice(0, 3).forEach(f => note(f, t, eighth * 1.6, 'sine', .07));
      if (s % 2 === 0) { const m = MELODY[(step / 2) % MELODY.length | 0]; if (m >= 0 && Math.floor(step / 32) % 2 === 1) note(chord.notes[m] * 2, t, eighth * 1.7, 'triangle', .05); }
      nextAt += eighth; step++;
    }
  }
  function music(on) {
    playing = on && !isMuted();
    if (!playing) { clearInterval(timer); timer = null; return; }
    if (!ensure()) return;
    if (!timer) { nextAt = ctx.currentTime + .05; timer = setInterval(schedule, 30); }
  }
  function muteChanged() {
    if (isMuted()) { music(false); if (ctx) ctx.suspend().catch(() => {}); }
    else { ensure(); music(true); }
  }
  return {sfx, music, muteChanged, unlock: ensure};
}
