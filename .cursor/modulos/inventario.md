# Módulo: Inventario

**Estado:** pendiente. La ruta existe y la pantalla no opera.  
**Actualizado:** 2026-11-13  
**Permiso:** `inventario` (`PermissionRoute`). El código está en `app_modulos` y en `MODULO_CODIGOS`.

## Qué hay

`/inventario` renderiza `pages/EnDesarrollo.jsx` con el título «Módulo de Inventario». No hay alta de ajustes, transferencias ni historial en la UI. No aparece como tarjeta del panel de Inicio.

La tabla `movimientos_inventario` existe desde el esquema inicial (`tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `motivo`, `referencia_tipo`, `referencia_id`). El frontend no escribe en ella. El stock de pantalla es `productos.stock_actual`, movido por ventas y por compras.

RLS de la tabla: comercio del usuario y permiso `productos` (migración 038), no el código `inventario`.

## Si se implementa

Definir ahí la relación con `movimientos_inventario`. No sumar un tercer mecanismo de stock al lado de ventas y compras sin dejarlo escrito en `productos.md`, `ventas.md`, `compras.md` y `base-de-datos.md`.

## Estilos

`pages/EnDesarrollo.css`.

## Archivos

`pages/EnDesarrollo.jsx`, `App.jsx` (ruta `/inventario`), tabla en `001_initial_schema.sql`.
