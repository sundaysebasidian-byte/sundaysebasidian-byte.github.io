import { test } from "node:test";
import assert from "node:assert/strict";
import { activities } from "../src/catalog.ts";
import { eligible, semanticRank } from "../src/ranking.ts";
import {
  emptyFeedback,
  parseFeedback,
  recordFeedback,
  recommendationOrder,
  pocketCues,
} from "../src/pocket.ts";
const c = { minutes: 5, setting: "street" as const, still: false };
test("explicit walk/one-spot/details obey actual capabilities, including contradictions", () => {
  for (const setting of ["street", "park", "garden", "water"] as const) {
    assert.ok(eligible({ ...c, setting, walk: true }).length);
    assert.ok(eligible({ ...c, setting, walk: true }).every((a) => !a.still));
    assert.deepEqual(eligible({ ...c, setting, still: true, walk: true }), []);
  }
  assert.ok(
    !eligible(c).some((a) => a.id === "shadow-study" || a.id === "leaf-story"),
  );
  assert.ok(
    eligible({ ...c, features: ["light"] }).some(
      (a) => a.id === "shadow-study",
    ),
  );
  assert.ok(
    !eligible({ ...c, features: ["light"] }).some((a) => a.id === "leaf-story"),
  );
  assert.ok(
    eligible({ ...c, features: ["plant"] }).some((a) => a.id === "leaf-story"),
  );
});
test("feedback accepts only unique authored IDs and three recent done, never extra personal fields", () => {
  assert.deepEqual(parseFeedback("{broken"), emptyFeedback());
  const f = parseFeedback(
    JSON.stringify({
      done: [
        "sound-map",
        "sound-map",
        "sky-pause",
        "leaf-story",
        "small-loop",
        "private words",
      ],
      skipped: ["water-minute", 23, "private words"],
      intent: "private words",
      date: "yesterday",
    }),
  );
  assert.deepEqual(f, {
    done: ["sound-map", "sky-pause", "leaf-story"],
    skipped: ["water-minute"],
  });
  assert.equal(JSON.stringify(f).includes("private"), false);
  assert.deepEqual(recordFeedback(f, "untrusted", "done"), f);
  const moved = recordFeedback(f, "water-minute", "done");
  assert.equal(moved.done.length, 3);
  assert.deepEqual(moved.skipped, []);
});
test("recent families are excluded without altering scores; repeats need explicit opt-in", () => {
  const rows = [
    { activity: activities[0], score: 0.52 },
    { activity: activities[2], score: 0.49 },
    { activity: activities[3], score: 0.4 },
  ];
  const sorted = recommendationOrder(rows, {
    done: [rows[0].activity.id],
    skipped: [],
  });
  assert.equal(sorted[0], rows[1]);
  assert.equal(rows[0].score, 0.52);
  assert.equal(
    recommendationOrder(rows, {
      done: [rows[0].activity.id, rows[1].activity.id],
      skipped: [],
    })[0],
    rows[2],
  );
  assert.equal(
    recommendationOrder(rows, { done: [], skipped: [rows[0].activity.id] })[0],
    rows[1],
  );
  assert.deepEqual(
    recommendationOrder(rows, {
      done: [],
      skipped: rows.map((r) => r.activity.id),
    }),
    [],
  );
  const weak = rows.map((r, i) => ({ ...r, score: 0.31 - i * 0.02 }));
  assert.equal(
    recommendationOrder(weak, { done: [weak[0].activity.id], skipped: [] })[0],
    weak[1],
  );
  assert.equal(
    recommendationOrder(
      weak,
      { done: [weak[0].activity.id], skipped: [] },
      true,
    )[0],
    weak[0],
  );
});
test("completing a sibling clears its whole set-aside family and requires explicit repeat opt-in", () => {
  const rows = activities
    .filter((a) => a.family === "boundaries")
    .map((activity, i) => ({ activity, score: 0.7 - i * 0.02 }));
  const skipped = recordFeedback(emptyFeedback(), "edge-compare", "skipped");
  assert.deepEqual(recommendationOrder(rows, skipped, true), []);
  const done = recordFeedback(skipped, "edge-follow", "done");
  assert.deepEqual(done, { done: ["edge-follow"], skipped: [] });
  assert.deepEqual(recommendationOrder(rows, done), []);
  assert.equal(recommendationOrder(rows, done, true).length, 1);
  assert.equal(rows[0].score, 0.7);
});
test("every card has exactly three short original pocket cues; raw ranking remains semantic", () => {
  for (const a of activities) {
    assert.equal(pocketCues[a.id].length, 3);
    assert.ok(pocketCues[a.id].every((s) => s.length <= 24));
  }
  const vectors = activities.map((a) =>
    a.id === "shadow-study" ? [1, 0] : [0, 1],
  );
  assert.ok(
    !semanticRank(c, [1, 0], vectors).some(
      (r) => r.activity.id === "shadow-study",
    ),
  );
  assert.equal(
    semanticRank({ ...c, features: ["light"] }, [1, 0], vectors)[0].activity.id,
    "shadow-study",
  );
});
