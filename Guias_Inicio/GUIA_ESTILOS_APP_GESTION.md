# Guía Completa de Estilos para App de Gestión de Comercios

## 📋 Índice
1. [Sistema de Colores](#1-sistema-de-colores)
2. [Tipografía (Letras)](#2-tipografía-letras)
3. [Botones](#3-botones)
4. [Campos de Formulario](#4-campos-de-formulario)
5. [Componentes de UI](#5-componentes-de-ui)
   - 5.1 [Cards (Tarjetas)](#51-cards-tarjetas)
   - 5.2 [Tablas](#52-tablas) ⭐ *(Incluye ejemplo específico de tabla de ventas)*
   - 5.3 [Modales (Ventanas emergentes)](#53-modales-ventanas-emergentes)
   - 5.4 [Alertas/Notificaciones](#54-alertasnotificaciones)
   - 5.5 [Badges/Etiquetas](#55-badgesetiquetas)
   - 5.6 [Dropdowns/Menús desplegables](#56-dropdownsmenús-desplegables)
   - 5.7 [Navbar/Barra de navegación](#57-navbarbarra-de-navegación)
   - 5.8 [Sidebar/Menú lateral](#58-sidebarmenú-lateral)
   - 5.9 [Breadcrumbs (Migas de pan)](#59-breadcrumbs-migas-de-pan)
   - 5.10 [Paginación](#510-paginación)
   - 5.11 [Tabs/Pestañas](#511-tabspestañas)
   - 5.12 [Progress Bars (Barras de progreso)](#512-progress-bars-barras-de-progreso)
   - 5.13 [Spinners/Loaders](#513-spinnersloaders)
   - 5.14 [Tooltips](#514-tooltips)
   - 5.15 [Popovers](#515-popovers)
   - 5.16 [Dashboard e Indicadores (KPIs)](#516-dashboard-e-indicadores-kpis) ⭐
   - 5.17 [Vista Grid/Cards para Productos](#517-vista-gridcards-para-productos)
   - 5.18 [Punto de Venta (POS) / Checkout](#518-punto-de-venta-pos--checkout) ⭐
   - 5.19 [Planes de Precios y Modelo Freemium](#519-planes-de-precios-y-modelo-freemium) ⭐
   - 5.20 [Carga de Imágenes (Upload)](#520-carga-de-imágenes-upload)
   - 5.21 [Estilos de Impresión](#521-estilos-de-impresión)
   - 5.22 [Autenticación y Registro](#522-autenticación-y-registro) ⭐
   - 5.23 [Landing Page](#523-landing-page) ⭐
   - 5.24 [Configuración y Estados del Sistema](#524-configuración-y-estados-del-sistema) ⭐
6. [Layout y Estructura](#6-layout-y-estructura)
7. [Espaciados y Tamaños](#7-espaciados-y-tamaños)
8. [Efectos y Animaciones](#8-efectos-y-animaciones)
9. [Responsive (Multi-dispositivo)](#9-responsive-multi-dispositivo)
10. [Estados y Feedback Visual](#10-estados-y-feedback-visual)

---

## 1. Sistema de Colores

### 1.1 Colores Primarios
- **Color principal** (Primary): Color de marca (ej: #667eea)
- **Color secundario** (Secondary): Color complementario
- **Color de acento** (Accent): Color destacado para CTAs
- **Variaciones**: lighter, darker, hover states

### 1.2 Colores Semánticos (Para estados y acciones)
- **Éxito** (Success): Verde - operaciones exitosas (#28a745)
- **Peligro/Error** (Danger): Rojo - errores, eliminar (#dc3545)
- **Advertencia** (Warning): Amarillo/Naranja - advertencias (#ffc107)
- **Info** (Info): Azul - información (#17a2b8)
- **Neutro** (Neutral): Grises para textos secundarios

### 1.3 Colores de Fondo
- **Fondo principal**: Blanco (#ffffff)
- **Fondo secundario**: Gris claro (#f8f9fa)
- **Fondo oscuro**: Para headers/footers (#2c3e50)
- **Overlay**: Fondos semitransparentes para modales

### 1.4 Colores de Texto
- **Texto principal**: Oscuro (#212529 o #2c3e50)
- **Texto secundario**: Gris medio (#6c757d)
- **Texto deshabilitado**: Gris claro (#adb5bd)
- **Texto sobre fondo oscuro**: Blanco (#ffffff)
- **Enlaces**: Color primario con hover

### 1.5 Colores para Gestión de Comercios (Específicos)
- **Positivo/Ingresos**: Verde (#28a745)
- **Negativo/Egresos**: Rojo (#dc3545)
- **Stock bajo**: Naranja (#fd7e14)
- **Stock crítico**: Rojo (#dc3545)
- **Stock normal**: Verde (#28a745)
- **Pendiente**: Amarillo (#ffc107)
- **Procesado**: Verde (#28a745)
- **Cancelado**: Gris (#6c757d)

### 1.6 Gradientes
- Gradientes para hero sections
- Gradientes para botones especiales
- Gradientes para cards destacadas

---

## 2. Tipografía (Letras)

### 2.1 Fuentes (Font Family)
- **Fuente principal**: Sans-serif moderna (Inter, Roboto, Open Sans, System fonts)
- **Fuente monoespaciada**: Para códigos, números, tablas de datos (Courier, Monaco)
- **Fallbacks**: Arial, Helvetica, sans-serif

### 2.2 Tamaños de Fuente (Font Size)
- **H1 (Títulos principales)**: 2.5rem - 3rem (40px - 48px)
- **H2 (Subtítulos)**: 2rem - 2.5rem (32px - 40px)
- **H3 (Títulos de sección)**: 1.75rem - 2rem (28px - 32px)
- **H4 (Subtítulos menores)**: 1.5rem (24px)
- **H5**: 1.25rem (20px)
- **H6**: 1rem (16px)
- **Body (Texto normal)**: 1rem (16px)
- **Small (Texto pequeño)**: 0.875rem (14px)
- **Extra small**: 0.75rem (12px)

### 2.3 Pesos de Fuente (Font Weight)
- **Thin/Light**: 300
- **Regular/Normal**: 400
- **Medium**: 500
- **Semi-bold**: 600
- **Bold**: 700
- **Extra-bold**: 800
- **Black**: 900

### 2.4 Altura de Línea (Line Height)
- **Títulos**: 1.1 - 1.2 (compacto)
- **Párrafos**: 1.5 - 1.8 (legible)
- **Listas**: 1.6
- **Código/Números**: 1.4

### 2.5 Estilos de Texto
- **Normal**: Sin modificaciones
- **Negrita** (Bold): Para énfasis
- **Cursiva** (Italic): Para citas, notas
- **Subrayado**: Solo para enlaces
- **Tachado**: Para precios antiguos, descuentos
- **Mayúsculas**: Para etiquetas, badges (text-transform: uppercase)

### 2.6 Alineación de Texto
- **Izquierda**: Texto normal, párrafos
- **Centro**: Títulos, CTAs, botones
- **Derecha**: Números, precios, tablas
- **Justificado**: Solo para textos largos (raro en apps)

### 2.7 Espaciado de Texto (Letter Spacing)
- **Normal**: 0
- **Títulos grandes**: 0.5px - 1px (más espaciado)
- **Mayúsculas**: 1px - 2px (mejor legibilidad)

---

## 3. Botones

### 3.1 Tipos de Botones
- **Primario** (Primary): Acción principal (color de marca)
- **Secundario** (Secondary): Acción secundaria
- **Éxito** (Success): Confirmar, guardar, aprobar
- **Peligro** (Danger): Eliminar, cancelar operación crítica
- **Advertencia** (Warning): Advertir, revisar
- **Info**: Información, ayuda
- **Outline**: Botones con borde, sin relleno
- **Texto/Link**: Botones como enlaces
- **Ghost**: Botones transparentes

### 3.2 Tamaños de Botones
- **Extra pequeño** (xs): 0.5rem padding, 0.75rem font
- **Pequeño** (sm): 0.5rem - 0.75rem padding, 0.875rem font
- **Normal/Mediano** (md): 0.75rem - 1rem padding, 1rem font
- **Grande** (lg): 1rem - 1.25rem padding, 1.125rem font
- **Extra grande** (xl): 1.25rem - 1.5rem padding, 1.25rem font

### 3.3 Forma de Botones
- **Rectangular con esquinas redondeadas**: border-radius: 4px - 12px
- **Pill/Cápsula**: border-radius: 50px (muy redondeado)
- **Cuadrado**: border-radius: 0 (raro, solo casos específicos)

### 3.4 Estados de Botones
- **Normal**: Estado por defecto
- **Hover**: Cambio de color, elevación, escala
- **Active/Pressed**: Estado al hacer clic
- **Focus**: Borde/outline para accesibilidad
- **Disabled**: Opacidad reducida, cursor not-allowed, sin interacción
- **Loading**: Spinner, texto cambiado ("Guardando...")

### 3.5 Botones con Iconos
- Icono a la izquierda del texto
- Icono a la derecha del texto
- Solo icono (botones cuadrados)
- Tamaño de icono proporcional al botón

### 3.6 Botones Especiales para Gestión
- **Guardar/Crear**: Success, con ícono de check/plus
- **Editar**: Info, con ícono de lápiz
- **Eliminar**: Danger, con ícono de trash
- **Exportar**: Secondary, con ícono de download
- **Imprimir**: Secondary, con ícono de printer
- **Buscar/Filtrar**: Primary, con ícono de search
- **Aprobar/Confirmar**: Success, con ícono de check
- **Cancelar**: Danger o Secondary, con ícono de X

---

## 4. Campos de Formulario

### 4.1 Tipos de Campos
- **Input de texto**: Texto normal
- **Input numérico**: Números, precios, cantidades
- **Input de email**: Email
- **Input de teléfono**: Teléfono
- **Input de contraseña**: Con ocultar/mostrar
- **Textarea**: Texto multilínea
- **Select/Dropdown**: Lista desplegable
- **Checkbox**: Casillas de verificación
- **Radio**: Botones de opción
- **Date/Time picker**: Fechas y horas
- **File upload**: Subir archivos
- **Autocomplete/Search**: Búsqueda con sugerencias

### 4.2 Estilos de Campos
- **Borde**: 1px - 2px solid, color gris (#dee2e6)
- **Border radius**: 4px - 12px (redondeado)
- **Padding**: 0.5rem - 0.75rem vertical, 1rem horizontal
- **Altura**: Consistente (ej: 2.5rem para inputs normales)
- **Fondo**: Blanco (#ffffff)
- **Color de texto**: Oscuro (#212529)

### 4.3 Estados de Campos
- **Normal**: Borde gris, fondo blanco
- **Focus**: Borde color primario, sombra/outline
- **Hover**: Borde ligeramente más oscuro
- **Error**: Borde rojo, texto de error debajo
- **Success/Validado**: Borde verde, check icon
- **Disabled**: Fondo gris claro, texto gris, cursor not-allowed
- **Readonly**: Fondo gris muy claro, borde más sutil

### 4.4 Labels (Etiquetas)
- **Posición**: Encima del campo o inline (izquierda)
- **Tamaño**: 0.875rem - 1rem
- **Peso**: 500 - 600 (medium/semi-bold)
- **Color**: Texto oscuro
- **Obligatorio**: Asterisco (*) en rojo
- **Opcional**: Texto "(opcional)" en gris

### 4.5 Placeholders
- **Color**: Gris claro (#adb5bd)
- **Estilo**: Italic opcional
- **Texto**: Ejemplos claros y útiles

### 4.6 Mensajes de Ayuda y Error
- **Texto de ayuda**: Gris, pequeño (0.875rem), debajo del campo
- **Mensaje de error**: Rojo, pequeño, debajo del campo
- **Mensaje de éxito**: Verde, pequeño, con icono
- **Contador de caracteres**: Gris, pequeño, esquina superior derecha

### 4.7 Campos Específicos para Gestión de Comercios
- **Precios/Monetarios**: Input numérico con símbolo de moneda ($)
- **Cantidades/Stock**: Input numérico, solo números enteros
- **Porcentajes**: Input numérico con símbolo %
- **Códigos de barras**: Input texto, fuente monoespaciada
- **Fechas de vencimiento**: Date picker
- **Categorías/Proveedores**: Select o Autocomplete
- **Descripción de productos**: Textarea grande
- **Imágenes de productos**: File upload con preview

---

## 5. Componentes de UI

### 5.1 Cards (Tarjetas)
- **Fondo**: Blanco
- **Borde**: 1px solid #e9ecef o sin borde
- **Border radius**: 8px - 20px
- **Sombra**: 0 2px 10px rgba(0,0,0,0.05) - 0 10px 30px rgba(0,0,0,0.15)
- **Padding**: 1.5rem - 2rem
- **Hover**: Elevación (transform: translateY(-5px)), sombra más fuerte
- **Header**: Borde inferior, padding, fondo opcional
- **Body**: Contenido principal
- **Footer**: Borde superior, padding, acciones

### 5.2 Tablas

#### 5.2.1 Estilos Generales de Tablas
- **Bordes**: 1px solid #dee2e6 (entre celdas)
- **Border radius**: 8px (en la tabla completa, no en celdas individuales)
- **Fondo**: Blanco (#ffffff)
- **Sombra**: 0 1px 3px rgba(0,0,0,0.1) (opcional, para tabla con card)

#### 5.2.2 Header (Encabezado) de Tabla
- **Fondo**: Gris claro (#f8f9fa) o blanco con borde inferior
- **Texto**: Bold (700), tamaño 0.875rem - 1rem
- **Color texto**: Oscuro (#212529)
- **Padding**: 0.75rem - 1rem (vertical y horizontal)
- **Borde inferior**: 2px solid #dee2e6 (más grueso que entre filas)
- **Altura mínima**: 48px (touch-friendly)
- **Cursor pointer**: Si es ordenable (sortable)
- **Iconos de ordenamiento**: Flechas pequeñas para asc/desc

#### 5.2.3 Filas (Rows)
- **Fondo alternado (Striped)**: 
  - Filas pares: Blanco (#ffffff)
  - Filas impares: Gris muy claro (#f8f9fa) - opcional pero recomendado
- **Hover en filas**: Fondo gris claro (#e9ecef), cursor pointer
- **Borde entre filas**: 1px solid #dee2e6
- **Altura mínima**: 48px (touch-friendly en móvil)
- **Padding celdas**: 0.75rem - 1rem (vertical), 1rem (horizontal)
- **Estados especiales**:
  - **Fila seleccionada**: Fondo azul claro (#cfe2ff), borde azul
  - **Fila destacada**: Fondo amarillo muy claro (#fff3cd)

#### 5.2.4 Celdas (Cells)
- **Alineación texto**: 
  - Texto: Izquierda (left)
  - Números: Derecha (right)
  - Fechas: Centro o izquierda
  - Estados/Badges: Centro
- **Color texto**: Oscuro (#212529)
- **Texto secundario**: Gris (#6c757d), tamaño 0.875rem
- **Overflow**: Text-overflow: ellipsis para textos largos
- **Word-wrap**: Break-word para textos muy largos

#### 5.2.5 Tipos de Columnas Específicas

##### Columnas de Texto
- **Alineación**: Izquierda
- **Truncado**: Con ellipsis (...) si es muy largo
- **Tooltip**: Mostrar texto completo al hover si está truncado

##### Columnas Numéricas (Precios, Cantidades, Totales)
- **Alineación**: Derecha
- **Fuente**: Puede ser monoespaciada para alineación perfecta
- **Formato**:
  - **Monetarios**: Símbolo de moneda ($), separadores de miles, 2 decimales
  - **Ejemplo**: $1,234.56
  - **Cantidades**: Enteros, sin decimales (excepto si es necesario)
  - **Porcentajes**: Símbolo % al final

##### Columnas de Fecha/Hora
- **Formato**: DD/MM/YYYY o DD-MM-YYYY (Argentina)
- **Hora**: HH:MM (24hs) o HH:MM AM/PM
- **Alineación**: Izquierda o centro
- **Fuente**: Tamaño 0.875rem opcional para ahorrar espacio

##### Columnas de Estado
- **Badges**: Pequeños, con colores semánticos
- **Ejemplos**:
  - Pagado: Badge verde
  - Pendiente: Badge amarillo
  - Cancelado: Badge gris
  - Vencido: Badge rojo
- **Alineación**: Centro

##### Columnas de Acciones
- **Botones/Iconos**: Pequeños, inline
- **Espaciado**: Gap entre botones (0.5rem)
- **Hover**: Efecto visual en cada botón
- **Acciones comunes**: Ver (ojo), Editar (lápiz), Eliminar (papelera), Duplicar
- **Dropdown**: Si hay muchas acciones, usar dropdown con 3 puntos

#### 5.2.6 Tabla de Ventas (Ejemplo Específico)

##### Columnas Típicas de una Tabla de Ventas:
1. **ID/Número de Venta**
   - Alineación: Izquierda
   - Formato: #0001, V-2026-001
   - Font: Monoespace opcional
   - Link: Clickable para ver detalle

2. **Fecha y Hora**
   - Alineación: Izquierda
   - Formato: DD/MM/YYYY HH:MM
   - Tamaño: 0.875rem

3. **Cliente**
   - Alineación: Izquierda
   - Truncado: Con ellipsis si es largo
   - Tooltip: Nombre completo al hover

4. **Productos/Items**
   - Alineación: Izquierda
   - Formato: "3 productos" o lista abreviada
   - Link: Clickable para ver detalle

5. **Cantidad Total**
   - Alineación: Derecha
   - Formato: Número entero

6. **Subtotal**
   - Alineación: Derecha
   - Formato: $1,234.56
   - Font: Monoespace opcional

7. **Descuento**
   - Alineación: Derecha
   - Formato: $123.45 o -10%
   - Color: Rojo si es descuento negativo

8. **Impuestos**
   - Alineación: Derecha
   - Formato: $123.45
   - Color: Gris secundario

9. **Total**
   - Alineación: Derecha
   - Formato: $1,234.56
   - Font: Bold, tamaño ligeramente mayor
   - Color: Texto oscuro o color primario

10. **Estado de Pago**
    - Alineación: Centro
    - Badge: 
      - Pagado: Verde (#28a745)
      - Pendiente: Amarillo (#ffc107)
      - Parcial: Azul (#17a2b8)
      - Cancelado: Gris (#6c757d)
      - Vencido: Rojo (#dc3545)

11. **Método de Pago**
    - Alineación: Centro
    - Badge o icono: Efectivo, Tarjeta, Transferencia, etc.

12. **Acciones**
    - Alineación: Centro
    - Botones: Ver, Imprimir, Duplicar, Eliminar
    - Tamaño: Small (sm)

##### Fila de Totales (Footer de Tabla)
- **Fondo**: Gris claro (#f8f9fa) o color primario claro
- **Borde superior**: 2px solid #dee2e6
- **Texto**: Bold
- **Padding**: 1rem
- **Columnas**: Suma de cantidades, suma de totales
- **Alineación**: Derecha para números

#### 5.2.7 Funcionalidades de Tabla

##### Ordenamiento (Sorting)
- **Iconos**: Flechas en header (↑ ↓)
- **Estado activo**: Color primario en header y flecha
- **Hover**: Cambio de color en header
- **Cursor**: Pointer en headers ordenables

##### Filtros y Búsqueda
- **Barra de búsqueda**: Encima de la tabla
- **Filtros**: Dropdowns o inputs inline
- **Botón limpiar**: Para resetear filtros
- **Badge**: Contador de resultados/filtros activos

##### Selección
- **Checkbox**: Primera columna para seleccionar filas
- **Checkbox en header**: Seleccionar/deseleccionar todos
- **Fila seleccionada**: Fondo azul claro (#cfe2ff)
- **Contador**: "X seleccionados" arriba de la tabla

##### Paginación
- **Posición**: Debajo de la tabla
- **Elementos**: 
  - Botones: Primero, Anterior, Números, Siguiente, Último
  - Info: "Mostrando 1-10 de 150 resultados"
  - Select: "Mostrar X por página"

##### Exportar
- **Botón**: Encima de la tabla (derecha)
- **Opciones**: Excel, PDF, CSV
- **Icono**: Download

#### 5.2.8 Responsive - Tablas en Móvil

##### Opción 1: Scroll Horizontal
- **Container**: Overflow-x: auto
- **Ancho mínimo**: Mantener columnas, permitir scroll
- **Indicador**: Sombra lateral para indicar más contenido
- **Sticky primera columna**: Opcional (ID siempre visible)

##### Opción 2: Cards (Recomendado para móvil)
- **Cada fila se convierte en una card**
- **Layout vertical**: Cada dato en una fila
- **Etiquetas**: Label a la izquierda, valor a la derecha
- **Badges**: Estados y acciones visibles
- **Acciones**: Botones al final de la card

##### Opción 3: Tabla Colapsable
- **Columna principal**: Siempre visible (ej: ID, Cliente)
- **Columna secundaria**: Se ocultan en móvil
- **Botón expandir**: Para ver más detalles

#### 5.2.9 Estados Vacíos y Carga

##### Tabla Vacía
- **Mensaje**: "No hay registros de ventas"
- **Icono**: Grande, gris
- **Texto**: Centrado, tamaño mediano
- **CTA**: Botón "Crear primera venta"

##### Carga (Loading)
- **Skeleton rows**: Filas con animación de carga
- **Spinner**: Centrado si es carga inicial
- **Overlay**: Sobre la tabla si es recarga

##### Error
- **Mensaje**: "Error al cargar los datos"
- **Icono**: Alerta
- **Botón**: "Reintentar"

#### 5.2.10 Accesibilidad
- **Caption**: Título/descripción de la tabla (opcional pero recomendado)
- **Scope**: En headers (col o row)
- **ARIA labels**: Para botones de acción
- **Navegación por teclado**: Tab, Enter, Espacio
- **Focus visible**: En filas seleccionables

### 5.3 Modales (Ventanas emergentes)
- **Overlay/Backdrop**: Fondo oscuro semitransparente (rgba(0,0,0,0.5))
- **Modal**: Fondo blanco, border-radius 8px - 16px
- **Header**: Borde inferior, título bold, botón cerrar
- **Body**: Padding generoso
- **Footer**: Borde superior, botones de acción
- **Tamaños**: Small, Medium (default), Large, Fullscreen

### 5.4 Alertas/Notificaciones
- **Éxito**: Fondo verde claro, borde verde, ícono check
- **Error**: Fondo rojo claro, borde rojo, ícono X
- **Advertencia**: Fondo amarillo claro, borde amarillo, ícono !
- **Info**: Fondo azul claro, borde azul, ícono i
- **Dismissible**: Botón X para cerrar
- **Posiciones**: Top, bottom, fixed, inline

### 5.5 Badges/Etiquetas
- **Tamaños**: Small (0.75rem), Normal (0.875rem), Large (1rem)
- **Formas**: Pill (muy redondeado) o rectangular
- **Colores**: Primary, success, danger, warning, info, secondary
- **Uso**: Notificaciones, estados, categorías, contadores

### 5.6 Dropdowns/Menús desplegables
- **Trigger**: Botón o enlace
- **Menú**: Fondo blanco, sombra, border-radius
- **Items**: Padding, hover effect
- **Divider**: Línea separadora entre grupos
- **Header**: Texto pequeño, uppercase, gris

### 5.7 Navbar/Barra de navegación
- **Fondo**: Blanco o color primario
- **Altura**: 56px - 80px
- **Sticky/Fixed**: Puede quedar fija al hacer scroll
- **Logo**: Izquierda, tamaño medio
- **Enlaces**: Derecha o centro, espaciados
- **Mobile**: Hamburger menu (3 líneas)
- **Active state**: Resaltado del enlace actual

### 5.8 Sidebar/Menú lateral
- **Ancho**: 200px - 280px (desktop), 100% width (mobile)
- **Fondo**: Blanco o gris claro
- **Items**: Padding, hover, active state
- **Iconos**: A la izquierda del texto
- **Collapsible**: Puede colapsar/expandir
- **Mobile**: Overlay, se cierra al hacer clic fuera

### 5.9 Breadcrumbs (Migas de pan)
- **Separador**: "/" o ">"
- **Color**: Gris para items, oscuro para actual
- **Tamaño**: 0.875rem - 1rem
- **Espaciado**: Pequeño entre items

### 5.10 Paginación
- **Botones**: Números, anterior, siguiente
- **Active**: Resaltado con color primario
- **Disabled**: Gris, sin interacción
- **Hover**: Cambio de fondo

### 5.11 Tabs/Pestañas
- **Borde inferior**: Para indicar activo
- **Hover**: Cambio de color
- **Active**: Color primario, borde grueso
- **Disabled**: Gris, sin interacción

### 5.12 Progress Bars (Barras de progreso)
- **Fondo**: Gris claro
- **Barra**: Color primario o semántico
- **Tamaño**: Altura 8px - 20px
- **Animación**: Transición suave
- **Texto**: Porcentaje opcional

### 5.13 Spinners/Loaders
- **Tipo**: Circular, dots, bars
- **Tamaño**: Small, medium, large
- **Color**: Primario o blanco (sobre fondo oscuro)
- **Posición**: Centrado, inline, overlay

### 5.14 Tooltips
- **Fondo**: Oscuro (#212529)
- **Texto**: Blanco, pequeño
- **Flecha**: Pequeña, apunta al elemento
- **Posición**: Top, bottom, left, right
- **Delay**: Aparece después de hover

### 5.15 Popovers
- **Similar a tooltip pero más grande**
- **Puede contener**: Texto, formularios, acciones
- **Header opcional**: Con título
- **Fondo**: Blanco

### 5.16 Dashboard e Indicadores (KPIs)

#### 5.16.1 Cards de Indicadores/KPIs

##### Estructura General
- **Fondo**: Blanco (#ffffff)
- **Border**: 1px solid #e9ecef o sin borde
- **Border radius**: 12px - 16px
- **Sombra**: 0 2px 8px rgba(0,0,0,0.08)
- **Padding**: 1.5rem - 2rem
- **Hover**: Elevación sutil (transform: translateY(-2px)), sombra más fuerte
- **Layout**: Grid responsive (1-4 columnas según pantalla)

##### Elementos de una Card KPI
- **Icono/Indicador visual**: 
  - Posición: Esquina superior derecha o izquierda
  - Tamaño: 40px - 56px
  - Color: Color semántico o primario
  - Opacidad: 0.1 - 0.2 de fondo, icono sólido encima
- **Etiqueta/Título**:
  - Texto: Nombre del indicador (ej: "Ventas del Mes")
  - Tamaño: 0.875rem - 1rem
  - Color: Gris (#6c757d)
  - Peso: 400 - 500 (normal/medium)
  - Transform: Uppercase opcional para etiquetas cortas
- **Valor principal**:
  - Texto: Número grande, destacado
  - Tamaño: 2rem - 3rem (32px - 48px)
  - Peso: 700 - 800 (bold/extra-bold)
  - Color: Oscuro (#212529) o color primario
- **Variación/Comparación**:
  - Texto: Porcentaje o diferencia vs. período anterior
  - Tamaño: 0.875rem - 1rem
  - Color: Verde si positivo, rojo si negativo, gris si neutro
  - Icono: Flecha arriba (↑) verde, flecha abajo (↓) roja
  - Formato: "+15.5%" o "-8.2%"

##### Tipos de Cards KPI

**KPI Simple (Número + Variación)**
- Layout: Icono + Etiqueta + Valor grande + Variación
- Uso: Ventas totales, Clientes, Productos vendidos

**KPI con Progreso**
- Incluye: Barra de progreso o círculo de progreso
- Uso: Meta alcanzada, Porcentaje de completitud

**KPI con Mini Gráfico**
- Incluye: Sparkline o mini gráfico de línea
- Uso: Tendencias, Evolución temporal

**KPI con Lista**
- Incluye: Top 3-5 items relacionados
- Uso: Productos más vendidos, Clientes principales

#### 5.16.2 Gráficos y Visualizaciones

##### Tipos de Gráficos Comunes
- **Gráfico de Línea**: Para tendencias temporales
- **Gráfico de Barras**: Para comparaciones
- **Gráfico de Pie/Dona**: Para distribuciones/porcentajes
- **Gráfico de Área**: Para acumulados
- **Gráfico Combinado**: Líneas + barras

##### Estilos de Gráficos
- **Container**: Fondo blanco, border-radius 12px, padding 1.5rem
- **Título del gráfico**: 
  - Tamaño: 1.25rem - 1.5rem
  - Peso: 600 - 700
  - Margin bottom: 1rem
- **Leyenda**: 
  - Posición: Abajo o derecha
  - Tamaño fuente: 0.875rem
  - Colores: Coherentes con paleta de la app
- **Tooltip**: 
  - Fondo oscuro, texto blanco
  - Border radius: 6px
  - Padding: 0.5rem
- **Ejes**: 
  - Color: Gris claro (#dee2e6)
  - Texto: Gris (#6c757d), tamaño 0.75rem - 0.875rem

##### Colores para Gráficos
- **Serie 1**: Color primario
- **Serie 2**: Color secundario
- **Serie 3+**: Colores complementarios diferenciados
- **Positivo**: Verde (#28a745)
- **Negativo**: Rojo (#dc3545)
- **Neutro**: Gris (#6c757d)

#### 5.16.3 Widgets y Secciones del Dashboard

##### Filtros Rápidos de Fecha
- **Posición**: Arriba del dashboard
- **Estilo**: Botones o dropdown
- **Opciones comunes**: 
  - Hoy, Ayer, Última semana, Último mes, Último año
  - Rango personalizado (date picker)
- **Estado activo**: Resaltado con color primario

##### Resumen/Overview Section
- **Título**: "Resumen" o "Resumen Ejecutivo"
- **Layout**: Grid de 2-4 columnas (cards KPI)
- **Espaciado**: Gap de 1.5rem - 2rem

##### Sección de Actividad Reciente
- **Título**: "Actividad Reciente" o "Últimas Transacciones"
- **Estilo**: Tabla pequeña o lista de cards
- **Cantidad**: 5-10 items
- **Link**: "Ver todas" al final

##### Sección de Alertas/Notificaciones
- **Estilo**: Lista de alertas con iconos
- **Colores**: Según tipo (warning, danger, info)
- **Dismissible**: Botón X para cerrar

#### 5.16.4 Layout del Dashboard

##### Grid System
- **Desktop**: 2-4 columnas
- **Tablet**: 2 columnas
- **Mobile**: 1 columna (stack vertical)
- **Gutters**: 1.5rem - 2rem

##### Ordenamiento de Widgets
- **Prioridad visual**: 
  1. KPIs principales (arriba, más grandes)
  2. Gráficos principales (centro, ancho completo o 2 columnas)
  3. Tablas/listas (abajo)
- **Tamaños relativos**:
  - KPI cards: 1 columna (25% del ancho en desktop)
  - Gráficos: 2 columnas (50%) o full width (100%)
  - Tablas: Full width o 2-3 columnas

##### Responsive Dashboard
- **Desktop (≥ 992px)**: Grid de 4 columnas, todos los widgets visibles
- **Tablet (768px - 991px)**: Grid de 2 columnas, algunos widgets se reorganizan
- **Mobile (< 768px)**: 1 columna, widgets apilados verticalmente

#### 5.16.5 Indicadores Específicos para Gestión de Comercios

##### Ventas
- **Indicadores comunes**:
  - Ventas totales (hoy/mes/año)
  - Ventas promedio por día
  - Comparación vs. período anterior
  - Cantidad de transacciones
- **Colores**: Verde para positivo, rojo para negativo
- **Formato monetario**: $ con separadores de miles

##### Inventario/Stock
- **Indicadores comunes**:
  - Productos con stock bajo
  - Productos agotados
  - Valor total del inventario
  - Rotación de inventario
- **Colores**: 
  - Verde: Stock normal
  - Amarillo/Naranja: Stock bajo
  - Rojo: Stock crítico/agotado

##### Clientes
- **Indicadores comunes**:
  - Total de clientes
  - Clientes nuevos (período)
  - Clientes activos
  - Ticket promedio
- **Iconos**: Personas, usuarios, grupo

##### Compras/Proveedores
- **Indicadores comunes**:
  - Compras del mes
  - Proveedores activos
  - Órdenes pendientes
- **Colores**: Similar a ventas pero para egresos

##### Finanzas
- **Indicadores comunes**:
  - Ingresos vs. Egresos
  - Ganancia bruta
  - Margen de ganancia
  - Cuentas por cobrar/pagar
- **Formato**: Monetario, porcentajes

#### 5.16.6 Estados y Carga del Dashboard

##### Carga Inicial
- **Skeleton screens**: Para cada widget/card
- **Spinner general**: Opcional, centrado
- **Carga progresiva**: Mostrar widgets según se cargan

##### Datos Vacíos
- **Mensaje**: "No hay datos para mostrar"
- **Ilustración/Icono**: Grande, gris
- **Acción**: Botón para generar datos o configurar

##### Errores
- **Mensaje**: Por widget o general
- **Botón**: Reintentar carga
- **Fallback**: Mostrar widgets que sí cargaron

### 5.17 Vista Grid/Cards para Productos

#### 5.17.1 Grid de Productos

##### Layout
- **Grid system**: 
  - Desktop: 3-4 columnas
  - Tablet: 2 columnas
  - Mobile: 1 columna
- **Gap**: 1.5rem - 2rem entre cards
- **Responsive**: Cards se ajustan automáticamente

##### Card de Producto

**Estructura**
- **Fondo**: Blanco (#ffffff)
- **Border**: 1px solid #e9ecef
- **Border radius**: 12px - 16px
- **Sombra**: 0 2px 8px rgba(0,0,0,0.08)
- **Padding**: 0 (para imagen sin padding)
- **Hover**: Elevación (translateY(-4px)), sombra más fuerte (0 8px 16px)
- **Cursor**: Pointer (clickable)
- **Transición**: Smooth (0.3s ease)

**Elementos de la Card**

1. **Imagen del Producto**
   - **Posición**: Arriba de la card
   - **Aspect ratio**: 1:1 (cuadrada) o 4:3
   - **Altura**: 200px - 300px (desktop)
   - **Fondo**: Gris claro (#f8f9fa) si no hay imagen
   - **Object-fit**: Cover (cubre el área sin deformar)
   - **Border radius**: 12px 12px 0 0 (solo arriba)
   - **Hover**: Zoom sutil (scale 1.05) opcional

2. **Badge de Estado/Stock** (opcional, sobre imagen)
   - **Posición**: Absolute, esquina superior derecha
   - **Estilos**: Badge pequeño, redondeado
   - **Colores**: 
     - Verde: "Disponible"
     - Rojo: "Agotado"
     - Amarillo: "Stock bajo"
     - Naranja: "Oferta"

3. **Contenido de la Card** (padding: 1rem - 1.5rem)
   - **Categoría/Marca**: 
     - Tamaño: 0.75rem - 0.875rem
     - Color: Gris (#6c757d)
     - Text-transform: Uppercase opcional
     - Margin bottom: 0.5rem
   
   - **Nombre del Producto**:
     - Tamaño: 1rem - 1.125rem
     - Peso: 600 - 700 (semi-bold/bold)
     - Color: Oscuro (#212529)
     - Margin bottom: 0.5rem
     - Line-height: 1.4
     - Truncado: 2 líneas máximo (ellipsis)
   
   - **Descripción** (opcional):
     - Tamaño: 0.875rem
     - Color: Gris (#6c757d)
     - Line-height: 1.5
     - Truncado: 2-3 líneas máximo
     - Margin bottom: 0.75rem
   
   - **Precio**:
     - Tamaño: 1.25rem - 1.5rem
     - Peso: 700 - 800 (bold/extra-bold)
     - Color: Color primario o oscuro
     - Margin bottom: 0.5rem
   
   - **Precio anterior** (si hay descuento):
     - Tamaño: 0.875rem
     - Color: Gris (#adb5bd)
     - Text-decoration: Line-through
     - Display: Inline-block, margin-left: 0.5rem
   
   - **Stock/Cantidad** (opcional):
     - Tamaño: 0.875rem
     - Color: Gris (#6c757d)
     - Formato: "Stock: 15 unidades"

4. **Acciones/Footer** (padding: 1rem, border-top: 1px solid #e9ecef)
   - **Botones**: 
     - "Ver detalles", "Agregar al carrito", "Editar"
     - Tamaño: Small o normal
     - Full width o inline (según diseño)
   - **Iconos de acción rápida**: 
     - Favoritos, Comparar, Compartir
     - Posición: Esquina superior derecha (sobre card)

#### 5.17.2 Vista de Lista (Alternativa a Grid)

##### Estilo de Lista
- **Layout**: Lista vertical
- **Card horizontal**: Imagen a la izquierda, contenido a la derecha
- **Imagen**: 
  - Ancho: 120px - 150px
  - Alto: 120px - 150px
  - Aspect ratio: 1:1
- **Contenido**: 
  - Mismo que card pero en layout horizontal
  - Más espacio para descripción
- **Acciones**: Botones inline a la derecha

#### 5.17.3 Filtros y Búsqueda para Grid

##### Barra de Búsqueda
- **Posición**: Arriba del grid
- **Input**: Buscar por nombre, código, categoría
- **Botón**: "Buscar" o icono de lupa

##### Filtros
- **Categorías**: Dropdown o chips/buttons
- **Marcas**: Dropdown o chips
- **Rango de precios**: Slider o inputs
- **Stock**: Checkbox (Solo disponibles)
- **Ordenar**: Dropdown (Precio, Nombre, Más vendidos)

##### Vista/Toggle
- **Botones**: Grid view (icono de grid) y List view (icono de lista)
- **Estado activo**: Resaltado

#### 5.17.4 Estados Especiales

##### Producto sin Imagen
- **Placeholder**: Icono de imagen o texto "Sin imagen"
- **Fondo**: Gris claro (#f8f9fa)
- **Color icono/texto**: Gris (#adb5bd)

##### Producto Agotado
- **Opacidad**: 0.7 en toda la card
- **Badge**: "Agotado" prominente
- **Botón**: Deshabilitado o cambiar texto a "Notificar cuando esté disponible"

##### Producto con Descuento
- **Badge**: "% OFF" o "OFERTA" sobre imagen
- **Precio tachado**: Precio anterior visible
- **Precio destacado**: Precio con descuento más grande

##### Producto Nuevo
- **Badge**: "NUEVO" en verde o color primario
- **Posición**: Esquina superior izquierda

#### 5.17.5 Paginación e Infinite Scroll

##### Paginación
- **Estilo**: Igual que paginación de tablas (sección 5.10)
- **Posición**: Debajo del grid
- **Info**: "Mostrando 1-12 de 150 productos"

##### Infinite Scroll (Alternativa)
- **Carga automática**: Al llegar al final de la página
- **Spinner**: Al final mientras carga
- **Sin paginación visible**: Scroll infinito

### 5.18 Punto de Venta (POS) / Checkout

#### 5.18.1 Layout del POS

##### Pantalla Dividida (Split Screen)
- **Layout**: 2 columnas (60/40 o 70/30)
  - **Columna izquierda**: Lista de productos / Búsqueda (60-70%)
  - **Columna derecha**: Carrito de compra / Resumen de venta (30-40%)
- **Responsive**: 
  - **Desktop**: 2 columnas lado a lado
  - **Tablet**: 2 columnas (más estrechas)
  - **Mobile**: Stack vertical (carrito abajo o modal)
- **Altura**: 100vh (full height)
- **Fondo**: Gris claro (#f8f9fa) para área de productos, blanco para carrito

##### Header del POS
- **Fondo**: Blanco o color primario
- **Altura**: 60px - 80px
- **Elementos**: 
  - Logo/Nombre del comercio (izquierda)
  - Número de ticket/venta actual (centro)
  - Usuario/Vendedor, caja registradora, configuración (derecha)
- **Borde inferior**: 1px solid #dee2e6
- **Sticky**: Fijo arriba al hacer scroll

#### 5.18.2 Área de Productos (Columna Izquierda)

##### Búsqueda de Productos
- **Barra de búsqueda**: 
  - **Posición**: Arriba del área de productos
  - **Input**: Grande, placeholder "Buscar producto o código de barras"
  - **Icono**: Lupa a la izquierda
  - **Tamaño**: Altura 48px - 56px (touch-friendly)
  - **Border radius**: 8px - 12px
- **Botón escanear**: 
  - **Posición**: Al lado de búsqueda o dentro del input
  - **Icono**: Código de barras o cámara
  - **Estilo**: Botón outline o ghost
- **Autocomplete/Sugerencias**: 
  - **Dropdown**: Debajo del input
  - **Fondo**: Blanco, sombra
  - **Items**: Hover effect
  - **Máximo**: 5-8 resultados visibles

##### Categorías/Filtros Rápidos
- **Layout**: Chips o botones horizontales
- **Estilo**: Badges o botones pequeños
- **Scroll**: Horizontal si hay muchas categorías
- **Estado activo**: Resaltado con color primario
- **Posición**: Debajo de búsqueda

##### Grid/Lista de Productos
- **Grid**: 
  - **Desktop**: 3-4 columnas
  - **Tablet**: 2-3 columnas
  - **Mobile**: 2 columnas
- **Card de producto**: 
  - **Tamaño**: Compacto (más pequeño que catálogo)
  - **Imagen**: 80px - 120px (cuadrada)
  - **Contenido**: Nombre, precio, stock (opcional)
  - **Hover**: Elevación sutil
  - **Click**: Agregar al carrito (feedback visual)
- **Badge de stock**: 
  - **Posición**: Esquina superior derecha
  - **Estilos**: Verde (disponible), Rojo (agotado), Amarillo (bajo)

#### 5.18.3 Carrito de Compra (Columna Derecha)

##### Header del Carrito
- **Título**: "Carrito de Venta" o "Ticket #123"
- **Borde inferior**: 1px solid #dee2e6
- **Padding**: 1rem
- **Fondo**: Blanco

##### Lista de Items del Carrito
- **Layout**: Lista vertical
- **Item**: 
  - **Fondo**: Blanco
  - **Borde inferior**: 1px solid #e9ecef
  - **Padding**: 0.75rem - 1rem
  - **Hover**: Fondo gris muy claro (#f8f9fa)
- **Contenido de item**:
  - **Nombre producto**: Bold, tamaño 0.875rem - 1rem
  - **Precio unitario**: Gris, tamaño 0.75rem - 0.875rem
  - **Cantidad**: Input numérico pequeño o botones +/- 
  - **Subtotal**: Bold, tamaño 0.875rem - 1rem, alineación derecha
- **Botón eliminar**: 
  - **Posición**: Derecha del item
  - **Icono**: X o trash
  - **Tamaño**: Small, color danger
  - **Hover**: Rojo más intenso

##### Controles de Cantidad
- **Botones +/-**: 
  - **Tamaño**: 32px x 32px (touch-friendly)
  - **Estilo**: Botones pequeños, outline o filled
  - **Posición**: Lado a lado con input
- **Input cantidad**: 
  - **Ancho**: 60px - 80px
  - **Alineación**: Centro
  - **Border radius**: 4px - 8px
  - **Fuente**: Monoespace opcional

##### Resumen de Totales
- **Posición**: Debajo de lista de items (sticky bottom)
- **Fondo**: Gris claro (#f8f9fa) o blanco con borde superior
- **Padding**: 1rem
- **Elementos**:
  - **Subtotal**: 
    - **Label**: "Subtotal"
    - **Valor**: Alineación derecha, tamaño normal
  - **Descuento** (opcional):
    - **Label**: "Descuento"
    - **Valor**: Rojo si negativo
  - **Impuestos** (opcional):
    - **Label**: "IVA/Impuestos"
    - **Valor**: Gris
  - **Total**: 
    - **Label**: "TOTAL"
    - **Valor**: Bold, tamaño 1.5rem - 2rem, color primario o oscuro
    - **Borde superior**: 2px solid #dee2e6
    - **Padding top**: 0.75rem
    - **Margin top**: 0.75rem

#### 5.18.4 Acciones de Venta

##### Botones de Acción Principal
- **Cobrar/Procesar Pago**: 
  - **Estilo**: Botón primario, grande
  - **Tamaño**: Full width, altura 56px - 64px
  - **Color**: Verde (#28a745) o color primario
  - **Texto**: "Cobrar" o "Procesar Pago"
  - **Icono**: Check o moneda
  - **Posición**: Debajo de resumen de totales
- **Cancelar Venta**: 
  - **Estilo**: Botón outline danger
  - **Tamaño**: Full width, altura 48px
  - **Texto**: "Cancelar Venta"
  - **Icono**: X
- **Guardar Borrador** (opcional):
  - **Estilo**: Botón secondary
  - **Tamaño**: Full width, altura 48px
  - **Texto**: "Guardar Borrador"

#### 5.18.5 Métodos de Pago

##### Modal de Pago
- **Tamaño**: Medium o Large
- **Título**: "Método de Pago"
- **Layout**: Grid de botones de métodos de pago

##### Botones de Métodos de Pago
- **Grid**: 2-3 columnas
- **Botones**: 
  - **Tamaño**: Grande (altura 80px - 100px)
  - **Estilo**: Card con icono y texto
  - **Layout vertical**: Icono arriba, texto abajo
- **Métodos comunes**:
  - **Efectivo**: 
    - **Icono**: Billete o moneda
    - **Color**: Verde (#28a745)
  - **Tarjeta**: 
    - **Icono**: Tarjeta de crédito
    - **Color**: Azul (#17a2b8)
  - **Transferencia**: 
    - **Icono**: Transferencia o banco
    - **Color**: Azul oscuro
  - **Cuenta Corriente** (opcional):
    - **Icono**: Documento
    - **Color**: Gris

##### Formulario de Pago
- **Input monto recibido** (para efectivo):
  - **Label**: "Monto Recibido"
  - **Tamaño**: Grande, altura 56px
  - **Font**: Monoespace, tamaño grande
  - **Formato**: $ con separadores de miles
- **Input vuelto/cambio**:
  - **Label**: "Vuelto"
  - **Estilo**: Readonly, fondo gris claro
  - **Color**: Verde si positivo
- **Input referencia** (para transferencia/tarjeta):
  - **Label**: "Número de Referencia" (opcional)
  - **Tamaño**: Normal
- **Botón confirmar pago**:
  - **Estilo**: Botón success, grande
  - **Full width**: Sí
  - **Texto**: "Confirmar Pago"

#### 5.18.6 Teclado Numérico (Calculadora)

##### Teclado Virtual
- **Posición**: Modal o panel lateral (mobile)
- **Fondo**: Blanco o gris claro
- **Layout**: Grid 4x4 (números + operaciones)
- **Botones**: 
  - **Tamaño**: 64px x 64px (touch-friendly)
  - **Border radius**: 8px - 12px
  - **Estilo**: Botones outline o filled
  - **Font**: Monoespace, tamaño 1.25rem - 1.5rem
  - **Espaciado**: Gap de 0.5rem - 0.75rem
- **Números (0-9)**: 
  - **Fondo**: Blanco o gris muy claro
  - **Color texto**: Oscuro
  - **Hover**: Fondo gris claro
- **Operaciones (+ - * /)**:
  - **Fondo**: Gris claro
  - **Color texto**: Oscuro
- **Igual (=)**:
  - **Fondo**: Color primario
  - **Color texto**: Blanco
- **Borrar (C/CE)**:
  - **Fondo**: Gris claro o rojo claro
  - **Color texto**: Oscuro o rojo

##### Integración con Inputs
- **Input activo**: Resaltado con borde color primario
- **Visual feedback**: Valor cambia en tiempo real
- **Enter**: Confirma el valor

#### 5.18.7 Scanner de Códigos de Barras

##### Botón Escanear
- **Posición**: En barra de búsqueda o botón flotante
- **Estilo**: Botón con icono de cámara/código de barras
- **Tamaño**: Grande (touch-friendly)

##### Modal/Overlay de Escaneo
- **Fondo**: Negro semi-transparente (backdrop)
- **Área de escaneo**: 
  - **Frame**: Rectángulo con bordes blancos
  - **Esquinas**: Marcadores en las esquinas
  - **Tamaño**: 60% - 80% del ancho de pantalla
- **Indicador**: 
  - **Línea de escaneo**: Horizontal, animada
  - **Color**: Blanco o color primario
  - **Animación**: Movimiento vertical continuo
- **Instrucciones**: 
  - **Texto**: "Apunta la cámara al código de barras"
  - **Posición**: Arriba o abajo del frame
  - **Color**: Blanco
- **Botón cerrar**: 
  - **Posición**: Esquina superior derecha
  - **Estilo**: Botón circular, fondo blanco

##### Feedback de Escaneo Exitoso
- **Animación**: Check verde, breve
- **Sonido**: Beep opcional
- **Mensaje**: "Producto encontrado" o vibrar (mobile)

#### 5.18.8 Selección de Cliente (Opcional)

##### Botón Seleccionar Cliente
- **Posición**: Arriba del carrito o en header
- **Estilo**: Botón outline o link
- **Texto**: "Cliente: Sin asignar" o nombre del cliente

##### Modal de Selección de Cliente
- **Búsqueda**: Input para buscar cliente
- **Lista**: Lista de clientes con hover
- **Botón "Nuevo Cliente"**: Para crear rápido
- **Selección**: Click en cliente lo selecciona

##### Cliente Seleccionado (Badge)
- **Estilo**: Badge con nombre del cliente
- **Posición**: Arriba del carrito
- **Botón X**: Para quitar selección
- **Color**: Color primario o secundario

#### 5.18.9 Ticket/Recibo de Venta

##### Vista Previa del Ticket
- **Modal**: Tamaño Large o Fullscreen
- **Layout**: Formato de ticket (narrow, centrado)
- **Fondo**: Blanco
- **Ancho máximo**: 400px - 500px (centrado)

##### Contenido del Ticket
- **Header**: 
  - **Nombre del comercio**: Bold, grande (1.25rem)
  - **Dirección, teléfono**: Pequeño (0.75rem), gris
  - **Número de ticket**: Bold, tamaño mediano
  - **Fecha y hora**: Pequeño (0.75rem)
  - **Borde inferior**: 1px solid #dee2e6, padding bottom
- **Items**: 
  - **Lista**: Items comprados
  - **Formato**: Nombre, cantidad x precio, subtotal
  - **Font**: Monoespace para números
  - **Alineación**: Nombres izquierda, precios derecha
- **Totales**: 
  - **Subtotal, descuentos, impuestos**: Tamaño normal
  - **TOTAL**: Bold, tamaño grande (1.25rem)
  - **Borde superior**: 1px solid #dee2e6, padding top
- **Footer**: 
  - **Método de pago**: Pequeño
  - **Gracias**: Texto de agradecimiento
  - **QR Code** (opcional): Código QR para reclamos

##### Botones de Acción del Ticket
- **Imprimir**: 
  - **Estilo**: Botón primary
  - **Icono**: Printer
  - **Full width**: Opcional
- **Enviar por Email/SMS**: 
  - **Estilo**: Botón secondary
  - **Icono**: Email o SMS
- **Descargar PDF**: 
  - **Estilo**: Botón outline
  - **Icono**: Download
- **Cerrar/Nueva Venta**: 
  - **Estilo**: Botón success o primary
  - **Texto**: "Nueva Venta"

#### 5.18.10 Responsive POS

##### Desktop (≥ 992px)
- **Layout**: 2 columnas lado a lado
- **Carrito**: Siempre visible (sticky)
- **Productos**: Scroll vertical
- **Teclado numérico**: Opcional (modal o panel)

##### Tablet (768px - 991px)
- **Layout**: 2 columnas más estrechas
- **Carrito**: Puede ser colapsable o siempre visible
- **Productos**: Grid 2-3 columnas

##### Mobile (< 768px)
- **Layout**: Stack vertical o carrito como modal
- **Opciones**:
  - **Opción 1**: Productos arriba, botón "Ver Carrito" flotante, carrito como modal
  - **Opción 2**: Productos y carrito en tabs
- **Búsqueda**: Full width, grande
- **Teclado numérico**: Modal fullscreen o bottom sheet
- **Scanner**: Fullscreen
- **Botones**: Full width, grandes (touch-friendly)

### 5.19 Planes de Precios y Modelo Freemium

#### 5.19.1 Cards de Planes de Precios

##### Layout de Planes
- **Grid**: 
  - **Desktop**: 3-4 columnas
  - **Tablet**: 2-3 columnas
  - **Mobile**: 1 columna (stack vertical)
- **Gap**: 1.5rem - 2rem
- **Alineación**: Cards del mismo tamaño (height: auto o fixed)

##### Card de Plan

**Estructura General**
- **Fondo**: Blanco (#ffffff)
- **Border**: 2px solid #e9ecef
- **Border radius**: 12px - 16px
- **Sombra**: 0 2px 8px rgba(0,0,0,0.08)
- **Padding**: 2rem - 2.5rem
- **Hover**: Elevación (translateY(-4px)), sombra más fuerte
- **Transición**: Smooth (0.3s ease)

**Elementos de la Card**

1. **Header del Plan**
   - **Nombre del plan**: 
     - **Tamaño**: 1.5rem - 2rem
     - **Peso**: 700 - 800 (bold/extra-bold)
     - **Color**: Oscuro (#212529) o color primario
     - **Margin bottom**: 0.5rem
   - **Badge "Popular" o "Recomendado"** (opcional):
     - **Posición**: Esquina superior derecha (absolute)
     - **Estilo**: Badge pequeño, color primario
     - **Texto**: "POPULAR", "MÁS VENDIDO", etc.
   - **Descripción breve**: 
     - **Tamaño**: 0.875rem - 1rem
     - **Color**: Gris (#6c757d)
     - **Margin bottom**: 1rem

2. **Precio**
   - **Monto**: 
     - **Tamaño**: 3rem - 4rem (48px - 64px)
     - **Peso**: 800 - 900 (extra-bold/black)
     - **Color**: Oscuro (#212529) o color primario
     - **Line-height**: 1
   - **Moneda**: 
     - **Tamaño**: 1.5rem - 2rem
     - **Posición**: Antes del monto (inline)
   - **Período**: 
     - **Tamaño**: 1rem - 1.25rem
     - **Color**: Gris (#6c757d)
     - **Posición**: Debajo o al lado del monto
   - **Nota** (opcional): 
     - **Texto**: "Facturado anualmente" o descuento
     - **Tamaño**: 0.75rem - 0.875rem
     - **Color**: Gris (#adb5bd)
     - **Margin top**: 0.25rem

3. **Lista de Características**
   - **Layout**: Lista vertical
   - **Items**: 
     - **Icono**: Check verde (✓) o X gris (✗)
     - **Texto**: Característica
     - **Tamaño**: 0.875rem - 1rem
     - **Color**: Oscuro (#212529) si incluido, Gris (#adb5bd) si no incluido
     - **Line-height**: 1.6
     - **Margin bottom**: 0.75rem
   - **Padding**: 1rem 0
   - **Border** (opcional): Superior e inferior (sutil)

4. **Límites/Restricciones** (Plan Gratis o Básico)
   - **Badges de límites**: 
     - **Estilo**: Badges pequeños, color warning o info
     - **Texto**: "Hasta 100 productos", "Máx. 5 usuarios", etc.
   - **Límites destacados**: 
     - **Estilo**: Texto con icono de información
     - **Color**: Gris (#6c757d) o warning (#ffc107)

5. **Botón de Acción**
   - **Texto**: 
     - **Gratis**: "Empezar Gratis" o "Registrarse"
     - **Pago**: "Suscribirse" o "Elegir Plan"
   - **Estilo**: 
     - **Plan recomendado**: Botón primary, grande
     - **Otros planes**: Botón outline o secondary
   - **Tamaño**: Full width, altura 48px - 56px
   - **Margin top**: 1.5rem - 2rem

##### Plan Destacado/Popular
- **Border**: 2px solid color primario (en lugar de gris)
- **Sombra**: Más fuerte (0 4px 16px rgba(primary, 0.2))
- **Badge**: "POPULAR" o "RECOMENDADO" visible
- **Botón**: Primary (en lugar de outline)
- **Escala** (opcional): Slightly larger (scale 1.05)

#### 5.19.2 Indicadores de Límites (Versión Gratuita)

##### Badges de Límite
- **Estilo**: Badges pequeños, color warning (#ffc107)
- **Posición**: Junto a características o elementos limitados
- **Texto**: "Límite: X/100" o "Máx. X"
- **Icono** (opcional): Info o warning icon

##### Barras de Progreso de Límite
- **Estilo**: Progress bar pequeña
- **Color**: 
  - **Verde**: 0-70% usado
  - **Amarillo**: 70-90% usado
  - **Rojo**: 90-100% usado
- **Texto**: "X de Y productos usados"
- **Posición**: Debajo del elemento limitado

##### Alertas de Límite Cercano
- **Estilo**: Alert warning o info
- **Cuando mostrar**: Al llegar al 80-90% del límite
- **Texto**: "Estás cerca de tu límite de X. [Upgrade] para más"
- **Posición**: Top de página o dentro del módulo
- **Dismissible**: Sí, con botón X

##### Bloqueo Visual de Funcionalidad
- **Overlay**: Fondo semi-transparente sobre elemento bloqueado
- **Icono**: Lock o bloqueo
- **Mensaje**: "Esta funcionalidad requiere [Plan Pro]"
- **Botón**: "Upgrade a Pro" o "Conocer más"
- **Estilo**: Centrado, destacado

#### 5.19.3 Prompts de Upgrade

##### Banner de Upgrade
- **Posición**: Top de página (sticky) o bottom (fixed)
- **Fondo**: Color primario o gradiente
- **Texto**: Blanco
- **Contenido**: 
  - **Título**: "Upgrade a [Plan] para más funcionalidades"
  - **Beneficios**: Lista breve de beneficios
  - **Botón CTA**: "Upgrade Ahora"
  - **Botón Cerrar**: X en esquina
- **Dismissible**: Sí, con opción de "No mostrar más"

##### Modal de Upgrade
- **Tamaño**: Large o Medium
- **Título**: "Upgrade tu Plan"
- **Contenido**: 
  - **Comparación de planes**: Tabla comparativa
  - **Beneficios del upgrade**: Lista destacada
  - **Botón Upgrade**: Primary, grande
  - **Botón "Más tarde"**: Link o botón outline
- **Trigger**: Al intentar usar funcionalidad bloqueada o al llegar a límite

##### Inline Prompts
- **Estilo**: Card pequeña o alert
- **Posición**: Dentro del módulo o sección
- **Contenido**: 
  - **Texto**: "¿Necesitas más? Upgrade a [Plan]"
  - **Botón**: "Ver Planes" o "Upgrade"
- **Dismissible**: Opcional

#### 5.19.4 Tabla Comparativa de Planes

##### Layout de Tabla
- **Headers**: Nombres de planes (columnas)
- **Filas**: Características (primera columna)
- **Celdas**: Check (✓), X (✗), o texto descriptivo
- **Estilo**: Tabla con bordes sutiles

##### Estilos de Tabla
- **Header**: Fondo gris claro (#f8f9fa), bold
- **Columna destacada** (plan recomendado): Fondo color primario claro
- **Checkmarks**: Verde (#28a745), icono o texto "✓"
- **X marks**: Gris (#adb5bd), icono o texto "✗"
- **Texto descriptivo**: Gris (#6c757d), tamaño pequeño
- **Hover**: Fondo gris muy claro en filas

##### Responsive
- **Desktop**: Tabla completa
- **Tablet**: Scroll horizontal opcional
- **Mobile**: Cards verticales (cada plan una card)

#### 5.19.5 Restricciones Visuales (Freemium)

##### Elementos Bloqueados
- **Opacidad**: 0.5 - 0.6 (reducida)
- **Cursor**: Not-allowed
- **Overlay**: Gris semi-transparente
- **Icono**: Lock o candado
- **Tooltip**: "Requiere [Plan Pro]"

##### Funcionalidades Deshabilitadas
- **Botones**: Estilo disabled (gris, cursor not-allowed)
- **Inputs**: Readonly o disabled
- **Links**: Color gris, sin hover effect
- **Badge**: "PRO" o "PREMIUM" pequeño

##### Mensajes de Restricción
- **Estilo**: Alert info o warning
- **Texto**: "Esta funcionalidad está disponible en [Plan Pro]. [Upgrade]"
- **Posición**: Arriba del elemento bloqueado o en modal
- **Botón CTA**: "Ver Planes" o "Upgrade"

#### 5.19.6 Página de Planes/Precios

##### Header de la Página
- **Título**: "Planes y Precios" o "Elige tu Plan"
- **Subtítulo**: Descripción breve
- **Toggle** (opcional): "Mensual" / "Anual" (con descuento destacado)

##### Sección de Planes
- **Grid**: Cards de planes (sección 5.19.1)
- **Alineación**: Centrada
- **Espaciado**: Generoso (padding vertical)

##### Sección Comparativa
- **Título**: "Comparar Planes"
- **Tabla**: Tabla comparativa (sección 5.19.4)

##### FAQ/Preguntas Frecuentes
- **Título**: "Preguntas Frecuentes"
- **Layout**: Acordeón o lista expandible
- **Estilo**: Cards o lista con iconos

##### Footer/CTA Final
- **Texto**: "¿Tienes dudas? Contáctanos" o similar
- **Botón**: "Contactar" o "Soporte"

### 5.20 Carga de Imágenes (Upload)

#### 5.20.1 Componente de Upload Genérico

##### Área de Drop/Upload
- **Layout**: Área rectangular o cuadrada
- **Border**: 2px dashed #dee2e6
- **Border radius**: 8px - 12px
- **Fondo**: Blanco (#ffffff) o gris muy claro (#f8f9fa)
- **Padding**: 2rem - 3rem
- **Min-height**: 200px (depende del tipo)
- **Alineación**: Contenido centrado (vertical y horizontal)
- **Hover**: Border color primario, fondo ligeramente más claro
- **Drag over**: Border color primario sólido, fondo primario muy claro
- **Cursor**: Pointer

##### Contenido del Área
- **Icono**: 
  - **Tipo**: Upload, imagen, cámara o nube
  - **Tamaño**: 48px - 64px
  - **Color**: Gris (#6c757d) o color primario
  - **Margin bottom**: 1rem
- **Texto principal**: 
  - **Tamaño**: 1rem - 1.125rem
  - **Peso**: 500 - 600 (medium/semi-bold)
  - **Color**: Oscuro (#212529)
  - **Texto**: "Arrastra imágenes aquí" o "Haz clic para subir"
- **Texto secundario**: 
  - **Tamaño**: 0.875rem
  - **Color**: Gris (#6c757d)
  - **Texto**: "PNG, JPG, GIF hasta 5MB" o límites
  - **Margin top**: 0.5rem
- **Botón de selección** (alternativo):
  - **Estilo**: Botón primary o outline
  - **Texto**: "Seleccionar archivos"
  - **Posición**: Debajo del texto

##### Input de Archivo Oculto
- **Display**: None (oculto)
- **Trigger**: Se activa al hacer clic en el área o botón

#### 5.20.2 Upload de Imagen de Perfil de Usuario

##### Área de Preview
- **Tamaño**: 
  - **Desktop**: 120px x 120px (cuadrada)
  - **Mobile**: 100px x 100px
- **Border radius**: 50% (circular) o 12px - 16px (cuadrada con bordes redondeados)
- **Border**: 3px solid #e9ecef o color primario
- **Fondo**: Gris claro (#f8f9fa) si no hay imagen
- **Position**: Relative (para overlay)

##### Imagen de Perfil
- **Aspect ratio**: 1:1 (cuadrada)
- **Object-fit**: Cover (cubre el área sin deformar)
- **Border radius**: Hereda del contenedor
- **Display**: Block

##### Overlay al Hover
- **Fondo**: Negro semi-transparente (rgba(0,0,0,0.5))
- **Contenido**: Icono de cámara o "Cambiar foto"
- **Icono**: Blanco, tamaño 24px - 32px
- **Texto**: Blanco, pequeño
- **Position**: Absolute, centrado
- **Opacity**: 0 por defecto, 1 en hover
- **Transición**: Smooth (0.3s ease)
- **Cursor**: Pointer

##### Placeholder sin Imagen
- **Icono**: 
  - **Tipo**: Usuario/persona
  - **Tamaño**: 48px - 64px
  - **Color**: Gris (#adb5bd)
- **Texto** (opcional): 
  - **Tamaño**: 0.875rem
  - **Color**: Gris (#6c757d)
  - **Texto**: "Sin foto"

##### Controles
- **Botón "Cambiar foto"**: 
  - **Posición**: Debajo del preview (opcional)
  - **Estilo**: Botón outline, pequeño
- **Botón "Eliminar foto"** (si hay imagen): 
  - **Posición**: Debajo o sobre la imagen (esquina superior derecha)
  - **Estilo**: Botón danger, pequeño
  - **Icono**: X o trash

##### Límites y Validación
- **Tamaño máximo**: Mostrar (ej: "Máx. 5MB")
- **Formatos**: Mostrar (ej: "JPG, PNG")
- **Resolución recomendada**: Mostrar (ej: "Recomendado: 400x400px")
- **Mensaje de error**: 
  - **Estilo**: Texto rojo, pequeño
  - **Posición**: Debajo del preview
  - **Ejemplos**: "Archivo muy grande", "Formato no soportado"

#### 5.20.3 Upload de Logo de Comercio

##### Área de Preview
- **Tamaño**: 
  - **Desktop**: 200px x 200px o 300px x 150px (según proporción)
  - **Mobile**: 150px x 150px
- **Border radius**: 12px - 16px (menos redondeado que perfil)
- **Border**: 2px solid #e9ecef
- **Fondo**: Blanco o gris muy claro (#f8f9fa)
- **Padding**: 1rem (opcional, para logos pequeños)
- **Position**: Relative

##### Logo
- **Max-width**: 100%
- **Max-height**: 100%
- **Object-fit**: Contain (mantiene proporción, sin recortar)
- **Display**: Block
- **Margin**: Auto (centrado)

##### Overlay al Hover
- **Similar a perfil pero**: 
  - Texto: "Cambiar logo"
  - Icono: Imagen o upload

##### Placeholder sin Logo
- **Icono**: 
  - **Tipo**: Imagen o tienda
  - **Tamaño**: 64px - 80px
  - **Color**: Gris (#adb5bd)
- **Texto**: 
  - **Tamaño**: 0.875rem
  - **Color**: Gris (#6c757d)
  - **Texto**: "Sin logo" o "Sube el logo de tu comercio"

##### Controles
- **Botón "Subir logo"**: 
  - **Estilo**: Botón primary
  - **Posición**: Debajo del preview
- **Botón "Eliminar logo"** (si hay logo): 
  - **Estilo**: Botón outline danger
  - **Posición**: Debajo del preview

##### Recomendaciones
- **Texto de ayuda**: 
  - **Tamaño**: 0.75rem - 0.875rem
  - **Color**: Gris (#6c757d)
  - **Contenido**: "Recomendado: PNG con fondo transparente, mínimo 400x400px"

#### 5.20.4 Upload Múltiple de Imágenes (Productos, Galería)

##### Grid de Previews
- **Layout**: Grid responsive
  - **Desktop**: 3-4 columnas
  - **Tablet**: 2-3 columnas
  - **Mobile**: 2 columnas
- **Gap**: 1rem
- **Item tamaño**: 
  - **Desktop**: 150px x 150px
  - **Mobile**: 120px x 120px

##### Card de Imagen Uploaded
- **Fondo**: Blanco
- **Border**: 1px solid #e9ecef
- **Border radius**: 8px - 12px
- **Overflow**: Hidden
- **Position**: Relative

##### Preview de Imagen
- **Aspect ratio**: 1:1 (cuadrada)
- **Object-fit**: Cover
- **Width**: 100%
- **Height**: 150px - 200px
- **Display**: Block

##### Overlay de Acciones
- **Fondo**: Negro semi-transparente (rgba(0,0,0,0.6))
- **Position**: Absolute, full coverage
- **Opacity**: 0 por defecto, 1 en hover
- **Contenido**: 
  - **Botón eliminar**: 
    - **Posición**: Esquina superior derecha
    - **Estilo**: Botón circular pequeño, fondo rojo
    - **Icono**: X blanco
  - **Botón editar** (opcional): 
    - **Posición**: Esquina superior izquierda
    - **Estilo**: Botón circular pequeño, fondo gris
    - **Icono**: Lápiz blanco
  - **Badge "Principal"** (opcional): 
    - **Posición**: Esquina inferior izquierda
    - **Estilo**: Badge pequeño, color primario

##### Card Vacía (Área de Upload)
- **Border**: 2px dashed #dee2e6
- **Fondo**: Gris muy claro (#f8f9fa)
- **Contenido**: 
  - **Icono**: Upload o plus
  - **Tamaño**: 32px - 40px
  - **Color**: Gris (#6c757d)
  - **Texto** (opcional): "+ Agregar"
- **Hover**: Border color primario

##### Indicador de Progreso (Durante Upload)
- **Position**: Absolute, sobre la imagen
- **Fondo**: Negro semi-transparente (rgba(0,0,0,0.7))
- **Barra de progreso**: 
  - **Estilo**: Progress bar (sección 5.12)
  - **Color**: Blanco o color primario
  - **Texto**: Porcentaje (ej: "75%")
  - **Tamaño texto**: 0.875rem, blanco, bold

##### Límite de Imágenes
- **Badge contador**: 
  - **Posición**: Arriba del grid
  - **Estilo**: Badge info
  - **Texto**: "3/10 imágenes" o "Máximo 10 imágenes"
- **Deshabilitar upload**: Cuando se alcanza el límite

#### 5.20.5 Estados y Validación

##### Estados de Upload

**Idle (Inactivo)**
- **Estilo**: Área de drop normal
- **Border**: Dashed gris

**Hover**
- **Border**: Dashed color primario
- **Fondo**: Gris muy claro (#f8f9fa)

**Drag Over (Arrastrando sobre)**
- **Border**: Sólido color primario (2px)
- **Fondo**: Color primario muy claro (rgba(primary, 0.1))

**Uploading (Subiendo)**
- **Overlay**: Spinner o progress bar
- **Opacity**: 0.7 en el área
- **Disabled**: No permite más uploads

**Success (Completado)**
- **Feedback**: Check verde, breve (1-2 segundos)
- **Imagen**: Aparece en preview

**Error**
- **Mensaje**: Texto rojo debajo del área
- **Icono**: X o alerta rojo
- **Texto**: "Error al subir imagen" o mensaje específico

##### Validación Visual

**Archivo válido**
- **Border**: Verde (#28a745) brevemente
- **Icono**: Check verde

**Archivo inválido**
- **Border**: Rojo (#dc3545)
- **Mensaje**: Texto rojo con razón del error
- **Ejemplos**: 
  - "Archivo demasiado grande (máx. 5MB)"
  - "Formato no soportado (solo JPG, PNG)"
  - "Imagen muy pequeña (mín. 400x400px)"

#### 5.20.6 Preview y Edición de Imagen

##### Modal de Preview
- **Tamaño**: Large o Fullscreen
- **Fondo backdrop**: Negro semi-transparente
- **Imagen**: 
  - **Max-width**: 90vw
  - **Max-height**: 90vh
  - **Object-fit**: Contain
  - **Border radius**: 8px

##### Herramientas de Edición (Opcional)
- **Botones**: 
  - **Recortar**: Icono de crop
  - **Rotar**: Icono de rotate
  - **Ajustar brillo/contraste**: Iconos específicos
- **Estilo**: Botones outline, barra de herramientas
- **Posición**: Debajo o sobre la imagen

##### Botones de Acción
- **Guardar**: Botón primary
- **Cancelar**: Botón outline
- **Eliminar**: Botón danger

### 5.21 Estilos de Impresión

#### 5.21.1 Media Query de Impresión

##### @media print
- **Uso**: CSS específico para impresión
- **Scope**: Solo aplica al imprimir (@media print { })
- **Importante**: Sobrescribe estilos normales

##### Elementos a Ocultar
- **Selectores**:
  ```css
  .no-print { display: none !important; }
  ```
- **Elementos comunes a ocultar**:
  - Navbar/Header de navegación
  - Sidebar
  - Botones de acción (excepto imprimir)
  - Breadcrumbs
  - Footer
  - Modales/Overlays
  - Alertas/Notificaciones
  - Barra de búsqueda (depende del caso)

##### Elementos a Mostrar
- **Selectores**:
  ```css
  .print-only { display: block !important; }
  ```
- **Elementos comunes a mostrar**:
  - Logo del comercio (si no está en header normal)
  - Información de contacto
  - Fecha de impresión
  - Número de página (opcional)

#### 5.21.2 Formato de Página

##### Tamaño de Página
- **Página completa**: 
  - **Width**: 100%
  - **Margin**: 0.5in - 1in (todos los lados)
- **Ticket/Recibo**: 
  - **Width**: 3in - 4in (80mm - 100mm)
  - **Margin**: 0.25in
  - **Centrado**: Auto (margin auto)

##### Orientación
- **Portrait (Vertical)**: Por defecto, para reportes, detalles
- **Landscape (Horizontal)**: 
  - **@page { size: landscape; }**
  - Para tablas anchas, gráficos horizontales

##### Fondo y Colores
- **Background**: Blanco (#ffffff) siempre
- **Background-color**: white !important (forzar blanco)
- **Imágenes de fondo**: Ocultar (background-image: none)
- **Colores de texto**: Negro o escala de grises (para ahorrar tinta)

#### 5.21.3 Tipografía para Impresión

##### Tamaños de Fuente
- **Escalar**: Reducir ligeramente (ej: 0.9em)
- **Títulos**: 
  - **H1**: 18pt - 24pt (1.5rem - 2rem)
  - **H2**: 16pt - 20pt (1.25rem - 1.5rem)
  - **H3**: 14pt - 18pt (1rem - 1.25rem)
- **Body**: 10pt - 12pt (0.875rem - 1rem)
- **Tablas**: 9pt - 11pt (0.75rem - 0.875rem)

##### Fuentes
- **Serif**: Para impresión (más legible en papel)
  - **Ejemplos**: Times New Roman, Georgia
- **Sans-serif**: Aceptable también
- **Monoespaciada**: Para números, códigos, tablas

##### Espaciado
- **Line-height**: 1.4 - 1.6 (más espaciado para legibilidad)
- **Letter-spacing**: Normal (0)
- **Word-spacing**: Normal

#### 5.21.4 Impresión de Tickets/Recibos

##### Formato de Ticket
- **Ancho**: 80mm - 100mm (3in - 4in)
- **Alto**: Auto (según contenido)
- **Margin**: 0.25in todos los lados
- **Padding**: 0.5rem - 1rem

##### Header del Ticket
- **Logo**: 
  - **Tamaño**: 80px - 120px de ancho
  - **Max-height**: 60px
  - **Alineación**: Centro
  - **Margin bottom**: 0.5rem
- **Nombre del comercio**: 
  - **Tamaño**: 14pt - 18pt (bold)
  - **Alineación**: Centro
  - **Margin bottom**: 0.25rem
- **Dirección, teléfono**: 
  - **Tamaño**: 9pt - 11pt
  - **Alineación**: Centro
  - **Color**: Gris oscuro
  - **Margin bottom**: 0.75rem
- **Divider**: Línea horizontal (1px solid #000)

##### Cuerpo del Ticket
- **Número de ticket**: 
  - **Tamaño**: 10pt - 12pt
  - **Formato**: "Ticket #123" o "Venta #456"
  - **Margin bottom**: 0.5rem
- **Fecha y hora**: 
  - **Tamaño**: 9pt - 11pt
  - **Formato**: "DD/MM/YYYY HH:MM"
  - **Margin bottom**: 0.75rem
- **Items**: 
  - **Lista**: Sin bullets
  - **Espaciado**: 0.5rem entre items
  - **Font**: Monoespace para números
  - **Layout**: Nombre (izquierda), cantidad x precio, subtotal (derecha)

##### Totales del Ticket
- **Divider**: Línea horizontal (1px solid #000)
- **Padding top**: 0.5rem
- **Subtotal, descuentos, impuestos**: 
  - **Tamaño**: 10pt - 11pt
  - **Alineación**: Derecha
- **TOTAL**: 
  - **Tamaño**: 14pt - 16pt (bold)
  - **Alineación**: Derecha
  - **Margin top**: 0.5rem

##### Footer del Ticket
- **Método de pago**: 
  - **Tamaño**: 9pt - 10pt
  - **Margin top**: 0.75rem
- **Gracias**: 
  - **Tamaño**: 10pt - 11pt
  - **Alineación**: Centro
  - **Margin top**: 1rem
  - **Estilo**: Italic opcional
- **QR Code** (opcional): 
  - **Tamaño**: 80px x 80px
  - **Alineación**: Centro
  - **Margin top**: 0.5rem

#### 5.21.5 Impresión de Reportes y Detalles

##### Header del Reporte
- **Logo**: Esquina superior izquierda o centro
- **Título**: 
  - **Tamaño**: 18pt - 24pt (bold)
  - **Alineación**: Centro o izquierda
- **Información del reporte**: 
  - **Fecha**: "Generado el: DD/MM/YYYY"
  - **Período**: "Período: DD/MM/YYYY - DD/MM/YYYY"
  - **Tamaño**: 10pt - 11pt
  - **Alineación**: Derecha o debajo del título
- **Divider**: Línea horizontal debajo del header

##### Tablas en Impresión
- **Bordes**: 
  - **Todos los bordes**: 1px solid #000 (negro)
  - **O alternativamente**: Solo bordes horizontales
- **Fondo header**: Gris claro (#f5f5f5) o sin fondo
- **Texto**: 
  - **Tamaño**: 9pt - 11pt
  - **Header**: Bold
- **Padding celdas**: 0.25rem - 0.5rem
- **Break-inside**: Avoid (evitar que filas se corten entre páginas)
- **Repeat header**: 
  - **@media print { thead { display: table-header-group; } }**
  - Para repetir header en cada página

##### Gráficos en Impresión
- **Tamaño**: 
  - **Width**: 100% o ancho fijo (ej: 6in)
  - **Height**: Auto o altura fija
- **Fondo**: Blanco
- **Colores**: Escala de grises o colores sólidos (evitar degradados sutiles)
- **Bordes**: 1px solid #000 (negro)

##### Secciones del Reporte
- **Títulos de sección**: 
  - **Tamaño**: 14pt - 16pt (bold)
  - **Margin top**: 1rem
  - **Margin bottom**: 0.5rem
- **Page breaks**: 
  - **page-break-before**: auto o avoid
  - **page-break-after**: auto
  - **page-break-inside**: avoid (evitar cortar secciones)

#### 5.21.6 Pies de Página y Encabezados

##### Header en Cada Página
- **Contenido**: 
  - **Logo**: Pequeño (esquina superior izquierda)
  - **Título del documento**: Centro
  - **Fecha**: Esquina superior derecha
- **Tamaño**: 0.5in - 0.75in de altura
- **Border bottom**: 1px solid #000

##### Footer en Cada Página
- **Contenido**: 
  - **Número de página**: "Página X de Y"
  - **Información adicional**: "Confidencial", nombre del comercio
- **Tamaño**: 0.5in de altura
- **Border top**: 1px solid #000
- **Alineación**: Centro o derecha
- **Tamaño fuente**: 9pt - 10pt

##### Número de Página
- **CSS**: 
  ```css
  @page {
    @bottom-right {
      content: "Página " counter(page) " de " counter(pages);
    }
  }
  ```
- **O usando**: JavaScript para agregar números

#### 5.21.7 Botones de Impresión

##### Botón "Imprimir"
- **Estilo**: Botón secondary o outline (sección 3)
- **Icono**: Printer
- **Posición**: Arriba del contenido (header) o flotante
- **Acción**: window.print() o ruta específica de impresión

##### Vista Previa de Impresión
- **Modal o página**: Mostrar cómo se verá impreso
- **Estilos**: Aplicar estilos de impresión en vista previa
- **Botones**: 
  - **Imprimir**: Ejecutar impresión
  - **Descargar PDF**: Exportar a PDF
  - **Cerrar**: Volver a vista normal

##### Descargar PDF
- **Botón**: Junto a "Imprimir"
- **Estilo**: Botón outline
- **Icono**: Download
- **Funcionalidad**: Generar PDF del contenido

### 5.22 Autenticación y Registro

#### 5.22.1 Páginas de Login/Inicio de Sesión

##### Layout de Login
- **Container**: 
  - **Ancho máximo**: 400px - 450px (centrado)
  - **Padding**: 2rem - 3rem
  - **Margin**: Auto (centrado vertical y horizontal)
- **Fondo**: 
  - **Opción 1**: Blanco con card con sombra
  - **Opción 2**: Fondo de color/gradiente con card blanca
- **Altura mínima**: 100vh o centrado vertical

##### Card de Login
- **Fondo**: Blanco (#ffffff)
- **Border radius**: 12px - 16px
- **Sombra**: 0 4px 20px rgba(0,0,0,0.1)
- **Padding**: 2.5rem - 3rem
- **Border**: 1px solid #e9ecef (opcional)

##### Header del Login
- **Logo**: 
  - **Tamaño**: 60px - 80px (ancho)
  - **Posición**: Centrado
  - **Margin bottom**: 1.5rem - 2rem
- **Título**: 
  - **Texto**: "Iniciar Sesión" o "Bienvenido"
  - **Tamaño**: 1.75rem - 2rem
  - **Peso**: 700 (bold)
  - **Alineación**: Centro
  - **Margin bottom**: 0.5rem
- **Subtítulo** (opcional): 
  - **Texto**: "Ingresa tus credenciales"
  - **Tamaño**: 0.875rem - 1rem
  - **Color**: Gris (#6c757d)
  - **Alineación**: Centro
  - **Margin bottom**: 2rem

##### Formulario de Login
- **Campos**:
  - **Email/Usuario**: Input email o text
  - **Contraseña**: Input password con toggle mostrar/ocultar
  - **Espaciado**: Margin bottom 1.5rem entre campos
- **Recordar sesión**: 
  - **Checkbox**: "Recordarme" o "Mantener sesión iniciada"
  - **Posición**: Debajo del campo de contraseña
  - **Tamaño**: 0.875rem
- **Link "Olvidé mi contraseña"**: 
  - **Posición**: Derecha (alineado con checkbox) o debajo del campo
  - **Estilo**: Link (color primario)
  - **Tamaño**: 0.875rem
- **Botón "Iniciar Sesión"**: 
  - **Estilo**: Botón primary, full width
  - **Tamaño**: Large (altura 48px - 56px)
  - **Margin top**: 1rem - 1.5rem
  - **Texto**: "Iniciar Sesión" o "Ingresar"
  - **Icono**: Login o arrow-right (opcional)

##### Divider "O" (Login Social)
- **Layout**: Línea - Texto "O" - Línea
- **Color línea**: Gris claro (#dee2e6)
- **Texto "O"**: 
  - **Tamaño**: 0.875rem
  - **Color**: Gris (#6c757d)
  - **Fondo**: Blanco (para tapar la línea)
  - **Padding**: 0 1rem
- **Margin**: 1.5rem - 2rem (arriba y abajo)

##### Botones de Login Social (Opcional)
- **Google**: 
  - **Estilo**: Botón outline, full width
  - **Icono**: Logo de Google o icono
  - **Texto**: "Continuar con Google"
  - **Margin bottom**: 0.75rem
- **Facebook**: 
  - **Estilo**: Botón outline, full width
  - **Icono**: Logo de Facebook o icono
  - **Texto**: "Continuar con Facebook"
  - **Color**: Azul de Facebook (opcional)

##### Footer del Login
- **Texto**: 
  - **Tamaño**: 0.875rem - 1rem
  - **Color**: Gris (#6c757d)
  - **Alineación**: Centro
  - **Contenido**: "¿No tenés cuenta? [Registrarse]"
- **Link "Registrarse"**: 
  - **Estilo**: Link (color primario, bold)
  - **Hover**: Subrayado

##### Estados y Validación
- **Error de credenciales**: 
  - **Estilo**: Alert danger (sección 5.4)
  - **Texto**: "Email o contraseña incorrectos"
  - **Posición**: Arriba del formulario
- **Campo con error**: 
  - **Border**: Rojo (#dc3545)
  - **Mensaje**: Texto rojo pequeño debajo del campo
- **Loading**: 
  - **Botón**: Estado disabled con spinner
  - **Texto**: "Ingresando..." o spinner solamente

#### 5.22.2 Páginas de Registro/Sign Up

##### Layout de Registro
- **Similar a Login pero**:
  - **Ancho máximo**: 450px - 500px (más ancho)
  - **Más campos**: Requiere más espacio vertical

##### Header del Registro
- **Logo**: Igual que login
- **Título**: 
  - **Texto**: "Crear Cuenta" o "Registrarse"
  - **Tamaño**: 1.75rem - 2rem
  - **Peso**: 700 (bold)
- **Subtítulo**: 
  - **Texto**: "Comienza gratis hoy" o similar
  - **Tamaño**: 0.875rem - 1rem
  - **Color**: Gris (#6c757d)

##### Formulario de Registro
- **Campos comunes**:
  - **Nombre completo**: Input text
  - **Email**: Input email
  - **Contraseña**: Input password con indicador de fortaleza
  - **Confirmar contraseña**: Input password
  - **Teléfono** (opcional): Input tel
- **Espaciado**: Margin bottom 1.5rem entre campos
- **Indicador de fortaleza de contraseña**: 
  - **Barra de progreso**: Verde (fuerte), amarillo (media), rojo (débil)
  - **Texto**: "Fuerte", "Media", "Débil"
  - **Posición**: Debajo del campo de contraseña

##### Checkbox de Términos y Condiciones
- **Layout**: Checkbox + Label con enlaces
- **Checkbox**: 
  - **Tamaño**: Normal
  - **Estilo**: Checkbox estándar (sección 4)
- **Label**: 
  - **Texto**: "Acepto los [Términos y Condiciones] y [Política de Privacidad]"
  - **Tamaño**: 0.875rem - 1rem
  - **Color**: Gris oscuro (#212529)
- **Enlaces**:
  - **"Términos y Condiciones"**: 
    - **Estilo**: Link (color primario)
    - **Target**: _blank (nueva pestaña) o modal
  - **"Política de Privacidad"**: 
    - **Estilo**: Link (color primario)
    - **Target**: _blank (nueva pestaña) o modal
- **Asterisco** (si obligatorio): 
  - **Color**: Rojo (#dc3545)
  - **Posición**: Antes del texto
- **Mensaje de error** (si no está marcado): 
  - **Estilo**: Texto rojo pequeño
  - **Texto**: "Debes aceptar los términos y condiciones"

##### Botón "Registrarse"
- **Estilo**: Botón primary, full width
- **Tamaño**: Large (altura 48px - 56px)
- **Texto**: "Crear Cuenta" o "Registrarse"
- **Icono**: User-plus o check (opcional)
- **Margin top**: 1.5rem - 2rem

##### Footer del Registro
- **Texto**: 
  - **Tamaño**: 0.875rem - 1rem
  - **Color**: Gris (#6c757d)
  - **Contenido**: "¿Ya tenés cuenta? [Iniciar Sesión]"
- **Link "Iniciar Sesión"**: 
  - **Estilo**: Link (color primario, bold)

##### Validación de Registro
- **Errores por campo**: 
  - **Border rojo**: En campo con error
  - **Mensaje**: Texto rojo pequeño debajo
- **Errores generales**: 
  - **Alert danger**: Arriba del formulario
  - **Ejemplos**: "El email ya está registrado", "Las contraseñas no coinciden"

#### 5.22.3 Botones de Descarga de App

##### Botones de Store (Google Play / App Store)
- **Layout**: Dos botones lado a lado o apilados

##### Estilo de Botón de Store
- **Fondo**: 
  - **Google Play**: Verde (#0F9D58) o negro (#000000)
  - **App Store**: Negro (#000000)
- **Border radius**: 8px - 12px
- **Padding**: 0.75rem - 1rem (vertical), 1.5rem - 2rem (horizontal)
- **Tamaño**: Altura 56px - 64px (touch-friendly)
- **Sombra**: 0 2px 8px rgba(0,0,0,0.15)
- **Hover**: Elevación (translateY(-2px)), sombra más fuerte

##### Contenido del Botón
- **Layout**: Flex horizontal
- **Icono**: 
  - **Tamaño**: 32px - 40px
  - **Posición**: Izquierda
- **Texto**: 
  - **Layout vertical**: 
    - **Línea 1**: "Disponible en" (pequeño, 0.75rem, color gris claro)
    - **Línea 2**: "Google Play" o "App Store" (bold, 1rem)
  - **Alineación**: Izquierda (al lado del icono)
- **Espaciado**: Gap de 0.75rem - 1rem

##### Variantes de Botones
- **Versión pequeña**: 
  - **Altura**: 48px
  - **Padding**: Reducido
  - **Icono**: 24px - 28px
- **Versión solo icono**: 
  - **Tamaño**: 48px x 48px (cuadrado)
  - **Icono**: Centrado, tamaño mediano
- **Versión outline**: 
  - **Fondo**: Transparente
  - **Border**: 2px solid (color del store)
  - **Texto**: Color del store

##### Posicionamiento
- **En landing page**: 
  - **Posición**: Hero section, CTA section
  - **Layout**: Dos botones lado a lado (desktop), apilados (mobile)
  - **Gap**: 1rem - 1.5rem
- **En footer**: 
  - **Tamaño**: Versión pequeña
  - **Layout**: Apilados o lado a lado
- **En página de descarga**: 
  - **Tamaño**: Grande
  - **Layout**: Centrado, destacado

#### 5.22.4 Páginas de Términos y Condiciones / Políticas

##### Layout de Términos
- **Container**: 
  - **Ancho máximo**: 800px - 900px (más ancho que formularios)
  - **Padding**: 2rem - 3rem
  - **Margin**: Auto (centrado)
- **Fondo**: Blanco
- **Min-height**: 100vh (full height)

##### Header de Términos
- **Título**: 
  - **Texto**: "Términos y Condiciones" o "Política de Privacidad"
  - **Tamaño**: 2rem - 2.5rem
  - **Peso**: 700 - 800 (bold/extra-bold)
  - **Margin bottom**: 0.5rem
- **Fecha de actualización**: 
  - **Texto**: "Última actualización: DD/MM/YYYY"
  - **Tamaño**: 0.875rem
  - **Color**: Gris (#6c757d)
  - **Margin bottom**: 2rem
- **Divider**: Línea horizontal (1px solid #dee2e6)

##### Contenido de Términos
- **Tipografía**: 
  - **Tamaño**: 1rem (16px)
  - **Line-height**: 1.6 - 1.8 (legible)
  - **Color**: Oscuro (#212529)
- **Secciones**: 
  - **Títulos (H2)**: 
    - **Tamaño**: 1.5rem - 1.75rem
    - **Peso**: 700 (bold)
    - **Margin top**: 2rem
    - **Margin bottom**: 1rem
  - **Subtítulos (H3)**: 
    - **Tamaño**: 1.25rem - 1.5rem
    - **Peso**: 600 (semi-bold)
    - **Margin top**: 1.5rem
    - **Margin bottom**: 0.75rem
- **Párrafos**: 
  - **Margin bottom**: 1rem
  - **Text-align**: Justify o left
- **Listas**: 
  - **Margin**: 1rem 0
  - **Padding-left**: 1.5rem
  - **Line-height**: 1.6

##### Enlaces en Términos
- **Estilo**: 
  - **Color**: Color primario
  - **Text-decoration**: Underline
  - **Hover**: Color más oscuro
- **Enlaces externos**: 
  - **Icono**: Flecha externa (opcional, pequeño)
  - **Target**: _blank

##### Footer de Términos
- **Divider**: Línea horizontal (1px solid #dee2e6)
- **Margin top**: 3rem
- **Botones**: 
  - **"Aceptar"**: Botón primary
  - **"Rechazar"**: Botón outline (si aplica)
  - **Layout**: Centrados, gap 1rem
- **O simplemente**: Texto con fecha de actualización

##### Navegación (Opcional)
- **Tabs o links**: 
  - **Términos y Condiciones**
  - **Política de Privacidad**
  - **Política de Cookies** (si aplica)
- **Estilo**: Tabs (sección 5.11) o links horizontales

#### 5.22.5 Modal de Términos (Alternativa)

##### Modal de Términos
- **Tamaño**: Large o Fullscreen
- **Header**: 
  - **Título**: "Términos y Condiciones"
  - **Botón cerrar**: X (esquina superior derecha)
- **Body**: 
  - **Scroll**: Vertical (max-height: 70vh)
  - **Contenido**: Mismo formato que página completa
- **Footer**: 
  - **Botones**: 
    - **"Aceptar"**: Botón primary
    - **"Rechazar"**: Botón outline (cierra modal)
  - **Border top**: 1px solid #dee2e6

##### Checkbox con Modal
- **Label con enlace**: 
  - **Texto**: "Acepto los [Términos y Condiciones]"
  - **Enlace**: Abre modal en lugar de nueva pestaña
  - **Estilo**: Link (color primario)
- **Checkbox**: Se marca al aceptar en el modal

#### 5.22.6 Recuperación de Contraseña

##### Página de "Olvidé mi Contraseña"
- **Layout**: Similar a login
- **Container**: Ancho 400px - 450px, centrado
- **Título**: 
  - **Texto**: "Recuperar Contraseña"
  - **Tamaño**: 1.75rem - 2rem
- **Subtítulo**: 
  - **Texto**: "Ingresa tu email y te enviaremos instrucciones"
  - **Tamaño**: 0.875rem - 1rem
  - **Color**: Gris (#6c757d)
- **Formulario**: 
  - **Campo**: Input email
  - **Botón**: "Enviar Instrucciones" (primary, full width)
- **Link**: "Volver a iniciar sesión"

##### Página de Reset de Contraseña
- **Layout**: Similar a "Olvidé mi Contraseña"
- **Campos**: 
  - **Nueva contraseña**: Input password con indicador de fortaleza
  - **Confirmar nueva contraseña**: Input password
- **Botón**: "Cambiar Contraseña" (primary, full width)

##### Mensajes de Estado
- **Éxito**: 
  - **Alert success**: "Email enviado. Revisa tu bandeja de entrada"
- **Error**: 
  - **Alert danger**: "Email no encontrado" o "Token inválido"

### 5.23 Landing Page

#### 5.23.1 Layout General de Landing

##### Estructura de la Landing
- **Secciones típicas**:
  1. **Navbar/Header** (fixed o sticky)
  2. **Hero Section** (primera sección, full height)
  3. **Sección de Características/Features**
  4. **Sección de Información/About**
  5. **Sección CTA (Call to Action)**
  6. **Sección de Testimonios** (opcional)
  7. **Footer**

##### Fondo General
- **Opción 1**: Fondo blanco (#ffffff) con secciones alternadas (blanco/gris claro)
- **Opción 2**: Fondo de color/gradiente en hero, blanco en resto
- **Padding vertical entre secciones**: 4rem - 6rem

#### 5.23.2 Navbar de Landing

##### Estilo del Navbar
- **Fondo**: 
  - **Opción 1**: Blanco transparente (rgba(255,255,255,0.95)) con backdrop-filter blur
  - **Opción 2**: Color sólido (blanco o color primario)
- **Position**: Fixed o sticky (queda fijo al hacer scroll)
- **Altura**: 60px - 80px
- **Sombra**: 0 2px 10px rgba(0,0,0,0.1) (si fondo transparente)
- **Z-index**: 1030 (arriba de todo)

##### Logo
- **Posición**: Izquierda
- **Tamaño**: 120px - 150px (ancho) o texto grande
- **Estilo**: 
  - **Texto**: Logo con nombre de la app
  - **Imagen**: Logo con altura de 40px - 50px
- **Color**: Color primario o gradiente

##### Enlaces de Navegación
- **Posición**: Centro o derecha
- **Items**: 
  - "Inicio", "Características", "Precios", "Contacto"
  - Links a secciones (anchor links)
- **Estilo**: 
  - **Tamaño**: 0.875rem - 1rem
  - **Color**: Gris oscuro (#212529) o blanco (si fondo oscuro)
  - **Hover**: Color primario o subrayado
  - **Active**: Color primario, bold o subrayado

##### Botones en Navbar
- **Botón "Iniciar Sesión"**: 
  - **Estilo**: Link o botón outline
  - **Tamaño**: Normal o pequeño
  - **Posición**: Derecha, antes de "Registrarse"
- **Botón "Registrarse"**: 
  - **Estilo**: Botón primary
  - **Tamaño**: Normal (altura 40px - 48px)
  - **Posición**: Derecha (último elemento)
  - **Margin-left**: 0.75rem - 1rem (separado del login)

##### Mobile Menu (Hamburger)
- **Trigger**: Botón hamburger (3 líneas) cuando pantalla < 768px
- **Icono**: 24px x 24px
- **Menu desplegable**: 
  - **Fondo**: Blanco
  - **Sombra**: 0 4px 20px rgba(0,0,0,0.1)
  - **Items**: Stack vertical
  - **Padding**: 1rem
  - **Full width**: Sí

#### 5.23.3 Hero Section

##### Layout del Hero
- **Min-height**: 100vh (full viewport height) o 80vh
- **Fondo**: 
  - **Opción 1**: Gradiente (color primario a secundario)
  - **Opción 2**: Imagen de fondo con overlay
  - **Opción 3**: Color sólido
- **Position**: Relative (para elementos decorativos)
- **Overflow**: Hidden (para elementos decorativos)
- **Display**: Flex (para centrar contenido verticalmente)

##### Elementos Decorativos (Opcional)
- **Círculos/Formas**: 
  - **Position**: Absolute
  - **Fondo**: Blanco con opacidad (rgba(255,255,255,0.1))
  - **Tamaño**: Grandes (300px - 500px)
  - **Animación**: Float suave (opcional)
- **Gradientes**: Gradientes suaves animados

##### Contenido del Hero
- **Layout**: 2 columnas (60/40 o 50/50)
  - **Columna izquierda**: Texto y botones (60%)
  - **Columna derecha**: Imagen/Ilustración (40%)
- **Alineación vertical**: Centrado (align-items: center)
- **Padding**: 4rem - 6rem (vertical)

##### Título Principal (H1)
- **Texto**: Tagline principal de la app
- **Tamaño**: 
  - **Desktop**: 3.5rem - 4.5rem (56px - 72px)
  - **Mobile**: 2rem - 2.5rem (32px - 40px)
- **Peso**: 800 - 900 (extra-bold/black)
- **Line-height**: 1.1 - 1.2 (compacto)
- **Color**: 
  - **Sobre fondo oscuro**: Blanco (#ffffff)
  - **Sobre fondo claro**: Oscuro (#212529) o color primario
- **Text-shadow** (si fondo oscuro): 2px 2px 4px rgba(0,0,0,0.2)
- **Margin bottom**: 1.5rem - 2rem

##### Subtítulo/Descripción
- **Texto**: Descripción breve de la app
- **Tamaño**: 
  - **Desktop**: 1.25rem - 1.5rem (20px - 24px)
  - **Mobile**: 1rem - 1.125rem (16px - 18px)
- **Peso**: 300 - 400 (light/normal)
- **Line-height**: 1.5 - 1.6
- **Color**: 
  - **Sobre fondo oscuro**: Blanco con opacidad (rgba(255,255,255,0.9))
  - **Sobre fondo claro**: Gris (#6c757d)
- **Margin bottom**: 2rem - 2.5rem

##### Botones del Hero (CTAs)
- **Layout**: Flex horizontal con gap 1rem - 1.5rem
- **Botones**:
  1. **Botón Primario (Registro/Descargar)**:
     - **Texto**: "Registrarse Gratis", "Comenzar Ahora", "Descargar App"
     - **Estilo**: Botón primary, grande
     - **Tamaño**: Large (altura 56px - 64px)
     - **Padding**: 1rem 2.5rem
     - **Border radius**: 50px (pill) o 12px
     - **Sombra**: 0 4px 15px rgba(0,0,0,0.2)
     - **Hover**: Elevación (translateY(-2px)), sombra más fuerte
     - **Icono**: Download, arrow-right, o check (opcional)
  
  2. **Botón Secundario (Más Info/Login)**:
     - **Texto**: "Conocer Más", "Ver Demo", "Iniciar Sesión"
     - **Estilo**: Botón outline o ghost
     - **Tamaño**: Large (altura 56px - 64px)
     - **Padding**: 1rem 2.5rem
     - **Border**: 2px solid (blanco si fondo oscuro, color primario si fondo claro)
     - **Color texto**: Blanco (si fondo oscuro) o color primario (si fondo claro)
     - **Hover**: Fondo con color, texto inverso

##### Imagen/Ilustración del Hero
- **Posición**: Columna derecha
- **Tamaño**: 
  - **Max-width**: 100%
  - **Max-height**: 500px - 600px
- **Estilo**: 
  - **Border radius**: 12px - 16px (opcional)
  - **Sombra**: 0 10px 40px rgba(0,0,0,0.2) (opcional)
- **Alternativa**: Icono grande o ilustración SVG

##### Responsive del Hero
- **Desktop**: 2 columnas lado a lado
- **Tablet**: 2 columnas (más apretadas) o stack vertical
- **Mobile**: Stack vertical (imagen arriba o abajo), botones apilados

#### 5.23.4 Sección de Características/Features

##### Layout de Features
- **Fondo**: 
  - **Opción 1**: Gris claro (#f8f9fa)
  - **Opción 2**: Blanco (alternando con otras secciones)
- **Padding**: 6rem 0 (vertical)
- **Container**: Ancho máximo, centrado

##### Header de Features
- **Título**:
  - **Texto**: "Características" o "Por qué elegirnos"
  - **Tamaño**: 2.5rem - 3rem (40px - 48px)
  - **Peso**: 700 - 800 (bold/extra-bold)
  - **Alineación**: Centro
  - **Margin bottom**: 1rem
- **Subtítulo**:
  - **Texto**: Descripción breve
  - **Tamaño**: 1.125rem - 1.25rem
  - **Color**: Gris (#6c757d)
  - **Alineación**: Centro
  - **Margin bottom**: 3rem - 4rem

##### Grid de Features Cards
- **Layout**: Grid 3 columnas (desktop), 2 columnas (tablet), 1 columna (mobile)
- **Gap**: 2rem - 2.5rem
- **Card de Feature**: 
  - **Fondo**: Blanco (#ffffff)
  - **Border radius**: 12px - 16px
  - **Padding**: 2rem - 2.5rem
  - **Border**: 1px solid #e9ecef (opcional)
  - **Sombra**: 0 2px 10px rgba(0,0,0,0.05)
  - **Hover**: Elevación (translateY(-5px)), sombra más fuerte (0 10px 30px)
  - **Transición**: Smooth (0.3s ease)

##### Elementos de Feature Card
- **Icono**:
  - **Tamaño**: 60px - 80px (cuadrado)
  - **Fondo**: Color primario o gradiente
  - **Color icono**: Blanco
  - **Border radius**: 12px - 16px
  - **Margin bottom**: 1.5rem
  - **Centrado**: Flex center
- **Título**:
  - **Texto**: Nombre de la característica
  - **Tamaño**: 1.5rem - 1.75rem
  - **Peso**: 700 (bold)
  - **Margin bottom**: 1rem
- **Descripción**:
  - **Texto**: Descripción de la característica
  - **Tamaño**: 1rem
  - **Color**: Gris (#6c757d)
  - **Line-height**: 1.6 - 1.8

#### 5.23.5 Sección de Información General

##### Layout de Información
- **Fondo**: Blanco (#ffffff)
- **Padding**: 6rem 0
- **Layout**: Alternado (imagen izquierda, texto derecha / texto izquierda, imagen derecha)

##### Sección de Texto
- **Título**:
  - **Tamaño**: 2rem - 2.5rem
  - **Peso**: 700 (bold)
  - **Margin bottom**: 1.5rem
- **Descripción**:
  - **Tamaño**: 1rem - 1.125rem
  - **Line-height**: 1.7 - 1.8
  - **Color**: Gris (#6c757d)
  - **Margin bottom**: 2rem
- **Lista de beneficios** (opcional):
  - **Items**: Con checkmarks o bullets
  - **Estilo**: Lista con iconos
  - **Tamaño**: 1rem
- **Botón CTA** (opcional):
  - **Estilo**: Botón primary o outline
  - **Texto**: "Saber más", "Comenzar"

##### Imagen/Ilustración
- **Tamaño**: Max-width 100%, altura auto
- **Border radius**: 12px - 16px (opcional)
- **Sombra**: 0 10px 30px rgba(0,0,0,0.1) (opcional)

#### 5.23.6 Sección CTA (Call to Action)

##### Layout de CTA
- **Fondo**: 
  - **Opción 1**: Color primario o gradiente oscuro
  - **Opción 2**: Gris oscuro (#2c3e50)
- **Padding**: 6rem - 8rem (vertical)
- **Color texto**: Blanco (#ffffff)
- **Position**: Relative (para elementos decorativos)

##### Contenido del CTA
- **Alineación**: Centro
- **Título**:
  - **Texto**: "¿Listo para comenzar?" o "Empieza gratis hoy"
  - **Tamaño**: 2.5rem - 3rem
  - **Peso**: 800 (extra-bold)
  - **Margin bottom**: 1.5rem
- **Descripción**:
  - **Texto**: Texto motivacional
  - **Tamaño**: 1.25rem - 1.5rem
  - **Opacidad**: 0.9
  - **Margin bottom**: 2rem - 2.5rem
- **Botones**:
  - **Layout**: Flex horizontal con gap 1rem - 1.5rem
  - **Botones**:
    - **"Registrarse Gratis"**: Botón light o white (fondo blanco, texto oscuro)
    - **"Descargar App"**: Botón outline light (borde blanco, fondo transparente)
  - **Tamaño**: Large (altura 56px - 64px)
  - **Centrados**: justify-content: center

#### 5.23.7 Footer de Landing

##### Layout del Footer
- **Fondo**: Gris oscuro (#2c3e50) o negro (#000000)
- **Color texto**: Blanco (#ffffff)
- **Padding**: 3rem - 4rem (vertical)

##### Contenido del Footer
- **Layout**: Grid 4 columnas (desktop), 2 columnas (tablet), 1 columna (mobile)
- **Columnas**:
  1. **Logo y Descripción**:
     - **Logo**: Tamaño mediano (100px ancho)
     - **Descripción**: Texto breve, tamaño 0.875rem, color gris claro
  2. **Enlaces** (columna 1):
     - **Título**: "Enlaces" o "Producto"
     - **Lista**: Links verticales
     - **Estilo**: Texto gris claro, hover blanco
  3. **Enlaces** (columna 2):
     - **Título**: "Empresa" o "Legal"
     - **Lista**: Links (Términos, Política, Contacto)
  4. **Redes Sociales/Contacto**:
     - **Título**: "Contacto" o "Síguenos"
     - **Iconos**: Redes sociales
     - **Email/Telefono**: Texto gris claro

##### Divider del Footer
- **Borde**: 1px solid rgba(255,255,255,0.1) (línea sutil)
- **Margin**: 2rem 0

##### Copyright
- **Texto**: "© 2026 [Nombre App]. Todos los derechos reservados."
- **Tamaño**: 0.875rem
- **Color**: Gris claro (#adb5bd)
- **Alineación**: Centro
- **Padding top**: 1rem

#### 5.23.8 Secciones Adicionales (Opcionales)

##### Testimonios
- **Fondo**: Gris claro (#f8f9fa) o blanco
- **Layout**: Grid de cards o carousel
- **Card de testimonio**:
  - **Fondo**: Blanco
  - **Border radius**: 12px
  - **Padding**: 2rem
  - **Sombra**: 0 2px 10px rgba(0,0,0,0.05)
- **Contenido**:
  - **Cita**: Texto, italic, tamaño 1rem
  - **Autor**: Nombre, bold
  - **Cargo/Empresa**: Texto pequeño, gris

##### Precios (Versión Simplificada)
- **Layout**: 3 cards de planes (Gratis, Básico, Pro)
- **Estilo**: Similar a sección 5.19.1 pero más compacto
- **Botón**: "Ver todos los planes" o botón de registro directo

##### FAQ (Preguntas Frecuentes)
- **Layout**: Acordeón o lista expandible
- **Estilo**: Cards con preguntas y respuestas
- **Máximo**: 5-6 preguntas mostradas (expandir para más)

### 5.24 Configuración y Estados del Sistema

#### 5.24.1 Página de Configuración/Settings

##### Layout de Configuración
- **Container**: Ancho máximo 800px - 900px, centrado
- **Padding**: 2rem - 3rem
- **Fondo**: Blanco (#ffffff) o fondo de la app

##### Header de Configuración
- **Título**: 
  - **Texto**: "Configuración" o "Ajustes"
  - **Tamaño**: 2rem - 2.5rem
  - **Peso**: 700 (bold)
  - **Margin bottom**: 2rem
- **Breadcrumbs** (opcional): 
  - **Estilo**: Breadcrumbs (sección 5.9)
  - **Ruta**: Inicio > Configuración

##### Estructura de Configuración
- **Layout**: Lista vertical de secciones/cards
- **Secciones**: Agrupadas por categorías
- **Espaciado**: Margin bottom 2rem - 3rem entre secciones

##### Card de Sección de Configuración
- **Fondo**: Blanco (#ffffff)
- **Border**: 1px solid #e9ecef
- **Border radius**: 12px - 16px
- **Padding**: 1.5rem - 2rem
- **Sombra**: 0 2px 8px rgba(0,0,0,0.05) (opcional)
- **Margin bottom**: 1.5rem

##### Título de Sección
- **Texto**: "Apariencia", "General", "Notificaciones", etc.
- **Tamaño**: 1.25rem - 1.5rem
- **Peso**: 600 - 700 (semi-bold/bold)
- **Margin bottom**: 1.5rem

##### Items de Configuración
- **Layout**: Lista vertical
- **Item**: 
  - **Layout**: Flex horizontal (label izquierda, control derecha)
  - **Padding**: 1rem 0
  - **Border bottom**: 1px solid #e9ecef (excepto último item)
- **Label**:
  - **Texto**: Nombre de la configuración
  - **Tamaño**: 1rem
  - **Peso**: 500 (medium)
  - **Color**: Oscuro (#212529)
- **Descripción** (opcional):
  - **Texto**: Texto explicativo pequeño
  - **Tamaño**: 0.875rem
  - **Color**: Gris (#6c757d)
  - **Margin top**: 0.25rem
- **Control** (derecha):
  - **Alineación**: Derecha
  - **Elementos**: Toggle, select, input, botón

#### 5.24.2 Toggle de Tema (Dark/Light Mode)

##### Toggle Switch
- **Estilo**: Switch/Toggle estándar
- **Tamaño**: 
  - **Width**: 48px - 56px
  - **Height**: 24px - 28px
- **Estados**:
  - **Off (Claro)**: 
    - **Fondo**: Gris claro (#dee2e6)
    - **Círculo**: Blanco, izquierda
  - **On (Oscuro)**: 
    - **Fondo**: Color primario o verde (#28a745)
    - **Círculo**: Blanco, derecha
- **Transición**: Smooth (0.3s ease)
- **Iconos** (opcional):
  - **Sol**: Lado izquierdo (modo claro)
  - **Luna**: Lado derecho (modo oscuro)
  - **Tamaño**: 14px - 16px

##### Label del Toggle
- **Layout**: Label a la izquierda, toggle a la derecha
- **Texto**: "Modo Oscuro" o "Tema Oscuro"
- **Descripción** (opcional): 
  - **Texto**: "Cambiar entre tema claro y oscuro"
  - **Tamaño**: 0.875rem
  - **Color**: Gris (#6c757d)

##### Alternativa: Botones de Selección
- **Layout**: Dos botones lado a lado
- **Botón "Claro"**: 
  - **Estilo**: Botón outline o filled
  - **Icono**: Sol
  - **Estado activo**: Botón primary
- **Botón "Oscuro"**: 
  - **Estilo**: Botón outline o filled
  - **Icono**: Luna
  - **Estado activo**: Botón primary

#### 5.24.3 Indicadores de Estado Online/Offline

##### Badge de Estado en Navbar/Header
- **Posición**: Esquina superior derecha (junto a usuario/notificaciones)
- **Estilo**: Badge pequeño (sección 5.5)
- **Estados**:
  - **Online**: 
    - **Fondo**: Verde (#28a745)
    - **Texto**: "En línea" o solo icono
    - **Icono**: Wi-fi o check circle (verde)
  - **Offline**: 
    - **Fondo**: Gris (#6c757d) o rojo (#dc3545)
    - **Texto**: "Sin conexión" o solo icono
    - **Icono**: Wi-fi off o alert (gris/rojo)
- **Tamaño**: Badge pequeño (0.75rem)
- **Pulse animación** (online opcional): 
  - **Efecto**: Pulsación sutil para indicar actividad

##### Banner de Estado (Alternativa)
- **Posición**: Top de la página (debajo del navbar, fixed)
- **Estilo**: 
  - **Online**: 
    - **Fondo**: Verde claro (#d4edda)
    - **Border**: 1px solid #c3e6cb
    - **Color texto**: Verde oscuro (#155724)
    - **Texto**: "Conectado" o "Sincronizando..."
    - **Icono**: Wi-fi o sync
  - **Offline**: 
    - **Fondo**: Amarillo claro (#fff3cd) o rojo claro (#f8d7da)
    - **Border**: 1px solid #ffeaa7 o #f5c6cb
    - **Color texto**: Amarillo oscuro (#856404) o rojo oscuro (#721c24)
    - **Texto**: "Sin conexión" o "Modo offline"
    - **Icono**: Wi-fi off o alert
- **Padding**: 0.75rem 1rem
- **Tamaño fuente**: 0.875rem
- **Dismissible**: Opcional (botón X)
- **Z-index**: 1020 (debajo de navbar)

##### Icono de Estado (Minimalista)
- **Posición**: En navbar o sidebar
- **Estilo**: Solo icono circular pequeño
- **Estados**:
  - **Online**: 
    - **Fondo**: Verde (#28a745)
    - **Icono**: Wi-fi o check (blanco)
    - **Tamaño**: 24px - 32px (diámetro)
  - **Offline**: 
    - **Fondo**: Gris (#6c757d) o rojo (#dc3545)
    - **Icono**: Wi-fi off o X (blanco)
    - **Tamaño**: 24px - 32px (diámetro)

#### 5.24.4 Mensajes de Estado de Conexión

##### Toast/Notificación de Cambio de Estado
- **Posición**: Top right o bottom (fixed)
- **Estilo**: Toast/Alert (sección 5.4)
- **Estados**:
  - **Conexión perdida**: 
    - **Tipo**: Warning o danger
    - **Texto**: "Conexión perdida. Funcionando en modo offline"
    - **Icono**: Wi-fi off
    - **Auto-dismiss**: No (requiere acción del usuario)
  - **Conexión recuperada**: 
    - **Tipo**: Success
    - **Texto**: "Conexión restaurada. Sincronizando datos..."
    - **Icono**: Wi-fi o sync
    - **Auto-dismiss**: Sí (después de 3-5 segundos)
- **Acción** (opcional): 
  - **Botón**: "Reintentar" o "Ver detalles"
  - **Estilo**: Link o botón pequeño

##### Modal de Estado Offline (Opcional)
- **Tamaño**: Small o Medium
- **Título**: "Sin Conexión"
- **Contenido**: 
  - **Icono**: Wi-fi off grande (64px)
  - **Texto**: "No hay conexión a Internet. Algunas funciones pueden estar limitadas."
  - **Lista**: Funciones disponibles/limitadas
- **Botones**: 
  - **"Entendido"**: Botón primary (cierra modal)
  - **"Reintentar"**: Botón outline (verifica conexión)

#### 5.24.5 Botones de Actualización/Sync

##### Botón de Sincronización
- **Estilo**: Botón outline o ghost
- **Tamaño**: Normal o pequeño
- **Icono**: 
  - **Sync**: Flechas circulares
  - **Posición**: Izquierda del texto
- **Estados**:
  - **Idle**: 
    - **Texto**: "Sincronizar" o solo icono
    - **Estilo**: Normal
  - **Sincronizando**: 
    - **Icono**: Spinner animado (rotación continua)
    - **Texto**: "Sincronizando..." o solo spinner
    - **Disabled**: Sí (cursor not-allowed)
    - **Estilo**: Opacidad reducida
  - **Sincronizado**: 
    - **Icono**: Check verde (breve, 1-2 segundos)
    - **Texto**: "Sincronizado" o solo check
    - **Feedback**: Color verde brevemente
- **Posición**: Navbar (header) o en página de configuración

##### Botón de Actualización Manual
- **Estilo**: Botón primary o outline
- **Tamaño**: Normal
- **Texto**: "Actualizar" o "Actualizar ahora"
- **Icono**: 
  - **Refresh**: Flecha circular o refresh
  - **Posición**: Izquierda del texto
- **Estados**:
  - **Idle**: Normal
  - **Actualizando**: 
    - **Spinner**: Icono animado
    - **Texto**: "Actualizando..."
    - **Disabled**: Sí
- **Posición**: Página de configuración o header

##### Indicador de Última Sincronización
- **Estilo**: Texto pequeño
- **Tamaño**: 0.75rem - 0.875rem
- **Color**: Gris (#6c757d)
- **Contenido**: 
  - **Online**: "Última sincronización: hace X minutos" o "Sincronizado ahora"
  - **Offline**: "Sincronización pendiente" o "Última sincronización: DD/MM/YYYY HH:MM"
- **Posición**: Debajo del botón de sync o en configuración
- **Auto-actualización**: Actualizar cada minuto si está online

#### 5.24.6 Otros Elementos de Configuración

##### Toggles/Switches
- **Notificaciones**: Toggle para activar/desactivar
- **Sonidos**: Toggle para sonidos de la app
- **Modo offline automático**: Toggle para habilitar modo offline
- **Sincronización automática**: Toggle para auto-sync

##### Selects/Dropdowns
- **Idioma**: Select con idiomas disponibles
- **Región/País**: Select con países
- **Zona horaria**: Select con zonas horarias
- **Formato de fecha**: Select (DD/MM/YYYY, MM/DD/YYYY, etc.)
- **Formato de moneda**: Select con monedas

##### Inputs
- **Nombre del comercio**: Input text (editable)
- **Email de contacto**: Input email
- **Teléfono**: Input tel
- **Dirección**: Textarea

##### Botones de Acción
- **Guardar cambios**: 
  - **Estilo**: Botón primary
  - **Posición**: Bottom de la página (sticky) o al final del formulario
  - **Full width**: En mobile
- **Resetear configuración**: 
  - **Estilo**: Botón outline danger
  - **Posición**: Debajo de "Guardar" o en sección avanzada
- **Exportar configuración**: 
  - **Estilo**: Botón outline
  - **Icono**: Download
- **Importar configuración**: 
  - **Estilo**: Botón outline
  - **Icono**: Upload

##### Sección Avanzada
- **Título**: "Configuración Avanzada"
- **Estilo**: Collapsible o tabs
- **Contenido**: 
  - Opciones técnicas
  - Reset de datos
  - Exportar/Importar datos
  - Logs/Debug

#### 5.24.7 Temas Oscuro y Claro (Variables CSS)

##### Variables CSS para Tema Claro
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --border-color: #dee2e6;
  --shadow: rgba(0,0,0,0.1);
}
```

##### Variables CSS para Tema Oscuro
```css
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #adb5bd;
  --border-color: #404040;
  --shadow: rgba(0,0,0,0.3);
}
```

##### Aplicación de Temas
- **Toggle**: Cambiar atributo `data-theme` en `<html>`
- **Transición**: Smooth (0.3s ease) en propiedades de color
- **Persistencia**: Guardar preferencia en localStorage

##### Elementos Específicos por Tema

**Modo Claro**:
- **Fondo principal**: Blanco (#ffffff)
- **Fondo secundario**: Gris claro (#f8f9fa)
- **Texto**: Oscuro (#212529)
- **Bordes**: Gris claro (#dee2e6)
- **Sombras**: Sutiles (rgba(0,0,0,0.1))

**Modo Oscuro**:
- **Fondo principal**: Negro/gris muy oscuro (#1a1a1a o #121212)
- **Fondo secundario**: Gris oscuro (#2d2d2d)
- **Texto**: Blanco (#ffffff)
- **Bordes**: Gris medio (#404040)
- **Sombras**: Más fuertes (rgba(0,0,0,0.5))
- **Colores primarios**: Mantener o ajustar brillo

---

## 6. Layout y Estructura

### 6.1 Contenedores
- **Container**: Ancho máximo, centrado, padding lateral
- **Container fluid**: 100% width
- **Container pequeño**: Ancho máximo menor (ej: 750px)
- **Container grande**: Ancho máximo mayor (ej: 1400px)

### 6.2 Grid System
- **Columnas**: 12 columnas (Bootstrap) o sistema flexible
- **Gutters/Gaps**: Espaciado entre columnas (1rem - 2rem)
- **Breakpoints**: xs, sm, md, lg, xl, xxl
- **Rows**: Filas para agrupar columnas

### 6.3 Espaciado Vertical
- **Secciones**: Padding 3rem - 6rem (top/bottom)
- **Secciones pequeñas**: Padding 2rem
- **Separadores**: Líneas, espacios, dividers

### 6.4 Z-index (Capas)
- **Base**: 0
- **Sticky elements**: 100
- **Dropdowns**: 1000
- **Fixed navbar**: 1030
- **Modals backdrop**: 1040
- **Modals**: 1050
- **Popovers**: 1060
- **Tooltips**: 1070

---

## 7. Espaciados y Tamaños

### 7.1 Sistema de Espaciado
- **Base unit**: 0.25rem (4px) o 0.5rem (8px)
- **Escala**: 0, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5 rem
- **Uso consistente**: margin, padding, gap

### 7.2 Anchos y Alturas
- **Width**: 25%, 50%, 75%, 100% (o valores fijos)
- **Max-width**: Para contenedores, imágenes
- **Min-width**: Para botones, inputs (evitar muy pequeños)
- **Height**: Auto (por defecto), 100vh, valores específicos
- **Min-height**: Para secciones (ej: min-height: 100vh)

### 7.3 Border Radius
- **Pequeño**: 4px
- **Mediano**: 8px - 12px
- **Grande**: 16px - 20px
- **Pill**: 50px (muy redondeado, botones, badges)

---

## 8. Efectos y Animaciones

### 8.1 Transiciones
- **Duración**: 0.15s - 0.3s (rápido), 0.5s - 1s (lento)
- **Easing**: ease, ease-in, ease-out, ease-in-out
- **Propiedades**: color, background, transform, opacity, box-shadow

### 8.2 Transformaciones
- **Scale**: Para hover en botones, cards (scale(1.05))
- **Translate**: Para mover elementos (translateY(-5px))
- **Rotate**: Para iconos, spinners
- **Skew**: Raro, solo casos específicos

### 8.3 Sombras (Box Shadow)
- **Pequeña**: 0 1px 3px rgba(0,0,0,0.12)
- **Mediana**: 0 4px 6px rgba(0,0,0,0.1)
- **Grande**: 0 10px 25px rgba(0,0,0,0.15)
- **Hover**: Sombra más fuerte al pasar mouse

### 8.4 Animaciones
- **Fade in**: Aparecer suavemente
- **Slide in**: Deslizar desde un lado
- **Bounce**: Rebote (raro, para llamar atención)
- **Pulse**: Pulsación (para loading, destacar)
- **Spin**: Rotación continua (spinners)

### 8.5 Efectos Especiales
- **Backdrop blur**: Efecto de vidrio esmerilado
- **Gradients**: Fondos con gradientes
- **Overlay**: Capas semitransparentes
- **Glassmorphism**: Efecto de vidrio moderno

---

## 9. Responsive (Multi-dispositivo)

### 9.1 Breakpoints (Puntos de quiebre)
- **Mobile/Extra pequeño** (xs): < 576px
- **Tablet/Pequeño** (sm): ≥ 576px
- **Tablet/Mediano** (md): ≥ 768px
- **Desktop/Mediano** (lg): ≥ 992px
- **Desktop/Grande** (xl): ≥ 1200px
- **Desktop/Extra grande** (xxl): ≥ 1400px

### 9.2 Ajustes por Dispositivo

#### Mobile (< 768px)
- **Fuentes**: Tamaños reducidos (ej: h1 de 2.5rem a 2rem)
- **Padding**: Reducido (ej: de 4rem a 2rem)
- **Botones**: Full width o más grandes (touch-friendly)
- **Navbar**: Hamburger menu
- **Tablas**: Cards o scroll horizontal
- **Sidebar**: Overlay, oculto por defecto
- **Modales**: Casi fullscreen
- **Espaciado**: Reducido entre elementos

#### Tablet (768px - 992px)
- **Grid**: 2 columnas en lugar de 3-4
- **Fuentes**: Tamaños intermedios
- **Padding**: Intermedio
- **Sidebar**: Colapsable opcional

#### Desktop (≥ 992px)
- **Fuentes**: Tamaños completos
- **Padding**: Generoso
- **Grid**: Máximo de columnas (3-4)
- **Sidebar**: Visible
- **Hover effects**: Activos

### 9.3 Touch-Friendly (Móviles)
- **Tamaño mínimo de toque**: 44px x 44px (iOS), 48px x 48px (Android)
- **Espaciado entre botones**: Mínimo 8px
- **Inputs**: Tamaño adecuado, no muy pequeños
- **Scroll**: Smooth, habilitado donde sea necesario

---

## 10. Estados y Feedback Visual

### 10.1 Estados de Interacción
- **Default**: Estado inicial
- **Hover**: Al pasar mouse (desktop)
- **Active/Pressed**: Al hacer clic/tocar
- **Focus**: Al recibir foco (teclado, accesibilidad)
- **Disabled**: Deshabilitado, sin interacción
- **Loading**: Cargando, mostrar spinner

### 10.2 Feedback de Acciones
- **Éxito**: Mensaje verde, check icon, desaparece después de X segundos
- **Error**: Mensaje rojo, X icon, puede requerir acción del usuario
- **Advertencia**: Mensaje amarillo/naranja, ! icon
- **Info**: Mensaje azul, i icon

### 10.3 Validación de Formularios
- **En tiempo real**: Validar mientras el usuario escribe (opcional)
- **Al enviar**: Validar todos los campos antes de enviar
- **Mensajes claros**: Explicar qué está mal y cómo corregirlo
- **Indicadores visuales**: Bordes rojos, iconos, mensajes

### 10.4 Estados de Datos
- **Cargando**: Skeleton screens, spinners
- **Vacío**: Mensaje amigable, CTA para agregar contenido
- **Error de carga**: Mensaje de error, botón reintentar
- **Sin resultados**: Mensaje, sugerencias de búsqueda

### 10.5 Accesibilidad
- **Contraste**: Ratio mínimo 4.5:1 (texto normal), 3:1 (texto grande)
- **Focus visible**: Outline claro en elementos interactivos
- **Textos alternativos**: Alt text para imágenes
- **ARIA labels**: Para elementos interactivos complejos
- **Navegación por teclado**: Todo debe ser accesible con Tab

---

## 📝 Notas Finales

### Prioridades para App de Gestión de Comercios:
1. **Tablas responsivas**: Muchos datos, necesitan verse bien en todos los dispositivos
2. **Formularios claros**: Mucha entrada de datos (productos, ventas, etc.)
3. **Feedback inmediato**: Operaciones críticas (ventas, pagos) necesitan confirmación
4. **Navegación intuitiva**: Muchas secciones (productos, ventas, clientes, reportes)
5. **Colores semánticos**: Importante para estados (stock, pagos, etc.)
6. **Performance**: Carga rápida, especialmente en móviles con datos limitados

### Mejores Prácticas:
- **Consistencia**: Usar los mismos estilos en toda la app
- **Simplicidad**: No sobrecargar con efectos innecesarios
- **Legibilidad**: Textos claros, contraste adecuado
- **Usabilidad**: Priorizar la facilidad de uso sobre el diseño "bonito"
- **Mantenibilidad**: Organizar estilos en archivos lógicos

---

**Última actualización**: Enero 2026

