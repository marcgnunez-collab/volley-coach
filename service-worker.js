const CACHE_NAME = 'volley-coach-v8.9.1-scout-data-rescue-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // HTML / navegación: siempre intenta GitHub primero.
  // La caché solo se usa como respaldo offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put('./index.html', copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          return (
            await caches.match('./index.html', { ignoreSearch: true })
          ) || (
            await caches.match('./', { ignoreSearch: true })
          );
        })
    );
    return;
  }

  // Archivos del propio proyecto: red primero para evitar versiones antiguas.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  // CDN externos: red normal; si existe una copia válida, sirve como respaldo.
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy))
              .catch(() => {})
          );
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
