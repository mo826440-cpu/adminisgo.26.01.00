-- ============================================
-- Configuración de Storage Buckets
-- Adminis Go - Sistema de Gestión de Comercios
-- ============================================

-- NOTA: Este script debe ejecutarse en el SQL Editor de Supabase
-- Los Storage buckets también se pueden crear desde la UI de Supabase (Storage > Buckets)

-- ============================================
-- BUCKET: productos
-- Para imágenes de productos
-- ============================================

-- Crear bucket (si no existe)
-- NOTA: Los buckets se crean desde la UI o con la API de Supabase Storage
-- Este script solo documenta la estructura recomendada

-- Políticas de Storage para el bucket 'productos':
-- (Estas políticas se crean desde la UI: Storage > Buckets > productos > Policies)

-- Policy: "Users can upload images to productos bucket"
-- INSERT policy: 
--   USING: bucket_id = 'productos' AND auth.role() = 'authenticated'
--   WITH CHECK: bucket_id = 'productos' AND (storage.foldername(name))[1] = (SELECT comercio_id::text FROM usuarios WHERE id = auth.uid())

-- Policy: "Users can view images from their comercio"
-- SELECT policy:
--   USING: bucket_id = 'productos' AND (storage.foldername(name))[1] = (SELECT comercio_id::text FROM usuarios WHERE id = auth.uid())

-- Policy: "Users can update/delete their own images"
-- UPDATE/DELETE policy:
--   USING: bucket_id = 'productos' AND (storage.foldername(name))[1] = (SELECT comercio_id::text FROM usuarios WHERE id = auth.uid())

-- ============================================
-- BUCKET: logos
-- Para logos de comercios
-- ============================================

-- Policy: "Users can manage logos from their comercio"
-- ALL operations:
--   USING: bucket_id = 'logos' AND (storage.foldername(name))[1] = (SELECT comercio_id::text FROM usuarios WHERE id = auth.uid())

-- ============================================
-- BUCKET: perfiles
-- Para fotos de perfil de usuarios
-- ============================================

-- Policy: "Users can upload their own profile picture"
-- INSERT/UPDATE:
--   WITH CHECK: bucket_id = 'perfiles' AND (storage.foldername(name))[1] = auth.uid()::text

-- Policy: "Users can view profiles from their comercio"
-- SELECT:
--   USING: bucket_id = 'perfiles' AND EXISTS (
--     SELECT 1 FROM usuarios 
--     WHERE id::text = (storage.foldername(name))[1] 
--     AND comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
--   )

-- ============================================
-- BUCKET: documentos
-- Para documentos varios (facturas, remitos, etc.)
-- ============================================

-- Policy: "Users can manage documents from their comercio"
-- ALL operations:
--   USING: bucket_id = 'documentos' AND (storage.foldername(name))[1] = (SELECT comercio_id::text FROM usuarios WHERE id = auth.uid())

-- ============================================
-- INSTRUCCIONES PARA CREAR LOS BUCKETS DESDE LA UI
-- ============================================

/*
PASO 1: Crear los buckets desde la UI
1. Ve a Storage > Buckets en Supabase
2. Haz clic en "New bucket"
3. Crea los siguientes buckets:
   - Nombre: "productos"
     - Public: NO (privado)
     - File size limit: 5MB (recomendado)
     - Allowed MIME types: image/jpeg, image/png, image/webp
   
   - Nombre: "logos"
     - Public: NO (privado)
     - File size limit: 2MB (recomendado)
     - Allowed MIME types: image/jpeg, image/png, image/svg+xml
   
   - Nombre: "perfiles"
     - Public: NO (privado)
     - File size limit: 2MB (recomendado)
     - Allowed MIME types: image/jpeg, image/png
   
   - Nombre: "documentos"
     - Public: NO (privado)
     - File size limit: 10MB (recomendado)
     - Allowed MIME types: application/pdf, image/jpeg, image/png

PASO 2: Crear las políticas RLS desde la UI
1. Para cada bucket, ve a "Policies"
2. Haz clic en "New policy"
3. Crea políticas usando las definiciones arriba

O usa el SQL Editor con el siguiente formato para cada bucket:

-- Ejemplo para bucket 'productos':
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'productos',
  'productos',
  false,
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Repetir para los otros buckets cambiando los valores apropiados
*/

