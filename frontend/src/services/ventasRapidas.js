// Servicio para gestión de ventas rápidas
import { supabase } from './supabase'
import { createVenta } from './ventas'

/**
 * Crear una venta rápida
 * Guarda en ventas_rapidas y también en ventas
 */
export const createVentaRapida = async (ventaRapidaData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const total = parseFloat(ventaRapidaData.total || 0)
    const montoPagado = parseFloat(ventaRapidaData.monto_pagado || total)
    const estado = montoPagado >= total ? 'PAGADO' : 'DEBE'

    // Primero crear la venta en la tabla ventas (sin items, solo datos básicos)
    const ventaData = {
      cliente_id: ventaRapidaData.cliente_id || null,
      fecha_hora: ventaRapidaData.fecha_hora || new Date().toISOString(),
      facturacion: null, // Por defecto nulo para ventas rápidas
      subtotal: total,
      descuento: 0,
      impuestos: 0,
      total: total,
      metodo_pago: ventaRapidaData.metodo_pago || 'efectivo',
      observaciones: ventaRapidaData.observaciones || null,
      // Crear pago si está pagado
      pagos: montoPagado > 0 ? [{
        metodo_pago: ventaRapidaData.metodo_pago || 'efectivo',
        monto_pagado: montoPagado,
        fecha_pago: ventaRapidaData.fecha_hora || new Date().toISOString(),
        observaciones: null
      }] : []
    }

    const { data: ventaCreada, error: errorVenta } = await createVenta(ventaData)

    if (errorVenta) {
      throw errorVenta
    }

    // Ahora crear el registro en ventas_rapidas
    const { data: ventaRapidaCreada, error: errorVentaRapida } = await supabase
      .from('ventas_rapidas')
      .insert([{
        usuario_id: user.id,
        cliente_id: ventaRapidaData.cliente_id || null,
        venta_id: ventaCreada.id,
        fecha_hora: ventaRapidaData.fecha_hora || new Date().toISOString(),
        total: total,
        metodo_pago: ventaRapidaData.metodo_pago || 'efectivo',
        monto_pagado: montoPagado,
        estado: estado,
        observaciones: ventaRapidaData.observaciones?.trim() || null
      }])
      .select()
      .single()

    if (errorVentaRapida) {
      // Si falla, intentar eliminar la venta creada
      if (ventaCreada?.id) {
        await supabase.from('ventas').delete().eq('id', ventaCreada.id)
      }
      throw errorVentaRapida
    }

    return { data: ventaRapidaCreada, error: null }
  } catch (error) {
    console.error('Error al crear venta rápida:', error)
    return { data: null, error }
  }
}

/**
 * Obtener todas las ventas rápidas
 */
export const getVentasRapidas = async (fechaDesde = null, fechaHasta = null) => {
  try {
    let query = supabase
      .from('ventas_rapidas')
      .select(`
        *,
        clientes:cliente_id(id, nombre),
        usuarios:usuario_id(id, nombre),
        ventas:venta_id(id, numero_ticket)
      `)
      .order('fecha_hora', { ascending: false })

    if (fechaDesde) {
      query = query.gte('fecha_hora', fechaDesde)
    }

    if (fechaHasta) {
      const fechaHastaCompleta = new Date(fechaHasta)
      fechaHastaCompleta.setHours(23, 59, 59, 999)
      query = query.lte('fecha_hora', fechaHastaCompleta.toISOString())
    }

    const { data, error } = await query

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener ventas rápidas:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una venta rápida por ID
 */
export const getVentaRapidaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('ventas_rapidas')
      .select(`
        *,
        clientes:cliente_id(id, nombre, email, telefono),
        usuarios:usuario_id(id, nombre),
        ventas:venta_id(
          id,
          numero_ticket,
          fecha_hora,
          total,
          monto_pagado,
          monto_deuda
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener venta rápida:', error)
    return { data: null, error }
  }
}

