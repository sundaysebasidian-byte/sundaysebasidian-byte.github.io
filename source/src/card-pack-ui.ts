import { reviewedPackOutput } from "./pack-output.ts";
import { downloadText } from "./text-download.ts";
import { rawRescueFile } from "./raw-rescue.ts";
import { readLocalJSON } from "./local-json.ts";
import {
  PACK_KEY,
  MAX_PACK_BYTES,
  parseCardPack,
  exportCardPack,
  reviewedPack,
  reviewedCard,
  planCardPack,
  type CardPack,
} from "./card-pack.ts";

// Follows notebook backup's staged read/cancel and compare-before-write pattern.
// This module has no catalog mutation, worker, fetch, task-save or feedback API.
export function cardPackUI() {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const dialog = $<HTMLDialogElement>("card-packs"),
    info = $<HTMLDialogElement>("info");
  const choose = $<HTMLButtonElement>("choose-pack"),
    file = $<HTMLInputElement>("pack-file"),
    confirm = $<HTMLButtonElement>("confirm-pack"),
    ack = $<HTMLInputElement>("pack-replace-ack");
  let current: CardPack | null = null,
    staged: CardPack | null = null,
    raw: string | null = null,
    base: string | null = null,
    readable = true,
    epoch = 0,
    viewingStored = false;
  const say = (message: string) => {
    $("pack-status").textContent = message;
  };
  const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
  reviewedPackOutput(say);
  function read() {
    readable = true;
    current = null;
    raw = null;
    try {
      raw = localStorage.getItem(PACK_KEY);
      current = raw === null ? null : parseCardPack(raw);
    } catch {
      readable = false;
      say(
        "Stored pack is unreadable or storage is unavailable. Original bytes are kept; import and stored-pack export are blocked.",
      );
    }
    $("pack-stored-summary").textContent = !readable
      ? "Stored review pack could not be read."
      : current
        ? `${current.title} · ${current.cards.length} cards · ${current.packId} / ${current.version}`
        : "No review pack kept on this browser.";
    $<HTMLButtonElement>("export-stored-pack").disabled = !current || !readable;
    choose.disabled = !readable;
    $<HTMLButtonElement>("review-stored-pack").disabled = !current || !readable;
    $<HTMLButtonElement>("remove-stored-pack").disabled = raw === null;
    $<HTMLButtonElement>("rescue-stored-pack").disabled = raw === null;
  }
  function download(pack: CardPack, filename: string) {
    try {
      downloadText(filename, exportCardPack(pack), "application/json");
      say(
        "JSON download requested. This file contains cards only, not your discoveries or intent. Nothing was uploaded.",
      );
    } catch (e) {
      say(message(e));
    }
  }
  function line(parent: HTMLElement, tag: string, text: string) {
    const node = document.createElement(tag);
    node.textContent = text;
    parent.append(node);
    return node;
  }
  function renderPreview(pack: CardPack) {
    const area = $("pack-preview-cards");
    area.replaceChildren();
    $("pack-preview-heading").textContent =
      `${pack.title} · ${pack.cards.length} cards`;
    $("pack-preview-meta").textContent =
      `${pack.description}\nPack: ${pack.packId} / ${pack.version}. Author claim: ${pack.author.name}. License proposal: ${pack.licenseProposal.spdx}, publication approval pending. Review claim: ${pack.reviewClaim.record}; untrusted. Source profile: ${pack.compatibility.appSourceVersion} / ${pack.compatibility.moduleVersion}.`;
    for (const card of pack.cards) {
      const item = document.createElement("article");
      item.className = "pack-preview-card";
      line(item, "h3", card.title);
      const trust = line(
        item,
        "p",
        reviewedCard(card)
          ? "Matches a built-in reviewed card. Already present in the original guide; no additional card will be added."
          : "Unreviewed changed text. Review data only; not approved for an activity or AI suggestion.",
      );
      trust.className = "pack-trust";
      line(
        item,
        "p",
        `${card.subtitle}\n${card.id} / ${card.version} · family: ${card.family}\n${card.minutes} minutes · one safe spot · ${card.settings.join(" / ")} · no plant/light/touch prerequisites\nModules: ${Object.values(card.composition).join(" / ")}`,
      );
      const details = document.createElement("details");
      line(details, "summary", "Review complete card text");
      line(details, "p", `Description: ${card.meaning}`);
      const list = document.createElement("ol");
      card.steps.forEach((s) => line(list, "li", s));
      details.append(list);
      line(details, "p", `Pocket cues: ${card.cues.join(" · ")}`);
      line(details, "p", `Observation prompt: ${card.prompt}`);
      line(details, "p", `Takeaway: ${card.takeaway}`);
      line(
        details,
        "p",
        `Tags: ${card.tags.join(" / ")}\nClaimed review ID: ${card.claimedSourceReviewId}\nRationale: ${card.rationale}`,
      );
      item.append(details);
      area.append(item);
    }
  }
  function preview() {
    if (!staged) return;
    try {
      const plan = planCardPack(current, staged);
      $("pack-conflict-summary").textContent = plan.duplicate
        ? "This complete pack is already kept. No write or added card is needed."
        : `${plan.identical} identical card IDs, ${plan.conflicts} changed same-ID cards, ${plan.additions} new IDs in this file. ${plan.replacing ? `This replaces the one stored review pack, including ${plan.removed} current card IDs absent from this file. Download the current pack first if you want to keep it.` : "This will keep one review pack on this browser."} The original 20-card guide, AI pool, saved card and notebook stay unchanged.`;
      $("pack-replace-confirmation").hidden = !plan.replacing;
      $("export-before-replace").hidden = !plan.replacing;
      confirm.textContent = plan.replacing
        ? "Replace stored review pack"
        : "Keep review pack locally";
      confirm.disabled = plan.duplicate || (plan.replacing && !ack.checked);
    } catch (e) {
      confirm.disabled = true;
      say(message(e));
    }
  }
  function reviewMode(stored: boolean) {
    dialog.dispatchEvent(new Event("pft-pack-view-change"));
    viewingStored = stored;
    confirm.hidden = stored;
    $("pack-preview").setAttribute(
      "aria-label",
      stored ? "Stored pack review" : "Import preview",
    );
    for (const id of ["cancel-pack", "cancel-pack-bottom"])
      $(id).textContent = stored
        ? "Back to pack files"
        : "Cancel · keep current pack";
  }
  $("review-stored-pack").onclick = () => {
    epoch++;
    staged = null;
    base = null;
    read();
    if (!current || !readable) {
      say("No readable stored pack is available. Nothing was changed.");
      return;
    }
    reviewMode(true);
    ack.checked = false;
    confirm.disabled = true;
    $("pack-replace-confirmation").hidden = true;
    $("export-before-replace").hidden = true;
    renderPreview(current);
    $("pack-controls").hidden = true;
    $("pack-preview").hidden = false;
    $("pack-conflict-summary").textContent =
      "Read-only snapshot of the pack just read from browser storage. Another tab can change it; return and reopen to refresh. No imported activity is admitted.";
    say("Stored pack review only. Nothing was written or uploaded.");
    $("pack-preview-heading").focus();
  };
  function cancel() {
    const wasStored = viewingStored;
    reviewMode(false);
    epoch++;
    staged = null;
    ack.checked = false;
    $("pack-preview").hidden = true;
    $("pack-controls").hidden = false;
    read();
    say(
      wasStored
        ? "Stored review closed. Nothing was changed."
        : "Import cancelled. Stored pack, original cards and discoveries were kept.",
    );
    if (wasStored && !$<HTMLButtonElement>("review-stored-pack").disabled)
      $("review-stored-pack").focus();
    else if (!choose.disabled) choose.focus();
    else $("export-reviewed-pack").focus();
  }
  $("cancel-pack").onclick = cancel;
  $("cancel-pack-bottom").onclick = cancel;
  $("close-packs").onclick = () => dialog.close();
  dialog.addEventListener("close", () => {
    epoch++;
    staged = null;
    choose.disabled = !readable;
    info.showModal();
    $("manage-packs").focus();
  });
  dialog.addEventListener("cancel", (e) => {
    if (e.target !== dialog) return;
    e.preventDefault();
    if (staged || viewingStored) cancel();
    else dialog.close();
  });
  $("export-reviewed-pack").onclick = () =>
    download(reviewedPack(), "pocket-field-trip-reviewed-cards.json");
  $("export-stored-pack").onclick = () => {
    try {
      const latest = localStorage.getItem(PACK_KEY);
      if (latest === null)
        throw Error(
          "Stored pack changed or is absent. Reopen card packs to refresh.",
        );
      download(
        parseCardPack(latest),
        "pocket-field-trip-local-review-pack.json",
      );
    } catch (e) {
      say(message(e));
    }
  };
  $("export-before-replace").onclick = $("export-stored-pack").onclick;
  choose.onclick = () => {
    read();
    if (!readable) return;
    file.value = "";
    file.click();
  };
  file.onchange = async () => {
    const selected = file.files?.[0];
    if (!selected || !dialog.open) return;
    file.value = "";
    const owner = ++epoch;
    choose.disabled = true;
    say("Reading local JSON. Nothing changes until you confirm.");
    try {
      if (selected.size > MAX_PACK_BYTES)
        throw Error(
          "Choose a card pack no larger than 1 MiB. Nothing was changed.",
        );
      const text = await readLocalJSON(selected);
      if (owner !== epoch || !dialog.open) return;
      const pack = parseCardPack(text);
      read();
      if (!readable) return;
      reviewMode(false);
      staged = pack;
      base = raw;
      ack.checked = false;
      renderPreview(pack);
      $("pack-controls").hidden = true;
      $("pack-preview").hidden = false;
      preview();
      say(
        "Preview only. File declarations do not approve these cards; no imported text enters the AI pool.",
      );
      $("pack-preview-heading").focus();
    } catch (e) {
      if (owner === epoch) say(message(e));
    } finally {
      if (owner === epoch) choose.disabled = !readable;
    }
  };
  ack.onchange = preview;
  confirm.onclick = () => {
    if (!staged || confirm.disabled) return;
    try {
      const serialized = exportCardPack(staged);
      const latest = localStorage.getItem(PACK_KEY);
      if (latest !== base)
        throw Error(
          "Stored pack changed after preview. Cancel and choose the file again; nothing was changed.",
        );
      const plan = planCardPack(current, staged);
      if (plan.duplicate || (plan.replacing && !ack.checked))
        throw Error(
          "Explicit replacement confirmation is required. Nothing was changed.",
        );
      localStorage.setItem(PACK_KEY, serialized); // Browser storage set is atomic; failed write keeps the previous value.
      staged = null;
      $("pack-preview").hidden = true;
      $("pack-controls").hidden = false;
      read();
      say(
        "Review pack kept locally. No imported card was added to the original guide or AI pool. Your discoveries and preferences were kept.",
      );
      $("export-stored-pack").focus();
    } catch (e) {
      say(`Not imported. ${message(e)}`);
    }
  };
  const removeDialog = $<HTMLDialogElement>("remove-pack-dialog"),
    rescueDialog = $<HTMLDialogElement>("rescue-pack-dialog");
  let removal: string | null = null,
    rescue: ReturnType<typeof rawRescueFile> | null = null;
  $("remove-stored-pack").onclick = () => {
    read();
    if (raw === null) return;
    removal = raw;
    $("remove-pack-detail").textContent = current
      ? `${current.title} · ${current.packId} / ${current.version}`
      : "Unreadable stored pack. Keep an unverified raw copy before removal.";
    $<HTMLInputElement>("remove-pack-ack").checked = false;
    $<HTMLButtonElement>("confirm-remove-pack").disabled = true;
    $("remove-pack-status").textContent = "";
    removeDialog.showModal();
    $("cancel-remove-pack").focus();
  };
  $("remove-pack-ack").onchange = () => {
    $<HTMLButtonElement>("confirm-remove-pack").disabled =
      !$<HTMLInputElement>("remove-pack-ack").checked;
  };
  $("cancel-remove-pack").onclick = () => removeDialog.close();
  removeDialog.addEventListener("close", () => {
    removal = null;
    read();
    $("export-reviewed-pack").focus();
  });
  $("confirm-remove-pack").onclick = () => {
    if (
      !removeDialog.open ||
      removal === null ||
      !$<HTMLInputElement>("remove-pack-ack").checked
    )
      return;
    let removalCalled = false;
    try {
      if (localStorage.getItem(PACK_KEY) !== removal)
        throw Error("Stored pack changed. Cancel and review it again.");
      localStorage.removeItem(PACK_KEY);
      removalCalled = true;
      if (localStorage.getItem(PACK_KEY) !== null)
        throw Error("Storage did not remove the pack.");
      removeDialog.close();
      say(
        "Stored review pack removed. Your notebook and original guide were kept.",
      );
    } catch (e) {
      $("remove-pack-status").textContent = removalCalled
        ? `Removal was requested, but its final storage state could not be verified. Cancel and reopen to inspect the current record. ${message(e)}`
        : `Not removed. ${message(e)}`;
    }
  };
  $("rescue-stored-pack").onclick = () => {
    try {
      read();
      if (raw === null) throw Error("Stored pack could not be read.");
      rescue = rawRescueFile(raw, new Date().toISOString(), true);
      $<HTMLTextAreaElement>("rescue-pack-text").value = raw;
      $<HTMLInputElement>("rescue-pack-ack").checked = false;
      $<HTMLButtonElement>("download-rescue-pack").disabled = true;
      $("rescue-pack-status").textContent =
        `${rescue.bytes} bytes in an unverified text envelope. Original stored strings are preserved.`;
      rescueDialog.showModal();
      $("cancel-rescue-pack").focus();
    } catch (e) {
      rescue = null;
      say(`Raw copy cannot be prepared. Original bytes kept. ${message(e)}`);
    }
  };
  $("rescue-pack-ack").onchange = () => {
    $<HTMLButtonElement>("download-rescue-pack").disabled =
      !$<HTMLInputElement>("rescue-pack-ack").checked;
  };
  $("cancel-rescue-pack").onclick = () => rescueDialog.close();
  rescueDialog.addEventListener("close", () => {
    rescue = null;
    $<HTMLTextAreaElement>("rescue-pack-text").value = "";
    $("rescue-stored-pack").focus();
  });
  $("download-rescue-pack").onclick = () => {
    if (
      !rescueDialog.open ||
      !rescue ||
      !$<HTMLInputElement>("rescue-pack-ack").checked
    )
      return;
    try {
      if (localStorage.getItem(PACK_KEY) !== rescue.raw)
        throw Error("Stored pack changed. Cancel and prepare a fresh copy.");
      downloadText(rescue.filename, rescue.text);
      $("rescue-pack-status").textContent =
        "Unverified raw copy download requested. Check your device; no restoration or upload is claimed.";
    } catch (e) {
      $("rescue-pack-status").textContent =
        `No download requested. ${message(e)}`;
    }
  };
  return () => {
    epoch++;
    staged = null;
    reviewMode(false);
    ack.checked = false;
    $("pack-preview").hidden = true;
    $("pack-controls").hidden = false;
    say("");
    read();
    info.close();
    dialog.showModal();
    $("export-reviewed-pack").focus();
  };
}
