// Servicio para gestión de clientes
import { supabase } from './supabase'

/**
 * Obtener todos los clientes
 */
export const getClientes = async () => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    return { data: null, error }
  }
}

/**
 * Clientes creados en un rango de fechas (para gráfico) - por created_at
 */
export const getClientesPorRangoFechas = async (desde, hasta) => {
  try {
    const inicio = new Date(desde)
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(hasta)
    fin.setHours(23, 59, 59, 999)
    const { data, error } = await supabase
      .from('clientes')
      .select('id, created_at')
      .eq('activo', true)
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fin.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener clientes por rango:', error)
    return { data: null, error }
  }
}

/**
 * Obtener un cliente por ID
 */
export const getCliente = async (id) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return { data: null, error }
  }
}

/**
 * Verificar si existe un cliente con el mismo email
 */
export const verificarEmailCliente = async (email, clienteIdExcluir = null) => {
  try {
    let query = supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.trim())
      .eq('activo', true)

    if (clienteIdExcluir) {
      query = query.neq('id', clienteIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar email del cliente:', error)
    return { existe: false, error }
  }
}

/**
 * Verificar si existe un cliente con el mismo número de documento
 */
export const verificarNumeroDocumentoCliente = async (numeroDocumento, clienteIdExcluir = null) => {
  try {
    if (!numeroDocumento || !numeroDocumento.trim()) {
      return { existe: false, error: null }
    }

    let query = supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('numero_documento', numeroDocumento.trim())
      .eq('activo', true)

    if (clienteIdExcluir) {
      query = query.neq('id', clienteIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar número de documento del cliente:', error)
    return { existe: false, error }
  }
}

/**
 * Verificar si existe un cliente con el mismo nombre
 */
export const verificarNombreCliente = async (nombre, clienteIdExcluir = null) => {
  try {
    if (!nombre || !nombre.trim()) {
      return { existe: false, error: null }
    }

    let query = supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('nombre', nombre.trim())
      .eq('activo', true)

    if (clienteIdExcluir) {
      query = query.neq('id', clienteIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar nombre del cliente:', error)
    return { existe: false, error }
  }
}

/**
 * Crear un nuevo cliente
 */
export const createCliente = async (cliente) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([cliente])
      .select()
      .single()

    if (error) {
      // Traducir errores comunes de PostgreSQL a mensajes más amigables
      if (error.code === '23505') {
        // Violación de restricción única
        if (error.message.includes('email')) {
          throw new Error('El email ya está en uso. Por favor, usa un email diferente.')
        }
        throw new Error('Ya existe un cliente con estos datos. Por favor, verifica los campos únicos.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para crear clientes.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear cliente:', error)
    return { data: null, error: error instanceof Error ? error : new Error(error.message || 'Error al crear cliente') }
  }
}

/**
 * Actualizar un cliente
 */
export const updateCliente = async (id, cliente) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // Traducir errores comunes de PostgreSQL a mensajes más amigables
      if (error.code === '23505') {
        // Violación de restricción única
        if (error.message.includes('email')) {
          throw new Error('El email ya está en uso. Por favor, usa un email diferente.')
        }
        throw new Error('Ya existe un cliente con estos datos. Por favor, verifica los campos únicos.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para actualizar clientes.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    return { data: null, error: error instanceof Error ? error : new Error(error.message || 'Error al actualizar cliente') }
  }
}

/**
 * Eliminar un cliente (soft delete - actualizar activo a false)
 */
export const deleteCliente = async (id) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return { data: null, error }
  }
}

