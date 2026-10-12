import test from "node:test";
import assert from "node:assert/strict";
import { activities } from "../src/catalog.ts";
import { snapshot } from "../src/journal.ts";
import {
  parseAndroidDraft,
  keepAndroidDraft,
  type AndroidDraft,
} from "../src/android-draft.ts";
const draft: AndroidDraft = {
  schema: 1,
  id: "test-draft",
  task: snapshot(activities[0]),
  text: "A small shadow",
  tags: ["light"],
  editing: false,
  originalUpdatedAt: null,
  noteDone: false,
  tripRaw: null,
};
const raw = (change: object = {}) => JSON.stringify({ ...draft, ...change });
test("recovery retains authored task snapshot and unfinished writing", () => {
  assert.deepEqual(parseAndroidDraft(raw()), draft);
  assert.equal(parseAndroidDraft(raw({ text: "" }))?.text, "");
});
test("unsupported recovery versions and oversized text are preserved by rejection", () => {
  assert.equal(parseAndroidDraft(raw({ schema: 2 })), null);
  assert.equal(parseAndroidDraft(raw({ text: "x".repeat(281) })), null);
  assert.equal(parseAndroidDraft("x".repeat(16001)), null);
});
test("invalid tags, scene and snapshot cannot become a discovery", () => {
  for (const change of [
    { tags: ["gps"] },
    { scene: "home" },
    { task: { ...draft.task, steps: [] } },
    { editing: "false" },
    { noteDone: 1 },
    { tripRaw: "{}" },
  ])
    assert.equal(parseAndroidDraft(raw(change)), null);
});
test("a recovered draft keeps its original exact trip token", () => {
  const tripRaw = JSON.stringify({
    schema: 1,
    token: "12345678-1234-1234-1234-123456789012",
    taskId: activities[0].id,
    taskVersion: activities[0].version,
  });
  assert.equal(parseAndroidDraft(raw({ tripRaw }))?.tripRaw, tripRaw);
});
test("verified draft write and removal protect an earlier copy", () => {
  let value: string | null = null;
  const storage = {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v;
    },
    removeItem: () => {
      value = null;
    },
  };
  const kept = keepAndroidDraft(storage, null, draft);
  assert.equal(kept, value);
  assert.throws(() => keepAndroidDraft(storage, null, null), /changed/);
  assert.equal(value, kept);
  assert.equal(keepAndroidDraft(storage, kept, null), null);
});
test("ignored writes and denied reads cannot claim recovery", () => {
  assert.throws(
    () =>
      keepAndroidDraft(
        { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        null,
        draft,
      ),
    /verified/,
  );
  assert.throws(
    () =>
      keepAndroidDraft(
        {
          getItem: () => {
            throw Error("denied");
          },
          setItem: () => {},
          removeItem: () => {},
        },
        null,
        draft,
      ),
    /denied/,
  );
});
