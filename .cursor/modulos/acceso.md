# Módulo: Acceso

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** rutas públicas. El alta de comercio desde el navegador está cerrada.

## Qué hace

Pantalla de ingreso de Alien’s · Kiosco/Bebidas. El identificador es el correo. No hay nombre de usuario aparte. El registro público de la interfaz redirige al acceso. Esta instalación sigue siendo multi-comercio en la base: no se borraron tablas ni comercios.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` y `/auth/login` | Misma pantalla de ingreso (`Login.jsx`) |
| `/auth/forgot-password` | Recuperar contraseña por correo |
| `/auth/olvide-usuario` | Explica que el identificador es el correo. No consulta ni muestra correos |
| `/reset-password` | Nueva contraseña tras el enlace de recuperación |
| `/auth/callback` | Vuelta de Google (`signInWithOAuth`) |
| `/auth/register`, `/auth/select-plan`, `/auth/complete-registration` | Redirigen a `/` |

`signUp` en `services/auth.js` no llama a Supabase. `LandingPage.jsx` quedó sin ruta.

## Funciones

- Ingreso con correo y contraseña (`signIn`). Mensajes en español para credenciales inválidas y correo sin confirmar.
- Botón de Google en la pantalla. El proveedor hay que tenerlo activo en Supabase. La app de Google quedó en estado Prueba. Entrar con Google no crea comercio ni rol.
- Si no hay fila activa en `usuarios`, o no se puede sincronizar una invitación, la sesión se cierra y se muestra un aviso.
- La sincronización del invitado (`syncUsuarioInvitado` → Edge Function `sync-usuario-invite`) solo corre si `app_metadata.invited` y `app_metadata.comercio_id` los escribió `create-comercio-user`. El cliente no puede fijar ese metadata.
- Tras ingresar, `firstNavigatePath` manda a `/ventas` si el usuario tiene ese módulo. Si no, a `/inicio` o al primer módulo permitido en `NAV_ORDER_PATHS`.
- “Confirm email” sigue prendido en el proyecto remoto. “Allow new users to sign up” quedó apagado. La migración 045 le quita `EXECUTE` de `crear_comercio_y_usuario` a `anon` y `authenticated`. No llamar esa función desde el cliente.
- Las Edge Functions de invitación no se redesplegaron en la sesión del 11 de octubre de 2026 (`supabase` no estaba en PowerShell). Hasta ese redespliegue, el cierre en el servidor de esas funciones no queda confirmado.

## Estilos

- `pages/auth/AccesoShell.css` y `AccesoShell.jsx`.
- Fondo `frontend/public/acceso/fondo-aliens.png` (original en `docs/fondo_pantalla_login.png`).
- La pantalla de acceso no usa el sidebar.

## Conexiones

- `AuthContext` carga `usuarios`, rol y el mapa de `comercio_rol_modulos`.
- Invitación: ficha `usuarios.md` y función `create-comercio-user`.
- Baja de cuenta: ficha `configuracion.md` y función `eliminar-cuenta-comercio`.
- Redirects conocidos: Site URL `https://www.adminisgo.com`; `/auth/callback` y `/reset-password` para localhost, `adminisgo.com` y `www.adminisgo.com`.

## Reglas

- No ofrecer registro público ni selector de plan en el acceso.
- No usar `user_metadata` para asignar `comercio_id` o `rol_id`.
- No guardar contraseñas, tokens ni service role en esta ficha.

## Archivos

`pages/auth/Login.jsx`, `AccesoShell.jsx`, `ForgotPassword.jsx`, `OlvideUsuario.jsx`, `ResetPassword.jsx`, `AuthCallback.jsx`, `services/auth.js`, `context/AuthContext.jsx`, `utils/accesoSesion.js`, migración `045_acceso_unico_negocio.sql`.
