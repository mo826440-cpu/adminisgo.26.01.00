# Módulo: Usuarios y permisos

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** solo dueño (`AdminRoute`). No está en `app_modulos`. El dueño no se configura en la matriz.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/usuarios` | Listado del comercio |
| `/usuarios/nuevo` | Invitación |
| `/usuarios/permisos` | Matriz rol × módulo |

## Funciones

- El alta no pide contraseña. `invitarUsuario` llama a la Edge Function `create-comercio-user`. El invitado define la clave al aceptar el correo.
- Campos: nombre, rol, celular, dirección, mail.
- Roles cargados en `002_initial_data.sql`: `dueño`, `vendedor`, `cajero`, `almacenero`. El dueño se detecta por el nombre del rol, no por un flag. El formulario propone por defecto el primer rol que no es dueño.
- No se puede dejar al comercio sin un dueño activo. La base rechaza borrar o cambiar el rol del último dueño.
- `comercio_rol_modulos` no admite filas del rol dueño (trigger). El dueño siempre tiene acceso (`usuario_tiene_permiso_modulo`).
- La matriz edita `permitido` para el resto de los roles. Códigos: los de `MODULO_CODIGOS` en `constants/modulosPermiso.js`, que deben coincidir con `app_modulos`.
- Al crear un comercio se siembran permisos en true para todos los roles que no son dueño.
- Primer ingreso del invitado: `sync-usuario-invite` crea la fila `usuarios` si `app_metadata.invited` y `app_metadata.comercio_id` vienen de la función de invitación.
- `usuarios.id` = `auth.users.id`.
- Hay tablas `usuarios_adicionales` e `historial_cambios_usuario` (migración 020) y un servicio `usuariosAdicionales.js`. La pantalla vigente de alta es la invitación, no ese flujo viejo de usuarios adicionales.
- Guía de la invitación: `database/migrations/028_invitar_usuario_y_sync.md`.

## Datos

`usuarios`, `roles`, `app_modulos`, `comercio_rol_modulos`. Servicios `usuarios.js` y `permisos.js` (`getAppModulosCatalog`, `getPermisosPorRol`, `fetchPermisosMapForUser`, `upsertPermisosRol`).

RLS de usuarios: ver el comercio propio. Escribir la matriz: solo dueño. La UI esconde el módulo con `AdminRoute`; la base también lo impide.

## Estilos

`UsuariosList.css`, `UsuarioForm.css`, `RolesPermisosPage.css`, `registros-seccion.css`.

## Conexiones

- `AuthContext.puedeModulo` lee el mapa armado al iniciar sesión. Un cambio de matriz se ve en el próximo carga de permisos.
- Cada `PermissionRoute` usa los mismos códigos. Si se agrega un módulo, se tocan juntos `app_modulos`, `MODULO_CODIGOS`, `NAV_ORDER_PATHS`, las rutas y esta ficha.
- Acceso: ficha `acceso.md`. El cliente no fija `comercio_id` por `user_metadata`.

## Reglas

- No guardar filas de permiso para el rol dueño.
- No quitar el último dueño activo.
- No commitear ni anotar en esta ficha correos reales, contraseñas ni el JWT.

## Archivos

`pages/usuarios/`, `services/usuarios.js`, `services/permisos.js`, `constants/modulosPermiso.js`, `supabase/functions/create-comercio-user`, `supabase/functions/sync-usuario-invite`, migración `038_comercio_rol_modulos_permisos.sql`.
