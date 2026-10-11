# Memoria técnica y funcional — Adminis Go

**Actualizado:** 11 de octubre de 2026  
**Alcance de esta revisión:** código, migraciones SQL y la pantalla de acceso de Alien’s. No se consultó el proyecto remoto de Supabase ni se aplicó la migración 045.

Esta memoria es la referencia para retomar implementaciones. `README.md`, `database/README.md` y varios archivos de `Guias_Inicio/` describen etapas anteriores o propuestas. Si contradicen el código, prevalece el código y, después de cada cambio, esta memoria.

## 1. Objetivo y alcance

Adminis Go es una aplicación web (PWA) para que un comercio chico o mediano opere ventas, compras, catálogo, clientes, proveedores, caja, informes y la configuración de su propio negocio desde un solo sistema.

El modelo es **multi-comercio**: cada comercio ve solo sus datos. Hay planes de suscripción (gratuito, de pago y personalizado) y cobro previsto con Mercado Pago. La interfaz está en español y el formato de dinero usado en pantallas de ventas e informes es el de Argentina.

**Incluido y usable en el código actual**

- Acceso de Alien’s · Kiosco/Bebidas (correo y contraseña, recuperación de contraseña, explicación de que el identificador es el correo). El botón de Google queda en la pantalla; el proveedor hay que activarlo en Supabase.
- Invitación de usuarios por el dueño. El registro público de la interfaz redirige al acceso.
- Catálogos: categorías, marcas, productos, clientes (con cuenta corriente) y proveedores.
- Compras con ítems, pagos y efecto sobre el stock del producto.
- Ventas (punto de venta, listado, detalle, edición, cancelación), venta rápida y caja.
- Dashboard, informes (ventas, compras, balances, rentabilidad) y otros costos del dueño.
- Usuarios del comercio, roles y permisos por módulo.
- Configuración del comercio, impresoras de ticket, formas de pago y cambio de plan.
- Mantenimiento: catálogo del esquema y exportación a Excel.
- Páginas públicas de términos y privacidad.
- Landing, manifiesto PWA y service worker de caché estática en producción.

**Presente en base, pero no como módulo operativo**

- La ruta `/inventario` muestra una pantalla de “en desarrollo”.
- La tabla `movimientos_inventario` existe desde el esquema inicial. El frontend no escribe en ella: el stock se actualiza directo en `productos.stock_actual`.

**Propuesto en guías y no confirmado como implementado**

- App nativa, multi-almacén, impresoras fiscales, API pública para terceros, modo offline de datos de negocio, multi-idioma y sincronización con resolución de conflictos. Esas ideas están en `Guias_Inicio/Guias Iniciales/DESCRIPCION_PROYECTO.md` (documento de propuesta, enero 2026). No tratarlas como funciones terminadas.

**Para quién:** dueño del comercio (acceso total) y personal con rol vendedor, cajero o almacenero, según la matriz de permisos de ese comercio.

## 2. Tecnologías y arquitectura

No hay un backend propio de negocio. El navegador habla con Supabase (PostgreSQL, Auth, Storage y Edge Functions). Vercel hospeda el frontend y dos rutas serverless de Mercado Pago.

| Capa | Qué hay en el repo |
| --- | --- |
| Interfaz | React 19, Vite 7, React Router 7, Bootstrap 5, Bootstrap Icons, Recharts, react-hook-form, Yup |
| Datos y auth | `@supabase/supabase-js`. Cliente en `frontend/src/services/supabase.js` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` |
| Estado | Contextos de React (`AuthContext`, `DateTimeContext`, `TicketPrintContext`). Zustand está en `package.json` y no se usa en `frontend/src` |
| Exportación | ExcelJS, jsPDF, jspdf-autotable, html2canvas |
| Pagos de suscripción | SDK `mercadopago` solo en rutas de `frontend/api/` (token de acceso en el servidor de Vercel, no en el cliente) |
| Base | SQL manual en `database/migrations/` (001 a 044). No hay un runner que las aplique al clonar el repo |
| Funciones de servidor | `supabase/functions/`: invitar usuario, sincronizar invitado, eliminar cuenta |
| Hosting del front | `frontend/vercel.json` reescribe las rutas de la SPA a `index.html` |
| Panel local de seguimiento | `local-admin-template/`. La copia con secretos vive en `local-admin/` y está en `.gitignore` |

```
Navegador (React)
  ├─ Supabase Auth + PostgREST (anon key, RLS)
  ├─ Edge Functions (invitar, sincronizar, borrar cuenta)
  └─ /api/mercadopago/* y /api/webhooks/mercadopago (Vercel)
         └─ Mercado Pago
PostgreSQL (public) con comercio_id y RLS
```

Organización del repositorio:

| Ruta | Responsabilidad |
| --- | --- |
| `frontend/` | Aplicación. Páginas en `src/pages`, acceso a datos en `src/services`, shell en `src/components/layout` |
| `frontend/api/` | Preferencia y webhook de Mercado Pago |
| `frontend/public/` | Manifiesto, íconos, `sw.js` |
| `database/migrations/` | Evolución del esquema. Aplicar en orden en el SQL Editor de Supabase |
| `supabase/` | Configuración del CLI y Edge Functions. `verify_jwt = false` en el gateway: cada función valida el JWT adentro |
| `scripts/` | Utilidades de importación (`import-categorias.mjs`, `generate-productos-seed-sql.mjs`). Usan `scripts/.env`, ignorado por git |
| `sql/` | Scripts puntuales de datos (categorías, marcas, productos, un comercio concreto). No forman la cadena de migraciones |
| `local-admin-template/` | Panel en `http://127.0.0.1:3847` con service role, solo en la PC |
| `Guias_Inicio/` | Guías de arranque, deploy, Mercado Pago y estilo. Pueden estar desactualizadas |
| `docs/MEMORIA_PROYECTO.md` | Esta memoria |

El `README.md` de la raíz dice “Fase 0” y “React 18”. Eso no describe el estado del código en octubre de 2026.

## 3. Módulos y funcionalidades

La navegación autenticada sale de `frontend/src/utils/inicioNavCards.js` y del sidebar. Tras el login, `AuthContext` manda primero a `/ventas` si el usuario tiene ese módulo.

El dueño entra a Usuarios, Otros costos y Configuraciones aunque esos ítems no están en `app_modulos`. El resto de los módulos se filtra con `puedeModulo`.

### Autenticación

Rutas públicas de acceso: `/` y `/auth/login` (la misma pantalla), `/auth/forgot-password`, `/auth/olvide-usuario`, `/reset-password`, `/auth/callback`, `/terminos`, `/privacidad`.

`/auth/register`, `/auth/select-plan` y `/auth/complete-registration` redirigen a `/`. `signUp` en el cliente no llama a Supabase. La landing comercial ya no es la ruta raíz. El archivo `LandingPage.jsx` quedó sin ruta.

Esta instalación opera para Alien’s · Kiosco/Bebidas. El esquema sigue siendo multi-comercio: no se borraron tablas ni comercios. El alta de un comercio nuevo desde el navegador queda cerrada en la interfaz y, después de aplicar la migración 045, también el `EXECUTE` de `crear_comercio_y_usuario` para `anon` y `authenticated`.

El identificador de ingreso es el correo. No hay nombre de usuario aparte. “Olvidé mi usuario” solo lo explica y no consulta ni muestra correos.

Google usa `signInWithOAuth` y vuelve a `/auth/callback`. Entrar con Google no crea comercio ni rol. Si no hay fila activa en `usuarios` (o no se puede sincronizar una invitación), la sesión se cierra y se muestra un aviso. La sincronización de un invitado solo corre si `app_metadata.invited` y `app_metadata.comercio_id` fueron escritos por `create-comercio-user`. El cliente no puede fijar ese metadata.

Hasta que se aplique la 045 y se redesplieguen las Edge Functions, el cierre en el servidor no está activo en el proyecto remoto.

### Inicio

`/inicio` es un panel de tarjetas según permisos. `/inicio/referencias` agrupa categorías, marcas, clientes, proveedores y productos.

### Referencias (catálogos)

CRUD de categorías, marcas, clientes, proveedores y productos, cada uno con permiso de módulo propio.

- Productos: precio, stock, categoría, marca, proveedor, flag `preferible` (uno por comercio). El formulario ya no muestra código interno; la columna y su unicidad (007) siguen. La categoría es obligatoria al guardar. El stock del alta vacío queda en 0; en la edición no se reescribe si el campo no se tocó.
- Varios códigos de barras por producto, con observación opcional, viven en `producto_codigos_barras` (migración 046, aplicada en Supabase el 2026-10-11; la consulta de conflictos devolvió 0 filas). El primer código se copia a `productos.codigo_barras` para el único y las consultas viejas. Ventas, compras, el listado y el PDF buscan por cualquiera de los códigos. El listado de productos muestra, junto al nombre, las observaciones de cada código. Si la búsqueda coincide con un código, la columna deja solo la observación de ese código. Dar de baja un producto conserva el historial y libera sus códigos. Si un código quedó en un producto ya inactivo, al guardarlo en otro producto activo se libera solo.
- Hay calculadora de precio de venta y, en categorías, exportación PDF del listado.
- Clientes: ficha y `/clientes/:clienteId/cuenta-corriente` (deuda a partir de ventas).
- Proveedores: ficha y `/proveedores/:id/compras`. El resumen usa la misma ficha que la cuenta corriente del cliente (iniciales, estado, saldo actual, mes, tipo, búsqueda, libro con saldo arrastrado y totales del mes). Las columnas son cargo de la compra, pago, resto de la orden y saldo. El pago sigue registrándose en la orden. El listado recuerda búsqueda y página.
- Un cliente y un producto pueden marcarse como preferibles para el POS (migración 043).

### Compras

`/compras`, alta, detalle y edición. Ítems, pagos (`compra_pagos`) y estados. Al recibir, el servicio suma `stock_actual`; al revertir, lo descuenta sin bajar de cero. El `comercio_id` lo asigna un trigger.

### Ventas (módulo principal)

La UI vigente de `/ventas` está en `frontend/src/pages/ventas-prueba/` y `frontend/src/components/ventas-prueba/`. El nombre “prueba” es histórico. `/ventas-prueba` redirige a `/ventas`.

| Ruta | Pantalla |
| --- | --- |
| `/ventas` | Listado, filtros, KPIs del día, paginación 10/25/50/100 |
| `/ventas/nueva` y `/ventas/:id/editar` | POS (`VentaDetalladaPrueba`) |
| `/ventas/:id` | Detalle (`pages/ventas/VentaDetalle.jsx`) |
| `/ventas/rapida` | Venta rápida de esta UI. Atajo F2 desde el listado |
| `/ventas/caja` | Apertura y cierre |

La barra de ventas enlaza a clientes, productos, categorías, compras, caja, venta rápida y nueva venta. El modal de consulta de producto muestra stock y precio y puede actualizar `precio_venta`.

Persistencia: tablas `ventas`, `venta_items` y `venta_pagos`. No existe la tabla `ventas_rapidas` (eliminada en la migración 035). Servicios `ventas.js` y `ventasRapidas.js` leen y escriben `ventas`.

Comportamiento de stock y estado, según `frontend/src/services/ventas.js`:

- Crear o editar una venta ajusta `productos.stock_actual` en el cliente. El stock no queda negativo: se guarda 0.
- Cancelar deja la venta visible, no toca el stock y la rentabilidad mensual la excluye (`estado <> 'cancelada'`).
- Eliminar es soft delete (`deleted_at`) y restaura stock.

El listado de `/ventas` usa `fetchVentasRegistros` (`ventasListado.js`): página en el servidor, sin un rango de tres meses obligatorio. Los KPIs de esa pantalla piden el día de hoy vía `getVentas`. `getVentas`, si no recibe ambas fechas, limita a los últimos tres meses. Esa función sigue usándose en dashboard y otros consumos. La guía `Guias_Inicio/inicio-local/DESARROLLO_LOCAL.md` todavía nombra `pages/ventas/VentasList.jsx` y un rango por defecto de tres meses en el listado: ese archivo ya no está y el listado actual no aplica ese rango si los filtros van vacíos.

`getVentas` intenta la RPC `ventas_listado_unidades_agg` (migraciones 039, 040 y 041). Si falla, lee `venta_items` por lotes. Los listados paginados no embeben `clientes` ni `usuarios` en el `select` de `ventas`; hidratan los nombres aparte para evitar errores 500 de PostgREST con offsets grandes.

### Ventas rápidas y caja (ruta histórica)

`/ventas-rapidas` y `/ventas-rapidas/:id` siguen enrutados (`pages/ventas/VentasRapidas.jsx`). También leen `ventas`. `/ventas-rapidas/historial` es el historial de caja. Permiso: módulo `ventas_rapidas`; caja y venta rápida de `/ventas` aceptan `ventas` o `ventas_rapidas`.

La caja usa `historial_cajas` (apertura/cierre). La migración 032 agrega desglose: efectivo, virtual (QR, transferencia, débito), crédito y otros.

### Dashboard

`/dashboard`. KPIs, filtros de fecha, serie de evolución, tortas, productos destacados, estados de ventas y compras, stock, alertas, últimos movimientos y exportación PDF/Excel. Muestra el plan de la suscripción. Los cálculos están en el cliente a partir de consultas a Supabase (`useDashboardData.js`).

### Informes

`/reportes`, cuatro pestañas implementadas: ventas, compras, balances y rentabilidad. El comentario al inicio de `ReportesPage.jsx` dice que el contenido está pendiente; las pestañas ya renderizan paneles. La rentabilidad usa la vista `v_rentabilidad_mensual` (ingresos de ventas no canceladas, costo de compras y gastos fijos/variables de `otros_costos`).

Quien tiene permiso de `reportes` también puede leer ventas o compras en RLS aunque no tenga el módulo operativo (`usuario_permiso_ventas_o_reportes` y el equivalente de compras).

### Otros costos

`/otros-costos`, solo dueño (`AdminRoute` y RLS con `usuario_es_dueno()`). Tipos: Fijo, Variable, Inversión. Fijos y variables entran en la rentabilidad; la vista no suma Inversión.

### Usuarios y permisos

`/usuarios`, `/usuarios/nuevo`, `/usuarios/permisos`. Solo dueño.

El alta no pide contraseña: la Edge Function `create-comercio-user` invita por email. El invitado define la clave al aceptar.

La matriz `comercio_rol_modulos` no guarda filas del rol dueño: el dueño siempre tiene acceso. No se puede dejar al comercio sin un dueño activo.

### Configuración

`/configuraciones` (solo dueño): datos del comercio, perfil, contraseña, zona horaria, formato de fecha, plan, formas de pago, impresoras de ticket y eliminación de cuenta (Edge Function `eliminar-cuenta-comercio`).

`/configuracion/cambiar-plan` lista solo planes `gratis`, `basico` y `personalizado`. El pago del plan usa `crearPreferenciaPago` contra `/api/mercadopago/crear-preferencia`.

### Mantenimiento

`/mantenimiento` exige el módulo `mantenimiento`. Lista tablas y columnas con la RPC `mantenimiento_listar_esquema` (migración 044) y exporta una selección a Excel. Sin esa función en Supabase, el listado no puede armarse.

### Inventario

Ruta protegida por permiso, pantalla `EnDesarrollo`. No hay flujo de ajustes, transferencias ni historial de movimientos en la UI.

### Pagos de la suscripción

Código de Mercado Pago: `frontend/src/services/mercadopago.js`, `frontend/api/mercadopago/crear-preferencia.js`, `frontend/api/webhooks/mercadopago.js`, y RPCs `verificar_pago_mercadopago` / `cancelar_suscripcion_mercadopago` llamadas desde el cliente. El token no debe ir al frontend. Si esas RPC o las variables de Vercel están desplegadas no se puede confirmar desde el repo.

### Páginas de prueba

`/test/servicios`, `/test/servicios-nuevos` y `/test/firma-canvas` existen, con login. No son módulos de negocio.

### PWA

`site.webmanifest`, registro de `sw.js` solo fuera de `import.meta.env.DEV`, y `usePWAInstall`. En desarrollo el service worker se desregistra. La estrategia es network-first con caché de assets del mismo origen. No hay cola offline ni IndexedDB de ventas. Sin red, la navegación puede mostrar el shell cacheado o un HTML de “sin conexión”.

## 4. Datos y seguridad

### Entidades

Esquema inicial (`001_initial_schema.sql`), más lo que agregan las migraciones:

- Identidad: `roles`, `comercios`, `usuarios` (`id` = `auth.users.id`), `admins_globales`.
- Planes: `planes`, `suscripciones`, `solicitudes_personalizadas`, `planes_personalizados`.
- Catálogo: `categorias`, `marcas`, `productos`, `producto_imagenes`, `proveedores`, `clientes`.
- Operación: `ventas`, `venta_items`, `venta_pagos`, `compras`, `compra_items`, `compra_pagos`, `historial_cajas`, `formas_pago`, `otros_costos`.
- Inventario declarado: `movimientos_inventario` (sin uso en el frontend).
- Configuración: `configuracion_comercio` (incluye `config_impresoras` jsonb), `configuracion_usuario`.
- Legal y admin de plataforma: `terminos_condiciones`, `politica_privacidad`, `consentimientos`, `notificaciones_admin`.
- Usuarios extra: `usuarios_adicionales`, `historial_cambios_usuario`.
- Permisos: `app_modulos`, `comercio_rol_modulos`.

Casi toda fila de negocio lleva `comercio_id`. Borrados de negocio relevantes usan `deleted_at`. `updated_at` se mantiene con triggers.

`formas_pago`, `clientes.preferible` y `productos.preferible` admiten un solo preferido por comercio (triggers de la 043).

### Roles

Cargados en `002_initial_data.sql`: `dueño`, `vendedor`, `cajero`, `almacenero`. El dueño se detecta por el nombre del rol, no por un flag.

Módulos de `app_modulos` (038): dashboard, categorias, marcas, clientes, proveedores, productos, compras, ventas, ventas_rapidas, reportes, mantenimiento, inventario. Deben coincidir con `frontend/src/constants/modulosPermiso.js`.

Al crear un comercio se siembran permisos en true para todos los roles que no son dueño.

### Cómo se aplica el acceso

1. Supabase Auth (JWT, sesión en `localStorage`).
2. RLS: `get_user_comercio_id()` y, desde la 038, `usuario_tiene_permiso_modulo` en las tablas operativas.
3. Rutas: `ProtectedRoute`, `PermissionRoute` (basta un módulo de la lista) y `AdminRoute` (solo dueño).
4. Triggers `BEFORE INSERT` completan `comercio_id` si viene vacío.

`AdminRoute`, si el usuario no es dueño, redirige a `/dashboard` aunque ese usuario no tenga permiso de dashboard.

La service role no va en el frontend. El panel `local-admin` la usa solo en local y salta RLS: no exponer el puerto 3847 ni commitear `local-admin/` ni `.env`.

Las Edge Functions de `config.toml` no verifican JWT en el gateway; el control está en el código de cada función. Hay que mantener esa validación al modificarlas.

### Planes

`002` inserta gratis, basico, pro y premium. `015` redefine gratis y basico (límites de ventas y usuarios, plan personalizado, solicitudes) y no borra pro ni premium. `025` pasa el plan `basico` a 25000 ARS mensuales y 250000 ARS anuales. La pantalla de cambio de plan solo ofrece gratis, basico y personalizado. Si pro y premium siguen en la base remota, la UI actual no los muestra.

### Sincronización

No hay sincronización offline de datos. La única “sync” de producto es `sync-usuario-invite`: crear la fila `usuarios` del invitado en el primer ingreso.

No se puede afirmar desde el repo qué migraciones ya corrieron en Supabase. El orden del archivo no garantiza que el remoto esté al día.

## 5. Archivos clave

| Área | Dónde mirar |
| --- | --- |
| Rutas | `frontend/src/App.jsx` |
| Acceso Alien’s | `frontend/src/pages/auth/Login.jsx`, `AccesoShell.jsx`, `ForgotPassword.jsx`, `OlvideUsuario.jsx`, `ResetPassword.jsx`, `AuthCallback.jsx`; imagen `frontend/public/acceso/fondo-aliens.png` (original en `docs/fondo_pantalla_login.png`) |
| Sesión y permisos de UI | `frontend/src/context/AuthContext.jsx`, `frontend/src/services/auth.js`, `frontend/src/services/permisos.js`, `frontend/src/constants/modulosPermiso.js`, `frontend/src/components/common/PermissionRoute.jsx`, `AdminRoute.jsx` |
| Menú | `frontend/src/components/layout/Sidebar.jsx`, `frontend/src/utils/inicioNavCards.js` |
| Cliente Supabase | `frontend/src/services/supabase.js` |
| Ventas | `frontend/src/services/ventas.js`, `ventasListado.js`, `ventasRapidas.js`, `caja.js`, `formasPago.js`; UI en `pages/ventas-prueba/` y detalle en `pages/ventas/VentaDetalle.jsx` |
| Compras y stock de recepción | `frontend/src/services/compras.js`, `pages/compras/` |
| Catálogos | `services/productos.js`, `clientes.js`, `categorias.js`, `marcas.js`, `proveedores.js` y sus páginas |
| Informes y rentabilidad | `pages/reportes/`, `services/rentabilidad.js`, vista en migraciones 037 y 043 |
| Dashboard | `pages/dashboard/` |
| Tickets | `context/TicketPrintContext.jsx`, `services/configImpresoras.js`, `pages/configuracion/ConfigImpresorasSection.jsx`, migración 042 |
| Usuarios | `pages/usuarios/`, `services/usuarios.js`, `usuariosAdicionales.js`, `supabase/functions/create-comercio-user`, `sync-usuario-invite`, guía `database/migrations/028_invitar_usuario_y_sync.md` |
| Planes y Mercado Pago | `services/planes.js`, `mercadopago.js`, `pages/configuracion/CambiarPlan.jsx`, `frontend/api/` |
| Mantenimiento | `pages/mantenimiento/`, `services/mantenimiento.js`, migración 044 |
| Esquema y RLS | `database/migrations/001_initial_schema.sql`, `003_row_level_security.sql`, `038_comercio_rol_modulos_permisos.sql` |
| Arranque local | `Guias_Inicio/inicio-local/DESARROLLO_LOCAL.md` (comandos vigentes; el párrafo del listado de ventas está viejo) |
| Seguimiento de la base en la PC | `local-admin-template/README.md`, migraciones 033 y 034 |

## 6. Ejecución y validación

Requisitos vistos en el repo y en la guía local: Node.js con npm, cuenta de Supabase, archivo `frontend/.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Esas variables no se commitean.

Desde `frontend/`:

| Objetivo | Comando |
| --- | --- |
| Instalar | `npm install` |
| Desarrollo | `npm run dev` (Vite; la guía indica `http://localhost:5173`) |
| Compilar | `npm run build` |
| Previsualizar el build | `npm run preview` |
| Lint | `npm run lint` |

No hay script `test` ni suite automatizada en `package.json`.

Para ver datos hace falta haber aplicado las migraciones en el proyecto de Supabase, en orden numérico, y tener un usuario con comercio. Storage (migración 004) se crea desde la UI de Supabase, no solo con SQL.

Edge Functions, si se tocan: `supabase functions deploy` de la función correspondiente, con el proyecto ya enlazado. No commitear el project ref como secreto; `supabase/.temp/` es estado local del CLI.

Panel de seguimiento: copiar `local-admin-template` a `local-admin`, completar `.env` con URL y service role, `npm install` y `npm start`.

Producción: el frontend desplegado en Vercel sigue a lo que esté en el remoto git, no a los archivos sin push. El comentario de `mercadopago.js` menciona `https://adminisgo.com`; este documento no verifica que ese dominio esté activo.

## 7. Decisiones y reglas vigentes

- Un comercio no lee datos de otro. Toda tabla nueva de negocio lleva `comercio_id`, RLS con `get_user_comercio_id()` y, si es operativa, el permiso de módulo que corresponda.
- El rol dueño no se configura en la matriz y no se le puede quitar el acceso por esa tabla. Debe seguir existiendo al menos un dueño activo.
- El acceso de esta instalación no ofrece registro público ni selector de rol. Las cuentas nuevas salen de la invitación del dueño. No usar `user_metadata` para asignar `comercio_id` o `rol_id`.
- No ejecutar `crear_comercio_y_usuario` desde el cliente. La migración 045 le quita el permiso a `anon` y `authenticated`.
- Los códigos de `app_modulos`, `MODULO_CODIGOS` y las rutas `PermissionRoute` se cambian juntos.
- Las ventas, incluidas las rápidas, se guardan en `ventas` / `venta_items` / `venta_pagos`. No recrear `ventas_rapidas`.
- Cancelar una venta no mueve stock y no debe entrar en rentabilidad. Borrar (soft delete) sí repone stock.
- El stock de pantalla es `productos.stock_actual`, actualizado desde los servicios de ventas y compras. Si se implementa inventario, definir ahí la relación con `movimientos_inventario` en lugar de sumar un tercer mecanismo en silencio.
- Un solo preferible por comercio en clientes, productos y formas de pago.
- Listados grandes de ventas: paginar en el servidor, no embeber relaciones pesadas en el `select` paginado, y no traer el historial completo sin filtro consciente.
- Tema de la app: oscuro fijo en `frontend/src/main.jsx`. No hay conmutador a claro en el arranque, aunque `configuracion_comercio.tema` nazca en `'claro'`.
- El service worker no se registra en desarrollo.
- Secretos (anon key de producción, service role, access token de Mercado Pago, `.env`, `local-admin/`) no van al repositorio ni a esta memoria.
- `sql/` son parches de datos, no migraciones. Una migración nueva sigue la numeración `database/migrations/NNN_*.sql`.
- No presentar como hecho lo que solo está en `DESCRIPCION_PROYECTO.md` o en el README de la raíz.

## 8. Estado del trabajo

**Última implementación en el working tree (11 de octubre de 2026, sin commit):** listado de proveedores alineado con clientes (tooltip de contacto, flecha y menú a las compras del proveedor, búsqueda recordada) más la ruta `/proveedores/:id/compras`. Antes, en el mismo árbol: acceso de Alien’s · Kiosco/Bebidas. En Supabase, el SQL Editor devolvió éxito al ejecutar el cierre de `crear_comercio_y_usuario` (migración 045). `SELECT public.get_user_comercio_id();` en ese editor devolvió NULL porque no hay sesión de usuario. “Allow new users to sign up” quedó apagado y guardado; “Confirm email” sigue prendido. URL Configuration tiene Site URL `https://www.adminisgo.com` y las rutas `/auth/callback` y `/reset-password` para localhost, `adminisgo.com` y `www.adminisgo.com`. El cliente OAuth de Google quedó guardado con el callback de Supabase y el dominio de marca igual a ese host. Después de corregir el `redirect_uri_mismatch`, la sesión de `mo826440@gmail.com` abrió Ventas en `http://localhost:5173/ventas` como Empleado 01. La app de Google sigue en estado Prueba. Las Edge Functions nuevas no se desplegaron: en PowerShell `supabase` no está instalado.

La última implementación ya commiteada sigue siendo la del 12 de septiembre de 2026 (“Cambiar precio desde consultar”), más el módulo de mantenimiento del mismo día.

**Pendientes confirmados en código**

- `/inventario` es un placeholder.
- `movimientos_inventario` no tiene flujo de UI.
- No hay tests automatizados.
- El comentario de `ReportesPage.jsx` quedó viejo respecto de las pestañas ya armadas.
- `DESARROLLO_LOCAL.md` describe un listado de ventas que ya no existe con ese nombre ni con ese filtro por defecto.
- `README.md` y `database/README.md` no cubren el sistema actual (el de base se detiene en la migración 011).

**No confirmado**

- Qué migraciones están aplicadas en Supabase.
- Si las Edge Functions y las variables de Mercado Pago están desplegadas.
- Si el service worker `2.6` es el que sirve producción.

**Problemas conocidos registrados en código o guías aún aplicables**

- PostgREST puede responder 500 si un listado paginado de `ventas` embebe `clientes`/`usuarios` con offsets altos. El listado actual evita ese embed.
- `ventas_listado_unidades_agg` con `SECURITY INVOKER` fallaba (500) al agregar `venta_items` bajo RLS. La 040 lo corrige con definer. Hace falta que esa migración esté aplicada; si no, el front usa el plan B.
- Sin la 044, Mantenimiento no lista el esquema.

## 9. Historial breve

| Fecha | Implementación | Áreas | Validación |
| --- | --- | --- | --- |
| 2026-10-11 | En el listado, la búsqueda por código muestra solo la observación de ese código | `ProductosList.jsx`, `codigosBarrasProducto.js` | Prueba del filtro con los tres códigos de Quento X90 |
| 2026-10-11 | El listado de productos muestra las observaciones de cada código de barras | `ProductosList.jsx`, `ProductosList.css`, `codigosBarrasProducto.js` | Vite recargó el listado. El usuario ya había confirmado el guardado de Quento X90 |
| 2026-10-11 | Un producto dado de baja libera sus códigos de barras para reutilizarlos en otro producto activo | `services/productos.js`, `ProductoForm.jsx` | El usuario guardó Quento X90 y lo encontró por el código `7798187212158` |
| 2026-10-11 | Varios códigos de barras con observación, categoría obligatoria y stock inicial opcional | `pages/productos`, `services/productos.js`, ventas, compras, PDF, migración 046 | Prueba del util de códigos y compilación del frontend. El SQL de la 046 se ejecutó en Supabase: Success, 0 filas de conflicto |
| 2026-10-11 | Proveedores: contacto en tooltip, compras del proveedor con la ficha de cuenta corriente y búsqueda recordada | `pages/proveedores`, `services/compras.js`, `App.jsx`, `moduleChromeMeta.jsx` | ESLint de la ficha. Vite recargó sin error de compilación. El recorrido con datos lo confirmó el usuario en `/proveedores/18/compras` antes de alinear la ficha |
| 2026-10-11 | Acceso Alien’s, sin registro público, Google preparado, recuperación de correo | `frontend/src/pages/auth`, `AuthContext`, rutas, Edge Functions de invitación, migración 045, `public/acceso/fondo-aliens.png` | Compilación y lint del frontend. SQL de cierre de alta visto en Supabase. Google y redirects corregidos; sesión local abrió Ventas. Funciones sin desplegar |
| 2026-10-11 | Creación de esta memoria y de la regla de mantenimiento | `docs/MEMORIA_PROYECTO.md`, `.cursor/rules/memoria-proyecto.mdc` | Contraste con código, migraciones y guías del repo |
| 2026-09-12 | Precio editable desde la consulta de producto en ventas; atajos a productos y categorías; ajuste de reinicio de sesión | Ventas (`ConsultaProductoStockModal`, toolbar, POS), `AuthContext` | No consta en el commit una corrida de tests. No hay suite en el repo |
| 2026-09-12 | Módulo Mantenimiento: catálogo de esquema y Excel | `pages/mantenimiento`, servicios, migración 044, `package.json` (exceljs) | Igual que arriba. La RPC hay que ejecutarla en Supabase para que la pantalla funcione |
| 2026-09-06 | Compras (listado, formulario, detalle, acciones) y proveedores | `pages/compras`, `pages/proveedores`, `services/compras.js` | Sin registro de tests en el commit |
| 2026-06-11 | Configuración de tickets | Impresoras / tickets. Migración 042 en el árbol (`config_impresoras`) | Sin registro de tests en el mensaje de commit |
| 2026-05 a 2026-08 | Ventas, caja, listados, PDF de precios, diseño de sidebar y header | Ventas, layout, productos | Historial git con mensajes cortos; el detalle fino está en el diff de cada commit |

Commits anteriores a mayo de 2026 no se resumen aquí. Para verlos: `git log`.
