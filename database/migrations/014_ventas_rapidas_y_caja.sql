-- ============================================
-- Migración: Ventas Rápidas y Gestión de Caja
-- ============================================
-- Esta migración crea:
-- 1. Tabla historial_cajas para aperturas y cierres de caja
-- 2. Tabla ventas_rapidas para registro de ventas rápidas
-- 3. Triggers y RLS necesarios
-- ============================================

-- ============================================
-- 1. Crear tabla historial_cajas
-- ============================================
CREATE TABLE IF NOT EXISTS historial_cajas (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    tipo_operacion VARCHAR(20) NOT NULL CHECK (tipo_operacion IN ('apertura', 'cierre')),
    importe DECIMAL(10,2) NOT NULL DEFAULT 0,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para historial_cajas
CREATE INDEX IF NOT EXISTS idx_historial_cajas_comercio_id ON historial_cajas(comercio_id);
CREATE INDEX IF NOT EXISTS idx_historial_cajas_usuario_id ON historial_cajas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_cajas_fecha ON historial_cajas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_historial_cajas_tipo ON historial_cajas(tipo_operacion);
CREATE INDEX IF NOT EXISTS idx_historial_cajas_comercio_fecha ON historial_cajas(comercio_id, fecha_hora);

-- ============================================
-- 2. Crear tabla ventas_rapidas
-- ============================================
CREATE TABLE IF NOT EXISTS ventas_rapidas (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    cliente_id INTEGER REFERENCES clientes(id),
    venta_id INTEGER REFERENCES ventas(id) ON DELETE SET NULL, -- Referencia a la venta en tabla ventas
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo',
    monto_pagado DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PAGADO' CHECK (estado IN ('PAGADO', 'DEBE')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para ventas_rapidas
CREATE INDEX IF NOT EXISTS idx_ventas_rapidas_comercio_id ON ventas_rapidas(comercio_id);
CREATE INDEX IF NOT EXISTS idx_ventas_rapidas_usuario_id ON ventas_rapidas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_rapidas_cliente_id ON ventas_rapidas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_rapidas_venta_id ON ventas_rapidas(venta_id);
CREATE INDEX IF NOT EXISTS idx_ventas_rapidas_fecha ON ventas_rapidas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_ventas_rapidas_estado ON ventas_rapidas(estado);

-- ============================================
-- 3. Triggers para auto-asignar comercio_id
-- ============================================

-- Función trigger para historial_cajas
CREATE OR REPLACE FUNCTION set_historial_cajas_comercio_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.comercio_id IS NULL THEN
    NEW.comercio_id := get_user_comercio_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger BEFORE INSERT para historial_cajas
DROP TRIGGER IF EXISTS trigger_set_historial_cajas_comercio_id ON historial_cajas;
CREATE TRIGGER trigger_set_historial_cajas_comercio_id
  BEFORE INSERT ON historial_cajas
  FOR EACH ROW
  EXECUTE FUNCTION set_historial_cajas_comercio_id();

-- Función trigger para ventas_rapidas
CREATE OR REPLACE FUNCTION set_ventas_rapidas_comercio_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.comercio_id IS NULL THEN
    NEW.comercio_id := get_user_comercio_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger BEFORE INSERT para ventas_rapidas
DROP TRIGGER IF EXISTS trigger_set_ventas_rapidas_comercio_id ON ventas_rapidas;
CREATE TRIGGER trigger_set_ventas_rapidas_comercio_id
  BEFORE INSERT ON ventas_rapidas
  FOR EACH ROW
  EXECUTE FUNCTION set_ventas_rapidas_comercio_id();

-- ============================================
-- 4. Triggers para updated_at
-- ============================================

-- Trigger updated_at para historial_cajas
DROP TRIGGER IF EXISTS trigger_update_historial_cajas_updated_at ON historial_cajas;
CREATE TRIGGER trigger_update_historial_cajas_updated_at
  BEFORE UPDATE ON historial_cajas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger updated_at para ventas_rapidas
DROP TRIGGER IF EXISTS trigger_update_ventas_rapidas_updated_at ON ventas_rapidas;
CREATE TRIGGER trigger_update_ventas_rapidas_updated_at
  BEFORE UPDATE ON ventas_rapidas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Habilitar RLS
-- ============================================

-- RLS para historial_cajas
ALTER TABLE historial_cajas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage historial_cajas from their comercio"
  ON historial_cajas FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- RLS para ventas_rapidas
ALTER TABLE ventas_rapidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ventas_rapidas from their comercio"
  ON ventas_rapidas FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ============================================
-- COMENTARIOS Y NOTAS:
-- ============================================
-- 1. historial_cajas registra aperturas y cierres de caja
-- 2. ventas_rapidas almacena las ventas rápidas y tiene referencia a ventas
-- 3. Cuando se crea una venta rápida, también se debe crear en la tabla ventas
-- 4. Los triggers aseguran que comercio_id se asigne automáticamente
-- 5. RLS está habilitado para ambas tablas basado en comercio_id

