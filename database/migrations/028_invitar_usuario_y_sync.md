# Módulo Usuarios: Invitar y sincronizar

No se requieren migraciones SQL adicionales para el flujo de invitación:

- **Invitación**: La Edge Function `create-comercio-user` usa `auth.admin.inviteUserByEmail()` con metadata (comercio_id, rol_id, nombre, telefono, direccion). El usuario recibe un correo y define su contraseña al aceptar.
- **Sincronización**: La Edge Function `sync-usuario-invite` se llama desde el cliente tras el primer login si el usuario aún no tiene fila en `public.usuarios`. Lee `user_metadata` del usuario en Auth (con service role) e inserta la fila en `public.usuarios`.

La columna `direccion` en `usuarios` ya fue agregada en la migración `027_usuarios_direccion.sql`.

## Despliegue de Edge Functions

Desde la raíz del proyecto (donde está la carpeta `supabase`):

```bash
# Instalar Supabase CLI si no lo tienes: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref TU_PROJECT_REF

# Desplegar
supabase functions deploy create-comercio-user
supabase functions deploy sync-usuario-invite
```

Variables de entorno en el proyecto de Supabase (ya configuradas por defecto para Edge Functions):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Flujo en el frontend

1. Admin (rol dueño) abre "Usuarios" → "Nuevo usuario" y completa: Nombre, Rol, Celular, Dirección, Mail (sin contraseña).
2. El frontend llama a la Edge Function `create-comercio-user` con esos datos. Se envía la invitación por correo.
3. El invitado abre el enlace del correo, define su contraseña y queda autenticado con metadata (comercio_id, rol_id, etc.).
4. En la primera carga de la app, si `getUsuario()` no devuelve fila pero hay sesión, el cliente llama a la Edge Function `sync-usuario-invite`. Esta crea la fila en `public.usuarios` con los datos del metadata.
5. A partir de ahí el usuario usa la app normalmente dentro del comercio asignado.
