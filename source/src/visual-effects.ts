// Optional browser hints; absent hints never imply a fast or high-power phone.
type HintedNavigator = Navigator & {
  deviceMemory?: number;
  connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
};
export function setupVisualEffects() {
  const hints = navigator as HintedNavigator;
  const transparency = matchMedia("(prefers-reduced-transparency: reduce)");
  const apply = () => {
    const constrained =
      transparency.matches ||
      Boolean(hints.connection?.saveData) ||
      /^(slow-)?2g$/.test(hints.connection?.effectiveType || "") ||
      (typeof hints.deviceMemory === "number" && hints.deviceMemory <= 4) ||
      (hints.hardwareConcurrency > 0 && hints.hardwareConcurrency <= 4);
    document.documentElement.dataset.effects = constrained ? "simple" : "full";
  };
  apply();
  transparency.addEventListener("change", apply);
  hints.connection?.addEventListener?.("change", apply);
}
