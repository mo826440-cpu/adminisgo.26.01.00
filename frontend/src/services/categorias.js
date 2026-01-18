// Servicio para gestión de categorías
import { supabase } from './supabase'

/**
 * Obtener todas las categorías
 */
export const getCategorias = async () => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una categoría por ID
 */
export const getCategoria = async (id) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener categoría:', error)
    return { data: null, error }
  }
}

/**
 * Verificar si existe una categoría con el mismo nombre
 */
export const verificarNombreCategoria = async (nombre, categoriaIdExcluir = null) => {
  try {
    let query = supabase
      .from('categorias')
      .select('id', { count: 'exact', head: true })
      .eq('nombre', nombre.trim())
      .eq('activo', true)

    if (categoriaIdExcluir) {
      query = query.neq('id', categoriaIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar nombre de categoría:', error)
    return { existe: false, error }
  }
}

/**
 * Crear una nueva categoría
 */
export const createCategoria = async (categoria) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .insert([categoria])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe una categoría con este nombre. Por favor, usa un nombre diferente.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para crear categorías.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear categoría:', error)
    if (error instanceof Error) {
      return { data: null, error }
    }
    return { data: null, error: new Error(error.message || 'Error al crear categoría') }
  }
}

/**
 * Actualizar una categoría
 */
export const updateCategoria = async (id, categoria) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .update(categoria)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe una categoría con este nombre. Por favor, usa un nombre diferente.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para actualizar categorías.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar categoría:', error)
    if (error instanceof Error) {
      return { data: null, error }
    }
    return { data: null, error: new Error(error.message || 'Error al actualizar categoría') }
  }
}

/**
 * Eliminar una categoría (soft delete)
 */
export const deleteCategoria = async (id) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return { data: null, error }
  }
}

