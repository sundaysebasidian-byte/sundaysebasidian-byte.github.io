import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { activities } from "../src/catalog.ts";
import {
  reviewedPack,
  reviewedCard,
  parseCardPack,
  exportCardPack,
  planCardPack,
  MAX_PACK_BYTES,
  canonical,
} from "../src/card-pack.ts";
const clone = () => JSON.parse(JSON.stringify(reviewedPack()));
test("existing four-card example and browser export share exact validated content without extending the catalog", () => {
  const example = parseCardPack(
    readFileSync("docs/card-pack/visual-stationary.example.json", "utf8"),
  );
  assert.equal(canonical(example), canonical(reviewedPack()));
  assert.deepEqual(
    parseCardPack(exportCardPack(reviewedPack())),
    reviewedPack(),
  );
  assert.equal(activities.length, 20);
  assert.ok(example.cards.every(reviewedCard));
});
test("format, schema/content/module/profile versions and executable/resource fields at every layer reject", () => {
  const mutations = [
    (p: any) => (p.schema = 99),
    (p: any) => (p.format = "pocket-field-trip-notebook"),
    (p: any) => (p.compatibility.appSourceVersion = "0.2.0-rc.999"),
    (p: any) => (p.compatibility.moduleVersion = "new"),
    (p: any) => (p.compatibility.profile = "walk"),
    (p: any) => (p.cards[0].version = "new"),
    (p: any) => (p.script = "alert(1)"),
    (p: any) => (p.author.url = "https://example.invalid/"),
    (p: any) => (p.cards[0].html = "<script>"),
    (p: any) => (p.cards[0].composition.fetch = "https://example.invalid/"),
    (p: any) => (p.reviewClaim.approved = true),
  ];
  for (const mutate of mutations) {
    const p = clone();
    mutate(p);
    assert.throws(() => parseCardPack(JSON.stringify(p)));
  }
  assert.throws(() => parseCardPack('{"__proto__":{"polluted":true}}'));
  assert.equal(({} as any).polluted, undefined);
});
test("bounds reject UTF-8 bytes, deep nesting, malformed JSON and coerced nonstrings before storage", () => {
  assert.throws(
    () => parseCardPack("é".repeat(MAX_PACK_BYTES / 2 + 1)),
    /1 MiB/,
  );
  assert.throws(
    () => parseCardPack("[".repeat(9) + "0" + "]".repeat(9)),
    /nesting/,
  );
  for (const raw of ["{", "null", "[]"])
    assert.throws(() => parseCardPack(raw));
  const p = clone();
  p.cards[0].title = 123;
  assert.throws(() => parseCardPack(JSON.stringify(p)));
  const q = clone();
  q.cards[0].steps[0] = "x".repeat(701);
  assert.throws(() => parseCardPack(JSON.stringify(q)));
});
test("duplicate IDs, identity/lens/family mismatch, unsafe policy and unsupported complete tuples reject", () => {
  const mutations = [
    (p: any) => p.cards.push({ ...p.cards[0], title: "Other" }),
    (p: any) => (p.cards[0].family = "new-fresh-family"),
    (p: any) => (p.cards[0].id = "invented"),
    (p: any) => (p.cards[0].lens = "texture"),
    (p: any) => (p.cards[0].composition.constraint = "walk-closer"),
    (p: any) => (p.cards[0].composition.trace = "two-words"),
    (p: any) => (p.cards[0].still = false),
    (p: any) => (p.cards[0].requires = ["plant"]),
  ];
  for (const mutate of mutations) {
    const p = clone();
    mutate(p);
    assert.throws(() => parseCardPack(JSON.stringify(p)));
  }
});
test("edited prose and forged review declarations remain unreviewed, literal data with no catalog effect", () => {
  const before = canonical(activities);
  const p = clone();
  p.cards[0].steps[0] =
    '<img src="https://example.invalid/a" onerror="alert(1)">';
  p.cards[0].claimedSourceReviewId = "composition-01";
  const imported = parseCardPack(JSON.stringify(p));
  assert.equal(reviewedCard(imported.cards[0]), false);
  assert.equal(reviewedCard(imported.cards[1]), true);
  assert.equal(canonical(activities), before);
  const q = clone();
  q.cards[0].rationale = "All approved";
  assert.equal(reviewedCard(q.cards[0]), false);
});
test("whole-pack duplicate/conflict plans are order-insensitive for object keys, bounded, and never mutate either pack", () => {
  const a = reviewedPack(),
    b = clone(),
    before = canonical(a);
  assert.equal(planCardPack(a, b).duplicate, true);
  b.title = "Changed metadata";
  assert.equal(planCardPack(a, b).replacing, true);
  b.cards[0].title = "Changed text";
  b.cards.pop();
  assert.deepEqual(planCardPack(a, b), {
    duplicate: false,
    replacing: true,
    identical: 2,
    conflicts: 1,
    additions: 0,
    removed: 1,
  });
  assert.equal(canonical(a), before);
  assert.equal(planCardPack(null, a).additions, 4);
});

test("editing exported factory arrays cannot rewrite the trusted catalog or later review baseline", () => {
  const original = canonical(activities);
  const emitted = reviewedPack();
  emitted.cards[0].steps[0] = "Changed unsafe text";
  emitted.cards[0].tags[0] = "changed";
  emitted.cards[0].settings.pop();
  emitted.cards[0].cues[0] = "Changed cue";
  assert.equal(canonical(activities), original);
  assert.ok(reviewedPack().cards.every(reviewedCard));
  assert.equal(reviewedCard(emitted.cards[0]), false);
});
