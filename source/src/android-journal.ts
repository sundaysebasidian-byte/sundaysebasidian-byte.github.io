import { JOURNAL_KEY, parseJournal } from "./journal.ts";
import { ANDROID_DRAFT_KEY, parseAndroidDraft } from "./android-draft.ts";
import { ACTIVE_TRIP_KEY } from "./active-trip.ts";

declare global {
  interface Window {
    __pftJournalBootError?: string;
    __pftPersistJournal?: (
      raw: string | null,
      expected: string | null,
    ) => Promise<void>;
  }
}

// Pure planning: only an exact, already-saved recovery copy is obsolete.
// A changed draft or a different trip must survive a restart.
export function committedRecovery(
  raw: string,
  draftRaw: string | null,
  tripRaw: string | null,
) {
  const journal = parseJournal(raw);
  const draft = parseAndroidDraft(draftRaw);
  if (!draft) return { draft: false, trip: false };
  const note = journal.entries.find((entry) => entry.id === draft.id);
  const saved =
    !!note &&
    note.text === draft.text.trim().replace(/\s+/g, " ") &&
    JSON.stringify(note.task) === JSON.stringify(draft.task) &&
    JSON.stringify(note.tags) === JSON.stringify(draft.tags) &&
    note.scene === draft.scene &&
    (!draft.editing || note.updatedAt !== draft.originalUpdatedAt);
  return {
    draft: saved,
    trip:
      saved &&
      !draft.editing &&
      draft.tripRaw !== null &&
      draft.tripRaw === tripRaw,
  };
}

export async function restoreDeviceJournal() {
  if (!navigator.userAgent.includes("PocketFieldTripApp/0.3.0")) return;
  try {
    const response = await fetch("/native-journal.json", { cache: "no-store" });
    if (!response.ok)
      throw Error("Device notebook could not be read. Saving is paused.");
    const state = await response.json();
    if (state.initialized === false) return; // Adopt existing WebView records on the first acknowledged commit.
    if (
      state.initialized !== true ||
      state.schema !== 1 ||
      !(state.raw === null || typeof state.raw === "string")
    )
      throw Error("Unknown device notebook. Saving is paused.");
    parseJournal(state.raw); // Validate before touching the WebView cache.
    if (state.raw === null) {
      localStorage.removeItem(JOURNAL_KEY);
      localStorage.removeItem("pft-feedback-v1");
    } else {
      const cleanup = committedRecovery(
        state.raw,
        localStorage.getItem(ANDROID_DRAFT_KEY),
        localStorage.getItem(ACTIVE_TRIP_KEY),
      );
      localStorage.setItem(JOURNAL_KEY, state.raw);
      if (cleanup.draft) localStorage.removeItem(ANDROID_DRAFT_KEY);
      if (cleanup.trip) localStorage.removeItem(ACTIVE_TRIP_KEY);
    }
  } catch (error) {
    window.__pftJournalBootError = String(
      error instanceof Error ? error.message : error,
    );
  }
}
