from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse, socket, sys, urllib.request, webbrowser
parser=argparse.ArgumentParser()
parser.add_argument('--port',type=int,default=8898)
parser.add_argument('--lan',action='store_true')
parser.add_argument('--open',action='store_true')
args=parser.parse_args()
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'application/javascript'}
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Game','skyblock-frontier')
        super().end_headers()
class Server(ThreadingHTTPServer):
    allow_reuse_address=sys.platform!='win32'
    def server_bind(self):
        if sys.platform=='win32' and hasattr(socket,'SO_EXCLUSIVEADDRUSE'):
            self.socket.setsockopt(socket.SOL_SOCKET,socket.SO_EXCLUSIVEADDRUSE,1)
        super().server_bind()
url=f'http://127.0.0.1:{args.port}/'
try:
    server=Server(('0.0.0.0' if args.lan else '127.0.0.1',args.port),partial(Handler,directory=str(Path(__file__).resolve().parent)))
except OSError as bind_error:
    try:
        with urllib.request.urlopen(url,timeout=2) as response:
            same=response.headers.get('X-Game')=='skyblock-frontier'
    except OSError:same=False
    if same:
        print(f'Already running: {url}',flush=True)
        if args.open:webbrowser.open(url)
        sys.exit(0)
    print(f'Could not start {url}: {bind_error}. Try --port {args.port+1}',flush=True)
    sys.exit(1)
print(f'Skyblock Frontier: {url}',flush=True)
if args.open:webbrowser.open(url)
server.serve_forever()

