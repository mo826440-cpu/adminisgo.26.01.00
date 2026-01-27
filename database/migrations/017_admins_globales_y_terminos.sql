-- ============================================
-- Admins Globales y Términos y Condiciones
-- Adminis Go - Sistema de Administración y Consentimientos
-- ============================================

-- ============================================
-- 1. TABLA: admins_globales
-- ============================================
-- Almacena los usuarios que tienen permisos de administrador global
-- (pueden gestionar solicitudes de planes personalizados, ver todos los usuarios, etc.)

CREATE TABLE IF NOT EXISTS admins_globales (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para admins_globales
CREATE INDEX IF NOT EXISTS idx_admins_globales_usuario_id ON admins_globales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_admins_globales_email ON admins_globales(email);
CREATE INDEX IF NOT EXISTS idx_admins_globales_activo ON admins_globales(activo);

-- ============================================
-- 2. TABLA: terminos_condiciones
-- ============================================
-- Almacena las diferentes versiones de términos y condiciones
-- Permite versionado para que los usuarios acepten nuevas versiones cuando cambien

CREATE TABLE IF NOT EXISTS terminos_condiciones (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL UNIQUE, -- Ej: '1.0', '1.1', '2.0'
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    fecha_publicacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para terminos_condiciones
CREATE INDEX IF NOT EXISTS idx_terminos_version ON terminos_condiciones(version);
CREATE INDEX IF NOT EXISTS idx_terminos_activo ON terminos_condiciones(activo);

-- ============================================
-- 3. FUNCIONES RPC
-- ============================================

-- Función: Verificar si un usuario es admin global
CREATE OR REPLACE FUNCTION es_admin_global(p_usuario_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admins_globales 
        WHERE usuario_id = p_usuario_id 
        AND activo = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener la versión actual de términos y condiciones
CREATE OR REPLACE FUNCTION obtener_terminos_actuales()
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
        tc.id,
        tc.version,
        tc.titulo,
        tc.contenido,
        tc.fecha_publicacion
    FROM terminos_condiciones tc
    WHERE tc.activo = TRUE
    ORDER BY tc.fecha_publicacion DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en admins_globales
ALTER TABLE admins_globales ENABLE ROW LEVEL SECURITY;

-- Política: Solo los admins globales pueden ver la lista de admins
CREATE POLICY "Admins can view admins_globales"
    ON admins_globales FOR SELECT
    USING (es_admin_global());

-- Política: Solo los admins globales pueden insertar nuevos admins
CREATE POLICY "Admins can insert admins_globales"
    ON admins_globales FOR INSERT
    WITH CHECK (es_admin_global());

-- Política: Solo los admins globales pueden actualizar admins
CREATE POLICY "Admins can update admins_globales"
    ON admins_globales FOR UPDATE
    USING (es_admin_global());

-- Habilitar RLS en terminos_condiciones
ALTER TABLE terminos_condiciones ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver términos activos
CREATE POLICY "Users can view active terminos"
    ON terminos_condiciones FOR SELECT
    USING (
        activo = TRUE 
        AND auth.uid() IS NOT NULL
    );

-- Política: Solo los admins globales pueden ver todas las versiones
CREATE POLICY "Admins can view all terminos"
    ON terminos_condiciones FOR SELECT
    USING (es_admin_global());

-- Política: Solo los admins globales pueden insertar/actualizar términos
CREATE POLICY "Admins can manage terminos"
    ON terminos_condiciones FOR ALL
    USING (es_admin_global())
    WITH CHECK (es_admin_global());

-- ============================================
-- 5. DATOS INICIALES
-- ============================================

-- NOTA: El admin global inicial se insertará manualmente después de crear la cuenta
-- porque necesitamos el usuario_id de Supabase Auth primero.
-- Por ahora, creamos un comentario con las instrucciones:

-- Para insertar el admin global inicial, ejecutar después de crear la cuenta:
-- INSERT INTO admins_globales (usuario_id, email, nombre, activo)
-- VALUES (
--     (SELECT id FROM auth.users WHERE email = 'mo826440@gmail.com'),
--     'mo826440@gmail.com',
--     'Administrador Principal',
--     TRUE
-- );

-- Insertar versión inicial de términos y condiciones (placeholder)
-- Este contenido debe ser reemplazado con los términos reales
INSERT INTO terminos_condiciones (version, titulo, contenido, activo)
VALUES (
    '1.0',
    'Términos y Condiciones de Uso - Versión 1.0',
    'TÉRMINOS Y CONDICIONES DE USO

ADMINIS GO - SISTEMA DE GESTIÓN DE COMERCIOS

Fecha de publicación: ' || CURRENT_DATE || '

1. ACEPTACIÓN DE TÉRMINOS
Al acceder y utilizar Adminis Go, usted acepta estar sujeto a estos Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar el servicio.

2. DESCRIPCIÓN DEL SERVICIO
Adminis Go es una plataforma de gestión de comercios que permite administrar ventas, inventario, compras, clientes y otros aspectos de su negocio.

3. REGISTRO Y CUENTA DE USUARIO
- Debe proporcionar información precisa y completa al registrarse
- Es responsable de mantener la confidencialidad de su contraseña
- Debe notificar inmediatamente cualquier uso no autorizado de su cuenta

4. PLANES Y SUSCRIPCIONES
- Plan Gratis: Incluye funcionalidades básicas con límites establecidos
- Plan Pago: Incluye funcionalidades extendidas según el plan seleccionado
- Plan Personalizado: Requiere aprobación previa

5. POLÍTICA DE CANCELACIÓN Y REEMBOLSO
- Puede cancelar su suscripción en cualquier momento
- Los reembolsos se procesan según la política establecida:
  * Plan Mensual: Reembolso completo si cancela dentro de los 15 días del último pago
  * Plan Anual: Reembolso completo si cancela dentro de los 30 días del último pago
- Después del período de gracia, no se procesarán reembolsos

6. OBLIGACIONES DEL USUARIO
- Utilizar el servicio de manera legal y ética
- No intentar acceder a áreas restringidas del sistema
- No compartir su cuenta con terceros sin autorización
- Mantener la seguridad de su cuenta

7. PROPIEDAD INTELECTUAL
Todo el contenido del servicio, incluyendo pero no limitado a textos, gráficos, logos, y software, es propiedad de Adminis Go y está protegido por leyes de propiedad intelectual.

8. LIMITACIÓN DE RESPONSABILIDAD
Adminis Go no será responsable por daños indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de usar el servicio.

9. PROTECCIÓN DE DATOS
El manejo de datos personales se rige por nuestra Política de Privacidad, que forma parte integral de estos términos.

10. MODIFICACIONES DE TÉRMINOS
Nos reservamos el derecho de modificar estos términos en cualquier momento. Los usuarios serán notificados de cambios significativos y deberán aceptar la nueva versión para continuar usando el servicio.

11. LEY APLICABLE Y JURISDICCIÓN
Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será resuelta en los tribunales competentes de Argentina.

12. CONTACTO
Para consultas sobre estos términos, puede contactarnos a través de los canales oficiales de Adminis Go.

Al aceptar estos términos, confirma que ha leído, entendido y acepta estar sujeto a estos Términos y Condiciones de Uso.',
    TRUE
)
ON CONFLICT (version) DO NOTHING;

-- ============================================
-- 6. COMENTARIOS Y NOTAS
-- ============================================

-- IMPORTANTE: 
-- 1. Después de ejecutar esta migración, necesitarás:
--    a) Crear tu cuenta de usuario en Supabase Auth (si no existe)
--    b) Ejecutar el INSERT para agregarte como admin global (ver comentario arriba)
--
-- 2. Los términos y condiciones insertados son un PLACEHOLDER.
--    Debes reemplazarlos con los términos reales antes de lanzar la app.
--
-- 3. Para agregar más admins globales en el futuro:
--    INSERT INTO admins_globales (usuario_id, email, nombre, activo)
--    VALUES (
--        (SELECT id FROM auth.users WHERE email = 'email@ejemplo.com'),
--        'email@ejemplo.com',
--        'Nombre del Admin',
--        TRUE
--    );

