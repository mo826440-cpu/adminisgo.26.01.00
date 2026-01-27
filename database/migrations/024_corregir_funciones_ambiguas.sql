-- ============================================
-- Corregir funciones con error de columna ambigua
-- Adminis Go - Fix para obtener_notificaciones_admin y obtener_plan_personalizado
-- ============================================

-- ============================================
-- 1. Corregir obtener_notificaciones_admin
-- ============================================

CREATE OR REPLACE FUNCTION obtener_notificaciones_admin(p_admin_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    id INTEGER,
    tipo VARCHAR(50),
    titulo VARCHAR(255),
    mensaje TEXT,
    leida BOOLEAN,
    fecha_creacion TIMESTAMP WITH TIME ZONE,
    datos_adicionales JSONB
) AS $$
DECLARE
    v_admin_global_id INTEGER;
BEGIN
    -- Obtener el ID del admin global del usuario actual
    SELECT ag.id INTO v_admin_global_id
    FROM admins_globales ag
    WHERE ag.usuario_id = auth.uid()
    AND ag.activo = TRUE
    LIMIT 1;
    
    -- Si no se especificó p_admin_id, usar el del usuario actual
    IF p_admin_id IS NULL THEN
        p_admin_id := v_admin_global_id;
    END IF;
    
    -- Si no hay admin_id válido, retornar vacío
    IF p_admin_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        n.id,
        n.tipo,
        n.titulo,
        n.mensaje,
        n.leida,
        n.fecha_creacion,
        n.datos_adicionales
    FROM notificaciones_admin n
    WHERE n.admin_id = p_admin_id
    ORDER BY n.fecha_creacion DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Corregir obtener_plan_personalizado
-- ============================================

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
DECLARE
    v_comercio_id INTEGER;
BEGIN
    -- Obtener comercio_id del usuario actual de forma explícita
    SELECT u.comercio_id INTO v_comercio_id
    FROM usuarios u
    WHERE u.id = auth.uid();
    
    -- Si no se especificó p_comercio_id, usar el del usuario actual
    IF p_comercio_id IS NULL THEN
        p_comercio_id := v_comercio_id;
    END IF;
    
    -- Si no hay comercio_id válido, retornar vacío
    IF p_comercio_id IS NULL THEN
        RETURN;
    END IF;
    
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
    WHERE pp.comercio_id = p_comercio_id
    AND pp.activo = TRUE
    ORDER BY pp.fecha_creacion DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

