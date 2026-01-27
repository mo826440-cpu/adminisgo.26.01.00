# Diagnóstico: Problema de Registro - No se Crea Comercio/Usuario

## 🔴 Problema Reportado

Después de eliminar un usuario y volver a registrarlo:
1. ✅ Se crea en `auth.users` (Supabase Authentication)
2. ❌ NO se crea en `comercios`
3. ❌ NO se crea en `usuarios`
4. ❌ Redirige a login en lugar de `/auth/select-plan`
5. ❌ Después de login, redirige a dashboard (cuando no debería tener comercio)

### ⚠️ PROBLEMA CRÍTICO IDENTIFICADO: Redirección a Producción

**Síntoma**: Al confirmar el email, Supabase redirige a `adminisgo.com` (producción) en lugar de `localhost:5173` (desarrollo local).

**Causa**: Las URLs permitidas en Supabase Dashboard no incluyen `localhost:5173`, o la URL de producción está configurada como predeterminada.

**Solución**: Ver sección "Causa 5: Configuración de URLs en Supabase" más abajo.

---

## 🔍 Pasos de Diagnóstico

### 1. Verificar Estado en Supabase

Ejecutar en Supabase SQL Editor:

```sql
-- Verificar si el usuario existe en auth.users
SELECT id, email, confirmed_at, created_at 
FROM auth.users 
WHERE email = 'tu-email@example.com';

-- Verificar si existe en tabla usuarios
SELECT * FROM usuarios 
WHERE email = 'tu-email@example.com';

-- Verificar si tiene comercio asociado
SELECT u.*, c.nombre as comercio_nombre, c.id as comercio_id
FROM usuarios u
LEFT JOIN comercios c ON c.id = u.comercio_id
WHERE u.email = 'tu-email@example.com';
```

### 2. Verificar Consola del Navegador

1. Abrir F12 → Console
2. Buscar logs que empiecen con:
   - `[AuthCallback]`
   - `[Login]`
   - `[getComercio]`
3. Copiar todos los logs relacionados

**Logs esperados después de confirmar email:**
```
[AuthCallback] Verificando comercio: { comercio: null, error: null }
[AuthCallback] Usuario NO tiene comercio, redirigiendo a select-plan
```

**Si ves esto, hay un problema:**
```
[AuthCallback] Verificando comercio: { comercio: {...}, error: null }
[AuthCallback] Usuario tiene comercio, redirigiendo a dashboard
```

### 3. Verificar Políticas RLS

Ejecutar en Supabase SQL Editor:

```sql
-- Verificar políticas RLS de comercios
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'comercios';

-- Verificar función get_user_comercio_id
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'get_user_comercio_id';
```

### 4. Verificar que la Función Existe

```sql
-- Verificar función crear_comercio_y_usuario
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'crear_comercio_y_usuario';
```

---

## 🐛 Posibles Causas

### Causa 1: Políticas RLS Incorrectas

**Síntoma**: `getComercio()` retorna un comercio cuando no debería

**Solución**: Verificar que las políticas RLS estén correctamente configuradas:

```sql
-- La política debería ser:
CREATE POLICY "Users can view their own comercio"
  ON comercios FOR SELECT
  USING (id = get_user_comercio_id());
```

Si `get_user_comercio_id()` retorna NULL (usuario no existe en `usuarios`), la política no debería permitir ver ningún comercio.

### Causa 2: Comercio "Huérfano" en la BD

**Síntoma**: Hay un comercio sin usuario asociado que se está retornando

**Solución**: Verificar comercios sin usuarios:

```sql
-- Buscar comercios sin usuarios asociados
SELECT c.*
FROM comercios c
LEFT JOIN usuarios u ON u.comercio_id = c.id
WHERE u.id IS NULL;
```

Si hay comercios huérfanos, eliminarlos o asociarlos correctamente.

### Causa 3: Usuario No Está Autenticado en AuthCallback

**Síntoma**: `AuthCallback` redirige a login porque `isAuthenticated` es false

**Solución**: Verificar en consola si aparece:
```
[AuthCallback] Usuario no autenticado, redirigiendo a login
```

Esto puede pasar si:
- La sesión no se estableció correctamente después de confirmar email
- Hay un problema con las cookies/localStorage

### Causa 4: Error al Crear Comercio/Usuario

**Síntoma**: El usuario llega a `CompleteRegistration` pero no se crea el comercio

**Solución**: 
1. Abrir F12 → Console
2. Completar el registro
3. Buscar errores relacionados con `crear_comercio_y_usuario`
4. Verificar en Network tab la respuesta de la llamada RPC

### Causa 5: Configuración de URLs en Supabase (PROBLEMA PRINCIPAL)

**Síntoma**: 
- Al confirmar email, redirige a `adminisgo.com` en lugar de `localhost:5173`
- Errores de "Invalid Refresh Token" en consola
- El usuario se autentica en producción pero estás probando en local

**Solución CRÍTICA**:

1. **Ir a Supabase Dashboard**:
   - Authentication → URL Configuration
   - O Authentication → Settings → Auth URL Configuration

2. **Agregar URL de desarrollo local**:
   - En "Site URL": Debe estar `https://adminisgo.com` (producción)
   - En "Redirect URLs": Agregar:
     - `http://localhost:5173/**` (desarrollo local)
     - `http://localhost:5173/auth/callback` (callback específico)
     - `https://adminisgo.com/**` (producción - ya debería estar)

3. **Verificar configuración de email**:
   - Authentication → Email Templates
   - Verificar que el template de "Confirm signup" use la URL correcta
   - O usar variables como `{{ .ConfirmationURL }}` que Supabase reemplaza automáticamente

4. **Solución temporal para pruebas locales**:
   - Usar el enlace de confirmación manualmente desde Supabase Dashboard
   - O modificar temporalmente el `emailRedirectTo` en `auth.js` para forzar localhost:
   ```javascript
   emailRedirectTo: process.env.NODE_ENV === 'development' 
     ? 'http://localhost:5173/auth/callback'
     : `${window.location.origin}/auth/callback`
   ```

**IMPORTANTE**: Después de cambiar las URLs en Supabase, puede tomar unos minutos en aplicarse. Espera 2-3 minutos y prueba nuevamente.

---

## ✅ Soluciones

### Solución 1: Limpiar Datos de Prueba

Si hay datos inconsistentes:

```sql
-- CUIDADO: Esto elimina datos. Solo usar en desarrollo/testing

-- Eliminar usuario de auth.users (hacer desde Supabase Dashboard → Authentication)
-- Luego eliminar de tabla usuarios si existe
DELETE FROM usuarios WHERE email = 'tu-email@example.com';

-- Eliminar comercios huérfanos (si los hay)
DELETE FROM comercios 
WHERE id NOT IN (SELECT DISTINCT comercio_id FROM usuarios WHERE comercio_id IS NOT NULL);
```

### Solución 2: Verificar Flujo Completo

1. **Eliminar usuario completamente**:
   - Supabase Dashboard → Authentication → Users
   - Eliminar el usuario
   - Verificar que no existe en `usuarios` ni `comercios`

2. **Registrar nuevamente**:
   - Ir a `/auth/register`
   - Completar formulario
   - Confirmar email

3. **Verificar logs en consola**:
   - Debe aparecer: `[AuthCallback] Usuario NO tiene comercio`
   - Debe redirigir a `/auth/select-plan`

4. **Completar registro**:
   - Seleccionar plan
   - Completar formulario en `CompleteRegistration`
   - Verificar que se crea comercio y usuario

### Solución 3: Verificar Permisos de la Función

```sql
-- Verificar que la función tiene SECURITY DEFINER
SELECT 
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_name = 'crear_comercio_y_usuario';

-- Debe retornar: security_type = 'DEFINER'
```

---

## 📋 Checklist de Verificación

### Configuración de Supabase (CRÍTICO)
- [ ] **Site URL configurada correctamente en Supabase Dashboard**
- [ ] **Redirect URLs incluyen `http://localhost:5173/**`** (para desarrollo)
- [ ] **Redirect URLs incluyen `https://adminisgo.com/**`** (para producción)
- [ ] El enlace de confirmación de email tiene `redirect_to=http://localhost:5173/auth/callback`
- [ ] Después de confirmar email, redirige a `localhost:5173` (NO a `adminisgo.com`)

### Verificación de Datos
- [ ] Usuario existe en `auth.users` después de confirmar email
- [ ] Usuario NO existe en `usuarios` antes de completar registro
- [ ] `getComercio()` retorna `null` cuando el usuario no tiene comercio
- [ ] No hay comercios "huérfanos" en la BD

### Logs y Errores
- [ ] Logs en consola muestran el flujo correcto (`[AuthCallback]`, `[Login]`, `[getComercio]`)
- [ ] No hay errores de "Invalid Refresh Token" en consola
- [ ] No hay errores en Network tab al llamar a `crear_comercio_y_usuario`

### Base de Datos
- [ ] Políticas RLS están correctamente configuradas
- [ ] Función `crear_comercio_y_usuario` existe y tiene SECURITY DEFINER

---

## 🆘 Si Nada Funciona

1. **Revisar logs completos**:
   - Consola del navegador (F12)
   - Supabase Dashboard → Logs → Postgres Logs

2. **Probar con usuario completamente nuevo**:
   - Email que nunca haya sido usado
   - Seguir el flujo completo desde cero

3. **Verificar migraciones**:
   - Asegurarse de que todas las migraciones estén ejecutadas
   - Especialmente: `005_register_flow.sql` y `016_actualizar_registro_con_suscripcion.sql`

---

**Última actualización**: 2025-01-26
