# Pocket Field Trip

One outdoor observation. Three small steps. Then put the screen away.

Describe your intention in English and choose time, setting and movement. Local open-weight MiniLM ranks twenty authored cards that satisfy those constraints. Read the complete instructions, keep a pocket cue and optionally return to one private notebook sentence. No location tracking, feed, timer or streak. Confirm weather, safety and access yourself; the guide does not know local conditions.

## Editions

The browser edition uses TypeScript, Vite, a Web Worker and Transformers.js. Initial acquisition needs Internet; later offline use requires complete, retained app/model/runtime caches. It does not guarantee browser storage retention.

The Android test edition is a **native Java host plus bundled WebView/WASM**, not purely native-rendered UI. It includes the four pinned model files and runtime, requests zero manifest permissions, and has no remote inference fallback. Android owns navigation, Back, lifecycle, system document actions and renderer recovery. The supplied APK is private debug-signed; production signing and Play Store publication are outside this release.

## Open AI

`Xenova/all-MiniLM-L6-v2`, pinned revision `751bff37182d3f1213fa05d7196b954e230abad9`, q8 ONNX, mean pooling and normalized 384-dimensional embeddings. The model retrieves reviewed prose; it does not generate routes or identify species. Constraints filter before cosine ranking. The UI exposes an exact-keyword baseline and a no-AI fallback. Similarity is not safety or calibrated confidence.

Model attribution: [Sentence Transformers original](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), [pinned Xenova conversion](https://huggingface.co/Xenova/all-MiniLM-L6-v2/blob/751bff37182d3f1213fa05d7196b954e230abad9/README.md), [Transformers.js](https://github.com/huggingface/transformers.js). Original application code/prose/artwork use MIT. Retain `LICENSE`, `android/MODEL-LICENSE.txt`, `android/model-manifest.json`, `docs/DEPENDENCY-LICENSES.json`, `docs/third-party-licenses/` and generated `THIRD-PARTY-NOTICES.txt` when distributing.

## Build and run

Node22.12+, installed compatible dependencies and an English-capable modern WASM browser:

```sh
cd source
npm ci
npm run build
npm run preview
```

Android build requires an installed JDK and platform36/build-tools36:

```sh
cd source
python3 android/fetch-model.py
npm run build
python3 android/build.py --sdk /path/to/android-sdk
```

Unsigned output cannot install. Use your own disposable test key only after reading `docs/ANDROID-REVIEW.md`; this package contains no signing key. Do not uninstall an existing app before making a notebook backup. Avoid installing the separate synthetic instrumentation fixture on a user's phone.

## Verification and limits

Code freeze: Android `4c7728b435ed8c94edb1e1b9a210469636025e77` (`0.3.0-android.4`); browser `58a6053fdea45f936e141bc1178e222a2ba6d38b` (rc15). Later publication documentation must be identified separately from these code hashes.

106 unit tests pass, with formatting and web/APK builds. The `.4` candidate fixes demonstrated post-success notebook loss: protected `.3` lost entries in4/4 immediate-stop runs; final `.4` preserved entries in4/4 without a post-receipt settling delay. Android now awaits a serialized private AtomicFile write, file-descriptor sync and exact-byte readback before success. A deterministic latch/recreation fixture rejects a destroyed owner’s queued journal mutation; separate real UI tests exercise the native port receipt.

Only the journal is the durable unit. WebView trip/draft removals are not atomic with it; an orphan old trip survived3/4 final rapid-stop trials and is conservatively retained. Native failure/timeout does not claim success. A native write followed by cache failure warns that the notebook was written, keeps the draft and locks further writes until reopening. No survival of arbitrary OS/kernel/storage failure, power loss, uninstall or app-data clearing is promised. See `docs/ANDROID-DURABLE-JOURNAL.md` and the final private execution records.

Earlier actual Android16 ARM64 document actions, URI grants, bounded imports, offline model failure/retry and cold/warm inference retain their recorded versions. Browser offline/cache acceptance is unchanged and version-attributed.

No physical-phone, manual screen-reader, Chinese IME, outdoor benefit, battery, long-term storage, cloud-provider or production-signing claim. Existing locked dependencies were used for acceptance; a fresh dependency install has not been an executed acceptance check. The edited demo uses attributed historical screenshots, not a final-version continuous recording.

## Privacy

Intent is used in memory for matching and excluded from saved notebook/trip records. Optional notes and recovery copies stay in private local storage; explicit backups can contain private writing. Native document actions require an explicit choice, preview on import and verified receipts on export. An interrupted export may leave a partial or complete copy. Clearing app data, uninstalling or losing browser storage can remove records. No cross-device sync is implemented. Browser first downloads expose ordinary connection metadata to resource hosts.

## Demo and entry

Public demo/video: `{{PUBLIC_DEMO_OR_VIDEO_URL}}`

DEV article: `{{DEV_ARTICLE_URL_AFTER_PERSONAL_SUBMISSION}}`

The project started during Hacktoberfest Week 1; its first recorded commit is October6, 2026, 03:28:45 UTC. Confirm the new remote repository creation date and final entry receipt before claiming contest compliance. AI agents assisted code, activity writing, documentation and review. Human contributors and DEV handles must be confirmed before publication.

## Post-deadline changes

At this October11 documentation preparation, no post-deadline changes have been made. Any commit after **October12, 2026, 06:59 UTC** must be recorded here with date, hash and scope. Do not backdate a public repository or substitute a previously submitted project.

## Public hosting identity

This repository publishes an unchanged, already-built browser front-end from frozen Android-source candidate4c7728b. Source is in `source/`; SOURCE.json records original frozen file hashes. Root HTML/runtime assets are the original verified dist bytes, without a new build or path rewrite. This root GitHub Pages repository is used because the existing front-end expects origin-root asset/runtime paths. It is a live browser demo, not the Android app; native journal durability does not apply to browser storage. GitHub serves static files; initial model acquisition contacts Hugging Face. No video is represented as current CG or .4 interaction footage. User personally publishes the DEV entry.
