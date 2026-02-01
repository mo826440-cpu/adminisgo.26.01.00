# Checklist del Proyecto - Adminis Go

**Versión del documento**: 1.2  
**Última actualización**: 26/01/2026  
**Estado del proyecto**: 🟡 Desarrollo Activo

---

## 📋 Índice

1. [Fase 0: Preparación y Setup](#fase-0-preparación-y-setup)
2. [Fase 1: MVP (Producto Mínimo Viable)](#fase-1-mvp-producto-mínimo-viable)
3. [Fase 2: Funcionalidades Completas](#fase-2-funcionalidades-completas)
4. [Fase 3: Funcionalidades Premium](#fase-3-funcionalidades-premium)
5. [Fase 4: Testing y QA](#fase-4-testing-y-qa)
6. [Fase 5: Deployment Web](#fase-5-deployment-web)
7. [Fase 6: Publicación Play Store (Android)](#fase-6-publicación-play-store-android)
8. [Fase 7: Publicación App Store (iOS)](#fase-7-publicación-app-store-ios)
9. [Fase 8: Post-Lanzamiento](#fase-8-post-lanzamiento)

---

## Fase 0: Preparación y Setup

### 0.1 Documentación y Planificación

- [ ] Revisar `DESCRIPCION_PROYECTO.md`
- [ ] Revisar `GUIA_ESTILOS_APP_GESTION.md`
- [ ] Revisar `GUIA_DE_FUNCIONES.md`
- [ ] Revisar `GUIA_DE_BASE_DE_DATOS.md`
- [ ] Revisar `ESTRUCTURA_LENGUAJES_Y_HERRAMIENTAS.md`
- [ ] Definir cronograma detallado
- [ ] Definir presupuesto (si aplica)
- [ ] Crear repositorio en GitHub (o usar existente)

### 0.2 Herramientas y Entorno

#### Instalación de Herramientas

- [x] Node.js instalado (`node --version` debe mostrar v18+) ✅ v24.3.0
- [x] npm instalado (`npm --version`) ✅ v11.4.2
- [x] Git instalado (`git --version`) ✅ v2.50.0
- [ ] VS Code instalado (o editor preferido)
- [ ] Extensiones VS Code instaladas:
  - [ ] ESLint
  - [ ] Prettier
  - [ ] GitLens
  - [ ] JavaScript/TypeScript
  - [ ] CSS Peek

#### Configuración de Git

- [x] Git configurado (nombre y email) ✅
- [ ] Clave SSH configurada para GitHub (opcional pero recomendado)
- [x] Repositorio clonado o inicializado ✅

#### Servicios Online - Cuentas Creadas

- [ ] Cuenta en GitHub (o usar existente)
- [ ] Cuenta en Supabase (o usar existente)
- [ ] Cuenta en Vercel (para deployment web)
- [ ] Cuenta en Google Play Console ($25 USD - para Android)
- [ ] Cuenta en Apple Developer ($99 USD/año - para iOS, opcional)

### 0.3 Setup del Proyecto

#### Estructura Inicial

- [x] Crear estructura de carpetas (monorepo o separado) ✅
- [x] Crear archivo `.gitignore` ✅
- [x] Crear `README.md` básico ✅
- [ ] Configurar package.json principal (si monorepo)

#### Frontend - Setup Inicial

- [x] Crear proyecto React con Vite: `npm create vite@latest frontend -- --template react` ✅
- [x] Navegar a carpeta frontend: `cd frontend` ✅
- [x] Instalar dependencias base: `npm install` ✅
- [x] Instalar dependencias adicionales: ✅
  - [x] `npm install react-router-dom` ✅
  - [x] `npm install zustand` (o Redux Toolkit) ✅
  - [x] `npm install axios` ✅
  - [x] `npm install react-hook-form yup` ✅
  - [x] `npm install @supabase/supabase-js` ✅
  - [x] `npm install bootstrap bootstrap-icons` ✅
- [x] Configurar estructura de carpetas frontend: ✅
  - [x] `src/components/` ✅
  - [x] `src/pages/` ✅
  - [x] `src/services/` ✅
  - [x] `src/store/` ✅
  - [x] `src/styles/` ✅
  - [x] `src/utils/` ✅
- [x] Crear archivos CSS base según `GUIA_ESTILOS_APP_GESTION.md`: ✅
  - [x] `src/styles/variables.css` ✅
  - [x] `src/styles/typography.css` ✅
  - [x] `src/styles/components.css` ✅
  - [x] `src/styles/layout.css` ✅
  - [x] `src/styles/responsive.css` ✅
- [x] Configurar variables de entorno (`.env`): ✅
  - [x] `VITE_SUPABASE_URL` ✅
  - [x] `VITE_SUPABASE_ANON_KEY` ✅
- [x] Configurar Vite según necesidades: ✅
  - [x] Configurar alias de rutas (opcional) ✅
  - [x] Configurar proxy (si necesario) ✅

#### Backend - Setup Supabase

- [x] Crear proyecto en Supabase: ✅
  - [x] Crear base de datos ✅
  - [x] Configurar autenticación ✅
- [x] Configurar esquema de base de datos: ✅
  - [x] Tabla `comercios` ✅
  - [x] Tabla `usuarios` ✅
  - [x] Tabla `categorias` ✅
  - [x] Tabla `marcas` ✅
  - [x] Tabla `productos` ✅
  - [x] Tabla `clientes` ✅
  - [x] Tabla `proveedores` ✅
  - [x] Tabla `ventas` ✅
  - [x] Tabla `venta_items` ✅
  - [x] Tabla `compras` ✅
  - [x] Tabla `compra_items` ✅
  - [x] Tabla `compra_pagos` ✅
  - [x] Tabla `historial_cajas` ✅
  - [x] Tabla `ventas_rapidas` ✅
- [x] Configurar Row Level Security (RLS): ✅
  - [x] Políticas para `comercios` ✅
  - [x] Políticas para `usuarios` ✅
  - [x] Políticas para `productos` ✅
  - [x] Políticas para `clientes` ✅
  - [x] Políticas para `proveedores` ✅
  - [x] Políticas para `ventas` ✅
  - [x] Políticas para `compras` ✅
  - [x] Políticas para `compra_pagos` ✅
  - [x] Políticas para `historial_cajas` ✅
  - [x] Políticas para `ventas_rapidas` ✅
- [x] Crear funciones auxiliares en Supabase: ✅
  - [x] `get_user_comercio_id()` ✅
  - [x] Triggers para asignar `comercio_id` automáticamente ✅

---

## Fase 1: MVP (Producto Mínimo Viable)

### 1.1 Autenticación y Registro

- [x] Página de registro: ✅
  - [x] Registro de comercio (nombre) ✅
  - [x] Registro de usuario administrador ✅
  - [x] Integración con Supabase Auth ✅
  - [x] Creación automática de comercio y usuario ✅
  - [x] Manejo de errores ✅
  - [x] Redirección después del registro ✅
- [x] Página de login: ✅
  - [x] Formulario de login ✅
  - [x] Validación de campos ✅
  - [x] Integración con Supabase Auth ✅
  - [x] Manejo de errores ✅
  - [ ] Recordar sesión (opcional) (pendiente)
  - [x] Redirección después del login ✅
- [ ] Recuperación de contraseña:
  - [ ] Página "Olvidé mi contraseña"
  - [ ] Envío de email de recuperación
  - [ ] Página de restablecimiento de contraseña
- [x] Rutas protegidas: ✅
  - [x] Middleware de autenticación (ProtectedRoute) ✅
  - [x] Redirección a login si no autenticado ✅
  - [x] Redirección a dashboard si ya autenticado ✅

### 1.2 Dashboard Principal (MVP)

- [x] Layout principal de la app (después del login): ✅
  - [x] Navbar con menú ✅
  - [x] Sidebar con módulos ✅
  - [x] Área de contenido principal ✅
  - [ ] Footer (pendiente)
- [x] Dashboard básico: ✅
  - [x] Mensaje de bienvenida ✅
  - [x] Accesos rápidos a módulos principales ✅
  - [x] Indicadores básicos (placeholder): ✅
    - [x] Ventas del día (placeholder) ✅
    - [x] Productos en stock (placeholder) ✅
    - [x] Clientes totales (placeholder) ✅
    - [x] Stock bajo (placeholder) ✅
  - [x] Visualización de plan actual: ✅
    - [x] Badge con plan actual en header ✅
    - [x] Card "Tu Plan Actual" con información detallada ✅
    - [x] Mostrar límites de ventas y usuarios ✅
    - [x] Mostrar período gratis si aplica ✅
    - [x] Botón para cambiar plan (si es plan gratis) ✅
  - [x] Gráfico de ventas últimos 7 días ✅
  - [x] Módulo Dashboard completado (por ahora): ✅
    - [x] Etiquetas para abrir gráficos: Ventas, Compras, Categorías, Marcas, Clientes, Proveedores, Productos, Métodos de Pago, Horarios ✅
    - [x] Gráfico de Ventas y Compras (barras verticales, colapsable, tabla ventas/compras, filtros por fecha y estado) ✅
    - [x] Gráfico de Referencias (barras horizontales, colapsable, por categorías/marcas/clientes/proveedores/productos, filtro Todos/Debe) ✅
    - [x] Análisis por Métodos de Pago (gráfico de torta, colapsable, ventas/compras, totales o con deudas) ✅
    - [x] Ventas por horario (gráfico de línea 0–23 hs, colapsable, filtro fecha desde-hasta) ✅
    - [x] Todos los gráficos ocultos por defecto; se abren al hacer clic en etiqueta o en el título ✅

### 1.3 Módulo de Productos (MVP)

- [x] Lista de productos: ✅
  - [x] Vista tabla ✅
  - [x] Columnas: Nombre, Precio, Stock, Categoría ✅
  - [x] Búsqueda por nombre ✅
  - [x] Headers fijos (sticky) ✅
  - [x] Paginación (máx 100 registros por página) ✅
  - [ ] Filtro por categoría (pendiente)
  - [ ] Ordenamiento básico (pendiente)
- [x] Formulario de producto: ✅
  - [x] Crear producto ✅
  - [x] Editar producto ✅
  - [x] Campos: Nombre, Descripción, Precio, Stock, Categoría, Marca ✅
  - [x] Validación de campos ✅
  - [x] Validación de campos únicos (nombre, código de barras, código interno) ✅
  - [x] Mensajes de error claros y específicos ✅
  - [x] Manejo mejorado de errores ✅
  - [x] Guardar en Supabase ✅
- [x] Eliminar producto: ✅
  - [x] Confirmación antes de eliminar ✅
  - [x] Eliminación en Supabase ✅ (soft delete)
  - [x] Botón de eliminar en lista ✅
  - [x] Modal de confirmación ✅
- [x] Gestión de categorías (básico): ✅
  - [x] Lista de categorías ✅
  - [x] Crear categoría ✅
  - [x] Editar categoría ✅
  - [x] Eliminar categoría ✅ (soft delete)
  - [x] Headers fijos (sticky) ✅
  - [x] Paginación (máx 100 registros por página) ✅
  - [x] Validación de nombre único ✅
  - [x] Confirmación antes de guardar ✅

### 1.4 Módulo POS - Punto de Venta (MVP)

- [x] Interfaz del POS: ✅
  - [x] Lista de productos (vista simple) ✅
  - [x] Carrito de venta ✅
  - [x] Botones de acción (Agregar, Eliminar, Finalizar) ✅
  - [x] Cálculo de totales ✅
- [x] Funcionalidad del POS: ✅
  - [x] Agregar producto al carrito ✅
  - [x] Modificar cantidad ✅
  - [x] Eliminar producto del carrito ✅
  - [x] Calcular subtotal, impuestos (si aplica), total ✅
  - [x] Selección de cliente (cliente genérico o seleccionar) ✅
  - [x] Método de pago (Efectivo, Tarjeta, Transferencia) ✅
  - [x] Confirmar venta ✅
  - [x] Guardar venta en Supabase: ✅
    - [x] Tabla `ventas` ✅
    - [x] Tabla `venta_items` ✅
    - [x] Actualizar stock de productos ✅
- [x] Ticket básico (visualización): ✅
  - [x] Mostrar detalles de la venta (en confirmación) ✅
  - [x] Información del comercio (pendiente - se mostrará en lista de ventas) ✅
  - [x] Lista de productos ✅
  - [x] Totales ✅
- [x] Lista de ventas: ✅
  - [x] Indicadores (Nº VENTAS TOTALES, Nº VENTAS COBRADAS, Nº VENTAS CON DEUDA) ✅
  - [x] Filtros por fecha (mes actual por defecto) ✅
  - [x] Tabla con columnas: Fecha, Cliente, Total, Estado, Acciones ✅
  - [x] Vista adaptada para móvil (menos columnas) ✅
  - [x] Paginación ✅
  - [x] Búsqueda por número de ticket ✅
  - [x] Botón "Limpiar filtros" ✅
- [x] Detalle de venta: ✅
  - [x] Ver información completa ✅
  - [x] Ver items de la venta ✅
  - [x] Ver pagos registrados ✅
  - [x] Impresión de ticket POS 80mm ✅

### 1.5 Módulo de Clientes (MVP)

- [x] Lista de clientes: ✅
  - [x] Vista tabla ✅
  - [x] Columnas: Nombre, Email, Teléfono ✅
  - [x] Búsqueda por nombre ✅
  - [x] Headers fijos (sticky) ✅
  - [x] Paginación (máx 100 registros por página) ✅
- [x] Formulario de cliente: ✅
  - [x] Crear cliente ✅
  - [x] Editar cliente ✅
  - [x] Campos: Nombre, Email, Teléfono, Dirección, Tipo Documento, Número Documento ✅
  - [x] Validación de campos ✅
  - [x] Guardar en Supabase ✅
- [x] Eliminar cliente: ✅
  - [x] Confirmación antes de eliminar ✅
  - [x] Eliminación en Supabase ✅ (soft delete)
  - [x] Botón de eliminar en lista ✅

### 1.6 Módulo de Proveedores (MVP)

- [x] Lista de proveedores: ✅
  - [x] Vista tabla ✅
  - [x] Columnas: Nombre, Email, Teléfono ✅
  - [x] Búsqueda por nombre ✅
  - [x] Headers fijos (sticky) ✅
  - [x] Paginación (máx 100 registros por página) ✅
- [x] Formulario de proveedor: ✅
  - [x] Crear proveedor ✅
  - [x] Editar proveedor ✅
  - [x] Campos: Nombre/Razón Social, Email, Teléfono, Dirección, CUIT/RUT ✅
  - [x] Validación de campos ✅
  - [x] Guardar en Supabase ✅
- [x] Eliminar proveedor: ✅
  - [x] Confirmación antes de eliminar ✅
  - [x] Eliminación en Supabase ✅ (soft delete)
  - [x] Botón de eliminar en lista ✅

### 1.7 Módulo de Configuración (MVP)

- [x] Configuración del comercio: ✅
  - [x] Editar nombre del comercio ✅
  - [x] Editar dirección ✅
  - [x] Editar teléfono ✅
  - [x] Editar email ✅
  - [x] Editar CUIT/RUT ✅
  - [x] Guardar cambios ✅
- [x] Configuración de usuario: ✅
  - [x] Ver información del usuario ✅
  - [x] Cambiar contraseña (pendiente implementación completa)
- [x] Configuración de fecha/hora: ✅
  - [x] Seleccionar zona horaria ✅
  - [x] Seleccionar formato de fecha ✅
  - [x] Aplicar formato en toda la aplicación ✅
  - [x] Mostrar fecha/hora actual en dashboard ✅

### 1.8 PWA - Setup Básico

- [x] Crear `manifest.json`: ✅
  - [x] Nombre y short_name ✅
  - [x] Iconos (múltiples tamaños) ✅
  - [x] start_url ✅
  - [x] display: "standalone" ✅
  - [x] theme_color y background_color ✅
- [x] Crear Service Worker básico (`sw.js`): ✅
  - [x] Cache de assets estáticos ✅
  - [x] Estrategia de cache ✅
- [x] Registrar Service Worker en la app ✅
- [x] Probar instalación PWA en navegador ✅
- [x] Configurar meta tags para PWA: ✅
  - [x] apple-mobile-web-app-capable ✅
  - [x] theme-color ✅
  - [x] viewport ✅

### 1.9 Testing MVP

- [ ] Testing básico de funcionalidades:
  - [ ] Crear/editar/eliminar producto
  - [ ] Crear/editar/eliminar cliente
  - [ ] Crear/editar/eliminar proveedor
  - [ ] Procesar venta en POS
  - [ ] Ver lista de ventas
  - [ ] Ver detalle de venta
  - [ ] PWA se puede instalar
  - [ ] Navegación entre módulos

---

## Fase 2: Funcionalidades Completas

### 2.1 Mejoras del Dashboard

- [ ] Dashboard completo:
  - [ ] KPIs reales (ventas, productos, clientes)
  - [ ] Gráficos de ventas (diario, semanal, mensual)
  - [ ] Top productos más vendidos
  - [ ] Productos con stock bajo
  - [ ] Actividad reciente
  - [ ] Filtros por fecha
  - [ ] Exportar datos (CSV)

### 2.2 Mejoras del Módulo de Productos

- [ ] Vista Grid/Cards además de tabla
- [ ] Imágenes de productos:
  - [ ] Subir imagen
  - [ ] Mostrar imagen
  - [ ] Editar imagen
  - [ ] Eliminar imagen
  - [ ] Integración con Supabase Storage
- [ ] Búsqueda avanzada:
  - [ ] Por nombre, categoría, marca, código
  - [ ] Filtros múltiples
  - [ ] Ordenamiento avanzado
- [ ] Gestión de marcas:
  - [ ] Lista de marcas
  - [ ] Crear/editar/eliminar marcas
- [ ] Gestión de categorías completa:
  - [ ] Categorías con imágenes
  - [ ] Subcategorías (si aplica)
- [ ] Códigos de barras:
  - [ ] Generar código de barras
  - [ ] Buscar por código de barras
  - [ ] Impresión de etiquetas
- [ ] Variantes de productos (tallas, colores, etc.):
  - [ ] Gestión de variantes
  - [ ] Stock por variante

### 2.3 Mejoras del POS

- [ ] Scanner de códigos de barras:
  - [ ] Integración con cámara
  - [ ] Buscar producto por código
  - [ ] Agregar al carrito automáticamente
- [ ] Teclado numérico virtual (para móvil)
- [ ] Múltiples métodos de pago:
  - [ ] Efectivo (con cálculo de vuelto)
  - [ ] Tarjeta
  - [ ] Transferencia
  - [ ] Combinado (efectivo + tarjeta)
- [ ] Selección de cliente mejorada:
  - [ ] Búsqueda de cliente
  - [ ] Crear cliente rápido desde POS
  - [ ] Historial de compras del cliente
- [ ] Guardar borrador:
  - [ ] Guardar venta en progreso
  - [ ] Recuperar borrador
  - [ ] Lista de borradores
- [ ] Ticket mejorado:
  - [ ] Diseño profesional del ticket
  - [ ] Impresión del ticket (web print)
  - [ ] Envío por email/SMS (opcional)
- [ ] Descuentos:
  - [ ] Descuento por producto
  - [ ] Descuento por venta
  - [ ] Descuento por porcentaje o monto fijo

### 2.4 Módulo de Inventario

- [ ] Vista de inventario:
  - [ ] Lista de productos con stock
  - [ ] Alertas de stock bajo
  - [ ] Stock por ubicación (si aplica)
- [ ] Movimientos de inventario:
  - [ ] Entradas de stock
  - [ ] Salidas de stock
  - [ ] Ajustes de inventario
  - [ ] Historial de movimientos
- [ ] Alertas y notificaciones:
  - [ ] Productos con stock bajo
  - [ ] Productos sin stock
  - [ ] Productos vencidos (si aplica)

### 2.5 Módulo de Compras

- [x] Lista de compras: ✅
  - [x] Vista tabla ✅
  - [x] Filtros por proveedor, fecha, estado ✅
  - [x] Búsqueda ✅
  - [x] Paginación ✅
  - [x] Indicador de estado de pago (Pagado/Deuda/Sin pago) ✅
  - [x] Botón de impresión de ticket ✅
- [x] Crear orden de compra: ✅
  - [x] Seleccionar proveedor ✅
  - [x] Agregar productos (con autocompletado) ✅
  - [x] Cantidades y precios ✅
  - [x] Descuentos e impuestos por producto ✅
  - [x] Fecha de orden ✅
  - [x] Notas/Observaciones ✅
  - [x] Gestión de pagos múltiples ✅
  - [x] Cálculo automático de deuda ✅
- [x] Editar orden de compra: ✅
  - [x] Editar datos de la compra ✅
  - [x] Editar items ✅
  - [x] Ver historial de pagos ✅
  - [x] Agregar nuevos pagos ✅
- [x] Recibir compra: ✅
  - [x] Marcar como recibida ✅
  - [x] Actualizar stock ✅
  - [x] Registrar fecha de recepción ✅
  - [x] Gestionar cantidades recibidas por item ✅
- [x] Impresión de tickets: ✅
  - [x] Ticket POS 80mm para compras ✅
  - [x] Detalle completo de compra y pagos ✅
- [ ] Gestión de proveedores:
  - [x] Lista de proveedores ✅
  - [x] Crear/editar/eliminar proveedor ✅
  - [x] Información de contacto ✅
  - [ ] Historial de compras por proveedor (pendiente)

### 2.6 Mejoras del Módulo CRM (Clientes)

- [ ] Vista detallada de cliente:
  - [ ] Información completa
  - [ ] Historial de compras
  - [ ] Total gastado
  - [ ] Última compra
- [ ] Segmentación de clientes:
  - [ ] Clientes frecuentes
  - [ ] Clientes VIP
  - [ ] Clientes inactivos
- [ ] Notas y recordatorios:
  - [ ] Agregar notas al cliente
  - [ ] Recordatorios de seguimiento
- [ ] Historial de comunicación:
  - [ ] Registro de interacciones
  - [ ] Llamadas, emails, etc.

### 2.7 Módulo de Usuarios

- [ ] Lista de usuarios:
  - [ ] Usuarios del comercio
  - [ ] Roles y permisos
- [ ] Gestión de usuarios:
  - [ ] Crear usuario
  - [ ] Editar usuario
  - [ ] Desactivar/activar usuario
  - [ ] Eliminar usuario
- [ ] Roles y permisos:
  - [ ] Administrador
  - [ ] Vendedor
  - [ ] Cajero
  - [ ] Configurar permisos por módulo

### 2.8 Módulo de Reportes

- [ ] Reporte de ventas:
  - [ ] Ventas por fecha
  - [ ] Ventas por vendedor
  - [ ] Ventas por producto
  - [ ] Ventas por cliente
  - [ ] Filtros avanzados
  - [ ] Exportar (PDF, CSV, Excel)
- [ ] Reporte de productos:
  - [ ] Productos más vendidos
  - [ ] Productos con menos ventas
  - [ ] Stock actual
  - [ ] Valor de inventario
- [ ] Reporte de clientes:
  - [ ] Clientes más frecuentes
  - [ ] Clientes por monto gastado
  - [ ] Clientes inactivos
- [ ] Reporte de compras:
  - [ ] Compras por proveedor
  - [ ] Compras por fecha
  - [ ] Análisis de costos
- [ ] Reporte de inventario:
  - [ ] Movimientos de inventario
  - [ ] Productos con stock bajo
  - [ ] Productos sin movimientos

### 2.9 Módulo de Ventas Rápidas y Gestión de Caja

- [x] Gestión de Caja: ✅
  - [x] Apertura de caja (con importe inicial) ✅
  - [x] Cierre de caja (con cálculo automático de ingresos/egresos) ✅
  - [x] Historial de cajas ✅
  - [x] Indicadores de estado de caja (inicio y actual) ✅
  - [x] Validación de caja abierta para ventas ✅
- [x] Ventas Rápidas: ✅
  - [x] Formulario simplificado de venta rápida ✅
  - [x] Selección de cliente (opcional) con autocompletado ✅
  - [x] Campos de total y monto pagado con formato de moneda ✅
  - [x] Registro en tabla ventas_rapidas y ventas ✅
  - [x] Lista de ventas rápidas con filtros ✅
  - [x] Filtro automático desde última apertura de caja ✅
  - [x] Filtros manuales por fecha (desde/hasta) ✅
  - [x] Detalle de venta rápida ✅
  - [x] Impresión de ticket POS 80mm ✅
- [x] Service Worker mejorado: ✅
  - [x] Actualización automática cada 30 segundos ✅
  - [x] Estrategia Network First para obtener versión más reciente ✅
  - [x] Detección de actualizaciones al recuperar foco ✅
  - [x] Actualización automática cuando detecta nueva versión ✅
  - [x] Limpieza automática de caches antiguos ✅
  - [x] Notificaciones opcionales de actualización ✅

### 2.10 Funcionalidad Offline

- [x] Service Worker avanzado: ✅
  - [x] Caché de datos críticos ✅
  - [x] Estrategia de caché por tipo de recurso (Network First) ✅
  - [ ] Sincronización cuando vuelva online (pendiente)
- [ ] IndexedDB para datos offline:
  - [ ] Guardar productos localmente
  - [ ] Guardar ventas offline
  - [ ] Sincronizar con servidor cuando vuelva online
- [ ] Indicador de estado online/offline:
  - [ ] Mostrar estado de conexión
  - [ ] Notificar cuando vuelva online
  - [ ] Mostrar ventas pendientes de sincronizar

### 2.11 Sistema de Planes y Suscripciones

- [x] Sistema de términos y condiciones: ✅
  - [x] Componente FirmaCanvas para captura de firmas ✅
  - [x] Componente TerminosYCondiciones con modal ✅
  - [x] Integración en flujo de registro (SelectPlan y CompleteRegistration) ✅
  - [x] Validación de scroll y checkbox antes de aceptar ✅
  - [x] Guardado de consentimientos en base de datos ✅
  - [x] Subida de firmas a Storage (con fallback a data URL) ✅
  - [x] Manejo de errores de confirmación de email expirada ✅
- [x] Visualización de plan actual: ✅
  - [x] Mostrar plan en Dashboard ✅
  - [x] Mostrar límites de ventas y usuarios ✅
  - [x] Mostrar período gratis si aplica ✅
- [x] Cambio de plan: ✅
  - [x] Página "Cambiar Plan" creada ✅
  - [x] Función para actualizar plan_id del comercio ✅
  - [x] Botón en Dashboard para cambiar plan ✅
  - [ ] Integración con pasarela de pago (Stripe/Mercado Pago) - **PENDIENTE**
  - [ ] Gestión completa de suscripciones - **PENDIENTE**

### 2.12 Configuración Avanzada

- [x] Configuración del comercio: ✅
  - [x] Información básica (nombre, dirección, teléfono, email, CUIT/RUT) ✅
  - [ ] Logo del comercio (subir/editar) - **PENDIENTE**
  - [ ] Configuración de impuestos - **PENDIENTE**
  - [ ] Configuración de moneda - **PENDIENTE**
  - [x] Formato de fechas ✅
- [x] Configuración de impresión: ✅
  - [x] Formato de impresión configurable (POS80, POS58, etc.) ✅
  - [ ] Plantilla de ticket personalizable - **PENDIENTE**
  - [ ] Impresora predeterminada - **PENDIENTE**
  - [ ] Configuración de tamaño de papel - **PENDIENTE**
- [ ] Configuración de notificaciones:
  - [ ] Alertas de stock bajo
  - [ ] Notificaciones de ventas
  - [ ] Email de reportes

---

## Fase 3: Funcionalidades Premium

### 3.1 Integraciones

- [ ] Códigos de barras:
  - [ ] Generar códigos de barras
  - [ ] Scanner de códigos de barras
  - [ ] Impresión de etiquetas
- [ ] Impresoras fiscales:
  - [ ] Integración con impresoras fiscales
  - [ ] Facturación electrónica
- [ ] Pasarelas de pago:
  - [ ] Integración con Mercado Pago
  - [ ] Integración con otras pasarelas
- [ ] Email:
  - [ ] Envío de tickets por email
  - [ ] Envío de reportes por email
- [ ] SMS/WhatsApp:
  - [ ] Envío de notificaciones
  - [ ] Envío de tickets

### 3.2 Analytics Avanzados

- [ ] Dashboard avanzado:
  - [ ] Gráficos interactivos
  - [ ] Comparativas (mes a mes, año a año)
  - [ ] Predicciones
- [ ] Reportes avanzados:
  - [ ] Reportes personalizables
  - [ ] Exportación en múltiples formatos
  - [ ] Programación de reportes

### 3.3 Multi-almacén (Opcional)

- [ ] Gestión de múltiples almacenes
- [ ] Transferencias entre almacenes
- [ ] Stock por almacén

---

## Fase 4: Testing y QA

### 4.1 Testing Funcional

- [ ] Testing de cada módulo:
  - [ ] Autenticación
  - [ ] Productos
  - [ ] Clientes
  - [ ] Proveedores
  - [ ] Ventas (POS)
  - [ ] Compras
  - [ ] Ventas Rápidas
  - [ ] Gestión de Caja
  - [ ] Configuración
- [ ] Testing de integración:
  - [ ] Flujo completo de venta
  - [ ] Flujo completo de compra
  - [ ] Actualización de stock
  - [ ] Cálculos de totales

### 4.2 Testing de Performance

- [ ] Carga de páginas
- [ ] Tiempo de respuesta de queries
- [ ] Optimización de imágenes
- [ ] Lazy loading

### 4.3 Testing de Compatibilidad

- [ ] Navegadores:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] Dispositivos:
  - [ ] Desktop
  - [ ] Tablet
  - [ ] Móvil (Android)
  - [ ] Móvil (iOS)

### 4.4 Testing de Usabilidad

- [ ] Navegación intuitiva
- [ ] Mensajes de error claros
- [ ] Feedback visual (loading, éxito, error)
- [ ] Accesibilidad básica (contraste, teclado, etc.)
- [ ] UX en móvil (tamaños de botones, etc.)

### 4.5 Corrección de Bugs

- [ ] Lista de bugs encontrados
- [ ] Priorización de bugs
- [ ] Corrección de bugs críticos
- [ ] Corrección de bugs menores
- [ ] Testing de regresión

---

## Fase 5: Deployment Web

### 5.1 Preparación para Producción

- [ ] Variables de entorno de producción configuradas
- [ ] Build de producción sin errores: `npm run build`
- [ ] Optimización de assets (minificación, compresión)
- [ ] Verificación de performance del build
- [ ] Eliminar código de desarrollo y console.logs
- [ ] Configurar errores y excepciones (Sentry, etc.)

### 5.2 Configuración de Vercel

- [ ] Crear cuenta en Vercel (si no existe)
- [ ] Conectar repositorio de GitHub con Vercel
- [ ] Configurar proyecto en Vercel:
  - [ ] Framework preset (React/Vite)
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `dist`
  - [ ] Variables de entorno:
    - [ ] `VITE_SUPABASE_URL`
    - [ ] `VITE_SUPABASE_ANON_KEY`
    - [ ] Otras variables necesarias
- [x] Primer deploy de prueba: ✅
- [x] Verificar que la app funciona en producción: ✅

### 5.3 Configuración del Dominio (adminisgo.com)

- [x] Agregar dominio en Vercel: ✅
  - [x] Agregar `adminisgo.com` ✅
  - [x] Agregar `www.adminisgo.com` ✅
- [x] Configurar DNS en proveedor de dominio: ✅
  - [x] Registrar CNAME según instrucciones de Vercel ✅
  - [x] Registrar A record según instrucciones de Vercel ✅
  - [x] Esperar propagación DNS ✅
- [x] Verificar SSL (debe ser automático con Vercel): ✅
- [x] Probar acceso desde adminisgo.com: ✅
- [x] Verificar redirección HTTP → HTTPS: ✅

### 5.4 Configuración de Supabase (Producción)

- [ ] Verificar configuración de Supabase:
  - [ ] RLS activado en todas las tablas
  - [ ] Políticas de seguridad configuradas
  - [ ] Storage buckets configurados correctamente
  - [ ] Auth providers configurados
- [x] Configurar dominios permitidos en Supabase: ✅
  - [x] Agregar `adminisgo.com` ✅
  - [x] Agregar `www.adminisgo.com` ✅
  - [ ] Agregar dominio de Vercel (opcional)
- [ ] Backup de base de datos configurado
- [ ] Monitoreo de Supabase activado

### 5.5 Testing en Producción

- [x] Probar todas las funcionalidades en producción: ✅
- [x] Probar autenticación en producción: ✅
- [x] Probar PWA en producción: ✅
  - [x] Instalación desde adminisgo.com: ✅
  - [x] Service Worker funcionando con actualización automática ✅
  - [ ] Funcionamiento offline (pendiente verificación completa)
- [x] Probar creación/guardado de datos: ✅ (ventas guardadas correctamente)
- [ ] Probar en diferentes navegadores:
  - [x] Chrome: ✅
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] Probar en diferentes dispositivos:
  - [ ] Android (móvil)
  - [ ] iOS (móvil)
  - [x] Desktop (Windows): ✅

### 5.6 Documentación de Deployment

- [ ] Documentar proceso de deployment
- [ ] Documentar configuración de dominio
- [ ] Documentar variables de entorno
- [ ] Documentar rollback procedure (si necesario)

---

## Fase 6: Publicación Play Store (Android)

### 6.1 Preparación de la PWA para Android

- [ ] Verificar manifest.json completo:
  - [ ] Nombre y short_name
  - [ ] Iconos en múltiples tamaños (192x192, 512x512, etc.)
  - [ ] start_url
  - [ ] display: "standalone"
  - [ ] theme_color y background_color
- [ ] Verificar Service Worker funcionando
- [ ] Verificar HTTPS en producción (obligatorio)
- [ ] Probar PWA en Chrome Android
- [ ] Probar instalación desde navegador Android

### 6.2 Instalación de Bubblewrap

- [ ] Instalar Bubblewrap: `npm install -g @bubblewrap/cli`
- [ ] Verificar instalación: `bubblewrap --version`
- [ ] Verificar que Java está instalado (requerido por Bubblewrap)
- [ ] Si no está Java, instalar: https://www.java.com/

### 6.3 Crear TWA (Trusted Web Activity)

- [ ] Inicializar proyecto TWA:
  ```bash
  bubblewrap init --manifest https://adminisgo.com/manifest.json
  ```
- [ ] Configurar proyecto TWA:
  - [ ] Package name (ej: com.adminisgo.app)
  - [ ] Application name
  - [ ] Signing key (generar nueva o usar existente)
  - [ ] Versión inicial
- [ ] Generar iconos para Android (Bubblewrap lo hace automáticamente)
- [ ] Configurar splash screen
- [ ] Build del TWA:
  ```bash
  bubblewrap build
  ```
- [ ] Verificar que se generó el APK/AAB

### 6.4 Crear Cuenta en Google Play Console

- [ ] Ir a: https://play.google.com/console/
- [ ] Crear cuenta de desarrollador:
  - [ ] Completar información personal/empresa
  - [ ] Pagar tarifa única de $25 USD
  - [ ] Completar perfil de desarrollador
- [ ] Aceptar términos y condiciones
- [ ] Verificar cuenta (puede tomar días)

### 6.5 Preparar Assets para Play Store

- [ ] Icono de la app (512x512 px)
- [ ] Screenshots:
  - [ ] Mínimo 2 screenshots (requerido)
  - [ ] Recomendado: 4-8 screenshots
  - [ ] Tamaños: Phone (mínimo 320px, máximo 3840px de ancho)
  - [ ] Tablet (opcional pero recomendado)
- [ ] Feature Graphic (1024x500 px):
  - [ ] Banner promocional
  - [ ] Aparece en la página de la app
- [ ] Descripción corta (máximo 80 caracteres)
- [ ] Descripción completa (máximo 4000 caracteres)
- [ ] Categoría de la app
- [ ] Clasificación de contenido
- [ ] Política de privacidad (URL)
- [ ] Soporte (URL o email)

### 6.6 Publicar en Play Store

- [ ] Crear nueva aplicación en Play Console:
  - [ ] Nombre de la app
  - [ ] Idioma predeterminado
  - [ ] Tipo de app (App o Game)
  - [ ] Gratis o de pago
- [ ] Completar información de la tienda:
  - [ ] Icono
  - [ ] Feature Graphic
  - [ ] Screenshots
  - [ ] Descripción corta y completa
  - [ ] Categoría
  - [ ] Clasificación de contenido
- [ ] Configurar precios y distribución:
  - [ ] Países donde estará disponible
  - [ ] Precio (si es de pago)
- [ ] Configurar contenido de la app:
  - [ ] Política de privacidad
  - [ ] Datos de contacto
  - [ ] Contenido objetivo (edad, etc.)
- [ ] Subir APK/AAB:
  - [ ] Crear release en "Producción" o "Prueba interna"
  - [ ] Subir archivo AAB (recomendado) o APK
  - [ ] Notas de la versión
- [ ] Revisar y publicar:
  - [ ] Revisar toda la información
  - [ ] Completar checklist de publicación
  - [ ] Enviar para revisión
- [ ] Esperar aprobación de Google (1-3 días típicamente)

### 6.7 Testing en Play Store

- [ ] Probar app descargada desde Play Store
- [ ] Verificar que todas las funcionalidades funcionan
- [ ] Verificar que la app se actualiza correctamente

---

## Fase 7: Publicación App Store (iOS)

### 7.1 Preparación de la PWA para iOS

- [ ] Verificar manifest.json completo
- [ ] Verificar Service Worker (iOS tiene limitaciones)
- [ ] Probar PWA en Safari iOS
- [ ] Verificar que se puede instalar desde Safari

### 7.2 Opción A: PWA Instalable (SIN App Store)

- [ ] Probar instalación desde Safari iOS
- [ ] Verificar funcionamiento básico
- [ ] Documentar limitaciones de iOS

### 7.3 Opción B: App Nativa (CON App Store) - Opcional

- [ ] Crear cuenta de desarrollador Apple ($99 USD/año)
- [ ] Usar herramienta para convertir PWA a app nativa
- [ ] Configurar app en App Store Connect
- [ ] Subir app para revisión
- [ ] Esperar aprobación de Apple

---

## Fase 8: Post-Lanzamiento

### 8.1 Monitoreo

- [ ] Configurar analytics:
  - [ ] Google Analytics
  - [ ] Otra herramienta de analytics
- [ ] Monitorear errores:
  - [ ] Sentry o similar
  - [ ] Logs de errores
- [ ] Monitorear performance:
  - [ ] Tiempo de carga
  - [ ] Tiempo de respuesta
  - [ ] Uso de recursos

### 8.2 Soporte

- [ ] Crear canal de soporte:
  - [ ] Email de soporte
  - [ ] Formulario de contacto
  - [ ] FAQ
- [ ] Documentación para usuarios:
  - [ ] Guía de uso
  - [ ] Video tutoriales
  - [ ] Preguntas frecuentes

### 8.3 Mejoras Continuas

- [ ] Recopilar feedback de usuarios
- [ ] Priorizar mejoras
- [ ] Implementar mejoras solicitadas
- [ ] Actualizar documentación

### 8.4 Mantenimiento

- [ ] Actualizaciones regulares:
  - [ ] Actualizar librerías
  - [ ] Actualizar Node.js si necesario
  - [ ] Actualizar frameworks
- [ ] Backup regular:
  - [ ] Backup de base de datos
  - [ ] Backup de código
  - [ ] Verificar restauración de backups
- [ ] Seguridad:
  - [ ] Monitoreo de vulnerabilidades
  - [ ] Actualizaciones de seguridad
  - [ ] Revisión de permisos

### 8.5 Escalabilidad

- [ ] Monitorear uso de recursos:
  - [ ] Supabase (espacio, ancho de banda)
  - [ ] Vercel (ancho de banda)
- [ ] Optimizar performance si necesario:
  - [ ] Optimización de queries
  - [ ] Caché
  - [ ] CDN
- [ ] Planificar escalado:
  - [ ] Actualizar planes de Supabase si necesario
  - [ ] Actualizar planes de Vercel si necesario
  - [ ] Considerar otras soluciones si escala mucho

---

## 📊 Estado General del Proyecto

### Progreso por Fase

- **Fase 0: Preparación y Setup**: 🟨 ~85% (estructura, dependencias, CSS base, Supabase conectado, esquema DB y RLS configurados ✅)
- **Fase 1: MVP (Producto Mínimo Viable)**: 🟨 ~65% (Autenticación ✅, Dashboard básico ✅, Productos ✅, Clientes ✅, Proveedores ✅, POS/Ventas ✅, Compras ✅, Ventas Rápidas ✅, Gestión de Caja ✅, Configuración ✅, PWA ✅)
- **Fase 2: Funcionalidades Completas**: 🟨 ~15% (Módulo de Compras completo ✅, Ventas Rápidas y Caja ✅, Service Worker mejorado ✅)
- **Fase 3: Funcionalidades Premium**: ⬜ 0% (0/X tareas completadas)
- **Fase 4: Testing y QA**: ⬜ 0% (0/X tareas completadas)
- **Fase 5: Deployment Web**: 🟨 ~60% (Dominio configurado ✅, Deploy funcionando ✅, Testing básico ✅)
- **Fase 6: Publicación Play Store (Android)**: ⬜ 0% (0/X tareas completadas)
- **Fase 7: Publicación App Store (iOS)**: ⬜ 0% (0/X tareas completadas)
- **Fase 8: Post-Lanzamiento**: ⬜ 0% (0/X tareas completadas)

### Progreso General

**Progreso Total**: 🟨 ~30% (Fase 0 ~85%, Fase 1 ~65%, Fase 2 ~15%, Fase 5 ~60%)

**Estado Actual**: 🟡 Desarrollo - MVP Core completado: Autenticación (incl. recuperación de contraseña, ícono ver contraseña), Productos, Clientes, Proveedores, Categorías, Marcas, POS/Ventas (lista, creación, edición), Compras (completo con pagos e impresión), Ventas Rápidas y Gestión de Caja, Configuración, PWA con actualización automática. Landing con enlaces a Términos y Política de Privacidad. Cerrar sesión redirige a landing (navegador) o login (PWA). **Dashboard**: KPIs reales, etiquetas (Ventas, Compras, Categorías, Marcas, Clientes, Proveedores, Productos, Métodos de Pago, Horarios) que abren gráficos colapsables: Gráfico de Ventas y Compras (barras verticales), Gráfico de Referencias (barras horizontales), Análisis por Métodos de Pago (torta), Ventas por horario (línea 0–23 hs). Pendientes: Testing MVP, Reportes

### Fechas Importantes

- **Fecha de inicio**: _______________
- **Fecha estimada MVP**: _______________
- **Fecha estimada producción web**: _______________
- **Fecha estimada Play Store**: _______________
- **Fecha estimada App Store**: _______________
- **Fecha de lanzamiento**: _______________

### Notas del Proyecto

**Notas generales**:
- Módulo de Compras completamente funcional con gestión de pagos múltiples
- Módulo de Ventas Rápidas implementado con gestión de caja
- Service Worker mejorado con actualización automática
- Sistema de impresión de tickets POS 80mm implementado

**Bloqueadores actuales**:
- 

**Decisiones pendientes**:
- 

**Cambios/Actualizaciones**:
- 26/01/2026: Módulo Dashboard completado: gráficos Ventas y Compras, Referencias, Métodos de Pago, Ventas por horario; etiquetas para abrir cada uno; todos colapsables y ocultos por defecto
- 23/01/2026: Implementado módulo completo de Compras con pagos e impresión
- 23/01/2026: Implementado módulo de Ventas Rápidas y Gestión de Caja
- 23/01/2026: Mejorado Service Worker con actualización automática

---

## 📝 Notas de Uso del Checklist

### Cómo Usar Este Checklist

1. **Marcar tareas completadas**: Cambiar `- [ ]` por `- [x]` cuando una tarea esté complete
2. **Actualizar progreso**: Actualizar porcentajes en "Estado General del Proyecto" regularmente
3. **Documentar problemas**: Usar la sección "Notas del Proyecto" para documentar bloqueadores o decisiones
4. **Seguimiento regular**: Revisar y actualizar el checklist semanalmente o al final de cada sprint

### Convenciones

- `- [ ]` = Tarea pendiente
- `- [x]` = Tarea completada
- `⬜ 0%` = Fase no iniciada
- `🟨 50%` = Fase en progreso
- `🟩 100%` = Fase completada
- `🟢 Preparación` = Estado: Preparación/Setup
- `🟡 Desarrollo` = Estado: En desarrollo
- `🔵 Testing` = Estado: Testing/QA
- `🟣 Deployment` = Estado: Deployment/Publicación
- `🟢 Producción` = Estado: En producción

### Prioridades

1. **Alta**: Tareas críticas que bloquean otras tareas
2. **Media**: Tareas importantes pero no bloqueadoras
3. **Baja**: Tareas opcionales o mejoras

### Dependencias

Algunas tareas dependen de otras:
- Las tareas de desarrollo dependen de setup completado
- Testing depende de desarrollo completado
- Deployment depende de testing completado
- Publicación en stores depende de deployment completado

---

## 🔗 Documentos Relacionados

- `DESCRIPCION_PROYECTO.md`: Descripción completa del proyecto
- `GUIA_ESTILOS_APP_GESTION.md`: Guía de estilos y diseño
- `GUIA_DE_FUNCIONES.md`: Funcionalidades detalladas
- `GUIA_DE_BASE_DE_DATOS.md`: Esquema de base de datos
- `ESTRUCTURA_LENGUAJES_Y_HERRAMIENTAS.md`: Estructura y herramientas

---

**Última actualización del checklist**: 26/01/2026  
**Versión del documento**: 1.2  
**Próxima revisión**: _______________

**Cambios recientes (26/01/2026)**:
- ✅ Módulo Dashboard completado: Gráfico de Ventas y Compras (barras verticales), Gráfico de Referencias (barras horizontales), Análisis por Métodos de Pago (torta), Ventas por horario (línea 0–23 hs)
- ✅ Etiquetas en dashboard para abrir cada gráfico: Ventas, Compras, Categorías, Marcas, Clientes, Proveedores, Productos, Métodos de Pago, Horarios
- ✅ Todos los gráficos colapsables y ocultos por defecto

**Cambios recientes (23/01/2026)**:
- ✅ Módulo de Compras completo implementado (lista, crear, editar, recibir, pagos múltiples, impresión)
- ✅ Módulo de Ventas Rápidas y Gestión de Caja implementado
- ✅ Service Worker mejorado con actualización automática
- ✅ Filtros por fecha en ventas rápidas (automático desde apertura de caja y manual)
- ✅ Impresión de tickets POS 80mm para compras y ventas rápidas
- ✅ Formato de moneda mejorado en campos de importe
