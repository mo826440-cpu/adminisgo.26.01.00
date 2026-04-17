-- ============================================
-- Permisos por comercio: matriz rol × módulo
-- ============================================
-- - Catálogo app_modulos + tabla comercio_rol_modulos (permitido boolean).
-- - El rol "dueño" NO tiene filas en la matriz: siempre acceso total (función usuario_tiene_permiso_modulo).
-- - No se puede guardar permisos para el rol dueño (trigger).
-- - Protección del último dueño activo (DELETE / cambio de rol / soft delete).
-- - Trigger al crear comercio: permisos por defecto (todo permitido) para roles no dueño.
-- - RLS en tablas operativas: además de comercio_id, exige permiso de módulo (o reportes donde aplica).
-- ============================================

-- ----- Catálogo de módulos -----
CREATE TABLE IF NOT EXISTS public.app_modulos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.app_modulos (codigo, nombre, orden) VALUES
  ('dashboard', 'Dashboard', 10),
  ('categorias', 'Categorías', 20),
  ('marcas', 'Marcas', 30),
  ('clientes', 'Clientes', 40),
  ('proveedores', 'Proveedores', 50),
  ('productos', 'Productos', 60),
  ('compras', 'Compras', 70),
  ('ventas', 'Ventas y POS', 80),
  ('ventas_rapidas', 'Ventas rápidas y caja', 90),
  ('reportes', 'Informes y reportes', 100),
  ('mantenimiento', 'Mantenimiento', 110),
  ('inventario', 'Inventario', 120)
ON CONFLICT (codigo) DO NOTHING;

-- ----- Matriz por comercio -----
CREATE TABLE IF NOT EXISTS public.comercio_rol_modulos (
  id BIGSERIAL PRIMARY KEY,
  comercio_id INTEGER NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  rol_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  modulo_id INTEGER NOT NULL REFERENCES public.app_modulos(id) ON DELETE CASCADE,
  permitido BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (comercio_id, rol_id, modulo_id)
);

CREATE INDEX IF NOT EXISTS idx_comercio_rol_modulos_comercio_rol
  ON public.comercio_rol_modulos (comercio_id, rol_id);

CREATE OR REPLACE FUNCTION public.set_comercio_rol_modulos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comercio_rol_modulos_updated_at ON public.comercio_rol_modulos;
CREATE TRIGGER trg_comercio_rol_modulos_updated_at
  BEFORE UPDATE ON public.comercio_rol_modulos
  FOR EACH ROW EXECUTE FUNCTION public.set_comercio_rol_modulos_updated_at();

-- No filas para rol dueño: siempre acceso total vía función
CREATE OR REPLACE FUNCTION public.comercio_rol_modulos_rechazar_dueno()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.id = NEW.rol_id AND lower(trim(r.nombre)) = 'dueño'
  ) THEN
    RAISE EXCEPTION 'El rol dueño no se configura en la matriz de permisos; tiene acceso total.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comercio_rol_modulos_no_dueno ON public.comercio_rol_modulos;
CREATE TRIGGER trg_comercio_rol_modulos_no_dueno
  BEFORE INSERT OR UPDATE ON public.comercio_rol_modulos
  FOR EACH ROW EXECUTE FUNCTION public.comercio_rol_modulos_rechazar_dueno();

-- ----- Función: permiso de módulo (dueño = siempre true) -----
CREATE OR REPLACE FUNCTION public.usuario_tiene_permiso_modulo(p_codigo text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.usuarios u
      INNER JOIN public.roles r ON r.id = u.rol_id
      WHERE u.id = auth.uid()
        AND u.deleted_at IS NULL
        AND lower(trim(r.nombre)) = 'dueño'
    )
    OR EXISTS (
      SELECT 1
      FROM public.usuarios u
      INNER JOIN public.comercio_rol_modulos crm
        ON crm.comercio_id = u.comercio_id AND crm.rol_id = u.rol_id
      INNER JOIN public.app_modulos m ON m.id = crm.modulo_id
        AND lower(trim(m.codigo)) = lower(trim(p_codigo))
      WHERE u.id = auth.uid()
        AND u.deleted_at IS NULL
        AND crm.permitido = TRUE
    );
$$;

REVOKE ALL ON FUNCTION public.usuario_tiene_permiso_modulo(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usuario_tiene_permiso_modulo(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_tiene_permiso_modulo(text) TO service_role;

COMMENT ON FUNCTION public.usuario_tiene_permiso_modulo(text) IS
  'TRUE si el usuario es dueño o tiene el módulo permitido en comercio_rol_modulos para su rol.';

-- ----- Helper ventas / venta_pagos (incluye informes) -----
CREATE OR REPLACE FUNCTION public.usuario_permiso_ventas_o_reportes()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.usuario_tiene_permiso_modulo('ventas')
    OR public.usuario_tiene_permiso_modulo('reportes');
$$;

REVOKE ALL ON FUNCTION public.usuario_permiso_ventas_o_reportes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usuario_permiso_ventas_o_reportes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_permiso_ventas_o_reportes() TO service_role;

CREATE OR REPLACE FUNCTION public.usuario_permiso_compras_o_reportes()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.usuario_tiene_permiso_modulo('compras')
    OR public.usuario_tiene_permiso_modulo('reportes');
$$;

REVOKE ALL ON FUNCTION public.usuario_permiso_compras_o_reportes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usuario_permiso_compras_o_reportes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_permiso_compras_o_reportes() TO service_role;

-- ----- Seed: todos los comercios × roles no dueño × módulos (permitido) -----
INSERT INTO public.comercio_rol_modulos (comercio_id, rol_id, modulo_id, permitido)
SELECT c.id, r.id, m.id, TRUE
FROM public.comercios c
CROSS JOIN public.roles r
CROSS JOIN public.app_modulos m
WHERE lower(trim(r.nombre)) <> 'dueño'
ON CONFLICT (comercio_id, rol_id, modulo_id) DO NOTHING;

-- ----- Nuevos comercios -----
CREATE OR REPLACE FUNCTION public.seed_comercio_rol_modulos_nuevo_comercio()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.comercio_rol_modulos (comercio_id, rol_id, modulo_id, permitido)
  SELECT NEW.id, r.id, m.id, TRUE
  FROM public.roles r
  CROSS JOIN public.app_modulos m
  WHERE lower(trim(r.nombre)) <> 'dueño'
  ON CONFLICT (comercio_id, rol_id, modulo_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comercios_seed_permisos ON public.comercios;
CREATE TRIGGER trg_comercios_seed_permisos
  AFTER INSERT ON public.comercios
  FOR EACH ROW EXECUTE FUNCTION public.seed_comercio_rol_modulos_nuevo_comercio();

-- ----- Proteger último dueño -----
CREATE OR REPLACE FUNCTION public.trg_usuarios_proteger_ultimo_dueno()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_cnt integer;
  v_es_dueno_old boolean;
  v_es_dueno_new boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = OLD.rol_id AND lower(trim(r.nombre)) = 'dueño'
    ) INTO v_es_dueno_old;
    IF v_es_dueno_old THEN
      SELECT COUNT(*)::integer INTO v_cnt
      FROM public.usuarios u
      INNER JOIN public.roles r ON r.id = u.rol_id AND lower(trim(r.nombre)) = 'dueño'
      WHERE u.comercio_id = OLD.comercio_id
        AND u.deleted_at IS NULL
        AND u.id <> OLD.id;
      IF COALESCE(v_cnt, 0) = 0 THEN
        RAISE EXCEPTION 'No se puede eliminar el último usuario con rol dueño del comercio.';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.roles r WHERE r.id = OLD.rol_id AND lower(trim(r.nombre)) = 'dueño'
    ) INTO v_es_dueno_old;
    SELECT EXISTS (
      SELECT 1 FROM public.roles r WHERE r.id = NEW.rol_id AND lower(trim(r.nombre)) = 'dueño'
    ) INTO v_es_dueno_new;

    IF OLD.rol_id IS DISTINCT FROM NEW.rol_id AND v_es_dueno_old AND NOT v_es_dueno_new THEN
      SELECT COUNT(*)::integer INTO v_cnt
      FROM public.usuarios u
      INNER JOIN public.roles r ON r.id = u.rol_id AND lower(trim(r.nombre)) = 'dueño'
      WHERE u.comercio_id = NEW.comercio_id
        AND u.deleted_at IS NULL
        AND u.id <> NEW.id;
      IF COALESCE(v_cnt, 0) = 0 THEN
        RAISE EXCEPTION 'Debe existir al menos un usuario con rol dueño en el comercio.';
      END IF;
    END IF;

    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL AND v_es_dueno_new THEN
      SELECT COUNT(*)::integer INTO v_cnt
      FROM public.usuarios u
      INNER JOIN public.roles r ON r.id = u.rol_id AND lower(trim(r.nombre)) = 'dueño'
      WHERE u.comercio_id = NEW.comercio_id
        AND u.deleted_at IS NULL
        AND u.id <> NEW.id;
      IF COALESCE(v_cnt, 0) = 0 THEN
        RAISE EXCEPTION 'No se puede desactivar o eliminar al único dueño activo del comercio.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_proteger_ultimo_dueno ON public.usuarios;
CREATE TRIGGER trg_usuarios_proteger_ultimo_dueno
  BEFORE UPDATE OR DELETE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.trg_usuarios_proteger_ultimo_dueno();

-- ----- RLS app_modulos -----
ALTER TABLE public.app_modulos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_modulos_select_authenticated" ON public.app_modulos;
CREATE POLICY "app_modulos_select_authenticated"
  ON public.app_modulos FOR SELECT TO authenticated
  USING (true);

-- ----- RLS comercio_rol_modulos -----
ALTER TABLE public.comercio_rol_modulos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_select_comercio" ON public.comercio_rol_modulos;
CREATE POLICY "crm_select_comercio"
  ON public.comercio_rol_modulos FOR SELECT TO authenticated
  USING (
    comercio_id = get_user_comercio_id()
    AND (
      usuario_es_dueno()
      OR rol_id = (SELECT rol_id FROM public.usuarios WHERE id = auth.uid() AND deleted_at IS NULL)
    )
  );

DROP POLICY IF EXISTS "crm_write_dueno" ON public.comercio_rol_modulos;
CREATE POLICY "crm_write_dueno"
  ON public.comercio_rol_modulos FOR INSERT TO authenticated
  WITH CHECK (comercio_id = get_user_comercio_id() AND usuario_es_dueno());

DROP POLICY IF EXISTS "crm_update_dueno" ON public.comercio_rol_modulos;
CREATE POLICY "crm_update_dueno"
  ON public.comercio_rol_modulos FOR UPDATE TO authenticated
  USING (comercio_id = get_user_comercio_id() AND usuario_es_dueno())
  WITH CHECK (comercio_id = get_user_comercio_id() AND usuario_es_dueno());

DROP POLICY IF EXISTS "crm_delete_dueno" ON public.comercio_rol_modulos;
CREATE POLICY "crm_delete_dueno"
  ON public.comercio_rol_modulos FOR DELETE TO authenticated
  USING (comercio_id = get_user_comercio_id() AND usuario_es_dueno());

GRANT SELECT ON public.app_modulos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comercio_rol_modulos TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.comercio_rol_modulos_id_seq TO authenticated;

-- ----- Políticas usuarios (dueño gestiona; cada uno el propio) -----
DROP POLICY IF EXISTS "Users can view usuarios from their comercio" ON public.usuarios;
CREATE POLICY "Users can view usuarios from their comercio"
  ON public.usuarios FOR SELECT TO authenticated
  USING (
    comercio_id = get_user_comercio_id()
    AND (id = auth.uid() OR usuario_es_dueno())
  );

DROP POLICY IF EXISTS "Users can insert usuarios in their comercio" ON public.usuarios;
CREATE POLICY "Users can insert usuarios in their comercio"
  ON public.usuarios FOR INSERT TO authenticated
  WITH CHECK (comercio_id = get_user_comercio_id() AND usuario_es_dueno());

DROP POLICY IF EXISTS "Users can update usuarios from their comercio" ON public.usuarios;
CREATE POLICY "Users can update usuarios from their comercio"
  ON public.usuarios FOR UPDATE TO authenticated
  USING (
    comercio_id = get_user_comercio_id()
    AND (id = auth.uid() OR usuario_es_dueno())
  )
  WITH CHECK (
    comercio_id = get_user_comercio_id()
    AND (id = auth.uid() OR usuario_es_dueno())
  );

DROP POLICY IF EXISTS "Users can update their own comercio" ON public.comercios;
CREATE POLICY "Users can update their own comercio"
  ON public.comercios FOR UPDATE TO authenticated
  USING (id = get_user_comercio_id() AND usuario_es_dueno())
  WITH CHECK (id = get_user_comercio_id() AND usuario_es_dueno());

DROP POLICY IF EXISTS "Users can manage config_comercio from their comercio" ON public.configuracion_comercio;
CREATE POLICY "Users can manage config_comercio from their comercio"
  ON public.configuracion_comercio FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND usuario_es_dueno())
  WITH CHECK (comercio_id = get_user_comercio_id() AND usuario_es_dueno());

-- ----- Reemplazar políticas operativas con chequeo de módulo -----
DROP POLICY IF EXISTS "Users can manage categorias from their comercio" ON public.categorias;
CREATE POLICY "Users can manage categorias from their comercio"
  ON public.categorias FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('categorias'))
  WITH CHECK (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('categorias'));

DROP POLICY IF EXISTS "Users can manage marcas from their comercio" ON public.marcas;
CREATE POLICY "Users can manage marcas from their comercio"
  ON public.marcas FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('marcas'))
  WITH CHECK (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('marcas'));

DROP POLICY IF EXISTS "Users can manage productos from their comercio" ON public.productos;
CREATE POLICY "Users can manage productos from their comercio"
  ON public.productos FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('productos'))
  WITH CHECK (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('productos'));

DROP POLICY IF EXISTS "Users can manage clientes from their comercio" ON public.clientes;
CREATE POLICY "Users can manage clientes from their comercio"
  ON public.clientes FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('clientes'))
  WITH CHECK (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('clientes'));

DROP POLICY IF EXISTS "Users can manage proveedores from their comercio" ON public.proveedores;
CREATE POLICY "Users can manage proveedores from their comercio"
  ON public.proveedores FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('proveedores'))
  WITH CHECK (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('proveedores'));

DROP POLICY IF EXISTS "Users can manage ventas from their comercio" ON public.ventas;
CREATE POLICY "Users can manage ventas from their comercio"
  ON public.ventas FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND public.usuario_permiso_ventas_o_reportes())
  WITH CHECK (comercio_id = get_user_comercio_id() AND public.usuario_permiso_ventas_o_reportes());

DROP POLICY IF EXISTS "Users can manage venta_items from their comercio" ON public.venta_items;
CREATE POLICY "Users can manage venta_items from their comercio"
  ON public.venta_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_items.venta_id AND v.comercio_id = get_user_comercio_id()
    )
    AND public.usuario_permiso_ventas_o_reportes()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_items.venta_id AND v.comercio_id = get_user_comercio_id()
    )
    AND public.usuario_permiso_ventas_o_reportes()
  );

DROP POLICY IF EXISTS "Users can manage compras from their comercio" ON public.compras;
CREATE POLICY "Users can manage compras from their comercio"
  ON public.compras FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND public.usuario_permiso_compras_o_reportes())
  WITH CHECK (comercio_id = get_user_comercio_id() AND public.usuario_permiso_compras_o_reportes());

DROP POLICY IF EXISTS "Users can manage compra_items from their comercio" ON public.compra_items;
CREATE POLICY "Users can manage compra_items from their comercio"
  ON public.compra_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.compras c
      WHERE c.id = compra_items.compra_id AND c.comercio_id = get_user_comercio_id()
    )
    AND public.usuario_permiso_compras_o_reportes()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compras c
      WHERE c.id = compra_items.compra_id AND c.comercio_id = get_user_comercio_id()
    )
    AND public.usuario_permiso_compras_o_reportes()
  );

DROP POLICY IF EXISTS "Users can manage movimientos from their comercio" ON public.movimientos_inventario;
CREATE POLICY "Users can manage movimientos from their comercio"
  ON public.movimientos_inventario FOR ALL TO authenticated
  USING (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('productos'))
  WITH CHECK (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('productos'));

DROP POLICY IF EXISTS "Users can manage producto_imagenes from their comercio" ON public.producto_imagenes;
CREATE POLICY "Users can manage producto_imagenes from their comercio"
  ON public.producto_imagenes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.productos p
      WHERE p.id = producto_imagenes.producto_id AND p.comercio_id = get_user_comercio_id()
    )
    AND public.usuario_tiene_permiso_modulo('productos')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.productos p
      WHERE p.id = producto_imagenes.producto_id AND p.comercio_id = get_user_comercio_id()
    )
    AND public.usuario_tiene_permiso_modulo('productos')
  );

DROP POLICY IF EXISTS "Users can manage venta_pagos from their comercio" ON public.venta_pagos;
CREATE POLICY "Users can manage venta_pagos from their comercio"
  ON public.venta_pagos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_pagos.venta_id AND v.comercio_id = get_user_comercio_id()
    )
    AND public.usuario_permiso_ventas_o_reportes()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_pagos.venta_id AND v.comercio_id = get_user_comercio_id()
    )
    AND public.usuario_permiso_ventas_o_reportes()
  );

DROP POLICY IF EXISTS "Users can manage compra_pagos from their comercio" ON public.compra_pagos;
CREATE POLICY "Users can manage compra_pagos from their comercio"
  ON public.compra_pagos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.compras c
      WHERE c.id = compra_pagos.compra_id AND c.comercio_id = get_user_comercio_id()
    )
    AND public.usuario_permiso_compras_o_reportes()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compras c
      WHERE c.id = compra_pagos.compra_id AND c.comercio_id = get_user_comercio_id()
    )
    AND public.usuario_permiso_compras_o_reportes()
  );

-- Ventas rápidas / caja: solo si existen (p. ej. si se eliminó la tabla en otro script, no falla el resto de la migración)
DO $pol_ventas_rapidas$
BEGIN
  IF to_regclass('public.ventas_rapidas') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can manage ventas_rapidas from their comercio" ON public.ventas_rapidas;
    CREATE POLICY "Users can manage ventas_rapidas from their comercio"
      ON public.ventas_rapidas FOR ALL TO authenticated
      USING (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('ventas_rapidas'))
      WITH CHECK (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('ventas_rapidas'));
  END IF;

  IF to_regclass('public.historial_cajas') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can manage historial_cajas from their comercio" ON public.historial_cajas;
    CREATE POLICY "Users can manage historial_cajas from their comercio"
      ON public.historial_cajas FOR ALL TO authenticated
      USING (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('ventas_rapidas'))
      WITH CHECK (comercio_id = get_user_comercio_id() AND public.usuario_tiene_permiso_modulo('ventas_rapidas'));
  END IF;
END;
$pol_ventas_rapidas$;

-- Solo un usuario que ya sea dueño puede asignar el rol dueño (evita escalación vía UPDATE propio)
CREATE OR REPLACE FUNCTION public.trg_usuarios_solo_dueno_asigna_rol_dueno()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.rol_id IS DISTINCT FROM NEW.rol_id THEN
    IF EXISTS (SELECT 1 FROM public.roles r WHERE r.id = NEW.rol_id AND lower(trim(r.nombre)) = 'dueño') THEN
      IF NOT public.usuario_es_dueno() THEN
        RAISE EXCEPTION 'Solo un dueño puede asignar el rol dueño.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_solo_dueno_asigna_rol_dueno ON public.usuarios;
CREATE TRIGGER trg_usuarios_solo_dueno_asigna_rol_dueno
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.trg_usuarios_solo_dueno_asigna_rol_dueno();
