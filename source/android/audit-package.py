"""Read-only packaged boundary audit, not runtime Android acceptance."""
from pathlib import Path
import zipfile,subprocess,json,hashlib,sys
root=Path(__file__).resolve().parent;apk=Path(sys.argv[1]) if len(sys.argv)>1 else root/'build/pocket-field-trip-debug.apk'
aapt='/opt/homebrew/share/android-commandlinetools/build-tools/36.0.0/aapt2'
permissions=subprocess.check_output([aapt,'dump','permissions',str(apk)],text=True)
assert 'uses-permission:' not in permissions, permissions
manifest=json.loads((root/'model-manifest.json').read_text())
with zipfile.ZipFile(apk) as z:
 for name,spec in manifest['files'].items():
  data=z.read('assets/web/models/'+manifest['revision']+'/'+manifest['model']+'/'+name)
  assert len(data)==spec['bytes'] and hashlib.sha256(data).hexdigest()==spec['sha256'],name
 assert 'assets/web/MODEL-LICENSE.txt' in z.namelist()
 assert not any(n.endswith(('.keystore','.jks','.p12','.env')) for n in z.namelist())
 report={'apk':str(apk),'zeroManifestPermissions':True,'pinnedFiles':4,'bundledModelBytes':manifest['totalBytes'],'keysIncluded':False,'licenseIncluded':True,'testBuild':True}
 print(json.dumps(report,indent=2))
