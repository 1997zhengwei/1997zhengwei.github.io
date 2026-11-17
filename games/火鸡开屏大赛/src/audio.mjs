// Web Audio 合成音效 + 轻快背景节奏
let ctx = null, master = null, music = null, musicTimer = 0, nextBeat = 0, beat = 0;
let enabled = true;
let noiseBuf = null;
export function setSound(on) { enabled = on; if (master) master.gain.value = on ? 0.55 : 0; }
export function soundOn() { return enabled; }
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = enabled ? 0.55 : 0; master.connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0.22; music.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}
function tone(f, dur, { type = 'sine', vol = 0.3, delay = 0, slide = 0, out, at } = {}) {
  if (!ctx) return;
  const t = at ?? ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(out || master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, { vol = 0.3, delay = 0, freq = 2000, q = 1, type = 'bandpass', out, at } = {}) {
  if (!ctx) return;
  const t = at ?? ctx.currentTime + delay;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(out || master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
export const sfx = {
  feather(n) { const f = 660 * Math.pow(2, ((n % 12) / 12)); tone(f, 0.12, { type: 'triangle', vol: 0.14 }); tone(f * 1.5, 0.1, { vol: 0.06, delay: 0.03 }); },
  gateGood() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.14, delay: i * 0.05 })); },
  gateBad() { tone(300, 0.3, { type: 'sawtooth', vol: 0.12, slide: 0.5 }); },
  hit() { noise(0.35, { vol: 0.4, freq: 2500, q: 0.6 }); tone(700, 0.25, { type: 'square', vol: 0.08, slide: 0.4 }); },
  gobble() { for (let i = 0; i < 5; i++) tone(320 + (i % 2) * 120, 0.06, { type: 'square', vol: 0.07, delay: i * 0.065 }); },
  fanOpen() { noise(0.9, { vol: 0.25, freq: 1200, q: 0.4 }); [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.5, { type: 'triangle', vol: 0.12, delay: 0.2 + i * 0.07 })); },
  card(i) { tone(880 + i * 120, 0.18, { type: 'triangle', vol: 0.16 }); noise(0.1, { vol: 0.2, freq: 3000 }); },
  cheer() { noise(1.4, { vol: 0.22, freq: 1400, q: 0.3 }); },
  star(i) { tone(988 * Math.pow(1.26, i), 0.35, { vol: 0.15 }); },
  click() { tone(720, 0.05, { type: 'triangle', vol: 0.1 }); },
  jump() { tone(330, 0.32, { type: 'triangle', vol: 0.14, slide: 2.4 }); noise(0.25, { vol: 0.12, freq: 2200, q: 0.5 }); },
  land() { tone(140, 0.16, { type: 'sine', vol: 0.22, slide: 0.6 }); },
  crate() { noise(0.28, { vol: 0.35, freq: 900, q: 0.7 }); [880, 1100, 990].forEach((f, i) => tone(f, 0.08, { type: 'square', vol: 0.05, delay: 0.12 + i * 0.07 })); },
  corn() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.12, delay: i * 0.035 })); },
  shield() { tone(520, 0.2, { type: 'triangle', vol: 0.14, slide: 0.7 }); },
};
const BASS = [196, 196, 247, 247, 220, 220, 262, 294];
function schedule() {
  if (!ctx || !enabled) return;
  const spb = 60 / 128 / 2;
  while (nextBeat < ctx.currentTime + 0.25) {
    const i = beat % 16, at = nextBeat;
    if (i % 4 === 0) tone(80, 0.2, { vol: 0.45, slide: 0.5, out: music, at });
    if (i % 4 === 2) noise(0.1, { vol: 0.25, freq: 2200, q: 0.8, out: music, at });
    noise(0.03, { vol: 0.08, freq: 8000, type: 'highpass', out: music, at });
    if (i % 2 === 0) tone(BASS[(i / 2) % 8], spb * 1.5, { type: 'triangle', vol: 0.12, out: music, at });
    if (i === 6 || i === 14) tone(BASS[(i / 2) % 8] * 2, spb, { type: 'square', vol: 0.03, out: music, at });
    nextBeat += spb; beat++;
  }
}
export function startMusic() { if (!ctx) return; stopMusic(); nextBeat = ctx.currentTime + 0.05; beat = 0; musicTimer = setInterval(schedule, 90); }
export function stopMusic() { clearInterval(musicTimer); musicTimer = 0; }
