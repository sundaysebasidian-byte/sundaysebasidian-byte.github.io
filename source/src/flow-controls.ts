export const writingStarters = [
  "I noticed ",
  "A small detail was ",
  "Next time I want to notice ",
] as const;

// A user-selected sentence opening, never generated observation content.
export function startDiscovery(
  current: string,
  starter: string,
): string | null {
  return current.length === 0 && writingStarters.some((s) => s === starter)
    ? starter
    : null;
}

export function setupWritingStarters(input: HTMLTextAreaElement) {
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>("#writing-starters button"),
  ];
  const refresh = () =>
    buttons.forEach((b) => {
      b.disabled = input.value.length > 0;
    });
  buttons.forEach((button) => {
    button.onclick = () => {
      const next = startDiscovery(input.value, button.dataset.starter || "");
      if (next === null) return;
      input.value = next;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      input.setSelectionRange(next.length, next.length);
    };
  });
  input.addEventListener("input", refresh);
  refresh();
  return refresh;
}

export function activeFilterLabels(selection: {
  search: string;
  tag: string;
  scene: string;
  lens: string;
  month: string;
  from: string;
  to: string;
  family: string;
}): string[] {
  const labels: string[] = [];
  if (selection.search.trim())
    labels.push("Search: “" + selection.search.trim() + "”");
  for (const [name, value] of [
    ["Tag", selection.tag],
    ["Scene", selection.scene],
    ["Lens", selection.lens],
    ["Month", selection.month],
  ])
    if (value && value !== "any") labels.push(name + ": " + value);
  if (selection.from) labels.push("From " + selection.from + " (UTC)");
  if (selection.to) labels.push("Through " + selection.to + " (UTC)");
  if (selection.family) labels.push("Family: " + selection.family);
  return labels;
}
