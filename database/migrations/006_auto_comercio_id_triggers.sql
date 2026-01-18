-- ============================================
-- Triggers para asignar automáticamente comercio_id
-- Estas funciones y triggers evitan tener que pasar comercio_id desde el frontend
-- ============================================

-- Función para obtener el comercio_id del usuario actual
-- (reutilizamos la función existente get_user_comercio_id)

-- Función trigger para productos
CREATE OR REPLACE FUNCTION set_producto_comercio_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se proporciona comercio_id, asignarlo automáticamente
  IF NEW.comercio_id IS NULL THEN
    NEW.comercio_id := get_user_comercio_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger BEFORE INSERT para productos
DROP TRIGGER IF EXISTS trigger_set_producto_comercio_id ON productos;
CREATE TRIGGER trigger_set_producto_comercio_id
  BEFORE INSERT ON productos
  FOR EACH ROW
  EXECUTE FUNCTION set_producto_comercio_id();

-- Función trigger para clientes
CREATE OR REPLACE FUNCTION set_cliente_comercio_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se proporciona comercio_id, asignarlo automáticamente
  IF NEW.comercio_id IS NULL THEN
    NEW.comercio_id := get_user_comercio_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger BEFORE INSERT para clientes
DROP TRIGGER IF EXISTS trigger_set_cliente_comercio_id ON clientes;
CREATE TRIGGER trigger_set_cliente_comercio_id
  BEFORE INSERT ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION set_cliente_comercio_id();

-- ============================================
-- COMENTARIOS:
-- ============================================
-- 1. Estos triggers asignan automáticamente el comercio_id basado en el usuario autenticado
-- 2. Si el comercio_id ya está presente en el INSERT, no lo modifica
-- 3. Usa SECURITY DEFINER para poder acceder a get_user_comercio_id()
-- 4. Esto permite que el frontend NO tenga que pasar comercio_id, manteniendo la seguridad
-- 5. Las políticas RLS seguirán validando que el comercio_id coincida con el del usuario

