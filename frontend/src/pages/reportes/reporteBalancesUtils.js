// Serie mensual: ventas vs compras y rentabilidad (ventas − compras)

/**
 * @param {Array<{ key: string, year: number, monthIndex: number, labelCorto: string, totalMonto: number }>} ventasCompletaMes resultado de mergeAggregatedWithAllMonthsInRange
 * @param {Array<{ key: string, year: number, monthIndex: number, labelCorto: string, totalMonto: number }>} comprasCompletaMes resultado de mergeComprasAggregatedWithAllMonthsInRange
 * @returns {Array<{ key: string, year: number, monthIndex: number, labelCorto: string, totalVentas: number, totalCompras: number, rentabilidad: number }>}
 */
export function mergeBalancesFromVentasYCompras(ventasCompletaMes, comprasCompletaMes) {
  const mapC = new Map((comprasCompletaMes || []).map((r) => [r.key, r]))
  return (ventasCompletaMes || []).map((rv) => {
    const rc = mapC.get(rv.key)
    const tv = parseFloat(rv.totalMonto || 0) || 0
    const tc = rc ? parseFloat(rc.totalMonto || 0) || 0 : 0
    return {
      key: rv.key,
      year: rv.year,
      monthIndex: rv.monthIndex,
      labelCorto: rv.labelCorto,
      totalVentas: tv,
      totalCompras: tc,
      rentabilidad: tv - tc,
    }
  })
}

export function totalesBalances(rows) {
  return (rows || []).reduce(
    (acc, r) => ({
      totalVentas: acc.totalVentas + r.totalVentas,
      totalCompras: acc.totalCompras + r.totalCompras,
      rentabilidad: acc.rentabilidad + r.rentabilidad,
    }),
    { totalVentas: 0, totalCompras: 0, rentabilidad: 0 }
  )
}

/** Escala barras ventas / compras */
export function maxBarVentasCompras(rows) {
  let m = 0
  for (const r of rows || []) {
    m = Math.max(m, r.totalVentas, r.totalCompras)
  }
  return m > 0 ? m : 1
}

/** Escala barra rentabilidad (valor absoluto) */
export function maxBarRentabilidadAbs(rows) {
  let m = 0
  for (const r of rows || []) {
    m = Math.max(m, Math.abs(r.rentabilidad || 0))
  }
  return m > 0 ? m : 1
}
