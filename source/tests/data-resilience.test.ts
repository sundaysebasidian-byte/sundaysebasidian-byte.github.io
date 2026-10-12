import test from "node:test";
import assert from "node:assert/strict";
import { emptyJournal, saveDiscovery, snapshot } from "../src/journal.ts";
import { activities } from "../src/catalog.ts";
import { exportBackup, parseBackup, MAX_BACKUP_BYTES } from "../src/backup.ts";

test("accepted compact backups at capacity remain exportable when pretty formatting exceeds the byte limit", () => {
  const now = "2026-10-08T15:00:00.000Z";
  const journal = saveDiscovery(
    emptyJournal(),
    {
      id: "boundary",
      text: "B",
      tags: [],
      task: snapshot(activities[0]),
      markDone: false,
    },
    now,
  );
  Object.assign(journal.entries[0].task, {
    id: "historical",
    title: "T",
    version: "v0",
    prompt: "P",
    cues: ["x", "x", "x"],
    settings: ["street"],
    requires: [],
  });
  journal.entries[0].task.steps = [
    "\u0001".repeat(550),
    "\u0001".repeat(550),
    "\u0001".repeat(550),
  ];
  journal.entries = Array.from({ length: 100 }, (_, i) => ({
    ...journal.entries[0],
    id: `boundary-${i}`,
  }));
  const backup = {
    format: "pocket-field-trip-notebook",
    version: 2,
    exportedAt: now,
    journal,
  };
  const compact = JSON.stringify(backup);
  assert.ok(Buffer.byteLength(compact) <= MAX_BACKUP_BYTES);
  assert.ok(
    Buffer.byteLength(JSON.stringify(backup, null, 2)) > MAX_BACKUP_BYTES,
  );
  const incoming = parseBackup(compact);
  const before = JSON.stringify(incoming);
  const exported = exportBackup(incoming.journal, now);
  assert.ok(Buffer.byteLength(exported) <= MAX_BACKUP_BYTES);
  assert.deepEqual(parseBackup(exported).journal, journal);
  assert.equal(JSON.stringify(incoming), before);
  journal.entries[0].task.steps = [
    "\u0001".repeat(600),
    "\u0001".repeat(600),
    "\u0001".repeat(600),
  ];
  journal.entries = journal.entries.map((n) => ({
    ...n,
    task: journal.entries[0].task,
  }));
  const oversizedBefore = JSON.stringify(journal);
  assert.throws(() => exportBackup(journal, now), /1 MiB/);
  assert.equal(JSON.stringify(journal), oversizedBefore);
});
