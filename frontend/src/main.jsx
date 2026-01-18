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

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[Service Worker] Registrado exitosamente:', registration.scope);
        
        // Verificar actualizaciones periódicamente
        setInterval(() => {
          registration.update();
        }, 60000); // Cada minuto
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
