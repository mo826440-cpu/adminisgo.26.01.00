# Configurar URLs de Redirección en Supabase

## 🔴 Problema

Al confirmar el email durante el registro, Supabase redirige a `adminisgo.com` (producción) en lugar de `localhost:5173` (desarrollo local).

**Síntomas**:
- Error: `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`
- Redirección a `adminisgo.com/dashboard` en lugar de `localhost:5173/auth/select-plan`
- El usuario se autentica en producción pero estás probando en local

---

## ✅ Solución: Configurar URLs en Supabase Dashboard

### Paso 1: Ir a Configuración de URLs

1. Abre Supabase Dashboard
2. Ve a tu proyecto
3. Ve a **Authentication** → **URL Configuration**
   - O **Authentication** → **Settings** → Busca "Auth URL Configuration"

### Paso 2: Configurar Site URL

**Site URL** (URL principal):
- Para desarrollo: `http://localhost:5173`
- Para producción: `https://adminisgo.com`

**⚠️ IMPORTANTE**: 
- Si estás probando en local, cambia temporalmente a `http://localhost:5173`
- O usa la URL de producción pero configura las Redirect URLs correctamente

### Paso 3: Configurar Redirect URLs

En **Redirect URLs**, agrega **TODAS** las URLs que necesitas:

```
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:5173/auth/login
https://adminisgo.com/**
https://adminisgo.com/auth/callback
https://adminisgo.com/auth/login
```

**Formato**:
- Usa `/**` para permitir todas las rutas bajo ese dominio
- O especifica rutas exactas como `/auth/callback`

### Paso 4: Guardar y Esperar

1. Haz clic en **Save**
2. **Espera 2-3 minutos** para que los cambios se apliquen
3. Prueba nuevamente el registro

---

## 🔧 Solución Alternativa: Código Mejorado

Ya actualicé el código en `auth.js` para que en desarrollo siempre use `localhost:5173` explícitamente. Esto ayuda, pero **aún necesitas configurar las URLs en Supabase Dashboard**.

El código ahora detecta si estás en localhost y fuerza la URL:

```javascript
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const redirectUrl = isDevelopment 
  ? 'http://localhost:5173/auth/callback'
  : `${window.location.origin}/auth/callback`
```

---

## 🧪 Verificar que Funciona

1. **Registrar nuevo usuario** en `localhost:5173`
2. **Abrir email de confirmación**
3. **Verificar la URL del enlace**:
   - Debe ser: `https://[tu-proyecto].supabase.co/auth/v1/verify?token=...&redirect_to=http://localhost:5173/auth/callback`
   - NO debe ser: `...&redirect_to=https://adminisgo.com/...`

4. **Hacer clic en el enlace**
5. **Verificar que redirige a**: `http://localhost:5173/auth/callback`
6. **Verificar logs en consola**: Debe aparecer `[AuthCallback] Usuario NO tiene comercio`

---

## 📋 Checklist de Configuración

- [ ] Site URL configurada en Supabase (puede ser producción, pero Redirect URLs deben incluir localhost)
- [ ] Redirect URLs incluyen `http://localhost:5173/**`
- [ ] Redirect URLs incluyen `http://localhost:5173/auth/callback`
- [ ] Redirect URLs incluyen URLs de producción (`https://adminisgo.com/**`)
- [ ] Esperaste 2-3 minutos después de guardar
- [ ] Probaste registrar un usuario nuevo
- [ ] El enlace de confirmación tiene `redirect_to=http://localhost:5173/auth/callback`
- [ ] Después de confirmar, redirige a `localhost:5173` (no a `adminisgo.com`)

---

## 🐛 Si Sigue Redirigiendo a Producción

### Opción 1: Cambiar Site URL Temporalmente

1. En Supabase Dashboard → Authentication → URL Configuration
2. Cambiar **Site URL** a `http://localhost:5173` temporalmente
3. Guardar y esperar 2-3 minutos
4. Probar registro
5. **IMPORTANTE**: Después de probar, volver a cambiar a `https://adminisgo.com`

### Opción 2: Usar Email de Confirmación Manual

1. En Supabase Dashboard → Authentication → Users
2. Encontrar el usuario recién creado
3. Hacer clic en los tres puntos (⋯) → "Send magic link" o "Resend confirmation email"
4. Esto enviará un nuevo email con la URL correcta

### Opción 3: Confirmar Manualmente desde Dashboard

1. En Supabase Dashboard → Authentication → Users
2. Encontrar el usuario
3. Hacer clic en el usuario
4. Verificar que "Email Confirmed" esté en `false`
5. Hacer clic en "Confirm email" o cambiar manualmente a `true`
6. Luego ir manualmente a `http://localhost:5173/auth/callback` en el navegador

---

## 📝 Notas Importantes

- **Las URLs en Supabase son sensibles a mayúsculas/minúsculas**
- **Los cambios pueden tardar 2-3 minutos en aplicarse**
- **Si cambias Site URL, afecta a TODOS los usuarios** (por eso es mejor usar Redirect URLs)
- **Para producción, siempre usa HTTPS**
- **Para desarrollo local, HTTP está bien**

---

## 🔗 Referencias

- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts)
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/auth-helpers/redirect-urls)

---

**Última actualización**: 2025-01-26
