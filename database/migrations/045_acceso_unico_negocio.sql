-- ============================================
-- 045: acceso de un solo negocio
-- ============================================
-- No borra comercios, usuarios ni la estructura multi-comercio.
-- Cierra el alta pública de comercios desde el cliente.
-- Una cuenta inactiva o dada de baja deja de obtener comercio_id (RLS).
-- Quien no es dueño no puede cambiar su rol ni su comercio.

CREATE OR REPLACE FUNCTION public.get_user_comercio_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.comercio_id
  FROM public.usuarios u
  WHERE u.id = auth.uid()
    AND u.deleted_at IS NULL
    AND COALESCE(u.activo, true) = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.usuario_es_dueno()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    INNER JOIN public.roles r ON r.id = u.rol_id
    WHERE u.id = auth.uid()
      AND u.deleted_at IS NULL
      AND COALESCE(u.activo, true) = true
      AND lower(trim(r.nombre)) = 'dueño'
  );
$$;

CREATE OR REPLACE FUNCTION public.usuario_tiene_permiso_modulo(p_codigo text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.usuarios u
      INNER JOIN public.roles r ON r.id = u.rol_id
      WHERE u.id = auth.uid()
        AND u.deleted_at IS NULL
        AND COALESCE(u.activo, true) = true
        AND lower(trim(r.nombre)) = 'dueño'
    )
    OR EXISTS (
      SELECT 1
      FROM public.usuarios u
      INNER JOIN public.comercio_rol_modulos crm
        ON crm.comercio_id = u.comercio_id AND crm.rol_id = u.rol_id
      INNER JOIN public.app_modulos m ON m.id = crm.modulo_id
        AND lower(trim(m.codigo)) = lower(trim(p_codigo))
      WHERE u.id = auth.uid()
        AND u.deleted_at IS NULL
        AND COALESCE(u.activo, true) = true
        AND crm.permitido = TRUE
    );
$$;

REVOKE ALL ON FUNCTION public.usuario_tiene_permiso_modulo(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usuario_tiene_permiso_modulo(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_tiene_permiso_modulo(text) TO service_role;

CREATE OR REPLACE FUNCTION public.trg_usuarios_no_autogestion_rol_ni_comercio()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (NEW.rol_id IS DISTINCT FROM OLD.rol_id OR NEW.comercio_id IS DISTINCT FROM OLD.comercio_id)
     AND COALESCE(auth.role(), '') IS DISTINCT FROM 'service_role'
     AND NOT public.usuario_es_dueno() THEN
    RAISE EXCEPTION 'No podés cambiar el rol ni el negocio de la cuenta';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_no_autogestion_rol_ni_comercio ON public.usuarios;
CREATE TRIGGER trg_usuarios_no_autogestion_rol_ni_comercio
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_usuarios_no_autogestion_rol_ni_comercio();

-- La función sigue existiendo para no romper el esquema, pero el cliente no puede ejecutarla.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'crear_comercio_y_usuario'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;
