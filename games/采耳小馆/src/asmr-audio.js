// asmr-audio.js —— 全程合成的采耳 ASMR：贴耳双声道（近耳响、远耳弱+延迟+闷）、耳道里变闷变低沉、
// 刮擦颗粒声、棉签呼噜声、鹅毛沙沙、音叉嗡鸣、按摩摩擦；环境是低低的 spa 垫乐和水滴。
export class Asmr {
  constructor() { this.ctx = null; this.muted = false; this.side = 1; this.loops = {}; this.ready = false; }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC({ latencyHint: 'interactive' });
    const master = this.master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    // fade：睡眠定时结束时整体淡出
    this.fade = ctx.createGain(); this.fade.gain.value = 1;
    master.connect(this.fade).connect(comp).connect(ctx.destination);

    // 混响（小房间）
    const ir = ctx.createBuffer(2, ctx.sampleRate * 1.6, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2); }
    this.verb = ctx.createConvolver(); this.verb.buffer = ir;
    this.verbOut = ctx.createGain(); this.verbOut.gain.value = 0.22;
    this.verb.connect(this.verbOut).connect(master);

    // 贴耳总线：耳道遮挡 → 双耳
    this.tool = ctx.createGain(); this.tool.gain.value = 1;
    this.shelf = ctx.createBiquadFilter(); this.shelf.type = 'lowshelf'; this.shelf.frequency.value = 260; this.shelf.gain.value = 0;
    this.occl = ctx.createBiquadFilter(); this.occl.type = 'lowpass'; this.occl.frequency.value = 16000; this.occl.Q.value = 0.5;
    this.tool.connect(this.shelf).connect(this.occl);
    const merger = ctx.createChannelMerger(2);
    this.nearL = ctx.createGain(); this.nearR = ctx.createGain(); this.farL = ctx.createGain(); this.farR = ctx.createGain();
    const delay = ctx.createDelay(0.01); delay.delayTime.value = 0.00068;
    const shadow = ctx.createBiquadFilter(); shadow.type = 'lowpass'; shadow.frequency.value = 1500;
    this.occl.connect(this.nearL); this.occl.connect(this.nearR);
    this.occl.connect(delay).connect(shadow); shadow.connect(this.farL); shadow.connect(this.farR);
    this.nearL.connect(merger, 0, 0); this.farL.connect(merger, 0, 0);
    this.nearR.connect(merger, 0, 1); this.farR.connect(merger, 0, 1);
    this.fx = ctx.createGain(); this.fx.gain.value = this.muted ? 0 : 1; this.fx.connect(master);
    // 柔和通路：睡眠模式时削掉刺耳的高频、整体小一点
    this.soft = ctx.createBiquadFilter(); this.soft.type = 'lowpass'; this.soft.frequency.value = 20000; this.soft.Q.value = 0.5;
    this.softGain = ctx.createGain(); this.softGain.gain.value = 1;
    merger.connect(this.soft).connect(this.softGain).connect(this.fx);
    const send = ctx.createGain(); send.gain.value = 0.12; this.occl.connect(send).connect(this.verb);
    this.setSide(this.side);

    // 房间总线（居中）
    this.room = ctx.createGain(); this.room.gain.value = 1; this.room.connect(this.fx);
    const rs = ctx.createGain(); rs.gain.value = 0.5; this.room.connect(rs).connect(this.verb);

    // 噪声
    const mk = (kind) => {
      const len = ctx.sampleRate * 3, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      let l = 0, b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'white') d[i] = w;
        else if (kind === 'brown') { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; }
        else { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.05) * 1.6; }
      }
      return b;
    };
    this.noise = { white: mk('white'), pink: mk('pink'), brown: mk('brown') };

    this.makeLoop('scrape', 'white', [['bandpass', 3400, 0.8], ['highshelf', 6000, 0, 4]]);
    this.makeLoop('cotton', 'brown', [['lowpass', 700, 0.7], ['peaking', 180, 1, 7]]);
    this.makeLoop('cottonHi', 'pink', [['bandpass', 1800, 0.7]]);
    this.makeLoop('feather', 'white', [['highpass', 2600, 0.6], ['peaking', 7000, 0.8, 5]]);
    this.makeLoop('rub', 'pink', [['bandpass', 1100, 0.9], ['peaking', 2600, 2, 4]]);
    this.makeLoop('slick', 'pink', [['bandpass', 2300, 1.4], ['peaking', 900, 2, 5]]);
    this.makeLoop('ocean', 'brown', [['lowpass', 380, 0.7], ['peaking', 110, 1, 6]], 0.6);
    this.makeLoop('towel', 'pink', [['lowpass', 620, 0.6]]);
    this.makeLoop('steam', 'white', [['highpass', 4800, 0.5]]);
    // 捂耳的"海浪"一涨一落
    const sw = ctx.createOscillator(); sw.frequency.value = 0.14; const sg = ctx.createGain(); sg.gain.value = 0.4;
    sw.connect(sg).connect(this.loops.ocean.amp.gain); sw.start();
    // 鹅毛的"簌簌"抖动
    const lfo = ctx.createOscillator(); lfo.frequency.value = 17; const lg = ctx.createGain(); lg.gain.value = 0.5;
    lfo.connect(lg).connect(this.loops.feather.amp.gain); lfo.start();
    this.featherLfo = lfo;

    this.ready = true;
  }

  makeLoop(name, noise, filters, base = 1) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.noise[noise]; src.loop = true;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    let node = src;
    const fl = [];
    for (const [type, f, q, gain] of filters) {
      const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; if (gain !== undefined) b.gain.value = gain;
      node.connect(b); node = b; fl.push(b);
    }
    const amp = ctx.createGain(); amp.gain.value = 0;
    const out = ctx.createGain(); out.gain.value = 0;
    node.connect(amp).connect(out).connect(this.tool);
    src.start(0, Math.random() * 2);
    this.loops[name] = { src, fl, amp, out, base: name === 'feather' ? 0.5 : base };
  }

  // 0..1 强度，平滑过渡
  loop(name, level, tc = 0.04, freq) {
    const L = this.loops[name]; if (!L) return;
    const t = this.ctx.currentTime;
    L.out.gain.setTargetAtTime(level, t, tc);
    L.amp.gain.setTargetAtTime(L.base, t, 0.05);
    if (freq && L.fl[0]) L.fl[0].frequency.setTargetAtTime(freq, t, 0.06);
  }
  allLoopsOff() { if (!this.ready) return; for (const k in this.loops) this.loop(k, 0, 0.08); }

  setSide(s) {
    this.side = s;
    if (!this.nearL) return;
    const t = this.ctx.currentTime;
    this.nearL.gain.setTargetAtTime(s < 0 ? 1 : 0, t, 0.05); this.nearR.gain.setTargetAtTime(s < 0 ? 0 : 1, t, 0.05);
    this.farL.gain.setTargetAtTime(s < 0 ? 0 : 0.34, t, 0.05); this.farR.gain.setTargetAtTime(s < 0 ? 0.34 : 0, t, 0.05);
  }
  // 工具伸进耳道的深度（0 外面 → 1 很深）：更闷、更低沉、更近
  setDepth(d) {
    if (!this.ready) return;
    const t = this.ctx.currentTime, k = Math.max(0, Math.min(1, d));
    this.shelf.gain.setTargetAtTime(11 * k, t, 0.06);
    this.occl.frequency.setTargetAtTime(16000 * Math.pow(0.16, k), t, 0.06);
    this.tool.gain.setTargetAtTime(1 + 0.9 * k, t, 0.06);
  }
  setSoft(on) {
    if (!this.soft) return;
    const t = this.ctx.currentTime;
    this.soft.frequency.setTargetAtTime(on ? 3800 : 20000, t, 0.4);
    this.softGain.gain.setTargetAtTime(on ? 0.55 : 1, t, 0.4);
  }
  setFade(v, tc = 3) {
    if (this.fade) this.fade.gain.setTargetAtTime(v, this.ctx.currentTime, tc);
  }
  setMuted(m) {
    this.muted = m;
    if (this.fx) this.fx.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
  }

  // —— 一次性声音 ——
  burst(dest, dur, f, q, gain, when = 0) {
    const ctx = this.ctx, t = ctx.currentTime + when;
    const src = ctx.createBufferSource(); src.buffer = this.noise.white;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.0015); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(bp).connect(g).connect(dest);
    src.start(t, Math.random() * 2.5, dur + 0.02);
  }
  thock(dest, f0, f1, dur, gain, when = 0, type = 'sine') {
    const ctx = this.ctx, t = ctx.currentTime + when;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  // 刮擦颗粒："咔"
  grain(intensity = 0.5) {
    if (!this.ready) return;
    this.burst(this.tool, 0.006 + Math.random() * 0.012, 2200 + Math.random() * 5200, 1.2 + Math.random() * 2, 0.08 + intensity * 0.32);
  }
  crackle(n = 6, intensity = 0.6, spread = 0.07) {
    if (!this.ready) return;
    for (let i = 0; i < n; i++) this.burst(this.tool, 0.005 + Math.random() * 0.012, 1800 + Math.random() * 6500, 1 + Math.random() * 3, (0.1 + Math.random() * 0.3) * intensity, Math.random() * spread);
  }
  pop(size = 0.5) {
    if (!this.ready) return;
    this.crackle(4 + Math.round(size * 8), 0.7 + size * 0.5, 0.03);
    this.thock(this.tool, 340 - size * 120, 110, 0.06 + size * 0.05, 0.12 + size * 0.2, 0.012);
  }
  bigPop() {
    if (!this.ready) return;
    this.crackle(22, 1.1, 0.18);
    this.thock(this.tool, 190, 52, 0.22, 0.55, 0.16);
    this.burst(this.tool, 0.09, 900, 0.7, 0.4, 0.16);
  }
  creak(amount) {
    if (!this.ready) return;
    this.thock(this.tool, 90 + Math.random() * 50, 70, 0.05, 0.08 * amount, 0, 'sawtooth');
    this.burst(this.tool, 0.02, 600 + Math.random() * 400, 2, 0.12 * amount);
  }
  land() {
    if (!this.ready) return;
    this.burst(this.room, 0.03, 4800, 1.5, 0.05);
  }
  // 精油"滴"一下
  drip() {
    if (!this.ready) return;
    this.thock(this.tool, 700 + Math.random() * 200, 1900, 0.07, 0.16);
    this.thock(this.tool, 260, 140, 0.12, 0.07, 0.03);
    this.burst(this.tool, 0.04, 2600, 1.2, 0.05, 0.02);
  }
  // 拍一下：闷闷的"噗"
  thump(k = 1) {
    if (!this.ready) return;
    this.thock(this.tool, 150, 52, 0.16, 0.42 * k);
    this.burst(this.tool, 0.05, 420, 0.8, 0.22 * k);
  }
  // 松开捂耳：气压释放
  release() {
    if (!this.ready) return;
    this.thock(this.tool, 90, 240, 0.12, 0.22);
    this.burst(this.tool, 0.09, 1400, 0.6, 0.12, 0.02);
  }
  // 热毛巾盖上去："噗"一声软布
  flop() {
    if (!this.ready) return;
    this.burst(this.tool, 0.16, 520, 0.6, 0.35);
    this.thock(this.tool, 120, 70, 0.14, 0.18);
  }
  // 客人睡着后的呼吸
  breathe() {
    if (!this.ready) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noise.pink;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 1.4); g.gain.linearRampToValueAtTime(0.0, t + 3.6);
    src.connect(bp).connect(g).connect(this.room); src.start(t, Math.random() * 2, 3.8);
  }
  heart() {
    if (!this.ready) return;
    [1318.5, 1760].forEach((f, i) => this.thock(this.room, f, f, 0.9, 0.05, i * 0.09));
  }
  click() {
    if (!this.ready) return;
    this.thock(this.room, 1150, 700, 0.06, 0.07);
    this.burst(this.room, 0.015, 3500, 2, 0.03);
  }
  chime() {
    if (!this.ready) return;
    [880, 1318.5, 1760, 2217].forEach((f, i) => this.thock(this.room, f, f * 0.998, 2.2, 0.06, i * 0.13, 'sine'));
  }
  giggle() {
    // 痒得一缩：一小串短促的"嗯～"（滤波后的锯齿，不是人声采样）
    if (!this.ready) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(320, t); o.frequency.linearRampToValueAtTime(410, t + 0.12); o.frequency.linearRampToValueAtTime(280, t + 0.45);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(f).connect(g).connect(this.room); o.start(t); o.stop(t + 0.55);
  }

  // 音叉：每次敲击重新起振，持续 6 秒衰减；距离决定响度和闷度
  forkStrike() {
    if (!this.ready) return;
    const ctx = this.ctx, t = ctx.currentTime;
    if (!this.fork) {
      const bus = ctx.createGain(); bus.gain.value = 0;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000;
      bus.connect(lp).connect(this.tool);
      this.fork = { bus, lp, partials: [] };
      for (const [f, a] of [[512, 1], [514.6, 0.45], [1393, 0.16], [2790, 0.05]]) {
        const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = 0;
        o.connect(g).connect(bus); o.start();
        this.fork.partials.push({ g, a });
      }
    }
    for (const p of this.fork.partials) {
      p.g.gain.cancelScheduledValues(t);
      p.g.gain.setValueAtTime(p.g.gain.value, t);
      p.g.gain.linearRampToValueAtTime(0.16 * p.a, t + 0.004);
      p.g.gain.setTargetAtTime(0, t + 0.01, p.a > 0.3 ? 2.2 : 0.5);
    }
    this.burst(this.room, 0.02, 5200, 3, 0.08);
  }
  forkNear(closeness) {
    if (!this.fork) return;
    const t = this.ctx.currentTime, k = Math.max(0, Math.min(1, closeness));
    this.fork.bus.gain.setTargetAtTime(0.08 + 0.92 * k * k, t, 0.05);
    this.fork.lp.frequency.setTargetAtTime(1800 + 7000 * k, t, 0.05);
  }
}
