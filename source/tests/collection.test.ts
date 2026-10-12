import { test } from "node:test";
import assert from "node:assert/strict";
import {
  collectionNotes,
  collectionSummary,
  sceneCounts,
  boundaryPair,
} from "../src/collection.ts";
import { selectedNoteText, sameSavedSelection } from "../src/note-output.ts";
import { emptyJournal, saveDiscovery, snapshot } from "../src/journal.ts";
import { activities } from "../src/catalog.ts";
const edge = activities.find((a) => a.id === "edge-compare")!;
let j = emptyJournal();
for (const [id, day, scene] of [
  ["z", "2026-10-08", ""],
  ["a", "2026-10-08", "park"],
  ["old", "2025-12-01", "park"],
])
  j = saveDiscovery(
    j,
    {
      id,
      text: id + " <script> & 中文",
      tags: [],
      task: snapshot(edge),
      markDone: false,
      ...(scene ? { scene: "park" as const } : {}),
    },
    day + "T00:00:00.000Z",
  );
test("collection counts unique UTC days and only explicit scene categories", () => {
  assert.deepEqual(collectionSummary(j.entries), {
    notes: 3,
    days: 2,
    lenses: 1,
    scenes: 1,
  });
  assert.equal(
    sceneCounts(j.entries).find((s) => s.scene === "unclassified")!.count,
    1,
  );
});
test("collection filters intersect without mutating notes or guessing legacy scenes", () => {
  const before = JSON.stringify(j);
  assert.equal(
    collectionNotes(j.entries, {
      lens: "edges",
      month: "2026-10",
      family: edge.family,
    }).length,
    2,
  );
  assert.equal(
    collectionNotes(j.entries, { lens: "sound", month: "2026-10", family: "" })
      .length,
    0,
  );
  assert.equal(JSON.stringify(j), before);
});
test("explicit boundary pair is stable on tied dates and needs distinct notes", () => {
  assert.deepEqual(boundaryPair(j.entries), ["old", "z"]);
  assert.deepEqual(boundaryPair([...j.entries].reverse()), ["old", "z"]);
  assert.equal(boundaryPair(j.entries.slice(0, 1)), null);
});
test("saved-selection guard normalizes property order but detects all saved content changes", () => {
  const a = j.entries.find((n) => n.id === "z")!;
  const reordered = {
    task: structuredClone(a.task),
    text: a.text,
    updatedAt: a.updatedAt,
    tags: [...a.tags],
    id: a.id,
    createdAt: a.createdAt,
  };
  assert.equal(sameSavedSelection([a], [reordered]), true);
  for (const mutation of [
    (n: typeof a) => (n.text = "different words"),
    (n: typeof a) => (n.updatedAt = "2026-10-09T00:00:00.000Z"),
    (n: typeof a) => (n.task.steps[1] = "Different stored instruction"),
    (n: typeof a) => (n.scene = "park"),
    (n: typeof a) => (n.tags = ["sound"]),
  ]) {
    const changed = structuredClone(a);
    mutation(changed);
    assert.equal(sameSavedSelection([a], [changed]), false);
  }
  assert.equal(sameSavedSelection([a], []), false);
});
test("selected readable output is bounded to explicit notes and retains literal text", () => {
  const text = selectedNoteText(
    [j.entries.find((n) => n.id === "z")!],
    "2026-10-08T00:00:00.000Z",
  );
  assert.match(text, /selected saved discoveries/);
  assert.match(text, /z <script> & 中文/);
  assert.doesNotMatch(text, /a <script>|old <script>/);
  assert.match(text, /cannot|restore your notebook/);
});
