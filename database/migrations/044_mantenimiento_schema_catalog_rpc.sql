-- Catálogo de tablas y columnas (schema public) para el módulo Mantenimiento.
-- Solo usuarios con permiso de módulo "mantenimiento" (el dueño siempre pasa).
-- Ejecutar en el SQL Editor de Supabase (o el flujo de migraciones) para habilitar el listado.

CREATE OR REPLACE FUNCTION public.mantenimiento_listar_esquema()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table RECORD;
  v_columns JSONB;
  v_row_count BIGINT;
  v_tables JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.usuario_tiene_permiso_modulo('mantenimiento') THEN
    RAISE EXCEPTION 'No tenés permiso para el módulo de mantenimiento'
      USING ERRCODE = '42501';
  END IF;

  FOR v_table IN
    SELECT tbl.table_name
    FROM information_schema.tables tbl
    WHERE tbl.table_schema = 'public'
      AND tbl.table_type = 'BASE TABLE'
    ORDER BY tbl.table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', v_table.table_name)
      INTO v_row_count;

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'column_name', col.column_name,
          'data_type', col.data_type,
          'ordinal_position', col.ordinal_position
        )
        ORDER BY col.ordinal_position
      ),
      '[]'::jsonb
    )
    INTO v_columns
    FROM information_schema.columns col
    WHERE col.table_schema = 'public'
      AND col.table_name = v_table.table_name;

    v_tables := v_tables || jsonb_build_array(
      jsonb_build_object(
        'table_name', v_table.table_name,
        'row_count', v_row_count,
        'columns', v_columns
      )
    );
  END LOOP;

  RETURN json_build_object(
    'table_count', jsonb_array_length(v_tables),
    'database_size_bytes', pg_database_size(current_database())::bigint,
    'tables', v_tables
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mantenimiento_listar_esquema() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mantenimiento_listar_esquema() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mantenimiento_listar_esquema() TO service_role;

COMMENT ON FUNCTION public.mantenimiento_listar_esquema() IS
  'Mantenimiento: tablas, conteo exacto de filas, tamaño de BD y columnas del schema public. Requiere permiso de módulo mantenimiento.';
