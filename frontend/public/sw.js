// Service Worker para Adminis Go con actualización automática
// IMPORTANTE: Cambiar esta versión cuando quieras forzar una actualización
// El navegador detectará automáticamente cuando este archivo cambia

const SW_VERSION = '2.1'; // Incrementar este número para forzar actualización
const CACHE_NAME = `adminis-go-${SW_VERSION}`;
const RUNTIME_CACHE = `adminis-go-runtime-${SW_VERSION}`;

// Assets estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon-96x96.png',
  '/apple-touch-icon.png'
];

// Evento: Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Forzar activación inmediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Error al cachear:', error);
      })
  );
});

// Evento: Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando versión:', SW_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar TODOS los caches antiguos (excepto el actual)
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Tomar control inmediato de todas las páginas
        return self.clients.claim();
      })
      .then(() => {
        // Notificar a todas las páginas que hay una nueva versión
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: SW_VERSION
            });
          });
        });
      })
  );
});

/**
 * Shell SPA desde caché; si no hay, red a index.html.
 * respondWith debe recibir siempre un Response (nunca undefined).
 */
function spaShellFromCacheThenNetwork() {
  return caches
    .match('/index.html')
    .then((r) => r || caches.match('/'))
    .then((cached) => {
      if (cached) return cached;
      return fetch('/index.html', { cache: 'reload' });
    })
    .catch(() => {
      return new Response(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sin conexión</title></head><body><p>Sin conexión. Intentá de nuevo.</p></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    });
}

// Evento: Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar peticiones GET del mismo origen
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  const isDocumentNavigation =
    request.mode === 'navigate' || request.destination === 'document';

  // Estrategia mejorada: Network First con fallback a cache
  // Esto asegura que siempre se obtenga la versión más reciente
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la respuesta es válida, actualizar el cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches
          .match(request)
          .then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            if (isDocumentNavigation) {
              return spaShellFromCacheThenNetwork();
            }
            return new Response('', {
              status: 503,
              statusText: 'Sin conexión',
            });
          })
          .catch(() => {
            if (isDocumentNavigation) {
              return spaShellFromCacheThenNetwork();
            }
            return new Response('', {
              status: 503,
              statusText: 'Sin conexión',
            });
          });
      })
  );
});

// Evento: Mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Forzar actualización del cache
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    self.skipWaiting();
    self.clients.claim();
  }
});

// Detectar cuando hay una nueva versión del Service Worker
self.addEventListener('updatefound', () => {
  console.log('[Service Worker] Nueva versión detectada:', SW_VERSION);
  const newWorker = self.registration.installing;
  
  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && self.clients.length) {
      // Notificar a las páginas que hay una actualización
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATE_AVAILABLE',
            version: SW_VERSION
          });
        });
      });
    }
  });
});
