// Build inserts byte-derived shell/runtime identities and trusted file hashes.
const CACHE = "pft-shell-952e7a77571b";
const FILES = ["/LICENSE","/THIRD-PARTY-NOTICES.txt","/assets/ai.worker-Dqb_1vpf.js","/assets/card-pack-ui-C0LXisfD.js","/assets/index-CQNLvtUa.js","/assets/main-BDu_CWOG.js","/assets/main-BcgecAbG.css","/icon-192.png","/icon-512.png","/index.html","/leaf.svg","/manifest.webmanifest"];
const RUNTIME_CACHE = "pft-runtime-0162b94173a1a8de";
const RUNTIME_HASHES = {"/runtime/ort-wasm-simd-threaded.asyncify.mjs":"0966b6105cd936744498aa60df7a22cbd47af3374dbc64a9ab561c08a71e3611","/runtime/ort-wasm-simd-threaded.asyncify.wasm":"49871f5a4409519797e127440868a6d1923339d9185907f301a5b2a1d90af082"};

async function matchesRuntime(response, path) {
  if (!response?.ok) return false;
  try {
    const hash = [
      ...new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          await response.clone().arrayBuffer(),
        ),
      ),
    ]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    return hash === RUNTIME_HASHES[path];
  } catch {
    return false;
  }
}

async function verifiedLegacyRuntime(path, names) {
  for (const name of names.filter((name) => name.startsWith("pft-shell-"))) {
    const response = await (
      await caches.open(name)
    ).match(path, { ignoreVary: true });
    if (await matchesRuntime(response, path)) return response;
  }
  return null;
}

self.addEventListener("install", (event) => {
  // Updates wait. The first install activates naturally; no live page is replaced.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "PFT_GUIDE_INFO") {
    event.ports?.[0]?.postMessage({
      guide:
        FILES.map(
          (path) => path.match(/\/assets\/index-([^/]+)\.js$/)?.[1],
        ).find(Boolean) || "not-reported",
    });
    return;
  }
  if (event.data?.type !== "PFT_ACTIVATE_UPDATE") return;
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      if (clients.length !== 1 || clients[0].id !== event.source?.id) {
        event.source?.postMessage({
          type: "PFT_UPDATE_BLOCKED",
          reason: "other-tabs",
        });
        return;
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const runtime = await caches.open(RUNTIME_CACHE);
      let migrationFailed = false;
      for (const path of Object.keys(RUNTIME_HASHES)) {
        if (
          await matchesRuntime(
            await runtime.match(path, { ignoreVary: true }),
            path,
          )
        )
          continue;
        const legacy = await verifiedLegacyRuntime(path, names);
        if (legacy) {
          try {
            await runtime.put(path, legacy);
          } catch {
            migrationFailed = true;
          }
        }
      }
      // A failed copy must not destroy the only valid offline runtime. Fetch can
      // still use its hash-verified legacy copy while storage remains constrained.
      // A user may begin fresh work while activation is in flight. Retain old
      // shells while any page remains; exact hashed asset requests can use them.
      const livePages = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      if (!migrationFailed && livePages.length === 0)
        await Promise.all(
          names
            .filter((name) => name.startsWith("pft-shell-") && name !== CACHE)
            .map((name) => caches.delete(name)),
        );
      // Runtime identities survive UI-only releases. Other versions are retained
      // until the user explicitly clears model downloads; no personal store is read.
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  event.respondWith(
    (async () => {
      const isRuntime = Object.hasOwn(RUNTIME_HASHES, url.pathname);
      const cache = await caches.open(isRuntime ? RUNTIME_CACHE : CACHE);
      const hit = await cache.match(event.request, { ignoreVary: true });
      if (hit && (!isRuntime || (await matchesRuntime(hit, url.pathname))))
        return hit;
      if (hit && isRuntime)
        await cache.delete(event.request, { ignoreVary: true });
      if (!isRuntime && url.pathname.startsWith("/assets/")) {
        for (const name of await caches.keys()) {
          if (!name.startsWith("pft-shell-") || name === CACHE) continue;
          const previous = await (
            await caches.open(name)
          ).match(event.request, {
            ignoreVary: true,
          });
          if (previous) return previous;
        }
      }
      if (isRuntime) {
        const legacy = await verifiedLegacyRuntime(
          url.pathname,
          await caches.keys(),
        );
        if (legacy) {
          try {
            await cache.put(event.request, legacy.clone());
          } catch {}
          return legacy;
        }
      }
      try {
        const response = await fetch(event.request);
        if (isRuntime && !(await matchesRuntime(response, url.pathname)))
          throw new TypeError(
            "This runtime does not match the active app version. Reload online to update the guide.",
          );
        if (isRuntime && response.ok) {
          try {
            await cache.put(event.request, response.clone());
          } catch {}
        }
        return response;
      } catch (error) {
        if (event.request.mode === "navigate")
          return await (await caches.open(CACHE)).match("/index.html");
        throw error;
      }
    })(),
  );
});
