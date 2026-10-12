import {
  activities,
  type Activity,
  type Setting,
  type Feature,
} from "./catalog.ts";
import type { Lens } from "./lenses.ts";
export type Constraints = {
  lens?: Lens | "any";
  minutes: number;
  setting: Setting;
  still: boolean;
  walk?: boolean;
  features?: Feature[];
};
export type Scored = { activity: Activity; score: number };
// A conservative product guard checked on a small disclosed fixture set.
// This is neither calibrated accuracy nor a probability of suitability.
export const WEAK_MATCH_THRESHOLD = 0.3;
export function weakMatch(score: number): boolean {
  return !Number.isFinite(score) || score < WEAK_MATCH_THRESHOLD;
}
export function eligible(c: Constraints): Activity[] {
  return activities.filter(
    (a) =>
      a.minutes <= c.minutes &&
      (!c.lens || c.lens === "any" || a.lens === c.lens) &&
      a.settings.includes(c.setting) &&
      (!c.still || a.still) &&
      (!c.walk || !a.still) &&
      (a.requires || []).every((f) => (c.features || []).includes(f)),
  );
}
export function dot(a: number[], b: number[]): number {
  if (a.length !== b.length || !a.length)
    throw new Error("Embedding dimensions do not match");
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}
export function semanticRank(
  c: Constraints,
  query: number[],
  vectors: number[][],
): Scored[] {
  if (vectors.length !== activities.length)
    throw new Error("Catalog embedding count does not match");
  return eligible(c)
    .map((activity) => ({
      activity,
      score: dot(query, vectors[activities.indexOf(activity)]),
    }))
    .sort(
      (a, b) => b.score - a.score || a.activity.id.localeCompare(b.activity.id),
    );
}
export function keywordRank(c: Constraints, text: string): Scored[] {
  const words = new Set(text.toLowerCase().match(/[a-z]+/g) || []);
  return eligible(c)
    .map((activity) => ({
      activity,
      score: activity.tags.filter((t) => words.has(t)).length,
    }))
    .sort(
      (a, b) => b.score - a.score || a.activity.id.localeCompare(b.activity.id),
    );
}
