import { test } from "node:test";
import assert from "node:assert/strict";
import { activities } from "../src/catalog.ts";
import {
  eligible,
  dot,
  semanticRank,
  keywordRank,
  weakMatch,
} from "../src/ranking.ts";
test("all setting/time/still combinations respect hard constraints", () => {
  for (const minutes of [5, 10, 20])
    for (const setting of ["street", "park", "garden", "water"] as const)
      for (const still of [false, true]) {
        const rows = eligible({ minutes, setting, still });
        assert.ok(rows.length);
        for (const a of rows) {
          assert.ok(a.minutes <= minutes);
          assert.ok(a.settings.includes(setting));
          assert.ok(!still || a.still);
        }
      }
});
test("every original activity has exactly three steps and unique identity", () => {
  assert.equal(new Set(activities.map((a) => a.id)).size, activities.length);
  for (const a of activities) {
    assert.equal(a.steps.length, 3);
    assert.ok(a.steps.every((s) => s.length > 20));
  }
});
test("semantic order comes from supplied vectors, not keyword tags or random", () => {
  const vectors = activities.map((a) =>
    a.id === "sky-pause" ? [1, 0] : [0, 1],
  );
  const ranked = semanticRank(
    { minutes: 5, setting: "street", still: true },
    [1, 0],
    vectors,
  );
  assert.equal(ranked[0].activity.id, "sky-pause");
  assert.equal(ranked[0].score, 1);
});
test("invalid embeddings fail visibly", () => {
  assert.throws(() => dot([1], [1, 2]));
  assert.throws(() =>
    semanticRank({ minutes: 5, setting: "street", still: false }, [1], []),
  );
});
test("keyword baseline uses exact tag words and deterministic tie ordering", () => {
  const c = { minutes: 10, setting: "park" as const, still: false };
  const first = keywordRank(c, "birds song");
  assert.equal(first[0].activity.id, "bird-listen");
  assert.deepEqual(keywordRank(c, "foobar"), keywordRank(c, "foobar"));
  assert.ok(keywordRank(c, "walking").every((r) => r.score === 0));
});
test("weak-match guard rejects nonfinite and below-boundary scores", () => {
  assert.equal(weakMatch(NaN), true);
  assert.equal(weakMatch(Infinity), true);
  assert.equal(weakMatch(0.299), true);
  assert.equal(weakMatch(0.3), false);
});
test("five-minute movement exists but never bypasses one-spot constraints", () => {
  const c = { minutes: 5, setting: "street" as const, still: false };
  assert.ok(eligible(c).some((a) => a.id === "small-loop"));
  assert.ok(
    !eligible({ ...c, still: true }).some((a) => a.id === "small-loop"),
  );
});
