"""Standalone local preview. All game assets are bundled; no install or build."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8774)
args = parser.parse_args()
root = Path(__file__).resolve().parent

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'application/javascript', '.js': 'application/javascript'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Tidehaven-Preview', '1')
        super().end_headers()

server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(root)))
print(f'Tidehaven local preview: http://127.0.0.1:{args.port}/', flush=True)
server.serve_forever()
