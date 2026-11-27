// soundscapes.js —— SPA 音源：全部用 WebAudio 现场合成，可以叠着开、各自调音量。
// 每个音源：start(bus) 返回 stop()；音量由外层 GainNode 控制。

const rnd = (a, b) => a + Math.random() * (b - a);

export const SCAPES = [
  { id: 'pops', emoji: '👂', name: '耳边啵啵', vol: 0.7 },
  { id: 'forest', emoji: '🌲', name: '森林', vol: 0.7 },
  { id: 'rain', emoji: '🌧️', name: '雨声', vol: 0.6 },
  { id: 'ocean', emoji: '🌊', name: '海浪', vol: 0.6 },
  { id: 'fire', emoji: '🔥', name: '篝火', vol: 0.6 },
  { id: 'bowl', emoji: '🔔', name: '颂钵', vol: 0.5 },
  { id: 'stream', emoji: '💧', name: '溪流水滴', vol: 0.6 },
  { id: 'fan', emoji: '🌀', name: '白噪音', vol: 0.45 },
  { id: 'heart', emoji: '💗', name: '心跳', vol: 0.7 },
  { id: 'music', emoji: '🎼', name: '轻音乐', vol: 0.55 },
];

export class Soundscape {
  constructor(asmr, save, persist) {
    this.a = asmr; this.save = save; this.persist = persist;
    this.on = {};     // id -> { gain, stop }
    this.temp = {};   // 睡眠组合的临时音量
  }
  get ctx() { return this.a.ctx; }
  ensureBus() {
    if (this.bus || !this.ctx) return;
    this.bus = this.ctx.createGain(); this.bus.gain.value = 1;
    this.bus.connect(this.a.master);
    this.wet = this.ctx.createGain(); this.wet.gain.value = 0.35;
    this.bus.connect(this.wet).connect(this.a.verb);
  }
  isOn(id) { return !!this.on[id]; }
  volume(id) { if (this.temp[id] !== undefined) return this.temp[id]; const s = this.save.scapes[id]; return s && typeof s.v === 'number' ? s.v : SCAPES.find(x => x.id === id).vol; }
  toggle(id, force) {
    const want = force === undefined ? !this.on[id] : force;
    if (want && !this.on[id]) this.startOne(id);
    else if (!want && this.on[id]) this.stopOne(id);
    const st = this.save.scapes[id] || (this.save.scapes[id] = {});
    st.on = want; this.persist();
    return want;
  }
  setVolume(id, v) {
    const st = this.save.scapes[id] || (this.save.scapes[id] = {});
    st.v = v; this.persist();
    const o = this.on[id];
    if (o) o.gain.gain.setTargetAtTime(v * v, this.ctx.currentTime, 0.1);
  }
  // 进游戏时恢复上次开着的音源；第一次默认开"轻音乐"
  restore() {
    if (!this.ctx) return;
    const saved = Object.keys(this.save.scapes).filter(k => this.save.scapes[k].on);
    const list = saved.length || this.save.scapesTouched ? saved : ['music'];
    for (const id of list) this.toggle(id, true);
  }
  startOne(id) {
    this.a.init(); this.ensureBus();
    if (!this.ctx) return;
    const g = this.ctx.createGain(); g.gain.value = 0;
    g.connect(this.bus);
    const v = this.volume(id);
    g.gain.setTargetAtTime(v * v, this.ctx.currentTime, 0.8);
    const stop = this['s_' + id](g);
    this.on[id] = { gain: g, stop };
  }
  stopOne(id) {
    const o = this.on[id]; if (!o) return;
    delete this.on[id];
    o.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    setTimeout(() => { try { o.stop(); o.gain.disconnect(); } catch { /* */ } }, 2500);
  }
  activeCount() { return Object.keys(this.on).length; }
  // 睡眠组合：只开列出来的音源（临时音量），返回原来开着的，方便退出时恢复
  applyMix(map) {
    const prev = Object.keys(this.on);
    this.temp = { ...map };
    for (const id of prev) if (!(id in map)) this.stopOne(id);
    for (const [id, v] of Object.entries(map)) {
      if (this.on[id]) this.on[id].gain.gain.setTargetAtTime(v * v, this.ctx.currentTime, 0.8);
      else this.startOne(id);
    }
    return prev;
  }
  restoreSet(ids) {
    this.temp = {};
    for (const id of Object.keys(this.on)) if (!ids.includes(id)) this.stopOne(id);
    for (const id of ids) {
      if (this.on[id]) this.on[id].gain.gain.setTargetAtTime(this.volume(id) ** 2, this.ctx.currentTime, 0.8);
      else this.startOne(id);
    }
  }

  // —— 小工具 ——
  noise(kind) { return this.a.noise[kind]; }
  loopSrc(kind, out, rate = 1) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noise(kind); s.loop = true; s.playbackRate.value = rate;
    s.connect(out); s.start(0, Math.random() * 2.5); return s;
  }
  filt(type, f, q = 0.7, gain) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; if (gain !== undefined) b.gain.value = gain; return b; }
  pan(v) { const p = this.ctx.createStereoPanner(); p.pan.value = v; return p; }
  lfo(freq, depth, target, type = 'sine') { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq; const g = this.ctx.createGain(); g.gain.value = depth; o.connect(g).connect(target); o.start(); return o; }
  every(fn, minS, maxS) {
    let alive = true, t;
    const tick = () => { if (!alive) return; try { fn(); } catch { /* */ } t = setTimeout(tick, rnd(minS, maxS) * 1000); };
    t = setTimeout(tick, rnd(0.2, 1.2) * 1000);
    return () => { alive = false; clearTimeout(t); };
  }
  env(node, t, a, peak, d) { node.gain.setValueAtTime(0, t); node.gain.linearRampToValueAtTime(peak, t + a); node.gain.exponentialRampToValueAtTime(0.0005, t + a + d); }

  // —— 音源 ——
  // 耳边"啵"：一左一右，偶尔连着两下
  s_pops(out) {
    const pop = (side, when = 0) => {
      const ctx = this.ctx, t = ctx.currentTime + when;
      const p = this.pan(side * rnd(0.55, 0.95)); p.connect(out);
      const o = ctx.createOscillator(); o.type = 'sine';
      const f0 = rnd(700, 1250); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.32, t + 0.035);
      const g = ctx.createGain(); this.env(g, t, 0.002, rnd(0.25, 0.42), 0.06);
      const lp = this.filt('lowpass', 2600, 0.9);
      o.connect(g).connect(lp).connect(p); o.start(t); o.stop(t + 0.1);
      const n = ctx.createBufferSource(); n.buffer = this.noise('white');
      const ng = ctx.createGain(); this.env(ng, t, 0.001, 0.05, 0.012);
      n.connect(this.filt('bandpass', rnd(2500, 4200), 2)).connect(ng).connect(p); n.start(t, Math.random() * 2, 0.03);
      setTimeout(() => p.disconnect(), 600);
    };
    let side = Math.random() < 0.5 ? -1 : 1;
    return this.every(() => { side = -side; pop(side); if (Math.random() < 0.35) pop(side, rnd(0.12, 0.22)); }, 0.9, 2.8);
  }
  // 森林：风吹叶子 + 鸟叫 + 远处小溪
  s_forest(out) {
    const wind = this.ctx.createGain(); wind.gain.value = 0.25;
    const bp = this.filt('bandpass', 650, 0.5); bp.connect(wind).connect(out);
    const s1 = this.loopSrc('pink', bp);
    const l1 = this.lfo(0.06, 0.18, wind.gain);
    const leaves = this.ctx.createGain(); leaves.gain.value = 0.05;
    const hp = this.filt('highpass', 3500, 0.5); hp.connect(leaves).connect(this.pan(0.3)).connect(out);
    const s2 = this.loopSrc('white', hp);
    const l2 = this.lfo(0.21, 0.04, leaves.gain);
    const brook = this.ctx.createGain(); brook.gain.value = 0.04;
    const bb = this.filt('bandpass', 1500, 0.8); bb.connect(brook).connect(this.pan(-0.6)).connect(out);
    const s3 = this.loopSrc('pink', bb, 1.3);
    const bird = () => {
      const ctx = this.ctx, p = this.pan(rnd(-0.9, 0.9)); p.connect(out);
      const base = rnd(2600, 4200), notes = 2 + Math.floor(Math.random() * 5);
      let t = ctx.currentTime;
      for (let i = 0; i < notes; i++) {
        const o = ctx.createOscillator(); o.type = 'sine';
        const f = base * rnd(0.85, 1.2), d = rnd(0.05, 0.13);
        o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * rnd(0.7, 1.35), t + d);
        const g = ctx.createGain(); this.env(g, t, 0.01, rnd(0.03, 0.07), d);
        o.connect(g).connect(p); o.start(t); o.stop(t + d + 0.05);
        t += d + rnd(0.03, 0.12);
      }
      setTimeout(() => p.disconnect(), 3000);
    };
    const stopB = this.every(bird, 2.5, 8);
    return () => { stopB(); for (const s of [s1, s2, s3, l1, l2]) s.stop(); };
  }
  // 雨：细密的沙沙 + 落在叶子上的水滴
  s_rain(out) {
    const bed = this.ctx.createGain(); bed.gain.value = 0.22;
    const lp = this.filt('lowpass', 6500, 0.5), hp = this.filt('highpass', 500, 0.5);
    hp.connect(lp).connect(bed).connect(out);
    const s1 = this.loopSrc('pink', hp);
    const drops = setInterval(() => {
      const ctx = this.ctx; if (!ctx) return;
      for (let i = 0; i < 4; i++) {
        const t = ctx.currentTime + Math.random() * 0.1;
        const n = ctx.createBufferSource(); n.buffer = this.noise('white');
        const g = ctx.createGain(); this.env(g, t, 0.001, rnd(0.01, 0.06), rnd(0.004, 0.02));
        n.connect(this.filt('bandpass', rnd(1800, 6000), 3)).connect(g).connect(out); n.start(t, Math.random() * 2, 0.05);
      }
    }, 100);
    return () => { clearInterval(drops); s1.stop(); };
  }
  // 海浪：一涨一落，左右慢慢摆
  s_ocean(out) {
    const g = this.ctx.createGain(); g.gain.value = 0.25;
    const p = this.pan(0); p.connect(out);
    const lp = this.filt('lowpass', 520, 0.6); lp.connect(g).connect(p);
    const s1 = this.loopSrc('brown', lp);
    const hiG = this.ctx.createGain(); hiG.gain.value = 0.03;
    const hp = this.filt('bandpass', 1800, 0.5); hp.connect(hiG).connect(p);
    const s2 = this.loopSrc('pink', hp);
    const l1 = this.lfo(0.1, 0.22, g.gain), l2 = this.lfo(0.1, 0.03, hiG.gain), l3 = this.lfo(0.035, 0.6, p.pan);
    return () => { for (const s of [s1, s2, l1, l2, l3]) s.stop(); };
  }
  // 篝火：噼啪 + 低低的呼呼声
  s_fire(out) {
    const roar = this.ctx.createGain(); roar.gain.value = 0.2;
    const lp = this.filt('lowpass', 220, 0.7); lp.connect(roar).connect(out);
    const s1 = this.loopSrc('brown', lp);
    const l1 = this.lfo(0.3, 0.06, roar.gain);
    const pans = [-0.35, -0.1, 0.15, 0.4].map(v => { const p = this.pan(v); p.connect(out); return p; });
    const crack = () => {
      const ctx = this.ctx, n = 1 + Math.floor(Math.random() * (Math.random() < 0.2 ? 9 : 3));
      for (let i = 0; i < n; i++) {
        const t = ctx.currentTime + Math.random() * 0.15;
        const s = ctx.createBufferSource(); s.buffer = this.noise('white');
        const g = ctx.createGain(); this.env(g, t, 0.0008, rnd(0.05, 0.3), rnd(0.004, 0.025));
        s.connect(this.filt('bandpass', rnd(1200, 5500), rnd(1, 4))).connect(g).connect(pans[Math.floor(Math.random() * pans.length)]);
        s.start(t, Math.random() * 2, 0.06);
      }
    };
    const stopC = this.every(crack, 0.08, 0.55);
    return () => { stopC(); s1.stop(); l1.stop(); };
  }
  // 颂钵：隔一阵敲一下，长长的余音和拍频
  s_bowl(out) {
    const strike = () => {
      const ctx = this.ctx, t = ctx.currentTime, f0 = [196, 220, 261.6, 174.6][Math.floor(Math.random() * 4)];
      const p = this.pan(rnd(-0.3, 0.3)); p.connect(out);
      for (const [m, a, d] of [[1, 0.16, 14], [1.006, 0.1, 13], [2.76, 0.06, 9], [2.77, 0.05, 8], [5.4, 0.025, 5], [8.9, 0.012, 3]]) {
        const o = ctx.createOscillator(); o.frequency.value = f0 * m;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.01); g.gain.setTargetAtTime(0, t + 0.02, d / 4);
        o.connect(g).connect(p); o.start(t); o.stop(t + d + 1);
      }
      setTimeout(() => p.disconnect(), 16000);
    };
    return this.every(strike, 14, 24);
  }
  // 溪流 + 洞里的水滴
  s_stream(out) {
    const g = this.ctx.createGain(); g.gain.value = 0.12;
    const bp = this.filt('bandpass', 1100, 0.9); bp.connect(g).connect(this.pan(0.4)).connect(out);
    const s1 = this.loopSrc('pink', bp, 1.4);
    const l1 = this.lfo(3.1, 0.04, g.gain), l2 = this.lfo(7.3, 300, bp.frequency);
    const pans = [-0.7, -0.2, 0.3, 0.75].map(v => { const p = this.pan(v); p.connect(out); return p; });
    const drip = () => {
      const ctx = this.ctx, t = ctx.currentTime, f = rnd(800, 1600);
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.3, t + 0.06);
      const dg = ctx.createGain(); this.env(dg, t, 0.002, 0.09, 0.09);
      o.connect(dg).connect(pans[Math.floor(Math.random() * pans.length)]); o.start(t); o.stop(t + 0.2);
    };
    const stopD = this.every(drip, 0.7, 3.2);
    return () => { stopD(); for (const s of [s1, l1, l2]) s.stop(); };
  }
  // 白噪音（像风扇）
  s_fan(out) {
    const g = this.ctx.createGain(); g.gain.value = 0.3;
    const lp = this.filt('lowpass', 2400, 0.5); lp.connect(g).connect(out);
    const s1 = this.loopSrc('pink', lp);
    return () => s1.stop();
  }
  // 心跳：每分钟 58 下，"咚—咚"。像贴着听诊器：低频身体 + 100–500Hz 的闷响（耳塞和手机也能听到）
  s_heart(out) {
    const lp = this.filt('lowpass', 750, 0.6); lp.connect(out);
    const thump = (t, k) => {
      const ctx = this.ctx;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(170 * k, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.09);
      const g = ctx.createGain(); this.env(g, t, 0.006, 0.75 * k, 0.17);
      o.connect(g).connect(lp); o.start(t); o.stop(t + 0.3);
      const o2 = ctx.createOscillator(); o2.type = 'triangle';
      o2.frequency.setValueAtTime(260 * k, t); o2.frequency.exponentialRampToValueAtTime(110, t + 0.07);
      const g2 = ctx.createGain(); this.env(g2, t, 0.004, 0.22 * k, 0.09);
      o2.connect(g2).connect(lp); o2.start(t); o2.stop(t + 0.2);
      const n = ctx.createBufferSource(); n.buffer = this.noise('pink');
      const ng = ctx.createGain(); this.env(ng, t, 0.004, 0.5 * k, 0.07);
      n.connect(this.filt('bandpass', 220, 0.9)).connect(ng).connect(lp); n.start(t, Math.random() * 2, 0.15);
    };
    const beat = () => { const t = this.ctx.currentTime + 0.02; thump(t, 1); thump(t + 0.27, 0.72); };
    const iv = setInterval(beat, 1035); beat();
    return () => clearInterval(iv);
  }
  // 轻音乐：慢慢呼吸的和弦垫底 + 偶尔一两个音
  s_music(out) {
    const ctx = this.ctx, lp = this.filt('lowpass', 1100, 0.5); lp.connect(out);
    const nodes = [];
    for (const [f, d] of [[130.8, 0], [196, 0.3], [246.9, -0.2], [293.7, 0.25], [329.6, -0.3]]) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = d * 10;
      const g = ctx.createGain(); g.gain.value = 0.045;
      nodes.push(this.lfo(rnd(0.04, 0.1), 0.03, g.gain));
      o.connect(g).connect(lp); o.start(); nodes.push(o);
    }
    const scale = [523.3, 587.3, 659.3, 784, 880, 1046.5];
    const pans = [-0.4, 0, 0.4].map(v => { const p = this.pan(v); p.connect(out); return p; });
    const note = () => {
      const t = ctx.currentTime, f = scale[Math.floor(Math.random() * scale.length)];
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); this.env(g, t, 0.02, 0.05, 2.6);
      o.connect(g).connect(pans[Math.floor(Math.random() * pans.length)]); o.start(t); o.stop(t + 3);
    };
    const stopN = this.every(note, 3, 7);
    return () => { stopN(); for (const n of nodes) n.stop(); };
  }
}
