// Servicio para gestión de marcas
import { supabase } from './supabase'

/**
 * Obtener todas las marcas
 */
export const getMarcas = async () => {
  try {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener marcas:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una marca por ID
 */
export const getMarca = async (id) => {
  try {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener marca:', error)
    return { data: null, error }
  }
}

/**
 * Verificar si existe una marca con el mismo nombre
 */
export const verificarNombreMarca = async (nombre, marcaIdExcluir = null) => {
  try {
    let query = supabase
      .from('marcas')
      .select('id', { count: 'exact', head: true })
      .eq('nombre', nombre.trim())
      .eq('activo', true)

    if (marcaIdExcluir) {
      query = query.neq('id', marcaIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar nombre de marca:', error)
    return { existe: false, error }
  }
}

/**
 * Crear una nueva marca
 */
export const createMarca = async (marca) => {
  try {
    const { data, error } = await supabase
      .from('marcas')
      .insert([marca])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe una marca con este nombre. Por favor, usa un nombre diferente.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para crear marcas.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear marca:', error)
    if (error instanceof Error) {
      return { data: null, error }
    }
    return { data: null, error: new Error(error.message || 'Error al crear marca') }
  }
}

/**
 * Actualizar una marca
 */
export const updateMarca = async (id, marca) => {
  try {
    const { data, error } = await supabase
      .from('marcas')
      .update(marca)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe una marca con este nombre. Por favor, usa un nombre diferente.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para actualizar marcas.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar marca:', error)
    if (error instanceof Error) {
      return { data: null, error }
    }
    return { data: null, error: new Error(error.message || 'Error al actualizar marca') }
  }
}

/**
 * Eliminar una marca (soft delete)
 */
export const deleteMarca = async (id) => {
  try {
    const { data, error } = await supabase
      .from('marcas')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al eliminar marca:', error)
    return { data: null, error }
  }
}

