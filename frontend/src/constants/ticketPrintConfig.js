/** Configuración centralizada de tickets térmicos (58mm / 80mm). */

export const STORAGE_KEY_TICKET_PRINT = 'ticketPrintConfig'
/** @deprecated Usar STORAGE_KEY_TICKET_PRINT */
export const LEGACY_STORAGE_KEY_FORMATO = 'formatoImpresion'

export const TICKET_ANCHO_OPTS = [
  { value: 'pos58', label: 'POS 58 mm (32 columnas)', cols: 32 },
  { value: 'pos80', label: 'POS 80 mm (42 columnas)', cols: 42 },
]

export const TICKET_FUENTE_OPTS = [
  { value: 'fontA', label: 'Font A', css: '"Courier New", Courier, monospace' },
  { value: 'fontB', label: 'Font B', css: 'Consolas, "Liberation Mono", monospace' },
  { value: 'courier', label: 'Courier', css: 'Courier, "Courier New", monospace' },
]

export const TICKET_PESO_OPTS = [
  { value: 'normal', label: 'Común' },
  { value: 'bold', label: 'Negrita (títulos y totales)' },
]

export const DEFAULT_TICKET_PRINT_CONFIG = {
  ancho: 'pos80',
  mostrarDatosComercio: true,
  mostrarDatosCliente: true,
  mostrarFormasPago: true,
  mostrarFirmas: true,
  tipoFuente: 'courier',
  pesoFuente: 'bold',
}

export function getTicketColsFromConfig(config) {
  const ancho = config?.ancho === 'pos58' ? 'pos58' : 'pos80'
  return ancho === 'pos58' ? 32 : 42
}

export function getTicketAnchoMm(config) {
  return config?.ancho === 'pos58' ? 58 : 80
}

export function mergeTicketPrintConfig(partial) {
  const src = partial && typeof partial === 'object' ? partial : {}
  return {
    ...DEFAULT_TICKET_PRINT_CONFIG,
    ...src,
    ancho: src.ancho === 'pos58' ? 'pos58' : 'pos80',
    tipoFuente: ['fontA', 'fontB', 'courier'].includes(src.tipoFuente) ? src.tipoFuente : 'courier',
    pesoFuente: src.pesoFuente === 'normal' ? 'normal' : 'bold',
  }
}

export function readTicketPrintConfigFromStorage() {
  if (typeof localStorage === 'undefined') return mergeTicketPrintConfig(null)
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TICKET_PRINT)
    if (raw) return mergeTicketPrintConfig(JSON.parse(raw))
  } catch {
    /* ignore */
  }
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY_FORMATO)
  if (legacy === 'pos80' || legacy === 'a4') {
    return mergeTicketPrintConfig({ ancho: 'pos80' })
  }
  return mergeTicketPrintConfig(null)
}

export function writeTicketPrintConfigToStorage(config) {
  if (typeof localStorage === 'undefined') return
  const merged = mergeTicketPrintConfig(config)
  localStorage.setItem(STORAGE_KEY_TICKET_PRINT, JSON.stringify(merged))
  localStorage.setItem(LEGACY_STORAGE_KEY_FORMATO, merged.ancho === 'pos58' ? 'pos58' : 'pos80')
}

export function getTicketFontFamilyCss(config) {
  const opt = TICKET_FUENTE_OPTS.find((o) => o.value === config?.tipoFuente)
  return opt?.css || TICKET_FUENTE_OPTS[2].css
}

/** Prefijos de línea en negrita cuando pesoFuente === 'bold'. */
export function getTicketBoldLinePrefixes() {
  return [
    'TOTAL',
    'Boleto',
    'FORMA PAGO',
    'MONTO ADEUDADO',
    'TOTAL DEUDA',
    'TOTAL PAGADO',
    'TOTAL VENTA',
    'TOTAL COMPRA',
    'Firma',
    'FIRMA',
    'DATOS DEL CLIENTE',
    'DETALLE DE PAGO',
    'FORMA DE PAGO',
    'Historial',
  ]
}
