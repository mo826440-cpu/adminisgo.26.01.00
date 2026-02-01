# Eliminar cuenta y CORS

## 0. "No veo ninguna función cargada" en Supabase

Si en **Supabase Dashboard** → **Edge Functions** no aparece ninguna función, **ninguna está desplegada**. La app llama a la URL pero no hay función en el proyecto, por eso falla (404 / CORS). Hay que desplegar desde tu PC con la **Supabase CLI**.

### Desplegar por primera vez (paso a paso)

**No hace falta instalar Supabase CLI.** Se usa con `npx` desde la raíz del proyecto (tenés que tener Node.js instalado).

1. **Abrir PowerShell** y ir a la **raíz del proyecto** (donde está la carpeta `supabase`):
   ```powershell
   cd c:\adminisgo.26.01.00
   ```

2. **Iniciar sesión en Supabase** (se abrirá el navegador):
   ```powershell
   npx supabase login
   ```

3. **Vincular el proyecto** (Reference ID: `luaxxiedrxexrpeludyo`):
   ```powershell
   npx supabase link --project-ref luaxxiedrxexrpeludyo
   ```
   Si pide contraseña de la base de datos: Dashboard → **Project Settings** → **Database** → **Database password**.

4. **Desplegar la función**:
   ```powershell
   npx supabase functions deploy eliminar-cuenta-comercio
   ```

5. **Comprobar**: En Supabase Dashboard → **Edge Functions** debería aparecer **eliminar-cuenta-comercio**.

6. **Opcional – otras funciones**:
   ```powershell
   npx supabase functions deploy create-comercio-user
   npx supabase functions deploy sync-usuario-invite
   ```

### Nota sobre la instalación

- **No usar** `npm install -g supabase`: Supabase ya no permite instalar la CLI como módulo global.
- Usar siempre **`npx supabase`** desde la carpeta del proyecto (donde está la carpeta `supabase`).
- Si no tenés Node.js: instalalo desde https://nodejs.org (LTS).

---

## 1. Error "Failed to fetch" al eliminar cuenta (CORS)

El mensaje **"Response to preflight request doesn't pass access control check: It does not have HTTP ok status"** puede ser porque (1) la función no está desplegada (ver sección 0) o (2) el preflight OPTIONS no devuelve 200 (ver abajo).

### Pasos obligatorios

1. **Confirmar que la función está desplegada**: En Supabase Dashboard → **Edge Functions** tiene que aparecer **eliminar-cuenta-comercio**. Si no está, seguí la sección 0.

2. **Configurar `verify_jwt = false`**  
   En `supabase/config.toml` está definido `[functions.eliminar-cuenta-comercio]` con `verify_jwt = false`. Así el gateway no exige JWT en OPTIONS. Después de tocar `config.toml`, volvé a desplegar: `supabase functions deploy eliminar-cuenta-comercio`.

3. **Comprobar en Logs**: En Edge Functions → `eliminar-cuenta-comercio` → pestaña "Logs". Intentá "Eliminar cuenta" en la app y revisá si aparecen peticiones (OPTIONS y POST) y si hay errores.

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
