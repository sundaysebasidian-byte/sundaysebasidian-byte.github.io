import { test } from "node:test";
import assert from "node:assert/strict";
import { activities } from "../src/catalog.ts";
import { eligible } from "../src/ranking.ts";
import { combinationRules } from "../src/lenses.ts";
import { recommendationOrder } from "../src/pocket.ts";
import {
  emptyJournal,
  parseJournal,
  snapshot,
  saveDiscovery,
  removeDiscovery,
  restoreDiscovery,
  MAX_DISCOVERIES,
} from "../src/journal.ts";
const task = snapshot(activities.find((a) => a.id === "edge-compare")!);
const now = "2026-10-06T20:00:00.000Z";
const add = (j = emptyJournal()) =>
  saveDiscovery(
    j,
    {
      id: "note-1",
      text: "The rough edge interrupted the smooth one.",
      tags: ["edges", "texture"],
      task,
      markDone: true,
    },
    now,
  );
test("one atomic document contains discovery snapshot and explicit completion; no intent fields", () => {
  const j = add();
  assert.equal(j.entries.length, 1);
  assert.equal(j.feedback.done[0], task.id);
  assert.deepEqual(parseJournal(JSON.stringify(j)), j);
  assert.equal("intent" in j.entries[0], false);
  assert.equal(j.entries[0].task.steps.length, 3);
});
test("editing preserves original snapshot/date and does not complete again; delete undo keeps completion order", () => {
  const j = add();
  const next = saveDiscovery(
    j,
    {
      id: "note-1",
      text: "A leaf broke the edge.",
      tags: ["change"],
      task: snapshot(activities[0]),
      markDone: true,
    },
    "2026-10-07T00:00:00Z",
  );
  assert.deepEqual(next.feedback, j.feedback);
  assert.deepEqual(next.entries[0].task, j.entries[0].task);
  assert.equal(next.entries[0].createdAt, now);
  const removed = removeDiscovery(next, "note-1");
  assert.equal(removed.entries.length, 0);
  assert.deepEqual(removed.feedback, j.feedback);
  assert.deepEqual(restoreDiscovery(removed, next.entries[0], 0), next);
});
test("unsupported/corrupt notebook formats are rejected rather than silently replaced", () => {
  assert.throws(() => parseJournal("{"));
  assert.throws(() => parseJournal(JSON.stringify({ ...add(), schema: 42 })));
  const j = add();
  j.entries[0].task.steps = [] as unknown as typeof task.steps;
  assert.throws(() => parseJournal(JSON.stringify(j)));
  assert.throws(() =>
    parseJournal(
      JSON.stringify({
        ...add(),
        entries: [add().entries[0], add().entries[0]],
      }),
    ),
  );
});
test("bounded notes/tags reject overflow without pruning or modifying prior records", () => {
  assert.throws(() =>
    saveDiscovery(
      emptyJournal(),
      { id: "x", text: "x".repeat(281), tags: [], task, markDone: false },
      now,
    ),
  );
  assert.throws(() =>
    saveDiscovery(
      emptyJournal(),
      {
        id: "x",
        text: "hello",
        tags: ["light", "sound", "texture", "change"],
        task,
        markDone: false,
      },
      now,
    ),
  );
  const j = add();
  j.entries = Array.from({ length: MAX_DISCOVERIES }, (_, i) => ({
    ...j.entries[0],
    id: "n" + i,
  }));
  const before = JSON.stringify(j);
  assert.throws(() => add(j));
  assert.equal(JSON.stringify(j), before);
});
test("Lens whitelist only creates complete compatible reviewed outputs; recent family excludes both variants", () => {
  for (const rule of combinationRules) {
    const a = activities.find((a) => a.id === rule.id)!;
    assert.equal(a.steps.length, 3);
    assert.equal(a.lens, rule.lens);
    for (const setting of a.settings)
      assert.ok(
        eligible({ minutes: 5, setting, still: true, lens: a.lens }).some(
          (x) => x.id === a.id,
        ),
      );
    assert.ok(
      !eligible({
        minutes: 5,
        setting: "street",
        still: false,
        walk: true,
        lens: a.lens,
      }).some((x) => x.id === a.id),
    );
  }
  const rows = activities
    .filter((a) => a.family === "boundaries")
    .map((activity, i) => ({ activity, score: 0.7 - i * 0.02 }));
  assert.equal(
    recommendationOrder(rows, { done: ["edge-compare"], skipped: [] }).length,
    0,
  );
  assert.equal(
    recommendationOrder(rows, { done: ["edge-compare"], skipped: [] }, true)
      .length,
    1,
  );
});
