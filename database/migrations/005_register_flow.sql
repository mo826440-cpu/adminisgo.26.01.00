-- ============================================
-- Función para manejar el registro completo
-- Crea comercio y usuario en una transacción
-- ============================================

-- Función que puede ser llamada desde el cliente después del registro en auth
-- NOTA: Esta función asume que el usuario ya existe en auth.users
-- El cliente debe llamar a esta función después de signUp
CREATE OR REPLACE FUNCTION crear_comercio_y_usuario(
  p_nombre_comercio VARCHAR(255),
  p_nombre_usuario VARCHAR(255),
  p_direccion TEXT DEFAULT NULL,
  p_telefono VARCHAR(20) DEFAULT NULL,
  p_email_comercio VARCHAR(255) DEFAULT NULL,
  p_telefono_usuario VARCHAR(20) DEFAULT NULL,
  p_plan_id INTEGER DEFAULT 1  -- Por defecto plan gratis (id=1)
)
RETURNS JSON AS $$
DECLARE
  v_comercio_id INTEGER;
  v_user_id UUID;
BEGIN
  -- Obtener el ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar si ya existe un usuario con este ID
  IF EXISTS (SELECT 1 FROM usuarios WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'El usuario ya tiene un comercio asociado';
  END IF;

  -- Crear el comercio
  INSERT INTO comercios (
    nombre,
    direccion,
    telefono,
    email,
    plan_id,
    activo
  ) VALUES (
    p_nombre_comercio,
    p_direccion,
    p_telefono,
    p_email_comercio,
    p_plan_id,
    TRUE
  ) RETURNING id INTO v_comercio_id;

  -- Crear el usuario asociado al comercio
  INSERT INTO usuarios (
    id,
    comercio_id,
    nombre,
    email,
    telefono,
    rol_id,
    activo
  ) VALUES (
    v_user_id,
    v_comercio_id,
    p_nombre_usuario,
    (SELECT email FROM auth.users WHERE id = v_user_id),
    p_telefono_usuario,
    (SELECT id FROM roles WHERE nombre = 'dueño' LIMIT 1),  -- Rol dueño/administrador
    TRUE
  );

  -- Retornar información del comercio creado
  RETURN json_build_object(
    'comercio_id', v_comercio_id,
    'usuario_id', v_user_id,
    'success', TRUE
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay error, hacer rollback automático (la transacción se revierte)
    RAISE EXCEPTION 'Error al crear comercio y usuario: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTARIOS IMPORTANTES:
-- ============================================
-- 1. Esta función usa SECURITY DEFINER para poder acceder a auth.uid()
-- 2. Debe ser llamada DESPUÉS de que el usuario se registre en auth.users
-- 3. El cliente debe llamar a esta función usando rpc() de Supabase
-- 4. El rol_id=1 asume que el rol administrador tiene id=1 (verificar en 002_initial_data.sql)
-- 5. El plan_id=1 asume que el plan gratis tiene id=1 (verificar en 002_initial_data.sql)

