// Small synthetic byte fixtures exercise the real SW template; these are not model embeddings.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash, webcrypto } from "node:crypto";
import { runInNewContext } from "node:vm";
const path = "/runtime/ort-wasm-simd-threaded.asyncify.wasm";
const bytes = "trusted synthetic runtime bytes";
const digest = createHash("sha256").update(bytes).digest("hex");
const template = await readFile(
  new URL("../scripts/service-worker-source.js", import.meta.url),
  "utf8",
);
async function fixture(
  options: { rejectCopy?: boolean; windows?: number; network?: string } = {},
) {
  const events = new Map<string, (event: any) => void>();
  const stores = new Map<string, Map<string, Response>>();
  const normalize = (request: string | Request) =>
    new URL(
      typeof request === "string" ? request : request.url,
      "https://fixture.invalid",
    ).href;
  let claimed = false,
    skipped = false;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const values = stores.get(name)!;
      return {
        match: async (request: string | Request) =>
          values.get(normalize(request))?.clone(),
        put: async (request: string | Request, response: Response) => {
          if (options.rejectCopy && name === "pft-runtime-current")
            throw new DOMException("Full", "QuotaExceededError");
          values.set(normalize(request), response.clone());
        },
        delete: async (request: string | Request) =>
          values.delete(normalize(request)),
        addAll: async () => {},
      };
    },
  };
  const clients = Array.from({ length: options.windows || 0 }, (_, i) => ({
    id: `window-${i}`,
  }));
  runInNewContext(
    template
      .replace("__SHELL_CACHE__", '"pft-shell-current"')
      .replace("__SHELL_FILES__", "[]")
      .replace("__RUNTIME_CACHE__", '"pft-runtime-current"')
      .replace("__RUNTIME_HASHES__", JSON.stringify({ [path]: digest })),
    {
      self: {
        location: { origin: "https://fixture.invalid" },
        addEventListener: (name: string, callback: any) =>
          events.set(name, callback),
        clients: {
          matchAll: async () => clients,
          claim: async () => {
            claimed = true;
          },
        },
        skipWaiting: async () => {
          skipped = true;
        },
      },
      caches,
      crypto: webcrypto,
      URL,
      Uint8Array,
      Object,
      TypeError,
      fetch: async () => new Response(options.network ?? bytes),
    },
  );
  const dispatch = async (name: string, extra = {}) => {
    let pending: Promise<any> | undefined;
    events.get(name)!({
      ...extra,
      waitUntil: (p: Promise<any>) => {
        pending = p;
      },
      respondWith: (p: Promise<any>) => {
        pending = p;
      },
    });
    return await pending;
  };
  return {
    caches,
    stores,
    dispatch,
    claimed: () => claimed,
    skipped: () => skipped,
    request: new Request("https://fixture.invalid" + path),
  };
}
test("trusted legacy bytes migrate and UI-only activation preserves durable runtime", async () => {
  const f = await fixture();
  await (
    await f.caches.open("pft-shell-legacy")
  ).put(path, new Response(bytes));
  await f.dispatch("activate");
  assert.equal(
    await (await f.caches.open("pft-runtime-current"))
      .match(path)
      .then((r) => r?.text()),
    bytes,
  );
  assert.equal(f.stores.has("pft-shell-legacy"), false);
  assert.equal(f.claimed(), true);
});
test("migration quota failure retains verified legacy fallback", async () => {
  const f = await fixture({ rejectCopy: true });
  await (
    await f.caches.open("pft-shell-legacy")
  ).put(path, new Response(bytes));
  await f.dispatch("activate");
  assert.equal(f.stores.has("pft-shell-legacy"), true);
  const response = await f.dispatch("fetch", { request: f.request });
  assert.equal(await response.text(), bytes);
});
test("mismatched cached and HTTP-200 runtime bytes are refused", async () => {
  const f = await fixture({ network: "wrong release bytes" });
  await (
    await f.caches.open("pft-runtime-current")
  ).put(path, new Response("corrupt cache bytes"));
  await assert.rejects(
    f.dispatch("fetch", { request: f.request }),
    /does not match/,
  );
  assert.equal(
    await (await f.caches.open("pft-runtime-current")).match(path),
    undefined,
  );
});
test("verified network bytes populate durable cache", async () => {
  const f = await fixture();
  const response = await f.dispatch("fetch", { request: f.request });
  assert.equal(await response.text(), bytes);
  assert.equal(
    await (await f.caches.open("pft-runtime-current"))
      .match(path)
      .then((r) => r?.text()),
    bytes,
  );
});
test("live pages retain old hashed assets and another tab prevents forced activation", async () => {
  const f = await fixture({ windows: 2 });
  await (
    await f.caches.open("pft-shell-legacy")
  ).put("/assets/old-chunk.js", new Response("old chunk"));
  await f.dispatch("activate");
  assert.equal(f.stores.has("pft-shell-legacy"), true);
  const response = await f.dispatch("fetch", {
    request: new Request("https://fixture.invalid/assets/old-chunk.js"),
  });
  assert.equal(await response.text(), "old chunk");
  const replies: any[] = [];
  await f.dispatch("message", {
    data: { type: "PFT_ACTIVATE_UPDATE" },
    source: {
      id: "window-0",
      postMessage: (value: any) => replies.push(value),
    },
  });
  assert.equal(f.skipped(), false);
  assert.equal(replies[0].type, "PFT_UPDATE_BLOCKED");
});
