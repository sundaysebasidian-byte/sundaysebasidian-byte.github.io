// An in-tab guide through the app, never evidence of going outdoors/completion.
export function journeyUI(actions: {
  hasCard: () => boolean;
  hasDraft: () => boolean;
  choose: () => void;
  take: () => void;
  keep: () => void;
}) {
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>("#journey button"),
  ];
  const result = document.getElementById("result")!;
  const editor = document.getElementById(
    "discovery-editor",
  ) as HTMLDialogElement;
  const stages = ["choose", "take", "keep"] as const;
  function stage(value: (typeof stages)[number]) {
    for (const b of buttons) {
      if (b.dataset.stage === value) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    }
  }
  function refresh() {
    buttons[1].disabled = !actions.hasCard();
    buttons[2].disabled = !actions.hasCard() && !actions.hasDraft();
  }
  buttons.forEach((button, index) => {
    button.onclick = () => {
      refresh();
      if (button.disabled) return;
      [actions.choose, actions.take, actions.keep][index]();
      stage(stages[index]);
    };
  });
  new MutationObserver(() => {
    refresh();
    if (!result.hidden) stage("take");
  }).observe(result, { attributes: true, attributeFilter: ["hidden"] });
  new MutationObserver(() => {
    if (editor.open) stage("keep");
    refresh();
  }).observe(editor, { attributes: true, attributeFilter: ["open"] });
  stage("choose");
  refresh();
  return {
    refresh,
    cardReady: () => {
      refresh();
      stage("take");
    },
  };
}
