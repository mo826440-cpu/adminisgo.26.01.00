import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Aplicar tema guardado al cargar la aplicación
const temaGuardado = localStorage.getItem('tema')
if (temaGuardado === 'oscuro') {
  document.documentElement.setAttribute('data-theme', 'dark')
} else {
  document.documentElement.removeAttribute('data-theme')
}

// Registrar Service Worker (solo en producción).
// En desarrollo (Vite) el SW suele causar lentitud y errores al recargar/HMR.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Si estás en dev, desregistrar cualquier SW previo y limpiar caches.
    if (import.meta.env.DEV) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch (e) {
        // No bloquear el arranque por fallas de limpieza en dev
        console.warn('[Service Worker] Limpieza en DEV falló:', e);
      }
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('[Service Worker] Registrado exitosamente:', registration.scope);

        // Verificar actualizaciones (más conservador).
        const intervalId = window.setInterval(() => {
          registration.update().catch(() => {});
        }, 5 * 60 * 1000);

        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) registration.update().catch(() => {});
        });

        // Escuchar mensajes del Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
            console.log('[Service Worker] Actualización disponible:', event.data.version);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Adminis Go', {
                body: 'Hay una nueva versión disponible. La app se actualizará automáticamente.',
                icon: '/favicon-96x96.png',
                tag: 'app-update',
                requireInteraction: false,
              });
            }

            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }

          if (event.data && event.data.type === 'SW_UPDATED') {
            console.log('[Service Worker] Actualizado a versión:', event.data.version);
            window.location.reload();
          }
        });

        // Detectar cuando hay un nuevo Service Worker esperando
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Service Worker] Nueva versión instalada, actualizando...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          });
        });

        // Limpieza del intervalo cuando la página se descarga
        window.addEventListener('beforeunload', () => window.clearInterval(intervalId));
      })
      .catch((error) => {
        console.error('[Service Worker] Error al registrar:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
