import {
  APPEARANCE_KEY,
  parseAppearance,
  effectiveDepth,
  themes,
  type Appearance,
  type Theme,
} from "./appearance-preferences.ts";
import { stopSpatialMotion } from "./calm-motion.ts";

export function setupAppearance() {
  const root = document.documentElement;
  const trigger = document.getElementById(
    "appearance-open",
  ) as HTMLButtonElement;
  const dialog = document.getElementById(
    "appearance-dialog",
  ) as HTMLDialogElement;
  const depth = document.getElementById("appearance-depth") as HTMLInputElement;
  const status = document.getElementById("appearance-status")!;
  const storageStatus = document.getElementById("appearance-storage-status")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const connection = (
    navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
    }
  ).connection;
  let choice: Appearance = parseAppearance(null);
  let persisted = true;
  try {
    choice = parseAppearance(localStorage.getItem(APPEARANCE_KEY));
  } catch {
    persisted = false;
  }
  const pressed = new Set<HTMLElement>();
  const release = () => {
    for (const surface of pressed) delete surface.dataset.depthPress;
    pressed.clear();
  };
  const device = () => ({
    reducedMotion: motion.matches || root.dataset.motion === "reduced",
    simpleEffects: root.dataset.effects === "simple",
    hidden: document.hidden || root.dataset.pageVisibility === "hidden",
    saveData: Boolean(connection?.saveData),
  });
  const sync = () => {
    const hints = device();
    const enabled = effectiveDepth(choice, hints);
    root.dataset.theme = choice.theme;
    root.dataset.depth = enabled ? "on" : "off";
    depth.checked = choice.depth;
    for (const radio of dialog.querySelectorAll<HTMLInputElement>(
      'input[name="appearance-theme"]',
    ))
      radio.checked = radio.value === choice.theme;
    if (!enabled) {
      release();
      stopSpatialMotion();
    }
    status.textContent = !choice.depth
      ? "Flat paper. A quiet place to read."
      : hints.hidden
        ? "3D is paused while this tab is hidden."
        : hints.saveData
          ? "Data saver is on. 3D stays flat."
          : hints.reducedMotion
            ? "Reduced motion is on. 3D stays flat."
            : hints.simpleEffects
              ? "Your device is using simpler effects. 3D stays flat."
              : "Paper lifts when you interact. Still while you read.";
    storageStatus.textContent = persisted
      ? "Choices stay on this browser."
      : "For this tab. Browser storage is unavailable.";
    trigger.title = `Appearance · ${choice.theme === "forest" ? "Forest" : choice.theme === "tidal" ? "Tidal" : "Clay"}${choice.depth ? " · 3D selected" : ""}`;
  };
  const save = () => {
    const raw = JSON.stringify(choice);
    try {
      localStorage.setItem(APPEARANCE_KEY, raw);
      persisted = localStorage.getItem(APPEARANCE_KEY) === raw;
    } catch {
      persisted = false;
    }
    sync();
  };
  trigger.addEventListener("click", () => {
    dialog.showModal();
    trigger.setAttribute("aria-expanded", "true");
    dialog
      .querySelector<HTMLInputElement>('input[name="appearance-theme"]:checked')
      ?.focus();
  });
  document
    .getElementById("appearance-close")!
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    release();
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus({ preventScroll: true });
  });
  dialog.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (
      input.name === "appearance-theme" &&
      themes.includes(input.value as Theme)
    )
      choice = { ...choice, theme: input.value as Theme };
    else if (input === depth) choice = { ...choice, depth: depth.checked };
    else return;
    save();
  });
  window.addEventListener("storage", (event) => {
    // A remote clear has key:null. Read current bytes rather than a queued
    // event's old value, and recover the status only after a successful read.
    if (event.key !== APPEARANCE_KEY && event.key !== null) return;
    try {
      if (event.storageArea && event.storageArea !== localStorage) return;
      choice = parseAppearance(localStorage.getItem(APPEARANCE_KEY));
      persisted = true;
    } catch {
      // Keep the current tab's choice when storage cannot be read.
      persisted = false;
    }
    sync();
  });
  // Delegation covers notebook cards created later; no pointer tracking or loop.
  document.addEventListener("pointerdown", (event) => {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      !effectiveDepth(choice, device())
    )
      return;
    const target = event.target instanceof Element ? event.target : null;
    const surface = target?.closest<HTMLElement>(
      ".sample-card, .compose-preview, .discovery-note, .pack-preview-card, .comparison-note, .appearance-specimen",
    );
    if (
      !surface ||
      target?.closest("input, textarea, select, .discovery-actions")
    )
      return;
    surface.dataset.depthPress = "true";
    pressed.add(surface);
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    document.addEventListener(event, release, true);
  document.addEventListener("scroll", release, true);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") release();
  });
  window.addEventListener("blur", release);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  connection?.addEventListener("change", sync);
  new MutationObserver(sync).observe(root, {
    attributes: true,
    attributeFilter: ["data-motion", "data-effects", "data-page-visibility"],
  });
  sync();
}
