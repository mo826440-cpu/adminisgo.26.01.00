// Consulta liviana para tablas de registros (Ventas y Ventas rápidas): últimos N + filtro único.
import { supabase } from './supabase'
import {
  VENTA_ESTADO_CANCELADA,
  getVentaEstadoDisplay,
  getVentaEstadoDisplayRegistro,
  getVentaEstadoLabelTabla,
} from '../utils/ventaEstado'
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
    if (modo === 'rapidas') {
      estadoVal = getVentaEstadoDisplayRegistro(v, { modo: 'rapidas' })
      estadoLabel = getVentaEstadoLabelTabla(estadoVal)
    } else {
      estadoVal = getVentaEstadoDisplay(v)
      estadoLabel = getVentaEstadoLabelTabla(estadoVal)
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

/** Escapa caracteres especiales de filtros PostgREST / ilike. */
function escapeFiltroTexto(valor) {
  return String(valor || '')
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, ' ')
    .replace(/\./g, ' ')
    .trim()
}

/**
 * Aplica varios filtros a la vez (módulo Ventas Prueba y usos futuros).
 * @param {object} q
 * @param {{
 *   fechaDesde?: string,
 *   fechaHasta?: string,
 *   clienteId?: string,
 *   estado?: string,
 *   metodoPago?: string,
 *   busqueda?: string,
 *   clienteIdsBusqueda?: number[],
 * }} filtros
 */
function applyFiltrosCompuestos(q, filtros = {}) {
  let query = q
  const fechaDesde = String(filtros.fechaDesde || '').trim()
  const fechaHasta = String(filtros.fechaHasta || fechaDesde || '').trim()
  if (fechaDesde && fechaHasta) {
    const inicio = ymdToDayBounds(fechaDesde, false)
    const fin = ymdToDayBounds(fechaHasta, true)
    if (inicio && fin) {
      query = query.gte('fecha_hora', inicio.toISOString()).lte('fecha_hora', fin.toISOString())
    }
  }

  const clienteId = String(filtros.clienteId || '').trim()
  if (clienteId === '__generico__') {
    query = query.is('cliente_id', null)
  } else if (clienteId) {
    const id = Number(clienteId)
    if (Number.isFinite(id) && id > 0) {
      query = query.eq('cliente_id', id)
    }
  }

  const metodoPago = String(filtros.metodoPago || '').trim()
  if (metodoPago) {
    query = query.ilike('metodo_pago', `%${metodoPago}%`)
  }

  const estado = String(filtros.estado || '').trim().toLowerCase()
  if (estado === 'cancelado' || estado === 'cancelada') {
    query = query.eq('estado', VENTA_ESTADO_CANCELADA)
  } else if (estado === 'pagado') {
    query = query.lte('monto_deuda', 0.009).neq('estado', VENTA_ESTADO_CANCELADA)
  } else if (estado === 'pendiente' || estado === 'debe') {
    query = query.gt('monto_deuda', 0.009).neq('estado', VENTA_ESTADO_CANCELADA)
  }

  const busqueda = escapeFiltroTexto(filtros.busqueda)
  if (busqueda) {
    const parts = [`numero_ticket.ilike.%${busqueda}%`]
    if (/^\d+$/.test(busqueda)) {
      parts.push(`id.eq.${busqueda}`)
    }
    const ids = Array.isArray(filtros.clienteIdsBusqueda)
      ? filtros.clienteIdsBusqueda.filter((id) => Number.isFinite(Number(id)))
      : []
    if (ids.length > 0) {
      parts.push(`cliente_id.in.(${ids.join(',')})`)
    }
    const gen = busqueda.toLowerCase()
    if (gen.includes('generic') || gen.includes('genéric') || gen.includes('consumidor')) {
      parts.push('cliente_id.is.null')
    }
    query = query.or(parts.join(','))
  }

  return query
}

async function resolverClienteIdsPorBusqueda(busqueda) {
  const q = escapeFiltroTexto(busqueda)
  if (!q || q.length < 2) return []
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id')
      .ilike('nombre', `%${q}%`)
      .eq('activo', true)
      .limit(200)
    if (error) throw error
    return (data || []).map((c) => c.id).filter((id) => id != null)
  } catch (err) {
    console.error('Error al buscar clientes para filtro de ventas:', err)
    return []
  }
}

/**
 * @param {{
 *   page?: number,
 *   pageSize?: number,
 *   limit?: number,
 *   filtroTipo?: '' | 'fecha' | 'cliente' | 'metodo_pago' | 'estado',
 *   filtroValor?: string,
 *   filtros?: {
 *     fechaDesde?: string,
 *     fechaHasta?: string,
 *     clienteId?: string,
 *     estado?: string,
 *     metodoPago?: string,
 *     busqueda?: string,
 *   }
 * }} [opts]
 */
export async function fetchVentasRegistros(opts = {}) {
  const pageSize = opts.pageSize ?? opts.limit ?? VENTAS_REGISTROS_PAGE_SIZE
  const page = Math.max(1, Number(opts.page) || 1)
  const filtroTipo = opts.filtroTipo ?? ''
  const filtroValor = opts.filtroValor ?? ''
  const filtros = opts.filtros && typeof opts.filtros === 'object' ? opts.filtros : null

  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query
    if (filtros) {
      const busqueda = String(filtros.busqueda || '').trim()
      const clienteIdsBusqueda = busqueda ? await resolverClienteIdsPorBusqueda(busqueda) : []
      query = supabase
        .from('ventas')
        .select(VENTAS_REGISTROS_SELECT, { count: 'exact' })
        .is('deleted_at', null)
        .order('fecha_hora', { ascending: false })
      query = applyFiltrosCompuestos(query, { ...filtros, clienteIdsBusqueda })
    } else {
      query = buildVentasRegistrosQuery(filtroTipo, filtroValor)
    }

    const { data, error, count } = await query.range(from, to)
    if (error) throw error

    const hydrated = await hydrateVentasRowsWithClienteUsuarioNombre(data || [])
    return { data: hydrated, total: count ?? 0, error: null }
  } catch (error) {
    console.error('Error al obtener registros de ventas:', error)
    return { data: null, total: 0, error }
  }
}
