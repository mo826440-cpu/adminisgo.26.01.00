-- ============================================
-- Usuarios Adicionales y Historial de Cambios
-- Adminis Go - Sistema de Gestión de Usuarios Adicionales
-- ============================================
-- 
-- Esta migración crea:
-- 1. Tabla usuarios_adicionales: Almacena los puestos de usuarios adicionales comprados
-- 2. Tabla historial_cambios_usuario: Trackea los cambios de nombre/datos de cada puesto
-- 
-- Características:
-- - Cada puesto puede cambiar nombre/datos hasta 6 veces al año
-- - El contador se resetea exactamente 1 año después de la compra
-- - Puede tener login (Supabase Auth) o no (solo en BD)
-- - Si se cancela, queda inactivo (no se elimina)

-- ============================================
-- 1. TABLA: usuarios_adicionales
-- ============================================

CREATE TABLE IF NOT EXISTS usuarios_adicionales (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    puesto_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(), -- ID único del puesto (no cambia nunca)
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255), -- Opcional, solo si tiene_login = true
    tiene_login BOOLEAN DEFAULT FALSE,
    usuario_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Solo si tiene_login = true
    cambios_realizados INTEGER DEFAULT 0, -- Contador de cambios (máximo 6 por año)
    ultimo_reseteo_cambios DATE NOT NULL DEFAULT CURRENT_DATE, -- Fecha del último reset del contador
    activo BOOLEAN DEFAULT TRUE, -- Si está activo o cancelado
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraint: email requerido si tiene_login = true
    CONSTRAINT chk_email_si_tiene_login CHECK (
        (tiene_login = TRUE AND email IS NOT NULL) OR
        (tiene_login = FALSE)
    ),
    -- Constraint: usuario_auth_id requerido si tiene_login = true
    CONSTRAINT chk_auth_id_si_tiene_login CHECK (
        (tiene_login = TRUE AND usuario_auth_id IS NOT NULL) OR
        (tiene_login = FALSE)
    ),
    -- Constraint: cambios_realizados no puede ser negativo ni mayor a 6
    CONSTRAINT chk_cambios_realizados CHECK (
        cambios_realizados >= 0 AND cambios_realizados <= 6
    )
);

-- Índices para usuarios_adicionales
CREATE INDEX IF NOT EXISTS idx_usuarios_adicionales_comercio_id ON usuarios_adicionales(comercio_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_adicionales_puesto_id ON usuarios_adicionales(puesto_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_adicionales_email ON usuarios_adicionales(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_adicionales_usuario_auth_id ON usuarios_adicionales(usuario_auth_id) WHERE usuario_auth_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_adicionales_activo ON usuarios_adicionales(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_adicionales_comercio_activo ON usuarios_adicionales(comercio_id, activo);

-- ============================================
-- 2. TABLA: historial_cambios_usuario
-- ============================================
-- Almacena el historial de cambios de nombre/datos de cada puesto de usuario adicional

CREATE TABLE IF NOT EXISTS historial_cambios_usuario (
    id SERIAL PRIMARY KEY,
    usuario_adicional_id INTEGER NOT NULL REFERENCES usuarios_adicionales(id) ON DELETE CASCADE,
    nombre_anterior VARCHAR(255),
    nombre_nuevo VARCHAR(255) NOT NULL,
    email_anterior VARCHAR(255),
    email_nuevo VARCHAR(255),
    fecha_cambio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    cambios_realizados_en_ese_momento INTEGER NOT NULL, -- Contador de cambios al momento del cambio
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para historial_cambios_usuario
CREATE INDEX IF NOT EXISTS idx_historial_usuario_adicional_id ON historial_cambios_usuario(usuario_adicional_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha_cambio ON historial_cambios_usuario(fecha_cambio);

-- ============================================
-- 3. FUNCIONES RPC
-- ============================================

-- Función: Obtener usuarios adicionales de un comercio
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
BEGIN
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
    WHERE (p_comercio_id IS NULL OR ua.comercio_id = p_comercio_id)
    AND ua.comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
    ORDER BY ua.fecha_creacion DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Validar si un usuario adicional puede cambiar sus datos
-- Retorna TRUE si puede cambiar (tiene menos de 6 cambios y no pasó 1 año)
CREATE OR REPLACE FUNCTION validar_cambios_disponibles(p_usuario_adicional_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_cambios_realizados INTEGER;
    v_ultimo_reseteo DATE;
    v_puede_cambiar BOOLEAN;
BEGIN
    SELECT 
        cambios_realizados,
        ultimo_reseteo_cambios
    INTO 
        v_cambios_realizados,
        v_ultimo_reseteo
    FROM usuarios_adicionales
    WHERE id = p_usuario_adicional_id
    AND activo = TRUE;
    
    -- Si no existe o está inactivo, no puede cambiar
    IF v_cambios_realizados IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Si pasó 1 año desde el último reset, resetear contador
    IF CURRENT_DATE >= (v_ultimo_reseteo + INTERVAL '1 year')::DATE THEN
        UPDATE usuarios_adicionales
        SET 
            cambios_realizados = 0,
            ultimo_reseteo_cambios = CURRENT_DATE
        WHERE id = p_usuario_adicional_id;
        
        v_cambios_realizados := 0;
        v_ultimo_reseteo := CURRENT_DATE;
    END IF;
    
    -- Puede cambiar si tiene menos de 6 cambios
    v_puede_cambiar := v_cambios_realizados < 6;
    
    RETURN v_puede_cambiar;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Cambiar datos de un usuario adicional
CREATE OR REPLACE FUNCTION cambiar_datos_usuario_adicional(
    p_usuario_adicional_id INTEGER,
    p_nombre_nuevo VARCHAR(255),
    p_email_nuevo VARCHAR(255) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_usuario_adicional RECORD;
    v_puede_cambiar BOOLEAN;
    v_nombre_anterior VARCHAR(255);
    v_email_anterior VARCHAR(255);
    v_resultado JSON;
BEGIN
    -- Obtener datos actuales
    SELECT * INTO v_usuario_adicional
    FROM usuarios_adicionales
    WHERE id = p_usuario_adicional_id
    AND comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
    AND activo = TRUE;
    
    IF v_usuario_adicional IS NULL THEN
        RAISE EXCEPTION 'Usuario adicional no encontrado o inactivo';
    END IF;
    
    -- Validar si puede cambiar
    v_puede_cambiar := validar_cambios_disponibles(p_usuario_adicional_id);
    
    IF NOT v_puede_cambiar THEN
        RAISE EXCEPTION 'Límite de cambios alcanzado. Se renovarán el %', 
            (v_usuario_adicional.ultimo_reseteo_cambios + INTERVAL '1 year')::DATE;
    END IF;
    
    -- Guardar valores anteriores
    v_nombre_anterior := v_usuario_adicional.nombre;
    v_email_anterior := v_usuario_adicional.email;
    
    -- Actualizar usuario adicional
    UPDATE usuarios_adicionales
    SET 
        nombre = p_nombre_nuevo,
        email = CASE 
            WHEN p_email_nuevo IS NOT NULL THEN p_email_nuevo 
            ELSE email 
        END,
        cambios_realizados = cambios_realizados + 1,
        fecha_actualizacion = NOW()
    WHERE id = p_usuario_adicional_id;
    
    -- Registrar en historial
    INSERT INTO historial_cambios_usuario (
        usuario_adicional_id,
        nombre_anterior,
        nombre_nuevo,
        email_anterior,
        email_nuevo,
        cambios_realizados_en_ese_momento
    ) VALUES (
        p_usuario_adicional_id,
        v_nombre_anterior,
        p_nombre_nuevo,
        v_email_anterior,
        COALESCE(p_email_nuevo, v_email_anterior),
        v_usuario_adicional.cambios_realizados + 1
    );
    
    -- Retornar resultado
    SELECT json_build_object(
        'success', TRUE,
        'cambios_realizados', v_usuario_adicional.cambios_realizados + 1,
        'cambios_disponibles', 6 - (v_usuario_adicional.cambios_realizados + 1),
        'proximo_reseteo', (v_usuario_adicional.ultimo_reseteo_cambios + INTERVAL '1 year')::DATE
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Resetear contadores de cambios (ejecutar periódicamente)
-- Esta función resetea automáticamente los contadores que cumplieron 1 año
CREATE OR REPLACE FUNCTION resetear_contadores_cambios_anual()
RETURNS INTEGER AS $$
DECLARE
    v_reseteados INTEGER;
BEGIN
    UPDATE usuarios_adicionales
    SET 
        cambios_realizados = 0,
        ultimo_reseteo_cambios = CURRENT_DATE,
        fecha_actualizacion = NOW()
    WHERE activo = TRUE
    AND cambios_realizados > 0
    AND CURRENT_DATE >= (ultimo_reseteo_cambios + INTERVAL '1 year')::DATE;
    
    GET DIAGNOSTICS v_reseteados = ROW_COUNT;
    
    RETURN v_reseteados;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en usuarios_adicionales
ALTER TABLE usuarios_adicionales ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver usuarios adicionales de su comercio
CREATE POLICY "Users can view usuarios_adicionales of their comercio"
    ON usuarios_adicionales FOR SELECT
    USING (
        comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
    );

-- Política: Los usuarios pueden insertar usuarios adicionales en su comercio
CREATE POLICY "Users can insert usuarios_adicionales in their comercio"
    ON usuarios_adicionales FOR INSERT
    WITH CHECK (
        comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
    );

-- Política: Los usuarios pueden actualizar usuarios adicionales de su comercio
CREATE POLICY "Users can update usuarios_adicionales of their comercio"
    ON usuarios_adicionales FOR UPDATE
    USING (
        comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
    )
    WITH CHECK (
        comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
    );

-- Política: Los admins globales pueden ver todos los usuarios adicionales
CREATE POLICY "Admins can view all usuarios_adicionales"
    ON usuarios_adicionales FOR SELECT
    USING (es_admin_global());

-- Habilitar RLS en historial_cambios_usuario
ALTER TABLE historial_cambios_usuario ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver historial de usuarios adicionales de su comercio
CREATE POLICY "Users can view historial of their usuarios_adicionales"
    ON historial_cambios_usuario FOR SELECT
    USING (
        usuario_adicional_id IN (
            SELECT id FROM usuarios_adicionales 
            WHERE comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
        )
    );

-- Política: Los usuarios pueden insertar en historial (solo a través de la función)
CREATE POLICY "Users can insert historial through function"
    ON historial_cambios_usuario FOR INSERT
    WITH CHECK (
        usuario_adicional_id IN (
            SELECT id FROM usuarios_adicionales 
            WHERE comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid())
        )
    );

-- Política: Los admins globales pueden ver todo el historial
CREATE POLICY "Admins can view all historial"
    ON historial_cambios_usuario FOR SELECT
    USING (es_admin_global());

-- ============================================
-- 5. COMENTARIOS Y NOTAS
-- ============================================

-- IMPORTANTE:
-- 1. El puesto_id es único y NO cambia nunca, incluso si se cambia el nombre
--    Esto permite rastrear un puesto a lo largo del tiempo
--
-- 2. Para crear un usuario adicional:
--    INSERT INTO usuarios_adicionales (
--        comercio_id,
--        nombre,
--        email,  -- Opcional, solo si tiene_login = true
--        tiene_login,
--        usuario_auth_id  -- Opcional, solo si tiene_login = true
--    ) VALUES (
--        (SELECT comercio_id FROM usuarios WHERE id = auth.uid()),
--        'Juan Pérez',
--        'juan@ejemplo.com',  -- Solo si tiene_login = true
--        TRUE,  -- o FALSE
--        NULL  -- O el UUID del usuario en auth.users si tiene login
--    );
--
-- 3. Para cambiar datos de un usuario adicional:
--    SELECT cambiar_datos_usuario_adicional(
--        1,  -- ID del usuario adicional
--        'Pablo Gaitán',  -- Nuevo nombre
--        'pablo@ejemplo.com'  -- Nuevo email (opcional)
--    );
--
-- 4. Para resetear contadores automáticamente (ejecutar periódicamente, ej: diario):
--    SELECT resetear_contadores_cambios_anual();
--
-- 5. Para desactivar un usuario adicional (cancelar puesto):
--    UPDATE usuarios_adicionales
--    SET activo = FALSE
--    WHERE id = [id_usuario_adicional]
--    AND comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid());
--
-- 6. Para reactivar un usuario adicional:
--    UPDATE usuarios_adicionales
--    SET activo = TRUE
--    WHERE id = [id_usuario_adicional]
--    AND comercio_id = (SELECT comercio_id FROM usuarios WHERE id = auth.uid());

