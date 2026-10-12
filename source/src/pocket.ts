import { activities, type Activity } from "./catalog.ts";
import { weakMatch, type Scored } from "./ranking.ts";
export type Feedback = { done: string[]; skipped: string[] };
export const FEEDBACK_KEY = "pft-feedback-v1";
export const emptyFeedback = (): Feedback => ({ done: [], skipped: [] });
export function compatibleSavedCard(
  data: unknown,
  activity?: Activity,
): boolean {
  if (!activity || !data || typeof data !== "object" || Array.isArray(data))
    return false;
  const saved = data as Record<string, unknown>;
  return (
    saved.id === activity.id &&
    (saved.version === undefined || saved.version === activity.version)
  );
}
// Only authored IDs are accepted; no intent, timestamps, location or counts.
export function parseFeedback(raw: string | null): Feedback {
  try {
    const data = JSON.parse(raw || "null");
    const ids = new Set(activities.map((a) => a.id));
    const clean = (x: unknown): string[] =>
      Array.isArray(x)
        ? [
            ...new Set(
              x.filter(
                (id): id is string => typeof id === "string" && ids.has(id),
              ),
            ),
          ].slice(0, activities.length)
        : [];
    // Legacy IDs can become siblings after a content-family upgrade. Preserve
    // effective set-aside behavior rather than inventing which action was last.
    const skipped = clean(data?.skipped);
    const skippedFamilies = new Set(skipped.map(familyOf));
    return {
      done: clean(data?.done)
        .filter(
          (id, i, ids) =>
            ids.findIndex((x) => familyOf(x) === familyOf(id)) === i &&
            !skippedFamilies.has(familyOf(id)),
        )
        .slice(0, 3),
      skipped,
    };
  } catch {
    return emptyFeedback();
  }
}
export function recordFeedback(
  state: Feedback,
  id: string,
  kind: "done" | "skipped",
): Feedback {
  if (!activities.some((a) => a.id === id)) return state;
  return kind === "done"
    ? {
        done: [
          id,
          ...state.done.filter((x) => familyOf(x) !== familyOf(id)),
        ].slice(0, 3),
        skipped: state.skipped.filter((x) => familyOf(x) !== familyOf(id)),
      }
    : {
        done: state.done.filter((x) => familyOf(x) !== familyOf(id)),
        skipped: [...new Set([...state.skipped, id])],
      };
}
export function familyOf(id: string): string {
  return activities.find((a) => a.id === id)?.family || id;
}
export function recommendationOrder(
  rows: Scored[],
  state: Feedback,
  allowRepeats = false,
): Scored[] {
  const recent = new Set(state.done.map(familyOf));
  const skipped = new Set(state.skipped.map(familyOf));
  const families = new Set<string>();
  return rows
    .filter(
      (r) =>
        !skipped.has(r.activity.family) &&
        (allowRepeats || !recent.has(r.activity.family)),
    )
    .filter((r) => {
      if (families.has(r.activity.family)) return false;
      families.add(r.activity.family);
      return true;
    });
}
export const pocketCues: Record<string, [string, string, string]> = {
  "sound-map": ["Settle", "Near · far", "Follow"],
  "shadow-study": ["Choose", "Trace", "Look up"],
  "sky-pause": ["Settle", "Watch", "Let wait"],
  "texture-walk": ["Walk", "Three surfaces", "One word"],
  "color-quest": ["Pick a color", "Find three", "Find softer"],
  "tree-neighbor": ["One tree", "Bark · leaf", "Imagine"],
  "bird-listen": ["Wait", "Listen", "Watch afar"],
  "garden-watch": ["One plant", "Old · new", "Count colors"],
  "water-rhythm": ["Stay dry", "Follow", "Notice a break"],
  "different-route": ["Choose a route", "Notice", "Look back"],
  "leaf-story": ["Leave it", "Edge · veins", "Compare"],
  "horizon-lines": ["Settle", "Three lines", "Compose"],
  "small-loop": ["Choose a path", "Walk", "Return"],
  "silent-scene": ["Find movement", "Find stillness", "Look again"],
  "water-minute": ["Stay dry", "One ripple", "One change"],
  "near-far-loop": ["Safe path", "Near · far", "Return"],
};
export function cardMotif(a: Activity): "waves" | "path" | "leaf" | "view" {
  if (!a.still) return "path";
  if (a.id.includes("sound") || a.id.includes("bird") || a.id.includes("water"))
    return "waves";
  return a.requires?.includes("plant") ? "leaf" : "view";
}
export const motifPaths = {
  waves: "M8 25Q25 5 42 25T76 25M8 41Q25 21 42 41T76 41M8 57Q25 37 42 57T76 57",
  path: "M10 65C75 65 3 18 68 13M22 57l8 2m-2-25 8 3m5-18 8-2",
  leaf: "M15 67C16 33 39 11 70 12C72 46 48 65 15 67ZM15 67l44-43M29 51l-3-20m18 6 18 3",
  view: "M7 53h70M7 36h70M31 18h46M19 10v18M10 19h18M35 68h34",
};

for (const a of activities) if (a.cues) pocketCues[a.id] = a.cues;
