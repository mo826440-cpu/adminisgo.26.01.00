-- ============================================
-- Esquema Inicial de Base de Datos
-- Adminis Go - Sistema de Gestión de Comercios
-- PostgreSQL / Supabase
-- ============================================

-- Habilitar extensión para UUIDs si es necesario
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLAS DE CONFIGURACIÓN (Primero, sin dependencias)
-- ============================================

-- Tabla: roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: planes
CREATE TABLE IF NOT EXISTS planes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    precio_mensual DECIMAL(10,2),
    precio_anual DECIMAL(10,2),
    limite_productos INTEGER,
    limite_usuarios INTEGER,
    limite_almacenes INTEGER DEFAULT 1,
    funcionalidades JSONB,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Tabla: comercios
CREATE TABLE IF NOT EXISTS comercios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    cuit_rut VARCHAR(50),
    logo_url VARCHAR(500),
    condicion_iva VARCHAR(50),
    plan_id INTEGER REFERENCES planes(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: usuarios
-- NOTA: Supabase Auth maneja autenticación, esta tabla es para datos adicionales
-- El email debe coincidir con auth.users.email
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    foto_url VARCHAR(500),
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    remember_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(500),
    categoria_padre_id INTEGER REFERENCES categorias(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: marcas
CREATE TABLE IF NOT EXISTS marcas (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    logo_url VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    nombre_razon_social VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    cuit_rut VARCHAR(50),
    contacto_principal VARCHAR(255),
    condiciones_pago VARCHAR(100),
    plazo_entrega INTEGER,
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(50),
    fecha_nacimiento DATE,
    saldo_pendiente DECIMAL(10,2) DEFAULT 0,
    total_compras DECIMAL(10,2) DEFAULT 0,
    ticket_promedio DECIMAL(10,2) DEFAULT 0,
    ultima_compra TIMESTAMP WITH TIME ZONE,
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    codigo_barras VARCHAR(100),
    codigo_interno VARCHAR(100),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER REFERENCES categorias(id),
    marca_id INTEGER REFERENCES marcas(id),
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_compra DECIMAL(10,2),
    stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(10,2) DEFAULT 0,
    unidad_medida VARCHAR(20) DEFAULT 'unidad',
    proveedor_id INTEGER REFERENCES proveedores(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(comercio_id, codigo_barras)
);

-- Tabla: ventas
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    numero_ticket VARCHAR(50) NOT NULL,
    cliente_id INTEGER REFERENCES clientes(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    descuento DECIMAL(10,2) DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'completada',
    observaciones TEXT,
    ticket_impreso BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: venta_items
CREATE TABLE IF NOT EXISTS venta_items (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: compras
CREATE TABLE IF NOT EXISTS compras (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    numero_orden VARCHAR(50) NOT NULL,
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    fecha_orden DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_recepcion DATE,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    descuento DECIMAL(10,2) DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    observaciones TEXT,
    factura_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: compra_items
CREATE TABLE IF NOT EXISTS compra_items (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad_solicitada DECIMAL(10,2) NOT NULL,
    cantidad_recibida DECIMAL(10,2),
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: movimientos_inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    stock_anterior DECIMAL(10,2) NOT NULL,
    stock_nuevo DECIMAL(10,2) NOT NULL,
    motivo VARCHAR(100),
    referencia_tipo VARCHAR(50),
    referencia_id INTEGER,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: producto_imagenes
CREATE TABLE IF NOT EXISTS producto_imagenes (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    imagen_url VARCHAR(500) NOT NULL,
    orden INTEGER DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: suscripciones
CREATE TABLE IF NOT EXISTS suscripciones (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES planes(id),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    estado VARCHAR(20) DEFAULT 'activa',
    metodo_pago VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: configuracion_comercio
CREATE TABLE IF NOT EXISTS configuracion_comercio (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL UNIQUE REFERENCES comercios(id) ON DELETE CASCADE,
    porcentaje_iva DECIMAL(5,2) DEFAULT 21.00,
    permitir_descuentos BOOLEAN DEFAULT TRUE,
    control_stock_automatico BOOLEAN DEFAULT TRUE,
    stock_minimo_global DECIMAL(10,2) DEFAULT 0,
    formato_fecha VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    formato_moneda VARCHAR(10) DEFAULT '$',
    zona_horaria VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    tema VARCHAR(20) DEFAULT 'claro',
    idioma VARCHAR(10) DEFAULT 'es',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: configuracion_usuario
CREATE TABLE IF NOT EXISTS configuracion_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    tema VARCHAR(20) DEFAULT 'sistema',
    idioma VARCHAR(10) DEFAULT 'es',
    notificaciones_activas BOOLEAN DEFAULT TRUE,
    notificaciones_stock_bajo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

-- Índices para comercios
CREATE INDEX IF NOT EXISTS idx_comercios_email ON comercios(email);
CREATE INDEX IF NOT EXISTS idx_comercios_plan_id ON comercios(plan_id);
CREATE INDEX IF NOT EXISTS idx_comercios_activo ON comercios(activo);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_comercio_id ON usuarios(comercio_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);

-- Índices para categorias
CREATE INDEX IF NOT EXISTS idx_categorias_comercio_id ON categorias(comercio_id);
CREATE INDEX IF NOT EXISTS idx_categorias_padre ON categorias(categoria_padre_id);

-- Índices para marcas
CREATE INDEX IF NOT EXISTS idx_marcas_comercio_id ON marcas(comercio_id);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_productos_comercio_id ON productos(comercio_id);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_marca_id ON productos(marca_id);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock_actual, stock_minimo);
CREATE INDEX IF NOT EXISTS idx_productos_comercio_activo ON productos(comercio_id, activo);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_comercio_id ON clientes(comercio_id);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(tipo_documento, numero_documento);

-- Índices para proveedores
CREATE INDEX IF NOT EXISTS idx_proveedores_comercio_id ON proveedores(comercio_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_cuit ON proveedores(cuit_rut);

-- Índices para ventas
CREATE INDEX IF NOT EXISTS idx_ventas_comercio_id ON ventas(comercio_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario_id ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_ventas_numero_ticket ON ventas(numero_ticket);
CREATE INDEX IF NOT EXISTS idx_ventas_comercio_fecha ON ventas(comercio_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_fecha ON ventas(cliente_id, fecha_hora);

-- Índices para venta_items
CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_producto_id ON venta_items(producto_id);

-- Índices para compras
CREATE INDEX IF NOT EXISTS idx_compras_comercio_id ON compras(comercio_id);
CREATE INDEX IF NOT EXISTS idx_compras_proveedor_id ON compras(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha_orden);

-- Índices para compra_items
CREATE INDEX IF NOT EXISTS idx_compra_items_compra_id ON compra_items(compra_id);
CREATE INDEX IF NOT EXISTS idx_compra_items_producto_id ON compra_items(producto_id);

-- Índices para movimientos_inventario
CREATE INDEX IF NOT EXISTS idx_movimientos_comercio_id ON movimientos_inventario(comercio_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto_id ON movimientos_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(created_at);

-- Índices para producto_imagenes
CREATE INDEX IF NOT EXISTS idx_producto_imagenes_producto_id ON producto_imagenes(producto_id);

-- Índices para suscripciones
CREATE INDEX IF NOT EXISTS idx_suscripciones_comercio_id ON suscripciones(comercio_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_plan_id ON suscripciones(plan_id);

-- Índices para configuracion_comercio
CREATE INDEX IF NOT EXISTS idx_config_comercio_id ON configuracion_comercio(comercio_id);

-- Índices para configuracion_usuario
CREATE INDEX IF NOT EXISTS idx_config_usuario_id ON configuracion_usuario(usuario_id);

-- ============================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_comercios_updated_at BEFORE UPDATE ON comercios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marcas_updated_at BEFORE UPDATE ON marcas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ventas_updated_at BEFORE UPDATE ON ventas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compras_updated_at BEFORE UPDATE ON compras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planes_updated_at BEFORE UPDATE ON planes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suscripciones_updated_at BEFORE UPDATE ON suscripciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracion_comercio_updated_at BEFORE UPDATE ON configuracion_comercio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracion_usuario_updated_at BEFORE UPDATE ON configuracion_usuario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

