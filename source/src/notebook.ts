import { downloadText } from "./text-download.ts";
import { isAndroidApp } from "./android-app.ts";
import {
  ANDROID_DRAFT_KEY,
  parseAndroidDraft,
  keepAndroidDraft,
} from "./android-draft.ts";
import { ACTIVE_TRIP_KEY } from "./active-trip.ts";
import type { Activity } from "./catalog.ts";
import { confirmControl } from "./control-confirmation.ts";
import { closeDiscoverySurface, settleSurface } from "./calm-motion.ts";
import { activeFilterLabels, setupWritingStarters } from "./flow-controls.ts";
import {
  collectionNotes,
  collectionSummary,
  sceneCounts,
  boundaryPair,
} from "./collection.ts";
import { noteOutputUI } from "./note-output.ts";
import { searchNotes, sortNotes, type NoteOrder } from "./local-tools.ts";
import { discoveryReview } from "./discovery-review.ts";
import { lensLabels } from "./lenses.ts";
import {
  noteTags,
  snapshot,
  saveDiscovery,
  removeDiscovery,
  restoreDiscovery,
  knownActivity,
  type Discovery,
  type Journal,
  type NoteTag,
  type Snapshot,
  type Scene,
  sceneLabel,
} from "./journal.ts";
import { filteredNotes, dateRangeValid, validPair } from "./notebook-view.ts";
export function notebookUI(context: {
  get: () => Journal;
  commit: (j: Journal) => boolean | Promise<boolean>;
  problem: () => string | null;
  readable: () => boolean;
  currentTask: () => Activity | null;
  browse: () => void;
  announce: (message: string) => void;
  openTask: (a: Activity) => void;
  onDraftChange?: (available: boolean) => void;
  onNewDraft?: (
    id: string,
    task: Snapshot,
    recoveredTripRaw?: string | null,
  ) => void;
  onSaved?: (id: string, task: Snapshot, edited: boolean) => string | undefined;
}) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const editor = $<HTMLDialogElement>("discovery-editor"),
    book = $<HTMLDialogElement>("notebook");
  const input = $<HTMLTextAreaElement>("discovery-text");
  const refreshStarters = setupWritingStarters(input);
  const sceneInput = $<HTMLSelectElement>("discovery-scene");
  let previousId = "",
    currentId = "",
    comparisonNotice = "";
  const rows = new Map<string, { signature: string; article: HTMLElement }>();
  let comparisonKey = "";
  let bookSession = 0;
  let familyView = "";
  let visibleEntries: Discovery[] = [];
  const selectedNotes = new Set<string>();
  const sceneButtons = new Map<string, HTMLButtonElement>();
  for (const value of sceneCounts([])) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-button";
    button.onclick = () => {
      $<HTMLSelectElement>("notebook-scene").value = value.scene;
      render();
      button.focus();
      settleSurface(
        $("collection-summary"),
        { opacity: 0.96, translate: "0 3px" },
        160,
      );
    };
    sceneButtons.set(value.scene, button);
    $("collection-scenes").append(button);
  }
  const selectedEntries = () =>
    context.get().entries.filter((n) => selectedNotes.has(n.id));
  noteOutputUI(selectedEntries, () => context.readable());
  function selectionStatus() {
    for (const [id, row] of rows) {
      const check = row.article.querySelector<HTMLInputElement>(
        ".discovery-select input",
      );
      if (check) check.checked = selectedNotes.has(id);
    }
    const count = selectedNotes.size;
    $("selected-notes-status").textContent = count
      ? `${count} saved discoveries selected in this view. Preview their private content before output.`
      : "No discoveries selected. Selection stays in this tab only.";
    $<HTMLButtonElement>("prepare-selected-notes").disabled =
      !count || !context.readable();
    $<HTMLButtonElement>("clear-selected-notes").disabled = !count;
  }
  function invalidateCopies() {
    bookSession++;
    for (const { article } of rows.values()) {
      const pending = article.querySelector<HTMLElement>(
        '[data-copy-pending="true"]',
      );
      if (pending) {
        pending.dataset.copyPending = "false";
        pending.textContent = "Copy discovery";
        article.querySelector(".discovery-copy-status")!.textContent = "";
      }
    }
  }
  // Backup dialogs can also close/reopen this surface.
  book.addEventListener("close", invalidateCopies);
  function openBook() {
    invalidateCopies();
    if (isAndroidApp()) {
      if (!book.open) book.show();
    } else book.showModal();
  }
  let draftTask: Snapshot | null = null,
    draftId = "",
    editing = false,
    dirty = false,
    continuedFromNotebook = false,
    tags: NoteTag[] = [],
    undo: { entry: Discovery; index: number } | null = null;
  const node = (tag: string, content: string, className = "") => {
    const el = document.createElement(tag);
    el.textContent = content;
    el.className = className;
    return el;
  };
  let recoveryRaw: string | null = null,
    ownsRecovery = false;
  let draftTripRaw: string | null = null,
    originalUpdatedAt: string | null = null;
  let recoveryProblem = "";
  const recoveryBanner = document.createElement("aside");
  recoveryBanner.className = "home-draft";
  recoveryBanner.id = "android-draft-recovery";
  recoveryBanner.hidden = true;
  const recoveryText = document.createElement("p");
  recoveryText.setAttribute("role", "status");
  const resumeRecovery = document.createElement("button");
  resumeRecovery.id = "android-resume-draft";
  resumeRecovery.textContent = "Resume recovered draft";
  const discardRecovery = document.createElement("button");
  discardRecovery.id = "android-discard-draft";
  discardRecovery.textContent = "Discard recovery copy";
  const exportRecovery = document.createElement("button");
  exportRecovery.id = "android-export-recovery";
  exportRecovery.textContent = "Save recovery copy…";
  exportRecovery.onclick = () => {
    try {
      const raw = localStorage.getItem(ANDROID_DRAFT_KEY);
      if (raw === null || raw.length > 16000)
        throw Error("Recovery copy is unavailable or too large.");
      downloadText(
        "pocket-field-trip-UNVERIFIED-draft-recovery.json",
        JSON.stringify({
          format: "pft-unverified-draft-recovery",
          version: 1,
          raw,
        }) + "\n",
      );
    } catch (e) {
      recoveryText.textContent = String(e);
    }
  };
  recoveryBanner.append(
    recoveryText,
    resumeRecovery,
    exportRecovery,
    discardRecovery,
  );
  if (isAndroidApp()) $("home-draft").before(recoveryBanner);
  function persistRecovery() {
    if (!isAndroidApp()) return;
    try {
      if (dirty && draftTask) {
        if (recoveryBanner.hidden === false && !ownsRecovery)
          throw Error("Resume or discard the earlier recovery copy first.");
        recoveryRaw = keepAndroidDraft(localStorage, recoveryRaw, {
          schema: 1,
          id: draftId,
          task: draftTask,
          text: input.value,
          tags,
          scene: (sceneInput.value || undefined) as Scene | undefined,
          editing,
          originalUpdatedAt,
          noteDone: $<HTMLInputElement>("note-done").checked,
          tripRaw: draftTripRaw,
        });
        ownsRecovery = true;
        recoveryProblem = "";
      } else if (ownsRecovery) {
        recoveryRaw = keepAndroidDraft(localStorage, recoveryRaw, null);
        ownsRecovery = false;
        recoveryProblem = "";
      }
    } catch (e) {
      recoveryProblem = String(e instanceof Error ? e.message : e);
    }
  }
  function restoreRecovery() {
    if (!isAndroidApp()) return;
    try {
      recoveryRaw = localStorage.getItem(ANDROID_DRAFT_KEY);
    } catch {
      recoveryText.textContent =
        "Draft recovery storage is unavailable. Current writing stays in memory.";
      recoveryBanner.hidden = false;
      resumeRecovery.disabled = true;
      discardRecovery.disabled = true;
      return;
    }
    if (!recoveryRaw) return;
    const d = parseAndroidDraft(recoveryRaw);
    recoveryBanner.hidden = false;
    const existing = d && context.get().entries.find((n) => n.id === d.id);
    const alreadySaved =
      existing &&
      d &&
      existing.text === d.text.trim().replace(/\s+/g, " ") &&
      JSON.stringify(existing.tags) === JSON.stringify(d.tags) &&
      existing.scene === d.scene &&
      JSON.stringify(existing.task) === JSON.stringify(d.task) &&
      (!d.editing || existing.updatedAt !== d.originalUpdatedAt);
    if (alreadySaved) {
      try {
        recoveryRaw = keepAndroidDraft(localStorage, recoveryRaw, null);
        recoveryBanner.hidden = true;
        context.announce(
          "The discovery was already saved. Its leftover draft recovery was removed.",
        );
      } catch {}
      return;
    }
    const blocked =
      !d ||
      (d.editing
        ? !existing || existing.updatedAt !== d.originalUpdatedAt
        : !!existing);
    recoveryText.textContent = blocked
      ? "An earlier draft recovery could not be safely resumed. It was preserved; save its unverified recovery copy before discarding it."
      : "An unsaved discovery was recovered on this device. Resume it or explicitly discard this recovery copy. It is not a saved discovery.";
    resumeRecovery.disabled = !!blocked;
    resumeRecovery.onclick = () => {
      if (!d || dirty) {
        context.announce("Keep or discard the current draft first.");
        return;
      }
      try {
        if (localStorage.getItem(ANDROID_DRAFT_KEY) !== recoveryRaw) {
          restoreRecovery();
          return;
        }
      } catch {
        return;
      }
      setDraft(d.task, d.id, d.text, d.tags, d.editing, d.scene, d.tripRaw);
      draftTripRaw = d.tripRaw;
      originalUpdatedAt = d.originalUpdatedAt;
      $<HTMLInputElement>("note-done").checked = d.noteDone;
      ownsRecovery = true;
      dirty = true;
      recoveryBanner.hidden = true;
      syncDraftNotice();
      resumeDraft();
    };
    discardRecovery.onclick = () => {
      if (dirty) {
        recoveryText.textContent =
          "Save or discard the current writing first; its recovery was kept.";
        return;
      }
      if (discardRecovery.dataset.confirm !== "true") {
        discardRecovery.dataset.confirm = "true";
        discardRecovery.textContent = "Confirm discard recovery copy";
        return;
      }
      try {
        recoveryRaw = keepAndroidDraft(localStorage, recoveryRaw, null);
        recoveryBanner.hidden = true;
        ownsRecovery = false;
        discardRecovery.dataset.confirm = "false";
        discardRecovery.textContent = "Discard recovery copy";
      } catch (e) {
        recoveryText.textContent = String(e);
      }
    };
  }
  let tagLimitVisible = false;
  const message = (value: string) => {
    tagLimitVisible = false;
    $("discovery-message").textContent = value;
  };
  function focusHome() {
    const target = !$("notebook-draft").hidden
      ? $("resume-discovery")
      : !$("notebook-start").hidden
        ? $("notebook-start")
        : $("notebook-search").closest<HTMLElement>("label")!.hidden
          ? $("close-notebook")
          : $("notebook-search");
    target.focus();
  }
  // Touch does not reliably expose :active while held in mobile Chrome.
  // A bounded pointer state supplies immediate feedback, without a timer,
  // capture, motion or changing selection before the native click.
  let pressing: { button: HTMLButtonElement; pointerId: number } | null = null;
  const clearPress = () => {
    if (pressing) delete pressing.button.dataset.pressing;
    pressing = null;
  };
  $("discovery-tags").addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || !["touch", "pen"].includes(event.pointerType))
      return;
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button",
    );
    if (!button || button.disabled) return;
    clearPress();
    pressing = { button, pointerId: event.pointerId };
    button.dataset.pressing = "true";
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    document.addEventListener(type, (event) => {
      if (pressing?.pointerId === (event as PointerEvent).pointerId)
        clearPress();
    });
  editor.addEventListener("close", clearPress);
  window.addEventListener("blur", clearPress);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearPress();
  });
  function focusNote(id: string) {
    const article = rows.get(id)?.article;
    // The edited note can fall outside the current search or filters.
    const target = article?.isConnected
      ? Array.from(article.querySelectorAll<HTMLButtonElement>("button")).find(
          (button) =>
            !button.disabled &&
            button.getClientRects().length > 0 &&
            getComputedStyle(button).visibility !== "hidden",
        )
      : undefined;
    if (target) target.focus();
    else focusHome();
  }
  function syncDraftNotice() {
    persistRecovery();
    context.onDraftChange?.(dirty && !!draftTask);
    const backupStatus = $("backup-status");
    if (!dirty && backupStatus.dataset.draftBlocked === "true") {
      backupStatus.dataset.draftBlocked = "false";
      backupStatus.textContent =
        "Draft resolved. You can choose a JSON backup to restore.";
    }
    const notice = $("draft-status");
    notice.hidden = !dirty || !draftTask;
    notice.textContent =
      dirty && draftTask
        ? `Unsaved draft for “${draftTask.title}” · this tab only. Write one discovery continues it.`
        : "";
    $("notebook-draft").hidden = !dirty || !draftTask;
    $("notebook-draft-status").textContent =
      dirty && draftTask
        ? `Unsaved draft for “${draftTask.title}” · this tab only.`
        : "";
    if (isAndroidApp() && dirty && draftTask) {
      const label = recoveryProblem
        ? " · recovery was not verified: " + recoveryProblem
        : " · recovery kept privately on this device; Save adds it to your notebook.";
      notice.textContent = `Unsaved draft for “${draftTask.title}”${label}`;
      const home = $("home-draft").querySelector("p");
      if (home)
        home.textContent = recoveryProblem
          ? "One unsaved discovery · recovery was not verified. Keep your words before closing."
          : "One unsaved discovery · recovery kept privately on this device.";
      $("notebook-draft-status").textContent = notice.textContent;
    }
  }
  function resumeDraft() {
    if (!dirty || !draftTask) {
      if (isAndroidApp() && recoveryRaw !== null) {
        restoreRecovery();
        recoveryBanner.scrollIntoView({ block: "center", behavior: "instant" });
        (resumeRecovery.disabled ? exportRecovery : resumeRecovery).focus();
      }
      return;
    }
    continuedFromNotebook = book.open;
    if (book.open) book.close();
    message("Continuing your unsaved draft. Only Save keeps it.");
    if (!editor.open) editor.showModal();
    input.focus();
  }
  $("resume-discovery").onclick = resumeDraft;
  function updateTags(rebuild = true) {
    if (!rebuild) {
      for (const b of $("discovery-tags").querySelectorAll<HTMLButtonElement>(
        "button",
      ))
        b.setAttribute(
          "aria-pressed",
          String(tags.includes(b.textContent as NoteTag)),
        );
      return;
    }
    $("discovery-tags").replaceChildren(
      ...noteTags.map((tag) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = tag;
        b.setAttribute("aria-pressed", String(tags.includes(tag)));
        b.onclick = () => {
          if (tags.includes(tag)) tags = tags.filter((t) => t !== tag);
          else if (tags.length < 3) tags = [...tags, tag];
          else {
            message("Choose up to three tags. Remove one to choose another.");
            tagLimitVisible = true;
            return;
          }
          if (tagLimitVisible) message("");
          dirty = true;
          syncDraftNotice();
          updateTags(false);
        };
        return b;
      }),
    );
  }
  function setDraft(
    task: Snapshot,
    id: string,
    line = "",
    selected: NoteTag[] = [],
    isEditing = false,
    scene?: Scene,
    recoveredTripRaw?: string | null,
  ) {
    $("record").textContent = "Write one discovery";
    $("record").dataset.confirmed = "false";
    draftTask = task;
    draftId = id;
    editing = isEditing;
    if (!isEditing) context.onNewDraft?.(id, task, recoveredTripRaw);
    if (isAndroidApp()) {
      try {
        draftTripRaw =
          recoveredTripRaw === undefined
            ? localStorage.getItem(ACTIVE_TRIP_KEY)
            : recoveredTripRaw;
      } catch {
        draftTripRaw = null;
      }
      originalUpdatedAt = isEditing
        ? context.get().entries.find((n) => n.id === id)?.updatedAt || null
        : null;
    }
    input.value = line;
    tags = [...selected];
    sceneInput.value = scene || "";
    dirty = false;
    $("discovery-title").textContent = isEditing
      ? "Edit your discovery"
      : "One thing you noticed.";
    $("discovery-task").textContent = task.title;
    $("discovery-prompt").textContent = task.prompt;
    $("done-with-note").hidden = isEditing;
    $<HTMLInputElement>("note-done").checked = true;
    updateTags();
    message("");
    count();
    syncDraftNotice();
  }
  function count() {
    $("discovery-count").textContent = `${input.value.length} / 280`;
    refreshStarters();
  }
  input.oninput = () => {
    dirty = true;
    count();
    syncDraftNotice();
  };
  $("note-done").addEventListener("change", () => {
    dirty = true;
    syncDraftNotice();
  });
  sceneInput.onchange = () => {
    dirty = true;
    syncDraftNotice();
  };
  let savingDiscovery = false;
  $("discovery-form").onsubmit = async (event) => {
    event.preventDefault();
    if (!editor.open || !draftTask || savingDiscovery) return;
    savingDiscovery = true;
    $<HTMLButtonElement>("save-discovery").disabled = true;
    const form = $("discovery-form");
    const controls = [
      ...form.querySelectorAll<
        | HTMLInputElement
        | HTMLButtonElement
        | HTMLSelectElement
        | HTMLTextAreaElement
      >("input,button,select,textarea"),
    ].map((control) => ({ control, disabled: control.disabled }));
    for (const { control } of controls) control.disabled = true;
    form.setAttribute("aria-busy", "true");
    message("Saving your discovery…");
    try {
      const next = saveDiscovery(
        context.get(),
        {
          id: draftId,
          text: input.value,
          tags,
          task: draftTask,
          markDone: !editing && $<HTMLInputElement>("note-done").checked,
          scene: (sceneInput.value || null) as Scene | null,
        },
        new Date().toISOString(),
      );
      if (!(await context.commit(next))) {
        message(
          (isAndroidApp() ? "Saving was not confirmed. " : "Not saved. ") +
            (context.problem() ||
              "Your draft is still here; no completion was recorded. Retry when browser storage is available."),
        );
        return;
      }
      const savedTask = draftTask;
      const wasEditing = editing;
      const returnToBook = continuedFromNotebook;
      continuedFromNotebook = false;
      dirty = false;
      draftTask = null;
      input.value = "";
      editing = false;
      closeDiscoverySurface(editor, true);
      render();
      const success = wasEditing
        ? "Discovery updated. Completion order unchanged."
        : isAndroidApp()
          ? "Discovery saved on this device. Nothing was uploaded."
          : "Discovery saved on this browser. Nothing was uploaded.";
      $("notebook-status").textContent = success;
      context.announce(success);
      if (wasEditing || returnToBook) {
        openBook();
        focusNote(draftId);
        if (!rows.get(draftId)?.article.isConnected)
          $("notebook-status").textContent +=
            " This discovery is outside the current search or filters.";
      } else {
        $("record").textContent = "Discovery saved ✓";
        $("record").dataset.confirmed = "true";
        $("record").focus();
        confirmControl($("record"));
      }
      const tripNotice = context.onSaved?.(draftId, savedTask, wasEditing);
      if (tripNotice) {
        $("notebook-status").textContent += " " + tripNotice;
        context.announce(success + " " + tripNotice);
      }
    } catch (error) {
      message(String(error instanceof Error ? error.message : error));
    } finally {
      savingDiscovery = false;
      for (const { control, disabled } of controls) control.disabled = disabled;
      form.setAttribute("aria-busy", "false");
      $<HTMLButtonElement>("save-discovery").disabled = false;
    }
  };
  function closeEditor() {
    if (savingDiscovery) return;
    closeDiscoverySurface(editor);
    syncDraftNotice();
    const returnToBook = editing || continuedFromNotebook;
    continuedFromNotebook = false;
    if (returnToBook) {
      render();
      openBook();
      if (rows.get(draftId)?.article.isConnected) focusNote(draftId);
      else if (dirty) $("resume-discovery").focus();
      else focusHome();
    }
  }
  $("close-discovery").onclick = closeEditor;
  editor.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeEditor();
  });
  $("discard-discovery").onclick = () => {
    if (savingDiscovery) return;
    dirty = false;
    draftTask = null;
    input.value = "";
    tags = [];
    syncDraftNotice();
    const wasEditing = editing;
    const returnToBook = continuedFromNotebook;
    continuedFromNotebook = false;
    editing = false;
    closeDiscoverySurface(editor);
    if (wasEditing || returnToBook) {
      render();
      openBook();
      focusNote(draftId);
    }
  };
  window.addEventListener("beforeunload", (event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  function open(a: Activity) {
    if (isAndroidApp() && recoveryRaw !== null && !ownsRecovery && !dirty) {
      context.announce(
        "Resume or discard the earlier recovered draft before starting a new discovery. Its words were preserved.",
      );
      resumeDraft();
      return;
    }
    continuedFromNotebook = false;
    if (dirty && draftTask) {
      message(
        `Your unsaved draft for “${draftTask.title}” was kept. Save it or discard it before starting a different discovery.`,
      );
      if (!editor.open) editor.showModal();
      input.focus();
      return;
    }
    setDraft(snapshot(a), crypto.randomUUID());
    editor.showModal();
    input.focus();
  }
  function edit(n: Discovery) {
    continuedFromNotebook = false;
    if (dirty && draftTask) {
      continuedFromNotebook = true;
      book.close();
      message("Your unsaved draft was kept. Save or discard it first.");
      editor.showModal();
      input.focus();
      return;
    }
    setDraft(n.task, n.id, n.text, n.tags, true, n.scene);
    book.close();
    editor.showModal();
    input.focus();
  }
  function render() {
    const searchLabel = $("notebook-search").closest<HTMLElement>("label")!;
    const hidesFocusedTool =
      book.open &&
      (searchLabel.contains(document.activeElement) ||
        $("notebook-tools").contains(document.activeElement));
    syncDraftNotice();
    $("record").textContent = "Write one discovery";
    $("record").dataset.confirmed = "false";
    const j = context.get();
    book.dataset.depth = String(Math.min(3, j.entries.length));
    const readable = context.readable();
    const stats = collectionSummary(j.entries);
    $("notebook-collection").hidden = !readable || !stats.notes;
    $("collection-summary").textContent =
      `${stats.notes} discoveries · ${stats.days} UTC days with notes · ${stats.lenses} lenses · ${stats.scenes} chosen scene categories`;
    for (const value of sceneCounts(j.entries)) {
      const button = sceneButtons.get(value.scene)!;
      button.textContent = `${value.label} · ${value.count}`;
      button.setAttribute(
        "aria-pressed",
        String($<HTMLSelectElement>("notebook-scene").value === value.scene),
      );
      button.disabled = !value.count;
    }
    const month = $<HTMLSelectElement>("notebook-month"),
      chosenMonth = month.value;
    const months = [...new Set(j.entries.map((n) => n.createdAt.slice(0, 7)))]
      .sort()
      .reverse();
    if (chosenMonth !== "any" && !months.includes(chosenMonth))
      months.push(chosenMonth);
    if (JSON.stringify(months) !== month.dataset.months) {
      month.replaceChildren(
        new Option("All months", "any"),
        ...months.map((m) => new Option(m, m)),
      );
      month.value = chosenMonth;
      month.dataset.months = JSON.stringify(months);
    }
    $("notebook-count").textContent = readable ? String(j.entries.length) : "—";
    $("notebook-summary").textContent = !readable
      ? "Stored content is unreadable here; its count is unknown. / 此处无法读取存储内容，条目数未知。"
      : j.entries.length
        ? `${j.entries.length} ${j.entries.length === 1 ? "discovery" : "discoveries"} · only on this browser`
        : "Only on this browser.";
    $("notebook-problem").textContent = context.problem() || "";
    const filter = {
      tag: $<HTMLSelectElement>("notebook-filter").value,
      scene: $<HTMLSelectElement>("notebook-scene").value,
      from: $<HTMLInputElement>("notebook-from").value,
      to: $<HTMLInputElement>("notebook-to").value,
    };
    const entries = sortNotes(
      searchNotes(
        collectionNotes(filteredNotes(j.entries, filter), {
          lens: $<HTMLSelectElement>("notebook-lens").value,
          month: month.value,
          family: familyView,
        }),
        $<HTMLInputElement>("notebook-search").value,
      ),
      $<HTMLSelectElement>("notebook-sort").value as NoteOrder,
    );
    const hasFilters = !!(
      $<HTMLInputElement>("notebook-search").value.trim() ||
      filter.tag !== "any" ||
      filter.scene !== "any" ||
      filter.from ||
      filter.to ||
      $<HTMLSelectElement>("notebook-lens").value !== "any" ||
      month.value !== "any" ||
      familyView
    );
    const initialEmpty = readable && !j.entries.length && !hasFilters;
    searchLabel.hidden = initialEmpty;
    $("notebook-tools").hidden = initialEmpty;
    $("notebook-tools-jump").hidden = !entries.length;
    $("notebook-start").hidden = !initialEmpty || dirty;
    $("notebook-start").textContent = context.currentTask()
      ? "Write one discovery"
      : "Browse field notes";
    $("notebook-filter-status").hidden = readable && !hasFilters;
    $("notebook-filter-status").textContent = !readable
      ? "Stored notebook cannot be filtered here. Count unknown. / 此处无法筛选原始笔记，条目数未知。"
      : !dateRangeValid(filter)
        ? "Choose a through date on or after the from date."
        : `${entries.length} of ${j.entries.length} discoveries shown.`;
    $("notebook-view-context").hidden = !hasFilters;
    $("active-note-filters").textContent = context.readable()
      ? activeFilterLabels({
          ...filter,
          scene:
            filter.scene === "any"
              ? "any"
              : $<HTMLSelectElement>("notebook-scene").selectedOptions[0]
                  ?.textContent || "",
          search: $<HTMLInputElement>("notebook-search").value,
          lens:
            $<HTMLSelectElement>("notebook-lens").selectedOptions[0]?.value ===
            "any"
              ? "any"
              : $<HTMLSelectElement>("notebook-lens").selectedOptions[0]
                  ?.textContent || "",
          month: month.value,
          family: familyView,
        }).join(" · ")
      : "";
    $("notebook-density").hidden = !readable || !j.entries.length;
    // Total count already leads the notebook; the live filtered count above
    // replaces the second repeated count for readable records.
    $("notebook-view-summary").hidden = readable;
    $("notebook-view-summary").textContent = !readable
      ? "Stored content is not shown. Count unknown. / 原始内容未显示，条目数未知。"
      : dateRangeValid(filter)
        ? `${entries.length} of ${j.entries.length} saved notes in this view.`
        : "This date range is reversed. No notes are shown.";
    renderComparison(entries);
    visibleEntries = entries;
    $("family-view").hidden = !familyView;
    $("family-view-label").textContent = familyView
      ? "Task-family view: " +
        familyView +
        ". Same content family, not necessarily the same place."
      : "";
    $("note-selection-tools").hidden = !readable || !j.entries.length;
    let removedSelections = 0;
    for (const id of selectedNotes) {
      const n = entries.find((n) => n.id === id);
      if (
        !readable ||
        !n ||
        (rows.has(id) && rows.get(id)!.signature !== JSON.stringify(n))
      ) {
        selectedNotes.delete(id);
        removedSelections++;
      }
    }
    if (removedSelections)
      $("notebook-status").textContent =
        `${removedSelections} selected discoveries cleared because they changed or left this view. Preview the remaining selection again.`;
    const retainedIds = new Set(j.entries.map((n) => n.id));
    for (const id of rows.keys()) if (!retainedIds.has(id)) rows.delete(id);
    const articles = entries.map((n) => {
      const signature = JSON.stringify(n);
      const cached = rows.get(n.id);
      if (cached?.signature === signature) return cached.article;
      const article = document.createElement("article");
      article.className = "discovery-note";
      article.dataset.noteId = n.id;
      article.dataset.expanded = cached?.article.dataset.expanded || "false";
      const selection = document.createElement("label");
      selection.className = "discovery-select";
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = selectedNotes.has(n.id);
      check.setAttribute("aria-label", "Select saved discovery: " + n.text);
      check.onchange = () => {
        if (check.checked) selectedNotes.add(n.id);
        else selectedNotes.delete(n.id);
        selectionStatus();
      };
      selection.append(
        check,
        document.createTextNode("Select for private output"),
      );
      const meta = node(
        "p",
        `${lensLabels[n.task.lens]} · ${n.createdAt.slice(0, 10)} (UTC) · ${sceneLabel(n.scene)}`,
        "eyebrow",
      );
      const line = node("p", n.text, "discovery-line"),
        title = node("p", n.task.title, "discovery-task-name"),
        labels = node(
          "p",
          n.tags.map((t) => "#" + t).join(" "),
          "discovery-labels",
        );
      const actions = document.createElement("div");
      actions.className = "discovery-actions";
      actions.id = "note-actions-" + crypto.randomUUID();
      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.className = "text-button";
      editButton.setAttribute("aria-label", `Edit discovery: ${n.text}`);
      editButton.onclick = () => edit(n);
      const copy = document.createElement("button");
      copy.className = "text-button";
      copy.textContent = "Copy discovery";
      copy.setAttribute("aria-label", `Copy discovery: ${n.text}`);
      const copyStatus = node("p", "", "discovery-copy-status");
      copyStatus.setAttribute("role", "status");
      let copyAttempt = 0;
      copy.onclick = async () => {
        const attempt = ++copyAttempt;
        const session = bookSession;
        const current = () =>
          attempt === copyAttempt &&
          session === bookSession &&
          book.open &&
          article.isConnected &&
          context
            .get()
            .entries.some(
              (entry) => entry.id === n.id && entry.text === n.text,
            );
        copy.textContent = "Copying…";
        copy.dataset.copyPending = "true";
        copyStatus.textContent = "";
        try {
          await navigator.clipboard.writeText(n.text);
          if (!current()) return;
          copy.dataset.copyPending = "false";
          copy.textContent = "Copied ✓";
          copyStatus.textContent =
            "Copied. Your discovery is on the clipboard.";
          confirmControl(copy);
        } catch {
          if (!current()) return;
          copy.dataset.copyPending = "false";
          copy.textContent = "Copy discovery";
          copyStatus.textContent =
            "Clipboard unavailable. Select this line and copy it yourself.";
          const range = document.createRange();
          range.selectNodeContents(line);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        } finally {
          // A filtered-out row can be reused later. A completed request must
          // not leave its button permanently pending or announce offscreen.
          if (
            attempt === copyAttempt &&
            session === bookSession &&
            copy.dataset.copyPending === "true"
          ) {
            copy.dataset.copyPending = "false";
            copy.textContent = "Copy discovery";
          }
        }
      };
      const remove = document.createElement("button");
      remove.textContent = "Delete";
      remove.className = "text-button";
      remove.setAttribute("aria-label", `Delete discovery: ${n.text}`);
      remove.onclick = async () => {
        const current = context.get();
        const index = current.entries.findIndex((x) => x.id === n.id);
        if (!(await context.commit(removeDiscovery(current, n.id)))) {
          $("notebook-status").textContent =
            "Deletion failed. Your discovery was kept.";
          return;
        }
        undo = { entry: n, index };
        render();
        $("notebook-status").textContent =
          "Discovery deleted. Undo is available here; completion preferences are unchanged.";
        $("undo-discovery").focus();
      };
      const revisit = document.createElement("button");
      revisit.textContent = "Revisit task";
      revisit.className = "text-button";
      revisit.disabled =
        !knownActivity(n.task.id) ||
        knownActivity(n.task.id)?.version !== n.task.version;
      revisit.onclick = () => {
        const a = knownActivity(n.task.id);
        if (!a) return;
        if (dirty && draftTask) {
          book.close();
          open(a);
          continuedFromNotebook = true;
          return;
        }
        book.close();
        context.openTask(a);
      };
      const related = document.createElement("button");
      related.type = "button";
      related.className = "text-button";
      related.textContent = "More from this task family";
      related.onclick = () => {
        familyView = n.task.family;
        render();
        $("clear-family-view").focus();
      };
      const details = document.createElement("details");
      details.className = "note-snapshot";
      details.id = "note-snapshot-" + crypto.randomUUID();
      details.open = cached?.article.querySelector("details")?.open || false;
      const summary = node("summary", "Stored task snapshot · read-only");
      const steps = document.createElement("ol");
      n.task.steps.forEach((s) => steps.append(node("li", s)));
      details.append(
        summary,
        steps,
        node("small", `Card ${n.task.id} · ${n.task.version}`),
      );
      actions.append(editButton, copy, remove, revisit, related);
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "text-button discovery-row-toggle";
      toggle.setAttribute("aria-controls", actions.id + " " + details.id);
      const refreshToggle = () => {
        const expanded = article.dataset.expanded === "true";
        toggle.textContent = expanded
          ? "Hide note actions"
          : "Show note actions";
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.setAttribute(
          "aria-label",
          `${expanded ? "Hide" : "Show"} actions for discovery: ${n.text}`,
        );
      };
      refreshToggle();
      toggle.onclick = () => {
        invalidateCopies();
        article.dataset.expanded =
          article.dataset.expanded === "true" ? "false" : "true";
        refreshToggle();
      };
      article.append(
        meta,
        line,
        title,
        labels,
        selection,
        toggle,
        actions,
        copyStatus,
        details,
      );
      rows.set(n.id, { signature, article });
      return article;
    });
    // Reconcile only changed rows; retained nodes keep disclosure, copy state
    // and focus. Filtered rows remain cached while their saved entry exists.
    const list = $("notebook-list");
    let cursor = list.firstElementChild;
    for (const article of articles) {
      if (article === cursor) cursor = cursor.nextElementSibling;
      else list.insertBefore(article, cursor);
    }
    while (cursor) {
      const next = cursor.nextElementSibling;
      cursor.remove();
      cursor = next;
    }
    $("notebook-empty").hidden = entries.length > 0;
    $("notebook-empty").textContent = !readable
      ? "Original stored content was not replaced by an empty notebook. / 原始存储内容未被空笔记替换。"
      : j.entries.length
        ? "No discoveries match this view."
        : "Keep one thing you noticed after a field trip.";
    $("undo-discovery").hidden = !undo;
    selectionStatus();
    if (initialEmpty && hidesFocusedTool) focusHome();
  }
  $("notebook-open").onclick = () => {
    render();
    openBook();
  };
  $("notebook-start").onclick = () => {
    if (
      !book.open ||
      !context.readable() ||
      context.get().entries.length ||
      dirty
    )
      return;
    const task = context.currentTask();
    book.close();
    if (task) {
      open(task);
      continuedFromNotebook = true;
    } else context.browse();
  };
  $("close-notebook").onclick = () => book.close();
  $("notebook-tools-jump").onclick = focusHome;
  $("notebook-search").oninput = render;
  $("notebook-search").addEventListener("search", render);
  $("notebook-sort").onchange = render;
  $("notebook-density").onclick = () => {
    invalidateCopies();
    const compact = book.dataset.density !== "compact";
    book.dataset.density = compact ? "compact" : "full";
    $("notebook-density").setAttribute("aria-pressed", String(compact));
    $("notebook-density").textContent = compact
      ? "Use full view"
      : "Use compact view";
    if (compact) {
      for (const row of rows.values()) {
        if (
          row.article.contains(document.activeElement) &&
          row.article.dataset.expanded !== "true"
        )
          row.article
            .querySelector<HTMLButtonElement>(".discovery-row-toggle")
            ?.focus();
      }
    }
  };
  $("notebook-filter").onchange = render;
  for (const id of ["notebook-lens", "notebook-month"]) $(id).onchange = render;
  $("select-visible-notes").onclick = () => {
    if (!context.readable()) return;
    for (const n of visibleEntries) selectedNotes.add(n.id);
    selectionStatus();
  };
  $("clear-selected-notes").onclick = () => {
    selectedNotes.clear();
    selectionStatus();
  };
  $("clear-family-view").onclick = () => {
    familyView = "";
    render();
    focusHome();
  };
  for (const id of ["notebook-scene", "notebook-from", "notebook-to"])
    $(id).onchange = render;
  $("clear-note-filters").onclick = () => {
    $<HTMLInputElement>("notebook-search").value = "";
    $<HTMLSelectElement>("notebook-filter").value = "any";
    $<HTMLSelectElement>("notebook-scene").value = "any";
    $<HTMLInputElement>("notebook-from").value = "";
    $<HTMLInputElement>("notebook-to").value = "";
    $<HTMLSelectElement>("notebook-lens").value = "any";
    $<HTMLSelectElement>("notebook-month").value = "any";
    familyView = "";
    render();
  };
  $("clear-view-filters").onclick = () => {
    $("clear-note-filters").click();
    focusHome();
  };
  function renderComparison(entries: Discovery[]) {
    const key = JSON.stringify([
      entries,
      previousId,
      currentId,
      comparisonNotice,
    ]);
    if (key === comparisonKey) return;
    const invalidated = [previousId, currentId].some(
      (id) => id && !entries.some((n) => n.id === id),
    );
    if (invalidated)
      comparisonNotice =
        "A selected discovery was removed from this comparison. Choose it again if it is visible. ";
    if (!entries.some((n) => n.id === previousId)) previousId = "";
    if (!entries.some((n) => n.id === currentId)) currentId = "";
    for (const [id, selected, other] of [
      ["compare-previous", previousId, currentId],
      ["compare-current", currentId, previousId],
    ]) {
      const select = $<HTMLSelectElement>(id);
      select.replaceChildren(
        new Option("Choose a discovery", ""),
        ...entries.map((n, i) => {
          const option = new Option(
            `${i + 1}. ${n.createdAt.slice(0, 10)} · ${sceneLabel(n.scene)} · ${n.text.slice(0, 60)}`,
            n.id,
          );
          option.disabled = n.id === other;
          return option;
        }),
      );
      select.value = selected;
      select.disabled = entries.length < 2;
    }
    const pair = validPair(entries, previousId, currentId);
    $<HTMLButtonElement>("compare-boundaries").disabled = entries.length < 2;
    $<HTMLButtonElement>("swap-comparison").disabled = !pair;
    const container = $("comparison-notes");
    const openedSnapshots = new Set(
      Array.from(container.querySelectorAll<HTMLElement>(".comparison-note"))
        .filter((a) => a.querySelector("details")?.open)
        .map((a) => a.dataset.noteId),
    );
    container.hidden = !pair;
    container.replaceChildren(
      ...(pair || []).map((n, index) => {
        const article = document.createElement("article");
        article.className = "comparison-note";
        article.dataset.noteId = n.id;
        article.append(
          node(
            "h4",
            index === 0 ? "Previous · your choice" : "This time · your choice",
          ),
          node(
            "p",
            `${n.createdAt.slice(0, 10)} (UTC) · ${sceneLabel(n.scene)}`,
            "eyebrow",
          ),
          node("p", n.text, "discovery-line"),
          node("p", n.task.title, "discovery-task-name"),
          node(
            "p",
            n.tags.map((tag) => "#" + tag).join(" "),
            "discovery-labels",
          ),
        );
        const storedSnapshot = discoveryReview(n).querySelector("details")!;
        storedSnapshot.open = openedSnapshots.has(n.id);
        article.append(storedSnapshot);
        return article;
      }),
    );
    $("comparison-status").textContent =
      comparisonNotice +
      (entries.length < 2
        ? "Two visible discoveries are needed for a comparison."
        : pair
          ? "Showing your two saved observations. No AI analysis or same-place claim."
          : "Choose two different discoveries to compare.");
    $("clear-comparison").hidden = !previousId && !currentId;
    comparisonKey = JSON.stringify([
      entries,
      previousId,
      currentId,
      comparisonNotice,
    ]);
  }
  $("swap-comparison").onclick = () => {
    if (!validPair(visibleEntries, previousId, currentId)) return;
    [previousId, currentId] = [currentId, previousId];
    comparisonNotice = "Positions swapped by your explicit choice. ";
    render();
    $("swap-comparison").focus();
  };
  $("compare-previous").onchange = () => {
    comparisonNotice = "";
    previousId = $<HTMLSelectElement>("compare-previous").value;
    render();
  };
  $("compare-boundaries").onclick = () => {
    const pair = boundaryPair(visibleEntries);
    if (!pair) return;
    [previousId, currentId] = pair;
    comparisonNotice =
      "Earliest and latest visible discoveries selected by your explicit request. ";
    render();
    $("compare-current").focus();
  };
  $("compare-current").onchange = () => {
    comparisonNotice = "";
    currentId = $<HTMLSelectElement>("compare-current").value;
    render();
  };
  $("clear-comparison").onclick = () => {
    comparisonNotice = "";
    previousId = "";
    currentId = "";
    render();
    if ($<HTMLSelectElement>("compare-previous").disabled) focusHome();
    else $("compare-previous").focus();
  };
  $("undo-discovery").onclick = async () => {
    if (!undo) return;
    const restoredId = undo.entry.id;
    try {
      if (
        !(await context.commit(
          restoreDiscovery(context.get(), undo.entry, undo.index),
        ))
      ) {
        $("notebook-status").textContent =
          "Undo could not be saved. The deleted discovery remains available to retry.";
        return;
      }
      undo = null;
      render();
      $("notebook-status").textContent =
        "Discovery restored. Completion order unchanged.";
      focusNote(restoredId);
    } catch (error) {
      $("notebook-status").textContent = String(error);
    }
  };
  function reset() {
    if (isAndroidApp()) {
      try {
        recoveryRaw = localStorage.getItem(ANDROID_DRAFT_KEY);
        if (recoveryRaw === null) {
          ownsRecovery = false;
          recoveryProblem = "";
          recoveryBanner.hidden = true;
        }
      } catch {}
    }
    selectedNotes.clear();
    familyView = "";
    comparisonNotice = "";
    previousId = "";
    currentId = "";
    editing = false;
    continuedFromNotebook = false;
    undo = null;
    dirty = false;
    draftTask = null;
    input.value = "";
    tags = [];
    if (editor.open) editor.close();
    render();
  }
  render();
  return {
    open,
    render,
    reset,
    focusHome,
    resumeDraft,
    restoreRecovery,
    hasDraft: () => dirty || (isAndroidApp() && recoveryRaw !== null),
  };
}
