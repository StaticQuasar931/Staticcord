const CACHE_NAME = 'staticquasar-chat-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/assets/styles.css',
  '/assets/placeholder.svg',
  '/public/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).catch(() => cached)
    )
  );
});
