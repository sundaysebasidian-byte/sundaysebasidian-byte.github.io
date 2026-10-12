"""Build a private debug APK with installed Android SDK/JDK, without Gradle downloads."""
import argparse, pathlib, subprocess, shutil, zipfile, json, hashlib, re, xml.etree.ElementTree as ET
p=argparse.ArgumentParser();p.add_argument('--sdk',default='/opt/homebrew/share/android-commandlinetools');p.add_argument('--test-keystore');args=p.parse_args()
root=pathlib.Path(__file__).resolve().parent;sdk=pathlib.Path(args.sdk);tools=sdk/'build-tools/36.0.0';jar=sdk/'platforms/android-36/android.jar';build=root/'build'
if not (root.parent/'dist/index.html').is_file():raise SystemExit('Build the current web source first')
if build.exists():shutil.rmtree(build)
for name in ['classes','dex','assets']:(build/name).mkdir(parents=True)
shutil.copytree(root.parent/'dist',build/'assets/web');shutil.copyfile(root/'native-support.js',build/'assets/native-support.js')
identity=subprocess.run(['git','rev-parse','HEAD'],cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
if identity.returncode == 0:
 revision=identity.stdout.strip();dirty=bool(subprocess.check_output(['git','status','--porcelain','--untracked-files=all'],cwd=root,text=True))
else:
 source=json.loads((root.parent/'SOURCE.json').read_text())
 for name,digest in source['sha256'].items():
  if hashlib.sha256((root.parent/name).read_bytes()).hexdigest()!=digest:raise SystemExit('Exported source changed: '+name)
 revision=source['commit'];dirty=False
guide=re.search(r'/assets/index-([^/]+)\.js', (root.parent/'dist/index.html').read_text()).group(1)
(build/'assets/build-info.json').write_text(json.dumps({'apkVersion':ET.parse(root/'AndroidManifest.xml').getroot().attrib['{http://schemas.android.com/apk/res/android}versionName'],'sourceCommit':revision,'sourceDirty':dirty,'guide':guide}))
subprocess.run(['node',str(root.parent/'scripts/native-update.mjs'),str(build/'assets')],check=True,cwd=root.parent)
model=json.loads((root/'model-manifest.json').read_text())
for name,spec in model['files'].items():
 source=root/'model'/name
 if not source.is_file() or source.stat().st_size!=spec['bytes'] or hashlib.sha256(source.read_bytes()).hexdigest()!=spec['sha256']:raise SystemExit('Missing/mismatched model: run python3 android/fetch-model.py')
 target=build/'assets/web/models'/model['revision']/model['model']/name
 target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
shutil.copyfile(root/'model-manifest.json',build/'assets/web/model-manifest.json')
shutil.copyfile(root/'MODEL-LICENSE.txt',build/'assets/web/MODEL-LICENSE.txt')
(build/'assets/web/MODEL-NOTICE.txt').write_text('Xenova/all-MiniLM-L6-v2, ONNX conversion of sentence-transformers/all-MiniLM-L6-v2. Unchanged pinned q8 model files. Apache-2.0. See MODEL-LICENSE.txt and model-manifest.json for source, revision and byte hashes.\n')

def run(*command):subprocess.run([str(x) for x in command],check=True,cwd=root)
run('/usr/bin/javac','--release','8','-classpath',jar,'-d',build/'classes',*sorted((root/'src').rglob('*.java')))
run(tools/'d8','--lib',jar,'--min-api','29','--output',build/'dex',*sorted((build/'classes').rglob('*.class')))
run(tools/'aapt2','compile','--dir',root/'res','-o',build/'resources.zip')
run(tools/'aapt2','link','-I',jar,'--manifest',root/'AndroidManifest.xml','-A',build/'assets','-o',build/'unaligned.apk','-R',build/'resources.zip')
with zipfile.ZipFile(build/'unaligned.apk','a',zipfile.ZIP_DEFLATED) as z:
 for f in (build/'dex').glob('*.dex'):z.write(f,f.name)
run(tools/'zipalign','-p','-f','4',build/'unaligned.apk',build/'pocket-field-trip-unsigned.apk')
output=build/'pocket-field-trip-unsigned.apk'
if args.test_keystore:
 key=pathlib.Path(args.test_keystore).resolve()
 if not key.is_file():raise SystemExit('Task-owned test keystore required')
 output=build/'pocket-field-trip-debug.apk'
 run(tools/'apksigner','sign','--ks',key,'--ks-key-alias','pft-test','--ks-pass','pass:android','--key-pass','pass:android','--out',output,build/'pocket-field-trip-unsigned.apk')
 run(tools/'apksigner','verify','--verbose',output)
status=dirty
report={'apk':str(output),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'debugSignedWithTaskTestKey':bool(args.test_keystore),'releaseSigning':False,'modelWeightsBundled':True,'modelManifest':model,'webBaseCommit':'58a6053fdea45f936e141bc1178e222a2ba6d38b','sourceCommit':revision,'sourceDirty':bool(status),'distSHA256':{str(f.relative_to(root.parent/'dist')):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted((root.parent/'dist').rglob('*')) if f.is_file()}}
(build/'BUILD.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='distSHA256'},indent=2))
