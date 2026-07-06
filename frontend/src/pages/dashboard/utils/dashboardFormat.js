export function formatMoney(val) {
  const num = Number(val || 0)
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatNumber(val, decimals = 0) {
  const num = Number(val || 0)
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPctChange(current, previous) {
  const c = Number(current) || 0
  const p = Number(previous) || 0
  if (p === 0) return c > 0 ? 100 : 0
  return ((c - p) / p) * 100
}

export function formatDateAR(isoOrDate) {
  if (!isoOrDate) return '—'
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function getDefaultDateRange(days = 6) {
  const hoy = new Date()
  const desde = new Date(hoy)
  desde.setDate(desde.getDate() - days)
  return {
    fechaDesde: desde.toISOString().slice(0, 10),
    fechaHasta: hoy.toISOString().slice(0, 10),
  }
}

/** Resuelve fechas del filtro (compatibilidad con claves legacy desde/hasta). */
export function resolveFilterDates(filters) {
  const fechaDesde = filters?.fechaDesde || filters?.desde || ''
  const fechaHasta = filters?.fechaHasta || filters?.hasta || ''
  return { fechaDesde, fechaHasta }
}

export function getPreviousPeriod(desdeStr, hastaStr) {
  const desde = new Date(desdeStr)
  const hasta = new Date(hastaStr)
  desde.setHours(0, 0, 0, 0)
  hasta.setHours(23, 59, 59, 999)
  const ms = hasta.getTime() - desde.getTime() + 1
  const prevHasta = new Date(desde.getTime() - 1)
  const prevDesde = new Date(prevHasta.getTime() - ms + 1)
  return {
    desde: prevDesde.toISOString().slice(0, 10),
    hasta: prevHasta.toISOString().slice(0, 10),
  }
}
