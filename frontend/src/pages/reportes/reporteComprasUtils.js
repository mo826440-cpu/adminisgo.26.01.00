// Agregación de compras por mes (fecha_orden en calendario local)

import {
  mesCorto,
  formatMoneyAR,
  maxBarScale,
} from './reporteVentasUtils'

export { mesCorto, formatMoneyAR, maxBarScale }
export { mesTituloPie } from './reporteVentasUtils'

/** fecha_orden: 'YYYY-MM-DD' o ISO */
function parseFechaOrdenMes(fechaOrden) {
  if (!fechaOrden) return null
  const s = String(fechaOrden).trim().split('T')[0]
  const parts = s.split('-')
  if (parts.length < 2) return null
  const year = parseInt(parts[0], 10)
  const monthIndex = parseInt(parts[1], 10) - 1
  if (Number.isNaN(year) || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null
  }
  return { year, monthIndex }
}

function montoPagadoCompra(compra) {
  let pagado = parseFloat(compra.monto_pagado || 0)
  if (!pagado && Array.isArray(compra.compra_pagos) && compra.compra_pagos.length > 0) {
    pagado = compra.compra_pagos.reduce(
      (s, p) => s + (parseFloat(p.monto_pagado || 0) || 0),
      0
    )
  }
  return pagado
}

/**
 * @param {Array} compras - filas de getComprasPorRangoFechas
 */
export function aggregateComprasByMonth(compras) {
  const byMonth = new Map()

  for (const c of compras || []) {
    const parsed = parseFechaOrdenMes(c.fecha_orden)
    if (!parsed) continue
    const { year, monthIndex } = parsed
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
        numCompras: 0,
        comprasPagadas: 0,
        comprasConDeuda: 0,
      })
    }

    const bucket = byMonth.get(key)
    const total = parseFloat(c.total || 0) || 0
    const pagado = montoPagadoCompra(c)
    const deuda = Math.max(0, total - pagado)

    bucket.totalMonto += total
    bucket.montoPagado += pagado
    bucket.montoDeuda += deuda
    bucket.numCompras += 1
    if (deuda <= 0.01) bucket.comprasPagadas += 1
    else bucket.comprasConDeuda += 1
  }

  return Array.from(byMonth.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.monthIndex - b.monthIndex
  })
}

export function mergeComprasAggregatedWithAllMonthsInRange(desde, hasta, aggregatedRows) {
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
        numCompras: 0,
        comprasPagadas: 0,
        comprasConDeuda: 0,
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

export function totalesGeneralesCompras(rows) {
  return rows.reduce(
    (acc, r) => ({
      totalMonto: acc.totalMonto + r.totalMonto,
      montoPagado: acc.montoPagado + r.montoPagado,
      montoDeuda: acc.montoDeuda + r.montoDeuda,
      numCompras: acc.numCompras + r.numCompras,
      comprasPagadas: acc.comprasPagadas + r.comprasPagadas,
      comprasConDeuda: acc.comprasConDeuda + r.comprasConDeuda,
    }),
    {
      totalMonto: 0,
      montoPagado: 0,
      montoDeuda: 0,
      numCompras: 0,
      comprasPagadas: 0,
      comprasConDeuda: 0,
    }
  )
}
