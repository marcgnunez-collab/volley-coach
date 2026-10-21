/* Actualización automática de Volley Coach PWA */
if ('serviceWorker' in navigator) {
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', {
        updateViaCache: 'none'
      });

      // Comprueba si el service worker publicado ha cambiado.
      await registration.update();
      setInterval(() => registration.update().catch(() => {}), 60 * 1000);

      // También comprueba si index.html de GitHub Pages ha cambiado.
      // GitHub Pages normalmente envía ETag/Last-Modified; si cambia, recarga la app.
      const checkPublishedVersion = async () => {
        if (!navigator.onLine || document.visibilityState === 'hidden') return;
        try {
          const response = await fetch('./index.html?update-check=' + Date.now(), {
            method: 'HEAD',
            cache: 'no-store'
          });
          if (!response.ok) return;

          const tag = response.headers.get('etag') || response.headers.get('last-modified');
          if (!tag) return;

          const key = 'volleyCoachPublishedVersion';
          const previous = localStorage.getItem(key);
          localStorage.setItem(key, tag);

          if (previous && previous !== tag) {
            window.location.reload();
          }
        } catch (_) {
          // Sin conexión o comprobación no disponible: la app sigue funcionando offline.
        }
      };

      await checkPublishedVersion();
      setInterval(checkPublishedVersion, 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkPublishedVersion();
      });
    } catch (error) {
      console.error('Error registrando la PWA:', error);
    }
  });
}
