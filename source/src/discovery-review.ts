import { sceneLabel, type Discovery } from "./journal.ts";
import { lensLabels } from "./lenses.ts";
// Historical text only: never promoted to a current activity or model input.
export function discoveryReview(n: Discovery): HTMLElement {
  const article = document.createElement("article");
  article.className = "literal-discovery-review";
  const p = (text: string) => {
    const el = document.createElement("p");
    el.textContent = text;
    return el;
  };
  const details = document.createElement("details"),
    summary = document.createElement("summary");
  summary.textContent = "Stored task snapshot · read only";
  details.append(
    summary,
    p(
      `${n.task.title} · ${lensLabels[n.task.lens]} · ${n.task.version} · ${n.task.minutes} min`,
    ),
    p("Steps"),
    ...n.task.steps.map((s, i) => p(`${i + 1}. ${s}`)),
    p("Pocket cues"),
    ...n.task.cues.map((s, i) => p(`${i + 1}. ${s}`)),
    p(`Observation prompt: ${n.task.prompt}`),
    p(
      `Stored ID: ${n.task.id}; family: ${n.task.family}; settings: ${n.task.settings.join(", ")}; one spot: ${n.task.still ? "yes" : "no"}; requires: ${(n.task.requires || []).join(", ") || "none"}. Literal historical content, not a current fit check or AI analysis.`,
    ),
  );
  article.append(
    p(n.text),
    p(
      `${n.createdAt} · updated ${n.updatedAt} (UTC) · ${sceneLabel(n.scene)} · ${n.tags.map((t) => "#" + t).join(" ")}`,
    ),
    details,
  );
  return article;
}
