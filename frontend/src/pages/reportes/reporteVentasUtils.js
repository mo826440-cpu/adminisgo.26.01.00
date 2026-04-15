import { enumerateMonthBuckets } from './reporteDateSlicers'

// Agregación de ventas por mes para informes (fechas en hora local)

const MESES_CORTO = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

const MESES_LARGO = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export function mesCorto(year, monthIndex) {
  return MESES_CORTO[monthIndex] || ''
}

export function mesTituloPie(year, monthIndex) {
  return `${MESES_LARGO[monthIndex] || ''}-${year}`
}

function montoPagadoVenta(venta) {
  let pagado = parseFloat(venta.monto_pagado || 0)
  if (!pagado && Array.isArray(venta.venta_pagos) && venta.venta_pagos.length > 0) {
    pagado = venta.venta_pagos.reduce(
      (s, p) => s + (parseFloat(p.monto_pagado || 0) || 0),
      0
    )
  }
  return pagado
}

/**
 * @param {Array} ventas - filas de getVentasPorRangoFechas
 * @returns {Array<{ key: string, year: number, monthIndex: number, labelCorto: string, totalMonto: number, montoPagado: number, montoDeuda: number, numVentas: number, ventasCobradas: number, ventasConDeuda: number }>}
 */
export function aggregateVentasByMonth(ventas) {
  const byMonth = new Map()

  for (const v of ventas || []) {
    if (!v.fecha_hora) continue
    const d = new Date(v.fecha_hora)
    if (Number.isNaN(d.getTime())) continue

    const year = d.getFullYear()
    const monthIndex = d.getMonth()
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`

    if (!byMonth.has(key)) {
      byMonth.set(key, {
        key,
        year,
        monthIndex,
        labelCorto: mesCorto(year, monthIndex),
        totalMonto: 0,
        montoPagado: 0,
        montoDeuda: 0,
        numVentas: 0,
        ventasCobradas: 0,
        ventasConDeuda: 0,
      })
    }

    const bucket = byMonth.get(key)
    const total = parseFloat(v.total || 0) || 0
    const pagado = montoPagadoVenta(v)
    const deuda = Math.max(0, total - pagado)

    bucket.totalMonto += total
    bucket.montoPagado += pagado
    bucket.montoDeuda += deuda
    bucket.numVentas += 1
    if (deuda <= 0.01) bucket.ventasCobradas += 1
    else bucket.ventasConDeuda += 1
  }

  return Array.from(byMonth.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.monthIndex - b.monthIndex
  })
}

/**
 * Completa la serie con todos los meses calendario entre `desde` y `hasta` (inclusive),
 * con filas en cero si no hubo ventas en ese mes (así el filtro visual coincide con el rango).
 * @param {Date} desde
 * @param {Date} hasta
 * @param {ReturnType<typeof aggregateVentasByMonth>} aggregatedRows
 */
export function mergeAggregatedWithAllMonthsInRange(desde, hasta, aggregatedRows) {
  const startY = desde.getFullYear()
  const startM = desde.getMonth()
  const endY = hasta.getFullYear()
  const endM = hasta.getMonth()

  const byKey = new Map(aggregatedRows.map((r) => [r.key, r]))
  const out = []

  let y = startY
  let m = startM
  while (y < endY || (y === endY && m <= endM)) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}`
    if (byKey.has(key)) {
      out.push(byKey.get(key))
    } else {
      out.push({
        key,
        year: y,
        monthIndex: m,
        labelCorto: mesCorto(y, m),
        totalMonto: 0,
        montoPagado: 0,
        montoDeuda: 0,
        numVentas: 0,
        ventasCobradas: 0,
        ventasConDeuda: 0,
      })
    }
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }

  return out
}

/**
 * Igual que mergeAggregatedWithAllMonthsInRange pero solo para los meses incluidos en el slicer (puede ser no contiguo).
 * @param {{ years: number[], months: number[], days: number[] }} slicerArrays
 */
export function mergeAggregatedWithSlicer(aggregatedRows, slicerArrays) {
  const byKey = new Map(aggregatedRows.map((r) => [r.key, r]))
  const buckets = enumerateMonthBuckets(slicerArrays)
  return buckets.map(({ year, monthIndex }) => {
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    if (byKey.has(key)) return byKey.get(key)
    return {
      key,
      year,
      monthIndex,
      labelCorto: mesCorto(year, monthIndex),
      totalMonto: 0,
      montoPagado: 0,
      montoDeuda: 0,
      numVentas: 0,
      ventasCobradas: 0,
      ventasConDeuda: 0,
    }
  })
}

export function totalesGenerales(rows) {
  return rows.reduce(
    (acc, r) => ({
      totalMonto: acc.totalMonto + r.totalMonto,
      montoPagado: acc.montoPagado + r.montoPagado,
      montoDeuda: acc.montoDeuda + r.montoDeuda,
      numVentas: acc.numVentas + r.numVentas,
      ventasCobradas: acc.ventasCobradas + r.ventasCobradas,
      ventasConDeuda: acc.ventasConDeuda + r.ventasConDeuda,
    }),
    {
      totalMonto: 0,
      montoPagado: 0,
      montoDeuda: 0,
      numVentas: 0,
      ventasCobradas: 0,
      ventasConDeuda: 0,
    }
  )
}

export function formatMoneyAR(val) {
  const num = Number(val || 0)
  return `$${num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Escala para barras horizontales: máximo entre pagado y deuda en todos los meses */
export function maxBarScale(rows) {
  let m = 0
  for (const r of rows) {
    m = Math.max(m, r.montoPagado, r.montoDeuda)
  }
  return m > 0 ? m : 1
}
