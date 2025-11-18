// Service Worker para PadeLock PWA
const CACHE_NAME = 'padelock-v2';
const RUNTIME_CACHE = 'padelock-runtime-v2';

// Recursos críticos que queremos cachear durante la instalación
const PRECACHE_URLS = [
  '/',
  '/auth',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/padelock-favicon.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting()) // Activa el nuevo SW inmediatamente
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control de todas las páginas inmediatamente
  );
});

// Estrategia de fetch: Network First con Cache Fallback
self.addEventListener('fetch', (event) => {
  // Solo cachear requests GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requests de analytics, supabase auth, etc.
  const url = new URL(event.request.url);
  if (
    url.origin.includes('supabase') ||
    url.origin.includes('analytics') ||
    url.origin.includes('stripe') ||
    url.pathname.includes('/api/')
  ) {
    return;
  }

  event.respondWith(
    // Network First: Intentar red primero, si falla usar cache
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, clonarla y guardarla en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();

          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Si falla la red, intentar servir desde cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache:', event.request.url);
              return cachedResponse;
            }

            // Si no hay cache, mostrar página offline (opcional)
            return new Response('Offline - No hay conexión', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Escuchar mensajes del cliente para forzar actualización
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting phase...');
    self.skipWaiting();
  }
});
