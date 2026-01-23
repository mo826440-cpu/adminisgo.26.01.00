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

// Registrar Service Worker para PWA con actualización automática
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('[Service Worker] Registrado exitosamente:', registration.scope);
        
        // Verificar actualizaciones periódicamente (cada 30 segundos)
        setInterval(() => {
          registration.update();
        }, 30000);
        
        // Verificar actualizaciones al recuperar el foco de la ventana
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            registration.update();
          }
        });
        
        // Escuchar mensajes del Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
            console.log('[Service Worker] Actualización disponible:', event.data.version);
            // Opcional: mostrar notificación al usuario
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Adminis Go', {
                body: 'Hay una nueva versión disponible. La app se actualizará automáticamente.',
                icon: '/favicon-96x96.png',
                tag: 'app-update',
                requireInteraction: false
              });
            }
            
            // Forzar actualización inmediata
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
          
          if (event.data && event.data.type === 'SW_UPDATED') {
            console.log('[Service Worker] Actualizado a versión:', event.data.version);
            // Recargar la página para usar la nueva versión
            window.location.reload();
          }
        });
        
        // Detectar cuando hay un nuevo Service Worker esperando
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible
              console.log('[Service Worker] Nueva versión instalada, actualizando...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          });
        });
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
