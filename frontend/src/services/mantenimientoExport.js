import { supabase } from './supabase'

const PAGE_SIZE = 1000

const DATE_FILTERS = {
  compras: { type: 'date', column: 'fecha_orden' },
  compra_pagos: { type: 'timestamp', column: 'fecha_pago' },
  formas_pago: { type: 'timestamp', column: 'created_at' },
  historial_cajas: { type: 'timestamp', column: 'fecha_hora' },
  otros_costos: { type: 'timestamp', column: 'created_at' },
  venta_pagos: { type: 'timestamp', column: 'fecha_pago' },
  ventas: { type: 'timestamp', column: 'fecha_hora' },
  compra_items: {
    type: 'relation-date',
    relation: 'compras',
    column: 'fecha_orden',
  },
  venta_items: {
    type: 'relation-timestamp',
    relation: 'ventas',
    column: 'fecha_hora',
  },
}

function localDayBounds(fechaDesde, fechaHasta) {
  const start = new Date(`${fechaDesde}T00:00:00`)
  const end = new Date(`${fechaHasta}T23:59:59.999`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('El rango de fechas no es válido.')
  }
  return { start: start.toISOString(), end: end.toISOString() }
}

function applyDateFilter(query, config, fechaDesde, fechaHasta) {
  if (!config) return query
  const relationPrefix = config.relation ? `${config.relation}.` : ''
  const field = `${relationPrefix}${config.column}`

  if (config.type === 'date' || config.type === 'relation-date') {
    return query.gte(field, fechaDesde).lte(field, fechaHasta)
  }

  const { start, end } = localDayBounds(fechaDesde, fechaHasta)
  return query.gte(field, start).lte(field, end)
}

async function fetchAllPages({ tableName, columns, allColumns, fechaDesde, fechaHasta }) {
  const config = DATE_FILTERS[tableName]
  const relationSelection = config?.relation
    ? `,${config.relation}!inner(${config.column})`
    : ''
  const selectClause = `${columns.join(',')}${relationSelection}`
  const hasId = allColumns.some((column) => column === 'id')
  const rows = []

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from(tableName)
      .select(selectClause)
      .range(from, from + PAGE_SIZE - 1)

    if (hasId) query = query.order('id', { ascending: true })
    query = applyDateFilter(query, config, fechaDesde, fechaHasta)

    const { data, error } = await query
    if (error) {
      throw new Error(`No se pudo exportar “${tableName}”: ${error.message}`)
    }

    const page = (data || []).map((row) => {
      if (!config?.relation) return row
      const clean = { ...row }
      delete clean[config.relation]
      return clean
    })
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  return rows
}

/**
 * Lee mediante Supabase/RLS todas las filas requeridas para el Excel.
 * Las columnas provienen del catálogo del schema, no de entrada libre.
 */
export async function getDatosSeleccionadosParaExcel({
  selections,
  fechaDesde,
  fechaHasta,
}) {
  const result = []

  for (const selection of selections) {
    const rows = await fetchAllPages({
      tableName: selection.tableName,
      columns: selection.columns,
      allColumns: selection.allColumns,
      fechaDesde,
      fechaHasta,
    })
    result.push({ ...selection, rows })
  }

  return result
}

export const TABLAS_CON_FILTRO_FECHA = new Set(Object.keys(DATE_FILTERS))
