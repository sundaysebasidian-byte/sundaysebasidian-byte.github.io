export const themes = ["forest", "tidal", "clay"] as const;
export type Theme = (typeof themes)[number];
export type Appearance = { version: 1; theme: Theme; depth: boolean };
export const APPEARANCE_KEY = "pft-appearance";
const defaults = (): Appearance => ({
  version: 1,
  theme: "forest",
  depth: false,
});

// Invalid/future preferences never change notebook bytes or erase stored data.
export function parseAppearance(raw: string | null): Appearance {
  if (!raw || raw.length > 1024) return defaults();
  try {
    const value = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      value.version !== 1 ||
      !themes.includes(value.theme) ||
      typeof value.depth !== "boolean"
    )
      return defaults();
    return { version: 1, theme: value.theme, depth: value.depth };
  } catch {
    return defaults();
  }
}

export function effectiveDepth(
  choice: Appearance,
  device: {
    reducedMotion: boolean;
    simpleEffects: boolean;
    hidden: boolean;
    saveData: boolean;
  },
): boolean {
  return (
    choice.depth &&
    !device.reducedMotion &&
    !device.simpleEffects &&
    !device.hidden &&
    !device.saveData
  );
}
