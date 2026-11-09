from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import functools, webbrowser, threading

root=Path(__file__).resolve().parent
handler=functools.partial(SimpleHTTPRequestHandler,directory=str(root))
for port in range(8786,8800):
    try:
        server=ThreadingHTTPServer(('127.0.0.1',port),handler)
        break
    except OSError: pass
else: raise RuntimeError('No local preview port available')
url=f'http://127.0.0.1:{port}/'
print('ASHFALL local preview:',url,flush=True)
threading.Timer(.7,lambda:webbrowser.open(url)).start()
try: server.serve_forever()
except KeyboardInterrupt: pass
