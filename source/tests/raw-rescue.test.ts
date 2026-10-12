import test from "node:test";
import assert from "node:assert/strict";
import {
  rawRescueFile,
  readRawNotebook,
  RawRescueError,
  RAW_RESCUE_FORMAT,
  MAX_RAW_RESCUE_BYTES,
} from "../src/raw-rescue.ts";
import { parseBackup } from "../src/backup.ts";
const now = "2026-10-07T22:30:00.000Z";
test("unverified TXT envelope preserves the exact storage string including damaged JSON, Unicode and lone surrogates", () => {
  for (const raw of [
    "",
    "{",
    '{"schema":42,"personal":"你好 · العربية · 👩🏽‍🌾"}',
    "\ufeff\r\n\ud800\udfff\u0000<script>literal</script>",
  ]) {
    const file = rawRescueFile(raw, now);
    const decoded = JSON.parse(
      new TextDecoder().decode(new TextEncoder().encode(file.text)),
    );
    assert.equal(decoded.raw, raw);
    assert.equal(decoded.format, RAW_RESCUE_FORMAT);
    assert.equal(decoded.status, "unverified-not-a-restorable-backup");
    assert.match(file.filename, /UNVERIFIED.*\.txt$/);
    assert.throws(() => parseBackup(file.text));
  }
});
test("storage failure or missing key never invents an empty or cached rescue; an actual empty string is preserved", () => {
  const fails = (problem: string) => (error: unknown) =>
    error instanceof RawRescueError && error.problem === problem;
  assert.throws(
    () =>
      readRawNotebook(() => {
        throw Error("Private provider detail");
      }),
    fails("read-failed"),
  );
  assert.throws(() => readRawNotebook(() => null), fails("not-found"));
  assert.equal(
    readRawNotebook(() => ""),
    "",
  );
});
test("2 MiB envelope limit rejects both large raw and escaped expansion without truncation", () => {
  for (const raw of [
    "x".repeat(MAX_RAW_RESCUE_BYTES + 1),
    "\ud800".repeat(MAX_RAW_RESCUE_BYTES / 4),
  ]) {
    const before = raw;
    assert.throws(
      () => rawRescueFile(raw, now),
      (e) => e instanceof RawRescueError && e.problem === "too-large",
    );
    assert.equal(raw, before);
  }
});
