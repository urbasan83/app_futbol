const CACHE_NAME = 'pizarra-f11-v4';

// Archivos esenciales para guardar en la instalación
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

// 1. INSTALACIÓN: Guarda archivo por archivo sin romper el proceso si uno falla
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('No se pudo cachear:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// 2. ACTIVACIÓN: Elimina cachés obsoletas de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. RESPUESTA OFFLINE ROBUSTA: Busca en memoria primero, si no, va a la red
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      // Intenta devolver el archivo guardado en el teléfono
      const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no está guardado, intenta descargarlo de internet
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // Si no hay internet y es una navegación, entrega la pantalla principal
        if (event.request.mode === 'navigate') {
          const mainPage = (await caches.match('./index.html')) || (await caches.match('./'));
          if (mainPage) return mainPage;
        }
        throw error;
      }
    })()
  );
});
