# Implementación de Mercado Pago - Guía Completa

## 📋 Estado Actual

✅ **Completado:**
- Servicio `mercadopago.js` creado
- Página `CambiarPlan.jsx` modificada para usar Mercado Pago
- API Routes creadas (necesitan deploy)

⏳ **Pendiente:**
- Instalar SDK de Mercado Pago
- Configurar variables de entorno
- Crear funciones RPC en Supabase (alternativa a API Routes)
- Deploy de API Routes o Edge Functions
- Configurar webhooks
- Testing completo

---

## 🚀 Pasos para Completar la Implementación

### Paso 1: Instalar SDK de Mercado Pago

```bash
cd frontend
npm install mercadopago
```

**Nota**: Para el frontend, no necesitas instalar el SDK completo. Las preferencias se crean en el backend.

### Paso 2: Configurar Variables de Entorno

#### En `.env` (desarrollo):
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

#### En Vercel (producción):
1. Ve a Settings → Environment Variables
2. Agrega:
   - `MERCADOPAGO_ACCESS_TOKEN` = Tu Access Token de producción
   - `NEXT_PUBLIC_APP_URL` = `https://adminisgo.com`
   - `SUPABASE_URL` = Tu URL de Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = Tu Service Role Key (para webhooks)

### Paso 3: Elegir Backend (API Routes o Supabase Edge Functions)

#### Opción A: Vercel API Routes (Recomendado para empezar)

1. Crear carpeta `api` en la raíz del proyecto:
   ```
   api/
     mercadopago/
       crear-preferencia.js
     webhooks/
       mercadopago.js
   ```

2. Instalar dependencias en la raíz:
   ```bash
   npm install mercadopago @supabase/supabase-js
   ```

3. Vercel detectará automáticamente las API Routes

#### Opción B: Supabase Edge Functions (Más seguro, mejor integración)

1. Instalar Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Inicializar funciones:
   ```bash
   supabase functions new crear-preferencia-mercadopago
   supabase functions new webhook-mercadopago
   ```

3. Implementar funciones (similar a API Routes pero en Deno)

---

### Paso 4: Modificar Servicio para Usar API Route

Actualizar `frontend/src/services/mercadopago.js`:

```javascript
export const crearPreferenciaPago = async (datos) => {
  try {
    // Llamar a API Route en lugar de RPC
    const response = await fetch('/api/mercadopago/crear-preferencia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al crear preferencia')
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear preferencia de pago:', error)
    return { data: null, error }
  }
}
```

---

### Paso 5: Configurar Webhooks en Mercado Pago

1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu aplicación
3. Ve a "Webhooks"
4. Agrega URL:
   - Producción: `https://adminisgo.com/api/webhooks/mercadopago`
   - Test: Usa ngrok o similar para desarrollo local
5. Selecciona eventos:
   - `payment`
   - `merchant_order`

---

### Paso 6: Crear Funciones RPC en Supabase (Alternativa)

Si prefieres usar Supabase en lugar de API Routes, crea estas funciones:

```sql
-- Función para crear preferencia (llama a Mercado Pago API)
CREATE OR REPLACE FUNCTION crear_preferencia_mercadopago(
  p_plan_id INTEGER,
  p_plan_nombre VARCHAR,
  p_monto DECIMAL,
  p_tipo_pago VARCHAR,
  p_comercio_id INTEGER,
  p_email_usuario VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Esta función necesitaría usar http extension para llamar a Mercado Pago API
-- O mejor, usar Supabase Edge Function
$$;
```

**Recomendación**: Usar Supabase Edge Functions en lugar de RPC para llamadas HTTP externas.

---

### Paso 7: Testing

#### Testing con Tarjetas de Prueba:

Mercado Pago proporciona tarjetas de prueba:

**Tarjeta aprobada:**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura
- Nombre: Cualquier nombre

**Tarjeta rechazada:**
- Número: `5031 4332 1540 6351`

#### Flujo de Testing:

1. Seleccionar plan de pago
2. Debe redirigir a Mercado Pago
3. Usar tarjeta de prueba
4. Completar pago
5. Verificar que redirige a `/configuracion/cambiar-plan?status=approved`
6. Verificar que el plan se actualizó en la BD
7. Verificar que se creó la suscripción

---

## 🔐 Seguridad

### Validación de Webhooks:

Mercado Pago envía un header `x-signature` que debes validar:

```javascript
import crypto from 'crypto'

function validateWebhookSignature(body, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex')
  
  return hash === signature
}
```

### Variables de Entorno:

- ✅ `MERCADOPAGO_ACCESS_TOKEN` - Solo en backend
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Solo en backend
- ✅ `MERCADOPAGO_PUBLIC_KEY` - Puede estar en frontend (opcional, no se usa en esta implementación)

---

## 📝 Checklist de Implementación

- [ ] Instalar `mercadopago` package
- [ ] Configurar variables de entorno
- [ ] Crear API Routes o Edge Functions
- [ ] Modificar servicio para usar API Route
- [ ] Configurar webhooks en Mercado Pago
- [ ] Testing con tarjetas de prueba
- [ ] Verificar actualización de plan después de pago
- [ ] Verificar creación de suscripción
- [ ] Testing de webhooks
- [ ] Deploy a producción

---

## 🆘 Problemas Comunes

### Error: "Cannot find module 'mercadopago'"
- **Solución**: Instalar package: `npm install mercadopago`

### Error: "Access Token inválido"
- **Solución**: Verificar que `MERCADOPAGO_ACCESS_TOKEN` esté configurado correctamente

### Webhook no se recibe
- **Solución**: 
  - Verificar URL del webhook en Mercado Pago
  - Usar ngrok para desarrollo local
  - Verificar que la ruta `/api/webhooks/mercadopago` existe

### Pago aprobado pero plan no se actualiza
- **Solución**: 
  - Verificar logs del webhook
  - Verificar que el webhook está procesando correctamente
  - Verificar que `comercio_id` y `plan_id` están en metadata

---

## 📚 Recursos

- [Documentación Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test/test-cards)

---

**¿Necesitas ayuda con algún paso específico?** Puedo ayudarte a implementar las API Routes o Edge Functions cuando estés listo.
