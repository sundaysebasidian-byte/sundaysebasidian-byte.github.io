import { test } from "node:test";
import assert from "node:assert/strict";
import { activities } from "../src/catalog.ts";
import {
  emptyJournal,
  saveDiscovery,
  parseJournal,
  snapshot,
} from "../src/journal.ts";
import { exportBackup, parseBackup, planRestore } from "../src/backup.ts";
import { filteredNotes, validPair } from "../src/notebook-view.ts";
const task = snapshot(activities[0]);
const legacy = {
  schema: 1 as const,
  entries: [
    {
      id: "old",
      text: "Old synthetic observation",
      tags: [] as [],
      task,
      createdAt: "2026-10-05T23:59:00.000Z",
      updatedAt: "2026-10-05T23:59:00.000Z",
    },
  ],
  feedback: emptyJournal().feedback,
};
const input = {
  id: "new",
  text: "New synthetic observation",
  tags: [] as [],
  task,
  markDone: false,
};
const now = "2026-10-06T00:00:00.000Z";
test("legacy reads never infer scene or change original notes; explicit new save upgrades schema with optional user scene", () => {
  const raw = JSON.stringify(legacy);
  const loaded = parseJournal(raw);
  assert.deepEqual(loaded, legacy);
  const next = saveDiscovery(loaded, { ...input, scene: "park" }, now);
  assert.equal(next.schema, 2);
  assert.equal(next.entries[0].scene, "park");
  assert.deepEqual(next.entries[1], legacy.entries[0]);
  assert.equal(JSON.stringify(legacy), raw);
  assert.deepEqual(parseJournal(JSON.stringify(next)), next);
  assert.equal(
    "scene" in saveDiscovery(emptyJournal(), input, now).entries[0],
    false,
  );
});
test("scene editing and clearing preserve task, original creation date and completion; invalid scene rejects", () => {
  const j = saveDiscovery(legacy, { ...input, scene: "water" }, now);
  const edited = saveDiscovery(
    j,
    { ...input, text: "Edited synthetic observation" },
    "2026-10-07T00:00:00.000Z",
  );
  assert.equal(edited.entries[0].scene, "water");
  assert.equal(edited.entries[0].createdAt, now);
  assert.deepEqual(edited.feedback, j.feedback);
  assert.deepEqual(edited.entries[0].task, j.entries[0].task);
  assert.equal(
    "scene" in saveDiscovery(edited, { ...input, scene: null }, now).entries[0],
    false,
  );
  assert.throws(() =>
    saveDiscovery(j, { ...input, scene: "GPS" as "park" }, now),
  );
  for (const scene of [null, "", "GPS", 1, {}, []]) {
    const changed = structuredClone(j);
    (changed.entries[0] as any).scene = scene;
    assert.throws(() => parseJournal(JSON.stringify(changed)));
  }
  assert.throws(() => parseJournal(JSON.stringify({ ...j, schema: 1 })));
});
test("old v1 and new v2 backups roundtrip and merge without classifying legacy notes; mismatched contracts reject", () => {
  const old = parseBackup(exportBackup(legacy, now));
  assert.equal(old.version, 1);
  assert.deepEqual(old.journal, legacy);
  const j = saveDiscovery(legacy, { ...input, scene: "garden" }, now);
  const fresh = parseBackup(exportBackup(j, now));
  assert.equal(fresh.version, 2);
  assert.deepEqual(fresh.journal, j);
  assert.deepEqual(planRestore(legacy, fresh, "merge").next.entries, [
    legacy.entries[0],
    j.entries[0],
  ]);
  assert.deepEqual(planRestore(j, old, "replace").next.entries, legacy.entries);
  assert.equal(planRestore(j, old, "replace").next.schema, 2);
  assert.throws(() => parseBackup(JSON.stringify({ ...fresh, version: 1 })));
  assert.throws(() => parseBackup(JSON.stringify({ ...old, version: 2 })));
  assert.throws(() =>
    parseBackup(
      JSON.stringify({
        ...old,
        journal: {
          ...legacy,
          entries: [{ ...legacy.entries[0], scene: "park" }],
        },
      }),
    ),
  );
});
test("date and scene filters are inclusive UTC creation dates, including unclassified; invalid ranges give no results", () => {
  const j = saveDiscovery(legacy, { ...input, scene: "street" }, now);
  const any = { tag: "any", scene: "any", from: "", to: "" };
  assert.equal(filteredNotes(j.entries, any).length, 2);
  assert.deepEqual(
    filteredNotes(j.entries, { ...any, scene: "unclassified" }),
    legacy.entries,
  );
  assert.deepEqual(
    filteredNotes(j.entries, {
      ...any,
      scene: "street",
      from: "2026-10-06",
      to: "2026-10-06",
    }),
    [j.entries[0]],
  );
  assert.equal(
    filteredNotes(j.entries, { ...any, from: "2026-10-07", to: "2026-10-05" })
      .length,
    0,
  );
  assert.equal(filteredNotes(j.entries, { ...any, tag: "edges" }).length, 0);
});
test("comparison requires two visible distinct IDs and preserves chosen order even when chronology is reversed", () => {
  const j = saveDiscovery(legacy, { ...input, scene: "park" }, now);
  assert.deepEqual(validPair(j.entries, "new", "old"), j.entries);
  for (const ids of [
    ["", "old"],
    ["new", "new"],
    ["new", "missing"],
  ])
    assert.equal(validPair(j.entries, ids[0], ids[1]), null);
  assert.equal(validPair([j.entries[0]], "new", "old"), null);
});
