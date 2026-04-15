-- ============================================
-- Migración: Otros costos (solo rol dueño)
-- ============================================
-- Tabla otros_costos + RLS restringido a usuarios con rol "dueño" del mismo comercio.
-- ============================================

-- Tipo de costo (valores fijos según negocio)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'otro_costo_tipo') THEN
    CREATE TYPE otro_costo_tipo AS ENUM ('Fijo', 'Variable', 'Inversión');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS otros_costos (
  id BIGSERIAL PRIMARY KEY,
  comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo otro_costo_tipo NOT NULL,
  descripcion TEXT NOT NULL,
  costo NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT otros_costos_descripcion_no_vacia CHECK (length(trim(descripcion)) > 0),
  CONSTRAINT otros_costos_costo_no_negativo CHECK (costo >= 0)
);

CREATE INDEX IF NOT EXISTS idx_otros_costos_comercio_id ON otros_costos(comercio_id);
CREATE INDEX IF NOT EXISTS idx_otros_costos_usuario_id ON otros_costos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_otros_costos_tipo ON otros_costos(tipo);
CREATE INDEX IF NOT EXISTS idx_otros_costos_created_at ON otros_costos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otros_costos_comercio_created ON otros_costos(comercio_id, created_at DESC);

COMMENT ON TABLE otros_costos IS 'Costos operativos o de inversión registrados por el dueño del comercio';

-- True si el usuario autenticado tiene rol dueño (nombre en BD: dueño)
CREATE OR REPLACE FUNCTION public.usuario_es_dueno()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    INNER JOIN public.roles r ON r.id = u.rol_id
    WHERE u.id = auth.uid()
      AND u.deleted_at IS NULL
      AND lower(trim(r.nombre)) = 'dueño'
  );
$$;

ALTER TABLE otros_costos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "otros_costos_select_dueno" ON otros_costos;
DROP POLICY IF EXISTS "otros_costos_insert_dueno" ON otros_costos;
DROP POLICY IF EXISTS "otros_costos_update_dueno" ON otros_costos;
DROP POLICY IF EXISTS "otros_costos_delete_dueno" ON otros_costos;

CREATE POLICY "otros_costos_select_dueno"
  ON otros_costos FOR SELECT
  TO authenticated
  USING (
    usuario_es_dueno()
    AND comercio_id = get_user_comercio_id()
  );

CREATE POLICY "otros_costos_insert_dueno"
  ON otros_costos FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_es_dueno()
    AND comercio_id = get_user_comercio_id()
    AND usuario_id = auth.uid()
  );

CREATE POLICY "otros_costos_update_dueno"
  ON otros_costos FOR UPDATE
  TO authenticated
  USING (
    usuario_es_dueno()
    AND comercio_id = get_user_comercio_id()
  )
  WITH CHECK (
    usuario_es_dueno()
    AND comercio_id = get_user_comercio_id()
  );

CREATE POLICY "otros_costos_delete_dueno"
  ON otros_costos FOR DELETE
  TO authenticated
  USING (
    usuario_es_dueno()
    AND comercio_id = get_user_comercio_id()
  );

GRANT USAGE ON TYPE otro_costo_tipo TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE otros_costos TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE otros_costos_id_seq TO authenticated;
