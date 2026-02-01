// Servicio para gestión de compras
import { supabase } from './supabase'

/**
 * Crear una nueva orden de compra
 * Esta función crea la compra y los items asociados
 */
export const createCompra = async (compraData) => {
  try {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Generar número de orden único (formato: ORD-YYYYMMDD-HHMMSS-XXXX)
    // Usar la fecha_orden proporcionada para la fecha, y hora actual para el timestamp
    const fechaOrden = compraData.fecha_orden || new Date().toISOString().split('T')[0]
    const now = new Date()
    
    // Formatear fecha de orden (YYYYMMDD)
    const dateStr = fechaOrden.replace(/-/g, '')
    
    // Formatear hora actual (HHMMSS)
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const timeStr = `${hours}${minutes}${seconds}`
    
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const numeroOrden = `ORD-${dateStr}-${timeStr}-${random}`

    // Preparar datos de la compra
    const compra = {
      numero_orden: numeroOrden,
      proveedor_id: compraData.proveedor_id,
      usuario_id: user.id,
      fecha_orden: compraData.fecha_orden || new Date().toISOString().split('T')[0],
      fecha_recepcion: compraData.fecha_recepcion || null,
      subtotal: compraData.subtotal || 0,
      descuento: compraData.descuento || 0,
      impuestos: compraData.impuestos || 0,
      total: compraData.total || 0,
      estado: compraData.estado || 'pendiente',
      observaciones: compraData.observaciones || null,
      factura_url: compraData.factura_url || null
    }

    // Crear la compra
    const { data: compraCreada, error: errorCompra } = await supabase
      .from('compras')
      .insert([compra])
      .select()
      .single()

    if (errorCompra) {
      throw errorCompra
    }

    // Crear los items de la compra
    if (compraData.items && compraData.items.length > 0) {
      const items = compraData.items.map(item => ({
        compra_id: compraCreada.id,
        producto_id: item.producto_id,
        cantidad_solicitada: item.cantidad_solicitada || item.cantidad,
        cantidad_recibida: item.cantidad_recibida || null,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      }))

      const { error: errorItems } = await supabase
        .from('compra_items')
        .insert(items)

      if (errorItems) {
        // Si hay error al crear items, eliminar la compra creada
        await supabase.from('compras').delete().eq('id', compraCreada.id)
        throw errorItems
      }
    }

    // Crear pagos (compra_pagos) si se envían
    const metodosPagoArr = Array.isArray(compraData.pagos) ? compraData.pagos : []
    if (metodosPagoArr.length > 0) {
      const pagosRows = metodosPagoArr.map(p => ({
        compra_id: compraCreada.id,
        metodo_pago: String(p.metodo_pago || '').trim(),
        monto_pagado: parseFloat(p.monto_pagado || 0) || 0,
        fecha_pago: p.fecha_pago || new Date().toISOString(),
        observaciones: p.observaciones || null
      }))

      const { error: errorPagos } = await supabase
        .from('compra_pagos')
        .insert(pagosRows)

      if (errorPagos) {
        // Si hay error al crear pagos, eliminar la compra y items creados
        await supabase.from('compra_items').delete().eq('compra_id', compraCreada.id)
        await supabase.from('compras').delete().eq('id', compraCreada.id)
        throw errorPagos
      }
    }

    return { data: compraCreada, error: null }
  } catch (error) {
    console.error('Error al crear compra:', error)
    return { data: null, error }
  }
}

/**
 * Obtener todas las compras con sus datos completos
 */
export const getCompras = async () => {
  try {
    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        proveedores:proveedor_id(id, nombre_razon_social),
        usuarios:usuario_id(id, nombre),
        compra_items(producto_id, cantidad_solicitada, cantidad_recibida),
        compra_pagos(id, metodo_pago, monto_pagado, fecha_pago)
      `)
      .is('deleted_at', null)
      .order('fecha_orden', { ascending: false })

    if (error) throw error

    // Calcular unidades totales para cada compra
    const comprasConUnidades = (data || []).map(compra => {
      const unidades = (compra.compra_items || []).reduce((sum, item) => 
        sum + (parseFloat(item.cantidad_solicitada) || 0), 0)
      return {
        ...compra,
        unidades_totales: unidades
      }
    })

    return { data: comprasConUnidades, error: null }
  } catch (error) {
    console.error('Error al obtener compras:', error)
    return { data: null, error }
  }
}

/**
 * Compras en un rango de fechas (para gráfico) - con unidades por compra
 * desde/hasta: objetos Date (se usa fecha_orden)
 */
export const getComprasPorRangoFechas = async (desde, hasta) => {
  try {
    const inicio = new Date(desde)
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(hasta)
    fin.setHours(23, 59, 59, 999)
    const fechaDesdeStr = inicio.toISOString().slice(0, 10)
    const fechaHastaStr = fin.toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('compras')
      .select(`
        id,
        total,
        monto_pagado,
        fecha_orden,
        proveedor_id,
        estado,
        compra_items(producto_id, cantidad_solicitada),
        compra_pagos(metodo_pago)
      `)
      .is('deleted_at', null)
      .gte('fecha_orden', fechaDesdeStr)
      .lte('fecha_orden', fechaHastaStr)
      .order('fecha_orden', { ascending: true })

    if (error) throw error

    const comprasConUnidades = (data || []).map(compra => {
      const unidades = (compra.compra_items || []).reduce(
        (sum, item) => sum + (parseFloat(item.cantidad_solicitada) || 0),
        0
      )
      return { ...compra, unidades_totales: unidades }
    })

    return { data: comprasConUnidades, error: null }
  } catch (error) {
    console.error('Error al obtener compras por rango:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una compra por ID con sus items
 */
export const getCompraById = async (id) => {
  try {
    const { data: compra, error: errorCompra } = await supabase
      .from('compras')
      .select(`
        *,
        proveedores:proveedor_id(id, nombre_razon_social, email, telefono),
        usuarios:usuario_id(id, nombre),
        compra_pagos(id, metodo_pago, monto_pagado, fecha_pago, observaciones)
      `)
      .eq('id', id)
      .single()

    if (errorCompra) throw errorCompra

    const { data: items, error: errorItems } = await supabase
      .from('compra_items')
      .select(`
        *,
        productos:producto_id(id, nombre, codigo_barras, stock_actual)
      `)
      .eq('compra_id', id)

    if (errorItems) throw errorItems

    return { 
      data: { 
        ...compra, 
        items: items || [],
        pagos: compra.compra_pagos || []
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error al obtener compra:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar una compra
 */
export const updateCompra = async (id, compraData) => {
  try {
    const { data: compraActual, error: errorCompraActual } = await supabase
      .from('compras')
      .select('id, estado')
      .eq('id', id)
      .single()

    if (errorCompraActual || !compraActual) throw errorCompraActual || new Error('Compra no encontrada')

    const compraUpdate = {
      proveedor_id: compraData.proveedor_id,
      fecha_orden: compraData.fecha_orden,
      fecha_recepcion: compraData.fecha_recepcion || null,
      subtotal: compraData.subtotal || 0,
      descuento: compraData.descuento || 0,
      impuestos: compraData.impuestos || 0,
      total: compraData.total || 0,
      estado: compraData.estado || 'pendiente',
      observaciones: compraData.observaciones || null,
      factura_url: compraData.factura_url || null,
      updated_at: new Date().toISOString()
    }

    const { error: errorUpdate } = await supabase
      .from('compras')
      .update(compraUpdate)
      .eq('id', id)

    if (errorUpdate) throw errorUpdate

    // Reemplazar items si se envían
    if (compraData.items !== undefined) {
      const { error: errorDeleteItems } = await supabase
        .from('compra_items')
        .delete()
        .eq('compra_id', id)

      if (errorDeleteItems) throw errorDeleteItems

      if (compraData.items && compraData.items.length > 0) {
        const items = compraData.items.map(item => ({
          compra_id: id,
          producto_id: item.producto_id,
          cantidad_solicitada: item.cantidad_solicitada || item.cantidad,
          cantidad_recibida: item.cantidad_recibida || null,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        }))

        const { error: errorInsertItems } = await supabase
          .from('compra_items')
          .insert(items)

        if (errorInsertItems) throw errorInsertItems
      }
    }

    // Reemplazar pagos si se envían
    const metodosPagoArr = Array.isArray(compraData.pagos) ? compraData.pagos : []
    if (compraData.pagos !== undefined) {
      // Eliminar pagos existentes
      const { error: errorDeletePagos } = await supabase
        .from('compra_pagos')
        .delete()
        .eq('compra_id', id)

      if (errorDeletePagos) throw errorDeletePagos

      // Insertar nuevos pagos
      if (metodosPagoArr.length > 0) {
        const pagosRows = metodosPagoArr.map(p => ({
          compra_id: id,
          metodo_pago: String(p.metodo_pago || '').trim(),
          monto_pagado: parseFloat(p.monto_pagado || 0) || 0,
          fecha_pago: p.fecha_pago || new Date().toISOString(),
          observaciones: p.observaciones || null
        }))

        const { error: errorInsertPagos } = await supabase
          .from('compra_pagos')
          .insert(pagosRows)

        if (errorInsertPagos) throw errorInsertPagos
      }
    }

    return { data: { id }, error: null }
  } catch (error) {
    console.error('Error al actualizar compra:', error)
    return { data: null, error }
  }
}

/**
 * Recibir una compra (marcar como recibida y actualizar stock)
 */
export const recibirCompra = async (id, itemsRecibidos) => {
  try {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Obtener la compra actual
    const { data: compra, error: errorCompra } = await supabase
      .from('compras')
      .select('id, estado')
      .eq('id', id)
      .single()

    if (errorCompra || !compra) throw errorCompra || new Error('Compra no encontrada')

    if (compra.estado === 'recibida') {
      throw new Error('La compra ya fue recibida')
    }

    // Obtener items actuales
    const { data: itemsActuales, error: errorItems } = await supabase
      .from('compra_items')
      .select('id, producto_id, cantidad_solicitada')
      .eq('compra_id', id)

    if (errorItems) throw errorItems

    // Actualizar cantidad_recibida en items
    for (const itemRecibido of itemsRecibidos) {
      const { error: errorUpdateItem } = await supabase
        .from('compra_items')
        .update({ cantidad_recibida: itemRecibido.cantidad_recibida })
        .eq('id', itemRecibido.id)

      if (errorUpdateItem) throw errorUpdateItem

      // Actualizar stock del producto
      const { data: producto, error: errorProducto } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id', itemRecibido.producto_id)
        .single()

      if (errorProducto) {
        console.error('Error al obtener producto:', errorProducto)
        continue
      }

      const nuevoStock = (producto.stock_actual || 0) + parseFloat(itemRecibido.cantidad_recibida || 0)

      const { error: errorStock } = await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id', itemRecibido.producto_id)

      if (errorStock) {
        console.error('Error al actualizar stock:', errorStock)
        // No lanzar error aquí para no romper la transacción, solo loguear
      }
    }

    // Actualizar estado de la compra
    const { error: errorUpdateCompra } = await supabase
      .from('compras')
      .update({ 
        estado: 'recibida',
        fecha_recepcion: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)

    if (errorUpdateCompra) throw errorUpdateCompra

    return { data: { id }, error: null }
  } catch (error) {
    console.error('Error al recibir compra:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar una compra (soft delete)
 */
export const deleteCompra = async (id) => {
  try {
    const { error: errorUpdate } = await supabase
      .from('compras')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (errorUpdate) throw errorUpdate

    return { data: { id }, error: null }
  } catch (error) {
    console.error('Error al eliminar compra:', error)
    return { data: null, error }
  }
}

