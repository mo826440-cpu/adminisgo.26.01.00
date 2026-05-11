// Servicio de ventas rápidas: solo usa tablas ventas, venta_items, venta_pagos (sin ventas_rapidas).
import { supabase } from './supabase'
import {
  createVenta,
  deleteVenta,
  getVentaById,
  hydrateVentasRowsWithClienteUsuarioNombre,
  updateVenta,
} from './ventas'

const PAGE = 1000

function mapVentaListadoShape(v) {
  const pagado = parseFloat(v.monto_pagado) || 0
  const deuda = parseFloat(v.monto_deuda) || 0
  const estado = deuda > 0.009 ? 'DEBE' : 'PAGADO'
  return {
    id: v.id,
    fecha_hora: v.fecha_hora,
    total: v.total,
    metodo_pago: v.metodo_pago,
    monto_pagado: pagado,
    monto_pendiente: deuda,
    estado,
    observaciones: v.observaciones,
    clientes: v.clientes,
    usuarios: v.usuarios,
    ventas: { id: v.id, numero_ticket: v.numero_ticket },
  }
}

/**
 * Ventas del comercio en rango de fechas (misma pantalla “registros”; incluye POS y rápidas).
 *
 * Si `fechaDesde` y `fechaHasta` vienen ambos vacíos, se usa por defecto **últimos 3 meses**
 * (misma ventana razonable que el listado de ventas). Así no se paginan miles de filas
 * cuando la pantalla abre sin caja ni filtros manuales; si hace falta más historial, usar
 * filtros de fecha en la UI.
 */
export const getVentasRapidas = async (fechaDesde = null, fechaHasta = null) => {
  try {
    let desde = fechaDesde
    let hasta = fechaHasta
    // Sin rango explícito: acotar en servidor (evita listar todo el comercio).
    if (!desde && !hasta) {
      const ahora = new Date()
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - 3, ahora.getDate())
      const pad = (n) => String(n).padStart(2, '0')
      desde = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`
      hasta = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T23:59:59`
    }

    const rawChunks = []
    let from = 0
    for (;;) {
      let q = supabase
        .from('ventas')
        .select(`
          id,
          fecha_hora,
          total,
          metodo_pago,
          monto_pagado,
          monto_deuda,
          observaciones,
          numero_ticket,
          cliente_id,
          usuario_id
        `)
        .is('deleted_at', null)
        .order('fecha_hora', { ascending: false })

      if (desde) q = q.gte('fecha_hora', desde)
      if (hasta) q = q.lte('fecha_hora', hasta)

      const { data, error } = await q.range(from, from + PAGE - 1)
      if (error) throw error
      const chunk = data || []
      rawChunks.push(...chunk)
      if (chunk.length < PAGE) break
      from += PAGE
    }

    const hydrated = await hydrateVentasRowsWithClienteUsuarioNombre(rawChunks)
    const all = hydrated.map(mapVentaListadoShape)

    return { data: all, error: null }
  } catch (error) {
    console.error('Error al obtener ventas (listado ventas rápidas):', error)
    return { data: null, error }
  }
}

/**
 * Detalle por id de venta (ruta /ventas-rapidas/:id usa ventas.id).
 */
export const getVentaRapidaById = async (id) => {
  try {
    const { data, error } = await getVentaById(id)
    if (error) return { data: null, error }
    if (!data) return { data: null, error: new Error('Venta no encontrada') }

    const deuda = parseFloat(data.monto_deuda) || 0
    const estado = deuda > 0.009 ? 'DEBE' : 'PAGADO'

    const mapped = {
      id: data.id,
      cliente_id: data.cliente_id,
      fecha_hora: data.fecha_hora,
      total: data.total,
      metodo_pago: data.metodo_pago,
      monto_pagado: data.monto_pagado,
      monto_deuda: data.monto_deuda,
      subtotal: data.subtotal,
      facturacion: data.facturacion,
      numero_ticket: data.numero_ticket,
      items: data.items || [],
      pagos: data.pagos || [],
      estado,
      observaciones: data.observaciones,
      clientes: data.clientes,
      usuarios: data.usuarios,
      ventas: {
        id: data.id,
        numero_ticket: data.numero_ticket,
        fecha_hora: data.fecha_hora,
        total: data.total,
        monto_pagado: data.monto_pagado,
        monto_deuda: data.monto_deuda,
      },
    }

    return { data: mapped, error: null }
  } catch (error) {
    console.error('Error al obtener venta (detalle venta rápida):', error)
    return { data: null, error }
  }
}

/** Filas que impactan caja / venta_pagos: no «pendiente», monto > 0 */
function construirPagosDbVentaRapida(ventaRapidaData, total, fechaBase) {
  if (Array.isArray(ventaRapidaData.pagos)) {
    return ventaRapidaData.pagos
      .map((p) => ({
        metodo_pago: String(p.metodo_pago || '').trim(),
        monto_pagado: Math.min(total, Math.max(0, parseFloat(p.monto_pagado) || 0)),
        fecha_pago: p.fecha_pago || fechaBase,
        observaciones: p.observaciones ?? null,
      }))
      .filter((p) => p.metodo_pago && p.metodo_pago !== 'pendiente' && p.monto_pagado > 0)
  }
  const raw = ventaRapidaData.monto_pagado
  const explicitado = !(raw === undefined || raw === null || raw === '')
  const montoSingle = explicitado ? Math.min(total, Math.max(0, parseFloat(raw))) : total
  const method = String(ventaRapidaData.metodo_pago || 'efectivo').trim()
  if (montoSingle <= 0 || !method || method === 'pendiente') return []
  return [
    {
      metodo_pago: method,
      monto_pagado: montoSingle,
      fecha_pago: fechaBase,
      observaciones: null,
    },
  ]
}

/**
 * Crear venta rápida: solo ventas + ítems + pagos (sin ventas_rapidas).
 */
export const createVentaRapida = async (ventaRapidaData) => {
  try {
    const productoId = ventaRapidaData.producto_id
    if (!productoId) {
      throw new Error('Debés seleccionar el producto genérico de venta rápida (código de barras 1111111111).')
    }

    const total = parseFloat(ventaRapidaData.total || 0)
    const fechaBase = ventaRapidaData.fecha_hora || new Date().toISOString()

    const pagosDb = construirPagosDbVentaRapida(ventaRapidaData, total, fechaBase)
    const metodosUnicos = [...new Set(pagosDb.map((p) => p.metodo_pago))]
    const metodoResumen = metodosUnicos.length > 0 ? metodosUnicos.join(', ') : 'pendiente'

    const ventaData = {
      cliente_id: ventaRapidaData.cliente_id || null,
      fecha_hora: fechaBase,
      facturacion: null,
      subtotal: total,
      descuento: 0,
      impuestos: 0,
      total,
      metodo_pago: metodoResumen,
      observaciones: ventaRapidaData.observaciones || null,
      items: [
        {
          producto_id: productoId,
          cantidad: 1,
          precio_unitario: total,
          descuento: 0,
          subtotal: total,
        },
      ],
      pagos: pagosDb,
    }

    const { data: ventaCreada, error: errorVenta } = await createVenta(ventaData)
    if (errorVenta) throw errorVenta

    return { data: ventaCreada, error: null }
  } catch (error) {
    console.error('Error al crear venta rápida:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar venta rápida (mismo shape que create: un ítem genérico + pagos).
 */
export const updateVentaRapida = async (ventaId, ventaRapidaData) => {
  try {
    const productoId = ventaRapidaData.producto_id
    if (!productoId) {
      throw new Error('Debés seleccionar el producto genérico de venta rápida (código de barras 1111111111).')
    }

    const total = parseFloat(ventaRapidaData.total || 0)
    const fechaBase = ventaRapidaData.fecha_hora || new Date().toISOString()
    const pagosDb = construirPagosDbVentaRapida(ventaRapidaData, total, fechaBase)
    const metodosUnicos = [...new Set(pagosDb.map((p) => p.metodo_pago))]
    const metodoResumen = metodosUnicos.length > 0 ? metodosUnicos.join(', ') : 'pendiente'

    const ventaData = {
      cliente_id: ventaRapidaData.cliente_id || null,
      fecha_hora: fechaBase,
      facturacion: ventaRapidaData.facturacion ?? null,
      subtotal: total,
      descuento: 0,
      impuestos: 0,
      total,
      metodo_pago: metodoResumen,
      observaciones: ventaRapidaData.observaciones || null,
      items: [
        {
          producto_id: productoId,
          cantidad: 1,
          precio_unitario: total,
          descuento: 0,
          subtotal: total,
        },
      ],
      pagos: pagosDb,
    }

    return await updateVenta(ventaId, ventaData)
  } catch (error) {
    console.error('Error al actualizar venta rápida:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar venta por id de ventas (soft delete + stock como deleteVenta).
 */
export const deleteVentaRapida = async (ventaId) => {
  return deleteVenta(ventaId)
}
