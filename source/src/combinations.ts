import type { Activity, Setting } from "./catalog.ts";

// Internal authored modules, not an import format or a free-form generator.
export const COMBINATION_VERSION = "2026-10-06.modular.1";
export type CombinationSelection = {
  lens: "edges" | "texture";
  action: "compare" | "trace-with-eyes";
  constraint: "safe-one-spot";
  trace: "one-line-contrast" | "one-line-shape" | "two-words";
};
export type CompositionReceipt = CombinationSelection & {
  reviewId: string;
  explanation: string;
  receipt: string;
};

const lenses = {
  edges: {
    label: "Edges & boundaries",
    family: "boundaries",
    pair: "visible edges where one surface meets another",
    line: "visible edge",
    comparison:
      "Compare their shapes: which is straighter, and which has more surprises?",
    contrastPrompt: "Which edge was more orderly, and which surprised you?",
    shapePrompt: "What shape would capture the edge you followed?",
    tags: ["edge", "boundary", "shapes"],
  },
  texture: {
    label: "Surfaces & texture",
    family: "surface-pair",
    pair: "surfaces already in view",
    line: "line in a visible surface pattern",
    comparison:
      "Compare rough and smooth patterns using only the details you can make out.",
    contrastPrompt: "How do the two visible surfaces differ?",
    shapePrompt: "What bend or break did you notice in the surface pattern?",
    tags: ["texture", "surface", "pattern"],
  },
} as const;
type LensModule = (typeof lenses)[keyof typeof lenses];
const actions = {
  compare: {
    label: "compare two details",
    cue: "Compare two",
    traces: ["one-line-contrast", "two-words"],
    step: (lens: LensModule) => `Choose two ${lens.pair}. ${lens.comparison}`,
  },
  "trace-with-eyes": {
    label: "follow a visible line with your eyes",
    cue: "Follow a line",
    traces: ["one-line-shape"],
    step: (lens: LensModule) =>
      `Choose one ${lens.line}. Follow it with your eyes. Notice one bend, break or change in direction.`,
  },
} as const;
const constraints = {
  "safe-one-spot": {
    minutes: 5,
    settings: ["street", "park", "garden", "water"] as Setting[],
    still: true,
    requires: [],
    cue: "Safe spot",
    step: "Settle in a safe spot, seated or standing, away from traffic and water’s edge. Use only what is already in view. If nothing suitable is visible, stop and choose another note; do not move closer.",
    label: "one safe spot, seated or standing; no touching or moving closer",
  },
} as const;
const traces = {
  "one-line-contrast": {
    label: "one optional contrast sentence",
    cue: "One contrast",
    step: (_lens: LensModule) =>
      "Look once more without moving closer. Keep one contrast in mind, or bring it back as a sentence. Leave the scene untouched.",
    prompt: (lens: LensModule) => lens.contrastPrompt,
    takeaway: "Bring back a sentence about where things meet.",
  },
  "one-line-shape": {
    label: "one imagined mark or optional shape sentence",
    cue: "One mark",
    step: (_lens: LensModule) =>
      "Imagine that change as a tiny drawn mark. Keep it in mind, or describe it in a sentence later. Leave the scene untouched.",
    prompt: (lens: LensModule) => lens.shapePrompt,
    takeaway: "Bring back the shape of a line you had overlooked.",
  },
  "two-words": {
    label: "two optional describing words",
    cue: "Two words",
    step: (_lens: LensModule) =>
      "Choose two describing words, one for each surface. Keep them in mind, or write them later. Leave both untouched.",
    prompt: (_lens: LensModule) =>
      "What two words describe the surfaces you compared?",
    takeaway: "Bring back a pair of words for an ordinary place.",
  },
} as const;
type Rule = CombinationSelection & {
  id: string;
  title: string;
  subtitle: string;
  meaning: string;
  explanation: string;
  reviewId: string;
};
// Four complete outputs are source-reviewed individually. A module-compatible
// tuple still needs its own row here; there is no Cartesian-product admission.
export const combinationRules: readonly Readonly<Rule>[] = Object.freeze(
  [
    {
      id: "edge-compare",
      lens: "edges",
      action: "compare",
      constraint: "safe-one-spot",
      trace: "one-line-contrast",
      title: "Find two kinds of edge",
      subtitle: "Where one thing becomes another.",
      meaning:
        "Observe the edges and boundaries between ordinary outdoor surfaces from a safe stationary place. Compare a straight border with an uneven border using your eyes. A five minute visual creative contrast, without touching or approaching water.",
      explanation:
        "Two visible boundaries give a concrete shape comparison. A contrast sentence records the difference; the same stationary safety rule applies in every setting.",
      reviewId: "composition-01",
    },
    {
      id: "edge-follow",
      lens: "edges",
      action: "trace-with-eyes",
      constraint: "safe-one-spot",
      trace: "one-line-shape",
      title: "Follow an edge with your eyes",
      subtitle: "A small journey while staying still.",
      meaning:
        "Follow a visible edge or boundary with your eyes from a safe stationary outdoor spot. Trace how a line bends, breaks or changes without touching objects or moving toward it. A five minute drawing-inspired observation of ordinary shapes.",
      explanation:
        "A single visible boundary supports eye-only tracing. An imagined mark records its bend; this is an alternative in the same boundaries family, not a fresh family.",
      reviewId: "composition-02",
    },
    {
      id: "texture-pair",
      lens: "texture",
      action: "compare",
      constraint: "safe-one-spot",
      trace: "two-words",
      title: "Compare two surfaces",
      subtitle: "A touch-free texture study.",
      meaning:
        "Notice textures without walking or touching anything. Compare two outdoor surfaces visible from one safe spot, such as paving, a wall or a railing. Study rough and smooth patterns with your eyes. Five minute creative observation without needing plants.",
      explanation:
        "Two already-visible surfaces support visual comparison without touching. A pair of words gives each surface a trace; plants and direct light are not prerequisites.",
      reviewId: "composition-03",
    },
    {
      id: "texture-trace",
      lens: "texture",
      action: "trace-with-eyes",
      constraint: "safe-one-spot",
      trace: "one-line-shape",
      title: "Follow a surface pattern",
      subtitle: "One small line in an ordinary surface.",
      meaning:
        "Follow a visible line in an outdoor surface pattern with your eyes from a safe seated or standing spot. Notice a bend or break in paving, a wall or a railing without touching, walking closer or needing plants. Imagine one tiny mark for a five minute visual texture observation.",
      explanation:
        "A line already visible in a surface pattern makes eye-only tracing concrete. It reuses the shape trace and remains in the surface-pair family, so it cannot bypass recent or set-aside surface feedback.",
      reviewId: "composition-04",
    },
  ].map((rule) => Object.freeze(rule)),
) as readonly Readonly<Rule>[];

function selection(value: unknown): CombinationSelection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const keys = Object.keys(value);
  if (
    keys.length !== 4 ||
    keys.some((k) => !["lens", "action", "constraint", "trace"].includes(k))
  )
    return null;
  const v = value as Record<string, unknown>;
  if (Object.values(v).some((x) => typeof x !== "string")) return null;
  if (
    !Object.hasOwn(lenses, String(v.lens)) ||
    !Object.hasOwn(actions, String(v.action)) ||
    !Object.hasOwn(constraints, String(v.constraint)) ||
    !Object.hasOwn(traces, String(v.trace))
  )
    return null;
  return v as CombinationSelection;
}
export function assessCombination(value: unknown): {
  allowed: boolean;
  reason: string;
  id?: string;
} {
  const s = selection(value);
  if (!s)
    return {
      allowed: false,
      reason: "Unknown module, extra field or unsupported safety policy.",
    };
  if (!(actions[s.action].traces as readonly string[]).includes(s.trace))
    return {
      allowed: false,
      reason:
        "The trace does not fit this action: a comparison needs a contrast/pair, and eye-tracing needs a shape.",
    };
  const rule = combinationRules.find(
    (r) =>
      r.lens === s.lens &&
      r.action === s.action &&
      r.constraint === s.constraint &&
      r.trace === s.trace,
  );
  return rule
    ? { allowed: true, id: rule.id, reason: rule.explanation }
    : {
        allowed: false,
        reason:
          "Modules may be compatible, but this complete output has no individual source-review row. It stays disabled.",
      };
}
export function compileCombination(value: unknown): Activity {
  const result = assessCombination(value);
  if (!result.allowed) throw Error(result.reason);
  const rule = combinationRules.find((r) => r.id === result.id)!;
  const lens = lenses[rule.lens],
    action = actions[rule.action],
    policy = constraints[rule.constraint],
    trace = traces[rule.trace];
  return {
    id: rule.id,
    version: COMBINATION_VERSION,
    title: rule.title,
    subtitle: rule.subtitle,
    family: lens.family,
    lens: rule.lens,
    minutes: policy.minutes,
    settings: [...policy.settings],
    still: policy.still,
    requires: [],
    meaning: rule.meaning,
    tags: [...lens.tags, rule.action === "compare" ? "compare" : "follow"],
    steps: [policy.step, action.step(lens), trace.step(lens)],
    cues: [policy.cue, action.cue, trace.cue],
    prompt: trace.prompt(lens),
    takeaway: trace.takeaway,
    composition: {
      lens: rule.lens,
      action: rule.action,
      constraint: rule.constraint,
      trace: rule.trace,
      reviewId: rule.reviewId,
      explanation: rule.explanation,
      receipt: `${lens.label}: ${action.label}; ${policy.label}; ${trace.label}.`,
    },
  };
}
export const curatedCombinations: Activity[] = combinationRules.map((r) =>
  compileCombination({
    lens: r.lens,
    action: r.action,
    constraint: r.constraint,
    trace: r.trace,
  }),
);
