import { readdir, writeFile, readFile, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../dist/", import.meta.url);
async function walk(dir, prefix = "") {
  let out = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = prefix + item.name;
    out.push(
      ...(item.isDirectory()
        ? await walk(new URL(item.name + "/", dir), path + "/")
        : [path]),
    );
  }
  return out;
}
// The worker explicitly uses /runtime/. The package's fallback WASM URL is unused.
for (const name of await readdir(new URL("assets/", root)))
  if (/^ort-wasm-.*\.wasm$/.test(name))
    await unlink(new URL("assets/" + name, root));
const paths = (await walk(root))
  .filter((p) => p !== "sw.js")
  .map((p) => "/" + p);
const hash = createHash("sha256");
for (const path of paths) {
  hash.update(path);
  hash.update(await readFile(new URL(path.slice(1), root)));
}
const version = hash.digest("hex").slice(0, 12);
// Keep the self-authored guide lightweight. Heavy ONNX runtime files are
// downloaded/cached only when real AI requests them, never on a browse visit.
const shellPaths = paths.filter((p) => !p.startsWith("/runtime/"));
const runtimeHashes = {};
for (const path of paths.filter((p) => p.startsWith("/runtime/")).sort())
  runtimeHashes[path] = createHash("sha256")
    .update(await readFile(new URL(path.slice(1), root)))
    .digest("hex");
const runtimeIdentity = createHash("sha256")
  .update(JSON.stringify(runtimeHashes))
  .digest("hex")
  .slice(0, 16);
const source = await readFile(
  new URL("./service-worker-source.js", import.meta.url),
  "utf8",
);
await writeFile(
  new URL("sw.js", root),
  source
    .replace("__SHELL_CACHE__", JSON.stringify("pft-shell-" + version))
    .replace("__SHELL_FILES__", JSON.stringify(shellPaths))
    .replace(
      "__RUNTIME_CACHE__",
      JSON.stringify("pft-runtime-" + runtimeIdentity),
    )
    .replace("__RUNTIME_HASHES__", JSON.stringify(runtimeHashes)),
);

console.log(
  "Offline shell generated:",
  shellPaths.length,
  "initial files; runtime cached on AI use,",
  version,
);
