# Base de datos y reglas

**Actualizado:** 2026-11-13  
**Motor:** PostgreSQL en Supabase. No hay backend propio de negocio. El navegador usa la anon key, PostgREST y RLS. La service role no va en el frontend.

Las migraciones están en `database/migrations/` (001 a 047). No hay un runner al clonar el repo: se aplican en orden en el SQL Editor. El repo no prueba qué número está aplicado en el remoto. Consta que 045 y 046 se ejecutaron en Supabase el 11 de octubre de 2026. `sql/` son parches de datos, no migraciones. `database/README.md` se detiene en la 011 y no describe el esquema actual.

## Cómo se aísla cada comercio

1. Casi toda fila de negocio lleva `comercio_id`.
2. Triggers `BEFORE INSERT` completan `comercio_id` si viene vacío (`get_user_comercio_id()`).
3. RLS: la fila pertenece al comercio del `auth.uid()` y, en tablas operativas, al permiso de módulo.
4. Borrados de negocio relevantes usan `deleted_at`. `updated_at` se mantiene con triggers.
5. El dueño se reconoce por `roles.nombre = 'dueño'`, no por un flag.

`usuario_tiene_permiso_modulo(codigo)` es true si el usuario es dueño o si `comercio_rol_modulos.permitido` es true para su rol. El rol dueño no tiene filas en esa matriz. Tiene que seguir existiendo al menos un dueño activo.

## Permiso de RLS por tabla

| Tablas | Condición extra |
| --- | --- |
| `categorias`, `marcas`, `productos`, `producto_imagenes`, `producto_codigos_barras`, `movimientos_inventario` | módulo `categorias`, `marcas` o `productos` según la tabla. Movimientos e imágenes usan `productos` |
| `clientes` | `clientes` |
| `proveedores` | `proveedores` |
| `ventas`, `venta_items`, `venta_pagos` | `ventas` o `reportes` |
| `compras`, `compra_items`, `compra_pagos` | `compras` o `reportes` |
| `historial_cajas` | `ventas_rapidas` en la política de la 038 |
| `otros_costos` | `usuario_es_dueno()` |
| `comercio_rol_modulos` | lectura del comercio; escritura solo dueño |
| `terminos_condiciones`, `politica_privacidad` | lectura pública de la versión activa |
| `formas_pago` | comercio del usuario |

`app_modulos` (038): dashboard, categorias, marcas, clientes, proveedores, productos, compras, ventas, ventas_rapidas, reportes, mantenimiento, inventario. Deben coincidir con `frontend/src/constants/modulosPermiso.js`.

## Tablas

### Identidad y plan

- `roles`: id, nombre único, descripcion, permisos jsonb. Datos: dueño, vendedor, cajero, almacenero.
- `planes`: nombre, precios, límites de productos, usuarios y almacenes, funcionalidades jsonb. La UI de cambio de plan muestra gratis, basico y personalizado.
- `comercios`: nombre, dirección, teléfono, email, cuit_rut, logo, condición IVA, plan_id, activo, `deleted_at`.
- `usuarios`: `id` = `auth.users.id`, comercio_id, nombre, email único, teléfono, dirección (027), foto, rol_id, activo, `deleted_at`.
- `suscripciones`: plan, fechas, estado, método de pago.
- `solicitudes_personalizadas`, `planes_personalizados`: plan a medida y facturación (015, 022).
- `admins_globales`, `notificaciones_admin`: plataforma, no el día a día del comercio.
- `usuarios_adicionales`, `historial_cambios_usuario`: flujo anterior. El alta vigente es la invitación por Edge Function.

### Catálogo

- `categorias`: nombre, descripción, imagen, `categoria_padre_id`, activo. Sin `deleted_at` en el esquema inicial.
- `marcas`: nombre, descripción, logo, activo.
- `proveedores`: razón social, contacto, CUIT, condiciones, plazo, `deleted_at`.
- `clientes`: documento, saldos de la tabla original (`saldo_pendiente`, `total_compras`, `ticket_promedio`), `preferible` (043), `deleted_at`. La cuenta corriente de la UI no usa `saldo_pendiente` como saldo vivo.
- `productos`: códigos, nombre, categoría, marca, precios, `stock_actual`, `stock_minimo`, unidad, proveedor, `preferible` (043), activo, `deleted_at`. Unicidad `(comercio_id, codigo_barras)` y de `codigo_interno` (007).
- `producto_codigos_barras` (046): producto, comercio, codigo, observacion, orden. Único `(comercio_id, codigo)`.
- `producto_imagenes`: url, orden, es_principal.
- `formas_pago` (043): nombre y código. Un solo preferido por comercio, igual que cliente y producto preferibles.

### Operación

- `ventas`: ticket, cliente, usuario, fecha, subtotal, descuento, impuestos, total, `metodo_pago`, estado (`completada` por default), facturación y montos pagado/deuda (011), `deleted_at`.
- `venta_items`: producto, cantidad, precio, descuento, subtotal. Borrado en cascada con la venta.
- `venta_pagos`: método, monto, fecha, `anulado_at` (047). Al insertar, actualizar o borrar, un trigger actualiza `monto_pagado` y `monto_deuda` y no suma filas con `anulado_at`. Sin filas, el cliente escribe esos montos.
- `compras`: número de orden, proveedor, fechas de orden y recepción, totales, estado (`pendiente`, y la UI usa `recibida` y `cancelada`), `deleted_at`.
- `compra_items`: cantidad solicitada y recibida, precio, subtotal.
- `compra_pagos`: análogo a los pagos de venta, con `anulado_at` (047). El trigger de montos ignora el pago anulado.
- `historial_cajas`: apertura/cierre, importe y desglose efectivo, virtual, crédito y otros (014 y 032).
- `ventas_rapidas`: creada en 014 y eliminada en 035. No recrearla.
- `otros_costos`: tipo enum Fijo, Variable, Inversión, descripción, costo ≥ 0. Borrado físico desde la UI.
- `movimientos_inventario`: declarada y sin uso en el frontend.

### Configuración y legal

- `configuracion_comercio`: IVA, descuentos, stock automático, formatos, zona horaria, tema (default `claro`; la app arranca en oscuro), idioma, `config_impresoras` jsonb (042). Una fila por comercio.
- `configuracion_usuario`: tema, idioma, notificaciones. Una fila por usuario.
- `terminos_condiciones`, `politica_privacidad`, `consentimientos`.

### Vista

`v_rentabilidad_mensual` (037, reemplazada en 043), `security_invoker`.

- Ingresos: ventas sin `deleted_at` y con `estado <> 'cancelada'`.
- Costo: `compras.total` sin `deleted_at`, por `fecha_orden`. No excluye estado `cancelada`.
- Gastos: otros costos Fijo y Variable por `created_at`. Inversión no entra.
- El `EXTRACT` de `timestamptz` usa la zona de la sesión del servidor.

## Funciones y RPC que el front usa

| Nombre | Uso |
| --- | --- |
| `get_user_comercio_id()` | RLS y triggers |
| `usuario_tiene_permiso_modulo` | RLS de catálogos |
| `usuario_permiso_ventas_o_reportes`, `usuario_permiso_compras_o_reportes` | RLS de operación |
| `usuario_es_dueno()` | Otros costos y escrituras de dueño |
| `ventas_listado_unidades_agg` | Unidades del listado de ventas. La 040 la pasa a security definer porque con invoker devolvía 500 |
| `mantenimiento_listar_esquema` | Pantalla de mantenimiento |
| `validar` límites de ventas y usuarios | Servicios de planes, vía RPC |
| `verificar_pago_mercadopago`, `cancelar_suscripcion_mercadopago` | Cliente de Mercado Pago. Despliegue remoto no confirmado por el repo |
| `crear_comercio_y_usuario` | Sin `EXECUTE` para `anon` ni `authenticated` desde la 045. No llamarla desde el cliente |

Edge Functions (`verify_jwt = false` en el gateway; cada función valida el JWT adentro): `create-comercio-user`, `sync-usuario-invite`, `eliminar-cuenta-comercio`.

Storage de imágenes (migración 004) se crea desde la UI de Supabase, no solo con SQL.

## Reglas al cambiar el esquema

- Toda tabla nueva de negocio lleva `comercio_id`, RLS con `get_user_comercio_id()` y, si es operativa, el permiso de módulo que corresponda.
- Una migración nueva sigue `database/migrations/NNN_*.sql`. No se mezclan parches de `sql/`.
- Los códigos de `app_modulos`, `MODULO_CODIGOS` y las rutas `PermissionRoute` se cambian juntos.
- El stock de pantalla es `productos.stock_actual`. Ventas lo descuentan al crear o editar y lo reponen al cancelar o al soft delete, con piso 0. Compras lo suman al recibir y lo restan al cancelar una orden recibida, con piso 0. Esos updates los hace el cliente, no un trigger de stock.
- Cancelar una venta la deja visible y la saca de la rentabilidad. Borrar una venta es `deleted_at` y también repone stock.
- Un solo preferible por comercio en clientes, productos y formas de pago.
- Listados grandes de ventas: paginar en el servidor y no embeber `clientes` ni `usuarios` en el `select` paginado.
- No presentar como hecho lo que solo está en `Guias_Inicio/` o en el README de la raíz.
- No copiar a documentación contraseñas, tokens, service role ni claves.

## Panel local

`local-admin-template/` consulta la base con service role y salta RLS. La copia con secretos es `local-admin/` y está en `.gitignore`. No exponer el puerto 3847. RPC de apoyo: migraciones 033 y 034.
