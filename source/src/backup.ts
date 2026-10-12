import { activities } from "./catalog.ts";
import { familyOf } from "./pocket.ts";
import { parseJournal, MAX_DISCOVERIES, type Journal } from "./journal.ts";

export const BACKUP_FORMAT = "pocket-field-trip-notebook";
export const BACKUP_VERSION = 2;
export const MAX_BACKUP_BYTES = 1024 * 1024;
export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: 1 | 2;
  exportedAt: string;
  journal: Journal;
};
export type RestoreMode = "merge" | "replace";
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function keys(value: unknown, names: string[]) {
  if (!object(value) || Object.keys(value).some((k) => !names.includes(k)))
    throw Error("Backup contains unsupported fields. Nothing was changed.");
}
function checkFeedback(value: unknown) {
  keys(value, ["done", "skipped"]);
  const f = value as Record<string, unknown>;
  const allowed = new Set(activities.map((a) => a.id));
  for (const name of ["done", "skipped"]) {
    const list = f[name];
    if (
      !Array.isArray(list) ||
      list.length > (name === "done" ? 3 : activities.length) ||
      new Set(list).size !== list.length ||
      list.some((id) => typeof id !== "string" || !allowed.has(id))
    )
      throw Error("Backup preferences are unsupported. Nothing was changed.");
  }
  const done = f.done as string[],
    skipped = f.skipped as string[];
  if (
    new Set(done.map(familyOf)).size !== done.length ||
    skipped.some((id) => done.some((d) => familyOf(d) === familyOf(id)))
  )
    throw Error(
      "Backup preferences conflict within a content family. Nothing was changed.",
    );
}
export function parseBackup(raw: string): Backup {
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES)
    throw Error(
      "Choose a JSON backup no larger than 1 MiB. Nothing was changed.",
    );
  let b: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    keys(parsed, ["format", "version", "exportedAt", "journal"]);
    b = parsed as Record<string, unknown>;
  } catch {
    throw Error(
      "This file is not a supported JSON backup. Nothing was changed.",
    );
  }
  if (
    b.format !== BACKUP_FORMAT ||
    ![1, 2].includes(b.version as number) ||
    typeof b.exportedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(b.exportedAt) ||
    !Number.isFinite(Date.parse(b.exportedAt)) ||
    new Date(b.exportedAt).toISOString() !== b.exportedAt
  )
    throw Error(
      "Backup format or version is unsupported. Nothing was changed.",
    );
  keys(b.journal, ["schema", "entries", "feedback"]);
  const j = b.journal as Record<string, unknown>;
  if (
    j.schema !== b.version ||
    !Array.isArray(j.entries) ||
    j.entries.length > MAX_DISCOVERIES
  )
    throw Error(
      "Backup notebook version or size is unsupported. Nothing was changed.",
    );
  checkFeedback(j.feedback);
  for (const n of j.entries) {
    keys(n, [
      "id",
      "createdAt",
      "updatedAt",
      "task",
      "text",
      "tags",
      ...(b.version === 2 ? ["scene"] : []),
    ]);
    keys((n as Record<string, unknown>).task, [
      "id",
      "title",
      "family",
      "lens",
      "version",
      "steps",
      "cues",
      "prompt",
      "minutes",
      "settings",
      "still",
      "requires",
    ]);
  }
  try {
    const journal = parseJournal(JSON.stringify(j));
    return {
      format: BACKUP_FORMAT,
      version: b.version as 1 | 2,
      exportedAt: b.exportedAt,
      journal,
    };
  } catch {
    throw Error(
      "Backup discoveries are invalid or exceed their limits. Nothing was changed.",
    );
  }
}
export function exportBackup(journal: Journal, now: string): string {
  const backup = {
    format: BACKUP_FORMAT,
    version: journal.schema,
    exportedAt: now,
    journal,
  };
  const pretty = JSON.stringify(backup, null, 2) + "\n";
  // Formatting must not make a supported compact backup impossible to re-export.
  // Keep the same byte cap and validation; no records or fields are truncated.
  const raw =
    new TextEncoder().encode(pretty).byteLength <= MAX_BACKUP_BYTES
      ? pretty
      : JSON.stringify(backup);
  // Export and import share the same contract, so every generated backup is recoverable.
  parseBackup(raw);
  return raw;
}
export function planRestore(
  current: Journal,
  backup: Backup,
  mode: RestoreMode,
  restorePreferences = false,
) {
  if (mode !== "merge" && mode !== "replace")
    throw Error("Choose merge or replace.");
  // Revalidate at the boundary and reconstruct supported fields. Snapshots never
  // become activities, model descriptions, executable markup or fetched resources.
  const incoming = parseBackup(JSON.stringify(backup)).journal;
  const existing = parseJournal(JSON.stringify(current));
  const byId = new Map(existing.entries.map((n) => [n.id, n]));
  const additions = incoming.entries.filter((n) => !byId.has(n.id));
  const conflicts = incoming.entries.filter(
    (n) =>
      byId.has(n.id) && JSON.stringify(byId.get(n.id)) !== JSON.stringify(n),
  ).length;
  const duplicates = incoming.entries.length - additions.length - conflicts;
  const entries =
    mode === "merge" ? [...existing.entries, ...additions] : incoming.entries;
  if (entries.length > MAX_DISCOVERIES)
    throw Error(
      "Combined notebook would exceed 100 discoveries. Nothing was changed; export or remove entries before merging.",
    );
  const next: Journal = {
    schema: existing.schema === 2 || incoming.schema === 2 ? 2 : 1,
    entries,
    feedback: restorePreferences ? incoming.feedback : existing.feedback,
  };
  // Two supported files can fit the note count while their combined byte size
  // cannot be exported. Validate the final schema and selected preferences with
  // the same compact fallback and contract used by an actual backup download.
  try {
    exportBackup(next, backup.exportedAt);
  } catch {
    throw Error(
      "Restored notebook would exceed the 1 MiB backup limit or could not form a supported backup. Nothing was changed; keep your backup files or remove entries before restoring.",
    );
  }
  return {
    next,
    stats: {
      incoming: incoming.entries.length,
      additions: additions.length,
      conflicts,
      duplicates,
      existing: existing.entries.length,
      result: entries.length,
      removed:
        mode === "replace"
          ? existing.entries.filter(
              (n) => !incoming.entries.some((x) => x.id === n.id),
            ).length
          : 0,
    },
  };
}
