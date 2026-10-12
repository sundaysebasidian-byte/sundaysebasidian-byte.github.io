import { Ajv2020 } from "ajv/dist/2020.js";
import schema from "../docs/card-pack/card-pack.schema.json" with { type: "json" };
import {
  curatedCombinations,
  COMBINATION_VERSION,
  compileCombination,
} from "./combinations.ts";
import type { Activity } from "./catalog.ts";

export const PACK_KEY = "pft-card-pack-review-v1";
export const MAX_PACK_BYTES = 1024 * 1024;
export type PackCard = Omit<Activity, "composition"> & {
  requires: [];
  cues: [string, string, string];
  composition: {
    lens: "edges" | "texture";
    action: "compare" | "trace-with-eyes";
    constraint: "safe-one-spot";
    trace: "one-line-contrast" | "one-line-shape" | "two-words";
  };
  claimedSourceReviewId: string;
  rationale: string;
};
export type CardPack = {
  format: "pocket-field-trip-card-pack";
  schema: 1;
  publicationStatus: "private-draft";
  packId: string;
  version: string;
  language: "en";
  title: string;
  description: string;
  author: { name: string; confirmation: "pending-owner-confirmation" };
  licenseProposal: { spdx: "MIT"; approval: "pending-publication-approval" };
  compatibility: {
    appSourceVersion: "0.2.0-rc.3";
    moduleVersion: typeof COMBINATION_VERSION;
    profile: "safe-stationary-v1";
  };
  reviewClaim: {
    scope: "source-only";
    record: string;
    trust: "untrusted-until-local-review";
  };
  cards: PackCard[];
};
// Only this trusted, bundled schema is compiled. Imported JSON is data, never a schema.
const validate = new Ajv2020({
  strict: true,
  allErrors: false,
  ownProperties: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
}).compile(schema);
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`,
      )
      .join(",")}}`;
  return JSON.stringify(value);
}
function preflight(raw: string) {
  if (
    raw.length > MAX_PACK_BYTES ||
    new TextEncoder().encode(raw).byteLength > MAX_PACK_BYTES
  )
    throw Error(
      "Choose a card pack no larger than 1 MiB. Nothing was changed.",
    );
  let depth = 0,
    quoted = false,
    escaped = false;
  for (const ch of raw) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === "{" || ch === "[") {
      if (++depth > 8)
        throw Error("Card pack nesting is unsupported. Nothing was changed.");
    } else if (ch === "}" || ch === "]") depth--;
  }
}
export function parseCardPack(raw: string): CardPack {
  preflight(raw);
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw Error("This is not valid card-pack JSON. Nothing was changed.");
  }
  if (!validate(value))
    throw Error(
      "Unsupported card-pack format, version, fields or limits. Nothing was changed.",
    );
  const pack = value as CardPack;
  const seen = new Set<string>();
  for (const card of pack.cards) {
    if (seen.has(card.id))
      throw Error(
        "Duplicate card IDs are not allowed, even with different text. Nothing was changed.",
      );
    seen.add(card.id);
    const built = compileCombination(card.composition);
    if (
      card.id !== built.id ||
      card.family !== built.family ||
      card.version !== COMBINATION_VERSION ||
      card.lens !== card.composition.lens
    )
      throw Error(
        "Card identity, family or modules conflict with this supported profile. Nothing was changed.",
      );
  }
  return pack;
}
export function reviewedCard(card: PackCard): boolean {
  const built = reviewedPack().cards.find((c) => c.id === card.id);
  return !!built && canonical(card) === canonical(built);
}
export function reviewedPack(): CardPack {
  return {
    format: "pocket-field-trip-card-pack",
    schema: 1,
    publicationStatus: "private-draft",
    packId: "visual-stationary-draft",
    version: "0.1.0-draft.1",
    language: "en",
    title: "Four ways to notice a visible detail",
    description:
      "Private source-review example: compare or eye-trace visible edges and surface patterns from one safe seated or standing spot. Not an approved public family/teacher pack or a field-tested result.",
    author: {
      name: "Pocket Field Trip project author (confirmation pending)",
      confirmation: "pending-owner-confirmation",
    },
    licenseProposal: { spdx: "MIT", approval: "pending-publication-approval" },
    compatibility: {
      appSourceVersion: "0.2.0-rc.3",
      moduleVersion: COMBINATION_VERSION,
      profile: "safe-stationary-v1",
    },
    reviewClaim: {
      scope: "source-only",
      record: "MODULAR-INDEPENDENT-SOURCE-REVIEW.md",
      trust: "untrusted-until-local-review",
    },
    cards: curatedCombinations.map(({ composition, ...card }) => ({
      ...card,
      settings: [...card.settings],
      tags: [...card.tags],
      steps: [...card.steps],
      requires: [],
      cues: [...card.cues!],
      composition: {
        lens: composition!.lens,
        action: composition!.action,
        constraint: composition!.constraint,
        trace: composition!.trace,
      },
      claimedSourceReviewId: composition!.reviewId,
      rationale: composition!.explanation,
    })),
  };
}
export function exportCardPack(pack: CardPack): string {
  const raw = JSON.stringify(pack, null, 2) + "\n";
  parseCardPack(raw);
  return raw;
}
export function planCardPack(current: CardPack | null, incoming: CardPack) {
  // Public API boundaries validate too; previews never mutate either input.
  parseCardPack(JSON.stringify(incoming));
  if (current) parseCardPack(JSON.stringify(current));
  const duplicate = !!current && canonical(current) === canonical(incoming);
  const ids = new Map(current?.cards.map((c) => [c.id, c]) || []);
  const identical = incoming.cards.filter(
    (c) => ids.has(c.id) && canonical(c) === canonical(ids.get(c.id)),
  ).length;
  const conflicts = incoming.cards.filter(
    (c) => ids.has(c.id) && canonical(c) !== canonical(ids.get(c.id)),
  ).length;
  return {
    duplicate,
    replacing: !!current && !duplicate,
    identical,
    conflicts,
    additions: incoming.cards.length - identical - conflicts,
    removed:
      current?.cards.filter((c) => !incoming.cards.some((n) => n.id === c.id))
        .length || 0,
  };
}
