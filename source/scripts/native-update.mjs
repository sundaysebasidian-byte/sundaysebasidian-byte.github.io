import { build } from "esbuild";
import { resolve } from "node:path";
await build({
  entryPoints: [new URL("../src/update-notice.ts", import.meta.url).pathname],
  bundle: true,
  format: "iife",
  globalName: "PocketUpdateNotice",
  target: "chrome100",
  outfile: resolve(process.argv[2], "update-notice.js"),
});
