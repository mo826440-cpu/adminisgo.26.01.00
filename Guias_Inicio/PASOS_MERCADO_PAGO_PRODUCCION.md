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

## Resumen

| Paso | Acción |
|------|--------|
| 1 | Copiar Access Token de **producción** en el panel de MP. |
| 2 | En Vercel, poner ese token en **MERCADOPAGO_ACCESS_TOKEN** para el entorno **Production**. |
| 3 | Redeploy del proyecto en Vercel. |
| 4 | Probar un pago desde adminisgo.com y revisar retorno + actualización de plan. |

Si algo no coincide (dominio, 404 en webhook, etc.), revisá que el deployment que sirve `adminisgo.com` sea el que tiene las variables de **Production** y que el redeploy haya terminado correctamente.
