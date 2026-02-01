-- ============================================
-- Agregar columna direccion a usuarios
-- Adminis Go - Módulo de Usuarios
-- ============================================
-- Dirección (donde vive) del usuario, usada al crear usuarios desde el admin

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS direccion TEXT;

COMMENT ON COLUMN usuarios.direccion IS 'Dirección donde vive el usuario';
