import type { Activity } from "./catalog.ts";
export function feedbackChoice(
  open: () => Activity | null,
  apply: (id: string, kind: "done" | "skipped") => void,
  browse: () => void,
) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const dialog = $<HTMLDialogElement>("feedback-choice");
  const reason = $<HTMLSelectElement>("feedback-reason");
  let id = "";
  function describe() {
    const action =
      reason.value === "recent"
        ? "Mark this family recently done. It enters the normal three-family cooldown; it is not permanently set aside."
        : reason.value === "environment" || reason.value === "movement"
          ? "Open the field guide to choose a different activity. No persistent preference is changed. Adjust your explicit conditions yourself."
          : "Set this content family aside until you undo or clear preferences. Every sibling shares this choice; model scores stay unchanged.";
    $("feedback-scope").textContent =
      "Content family: " +
      (open()?.family || "unknown") +
      ". " +
      action +
      " The reason is not saved or used to infer health or location.";
    $("confirm-feedback-choice").textContent =
      reason.value === "recent"
        ? "Mark recently done"
        : ["environment", "movement"].includes(reason.value)
          ? "Choose another activity"
          : "Set family aside";
  }
  $("cancel-feedback-choice").onclick = () => dialog.close();
  reason.onchange = describe;
  $("confirm-feedback-choice").onclick = () => {
    const current = open();
    if (!dialog.open || current?.id !== id) {
      dialog.close();
      return;
    }
    const value = reason.value;
    dialog.close();
    if (["environment", "movement"].includes(value)) browse();
    else apply(id, value === "recent" ? "done" : "skipped");
  };
  return (card: Activity) => {
    id = card.id;
    reason.value = "other";
    $("feedback-card-title").textContent = card.title;
    describe();
    dialog.showModal();
    reason.focus();
  };
}
