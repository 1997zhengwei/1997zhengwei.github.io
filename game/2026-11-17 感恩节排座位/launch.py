from pathlib import Path
import subprocess,sys,time,webbrowser,urllib.request
root=Path(__file__).resolve().parent
for port in range(8901,8911):
    try:
        with urllib.request.urlopen(f'http://localhost:{port}/',timeout=.7) as response:
            if response.headers.get('X-Game-App')=='thanksgiving-seating':
                webbrowser.open(f'http://localhost:{port}/')
                raise SystemExit(0)
        continue
    except OSError:
        pass
    process=subprocess.Popen([sys.executable,str(root/'serve.py'),'--port',str(port)],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    for _ in range(25):
        time.sleep(.1)
        if process.poll() is not None:
            break
        try:
            with urllib.request.urlopen(f'http://localhost:{port}/',timeout=.3) as response:
                if response.headers.get('X-Game-App')=='thanksgiving-seating':
                    webbrowser.open(f'http://localhost:{port}/')
                    raise SystemExit(0)
        except OSError:
            pass
raise SystemExit('No available local port. Please run serve.py --port <free-port>.')
