const CACHE_NAME = 'volley-coach-v14.1.0-performance-responsive';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './core-training-v141.js',
  './core-scouting-v141.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

async function cacheShellSafely() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(APP_SHELL.map(async path => {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (response && (response.ok || response.type === 'opaque')) {
        await cache.put(path, response.clone());
      }
    } catch (_) {
      // Optional/CDN assets must never abort installation.
    }
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(cacheShellSafely().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
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

  // Navigation: always prefer the deployed HTML; cached app remains the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)).catch(() => {}));
          }
          return response;
        })
        .catch(async () =>
          (await caches.match('./index.html', { ignoreSearch: true })) ||
          (await caches.match('./', { ignoreSearch: true }))
        )
    );
    return;
  }

  // Versioned local cores and static PWA assets: cache first, refresh silently.
  if (url.origin === self.location.origin && /(?:core-(?:training|scouting)-v141\.js|manifest\.webmanifest|icon-\d+\.png|apple-touch-icon\.png)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      const refresh = fetch(request, { cache: 'no-store' }).then(async response => {
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      }).catch(() => null);
      if (cached) {
        event.waitUntil(refresh);
        return cached;
      }
      return (await refresh) || Response.error();
    })());
    return;
  }

  // Other project assets: network first to avoid stale deployments.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {}));
          }
          return response;
        })
        .catch(() => caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  // CDN libraries: cache-first once seen, with background refresh. This keeps PDF usable offline after install/use.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    const refresh = fetch(request).then(async response => {
      if (response && (response.ok || response.type === 'opaque')) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    }).catch(() => null);
    if (cached) {
      event.waitUntil(refresh);
      return cached;
    }
    return (await refresh) || Response.error();
  })());
});
