-- ============================================
-- Migración: Agregar facturación y soporte para múltiples métodos de pago
-- ============================================
-- Esta migración agrega:
-- 1. Campo facturacion a la tabla ventas (único por comercio)
-- 2. Tabla venta_pagos para múltiples métodos de pago por venta
-- 3. Campos monto_pagado y monto_deuda a la tabla ventas
-- ============================================

-- ============================================
-- 1. Agregar campo facturacion a ventas
-- ============================================
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS facturacion VARCHAR(100);

-- Crear índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_ventas_facturacion ON ventas(comercio_id, facturacion);

-- Crear constraint UNIQUE para facturacion por comercio
-- (permite NULL, pero si tiene valor debe ser único por comercio)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_comercio_facturacion_unique 
ON ventas(comercio_id, facturacion) 
WHERE facturacion IS NOT NULL AND facturacion != '';

-- ============================================
-- 2. Agregar campos monto_pagado y monto_deuda a ventas
-- ============================================
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS monto_pagado DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_deuda DECIMAL(10,2) DEFAULT 0;

-- Actualizar valores existentes (si hay ventas anteriores)
-- Por defecto, si ya existe metodo_pago, asumimos que está pagada
UPDATE ventas
SET monto_pagado = total,
    monto_deuda = 0
WHERE monto_pagado IS NULL OR monto_pagado = 0;

UPDATE ventas
SET monto_deuda = GREATEST(0, total - COALESCE(monto_pagado, 0))
WHERE monto_deuda IS NULL;

-- ============================================
-- 3. Crear tabla venta_pagos para múltiples métodos de pago
-- ============================================
CREATE TABLE IF NOT EXISTS venta_pagos (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    metodo_pago VARCHAR(50) NOT NULL,
    monto_pagado DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para venta_pagos
CREATE INDEX IF NOT EXISTS idx_venta_pagos_venta_id ON venta_pagos(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_pagos_fecha ON venta_pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_venta_pagos_metodo ON venta_pagos(metodo_pago);

-- ============================================
-- 4. Función para actualizar monto_pagado y monto_deuda en ventas
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_montos_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_total DECIMAL(10,2);
    v_pagado DECIMAL(10,2);
BEGIN
    -- Obtener el total de la venta
    SELECT total INTO v_total
    FROM ventas
    WHERE id = COALESCE(NEW.venta_id, OLD.venta_id);

    -- Calcular el monto pagado (suma de todos los pagos de esta venta)
    SELECT COALESCE(SUM(monto_pagado), 0) INTO v_pagado
    FROM venta_pagos
    WHERE venta_id = COALESCE(NEW.venta_id, OLD.venta_id);

    -- Actualizar monto_pagado y monto_deuda en la tabla ventas
    UPDATE ventas
    SET 
        monto_pagado = v_pagado,
        monto_deuda = GREATEST(0, v_total - v_pagado),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.venta_id, OLD.venta_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar montos cuando se inserta, actualiza o elimina un pago
DROP TRIGGER IF EXISTS trigger_actualizar_montos_venta_insert ON venta_pagos;
CREATE TRIGGER trigger_actualizar_montos_venta_insert
    AFTER INSERT ON venta_pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_montos_venta();

DROP TRIGGER IF EXISTS trigger_actualizar_montos_venta_update ON venta_pagos;
CREATE TRIGGER trigger_actualizar_montos_venta_update
    AFTER UPDATE ON venta_pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_montos_venta();

DROP TRIGGER IF EXISTS trigger_actualizar_montos_venta_delete ON venta_pagos;
CREATE TRIGGER trigger_actualizar_montos_venta_delete
    AFTER DELETE ON venta_pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_montos_venta();

-- ============================================
-- 5. Función trigger para updated_at en venta_pagos
-- ============================================
CREATE OR REPLACE FUNCTION update_venta_pagos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_venta_pagos_updated_at ON venta_pagos;
CREATE TRIGGER trigger_update_venta_pagos_updated_at
    BEFORE UPDATE ON venta_pagos
    FOR EACH ROW
    EXECUTE FUNCTION update_venta_pagos_updated_at();

-- ============================================
-- 6. Habilitar RLS en venta_pagos
-- ============================================
ALTER TABLE venta_pagos ENABLE ROW LEVEL SECURITY;

-- Policy para venta_pagos (basado en la venta padre que tiene comercio_id)
CREATE POLICY "Users can manage venta_pagos from their comercio"
ON venta_pagos FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM ventas 
        WHERE ventas.id = venta_pagos.venta_id 
        AND ventas.comercio_id = get_user_comercio_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM ventas 
        WHERE ventas.id = venta_pagos.venta_id 
        AND ventas.comercio_id = get_user_comercio_id()
    )
);

-- ============================================
-- COMENTARIOS Y NOTAS:
-- ============================================
-- 1. El campo facturacion es opcional (puede ser NULL) pero si tiene valor, debe ser único por comercio
-- 2. La tabla venta_pagos permite múltiples métodos de pago por venta
-- 3. Los campos monto_pagado y monto_deuda se actualizan automáticamente mediante triggers
-- 4. Se mantiene compatibilidad con ventas existentes que usan metodo_pago (se asume pagada completa)
-- 5. Los triggers aseguran que monto_pagado + monto_deuda = total (aproximadamente)
-- 6. RLS está habilitado para venta_pagos basado en el comercio_id de la venta padre

