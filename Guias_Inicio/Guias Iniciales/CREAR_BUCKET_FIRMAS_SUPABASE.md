# Crear Bucket "firmas" en Supabase Storage

## ⚠️ Problema Actual

El bucket `firmas` no existe en Supabase Storage, por lo que las firmas no se pueden subir. El sistema ahora funciona guardando el data URL directamente, pero es mejor crear el bucket.

## ✅ Solución: Crear el Bucket

### Pasos:

1. **Ir a Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Ir a Storage**
   - En el menú lateral, haz clic en **"Storage"**

3. **Crear Nuevo Bucket**
   - Haz clic en el botón **"New bucket"** o **"Crear bucket"**
   - Nombre del bucket: `firmas` (exactamente así, en minúsculas)
   - **IMPORTANTE**: Marca la opción **"Public bucket"** (Bucket público)
   - Haz clic en **"Create bucket"**

4. **Configurar Políticas de Acceso (Opcional pero Recomendado)**
   - Haz clic en el bucket `firmas`
   - Ve a la pestaña **"Policies"**
   - Crea políticas para:
     - **Lectura pública**: Permite que cualquiera lea las firmas
     - **Escritura autenticada**: Solo usuarios autenticados pueden subir firmas

### Políticas RLS Recomendadas:

```sql
-- Política para lectura pública
CREATE POLICY "Permitir lectura pública de firmas"
ON storage.objects FOR SELECT
USING (bucket_id = 'firmas');

-- Política para escritura autenticada
CREATE POLICY "Permitir escritura de firmas a usuarios autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'firmas' 
  AND auth.role() = 'authenticated'
);
```

## ✅ Después de Crear el Bucket

Una vez creado el bucket, el sistema funcionará automáticamente:
- Las firmas se subirán a Supabase Storage
- Se guardará la URL pública en la base de datos
- El flujo funcionará sin errores

## 🔄 Si No Quieres Crear el Bucket Ahora

El sistema ya está configurado para funcionar sin el bucket:
- Guarda el data URL directamente en la base de datos
- El registro se completa exitosamente
- La única desventaja es que los data URLs son más largos

---

**Nota**: Es recomendable crear el bucket para un mejor rendimiento y organización.
