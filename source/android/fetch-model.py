"""Fetch only public pinned model files and verify every recorded byte hash."""
from pathlib import Path
import json,urllib.request,hashlib
root=Path(__file__).resolve().parent
manifest=json.loads((root/'model-manifest.json').read_text())
for name,spec in manifest['files'].items():
 target=root/'model'/name;target.parent.mkdir(parents=True,exist_ok=True)
 if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest()==spec['sha256']:continue
 with urllib.request.urlopen(manifest['source']+name,timeout=90) as response: data=response.read()
 if len(data)!=spec['bytes'] or hashlib.sha256(data).hexdigest()!=spec['sha256']:raise SystemExit('Pinned model hash mismatch: '+name)
 target.write_bytes(data);print('Verified',name,len(data))
