# Módulo: Inicio

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** cualquier sesión. No tiene código en `app_modulos`.

## Qué hace

Panel de navegación de Kiosco Aliens. No opera datos de negocio: arma tarjetas según permisos.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/inicio` | `InicioHub`. Tarjetas de módulos |
| `/inicio/referencias` | `InicioReferencias`. Categorías, marcas, clientes, proveedores y productos |

`InicioLayout` envuelve ambas. El contenido ocupa el ancho libre a la derecha del sidebar.

## Funciones

- `buildInicioNavCards(puedeModulo, isAdmin)` arma Dashboard, Referencias (si hay al menos un catálogo), Usuarios y Configuraciones y Otros costos (solo dueño), Compras, Ventas, Ventas rápidas, Reportes y Mantenimiento.
- Tonos de tarjeta en ciclo `cyan`, `violet`, `emerald`.
- Si el usuario no tiene ningún módulo, un aviso pide que el dueño habilite permisos en Usuarios.
- `buildReferenciasHubCards` repite el mismo criterio para el subpanel. `firstReferenciasPath` elige el primer catálogo permitido en el orden del sidebar.
- Título del documento en el hub: `Kiosco Aliens · Inicio`.
- Encabezado con resplandor, alien y, con sesión, «Sincronizado» más el correo (`InicioHeroUserActions`).

## Estilos

`pages/inicio/InicioApp.css`. Comparte marca y banner con `navegacion-y-estilo.md`. No usa las tablas de `registros-seccion.css`.

## Conexiones

Lee solo `AuthContext` (`puedeModulo`, `isAdmin`). Cada tarjeta navega al módulo correspondiente. No escribe en Supabase.

## Archivos

`pages/inicio/InicioHub.jsx`, `InicioReferencias.jsx`, `InicioLayout.jsx`, `InicioHeroUserActions.jsx`, `InicioApp.css`, `utils/inicioNavCards.js`.
