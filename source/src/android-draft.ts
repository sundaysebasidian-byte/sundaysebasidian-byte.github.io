import {
  parseJournal,
  type Snapshot,
  type NoteTag,
  type Scene,
} from "./journal.ts";
import { parseActiveTrip } from "./active-trip.ts";
export const ANDROID_DRAFT_KEY = "pft-android-draft-v1";
export type AndroidDraft = {
  schema: 1;
  id: string;
  task: Snapshot;
  text: string;
  tags: NoteTag[];
  scene?: Scene;
  editing: boolean;
  originalUpdatedAt: string | null;
  noteDone: boolean;
  tripRaw: string | null;
};
export function parseAndroidDraft(raw: string | null): AndroidDraft | null {
  if (!raw || raw.length > 16000) return null;
  try {
    const v = JSON.parse(raw);
    if (
      !v ||
      v.schema !== 1 ||
      typeof v.text !== "string" ||
      v.text.length > 280 ||
      typeof v.editing !== "boolean" ||
      typeof v.noteDone !== "boolean" ||
      !(
        v.originalUpdatedAt === null || typeof v.originalUpdatedAt === "string"
      ) ||
      !(v.tripRaw === null || parseActiveTrip(v.tripRaw).kind === "valid")
    )
      return null;
    const j = parseJournal(
      JSON.stringify({
        schema: 2,
        entries: [
          {
            id: v.id,
            task: v.task,
            text: ".",
            tags: v.tags,
            scene: v.scene,
            createdAt: "2026-10-10T00:00:00.000Z",
            updatedAt: "2026-10-10T00:00:00.000Z",
          },
        ],
        feedback: { done: [], skipped: [] },
      }),
    );
    if (j.entries.length !== 1) return null;
    return {
      schema: 1,
      id: j.entries[0].id,
      task: j.entries[0].task,
      text: v.text,
      tags: j.entries[0].tags,
      ...(j.entries[0].scene === undefined
        ? {}
        : { scene: j.entries[0].scene }),
      editing: v.editing,
      originalUpdatedAt: v.originalUpdatedAt,
      noteDone: v.noteDone,
      tripRaw: v.tripRaw,
    };
  } catch {
    return null;
  }
}
export function keepAndroidDraft(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  expected: string | null,
  next: AndroidDraft | null,
): string | null {
  if (storage.getItem(ANDROID_DRAFT_KEY) !== expected)
    throw Error("Draft recovery changed; the earlier copy was preserved.");
  const raw = next ? JSON.stringify(next) : null;
  if (raw && !parseAndroidDraft(raw))
    throw Error("Draft recovery could not be validated.");
  if (raw) storage.setItem(ANDROID_DRAFT_KEY, raw);
  else storage.removeItem(ANDROID_DRAFT_KEY);
  if (storage.getItem(ANDROID_DRAFT_KEY) !== raw)
    throw Error("Draft recovery could not be verified.");
  return raw;
}
