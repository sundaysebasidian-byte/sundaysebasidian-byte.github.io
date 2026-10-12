import type { Activity } from "./catalog.ts";
export type Lens = "sound" | "perspective" | "change" | "texture" | "edges";
export const lensLabels: Record<Lens, string> = {
  sound: "Sound & distance",
  perspective: "A different view",
  change: "Small changes",
  texture: "Surfaces & texture",
  edges: "Edges & boundaries",
};
export const CONTENT_VERSION = "2026-10-06.2";
export function baseMetadata(
  id: string,
): Pick<Activity, "family" | "lens" | "version" | "prompt"> {
  const lens: Lens = ["sound-map", "bird-listen"].includes(id)
    ? "sound"
    : ["texture-walk", "tree-neighbor"].includes(id)
      ? "texture"
      : [
            "water-minute",
            "water-rhythm",
            "leaf-story",
            "garden-watch",
            "silent-scene",
          ].includes(id)
        ? "change"
        : "perspective";
  const family = ["small-loop", "near-far-loop"].includes(id)
    ? "short-walk"
    : ["water-minute", "water-rhythm"].includes(id)
      ? "water-pattern"
      : id;
  return {
    family,
    lens,
    version: CONTENT_VERSION,
    prompt: "What did you notice that you had been missing?",
  };
}
// The Lens UI filters; the separate internal compiler assembles authored modules.
export { combinationRules, curatedCombinations } from "./combinations.ts";
