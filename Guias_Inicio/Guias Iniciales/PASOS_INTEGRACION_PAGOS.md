# Pasos para Integrar Sistema de Pagos

## ✅ Confirmación

**Sí, puedo ayudarte a integrar el sistema de pagos completo.** Aquí están los pasos detallados:

---

## 🎯 Opciones de Pasarela de Pago

### Opción 1: Stripe (Recomendado para internacional)
- ✅ Soporta tarjetas internacionales
- ✅ Muy buena documentación
- ✅ Webhooks robustos
- ✅ Dashboard completo
- ⚠️ Comisiones: ~3.4% + $0.30 por transacción
- ⚠️ Requiere cuenta bancaria en países soportados

### Opción 2: Mercado Pago (Recomendado para Argentina)
- ✅ Perfecto para Argentina
- ✅ Acepta tarjetas locales e internacionales
- ✅ Integración con AFIP (facturación)
- ✅ Pagos en efectivo (Rapipago, Pago Fácil)
- ⚠️ Comisiones: ~4.99% + $0.50 por transacción
- ✅ Ideal para mercado argentino

### Opción 3: Ambas (Híbrido)
- Stripe para pagos internacionales
- Mercado Pago para Argentina
- El usuario elige al momento de pagar

---

## 📋 Pasos Detallados de Implementación

### FASE 1: Configuración Inicial (1-2 días)

#### 1.1. Crear Cuenta en Pasarela de Pago
- [ ] Crear cuenta en Stripe o Mercado Pago
- [ ] Completar verificación de identidad
- [ ] Configurar información de negocio
- [ ] Obtener API Keys (Test y Live)
- [ ] Configurar webhooks

#### 1.2. Configurar Productos y Precios
- [ ] Plan Gratis (gratis, sin precio)
- [ ] Plan Pago Mensual ($9.99/mes)
- [ ] Plan Pago Anual ($99.90/año)
- [ ] Usuario Adicional ($9.99/año)

#### 1.3. Variables de Entorno
- [ ] Agregar `VITE_STRIPE_PUBLIC_KEY` (o equivalente para Mercado Pago)
- [ ] Configurar webhook secret
- [ ] Documentar variables necesarias

---

### FASE 2: Backend - Webhooks (2-3 días)

#### 2.1. Crear Endpoint para Webhooks
**Opción A: Supabase Edge Function**
- [ ] Crear función en `supabase/functions/stripe-webhook/`
- [ ] Validar firma del webhook
- [ ] Manejar eventos:
  - [ ] `checkout.session.completed` (pago exitoso)
  - [ ] `invoice.payment_succeeded` (renovación exitosa)
  - [ ] `invoice.payment_failed` (pago fallido)
  - [ ] `customer.subscription.deleted` (cancelación)
  - [ ] `customer.subscription.updated` (cambio de plan)

**Opción B: Vercel API Route**
- [ ] Crear `api/webhooks/stripe.js` (o similar)
- [ ] Mismo manejo de eventos

#### 2.2. Lógica de Webhooks
- [ ] **checkout.session.completed**:
  - [ ] Obtener `comercio_id` del metadata
  - [ ] Crear registro en tabla `suscripciones`
  - [ ] Actualizar `plan_id` en tabla `comercios`
  - [ ] Calcular `fecha_fin_periodo_gratis` (si aplica)
  - [ ] Enviar email de confirmación

- [ ] **invoice.payment_succeeded**:
  - [ ] Actualizar `fecha_proximo_pago` en `suscripciones`
  - [ ] Crear registro de facturación
  - [ ] Enviar email de confirmación

- [ ] **invoice.payment_failed**:
  - [ ] Marcar suscripción como "pago_pendiente"
  - [ ] Iniciar período de gracia (30 días)
  - [ ] Enviar email de advertencia
  - [ ] Notificar al usuario en la app

- [ ] **customer.subscription.deleted**:
  - [ ] Marcar suscripción como "cancelada"
  - [ ] Permitir acceso hasta fin de período pagado
  - [ ] Enviar email de cancelación

- [ ] **customer.subscription.updated**:
  - [ ] Actualizar `plan_id` en `comercios`
  - [ ] Actualizar límites según nuevo plan
  - [ ] Enviar email de confirmación

---

### FASE 3: Frontend - Checkout (2-3 días)

#### 3.1. Instalar SDK
- [ ] Instalar `@stripe/stripe-js` (o SDK de Mercado Pago)
- [ ] Configurar cliente en servicio

#### 3.2. Crear Servicio de Pagos
- [ ] Crear `frontend/src/services/stripe.js` (o `mercadopago.js`)
- [ ] Función `crearCheckoutSesion(planId, tipoPago)`:
  - [ ] Llamar a API para crear sesión de checkout
  - [ ] Redirigir a Stripe Checkout (o Mercado Pago)
  - [ ] Pasar `comercio_id` en metadata

- [ ] Función `crearCheckoutUsuarioAdicional(comercioId)`:
  - [ ] Similar a checkout de plan
  - [ ] Precio fijo: $9.99/año

#### 3.3. Página de Cambiar Plan (Ya creada - solo integrar)
- [ ] Modificar `CambiarPlan.jsx`:
  - [ ] En lugar de actualizar directamente `plan_id`
  - [ ] Llamar a `crearCheckoutSesion()` para planes de pago
  - [ ] Solo actualizar directamente si es plan gratis

#### 3.4. Página de Éxito/Cancelación
- [ ] Crear `/pago/exito`:
  - [ ] Mostrar mensaje de éxito
  - [ ] Verificar estado de suscripción
  - [ ] Redirigir a dashboard

- [ ] Crear `/pago/cancelado`:
  - [ ] Mostrar mensaje de cancelación
  - [ ] Opción de reintentar

---

### FASE 4: Gestión de Suscripciones (2-3 días)

#### 4.1. Actualizar Tabla `suscripciones`
- [ ] Agregar campos necesarios:
  - [ ] `stripe_subscription_id` (o equivalente)
  - [ ] `stripe_customer_id`
  - [ ] `estado` (activa, cancelada, pago_pendiente)
  - [ ] `fecha_proximo_pago`
  - [ ] `fecha_cancelacion`
  - [ ] `periodo_gracia_hasta`

#### 4.2. Funciones de Gestión
- [ ] **Cancelar Suscripción**:
  - [ ] Llamar a API de Stripe para cancelar
  - [ ] Actualizar estado en BD
  - [ ] Permitir acceso hasta fin de período

- [ ] **Reactivar Suscripción**:
  - [ ] Llamar a API de Stripe para reactivar
  - [ ] Actualizar estado en BD

- [ ] **Actualizar Método de Pago**:
  - [ ] Redirigir a Stripe Customer Portal
  - [ ] O crear checkout para actualizar tarjeta

#### 4.3. Validación de Acceso
- [ ] Middleware para verificar estado de suscripción:
  - [ ] Si `estado = 'activa'` → Permitir acceso completo
  - [ ] Si `estado = 'cancelada'` y `fecha_proximo_pago > hoy` → Permitir acceso
  - [ ] Si `estado = 'pago_pendiente'` y `periodo_gracia_hasta > hoy` → Permitir acceso con advertencias
  - [ ] Si no → Bloquear acceso, mostrar mensaje de pago pendiente

---

### FASE 5: Facturación Electrónica (Argentina - Opcional)

#### 5.1. Integración con AFIP
- [ ] Evaluar servicios:
  - [ ] FacturadorOnline
  - [ ] Nubefact
  - [ ] AFIP directo (más complejo)

#### 5.2. Generar Facturas
- [ ] Al recibir pago exitoso:
  - [ ] Obtener datos fiscales del comercio
  - [ ] Generar factura electrónica
  - [ ] Obtener CAE (Código de Autorización Electrónico)
  - [ ] Guardar PDF en Supabase Storage
  - [ ] Guardar datos en tabla `facturacion`

#### 5.3. Panel de Usuario
- [ ] Mostrar historial de facturas
- [ ] Permitir descarga de PDFs
- [ ] Mostrar CAE y número de factura

---

### FASE 6: Testing y Optimización (2-3 días)

#### 6.1. Testing
- [ ] Probar checkout con tarjeta de prueba
- [ ] Probar webhooks (usar Stripe CLI)
- [ ] Probar cancelación
- [ ] Probar reactivación
- [ ] Probar pago fallido
- [ ] Probar cambio de plan

#### 6.2. Optimización
- [ ] Manejar errores de red
- [ ] Mostrar loading states
- [ ] Validar límites antes de permitir acciones
- [ ] Optimizar queries de BD

---

## 📊 Resumen de Tiempo Estimado

- **Fase 1 (Configuración)**: 1-2 días
- **Fase 2 (Webhooks)**: 2-3 días
- **Fase 3 (Checkout)**: 2-3 días
- **Fase 4 (Gestión)**: 2-3 días
- **Fase 5 (Facturación - Opcional)**: 3-5 días
- **Fase 6 (Testing)**: 2-3 días

**Total: 12-19 días** (sin facturación electrónica)
**Total: 15-24 días** (con facturación electrónica)

---

## 🎯 Orden Recomendado de Implementación

1. **Empezar con Stripe** (más fácil, mejor documentación)
2. **Implementar checkout básico** (plan mensual)
3. **Implementar webhooks básicos** (pago exitoso)
4. **Agregar gestión de suscripciones** (cancelar, reactivar)
5. **Agregar validaciones de acceso**
6. **Testing completo**
7. **Opcional: Agregar Mercado Pago** (si necesitas mercado argentino)

---

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ **NUNCA** exponer secret keys en frontend
- ✅ Validar firma de webhooks
- ✅ Usar HTTPS siempre
- ✅ Validar límites en backend, no solo frontend

### Legal (Argentina)
- ⚠️ Consultar con contador sobre:
  - Régimen fiscal (monotributo, RI)
  - Obligaciones ante AFIP
  - Facturación electrónica
  - Retenciones y percepciones

### UX
- ✅ Mostrar precios claros
- ✅ Explicar qué incluye cada plan
- ✅ Mostrar advertencias antes de cancelar
- ✅ Feedback claro en cada paso

---

## 🚀 ¿Listo para Empezar?

Cuando estés listo, podemos empezar con:
1. Configuración de Stripe/Mercado Pago
2. Creación del servicio de pagos
3. Implementación de webhooks
4. Integración en el frontend

**¿Con cuál pasarela quieres empezar?** (Recomiendo Stripe para empezar, luego agregar Mercado Pago si es necesario)
