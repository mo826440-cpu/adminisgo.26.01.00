// Consulta liviana para tablas de registros (Ventas y Ventas rápidas): últimos N + filtro único.
import { supabase } from './supabase'
import { VENTA_ESTADO_CANCELADA, getVentaEstadoDisplay, getVentaEstadoLabel } from '../utils/ventaEstado'
import { hydrateVentasRowsWithClienteUsuarioNombre } from './ventas'

export const VENTAS_REGISTROS_LIMIT = 100
export const VENTAS_REGISTROS_PAGE_SIZE = VENTAS_REGISTROS_LIMIT

export const VENTAS_REGISTROS_FILTRO_TIPOS = ['fecha', 'cliente', 'metodo_pago', 'estado']

const VENTAS_REGISTROS_SELECT = `
  id,
  fecha_hora,
  facturacion,
  subtotal,
  descuento,
  impuestos,
  total,
  metodo_pago,
  monto_pagado,
  monto_deuda,
  estado,
  observaciones,
  numero_ticket,
  cliente_id,
  usuario_id,
  comercio_id,
  created_at,
  updated_at
`

/** Separa rango de fechas codificado como `desde|hasta` (YYYY-MM-DD). */
export function parseFiltroFechaRango(valor) {
  const raw = String(valor || '').trim()
  if (!raw) return { desde: '', hasta: '' }
  const [desde, hasta] = raw.split('|')
  return { desde: desde || '', hasta: hasta || desde || '' }
}

/** Codifica rango de fechas para el filtro activo. */
export function encodeFiltroFechaRango(desde, hasta) {
  const d = String(desde || '').trim()
  const h = String(hasta || '').trim()
  if (!d || !h) return ''
  return `${d}|${h}`
}

function ymdToDayBounds(ymd, endOfDay = false) {
  const [y, m, d] = String(ymd).split('-').map(Number)
  if (!y || !m || !d) return null
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0)
}

function formatMetodoPagoLabel(codigo) {
  const s = String(codigo || '').trim()
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Opciones de filtro a partir de los registros ya cargados en pantalla.
 * @param {Array} ventas
 * @param {{ modo?: 'ventas' | 'rapidas' }} [opts]
 */
export function extraerOpcionesFiltroRegistros(ventas, opts = {}) {
  const modo = opts.modo === 'rapidas' ? 'rapidas' : 'ventas'
  const clientesMap = new Map()
  const metodosMap = new Map()
  const estadosMap = new Map()

  for (const v of ventas || []) {
    const cid = v.cliente_id
    const nombre = v.clientes?.nombre?.trim() || 'Cliente genérico'
    const clienteKey = cid != null ? String(cid) : '__generico__'
    if (!clientesMap.has(clienteKey)) {
      clientesMap.set(clienteKey, nombre)
    }

    const mp = String(v.metodo_pago || '').trim()
    if (mp && !metodosMap.has(mp)) {
      metodosMap.set(mp, formatMetodoPagoLabel(mp))
    }

    let estadoVal
    let estadoLabel
    if (modo === 'rapidas' && v.estado) {
      if (v.estado === 'DEBE') {
        estadoVal = 'pendiente'
        estadoLabel = 'Pendiente'
      } else if (v.estado === 'PAGADO') {
        estadoVal = 'pagado'
        estadoLabel = 'Pagado'
      } else {
        estadoVal = String(v.estado).toLowerCase()
        estadoLabel = v.estado
      }
    } else {
      estadoVal = getVentaEstadoDisplay(v)
      estadoLabel = getVentaEstadoLabel(estadoVal)
    }
    if (estadoVal && !estadosMap.has(estadoVal)) {
      estadosMap.set(estadoVal, estadoLabel)
    }
  }

  const sortLabel = (a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })

  return {
    clientes: Array.from(clientesMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort(sortLabel),
    metodosPago: Array.from(metodosMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort(sortLabel),
    estados: Array.from(estadosMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort(sortLabel),
  }
}

function applyFiltroToQuery(q, filtroTipo, filtroValor) {
  const tipo = String(filtroTipo || '').trim()
  const valor = String(filtroValor ?? '').trim()
  if (!tipo || !valor) return q

  switch (tipo) {
    case 'fecha': {
      const { desde, hasta } = parseFiltroFechaRango(valor)
      const inicio = ymdToDayBounds(desde, false)
      const fin = ymdToDayBounds(hasta, true)
      if (!inicio || !fin) return q
      return q.gte('fecha_hora', inicio.toISOString()).lte('fecha_hora', fin.toISOString())
    }
    case 'cliente': {
      if (valor === '__generico__') {
        return q.is('cliente_id', null)
      }
      const id = Number(valor)
      if (Number.isFinite(id) && id > 0) {
        return q.eq('cliente_id', id)
      }
      return q
    }
    case 'metodo_pago':
      return q.ilike('metodo_pago', `%${valor}%`)
    case 'estado': {
      const v = valor.toLowerCase()
      if (v === 'cancelado' || v === 'cancelada') {
        return q.eq('estado', VENTA_ESTADO_CANCELADA)
      }
      if (v === 'pagado') {
        return q.lte('monto_deuda', 0.009).neq('estado', VENTA_ESTADO_CANCELADA)
      }
      if (v === 'pendiente' || v === 'debe') {
        return q.gt('monto_deuda', 0.009).neq('estado', VENTA_ESTADO_CANCELADA)
      }
      return q
    }
    default:
      return q
  }
}

function buildVentasRegistrosQuery(filtroTipo, filtroValor) {
  let q = supabase
    .from('ventas')
    .select(VENTAS_REGISTROS_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('fecha_hora', { ascending: false })

  return applyFiltroToQuery(q, filtroTipo, filtroValor)
}

/**
 * @param {{
 *   page?: number,
 *   pageSize?: number,
 *   limit?: number,
 *   filtroTipo?: '' | 'fecha' | 'cliente' | 'metodo_pago' | 'estado',
 *   filtroValor?: string
 * }} [opts]
 */
export async function fetchVentasRegistros(opts = {}) {
  const pageSize = opts.pageSize ?? opts.limit ?? VENTAS_REGISTROS_PAGE_SIZE
  const page = Math.max(1, Number(opts.page) || 1)
  const filtroTipo = opts.filtroTipo ?? ''
  const filtroValor = opts.filtroValor ?? ''

  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await buildVentasRegistrosQuery(filtroTipo, filtroValor).range(
      from,
      to,
    )
    if (error) throw error

    const hydrated = await hydrateVentasRowsWithClienteUsuarioNombre(data || [])
    return { data: hydrated, total: count ?? 0, error: null }
  } catch (error) {
    console.error('Error al obtener registros de ventas:', error)
    return { data: null, total: 0, error }
  }
}
