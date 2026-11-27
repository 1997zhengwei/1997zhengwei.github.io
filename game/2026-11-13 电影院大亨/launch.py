from pathlib import Path
import argparse,subprocess,sys,socket,time,urllib.request,webbrowser
root=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description='Open Starlight Cinema locally')
parser.add_argument('--check',action='store_true')
parser.add_argument('--no-browser',action='store_true')
args=parser.parse_args()
def healthy(port):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/',timeout=.5) as response:
            return response.headers.get('X-Game-App')=='starlight-cinema'
    except Exception:return False
port=8842
if args.check:
    print(f'http://localhost:{port}/ '+('ready' if healthy(port) else 'not running'))
    raise SystemExit(0 if healthy(port) else 1)
if not healthy(port):
    for candidate in range(8842,8853):
        if healthy(candidate):port=candidate;break
        try:
            with socket.socket() as probe:probe.bind(('127.0.0.1',candidate))
            port=candidate
            (root/'qa').mkdir(exist_ok=True)
            with (root/'qa/server-launch.log').open('ab') as log:
                subprocess.Popen([sys.executable,str(root/'serve.py'),'--port',str(port)],cwd=root,stdout=log,stderr=log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0),close_fds=True)
            break
        except OSError:continue
    for _ in range(30):
        if healthy(port):break
        time.sleep(.1)
if not healthy(port):
    print('Server did not start. Run python serve.py --port 8842 from this folder.')
    raise SystemExit(1)
url=f'http://localhost:{port}/'
print('Starlight Cinema: '+url)
if not args.no_browser:webbrowser.open(url)
