import {
  exportBackup,
  parseBackup,
  planRestore,
  MAX_BACKUP_BYTES,
  type Backup,
  type RestoreMode,
} from "./backup.ts";
import { discoveryReview } from "./discovery-review.ts";
import type { Journal } from "./journal.ts";
import { notebookPlainText } from "./readable-notes.ts";
import { downloadText } from "./text-download.ts";
import { readLocalJSON } from "./local-json.ts";

export function backupUI(context: {
  get: () => Journal;
  currentForExport: () => Journal;
  commit: (j: Journal) => boolean | Promise<boolean>;
  problem: () => string | null;
  readable: () => boolean;
  hasDraft: () => boolean;
  afterRestore: () => void;
  focusNotebook: () => void;
  announce: (message: string) => void;
}) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const book = $<HTMLDialogElement>("notebook"),
    dialog = $<HTMLDialogElement>("restore-notebook");
  const file = $<HTMLInputElement>("restore-file"),
    choose = $<HTMLButtonElement>("choose-backup");
  const stopRead = $<HTMLButtonElement>("cancel-backup-read");
  const confirm = $<HTMLButtonElement>("confirm-restore"),
    preferences = $<HTMLInputElement>("restore-preferences");
  const acknowledgement = $<HTMLInputElement>("restore-replace-ack");
  let staged: Backup | null = null,
    base = "",
    readEpoch = 0,
    readingEpoch: number | null = null;
  const status = (message: string, blockedByDraft = false) => {
    $("backup-status").textContent = message;
    $("backup-status").dataset.draftBlocked = String(blockedByDraft);
  };
  const mode = () =>
    (document.querySelector<HTMLInputElement>(
      'input[name="restore-mode"]:checked',
    )?.value || "merge") as RestoreMode;
  function requireReadable() {
    if (!context.readable())
      throw Error(
        "Stored notebook format is unreadable. Original bytes were kept. Restore is blocked until a compatible version can read them or you explicitly clear personal data.",
      );
  }
  $("export-notebook").onclick = () => {
    try {
      if (!context.readable())
        throw Error(
          "Stored notebook format is unreadable. Original bytes were kept; a supported backup cannot be created from it.",
        );
      const journal = context.currentForExport();
      const raw = exportBackup(journal, new Date().toISOString());
      downloadText(
        `pocket-field-trip-notebook-${new Date().toISOString().slice(0, 10)}.json`,
        raw,
        "application/json",
      );
      status(
        `Backup download requested for ${journal.entries.length} saved discoveries. Keep the JSON file somewhere you control. Unsaved drafts are not included.`,
      );
    } catch (error) {
      status(
        `Backup download could not be requested. Saved discoveries were kept. ${String(error instanceof Error ? error.message : error)}`,
      );
    }
  };
  $("export-notebook-text").onclick = () => {
    try {
      requireReadable();
      const journal = context.currentForExport();
      const now = new Date().toISOString();
      downloadText(
        `pocket-field-trip-discoveries-${now.slice(0, 10)}.txt`,
        notebookPlainText(journal, now),
      );
      status(
        `Readable copy download requested for all ${journal.entries.length} saved discoveries. Unsaved drafts are excluded. Keep JSON for restoration.`,
      );
    } catch (error) {
      status(
        `Readable copy download could not be requested. Saved discoveries were kept. ${String(error instanceof Error ? error.message : error)}`,
      );
    }
  };
  choose.onclick = () => {
    try {
      requireReadable();
    } catch (error) {
      status(String(error instanceof Error ? error.message : error));
      return;
    }
    if (context.hasDraft()) {
      status(
        "Save or discard your discovery draft before restoring a backup. Your draft was kept.",
        true,
      );
      return;
    }
    file.value = "";
    file.click();
  };
  file.addEventListener("cancel", () => {
    if (!book.open || readingEpoch !== null) return;
    status(
      "File choice cancelled. Existing discoveries and preferences were kept.",
    );
    choose.focus();
  });
  stopRead.onclick = () => {
    if (readingEpoch === null) return;
    readEpoch++;
    readingEpoch = null;
    choose.disabled = false;
    stopRead.hidden = true;
    file.value = "";
    status(
      "Stopped waiting for the file. Existing discoveries and preferences were kept. You can choose a backup again.",
    );
    choose.focus();
  };
  file.onchange = async () => {
    const selected = file.files?.[0];
    if (!selected || !book.open) return;
    const epoch = ++readEpoch;
    readingEpoch = epoch;
    choose.disabled = true;
    stopRead.hidden = false;
    status("Reading a local JSON file. Nothing has been changed.");
    try {
      requireReadable();
      if (selected.size > MAX_BACKUP_BYTES)
        throw Error(
          "Choose a JSON backup no larger than 1 MiB. Nothing was changed.",
        );
      const parsed = parseBackup(await readLocalJSON(selected));
      if (epoch !== readEpoch || !book.open) return;
      requireReadable();
      if (context.hasDraft()) {
        status(
          "Save or discard your discovery draft before restoring. Nothing was changed.",
          true,
        );
        return;
      }
      staged = parsed;
      base = JSON.stringify(context.get());
      preferences.checked = false;
      acknowledgement.checked = false;
      $<HTMLInputElement>("restore-merge").checked = true;
      $("restore-error").textContent = "";
      $("restore-file-identity").textContent =
        `${selected.name} · ${selected.size.toLocaleString("en-US")} bytes · backup v${parsed.version} · exported ${parsed.exportedAt} (UTC). File identity is a label, not proof of origin.`;
      $("restore-sample").replaceChildren(
        ...parsed.journal.entries.map(discoveryReview),
      );
      readingEpoch = null;
      choose.disabled = false;
      stopRead.hidden = true;
      book.close();
      preview();
      dialog.showModal();
    } catch (error) {
      if (epoch === readEpoch)
        status(String(error instanceof Error ? error.message : error));
    } finally {
      if (readingEpoch === epoch) {
        const returnFocus = document.activeElement === stopRead;
        readingEpoch = null;
        choose.disabled = false;
        stopRead.hidden = true;
        if (returnFocus && book.open) choose.focus();
      }
    }
  };
  // Closing the notebook while its file is reading cancels the pending UI transition.
  book.addEventListener("close", () => {
    readEpoch++;
    if (readingEpoch !== null) {
      readingEpoch = null;
      choose.disabled = false;
      stopRead.hidden = true;
      status("Stopped waiting for the file. Existing discoveries were kept.");
    }
  });
  function preview() {
    if (!staged) return;
    const replace = mode() === "replace";
    $("restore-replace-confirmation").hidden = !replace;
    $("restore-removed-review").hidden = !replace;
    const incomingIds = new Set(staged.journal.entries.map((n) => n.id));
    const removed = context.get().entries.filter((n) => !incomingIds.has(n.id));
    $("restore-removed").replaceChildren(...removed.map(discoveryReview));
    if (!removed.length)
      $("restore-removed").textContent =
        "No current discovery IDs are absent from this backup. Same-ID contents still follow the selected restore mode.";
    confirm.textContent = replace ? "Replace discoveries" : "Merge discoveries";
    $("restore-error").textContent = "";
    $("restore-preferences-detail").textContent = preferences.checked
      ? "Completed and set-aside preferences will be replaced by this backup."
      : "Your current completed and set-aside preferences will be kept.";
    try {
      const plan = planRestore(
        context.get(),
        staged,
        mode(),
        preferences.checked,
      );
      const s = plan.stats;
      $("restore-summary").textContent = replace
        ? `Replace all ${s.existing} current discoveries with ${s.incoming} imported discoveries. ${s.removed} current IDs are absent from the backup. Model downloads and saved card stay unchanged.`
        : `Keep ${s.existing} current discoveries and add ${s.additions} new IDs. ${s.duplicates} identical IDs and ${s.conflicts} different same-ID records keep the current version. Result: ${s.result} of 100 discoveries.`;
      confirm.disabled = replace && !acknowledgement.checked;
    } catch (error) {
      $("restore-summary").textContent =
        `${staged.journal.entries.length} discoveries in this supported backup.`;
      $("restore-error").textContent = String(
        error instanceof Error ? error.message : error,
      );
      confirm.disabled = true;
    }
  }
  for (const control of document.querySelectorAll<HTMLInputElement>(
    'input[name="restore-mode"], #restore-preferences, #restore-replace-ack',
  ))
    control.onchange = () => {
      acknowledgement.checked =
        control.id === "restore-replace-ack" ? acknowledgement.checked : false;
      preview();
    };
  let restoring = false;
  function cancel() {
    if (restoring) return;
    staged = null;
    readEpoch++;
    dialog.close();
    book.showModal();
    choose.focus();
    status(
      "Restore cancelled. Existing discoveries and preferences were kept.",
    );
  }
  $("cancel-restore").onclick = cancel;
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    cancel();
  });
  confirm.onclick = async () => {
    if (!staged || confirm.disabled || restoring) return;
    restoring = true;
    const chosenMode = mode(),
      chosenPreferences = preferences.checked;
    const controls = [
      ...dialog.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
        "input,button",
      ),
    ].map((control) => ({ control, disabled: control.disabled }));
    for (const { control } of controls) control.disabled = true;
    dialog.setAttribute("aria-busy", "true");
    try {
      requireReadable();
      if (context.hasDraft())
        throw Error(
          "Save or discard your discovery draft first. Nothing was changed.",
        );
      if (JSON.stringify(context.get()) !== base)
        throw Error(
          "Notebook changed after preview. Cancel and choose the file again; nothing was changed.",
        );
      if (chosenMode === "replace" && !acknowledgement.checked)
        throw Error("Confirm replacement before restoring.");
      const { next, stats } = planRestore(
        context.get(),
        staged,
        chosenMode,
        chosenPreferences,
      );
      if (!(await context.commit(next)))
        throw Error(
          context.problem() ||
            "Restore could not be saved. Existing discoveries were kept.",
        );
      const success = `${chosenMode === "merge" ? `${stats.additions} discoveries added; existing same-ID records kept` : `${stats.result} discoveries restored by replacement`}. ${chosenPreferences ? "Backup preferences restored" : "Current preferences kept"}.`;
      staged = null;
      context.afterRestore();
      dialog.close();
      book.showModal();
      context.focusNotebook();
      status(success);
      context.announce(success);
    } catch (error) {
      $("restore-error").textContent =
        `Not restored. ${String(error instanceof Error ? error.message : error)}`;
    } finally {
      restoring = false;
      for (const { control, disabled } of controls) control.disabled = disabled;
      dialog.setAttribute("aria-busy", "false");
      preview();
    }
  };
}
