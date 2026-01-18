// Servicio para gestión de proveedores
import { supabase } from './supabase'

/**
 * Obtener todos los proveedores
 */
export const getProveedores = async () => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('activo', true)
      .order('nombre_razon_social', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener proveedores:', error)
    return { data: null, error }
  }
}

/**
 * Obtener un proveedor por ID
 */
export const getProveedor = async (id) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener proveedor:', error)
    return { data: null, error }
  }
}

/**
 * Verificar si existe un proveedor con el mismo email
 */
export const verificarEmailProveedor = async (email, proveedorIdExcluir = null) => {
  try {
    let query = supabase
      .from('proveedores')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.trim())
      .eq('activo', true)

    if (proveedorIdExcluir) {
      query = query.neq('id', proveedorIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar email del proveedor:', error)
    return { existe: false, error }
  }
}

/**
 * Verificar si existe un proveedor con el mismo CUIT/RUT
 */
export const verificarCuitProveedor = async (cuitRut, proveedorIdExcluir = null) => {
  try {
    if (!cuitRut || !cuitRut.trim()) {
      return { existe: false, error: null }
    }

    let query = supabase
      .from('proveedores')
      .select('id', { count: 'exact', head: true })
      .eq('cuit_rut', cuitRut.trim())
      .eq('activo', true)

    if (proveedorIdExcluir) {
      query = query.neq('id', proveedorIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar CUIT/RUT del proveedor:', error)
    return { existe: false, error }
  }
}

/**
 * Verificar si existe un proveedor con el mismo nombre (para advertencia)
 */
export const verificarNombreProveedor = async (nombre, proveedorIdExcluir = null) => {
  try {
    let query = supabase
      .from('proveedores')
      .select('id', { count: 'exact', head: true })
      .eq('nombre_razon_social', nombre.trim())
      .eq('activo', true)

    if (proveedorIdExcluir) {
      query = query.neq('id', proveedorIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar nombre del proveedor:', error)
    return { existe: false, error }
  }
}

/**
 * Crear un nuevo proveedor
 */
export const createProveedor = async (proveedor) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .insert([proveedor])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('proveedores_email_key')) {
          throw new Error('El email ya está en uso. Por favor, usa un email diferente.')
        }
        if (error.message.includes('proveedores_cuit_rut_key')) {
          throw new Error('El CUIT/RUT ya está registrado. Por favor, verifica los datos.')
        }
        throw new Error('Ya existe un proveedor con estos datos. Por favor, verifica los campos únicos.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para crear proveedores.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear proveedor:', error)
    if (error instanceof Error) {
      return { data: null, error }
    }
    return { data: null, error: new Error(error.message || 'Error al crear proveedor') }
  }
}

/**
 * Actualizar un proveedor
 */
export const updateProveedor = async (id, proveedor) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .update(proveedor)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('proveedores_email_key')) {
          throw new Error('El email ya está en uso. Por favor, usa un email diferente.')
        }
        if (error.message.includes('proveedores_cuit_rut_key')) {
          throw new Error('El CUIT/RUT ya está registrado. Por favor, verifica los datos.')
        }
        throw new Error('Ya existe un proveedor con estos datos. Por favor, verifica los campos únicos.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para actualizar proveedores.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar proveedor:', error)
    if (error instanceof Error) {
      return { data: null, error }
    }
    return { data: null, error: new Error(error.message || 'Error al actualizar proveedor') }
  }
}

/**
 * Eliminar un proveedor (soft delete)
 */
export const deleteProveedor = async (id) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .update({ activo: false, deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al eliminar proveedor:', error)
    return { data: null, error }
  }
}

