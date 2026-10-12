> **Android test App:** this candidate adds a private installable Android10+ hybrid App to frozen browser rc15. The APK bundles the real open model and has zero manifest permissions. Native navigation, lifecycle, system files and renderer recovery are implemented in Java; authored content and WASM reuse the front-end. See [Android review guide](docs/ANDROID-REVIEW.md) and [ten rounds](docs/ANDROID-TEN-ROUNDS.md). Emulator evidence is not physical-phone acceptance.

# Pocket Field Trip

This is the current private **0.2.0-rc.15 candidate**, continuing `29bcf2c` / rc.14 in an isolated worktree of the same project. An explicit Start now keeps one authored card identity for your return after refresh. Return to the card, save a discovery, or explicitly finish without a note. Saving a new discovery linked to that exact trip finishes it only after the notebook save succeeds; editing an older note or saving an older draft leaves a newer trip intact. See [current release](docs/CURRENT-RELEASE.md) and [return flow](docs/RETURN-FLOW-RC15.md). Forest, Tidal, Clay, default flat paper, original artwork, pinned local AI and notebook/backup formats remain. Frozen rc.14 source, archives and private Library history are retained. Services start on demand and close after acceptance.

**A small reason to step outside.** A private review build for Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass.

Describe what you need in English, choose 5/10/20 minutes and a nearby setting, and get a suggestion from twenty original three-step observation cards. Or browse the authored field guide without downloading the model. Sitting in one spot is welcome. “I want a gentle walk” is a strict movement choice, mutually exclusive with one spot. Direct-light and plant-dependent cards require an explicit visible-detail selection. Expand **Refine your exploration** for confirmed visible details and an optional Lens. Its summary retains selected filters when folded; movement limits and the first-use download reminder stay visible. Read three concrete steps, keep three short pocket cues in mind, then pocket the phone. After returning, optionally save one discovery, up to three tags and a scene you choose in your local notebook. Filter saved notes by scene, tag or inclusive UTC creation dates, then choose two for a Previous/This time comparison.

This is a new project and new local Git repository created on October 6, 2026 UTC, inside the October 5–11 PDT challenge window. No prior contest work was reused. It has **not been publicly deployed or submitted**. Public repository, demo/video and DEV publication are pending human authorization. Post-deadline edits: none at this review build; future edits after October 12, 2026 06:59 UTC must be logged here.

## Run locally

Node 22.12+ (tested environment Node 24.18), npm, and a current browser with WebAssembly and Cache API:

```sh
npm ci
npm run build
npm run preview -- --port 0 --strictPort
```

Open the loopback URL printed by Vite. This allocates a temporary port instead of occupying an existing review preview. `npm run dev` is convenient for development but does not register the production offline service worker. Build and preview to test offline behavior. Serve on a dedicated origin, at `/`; subdirectory hosting needs URL/base adjustments. Never use `file://`.

The full review ZIP contains complete tracked program source, tests, notices and review evidence, including source-attributed inherited model/PDF records. Optional historical browser trace archives stay in the preserved rc.12 Library version and local archive. The separate light ZIP retains exactly the same source and selected summaries. Neither bundles dependencies, model weights or generated runtime files. The historical backup fixture required by unit tests is retained. Run the commands above to build. Package runners use a temporary loopback Vite preview stopped with Ctrl-C; acceptance closes its owned preview and browser processes. The legacy distribution check writes to `evidence/notebook-scenes-v13/`; create that directory before `npm run check:distribution` in a source-only ZIP checkout.

The first model match needs internet and downloads about 23 MB of quantized weights plus tokenizer/config files. The WASM runtime is about 27 MB: first AI use needs roughly 50 MB of weights/runtime, plus page files. The production service worker caches the small app shell first and runtime only when AI actually requests it; browsing notes does not request the model or runtime. Downloads can take a while. No API key, signup, GPU, subscription or location permission is required. No paid API service or new purchase was introduced. A later, user-authorized frontend source review used an existing Claude Pro subscription; this is a development tool, not an app dependency.

## How the AI matters

1. Twenty complete original observation activities are filtered by time, setting, explicit walk/one-spot choice and confirmed visible details. All are designed to leave plants/wildlife alone.
2. Transformers.js **4.3.0** runs the Apache-2.0 **Xenova/all-MiniLM-L6-v2** open weights, pinned to commit `751bff37182d3f1213fa05d7196b954e230abad9`, in a Web Worker using ONNX Runtime WebAssembly, q8 weights, mean pooling and normalization.
3. The intent and each activity description become 384-dimensional embeddings. Cosine similarity ranks only eligible activities; no random choice or remote inference is used.
4. Scores below 0.30 open a cautious review step instead of automatically selecting a card. This conservative guard was checked on fifteen disclosed developer fixtures, not calibrated on a representative dataset; it can reject a useful note or fail to catch a poor one. The user can refine the intent, browse, or explicitly inspect the closest available note. Other results also remain suggestions, and every alternate card shows its own relevance caution when weak. “Behind this match” shows top semantic scores, an exact-tag keyword baseline and runtime evidence (revision, vector dimensions/norm/sample, timings and rank order). Evidence can be downloaded locally. Original semantic order and scores remain visible alongside the presented order and local preference IDs, so feedback effects are inspectable.

Four stationary cards are compiled from reusable Lens, action, safe-one-spot and trace modules. Only four individually reviewed tuples are admitted; the other eight bounded combinations are refused. The compiler produces complete three-step descriptions before embedding; the model ranks those outputs, never invents instructions. Two sibling families preserve repeat controls. A saved card must match both ID and content version; old notebook snapshots stay readable. [Local card-pack review tools](docs/CARD-PACK-USE.md) export the four reviewed outputs and preview/keep one supported local JSON pack. Imported text is never added to the default guide or model pool. Full-field matching marks known source content; edited text stays unreviewed data. The trusted four-card pack already offers device-file sharing (where supported) and printing. The current displayed activity also offers **Print this card**, including its full steps, cues, current fit warning, safety and an optional handwritten discovery line; notebook records and intent are excluded. QR/links and arbitrary new-card admission remain future work.

The model retrieves authored cards; it does not write new instructions, identify species, diagnose wellbeing, verify accessibility or assess live local conditions. Similarity scores are not probabilities. The catalog is intentionally small and English oriented. It is not an endless activity generator; repeating a note means observing a different day or detail. For out-of-domain or ambiguous intent, every eligible card can still be a weak match; read the card and choose what suits you. The catalog includes one original five-minute gentle walk so the default movement suggestion has an eligible walking option. A reliable relevance policy or broader library would require evaluation, not guesswork.

If loading fails, the page explains the failure and offers retry or an explicitly labeled **keyword guide (no AI)**. Cancel terminates the loading worker. A 120-second timeout prevents indefinite waiting. A first-ever offline visit cannot load uncached weights.

## Privacy and offline behavior

Intent text stays in memory and is passed only to the local worker. No location is requested, no analytics are present, and fonts/art are local. First-load model downloads contact Hugging Face and delivery hosts, which receive normal connection metadata such as IP address; “local inference” does not mean “no network ever.” App hosting also receives ordinary web requests.

An explicit Start keeps one separate local return record: schema, random trip token, authored ID and exact content version. It stores no intent, location, start time, timer or completion history. The token distinguishes a new trip with the same card from an older draft. Return needs no AI inference. Finish removes only this record and never marks a task done. A successful new linked discovery finishes it; completion stays a separate visible checkbox. Unsaved discovery words remain in the current tab only. Notebook JSON backups do not export or restore the return record. Model-download clearing preserves it; explicit personal-record clearing removes it. Unknown or unavailable stored trip versions remain untouched until explicit Finish. Storage can be denied, cleared or evicted; this is browser-local recovery, not durable cloud sync or proof of going outside. A synchronous byte guard rejects already-observed changes; simultaneous writes from separate tabs are not transactional.

A saved card contains its authored ID and content version. Optional “I did this” and “Not for me” actions store authored IDs. Suggestions exclude the three most recently completed content families and set-aside families; sibling variants share these preferences. An explicit **Include recent** action restores eligible recent families without changing scores, time, setting, Lens, movement or required details. Raw scores remain inspectable. Completing a sibling clears the family's set-aside preference. Undo and Clear card preferences are available.

**My discoveries** is an optional local notebook. An explicit Save stores one line (up to 280 characters), up to three tags, an optional user-selected Street/Park/Garden/Waterside scene, dates and a snapshot of that task's instructions/cues. Save can also mark the task done; the checkbox is optional. Note and completion are written atomically in one local document. Opening departure or the editor never marks done. Editing keeps the original task snapshot/date and does not complete again. Delete offers same-session undo and leaves completion preferences unchanged. The notebook holds up to 100 discoveries; it never silently prunes older notes. Note text is rendered literally, never as HTML. Intent text is not stored. Legacy notes remain explicitly **Unclassified**. No scene is guessed from a task or planner setting. Comparison shows two user-selected notes in the chosen order, side by side on desktop and stacked on narrow screens. Filtering or deletion clears any choice that is no longer visible; undo restores the note but does not choose it again. No same-place, seasonal-change or AI-observation claim is made. See [scene notebook instructions](docs/NOTEBOOK-SCENES.md).

Search and **Back up & restore** appear before your saved discoveries. An in-tab **Continue draft** action in the notebook reopens your unsaved observation without changing its task, scene, tags or completion choice; save, cancel and discard return to the notebook. Drafts remain in this tab only. Expand **Filter & compare** for ordering, tags, scenes, UTC dates and your two-note comparison. Unchanged notes keep their expanded task snapshots while you search or sort. After editing or undoing a deletion, keyboard focus returns to that note; an edited note outside the current view returns focus to search with an explanation.

Model downloads and personal records have separate controls. **Clear model downloads** preserves the notebook, preferences, saved card and app shell. **Clear personal records** confirms the note count before removing notes, preferences and the saved card; model downloads remain. Failed writes preserve the draft and old records; unsupported notebook formats pause saving and preserve existing bytes. A changed stored record detected before writing refuses a stale overwrite. This is an optimistic synchronous check, not a fully transactional simultaneous-tab guarantee. Unsaved drafts survive closing the editor in the current page only; they are not persisted across reload. Browser storage eviction, profile deletion or changing devices can lose records. **Download notebook JSON** creates a versioned user-owned backup of saved notes, snapshots and preferences. Import validates a local file and previews current-wins merge or explicitly acknowledged replacement; preferences remain unchanged unless opted in. Preview/cancel writes nothing. Invalid files, overflow, unreadable local schema, failed writes and stale storage preserve existing bytes. Unsaved drafts are excluded. When indentation alone exceeds the unchanged 1 MiB backup limit, export uses complete compact JSON and validates it again. Failed JSON/TXT download requests clean temporary links and Blob URLs, preserve saved notes, and report failure; a browser request never proves the user kept a file. Keep backups private: they contain your notes. Cross-device sync is not implemented.

Model weights use this app's `pft-model-<revision>` cache; app files use versioned `pft-shell-<hash>` caches. Offline reload and new cached-model inference require a complete first load and retained browser storage. Browsers can evict caches or restrict private-mode storage. The app does not claim offline readiness merely from `navigator.onLine`. Use a dedicated origin to avoid root-scope service worker conflicts. See [validation](docs/VALIDATION.md) for exactly what was exercised and which device claims remain unverified.

## Verify this release

```sh
npm test
npm run build
```

For current functional acceptance, run `PFT_ORIGIN=http://127.0.0.1:<allocated-port> npm run test:twenty:e2e`. Set `PFT_UI_REGRESSION=1` for the bounded notebook/public-print/inert-pack regression. The model/cache and native-keyboard scripts in `scripts/twenty-*.mjs` take a dedicated `PFT_ORIGIN` ending in `/`; see the current acceptance record for exact invocation.

For the bounded data regression, keep the dedicated loopback preview running in a separate terminal and use its printed URL:

```sh
PFT_ORIGIN=http://127.0.0.1:<allocated-port> npm run test:data:e2e
```

The runner uses installed Google Chrome in headless mode, one worker, isolated storage and synthetic notes. Its two JSON fixtures are included in `tests/fixtures/`; `PFT_EVIDENCE_DIR` optionally overrides `evidence/current-data`. It covers backup failures, actual download/fresh-context restore, compact-size limits, repeated operations, failed storage and stale-record protection. No model inference is required by this suite. Do not run it against a user's existing origin.

Current-source execution is recorded in [current release](docs/CURRENT-RELEASE.md) and [twenty-round acceptance](docs/TWENTY-ROUND-ACCEPTANCE.md). Prior genuine WASM, ten-loop, full-keyboard and cache evidence belongs to 1901de6 and its identified predecessors; it is preserved, not described as a new rc.8 model run. Historic motion, media and PDF reports remain available under their original source identities. Synthetic vectors in unit tests do not establish model quality.

## Twenty-round experience additions

Compose from four reviewed presets, inspect the full plan and receipt, and explicitly repair rejected combinations. Optional fixed reasons distinguish temporary mismatch from recently done or a persistent family preference. The notebook shows a folded collection of unique UTC days, lenses and explicit scene categories; Lens/month/family filters combine with existing search/tag/date/scene controls. An explicit earliest/latest shortcut compares visible records without a same-place or change claim. Revisit resumes an existing unsaved draft rather than replacing it.

Select saved notes explicitly to preview/download readable private TXT or request a private print sheet. Hidden/changed selections clear; every request rechecks complete saved content. These selected outputs exclude drafts/preferences and are not a restorable JSON backup. Existing all-notes TXT and full JSON backup remain available. Public card sharing stays separate. Native chooser/print requests do not certify receipt. The new refreshable cache inventory distinguishes current shell, verified runtime hashes and model filenames from actual offline execution.

## Current product iteration

The private [app lifecycle candidate](docs/APP-LIFECYCLE.md) adds waiting updates, guarded reloads and a browser-provided installation action. Genuine runtime bytes receive a separate verified cache identity; notebook data is preserved. Installation offer tests do not certify physical-device installation, and no new Android APK is produced in this print candidate; older debug APK evidence remains historical. This release continues the accepted source while preserving its stable preview.

The current card offers **Quiet card view**: optional after-trip tools fold away while source, full safety, all steps/cues and Go/Save stay visible. The authored guide labels fitting alternatives and can expand an empty search without losing the query. The notebook shows filtered counts, copies literal observations and downloads all saved discoveries as readable UTF8 text; JSON remains the restore format. Save failures stay beside Save, unsaved drafts remain explicitly in-tab, and offline shortcuts reuse the authored/saved paths without inference. Manual reduced motion persists when storage permits, with device and save-data preferences taking priority.

The latest [local JSON pack workflow](docs/CARD-PACK-USE.md) closes the bounded review-only import/export gap; imported cards remain separate from recommendations. The preceding [compact first-exploration correction](docs/COMPACT-FLOW.md) addresses the actual v10 mobile review. The [independent actual visual review](docs/COMPACT-INDEPENDENT-UI-REVIEW.md) covers the shortened path, selected-state disclosure and spacing; the original feature gaps remain.

The mobile web app remains free to use, without signup or a paid inference API. Sponsorship is a possible later funding path; no payment system is implemented. See [product iteration](docs/PRODUCT-ITERATION.md) for the historical sixteen-card scope. See [notebook candidate](docs/NOTEBOOK-CANDIDATE.md) for the earlier nineteen-task discovery milestone; [module review](docs/MODULAR-CANDIDATE.md) describes the twenty-task composition and family policy. Timed cards and offline use are not claimed as unique features. Real retention and outdoor benefit remain untested.

The accepted English 24/60fps and Chinese 60fps CG, and the earlier continuous operation recording, remain unchanged **thirteen-card historical snapshots**. Historical local-card-pack twenty-task evidence lives in `evidence/card-pack-v12/`; the v11 compact-flow evidence remains in `evidence/ui-refinement-v11/`; the v10 modular acceptance remains in `evidence/modular-candidate/`; earlier nineteen-task recovery evidence lives in `evidence/backup-candidate/`. Earlier notebook evidence remains in Git and private Library version8. Earlier sixteen-card evidence remains in `evidence/product-iteration/`; do not present the old footage as a recording of these new features.

## Review and contribution

- [Contest review](docs/CONTEST-REVIEW.md): rules, deadline and authorization gate.
- [Validation](docs/VALIDATION.md): observed results and remaining limits.
- [DEV article draft](docs/DEV-ARTICLE.md): official template structure, English.
- [Promotional CG](docs/PROMO-CG.md): a separate original forty-second product-mechanism film, with animated filtering/ranking/card unfolding and cached-offline explanation; distinct from operation or outdoor footage.
- [Demo script](docs/DEMO-SCRIPT.md): short video storyboard.
- [Claude source review](docs/CLAUDE-REVIEW.md): scope, recommendations and native-auth correction.
- [Licenses](docs/THIRD-PARTY.md): model, runtime and dependency notices.
- [Build log](docs/BUILD-LOG.md): new-project provenance and decisions.

Original source, activities and vector artwork are MIT licensed. Model and third-party components keep their own licenses. To extend the field guide, add three safe, concrete steps in `src/catalog.ts`; keep time/setting/still metadata accurate and validate the resulting semantic matches. Do not introduce tracking, streaks or an engagement feed.

No real outdoor trial, physical mobile-device test, hosted production test or contest receipt has occurred unless subsequently recorded in the validation record. Human feedback should be added as observed evidence.

Current private successor: rc.12, twenty distinct product improvements from rc.11. See docs/CURRENT-RELEASE.md and docs/NIGHT-TWENTY-LEDGER.md. Inert packs and historical snapshots stay outside the AI candidate pool. Complete recovery protects regular notebook edits as well as restores. Final acceptance and precise Library version are in the delivery receipt.
