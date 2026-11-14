# Navegación y estilo

**Estado:** implementado  
**Actualizado:** 2026-11-13

No es un módulo de permiso. Es el shell que comparten las pantallas autenticadas.

## Shell

- `Layout` envuelve las páginas de negocio. El sidebar sale de `components/layout/Sidebar.jsx`.
- Las tarjetas del menú salen de `utils/inicioNavCards.js` (`buildInicioNavCards`), filtradas por `puedeModulo` y por dueño.
- El dueño ve Usuarios, Otros costos y Configuraciones aunque no están en `app_modulos`.
- Ventas rápidas no está en el sidebar. Se entra por la tarjeta de Inicio o por el atajo del encabezado de Ventas.
- Inventario no se ofrece como tarjeta operativa. La ruta `/inventario` existe y muestra “en desarrollo”.
- El botón de contraer el menú está en el pie del sidebar.
- Marca: `public/marca/alien-cabeza.png` en el menú y `public/marca/alien-brillo.png` en el encabezado. Fondo transparente. Rótulo Kiosco / Aliens y AdminisGo. Componente `KioscoAliensMark.jsx`.
- Encabezados de módulo: `ModuleGlassPageHeader.jsx` (resplandor naranja, alien, «Kiosco Aliens»). Los atajos del módulo van en esa barra. El correo abre el menú de cerrar sesión y, con sesión, muestra «Sincronizado». La barra solo se compacta al hacer scroll si, después de achicarse, la página sigue teniendo recorrido. Si el listado apenas supera la ventana, compactar devolvía el scroll arriba.
- Tras el login, la primera pantalla es `/ventas` si hay permiso. `AdminRoute`, si el usuario no es dueño, redirige a `/dashboard` aunque no tenga ese módulo.

## Tema

- Oscuro fijo. `main.jsx` pone `data-theme="dark"` en `<html>` y borra `localStorage.tema`.
- No hay conmutador a claro. `configuracion_comercio.tema` puede nacer en `'claro'`; la UI no lo usa al arrancar.
- Tokens en `styles/variables.css`. Acento `#FF861C`, tinta sobre naranja `#161616`, fondos de app en `estiloTemaOscuro.css` (`--bg-app: #101010`, sidebar `#151515`).
- Verde, rojo y ámbar de estado no se recoloraron con el naranja de marca.
- Tipografía Inter. Iconos Bootstrap Icons. Componentes comunes en `components/common` (Button, Card, Modal, Alert, Badge, Input, Spinner, Pagination).
- Listados comparten `styles/registros-seccion.css`. Paneles de vidrio: `appModuleGlassPanels.css` y `ModuleGlassPageHeader.css`.

## PWA

- `site.webmanifest` y `public/sw.js`. El service worker se registra solo fuera de `import.meta.env.DEV`. En desarrollo se desregistra y se limpian caches.
- Estrategia network-first con caché de assets del mismo origen. No hay cola offline ni IndexedDB de ventas. Sin red puede verse el shell cacheado o un HTML de “sin conexión”.
- `usePWAInstall` ofrece la instalación. No afirmar desde el repo que la versión `2.6` del worker sea la de producción.

## Conexiones

Cada ficha de módulo indica su CSS propio. Un cambio de token en `variables.css` o de `data-theme` afecta a todas las pantallas autenticadas y hay que revisar ventas, compras, listados, dashboard e inicio.

## Archivos

`components/layout/Sidebar.jsx`, `Sidebar.css`, `Layout.css`, `ModuleGlassPageHeader.jsx`, `ModuleGlassPageHeader.css`, `KioscoAliensMark.jsx`, `utils/inicioNavCards.js`, `styles/variables.css`, `styles/estiloTemaOscuro.css`, `main.jsx`, `public/sw.js`.
