# Ver cambios del sistema en tu PC (desarrollo local)

Esta guía sirve para **probar las modificaciones del proyecto en tu máquina** sin hacer commit ni push a GitHub. La URL de Vercel **no se actualiza** hasta que subas los cambios al repositorio.

## Requisitos

- [Node.js](https://nodejs.org/) instalado (incluye `npm`).
- El código del proyecto en tu disco, por ejemplo: `c:\2026\adminisgo.26.01.00`.

## Primera vez (o si cambian las dependencias)

1. Abrí **PowerShell** o **Terminal**.
2. Entrá a la carpeta del **frontend**:

   ```powershell
   cd c:\2026\adminisgo.26.01.00\frontend
   ```

3. Instalá dependencias (solo hace falta repetir esto si no lo hiciste antes, o después de actualizar `package.json`):

   ```powershell
   npm install
   ```

## Cada vez que quieras ver el sistema con los últimos cambios

1. En la terminal, desde la carpeta `frontend`:

   ```powershell
   cd c:\2026\adminisgo.26.01.00\frontend
   npm run dev
   ```

2. La consola mostrará una dirección local, por lo general:

   **http://localhost:5173**

3. Abrí esa URL en el navegador (Chrome, Edge, etc.).

4. **Mientras `npm run dev` siga ejecutándose:**
   - Editá archivos en Cursor y **guardá** (`Ctrl+S`).
   - En muchos casos la página se **actualiza sola** (recarga rápida de Vite).
   - Si algo no se refleja, probá un **refresco manual** (`F5` o `Ctrl+R`).

5. Para **detener** el servidor: en la terminal, `Ctrl+C`.

## Comprobar que el proyecto compila (opcional)

Antes de un push grande, conviene verificar que no haya errores de build:

```powershell
cd c:\2026\adminisgo.26.01.00\frontend
npm run build
```

Si termina sin errores, el código compila correctamente. Para previsualizar esa versión “de producción” en local:

```powershell
npm run preview
```

(También te dará una URL en `localhost`; `Ctrl+C` para salir.)

## Ventas y ventas rápidas: qué datos se cargan al probar en local

Para que el listado sea **rápido** con mucho historial y con **RLS por módulo** en Supabase, el frontend **no** pide “todas las ventas del comercio” salvo que ampliés el rango en pantalla.

| Pantalla / servicio | Criterio por defecto | Cómo ver más historial |
|---------------------|----------------------|-------------------------|
| **Registros de ventas** (`VentasList`) | Se piden a Supabase las ventas del rango de fechas del filtro (por defecto **unos 3 meses** hasta hoy). | Abrí filtros y cambiá “Desde” / “Hasta”; al guardar el rango se vuelve a consultar el servidor. |
| **Ventas rápidas** (tabla de registros) | Si no hay filtro de fechas ni “desde apertura de caja”, el servicio usa **últimos 3 meses**. | Filtros manuales de fecha o, con caja abierta, el listado puede acotarse desde la última apertura. |

En **Registros de ventas**, la tabla pagina de a **100** filas solo en pantalla: el listado igual trae del servidor **todo el rango de fechas** (para filtros, indicadores y búsqueda) y además consulta las **líneas de venta** (`venta_items`) para calcular unidades. **Ventas rápidas** no hace esa segunda tanda de consultas, por eso suele sentirse más liviana con el mismo rango.

Implementación de referencia (por si tocás código o depurás lentitud):

- `frontend/src/services/ventas.js` — función `getVentas`
- `frontend/src/services/ventasRapidas.js` — función `getVentasRapidas`
- `frontend/src/pages/ventas/VentasList.jsx` — pasa las fechas del filtro al cargar

**Supabase (listado de ventas):**
- `039_ventas_listado_unidades_agg.sql` — crea la RPC de unidades.
- `040_fix_ventas_listado_unidades_agg_definer.sql` — **ejecutala también** si ves **error 500** al llamar a `ventas_listado_unidades_agg` (la 039 con `SECURITY INVOKER` + agregado sobre `venta_items` y RLS puede fallar en PostgREST).

Sin la RPC, el front sigue yendo al plan B (muchas lecturas a `venta_items`).

**PostgREST / offsets:** si el `select` de `ventas` incluye embeds (`clientes`, `usuarios`) y hay muchas páginas (`offset=4000`, etc.), Supabase a veces responde **500**. El código del front ya **no** usa esos embeds en listados paginados; hidrata nombres aparte.

Si algo tarda demasiado tras ampliar mucho el rango de fechas, es esperable: estás trayendo más filas desde la base. En ese caso conviene acotar fechas o revisar índices/consultas en Supabase.

## Resumen rápido

| Objetivo              | Comando (desde `frontend`) |
|-----------------------|----------------------------|
| Ver cambios al vuelo  | `npm run dev`              |
| Validar compilación | `npm run build`            |
| Probar build en local | `npm run preview`          |

## Relación con GitHub y Vercel

- **Local:** ves lo que tenés guardado en **esta PC**.
- **Vercel:** muestra lo que está en **GitHub** después de un **push** (y el deploy que corresponda).

Flujo recomendado: desarrollar y probar con `npm run dev`; cuando el bloque de trabajo esté listo, **commit + push** para actualizar el sitio en internet.
