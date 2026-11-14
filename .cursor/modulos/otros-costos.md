# Módulo: Otros costos

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** solo dueño. `AdminRoute` en `/otros-costos` y RLS con `usuario_es_dueno()`. No está en `app_modulos`.

## Qué hace

Gastos del comercio que no son una compra a proveedor. Entran en la rentabilidad según el tipo.

## Ruta

`/otros-costos` → `pages/otrosCostos/OtrosCostosPage.jsx`. Si el perfil no es dueño o no tiene comercio, la página no opera (además de la ruta).

## Funciones

- Alta: tipo, descripción y costo. Tipos: `Fijo`, `Variable`, `Inversión` (`OTROS_COSTOS_TIPOS`). El default del formulario es Variable.
- Listado con filtro por tipo y por fechas. El rango inicial es desde hace un mes hasta hoy.
- Borrado de la fila (`deleteOtroCosto`). No es soft delete en el servicio: borra el id.
- Fijos y variables entran en `v_rentabilidad_mensual` por `created_at`. Inversión no se suma en esa vista.
- Dinero en formato argentino. Badge por tipo: Fijo secondary, Variable info, Inversión primary.

## Datos

Tabla `otros_costos` (migración 036). Enum `otro_costo_tipo`. Columnas de uso: `comercio_id`, `tipo`, `descripcion`, `costo`, `created_at`. Servicio `services/otrosCostos.js`. Políticas select/insert/update/delete solo para el dueño del comercio.

## Estilos

`OtrosCostosPage.css`, `registros-seccion.css`, card y badges comunes. Encabezado de módulo del shell.

## Conexiones

- Rentabilidad, pestaña del módulo Reportes. El dueño puede cargar costos sin tener el código `reportes` en la matriz, porque el dueño pasa todo permiso.
- No se vincula a `compras` ni a `productos`. No mueve stock.

## Reglas

- No sumar Inversión a la utilidad salvo que se cambie la vista y esta ficha juntas.
- No abrir la ruta a roles que no son dueño sin una política RLS nueva.

## Archivos

`pages/otrosCostos/OtrosCostosPage.jsx`, `OtrosCostosPage.css`, `services/otrosCostos.js`, migración `036_otros_costos.sql`.
