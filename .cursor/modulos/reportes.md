# Módulo: Reportes

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** `reportes`.

El comentario al inicio de `ReportesPage.jsx` dice que el contenido está pendiente. Las cuatro pestañas ya renderizan paneles. Ese comentario está viejo.

## Ruta

`/reportes` → `pages/reportes/ReportesPage.jsx`.

## Pestañas

| Id | Qué muestra |
| --- | --- |
| `ventas` | Totales por mes: montos, cobranzas y deudas (`ReporteVentasPanel`, `reporteVentasUtils.js`) |
| `compras` | Totales por mes según `fecha_orden`: montos, pagos y deudas (`ReporteComprasPanel`) |
| `balances` | Ventas, compras y diferencia ventas − compras en el mismo período (`ReporteBalancesPanel`) |
| `rentabilidad` | Ingresos, costo de compras, gastos fijos/variables, utilidad neta y margen % (`ReporteRentabilidadPanel`) |

Cada panel tiene barra de período (`ReporteDateSlicerBar`, `reporteDateSlicers.js`) y exportación (`ReporteInformeExportActions`, `reporteInformeExport.js`). Impresión: `ReporteInformePrint.css`.

## Rentabilidad

`getRentabilidadMensual` lee la vista `v_rentabilidad_mensual`. La definición vigente es la de la migración 043, que reemplaza a la 037.

- Ingresos: `ventas.total` con `deleted_at` nulo y `estado <> 'cancelada'`.
- Costo de mercadería: `compras.total` con `deleted_at` nulo, agrupado por `fecha_orden`. La vista no excluye compras `cancelada`.
- Gastos: `otros_costos.costo` solo tipos Fijo y Variable. Inversión no entra.
- `utilidad_neta = ingresos − costo − gastos`. Margen 0 si no hay ingresos.
- La vista es `security_invoker`: valen las RLS de las tablas base.
- `EXTRACT` sobre `timestamptz` usa la zona de la sesión del servidor (en Supabase suele ser UTC), no necesariamente el huso del comercio.

Quien tiene `reportes` puede leer ventas y compras aunque no tenga el módulo operativo (`usuario_permiso_ventas_o_reportes` y el equivalente de compras).

## Estilos

`ReportesPage.css`, `ReporteVentasPanel.css`, `ReporteRentabilidadPanel.css`, `ReporteDateSlicerBar.css`, `registros-seccion.css`. Pestañas con `role="tablist"`.

## Conexiones

- Ventas, compras y otros costos. Cambiar qué entra en una venta cancelada o en un gasto de tipo Inversión cambia esta pantalla y el dashboard no siempre del mismo modo: el dashboard calcula en el cliente.
- Formato de dinero argentino (`formatMoneyAR` en `reporteVentasUtils.js`), reutilizado por la cuenta corriente.

## Archivos

`pages/reportes/`, `services/rentabilidad.js`, migraciones `037` y `043`.
