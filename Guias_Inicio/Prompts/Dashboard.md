Quiero que rediseñes completamente el módulo Dashboard de mi sistema de gestión de kioscos, tomando como inspiración un dashboard moderno tipo ERP (como Linear, Vercel, Metabase, Stripe Dashboard o Supabase), con el mismo estilo visual oscuro que ya utiliza mi aplicación.

IMPORTANTE

No debes modificar absolutamente ninguna funcionalidad existente del resto del sistema.

No debes romper rutas, componentes, stores, servicios, APIs ni lógica de negocio.

Solo puedes modificar:

la interfaz del Dashboard
componentes reutilizables del Dashboard
consultas necesarias para obtener indicadores
estilos del Dashboard

Todo el resto del sistema debe seguir funcionando exactamente igual.

Objetivo

Quiero que el Dashboard deje de ser un simple menú y pase a ser un verdadero centro de análisis de datos del negocio.

Debe servir para que el dueño del kiosco pueda abrir el sistema y entender en menos de 10 segundos cómo está funcionando su negocio.

Debe verse extremadamente profesional.

Mantener el estilo actual

Conservar la identidad visual actual:

modo oscuro
bordes redondeados
glassmorphism suave
colores cyan
verdes
violetas
sombras suaves
tipografía actual
iconografía Lucide

No quiero cambiar el diseño del resto del sistema.

Quiero que parezca una evolución del diseño existente.

Layout

Crear un dashboard organizado en bloques.

Orden sugerido:

Barra superior

Debe contener:

Título Dashboard

Subtítulo

Fecha actual

Selector de rango de fechas

Botón Exportar PDF

Botón Exportar Excel

Botón Actualizar datos

Panel global de filtros

Agregar filtros que afecten TODOS los gráficos.

Debe poder filtrar por:

fecha desde
fecha hasta
sucursal (si existe)
cliente
proveedor
categoría
marca
producto
usuario vendedor
forma de pago
estado de venta
estado de compra
activo/inactivo

Botón:

Aplicar filtros

Botón:

Limpiar filtros

Los filtros deben refrescar todos los indicadores.

KPI principales

Mostrar tarjetas grandes.

Ejemplo:

Ventas del período

Comparación contra período anterior

%

Cantidad de ventas

Ticket promedio

Productos vendidos

Compras realizadas

Ganancia estimada

Margen bruto

Clientes nuevos

Clientes activos

Stock total

Productos con stock crítico

Valor total del inventario

Proveedores activos

Usuarios activos

Cada tarjeta debe mostrar:

icono

valor grande

variación %

comparación

color según tendencia

Gráfico de evolución

Un gráfico principal de líneas.

Debe permitir cambiar entre:

Ventas

Compras

Ganancias

Cantidad de tickets

Ticket promedio

Clientes nuevos

Selector:

día

semana

mes

año

Ventas por forma de pago

Gráfico tipo donut.

Ejemplo:

Efectivo

Débito

Crédito

Transferencia

Cuenta corriente

QR

Otros

Ventas por categoría

Gráfico donut.

Ejemplo

Bebidas

Golosinas

Lácteos

Cigarrillos

Alimentos

Limpieza

Otros

Top productos

Gráfico horizontal.

Mostrar

Top 10 productos vendidos

Cantidad

Importe

Variación

Top clientes

Tabla.

Cliente

Cantidad compras

Monto

Última compra

Top proveedores

Tabla

Proveedor

Cantidad compras

Monto comprado

Última compra

Estado de ventas

Tarjetas

Pagadas

Pendientes

Canceladas

Anuladas

Devueltas

Estado de compras

Tarjetas

Recibidas

Pendientes

Canceladas

Parciales

Indicadores de stock

Mostrar

Productos con stock bajo

Productos sin stock

Productos próximos a vencer (si existe)

Valor del inventario

Rotación de stock

Alertas

Panel lateral.

Ejemplos

Stock crítico

Productos sin movimiento hace 90 días

Clientes con deuda

Compras pendientes

Ventas anuladas

Productos más vendidos

Productos menos vendidos

Últimas ventas

Tabla

Fecha

Cliente

Forma de pago

Total

Estado

Acciones

Últimas compras

Tabla

Proveedor

Fecha

Monto

Estado

Productos destacados

Tabla

Más vendidos

Más rentables

Menor stock

Mayor margen

Comparaciones

Agregar comparaciones automáticas.

Hoy vs ayer

Semana actual vs anterior

Mes actual vs anterior

Año actual vs anterior

Mostrar

%

flecha

color

Interactividad

Todos los gráficos deben ser interactivos.

Hover

Tooltip

Animaciones suaves

Leyendas

Click para filtrar

Ejemplo

Si hago click en "Efectivo"

filtrar todo el dashboard mostrando únicamente ventas en efectivo.

Rendimiento

No cargar todos los datos innecesariamente.

Optimizar consultas.

Usar memoización.

Evitar renders innecesarios.

Mantener buena performance.

Responsive

Debe verse perfecto en

1920 px

1600 px

1440 px

1366 px

tablets

Librerías

Si el proyecto ya posee una librería de gráficos, reutilizarla.

Si no existe, instalar la más adecuada.

Preferencia:

Recharts

o

Chart.js

No cambiar otras dependencias del proyecto.

Código

Crear componentes separados.

Ejemplo

DashboardKPIs.jsx

DashboardFilters.jsx

SalesChart.jsx

PaymentChart.jsx

CategoryChart.jsx

TopProducts.jsx

AlertsPanel.jsx

DashboardTables.jsx

DashboardCards.jsx

DashboardSummary.jsx

No dejar un archivo de más de 300 líneas si es posible.

Calidad del código

Código limpio.

Componentes reutilizables.

Tipado consistente.

Comentarios solo cuando aporten valor.

Sin código muerto.

Restricción más importante

NO MODIFICAR ninguna funcionalidad existente del sistema.

NO romper rutas.

NO modificar módulos como:

Productos
Compras
Ventas
Usuarios
Clientes
Proveedores
Configuración
Referencias

Solo intervenir el Dashboard y crear los componentes nuevos que sean necesarios para soportar el análisis de datos.

Resultado esperado

Al finalizar, el Dashboard debe sentirse como el panel principal de un ERP profesional, comparable visualmente con sistemas como Power BI, Metabase, Superset, Stripe Dashboard, Notion Analytics o Supabase, manteniendo exactamente la identidad visual oscura del resto de la aplicación y reutilizando toda la información ya disponible en la base de datos. Además, si alguna métrica aún no puede calcularse porque falta información o endpoints, quiero que implementes la estructura visual igualmente y dejes claramente marcados (con comentarios TODO) los puntos donde será necesario completar la lógica posteriormente, sin afectar el funcionamiento actual del sistema.