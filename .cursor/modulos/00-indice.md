# Índice de fichas de módulo

**Actualizado:** 2026-11-13

Estas fichas viven en `.cursor/modulos/`. Describen lo implementado en el código. Si una ficha y el código difieren, prevalece el código y la ficha se corrige en el mismo cambio. `README.md` y `Guias_Inicio/` no se toman como estado actual.

## Cómo se usan

1. Antes de un cambio, se lee la ficha del módulo (y `base-de-datos.md` si toca tablas, RLS o migraciones).
2. La confirmación de lectura es breve: se entendió, sin resumir el módulo.
3. Con cada implementación se actualizan la ficha afectada, esta índice si cambia el mapa, y `docs/MEMORIA_PROYECTO.md`.

## Fichas

| Archivo | Qué cubre | Permiso |
| --- | --- | --- |
| `acceso.md` | Ingreso, recuperación, Google, cierre de registro público | Público |
| `navegacion-y-estilo.md` | Sidebar, encabezados, tema oscuro, PWA | Sesión |
| `inicio.md` | Panel `/inicio` y hub de Referencias | Sesión |
| `dashboard.md` | Panel de indicadores | `dashboard` |
| `categorias.md` | Categorías y PDF de precios | `categorias` |
| `marcas.md` | Marcas | `marcas` |
| `clientes.md` | Clientes y cuenta corriente | `clientes` |
| `proveedores.md` | Proveedores y libro de compras | `proveedores` |
| `productos.md` | Productos, códigos de barras, stock de pantalla | `productos` |
| `compras.md` | Órdenes, recepción, pagos, stock | `compras` |
| `ventas.md` | Listado, POS, detalle, venta rápida de `/ventas` | `ventas` |
| `ventas-rapidas-y-caja.md` | Ruta histórica, caja y desglose | `ventas` o `ventas_rapidas` |
| `reportes.md` | Ventas, compras, balances, rentabilidad | `reportes` |
| `otros-costos.md` | Gastos del dueño | Solo dueño |
| `usuarios.md` | Invitación y matriz de permisos | Solo dueño |
| `configuracion.md` | Comercio, plan, pagos, impresoras, baja de cuenta | Solo dueño |
| `mantenimiento.md` | Catálogo de esquema y Excel | `mantenimiento` |
| `legal.md` | Términos y privacidad públicos | Público |
| `inventario.md` | Placeholder. No es un módulo operativo | `inventario` |
| `base-de-datos.md` | Tablas, RLS, triggers, vistas y reglas | — |

## Fuera de estas fichas

`/test/servicios`, `/test/servicios-nuevos` y `/test/firma-canvas` existen con login y no son módulos de negocio. No hay app nativa, multi-almacén, modo offline de datos ni API pública.
