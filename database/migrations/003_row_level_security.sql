-- ============================================
-- Row Level Security (RLS) para Multi-Tenant
-- Adminis Go - Sistema de Gestión de Comercios
-- ============================================

-- Función helper para obtener el comercio_id del usuario actual
-- Esta función asume que hay una tabla usuarios con id = auth.uid()
CREATE OR REPLACE FUNCTION get_user_comercio_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT comercio_id FROM usuarios WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================

ALTER TABLE comercios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_comercio ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_usuario ENABLE ROW LEVEL SECURITY;

-- Tablas sin RLS (datos globales):
-- roles, planes (son datos compartidos entre todos los comercios)

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- ===== COMERCIOS =====
-- Los usuarios solo pueden ver y modificar su propio comercio
CREATE POLICY "Users can view their own comercio"
  ON comercios FOR SELECT
  USING (id = get_user_comercio_id());

CREATE POLICY "Users can update their own comercio"
  ON comercios FOR UPDATE
  USING (id = get_user_comercio_id());

-- ===== USUARIOS =====
-- Los usuarios pueden ver y modificar usuarios de su mismo comercio
CREATE POLICY "Users can view usuarios from their comercio"
  ON usuarios FOR SELECT
  USING (comercio_id = get_user_comercio_id());

CREATE POLICY "Users can insert usuarios in their comercio"
  ON usuarios FOR INSERT
  WITH CHECK (comercio_id = get_user_comercio_id());

CREATE POLICY "Users can update usuarios from their comercio"
  ON usuarios FOR UPDATE
  USING (comercio_id = get_user_comercio_id());

-- ===== CATEGORIAS =====
CREATE POLICY "Users can manage categorias from their comercio"
  ON categorias FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ===== MARCAS =====
CREATE POLICY "Users can manage marcas from their comercio"
  ON marcas FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ===== PRODUCTOS =====
CREATE POLICY "Users can manage productos from their comercio"
  ON productos FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ===== CLIENTES =====
CREATE POLICY "Users can manage clientes from their comercio"
  ON clientes FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ===== PROVEEDORES =====
CREATE POLICY "Users can manage proveedores from their comercio"
  ON proveedores FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ===== VENTAS =====
CREATE POLICY "Users can manage ventas from their comercio"
  ON ventas FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ===== VENTA_ITEMS =====
-- Acceso basado en la venta padre (que tiene comercio_id)
CREATE POLICY "Users can manage venta_items from their comercio"
  ON venta_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ventas 
      WHERE ventas.id = venta_items.venta_id 
      AND ventas.comercio_id = get_user_comercio_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ventas 
      WHERE ventas.id = venta_items.venta_id 
      AND ventas.comercio_id = get_user_comercio_id()
    )
  );

-- ===== COMPRAS =====
CREATE POLICY "Users can manage compras from their comercio"
  ON compras FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ===== COMPRA_ITEMS =====
-- Acceso basado en la compra padre (que tiene comercio_id)
CREATE POLICY "Users can manage compra_items from their comercio"
  ON compra_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compras 
      WHERE compras.id = compra_items.compra_id 
      AND compras.comercio_id = get_user_comercio_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM compras 
      WHERE compras.id = compra_items.compra_id 
      AND compras.comercio_id = get_user_comercio_id()
    )
  );

-- ===== MOVIMIENTOS_INVENTARIO =====
CREATE POLICY "Users can manage movimientos from their comercio"
  ON movimientos_inventario FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ===== PRODUCTO_IMAGENES =====
-- Acceso basado en el producto padre (que tiene comercio_id)
CREATE POLICY "Users can manage producto_imagenes from their comercio"
  ON producto_imagenes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM productos 
      WHERE productos.id = producto_imagenes.producto_id 
      AND productos.comercio_id = get_user_comercio_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM productos 
      WHERE productos.id = producto_imagenes.producto_id 
      AND productos.comercio_id = get_user_comercio_id()
    )
  );

-- ===== SUSCRIPCIONES =====
CREATE POLICY "Users can manage suscripciones from their comercio"
  ON suscripciones FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ===== CONFIGURACION_COMERCIO =====
CREATE POLICY "Users can manage config_comercio from their comercio"
  ON configuracion_comercio FOR ALL
  USING (comercio_id = get_user_comercio_id())
  WITH CHECK (comercio_id = get_user_comercio_id());

-- ===== CONFIGURACION_USUARIO =====
-- Los usuarios solo pueden ver/modificar su propia configuración
CREATE POLICY "Users can view their own config"
  ON configuracion_usuario FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Users can update their own config"
  ON configuracion_usuario FOR UPDATE
  USING (usuario_id = auth.uid());

CREATE POLICY "Users can insert their own config"
  ON configuracion_usuario FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- ===== TABLAS GLOBALES (SIN RLS) =====
-- roles y planes son accesibles por todos (datos compartidos)

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Las políticas RLS se aplican automáticamente a todas las consultas
-- 2. La función get_user_comercio_id() usa SECURITY DEFINER para poder acceder a auth.uid()
-- 3. Para tablas sin comercio_id directo (venta_items, compra_items, producto_imagenes),
--    se usa EXISTS para verificar el comercio a través de la tabla padre
-- 4. Los usuarios solo pueden ver/modificar datos de su propio comercio
-- 5. Las tablas roles y planes NO tienen RLS (son datos globales compartidos)

