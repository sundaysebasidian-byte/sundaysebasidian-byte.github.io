// A narrow, reproducible check for the unused guid-typescript / WebGL path.
// It corroborates package export/import routing, upstream source maps and emitted
// code fingerprints. It is not a general legal or whole-bundle provenance audit.
import assert from "node:assert/strict";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const sha = (data) => createHash("sha256").update(data).digest("hex");
const fingerprints = [
  "emptyguid",
  "00000000-0000-0000-0000-000000000000",
  "[a-z0-9]{8}",
  "Invalid argument; `value` has no value.",
];
const ort = "node_modules/onnxruntime-web/dist/";
const positive = await read(ort + "ort.webgl.min.mjs");
assert(
  fingerprints.every((f) => positive.includes(f)),
  "WebGL positive control",
);
const map = JSON.parse(await read(ort + "ort.webgpu.bundle.min.mjs.map"));
const excluded = map.sources.filter((s) => /guid-typescript|onnxjs/.test(s));
assert.equal(excluded.length, 0, "WebGPU source map must exclude legacy WebGL");
const importRoute = await read(
  "node_modules/@huggingface/transformers/src/backends/onnx.js",
);
assert(
  importRoute.includes("onnxruntime-web/webgpu"),
  "Expected ONNX import route",
);
const pkg = JSON.parse(
  await read("node_modules/@huggingface/transformers/package.json"),
);
assert.equal(pkg.exports.default.default, "./dist/transformers.web.js");
const files = [];
async function scan(directory, prefix) {
  for (const entry of await readdir(new URL(directory, root), {
    withFileTypes: true,
  })) {
    const path = prefix + entry.name;
    if (entry.isDirectory())
      await scan(directory + entry.name + "/", path + "/");
    else if (/\.(m?js)$/.test(entry.name)) {
      const code = await read("dist/" + path);
      const matches = fingerprints.filter((f) => code.includes(f));
      assert.equal(matches.length, 0, `Unexpected GUID code in ${path}`);
      files.push({
        path,
        bytes: Buffer.byteLength(code),
        sha256: sha(code),
        guidFingerprints: matches,
      });
    }
  }
}
await scan("dist/", "");
const runtime = [];
for (const name of [
  "ort-wasm-simd-threaded.asyncify.mjs",
  "ort-wasm-simd-threaded.asyncify.wasm",
]) {
  const original = await readFile(new URL(ort + name, root));
  const copy = await readFile(new URL("dist/runtime/" + name, root));
  assert.equal(sha(copy), sha(original), `Unmodified local runtime ${name}`);
  runtime.push({
    path: "runtime/" + name,
    bytes: copy.length,
    sha256: sha(copy),
  });
}
assert.equal(await read("dist/LICENSE"), await read("LICENSE"));
assert(
  (await read("dist/THIRD-PARTY-NOTICES.txt")).includes(
    await read("docs/third-party-licenses/onnxruntime__ThirdPartyNotices.txt"),
  ),
);
const report = {
  checkedAt: new Date().toISOString(),
  scope:
    "Built static browser distribution; not the complete npm installation graph",
  guidDependencyStillInstalled: true,
  packageVersion: JSON.parse(
    await read("node_modules/guid-typescript/package.json"),
  ).version,
  routing: {
    transformersBrowserExport: pkg.exports.default.default,
    onnxImport: "onnxruntime-web/webgpu",
    webgpuSourceMapSources: map.sources,
    excludedLegacySources: excluded,
  },
  positiveControl: {
    path: ort + "ort.webgl.min.mjs",
    allFourFingerprintsPresent: true,
    sha256: sha(positive),
  },
  fingerprints,
  emittedJavaScript: files.sort((a, b) => a.path.localeCompare(b.path)),
  unmodifiedRuntime: runtime,
  releaseLicenseAndRuntimeNoticesPresent: true,
  conclusion:
    "The installed guid-typescript dependency belongs to the unused legacy WebGL path and is excluded from this WASM/WebGPU browser release. Its upstream ISC text remains unavailable; no substitute license was invented.",
};
await mkdir(new URL("../evidence/notebook-scenes-v13/", import.meta.url), {
  recursive: true,
});
await writeFile(
  new URL(
    `${process.env.PFT_EVIDENCE_DIR || "evidence/notebook-scenes-v13"}/distribution-scope.json`,
    root,
  ),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  "Distribution scope passed:",
  files.length,
  "JS files; GUID/WebGL excluded, original runtime and notices retained.",
);
