# Checklist del Proyecto - Adminis Go

**Versión del documento**: 1.0  
**Última actualización**: Enero 2026  
**Estado del proyecto**: 🟢 Inicio

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
- [x] Probar que el proyecto inicia: `npm run dev` ✅

#### Base de Datos - Setup Supabase

- [x] Crear proyecto en Supabase (o usar existente) ✅
- [x] Obtener URL y API keys de Supabase ✅
- [x] Conectar Supabase con frontend (probar conexión) ✅
- [x] Crear esquema de base de datos según `GUIA_DE_BASE_DE_DATOS.md`: ✅
  - [x] Tabla `usuarios` ✅
  - [x] Tabla `comercios` ✅
  - [x] Tabla `productos` ✅
  - [x] Tabla `categorias` ✅
  - [x] Tabla `marcas` ✅
  - [x] Tabla `clientes` ✅
  - [x] Tabla `proveedores` ✅
  - [x] Tabla `ventas` ✅
  - [x] Tabla `venta_items` ✅
  - [x] Tabla `venta_pagos` (múltiples métodos de pago) ✅
  - [x] Campos `facturacion`, `monto_pagado`, `monto_deuda` en `ventas` ✅
  - [x] Tabla `compras` ✅
  - [x] Tabla `compra_items` ✅
  - [x] Tabla `movimientos_inventario` ✅
  - [x] Tabla `producto_imagenes` ✅
  - [x] Tabla `configuracion_comercio` ✅
  - [x] Tabla `configuracion_usuario` ✅
  - [x] Tabla `planes` (freemium) ✅
  - [x] Tabla `suscripciones` ✅
  - [x] Tabla `roles` ✅
  - [x] Todos los índices ✅
  - [x] Triggers para updated_at ✅
- [x] Configurar Row Level Security (RLS) para multi-tenant ✅ (Script creado: 003_row_level_security.sql)
- [x] Crear índices necesarios ✅ (incluidos en el esquema)
- [x] Crear funciones y triggers SQL (si aplica) ✅ (triggers para updated_at creados)
- [ ] Configurar Storage buckets:
  - [ ] `productos` (imágenes de productos)
  - [ ] `logos` (logos de comercios)
  - [ ] `perfiles` (fotos de perfil)
  - [ ] `documentos` (documentos varios)

#### Autenticación - Setup Inicial

- [x] Configurar Supabase Auth ✅
- [ ] Configurar proveedores de autenticación (email/password, Google, etc.) (email/password listo, Google opcional)
- [x] Crear servicio de autenticación en frontend (`src/services/auth.js`) ✅
- [x] Crear contexto/hook de autenticación ✅
- [x] Crear páginas de Login y Registro ✅
- [x] Configurar rutas protegidas ✅
- [ ] Probar registro de usuario (pendiente de testing)
- [ ] Probar login de usuario (pendiente de testing)
- [ ] Probar logout (pendiente de testing)
- [ ] Probar recuperación de contraseña (pendiente de testing)

### 0.4 Sistema de Diseño Base

- [x] Implementar variables CSS (colores, tipografía, espaciado) ✅
- [x] Implementar tipografía base ✅
- [x] Crear componentes base: ✅
  - [x] Botones ✅
  - [x] Inputs ✅
  - [x] Cards ✅
  - [x] Modales ✅
  - [x] Alerts ✅
  - [x] Badges ✅
  - [x] Loading spinners ✅
- [x] Implementar sistema de grid/layout ✅ (CSS ya creado)
- [x] Implementar navbar base ✅
- [x] Implementar sidebar base ✅
  - [x] Estructura de navegación completa ✅
  - [x] Menú desplegable para Referencias ✅
  - [x] Estilos responsivos ✅
- [ ] Implementar footer base (pendiente, opcional)
- [ ] Configurar tema claro/oscuro (dark mode)
- [ ] Probar responsive design básico

---

## Fase 1: MVP (Producto Mínimo Viable)

**Objetivo**: Aplicación funcional básica con funcionalidades core

### 1.1 Módulo de Autenticación (MVP)

- [ ] Landing page básica:
  - [ ] Diseño responsive
  - [ ] Botón "Registrarse"
  - [ ] Botón "Iniciar Sesión"
  - [ ] Botón "Descargar App" (placeholder)
  - [ ] Sección de características principales
  - [ ] Footer con links legales (Términos, Privacidad, etc.)
- [x] Página de registro: ✅
  - [x] Formulario de registro ✅
  - [x] Validación de campos ✅
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
  - [ ] Gráfico simple (placeholder) (pendiente)

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
  - [x] Filtros por búsqueda (cliente, facturación, códigos) ✅
  - [x] Filtros por estado de pago (pagadas, con deuda) ✅
  - [x] Tabla de registros: ✅
    - [x] Columnas: FECHA, FACTURACIÓN, CLIENTE, UNIDADES, $TOTAL, $ PAGADO, $ DEUDA, ESTADO, ACCIONES ✅
    - [x] Headers fijos (sticky) ✅
    - [x] Paginación (máx 100 registros por página) ✅
  - [x] Botón "CARGAR NUEVA VENTA (F2)" que redirige a /ventas/nueva ✅
  - [x] Rutas: /ventas (lista) y /ventas/nueva (formulario POS) ✅

### 1.5 Módulo de Clientes (MVP)

- [x] Lista de clientes: ✅
  - [x] Vista tabla ✅
  - [x] Columnas: Nombre, Email, Teléfono, Dirección, Estado ✅
  - [x] Búsqueda por nombre, email y teléfono ✅
  - [x] Headers fijos (sticky) ✅
  - [x] Paginación (máx 100 registros por página) ✅
  - [x] Mensaje de éxito al crear/editar cliente ✅
- [x] Formulario de cliente: ✅
  - [x] Crear cliente ✅
  - [x] Editar cliente ✅
  - [x] Campos básicos: Nombre, Email, Teléfono, Dirección ✅
  - [x] Validación de campos ✅
  - [x] Validación de email único ✅
  - [x] Validación de formato de email ✅
  - [x] Manejo de errores ✅
  - [x] Guardar en Supabase ✅

### 1.6 Módulo de Proveedores (MVP)

- [x] Lista de proveedores: ✅
  - [x] Vista tabla ✅
  - [x] Columnas: Nombre/Razón Social, Email, Teléfono, CUIT/RUT, Contacto, Estado ✅
  - [x] Búsqueda por nombre, email, teléfono o CUIT ✅
  - [x] Headers fijos (sticky) ✅
  - [x] Paginación (máx 100 registros por página) ✅
  - [x] Mensaje de éxito al crear/editar proveedor ✅
- [x] Formulario de proveedor: ✅
  - [x] Crear proveedor ✅
  - [x] Editar proveedor ✅
  - [x] Campos: Nombre/Razón Social, Email, Teléfono, Dirección, CUIT/RUT, Contacto Principal, Condiciones de Pago, Plazo de Entrega, Notas ✅
  - [x] Validación de campos obligatorios ✅
  - [x] Validación de email único (si se proporciona) ✅
  - [x] Validación de CUIT/RUT único (si se proporciona) ✅
  - [x] Advertencia de nombre duplicado (con confirmación) ✅
  - [x] Confirmación antes de guardar ✅
  - [x] Guardar en Supabase ✅

### 1.7 Configuración Básica

- [x] Página de configuración básica: ✅
  - [x] Información del comercio (editar) ✅
  - [x] Cambio de contraseña ✅
  - [x] Tema claro/oscuro (toggle) ✅
  - [x] Formato de impresión: elegir tipo (POS 80 / A4 / etc.) ✅
- [x] Perfil de usuario: ✅
  - [x] Ver información del usuario ✅
  - [x] Editar información básica ✅

### 1.8 PWA - Setup Básico

- [x] Crear `manifest.json`: ✅
  - [x] Nombre de la app ✅
  - [x] Iconos (múltiples tamaños) ✅
  - [x] Colores tema ✅
  - [x] Configuración de pantalla completa ✅
- [x] Crear Service Worker básico (`sw.js`): ✅
  - [x] Caché de assets estáticos ✅
  - [x] Estrategia de caché básica ✅
- [x] Registrar Service Worker en la app ✅
- [x] Probar instalación PWA en navegador ✅
- [x] Probar funcionamiento offline básico ✅

### 1.9 Testing MVP

- [ ] Testing manual básico:
  - [ ] Registro y login funcionan
  - [ ] Crear/editar/eliminar productos
  - [ ] Realizar venta en POS
  - [ ] Crear/editar clientes
  - [ ] Navegación funciona
  - [ ] Responsive design funciona en móvil
  - [ ] PWA se puede instalar

---

## Fase 2: Funcionalidades Completas

**Objetivo**: Completar funcionalidades core del sistema

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

- [ ] Lista de compras:
  - [ ] Vista tabla
  - [ ] Filtros por proveedor, fecha, estado
  - [ ] Búsqueda
- [ ] Crear orden de compra:
  - [ ] Seleccionar proveedor
  - [ ] Agregar productos
  - [ ] Cantidades y precios
  - [ ] Fecha de entrega estimada
  - [ ] Notas
- [ ] Recibir compra:
  - [ ] Marcar como recibida
  - [ ] Actualizar stock
  - [ ] Registrar fecha de recepción
- [ ] Gestión de proveedores:
  - [ ] Lista de proveedores
  - [ ] Crear/editar/eliminar proveedor
  - [ ] Información de contacto
  - [ ] Historial de compras por proveedor

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

### 2.9 Funcionalidad Offline

- [ ] Service Worker avanzado:
  - [ ] Caché de datos críticos
  - [ ] Sincronización cuando vuelva online
  - [ ] Estrategia de caché por tipo de recurso
- [ ] IndexedDB para datos offline:
  - [ ] Guardar productos localmente
  - [ ] Guardar ventas offline
  - [ ] Sincronizar con servidor cuando vuelva online
- [ ] Indicador de estado online/offline:
  - [ ] Mostrar estado de conexión
  - [ ] Notificar cuando vuelva online
  - [ ] Mostrar ventas pendientes de sincronizar

### 2.10 Configuración Avanzada

- [ ] Configuración del comercio:
  - [ ] Información completa
  - [ ] Logo del comercio (subir/editar)
  - [ ] Configuración de impuestos
  - [ ] Configuración de moneda
  - [ ] Formato de fechas
- [ ] Configuración de impresión:
  - [ ] Plantilla de ticket personalizable
  - [ ] Impresora predeterminada
  - [ ] Configuración de tamaño de papel
- [ ] Configuración de notificaciones:
  - [ ] Alertas de stock bajo
  - [ ] Notificaciones de ventas
  - [ ] Email de reportes

---

## Fase 3: Funcionalidades Premium

**Objetivo**: Funcionalidades avanzadas para planes premium

### 3.1 Modelo Freemium

- [ ] Sistema de planes:
  - [ ] Plan Gratuito (Free)
  - [ ] Plan Básico
  - [ ] Plan Premium
  - [ ] Plan Enterprise
- [ ] Límites por plan:
  - [ ] Límite de productos
  - [ ] Límite de usuarios
  - [ ] Límite de ventas/mes
  - [ ] Funcionalidades disponibles
- [ ] Página de planes y precios:
  - [ ] Comparación de planes
  - [ ] Botón de suscripción
  - [ ] Integración con pasarela de pago (Stripe, PayPal, etc.)
- [ ] Sistema de suscripción:
  - [ ] Actualización de plan
  - [ ] Cancelación de suscripción
  - [ ] Facturación automática
  - [ ] Notificaciones de vencimiento

### 3.2 Funcionalidades Premium

- [ ] Reportes avanzados:
  - [ ] Dashboards personalizables
  - [ ] Gráficos interactivos
  - [ ] Exportación avanzada
- [ ] Integraciones:
  - [ ] Integración con sistemas contables
  - [ ] Integración con e-commerce
  - [ ] API para integraciones externas
- [ ] Multi-ubicación:
  - [ ] Múltiples sucursales
  - [ ] Transferencias entre sucursales
  - [ ] Inventario por sucursal
- [ ] Funcionalidades avanzadas:
  - [ ] Backup automático
  - [ ] Restauración de datos
  - [ ] Historial completo de cambios
  - [ ] Auditoría de acciones

---

## Fase 4: Testing y QA

### 4.1 Testing Funcional

- [ ] Testing de autenticación:
  - [ ] Registro completo
  - [ ] Login
  - [ ] Logout
  - [ ] Recuperación de contraseña
  - [ ] Sesión persistente
- [ ] Testing de módulos:
  - [ ] Módulo de productos (CRUD completo)
  - [ ] Módulo POS (flujo completo de venta)
  - [ ] Módulo de clientes (CRUD completo)
  - [ ] Módulo de compras (flujo completo)
  - [ ] Módulo de inventario
  - [ ] Módulo de reportes
  - [ ] Módulo de usuarios
- [ ] Testing de integración:
  - [ ] Integración con Supabase
  - [ ] Integración con Storage
  - [ ] Sincronización offline/online
- [ ] Testing de responsive:
  - [ ] Mobile (Android, iOS)
  - [ ] Tablet
  - [ ] Desktop
- [ ] Testing de PWA:
  - [ ] Instalación en navegador
  - [ ] Funcionamiento offline
  - [ ] Actualización de Service Worker
  - [ ] Notificaciones

### 4.2 Testing de Rendimiento

- [ ] Carga inicial de la app (< 3 segundos)
- [ ] Tiempo de respuesta de consultas
- [ ] Rendimiento con muchos datos (productos, ventas, etc.)
- [ ] Optimización de imágenes
- [ ] Lazy loading de componentes
- [ ] Code splitting

### 4.3 Testing de Seguridad

- [ ] Validación de inputs
- [ ] Protección contra XSS
- [ ] Protección contra SQL Injection (Supabase maneja esto)
- [ ] Autenticación y autorización
- [ ] Row Level Security (RLS) en Supabase
- [ ] HTTPS en producción
- [ ] Manejo seguro de tokens

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
- [ ] Primer deploy de prueba
- [ ] Verificar que la app funciona en producción

### 5.3 Configuración del Dominio (adminisgo.com)

- [ ] Agregar dominio en Vercel:
  - [ ] Agregar `adminisgo.com`
  - [ ] Agregar `www.adminisgo.com` (opcional)
- [ ] Configurar DNS en proveedor de dominio:
  - [ ] Registrar CNAME según instrucciones de Vercel
  - [ ] Registrar A record según instrucciones de Vercel
  - [ ] Esperar propagación DNS (puede tardar horas)
- [ ] Verificar SSL (debe ser automático con Vercel)
- [ ] Probar acceso desde adminisgo.com
- [ ] Verificar redirección HTTP → HTTPS

### 5.4 Configuración de Supabase (Producción)

- [ ] Verificar configuración de Supabase:
  - [ ] RLS activado en todas las tablas
  - [ ] Políticas de seguridad configuradas
  - [ ] Storage buckets configurados correctamente
  - [ ] Auth providers configurados
- [ ] Configurar dominios permitidos en Supabase:
  - [ ] Agregar `adminisgo.com`
  - [ ] Agregar dominio de Vercel (si necesario)
- [ ] Backup de base de datos configurado
- [ ] Monitoreo de Supabase activado

### 5.5 Testing en Producción

- [ ] Probar todas las funcionalidades en producción
- [ ] Probar autenticación en producción
- [ ] Probar PWA en producción:
  - [ ] Instalación desde adminisgo.com
  - [ ] Funcionamiento offline
  - [ ] Service Worker funcionando
- [ ] Probar en diferentes navegadores:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] Probar en diferentes dispositivos:
  - [ ] Android (móvil)
  - [ ] iOS (móvil)
  - [ ] Desktop (Windows, macOS, Linux)

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

- [ ] Probar descarga desde Play Store (cuando esté aprobada)
- [ ] Probar instalación en dispositivo Android
- [ ] Probar funcionamiento de la app
- [ ] Verificar que se actualiza automáticamente (la app es tu web)

### 6.8 Mantenimiento Play Store

- [ ] Monitorear reviews y calificaciones
- [ ] Responder a reviews
- [ ] Actualizar descripción si necesario
- [ ] Actualizar screenshots si necesario
- [ ] Actualizar AAB solo si cambias el wrapper TWA (raro)

---

## Fase 7: Publicación App Store (iOS)

**Nota**: Este proceso es más complejo y requiere Mac + Xcode

### 7.1 Preparación de la PWA para iOS

- [ ] Verificar manifest.json completo (similar a Android)
- [ ] Agregar meta tags específicos de iOS:
  - [ ] apple-mobile-web-app-capable
  - [ ] apple-mobile-web-app-status-bar-style
  - [ ] apple-mobile-web-app-title
  - [ ] apple-touch-icon
- [ ] Verificar Service Worker (iOS tiene limitaciones)
- [ ] Probar PWA en Safari iOS
- [ ] Probar instalación desde Safari iOS

### 7.2 Opción A: PWA Instalable (SIN App Store)

- [ ] Configurar meta tags para iOS
- [ ] Probar instalación desde Safari
- [ ] Documentar cómo instalar para usuarios iOS
- [ ] **Ventaja**: Gratis, funciona bien
- [ ] **Desventaja**: No aparece en App Store

### 7.3 Opción B: App Store (CON Capacitor)

**Requisitos previos**:
- [ ] Mac con macOS (obligatorio)
- [ ] Xcode instalado
- [ ] Cuenta de desarrollador Apple ($99 USD/año)
- [ ] Certificados de desarrollador configurados

#### Setup de Capacitor

- [ ] Instalar Capacitor:
  ```bash
  npm install @capacitor/core @capacitor/cli
  npm install @capacitor/ios
  ```
- [ ] Inicializar Capacitor:
  ```bash
  npx cap init
  ```
- [ ] Agregar plataforma iOS:
  ```bash
  npx cap add ios
  ```
- [ ] Sincronizar con iOS:
  ```bash
  npx cap sync ios
  ```
- [ ] Abrir en Xcode:
  ```bash
  npx cap open ios
  ```

#### Configuración en Xcode

- [ ] Configurar Bundle Identifier (único)
- [ ] Configurar Version y Build number
- [ ] Configurar iconos de la app (múltiples tamaños)
- [ ] Configurar splash screens
- [ ] Configurar permisos (cámara, etc. si necesario)
- [ ] Configurar signing y certificados:
  - [ ] Cuenta de desarrollador Apple
  - [ ] Certificados de distribución
  - [ ] Provisioning profiles
- [ ] Build para dispositivo/simulador
- [ ] Probar en dispositivo físico iOS

#### Preparar para App Store

- [ ] Crear Archive en Xcode:
  - [ ] Seleccionar "Any iOS Device"
  - [ ] Product → Archive
- [ ] Validar Archive
- [ ] Distribuir App:
  - [ ] App Store Connect
  - [ ] Exportar para distribución

#### App Store Connect

- [ ] Crear cuenta en App Store Connect (https://appstoreconnect.apple.com/)
- [ ] Crear nueva app:
  - [ ] Nombre de la app
  - [ ] Bundle ID
  - [ ] SKU (único)
- [ ] Preparar assets:
  - [ ] Icono (1024x1024 px)
  - [ ] Screenshots (múltiples tamaños para diferentes dispositivos)
  - [ ] Descripción
  - [ ] Keywords
  - [ ] Categoría
  - [ ] Información de soporte
  - [ ] Política de privacidad
- [ ] Subir build desde Xcode
- [ ] Completar información de la app
- [ ] Enviar para revisión
- [ ] Esperar aprobación (1-7 días típicamente)

### 7.4 Testing App Store

- [ ] Probar descarga desde App Store (cuando esté aprobada)
- [ ] Probar instalación en dispositivo iOS
- [ ] Probar funcionamiento de la app
- [ ] Verificar actualizaciones

---

## Fase 8: Post-Lanzamiento

### 8.1 Monitoreo y Analytics

- [ ] Configurar Google Analytics (o similar):
  - [ ] Eventos de usuarios
  - [ ] Conversiones
  - [ ] Flujo de usuarios
- [ ] Configurar error tracking (Sentry, etc.):
  - [ ] Monitoreo de errores en producción
  - [ ] Alertas de errores críticos
- [ ] Monitoreo de performance:
  - [ ] Tiempo de carga
  - [ ] Tiempo de respuesta de API
  - [ ] Uso de recursos
- [ ] Monitoreo de uso:
  - [ ] Usuarios activos
  - [ ] Módulos más usados
  - [ ] Dispositivos más comunes

### 8.2 Feedback y Mejoras

- [ ] Configurar canal de feedback:
  - [ ] Email de soporte
  - [ ] Formulario de contacto
  - [ ] Chat de soporte (opcional)
- [ ] Monitorear reviews:
  - [ ] Play Store reviews
  - [ ] App Store reviews (si aplica)
  - [ ] Responder a reviews
- [ ] Recopilar feedback de usuarios
- [ ] Priorizar mejoras y nuevas funcionalidades
- [ ] Planificar iteraciones futuras

### 8.3 Marketing y Promoción

- [ ] Landing page optimizada:
  - [ ] SEO básico
  - [ ] Meta tags
  - [ ] Open Graph tags
- [ ] Redes sociales:
  - [ ] Crear perfiles
  - [ ] Publicar contenido
- [ ] Blog/Artículos (opcional)
- [ ] Email marketing (si aplica)
- [ ] Publicidad (si aplica)

### 8.4 Mantenimiento Continuo

- [ ] Actualizaciones regulares:
  - [ ] Corrección de bugs
  - [ ] Nuevas funcionalidades
  - [ ] Mejoras de performance
- [ ] Actualización de dependencias:
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

### 8.6 Documentación Final

- [ ] Documentación de usuario:
  - [ ] Manual de usuario básico
  - [ ] Tutoriales/Guías
  - [ ] FAQ
- [ ] Documentación técnica:
  - [ ] Arquitectura
  - [ ] APIs
  - [ ] Base de datos
  - [ ] Deployment
- [ ] Documentación de desarrollo:
  - [ ] Guía de contribución (si aplica)
  - [ ] Estándares de código
  - [ ] Proceso de desarrollo

---

## 📊 Estado General del Proyecto

### Progreso por Fase

- **Fase 0: Preparación y Setup**: 🟨 ~65% (estructura, dependencias, CSS base, Supabase conectado, esquema DB y RLS configurados ✅)
- **Fase 1: MVP (Producto Mínimo Viable)**: 🟨 ~50% (Autenticación ✅, Dashboard básico ✅, Productos ✅, Clientes ✅, Proveedores ✅, POS/Ventas ✅, Configuración ✅, PWA ✅)
- **Fase 2: Funcionalidades Completas**: ⬜ 0% (0/X tareas completadas)
- **Fase 3: Funcionalidades Premium**: ⬜ 0% (0/X tareas completadas)
- **Fase 4: Testing y QA**: ⬜ 0% (0/X tareas completadas)
- **Fase 5: Deployment Web**: ⬜ 0% (0/X tareas completadas)
- **Fase 6: Publicación Play Store (Android)**: ⬜ 0% (0/X tareas completadas)
- **Fase 7: Publicación App Store (iOS)**: ⬜ 0% (0/X tareas completadas)
- **Fase 8: Post-Lanzamiento**: ⬜ 0% (0/X tareas completadas)

### Progreso General

**Progreso Total**: 🟨 ~25% (Fase 0 ~85%, Fase 1 ~50%)

**Estado Actual**: 🟡 Desarrollo - MVP Core completado: Autenticación, Productos, Clientes, Proveedores, Categorías, Marcas, POS/Ventas (lista, creación, edición), Configuración, PWA Setup básico. Pendientes: Landing page, Recuperación de contraseña, Testing MVP

### Fechas Importantes

- **Fecha de inicio**: _______________
- **Fecha estimada MVP**: _______________
- **Fecha estimada producción web**: _______________
- **Fecha estimada Play Store**: _______________
- **Fecha estimada App Store**: _______________
- **Fecha de lanzamiento**: _______________

### Notas del Proyecto

**Notas generales**:
- 

**Bloqueadores actuales**:
- 

**Decisiones pendientes**:
- 

**Cambios/Actualizaciones**:
- 

---

## 📝 Notas de Uso del Checklist

### Cómo Usar Este Checklist

1. **Marcar tareas completadas**: Cambiar `- [ ]` por `- [x]` cuando una tarea esté completa
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

**Última actualización del checklist**: _______________  
**Versión del documento**: 1.0  
**Próxima revisión**: _______________