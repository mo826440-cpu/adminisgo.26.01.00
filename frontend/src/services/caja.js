// Servicio para gestión de caja
import { supabase } from './supabase'

/** Método de pago → categoría de caja: efectivo | virtual | credito | otros */
const metodoPagoToCategoria = (metodo) => {
  const m = (metodo || '').toLowerCase()
  if (m === 'efectivo') return 'efectivo'
  if (['qr', 'transferencia', 'debito'].includes(m)) return 'virtual'
  if (m === 'credito') return 'credito'
  return 'otros'
}

/** Sumar ventas por categoría */
const sumarVentasPorCategoria = (ventas) => {
  const desglose = { efectivo: 0, virtual: 0, credito: 0, otros: 0 }
  ;(ventas || []).forEach((v) => {
    const cat = metodoPagoToCategoria(v.metodo_pago)
    desglose[cat] += parseFloat(v.monto_pagado || 0)
  })
  return desglose
}

/**
 * Abrir caja con desglose por método de pago.
 * @param {Object} desglose - { efectivo, virtual, credito, otros } (números; credito/otros opcionales, default 0)
 * @param {string} observaciones - opcional
 */
export const abrirCaja = async (desglose, observaciones = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const efectivo = parseFloat(desglose?.efectivo ?? desglose) || 0
    const virtual = parseFloat(desglose?.virtual) || 0
    const credito = parseFloat(desglose?.credito) || 0
    const otros = parseFloat(desglose?.otros) || 0
    // Compatibilidad: si se pasó un número solo (antiguo), usarlo como efectivo
    const importeTotal = typeof desglose === 'number' ? desglose : efectivo + virtual + credito + otros

    const { data, error } = await supabase
      .from('historial_cajas')
      .insert([{
        usuario_id: user.id,
        tipo_operacion: 'apertura',
        importe: importeTotal,
        importe_efectivo: efectivo,
        importe_virtual: virtual,
        importe_credito: credito,
        importe_otros: otros,
        observaciones: observaciones?.trim() || null
      }])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error al abrir caja:', error)
    return { data: null, error }
  }
}

/**
 * Cerrar caja
 * Calcula desglose por método desde la última apertura y registra cierre con importes por categoría.
 */
export const cerrarCaja = async (observaciones = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { data: ultimaApertura, error: errorApertura } = await supabase
      .from('historial_cajas')
      .select('*')
      .eq('tipo_operacion', 'apertura')
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .single()

    if (errorApertura && errorApertura.code !== 'PGRST116') {
      throw errorApertura
    }

    const fechaDesde = ultimaApertura?.fecha_hora || new Date(0).toISOString()
    const { data: ventasRapidas, error: errorVentas } = await supabase
      .from('ventas_rapidas')
      .select('monto_pagado, metodo_pago')
      .gte('fecha_hora', fechaDesde)
      .eq('estado', 'PAGADO')

    if (errorVentas) throw errorVentas

    const ventasPorCategoria = sumarVentasPorCategoria(ventasRapidas || [])
    const aperturaEfectivo = parseFloat(ultimaApertura?.importe_efectivo ?? ultimaApertura?.importe ?? 0)
    const aperturaVirtual = parseFloat(ultimaApertura?.importe_virtual ?? 0)
    const aperturaCredito = parseFloat(ultimaApertura?.importe_credito ?? 0)
    const aperturaOtros = parseFloat(ultimaApertura?.importe_otros ?? 0)

    const importeEfectivo = aperturaEfectivo + ventasPorCategoria.efectivo
    const importeVirtual = aperturaVirtual + ventasPorCategoria.virtual
    const importeCredito = aperturaCredito + ventasPorCategoria.credito
    const importeOtros = aperturaOtros + ventasPorCategoria.otros
    const importeCierre = importeEfectivo + importeVirtual + importeCredito + importeOtros

    const { data, error } = await supabase
      .from('historial_cajas')
      .insert([{
        usuario_id: user.id,
        tipo_operacion: 'cierre',
        importe: importeCierre,
        importe_efectivo: importeEfectivo,
        importe_virtual: importeVirtual,
        importe_credito: importeCredito,
        importe_otros: importeOtros,
        observaciones: observaciones?.trim() || null
      }])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error al cerrar caja:', error)
    return { data: null, error }
  }
}

/**
 * Obtener estado actual de la caja con desglose por método (efectivo, virtual, crédito, otros).
 */
export const obtenerEstadoCaja = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { data: ultimaApertura, error: errorApertura } = await supabase
      .from('historial_cajas')
      .select(`
        *,
        usuarios:usuario_id(id, nombre)
      `)
      .eq('tipo_operacion', 'apertura')
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (errorApertura) throw errorApertura

    if (!ultimaApertura) {
      return {
        data: {
          cajaAbierta: false,
          inicioCaja: null,
          estadoActual: null
        },
        error: null
      }
    }

    const { data: ultimoCierre, error: errorCierre } = await supabase
      .from('historial_cajas')
      .select('*')
      .eq('tipo_operacion', 'cierre')
      .gt('fecha_hora', ultimaApertura.fecha_hora)
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (errorCierre) throw errorCierre

    if (ultimoCierre) {
      return {
        data: {
          cajaAbierta: false,
          inicioCaja: null,
          estadoActual: null
        },
        error: null
      }
    }

    const fechaDesde = ultimaApertura.fecha_hora
    const { data: ventasRapidas, error: errorVentas } = await supabase
      .from('ventas_rapidas')
      .select('monto_pagado, metodo_pago')
      .gte('fecha_hora', fechaDesde)
      .eq('estado', 'PAGADO')

    if (errorVentas) throw errorVentas

    const ventasPorCategoria = sumarVentasPorCategoria(ventasRapidas || [])
    const aperturaEfectivo = parseFloat(ultimaApertura.importe_efectivo ?? ultimaApertura.importe ?? 0)
    const aperturaVirtual = parseFloat(ultimaApertura.importe_virtual ?? 0)
    const aperturaCredito = parseFloat(ultimaApertura.importe_credito ?? 0)
    const aperturaOtros = parseFloat(ultimaApertura.importe_otros ?? 0)

    const desgloseActual = {
      efectivo: aperturaEfectivo + ventasPorCategoria.efectivo,
      virtual: aperturaVirtual + ventasPorCategoria.virtual,
      credito: aperturaCredito + ventasPorCategoria.credito,
      otros: aperturaOtros + ventasPorCategoria.otros
    }
    const importeTotal = desgloseActual.efectivo + desgloseActual.virtual + desgloseActual.credito + desgloseActual.otros

    const desgloseInicio = {
      efectivo: aperturaEfectivo,
      virtual: aperturaVirtual,
      credito: aperturaCredito,
      otros: aperturaOtros
    }

    return {
      data: {
        cajaAbierta: true,
        inicioCaja: {
          ...ultimaApertura,
          desglose: desgloseInicio,
          importe: aperturaEfectivo + aperturaVirtual + aperturaCredito + aperturaOtros
        },
        estadoActual: {
          importe: importeTotal,
          desglose: desgloseActual,
          usuario: ultimaApertura.usuarios,
          fecha_hora: new Date().toISOString()
        }
      },
      error: null
    }
  } catch (error) {
    console.error('Error al obtener estado de caja:', error)
    return { data: null, error }
  }
}

/**
 * Obtener historial de cajas con filtros
 */
export const getHistorialCajas = async (fechaDesde = null, fechaHasta = null) => {
  try {
    let query = supabase
      .from('historial_cajas')
      .select(`
        *,
        usuarios:usuario_id(id, nombre)
      `)
      .order('fecha_hora', { ascending: false })

    if (fechaDesde) {
      query = query.gte('fecha_hora', fechaDesde)
    }

    if (fechaHasta) {
      // Agregar un día completo a fechaHasta para incluir todo el día
      const fechaHastaCompleta = new Date(fechaHasta)
      fechaHastaCompleta.setHours(23, 59, 59, 999)
      query = query.lte('fecha_hora', fechaHastaCompleta.toISOString())
    }

    const { data, error } = await query

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener historial de cajas:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar registro del historial de cajas
 */
export const deleteHistorialCaja = async (id) => {
  try {
    const { error } = await supabase
      .from('historial_cajas')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error al eliminar registro del historial:', error)
    return { error }
  }
}

/**
 * Actualizar registro del historial de cajas (total y/o desglose por método de pago)
 */
export const updateHistorialCaja = async (id, datos) => {
  try {
    const efectivo = parseFloat(datos.importe_efectivo ?? datos.importe) ?? 0
    const virtual = parseFloat(datos.importe_virtual) ?? 0
    const credito = parseFloat(datos.importe_credito) ?? 0
    const otros = parseFloat(datos.importe_otros) ?? 0
    const importeTotal = datos.importe != null ? parseFloat(datos.importe) : efectivo + virtual + credito + otros

    const { data, error } = await supabase
      .from('historial_cajas')
      .update({
        importe: importeTotal,
        importe_efectivo: efectivo,
        importe_virtual: virtual,
        importe_credito: credito,
        importe_otros: otros,
        observaciones: datos.observaciones?.trim() || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar registro del historial:', error)
    return { data: null, error }
  }
}

