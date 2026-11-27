import { execFile, spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const url = 'http://127.0.0.1:8954/';

async function status() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(450) });
    await response.body?.cancel();
    return response.headers.get('X-Game-App') === 'wreck-magnet' ? 'ready' : 'occupied';
  } catch {
    return 'closed';
  }
}

let state = await status();
if (state === 'closed') {
  const script = fileURLToPath(new URL('./server.mjs', import.meta.url));
  const child = spawn(process.execPath, [script], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  for (let attempt = 0; attempt < 25 && state === 'closed'; attempt++) {
    await delay(120);
    state = await status();
  }
}
if (state !== 'ready') {
  console.error('沉船磁铁捞宝启动失败。请检查本机 8954 端口。');
  process.exitCode = 1;
} else {
  console.log(url);
  if (process.platform === 'win32' && !process.argv.includes('--no-open')) {
    execFile('cmd.exe', ['/d', '/c', 'start', '', url], { windowsHide: true });
  }
}
