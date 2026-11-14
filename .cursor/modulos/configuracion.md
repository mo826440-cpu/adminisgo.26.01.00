# Módulo: Configuración

**Estado:** implementado  
**Actualizado:** 2026-11-13  
**Permiso:** solo dueño (`AdminRoute`). No está en `app_modulos`.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/configuraciones` | Datos del comercio, perfil, plan, formas de pago, impresoras, baja de cuenta |
| `/configuracion/cambiar-plan` | Planes `gratis`, `basico` y `personalizado` |

## Funciones de `/configuraciones`

- Comercio: nombre, dirección, teléfono, email, CUIT (`getComercio`, `updateComercio`).
- Perfil del usuario logueado: nombre y teléfono (`updateUsuario`).
- Contraseña: modal con clave actual, nueva y confirmación (`updatePassword` de Supabase Auth).
- Zona horaria y formato de fecha (`DateTimeContext`: `updateTimezone`, `updateDateFormat`). Esas preferencias salen de `configuracion_comercio`.
- Plan actual vía `getEstadoSuscripcion`, con badge por tipo (gratis, basico/pago, personalizado). Enlace a cambiar plan.
- Formas de pago (`ConfigFormasPagoSection`, `services/formasPago.js`): alta, edición, baja y una sola preferida por comercio (trigger 043). El POS y la caja consumen estos nombres.
- Impresoras de ticket (`ConfigImpresorasSection`, `services/configImpresoras.js`). Se guardan en `configuracion_comercio.config_impresoras` (jsonb, migración 042). La impresión usa `TicketPrintContext` y `styles/ticketThermalPrint.css`.
- Eliminar cuenta: checkbox, modal y Edge Function `eliminar-cuenta-comercio` (`eliminarCuentaComercio`). Después cierra sesión.

El tema de la app no se cambia acá. Sigue oscuro fijo aunque `configuracion_comercio.tema` exista.

## Cambiar plan y Mercado Pago

- `getPlanes` trae el catálogo y la pantalla deja solo `gratis`, `basico` y `personalizado`. La migración 002 también insertó `pro` y `premium`. La 015 redefinió gratis y basico y no los borra. La 025 dejó el básico en 25000 ARS mensuales y 250000 ARS anuales. Si pro y premium siguen en la base remota, esta UI no los muestra.
- El pago llama `crearPreferenciaPago` contra `/api/mercadopago/crear-preferencia`. El token de Mercado Pago vive en el servidor de Vercel, no en el cliente.
- Vuelta por query `status` y `payment_id`: approved, rejected o pending. El webhook está en `frontend/api/webhooks/mercadopago.js`.
- El cliente también llama las RPC `verificar_pago_mercadopago` y `cancelar_suscripcion_mercadopago` (`services/mercadopago.js`). Desde el repo no se puede confirmar si esas RPC y las variables de Vercel están desplegadas.
- Plan personalizado: `services/planesPersonalizados.js` (solicitud, facturas). Tablas `solicitudes_personalizadas` y `planes_personalizados`.
- Límites que sí usa el resto del sistema: `validarLimiteVentas` al crear una venta y `validarLimiteUsuarios` en el servicio de planes.

## Estilos

`Configuracion.css`, `CambiarPlan.css`, `ConfigFormasPagoSection.css`, `ConfigImpresorasSection.css`, `ticketThermalPrint.css`, `ThermalPrintPreviewModal.css`. Cards y formularios del tema oscuro.

## Conexiones

- Caja clasifica métodos por nombre: efectivo, qr, transferencia, debito, credito. Otro nombre cae en «otros». `pendiente` no es una forma de pago de configuración: es la venta sin cobro.
- Dashboard muestra el mismo estado de suscripción.
- Acceso y usuarios no se administran en esta pantalla, salvo el perfil y la contraseña del dueño logueado.

## Reglas

- No poner el access token de Mercado Pago, la anon key ni la service role en el frontend ni en esta ficha.
- No ofrecer pro ni premium en la pantalla de cambio de plan salvo que se decida mostrarlos y se actualice esta ficha.
- Un solo medio de pago preferido por comercio.

## Archivos

`pages/configuracion/`, `services/comercio.js`, `services/planes.js`, `services/mercadopago.js`, `services/formasPago.js`, `services/configImpresoras.js`, `context/TicketPrintContext.jsx`, `frontend/api/mercadopago/`, `frontend/api/webhooks/mercadopago.js`, migraciones `015`, `022`, `025`, `042`, `043`.
