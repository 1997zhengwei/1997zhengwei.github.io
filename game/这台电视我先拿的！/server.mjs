import { createServer } from 'node:http';
import { createReadStream, stat } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.png':'image/png' };
const port = Number(process.env.PORT || 8994);
const v2WalletPreview = process.env.CART_WALLET_SOURCE === 'v2';

createServer((request, response) => {
  let url, pathname;
  try {
    url = new URL(request.url, 'http://localhost');
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  if(v2WalletPreview&&(pathname==='/'||pathname==='/index.html')&&!url.searchParams.has('wallet')){
    url.searchParams.set('wallet','v2');
    response.writeHead(302,{'Location':url.pathname+url.search,'Cache-Control':'no-store'}).end();
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
      'Content-Type': type.startsWith('text/') ? `${type}; charset=utf-8` : type, 'Cache-Control':'no-cache', 'X-Game-App':'cart-rush',
    });
    createReadStream(file).pipe(response);
  });
}).listen(port, '127.0.0.1', () => console.log(`这台电视我先拿的！ · http://127.0.0.1:${port}/`));
