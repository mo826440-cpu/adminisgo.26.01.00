# Módulo: Categorías

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** `categorias`.

## Qué hace

CRUD del rubro de productos y exportación PDF de lista de precios. La categoría es obligatoria al guardar un producto.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/categorias` | Listado, expansión de productos, PDF |
| `/categorias/nuevo` | Alta |
| `/categorias/:id` | Edición |

## Funciones

- Alta, edición y baja. Nombre único dentro del comercio (`verificarNombreCategoria`).
- `comercio_id` lo completa un trigger si el insert llega vacío (`008_auto_comercio_id_categorias_marcas.sql`).
- El listado permite marcar categorías y, al expandir, marcar productos.
- PDF: si hay productos marcados en la categoría, el PDF incluye solo esos; si no, el listado completo de esa categoría. También se puede generar el PDF de las categorías seleccionadas.
- Desde el expandido se puede cambiar precios de productos (escribe `productos.precio_venta`).
- Campos de tabla: `nombre`, `descripcion`, `imagen_url`, `categoria_padre_id`, `activo`. La UI vigente usa sobre todo nombre y descripción. La jerarquía por padre existe en la base y no es el flujo principal de la pantalla.

## Datos

Tabla `categorias`. Servicio `services/categorias.js`: `getCategorias`, `getCategoria`, `createCategoria`, `updateCategoria`, `deleteCategoria`. RLS: `comercio_id = get_user_comercio_id()` y `usuario_tiene_permiso_modulo('categorias')`.

## Estilos

`CategoriasList.css`, `CategoriaForm.css`, más `registros-seccion.css`. Botón PDF: `.categorias-btn-pdf`. Menú de fila: `CategoriasActionsMenu.jsx`.

## Conexiones

- Productos exigen `categoria_id`. Borrar o renombrar una categoría impacta el formulario y el listado de productos.
- La barra de Ventas enlaza a `/categorias`.
- El hub de Referencias muestra la tarjeta si hay permiso.
- El PDF de precios es de este módulo, no de Productos.

## Archivos

`pages/categorias/`, `services/categorias.js`.
