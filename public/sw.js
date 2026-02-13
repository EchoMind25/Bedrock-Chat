const CACHE_NAME = "bedrock-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// Cache size limits
const MAX_CACHE_ENTRIES = 200;
const MAX_CACHE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Install: precache critical assets ──────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ─────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.map((name) => {
            if (name !== CACHE_NAME) return caches.delete(name);
          })
        )
      )
      .then(() => self.clients.claim())
      .then(() => trimCache())
  );
});

// ── Fetch: strategy per request type ───────────────────────

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // API / auth: network-only with error fallback
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: "Offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
      )
    );
    return;
  }

  // Static assets: cache-first with stale-while-revalidate
  const dest = event.request.destination;
  if (
    dest === "image" ||
    dest === "font" ||
    dest === "script" ||
    dest === "style"
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response.clone());
              });
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Navigation: network-first with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Default: network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ── Message Queue (offline message support) ────────────────

const messageQueue = [];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "QUEUE_MESSAGE") {
    messageQueue.push({
      payload: event.data.payload,
      timestamp: Date.now(),
    });
  }

  if (event.data && event.data.type === "FLUSH_QUEUE") {
    flushMessageQueue();
  }

  if (event.data && event.data.type === "TRIM_CACHE") {
    trimCache();
  }
});

async function flushMessageQueue() {
  if (messageQueue.length === 0) return;

  const messages = [...messageQueue];
  messageQueue.length = 0;

  for (const msg of messages) {
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg.payload),
      });
    } catch {
      // Re-queue failed messages
      messageQueue.push(msg);
    }
  }

  // Notify clients about queue status
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({
      type: "QUEUE_STATUS",
      pending: messageQueue.length,
    });
  }
}

// ── Cache Management ───────────────────────────────────────

async function trimCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  // Remove entries beyond size limit
  if (keys.length > MAX_CACHE_ENTRIES) {
    const toRemove = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
    await Promise.all(toRemove.map((key) => cache.delete(key)));
  }
}

// ── Background Sync ────────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "flush-messages") {
    event.waitUntil(flushMessageQueue());
  }
});

// ── Periodic Sync (battery-aware) ──────────────────────────

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "cache-cleanup") {
    event.waitUntil(trimCache());
  }
});
