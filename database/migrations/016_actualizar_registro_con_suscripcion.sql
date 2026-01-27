-- ============================================
-- Actualizar función de registro para incluir suscripción
-- Adminis Go - Sistema de Planes
-- ============================================

-- Actualizar función crear_comercio_y_usuario para crear suscripción automáticamente
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
  v_plan RECORD;
  v_fecha_fin_periodo_gratis DATE;
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

  -- Obtener información del plan
  SELECT * INTO v_plan FROM planes WHERE id = p_plan_id;
  
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'Plan no encontrado';
  END IF;

  -- Calcular fecha fin del período gratis si aplica
  IF v_plan.periodo_gratis_meses IS NOT NULL AND v_plan.periodo_gratis_meses > 0 THEN
    v_fecha_fin_periodo_gratis := CURRENT_DATE + (v_plan.periodo_gratis_meses || ' months')::INTERVAL;
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

  -- Crear suscripción automáticamente
  INSERT INTO suscripciones (
    comercio_id,
    plan_id,
    fecha_inicio,
    fecha_fin_periodo_gratis,
    estado,
    usuarios_adicionales_pagados
  ) VALUES (
    v_comercio_id,
    p_plan_id,
    CURRENT_DATE,
    v_fecha_fin_periodo_gratis,
    CASE 
      WHEN v_plan.tipo_plan = 'personalizado' THEN 'pendiente'
      ELSE 'activa'
    END,
    0
  );

  -- Retornar información del comercio creado
  RETURN json_build_object(
    'comercio_id', v_comercio_id,
    'usuario_id', v_user_id,
    'plan_id', p_plan_id,
    'plan_nombre', v_plan.nombre,
    'plan_tipo', v_plan.tipo_plan,
    'fecha_fin_periodo_gratis', v_fecha_fin_periodo_gratis,
    'success', TRUE
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay error, hacer rollback automático (la transacción se revierte)
    RAISE EXCEPTION 'Error al crear comercio y usuario: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTARIOS:
-- ============================================
-- 1. La función ahora crea automáticamente la suscripción
-- 2. Si el plan tiene período gratis, calcula la fecha de fin
-- 3. Si el plan es personalizado, la suscripción queda en estado 'pendiente'
-- 4. Para planes de pago, la suscripción queda 'activa' pero se debe procesar el pago después

