-- ============================================
-- Agregar restricción única para codigo_interno
-- ============================================

-- Agregar restricción única para codigo_interno por comercio
-- Esto evita que dos productos del mismo comercio tengan el mismo código interno
ALTER TABLE productos
ADD CONSTRAINT productos_comercio_id_codigo_interno_key 
UNIQUE (comercio_id, codigo_interno);

-- ============================================
-- NOTA:
-- ============================================
-- Esta restricción permite que el mismo código interno exista en diferentes comercios,
-- pero no permite duplicados dentro del mismo comercio.
-- Si codigo_interno es NULL, PostgreSQL permite múltiples NULLs (comportamiento estándar).

