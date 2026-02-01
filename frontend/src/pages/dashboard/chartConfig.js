/**
 * Configuración de tablas y opciones para el gráfico del Dashboard
 * filters: array de ids de filtros que aplican a esta tabla (categoria, marca, producto, cliente, proveedor, metodoPago)
 */

export const TABLAS_CONFIG = {
  ventas: {
    id: 'ventas',
    label: 'Registro de ventas',
    filters: ['categoria', 'marca', 'producto', 'cliente', 'metodoPago'],
    labelOptions: [
      { id: 'unidades', label: 'Unidades' },
      { id: 'total', label: '$ Total' },
      { id: 'cantidad', label: 'Cantidad (operaciones)' }
    ],
    axisOptions: [
      { id: 'fecha', label: 'Fecha', rangeType: 'dias', rangePlaceholder: 'días por columna (1 por defecto)' },
      { id: 'estado', label: 'Estado', rangeType: null, rangePlaceholder: 'Todos los estados' },
      { id: 'total', label: '$ Total', rangeType: 'moneda', rangePlaceholder: 'escala (ej: 10000)' },
      { id: 'unidades', label: 'Unidades', rangeType: 'numero', rangePlaceholder: 'agrupación' },
      { id: 'cantidad', label: 'Cantidad', rangeType: 'numero', rangePlaceholder: 'agrupación' }
    ],
    usaFechas: true
  },
  compras: {
    id: 'compras',
    label: 'Registro de compras',
    filters: ['categoria', 'marca', 'producto', 'proveedor', 'metodoPago'],
    labelOptions: [
      { id: 'unidades', label: 'Unidades' },
      { id: 'total', label: '$ Total' },
      { id: 'cantidad', label: 'Cantidad (operaciones)' }
    ],
    axisOptions: [
      { id: 'fecha', label: 'Fecha', rangeType: 'dias', rangePlaceholder: 'días por columna (1 por defecto)' },
      { id: 'estado', label: 'Estado', rangeType: null, rangePlaceholder: 'Todos los estados' },
      { id: 'total', label: '$ Total', rangeType: 'moneda', rangePlaceholder: 'escala (ej: 10000)' },
      { id: 'unidades', label: 'Unidades', rangeType: 'numero', rangePlaceholder: 'agrupación' },
      { id: 'cantidad', label: 'Cantidad', rangeType: 'numero', rangePlaceholder: 'agrupación' }
    ],
    usaFechas: true
  },
  productos: {
    id: 'productos',
    label: 'Registro de productos',
    filters: ['categoria', 'marca'],
    labelOptions: [
      { id: 'cantidad', label: 'Cantidad productos' },
      { id: 'stock', label: 'Stock total' }
    ],
    axisOptions: [
      { id: 'categoria', label: 'Categoría', rangeType: null, rangePlaceholder: '—' },
      { id: 'marca', label: 'Marca', rangeType: null, rangePlaceholder: '—' },
      { id: 'cantidad', label: 'Cantidad productos', rangeType: 'numero', rangePlaceholder: 'escala' },
      { id: 'stock', label: 'Stock total', rangeType: 'numero', rangePlaceholder: 'escala' }
    ],
    usaFechas: false
  },
  clientes: {
    id: 'clientes',
    label: 'Registro de clientes',
    filters: [],
    labelOptions: [
      { id: 'cantidad', label: 'Cantidad' }
    ],
    axisOptions: [
      { id: 'fecha', label: 'Fecha', rangeType: 'dias', rangePlaceholder: 'días por columna (ej: 1, 5)' },
      { id: 'cantidad', label: 'Cantidad', rangeType: 'numero', rangePlaceholder: 'agrupación' }
    ],
    usaFechas: true
  }
}

export const METODOS_PAGO = [
  'Efectivo',
  'Tarjeta de crédito',
  'Tarjeta de débito',
  'Transferencia',
  'Cheque',
  'Mercado Pago',
  'Otro'
]

export const TABLAS_IDS = Object.keys(TABLAS_CONFIG)
