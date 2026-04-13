-- Métricas de catálogo y tamaño de BD para el panel local-admin (solo service_role).
-- Ejecutar en Supabase (migrations o SQL editor) para habilitar conteo de tablas y tamaño.

CREATE OR REPLACE FUNCTION public.local_admin_db_overview()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'public_table_count', (
      SELECT COUNT(*)::INT
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    ),
    'database_size_bytes', (
      SELECT pg_database_size(current_database())::BIGINT
    )
  );
$$;

REVOKE ALL ON FUNCTION public.local_admin_db_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.local_admin_db_overview() TO service_role;

COMMENT ON FUNCTION public.local_admin_db_overview() IS
  'Solo service_role: tablas en schema public y tamaño de la BD (panel local-admin).';
