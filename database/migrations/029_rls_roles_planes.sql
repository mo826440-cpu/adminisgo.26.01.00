-- ============================================
-- RLS en roles y planes (Asesor de seguridad)
-- ============================================
-- Las tablas roles y planes son de referencia; se dejan sin RLS a propósito
-- para que cualquier usuario autenticado pueda leerlas. El Asesor de Supabase
-- marca "RLS deshabilitado" como error. Esta migración habilita RLS y añade
-- una política que permite solo SELECT a usuarios autenticados (mismo efecto práctico).

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;

-- Políticas solo si no existen (idempotente para re-ejecutar la migración)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'Usuarios autenticados pueden leer roles'
  ) THEN
    CREATE POLICY "Usuarios autenticados pueden leer roles"
      ON roles FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'planes' AND policyname = 'Usuarios autenticados pueden leer planes'
  ) THEN
    CREATE POLICY "Usuarios autenticados pueden leer planes"
      ON planes FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- No hay política INSERT/UPDATE/DELETE: solo el servicio (service_role) puede modificar
-- roles y planes desde el Dashboard o migraciones.
