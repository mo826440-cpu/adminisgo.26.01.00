-- ============================================
-- Fijar search_path en funciones públicas (Asesor de seguridad)
-- ============================================
-- Las advertencias "Function Search Path Mutable" se corrigen fijando
-- search_path = public en cada función, para evitar riesgos de inyección
-- de search_path.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname AS name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', r.name, r.args);
  END LOOP;
END $$;
