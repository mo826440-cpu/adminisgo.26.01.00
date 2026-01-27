# Guía: Hacer Commit y Push con GitHub Desktop

## 📋 Pasos para Hacer Commit y Push

### 1. Abrir GitHub Desktop

1. Busca "GitHub Desktop" en el menú de inicio de Windows
2. Ábrelo
3. Si te pide iniciar sesión, usa tus credenciales de GitHub

---

### 2. Seleccionar el Repositorio

1. En la parte superior izquierda de GitHub Desktop, verás el nombre del repositorio actual
2. Si no está seleccionado `adminisgo.26.01.00`, haz clic en el menú desplegable y selecciónalo
3. O ve a: **File → Add Local Repository** y selecciona `C:\adminisgo.26.01.00`

---

### 3. Ver los Cambios

1. En el panel izquierdo, verás una lista de archivos modificados y nuevos
2. Verás dos columnas:
   - **Left (Current branch)**: Archivos que están en el repositorio remoto
   - **Right (Working directory)**: Tus cambios locales

3. Deberías ver:
   - ✅ Archivos modificados (en naranja/amarillo)
   - ✅ Archivos nuevos (en verde)
   - ✅ Archivos eliminados (en rojo)

---

### 4. Revisar los Cambios (Opcional)

1. Haz clic en cualquier archivo de la lista
2. Verás un diff (comparación) de los cambios
3. Puedes revisar cada cambio antes de hacer commit

---

### 5. Seleccionar Archivos para Commit

**Opción A: Agregar todos los archivos (RECOMENDADO)**
- En la parte inferior izquierda, verás un checkbox "Select all" o similar
- Márcalo para seleccionar todos los archivos

**Opción B: Seleccionar archivos individuales**
- Marca el checkbox al lado de cada archivo que quieras incluir en el commit

---

### 6. Escribir el Mensaje de Commit

1. En la parte inferior, verás un campo de texto "Summary" o "Commit message"
2. Escribe el mensaje:
   ```
   feat: Implementar sistema de términos y condiciones con firma digital
   ```
3. (Opcional) Puedes agregar una descripción más detallada en el campo "Description"

---

### 7. Hacer el Commit

1. Haz clic en el botón **"Commit to main"** (o "Commit to [nombre-branch]")
2. Espera unos segundos mientras GitHub Desktop procesa el commit
3. Verás un mensaje de confirmación

---

### 8. Hacer Push al Repositorio Remoto

1. Después del commit, verás un botón **"Push origin"** o **"Push to origin"** en la parte superior
2. Haz clic en ese botón
3. Si te pide autenticación, ingresa tus credenciales de GitHub
4. Espera a que termine el push
5. Verás un mensaje de confirmación: "Successfully pushed to origin/main"

---

### 9. Verificar en GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/[tu-usuario]/adminisgo.26.01.00`
2. Deberías ver tu commit más reciente en la lista de commits
3. Los archivos nuevos y modificados deberían estar visibles

---

### 10. Verificar en Vercel

1. Ve a tu dashboard de Vercel: `https://vercel.com/dashboard`
2. Vercel debería detectar automáticamente el nuevo commit
3. En 2-5 minutos, deberías ver un nuevo deployment
4. Tu sitio `adminisgo.com` se actualizará automáticamente

---

## 🆘 Problemas Comunes

### Problema: "No se puede hacer push porque hay cambios remotos"

**Solución:**
1. Haz clic en **"Fetch origin"** o **"Pull origin"**
2. Si hay conflictos, GitHub Desktop te ayudará a resolverlos
3. Luego intenta hacer push de nuevo

### Problema: "Repository not found" o "Authentication failed"

**Solución:**
1. Ve a **File → Options → Accounts**
2. Verifica que estés autenticado con GitHub
3. Si no, haz clic en "Sign in" y autentícate

### Problema: GitHub Desktop no detecta el repositorio

**Solución:**
1. Ve a **File → Add Local Repository**
2. Haz clic en "Choose..."
3. Selecciona la carpeta `C:\adminisgo.26.01.00`
4. Haz clic en "Add repository"

---

## ✅ Checklist Final

- [ ] GitHub Desktop abierto y repositorio seleccionado
- [ ] Todos los archivos seleccionados para commit
- [ ] Mensaje de commit escrito
- [ ] Commit realizado exitosamente
- [ ] Push realizado exitosamente
- [ ] Cambios visibles en GitHub
- [ ] Deployment iniciado en Vercel

---

**¡Listo!** Una vez que hagas el push, Vercel detectará los cambios automáticamente y desplegará la nueva versión en unos minutos.
