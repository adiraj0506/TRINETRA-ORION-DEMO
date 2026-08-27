const CACHE_NAME = "tesseract-offline-cache-v1";
const ASSETS_TO_CACHE = [
  "/tesseract/worker.min.js",
  "/tesseract/tesseract-core-lstm.js",
  "/tesseract/tesseract-core-lstm.wasm",
  "/tesseract/tesseract-core-lstm.wasm.js",
  "/tesseract/tesseract-core-relaxedsimd-lstm.js",
  "/tesseract/tesseract-core-relaxedsimd-lstm.wasm",
  "/tesseract/tesseract-core-relaxedsimd-lstm.wasm.js",
  "/tesseract/tesseract-core-relaxedsimd.js",
  "/tesseract/tesseract-core-relaxedsimd.wasm",
  "/tesseract/tesseract-core-relaxedsimd.wasm.js",
  "/tesseract/tesseract-core-simd-lstm.js",
  "/tesseract/tesseract-core-simd-lstm.wasm",
  "/tesseract/tesseract-core-simd-lstm.wasm.js",
  "/tesseract/tesseract-core-simd.js",
  "/tesseract/tesseract-core-simd.wasm",
  "/tesseract/tesseract-core-simd.wasm.js",
  "/tesseract/tesseract-core.js",
  "/tesseract/tesseract-core.wasm",
  "/tesseract/tesseract-core.wasm.js",
  "/tesseract/lang-data/eng.traineddata.gz",
  "/tesseract/lang-data/hin.traineddata.gz",
  "/tesseract/lang-data/ori.traineddata.gz"
];

// Install Service Worker and cache Tesseract offline assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching Tesseract assets for offline OCR...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate and clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Intercept requests and serve from Cache Storage (Offline-First)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith("/tesseract/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
  }
});
