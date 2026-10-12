import test from "node:test";
import assert from "node:assert/strict";
import { committedRecovery } from "../src/android-journal.ts";
import {
  emptyJournal,
  saveDiscovery,
  snapshot,
  noteTags,
} from "../src/journal.ts";
import { activities } from "../src/catalog.ts";
const task = snapshot(activities[0]);
const trip = JSON.stringify({
  schema: 1,
  token: "11111111-1111-4111-8111-111111111111",
  taskId: task.id,
  taskVersion: task.version,
});
const draft = {
  schema: 1,
  id: "22222222-2222-4222-8222-222222222222",
  task,
  text: "  a   quiet leaf  ",
  tags: [],
  editing: false,
  originalUpdatedAt: null,
  noteDone: true,
  tripRaw: trip,
};
const saved = saveDiscovery(
  emptyJournal(),
  { id: draft.id, task, text: draft.text, tags: [], markDone: true },
  "2026-10-11T20:00:00.000Z",
);
test("committed normalized discovery clears its exact recovery and linked trip", () => {
  assert.deepEqual(
    committedRecovery(JSON.stringify(saved), JSON.stringify(draft), trip),
    { draft: true, trip: true },
  );
});
test("changed words, immutable task prose, tags or a newer edit remain recoverable", () => {
  for (const change of [
    { text: "new unsaved words" },
    { task: { ...task, title: "Changed task prose" } },
    { tags: [noteTags[0]] },
    { editing: true, originalUpdatedAt: saved.entries[0].updatedAt },
  ])
    assert.deepEqual(
      committedRecovery(
        JSON.stringify(saved),
        JSON.stringify({ ...draft, ...change }),
        trip,
      ),
      { draft: false, trip: false },
    );
});
test("exact completed recovery never removes a different trip token", () => {
  assert.deepEqual(
    committedRecovery(
      JSON.stringify(saved),
      JSON.stringify(draft),
      trip.replace("11111111", "33333333"),
    ),
    { draft: true, trip: false },
  );
});
test("updated editing receipt clears exact old recovery while retaining any trip", () => {
  assert.deepEqual(
    committedRecovery(
      JSON.stringify(saved),
      JSON.stringify({
        ...draft,
        editing: true,
        originalUpdatedAt: "2026-10-11T19:00:00.000Z",
      }),
      trip,
    ),
    { draft: true, trip: false },
  );
});
