Esta guía se usará para ir enlistando los errores que vayamos teniendo y las soluciones, con el objetivo de tenerlos siempre en cuenta cada vez que se cree una nueva parte o se actualice algo en el proyecto.

Cada vez que tengamos un error, al confirmar que ya se solucionó, se debe registrar el detalle del error y su solución.

---

## 📋 Índice de Errores

1. [NotFoundError: Failed to execute 'insertBefore' en Button Component](#error-1-notfounderror-insertbefore-en-button)

---

## Error 1: NotFoundError: Failed to execute 'insertBefore' en Button Component

**Fecha:** 2025-01-26  
**Componente afectado:** `frontend/src/components/common/Button.jsx`  
**Módulos afectados:** Formularios de Categorías, Marcas, Clientes, Productos

### Descripción del Error

```
NotFoundError: Failed to execute 'insertBefore' on 'Node': 
The node before which the new node is to be inserted is not a child of this node.
```

El error ocurría cuando se intentaba renderizar los formularios de categorías, marcas u otros módulos que usaban el componente `Button` con la prop `loading`.

**Stack trace típico:**
```
en el lapso (<anónimo>)
en el botón (<anónimo>)
en el botón (Button.jsx:33)
en CategoriaForm / MarcaForm / ClienteForm
```

### Causa del Error

El error se debía al **renderizado condicional del spinner** dentro del componente `Button`:

```jsx
// ❌ Código que causaba el error:
{loading && (
  <span className="spinner spinner-sm" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
)}
{children}
```

Cuando React intentaba insertar/remover el elemento `<span>` del spinner de forma condicional, se producía un conflicto en la manipulación del DOM, generando el error `NotFoundError: Failed to execute 'insertBefore'`.

### Solución Implementada

En lugar de renderizar el spinner condicionalmente, ahora se **renderiza siempre** pero se **controla su visibilidad con CSS**:

```jsx
// ✅ Código corregido:
<span 
  className="spinner spinner-sm" 
  style={{ 
    marginRight: loading ? '0.5rem' : '0',
    display: loading ? 'inline-block' : 'none'
  }} 
/>
{children}
```

**Ventajas de esta solución:**
- El elemento `<span>` siempre existe en el DOM, evitando conflictos con React
- La visibilidad se controla mediante CSS (`display: none` cuando no está cargando)
- Mantiene la misma funcionalidad visual
- Es más estable para React

### Archivos Modificados

- `frontend/src/components/common/Button.jsx`

### Prevención

**IMPORTANTE:** Al crear componentes que rendericen elementos condicionalmente dentro de botones u otros elementos interactivos, evitar el patrón `{condición && <elemento>}` cuando sea posible. En su lugar:

1. **Renderizar siempre el elemento** y controlar la visibilidad con CSS
2. O usar **Fragments** (`<>...</>`) para envolver elementos condicionales
3. O usar **estados de CSS** (clases) en lugar de renderizado condicional para elementos que aparecen/desaparecen frecuentemente

### Referencias Relacionadas

- Ver también: `MANEJO_DE_ERRORES_FORMULARIOS.md` - Error similar con `removeChild` en componente Input

---