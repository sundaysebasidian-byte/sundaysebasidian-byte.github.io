import type { Activity } from "./catalog.ts";
import { pocketCues } from "./pocket.ts";
import {
  printLine as line,
  requestPrint,
  setupPrintSheet,
  PrintNotReadyError,
} from "./print-sheet.ts";

export type PrintableCard = {
  card: Activity;
  match: string;
  caution: string;
  fit: string;
  warning?: string;
  safety: string;
};

// Only an authored activity and its public fit/safety receipt enter this surface.
export function cardPrintPages(value: PrintableCard | null): HTMLElement[] {
  const page = document.createElement("article");
  page.className = "printed-field-card printed-current-card";
  line(page, "p", "POCKET FIELD TRIP / TAKE ONE CARD OUTSIDE");
  if (!value) {
    line(page, "h1", "Choose a field note first.");
    line(
      page,
      "p",
      "Open the field guide or match a trip, then choose Print this card. No notebook records are printed.",
    );
    return [page];
  }
  const { card } = value;
  line(page, "h1", card.title);
  line(
    page,
    "p",
    `${card.minutes} min · ${card.still ? "One spot" : "A gentle walk"}`,
  );
  line(page, "p", card.subtitle);
  line(page, "p", value.safety);
  line(page, "p", value.fit);
  if (value.warning)
    line(page, "p", value.warning).className = "printed-fit-warning";
  const steps = document.createElement("ol");
  card.steps.forEach((step) => line(steps, "li", step));
  page.append(steps);
  line(page, "h2", "Three cues. Then the world.");
  line(page, "p", pocketCues[card.id].join(" / "));
  line(page, "p", card.takeaway);
  line(page, "h2", "One thing you noticed");
  line(page, "p", card.prompt);
  line(page, "p", "________________________________________________");
  line(page, "p", "Leave things as you found them.");
  line(
    page,
    "footer",
    `${value.match}\n${value.caution}\n${card.id} / ${card.version} · authored field note · private candidate; publication pending`,
  );
  return [page];
}

export function setupCardPrint(read: () => PrintableCard | null) {
  const status = document.getElementById("card-print-status")!;
  setupPrintSheet(() => cardPrintPages(read()));
  document.getElementById("print-card")!.onclick = () => {
    const value = read();
    if (!value) return;
    status.textContent =
      "Print preview requested for this card only. Check the preview; choose your printer or Save as PDF yourself. Notebook records are excluded.";
    try {
      requestPrint(cardPrintPages(value));
    } catch (error) {
      status.textContent =
        error instanceof PrintNotReadyError
          ? "The page is still loading. Try printing again once it finishes, or use Take this card as text."
          : "Print could not open. Use Take this card as text to copy or download the full instructions.";
      document.getElementById("share-card")!.focus();
    }
  };
}
