-- Desglose por tabla (schema public) para el módulo de seguimiento local (solo service_role).
-- row_estimate: estadísticas de Postgres (rápido, puede diferir del COUNT exacto hasta VACUUM/ANALYZE).
-- total_bytes: pg_total_relation_size = heap + índices + TOAST (espacio en disco, no RAM).

CREATE OR REPLACE FUNCTION public.local_admin_table_breakdown()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'table_name', t.table_name,
        'row_estimate', t.row_estimate,
        'total_bytes', t.total_bytes
      )
      ORDER BY t.table_name
    ),
    '[]'::json
  )
  FROM (
    SELECT
      c.relname::text AS table_name,
      CASE
        WHEN s.n_live_tup IS NOT NULL AND s.n_live_tup >= 0 THEN s.n_live_tup::bigint
        WHEN c.reltuples IS NOT NULL AND c.reltuples >= 0 THEN floor(c.reltuples)::bigint
        ELSE NULL
      END AS row_estimate,
      pg_total_relation_size(c.oid)::bigint AS total_bytes
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_stat_all_tables s ON s.relid = c.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
  ) t;
$$;

REVOKE ALL ON FUNCTION public.local_admin_table_breakdown() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.local_admin_table_breakdown() TO service_role;

COMMENT ON FUNCTION public.local_admin_table_breakdown() IS
  'Solo service_role: listado de tablas base en public con filas estimadas y tamaño total en disco.';
