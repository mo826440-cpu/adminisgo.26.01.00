// Servicio para gestión de productos
import { supabase } from './supabase'

/**
 * Obtener todos los productos
 */
export const getProductos = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias: categoria_id (id, nombre),
        marcas: marca_id (id, nombre)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return { data: null, error }
  }
}

/**
 * Obtener un producto por ID
 */
export const getProducto = async (id) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias: categoria_id (id, nombre),
        marcas: marca_id (id, nombre)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener producto:', error)
    return { data: null, error }
  }
}

/**
 * Verificar si existe un código de barras
 */
export const verificarCodigoBarras = async (codigoBarras, productoIdExcluir = null) => {
  try {
    let query = supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('codigo_barras', codigoBarras)
      .eq('activo', true)

    if (productoIdExcluir) {
      query = query.neq('id', productoIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar código de barras:', error)
    return { existe: false, error }
  }
}

/**
 * Verificar si existe un código interno
 */
export const verificarCodigoInterno = async (codigoInterno, productoIdExcluir = null) => {
  try {
    let query = supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('codigo_interno', codigoInterno)
      .eq('activo', true)

    if (productoIdExcluir) {
      query = query.neq('id', productoIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar código interno:', error)
    return { existe: false, error }
  }
}

/**
 * Verificar si existe un producto con el mismo nombre
 */
export const verificarNombreProducto = async (nombre, productoIdExcluir = null) => {
  try {
    let query = supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('nombre', nombre.trim())
      .eq('activo', true)

    if (productoIdExcluir) {
      query = query.neq('id', productoIdExcluir)
    }

    const { count, error } = await query

    if (error) throw error
    return { existe: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('Error al verificar nombre del producto:', error)
    return { existe: false, error }
  }
}

/**
 * Crear un nuevo producto
 */
export const createProducto = async (producto) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .insert([producto])
      .select()
      .single()

    if (error) {
      // Traducir errores comunes de PostgreSQL a mensajes más amigables
      if (error.code === '23505') {
        // Violación de restricción única
        if (error.message.includes('codigo_barras')) {
          throw new Error('El código de barras ya está en uso. Por favor, usa un código diferente.')
        }
        if (error.message.includes('codigo_interno')) {
          throw new Error('El código interno ya está en uso. Por favor, usa un código diferente.')
        }
        throw new Error('Ya existe un producto con estos datos. Por favor, verifica los campos únicos.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para crear productos.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al crear producto:', error)
    // Si el error ya es un Error con mensaje, retornarlo directamente
    if (error instanceof Error) {
      return { data: null, error }
    }
    // Si es un objeto de error de Supabase, convertir a Error
    return { data: null, error: error instanceof Error ? error : new Error(error.message || 'Error al crear producto') }
  }
}

/**
 * Actualizar un producto
 */
export const updateProducto = async (id, producto) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update(producto)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // Traducir errores comunes de PostgreSQL a mensajes más amigables
      if (error.code === '23505') {
        // Violación de restricción única
        if (error.message.includes('codigo_barras')) {
          throw new Error('El código de barras ya está en uso. Por favor, usa un código diferente.')
        }
        if (error.message.includes('codigo_interno')) {
          throw new Error('El código interno ya está en uso. Por favor, usa un código diferente.')
        }
        throw new Error('Ya existe un producto con estos datos. Por favor, verifica los campos únicos.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para actualizar productos.')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    // Si el error ya es un Error con mensaje, retornarlo directamente
    if (error instanceof Error) {
      return { data: null, error }
    }
    // Si es un objeto de error de Supabase, convertir a Error
    return { data: null, error: error instanceof Error ? error : new Error(error.message || 'Error al actualizar producto') }
  }
}

/**
 * Eliminar un producto (soft delete - actualizar activo a false)
 */
export const deleteProducto = async (id) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return { data: null, error }
  }
}

/**
 * Obtener categorías
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
 * Obtener marcas
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
