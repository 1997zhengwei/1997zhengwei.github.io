// 在 worker 里生成耳朵网格，主线程不卡
import { buildEar, buildHead, getField, setParams } from './ear-sdf.js';
self.onmessage = e => {
  if (e.data && e.data.params) setParams(e.data.params);
  const t = performance.now();
  const ear = buildEar();
  const head = buildHead();
  const f = getField();
  const buf = [ear.positions.buffer, ear.normals.buffer, ear.index.buffer, ear.thick.buffer, ear.ao.buffer, ear.depth.buffer, head.positions.buffer, head.normals.buffer, head.index.buffer];
  self.postMessage({ ear, head, field: { nx: f.nx, ny: f.ny, SD: f.SD.slice(), S: f.S.slice(), B: f.B.slice(), H: f.H.slice(), RW: f.RW.slice() }, ms: performance.now() - t }, buf);
};
