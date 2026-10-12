import {
  assessCombination,
  compileCombination,
  combinationRules,
} from "./combinations.ts";
import { activities, type Activity } from "./catalog.ts";
import { settleSurface } from "./calm-motion.ts";

export function combinationUI(open: (card: Activity) => void) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const lens = $<HTMLSelectElement>("compose-lens");
  const action = $<HTMLSelectElement>("compose-action");
  const trace = $<HTMLSelectElement>("compose-trace");
  const button = $<HTMLButtonElement>("compose-open");
  const selection = () => ({
    lens: lens.value,
    action: action.value,
    constraint: "safe-one-spot",
    trace: trace.value,
  });
  const update = () => {
    const result = assessCombination(selection());
    button.disabled = !result.allowed;
    for (const preset of $(
      "compose-presets",
    ).querySelectorAll<HTMLButtonElement>("button"))
      preset.setAttribute(
        "aria-pressed",
        String(preset.dataset.cardId === result.id),
      );
    $("compose-preview").hidden = !result.allowed;
    $("compose-alternatives").hidden = result.allowed;
    $("compose-alternatives").replaceChildren();
    if (result.allowed) {
      const card = compileCombination(selection());
      $("compose-preview-title").textContent = card.title;
      $("compose-preview-steps").replaceChildren(
        ...card.steps.map((step) => {
          const li = document.createElement("li");
          li.textContent = step;
          return li;
        }),
      );
      $("compose-preview-trace").textContent = card.prompt;
      $("compose-receipt").textContent =
        result.reason +
        " " +
        card.composition!.receipt +
        " Source review: " +
        card.composition!.reviewId +
        ". " +
        card.composition!.explanation +
        " Manual reviewed assembly; no AI generation.";
      settleSurface(
        $("compose-preview"),
        { opacity: 0.96, translate: "0 4px" },
        240,
      );
    } else {
      for (const rule of combinationRules.filter(
        (rule) => rule.lens === lens.value,
      ))
        $("compose-alternatives").append(
          preset(rule, "Use reviewed alternative: "),
        );
    }
    $("compose-status").textContent = result.allowed
      ? `${compileCombination(selection()).title} · reviewed, no AI.`
      : `${result.reason} No card will open for this combination.`;
  };
  function preset(rule: (typeof combinationRules)[number], prefix = "") {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "text-button";
    b.textContent = prefix + rule.title;
    b.dataset.cardId = rule.id;
    b.setAttribute("aria-pressed", "false");
    b.onclick = () => {
      lens.value = rule.lens;
      action.value = rule.action;
      trace.value = rule.trace;
      update();
      if (!b.isConnected) $("compose-open").focus();
    };
    return b;
  }
  $("compose-presets").replaceChildren(
    ...combinationRules.map((rule) => preset(rule)),
  );
  for (const control of [lens, action, trace])
    control.addEventListener("change", update);
  button.onclick = () => {
    const result = assessCombination(selection());
    if (!result.allowed) return update();
    // Use the reviewed catalog identity so source numbering, saved-card
    // compatibility and family feedback all refer to the same authored entry.
    const card = activities.find((item) => item.id === result.id);
    if (!card) {
      button.disabled = true;
      $("compose-status").textContent =
        "This reviewed card is unavailable in the current guide. Nothing was selected.";
      return;
    }
    $<HTMLDialogElement>("guide").close();
    open(card);
  };
  update();
}
