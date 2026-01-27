-- ============================================
-- Política de Privacidad, Notificaciones Admin y Contratos
-- Adminis Go - Sistema Completo de Documentación Legal y Notificaciones
-- ============================================
-- 
-- Esta migración crea:
-- 1. Tabla politica_privacidad: Almacena versiones de política de privacidad (similar a terminos_condiciones)
-- 2. Tabla notificaciones_admin: Notificaciones para admins globales
-- 3. Actualiza solicitudes_planes_personalizados: Agrega campo para contratos

-- ============================================
-- 1. TABLA: politica_privacidad
-- ============================================
-- Almacena las diferentes versiones de política de privacidad
-- Permite versionado para que los usuarios acepten nuevas versiones cuando cambien

CREATE TABLE IF NOT EXISTS politica_privacidad (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL UNIQUE, -- Ej: '1.0', '1.1', '2.0'
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    fecha_publicacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para politica_privacidad
CREATE INDEX IF NOT EXISTS idx_politica_privacidad_version ON politica_privacidad(version);
CREATE INDEX IF NOT EXISTS idx_politica_privacidad_activo ON politica_privacidad(activo);

-- ============================================
-- 2. TABLA: notificaciones_admin
-- ============================================
-- Almacena notificaciones para los administradores globales
-- Permite notificar sobre solicitudes de planes personalizados, pagos fallidos, etc.

CREATE TABLE IF NOT EXISTS notificaciones_admin (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins_globales(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'nueva_solicitud_plan', 'pago_fallido', 'nuevo_usuario', etc.
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_lectura TIMESTAMP WITH TIME ZONE,
    datos_adicionales JSONB, -- Para almacenar información adicional (IDs, URLs, etc.)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para notificaciones_admin
CREATE INDEX IF NOT EXISTS idx_notificaciones_admin_id ON notificaciones_admin(admin_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones_admin(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones_admin(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha ON notificaciones_admin(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_notificaciones_admin_leida ON notificaciones_admin(admin_id, leida);

-- ============================================
-- 3. ACTUALIZAR: solicitudes_planes_personalizados
-- ============================================
-- Agregar campo para almacenar contrato firmado (PDF o documento)

-- Verificar si la tabla existe (fue creada en migración 015)
DO $$
BEGIN
    -- Agregar campo contrato_url si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solicitudes_personalizadas' 
        AND column_name = 'contrato_url'
    ) THEN
        ALTER TABLE solicitudes_personalizadas 
        ADD COLUMN contrato_url TEXT;
    END IF;
    
    -- Agregar campo contrato_fecha_firma si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solicitudes_personalizadas' 
        AND column_name = 'contrato_fecha_firma'
    ) THEN
        ALTER TABLE solicitudes_personalizadas 
        ADD COLUMN contrato_fecha_firma TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Agregar campo datos_fiscales si no existe (para facturación)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solicitudes_personalizadas' 
        AND column_name = 'datos_fiscales'
    ) THEN
        ALTER TABLE solicitudes_personalizadas 
        ADD COLUMN datos_fiscales JSONB; -- Para almacenar CUIT, razón social, etc.
    END IF;
END $$;

-- ============================================
-- 4. FUNCIONES RPC
-- ============================================

-- Función: Obtener la versión actual de política de privacidad
CREATE OR REPLACE FUNCTION obtener_politica_privacidad_actual()
RETURNS TABLE (
    id INTEGER,
    version VARCHAR(20),
    titulo VARCHAR(255),
    contenido TEXT,
    fecha_publicacion TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.version,
        pp.titulo,
        pp.contenido,
        pp.fecha_publicacion
    FROM politica_privacidad pp
    WHERE pp.activo = TRUE
    ORDER BY pp.fecha_publicacion DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener notificaciones no leídas de un admin
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
BEGIN
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
    WHERE (p_admin_id IS NULL OR n.admin_id = p_admin_id)
    AND n.admin_id IN (SELECT id FROM admins_globales WHERE usuario_id = auth.uid())
    ORDER BY n.fecha_creacion DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Contar notificaciones no leídas de un admin
CREATE OR REPLACE FUNCTION contar_notificaciones_no_leidas(p_admin_id INTEGER DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notificaciones_admin n
    WHERE (p_admin_id IS NULL OR n.admin_id = p_admin_id)
    AND n.admin_id IN (SELECT id FROM admins_globales WHERE usuario_id = auth.uid())
    AND n.leida = FALSE;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Marcar notificación como leída
CREATE OR REPLACE FUNCTION marcar_notificacion_leida(p_notificacion_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notificaciones_admin
    SET 
        leida = TRUE,
        fecha_lectura = NOW(),
        updated_at = NOW()
    WHERE id = p_notificacion_id
    AND admin_id IN (SELECT id FROM admins_globales WHERE usuario_id = auth.uid());
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Crear notificación para todos los admins
CREATE OR REPLACE FUNCTION crear_notificacion_para_todos_admins(
    p_tipo VARCHAR(50),
    p_titulo VARCHAR(255),
    p_mensaje TEXT,
    p_datos_adicionales JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    INSERT INTO notificaciones_admin (admin_id, tipo, titulo, mensaje, datos_adicionales)
    SELECT 
        id,
        p_tipo,
        p_titulo,
        p_mensaje,
        p_datos_adicionales
    FROM admins_globales
    WHERE activo = TRUE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en politica_privacidad
ALTER TABLE politica_privacidad ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver política activa
CREATE POLICY "Users can view active politica_privacidad"
    ON politica_privacidad FOR SELECT
    USING (
        activo = TRUE 
        AND auth.uid() IS NOT NULL
    );

-- Política: Solo los admins globales pueden ver todas las versiones
CREATE POLICY "Admins can view all politica_privacidad"
    ON politica_privacidad FOR SELECT
    USING (es_admin_global());

-- Política: Solo los admins globales pueden gestionar política
CREATE POLICY "Admins can manage politica_privacidad"
    ON politica_privacidad FOR ALL
    USING (es_admin_global())
    WITH CHECK (es_admin_global());

-- Habilitar RLS en notificaciones_admin
ALTER TABLE notificaciones_admin ENABLE ROW LEVEL SECURITY;

-- Política: Los admins pueden ver sus propias notificaciones
CREATE POLICY "Admins can view their own notifications"
    ON notificaciones_admin FOR SELECT
    USING (
        admin_id IN (SELECT id FROM admins_globales WHERE usuario_id = auth.uid())
    );

-- Política: Los admins pueden actualizar sus propias notificaciones (marcar como leída)
CREATE POLICY "Admins can update their own notifications"
    ON notificaciones_admin FOR UPDATE
    USING (
        admin_id IN (SELECT id FROM admins_globales WHERE usuario_id = auth.uid())
    )
    WITH CHECK (
        admin_id IN (SELECT id FROM admins_globales WHERE usuario_id = auth.uid())
    );

-- Política: Solo admins globales pueden insertar notificaciones (a través de funciones)
CREATE POLICY "Admins can insert notifications"
    ON notificaciones_admin FOR INSERT
    WITH CHECK (es_admin_global());

-- ============================================
-- 6. DATOS INICIALES
-- ============================================

-- Insertar versión inicial de política de privacidad (placeholder)
-- Este contenido debe ser reemplazado con la política real
INSERT INTO politica_privacidad (version, titulo, contenido, activo)
VALUES (
    '1.0',
    'Política de Privacidad - Versión 1.0',
    'POLÍTICA DE PRIVACIDAD

ADMINIS GO - SISTEMA DE GESTIÓN DE COMERCIOS

Fecha de publicación: ' || CURRENT_DATE || '

1. INFORMACIÓN QUE RECOPILAMOS
Recopilamos información que usted nos proporciona directamente al registrarse y usar nuestro servicio, incluyendo:
- Información de cuenta (nombre, email, contraseña)
- Información del comercio (nombre, dirección, teléfono)
- Datos de productos, ventas, compras y clientes
- Información de pago (procesada de forma segura a través de Stripe)

2. CÓMO USAMOS SU INFORMACIÓN
Utilizamos la información recopilada para:
- Proporcionar y mejorar nuestro servicio
- Procesar pagos y gestionar suscripciones
- Enviar notificaciones importantes sobre el servicio
- Mejorar la funcionalidad y experiencia del usuario
- Cumplir con obligaciones legales

3. PROTECCIÓN DE DATOS
Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos:
- Encriptación de datos en tránsito y en reposo
- Acceso restringido a datos personales
- Backups regulares y seguros
- Cumplimiento con estándares de seguridad

4. COMPARTIR INFORMACIÓN
No vendemos ni alquilamos sus datos personales. Solo compartimos información:
- Con proveedores de servicios que nos ayudan a operar (ej: Stripe para pagos)
- Cuando es requerido por ley o autoridades competentes
- Con su consentimiento explícito

5. SUS DERECHOS (Ley 25.326 - Argentina)
Usted tiene derecho a:
- Acceder a sus datos personales
- Rectificar datos inexactos
- Solicitar la eliminación de sus datos
- Oponerse al tratamiento de sus datos
- Portabilidad de datos

6. RETENCIÓN DE DATOS
Conservamos sus datos mientras su cuenta esté activa y según sea necesario para cumplir con obligaciones legales.

7. COOKIES Y TECNOLOGÍAS SIMILARES
Utilizamos cookies y tecnologías similares para mejorar su experiencia. Puede gestionar las preferencias de cookies en su navegador.

8. CAMBIOS A ESTA POLÍTICA
Nos reservamos el derecho de actualizar esta política. Le notificaremos sobre cambios significativos.

9. CONTACTO
Para consultas sobre esta política o sus datos personales, puede contactarnos a través de los canales oficiales de Adminis Go.

Al usar nuestro servicio, usted acepta esta Política de Privacidad.',
    TRUE
)
ON CONFLICT (version) DO NOTHING;

-- ============================================
-- 7. COMENTARIOS Y NOTAS
-- ============================================

-- IMPORTANTE:
-- 1. La política de privacidad insertada es un PLACEHOLDER.
--    Debes reemplazarla con la política real antes de lanzar la app.
--
-- 2. Para crear una nueva versión de política de privacidad:
--    INSERT INTO politica_privacidad (version, titulo, contenido, activo)
--    VALUES ('1.1', 'Política de Privacidad - Versión 1.1', '...', TRUE);
--    
--    -- Desactivar versión anterior
--    UPDATE politica_privacidad SET activo = FALSE WHERE version = '1.0';
--
-- 3. Para crear una notificación:
--    SELECT crear_notificacion_para_todos_admins(
--        'nueva_solicitud_plan',
--        'Nueva solicitud de plan personalizado',
--        'Se ha recibido una nueva solicitud de plan personalizado.',
--        '{"solicitud_id": 123}'::jsonb
--    );
--
-- 4. El campo contrato_url en solicitudes_personalizadas debe apuntar a un archivo
--    almacenado en Supabase Storage (bucket 'contratos' o similar).
--
-- 5. El campo datos_fiscales puede almacenar:
--    {
--        "cuit": "20-12345678-9",
--        "razon_social": "Comercio S.A.",
--        "condicion_fiscal": "Responsable Inscripto",
--        "direccion_fiscal": "..."
--    }

