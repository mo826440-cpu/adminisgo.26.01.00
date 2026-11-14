# Módulo: Marcas

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** `marcas`.

## Qué hace

CRUD de marcas de producto. La marca en el producto es opcional.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/marcas` | Listado |
| `/marcas/nuevo` | Alta |
| `/marcas/:id` | Edición |

## Funciones

- Alta, edición y baja. Nombre único en el comercio (`verificarNombreMarca`).
- `comercio_id` lo asigna el trigger de la migración 008, el mismo de categorías.
- Campos: `nombre`, `descripcion`, `logo_url`, `activo`. La pantalla trabaja nombre, descripción y estado.

## Datos

Tabla `marcas`. Servicio `services/marcas.js`. RLS con `usuario_tiene_permiso_modulo('marcas')`. `productos.marca_id` referencia `marcas`.

## Estilos

`MarcasList.css`, `MarcaForm.css`, `registros-seccion.css`. Misma familia visual que categorías y el resto de catálogos (tabla, menú de acciones, formulario en card).

## Conexiones

El formulario y el listado de productos leen las marcas. El hub de Referencias muestra la tarjeta si hay permiso. No mueve stock ni precios.

## Archivos

`pages/marcas/`, `services/marcas.js`.
