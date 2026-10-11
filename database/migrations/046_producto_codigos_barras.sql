-- Varios códigos de barras por producto, con observación opcional.
-- No borra productos.codigo_barras ni productos.codigo_interno.
-- Los códigos repetidos dentro del mismo comercio (solo por espacios al recortar)
-- no se copian: quedan en la columna original y se listan al final.

CREATE TABLE IF NOT EXISTS public.producto_codigos_barras (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  comercio_id INTEGER NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  observacion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT producto_codigos_barras_codigo_no_vacio CHECK (btrim(codigo) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS producto_codigos_barras_comercio_codigo_key
  ON public.producto_codigos_barras (comercio_id, codigo);

CREATE INDEX IF NOT EXISTS idx_producto_codigos_barras_producto_id
  ON public.producto_codigos_barras (producto_id);

CREATE OR REPLACE FUNCTION public.set_producto_codigo_barras_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comercio INTEGER;
BEGIN
  SELECT p.comercio_id INTO v_comercio
  FROM public.productos p
  WHERE p.id = NEW.producto_id;

  IF v_comercio IS NULL THEN
    RAISE EXCEPTION 'codigo_barras_producto_inexistente';
  END IF;

  NEW.comercio_id := v_comercio;
  NEW.codigo := btrim(NEW.codigo);
  IF NEW.observacion IS NOT NULL THEN
    NEW.observacion := NULLIF(btrim(NEW.observacion), '');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.productos p
    WHERE p.comercio_id = NEW.comercio_id
      AND p.id <> NEW.producto_id
      AND p.codigo_barras IS NOT NULL
      AND btrim(p.codigo_barras) = NEW.codigo
  ) THEN
    RAISE EXCEPTION 'codigo_barras_en_uso';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_producto_codigo_barras_row ON public.producto_codigos_barras;
CREATE TRIGGER trigger_set_producto_codigo_barras_row
  BEFORE INSERT OR UPDATE OF producto_id, codigo, observacion
  ON public.producto_codigos_barras
  FOR EACH ROW
  EXECUTE FUNCTION public.set_producto_codigo_barras_row();

CREATE OR REPLACE FUNCTION public.validar_producto_codigo_barras_columna()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_codigo TEXT;
BEGIN
  v_codigo := NULLIF(btrim(COALESCE(NEW.codigo_barras, '')), '');
  IF v_codigo IS NULL OR NEW.comercio_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.producto_codigos_barras c
    WHERE c.comercio_id = NEW.comercio_id
      AND c.producto_id <> NEW.id
      AND c.codigo = v_codigo
  ) THEN
    RAISE EXCEPTION 'codigo_barras_en_uso';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validar_producto_codigo_barras_columna ON public.productos;
CREATE TRIGGER trigger_validar_producto_codigo_barras_columna
  BEFORE INSERT OR UPDATE OF codigo_barras, comercio_id
  ON public.productos
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_producto_codigo_barras_columna();

INSERT INTO public.producto_codigos_barras (producto_id, comercio_id, codigo, observacion, orden)
SELECT p.id, p.comercio_id, btrim(p.codigo_barras), NULL, 0
FROM public.productos p
WHERE p.codigo_barras IS NOT NULL
  AND btrim(p.codigo_barras) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.producto_codigos_barras c
    WHERE c.producto_id = p.id
      AND c.codigo = btrim(p.codigo_barras)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.productos otro
    WHERE otro.comercio_id = p.comercio_id
      AND otro.id <> p.id
      AND otro.codigo_barras IS NOT NULL
      AND btrim(otro.codigo_barras) = btrim(p.codigo_barras)
  );

ALTER TABLE public.producto_codigos_barras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read producto_codigos_barras from their comercio"
  ON public.producto_codigos_barras;
CREATE POLICY "Users can read producto_codigos_barras from their comercio"
  ON public.producto_codigos_barras
  FOR SELECT
  TO authenticated
  USING (
    comercio_id = get_user_comercio_id()
    AND (
      (SELECT public.usuario_tiene_permiso_modulo('productos'))
      OR (SELECT public.usuario_permiso_ventas_o_reportes())
      OR (SELECT public.usuario_permiso_compras_o_reportes())
    )
  );

DROP POLICY IF EXISTS "Users can insert producto_codigos_barras from their comercio"
  ON public.producto_codigos_barras;
CREATE POLICY "Users can insert producto_codigos_barras from their comercio"
  ON public.producto_codigos_barras
  FOR INSERT
  TO authenticated
  WITH CHECK (
    comercio_id = get_user_comercio_id()
    AND (SELECT public.usuario_tiene_permiso_modulo('productos'))
  );

DROP POLICY IF EXISTS "Users can update producto_codigos_barras from their comercio"
  ON public.producto_codigos_barras;
CREATE POLICY "Users can update producto_codigos_barras from their comercio"
  ON public.producto_codigos_barras
  FOR UPDATE
  TO authenticated
  USING (
    comercio_id = get_user_comercio_id()
    AND (SELECT public.usuario_tiene_permiso_modulo('productos'))
  )
  WITH CHECK (
    comercio_id = get_user_comercio_id()
    AND (SELECT public.usuario_tiene_permiso_modulo('productos'))
  );

DROP POLICY IF EXISTS "Users can delete producto_codigos_barras from their comercio"
  ON public.producto_codigos_barras;
CREATE POLICY "Users can delete producto_codigos_barras from their comercio"
  ON public.producto_codigos_barras
  FOR DELETE
  TO authenticated
  USING (
    comercio_id = get_user_comercio_id()
    AND (SELECT public.usuario_tiene_permiso_modulo('productos'))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.producto_codigos_barras TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.producto_codigos_barras_id_seq TO authenticated;

-- Conflictos que quedaron solo en productos.codigo_barras. Si no hay filas, no hay nada que revisar.
SELECT
  p.comercio_id,
  btrim(p.codigo_barras) AS codigo,
  array_agg(p.id ORDER BY p.id) AS producto_ids,
  array_agg(p.nombre ORDER BY p.id) AS nombres
FROM public.productos p
WHERE p.codigo_barras IS NOT NULL
  AND btrim(p.codigo_barras) <> ''
GROUP BY p.comercio_id, btrim(p.codigo_barras)
HAVING COUNT(*) > 1;
