-- ============================================
-- Datos Iniciales
-- Adminis Go - Sistema de Gestión de Comercios
-- ============================================

-- Insertar Roles por Defecto
INSERT INTO roles (nombre, descripcion) VALUES
('dueño', 'Dueño/Administrador - Acceso completo'),
('vendedor', 'Vendedor - Acceso a POS y productos'),
('cajero', 'Cajero - Solo acceso a POS'),
('almacenero', 'Almacenero - Gestión de productos e inventario')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar Planes por Defecto
INSERT INTO planes (nombre, descripcion, precio_mensual, precio_anual, limite_productos, limite_usuarios, limite_almacenes) VALUES
('gratis', 'Plan Gratuito', 0, 0, 100, 2, 1),
('basico', 'Plan Básico', 29.99, 299.99, 500, 5, 1),
('pro', 'Plan Pro', 79.99, 799.99, NULL, NULL, 3),
('premium', 'Plan Premium', 149.99, 1499.99, NULL, NULL, NULL)
ON CONFLICT (nombre) DO NOTHING;

