# Pasos para Crear Repositorio en GitHub y Conectar con tu Proyecto

## 📋 Paso 1: Crear el Repositorio en GitHub

1. **Andá a GitHub:**
   - Abrí: https://github.com/new
   - O clickeá en el botón **"+"** (arriba a la derecha) → **"New repository"**

2. **Configurá el repositorio:**
   - **Repository name:** `adminisgo` (o el nombre que prefieras)
   - **Description:** "Sistema de gestión para comercios - Adminis Go" (opcional)
   - **Visibility:** 
     - ✅ **Public** (recomendado para proyectos personales - gratis)
     - ⚠️ **Private** (si querés que sea privado, pero GitHub cobra por repos privados en planes gratuitos - limitado)
   - ⚠️ **NO marques** "Add a README file" (porque ya tenés código local)
   - ⚠️ **NO marques** "Add .gitignore" (ya tenés uno)
   - ⚠️ **NO marques** "Choose a license" (por ahora)

3. **Clickeá "Create repository"**

4. **GitHub te mostrará una página con instrucciones** - NO las sigas todavía, vamos a hacerlo desde tu terminal.

---

## 📋 Paso 2: Conectar tu Proyecto Local con GitHub

Después de crear el repositorio, GitHub te dará una URL tipo:
`https://github.com/mo826440-cpu/adminisgo.git`

**Ejecutá estos comandos en tu terminal** (te los daré cuando crees el repo):

```powershell
cd C:\adminisgo.26.01.00
git add .
git commit -m "Primera versión - Preparación para deployment"
git branch -M main
git remote add origin https://github.com/mo826440-cpu/adminisgo.git
git push -u origin main
```

---

## ⚠️ Notas Importantes

- El archivo `.env` NO se subirá (está en .gitignore) - eso está bien, las variables las configurás en Vercel
- Los `node_modules` NO se suben (están en .gitignore) - eso está bien
- Solo se sube el código fuente

---

## ✅ Después de esto

Una vez que tengas el código en GitHub:
1. Andá a Vercel
2. Click en "Importar" (Proyecto de importación)
3. Seleccioná tu repositorio `adminisgo`
4. Vercel lo detectará automáticamente
5. Configurá las variables de entorno
6. Deploy!

---

¿Tenés alguna duda antes de crear el repo?

