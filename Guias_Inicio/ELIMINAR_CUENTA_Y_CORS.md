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

---

## 5. Asesor de seguridad de Supabase (RLS y search_path)

### Los 2 "errores": RLS deshabilitado en `roles` y `planes`

- **Qué son:** Las tablas `roles` y `planes` son de referencia (nombres de roles, planes). En el proyecto se dejaron sin RLS a propósito para que cualquier usuario pueda leerlas.
- **Qué hace el Asesor:** Marca como error que no tengan RLS.
- **Qué hicimos:** La migración **029_rls_roles_planes.sql** habilita RLS en `roles` y `planes` y añade una política que permite **solo SELECT** a usuarios autenticados. El comportamiento es el mismo (todos leen), pero el Asesor deja de marcar error.
- **Aplicar:** Ejecutá el contenido de `database/migrations/029_rls_roles_planes.sql` en el SQL Editor del Dashboard (o aplicá las migraciones si usás un flujo de migraciones).

### Las ~40 "advertencias": Ruta de búsqueda de función mutable (search_path)

- **Qué son:** Funciones en `public` que no tienen `search_path` fijado. Sin eso, en teoría alguien podría crear un esquema que se busque antes y “inyectar” objetos (riesgo bajo en setups típicos).
- **Qué hace el Asesor:** Las lista como advertencia.
- **Corrección:** La migración **030_search_path_funciones.sql** ejecuta un bloque que hace `ALTER FUNCTION ... SET search_path = public` para todas las funciones del esquema `public`. Así se quitan las advertencias.
- **Aplicar:** Ejecutá el contenido de `database/migrations/030_search_path_funciones.sql` en el **SQL Editor** del Dashboard de Supabase. Luego actualizá el Asesor de seguridad; las advertencias de search_path deberían desaparecer.

---

## 6. Otras advertencias del Security Advisor

### RLS Policy Always True en `solicitudes_personalizadas`

- **Qué es:** El Asesor marca políticas RLS que usan expresiones demasiado amplias (por ejemplo `WITH CHECK (true)`), porque en teoría dan acceso muy permisivo.
- **En este proyecto:** La política de INSERT en `solicitudes_personalizadas` permitía crear una fila con `WITH CHECK (true)` para que cualquier usuario (incluso anónimo) pudiera enviar una solicitud de plan personalizado.
- **Qué hicimos:** La migración **031_rls_solicitudes_personalizadas_no_always_true.sql** reemplaza esa política por una que exige que `nombre`, `email` y `mensaje` estén presentes y no vacíos. Sigue pudiendo crear cualquiera, pero la política ya no es literalmente "siempre true".
- **Aplicar:** Ejecutá el contenido de `database/migrations/031_rls_solicitudes_personalizadas_no_always_true.sql` en el SQL Editor del Dashboard.

### Leaked Password Protection deshabilitada (Auth)

- **Qué es:** Supabase puede rechazar contraseñas que aparecen en bases de datos de filtraciones (HaveIBeenPwned). Si está deshabilitado, el Asesor lo muestra como advertencia.
- **Dónde se activa:** En el **Dashboard** → **Authentication** → **Providers** → **Email** (o en **Settings** de Auth, según la versión del panel). Buscá la opción tipo "Leaked password protection" o "Check for compromised passwords" y activala.
- **Requisito:** Esta función suele estar disponible en el **plan Pro** (o superior) de Supabase. En plan gratuito puede no aparecer o no estar disponible.
- **Efecto:** Al registrarse o cambiar contraseña, se rechazarán contraseñas que estén en listas de filtraciones conocidas.
