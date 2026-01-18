# Scripts de Base de Datos - Adminis Go

Esta carpeta contiene los scripts SQL para crear y mantener la base de datos del proyecto.

## Estructura

```
database/
├── migrations/          # Scripts de migración
│   ├── 001_initial_schema.sql    # Esquema inicial completo
│   ├── 002_initial_data.sql      # Datos iniciales (roles, planes)
│   ├── 003_row_level_security.sql # RLS para multi-tenant
│   ├── 004_storage_buckets.sql   # Configuración de Storage (instrucciones)
│   ├── 005_register_flow.sql     # Función para registro completo
│   ├── 006_auto_comercio_id_triggers.sql # Triggers auto-asignación comercio_id (productos, clientes)
│   ├── 007_add_codigo_interno_unique.sql # Restricción única codigo_interno
│   ├── 008_auto_comercio_id_categorias_marcas.sql # Triggers para categorias y marcas
│   ├── 009_auto_comercio_id_proveedores.sql # Triggers para proveedores
│   ├── 010_auto_comercio_id_ventas.sql # Triggers para ventas
│   └── 011_ventas_facturacion_y_pagos.sql # Facturación y múltiples métodos de pago
└── README.md           # Este archivo
```

## Instrucciones de Uso

### Para Supabase

1. **Ir al SQL Editor en Supabase:**
   - Accede a tu proyecto en https://supabase.com/dashboard
   - Ve a "SQL Editor" en el menú lateral

2. **Ejecutar las migraciones en orden:**
   - Copia y pega el contenido de `001_initial_schema.sql`
   - Ejecuta el script (Run)
   - Copia y pega el contenido de `002_initial_data.sql`
   - Ejecuta el script (Run)
   - Copia y pega el contenido de `003_row_level_security.sql`
   - Ejecuta el script (Run)
   - Copia y pega el contenido de `005_register_flow.sql`
   - Ejecuta el script (Run)
   - Copia y pega el contenido de `006_auto_comercio_id_triggers.sql`
   - Ejecuta el script (Run)
   - **NOTA:** Este script incluye triggers para productos Y clientes
   - Copia y pega el contenido de `007_add_codigo_interno_unique.sql`
   - Ejecuta el script (Run)
   - Copia y pega el contenido de `008_auto_comercio_id_categorias_marcas.sql`
   - Ejecuta el script (Run)
   - Copia y pega el contenido de `009_auto_comercio_id_proveedores.sql`
   - Ejecuta el script (Run)
   - Copia y pega el contenido de `010_auto_comercio_id_ventas.sql`
   - Ejecuta el script (Run)
   - Copia y pega el contenido de `011_ventas_facturacion_y_pagos.sql`
   - Ejecuta el script (Run)
   - Para Storage buckets: Sigue las instrucciones en `004_storage_buckets.sql` (crear desde UI)

3. **Verificar:**
   - Ve a "Table Editor" y verifica que se hayan creado todas las tablas
   - Deberías ver: roles, planes, comercios, usuarios, productos, etc.

### Notas Importantes

- **Supabase Auth**: La tabla `usuarios` usa UUID y referencia `auth.users(id)`
- **Multi-tenant**: Todas las tablas tienen `comercio_id` para separar datos por comercio
- **Soft deletes**: Se usa `deleted_at` en lugar de eliminar físicamente
- **Timestamps**: Se actualizan automáticamente con triggers

### Próximos Pasos

Después de ejecutar las migraciones:
1. ✅ Configurar Row Level Security (RLS) - Script 003 ejecutado
2. Configurar Storage buckets (productos, logos, perfiles, documentos) - Ver script 004
3. Crear funciones y triggers adicionales si es necesario

## Estructura de Tablas

- **Configuración**: roles, planes
- **Principal**: comercios, usuarios
- **Catálogo**: productos, categorias, marcas, producto_imagenes
- **Ventas**: ventas, venta_items, venta_pagos
- **Compras**: compras, compra_items, proveedores
- **Inventario**: movimientos_inventario
- **CRM**: clientes
- **Configuración**: configuracion_comercio, configuracion_usuario, suscripciones

## Descripción de Migraciones

### Migraciones Base (001-004)
- **001_initial_schema.sql**: Crea todas las tablas principales del sistema
- **002_initial_data.sql**: Inserta datos iniciales (roles, planes)
- **003_row_level_security.sql**: Configura RLS para multi-tenant (aislamiento de datos por comercio)
- **004_storage_buckets.sql**: Instrucciones para crear buckets de Storage en Supabase

### Migraciones de Funcionalidad (005-007)
- **005_register_flow.sql**: Función `crear_comercio_y_usuario()` para registro completo
- **006_auto_comercio_id_triggers.sql**: Triggers para auto-asignar `comercio_id` en productos y clientes
- **007_add_codigo_interno_unique.sql**: Agrega restricción única para `codigo_interno` en productos

### Migraciones de Auto-asignación (008-010)
- **008_auto_comercio_id_categorias_marcas.sql**: Triggers para auto-asignar `comercio_id` en categorias y marcas
- **009_auto_comercio_id_proveedores.sql**: Triggers para auto-asignar `comercio_id` en proveedores
- **010_auto_comercio_id_ventas.sql**: Triggers para auto-asignar `comercio_id` en ventas

### Migraciones de Ventas (011)
- **011_ventas_facturacion_y_pagos.sql**: 
  - Agrega campo `facturacion` a `ventas` (único por comercio)
  - Agrega campos `monto_pagado` y `monto_deuda` a `ventas`
  - Crea tabla `venta_pagos` para múltiples métodos de pago por venta
  - Crea triggers para actualizar automáticamente `monto_pagado` y `monto_deuda`
  - Configura RLS para `venta_pagos`

