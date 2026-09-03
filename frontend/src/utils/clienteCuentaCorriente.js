import { ventaEstaCancelada } from './ventaEstado'

export const CC_EPS = 0.009
/** Pagos cuya fecha está cerca de la venta se consideran cobro en el momento (misma fila). */
const AT_SALE_MS = 2 * 60 * 1000

const METODO_LABEL = {
  efectivo: 'efectivo',
  transferencia: 'transferencia',
  qr: 'QR',
  debito: 'débito',
  credito: 'crédito',
  cheque: 'cheque',
  otro: 'otro',
}

export function padCuentaNumero(n, width = 5) {
  const num = Number(n)
  if (!Number.isFinite(num) || num <= 0) return String(n ?? '')
  return String(Math.trunc(num)).padStart(width, '0')
}

export function formatNumeroVenta(venta) {
  const fact = String(venta?.facturacion || '').trim()
  if (fact) return fact.startsWith('#') ? fact : `#${fact}`
  return `#V-${padCuentaNumero(venta?.id)}`
}

export function formatNumeroRecibo(pago) {
  return `#C-${padCuentaNumero(pago?.id)}`
}

export function initialsFromNombre(nombre) {
  const source = String(nombre || '?').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function getEstadoCuenta(saldo) {
  const n = Number(saldo) || 0
  if (n > CC_EPS) return 'debe'
  if (n < -CC_EPS) return 'a_favor'
  return 'al_dia'
}

export function getEstadoCuentaLabel(estado) {
  if (estado === 'debe') return 'DEBE'
  if (estado === 'a_favor') return 'A FAVOR'
  return 'AL DÍA'
}

function esPagoReal(pago) {
  const metodo = String(pago?.metodo_pago || '').toLowerCase()
  if (metodo === 'pendiente') return false
  return (parseFloat(pago?.monto_pagado) || 0) > CC_EPS
}

function pagoEnElMomento(ventaFechaIso, pagoFechaIso) {
  const t0 = new Date(ventaFechaIso || 0).getTime()
  const t1 = new Date(pagoFechaIso || 0).getTime()
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) return false
  return Math.abs(t1 - t0) <= AT_SALE_MS
}

function nombresProductos(items) {
  const names = []
  const seen = new Set()
  for (const it of items || []) {
    const n = String(it?.productos?.nombre || it?.nombre || '').trim()
    if (!n) continue
    const key = n.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(n)
    if (names.length >= 3) break
  }
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names[0]}, ${names[1]} y ${names[2]}`
}

function metodoCobroLabel(codigo) {
  const key = String(codigo || '').toLowerCase()
  return METODO_LABEL[key] || key || 'cobro'
}

function detalleVenta(venta, items) {
  const nro = formatNumeroVenta(venta)
  const prods = nombresProductos(items)
  const base = `Venta ${nro}`
  return prods ? `${base} · ${prods}` : base
}

function detallePagoSaldo(pagos) {
  const first = pagos[0]
  const recibo = pagos.length === 1 ? formatNumeroRecibo(first) : null
  const obs = String(first?.observaciones || '').trim()
  const metodo = metodoCobroLabel(first?.metodo_pago)
  let base = 'Pago de saldo pendiente'
  if (recibo) base = `${base} · Recibo ${recibo}`
  else if (metodo) base = `${base} · ${metodo}`
  if (obs) base = `${base} · ${obs}`
  return base
}

function ts(iso) {
  const t = new Date(iso || 0).getTime()
  return Number.isFinite(t) ? t : 0
}

function groupLaterPagos(later) {
  const groups = new Map()
  for (const item of later) {
    const p = item.pago
    const t = p.fecha_pago ? new Date(p.fecha_pago).toISOString() : 'sin-fecha'
    const key = `${t}|${String(p.metodo_pago || '')}|${String(p.observaciones || '')}|${item.anulado ? '1' : '0'}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return [...groups.values()]
}

/**
 * Arma el libro de cuenta corriente.
 *
 * Cada venta es una fila con:
 * - Cargo / Venta = total de la venta
 * - Pago / Cobro = lo abonado en el momento
 * - Resto venta = lo que quedó de esa venta
 * - Saldo pendiente = deuda acumulada de la cuenta
 *
 * Los cobros posteriores (FIFO) van en filas aparte: «Pago de saldo pendiente».
 */
export function buildCuentaCorrienteMovimientos(payload = {}) {
  const ventas = Array.isArray(payload.ventas) ? payload.ventas : []
  const itemsSrc = payload.itemsByVentaId
  const pagosSrc = payload.pagosByVentaId
  const getItems = (id) => {
    if (!itemsSrc) return []
    if (typeof itemsSrc.get === 'function') return itemsSrc.get(Number(id)) || itemsSrc.get(id) || []
    return itemsSrc[id] || itemsSrc[String(id)] || []
  }
  const getPagos = (id) => {
    if (!pagosSrc) return []
    if (typeof pagosSrc.get === 'function') return pagosSrc.get(Number(id)) || pagosSrc.get(id) || []
    return pagosSrc[id] || pagosSrc[String(id)] || []
  }

  const raw = []
  const laterAll = []

  for (const venta of ventas) {
    if (!venta || venta.deleted_at) continue
    const anulado = ventaEstaCancelada(venta)
    const total = parseFloat(venta.total) || 0
    const pagos = (getPagos(venta.id) || []).filter(esPagoReal)
    const atSale = pagos.filter((p) => pagoEnElMomento(venta.fecha_hora, p.fecha_pago))
    const later = pagos.filter((p) => !pagoEnElMomento(venta.fecha_hora, p.fecha_pago))
    const pagadoEnElMomento = atSale.reduce((s, p) => s + (parseFloat(p.monto_pagado) || 0), 0)
    const resto = Math.max(0, total - pagadoEnElMomento)
    const items = getItems(venta.id)

    raw.push({
      id: `venta-${venta.id}`,
      tipo: 'venta',
      fecha: venta.fecha_hora,
      ventaId: venta.id,
      pagoId: atSale[0]?.id ?? null,
      cargo: total,
      pago: pagadoEnElMomento,
      resto,
      anulado,
      numeroVenta: formatNumeroVenta(venta),
      numeroRecibo: atSale.length === 1 ? formatNumeroRecibo(atSale[0]) : null,
      numeroTicket: venta.numero_ticket || '',
      facturacion: venta.facturacion || '',
      detalle: detalleVenta(venta, items),
      metodo: atSale[0]?.metodo_pago || null,
      observaciones: venta.observaciones || '',
    })

    for (const p of later) {
      laterAll.push({ pago: p, venta, anulado })
    }
  }

  for (const grupo of groupLaterPagos(laterAll)) {
    const first = grupo[0]
    const pagos = grupo.map((g) => g.pago)
    const monto = pagos.reduce((s, p) => s + (parseFloat(p.monto_pagado) || 0), 0)
    const unico = pagos.length === 1
    raw.push({
      id: `pago-${pagos.map((p) => p.id).join('-')}`,
      tipo: 'cobro',
      fecha: first.pago.fecha_pago || first.venta.fecha_hora,
      ventaId: first.venta.id,
      pagoId: first.pago.id,
      cargo: 0,
      pago: monto,
      resto: 0,
      anulado: first.anulado,
      numeroVenta: formatNumeroVenta(first.venta),
      numeroRecibo: unico ? formatNumeroRecibo(first.pago) : null,
      numeroTicket: first.venta.numero_ticket || '',
      facturacion: first.venta.facturacion || '',
      detalle: detallePagoSaldo(pagos),
      metodo: first.pago.metodo_pago || '',
      observaciones: first.pago.observaciones || '',
    })
  }

  raw.sort((a, b) => {
    const d = ts(a.fecha) - ts(b.fecha)
    if (d !== 0) return d
    if (a.tipo !== b.tipo) return a.tipo === 'venta' ? -1 : 1
    return String(a.id).localeCompare(String(b.id))
  })

  let saldo = 0
  return raw.map((m) => {
    if (!m.anulado) {
      saldo += (Number(m.cargo) || 0) - (Number(m.pago) || 0)
    }
    return { ...m, saldo }
  })
}

export function getSaldoActual(movimientos) {
  if (!movimientos?.length) return 0
  for (let i = movimientos.length - 1; i >= 0; i -= 1) {
    if (movimientos[i].esSaldoAnterior) continue
    if (!movimientos[i].anulado) return Number(movimientos[i].saldo) || 0
  }
  return 0
}

export function ymdInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  return {
    year: Number(parts.find((p) => p.type === 'year')?.value),
    month: Number(parts.find((p) => p.type === 'month')?.value),
    day: Number(parts.find((p) => p.type === 'day')?.value),
  }
}

export function yearMonthKey(ym) {
  return `${ym.year}-${String(ym.month).padStart(2, '0')}`
}

export function parseYearMonthKey(key) {
  const [year, month] = String(key || '').split('-').map(Number)
  if (!year || !month) return null
  return { year, month }
}

export function addMonths(ym, delta) {
  const d = new Date(ym.year, ym.month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function currentYearMonth(timeZone, now = new Date()) {
  const ymd = ymdInTimeZone(now, timeZone)
  return { year: ymd.year, month: ymd.month }
}

export function formatMonthLabel(ym) {
  const dt = new Date(ym.year, ym.month - 1, 1)
  const label = dt.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function movimientoYearMonth(movimiento, timeZone) {
  if (!movimiento?.fecha) return null
  const d = new Date(movimiento.fecha)
  if (Number.isNaN(d.getTime())) return null
  const ymd = ymdInTimeZone(d, timeZone)
  return { year: ymd.year, month: ymd.month }
}

export function listarMesesDisponibles(movimientos, timeZone, now = new Date()) {
  const current = currentYearMonth(timeZone, now)
  let min = addMonths(current, -11)
  for (const m of movimientos || []) {
    const ym = movimientoYearMonth(m, timeZone)
    if (!ym) continue
    if (ym.year < min.year || (ym.year === min.year && ym.month < min.month)) min = ym
  }
  const out = []
  let cursor = min
  while (cursor.year < current.year || (cursor.year === current.year && cursor.month <= current.month)) {
    out.push({
      ...cursor,
      key: yearMonthKey(cursor),
      label: formatMonthLabel(cursor),
      esActual: cursor.year === current.year && cursor.month === current.month,
    })
    cursor = addMonths(cursor, 1)
  }
  return out
}

export function movimientoCoincideBusqueda(movimiento, termino) {
  const q = String(termino || '').trim().toLowerCase()
  if (!q) return true
  const haystack = [
    movimiento?.detalle,
    movimiento?.numeroVenta,
    movimiento?.numeroRecibo,
    movimiento?.numeroTicket,
    movimiento?.facturacion,
    movimiento?.observaciones,
    movimiento?.metodo,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

export function saldoAnteriorAlMes(movimientos, ym, timeZone) {
  const key = yearMonthKey(ym)
  let last = 0
  let found = false
  for (const m of movimientos || []) {
    if (m.esSaldoAnterior || m.anulado) continue
    const mym = movimientoYearMonth(m, timeZone)
    if (!mym) continue
    if (yearMonthKey(mym) >= key) break
    last = Number(m.saldo) || 0
    found = true
  }
  return found ? last : 0
}

function crearFilaSaldoAnterior(ym, saldo) {
  const prev = addMonths(ym, -1)
  return {
    id: `saldo-anterior-${yearMonthKey(ym)}`,
    tipo: 'saldo_anterior',
    esSaldoAnterior: true,
    fecha: null,
    fechaLabel: formatMonthLabel(prev),
    ventaId: null,
    pagoId: null,
    cargo: 0,
    pago: 0,
    resto: 0,
    anulado: false,
    numeroVenta: null,
    numeroRecibo: null,
    detalle: 'Saldo pendiente mes anterior',
    metodo: null,
    observaciones: '',
    saldo,
  }
}

/**
 * Recorte mensual: primera fila = saldo arrastrado del mes anterior,
 * después los movimientos del mes elegido (con saldo acumulado real).
 */
export function armarFilasMes(movimientos, ym, { tipo = 'todos', busqueda = '', timeZone } = {}) {
  const opening = saldoAnteriorAlMes(movimientos, ym, timeZone)
  const key = yearMonthKey(ym)
  const delMes = (movimientos || []).filter((m) => {
    if (m.esSaldoAnterior) return false
    const mym = movimientoYearMonth(m, timeZone)
    if (!mym || yearMonthKey(mym) !== key) return false
    if (tipo === 'ventas' && m.tipo !== 'venta') return false
    if (tipo === 'cobros' && m.tipo !== 'cobro') return false
    if (!movimientoCoincideBusqueda(m, busqueda)) return false
    return true
  })
  return [crearFilaSaldoAnterior(ym, opening), ...delMes]
}

export function calcularTotalesCuentaCorriente(filas) {
  let totalVendido = 0
  let totalCobrado = 0
  for (const m of filas || []) {
    if (m.esSaldoAnterior || m.anulado) continue
    totalVendido += Number(m.cargo) || 0
    totalCobrado += Number(m.pago) || 0
  }
  const last = (filas || [])[(filas || []).length - 1]
  return {
    totalCredito: totalVendido,
    totalCobrado,
    saldoPendiente: last ? Number(last.saldo) || 0 : 0,
  }
}

export function getPeriodoLabel(ym) {
  if (!ym) return 'Período'
  return formatMonthLabel(ym)
}
