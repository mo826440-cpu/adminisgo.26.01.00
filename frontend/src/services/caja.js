// Servicio para gestión de caja
import { supabase } from './supabase'

/**
 * Abrir caja
 */
export const abrirCaja = async (importe, observaciones = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { data, error } = await supabase
      .from('historial_cajas')
      .insert([{
        usuario_id: user.id,
        tipo_operacion: 'apertura',
        importe: parseFloat(importe) || 0,
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
 * Calcula ingresos y egresos desde el último inicio de caja
 */
export const cerrarCaja = async (observaciones = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Obtener la última apertura de caja
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

    // Calcular ingresos desde la última apertura
    // Sumar todas las ventas rápidas desde la última apertura
    const fechaDesde = ultimaApertura?.fecha_hora || new Date(0).toISOString()
    
    const { data: ventasRapidas, error: errorVentas } = await supabase
      .from('ventas_rapidas')
      .select('total, monto_pagado')
      .gte('fecha_hora', fechaDesde)
      .eq('estado', 'PAGADO')

    if (errorVentas) throw errorVentas

    // Calcular total de ingresos
    const ingresos = (ventasRapidas || []).reduce((sum, v) => sum + parseFloat(v.monto_pagado || 0), 0)
    
    // El importe del cierre es: importe inicial + ingresos
    const importeInicial = parseFloat(ultimaApertura?.importe || 0)
    const importeCierre = importeInicial + ingresos

    // Registrar el cierre
    const { data, error } = await supabase
      .from('historial_cajas')
      .insert([{
        usuario_id: user.id,
        tipo_operacion: 'cierre',
        importe: importeCierre,
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
 * Obtener estado actual de la caja
 * Retorna la última apertura y el estado actual calculado
 */
export const obtenerEstadoCaja = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Obtener la última apertura
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

    // Si no hay apertura, retornar estado vacío
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

    // Verificar si hay un cierre después de esta apertura
    const { data: ultimoCierre, error: errorCierre } = await supabase
      .from('historial_cajas')
      .select('*')
      .eq('tipo_operacion', 'cierre')
      .gt('fecha_hora', ultimaApertura.fecha_hora)
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (errorCierre) throw errorCierre

    // Si hay un cierre después de la apertura, la caja está cerrada
    if (ultimoCierre) {
      return {
        data: {
          cajaAbierta: false,
          inicioCaja: null, // No mostrar inicio de caja cuando está cerrada
          estadoActual: null
        },
        error: null
      }
    }

    // Calcular estado actual (importe inicial + ingresos desde apertura)
    const fechaDesde = ultimaApertura.fecha_hora
    
    const { data: ventasRapidas, error: errorVentas } = await supabase
      .from('ventas_rapidas')
      .select('monto_pagado')
      .gte('fecha_hora', fechaDesde)
      .eq('estado', 'PAGADO')

    if (errorVentas) throw errorVentas

    const ingresos = (ventasRapidas || []).reduce((sum, v) => sum + parseFloat(v.monto_pagado || 0), 0)
    const importeInicial = parseFloat(ultimaApertura.importe || 0)
    const estadoActual = importeInicial + ingresos

    return {
      data: {
        cajaAbierta: true,
        inicioCaja: ultimaApertura,
        estadoActual: {
          importe: estadoActual,
          usuario: ultimaApertura.usuarios,
          fecha_hora: new Date().toISOString() // Fecha actual para el indicador
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
 * Actualizar registro del historial de cajas
 */
export const updateHistorialCaja = async (id, datos) => {
  try {
    const { data, error } = await supabase
      .from('historial_cajas')
      .update({
        importe: datos.importe,
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

