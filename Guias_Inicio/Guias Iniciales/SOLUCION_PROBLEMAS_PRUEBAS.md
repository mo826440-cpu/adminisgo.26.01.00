# Solución de Problemas al Probar

## 🔴 Problema: Redirección al Dashboard al Intentar Registrarse

### Síntoma
- Al ir a `/auth/register`, eres redirigido automáticamente al dashboard
- No puedes ver la página de registro

### Causa
**Estás autenticado**. El componente `Register.jsx` redirige a usuarios autenticados al dashboard (comportamiento esperado).

### Solución
**Cerrar sesión primero**:
1. Haz clic en "Cerrar Sesión" en la esquina superior derecha del dashboard
2. O ve a `/auth/login` y cierra sesión desde ahí
3. Luego podrás acceder a `/auth/register`

**Alternativa para pruebas rápidas**:
- Abre una ventana de incógnito (`Ctrl + Shift + N`)
- Ve a `http://localhost:5173/auth/register`
- Esto te permitirá probar sin cerrar sesión en tu sesión principal

---

## 🔴 Problema: Página en Blanco

### Síntoma
- La página aparece completamente en blanco (gris oscuro)
- La URL puede mostrar `/dashboard/auth/register` en lugar de `/auth/register`

### Soluciones

#### 1. Verificar URL Correcta
**Problema**: La URL está mal formada
**Solución**: 
- Debe ser: `http://localhost:5173/auth/register`
- NO debe ser: `http://localhost:5173/dashboard/auth/register`

#### 2. Abrir Consola del Navegador (F12)
**Pasos**:
1. Presiona `F12` para abrir las herramientas de desarrollador
2. Ve a la pestaña **Console**
3. Busca errores en rojo
4. Copia los errores y revísalos

**Errores comunes**:
- `Failed to fetch` → Problema de conexión con Supabase
- `Cannot read property 'X' of undefined` → Error en el código
- `Module not found` → Falta una dependencia

#### 3. Verificar Variables de Entorno
**Problema**: Variables de entorno no configuradas
**Solución**:
1. Verificar que existe `frontend/.env`
2. Debe contener:
   ```
   VITE_SUPABASE_URL=tu-url-de-supabase
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```
3. **IMPORTANTE**: Reiniciar el servidor después de cambiar `.env`:
   ```bash
   # Detener servidor (Ctrl+C)
   npm run dev
   ```

#### 4. Verificar que el Servidor Está Corriendo
**Problema**: El servidor no está activo
**Solución**:
1. En la terminal, verifica que veas:
   ```
   VITE v7.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```
2. Si no está corriendo, ejecuta:
   ```bash
   cd frontend
   npm run dev
   ```

#### 5. Limpiar Caché del Navegador
**Problema**: Caché desactualizada
**Solución**:
1. Presiona `Ctrl + Shift + R` (recarga forzada)
2. O abre en modo incógnito: `Ctrl + Shift + N`

---

## 🔴 Problema: Error "Failed to fetch" o Errores de Supabase

### Síntoma
- Errores en consola relacionados con Supabase
- Mensajes como "Failed to fetch" o "Network error"

### Soluciones

#### 1. Verificar Variables de Entorno
```bash
# En frontend/.env debe estar:
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

#### 2. Verificar Conexión a Internet
- Asegúrate de tener conexión a internet
- Verifica que puedas acceder a Supabase Dashboard

#### 3. Verificar Credenciales
1. Ve a Supabase Dashboard
2. Settings → API
3. Copia la URL y la anon key
4. Actualiza `frontend/.env`
5. Reinicia el servidor

---

## 🔴 Problema: Modal de Términos No Aparece

### Síntoma
- El flujo continúa pero no aparece el modal de términos

### Soluciones

#### 1. Verificar que Hay Términos en la BD
Ejecutar en Supabase SQL Editor:
```sql
SELECT * FROM terminos_condiciones WHERE activo = true;
```

Si no hay resultados, insertar términos de prueba:
```sql
INSERT INTO terminos_condiciones (version, titulo, contenido, activo, fecha_publicacion)
VALUES (
  '1.0', 
  'Términos y Condiciones', 
  '<h1>Términos y Condiciones</h1><p>Contenido de prueba para testing.</p>', 
  true,
  NOW()
);
```

#### 2. Verificar Funciones RPC
Ejecutar en Supabase SQL Editor:
```sql
-- Verificar que existe la función
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'obtener_terminos_actuales';
```

Si no existe, ejecutar la migración `019_consentimientos.sql`

#### 3. Verificar Consola del Navegador
- Abrir F12 → Console
- Buscar errores relacionados con `obtenerTerminosActuales` o `verificarConsentimientoActual`

---

## 🔴 Problema: Error al Subir Firma

### Síntoma
- La firma se dibuja pero no se sube
- Error "Failed to upload" o similar

### Soluciones

#### 1. Crear Bucket en Supabase Storage
1. Ve a Supabase Dashboard → Storage
2. Click en "New bucket"
3. Nombre: `firmas`
4. Público: **NO** (debe ser privado)
5. Click en "Create bucket"

#### 2. Configurar Políticas de Storage
En Supabase SQL Editor, ejecutar:

```sql
-- Política para permitir subir firmas (usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden subir firmas"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'firmas' AND
  (storage.foldername(name))[1] IN ('terminos', 'eliminacion')
);

-- Política para permitir leer firmas (usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden leer firmas"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'firmas');
```

#### 3. Verificar que el Bucket Existe
```sql
SELECT * FROM storage.buckets WHERE name = 'firmas';
```

---

## 🔴 Problema: Error "Usuario no autenticado"

### Síntoma
- Error al guardar consentimiento
- Mensaje "Usuario no autenticado"

### Soluciones

#### 1. Verificar Sesión
1. Abrir F12 → Application (o Aplicación)
2. Local Storage → Buscar `supabase.auth.token`
3. Si no existe, la sesión expiró

#### 2. Cerrar y Volver a Iniciar Sesión
1. Ir a `/auth/login`
2. Iniciar sesión nuevamente
3. Intentar de nuevo

#### 3. Verificar Variables de Entorno
- Asegúrate de que `VITE_SUPABASE_ANON_KEY` esté correcta
- Reinicia el servidor después de cambiar `.env`

---

## 🔴 Problema: Términos se Muestran Dos Veces

### Síntoma
- El modal de términos aparece dos veces
- Se muestra en SelectPlan y luego en CompleteRegistration

### Solución

Esto es **comportamiento esperado** en algunos casos:
- **Plan Gratis**: Términos se muestran solo en CompleteRegistration
- **Plan Pago**: Términos se muestran en SelectPlan, NO en CompleteRegistration (si ya fueron aceptados)

Si se muestran dos veces para plan de pago, verificar:
1. Que `verificarConsentimientoActual()` funciona correctamente
2. Que el estado `terminosAceptados` se actualiza después de aceptar

---

## 🔴 Problema: El Servidor No Inicia

### Síntoma
- Error al ejecutar `npm run dev`
- Mensajes de error en la terminal

### Soluciones

#### 1. Verificar Node.js
```bash
node --version
# Debe ser 18 o superior
```

#### 2. Reinstalar Dependencias
```bash
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

#### 3. Verificar Puerto 5173
Si el puerto está ocupado:
```bash
# En Windows PowerShell
netstat -ano | findstr :5173
# Matar el proceso si es necesario
```

O cambiar el puerto en `vite.config.js`:
```js
export default {
  server: {
    port: 5174
  }
}
```

---

## 📋 Checklist de Diagnóstico Rápido

Cuando algo no funciona, revisa en este orden:

- [ ] ¿El servidor está corriendo? (ver terminal)
- [ ] ¿La URL es correcta? (`/auth/register` no `/dashboard/auth/register`)
- [ ] ¿Hay errores en la consola? (F12 → Console)
- [ ] ¿Las variables de entorno están configuradas? (`frontend/.env`)
- [ ] ¿Reiniciaste el servidor después de cambiar `.env`?
- [ ] ¿Hay términos en la base de datos?
- [ ] ¿El bucket `firmas` existe en Supabase Storage?
- [ ] ¿La sesión está activa? (verificar en Application → Local Storage)

---

## 🆘 Si Nada Funciona

1. **Limpiar todo y empezar de nuevo**:
   ```bash
   cd frontend
   rm -rf node_modules
   rm package-lock.json
   npm install
   npm run dev
   ```

2. **Verificar logs completos**:
   - Consola del navegador (F12)
   - Terminal donde corre el servidor
   - Supabase Dashboard → Logs

3. **Probar en modo incógnito**:
   - Abrir navegador en modo incógnito
   - Ir a `http://localhost:5173/auth/register`

---

**Última actualización**: 2025-01-26
