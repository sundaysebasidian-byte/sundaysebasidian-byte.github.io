# Android test App — 0.3.0-android.2

This is a private installable hybrid Android App built from frozen browser rc15 (`58a6053fdea45f936e141bc1178e222a2ba6d38b`) in an isolated branch. Android owns the launcher, native Explore/Trip/Notebook bar, system Back, lifecycle/insets, system document actions and renderer recovery. Authored screens, Forest/Tidal/Clay and MiniLM run in a bundled WebView. It is not fully native-rendered UI or a browser shortcut. The original browser checkout and review launcher remain recoverable and untouched.

## Offline model and privacy

The APK includes four unchanged Apache-2.0 model files: Xenova/all-MiniLM-L6-v2 revision `751bff37182d3f1213fa05d7196b954e230abad9`, q8 ONNX/WASM, 384 dimensions, twenty authored cards. The manifest records 23,685,047 uncompressed model bytes and all SHA256 hashes. Runtime, model license and attribution are included. No Internet or other manifest permission is requested. No account, API key, location, camera, analytics or automatic sync.

Notebook, themes and the active trip use app-private WebView storage. Unfinished discovery writing has a separate bounded local recovery copy when writes can be verified. Restart presents Resume/Discard; recovery never automatically records a discovery or completion. Its exact original trip token prevents ending a newer trip. Unsupported recovery is preserved and can be exported as an unverified copy. Intent is deliberately not stored. Clearing Android app data or uninstalling removes local records; make a JSON backup first.

## Build

Use an already installed JDK17, Android platform36/build-tools36 and Node22.12+. This task uses existing locked npm dependencies; a fresh npm installation is not an executed acceptance claim.

```
npm ci
python3 android/fetch-model.py
npm run build
python3 android/build.py --sdk /path/to/sdk
```

Unsigned output cannot install. Supply a disposable **test-only** keystore using alias `pft-test` and standard test password `android` via `--test-keystore`; the supplied APK is debug-signed with this task's own test certificate. No user's existing signing material was read. Keys, credentials, machine caches and emulator images are excluded from delivery. It cannot update an older APK signed by another key. Do not uninstall a previous app before exporting notes. No device installation has been performed for the user.

## Try the supplied debug APK

Minimum Android10/API29, target36. Copy the APK to a device you control, inspect its identity/hash and choose whether to permit this single installation. Installation is a separate user action. Compatibility below/above the tested Android16 emulator is declared SDK scope, not a tested device matrix.

1. Start offline. In Explore, enter an English intention or preview an authored card. A real match has 384-dimension evidence; the authored/keyword guide states no AI.
2. In Trip, open the pocket card and explicitly Start. Put the phone away; the App stores no route, location or timer.
3. Return via native Trip, keep a discovery, then Save. It appears in Notebook and finishes only the linked trip. Revisit the card from its saved note.
4. Put writing in the background, rotate or force a test restart. Resume the private recovered draft; Save and Discard have distinct effects.
5. Notebook → Backup opens the system document chooser. Only external content documents with explicit Android access grants are accepted. Imports are copied to temporary app-private files after a bounded actual-byte read (2 MiB), then enter the existing reviewed preview and confirmation. Cancel changes no notebook bytes. Save succeeds only after provider readback matches; unverifiable/partial output is described without a complete-save claim. Interrupted transfers explicitly warn that an export copy may exist and allow another action; only genuinely outstanding chooser tokens are restored.
6. Change Forest/Tidal/Clay; native navigation follows. Default depth is off. Try large Android text and the keyboard; system bars/cutouts remain outside the content.

The renderer recovery view preserves stored records; it cannot recover unsaved intent or guarantee data survives device failure. Diagnostics through WebView debugging are enabled in this **debug test artifact**. This is not production signing, Play Store publication, a physical-phone, battery, TalkBack, outdoor-benefit or cloud-provider acceptance.

Ten separate implementation milestones and evidence attribution are in ANDROID-TEN-ROUNDS.md and the delivery evidence. Failed attempts are retained. Public repository/demo/DEV submission, registration, terms, fees and shop publication remain unperformed.
