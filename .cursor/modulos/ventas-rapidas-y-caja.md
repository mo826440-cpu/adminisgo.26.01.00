# Módulo: Ventas rápidas y caja

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** la ruta histórica `/ventas-rapidas` exige `ventas_rapidas`. Caja, historial y `/ventas/rapida` aceptan `ventas` o `ventas_rapidas`. El ítem no está en el sidebar.

## Qué hace

Cobro corto y apertura/cierre de caja. Las ventas rápidas son filas de `ventas`, con los mismos ítems y pagos. No hay tabla `ventas_rapidas`.

## Rutas

| Ruta | Pantalla | Notas |
| --- | --- | --- |
| `/ventas/rapida` | `VentaRapidaPrueba` | UI vigente, dentro del módulo Ventas |
| `/ventas/caja` | `VentasPruebaCaja` | UI vigente |
| `/ventas-rapidas` | `VentasRapidas.jsx` | Listado histórico |
| `/ventas-rapidas/:id` | `VentaRapidaDetalle.jsx` | Detalle histórico |
| `/ventas-rapidas/historial` | `HistorialCajas.jsx` | Historial de caja |

Se entra por la tarjeta de Inicio (si hay permiso `ventas_rapidas`) o por los atajos del encabezado de Ventas.

## Venta rápida

- `services/ventasRapidas.js` delega el alta y la edición en `createVenta` / `updateVenta`.
- El listado histórico borra con `deleteVentaRapida` → `deleteVenta`: soft delete y reposición de stock. Esa acción no es la de cancelar del listado `/ventas`.
- Misma búsqueda por códigos de barras y mismo límite de ventas del plan.

## Caja

- Tabla `historial_cajas`. Operaciones `apertura` y `cierre`.
- Desglose (migración 032): efectivo, virtual (QR, transferencia, débito), crédito y otros. `pendiente` no suma ingreso.
- `abrirCaja` guarda el importe total y el desglose. `cerrarCaja` calcula los cobros de `venta_pagos` desde la apertura, excluyendo ventas canceladas y con `deleted_at`.
- `obtenerEstadoCaja` dice si hay una caja abierta.
- Historial filtrable por fechas. `updateHistorialCaja` y `deleteHistorialCaja` existen en el servicio.
- RLS de `historial_cajas`: permiso `ventas_rapidas` (migración 038). Un usuario que solo tiene `ventas` entra a la ruta de caja por la UI; si la política remota sigue así, el insert puede fallar hasta que la política acepte también `ventas`. Confirmarlo en Supabase antes de cambiar la caja.

## Estilos

`VentasPruebaCaja.css`, `VentaRapidaPrueba.css`, `pages/ventas/VentasRapidas.css`, `HistorialCajas.css`, `components/ventas/GestionCajaPanel.css`, `FormularioVentaRapidaPanel.css`. Misma barra y tema que Ventas.

## Conexiones

- Comparte tablas con `ventas.md`. Un cambio de métodos de pago tiene que seguir el mapa de `caja.js`: efectivo, qr, transferencia, debito, credito, y el resto a «otros».
- Formas de pago configurables: ficha `configuracion.md`. El mapa de caja reconoce esos nombres en minúsculas.
- Reportes no leen `historial_cajas` para la rentabilidad.

## Reglas

- No volver a crear `ventas_rapidas`.
- No sumar a la caja las ventas canceladas ni las borradas.
- No registrar el service role ni datos de una caja real en esta ficha.

## Archivos

`services/caja.js`, `services/ventasRapidas.js`, `pages/ventas-prueba/VentasPruebaCaja.jsx`, `pages/ventas-prueba/VentaRapidaPrueba.jsx`, `pages/ventas/VentasRapidas.jsx`, `HistorialCajas.jsx`, `VentaRapidaDetalle.jsx`, migraciones `014`, `032`, `035`.
