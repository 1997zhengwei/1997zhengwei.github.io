// 程序化音效 + 迪斯科购物 BGM（WebAudio，无音频文件）。localStorage runway-muted=1 时完全不创建音频。
const MUTE_KEY = 'runway-muted';
function readMuted() { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } }

const MODES = {
  menu: {bpm: 104, kick: false, hat: .5, arp: false, stab: .7},
  shop: {bpm: 124, kick: true, hat: 1, arp: false, stab: 1},
  rush: {bpm: 142, kick: true, hat: 1, arp: true, stab: 1},
  runway: {bpm: 116, kick: true, hat: 1, arp: true, stab: .8, clap: true},
};
// Cmaj7 – Am7 – Fmaj7 – G6，每和弦一小节
const CHORDS = [
  {root: 65.41, notes: [261.63, 329.63, 392.0, 493.88]},
  {root: 55.0, notes: [220.0, 261.63, 329.63, 392.0]},
  {root: 43.65, notes: [174.61, 220.0, 261.63, 329.63]},
  {root: 49.0, notes: [196.0, 246.94, 293.66, 329.63]},
];

export function createAudio() {
  let ctx = null, master, sfxBus, musicBus, noiseBuf;
  let muted = readMuted();
  let mode = null, timer = null, step = 0, nextAt = 0;

  function ensure() {
    if (muted) return null;
    if (!ctx) {
      try { ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)(); } catch { return null; }
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = .85;
      master.connect(comp).connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1.15; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = .34; musicBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, {type = 'sine', vol = .2, at = 0, slide = 0, bus, attack = .006} = {}) {
    if (!ensure()) return;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, {vol = .2, at = 0, type = 'highpass', freq = 3000, to = 0, q = 1, bus} = {}) {
    if (!ensure()) return;
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f).connect(g).connect(bus || sfxBus);
    src.start(t, Math.random() * .5); src.stop(t + dur + .02);
  }

  const sfx = {
    tap() { tone(700, .07, {vol: .08}); },
    grab() { tone(560, .09, {type: 'triangle', slide: 1050, vol: .22}); tone(1400, .08, {at: .06, vol: .09}); },
    perfect() { [1047, 1319, 1568].forEach((f, i) => tone(f, .16, {type: 'triangle', at: i * .05, vol: .12})); },
    back() { tone(900, .1, {type: 'triangle', slide: 420, vol: .14}); },
    nope() { tone(220, .12, {type: 'square', vol: .06}); tone(180, .14, {type: 'square', at: .09, vol: .06}); },
    flash() { for (let i = 0; i < 2; i++) { tone(1175, .08, {type: 'square', at: i * .16, vol: .07}); tone(1568, .08, {type: 'square', at: i * .16 + .08, vol: .07}); } },
    flashGrab() { sfx.kaching(); [784, 988, 1175, 1568].forEach((f, i) => tone(f, .14, {type: 'triangle', at: .05 + i * .045, vol: .11})); },
    steal() { noise(.32, {type: 'bandpass', freq: 2400, to: 300, q: 2, vol: .35}); tone(330, .22, {type: 'sawtooth', slide: 140, vol: .05}); },
    tick(hi) { tone(hi ? 1760 : 1320, .04, {type: 'square', vol: .05}); },
    coupon() { [1319, 1760].forEach((f, i) => tone(f, .18, {at: i * .07, vol: .13})); },
    kaching() { noise(.08, {freq: 5000, vol: .25}); tone(2093, .35, {type: 'triangle', at: .03, vol: .14}); tone(2637, .4, {type: 'triangle', at: .07, vol: .1}); },
    line() { noise(.03, {freq: 6000, vol: .12}); tone(1100, .03, {type: 'square', vol: .03}); },
    stamp() { tone(120, .18, {slide: 50, vol: .45}); noise(.1, {type: 'lowpass', freq: 900, vol: .3}); },
    shutter() { noise(.05, {freq: 3500, vol: .3}); noise(.04, {freq: 2500, vol: .22, at: .07}); },
    star(i) { tone([1047, 1319, 1568][i] || 1568, .3, {type: 'triangle', vol: .16}); tone(([1047, 1319, 1568][i] || 1568) * 2, .25, {at: .04, vol: .05}); },
    win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .26, {type: 'triangle', at: i * .07, vol: .13})); },
    fail() { [392, 330, 262].forEach((f, i) => tone(f, .25, {type: 'triangle', at: i * .12, vol: .13})); },
    // 观众欢呼：一团人声噪音 + 稀疏掌声
    cheer(big) {
      noise(big ? 1.3 : .9, {type: 'bandpass', freq: 950, to: 1300, q: .8, vol: big ? .32 : .2});
      noise(big ? 1.1 : .7, {type: 'bandpass', freq: 2600, q: 1.5, vol: .08, at: .05});
      for (let i = 0; i < (big ? 14 : 8); i++) noise(.035, {freq: 1800 + Math.random() * 2000, vol: .12 + Math.random() * .1, at: Math.random() * (big ? 1.1 : .7)});
    },
    go() { tone(523, .12, {type: 'square', vol: .07}); tone(784, .12, {type: 'square', at: .1, vol: .07}); tone(1047, .3, {type: 'square', at: .2, vol: .08}); },
  };

  // ——音乐——
  function kick(t) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); o.connect(g).connect(musicBus); o.start(t); o.stop(t + .2); }
  function hat(t, vol) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500; const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); s.connect(f).connect(g).connect(musicBus); s.start(t, Math.random() * .5); s.stop(t + .06); }
  function clap(t) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; const g = ctx.createGain(); g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); s.connect(f).connect(g).connect(musicBus); s.start(t, Math.random() * .5); s.stop(t + .15); }
  function note(freq, t, dur, type, vol) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g).connect(musicBus); o.start(t); o.stop(t + dur + .02); }

  function schedule() {
    if (!ctx || !mode) return;
    const spec = MODES[mode];
    const sixteenth = 60 / spec.bpm / 4;
    while (nextAt < ctx.currentTime + .14) {
      const t = nextAt, s = step % 16, chord = CHORDS[Math.floor(step / 16) % 4];
      if (spec.kick && s % 4 === 0) kick(t);
      if (spec.clap && (s === 4 || s === 12)) clap(t);
      if (s % 4 === 2) hat(t, .22 * spec.hat);
      else if (spec.hat >= 1 && s % 2 === 1) hat(t, .07);
      if (s % 2 === 0) note(chord.root * (s % 4 === 2 ? 2 : 1), t, sixteenth * 1.7, 'triangle', .38);
      if (s % 4 === 2 || s === 15) chord.notes.slice(0, 3).forEach(f => note(f, t, sixteenth * 1.5, 'square', .028 * spec.stab));
      if (spec.arp) note(chord.notes[[0, 1, 2, 3, 2, 1][step % 6]] * 2, t, sixteenth * .9, 'triangle', .05);
      if (s === 0 && Math.floor(step / 16) % 2 === 0) note(chord.notes[3] * 2, t, sixteenth * 6, 'sine', .05);
      nextAt += sixteenth;
      step++;
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
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* 无痕模式 */ }
    if (muted) { clearInterval(timer); timer = null; if (ctx) ctx.suspend().catch(() => {}); }
    else { ensure(); const m = mode; mode = null; setMode(m); }
    return !muted;
  }
  return {sfx, setMode, toggle, unlock: ensure, get muted() { return muted; }};
}
