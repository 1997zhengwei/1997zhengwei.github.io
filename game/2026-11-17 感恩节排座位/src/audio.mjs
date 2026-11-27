// Web Audio 合成音效（无外部音频文件）
let ctx = null;
let master = null;
let enabled = true;

export function setSound(on) { enabled = on; if (master) master.gain.value = on ? 0.5 : 0; }
export function soundOn() { return enabled; }

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.5 : 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, { type = 'sine', vol = 0.3, delay = 0, slide = 0, attack = 0.005 } = {}) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise(dur, { vol = 0.3, delay = 0, freq = 1200, q = 1, type = 'bandpass' } = {}) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

export const sfx = {
  select() { tone(660, 0.08, { type: 'triangle', vol: 0.18 }); },
  place() { tone(420, 0.12, { type: 'triangle', vol: 0.25, slide: 1.6 }); tone(880, 0.1, { type: 'sine', vol: 0.12, delay: 0.06 }); },
  lift() { tone(520, 0.1, { type: 'triangle', vol: 0.2, slide: 0.7 }); },
  happy() { tone(784, 0.14, { type: 'sine', vol: 0.15 }); tone(1046, 0.18, { type: 'sine', vol: 0.12, delay: 0.08 }); },
  sad() { tone(330, 0.25, { type: 'triangle', vol: 0.15, slide: 0.75 }); },
  chime() { tone(1318, 0.5, { type: 'sine', vol: 0.18 }); tone(1760, 0.45, { type: 'sine', vol: 0.1, delay: 0.03 }); },
  argue() { tone(180, 0.18, { type: 'sawtooth', vol: 0.12, slide: 1.3 }); tone(160, 0.18, { type: 'sawtooth', vol: 0.12, delay: 0.2, slide: 0.8 }); },
  whoosh() { noise(0.35, { vol: 0.35, freq: 900, q: 0.6 }); },
  splat() { noise(0.25, { vol: 0.6, freq: 420, q: 0.8, type: 'lowpass' }); tone(120, 0.18, { type: 'sine', vol: 0.3, slide: 0.5 }); },
  calm() { tone(523, 0.2, { type: 'sine', vol: 0.15 }); tone(659, 0.2, { type: 'sine', vol: 0.15, delay: 0.12 }); tone(784, 0.35, { type: 'sine', vol: 0.15, delay: 0.24 }); },
  bark() { tone(520, 0.08, { type: 'square', vol: 0.08, slide: 0.6 }); tone(480, 0.08, { type: 'square', vol: 0.08, delay: 0.12, slide: 0.6 }); },
  dinner() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.16, delay: i * 0.1 })); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.4, { type: 'triangle', vol: 0.16, delay: i * 0.09 })); },
  lose() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.15, delay: i * 0.13 })); },
  star(i) { tone(880 * Math.pow(1.26, i), 0.3, { type: 'sine', vol: 0.18 }); },
};
