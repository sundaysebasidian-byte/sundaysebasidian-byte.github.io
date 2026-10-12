import {
  readdir,
  mkdir,
  copyFile,
  readFile,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
const source = new URL(
  "../node_modules/onnxruntime-web/dist/",
  import.meta.url,
);
const target = new URL("../public/runtime/", import.meta.url);
await mkdir(target, { recursive: true });
for (const file of await readdir(source))
  if (/^ort-wasm-simd-threaded\.asyncify\.(mjs|wasm)$/.test(file))
    await copyFile(new URL(file, source), new URL(file, target));
const hashes = {};
for (const file of [
  "ort-wasm-simd-threaded.asyncify.mjs",
  "ort-wasm-simd-threaded.asyncify.wasm",
])
  hashes["/runtime/" + file] = createHash("sha256")
    .update(await readFile(new URL(file, target)))
    .digest("hex");
const identity = createHash("sha256")
  .update(JSON.stringify(hashes))
  .digest("hex")
  .slice(0, 16);
await writeFile(
  new URL("../src/runtime-cache.ts", import.meta.url),
  `// Generated from the actual packaged runtime by scripts/runtime.mjs.\nexport const RUNTIME_CACHE = "pft-runtime-${identity}";\nexport const RUNTIME_HASHES = {\n${Object.entries(
    hashes,
  )
    .map(
      ([path, hash]) =>
        `  ${JSON.stringify(path)}:\n    ${JSON.stringify(hash)},`,
    )
    .join("\n")}\n} as const;\n`,
);
