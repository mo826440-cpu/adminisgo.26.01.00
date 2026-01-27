# Solución: Error de Git index.lock

## 🔴 Problema
Git muestra error: `Unable to create 'C:/adminisgo.26.01.00/.git/index.lock': File exists`

## ✅ Solución Paso a Paso

### Método 1: Cerrar Cursor y Eliminar Lock (RECOMENDADO)

1. **Cerrar Cursor completamente**:
   - Cierra todas las ventanas de Cursor
   - Verifica en el Administrador de Tareas que no hay procesos de Cursor corriendo
   - Espera 10 segundos

2. **Eliminar el archivo lock**:
   - Abre el Explorador de Windows
   - Ve a: `C:\adminisgo.26.01.00\.git\`
   - Busca el archivo `index.lock`
   - Elimínalo (si no puedes, reinicia la computadora)

3. **Abrir Cursor nuevamente**:
   - Abre Cursor
   - Intenta hacer commit y push desde la interfaz

### Método 2: Usar Git desde PowerShell (Fuera de Cursor)

1. **Cerrar Cursor completamente**

2. **Abrir PowerShell como Administrador**:
   - Clic derecho en PowerShell → "Ejecutar como administrador"

3. **Ejecutar estos comandos**:
   ```powershell
   cd C:\adminisgo.26.01.00
   
   # Eliminar lock
   Remove-Item .git\index.lock -Force -ErrorAction SilentlyContinue
   
   # Agregar archivos
   git add .
   
   # Hacer commit
   git commit -m "feat: Implementar sistema de términos y condiciones con firma digital"
   
   # Hacer push
   git push origin main
   ```

### Método 3: Usar GitHub Desktop (Si lo tienes instalado)

1. Abre GitHub Desktop
2. Selecciona el repositorio `adminisgo.26.01.00`
3. Verás todos los cambios
4. Escribe el mensaje de commit
5. Haz clic en "Commit to main"
6. Haz clic en "Push origin"

---

## 🆘 Si Nada Funciona

1. **Reiniciar la computadora** (esto cierra todos los procesos)
2. **Después de reiniciar**, eliminar `index.lock`
3. **Abrir Cursor** y hacer commit/push

---

**Nota**: El archivo `index.lock` es un mecanismo de seguridad de Git para evitar que múltiples procesos modifiquen el repositorio al mismo tiempo. Si aparece este error, significa que algún proceso (Cursor, VS Code, o Git) está usando el repositorio.
