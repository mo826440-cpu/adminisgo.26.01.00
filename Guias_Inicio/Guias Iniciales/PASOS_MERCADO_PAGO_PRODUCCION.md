# Pasar Mercado Pago a producción (Adminis Go)

## 1. Credenciales de producción en Mercado Pago

1. Entrá a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel).
2. Abrí tu aplicación **Adminis Go**.
3. En el menú lateral: **PRODUCCIÓN** → **Credenciales de producción**.
4. Copiá el **Access Token** de producción (empieza con `APP_USR-`, no con `TEST-`).
5. No lo compartas ni lo subas a repositorios; solo lo vas a usar en Vercel.

---

## 2. Variables de entorno en Vercel

1. Entrá a tu proyecto en [Vercel](https://vercel.com) → **Settings** → **Environment Variables**.
2. Buscá **MERCADOPAGO_ACCESS_TOKEN**.
3. **Opción A – Solo producción:**
   - Editá la variable y reemplazá el valor por el **Access Token de producción** (`APP_USR-...`).
   - Dejá aplicado solo al entorno **Production** (o al que use `adminisgo.com`).
4. **Opción B – Mantener pruebas:**
   - Creá otra variable (o editá la existente) y en **Environment** elegí solo **Production**.
   - Valor: Access Token de **producción**.
   - Para **Preview** podés dejar el token **TEST** en una variable que aplique solo a Preview.

Así, al desplegar desde `main` a `adminisgo.com` se usará el token de producción; en previews seguirás en modo prueba.

---

## 3. Redeploy

1. En Vercel: **Deployments** → los tres puntos del último deployment de producción → **Redeploy**.
2. O hacé un nuevo push a la rama que despliega en producción (ej. `main`).

Las variables se leen en el build/run; el redeploy asegura que la API use el token nuevo.

---

## 4. Comportamiento esperado

- **Con token de producción (`APP_USR-...`):**
  - La API de Mercado Pago devuelve solo `init_point` (checkout real).
  - El frontend usa `sandboxInitPoint || initPoint` → como no hay sandbox, usa `init_point` y redirige al checkout real de Mercado Pago.
- **URLs de retorno y webhook:**  
  Si entrás desde `adminisgo.com`, la API ya arma `appUrl` con ese dominio, así que:
  - Vuelta después del pago: `https://www.adminisgo.com/configuracion/cambiar-plan?status=...`
  - Notificaciones: `https://www.adminisgo.com/api/webhooks/mercadopago`

No hace falta cambiar código para eso.

---

## 5. Verificación rápida

1. Entrá a **adminisgo.com** (no incógnito si querés ver la sesión real).
2. Ir a **Configuración** → **Cambiar plan** → **Pagar con Mercado Pago**.
3. Deberías ir a la URL de checkout **sin** “sandbox” (ej. `www.mercadopago.com.ar/checkout/...`).
4. Completá un pago de prueba real (monto bajo) y comprobá que:
   - Volvés a `adminisgo.com/configuracion/cambiar-plan?status=approved` (o pending/rejected).
   - El plan del comercio se actualiza si el webhook está bien configurado (Supabase + `SUPABASE_SERVICE_ROLE_KEY` en Vercel).

---

## 6. Webhook y Supabase en producción

- La **notification_url** se envía en cada preferencia; no hace falta registrar nada más en el panel de MP para que MP llame a tu URL.
- En Vercel, para el entorno **Production**, tené definidas:
  - **MERCADOPAGO_ACCESS_TOKEN** = token de producción.
  - **SUPABASE_URL** y **SUPABASE_SERVICE_ROLE_KEY** del proyecto Supabase que usa adminisgo.com.

Con eso, el webhook que actualiza la suscripción al recibir el pago aprobado funcionará en producción.

---

## 7. Error PA_UNAUTHORIZED_RESULT_FROM_POLICIES (403)

Si al crear la preferencia en producción ves **"At least one policy returned UNAUTHORIZED"** o **PA_UNAUTHORIZED_RESULT_FROM_POLICIES** (403), Mercado Pago está rechazando la operación por políticas de la cuenta o de la aplicación, no por un error en tu código.

**Causa más frecuente: onboarding de la app sin completar**

En el **Detalle de Aplicación** de Adminis Go suele aparecer **"ETAPA 1 DE 5"** y un checklist:

- ✔ Creá las cuentas de prueba  
- ✔ Configurá tu integración  
- **Realizá un pago de prueba** ← si este paso **no está marcado**, MP no habilita producción.

**Qué hacer:**

1. **Hacé un pago de prueba en sandbox** (con token TEST y comprador de prueba) desde tu app.
2. En el panel de desarrolladores → **Adminis Go** → en "Probá tu integración" hacé clic en **"Ya hice la prueba"**.
3. Completá las etapas que sigan (2 a 5) si las muestra.
4. Después de eso, probá de nuevo en producción; el 403 debería desaparecer.

**También revisar:**

1. **Panel de desarrolladores**  
   [developers.mercadopago.com](https://www.mercadopago.com.ar/developers/panel) → tu app **Adminis Go**.  
   - Comprobá que la app esté habilitada para **producción** y que no haya avisos de "Activar para producción" o "Producto pendiente de aprobación".

2. **Cuenta vendedor**  
   Entrá a [www.mercadopago.com.ar](https://www.mercadopago.com.ar) con la cuenta que creó la app.  
   - Verificá que estén completos: datos personales, identidad, datos fiscales y, si corresponde, cuenta bancaria para retiros.

3. **Soporte de Mercado Pago**  
   Si completaste el onboarding y el error sigue, abrí un ticket en el [Centro de ayuda](https://www.mercadopago.com.ar/ayuda) indicando **PA_UNAUTHORIZED_RESULT_FROM_POLICIES** y que estás creando preferencias en producción.

**URLs de redireccionamiento vacías (Configuraciones avanzadas)**

Si en **Editar aplicación** → **Configuraciones avanzadas** el campo **"URLs de redireccionamiento"** está vacío y con borde rojo, completalo: Mercado Pago puede devolver **UNAUTHORIZED** hasta que la app tenga al menos una URL configurada.

- Hacé clic en **"+ Agregar nueva URL"**.
- Agregá la URL a la que volvés después del pago, por ejemplo:  
  `https://www.adminisgo.com/configuracion/cambiar-plan`  
  Si el panel permite varias, podés sumar también:  
  `https://www.adminisgo.com`
- No uses dominios de Mercado Libre (ej. `mercadolibre.com.ar`).
- Guardá los cambios (**Guardar cambios**) y probá de nuevo crear la preferencia en producción.

---

**Si estás en ETAPA 4 DE 5: "Recibí un pago productivo"**

En esa etapa Mercado Pago pide que **proceses al menos un pago real** para terminar de habilitar producción. A veces el 403 se levanta solo después de que MP detecte ese primer pago.

- **Activar credenciales de producción** (si aún no lo hiciste): en **Credenciales de producción** completá **Industria**, **Sitio web** (ej. `https://www.adminisgo.com`), aceptá la Declaración de Privacidad y los Términos, reCAPTCHA y **Activar credenciales de producción**.
- **Primer pago productivo:** intentá hacer un pago real mínimo (ej. desde otra cuenta o tarjeta) en adminisgo.com → Cambiar plan → Pagar con Mercado Pago. Si en algún momento el checkout deja de devolver 403 y el pago se procesa, MP suele registrar la etapa y el error no vuelve.
- Si el 403 sigue impidiendo crear la preferencia (y por tanto no podés hacer ese primer pago), contactá a soporte de MP y explicá que necesitás completar “Recibí un pago productivo” pero la API devuelve **PA_UNAUTHORIZED_RESULT_FROM_POLICIES** al crear la preferencia.

---

## Resumen

| Paso | Acción |
|------|--------|
| 1 | Copiar Access Token de **producción** en el panel de MP. |
| 2 | En Vercel, poner ese token en **MERCADOPAGO_ACCESS_TOKEN** para el entorno **Production**. |
| 3 | Redeploy del proyecto en Vercel. |
| 4 | Probar un pago desde adminisgo.com y revisar retorno + actualización de plan. |

Si algo no coincide (dominio, 404 en webhook, etc.), revisá que el deployment que sirve `adminisgo.com` sea el que tiene las variables de **Production** y que el redeploy haya terminado correctamente.
