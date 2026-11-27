"""Open this local game, reusing only its own existing server."""
from pathlib import Path
import subprocess
import sys
import time
import urllib.request
import webbrowser

game_dir = Path(__file__).resolve().parent
port = 8830
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def healthy():
    try:
        with opener.open(f'http://127.0.0.1:{port}/', timeout=0.5) as response:
            return response.headers.get('X-Game-App') == 'aqua-coast'
    except (OSError, urllib.error.URLError):
        return False

if not healthy():
    log_dir = game_dir / 'qa'
    log_dir.mkdir(exist_ok=True)
    with (log_dir / 'server.log').open('ab') as out, (log_dir / 'server-error.log').open('ab') as err:
        process = subprocess.Popen(
            [sys.executable, str(game_dir / 'serve.py'), '--port', str(port)],
            cwd=game_dir, stdout=out, stderr=err,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0)
    for _ in range(30):
        if healthy():
            break
        if process.poll() is not None:
            raise SystemExit('Port 8830 is unavailable. Start serve.py with another --port value.')
        time.sleep(0.15)
    else:
        raise SystemExit('The local game server did not start. See qa/server-error.log.')
webbrowser.open(f'http://localhost:{port}/')
