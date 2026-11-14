# Módulo: Proveedores

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** `proveedores`. La ruta `/proveedores/:id/compras` también está guardada solo con ese módulo. Leer las órdenes depende de la RLS de `compras` (`compras` o `reportes`). Un rol con proveedores y sin esos dos permisos abre la ficha y puede no ver las órdenes.

## Qué hace

Ficha de proveedores y libro de compras del proveedor, con la misma estructura visual que la cuenta corriente del cliente.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/proveedores` | Listado. Recuerda búsqueda y página |
| `/proveedores/nuevo` | Alta |
| `/proveedores/:id` | Edición |
| `/proveedores/:id/compras` | Libro de compras de ese proveedor |

## Funciones

- Campos: `nombre_razon_social`, email, teléfono, dirección, `cuit_rut`, contacto principal, condiciones de pago, plazo de entrega, notas, activo.
- Unicidad: email, CUIT y nombre (`verificarEmailProveedor`, `verificarCuitProveedor`, `verificarNombreProveedor`).
- Baja lógica con `deleted_at`.
- `comercio_id` lo completa el trigger de la migración 009.
- Listado: nombre con contacto en segunda línea, saldo visible, estado Activo/Inactivo separado de Con deuda/Sin deuda. No hay estado Vencido: no existe fecha de vencimiento. Filtros de deuda, estado y orden. Búsqueda por nombre, CUIT, teléfono, email y contacto. El contexto (búsqueda, filtros, orden, página y scroll) se recuerda al volver. «Registrar pago» queda en la fila si hay deuda y el usuario puede escribir `compra_pagos` (módulo `compras` o `reportes`). El menú de tres puntos abre detalle, cuenta corriente y edición. El detalle es un modal centrado. Quien no tiene el módulo `proveedores` no entra a la pantalla; no hay un permiso aparte de solo consulta.
- Alta y edición: primero nombre, teléfono y contacto. Fiscal y condiciones van en secciones. Avisa si hay cambios sin guardar.
- Libro `/proveedores/:id/compras`: título de cuenta corriente, con el nombre del proveedor y el mes también en el encabezado al hacer scroll. Un solo resumen antes del historial y el saldo actual de toda la cuenta por separado. «Pendiente de la orden» es la deuda actual de esa compra, descontando los pagos vigentes. Un pago posterior sigue en su propia fila. Anular la orden usa `cancelarCompra`. Anular un pago marca `anulado_at` (migración 047).
- Registrar pago: imputa de la deuda más antigua a la más reciente (`registrarPagoProveedorDistribuido`). El modal muestra saldo resultante y «Pagar saldo completo». El excedente no genera saldo a favor.
- Columnas visibles: `components/tablas/useColumnasTabla.js`, en el navegador, por usuario, comercio y tabla. La primera visita muestra todas. Una columna nueva queda visible.
- Deuda: `deudaEfectivaCompra` (total − pagado). Una compra cancelada suma 0. No confiar solo en `monto_deuda` persistido.
- `getMapaDeudaPorProveedorIds`, `getComprasPorProveedorId` y el pago distribuido están en `services/compras.js`.

## Datos

Tabla `proveedores`. RLS con permiso `proveedores`. Las compras que alimentan el libro exigen permiso `compras` o `reportes`.

## Estilos

`ProveedoresList.css`, `ProveedorForm.css`, `proveedoresModulo.css`. La cabecera de las tablas queda en el flujo de la tabla. Los modales del módulo se centran en la ventana. El libro reutiliza la ficha de `ClienteCuentaCorriente.css` y deja un solo resumen antes del historial.

## Conexiones

- Toda compra exige `proveedor_id`.
- El producto puede tener `proveedor_id` opcional.
- Dashboard arma un top de proveedores.
- El hub de Referencias muestra la tarjeta si hay permiso.

## Archivos

`pages/proveedores/`, `RegistrarPagoProveedorModal.jsx`, `services/proveedores.js`, `services/compras.js`, `proveedoresListState.js`.
