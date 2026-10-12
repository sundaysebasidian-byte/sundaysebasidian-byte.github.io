import { sceneLabel, type Journal } from "./journal.ts";
import { sortNotes } from "./local-tools.ts";

export function notebookPlainText(journal: Journal, exportedAt: string) {
  const header = [
    "Pocket Field Trip — saved discoveries",
    `Exported ${exportedAt}`,
    `${journal.entries.length} saved discoveries. Unsaved drafts are excluded.`,
    "This is a readable text copy. Keep a JSON backup to restore your notebook.",
  ].join("\n\n");
  const notes = sortNotes(journal.entries, "newest").map((note, index) =>
    [
      `Discovery ${index + 1}`,
      note.text,
      `Created: ${note.createdAt}\nUpdated: ${note.updatedAt}`,
      `Scene: ${sceneLabel(note.scene)}\nTags: ${note.tags.join(", ") || "None"}`,
      `Stored task: ${note.task.title}\nCard: ${note.task.id} · ${note.task.version}`,
      "Stored task snapshot (not revalidated):",
      ...note.task.steps.map((step, i) => `${i + 1}. ${step}`),
      `Pocket cues: ${note.task.cues.join(" / ")}`,
    ].join("\n\n"),
  );
  return [header, ...notes].join("\n\n────────────────────\n\n");
}
