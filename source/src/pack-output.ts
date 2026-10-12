import { reviewedPack, exportCardPack } from "./card-pack.ts";
import {
  printLine as line,
  requestPrint,
  PrintNotReadyError,
} from "./print-sheet.ts";

// The trusted source pack only: personal data and inert imports never enter
// the print/share payload. Both actions are initiated explicitly by the user.
export function reviewedPackOutput(say: (message: string) => void) {
  const print = document.getElementById("print-reviewed-pack")!;
  const share = document.getElementById("share-reviewed-pack")!;
  print.onclick = () => {
    try {
      const pack = reviewedPack();
      const pages: HTMLElement[] = [];
      for (const card of pack.cards) {
        const page = document.createElement("article");
        page.className = "printed-field-card";
        line(page, "p", "POCKET FIELD TRIP / REVIEWED FIELD NOTES");
        line(page, "h1", card.title);
        line(
          page,
          "p",
          `${card.minutes} minutes · one safe spot · no AI needed`,
        );
        line(page, "p", card.subtitle);
        line(
          page,
          "p",
          "Choose a safe, accessible place. Check local conditions yourself; this guide does not know weather or hazards.",
        );
        const steps = document.createElement("ol");
        card.steps.forEach((step) => line(steps, "li", step));
        page.append(steps);
        line(page, "h2", "Three cues. Then the world.");
        line(page, "p", card.cues.join(" / "));
        line(page, "h2", "One thing you noticed");
        line(page, "p", card.prompt);
        line(page, "p", "________________________________________________");
        line(
          page,
          "p",
          "Leave the scene untouched. No timer, streak or proof required.",
        );
        line(
          page,
          "footer",
          `${card.id} / ${card.version} · ${card.claimedSourceReviewId}\n${pack.author.name} · ${pack.licenseProposal.spdx} source proposal · private candidate; publication pending`,
        );
        pages.push(page);
      }
      say(
        "Print dialog requested for the four reviewed cards. Personal notes and imported review text are excluded. Check your print preview before printing.",
      );
      requestPrint(pages);
    } catch (error) {
      say(
        error instanceof PrintNotReadyError
          ? "The page is still loading. Try printing again once it finishes, or download the reviewed JSON."
          : "Print could not open. Download the reviewed JSON or use the individual card text instead.",
      );
    }
  };
  const dialog = document.getElementById("card-packs") as HTMLDialogElement;
  let session = 0,
    attempt = 0;
  dialog.addEventListener("close", () => {
    session++;
    (share as HTMLButtonElement).disabled = false;
  });
  dialog.addEventListener("pft-pack-view-change", () => {
    attempt++;
    (share as HTMLButtonElement).disabled = false;
  });
  share.onclick = async () => {
    if ((share as HTMLButtonElement).disabled || !dialog.open) return;
    const owner = ++attempt,
      opened = session;
    const current = () =>
      owner === attempt && opened === session && dialog.open;
    const button = share as HTMLButtonElement;
    const file = new File(
      [exportCardPack(reviewedPack())],
      "pocket-field-trip-reviewed-cards.json",
      { type: "application/json" },
    );
    let canShare = false;
    try {
      canShare = !!navigator.share && !!navigator.canShare?.({ files: [file] });
    } catch {
      /* Device capability denial uses the same local fallback. */
    }
    if (!canShare) {
      say(
        "File sharing is unavailable here. Download reviewed four-card JSON, then choose where to send that file yourself. Nothing was sent.",
      );
      document.getElementById("export-reviewed-pack")!.focus();
      return;
    }
    button.disabled = true;
    say("Opening your device's share chooser for reviewed card JSON only.");
    try {
      await navigator.share!({
        files: [file],
        title: "Pocket Field Trip · four reviewed cards",
      });
      if (!current()) return;
      say(
        "The device share request completed. Delivery is controlled by the chosen app; no recipient or receipt is tracked here.",
      );
    } catch (error) {
      if (!current()) return;
      say(
        error instanceof DOMException && error.name === "AbortError"
          ? "Share cancelled. Your records were kept."
          : "Sharing could not complete. Download reviewed JSON and share that file yourself.",
      );
    } finally {
      if (current()) button.disabled = false;
    }
  };
}
