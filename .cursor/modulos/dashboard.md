# Módulo: Dashboard

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** `dashboard` (`PermissionRoute`). El dueño entra siempre.

## Qué hace

Resumen del comercio: KPIs, evolución, tortas, productos y clientes destacados, estados de ventas y compras, stock, alertas y últimos movimientos. Los cálculos corren en el cliente a partir de consultas a Supabase. No hay una tabla propia del dashboard.

## Ruta

`/dashboard` → `pages/dashboard/Dashboard.jsx`.

## Funciones

- Filtros de fecha y de método de pago (`DashboardFilters`, `dashboardFilters.js`). El encabezado también fija desde/hasta. Un clic en un método de pago (salvo «Deuda») aplica ese filtro.
- Serie de evolución con métrica y granularidad (`EvolutionChart`, Recharts).
- Tortas (`DonutChart`), productos destacados (`TopProductsChart`).
- Tarjetas de estado de ventas y de compras, comparaciones, indicadores de stock, alertas, top clientes y top proveedores (`DashboardStatusCards`).
- Tablas de últimos movimientos (`DashboardTables`).
- Exportación PDF y Excel (`dashboardExport.js`: jsPDF, ExcelJS).
- Muestra el plan de la suscripción vía `getEstadoSuscripcion` (`services/planes.js`).
- Datos: `hooks/useDashboardData.js` y `utils/dashboardCalculations.js`. `getVentas`, si no recibe ambas fechas, limita a los últimos tres meses. Ese tope aplica acá, no al listado paginado de `/ventas`.

## Estilos

`pages/dashboard/Dashboard.css`. Tema oscuro y acento naranja heredados. Gráficos en `chartConfig.js`.

## Conexiones

Lee ventas, compras, productos, clientes y proveedores. No actualiza stock ni estados. Un cambio en qué ventas entran (canceladas, soft delete, rango de fechas) cambia estos números y también `reportes.md`.

## Reglas

- No embeber relaciones pesadas si se reutiliza el listado paginado de ventas.
- Formato de dinero de Argentina en las cifras de pantalla.

## Archivos

`pages/dashboard/**`, `services/ventas.js` (`getVentas`), `services/compras.js`, `services/planes.js`.
