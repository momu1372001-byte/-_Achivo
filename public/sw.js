const CACHE_NAME = "app-cache-v1"; // كل ما تعدل النسخة غير الرقم
const urlsToCache = ["/", "/index.html"];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // ✅ يخلي النسخة الجديدة تشتغل فورًا
});

// Activate event
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
  self.clients.claim(); // ✅ يخلي التحديث يبان للمستخدم مباشرة
});

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
