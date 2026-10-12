import {
  JOURNAL_KEY,
  parseJournal,
  sceneLabel,
  type Discovery,
} from "./journal.ts";
import { notebookPlainText } from "./readable-notes.ts";
import { emptyFeedback } from "./pocket.ts";
import { printLine, requestPrint, clearPrintSheet } from "./print-sheet.ts";
import { downloadText } from "./text-download.ts";
export function sameSavedSelection(preview: Discovery[], saved: Discovery[]) {
  const canonical = (entries: Discovery[]) =>
    parseJournal(
      JSON.stringify({ schema: 2, entries, feedback: emptyFeedback() }),
    ).entries;
  const expected = canonical(preview),
    current = new Map(canonical(saved).map((n) => [n.id, JSON.stringify(n)]));
  return expected.every((n) => current.get(n.id) === JSON.stringify(n));
}
export function selectedNoteText(entries: Discovery[], stamp: string) {
  return notebookPlainText(
    { schema: 2, entries, feedback: emptyFeedback() },
    stamp,
  ).replace("— saved discoveries", "— selected saved discoveries");
}
export function noteOutputUI(read: () => Discovery[], allowed: () => boolean) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const dialog = $<HTMLDialogElement>("selected-notes-dialog");
  let preview: Discovery[] = [],
    signature = "",
    stamp = "";
  const status = (text: string) =>
    ($("selected-output-status").textContent = text);
  function fresh() {
    try {
      if (!allowed() || JSON.stringify(read()) !== signature || !preview.length)
        throw Error();
      const saved = parseJournal(localStorage.getItem(JOURNAL_KEY));
      if (!sameSavedSelection(preview, saved.entries)) throw Error();
      return true;
    } catch {
      status(
        "Selection or saved data changed, or storage cannot be read. Close this preview and prepare it again. Nothing was exported.",
      );
      return false;
    }
  }
  $("prepare-selected-notes").onclick = () => {
    if (!allowed()) return;
    preview = structuredClone(read());
    if (!preview.length) return;
    signature = JSON.stringify(read());
    stamp = new Date().toISOString();
    $<HTMLTextAreaElement>("selected-note-text").value = selectedNoteText(
      preview,
      stamp,
    );
    status(
      `${preview.length} selected saved discoveries. This includes your private words, tags and task snapshots. Unsaved drafts and preferences are excluded. Choose where to keep the file yourself.`,
    );
    dialog.showModal();
  };
  $("close-selected-notes").onclick = () => dialog.close();
  dialog.addEventListener("close", () => {
    preview = [];
    signature = "";
    $<HTMLTextAreaElement>("selected-note-text").value = "";
    clearPrintSheet();
  });
  $("download-selected-notes").onclick = () => {
    if (!dialog.open || !fresh()) return;
    try {
      downloadText(
        "pocket-field-trip-selected-discoveries.txt",
        selectedNoteText(preview, stamp),
      );
      status(
        "TXT download requested for the previewed private notes only. Check your device for the file; this readable copy cannot restore a notebook.",
      );
    } catch {
      status(
        "Download could not start. Your notes were kept. Select the preview text and copy it yourself, or retry.",
      );
    }
  };
  $("print-selected-notes").onclick = () => {
    if (!dialog.open || !fresh()) return;
    const pages = preview.map((n) => {
      const page = document.createElement("article");
      page.className = "printed-field-card printed-discovery";
      printLine(page, "p", "POCKET FIELD TRIP / PRIVATE SAVED DISCOVERY");
      printLine(page, "h1", n.text);
      printLine(
        page,
        "p",
        `${n.createdAt.slice(0, 10)} (UTC) · ${sceneLabel(n.scene)} · ${n.tags.join(", ") || "No tags"}`,
      );
      printLine(page, "h2", n.task.title);
      printLine(
        page,
        "p",
        "Stored snapshot, not revalidated for your current conditions.",
      );
      const steps = document.createElement("ol");
      n.task.steps.forEach((s) => printLine(steps, "li", s));
      page.append(steps);
      printLine(
        page,
        "footer",
        `${n.task.id} / ${n.task.version} · Private content selected by you. No intent or preference history included.`,
      );
      return page;
    });
    try {
      requestPrint(pages);
      status(
        "Print preview requested for the selected private notes only. Check the preview; no printer or PDF success is confirmed.",
      );
    } catch {
      status(
        "Print could not open. Your notes were kept. Download this preview as TXT instead.",
      );
    } finally {
      clearPrintSheet();
    }
  };
}
