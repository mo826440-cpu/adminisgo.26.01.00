-- ============================================
-- Migración: Sistema de Pagos para Compras
-- ============================================
-- Esta migración agrega:
-- 1. Campos monto_pagado y monto_deuda a la tabla compras
-- 2. Tabla compra_pagos para múltiples métodos de pago por compra
-- ============================================

-- ============================================
-- 1. Agregar campos monto_pagado y monto_deuda a compras
-- ============================================
ALTER TABLE compras
ADD COLUMN IF NOT EXISTS monto_pagado DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_deuda DECIMAL(10,2) DEFAULT 0;

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_compras_monto_pagado ON compras(comercio_id, monto_pagado);
CREATE INDEX IF NOT EXISTS idx_compras_monto_deuda ON compras(comercio_id, monto_deuda);

-- ============================================
-- 2. Crear tabla compra_pagos para múltiples métodos de pago
-- ============================================
CREATE TABLE IF NOT EXISTS compra_pagos (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    metodo_pago VARCHAR(50) NOT NULL,
    monto_pagado DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para compra_pagos
CREATE INDEX IF NOT EXISTS idx_compra_pagos_compra_id ON compra_pagos(compra_id);
CREATE INDEX IF NOT EXISTS idx_compra_pagos_fecha ON compra_pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_compra_pagos_metodo ON compra_pagos(metodo_pago);

-- ============================================
-- 3. Función para actualizar monto_pagado y monto_deuda en compras
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_montos_compra()
RETURNS TRIGGER AS $$
DECLARE
    v_total DECIMAL(10,2);
    v_pagado DECIMAL(10,2);
BEGIN
    -- Obtener el total de la compra
    SELECT total INTO v_total
    FROM compras
    WHERE id = COALESCE(NEW.compra_id, OLD.compra_id);

    -- Calcular el monto pagado (suma de todos los pagos de esta compra)
    SELECT COALESCE(SUM(monto_pagado), 0) INTO v_pagado
    FROM compra_pagos
    WHERE compra_id = COALESCE(NEW.compra_id, OLD.compra_id);

    -- Actualizar monto_pagado y monto_deuda en la tabla compras
    UPDATE compras
    SET 
        monto_pagado = v_pagado,
        monto_deuda = GREATEST(0, v_total - v_pagado),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.compra_id, OLD.compra_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar montos cuando se inserta, actualiza o elimina un pago
DROP TRIGGER IF EXISTS trigger_actualizar_montos_compra_insert ON compra_pagos;
CREATE TRIGGER trigger_actualizar_montos_compra_insert
    AFTER INSERT ON compra_pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_montos_compra();

DROP TRIGGER IF EXISTS trigger_actualizar_montos_compra_update ON compra_pagos;
CREATE TRIGGER trigger_actualizar_montos_compra_update
    AFTER UPDATE ON compra_pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_montos_compra();

DROP TRIGGER IF EXISTS trigger_actualizar_montos_compra_delete ON compra_pagos;
CREATE TRIGGER trigger_actualizar_montos_compra_delete
    AFTER DELETE ON compra_pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_montos_compra();

-- ============================================
-- 4. Función trigger para updated_at en compra_pagos
-- ============================================
CREATE OR REPLACE FUNCTION update_compra_pagos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_compra_pagos_updated_at ON compra_pagos;
CREATE TRIGGER trigger_update_compra_pagos_updated_at
    BEFORE UPDATE ON compra_pagos
    FOR EACH ROW
    EXECUTE FUNCTION update_compra_pagos_updated_at();

-- ============================================
-- 5. Habilitar RLS en compra_pagos
-- ============================================
ALTER TABLE compra_pagos ENABLE ROW LEVEL SECURITY;

-- Policy para compra_pagos (basado en la compra padre que tiene comercio_id)
CREATE POLICY "Users can manage compra_pagos from their comercio"
ON compra_pagos FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM compras 
        WHERE compras.id = compra_pagos.compra_id 
        AND compras.comercio_id = get_user_comercio_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM compras 
        WHERE compras.id = compra_pagos.compra_id 
        AND compras.comercio_id = get_user_comercio_id()
    )
);

-- ============================================
-- COMENTARIOS Y NOTAS:
-- ============================================
-- 1. La tabla compra_pagos permite múltiples métodos de pago por compra
-- 2. Los campos monto_pagado y monto_deuda se actualizan automáticamente mediante triggers
-- 3. Los triggers aseguran que monto_pagado + monto_deuda = total (aproximadamente)
-- 4. RLS está habilitado para compra_pagos basado en el comercio_id de la compra padre

