# Módulo: Ventas

**Estado:** implementado. Es el módulo principal.  
**Actualizado:** 2026-11-13  
**Permiso:** `ventas`. Caja y venta rápida de esta UI aceptan `ventas` o `ventas_rapidas`. Quien tiene `reportes` puede leer las tablas de ventas por RLS sin abrir esta ruta.

La UI vigente está en `pages/ventas-prueba/` y `components/ventas-prueba/`. El nombre “prueba” es histórico. `/ventas-prueba` redirige a `/ventas`.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/ventas` | Listado, filtros, KPIs del día, paginación 10/25/50/100 |
| `/ventas/nueva` y `/ventas/:id/editar` | POS `VentaDetalladaPrueba` |
| `/ventas/:id` | Detalle `pages/ventas/VentaDetalle.jsx` |
| `/ventas/rapida` | Venta rápida de esta UI. Atajo F2 desde el listado |
| `/ventas/caja` | Apertura y cierre. Ver `ventas-rapidas-y-caja.md` |

La ruta `ventas/:id` está declarada después de `nueva`, `caja`, `rapida` y `:id/editar`. Esas palabras no deben capturarse como id.

## Listado

- `fetchVentasRegistros` (`ventasListado.js`) pagina en el servidor. Sin un rango obligatorio de tres meses si los filtros van vacíos.
- Filtros: fecha, cliente, método de pago, estado.
- Los KPIs del día piden hoy con `getVentas`. `getVentas`, si no recibe ambas fechas, limita a los últimos tres meses. Dashboard y otros consumos siguen usando esa función. El listado de `/ventas` no.
- El `select` paginado no embebe `clientes` ni `usuarios`. Los nombres se hidratan aparte (`hydrateVentasRowsWithClienteUsuarioNombre`). PostgREST puede responder 500 si se embeben con offsets altos.
- Unidades del listado: RPC `ventas_listado_unidades_agg` (039, corregida en 040 con security definer). Si falla, se leen `venta_items` por lotes.
- Acción de fila: cancelar (`cancelVenta`). No hay botón de borrado físico.

## POS y venta rápida de esta UI

- Ítems por código de barras (cualquiera de `producto_codigos_barras`) o búsqueda de producto.
- Cliente opcional. Puede usar el cliente preferible. Sin pagos, la venta queda con deuda (`monto_pagado` 0, `monto_deuda` = total) y `metodo_pago` `pendiente`.
- Pagos múltiples en `venta_pagos`. `metodo_pago` de la cabecera guarda los métodos unidos por coma.
- Número de ticket generado en el cliente: `TICKET-YYYYMMDD-HHMMSS-XXXX`.
- Facturación única por comercio (`idx_ventas_comercio_facturacion_unique`).
- Antes de crear se llama `validarLimiteVentas`. Si el plan no deja, no se inserta.
- No se edita una venta cancelada.
- Modal `ConsultaProductoStockModal`: stock y precio, y puede actualizar `precio_venta`. Atajos de teclado F2 y F4 dentro del modal. La toolbar usa F2 para ir a venta rápida.
- Toolbar (`VentasPruebaToolbar`): clientes, productos, categorías, compras, caja, venta rápida, nueva venta.

## Stock y estado

Según el cuerpo de `services/ventas.js` (el comentario de `cancelVenta` dice que no toca stock; el código sí lo repone):

- Crear descuenta `cantidad` de `productos.stock_actual`. Si el resultado es negativo, se guarda 0. Un error de stock se registra y no revierte la venta ya insertada.
- Editar devuelve el stock de los ítems viejos y descuenta los nuevos, con el mismo piso en 0 (`updateStockByDelta`).
- Cancelar deja la venta visible, estado `cancelada`, y repone la cantidad de cada ítem. No se puede cancelar dos veces. La cuenta del cliente anula el movimiento de la venta con esta misma función.
- `deleteVenta` es soft delete (`deleted_at`) y también repone stock. Está marcado como deprecado. Lo usa la ruta histórica de ventas rápidas, no el listado de `/ventas`.
- La rentabilidad (vista de la 043) excluye `estado = 'cancelada'` y `deleted_at`.

## Datos

`ventas`, `venta_items`, `venta_pagos`. No existe `ventas_rapidas` (la migración 035 la eliminó). `ventas.js` y `ventasRapidas.js` leen y escriben `ventas`. Triggers de `comercio_id` (migración 010) y de montos al insertar, actualizar o borrar `venta_pagos` (migración 011, el de la 047 ignora `anulado_at`). Si no hay filas de pago, el cliente escribe `monto_pagado` y `monto_deuda` a mano porque el trigger no corre. Anular un cobro desde la cuenta corriente setea `anulado_at` y no borra la fila.

## Estilos

`VentasPruebaList.css`, `VentaDetalladaPrueba.css`, `VentaRapidaPrueba.css`, `ventasPrueba.css`, `VentasPruebaToolbar.css`, `VpKpiGrid.css`, `ConsultaProductoStockModal.css`, `pages/ventas/VentaDetalle.css`. Encabezado de vidrio del shell. Dinero en formato argentino.

## Conexiones

- Productos, clientes, categorías, compras y caja, por la toolbar y por las claves foráneas.
- Cuenta corriente del cliente lee estas ventas y registra pagos distribuidos.
- Dashboard, reportes y caja leen las mismas filas. La caja ignora ventas canceladas y con `deleted_at`.
- Límite del plan: `services/planes.js`.

## Reglas

- No recrear la tabla `ventas_rapidas`.
- No embeber `clientes`/`usuarios` en el `select` paginado del listado.
- No presentar el rango de tres meses como filtro por defecto del listado de `/ventas`. Ese rango sigue en `getVentas`.
- Cancelar y borrar (soft delete) reponen stock. La venta cancelada sigue visible y no entra en rentabilidad.

## Archivos

`pages/ventas-prueba/`, `components/ventas-prueba/`, `pages/ventas/VentaDetalle.jsx`, `services/ventas.js`, `services/ventasListado.js`, migraciones `011`, `039`, `040`, `043`.
