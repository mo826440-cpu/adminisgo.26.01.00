-- ============================================
-- Tabla de Consentimientos
-- Adminis Go - Sistema de Consentimientos y Firmas Digitales
-- ============================================
-- 
-- Esta tabla almacena los consentimientos dados por los usuarios:
-- - Consentimiento de Términos y Condiciones (con firma)
-- - Consentimiento de Eliminación de Cuenta (con firma)
-- Permite rastrear qué versión de términos aceptó cada usuario y cuándo

-- ============================================
-- 1. TABLA: consentimientos
-- ============================================

CREATE TABLE IF NOT EXISTS consentimientos (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comercio_id INTEGER REFERENCES comercios(id) ON DELETE SET NULL,
    tipo_consentimiento VARCHAR(50) NOT NULL, -- 'terminos_condiciones', 'eliminacion_cuenta'
    version_terminos VARCHAR(20), -- Versión de términos aceptada (solo para tipo 'terminos_condiciones')
    firma_imagen_url TEXT, -- URL de la imagen de la firma en Supabase Storage
    ip_address VARCHAR(45), -- IPv4 o IPv6
    user_agent TEXT, -- Navegador y sistema operativo
    fecha_consentimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_eliminacion TIMESTAMP WITH TIME ZONE, -- Solo para tipo 'eliminacion_cuenta', cuando se eliminó la cuenta
    datos_eliminados JSONB, -- Snapshot de qué datos se eliminaron (solo para eliminación)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraint: version_terminos solo es requerido para tipo 'terminos_condiciones'
    CONSTRAINT chk_version_terminos CHECK (
        (tipo_consentimiento = 'terminos_condiciones' AND version_terminos IS NOT NULL) OR
        (tipo_consentimiento != 'terminos_condiciones')
    )
);

-- Índices para consentimientos
CREATE INDEX IF NOT EXISTS idx_consentimientos_usuario_id ON consentimientos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_consentimientos_comercio_id ON consentimientos(comercio_id);
CREATE INDEX IF NOT EXISTS idx_consentimientos_tipo ON consentimientos(tipo_consentimiento);
CREATE INDEX IF NOT EXISTS idx_consentimientos_version_terminos ON consentimientos(version_terminos);
CREATE INDEX IF NOT EXISTS idx_consentimientos_fecha ON consentimientos(fecha_consentimiento);
CREATE INDEX IF NOT EXISTS idx_consentimientos_usuario_tipo ON consentimientos(usuario_id, tipo_consentimiento);

-- ============================================
-- 2. FUNCIONES RPC
-- ============================================

-- Función: Verificar si el usuario tiene consentimiento actual de términos
-- Retorna TRUE si el usuario aceptó la versión actual de términos
CREATE OR REPLACE FUNCTION verificar_consentimiento_actual(p_usuario_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    v_version_actual VARCHAR(20);
    v_consentimiento_existe BOOLEAN;
BEGIN
    -- Obtener la versión actual de términos
    SELECT version INTO v_version_actual
    FROM terminos_condiciones
    WHERE activo = TRUE
    ORDER BY fecha_publicacion DESC
    LIMIT 1;
    
    -- Si no hay términos activos, no se requiere consentimiento
    IF v_version_actual IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar si el usuario tiene consentimiento para la versión actual
    SELECT EXISTS (
        SELECT 1
        FROM consentimientos
        WHERE usuario_id = p_usuario_id
        AND tipo_consentimiento = 'terminos_condiciones'
        AND version_terminos = v_version_actual
    ) INTO v_consentimiento_existe;
    
    RETURN v_consentimiento_existe;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener el consentimiento actual de términos del usuario
-- Retorna el consentimiento más reciente de términos del usuario
CREATE OR REPLACE FUNCTION obtener_consentimiento_terminos_usuario(p_usuario_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    id INTEGER,
    version_terminos VARCHAR(20),
    fecha_consentimiento TIMESTAMP WITH TIME ZONE,
    firma_imagen_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.version_terminos,
        c.fecha_consentimiento,
        c.firma_imagen_url
    FROM consentimientos c
    WHERE c.usuario_id = p_usuario_id
    AND c.tipo_consentimiento = 'terminos_condiciones'
    ORDER BY c.fecha_consentimiento DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener todos los consentimientos de un usuario
CREATE OR REPLACE FUNCTION obtener_consentimientos_usuario(p_usuario_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    id INTEGER,
    tipo_consentimiento VARCHAR(50),
    version_terminos VARCHAR(20),
    fecha_consentimiento TIMESTAMP WITH TIME ZONE,
    firma_imagen_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.tipo_consentimiento,
        c.version_terminos,
        c.fecha_consentimiento,
        c.firma_imagen_url
    FROM consentimientos c
    WHERE c.usuario_id = p_usuario_id
    ORDER BY c.fecha_consentimiento DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en consentimientos
ALTER TABLE consentimientos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios consentimientos
CREATE POLICY "Users can view their own consentimientos"
    ON consentimientos FOR SELECT
    USING (usuario_id = auth.uid());

-- Política: Los usuarios pueden insertar sus propios consentimientos
CREATE POLICY "Users can insert their own consentimientos"
    ON consentimientos FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

-- Política: Los usuarios pueden actualizar sus propios consentimientos (solo fecha_eliminacion)
CREATE POLICY "Users can update their own consentimientos"
    ON consentimientos FOR UPDATE
    USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());

-- Política: Los admins globales pueden ver todos los consentimientos
CREATE POLICY "Admins can view all consentimientos"
    ON consentimientos FOR SELECT
    USING (es_admin_global());

-- Política: Los admins globales pueden ver consentimientos de un comercio específico
-- (útil para ver consentimientos de usuarios de un comercio)
CREATE POLICY "Admins can view consentimientos by comercio"
    ON consentimientos FOR SELECT
    USING (
        es_admin_global() 
        AND comercio_id IS NOT NULL
    );

-- ============================================
-- 4. COMENTARIOS Y NOTAS
-- ============================================

-- IMPORTANTE:
-- 1. La firma_imagen_url debe apuntar a una imagen guardada en Supabase Storage
--    en el bucket 'firmas' con la estructura:
--    - firmas/terminos/{usuario_id}.png
--    - firmas/eliminacion/{usuario_id}.png
--
-- 2. Para insertar un consentimiento de términos:
--    INSERT INTO consentimientos (
--        usuario_id,
--        comercio_id,
--        tipo_consentimiento,
--        version_terminos,
--        firma_imagen_url,
--        ip_address,
--        user_agent
--    ) VALUES (
--        auth.uid(),
--        (SELECT comercio_id FROM usuarios WHERE id = auth.uid()),
--        'terminos_condiciones',
--        '1.0',
--        'https://...firmas/terminos/...',
--        '192.168.1.1',
--        'Mozilla/5.0...'
--    );
--
-- 3. Para insertar un consentimiento de eliminación:
--    INSERT INTO consentimientos (
--        usuario_id,
--        comercio_id,
--        tipo_consentimiento,
--        firma_imagen_url,
--        ip_address,
--        user_agent,
--        datos_eliminados
--    ) VALUES (
--        auth.uid(),
--        (SELECT comercio_id FROM usuarios WHERE id = auth.uid()),
--        'eliminacion_cuenta',
--        'https://...firmas/eliminacion/...',
--        '192.168.1.1',
--        'Mozilla/5.0...',
--        '{"productos": 150, "ventas": 200, ...}'::jsonb
--    );

