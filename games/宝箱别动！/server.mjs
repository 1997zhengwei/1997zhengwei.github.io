import { createServer } from 'node:http';
import { createReadStream, stat } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript' };
const port = Number(process.env.PORT || 8993);

createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  const file = resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  const type = mime[extname(file)];
  if (!file.startsWith(root + sep) || !type) {
    response.writeHead(404).end();
    return;
  }
  stat(file, (error, info) => {
    if (error || !info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': `${type}; charset=utf-8`, 'Cache-Control':'no-cache', 'X-Game-App':'box-heist',
    });
    createReadStream(file).pipe(response);
  });
}).listen(port, '127.0.0.1', () => console.log(`宝箱别动！ · http://127.0.0.1:${port}/`));
