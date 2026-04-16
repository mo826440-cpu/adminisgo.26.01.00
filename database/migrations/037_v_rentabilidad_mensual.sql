-- ============================================
-- Vista: v_rentabilidad_mensual
-- ============================================
-- Agrupa por comercio_id, año y mes calendario.
-- - Ingresos: suma de ventas.total (ventas no eliminadas).
-- - Costo mercadería: suma de compras.total (órdenes no eliminadas, por fecha_orden).
-- - Gastos operativos: suma de otros_costos.costo solo para tipos Fijo y Variable.
-- - utilidad_neta = ingresos - costo_mercaderia - gastos_operativos
-- - margen_porcentaje = (utilidad_neta / ingresos) * 100 si ingresos > 0, si no 0.
--
-- RLS: la vista usa security_invoker (PostgreSQL 15+) para evaluar las políticas
-- de las tablas base con el rol que consulta (p. ej. authenticated).
-- Requiere GRANT SELECT a authenticated (PostgREST).
--
-- Nota zona horaria: EXTRACT sobre timestamptz usa la zona de la sesión del servidor
-- (en Supabase suele ser UTC). Si necesitás alinear al huso local del negocio,
-- reemplazá las expresiones de fecha por AT TIME ZONE 'America/Argentina/Buenos_Aires'.
-- ============================================

DROP VIEW IF EXISTS public.v_rentabilidad_mensual;

CREATE VIEW public.v_rentabilidad_mensual
WITH (security_invoker = true)
AS
WITH ventas_mes AS (
  SELECT
    v.comercio_id,
    EXTRACT(YEAR FROM v.fecha_hora)::integer AS anio,
    EXTRACT(MONTH FROM v.fecha_hora)::integer AS mes,
    SUM(COALESCE(v.total, 0))::numeric(15, 2) AS ingresos
  FROM public.ventas v
  WHERE v.deleted_at IS NULL
  GROUP BY v.comercio_id, EXTRACT(YEAR FROM v.fecha_hora), EXTRACT(MONTH FROM v.fecha_hora)
),
compras_mes AS (
  SELECT
    c.comercio_id,
    EXTRACT(YEAR FROM c.fecha_orden)::integer AS anio,
    EXTRACT(MONTH FROM c.fecha_orden)::integer AS mes,
    SUM(COALESCE(c.total, 0))::numeric(15, 2) AS costo_mercaderia
  FROM public.compras c
  WHERE c.deleted_at IS NULL
  GROUP BY c.comercio_id, EXTRACT(YEAR FROM c.fecha_orden), EXTRACT(MONTH FROM c.fecha_orden)
),
gastos_mes AS (
  SELECT
    o.comercio_id,
    EXTRACT(YEAR FROM o.created_at)::integer AS anio,
    EXTRACT(MONTH FROM o.created_at)::integer AS mes,
    SUM(COALESCE(o.costo, 0))::numeric(15, 2) AS gastos_operativos
  FROM public.otros_costos o
  WHERE o.tipo IN ('Fijo'::public.otro_costo_tipo, 'Variable'::public.otro_costo_tipo)
  GROUP BY o.comercio_id, EXTRACT(YEAR FROM o.created_at), EXTRACT(MONTH FROM o.created_at)
),
claves AS (
  SELECT comercio_id, anio, mes FROM ventas_mes
  UNION
  SELECT comercio_id, anio, mes FROM compras_mes
  UNION
  SELECT comercio_id, anio, mes FROM gastos_mes
)
SELECT
  k.comercio_id,
  k.anio,
  k.mes,
  make_date(k.anio, k.mes, 1)::date AS periodo,
  COALESCE(vm.ingresos, 0)::numeric(15, 2) AS ingresos,
  COALESCE(cm.costo_mercaderia, 0)::numeric(15, 2) AS costo_mercaderia,
  COALESCE(gm.gastos_operativos, 0)::numeric(15, 2) AS gastos_operativos,
  (COALESCE(cm.costo_mercaderia, 0) + COALESCE(gm.gastos_operativos, 0))::numeric(15, 2) AS egresos_totales,
  (
    COALESCE(vm.ingresos, 0)
    - COALESCE(cm.costo_mercaderia, 0)
    - COALESCE(gm.gastos_operativos, 0)
  )::numeric(15, 2) AS utilidad_neta,
  COALESCE(
    CASE
      WHEN COALESCE(vm.ingresos, 0) > 0 THEN
        ROUND(
          (
            (COALESCE(vm.ingresos, 0) - COALESCE(cm.costo_mercaderia, 0) - COALESCE(gm.gastos_operativos, 0))
            / NULLIF(vm.ingresos, 0)
          ) * 100::numeric,
          2
        )
      ELSE 0::numeric
    END,
    0
  )::numeric(10, 2) AS margen_porcentaje
FROM claves k
LEFT JOIN ventas_mes vm
  ON vm.comercio_id = k.comercio_id AND vm.anio = k.anio AND vm.mes = k.mes
LEFT JOIN compras_mes cm
  ON cm.comercio_id = k.comercio_id AND cm.anio = k.anio AND cm.mes = k.mes
LEFT JOIN gastos_mes gm
  ON gm.comercio_id = k.comercio_id AND gm.anio = k.anio AND gm.mes = k.mes;

COMMENT ON VIEW public.v_rentabilidad_mensual IS
  'Mensual: ingresos (ventas), costo mercadería (compras), gastos operativos (otros_costos Fijo/Variable), utilidad y margen %';

GRANT SELECT ON public.v_rentabilidad_mensual TO authenticated;
GRANT SELECT ON public.v_rentabilidad_mensual TO service_role;
