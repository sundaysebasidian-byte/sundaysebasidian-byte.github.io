import { activities, type Activity } from "./catalog.ts";
import type { Snapshot } from "./journal.ts";
import {
  ACTIVE_TRIP_KEY,
  readActiveTrip,
  parseActiveTrip,
  changeActiveTrip,
  type TripRead,
  type TripWrite,
} from "./active-trip.ts";
export function activeTripUI(context: {
  hasDraft: () => boolean;
  resumeDraft: () => void;
  openCard: (a: Activity) => void;
  openNote: (a: Activity) => void;
  announce: (message: string) => void;
  focusHome: () => void;
}) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  let state: TripRead = { kind: "empty", raw: null };
  let selected: Activity | null = null;
  let replace: { card: Activity; raw: string } | null = null;
  let finishRaw: string | null = null;
  let noteLink: { id: string; raw: string } | null = null;
  const card = () => {
    if (state.kind !== "valid") return;
    const trip = state.trip;
    return activities.find(
      (a) => a.id === trip.taskId && a.version === trip.taskVersion,
    );
  };
  const matches = (a: Pick<Activity, "id" | "version">) =>
    state.kind === "valid" &&
    state.trip.taskId === a.id &&
    state.trip.taskVersion === a.version;
  const read = (): TripRead => {
    try {
      return readActiveTrip(localStorage);
    } catch {
      return { kind: "unreadable" };
    }
  };
  const write = (raw: string | null, a: Activity | null): TripWrite => {
    try {
      return changeActiveTrip(
        localStorage,
        raw,
        a
          ? {
              schema: 1,
              token: crypto.randomUUID(),
              taskId: a.id,
              taskVersion: a.version,
            }
          : null,
      );
    } catch {
      return "failed";
    }
  };
  function message(text: string) {
    $("trip-message").textContent = text;
    $("trip-start-status").textContent = text;
    context.announce(text);
  }
  function render() {
    const panel = $("active-trip");
    panel.hidden = state.kind === "empty";
    const a = card();
    $("active-trip-title").textContent = a
      ? a.title
      : state.kind === "unreadable"
        ? "Trip recovery is unavailable in this browser."
        : "The kept trip is unavailable in this guide.";
    $<HTMLButtonElement>("trip-resume").disabled = !a;
    $<HTMLButtonElement>("trip-record").disabled = !a;
    $<HTMLButtonElement>("trip-finish").disabled = state.kind === "unreadable";
    const start = $<HTMLButtonElement>("start-trip");
    start.disabled =
      !selected ||
      state.kind === "invalid" ||
      state.kind === "unreadable" ||
      (state.kind === "valid" && !a) ||
      (!!selected && matches(selected));
    start.textContent =
      selected && matches(selected)
        ? "This trip is kept for your return ✓"
        : "Start this trip · keep it locally";
    if (panel.hidden && panel.contains(document.activeElement))
      context.focusHome();
  }
  function refresh() {
    const hiddenFocus =
      $("trip-replace").contains(document.activeElement) ||
      $("trip-finish-confirmation").contains(document.activeElement);
    state = read();
    replace = null;
    finishRaw = null;
    $("trip-replace").hidden = true;
    $("trip-finish-confirmation").hidden = true;
    render();
    if (hiddenFocus) {
      if ($<HTMLDialogElement>("departure").open) {
        const target = $<HTMLButtonElement>("start-trip");
        (target.disabled ? $("back") : target).focus();
      } else if (
        !$("active-trip").hidden &&
        !$<HTMLButtonElement>("trip-finish").disabled
      )
        $("trip-finish").focus();
      else context.focusHome();
    }
  }
  function start(a: Activity, raw: string | null) {
    if (context.hasDraft()) {
      message(
        "Your unsaved discovery was kept. Save or discard it before starting another trip.",
      );
      return;
    }
    const outcome = write(raw, a);
    refresh();
    message(
      outcome === "saved"
        ? "Trip kept on this browser for your return. Nothing is marked done. You can put your phone away."
        : outcome === "changed"
          ? "Your kept trip changed in another tab. Review it before trying again; nothing was replaced."
          : "The trip could not be kept or verified in storage. This card is still available in this tab; retry or use it without starting.",
    );
    if (outcome === "saved") $("back").focus();
  }
  $("start-trip").onclick = () => {
    if (!selected) return;
    const observed = state;
    state = read();
    render();
    if (
      state.kind === "unreadable" ||
      state.kind === "invalid" ||
      (state.kind === "valid" && !card())
    ) {
      message(
        "Stored trip data could not be used. It was preserved; explicitly finish that kept trip before starting a new one.",
      );
      return;
    }
    if (matches(selected)) return;
    if (observed.kind !== "unreadable" && observed.raw !== state.raw) {
      message(
        "Your kept trip changed. Review the current card and try again; nothing was replaced.",
      );
      return;
    }
    if (state.kind === "valid") {
      replace = { card: selected, raw: state.raw };
      $("trip-replace-text").textContent =
        `Replace “${card()!.title}” with “${selected.title}”? Existing discoveries and saved cards stay.`;
      $("trip-replace").hidden = false;
      $("trip-replace-confirm").focus();
    } else start(selected, null);
  };
  $("trip-replace-confirm").onclick = () => {
    if (replace) {
      const pending = replace;
      replace = null;
      start(pending.card, pending.raw);
    }
  };
  $("trip-replace-cancel").onclick = () => {
    replace = null;
    $("trip-replace").hidden = true;
    $("start-trip").focus();
  };
  $("trip-resume").onclick = () => {
    refresh();
    const a = card();
    if (a) context.openCard(a);
  };
  $("trip-record").onclick = () => {
    refresh();
    if (context.hasDraft()) {
      context.resumeDraft();
      return;
    }
    const a = card();
    if (a) {
      context.openCard(a);
      context.openNote(a);
    }
  };
  $("trip-finish").onclick = () => {
    state = read();
    render();
    if (state.kind === "unreadable" || state.kind === "empty") return;
    finishRaw = state.raw;
    $("trip-finish-confirmation").hidden = false;
    $("trip-finish-confirm").focus();
  };
  $("trip-finish-cancel").onclick = () => {
    finishRaw = null;
    $("trip-finish-confirmation").hidden = true;
    $("trip-finish").focus();
  };
  $("trip-finish-confirm").onclick = () => {
    if (finishRaw === null) return;
    const expected = finishRaw;
    finishRaw = null;
    const outcome = write(expected, null);
    refresh();
    message(
      outcome === "saved"
        ? "Trip finished on this browser. No discovery or completion was recorded; your saved cards and existing notes stay."
        : outcome === "changed"
          ? "A newer kept trip was preserved. Review it before finishing."
          : "The trip could not be finished or verified in storage. Your kept trip and discoveries were not intentionally replaced; retry when storage is available.",
    );
    if (outcome === "saved") context.focusHome();
  };
  window.addEventListener("storage", (e) => {
    if (e.key !== ACTIVE_TRIP_KEY && e.key !== null) return;
    try {
      if (e.storageArea && e.storageArea !== localStorage) return;
    } catch {
      // The receiver may lose storage access after the other tab wrote.
      // refresh reads defensively and preserves the other tab's bytes.
    }
    refresh();
  });
  refresh();
  return {
    refresh,
    prepare: (a: Activity) => {
      selected = a;
      refresh();
      $("trip-start-status").textContent =
        state.kind === "valid" && matches(a)
          ? "This card is already kept on this browser."
          : state.kind === "invalid" ||
              state.kind === "unreadable" ||
              (state.kind === "valid" && !card())
            ? "Stored trip data is unavailable. It has not been replaced."
            : "Start keeps only this card identity locally. No intent, location, timer or completion is stored.";
    },
    newDraft: (id: string, task: Snapshot, recoveredRaw?: string | null) => {
      state = read();
      noteLink =
        state.kind === "valid" &&
        matches(task) &&
        (recoveredRaw === undefined ||
          (recoveredRaw === state.raw &&
            parseActiveTrip(recoveredRaw).kind === "valid"))
          ? { id, raw: state.raw }
          : null;
    },
    saved: (
      id: string,
      _task: Snapshot,
      edited: boolean,
    ): string | undefined => {
      if (edited || noteLink?.id !== id) return;
      const expected = noteLink.raw;
      noteLink = null;
      const outcome = write(expected, null);
      refresh();
      if (outcome === "saved") {
        message(
          "Discovery saved and this trip finished. Your separate saved card stays.",
        );
        return "This trip is finished.";
      }
      if (outcome === "changed")
        return "A different or newer kept trip was left unchanged.";
      const notice =
        "Your discovery is saved, but finishing the trip could not be verified. You do not need to save the discovery again." +
        (state.kind === "valid" || state.kind === "invalid"
          ? " Use Finish trip to retry removing the remaining kept trip."
          : "");
      message(notice);
      return notice;
    },
  };
}
