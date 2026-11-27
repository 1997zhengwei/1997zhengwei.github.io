from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import argparse,socket,sys
parser=argparse.ArgumentParser()
parser.add_argument('--port',type=int,default=8842)
args=parser.parse_args()
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Game-App','starlight-cinema')
        super().end_headers()
class Server(ThreadingHTTPServer):
    allow_reuse_address=sys.platform!='win32'
    def server_bind(self):
        if hasattr(socket,'SO_EXCLUSIVEADDRUSE'):self.socket.setsockopt(socket.SOL_SOCKET,socket.SO_EXCLUSIVEADDRUSE,1)
        super().server_bind()
server=Server(('127.0.0.1',args.port),partial(Handler,directory=str(Path(__file__).resolve().parent)))
print(f'Starlight Cinema: http://localhost:{args.port}/',flush=True)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
