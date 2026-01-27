-- ============================================
-- Sistema de Planes y Suscripciones
-- Adminis Go - Actualización de planes y límites
-- ============================================

-- 1. Agregar nuevos campos a la tabla planes
ALTER TABLE planes 
ADD COLUMN IF NOT EXISTS limite_ventas_mensuales INTEGER,
ADD COLUMN IF NOT EXISTS periodo_gratis_meses INTEGER,
ADD COLUMN IF NOT EXISTS precio_usuario_adicional DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tipo_plan VARCHAR(20) DEFAULT 'pago';

-- 2. Crear tabla para solicitudes de plan personalizado
CREATE TABLE IF NOT EXISTS solicitudes_personalizadas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    mensaje TEXT NOT NULL,
    comercio_id INTEGER REFERENCES comercios(id) ON DELETE SET NULL,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, en_revision, contactado, cerrado
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Agregar campos a la tabla suscripciones
ALTER TABLE suscripciones
ADD COLUMN IF NOT EXISTS fecha_fin_periodo_gratis DATE,
ADD COLUMN IF NOT EXISTS usuarios_adicionales_pagados INTEGER DEFAULT 0;

-- 4. Actualizar planes existentes con los nuevos valores
UPDATE planes SET
    limite_ventas_mensuales = 400,
    periodo_gratis_meses = 3,
    precio_usuario_adicional = NULL,
    tipo_plan = 'gratis',
    limite_usuarios = 1,
    limite_productos = NULL, -- Ilimitado para productos
    precio_mensual = 0,
    precio_anual = 0
WHERE nombre = 'gratis';

UPDATE planes SET
    limite_ventas_mensuales = NULL, -- Ilimitado
    periodo_gratis_meses = NULL,
    precio_usuario_adicional = 9.99,
    tipo_plan = 'pago',
    limite_usuarios = 11, -- 1 principal + 10 adicionales
    limite_productos = NULL, -- Ilimitado
    precio_mensual = 9.99,
    precio_anual = 99.90,
    descripcion = 'Plan Pago - 1 usuario principal + 10 usuarios adicionales. Registros ilimitados.'
WHERE nombre = 'basico';

-- 5. Crear plan personalizado (si no existe, actualizar si existe)
INSERT INTO planes (
    nombre, 
    descripcion, 
    precio_mensual, 
    precio_anual, 
    limite_productos, 
    limite_usuarios, 
    limite_almacenes,
    limite_ventas_mensuales,
    periodo_gratis_meses,
    precio_usuario_adicional,
    tipo_plan
) VALUES (
    'personalizado',
    'Plan Personalizado - Para negocios grandes. Coordinar reunión.',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'personalizado'
)
ON CONFLICT (nombre) DO UPDATE SET
    tipo_plan = 'personalizado',
    descripcion = 'Plan Personalizado - Para negocios grandes. Coordinar reunión.';

-- 6. Eliminar planes que no se usan (pro, premium) o mantenerlos para futuras expansiones
-- Por ahora los dejamos, pero se pueden eliminar si no se necesitan

-- 7. Crear índices para solicitudes_personalizadas
CREATE INDEX IF NOT EXISTS idx_solicitudes_comercio_id ON solicitudes_personalizadas(comercio_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_personalizadas(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_email ON solicitudes_personalizadas(email);

-- 8. Habilitar RLS para solicitudes_personalizadas
ALTER TABLE solicitudes_personalizadas ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias solicitudes
CREATE POLICY "Users can view their own solicitudes"
    ON solicitudes_personalizadas FOR SELECT
    USING (
        comercio_id IS NULL OR 
        comercio_id IN (
            SELECT comercio_id FROM usuarios WHERE id = auth.uid()
        )
    );

-- Política: Cualquiera puede crear una solicitud (para el registro)
CREATE POLICY "Anyone can create solicitudes"
    ON solicitudes_personalizadas FOR INSERT
    WITH CHECK (true);

-- Política: Solo administradores pueden actualizar solicitudes
-- (Esto se puede ajustar según necesidades)

-- 9. Función para actualizar updated_at en solicitudes_personalizadas
CREATE OR REPLACE FUNCTION update_solicitudes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_solicitudes_updated_at
    BEFORE UPDATE ON solicitudes_personalizadas
    FOR EACH ROW
    EXECUTE FUNCTION update_solicitudes_updated_at();

-- ============================================
-- Funciones de Validación de Límites
-- ============================================

-- Función para obtener el plan activo de un comercio
CREATE OR REPLACE FUNCTION obtener_plan_activo(p_comercio_id INTEGER)
RETURNS TABLE (
    plan_id INTEGER,
    nombre_plan VARCHAR(100),
    tipo_plan VARCHAR(20),
    limite_usuarios INTEGER,
    limite_ventas_mensuales INTEGER,
    periodo_gratis_meses INTEGER,
    precio_usuario_adicional DECIMAL(10,2),
    fecha_fin_periodo_gratis DATE,
    usuarios_adicionales_pagados INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.tipo_plan,
        p.limite_usuarios,
        p.limite_ventas_mensuales,
        p.periodo_gratis_meses,
        p.precio_usuario_adicional,
        s.fecha_fin_periodo_gratis,
        s.usuarios_adicionales_pagados
    FROM comercios c
    LEFT JOIN planes p ON c.plan_id = p.id
    LEFT JOIN suscripciones s ON s.comercio_id = c.id AND s.estado = 'activa'
    WHERE c.id = p_comercio_id
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para validar si puede crear una venta
CREATE OR REPLACE FUNCTION validar_limite_ventas_mensuales(p_comercio_id INTEGER)
RETURNS JSON AS $$
DECLARE
    v_plan RECORD;
    v_ventas_mes INTEGER;
    v_puede_crear BOOLEAN := true;
    v_mensaje TEXT;
    v_fecha_fin_periodo DATE;
BEGIN
    -- Obtener plan activo
    SELECT * INTO v_plan FROM obtener_plan_activo(p_comercio_id);
    
    -- Si no tiene plan o no tiene límite, puede crear
    IF v_plan.limite_ventas_mensuales IS NULL THEN
        RETURN json_build_object(
            'puede_crear', true,
            'mensaje', NULL
        );
    END IF;
    
    -- Obtener fecha fin del período gratis
    SELECT fecha_fin_periodo_gratis INTO v_fecha_fin_periodo
    FROM suscripciones
    WHERE comercio_id = p_comercio_id AND estado = 'activa'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Si el período gratis terminó y es plan gratis, no puede crear
    IF v_plan.tipo_plan = 'gratis' AND v_fecha_fin_periodo IS NOT NULL AND v_fecha_fin_periodo < CURRENT_DATE THEN
        RETURN json_build_object(
            'puede_crear', false,
            'mensaje', 'Tu período de prueba gratuito ha finalizado. Para continuar registrando ventas, actualiza a Plan Pago.',
            'tipo_error', 'periodo_expirado'
        );
    END IF;
    
    -- Contar ventas del mes actual
    SELECT COUNT(*) INTO v_ventas_mes
    FROM ventas
    WHERE comercio_id = p_comercio_id
    AND DATE_TRUNC('month', fecha_hora) = DATE_TRUNC('month', CURRENT_DATE);
    
    -- Validar límite
    IF v_ventas_mes >= v_plan.limite_ventas_mensuales THEN
        RETURN json_build_object(
            'puede_crear', false,
            'mensaje', format('Has alcanzado el límite de %s ventas mensuales. Para continuar, actualiza a Plan Pago.', v_plan.limite_ventas_mensuales),
            'tipo_error', 'limite_ventas',
            'ventas_actuales', v_ventas_mes,
            'limite', v_plan.limite_ventas_mensuales
        );
    END IF;
    
    RETURN json_build_object(
        'puede_crear', true,
        'mensaje', NULL,
        'ventas_actuales', v_ventas_mes,
        'limite', v_plan.limite_ventas_mensuales
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para validar si puede crear un usuario
CREATE OR REPLACE FUNCTION validar_limite_usuarios(p_comercio_id INTEGER)
RETURNS JSON AS $$
DECLARE
    v_plan RECORD;
    v_usuarios_actuales INTEGER;
    v_usuarios_permitidos INTEGER;
    v_puede_crear BOOLEAN := true;
    v_mensaje TEXT;
BEGIN
    -- Obtener plan activo
    SELECT * INTO v_plan FROM obtener_plan_activo(p_comercio_id);
    
    -- Si no tiene límite, puede crear
    IF v_plan.limite_usuarios IS NULL THEN
        RETURN json_build_object(
            'puede_crear', true,
            'mensaje', NULL
        );
    END IF;
    
    -- Contar usuarios activos del comercio
    SELECT COUNT(*) INTO v_usuarios_actuales
    FROM usuarios
    WHERE comercio_id = p_comercio_id AND activo = true;
    
    -- Calcular usuarios permitidos (incluye usuarios adicionales pagados)
    v_usuarios_permitidos := v_plan.limite_usuarios + COALESCE(v_plan.usuarios_adicionales_pagados, 0);
    
    -- Validar límite
    IF v_usuarios_actuales >= v_usuarios_permitidos THEN
        IF v_plan.tipo_plan = 'pago' THEN
            RETURN json_build_object(
                'puede_crear', false,
                'mensaje', format('Has alcanzado el límite de %s usuarios. Puedes agregar más usuarios por $%.2f USD anuales cada uno.', v_usuarios_permitidos, v_plan.precio_usuario_adicional),
                'tipo_error', 'limite_usuarios',
                'usuarios_actuales', v_usuarios_actuales,
                'limite', v_usuarios_permitidos,
                'precio_usuario_adicional', v_plan.precio_usuario_adicional
            );
        ELSE
            RETURN json_build_object(
                'puede_crear', false,
                'mensaje', format('Has alcanzado el límite de %s usuario(s). Para agregar más usuarios, actualiza a Plan Pago.', v_plan.limite_usuarios),
                'tipo_error', 'limite_usuarios',
                'usuarios_actuales', v_usuarios_actuales,
                'limite', v_plan.limite_usuarios
            );
        END IF;
    END IF;
    
    RETURN json_build_object(
        'puede_crear', true,
        'mensaje', NULL,
        'usuarios_actuales', v_usuarios_actuales,
        'limite', v_usuarios_permitidos
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estado completo de suscripción
CREATE OR REPLACE FUNCTION obtener_estado_suscripcion(p_comercio_id INTEGER)
RETURNS JSON AS $$
DECLARE
    v_plan RECORD;
    v_ventas_mes INTEGER;
    v_usuarios_actuales INTEGER;
    v_dias_restantes INTEGER;
    v_resultado JSON;
BEGIN
    -- Obtener plan activo
    SELECT * INTO v_plan FROM obtener_plan_activo(p_comercio_id);
    
    -- Contar ventas del mes
    SELECT COUNT(*) INTO v_ventas_mes
    FROM ventas
    WHERE comercio_id = p_comercio_id
    AND DATE_TRUNC('month', fecha_hora) = DATE_TRUNC('month', CURRENT_DATE);
    
    -- Contar usuarios
    SELECT COUNT(*) INTO v_usuarios_actuales
    FROM usuarios
    WHERE comercio_id = p_comercio_id AND activo = true;
    
    -- Calcular días restantes del período gratis
    IF v_plan.fecha_fin_periodo_gratis IS NOT NULL THEN
        v_dias_restantes := GREATEST(0, v_plan.fecha_fin_periodo_gratis - CURRENT_DATE);
    ELSE
        v_dias_restantes := NULL;
    END IF;
    
    RETURN json_build_object(
        'plan', json_build_object(
            'id', v_plan.plan_id,
            'nombre', v_plan.nombre_plan,
            'tipo', v_plan.tipo_plan
        ),
        'ventas', json_build_object(
            'actuales', v_ventas_mes,
            'limite', v_plan.limite_ventas_mensuales,
            'ilimitado', v_plan.limite_ventas_mensuales IS NULL
        ),
        'usuarios', json_build_object(
            'actuales', v_usuarios_actuales,
            'limite', v_plan.limite_usuarios + COALESCE(v_plan.usuarios_adicionales_pagados, 0),
            'ilimitado', v_plan.limite_usuarios IS NULL
        ),
        'periodo_gratis', json_build_object(
            'fecha_fin', v_plan.fecha_fin_periodo_gratis,
            'dias_restantes', v_dias_restantes,
            'activo', v_plan.fecha_fin_periodo_gratis IS NOT NULL AND v_plan.fecha_fin_periodo_gratis >= CURRENT_DATE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTARIOS IMPORTANTES:
-- ============================================
-- 1. Los planes se actualizan con los nuevos valores
-- 2. El plan "basico" ahora es el "Plan Pago" con precio $9.99/mes o $99.90/año
-- 3. El plan "gratis" tiene límite de 400 ventas/mes y 3 meses gratis
-- 4. El plan "personalizado" requiere solicitud y contacto
-- 5. Las funciones de validación se pueden llamar desde el frontend antes de crear registros
-- 6. Para implementar pagos, se necesitará integrar con pasarela de pago (Mercado Pago, Stripe, etc.)

