// 贴图工具：Canvas 绘制的高清贴图 + 由高度图生成法线贴图
import * as THREE from '../vendor/three.module.js';

export function canvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return c;
}
export function tex(c, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
// 高度图（灰度 Canvas）→ 法线贴图
export function normalFromHeight(hc, strength = 2, repeat = null) {
  const w = hc.width, h = hc.height;
  const src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  const img = ctx.createImageData(w, h);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
    const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const nz = 1 / Math.sqrt(dx * dx + dy * dy + 1);
    const i = (y * w + x) * 4;
    img.data[i] = (-dx * nz * 0.5 + 0.5) * 255;
    img.data[i + 1] = (dy * nz * 0.5 + 0.5) * 255;
    img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return tex(out, { srgb: false, repeat });
}
export function rng(seed = 1) { let a = seed; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; }

// ---------- 火鸡身上的古铜羽（颜色 + 高度）：小而密的覆羽，铜色→墨绿虹彩→黑带→浅金细边 ----------
export function scalePlumage() {
  const W = 1024, R = 56;
  const drawScales = (x, colorMode) => {
    x.fillStyle = colorMode ? '#1c0f08' : '#000'; x.fillRect(0, 0, W, W);
    const r = rng(9);
    const rows = Math.ceil(W / (R * 0.78)) + 2, cols = Math.ceil(W / (R * 1.5)) + 2;
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const cx = col * R * 1.5 + (row % 2) * R * 0.75 + (r() - 0.5) * 3, cy = row * R * 0.78;
        const rr = R * (0.94 + r() * 0.12);
        const path = () => { x.beginPath(); x.moveTo(cx - rr, cy); x.bezierCurveTo(cx - rr, cy + rr * 0.95, cx + rr, cy + rr * 0.95, cx + rr, cy); x.closePath(); };
        if (colorMode) {
          const warm = 0.85 + r() * 0.3;
          const g = x.createLinearGradient(cx, cy, cx, cy + rr * 0.75);
          g.addColorStop(0, `rgb(${Math.round(52 * warm)},${Math.round(28 * warm)},${Math.round(14 * warm)})`);
          g.addColorStop(0.5, `rgb(${Math.round(146 * warm)},${Math.round(82 * warm)},${Math.round(36 * warm)})`);
          g.addColorStop(0.72, '#3e5230'); g.addColorStop(0.84, '#140c07'); g.addColorStop(0.94, '#6a4422'); g.addColorStop(1, '#1c0f08');
          x.fillStyle = g; path(); x.fill();
          x.strokeStyle = 'rgba(255,215,160,.08)'; x.lineWidth = 1;
          for (let k = -7; k <= 7; k++) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + k * rr * 0.12, cy + rr * 0.66); x.stroke(); }
        } else {
          const g = x.createLinearGradient(cx, cy, cx, cy + rr * 0.75);
          g.addColorStop(0, '#606060'); g.addColorStop(0.7, '#e0e0e0'); g.addColorStop(1, '#202020');
          x.fillStyle = g; path(); x.fill();
        }
      }
    }
  };
  const col = canvas(W, W, (x) => drawScales(x, true));
  const hgt = canvas(W, W, (x) => drawScales(x, false));
  return { map: tex(col, { repeat: [1.6, 0.8], aniso: 16 }), normalMap: normalFromHeight(hgt, 2.2, [1.6, 0.8]) };
}

// 舞台台面：奶白大理石 + 金色同心环 + 酒红八角星
export function stageFloorTex() {
  return tex(canvas(1024, 1024, (x, w, h) => {
    const c = w / 2;
    x.fillStyle = '#efe4d2'; x.fillRect(0, 0, w, h);
    const r = rng(41);
    for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(150,130,110,${0.05 + r() * 0.08})`; x.lineWidth = 0.6 + r() * 1.6; x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - 0.5) * 160; py += (r() - 0.3) * 120; x.lineTo(px, py); } x.stroke(); }
    const ringC = (rad, lw, col) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.arc(c, c, rad, 0, 7); x.stroke(); };
    ringC(500, 14, '#c99a2e'); ringC(470, 4, '#c99a2e'); ringC(300, 8, '#c99a2e'); ringC(286, 3, '#c99a2e');
    for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; x.fillStyle = i % 2 ? '#7a0c20' : '#c99a2e'; x.beginPath(); x.moveTo(c + Math.cos(a) * 300, c + Math.sin(a) * 300); x.lineTo(c + Math.cos(a + 0.05) * 385, c + Math.sin(a + 0.05) * 385); x.lineTo(c + Math.cos(a) * 470, c + Math.sin(a) * 470); x.lineTo(c + Math.cos(a - 0.05) * 385, c + Math.sin(a - 0.05) * 385); x.fill(); }
    const star = (R1, R2, col) => { x.fillStyle = col; x.beginPath(); for (let i = 0; i < 16; i++) { const rr = i % 2 ? R2 : R1, a = (i / 16) * Math.PI * 2 - Math.PI / 2; x.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); } x.closePath(); x.fill(); };
    star(270, 120, '#c99a2e'); star(250, 108, '#8a0c22'); star(130, 60, '#c99a2e');
    ringC(55, 6, '#efe4d2');
  }), { aniso: 16 });
}

// 翅膀飞羽：古铜底 + 象牙白横斑
export function wingFeatherTex() {
  return tex(canvas(256, 1024, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.save();
    x.beginPath(); x.moveTo(w / 2, h); x.bezierCurveTo(w * 0.08, h * 0.7, w * 0.12, h * 0.1, w * 0.55, 0); x.bezierCurveTo(w * 0.95, h * 0.15, w * 0.92, h * 0.75, w / 2, h); x.clip();
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a1608'); g.addColorStop(0.5, '#5a2e12'); g.addColorStop(1, '#7a4420');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(214,186,140,.42)'; x.beginPath(); x.ellipse(w / 2, h * (0.12 + i * 0.13), w * 0.46, h * 0.018, 0.12, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1;
    for (let i = 0; i < 80; i++) { const y = (i / 80) * h; x.beginPath(); x.moveTo(w / 2, y + 20); x.lineTo(0, y); x.moveTo(w / 2, y + 20); x.lineTo(w, y); x.stroke(); }
    const sh = x.createLinearGradient(0, 0, w, 0); sh.addColorStop(0, 'rgba(30,110,90,.35)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(232,184,80,.2)');
    x.fillStyle = sh; x.fillRect(0, 0, w, h);
    x.restore();
    x.strokeStyle = '#f0e2c0'; x.lineWidth = 3; x.beginPath(); x.moveTo(w / 2, h); x.quadraticCurveTo(w * 0.48, h * 0.5, w * 0.55, 6); x.stroke();
  }));
}

// 头颈皮肤：白顶 → 天蓝脸 → 粉红颈，带细小颗粒
export function headSkin() {
  const c = canvas(512, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#cfe2f6'); g.addColorStop(0.25, '#8cc0ec'); g.addColorStop(0.5, '#4f96dc'); g.addColorStop(0.75, '#5a7ccc'); g.addColorStop(1, '#c8546a');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = rng(4);
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.18})`; x.beginPath(); x.arc(r() * w, r() * h, 1 + r() * 2, 0, 7); x.fill(); }
  });
  const hc = canvas(256, 256, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.4})`; x.beginPath(); x.arc(r() * w, r() * h, 1 + r() * 2.5, 0, 7); x.fill(); } });
  return { map: tex(c), normalMap: normalFromHeight(hc, 2, [2, 2]) };
}

// 腿部鳞纹
export function legSkin() {
  const c = canvas(128, 256, (x, w, h) => {
    x.fillStyle = '#e88070'; x.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 14) { x.fillStyle = 'rgba(120,40,30,.35)'; x.fillRect(0, y, w, 2); }
    for (let y = 0; y < h; y += 14) for (let xx = (y / 14 % 2) * 10; xx < w; xx += 20) { x.fillStyle = 'rgba(255,200,180,.25)'; x.fillRect(xx, y + 3, 14, 8); }
  });
  return tex(c, { repeat: [2, 1] });
}

// ---------- 尾屏羽毛：512×1024 高清 ----------
export function tailFeatherTex(st) {
  const W = 512, H = 1024;
  return tex(canvas(W, H, (x) => {
    x.clearRect(0, 0, W, H);
    const shape = () => { x.beginPath(); x.moveTo(W / 2, H); x.bezierCurveTo(W * 0.1, H * 0.78, W * 0.02, H * 0.22, W / 2, 6); x.bezierCurveTo(W * 0.98, H * 0.22, W * 0.9, H * 0.78, W / 2, H); x.closePath(); };
    x.save(); shape(); x.clip();
    // 底色渐变
    const g = x.createLinearGradient(0, H, 0, 0);
    if (st.base === 'rainbow') ['#7a0c22', '#c8461a', '#e8b02a', '#3f8f74', '#2a5ab0', '#6a3a9a'].forEach((c, i) => g.addColorStop(i / 5, c));
    else { g.addColorStop(0, '#1a0f08'); g.addColorStop(0.32, st.edge); g.addColorStop(0.56, st.base); g.addColorStop(0.72, st.mid); g.addColorStop(0.88, st.base); g.addColorStop(1, st.edge); }
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // 细羽丝：从羽轴向外斜出，颜色明暗交替
    for (let i = 0; i < 260; i++) {
      const y = H * 0.04 + (i / 260) * H * 0.94;
      const a = i % 2 ? 'rgba(255,240,215,.14)' : 'rgba(0,0,0,.14)';
      x.strokeStyle = a; x.lineWidth = 1.3;
      x.beginPath(); x.moveTo(W / 2, y + 26); x.quadraticCurveTo(W * 0.3, y + 12, 0, y - 10); x.stroke();
      x.beginPath(); x.moveTo(W / 2, y + 26); x.quadraticCurveTo(W * 0.7, y + 12, W, y - 10); x.stroke();
    }
    // 古铜暗横纹
    for (let i = 0; i < 5; i++) { const y = H * (0.48 + i * 0.09); const gg = x.createLinearGradient(0, y - 10, 0, y + 10); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(0.5, 'rgba(25,12,6,.35)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(0, y - 10, W, 20); }
    // 眼斑：多层柔和椭圆 + 高光
    const cx = W / 2, cy = H * 0.2;
    const ring = (rx, ry, color, blur = 0) => { x.save(); x.filter = blur ? `blur(${blur}px)` : 'none'; x.fillStyle = color; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); x.restore(); };
    ring(W * 0.36, H * 0.15, 'rgba(0,0,0,.35)', 10);
    ring(W * 0.33, H * 0.135, st.ring);
    ring(W * 0.27, H * 0.11, '#f2c230');
    const eg = x.createRadialGradient(cx - W * 0.04, cy - H * 0.02, 4, cx, cy, W * 0.2);
    eg.addColorStop(0, st.eyeHi || '#3fd0b0'); eg.addColorStop(1, st.eye);
    x.fillStyle = eg; x.beginPath(); x.ellipse(cx, cy, W * 0.2, H * 0.08, 0, 0, 7); x.fill();
    ring(W * 0.09, H * 0.038, '#0d0a14');
    ring(W * 0.035, H * 0.016, 'rgba(255,255,255,.85)', 2);
    x.restore();
    // 金色羽缘 + 羽轴
    x.save(); shape(); x.lineWidth = 7; x.strokeStyle = 'rgba(242,194,48,.75)'; x.stroke(); x.restore();
    const sg = x.createLinearGradient(0, H, 0, 0); sg.addColorStop(0, 'rgba(255,236,200,.55)'); sg.addColorStop(1, 'rgba(255,241,208,.1)');
    x.strokeStyle = sg; x.lineWidth = 3; x.beginPath(); x.moveTo(W / 2, H); x.lineTo(W / 2, H * 0.3); x.stroke();
  }), { aniso: 16 });
}

// 红地毯：深酒红丝绒 + 暗金锦纹 + 两侧金色饰边（u 方向横跨地毯宽度）
export function carpetTex(length) {
  const c = canvas(512, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#5a0612'); g.addColorStop(0.5, '#8e0c20'); g.addColorStop(1, '#5a0612');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 14000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,90,100' : '30,0,6'},${r() * 0.1})`; x.fillRect(r() * w, r() * h, 1.5, 1.5); }
    // 锦纹：菱格 + 四瓣花
    x.strokeStyle = 'rgba(40,0,6,.22)'; x.lineWidth = 2;
    for (let k = -4; k < 8; k++) { x.beginPath(); x.moveTo(60 + k * 128, 0); x.lineTo(60 + k * 128 + 256, h); x.stroke(); x.beginPath(); x.moveTo(452 - k * 128, 0); x.lineTo(452 - k * 128 - 256, h); x.stroke(); }
    for (let yy = 0; yy <= h; yy += 128) for (let xx = 128; xx < w - 64; xx += 128) {
      const ox = xx + ((yy / 128) % 2 ? 64 : 0) - 64;
      if (ox < 70 || ox > w - 70) continue;
      x.fillStyle = 'rgba(214,160,70,.10)';
      for (let p = 0; p < 4; p++) { x.save(); x.translate(ox, yy); x.rotate(p * Math.PI / 2); x.beginPath(); x.ellipse(0, -14, 7, 14, 0, 0, 7); x.fill(); x.restore(); }
      x.fillStyle = 'rgba(232,190,90,.18)'; x.beginPath(); x.arc(ox, yy, 3, 0, 7); x.fill();
    }
    // 金色饰边
    for (const s of [0, 1]) {
      const ex = s ? w : 0, d = s ? -1 : 1;
      const bg = x.createLinearGradient(ex, 0, ex + d * 34, 0); bg.addColorStop(0, '#7a5214'); bg.addColorStop(0.4, '#e6bc52'); bg.addColorStop(1, '#a4741e');
      x.fillStyle = bg; x.fillRect(s ? w - 34 : 0, 0, 34, h);
      x.fillStyle = '#3a0408'; x.fillRect(s ? w - 40 : 34, 0, 6, h);
      x.fillStyle = '#d8aa44'; x.fillRect(s ? w - 50 : 44, 0, 4, h);
      x.fillStyle = 'rgba(90,50,10,.6)'; for (let yy = 0; yy < h; yy += 16) x.fillRect(s ? w - 30 : 4, yy, 26, 3);
    }
  });
  const hc = canvas(256, 256, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); const r = rng(8); for (let i = 0; i < 9000; i++) { const v = r() < 0.5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},.08)`; x.fillRect(r() * w, r() * h, 1, 1); } });
  return { map: tex(c, { repeat: [1, length / 7], aniso: 16 }), normalMap: normalFromHeight(hc, 1.5, [2, length / 5]) };
}

// 地形细节贴图：近白的草叶笔触（与顶点色相乘，近处有质感，远处不脏）
export function grassDetailTex() {
  const c = canvas(512, 512, (x, w, h) => {
    x.fillStyle = '#d8d8d0'; x.fillRect(0, 0, w, h);
    const r = rng(17);
    for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,240' : '150,160,120'},.18)`; x.beginPath(); x.arc(r() * w, r() * h, 18 + r() * 40, 0, 7); x.fill(); }
    for (let i = 0; i < 16000; i++) {
      const v = r(); x.strokeStyle = v < 0.45 ? 'rgba(255,255,235,.55)' : v < 0.9 ? 'rgba(120,135,90,.45)' : 'rgba(230,170,90,.5)';
      x.lineWidth = 1; const px = r() * w, py = r() * h, a = -Math.PI / 2 + (r() - 0.5) * 0.9, L = 3 + r() * 6;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke();
    }
  });
  return tex(c, { repeat: [60, 160], aniso: 16 });
}

// 草地：多层噪点 + 色块
export function grassTex() {
  const c = canvas(512, 512, (x, w, h) => {
    x.fillStyle = '#6a9a34'; x.fillRect(0, 0, w, h);
    const r = rng(11);
    for (let i = 0; i < 140; i++) { const gr = x.createRadialGradient(r() * w, r() * h, 0, 0, 0, 0); void gr; x.fillStyle = `rgba(${r() < 0.5 ? '120,160,60' : '80,120,40'},.25)`; x.beginPath(); x.arc(r() * w, r() * h, 20 + r() * 50, 0, 7); x.fill(); }
    for (let i = 0; i < 9000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(150,190,80,.5)' : 'rgba(60,100,30,.5)'; x.fillRect(r() * w, r() * h, 1.5, 3 + r() * 3); }
    for (let i = 0; i < 260; i++) { x.fillStyle = ['#d9681e', '#c8461a', '#e8a22a', '#a83a1a'][i % 4]; x.save(); x.translate(r() * w, r() * h); x.rotate(r() * 6); x.beginPath(); x.ellipse(0, 0, 4, 2.5, 0, 0, 7); x.fill(); x.restore(); }
  });
  return tex(c, { repeat: [24, 60] });
}

export function barkTex() {
  return tex(canvas(128, 256, (x, w, h) => {
    x.fillStyle = '#5a3a22'; x.fillRect(0, 0, w, h);
    const r = rng(2);
    for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(${r() < 0.5 ? '30,18,10' : '120,90,60'},.5)`; x.lineWidth = 1 + r() * 2; const xx = r() * w; x.beginPath(); x.moveTo(xx, 0); x.bezierCurveTo(xx + 6, h * 0.3, xx - 6, h * 0.6, xx + 3, h); x.stroke(); }
  }), { repeat: [2, 1] });
}

export function strawTex() {
  return tex(canvas(256, 256, (x, w, h) => {
    x.fillStyle = '#d8b25a'; x.fillRect(0, 0, w, h);
    const r = rng(6);
    for (let i = 0; i < 1600; i++) { x.strokeStyle = r() < 0.5 ? 'rgba(255,230,150,.6)' : 'rgba(140,100,40,.5)'; x.lineWidth = 1; const xx = r() * w, yy = r() * h, a = (r() - 0.5) * 0.6; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + Math.cos(a) * 20, yy + Math.sin(a) * 20); x.stroke(); }
  }), { repeat: [2, 1] });
}
export function strawEndTex() {
  return tex(canvas(256, 256, (x, w, h) => {
    x.fillStyle = '#c9a050'; x.fillRect(0, 0, w, h);
    for (let r = 4; r < w / 2; r += 5) { x.strokeStyle = r % 10 ? 'rgba(255,225,150,.55)' : 'rgba(120,85,35,.5)'; x.lineWidth = 2.5; x.beginPath(); x.arc(w / 2, h / 2, r, 0, 7); x.stroke(); }
  }));
}

export function skyTex(stops) {
  const st = stops || [[0, '#1f5fb8'], [0.3, '#3f8ad8'], [0.42, '#7ab8e8'], [0.48, '#c6dff0'], [0.5, '#ffe2bc'], [0.53, '#ffcf98'], [1, '#e8b884']];
  return tex(canvas(16, 1024, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    st.forEach(([k, c]) => g.addColorStop(k, c));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }));
}
export function cloudTex() {
  return tex(canvas(256, 128, (x, w, h) => {
    const r = rng(12);
    for (let i = 0; i < 14; i++) { const cx = 40 + r() * (w - 80), cy = 60 + (r() - 0.5) * 30, rr = 20 + r() * 30; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,250,240,.95)'); g.addColorStop(1, 'rgba(255,240,225,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); }
  }));
}
export function softDot() {
  return tex(canvas(64, 64, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }));
}
