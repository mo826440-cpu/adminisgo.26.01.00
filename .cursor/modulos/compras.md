# Módulo: Compras

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** `compras`. Quien tiene `reportes` también puede leer compras por RLS (`usuario_permiso_compras_o_reportes`), sin que eso le abra esta ruta.

## Qué hace

Órdenes a proveedor, ítems, pagos y efecto sobre el stock al recibir o al cancelar una orden ya recibida.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/compras` | Listado y cancelación |
| `/compras/nueva` | Alta |
| `/compras/:id` | Detalle, recibir, cancelar |
| `/compras/:id/editar` | Edición |

## Funciones

- Alta con proveedor obligatorio, ítems (producto, cantidad solicitada, precio) y totales. `comercio_id` lo asigna el trigger de la migración 012. `numero_orden` identifica la orden.
- Estados usados por la UI: `pendiente` (default de la tabla), `recibida`, `cancelada`.
- Recibir (`recibirCompra`): graba `cantidad_recibida`, suma esa cantidad a `productos.stock_actual` y pasa la orden a `recibida` con `fecha_recepcion`. No se recibe una orden ya recibida ni una cancelada. Si falla el update de stock, el servicio lo registra y sigue: no hay una transacción única en el cliente.
- Cancelar (`cancelarCompra`): la orden queda visible con estado `cancelada`. Si estaba recibida, resta `cantidad_recibida` del stock sin bajar de cero. Si no estaba recibida, no mueve stock.
- `deleteCompra` es soft delete (`deleted_at`) y no revierte stock. El listado vigente cancela; no usa este borrado como acción principal.
- Pagos en `compra_pagos` (migración 013). También se pueden cargar desde la ficha del proveedor: un pago se reparte en las órdenes con deuda, de la más antigua a la más reciente. `deudaEfectivaCompra` = total − `monto_pagado`, y 0 si está cancelada. Anular un pago desde el libro del proveedor setea `anulado_at` (047); el trigger y `sincronizarMontosCompra` no lo suman.
- Editar reemplaza ítems y datos de cabecera mientras la orden lo permite en el formulario.

## Datos

`compras`, `compra_items`, `compra_pagos`. Servicio `services/compras.js`. Los ítems y los pagos heredan el permiso por la compra del mismo comercio.

## Estilos

`ComprasList.css`, `CompraForm.css`, `CompraDetalle.css`, `ComprasActionsMenu.jsx`, `registros-seccion.css`. Encabezado de módulo de vidrio, igual que el resto.

## Conexiones

- Proveedores: el libro `/proveedores/:id/compras` lee estas órdenes.
- Productos: stock y búsqueda por código de barras.
- Reportes de compras y balances usan `fecha_orden` y los totales. La rentabilidad suma `compras.total` de órdenes no eliminadas (la vista no filtra `cancelada` en compras; sí excluye ventas canceladas).
- La barra de Ventas enlaza a `/compras`.

## Reglas

- No descontar stock al crear la orden. El stock se mueve al recibir y se revierte solo si se cancela una recibida.
- No recrear un ajuste paralelo en `movimientos_inventario` desde esta pantalla.

## Archivos

`pages/compras/`, `services/compras.js`, migraciones `012`, `013`.
