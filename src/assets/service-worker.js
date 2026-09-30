const CACHE_NAME = 'watchlater-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/assets/base.css',
  '/src/assets/main.css',
  '/public/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});