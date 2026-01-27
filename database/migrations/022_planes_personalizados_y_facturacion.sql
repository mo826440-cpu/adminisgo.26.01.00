-- ============================================
-- Planes Personalizados y Facturación
-- Adminis Go - Sistema de Planes Personalizados y Facturación Electrónica
-- ============================================
-- 
-- Esta migración crea:
-- 1. Tabla planes_personalizados: Configuración flexible de planes personalizados
-- 2. Campos de facturación en suscripciones: Para facturación electrónica (AFIP)

-- ============================================
-- 1. TABLA: planes_personalizados
-- ============================================
-- Almacena la configuración de planes personalizados para cada comercio
-- Permite límites y características completamente personalizadas

CREATE TABLE IF NOT EXISTS planes_personalizados (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL UNIQUE REFERENCES comercios(id) ON DELETE CASCADE,
    solicitud_id INTEGER REFERENCES solicitudes_personalizadas(id) ON DELETE SET NULL,
    nombre_plan VARCHAR(255) NOT NULL, -- Ej: 'Plan Supermercado X', 'Plan Farmacia Y'
    precio_mensual DECIMAL(10,2),
    precio_anual DECIMAL(10,2),
    limite_ventas_mensuales INTEGER, -- NULL = ilimitado
    limite_usuarios_adicionales INTEGER, -- NULL = ilimitado
    precio_usuario_adicional DECIMAL(10,2),
    limite_productos INTEGER, -- NULL = ilimitado
    limite_almacenes INTEGER, -- NULL = ilimitado
    caracteristicas_especiales JSONB, -- Para guardar cualquier configuración adicional
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_inicio TIMESTAMP WITH TIME ZONE, -- Cuándo comenzó el plan
    fecha_fin TIMESTAMP WITH TIME ZONE, -- Cuándo termina (si aplica)
    
    -- Constraint: Al menos precio_mensual o precio_anual debe estar definido
    CONSTRAINT chk_precio_definido CHECK (
        precio_mensual IS NOT NULL OR precio_anual IS NOT NULL
    )
);

-- Índices para planes_personalizados
CREATE INDEX IF NOT EXISTS idx_planes_personalizados_comercio_id ON planes_personalizados(comercio_id);
CREATE INDEX IF NOT EXISTS idx_planes_personalizados_solicitud_id ON planes_personalizados(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_planes_personalizados_activo ON planes_personalizados(activo);

-- ============================================
-- 2. ACTUALIZAR: suscripciones
-- ============================================
-- Agregar campos para facturación electrónica (AFIP - Argentina)

DO $$
BEGIN
    -- Agregar campos de facturación si no existen
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suscripciones' 
        AND column_name = 'numero_factura'
    ) THEN
        ALTER TABLE suscripciones 
        ADD COLUMN numero_factura VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suscripciones' 
        AND column_name = 'cae'
    ) THEN
        ALTER TABLE suscripciones 
        ADD COLUMN cae VARCHAR(50); -- Código de Autorización Electrónico (AFIP)
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suscripciones' 
        AND column_name = 'fecha_emision_factura'
    ) THEN
        ALTER TABLE suscripciones 
        ADD COLUMN fecha_emision_factura TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suscripciones' 
        AND column_name = 'tipo_factura'
    ) THEN
        ALTER TABLE suscripciones 
        ADD COLUMN tipo_factura VARCHAR(1) DEFAULT 'B'; -- A, B, o C
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suscripciones' 
        AND column_name = 'factura_pdf_url'
    ) THEN
        ALTER TABLE suscripciones 
        ADD COLUMN factura_pdf_url TEXT; -- URL del PDF de la factura en Storage
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suscripciones' 
        AND column_name = 'datos_fiscales_cliente'
    ) THEN
        ALTER TABLE suscripciones 
        ADD COLUMN datos_fiscales_cliente JSONB; -- CUIT, razón social, condición fiscal, etc.
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suscripciones' 
        AND column_name = 'stripe_invoice_id'
    ) THEN
        ALTER TABLE suscripciones 
        ADD COLUMN stripe_invoice_id VARCHAR(255); -- ID de la factura en Stripe
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suscripciones' 
        AND column_name = 'plan_personalizado_id'
    ) THEN
        ALTER TABLE suscripciones 
        ADD COLUMN plan_personalizado_id INTEGER REFERENCES planes_personalizados(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Índices para campos de facturación
CREATE INDEX IF NOT EXISTS idx_suscripciones_numero_factura ON suscripciones(numero_factura) WHERE numero_factura IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_suscripciones_cae ON suscripciones(cae) WHERE cae IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_suscripciones_tipo_factura ON suscripciones(tipo_factura);
CREATE INDEX IF NOT EXISTS idx_suscripciones_plan_personalizado_id ON suscripciones(plan_personalizado_id) WHERE plan_personalizado_id IS NOT NULL;

-- ============================================
-- 3. FUNCIONES RPC
-- ============================================

-- Función: Obtener plan personalizado de un comercio
CREATE OR REPLACE FUNCTION obtener_plan_personalizado(p_comercio_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    id INTEGER,
    nombre_plan VARCHAR(255),
    precio_mensual DECIMAL(10,2),
    precio_anual DECIMAL(10,2),
    limite_ventas_mensuales INTEGER,
    limite_usuarios_adicionales INTEGER,
    precio_usuario_adicional DECIMAL(10,2),
    caracteristicas_especiales JSONB,
    activo BOOLEAN,
    fecha_inicio TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.nombre_plan,
        pp.precio_mensual,
        pp.precio_anual,
        pp.limite_ventas_mensuales,
        pp.limite_usuarios_adicionales,
        pp.precio_usuario_adicional,
        pp.caracteristicas_especiales,
        pp.activo,
        pp.fecha_inicio
    FROM planes_personalizados pp
    WHERE (p_comercio_id IS NULL OR pp.comercio_id = p_comercio_id)
    AND pp.comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
    AND pp.activo = TRUE
    ORDER BY pp.fecha_creacion DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener todas las facturas de un comercio
CREATE OR REPLACE FUNCTION obtener_facturas_comercio(p_comercio_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    id INTEGER,
    numero_factura VARCHAR(50),
    cae VARCHAR(50),
    fecha_emision TIMESTAMP WITH TIME ZONE,
    tipo_factura VARCHAR(1),
    monto DECIMAL(10,2),
    factura_pdf_url TEXT,
    plan_nombre VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.numero_factura,
        s.cae,
        s.fecha_emision_factura,
        s.tipo_factura,
        COALESCE(pp.precio_mensual, pp.precio_anual, p.precio_mensual, p.precio_anual) AS monto,
        s.factura_pdf_url,
        COALESCE(pp.nombre_plan, p.nombre) AS plan_nombre
    FROM suscripciones s
    LEFT JOIN planes_personalizados pp ON s.plan_personalizado_id = pp.id
    LEFT JOIN planes p ON s.plan_id = p.id
    WHERE (p_comercio_id IS NULL OR s.comercio_id = p_comercio_id)
    AND s.comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
    AND s.numero_factura IS NOT NULL
    ORDER BY s.fecha_emision_factura DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Actualizar datos de facturación en suscripción
CREATE OR REPLACE FUNCTION actualizar_facturacion_suscripcion(
    p_suscripcion_id INTEGER,
    p_numero_factura VARCHAR(50),
    p_cae VARCHAR(50),
    p_fecha_emision TIMESTAMP WITH TIME ZONE,
    p_tipo_factura VARCHAR(1),
    p_factura_pdf_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suscripciones
    SET 
        numero_factura = p_numero_factura,
        cae = p_cae,
        fecha_emision_factura = p_fecha_emision,
        tipo_factura = p_tipo_factura,
        factura_pdf_url = COALESCE(p_factura_pdf_url, factura_pdf_url),
        updated_at = NOW()
    WHERE id = p_suscripcion_id
    AND comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid());
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en planes_personalizados
ALTER TABLE planes_personalizados ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su plan personalizado
CREATE POLICY "Users can view their plan_personalizado"
    ON planes_personalizados FOR SELECT
    USING (
        comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
    );

-- Política: Los admins globales pueden ver todos los planes personalizados
CREATE POLICY "Admins can view all planes_personalizados"
    ON planes_personalizados FOR SELECT
    USING (es_admin_global());

-- Política: Solo admins globales pueden gestionar planes personalizados
CREATE POLICY "Admins can manage planes_personalizados"
    ON planes_personalizados FOR ALL
    USING (es_admin_global())
    WITH CHECK (es_admin_global());

-- Nota: Los campos de facturación en suscripciones ya tienen RLS
-- (la tabla suscripciones ya tiene políticas RLS configuradas)

-- ============================================
-- 5. COMENTARIOS Y NOTAS
-- ============================================

-- IMPORTANTE:
-- 1. La tabla planes_personalizados permite configuración completamente flexible
--    Cada comercio puede tener límites y precios personalizados
--
-- 2. Para crear un plan personalizado:
--    INSERT INTO planes_personalizados (
--        comercio_id,
--        solicitud_id,
--        nombre_plan,
--        precio_mensual,
--        limite_ventas_mensuales,
--        limite_usuarios_adicionales,
--        caracteristicas_especiales
--    ) VALUES (
--        123,
--        456,
--        'Plan Supermercado X',
--        150.00,
--        NULL, -- Ilimitado
--        50, -- 50 usuarios adicionales
--        '{"soporte_prioritario": true, "backup_diario": true}'::jsonb
--    );
--
-- 3. Los campos de facturación en suscripciones se llenan cuando:
--    - Se genera una factura electrónica (AFIP)
--    - Se procesa un pago desde Stripe
--    - Se emite una factura manual
--
-- 4. El campo datos_fiscales_cliente puede almacenar:
--    {
--        "cuit": "20-12345678-9",
--        "razon_social": "Comercio S.A.",
--        "condicion_fiscal": "Responsable Inscripto",
--        "direccion_fiscal": "...",
--        "email_facturacion": "..."
--    }
--
-- 5. Para generar facturación electrónica, necesitarás integrar con:
--    - AFIP directamente (complejo)
--    - Servicios de terceros (FacturadorOnline, Nubefact, etc.)
--
-- 6. El campo factura_pdf_url debe apuntar a un archivo en Supabase Storage
--    (bucket 'facturas' o similar)

