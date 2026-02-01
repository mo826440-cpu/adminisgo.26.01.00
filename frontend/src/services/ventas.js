// Servicio para gestión de ventas
import { supabase } from './supabase'
import { validarLimiteVentas } from './planes'

/**
 * Crear una nueva venta
 * Esta función crea la venta y los items asociados en una transacción
 */
export const createVenta = async (ventaData) => {
  try {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Validar límite de ventas mensuales
    const { data: validacion, error: errorValidacion } = await validarLimiteVentas()
    if (errorValidacion) {
      throw new Error(`Error al validar límite: ${errorValidacion.message}`)
    }
    
    if (validacion && !validacion.puede_crear) {
      const error = new Error(validacion.mensaje || 'Has alcanzado el límite de ventas mensuales')
      error.tipo = validacion.tipo_error || 'limite_ventas'
      error.detalles = validacion
      throw error
    }

    // Generar número de ticket único (formato: TICKET-YYYYMMDD-HHMMSS-XXXX)
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const numeroTicket = `TICKET-${dateStr}-${timeStr}-${random}`

    const facturacion = ventaData.facturacion?.trim() || null
    const metodosPagoArr = Array.isArray(ventaData.pagos) ? ventaData.pagos : []
    const metodosUnicos = [...new Set(metodosPagoArr.map(p => String(p.metodo_pago || '').trim()).filter(Boolean))]

    // Preparar datos de la venta
    const venta = {
      numero_ticket: numeroTicket,
      cliente_id: ventaData.cliente_id || null,
      usuario_id: user.id,
      fecha_hora: ventaData.fecha_hora || undefined,
      facturacion,
      subtotal: ventaData.subtotal || 0,
      descuento: ventaData.descuento || 0,
      impuestos: ventaData.impuestos || 0,
      total: ventaData.total || 0,
      metodo_pago: metodosUnicos.length > 0 ? metodosUnicos.join(', ') : (ventaData.metodo_pago || 'efectivo'),
      estado: 'completada',
      observaciones: ventaData.observaciones || null
    }

    // Crear la venta
    const { data: ventaCreada, error: errorVenta } = await supabase
      .from('ventas')
      .insert([venta])
      .select()
      .single()

    if (errorVenta) {
      throw errorVenta
    }

    // Crear los items de la venta
    if (ventaData.items && ventaData.items.length > 0) {
      const items = ventaData.items.map(item => ({
        venta_id: ventaCreada.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento: item.descuento || 0,
        subtotal: item.subtotal
      }))

      const { error: errorItems } = await supabase
        .from('venta_items')
        .insert(items)

      if (errorItems) {
        // Si hay error al crear items, eliminar la venta creada
        await supabase.from('ventas').delete().eq('id', ventaCreada.id)
        throw errorItems
      }

      // Actualizar stock de productos
      for (const item of ventaData.items) {
        // Obtener stock actual del producto
        const { data: producto, error: errorProducto } = await supabase
          .from('productos')
          .select('stock_actual')
          .eq('id', item.producto_id)
          .single()

        if (errorProducto) {
          console.error('Error al obtener producto:', errorProducto)
          continue
        }

        const nuevoStock = (producto.stock_actual || 0) - item.cantidad

        // Actualizar stock
        const { error: errorStock } = await supabase
          .from('productos')
          .update({ stock_actual: nuevoStock < 0 ? 0 : nuevoStock })
          .eq('id', item.producto_id)

        if (errorStock) {
          console.error('Error al actualizar stock:', errorStock)
          // No lanzar error aquí para no romper la transacción, solo loguear
        }
      }
    }

    // Crear pagos (venta_pagos) si se envían
    if (metodosPagoArr.length > 0) {
      const pagosRows = metodosPagoArr.map(p => ({
        venta_id: ventaCreada.id,
        metodo_pago: String(p.metodo_pago || '').trim(),
        monto_pagado: parseFloat(p.monto_pagado || 0) || 0,
        fecha_pago: p.fecha_pago || new Date().toISOString(),
        observaciones: p.observaciones || null
      }))

      const { error: errorPagos } = await supabase
        .from('venta_pagos')
        .insert(pagosRows)

      if (errorPagos) {
        // Borrar venta: CASCADE borra items/pagos
        await supabase.from('ventas').delete().eq('id', ventaCreada.id)
        throw errorPagos
      }
    }

    return { data: ventaCreada, error: null }
  } catch (error) {
    console.error('Error al crear venta:', error)
    // Mensajes más claros para constraints comunes
    if (error?.code === '23505') {
      if (String(error.message || '').toLowerCase().includes('idx_ventas_comercio_facturacion_unique')) {
        return { data: null, error: new Error('La facturación ya está en uso. Por favor, usá un número diferente.') }
      }
      return { data: null, error: new Error('Ya existe un registro con datos duplicados. Revisá los campos únicos.') }
    }
    return { data: null, error }
  }
}

/**
 * Obtener todas las ventas con sus datos completos
 * Incluye cliente, unidades totales, y datos de pagos
 */
export const getVentas = async () => {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        clientes:cliente_id(nombre),
        usuarios:usuario_id(nombre),
        venta_items(cantidad)
      `)
      .is('deleted_at', null)
      .order('fecha_hora', { ascending: false })

    if (error) throw error

    // Calcular unidades totales para cada venta
    const ventasConUnidades = (data || []).map(venta => {
      const unidades = (venta.venta_items || []).reduce((sum, item) => sum + (parseFloat(item.cantidad) || 0), 0)
      return {
        ...venta,
        unidades_totales: unidades
      }
    })

    return { data: ventasConUnidades, error: null }
  } catch (error) {
    console.error('Error al obtener ventas:', error)
    return { data: null, error }
  }
}

/**
 * Resumen de ventas del día (cantidad y monto total) - para Dashboard
 * Usa fecha/hora local del navegador.
 */
export const getResumenVentasDelDia = async () => {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const { data, error } = await supabase
      .from('ventas')
      .select('id, total')
      .is('deleted_at', null)
      .gte('fecha_hora', startOfDay.toISOString())
      .lte('fecha_hora', endOfDay.toISOString())

    if (error) throw error
    const lista = data || []
    const cantidad = lista.length
    const total = lista.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
    return { data: { cantidad, total }, error: null }
  } catch (error) {
    console.error('Error al obtener resumen ventas del día:', error)
    return { data: null, error }
  }
}

/**
 * Ventas de los últimos N días (para gráfico por día) - id, total, fecha_hora y unidades por venta
 */
export const getVentasUltimosDias = async (dias = 7) => {
  try {
    const now = new Date()
    const desde = new Date(now)
    desde.setDate(desde.getDate() - dias)
    desde.setHours(0, 0, 0, 0)
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id,
        total,
        fecha_hora,
        venta_items(cantidad)
      `)
      .is('deleted_at', null)
      .gte('fecha_hora', desde.toISOString())
      .order('fecha_hora', { ascending: true })

    if (error) throw error

    const ventasConUnidades = (data || []).map(venta => {
      const unidades = (venta.venta_items || []).reduce((sum, item) => sum + (parseFloat(item.cantidad) || 0), 0)
      return { ...venta, unidades_totales: unidades }
    })

    return { data: ventasConUnidades, error: null }
  } catch (error) {
    console.error('Error al obtener ventas últimos días:', error)
    return { data: null, error }
  }
}

/**
 * Ventas en un rango de fechas (para gráfico) - con unidades por venta
 * desde/hasta: objetos Date (se usan inicio del día y fin del día)
 */
export const getVentasPorRangoFechas = async (desde, hasta) => {
  try {
    const inicio = new Date(desde)
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(hasta)
    fin.setHours(23, 59, 59, 999)
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id,
        total,
        monto_pagado,
        monto_deuda,
        fecha_hora,
        cliente_id,
        estado,
        venta_items(producto_id, cantidad),
        venta_pagos(metodo_pago)
      `)
      .is('deleted_at', null)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .order('fecha_hora', { ascending: true })

    if (error) throw error

    const ventasConUnidades = (data || []).map(venta => {
      const unidades = (venta.venta_items || []).reduce((sum, item) => sum + (parseFloat(item.cantidad) || 0), 0)
      return { ...venta, unidades_totales: unidades }
    })

    return { data: ventasConUnidades, error: null }
  } catch (error) {
    console.error('Error al obtener ventas por rango:', error)
    return { data: null, error }
  }
}

const updateStockByDelta = async (productoId, delta) => {
  const { data: producto, error: errorProducto } = await supabase
    .from('productos')
    .select('stock_actual')
    .eq('id', productoId)
    .single()

  if (errorProducto) {
    throw errorProducto
  }

  const nuevoStock = (producto.stock_actual || 0) + delta

  const { error: errorStock } = await supabase
    .from('productos')
    .update({ stock_actual: nuevoStock < 0 ? 0 : nuevoStock })
    .eq('id', productoId)

  if (errorStock) {
    throw errorStock
  }
}

/**
 * Actualizar una venta y sus items/pagos
 */
export const updateVenta = async (id, ventaData) => {
  try {
    const { data: ventaActual, error: errorVentaActual } = await supabase
      .from('ventas')
      .select('id')
      .eq('id', id)
      .single()

    if (errorVentaActual || !ventaActual) throw errorVentaActual || new Error('Venta no encontrada')

    const { data: itemsActuales, error: errorItemsActuales } = await supabase
      .from('venta_items')
      .select('producto_id, cantidad')
      .eq('venta_id', id)

    if (errorItemsActuales) throw errorItemsActuales

    const facturacion = ventaData.facturacion?.trim() || null
    const metodosPagoArr = Array.isArray(ventaData.pagos) ? ventaData.pagos : []
    const metodosUnicos = [...new Set(metodosPagoArr.map(p => String(p.metodo_pago || '').trim()).filter(Boolean))]

    const ventaUpdate = {
      cliente_id: ventaData.cliente_id || null,
      fecha_hora: ventaData.fecha_hora || undefined,
      facturacion,
      subtotal: ventaData.subtotal || 0,
      descuento: ventaData.descuento || 0,
      impuestos: ventaData.impuestos || 0,
      total: ventaData.total || 0,
      metodo_pago: metodosUnicos.length > 0 ? metodosUnicos.join(', ') : (ventaData.metodo_pago || 'efectivo'),
      observaciones: ventaData.observaciones || null,
      updated_at: new Date().toISOString()
    }

    const { error: errorUpdate } = await supabase
      .from('ventas')
      .update(ventaUpdate)
      .eq('id', id)

    if (errorUpdate) throw errorUpdate

    // Revertir stock previo
    if (itemsActuales && itemsActuales.length > 0) {
      for (const item of itemsActuales) {
        await updateStockByDelta(item.producto_id, parseFloat(item.cantidad || 0))
      }
    }

    // Reemplazar items
    const { error: errorDeleteItems } = await supabase
      .from('venta_items')
      .delete()
      .eq('venta_id', id)

    if (errorDeleteItems) throw errorDeleteItems

    if (ventaData.items && ventaData.items.length > 0) {
      const items = ventaData.items.map(item => ({
        venta_id: id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento: item.descuento || 0,
        subtotal: item.subtotal
      }))

      const { error: errorInsertItems } = await supabase
        .from('venta_items')
        .insert(items)

      if (errorInsertItems) throw errorInsertItems

      // Aplicar nuevo stock
      for (const item of ventaData.items) {
        await updateStockByDelta(item.producto_id, -parseFloat(item.cantidad || 0))
      }
    }

    // Reemplazar pagos
    const { error: errorDeletePagos } = await supabase
      .from('venta_pagos')
      .delete()
      .eq('venta_id', id)

    if (errorDeletePagos) throw errorDeletePagos

    if (metodosPagoArr.length > 0) {
      const pagosRows = metodosPagoArr.map(p => ({
        venta_id: id,
        metodo_pago: String(p.metodo_pago || '').trim(),
        monto_pagado: parseFloat(p.monto_pagado || 0) || 0,
        fecha_pago: p.fecha_pago || new Date().toISOString(),
        observaciones: p.observaciones || null
      }))

      const { error: errorPagos } = await supabase
        .from('venta_pagos')
        .insert(pagosRows)

      if (errorPagos) throw errorPagos
    }

    return { data: { id }, error: null }
  } catch (error) {
    console.error('Error al actualizar venta:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar una venta (soft delete) y restaurar stock
 */
export const deleteVenta = async (id) => {
  try {
    const { data: items, error: errorItems } = await supabase
      .from('venta_items')
      .select('producto_id, cantidad')
      .eq('venta_id', id)

    if (errorItems) throw errorItems

    const { error: errorUpdate } = await supabase
      .from('ventas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (errorUpdate) throw errorUpdate

    if (items && items.length > 0) {
      for (const item of items) {
        await updateStockByDelta(item.producto_id, parseFloat(item.cantidad || 0))
      }
    }

    return { data: { id }, error: null }
  } catch (error) {
    console.error('Error al eliminar venta:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una venta por ID con sus items
 */
export const getVentaById = async (id) => {
  try {
    const { data: venta, error: errorVenta } = await supabase
      .from('ventas')
      .select(`
        *,
        clientes:cliente_id(nombre, email),
        usuarios:usuario_id(nombre)
      `)
      .eq('id', id)
      .single()

    if (errorVenta) throw errorVenta

    const { data: items, error: errorItems } = await supabase
      .from('venta_items')
      .select(`
        *,
        productos:producto_id(id, nombre, codigo_barras)
      `)
      .eq('venta_id', id)

    if (errorItems) throw errorItems

    const { data: pagos, error: errorPagos } = await supabase
      .from('venta_pagos')
      .select('*')
      .eq('venta_id', id)
      .order('fecha_pago', { ascending: true })

    if (errorPagos) throw errorPagos

    return { 
      data: { ...venta, items: items || [], pagos: pagos || [] }, 
      error: null 
    }
  } catch (error) {
    console.error('Error al obtener venta:', error)
    return { data: null, error }
  }
}
