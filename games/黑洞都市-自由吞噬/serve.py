from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import argparse, socket, sys, urllib.request, webbrowser
parser=argparse.ArgumentParser()
parser.add_argument('--port',type=int,default=8793)
parser.add_argument('--open',action='store_true')
parser.add_argument('--page',default='arena.html')
args=parser.parse_args()
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Game-App','black-hole-rush')
        super().end_headers()
class Server(ThreadingHTTPServer):
    allow_reuse_address=sys.platform!='win32'
    def server_bind(self):
        if hasattr(socket,'SO_EXCLUSIVEADDRUSE'):
            self.socket.setsockopt(socket.SOL_SOCKET,socket.SO_EXCLUSIVEADDRUSE,1)
        super().server_bind()
url=f'http://127.0.0.1:{args.port}/'
play_url=url+args.page.lstrip('/')
try:
    server=Server(('127.0.0.1',args.port),partial(Handler,directory=str(Path(__file__).resolve().parent)))
except OSError:
    try:
        with urllib.request.urlopen(url,timeout=2) as r: same=r.headers.get('X-Game-App')=='black-hole-rush'
    except OSError: same=False
    if same:
        if args.open: webbrowser.open(play_url)
        print(play_url,flush=True)
        sys.exit(0)
    print(f'Port {args.port} is occupied. Try --port {args.port+1}.',flush=True)
    sys.exit(1)
print(f'Black Hole Rush: {url}',flush=True)
if args.open: webbrowser.open(play_url)
try: server.serve_forever()
except KeyboardInterrupt: pass
finally: server.server_close()
