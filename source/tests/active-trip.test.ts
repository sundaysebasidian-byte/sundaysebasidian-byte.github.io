import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_TRIP_KEY,
  parseActiveTrip,
  readActiveTrip,
  changeActiveTrip,
  type ActiveTrip,
} from "../src/active-trip.ts";
const first: ActiveTrip = {
  schema: 1,
  token: "11111111-1111-4111-8111-111111111111",
  taskId: "sound-map",
  taskVersion: "1",
};
const second: ActiveTrip = {
  ...first,
  token: "22222222-2222-4222-8222-222222222222",
  taskId: "sky-pause",
};
const raw = JSON.stringify(first);
function storage(initial: string | null = null) {
  let value = initial;
  let writes = 0;
  return {
    getItem: (key: string) => {
      assert.equal(key, ACTIVE_TRIP_KEY);
      return value;
    },
    setItem: (_key: string, next: string) => {
      value = next;
      writes++;
    },
    removeItem: () => {
      value = null;
      writes++;
    },
    value: () => value,
    writes: () => writes,
  };
}
test("trip identity stores no intent, location, timestamps or completion and parses empty state", () => {
  assert.deepEqual(parseActiveTrip(null), { kind: "empty", raw: null });
  assert.deepEqual(parseActiveTrip(raw), { kind: "valid", raw, trip: first });
  assert.deepEqual(Object.keys(first).sort(), [
    "schema",
    "taskId",
    "taskVersion",
    "token",
  ]);
});
test("unknown fields/schema/oversize/malformed bytes remain invalid and preserved", () => {
  for (const value of [
    "not-json",
    "[]",
    JSON.stringify({ ...first, schema: 2 }),
    JSON.stringify({ ...first, intent: "private" }),
    "x".repeat(1025),
  ])
    assert.deepEqual(parseActiveTrip(value), { kind: "invalid", raw: value });
});
test("invalid identity tokens do not become trusted return cards", () => {
  for (const token of ["", "no token", "11111111-1111-1111-1111-11111111111"])
    assert.equal(
      parseActiveTrip(JSON.stringify({ ...first, token })).kind,
      "invalid",
    );
});
test("storage read denial remains distinct from an empty trip", () =>
  assert.deepEqual(
    readActiveTrip({
      getItem: () => {
        throw Error("denied");
      },
    }),
    { kind: "unreadable" },
  ));
test("start and replacement verify exact stored bytes", () => {
  const s = storage();
  assert.equal(changeActiveTrip(s, null, first), "saved");
  assert.equal(s.value(), raw);
  assert.equal(changeActiveTrip(s, raw, second), "saved");
  assert.equal(s.value(), JSON.stringify(second));
});
test("an old session cannot replace or finish a newer trip even with the same task identity", () => {
  const newer = JSON.stringify({ ...first, token: second.token });
  const s = storage(newer);
  assert.equal(changeActiveTrip(s, raw, second), "changed");
  assert.equal(changeActiveTrip(s, raw, null), "changed");
  assert.equal(s.value(), newer);
  assert.equal(s.writes(), 0);
});
test("successful finish removes only the dedicated key through its byte guard", () => {
  const s = storage(raw);
  assert.equal(changeActiveTrip(s, raw, null), "saved");
  assert.equal(s.value(), null);
  assert.equal(s.writes(), 1);
});
test("denied start does not falsely report durable success", () => {
  const s = storage();
  s.setItem = () => {
    throw Error("quota");
  };
  assert.equal(changeActiveTrip(s, null, first), "failed");
  assert.equal(s.value(), null);
});
test("denied finish preserves the current trip for a retry", () => {
  const s = storage(raw);
  s.removeItem = () => {
    throw Error("blocked");
  };
  assert.equal(changeActiveTrip(s, raw, null), "failed");
  assert.equal(s.value(), raw);
});
test("silently ignored writes and removals are unconfirmed", () => {
  const a = storage();
  a.setItem = () => {};
  assert.equal(changeActiveTrip(a, null, first), "unconfirmed");
  const b = storage(raw);
  b.removeItem = () => {};
  assert.equal(changeActiveTrip(b, raw, null), "unconfirmed");
  assert.equal(b.value(), raw);
});
test("unreadable verification after a write never certifies success", () => {
  const s = storage();
  let reads = 0;
  s.getItem = () => {
    if (reads++) throw Error("unreadable");
    return null;
  };
  assert.equal(changeActiveTrip(s, null, first), "failed");
  assert.equal(s.value(), raw);
});

test("successful removal followed by denied verification is uncertain, not confirmed", () => {
  let raw: string | null = JSON.stringify(first);
  let denied = false;
  const storage = {
    getItem() {
      if (denied) throw Error("Verification unavailable");
      return raw;
    },
    setItem(_key: string, next: string) {
      raw = next;
    },
    removeItem() {
      raw = null;
      denied = true;
    },
  };
  assert.equal(changeActiveTrip(storage, raw, null), "failed");
  assert.equal(raw, null);
});
