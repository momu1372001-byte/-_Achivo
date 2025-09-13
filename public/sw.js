const CACHE_NAME = "achivo-cache-v1";

// install: نضيف الأساسيات
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/", 
        "/index.html", 
        "/manifest.json"
      ]);
    })
  );
  self.skipWaiting(); // تحديث فوري
});

// activate: نحذف أي كاش قديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// fetch: الأول نجرب الشبكة، لو فشلت نجيب من الكاش
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
