# Guía de Funciones - App de Gestión de Comercios (POS + ERP + CRM)

## 📋 Índice
1. [Resumen General](#1-resumen-general)
2. [Módulos Principales](#2-módulos-principales)
3. [Autenticación y Usuarios](#3-autenticación-y-usuarios)
4. [Módulo de Ventas (POS)](#4-módulo-de-ventas-pos)
5. [Módulo de Productos](#5-módulo-de-productos)
6. [Módulo de Inventario](#6-módulo-de-inventario)
7. [Módulo de Compras](#7-módulo-de-compras)
8. [Módulo de Clientes (CRM)](#8-módulo-de-clientes-crm)
9. [Módulo de Proveedores](#9-módulo-de-proveedores)
10. [Módulo de Reportes](#10-módulo-de-reportes)
11. [Dashboard y Analytics](#11-dashboard-y-analytics)
12. [Configuración](#12-configuración)
13. [Funcionalidades Técnicas](#13-funcionalidades-técnicas)

---

## 1. Resumen General

### 1.1 Tipo de Aplicación
- **POS** (Point of Sale): Sistema de punto de venta para procesar ventas
- **ERP** (Enterprise Resource Planning): Gestión de recursos (inventario, compras, productos)
- **CRM** (Customer Relationship Management): Gestión de relaciones con clientes
- **Multiplataforma**: Funciona en navegador y como PWA (Progressive Web App)
- **Modelo Freemium**: Versión gratuita con límites y planes de pago

### 1.2 Usuarios Objetivo
- Dueños de comercios (retail, tiendas, comercios locales)
- Vendedores/Empleados
- Administradores de comercios

### 1.3 Plataformas
- **Web**: Navegadores (Chrome, Firefox, Safari, Edge)
- **PWA**: Descargable desde navegador (funciona como app nativa)
- **Mobile**: Optimizado para móviles (iOS y Android a través de PWA)

---

## 2. Módulos Principales

### 2.1 Módulos Core
1. **Dashboard**: Panel principal con indicadores y resumen
2. **Ventas (POS)**: Punto de venta para procesar ventas
3. **Productos**: Gestión de catálogo de productos
4. **Inventario**: Control de stock y movimientos
5. **Compras**: Gestión de compras a proveedores
6. **Clientes (CRM)**: Gestión de clientes y relaciones
7. **Proveedores**: Gestión de proveedores
8. **Reportes**: Reportes y análisis
9. **Usuarios**: Gestión de usuarios y permisos
10. **Configuración**: Ajustes y preferencias

### 2.2 Módulos Secundarios
- **Categorías**: Clasificación de productos
- **Marcas**: Gestión de marcas de productos
- **Cajas**: Control de cajas registradoras
- **Gastos**: Registro de gastos operativos
- **Backup**: Respaldo y sincronización de datos

---

## 3. Autenticación y Usuarios

### 3.1 Registro y Login
- **Registro de comercio**: 
  - Dueño crea cuenta
  - Registra información del comercio (nombre, dirección, teléfono, logo)
  - Selecciona plan (Gratis, Básico, Pro, Premium)
  - Acepta términos y condiciones
- **Login/Inicio de sesión**: 
  - Email y contraseña
  - Recordar sesión (opcional)
  - Recuperación de contraseña
  - Login social (Google, Facebook) - opcional
- **Verificación de email**: Opcional para seguridad

### 3.2 Roles y Permisos
- **Dueño/Administrador**: 
  - Acceso completo a todos los módulos
  - Configuración del comercio
  - Gestión de usuarios
  - Reportes y análisis completos
- **Vendedor**: 
  - Acceso a POS (punto de venta)
  - Ver productos e inventario
  - Procesar ventas
  - Acceso limitado a reportes
- **Cajero**: 
  - Solo acceso a POS
  - Procesar ventas
  - No puede ver reportes ni configuración
- **Almacenero**: 
  - Gestión de productos e inventario
  - Gestión de compras
  - No acceso a ventas ni reportes financieros

### 3.3 Gestión de Usuarios
- **Agregar usuarios**: Crear usuarios con email, nombre, rol
- **Editar usuarios**: Modificar información, cambiar rol
- **Desactivar usuarios**: Deshabilitar sin eliminar (mantiene historial)
- **Permisos granulares**: Controlar acceso a funciones específicas

---

## 4. Módulo de Ventas (POS)

### 4.1 Pantalla Principal de Venta
- **Área de productos**: 
  - Grid o lista de productos
  - Búsqueda por nombre o código de barras
  - Filtros por categoría
  - Scanner de códigos de barras (cámara)
  - Mostrar precio y stock disponible
- **Carrito de compra**: 
  - Lista de productos seleccionados
  - Cantidad editable (botones +/- o input)
  - Precio unitario y subtotal por item
  - Descuentos por item (opcional)
  - Eliminar items
  - Resumen de totales (subtotal, descuentos, impuestos, total)

### 4.2 Proceso de Venta
1. **Seleccionar productos**: Buscar y agregar al carrito
2. **Aplicar descuentos** (opcional): Porcentaje o monto fijo
3. **Seleccionar cliente** (opcional): Buscar cliente o crear rápido
4. **Seleccionar método de pago**: 
   - Efectivo
   - Tarjeta (débito/crédito)
   - Transferencia
   - Cuenta corriente (para clientes registrados)
5. **Procesar pago**: 
   - Ingresar monto recibido (si efectivo, calcular vuelto)
   - Confirmar venta
6. **Imprimir ticket**: Opción para imprimir o enviar por email/SMS

### 4.3 Funcionalidades del POS
- **Teclado numérico virtual**: Para ingresar cantidades y montos
- **Scanner de códigos de barras**: Usar cámara del dispositivo
- **Múltiples métodos de pago**: Dividir pago entre varios métodos
- **Ventas rápidas**: Módulo completo de ventas rápidas con gestión de caja ✅
- **Guardar borrador**: Guardar venta en proceso para continuar después
- **Cancelar venta**: Volver a seleccionar productos
- **Historial de ventas**: Ver ventas del día/semana/mes

### 4.4 Tickets y Recibos
- **Generar ticket**: Formato de ticket/recibo
- **Imprimir**: Imprimir en impresora térmica o normal
- **Enviar por email**: Enviar ticket al email del cliente
- **Enviar por SMS**: Enviar por WhatsApp o SMS
- **Descargar PDF**: Descargar ticket en PDF
- **Información del ticket**: 
  - Nombre del comercio, dirección, teléfono
  - Número de ticket, fecha y hora
  - Items vendidos (cantidad, precio, subtotal)
  - Descuentos e impuestos
  - Total pagado y método de pago
  - QR code (opcional, para reclamos)

### 4.5 Gestión de Ventas
- **Lista de ventas**: Tabla con todas las ventas
  - ID/Número de venta
  - Fecha y hora
  - Cliente
  - Total
  - Método de pago
  - Estado (completada, cancelada, pendiente)
  - Vendedor
- **Detalle de venta**: Ver detalles completos de una venta
- **Editar venta**: Modificar venta (solo si no está procesada)
- **Cancelar venta**: Cancelar venta procesada (crea nota de crédito)
- **Duplicar venta**: Crear nueva venta basada en una existente
- **Filtros y búsqueda**: 
  - Por fecha
  - Por cliente
  - Por vendedor
  - Por método de pago
  - Por rango de monto
- **Exportar ventas**: Excel, PDF, CSV

---

## 5. Módulo de Productos

### 5.1 Gestión de Productos
- **Crear producto**: 
  - Nombre del producto
  - Código de barras (opcional, generar automático)
  - Código interno/SKU
  - Descripción
  - Categoría
  - Marca
  - Precio de venta
  - Precio de compra (costo)
  - Stock inicial
  - Stock mínimo (alerta)
  - Unidad de medida (unidad, kg, litro, etc.)
  - Imágenes (múltiples)
  - Proveedor principal
- **Editar producto**: Modificar cualquier campo
- **Eliminar producto**: Eliminar (o desactivar para mantener historial)
- **Duplicar producto**: Crear copia para variaciones

### 5.2 Vista de Productos
- **Vista de tabla**: Lista con columnas (nombre, código, precio, stock, etc.)
- **Vista de grid/cards**: Catálogo visual con imágenes
- **Búsqueda**: Por nombre, código, categoría
- **Filtros**: 
  - Por categoría
  - Por marca
  - Por proveedor
  - Por stock (con stock, sin stock, stock bajo)
  - Por precio (rango)
- **Ordenamiento**: Por nombre, precio, stock, fecha de creación

### 5.3 Información del Producto
- **Precios**: 
  - Precio de venta
  - Precio de compra (costo)
  - Margen de ganancia (calculado)
  - Precio con IVA/Impuesto (calculado)
- **Stock**: 
  - Stock actual
  - Stock mínimo (alerta)
  - Ubicación en almacén (opcional)
- **Historial**: 
  - Movimientos de stock
  - Ventas del producto
  - Compras del producto

### 5.4 Categorías de Productos
- **Crear categoría**: Nombre, descripción, imagen (opcional)
- **Editar categoría**: Modificar información
- **Eliminar categoría**: Solo si no tiene productos
- **Jerarquía**: Categorías y subcategorías (opcional)

### 5.5 Marcas
- **Crear marca**: Nombre, descripción, logo (opcional)
- **Editar marca**: Modificar información
- **Eliminar marca**: Solo si no tiene productos asociados

---

## 6. Módulo de Inventario

### 6.1 Control de Stock
- **Stock actual**: Ver stock de todos los productos
- **Alertas de stock bajo**: 
  - Productos con stock por debajo del mínimo
  - Notificaciones visuales
- **Movimientos de inventario**: 
  - Ingresos (compras, ajustes positivos)
  - Egresos (ventas, ajustes negativos)
  - Transferencias (entre almacenes, opcional)
- **Historial de movimientos**: 
  - Fecha y hora
  - Tipo de movimiento
  - Cantidad
  - Producto
  - Usuario que realizó el movimiento

### 6.2 Ajustes de Inventario
- **Ajuste manual**: 
  - Seleccionar producto
  - Indicar cantidad (positivo o negativo)
  - Motivo del ajuste
  - Observaciones
- **Inventario físico**: 
  - Contar productos físicamente
  - Registrar diferencias
  - Generar ajustes automáticos

### 6.3 Transferencias (Opcional)
- **Entre almacenes**: Si hay múltiples ubicaciones
- **Solicitar transferencia**: De un almacén a otro
- **Confirmar recepción**: Confirmar que llegó el producto

---

## 7. Módulo de Compras

### 7.1 Gestión de Compras
- **Crear orden de compra**: ✅
  - Seleccionar proveedor ✅
  - Agregar productos con autocompletado ✅
  - Cantidades y precios ✅
  - Descuentos e impuestos por producto ✅
  - Fecha de orden ✅
  - Observaciones ✅
  - Gestión de pagos múltiples ✅
  - Cálculo automático de deuda ✅
- **Recibir compra**: ✅
  - Confirmar recepción de productos ✅
  - Registrar cantidades recibidas por item ✅
  - Actualizar stock automáticamente ✅
- **Editar orden de compra**: ✅
  - Modificar datos de la compra ✅
  - Editar items ✅
  - Ver historial de pagos ✅
  - Agregar nuevos pagos ✅
- **Cancelar orden**: Cancelar si no se recibió

### 7.2 Lista de Compras
- **Tabla de compras**: ✅
  - Número de orden ✅
  - Proveedor ✅
  - Fecha de orden ✅
  - Fecha de recepción ✅
  - Total ✅
  - Estado (pendiente, recibida, cancelada) ✅
  - Estado de pago (Pagado/Deuda/Sin pago) ✅
- **Filtros**: Por proveedor, fecha, estado ✅
- **Búsqueda**: Por número de orden, proveedor ✅
- **Impresión**: Ticket POS 80mm con detalle completo ✅

### 7.3 Historial de Compras
- **Ver compra**: Detalle completo de orden de compra ✅
- **Productos comprados**: Lista con cantidades, precios, descuentos e impuestos ✅
- **Historial de pagos**: Lista de todos los pagos realizados ✅
- **Factura/Remito**: Adjuntar archivos PDF/imágenes (pendiente)

### 7.4 Módulo de Ventas Rápidas y Gestión de Caja

#### 7.4.1 Gestión de Caja
- **Apertura de caja**: ✅
  - Registrar importe inicial con formato de moneda ✅
  - Observaciones opcionales ✅
  - Fecha y hora automática ✅
  - Validación de usuario ✅
- **Cierre de caja**: ✅
  - Cálculo automático de ingresos desde apertura ✅
  - Cálculo automático de egresos ✅
  - Saldo final calculado ✅
  - Observaciones opcionales ✅
- **Estado de caja**: ✅
  - Indicador de caja abierta/cerrada ✅
  - Saldo actual en tiempo real ✅
  - Información de última apertura ✅
  - Indicadores visuales (inicio y estado actual) ✅
- **Historial de cajas**: ✅
  - Lista de todas las aperturas/cierres ✅
  - Filtros por fecha ✅
  - Detalle de cada operación ✅
  - Impresión de registros ✅

#### 7.4.2 Ventas Rápidas
- **Formulario simplificado**: ✅
  - Selección de cliente (opcional) con autocompletado ✅
  - Campo de total con formato de moneda ($1.000,00) ✅
  - Campo de monto pagado con formato de moneda ✅
  - Sincronización automática de monto pagado con total ✅
  - Método de pago (efectivo, transferencia, QR, débito, crédito, cheque, otro) ✅
  - Observaciones opcionales ✅
- **Registro de ventas**: ✅
  - Guardado en tabla `ventas_rapidas` ✅
  - Guardado en tabla `ventas` (consistencia de datos) ✅
  - Validación de caja abierta antes de registrar ✅
  - Cálculo automático de estado (PAGADO/DEBE) ✅
- **Lista de ventas rápidas**: ✅
  - Tabla con todas las ventas rápidas ✅
  - Filtro automático desde última apertura de caja ✅
  - Filtros manuales por fecha (desde/hasta) ✅
  - Indicador de estado (PAGADO/DEBE) con badges ✅
  - Acciones: Ver detalle, Imprimir ticket ✅
- **Detalle de venta rápida**: ✅
  - Información completa de la venta ✅
  - Información de la venta asociada en tabla `ventas` ✅
  - Impresión de ticket POS 80mm ✅

#### 7.4.3 Tickets de Impresión
- **Formato POS 80mm**: ✅
  - Encabezado con datos del comercio ✅
  - Información de la venta/compra (número, fecha, cliente) ✅
  - Lista de items (si aplica) ✅
  - Totales (parcial, pagado, saldo, total) ✅
  - Métodos de pago ✅
  - Mensaje aclaratorio: "Este ticket no es una factura ni tiene validez fiscal. Solo es un comprobante de venta." ✅
  - Pie con "Conserve este ticket" ✅

---

## 8. Módulo de Clientes (CRM)

### 8.1 Gestión de Clientes
- **Crear cliente**: 
  - Nombre completo
  - Email
  - Teléfono
  - Dirección
  - Tipo de documento (DNI, CUIT, etc.)
  - Número de documento
  - Fecha de nacimiento (opcional)
  - Notas/observaciones
- **Editar cliente**: Modificar información
- **Eliminar cliente**: Eliminar o desactivar (mantener historial)

### 8.2 Vista de Clientes
- **Lista de clientes**: Tabla con información principal
- **Búsqueda**: Por nombre, email, teléfono, documento
- **Filtros**: Por tipo, fecha de registro, activos/inactivos

### 8.3 Historial del Cliente
- **Compras realizadas**: Lista de todas las ventas del cliente
- **Total gastado**: Suma de todas las compras
- **Ticket promedio**: Promedio por compra
- **Última compra**: Fecha y monto de última compra
- **Productos más comprados**: Lista de productos favoritos

### 8.4 Cuenta Corriente (Opcional)
- **Pagar a cuenta**: Cliente puede comprar sin pagar inmediatamente
- **Saldo pendiente**: Ver saldo que debe el cliente
- **Pagos a cuenta**: Registrar pagos parciales o totales
- **Historial de pagos**: Ver todos los pagos realizados

### 8.5 Segmentación de Clientes
- **Clientes frecuentes**: Clientes que compran regularmente
- **Clientes VIP**: Clientes con mayor volumen de compras
- **Clientes inactivos**: Clientes que no compran hace tiempo
- **Notificaciones**: Recordatorios para contactar clientes

---

## 9. Módulo de Proveedores

### 9.1 Gestión de Proveedores
- **Crear proveedor**: 
  - Nombre/Razón social
  - Email
  - Teléfono
  - Dirección
  - CUIT/RUT
  - Contacto principal
  - Condiciones de pago
  - Plazo de entrega
  - Notas
- **Editar proveedor**: Modificar información
- **Eliminar proveedor**: Solo si no tiene compras asociadas

### 9.2 Vista de Proveedores
- **Lista de proveedores**: Tabla con información principal
- **Búsqueda**: Por nombre, CUIT, email
- **Filtros**: Por tipo, activos/inactivos

### 9.3 Historial del Proveedor
- **Compras realizadas**: Lista de todas las compras al proveedor
- **Total comprado**: Suma de todas las compras
- **Productos suministrados**: Lista de productos que provee

---

## 10. Módulo de Reportes

### 10.1 Reportes de Ventas
- **Ventas por período**: 
  - Diario
  - Semanal
  - Mensual
  - Anual
  - Personalizado (rango de fechas)
- **Ventas por vendedor**: Comparar ventas entre vendedores
- **Ventas por producto**: Productos más vendidos
- **Ventas por cliente**: Clientes que más compran
- **Ventas por método de pago**: Distribución de métodos de pago
- **Comparativa de períodos**: Comparar con período anterior

### 10.2 Reportes Financieros
- **Ingresos**: Total de ventas en un período
- **Egresos**: Total de compras y gastos
- **Ganancia bruta**: Ingresos - Costos
- **Margen de ganancia**: Porcentaje de ganancia
- **Estado de resultados**: Ingresos, costos, gastos, ganancia neta

### 10.3 Reportes de Inventario
- **Stock actual**: Valor del inventario actual
- **Productos sin movimiento**: Productos que no se venden
- **Productos más vendidos**: Top productos por cantidad
- **Productos más rentables**: Top productos por ganancia
- **Rotación de inventario**: Velocidad de rotación de productos

### 10.4 Reportes de Compras
- **Compras por proveedor**: Comparar proveedores
- **Compras por período**: Evolución de compras
- **Productos más comprados**: Top productos por cantidad

### 10.5 Exportación de Reportes
- **Formato PDF**: Para imprimir o compartir
- **Formato Excel**: Para análisis en Excel
- **Formato CSV**: Para importar en otros sistemas
- **Envío por email**: Enviar reportes automáticamente

---

## 11. Dashboard y Analytics

### 11.1 Panel Principal (Dashboard)

#### Implementado actualmente
- **KPIs principales**: 
  - Ventas del día
  - Productos en stock
  - Clientes totales
  - Stock bajo
- **Etiquetas para abrir gráficos**: Ventas, Compras, Categorías, Marcas, Clientes, Proveedores, Productos, Métodos de Pago, Horarios (al hacer clic se abre el gráfico correspondiente con la opción por defecto).
- **Gráficos** (todos colapsables y ocultos por defecto; se abren al hacer clic en el título o en la etiqueta):
  - **Gráfico de Ventas y Compras**: Barras verticales. Tabla a analizar: Registro de ventas / Registro de compras. Filtros por fecha, eje X (Fecha/Estado), eje Y ($ Total, Cantidad, Unidades), filtros por categoría, marca, producto, cliente/proveedor, método de pago.
  - **Gráfico de Referencias**: Barras horizontales. Referencia: Categorías, Marcas, Clientes, Proveedores, Productos. Para Cliente/Proveedor: filtro Todos (barras $ Total) o Debe (barras $ Deuda). Filtro por fecha. Rango eje X.
  - **Análisis por Métodos de Pago**: Gráfico de torta. Tabla: Ventas o Compras. Opciones: totales ($ Total por método) o con deudas ($ Debe + slice Deuda). Filtro por fecha (por defecto últimos 7 días).
  - **Ventas por horario**: Gráfico de línea (0–23 hs). Muestra $ Total y cantidad de operaciones por hora. Filtro desde-hasta (por defecto últimos 7 días).
- **Visualización de plan actual**: Badge con plan, Card "Tu Plan Actual", límites, período gratis, botón para cambiar plan (si es gratis).

#### Pendiente / roadmap
- **KPIs ampliados**: Ventas del mes/año, comparativa con período anterior, ticket promedio, ganancia bruta, clientes nuevos.
- **Gráficos adicionales**: Top productos más vendidos, comparativa mes a mes.
- **Actividad reciente**: Últimas ventas, últimas compras, productos agregados.
- **Alertas**: Stock bajo, ventas pendientes, tareas pendientes.

### 11.2 Filtros del Dashboard
- **Rango de fechas**: En cada gráfico: desde-hasta (por defecto últimos 7 días donde aplica).
- **Cambiar período**: Comparar con período anterior (pendiente).

### 11.3 Analytics Avanzados (Planes Pro/Premium)
- **Predicciones**: Ventas proyectadas
- **Análisis de tendencias**: Tendencias de ventas y productos
- **Análisis de clientes**: Segmentación y comportamiento
- **Análisis de rentabilidad**: Productos y categorías más rentables

---

## 12. Configuración

### 12.1 Configuración General
- **Datos del comercio**: 
  - Nombre
  - Dirección
  - Teléfono
  - Email
  - Logo
  - CUIT/RUT
- **Información fiscal**: 
  - Condición frente a IVA
  - Número de facturación
  - Tipo de factura (A, B, C, etc.)

### 12.2 Configuración de Ventas
- **Métodos de pago**: Activar/desactivar métodos
- **Impuestos**: Configurar porcentaje de IVA
- **Descuentos**: Permitir o no descuentos en ventas
- **Numeración de tickets**: Configurar numeración
- **Formato de ticket**: Personalizar formato de impresión

### 12.3 Configuración de Inventario
- **Unidades de medida**: Configurar unidades (unidad, kg, litro, etc.)
- **Alertas de stock**: Configurar umbrales de alerta
- **Control de stock**: Activar/desactivar control automático

### 12.4 Configuración de Usuario
- **Perfil de usuario**: 
  - Nombre
  - Email
  - Teléfono
  - Foto de perfil
- **Cambiar contraseña**: Actualizar contraseña
- **Preferencias**: 
  - Idioma
  - Zona horaria
  - Formato de fecha
  - Formato de moneda
  - Tema (claro/oscuro)

### 12.5 Configuración de Tema
- **Modo claro**: Tema con fondo claro
- **Modo oscuro**: Tema con fondo oscuro
- **Sistema**: Seguir preferencia del sistema operativo

### 12.6 Notificaciones
- **Alertas de stock bajo**: Activar/desactivar
- **Notificaciones de ventas**: Activar/desactivar
- **Recordatorios**: Configurar recordatorios personalizados

### 12.7 Backup y Sincronización
- **Backup automático**: Configurar frecuencia
- **Sincronización**: Sincronizar datos con servidor
- **Exportar datos**: Exportar toda la información
- **Importar datos**: Importar desde archivo

---

## 13. Funcionalidades Técnicas

### 13.1 Modo Online/Offline
- **Detección de conexión**: Detectar estado de conexión
- **Modo offline**: 
  - Funcionar sin conexión a Internet
  - Almacenar datos localmente
  - Sincronizar cuando se recupere conexión
- **Indicador de estado**: Mostrar si está online/offline
- **Sincronización automática**: Sincronizar datos cuando hay conexión

### 13.2 PWA (Progressive Web App)
- **Instalación**: Instalar en dispositivo como app nativa ✅
- **Service Worker mejorado**: ✅
  - Actualización automática cada 30 segundos ✅
  - Estrategia Network First para obtener versión más reciente ✅
  - Detección de actualizaciones al recuperar foco de ventana ✅
  - Actualización automática cuando detecta nueva versión ✅
  - Limpieza automática de caches antiguos ✅
  - Notificaciones opcionales de actualización ✅
- **Funcionamiento offline**: Service Worker para funcionar sin Internet (básico implementado)
- **Notificaciones push**: Notificaciones del sistema (pendiente)
- **Actualización automática**: Actualizar app automáticamente ✅

### 13.3 Impresión
- **Impresión de tickets**: Impresoras térmicas o normales
- **Impresión de reportes**: Formatos personalizables
- **Vista previa**: Ver antes de imprimir
- **Configuración de impresora**: Seleccionar impresora predeterminada

### 13.4 Integraciones (Futuro)
- **Códigos de barras**: Generar y escanear códigos de barras
- **Impresión fiscal**: Integración con impresoras fiscales
- **Pasarelas de pago**: Integración con sistemas de pago
- **Email**: Envío de tickets y reportes por email
- **SMS/WhatsApp**: Envío de notificaciones

### 13.5 Seguridad
- **Encriptación**: Datos encriptados
- **Autenticación**: Login seguro
- **Permisos**: Control de acceso por roles
- **Auditoría**: Registro de acciones de usuarios
- **Backup**: Respaldo regular de datos

---

## 📝 Notas Finales

### Funcionalidades por Plan (Freemium)
- **Gratis**: 
  - Funciones básicas limitadas
  - Hasta X productos
  - Hasta X usuarios
  - Reportes básicos
  - Sin soporte prioritario
- **Básico**: 
  - Más productos
  - Más usuarios
  - Reportes completos
  - Soporte por email
- **Pro**: 
  - Productos ilimitados
  - Usuarios ilimitados
  - Analytics avanzados
  - Integraciones
  - Soporte prioritario
- **Premium**: 
  - Todo lo de Pro
  - Funciones avanzadas
  - Personalización
  - Soporte 24/7

### Prioridades de Desarrollo
1. **Fase 1** (MVP): Login, Productos, Ventas (POS), Clientes, Dashboard básico
2. **Fase 2**: Inventario, Compras, Proveedores, Reportes básicos
3. **Fase 3**: Analytics avanzados, Integraciones, Funciones premium

---

**Última actualización**: Enero 2026

