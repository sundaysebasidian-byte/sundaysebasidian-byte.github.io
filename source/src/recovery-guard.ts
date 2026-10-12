import {
  exportBackup,
  parseBackup,
  MAX_BACKUP_BYTES,
  BACKUP_FORMAT,
} from "./backup.ts";
import { parseJournal, type Journal } from "./journal.ts";
export class RecoveryLimitError extends Error {}
const stamp = "2000-01-01T00:00:00.000Z";
const compactSize = (j: Journal) =>
  new TextEncoder().encode(
    JSON.stringify({
      format: BACKUP_FORMAT,
      version: j.schema,
      exportedAt: stamp,
      journal: j,
    }),
  ).byteLength;
// Normal changes remain fully recoverable. Legacy oversized data can shrink toward recovery.
export function assertRecoverableChange(current: Journal, next: Journal): void {
  parseJournal(JSON.stringify(next));
  try {
    exportBackup(next, stamp);
    return;
  } catch (error) {
    const before = compactSize(current),
      after = compactSize(next);
    if (
      before > MAX_BACKUP_BYTES &&
      after > MAX_BACKUP_BYTES &&
      after < before
    ) {
      // Oversized repairs still validate every field; a size error is not a license
      // to persist malformed records or unsupported fields.
      for (const entry of next.entries)
        parseBackup(
          JSON.stringify({
            format: BACKUP_FORMAT,
            version: next.schema,
            exportedAt: stamp,
            journal: { ...next, entries: [entry] },
          }),
        );
      return;
    }
    throw new RecoveryLimitError(
      `This change would exceed the complete 1 MiB JSON backup limit. Saved records and your draft were kept. Shorten stored content or remove a discovery before retrying. ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
