"""Compile a separate private instrumentation APK with already installed SDK/JDK."""
import argparse, pathlib, subprocess, zipfile
p = argparse.ArgumentParser()
p.add_argument('--test-keystore', required=True)
p.add_argument('--sdk', default='/opt/homebrew/share/android-commandlinetools')
p.add_argument('--out', required=True)
a = p.parse_args()
root = pathlib.Path(__file__).resolve().parent
out = pathlib.Path(a.out).resolve()
out.mkdir(parents=True, exist_ok=True)
tools = pathlib.Path(a.sdk) / 'build-tools/36.0.0'
jar = pathlib.Path(a.sdk) / 'platforms/android-36/android.jar'
(out/'classes').mkdir(exist_ok=True)
(out/'dex').mkdir(exist_ok=True)
def run(*args): subprocess.run([str(x) for x in args], check=True)
run('/usr/bin/javac','--release','8','-classpath',jar,'-d',out/'classes',*sorted(root.glob('*.java')))
run(tools/'d8','--lib',jar,'--min-api','29','--output',out/'dex',*sorted((out/'classes').rglob('*.class')))
run(tools/'aapt2','link','-I',jar,'--manifest',root/'AndroidManifest.xml','-o',out/'unaligned.apk')
with zipfile.ZipFile(out/'unaligned.apk','a',zipfile.ZIP_DEFLATED) as z:
 for f in (out/'dex').glob('*.dex'): z.write(f,f.name)
run(tools/'zipalign','-p','-f','4',out/'unaligned.apk',out/'unsigned.apk')
run(tools/'apksigner','sign','--ks',pathlib.Path(a.test_keystore).resolve(),'--ks-key-alias','pft-test','--ks-pass','pass:android','--key-pass','pass:android','--out',out/'private-boundary-test.apk',out/'unsigned.apk')
run(tools/'apksigner','verify',out/'private-boundary-test.apk')
