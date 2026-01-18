# Guía de Base de Datos - App de Gestión de Comercios

## 📋 Índice
1. [Resumen General](#1-resumen-general)
2. [Diagrama de Relaciones](#2-diagrama-de-relaciones)
3. [Tablas Principales](#3-tablas-principales)
4. [Tablas de Relación](#4-tablas-de-relación)
5. [Tablas de Configuración](#5-tablas-de-configuración)
6. [Índices y Constraints](#6-índices-y-constraints)
7. [Datos de Ejemplo](#7-datos-de-ejemplo)

---

## 1. Resumen General

### 1.1 Tipo de Base de Datos
- **Sistema de Gestión**: PostgreSQL o MySQL/MariaDB (recomendado PostgreSQL)
- **Motor Alternativo**: SQLite (para versiones offline o PWA)
- **ORM/Sistema**: Opcional (Sequelize, TypeORM, Prisma, etc.)

### 1.2 Estructura General
- **Total de tablas**: ~20 tablas principales
- **Relaciones**: Mayormente relaciones uno-a-muchos y muchos-a-muchos
- **Integridad referencial**: Foreign keys y constraints
- **Auditoría**: Campos de creación y modificación en todas las tablas

### 1.3 Convenciones
- **Nombres de tablas**: Plural, en minúsculas, con guiones bajos (ej: `productos`)
- **Nombres de campos**: Singular, en minúsculas, con guiones bajos (ej: `nombre_producto`)
- **Primary keys**: `id` (integer, auto-increment)
- **Foreign keys**: `nombre_tabla_id` (ej: `producto_id`)
- **Timestamps**: `created_at`, `updated_at` (datetime)
- **Soft deletes**: `deleted_at` (datetime, nullable) para no eliminar físicamente

---

## 2. Diagrama de Relaciones

### 2.1 Entidades Principales
```
comercios (1) ──< (N) usuarios
comercios (1) ──< (N) productos
comercios (1) ──< (N) clientes
comercios (1) ──< (N) proveedores
comercios (1) ──< (N) ventas
comercios (1) ──< (N) compras

categorias (1) ──< (N) productos
marcas (1) ──< (N) productos
proveedores (1) ──< (N) productos (proveedor principal)
proveedores (1) ──< (N) compras

productos (1) ──< (N) venta_items
productos (1) ──< (N) compra_items
productos (1) ──< (N) movimientos_inventario

ventas (1) ──< (N) venta_items
ventas (N) >──< (1) clientes (opcional)
ventas (N) >──< (1) usuarios (vendedor)

compras (1) ──< (N) compra_items
compras (N) >──< (1) proveedores
compras (N) >──< (1) usuarios

usuarios (N) >──< (1) roles
```

---

## 3. Tablas Principales

### 3.1 comercios
**Descripción**: Información de cada comercio registrado

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| nombre | VARCHAR(255) | NOT NULL | Nombre del comercio |
| direccion | TEXT | NULL | Dirección completa |
| telefono | VARCHAR(20) | NULL | Teléfono |
| email | VARCHAR(255) | NULL | Email de contacto |
| cuit_rut | VARCHAR(50) | NULL | CUIT/RUT del comercio |
| logo_url | VARCHAR(500) | NULL | URL del logo |
| condicion_iva | VARCHAR(50) | NULL | Condición frente a IVA |
| plan_id | INTEGER | FK, NULL | Plan contratado (freemium) |
| activo | BOOLEAN | DEFAULT TRUE | Si está activo |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Índices**:
- `idx_comercios_email` (email)
- `idx_comercios_plan_id` (plan_id)
- `idx_comercios_activo` (activo)

### 3.2 usuarios
**Descripción**: Usuarios del sistema (dueños, vendedores, etc.)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL | Comercio al que pertenece |
| nombre | VARCHAR(255) | NOT NULL | Nombre completo |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email (usado para login) |
| password_hash | VARCHAR(255) | NOT NULL | Contraseña encriptada |
| telefono | VARCHAR(20) | NULL | Teléfono |
| foto_url | VARCHAR(500) | NULL | URL de foto de perfil |
| rol_id | INTEGER | FK, NOT NULL | Rol del usuario |
| activo | BOOLEAN | DEFAULT TRUE | Si está activo |
| ultimo_acceso | TIMESTAMP | NULL | Último login |
| remember_token | VARCHAR(255) | NULL | Token para "recordarme" |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Índices**:
- `idx_usuarios_comercio_id` (comercio_id)
- `idx_usuarios_email` (email)
- `idx_usuarios_rol_id` (rol_id)

### 3.3 roles
**Descripción**: Roles de usuarios (Dueño, Vendedor, Cajero, etc.)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| nombre | VARCHAR(50) | NOT NULL, UNIQUE | Nombre del rol |
| descripcion | TEXT | NULL | Descripción del rol |
| permisos | JSON | NULL | Permisos específicos (JSON) |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |

**Roles por defecto**:
- `dueño`: Acceso completo
- `vendedor`: POS y productos
- `cajero`: Solo POS
- `almacenero`: Productos e inventario

### 3.4 productos
**Descripción**: Catálogo de productos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL | Comercio dueño |
| codigo_barras | VARCHAR(100) | NULL, UNIQUE | Código de barras |
| codigo_interno | VARCHAR(100) | NULL | Código interno/SKU |
| nombre | VARCHAR(255) | NOT NULL | Nombre del producto |
| descripcion | TEXT | NULL | Descripción |
| categoria_id | INTEGER | FK, NULL | Categoría |
| marca_id | INTEGER | FK, NULL | Marca |
| precio_venta | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Precio de venta |
| precio_compra | DECIMAL(10,2) | NULL | Precio de compra (costo) |
| stock_actual | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Stock actual |
| stock_minimo | DECIMAL(10,2) | DEFAULT 0 | Stock mínimo (alerta) |
| unidad_medida | VARCHAR(20) | DEFAULT 'unidad' | Unidad (unidad, kg, litro) |
| proveedor_id | INTEGER | FK, NULL | Proveedor principal |
| activo | BOOLEAN | DEFAULT TRUE | Si está activo |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Índices**:
- `idx_productos_comercio_id` (comercio_id)
- `idx_productos_codigo_barras` (codigo_barras)
- `idx_productos_categoria_id` (categoria_id)
- `idx_productos_marca_id` (marca_id)
- `idx_productos_stock` (stock_actual, stock_minimo)

### 3.5 categorias
**Descripción**: Categorías de productos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL | Comercio dueño |
| nombre | VARCHAR(255) | NOT NULL | Nombre de la categoría |
| descripcion | TEXT | NULL | Descripción |
| imagen_url | VARCHAR(500) | NULL | URL de imagen |
| categoria_padre_id | INTEGER | FK, NULL | Para subcategorías |
| activo | BOOLEAN | DEFAULT TRUE | Si está activa |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |

**Índices**:
- `idx_categorias_comercio_id` (comercio_id)
- `idx_categorias_padre` (categoria_padre_id)

### 3.6 marcas
**Descripción**: Marcas de productos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL | Comercio dueño |
| nombre | VARCHAR(255) | NOT NULL | Nombre de la marca |
| descripcion | TEXT | NULL | Descripción |
| logo_url | VARCHAR(500) | NULL | URL del logo |
| activo | BOOLEAN | DEFAULT TRUE | Si está activa |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |

**Índices**:
- `idx_marcas_comercio_id` (comercio_id)

### 3.7 clientes
**Descripción**: Clientes del comercio (CRM)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL | Comercio |
| nombre | VARCHAR(255) | NOT NULL | Nombre completo |
| email | VARCHAR(255) | NULL | Email |
| telefono | VARCHAR(20) | NULL | Teléfono |
| direccion | TEXT | NULL | Dirección |
| tipo_documento | VARCHAR(20) | NULL | DNI, CUIT, etc. |
| numero_documento | VARCHAR(50) | NULL | Número de documento |
| fecha_nacimiento | DATE | NULL | Fecha de nacimiento |
| saldo_pendiente | DECIMAL(10,2) | DEFAULT 0 | Saldo en cuenta corriente |
| total_compras | DECIMAL(10,2) | DEFAULT 0 | Total histórico comprado |
| ticket_promedio | DECIMAL(10,2) | DEFAULT 0 | Ticket promedio |
| ultima_compra | TIMESTAMP | NULL | Fecha última compra |
| notas | TEXT | NULL | Notas/observaciones |
| activo | BOOLEAN | DEFAULT TRUE | Si está activo |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Índices**:
- `idx_clientes_comercio_id` (comercio_id)
- `idx_clientes_email` (email)
- `idx_clientes_documento` (tipo_documento, numero_documento)

### 3.8 proveedores
**Descripción**: Proveedores del comercio

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL | Comercio |
| nombre_razon_social | VARCHAR(255) | NOT NULL | Nombre o razón social |
| email | VARCHAR(255) | NULL | Email |
| telefono | VARCHAR(20) | NULL | Teléfono |
| direccion | TEXT | NULL | Dirección |
| cuit_rut | VARCHAR(50) | NULL | CUIT/RUT |
| contacto_principal | VARCHAR(255) | NULL | Nombre del contacto |
| condiciones_pago | VARCHAR(100) | NULL | Condiciones de pago |
| plazo_entrega | INTEGER | NULL | Plazo en días |
| total_compras | DECIMAL(10,2) | DEFAULT 0 | Total histórico comprado |
| notas | TEXT | NULL | Notas/observaciones |
| activo | BOOLEAN | DEFAULT TRUE | Si está activo |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Índices**:
- `idx_proveedores_comercio_id` (comercio_id)
- `idx_proveedores_cuit` (cuit_rut)

### 3.9 ventas
**Descripción**: Registro de ventas (transacciones)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL | Comercio |
| numero_ticket | VARCHAR(50) | NOT NULL | Número de ticket/venta |
| cliente_id | INTEGER | FK, NULL | Cliente (opcional) |
| usuario_id | INTEGER | FK, NOT NULL | Vendedor/usuario que realizó |
| fecha_hora | TIMESTAMP | NOT NULL | Fecha y hora de venta |
| subtotal | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Subtotal sin descuentos |
| descuento | DECIMAL(10,2) | DEFAULT 0 | Descuento total |
| impuestos | DECIMAL(10,2) | DEFAULT 0 | Impuestos (IVA, etc.) |
| total | DECIMAL(10,2) | NOT NULL | Total final |
| metodo_pago | VARCHAR(50) | NOT NULL | Efectivo, Tarjeta, etc. |
| estado | VARCHAR(20) | DEFAULT 'completada' | Completada, Cancelada, Pendiente |
| observaciones | TEXT | NULL | Observaciones |
| ticket_impreso | BOOLEAN | DEFAULT FALSE | Si se imprimió ticket |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Índices**:
- `idx_ventas_comercio_id` (comercio_id)
- `idx_ventas_cliente_id` (cliente_id)
- `idx_ventas_usuario_id` (usuario_id)
- `idx_ventas_fecha` (fecha_hora)
- `idx_ventas_numero_ticket` (numero_ticket)

### 3.10 venta_items
**Descripción**: Items/productos de cada venta

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| venta_id | INTEGER | FK, NOT NULL | Venta padre |
| producto_id | INTEGER | FK, NOT NULL | Producto vendido |
| cantidad | DECIMAL(10,2) | NOT NULL | Cantidad vendida |
| precio_unitario | DECIMAL(10,2) | NOT NULL | Precio al momento de venta |
| descuento | DECIMAL(10,2) | DEFAULT 0 | Descuento del item |
| subtotal | DECIMAL(10,2) | NOT NULL | Subtotal (cantidad × precio - descuento) |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |

**Índices**:
- `idx_venta_items_venta_id` (venta_id)
- `idx_venta_items_producto_id` (producto_id)

### 3.11 compras
**Descripción**: Órdenes de compra a proveedores

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL | Comercio |
| numero_orden | VARCHAR(50) | NOT NULL | Número de orden |
| proveedor_id | INTEGER | FK, NOT NULL | Proveedor |
| usuario_id | INTEGER | FK, NOT NULL | Usuario que creó |
| fecha_orden | DATE | NOT NULL | Fecha de orden |
| fecha_recepcion | DATE | NULL | Fecha de recepción |
| subtotal | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Subtotal |
| descuento | DECIMAL(10,2) | DEFAULT 0 | Descuento total |
| impuestos | DECIMAL(10,2) | DEFAULT 0 | Impuestos |
| total | DECIMAL(10,2) | NOT NULL | Total |
| estado | VARCHAR(20) | DEFAULT 'pendiente' | Pendiente, Recibida, Cancelada |
| observaciones | TEXT | NULL | Observaciones |
| factura_url | VARCHAR(500) | NULL | URL de factura/remito adjunto |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Índices**:
- `idx_compras_comercio_id` (comercio_id)
- `idx_compras_proveedor_id` (proveedor_id)
- `idx_compras_fecha` (fecha_orden)

### 3.12 compra_items
**Descripción**: Items/productos de cada compra

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| compra_id | INTEGER | FK, NOT NULL | Compra padre |
| producto_id | INTEGER | FK, NOT NULL | Producto comprado |
| cantidad_solicitada | DECIMAL(10,2) | NOT NULL | Cantidad solicitada |
| cantidad_recibida | DECIMAL(10,2) | NULL | Cantidad recibida |
| precio_unitario | DECIMAL(10,2) | NOT NULL | Precio unitario |
| subtotal | DECIMAL(10,2) | NOT NULL | Subtotal |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |

**Índices**:
- `idx_compra_items_compra_id` (compra_id)
- `idx_compra_items_producto_id` (producto_id)

### 3.13 movimientos_inventario
**Descripción**: Movimientos de stock (ingresos/egresos)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL | Comercio |
| producto_id | INTEGER | FK, NOT NULL | Producto |
| tipo_movimiento | VARCHAR(20) | NOT NULL | Ingreso, Egreso, Ajuste |
| cantidad | DECIMAL(10,2) | NOT NULL | Cantidad (positivo o negativo) |
| stock_anterior | DECIMAL(10,2) | NOT NULL | Stock antes del movimiento |
| stock_nuevo | DECIMAL(10,2) | NOT NULL | Stock después del movimiento |
| motivo | VARCHAR(100) | NULL | Motivo del movimiento |
| referencia_tipo | VARCHAR(50) | NULL | Venta, Compra, Ajuste |
| referencia_id | INTEGER | NULL | ID de venta/compra/ajuste |
| usuario_id | INTEGER | FK, NOT NULL | Usuario que realizó |
| observaciones | TEXT | NULL | Observaciones |
| created_at | TIMESTAMP | NOT NULL | Fecha y hora del movimiento |

**Índices**:
- `idx_movimientos_comercio_id` (comercio_id)
- `idx_movimientos_producto_id` (producto_id)
- `idx_movimientos_tipo` (tipo_movimiento)
- `idx_movimientos_fecha` (created_at)

---

## 4. Tablas de Relación

### 4.1 producto_imagenes
**Descripción**: Imágenes de productos (relación muchos-a-muchos simplificada)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| producto_id | INTEGER | FK, NOT NULL | Producto |
| imagen_url | VARCHAR(500) | NOT NULL | URL de la imagen |
| orden | INTEGER | DEFAULT 0 | Orden de visualización |
| es_principal | BOOLEAN | DEFAULT FALSE | Si es imagen principal |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |

**Índices**:
- `idx_producto_imagenes_producto_id` (producto_id)

---

## 5. Tablas de Configuración

### 5.1 planes
**Descripción**: Planes de precios (freemium)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| nombre | VARCHAR(100) | NOT NULL, UNIQUE | Nombre del plan |
| descripcion | TEXT | NULL | Descripción |
| precio_mensual | DECIMAL(10,2) | NULL | Precio mensual |
| precio_anual | DECIMAL(10,2) | NULL | Precio anual |
| limite_productos | INTEGER | NULL | Límite de productos (NULL = ilimitado) |
| limite_usuarios | INTEGER | NULL | Límite de usuarios (NULL = ilimitado) |
| limite_almacenes | INTEGER | DEFAULT 1 | Límite de almacenes |
| funcionalidades | JSON | NULL | Funcionalidades disponibles (JSON) |
| activo | BOOLEAN | DEFAULT TRUE | Si está activo |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |

**Planes por defecto**:
- `gratis`: Precio 0, límites básicos
- `basico`: Precio bajo, límites medianos
- `pro`: Precio medio, límites altos
- `premium`: Precio alto, sin límites

### 5.2 suscripciones
**Descripción**: Suscripciones de comercios a planes

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL | Comercio |
| plan_id | INTEGER | FK, NOT NULL | Plan |
| fecha_inicio | DATE | NOT NULL | Fecha de inicio |
| fecha_fin | DATE | NULL | Fecha de fin (NULL = activa) |
| estado | VARCHAR(20) | DEFAULT 'activa' | Activa, Cancelada, Vencida |
| metodo_pago | VARCHAR(50) | NULL | Método de pago |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |

**Índices**:
- `idx_suscripciones_comercio_id` (comercio_id)
- `idx_suscripciones_plan_id` (plan_id)

### 5.3 configuracion_comercio
**Descripción**: Configuración específica de cada comercio

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| comercio_id | INTEGER | FK, NOT NULL, UNIQUE | Comercio (uno por comercio) |
| porcentaje_iva | DECIMAL(5,2) | DEFAULT 21.00 | Porcentaje de IVA |
| permitir_descuentos | BOOLEAN | DEFAULT TRUE | Permitir descuentos |
| control_stock_automatico | BOOLEAN | DEFAULT TRUE | Control automático de stock |
| stock_minimo_global | DECIMAL(10,2) | DEFAULT 0 | Stock mínimo por defecto |
| formato_fecha | VARCHAR(20) | DEFAULT 'DD/MM/YYYY' | Formato de fecha |
| formato_moneda | VARCHAR(10) | DEFAULT '$' | Símbolo de moneda |
| zona_horaria | VARCHAR(50) | DEFAULT 'America/Argentina/Buenos_Aires' | Zona horaria |
| tema | VARCHAR(20) | DEFAULT 'claro' | Tema (claro, oscuro, sistema) |
| idioma | VARCHAR(10) | DEFAULT 'es' | Idioma |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |

**Índices**:
- `idx_config_comercio_id` (comercio_id)

### 5.4 configuracion_usuario
**Descripción**: Preferencias de cada usuario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AI | ID único |
| usuario_id | INTEGER | FK, NOT NULL, UNIQUE | Usuario (uno por usuario) |
| tema | VARCHAR(20) | DEFAULT 'sistema' | Tema preferido |
| idioma | VARCHAR(10) | DEFAULT 'es' | Idioma preferido |
| notificaciones_activas | BOOLEAN | DEFAULT TRUE | Recibir notificaciones |
| notificaciones_stock_bajo | BOOLEAN | DEFAULT TRUE | Alertas de stock bajo |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Fecha de actualización |

**Índices**:
- `idx_config_usuario_id` (usuario_id)

---

## 6. Índices y Constraints

### 6.1 Foreign Keys (Constraints)
- `fk_usuarios_comercio` (usuarios.comercio_id → comercios.id)
- `fk_usuarios_rol` (usuarios.rol_id → roles.id)
- `fk_productos_comercio` (productos.comercio_id → comercios.id)
- `fk_productos_categoria` (productos.categoria_id → categorias.id)
- `fk_productos_marca` (productos.marca_id → marcas.id)
- `fk_productos_proveedor` (productos.proveedor_id → proveedores.id)
- `fk_ventas_comercio` (ventas.comercio_id → comercios.id)
- `fk_ventas_cliente` (ventas.cliente_id → clientes.id)
- `fk_ventas_usuario` (ventas.usuario_id → usuarios.id)
- `fk_venta_items_venta` (venta_items.venta_id → ventas.id)
- `fk_venta_items_producto` (venta_items.producto_id → productos.id)
- `fk_compras_proveedor` (compras.proveedor_id → proveedores.id)
- `fk_compra_items_compra` (compra_items.compra_id → compras.id)
- `fk_compra_items_producto` (compra_items.producto_id → productos.id)
- `fk_movimientos_producto` (movimientos_inventario.producto_id → productos.id)

### 6.2 Índices Adicionales
- Índices compuestos para búsquedas frecuentes:
  - `idx_ventas_comercio_fecha` (comercio_id, fecha_hora)
  - `idx_productos_comercio_activo` (comercio_id, activo)
  - `idx_ventas_cliente_fecha` (cliente_id, fecha_hora)

### 6.3 Triggers Recomendados
- **Actualizar stock**: Automáticamente al crear venta/compra
- **Actualizar estadísticas de cliente**: Total comprado, última compra
- **Actualizar estadísticas de proveedor**: Total comprado
- **Generar número de ticket**: Automáticamente secuencial
- **Generar número de orden**: Automáticamente secuencial

---

## 7. Datos de Ejemplo

### 7.1 Roles por Defecto
```sql
INSERT INTO roles (nombre, descripcion) VALUES
('dueño', 'Dueño/Administrador - Acceso completo'),
('vendedor', 'Vendedor - Acceso a POS y productos'),
('cajero', 'Cajero - Solo acceso a POS'),
('almacenero', 'Almacenero - Gestión de productos e inventario');
```

### 7.2 Planes por Defecto
```sql
INSERT INTO planes (nombre, descripcion, precio_mensual, precio_anual, limite_productos, limite_usuarios) VALUES
('gratis', 'Plan Gratuito', 0, 0, 100, 2),
('basico', 'Plan Básico', 29.99, 299.99, 500, 5),
('pro', 'Plan Pro', 79.99, 799.99, NULL, NULL),
('premium', 'Plan Premium', 149.99, 1499.99, NULL, NULL);
```

### 7.3 Unidades de Medida Comunes
- `unidad`: Para productos unitarios
- `kg`: Kilogramos
- `g`: Gramos
- `litro`: Litros
- `ml`: Mililitros
- `metro`: Metros
- `cm`: Centímetros
- `pack`: Packs/cajas

---

## 📝 Notas Finales

### Consideraciones de Implementación
- **Multi-tenant**: Cada comercio tiene sus propios datos (filtrado por `comercio_id`)
- **Soft deletes**: No eliminar físicamente para mantener integridad histórica
- **Auditoría**: Campos `created_at`, `updated_at` en todas las tablas
- **Performance**: Índices en campos de búsqueda frecuente
- **Escalabilidad**: Diseñado para crecer (índices, particionamiento futuro)

### Migraciones Recomendadas
1. **Fase 1**: Tablas core (comercios, usuarios, productos, ventas)
2. **Fase 2**: Tablas de relación (clientes, proveedores, compras)
3. **Fase 3**: Tablas de configuración (planes, suscripciones, configuraciones)

---

**Última actualización**: Enero 2026

