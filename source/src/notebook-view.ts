import type { Discovery, NoteTag, Scene } from "./journal.ts";

export type NoteFilter = {
  tag: string;
  scene: string;
  from: string;
  to: string;
};
export function dateRangeValid({ from, to }: NoteFilter): boolean {
  return !(from && to && from > to);
}
export function filteredNotes(
  entries: Discovery[],
  filter: NoteFilter,
): Discovery[] {
  if (!dateRangeValid(filter)) return [];
  return entries.filter((n) => {
    const day = n.createdAt.slice(0, 10);
    return (
      (filter.tag === "any" || n.tags.includes(filter.tag as NoteTag)) &&
      (filter.scene === "any" ||
        (filter.scene === "unclassified"
          ? n.scene === undefined
          : n.scene === (filter.scene as Scene))) &&
      (!filter.from || day >= filter.from) &&
      (!filter.to || day <= filter.to)
    );
  });
}
export function validPair(
  entries: Discovery[],
  previous: string,
  current: string,
): [Discovery, Discovery] | null {
  if (!previous || !current || previous === current) return null;
  const left = entries.find((n) => n.id === previous),
    right = entries.find((n) => n.id === current);
  return left && right ? [left, right] : null;
}
