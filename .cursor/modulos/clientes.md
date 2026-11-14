# Módulo: Clientes

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** `clientes`.

## Qué hace

Ficha de clientes y cuenta corriente armada desde las ventas. Un cliente puede marcarse preferible para el POS: uno solo por comercio.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/clientes` | Listado. Recuerda búsqueda y página |
| `/clientes/nuevo` | Alta |
| `/clientes/:id` | Edición |
| `/clientes/:clienteId/cuenta-corriente` | Libro de deuda y pagos |

## Funciones

- Campos de ficha: nombre, email, teléfono, dirección, tipo y número de documento, fecha de nacimiento, notas, activo, `preferible`.
- Unicidad en el comercio: email, número de documento y nombre (`verificarEmailCliente`, `verificarNumeroDocumentoCliente`, `verificarNombreCliente`).
- Baja lógica con `deleted_at` (`deleteCliente`).
- `getClientePreferible` alimenta el POS. El trigger de la migración 043 impide más de un preferible por comercio. Lo mismo vale para productos y formas de pago.
- Cuenta corriente: no usa `clientes.saldo_pendiente` como fuente de la pantalla. `getCuentaCorrientePorClienteId` arma la deuda desde ventas y `venta_pagos`.
- La ficha muestra iniciales, estado, saldo actual, mes, tipo, búsqueda, libro con saldo arrastrado y totales del mes (`utils/clienteCuentaCorriente.js`).
- Se puede registrar un pago que se distribuye entre ventas con deuda (`registrarPagoClienteDistribuido`).
- En el libro, cada movimiento (salvo el saldo arrastrado y uno ya anulado) tiene un menú de tres puntos con «Anular movimiento». Anular una venta usa `cancelVenta` (deja de sumar y repone stock). Anular un cobro marca `venta_pagos.anulado_at` (migración 047): la fila sigue visible, el monto va a la columna «Monto anulado» y vuelve a sumar al saldo. Un cobro agrupado anula todas sus imputaciones.
- PDF de estado de cuenta: `utils/clienteMovimientosExport.js`.
- Atajo a Ventas en la barra de la cuenta corriente.
- El listado tiene menú de acciones y acceso a la cuenta (`ClientesActionsMenu`, `ClienteVentasActionsMenu`). Tooltip de contacto con `components/clientes/GlassTooltip.css`.

## Datos

Tabla `clientes`. Servicio `services/clientes.js`. Deuda y pagos viven en `services/ventas.js`. RLS del catálogo: permiso `clientes`. Leer ventas para la cuenta exige además el permiso de ventas o de reportes en esas tablas.

## Estilos

`ClientesList.css`, `ClienteForm.css`, `ClienteCuentaCorriente.css`, menús de acciones, `registros-seccion.css`. La ficha de cuenta comparte lenguaje visual con las compras del proveedor. El libro ocupa el 100% del panel: la fecha, el detalle y cada monto se reparten en porcentaje, y el detalle puede partirse en más de una línea. En pantallas angostas el libro pasa a tarjetas.

## Conexiones

- El POS de ventas elige cliente y puede precargar el preferible.
- La barra de Ventas enlaza a `/clientes`.
- Dashboard y reportes leen clientes para nombres y rankings.
- `saldo_pendiente`, `total_compras` y `ticket_promedio` existen en la tabla desde el esquema inicial. La cuenta corriente de la UI no los toma como saldo vivo.

## Archivos

`pages/clientes/`, `services/clientes.js`, `utils/clienteCuentaCorriente.js`, `services/ventas.js` (mapa de deuda, movimientos, pago distribuido).
