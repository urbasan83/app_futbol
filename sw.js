const SUPABASE_URL = https://mpsgwqjpijqmyaqbgtsg.supabase.co/rest/v1/;
const SUPABASE_KEY = sb_publishable_SVQxZ1Vvd5KQVb5xcRfuIQ_frOQtVzf;

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const CACHE_NAME = 'pizarra-f11-v5';

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

      // Activa inmediatamente el nuevo Service Worker
      await self.skipWaiting();
    })
  );
});

// 2. ACTIVACIÓN: Elimina las cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      // Toma el control inmediatamente de las páginas abiertas
      return self.clients.claim();
    })
  );
});

// 3. PETICIONES: Primero intenta utilizar la red.
// Si no hay conexión, utiliza la versión guardada en caché.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardamos una copia actualizada de las respuestas válidas
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Si no hay conexión, buscar en caché
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || Response.error();
        });
      })
  );
});
