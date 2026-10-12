# New compact review/source copy

Candidate0.3.0-android.4 / 4c7728b435ed8c94edb1e1b9a210469636025e77. Application code and selected original files are copied byte-for-byte from the accepted source export; SOURCE.json hashes this reduced copy. Full original archive is preserved. This copy retains application/public assets, root unit tests and their fixtures, Android source/build/fetch scripts, licenses, model pin/hashes, package.json and package-lock.json. Historical documentation, screenshot/video tooling, browser E2E suites/configurations (except the root config), promotional artifacts and review history are omitted. It is not the complete original archive or a newly accepted build.

Requirements: Node>=22.12, network/dependency availability; Android build needs installed JDK, SDK platform36/build-tools36. On a fresh environment:

    npm ci
    npm test
    npm run build
    npm run preview

To create an unsigned Android package with installed SDK:

    python3 android/fetch-model.py
    npm run build
    python3 android/build.py --sdk /path/to/android-sdk

Model download is pinned and hash checked by the existing script; network is needed to acquire dependencies/model bytes. It downloads Xenova/all-MiniLM-L6-v2 revision751bff37182d3f1213fa05d7196b954e230abad9, Apache2; original app MIT. Keep LICENSE, android/MODEL-LICENSE.txt, model-manifest.json, docs/DEPENDENCY-LICENSES.json, third-party-licenses and generated release notices. No credentials, signing key, model weights, node_modules, dist, APK, video or SDK is included. Signing/installation requires your own key and separate verification; this delivery did not run npm ci, tests or builds again.

npm run test:e2e and other browser/format review commands in the unchanged package.json may reference omitted files. Use the full original export for those historical suites. This reduced copy is intended for code review and the above core build steps; fresh rebuilding has not been verified here. Original README links to omitted historical documentation may be absent; this file is the current compact-copy guide.

Recorded acceptance applies to the full original candidate. Only confirmed journal writes have the demonstrated immediate-stop bound; trip/draft copies can reappear. See docs/ANDROID-DURABLE-JOURNAL.md. The submission text copy identifies .4; historical video is .2, never .4 continuous recording. Public URLs remain unresolved and no public operation is authorized by producing this copy.
