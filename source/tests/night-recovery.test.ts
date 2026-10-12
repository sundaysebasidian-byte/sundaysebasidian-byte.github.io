import test from "node:test";
import assert from "node:assert/strict";
import {
  assertRecoverableChange,
  RecoveryLimitError,
} from "../src/recovery-guard.ts";
import { exportBackup, parseBackup, MAX_BACKUP_BYTES } from "../src/backup.ts";
import { emptyJournal, snapshot, type Journal } from "../src/journal.ts";
import { activities } from "../src/catalog.ts";
import { searchGuide, searchNotes, sortNotes } from "../src/local-tools.ts";
const now = "2026-10-09T18:00:00.000Z";
import { boundaryJournal } from "./browser/night-fixture.ts";
test("round9: a bounded text edit cannot lose complete JSON recovery, and oversized historical records can shrink", () => {
  const j = boundaryJournal(),
    before = JSON.stringify(j),
    next = structuredClone(j);
  next.entries[0].text = "界".repeat(200);
  assert.throws(() => assertRecoverableChange(j, next), RecoveryLimitError);
  assert.equal(JSON.stringify(j), before);
  const old = structuredClone(j);
  old.entries[0].text = "界".repeat(280);
  const shrinking = structuredClone(old);
  shrinking.entries[0].text = "界".repeat(270);
  assert.doesNotThrow(() => assertRecoverableChange(old, shrinking));
  assert.throws(() => assertRecoverableChange(old, old), RecoveryLimitError);
  assert.doesNotThrow(() => assertRecoverableChange(old, j));
  assert.deepEqual(parseBackup(exportBackup(j, now)).journal, j);
});
test("round11: literal guide search reaches steps, cues and prompts without changing source order or model candidates", () => {
  const a = {
    ...activities[0],
    title: "title",
    subtitle: "subtitle",
    tags: ["tag"],
    steps: ["Needle step", "b", "c"] as [string, string, string],
    cues: ["Needle cue", "b", "c"] as [string, string, string],
    prompt: "Needle prompt",
  };
  const raw = JSON.stringify(a);
  for (const q of ["needle step", "needle cue", "needle prompt"])
    assert.deepEqual(searchGuide([a], q), [a]);
  assert.deepEqual(searchGuide([a], "[.*]"), []);
  assert.equal(JSON.stringify(a), raw);
  assert.ok(
    searchGuide(activities, "Find softer").some((a) => a.id === "color-quest"),
  );
});
test("round12: notebook search finds explicit labels without inferring places or rewriting saved text", () => {
  const j = boundaryJournal();
  j.entries = j.entries.slice(0, 1);
  j.entries[0].scene = "water";
  j.entries[0].tags = ["texture"];
  j.entries[0].text = "plain";
  const raw = JSON.stringify(j);
  for (const q of ["Waterside", "texture", "Sound"])
    assert.equal(searchNotes(j.entries, q).length, 1);
  assert.equal(searchNotes(j.entries, "GPS").length, 0);
  assert.equal(JSON.stringify(j), raw);
});
test("round15: recently edited sorting uses updatedAt and stable source ties, preserving created-date order", () => {
  const j = boundaryJournal();
  j.entries = j.entries.slice(0, 3);
  j.entries[0].updatedAt = "2026-10-10T00:00:00.000Z";
  j.entries[1].createdAt = "2026-10-08T00:00:00.000Z";
  j.entries[1].updatedAt = "2026-10-10T00:00:00.000Z";
  const raw = JSON.stringify(j);
  assert.deepEqual(
    sortNotes(j.entries, "edited").map((n) => n.id),
    ["night-0", "night-1", "night-2"],
  );
  assert.deepEqual(
    sortNotes(j.entries, "newest").map((n) => n.id),
    ["night-0", "night-2", "night-1"],
  );
  assert.equal(JSON.stringify(j), raw);
});
test("round9 legacy shrinking validates every supported backup field before allowing an oversized repair", () => {
  const j = boundaryJournal();
  j.entries[0].text = "界".repeat(280);
  const invalid = structuredClone(j);
  invalid.entries[0].text = "界".repeat(260);
  (invalid.entries[0].task as any).remote = "https://invalid.example/";
  assert.throws(() => assertRecoverableChange(j, invalid), /unsupported/);
});
