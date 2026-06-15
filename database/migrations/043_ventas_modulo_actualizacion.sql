-- ============================================
-- 043: Módulo Ventas — preferible, formas de pago, cancelación
-- ============================================
-- - Campo preferible en clientes y productos (default en POS)
-- - Catálogo formas_pago por comercio
-- - Ventas canceladas excluidas de rentabilidad
-- Nota: ventas.updated_at cumple el rol de fecha_actualizacion pedida en specs.

-- 1. Preferible en clientes y productos
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS preferible BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS preferible BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_clientes_comercio_preferible
  ON public.clientes(comercio_id) WHERE preferible = TRUE;

CREATE INDEX IF NOT EXISTS idx_productos_comercio_preferible
  ON public.productos(comercio_id) WHERE preferible = TRUE;

-- 2. Tabla formas de pago
CREATE TABLE IF NOT EXISTS public.formas_pago (
  id SERIAL PRIMARY KEY,
  comercio_id INTEGER NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  preferible BOOLEAN NOT NULL DEFAULT FALSE,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (comercio_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_formas_pago_comercio ON public.formas_pago(comercio_id);
CREATE INDEX IF NOT EXISTS idx_formas_pago_comercio_preferible
  ON public.formas_pago(comercio_id) WHERE preferible = TRUE;

DROP TRIGGER IF EXISTS update_formas_pago_updated_at ON public.formas_pago;
CREATE TRIGGER update_formas_pago_updated_at
  BEFORE UPDATE ON public.formas_pago
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Un solo preferible por comercio (clientes, productos, formas_pago)
CREATE OR REPLACE FUNCTION public.enforce_single_preferible_cliente()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.preferible IS TRUE THEN
    UPDATE public.clientes
    SET preferible = FALSE
    WHERE comercio_id = NEW.comercio_id AND id <> NEW.id AND preferible = TRUE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_preferible_cliente ON public.clientes;
CREATE TRIGGER trg_single_preferible_cliente
  AFTER INSERT OR UPDATE OF preferible ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_preferible_cliente();

CREATE OR REPLACE FUNCTION public.enforce_single_preferible_producto()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.preferible IS TRUE THEN
    UPDATE public.productos
    SET preferible = FALSE
    WHERE comercio_id = NEW.comercio_id AND id <> NEW.id AND preferible = TRUE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_preferible_producto ON public.productos;
CREATE TRIGGER trg_single_preferible_producto
  AFTER INSERT OR UPDATE OF preferible ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_preferible_producto();

CREATE OR REPLACE FUNCTION public.enforce_single_preferible_forma_pago()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.preferible IS TRUE THEN
    UPDATE public.formas_pago
    SET preferible = FALSE
    WHERE comercio_id = NEW.comercio_id AND id <> NEW.id AND preferible = TRUE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_preferible_forma_pago ON public.formas_pago;
CREATE TRIGGER trg_single_preferible_forma_pago
  AFTER INSERT OR UPDATE OF preferible ON public.formas_pago
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_preferible_forma_pago();

-- 4. RLS formas_pago (mismo criterio que ventas)
ALTER TABLE public.formas_pago ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage formas_pago from their comercio" ON public.formas_pago;
CREATE POLICY "Users can manage formas_pago from their comercio"
  ON public.formas_pago FOR ALL TO authenticated
  USING (
    comercio_id = public.get_user_comercio_id()
    AND (SELECT public.usuario_permiso_ventas_o_reportes())
  )
  WITH CHECK (
    comercio_id = public.get_user_comercio_id()
    AND (SELECT public.usuario_permiso_ventas_o_reportes())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.formas_pago TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.formas_pago_id_seq TO authenticated;

-- 5. Vista rentabilidad: excluir ventas canceladas
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
    AND COALESCE(v.estado, 'completada') <> 'cancelada'
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
  'Mensual: ingresos (ventas no canceladas), costo mercadería, gastos operativos, utilidad y margen %';

GRANT SELECT ON public.v_rentabilidad_mensual TO authenticated;
GRANT SELECT ON public.v_rentabilidad_mensual TO service_role;

COMMENT ON COLUMN public.clientes.preferible IS 'Cliente por defecto al cargar una venta (uno por comercio)';
COMMENT ON COLUMN public.productos.preferible IS 'Producto por defecto al cargar una venta (uno por comercio)';
COMMENT ON COLUMN public.formas_pago.preferible IS 'Forma de pago por defecto al cargar una venta (una por comercio)';
