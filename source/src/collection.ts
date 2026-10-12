import { sceneLabel, type Discovery } from "./journal.ts";
import type { Lens } from "./lenses.ts";
export type CollectionFilter = { lens: string; month: string; family: string };
export function collectionNotes(
  entries: Discovery[],
  filter: CollectionFilter,
) {
  return entries.filter(
    (n) =>
      (filter.lens === "any" || n.task.lens === filter.lens) &&
      (filter.month === "any" || n.createdAt.slice(0, 7) === filter.month) &&
      (!filter.family || n.task.family === filter.family),
  );
}
export function collectionSummary(entries: Discovery[]) {
  const days = new Set(entries.map((n) => n.createdAt.slice(0, 10))).size;
  const lenses = new Set(entries.map((n) => n.task.lens as Lens)).size;
  const scenes = new Set(entries.flatMap((n) => (n.scene ? [n.scene] : [])))
    .size;
  return { notes: entries.length, days, lenses, scenes };
}
export function sceneCounts(entries: Discovery[]) {
  return ["street", "park", "garden", "water", "unclassified"].map((scene) => ({
    scene,
    label: sceneLabel(
      scene === "unclassified" ? undefined : (scene as Discovery["scene"]),
    ),
    count: entries.filter((n) => (n.scene || "unclassified") === scene).length,
  }));
}
export function boundaryPair(entries: Discovery[]) {
  const sorted = [...entries].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
  return sorted.length >= 2 ? [sorted[0].id, sorted.at(-1)!.id] : null;
}
