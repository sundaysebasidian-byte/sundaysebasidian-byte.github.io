// One finite effect per surface. Repeated actions continue from the rendered
// frame, rather than cancelling back to the surface's resting pose.
const effects = new WeakMap<HTMLElement, Animation>();
const active = new Set<Animation>();
let arrival: IntersectionObserver | undefined;
export const calmEase = "cubic-bezier(.22,.68,.25,1)";
export const motionReduced = () =>
  document.hidden ||
  document.documentElement.dataset.motion === "reduced" ||
  document.documentElement.dataset.effects === "simple" ||
  matchMedia("(prefers-reduced-motion: reduce)").matches ||
  Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData,
  );

// Decorative motion never queues up for a hidden tab. Returning is still.
export function setupCalmMotion() {
  const visibility = () => {
    document.documentElement.dataset.pageVisibility = document.hidden
      ? "hidden"
      : "visible";
    if (document.hidden) {
      arrival?.disconnect();
      arrival = undefined;
      for (const effect of active) effect.cancel();
    }
  };
  visibility();
  document.addEventListener("visibilitychange", visibility);
  const stopWhenReduced = () => {
    if (!motionReduced()) return;
    arrival?.disconnect();
    arrival = undefined;
    for (const effect of [...active]) effect.cancel();
  };
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
    "change",
    stopWhenReduced,
  );
  (
    navigator as Navigator & {
      connection?: {
        addEventListener?: (name: string, callback: () => void) => void;
      };
    }
  ).connection?.addEventListener?.("change", stopWhenReduced);
  new MutationObserver(stopWhenReduced).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-effects", "data-motion", "data-page-visibility"],
  });
}

export function stopSurface(element: HTMLElement) {
  effects.get(element)?.cancel();
}

export function stopSpatialMotion() {
  for (const effect of active) {
    const frames = (effect.effect as KeyframeEffect).getKeyframes();
    if (
      frames.some(
        (frame) => typeof frame.rotate === "string" && frame.rotate !== "none",
      )
    )
      effect.cancel();
  }
}

export function settleSurface(
  element: HTMLElement,
  from: {
    opacity?: number;
    translate?: string;
    scale?: string;
    rotate?: string;
  },
  duration = 420,
  delay = 0,
) {
  const previous = effects.get(element);
  const start: Keyframe = { ...from };
  if (previous?.playState === "running" || previous?.pending) {
    const current = getComputedStyle(element);
    const priorFrame = (previous.effect as KeyframeEffect).getKeyframes()[0];
    for (const property of ["opacity", "translate", "scale", "rotate"])
      if (property in priorFrame)
        start[property] = current.getPropertyValue(property);
    for (const property of Object.keys(from))
      start[property] = current.getPropertyValue(property);
  }
  // Spatial arrival follows the same explicit 3D choice as decorative paper.
  if (document.documentElement.dataset.depth !== "on") delete start.rotate;
  previous?.cancel();
  if (motionReduced()) return;
  const end: Keyframe = {};
  for (const property of Object.keys(start))
    end[property] =
      property === "opacity" || property === "scale"
        ? "1"
        : property === "rotate"
          ? "none"
          : "0 0";
  const effect = element.animate([start, end], {
    duration,
    delay,
    easing: calmEase,
    fill: "backwards",
    iterations: 1,
  });
  effects.set(element, effect);
  active.add(effect);
  const finished = () => active.delete(effect);
  effect.addEventListener("finish", finished, { once: true });
  effect.addEventListener("cancel", finished, { once: true });
}

export function revealTrip() {
  arrival?.disconnect();
  arrival = undefined;
  const card = document.querySelector<HTMLElement>("#trip-card");
  if (!card || motionReduced()) return;
  const reveal = () => {
    // Content, focus and state are already available. Only the paper arrives.
    settleSurface(
      card,
      { opacity: 0.97, translate: "0 8px", rotate: "1 0 0 1.6deg" },
      460,
    );
    const cues = document.querySelector<HTMLElement>(".pocket-strip");
    if (cues) settleSurface(cues, { translate: "0 3px" }, 300, 60);
    const note = document.querySelector<HTMLElement>("#result .departure");
    if (note)
      settleSurface(
        note,
        { translate: "0 5px", rotate: "1 0 0 .8deg" },
        400,
        35,
      );
  };
  const bounds = card.getBoundingClientRect();
  if (bounds.top < innerHeight - 64 && bounds.bottom > 0) {
    reveal();
  } else {
    // A long native scroll must not finish the reveal before the card is seen.
    const observer = new IntersectionObserver(
      (entries) => {
        if (arrival !== observer) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        arrival = undefined;
        reveal();
      },
      { threshold: 0.12, rootMargin: "0px 0px -64px 0px" },
    );
    arrival = observer;
    observer.observe(card);
  }
}

export function revealLens() {
  const summary = document.getElementById("refinement-summary");
  if (summary)
    settleSurface(summary, { opacity: 0.9, translate: "0 3px" }, 260);
}

export function revealReading(card: HTMLElement, before: DOMRect) {
  // The reading mode and controls change immediately. Only the paper moves
  // between its actual before/after positions; no cloned text or queued timer.
  arrival?.disconnect();
  arrival = undefined;
  stopSurface(card);
  if (motionReduced()) return;
  const after = card.getBoundingClientRect();
  if (after.top >= innerHeight - 64 || after.bottom <= 0) return;
  const x = before.left - after.left;
  const y = before.top - after.top;
  if (Math.abs(x) < 1 && Math.abs(y) < 1) return;
  settleSurface(card, { translate: `${x}px ${y}px` }, 380);
}

export function closeDiscoverySurface(
  editor: HTMLDialogElement,
  confirmed = false,
) {
  // Native close/focus semantics are immediate; retirement is visual only.
  editor.dataset.retirement = confirmed ? "saved" : "closed";
  editor.close();
}

export function revealHome() {
  for (const [index, selector] of [
    ".hero",
    ".time-card",
    ".nearby-card",
    ".intent-card",
  ].entries()) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element)
      settleSurface(
        element,
        { opacity: 0.94, translate: "0 6px" },
        460,
        index * 25,
      );
  }
}
