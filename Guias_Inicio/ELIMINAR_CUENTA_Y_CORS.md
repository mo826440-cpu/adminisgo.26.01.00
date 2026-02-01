# Eliminar cuenta y CORS

## Cambios realizados

### 1. Edge Function `eliminar-cuenta-comercio`

- **CORS**: OPTIONS devuelve `204` con las cabeceras correctas; todas las respuestas incluyen `Access-Control-Allow-*` para que el front en `www.adminisgo.com` pueda llamar a la función.
- **Orden de borrado**: Antes de borrar usuarios en Auth y el comercio, se borran en este orden (para no violar claves foráneas):
  1. `ventas` (CASCADE borra `venta_items`)
  2. `compras` (CASCADE borra `compra_items`)
  3. `movimientos_inventario`
  4. `historial_cajas`
  5. `ventas_rapidas`
  6. Usuarios en **Auth** (CASCADE borra filas en `usuarios` y `configuracion_usuario`)
  7. **comercios** (CASCADE borra categorías, marcas, clientes, proveedores, productos, etc.)

**Desplegar de nuevo la función** después de estos cambios:

```bash
supabase functions deploy eliminar-cuenta-comercio
```

### 2. Si sigue fallando CORS ("Failed to fetch" / preflight)

- En **Supabase Dashboard** → **Project Settings** → **API**: revisar si hay opción de dominios permitidos y añadir `https://www.adminisgo.com` y `https://adminisgo.com` si aplica.
- Comprobar que la función esté desplegada y que la URL sea la correcta en el front (`VITE_SUPABASE_URL` + `/functions/v1/eliminar-cuenta-comercio`).

### 3. Borrar manualmente desde el dashboard de Supabase

Si en algún momento tenés que borrar un usuario o un comercio a mano:

- **No se puede** borrar primero el usuario de la tabla `usuarios` ni el comercio de `comercios` si hay filas que los referencian (ventas, compras, historial_cajas, ventas_rapidas, etc.).
- **Orden recomendado** (para un comercio dado):
  1. Borrar filas en: `venta_items` (o borrar `ventas` y dejar que CASCADE borre `venta_items`), `ventas`, `compra_items` / `compras`, `movimientos_inventario`, `historial_cajas`, `ventas_rapidas` de ese comercio.
  2. Luego borrar los usuarios de **Authentication** (así se borran las filas en `usuarios` por CASCADE).
  3. Por último borrar el **comercio** en la tabla `comercios`.

O usar siempre **Configuración → Eliminar cuenta** en la app: la Edge Function hace este orden de borrado por vos.
