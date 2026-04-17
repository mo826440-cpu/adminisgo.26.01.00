-- ============================================
-- Listado de ventas: agregado de unidades (SUM cantidad) en una sola consulta
-- ============================================
-- El frontend pide unidades vía RPC en una sola ida. Si en producción ves 500
-- en esta RPC, aplicá también 040 (SECURITY DEFINER + filtros explícitos).

CREATE OR REPLACE FUNCTION public.ventas_listado_unidades_agg(
  p_desde timestamptz,
  p_hasta timestamptz
)
RETURNS TABLE(venta_id integer, suma_cantidad numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    vi.venta_id,
    SUM(vi.cantidad)::numeric AS suma_cantidad
  FROM public.venta_items vi
  INNER JOIN public.ventas v ON v.id = vi.venta_id
  WHERE v.deleted_at IS NULL
    AND v.fecha_hora >= p_desde
    AND v.fecha_hora <= p_hasta
  GROUP BY vi.venta_id;
$$;

REVOKE ALL ON FUNCTION public.ventas_listado_unidades_agg(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ventas_listado_unidades_agg(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ventas_listado_unidades_agg(timestamptz, timestamptz) TO service_role;

COMMENT ON FUNCTION public.ventas_listado_unidades_agg(timestamptz, timestamptz) IS
  'Para el listado de ventas: suma de cantidades por venta en un rango de fecha_hora (RLS de ventas/venta_items aplica).';
