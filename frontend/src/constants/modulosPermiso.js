/**
 * Códigos de módulo alineados con public.app_modulos (BD).
 * Usados en rutas, sidebar y comercio_rol_modulos.
 */
export const MODULO_CODIGOS = [
  'dashboard',
  'categorias',
  'marcas',
  'clientes',
  'proveedores',
  'productos',
  'compras',
  'ventas',
  'ventas_rapidas',
  'reportes',
  'mantenimiento',
  'inventario',
]

/** Etiquetas para UI (si no hay fila en app_modulos aún) */
/** Orden para elegir la primera pantalla tras login o al denegar un módulo */
export const NAV_ORDER_PATHS = [
  ['dashboard', '/dashboard'],
  ['categorias', '/categorias'],
  ['marcas', '/marcas'],
  ['clientes', '/clientes'],
  ['proveedores', '/proveedores'],
  ['productos', '/productos'],
  ['compras', '/compras'],
  ['ventas', '/ventas'],
  ['ventas_rapidas', '/ventas-rapidas'],
  ['reportes', '/reportes'],
  ['mantenimiento', '/mantenimiento'],
  ['inventario', '/inventario'],
]

export const MODULO_LABELS = {
  dashboard: 'Dashboard',
  categorias: 'Categorías',
  marcas: 'Marcas',
  clientes: 'Clientes',
  proveedores: 'Proveedores',
  productos: 'Productos',
  compras: 'Compras',
  ventas: 'Ventas y POS',
  ventas_rapidas: 'Ventas rápidas y caja',
  reportes: 'Informes y reportes',
  mantenimiento: 'Mantenimiento',
  inventario: 'Inventario',
}
