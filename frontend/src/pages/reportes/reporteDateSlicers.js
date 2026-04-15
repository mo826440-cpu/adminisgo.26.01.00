/**
 * Filtro tipo “slicer” por año / mes / día (cruce AND entre dimensiones).
 * - years: obligatorio (≥1). Solo fechas cuyo año esté en la lista.
 * - months: [] = todos los meses (1–12).
 * - days: [] = todos los días válidos del mes.
 */

const MESES_NOMBRE = [
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

function sortNumUnique(arr) {
  return [...new Set((arr || []).filter((n) => Number.isFinite(n) && Number.isInteger(n)))].sort((a, b) => a - b)
}

/** Últimos 3 meses calendario incluyendo el mes actual (p. ej. feb–mar–abr si hoy es abr). */
export function getDefaultSlicerArrays() {
  const now = new Date()
  const curY = now.getFullYear()
  const curM = now.getMonth() + 1
  const months = []
  const years = new Set()
  for (let i = 0; i < 3; i++) {
    let m = curM - i
    let y = curY
    while (m <= 0) {
      m += 12
      y -= 1
    }
    months.push(m)
    years.add(y)
  }
  return {
    years: sortNumUnique([...years]),
    months: sortNumUnique(months),
    days: [],
  }
}

export function slicerArraysToState(s) {
  return {
    years: sortNumUnique(s.years),
    months: sortNumUnique(s.months),
    days: sortNumUnique(s.days),
  }
}

/** Días válidos en el mes (1..28–31). */
export function daysInCalendarMonth(year, month1to12) {
  return new Date(year, month1to12, 0).getDate()
}

/**
 * Conjunto de claves locales YYYY-MM-DD para filtrado O(1).
 * @param {{ years: number[], months: number[], days: number[] }} slicer
 */
export function buildSlicerDateKeySet(slicer) {
  const yList = sortNumUnique(slicer.years)
  const mList = slicer.months.length ? sortNumUnique(slicer.months) : Array.from({ length: 12 }, (_, i) => i + 1)
  const hasDayPick = slicer.days.length > 0
  const pickedDays = hasDayPick ? new Set(sortNumUnique(slicer.days)) : null
  const set = new Set()

  for (const y of yList) {
    for (const m of mList) {
      if (m < 1 || m > 12) continue
      const dim = daysInCalendarMonth(y, m)
      if (hasDayPick) {
        for (const d of pickedDays) {
          if (d >= 1 && d <= dim) {
            set.add(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
          }
        }
      } else {
        for (let d = 1; d <= dim; d++) {
          set.add(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
        }
      }
    }
  }
  return set
}

/**
 * Rango mínimo/máximo para consultar el backend (bounding box del conjunto de fechas).
 * @returns {{ desde: Date, hasta: Date } | null}
 */
export function getSlicerBoundingDates(slicer) {
  const keys = [...buildSlicerDateKeySet(slicer)].sort()
  if (keys.length === 0) return null
  const [ya, ma, da] = keys[0].split('-').map(Number)
  const [yb, mb, db] = keys[keys.length - 1].split('-').map(Number)
  return {
    desde: new Date(ya, ma - 1, da),
    hasta: new Date(yb, mb - 1, db),
  }
}

function localDateKeyFromDate(d) {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** @param {Array} ventas - filas con fecha_hora */
export function filterVentasBySlicerDateKeys(ventas, keySet) {
  const out = []
  for (const v of ventas || []) {
    if (!v.fecha_hora) continue
    const d = new Date(v.fecha_hora)
    if (Number.isNaN(d.getTime())) continue
    if (keySet.has(localDateKeyFromDate(d))) out.push(v)
  }
  return out
}

/** @param {Array} compras - filas con fecha_orden YYYY-MM-DD o ISO */
export function filterComprasBySlicerDateKeys(compras, keySet) {
  const out = []
  for (const c of compras || []) {
    const raw = c.fecha_orden
    if (raw == null) continue
    const s = String(raw).trim().split('T')[0]
    const parts = s.split('-')
    if (parts.length < 3) continue
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) continue
    const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (keySet.has(key)) out.push(c)
  }
  return out
}

/**
 * Meses calendario a mostrar en tablas (filas en cero si no hubo movimientos),
 * respetando el cruce año × mes y la existencia de al menos un día válido si hay filtro de día.
 * @returns {Array<{ year: number, monthIndex: number }>}
 */
export function enumerateMonthBuckets(slicer) {
  const yList = sortNumUnique(slicer.years)
  const mList = slicer.months.length ? sortNumUnique(slicer.months) : Array.from({ length: 12 }, (_, i) => i + 1)
  const hasDayPick = slicer.days.length > 0
  const pickedDays = hasDayPick ? new Set(sortNumUnique(slicer.days)) : null
  const out = []

  for (const y of yList) {
    for (const m of mList) {
      if (m < 1 || m > 12) continue
      const dim = daysInCalendarMonth(y, m)
      if (hasDayPick) {
        let ok = false
        for (const d of pickedDays) {
          if (d >= 1 && d <= dim) {
            ok = true
            break
          }
        }
        if (!ok) continue
      }
      out.push({ year: y, monthIndex: m - 1 })
    }
  }
  return out
}

export function formatIsoDateLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Texto para PDF / ticket: rango ISO del bounding box + criterio de segmentos. */
export function formatSlicerExportLines(slicer) {
  const bounds = getSlicerBoundingDates(slicer)
  const desdeStr = bounds ? formatIsoDateLocal(bounds.desde) : '—'
  const hastaStr = bounds ? formatIsoDateLocal(bounds.hasta) : '—'
  const yPart = sortNumUnique(slicer.years).join(', ')
  const mPart = slicer.months.length
    ? sortNumUnique(slicer.months)
        .map((n) => MESES_NOMBRE[n - 1] || n)
        .join(', ')
    : 'todos'
  const dPart = slicer.days.length ? sortNumUnique(slicer.days).join(', ') : 'todos'
  const criterio = `Segmentos: años (${yPart}) · meses (${mPart}) · días (${dPart})`
  return { desdeStr, hastaStr, criterio }
}
