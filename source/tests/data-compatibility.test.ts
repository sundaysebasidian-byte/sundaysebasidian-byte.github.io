import test from "node:test";
import assert from "node:assert/strict";
import { readLocalJSON } from "../src/local-json.ts";
import { activities } from "../src/catalog.ts";
import {
  emptyJournal,
  saveDiscovery,
  snapshot,
  parseJournal,
} from "../src/journal.ts";
import { exportBackup, parseBackup, planRestore } from "../src/backup.ts";
import {
  reviewedPack,
  exportCardPack,
  parseCardPack,
} from "../src/card-pack.ts";

const now = "2026-10-07T22:00:00.000Z";
const multilingual = "你好 · العربية · हिन्दी · 👩🏽‍🌾 · Cafe\u0301 · �";
const note = (id: string) =>
  saveDiscovery(
    emptyJournal(),
    {
      id,
      text: multilingual,
      tags: [],
      task: snapshot(activities[0]),
      markDone: false,
    },
    now,
  );

test("valid Unicode, intentional replacement characters and UTF-8 BOM survive exact backup/pack decoding", async () => {
  const original = note("unicode");
  const raw = exportBackup(original, now);
  for (const prefix of ["", "\ufeff"]) {
    const decoded = await readLocalJSON(new Blob([prefix, raw]));
    assert.equal(decoded, raw);
    assert.deepEqual(parseBackup(decoded).journal, original);
  }
  const pack = reviewedPack();
  pack.cards[0].title = multilingual;
  const imported = parseCardPack(
    await readLocalJSON(new Blob([exportCardPack(pack)])),
  );
  assert.equal(imported.cards[0].title, multilingual);
  assert.equal(imported.language, "en"); // Unicode prose does not extend the supported language/profile.
});

test("illegal UTF-8 cannot be silently repaired into parseable JSON", async () => {
  for (const bytes of [
    [0xff],
    [0x80],
    [0xc0, 0xaf],
    [0xed, 0xa0, 0x80],
    [0xe2, 0x82],
  ]) {
    const file = new Blob([new Uint8Array([0x22, ...bytes, 0x22])]);
    assert.doesNotThrow(() =>
      JSON.parse(
        new TextDecoder().decode(new Uint8Array([0x22, ...bytes, 0x22])),
      ),
    );
    await assert.rejects(
      readLocalJSON(file),
      /invalid UTF-8.*Nothing was changed/,
    );
  }
});

test("file-provider read failure is propagated rather than reported as successful decoding", async () => {
  const failure = new DOMException("Provider unavailable", "NotReadableError");
  const file = {
    arrayBuffer: async () => {
      throw failure;
    },
  } as unknown as Blob;
  await assert.rejects(readLocalJSON(file), (error) => error === failure);
});

test("v1 to v2 to legacy replace and repeated restore/export preserve Unicode and historical snapshots", () => {
  const legacy = { ...note("legacy"), schema: 1 as const };
  legacy.entries[0].task.id = "historical-removed-card";
  legacy.entries[0].task.version = "historical-v0";
  const legacyBytes = JSON.stringify(legacy);
  const v1 = parseBackup(exportBackup(legacy, now));
  let current = saveDiscovery(
    parseJournal(legacyBytes),
    {
      id: "current",
      text: "A new scene",
      tags: [],
      task: snapshot(activities[0]),
      markDone: false,
      scene: "park",
    },
    now,
  );
  const v2 = parseBackup(exportBackup(current, now));
  for (const incoming of [v1, v2, v1, v2]) {
    current = planRestore(current, incoming, "merge").next;
    assert.equal(current.entries.length, 2);
    assert.deepEqual(parseBackup(exportBackup(current, now)).journal, current);
    assert.deepEqual(
      current.entries.find((n) => n.id === "legacy"),
      legacy.entries[0],
    );
  }
  const replaced = planRestore(current, v1, "replace").next;
  assert.equal(replaced.schema, 2);
  assert.deepEqual(replaced.entries, legacy.entries);
  const replay = planRestore(
    replaced,
    parseBackup(exportBackup(replaced, now)),
    "merge",
  );
  assert.equal(replay.stats.duplicates, 1);
  assert.deepEqual(replay.next, replaced);
  assert.equal(JSON.stringify(legacy), legacyBytes);
});
