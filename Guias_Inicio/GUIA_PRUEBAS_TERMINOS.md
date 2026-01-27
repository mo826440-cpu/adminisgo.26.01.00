# Guía de Pruebas: Sistema de Términos y Condiciones

## 🚀 Iniciar el Servidor de Desarrollo

1. Abrir terminal en la raíz del proyecto
2. Navegar a la carpeta frontend:
   ```bash
   cd frontend
   ```
3. Instalar dependencias (si no están instaladas):
   ```bash
   npm install
   ```
4. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abrir el navegador en la URL que muestra (generalmente `http://localhost:5173`)

---

## 📋 Prerequisitos para Probar

### 1. Verificar Configuración de Supabase

Asegúrate de tener configurado:
- ✅ Variables de entorno en `frontend/.env`:
  ```
  VITE_SUPABASE_URL=tu-url-de-supabase
  VITE_SUPABASE_ANON_KEY=tu-anon-key
  ```

### 2. Verificar Base de Datos

Asegúrate de tener ejecutadas las migraciones:
- ✅ Tabla `terminos_condiciones` creada
- ✅ Tabla `consentimientos` creada
- ✅ Función `verificar_consentimiento_actual()` creada
- ✅ Función `obtener_terminos_actuales()` creada
- ✅ Al menos una versión de términos insertada en la BD

### 3. Verificar Storage (Opcional para pruebas básicas)

- ⚠️ El bucket `firmas` debe estar creado en Supabase Storage
- ⚠️ Si no está creado, las firmas no se subirán pero el flujo funcionará

---

## 🧪 Escenarios de Prueba

### ⚠️ IMPORTANTE: Antes de Probar

**Si ya estás autenticado**, necesitas cerrar sesión primero:
1. Haz clic en "Cerrar Sesión" en la esquina superior derecha
2. O ve directamente a `/auth/login` y cierra sesión desde ahí
3. Luego podrás acceder a `/auth/register`

**Nota**: Si intentas acceder a `/auth/register` estando autenticado, serás redirigido automáticamente al dashboard (esto es comportamiento esperado).

**⚠️ IMPORTANTE: Usar Cuenta Nueva para Probar**

Para probar el flujo completo de registro, **debes usar una cuenta de email nueva** que nunca haya sido registrada antes. 

**¿Por qué?**
- Si confirmas el email de una cuenta que **ya tiene comercio**, serás redirigido directamente al dashboard (comportamiento correcto)
- Si confirmas el email de una cuenta **nueva** (sin comercio), serás redirigido a `/auth/select-plan` para elegir plan y completar registro

**Solución:**
- Usa un email diferente para cada prueba (ej: `test1@example.com`, `test2@example.com`, etc.)
- O elimina el comercio de la cuenta existente en Supabase si quieres reutilizar el email

---

### Escenario 1: Registro con Plan Gratis

**Pasos:**
1. **Asegúrate de estar deslogueado** (si no, cierra sesión primero)
2. Ir a `/auth/register`
2. Completar formulario de registro:
   - Email: `test-gratis@example.com`
   - Contraseña: `123456`
   - Confirmar contraseña: `123456`
3. Hacer clic en "Enviar Email de Confirmación"
4. **Verificar**: Debe aparecer mensaje de éxito
5. Revisar email y hacer clic en el enlace de confirmación
6. **Verificar**: Debe redirigir a `/auth/select-plan`
7. Seleccionar "Plan Gratuito"
8. Hacer clic en "Continuar"
9. **Verificar**: Debe redirigir a `/auth/complete-registration`
10. **Verificar**: Debe aparecer modal de términos y condiciones automáticamente
11. Leer términos (hacer scroll hasta el final)
12. Marcar checkbox "He leído y acepto"
13. Dibujar firma en el canvas
14. Hacer clic en "Confirmar" en el canvas
15. **Verificar**: Debe aparecer "✅ Firma capturada correctamente"
16. Hacer clic en "Aceptar Términos y Condiciones"
17. **Verificar**: El modal debe cerrarse
18. Completar formulario:
    - Nombre del Comercio: `Mi Tienda Test`
    - Tu Nombre Completo: `Juan Pérez`
19. Hacer clic en "Finalizar Registro"
20. **Verificar**: Debe redirigir a `/auth/login` con mensaje de éxito

**Resultado esperado:**
- ✅ Términos se muestran en CompleteRegistration
- ✅ Firma se captura correctamente
- ✅ Consentimiento se guarda en la BD
- ✅ Registro se completa exitosamente

---

### Escenario 2: Registro con Plan de Pago

**Pasos:**
1. **Asegúrate de estar deslogueado** (si no, cierra sesión primero)
2. Ir a `/auth/register`
2. Completar formulario de registro:
   - Email: `test-pago@example.com`
   - Contraseña: `123456`
   - Confirmar contraseña: `123456`
3. Hacer clic en "Enviar Email de Confirmación"
4. Revisar email y hacer clic en el enlace de confirmación
5. **Verificar**: Debe redirigir a `/auth/select-plan`
6. Seleccionar "Plan Pago"
7. **Verificar**: Debe aparecer mensaje "* Deberás aceptar los términos y condiciones antes de continuar"
8. Hacer clic en "Continuar"
9. **Verificar**: Debe aparecer modal de términos y condiciones
10. Leer términos (hacer scroll hasta el final)
11. Marcar checkbox "He leído y acepto"
12. Dibujar firma en el canvas
13. Hacer clic en "Confirmar" en el canvas
14. **Verificar**: Debe aparecer "✅ Firma capturada correctamente"
15. Hacer clic en "Aceptar Términos y Condiciones"
16. **Verificar**: El modal debe cerrarse y redirigir automáticamente a `/auth/complete-registration`
17. **Verificar**: El formulario debe estar habilitado (términos ya aceptados)
18. Completar formulario:
    - Nombre del Comercio: `Mi Tienda Pago`
    - Tu Nombre Completo: `María García`
19. Hacer clic en "Finalizar Registro"
20. **Verificar**: Debe redirigir a `/auth/login` con mensaje de éxito

**Resultado esperado:**
- ✅ Términos se muestran en SelectPlan para plan de pago
- ✅ No permite continuar sin aceptar términos
- ✅ Firma se captura correctamente
- ✅ Consentimiento se guarda en la BD
- ✅ En CompleteRegistration, términos ya están aceptados (no se muestran de nuevo)

---

### Escenario 3: Registro con Plan Personalizado

**Pasos:**
1. **Asegúrate de estar deslogueado** (si no, cierra sesión primero)
2. Ir a `/auth/register`
2. Completar formulario de registro:
   - Email: `test-personalizado@example.com`
   - Contraseña: `123456`
   - Confirmar contraseña: `123456`
3. Hacer clic en "Enviar Email de Confirmación"
4. Revisar email y hacer clic en el enlace de confirmación
5. **Verificar**: Debe redirigir a `/auth/select-plan`
6. Seleccionar "Plan Personalizado"
7. **Verificar**: Debe aparecer formulario de solicitud
8. Completar formulario:
   - Nombre Completo: `Carlos Rodríguez`
   - Email: `test-personalizado@example.com`
   - Teléfono: `1234567890`
   - Mensaje: `Necesito un plan personalizado para mi negocio`
9. Hacer clic en "Enviar Solicitud y Continuar"
10. **Verificar**: Debe redirigir a `/auth/complete-registration` con mensaje de solicitud enviada
11. **Verificar**: Debe aparecer modal de términos y condiciones automáticamente
12. Aceptar términos con firma (igual que en Escenario 1)
13. Completar formulario de registro
14. Hacer clic en "Finalizar Registro"

**Resultado esperado:**
- ✅ Solicitud se envía correctamente
- ✅ Términos se muestran en CompleteRegistration
- ✅ Registro se completa exitosamente

---

### Escenario 4: Usuario que ya tiene consentimiento

**Pasos:**
1. Iniciar sesión con un usuario que ya completó el registro (tiene consentimiento)
2. Ir a `/auth/select-plan` (si no tiene comercio)
3. **Verificar**: No debe mostrar términos automáticamente
4. Seleccionar plan de pago
5. Hacer clic en "Continuar"
6. **Verificar**: No debe mostrar términos (ya tiene consentimiento)
7. Debe continuar directamente a CompleteRegistration

**Resultado esperado:**
- ✅ No se muestran términos si ya tiene consentimiento
- ✅ Flujo continúa sin interrupciones

---

## 🔍 Verificaciones en la Base de Datos

### Verificar Consentimiento Guardado

Ejecutar en Supabase SQL Editor:

```sql
-- Ver todos los consentimientos
SELECT 
  c.*,
  u.email,
  co.nombre as comercio_nombre
FROM consentimientos c
LEFT JOIN auth.users u ON u.id = c.usuario_id
LEFT JOIN comercios co ON co.id = c.comercio_id
ORDER BY c.created_at DESC
LIMIT 10;
```

### Verificar Firma en Storage

1. Ir a Supabase Dashboard → Storage
2. Abrir bucket `firmas`
3. Verificar que existan carpetas:
   - `firmas/terminos/` (con archivos PNG de firmas)
   - `firmas/eliminacion/` (vacía por ahora)

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: Modal de términos no aparece

**Causa posible:**
- No hay términos en la base de datos
- La función `obtener_terminos_actuales()` no existe

**Solución:**
1. Verificar que existe al menos una versión de términos:
   ```sql
   SELECT * FROM terminos_condiciones WHERE activo = true;
   ```
2. Si no hay, insertar una versión de prueba:
   ```sql
   INSERT INTO terminos_condiciones (version, titulo, contenido, activo)
   VALUES ('1.0', 'Términos y Condiciones', '<p>Contenido de prueba</p>', true);
   ```

### Problema 2: Error al subir firma

**Causa posible:**
- Bucket `firmas` no existe en Supabase Storage

**Solución:**
1. Ir a Supabase Dashboard → Storage
2. Crear bucket `firmas`
3. Configurar políticas de acceso (público para lectura, autenticado para escritura)

### Problema 3: Error "Usuario no autenticado"

**Causa posible:**
- Sesión expirada
- Variables de entorno incorrectas

**Solución:**
1. Verificar que las variables de entorno están correctas
2. Cerrar sesión y volver a iniciar sesión
3. Verificar en consola del navegador si hay errores de autenticación

### Problema 4: Términos se muestran dos veces

**Causa posible:**
- Lógica duplicada en SelectPlan y CompleteRegistration

**Solución:**
- Verificar que en SelectPlan solo se muestran para plan de pago
- Verificar que en CompleteRegistration solo se muestran si no hay consentimiento

---

## 📊 Checklist de Pruebas

- [ ] Plan Gratis: Términos se muestran en CompleteRegistration
- [ ] Plan Gratis: Firma se captura correctamente
- [ ] Plan Gratis: Consentimiento se guarda en BD
- [ ] Plan Pago: Términos se muestran en SelectPlan
- [ ] Plan Pago: No permite continuar sin aceptar
- [ ] Plan Pago: Firma se captura correctamente
- [ ] Plan Pago: No se muestran términos en CompleteRegistration (ya aceptados)
- [ ] Plan Personalizado: Términos se muestran en CompleteRegistration
- [ ] Usuario con consentimiento: No se muestran términos innecesariamente
- [ ] Firma se sube a Storage correctamente
- [ ] Consentimiento se guarda con comercio_id null durante registro
- [ ] Validación de scroll funciona (debe leer hasta el final)
- [ ] Validación de checkbox funciona (debe marcar antes de firmar)

---

## 🎯 Pruebas Rápidas (Sin Registro Completo)

### Prueba del Componente FirmaCanvas

1. Ir a `/test/firma-canvas` (si existe la ruta)
2. Probar dibujar firma
3. Probar botón "Limpiar"
4. Probar botón "Confirmar"
5. Verificar que se genera data URL

### Prueba del Componente TerminosYCondiciones

1. Crear una página de prueba temporal
2. Importar y usar el componente:
   ```jsx
   import TerminosYCondiciones from './components/common/TerminosYCondiciones'
   
   // En tu componente
   <TerminosYCondiciones
     isOpen={true}
     onAccept={() => console.log('Aceptado')}
     required={true}
   />
   ```

---

## 📝 Notas Adicionales

- **Modo Desarrollo**: Usa la consola del navegador (F12) para ver logs y errores
- **Network Tab**: Revisa las peticiones a Supabase en la pestaña Network
- **Supabase Logs**: Revisa los logs en Supabase Dashboard → Logs para ver errores del backend
- **Storage**: Verifica que las políticas de Storage permitan lectura/escritura para usuarios autenticados

---

**Última actualización**: 2025-01-26
