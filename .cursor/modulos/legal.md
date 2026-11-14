# Módulo: Legal

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** público, sin login.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/terminos` | `TerminosPublic.jsx` |
| `/privacidad` | `PrivacidadPublic.jsx` |

## Funciones

- Términos: `services/terminos.js` lee `terminos_condiciones` (versión actual, una versión, o el historial).
- Privacidad: `services/politicaPrivacidad.js` lee `politica_privacidad`.
- La migración 026 permite leer las filas activas sin sesión (`Public can view active terminos` y la política equivalente de privacidad).
- Consentimientos y firma: tablas `consentimientos` (019) y servicio `consentimientos.js`, más el componente `FirmaCanvas`. El acceso vigente de Alien’s no los presenta como paso del ingreso. `/test/firma-canvas` es una página de prueba, no este módulo.

## Estilos

`pages/legal/LegalPublic.css`. Página suelta, sin sidebar. Comparte la tipografía del sistema.

## Conexiones

No escribe ventas ni clientes. Las notificaciones de admin de plataforma (`notificaciones_admin`, servicio `admin.js`) y `admins_globales` son de la plataforma, no de la pantalla pública.

## Archivos

`pages/legal/`, `services/terminos.js`, `services/politicaPrivacidad.js`, migraciones `017`, `021`, `026`.
