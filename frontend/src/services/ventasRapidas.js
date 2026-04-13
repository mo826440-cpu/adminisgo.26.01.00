// Servicio de ventas rápidas: solo usa tablas ventas, venta_items, venta_pagos (sin ventas_rapidas).
import { supabase } from './supabase'
import { createVenta, deleteVenta, getVentaById } from './ventas'

const PAGE = 1000

function mapVentaListadoShape(v) {
  const deuda = parseFloat(v.monto_deuda) || 0
  const estado = deuda > 0.009 ? 'DEBE' : 'PAGADO'
  return {
    id: v.id,
    fecha_hora: v.fecha_hora,
    total: v.total,
    metodo_pago: v.metodo_pago,
    monto_pagado: v.monto_pagado,
    estado,
    observaciones: v.observaciones,
    clientes: v.clientes,
    usuarios: v.usuarios,
    ventas: { id: v.id, numero_ticket: v.numero_ticket },
  }
}

/**
 * Ventas del comercio en rango de fechas (misma pantalla “registros”; incluye POS y rápidas).
 */
export const getVentasRapidas = async (fechaDesde = null, fechaHasta = null) => {
  try {
    const all = []
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
          clientes:cliente_id(id, nombre),
          usuarios:usuario_id(id, nombre)
        `)
        .is('deleted_at', null)
        .order('fecha_hora', { ascending: false })

      if (fechaDesde) q = q.gte('fecha_hora', fechaDesde)
      if (fechaHasta) q = q.lte('fecha_hora', fechaHasta)

      const { data, error } = await q.range(from, from + PAGE - 1)
      if (error) throw error
      const chunk = data || []
      all.push(...chunk.map(mapVentaListadoShape))
      if (chunk.length < PAGE) break
      from += PAGE
    }

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
      fecha_hora: data.fecha_hora,
      total: data.total,
      metodo_pago: data.metodo_pago,
      monto_pagado: data.monto_pagado,
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
    const montoPagado = parseFloat(ventaRapidaData.monto_pagado || total)

    const ventaData = {
      cliente_id: ventaRapidaData.cliente_id || null,
      fecha_hora: ventaRapidaData.fecha_hora || new Date().toISOString(),
      facturacion: null,
      subtotal: total,
      descuento: 0,
      impuestos: 0,
      total: total,
      metodo_pago: ventaRapidaData.metodo_pago || 'efectivo',
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
      pagos:
        montoPagado > 0
          ? [
              {
                metodo_pago: ventaRapidaData.metodo_pago || 'efectivo',
                monto_pagado: montoPagado,
                fecha_pago: ventaRapidaData.fecha_hora || new Date().toISOString(),
                observaciones: null,
              },
            ]
          : [],
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
 * Eliminar venta por id de ventas (soft delete + stock como deleteVenta).
 */
export const deleteVentaRapida = async (ventaId) => {
  return deleteVenta(ventaId)
}
