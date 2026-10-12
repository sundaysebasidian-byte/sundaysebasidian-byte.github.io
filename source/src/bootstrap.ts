import { restoreDeviceJournal } from "./android-journal.ts";

// Initialize the Android durable notebook before the existing UI reads its cache.
// The browser edition keeps its established Web Storage path.
restoreDeviceJournal().then(() => import("./main.ts"));
