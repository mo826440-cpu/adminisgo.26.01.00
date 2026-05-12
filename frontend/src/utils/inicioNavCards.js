/** Primer submódulo de Referencias al que el usuario puede entrar (orden sidebar). */
export function firstReferenciasPath(puedeModulo) {
  const pairs = [
    ['categorias', '/categorias'],
    ['marcas', '/marcas'],
    ['clientes', '/clientes'],
    ['proveedores', '/proveedores'],
    ['productos', '/productos'],
  ]
  for (const [code, path] of pairs) {
    if (puedeModulo(code)) return path
  }
  return null
}

const TONES = ['cyan', 'violet', 'emerald']

/**
 * Tarjetas de navegación para el panel de inicio (usuario con sesión y permisos).
 * @param {(codigo: string) => boolean} puedeModulo
 * @param {boolean} isAdmin
 */
export function buildInicioNavCards(puedeModulo, isAdmin) {
  const out = []
  let ti = 0
  const push = (card) => {
    out.push({ ...card, tone: TONES[ti % TONES.length] })
    ti += 1
  }

  if (puedeModulo('dashboard')) {
    push({
      key: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Resumen en tiempo real',
      icon: 'bi-speedometer2',
      to: '/dashboard',
    })
  }

  const refPath = firstReferenciasPath(puedeModulo)
  if (refPath) {
    push({
      key: 'referencias',
      title: 'Referencias',
      subtitle: 'Catálogos y tablas maestras',
      icon: 'bi-bookmark-star',
      to: '/inicio/referencias',
    })
  }

  if (isAdmin) {
    push({
      key: 'usuarios',
      title: 'Usuarios',
      subtitle: 'Roles y permisos',
      icon: 'bi-people',
      to: '/usuarios',
    })
  }

  if (puedeModulo('compras')) {
    push({
      key: 'compras',
      title: 'Compras',
      subtitle: 'Proveedores y órdenes',
      icon: 'bi-cart3',
      to: '/compras',
    })
  }

  if (puedeModulo('ventas')) {
    push({
      key: 'ventas',
      title: 'Ventas',
      subtitle: 'Transacciones y caja',
      icon: 'bi-graph-up-arrow',
      to: '/ventas',
    })
  }

  if (puedeModulo('ventas_rapidas')) {
    push({
      key: 'ventas_rapidas',
      title: 'Ventas rápidas',
      subtitle: 'Checkout exprés',
      icon: 'bi-lightning-charge',
      to: '/ventas-rapidas',
    })
  }

  if (puedeModulo('reportes')) {
    push({
      key: 'reportes',
      title: 'Reportes',
      subtitle: 'Indicadores y exportación',
      icon: 'bi-file-earmark-bar-graph',
      to: '/reportes',
    })
  }

  if (isAdmin) {
    push({
      key: 'otros_costos',
      title: 'Otros costos',
      subtitle: 'Gastos operativos',
      icon: 'bi-wallet2',
      to: '/otros-costos',
    })
    push({
      key: 'configuraciones',
      title: 'Configuraciones',
      subtitle: 'Preferencias del sistema',
      icon: 'bi-sliders',
      to: '/configuraciones',
    })
  }

  if (puedeModulo('mantenimiento')) {
    push({
      key: 'mantenimiento',
      title: 'Mantenimiento',
      subtitle: 'Herramientas y soporte',
      icon: 'bi-wrench-adjustable',
      to: '/mantenimiento',
    })
  }

  return out
}

const REFERENCIAS_ITEMS = [
  {
    key: 'categorias',
    title: 'Categorías',
    subtitle: 'Rubros y clasificación',
    icon: 'bi-folder',
    to: '/categorias',
  },
  {
    key: 'marcas',
    title: 'Marcas',
    subtitle: 'Marcas de productos',
    icon: 'bi-bookmarks',
    to: '/marcas',
  },
  {
    key: 'clientes',
    title: 'Clientes',
    subtitle: 'Base de clientes',
    icon: 'bi-person-lines-fill',
    to: '/clientes',
  },
  {
    key: 'proveedores',
    title: 'Proveedores',
    subtitle: 'Proveedores y contactos',
    icon: 'bi-truck',
    to: '/proveedores',
  },
  {
    key: 'productos',
    title: 'Productos',
    subtitle: 'Artículos y stock',
    icon: 'bi-box-seam',
    to: '/productos',
  },
]

/** Tarjetas del subpanel Referencias (/inicio/referencias). */
export function buildReferenciasHubCards(puedeModulo) {
  const out = []
  let ti = 0
  for (const item of REFERENCIAS_ITEMS) {
    if (!puedeModulo(item.key)) continue
    out.push({ ...item, tone: TONES[ti % TONES.length] })
    ti += 1
  }
  return out
}
