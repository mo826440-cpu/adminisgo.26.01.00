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
