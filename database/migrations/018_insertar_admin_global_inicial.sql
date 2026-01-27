-- ============================================
-- Insertar Admin Global Inicial
-- Adminis Go - Configuración inicial
-- ============================================
-- 
-- Este script inserta el usuario mo826440@gmail.com como admin global
-- IMPORTANTE: Ejecutar después de la migración 017

-- Insertar admin global inicial
INSERT INTO admins_globales (usuario_id, email, nombre, activo)
VALUES (
    'c4768677-35f5-4aa8-bcbe-9d2f8314e674'::UUID,  -- UID de mo826440@gmail.com
    'mo826440@gmail.com',
    'Administrador Principal',
    TRUE
)
ON CONFLICT (usuario_id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre,
    activo = TRUE,
    fecha_actualizacion = NOW();

-- Verificar que se insertó correctamente
SELECT 
    id,
    usuario_id,
    email,
    nombre,
    activo,
    fecha_creacion
FROM admins_globales
WHERE email = 'mo826440@gmail.com';

-- Probar la función es_admin_global
SELECT es_admin_global('c4768677-35f5-4aa8-bcbe-9d2f8314e674'::UUID) AS es_admin;

