import type { Activity } from "./catalog.ts";
import { sceneLabel, type Discovery } from "./journal.ts";
import { lensLabels } from "./lenses.ts";
import { familyOf, pocketCues, type Feedback } from "./pocket.ts";

// View-only, literal filtering. Search never changes stored text or ranking.
export function literalMatches(query: string, ...values: string[]): boolean {
  const needle = query.normalize("NFC").trim().toLowerCase();
  return (
    !needle ||
    values.some((value) =>
      value.normalize("NFC").toLowerCase().includes(needle),
    )
  );
}

export function searchGuide(rows: Activity[], query: string): Activity[] {
  return rows.filter((activity) =>
    literalMatches(
      query,
      activity.title,
      activity.subtitle,
      ...activity.tags,
      ...activity.steps,
      ...(activity.cues || pocketCues[activity.id] || []),
      activity.prompt,
    ),
  );
}

export function searchNotes(rows: Discovery[], query: string): Discovery[] {
  return rows.filter((note) =>
    literalMatches(
      query,
      note.text,
      note.task.title,
      ...note.tags,
      sceneLabel(note.scene),
      lensLabels[note.task.lens],
    ),
  );
}

export type NoteOrder = "newest" | "oldest" | "edited";
export function sortNotes(
  rows: readonly Discovery[],
  order: NoteOrder,
): Discovery[] {
  return rows
    .map((note, index) => ({
      note,
      index,
      time: Date.parse(order === "edited" ? note.updatedAt : note.createdAt),
    }))
    .sort(
      (a, b) =>
        (a.time - b.time) * (order === "oldest" ? 1 : -1) || a.index - b.index,
    )
    .map(({ note }) => note);
}

// Only the displayed card's public instructions belong in a takeaway.
export function cardPlainText(
  card: Activity,
  cues: readonly string[],
  safety: readonly string[],
): string {
  return [
    card.title,
    card.subtitle,
    `${card.minutes} min · ${card.still ? "One spot" : "A gentle walk"}`,
    "Steps",
    ...card.steps.map((step, i) => `${i + 1}. ${step}`),
    "Pocket cues",
    ...cues.map((cue, i) => `${i + 1}. ${cue}`),
    card.takeaway,
    ...safety,
  ].join("\n\n");
}

export type FeedbackUndo = { before: Feedback; after: Feedback };
// Restore only the changed families. Never erase feedback added by another action.
export function undoFeedbackChange(
  current: Feedback,
  undo: FeedbackUndo,
): Feedback | null {
  const clone = (f: Feedback): Feedback => ({
    done: [...f.done],
    skipped: [...f.skipped],
  });
  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  if (same(current, undo.after) || same(current, undo.before))
    return clone(undo.before);
  const state = (f: Feedback, family: string) => [
    f.done.filter((id) => familyOf(id) === family),
    f.skipped.filter((id) => familyOf(id) === family),
  ];
  const families = new Set(
    [
      ...undo.before.done,
      ...undo.before.skipped,
      ...undo.after.done,
      ...undo.after.skipped,
    ].map(familyOf),
  );
  const changed = new Set(
    [...families].filter(
      (family) => !same(state(undo.before, family), state(undo.after, family)),
    ),
  );
  for (const family of changed)
    if (
      !same(state(current, family), state(undo.after, family)) &&
      !same(state(current, family), state(undo.before, family))
    )
      return null;
  const merge = (kind: keyof Feedback) => [
    ...current[kind].filter((id) => !changed.has(familyOf(id))),
    ...undo.before[kind].filter((id) => changed.has(familyOf(id))),
  ];
  const done = merge("done");
  if (done.length > 3) return null;
  // Newly added unrelated families stay recent; original families regain their order.
  done.sort((a, b) => {
    const ai = undo.before.done.indexOf(a),
      bi = undo.before.done.indexOf(b);
    return (ai < 0 ? -1 : ai) - (bi < 0 ? -1 : bi);
  });
  return { done, skipped: merge("skipped") };
}
