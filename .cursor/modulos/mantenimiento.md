# Módulo: Mantenimiento

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** `mantenimiento`.

## Qué hace

Lista las tablas y columnas del esquema del comercio y exporta una selección a Excel. No edita filas desde la pantalla.

## Ruta

`/mantenimiento` → `pages/mantenimiento/MantenimientoPage.jsx`.

## Funciones

- `getEsquemaTablas` llama la RPC `mantenimiento_listar_esquema` (migración 044). Sin esa función en Supabase, el listado no se arma.
- Muestra cantidad de tablas, tamaño de la base y, por tabla, columnas, filas y bytes cuando la RPC los trae.
- El usuario marca tablas o columnas. Un conjunto `BASIC_SYSTEM_TABLES` destaca las tablas de operación: categorías, clientes, ítems y pagos de compra, compras, formas de pago, historial de cajas, marcas, otros costos, productos, proveedores, usuarios, ítems y pagos de venta, ventas.
- Exportación: `getDatosSeleccionadosParaExcel` y `downloadMantenimientoExcel` (ExcelJS). Algunas tablas aceptan filtro de fechas (`TABLAS_CON_FILTRO_FECHA`). El rango inicial del formulario es el último mes.
- Los textos de tamaño y de cantidad de filas usan `es-AR`.

## Datos

No tiene tabla propia. Lee el catálogo de PostgreSQL a través de la RPC, acotada al comercio del usuario. El detalle de qué columnas expone está en `044_mantenimiento_schema_catalog_rpc.sql` y en `services/mantenimiento.js`.

## Estilos

`MantenimientoPage.css`, `registros-seccion.css`, modal de confirmación de la exportación.

## Conexiones

Puede exportar filas de cualquier módulo listado. No reemplaza los PDF de categorías, reportes ni cuenta corriente. No salta RLS: corre con el usuario autenticado.

## Reglas

- No usar esta pantalla para escribir stock, ventas o permisos.
- No volcar en la ficha ni en un Excel de ejemplo datos reales de un comercio.

## Archivos

`pages/mantenimiento/`, `services/mantenimiento.js`, `services/mantenimientoExport.js`, `utils/mantenimientoExcel.js`, migración `044`.
