# Solución: Botón "Pagar" Deshabilitado en Mercado Pago Sandbox

## 🔴 Problema

El botón "Pagar" está deshabilitado (gris) en el checkout de Mercado Pago Sandbox.

## ✅ Soluciones

### Solución 1: Usar Cuenta de Prueba del Comprador

**IMPORTANTE**: En Mercado Pago Sandbox, necesitas estar logueado con una cuenta de prueba del comprador para que el botón se habilite.

**Pasos:**
1. Ve a Mercado Pago Developers → "PRUEBAS" → "Cuentas de prueba"
2. Copia las credenciales de la cuenta "Comprador" (TESTUSER...)
3. En otra pestaña, ve a: https://www.mercadopago.com.ar/
4. Inicia sesión con esas credenciales de prueba
5. Luego vuelve al checkout y el botón debería habilitarse

---

### Solución 2: Verificar que todos los campos estén completos

Asegúrate de que:
- ✅ Número de tarjeta esté completo
- ✅ Nombre del titular esté completo (puede ser cualquier nombre, ej: "APRO" o "Test User")
- ✅ DNI esté completo (puede ser cualquier número, ej: "12345678")
- ✅ Fecha de vencimiento esté completa
- ✅ Código de seguridad esté completo

---

### Solución 3: Recargar la página

A veces el botón se habilita después de recargar:
1. Presiona F5 o Ctrl+R
2. Completa todos los campos nuevamente
3. El botón debería habilitarse

---

### Solución 4: Usar el sandbox_init_point

El código ya está configurado para usar `sandbox_init_point` cuando está disponible. Si el problema persiste:

1. Verifica en la consola del navegador (F12) si hay errores
2. Verifica que la preferencia se creó correctamente
3. Intenta crear una nueva preferencia

---

### Solución 5: Verificar en modo incógnito

A veces las cookies o el caché pueden causar problemas:
1. Abre una ventana de incógnito
2. Inicia sesión con cuenta de prueba del comprador
3. Intenta el pago nuevamente

---

## 🎯 Solución Más Probable

**La causa más común es que no estás logueado con una cuenta de prueba del comprador.**

**Pasos rápidos:**
1. Ve a: https://www.mercadopago.com.ar/
2. Inicia sesión con las credenciales de la cuenta de prueba "Comprador"
3. Vuelve al checkout
4. El botón debería habilitarse

---

## 📝 Nota

En producción (con credenciales reales), el botón se habilita automáticamente cuando todos los campos están completos. En sandbox, requiere estar logueado con cuenta de prueba.

---

**¿Probaste iniciar sesión con la cuenta de prueba del comprador?**
