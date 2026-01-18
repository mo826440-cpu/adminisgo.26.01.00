# Configuración de URLs en Supabase

## Configuración Necesaria

### 1. Site URL
En **Authentication** → **URL Configuration** → **Site URL**:
- **Desarrollo:** `http://localhost:5173`
- **Producción:** `https://adminisgo.com`

⚠️ **Importante:** El Site URL debe ser la URL base de tu aplicación, NO debe incluir rutas específicas como `/auth/complete-registration`

### 2. Redirect URLs
En **Authentication** → **URL Configuration** → **Redirect URLs**, agrega:

**Para desarrollo:**
```
http://localhost:5173/auth/complete-registration
```

**Para producción:**
```
https://adminisgo.com/auth/complete-registration
```

También podrías agregar un wildcard si necesitas más flexibilidad:
```
https://adminisgo.com/*
```

## Notas Importantes

1. **Site URL:** Es la URL base por defecto. Debe ser la raíz de tu aplicación.
2. **Redirect URLs:** Son las URLs específicas donde Supabase puede redirigir después de autenticación. Aquí SÍ se incluyen las rutas completas.
3. **Dominio adminisgo.com:** Este dominio está configurado en tu proveedor de hosting (GitHub/Vercel/etc.) para servir tu frontend. Supabase solo necesita saber que está permitido para redirecciones.

## Verificación

Después de configurar:
1. Guarda los cambios en Supabase
2. Prueba el flujo de registro completo
3. Verifica que después de confirmar el email, te redirija correctamente

