# Configuración de Mercado Pago

## 📋 Pasos para Configurar Mercado Pago

### 1. Crear Cuenta en Mercado Pago

1. Ve a: https://www.mercadopago.com.ar/
2. Crea una cuenta o inicia sesión
3. Completa la verificación de identidad
4. Configura tu información de negocio

### 2. Obtener Credenciales

1. Ve a: https://www.mercadopago.com.ar/developers/panel
2. Crea una nueva aplicación (o usa una existente)
3. Obtén tus credenciales:
   - **Public Key** (clave pública) - Se usa en el frontend
   - **Access Token** (token de acceso) - Se usa en el backend (NUNCA exponer en frontend)

### 3. Configurar Variables de Entorno

#### En `.env` (desarrollo):
```env
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxxxxxxx
```

#### En Vercel (producción):
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `VITE_MERCADOPAGO_PUBLIC_KEY` = Tu Public Key de producción

### 4. Configurar Webhooks

1. En el panel de Mercado Pago, ve a "Webhooks"
2. Agrega la URL de tu webhook:
   - Desarrollo: `http://localhost:5173/api/webhooks/mercadopago` (si usas Vercel Dev)
   - Producción: `https://adminisgo.com/api/webhooks/mercadopago`
3. Selecciona los eventos a escuchar:
   - `payment`
   - `merchant_order`

### 5. Seleccionar Tipo de Checkout

**IMPORTANTE**: Para suscripciones recurrentes (planes mensuales/anuales), necesitas:

**Opción Recomendada: Pestaña "Suscripciones"**
- Si hay una opción específica para suscripciones, elige esa
- Está diseñada específicamente para pagos recurrentes
- Maneja renovaciones automáticas

**Alternativa: Checkout Bricks**
- Si no hay opción de suscripciones, elige "Checkout Bricks"
- ✅ Acepta pagos recurrentes
- ✅ Integración modular
- ❌ NO elijas "Checkout Pro" (no acepta pagos recurrentes)

### 6. Configurar Productos en Mercado Pago

No es necesario crear productos manualmente en Mercado Pago. Se crearán dinámicamente desde el código usando la API.

---

## 🔐 Seguridad

**IMPORTANTE:**
- ✅ La **Public Key** puede estar en el frontend
- ❌ El **Access Token** NUNCA debe estar en el frontend
- ✅ El Access Token solo debe usarse en el backend (Supabase Edge Functions o Vercel API Routes)
- ✅ Validar siempre la firma de los webhooks

---

## 📝 Próximos Pasos

1. ✅ API Routes ya creadas en `frontend/api/`
2. Instalar dependencias: `npm install mercadopago` (en carpeta frontend)
3. Configurar variables de entorno en Vercel
4. Configurar webhooks
5. Testing con tarjetas de prueba

---

**Nota**: Durante desarrollo, usa las credenciales de **TEST**. Solo cambia a **PRODUCCIÓN** cuando estés listo para recibir pagos reales.
