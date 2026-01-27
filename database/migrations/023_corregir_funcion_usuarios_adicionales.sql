-- ============================================
-- Corregir función obtener_usuarios_adicionales
-- Adminis Go - Fix para error de columna ambigua
-- ============================================

-- Corregir la función para evitar ambigüedad en la columna 'id'
CREATE OR REPLACE FUNCTION obtener_usuarios_adicionales(p_comercio_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    id INTEGER,
    puesto_id UUID,
    nombre VARCHAR(255),
    email VARCHAR(255),
    tiene_login BOOLEAN,
    cambios_realizados INTEGER,
    cambios_disponibles INTEGER,
    ultimo_reseteo_cambios DATE,
    proximo_reseteo DATE,
    activo BOOLEAN,
    fecha_creacion TIMESTAMP WITH TIME ZONE
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
    
    RETURN QUERY
    SELECT 
        ua.id,
        ua.puesto_id,
        ua.nombre,
        ua.email,
        ua.tiene_login,
        ua.cambios_realizados,
        6 - ua.cambios_realizados AS cambios_disponibles,
        ua.ultimo_reseteo_cambios,
        (ua.ultimo_reseteo_cambios + INTERVAL '1 year')::DATE AS proximo_reseteo,
        ua.activo,
        ua.fecha_creacion
    FROM usuarios_adicionales ua
    WHERE ua.comercio_id = p_comercio_id
    ORDER BY ua.fecha_creacion DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

