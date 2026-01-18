// Servicio para gestión de usuarios
import { supabase } from './supabase'

/**
 * Obtener información del usuario actual (de la tabla usuarios)
 */
export const getUsuario = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar información del usuario actual
 */
export const updateUsuario = async (datosUsuario) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(datosUsuario)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return { data: null, error }
  }
}

