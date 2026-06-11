# Manejo de Errores en Formularios - Adminis Go

Este documento detalla el manejo de errores implementado en los formularios de **Productos** y **Clientes**, según los requisitos definidos en `ALGUNOS_MANEJOS_ERRORES.md`.

---

## 📋 Índice

1. [Estructura General del Manejo de Errores](#estructura-general)
2. [Manejo de Errores en ProductoForm](#productoform)
3. [Manejo de Errores en ClienteForm](#clienteform)
4. [Componente Modal](#componente-modal)
5. [Tipos de Errores](#tipos-de-errores)
6. [Flujo de Validación](#flujo-de-validación)
7. [Componentes de Error](#componentes-de-error)

---

## 🏗️ Estructura General del Manejo de Errores

### Estados de Error

Ambos formularios utilizan el mismo patrón de estados:

```javascript
const [error, setError] = useState(null)              // Error general del formulario
const [saving, setSaving] = useState(false)           // Estado de guardado
const [loading, setLoading] = useState(false)        // Estado de carga (edición)
const [showConfirmModal, setShowConfirmModal] = useState(false)  // Modal de confirmación
const [validatedData, setValidatedData] = useState(null)         // Datos validados para guardar
```

### Visualización de Errores

Los errores se muestran usando el componente `Alert`:

```jsx
{error && (
  <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
    {error}
  </Alert>
)}
```

---

## 📦 ProductoForm

### Validaciones Implementadas

#### 1. Validaciones de Campos Obligatorios

**Campos requeridos:**
- `nombre` (texto, no vacío)
- `codigo_barras` (texto, no vacío)
- `codigo_interno` (texto, no vacío)
- `precio_venta` (numérico, >= 0)
- `stock_minimo` (numérico, >= 0) ⭐ **NUEVO**

**Código:**
```javascript
const errores = []

if (!formData.nombre.trim()) {
  errores.push('El nombre es obligatorio')
}

if (!formData.codigo_barras || !formData.codigo_barras.trim()) {
  errores.push('El código de barras es obligatorio')
}

if (!formData.codigo_interno || !formData.codigo_interno.trim()) {
  errores.push('El código interno es obligatorio')
}

if (!formData.precio_venta || parseFloat(formData.precio_venta) < 0) {
  errores.push('El precio de venta debe ser mayor o igual a 0')
}

if (!formData.stock_minimo || formData.stock_minimo === '' || parseFloat(formData.stock_minimo) < 0) {
  errores.push('El stock mínimo es obligatorio y debe ser mayor o igual a 0')
}

// Mostrar todos los errores a la vez
if (errores.length > 0) {
  setError(errores.join('. '))
  return
}
```

#### 2. Validación de Unicidad

**Campos únicos:**
- `nombre` (único por comercio)
- `codigo_barras` (único por comercio)
- `codigo_interno` (único por comercio)

**Flujo:**
1. Se valida cada campo con funciones del servicio (`verificarNombreProducto`, `verificarCodigoBarras`, `verificarCodigoInterno`)
2. Si el campo ya existe, se muestra un error específico
3. Si hay un error de conexión, se muestra un mensaje genérico

**Código:**
```javascript
// Validar nombre único
const { existe: existeNombre, error: errorNombre } = await verificarNombreProducto(
  formData.nombre.trim(), 
  isEditing ? id : null
)

if (errorNombre) {
  setError('Error al verificar el nombre del producto. Por favor, intenta nuevamente.')
  return
}

if (existeNombre) {
  setError('Ya existe un producto con este nombre. Por favor, usa un nombre diferente.')
  return
}

// Similar para codigo_barras y codigo_interno...
```

#### 3. Confirmación antes de Guardar ⭐ **NUEVO**

Después de todas las validaciones, se muestra un modal de confirmación antes de guardar:

```javascript
// Guardar datos validados y mostrar confirmación
setValidatedData(productoData)
setShowConfirmModal(true)
```

El usuario debe confirmar antes de que se ejecute el guardado real.

#### 4. Errores de Base de Datos

Los servicios (`createProducto`, `updateProducto`) traducen errores de PostgreSQL:

- **Código 23505** (Violación de restricción única):
  - "El código de barras ya está en uso..."
  - "El código interno ya está en uso..."
  - "Ya existe un producto con este nombre..."

- **Código 42501** (Sin permisos):
  - "No tienes permisos para crear/actualizar productos"

### Flujo Completo de handleSubmit (ProductoForm)

```
1. e.preventDefault()
2. setError(null)
3. Validar campos obligatorios → Si hay errores → Mostrar y retornar
4. Validar nombre único → Si hay error → Mostrar y retornar
5. Validar código de barras único → Si hay error → Mostrar y retornar
6. Validar código interno único → Si hay error → Mostrar y retornar
7. Preparar datos (formato, trim, conversiones)
8. setValidatedData(productoData)
9. setShowConfirmModal(true) ⭐ NUEVO
10. Usuario confirma en modal
11. handleConfirmSave() → createProducto/updateProducto
12. Si hay error → Mostrar y retornar
13. navigate('/productos', { state: { success: true, message: '...' } })
```

---

## 👥 ClienteForm

### Validaciones Implementadas

#### 1. Validaciones de Campos Obligatorios

**Campos requeridos:**
- `nombre` (texto, no vacío)
- `numero_documento` (texto, no vacío) ⭐ **NUEVO**
- `tipo_documento` (select, por defecto 'DNI') ⭐ **NUEVO**

**Campos opcionales con validación:**
- `email` (si se proporciona, debe tener formato válido)

**Código:**
```javascript
const errores = []

if (!formData.nombre.trim()) {
  errores.push('El nombre es obligatorio')
}

if (!formData.numero_documento || !formData.numero_documento.trim()) {
  errores.push('El número de documento es obligatorio')
}

if (formData.email && formData.email.trim()) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email.trim())) {
    errores.push('El email no tiene un formato válido')
  }
}

if (errores.length > 0) {
  setError(errores.join('. '))
  return
}
```

#### 2. Validación de Número de Documento Duplicado ⭐ **NUEVO**

**Comportamiento:** Si el número de documento ya existe, **BLOQUEA** el guardado y muestra un error.

```javascript
// 1. Validar número de documento duplicado (BLOQUEAR si existe)
const { existe: existeDocumento, error: errorDocumento } = await verificarNumeroDocumentoCliente(
  formData.numero_documento.trim(),
  isEditing ? id : null
)

if (errorDocumento) {
  setError('Error al verificar el número de documento. Por favor, intenta nuevamente.')
  return
}

if (existeDocumento) {
  setError('El número de documento ya está registrado. Por favor, verifica los datos.')
  return
}
```

#### 3. Validación de Email Único

**Validación:**
- Solo se valida si el email tiene un valor
- Se usa `verificarEmailCliente` del servicio

```javascript
if (formData.email && formData.email.trim()) {
  const { existe: existeEmail, error: errorEmail } = await verificarEmailCliente(
    formData.email.trim(), 
    isEditing ? id : null
  )
  
  if (errorEmail) {
    setError('Error al verificar el email. Por favor, intenta nuevamente.')
    return
  }
  
  if (existeEmail) {
    setError('El email ya está en uso. Por favor, usa un email diferente.')
    return
  }
}
```

#### 4. Validación de Nombre Duplicado (Advertencia) ⭐ **NUEVO**

**Comportamiento:** Si el nombre ya existe, muestra una **ADVERTENCIA** (no error) con modal que permite continuar o cancelar.

```javascript
// 3. Validar nombre duplicado (ADVERTENCIA, no bloquear)
const { existe: existeNombre, error: errorNombre } = await verificarNombreCliente(
  formData.nombre.trim(),
  isEditing ? id : null
)

if (errorNombre) {
  setError('Error al verificar el nombre. Por favor, intenta nuevamente.')
  return
}

// Si el nombre está duplicado, mostrar ADVERTENCIA con confirmación
if (existeNombre) {
  setValidatedData(clienteData)
  setShowNombreWarningModal(true)  // Modal de advertencia
  return
}

// Si no hay nombre duplicado, mostrar confirmación normal
setValidatedData(clienteData)
setShowConfirmModal(true)
```

#### 5. Confirmación antes de Guardar ⭐ **NUEVO**

Después de todas las validaciones (y advertencias si aplica), se muestra un modal de confirmación antes de guardar.

### Flujo Completo de handleSubmit (ClienteForm)

```
1. e.preventDefault()
2. setError(null)
3. Validar campos obligatorios y formato email → Si hay errores → Mostrar y retornar
4. Validar número de documento duplicado → Si existe → ERROR (bloquear) y retornar
5. Si email tiene valor → Validar email único → Si hay error → Mostrar y retornar
6. Validar nombre duplicado → Si existe → Mostrar ADVERTENCIA (modal) ⭐ NUEVO
   - Si usuario confirma advertencia → Continuar
   - Si usuario cancela → Retornar
7. Preparar datos (trim, nulls para campos vacíos)
8. setValidatedData(clienteData)
9. setShowConfirmModal(true) ⭐ NUEVO
10. Usuario confirma en modal
11. handleConfirmSave() → createCliente/updateCliente
12. Si hay error → Mostrar y retornar
13. navigate('/clientes', { state: { success: true, message: '...' } })
```

---

## 🎯 Componente Modal ⭐ **NUEVO**

Se creó un componente `Modal` reutilizable para confirmaciones y advertencias.

### Uso del Modal

```jsx
import { Modal, Button } from '../../components/common'

<Modal
  isOpen={showConfirmModal}
  onClose={() => {
    setShowConfirmModal(false)
    setValidatedData(null)
  }}
  title="Confirmar Guardado"
  variant="default"  // 'default', 'warning', 'danger'
  closeOnOverlayClick={false}
  footer={
    <>
      <Button variant="outline" onClick={handleCancel}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleConfirmSave} loading={saving}>
        Confirmar
      </Button>
    </>
  }
>
  <p>¿Estás seguro de que deseas guardar estos datos?</p>
</Modal>
```

### Modal de Advertencia (ClienteForm)

```jsx
<Modal
  isOpen={showNombreWarningModal}
  onClose={() => {
    setShowNombreWarningModal(false)
    setValidatedData(null)
  }}
  title="Advertencia: Nombre Duplicado"
  variant="warning"
  closeOnOverlayClick={false}
  footer={
    <>
      <Button variant="outline" onClick={handleCancel}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={() => {
        setShowNombreWarningModal(false)
        setShowConfirmModal(true)
      }}>
        Continuar de todos modos
      </Button>
    </>
  }
>
  <p>
    Ya existe un cliente registrado con el nombre <strong>"{formData.nombre}"</strong>.
  </p>
  <p style={{ marginTop: '1rem' }}>
    ¿Deseas continuar con la carga de todos modos?
  </p>
</Modal>
```

---

## 🔍 Tipos de Errores

### 1. Errores de Validación del Cliente (Frontend)

- **Campos obligatorios vacíos**
- **Formato inválido** (ej: email mal formateado)
- **Validación de unicidad** (verificación previa antes de guardar)

**Características:**
- No se hace petición a la API
- Se muestran inmediatamente
- El usuario puede corregir y reintentar

### 2. Errores de Base de Datos (Backend)

- **Restricciones únicas** (código 23505)
- **Violaciones de RLS** (código 42501)
- **Errores de conexión**

**Características:**
- Ocurren después de la petición a la API
- Se traducen a mensajes amigables
- Se muestran en el `Alert` del formulario

### 3. Advertencias (No bloquean) ⭐ **NUEVO**

- **Nombre de cliente duplicado**: Muestra modal de advertencia que permite continuar o cancelar

**Características:**
- No bloquean el guardado
- Requieren confirmación explícita del usuario
- Se muestran en un `Modal` con variante `warning`

### 4. Errores Inesperados

- **Errores de red**
- **Errores de parseo**
- **Errores desconocidos**

**Características:**
- Se capturan en el bloque `catch`
- Se registran en la consola
- Se muestra un mensaje genérico al usuario

---

## 🔄 Flujo de Validación

### Orden de Validaciones

1. **Validación de campos obligatorios** (sincrónico, frontend)
2. **Validación de formato** (sincrónico, frontend)
3. **Validación de unicidad** (asíncrono, frontend - consulta a la API)
   - **Número de documento** (Clientes): Si existe → ERROR (bloquea)
   - **Nombre** (Clientes): Si existe → ADVERTENCIA (permite continuar) ⭐
   - **Email** (Clientes): Si existe → ERROR (bloquea)
   - **Nombre, Código de barras, Código interno** (Productos): Si existe → ERROR (bloquea)
4. **Preparación de datos** (sincrónico, frontend)
5. **Modal de confirmación** ⭐ **NUEVO**
6. **Petición a la API** (asíncrono, backend)
7. **Validación de RLS y restricciones DB** (backend)
8. **Navegación exitosa** o **Mostrar error**

### Principios

- **Validación temprana**: Se valida antes de hacer peticiones innecesarias
- **Mensajes claros**: Cada error tiene un mensaje específico
- **Errores acumulativos**: Se muestran todos los errores de validación a la vez
- **Errores individuales**: Se muestra un error a la vez para validaciones asíncronas (unicidad)
- **Confirmación explícita**: El usuario debe confirmar antes de guardar ⭐ **NUEVO**
- **Advertencias vs Errores**: Las advertencias permiten continuar, los errores bloquean ⭐ **NUEVO**

---

## 🧩 Componentes de Error

### Alert Component

Utilizado para mostrar errores al usuario:

```jsx
<Alert variant="danger" dismissible onDismiss={() => setError(null)}>
  {error}
</Alert>
```

**Características:**
- `variant="danger"`: Estilo rojo para errores
- `dismissible`: Permite cerrar el mensaje
- `onDismiss`: Callback para limpiar el estado de error

### Modal Component ⭐ **NUEVO**

Utilizado para confirmaciones y advertencias:

```jsx
<Modal
  isOpen={showModal}
  onClose={handleClose}
  title="Título del Modal"
  variant="warning"  // 'default', 'warning', 'danger'
  footer={<Button>Acción</Button>}
>
  Contenido del modal
</Modal>
```

**Características:**
- Bloquea el scroll del body cuando está abierto
- Se cierra con ESC
- Variantes visuales para diferentes tipos de mensajes
- Footer personalizable con acciones

### Estados de Loading

Durante las validaciones y guardado, se deshabilitan los controles:

```jsx
<Button 
  type="submit" 
  variant="primary" 
  loading={saving} 
  disabled={saving}
>
  {isEditing ? 'Actualizar' : 'Crear'}
</Button>
```

**Características:**
- `loading={saving}`: Muestra spinner mientras guarda
- `disabled={saving}`: Deshabilita el botón para evitar doble envío

---

## 📝 Notas Importantes

1. **Manejo de `setSaving(false)`**: Siempre se establece antes de retornar o navegar
2. **Navegación después del éxito**: Se usa `navigate` con `replace: true` para evitar que el usuario vuelva al formulario
3. **Estado de éxito**: Se pasa a través de `location.state` para mostrar mensaje en la lista
4. **Limpieza de errores**: El usuario puede cerrar el `Alert` manualmente con `onDismiss`
5. **Logging**: Los errores inesperados se registran en la consola para debugging
6. **Confirmación obligatoria**: El usuario debe confirmar explícitamente antes de guardar ⭐ **NUEVO**
7. **Datos validados**: Se guardan en `validatedData` antes de mostrar el modal de confirmación ⭐ **NUEVO**

---

## 🐛 Problemas Conocidos y Soluciones

### Error: "NotFoundError: Failed to execute 'removeChild' on 'Node'"

**Causa:**
- El componente `Input` no maneja el prop `textarea`. Cuando se usa `<Input textarea ...>`, React intenta pasar el prop `textarea` a un elemento `<input>`, lo cual es inválido y causa conflictos en el DOM.

**Solución implementada:**
- **ClienteForm**: Usar `<textarea className="form-control" ...>` directamente en lugar de `<Input textarea ...>`
- **ProductoForm**: Ya usaba `<textarea>` directamente (correcto)
- El componente `Input` solo debe usarse para elementos `<input>`, no para `<textarea>`

**Código incorrecto:**
```jsx
<Input textarea rows="3" ... />  // ❌ NO funciona
```

**Código correcto:**
```jsx
<textarea className="form-control" rows="3" ... />  // ✅ Funciona
```

**Nota:** Si se necesita un componente reutilizable para textarea, crear un componente `Textarea` separado.

---

## ✅ Mejores Prácticas Implementadas

1. ✅ Validación temprana (antes de peticiones)
2. ✅ Mensajes de error específicos y claros
3. ✅ Manejo de estados de carga (loading/saving)
4. ✅ Traducción de errores de base de datos
5. ✅ Prevención de doble envío (disabled durante saving)
6. ✅ Limpieza de errores (dismissible alerts)
7. ✅ Logging de errores inesperados
8. ✅ Navegación con mensajes de éxito
9. ✅ Confirmación antes de guardar (modales) ⭐ **NUEVO**
10. ✅ Diferenciación entre errores (bloquean) y advertencias (permiten continuar) ⭐ **NUEVO**
11. ✅ Validación de número de documento en clientes ⭐ **NUEVO**
12. ✅ Stock mínimo obligatorio en productos ⭐ **NUEVO**

---

## 📊 Resumen de Validaciones por Formulario

### ProductoForm

| Campo | Obligatorio | Único | Validación Especial |
|-------|-------------|-------|---------------------|
| Nombre | ✅ | ✅ | Error si duplicado |
| Código de barras | ✅ | ✅ | Error si duplicado |
| Código interno | ✅ | ✅ | Error si duplicado |
| Precio de venta | ✅ | ❌ | >= 0 |
| Stock mínimo | ✅ | ❌ | >= 0 ⭐ **NUEVO** |
| Confirmación | ✅ | - | Modal antes de guardar ⭐ **NUEVO** |

### ClienteForm

| Campo | Obligatorio | Único | Validación Especial |
|-------|-------------|-------|---------------------|
| Nombre | ✅ | ⚠️ | Advertencia si duplicado (permite continuar) ⭐ **NUEVO** |
| Número de documento | ✅ | ✅ | Error si duplicado ⭐ **NUEVO** |
| Tipo de documento | ✅ | ❌ | Select con opciones ⭐ **NUEVO** |
| Email | ❌ | ✅ | Error si duplicado, formato válido |
| Confirmación | ✅ | - | Modal antes de guardar ⭐ **NUEVO** |

**Leyenda:**
- ✅ = Obligatorio / Implementado
- ❌ = No aplica
- ⚠️ = Advertencia (no bloquea)

---

**Última actualización**: 2026-01-27  
**Formularios documentados**: ProductoForm, ClienteForm  
**Versión**: 2.0 (Actualizado con modales, confirmaciones y nuevas validaciones)
