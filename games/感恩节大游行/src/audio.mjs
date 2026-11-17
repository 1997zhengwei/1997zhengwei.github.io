// Web Audio 合成：音效 + 游行鼓点
let ctx = null, master = null, musicGain = null;
let enabled = true;
let musicTimer = 0, nextBeat = 0, beatIndex = 0;

export function setSound(on) { enabled = on; if (master) master.gain.value = on ? 0.5 : 0; }
export function soundOn() { return enabled; }
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = enabled ? 0.5 : 0; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, { type = 'sine', vol = 0.3, delay = 0, slide = 0, out, at } = {}) {
  if (!ctx) return;
  const t = at ?? ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(out || master); o.start(t); o.stop(t + dur + 0.05);
}
let noiseBuf = null;
function noise(dur, { vol = 0.3, delay = 0, freq = 1200, q = 1, type = 'bandpass', out, at } = {}) {
  if (!ctx) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = at ?? ctx.currentTime + delay;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(out || master); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
}

export const sfx = {
  star(n = 0) { tone(1046 * Math.pow(1.06, n % 6), 0.18, { type: 'triangle', vol: 0.16 }); tone(1568, 0.22, { vol: 0.08, delay: 0.04 }); },
  hit() { noise(0.6, { vol: 0.5, freq: 3000, q: 0.5, type: 'highpass' }); tone(220, 0.35, { type: 'sawtooth', vol: 0.15, slide: 0.5 }); },
  trip() { tone(300, 0.25, { type: 'square', vol: 0.1, slide: 0.5 }); noise(0.25, { vol: 0.3, freq: 500, type: 'lowpass' }); },
  cheer() { noise(0.9, { vol: 0.25, freq: 1400, q: 0.4 }); [659, 784, 988].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.12, delay: i * 0.07 })); },
  pump() { [0, 0.12, 0.24].forEach((d) => noise(0.12, { vol: 0.35, freq: 1800, q: 1.5, delay: d })); tone(523, 0.3, { vol: 0.12, delay: 0.3 }); },
  gust() { noise(1.2, { vol: 0.22, freq: 600, q: 0.3 }); },
  pull() { tone(200, 0.12, { type: 'triangle', vol: 0.08, slide: 0.7 }); },
  win() { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.45, { type: 'triangle', vol: 0.15, delay: i * 0.09 })); noise(1.4, { vol: 0.2, freq: 2000, q: 0.4, delay: 0.3 }); },
  lose() { tone(600, 1.1, { type: 'sawtooth', vol: 0.12, slide: 0.15 }); noise(1.0, { vol: 0.3, freq: 2500, type: 'highpass' }); },
  click() { tone(700, 0.06, { type: 'triangle', vol: 0.12 }); },
};

// 游行鼓点：大鼓/小军鼓/镲 + 低音铜管
const BASS = [196, 196, 262, 262, 220, 220, 247, 294];
function scheduleMusic() {
  if (!ctx || !enabled) return;
  const spb = 60 / 116 / 2; // 八分音符
  while (nextBeat < ctx.currentTime + 0.25) {
    const i = beatIndex % 16;
    const at = nextBeat;
    if (i % 4 === 0) tone(70, 0.25, { type: 'sine', vol: 0.5, slide: 0.6, out: musicGain, at });
    if (i % 4 === 2 || i === 15) noise(0.14, { vol: 0.35, freq: 1800, q: 0.7, out: musicGain, at });
    if (i % 2 === 1) noise(0.05, { vol: 0.12, freq: 7000, type: 'highpass', out: musicGain, at });
    if (i % 2 === 0) tone(BASS[(i / 2) % 8] / 2, spb * 1.6, { type: 'sawtooth', vol: 0.06, out: musicGain, at });
    nextBeat += spb; beatIndex++;
  }
}
export function startMusic() {
  if (!ctx) return;
  stopMusic();
  nextBeat = ctx.currentTime + 0.05; beatIndex = 0;
  musicTimer = setInterval(scheduleMusic, 90);
}
export function stopMusic() { clearInterval(musicTimer); musicTimer = 0; }
