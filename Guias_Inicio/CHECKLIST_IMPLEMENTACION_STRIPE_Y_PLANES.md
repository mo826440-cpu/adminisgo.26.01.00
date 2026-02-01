# Checklist de Implementación: Stripe, Planes y Sistema Completo

## 📋 Análisis del Estado Actual de Seguridad

### ✅ Lo que YA cumple tu app:
- ✅ **HTTPS**: Vercel y Supabase manejan HTTPS automáticamente en producción
- ✅ **Autenticación segura**: Usa Supabase Auth con encriptación
- ✅ **Base de datos segura**: Supabase con Row Level Security (RLS)
- ✅ **PWA funcional**: Service Worker implementado con actualización automática
- ✅ **Manejo de errores**: Error boundaries implementados

### ⚠️ Lo que FALTA implementar:
- ❌ **Política de Privacidad**: No está visible en la landing page
- ❌ **Términos y Condiciones**: No están implementados
- ❌ **Headers de seguridad**: No están configurados explícitamente
- ❌ **Consentimiento explícito**: No hay sistema de consentimiento con firma
- ❌ **Rate limiting**: No implementado
- ❌ **Backup automático**: No configurado explícitamente

---

## 🚀 FASE 0: Preparación y Requisitos Legales (ANTES DE CODIFICAR)

### 0.1. Configuración de Stripe
- [ ] Crear cuenta en Stripe (https://stripe.com)
- [ ] Completar verificación de identidad
- [ ] Configurar información de negocio
- [ ] Obtener API Keys (Test y Live)
- [ ] Configurar webhooks en Stripe Dashboard
- [ ] Configurar productos y precios en Stripe:
  - [ ] Plan Gratis (gratis)
  - [ ] Plan Pago Mensual ($9.99/mes)
  - [ ] Plan Pago Anual ($99.90/año)
  - [ ] Usuario Adicional ($9.99/año)
- [ ] Configurar métodos de pago aceptados
- [ ] Configurar información de facturación/recibos

### 0.2. Requisitos Legales para Argentina
- [ ] Consultar con abogado/contador sobre:
  - [ ] Régimen fiscal aplicable (monotributo, responsable inscripto, etc.)
  - [ ] Obligaciones ante AFIP
  - [ ] Retenciones y percepciones
  - [ ] Facturación electrónica (si aplica)
- [ ] Crear/actualizar **Política de Privacidad**:
  - [ ] Qué datos se recopilan
  - [ ] Cómo se usan
  - [ ] Con quién se comparten
  - [ ] Derechos del usuario (LGPD/AR)
  - [ ] Contacto para consultas
- [ ] Crear/actualizar **Términos y Condiciones**:
  - [ ] Descripción del servicio
  - [ ] Obligaciones del usuario
  - [ ] Política de cancelación y reembolso
  - [ ] Limitación de responsabilidad
  - [ ] Ley aplicable y jurisdicción
- [ ] Implementar consentimiento explícito (GDPR/LGPD compliant):
  - [ ] Checkbox de aceptación
  - [ ] Firma digital
  - [ ] Registro de consentimiento
- [ ] Configurar aviso de cookies (si aplica)
- [ ] Registrar dominio y configurar SSL/HTTPS (Vercel lo maneja automáticamente)
- [ ] Configurar email de contacto legal

### 0.3. Seguridad y Certificaciones
- [ ] Implementar HTTPS obligatorio (Vercel lo maneja, verificar)
- [ ] Configurar headers de seguridad (CSP, HSTS, etc.) en `vercel.json`
- [ ] Revisar y corregir vulnerabilidades OWASP Top 10
- [ ] Implementar rate limiting (considerar Vercel Edge Functions o middleware)
- [ ] Configurar backup automático de base de datos (Supabase lo tiene, verificar configuración)
- [ ] Documentar políticas de seguridad
- [ ] **(Opcional)** Auditoría de seguridad externa
- [ ] **(Opcional)** Preparar app para Google Play:
  - [ ] Crear cuenta de desarrollador Google Play ($25 una vez)
  - [ ] Preparar assets (iconos, screenshots, descripción)
  - [ ] Configurar política de privacidad en Play Console
  - [ ] Completar cuestionario de contenido
  - [ ] Enviar para revisión

### 0.4. Certificación Adicional (Opcional - Panel Admin)
- [ ] Crear sección en panel admin `/admin/seguridad-certificaciones`
- [ ] Dashboard de estado de certificaciones:
  - [ ] Estado de OWASP Mobile Top 10 compliance
  - [ ] Última auditoría de seguridad
  - [ ] Estado de certificación Google Play
  - [ ] Logs de vulnerabilidades detectadas
- [ ] Sistema de alertas para problemas de seguridad
- [ ] Historial de mejoras de seguridad implementadas

---

## 🗄️ FASE 1: Base de Datos y Migraciones

### 1.1. Crear migración de tablas principales
- [ ] Crear tabla `admins_globales`
- [ ] Crear tabla `terminos_condiciones`



- [ ] Crear tabla `politica_privacidad` (similar a terminos_condiciones, con versionado)
- [ ] Crear tabla `consentimientos`
- [ ] Crear tabla `usuarios_adicionales`
- [ ] Crear tabla `historial_cambios_usuario`
- [ ] Crear tabla `solicitudes_planes_personalizados`
- [ ] Crear tabla `planes_personalizados`
- [ ] Crear tabla `notificaciones_admin`
- [ ] Crear tabla `facturacion` o agregar campos de facturación a `suscripciones`

### 1.2. Actualizar tablas existentes
- [ ] Agregar campos necesarios a `comercios` (si faltan)
- [x] Agregar campos necesarios a `suscripciones` (si faltan):
  - [x] Campos de facturación (número de factura, fecha, monto, tipo)
  - [x] Campos de datos fiscales del cliente
- [x] Agregar campo `contrato_url` o `contrato_documento` a `solicitudes_planes_personalizados`
- [x] Verificar integridad referencial

### 1.3. Funciones RPC
- [x] Crear función `es_admin_global(usuario_id)`
- [x] Crear función `obtener_terminos_actuales()`
- [x] Crear función `obtener_politica_privacidad_actual()`
- [x] Crear función `verificar_consentimiento_actual(usuario_id)`
- [x] Crear función `crear_usuario_adicional(...)`
- [x] Crear función `cambiar_datos_usuario_adicional(...)`
- [x] Crear función `resetear_contador_cambios_anual()`
- [x] Crear función `crear_solicitud_plan_personalizado(...)`
- [x] Crear función `aprobar_solicitud_plan(...)`
- [x] Crear función `crear_notificacion_admin(...)`
- [ ] Crear función `generar_factura(suscripcion_id, tipo_factura)` (para facturación electrónica)

### 1.4. Row Level Security (RLS)
- [x] Políticas RLS para `admins_globales`
- [x] Políticas RLS para `terminos_condiciones`
- [x] Políticas RLS para `politica_privacidad`
- [x] Políticas RLS para `consentimientos`
- [x] Políticas RLS para `usuarios_adicionales`
- [x] Políticas RLS para `solicitudes_planes_personalizados`
- [x] Políticas RLS para `planes_personalizados`
- [x] Políticas RLS para `notificaciones_admin`
- [ ] Políticas RLS para `facturacion` (si se crea tabla separada)

### 1.5. Datos iniciales
- [x] Insertar admin global inicial (`mo826440@gmail.com`)
- [ ] Insertar versión inicial de términos y condiciones (v1.0) - **PENDIENTE: Crear contenido real**
- [ ] Insertar versión inicial de política de privacidad (v1.0) - **PENDIENTE: Crear contenido real**
- [ ] Insertar planes base (Gratis, Pago Mensual, Pago Anual)

### 1.6. Supabase Storage
- [ ] Crear bucket `firmas` en Supabase Storage - **PENDIENTE: Configurar manualmente en Supabase Dashboard**
- [ ] Configurar políticas de acceso para bucket `firmas` - **PENDIENTE: Configurar manualmente en Supabase Dashboard**
- [ ] Crear carpetas: `firmas/terminos/` y `firmas/eliminacion/` - **Se crean automáticamente al subir**
- [x] **NOTA**: El sistema funciona sin el bucket (usa data URL como fallback)

---

## 🔧 FASE 2: Servicios Backend

### 2.1. Servicio de Stripe
- [ ] Crear `frontend/src/services/stripe.js`
- [ ] Función `crearCheckoutSesion(planId, tipoPago)`
- [ ] Función `crearCheckoutPlanPersonalizado(monto, comercioId)`
- [ ] Función `crearCheckoutUsuarioAdicional(comercioId)`
- [ ] Función `obtenerSuscripcion(stripeSubscriptionId)`
- [ ] Función `cancelarSuscripcion(stripeSubscriptionId, cancelarInmediato)`
- [ ] Función `actualizarMetodoPago(stripeCustomerId)`
- [ ] Función `obtenerHistorialPagos(stripeCustomerId)`

### 2.2. Servicio de planes personalizados
- [x] Crear `frontend/src/services/planesPersonalizados.js`
- [ ] Función `crearSolicitudPlanPersonalizado(datos)`
- [ ] Función `obtenerSolicitudesPendientes()`
- [ ] Función `aprobarSolicitud(solicitudId, monto, sinPago)`
- [ ] Función `rechazarSolicitud(solicitudId, motivo)`
- [x] Función `obtenerPlanPersonalizado(comercioId)`

### 2.3. Servicio de usuarios adicionales
- [x] Crear `frontend/src/services/usuariosAdicionales.js`
- [x] Función `obtenerUsuariosAdicionales(comercioId)`
- [ ] Función `crearUsuarioAdicional(datos, tieneLogin)`
- [ ] Función `invitarUsuarioAdicional(usuarioAdicionalId, email)`
- [x] Función `cambiarDatosUsuario(usuarioAdicionalId, nuevosDatos)`
- [x] Función `validarCambiosDisponibles(usuarioAdicionalId)`
- [ ] Función `desactivarUsuarioAdicional(usuarioAdicionalId)`
- [ ] Función `reactivarUsuarioAdicional(usuarioAdicionalId)`

### 2.4. Servicio de consentimientos
- [x] Crear `frontend/src/services/consentimientos.js`
- [x] Función `guardarConsentimiento(datos, firmaImagen)`
  - [x] Manejar comercio_id null durante el registro
  - [x] Obtener usuario autenticado correctamente
- [x] Función `subirFirmaAStorage(firmaDataUrl, tipo, usuarioId)`
  - [x] Fallback a data URL si bucket no existe
  - [x] Corregir path duplicado (firmas/firmas/terminos → firmas/terminos)
- [x] Función `obtenerConsentimientos(usuarioId)`
- [x] Función `verificarConsentimientoActual(usuarioId)`

### 2.5. Servicio de términos
- [x] Crear `frontend/src/services/terminos.js`
- [x] Función `obtenerTerminosActuales()`
- [x] Función `obtenerVersionTerminos(version)`
- [x] Función `crearNuevaVersionTerminos(contenido)` - **PENDIENTE: Solo para admins**
- [x] Función `marcarVersionComoActiva(version)` - **PENDIENTE: Solo para admins**

### 2.6. Servicio de admin
- [x] Crear `frontend/src/services/admin.js`
- [x] Función `esAdminGlobal(usuarioId)`
- [x] Función `obtenerNotificacionesAdmin()`
- [x] Función `marcarNotificacionComoLeida(notificacionId)`
- [ ] Función `obtenerEstadisticasGlobales()`
- [ ] Función `obtenerTodosLosUsuarios()`

---

## 🎨 FASE 3: Componentes Frontend Base

### 3.1. Componente FirmaCanvas
- [x] Crear `frontend/src/components/common/FirmaCanvas.jsx`
- [x] Canvas para dibujar firma
- [x] Botón "Limpiar"
- [x] Botón "Confirmar"
- [x] Validación de que hay firma antes de confirmar
- [x] Exportar firma como imagen (PNG)
- [x] Estilos responsive
- [x] Usar estilo actual de la app
- [x] Manejo de errores de subida a Storage con fallback a data URL

### 3.2. Componente TerminosYCondiciones
- [x] Crear `frontend/src/components/common/TerminosYCondiciones.jsx`
- [x] Modal con términos y condiciones
- [x] Scroll para leer términos
- [x] Campo de términos más grande y legible (min-height: 400px, max-height: 500px)
- [x] Checkbox "He leído y acepto"
- [x] Integración con FirmaCanvas
- [x] Botón "Aceptar" (solo habilitado si checkbox + firma)
- [x] Versión de términos visible
- [x] Validación de scroll hasta el final antes de aceptar

### 3.3. Actualizar flujo de registro
- [x] Modificar `Register.jsx` para incluir términos después de confirmar email
  - [x] **NOTA**: El flujo actual redirige a SelectPlan después de confirmar email, donde se manejan los términos
  - [x] Manejo de errores de confirmación de email expirada en `AuthCallback.jsx`
  - [x] Redirección automática desde `LandingPage.jsx` cuando hay errores de autenticación
- [x] Modificar `SelectPlan.jsx` para mostrar términos para plan de pago
  - [x] Verificar consentimiento al cargar la página
  - [x] Mostrar términos cuando usuario selecciona plan de pago y hace clic en "Continuar"
  - [x] Validar que términos fueron aceptados antes de continuar con plan de pago
  - [x] Integrar componente TerminosYCondiciones
  - [x] Plan gratis continúa directamente (términos se muestran en CompleteRegistration)
- [x] Modificar `CompleteRegistration.jsx` para verificar consentimiento antes de completar
  - [x] Verificar si el usuario ya tiene consentimiento actual
  - [x] Mostrar modal de términos si no tiene consentimiento
  - [x] Integrar componente TerminosYCondiciones
  - [x] Validar que términos fueron aceptados antes de completar registro
  - [x] Corregir manejo de comercio_id null durante el registro

### 3.4. Agregar enlaces legales
- [x] Agregar link a Política de Privacidad en footer de `LandingPage.jsx` ✅
- [x] Agregar link a Términos y Condiciones en footer de `LandingPage.jsx` ✅
- [x] Crear página `/privacidad` para mostrar política (con versionado) ✅
- [x] Crear página `/terminos` para mostrar términos (versión pública, con versionado) ✅
- [ ] Agregar componente para mostrar política de privacidad en registro (similar a términos)

---

## 👨‍💼 FASE 4: Panel de Administración Global

### 4.1. Estructura de rutas
- [ ] Crear ruta `/admin` protegida
- [ ] Crear ruta `/admin/solicitudes`
- [ ] Crear ruta `/admin/usuarios`
- [ ] Crear ruta `/admin/estadisticas`
- [ ] Crear ruta `/admin/seguridad-certificaciones` (opcional)
- [ ] Crear componente `ProtectedAdminRoute`

### 4.2. Página principal del admin
- [ ] Crear `frontend/src/pages/admin/AdminDashboard.jsx`
- [ ] Resumen de solicitudes pendientes
- [ ] Resumen de usuarios activos
- [ ] Resumen de ingresos
- [ ] Notificaciones recientes
- [ ] Navegación a secciones

### 4.3. Gestión de solicitudes de plan personalizado
- [ ] Crear `frontend/src/pages/admin/SolicitudesPlanes.jsx`
- [ ] Lista de solicitudes pendientes
- [ ] Ver detalles de cada solicitud
- [ ] Opción "Aprobar sin pago ($0)"
- [ ] Opción "Aprobar con monto $X" (input para monto)
- [ ] Opción "Rechazar" (con motivo)
- [ ] Opción "Subir contrato" (PDF o documento del contrato firmado)
- [ ] Ver/descargar contratos subidos
- [ ] Historial de solicitudes procesadas
- [ ] Filtros y búsqueda

### 4.4. Gestión de usuarios
- [ ] Crear `frontend/src/pages/admin/GestionUsuarios.jsx`
- [ ] Lista de todos los usuarios
- [ ] Ver detalles de cada usuario
- [ ] Ver suscripción activa
- [ ] Ver historial de pagos
- [ ] Opción de cancelar/reactivar suscripción manualmente
- [ ] Ver consentimientos y firmas
- [ ] Filtros y búsqueda

### 4.5. Estadísticas
- [ ] Crear `frontend/src/pages/admin/Estadisticas.jsx`
- [ ] Gráfico de usuarios activos
- [ ] Gráfico de ingresos (mensual/anual)
- [ ] Distribución de planes
- [ ] Usuarios adicionales vendidos
- [ ] Métricas de crecimiento

### 4.6. Seguridad y Certificaciones (Opcional)
- [ ] Crear `frontend/src/pages/admin/SeguridadCertificaciones.jsx`
- [ ] Dashboard de estado de certificaciones
- [ ] Estado de OWASP compliance
- [ ] Última auditoría de seguridad
- [ ] Estado de certificación Google Play
- [ ] Logs de vulnerabilidades
- [ ] Sistema de alertas

### 4.7. Notificaciones admin
- [ ] Componente de notificaciones en panel admin
- [ ] Badge con contador de no leídas
- [ ] Lista de notificaciones
- [ ] Marcar como leída
- [ ] Notificación en tiempo real (si es posible)

---

## ⚙️ FASE 5: Panel de Configuración de Comercio

### 5.1. Estructura de rutas
- [ ] Crear ruta `/configuracion`
- [ ] Crear ruta `/configuracion/mi-comercio`
- [ ] Crear ruta `/configuracion/usuarios-adicionales`
- [ ] Crear ruta `/configuracion/consentimientos`
- [ ] Crear ruta `/configuracion/eliminar-cuenta`

### 5.2. Mi comercio
- [x] Ver datos del comercio (en `Configuracion.jsx`)
- [x] Ver suscripción actual (plan, límites) en Dashboard
  - [x] Card "Tu Plan Actual" con información del plan
  - [x] Mostrar límites de ventas y usuarios
  - [x] Mostrar período gratis si aplica
- [x] Botón "Cambiar plan" en Dashboard (para plan gratis)
- [x] Página "Cambiar Plan" (`/configuracion/cambiar-plan`)
  - [x] Mostrar todos los planes disponibles
  - [x] Indicar plan actual
  - [x] Permitir cambiar de plan (actualiza plan_id directamente)
- [ ] Modal para cambiar plan (mensual ↔ anual) - **PENDIENTE: Requiere integración con Stripe**
- [ ] Botón "Cancelar suscripción" - **PENDIENTE: Requiere integración con Stripe**
- [ ] Modal de cancelación con advertencias - **PENDIENTE: Requiere integración con Stripe**
- [ ] Ver historial de pagos - **PENDIENTE: Requiere integración con Stripe**
- [ ] Opción "Actualizar método de pago" - **PENDIENTE: Requiere integración con Stripe**

### 5.3. Usuarios adicionales
- [ ] Crear `frontend/src/pages/configuracion/UsuariosAdicionales.jsx`
- [ ] Lista de usuarios adicionales activos
- [ ] Lista de usuarios adicionales inactivos
- [ ] Botón "Comprar puesto adicional" → Stripe Checkout
- [ ] Modal para crear/editar usuario adicional:
  - [ ] Campo nombre
  - [ ] Checkbox "Tiene login propio"
  - [ ] Campo email (si tiene login)
  - [ ] Mostrar "Cambios disponibles: X/6"
  - [ ] Validar límite de cambios
  - [ ] Botón "Guardar"
- [ ] Botón "Desactivar" para cada usuario
- [ ] Botón "Reactivar" para usuarios inactivos
- [ ] Mostrar fecha de próximo reset de cambios

### 5.4. Consentimientos
- [ ] Crear `frontend/src/pages/configuracion/Consentimientos.jsx`
- [ ] Lista de consentimientos dados
- [ ] Ver términos aceptados (versión)
- [ ] Ver firma digital (imagen)
- [ ] Fecha de consentimiento
- [ ] Tipo de consentimiento (términos/eliminación)

### 5.5. Eliminar cuenta
- [ ] Crear `frontend/src/pages/configuracion/EliminarCuenta.jsx`
- [ ] Advertencia clara de lo que se eliminará
- [ ] Lista de datos que se eliminarán
- [ ] Checkbox "Entiendo y acepto"
- [ ] Integración con FirmaCanvas
- [ ] Botón "Confirmar eliminación"
- [ ] Modal de confirmación final
- [ ] Proceso de eliminación con feedback

---

## 💳 FASE 6: Integración con Stripe

### 6.1. Variables de entorno
- [ ] Agregar `VITE_STRIPE_PUBLIC_KEY` a `.env`
- [ ] Agregar `VITE_STRIPE_SECRET_KEY` (solo backend, no exponer)
- [ ] Configurar webhook secret
- [ ] Documentar variables de entorno necesarias

### 6.2. Checkout de Stripe
- [ ] Integrar Stripe.js en frontend
- [ ] Crear checkout para plan mensual
- [ ] Crear checkout para plan anual
- [ ] Crear checkout para plan personalizado
- [ ] Crear checkout para usuario adicional
- [ ] Manejar éxito de checkout
- [ ] Manejar cancelación de checkout

### 6.3. Webhooks de Stripe (backend)
- [ ] Crear endpoint para webhooks (Supabase Edge Function o Vercel API Route)
- [ ] Manejar `checkout.session.completed`
- [ ] Manejar `invoice.payment_succeeded`
- [ ] Manejar `invoice.payment_failed`
- [ ] Manejar `customer.subscription.deleted`
- [ ] Manejar `customer.subscription.updated`
- [ ] Validar firma de webhook
- [ ] Actualizar estado en BD según eventos

### 6.4. Gestión de suscripciones
- [ ] Función para cancelar suscripción (al final del período)
- [ ] Función para reactivar suscripción
- [ ] Función para cambiar plan
- [ ] Validar acceso según estado de suscripción
- [ ] Mostrar advertencias de pago fallido
- [ ] Implementar período de gracia (30 días)

### 6.5. Reembolsos
- [ ] Función para calcular si aplica reembolso
- [ ] Validar días desde último pago (15 días mensual / 30 días anual)
- [ ] Función para procesar reembolso en Stripe
- [ ] Actualizar estado en BD después de reembolso
- [ ] Notificar al usuario

### 6.6. Facturación Electrónica (Argentina - AFIP)
- [ ] Investigar integración con AFIP (Facturación Electrónica)
- [ ] Evaluar servicios de terceros (ej: FacturadorOnline, Nubefact)
- [ ] Crear tabla o campos para almacenar datos de facturación:
  - [ ] Número de factura
  - [ ] CAE (Código de Autorización Electrónico)
  - [ ] Fecha de emisión
  - [ ] Tipo de factura (A, B, C)
  - [ ] Datos fiscales del cliente
- [ ] Función para generar factura automática al pagar suscripción
- [ ] Función para generar factura manual (planes personalizados)
- [ ] Almacenar PDF de factura en Supabase Storage
- [ ] Permitir descarga de facturas desde panel de usuario

---

## 🔒 FASE 7: Validaciones y Límites

### 7.1. Validación de límites del plan
- [ ] Validar límite de ventas mensuales antes de crear venta
- [ ] Validar límite de usuarios adicionales antes de crear
- [ ] Validar período gratis (3 meses para plan gratis)
- [ ] Mostrar mensajes cuando se alcanza límite
- [ ] Bloquear creación cuando se excede límite

### 7.2. Validación de cambios de usuarios adicionales
- [ ] Validar contador antes de permitir cambio
- [ ] Mostrar mensaje cuando se alcanza límite (6 cambios)
- [ ] Mostrar fecha de próximo reset
- [ ] Resetear contador automáticamente al cumplir 1 año

### 7.3. Validación de consentimientos
- [ ] Verificar consentimiento actual al iniciar sesión
- [ ] Redirigir a términos si no tiene consentimiento o versión desactualizada
- [ ] Bloquear acceso hasta aceptar términos

### 7.4. Validación de acceso según suscripción
- [ ] Middleware para verificar estado de suscripción
- [ ] Bloquear acceso si suscripción cancelada y período vencido
- [ ] Permitir solo lectura si suscripción cancelada pero período activo
- [ ] Bloquear acceso si pago fallido y período de gracia vencido

---

## 📧 FASE 8: Notificaciones y Emails

### 8.1. Notificaciones en app
- [ ] Sistema de notificaciones para admins globales
- [ ] Sistema de notificaciones para usuarios (pago fallido, etc.)
- [ ] Badges con contadores
- [ ] Marcar como leída

### 8.2. Emails automáticos
- [ ] Email de bienvenida al registrarse
- [ ] Email de confirmación de pago
- [ ] Email de pago fallido (con días restantes)
- [ ] Email de suscripción cancelada
- [ ] Email de solicitud de plan personalizado (para admin)
- [ ] Email de aprobación/rechazo de plan personalizado
- [ ] Email de invitación para usuario adicional (si tiene login)
- [ ] Email de reembolso procesado

---

## 🧪 FASE 9: Testing y Optimización

### 9.1. Testing de flujos principales
- [ ] Test: Registro con plan gratis
- [ ] Test: Registro con plan pago (mensual y anual)
- [ ] Test: Registro con plan personalizado
- [ ] Test: Cambio de plan
- [ ] Test: Cancelación de suscripción
- [ ] Test: Pago fallido y período de gracia
- [ ] Test: Reembolso (dentro y fuera del período)
- [ ] Test: Crear usuario adicional
- [ ] Test: Cambiar datos de usuario adicional (límite de 6)
- [ ] Test: Eliminar cuenta
- [ ] Test: Panel admin (solicitudes, usuarios, estadísticas)

### 9.2. Testing de seguridad
- [ ] Verificar que solo admins globales acceden a `/admin`
- [ ] Verificar RLS en todas las tablas
- [ ] Verificar validación de límites
- [ ] Verificar que no se pueden manipular precios desde frontend
- [ ] Verificar firma de webhooks de Stripe

### 9.3. Optimización
- [ ] Optimizar queries de BD
- [ ] Implementar caché donde sea necesario
- [ ] Optimizar carga de imágenes de firmas
- [ ] Optimizar rendimiento del panel admin

### 9.4. UX/UI
- [ ] Revisar todos los modales y mensajes
- [ ] Asegurar feedback claro en todas las acciones
- [ ] Revisar responsive design
- [ ] Revisar accesibilidad básica

---

## 📚 FASE 10: Documentación y Deployment

### 10.1. Documentación
- [ ] Documentar flujo de registro
- [ ] Documentar flujo de planes personalizados
- [ ] Documentar flujo de usuarios adicionales
- [ ] Documentar configuración de Stripe
- [ ] Documentar webhooks
- [ ] Actualizar `GUIA_DE_FUNCIONES.md`
- [ ] Actualizar `DESCRIPCION_PROYECTO.md`

### 10.2. Deployment
- [ ] Configurar variables de entorno en producción
- [ ] Configurar webhooks de Stripe en producción
- [ ] Configurar headers de seguridad en `vercel.json`
- [ ] Probar en ambiente de staging
- [ ] Deploy a producción
- [ ] Verificar que todo funciona en producción

---

## 📝 Notas Importantes

### Orden de Implementación Recomendado:
1. **Fase 0** primero (legal y Stripe) - CRÍTICO
2. Luego **Fases 1-2** (BD y servicios) - Base técnica
3. Después **Fases 3-5** (componentes y paneles) - UI
4. Luego **Fase 6** (integración Stripe) - Pagos
5. Finalmente **Fases 7-10** (validaciones, testing, deploy) - Pulido

### Desarrollo Iterativo:
- Implementar y probar cada fase antes de continuar
- Usar modo test de Stripe durante desarrollo
- Cambiar a modo live solo en producción

### Monitoreo:
- Configurar logs de errores (Sentry o similar)
- Monitorear webhooks de Stripe
- Alertas para pagos fallidos críticos

### Backup y Recuperación:
- Backup automático de BD (Supabase lo tiene)
- Plan de recuperación ante desastres
- Documentar procedimientos de rollback

---

## ✅ Estado del Proyecto

**Última actualización**: 2025-01-27
**Versión del checklist**: 1.4
**Estado general**: En desarrollo - Fase 3 completada, Fase 5 parcialmente completada

### Progreso por Fase:
- **Fase 0**: 0% - Pendiente (Requisitos legales y Stripe)
- **Fase 1**: 90% - Casi completada (Base de datos)
- **Fase 2**: 80% - En progreso (Servicios Backend)
  - ✅ Servicio de consentimientos completado con fallback
  - ✅ Servicio de términos completado
  - ✅ Servicio de planes completado
- **Fase 3**: 100% - Completada (Componentes Frontend Base)
  - ✅ Componente FirmaCanvas completado
  - ✅ Componente TerminosYCondiciones completado (con mejoras de UX)
  - ✅ Integración en CompleteRegistration.jsx completada
  - ✅ Integración en SelectPlan.jsx para planes de pago completada
  - ✅ Manejo de errores de confirmación de email expirada
  - ✅ Mejora del tamaño del campo de términos
- **Fase 4**: 0% - Pendiente (Panel de Administración Global)
- **Fase 5**: 40% - Parcialmente completada (Panel de Configuración de Comercio)
  - ✅ Visualización de plan actual en Dashboard
  - ✅ Página "Cambiar Plan" creada
  - ✅ Función para actualizar plan_id del comercio
  - ⏳ Pendiente: Integración con Stripe/Mercado Pago para pagos reales
  - ⏳ Pendiente: Gestión completa de suscripciones
- **Fase 6**: 0% - Pendiente (Integración con Stripe)
- **Fase 7-10**: 0% - Pendiente

---

## 📞 Contacto y Soporte

Para dudas sobre este checklist o la implementación, consultar la documentación del proyecto o contactar al equipo de desarrollo.

