const CACHE_NAME = "achivo-cache-v1";

// الملفات الأساسية اللي تتخزن في الكاش
const urlsToCache = ["/", "/index.html", "/manifest.json"];

// install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // ✅ يضمن تنصيب النسخة الجديدة مباشرة
});

// activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // ✅ يحذف الكاش القديم
          }
        })
      )
    )
  );
  self.clients.claim(); // ✅ يربط النسخة الجديدة فورًا
});

// fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
