# Open-source and model notices

Original app code, catalog prose, leaf icon and hill/path artwork were authored in this project, not copied from a template or an earlier entry. They are licensed under the project [MIT license](../LICENSE). Codex assisted with implementation, draft prose, tests and review; one later user-authorized source review used Claude Sonnet 5.5 xhigh, and its necessary recommendations were implemented and verified locally; a human entrant must review before publication.

## Open weights

- **Xenova/all-MiniLM-L6-v2**, ONNX conversion by Xenova of **sentence-transformers/all-MiniLM-L6-v2**. Model Hub metadata declares **Apache-2.0**. Pinned revision: `751bff37182d3f1213fa05d7196b954e230abad9`.
- Sources: https://huggingface.co/Xenova/all-MiniLM-L6-v2 and https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 . Metadata verification is preserved in `sources/model-metadata.json`; standard Apache-2.0 text is in `sources/APACHE-2.0.txt`.
- In the browser edition, quantized ONNX weights are downloaded unchanged at runtime. The Android test APK bundles these four unchanged pinned files (23,685,047 bytes), their Apache-2.0 license and attribution. Source-only ZIPs include the verified download script and manifest rather than weights. If redistributing model files later, preserve upstream attribution, license and applicable notices with the files. No claim is made that the training corpus itself has this same license.

## Runtime and tooling

- **@huggingface/transformers 4.3.0** — Apache-2.0, Hugging Face. Browser feature extraction and tokenizer implementation.
- **onnxruntime-web** — MIT, Microsoft. Local ONNX/WASM inference. Runtime `.mjs` and `.wasm` copied from the locked npm dependency; unmodified binaries. The npm package omits license files, so the official upstream MIT and ThirdPartyNotices at runtime commit `8d85527a0` are preserved under `third-party-licenses/`.
- **@huggingface/jinja** — MIT; transitive runtime dependency.
- **Ajv 8.20.0** — MIT, Evgeny Poberezkin and contributors. Standard draft-2020-12 validation of the trusted bundled card-pack schema; imported files are data, never schemas. MIT transitive validation helpers are listed with exact versions and retained notices in the dependency inventory. No schema download or asynchronous schema compilation is used.
- **Vite 7.3.6** — MIT, Evan You and contributors. Local build/preview tooling.
- **TypeScript 5.9.3** — Apache-2.0, Microsoft. Static checking.
- **Prettier 3.6.2** — MIT, James Long and contributors. Development source formatting.
- **Playwright / @playwright/test 1.63.0** — Apache-2.0, Microsoft. Acceptance tests using separately installed Google Chrome.

The exact installed dependency names, versions, license identifiers and notice paths are in `DEPENDENCY-LICENSES.json`. Available upstream license/notice files are copied verbatim into `third-party-licenses/`. Some optional platform packages in the lockfile are not installed on macOS; their npm license identifiers remain in the lockfile. This inventory supports review and does not relicense dependencies. Optional Node-only sharp/libvips declares LGPL-3.0-or-later for libvips; no sharp/libvips binary or node_modules directory is redistributed by the source/static demo archive. Source builds install those components from npm under their own terms.

## guid-typescript: exact scope of the missing ISC text

The locked npm installation still includes **guid-typescript 1.0.9**, pulled in by ONNX Runtime. Its official npm record declares ISC and the installed tarball contains no license text. The canonical official repository is now [snico-dev/guid-typescript](https://github.com/snico-dev/guid-typescript). Its complete current master tree at `f110c1f42b5c784511e322531e97928c2d8ffb1c` contains no LICENSE/COPYING/NOTICE file; the official license API returns 404. The npm-published gitHead tree API returned 422, so this check does not claim to verify that historical release tree. The minimal official-source record is in `sources/guid-typescript-official-source-check.json`. **No upstream ISC text was found or invented.**

This package supplies GUIDs to ONNX's old `onnxjs` / WebGL path. This project's Transformers.js browser export instead uses `onnxruntime-web/webgpu`; inference uses its WASM backend. The matching WebGPU source map has no `guid-typescript` or `onnxjs` sources. A deterministic release check also finds none of four GUID code fingerprints in every emitted JavaScript file, while finding all four in the unused upstream WebGL build as a positive control. The actual runtime files match the locked upstream bytes. Run `npm run build && npm run check:distribution`; see `evidence/distribution-scope.json` for source routes, file hashes and the positive control.

The source/review archive excludes `node_modules` and the unused WebGL build. The current static browser distribution therefore excludes this dependency's code, resolving the missing-notice issue **for that distribution scope**. The installed npm graph still relies on its publisher's ISC declaration. If a future release includes node_modules, a Node package, WebGL or a different dependency build, revisit this missing upstream text rather than copying an unattributed generic ISC license. This is an evidence-based scope check, not a general legal certification.

`npm run build` now copies this project's LICENSE and the preserved upstream notices automatically before creating the offline shell. This avoids the earlier hand-copy step being lost on a clean rebuild.

Before a public distribution, keep these notices, the original LICENSE and all binary/runtime notices in the release. License inventory and npm audit are different checks; a clean advisory scan is not a legal or security certification.

The v4 promotional motion candidate uses original Canvas/vector motion and locally synthesized ambient audio (`scripts/promo-score.py`), plus actual app screenshots. No stock assets, TTS, generated-service imagery or external audio samples were introduced; system fonts are rasterized in browser frames. Source/art/music authored for this project use the project MIT license.
