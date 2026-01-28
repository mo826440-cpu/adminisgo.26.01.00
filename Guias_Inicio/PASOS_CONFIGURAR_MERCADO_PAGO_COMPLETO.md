# Pasos para Configurar Mercado Pago - Guía Completa

## ✅ Lo que ya hiciste:

1. ✅ Creaste la aplicación "Adminis Go" en Mercado Pago
2. ✅ Seleccionaste "Integración con Suscripciones"
3. ✅ Obtuviste las credenciales de prueba:
   - Public Key: `TEST-28804618-592d-4c9b-81a9-467ffe04b845`
   - Access Token: `TEST-8979242948229144-012723-cce1c49d9eb289486b4813f281c60cd0-341843512`
4. ✅ Creaste las cuentas de prueba (comprador y vendedor)

---

## 📋 Próximos Pasos:

### Paso 1: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona el proyecto `adminisgo.26.01.00` (o el nombre que tenga)
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas variables:

   **Variable 1:**
   - Name: `MERCADOPAGO_ACCESS_TOKEN`
   - Value: `TEST-8979242948229144-012723-cce1c49d9eb289486b4813f281c60cd0-341843512`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

   **Variable 2:**
   - Name: `SUPABASE_URL`
   - Value: Tu URL de Supabase (ej: `https://xxxxx.supabase.co`)
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

   **Variable 3:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Tu Service Role Key de Supabase (la encuentras en Supabase Dashboard → Settings → API)
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

   **Variable 4 (Opcional - Vercel lo detecta automáticamente):**
   - Name: `VERCEL_URL`
   - Value: Se configura automáticamente, pero puedes agregarlo manualmente si necesitas
   - Environment: ✅ Production, ✅ Preview, ✅ Development

---

### Paso 2: Configurar Webhooks en Mercado Pago

1. En el panel de Mercado Pago, ve a **"NOTIFICACIONES"** → **"Webhooks"**
2. Haz clic en **"Configurar webhooks"** o **"Agregar webhook"**
3. Configura:
   - **URL del webhook**: `https://adminisgo.com/api/webhooks/mercadopago`
   - **Eventos a escuchar**:
     - ✅ `payment`
     - ✅ `merchant_order`
     - ✅ `subscription` (si está disponible)
4. Guarda la configuración

**Nota para desarrollo local:**
- Para probar webhooks localmente, usa ngrok o similar
- O espera a hacer el deploy a Vercel para probar

---

### Paso 3: Instalar Dependencias

En tu terminal:

```bash
cd frontend
npm install mercadopago
```

---

### Paso 4: Verificar Tarjetas de Prueba

1. En Mercado Pago, ve a **"PRUEBAS"** → **"Tarjetas de prueba"**
2. Anota las tarjetas de prueba que te dan (las usarás para testing)

**Tarjetas comunes de prueba:**
- **Aprobada**: `5031 7557 3453 0604` (CVV: 123, cualquier fecha futura)
- **Rechazada**: `5031 4332 1540 6351`

---

### Paso 5: Hacer Deploy y Probar

1. Haz commit y push de todos los cambios
2. Vercel detectará el push y hará deploy automáticamente
3. Una vez deployado, prueba:
   - Ir a `/configuracion/cambiar-plan`
   - Seleccionar un plan de pago
   - Debería redirigir a Mercado Pago
   - Usar tarjeta de prueba
   - Verificar que redirige de vuelta con `status=approved`

---

## 🔍 Verificación

Después de configurar todo, verifica:

- [ ] Variables de entorno agregadas en Vercel
- [ ] Webhook configurado en Mercado Pago
- [ ] Dependencias instaladas (`npm install mercadopago`)
- [ ] Deploy realizado en Vercel
- [ ] Prueba de checkout funciona

---

## 🆘 Si algo no funciona

1. **Verifica logs de Vercel**: Ve a tu proyecto → Deployments → Click en el último deployment → Functions → Ver logs
2. **Verifica webhooks**: En Mercado Pago, ve a Webhooks y revisa si hay intentos de notificación
3. **Revisa consola del navegador**: F12 → Console para ver errores del frontend

---

**¿Necesitas ayuda con algún paso específico?**
