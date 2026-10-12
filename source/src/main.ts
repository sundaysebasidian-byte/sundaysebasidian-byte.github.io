import type {} from "./android-journal.ts";
import {
  assertRecoverableChange,
  RecoveryLimitError,
} from "./recovery-guard.ts";
import { setupAppLifecycle } from "./app-lifecycle.ts";
import { RUNTIME_CACHE, RUNTIME_HASHES } from "./runtime-cache.ts";
import layout from "./layout.html?raw";
import landscape from "./field-lens.svg?raw";
import "./style.css";
import "./field-notebook.css";
import "./local-tools.css";
import "./vivid-field.css";
import "./field-studio.css";
import "./calm-motion.css";
import "./fifteen.css";
import "./liquid-field.css";
import "./calm-space.css";
import "./notebook-flow.css";
import "./paper-reading.css";
import "./experience-finish.css";
import "./collection-experience.css";
import "./flow-polish.css";
import "./appearance.css";
import "./night-tools.css";
import "./print.css";
import "./android-app.css";
import { ACTIVE_TRIP_KEY } from "./active-trip.ts";
import { activeTripUI } from "./active-trip-ui.ts";
import { setupAppearance } from "./appearance.ts";
import { combinationUI } from "./combination-ui.ts";
import { feedbackChoice } from "./feedback-choice.ts";
import { setupCardPrint } from "./card-print.ts";
import { clearPrintSheet } from "./print-sheet.ts";
import { setupVisualEffects } from "./visual-effects.ts";
setupVisualEffects();
import {
  revealHome,
  revealTrip,
  revealLens,
  revealReading,
  setupCalmMotion,
  settleSurface,
  stopSurface,
} from "./calm-motion.ts";
import { confirmControl } from "./control-confirmation.ts";
import { downloadText } from "./text-download.ts";
import { rawRescueUI } from "./raw-rescue-ui.ts";
import { readRawNotebook } from "./raw-rescue.ts";
import {
  searchGuide,
  cardPlainText,
  undoFeedbackChange,
  type FeedbackUndo,
} from "./local-tools.ts";
import { activities, type Activity, type Setting } from "./catalog.ts";
import {
  FEEDBACK_KEY,
  emptyFeedback,
  parseFeedback,
  recordFeedback,
  recommendationOrder,
  pocketCues,
  cardMotif,
  motifPaths,
  familyOf,
  compatibleSavedCard,
  type Feedback,
} from "./pocket.ts";
import { lensLabels, type Lens } from "./lenses.ts";
import {
  JOURNAL_KEY,
  emptyJournal,
  parseJournal,
  type Journal,
} from "./journal.ts";
import { notebookUI } from "./notebook.ts";
import { journeyUI } from "./journey.ts";
import { backupUI } from "./backup-ui.ts";
import { REVISION } from "./model-config.ts";
import {
  eligible,
  keywordRank,
  weakMatch,
  type Constraints,
  type Scored,
} from "./ranking.ts";
import { isAndroidApp } from "./android-app.ts";
import { ANDROID_DRAFT_KEY } from "./android-draft.ts";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = layout.replace("<!-- LANDSCAPE -->", landscape);
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const show = (id: string, visible: boolean) => ($(id).hidden = !visible);
// This authored preview never starts inference or changes a recommendation.
const sampleCard = activities.find((activity) => activity.id === "sound-map")!;
$("sample-title").textContent = sampleCard.title;
$("sample-cues").textContent = pocketCues[sampleCard.id].join(" / ");

let worker: Worker | null = null,
  requestId = 0,
  timeout: ReturnType<typeof setTimeout> | undefined;
let ranked: Scored[] = [],
  baseline: Scored[] = [],
  selected = 0,
  mode: "semantic" | "keyword" | "browse" | "saved" | "return" = "semantic",
  evidence: Record<string, unknown> | null = null;
let rawRanked: Scored[] = [];
let journal: Journal = emptyJournal(),
  journalRaw: string | null = null,
  journalProblem: string | null = null,
  journalLocked = false,
  journalReadable = true;
try {
  if (window.__pftJournalBootError) throw Error(window.__pftJournalBootError);
  journalRaw = localStorage.getItem(JOURNAL_KEY);
  journal = parseJournal(journalRaw);
  if (journalRaw === null)
    journal.feedback = parseFeedback(localStorage.getItem(FEEDBACK_KEY));
} catch (error) {
  journalReadable = false;
  journalProblem = window.__pftJournalBootError
    ? window.__pftJournalBootError +
      " A raw page rescue contains only the WebView cache; it does not rescue an unreadable device journal."
    : journalRaw === null
      ? "Notebook storage could not be read. Nothing was changed. / 暂时无法读取笔记存储，数据未变。"
      : "Unknown or damaged notebook; saving is paused. Original text kept. / 笔记格式未知或损坏，写入已暂停，原内容保留。";
  journalLocked = journalRaw !== null || !!window.__pftJournalBootError;
}
let feedback: Feedback = journal.feedback;
let notebook: ReturnType<typeof notebookUI> | undefined;
let journey: ReturnType<typeof journeyUI> | undefined;
let activeTrip: ReturnType<typeof activeTripUI> | undefined;
let allowRepeats = false;
let undoFeedback: FeedbackUndo | null = null;
let undoNeedsSave = false;
let feedbackPersistent = true;
let last: { text: string; constraints: Constraints } | null = null;
let busy = false;
let displayedActivityId: string | null = null;
let displayedCard: Activity | null = null;
setupCardPrint(() =>
  displayedCard && !$("result").hidden
    ? {
        card: displayedCard,
        match: $("match-type").textContent!.trim(),
        caution: $("match-caution").textContent!.trim(),
        fit: $("fit-receipt").textContent!.trim(),
        warning: $("fit-warning").hidden
          ? undefined
          : $("fit-warning").textContent!.trim(),
        safety: $("result")
          .querySelector(".safety")!
          .textContent!.replace(/\s+/g, " ")
          .trim(),
      }
    : null,
);
// An explicit, in-tab reading preference; safety and source remain on the card.
$("quiet-card").onclick = () => {
  const card = $("trip-card");
  const before = card.getBoundingClientRect();
  const quiet = $("quiet-card").getAttribute("aria-pressed") !== "true";
  $("result").dataset.reading = quiet ? "quiet" : "full";
  show("quiet-return", quiet);
  $("quiet-card").setAttribute("aria-pressed", String(quiet));
  $("quiet-card").textContent = quiet
    ? "Show notes & tools"
    : "Quiet card view";
  revealReading(card, before);
};
let cardRenderVersion = 0;
const chooseFeedback = feedbackChoice(
  () => (!busy && !$("result").hidden ? displayedCard : null),
  applyFeedback,
  openGuide,
);
let copyAttempt = 0;
const cardTextDialog = $<HTMLDialogElement>("card-text-dialog");
cardTextDialog.addEventListener("close", () => {
  copyAttempt++;
  shareAttempt++;
  $<HTMLButtonElement>("native-share-card").disabled = false;
});
$("close-card-text").onclick = () => cardTextDialog.close();
$("share-card").onclick = () => {
  if (!displayedCard || $("result").hidden) return;
  $<HTMLTextAreaElement>("card-text").value = cardPlainText(
    displayedCard,
    pocketCues[displayedCard.id],
    [
      $("fit-receipt").textContent!.trim(),
      ...(!$("fit-warning").hidden
        ? [$("fit-warning").textContent!.trim()]
        : []),
      $("trip-card")
        .querySelector(".card-foot")!
        .textContent!.replace("↗", "")
        .trim(),
      $("result")
        .querySelector(".safety")!
        .textContent!.replace(/\s+/g, " ")
        .trim(),
    ],
  );
  $("card-text-status").textContent =
    "You can also select this text and copy it yourself.";
  cardTextDialog.showModal();
};
$("copy-card-text").onclick = async () => {
  const revision = cardRenderVersion;
  const attempt = ++copyAttempt;
  const current = () =>
    attempt === copyAttempt &&
    revision === cardRenderVersion &&
    cardTextDialog.open &&
    !$("result").hidden;
  $("card-text-status").textContent = "Copying…";
  try {
    await navigator.clipboard.writeText(
      $<HTMLTextAreaElement>("card-text").value,
    );
    if (!current()) return;
    $("card-text-status").textContent =
      "Copied. The full card text is on your clipboard.";
  } catch {
    if (!current()) return;
    $("card-text-status").textContent =
      "Clipboard unavailable. Select the text above and copy it yourself.";
    $<HTMLTextAreaElement>("card-text").focus();
    $<HTMLTextAreaElement>("card-text").select();
  }
};
$("download-card-text").onclick = () => {
  if (!cardTextDialog.open || !displayedCard || $("result").hidden) return;
  try {
    downloadText(
      `pocket-field-trip-${displayedCard.id}.txt`,
      $<HTMLTextAreaElement>("card-text").value,
    );
    $("card-text-status").textContent =
      "Card text download requested. Keep the file somewhere you can find it offline.";
  } catch {
    $("card-text-status").textContent =
      "Download unavailable. You can select the card text and copy it yourself.";
  }
};
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let shareAttempt = 0;
$("native-share-card").onclick = async () => {
  if (!cardTextDialog.open || !displayedCard || $("result").hidden) return;
  if (!navigator.share) {
    $("card-text-status").textContent =
      "Device sharing is unavailable. Copy or download this card text, then choose a destination yourself. Nothing was sent.";
    $("copy-card-text").focus();
    return;
  }
  const button = $<HTMLButtonElement>("native-share-card");
  const revision = cardRenderVersion,
    attempt = ++shareAttempt;
  const text = $<HTMLTextAreaElement>("card-text").value;
  const title = displayedCard.title;
  button.disabled = true;
  $("card-text-status").textContent =
    "Opening the device share chooser for authored card text only. Your notebook and intent are excluded.";
  const current = () =>
    attempt === shareAttempt &&
    revision === cardRenderVersion &&
    cardTextDialog.open;
  try {
    await navigator.share({ title, text });
    if (current())
      $("card-text-status").textContent =
        "Device share request completed. Delivery is controlled by the chosen app; no receipt is tracked here.";
  } catch (error) {
    if (current())
      $("card-text-status").textContent =
        error instanceof DOMException && error.name === "AbortError"
          ? "Share cancelled. Nothing changed here."
          : "Sharing could not complete. Copy or download the card text instead.";
  } finally {
    if (attempt === shareAttempt) button.disabled = false;
  }
};
const connection = (
  navigator as Navigator & {
    connection?: {
      saveData?: boolean;
      addEventListener?: (type: string, listener: () => void) => void;
    };
  }
).connection;
const dataSaver = () => Boolean(connection?.saveData);
let sessionReducedMotion = false;
let motionPreferenceSaved = true;
try {
  sessionReducedMotion = localStorage.getItem("pft-motion") === "reduced";
} catch {
  motionPreferenceSaved = false;
}
const reducedMotion = () =>
  motionPreference.matches || dataSaver() || sessionReducedMotion;
function syncMotion() {
  const reduced = reducedMotion();
  document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  const toggle = $<HTMLButtonElement>("motion-toggle");
  toggle.setAttribute("aria-pressed", String(reduced));
  toggle.disabled = motionPreference.matches || dataSaver();
  toggle.title = toggle.disabled
    ? "Motion follows your device settings"
    : reduced
      ? "Reduced motion: on"
      : "Reduced motion: off";
  if (!motionPreferenceSaved)
    toggle.title += " · this tab only (browser storage unavailable)";
  if (reduced) {
    document.getAnimations().forEach((animation) => animation.cancel());
  }
}
$("motion-toggle").onclick = () => {
  sessionReducedMotion = !sessionReducedMotion;
  try {
    localStorage.setItem(
      "pft-motion",
      sessionReducedMotion ? "reduced" : "full",
    );
    motionPreferenceSaved = true;
  } catch {
    motionPreferenceSaved = false;
  }
  syncMotion();
};
window.addEventListener("storage", (event) => {
  if (event.key !== "pft-motion" && event.key !== null) return;
  try {
    if (event.storageArea && event.storageArea !== localStorage) return;
    sessionReducedMotion = localStorage.getItem("pft-motion") === "reduced";
    motionPreferenceSaved = true;
  } catch {
    motionPreferenceSaved = false;
  }
  syncMotion();
});
motionPreference.addEventListener("change", syncMotion);
connection?.addEventListener?.("change", syncMotion);
setupCalmMotion();
syncMotion();
setupAppearance();
revealHome();
function setBusy(value: boolean) {
  busy = value;
  $("trip-form").setAttribute("aria-busy", String(value));
  for (const control of document.querySelectorAll<
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLButtonElement
    | HTMLSelectElement
  >(
    "#trip-form input, #trip-form textarea, #trip-form button, #trip-form select",
  ))
    control.disabled = value;
  $("find").innerHTML = value
    ? 'Finding your field trip <span class="button-orbit" aria-hidden="true">✳</span>'
    : 'Find my field trip <span aria-hidden="true">↗</span>';
}
function intentFeedback() {
  const input = $<HTMLTextAreaElement>("intent");
  $("intent-count").textContent = `${input.value.length} / 280`;
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-intent]",
  ))
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.intent === input.value),
    );
}
function selectionFeedback(control: HTMLElement) {
  const card = control.closest<HTMLElement>(".choice-card");
  if (!card || reducedMotion()) return;
  settleSurface(card, { scale: ".997", opacity: 0.98 }, 240);
}
function scrollTo(element: HTMLElement, focus = false) {
  element.scrollIntoView({
    behavior: reducedMotion() ? "instant" : "smooth",
    block: "start",
  });
  if (focus) element.focus({ preventScroll: true });
}
function reveal(target: HTMLElement, region: HTMLElement = target) {
  target.focus({ preventScroll: true });
  region.scrollIntoView({
    behavior: "instant",
    block: "nearest",
  });
  // Hiding a tall status surface can apply scroll anchoring after layout.
  // Keep the focused action visible on the next frame without a late refocus.
  requestAnimationFrame(() => {
    const r = target.getBoundingClientRect();
    if (r.height && (r.top < 0 || r.bottom > innerHeight))
      target.scrollIntoView({ behavior: "instant", block: "nearest" });
  });
}
function cancelPending(message: string) {
  requestId++;
  worker?.terminate();
  worker = null;
  finish();
  status(message);
}
function status(message: string) {
  $("status").textContent = message;
  show("status", true);
}
function finish() {
  clearTimeout(timeout);
  show("loading", false);
  setBusy(false);
}
function fail(message: string) {
  // A terminal failure owns the attempt: late callbacks cannot revive it.
  requestId++;
  worker?.terminate();
  worker = null;
  finish();
  show("failure", true);
  $("error-detail").textContent = message;
  status("Local AI is unavailable. No AI match was produced.");
  reveal($("retry"), $("failure"));
}
function ensureWorker() {
  if (worker) return worker;
  const activeWorker = new Worker(new URL("./ai.worker.ts", import.meta.url), {
    type: "module",
  });
  worker = activeWorker;
  worker.onmessage = ({ data }) => {
    if (worker !== activeWorker || data.id !== requestId || !busy) return;
    if (data.type === "progress") {
      $("progress-label").textContent =
        data.label +
        (data.progress === undefined
          ? ""
          : ` · ${data.progress}%${data.total ? ` · ${(data.loaded / 1e6).toFixed(1)} / ${(data.total / 1e6).toFixed(1)} MB` : ""}`);
      $("loading-title").textContent =
        data.phase === "catalog"
          ? `Reading the ${activities.length} field notes`
          : data.phase === "match"
            ? "Finding a little outside for you"
            : "Preparing the open model";
      for (const stage of document.querySelectorAll<HTMLElement>(
        "[data-stage]",
      ))
        stage.dataset.active = String(stage.dataset.stage === data.phase);
      const bar = $("loading").querySelector<HTMLElement>(".loading-bar")!;
      $("loading").dataset.determinate = String(data.progress !== undefined);
      if (data.progress !== undefined) {
        bar.setAttribute("aria-valuenow", String(data.progress));
        bar.setAttribute("aria-valuemin", "0");
        bar.setAttribute("aria-valuemax", "100");
        bar.style.setProperty("--progress", `${data.progress}%`);
      } else bar.removeAttribute("aria-valuenow");
    }
    if (data.type === "error") fail(data.message);
    if (data.type === "result") {
      finish();
      mode = "semantic";
      evidence = data.evidence;
      rawRanked = data.ranked.map((r: { id: string; score: number }) => ({
        activity: activities.find((a) => a.id === r.id)!,
        score: r.score,
      }));
      ranked = recommendationOrder(rawRanked, feedback, allowRepeats);
      selected = 0;
      inspectOfflineCache();
      presentSemantic();
    }
  };
  worker.onerror = (event) => {
    if (worker !== activeWorker) return;
    event.preventDefault();
    if (busy)
      fail(event.message || "The inference worker stopped unexpectedly.");
    else {
      // A completed card remains valid even if its idle worker later stops.
      activeWorker.terminate();
      worker = null;
    }
  };
  return worker;
}
function constraints(): Constraints {
  const fd = new FormData($<HTMLFormElement>("trip-form"));
  return {
    lens: fd.get("lens") as Lens | "any",
    minutes: Number(fd.get("minutes")),
    setting: fd.get("setting") as Setting,
    still: $<HTMLInputElement>("still").checked,
    walk: $<HTMLInputElement>("walk").checked,
    features: fd.getAll("feature") as Constraints["features"],
  };
}
async function run() {
  if (busy) return;
  clearTimeout(timeout);
  show("lab", true);
  const text = $<HTMLTextAreaElement>("intent").value.trim();
  if (!text) {
    $<HTMLTextAreaElement>("intent").setCustomValidity(
      "Tell us what you would like to notice.",
    );
    $<HTMLTextAreaElement>("intent").reportValidity();
    return;
  }
  const c = constraints();
  allowRepeats = false;
  last = { text, constraints: c };
  baseline = keywordRank(c, text);
  rawRanked = [];
  evidence = null;
  show("recent", false);
  show("failure", false);
  show("result", false);
  show("empty", false);
  show("weak", false);
  if (!eligible(c).length) {
    finish();
    show("empty", true);
    status("No matching activities for these constraints.");
    return;
  }
  requestId++;
  evidence = null;
  $("loading").dataset.determinate = "false";
  $("loading").querySelector(".loading-bar")!.removeAttribute("aria-valuenow");
  $("loading-title").textContent = worker
    ? "Finding your next small adventure"
    : "Preparing your field guide";
  $("progress-label").textContent = "Starting local WebAssembly…";
  for (const stage of document.querySelectorAll<HTMLElement>("[data-stage]"))
    stage.dataset.active = String(stage.dataset.stage === "download");
  $("loading-note").textContent = worker
    ? "Using the open model already in this browser. Your words stay here."
    : isAndroidApp()
      ? "Preparing the model included in this app. Your words stay here."
      : "Loading or reusing cached weights. First visit needs internet.";
  show("loading", true);
  setBusy(true);
  status(
    "Loading or reusing the open model. This may take a minute on your first visit.",
  );
  reveal($("cancel"), $("loading"));
  const id = requestId;
  timeout = setTimeout(() => {
    if (id === requestId) {
      fail(
        "Model setup or inference exceeded 120 seconds. Retry on a faster connection or use the keyword guide.",
      );
    }
  }, 120000);
  // Give the production shell a chance to control the first AI request so its
  // runtime can be cached. A failed registration never blocks local matching.
  if (
    import.meta.env.PROD &&
    !isAndroidApp() &&
    "serviceWorker" in navigator &&
    !navigator.serviceWorker.controller
  )
    await new Promise<void>((resolve) => {
      const ready = () => {
        clearTimeout(wait);
        navigator.serviceWorker.removeEventListener("controllerchange", ready);
        resolve();
      };
      const wait = setTimeout(ready, 5000);
      navigator.serviceWorker.addEventListener("controllerchange", ready);
      if (navigator.serviceWorker.controller) ready();
    });
  if (id === requestId && busy) {
    try {
      ensureWorker().postMessage({ id, text, constraints: c });
    } catch (error) {
      if (id === requestId && busy)
        fail(
          error instanceof Error
            ? error.message
            : "The browser could not start or contact the local inference worker.",
        );
    }
  }
}
$<HTMLFormElement>("trip-form").addEventListener("submit", (e) => {
  e.preventDefault();
  run();
});
$("intent").addEventListener("input", () => {
  $<HTMLTextAreaElement>("intent").setCustomValidity("");
  intentFeedback();
});
for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-intent]",
))
  button.onclick = () => {
    if (busy) return;
    $<HTMLTextAreaElement>("intent").value = button.dataset.intent!;
    $<HTMLTextAreaElement>("intent").setCustomValidity("");
    if (button.dataset.movement === "walk") {
      $<HTMLInputElement>("walk").checked = true;
      $<HTMLInputElement>("still").checked = false;
      choiceSummary();
    }
    intentFeedback();
    selectionFeedback(button);
  };
$("cancel").onclick = () => {
  cancelPending("Loading cancelled. No match was produced.");
  reveal($("find"));
};
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    busy &&
    !document.querySelector("dialog[open]")
  ) {
    event.preventDefault();
    $("cancel").click();
  }
});
$("retry").onclick = run;
$("fallback").onclick = () => {
  mode = "keyword";
  evidence = null;
  ranked = recommendationOrder(baseline, feedback, allowRepeats);
  selected = 0;
  show("failure", false);
  presentKeyword();
  status("Keyword guide active. This result did not use AI.");
};
$("rewrite").onclick = () => scrollTo($("intent"), true);
$("closest").onclick = () => {
  if (mode !== "semantic" || !evidence || !ranked.length) return;
  show("weak", false);
  render();
  status(
    "Showing the closest available note. Its relevance was weak; choose it only if it suits you.",
  );
};
function updateRecent() {
  if (mode !== "semantic" && mode !== "keyword") {
    show("recent", false);
    return;
  }
  const source = mode === "semantic" ? rawRanked : baseline;
  const skippedFamilies = new Set(feedback.skipped.map(familyOf));
  const blocked = source.filter((r) => !skippedFamilies.has(r.activity.family));
  const recentFamilies = new Set(feedback.done.map(familyOf));
  const hidden = blocked.some((r) => recentFamilies.has(r.activity.family));
  show("recent", !allowRepeats && hidden);
  $("recent-detail").textContent =
    "Recent content families are kept out of suggestions. With few fresh options, you can choose to revisit them. Time, setting, movement and detail rules still apply.";
}
$("allow-repeats").onclick = () => {
  if (mode !== "semantic" && mode !== "keyword") return;
  allowRepeats = true;
  ranked = recommendationOrder(
    mode === "semantic" ? rawRanked : baseline,
    feedback,
    true,
  );
  selected = 0;
  updateRecent();
  if (mode === "semantic") presentSemantic();
  else presentKeyword();
  status(
    "You chose to include recently done tasks. Hard constraints remain unchanged.",
  );
};
function presentKeyword() {
  updateRecent();
  show("weak", false);
  show("result", false);
  show("empty", !ranked.length);
  if (ranked.length) render();
  else if (!$("recent").hidden) reveal($("allow-repeats"), $("recent"));
  else if (feedback.skipped.length) reveal($("clear-feedback"), $("memory"));
}
function presentSemantic() {
  updateRecent();
  show("result", false);
  show("weak", false);
  show("empty", false);
  if (!ranked.length) {
    show("empty", true);
    status(
      "No fresh suggestion remains within these choices. Include recently done tasks, clear set-aside preferences, or browse explicitly.",
    );
    if (!$("recent").hidden) reveal($("allow-repeats"), $("recent"));
    else if (feedback.skipped.length) reveal($("clear-feedback"), $("memory"));
    return;
  }
  if (weakMatch(ranked[0].score)) {
    show("weak", true);
    $("weak-detail").textContent =
      `Closest remaining semantic score: ${ranked[0].score.toFixed(3)}. Below the cautious 0.30 guard; this is not an accuracy guarantee.`;
    status(
      "The model ran locally, but no clear suggestion was selected. Refine your words, undo a preference or browse the guide.",
    );
    reveal($("weak-title"), $("weak"));
    return;
  }
  status(
    `A local semantic suggestion from ${activities.length} authored notes. Read it and decide what suits you.`,
  );
  render();
}
function choiceSummary() {
  const selectedDetails = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[name="feature"]:checked',
    ),
  ).map((input) => (input.value === "light" ? "Light & shadows" : "Plants"));
  const lens = $<HTMLSelectElement>("lens").value as Lens | "any";
  $("refinement-summary").textContent = [
    ...selectedDetails,
    lens === "any" ? "Any lens" : lensLabels[lens],
  ].join(" · ");
  const rows = eligible(constraints());
  const walking = rows.filter((a) => !a.still).length;
  $("choice-summary").textContent =
    `${rows.length} of ${activities.length} notes fit these choices · ${walking ? walking + " gentle walks available" : "all in one spot"} · ${rows.filter((a) => feedback.skipped.some((id) => familyOf(id) === a.family)).length} set aside`;
}
for (const control of document.querySelectorAll<HTMLInputElement>(
  "#trip-form input",
))
  control.addEventListener("change", () => {
    if (control.id === "still" && control.checked)
      $<HTMLInputElement>("walk").checked = false;
    if (control.id === "walk" && control.checked)
      $<HTMLInputElement>("still").checked = false;
    allowRepeats = false;
    choiceSummary();
    selectionFeedback(control);
    checkCurrentFit();
  });
$("lens").onchange = () => {
  allowRepeats = false;
  choiceSummary();
  checkCurrentFit();
  revealLens();
};
function guideList() {
  const all = $<HTMLInputElement>("guide-all").checked;
  const fitting = eligible(constraints());
  const fittingIds = new Set(fitting.map((a) => a.id));
  const available = all ? activities : fitting;
  const query = $<HTMLInputElement>("guide-search").value;
  const rows = searchGuide(available, query);
  $("guide-summary").textContent = query.trim()
    ? `${rows.length} of ${available.length} ${all ? "authored" : "fitting"} notes match your search. No AI used.`
    : all
      ? `All ${activities.length} notes. Check each note's time and setting yourself.`
      : `${rows.length} notes fit your time, setting and one-spot choices.`;
  show("guide-search-clear", !!query);
  show("guide-empty", rows.length === 0);
  show("guide-expand", rows.length === 0 && !all);
  $("guide-list").replaceChildren(
    ...rows.map((a) => {
      const button = document.createElement("button");
      button.className = "guide-note";
      const meta = document.createElement("small");
      meta.textContent = `${a.minutes} MIN · ${a.still ? "ONE SPOT" : "GENTLE WALK"}${all ? " · " + a.settings.join(" / ") : ""}`;
      if (feedback.skipped.some((id) => familyOf(id) === a.family))
        meta.textContent += " · SET ASIDE";
      else if (feedback.done.some((id) => familyOf(id) === a.family))
        meta.textContent += " · RECENTLY DONE";
      const title = document.createElement("span");
      title.textContent = a.title;
      const arrow = document.createElement("span");
      arrow.className = "guide-arrow";
      arrow.textContent = "↗";
      arrow.setAttribute("aria-hidden", "true");
      const fit = document.createElement("span");
      fit.className = "guide-fit";
      fit.dataset.fits = String(fittingIds.has(a.id));
      fit.textContent = fittingIds.has(a.id)
        ? "Fits your choices"
        : "Different choices";
      button.append(meta, title, fit, arrow);
      button.onclick = () => {
        $<HTMLDialogElement>("guide").close();
        openAuthored(a);
      };
      return button;
    }),
  );
}
function openAuthored(a: Activity) {
  if (busy) cancelPending("Matching cancelled. Opening an authored example.");
  for (const id of ["failure", "empty", "weak"]) show(id, false);
  mode = "browse";
  ranked = [];
  baseline = [];
  evidence = null;
  render(true, a);
  status("You chose an authored field note. No AI inference was used.");
}
$("sample-open").onclick = () => openAuthored(sampleCard);
combinationUI(openAuthored);
function openGuide() {
  if (busy) cancelPending("Matching cancelled. Opening the field guide.");
  show("failure", false);
  $<HTMLInputElement>("guide-all").checked = false;
  guideList();
  $<HTMLDialogElement>("guide").showModal();
}
for (const id of ["browse", "browse-weak"]) $(id).onclick = openGuide;
$("offline-open-guide").onclick = openGuide;
$("offline-open-notebook").onclick = () => $("notebook-open").click();
$("offline-open-saved").onclick = () => {
  refreshSaved();
  const open = $<HTMLButtonElement>("open-saved");
  if (!open.disabled) open.click();
  else
    status("This saved card is unavailable. Browse an authored note instead.");
};
$("close-guide").onclick = () => $<HTMLDialogElement>("guide").close();
$("guide-all").onchange = guideList;
$("guide-search").oninput = guideList;
$("guide-search").addEventListener("search", guideList);
$("guide-search-clear").onclick = () => {
  $<HTMLInputElement>("guide-search").value = "";
  guideList();
  $("guide-search").focus();
};
$("guide-expand").onclick = () => {
  $<HTMLInputElement>("guide-all").checked = true;
  guideList();
  $("guide-search").focus();
};
function list(container: string, items: Scored[], semantic: boolean) {
  $(container).replaceChildren(
    ...items.slice(0, 3).map((r) => {
      const row = document.createElement("p");
      row.textContent = `${r.activity.title} · ${semantic ? r.score.toFixed(3) : r.score + " exact tags"}`;
      return row;
    }),
  );
}
function render(scroll = true, override?: Activity) {
  const a = override || ranked[selected]?.activity;
  if (!a) {
    show("empty", true);
    return;
  }
  show("empty", false);
  show("result", true);
  displayedActivityId = a.id;
  displayedCard = a;
  clearPrintSheet();
  $("card-print-status").textContent = "";
  cardRenderVersion++;
  if (cardTextDialog.open) cardTextDialog.close();
  $("card-position").textContent = override
    ? ""
    : `${selected + 1} / ${ranked.length}`;
  $("card-position").setAttribute(
    "aria-label",
    override ? "Saved card" : `Match ${selected + 1} of ${ranked.length}`,
  );
  $("match-type").textContent =
    mode === "semantic"
      ? weakMatch(ranked[selected]?.score)
        ? "Closest available · relevance uncertain"
        : "Suggested by meaning, on your device"
      : mode === "browse"
        ? "Field guide · no AI"
        : mode === "return"
          ? "Kept trip · no new inference"
          : mode === "saved"
            ? "Saved card · no new inference"
            : "Keyword guide · no AI";
  $("match-caution").textContent =
    mode === "semantic"
      ? weakMatch(ranked[selected]?.score)
        ? "This note has weak semantic relevance to your words. It fits your choices, but may not cover your intent. You decide."
        : `A suggestion from ${activities.length} authored notes. Check that it suits you; the guide cannot assess local conditions.`
      : mode === "browse"
        ? "Chosen by you from the field guide. Check the time, setting and conditions before going."
        : mode === "return"
          ? "Your user-started trip kept on this browser. No new match or proof of going outside. Check current conditions before returning."
          : mode === "saved"
            ? "Your one saved card. No new match was made. Check the current choices before revisiting."
            : "An exact-keyword guide, without AI. Read the card and judge it for yourself.";
  $("card-number").textContent =
    `FIELD NOTE ${String(activities.indexOf(a) + 1).padStart(2, "0")}`;
  $("card-time").textContent =
    `${a.minutes} MIN · ${a.still ? "ONE SPOT" : "A GENTLE WALK"}`;
  $("card-title").textContent = a.title;
  $("card-subtitle").textContent = a.subtitle;
  $("card-lens").textContent = lensLabels[a.lens];
  $("observation-plan").hidden = !a.composition;
  ($("observation-plan") as HTMLDetailsElement).open = false;
  $("observation-receipt").textContent = a.composition?.receipt || "";
  $("observation-reason").textContent = a.composition?.explanation || "";
  $("record").textContent = "Write one discovery";
  $("record").dataset.confirmed = "false";
  $("record").onclick = () => notebook?.open(a);
  checkCurrentFit(a);
  const motif = cardMotif(a);
  $("trip-card").dataset.motif = motif;
  $("card-motif").innerHTML =
    `<svg viewBox="0 0 84 80" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${motifPaths[motif]}"/></svg>`;
  const fillCues = (id: string) =>
    $(id).replaceChildren(
      ...pocketCues[a.id].map((cue) => {
        const li = document.createElement("li");
        li.textContent = cue;
        return li;
      }),
    );
  fillCues("pocket-cues");
  const c = last?.constraints;
  const requirements = (a.requires || []).map((f) =>
    f === "light" ? "direct light" : "a plant in view",
  );
  $("fit-receipt").textContent =
    mode === "semantic" || mode === "keyword"
      ? `${a.minutes} min within your ${c?.minutes} · ${c?.setting} · ${a.still ? "one spot" : "gentle walk"}${requirements.length ? " · you confirmed " + requirements.join(", ") : ""}${mode === "semantic" && selected === 0 && (feedback.done.length > 0 || feedback.skipped.length > 0) && rawRanked[0]?.activity.id !== a.id ? " · local preferences affected this choice" : ""}`
      : `Check before you go: ${a.minutes} min · ${a.still ? "one spot" : "gentle walk"} · ${a.settings.join(" / ")}${requirements.length ? " · needs " + requirements.join(", ") : ""}`;
  updateCardFeedback();
  if (isAndroidApp()) window.dispatchEvent(new Event("pft-card-open"));
  $("done").onclick = () => applyFeedback(a.id, "done");
  $("not-fit").onclick = () => chooseFeedback(a);
  $("steps").replaceChildren(
    ...a.steps.map((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      return li;
    }),
  );
  $("takeaway").textContent = a.takeaway;
  $("explanation").textContent =
    mode === "semantic"
      ? `The model ranks eligible trips by cosine similarity to your intent. These are the closest matches among ${rawRanked.length} activities that fit your choices. Local feedback keeps scores unchanged: set-aside notes and the three recently completed content families are excluded, unless you explicitly include recent tasks. Each content family appears once; an eligible curated Lens variant has its own embedded description and score.`
      : "This is a deterministic keyword result, not a model prediction. Retry the model to compare semantic retrieval.";
  list("semantic-list", mode === "semantic" ? rawRanked : [], true);
  if (mode !== "semantic")
    $("semantic-list").textContent = "Not available; model did not run.";
  list("keyword-list", baseline, false);
  $("evidence").textContent = evidence
    ? JSON.stringify(
        {
          ...evidence,
          constraints: last?.constraints,
          ranking: rawRanked.map((r) => ({
            id: r.activity.id,
            score: r.score,
          })),
          presentedOrder: ranked.map((r) => r.activity.id),
          localPreferences: feedback,
        },
        null,
        2,
      )
    : "No inference evidence for this card.";
  show("export", !!evidence);
  show("lab", mode === "semantic" || mode === "keyword");
  show("another", !override && ranked.length > 1);
  show("previous-card", !override && ranked.length > 1);
  updateRecent();
  const alreadySaved = compatibleSavedCard(savedCard(), a);
  $("save").textContent = alreadySaved
    ? "Saved on this device ✓"
    : "Save this card for later";
  $("save").setAttribute("aria-pressed", String(alreadySaved));
  show("save-receipt", alreadySaved);
  show("save-error", false);
  $("save-error").textContent = "";
  $("save").removeAttribute("aria-describedby");
  $("go").onclick = () => {
    fillCues("departure-cues");
    $("departure-card").textContent = a.title;
    $("departure-steps").textContent = a.steps
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n\n");
    activeTrip?.prepare(a);
    $<HTMLDialogElement>("departure").showModal();
  };
  $("save").onclick = () => {
    show("save-receipt", false);
    show("save-error", false);
    $("save-error").textContent = "";
    $("save").removeAttribute("aria-describedby");
    try {
      localStorage.setItem(
        "pft-card",
        JSON.stringify({ id: a.id, version: a.version }),
      );
    } catch {
      stopSurface($("save"));
      stopSurface($("save-receipt"));
      const message =
        "Browser storage is unavailable. Your card could not be saved.";
      $("save-error").textContent = message;
      show("save-error", true);
      $("save").setAttribute("aria-describedby", "save-error");
      status(message);
      return;
    }
    $("save").textContent = "Saved on this device ✓";
    $("save").setAttribute("aria-pressed", "true");
    show("save-receipt", true);
    refreshSaved();
    status(
      "Card saved on this browser. It replaces the previous saved card; no intent is stored.",
    );
    confirmControl($("save"));
    settleSurface(
      $("save-receipt"),
      { opacity: 0.94, translate: "0 3px" },
      280,
    );
  };
  journey?.cardReady();
  revealTrip();
  if (scroll) {
    scrollTo($("result"));
    $("card-title").focus({ preventScroll: true });
  }
}
function changeCard(direction: 1 | -1) {
  if (busy || (mode !== "semantic" && mode !== "keyword")) return;
  const current = displayedActivityId;
  ranked = recommendationOrder(
    mode === "semantic" ? rawRanked : baseline,
    feedback,
    allowRepeats,
  );
  updateRecent();
  if (!ranked.length) {
    if (mode === "semantic") presentSemantic();
    else presentKeyword();
    return;
  }
  const index = ranked.findIndex((r) => r.activity.id === current);
  selected =
    index < 0 ? 0 : (index + direction + ranked.length) % ranked.length;
  render(false);
  status(
    `Showing match ${selected + 1} of ${ranked.length}: ${ranked[selected].activity.title}.`,
  );
  const title = $("card-title");
  const bounds = title.getBoundingClientRect();
  if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
    scrollTo($("result"));
    title.focus({ preventScroll: true });
  }
}
$("another").onclick = () => changeCard(1);
$("previous-card").onclick = () => changeCard(-1);
$("edit").onclick = () => scrollTo($("intent"), true);
$("back").onclick = () => $<HTMLDialogElement>("departure").close();
function returnFromTrip() {
  const departure = $<HTMLDialogElement>("departure");
  if (departure.open) departure.close();
  if (!displayedCard || $("result").hidden) return;
  if ($("quiet-card").getAttribute("aria-pressed") === "true")
    $("quiet-card").click();
  notebook?.open(displayedCard);
}
$("return-from-trip").onclick = returnFromTrip;
$("quiet-return").onclick = returnFromTrip;
function refreshSaved() {
  const data = savedCard();
  if (displayedActivityId) {
    const saved = compatibleSavedCard(
      data,
      activities.find((a) => a.id === displayedActivityId),
    );
    $("save").textContent = saved
      ? "Saved on this device ✓"
      : "Save this card for later";
    $("save").setAttribute("aria-pressed", String(saved));
    show("save-receipt", saved);
  }
  try {
    const a = activities.find((a) => a.id === data?.id);
    const compatible = compatibleSavedCard(data, a);
    show("saved", !!data?.id);
    $<HTMLButtonElement>("open-saved").disabled = !compatible;
    if (!compatible && data?.id)
      $("saved-title").textContent =
        "Saved task unavailable in this guide version. Your saved ID was kept; browse to choose again.";
    if (a && compatible) {
      $("saved-title").textContent = a.title;
      $("open-saved").onclick = () => {
        if (busy) cancelPending("Loading cancelled. Opening your saved card.");
        show("failure", false);
        show("empty", false);
        show("weak", false);
        mode = "saved";
        ranked = [];
        baseline = [];
        evidence = null;
        render(true, a);
        $("match-type").textContent = "Saved card · no new inference";
        show("lab", false);
      };
    }
  } catch {
    show("saved", false);
  }
  network();
}
$("clear-saved").onclick = () => {
  try {
    localStorage.removeItem("pft-card");
    stopSurface($("save"));
    stopSurface($("save-receipt"));
    refreshSaved();
    show("save-receipt", false);
    show("save-error", false);
    $("save-error").textContent = "";
    $("save").removeAttribute("aria-describedby");
    $("save").textContent = "Save this card for later";
    $("save").setAttribute("aria-pressed", "false");
    status("Saved card forgotten on this browser.");
    // Clearing hides its own button. Return to a visible next action.
    const nextAction = !$("result").hidden
      ? $("save")
      : busy
        ? $("notebook-open")
        : $("intent");
    nextAction.focus();
  } catch {
    status("Could not clear saved card.");
  }
};
$("find").addEventListener("click", () => show("lab", true));
$("export").onclick = () => {
  if (!evidence) return;
  try {
    downloadText(
      "pocket-field-trip-inference.json",
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          ...evidence,
          constraints: last?.constraints,
          ranking: rawRanked.map((r) => ({
            id: r.activity.id,
            score: r.score,
          })),
          presentedOrder: ranked.map((r) => r.activity.id),
          localPreferences: feedback,
        },
        null,
        2,
      ),
      "application/json",
    );
    status(
      "Inference JSON download requested. It includes your explicit conditions and local card preferences; your raw intent and notebook are excluded. Check your device for the file.",
    );
  } catch {
    status(
      "Inference download could not start. The in-memory evidence was kept; try again.",
    );
  }
};
for (const id of ["about", "privacy-info"])
  $(id).onclick = () => $<HTMLDialogElement>("info").showModal();
$("close-info").onclick = () => $<HTMLDialogElement>("info").close();
$("clear-cache").onclick = async () => {
  if (isAndroidApp()) {
    cancelPending("Releasing the in-memory model…");
    $("cache-message").textContent =
      "In-memory model released. The model bundled in the APK stays installed; your trip, notebook and draft were kept. The next match prepares it again, offline.";
    return;
  }
  const button = $<HTMLButtonElement>("clear-cache");
  if (button.disabled) return;
  button.disabled = true;
  cacheEpoch++;
  cancelPending("Clearing model downloads…");
  evidence = null;
  rawRanked = [];
  ranked = [];
  baseline = [];
  for (const id of ["result", "weak", "failure", "empty", "recent"])
    show(id, false);
  const failures: string[] = [];
  try {
    for (const name of await caches.keys()) {
      try {
        if (name.startsWith("pft-model-") || name.startsWith("pft-runtime-"))
          await caches.delete(name);
        else if (name.startsWith("pft-shell-")) {
          const c = await caches.open(name);
          for (const req of await c.keys())
            if (new URL(req.url).pathname.startsWith("/runtime/"))
              await c.delete(req);
        }
      } catch {
        failures.push(name);
      }
    }
  } catch {
    failures.push("cache access");
  }
  // Cache APIs may resolve false without throwing, or another context may recreate a name.
  // Verify current named downloads before claiming that clearing succeeded.
  try {
    for (const name of await caches.keys()) {
      if (name.startsWith("pft-model-") || name.startsWith("pft-runtime-"))
        failures.push(name);
      else if (name.startsWith("pft-shell-")) {
        const shell = await caches.open(name);
        if (
          (await shell.keys()).some((req) =>
            new URL(req.url).pathname.startsWith("/runtime/"),
          )
        )
          failures.push(name);
      }
    }
  } catch {
    failures.push("verification unavailable");
  }
  cacheReady = false;
  $("cache-inventory-status").textContent =
    "Model downloads were cleared or clearing was attempted. Check cached files again for the current inventory.";
  $<HTMLButtonElement>("refresh-cache-inventory").disabled = false;
  network();
  button.disabled = false;
  $("cache-message").textContent = failures.length
    ? "Some model downloads could not be cleared. Your notebook and saved card were kept."
    : "Model downloads cleared. Your notebook, card preferences and saved card were kept. Offline AI needs a complete download again.";
};
$("clear-personal").onclick = () => {
  $("clear-personal-count").textContent = journalReadable
    ? `This removes ${journal.entries.length} saved discoveries, your saved card, any kept trip and card preferences from this browser.${notebook?.hasDraft() ? " Your unsaved discovery draft will also be discarded." : ""} Model downloads are kept.`
    : "This removes unreadable notebook data (count unknown), your saved card, any kept trip and preferences. Keep a raw rescue copy before choosing removal. Model downloads stay. / 这会移除无法读取的笔记（条目数未知）、已保存卡片和偏好。移除前请保留原始救援副本。模型下载保留。";
  if (isAndroidApp())
    $("clear-personal-count").textContent +=
      " Any private draft recovery copy is also removed. The model bundled in the APK stays installed.";
  $<HTMLDialogElement>("clear-personal-dialog").showModal();
};
$("cancel-personal-clear").onclick = () =>
  $<HTMLDialogElement>("clear-personal-dialog").close();
$("confirm-personal-clear").onclick = async () => {
  const failed: string[] = [];
  if (journalCommitPending) {
    $("personal-clear-message").textContent =
      "Wait for the notebook save to finish before clearing records.";
    return;
  }
  journalCommitPending = true;
  let nativeCleared = false;
  try {
    if (isAndroidApp()) {
      try {
        if (!window.__pftPersistJournal)
          throw Error("Device notebook support unavailable");
        await window.__pftPersistJournal(null, journalRaw);
        nativeCleared = true;
      } catch {
        $("personal-clear-message").textContent =
          "Device notebook removal was not confirmed. Existing records were kept; reopen the notebook before retrying.";
        return;
      }
    }
    for (const key of [
      JOURNAL_KEY,
      FEEDBACK_KEY,
      "pft-card",
      ACTIVE_TRIP_KEY,
      ...(isAndroidApp() ? [ANDROID_DRAFT_KEY] : []),
    ])
      try {
        localStorage.removeItem(key);
        if (localStorage.getItem(key) !== null) failed.push(key);
      } catch {
        failed.push(key);
      }
    if (!failed.includes(JOURNAL_KEY)) {
      journal = emptyJournal();
      journalRaw = null;
      journalProblem = null;
      journalLocked = false;
      journalReadable = true;
      feedback = journal.feedback;
      clearFeedbackUndo();
      notebook?.reset();
      refreshMemory();
    }
    refreshSaved();
    activeTrip?.refresh();
    // Reset transient inference even if some device storage was unavailable.
    cancelPending("Clearing personal records…");
    last = null;
    evidence = null;
    rawRanked = [];
    ranked = [];
    baseline = [];
    displayedActivityId = null;
    $<HTMLTextAreaElement>("intent").value = "";
    intentFeedback();
    for (const id of ["result", "weak", "empty", "failure", "recent"])
      show(id, false);
    if (nativeCleared && failed.includes(JOURNAL_KEY)) {
      journalLocked = true;
      journalProblem =
        "The device notebook was cleared, but its page cache could not be updated. Reopen the notebook before writing again.";
    }
    $("personal-clear-message").textContent =
      nativeCleared && failed.includes(JOURNAL_KEY)
        ? journalProblem
        : failed.length
          ? "Some personal records could not be removed or verified in browser storage; no complete-clear success is claimed. Reopen before retrying."
          : isAndroidApp()
            ? "Discoveries cleared on this device. Other card, trip and recovery copies were removed from this page; their removal is not confirmed across an immediate force-stop. Model downloads were kept."
            : "Discoveries, saved card, kept trip and preferences cleared. Model downloads were kept.";
    if (isAndroidApp())
      $("cache-message").textContent = $("personal-clear-message").textContent;
    if (!failed.length) $<HTMLDialogElement>("clear-personal-dialog").close();
  } finally {
    journalCommitPending = false;
  }
};
function checkCurrentFit(a?: Activity) {
  const task = a || activities.find((a) => a.id === displayedActivityId);
  const fits = !!task && eligible(constraints()).some((x) => x.id === task.id);
  show("fit-warning", !!task && !fits);
  $("fit-warning").textContent =
    "This task does not fit all your current choices. It is an explicit revisit or manual selection. Update your choices or browse a fitting task before going.";
}
// Export only the loaded notebook whose persisted bytes are still current.
// Never reload automatically: the tab may hold an unsaved discovery draft.
function journalForExport(): Journal {
  let current: string | null;
  try {
    current = localStorage.getItem(JOURNAL_KEY);
  } catch {
    throw Error(
      "Browser storage could not be read. Export is paused; nothing was changed. Your draft remains in this tab.",
    );
  }
  if (current !== journalRaw)
    throw Error(
      "Stored notebook changed since this page loaded. Reload before exporting current records; keep any unsaved draft text first. Nothing was overwritten.",
    );
  return journal;
}
let journalCommitPending = false;
async function commitJournal(
  next: Journal,
  allowSession = false,
): Promise<boolean> {
  if (journalCommitPending) return false;
  journalCommitPending = true;
  let nativeWritten = false;
  try {
    if (journalLocked)
      throw Error(journalProblem || "Notebook saving is paused.");
    if (localStorage.getItem(JOURNAL_KEY) !== journalRaw)
      throw Error(
        "Notebook changed in another tab. Reload to read the latest records before saving; your draft was kept.",
      );
    assertRecoverableChange(journal, next);
    const raw = JSON.stringify(next);
    if (isAndroidApp()) {
      if (!window.__pftPersistJournal)
        throw Error(
          "Device notebook support is not ready. Your draft was kept.",
        );
      await window.__pftPersistJournal(raw, journalRaw);
      nativeWritten = true;
      // A cache failure below locks further writes and reports the already-written native copy.
    }
    localStorage.setItem(JOURNAL_KEY, raw);
    journalRaw = raw;
    journal = next;
    feedback = next.feedback;
    feedbackPersistent = true;
    journalProblem = null;
    journalReadable = true;
    // Legacy preference IDs are migrated on the first successful atomic write.
    try {
      localStorage.removeItem(FEEDBACK_KEY);
    } catch {
      /* Old key remains fallback-only; current journal takes precedence. */
    }
    refreshMemory();
    notebook?.render();
    return true;
  } catch (error) {
    journalProblem = nativeWritten
      ? "The device notebook was written, but its page cache could not be updated. Keep your draft and reopen the notebook before retrying."
      : String(error instanceof Error ? error.message : error);
    if (nativeWritten) journalLocked = true;
    if (!(error instanceof RecoveryLimitError)) feedbackPersistent = false;
    if (allowSession && !(error instanceof RecoveryLimitError)) {
      journal = next;
      feedback = next.feedback;
      refreshMemory();
    }
    return false;
  } finally {
    journalCommitPending = false;
  }
}
function updateCardFeedback() {
  const id = displayedActivityId;
  const done = !!id && feedback.done.some((x) => familyOf(x) === familyOf(id));
  const skipped =
    !!id && feedback.skipped.some((x) => familyOf(x) === familyOf(id));
  $("card-feedback").textContent = skipped
    ? "Set aside until you clear preferences."
    : done
      ? "Recently done · this content family stays out until you include recent tasks."
      : "Optional. No proof or account needed.";
  $("done").setAttribute("aria-pressed", String(done));
  $("not-fit").setAttribute("aria-pressed", String(skipped));
}
function refreshMemory() {
  document.documentElement.dataset.hasDiscoveries = String(
    journal.entries.length > 0,
  );
  show("return-invitation", journal.entries.length > 0);
  $("return-summary").textContent = journal.entries.length
    ? `${journal.entries.length} ${journal.entries.length === 1 ? "discovery" : "discoveries"} kept here. Look back at your notebook, or choose what fits today.`
    : "";
  show(
    "memory",
    !!(feedback.done.length || feedback.skipped.length || undoFeedback),
  );
  for (const id of ["undo-feedback", "undo-card-feedback"]) {
    show(id, !!undoFeedback);
    $(id).textContent = undoNeedsSave
      ? "Retry saving undo"
      : "Undo last feedback";
  }
  $("memory-summary").textContent =
    `${feedback.done.length} recently done · ${feedback.skipped.length} set aside${feedbackPersistent ? " · on this browser" : " · this session only (storage unavailable)"}`;
  updateCardFeedback();
  choiceSummary();
}
function clearFeedbackUndo() {
  undoFeedback = null;
  undoNeedsSave = false;
  $("feedback-undo-status").textContent = "";
}
async function persistFeedback(next: Feedback): Promise<boolean> {
  return commitJournal({ ...journal, feedback: next }, true);
}
async function applyFeedback(id: string, kind: "done" | "skipped") {
  if (busy) return;
  const before = { done: [...feedback.done], skipped: [...feedback.skipped] };
  const after = recordFeedback(feedback, id, kind);
  await persistFeedback(after);
  if (JSON.stringify(feedback) !== JSON.stringify(after)) {
    status(
      "Feedback not changed. " +
        (journalProblem || "Existing preferences were kept."),
    );
    return;
  }
  undoFeedback = { before, after };
  undoNeedsSave = false;
  $("feedback-undo-status").textContent = "";
  refreshMemory();
  if (kind === "skipped" && (mode === "semantic" || mode === "keyword")) {
    ranked =
      mode === "semantic"
        ? recommendationOrder(rawRanked, feedback, allowRepeats)
        : recommendationOrder(baseline, feedback, allowRepeats);
    selected = 0;
    if (mode === "semantic") presentSemantic();
    else presentKeyword();
  }
  status(
    kind === "done"
      ? `Marked done by you${feedbackPersistent ? "" : " for this session only (storage unavailable)"}. This content family stays out next time unless you choose to revisit it; scores stay unchanged.`
      : `Note set aside ${feedbackPersistent ? "on this browser" : "for this session only (storage unavailable)"}. You can undo or clear preferences.`,
  );
}
async function undoLastFeedback() {
  if (!undoFeedback || busy) return;
  const previous = undoFeedbackChange(feedback, undoFeedback);
  if (!previous) {
    const message =
      "Feedback changed since that action. Undo could not safely restore it; your current preferences and discoveries were kept.";
    $("feedback-undo-status").textContent = message;
    status(message);
    return;
  }
  const saved = await persistFeedback(previous);
  if (JSON.stringify(feedback) !== JSON.stringify(previous)) {
    const message =
      "Feedback not undone. " +
      (journalProblem || "Current preferences and the undo choice were kept.");
    $("feedback-undo-status").textContent = message;
    status(message);
    return;
  }
  if (saved) {
    undoFeedback = null;
    undoNeedsSave = false;
  } else undoNeedsSave = true;
  refreshMemory();
  show("empty", false);
  const message = saved
    ? "Last card feedback undone and saved on this browser. Your discoveries were kept."
    : "Feedback undone for this session only. It could not be saved on this browser; retry saving undo, or reload to read stored preferences. Your stored discoveries were kept.";
  $("feedback-undo-status").textContent = message;
  status(message);
  if (saved) reveal($("browse"));
}
$("undo-feedback").onclick = undoLastFeedback;
$("undo-card-feedback").onclick = undoLastFeedback;
$("clear-feedback").onclick = async () => {
  if (!(await commitJournal({ ...journal, feedback: emptyFeedback() }))) {
    status(
      "Preferences could not be cleared in storage. Discoveries and existing preferences were kept.",
    );
    return;
  }
  clearFeedbackUndo();
  allowRepeats = false;
  refreshMemory();
  show("empty", false);
  show("recent", false);
  status(
    "Card preferences cleared. Your discoveries and model downloads were kept.",
  );
  reveal($("browse"));
};
function savedCard(): { id?: unknown; version?: unknown } | null {
  try {
    const value = JSON.parse(localStorage.getItem("pft-card") || "null");
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : null;
  } catch {
    return null;
  }
}
let cacheReady = false;
let cacheEpoch = 0;
async function inspectOfflineCache() {
  const epoch = ++cacheEpoch;
  const refresh = $<HTMLButtonElement>("refresh-cache-inventory");
  refresh.disabled = true;
  if (isAndroidApp()) {
    try {
      const manifest = await (await fetch("/model-manifest.json")).json();
      $("cache-inventory-status").textContent =
        `Bundled pinned package: ${Object.keys(manifest.files).length} model files, ${manifest.totalBytes} bytes. Presence is packaging metadata; an actual match provides inference evidence.`;
    } catch {
      $("cache-inventory-status").textContent =
        "Bundled model inventory could not be read. Try a match or browse the authored guide.";
    }
    refresh.disabled = false;
    return;
  }
  $("cache-inventory-status").textContent =
    "Checking local cached files and runtime hashes… No inference or model download is started.";
  let found = false;
  let shellFound = false,
    runtimeFound = false,
    modelCount = 0,
    inaccessible = false;
  try {
    if ("caches" in window && navigator.serviceWorker?.controller) {
      const names = await caches.keys();
      if (epoch !== cacheEpoch) return;
      const shell = names.filter((n) => n.startsWith("pft-shell-"));
      const appGroups = await Promise.all(
        shell.map(async (n) =>
          (await (await caches.open(n)).keys()).map(
            (r) => new URL(r.url).pathname,
          ),
        ),
      );
      const currentScript = new URL(import.meta.url).pathname;
      const currentStyles = [
        ...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
      ].map((l) => new URL(l.href).pathname);
      shellFound = appGroups.some((keys) =>
        ["/index.html", currentScript, ...currentStyles].every((p) =>
          keys.includes(p),
        ),
      );
      const runtime = await caches.open(RUNTIME_CACHE);
      const runtimeChecks = await Promise.all(
        Object.entries(RUNTIME_HASHES).map(async ([path, expected]) => {
          const response = await runtime.match(path, { ignoreVary: true });
          if (!response?.ok) return false;
          const digest = await crypto.subtle.digest(
            "SHA-256",
            await response.arrayBuffer(),
          );
          return (
            [...new Uint8Array(digest)]
              .map((byte) => byte.toString(16).padStart(2, "0"))
              .join("") === expected
          );
        }),
      );
      const modelName = names.find((n) => n === "pft-model-" + REVISION);
      if (epoch !== cacheEpoch) return;
      const modelKeys = modelName
        ? (await (await caches.open(modelName)).keys()).map((r) =>
            new URL(r.url).pathname.split("/").pop(),
          )
        : [];
      runtimeFound = runtimeChecks.every(Boolean);
      modelCount = [
        "model_quantized.onnx",
        "config.json",
        "tokenizer.json",
        "tokenizer_config.json",
      ].filter((f) => modelKeys.includes(f)).length;
      found =
        shellFound &&
        runtimeFound &&
        [
          "model_quantized.onnx",
          "config.json",
          "tokenizer.json",
          "tokenizer_config.json",
        ].every((f) => modelKeys.includes(f));
    }
  } catch {
    found = false;
    inaccessible = true;
  }
  if (epoch !== cacheEpoch) return;
  cacheReady = found;
  refresh.disabled = false;
  $("cache-inventory-status").textContent = inaccessible
    ? "Cache access failed. Presence is unknown; browse the authored field guide and try checking again."
    : `Checked ${new Date().toISOString()} · controlling service worker: ${navigator.serviceWorker?.controller ? "present" : "absent"} · current app shell: ${shellFound ? "present" : "not found"} · runtime hashes: ${runtimeFound ? "match" : "not verified"} · pinned model filenames: ${modelCount}/4 found. This inventory does not prove offline execution or future retention.`;
  network();
}
$("refresh-cache-inventory").onclick = () => inspectOfflineCache();
function network() {
  if (isAndroidApp()) {
    $("offline-status").textContent =
      "Android App · guide, runtime and model bundled";
    $("model-download-note").textContent =
      "Offline AI is included in this APK. No model download or account is needed.";
    show("offline-routes", true);
    return;
  }
  $("offline-status").textContent =
    `${navigator.onLine ? "Online" : "Offline"} · ${cacheReady ? "app, runtime and model found in cache" : "AI cache incomplete · field guide available"}`;
  $("model-download-note").textContent = !navigator.onLine
    ? cacheReady
      ? "Offline · app, runtime and model files found in cache."
      : "Offline · AI cache incomplete. Authored notes still work."
    : cacheReady
      ? "App, runtime and model files found in this browser’s cache."
      : "First AI match downloads about 50 MB.";
  show("offline-routes", !navigator.onLine);
  const saved = savedCard();
  const canOpen = compatibleSavedCard(
    saved,
    activities.find((a) => a.id === saved?.id),
  );
  show("offline-open-saved", canOpen);
  $<HTMLButtonElement>("offline-open-saved").disabled = !canOpen;
}
window.addEventListener("online", network);
window.addEventListener("offline", network);
notebook = notebookUI({
  get: () => journal,
  commit: (j) => commitJournal(j),
  problem: () => journalProblem,
  readable: () => journalReadable,
  currentTask: () => displayedCard,
  browse: openGuide,
  announce: status,
  onDraftChange: (available) => {
    show("home-draft", available);
    journey?.refresh();
  },
  onNewDraft: (id, task, raw) => activeTrip?.newDraft(id, task, raw),
  onSaved: (id, task, edited) => activeTrip?.saved(id, task, edited),
  openTask: (a) => {
    if (busy) cancelPending("Opening a previous task.");
    mode = "saved";
    ranked = [];
    baseline = [];
    evidence = null;
    show("weak", false);
    show("failure", false);
    render(true, a);
  },
});
activeTrip = activeTripUI({
  hasDraft: () => notebook?.hasDraft() || false,
  resumeDraft: () => notebook?.resumeDraft(),
  openNote: (a) => notebook?.open(a),
  announce: status,
  focusHome: () => {
    if (notebook?.hasDraft()) $("home-resume-draft").focus();
    else
      $<HTMLButtonElement>("journey")
        .querySelector<HTMLButtonElement>("button")
        ?.focus();
  },
  openCard: (a) => {
    if (busy) cancelPending("Matching cancelled. Returning to your kept trip.");
    mode = "return";
    ranked = [];
    baseline = [];
    evidence = null;
    show("weak", false);
    show("failure", false);
    render(true, a);
  },
});
journey = journeyUI({
  hasCard: () => !!displayedCard && !$("result").hidden,
  hasDraft: () => notebook?.hasDraft() || false,
  choose: () => scrollTo($("intent"), true),
  take: () => {
    scrollTo($("result"));
    $("card-title").focus({ preventScroll: true });
  },
  keep: () => {
    if (notebook?.hasDraft()) notebook.resumeDraft();
    else if (displayedCard && !$("result").hidden)
      notebook?.open(displayedCard);
  },
});
$("home-resume-draft").onclick = () => notebook?.resumeDraft();
$("return-open").onclick = () => $("notebook-open").click();
backupUI({
  get: () => journal,
  currentForExport: journalForExport,
  commit: (j) => commitJournal(j),
  problem: () => journalProblem,
  readable: () => journalReadable,
  hasDraft: () => notebook?.hasDraft() || false,
  focusNotebook: () => notebook?.focusHome(),
  afterRestore: () => {
    clearFeedbackUndo();
    notebook?.reset();
    refreshMemory();
  },
  announce: status,
});
rawRescueUI({
  readable: () => journalReadable,
  readRaw: () => readRawNotebook(() => localStorage.getItem(JOURNAL_KEY)),
});
network();
refreshSaved();
intentFeedback();
choiceSummary();
refreshMemory();
inspectOfflineCache();
const attachAppRegistration = setupAppLifecycle(() => {
  if (notebook?.hasDraft())
    return "Save or discard your discovery draft before updating. The draft remains in this tab.";
  if (busy)
    return "Finish or cancel matching before updating. Nothing was reloaded.";
  if ($<HTMLTextAreaElement>("intent").value.trim())
    return "Keep your current intent somewhere you control, then clear the intent field before updating. It is not stored by this app.";
  return null;
});
if (import.meta.env.PROD && !isAndroidApp() && "serviceWorker" in navigator)
  navigator.serviceWorker
    .register("/sw.js")
    .then(attachAppRegistration)
    .catch(() => status("Offline app caching is unavailable in this browser."));
navigator.serviceWorker?.addEventListener(
  "controllerchange",
  inspectOfflineCache,
);

let openCardPacks: (() => void) | undefined;
$("manage-packs").onclick = async () => {
  const button = $<HTMLButtonElement>("manage-packs");
  button.disabled = true;
  try {
    if (!openCardPacks)
      openCardPacks = (await import("./card-pack-ui.ts")).cardPackUI();
    $("pack-load-status").textContent = "";
    openCardPacks();
  } catch {
    $("pack-load-status").textContent =
      "Card-pack tools could not load. Your existing data was kept. Please retry.";
  } finally {
    button.disabled = false;
  }
};

import { mountAndroidApp } from "./android-app.ts";
mountAndroidApp();

notebook?.restoreRecovery();
