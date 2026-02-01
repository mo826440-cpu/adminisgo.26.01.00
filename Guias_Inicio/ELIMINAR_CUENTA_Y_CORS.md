# Eliminar cuenta y CORS

## 1. Error "Failed to fetch" al eliminar cuenta (CORS)

El mensaje **"Response to preflight request doesn't pass access control check: It does not have HTTP ok status"** significa que la petición OPTIONS a la Edge Function no está devolviendo un 200. Hay que **desplegar de nuevo** la función y, si hace falta, revisar configuración en Supabase.

### Pasos obligatorios

1. **Configurar `verify_jwt = false` para esta función**  
   En `supabase/config.toml` está definido `[functions.eliminar-cuenta-comercio]` con `verify_jwt = false`. Así el gateway **no** exige JWT en la petición OPTIONS (preflight); si no, OPTIONS devuelve 401 y el navegador bloquea por CORS. La función sigue comprobando el JWT y el rol (dueño) dentro del código.

2. **Volver a desplegar la función** (desde la raíz del proyecto, con Supabase CLI):

   ```bash
   supabase login
   supabase link --project-ref luaxxiedrxexrpeludyo
   supabase functions deploy eliminar-cuenta-comercio
   ```

3. **Comprobar que la función existe**: En Supabase Dashboard → **Edge Functions** → debe aparecer `eliminar-cuenta-comercio`. Si no está, el preflight puede dar 404.

4. **Probar la función**: En Edge Functions → `eliminar-cuenta-comercio` → pestaña "Logs". Desde la app, intentá "Eliminar cuenta" y revisá si aparecen peticiones (OPTIONS y POST) y si hay errores.

### Si después de desplegar sigue el CORS

- En **Supabase Dashboard** → **Project Settings** → **API**: buscar opción de dominios/orígenes permitidos y añadir `https://www.adminisgo.com` y `https://adminisgo.com`.
- Confirmar que en el front la URL sea la correcta: `VITE_SUPABASE_URL` + `/functions/v1/eliminar-cuenta-comercio` (sin barra final).

### Cambios en la Edge Function

- **CORS**: OPTIONS devuelve **200** con cuerpo `"ok"` y cabeceras CORS (algunos entornos exigen 200 en el preflight).
- **Orden de borrado**: ventas → compras → movimientos_inventario → historial_cajas → ventas_rapidas → usuarios en Auth → comercio.

### 3. Borrar manualmente desde el dashboard de Supabase

Si en algún momento tenés que borrar un usuario o un comercio a mano:

- **No se puede** borrar primero el usuario de la tabla `usuarios` ni el comercio de `comercios` si hay filas que los referencian (ventas, compras, historial_cajas, ventas_rapidas, etc.).
- **Orden recomendado** (para un comercio dado):
  1. Borrar filas en: `venta_items` (o borrar `ventas` y dejar que CASCADE borre `venta_items`), `ventas`, `compra_items` / `compras`, `movimientos_inventario`, `historial_cajas`, `ventas_rapidas` de ese comercio.
  2. Luego borrar los usuarios de **Authentication** (así se borran las filas en `usuarios` por CASCADE).
  3. Por último borrar el **comercio** en la tabla `comercios`.

O usar siempre **Configuración → Eliminar cuenta** en la app: la Edge Function hace este orden de borrado por vos.

---

## 4. Avisos en la consola del Table Editor de Supabase

Los mensajes que ves en la consola al entrar al **Table Editor** de Supabase:

- **"Please install/enable Redux devtools extension"** — aviso de la interfaz de Supabase Studio.
- **"ConfigCat - WARN - There is an existing client instance..."** — configuración interna de Supabase.
- **"Flag key 'realtimeButtonVariant' does not exist in PostHog flag store"** — feature flags de Supabase (PostHog).

**No son errores de tu base de datos ni de tu app.** Son de la propia interfaz del Dashboard. Podés ignorarlos; no afectan eliminar cuenta ni el uso de las tablas.
