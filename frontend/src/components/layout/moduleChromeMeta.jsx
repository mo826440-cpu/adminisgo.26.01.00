import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../common'

const K = 'AdminisGo'

function Tb({ to, children }) {
  return (
    <Link to={to}>
      <Button variant="outline">{children}</Button>
    </Link>
  )
}

/**
 * Metadatos para ModuleGlassPageHeader según la ruta (excluye /inicio — el hub usa su propio hero).
 */
export function getModuleChrome(pathname) {
  const p = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  if (p === '/inicio' || p.startsWith('/inicio/')) return null

  // —— Ventas rápidas (orden: más específico primero) ——
  if (p === '/ventas-rapidas/historial') {
    return {
      kicker: K,
      title: 'Historial de cajas',
      subtitle: 'Aperturas y cierres de caja',
      icon: 'bi-clock-history',
      toolbarEnd: <Tb to="/ventas-rapidas">← Volver a Ventas rápidas</Tb>,
    }
  }
  if (p.startsWith('/ventas-rapidas/')) {
    return {
      kicker: K,
      title: 'Detalle de venta rápida',
      subtitle: 'Consultá el movimiento registrado',
      icon: 'bi-receipt',
      toolbarEnd: <Tb to="/ventas-rapidas">← Volver a Ventas rápidas</Tb>,
    }
  }
  if (p === '/ventas-rapidas') {
    return {
      kicker: K,
      title: 'Ventas rápidas',
      subtitle: 'Gestión de caja y ventas rápidas',
      icon: 'bi-lightning-charge',
      toolbarEnd: null,
    }
  }

  // —— Ventas (orden: exactas y rutas fijas antes que :id) ——
  if (p === '/ventas') {
    return {
      kicker: K,
      title: 'Ventas',
      subtitle: 'Listado y gestión de ventas',
      icon: 'bi-graph-up-arrow',
      toolbarEnd: (
        <Link to="/ventas/nueva">
          <Button variant="primary">+ Nueva venta</Button>
        </Link>
      ),
    }
  }
  if (p === '/ventas/nueva') {
    return {
      kicker: K,
      title: 'Registrar venta',
      subtitle: 'Cargá ítems, cliente y pagos',
      icon: 'bi-shop-window',
      toolbarEnd: null,
    }
  }
  if (/\/ventas\/[^/]+\/editar$/.test(p)) {
    return {
      kicker: K,
      title: 'Editar venta',
      subtitle: 'Modificá ítems y pagos de la venta',
      icon: 'bi-pencil-square',
      toolbarEnd: null,
    }
  }
  if (/^\/ventas\/(?!nueva$)[^/]+$/.test(p)) {
    return {
      kicker: K,
      title: 'Detalle de venta',
      subtitle: 'Resumen del ticket y pagos',
      icon: 'bi-receipt-cutoff',
      toolbarEnd: <Tb to="/ventas">← Volver a Ventas</Tb>,
    }
  }

  // —— Productos ——
  if (p === '/productos/nuevo') {
    return {
      kicker: K,
      title: 'Nuevo producto',
      subtitle: 'Alta en el catálogo',
      icon: 'bi-box-seam',
      toolbarEnd: <Tb to="/productos">← Volver al listado</Tb>,
    }
  }
  if (/^\/productos\/(?!nuevo$)[^/]+$/.test(p)) {
    return {
      kicker: K,
      title: 'Editar producto',
      subtitle: 'Modificá los datos del artículo',
      icon: 'bi-box-seam',
      toolbarEnd: <Tb to="/productos">← Volver al listado</Tb>,
    }
  }
  if (p === '/productos') {
    return {
      kicker: K,
      title: 'Productos',
      subtitle: 'Catálogo y stock',
      icon: 'bi-box-seam',
      toolbarEnd: (
        <Link to="/productos/nuevo">
          <Button variant="primary">+ Nuevo producto</Button>
        </Link>
      ),
    }
  }

  // —— Clientes ——
  if (p === '/clientes/nuevo') {
    return {
      kicker: K,
      title: 'Nuevo cliente',
      subtitle: 'Alta en la base de clientes',
      icon: 'bi-person-plus',
      toolbarEnd: <Tb to="/clientes">← Volver al listado</Tb>,
    }
  }
  if (/^\/clientes\/(?!nuevo$)[^/]+$/.test(p)) {
    return {
      kicker: K,
      title: 'Editar cliente',
      subtitle: 'Datos de contacto y condición',
      icon: 'bi-person-lines-fill',
      toolbarEnd: <Tb to="/clientes">← Volver al listado</Tb>,
    }
  }
  if (p === '/clientes') {
    return {
      kicker: K,
      title: 'Clientes',
      subtitle: 'Base de clientes del comercio',
      icon: 'bi-people',
      toolbarEnd: (
        <Link to="/clientes/nuevo">
          <Button variant="primary">+ Nuevo cliente</Button>
        </Link>
      ),
    }
  }

  // —— Categorías ——
  if (p === '/categorias/nuevo') {
    return {
      kicker: K,
      title: 'Nueva categoría',
      subtitle: 'Rubro o clasificación',
      icon: 'bi-folder-plus',
      toolbarEnd: <Tb to="/categorias">← Volver al listado</Tb>,
    }
  }
  if (/^\/categorias\/(?!nuevo$)[^/]+$/.test(p)) {
    return {
      kicker: K,
      title: 'Editar categoría',
      subtitle: 'Modificá el rubro',
      icon: 'bi-folder',
      toolbarEnd: <Tb to="/categorias">← Volver al listado</Tb>,
    }
  }
  if (p === '/categorias') {
    return {
      kicker: K,
      title: 'Categorías',
      subtitle: 'Rubros y clasificación',
      icon: 'bi-folder',
      toolbarEnd: (
        <Link to="/categorias/nuevo">
          <Button variant="primary">+ Nueva categoría</Button>
        </Link>
      ),
    }
  }

  // —— Marcas ——
  if (p === '/marcas/nuevo') {
    return {
      kicker: K,
      title: 'Nueva marca',
      subtitle: 'Alta de marca de producto',
      icon: 'bi-bookmark-plus',
      toolbarEnd: <Tb to="/marcas">← Volver al listado</Tb>,
    }
  }
  if (/^\/marcas\/(?!nuevo$)[^/]+$/.test(p)) {
    return {
      kicker: K,
      title: 'Editar marca',
      subtitle: 'Modificá la marca',
      icon: 'bi-bookmarks',
      toolbarEnd: <Tb to="/marcas">← Volver al listado</Tb>,
    }
  }
  if (p === '/marcas') {
    return {
      kicker: K,
      title: 'Marcas',
      subtitle: 'Marcas de productos',
      icon: 'bi-bookmarks',
      toolbarEnd: (
        <Link to="/marcas/nuevo">
          <Button variant="primary">+ Nueva marca</Button>
        </Link>
      ),
    }
  }

  // —— Proveedores ——
  if (p === '/proveedores/nuevo') {
    return {
      kicker: K,
      title: 'Nuevo proveedor',
      subtitle: 'Alta de proveedor',
      icon: 'bi-truck',
      toolbarEnd: <Tb to="/proveedores">← Volver al listado</Tb>,
    }
  }
  if (/^\/proveedores\/(?!nuevo$)[^/]+$/.test(p)) {
    return {
      kicker: K,
      title: 'Editar proveedor',
      subtitle: 'Datos y contacto',
      icon: 'bi-truck',
      toolbarEnd: <Tb to="/proveedores">← Volver al listado</Tb>,
    }
  }
  if (p === '/proveedores') {
    return {
      kicker: K,
      title: 'Proveedores',
      subtitle: 'Proveedores y contactos',
      icon: 'bi-truck',
      toolbarEnd: (
        <Link to="/proveedores/nuevo">
          <Button variant="primary">+ Nuevo proveedor</Button>
        </Link>
      ),
    }
  }

  // —— Compras ——
  if (p === '/compras') {
    return {
      kicker: K,
      title: 'Compras',
      subtitle: 'Órdenes y proveedores',
      icon: 'bi-cart3',
      toolbarEnd: (
        <Link to="/compras/nueva">
          <Button variant="primary">+ Nueva orden</Button>
        </Link>
      ),
    }
  }
  if (p === '/compras/nueva') {
    return {
      kicker: K,
      title: 'Nueva orden de compra',
      subtitle: 'Registrá la compra a proveedor',
      icon: 'bi-cart3',
      toolbarEnd: <Tb to="/compras">← Volver al listado</Tb>,
    }
  }
  if (/\/compras\/[^/]+\/editar$/.test(p)) {
    return {
      kicker: K,
      title: 'Editar orden de compra',
      subtitle: 'Modificá ítems y totales',
      icon: 'bi-pencil-square',
      toolbarEnd: <Tb to="/compras">← Volver al listado</Tb>,
    }
  }
  if (/^\/compras\/(?!nueva$)[^/]+$/.test(p)) {
    return {
      kicker: K,
      title: 'Detalle de orden de compra',
      subtitle: 'Estado y líneas de la orden',
      icon: 'bi-file-earmark-text',
      toolbarEnd: <Tb to="/compras">← Volver a Compras</Tb>,
    }
  }

  // —— Configuración ——
  if (p === '/configuracion/cambiar-plan') {
    return {
      kicker: K,
      title: 'Cambiar plan',
      subtitle: 'Elegí el plan de tu comercio',
      icon: 'bi-credit-card-2-front',
      toolbarEnd: <Tb to="/configuraciones">← Volver a Configuración</Tb>,
    }
  }
  if (p === '/configuraciones') {
    return {
      kicker: K,
      title: 'Configuración',
      subtitle: 'Preferencias del comercio y tu perfil',
      icon: 'bi-sliders',
      toolbarEnd: null,
    }
  }

  // —— Usuarios ——
  if (p === '/usuarios/nuevo') {
    return {
      kicker: K,
      title: 'Invitar usuario',
      subtitle: 'Envío de invitación por correo',
      icon: 'bi-person-plus',
      toolbarEnd: <Tb to="/usuarios">← Volver a usuarios</Tb>,
    }
  }
  if (p === '/usuarios/permisos') {
    return {
      kicker: K,
      title: 'Permisos por rol',
      subtitle: 'Qué puede hacer cada rol en el sistema',
      icon: 'bi-shield-lock',
      toolbarEnd: <Tb to="/usuarios">← Volver a usuarios</Tb>,
    }
  }
  if (p === '/usuarios') {
    return {
      kicker: K,
      title: 'Usuarios',
      subtitle: 'Usuarios de tu comercio',
      icon: 'bi-people',
      toolbarEnd: (
        <Fragment>
          <Link to="/usuarios/permisos">
            <Button variant="outline">Permisos por rol</Button>
          </Link>
          <Link to="/usuarios/nuevo">
            <Button variant="primary">+ Invitar usuario</Button>
          </Link>
        </Fragment>
      ),
    }
  }

  // —— Reportes y otros ——
  if (p === '/reportes') {
    return {
      kicker: K,
      title: 'Reportes',
      subtitle: 'Informes y exportación',
      icon: 'bi-file-earmark-bar-graph',
      toolbarEnd: null,
    }
  }
  if (p === '/otros-costos') {
    return {
      kicker: K,
      title: 'Otros costos',
      subtitle: 'Gastos fijos, variables o inversiones',
      icon: 'bi-wallet2',
      toolbarEnd: null,
    }
  }

  // —— En desarrollo ——
  if (p === '/inventario') {
    return {
      kicker: K,
      title: 'Inventario',
      subtitle: 'Módulo en preparación',
      icon: 'bi-boxes',
      toolbarEnd: <Tb to="/inicio">← Panel de inicio</Tb>,
    }
  }
  if (p === '/mantenimiento') {
    return {
      kicker: K,
      title: 'Mantenimiento',
      subtitle: 'Herramientas y soporte',
      icon: 'bi-wrench-adjustable',
      toolbarEnd: <Tb to="/inicio">← Panel de inicio</Tb>,
    }
  }

  // —— Registro ——
  if (p === '/auth/complete-registration') {
    return {
      kicker: K,
      title: 'Completar registro',
      subtitle: 'Paso 3 de 3: datos de tu comercio',
      icon: 'bi-clipboard-check',
      toolbarEnd: null,
    }
  }

  // —— Dashboard ——
  if (p === '/dashboard') {
    return {
      kicker: K,
      title: 'Dashboard',
      subtitle: 'Resumen y métricas en tiempo real',
      icon: 'bi-speedometer2',
      toolbarEnd: null,
    }
  }

  return {
    kicker: K,
    title: 'AdminisGo',
    subtitle: '',
    icon: 'bi-grid-1x2-fill',
    toolbarEnd: <Tb to="/inicio">← Panel de inicio</Tb>,
  }
}
