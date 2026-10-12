import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assessCombination,
  compileCombination,
  combinationRules,
  curatedCombinations,
} from "../src/combinations.ts";
import { activities } from "../src/catalog.ts";
import { eligible, semanticRank } from "../src/ranking.ts";
import {
  recommendationOrder,
  recordFeedback,
  emptyFeedback,
  compatibleSavedCard,
} from "../src/pocket.ts";
import { parseBackup } from "../src/backup.ts";
const tuple = (lens: string, action: string, trace: string) => ({
  lens,
  action,
  trace,
  constraint: "safe-one-spot",
});
test("module compatibility is insufficient: only four individually reviewed outputs compile, with stable unique identities", () => {
  const accepted: string[] = [];
  for (const lens of ["edges", "texture"])
    for (const action of ["compare", "trace-with-eyes"])
      for (const trace of [
        "one-line-contrast",
        "one-line-shape",
        "two-words",
      ]) {
        const s = tuple(lens, action, trace),
          verdict = assessCombination(s);
        if (verdict.allowed) accepted.push(compileCombination(s).id);
        else assert.throws(() => compileCombination(s));
      }
  assert.deepEqual(accepted.sort(), [
    "edge-compare",
    "edge-follow",
    "texture-pair",
    "texture-trace",
  ]);
  assert.equal(
    assessCombination(tuple("edges", "compare", "two-words")).allowed,
    false,
  );
  assert.equal(
    assessCombination(tuple("texture", "compare", "one-line-contrast")).allowed,
    false,
  );
  assert.equal(new Set(combinationRules.map((r) => r.reviewId)).size, 4);
});
test("unsafe substitutions, unknown modules, script/resource fields and coerced nonstrings cannot enter the compiler", () => {
  const base = tuple("edges", "compare", "one-line-contrast");
  for (const bad of [
    null,
    [],
    { ...base, constraint: "approach-water" },
    { ...base, action: "touch" },
    { ...base, gps: true },
    { ...base, script: "alert(1)" },
    { ...base, remoteUrl: "https://invalid.example" },
    { ...base, lens: "__proto__" },
    {
      ...base,
      lens: {
        toString() {
          throw Error("must not coerce");
        },
      },
    },
  ]) {
    assert.equal(assessCombination(bad).allowed, false);
    assert.throws(() => compileCombination(bad));
  }
  assert.ok(Object.isFrozen(combinationRules));
  assert.ok(combinationRules.every(Object.isFrozen));
});
test("shared safety and action modules form complete outputs without plants, light, walking, standing or GPS prerequisites", () => {
  for (const a of curatedCombinations) {
    assert.equal(a.steps.length, 3);
    assert.equal(a.cues?.length, 3);
    assert.match(a.steps[0], /seated or standing/);
    assert.match(a.steps[0], /do not move closer/);
    assert.match(a.steps[0], /stop and choose another note/);
    assert.match(a.steps[2], /untouched/);
    assert.deepEqual(a.requires, []);
    assert.ok(a.prompt.length > 20 && a.composition!.explanation.length > 50);
    for (const setting of ["street", "park", "garden", "water"] as const) {
      assert.ok(
        eligible({
          minutes: 5,
          setting,
          still: true,
          features: [],
          lens: a.lens,
        }).some((x) => x.id === a.id),
      );
      assert.ok(
        !eligible({ minutes: 4, setting, still: true }).some(
          (x) => x.id === a.id,
        ),
      );
      assert.ok(
        !eligible({ minutes: 20, setting, still: false, walk: true }).some(
          (x) => x.id === a.id,
        ),
      );
      assert.ok(
        !eligible({ minutes: 20, setting, still: true, walk: true }).some(
          (x) => x.id === a.id,
        ),
      );
    }
  }
  assert.equal(new Set(curatedCombinations.map((a) => a.steps[0])).size, 1);
  assert.equal(
    curatedCombinations.find((a) => a.id === "edge-follow")!.steps[2],
    curatedCombinations.find((a) => a.id === "texture-trace")!.steps[2],
  );
  const compiled = compileCombination(
    tuple("texture", "trace-with-eyes", "one-line-shape"),
  );
  compiled.steps[0] = "mutated caller output";
  compiled.settings.length = 0;
  assert.match(
    compileCombination(tuple("texture", "trace-with-eyes", "one-line-shape"))
      .steps[0],
    /safe spot/,
  );
  assert.equal(
    compileCombination(tuple("texture", "trace-with-eyes", "one-line-shape"))
      .settings.length,
    4,
  );
});
test("new surface variant cannot bypass same-family completion, set-aside or explicit repeat control", () => {
  const rows = activities
    .filter((a) => a.family === "surface-pair")
    .map((activity, i) => ({ activity, score: 0.9 - i * 0.1 }));
  assert.equal(rows.length, 2);
  const done = recordFeedback(emptyFeedback(), "texture-pair", "done");
  assert.deepEqual(recommendationOrder(rows, done), []);
  assert.equal(recommendationOrder(rows, done, true).length, 1);
  const skipped = recordFeedback(emptyFeedback(), "texture-trace", "skipped");
  assert.deepEqual(recommendationOrder(rows, skipped, true), []);
  assert.deepEqual(recordFeedback(skipped, "texture-pair", "done"), done);
  assert.deepEqual(
    rows.map((r) => r.score),
    [0.9, 0.8],
  );
});
test("model ranker sees the finite compiled catalog and keeps hard constraints; synthetic vectors test math only", () => {
  assert.equal(activities.length, 20);
  const vectors = activities.map((a) =>
    a.id === "texture-trace" ? [1, 0] : [0, 1],
  );
  assert.equal(
    semanticRank(
      {
        minutes: 5,
        setting: "water",
        still: true,
        lens: "texture",
        features: [],
      },
      [1, 0],
      vectors,
    )[0].activity.id,
    "texture-trace",
  );
  assert.ok(
    !semanticRank(
      {
        minutes: 5,
        setting: "water",
        still: false,
        walk: true,
        lens: "texture",
      },
      [1, 0],
      vectors,
    ).some((r) => r.activity.composition),
  );
});
test("accepted v9 notebook backup remains readable with original task version and bytes; module receipts are not imported activities", () => {
  const raw = readFileSync(
    new URL(
      "../evidence/backup-candidate/independent-backup-download.json",
      import.meta.url,
    ),
    "utf8",
  );
  const old = JSON.parse(raw),
    read = parseBackup(raw);
  assert.deepEqual(read.journal, old.journal);
  assert.equal(read.journal.entries[0].task.version, "2026-10-06.2");
  assert.equal(read.journal.entries[0].task.id, "edge-compare");
  assert.equal("composition" in read.journal.entries[0].task, false);
  assert.notEqual(
    activities.find((a) => a.id === "edge-compare")!.version,
    read.journal.entries[0].task.version,
  );
});
test("saved-state labels and reopening use the same ID plus version policy; old bytes remain data until explicit saving", () => {
  const current = activities.find((a) => a.id === "edge-compare")!;
  const old = { id: current.id, version: "2026-10-06.2" };
  const bytes = JSON.stringify(old);
  assert.equal(compatibleSavedCard(old, current), false);
  assert.equal(
    compatibleSavedCard({ id: current.id, version: current.version }, current),
    true,
  );
  assert.equal(compatibleSavedCard({ id: current.id }, current), true); // explicitly supported pre-version legacy shape
  for (const bad of [
    null,
    [],
    { id: "unknown" },
    { id: current.id, version: null },
    { id: current.id, version: 0 },
    { id: current.id, version: false },
    { id: current.id, version: "" },
  ])
    assert.equal(compatibleSavedCard(bad, current), false);
  assert.equal(JSON.stringify(old), bytes);
});
