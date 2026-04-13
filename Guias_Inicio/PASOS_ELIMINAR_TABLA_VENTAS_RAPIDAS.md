# Pasos para eliminar solo la tabla `ventas_rapidas` (sin borrar el comercio)

## Objetivo

Sacar de Supabase la tabla **`ventas_rapidas`**, que la app **ya no usa**.  
Tus **ventas desde enero**, **productos**, **comercio**, **usuarios** y el resto de datos **no se borran** con este proceso.

---

## Muy importante (leer antes de hacer nada)

| Esto **sí** hace este proceso | Esto **no** hace este proceso |
|-------------------------------|--------------------------------|
| Quitar una tabla vacía o redundante (`ventas_rapidas`) | **No** borra filas de `ventas`, `venta_items`, `venta_pagos`, `productos`, `comercios`, etc. |
| Es un cambio de **esquema** (DDL) puntual | **No** es “eliminar cuenta del comercio” ni la edge `eliminar-cuenta-comercio` |
| Ejecutás **un script SQL** en el editor | **No** tenés que borrar el negocio ni volver a cargar todo desde cero |

**Confusión frecuente:** el archivo `ELIMINAR_CUENTA_Y_CORS.md` habla de **otra cosa** (borrado de cuenta / CORS). **No** hace falta usar esa guía ni invocar la edge de borrado de comercio para sacar `ventas_rapidas`.

**Comando `npx supabase functions deploy eliminar-cuenta-comercio`:** solo **sube código** de una función. **No** borra datos al ejecutarlo. Los datos se borran **solo** si alguien usa en la app la acción de “eliminar cuenta del comercio” (dueño). Eso **no** es parte de estos pasos.

---

## Qué hace hoy el código del repo (referencia)

- Alta venta rápida: **`ventas`**, **`venta_items`**, **`venta_pagos`** (sin `ventas_rapidas`).
- Listado “Registros de ventas rápidas”: lee **`ventas`** (mismo comercio; incluye POS y rápidas según filtros).
- Detalle `/ventas-rapidas/:id`: el `id` es **`ventas.id`**.
- Borrado de una venta desde esa pantalla: **`deleteVenta`** sobre `ventas` (no toca `ventas_rapidas`).
- Caja: suma desde **`ventas`** + **`venta_pagos`**.
- Edge `eliminar-cuenta-comercio`: ya no lista `ventas_rapidas` (evita error si la tabla ya no existe).

---

## Paso a paso (orden recomendado)

### Paso 1 — Publicar el frontend

“Desplegar” = que **todos los que usan la app en internet** (o vos en producción) tengan el **código nuevo** que ya no usa `ventas_rapidas`.

**Por qué:** si alguien sigue con una **versión vieja** publicada, al intentar escribir en `ventas_rapidas` puede fallar **después** de que borres la tabla en Supabase.

#### Si solo probás en tu PC (`localhost`)

- Con **`npm run dev`** en la carpeta `frontend` y el código del repo **actualizado**, para vos ya estás usando la versión nueva.
- El “despliegue” real solo importa cuando exista **otra URL** (producción) que otros usan.

#### Si tenés la app en internet (ej. Vercel, como en `DESARROLLO_LOCAL.md`)

1. **Commiteá y pusheá** los cambios del frontend a la rama que Vercel (u otro host) usa para construir (muchas veces `main`).
2. Esperá a que el panel de Vercel termine el **build** (Deployments → debe quedar en verde).
3. Abrí la URL pública y recargá con **Ctrl+F5** (o ventana privada) por si el navegador cachea el bundle viejo.

#### Si publicás el build a mano (cualquier hosting estático)

En tu máquina:

```powershell
cd c:\2026\adminisgo.26.01.00\frontend
npm install
npm run build
```

Eso genera la carpeta **`dist/`**. Subí **el contenido de `dist/`** al servidor o bucket donde servís el sitio (cada hosting tiene su propio método: FTP, panel, CLI de S3, etc.).

#### Comprobar que el build no rompe

Antes de subir a producción, podés revisar localmente el build:

```powershell
npm run preview
```

y abrí la URL que indique la consola.

---

### Paso 2 — Probar en tu entorno (staging o producción)

Comprobá sin apuro:

1. **Ventas rápidas:** cargar una venta (producto código `1111111111`), con caja abierta si aplica.
2. **Listado** en Ventas rápidas: se listan ventas (desde `ventas`).
3. **Detalle:** abrir `/ventas-rapidas/<número>` donde el número sea un **`ventas.id`** real (desde el listado).
4. **Borrar** una venta de prueba desde el menú de acciones y verificar que desaparece.
5. **Caja:** abrir / cerrar o revisar totales si lo usás.

Si algo falla, **no** sigas al Paso 4 hasta corregirlo.

---

### Paso 3 (opcional) — Redeploy de la edge `eliminar-cuenta-comercio`

- Solo si **usás** esa función en Supabase.

```text
npx supabase functions deploy eliminar-cuenta-comercio
```

**Qué hace:** actualiza el **código** en el servidor. **No** borra comercios ni ventas.

**Qué no hagas:** no confundas este comando con “limpiar la base”; no borra datos.

---

### Paso 4 — Ejecutar **solo** el SQL que elimina la tabla

Cuando el Paso 1 y el 2 estén OK:

1. Entrá a **Supabase** (tu proyecto).
2. Menú **SQL** → **SQL Editor**.
3. Abrí en tu PC el archivo del repo:  
   `database/migrations/035_drop_ventas_rapidas.sql`
4. **Copiá todo** el contenido y **pegalo** en el editor.
5. Revisá que el script diga **`DROP TABLE`** sobre **`ventas_rapidas`** (y la función del trigger asociada), y **no** toque `ventas`, `comercios`, etc.
6. Ejecutá (**Run**).

**Qué pasa:** desaparece la tabla `ventas_rapidas` y lo mínimo ligado a ella. El historial de ventas sigue en **`ventas`**.

**Qué no es:** no es un “reset” del proyecto; no es borrar el comercio.

---

### Paso 5 — Verificación rápida después del SQL

- Recargá la app: Ventas rápidas, Ventas, caja.
- Si algo fallara (poco probable si el frontend ya estaba actualizado), el error sería del tipo “relation ventas_rapidas does not exist” en algún cliente viejo: actualizá ese cliente o revisá caché.

---

## Qué **no** incluye esta guía (a propósito)

- **No** incluye borrar usuarios de Authentication salvo que uses **otra** funcionalidad (eliminar cuenta del comercio).
- **No** incluye vaciar `ventas`, `productos` ni `comercios`.
- **No** requiere `supabase link` ni CLI para el SQL: el **SQL Editor** del dashboard alcanza.

---

## Enlaces viejos guardados

Si tenías favoritos con `/ventas-rapidas/<id>` donde `<id>` era el **id antiguo de una fila de `ventas_rapidas`**, puede que **no** coincida con un `ventas.id`. Los enlaces nuevos del listado usan siempre **`ventas.id`**.
