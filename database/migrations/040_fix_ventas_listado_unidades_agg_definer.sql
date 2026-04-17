-- ============================================
-- Corrección: ventas_listado_unidades_agg (SECURITY DEFINER + filtros explícitos)
-- ============================================
-- La versión 039 (SECURITY INVOKER) puede fallar con 500 o timeouts en Supabase
-- al agregar sobre venta_items con RLS pesado (migración 038): el planificador
-- evalúa políticas por fila sobre muchos datos.
--
-- Esta versión corre como DEFINER pero **solo** devuelve filas del comercio del
-- usuario y si tiene permiso de ventas/reportes (misma regla que las políticas).

CREATE OR REPLACE FUNCTION public.ventas_listado_unidades_agg(
  p_desde timestamptz,
  p_hasta timestamptz
)
RETURNS TABLE(venta_id integer, suma_cantidad numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    vi.venta_id,
    SUM(vi.cantidad)::numeric AS suma_cantidad
  FROM public.venta_items vi
  INNER JOIN public.ventas v ON v.id = vi.venta_id
  WHERE v.deleted_at IS NULL
    AND v.comercio_id = public.get_user_comercio_id()
    AND v.fecha_hora >= p_desde
    AND v.fecha_hora <= p_hasta
    AND public.usuario_permiso_ventas_o_reportes()
  GROUP BY vi.venta_id;
$$;

REVOKE ALL ON FUNCTION public.ventas_listado_unidades_agg(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ventas_listado_unidades_agg(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ventas_listado_unidades_agg(timestamptz, timestamptz) TO service_role;

COMMENT ON FUNCTION public.ventas_listado_unidades_agg(timestamptz, timestamptz) IS
  'Listado ventas: SUM(cantidad) por venta en rango fecha_hora. DEFINER con comercio_id + permiso; evita 500/timeouts con RLS en agregados.';
