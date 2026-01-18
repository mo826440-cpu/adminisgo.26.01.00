# Comandos para Subir Código a GitHub

**⚠️ IMPORTANTE:** Ejecutá estos comandos DESPUÉS de crear el repositorio en GitHub.

Cuando crees el repositorio, GitHub te dará una URL tipo:
`https://github.com/mo826440-cpu/adminisgo.git`

---

## 📋 Comandos a Ejecutar (en orden)

```powershell
# 1. Asegurate de estar en la carpeta del proyecto
cd C:\adminisgo.26.01.00

# 2. Agregar todos los archivos al staging
git add .

# 3. Hacer el primer commit
git commit -m "Primera versión - Preparación para deployment"

# 4. Renombrar la rama a 'main' (estándar moderno)
git branch -M main

# 5. Agregar el remote de GitHub (REEMPLAZÁ 'adminisgo' con el nombre que elegiste)
git remote add origin https://github.com/mo826440-cpu/adminisgo.git

# 6. Subir el código a GitHub
git push -u origin main
```

---

## ⚠️ Si GitHub te pide autenticación

Si te pide usuario/contraseña:
- Usuario: `mo826440-cpu`
- Contraseña: NO uses tu contraseña normal
- Usá un **Personal Access Token** (PAT) de GitHub

### Cómo crear un Personal Access Token:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Nombre: "Vercel Deployment" (o el que quieras)
4. Seleccioná: `repo` (todo)
5. "Generate token"
6. Copiá el token (solo se muestra una vez)
7. Cuando Git te pida contraseña, pegá el token

---

## ✅ Qué NO se va a subir (está bien)

- `.env` (variables de entorno - las configurás en Vercel)
- `node_modules/` (dependencias - se instalan en Vercel)
- `dist/` (build - se genera en Vercel)
- `.cache/` (caché)

---

Una vez que ejecutes estos comandos, el código estará en GitHub y podrás conectarlo con Vercel!

