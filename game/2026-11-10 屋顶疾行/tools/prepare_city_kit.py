from pathlib import Path
import zipfile,json,hashlib
game=Path(__file__).resolve().parents[1]
archive=Path('C:/Users/Administrator/Downloads/Downtown City MegaKit[Standard].zip')
target=game/'assets'/'city-kit';target.mkdir(exist_ok=True)
z=zipfile.ZipFile(archive)
models=['Brick_Window_Trim','Trim_Window','Cornice_Brick_Center','Building_Medium_2_001','Building_Small_1','Building_Large_2']
files=set()
for name in models:
    path='Exports/glTF (Godot)/'+name+'.gltf';doc=json.loads(z.read(path));files.add(path)
    files.update('Exports/glTF (Godot)/'+b['uri'] for b in doc.get('buffers',[]))
    files.update('Exports/glTF (Godot)/'+b['uri'] for b in doc.get('images',[]))
manifest=[]
for path in sorted(files):
    data=z.read(path);out=target/Path(path).name;out.write_bytes(data)
    manifest.append({'file':out.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
(target/'LICENSE.txt').write_bytes(z.read('License_Standard.txt'))
(target/'sources.json').write_text(json.dumps({'source':'https://quaternius.itch.io/downtown-city-megakit','author':'Quaternius','license':'CC0-1.0','downloadVersion':'Standard / 2026-05-20','files':manifest},indent=2),encoding='utf-8')
print('Prepared',len(files),'files;',sum(f['bytes'] for f in manifest),'bytes')
