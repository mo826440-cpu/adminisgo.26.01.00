# Módulo: Productos

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** `productos`.

## Qué hace

Catálogo de artículos, precio, stock de pantalla y varios códigos de barras por producto. El stock que ve el usuario es `productos.stock_actual`. Ventas y compras lo actualizan en el cliente. `movimientos_inventario` no se escribe.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/productos` | Listado, búsqueda, observaciones de códigos |
| `/productos/nuevo` | Alta. Acepta `?codigo_barras=` para precargar un código |
| `/productos/:id` | Edición |

## Funciones

- Campos del formulario: nombre, categoría (obligatoria), marca, proveedor, precio de venta, precio de compra, stock, stock mínimo, unidad, descripción, activo, `preferible`.
- El formulario ya no muestra `codigo_interno`. La columna y su unicidad (migración 007) siguen. `verificarCodigoInterno` existe en el servicio.
- Precio de venta ≥ 0. Hay calculadora de precio (`components/productos/PrecioVentaCalculadora.css`).
- Alta: stock vacío se guarda en 0. Edición: si el campo de stock no se tocó, no se reescribe.
- Un solo producto `preferible` por comercio (trigger 043). `getProductoPreferible` lo usa el POS.
- Varios códigos en `producto_codigos_barras` (migración 046): `codigo`, `observacion`, `orden`. El primero se copia a `productos.codigo_barras` para el único histórico y las consultas viejas.
- Unicidad del código por comercio, recortando espacios. Dar de baja un producto conserva el historial y libera sus códigos. Si un código quedó en un producto inactivo, al guardarlo en otro activo se libera solo (`liberarCodigosDeProductosInactivos`).
- Búsqueda en ventas, compras, listado y PDF por cualquiera de los códigos.
- En el listado, junto al nombre se ven las observaciones de cada código. Si la búsqueda coincide con un código, la columna deja solo la observación de ese código (`codigosBarrasProducto.js`).
- Baja: `activo` en falso y `deleted_at`, sin borrar la fila. No borra el historial de ventas ni de compras.
- Cambio masivo de precio: `updateProductosPrecioBulk`. También se puede cambiar el precio desde Categorías y desde el modal de consulta de Ventas.
- Imágenes: la tabla `producto_imagenes` existe. No es el flujo principal del formulario vigente.

## Datos

Tablas `productos` y `producto_codigos_barras`. Servicio `services/productos.js`. RLS de ambas con permiso `productos`. El trigger de la 046 copia `comercio_id` desde el producto y rechaza un código ya usado por otro producto activo.

## Estilos

`ProductosList.css`, `ProductoForm.css`, `ProductosActionsMenu.css`, `PrecioVentaCalculadora.css`, `registros-seccion.css`.

## Conexiones

- Ventas descuentan `stock_actual` al crear o editar, lo reponen al cancelar o al borrar (soft delete) y no lo dejan negativo: el mínimo guardado es 0.
- Compras suman stock al recibir y, si se cancela una compra ya recibida, restan sin bajar de cero.
- La consulta de producto en Ventas muestra stock y precio y puede actualizar `precio_venta`.
- Categorías exportan PDF de precios de estos productos.
- No sumar un tercer mecanismo de stock en silencio si más adelante se usa `movimientos_inventario`.

## Archivos

`pages/productos/`, `services/productos.js`, `utils/codigosBarrasProducto.js`, migración `046_producto_codigos_barras.sql`.
