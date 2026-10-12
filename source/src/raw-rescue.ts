import { JOURNAL_KEY } from "./journal.ts";

export const RAW_RESCUE_FORMAT = "pocket-field-trip-unverified-raw-notebook";
export const MAX_RAW_RESCUE_BYTES = 2 * 1024 * 1024;
export type RescueProblem =
  | "read-failed"
  | "not-found"
  | "too-large"
  | "changed"
  | "download-failed";
export class RawRescueError extends Error {
  readonly problem: RescueProblem;
  constructor(problem: RescueProblem) {
    super(problem);
    this.problem = problem;
  }
}
export function readRawNotebook(read: () => string | null): string {
  let raw: string | null;
  try {
    raw = read();
  } catch {
    throw new RawRescueError("read-failed");
  }
  if (raw === null) throw new RawRescueError("not-found");
  return raw;
}
export function rawRescueFile(raw: string, now: string, pack = false) {
  if (raw.length > MAX_RAW_RESCUE_BYTES) throw new RawRescueError("too-large");
  // localStorage holds UTF-16 strings, not original file bytes. A labeled JSON
  // envelope preserves even lone surrogates that Blob([raw]) would replace.
  const text =
    JSON.stringify(
      {
        format: pack
          ? "pocket-field-trip-unverified-raw-card-pack"
          : RAW_RESCUE_FORMAT,
        version: 1,
        status: "unverified-not-a-restorable-backup",
        storageKey: pack ? "pft-card-pack-review-v1" : JOURNAL_KEY,
        capturedAt: now,
        raw,
      },
      null,
      2,
    ) + "\n";
  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes > MAX_RAW_RESCUE_BYTES) throw new RawRescueError("too-large");
  return {
    raw,
    text,
    bytes,
    filename: `pocket-field-trip-UNVERIFIED-${pack ? "card-pack" : "raw-rescue"}-${now.slice(0, 10)}.txt`,
  };
}
