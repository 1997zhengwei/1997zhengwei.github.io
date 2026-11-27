import { createReadStream, stat } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 9282);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};

const server = createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  const mime = contentTypes[extname(file)];
  if (!file.startsWith(root + sep) || !mime) {
    response.writeHead(404).end();
    return;
  }
  stat(file, (error, info) => {
    if (error || !info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache', 'X-Game-App': 'ear-spa' });
    createReadStream(file).pipe(response);
  });
});
server.listen(PORT, '127.0.0.1', () => console.log(`采耳小馆 · http://127.0.0.1:${PORT}/`));
