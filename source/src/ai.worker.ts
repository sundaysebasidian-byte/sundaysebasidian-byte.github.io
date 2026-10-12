import {
  pipeline,
  env,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";
import { activities } from "./catalog.ts";
import { semanticRank, type Constraints } from "./ranking.ts";
import { MODEL, REVISION } from "./model-config.ts";
const bundledApp = navigator.userAgent.includes("PocketFieldTripApp/0.3.0");
env.allowLocalModels = bundledApp;
env.allowRemoteModels = !bundledApp;
if (bundledApp) env.localModelPath = `/models/${REVISION}/`;
// The v4 pipeline factory's metadata lookup omits revision. Pin its URLs too.
env.remotePathTemplate = `{model}/resolve/${REVISION}/`;
env.backends.onnx.wasm!.numThreads = 1;
env.backends.onnx.wasm!.wasmPaths = {
  mjs: "/runtime/ort-wasm-simd-threaded.asyncify.mjs",
  wasm: "/runtime/ort-wasm-simd-threaded.asyncify.wasm",
};
env.useBrowserCache = false;
env.useCustomCache = !bundledApp && typeof caches !== "undefined";
env.customCache = {
  match: async (request: RequestInfo | URL) =>
    (await caches.open("pft-model-" + REVISION)).match(request),
  put: async (request: RequestInfo | URL, response: Response) =>
    (await caches.open("pft-model-" + REVISION)).put(request, response),
};
let extractor: FeatureExtractionPipeline | null = null;
let vectors: number[][] | null = null;
self.onmessage = async (
  event: MessageEvent<{ id: number; text: string; constraints: Constraints }>,
) => {
  const { id, text, constraints } = event.data;
  const started = performance.now();
  const cold = !extractor;
  try {
    if (!extractor) {
      self.postMessage({
        type: "progress",
        id,
        label: bundledApp
          ? "Preparing the open model bundled in this app. No download."
          : "Loading the open model. First visit needs internet.",
        phase: "download",
      });
      extractor = await pipeline<"feature-extraction">(
        "feature-extraction",
        MODEL,
        {
          device: "wasm",
          dtype: "q8",
          revision: REVISION,
          progress_callback: (p) => {
            if (p.status === "progress")
              self.postMessage({
                type: "progress",
                id,
                label: `Loading ${p.file}`,
                progress: Math.round(p.progress),
                loaded: p.loaded,
                total: p.total,
                phase: "download",
              });
            else if (p.status === "done")
              self.postMessage({
                type: "progress",
                id,
                label: `${p.file} ready. Preparing model and local runtime…`,
                phase: "download",
              });
          },
        },
      );
    }
    if (!vectors) {
      self.postMessage({
        type: "progress",
        id,
        label: "Reading the field guide…",
        phase: "catalog",
      });
      const out = await extractor(
        activities.map((a) => a.meaning),
        { pooling: "mean", normalize: true },
      );
      vectors = out.tolist() as number[][];
    }
    const inferenceStart = performance.now();
    self.postMessage({
      type: "progress",
      id,
      phase: "match",
      label: "Matching the meaning of your words, locally…",
    });
    const out = await extractor(text, { pooling: "mean", normalize: true });
    const query = (out.tolist() as number[][])[0];
    const ranked = semanticRank(constraints, query, vectors);
    self.postMessage({
      type: "result",
      id,
      ranked: ranked.map((r) => ({ id: r.activity.id, score: r.score })),
      evidence: {
        model: MODEL,
        revision: REVISION,
        backend: "ONNX Runtime / WebAssembly",
        dtype: "q8",
        dimensions: query.length,
        catalogSize: vectors.length,
        inferenceMs: Math.round(performance.now() - inferenceStart),
        totalMs: Math.round(performance.now() - started),
        cold,
        delivery: bundledApp
          ? "bundled Android assets"
          : "remote or cached browser files",
        queryNorm: Math.sqrt(query.reduce((s, v) => s + v * v, 0)),
        sample: query.slice(0, 6),
      },
    });
  } catch (error) {
    extractor = null;
    vectors = null;
    self.postMessage({
      type: "error",
      id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
