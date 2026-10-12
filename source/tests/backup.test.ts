import { test } from "node:test";
import assert from "node:assert/strict";
import { activities } from "../src/catalog.ts";
import {
  emptyJournal,
  parseJournal,
  saveDiscovery,
  snapshot,
  MAX_DISCOVERIES,
} from "../src/journal.ts";
import {
  exportBackup,
  parseBackup,
  planRestore,
  MAX_BACKUP_BYTES,
} from "../src/backup.ts";
const now = "2026-10-06T20:00:00.000Z";
const note = (id = "first", line = "A straight edge met a rough leaf.") =>
  saveDiscovery(
    emptyJournal(),
    {
      id,
      text: line,
      tags: ["edges"],
      task: snapshot(activities.find((a) => a.id === "edge-compare")!),
      markDone: true,
    },
    now,
  );
const backup = (journal = note()) => parseBackup(exportBackup(journal, now));
test("legacy family conflicts normalize to set-aside before export while discoveries remain intact", () => {
  const legacy = note();
  legacy.feedback = {
    done: ["water-minute", "sound-map"],
    skipped: ["water-rhythm"],
  };
  const loaded = parseJournal(JSON.stringify(legacy));
  assert.deepEqual(loaded.entries, legacy.entries);
  assert.deepEqual(loaded.feedback, {
    done: ["sound-map"],
    skipped: ["water-rhythm"],
  });
  assert.deepEqual(parseBackup(exportBackup(loaded, now)).journal, loaded);
});
test("generated backup roundtrips all bounded note data and explicit preferences without intention fields", () => {
  const j = note();
  const raw = exportBackup(j, now);
  assert.deepEqual(parseBackup(raw).journal, j);
  assert.equal(raw.includes('"intent"'), false);
  assert.equal(
    parseBackup(exportBackup(emptyJournal(), now)).journal.entries.length,
    0,
  );
});
test("format/schema/version and unknown executable or resource fields are rejected, never defaulted to empty", () => {
  const original = backup();
  for (const edit of [
    (b: any) => {
      b.version = 42;
    },
    (b: any) => {
      b.format = "other-app";
    },
    (b: any) => {
      b.journal.schema = 42;
    },
    (b: any) => {
      b.journal.entries[0].task.remoteUrl = "https://invalid.example/model";
    },
    (b: any) => {
      b.journal.entries[0].script = "alert(1)";
    },
    (b: any) => {
      b.journal.entries[0].task.steps = "not three steps";
    },
  ]) {
    const changed = structuredClone(original);
    edit(changed);
    assert.throws(() => parseBackup(JSON.stringify(changed)));
  }
  assert.throws(() => parseBackup('{"__proto__":{"polluted":true}}'));
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
  assert.deepEqual(original, backup());
});
test("date type/calendar and per-field limits are validated before import", () => {
  for (const edit of [
    (b: any) => {
      b.journal.entries[0].createdAt = 1;
    },
    (b: any) => {
      b.journal.entries[0].updatedAt = "2026-02-31T00:00:00.000Z";
    },
    (b: any) => {
      b.exportedAt = "2026-02-31T00:00:00.000Z";
    },
    (b: any) => {
      b.journal.entries[0].text = "x".repeat(281);
    },
    (b: any) => {
      b.journal.entries[0].tags = ["edges", "light", "sound", "texture"];
    },
    (b: any) => {
      b.journal.entries[0].task.settings = ["street", "street"];
    },
    (b: any) => {
      b.journal.entries[0].task.requires = ["plant", "plant"];
    },
  ]) {
    const b = backup();
    edit(b);
    assert.throws(() => parseBackup(JSON.stringify(b)));
  }
});
test("duplicate note IDs, excess notes and invalid/conflicting preferences are rejected", () => {
  for (const edit of [
    (b: any) => {
      b.journal.entries.push(b.journal.entries[0]);
    },
    (b: any) => {
      b.journal.entries = Array.from({ length: 101 }, (_, i) => ({
        ...b.journal.entries[0],
        id: String(i),
      }));
    },
    (b: any) => {
      b.journal.feedback.done = ["unknown-task"];
    },
    (b: any) => {
      b.journal.feedback.done = ["edge-compare", "edge-follow"];
    },
    (b: any) => {
      b.journal.feedback.skipped = ["edge-follow"];
    },
  ]) {
    const b = backup();
    edit(b);
    assert.throws(() => parseBackup(JSON.stringify(b)));
  }
});
test("merge keeps existing same-ID records even when imported dates are newer; inputs stay unchanged", () => {
  const current = note();
  const incoming = saveDiscovery(
    note(),
    {
      id: "first",
      text: "Changed backup text.",
      tags: [],
      task: snapshot(activities[0]),
      markDone: false,
    },
    "2026-10-07T00:00:00.000Z",
  );
  incoming.entries.push({ ...incoming.entries[0], id: "second" });
  incoming.feedback = { done: ["sound-map"], skipped: [] };
  const before = JSON.stringify({ current, incoming });
  const plan = planRestore(current, backup(incoming), "merge");
  assert.equal(plan.stats.conflicts, 1);
  assert.equal(plan.stats.additions, 1);
  assert.deepEqual(plan.next.entries[0], current.entries[0]);
  assert.deepEqual(plan.next.feedback, current.feedback);
  assert.equal(JSON.stringify({ current, incoming }), before);
  assert.equal(planRestore(current, backup(), "merge").stats.duplicates, 1);
});
test("replace swaps discoveries but preserves preferences by default; preference restoration is explicit", () => {
  const current = note("current"),
    incoming = note("imported");
  incoming.feedback = { done: ["sound-map"], skipped: ["sky-pause"] };
  const normal = planRestore(current, backup(incoming), "replace");
  assert.equal(normal.stats.removed, 1);
  assert.deepEqual(normal.next.entries, incoming.entries);
  assert.deepEqual(normal.next.feedback, current.feedback);
  assert.deepEqual(
    planRestore(current, backup(incoming), "replace", true).next.feedback,
    incoming.feedback,
  );
  assert.deepEqual(
    planRestore(current, backup(emptyJournal()), "replace").next.entries,
    [],
  );
});
test("merge overflow fails atomically; idempotent import at capacity does not prune", () => {
  const current = note();
  current.entries = Array.from({ length: MAX_DISCOVERIES }, (_, i) => ({
    ...current.entries[0],
    id: "existing-" + i,
  }));
  const before = JSON.stringify(current);
  assert.throws(
    () => planRestore(current, backup(note("new")), "merge"),
    /100/,
  );
  assert.equal(JSON.stringify(current), before);
  assert.equal(
    planRestore(current, backup(current), "merge").next.entries.length,
    100,
  );
  assert.equal(
    planRestore(current, backup(note("new")), "replace").next.entries.length,
    1,
  );
});
test("script-looking prose and foreign historical snapshots remain literal data and never change the catalog", () => {
  const count = activities.length;
  const j = note(
    "foreign",
    '<img src="https://invalid.example" onerror="alert(1)">',
  );
  j.entries[0].task.id = "foreign-task";
  j.entries[0].task.version = "old-snapshot";
  const restored = planRestore(emptyJournal(), backup(j), "merge").next;
  assert.deepEqual(restored.entries, j.entries);
  assert.equal(activities.length, count);
  assert.equal(
    activities.some((a) => a.id === "foreign-task"),
    false,
  );
});
test("UTF-8 byte cap and restore-boundary version validation reject oversized or forged inputs", () => {
  assert.throws(
    () => parseBackup("好".repeat(Math.ceil(MAX_BACKUP_BYTES / 3))),
    /1 MiB/,
  );
  assert.throws(() => parseBackup("{"));
  const b = backup();
  (b as { version: number }).version = 42;
  assert.throws(() => planRestore(emptyJournal(), b, "merge"));
});

test("two valid backups cannot merge into a notebook that loses complete JSON recovery", () => {
  const make = (prefix: string) => {
    const j = note();
    j.entries = Array.from({ length: 50 }, (_, i) => ({
      ...structuredClone(j.entries[0]),
      id: `${prefix}-${i}`,
      task: {
        ...structuredClone(j.entries[0].task),
        steps: Array(3).fill("\u0001".repeat(600)) as [string, string, string],
      },
    }));
    return parseBackup(exportBackup(j, now)).journal;
  };
  const current = make("current"),
    incoming = backup(make("incoming"));
  const before = JSON.stringify({ current, incoming });
  for (const preferences of [false, true])
    assert.throws(
      () => planRestore(current, incoming, "merge", preferences),
      /Restored notebook.*1 MiB.*Nothing was changed/,
    );
  assert.equal(JSON.stringify({ current, incoming }), before);
  const replacement = planRestore(current, incoming, "replace");
  assert.deepEqual(
    parseBackup(exportBackup(replacement.next, now)).journal,
    replacement.next,
  );
  const duplicate = planRestore(current, backup(current), "merge");
  assert.equal(duplicate.stats.additions, 0);
  assert.deepEqual(duplicate.next, current);
  // A notebook created by the older defect can still be repaired by explicitly
  // replacing it with a recoverable file; the change must not lock every write.
  const oversized = {
    ...current,
    entries: [...current.entries, ...incoming.journal.entries],
  };
  const repaired = planRestore(oversized, incoming, "replace");
  assert.deepEqual(
    parseBackup(exportBackup(repaired.next, now)).journal,
    incoming.journal,
  );
});

test("restore byte checks use the final chosen preferences rather than only the incoming file", () => {
  const incoming = note();
  incoming.feedback = { done: [], skipped: [] };
  incoming.entries = Array.from({ length: 100 }, (_, i) => ({
    ...structuredClone(incoming.entries[0]),
    id: `boundary-${i}`,
    task: {
      ...structuredClone(incoming.entries[0].task),
      steps: ["x", "x", "x"],
    },
  }));
  const size = () =>
    new TextEncoder().encode(
      JSON.stringify({
        format: "pocket-field-trip-notebook",
        version: 1,
        exportedAt: now,
        journal: incoming,
      }),
    ).byteLength;
  // Fill bounded snapshot fields to an actual escaped-byte boundary, then use
  // ordinary one-byte prose to leave only eight bytes of envelope headroom.
  for (const n of incoming.entries)
    for (let i = 0; i < 3; i++) {
      const count = Math.min(
        599,
        Math.floor((MAX_BACKUP_BYTES - 8 - size()) / 6),
      );
      n.task.steps[i] += "\u0001".repeat(Math.max(0, count));
    }
  const remaining = MAX_BACKUP_BYTES - 8 - size();
  const short = incoming.entries.find(
    (n) => n.task.steps[0].length + remaining <= 600,
  )!;
  short.task.steps[0] += "x".repeat(remaining);
  assert.equal(size(), MAX_BACKUP_BYTES - 8);
  const file = backup(incoming),
    current = note("current");
  const before = JSON.stringify(current);
  assert.throws(() => planRestore(current, file, "replace"), /1 MiB/);
  const plan = planRestore(current, file, "replace", true);
  assert.deepEqual(
    parseBackup(exportBackup(plan.next, now)).journal,
    plan.next,
  );
  assert.equal(JSON.stringify(current), before);
});
