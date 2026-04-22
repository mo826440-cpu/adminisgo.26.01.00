-- ============================================
-- RLS: permisos de módulo — evaluar una vez por consulta (InitPlan)
-- ============================================
-- La migración 038 añadió `usuario_permiso_*` / `usuario_tiene_permiso_modulo`
-- en políticas RLS. Sin subconsulta escalar, PostgreSQL suele invocar esas
-- funciones STABLE **por cada fila** candidata → coste enorme en tablas como
-- `ventas` (miles de filas) y 500/timeouts bajo carga o con varias peticiones
-- PostgREST en paralelo.
--
-- Patrón: `AND (SELECT public.usuario_permiso_ventas_o_reportes())` en lugar de
-- `AND public.usuario_permiso_ventas_o_reportes()` para que el planificador
-- trate el resultado como constante de consulta (misma semántica).
-- ============================================

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
    AND (SELECT public.usuario_permiso_ventas_o_reportes())
  GROUP BY vi.venta_id;
$$;

COMMENT ON FUNCTION public.ventas_listado_unidades_agg(timestamptz, timestamptz) IS
  'Listado ventas: SUM(cantidad) por venta. DEFINER; permiso vía subselect InitPlan.';

-- ----- Políticas operativas (misma lógica que 038, solo envuelve permisos) -----

DROP POLICY IF EXISTS "Users can manage categorias from their comercio" ON public.categorias;
CREATE POLICY "Users can manage categorias from their comercio"
  ON public.categorias FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('categorias')))
  WITH CHECK (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('categorias')));

DROP POLICY IF EXISTS "Users can manage marcas from their comercio" ON public.marcas;
CREATE POLICY "Users can manage marcas from their comercio"
  ON public.marcas FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('marcas')))
  WITH CHECK (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('marcas')));

DROP POLICY IF EXISTS "Users can manage productos from their comercio" ON public.productos;
CREATE POLICY "Users can manage productos from their comercio"
  ON public.productos FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('productos')))
  WITH CHECK (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('productos')));

DROP POLICY IF EXISTS "Users can manage clientes from their comercio" ON public.clientes;
CREATE POLICY "Users can manage clientes from their comercio"
  ON public.clientes FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('clientes')))
  WITH CHECK (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('clientes')));

DROP POLICY IF EXISTS "Users can manage proveedores from their comercio" ON public.proveedores;
CREATE POLICY "Users can manage proveedores from their comercio"
  ON public.proveedores FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('proveedores')))
  WITH CHECK (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('proveedores')));

DROP POLICY IF EXISTS "Users can manage ventas from their comercio" ON public.ventas;
CREATE POLICY "Users can manage ventas from their comercio"
  ON public.ventas FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_permiso_ventas_o_reportes()))
  WITH CHECK (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_permiso_ventas_o_reportes()));

DROP POLICY IF EXISTS "Users can manage venta_items from their comercio" ON public.venta_items;
CREATE POLICY "Users can manage venta_items from their comercio"
  ON public.venta_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_items.venta_id AND v.comercio_id = get_user_comercio_id()
    )
    AND (SELECT public.usuario_permiso_ventas_o_reportes())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_items.venta_id AND v.comercio_id = get_user_comercio_id()
    )
    AND (SELECT public.usuario_permiso_ventas_o_reportes())
  );

DROP POLICY IF EXISTS "Users can manage compras from their comercio" ON public.compras;
CREATE POLICY "Users can manage compras from their comercio"
  ON public.compras FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_permiso_compras_o_reportes()))
  WITH CHECK (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_permiso_compras_o_reportes()));

DROP POLICY IF EXISTS "Users can manage compra_items from their comercio" ON public.compra_items;
CREATE POLICY "Users can manage compra_items from their comercio"
  ON public.compra_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.compras c
      WHERE c.id = compra_items.compra_id AND c.comercio_id = get_user_comercio_id()
    )
    AND (SELECT public.usuario_permiso_compras_o_reportes())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compras c
      WHERE c.id = compra_items.compra_id AND c.comercio_id = get_user_comercio_id()
    )
    AND (SELECT public.usuario_permiso_compras_o_reportes())
  );

DROP POLICY IF EXISTS "Users can manage movimientos from their comercio" ON public.movimientos_inventario;
CREATE POLICY "Users can manage movimientos from their comercio"
  ON public.movimientos_inventario FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('productos')))
  WITH CHECK (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('productos')));

DROP POLICY IF EXISTS "Users can manage producto_imagenes from their comercio" ON public.producto_imagenes;
CREATE POLICY "Users can manage producto_imagenes from their comercio"
  ON public.producto_imagenes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.productos p
      WHERE p.id = producto_imagenes.producto_id AND p.comercio_id = get_user_comercio_id()
    )
    AND (SELECT public.usuario_tiene_permiso_modulo('productos'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.productos p
      WHERE p.id = producto_imagenes.producto_id AND p.comercio_id = get_user_comercio_id()
    )
    AND (SELECT public.usuario_tiene_permiso_modulo('productos'))
  );

DROP POLICY IF EXISTS "Users can manage venta_pagos from their comercio" ON public.venta_pagos;
CREATE POLICY "Users can manage venta_pagos from their comercio"
  ON public.venta_pagos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_pagos.venta_id AND v.comercio_id = get_user_comercio_id()
    )
    AND (SELECT public.usuario_permiso_ventas_o_reportes())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_pagos.venta_id AND v.comercio_id = get_user_comercio_id()
    )
    AND (SELECT public.usuario_permiso_ventas_o_reportes())
  );

DROP POLICY IF EXISTS "Users can manage compra_pagos from their comercio" ON public.compra_pagos;
CREATE POLICY "Users can manage compra_pagos from their comercio"
  ON public.compra_pagos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.compras c
      WHERE c.id = compra_pagos.compra_id AND c.comercio_id = get_user_comercio_id()
    )
    AND (SELECT public.usuario_permiso_compras_o_reportes())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compras c
      WHERE c.id = compra_pagos.compra_id AND c.comercio_id = get_user_comercio_id()
    )
    AND (SELECT public.usuario_permiso_compras_o_reportes())
  );

DO $pol_ventas_rapidas$
BEGIN
  IF to_regclass('public.ventas_rapidas') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can manage ventas_rapidas from their comercio" ON public.ventas_rapidas;
    CREATE POLICY "Users can manage ventas_rapidas from their comercio"
      ON public.ventas_rapidas FOR ALL TO authenticated
      USING (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('ventas_rapidas')))
      WITH CHECK (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('ventas_rapidas')));
  END IF;

  IF to_regclass('public.historial_cajas') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can manage historial_cajas from their comercio" ON public.historial_cajas;
    CREATE POLICY "Users can manage historial_cajas from their comercio"
      ON public.historial_cajas FOR ALL TO authenticated
      USING (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('ventas_rapidas')))
      WITH CHECK (comercio_id = get_user_comercio_id() AND (SELECT public.usuario_tiene_permiso_modulo('ventas_rapidas')));
  END IF;
END;
$pol_ventas_rapidas$;
