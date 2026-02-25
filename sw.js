const PRECACHE = "otpremnice-precache-v3";
const RUNTIME = "otpremnice-runtime-v3";
const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "logo.png.png",
  "icon.ico",
  "artikli.csv",
  "kupci.csv"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== PRECACHE && key !== RUNTIME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("index.html").then((cached) => cached || fetch(request))
    );
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!response) return response;
          const okToCache = response.status === 200 || response.type === "opaque";
          if (!okToCache) return response;
          const responseClone = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request));
    })
  );
});
