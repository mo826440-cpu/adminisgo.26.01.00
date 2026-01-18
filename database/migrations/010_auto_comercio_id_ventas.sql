-- ============================================
-- Trigger para asignar automáticamente comercio_id a ventas
-- ============================================

-- Función trigger para ventas
CREATE OR REPLACE FUNCTION set_venta_comercio_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se proporciona comercio_id, asignarlo automáticamente
  IF NEW.comercio_id IS NULL THEN
    NEW.comercio_id := get_user_comercio_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger BEFORE INSERT para ventas
DROP TRIGGER IF EXISTS trigger_set_venta_comercio_id ON ventas;
CREATE TRIGGER trigger_set_venta_comercio_id
  BEFORE INSERT ON ventas
  FOR EACH ROW
  EXECUTE FUNCTION set_venta_comercio_id();

-- ============================================
-- COMENTARIOS:
-- ============================================
-- 1. Este trigger asigna automáticamente el comercio_id basado en el usuario autenticado
-- 2. Si el comercio_id ya está presente en el INSERT, no lo modifica
-- 3. Usa SECURITY DEFINER para poder acceder a get_user_comercio_id()
-- 4. Esto permite que el frontend NO tenga que pasar comercio_id, manteniendo la seguridad
-- 5. Las políticas RLS seguirán validando que el comercio_id coincida con el del usuario

