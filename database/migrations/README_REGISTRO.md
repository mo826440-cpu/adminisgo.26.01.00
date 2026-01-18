# Proceso de Registro - Guía de Implementación

## Flujo de Registro en Dos Pasos

El registro se realiza en dos pasos para evitar problemas con la confirmación de email:

### Paso 1: Registro Básico (`/auth/register`)
1. Usuario ingresa email y contraseña
2. Se crea el usuario en `auth.users` de Supabase
3. Se envía email de confirmación
4. Usuario debe revisar su email y confirmar

### Paso 2: Completar Registro (`/auth/complete-registration`)
1. Después de confirmar el email, Supabase redirige al usuario
2. El usuario ya tiene sesión activa (autenticado)
3. Completa los datos del comercio (nombre del comercio, su nombre)
4. Se llama a la función `crear_comercio_y_usuario()` que crea:
   - El registro en la tabla `comercios`
   - El registro en la tabla `usuarios` con el `comercio_id` asociado
5. Se redirige al login para que el usuario inicie sesión

## Configuración en Supabase

### 1. Configurar URL de Redirección después de Confirmación de Email

En Supabase Dashboard:
1. Ve a **Authentication** → **URL Configuration**
2. En **Site URL**, asegúrate de que esté: `http://localhost:5173` (desarrollo) o tu dominio en producción
3. En **Redirect URLs**, agrega:
   - `http://localhost:5173/auth/complete-registration` (desarrollo)
   - `https://tu-dominio.com/auth/complete-registration` (producción)

### 2. Configuración de Email (Opcional)

En **Authentication** → **Email Templates**:
- Puedes personalizar el email de confirmación
- El enlace de confirmación redirigirá automáticamente a `/auth/complete-registration`

## Verificación

Para verificar que funciona:

1. Registra un nuevo usuario en `/auth/register`
2. Revisa tu email y confirma el enlace
3. Deberías ser redirigido a `/auth/complete-registration`
4. Completa los datos del comercio
5. Verifica en Supabase:
   - Tabla `comercios`: Debe existir el comercio
   - Tabla `usuarios`: Debe existir el usuario con el `comercio_id` correcto
6. Inicia sesión y deberías poder crear productos sin errores RLS

## Notas Importantes

- La función `crear_comercio_y_usuario()` requiere que el usuario tenga sesión activa (por eso funciona en el paso 2, no en el paso 1)
- Si el usuario ya tiene un comercio asociado, la función mostrará un error
- El plan por defecto es el plan gratis (id=1)
