# Guía de Deployment en Vercel - Adminis Go

Esta guía te ayudará a desplegar tu aplicación en Vercel de forma rápida y sencilla.

## 📋 Requisitos Previos

- ✅ Build de producción funcionando (`npm run build`)
- ✅ Variables de entorno de Supabase
- ✅ Cuenta de GitHub (gratis) - OPCIONAL pero recomendado
- ✅ Cuenta de Vercel (gratis)

## 🚀 Pasos para Deployment

### Paso 1: Crear cuenta en Vercel (si no la tenés)

1. Andá a: https://vercel.com
2. Clickeá en **"Sign Up"** (Registrarse)
3. Elegí registrarte con **GitHub** (recomendado) o email
4. Completa el registro

### Paso 2: Preparar el proyecto

#### Opción A: Con GitHub (Recomendado)

1. Creá un repositorio en GitHub (si no lo tenés):
   - Andá a https://github.com/new
   - Nombre: `adminisgo` (o el que prefieras)
   - Clickeá "Create repository"

2. En tu terminal (en la carpeta del proyecto):
   ```powershell
   cd C:\adminisgo.26.01.00
   git add .
   git commit -m "Preparación para deployment"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/adminisgo.git
   git push -u origin main
   ```

#### Opción B: Sin GitHub (Deploy directo desde carpeta)

Vercel también permite subir archivos directamente, pero GitHub es más fácil para actualizaciones futuras.

### Paso 3: Conectar proyecto en Vercel

1. Andá a https://vercel.com/dashboard
2. Clickeá en **"Add New..."** → **"Project"**
3. Si usaste GitHub:
   - Conectá tu cuenta de GitHub si no lo hiciste
   - Buscá el repositorio `adminisgo`
   - Clickeá **"Import"**
4. Si no usaste GitHub:
   - Seleccioná **"Deploy from a local directory"**
   - Subí la carpeta `frontend`

### Paso 4: Configurar el proyecto en Vercel

Vercel debería detectar automáticamente que es un proyecto Vite/React. Configurá:

**Framework Preset:** Vite (debería detectarse automáticamente)

**Root Directory:** `frontend` (si el repositorio tiene la carpeta frontend, o `.` si solo está frontend)

**Build Command:** `npm run build`

**Output Directory:** `dist`

**Install Command:** `npm install` (por defecto)

### Paso 5: Configurar Variables de Entorno

⚠️ **MUY IMPORTANTE**: Necesitás agregar las variables de entorno de Supabase:

1. En la configuración del proyecto, buscá **"Environment Variables"**
2. Agregá estas variables:

   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** (tu URL de Supabase, ejemplo: `https://xxxxx.supabase.co`)
   - **Environment:** Production, Preview, Development (marcá las 3)

   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** (tu API Key anónima de Supabase)
   - **Environment:** Production, Preview, Development (marcá las 3)

3. Clickeá **"Save"**

### Paso 6: Hacer el Deploy

1. Clickeá el botón **"Deploy"**
2. Esperá 2-3 minutos mientras Vercel:
   - Instala las dependencias
   - Hace el build
   - Despliega la app
3. Cuando termine, verás una URL tipo: `https://tu-proyecto.vercel.app`

### Paso 7: Configurar Supabase (Permitir dominio de Vercel)

1. Andá a tu proyecto en Supabase: https://supabase.com/dashboard
2. Andá a **Settings** → **API**
3. En **"URL Configuration"**, buscá **"Allowed URLs"** o **"Site URL"**
4. Agregá la URL de Vercel: `https://tu-proyecto.vercel.app`
5. Guardá los cambios

### Paso 8: Probar la App en Producción

1. Abrí la URL de Vercel en el navegador
2. Probá:
   - ✅ Login/Registro
   - ✅ Navegación
   - ✅ Crear/editar productos
   - ✅ PWA (instalar desde la URL de producción)
3. Si algo no funciona, revisá:
   - Variables de entorno configuradas correctamente
   - Dominio permitido en Supabase
   - Console del navegador (F12) para errores

## 🔄 Actualizaciones Futuras

Cada vez que hagas `git push` a GitHub, Vercel automáticamente:
- Detecta los cambios
- Hace un nuevo build
- Despliega la nueva versión

O podés hacer deploy manual desde el dashboard de Vercel.

## 🌐 Configurar Dominio Personalizado (Opcional)

Si tenés un dominio (ej: `adminisgo.com`):

1. En Vercel Dashboard → Tu proyecto → **Settings** → **Domains**
2. Agregá tu dominio
3. Sigue las instrucciones de Vercel para configurar DNS
4. También agregá el dominio en Supabase (Settings → API → Allowed URLs)

## ⚠️ Notas Importantes

- Las variables de entorno **NO** se suben a GitHub (están en .gitignore)
- Siempre configurálas en Vercel
- El dominio de Vercel debe estar en Supabase como URL permitida
- HTTPS es automático en Vercel (gratis)

## 🆘 Solución de Problemas

**Error: "Environment variables not found"**
- Verificá que agregaste las variables en Vercel
- Asegurate de que los nombres sean exactos: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

**Error: "Invalid API key" en producción**
- Verificá que el dominio de Vercel esté en Supabase (Settings → API → Allowed URLs)

**Build falla**
- Revisá los logs en Vercel
- Probá hacer `npm run build` localmente primero

**PWA no funciona en producción**
- Verificá que `site.webmanifest` esté en `/public`
- Verificá que el Service Worker esté accesible
- Probá en Chrome/Edge con HTTPS (requerido para PWA)

---

**¿Necesitás ayuda?** Revisá los logs de deployment en Vercel o los errores en la consola del navegador.

